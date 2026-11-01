"use client";

// CRM › pipeline pages: leads (inline grid + detail), opportunities (stage board), activities and
// forecasts.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChartColumn, Check, ChevronDown, ChevronUp, ClipboardList, Columns3, FileText, Mail, Phone, Plus, StickyNote, Table2, Target, Trash2 } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, updateRecord, useCollection, type Rec } from "@/lib/store";
import { ACTIVITY_TYPES, LEAD_SOURCES, LEAD_STATUSES, RELATED_TYPES, addDefaultStages, convertLead, forecast, leadName, logActivity, moveOpportunity, oppStatus, processDueCampaigns, relatedName, rescoreLead, scoreBreakdown, sortStages, stageOf } from "@/lib/crm";
import { useSetting, saveSetting } from "@/lib/system";
import { todayIso } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, DataTable, DateInput, Dialog, Field, PageHeader, SearchInput, Select, SidePanel, StatCard, btn, inputCls, money, num, textareaCls } from "@/components/accounting/kit";
import { CustomerPicker, NumberBanner, Req, Section } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";
import { Empty, Pill, Th, fmtDate, useFlash } from "@/components/hr/people";
import { useDismiss } from "@/lib/use-dismiss";

export const Tabs = ({ value, onChange, items }: { value: string; onChange: (v: string) => void; items: string[][] }) => (
  <div role="tablist" className="inline-flex flex-wrap rounded-lg bg-muted p-1 text-sm">{items.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={value === v} onClick={() => onChange(v)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", value === v && "bg-background text-foreground shadow")}>{l}</button>)}</div>
);
const opts = (xs: string[], fmt: (x: string) => string = (x) => x) => xs.map((x) => ({ value: x, label: fmt(x) }));
const words = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
const LEAD_TONE: Record<string, "muted" | "info" | "primary" | "warning" | "success" | "destructive"> = { New: "info", Contacted: "primary", Qualified: "warning", Converted: "success", Lost: "destructive" };
export const fmtWhen = (iso: unknown) => (iso ? new Date(String(iso)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");

/* ---------- leads ---------- */

// Text cell edited in place; commits on blur or Enter, Escape restores.
function InlineCell({ value, onCommit, label, type = "text", className }: { value: unknown; onCommit: (v: string) => void; label: string; type?: string; className?: string }) {
  const v = value == null ? "" : String(value);
  return (
    <input key={v} aria-label={label} type={type} defaultValue={v} placeholder="—"
      onBlur={(e) => { if (e.target.value !== v) onCommit(e.target.value); }}
      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") { e.currentTarget.value = v; e.currentTarget.blur(); } }}
      className={cn("h-8 w-full min-w-0 rounded-md !border-transparent !bg-transparent px-2 text-sm !shadow-none placeholder:text-muted-foreground/60 hover:!border-input focus:!border-input focus:!bg-background focus:outline-none", className)} />
  );
}

function ContextMenu({ at, items, onClose }: { at: { x: number; y: number }; items: { label: string; onSelect: () => void; destructive?: boolean }[]; onClose: () => void }) {
  const ref = useDismiss(true, (o) => { if (!o) onClose(); });
  return (
    <div ref={ref} role="menu" style={{ left: at.x, top: at.y }} className="fixed z-50 min-w-40 rounded-md border border-border bg-popover p-1 text-sm shadow-md">
      {items.map((it) => <button key={it.label} type="button" role="menuitem" onClick={() => { onClose(); it.onSelect(); }} className={cn("flex w-full rounded-sm px-2 py-1.5 text-left hover:bg-accent", it.destructive && "text-destructive")}>{it.label}</button>)}
    </div>
  );
}

const blankQuick = { firstName: "", lastName: "", organization: "", email: "", estValue: "" };

export function Leads() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/crm/leads");
  const leads = useCollection("leads");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [quick, setQuick] = useState(blankQuick);
  const [menu, setMenu] = useState<{ x: number; y: number; lead: Rec } | null>(null);
  const [converting, setConverting] = useState<Rec | null>(null);
  const { node, flash } = useFlash();
  useEffect(() => { const t = setTimeout(processDueCampaigns, 0); return () => clearTimeout(t); }, []);
  const sel = leads.find((l) => l.id === sub);
  const close = () => router.push("/crm/leads");
  const ql = q.trim().toLowerCase();
  const rows = [...leads].reverse().filter((l) => (tab === "All" || l.status === tab) && (!ql || [leadName(l), l.organization, l.email, l.number].some((x) => String(x ?? "").toLowerCase().includes(ql))));
  const set = (l: Rec, patch: Record<string, unknown>) => { updateRecord("leads", l.id, patch); rescoreLead(l.id); };
  function addQuick() {
    if (!quick.firstName.trim() && !quick.organization.trim()) return flash("Enter a first name or organization", true);
    const l = createRecord("leads", { number: nextNumber("leads", "LEAD"), ...quick, firstName: quick.firstName.trim(), estValue: quick.estValue ? num(quick.estValue) : "", source: "WEB", status: "New" });
    rescoreLead(l.id);
    setQuick(blankQuick);
    flash(`Lead ${l.number} added`);
  }
  const quickInput = (k: keyof typeof blankQuick, ph: string, type = "text") => <input aria-label={`New lead ${ph.toLowerCase()}`} type={type} value={quick[k]} placeholder={ph} onChange={(e) => setQuick({ ...quick, [k]: e.target.value })} onKeyDown={(e) => e.key === "Enter" && addQuick()} className="h-8 w-full min-w-0 rounded-md !border-transparent !bg-transparent px-2 text-sm !shadow-none placeholder:text-muted-foreground hover:!border-input focus:!border-input focus:!bg-background focus:outline-none" />;
  return (
    <div className="space-y-4">
      <PageHeader title="Leads" subtitle="Capture, qualify and convert sales leads" actions={<Link href="/crm/leads/new" className={btn.primary}><Plus /> New lead</Link>} />
      <div className="flex flex-wrap items-center gap-3"><div className="w-80 max-w-full"><SearchInput value={q} onChange={setQ} placeholder="Search by name, org, email..." /></div><Tabs value={tab} onChange={setTab} items={["All", ...LEAD_STATUSES].map((s) => [s, s])} /></div>
      <p className="text-xs text-muted-foreground">Click any field to edit it inline · double-click a row to open · right-click for more.</p>
      <Card><div className="overflow-x-auto">
        <table className="w-full min-w-[60rem] text-sm">
          <thead><tr className="border-b border-border"><Th className="w-20">Lead #</Th><Th>First name</Th><Th>Last name</Th><Th>Organization</Th><Th>Email</Th><Th className="w-32">Source</Th><Th className="w-28">Est. value</Th><Th className="w-32">Status</Th><Th className="w-24">Created</Th></tr></thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} onDoubleClick={() => router.push(`/crm/leads/${l.id}`)} onContextMenu={(e) => { e.preventDefault(); setMenu({ x: e.clientX, y: e.clientY, lead: l }); }} className={cn("border-b border-border/60 hover:bg-muted/40", sel?.id === l.id && "bg-muted/60")}>
                <td className="px-2"><Link href={`/crm/leads/${l.id}`} className="font-mono text-xs text-primary hover:underline">{String(l.number ?? "—")}</Link></td>
                <td><InlineCell label="First name" value={l.firstName} onCommit={(v) => set(l, { firstName: v })} /></td>
                <td><InlineCell label="Last name" value={l.lastName} onCommit={(v) => set(l, { lastName: v })} /></td>
                <td><InlineCell label="Organization" value={l.organization} onCommit={(v) => set(l, { organization: v })} /></td>
                <td><InlineCell label="Email" type="email" value={l.email} onCommit={(v) => set(l, { email: v })} /></td>
                <td className="px-1"><Select size="sm" ariaLabel="Source" value={String(l.source ?? "OTHER")} onChange={(v) => set(l, { source: v })} options={opts(LEAD_SOURCES)} /></td>
                <td><InlineCell label="Est. value" type="number" className="text-right tabular-nums" value={l.estValue} onCommit={(v) => set(l, { estValue: v === "" ? "" : num(v) })} /></td>
                <td className="px-1"><Select size="sm" ariaLabel="Status" value={String(l.status ?? "New")} onChange={(v) => v === "Converted" ? setConverting(l) : set(l, { status: v })} options={opts(LEAD_STATUSES)} /></td>
                <td className="px-2 text-xs text-muted-foreground">{fmtDate(l.createdAt)}</td>
              </tr>
            ))}
            {rows.length === 0 && leads.length > 0 && <tr><td colSpan={9} className="h-14 text-center text-muted-foreground">No leads match.</td></tr>}
            <tr className="bg-muted/30">
              <td className="px-2 text-muted-foreground"><Plus className="size-3.5" /></td>
              <td>{quickInput("firstName", "Add a lead...")}</td><td>{quickInput("lastName", "Last name")}</td><td>{quickInput("organization", "Organization")}</td><td>{quickInput("email", "Email", "email")}</td><td />
              <td>{quickInput("estValue", "Value", "number")}</td>
              <td className="px-2"><button type="button" aria-label="Add lead" onClick={addQuick} className="inline-flex size-7 items-center justify-center rounded-full bg-primary/70 text-primary-foreground hover:bg-primary"><Check className="size-3.5" /></button></td><td />
            </tr>
          </tbody>
        </table>
      </div></Card>
      {menu && <ContextMenu at={menu} onClose={() => setMenu(null)} items={[
        { label: "Open", onSelect: () => router.push(`/crm/leads/${menu.lead.id}`) },
        ...(!["Converted", "Lost"].includes(String(menu.lead.status)) ? [{ label: "Convert…", onSelect: () => setConverting(menu.lead) }, { label: "Mark as lost", onSelect: () => set(menu.lead, { status: "Lost" }) }] : []),
        { label: "Log activity", onSelect: () => router.push(`/crm/activities/new?lead=${menu.lead.id}`) },
        { label: "Delete", destructive: true, onSelect: () => confirm(`Delete lead ${leadName(menu.lead)}?`) && deleteRecord("leads", menu.lead.id) },
      ]} />}
      {converting && <ConvertDialog lead={converting} onClose={() => setConverting(null)} onDone={(msg) => { setConverting(null); flash(msg); }} />}
      {sub === "new" && <SidePanel onClose={close}><LeadForm onDone={(id) => router.push(id ? `/crm/leads/${id}` : "/crm/leads")} /></SidePanel>}
      {sel && <SidePanel onClose={close}><LeadDetail key={sel.id} lead={sel} onConvert={() => setConverting(sel)} /></SidePanel>}
      {node}
    </div>
  );
}

