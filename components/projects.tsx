"use client";

// Projects: list (list / kanban / gantt), project form, project detail with tasks, milestones,
// timesheets, billing and history; My Tasks; the weekly timesheet; and the billing overview.

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Columns3, FileText, FolderOpen, GanttChart, List, ListChecks, ListTree, Lock, Maximize2, Minimize2, Pencil, Plus, Receipt, Send, Trash2 } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { BILLING_TYPES, ME, TASK_STATUSES, billMilestone, billProject, createProject, decideTimesheet, logHistory, logTime, milestoneBlocker, projectTotals, submitWeek, taskActualHours, unbilled, updateProject, valueOf } from "@/lib/projects";
import { BRAND } from "@/lib/brand";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";
import { Card, Dialog, Field, Label, PageHeader, RowMenu, SidePanel, btn, inputCls, money, num, today } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner, StatusBadge } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";

const BASE = "/projects";
const STATUS_TABS = [["ALL", "All"], ["PLANNING", "Planning"], ["ACTIVE", "Active"], ["ON_HOLD", "On hold"], ["COMPLETED", "Completed"]];
const PROJECT_COLUMNS = [["PLANNING", "Planning"], ["ACTIVE", "Active"], ["ON_HOLD", "On hold"], ["COMPLETED", "Completed"], ["CANCELLED", "Cancelled"]];
const TASK_COLUMNS = [["TODO", "To do"], ["IN_PROGRESS", "In progress"], ["BLOCKED", "Blocked"], ["IN_REVIEW", "In review"], ["DONE", "Done"], ["CANCELLED", "Cancelled"]];
const BAR: Record<string, string> = { PLANNING: "bg-slate-400", ACTIVE: "bg-blue-500", ON_HOLD: "bg-amber-500", COMPLETED: "bg-emerald-500", CANCELLED: "bg-slate-300", TODO: "bg-slate-400", IN_PROGRESS: "bg-blue-500", BLOCKED: "bg-red-500", IN_REVIEW: "bg-violet-500", DONE: "bg-emerald-500" };
const fmtDate = (iso: unknown) => (iso ? new Date(`${String(iso).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
const Pill = ({ children, className }: { children: React.ReactNode; className?: string }) => <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-xs font-medium", className)}>{children}</span>;
const Th = ({ children, className, title }: { children?: React.ReactNode; className?: string; title?: string }) => <th title={title} className={cn("px-2 py-2 text-left font-medium text-muted-foreground", className)}>{children}</th>;
const Tabs = ({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: string[][] }) => (
  <div role="tablist" className="inline-flex flex-wrap rounded-lg bg-muted p-1 text-sm">{items.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", value === v && "bg-background text-foreground shadow")}>{l}</button>)}</div>
);
const Empty = ({ icon: Icon, title, text, action }: { icon: typeof FolderOpen; title: string; text: string; action?: React.ReactNode }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center"><div className="rounded-full bg-muted p-3"><Icon className="size-5 text-muted-foreground" /></div><p className="font-semibold">{title}</p><p className="max-w-sm text-sm text-muted-foreground">{text}</p>{action}</div>
);
const Progress = ({ value }: { value: unknown }) => <div className="flex items-center gap-2"><div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, num(value))}%` }} /></div><span className="text-xs tabular-nums text-muted-foreground">{num(value)}%</span></div>;
function useFlash() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const node = msg && <div role="status" className={cn("fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg", msg.bad ? "border-destructive/30 bg-destructive text-white" : "border-border bg-card")}>{msg.text}</div>;
  return { node, flash: (text: string, bad = false) => { setMsg({ text, bad }); setTimeout(() => setMsg(null), 3000); } };
}
const people = (employees: Rec[]) => [{ id: ME, name: BRAND.user.fullName }, ...employees.map((e) => ({ id: e.id, name: String(e.fullName ?? ([e.firstName, e.lastName].filter(Boolean).join(" ") || "—")) }))];

function ViewSwitch({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const opts = [["list", "List", List], ["kanban", "Kanban", Columns3], ["gantt", "Gantt", GanttChart]] as const;
  const cur = opts.find((o) => o[0] === value) ?? opts[0];
  const Icon = cur[2];
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={btn.smOutline}><Icon /> {cur[1]} <ChevronDown /></button>
      {open && <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-36 rounded-md border border-border bg-popover p-1 shadow-md">{opts.map(([v, l, I]) => <button key={v} type="button" role="menuitem" onClick={() => { onChange(v); setOpen(false); }} className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"><I className="size-4" />{l}{v === value && <Check className="ml-auto size-4" />}</button>)}</div>}
    </div>
  );
}

// Day-scale timeline: one bar per item from start to end (either date alone makes a one-day bar).
function Gantt({ items, onOpen, empty }: { items: { id: string; name: string; sub?: string; start?: unknown; end?: unknown; status: unknown }[]; onOpen: (id: string) => void; empty: string }) {
  const DAY = 86400000, W = 4;
  const toDay = (v: unknown) => (v ? Math.floor(new Date(`${String(v).slice(0, 10)}T00:00:00Z`).getTime() / DAY) : null);
  const sched = items.map((i) => { const s = toDay(i.start), e = toDay(i.end); return s == null && e == null ? null : { ...i, s: s ?? e!, e: Math.max(e ?? s!, s ?? e!) }; }).filter(Boolean) as ({ s: number; e: number } & (typeof items)[number])[];
  const unsched = items.filter((i) => !i.start && !i.end);
  const now = toDay(today())!;
  const lo = Math.min(now, ...sched.map((x) => x.s)) - 3, hi = Math.max(now, ...sched.map((x) => x.e)) + 3;
  const months: { key: string; label: string; days: number }[] = [];
  for (let d = lo; d <= hi;) { const dt = new Date(d * DAY); const next = Math.floor(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 1) / DAY); const end = Math.min(next - 1, hi); months.push({ key: `${dt.getUTCFullYear()}-${dt.getUTCMonth()}`, label: dt.toLocaleDateString(undefined, { month: "short", year: "numeric", timeZone: "UTC" }), days: end - d + 1 }); d = end + 1; }
  const width = (hi - lo + 1) * W;
  return (
    <div className="space-y-3">
      {sched.length === 0 ? <p className="text-sm text-muted-foreground">{empty}</p> : (
        <div role="figure" aria-label="Timeline" className="overflow-x-auto rounded-md border border-border">
          <div className="flex border-b border-border bg-muted/50 text-xs text-muted-foreground"><div className="w-48 shrink-0 border-r border-border px-2 py-1">Name</div><div className="flex" style={{ width }}>{months.map((m) => <div key={m.key} className="border-r border-border px-1 py-1" style={{ width: m.days * W }}>{m.days * W >= 40 ? m.label : ""}</div>)}</div></div>
          {sched.map((x) => (
            <div key={x.id} className="flex border-b border-border last:border-0">
              <div className="w-48 shrink-0 truncate border-r border-border px-2 py-1.5 text-sm" title={x.name}>{x.name}{x.sub && <span className="ml-1 text-xs text-muted-foreground">{x.sub}</span>}</div>
              <div className="relative h-9" style={{ width }}>
                <div aria-hidden className="absolute inset-y-0 w-px bg-destructive/60" style={{ left: (now - lo) * W + W / 2 }} />
                <button type="button" title={`${x.name} · ${fmtDate(x.start ?? x.end)} – ${fmtDate(x.end ?? x.start)}`} onClick={() => onOpen(x.id)} className={cn("absolute top-1.5 h-6 rounded shadow-sm hover:ring-2 hover:ring-ring", BAR[String(x.status)] ?? "bg-slate-400")} style={{ left: (x.s - lo) * W, width: Math.max((x.e - x.s + 1) * W, 12) }} />
              </div>
            </div>
          ))}
        </div>
      )}
      {unsched.length > 0 && <div><h4 className="mb-1 text-xs font-semibold text-muted-foreground">Unscheduled ({unsched.length})</h4><div className="flex flex-wrap gap-1">{unsched.map((u) => <button key={u.id} type="button" onClick={() => onOpen(u.id)} className="rounded-md border border-border px-2 py-0.5 text-xs hover:bg-accent">{u.name}</button>)}</div></div>}
    </div>
  );
}

/* ---------- projects list ---------- */

