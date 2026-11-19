"use client";

// HR time & talent pages: leave, attendance (with import), shift roster, timesheet approvals,
// recruitment, onboarding, performance, policies, holiday calendars and HR settings.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, CalendarCheck, CalendarDays, Check, CheckCircle2, Clock, Download, LogIn, LogOut, Plane, Plus, Sparkles, Target, Trash2, Upload, X } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { CHECKLISTS, HR_DEFAULTS, fullName, holidaysBetween, hrSettings, importHolidays, markRosterAttended, meEmployee, openCycle, parseCsv, reportsOf, requestLeave, saveHrSettings, seedHrDefaults, seedLeaveTypes, startLifecycle, todayIso, upsertAttendance, workingDays, type HrSettings } from "@/lib/hr";
import { decideTimesheet } from "@/lib/projects";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Card, CardTitle, Dialog, Field, Label, PageHeader, RowMenu, SidePanel, btn, downloadFile, inputCls, money, num, textareaCls } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { StatusBadge } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";
import { Empty, Pill, Th, fmtDate, useFlash } from "@/components/hr/people";

const Tabs = ({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: string[][] }) => (
  <div role="tablist" className="inline-flex flex-wrap rounded-lg bg-muted p-1 text-sm">{items.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", value === v && "bg-background text-foreground shadow")}>{l}</button>)}</div>
);
const empOptions = (emps: Rec[]) => emps.filter((e) => !["RESIGNED", "TERMINATED"].includes(String(e.status))).map((e) => ({ value: e.id, label: `${fullName(e)} (${e.employeeNumber})` }));
const nowHm = () => new Date().toTimeString().slice(0, 5);

/* ---------- leave ---------- */

export function Leave() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/hr/leave");
  const reqs = useCollection("leave-requests");
  const emps = useCollection("employees");
  const types = useCollection("leave-types");
  const [status, setStatus] = useState("ALL");
  const { node, flash } = useFlash();
  const rows = [...reqs].filter((r) => status === "ALL" || r.status === status).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const act = (r: Rec, s: string) => { updateRecord("leave-requests", r.id, { status: s, decidedBy: BRAND.user.fullName, decidedAt: new Date().toISOString() }); flash(s.charAt(0) + s.slice(1).toLowerCase()); };
  return (
    <div className="space-y-4">
      <PageHeader title="Leave Management" subtitle="Leave requests, approvals and balances" actions={<Link href="/hr/leave/new" className={btn.primary}><Plus /> New leave request</Link>} />
      <Card><div className="space-y-3 p-5">
        <Tabs value={status} onChange={setStatus} items={[["ALL", "All"], ["PENDING", "Pending"], ["APPROVED", "Approved"], ["REJECTED", "Rejected"], ["CANCELLED", "Cancelled"]]} />
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Type</Th><Th>From</Th><Th>To</Th><Th>Days</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No leave requests</td></tr> : rows.map((r) => { const e = emps.find((x) => x.id === r.employeeId); return (
            <tr key={r.id} className="border-b border-border">
              <td className="px-2 py-2"><div className="font-medium">{fullName(e)}</div><div className="text-xs text-muted-foreground">{String(e?.employeeNumber ?? "")}</div></td><td className="px-2 py-2">{String(types.find((t) => t.id === r.leaveTypeId)?.name ?? "—")}</td><td className="px-2 py-2">{fmtDate(r.fromDate)}</td><td className="px-2 py-2">{fmtDate(r.toDate)}</td><td className="px-2 py-2">{num(r.days)}</td><td className="px-2 py-2"><StatusBadge status={r.status} /></td>
              <td className="px-2 py-2"><div className="flex justify-end gap-1">
                {r.status === "PENDING" && <><button type="button" aria-label="Approve leave request" title="Approve" className={cn(btn.icon, "text-success")} onClick={() => act(r, "APPROVED")}><Check /></button><button type="button" aria-label="Reject leave request" title="Reject" className={cn(btn.icon, "text-destructive")} onClick={() => act(r, "REJECTED")}><X /></button></>}
                {r.status === "APPROVED" && <button type="button" className={cn(btn.ghost, "h-7 px-2 text-xs")} onClick={() => act(r, "CANCELLED")}>Cancel</button>}
              </div></td>
            </tr>
          ); })}</tbody></table>
      </div></Card>
      {sub === "new" && <SidePanel onClose={() => router.push("/hr/leave")}><LeaveForm onDone={() => router.push("/hr/leave")} /></SidePanel>}
      {node}
    </div>
  );
}

function LeaveForm({ onDone }: { onDone: () => void }) {
  const emps = useCollection("employees");
  const types = useCollection("leave-types");
  useCollection("holiday-calendars");
  const [f, setF] = useState({ employeeId: "", leaveTypeId: "", fromDate: todayIso(), toDate: todayIso(), reason: "" });
  const [error, setError] = useState("");
  useEffect(() => { seedLeaveTypes(); }, []);
  const days = f.fromDate && f.toDate && f.toDate >= f.fromDate ? workingDays(f.fromDate, f.toDate) : null;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    try { requestLeave({ ...f, reason: f.reason || undefined }); onDone(); } catch (err) { setError((err as Error).message); }
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New Leave Request</h1><p className="text-sm text-muted-foreground">Submit a leave request</p></div>
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle>Leave Request Details</CardTitle>
        <div className="space-y-2"><Label>Employee *</Label><Select value={f.employeeId} onChange={(v) => setF({ ...f, employeeId: v })} placeholder="Choose employee" options={empOptions(emps)} ariaLabel="Employee" /></div>
        <div className="space-y-2"><Label>Leave type *</Label><Select value={f.leaveTypeId} onChange={(v) => setF({ ...f, leaveTypeId: v })} placeholder="Choose type" options={types.map((t) => ({ value: t.id, label: String(t.name) }))} ariaLabel="Leave type" /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>From *</Label><DateInput value={f.fromDate} onChange={(v) => setF({ ...f, fromDate: v })} /></div><div className="space-y-2"><Label>To *</Label><DateInput value={f.toDate} onChange={(v) => setF({ ...f, toDate: v })} /></div></div>
        {days !== null && <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{days} working day{days === 1 ? "" : "s"}</span> will be deducted (weekends &amp; public holidays excluded).</p>}
        <Field label="Reason" htmlFor="lv-reason"><textarea id="lv-reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} className={textareaCls} /></Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="submit" className={btn.primary} disabled={!f.employeeId || !f.leaveTypeId}>Submit</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </div></Card>
    </form>
  );
}

/* ---------- attendance ---------- */

const ATT = [{ value: "PRESENT", label: "Present" }, { value: "ABSENT", label: "Absent" }, { value: "HALF_DAY", label: "Half day" }, { value: "ON_LEAVE", label: "On leave" }, { value: "HOLIDAY", label: "Holiday" }, { value: "WEEKEND", label: "Weekend" }];

