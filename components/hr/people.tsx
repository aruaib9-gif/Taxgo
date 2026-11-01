"use client";

// HR people pages: dashboard, employees (list, form, profile, import), categories, designations,
// positions, comp bands, merit cycles, my team, org chart and the document vault.

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, CheckCircle2, ChevronDown, ChevronRight, ChevronsUpDown, Download, FileText, IdCard, Pencil, Plus, Trash2, Upload, UserMinus, UserPlus, Users, Wallet } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { EMP_STATUSES, EMPLOYMENT_TYPES, orgUnits, assignSalary, createEmployee, currentSalary, employeeAsOf, finalizeMerit, fullName, isCurrent, leaveBalances, meEmployee, orgUnitName, parseCsv, reportsOf, todayIso, updateEmployee } from "@/lib/hr";
import { onBooks, useJournals, useAccounts } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { Card, CardTitle, Dialog, Field, Label, PageHeader, RowMenu, SidePanel, btn, downloadFile, inputCls, money, num, toExcelHTML } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner, StatusBadge } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";

export const Th = ({ children, className }: { children?: React.ReactNode; className?: string }) => <th className={cn("px-2 py-2 text-left font-medium text-muted-foreground", className)}>{children}</th>;
export const Pill = ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-xs font-medium", className)}>{children}</span>;
export const Empty = ({ icon: Icon, title, text, action }: { icon: typeof Users; title: string; text?: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center"><div className="rounded-full bg-muted p-3"><Icon className="size-5 text-muted-foreground" /></div><p className="font-semibold">{title}</p>{text && <p className="max-w-md text-sm text-muted-foreground">{text}</p>}{action}</div>
);
export function useFlash() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const node = msg && <div role="status" className={cn("fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg", msg.bad ? "border-destructive/30 bg-destructive text-white" : "border-border bg-card")}>{msg.text}</div>;
  return { node, flash: (text: string, bad = false) => { setMsg({ text, bad }); setTimeout(() => setMsg(null), 3000); } };
}
export const fmtDate = (iso: unknown) => (iso ? new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
const year = () => Number(todayIso().slice(0, 4));
const label = (opts: { value: string; label: string }[], v: unknown) => opts.find((o) => o.value === v)?.label ?? "—";
const daysUntil = (iso: unknown) => Math.ceil((new Date(`${String(iso).slice(0, 10)}T00:00:00`).getTime() - new Date(`${todayIso()}T00:00:00`).getTime()) / 86400000);

// Flattens the category tree into display order with depth.
export function categoryTree(cats: Rec[]) {
  const out: (Rec & { depth: number })[] = [];
  const walk = (parent: string | null, depth: number) => cats.filter((c) => (c.parentId ?? null) === parent).sort((a, b) => String(a.code).localeCompare(String(b.code))).forEach((c) => { out.push({ ...c, depth }); walk(c.id, depth + 1); });
  walk(null, 0);
  return out;
}

/* ---------- dashboard ---------- */

function Bars({ rows, money: m }: { rows: [string, number][]; money?: boolean }) {
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return <div className="space-y-2">{rows.map(([k, v]) => <div key={k} className="text-sm"><div className="flex justify-between"><span>{k}</span><span className="tabular-nums">{m ? money(v) : v}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${(v / max) * 100}%` }} /></div></div>)}</div>;
}

export function HrDashboard() {
  const emps = useCollection("employees");
  const salaries = useCollection("salaries");
  const journals = useJournals();
  const accounts = useAccounts();
  const docs = useCollection("employee-documents");
  useCollection("leave-requests");
  useCollection("leave-types");
  const y = String(year());
  const current = emps.filter(isCurrent);
  const basic = (e: Rec) => num(currentSalary(e.id, salaries)?.basic);
  const monthly = current.reduce((a, e) => a + basic(e), 0);
  const group = (key: (e: Rec) => string) => { const m = new Map<string, number>(); for (const e of current) m.set(key(e), (m.get(key(e)) ?? 0) + 1); return [...m]; };
  const byOrg = group((e) => orgUnitName(e.orgUnitId) === "—" ? "Unassigned" : orgUnitName(e.orgUnitId));
  const byStatus = group((e) => label(EMP_STATUSES, e.status));
  const costByOrg = new Map<string, number>(); for (const e of current) if (basic(e)) costByOrg.set(orgUnitName(e.orgUnitId) === "—" ? "Unassigned" : orgUnitName(e.orgUnitId), (costByOrg.get(orgUnitName(e.orgUnitId)) ?? 0) + basic(e));
  const usage = new Map<string, { allocated: number; used: number }>();
  for (const e of current) for (const b of leaveBalances(e.id)) { const g = usage.get(b.name) ?? { allocated: 0, used: 0 }; g.allocated += b.allocated; g.used += b.used; usage.set(b.name, g); }
  const salaryAcc = accounts.find((a) => a.code === "5100")?.id;
  const glGross = journals.filter((j) => onBooks(j) && String(j.date).startsWith(todayIso().slice(0, 7))).flatMap((j) => (j.lines as Rec[]) ?? []).filter((l) => l.accountId === salaryAcc).reduce((a, l) => a + num(l.debit) - num(l.credit), 0);
  const idFields: [string, string][] = [["passportExpiry", "Passport"], ["visaExpiry", "Visa"], ["emiratesIdExpiry", "Emirates ID"], ["rtwExpiry", "Right to work"]];
  const expiring = [...current.flatMap((e) => idFields.filter(([f]) => e[f]).map(([f, l]) => ({ e, label: l, date: String(e[f]) }))), ...docs.filter((d) => d.expiresOn).map((d) => ({ e: emps.find((x) => x.id === d.employeeId), label: String(d.type), date: String(d.expiresOn) }))].filter((x) => x.e && daysUntil(x.date) <= 90 && daysUntil(x.date) >= -30).sort((a, b) => a.date.localeCompare(b.date));
  const stat = (icon: React.ReactNode, l: string, v: string) => <Card><div className="flex items-center gap-3 p-4"><div className="rounded-full bg-muted p-2 text-muted-foreground">{icon}</div><div><div className="text-xs text-muted-foreground">{l}</div><div className="text-2xl font-bold">{v}</div></div></div></Card>;
  const box = (title: React.ReactNode, body: React.ReactNode, cls?: string) => <Card className={cls}><div className="p-4 pb-2"><CardTitle className="text-sm">{title}</CardTitle></div><div className="p-4 pt-0 text-sm">{body}</div></Card>;
  return (
    <div className="space-y-4">
      <PageHeader title="HR Dashboard" subtitle={`Workforce overview for ${y} — live, company-scoped.`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat(<Users className="size-4" />, "Headcount", String(current.length))}
        {stat(<UserPlus className="size-4" />, `Joiners ${y}`, String(emps.filter((e) => String(e.dateOfJoining).startsWith(y)).length))}
        {stat(<UserMinus className="size-4" />, `Leavers ${y}`, String(emps.filter((e) => String(e.dateOfLeaving ?? "").startsWith(y)).length))}
        {stat(<Wallet className="size-4" />, "Monthly basic cost", money(monthly))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {box("Headcount by org unit", byOrg.length ? <Bars rows={byOrg} /> : <p className="text-muted-foreground">No data.</p>)}
        {box("Headcount by status", byStatus.length ? <Bars rows={byStatus} /> : <p className="text-muted-foreground">No data.</p>)}
        {box(`Leave usage (${y})`, usage.size ? <div className="space-y-2">{[...usage].map(([k, v]) => <div key={k}><div className="flex justify-between"><span>{k}</span><span className="tabular-nums text-muted-foreground">{v.used} / {v.allocated} days</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${v.allocated ? (v.used / v.allocated) * 100 : 0}%` }} /></div></div>)}</div> : <p className="text-muted-foreground">No allocations this year.</p>)}
        {box("HR cost vs GL (Finance)", <div className="space-y-1.5"><div className="flex justify-between"><span>HR monthly basic (active)</span><span className="tabular-nums">{money(monthly)}</span></div><div className="flex justify-between"><span>GL posted payroll gross</span><span className="tabular-nums">{money(glGross)}</span></div><div className="flex justify-between border-t border-border pt-1.5 font-medium"><span>Variance</span><span className="tabular-nums">{money(monthly - glGross)}</span></div><p className="text-xs text-muted-foreground">Bases differ (basic vs gross incl. allowances); variance is informational.</p></div>)}
        {box("Cost by org unit", costByOrg.size ? <Bars rows={[...costByOrg]} money /> : <p className="text-muted-foreground">No active salaries assigned.</p>)}
      </div>
      {box(<span className="flex items-center gap-2"><IdCard className="size-4" /> Expiring IDs (next 90 days)</span>, expiring.length ? <table className="w-full text-sm"><tbody>{expiring.map((x, i) => <tr key={i} className="border-b border-border last:border-0"><td className="py-1.5"><Link href={`/hr/employees/${x.e!.id}`} className="font-medium text-primary hover:underline">{fullName(x.e)}</Link></td><td>{x.label}</td><td>{fmtDate(x.date)}</td><td className={cn("text-right", daysUntil(x.date) < 0 ? "text-destructive" : daysUntil(x.date) <= 30 && "text-warning")}>{daysUntil(x.date) < 0 ? `expired ${-daysUntil(x.date)}d ago` : `${daysUntil(x.date)} days`}</td></tr>)}</tbody></table> : <p className="text-muted-foreground">No statutory IDs expiring in the next 90 days.</p>)}
    </div>
  );
}

