"use client";

// Projects: tasks (optionally grouped under milestones), weekly timesheets with submit/approve,
// and billing approved billable time to an AR invoice — per project (one line per person) or per
// completed milestone (one line per task). Invoices post like any credit sale (Dr 1200 / Cr 4010).

import { createRecord, nextNumber, readCollection, updateRecord, type Rec } from "@/lib/store";
import { createInvoice } from "@/lib/sales";
import { BRAND } from "@/lib/brand";

const n = (v: unknown) => Number(v ?? 0) || 0;
const r2 = (v: number) => Math.round(v * 100) / 100;
const todayIso = () => new Date().toISOString().slice(0, 10);
export const ME = "me";

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "IN_REVIEW", "DONE", "CANCELLED"];
export const BILLING_TYPES = [{ value: "TIME_AND_MATERIAL", label: "Time & material" }, { value: "FIXED", label: "Fixed price" }, { value: "RETAINER", label: "Retainer" }, { value: "NON_BILLABLE", label: "Non-billable" }];

export function logHistory(projectId: string, action: string, detail?: string) {
  createRecord("project-history", { projectId, action, detail, userName: BRAND.user.fullName });
}

export function createProject(p: Record<string, unknown> & { name: string }) {
  const c = readCollection("customers").find((x) => x.id === p.customerId);
  const rec = createRecord("projects", { ...p, customerName: c?.name, projectNumber: nextNumber("projects", "PRJ") });
  logHistory(rec.id, "Created", `${rec.projectNumber} · ${p.name}`);
  return rec;
}

export function updateProject(id: string, patch: Record<string, unknown>) {
  const before = readCollection("projects").find((x) => x.id === id);
  const c = readCollection("customers").find((x) => x.id === (patch.customerId ?? before?.customerId));
  updateRecord("projects", id, { ...patch, customerName: c?.name });
  const changed = Object.keys(patch).filter((k) => String(patch[k] ?? "") !== String(before?.[k] ?? ""));
  if (changed.length) logHistory(id, "Updated", changed.map((k) => (k === "status" ? `status ${before?.status} → ${patch.status}` : k)).join(", "));
}

// Hours on a task or project, from every timesheet entry except rejected ones.
const counted = (t: Rec) => t.status !== "REJECTED";
export const taskActualHours = (taskId: string, sheets = readCollection("timesheets")) => r2(sheets.filter((s) => s.taskId === taskId && counted(s)).reduce((a, s) => a + n(s.hours), 0));

export function projectTotals(p: Rec, sheets = readCollection("timesheets")) {
  const mine = sheets.filter((s) => s.projectId === p.id && counted(s));
  const totalHours = mine.reduce((a, s) => a + n(s.hours), 0);
  const totalBillableAmount = mine.filter((s) => s.isBillable).reduce((a, s) => a + n(s.hours) * n(s.hourlyRate || p.defaultHourlyRate), 0);
  return { totalHours: r2(totalHours), totalBillableAmount: r2(totalBillableAmount) };
}

export const unbilled = (sheets: Rec[]) => sheets.filter((s) => s.isBillable && s.status === "APPROVED" && !s.billedInvoiceId);
export const valueOf = (sheets: Rec[], rate: unknown) => r2(sheets.reduce((a, s) => a + n(s.hours) * n(s.hourlyRate || rate), 0));

/* ---------- timesheets ---------- */

export function logTime(e: { projectId: string; taskId: string; workDate: string; hours: number; isBillable: boolean }) {
  const p = readCollection("projects").find((x) => x.id === e.projectId);
  return createRecord("timesheets", { ...e, userId: ME, userName: BRAND.user.fullName, hourlyRate: n(p?.defaultHourlyRate) || undefined, status: "DRAFT" });
}

export function submitWeek(from: string, to: string) {
  const rows = readCollection("timesheets").filter((t) => t.userId === ME && String(t.workDate) >= from && String(t.workDate) <= to && (t.status === "DRAFT" || t.status === "REJECTED"));
  for (const r of rows) updateRecord("timesheets", r.id, { status: "SUBMITTED", submittedAt: new Date().toISOString() });
  return rows.length;
}

export function decideTimesheet(id: string, approve: boolean) {
  const t = readCollection("timesheets").find((x) => x.id === id)!;
  updateRecord("timesheets", id, { status: approve ? "APPROVED" : "REJECTED", decidedBy: BRAND.user.fullName, decidedAt: new Date().toISOString() });
  logHistory(String(t.projectId), approve ? "Timesheet approved" : "Timesheet rejected", `${t.userName} · ${t.workDate} · ${n(t.hours)}h`);
}

/* ---------- billing ---------- */