export function Attendance() {
  const sub = subOf(usePathname(), "/hr/attendance");
  const emps = useCollection("employees");
  const records = useCollection("attendance");
  const leaves = useCollection("leave-requests");
  useCollection("holiday-calendars");
  const [date, setDate] = useState(todayIso());
  const [edit, setEdit] = useState<string | null>(null);
  const [val, setVal] = useState("");
  const { node, flash } = useFlash();
  if (sub === "import") return <AttendanceImport />;
  const people = emps.filter((e) => !["RESIGNED", "TERMINATED"].includes(String(e.status)) && String(e.dateOfJoining ?? "") <= date);
  const weekend = hrSettings().weekendDays.includes(new Date(`${date}T00:00:00`).getDay());
  const holiday = holidaysBetween(date, date).size > 0;
  // Without a record, a day shows approved leave, a holiday or the weekend automatically.
  const statusOf = (e: Rec, r?: Rec) => r?.status ?? (leaves.some((l) => l.employeeId === e.id && l.status === "APPROVED" && String(l.fromDate) <= date && String(l.toDate) >= date) ? "ON_LEAVE" : holiday ? "HOLIDAY" : weekend ? "WEEKEND" : null);
  const rows = people.map((e) => ({ e, r: records.find((a) => a.employeeId === e.id && a.date === date) }));
  const count = (s: string | null) => rows.filter(({ e, r }) => statusOf(e, r) === s).length;
  const save = (e: Rec, patch: Record<string, unknown>) => { upsertAttendance(e.id, date, patch); flash("Saved"); };
  const cell = (key: string, value: string, type: string, onSave: (v: string) => void) => edit === key
    ? <input autoFocus type={type} value={val} onChange={(ev) => setVal(ev.target.value)} onBlur={() => { setEdit(null); if (val !== value) onSave(val); }} onKeyDown={(ev) => { if (ev.key === "Enter") ev.currentTarget.blur(); if (ev.key === "Escape") setEdit(null); }} className={cn(inputCls, "h-7 w-24 px-1")} />
    : <button type="button" onClick={() => { setEdit(key); setVal(value); }} className={cn("min-w-14 rounded px-1 text-left hover:bg-accent", !value && "text-muted-foreground")}>{value || "—"}</button>;
  function template() {
    if (!people.length) return flash("No employees to include in the template", true);
    downloadFile(`attendance-${date}.csv`, ["Employee Number,Name,Date,Status,Check In,Check Out,Hours,Notes", ...people.map((e) => `${e.employeeNumber},"${fullName(e)}",${date},PRESENT,09:00,17:00,,`)].join("\n"), "text/csv");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Attendance" subtitle="Daily check-in / check-out and status per employee" actions={<><button type="button" className={btn.outline} onClick={template}><Download /> Template</button><Link href="/hr/attendance/import" className={btn.primary}><Upload /> Import</Link></>} />
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2"><CalendarCheck className="size-4 text-muted-foreground" /><DateInput value={date} onChange={setDate} className="w-44" />{(weekend || holiday) && <Pill>{holiday ? "Public holiday" : "Weekend"}</Pill>}</div>
          <div className="flex gap-4 text-sm"><span>Present: <span className="font-semibold">{count("PRESENT")}</span></span><span>Absent: <span className="font-semibold">{count("ABSENT")}</span></span><span>On leave: <span className="font-semibold">{count("ON_LEAVE")}</span></span><span>Unmarked: <span className="font-semibold">{count(null)}</span></span></div>
        </div>
        <p className="text-xs text-muted-foreground">Click the status, check-in, check-out or hours to edit inline · In/Out stamp the current time</p>
        {people.length === 0 ? <Empty icon={CalendarCheck} title="No employees" text="Add employees to start tracking attendance." /> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee #</Th><Th>Name</Th><Th>Status</Th><Th>Check-in</Th><Th>Check-out</Th><Th>Hours</Th><Th className="text-right">Actions</Th></tr></thead>
            <tbody>{rows.map(({ e, r }) => { const st = statusOf(e, r); return (
              <tr key={e.id} className="border-b border-border">
                <td className="px-2 py-1.5 font-mono text-xs">{String(e.employeeNumber)}</td><td className="px-2 py-1.5 font-medium">{fullName(e)}</td>
                <td className="px-2 py-1.5"><Select ariaLabel={`Status of ${fullName(e)}`} value={String(st ?? "")} onChange={(v) => save(e, { status: v })} placeholder="— Not marked —" options={ATT} className="min-w-36" triggerClassName={cn("h-7 border-transparent px-1.5 shadow-none hover:bg-accent", !r && st && "italic")} /></td>
                <td className="px-2 py-1.5">{cell(`${e.id}-in`, String(r?.checkIn ?? ""), "time", (v) => save(e, { checkIn: v || null }))}</td>
                <td className="px-2 py-1.5">{cell(`${e.id}-out`, String(r?.checkOut ?? ""), "time", (v) => save(e, { checkOut: v || null }))}</td>
                <td className="px-2 py-1.5">{cell(`${e.id}-h`, r?.hoursWorked != null ? String(r.hoursWorked) : "", "number", (v) => save(e, { hoursWorked: v === "" ? null : num(v) }))}</td>
                <td className="px-2 py-1.5"><div className="flex justify-end gap-1"><button type="button" className={btn.smOutline} disabled={!!r?.checkIn} onClick={() => save(e, { checkIn: nowHm(), status: "PRESENT" })}><LogIn /> In</button><button type="button" className={btn.smOutline} disabled={!r?.checkIn || !!r?.checkOut} onClick={() => save(e, { checkOut: nowHm() })}><LogOut /> Out</button></div></td>
              </tr>
            ); })}</tbody></table>
        )}
      </div></Card>
      {node}
    </div>
  );
}

