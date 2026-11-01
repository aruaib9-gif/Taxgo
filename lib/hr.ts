"use client";

// Human resources: employees (with dated history), salaries, leave with working-day counts,
// attendance, shift rosters, performance reviews, onboarding checklists and HR settings.

import { createRecord, nextNumber, readCollection, seedCollection, updateRecord, type Rec } from "@/lib/store";
import { BRAND } from "@/lib/brand";

const n = (v: unknown) => Number(v ?? 0) || 0;
export const todayIso = () => new Date().toISOString().slice(0, 10);
export const ORG_UNITS = [{ id: "HEAD_OFFICE", name: "Head Office", typeName: "Head office" }];
// Head Office plus whatever Settings › Organization adds.
export const orgUnits = () => [...ORG_UNITS, ...readCollection("org-units").filter((u) => u.id !== "HEAD_OFFICE").map((u) => ({ id: u.id, name: String(u.name), typeName: String(u.level ?? "") }))];
export const orgUnitName = (id: unknown) => orgUnits().find((o) => o.id === id)?.name ?? "—";
export const fullName = (e?: Rec) => (e ? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() : "—");
export const EMPLOYMENT_TYPES = [{ value: "PERMANENT", label: "Permanent" }, { value: "CONTRACT", label: "Contract" }, { value: "PART_TIME", label: "Part-time" }, { value: "INTERN", label: "Intern" }, { value: "CONSULTANT", label: "Consultant" }];
export const EMP_STATUSES = [{ value: "ACTIVE", label: "Active" }, { value: "PROBATION", label: "Probation" }, { value: "ON_LEAVE", label: "On leave" }, { value: "RESIGNED", label: "Resigned" }, { value: "TERMINATED", label: "Terminated" }];
export const isCurrent = (e: Rec) => !["RESIGNED", "TERMINATED"].includes(String(e.status));

/* ---------- settings ---------- */

export type HrSettings = { weekendDays: number[]; hoursPerDay: number; locale: string; timezone: string; country: string; airTicket: { value: number; frequency: number; enabled: boolean } };
export const HR_DEFAULTS: HrSettings = { weekendDays: [0, 6], hoursPerDay: 8, locale: "", timezone: "", country: "GCC", airTicket: { value: 0, frequency: 12, enabled: true } };
export function hrSettings(): HrSettings {
  const row = readCollection("hr-settings")[0];
  return { ...HR_DEFAULTS, ...((row?.value as Partial<HrSettings>) ?? {}) };
}
export function saveHrSettings(v: Partial<HrSettings>) {
  const row = readCollection("hr-settings")[0];
  const value = { ...hrSettings(), ...v };
  if (row) updateRecord("hr-settings", row.id, { value }); else createRecord("hr-settings", { value });
}

/* ---------- employees ---------- */

// Fields whose changes are kept as effective-dated history, so the record can be viewed as of a date.
export const TRACKED = ["status", "designationId", "orgUnitId", "managerId", "categoryId"] as const;

export function createEmployee(data: Record<string, unknown>) {
  const e = createRecord("employees", { ...data, employeeNumber: data.employeeNumber || nextNumber("employees", "EMP") });
  createRecord("employee-events", { employeeId: e.id, kind: "JOINED", effectiveDate: data.dateOfJoining || todayIso(), detail: `Joined${data.designationId ? ` as ${designationName(data.designationId)}` : ""}` });
  for (const f of TRACKED) if (data[f]) createRecord("employee-changes", { employeeId: e.id, field: f, from: null, to: data[f], effectiveDate: data.dateOfJoining || todayIso() });
  return e;
}

export function updateEmployee(id: string, patch: Record<string, unknown>, effectiveDate = todayIso()) {
  const before = readCollection("employees").find((x) => x.id === id);
  if (!before) return;
  updateRecord("employees", id, patch);
  for (const f of TRACKED) {
    if (!(f in patch) || String(patch[f] ?? "") === String(before[f] ?? "")) continue;
    createRecord("employee-changes", { employeeId: id, field: f, from: before[f] ?? null, to: patch[f] ?? null, effectiveDate });
    if (f === "status" && ["RESIGNED", "TERMINATED"].includes(String(patch[f]))) {
      updateRecord("employees", id, { dateOfLeaving: before.dateOfLeaving || effectiveDate });
      createRecord("employee-events", { employeeId: id, kind: String(patch[f]), effectiveDate, detail: `${String(patch[f]).charAt(0)}${String(patch[f]).slice(1).toLowerCase()}` });
    }
    if (f === "designationId") createRecord("employee-events", { employeeId: id, kind: "DESIGNATION", effectiveDate, detail: `Designation → ${designationName(patch[f])}` });
  }
}