function LeadForm({ lead, onDone }: { lead?: Rec; onDone: (id?: string) => void }) {
  const [preview] = useState(() => (lead ? String(lead.number) : nextNumber("leads", "LEAD")));
  const [f, setF] = useState({ firstName: String(lead?.firstName ?? ""), lastName: String(lead?.lastName ?? ""), organization: String(lead?.organization ?? ""), jobTitle: String(lead?.jobTitle ?? ""), email: String(lead?.email ?? ""), phone: String(lead?.phone ?? ""), source: String(lead?.source ?? "WEB"), estValue: String(lead?.estValue ?? ""), notes: String(lead?.notes ?? "") });
  const [err, setErr] = useState("");
  const input = (k: keyof typeof f, label: string, type = "text") => <Field label={label} htmlFor={`lead-${k}`}><input id={`lead-${k}`} type={type} className={inputCls} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>;
  function save() {
    if (!f.firstName.trim() && !f.lastName.trim() && !f.organization.trim()) return setErr("Enter a name or an organization");
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setErr("Enter a valid email address");
    const data = { ...f, firstName: f.firstName.trim(), lastName: f.lastName.trim(), organization: f.organization.trim(), estValue: f.estValue === "" ? "" : num(f.estValue) };
    if (lead) { updateRecord("leads", lead.id, data); rescoreLead(lead.id); onDone(lead.id); return; }
    const r = createRecord("leads", { number: nextNumber("leads", "LEAD"), ...data, status: "New" });
    rescoreLead(r.id);
    onDone(r.id);
  }
  return (
    <div className="space-y-4">
      {!lead && <div><h2 className="text-2xl font-semibold tracking-tight">New Lead</h2><p className="text-sm text-muted-foreground">Capture a new sales lead</p></div>}
      <Section title="Lead Details">
        <NumberBanner label="Lead #" value={preview} saved={!!lead} />
        <div className="grid gap-4 sm:grid-cols-2">
          {input("firstName", "First name")}{input("lastName", "Last name")}{input("organization", "Organization")}{input("jobTitle", "Job title")}{input("email", "Email", "email")}{input("phone", "Phone", "tel")}
          <Field label="Source"><Select ariaLabel="Source" value={f.source} onChange={(v) => setF({ ...f, source: v })} options={opts(LEAD_SOURCES)} /></Field>
          {input("estValue", "Estimated value", "number")}
        </div>
        <Field label="Notes" htmlFor="lead-notes"><textarea id="lead-notes" rows={3} className={textareaCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{lead ? "Save Changes" : "Create Lead"}</button><button type="button" className={btn.outline} onClick={() => onDone(lead?.id)}>Cancel</button></div>
      </Section>
    </div>
  );
}

function LeadDetail({ lead: l, onConvert }: { lead: Rec; onConvert: () => void }) {
  const router = useRouter();
  const rules = useCollection("scoring-rules");
  const acts = useCollection("activities");
  const opps = useCollection("opportunities");
  const [editing, setEditing] = useState(false);
  const { hits, score } = scoreBreakdown(l, rules, acts);
  const open = !["Converted", "Lost"].includes(String(l.status));
  const opp = opps.find((o) => o.id === l.opportunityId);
  const setStatus = (s: string) => { updateRecord("leads", l.id, { status: s }); logActivity({ type: "NOTE", relatedType: "Lead", relatedId: l.id, subject: `Status changed to ${s}` }); rescoreLead(l.id); };
  if (editing) return <LeadForm lead={l} onDone={() => setEditing(false)} />;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono text-xs text-muted-foreground">{String(l.number ?? "")}</p><h2 className="text-2xl font-semibold tracking-tight">{leadName(l)}</h2><p className="text-sm text-muted-foreground">{[l.jobTitle, l.organization].filter(Boolean).join(" · ") || "No organization"}</p></div>
        <div className="flex items-center gap-2"><Badge tone={LEAD_TONE[String(l.status)] ?? "muted"}>{String(l.status)}</Badge><Pill>Score {score}</Pill></div>
      </div>
      <div className="flex flex-wrap gap-2">
        {open && <div role="group" aria-label="Lead status" className="inline-flex rounded-md border border-input p-0.5">{["New", "Contacted", "Qualified"].map((s) => <button key={s} type="button" onClick={() => setStatus(s)} className={cn("rounded px-3 py-1 text-xs font-medium", l.status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{s}</button>)}</div>}
        {open && <button type="button" className={btn.smPrimary} onClick={onConvert}>Convert</button>}
        {open && <button type="button" className={btn.smOutline} onClick={() => setStatus("Lost")}>Mark lost</button>}
        {l.status === "Lost" && <button type="button" className={btn.smOutline} onClick={() => setStatus("New")}>Reopen</button>}
        <button type="button" className={btn.smOutline} onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className={cn(btn.smOutline, "text-destructive")} onClick={() => { if (confirm("Delete this lead?")) { deleteRecord("leads", l.id); router.push("/crm/leads"); } }}><Trash2 /> Delete</button>
      </div>
      {l.status === "Converted" && <Card><div className="space-y-1 p-4 text-sm"><p className="font-medium">Converted {fmtDate(l.convertedAt)}</p><p>Customer: <b>{String(l.customer ?? "—")}</b></p>{opp && <p>Opportunity: <Link className="text-primary hover:underline" href={`/crm/opportunities/${opp.id}`}>{String(opp.number)} · {String(opp.title)}</Link></p>}</div></Card>}
      <Card><dl className="grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-2">
        {[["Email", l.email], ["Phone", l.phone], ["Source", l.source ? words(String(l.source)) : ""], ["Estimated value", l.estValue === "" || l.estValue == null ? "" : money(num(l.estValue))], ["Created", fmtDate(l.createdAt)], ["Notes", l.notes]].map(([k, v]) => <div key={String(k)} className={k === "Notes" ? "sm:col-span-2" : ""}><dt className="text-xs text-muted-foreground">{String(k)}</dt><dd className="whitespace-pre-wrap">{v ? String(v) : "—"}</dd></div>)}
      </dl></Card>
      <Card><div className="space-y-2 p-5"><div className="flex items-center justify-between"><CardTitle>Lead score</CardTitle><Link href="/crm/scoring" className="text-xs text-primary hover:underline">Scoring rules</Link></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${score}%` }} /></div>
        {hits.length === 0 ? <p className="text-sm text-muted-foreground">No scoring rules yet.</p> : <ul className="space-y-1 text-sm">{hits.map((h) => <li key={h.rule.id} className={cn("flex justify-between", !h.hit && "text-muted-foreground")}><span>{h.hit ? "✓" : "·"} {String(h.rule.name)}</span><span className="tabular-nums">{h.hit ? `+${num(h.rule.points)}` : "0"}</span></li>)}</ul>}
      </div></Card>
      <ActivityTimeline relatedType="Lead" relatedId={l.id} onLogged={() => rescoreLead(l.id)} />
    </div>
  );
}

function ConvertDialog({ lead, onClose, onDone }: { lead: Rec; onClose: () => void; onDone: (msg: string) => void }) {
  const stages = sortStages(useCollection("pipeline-stages")).filter((s) => s.kind === "OPEN");
  const [f, setF] = useState({ customerName: String(lead.organization || leadName(lead)), createOpportunity: true, title: `${String(lead.organization || leadName(lead))} deal`, amount: String(lead.estValue ?? ""), stageId: "", closeDate: "" });
  const [err, setErr] = useState("");
  const stageId = f.stageId || String(stages[0]?.id ?? "");
  function go() {
    if (!f.customerName.trim()) return setErr("Customer name is required");
    if (f.createOpportunity && !f.title.trim()) return setErr("Opportunity name is required");
    if (f.createOpportunity && !stageId) return setErr("Add pipeline stages first");
    const r = convertLead(lead, { ...f, stageId, amount: num(f.amount) });
    onDone(`Converted — customer ${r.customer.name}${r.opportunity ? `, opportunity ${r.opportunity.number}` : ""}`);
  }
  return (
    <Dialog open onClose={onClose} title={`Convert ${leadName(lead)}`} description="Creates (or links) a customer and, optionally, an opportunity in your pipeline.">
      <div className="space-y-4">
        <Field label="Customer name" htmlFor="cv-cust" hint="An existing customer with this name is linked instead of duplicated."><input id="cv-cust" className={inputCls} value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.createOpportunity} onChange={(e) => setF({ ...f, createOpportunity: e.target.checked })} /> Create an opportunity</label>
        {f.createOpportunity && <>
          <Field label="Opportunity name" htmlFor="cv-title"><input id="cv-title" className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Amount" htmlFor="cv-amt"><input id="cv-amt" type="number" className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
            <Field label="Stage">{stages.length ? <Select ariaLabel="Stage" value={stageId} onChange={(v) => setF({ ...f, stageId: v })} options={stages.map((s) => ({ value: s.id, label: String(s.name) }))} /> : <button type="button" className={btn.smOutline} onClick={addDefaultStages}>Add default stages</button>}</Field>
            <Field label="Expected close"><DateInput ariaLabel="Expected close" value={f.closeDate} onChange={(v) => setF({ ...f, closeDate: v })} /></Field>
          </div>
        </>}
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} onClick={go}>Convert</button></div>
      </div>
    </Dialog>
  );
}

/* ---------- activities ---------- */

const ACT_ICON: Record<string, typeof Phone> = { CALL: Phone, EMAIL: Mail, MEETING: CalendarDays, TASK: ClipboardList, NOTE: StickyNote };
const ACT_TABS = [["All", "All"], ["CALL", "Calls"], ["EMAIL", "Emails"], ["MEETING", "Meetings"], ["TASK", "Tasks"], ["NOTE", "Notes"]];
const relHref = (t: unknown, id: unknown) => (t === "Lead" ? `/crm/leads/${id}` : t === "Opportunity" ? `/crm/opportunities/${id}` : `/ar/customers/${id}`);

function ActivityItem({ a, showRelated }: { a: Rec; showRelated?: boolean }) {
  const Icon = ACT_ICON[String(a.type)] ?? StickyNote;
  const task = a.type === "TASK";
  const overdue = task && a.status !== "Done" && !!a.dueDate && String(a.dueDate) < todayIso();
  return (
    <li className="flex gap-3 border-b border-border/60 py-3 last:border-0">
      <div className="mt-0.5 rounded-full bg-muted p-2"><Icon className="size-3.5 text-muted-foreground" /></div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", task && a.status === "Done" && "text-muted-foreground line-through")}>{String(a.subject)}</p>
        <p className="text-xs text-muted-foreground">{words(String(a.type))}{showRelated && <> · {String(a.relatedType)}: <Link className="text-primary hover:underline" href={relHref(a.relatedType, a.relatedId)}>{relatedName(a.relatedType, a.relatedId)}</Link></>} · {fmtWhen(a.createdAt)}{task && a.dueDate ? <span className={cn(overdue && "text-destructive")}> · due {fmtDate(a.dueDate)}</span> : null}</p>
        {a.notes ? <p className="mt-1 whitespace-pre-wrap text-sm">{String(a.notes)}</p> : null}
      </div>
      <div className="flex shrink-0 items-start gap-1">
        {task && <button type="button" className={btn.smOutline} onClick={() => updateRecord("activities", a.id, { status: a.status === "Done" ? "Open" : "Done", doneAt: a.status === "Done" ? null : todayIso() })}>{a.status === "Done" ? "Reopen" : "Complete"}</button>}
        <button type="button" aria-label="Delete activity" className={cn(btn.icon, "text-muted-foreground")} onClick={() => deleteRecord("activities", a.id)}><Trash2 className="!size-3.5" /></button>
      </div>
    </li>
  );
}

export function ActivityTimeline({ relatedType, relatedId, onLogged }: { relatedType: string; relatedId: string; onLogged?: () => void }) {
  const acts = useCollection("activities").filter((a) => a.relatedType === relatedType && a.relatedId === relatedId).reverse();
  const [f, setF] = useState({ type: "CALL", subject: "" });
  function log() {
    if (!f.subject.trim()) return;
    logActivity({ type: f.type, relatedType, relatedId, subject: f.subject.trim(), status: f.type === "TASK" ? "Open" : "Done" });
    setF({ ...f, subject: "" });
    onLogged?.();
  }
  return (
    <Card><div className="space-y-3 p-5">
      <CardTitle>Activity</CardTitle>
      <div className="flex gap-2"><Select size="sm" className="w-32" ariaLabel="Activity type" value={f.type} onChange={(v) => setF({ ...f, type: v })} options={opts(ACTIVITY_TYPES)} /><input aria-label="Activity subject" className={cn(inputCls, "h-8")} placeholder="Log a call, email, meeting…" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} onKeyDown={(e) => e.key === "Enter" && log()} /><button type="button" className={btn.smPrimary} onClick={log}>Log</button></div>
      {acts.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : <ul>{acts.map((a) => <ActivityItem key={a.id} a={a} />)}</ul>}
    </div></Card>
  );
}

export function Activities() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/crm/activities");
  const acts = useCollection("activities");
  const [tab, setTab] = useState("All");
  const close = () => router.push("/crm/activities");
  const rows = [...acts].reverse().filter((a) => tab === "All" || a.type === tab);
  return (
    <div className="space-y-4">
      <PageHeader title="Activities" subtitle="Calls, emails, meetings, tasks and notes" actions={<Link href="/crm/activities/new" className={btn.primary}><Plus /> New activity</Link>} />
      <Card><div className="space-y-3 p-5">
        <Tabs value={tab} onChange={setTab} items={ACT_TABS} />
        {rows.length === 0 ? <Empty icon={ClipboardList} title={acts.length ? "Nothing here" : "No activities yet"} text="Log a call, email, meeting or task to start building your activity timeline." /> : <ul>{rows.map((a) => <ActivityItem key={a.id} a={a} showRelated />)}</ul>}
      </div></Card>
      {sub === "new" && <SidePanel onClose={close}><Suspense fallback={null}><ActivityForm onDone={close} /></Suspense></SidePanel>}
    </div>
  );
}

function ActivityForm({ onDone }: { onDone: () => void }) {
  const leads = useCollection("leads");
  const opps = useCollection("opportunities");
  const customers = useCollection("customers");
  const params = useSearchParams();
  // Opened from a lead's context menu as /crm/activities/new?lead=<id>.
  const [f, setF] = useState(() => { const lead = params.get("lead"); return { type: "CALL", relatedType: "Lead", relatedId: lead ?? "", subject: "", notes: "", dueDate: "" }; });
  const [err, setErr] = useState("");
  const items = f.relatedType === "Lead" ? leads.map((l) => ({ value: l.id, label: `${leadName(l)}${l.organization ? ` · ${l.organization}` : ""}` })) : f.relatedType === "Opportunity" ? opps.map((o) => ({ value: o.id, label: `${o.number ?? ""} ${o.title}`.trim() })) : customers.map((c) => ({ value: c.id, label: String(c.name) }));
  function save() {
    if (!f.relatedId) return setErr(`Choose a ${f.relatedType.toLowerCase()}`);
    if (!f.subject.trim()) return setErr("Subject is required");
    createRecord("activities", { ...f, subject: f.subject.trim(), status: f.type === "TASK" ? "Open" : "Done" });
    if (f.relatedType === "Lead") rescoreLead(f.relatedId);
    onDone();
  }
  return (
    <div className="space-y-4">
      <div><h2 className="text-2xl font-semibold tracking-tight">Log Activity</h2><p className="text-sm text-muted-foreground">Log a call, email, meeting, task or note</p></div>
      <Section title="Activity Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Type <Req /></>}><Select ariaLabel="Type" value={f.type} onChange={(v) => setF({ ...f, type: v })} options={opts(ACTIVITY_TYPES)} /></Field>
          <Field label={<>Related to <Req /></>}><Select ariaLabel="Related to" value={f.relatedType} onChange={(v) => setF({ ...f, relatedType: v, relatedId: "" })} options={opts(RELATED_TYPES)} /></Field>
        </div>
        <Field label={<>{f.relatedType} <Req /></>}><Select ariaLabel={f.relatedType} placeholder="Choose…" value={f.relatedId} onChange={(v) => setF({ ...f, relatedId: v })} options={items} /></Field>
        <Field label={<>Subject <Req /></>} htmlFor="act-subject"><input id="act-subject" className={inputCls} value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
        {f.type === "TASK" && <Field label="Due date"><DateInput ariaLabel="Due date" value={f.dueDate} onChange={(v) => setF({ ...f, dueDate: v })} /></Field>}
        <Field label="Notes" htmlFor="act-notes"><textarea id="act-notes" rows={2} className={textareaCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Log</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </Section>
    </div>
  );
}

/* ---------- opportunities ---------- */

export function Opportunities() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/crm/opportunities");
  const stages = sortStages(useCollection("pipeline-stages"));
  const opps = useCollection("opportunities");
  const [view, setView] = useState("board");
  const [drag, setDrag] = useState<string | null>(null);
  const [managing, setManaging] = useState(false);
  const sel = opps.find((o) => o.id === sub);
  const close = () => router.push("/crm/opportunities");
  return (
    <div className="space-y-4">
      <PageHeader title="Opportunities" subtitle="Sales pipeline — drag deals between stages or use the table view" actions={<>
        {stages.length > 0 && <div className="inline-flex rounded-md border border-input bg-background p-0.5 shadow-sm">{[["board", "Board", Columns3], ["table", "Table", Table2]].map(([v, l, I]) => { const Icon = I as typeof Table2; return <button key={String(v)} type="button" aria-pressed={view === v} onClick={() => setView(String(v))} className={cn("inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-medium", view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}><Icon className="size-3.5" />{String(l)}</button>; })}</div>}
        <button type="button" className={btn.outline} onClick={() => setManaging(true)}>Stages</button>
        <Link href="/crm/opportunities/new" className={btn.primary}><Plus /> New opportunity</Link>
      </>} />
      {stages.length === 0 ? (
        <Card><div className="p-6"><Empty icon={Target} title="No pipeline stages configured" text="Add pipeline stages to start tracking your sales pipeline." action={<div className="flex gap-2"><button type="button" className={btn.smPrimary} onClick={addDefaultStages}>Add default stages</button><button type="button" className={btn.smOutline} onClick={() => setManaging(true)}>Manage stages</button></div>} /></div></Card>
      ) : view === "board" ? (
        <div className="flex gap-3 overflow-x-auto pb-2">{stages.map((s) => { const col = opps.filter((o) => stageOf(o, stages)?.id === s.id); const total = col.reduce((t, o) => t + num(o.value), 0); return (
          <section key={s.id} aria-label={`${s.name} column`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const o = opps.find((x) => x.id === drag); if (o && stageOf(o, stages)?.id !== s.id) moveOpportunity(o, s); setDrag(null); }} className={cn("flex min-h-[320px] w-64 shrink-0 flex-col rounded-lg border border-border bg-card p-3", s.kind === "WON" && "border-success/40", s.kind === "LOST" && "border-destructive/30")}>
            <div className="mb-1 flex items-center justify-between"><span className="text-sm font-semibold">{String(s.name)}</span><Pill>{col.length}</Pill></div>
            <p className="mb-2 text-xs text-muted-foreground">{money(total)} · {num(s.probability)}%</p>
            <div className="space-y-2">{col.map((o) => (
              <article key={o.id} draggable onDragStart={() => setDrag(o.id)} onDragEnd={() => setDrag(null)} onClick={() => router.push(`/crm/opportunities/${o.id}`)} className={cn("cursor-grab rounded-md border border-border bg-background p-2.5 text-sm shadow-sm hover:shadow-md", drag === o.id && "opacity-50", sel?.id === o.id && "ring-1 ring-primary")}>
                <p className="font-medium">{String(o.title)}</p>
                <p className="text-xs text-muted-foreground">{String(o.customer || "No customer")}</p>
                <div className="mt-1 flex justify-between text-xs"><span className="font-medium tabular-nums">{money(num(o.value))}</span>{Boolean(o.closeDate) && <span className={cn("text-muted-foreground", s.kind === "OPEN" && String(o.closeDate) < todayIso() && "text-destructive")}>{fmtDate(o.closeDate)}</span>}</div>
              </article>
            ))}{col.length === 0 && <div className="rounded-md border border-dashed border-border py-6 text-center text-xs text-muted-foreground">Drop deals here</div>}</div>
          </section>
        ); })}</div>
      ) : (
        <Card><DataTable rows={[...opps].reverse()} onRowClick={(o) => router.push(`/crm/opportunities/${o.id}`)} emptyText="No opportunities yet." columns={[
          { key: "n", header: "Opp #", cell: (o) => <span className="font-mono text-xs">{String(o.number ?? "—")}</span> },
          { key: "t", header: "Name", cell: (o) => <span className="font-medium">{String(o.title)}</span> },
          { key: "c", header: "Customer", cell: (o) => String(o.customer || "—") },
          { key: "s", header: "Stage", cell: (o) => <Badge tone={oppStatus(o, stages) === "WON" ? "success" : oppStatus(o, stages) === "LOST" ? "destructive" : "info"}>{String(stageOf(o, stages)?.name ?? o.stage ?? "—")}</Badge> },
          { key: "a", header: "Amount", className: "text-right", cell: (o) => money(num(o.value)) },
          { key: "p", header: "Prob.", className: "text-right", cell: (o) => `${num(o.probability || stageOf(o, stages)?.probability)}%` },
          { key: "d", header: "Expected close", cell: (o) => fmtDate(o.closeDate) },
        ]} menu={(o) => [{ label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${o.title}?`) && deleteRecord("opportunities", o.id) }]} /></Card>
      )}
      {managing && <StagesDialog onClose={() => setManaging(false)} />}
      {sub === "new" && <SidePanel onClose={close}><OppForm onDone={(id) => router.push(id ? `/crm/opportunities/${id}` : "/crm/opportunities")} /></SidePanel>}
      {sel && <SidePanel onClose={close}><OppDetail key={sel.id} opp={sel} /></SidePanel>}
    </div>
  );
}

