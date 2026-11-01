"use client";

// Payroll pages: salary structures, runs (with payslips and bank files), payslips, expense claims,
// investment declarations (+ HR verification), employee loans, full & final, statutory exports.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Calculator, Check, Download, FileText, HandCoins, Landmark, Plus, Printer, Save, Search, ShieldCheck, Trash2, UserMinus, X } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { CLAIM_CATEGORIES, COMPONENT_KINDS, SECTIONS, approveRun, bankFile, computeFnf, computeRun, createFnf, createRun, disburseLoan, emi, esiReturn, form24q, fyOf, loanOutstanding, payFnf, payRun, pfEcr, postRun, processFnf, reimburseClaim, runPayslips, wpsSif } from "@/lib/payroll";
import { fullName, hrSettings, todayIso } from "@/lib/hr";
import { cn } from "@/lib/utils";
import { Card, CardTitle, Dialog, Field, Label, PageHeader, RowMenu, SidePanel, btn, downloadFile, inputCls, money, num } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner, StatusBadge } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";
import { Empty, Pill, Th, fmtDate, useFlash } from "@/components/hr/people";

const Chips = ({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: string[] }) => (
  <div className="flex flex-wrap gap-1">{items.map((s) => <button key={s} type="button" onClick={() => onChange(s)} className={cn("rounded-full border px-2.5 py-0.5 text-xs", value === s ? "border-foreground bg-foreground text-background" : "border-border hover:bg-accent")}>{s === "ALL" || s === "all" ? "All" : s.toLowerCase().replace(/_/g, " ")}</button>)}</div>
);
const SearchBox = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className={cn(inputCls, "pl-9")} /></div>;
const empOpts = (emps: Rec[]) => emps.filter((e) => !["RESIGNED", "TERMINATED"].includes(String(e.status))).map((e) => ({ value: e.id, label: `${fullName(e)} (${e.employeeNumber})` }));
const Stat = ({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) => <Card><div className="p-4"><div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div><div className={cn("mt-1 text-xl font-semibold", highlight && "text-primary")}>{value}</div></div></Card>;
function Confirm({ open, title, body, label, onClose, onConfirm }: { open: boolean; title: string; body: React.ReactNode; label: string; onClose: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onClose={onClose} title={title} description={body}><div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} onClick={() => { onConfirm(); onClose(); }}>{label}</button></div></Dialog>;
}

/* ---------- salary structures ---------- */

export function Structures() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/payroll/structures");
  const structures = useCollection("salary-structures");
  const components = useCollection("salary-components");
  const designations = useCollection("designations");
  const salaries = useCollection("salaries");
  const [open, setOpen] = useState(false);
  const [c, setC] = useState({ code: "", name: "", kind: "EARNING_FIXED", defaultAmount: "", defaultPercentage: "" });
  const { node, flash } = useFlash();
  function createComponent() {
    if (!c.code.trim() || !c.name.trim()) return;
    if (components.some((x) => String(x.code).toLowerCase() === c.code.trim().toLowerCase())) return flash(`Code ${c.code} already exists`, true);
    createRecord("salary-components", { code: c.code.trim().toUpperCase(), name: c.name.trim(), kind: c.kind, defaultAmount: c.defaultAmount ? num(c.defaultAmount) : null, defaultPercentage: c.defaultPercentage ? num(c.defaultPercentage) : null, isActive: true });
    setOpen(false); setC({ code: "", name: "", kind: "EARNING_FIXED", defaultAmount: "", defaultPercentage: "" });
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Salary Structures" subtitle="Define earnings & deductions templates for payroll" actions={<><button type="button" className={btn.smOutline} onClick={() => setOpen(true)}><Plus /> New component</button><Link href="/payroll/structures/new" className={btn.primary}><Plus /> New structure</Link></>} />
      <Card><div className="space-y-4 p-5">
        <div><h3 className="text-sm font-semibold">Components ({components.length})</h3>{components.length === 0 ? <p className="text-xs text-muted-foreground">Create earnings (Basic, HRA, Allowances) and deductions (PF, Tax) first.</p> : <div className="mt-2 flex flex-wrap gap-2">{components.map((x) => <Pill key={x.id}>{String(x.name)}<span className="ml-1 text-[10px] text-muted-foreground">{String(x.kind).replace("_", " ")}{x.defaultPercentage ? ` · ${x.defaultPercentage}%` : x.defaultAmount ? ` · ${money(num(x.defaultAmount))}` : ""}</span><button type="button" aria-label={`Delete ${x.name}`} className="ml-1 text-muted-foreground hover:text-destructive" onClick={() => (structures.some((s) => ((s.components as Rec[]) ?? []).some((y) => y.componentId === x.id)) ? flash("Component is used in a structure", true) : deleteRecord("salary-components", x.id))}><X className="size-3" /></button></Pill>)}</div>}</div>
        <h3 className="text-sm font-semibold">Structures ({structures.length})</h3>
        {structures.length === 0 ? <Empty icon={Plus} title="No salary structures yet" text="Create a structure to assign to employees and use during payroll runs." /> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Code</Th><Th>Name</Th><Th>Designation</Th><Th>Components</Th><Th>Effective from</Th><Th>Active</Th><Th /></tr></thead><tbody>{structures.map((s) => (
            <tr key={s.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(s.code)}</td><td className="px-2 py-2 font-medium">{String(s.name)}</td><td className="px-2 py-2">{String(designations.find((d) => d.id === s.designationId)?.name ?? "—")}</td><td className="px-2 py-2 text-xs text-muted-foreground">{((s.components as Rec[]) ?? []).map((y) => components.find((x) => x.id === y.componentId)?.code).filter(Boolean).join(", ") || "—"}</td><td className="px-2 py-2">{fmtDate(s.effectiveFrom)}</td><td className="px-2 py-2">{s.isActive ? "Yes" : "No"}</td>
              <td className="px-2 py-2 text-right"><RowMenu items={[{ label: s.isActive ? "Deactivate" : "Activate", onSelect: () => { updateRecord("salary-structures", s.id, { isActive: !s.isActive }); flash(s.isActive ? "Deactivated" : "Activated"); } }, { label: "Delete", destructive: true, onSelect: () => (salaries.some((x) => x.structure === s.id) ? flash("Structure is assigned to employees — deactivate it instead", true) : confirm(`Delete ${s.name}?`) && deleteRecord("salary-structures", s.id)) }]} /></td></tr>
          ))}</tbody></table>
        )}
      </div></Card>
      <Dialog open={open} onClose={() => setOpen(false)} title="New salary component">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Code *" htmlFor="sc-code"><input id="sc-code" value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} className={inputCls} /></Field><Field label="Name *" htmlFor="sc-name"><input id="sc-name" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} className={inputCls} /></Field></div>
          <div className="space-y-1.5"><Label>Kind *</Label><Select value={c.kind} onChange={(v) => setC({ ...c, kind: v })} options={COMPONENT_KINDS} ariaLabel="Kind" /></div>
          <div className="grid gap-3 sm:grid-cols-2"><Field label="Default amount" htmlFor="sc-amt"><input id="sc-amt" type="number" step="0.001" value={c.defaultAmount} onChange={(e) => setC({ ...c, defaultAmount: e.target.value })} className={inputCls} /></Field><Field label="Default %" htmlFor="sc-pct"><input id="sc-pct" type="number" step="0.001" value={c.defaultPercentage} onChange={(e) => setC({ ...c, defaultPercentage: e.target.value })} className={inputCls} /></Field></div>
        </div>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!c.code.trim() || !c.name.trim()} onClick={createComponent}>Create</button></div>
      </Dialog>
      {sub === "new" && <SidePanel onClose={() => router.push("/payroll/structures")}><StructureForm onDone={() => router.push("/payroll/structures")} /></SidePanel>}
      {node}
    </div>
  );
}