// Reconstructs status and placement on a date from the dated change log.
export function employeeAsOf(e: Rec, date: string) {
  const changes = readCollection("employee-changes").filter((c) => c.employeeId === e.id && String(c.effectiveDate) <= date).sort((a, b) => String(a.effectiveDate).localeCompare(String(b.effectiveDate)) || String(a.createdAt).localeCompare(String(b.createdAt)));
  const out: Record<string, unknown> = {};
  for (const f of TRACKED) out[f] = null;
  for (const c of changes) out[String(c.field)] = c.to;
  return { ...out, employed: String(e.dateOfJoining ?? "") <= date } as Record<string, unknown> & { employed: boolean };
}

export const designationName = (id: unknown) => String(readCollection("designations").find((d) => d.id === id)?.name ?? "—");

// The signed-in user's own employee record (matched by name or email).
export function meEmployee(list = readCollection("employees")) {
  return list.find((e) => fullName(e).toLowerCase() === BRAND.user.fullName.toLowerCase());
}
export function reportsOf(managerId: string, list = readCollection("employees")): Rec[] {
  const direct = list.filter((e) => e.managerId === managerId);
  return [...direct, ...direct.flatMap((d) => reportsOf(d.id, list))];
}

/* ---------- salary ---------- */

export const currentSalary = (employeeId: string, list = readCollection("salaries")) =>
  list.filter((s) => s.employeeId === employeeId && String(s.effectiveFrom) <= todayIso()).sort((a, b) => String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)) || String(b.createdAt).localeCompare(String(a.createdAt)))[0];

export function assignSalary(employeeId: string, s: { basic: number; structure?: string; effectiveFrom: string; notes?: string }) {
  createRecord("salaries", { employeeId, ...s });
  createRecord("employee-events", { employeeId, kind: "SALARY", effectiveDate: s.effectiveFrom, detail: `Basic salary ${s.basic}` });
}

export function finalizeMerit(cycleId: string) {
  const c = readCollection("merit-cycles").find((x) => x.id === cycleId)!;
  const lines = (c.lines as Rec[]) ?? [];
  for (const l of lines) assignSalary(String(l.employeeId), { basic: n(l.newBasic), effectiveFrom: String(c.effectiveDate), notes: `Merit cycle ${c.name}` });
  updateRecord("merit-cycles", cycleId, { status: "FINALIZED", finalizedAt: new Date().toISOString() });
  return lines.length;
}

/* ---------- leave ---------- */

export const DEFAULT_LEAVE_TYPES: Record<string, { name: string; code: string; days: number; paid: boolean }[]> = {
  GCC: [{ name: "Annual Leave", code: "AL", days: 30, paid: true }, { name: "Sick Leave", code: "SL", days: 15, paid: true }, { name: "Maternity Leave", code: "ML", days: 60, paid: true }, { name: "Hajj Leave", code: "HL", days: 30, paid: false }, { name: "Unpaid Leave", code: "UL", days: 0, paid: false }],
  UK: [{ name: "Annual Leave", code: "AL", days: 28, paid: true }, { name: "Statutory Sick Leave", code: "SSP", days: 0, paid: true }, { name: "Maternity Leave", code: "SMP", days: 273, paid: true }, { name: "Paternity Leave", code: "SPP", days: 14, paid: true }, { name: "Unpaid Leave", code: "UL", days: 0, paid: false }],
  INDIA: [{ name: "Earned Leave", code: "EL", days: 18, paid: true }, { name: "Casual Leave", code: "CL", days: 12, paid: true }, { name: "Sick Leave", code: "SL", days: 12, paid: true }, { name: "Maternity Leave", code: "ML", days: 182, paid: true }, { name: "Loss of Pay", code: "LOP", days: 0, paid: false }],
};
export const seedLeaveTypes = () => seedCollection("leave-types", DEFAULT_LEAVE_TYPES[hrSettings().country] ?? DEFAULT_LEAVE_TYPES.GCC);

export const holidaysBetween = (from: string, to: string) => new Set(readCollection("holiday-calendars").flatMap((c) => ((c.holidays as Rec[]) ?? []).map((h) => String(h.date))).filter((d) => d >= from && d <= to));