function invoice(p: Rec, lines: { description: string; qty: number; unitPrice: number }[], o: { dueDate?: string; taxRate?: number }, note: string) {
  const customer = readCollection("customers").find((c) => c.id === p.customerId);
  if (!customer) throw new Error("Link a customer to the project first");
  if (customer.freezeAccount) throw new Error("Customer account is frozen");
  return createInvoice({ customer: String(customer.name), date: todayIso(), dueDate: o.dueDate || todayIso(), paymentMode: "Credit", reference: String(p.projectNumber), notes: note, lines: lines.map((l) => ({ ...l, discPct: 0, taxPct: n(o.taxRate) })) });
}

// Time & material billing: approved, billable, unbilled entries in the period — one line per person.
export function billProject(projectId: string, o: { periodStart?: string; periodEnd?: string; dueDate?: string; taxRate?: number }) {
  const p = readCollection("projects").find((x) => x.id === projectId)!;
  const sheets = unbilled(readCollection("timesheets").filter((s) => s.projectId === projectId && (!o.periodStart || String(s.workDate) >= o.periodStart) && (!o.periodEnd || String(s.workDate) <= o.periodEnd)));
  if (!sheets.length) throw new Error("No approved billable time in that period");
  const byUser = new Map<string, { hours: number; rate: number }>();
  for (const s of sheets) { const k = `${s.userName}|${n(s.hourlyRate || p.defaultHourlyRate)}`; const g = byUser.get(k) ?? { hours: 0, rate: n(s.hourlyRate || p.defaultHourlyRate) }; g.hours += n(s.hours); byUser.set(k, g); }
  const inv = invoice(p, [...byUser].map(([k, g]) => ({ description: `${p.name} — ${k.split("|")[0]} (${r2(g.hours)}h)`, qty: r2(g.hours), unitPrice: g.rate })), o, `Project ${p.projectNumber} time`);
  for (const s of sheets) updateRecord("timesheets", s.id, { status: "BILLED", billedInvoiceId: inv.id });
  logHistory(projectId, "Invoiced", `${inv.number} · ${sheets.length} timesheets`);
  return { invoice: inv, timesheetsBilled: sheets.length };
}

// Milestone billing: the milestone's approved time, one line per task; the milestone is then locked.
export function billMilestone(projectId: string, milestoneId: string, o: { dueDate?: string; taxRate?: number }) {
  const p = readCollection("projects").find((x) => x.id === projectId)!;
  const m = readCollection("milestones").find((x) => x.id === milestoneId)!;
  const tasks = readCollection("project-tasks").filter((t) => t.milestoneId === milestoneId);
  const sheets = unbilled(readCollection("timesheets").filter((s) => tasks.some((t) => t.id === s.taskId)));
  if (!sheets.length) throw new Error("Nothing to invoice");
  const lines = tasks.map((t) => { const ts = sheets.filter((s) => s.taskId === t.id); const hrs = ts.reduce((a, s) => a + n(s.hours), 0); return hrs ? { description: `${m.name} — ${t.title}`, qty: r2(hrs), unitPrice: hrs ? r2(valueOf(ts, p.defaultHourlyRate) / hrs) : 0 } : null; }).filter(Boolean) as { description: string; qty: number; unitPrice: number }[];
  const inv = invoice(p, lines, o, `Project ${p.projectNumber} · milestone ${m.name}`);
  for (const s of sheets) updateRecord("timesheets", s.id, { status: "BILLED", billedInvoiceId: inv.id });
  updateRecord("milestones", milestoneId, { invoiceId: inv.id, invoiceNumber: inv.number });
  logHistory(projectId, "Milestone invoiced", `${m.name} · ${inv.number}`);
  return { invoice: inv, timesheetsBilled: sheets.length };
}

export function milestoneBlocker(m: Rec, tasks: Rec[], sheets: Rec[], hasCustomer: boolean, rate: unknown) {
  const ids = new Set(tasks.filter((t) => t.milestoneId === m.id).map((t) => t.id));
  const pending = sheets.filter((s) => ids.has(String(s.taskId)) && ["DRAFT", "SUBMITTED", "REJECTED"].includes(String(s.status))).length;
  const open = unbilled(sheets.filter((s) => ids.has(String(s.taskId))));
  const hours = open.reduce((a, s) => a + n(s.hours), 0);
  const blocker = m.status !== "COMPLETED" ? "Mark it Completed to invoice" : !hasCustomer ? "Link a customer first" : pending > 0 ? `${pending} timesheet${pending === 1 ? "" : "s"} not approved yet` : hours <= 0 ? "Nothing to invoice" : null;
  return { hours: r2(hours), amount: valueOf(open, rate), taskCount: ids.size, blocker };
}