function StructureForm({ onDone }: { onDone: () => void }) {
  const components = useCollection("salary-components");
  const designations = useCollection("designations");
  const [f, setF] = useState({ code: "", name: "", designationId: "", effectiveFrom: todayIso() });
  const [lines, setLines] = useState<{ componentId: string; amount: string; percent: string }[]>([]);
  const [error, setError] = useState("");
  const comp = (id: string) => components.find((c) => c.id === id);
  function submit() {
    if (!f.code.trim() || !f.name.trim()) return setError("Code and name are required.");
    if (!lines.some((l) => l.componentId)) return setError("Add at least one component.");
    createRecord("salary-structures", { ...f, code: f.code.trim(), name: f.name.trim(), designationId: f.designationId || null, isActive: true, components: lines.filter((l) => l.componentId).map((l) => ({ componentId: l.componentId, amount: l.amount ? num(l.amount) : null, percent: l.percent ? num(l.percent) : null })) });
    onDone();
  }
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New salary structure</h1><p className="text-sm text-muted-foreground">Earnings and deductions on top of basic salary</p></div>
      <Card><div className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Code *" htmlFor="ss-code"><input id="ss-code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="e.g. STD-01" className={inputCls} /></Field><Field label="Name *" htmlFor="ss-name"><input id="ss-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Standard staff" className={inputCls} /></Field></div>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Designation</Label><Select value={f.designationId} onChange={(v) => setF({ ...f, designationId: v })} options={[{ value: "", label: "— Any —" }, ...designations.map((d) => ({ value: d.id, label: String(d.name) }))]} ariaLabel="Designation" /></div><div className="space-y-2"><Label>Effective from</Label><DateInput value={f.effectiveFrom} onChange={(v) => setF({ ...f, effectiveFrom: v })} /></div></div>
        <div className="space-y-2"><div className="flex items-center justify-between"><Label>Components</Label><button type="button" className={btn.smOutline} disabled={!components.length} onClick={() => setLines([...lines, { componentId: "", amount: "", percent: "" }])}><Plus /> Add component</button></div>
          {components.length === 0 && <p className="text-xs text-muted-foreground">Create components first with “New component”.</p>}
          {lines.map((l, i) => { const c = comp(l.componentId); const pct = String(c?.kind ?? "").endsWith("PERCENT"); return (
            <div key={i} className="flex items-center gap-2">
              <Select value={l.componentId} onChange={(v) => setLines(lines.map((x, j) => (j === i ? { ...x, componentId: v } : x)))} placeholder="Component" options={components.filter((x) => x.code !== "BASIC").map((x) => ({ value: x.id, label: `${x.name} — ${String(x.kind).replace(/_/g, " ").toLowerCase()}` }))} className="flex-1" ariaLabel="Component" />
              {c && (pct ? <input type="number" step="0.001" aria-label="Percent of basic" placeholder={`${num(c.defaultPercentage)}% of basic`} value={l.percent} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, percent: e.target.value } : x)))} className={cn(inputCls, "w-36")} /> : <input type="number" step="0.001" aria-label="Amount" placeholder={c.defaultAmount ? String(c.defaultAmount) : "Amount"} value={l.amount} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} className={cn(inputCls, "w-36")} />)}
              <button type="button" aria-label="Remove" className={btn.icon} onClick={() => setLines(lines.filter((_, j) => j !== i))}><Trash2 /></button>
            </div>
          ); })}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={submit}>Create structure</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </div></Card>
    </div>
  );
}

/* ---------- runs ---------- */

const R_BASE = "/payroll/runs";
const RUN_STATUSES = ["ALL", "DRAFT", "COMPUTED", "APPROVED", "POSTED", "PAID", "CANCELLED"];
const dl = (r: Rec, f: "nacha" | "sepa" | "csv") => downloadFile(`payroll-${String(r.runNumber)}-${f}.${f === "csv" ? "csv" : f === "sepa" ? "xml" : "txt"}`, bankFile(r.id, f), "text/plain");
const BankButtons = ({ r }: { r: Rec }) => <>{(["nacha", "sepa", "csv"] as const).map((f) => <button key={f} type="button" className={btn.smOutline} onClick={() => dl(r, f)}><Download /> {f.toUpperCase()}</button>)}</>;

export function Runs() {
  const router = useRouter();
  const sub = subOf(usePathname(), R_BASE);
  const runs = useCollection("payroll-runs");
  useCollection("payslips");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [confirm, setConfirm] = useState<{ r: Rec; kind: "compute" | "approve" | "post" | "pay" } | null>(null);
  const { node, flash } = useFlash();
  const rows = [...runs].filter((r) => (status === "ALL" || r.status === status) && (!q.trim() || String(r.runNumber).toLowerCase().includes(q.trim().toLowerCase()))).sort((a, b) => `${b.periodYear}${String(b.periodMonth).padStart(2, "0")}`.localeCompare(`${a.periodYear}${String(a.periodMonth).padStart(2, "0")}`));
  const detail = sub && sub !== "new" ? runs.find((r) => r.id === sub) : undefined;
  const act = () => {
    if (!confirm) return;
    const { r, kind } = confirm;
    try {
      if (kind === "compute") flash(`Payroll computed — ${computeRun(r.id)} payslip(s)`);
      if (kind === "approve") { approveRun(r.id); flash("Payroll approved"); }
      if (kind === "post") { postRun(r.id); flash("Posted to GL"); }
      if (kind === "pay") { payRun(r.id); flash("Marked paid"); }
    } catch (e) { flash((e as Error).message, true); }
  };
  const text = confirm && {
    compute: { title: confirm.r.status === "DRAFT" ? "Compute payroll" : "Recompute payroll", body: <>This will generate / regenerate one payslip per active employee for <strong>{String(confirm.r.runNumber)}</strong>, including statutory deductions for your HR country ({hrSettings().country}), income tax (using verified declarations), unpaid leave and any loan EMIs due in the period.</>, label: confirm.r.status === "DRAFT" ? "Compute" : "Recompute" },
    approve: { title: "Approve payroll", body: <>Approve run <strong>{String(confirm.r.runNumber)}</strong>. Net payable: {money(num(confirm.r.totalNet))} across {num(confirm.r.employeeCount)} employees.</>, label: "Approve" },
    post: { title: "Post payroll to GL", body: <>This will create a journal entry: DR Salary Expense {money(num(confirm.r.totalGross))}, CR Salaries Payable {money(num(confirm.r.totalNet))}, CR Deductions Payable {money(num(confirm.r.totalDeductions))}.</>, label: "Post" },
    pay: { title: "Mark payroll paid", body: <>Record the bank payment of {money(num(confirm.r.totalNet))}: DR Salaries Payable, CR Bank.</>, label: "Mark paid" },
  }[confirm.kind];
  return (
    <div className="space-y-4">
      <PageHeader title="Payroll runs" subtitle="Monthly payroll: compute → approve → post to GL → bank disbursement" actions={<Link href={`${R_BASE}/new`} className={btn.primary}><Plus /> New run</Link>} />
      <div className="flex flex-wrap items-center gap-3"><SearchBox value={q} onChange={setQ} placeholder="Search run number…" /><Chips value={status} onChange={setStatus} items={RUN_STATUSES} /><span className="ml-auto text-sm text-muted-foreground">{rows.length} of {runs.length}</span></div>
      <Card><div className="p-5">{runs.length === 0 ? <Empty icon={Banknote} title="No payroll runs yet" text="Create a run for the current month. Compute → Approve → Post will draft journal entries and generate bank disbursement files." action={<Link href={`${R_BASE}/new`} className={btn.smPrimary}><Plus /> New run</Link>} /> : (
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Run #</Th><Th>Period</Th><Th className="text-right">Employees</Th><Th className="text-right">Gross</Th><Th className="text-right">Deductions</Th><Th className="text-right">Net</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id} className="border-b border-border">
              <td className="px-2 py-2"><Link href={`${R_BASE}/${r.id}`} className="font-mono text-xs text-primary hover:underline">{String(r.runNumber)}</Link></td><td className="px-2 py-2"><Link href={`${R_BASE}/${r.id}`} className="hover:underline">{String(r.periodYear)}-{String(r.periodMonth).padStart(2, "0")}</Link></td>
              <td className="px-2 py-2 text-right tabular-nums">{num(r.employeeCount)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(r.totalGross))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(r.totalDeductions))}</td><td className="px-2 py-2 text-right font-medium tabular-nums">{money(num(r.totalNet))}</td><td className="px-2 py-2"><StatusBadge status={r.status} /></td>
              <td className="px-2 py-2"><div className="flex flex-wrap justify-end gap-1">
                {(r.status === "DRAFT" || r.status === "COMPUTED") && <button type="button" className={btn.smPrimary} onClick={() => setConfirm({ r, kind: "compute" })}>{r.status === "DRAFT" ? "Compute" : "Recompute"}</button>}
                {r.status === "COMPUTED" && <button type="button" className={btn.smOutline} disabled={!num(r.employeeCount)} onClick={() => setConfirm({ r, kind: "approve" })}>Approve</button>}
                {r.status === "APPROVED" && <button type="button" className={btn.smOutline} onClick={() => setConfirm({ r, kind: "post" })}>Post to GL</button>}
                {r.status === "POSTED" && <button type="button" className={btn.smPrimary} onClick={() => setConfirm({ r, kind: "pay" })}>Mark paid</button>}
                {(r.status === "POSTED" || r.status === "PAID") && <BankButtons r={r} />}
                {["DRAFT", "COMPUTED", "APPROVED"].includes(String(r.status)) && <RowMenu items={[{ label: "Cancel run", destructive: true, onSelect: () => updateRecord("payroll-runs", r.id, { status: "CANCELLED" }) }]} />}
              </div></td>
            </tr>
          ))}{rows.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No runs match your filters</td></tr>}</tbody></table></div>
      )}</div></Card>
      {confirm && text && <Confirm open title={text.title} body={text.body} label={text.label} onClose={() => setConfirm(null)} onConfirm={act} />}
      {sub === "new" && <SidePanel onClose={() => router.push(R_BASE)}><RunForm onDone={(id) => router.push(id ? `${R_BASE}` : R_BASE)} /></SidePanel>}
      {detail && <SidePanel onClose={() => router.push(R_BASE)}><RunDetail key={detail.id} run={detail} /></SidePanel>}
      {node}
    </div>
  );
}