/* ---------- employees ---------- */

const E_BASE = "/hr/employees";
const NONE = "";

function InlineText({ value, onSave, type = "text", className }: { value: unknown; onSave: (v: string) => void; type?: string; className?: string }) {
  const [edit, setEdit] = useState(false);
  const [v, setV] = useState(String(value ?? ""));
  if (!edit) return <button type="button" onClick={(e) => { e.stopPropagation(); setV(String(value ?? "")); setEdit(true); }} className={cn("min-h-6 w-full rounded px-1 text-left hover:bg-accent", !value && "text-muted-foreground", className)}>{String(value || "—")}</button>;
  return <input autoFocus type={type} value={v} onClick={(e) => e.stopPropagation()} onChange={(e) => setV(e.target.value)} onBlur={() => { setEdit(false); if (v !== String(value ?? "")) onSave(v); }} onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEdit(false); }} className={cn(inputCls, "h-7 px-1")} />;
}
function InlineSelect({ value, options, onSave }: { value: unknown; options: { value: string; label: string }[]; onSave: (v: string) => void }) {
  return <select value={String(value ?? "")} onClick={(e) => e.stopPropagation()} onChange={(e) => onSave(e.target.value)} aria-label="Edit value" className="h-7 w-full min-w-24 rounded bg-transparent px-1 text-sm hover:bg-accent">{options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>;
}

export function Employees() {
  const router = useRouter();
  const sub = subOf(usePathname(), E_BASE);
  const emps = useCollection("employees");
  const designations = useCollection("designations");
  const cats = useCollection("hr-categories");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [org, setOrg] = useState("ALL");
  const { node, flash } = useFlash();
  const [id, rest] = sub.split("/");
  if (sub === "import") return <EmployeeImport />;
  if (rest === "edit") return <EmployeeForm id={id} />;
  const close = () => router.push(E_BASE);
  const rows = emps.filter((e) => (status === "ALL" || e.status === status) && (org === "ALL" || e.orgUnitId === org) && (!q || `${fullName(e)} ${e.employeeNumber} ${e.email ?? ""}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => String(a.employeeNumber).localeCompare(String(b.employeeNumber)));
  const desOpts = [{ value: NONE, label: "— None —" }, ...designations.map((d) => ({ value: d.id, label: String(d.name) }))];
  const orgOpts = [{ value: NONE, label: "— None —" }, ...orgUnits().map((o) => ({ value: o.id, label: o.name }))];
  const catOpts = [{ value: NONE, label: "— None —" }, ...categoryTree(cats).map((c) => ({ value: c.id, label: `${"  ".repeat(c.depth)}${c.code} — ${c.name}` }))];
  const save = (e: Rec, f: string, v: string) => { updateEmployee(e.id, { [f]: v || null }); flash("Saved"); };
  function exportAll() {
    const head = ["Employee #", "First name", "Last name", "Email", "Phone", "Date of joining", "Designation", "Org unit", "Employment", "Status"];
    downloadFile("employees.xls", toExcelHTML(head, rows.map((e) => [String(e.employeeNumber), String(e.firstName), String(e.lastName), String(e.email ?? ""), String(e.phone ?? ""), String(e.dateOfJoining ?? ""), label(desOpts, e.designationId), orgUnitName(e.orgUnitId), label(EMPLOYMENT_TYPES, e.employmentType), label(EMP_STATUSES, e.status)])), "application/vnd.ms-excel");
    flash(`Exported ${rows.length} employee(s)`);
  }
  const detail = id && id !== "new" ? emps.find((e) => e.id === id) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Employees" subtitle="Manage your team — directory, contacts, employment details" actions={<>
        <button type="button" className={btn.outline} onClick={exportAll}><Download /> Export</button>
        <Link href={`${E_BASE}/import`} className={btn.outline}><Upload /> Import</Link>
        <Link href={`${E_BASE}/new`} className={btn.primary}><Plus /> New employee</Link>
      </>} />
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, number, email…" aria-label="Search employees" className={cn(inputCls, "max-w-xs")} />
          <Select value={status} onChange={setStatus} options={[{ value: "ALL", label: "All statuses" }, ...EMP_STATUSES]} className="w-40" ariaLabel="Status" />
          <Select value={org} onChange={setOrg} options={[{ value: "ALL", label: "All org units" }, ...orgUnits().map((o) => ({ value: o.id, label: o.name }))]} className="w-40" ariaLabel="Org unit" />
        </div>
        {rows.length === 0 ? <Empty icon={Users} title="No employees yet" text="Add your first employee to start managing payroll, leave and HR records." action={<Link href={`${E_BASE}/new`} className={btn.smPrimary}><Plus /> New employee</Link>} /> : <>
          <p className="text-xs text-muted-foreground">Click any field to edit it inline · double-click a row to open</p>
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><Th>Employee #</Th><Th>Name</Th><Th>Email</Th><Th>Phone</Th><Th>Designation</Th><Th>Org unit</Th><Th>Employment</Th><Th>Status</Th><Th>Category</Th><Th /></tr></thead>
            <tbody>{rows.map((e) => (
              <tr key={e.id} onDoubleClick={() => router.push(`${E_BASE}/${e.id}`)} className="border-b border-border hover:bg-muted/40">
                <td className="px-1 py-1 font-mono text-xs"><InlineText value={e.employeeNumber} onSave={(v) => save(e, "employeeNumber", v)} /></td>
                <td className="px-1 py-1"><div className="flex gap-1 font-medium"><InlineText value={e.firstName} onSave={(v) => save(e, "firstName", v)} /><InlineText value={e.lastName} onSave={(v) => save(e, "lastName", v)} /></div></td>
                <td className="px-1 py-1"><InlineText type="email" value={e.email} onSave={(v) => save(e, "email", v)} /></td>
                <td className="px-1 py-1"><InlineText value={e.phone} onSave={(v) => save(e, "phone", v)} /></td>
                <td className="px-1 py-1"><InlineSelect value={e.designationId} options={desOpts} onSave={(v) => save(e, "designationId", v)} /></td>
                <td className="px-1 py-1"><InlineSelect value={e.orgUnitId} options={orgOpts} onSave={(v) => save(e, "orgUnitId", v)} /></td>
                <td className="px-1 py-1"><InlineSelect value={e.employmentType} options={EMPLOYMENT_TYPES} onSave={(v) => save(e, "employmentType", v)} /></td>
                <td className="px-1 py-1"><InlineSelect value={e.status} options={EMP_STATUSES} onSave={(v) => save(e, "status", v)} /></td>
                <td className="px-1 py-1"><InlineSelect value={e.categoryId} options={catOpts} onSave={(v) => save(e, "categoryId", v)} /></td>
                <td className="px-1 py-1 text-right"><RowMenu items={[{ label: "Open", onSelect: () => router.push(`${E_BASE}/${e.id}`) }, { label: "Edit", onSelect: () => router.push(`${E_BASE}/${e.id}/edit`) }, { label: "Delete", destructive: true, onSelect: () => { const used = ["leave-requests", "attendance", "salaries"].some((c) => readCollection(c).some((x) => x.employeeId === e.id)); if (used) { if (confirm(`${fullName(e)} has HR records — mark as Terminated instead?`)) updateEmployee(e.id, { status: "TERMINATED" }); } else if (confirm(`Delete ${fullName(e)}?`)) deleteRecord("employees", e.id); } }]} /></td>
              </tr>
            ))}</tbody>
          </table></div>
        </>}
      </div></Card>
      {id === "new" && <SidePanel onClose={close}><EmployeeForm onDone={(eid) => router.push(`${E_BASE}/${eid}`)} onCancel={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><EmployeeProfile key={detail.id} emp={detail} /></SidePanel>}
      {node}
    </div>
  );
}

const BLANK_EMP = { firstName: "", lastName: "", email: "", phone: "", dateOfJoining: todayIso(), gender: "", employmentType: "PERMANENT", status: "ACTIVE", orgUnitId: "", designationId: "", categoryId: "", managerId: "", positionId: "", nationality: "", contractType: "", probationEnd: "", noticeDays: "", iban: "", emiratesId: "", emiratesIdExpiry: "", iqamaNo: "", visaNo: "", visaExpiry: "", labourCardNo: "", passportNo: "", passportExpiry: "", nationalId: "", niNumber: "", taxCode: "", niCategory: "", rtwStatus: "", rtwCheck: "", rtwExpiry: "", shareCode: "", settledStatus: "" };

function EmployeeForm({ id, onDone, onCancel }: { id?: string; onDone?: (id: string) => void; onCancel?: () => void }) {
  const router = useRouter();
  const emps = useCollection("employees");
  const designations = useCollection("designations");
  const positions = useCollection("positions");
  const cats = useCollection("hr-categories");
  const rec = id ? emps.find((e) => e.id === id) : undefined;
  const editing = !!id;
  const init = (r?: Rec) => Object.fromEntries(Object.entries(BLANK_EMP).map(([k, v]) => [k, r?.[k] != null ? String(r[k]) : v])) as typeof BLANK_EMP;
  const [f, setF] = useState(() => init(rec));
  const [loaded, setLoaded] = useState(rec?.id);
  if (rec && loaded !== rec.id) { setLoaded(rec.id); setF(init(rec)); }
  const [error, setError] = useState("");
  const back = () => (onCancel ? onCancel() : router.push(editing ? `${E_BASE}/${id}` : E_BASE));
  const set = (k: keyof typeof BLANK_EMP, v: string) => setF((x) => ({ ...x, [k]: v }));
  const input = (k: keyof typeof BLANK_EMP, l: string, type = "text", placeholder = "") => <Field label={l} htmlFor={`em-${k}`}><input id={`em-${k}`} type={type} value={f[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} className={inputCls} /></Field>;
  const date = (k: keyof typeof BLANK_EMP, l: string) => <div className="space-y-2"><Label>{l}</Label><DateInput value={f[k]} onChange={(v) => set(k, v)} /></div>;
  const select = (k: keyof typeof BLANK_EMP, l: string, opts: { value: string; label: string }[], placeholder = "—") => <div className="space-y-2"><Label>{l}</Label><Select value={f[k]} onChange={(v) => set(k, v)} placeholder={placeholder} options={opts} ariaLabel={l} /></div>;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.firstName.trim() || !f.lastName.trim()) return setError("First and last name are required.");
    if (f.email && emps.some((x) => x.id !== id && String(x.email ?? "").toLowerCase() === f.email.toLowerCase())) return setError(`Another employee already uses ${f.email}.`);
    if (f.managerId && f.managerId === id) return setError("An employee can't report to themselves.");
    const data = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === "" ? null : k === "noticeDays" ? num(v) : v]));
    if (editing) { updateEmployee(id!, data); router.push(`${E_BASE}/${id}`); return; }
    const emp = createEmployee(data);
    if (onDone) onDone(emp.id); else router.push(`${E_BASE}/${emp.id}`);
  }
  if (editing && !rec) return emps.length ? <p className="p-6 text-sm text-muted-foreground">Employee not found</p> : null;
  const next = `EMP-${String(readCollection("employees").length + 1).padStart(2, "0")}`;
  const others = emps.filter((x) => x.id !== id && isCurrent(x));
  return (
    <form onSubmit={submit} className="space-y-4">
      <button type="button" onClick={back} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back</button>
      <div><h1 className="text-2xl font-semibold tracking-tight">{editing ? "Edit Employee" : "New Employee"}</h1><p className="text-sm text-muted-foreground">{editing ? "Update employee details" : "Add an employee to the directory"}</p></div>
      <Card><div className="space-y-4 p-5">
        {!editing && <NumberBanner label="Employee #" value={next} />}
        <div className="grid gap-4 sm:grid-cols-2">{input("firstName", "First name *")}{input("lastName", "Last name *")}</div>
        <div className="grid gap-4 sm:grid-cols-2">{input("email", "Email", "email")}{input("phone", "Phone")}</div>
        <div className="grid gap-4 sm:grid-cols-3">{date("dateOfJoining", "Date of joining *")}{select("gender", "Gender", [["MALE", "Male"], ["FEMALE", "Female"], ["OTHER", "Other"], ["UNDISCLOSED", "Undisclosed"]].map(([v, l]) => ({ value: v, label: l })))}{select("employmentType", "Employment type", EMPLOYMENT_TYPES)}</div>
        <div className="grid gap-4 sm:grid-cols-3">{select("orgUnitId", "Org unit", orgUnits().map((o) => ({ value: o.id, label: o.name })))}{select("designationId", "Designation", designations.map((d) => ({ value: d.id, label: String(d.name) })))}{select("status", "Status", editing ? EMP_STATUSES : EMP_STATUSES.slice(0, 3))}</div>
        <div className="grid gap-4 sm:grid-cols-3">{select("categoryId", "Category", categoryTree(cats).map((c) => ({ value: c.id, label: `${"  ".repeat(c.depth)}${c.code} — ${c.name}` })))}{select("managerId", "Reports to", [{ value: "", label: "— None —" }, ...others.map((x) => ({ value: x.id, label: `${fullName(x)} (${x.employeeNumber})` }))])}{select("positionId", "Position", [{ value: "", label: "— None —" }, ...positions.map((p) => ({ value: p.id, label: `${p.code} — ${p.title}` }))])}</div>
      </div></Card>
      {editing && <>
        <Card><div className="space-y-4 p-5"><CardTitle className="text-base">Statutory / Region</CardTitle>
          <div className="grid gap-4 sm:grid-cols-3">{input("nationality", "Nationality")}{select("contractType", "Contract type", [{ value: "LIMITED", label: "Limited (fixed-term)" }, { value: "UNLIMITED", label: "Unlimited" }])}{date("probationEnd", "Probation end")}</div>
          <div className="grid gap-4 sm:grid-cols-2">{input("noticeDays", "Notice period (days)", "number")}{input("iban", "IBAN")}</div>
        </div></Card>
        <Card><div className="space-y-4 p-5"><CardTitle className="text-base">GCC IDs</CardTitle>
          <div className="grid gap-4 sm:grid-cols-3">{input("emiratesId", "Emirates ID")}{date("emiratesIdExpiry", "Emirates ID expiry")}{input("iqamaNo", "Iqama no.")}{input("visaNo", "Visa no.")}{date("visaExpiry", "Visa expiry")}{input("labourCardNo", "Labour card no.")}{input("passportNo", "Passport no.")}{date("passportExpiry", "Passport expiry")}{input("nationalId", "National ID")}</div>
        </div></Card>
        <Card><div className="space-y-4 p-5"><CardTitle className="text-base">UK payroll</CardTitle>
          <div className="grid gap-4 sm:grid-cols-3">{input("niNumber", "NI number")}{input("taxCode", "Tax code", "text", "e.g. 1257L")}{input("niCategory", "NI category", "text", "e.g. A")}</div>
          <div className="text-sm font-medium">Right to work</div>
          <div className="grid gap-4 sm:grid-cols-3">{input("rtwStatus", "RTW status", "text", "UK_CITIZEN / LIMITED / SETTLED")}{date("rtwCheck", "Check date")}{date("rtwExpiry", "Expiry date")}{input("shareCode", "Share code")}{input("settledStatus", "Settled status", "text", "SETTLED / PRE_SETTLED")}</div>
        </div></Card>
      </>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={back}>Cancel</button><button type="submit" className={btn.primary}>{editing ? "Save changes" : "Create employee"}</button></div>
    </form>
  );
}

const LETTERS = ["Offer Letter", "Appointment Letter", "Experience Certificate", "Salary Certificate", "Relieving Letter"];
const DOC_TYPES = ["PASSPORT", "VISA", "EMIRATES_ID", "CONTRACT", "CERTIFICATE", "OTHER"];

function EmployeeProfile({ emp: e }: { emp: Rec }) {
  const router = useRouter();
  const structures = useCollection("salary-structures");
  const emps = useCollection("employees");
  const salaries = useCollection("salaries").filter((s) => s.employeeId === e.id);
  const events = useCollection("employee-events").filter((x) => x.employeeId === e.id);
  const changes = useCollection("employee-changes").filter((x) => x.employeeId === e.id);
  const docs = useCollection("employee-documents").filter((d) => d.employeeId === e.id);
  const designations = useCollection("designations");
  const cats = useCollection("hr-categories");
  useCollection("leave-requests");
  useCollection("leave-types");
  const [tab, setTab] = useState("overview");
  const [asOf, setAsOf] = useState("");
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [sal, setSal] = useState({ basic: "", structure: "", effectiveFrom: todayIso(), notes: "" });
  const [docOpen, setDocOpen] = useState(false);
  const [doc, setDoc] = useState({ type: "PASSPORT", number: "", issuedOn: "", expiresOn: "", file: null as File | null });
  const [listDraft, setListDraft] = useState<Record<string, Record<string, string>>>({});
  const { node, flash } = useFlash();
  const cur = currentSalary(e.id, salaries);
  const des = designations.find((d) => d.id === e.designationId);
  const manager = emps.find((x) => x.id === e.managerId);
  const view = asOf ? employeeAsOf(e, asOf) : null;
  const catName = (id: unknown) => { const c = cats.find((x) => x.id === id); return c ? `${c.code} — ${c.name}` : "—"; };
  function letter(kind: string) {
    const w = window.open("", "_blank");
    if (!w) return;
    const body = kind === "Salary Certificate" ? `This is to certify that ${fullName(e)} (${e.employeeNumber}) is employed with us as ${des?.name ?? "an employee"} since ${fmtDate(e.dateOfJoining)}, drawing a monthly basic salary of ${money(num(cur?.basic))}.`
      : kind === "Experience Certificate" || kind === "Relieving Letter" ? `This is to certify that ${fullName(e)} (${e.employeeNumber}) worked with us as ${des?.name ?? "an employee"} from ${fmtDate(e.dateOfJoining)} to ${fmtDate(e.dateOfLeaving ?? todayIso())}. We wish them success in their future endeavours.`
      : `Dear ${fullName(e)},\n\nWe are pleased to confirm your ${kind === "Offer Letter" ? "offer of employment" : "appointment"} as ${des?.name ?? "a member of our team"}, effective ${fmtDate(e.dateOfJoining)}${cur ? `, at a monthly basic salary of ${money(num(cur.basic))}` : ""}.`;
    w.document.write(`<!doctype html><title>${kind}</title><body style="font:14px/1.6 Georgia,serif;max-width:640px;margin:60px auto;white-space:pre-line"><h2>${kind}</h2><p>${new Date().toLocaleDateString(undefined, { dateStyle: "long" })}</p><p>${body}</p><p style="margin-top:60px">Authorised signatory</p><script>print()</script></body>`);
    w.document.close();
  }
  function addDoc() {
    if (!doc.file) return flash("Choose a file first", true);
    if (doc.file.size > 2_000_000) return flash("File too large for browser storage (max 2 MB here)", true);
    const rd = new FileReader();
    rd.onload = () => { createRecord("employee-documents", { employeeId: e.id, type: doc.type, number: doc.number || undefined, issuedOn: doc.issuedOn || undefined, expiresOn: doc.expiresOn || undefined, fileName: doc.file!.name, mimeType: doc.file!.type, dataUrl: String(rd.result), verified: false }); setDocOpen(false); setDoc({ type: "PASSPORT", number: "", issuedOn: "", expiresOn: "", file: null }); flash("Document added"); };
    rd.readAsDataURL(doc.file);
  }
  const listEditor = (key: "dependents" | "education" | "experience", cols: [string, string][], emptyText: string, title: string) => {
    const rows = (e[key] as Record<string, string>[]) ?? [];
    const d = listDraft[key] ?? {};
    return (
      <Card><div className="space-y-2 p-5"><CardTitle className="text-base">{title}</CardTitle>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">{emptyText}</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border">{cols.map(([, l]) => <Th key={l}>{l}</Th>)}<Th /></tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border">{cols.map(([k]) => <td key={k} className="px-2 py-1.5">{k === "nominee" ? (r[k] ? "(nominee)" : "") : r[k] || "—"}</td>)}<td className="text-right"><button type="button" aria-label="Remove" className={btn.icon} onClick={() => updateRecord("employees", e.id, { [key]: rows.filter((_, j) => j !== i) })}><Trash2 /></button></td></tr>)}</tbody></table>}
        <div className="flex flex-wrap items-end gap-2">{cols.filter(([k]) => k !== "nominee").map(([k, l]) => <input key={k} placeholder={l} aria-label={l} value={d[k] ?? ""} onChange={(ev) => setListDraft({ ...listDraft, [key]: { ...d, [k]: ev.target.value } })} className={cn(inputCls, "h-8 w-36")} />)}{key === "dependents" && <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={d.nominee === "1"} onChange={(ev) => setListDraft({ ...listDraft, [key]: { ...d, nominee: ev.target.checked ? "1" : "" } })} /> Nominee</label>}<button type="button" className={btn.smOutline} onClick={() => { if (!Object.values(d).some(Boolean)) return; updateRecord("employees", e.id, { [key]: [...rows, d] }); setListDraft({ ...listDraft, [key]: {} }); }}><Plus /> Add</button></div>
      </div></Card>
    );
  };
  const tabs = [["overview", "Overview"], ["personal", "Personal"], ["compensation", "Compensation"], ["documents", "Documents"], ["payslips", "Payslips"], ["history", "History"]];
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => router.push(E_BASE)} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back</button>
      <PageHeader title={fullName(e)} subtitle={`${e.employeeNumber}${des ? ` · ${des.name}` : ""}`} actions={<>
        <select aria-label="Generate letter" defaultValue="" onChange={(ev) => { if (ev.target.value) letter(ev.target.value); ev.target.value = ""; }} className="h-9 rounded-md border border-input bg-background px-2 text-sm"><option value="">Letters…</option>{LETTERS.map((l) => <option key={l}>{l}</option>)}</select>
        <Link href={`${E_BASE}/${e.id}/edit`} className={btn.outline}><Pencil /> Edit</Link>
      </>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><div className="p-4"><div className="text-xs text-muted-foreground">Status</div><div className="mt-1"><StatusBadge status={view ? view.status ?? (view.employed ? e.status : "NOT_JOINED") : e.status} /></div></div></Card>
        <Card><div className="p-4"><div className="text-xs text-muted-foreground">Employment</div><div className="mt-1 font-medium">{label(EMPLOYMENT_TYPES, e.employmentType)}</div></div></Card>
        <Card><div className="p-4"><div className="text-xs text-muted-foreground">Joined</div><div className="mt-1 font-medium">{fmtDate(e.dateOfJoining)}</div></div></Card>
      </div>
      <div role="tablist" className="inline-flex flex-wrap rounded-lg bg-muted p-1 text-sm">{tabs.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", tab === v && "bg-background text-foreground shadow")}>{l}</button>)}</div>
      {tab === "overview" && <div className="grid gap-4 md:grid-cols-2">
        <Card><div className="space-y-2 p-5 text-sm"><CardTitle className="text-base">Employment details</CardTitle>
          {asOf && <p className="rounded bg-warning/10 px-2 py-1 text-xs text-warning">Viewing record as of {fmtDate(asOf)}</p>}
          {([["Status", view ? label(EMP_STATUSES, view.status) : label(EMP_STATUSES, e.status)], ["Designation", view ? designations.find((d) => d.id === view.designationId)?.name ?? "—" : des?.name ?? "—"], ["Org unit", orgUnitName(view ? view.orgUnitId : e.orgUnitId)], ["Manager", fullName(emps.find((x) => x.id === (view ? view.managerId : e.managerId)))], ["Category", catName(view ? view.categoryId : e.categoryId)], ["Date of joining", fmtDate(e.dateOfJoining)], ["Date of leaving", fmtDate(e.dateOfLeaving)]] as [string, unknown][]).map(([k, v]) => <div key={k} className="flex justify-between gap-4"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{String(v)}</span></div>)}
          <div className="flex items-end gap-2 border-t border-border pt-3"><div className="flex-1 space-y-1"><Label className="text-xs">View record as of a date</Label><DateInput value={asOf} onChange={setAsOf} /></div>{asOf && <button type="button" className={btn.smOutline} onClick={() => setAsOf("")}>Back to today</button>}</div>
        </div></Card>
        <Card><div className="space-y-2 p-5 text-sm"><CardTitle className="text-base">Contact</CardTitle>
          <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{String(e.email || "—")}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{String(e.phone || "—")}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Reports to</span><span>{manager ? fullName(manager) : "—"}</span></div>
          <CardTitle className="pt-3 text-base">Leave balances ({year()})</CardTitle>
          {leaveBalances(e.id).length === 0 ? <p className="text-muted-foreground">No leave allocations yet for this year.</p> : <table className="w-full"><thead><tr className="text-xs text-muted-foreground"><td>Type</td><td className="text-right">Allocated</td><td className="text-right">Used</td><td className="text-right">Balance</td></tr></thead><tbody>{leaveBalances(e.id).map((b) => <tr key={b.typeId}><td>{b.name}</td><td className="text-right">{b.allocated}</td><td className="text-right">{b.used}</td><td className="text-right font-medium">{b.balance}</td></tr>)}</tbody></table>}
        </div></Card>
      </div>}
      {tab === "personal" && <div className="space-y-4">
        {listEditor("dependents", [["name", "Name"], ["relation", "Relation"], ["dob", "Date of birth"], ["nominee", "Nominee"]], "None.", "Dependents")}
        {listEditor("education", [["qualification", "Qualification"], ["institution", "Institution"], ["year", "Year"]], "None.", "Education")}
        {listEditor("experience", [["organisation", "Organisation"], ["designation", "Designation"], ["from", "From"], ["to", "To"]], "None.", "Prior experience")}
      </div>}
      {tab === "compensation" && <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between"><CardTitle className="text-base">Compensation</CardTitle><button type="button" className={btn.smPrimary} onClick={() => setSalaryOpen(true)}><Plus /> Assign salary</button></div>
        {cur ? <div className="grid gap-4 sm:grid-cols-3 text-sm"><div><div className="text-xs text-muted-foreground">Basic salary</div><div className="text-xl font-semibold">{money(num(cur.basic))}</div></div><div><div className="text-xs text-muted-foreground">Structure</div><div>{String(structures.find((s) => s.id === cur.structure)?.name ?? "None (basic only)")}</div></div><div><div className="text-xs text-muted-foreground">Effective from</div><div>{fmtDate(cur.effectiveFrom)}</div></div></div> : <p className="text-sm text-muted-foreground">No salary assigned yet.</p>}
        {des && cur && (num(cur.basic) < num(des.minBasic) || (num(des.maxBasic) > 0 && num(cur.basic) > num(des.maxBasic))) && <p className="text-xs text-warning">Outside the {String(des.name)} range ({money(num(des.minBasic))} – {money(num(des.maxBasic))}).</p>}
        <div className="font-medium">Salary history</div>
        {salaries.length === 0 ? <p className="text-sm text-muted-foreground">No salary records yet.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Effective from</Th><Th>Basic</Th><Th>Structure</Th><Th>Notes</Th><Th /></tr></thead><tbody>{[...salaries].sort((a, b) => String(b.effectiveFrom).localeCompare(String(a.effectiveFrom))).map((s) => <tr key={s.id} className="border-b border-border"><td className="px-2 py-1.5">{fmtDate(s.effectiveFrom)}</td><td className="px-2 py-1.5 tabular-nums">{money(num(s.basic))}</td><td className="px-2 py-1.5">{String(structures.find((x) => x.id === s.structure)?.name ?? "—")}</td><td className="px-2 py-1.5 text-muted-foreground">{String(s.notes || "—")}</td><td className="px-2 py-1.5">{s.id === cur?.id && <Pill className="text-success">Active</Pill>}</td></tr>)}</tbody></table>}
      </div></Card>}
      {tab === "documents" && <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between"><div><CardTitle className="text-base">Documents</CardTitle><p className="text-xs text-muted-foreground">Passports, visas, contracts &amp; certificates</p></div><button type="button" className={btn.smPrimary} onClick={() => setDocOpen(true)}><Plus /> New document</button></div>
        {docs.length === 0 ? <Empty icon={FileText} title="No documents yet" text="Add passports, visas, contracts and certificates with expiry tracking." /> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Type</Th><Th>Number</Th><Th>Issued</Th><Th>Expires</Th><Th>File</Th><Th /></tr></thead><tbody>{docs.map((d) => <tr key={d.id} className="border-b border-border"><td className="px-2 py-1.5">{String(d.type).replace(/_/g, " ")}</td><td className="px-2 py-1.5">{String(d.number || "—")}</td><td className="px-2 py-1.5">{fmtDate(d.issuedOn)}</td><td className={cn("px-2 py-1.5", Boolean(d.expiresOn) && daysUntil(d.expiresOn) < 30 && "text-destructive")}>{fmtDate(d.expiresOn)}</td><td className="px-2 py-1.5">{String(d.fileName)} {d.verified ? <Pill className="ml-1 text-success"><CheckCircle2 className="mr-1 size-3" />Verified</Pill> : <Pill className="ml-1">Unverified</Pill>}</td><td className="px-2 py-1.5"><RowMenu items={[...(!d.verified ? [{ label: "Mark verified", onSelect: () => updateRecord("employee-documents", d.id, { verified: true }) }] : []), { label: "Download", onSelect: () => { const a = document.createElement("a"); a.href = String(d.dataUrl); a.download = String(d.fileName); a.click(); } }, { label: "Delete", destructive: true, onSelect: () => deleteRecord("employee-documents", d.id) }]} /></td></tr>)}</tbody></table>}
      </div></Card>}
      {tab === "payslips" && <Card><div className="p-5 text-sm text-muted-foreground">No payslips yet — they appear here once payroll runs are posted. <Link href="/payroll/runs" className="text-primary hover:underline">Go to payroll runs →</Link></div></Card>}
      {tab === "history" && <div className="grid gap-4 md:grid-cols-2">
        <Card><div className="space-y-2 p-5"><CardTitle className="text-base">Lifecycle events</CardTitle>{events.length === 0 ? <p className="text-sm text-muted-foreground">No lifecycle events recorded yet.</p> : <ol className="space-y-2 text-sm">{[...events].sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate))).map((x) => <li key={x.id} className="flex gap-2"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /><div><div className="font-medium">{String(x.detail)}</div><div className="text-xs text-muted-foreground">{fmtDate(x.effectiveDate)}</div></div></li>)}</ol>}</div></Card>
        <Card><div className="space-y-2 p-5"><CardTitle className="text-base">Effective-dated changes</CardTitle>{changes.length === 0 ? <p className="text-sm text-muted-foreground">No dated changes recorded yet.</p> : <table className="w-full text-sm"><tbody>{[...changes].sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate))).map((c) => { const show = (v: unknown): string => c.field === "designationId" ? String(designations.find((d) => d.id === v)?.name ?? "—") : c.field === "orgUnitId" ? orgUnitName(v) : c.field === "managerId" ? fullName(emps.find((x) => x.id === v)) : c.field === "categoryId" ? catName(v) : String(v ?? "—"); return <tr key={c.id} className="border-b border-border"><td className="py-1.5 text-muted-foreground">{fmtDate(c.effectiveDate)}</td><td>{String(c.field).replace(/Id$/, "")}</td><td>{show(c.from)} → <span className="font-medium">{show(c.to)}</span></td></tr>; })}</tbody></table>}</div></Card>
      </div>}
      <Dialog open={salaryOpen} onClose={() => setSalaryOpen(false)} title="Assign salary">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Salary structure</Label><Select value={sal.structure} onChange={(v) => setSal({ ...sal, structure: v })} options={[{ value: "", label: "None (basic only)" }, ...structures.filter((s) => s.isActive !== false).map((s) => ({ value: s.id, label: `${s.code} — ${s.name}` }))]} ariaLabel="Salary structure" /></div>
          <Field label="Basic salary *" htmlFor="sal-basic"><input id="sal-basic" type="number" step="0.001" value={sal.basic} onChange={(ev) => setSal({ ...sal, basic: ev.target.value })} className={inputCls} /></Field>
          <div className="space-y-1.5"><Label>Effective from *</Label><DateInput value={sal.effectiveFrom} onChange={(v) => setSal({ ...sal, effectiveFrom: v })} /></div>
          <Field label="Notes" htmlFor="sal-notes"><input id="sal-notes" value={sal.notes} onChange={(ev) => setSal({ ...sal, notes: ev.target.value })} className={inputCls} /></Field>
          {des && num(sal.basic) > 0 && num(sal.basic) < num(des.minBasic) && <p className="text-xs text-warning">Below the designation minimum of {money(num(des.minBasic))}.</p>}
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setSalaryOpen(false)}>Cancel</button><button type="button" className={btn.primary} onClick={() => { if (!num(sal.basic) || !sal.effectiveFrom) return flash("Basic salary and effective-from are required", true); assignSalary(e.id, { basic: num(sal.basic), structure: sal.structure || undefined, effectiveFrom: sal.effectiveFrom, notes: sal.notes || undefined }); setSalaryOpen(false); setSal({ basic: "", structure: "", effectiveFrom: todayIso(), notes: "" }); flash("Salary assigned"); }}>Assign salary</button></div>
      </Dialog>
      <Dialog open={docOpen} onClose={() => setDocOpen(false)} title="New document">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Type</Label><Select value={doc.type} onChange={(v) => setDoc({ ...doc, type: v })} options={DOC_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, " ") }))} ariaLabel="Type" /></div>
          <Field label="Document number" htmlFor="doc-num"><input id="doc-num" value={doc.number} placeholder="Optional" onChange={(ev) => setDoc({ ...doc, number: ev.target.value })} className={inputCls} /></Field>
          <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Issued on</Label><DateInput value={doc.issuedOn} onChange={(v) => setDoc({ ...doc, issuedOn: v })} /></div><div className="space-y-1.5"><Label>Expires on</Label><DateInput value={doc.expiresOn} onChange={(v) => setDoc({ ...doc, expiresOn: v })} /></div></div>
          <Field label="File *" htmlFor="doc-file"><input id="doc-file" type="file" onChange={(ev) => setDoc({ ...doc, file: ev.target.files?.[0] ?? null })} className="text-sm" /></Field>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setDocOpen(false)}>Cancel</button><button type="button" className={btn.primary} onClick={addDoc}>Add document</button></div>
      </Dialog>
      {node}
    </div>
  );
}

function EmployeeImport() {
  const router = useRouter();
  const designations = useCollection("designations");
  const [rows, setRows] = useState<{ data: Record<string, string>; result?: string }[]>([]);
  const [error, setError] = useState("");
  async function load(file: File) {
    if (!/\.csv$/i.test(file.name)) return setError("Use a .csv file (save Excel sheets as CSV).");
    const parsed = parseCsv(await file.text());
    if (!parsed.length) return setError("No rows found");
    if (!("firstname" in parsed[0]) || !("lastname" in parsed[0])) return setError("Include First Name and Last Name columns.");
    setError(""); setRows(parsed.map((data) => ({ data })));
  }
  function run() {
    const emps = readCollection("employees");
    setRows(rows.map(({ data: d }) => {
      try {
        const des = designations.find((x) => String(x.name).toLowerCase() === (d.designation ?? "").toLowerCase());
        const org = orgUnits().find((o) => o.name.toLowerCase() === (d.orgunit ?? "").toLowerCase());
        const type = EMPLOYMENT_TYPES.find((t) => [t.value.toLowerCase(), t.label.toLowerCase()].includes((d.employmenttype ?? "").toLowerCase()));
        const st = EMP_STATUSES.find((t) => [t.value.toLowerCase(), t.label.toLowerCase()].includes((d.status ?? "").toLowerCase()));
        const data = { firstName: d.firstname, lastName: d.lastname, email: d.email || null, phone: d.phone || null, dateOfJoining: d.dateofjoining || todayIso(), designationId: des?.id ?? null, orgUnitId: org?.id ?? null, employmentType: type?.value ?? "PERMANENT", status: st?.value ?? "ACTIVE" };
        const existing = emps.find((x) => (d.employeenumber && x.employeeNumber === d.employeenumber) || (d.email && String(x.email ?? "").toLowerCase() === d.email.toLowerCase()));
        if (!d.firstname || !d.lastname) return { data: d, result: "Skipped — name missing" };
        if (existing) { updateEmployee(existing.id, data); return { data: d, result: `Updated ${existing.employeeNumber}` }; }
        const e = createEmployee({ ...data, employeeNumber: d.employeenumber || undefined });
        return { data: d, result: `Created ${e.employeeNumber}` };
      } catch (err) { return { data: d, result: `Error — ${(err as Error).message}` }; }
    }));
  }
  const done = rows.some((r) => r.result);
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => router.push(E_BASE)} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back</button>
      <PageHeader title="Import Employees" subtitle="Upload a CSV file to add or update many employees at once." actions={<button type="button" className={btn.outline} onClick={() => downloadFile("employees-template.csv", "Employee Number,First Name,Last Name,Email,Phone,Date of Joining,Employment Type,Status,Designation,Org unit\n", "text/csv")}><Download /> Template</button>} />
      <Card><div className="space-y-2 p-5">
        <div className="font-medium">1. Choose a file</div>
        <p className="text-sm text-muted-foreground">Required: <strong>First Name</strong>, <strong>Last Name</strong>. Optional: Employee Number, Email, Phone, Date of Joining (YYYY-MM-DD), Employment Type, Status, Designation, Org unit. Rows matching an existing employee number or email are updated.</p>
        <input type="file" accept=".csv" aria-label="CSV file" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} className="text-sm" />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div></Card>
      {rows.length > 0 && <Card><div className="space-y-3 p-5">
        <div className="font-medium">2. Review {rows.length} row(s)</div>
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Emp #</Th><Th>First</Th><Th>Last</Th><Th>Email</Th><Th>Designation</Th><Th>Org unit</Th><Th>Result</Th></tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-1.5">{r.data.employeenumber || "auto"}</td><td className="px-2 py-1.5">{r.data.firstname}</td><td className="px-2 py-1.5">{r.data.lastname}</td><td className="px-2 py-1.5">{r.data.email}</td><td className="px-2 py-1.5">{r.data.designation}</td><td className="px-2 py-1.5">{r.data.orgunit}</td><td className={cn("px-2 py-1.5", r.result?.startsWith("Error") && "text-destructive")}>{r.result ?? "—"}</td></tr>)}</tbody></table>
        {done ? <Link href={E_BASE} className={btn.primary}>Done — view employees</Link> : <button type="button" className={btn.primary} onClick={run}>Import {rows.length} employee(s)</button>}
      </div></Card>}
    </div>
  );
}

/* ---------- categories ---------- */

export function Categories() {
  const cats = useCollection("hr-categories");
  const emps = useCollection("employees");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<{ parentId: string | null } | null>(null);
  const [draft, setDraft] = useState({ code: "", name: "" });
  const { node, flash } = useFlash();
  const tree = categoryTree(cats);
  const hidden = (c: Rec & { depth: number }) => { let p = cats.find((x) => x.id === c.parentId); while (p) { if (collapsed.has(p.id)) return true; p = cats.find((x) => x.id === p!.parentId); } return false; };
  function save() {
    if (!draft.code.trim() || !draft.name.trim()) return;
    if (cats.some((c) => String(c.code).toLowerCase() === draft.code.trim().toLowerCase())) return flash(`Code ${draft.code} already exists`, true);
    createRecord("hr-categories", { code: draft.code.trim(), name: draft.name.trim(), parentId: adding?.parentId ?? null });
    setAdding(null); setDraft({ code: "", name: "" }); flash("Category created");
  }
  const editor = (depth: number) => <tr className="bg-muted/40"><td className="px-2 py-1.5" style={{ paddingLeft: 8 + depth * 20 }}><input autoFocus placeholder="Code" aria-label="Code" value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} className={cn(inputCls, "h-8 w-28")} /></td><td className="px-2 py-1.5"><div className="flex gap-2"><input placeholder="New category name…" aria-label="Category name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} onKeyDown={(e) => e.key === "Enter" && save()} className={cn(inputCls, "h-8")} /><button type="button" className={btn.smPrimary} onClick={save}>Save</button><button type="button" className={btn.smOutline} onClick={() => setAdding(null)}>Cancel</button></div></td></tr>;
  return (
    <div className="space-y-4">
      <PageHeader title="Employee Categories" subtitle="Organise employees into a nested category tree (code + name)" />
      <Card><div className="space-y-3 p-5">
        <p className="text-xs text-muted-foreground">Hover a row for “+” to add a sub-category, or use “Add top-level”.</p>
        <div className="flex justify-end gap-2"><button type="button" className={btn.smOutline} onClick={() => { setAdding({ parentId: null }); setDraft({ code: "", name: "" }); }}><Plus /> Add top-level</button><button type="button" className={btn.smOutline} onClick={() => setCollapsed(new Set())}><ChevronsUpDown /> Expand all</button><button type="button" className={btn.smOutline} onClick={() => setCollapsed(new Set(cats.map((c) => c.id)))}><ChevronsUpDown /> Collapse all</button></div>
        <div className="rounded-md border border-border"><table className="w-full text-sm"><thead><tr className="border-b border-border bg-muted/50 text-xs uppercase"><Th className="w-48">Code</Th><Th>Category</Th></tr></thead><tbody>
          {adding && adding.parentId === null && editor(0)}
          {tree.length === 0 && !adding && <tr><td colSpan={2} className="p-8 text-center text-muted-foreground">No categories yet. Use “Add top-level” to create your first one.</td></tr>}
          {tree.filter((c) => !hidden(c)).map((c) => { const kids = cats.some((x) => x.parentId === c.id); const count = emps.filter((e) => e.categoryId === c.id).length; return [
            <tr key={c.id} className="group border-b border-border hover:bg-muted/40">
              <td className="px-2 py-1.5 font-mono text-xs" style={{ paddingLeft: 8 + c.depth * 20 }}><span className="inline-flex items-center gap-1">{kids ? <button type="button" aria-label={collapsed.has(c.id) ? "Expand" : "Collapse"} onClick={() => setCollapsed((s) => { const n = new Set(s); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })}>{collapsed.has(c.id) ? <ChevronRight className="size-3.5" /> : <ChevronDown className="size-3.5" />}</button> : <span className="w-3.5" />}{String(c.code)}</span></td>
              <td className="px-2 py-1.5"><div className="flex items-center justify-between"><span>{String(c.name)}{count > 0 && <span className="ml-2 text-xs text-muted-foreground">{count} employee{count > 1 ? "s" : ""}</span>}</span><span className="flex gap-1 opacity-0 group-hover:opacity-100"><button type="button" title="Add a sub-category under this one" aria-label={`Add sub-category under ${c.name}`} className={btn.icon} onClick={() => { setAdding({ parentId: c.id }); setDraft({ code: `${c.code}-`, name: "" }); setCollapsed((s) => { const n = new Set(s); n.delete(c.id); return n; }); }}><Plus /></button><button type="button" title="Delete category" aria-label={`Delete ${c.name}`} className={btn.icon} onClick={() => (kids || count ? flash("Remove its sub-categories and employees first", true) : deleteRecord("hr-categories", c.id))}><Trash2 /></button></span></div></td>
            </tr>,
            adding?.parentId === c.id ? <Frag key={`${c.id}-add`}>{editor(c.depth + 1)}</Frag> : null,
          ]; })}
        </tbody></table></div>
      </div></Card>
      {node}
    </div>
  );
}
const Frag = ({ children }: { children: React.ReactNode }) => <>{children}</>;

/* ---------- designations, positions, comp bands ---------- */

const D_BASE = "/hr/designations";
export function Designations() {
  const router = useRouter();
  const sub = subOf(usePathname(), D_BASE);
  const rows = useCollection("designations");
  const emps = useCollection("employees");
  const close = () => router.push(D_BASE);
  const [id] = sub.split("/");
  const editing = sub.endsWith("/edit") ? rows.find((d) => d.id === id) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Designations" subtitle="Job titles and pay-grade defaults" actions={<Link href={`${D_BASE}/new`} className={btn.primary}><Plus /> New designation</Link>} />
      <Card><div className="p-5">{rows.length === 0 ? <Empty icon={Briefcase} title="No designations yet" /> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Code</Th><Th>Name</Th><Th>Min basic</Th><Th>Max basic</Th><Th /></tr></thead><tbody>{rows.map((d) => <tr key={d.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(d.code)}</td><td className="px-2 py-2 font-medium">{String(d.name)}</td><td className="px-2 py-2 tabular-nums">{d.minBasic != null ? money(num(d.minBasic)) : "—"}</td><td className="px-2 py-2 tabular-nums">{d.maxBasic != null ? money(num(d.maxBasic)) : "—"}</td><td className="px-2 py-2 text-right"><RowMenu items={[{ label: "Edit", onSelect: () => router.push(`${D_BASE}/${d.id}/edit`) }, { label: "Delete", destructive: true, onSelect: () => (emps.some((e) => e.designationId === d.id) ? alert(`${d.name} is used by employees.`) : confirm(`Delete ${d.name}?`) && deleteRecord("designations", d.id)) }]} /></td></tr>)}</tbody></table>}</div></Card>
      {(sub === "new" || editing) && <SidePanel onClose={close}><DesignationForm key={editing?.id ?? "new"} rec={editing} onDone={close} /></SidePanel>}
    </div>
  );
}
function DesignationForm({ rec, onDone }: { rec?: Rec; onDone: () => void }) {
  const [f, setF] = useState({ code: String(rec?.code ?? ""), name: String(rec?.name ?? ""), minBasic: rec?.minBasic != null ? String(rec.minBasic) : "", maxBasic: rec?.maxBasic != null ? String(rec.maxBasic) : "" });
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.code.trim() || !f.name.trim()) return setError("Code and name are required.");
    if (f.minBasic && f.maxBasic && num(f.minBasic) > num(f.maxBasic)) return setError("Min basic can't exceed max basic.");
    if (readCollection("designations").some((d) => d.id !== rec?.id && String(d.code).toLowerCase() === f.code.trim().toLowerCase())) return setError(`Code ${f.code} is already used.`);
    const data = { code: f.code.trim(), name: f.name.trim(), minBasic: f.minBasic ? num(f.minBasic) : null, maxBasic: f.maxBasic ? num(f.maxBasic) : null };
    if (rec) updateRecord("designations", rec.id, data); else createRecord("designations", data);
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">{rec ? "Edit Designation" : "New Designation"}</h1><p className="text-sm text-muted-foreground">Add a job title and pay-grade defaults</p></div>
      <Card className="max-w-xl"><div className="space-y-4 p-5"><CardTitle>Designation Details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Code *" htmlFor="ds-code"><input id="ds-code" autoFocus value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className={inputCls} /></Field><Field label="Name *" htmlFor="ds-name"><input id="ds-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Min basic" htmlFor="ds-min"><input id="ds-min" type="number" step="0.001" value={f.minBasic} onChange={(e) => setF({ ...f, minBasic: e.target.value })} className={inputCls} /></Field><Field label="Max basic" htmlFor="ds-max"><input id="ds-max" type="number" step="0.001" value={f.maxBasic} onChange={(e) => setF({ ...f, maxBasic: e.target.value })} className={inputCls} /></Field></div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="submit" className={btn.primary}>{rec ? "Save" : "Create"}</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </div></Card>
    </form>
  );
}

export function Positions() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/hr/positions");
  const rows = useCollection("positions");
  const emps = useCollection("employees");
  const [id] = sub.split("/");
  if (sub === "new" || sub.endsWith("/edit")) return <PositionForm key={sub} rec={rows.find((p) => p.id === id)} editing={sub !== "new"} />;
  return (
    <div className="space-y-4">
      <PageHeader title="Positions" subtitle="Job slots (title, org unit, grade, FTE) — they can exist with no person." actions={<Link href="/hr/positions/new" className={btn.primary}><Plus /> New position</Link>} />
      <Card><div className="p-5">{rows.length === 0 ? <Empty icon={Briefcase} title="No positions yet" /> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Code</Th><Th>Title</Th><Th>Org unit</Th><Th>Grade</Th><Th>FTE</Th><Th>Filled / Budget</Th><Th /></tr></thead><tbody>{rows.map((p) => { const filled = emps.filter((e) => e.positionId === p.id && isCurrent(e)).length; return <tr key={p.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(p.code)}</td><td className="px-2 py-2 font-medium">{String(p.title)}</td><td className="px-2 py-2">{orgUnitName(p.orgUnitId)}</td><td className="px-2 py-2">{String(p.grade || "—")}</td><td className="px-2 py-2">{num(p.fte)}</td><td className={cn("px-2 py-2", filled > num(p.budget) && "text-destructive")}>{filled} / {num(p.budget)}</td><td className="px-2 py-2 text-right"><RowMenu items={[{ label: "Edit", onSelect: () => router.push(`/hr/positions/${p.id}/edit`) }, { label: "Delete", destructive: true, onSelect: () => (filled ? alert("Position is filled.") : confirm(`Delete ${p.title}?`) && deleteRecord("positions", p.id)) }]} /></td></tr>; })}</tbody></table>}</div></Card>
    </div>
  );
}
function PositionForm({ rec, editing }: { rec?: Rec; editing: boolean }) {
  const router = useRouter();
  const bands = useCollection("comp-bands");
  const [f, setF] = useState({ code: String(rec?.code ?? ""), title: String(rec?.title ?? ""), orgUnitId: String(rec?.orgUnitId ?? ""), grade: String(rec?.grade ?? ""), fte: String(rec?.fte ?? "1"), budget: String(rec?.budget ?? "1") });
  const [error, setError] = useState("");
  if (editing && !rec) return null;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.code.trim() || !f.title.trim()) return setError("Code and title are required.");
    const data = { code: f.code.trim(), title: f.title.trim(), orgUnitId: f.orgUnitId || null, grade: f.grade || null, fte: num(f.fte) || 1, budget: num(f.budget) || 1 };
    if (rec) updateRecord("positions", rec.id, data); else createRecord("positions", data);
    router.push("/hr/positions");
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHeader title={editing ? "Edit Position" : "New Position"} subtitle="Define a job slot" />
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle>Position Details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Code *" htmlFor="ps-code"><input id="ps-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} className={inputCls} /></Field><Field label="Title *" htmlFor="ps-title"><input id="ps-title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} /></Field></div>
        <div className="space-y-2"><Label>Org unit</Label><Select value={f.orgUnitId} onChange={(v) => setF({ ...f, orgUnitId: v })} options={[{ value: "", label: "— None —" }, ...orgUnits().map((o) => ({ value: o.id, label: o.name }))]} ariaLabel="Org unit" /></div>
        <div className="grid gap-4 sm:grid-cols-3"><Field label="Grade" htmlFor="ps-grade"><input id="ps-grade" list="grades" value={f.grade} onChange={(e) => setF({ ...f, grade: e.target.value })} className={inputCls} /><datalist id="grades">{bands.map((b) => <option key={b.id} value={String(b.grade)} />)}</datalist></Field><Field label="FTE" htmlFor="ps-fte"><input id="ps-fte" type="number" step="0.1" value={f.fte} onChange={(e) => setF({ ...f, fte: e.target.value })} className={inputCls} /></Field><Field label="Budgeted headcount" htmlFor="ps-bud"><input id="ps-bud" type="number" value={f.budget} onChange={(e) => setF({ ...f, budget: e.target.value })} className={inputCls} /></Field></div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="submit" className={btn.primary}>{editing ? "Save" : "Create"}</button><button type="button" className={btn.outline} onClick={() => router.push("/hr/positions")}>Cancel</button></div>
      </div></Card>
    </form>
  );
}

export function CompBands() {
  const rows = useCollection("comp-bands");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ code: "", grade: "", min: "", mid: "", max: "" });
  const { node, flash } = useFlash();
  function create() {
    if (!f.code.trim() || !f.grade.trim()) return;
    if (f.min && f.max && num(f.min) > num(f.max)) return flash("Min can't exceed max", true);
    createRecord("comp-bands", { code: f.code.trim(), grade: f.grade.trim(), min: num(f.min), mid: f.mid ? num(f.mid) : (num(f.min) + num(f.max)) / 2, max: num(f.max) });
    setOpen(false); setF({ code: "", grade: "", min: "", mid: "", max: "" }); flash("Band created");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Compensation Bands" subtitle="Salary ranges per grade (min / mid / max)." actions={<button type="button" className={btn.primary} onClick={() => setOpen(true)}><Plus /> New band</button>} />
      <Card><div className="p-5">{rows.length === 0 ? <Empty icon={Wallet} title="No bands yet" /> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Code</Th><Th>Grade</Th><Th>Min</Th><Th>Mid</Th><Th>Max</Th><Th /></tr></thead><tbody>{rows.map((b) => <tr key={b.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(b.code)}</td><td className="px-2 py-2 font-medium">{String(b.grade)}</td><td className="px-2 py-2 tabular-nums">{money(num(b.min))}</td><td className="px-2 py-2 tabular-nums">{money(num(b.mid))}</td><td className="px-2 py-2 tabular-nums">{money(num(b.max))}</td><td className="px-2 py-2 text-right"><RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => deleteRecord("comp-bands", b.id) }]} /></td></tr>)}</tbody></table>}</div></Card>
      <Dialog open={open} onClose={() => setOpen(false)} title="New compensation band">
        <div className="grid gap-3 sm:grid-cols-2">{([["code", "Code *"], ["grade", "Grade *"], ["min", "Min"], ["mid", "Mid"], ["max", "Max"]] as const).map(([k, l]) => <Field key={k} label={l} htmlFor={`cb-${k}`}><input id={`cb-${k}`} type={k === "code" || k === "grade" ? "text" : "number"} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls} /></Field>)}</div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setOpen(false)}>Cancel</button><button type="button" className={btn.primary} disabled={!f.code.trim() || !f.grade.trim()} onClick={create}>Create</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- merit cycles ---------- */

export function MeritCycles() {
  const cycles = useCollection("merit-cycles");
  const emps = useCollection("employees");
  const salaries = useCollection("salaries");
  const [sel, setSel] = useState<string | null>(null);
  const [nc, setNc] = useState({ name: "", effectiveDate: "" });
  const [line, setLine] = useState({ employeeId: "", newBasic: "" });
  const { node, flash } = useFlash();
  const c = cycles.find((x) => x.id === sel);
  const lines = (c?.lines as Rec[]) ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="Merit Cycles" subtitle="Plan salary increments; finalizing applies new basic salaries." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><div className="space-y-2 p-5"><CardTitle className="text-base">Cycles</CardTitle>
          {cycles.map((x) => <div key={x.id} className={cn("flex items-center justify-between rounded-md px-2 py-1.5", sel === x.id && "bg-accent")}><button type="button" className="text-left text-sm" onClick={() => setSel(x.id)}><span className="font-medium">{String(x.name)}</span> <span className="text-muted-foreground">· {String(x.effectiveDate).slice(0, 10)}</span></button>{x.status === "FINALIZED" ? <Pill className="text-success"><CheckCircle2 className="mr-1 size-3" /> Finalized</Pill> : <Pill>Draft</Pill>}</div>)}
          <div className="flex gap-2 border-t border-border pt-3"><input placeholder="Cycle name" aria-label="Cycle name" value={nc.name} onChange={(e) => setNc({ ...nc, name: e.target.value })} className={inputCls} /><DateInput value={nc.effectiveDate} onChange={(v) => setNc({ ...nc, effectiveDate: v })} className="w-44" /><button type="button" aria-label="Add cycle" className={cn(btn.primary, "px-3")} onClick={() => { if (!nc.name || !nc.effectiveDate) return; const r = createRecord("merit-cycles", { ...nc, status: "DRAFT", lines: [] }); setNc({ name: "", effectiveDate: "" }); setSel(r.id); }}><Plus /></button></div>
        </div></Card>
        {c && <Card><div className="space-y-2 p-5">
          <div className="flex items-center justify-between"><CardTitle className="text-base">{String(c.name)} — increments</CardTitle>{c.status === "DRAFT" && <button type="button" className={btn.smPrimary} disabled={!lines.length} onClick={() => flash(`Applied ${finalizeMerit(c.id)} increment(s)`)}>Finalize</button>}</div>
          {lines.length === 0 && <p className="text-sm text-muted-foreground">No increments yet.</p>}
          {lines.map((l) => <div key={String(l.id)} className="flex justify-between border-b border-border py-1.5 text-sm"><span>{fullName(emps.find((e) => e.id === l.employeeId))}</span><span className="tabular-nums text-muted-foreground">{l.currentBasic != null ? money(num(l.currentBasic)) : "—"} → <span className="font-medium text-foreground">{money(num(l.newBasic))}</span>{num(l.currentBasic) > 0 && <span className="ml-1 text-xs">(+{(((num(l.newBasic) - num(l.currentBasic)) / num(l.currentBasic)) * 100).toFixed(1)}%)</span>}</span></div>)}
          {c.status === "DRAFT" && <div className="flex gap-2 pt-2"><Select value={line.employeeId} onChange={(v) => setLine({ ...line, employeeId: v })} placeholder="Employee" options={emps.filter(isCurrent).filter((e) => !lines.some((l) => l.employeeId === e.id)).map((e) => ({ value: e.id, label: fullName(e) }))} className="flex-1" ariaLabel="Employee" /><input type="number" placeholder="New basic" aria-label="New basic" value={line.newBasic} onChange={(e) => setLine({ ...line, newBasic: e.target.value })} className={cn(inputCls, "w-32")} /><button type="button" aria-label="Add increment" className={cn(btn.primary, "px-3")} onClick={() => { if (!line.employeeId || !line.newBasic) return; const curr = currentSalary(line.employeeId, salaries); updateRecord("merit-cycles", c.id, { lines: [...lines, { id: crypto.randomUUID(), employeeId: line.employeeId, currentBasic: curr ? num(curr.basic) : null, newBasic: num(line.newBasic) }] }); setLine({ employeeId: "", newBasic: "" }); }}><Plus /></button></div>}
        </div></Card>}
      </div>
      {node}
    </div>
  );
}

/* ---------- my team, org chart, documents ---------- */

export function MyTeam() {
  const emps = useCollection("employees");
  const designations = useCollection("designations");
  const me = meEmployee(emps);
  const team = me ? reportsOf(me.id, emps) : [];
  return (
    <div className="space-y-4">
      <PageHeader title="My Team" subtitle="Your direct and indirect reports. Leave and timesheet approvals below are scoped to your team." actions={<><Link href="/hr/leave" className={btn.outline}>Leave requests</Link><Link href="/hr/timesheet-approvals" className={btn.outline}>Timesheet approvals</Link></>} />
      <Card><div className="p-5">{!me ? <p className="py-6 text-center text-sm text-muted-foreground">You have no reports. (Add yourself as an employee and set others to report to you.)</p> : team.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">You have no reports.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee #</Th><Th>Name</Th><Th>Designation</Th><Th>Org unit</Th><Th>Reports to</Th></tr></thead><tbody>{team.map((e) => <tr key={e.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(e.employeeNumber)}</td><td className="px-2 py-2"><Link href={`/hr/employees/${e.id}`} className="font-medium text-primary hover:underline">{fullName(e)}</Link></td><td className="px-2 py-2">{String(designations.find((d) => d.id === e.designationId)?.name ?? "—")}</td><td className="px-2 py-2">{orgUnitName(e.orgUnitId)}</td><td className="px-2 py-2">{fullName(emps.find((x) => x.id === e.managerId))}</td></tr>)}</tbody></table>}</div></Card>
    </div>
  );
}

function OrgNode({ e, emps, designations }: { e: Rec; emps: Rec[]; designations: Rec[] }) {
  const kids = emps.filter((x) => x.managerId === e.id);
  return (
    <li className="relative pl-6 before:absolute before:left-2 before:top-0 before:h-full before:border-l before:border-border">
      <Link href={`/hr/employees/${e.id}`} className="my-1 inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 shadow-sm hover:bg-accent"><span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{String(e.firstName ?? "?")[0]}{String(e.lastName ?? "")[0] ?? ""}</span><span><span className="block text-sm font-medium">{fullName(e)}</span><span className="block text-xs text-muted-foreground">{String(designations.find((d) => d.id === e.designationId)?.name ?? e.employeeNumber)}</span></span>{kids.length > 0 && <Pill className="ml-1">{kids.length}</Pill>}</Link>
      {kids.length > 0 && <ul>{kids.map((k) => <OrgNode key={k.id} e={k} emps={emps} designations={designations} />)}</ul>}
    </li>
  );
}

export function OrgChart() {
  const emps = useCollection("employees").filter(isCurrent);
  const designations = useCollection("designations");
  const roots = useMemo(() => emps.filter((e) => !e.managerId || !emps.some((x) => x.id === e.managerId)), [emps]);
  return (
    <div className="space-y-4">
      <PageHeader title="Organization chart" subtitle="Reporting hierarchy derived from manager_id" />
      <Card><div className="overflow-x-auto p-5">{emps.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No employees yet</p> : <ul className="-ml-6">{roots.map((r) => <OrgNode key={r.id} e={r} emps={emps} designations={designations} />)}</ul>}</div></Card>
    </div>
  );
}

export function DocumentVault() {
  const docs = useCollection("employee-documents");
  const emps = useCollection("employees");
  const [q, setQ] = useState("");
  const soon = docs.filter((d) => d.expiresOn && daysUntil(d.expiresOn) <= 60).sort((a, b) => String(a.expiresOn).localeCompare(String(b.expiresOn)));
  const rows = soon.filter((d) => !q || `${fullName(emps.find((e) => e.id === d.employeeId))} ${d.type} ${d.number ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="space-y-4">
      <PageHeader title="Employee document vault" subtitle="Passports, visas, certificates — with expiry alerts" />
      <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between gap-2"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by employee, doc type, or number…" aria-label="Search documents" className={cn(inputCls, "max-w-sm")} /><span className="text-sm text-muted-foreground">{rows.length} of {soon.length} expiring</span></div>
        {soon.length === 0 ? <Empty icon={FileText} title="No documents expiring in next 60 days" text="Documents like passports, visas, and certifications appear here when their expiry is within 60 days. Add them on each employee's Documents tab." /> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No documents match search</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Type</Th><Th>Number</Th><Th>Expires</Th><Th>Days left</Th><Th /></tr></thead><tbody>{rows.map((d) => { const left = daysUntil(d.expiresOn); return <tr key={d.id} className="border-b border-border"><td className="px-2 py-2"><Link href={`/hr/employees/${d.employeeId}`} className="font-medium text-primary hover:underline">{fullName(emps.find((e) => e.id === d.employeeId))}</Link></td><td className="px-2 py-2">{String(d.type).replace(/_/g, " ")}</td><td className="px-2 py-2">{String(d.number || "—")}</td><td className="px-2 py-2">{fmtDate(d.expiresOn)}</td><td className={cn("px-2 py-2 font-medium", left < 0 ? "text-destructive" : left <= 30 ? "text-warning" : "")}>{left < 0 ? `expired ${-left}d ago` : left}</td><td className="px-2 py-2 text-right"><RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => confirm("Delete this document?") && deleteRecord("employee-documents", d.id) }]} /></td></tr>; })}</tbody></table>
        )}
      </div></Card>
    </div>
  );
}