function StagesDialog({ onClose }: { onClose: () => void }) {
  const stages = sortStages(useCollection("pipeline-stages"));
  const opps = useCollection("opportunities");
  const [name, setName] = useState("");
  const swap = (i: number, j: number) => { const a = stages[i], b = stages[j]; if (!a || !b) return; updateRecord("pipeline-stages", a.id, { order: num(b.order) }); updateRecord("pipeline-stages", b.id, { order: num(a.order) === num(b.order) ? num(a.order) + 1 : num(a.order) }); };
  function add() {
    if (!name.trim()) return;
    createRecord("pipeline-stages", { name: name.trim(), probability: 50, kind: "OPEN", order: stages.length ? num(stages[stages.length - 1].order) + 1 : 0 });
    setName("");
  }
  return (
    <Dialog open onClose={onClose} title="Pipeline stages" description="Each stage's probability weights the forecast. Won and Lost stages close a deal." className="max-w-2xl">
      <div className="space-y-3">
        {stages.length === 0 && <div className="flex items-center justify-between rounded-md border border-dashed border-border p-3 text-sm"><span className="text-muted-foreground">No stages yet.</span><button type="button" className={btn.smOutline} onClick={addDefaultStages}>Add default stages</button></div>}
        {stages.map((s, i) => { const used = opps.filter((o) => stageOf(o, stages)?.id === s.id).length; return (
          <div key={s.id} className="flex items-center gap-2">
            <div className="flex flex-col"><button type="button" aria-label={`Move ${s.name} up`} disabled={i === 0} onClick={() => swap(i, i - 1)} className="text-muted-foreground disabled:opacity-30"><ChevronUp className="size-3.5" /></button><button type="button" aria-label={`Move ${s.name} down`} disabled={i === stages.length - 1} onClick={() => swap(i, i + 1)} className="text-muted-foreground disabled:opacity-30"><ChevronDown className="size-3.5" /></button></div>
            <input aria-label="Stage name" key={`n${String(s.name)}`} defaultValue={String(s.name)} onBlur={(e) => e.target.value.trim() && e.target.value !== s.name && updateRecord("pipeline-stages", s.id, { name: e.target.value.trim() })} className={cn(inputCls, "h-8 flex-1")} />
            <div className="relative w-24"><input aria-label={`${s.name} probability`} type="number" min={0} max={100} key={`p${num(s.probability)}`} defaultValue={num(s.probability)} onBlur={(e) => updateRecord("pipeline-stages", s.id, { probability: Math.max(0, Math.min(100, num(e.target.value))) })} className={cn(inputCls, "h-8 pr-6 text-right")} /><span className="absolute right-2 top-1.5 text-xs text-muted-foreground">%</span></div>
            <Select size="sm" className="w-24" ariaLabel={`${s.name} kind`} value={String(s.kind)} onChange={(v) => updateRecord("pipeline-stages", s.id, { kind: v, ...(v === "WON" ? { probability: 100 } : v === "LOST" ? { probability: 0 } : {}) })} options={[{ value: "OPEN", label: "Open" }, { value: "WON", label: "Won" }, { value: "LOST", label: "Lost" }]} />
            <button type="button" aria-label={`Delete ${s.name}`} title={used ? `${used} deal(s) are in this stage` : "Delete stage"} disabled={used > 0} onClick={() => deleteRecord("pipeline-stages", s.id)} className={cn(btn.icon, "text-muted-foreground disabled:opacity-30")}><Trash2 className="!size-3.5" /></button>
          </div>
        ); })}
        <div className="flex gap-2 border-t border-border pt-3"><input aria-label="New stage name" className={cn(inputCls, "h-8")} placeholder="New stage name" value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} /><button type="button" className={btn.smOutline} onClick={add}><Plus /> Add stage</button></div>
        <div className="flex justify-end"><button type="button" className={btn.primary} onClick={onClose}>Done</button></div>
      </div>
    </Dialog>
  );
}