function RunForm({ onDone }: { onDone: (id?: string) => void }) {
  const now = new Date();
  const [f, setF] = useState({ year: String(now.getFullYear()), month: String(now.getMonth() + 1), notes: "" });
  const [error, setError] = useState("");
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New payroll run</h1><p className="text-sm text-muted-foreground">Monthly payroll: compute → approve → post to GL → bank disbursement</p></div>
      <Card className="max-w-xl"><div className="space-y-4 p-5"><CardTitle>Run details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Year" htmlFor="pr-year"><input id="pr-year" type="number" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} className={inputCls} /></Field><Field label="Month (1-12)" htmlFor="pr-month"><input id="pr-month" type="number" min={1} max={12} value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })} className={inputCls} /></Field></div>
        <Field label="Notes" htmlFor="pr-notes"><input id="pr-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={inputCls} /></Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={() => { try { const r = createRun(num(f.year), num(f.month), f.notes || undefined); onDone(r.id); } catch (e) { setError((e as Error).message); } }}>Create</button><button type="button" className={btn.outline} onClick={() => onDone()}>Cancel</button></div>
      </div></Card>
    </div>
  );
}

function RunDetail({ run: r }: { run: Rec }) {
  const slips = runPayslips(r.id, useCollection("payslips"));
  const paid = r.status === "POSTED" || r.status === "PAID";
  const amt = (v: unknown) => (num(v) ? money(num(v)) : "—");
  return (
    <div className="space-y-4">
      <PageHeader title={`Payroll run ${r.runNumber}`} subtitle={`Period ${r.periodYear}-${String(r.periodMonth).padStart(2, "0")} · ${num(r.employeeCount)} employee${num(r.employeeCount) === 1 ? "" : "s"}`} actions={<><Link href={R_BASE} className={btn.smOutline}><ArrowLeft /> Back</Link>{paid && <BankButtons r={r} />}</>} />
      <div className="grid gap-3 sm:grid-cols-5"><Stat label="Status" value={<StatusBadge status={r.status} />} /><Stat label="Period" value={<span className="text-sm">{fmtDate(r.periodStart)} → {fmtDate(r.periodEnd)}</span>} /><Stat label="Gross" value={money(num(r.totalGross))} /><Stat label="Deductions" value={money(num(r.totalDeductions))} /><Stat label="Net" value={money(num(r.totalNet))} highlight /></div>
      <Card><div className="overflow-x-auto p-5">{slips.length === 0 ? <Empty icon={FileText} title="No payslips yet" text={r.status === "DRAFT" ? "Compute the run from the list page to generate payslips." : "No employees with an assigned salary were found at compute time."} /> : (
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th className="text-right">Days</Th><Th className="text-right">Basic</Th><Th className="text-right">Gross</Th><Th className="text-right">PF / NI</Th><Th className="text-right">ESI</Th><Th className="text-right">PT</Th><Th className="text-right">Tax</Th><Th className="text-right">Loan EMI</Th><Th className="text-right">Net</Th></tr></thead>
          <tbody>{slips.map((s) => <tr key={s.id} className="border-b border-border"><td className="px-2 py-2"><Link href={`/payroll/payslips/${s.id}`} className="font-medium text-primary hover:underline">{String(s.employeeName)}</Link></td><td className="px-2 py-2 text-right tabular-nums">{num(s.daysWorked)}/{num(s.workingDays)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(s.basicSalary))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(s.grossAmount))}</td><td className="px-2 py-2 text-right tabular-nums">{amt(num(s.pfEmployeeContribution) + num(s.niContribution))}</td><td className="px-2 py-2 text-right tabular-nums">{amt(s.esiEmployeeContribution)}</td><td className="px-2 py-2 text-right tabular-nums">{amt(s.professionalTax)}</td><td className="px-2 py-2 text-right tabular-nums">{amt(s.incomeTaxDeducted)}</td><td className="px-2 py-2 text-right tabular-nums">{amt(s.loanEmiTotal)}</td><td className="px-2 py-2 text-right font-semibold tabular-nums">{money(num(s.netAmount))}</td></tr>)}</tbody></table>
      )}</div></Card>
    </div>
  );
}

/* ---------- payslips ---------- */

export function Payslips() {
  const sub = subOf(usePathname(), "/payroll/payslips");
  const runs = useCollection("payroll-runs");
  const all = useCollection("payslips");
  const [runId, setRunId] = useState("");
  if (sub) return <PayslipDetail id={sub} />;
  const sel = runId || runs.filter((r) => r.status !== "DRAFT")[0]?.id || "";
  const slips = sel ? runPayslips(sel, all) : [];
  return (
    <div className="space-y-4">
      <PageHeader title="Payslips" subtitle="Individual employee pay statements by payroll run" />
      <Card><div className="space-y-3 p-5">
        <div className="w-72 space-y-1"><Label>Payroll run</Label><Select value={sel} onChange={setRunId} placeholder="Select a run" options={runs.map((r) => ({ value: r.id, label: `${r.runNumber} · ${r.periodYear}-${String(r.periodMonth).padStart(2, "0")} · ${String(r.status).toLowerCase()}` }))} ariaLabel="Payroll run" /></div>
        {runs.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No payroll runs yet. Create and compute a run to generate payslips.</p> : slips.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No payslips in this run yet — compute it first.</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th className="text-right">Basic</Th><Th className="text-right">Gross</Th><Th className="text-right">Deductions</Th><Th className="text-right">Net Pay</Th><Th>Status</Th></tr></thead><tbody>{slips.map((s) => <tr key={s.id} className="border-b border-border"><td className="px-2 py-2"><Link href={`/payroll/payslips/${s.id}`} className="font-medium text-primary hover:underline">{String(s.employeeName)}</Link><div className="text-xs text-muted-foreground">{String(s.employeeNumber)}</div></td><td className="px-2 py-2 text-right tabular-nums">{money(num(s.basicSalary))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(s.grossAmount))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(s.deductionsAmount))}</td><td className="px-2 py-2 text-right font-semibold tabular-nums">{money(num(s.netAmount))}</td><td className="px-2 py-2"><StatusBadge status={s.status} /></td></tr>)}</tbody></table>
        )}
      </div></Card>
    </div>
  );
}

