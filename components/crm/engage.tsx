"use client";

// CRM › engagement pages: quotes (convert to Sales Order), campaigns, lead scoring rules,
// segments and web-to-lead forms.

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Copy, ExternalLink, FileText, Gauge, Globe, Mail, Plus, Trash2, Users } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { CAMPAIGN_KINDS, CAMPAIGN_STATUSES, ENTITY_FIELDS, ACTIVITY_TYPES, QUOTE_STATUSES, SCORE_OPS, SEGMENT_ENTITIES, SEGMENT_OPS, WEB_FORM_FIELDS, campaignAudience, leadName, logActivity, merge, moveOpportunity, processCampaign, processDueCampaigns, recomputeScores, scoreBreakdown, segmentMembers, sortStages, stageOf } from "@/lib/crm";
import { docTotals, lineAmounts, type DocLine } from "@/lib/sales";
import { seedCurrencies, BASE } from "@/lib/finance";
import { todayIso } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, DataTable, DateInput, Field, PageHeader, SearchInput, Select, SidePanel, Switch, btn, inputCls, money, num, textareaCls } from "@/components/accounting/kit";
import { CustomerPicker, NumberBanner, Req, Section } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";
import { Empty, Pill, Th, fmtDate, useFlash } from "@/components/hr/people";
import { Tabs, fmtWhen } from "@/components/crm/pipeline";

const opts = (xs: string[]) => xs.map((x) => ({ value: x, label: x }));
const STATUS_TONE: Record<string, "muted" | "info" | "primary" | "warning" | "success" | "destructive"> = { draft: "muted", sent: "info", accepted: "success", rejected: "destructive", converted: "primary", scheduled: "info", running: "success", paused: "warning", completed: "primary", cancelled: "destructive" };
const Status = ({ s }: { s: unknown }) => <Badge tone={STATUS_TONE[String(s)] ?? "muted"}>{String(s)}</Badge>;
const Count = ({ shown, total }: { shown: number; total: number }) => <span className="ml-auto text-sm text-muted-foreground">{shown} of {total}</span>;
const PanelHead = ({ title, sub }: { title: string; sub: string }) => <div><h2 className="text-2xl font-semibold tracking-tight">{title}</h2><p className="text-sm text-muted-foreground">{sub}</p></div>;

/* ---------- quotes ---------- */

type QLine = DocLine;
const blankQLine = (): QLine => ({ description: "", qty: 1, unitPrice: 0, taxPct: 18 });