function AttendanceImport() {
  const router = useRouter();
  const [rows, setRows] = useState<{ d: Record<string, string>; result?: string }[]>([]);
  const [error, setError] = useState("");
  async function load(file: File) {
    if (!/\.csv$/i.test(file.name)) return setError("Use a .csv file (save Excel sheets as CSV).");
    const parsed = parseCsv(await file.text());
    if (!parsed.length) return setError("No rows found");
    if (!(("employeenumber" in parsed[0] || "email" in parsed[0]) && "date" in parsed[0])) return setError("Make sure the file has Employee Number (or Email) and Date columns.");
    setError(""); setRows(parsed.map((d) => ({ d })));
  }
  function run() {
    const emps = readCollection("employees");
    setRows(rows.map(({ d }) => {
      const e = emps.find((x) => (d.employeenumber && x.employeeNumber === d.employeenumber) || (d.email && String(x.email ?? "").toLowerCase() === d.email.toLowerCase()));
      if (!e) return { d, result: "Employee not found" };
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d.date)) return { d, result: "Date must be YYYY-MM-DD" };
      const st = ATT.find((a) => [a.value, a.label.toUpperCase()].includes((d.status || "PRESENT").toUpperCase()));
      upsertAttendance(e.id, d.date, { status: st?.value ?? "PRESENT", checkIn: d.checkin || null, checkOut: d.checkout || null, ...(d.hours ? { hoursWorked: num(d.hours) } : {}), notes: d.notes || null, source: "IMPORT" });
      return { d, result: "Recorded" };
    }));
  }
  const done = rows.some((r) => r.result);
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => router.push("/hr/attendance")} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back</button>
      <PageHeader title="Import Attendance" subtitle="Upload a CSV file to record attendance for many employees at once." />
      <Card><div className="space-y-2 p-5"><div className="font-medium">1. Choose a file</div><p className="text-sm text-muted-foreground">Required: <strong>Employee Number</strong> (or Email) and <strong>Date</strong> (YYYY-MM-DD). Optional: Status, Check In, Check Out (HH:MM), Hours, Notes. Download a pre-filled template from the Attendance page.</p><input type="file" accept=".csv" aria-label="CSV file" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} className="text-sm" />{error && <p className="text-sm text-destructive">{error}</p>}</div></Card>
      {rows.length > 0 && <Card><div className="space-y-3 p-5"><div className="font-medium">{done ? "3. Result" : `2. Review ${rows.length} row(s)`}</div>
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Date</Th><Th>Status</Th><Th>In</Th><Th>Out</Th><Th>Hours</Th><Th>Notes</Th><Th>Result</Th></tr></thead><tbody>{rows.map(({ d, result }, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-1.5">{d.employeenumber || d.email || "missing"}</td><td className="px-2 py-1.5">{d.date || "missing"}</td><td className="px-2 py-1.5">{d.status || "PRESENT"}</td><td className="px-2 py-1.5">{d.checkin}</td><td className="px-2 py-1.5">{d.checkout}</td><td className="px-2 py-1.5">{d.hours}</td><td className="px-2 py-1.5">{d.notes}</td><td className={cn("px-2 py-1.5", result && result !== "Recorded" && "text-destructive")}>{result ?? "—"}</td></tr>)}</tbody></table>
        {done ? <Link href="/hr/attendance" className={btn.primary}>Done — view attendance</Link> : <button type="button" className={btn.primary} onClick={run}>Import {rows.length} row(s)</button>}
      </div></Card>}
    </div>
  );
}

/* ---------- shifts ---------- */

export function Shifts() {
  const templates = useCollection("shift-templates");
  const assignments = useCollection("shift-assignments");
  const emps = useCollection("employees");
  const attendance = useCollection("attendance");
  const [date, setDate] = useState(todayIso());
  const [t, setT] = useState({ name: "", startTime: "09:00", endTime: "17:30", breakMinutes: "30" });
  const [a, setA] = useState({ employeeId: "", templateId: "" });
  const { node, flash } = useFlash();
  const day = assignments.filter((x) => x.shiftDate === date);
  const att = (x: Rec) => attendance.find((r) => r.employeeId === x.employeeId && r.date === date);
  const hm = (s: unknown) => String(s ?? "").slice(0, 5);
  return (
    <div className="space-y-4">
      <PageHeader title="Shift Planning" subtitle="Shift templates and a daily roster. Marking a rostered shift as attended creates the attendance record from the template hours." />
      <Card><div className="space-y-3 p-5"><CardTitle className="flex items-center gap-2 text-base"><Clock className="size-4" /> Shift templates</CardTitle>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-40 space-y-1"><Label className="text-xs" htmlFor="sh-name">Name</Label><input id="sh-name" placeholder="Morning" value={t.name} onChange={(e) => setT({ ...t, name: e.target.value })} className={inputCls} /></div>
          <div className="w-28 space-y-1"><Label className="text-xs" htmlFor="sh-start">Start</Label><input id="sh-start" type="time" value={t.startTime} onChange={(e) => setT({ ...t, startTime: e.target.value })} className={inputCls} /></div>
          <div className="w-28 space-y-1"><Label className="text-xs" htmlFor="sh-end">End</Label><input id="sh-end" type="time" value={t.endTime} onChange={(e) => setT({ ...t, endTime: e.target.value })} className={inputCls} /></div>
          <div className="w-24 space-y-1"><Label className="text-xs" htmlFor="sh-break">Break (min)</Label><input id="sh-break" type="number" min="0" value={t.breakMinutes} onChange={(e) => setT({ ...t, breakMinutes: e.target.value })} className={inputCls} /></div>
          <button type="button" className={btn.smPrimary} disabled={!t.name.trim()} onClick={() => { createRecord("shift-templates", { ...t, name: t.name.trim(), breakMinutes: parseInt(t.breakMinutes) || 0 }); setT({ name: "", startTime: "09:00", endTime: "17:30", breakMinutes: "30" }); flash("Shift template created"); }}><Plus /> Add</button>
        </div>
        {templates.length > 0 && <div className="flex flex-wrap gap-2">{templates.map((s) => <Pill key={s.id} className="bg-muted">{String(s.name)} {hm(s.startTime)}–{hm(s.endTime)}{num(s.breakMinutes) > 0 ? ` (−${num(s.breakMinutes)}m)` : ""}<button type="button" aria-label={`Remove ${s.name}`} className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => (assignments.some((x) => x.templateId === s.id) ? flash("Template is on the roster", true) : deleteRecord("shift-templates", s.id))}><X className="size-3" /></button></Pill>)}</div>}
      </div></Card>
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">Roster <span className="ml-2 text-xs font-normal text-muted-foreground">{day.length} rostered · {day.filter(att).length} attended · {day.filter((x) => !att(x)).length} unmarked</span></CardTitle><DateInput value={date} onChange={setDate} className="w-44" /></div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-56 space-y-1"><Label className="text-xs">Employee</Label><Select value={a.employeeId} onChange={(v) => setA({ ...a, employeeId: v })} placeholder="Select…" options={empOptions(emps)} ariaLabel="Employee" /></div>
          <div className="w-56 space-y-1"><Label className="text-xs">Shift</Label><Select value={a.templateId} onChange={(v) => setA({ ...a, templateId: v })} placeholder="Select…" options={templates.map((s) => ({ value: s.id, label: `${s.name} ${hm(s.startTime)}–${hm(s.endTime)}` }))} ariaLabel="Shift" /></div>
          <button type="button" className={btn.smPrimary} disabled={!a.employeeId || !a.templateId} onClick={() => { if (day.some((x) => x.employeeId === a.employeeId)) return flash("Already rostered on this day", true); createRecord("shift-assignments", { ...a, shiftDate: date }); setA({ employeeId: "", templateId: "" }); flash("Shift assigned"); }}>Assign</button>
        </div>
        {day.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No shifts rostered for this day.</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Shift</Th><Th>Attendance</Th><Th /></tr></thead><tbody>{day.map((x) => { const s = templates.find((y) => y.id === x.templateId); const r = att(x); return (
            <tr key={x.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{fullName(emps.find((e) => e.id === x.employeeId))}</td><td className="px-2 py-2">{String(s?.name ?? "—")} <span className="text-muted-foreground">{hm(s?.startTime)}–{hm(s?.endTime)}</span></td><td className="px-2 py-2">{r ? <Pill className="bg-muted">{String(r.status)}{r.hoursWorked != null ? ` · ${num(r.hoursWorked)}h` : ""}</Pill> : <Pill>Unmarked</Pill>}</td>
              <td className="px-2 py-2"><div className="flex justify-end gap-1">{!r && <button type="button" className={btn.smOutline} onClick={() => { markRosterAttended(x.id); flash("Attendance recorded from roster"); }}><CheckCircle2 /> Mark attended</button>}<button type="button" className={cn(btn.ghost, "h-8 px-2 text-xs")} onClick={() => deleteRecord("shift-assignments", x.id)}>Remove</button></div></td></tr>
          ); })}</tbody></table>
        )}
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- timesheet approvals ---------- */

export function TimesheetApprovals() {
  const sheets = useCollection("timesheets");
  const projects = useCollection("projects");
  const tasks = useCollection("project-tasks");
  const [status, setStatus] = useState("SUBMITTED");
  const { node, flash } = useFlash();
  const rows = sheets.filter((s) => s.status === status).sort((a, b) => String(b.workDate).localeCompare(String(a.workDate)));
  return (
    <div className="space-y-4">
      <PageHeader title="Timesheet Approvals" subtitle="Review and approve time submitted by employees" />
      <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between"><Select value={status} onChange={setStatus} options={[{ value: "SUBMITTED", label: "Pending (submitted)" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }]} className="w-52" ariaLabel="Status" /><span className="text-sm text-muted-foreground">{rows.length} entries · {rows.reduce((a, s) => a + num(s.hours), 0).toFixed(2)}h</span></div>
        {rows.length === 0 ? <Empty icon={Clock} title="Nothing here" text={status === "SUBMITTED" ? "No timesheets are awaiting approval." : "No timesheets in this view."} /> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Date</Th><Th>Project</Th><Th>Description</Th><Th>Hours</Th><Th>Status</Th><Th className="text-right">Decision</Th></tr></thead><tbody>{rows.map((s) => (
            <tr key={s.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{String(s.userName)}</td><td className="px-2 py-2">{fmtDate(s.workDate)}</td><td className="px-2 py-2"><Link href={`/projects/${s.projectId}`} className="text-primary hover:underline">{String(projects.find((p) => p.id === s.projectId)?.name ?? "—")}</Link></td><td className="px-2 py-2">{String(tasks.find((t) => t.id === s.taskId)?.title ?? "—")}</td><td className="px-2 py-2 tabular-nums">{num(s.hours).toFixed(2)}</td><td className="px-2 py-2"><StatusBadge status={s.status} /></td>
              <td className="px-2 py-2">{s.status === "SUBMITTED" && <div className="flex justify-end gap-1"><button type="button" className={btn.smPrimary} onClick={() => { decideTimesheet(s.id, true); flash("Approved"); }}><Check /> Approve</button><button type="button" className={btn.smOutline} onClick={() => { decideTimesheet(s.id, false); flash("Rejected"); }}><X /> Reject</button></div>}</td></tr>
          ))}</tbody></table>
        )}
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- recruitment ---------- */

const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];
const NEXT: Record<string, string[]> = { APPLIED: ["SCREENING", "REJECTED"], SCREENING: ["INTERVIEW", "REJECTED"], INTERVIEW: ["OFFER", "REJECTED"], OFFER: ["HIRED", "REJECTED"], HIRED: [], REJECTED: ["APPLIED"] };
const STAGE_BAR: Record<string, string> = { APPLIED: "bg-muted-foreground", SCREENING: "bg-amber-500", INTERVIEW: "bg-blue-500", OFFER: "bg-violet-500", HIRED: "bg-success", REJECTED: "bg-destructive" };

export function Recruitment() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/hr/recruitment");
  const reqs = useCollection("requisitions");
  const cands = useCollection("candidates");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: "", openings: "1", employmentType: "FULL_TIME", salaryMin: "", salaryMax: "", status: "OPEN" });
  const { node, flash } = useFlash();
  const at = (s: string) => cands.filter((c) => c.stage === s);
  const stat = (l: string, v: number, tone?: string) => <Card><div className="p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{l}</div><div className={cn("mt-1 text-2xl font-bold", tone)}>{v}</div></div></Card>;
  function hire(c: Rec) {
    const e = createRecord("employees", { employeeNumber: `EMP-${String(readCollection("employees").length + 1).padStart(2, "0")}`, firstName: c.firstName, lastName: c.lastName || "", email: c.email, phone: c.phone, dateOfJoining: todayIso(), employmentType: "PERMANENT", status: "PROBATION" });
    updateRecord("candidates", c.id, { employeeId: e.id });
    startLifecycle(e.id, "onboarding", todayIso());
    flash(`${fullName(e)} added as an employee with an onboarding checklist`);
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Recruitment" subtitle="Job requisitions, candidate pipeline, interviews, offers" actions={<><button type="button" className={btn.outline} onClick={() => setOpen(true)}><Plus /> Requisition</button><Link href="/hr/recruitment/new" className={btn.primary}><Plus /> Candidate</Link></>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{stat("Open requisitions", reqs.filter((r) => r.status === "OPEN").length)}{stat("Total candidates", cands.length)}{stat("In interview", at("INTERVIEW").length)}{stat("Hired", at("HIRED").length, "text-success")}</div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><div className="space-y-2 p-5"><div className="flex justify-between"><CardTitle className="text-base">Requisitions</CardTitle><span className="text-xs text-muted-foreground">{reqs.length} total</span></div>
          <ul className="space-y-1">{reqs.slice(0, 8).map((r) => { const hired = cands.filter((c) => c.requisitionId === r.id && c.stage === "HIRED").length; return <li key={r.id} className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/40"><span className="font-medium">{String(r.title)}</span><div className="flex items-center gap-2 text-xs"><span className="text-muted-foreground">{hired}/{num(r.openings) || 1} role{num(r.openings) > 1 ? "s" : ""}</span><StatusBadge status={r.status} /><RowMenu items={[...(r.status === "OPEN" ? [{ label: "Close", onSelect: () => updateRecord("requisitions", r.id, { status: "CLOSED" }) }] : [{ label: "Reopen", onSelect: () => updateRecord("requisitions", r.id, { status: "OPEN" }) }]), { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${r.title}?`) && deleteRecord("requisitions", r.id) }]} /></div></li>; })}{reqs.length === 0 && <li className="py-6 text-center text-sm text-muted-foreground">No requisitions yet</li>}</ul>
        </div></Card>
        <Card><div className="space-y-2 p-5"><CardTitle className="text-base">Stage distribution</CardTitle>{STAGES.map((s) => { const c = at(s).length, pct = cands.length ? Math.round((c / cands.length) * 100) : 0; return <div key={s} className="text-xs"><div className="flex justify-between"><span className="font-medium">{s}</span><span className="text-muted-foreground">{c} ({pct}%)</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", STAGE_BAR[s])} style={{ width: `${pct}%` }} /></div></div>; })}</div></Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{STAGES.map((s) => (
        <Card key={s}><div className="space-y-2 p-3">
          <div className="flex items-center justify-between text-xs font-semibold"><span>{s}</span><Pill className="text-[10px]">{at(s).length}</Pill></div>
          {at(s).length === 0 ? <div className="rounded border border-dashed border-border py-3 text-center text-[11px] text-muted-foreground">No candidates</div> : <ul className="space-y-2">{at(s).slice(0, 8).map((c) => (
            <li key={c.id} className="rounded-md border border-border bg-background p-2 text-xs">
              <div className="flex items-center gap-2"><span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{`${String(c.firstName || "?")[0]}${String(c.lastName || "")[0] ?? ""}`.toUpperCase()}</span><div className="min-w-0 flex-1"><div className="truncate font-medium">{String(c.firstName)} {String(c.lastName || "")}</div>{Boolean(c.requisitionId) && <div className="truncate text-muted-foreground">{String(reqs.find((r) => r.id === c.requisitionId)?.title ?? "")}</div>}</div><RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => confirm("Delete candidate?") && deleteRecord("candidates", c.id) }]} /></div>
              {Boolean(c.source) && <div className="mt-1 text-muted-foreground">{String(c.source)}</div>}
              <div className="mt-1 flex flex-wrap gap-1">{NEXT[s].map((g) => <button key={g} type="button" title={`Move to ${g}`} onClick={() => updateRecord("candidates", c.id, { stage: g })} className="rounded border border-border px-1.5 py-0.5 hover:bg-accent">→ {g.toLowerCase()}</button>)}{s === "HIRED" && !c.employeeId && <button type="button" onClick={() => hire(c)} className="rounded border border-primary px-1.5 py-0.5 text-primary hover:bg-primary/10">Create employee</button>}{s === "HIRED" && Boolean(c.employeeId) && <Link href={`/hr/employees/${c.employeeId}`} className="text-primary hover:underline">View employee</Link>}</div>
            </li>
          ))}</ul>}
        </div></Card>
      ))}</div>
      <Dialog open={open} onClose={() => setOpen(false)} title="New job requisition">
        <div className="space-y-3">
          <Field label="Title" htmlFor="rq-title"><input id="rq-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Openings" htmlFor="rq-open"><input id="rq-open" type="number" value={f.openings} onChange={(e) => setF({ ...f, openings: e.target.value })} className={inputCls} /></Field>
            <Field label="Employment type" htmlFor="rq-type"><Select id="rq-type" value={f.employmentType} onChange={(v) => setF({ ...f, employmentType: v })} options={["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN", "TEMPORARY"]} /></Field>
            <Field label="Salary min" htmlFor="rq-min"><input id="rq-min" type="number" value={f.salaryMin} onChange={(e) => setF({ ...f, salaryMin: e.target.value })} className={inputCls} /></Field>
            <Field label="Salary max" htmlFor="rq-max"><input id="rq-max" type="number" value={f.salaryMax} onChange={(e) => setF({ ...f, salaryMax: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Status" htmlFor="rq-status"><Select id="rq-status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={["DRAFT", "OPEN", "ON_HOLD", "CLOSED"]} /></Field>
        </div>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!f.title.trim()} onClick={() => { createRecord("requisitions", { ...f, title: f.title.trim(), openings: num(f.openings) || 1, salaryMin: f.salaryMin ? num(f.salaryMin) : undefined, salaryMax: f.salaryMax ? num(f.salaryMax) : undefined }); setOpen(false); setF({ title: "", openings: "1", employmentType: "FULL_TIME", salaryMin: "", salaryMax: "", status: "OPEN" }); flash("Requisition created"); }}>Create</button></div>
      </Dialog>
      {sub === "new" && <SidePanel onClose={() => router.push("/hr/recruitment")}><CandidateForm onDone={() => router.push("/hr/recruitment")} /></SidePanel>}
      {node}
    </div>
  );
}

function CandidateForm({ onDone }: { onDone: () => void }) {
  const reqs = useCollection("requisitions");
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phone: "", requisitionId: "", source: "", expectedCtc: "" });
  const input = (k: keyof typeof f, l: string, type = "text") => <Field label={l} htmlFor={`cd-${k}`}><input id={`cd-${k}`} type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls} /></Field>;
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New Candidate</h1><p className="text-sm text-muted-foreground">Add a candidate to the recruitment pipeline</p></div>
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle>Add candidate</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">{input("firstName", "First name")}{input("lastName", "Last name")}{input("email", "Email", "email")}{input("phone", "Phone")}</div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>Requisition</Label><Select value={f.requisitionId} onChange={(v) => setF({ ...f, requisitionId: v })} options={[{ value: "", label: "— None —" }, ...reqs.filter((r) => r.status !== "CLOSED").map((r) => ({ value: r.id, label: String(r.title) }))]} ariaLabel="Requisition" /></div>
          <div className="space-y-2"><Label>Source</Label><Select value={f.source} onChange={(v) => setF({ ...f, source: v })} placeholder="—" options={["linkedin", "naukri", "referral", "careers_site", "agency"].map((s) => ({ value: s, label: s }))} ariaLabel="Source" /></div>
          {input("expectedCtc", "Expected CTC", "number")}
        </div>
        <div className="flex gap-2"><button type="button" className={btn.primary} disabled={!f.firstName.trim()} onClick={() => { createRecord("candidates", { ...f, firstName: f.firstName.trim(), expectedCtc: f.expectedCtc ? num(f.expectedCtc) : undefined, stage: "APPLIED" }); onDone(); }}>Add</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </div></Card>
    </div>
  );
}