function OppForm({ opp, onDone }: { opp?: Rec; onDone: (id?: string) => void }) {
  const stages = sortStages(useCollection("pipeline-stages"));
  const leads = useCollection("leads");
  const [preview] = useState(() => (opp ? String(opp.number) : nextNumber("opportunities", "OPP")));
  const [f, setF] = useState({ title: String(opp?.title ?? ""), customer: String(opp?.customer ?? ""), leadId: String(opp?.leadId ?? ""), stageId: String(opp ? stageOf(opp, stages)?.id ?? "" : ""), value: String(opp?.value ?? ""), closeDate: String(opp?.closeDate ?? "") });
  const [err, setErr] = useState("");
  function save() {
    if (!f.title.trim()) return setErr("Name is required");
    const stage = stages.find((s) => s.id === f.stageId);
    if (!stage) return setErr(stages.length ? "Choose a stage" : "Add pipeline stages first");
    const data = { title: f.title.trim(), customer: f.customer, leadId: f.leadId, value: num(f.value), closeDate: f.closeDate, stageId: stage.id, stage: stage.name, probability: num(stage.probability), status: stage.kind };
    if (opp) { const moved = stageOf(opp, stages)?.id !== stage.id; updateRecord("opportunities", opp.id, { ...data, closedAt: stage.kind === "OPEN" ? null : opp.closedAt ?? todayIso() }); if (moved) logActivity({ type: "NOTE", relatedType: "Opportunity", relatedId: opp.id, subject: `Stage changed to ${stage.name}` }); onDone(opp.id); return; }
    const r = createRecord("opportunities", { number: nextNumber("opportunities", "OPP"), ...data, closedAt: stage.kind === "OPEN" ? null : todayIso() });
    onDone(r.id);
  }
  return (
    <div className="space-y-4">
      {!opp && <div><h2 className="text-2xl font-semibold tracking-tight">New Opportunity</h2><p className="text-sm text-muted-foreground">Add a new deal to your sales pipeline</p></div>}
      <Section title="Opportunity Details">
        <NumberBanner label="Opportunity #" value={preview} saved={!!opp} />
        <Field label={<>Name <Req /></>} htmlFor="opp-title"><input id="opp-title" className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer (optional)"><CustomerPicker value={f.customer} onChange={(v) => setF({ ...f, customer: v })} placeholder="—" /></Field>
          <Field label="Lead (optional)" hint="Attribute this deal to the lead it came from."><Select ariaLabel="Lead" placeholder="— None —" value={f.leadId} onChange={(v) => { const l = leads.find((x) => x.id === v); setF({ ...f, leadId: v, customer: f.customer || String(l?.customer ?? "") }); }} options={leads.map((l) => ({ value: l.id, label: `${leadName(l)}${l.organization ? ` · ${l.organization}` : ""}` }))} /></Field>
          <Field label={<>Stage <Req /></>}>{stages.length ? <Select ariaLabel="Stage" placeholder="—" value={f.stageId} onChange={(v) => setF({ ...f, stageId: v })} options={stages.map((s) => ({ value: s.id, label: `${s.name} (${num(s.probability)}%)` }))} /> : <button type="button" className={btn.smOutline} onClick={addDefaultStages}>Add default stages</button>}</Field>
          <Field label="Amount" htmlFor="opp-value"><input id="opp-value" type="number" className={inputCls} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
          <Field label="Expected close"><DateInput ariaLabel="Expected close" value={f.closeDate} onChange={(v) => setF({ ...f, closeDate: v })} /></Field>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{opp ? "Save Changes" : "Create"}</button><button type="button" className={btn.outline} onClick={() => onDone(opp?.id)}>Cancel</button></div>
      </Section>
    </div>
  );
}