export function Quotes() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/crm/quotes");
  const quotes = useCollection("quotes");
  const opps = useCollection("opportunities");
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const sel = quotes.find((x) => x.id === sub);
  const close = () => router.push("/crm/quotes");
  const ql = q.trim().toLowerCase();
  const rows = [...quotes].reverse().filter((x) => (tab === "All" || x.status === tab) && (!ql || [x.number, x.customer].some((v) => String(v ?? "").toLowerCase().includes(ql))));
  return (
    <div className="space-y-4">
      <PageHeader title="Quotes" subtitle="Generate quotes, send, convert to Sales Order" actions={<Link href="/crm/quotes/new" className={btn.primary}><Plus /> New quote</Link>} />
      <div className="flex flex-wrap items-center gap-3"><div className="w-72 max-w-full"><SearchInput value={q} onChange={setQ} placeholder="Search by customer or quote #..." /></div><Tabs value={tab} onChange={setTab} items={["All", ...QUOTE_STATUSES].map((s) => [s, s])} /><Count shown={rows.length} total={quotes.length} /></div>
      {quotes.length === 0 ? <Card><div className="p-6"><Empty icon={FileText} title="No quotes yet" text="Build a quote from your opportunities, send it to a customer, and convert accepted quotes into Sales Orders." action={<Link href="/crm/quotes/new" className={btn.smPrimary}><Plus /> New quote</Link>} /></div></Card> : (
        <Card><DataTable rows={rows} onRowClick={(x) => router.push(`/crm/quotes/${x.id}`)} emptyText="No quotes match." columns={[
          { key: "n", header: "Quote #", cell: (x) => <span className="font-mono text-xs">{String(x.number)}</span> },
          { key: "c", header: "Customer", cell: (x) => String(x.customer || "—") },
          { key: "o", header: "Opportunity", cell: (x) => String(opps.find((o) => o.id === x.opportunityId)?.title ?? "—") },
          { key: "d", header: "Date", cell: (x) => fmtDate(x.createdAt) },
          { key: "v", header: "Valid until", cell: (x) => <span className={cn(["draft", "sent"].includes(String(x.status)) && !!x.validUntil && String(x.validUntil) < todayIso() && "text-destructive")}>{fmtDate(x.validUntil)}</span> },
          { key: "t", header: "Total", className: "text-right", cell: (x) => `${String(x.currency ?? "")} ${money(num(x.total))}` },
          { key: "s", header: "Status", cell: (x) => <Status s={x.status} /> },
        ]} menu={(x) => x.status === "draft" ? [{ label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${x.number}?`) && deleteRecord("quotes", x.id) }] : []} /></Card>
      )}
      {sub === "new" && <SidePanel onClose={close}><Suspense fallback={null}><QuoteForm onDone={(id) => router.push(id ? `/crm/quotes/${id}` : "/crm/quotes")} /></Suspense></SidePanel>}
      {sel && <SidePanel onClose={close}><QuoteDetail key={sel.id} quote={sel} /></SidePanel>}
    </div>
  );
}

function QuoteForm({ quote, onDone }: { quote?: Rec; onDone: (id?: string) => void }) {
  const opps = useCollection("opportunities");
  const currencies = useCollection("currencies");
  useEffect(() => { const t = setTimeout(seedCurrencies, 0); return () => clearTimeout(t); }, []);
  const params = useSearchParams();
  const [preview] = useState(() => (quote ? String(quote.number) : nextNumber("quotes", "QT")));
  // Opened from an opportunity as /crm/quotes/new?opportunity=<id>.
  const [f, setF] = useState(() => {
    const oid = quote ? String(quote.opportunityId ?? "") : params.get("opportunity") ?? "";
    const o = readCollection("opportunities").find((x) => x.id === oid);
    return { opportunityId: oid, customer: String(quote?.customer ?? o?.customer ?? ""), currency: String(quote?.currency ?? BASE), validUntil: String(quote?.validUntil ?? ""), notes: String(quote?.notes ?? "") };
  });
  const [lines, setLines] = useState<QLine[]>(() => (quote?.lines as QLine[]) ?? [blankQLine()]);
  const [err, setErr] = useState("");
  const valid = lines.filter((l) => l.description.trim() && num(l.qty) > 0);
  const totals = docTotals(valid);
  const set = (i: number, p: Partial<QLine>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...p } : l)));
  function save() {
    if (!f.customer) return setErr("Choose a customer");
    if (!valid.length) return setErr("Add at least one line with a description");
    const data = { ...f, lines: valid, subtotal: totals.subtotal, tax: totals.tax, total: totals.total };
    if (quote) { updateRecord("quotes", quote.id, data); onDone(quote.id); return; }
    const r = createRecord("quotes", { number: nextNumber("quotes", "QT"), ...data, status: "draft" });
    if (f.opportunityId) logActivity({ type: "NOTE", relatedType: "Opportunity", relatedId: f.opportunityId, subject: `Quote ${r.number} created` });
    onDone(r.id);
  }
  const numCls = cn(inputCls, "h-8 text-right");
  return (
    <div className="space-y-4">
      {!quote && <PanelHead title="New Quote" sub="Generate quotes, send, convert to Sales Order" />}
      <Section title="Quote Details">
        <NumberBanner label="Quote #" value={preview} saved={!!quote} />
        <Field label="Opportunity"><Select ariaLabel="Opportunity" placeholder="— None —" value={f.opportunityId} onChange={(v) => { const o = opps.find((x) => x.id === v); setF({ ...f, opportunityId: v, customer: String(o?.customer || f.customer) }); }} options={opps.map((o) => ({ value: o.id, label: `${o.number ?? ""} ${o.title}`.trim() }))} /></Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>Customer <Req /></>}><CustomerPicker value={f.customer} onChange={(v) => setF({ ...f, customer: v })} placeholder="— None —" /></Field>
          <Field label="Currency"><Select ariaLabel="Currency" value={f.currency} onChange={(v) => setF({ ...f, currency: v })} options={(currencies.length ? currencies : [{ id: BASE, code: BASE }]).map((c) => ({ value: String(c.code), label: String(c.code) }))} /></Field>
          <Field label="Valid until"><DateInput ariaLabel="Valid until" value={f.validUntil} onChange={(v) => setF({ ...f, validUntil: v })} /></Field>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-medium">Line items</span><button type="button" aria-label="Add line" className={cn(btn.icon, "border border-input")} onClick={() => setLines([...lines, blankQLine()])}><Plus className="!size-3.5" /></button></div>
          <div className="grid grid-cols-[1fr_4.5rem_6rem_4.5rem_6rem_2rem] gap-2 text-xs text-muted-foreground"><span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit price</span><span className="text-right">Tax %</span><span className="text-right">Total</span><span /></div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_4.5rem_6rem_4.5rem_6rem_2rem] items-center gap-2">
              <input aria-label={`Line ${i + 1} description`} className={cn(inputCls, "h-8")} placeholder="Description" value={l.description} onChange={(e) => set(i, { description: e.target.value })} />
              <input aria-label={`Line ${i + 1} quantity`} type="number" min={0} className={numCls} value={l.qty} onChange={(e) => set(i, { qty: num(e.target.value) })} />
              <input aria-label={`Line ${i + 1} unit price`} type="number" min={0} step="0.01" className={numCls} value={l.unitPrice} onChange={(e) => set(i, { unitPrice: num(e.target.value) })} />
              <input aria-label={`Line ${i + 1} tax`} type="number" min={0} className={numCls} value={l.taxPct ?? 0} onChange={(e) => set(i, { taxPct: num(e.target.value) })} />
              <span className="text-right text-sm tabular-nums">{money(lineAmounts(l).total)}</span>
              <button type="button" aria-label="Remove line" disabled={lines.length <= 1} onClick={() => setLines(lines.filter((_, k) => k !== i))} className={cn(btn.icon, "h-7 w-7 text-muted-foreground")}><Trash2 className="!size-3.5" /></button>
            </div>
          ))}
          <div className="ml-auto w-56 space-y-1 text-sm">{[["Subtotal", totals.subtotal], ["Tax", totals.tax]].map(([k, v]) => <div key={String(k)} className="flex justify-between text-muted-foreground"><span>{k}</span><span className="tabular-nums">{money(Number(v))}</span></div>)}<div className="flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span className="tabular-nums">{f.currency} {money(totals.total)}</span></div></div>
        </div>
        <Field label="Notes" htmlFor="q-notes"><textarea id="q-notes" rows={2} className={textareaCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{quote ? "Save Changes" : "Create"}</button><button type="button" className={btn.outline} onClick={() => onDone(quote?.id)}>Cancel</button></div>
      </Section>
    </div>
  );
}

function QuoteDetail({ quote: x }: { quote: Rec }) {
  const router = useRouter();
  const opps = useCollection("opportunities");
  const stages = sortStages(useCollection("pipeline-stages"));
  const customers = useCollection("customers");
  const [editing, setEditing] = useState(false);
  const { node, flash } = useFlash();
  const opp = opps.find((o) => o.id === x.opportunityId);
  const lines = (x.lines as QLine[]) ?? [];
  const status = String(x.status);
  const setStatus = (s: string, note: string) => { updateRecord("quotes", x.id, { status: s, [`${s}At`]: todayIso() }); if (opp) logActivity({ type: "NOTE", relatedType: "Opportunity", relatedId: opp.id, subject: `Quote ${x.number} ${note}` }); };
  function send() {
    const email = String(customers.find((c) => c.name === x.customer)?.email ?? "");
    const body = [`Dear ${x.customer},`, "", `Please find our quote ${x.number}:`, "", ...lines.map((l) => `- ${l.description}: ${l.qty} × ${money(num(l.unitPrice))}${l.taxPct ? ` (+${l.taxPct}% tax)` : ""}`), "", `Total: ${x.currency} ${money(num(x.total))}`, x.validUntil ? `Valid until ${fmtDate(x.validUntil)}.` : "", "", String(x.notes ?? "")].join("\n");
    window.open(`mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(`Quote ${x.number}`)}&body=${encodeURIComponent(body)}`, "_self");
    setStatus("sent", "sent to customer");
    flash(email ? `Opened your email app for ${email}` : "Marked as sent — the customer has no email on file");
  }
  function convert() {
    const so = createRecord("sales-orders", { number: nextNumber("sales-orders", "SO"), customer: x.customer, title: opp ? String(opp.title) : `Quote ${x.number}`, date: todayIso(), reference: x.number, lines, notes: x.notes ?? "", total: x.total, currency: x.currency, status: "CONFIRMED", quoteId: x.id });
    updateRecord("quotes", x.id, { status: "converted", salesOrderId: so.id, convertedAt: todayIso() });
    const won = stages.find((s) => s.kind === "WON");
    if (opp && won && stageOf(opp, stages)?.kind === "OPEN") moveOpportunity(opp, won);
    if (opp) logActivity({ type: "NOTE", relatedType: "Opportunity", relatedId: opp.id, subject: `Quote ${x.number} converted to sales order ${so.number}` });
    flash(`Sales order ${so.number} created${opp && won ? " · deal marked won" : ""}`);
  }
  if (editing) return <Suspense fallback={null}><QuoteForm quote={x} onDone={() => setEditing(false)} /></Suspense>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="font-mono text-xs text-muted-foreground">{String(x.number)}</p><h2 className="text-2xl font-semibold tracking-tight">{String(x.customer)}</h2><p className="text-sm text-muted-foreground">{opp ? <>For <Link className="text-primary hover:underline" href={`/crm/opportunities/${opp.id}`}>{String(opp.title)}</Link> · </> : null}Valid until {fmtDate(x.validUntil)}</p></div>
        <Status s={status} />
      </div>
      <div className="flex flex-wrap gap-2">
        {["draft", "sent"].includes(status) && <button type="button" className={btn.smPrimary} onClick={send}><Mail /> {status === "sent" ? "Resend" : "Send"}</button>}
        {status === "sent" && <><button type="button" className={btn.smOutline} onClick={() => setStatus("accepted", "accepted")}>Mark accepted</button><button type="button" className={btn.smOutline} onClick={() => setStatus("rejected", "rejected")}>Mark rejected</button></>}
        {["sent", "accepted"].includes(status) && <button type="button" className={btn.smPrimary} onClick={convert}>Convert to Sales Order</button>}
        {status === "rejected" && <button type="button" className={btn.smOutline} onClick={() => updateRecord("quotes", x.id, { status: "draft" })}>Revise</button>}
        {status === "draft" && <button type="button" className={btn.smOutline} onClick={() => setEditing(true)}>Edit</button>}
        {Boolean(x.salesOrderId) && <Link href={`/ar/sales-orders/${x.salesOrderId}`} className={btn.smOutline}><ExternalLink /> Open sales order</Link>}
        {status === "draft" && <button type="button" className={cn(btn.smOutline, "text-destructive")} onClick={() => { if (confirm("Delete this quote?")) { deleteRecord("quotes", x.id); router.push("/crm/quotes"); } }}><Trash2 /> Delete</button>}
      </div>
      <Card><div className="overflow-x-auto p-2"><table className="w-full text-sm">
        <thead><tr className="border-b border-border"><Th>Description</Th><Th className="text-right">Qty</Th><Th className="text-right">Unit price</Th><Th className="text-right">Tax %</Th><Th className="text-right">Total</Th></tr></thead>
        <tbody>{lines.map((l, i) => <tr key={i} className="border-b border-border/60"><td className="px-2 py-2">{l.description}</td><td className="px-2 text-right tabular-nums">{l.qty}</td><td className="px-2 text-right tabular-nums">{money(num(l.unitPrice))}</td><td className="px-2 text-right tabular-nums">{num(l.taxPct)}%</td><td className="px-2 text-right tabular-nums">{money(lineAmounts(l).total)}</td></tr>)}</tbody>
        <tfoot><tr><td colSpan={4} className="px-2 pt-2 text-right text-muted-foreground">Subtotal</td><td className="px-2 pt-2 text-right tabular-nums">{money(num(x.subtotal))}</td></tr><tr><td colSpan={4} className="px-2 text-right text-muted-foreground">Tax</td><td className="px-2 text-right tabular-nums">{money(num(x.tax))}</td></tr><tr className="font-semibold"><td colSpan={4} className="px-2 py-2 text-right">Total</td><td className="px-2 py-2 text-right tabular-nums">{String(x.currency)} {money(num(x.total))}</td></tr></tfoot>
      </table></div></Card>
      {x.notes ? <Card><div className="p-5 text-sm"><p className="text-xs text-muted-foreground">Notes</p><p className="whitespace-pre-wrap">{String(x.notes)}</p></div></Card> : null}
      {node}
    </div>
  );
}

/* ---------- campaigns ---------- */

export function Campaigns() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/crm/campaigns");
  const camps = useCollection("campaigns");
  const segs = useCollection("segments");
  const sends = useCollection("campaign-sends");
  const [tab, setTab] = useState("All");
  useEffect(() => { const t = setTimeout(processDueCampaigns, 0); return () => clearTimeout(t); }, []);
  const sel = camps.find((c) => c.id === sub);
  const close = () => router.push("/crm/campaigns");
  const rows = [...camps].reverse().filter((c) => tab === "All" || c.status === tab);
  return (
    <div className="space-y-4">
      <PageHeader title="Campaigns" subtitle="Email blasts and drip sequences with open/click tracking" actions={<Link href="/crm/campaigns/new" className={btn.primary}><Plus /> New campaign</Link>} />
      <div className="flex flex-wrap items-center gap-3"><Tabs value={tab} onChange={setTab} items={["All", ...CAMPAIGN_STATUSES].map((s) => [s, s])} /><Count shown={rows.length} total={camps.length} /></div>
      {camps.length === 0 ? <Card><div className="p-6"><Empty icon={Mail} title="No campaigns yet" text="Send an email blast or build a drip sequence to nurture leads automatically." action={<Link href="/crm/campaigns/new" className={btn.smPrimary}><Plus /> New campaign</Link>} /></div></Card> : (
        <Card><DataTable rows={rows} onRowClick={(c) => router.push(`/crm/campaigns/${c.id}`)} emptyText="No campaigns match." columns={[
          { key: "n", header: "Name", cell: (c) => <span className="font-medium">{String(c.name)}</span> },
          { key: "k", header: "Kind", cell: (c) => <Pill>{String(c.kind)}</Pill> },
          { key: "a", header: "Audience", cell: (c) => String(segs.find((s) => s.id === c.segmentId)?.name ?? "—") },
          { key: "st", header: "Steps", className: "text-right", cell: (c) => ((c.steps as Rec[]) ?? []).length },
          { key: "se", header: "Sent", className: "text-right", cell: (c) => sends.filter((s) => s.campaignId === c.id).length },
          { key: "sc", header: "Scheduled", cell: (c) => fmtDate(c.scheduledAt) },
          { key: "s", header: "Status", cell: (c) => <Status s={c.status} /> },
        ]} /></Card>
      )}
      {sub === "new" && <SidePanel onClose={close}><CampaignForm onDone={(id) => router.push(id ? `/crm/campaigns/${id}` : "/crm/campaigns")} /></SidePanel>}
      {sel && <SidePanel onClose={close}><CampaignDetail key={sel.id} c={sel} /></SidePanel>}
    </div>
  );
}

function CampaignForm({ onDone }: { onDone: (id?: string) => void }) {
  const [f, setF] = useState({ name: "", kind: "BLAST", scheduledAt: "" });
  const [err, setErr] = useState("");
  function save() {
    if (!f.name.trim()) return setErr("Name is required");
    const r = createRecord("campaigns", { ...f, name: f.name.trim(), status: "draft", steps: [{ subject: "", body: "", delayDays: 0 }] });
    onDone(r.id);
  }
  return (
    <div className="space-y-4">
      <PanelHead title="New Campaign" sub="Email blasts and drip sequences with open/click tracking" />
      <Section title="Campaign Details">
        <Field label="Name" htmlFor="c-name"><input id="c-name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kind" hint={f.kind === "BLAST" ? "One email to everyone in the audience." : f.kind === "DRIP" ? "A sequence of emails spaced by days." : "The sequence starts when someone joins the audience."}><Select ariaLabel="Kind" value={f.kind} onChange={(v) => setF({ ...f, kind: v })} options={opts(CAMPAIGN_KINDS)} /></Field>
          <Field label="Scheduled at"><DateInput ariaLabel="Scheduled at" value={f.scheduledAt} onChange={(v) => setF({ ...f, scheduledAt: v })} /></Field>
        </div>
        <p className="text-xs text-muted-foreground">After create, pick the audience segment and write the email steps on the campaign.</p>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Create</button><button type="button" className={btn.outline} onClick={() => onDone()}>Cancel</button></div>
      </Section>
    </div>
  );
}

function CampaignDetail({ c }: { c: Rec }) {
  const router = useRouter();
  const segs = useCollection("segments");
  const sends = useCollection("campaign-sends").filter((s) => s.campaignId === c.id);
  useCollection("leads");
  const [steps, setSteps] = useState<Rec[]>(() => ((c.steps as Rec[]) ?? []).map((s, i) => ({ ...s, id: String(i) })));
  const [dirty, setDirty] = useState(false);
  const { node, flash } = useFlash();
  const status = String(c.status);
  const editable = ["draft", "paused", "scheduled"].includes(status);
  const audience = campaignAudience(c);
  const setStep = (i: number, p: Record<string, unknown>) => { setSteps(steps.map((s, k) => (k === i ? { ...s, ...p } : s))); setDirty(true); };
  const clean = () => steps.map((s) => ({ subject: String(s.subject ?? ""), body: String(s.body ?? ""), delayDays: num(s.delayDays) }));
  function saveSteps() { updateRecord("campaigns", c.id, { steps: clean() }); setDirty(false); flash("Steps saved"); }
  function check() {
    const st = clean();
    if (!c.segmentId) return "Choose an audience segment";
    if (!st.length || st.some((s) => !s.subject.trim() || !s.body.trim())) return "Every step needs a subject and a body";
    if (c.kind !== "TRIGGER" && !audience.length) return "The audience has nobody with an email address";
    return "";
  }
  function start() {
    const e = check(); if (e) return flash(e, true);
    const rec = { ...c, steps: clean(), status: "running", startedAt: c.startedAt ?? todayIso() };
    updateRecord("campaigns", c.id, { steps: rec.steps, status: "running", startedAt: rec.startedAt });
    setDirty(false);
    const made = processCampaign(rec);
    recomputeScores();
    flash(made ? `${made} email(s) recorded as sent` : "Running — the next steps go out as they come due");
  }
  function schedule() {
    const e = check(); if (e) return flash(e, true);
    if (!c.scheduledAt || String(c.scheduledAt) <= todayIso()) return flash("Set a future date in Scheduled at, or start now", true);
    updateRecord("campaigns", c.id, { steps: clean(), status: "scheduled" }); setDirty(false); flash(`Scheduled for ${fmtDate(c.scheduledAt)}`);
  }
  const mailto = (i: number) => {
    const st = clean()[i];
    const to = audience.slice(0, 50);
    window.open(`mailto:?bcc=${encodeURIComponent(to.map((m) => m.email).join(","))}&subject=${encodeURIComponent(st.subject)}&body=${encodeURIComponent(st.body.replace(/\{\{\s*\w+\s*\}\}/g, ""))}`, "_self");
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="text-2xl font-semibold tracking-tight">{String(c.name)}</h2><p className="text-sm text-muted-foreground">{String(c.kind)} · {c.scheduledAt ? `scheduled ${fmtDate(c.scheduledAt)}` : "not scheduled"}{c.startedAt ? ` · started ${fmtDate(c.startedAt)}` : ""}</p></div>
        <Status s={status} />
      </div>
      <div className="flex flex-wrap gap-2">
        {["draft", "scheduled"].includes(status) && <button type="button" className={btn.smPrimary} onClick={start}>Start now</button>}
        {status === "draft" && <button type="button" className={btn.smOutline} onClick={schedule}>Schedule</button>}
        {status === "running" && <button type="button" className={btn.smOutline} onClick={() => updateRecord("campaigns", c.id, { status: "paused" })}>Pause</button>}
        {status === "paused" && <button type="button" className={btn.smPrimary} onClick={start}>Resume</button>}
        {["running", "paused"].includes(status) && <button type="button" className={btn.smOutline} onClick={() => updateRecord("campaigns", c.id, { status: "completed", completedAt: todayIso() })}>Complete</button>}
        {["draft", "scheduled", "paused"].includes(status) && <button type="button" className={btn.smOutline} onClick={() => updateRecord("campaigns", c.id, { status: "cancelled" })}>Cancel campaign</button>}
        {["draft", "cancelled", "completed"].includes(status) && <button type="button" className={cn(btn.smOutline, "text-destructive")} onClick={() => { if (confirm("Delete this campaign and its send log?")) { readCollection("campaign-sends").filter((s) => s.campaignId === c.id).forEach((s) => deleteRecord("campaign-sends", s.id)); deleteRecord("campaigns", c.id); router.push("/crm/campaigns"); } }}><Trash2 /> Delete</button>}
      </div>
      <Card><div className="space-y-3 p-5">
        <CardTitle>Audience</CardTitle>
        <div className="flex flex-wrap items-center gap-3"><Select className="w-64" ariaLabel="Audience segment" placeholder="Choose a segment…" disabled={!editable} value={String(c.segmentId ?? "")} onChange={(v) => updateRecord("campaigns", c.id, { segmentId: v })} options={segs.map((s) => ({ value: s.id, label: `${s.name} (${String(s.entity).toLowerCase()})` }))} /><span className="text-sm text-muted-foreground">{c.segmentId ? `${audience.length} recipient(s) with an email` : segs.length ? "" : <>No segments yet — <Link className="text-primary hover:underline" href="/crm/segments/new">create one</Link></>}</span></div>
      </div></Card>
      <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between"><CardTitle>Email steps</CardTitle>{editable && c.kind !== "BLAST" && <button type="button" className={btn.smOutline} onClick={() => { setSteps([...steps, { id: String(Date.now()), subject: "", body: "", delayDays: steps.length ? num(steps[steps.length - 1].delayDays) + 3 : 0 }]); setDirty(true); }}><Plus /> Add step</button>}</div>
        {steps.map((s, i) => (
          <div key={String(s.id)} className="space-y-2 rounded-md border border-border p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span className="font-medium text-foreground">Step {i + 1}</span><span className="flex items-center gap-2">{c.kind !== "BLAST" && <>send <input aria-label={`Step ${i + 1} delay`} type="number" min={0} disabled={!editable} className={cn(inputCls, "h-7 w-16 text-right")} value={num(s.delayDays)} onChange={(e) => setStep(i, { delayDays: num(e.target.value) })} /> days after {c.kind === "TRIGGER" ? "joining" : "start"}</>}<span className="ml-2">{sends.filter((x) => num(x.step) === i).length} sent</span>{editable && steps.length > 1 && <button type="button" aria-label={`Remove step ${i + 1}`} className={cn(btn.icon, "h-7 w-7")} onClick={() => { setSteps(steps.filter((_, k) => k !== i)); setDirty(true); }}><Trash2 className="!size-3.5" /></button>}</span></div>
            <input aria-label={`Step ${i + 1} subject`} placeholder="Subject" disabled={!editable} className={inputCls} value={String(s.subject ?? "")} onChange={(e) => setStep(i, { subject: e.target.value })} />
            <textarea aria-label={`Step ${i + 1} body`} placeholder="Hi {{firstName}}, …" rows={4} disabled={!editable} className={textareaCls} value={String(s.body ?? "")} onChange={(e) => setStep(i, { body: e.target.value })} />
            {audience[0] && String(s.subject ?? "") && <p className="text-xs text-muted-foreground">Preview for {audience[0].name}: <i>{merge(String(s.subject), audience[0])}</i></p>}
            {audience.length > 0 && String(s.subject ?? "") && <button type="button" className={btn.smOutline} onClick={() => mailto(i)}><Mail /> Open in email app (BCC {Math.min(50, audience.length)})</button>}
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Merge fields: {"{{firstName}}"}, {"{{name}}"}, {"{{email}}"}, or any lead field such as {"{{organization}}"}.</p>
        {editable && <button type="button" className={btn.primary} disabled={!dirty} onClick={saveSteps}>Save steps</button>}
      </div></Card>
      <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between"><CardTitle>Send log</CardTitle><span className="text-xs text-muted-foreground">Opens {sends.filter((s) => s.openedAt).length} · Clicks {sends.filter((s) => s.clickedAt).length}</span></div>
        {sends.length === 0 ? <p className="text-sm text-muted-foreground">Nothing sent yet.</p> : <div className="max-h-72 overflow-y-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Recipient</Th><Th>Step</Th><Th>Subject</Th><Th>Date</Th></tr></thead><tbody>{[...sends].reverse().map((s) => <tr key={s.id} className="border-b border-border/60"><td className="px-2 py-1.5">{String(s.recipient)}<div className="text-xs text-muted-foreground">{String(s.email)}</div></td><td className="px-2">{num(s.step) + 1}</td><td className="px-2">{String(s.subject)}</td><td className="px-2 text-xs">{fmtDate(s.date)}</td></tr>)}</tbody></table></div>}
        <p className="text-xs text-muted-foreground">Sends are recorded here and on each lead&apos;s timeline. No mail server is connected, so delivery goes through your own email app and opens/clicks aren&apos;t tracked.</p>
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- lead scoring ---------- */

export function Scoring() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/crm/scoring");
  const rules = useCollection("scoring-rules");
  const leads = useCollection("leads");
  const acts = useCollection("activities");
  const { node, flash } = useFlash();
  const sel = rules.find((r) => r.id === sub);
  const close = () => router.push("/crm/scoring");
  const top = leads.filter((l) => !["Converted", "Lost"].includes(String(l.status))).map((l) => ({ l, ...scoreBreakdown(l, rules, acts) })).sort((a, b) => b.score - a.score).slice(0, 10);
  return (
    <div className="space-y-4">
      <PageHeader title="Lead scoring" subtitle="Rule-based scoring on field values + activity signals" actions={<><button type="button" className={btn.outline} onClick={() => flash(`Recomputed ${recomputeScores()} lead score(s)`)}>Recompute all</button><Link href="/crm/scoring/new" className={btn.primary}><Plus /> New rule</Link></>} />
      <div className="flex"><Count shown={rules.length} total={rules.length} /></div>
      {rules.length === 0 ? <Card><div className="p-6"><Empty icon={Gauge} title="No scoring rules yet" text="Create rules to award points based on lead fields or behaviour (email opens, clicks, meetings). Total scores cap at 100." action={<Link href="/crm/scoring/new" className={btn.smPrimary}><Plus /> New rule</Link>} /></div></Card> : (
        <Card><DataTable rows={rules} onRowClick={(r) => router.push(`/crm/scoring/${r.id}`)} columns={[
          { key: "n", header: "Name", cell: (r) => <span className="font-medium">{String(r.name)}</span> },
          { key: "k", header: "Kind", cell: (r) => <Pill>{String(r.kind)}</Pill> },
          { key: "c", header: "Condition", cell: (r) => <code className="text-xs">{r.kind === "ACTIVITY" ? `count(${r.field}) ${r.op === "exists" || !String(r.value ?? "") ? "> 0" : `${r.op} ${r.value}`}` : `${r.field} ${r.op}${r.op === "exists" ? "" : ` ${r.value}`}`}</code> },
          { key: "p", header: "Points", className: "text-right", cell: (r) => <span className={cn("tabular-nums", num(r.points) < 0 && "text-destructive")}>{num(r.points) > 0 ? "+" : ""}{num(r.points)}</span> },
          { key: "a", header: "Active", cell: (r) => <span onClick={(e) => e.stopPropagation()}><Switch checked={r.active !== false} onChange={(v) => { updateRecord("scoring-rules", r.id, { active: v }); recomputeScores(); }} label={`Toggle ${r.name}`} /></span> },
        ]} menu={(r) => [{ label: "Delete", destructive: true, onSelect: () => { deleteRecord("scoring-rules", r.id); recomputeScores(); } }]} /></Card>
      )}
      {top.length > 0 && rules.length > 0 && <Card><div className="space-y-2 p-5"><CardTitle>Top open leads</CardTitle>
        <ul className="divide-y divide-border/60 text-sm">{top.map(({ l, score }) => <li key={l.id} className="flex items-center gap-3 py-2"><Link className="flex-1 text-primary hover:underline" href={`/crm/leads/${l.id}`}>{leadName(l)}</Link><span className="text-xs text-muted-foreground">{String(l.status)}</span><div className="h-1.5 w-32 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${score}%` }} /></div><span className="w-8 text-right tabular-nums">{score}</span></li>)}</ul>
      </div></Card>}
      {(sub === "new" || sel) && <SidePanel onClose={close}><RuleForm key={sub} rule={sel} onDone={() => { recomputeScores(); close(); }} /></SidePanel>}
      {node}
    </div>
  );
}