/* ---------- onboarding ---------- */

export function Onboarding() {
  const recs = useCollection("onboarding");
  const emps = useCollection("employees");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [f, setF] = useState({ employeeId: "", kind: "onboarding" as "onboarding" | "offboarding", anchorDate: todayIso() });
  const { node, flash } = useFlash();
  const rows = recs.filter((r) => (kind === "all" || r.kind === kind) && (!q || fullName(emps.find((e) => e.id === r.employeeId)).toLowerCase().includes(q.toLowerCase())));
  const toggle = (r: Rec, tid: string) => { const tasks = ((r.tasks as Rec[]) ?? []).map((t) => (t.id === tid ? { ...t, done: !t.done, doneAt: !t.done ? new Date().toISOString() : null } : t)); updateRecord("onboarding", r.id, { tasks, status: tasks.every((t) => t.done) ? "completed" : "in_progress" }); };
  return (
    <div className="space-y-4">
      <PageHeader title="Onboarding / Offboarding" subtitle="Track employee lifecycle checklists" actions={<button type="button" className={btn.primary} onClick={() => setStarting(true)}><Plus /> Start checklist</button>} />
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by employee…" aria-label="Search" className={cn(inputCls, "max-w-xs")} /><Tabs value={kind} onChange={setKind} items={[["all", "All"], ["onboarding", "onboarding"], ["offboarding", "offboarding"]]} /><span className="ml-auto text-sm text-muted-foreground">{rows.length} of {recs.length}</span></div>
        {recs.length === 0 ? <Empty icon={CheckCircle2} title="No onboarding records yet" text="Start onboarding (or offboarding) for an employee — tasks are created from the default checklist." /> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No records match your filters</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Kind</Th><Th>Anchor date</Th><Th>Progress</Th><Th>Status</Th><Th /></tr></thead><tbody>{rows.map((r) => { const tasks = (r.tasks as Rec[]) ?? []; const done = tasks.filter((t) => t.done).length; return [
            <tr key={r.id} onClick={() => setOpen(open === r.id ? null : r.id)} className="cursor-pointer border-b border-border hover:bg-muted/40"><td className="px-2 py-2 font-medium">{fullName(emps.find((e) => e.id === r.employeeId))}</td><td className="px-2 py-2"><Pill>{String(r.kind)}</Pill></td><td className="px-2 py-2">{fmtDate(r.anchorDate)}</td><td className="px-2 py-2"><div className="flex items-center gap-2"><div className="h-1.5 w-24 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${tasks.length ? (done / tasks.length) * 100 : 0}%` }} /></div><span className="text-xs text-muted-foreground">{done}/{tasks.length}</span></div></td><td className="px-2 py-2"><StatusBadge status={String(r.status).toUpperCase()} /></td><td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}><RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => confirm("Delete this checklist?") && deleteRecord("onboarding", r.id) }]} /></td></tr>,
            open === r.id ? <tr key={`${r.id}-t`} className="bg-muted/30"><td colSpan={6} className="px-4 py-3"><ul className="grid gap-1 sm:grid-cols-2">{tasks.map((t) => <li key={String(t.id)}><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(t.done)} onChange={() => toggle(r, String(t.id))} /><span className={cn(Boolean(t.done) && "text-muted-foreground line-through")}>{String(t.title)}</span></label></li>)}</ul></td></tr> : null,
          ]; })}</tbody></table>
        )}
      </div></Card>
      <Dialog open={starting} onClose={() => setStarting(false)} title="Start a checklist">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Employee</Label><Select value={f.employeeId} onChange={(v) => setF({ ...f, employeeId: v })} placeholder="Choose employee" options={emps.map((e) => ({ value: e.id, label: `${fullName(e)} (${e.employeeNumber})` }))} ariaLabel="Employee" /></div>
          <div className="space-y-1.5"><Label>Kind</Label><Select value={f.kind} onChange={(v) => setF({ ...f, kind: v as "onboarding" })} options={[{ value: "onboarding", label: "Onboarding" }, { value: "offboarding", label: "Offboarding" }]} ariaLabel="Kind" /></div>
          <div className="space-y-1.5"><Label>Anchor date</Label><DateInput value={f.anchorDate} onChange={(v) => setF({ ...f, anchorDate: v })} /></div>
          <p className="text-xs text-muted-foreground">{CHECKLISTS[f.kind].length} tasks: {CHECKLISTS[f.kind].join(" · ")}</p>
        </div>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!f.employeeId} onClick={() => { if (recs.some((r) => r.employeeId === f.employeeId && r.kind === f.kind && r.status !== "completed")) return flash(`An open ${f.kind} checklist already exists`, true); startLifecycle(f.employeeId, f.kind, f.anchorDate); setStarting(false); flash("Checklist started"); }}>Start</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- performance ---------- */