function OppDetail({ opp: o }: { opp: Rec }) {
  const router = useRouter();
  const stages = sortStages(useCollection("pipeline-stages"));
  const quotes = useCollection("quotes").filter((q) => q.opportunityId === o.id);
  const leads = useCollection("leads");
  const [editing, setEditing] = useState(false);
  const cur = stageOf(o, stages);
  const status = oppStatus(o, stages);
  const lead = leads.find((l) => l.id === o.leadId);
  if (editing) return <OppForm opp={o} onDone={() => setEditing(false)} />;
  const won = stages.find((s) => s.kind === "WON"), lost = stages.find((s) => s.kind === "LOST");
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono text-xs text-muted-foreground">{String(o.number ?? "")}</p><h2 className="text-2xl font-semibold tracking-tight">{String(o.title)}</h2><p className="text-sm text-muted-foreground">{String(o.customer || "No customer")}{lead && <> · from lead <Link className="text-primary hover:underline" href={`/crm/leads/${lead.id}`}>{leadName(lead)}</Link></>}</p></div>
        <div className="text-right"><p className="text-2xl font-semibold tabular-nums">{money(num(o.value))}</p><p className="text-xs text-muted-foreground">Weighted {money((num(o.value) * num(o.probability || cur?.probability)) / 100)}</p></div>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Stage">{stages.map((s) => <button key={s.id} type="button" onClick={() => cur?.id !== s.id && moveOpportunity(o, s)} className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", cur?.id === s.id ? (s.kind === "WON" ? "border-success bg-success text-white" : s.kind === "LOST" ? "border-destructive bg-destructive text-white" : "border-primary bg-primary text-primary-foreground") : "border-border text-muted-foreground hover:text-foreground")}>{String(s.name)}</button>)}</div>
      <div className="flex flex-wrap gap-2">
        {status === "OPEN" && won && <button type="button" className={btn.smPrimary} onClick={() => moveOpportunity(o, won)}>Mark won</button>}
        {status === "OPEN" && lost && <button type="button" className={btn.smOutline} onClick={() => moveOpportunity(o, lost)}>Mark lost</button>}
        <Link href={`/crm/quotes/new?opportunity=${o.id}`} className={btn.smOutline}><FileText /> Create quote</Link>
        <button type="button" className={btn.smOutline} onClick={() => setEditing(true)}>Edit</button>
        <button type="button" className={cn(btn.smOutline, "text-destructive")} onClick={() => { if (confirm("Delete this opportunity?")) { deleteRecord("opportunities", o.id); router.push("/crm/opportunities"); } }}><Trash2 /> Delete</button>
      </div>
      <Card><dl className="grid gap-x-6 gap-y-3 p-5 text-sm sm:grid-cols-3">
        {[["Stage", cur?.name ?? o.stage], ["Probability", `${num(o.probability || cur?.probability)}%`], ["Expected close", fmtDate(o.closeDate)], ["Status", words(status)], ["Closed", fmtDate(o.closedAt)], ["Created", fmtDate(o.createdAt)]].map(([k, v]) => <div key={String(k)}><dt className="text-xs text-muted-foreground">{String(k)}</dt><dd>{String(v ?? "—")}</dd></div>)}
      </dl></Card>
      <Card><div className="space-y-2 p-5"><CardTitle>Quotes</CardTitle>
        {quotes.length === 0 ? <p className="text-sm text-muted-foreground">No quotes for this deal yet.</p> : <ul className="divide-y divide-border/60 text-sm">{quotes.map((q) => <li key={q.id} className="flex items-center justify-between py-2"><Link className="font-mono text-primary hover:underline" href={`/crm/quotes/${q.id}`}>{String(q.number)}</Link><span className="tabular-nums">{String(q.currency ?? "")} {money(num(q.total))}</span><Badge>{String(q.status)}</Badge></li>)}</ul>}
      </div></Card>
      <ActivityTimeline relatedType="Opportunity" relatedId={o.id} />
    </div>
  );
}