function RuleForm({ rule, onDone }: { rule?: Rec; onDone: () => void }) {
  const [f, setF] = useState({ name: String(rule?.name ?? ""), kind: String(rule?.kind ?? "FIELD"), points: String(rule?.points ?? "10"), field: String(rule?.field ?? ""), op: String(rule?.op ?? "="), value: String(rule?.value ?? "") });
  const [err, setErr] = useState("");
  function save() {
    if (!f.name.trim()) return setErr("Name is required");
    if (!f.field.trim()) return setErr(f.kind === "ACTIVITY" ? "Choose an activity type" : "Field is required");
    if (!Number.isFinite(Number(f.points)) || f.points === "") return setErr("Points must be a number");
    const data = { ...f, name: f.name.trim(), field: f.field.trim(), points: num(f.points) };
    if (rule) updateRecord("scoring-rules", rule.id, data); else createRecord("scoring-rules", { ...data, active: true });
    onDone();
  }
  return (
    <div className="space-y-4">
      <PanelHead title={rule ? "Edit Scoring Rule" : "New Scoring Rule"} sub="Rule-based scoring on field values + activity signals" />
      <Section title="Rule Details">
        <Field label="Name" htmlFor="r-name"><input id="r-name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Kind"><Select ariaLabel="Kind" value={f.kind} onChange={(v) => setF({ ...f, kind: v, field: "" })} options={opts(["FIELD", "ACTIVITY"])} /></Field>
          <Field label="Points" htmlFor="r-points" hint="Negative points subtract."><input id="r-points" type="number" className={inputCls} value={f.points} onChange={(e) => setF({ ...f, points: e.target.value })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={f.kind === "ACTIVITY" ? "Activity type" : "Field"} htmlFor="r-field">{f.kind === "ACTIVITY" ? <Select ariaLabel="Activity type" placeholder="Choose…" value={f.field} onChange={(v) => setF({ ...f, field: v })} options={opts(ACTIVITY_TYPES)} /> : <><input id="r-field" list="lead-fields" className={inputCls} placeholder="e.g. source" value={f.field} onChange={(e) => setF({ ...f, field: e.target.value })} /><datalist id="lead-fields">{ENTITY_FIELDS.LEAD.map((x) => <option key={x} value={x} />)}</datalist></>}</Field>
          <Field label="Op"><Select ariaLabel="Op" value={f.op} onChange={(v) => setF({ ...f, op: v })} options={opts(SCORE_OPS)} /></Field>
          <Field label="Value" htmlFor="r-value"><input id="r-value" className={inputCls} disabled={f.op === "exists"} value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-muted-foreground">{f.kind === "ACTIVITY" ? "Counts the lead's logged activities of this type (campaign emails count as EMAIL) and compares the count to Value — e.g. MEETING >= 1." : "Compares the lead's field to Value — e.g. source = REFERRAL, estValue > 10000, email exists."}</p>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{rule ? "Save" : "Create"}</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      </Section>
    </div>
  );
}

/* ---------- segments ---------- */

type Filter = { field: string; op: string; value: string };

export function Segments() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/crm/segments");
  const segs = useCollection("segments");
  useCollection("leads"); useCollection("customers"); useCollection("opportunities");
  const sel = segs.find((s) => s.id === sub);
  const close = () => router.push("/crm/segments");
  return (
    <div className="space-y-4">
      <PageHeader title="Segments" subtitle="Dynamic lists built from filter DSL — feed campaigns" actions={<Link href="/crm/segments/new" className={btn.primary}><Plus /> New segment</Link>} />
      <div className="flex"><Count shown={segs.length} total={segs.length} /></div>
      {segs.length === 0 ? <Card><div className="p-6"><Empty icon={Users} title="No segments yet" text="Define a segment with field-based filters to build dynamic lists of leads, contacts, customers, or opportunities to feed campaigns." action={<Link href="/crm/segments/new" className={btn.smPrimary}><Plus /> New segment</Link>} /></div></Card> : (
        <Card><DataTable rows={segs} onRowClick={(s) => router.push(`/crm/segments/${s.id}`)} columns={[
          { key: "n", header: "Name", cell: (s) => <span className="font-medium">{String(s.name)}</span> },
          { key: "e", header: "Entity", cell: (s) => <Pill>{String(s.entity)}</Pill> },
          { key: "f", header: "Filters", cell: (s) => <code className="text-xs">{((s.filters as Filter[]) ?? []).filter((x) => x.field).map((x) => `${x.field} ${x.op}${x.op === "exists" ? "" : ` ${x.value}`}`).join(" AND ") || "everyone"}</code> },
          { key: "m", header: "Members", className: "text-right", cell: (s) => segmentMembers(s).length },
        ]} menu={(s) => [{ label: "Delete", destructive: true, onSelect: () => confirm(`Delete segment ${s.name}?`) && deleteRecord("segments", s.id) }]} /></Card>
      )}
      {(sub === "new" || sel) && <SidePanel onClose={close}><SegmentForm key={sub} seg={sel} onDone={(id) => router.push(id ? `/crm/segments/${id}` : "/crm/segments")} /></SidePanel>}
    </div>
  );
}