const P_BASE = "/hr/performance";

export function Performance() {
  const router = useRouter();
  const sub = subOf(usePathname(), P_BASE);
  const cycles = useCollection("performance-cycles");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const { node, flash } = useFlash();
  if (sub === "reviews") return <Reviews />;
  if (sub.startsWith("reviews/")) return <ReviewDetail id={sub.slice(8)} />;
  const rows = cycles.filter((c) => (status === "all" || c.status === status) && (!q || String(c.name).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-4">
      <PageHeader title="Performance management" subtitle="Review cycles, goals, and 360 feedback" actions={<><Link href={`${P_BASE}/reviews`} className={btn.outline}>Reviews</Link><Link href={`${P_BASE}/new`} className={btn.primary}><Plus /> New cycle</Link></>} />
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search cycles…" aria-label="Search cycles" className={cn(inputCls, "max-w-xs")} /><Tabs value={status} onChange={setStatus} items={[["all", "All"], ["draft", "draft"], ["open", "open"], ["calibration", "calibration"], ["closed", "closed"]]} /><span className="ml-auto text-sm text-muted-foreground">{rows.length} of {cycles.length}</span></div>
        {cycles.length === 0 ? <Empty icon={Target} title="No review cycles yet" text="Create a review cycle. When you Open it, reviews are auto-instantiated for every active employee." action={<Link href={`${P_BASE}/new`} className={btn.smPrimary}><Plus /> New cycle</Link>} /> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No cycles match your filters</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Cycle</Th><Th>Period</Th><Th>Self due</Th><Th>Manager due</Th><Th>Status</Th><Th /></tr></thead><tbody>{rows.map((c) => (
            <tr key={c.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{String(c.name)}</td><td className="px-2 py-2">{fmtDate(c.periodStart)} – {fmtDate(c.periodEnd)}</td><td className="px-2 py-2">{fmtDate(c.selfDue)}</td><td className="px-2 py-2">{fmtDate(c.managerDue)}</td><td className="px-2 py-2"><StatusBadge status={String(c.status).toUpperCase()} /></td>
              <td className="px-2 py-2"><div className="flex justify-end gap-1">{c.status === "draft" && <button type="button" className={btn.smPrimary} title="Open review cycle" onClick={() => flash(`Opened — ${openCycle(c.id)} review(s) created`)}>Open</button>}{c.status === "open" && <button type="button" className={btn.smOutline} onClick={() => updateRecord("performance-cycles", c.id, { status: "calibration" })}>Calibrate</button>}{c.status === "calibration" && <button type="button" className={btn.smOutline} onClick={() => updateRecord("performance-cycles", c.id, { status: "closed" })}>Close</button>}<RowMenu items={[{ label: "View reviews", onSelect: () => router.push(`${P_BASE}/reviews`) }, { label: "Delete", destructive: true, onSelect: () => { if (readCollection("performance-reviews").some((r) => r.cycleId === c.id)) return flash("Cycle has reviews", true); deleteRecord("performance-cycles", c.id); } }]} /></div></td></tr>
          ))}</tbody></table>
        )}
      </div></Card>
      {sub === "new" && <SidePanel onClose={() => router.push(P_BASE)}><CycleForm onDone={() => router.push(P_BASE)} /></SidePanel>}
      {node}
    </div>
  );
}

function CycleForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", periodStart: "", periodEnd: "", selfDue: "", managerDue: "" });
  const [error, setError] = useState("");
  const d = (k: keyof typeof f, l: string) => <div className="space-y-2"><Label>{l}</Label><DateInput value={f[k]} onChange={(v) => setF({ ...f, [k]: v })} /></div>;
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New Cycle</h1><p className="text-sm text-muted-foreground">Create a performance review cycle</p></div>
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle>New review cycle</CardTitle>
        <Field label="Name" htmlFor="cy-name"><input id="cy-name" placeholder="H1 2026" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">{d("periodStart", "Period start")}{d("periodEnd", "Period end")}{d("selfDue", "Self review due")}{d("managerDue", "Manager review due")}</div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={() => { if (!f.name.trim()) return setError("Name is required"); if (f.periodStart && f.periodEnd && f.periodStart > f.periodEnd) return setError("Period start is after period end"); createRecord("performance-cycles", { ...f, name: f.name.trim(), status: "draft" }); onDone(); }}>Create</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </div></Card>
    </div>
  );
}