/* ---------- forecasts ---------- */

const monthLabel = (k: string) => (k === "No date" ? k : new Date(`${k}-01T00:00:00`).toLocaleDateString(undefined, { month: "short", year: "numeric" }));

export function Forecasts() {
  const stages = useCollection("pipeline-stages");
  const opps = useCollection("opportunities");
  const quota = useSetting("crm-quota", { monthly: 0 });
  const [draft, setDraft] = useState<string | null>(null);
  const f = forecast(opps, stages);
  const month = todayIso().slice(0, 7);
  const wonMonth = opps.filter((o) => oppStatus(o, stages) === "WON" && String(o.closedAt ?? o.updatedAt ?? "").slice(0, 7) === month).reduce((t, o) => t + num(o.value), 0);
  const attain = quota.monthly ? (wonMonth / quota.monthly) * 100 : null;
  const maxStage = Math.max(1, ...f.byStage.map((s) => s.amount));
  const maxMonth = Math.max(1, ...f.byMonth.map((s) => s.amount));
  const Bar = ({ amount, weighted, max }: { amount: number; weighted: number; max: number }) => (
    <div className="relative h-3 w-full min-w-24 overflow-hidden rounded bg-muted" title={`Weighted ${money(weighted)} of ${money(amount)}`}><div className="absolute inset-y-0 left-0 rounded bg-primary/30" style={{ width: `${(amount / max) * 100}%` }} /><div className="absolute inset-y-0 left-0 rounded bg-primary" style={{ width: `${(weighted / max) * 100}%` }} /></div>
  );
  return (
    <div className="space-y-4">
      <PageHeader title="Sales forecasts" subtitle="Weighted pipeline by stage probability" />
      {f.open.length === 0 && !wonMonth ? (
        <Card><div className="p-6"><Empty icon={ChartColumn} title="No open pipeline" text="Forecasts will appear here once you have open opportunities. Each stage's weighted value uses its probability — set probabilities on pipeline stages." action={<Link href="/crm/opportunities" className={btn.smOutline}>Go to opportunities</Link>} /></div></Card>
      ) : <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Open pipeline" value={money(f.amount)} />
          <StatCard label="Weighted forecast" value={money(f.weighted)} />
          <StatCard label="Won this month" value={money(wonMonth)} tone="success" />
          <StatCard label="Quota attainment" value={attain == null ? "—" : `${attain.toFixed(1)}%`} tone={attain != null && attain >= 100 ? "success" : undefined} />
        </div>
        <Card><div className="space-y-3 p-5"><CardTitle>By stage</CardTitle>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Stage</Th><Th className="text-right">Probability</Th><Th className="text-right">Deals</Th><Th className="text-right">Amount</Th><Th className="text-right">Weighted</Th><Th className="w-1/3" /></tr></thead>
            <tbody>{f.byStage.map((s) => <tr key={s.stage.id} className="border-b border-border/60"><td className="px-2 py-2 font-medium">{String(s.stage.name)}</td><td className="px-2 text-right tabular-nums">{num(s.stage.probability)}%</td><td className="px-2 text-right tabular-nums">{s.deals}</td><td className="px-2 text-right tabular-nums">{money(s.amount)}</td><td className="px-2 text-right tabular-nums">{money(s.weighted)}</td><td className="px-2"><Bar amount={s.amount} weighted={s.weighted} max={maxStage} /></td></tr>)}</tbody>
            <tfoot><tr className="border-t-2 border-border font-semibold"><td className="px-2 py-2">Total</td><td /><td className="px-2 text-right tabular-nums">{f.open.length}</td><td className="px-2 text-right tabular-nums">{money(f.amount)}</td><td className="px-2 text-right tabular-nums">{money(f.weighted)}</td><td /></tr></tfoot></table></div>
          <p className="flex items-center gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-primary" /> Weighted</span><span className="flex items-center gap-1"><span className="inline-block size-2.5 rounded-sm bg-primary/30" /> Unweighted amount</span></p>
        </div></Card>
        <Card><div className="space-y-3 p-5"><CardTitle>By expected close month</CardTitle>
          <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Month</Th><Th className="text-right">Deals</Th><Th className="text-right">Amount</Th><Th className="text-right">Weighted</Th><Th className="w-1/3" /></tr></thead>
            <tbody>{f.byMonth.map((m) => <tr key={m.month} className="border-b border-border/60"><td className={cn("px-2 py-2 font-medium", m.month !== "No date" && m.month < month && "text-destructive")}>{monthLabel(m.month)}</td><td className="px-2 text-right tabular-nums">{m.deals}</td><td className="px-2 text-right tabular-nums">{money(m.amount)}</td><td className="px-2 text-right tabular-nums">{money(m.weighted)}</td><td className="px-2"><Bar amount={m.amount} weighted={m.weighted} max={maxMonth} /></td></tr>)}</tbody></table></div>
          {f.byMonth.some((m) => m.month !== "No date" && m.month < month) && <p className="text-xs text-destructive">Months in red are past — those deals&apos; close dates need updating.</p>}
        </div></Card>
      </>}
      <Card><div className="flex flex-wrap items-end gap-3 p-5">
        <Field label="Monthly quota" htmlFor="quota" hint="Won deals closed this month count toward attainment."><input id="quota" type="number" min={0} className={cn(inputCls, "w-48")} value={draft ?? String(quota.monthly || "")} onChange={(e) => setDraft(e.target.value)} /></Field>
        <button type="button" className={btn.outline} disabled={draft == null} onClick={() => { saveSetting("crm-quota", { monthly: num(draft) }); setDraft(null); }}>Save quota</button>
      </div></Card>
    </div>
  );
}