const STATUTORY = ["PF_EE", "ESI_EE", "PT", "LWF_EE", "TDS", "NI_EE", "LOAN_EMI"];

function PayslipDetail({ id }: { id: string }) {
  const all = useCollection("payslips");
  const runs = useCollection("payroll-runs");
  const s = all.find((x) => x.id === id);
  if (!all.length) return null;
  if (!s) return <p className="p-6 text-sm text-muted-foreground">Payslip not found.</p>;
  const run = runs.find((r) => r.id === s.payrollRunId);
  const lines = (s.lines as Rec[]) ?? [];
  const earn = lines.filter((l) => String(l.kind).startsWith("EARNING") || l.kind === "REIMBURSEMENT");
  const ded = lines.filter((l) => String(l.kind).startsWith("DEDUCTION"));
  return (
    <div className="space-y-4">
      <style>{`@media print { body * { visibility: hidden !important; } #payslip, #payslip * { visibility: visible !important; } #payslip { position: absolute; inset: 0; padding: 24px; } }`}</style>
      <PageHeader title={`Payslip · ${s.employeeName}`} subtitle={`Employee #${s.employeeNumber} · ${num(s.daysWorked)} days worked${num(s.lopDays) ? ` · ${num(s.lopDays)} unpaid` : ""}`} actions={<><Link href={`/payroll/runs/${s.payrollRunId}`} className={btn.smOutline}><ArrowLeft /> Back to run</Link><button type="button" className={btn.smPrimary} onClick={() => window.print()}><Printer /> PDF</button></>} />
      <div id="payslip" className="space-y-4">
        <div className="hidden print:block"><h2 className="text-xl font-bold">Payslip — {String(run?.periodYear)}-{String(run?.periodMonth).padStart(2, "0")}</h2><p>{String(s.employeeName)} · {String(s.employeeNumber)}</p></div>
        <div className="grid gap-3 sm:grid-cols-4"><Stat label="Status" value={<StatusBadge status={s.status} />} /><Stat label="Basic" value={money(num(s.basicSalary))} /><Stat label="Gross" value={money(num(s.grossAmount))} /><Stat label="Net pay" value={money(num(s.netAmount))} highlight /></div>
        <div className="grid gap-4 md:grid-cols-2">
          {([["Earnings", earn, "Total gross", num(s.grossAmount), ""], ["Deductions", ded, "Total deductions", num(s.deductionsAmount), "− "]] as const).map(([title, list, total, value, sign]) => (
            <Card key={title}><div className="space-y-2 p-5">
              <div className="flex justify-between"><CardTitle className="text-base">{title}</CardTitle><span className="text-xs text-muted-foreground">{list.length} item{list.length === 1 ? "" : "s"}</span></div>
              <ul className="divide-y divide-border">{list.map((l) => <li key={String(l.id)} className="flex justify-between py-2 text-sm"><div><div>{String(l.componentName)}</div><div className="text-xs text-muted-foreground">{String(l.componentCode)}{STATUTORY.includes(String(l.componentCode)) ? " · statutory" : ""}</div></div><div className="tabular-nums">{sign}{money(num(l.amount))}</div></li>)}{list.length === 0 && <li className="py-2 text-sm text-muted-foreground">No {title.toLowerCase()}</li>}</ul>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><span>{total}</span><span className="tabular-nums">{sign}{money(value)}</span></div>
            </div></Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- expense claims ---------- */

const C_BASE = "/payroll/expense-claims";

export function ExpenseClaims() {
  const router = useRouter();
  const sub = subOf(usePathname(), C_BASE);
  const claims = useCollection("expense-claims");
  const emps = useCollection("employees");
  const [status, setStatus] = useState("ALL");
  const { node, flash } = useFlash();
  const rows = [...claims].filter((c) => status === "ALL" || c.status === status).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const set = (c: Rec, s: string, msg: string) => { updateRecord("expense-claims", c.id, { status: s, [`${s.toLowerCase()}At`]: todayIso() }); flash(msg); };
  return (
    <div className="space-y-4">
      <PageHeader title="Expense Claims" subtitle="Employee reimbursement requests" actions={<Link href={`${C_BASE}/new`} className={btn.primary}><Plus /> New claim</Link>} />
      <Card><div className="space-y-3 p-5">
        <div role="tablist" className="inline-flex flex-wrap rounded-lg bg-muted p-1 text-sm">{[["ALL", "All"], ["DRAFT", "Draft"], ["SUBMITTED", "Submitted"], ["APPROVED", "Approved"], ["REIMBURSED", "Reimbursed"], ["REJECTED", "Rejected"]].map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={status === v} onClick={() => setStatus(v)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", status === v && "bg-background text-foreground shadow")}>{l}</button>)}</div>
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Claim #</Th><Th>Employee</Th><Th>Date</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No expense claims</td></tr> : rows.map((c) => (
            <tr key={c.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(c.claimNumber)}</td><td className="px-2 py-2 font-medium">{fullName(emps.find((e) => e.id === c.employeeId))}{Boolean(c.description) && <div className="text-xs font-normal text-muted-foreground">{String(c.description)}</div>}</td><td className="px-2 py-2">{fmtDate(c.claimDate ?? c.createdAt)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(c.totalAmount))}</td><td className="px-2 py-2"><StatusBadge status={c.status} /></td>
              <td className="px-2 py-2"><div className="flex justify-end gap-1">
                {c.status === "DRAFT" && <button type="button" className={btn.smOutline} onClick={() => set(c, "SUBMITTED", "Submitted")}>Submit</button>}
                {c.status === "SUBMITTED" && <><button type="button" className={btn.smPrimary} onClick={() => set(c, "APPROVED", "Approved")}>Approve</button><button type="button" className={btn.smOutline} onClick={() => set(c, "REJECTED", "Rejected")}>Reject</button></>}
                {c.status === "APPROVED" && <button type="button" className={btn.smPrimary} onClick={() => { reimburseClaim(c.id); flash("Reimbursed — posted to the ledger"); }}>Mark reimbursed</button>}
                {(c.status === "DRAFT" || c.status === "REJECTED") && <RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => deleteRecord("expense-claims", c.id) }]} />}
              </div></td></tr>
          ))}</tbody></table>
      </div></Card>
      {sub === "new" && <SidePanel onClose={() => router.push(C_BASE)}><ClaimForm onDone={() => router.push(C_BASE)} /></SidePanel>}
      {node}
    </div>
  );
}