function Reviews() {
  const router = useRouter();
  const reviews = useCollection("performance-reviews");
  const cycles = useCollection("performance-cycles");
  const emps = useCollection("employees");
  const me = meEmployee(emps);
  const team = me ? new Set(reportsOf(me.id, emps).map((e) => e.id)) : new Set<string>();
  const mine = reviews.filter((r) => me && r.employeeId === me.id);
  const awaiting = reviews.filter((r) => team.has(String(r.employeeId)) && !r.finalized);
  const [tab, setTab] = useState("mine");
  const [q, setQ] = useState("");
  const list = (tab === "mine" ? mine : tab === "awaiting" ? awaiting : reviews).filter((r) => !q || `${fullName(emps.find((e) => e.id === r.employeeId))} ${cycles.find((c) => c.id === r.cycleId)?.name ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <Link href={P_BASE} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back to cycles</Link>
      <PageHeader title="Performance reviews" subtitle="Self-reviews, manager reviews, 360 feedback" />
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center gap-2"><Tabs value={tab} onChange={setTab} items={[["mine", `My self-review${mine.length}`], ["awaiting", `Awaiting my feedback (manager)${awaiting.length}`], ["all", `All reviews${reviews.length}`]]} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employee or cycle…" aria-label="Search reviews" className={cn(inputCls, "ml-auto max-w-xs")} /></div>
        {list.length === 0 ? <Empty icon={Target} title="No reviews waiting on you" text="Cycles you participate in will appear here when opened." /> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Cycle</Th><Th>Status</Th><Th>Rating</Th><Th>Finalized</Th><Th /></tr></thead><tbody>{list.map((r) => (
            <tr key={r.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{fullName(emps.find((e) => e.id === r.employeeId))}</td><td className="px-2 py-2">{String(cycles.find((c) => c.id === r.cycleId)?.name ?? "—")}</td><td className="px-2 py-2"><StatusBadge status={r.status} /></td><td className="px-2 py-2">{r.overallRating != null ? `${num(r.overallRating).toFixed(1)}${r.ratingLabel ? ` · ${r.ratingLabel}` : ""}` : "—"}</td><td className="px-2 py-2">{r.finalized ? <CheckCircle2 className="size-4 text-success" /> : "—"}</td><td className="px-2 py-2 text-right"><button type="button" className={btn.smOutline} onClick={() => router.push(`${P_BASE}/reviews/${r.id}`)}>Open</button></td></tr>
          ))}</tbody></table>
        )}
      </div></Card>
    </div>
  );
}

const RATING_LABELS = ["Exceeds expectations", "Meets expectations", "Partially meets", "Below expectations"];

function ReviewDetail({ id }: { id: string }) {
  const reviews = useCollection("performance-reviews");
  const cycles = useCollection("performance-cycles");
  const emps = useCollection("employees");
  const [fb, setFb] = useState({ reviewerKind: "SELF", competency: "", rating: "3", comments: "" });
  const [fin, setFin] = useState({ overallRating: "", ratingLabel: "", salaryIncreasePct: "", bonus: "" });
  const [goal, setGoal] = useState({ title: "", description: "", metric: "", target: "", weight: "", dueDate: "" });
  const { node, flash } = useFlash();
  const r = reviews.find((x) => x.id === id);
  if (!reviews.length) return null;
  if (!r) return <p className="p-6 text-sm text-muted-foreground">Review not found.</p>;
  const e = emps.find((x) => x.id === r.employeeId);
  const feedback = (r.feedback as Rec[]) ?? [];
  const goals = (r.goals as Rec[]) ?? [];
  const avg = feedback.length ? feedback.reduce((a, f) => a + num(f.rating), 0) / feedback.length : 0;
  const locked = Boolean(r.finalized);
  return (
    <div className="space-y-4">
      <Link href={`${P_BASE}/reviews`} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back to reviews</Link>
      <PageHeader title={fullName(e)} subtitle={`${cycles.find((c) => c.id === r.cycleId)?.name ?? ""} · ${r.finalized ? "Finalized" : String(r.status).replace(/_/g, " ").toLowerCase()}`} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><div className="space-y-3 p-5"><CardTitle className="text-base">Feedback</CardTitle>
          {feedback.length === 0 ? <p className="text-sm text-muted-foreground">No feedback yet — be the first.</p> : <ul className="space-y-2">{feedback.map((f) => <li key={String(f.id)} className="rounded-md border border-border p-2 text-sm"><div className="flex justify-between"><span className="font-medium">{String(f.reviewerKind)}{f.competency ? ` · ${f.competency}` : ""}</span><span className="tabular-nums">{num(f.rating).toFixed(1)} / 5</span></div>{Boolean(f.comments) && <p className="mt-1 text-muted-foreground">{String(f.comments)}</p>}<div className="mt-1 text-xs text-muted-foreground">{String(f.by)} · {new Date(String(f.at)).toLocaleDateString()}</div></li>)}</ul>}
          {!locked && <div className="space-y-2 border-t border-border pt-3"><div className="text-sm font-medium">Submit feedback</div>
            <div className="grid gap-2 sm:grid-cols-3"><div className="space-y-1"><Label className="text-xs">Reviewer kind</Label><Select size="sm" value={fb.reviewerKind} onChange={(v) => setFb({ ...fb, reviewerKind: v })} options={["SELF", "MANAGER", "PEER", "REPORT"].map((k) => ({ value: k, label: k }))} ariaLabel="Reviewer kind" /></div><Field label="Competency (optional)" htmlFor="fb-comp"><input id="fb-comp" placeholder="Communication" value={fb.competency} onChange={(ev) => setFb({ ...fb, competency: ev.target.value })} className={cn(inputCls, "h-8")} /></Field><Field label="Rating (1.0 – 5.0)" htmlFor="fb-rate"><input id="fb-rate" type="number" min="1" max="5" step="0.5" value={fb.rating} onChange={(ev) => setFb({ ...fb, rating: ev.target.value })} className={cn(inputCls, "h-8")} /></Field></div>
            <Field label="Comments" htmlFor="fb-com"><textarea id="fb-com" value={fb.comments} onChange={(ev) => setFb({ ...fb, comments: ev.target.value })} className={textareaCls} /></Field>
            <button type="button" className={btn.smPrimary} onClick={() => { const rt = num(fb.rating); if (rt < 1 || rt > 5) return flash("Rating must be 1.0 – 5.0", true); updateRecord("performance-reviews", r.id, { feedback: [...feedback, { id: crypto.randomUUID(), ...fb, rating: rt, by: BRAND.user.fullName, at: new Date().toISOString() }], status: fb.reviewerKind === "MANAGER" ? "MANAGER_REVIEW" : r.status }); setFb({ ...fb, competency: "", comments: "" }); flash("Feedback submitted"); }}>Submit</button>
          </div>}
        </div></Card>
        <Card><div className="space-y-3 p-5"><CardTitle className="text-base">Finalize review</CardTitle>
          {locked ? <div className="space-y-1 text-sm"><div>Overall rating: <span className="font-semibold">{num(r.overallRating).toFixed(1)}</span> · {String(r.ratingLabel)}</div>{num(r.salaryIncreasePct) > 0 && <div>Salary increase: {num(r.salaryIncreasePct)}%</div>}{num(r.bonus) > 0 && <div>Bonus: {money(num(r.bonus))}</div>}<Pill className="text-success"><CheckCircle2 className="mr-1 size-3" /> Finalized</Pill></div> : <>
            <div className="grid gap-2 sm:grid-cols-2"><Field label="Overall rating" htmlFor="fn-rate"><input id="fn-rate" type="number" min="1" max="5" step="0.1" placeholder={avg ? avg.toFixed(1) : ""} value={fin.overallRating} onChange={(ev) => setFin({ ...fin, overallRating: ev.target.value })} className={inputCls} /></Field><div className="space-y-1.5"><Label>Rating label</Label><Select value={fin.ratingLabel} onChange={(v) => setFin({ ...fin, ratingLabel: v })} placeholder="—" options={RATING_LABELS.map((l) => ({ value: l, label: l }))} ariaLabel="Rating label" /></div><Field label="Salary increase %" htmlFor="fn-inc"><input id="fn-inc" type="number" step="0.1" value={fin.salaryIncreasePct} onChange={(ev) => setFin({ ...fin, salaryIncreasePct: ev.target.value })} className={inputCls} /></Field><Field label="Bonus amount" htmlFor="fn-bonus"><input id="fn-bonus" type="number" value={fin.bonus} onChange={(ev) => setFin({ ...fin, bonus: ev.target.value })} className={inputCls} /></Field></div>
            <button type="button" className={btn.primary} onClick={() => { const o = num(fin.overallRating) || avg; if (!o) return flash("Enter an overall rating", true); updateRecord("performance-reviews", r.id, { overallRating: Math.round(o * 10) / 10, ratingLabel: fin.ratingLabel || (o >= 4.5 ? RATING_LABELS[0] : o >= 3 ? RATING_LABELS[1] : o >= 2 ? RATING_LABELS[2] : RATING_LABELS[3]), salaryIncreasePct: num(fin.salaryIncreasePct), bonus: num(fin.bonus), finalized: true, status: "FINALIZED" }); flash("Review finalized"); }}>Finalize</button>
            <p className="text-xs text-muted-foreground">Salary changes are applied through a Merit Cycle.</p>
          </>}
        </div></Card>
      </div>
      <Card><div className="space-y-3 p-5"><CardTitle className="text-base">Goals</CardTitle>
        {goals.length === 0 ? <p className="text-sm text-muted-foreground">No goals yet</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Title</Th><Th>Metric</Th><Th>Target</Th><Th>Weight %</Th><Th>Due</Th><Th>Achievement %</Th></tr></thead><tbody>{goals.map((g) => <tr key={String(g.id)} className="border-b border-border"><td className="px-2 py-1.5"><div className="font-medium">{String(g.title)}</div>{Boolean(g.description) && <div className="text-xs text-muted-foreground">{String(g.description)}</div>}</td><td className="px-2 py-1.5">{String(g.metric || "—")}</td><td className="px-2 py-1.5">{String(g.target || "—")}</td><td className="px-2 py-1.5">{g.weight ? num(g.weight) : "—"}</td><td className="px-2 py-1.5">{fmtDate(g.dueDate)}</td><td className="px-2 py-1.5"><input type="number" min="0" max="200" aria-label={`Achievement for ${g.title}`} disabled={locked} defaultValue={g.achievement != null ? String(g.achievement) : ""} onBlur={(ev) => updateRecord("performance-reviews", r.id, { goals: goals.map((x) => (x.id === g.id ? { ...x, achievement: ev.target.value === "" ? null : num(ev.target.value) } : x)) })} className={cn(inputCls, "h-7 w-20")} /></td></tr>)}</tbody></table>}
        {!locked && <div className="space-y-2 border-t border-border pt-3"><div className="text-sm font-medium">New goal</div>
          <div className="grid gap-2 sm:grid-cols-3">{([["title", "Title", "text", ""], ["description", "Description", "text", ""], ["metric", "Metric", "text", "e.g. CSAT"], ["target", "Target value", "text", ""], ["weight", "Weight %", "number", ""]] as const).map(([k, l, t, p]) => <Field key={k} label={l} htmlFor={`gl-${k}`}><input id={`gl-${k}`} type={t} placeholder={p} value={goal[k]} onChange={(ev) => setGoal({ ...goal, [k]: ev.target.value })} className={cn(inputCls, "h-8")} /></Field>)}<div className="space-y-1.5"><Label>Due date</Label><DateInput value={goal.dueDate} onChange={(v) => setGoal({ ...goal, dueDate: v })} /></div></div>
          <button type="button" className={btn.smPrimary} disabled={!goal.title.trim()} onClick={() => { updateRecord("performance-reviews", r.id, { goals: [...goals, { id: crypto.randomUUID(), ...goal, weight: goal.weight ? num(goal.weight) : null }] }); setGoal({ title: "", description: "", metric: "", target: "", weight: "", dueDate: "" }); flash("Goal added"); }}><Plus /> Add</button>
        </div>}
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- policies ---------- */

export function Policies() {
  const policies = useCollection("hr-policies");
  const emps = useCollection("employees");
  const [form, setForm] = useState<{ id?: string; code: string; title: string; body: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const { node, flash } = useFlash();
  const me = meEmployee(emps);
  const active = emps.filter((e) => !["RESIGNED", "TERMINATED"].includes(String(e.status)));
  function save() {
    if (!form || !form.code.trim() || !form.title.trim()) return;
    if (form.id) { const p = policies.find((x) => x.id === form.id)!; const changed = p.body !== form.body || p.title !== form.title; updateRecord("hr-policies", form.id, { code: form.code.trim(), title: form.title.trim(), body: form.body, ...(changed ? { version: num(p.version) + 1, acknowledgments: [] } : {}) }); flash(changed ? `Saved — now v${num(p.version) + 1}; acknowledgments re-opened` : "Saved"); }
    else { if (policies.some((p) => String(p.code).toLowerCase() === form.code.trim().toLowerCase())) return flash(`Code ${form.code} already exists`, true); createRecord("hr-policies", { code: form.code.trim(), title: form.title.trim(), body: form.body, version: 1, acknowledgments: [] }); flash("Policy created"); }
    setForm(null);
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Policy Library" subtitle="Company policies employees acknowledge. Editing a policy bumps its version and re-opens acknowledgment." actions={<button type="button" className={btn.primary} onClick={() => setForm({ code: "", title: "", body: "" })}><Plus /> New policy</button>} />
      <Card><div className="p-5">{policies.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No policies yet.</p> : <div className="divide-y divide-border">{policies.map((p) => { const acks = (p.acknowledgments as Rec[]) ?? []; const mine = me && acks.some((a) => a.employeeId === me.id); return (
        <div key={p.id} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-2"><button type="button" className="text-left" onClick={() => setOpen(open === p.id ? null : p.id)}><span className="font-mono text-xs text-muted-foreground">{String(p.code)}</span> <span className="font-medium">{String(p.title)}</span> <Pill className="ml-1">v{num(p.version)}</Pill></button>
            <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{acks.length} / {active.length} acknowledged</span>{me && (mine ? <Pill className="text-success"><Check className="mr-1 size-3" /> You acknowledged</Pill> : <button type="button" className={btn.smPrimary} onClick={() => updateRecord("hr-policies", p.id, { acknowledgments: [...acks, { employeeId: me.id, version: p.version, at: new Date().toISOString() }] })}>Acknowledge</button>)}<RowMenu items={[{ label: "Edit", onSelect: () => setForm({ id: p.id, code: String(p.code), title: String(p.title), body: String(p.body ?? "") }) }, { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${p.title}?`) && deleteRecord("hr-policies", p.id) }]} /></div></div>
          {open === p.id && <div className="mt-2 space-y-2"><p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm">{String(p.body || "No text.")}</p>{acks.length > 0 && <p className="text-xs text-muted-foreground">Acknowledged by: {acks.map((a) => fullName(emps.find((e) => e.id === a.employeeId))).join(", ")}</p>}</div>}
        </div>
      ); })}</div>}</div></Card>
      <Dialog open={!!form} onClose={() => setForm(null)} title={form?.id ? "Edit policy" : "New policy"} className="max-w-xl">
        {form && <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-[8rem_1fr]"><Field label="Code *" htmlFor="po-code"><input id="po-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className={inputCls} /></Field><Field label="Title *" htmlFor="po-title"><input id="po-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field></div><Field label="Body" htmlFor="po-body"><textarea id="po-body" rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={textareaCls} /></Field></div>}
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setForm(null)}>Cancel</button><button type="button" className={btn.primary} disabled={!form?.code.trim() || !form?.title.trim()} onClick={save}>{form?.id ? "Save" : "Create"}</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- holidays ---------- */