function SegmentForm({ seg, onDone }: { seg?: Rec; onDone: (id?: string) => void }) {
  const [f, setF] = useState({ name: String(seg?.name ?? ""), entity: String(seg?.entity ?? "LEAD") });
  const [filters, setFilters] = useState<Filter[]>(() => ((seg?.filters as Filter[]) ?? [{ field: "", op: "=", value: "" }]));
  const [err, setErr] = useState("");
  const members = segmentMembers({ id: "preview", entity: f.entity, filters });
  const setF2 = (i: number, p: Partial<Filter>) => setFilters(filters.map((x, k) => (k === i ? { ...x, ...p } : x)));
  function save() {
    if (!f.name.trim()) return setErr("Name is required");
    const data = { ...f, name: f.name.trim(), filters: filters.filter((x) => x.field.trim()) };
    if (seg) { updateRecord("segments", seg.id, data); onDone(seg.id); return; }
    onDone(createRecord("segments", data).id);
  }
  return (
    <div className="space-y-4">
      <PanelHead title={seg ? String(seg.name) : "New Segment"} sub="Dynamic lists built from filter DSL — feed campaigns" />
      <Section title="Segment Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="s-name"><input id="s-name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Entity" hint={f.entity === "CONTACT" ? "Leads and customers that have an email address." : undefined}><Select ariaLabel="Entity" value={f.entity} onChange={(v) => setF({ ...f, entity: v })} options={opts(SEGMENT_ENTITIES)} /></Field>
        </div>
        <p className="text-sm text-muted-foreground">All filters must match:</p>
        <datalist id={`fields-${f.entity}`}>{ENTITY_FIELDS[f.entity].map((x) => <option key={x} value={x} />)}</datalist>
        {filters.map((x, i) => (
          <div key={i} className="grid grid-cols-[1fr_7rem_1fr_2rem] items-end gap-2">
            <Field label={i === 0 ? "Field" : ""}><input aria-label={`Filter ${i + 1} field`} list={`fields-${f.entity}`} className={inputCls} placeholder="e.g. status" value={x.field} onChange={(e) => setF2(i, { field: e.target.value })} /></Field>
            <Field label={i === 0 ? "Op" : ""}><Select ariaLabel={`Filter ${i + 1} op`} value={x.op} onChange={(v) => setF2(i, { op: v })} options={opts(SEGMENT_OPS)} /></Field>
            <Field label={i === 0 ? "Value" : ""}><input aria-label={`Filter ${i + 1} value`} className={inputCls} disabled={x.op === "exists"} value={x.value} onChange={(e) => setF2(i, { value: e.target.value })} /></Field>
            <button type="button" aria-label={`Remove filter ${i + 1}`} disabled={filters.length <= 1} className={cn(btn.icon, "mb-0.5 text-muted-foreground")} onClick={() => setFilters(filters.filter((_, k) => k !== i))}><Trash2 className="!size-3.5" /></button>
          </div>
        ))}
        <button type="button" className={btn.smOutline} onClick={() => setFilters([...filters, { field: "", op: "=", value: "" }])}><Plus /> Add filter</button>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{seg ? "Save" : "Create"}</button><button type="button" className={btn.outline} onClick={() => onDone()}>Cancel</button></div>
      </Section>
      <Card><div className="space-y-2 p-5"><CardTitle>Members ({members.length})</CardTitle>
        {members.length === 0 ? <p className="text-sm text-muted-foreground">Nobody matches yet.</p> : <ul className="max-h-72 divide-y divide-border/60 overflow-y-auto text-sm">{members.slice(0, 200).map((m) => <li key={`${m.kind}${m.id}`} className="flex justify-between gap-3 py-1.5">{m.href ? <Link className="text-primary hover:underline" href={m.href}>{m.name}</Link> : m.name}<span className="truncate text-xs text-muted-foreground">{m.email || "no email"} · {m.kind}</span></li>)}</ul>}
      </div></Card>
    </div>
  );
}