export function workingDays(from: string, to: string) {
  if (!from || !to || to < from) return 0;
  const weekend = new Set(hrSettings().weekendDays), hol = holidaysBetween(from, to);
  let days = 0;
  for (const d = new Date(`${from}T00:00:00`); d <= new Date(`${to}T00:00:00`); d.setDate(d.getDate() + 1)) {
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    if (!weekend.has(d.getDay()) && !hol.has(iso)) days++;
  }
  return days;
}

// Allocation per type for the year (the type's days, prorated from a mid-year joining date) and usage.
export function leaveBalances(employeeId: string, year = Number(todayIso().slice(0, 4))) {
  const e = readCollection("employees").find((x) => x.id === employeeId);
  const joined = String(e?.dateOfJoining ?? "");
  const factor = joined.startsWith(String(year)) ? (12 - Number(joined.slice(5, 7)) + 1) / 12 : joined && joined > `${year}-12-31` ? 0 : 1;
  const reqs = readCollection("leave-requests").filter((r) => r.employeeId === employeeId && String(r.fromDate).startsWith(String(year)));
  return readCollection("leave-types").filter((t) => n(t.days) > 0).map((t) => {
    const allocated = Math.round(n(t.days) * factor * 2) / 2;
    const used = reqs.filter((r) => r.leaveTypeId === t.id && r.status === "APPROVED").reduce((a, r) => a + n(r.days), 0);
    const pending = reqs.filter((r) => r.leaveTypeId === t.id && r.status === "PENDING").reduce((a, r) => a + n(r.days), 0);
    return { typeId: t.id, name: String(t.name), allocated, used, pending, balance: allocated - used };
  });
}

export function requestLeave(r: { employeeId: string; leaveTypeId: string; fromDate: string; toDate: string; reason?: string }) {
  if (r.toDate < r.fromDate) throw new Error("To date is before from date");
  const days = workingDays(r.fromDate, r.toDate);
  if (!days) throw new Error("Those dates are all weekend or public holiday");
  const clash = readCollection("leave-requests").find((x) => x.employeeId === r.employeeId && ["PENDING", "APPROVED"].includes(String(x.status)) && String(x.fromDate) <= r.toDate && String(x.toDate) >= r.fromDate);
  if (clash) throw new Error(`Overlaps an existing ${String(clash.status).toLowerCase()} request (${clash.fromDate} – ${clash.toDate})`);
  const bal = leaveBalances(r.employeeId).find((b) => b.typeId === r.leaveTypeId);
  if (bal && days > bal.balance - bal.pending) throw new Error(`Only ${bal.balance - bal.pending} day(s) of ${bal.name} left`);
  return createRecord("leave-requests", { ...r, days, status: "PENDING" });
}

/* ---------- attendance & shifts ---------- */

const hm = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + (m || 0); };
export const hoursBetween = (a?: string, b?: string, breakMin = 0) => (a && b ? Math.max(0, Math.round(((hm(b) - hm(a) + (hm(b) < hm(a) ? 1440 : 0) - breakMin) / 60) * 100) / 100) : null);

export function upsertAttendance(employeeId: string, date: string, patch: Record<string, unknown>) {
  const rec = readCollection("attendance").find((a) => a.employeeId === employeeId && a.date === date);
  const merged = { ...(rec ?? {}), ...patch } as Rec;
  if (!("hoursWorked" in patch) && (patch.checkIn !== undefined || patch.checkOut !== undefined)) merged.hoursWorked = hoursBetween(merged.checkIn as string, merged.checkOut as string);
  const data = { employeeId, date, status: merged.status || "PRESENT", checkIn: merged.checkIn ?? null, checkOut: merged.checkOut ?? null, hoursWorked: merged.hoursWorked ?? null, notes: merged.notes ?? null, source: merged.source };
  if (rec) updateRecord("attendance", rec.id, data); else createRecord("attendance", data);
}

export function markRosterAttended(assignmentId: string) {
  const a = readCollection("shift-assignments").find((x) => x.id === assignmentId)!;
  const t = readCollection("shift-templates").find((x) => x.id === a.templateId)!;
  upsertAttendance(String(a.employeeId), String(a.shiftDate), { status: "PRESENT", checkIn: t.startTime, checkOut: t.endTime, hoursWorked: hoursBetween(String(t.startTime), String(t.endTime), n(t.breakMinutes)), source: "ROSTER" });
}

/* ---------- performance ---------- */

export function openCycle(cycleId: string) {
  const reviews = readCollection("performance-reviews");
  let created = 0;
  for (const e of readCollection("employees").filter((x) => ["ACTIVE", "PROBATION", "ON_LEAVE"].includes(String(x.status)))) {
    if (reviews.some((r) => r.cycleId === cycleId && r.employeeId === e.id)) continue;
    createRecord("performance-reviews", { cycleId, employeeId: e.id, managerId: e.managerId, status: "SELF_REVIEW", feedback: [], goals: [] });
    created++;
  }
  updateRecord("performance-cycles", cycleId, { status: "open" });
  return created;
}