function ClaimForm({ onDone }: { onDone: () => void }) {
  const emps = useCollection("employees");
  const [f, setF] = useState({ employeeId: "", description: "" });
  const [items, setItems] = useState([{ category: "TRAVEL", date: todayIso(), description: "", amount: "" }]);
  const [error, setError] = useState("");
  const total = items.reduce((a, i) => a + num(i.amount), 0);
  const next = `EXC-${String(readCollection("expense-claims").length + 1).padStart(2, "0")}`;
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New expense claim</h1><p className="text-sm text-muted-foreground">Employee reimbursement requests</p></div>
      <Card><div className="space-y-4 p-5"><CardTitle>Claim details</CardTitle>
        <NumberBanner label="Claim #" value={next} />
        <div className="space-y-2"><Label>Employee *</Label><Select value={f.employeeId} onChange={(v) => setF({ ...f, employeeId: v })} placeholder="Choose" options={empOpts(emps)} ariaLabel="Employee" /></div>
        <Field label="Description" htmlFor="ec-desc"><input id="ec-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
        <div className="space-y-2"><div className="flex items-center justify-between"><Label>Items</Label><button type="button" className={btn.smOutline} onClick={() => setItems([...items, { category: "TRAVEL", date: todayIso(), description: "", amount: "" }])}><Plus /> Add line</button></div>
          {items.map((it, i) => (
            <div key={i} className="grid items-center gap-2 sm:grid-cols-[9rem_10rem_minmax(0,1fr)_8rem_2rem]">
              <select aria-label="Category" value={it.category} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} className={inputCls}>{CLAIM_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
              <DateInput value={it.date} onChange={(v) => setItems(items.map((x, j) => (j === i ? { ...x, date: v } : x)))} />
              <input aria-label="Line description" placeholder="Description" value={it.description} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} className={inputCls} />
              <input aria-label="Amount" type="number" step="0.001" placeholder="0.00" value={it.amount} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)))} className={inputCls} />
              <button type="button" aria-label="Remove line" className={btn.icon} disabled={items.length <= 1} onClick={() => setItems(items.filter((_, j) => j !== i))}><Trash2 /></button>
            </div>
          ))}
          <div className="text-right text-sm font-semibold">Total: {money(total)}</div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={() => { if (!f.employeeId) return setError("Choose an employee"); const valid = items.filter((i) => num(i.amount) > 0); if (!valid.length) return setError("Add at least one item with an amount"); createRecord("expense-claims", { ...f, claimNumber: nextNumber("expense-claims", "EXC"), claimDate: todayIso(), items: valid.map((i) => ({ ...i, amount: num(i.amount) })), totalAmount: Math.round(total * 1000) / 1000, status: "DRAFT" }); onDone(); }}>Create</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </div></Card>
    </div>
  );
}

/* ---------- investment declarations ---------- */

const currentFy = () => { const d = new Date(); return fyOf(d.getFullYear(), d.getMonth() + 1); };