/* ---------- web-to-lead forms ---------- */

export function WebForms() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/crm/web-forms");
  const forms = useCollection("web-forms");
  const [origin, setOrigin] = useState("");
  useEffect(() => { const t = setTimeout(() => setOrigin(window.location.origin), 0); return () => clearTimeout(t); }, []);
  const sel = forms.find((x) => x.id === sub);
  const close = () => router.push("/crm/web-forms");
  return (
    <div className="space-y-4">
      <PageHeader title="Web-to-Lead Forms" subtitle="Public endpoints to capture leads from your site" actions={<Link href="/crm/web-forms/new" className={btn.primary}><Plus /> New form</Link>} />
      <div className="flex"><Count shown={forms.length} total={forms.length} /></div>
      {forms.length === 0 ? <Card><div className="p-6"><Empty icon={Globe} title="No web-to-lead forms yet" text="Create a form, paste its public URL on your website, and submissions appear as leads in CRM." action={<Link href="/crm/web-forms/new" className={btn.smPrimary}><Plus /> New form</Link>} /></div></Card> : (
        <Card><DataTable rows={forms} onRowClick={(x) => router.push(`/crm/web-forms/${x.id}`)} columns={[
          { key: "n", header: "Name", cell: (x) => <span className="font-medium">{String(x.name)}</span> },
          { key: "u", header: "Public URL", cell: (x) => <code className="text-xs">/f/{x.id}</code> },
          { key: "s", header: "Submissions", className: "text-right", cell: (x) => num(x.submissions) },
          { key: "l", header: "Last submission", cell: (x) => fmtWhen(x.lastSubmissionAt) },
          { key: "a", header: "Status", cell: (x) => <Badge tone={x.active === false ? "muted" : "success"}>{x.active === false ? "Inactive" : "Active"}</Badge> },
        ]} menu={(x) => [{ label: x.active === false ? "Activate" : "Deactivate", onSelect: () => updateRecord("web-forms", x.id, { active: x.active === false }) }, { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${x.name}?`) && deleteRecord("web-forms", x.id) }]} /></Card>
      )}
      {sub === "new" && <SidePanel onClose={close}><WebFormForm onDone={(id) => router.push(id ? `/crm/web-forms/${id}` : "/crm/web-forms")} /></SidePanel>}
      {sel && <SidePanel onClose={close}><WebFormDetail key={sel.id} form={sel} origin={origin} /></SidePanel>}
    </div>
  );
}

function WebFormForm({ onDone }: { onDone: (id?: string) => void }) {
  const [f, setF] = useState({ name: "", redirectUrl: "" });
  const [err, setErr] = useState("");
  function save() {
    if (!f.name.trim()) return setErr("Name is required");
    if (f.redirectUrl && !/^https?:\/\//i.test(f.redirectUrl)) return setErr("Redirect URL must start with http:// or https://");
    onDone(createRecord("web-forms", { name: f.name.trim(), redirectUrl: f.redirectUrl.trim(), fields: WEB_FORM_FIELDS, captcha: true, active: true, submissions: 0 }).id);
  }
  return (
    <div className="space-y-4">
      <PanelHead title="New Web Form" sub="Create a public web-to-lead form" />
      <Section title="Form Details">
        <Field label="Name" htmlFor="w-name"><input id="w-name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Redirect URL (after submit)" htmlFor="w-url"><input id="w-url" type="url" placeholder="https://" className={inputCls} value={f.redirectUrl} onChange={(e) => setF({ ...f, redirectUrl: e.target.value })} /></Field>
        <p className="text-xs text-muted-foreground">Default fields will be: Name, Email, Phone, Company, Captcha.</p>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Create</button><button type="button" className={btn.outline} onClick={() => onDone()}>Cancel</button></div>
      </Section>
    </div>
  );
}

function WebFormDetail({ form: x, origin }: { form: Rec; origin: string }) {
  const leads = useCollection("leads").filter((l) => l.webFormId === x.id).reverse();
  const { node, flash } = useFlash();
  const url = `${origin}/f/${x.id}`;
  const embed = `<iframe src="${url}" width="100%" height="560" style="border:0"></iframe>`;
  const copy = (t: string, what: string) => navigator.clipboard?.writeText(t).then(() => flash(`${what} copied`), () => flash("Copy failed — select and copy manually", true));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-semibold tracking-tight">{String(x.name)}</h2><p className="text-sm text-muted-foreground">{num(x.submissions)} submission(s){x.redirectUrl ? ` · redirects to ${x.redirectUrl}` : ""}</p></div><Switch checked={x.active !== false} onChange={(v) => updateRecord("web-forms", x.id, { active: v })} label="Active" /></div>
      <Card><div className="space-y-3 p-5">
        <Field label="Public URL"><div className="flex gap-2"><input readOnly aria-label="Public URL" className={cn(inputCls, "font-mono text-xs")} value={url} /><button type="button" className={btn.smOutline} onClick={() => copy(url, "URL")}><Copy /> Copy</button><a href={`/f/${x.id}`} target="_blank" rel="noreferrer" className={btn.smOutline}><ExternalLink /> Open</a></div></Field>
        <Field label="Embed code"><div className="flex gap-2"><textarea readOnly aria-label="Embed code" rows={2} className={cn(textareaCls, "font-mono text-xs")} value={embed} /><button type="button" className={btn.smOutline} onClick={() => copy(embed, "Embed code")}><Copy /> Copy</button></div></Field>
        <p className="text-xs text-muted-foreground">Fields: {((x.fields as string[]) ?? WEB_FORM_FIELDS).join(", ")}{x.captcha !== false ? ", Captcha" : ""}. This demo keeps data in this browser, so submissions show up here only when the form is filled in on this same browser.</p>
      </div></Card>
      <Card><div className="space-y-2 p-5"><CardTitle>Submissions</CardTitle>
        {leads.length === 0 ? <p className="text-sm text-muted-foreground">No submissions yet.</p> : <ul className="divide-y divide-border/60 text-sm">{leads.map((l) => <li key={l.id} className="flex justify-between gap-3 py-2"><Link className="text-primary hover:underline" href={`/crm/leads/${l.id}`}>{leadName(l)}</Link><span className="text-xs text-muted-foreground">{String(l.email ?? "")} · {fmtWhen(l.createdAt)}</span></li>)}</ul>}
      </div></Card>
      {node}
    </div>
  );
}