export function Holidays() {
  const cals = useCollection("holiday-calendars");
  const [sel, setSel] = useState<string | null>(null);
  const [h, setH] = useState({ date: "", name: "" });
  const cal = cals.find((c) => c.id === sel) ?? cals[0];
  const hols = ((cal?.holidays as Rec[]) ?? []).slice().sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return (
    <div className="space-y-4">
      <PageHeader title="Holiday calendars" subtitle="Per-country / per-location holiday lists" />
      {cals.length === 0 ? <Card><div className="p-5"><Empty icon={CalendarDays} title="No holiday calendars" text="Holiday calendars (one per location) appear here. Seed your country's calendar from HR Settings → Country defaults." action={<Link href="/hr/settings" className={btn.smPrimary}>Open HR Settings</Link>} /></div></Card> : (
        <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <Card className="h-fit"><div className="space-y-1 p-3"><div className="px-2 pb-1 text-xs font-semibold text-muted-foreground">Calendars</div>{cals.map((c) => <div key={c.id} className={cn("flex items-center justify-between rounded-md px-2 py-1.5 text-sm", cal?.id === c.id && "bg-accent")}><button type="button" className="text-left" onClick={() => setSel(c.id)}>{String(c.name)}{Boolean(c.isDefault) && <Pill className="ml-1 text-[10px]">default</Pill>}</button><button type="button" aria-label={`Delete ${c.name}`} className={btn.icon} onClick={() => confirm(`Delete ${c.name}?`) && deleteRecord("holiday-calendars", c.id)}><Trash2 /></button></div>)}</div></Card>
          <Card><div className="space-y-3 p-5"><CardTitle className="text-base">{String(cal?.name)}</CardTitle>
            {hols.length === 0 ? <p className="text-sm text-muted-foreground">No holidays added yet</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>Day</Th><Th>Holiday</Th><Th /></tr></thead><tbody>{hols.map((x) => <tr key={String(x.id)} className="border-b border-border"><td className="px-2 py-1.5">{fmtDate(x.date)}</td><td className="px-2 py-1.5 text-muted-foreground">{new Date(`${x.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "long" })}</td><td className="px-2 py-1.5 font-medium">{String(x.name)}</td><td className="px-2 py-1.5 text-right"><button type="button" aria-label="Delete holiday" className={btn.icon} onClick={() => updateRecord("holiday-calendars", cal!.id, { holidays: hols.filter((y) => y.id !== x.id) })}><Trash2 /></button></td></tr>)}</tbody></table>}
            <div className="flex flex-wrap items-end gap-2 border-t border-border pt-3"><div className="w-44 space-y-1"><Label className="text-xs">Date</Label><DateInput value={h.date} onChange={(v) => setH({ ...h, date: v })} /></div><Field label="Holiday" htmlFor="hd-name"><input id="hd-name" value={h.name} onChange={(e) => setH({ ...h, name: e.target.value })} className={cn(inputCls, "w-56")} /></Field><button type="button" className={btn.smPrimary} disabled={!h.date || !h.name.trim()} onClick={() => { updateRecord("holiday-calendars", cal!.id, { holidays: [...hols, { id: crypto.randomUUID(), date: h.date, name: h.name.trim() }] }); setH({ date: "", name: "" }); }}><Plus /> Add holiday</button></div>
          </div></Card>
        </div>
      )}
    </div>
  );
}

/* ---------- settings ---------- */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HrSettingsPage() {
  const [s, setS] = useState<HrSettings>(HR_DEFAULTS);
  const [yr, setYr] = useState(String(new Date().getFullYear()));
  const { node, flash } = useFlash();
  // Settings live in browser storage, so they load after mount.
  useEffect(() => { const t = setTimeout(() => setS(hrSettings()), 0); return () => clearTimeout(t); }, []);
  const air = s.airTicket;
  return (
    <div className="space-y-4">
      <PageHeader title="HR Settings" subtitle="Working week, weekend, locale & timezone — used by leave and attendance." />
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle className="text-base">Working week</CardTitle>
        <div className="space-y-2"><Label>Weekend days</Label><div className="flex flex-wrap gap-2">{DAYS.map((d, i) => <button key={d} type="button" aria-pressed={s.weekendDays.includes(i)} onClick={() => setS({ ...s, weekendDays: s.weekendDays.includes(i) ? s.weekendDays.filter((x) => x !== i) : [...s.weekendDays, i].sort() })} className={cn("rounded-full border px-3 py-1 text-sm", s.weekendDays.includes(i) ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent")}>{d}</button>)}</div><p className="text-xs text-muted-foreground">GCC is typically Fri–Sat; UK/India Sat–Sun. Leave day-counts exclude these.</p></div>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Hours / day" htmlFor="hs-hours"><input id="hs-hours" type="number" step="0.25" value={s.hoursPerDay} onChange={(e) => setS({ ...s, hoursPerDay: num(e.target.value) })} className={inputCls} /></Field><Field label="Locale" htmlFor="hs-loc"><input id="hs-loc" placeholder="e.g. en-GB, ar-AE" value={s.locale} onChange={(e) => setS({ ...s, locale: e.target.value })} className={inputCls} /></Field><Field label="Timezone" htmlFor="hs-tz"><input id="hs-tz" placeholder="e.g. Asia/Dubai" value={s.timezone} onChange={(e) => setS({ ...s, timezone: e.target.value })} className={inputCls} /></Field></div>
        <button type="button" className={btn.primary} onClick={() => { saveHrSettings({ weekendDays: s.weekendDays, hoursPerDay: s.hoursPerDay, locale: s.locale, timezone: s.timezone }); flash("Settings saved"); }}>Save settings</button>
      </div></Card>
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle className="text-base">Country defaults</CardTitle>
        <div className="flex flex-wrap items-center justify-between gap-3"><div className="max-w-md"><div className="text-sm font-medium">Statutory leave types &amp; holiday calendar</div><p className="text-xs text-muted-foreground">Seeds the leave types and a public-holiday calendar appropriate to your company country (GCC / UK / India). Safe to re-run — existing entries are kept.</p></div><div className="flex items-center gap-2"><Select value={s.country} onChange={(v) => { setS({ ...s, country: v }); saveHrSettings({ country: v }); }} options={[{ value: "GCC", label: "GCC" }, { value: "UK", label: "UK" }, { value: "INDIA", label: "India" }]} className="w-28" ariaLabel="Country" /><button type="button" className={btn.outline} onClick={() => flash(`Defaults seeded — ${seedHrDefaults()} new entries`)}><Sparkles /> Seed defaults</button></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4"><div className="max-w-md"><div className="text-sm font-medium">Import holiday set for year</div><p className="text-xs text-muted-foreground">Adds that year&apos;s public holidays to your default calendar. GCC Islamic dates are approximate (moon-sighting).</p></div><div className="flex items-center gap-2"><input type="number" aria-label="Year" value={yr} onChange={(e) => setYr(e.target.value)} className={cn(inputCls, "w-24")} /><button type="button" className={btn.outline} onClick={() => { const y = parseInt(yr); if (!(y > 2000 && y < 2100)) return flash("Enter a valid year", true); flash(`${importHolidays(y)} holiday(s) imported`); }}><CalendarDays /> Import</button></div></div>
      </div></Card>
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle className="flex items-center gap-2 text-base"><Plane className="size-4" /> Air-ticket provision (GCC)</CardTitle>
        <p className="text-xs text-muted-foreground">Accrues a periodic flight allowance monthly as an employer cost (does not affect employee net pay). Monthly accrual = ticket value ÷ frequency.</p>
        <div className="flex flex-wrap items-end gap-3"><Field label="Ticket value" htmlFor="at-val"><input id="at-val" type="number" value={air.value} onChange={(e) => setS({ ...s, airTicket: { ...air, value: num(e.target.value) } })} className={cn(inputCls, "w-40")} /></Field><Field label="Frequency (months)" htmlFor="at-freq"><input id="at-freq" type="number" min="1" value={air.frequency} onChange={(e) => setS({ ...s, airTicket: { ...air, frequency: num(e.target.value) } })} className={cn(inputCls, "w-40")} /></Field><button type="button" aria-pressed={air.enabled} onClick={() => setS({ ...s, airTicket: { ...air, enabled: !air.enabled } })} className={air.enabled ? btn.primary : btn.outline}>{air.enabled ? "Enabled" : "Disabled"}</button></div>
        <p className="text-xs text-muted-foreground">≈ {money(air.frequency ? air.value / air.frequency : 0)} accrued per month.</p>
        <button type="button" className={btn.primary} onClick={() => { saveHrSettings({ airTicket: air }); flash("Air-ticket provision saved"); }}>Save air-ticket provision</button>
      </div></Card>
      {node}
    </div>
  );
}