export function Declarations() {
  const emps = useCollection("employees");
  const decls = useCollection("declarations");
  const [employeeId, setEmployeeId] = useState("");
  const [fy, setFy] = useState(currentFy());
  const [draft, setDraft] = useState<Record<string, { declared: string; proofAmount: string; proofUrl: string }>>({});
  const { node, flash } = useFlash();
  const e = emps.find((x) => x.id === employeeId);
  const regime = String(e?.taxRegime ?? "OLD");
  const mine = decls.filter((d) => d.employeeId === employeeId && d.fy === fy);
  const sections = SECTIONS.filter((s) => s.regime === "BOTH" || s.regime === regime);
  const row = (code: string) => mine.find((d) => d.section === code);
  const val = (code: string, k: "declared" | "proofAmount" | "proofUrl") => draft[code]?.[k] ?? String(row(code)?.[k] ?? "");
  const sum = (k: string, filter?: (d: Rec) => boolean) => mine.filter(filter ?? (() => true)).reduce((a, d) => a + num(d[k]), 0);
  function save() {
    for (const [code, d] of Object.entries(draft)) {
      const s = SECTIONS.find((x) => x.code === code)!;
      const existing = row(code);
      if (existing?.status === "verified") continue;
      const data = { employeeId, fy, section: code, description: s.description, cap: s.max || null, declared: num(d.declared ?? existing?.declared), proofAmount: num(d.proofAmount ?? existing?.proofAmount), proofUrl: d.proofUrl ?? existing?.proofUrl ?? "", status: num(d.proofAmount ?? existing?.proofAmount) > 0 ? "proof_submitted" : "declared" };
      if (existing) updateRecord("declarations", existing.id, data); else if (data.declared || data.proofAmount) createRecord("declarations", data);
    }
    setDraft({}); flash("Declarations saved");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Investment declarations" subtitle="80C, 80D, HRA, LTA — declare investments and upload proofs for Form 16" actions={<Link href="/payroll/declarations/verify" className={btn.outline}><ShieldCheck /> HR verification queue</Link>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1"><Label>Employee</Label><Select value={employeeId} onChange={(v) => { setEmployeeId(v); setDraft({}); }} placeholder="— Select —" options={empOpts(emps)} ariaLabel="Employee" /></div>
        <Field label="Financial year" htmlFor="dc-fy"><input id="dc-fy" value={fy} onChange={(ev) => setFy(ev.target.value)} className={inputCls} /></Field>
        <div className="space-y-1"><Label>Tax regime</Label><div className="flex gap-2">{["OLD", "NEW"].map((r) => <button key={r} type="button" disabled={!e} title={r === "OLD" ? "Old regime allows 80C/80D/HRA deductions. Once payroll runs for this FY the choice is locked." : "New regime has lower slab rates but most Chapter VI-A deductions are disallowed. Standard deduction still applies."} onClick={() => { if (readCollection("payslips").some((p) => p.employeeId === employeeId && !p.deleted && p.status !== "DRAFT")) return flash("The regime is locked once payroll has been posted for this employee", true); updateRecord("employees", employeeId, { taxRegime: r }); }} className={cn("rounded-full border px-3 py-1 text-xs", regime === r && e ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-accent")}>{r} regime</button>)}</div></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3"><Stat label="Total declared" value={money(sum("declared"))} /><Stat label="Total proof submitted" value={money(sum("proofAmount"))} /><Stat label="Total verified (used for tax)" value={money(sum("verifiedAmount", (d) => d.status === "verified"))} /></div>
      <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between"><CardTitle className="text-base">Sections applicable to {regime} regime</CardTitle><button type="button" className={btn.smPrimary} disabled={!e || !Object.keys(draft).length} onClick={save}><Save /> Save declarations</button></div>
        {!e ? <Empty icon={FileText} title="Choose an employee" text="Pick an employee to declare investments for the financial year." /> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Section</Th><Th>Description</Th><Th className="text-right">Max</Th><Th>Declared</Th><Th>Proof amount</Th><Th>Proof URL</Th><Th>Status</Th><Th /></tr></thead><tbody>{sections.map((s) => { const r = row(s.code); const locked = r?.status === "verified"; const set = (k: "declared" | "proofAmount" | "proofUrl", v: string) => setDraft({ ...draft, [s.code]: { declared: val(s.code, "declared"), proofAmount: val(s.code, "proofAmount"), proofUrl: val(s.code, "proofUrl"), [k]: v } }); return (
            <tr key={s.code} className="border-b border-border"><td className="px-2 py-1.5 font-mono text-xs">{s.code}</td><td className="px-2 py-1.5">{s.description}</td><td className="px-2 py-1.5 text-right tabular-nums">{s.max ? money(s.max) : "—"}</td>
              <td className="px-2 py-1.5"><input type="number" disabled={locked} aria-label={`Declared ${s.code}`} value={val(s.code, "declared")} onChange={(ev) => set("declared", ev.target.value)} className={cn(inputCls, "h-8 w-28")} /></td>
              <td className="px-2 py-1.5"><input type="number" disabled={locked} aria-label={`Proof amount ${s.code}`} value={val(s.code, "proofAmount")} onChange={(ev) => set("proofAmount", ev.target.value)} className={cn(inputCls, "h-8 w-28")} /></td>
              <td className="px-2 py-1.5"><input disabled={locked} placeholder="https://… (paste proof URL)" aria-label={`Proof URL ${s.code}`} value={val(s.code, "proofUrl")} onChange={(ev) => set("proofUrl", ev.target.value)} className={cn(inputCls, "h-8")} /></td>
              <td className="px-2 py-1.5">{r ? <Pill className={r.status === "verified" ? "text-success" : r.status === "rejected" ? "text-destructive" : ""}>{String(r.status).replace("_", " ")}</Pill> : "—"}</td>
              <td className="px-2 py-1.5">{r && !locked && <button type="button" aria-label="Delete" className={btn.icon} onClick={() => deleteRecord("declarations", r.id)}><Trash2 /></button>}</td></tr>
          ); })}</tbody></table>
        )}
        <p className="text-xs text-muted-foreground">Note: only <strong>verified</strong> proof amounts are deducted from taxable income when payroll runs. HR verifies submissions in the queue page.</p>
      </div></Card>
      {node}
    </div>
  );
}

export function VerifyDeclarations() {
  const decls = useCollection("declarations");
  const emps = useCollection("employees");
  const [status, setStatus] = useState("all");
  const [fy, setFy] = useState(currentFy());
  const rows = decls.filter((d) => d.fy === fy && (status === "all" || d.status === status));
  const toReview = decls.filter((d) => d.fy === fy && d.status === "proof_submitted").length;
  return (
    <div className="space-y-4">
      <PageHeader title="Declaration verification" subtitle="Review employee-submitted investment proofs before they reduce taxable income" actions={<Link href="/payroll/declarations" className={btn.outline}><ArrowLeft /> Back to declarations</Link>} />
      <div className="flex flex-wrap items-center gap-3"><input aria-label="Financial year" value={fy} onChange={(e) => setFy(e.target.value)} className={cn(inputCls, "w-28")} /><Chips value={status} onChange={setStatus} items={["all", "declared", "proof_submitted", "verified", "rejected"]} /><span className="ml-auto text-sm text-muted-foreground">To review: {toReview} · Verified: {decls.filter((d) => d.fy === fy && d.status === "verified").length}</span></div>
      <Card><div className="p-5">{rows.length === 0 ? <Empty icon={ShieldCheck} title="Nothing to verify" text="When employees submit investment declarations with proof, they'll appear here for HR approval." /> : (
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Section</Th><Th className="text-right">Declared</Th><Th className="text-right">Proof</Th><Th className="text-right">Cap</Th><Th>Proof URL</Th><Th>Status</Th><Th /></tr></thead><tbody>{rows.map((d) => (
          <tr key={d.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{fullName(emps.find((e) => e.id === d.employeeId))}</td><td className="px-2 py-2 font-mono text-xs">{String(d.section)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(d.declared))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(d.proofAmount))}</td><td className="px-2 py-2 text-right tabular-nums">{d.cap ? money(num(d.cap)) : "—"}</td><td className="px-2 py-2">{d.proofUrl ? <a href={String(d.proofUrl)} target="_blank" rel="noreferrer" className="text-primary hover:underline">Open</a> : <span className="text-muted-foreground">No URL</span>}</td><td className="px-2 py-2"><Pill>{String(d.status).replace("_", " ")}</Pill></td>
            <td className="px-2 py-2">{d.status === "proof_submitted" && <div className="flex justify-end gap-1"><button type="button" aria-label="Verify declaration" className={btn.smPrimary} onClick={() => updateRecord("declarations", d.id, { status: "verified", verifiedAmount: Math.min(num(d.proofAmount), num(d.cap) || Infinity), verifiedAt: todayIso() })}><Check /> Verify</button><button type="button" aria-label="Reject declaration" className={btn.smOutline} onClick={() => updateRecord("declarations", d.id, { status: "rejected" })}><X /> Reject</button></div>}</td></tr>
        ))}</tbody></table>
      )}</div></Card>
    </div>
  );
}

/* ---------- loans ---------- */

const L_BASE = "/payroll/loans";

export function Loans() {
  const router = useRouter();
  const sub = subOf(usePathname(), L_BASE);
  const loans = useCollection("employee-loans");
  const emps = useCollection("employees");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const { node, flash } = useFlash();
  const name = (l: Rec) => fullName(emps.find((e) => e.id === l.employeeId));
  const rows = loans.filter((l) => (status === "all" || String(l.status).toLowerCase() === status.replace(/ /g, "_")) && (!q || `${name(l)} ${l.loanType}`.toLowerCase().includes(q.toLowerCase())));
  const detail = loans.find((l) => l.id === open);
  return (
    <div className="space-y-4">
      <PageHeader title="Employee loans & advances" subtitle="Principal, EMI schedule, auto-deduction from payroll" actions={<Link href={`${L_BASE}/new`} className={btn.primary}><Plus /> New loan</Link>} />
      <div className="flex flex-wrap items-center gap-3"><SearchBox value={q} onChange={setQ} placeholder="Search by employee or type…" /><Chips value={status} onChange={setStatus} items={["all", "pending approval", "approved", "active", "completed", "closed"]} /><span className="ml-auto text-sm text-muted-foreground">{rows.length} of {loans.length}</span></div>
      <Card><div className="p-5">{loans.length === 0 ? <Empty icon={HandCoins} title="No employee loans yet" text="Create a loan to set up EMIs that will be auto-deducted from payroll runs." action={<Link href={`${L_BASE}/new`} className={btn.smPrimary}><Plus /> New loan</Link>} /> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No loans match your filters</p> : (
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Type</Th><Th className="text-right">Principal</Th><Th className="text-right">EMI</Th><Th className="text-right">Outstanding</Th><Th>First EMI</Th><Th>Status</Th><Th /></tr></thead><tbody>{rows.map((l) => (
          <tr key={l.id} onClick={() => setOpen(l.id)} className="cursor-pointer border-b border-border hover:bg-muted/40"><td className="px-2 py-2 font-medium">{name(l)}<div className="font-mono text-xs font-normal text-muted-foreground">{String(l.loanNumber)}</div></td><td className="px-2 py-2">{String(l.loanType)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(l.principal))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(l.emiAmount))}</td><td className="px-2 py-2 text-right tabular-nums">{money(loanOutstanding(l))}</td><td className="px-2 py-2">{fmtDate(l.firstEmiDate)}</td><td className="px-2 py-2"><StatusBadge status={l.status} /></td>
            <td className="px-2 py-2" onClick={(ev) => ev.stopPropagation()}><div className="flex justify-end gap-1">{l.status === "PENDING_APPROVAL" && <button type="button" aria-label="Approve loan" className={btn.smPrimary} onClick={() => { updateRecord("employee-loans", l.id, { status: "APPROVED" }); flash("Loan approved"); }}>Approve</button>}{l.status === "APPROVED" && <button type="button" aria-label="Disburse loan" className={btn.smPrimary} onClick={() => { disburseLoan(l.id); flash("Disbursed — EMIs start with the first EMI date"); }}><Landmark /> Disburse</button>}{["PENDING_APPROVAL", "APPROVED"].includes(String(l.status)) && <RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => deleteRecord("employee-loans", l.id) }]} />}</div></td></tr>
        ))}</tbody></table>
      )}</div></Card>
      <Dialog open={!!detail} onClose={() => setOpen(null)} title={`${detail?.loanNumber ?? ""} — ${detail ? name(detail) : ""}`} className="max-w-xl">
        {detail && <div className="space-y-3 text-sm"><div className="grid grid-cols-3 gap-3"><div><div className="text-xs text-muted-foreground">Principal</div><div className="font-semibold">{money(num(detail.principal))}</div></div><div><div className="text-xs text-muted-foreground">EMI</div><div className="font-semibold">{money(num(detail.emiAmount))} × {num(detail.tenureMonths)}</div></div><div><div className="text-xs text-muted-foreground">Outstanding</div><div className="font-semibold">{money(loanOutstanding(detail))}</div></div></div>
          <div className="font-medium">Repayments</div>{((detail.repayments as Rec[]) ?? []).length === 0 ? <p className="text-muted-foreground">No EMIs deducted yet.</p> : <table className="w-full"><thead><tr className="border-b border-border text-xs text-muted-foreground"><td>Date</td><td className="text-right">Principal</td><td className="text-right">Interest</td></tr></thead><tbody>{((detail.repayments as Rec[]) ?? []).map((p, i) => <tr key={i} className="border-b border-border"><td className="py-1">{fmtDate(p.date)}{p.fnf ? ` (${p.fnf})` : ""}</td><td className="text-right tabular-nums">{money(num(p.principal))}</td><td className="text-right tabular-nums">{money(num(p.interest))}</td></tr>)}</tbody></table>}</div>}
      </Dialog>
      {sub === "new" && <SidePanel onClose={() => router.push(L_BASE)}><LoanForm onDone={() => router.push(L_BASE)} /></SidePanel>}
      {node}
    </div>
  );
}