/* ---------- onboarding ---------- */

export const CHECKLISTS: Record<string, string[]> = {
  onboarding: ["Signed offer letter received", "ID & visa documents collected", "Email and system accounts created", "Equipment issued", "Orientation & policy walk-through", "Added to payroll", "Probation goals agreed"],
  offboarding: ["Resignation / termination letter filed", "Knowledge handover completed", "Equipment returned", "System access revoked", "Final settlement calculated", "Exit interview held", "Experience certificate issued"],
};
export function startLifecycle(employeeId: string, kind: "onboarding" | "offboarding", anchorDate: string) {
  return createRecord("onboarding", { employeeId, kind, anchorDate, status: "in_progress", tasks: CHECKLISTS[kind].map((title, i) => ({ id: crypto.randomUUID(), title, dueDate: anchorDate, order: i, done: false })) });
}

/* ---------- holidays ---------- */

// Fixed-date public holidays per region; GCC Islamic dates are approximate (they follow moon sighting).
const ISLAMIC: Record<number, [string, string][]> = {
  2026: [["03-20", "Eid al-Fitr"], ["03-21", "Eid al-Fitr holiday"], ["05-26", "Arafat Day"], ["05-27", "Eid al-Adha"], ["05-28", "Eid al-Adha holiday"], ["06-16", "Islamic New Year"], ["08-25", "Prophet's Birthday"]],
  2027: [["03-10", "Eid al-Fitr"], ["03-11", "Eid al-Fitr holiday"], ["05-16", "Arafat Day"], ["05-17", "Eid al-Adha"], ["05-18", "Eid al-Adha holiday"], ["06-06", "Islamic New Year"], ["08-15", "Prophet's Birthday"]],
};
export function holidaySet(country: string, year: number): { date: string; name: string }[] {
  const d = (md: string) => `${year}-${md}`;
  if (country === "UK") return [["01-01", "New Year's Day"], ["05-04", "Early May bank holiday"], ["05-25", "Spring bank holiday"], ["08-31", "Summer bank holiday"], ["12-25", "Christmas Day"], ["12-28", "Boxing Day (substitute)"]].map(([md, name]) => ({ date: d(md), name }));
  if (country === "INDIA") return [["01-26", "Republic Day"], ["08-15", "Independence Day"], ["10-02", "Gandhi Jayanti"], ["12-25", "Christmas"]].map(([md, name]) => ({ date: d(md), name }));
  return [["01-01", "New Year's Day"], ...(ISLAMIC[year] ?? []), ["12-01", "Commemoration Day"], ["12-02", "National Day"], ["12-03", "National Day holiday"]].map(([md, name]) => ({ date: d(md), name }));
}

export function defaultCalendar() {
  const cals = readCollection("holiday-calendars");
  const s = hrSettings();
  return cals.find((c) => c.isDefault) ?? createRecord("holiday-calendars", { name: `${s.country === "INDIA" ? "India" : s.country === "UK" ? "United Kingdom" : "GCC"} public holidays`, country: s.country, isDefault: true, holidays: [] });
}

export function importHolidays(year: number) {
  const cal = defaultCalendar();
  const have = new Set(((cal.holidays as Rec[]) ?? []).map((h) => String(h.date)));
  const add = holidaySet(hrSettings().country, year).filter((h) => !have.has(h.date)).map((h) => ({ id: crypto.randomUUID(), ...h }));
  updateRecord("holiday-calendars", cal.id, { holidays: [...((cal.holidays as Rec[]) ?? []), ...add].sort((a, b) => String(a.date).localeCompare(String(b.date))) });
  return add.length;
}

export function seedHrDefaults() {
  const types = readCollection("leave-types");
  const want = DEFAULT_LEAVE_TYPES[hrSettings().country] ?? DEFAULT_LEAVE_TYPES.GCC;
  let added = 0;
  for (const t of want) if (!types.some((x) => x.code === t.code)) { createRecord("leave-types", t); added++; }
  return added + importHolidays(Number(todayIso().slice(0, 4)));
}

/* ---------- CSV ---------- */

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; continue; }
    if (c === '"') q = true; else if (c === ",") { row.push(cell); cell = ""; } else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; } else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  if (!head) return [];
  const keys = head.map((h) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ""));
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}