export function Projects() {
  const router = useRouter();
  const pathname = usePathname();
  const sub = subOf(pathname, BASE);
  const projects = useCollection("projects");
  const sheets = useCollection("timesheets");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [view, setView] = useState("list");
  const [id, rest] = sub.split("/");
  if (sub === "tasks") return <MyTasks />;
  if (sub === "timesheets") return <Timesheet />;
  if (sub === "billing") return <ProjectBilling />;
  if (rest === "edit") return <ProjectForm id={id} />;
  const close = () => router.push(BASE);
  const open = (pid: string) => router.push(`${BASE}/${pid}`);
  const rows = projects.filter((p) => (view === "kanban" || status === "ALL" || p.status === status) && (!q || `${p.name} ${p.code ?? ""} ${p.projectNumber}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const detail = id && id !== "new" ? projects.find((p) => p.id === id) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Projects" subtitle="Track projects, tasks, time and billable work" actions={<><ViewSwitch value={view} onChange={setView} label="Project view" /><Link href={`${BASE}/new`} className={btn.primary}><Plus /> New project</Link></>} />
      <Card><div className="space-y-3 p-5">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, code, project #" aria-label="Search projects" className={cn(inputCls, "max-w-sm")} />
        {view !== "kanban" && <Tabs value={status} onChange={setStatus} items={STATUS_TABS} />}
        {view === "gantt" ? <Gantt items={rows.map((p) => ({ id: p.id, name: String(p.name), sub: String(p.projectNumber), start: p.startDate, end: p.endDate, status: p.status }))} onOpen={open} empty="No project has a start or end date yet — add one to place it on the timeline." />
          : view === "kanban" ? (
            <div className="flex gap-3 overflow-x-auto pb-2">{PROJECT_COLUMNS.map(([s, l]) => { const col = rows.filter((p) => p.status === s); return (
              <section key={s} aria-label={`${l} column`} className="flex min-h-[300px] min-w-56 flex-1 flex-col rounded-lg border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">{l}</span><Pill>{col.length}</Pill></div>
                <div className="space-y-2">{col.map((p) => (
                  <article key={p.id} tabIndex={0} onClick={() => open(p.id)} onKeyDown={(e) => e.key === "Enter" && open(p.id)} className="cursor-pointer rounded-md border border-border bg-background p-2.5 text-sm shadow-sm hover:shadow-md">
                    <div className="font-medium">{String(p.name)}</div><div className="text-xs text-muted-foreground">{String(p.projectNumber)}</div>
                    <div className="mt-1 flex items-center justify-between gap-1 text-xs"><span className="truncate text-muted-foreground">{String(p.customerName || "No customer")}</span><Pill className="text-[10px]">{String(p.billingType).replace(/_/g, " ")}</Pill></div>
                    <div className="mt-1 flex justify-between text-xs text-muted-foreground"><span>{projectTotals(p, sheets).totalHours.toFixed(1)} h</span>{Boolean(p.endDate) && <span>{fmtDate(p.endDate)}</span>}</div>
                  </article>
                ))}{col.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No projects</div>}</div>
              </section>
            ); })}</div>
          ) : rows.length === 0 ? <Empty icon={FolderOpen} title="No projects yet" text="Create your first project to track work, time and billing." action={<Link href={`${BASE}/new`} className={btn.smPrimary}><Plus /> New project</Link>} /> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-border"><Th>Project #</Th><Th>Name</Th><Th>Customer</Th><Th>Work structure</Th><Th>Billing</Th><Th>Hours</Th><Th>Status</Th><Th>Start date</Th><Th>End date</Th><Th /></tr></thead>
              <tbody>{rows.map((p) => (
                <tr key={p.id} onClick={() => open(p.id)} className="cursor-pointer border-b border-border hover:bg-muted/50">
                  <td className="px-2 py-2 font-mono text-xs">{String(p.projectNumber)}</td><td className="px-2 py-2 font-medium">{String(p.name)}{Boolean(p.code) && <div className="text-xs font-normal text-muted-foreground">{String(p.code)}</div>}</td>
                  <td className="px-2 py-2">{String(p.customerName || "—")}</td><td className="px-2 py-2"><Pill>{p.workStructure === "MILESTONES" ? "Milestones + Tasks" : "Tasks"}</Pill></td><td className="px-2 py-2"><Pill>{String(p.billingType).replace(/_/g, " ")}</Pill></td>
                  <td className="px-2 py-2 tabular-nums">{projectTotals(p, sheets).totalHours.toFixed(1)}</td><td className="px-2 py-2"><StatusBadge status={p.status} /></td><td className="px-2 py-2">{fmtDate(p.startDate)}</td><td className="px-2 py-2">{fmtDate(p.endDate)}</td>
                  <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}><RowMenu items={[{ label: "Edit", onSelect: () => router.push(`${BASE}/${p.id}/edit`) }, { label: "Delete", destructive: true, onSelect: () => { if (sheets.some((s) => s.projectId === p.id)) { if (confirm(`${p.name} has timesheets — cancel it instead?`)) updateProject(p.id, { status: "CANCELLED" }); } else if (confirm(`Delete ${p.name}?`)) { readCollection("project-tasks").filter((t) => t.projectId === p.id).forEach((t) => deleteRecord("project-tasks", t.id)); deleteRecord("projects", p.id); } } }]} /></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
      </div></Card>
      {id === "new" && <SidePanel onClose={close}><ProjectForm onDone={(pid) => router.push(`${BASE}/${pid}`)} onCancel={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><ProjectDetail key={detail.id} project={detail} /></SidePanel>}
    </div>
  );
}

/* ---------- project form (new & edit) ---------- */

const STRUCTURES = [
  { value: "TASKS", title: "Tasks", description: "Tasks directly under the project, billed from the project's Billing tab.", icon: ListChecks },
  { value: "MILESTONES", title: "Milestones + tasks", description: "Tasks grouped under milestones. Each completed milestone gets its own invoice. Time & material only.", icon: ListTree },
];

function ProjectForm({ id, onDone, onCancel }: { id?: string; onDone?: (id: string) => void; onCancel?: () => void }) {
  const router = useRouter();
  const customers = useCollection("customers");
  const projects = useCollection("projects");
  const rec = id ? projects.find((p) => p.id === id) : undefined;
  const editing = !!id;
  const init = (p?: Rec) => ({ name: String(p?.name ?? ""), code: String(p?.code ?? ""), description: String(p?.description ?? ""), customerId: String(p?.customerId ?? ""), status: String(p?.status ?? "PLANNING"), billingType: String(p?.billingType ?? "TIME_AND_MATERIAL"), workStructure: String(p?.workStructure ?? "TASKS"), defaultHourlyRate: p?.defaultHourlyRate != null ? String(p.defaultHourlyRate) : "", currencyCode: String(p?.currencyCode ?? "USD"), budgetAmount: p?.budgetAmount != null ? String(p.budgetAmount) : "", startDate: String(p?.startDate ?? ""), endDate: String(p?.endDate ?? "") });
  const [f, setF] = useState(() => init(rec));
  const [loadedFor, setLoadedFor] = useState(rec?.id);
  if (rec && loadedFor !== rec.id) { setLoadedFor(rec.id); setF(init(rec)); }
  const back = () => (onCancel ? onCancel() : router.push(editing ? `${BASE}/${id}` : BASE));
  const milestones = f.workStructure === "MILESTONES";
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return;
    const data = { ...f, name: f.name.trim(), code: f.code || undefined, description: f.description || undefined, customerId: f.customerId || undefined, defaultHourlyRate: f.defaultHourlyRate ? num(f.defaultHourlyRate) : undefined, budgetAmount: f.budgetAmount ? num(f.budgetAmount) : undefined, startDate: f.startDate || undefined, endDate: f.endDate || undefined };
    if (editing) { const { workStructure: _ws, ...patch } = data; void _ws; updateProject(id!, patch); router.push(`${BASE}/${id}`); return; }
    const p = createProject(data);
    if (onDone) onDone(p.id); else router.push(`${BASE}/${p.id}`);
  }
  if (editing && !rec) return projects.length ? <p className="p-6 text-sm text-muted-foreground">Not found</p> : null;
  const next = `PRJ-${String(readCollection("projects").length + 1).padStart(2, "0")}`;
  const field = (k: keyof typeof f, label: string, type = "text", placeholder = "") => <Field label={label} htmlFor={`pj-${k}`}><input id={`pj-${k}`} type={type} step={type === "number" ? "0.001" : undefined} value={f[k]} placeholder={placeholder} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls} /></Field>;
  return (
    <form onSubmit={submit} className="space-y-4">
      <button type="button" onClick={back} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back</button>
      <div><h1 className="text-2xl font-semibold tracking-tight">{editing ? "Edit Project" : "New Project"}</h1><p className="text-sm text-muted-foreground">{editing ? "Update the project's details, status and billing" : "Set up a project to track work, time and billing"}</p></div>
      <Card><div className="space-y-4 p-5">
        {editing ? <Field label="Project #" htmlFor="pj-num"><input id="pj-num" value={String(rec?.projectNumber ?? "")} readOnly disabled className={cn(inputCls, "font-mono")} /></Field> : <NumberBanner label="Project #" value={next} />}
        <div className="space-y-2">
          <Label>Work structure{editing ? "" : " *"}</Label>
          {editing ? <div className="text-sm">{STRUCTURES.find((s) => s.value === f.workStructure)?.title}<span className="text-muted-foreground"> — set when the project was created</span></div> : (
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">{STRUCTURES.map((s) => { const on = s.value === f.workStructure; const I = s.icon; return (
              <button key={s.value} type="button" role="radio" aria-checked={on} onClick={() => setF({ ...f, workStructure: s.value, billingType: s.value === "MILESTONES" ? "TIME_AND_MATERIAL" : f.billingType })} className={cn("flex items-start gap-3 rounded-lg border p-3 text-left transition-colors", on ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50")}>
                <I className={cn("mt-0.5 size-5 shrink-0", on ? "text-primary" : "text-muted-foreground")} />
                <div className="flex-1"><div className={cn("font-medium", on && "text-primary")}>{s.title}</div><div className="text-xs text-muted-foreground">{s.description}</div></div>
                <span className={cn("mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border", on ? "border-primary" : "border-muted-foreground/40")}>{on && <span className="size-2 rounded-full bg-primary" />}</span>
              </button>
            ); })}</div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">{field("name", "Name *")}{field("code", "Code", "text", "e.g. ALPHA")}</div>
        {field("description", "Description")}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2"><Label>Customer</Label><Select value={f.customerId} onChange={(v) => setF({ ...f, customerId: v })} placeholder="—" options={customers.map((c) => ({ value: c.id, label: String(c.name) }))} /></div>
          <div className="space-y-2"><Label>Billing type *</Label><Select value={f.billingType} onChange={(v) => setF({ ...f, billingType: v })} options={BILLING_TYPES} disabled={milestones} ariaLabel="Billing type" />{milestones && <p className="text-xs text-muted-foreground">Milestone projects are billed on time &amp; material.</p>}</div>
          <div className="space-y-2"><Label>Status *</Label><Select value={f.status} onChange={(v) => setF({ ...f, status: v })} options={[["PLANNING", "Planning"], ["ACTIVE", "Active"], ["ON_HOLD", "On hold"], ...(editing ? [["COMPLETED", "Completed"], ["CANCELLED", "Cancelled"]] : [])].map(([v, l]) => ({ value: v, label: l }))} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">{field("defaultHourlyRate", "Default hourly rate", "number")}{field("budgetAmount", "Budget", "number")}{field("currencyCode", "Currency")}</div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2"><Label>Start date</Label><DateInput value={f.startDate} onChange={(v) => setF({ ...f, startDate: v })} /></div>
          <div className="space-y-2"><Label>End date</Label><DateInput value={f.endDate} onChange={(v) => setF({ ...f, endDate: v })} /></div>
        </div>
      </div></Card>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={back}>Cancel</button><button type="submit" className={btn.primary} disabled={!f.name.trim()}>{editing ? "Save changes" : "Create project"}</button></div>
    </form>
  );
}

/* ---------- project detail ---------- */

function ProjectDetail({ project: p }: { project: Rec }) {
  const router = useRouter();
  const tasks = useCollection("project-tasks").filter((t) => t.projectId === p.id);
  const allSheets = useCollection("timesheets");
  const sheets = allSheets.filter((s) => s.projectId === p.id);
  const milestones = useCollection("milestones").filter((m) => m.projectId === p.id).sort((a, b) => num(a.displayOrder) - num(b.displayOrder));
  const invoices = useCollection("invoices").filter((i) => i.reference === p.projectNumber);
  const history = useCollection("project-history").filter((h) => h.projectId === p.id);
  const customers = useCollection("customers");
  const isMs = p.workStructure === "MILESTONES";
  const [tab, setTab] = useState(isMs ? "milestones" : "tasks");
  const [billing, setBilling] = useState<null | { milestone?: Rec; hours: number; amount: number }>(null);
  const { node, flash } = useFlash();
  const open = unbilled(sheets);
  const hours = open.reduce((a, s) => a + num(s.hours), 0), value = valueOf(open, p.defaultHourlyRate);
  const totals = projectTotals(p, allSheets);
  const frozen = !!customers.find((c) => c.id === p.customerId)?.freezeAccount;
  const tabs = [...(isMs ? [["milestones", "Milestones"]] : []), ["tasks", `Tasks (${tasks.length})`], ["timesheets", `Timesheets (${sheets.length})`], ["billing", "Billing"], ["history", "History"]];
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => router.push(BASE)} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back</button>
      <PageHeader title={String(p.name)} subtitle={`${p.projectNumber}${p.customerName ? ` · ${p.customerName}` : ""}`} actions={<>
        <Link href={`${BASE}/${p.id}/edit`} className={btn.outline}><Pencil /> Edit</Link>
        {!isMs && open.length > 0 && Boolean(p.customerId) && <button type="button" className={btn.primary} disabled={frozen} title={frozen ? "Customer account is frozen" : undefined} onClick={() => setBilling({ hours, amount: value })}><Receipt /> Bill {open.length} timesheets</button>}
      </>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><div className="p-4 pb-1 text-sm text-muted-foreground">Status</div><div className="p-4 pt-0"><StatusBadge status={p.status} /></div></Card>
        <Card><div className="p-4 pb-1 text-sm text-muted-foreground">Total hours</div><div className="p-4 pt-0 text-xl font-semibold">{totals.totalHours.toFixed(1)}</div></Card>
        <Card><div className="p-4 pb-1 text-sm text-muted-foreground">Billable value</div><div className="p-4 pt-0 text-xl font-semibold">{money(totals.totalBillableAmount)}</div></Card>
        <Card><div className="p-4 pb-1 text-sm text-muted-foreground">Budget</div><div className="p-4 pt-0 text-xl font-semibold">{p.budgetAmount ? money(num(p.budgetAmount)) : <span className="text-muted-foreground">—</span>}</div>{num(p.budgetAmount) > 0 && <div className="px-4 pb-3 text-xs text-muted-foreground">{Math.round((totals.totalBillableAmount / num(p.budgetAmount)) * 100)}% used</div>}</Card>
      </div>
      <Tabs value={tab} onChange={setTab} items={tabs} />
      {tab === "tasks" && <TasksCard project={p} tasks={tasks} milestones={isMs ? milestones : undefined} sheets={allSheets} />}
      {tab === "milestones" && <MilestonesCard project={p} milestones={milestones} tasks={tasks} sheets={sheets} onBill={(m, h, a) => setBilling({ milestone: m, hours: h, amount: a })} flash={flash} />}
      {tab === "timesheets" && <TimesheetsCard sheets={sheets} tasks={tasks} />}
      {tab === "billing" && (
        <div className="space-y-4">
          <Card><div className="space-y-3 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <div><div className="text-xs text-muted-foreground">Unbilled approved hours</div><div className="text-xl font-semibold">{hours.toFixed(1)}</div></div>
              <div><div className="text-xs text-muted-foreground">Unbilled value</div><div className="text-xl font-semibold">{money(value)}</div></div>
              <div><div className="text-xs text-muted-foreground">Customer</div><div className="font-medium">{p.customerName ? String(p.customerName) : <span className="text-muted-foreground">No customer linked</span>}</div></div>
            </div>
            {!p.customerId && <p className="text-sm text-warning">A customer must be set on the project to generate AR invoices.</p>}
            {isMs && <p className="text-sm text-muted-foreground">This project is invoiced per milestone: each completed milestone gets one invoice, from the Milestones tab.</p>}
          </div></Card>
          <Card><div className="space-y-3 p-5">
            <div className="font-semibold">Invoice History</div>
            {invoices.length === 0 ? <p className="text-sm text-muted-foreground">No invoices have been created for this project yet.</p> : (
              <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Invoice #</Th><Th>Invoice Date</Th><Th>Due Date</Th><Th className="text-right">Amount</Th><Th className="text-right">Outstanding</Th><Th>Status</Th><Th /></tr></thead>
                <tbody>{invoices.map((i) => <tr key={i.id} className="border-b border-border"><td className="px-2 py-2"><Link href={`/ar/invoices/${i.id}`} className="font-mono text-xs text-primary hover:underline">{String(i.number)}</Link></td><td className="px-2 py-2">{fmtDate(i.date)}</td><td className="px-2 py-2">{fmtDate(i.dueDate)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(i.total))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(i.total) - num(i.amountPaid) - num(i.credited))}</td><td className="px-2 py-2"><StatusBadge status={i.status} /></td><td className="px-2 py-2 text-right"><Link href={`/ar/invoices/${i.id}`} className={cn(btn.ghost, "h-8 px-2 text-xs")}>View</Link></td></tr>)}</tbody></table>
            )}
          </div></Card>
        </div>
      )}
      {tab === "history" && <Card><div className="p-5">{history.length === 0 ? <p className="text-sm text-muted-foreground">No history yet.</p> : <ol className="space-y-3">{[...history].reverse().map((h) => <li key={h.id} className="flex gap-3 text-sm"><span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" /><div><div><span className="font-medium">{String(h.action)}</span>{h.detail ? <span className="text-muted-foreground"> — {String(h.detail)}</span> : null}</div><div className="text-xs text-muted-foreground">{String(h.userName)} · {new Date(String(h.createdAt)).toLocaleString()}</div></div></li>)}</ol>}</div></Card>}
      {billing && <BillDialog project={p} milestone={billing.milestone} hours={billing.hours} amount={billing.amount} onClose={() => setBilling(null)} onBilled={(msg) => { setBilling(null); flash(msg); }} />}
      {node}
    </div>
  );
}

function BillDialog({ project: p, milestone, hours, amount, onClose, onBilled }: { project: Rec; milestone?: Rec; hours: number; amount: number; onClose: () => void; onBilled: (msg: string) => void }) {
  const [f, setF] = useState({ periodStart: "", periodEnd: "", dueDate: "", taxRate: "" });
  const [error, setError] = useState("");
  function submit() {
    try {
      const o = { dueDate: f.dueDate || undefined, taxRate: f.taxRate ? num(f.taxRate) : undefined };
      const r = milestone ? billMilestone(String(p.id), milestone.id, o) : billProject(String(p.id), { ...o, periodStart: f.periodStart || undefined, periodEnd: f.periodEnd || undefined });
      onBilled(`Invoice ${r.invoice.number} created — ${r.timesheetsBilled} timesheets invoiced`);
    } catch (e) { setError((e as Error).message); }
  }
  return (
    <Dialog open onClose={onClose} title={milestone ? `Invoice milestone: ${milestone.name}` : "Bill timesheets to AR"}>
      <p className="text-sm">{milestone
        ? <>Invoicing <strong>{hours.toFixed(1)}h</strong> worth <strong>{money(amount)}</strong> from milestone <strong>{String(milestone.name)}</strong>, one line per task. This is the milestone&apos;s only invoice: afterwards its tasks and time are locked.</>
        : <>Billing <strong>{hours.toFixed(1)}h</strong> worth <strong>{money(amount)}</strong>. An AR invoice on account will be created with one line per user.</>}</p>
      {!milestone && <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Period start (optional)</Label><DateInput value={f.periodStart} onChange={(v) => setF({ ...f, periodStart: v })} /></div><div className="space-y-1.5"><Label>Period end (optional)</Label><DateInput value={f.periodEnd} onChange={(v) => setF({ ...f, periodEnd: v })} /></div></div>}
      <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Due date (optional)</Label><DateInput value={f.dueDate} onChange={(v) => setF({ ...f, dueDate: v })} /></div><Field label="VAT % (optional)" htmlFor="bill-vat"><input id="bill-vat" type="number" step="0.001" min="0" placeholder="e.g. 5" value={f.taxRate} onChange={(e) => setF({ ...f, taxRate: e.target.value })} className={inputCls} /></Field></div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end"><button type="button" className={btn.primary} onClick={submit}>Create invoice</button></div>
    </Dialog>
  );
}

/* ---------- tasks ---------- */

function variance(est: unknown, actual: number) { const e = num(est); if (!e) return "—"; const v = Math.round((actual - e) * 100) / 100; return `${v > 0 ? "+" : ""}${v}h`; }

function TasksCard({ project: p, tasks, milestones, sheets }: { project: Rec; tasks: Rec[]; milestones?: Rec[]; sheets: Rec[] }) {
  const [view, setView] = useState("list");
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState<null | { task?: Rec; milestoneId?: string }>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const noMs = !!milestones && milestones.filter((m) => !m.invoiceId).length === 0;
  const lockedBy = (t: Rec) => milestones?.find((m) => m.id === t.milestoneId && m.invoiceId);
  const setStatus = (t: Rec, s: string) => { updateRecord("project-tasks", t.id, { status: s, ...(s === "DONE" ? { completionPercentage: 100 } : {}) }); logHistory(String(p.id), "Task status", `${t.title}: ${t.status} → ${s}`); };
  const groups = milestones ? [...milestones.map((m) => ({ key: m.id, m: m as Rec | null, list: tasks.filter((t) => t.milestoneId === m.id) })), ...(tasks.some((t) => !milestones.some((m) => m.id === t.milestoneId)) ? [{ key: "none", m: null, list: tasks.filter((t) => !milestones.some((m) => m.id === t.milestoneId)) }] : [])] : [{ key: "all", m: undefined as Rec | null | undefined, list: tasks }];
  let sl = 0;
  return (
    <Card className={cn(expanded && "fixed inset-0 z-50 overflow-auto rounded-none")}>
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-semibold">Tasks</div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setExpanded((e) => !e)} className={cn(btn.ghost, "h-8 px-2 text-xs")}>{expanded ? <>Minimize <Minimize2 /></> : <>Expand <Maximize2 /></>}</button>
            <ViewSwitch value={view} onChange={setView} label="Task view" />
            <button type="button" className={btn.smOutline} disabled={noMs} title={noMs ? "Add a milestone on the Milestones tab first" : undefined} onClick={() => setEditing({})}><Plus /> Add task</button>
          </div>
        </div>
        {tasks.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">{milestones && milestones.length === 0 ? "No milestones yet. Add one on the Milestones tab, then add its tasks." : "No tasks yet"}</p>
          : view === "kanban" ? (
            <div className="flex gap-3 overflow-x-auto pb-2">{TASK_COLUMNS.map(([s, l]) => { const col = tasks.filter((t) => t.status === s); return (
              <section key={s} aria-label={`${l} column`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const t = tasks.find((x) => x.id === drag); if (t && t.status !== s) setStatus(t, s); setDrag(null); }} className="flex min-h-[300px] min-w-52 flex-1 flex-col rounded-lg border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between"><span className="text-sm font-semibold">{l}</span><Pill>{col.length}</Pill></div>
                <div className="space-y-2">{col.map((t) => (
                  <article key={t.id} draggable onDragStart={() => setDrag(t.id)} onClick={() => setEditing({ task: t })} className={cn("cursor-grab rounded-md border border-border bg-background p-2.5 text-sm shadow-sm hover:shadow-md", drag === t.id && "opacity-50")}>
                    <div className={cn("font-medium", t.status === "DONE" && "text-muted-foreground line-through")}>{String(t.title)}</div>
                    <TagList tags={t.tags} />
                    <div className="mt-1 flex justify-between text-xs"><span className="text-muted-foreground">{String(t.assigneeName || "Unassigned")}</span><Pill className="text-[10px]">{String(t.priority)}</Pill></div>
                    <div className="mt-1 flex items-center justify-between"><Progress value={t.completionPercentage} />{Boolean(t.dueDate) && <span className="text-xs text-muted-foreground">{fmtDate(t.dueDate)}</span>}</div>
                  </article>
                ))}{col.length === 0 && <div className="py-6 text-center text-xs text-muted-foreground">No tasks</div>}</div>
              </section>
            ); })}</div>
          ) : view === "gantt" ? <Gantt items={tasks.map((t) => ({ id: t.id, name: String(t.title), start: t.startDate, end: t.dueDate, status: t.status }))} onOpen={(id) => setEditing({ task: tasks.find((t) => t.id === id) })} empty="No task has a start or due date yet." />
          : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-border"><Th className="w-14 text-center">Sl No.</Th><Th>Title</Th><Th>Assignee</Th><Th className="text-center">Priority</Th><Th className="text-center">Start</Th><Th className="text-center">Due</Th><Th className="text-right" title="The task's planned hours">Est. hrs</Th><Th className="text-right" title="Timesheet hours logged on this task, excluding rejected">Actual hrs</Th><Th className="text-right" title="Actual hrs minus Est. hrs">Variance</Th><Th className="text-center">Progress</Th><Th className="text-center">Status</Th><Th /></tr></thead>
              <tbody>{groups.map((g) => (
                <GroupRows key={g.key} label={g.m === undefined ? undefined : g.m ? `${g.m.name} · ${g.list.length} task${g.list.length === 1 ? "" : "s"}${g.m.invoiceId ? ` · Invoiced (${g.m.invoiceNumber})` : ""}` : "No milestone"}>
                  {g.list.map((t) => { const actual = taskActualHours(t.id, sheets); const n = sl++; return (
                    <tr key={t.id} className="border-b border-border">
                      <td className="px-2 py-2 text-center text-muted-foreground">{n + 1}</td>
                      <td className="px-2 py-2"><div className={t.status === "DONE" ? "text-muted-foreground line-through" : "font-medium"}>{String(t.title)}</div><TagList tags={t.tags} /></td>
                      <td className="px-2 py-2">{String(t.assigneeName || "—")}</td><td className="px-2 py-2 text-center"><Pill className="text-[10px]">{String(t.priority)}</Pill></td>
                      <td className="px-2 py-2 text-center">{fmtDate(t.startDate)}</td><td className="px-2 py-2 text-center">{fmtDate(t.dueDate)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{t.estimatedHours ? num(t.estimatedHours) : "—"}</td><td className="px-2 py-2 text-right tabular-nums">{actual.toFixed(2)}</td>
                      <td className={cn("px-2 py-2 text-right tabular-nums", num(t.estimatedHours) && actual > num(t.estimatedHours) && "text-destructive")}>{variance(t.estimatedHours, actual)}</td>
                      <td className="px-2 py-2"><div className="flex justify-center"><Progress value={t.completionPercentage} /></div></td>
                      <td className="px-2 py-2"><Select size="sm" value={String(t.status)} onChange={(v) => setStatus(t, v)} options={TASK_STATUSES.map((s) => ({ value: s, label: s }))} className="mx-auto w-32" ariaLabel={`Status of ${t.title}`} /></td>
                      <td className="px-2 py-2"><div className="flex justify-end"><button type="button" aria-label={`Edit task ${t.title}`} className={btn.icon} onClick={() => setEditing({ task: t })}><Pencil /></button><button type="button" aria-label={`Delete task ${t.title}`} disabled={!!lockedBy(t) || sheets.some((s) => s.taskId === t.id)} title={lockedBy(t) ? "Its milestone has been invoiced" : sheets.some((s) => s.taskId === t.id) ? "Time is logged on this task" : undefined} className={btn.icon} onClick={() => confirm(`Delete task "${t.title}"?`) && deleteRecord("project-tasks", t.id)}><Trash2 /></button></div></td>
                    </tr>
                  ); })}
                </GroupRows>
              ))}</tbody>
            </table></div>
          )}
      </div>
      {editing && <TaskDialog project={p} task={editing.task} milestones={milestones} defaultMilestoneId={editing.milestoneId} onClose={() => setEditing(null)} />}
    </Card>
  );
}

const GroupRows = ({ label, children }: { label?: string; children: React.ReactNode }) => (<>{label !== undefined && <tr className="bg-muted/50"><td colSpan={12} className="px-2 py-1.5 text-xs font-semibold">{label}</td></tr>}{children}</>);
const TagList = ({ tags }: { tags: unknown }) => { const t = (tags as string[]) ?? []; return t.length ? <div className="mt-0.5 flex flex-wrap gap-1">{t.map((x) => <span key={x} className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{x}</span>)}</div> : null; };

export function TaskDialog({ project: p, task: t, milestones, defaultMilestoneId, onClose }: { project: Rec; task?: Rec; milestones?: Rec[]; defaultMilestoneId?: string; onClose: () => void }) {
  const employees = useCollection("employees");
  const who = people(employees);
  const [f, setF] = useState({ title: String(t?.title ?? ""), description: String(t?.description ?? ""), assignedTo: String(t?.assignedTo ?? ""), priority: String(t?.priority ?? "MEDIUM"), startDate: String(t?.startDate ?? ""), dueDate: String(t?.dueDate ?? ""), estimatedHours: t?.estimatedHours != null ? String(t.estimatedHours) : "", completion: String(t?.completionPercentage ?? 0), tags: ((t?.tags as string[]) ?? []).join(", "), isBillable: t?.isBillable !== false, reminderAt: String(t?.reminderAt ?? ""), recurrence: String(t?.recurrence ?? ""), milestoneId: String(t?.milestoneId ?? defaultMilestoneId ?? "") });
  const [tried, setTried] = useState(false);
  const locked = !!t && !!milestones?.find((m) => m.id === t.milestoneId && m.invoiceId);
  const msOpts = (milestones ?? []).filter((m) => !m.invoiceId || m.id === t?.milestoneId);
  const dateErr = f.startDate && f.dueDate && f.startDate > f.dueDate ? "Start date cannot be after the due date" : "";
  const pct = f.completion.trim() === "" ? 0 : Number(f.completion);
  const pctErr = Number.isInteger(pct) && pct >= 0 && pct <= 100 ? "" : "Completion must be a whole number from 0 to 100";
  const msErr = milestones && !f.milestoneId ? "Choose a milestone" : "";
  function save() {
    setTried(true);
    if (!f.title.trim() || dateErr || pctErr || msErr) return;
    const data = { projectId: p.id, title: f.title.trim(), description: f.description || undefined, assignedTo: f.assignedTo || undefined, assigneeName: who.find((w) => w.id === f.assignedTo)?.name, priority: f.priority, startDate: f.startDate || undefined, dueDate: f.dueDate || undefined, estimatedHours: f.estimatedHours ? num(f.estimatedHours) : undefined, completionPercentage: pct, tags: f.tags.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 20), isBillable: f.isBillable, reminderAt: f.reminderAt || undefined, recurrence: f.recurrence || undefined, milestoneId: milestones ? f.milestoneId : undefined };
    if (t) updateRecord("project-tasks", t.id, data); else createRecord("project-tasks", { ...data, status: "TODO" });
    logHistory(String(p.id), t ? "Task updated" : "Task added", data.title);
    onClose();
  }
  return (
    <Dialog open onClose={onClose} title={t ? "Edit task" : "New task"} className="max-h-[90vh] max-w-xl overflow-y-auto">
      <div className="space-y-3">
        <Field label="Title *" htmlFor="tk-title"><input id="tk-title" autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} /></Field>
        <Field label="Description" htmlFor="tk-desc"><input id="tk-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
        {milestones && <div className="space-y-1.5"><Label>Milestone *</Label><Select value={f.milestoneId} onChange={(v) => setF({ ...f, milestoneId: v })} placeholder="Select milestone" options={msOpts.map((m) => ({ value: m.id, label: String(m.name) }))} disabled={locked} ariaLabel="Milestone" />{locked && <p className="text-xs text-muted-foreground">This milestone has been invoiced, so the task stays in it.</p>}{tried && msErr && <p className="text-xs text-destructive">{msErr}</p>}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Assign to</Label><Select value={f.assignedTo} onChange={(v) => setF({ ...f, assignedTo: v })} placeholder="Unassigned" options={[{ value: "", label: "Unassigned" }, ...who.map((w) => ({ value: w.id, label: w.name }))]} ariaLabel="Assign to" /></div>
          <div className="space-y-1.5"><Label>Priority</Label><Select value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={["LOW", "MEDIUM", "HIGH", "URGENT"].map((x) => ({ value: x, label: x }))} ariaLabel="Priority" /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5"><Label>Start date</Label><DateInput value={f.startDate} onChange={(v) => setF({ ...f, startDate: v })} /></div>
          <div className="space-y-1.5"><Label>Due date</Label><DateInput value={f.dueDate} onChange={(v) => setF({ ...f, dueDate: v })} /></div>
          <Field label="Est. hours" htmlFor="tk-est"><input id="tk-est" type="number" step="0.5" value={f.estimatedHours} onChange={(e) => setF({ ...f, estimatedHours: e.target.value })} className={inputCls} /></Field>
        </div>
        {dateErr && <p className="text-xs text-destructive">{dateErr}</p>}
        <Field label="Completion %" htmlFor="tk-pct"><input id="tk-pct" type="number" min={0} max={100} step={1} aria-label="Completion percentage" value={f.completion} onChange={(e) => setF({ ...f, completion: e.target.value })} className={inputCls} /></Field>
        {pctErr && <p className="text-xs text-destructive">{pctErr}</p>}
        <Field label="Tags / Labels" htmlFor="tk-tags"><input id="tk-tags" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} placeholder="Comma separated, up to 20" className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Billing type</Label><Select value={f.isBillable ? "BILLABLE" : "NON_BILLABLE"} onChange={(v) => setF({ ...f, isBillable: v === "BILLABLE" })} options={[{ value: "BILLABLE", label: "Billable" }, { value: "NON_BILLABLE", label: "Non-billable" }]} ariaLabel="Billing type" /></div>
          <div className="space-y-1.5"><Label>Recurrence</Label><Select value={f.recurrence} onChange={(v) => setF({ ...f, recurrence: v })} options={[{ value: "", label: "None" }, { value: "DAILY", label: "Daily" }, { value: "WEEKLY", label: "Weekly" }, { value: "MONTHLY", label: "Monthly" }]} ariaLabel="Recurrence" /></div>
        </div>
        <Field label="Reminder" htmlFor="tk-rem"><input id="tk-rem" type="datetime-local" value={f.reminderAt} onChange={(e) => setF({ ...f, reminderAt: e.target.value })} className={inputCls} /></Field>
        <p className="text-xs text-muted-foreground">Reminders and recurrence are saved with the task; notifications and repeats aren&apos;t sent automatically yet.</p>
      </div>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={!f.title.trim() || !!dateErr || !!pctErr} onClick={save}>{t ? "Save" : "Add"}</button></div>
    </Dialog>
  );
}

/* ---------- milestones ---------- */

const MS_STATUSES = [["PLANNED", "Planned"], ["IN_PROGRESS", "In progress"], ["COMPLETED", "Completed"], ["ON_HOLD", "On hold"], ["CANCELLED", "Cancelled"]];

function MilestonesCard({ project: p, milestones, tasks, sheets, onBill, flash }: { project: Rec; milestones: Rec[]; tasks: Rec[]; sheets: Rec[]; onBill: (m: Rec, hours: number, amount: number) => void; flash: (t: string, bad?: boolean) => void }) {
  const [editing, setEditing] = useState<null | { m?: Rec }>(null);
  const [addTo, setAddTo] = useState<Rec | null>(null);
  return (
    <Card><div className="space-y-3 p-5">
      <div className="flex items-center justify-between"><div className="font-semibold">Milestones</div><button type="button" className={btn.smOutline} onClick={() => setEditing({})}><Plus /> Add Milestone</button></div>
      {milestones.length === 0 ? <p className="text-sm text-muted-foreground">No milestones yet. Add one, then add its tasks.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border"><Th className="text-center">Sl No.</Th><Th>Milestone Name</Th><Th>Description</Th><Th className="text-center">Start Date</Th><Th className="text-center">Due Date</Th><Th className="text-center">Status</Th><Th className="text-right">Display Order</Th><Th className="text-right">Tasks</Th><Th className="text-right">Unbilled</Th><Th className="text-center">Invoice</Th><Th /></tr></thead>
          <tbody>{milestones.map((m, i) => { const b = milestoneBlocker(m, tasks, sheets, !!p.customerId, p.defaultHourlyRate); const invoiced = !!m.invoiceId; const delBlock = invoiced ? "An invoiced milestone can't be deleted" : b.taskCount > 0 ? "Move or delete its tasks first" : null; return (
            <tr key={m.id} className="border-b border-border">
              <td className="px-2 py-2 text-center text-muted-foreground">{i + 1}</td><td className="px-2 py-2 font-medium">{String(m.name)}</td><td className="px-2 py-2 text-muted-foreground">{String(m.description || "—")}</td><td className="px-2 py-2 text-center">{fmtDate(m.startDate)}</td><td className="px-2 py-2 text-center">{fmtDate(m.dueDate)}</td><td className="px-2 py-2 text-center"><StatusBadge status={m.status} /></td><td className="px-2 py-2 text-right tabular-nums">{num(m.displayOrder)}</td><td className="px-2 py-2 text-right tabular-nums">{b.taskCount}</td>
              <td className="px-2 py-2 text-right tabular-nums"><div>{b.hours.toFixed(1)}h</div><div className="text-xs text-muted-foreground">{money(b.amount)}</div></td>
              <td className="px-2 py-2 text-center">{invoiced ? <div><div className="text-xs font-medium text-success">Invoiced</div><Link href={`/ar/invoices/${m.invoiceId}`} className="text-xs text-primary hover:underline">{String(m.invoiceNumber || "View invoice")}</Link></div> : <><button type="button" className={btn.smOutline} disabled={!!b.blocker} title={b.blocker ?? undefined} aria-label={`Invoice milestone ${m.name}`} onClick={() => onBill(m, b.hours, b.amount)}><Receipt /> Invoice</button>{b.blocker && <div className="mt-0.5 text-[11px] text-muted-foreground">{b.blocker}</div>}</>}</td>
              <td className="px-2 py-2"><div className="flex justify-end">
                <button type="button" aria-label={`Add task to milestone ${m.name}`} disabled={invoiced} className={btn.icon} onClick={() => setAddTo(m)}><Plus /></button>
                <button type="button" aria-label={`Edit milestone ${m.name}`} disabled={invoiced} className={btn.icon} onClick={() => setEditing({ m })}><Pencil /></button>
                <button type="button" aria-label={`Delete milestone ${m.name}`} disabled={!!delBlock} title={delBlock ?? undefined} className={btn.icon} onClick={() => { if (confirm(`Delete milestone "${m.name}"?`)) { deleteRecord("milestones", m.id); flash("Milestone deleted"); } }}><Trash2 /></button>
              </div></td>
            </tr>
          ); })}</tbody>
        </table></div>
      )}
      {editing && <MilestoneDialog project={p} milestone={editing.m} onClose={() => setEditing(null)} onSaved={(msg) => { setEditing(null); flash(msg); }} />}
      {addTo && <TaskDialog project={p} milestones={milestones} defaultMilestoneId={addTo.id} onClose={() => setAddTo(null)} />}
    </div></Card>
  );
}

function MilestoneDialog({ project: p, milestone: m, onClose, onSaved }: { project: Rec; milestone?: Rec; onClose: () => void; onSaved: (msg: string) => void }) {
  const [f, setF] = useState({ name: String(m?.name ?? ""), description: String(m?.description ?? ""), startDate: String(m?.startDate ?? ""), dueDate: String(m?.dueDate ?? ""), status: String(m?.status ?? "PLANNED"), displayOrder: String(m?.displayOrder ?? 100) });
  const [tried, setTried] = useState(false);
  const nameErr = f.name.trim() ? "" : "Milestone name is required";
  const dateErr = f.startDate && f.dueDate && f.startDate > f.dueDate ? "Start date cannot be after the due date" : "";
  const orderErr = /^-?\d+$/.test(f.displayOrder.trim()) ? "" : "Display order must be a whole number";
  function save() {
    setTried(true);
    if (nameErr || dateErr || orderErr) return;
    const data = { projectId: p.id, name: f.name.trim(), description: f.description.trim() || undefined, startDate: f.startDate || undefined, dueDate: f.dueDate || undefined, status: f.status, displayOrder: Number(f.displayOrder) };
    if (m) updateRecord("milestones", m.id, data); else createRecord("milestones", data);
    logHistory(String(p.id), m ? "Milestone updated" : "Milestone added", data.name);
    onSaved(m ? "Milestone updated" : "Milestone added");
  }
  return (
    <Dialog open onClose={onClose} title={m ? "Edit milestone" : "New milestone"}>
      <div className="space-y-3">
        <Field label="Name *" htmlFor="milestone-name"><input id="milestone-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></Field>
        {tried && nameErr && <p className="text-xs text-destructive">{nameErr}</p>}
        <Field label="Description" htmlFor="milestone-description"><input id="milestone-description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Start date</Label><DateInput value={f.startDate} onChange={(v) => setF({ ...f, startDate: v })} /></div><div className="space-y-1.5"><Label>Due date</Label><DateInput value={f.dueDate} onChange={(v) => setF({ ...f, dueDate: v })} /></div></div>
        {dateErr && <p className="text-xs text-destructive">{dateErr}</p>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Status</Label><Select value={f.status} onChange={(v) => setF({ ...f, status: v })} options={MS_STATUSES.map(([v, l]) => ({ value: v, label: l }))} ariaLabel="Status" /><p className="text-xs text-muted-foreground">Only a completed milestone can be invoiced.</p></div>
          <Field label="Display order" htmlFor="milestone-order"><input id="milestone-order" type="number" step={1} value={f.displayOrder} onChange={(e) => setF({ ...f, displayOrder: e.target.value })} className={inputCls} /></Field>
        </div>
        {tried && orderErr && <p className="text-xs text-destructive">{orderErr}</p>}
      </div>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={!!dateErr} onClick={save}>{m ? "Save" : "Add"}</button></div>
    </Dialog>
  );
}

/* ---------- project timesheets tab ---------- */

function TimesheetsCard({ sheets, tasks }: { sheets: Rec[]; tasks: Rec[] }) {
  const sum = (rows: Rec[]) => rows.reduce((a, s) => a + num(s.hours), 0);
  const ok = sheets.filter((s) => s.status !== "REJECTED");
  const bill = ok.filter((s) => s.isBillable);
  const h = (v: number) => `${v.toFixed(2)}h`;
  const statuses = ["DRAFT", "SUBMITTED", "APPROVED", "BILLED", "REJECTED"].filter((s) => sheets.some((x) => x.status === s));
  return (
    <Card><div className="space-y-4 p-5">
      {sheets.length === 0 ? <p className="text-sm text-muted-foreground">No timesheets yet. <Link href="/projects/timesheets" className="text-primary hover:underline">Log time →</Link></p> : <>
        <div className="grid gap-4 sm:grid-cols-4">
          <div title="Every entry except rejected ones"><div className="text-xs text-muted-foreground">Actual</div><div className="text-lg font-semibold">{h(sum(ok))}</div></div>
          <div><div className="text-xs text-muted-foreground">Billable</div><div className="text-lg font-semibold">{h(sum(bill))}</div></div>
          <div><div className="text-xs text-muted-foreground">Non-billable</div><div className="text-lg font-semibold">{h(sum(ok) - sum(bill))}</div></div>
          <div><div className="text-xs text-muted-foreground">Rejected (not counted)</div><div className="text-lg font-semibold">{h(sum(sheets.filter((s) => s.status === "REJECTED")))}</div></div>
        </div>
        <div className="flex flex-wrap gap-1">{statuses.map((s) => { const r = sheets.filter((x) => x.status === s); return <Pill key={s}>{s.charAt(0) + s.slice(1).toLowerCase()} · {r.length} · {h(sum(r))}</Pill>; })}</div>
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>User</Th><Th>Task</Th><Th>Hours</Th><Th>Rate</Th><Th>Billable</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>{[...sheets].sort((a, b) => String(b.workDate).localeCompare(String(a.workDate))).map((s) => { const rej = s.status === "REJECTED"; return (
            <tr key={s.id} className={cn("border-b border-border", rej && "text-muted-foreground opacity-60")} title={rej ? "Rejected — not counted in Actual" : undefined}>
              <td className="px-2 py-2">{fmtDate(s.workDate)}</td><td className="px-2 py-2">{String(s.userName || "—")}</td><td className="px-2 py-2">{String(tasks.find((t) => t.id === s.taskId)?.title ?? "—")}</td><td className={cn("px-2 py-2 font-medium", rej && "line-through")}>{num(s.hours).toFixed(2)}</td><td className="px-2 py-2">{s.hourlyRate ? money(num(s.hourlyRate)) : <span className="text-muted-foreground">—</span>}</td><td className="px-2 py-2">{s.isBillable ? <Check className="size-4 text-success" aria-label="Billable" /> : "—"}</td><td className="px-2 py-2"><StatusBadge status={s.status} /></td>
              <td className="px-2 py-2">{s.status === "SUBMITTED" && <div className="flex justify-end gap-1"><button type="button" className={cn(btn.ghost, "h-7 px-2 text-xs")} onClick={() => decideTimesheet(s.id, true)}>Approve</button><button type="button" className={cn(btn.ghost, "h-7 px-2 text-xs")} onClick={() => decideTimesheet(s.id, false)}>Reject</button></div>}</td>
            </tr>
          ); })}</tbody></table>
      </>}
    </div></Card>
  );
}

/* ---------- my tasks ---------- */

export function MyTasks() {
  const tasks = useCollection("project-tasks");
  const projects = useCollection("projects");
  const mine = tasks.filter((t) => t.assignedTo === ME && !["DONE", "CANCELLED"].includes(String(t.status)));
  return (
    <div className="space-y-4">
      <PageHeader title="My Tasks" subtitle="Tasks assigned to you across all projects" />
      <Card><div className="p-5">{mine.length === 0 ? <Empty icon={ClipboardList} title="Nothing on your plate" text="No open tasks are assigned to you." /> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border"><Th>Task</Th><Th>Project</Th><Th>Priority</Th><Th>Due</Th><Th>Est. hrs</Th><Th>Progress</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>{mine.map((t) => (
            <tr key={t.id} className="border-b border-border">
              <td className="px-2 py-2"><div className="font-medium">{String(t.title)}</div><TagList tags={t.tags} /></td><td className="px-2 py-2"><Link href={`${BASE}/${t.projectId}`} className="text-primary hover:underline">{String(projects.find((p) => p.id === t.projectId)?.name ?? "—")}</Link></td>
              <td className="px-2 py-2"><Pill className="text-[10px]">{String(t.priority)}</Pill></td><td className="px-2 py-2">{fmtDate(t.dueDate)}</td><td className="px-2 py-2">{t.estimatedHours ? num(t.estimatedHours) : "—"}</td><td className="px-2 py-2"><Progress value={t.completionPercentage} /></td>
              <td className="px-2 py-2"><Select size="sm" value={String(t.status)} onChange={(v) => updateRecord("project-tasks", t.id, { status: v, ...(v === "DONE" ? { completionPercentage: 100 } : {}) })} options={TASK_STATUSES.map((s) => ({ value: s, label: s }))} className="w-32" ariaLabel={`Status of ${t.title}`} /></td>
              <td className="px-2 py-2 text-right"><RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => confirm(`Delete task "${t.title}"?`) && deleteRecord("project-tasks", t.id) }]} /></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}</div></Card>
    </div>
  );
}

/* ---------- my timesheet ---------- */

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const monday = (d: Date) => { const x = new Date(d); const day = x.getDay(); x.setDate(x.getDate() - day + (day === 0 ? -6 : 1)); x.setHours(0, 0, 0, 0); return x; };
const editable = (s: Rec) => s.status === "DRAFT" || s.status === "REJECTED";
type Row = { projectId: string; taskId: string; isBillable: boolean };

export function Timesheet() {
  const sheets = useCollection("timesheets");
  const projects = useCollection("projects");
  const tasks = useCollection("project-tasks");
  const [week, setWeek] = useState(() => monday(new Date()));
  const [extra, setExtra] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState(false);
  const { node, flash } = useFlash();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(week); d.setDate(week.getDate() + i); return d; }), [week]);
  const from = ymd(days[0]), to = ymd(days[6]);
  const mine = sheets.filter((s) => s.userId === ME && String(s.workDate) >= from && String(s.workDate) <= to);
  const rows: Row[] = [];
  for (const s of mine) if (!rows.some((r) => r.projectId === s.projectId && r.taskId === s.taskId)) rows.push({ projectId: String(s.projectId), taskId: String(s.taskId), isBillable: s.isBillable !== false });
  for (const r of extra) if (!rows.some((x) => x.projectId === r.projectId && x.taskId === r.taskId)) rows.push(r);
  const cell = (r: Row, d: string) => mine.filter((s) => s.projectId === r.projectId && s.taskId === r.taskId && s.workDate === d);
  function save(r: Row, d: string, entry: Rec | undefined, key: string) {
    if (!(key in drafts)) return;
    const raw = drafts[key];
    setDrafts(({ [key]: _, ...rest }) => { void _; return rest; });
    const h = raw.trim() === "" ? 0 : Number(raw);
    if (!Number.isFinite(h) || h < 0 || h > 24) return flash("Hours must be between 0 and 24", true);
    if (entry) { if (h === 0) deleteRecord("timesheets", entry.id); else if (h !== num(entry.hours)) updateRecord("timesheets", entry.id, { hours: h, status: "DRAFT" }); }
    else if (h > 0) logTime({ projectId: r.projectId, taskId: r.taskId, workDate: d, hours: h, isBillable: r.isBillable });
  }
  const shift = (n: number) => { const d = new Date(week); d.setDate(d.getDate() + n); setWeek(d); setExtra([]); setDrafts({}); };
  let total = 0, billable = 0;
  const dayTotals = days.map(() => 0);
  const rowTotals = rows.map((r) => { let t = 0; days.forEach((d, i) => { const h = cell(r, ymd(d)).reduce((a, s) => a + num(s.hours), 0); t += h; dayTotals[i] += h; if (r.isBillable) billable += h; }); total += t; return t; });
  const counts = mine.reduce<Record<string, number>>((a, s) => ({ ...a, [String(s.status)]: (a[String(s.status)] ?? 0) + 1 }), {});
  const canSubmit = mine.some(editable);
  const project = (id: string) => projects.find((p) => p.id === id);
  const task = (id: string) => tasks.find((t) => t.id === id);
  return (
    <div className="space-y-4">
      <PageHeader title="My Timesheet" subtitle="Log time against projects and tasks — tab between cells to fill the week" actions={<>
        <button type="button" className={btn.outline} onClick={() => setAdding(true)}><Plus /> Add row</button>
        <button type="button" className={btn.primary} disabled={!canSubmit} onClick={() => { const n = submitWeek(from, to); flash(`Submitted ${n} ${n === 1 ? "entry" : "entries"} for approval`); }}><Send /> Submit week</button>
      </>} />
      <Card><div className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Previous week" className={cn(btn.outline, "size-8 p-0")} onClick={() => shift(-7)}><ChevronLeft /></button>
            <div className="font-semibold">Week of {week.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
            <button type="button" aria-label="Next week" className={cn(btn.outline, "size-8 p-0")} onClick={() => shift(7)}><ChevronRight /></button>
            <button type="button" className={cn(btn.ghost, "h-8 px-2 text-xs")} onClick={() => { setWeek(monday(new Date())); setExtra([]); }}>This week</button>
          </div>
          <div className="text-sm text-muted-foreground">Total <span className="font-semibold text-foreground">{total.toFixed(2)}h</span> · Billable <span className="font-semibold text-foreground">{billable.toFixed(2)}h</span> · Non-billable <span className="font-semibold text-foreground">{(total - billable).toFixed(2)}h</span></div>
        </div>
        {mine.length > 0 && <div className="flex flex-wrap gap-1">{["DRAFT", "REJECTED", "SUBMITTED", "APPROVED", "BILLED"].filter((s) => counts[s]).map((s) => <Pill key={s}>{counts[s]} {s.toLowerCase()}</Pill>)}</div>}
        {rows.length === 0 ? <Empty icon={Plus} title="No entries this week" text="Click 'Add row' to start logging time." /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><Th>Project</Th><Th>Task</Th><Th className="text-center" title="The task's estimated hours">Est.</Th>{days.map((d) => <Th key={ymd(d)} className="text-center">{d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</Th>)}<Th className="text-center" title="Hours logged this week">Week</Th><Th className="text-center" title="All time logged on the task, excluding rejected">Actual</Th><Th className="text-center" title="Actual − Estimated">Variance</Th></tr></thead>
            <tbody>{rows.map((r, ri) => { const t = task(r.taskId); const actual = taskActualHours(r.taskId, sheets); const est = t?.estimatedHours; const v = est ? Math.round((actual - num(est)) * 100) / 100 : null; return (
              <tr key={`${r.projectId}-${r.taskId}`} className="border-b border-border">
                <td className="px-2 py-2 font-medium">{String(project(r.projectId)?.name ?? "—")}</td>
                <td className="px-2 py-2"><div>{String(t?.title ?? "—")}</div><Pill className="text-[10px]">{r.isBillable ? "Billable" : "Non-billable"}</Pill></td>
                <td className="px-2 py-2 text-center text-muted-foreground">{est ? `${num(est)}h` : "—"}</td>
                {days.map((d) => { const ds = ymd(d); const es = cell(r, ds); const total = es.reduce((a, s) => a + num(s.hours), 0);
                  if (es.length > 1) return <td key={ds} className="px-1 py-2 text-center" title={`${es.length} entries`}>{total}</td>;
                  const e = es[0];
                  if (e && !editable(e)) return <td key={ds} className="px-1 py-2 text-center"><span title={`${String(e.status).toLowerCase()} — can no longer be edited`} className="inline-flex items-center gap-1 text-muted-foreground"><Lock className="size-3" />{num(e.hours)}</span></td>;
                  const key = e ? e.id : `new:${r.projectId}:${r.taskId}:${ds}`;
                  return <td key={ds} className="px-1 py-2 text-center"><input type="number" step="0.25" min="0" max="24" aria-label={`Hours on ${ds} for ${t?.title ?? "task"}`} placeholder="0" value={key in drafts ? drafts[key] : e ? String(num(e.hours)) : ""} onChange={(ev) => setDrafts({ ...drafts, [key]: ev.target.value })} onKeyDown={(ev) => ev.key === "Enter" && ev.currentTarget.blur()} onBlur={() => save(r, ds, e, key)} className={cn(inputCls, "h-8 w-16 px-1 text-center", e?.status === "REJECTED" && "border-destructive")} /></td>;
                })}
                <td className="px-2 py-2 text-center font-medium tabular-nums">{rowTotals[ri].toFixed(2)}</td>
                <td className="px-2 py-2 text-center tabular-nums">{actual}h</td>
                <td className={cn("px-2 py-2 text-center tabular-nums", v != null && v > 0 && "font-medium text-destructive", v != null && v < 0 && "text-muted-foreground")}>{v == null ? "—" : `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v)}h`}</td>
              </tr>
            ); })}</tbody>
            <tfoot><tr><td colSpan={3} className="px-2 py-2 text-xs font-medium text-muted-foreground">Day total</td>{dayTotals.map((d, i) => <td key={i} className={cn("text-center text-xs", d > 24 && "font-semibold text-destructive")}>{d ? Math.round(d * 100) / 100 : ""}</td>)}<td colSpan={3} /></tr></tfoot>
          </table></div>
        )}
        {mine.length > 0 && <div className="space-y-1"><h3 className="text-xs font-semibold text-muted-foreground">Individual entries this week</h3><div className="flex flex-wrap gap-1">{mine.map((s) => <Pill key={s.id}>{String(s.workDate).slice(5)} · {String(project(String(s.projectId))?.name ?? "")} · {num(s.hours).toFixed(2)}h · {String(s.status)}{editable(s) && <button type="button" aria-label="Delete entry" className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => confirm("Delete this entry?") && deleteRecord("timesheets", s.id)}><Trash2 className="size-3" /></button>}</Pill>)}</div></div>}
      </div></Card>
      {adding && <AddRowDialog taken={new Set(rows.map((r) => `${r.projectId}:${r.taskId}`))} onClose={() => setAdding(false)} onAdd={(r) => { setExtra((x) => [...x, r]); setAdding(false); }} />}
      {node}
    </div>
  );
}

function AddRowDialog({ taken, onClose, onAdd }: { taken: Set<string>; onClose: () => void; onAdd: (r: Row) => void }) {
  const projects = useCollection("projects").filter((p) => p.status === "ACTIVE");
  const tasks = useCollection("project-tasks").filter((t) => t.status !== "CANCELLED" && t.status !== "DONE");
  const milestones = useCollection("milestones");
  const [f, setF] = useState({ projectId: "", taskId: "", isBillable: true });
  const pt = tasks.filter((t) => t.projectId === f.projectId && !milestones.find((m) => m.id === t.milestoneId && m.invoiceId));
  const dup = !!f.taskId && taken.has(`${f.projectId}:${f.taskId}`);
  return (
    <Dialog open onClose={onClose} title="Add row">
      <div className="space-y-3">
        <div className="space-y-1.5"><Label>Project *</Label><Select value={f.projectId} onChange={(v) => setF({ ...f, projectId: v, taskId: "" })} placeholder={projects.length ? "Choose project…" : "No active projects"} options={projects.map((p) => ({ value: p.id, label: String(p.name) }))} ariaLabel="Project" /></div>
        <div className="space-y-1.5"><Label>Task *</Label><Select value={f.taskId} onChange={(v) => setF({ ...f, taskId: v, isBillable: tasks.find((t) => t.id === v)?.isBillable !== false })} placeholder={f.projectId && pt.length === 0 ? "No open tasks in this project" : "Choose task…"} options={pt.map((t) => { const m = milestones.find((x) => x.id === t.milestoneId); return { value: t.id, label: m ? `${m.name} · ${t.title}` : String(t.title) }; })} disabled={!f.projectId} ariaLabel="Task" />{dup && <p role="alert" className="text-xs text-destructive">This task is already in this week&apos;s timesheet.</p>}</div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isBillable} onChange={(e) => setF({ ...f, isBillable: e.target.checked })} />Billable</label>
        <p className="text-xs text-muted-foreground">The row is added empty. Nothing is saved until you enter hours in it.</p>
      </div>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={!f.taskId || dup} onClick={() => onAdd(f)}>Add</button></div>
    </Dialog>
  );
}

/* ---------- billing overview ---------- */

export function ProjectBilling() {
  const projects = useCollection("projects");
  const sheets = useCollection("timesheets");
  const rows = projects.map((p) => { const u = unbilled(sheets.filter((s) => s.projectId === p.id)); return { p, count: u.length, hours: u.reduce((a, s) => a + num(s.hours), 0), value: valueOf(u, p.defaultHourlyRate), pending: sheets.filter((s) => s.projectId === p.id && s.status === "SUBMITTED").length }; }).filter((r) => r.count || r.pending);
  return (
    <div className="space-y-4">
      <Link href="/home" className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back to dashboard</Link>
      <PageHeader title="Project Billing" subtitle="Generate invoices from billable project work" />
      <Card><div className="p-5">{rows.length === 0 ? <Empty icon={FileText} title="Nothing to bill" text="Approved, billable timesheets that haven't been invoiced show up here, by project." /> : (
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Project</Th><Th>Customer</Th><Th>Structure</Th><Th className="text-right">Awaiting approval</Th><Th className="text-right">Unbilled hours</Th><Th className="text-right">Unbilled value</Th><Th /></tr></thead>
          <tbody>{rows.map(({ p, count, hours, value, pending }) => (
            <tr key={p.id} className="border-b border-border">
              <td className="px-2 py-2"><div className="font-medium">{String(p.name)}</div><div className="font-mono text-xs text-muted-foreground">{String(p.projectNumber)}</div></td><td className="px-2 py-2">{String(p.customerName || "—")}</td><td className="px-2 py-2"><Pill>{p.workStructure === "MILESTONES" ? "Per milestone" : "Per project"}</Pill></td>
              <td className="px-2 py-2 text-right tabular-nums">{pending}</td><td className="px-2 py-2 text-right tabular-nums">{hours.toFixed(1)} ({count})</td><td className="px-2 py-2 text-right font-medium tabular-nums">{money(value)}</td>
              <td className="px-2 py-2 text-right"><Link href={`${BASE}/${p.id}`} className={btn.smOutline}>Open</Link></td>
            </tr>
          ))}</tbody></table>
      )}</div></Card>
    </div>
  );
}