function LoanForm({ onDone }: { onDone: () => void }) {
  const emps = useCollection("employees");
  const [f, setF] = useState({ employeeId: "", loanType: "PERSONAL", principal: "", interestRate: "0", tenureMonths: "12", firstEmiDate: "" });
  const [error, setError] = useState("");
  const e = emi(num(f.principal), num(f.interestRate), num(f.tenureMonths));
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New employee loan</h1><p className="text-sm text-muted-foreground">Principal, EMI schedule, auto-deduction from payroll</p></div>
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle>Loan details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Employee" htmlFor="ln-emp"><select id="ln-emp" value={f.employeeId} onChange={(ev) => setF({ ...f, employeeId: ev.target.value })} className={inputCls}><option value="">— Select —</option>{empOpts(emps).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select></Field>
          <Field label="Loan type" htmlFor="ln-type"><select id="ln-type" value={f.loanType} onChange={(ev) => setF({ ...f, loanType: ev.target.value })} className={inputCls}>{["PERSONAL", "EMERGENCY", "EDUCATION", "HOME", "VEHICLE", "SALARY_ADVANCE"].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="Principal amount" htmlFor="ln-p"><input id="ln-p" type="number" value={f.principal} onChange={(ev) => setF({ ...f, principal: ev.target.value })} className={inputCls} /></Field>
          <Field label="Interest rate %" htmlFor="ln-r"><input id="ln-r" type="number" step="0.01" value={f.interestRate} onChange={(ev) => setF({ ...f, interestRate: ev.target.value })} className={inputCls} /></Field>
          <Field label="Tenure months" htmlFor="ln-t"><input id="ln-t" type="number" min={1} value={f.tenureMonths} onChange={(ev) => setF({ ...f, tenureMonths: ev.target.value })} className={inputCls} /></Field>
          <div className="space-y-2"><Label>First EMI date</Label><DateInput value={f.firstEmiDate} onChange={(v) => setF({ ...f, firstEmiDate: v })} /></div>
        </div>
        {e > 0 && <p className="rounded-md bg-muted p-2 text-sm">EMI ≈ <strong>{money(e)}</strong> × {num(f.tenureMonths)} months — total repayable {money(e * num(f.tenureMonths))}</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={() => { if (!f.employeeId || !(num(f.principal) > 0) || !(num(f.tenureMonths) > 0) || !f.firstEmiDate) return setError("Employee, principal, tenure and first EMI date are required."); createRecord("employee-loans", { ...f, loanNumber: nextNumber("employee-loans", "LN", 4), principal: num(f.principal), interestRate: num(f.interestRate), tenureMonths: num(f.tenureMonths), emiAmount: e, status: "PENDING_APPROVAL", repayments: [] }); onDone(); }}>Create</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </div></Card>
    </div>
  );
}

/* ---------- full & final ---------- */

const F_BASE = "/payroll/fnf";

export function Fnf() {
  const router = useRouter();
  const sub = subOf(usePathname(), F_BASE);
  const rows0 = useCollection("fnf");
  const emps = useCollection("employees");
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const { node, flash } = useFlash();
  const name = (s: Rec) => fullName(emps.find((e) => e.id === s.employeeId));
  const rows = rows0.filter((s) => (status === "all" || s.status === status) && (!q || name(s).toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-4">
      <PageHeader title="Full & Final settlement" subtitle="Gratuity, leave encashment, notice recovery, loan close-out" actions={<Link href={`${F_BASE}/new`} className={btn.primary}><Plus /> Initiate FNF</Link>} />
      <div className="flex flex-wrap items-center gap-3"><SearchBox value={q} onChange={setQ} placeholder="Search by employee…" /><Chips value={status} onChange={setStatus} items={["all", "draft", "approved", "processed", "paid"]} /><span className="ml-auto text-sm text-muted-foreground">{rows.length} of {rows0.length}</span></div>
      <Card><div className="p-5">{rows0.length === 0 ? <Empty icon={UserMinus} title="No FNF settlements yet" text="Initiate a settlement when an employee separates — components like gratuity, leave encashment, and loan recovery will auto-compute." action={<Link href={`${F_BASE}/new`} className={btn.smPrimary}><Plus /> Initiate FNF</Link>} /> : rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No FNF settlements match your filters</p> : (
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Employee</Th><Th>Separation</Th><Th className="text-right">Payable</Th><Th className="text-right">Recoverable</Th><Th className="text-right">Net</Th><Th>Status</Th><Th /></tr></thead><tbody>{rows.map((s) => (
          <tr key={s.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{name(s)}<div className="font-mono text-xs font-normal text-muted-foreground">{String(s.fnfNumber)}</div></td><td className="px-2 py-2">{fmtDate(s.separationDate)}<div className="text-xs text-muted-foreground">{String(s.separationReason || "")}</div></td><td className="px-2 py-2 text-right tabular-nums" title={`Gratuity ${money(num(s.gratuityAmount))} · Leave ${money(num(s.leaveEncashmentAmount))} · Reimbursements ${money(num(s.pendingReimbursementAmount))}`}>{money(num(s.payable))}</td><td className="px-2 py-2 text-right tabular-nums" title={`Notice ${money(num(s.noticeRecoveryAmount))} · Loans ${money(num(s.loanRecoveryAmount))}`}>{money(num(s.recoverable))}</td><td className="px-2 py-2 text-right font-semibold tabular-nums">{money(num(s.net))}</td><td className="px-2 py-2"><StatusBadge status={String(s.status).toUpperCase()} /></td>
            <td className="px-2 py-2"><div className="flex justify-end gap-1">{s.status === "draft" && <button type="button" aria-label="Approve FNF settlement" className={btn.smPrimary} onClick={() => { updateRecord("fnf", s.id, { status: "approved" }); flash("Approved"); }}>Approve</button>}{s.status === "approved" && <button type="button" aria-label="Process FNF settlement" className={btn.smPrimary} onClick={() => { processFnf(s.id); flash("Processed — posted and employee marked as left"); }}>Process</button>}{s.status === "processed" && <button type="button" className={btn.smOutline} onClick={() => { payFnf(s.id); flash("Marked paid"); }}>Mark paid</button>}{s.status === "draft" && <RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => deleteRecord("fnf", s.id) }]} />}</div></td></tr>
        ))}</tbody></table>
      )}</div></Card>
      {sub === "new" && <SidePanel onClose={() => router.push(F_BASE)}><FnfForm onDone={() => router.push(F_BASE)} /></SidePanel>}
      {node}
    </div>
  );
}

function FnfForm({ onDone }: { onDone: () => void }) {
  const emps = useCollection("employees");
  const [f, setF] = useState({ employeeId: "", separationDate: "", separationReason: "", noticeServed: "30" });
  const [preview, setPreview] = useState<ReturnType<typeof computeFnf> | null>(null);
  const ok = f.employeeId && f.separationDate;
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New FNF settlement</h1><p className="text-sm text-muted-foreground">Gratuity, leave encashment, notice recovery, loan close-out</p></div>
      <Card className="max-w-2xl"><div className="space-y-4 p-5"><CardTitle>Initiate full &amp; final settlement</CardTitle>
        <Field label="Employee" htmlFor="fn-emp"><select id="fn-emp" value={f.employeeId} onChange={(ev) => { setF({ ...f, employeeId: ev.target.value }); setPreview(null); }} className={inputCls}><option value="">— Select —</option>{emps.map((e) => <option key={e.id} value={e.id}>{fullName(e)}</option>)}</select></Field>
        <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Separation date</Label><DateInput value={f.separationDate} onChange={(v) => { setF({ ...f, separationDate: v }); setPreview(null); }} /></div><Field label="Notice days served" htmlFor="fn-notice"><input id="fn-notice" type="number" value={f.noticeServed} onChange={(ev) => setF({ ...f, noticeServed: ev.target.value })} className={inputCls} /></Field></div>
        <Field label="Reason" htmlFor="fn-reason"><input id="fn-reason" placeholder="Resignation / Termination" value={f.separationReason} onChange={(ev) => setF({ ...f, separationReason: ev.target.value })} className={inputCls} /></Field>
        <button type="button" className={btn.smOutline} disabled={!ok} onClick={() => setPreview(computeFnf(f.employeeId, f.separationDate, num(f.noticeServed)))}><Calculator /> Compute preview</button>
        {preview && <div className="space-y-1 rounded-md border border-border p-3 text-sm">
          <div className="flex justify-between"><span>Gratuity ({preview.yearsOfService} yrs)</span><span className="tabular-nums">{money(preview.gratuityAmount)}</span></div>
          <div className="flex justify-between"><span>Leave encashment ({preview.leaveEncashmentDays} days)</span><span className="tabular-nums">{money(preview.leaveEncashmentAmount)}</span></div>
          <div className="flex justify-between"><span>Pending reimbursements</span><span className="tabular-nums">{money(preview.pendingReimbursementAmount)}</span></div>
          <div className="flex justify-between"><span>Notice recovery ({preview.noticeRecoveryDays} days)</span><span className="tabular-nums">− {money(preview.noticeRecoveryAmount)}</span></div>
          <div className="flex justify-between"><span>Loan recovery</span><span className="tabular-nums">− {money(preview.loanRecoveryAmount)}</span></div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Net</span><span className="tabular-nums">{money(preview.net)}</span></div>
        </div>}
        <div className="flex gap-2"><button type="button" className={btn.primary} disabled={!ok} onClick={() => { createFnf({ employeeId: f.employeeId, separationDate: f.separationDate, separationReason: f.separationReason || undefined, noticeServed: num(f.noticeServed) }); onDone(); }}>Create draft</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </div></Card>
    </div>
  );
}

/* ---------- statutory exports ---------- */

export function StatutoryExports() {
  const settings = useCollection("payroll-settings");
  const wps = (settings[0]?.value as Rec) ?? {};
  const d = new Date();
  const [w, setW] = useState<{ est: string; routing: string } | null>(null);
  const cur = w ?? { est: String(wps.est ?? ""), routing: String(wps.routing ?? "") };
  const [p, setP] = useState({ year: String(d.getFullYear()), month: String(d.getMonth() + 1), fy: currentFy(), quarter: "1", pf: todayIso().slice(0, 7), esi: todayIso().slice(0, 7) });
  const { node, flash } = useFlash();
  const save = (name: string, text: string, type = "text/plain") => (text.trim() ? downloadFile(name, text, type) : flash("No finalized payslips for that period", true));
  const card = (title: string, sub: string, body: React.ReactNode) => <Card><div className="space-y-3 p-5"><div className="flex items-start gap-2"><FileText className="mt-0.5 size-4 text-muted-foreground" /><div><div className="font-semibold">{title}</div><div className="text-xs text-muted-foreground">{sub}</div></div></div>{body}</div></Card>;
  return (
    <div className="space-y-4">
      <PageHeader title="Statutory file exports" subtitle="India (Form 24Q / PF / ESI) and UAE WPS salary files for compliance filings" />
      <Card><div className="space-y-3 p-5">
        <CardTitle className="flex items-center gap-2 text-base"><Landmark className="size-4" /> UAE Wage Protection System (WPS)</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Establishment ID (MOL)" htmlFor="wps-est"><input id="wps-est" placeholder="13-digit employer id" value={cur.est} onChange={(e) => setW({ ...cur, est: e.target.value })} className={inputCls} /></Field><Field label="Employer bank routing" htmlFor="wps-rt"><input id="wps-rt" placeholder="bank agent / routing id" value={cur.routing} onChange={(e) => setW({ ...cur, routing: e.target.value })} className={inputCls} /></Field></div>
        <button type="button" className={btn.smOutline} onClick={() => { if (settings[0]) updateRecord("payroll-settings", settings[0].id, { value: cur }); else createRecord("payroll-settings", { value: cur }); flash("WPS settings saved"); }}><Save /> Save WPS settings</button>
        <div className="flex flex-wrap items-end gap-3 border-t border-border pt-3"><Field label="Year" htmlFor="wps-y"><input id="wps-y" type="number" value={p.year} onChange={(e) => setP({ ...p, year: e.target.value })} className={cn(inputCls, "w-24")} /></Field><Field label="Month (1–12)" htmlFor="wps-m"><input id="wps-m" type="number" min={1} max={12} value={p.month} onChange={(e) => setP({ ...p, month: e.target.value })} className={cn(inputCls, "w-20")} /></Field><button type="button" className={btn.primary} onClick={() => { if (!cur.est) return flash("Enter the establishment ID first", true); save(`${cur.est}${p.year.slice(2)}${p.month.padStart(2, "0")}.SIF`, wpsSif(num(p.year), num(p.month), cur.est, cur.routing)); }}><Download /> Download SIF</button><span className="text-xs text-muted-foreground">EDR line per finalized payslip for the period + SCR control record.</span></div>
      </div></Card>
      <div className="grid gap-4 md:grid-cols-3">
        {card("Form 24Q (TDS quarterly)", "Pipe-delimited NSDL-style file", <><Field label="Financial year" htmlFor="q-fy"><input id="q-fy" value={p.fy} onChange={(e) => setP({ ...p, fy: e.target.value })} className={inputCls} /></Field><Field label="Quarter (1–4)" htmlFor="q-q"><input id="q-q" type="number" min={1} max={4} value={p.quarter} onChange={(e) => setP({ ...p, quarter: e.target.value })} className={inputCls} /></Field><button type="button" className={cn(btn.primary, "w-full")} onClick={() => { const t = form24q(p.fy, num(p.quarter)); save(`form24q-${p.fy}-Q${p.quarter}.txt`, t.split("\n").length > 1 ? t : ""); }}><Download /> Download</button></>)}
        {card("PF ECR (monthly)", "Pipe-delimited file for EPFO portal", <><Field label="Month (YYYY-MM)" htmlFor="pf-m"><input id="pf-m" value={p.pf} onChange={(e) => setP({ ...p, pf: e.target.value })} className={inputCls} /></Field><button type="button" className={cn(btn.primary, "w-full")} onClick={() => save(`pf-ecr-${p.pf}.txt`, pfEcr(p.pf))}><Download /> Download</button></>)}
        {card("ESI return (monthly)", "CSV with IP number, gross wages, contributions", <><Field label="Month (YYYY-MM)" htmlFor="esi-m"><input id="esi-m" value={p.esi} onChange={(e) => setP({ ...p, esi: e.target.value })} className={inputCls} /></Field><button type="button" className={cn(btn.primary, "w-full")} onClick={() => { const t = esiReturn(p.esi); save(`esi-${p.esi}.csv`, t.split("\n").length > 1 ? t : "", "text/csv"); }}><Download /> Download</button></>)}
      </div>
      {node}
    </div>
  );
}
