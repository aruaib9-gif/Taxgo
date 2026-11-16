"use client";

// Finance › Bank Inbox, Bank Rules, Statement Cockpit, Cheques and the Document Inbox.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Bot, Check, Download, FileText, Inbox, Lightbulb, Printer, RefreshCw, Trash2, Upload, X } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { useAccounts, useBankAccounts } from "@/lib/ledger";
import { DOC_KINDS, agentSettings, applyLine, autopilot, bookDocument, classify, createChequeBook, createDepositSlip, duplicateOf, issueCheque, recordReceivedCheque, saveAgentSettings, suggest, todayIso, unbookLine, type Action, type Suggestion } from "@/lib/banking";
import { cn } from "@/lib/utils";
import { INBOX_TYPES, sendToInbox } from "@/lib/attachments";
import { AccountPicker, Badge, Card, CardTitle, Dialog, Field, PageHeader, btn, downloadFile, inputCls, money, num, textareaCls, toExcelHTML } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { subOf } from "@/components/purchasing/kit";
import { Empty, Th, fmtDate, useFlash } from "@/components/hr/people";
import { bankLabel } from "@/components/finance/banking";

export const ACTIONS: { value: Action; label: string }[] = [
  { value: "RECEIVE_CUSTOMER", label: "Receive from customer" },
  { value: "PAY_VENDOR", label: "Pay vendor" },
  { value: "CATEGORIZE", label: "Categorize to account" },
  { value: "BANK_FEE", label: "Bank fee" },
  { value: "BANK_INTEREST", label: "Bank interest" },
];
const actionLabel = (a: unknown) => ACTIONS.find((x) => x.value === a)?.label ?? "—";

// Customer / vendor / account picker for an action (nothing for fee & interest).
function TargetPicker({ action, value, onChange }: { action: string; value: string; onChange: (v: string) => void }) {
  const customers = useCollection("customers");
  const vendors = useCollection("vendors");
  const accounts = useAccounts();
  if (action === "RECEIVE_CUSTOMER") return <Select ariaLabel="Customer" size="sm" value={value} onChange={onChange} placeholder="Pick customer" options={customers.map((c) => ({ value: c.id, label: String(c.name) }))} />;
  if (action === "PAY_VENDOR") return <Select ariaLabel="Vendor" size="sm" value={value} onChange={onChange} placeholder="Pick vendor" options={vendors.map((v) => ({ value: v.id, label: String(v.name) }))} />;
  if (action === "CATEGORIZE") return <AccountPicker accounts={accounts} value={value} onChange={onChange} placeholder="Select account" ariaLabel="Account" />;
  return null;
}

/* ---------- bank inbox ---------- */

export function BankInbox() {
  const params = useSearchParams();
  const banks = useBankAccounts();
  const all = useCollection("bank-transactions");
  useCollection("bank-rules");
  const [account, setAccount] = useState(params.get("account") ?? "");
  const [tab, setTab] = useState<"FOR_REVIEW" | "DONE" | "EXCLUDED">("FOR_REVIEW");
  const [q, setQ] = useState("");
  const [sugs, setSugs] = useState<Record<string, Suggestion | null>>({});
  const { node, flash } = useFlash();
  const bankId = account || banks[0]?.id || "";
  const lines = all.filter((t) => t.bankAccountId === bankId && !t.deleted && t.source === "IMPORT");
  const count = (s: string) => lines.filter((t) => t.inboxState === s).length;
  const shown = lines.filter((t) => t.inboxState === tab && (!q || `${t.description} ${t.reference ?? ""}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const ready = lines.filter((t) => t.inboxState === "FOR_REVIEW" && sugs[t.id] && (sugs[t.id]!.targetId || ["BANK_FEE", "BANK_INTEREST"].includes(sugs[t.id]!.action)));
  function getSuggestions() {
    const next: Record<string, Suggestion | null> = {};
    for (const t of lines.filter((x) => x.inboxState === "FOR_REVIEW")) next[t.id] = suggest(t);
    setSugs(next);
    flash(`Suggestions ready — ${Object.values(next).filter(Boolean).length} of ${Object.keys(next).length} line(s)`);
  }
  function applyAll() {
    let ok = 0, bad = 0;
    for (const t of ready) { try { applyLine(t.id, sugs[t.id]!); ok++; } catch { bad++; } }
    flash(`Bulk apply finished — ${ok} applied${bad ? `, ${bad} failed` : ""}`, bad > 0);
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Bank Inbox" subtitle="Review each statement line: match it, turn it into a payment, or categorize it — then reconcile." actions={<>
        <button type="button" className={btn.outline} onClick={getSuggestions}><Lightbulb /> Get suggestions</button>
        <button type="button" className={btn.outline} title="Suggest + auto-apply what's safe under your policy; the rest stays here for review" onClick={() => { const r = autopilot(bankId); flash(`Auto-pilot finished — ${r.applied} applied, ${r.left} left for review`); }}><Bot /> Auto-pilot</button>
        <button type="button" className={btn.primary} disabled={!ready.length} onClick={applyAll}><Check /> Apply {ready.length} suggestions</button>
      </>} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Bank Account"><Select ariaLabel="Bank Account" className="w-60" value={bankId} onChange={setAccount} options={banks.map((b) => ({ value: b.id, label: String(b.accountName) }))} /></Field>
        <div className="flex gap-1 rounded-lg bg-muted p-1">{([["FOR_REVIEW", "For review"], ["DONE", "Done"], ["EXCLUDED", "Excluded"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setTab(v)} className={cn("rounded-md px-3 py-1 text-sm", tab === v ? "bg-background font-medium shadow" : "text-muted-foreground")}>{l} <span className="text-xs text-muted-foreground">{count(v)}</span></button>)}</div>
        <input className={cn(inputCls, "max-w-xs")} placeholder="Search description / reference…" aria-label="Search description / reference" value={q} onChange={(e) => setQ(e.target.value)} />
        <Link href={`/bank/cockpit?account=${bankId}`} className="ml-auto text-sm text-primary underline">Open transaction cockpit</Link>
      </div>
      {shown.length === 0 ? <Card><div className="p-10 text-center text-sm text-muted-foreground">{tab === "FOR_REVIEW" ? <>Nothing to review — <Link className="text-primary underline" href="/bank/transactions/import">import a statement</Link> or switch account.</> : tab === "DONE" ? "Nothing booked yet." : "Nothing excluded."}</div></Card> : (
        <div className="space-y-2">{shown.map((t) => <InboxLine key={t.id} t={t} sug={sugs[t.id]} flash={flash} />)}</div>
      )}
      {node}
    </div>
  );
}

function InboxLine({ t, sug, flash }: { t: Rec; sug?: Suggestion | null; flash: (m: string, bad?: boolean) => void }) {
  const customers = useCollection("customers");
  const vendors = useCollection("vendors");
  const accounts = useAccounts();
  const amt = num(t.amount);
  const [action, setAction] = useState<string>(sug?.action ?? (amt > 0 ? "RECEIVE_CUSTOMER" : "PAY_VENDOR"));
  const [target, setTarget] = useState(sug?.targetId ?? "");
  const [remember, setRemember] = useState(false);
  const [match, setMatch] = useState(String(t.description ?? "").split(/\s+/).slice(0, 2).join(" "));
  const [auto, setAuto] = useState(false);
  const [seen, setSeen] = useState(sug);
  if (sug !== seen) { setSeen(sug); if (sug) { setAction(sug.action); setTarget(sug.targetId ?? ""); } }
  const targetName = (a: unknown, id: unknown) => (a === "RECEIVE_CUSTOMER" ? customers.find((c) => c.id === id)?.name : a === "PAY_VENDOR" ? vendors.find((v) => v.id === id)?.name : a === "CATEGORIZE" ? (() => { const x = accounts.find((y) => y.id === id); return x ? `${x.code} - ${x.name}` : ""; })() : "");
  function apply() {
    try { applyLine(t.id, { action: action as Action, targetId: target }, remember ? { name: match, match, autoApply: auto } : undefined); flash("Applied"); }
    catch (e) { flash(e instanceof Error ? e.message : "Could not apply", true); }
  }
  return (
    <Card><div className="flex flex-wrap items-start gap-4 p-4">
      <div className="min-w-48 flex-1">
        <p className="text-xs text-muted-foreground">{fmtDate(t.date)}{t.reference ? ` · ${t.reference}` : ""}</p>
        <p className="font-medium">{String(t.description)}</p>
        <p className={cn("text-lg font-semibold tabular-nums", amt < 0 ? "text-destructive" : "text-success")}>{money(amt)}</p>
      </div>
      {t.inboxState === "FOR_REVIEW" ? <div className="flex min-w-72 flex-[2] flex-col gap-2">
        <p className="text-xs">{sug ? <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-primary"><Lightbulb className="size-3" /> {sug.reason} · {Math.round(sug.confidence * 100)}%</span> : <span className="text-muted-foreground">No suggestion yet</span>}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Select ariaLabel="Action" size="sm" value={action} onChange={(v) => { setAction(v); setTarget(""); }} options={ACTIONS.filter((a) => (amt > 0 ? a.value !== "PAY_VENDOR" && a.value !== "BANK_FEE" : a.value !== "RECEIVE_CUSTOMER" && a.value !== "BANK_INTEREST"))} />
          <TargetPicker action={action} value={target} onChange={setTarget} />
        </div>
        <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember this</label>
        {remember && <div className="flex flex-wrap items-center gap-2 text-xs"><span>when description contains</span><input aria-label="Match text" className={cn(inputCls, "h-7 w-40 text-xs")} value={match} onChange={(e) => setMatch(e.target.value)} /><label className="flex items-center gap-1"><input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} /> auto-apply</label></div>}
        <div className="flex gap-2"><button type="button" className={btn.smPrimary} onClick={apply}><Check /> Apply</button><button type="button" className={btn.smOutline} onClick={() => updateRecord("bank-transactions", t.id, { inboxState: "EXCLUDED" })}><X /> Exclude</button></div>
      </div> : t.inboxState === "DONE" ? <div className="flex flex-col items-end gap-2 text-sm">
        <Badge tone="success">{actionLabel(t.appliedAction)}{targetName(t.appliedAction, t.appliedTargetId) ? ` · ${targetName(t.appliedAction, t.appliedTargetId)}` : ""}</Badge>
        <button type="button" className="text-xs text-destructive underline" onClick={() => { try { unbookLine(t.id); flash("Unbooked — the entry was reversed"); } catch (e) { flash(e instanceof Error ? e.message : "Failed", true); } }}>Unbook</button>
      </div> : <button type="button" className={btn.smOutline} onClick={() => updateRecord("bank-transactions", t.id, { inboxState: "FOR_REVIEW" })}>Restore</button>}
    </div></Card>
  );
}

/* ---------- bank rules ---------- */

export function BankRules() {
  const rules = useCollection("bank-rules");
  useCollection("bank-agent");
  const customers = useCollection("customers");
  const vendors = useCollection("vendors");
  const accounts = useAccounts();
  const [settings, setSettings] = useState(() => ({ mode: "SAFE", maxAuto: "" }));
  useEffect(() => { const t = setTimeout(() => { const s = agentSettings(); setSettings({ mode: s.mode, maxAuto: s.maxAuto == null ? "" : String(s.maxAuto) }); }, 0); return () => clearTimeout(t); }, []);
  const [open, setOpen] = useState(false);
  const blank = { name: "", match: "", direction: "ANY", action: "CATEGORIZE", targetId: "", autoApply: false };
  const [f, setF] = useState(blank);
  const [err, setErr] = useState("");
  const { node, flash } = useFlash();
  const targetName = (r: Rec) => (r.action === "RECEIVE_CUSTOMER" ? customers.find((c) => c.id === r.targetId)?.name : r.action === "PAY_VENDOR" ? vendors.find((v) => v.id === r.targetId)?.name : r.action === "CATEGORIZE" ? (() => { const a = accounts.find((x) => x.id === r.targetId); return a ? `${a.code} - ${a.name}` : ""; })() : "") || "—";
  function create() {
    if (!f.name.trim() || !f.match.trim()) return setErr("Name and match text are required");
    if (["RECEIVE_CUSTOMER", "PAY_VENDOR", "CATEGORIZE"].includes(f.action) && !f.targetId) return setErr(f.action === "CATEGORIZE" ? "Pick an account" : f.action === "PAY_VENDOR" ? "Pick vendor" : "Pick customer");
    createRecord("bank-rules", { ...f, name: f.name.trim(), match: f.match.trim(), direction: f.direction === "ANY" ? null : f.direction });
    setOpen(false); setF(blank); setErr(""); flash("Rule created");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Bank Rules" subtitle="When a statement line matches a rule, the Bank Inbox suggests (or auto-applies) the configured action." actions={<button type="button" className={btn.primary} onClick={() => setOpen(true)}>New Rule</button>} />
      <Card><div className="space-y-3 p-5">
        <CardTitle>Agent autonomy</CardTitle>
        <p className="text-sm text-muted-foreground">Manual verification: the agent only suggests — every journal entry needs your approval in the Bank Inbox. Safe: matches auto-apply at high confidence; money is only posted via your auto-apply rules or ≥95% confidence.</p>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Mode"><Select ariaLabel="Mode" className="w-72" value={settings.mode} onChange={(v) => setSettings({ ...settings, mode: v })} options={[{ value: "MANUAL", label: "Manual verification (suggest only)" }, { value: "SAFE", label: "Safe autonomy (recommended)" }]} /></Field>
          <Field label="Never auto-apply above"><input aria-label="Never auto-apply above" type="number" min="0" placeholder="No limit" className={cn(inputCls, "w-40")} value={settings.maxAuto} onChange={(e) => setSettings({ ...settings, maxAuto: e.target.value })} /></Field>
          <button type="button" className={btn.outline} onClick={() => { saveAgentSettings({ mode: settings.mode, maxAuto: settings.maxAuto === "" ? null : num(settings.maxAuto) }); flash("Agent settings saved"); }}>Save</button>
        </div>
      </div></Card>
      {rules.length === 0 ? <Card><div className="p-8 text-center text-sm text-muted-foreground">No rules yet. Create one here, or tick “Remember this” when applying a line in the Bank Inbox.</div></Card> : (
        <Card><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Name</Th><Th>Description contains</Th><Th>Direction</Th><Th>Action</Th><Th>Target</Th><Th>Auto-apply</Th><Th /></tr></thead><tbody>{rules.map((r) => (
          <tr key={r.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{String(r.name)}</td><td className="px-2 py-2 font-mono text-xs">{String(r.match)}</td><td className="px-2 py-2">{r.direction === "IN" ? "Money in" : r.direction === "OUT" ? "Money out" : "Any"}</td><td className="px-2 py-2">{actionLabel(r.action)}</td><td className="px-2 py-2">{String(targetName(r))}</td>
            <td className="px-2 py-2"><input type="checkbox" aria-label={`Auto-apply ${r.name}`} checked={Boolean(r.autoApply)} onChange={(e) => updateRecord("bank-rules", r.id, { autoApply: e.target.checked })} /></td>
            <td className="px-2 py-2 text-right"><button type="button" aria-label={`Delete ${r.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => { deleteRecord("bank-rules", r.id); flash("Rule deleted"); }}><Trash2 className="size-4" /></button></td></tr>
        ))}</tbody></table></Card>
      )}
      <Dialog open={open} onClose={() => setOpen(false)} title="New bank rule" description="Lines whose description contains the match text get this action suggested — or applied automatically.">
        <div className="grid gap-3">
          <Field label="Name *"><input aria-label="Name" className={inputCls} placeholder="e.g. AWS subscription" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Description contains *"><input aria-label="Description contains" className={inputCls} placeholder="e.g. AMAZON WEB" value={f.match} onChange={(e) => setF({ ...f, match: e.target.value })} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Direction"><Select ariaLabel="Direction" value={f.direction} onChange={(v) => setF({ ...f, direction: v })} options={[{ value: "ANY", label: "Any" }, { value: "IN", label: "Money in" }, { value: "OUT", label: "Money out" }]} /></Field>
            <Field label="Action"><Select ariaLabel="Rule action" value={f.action} onChange={(v) => setF({ ...f, action: v, targetId: "" })} options={ACTIONS} /></Field>
          </div>
          {["RECEIVE_CUSTOMER", "PAY_VENDOR", "CATEGORIZE"].includes(f.action) && <Field label={f.action === "CATEGORIZE" ? "Account" : f.action === "PAY_VENDOR" ? "Vendor" : "Customer"}><TargetPicker action={f.action} value={f.targetId} onChange={(v) => setF({ ...f, targetId: v })} /></Field>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.autoApply} onChange={(e) => setF({ ...f, autoApply: e.target.checked })} /> Auto-apply without review (use with care)</label>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setOpen(false)}>Cancel</button><button type="button" className={btn.primary} onClick={create}>Create rule</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- statement cockpit ---------- */

export function Cockpit() {
  const params = useSearchParams();
  const banks = useBankAccounts();
  const txns = useCollection("bank-transactions");
  const imports = useCollection("bank-imports");
  const journals = useCollection("journal-entries");
  const recs = useCollection("reconciliations");
  const accounts = useAccounts();
  const [account, setAccount] = useState(params.get("account") ?? "");
  const [scope, setScope] = useState<"PERIOD" | "ONE">("PERIOD");
  const [batch, setBatch] = useState("");
  const [from, setFrom] = useState(`${todayIso().slice(0, 4)}-01-01`);
  const [to, setTo] = useState(todayIso());
  const [tick, setTick] = useState(0);
  const lines = txns.filter((t) => !t.deleted && t.source === "IMPORT" && (!account || t.bankAccountId === account) && (scope === "ONE" ? t.importId === batch : String(t.date) >= from && String(t.date) <= to));
  const done = lines.filter((t) => t.inboxState === "DONE"), review = lines.filter((t) => t.inboxState === "FOR_REVIEW"), excluded = lines.filter((t) => t.inboxState === "EXCLUDED");
  const pct = lines.length ? Math.round(((done.length + excluded.length) / lines.length) * 100) : 0;
  // P&L and tax produced by the booked lines' entries.
  const jes = journals.filter((j) => done.some((t) => t.journalId === j.id));
  const pnl = new Map<string, number>();
  let taxIn = 0, taxOut = 0;
  for (const j of jes) for (const l of (j.lines as Rec[]) ?? []) {
    const a = accounts.find((x) => x.id === l.accountId);
    if (!a) continue;
    if (a.type === "REVENUE" || a.type === "EXPENSE") pnl.set(a.id, (pnl.get(a.id) ?? 0) + num(l.credit) - num(l.debit));
    if (a.code === "1500") taxIn += num(l.debit) - num(l.credit);
    if (a.code === "2100") taxOut += num(l.credit) - num(l.debit);
  }
  const pnlRows = [...pnl].map(([id, v]) => ({ a: accounts.find((x) => x.id === id)!, v }));
  const net = pnlRows.reduce((s, r) => s + r.v, 0);
  const myRecs = recs.filter((r) => !account || r.bankAccountId === account);
  function exportWorkbook() {
    const rows = lines.map((t) => [String(t.date), String(t.description), num(t.amount), String(t.reference ?? ""), String(t.inboxState), actionLabel(t.appliedAction)]);
    downloadFile(`statement-cockpit-${todayIso()}.xls`, toExcelHTML(["Date", "Description", "Amount", "Reference", "State", "Booked as"], rows), "application/vnd.ms-excel");
  }
  return (
    <div className="space-y-4" key={tick}>
      <PageHeader title="Statement Cockpit" subtitle="Everything a statement produced — completion, documents, P&L contribution, tax and reconciliation — in one place." actions={<>
        <button type="button" className={btn.outline} onClick={() => setTick((x) => x + 1)}><RefreshCw /> Refresh</button>
        <Link href="/bank/transactions/import" className={btn.primary}><Upload /> Upload statements</Link>
        <button type="button" className={btn.outline} disabled={!lines.length} onClick={exportWorkbook}><Download /> Workbook</button>
      </>} />
      <Card><div className="flex flex-wrap items-end gap-3 p-4">
        <div className="flex gap-1 rounded-lg bg-muted p-1">{([["PERIOD", "Period"], ["ONE", "One statement"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setScope(v)} className={cn("rounded-md px-3 py-1 text-sm", scope === v ? "bg-background font-medium shadow" : "text-muted-foreground")}>{l}</button>)}</div>
        {scope === "PERIOD" ? <><Field label="From"><DateInput ariaLabel="From" value={from} onChange={setFrom} /></Field><Field label="To"><DateInput ariaLabel="To" value={to} onChange={setTo} /></Field></> : <Field label="Statement"><Select ariaLabel="Statement" className="w-64" value={batch} onChange={setBatch} placeholder="Pick an imported statement" options={imports.filter((i) => !i.cash && i.status !== "UNDONE").map((i) => ({ value: i.id, label: `${i.fileName} (${fmtDate(i.importedAt)})` }))} /></Field>}
        <Field label="Account"><Select ariaLabel="Account" className="w-56" value={account} onChange={setAccount} options={[{ value: "", label: "All accounts" }, ...banks.map((b) => ({ value: b.id, label: String(b.accountName) }))]} /></Field>
      </div></Card>
      {lines.length === 0 ? <Card><div className="p-10 text-center text-sm text-muted-foreground">No statement lines in this scope yet — import a statement first.</div></Card> : <>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card><div className="space-y-3 p-5">
            <div className="flex items-center justify-between"><CardTitle>Completion</CardTitle><span className="text-2xl font-bold">{pct}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm"><div><p className="text-xl font-semibold">{done.length}</p><p className="text-xs text-muted-foreground">Done</p></div><div><p className="text-xl font-semibold">{review.length}</p><p className="text-xs text-muted-foreground">For review</p></div><div><p className="text-xl font-semibold">{excluded.length}</p><p className="text-xs text-muted-foreground">Excluded</p></div></div>
            {review.length > 0 && <Link href={`/bank/inbox${account ? `?account=${account}` : ""}`} className={btn.smPrimary}><Inbox /> Open Bank Inbox to finish</Link>}
          </div></Card>
          <Card><div className="space-y-2 p-5">
            <CardTitle>P&L contribution</CardTitle>
            {pnlRows.length === 0 ? <p className="text-sm text-muted-foreground">No income or expense booked from these lines yet.</p> : <table className="w-full text-sm"><tbody>{pnlRows.map((r) => <tr key={r.a.id} className="border-b border-border"><td className="py-1.5">{String(r.a.code)} · {String(r.a.name)}</td><td className={cn("py-1.5 text-right tabular-nums", r.v < 0 && "text-destructive")}>{money(r.v)}</td></tr>)}<tr><td className="py-1.5 font-semibold">Net</td><td className={cn("py-1.5 text-right font-semibold tabular-nums", net < 0 && "text-destructive")}>{money(net)}</td></tr></tbody></table>}
          </div></Card>
          <Card><div className="space-y-2 p-5">
            <CardTitle>Tax</CardTitle>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Input tax (recoverable)</span><span className="tabular-nums">{money(taxIn)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Output tax</span><span className="tabular-nums">{money(taxOut)}</span></div>
            <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold"><span>Net</span><span className="tabular-nums">{money(taxOut - taxIn)}</span></div>
          </div></Card>
          <Card><div className="space-y-2 p-5">
            <div className="flex items-center justify-between"><CardTitle>Reconciliation</CardTitle><Link href="/bank/reconciliations" className="text-xs text-primary underline">Open reconciliations</Link></div>
            {myRecs.length === 0 ? <p className="text-sm text-muted-foreground">No reconciliation started for these accounts yet. <Link href="/bank/reconciliations/new" className="text-primary underline">Create here</Link></p> : myRecs.slice(-5).map((r) => <div key={r.id} className="flex justify-between text-sm"><Link href={`/bank/reconciliations/${r.id}`} className="font-mono text-xs text-primary">{String(r.recNumber)}</Link><span>{fmtDate(r.periodEnd)}</span><Badge tone={r.status === "COMPLETED" ? "success" : r.status === "VOIDED" ? "muted" : "warning"}>{String(r.status).replace("_", " ").toLowerCase()}</Badge></div>)}
          </div></Card>
        </div>
        <Card><div className="space-y-2 p-5">
          <CardTitle>Excluded (kept off the books)</CardTitle>
          {excluded.length === 0 ? <p className="text-sm text-muted-foreground">Nothing excluded in this scope.</p> : excluded.map((t) => <div key={t.id} className="flex justify-between text-sm"><span>{fmtDate(t.date)} · {String(t.description)}</span><span className="tabular-nums">{money(num(t.amount))}</span></div>)}
        </div></Card>
        <Card><div className="flex flex-wrap gap-2 p-5"><CardTitle className="w-full">Reports</CardTitle>{[["General ledger", "/reports/general-ledger"], ["Trial balance", "/reports/trial-balance"], ["Full P&L", "/reports/income-statement"], ["Balance sheet", "/reports/balance-sheet"], ["Cash flow", "/reports/cash-flow"], ["Cash book", "/reports/cash-book"], ["Reconciliation report", "/bank/reconciliations"]].map(([l, h]) => <Link key={h} href={h} className={btn.smOutline}>{l}</Link>)}</div></Card>
      </>}
    </div>
  );
}

/* ---------- cheques ---------- */

const CHEQUE_TONE: Record<string, "muted" | "success" | "info" | "warning" | "destructive"> = { ISSUED: "info", CLEARED: "success", VOID: "muted", BOUNCED: "destructive", RECEIVED: "warning", PDC: "warning", DEPOSITED: "info" };

function printCheque(c: Rec, bank: string) {
  const w = window.open("", "_blank", "width=820,height=420");
  if (!w) return;
  w.document.write(`<html><head><title>Cheque ${c.number}</title><style>body{font-family:Georgia,serif;padding:24px}.chq{border:2px solid #333;border-radius:8px;padding:24px;height:260px;position:relative}.r{position:absolute;right:24px}.l{border-bottom:1px solid #333;display:inline-block;min-width:420px}</style></head><body><div class="chq"><div><b>${bank}</b><span class="r">No. ${c.number}</span></div><p class="r" style="top:56px">Date: ${c.date}</p><p style="margin-top:56px">Pay <span class="l">${String(c.payee)}</span></p><p>The sum of <span class="l">${money(num(c.amount))}</span></p><p>Memo: ${c.memo ?? ""}</p><p class="r" style="bottom:24px">______________________<br/>Authorised signatory</p></div><script>window.print()</script></body></html>`);
  w.document.close();
}

export function Cheques() {
  const banks = useBankAccounts();
  const books = useCollection("cheque-books");
  const cheques = useCollection("cheques");
  const slips = useCollection("deposit-slips");
  const [book, setBook] = useState({ bankAccountId: "", prefix: "", start: "", end: "" });
  const [iss, setIss] = useState({ bookId: "", payee: "", amount: "", memo: "" });
  const [rcv, setRcv] = useState({ from: "", number: "", amount: "", chequeDate: "", bankAccountId: "" });
  const [slip, setSlip] = useState({ open: false, bankAccountId: "", date: todayIso(), cash: "", chequeIds: [] as string[] });
  const { node, flash } = useFlash();
  const run = (fn: () => void, ok: string) => { try { fn(); flash(ok); } catch (e) { flash(e instanceof Error ? e.message : "Failed", true); } };
  const bankName = (id: unknown) => bankLabel(banks.find((b) => b.id === id));
  const received = cheques.filter((c) => c.direction === "RECEIVED");
  const awaiting = received.filter((c) => c.status === "PDC" && String(c.date) > todayIso());
  const matured = received.filter((c) => (c.status === "PDC" || c.status === "RECEIVED") && String(c.date) <= todayIso());
  const undeposited = received.filter((c) => (c.status === "RECEIVED" || c.status === "PDC") && String(c.date) <= todayIso());
  const bankOpts = banks.map((b) => ({ value: b.id, label: `${b.bankName} — ${b.accountName}` }));
  return (
    <div className="space-y-4">
      <PageHeader title="Cheques" subtitle="Cheque books, issue, register & printing" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><div className="space-y-3 p-5">
          <CardTitle>New cheque book</CardTitle>
          <Field label="Bank account"><Select ariaLabel="Cheque book bank" value={book.bankAccountId} onChange={(v) => setBook({ ...book, bankAccountId: v })} placeholder="Select bank…" options={bankOpts} /></Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="Prefix"><input aria-label="Prefix" className={inputCls} placeholder="(optional)" value={book.prefix} onChange={(e) => setBook({ ...book, prefix: e.target.value })} /></Field>
            <Field label="Start no."><input aria-label="Start no." type="number" className={inputCls} value={book.start} onChange={(e) => setBook({ ...book, start: e.target.value })} /></Field>
            <Field label="End no."><input aria-label="End no." type="number" className={inputCls} value={book.end} onChange={(e) => setBook({ ...book, end: e.target.value })} /></Field>
          </div>
          <button type="button" className={btn.smPrimary} onClick={() => { if (!book.bankAccountId || !book.start || !book.end) return flash("Bank, start & end required", true); run(() => { createChequeBook({ bankAccountId: book.bankAccountId, prefix: book.prefix, start: num(book.start), end: num(book.end) }); setBook({ bankAccountId: "", prefix: "", start: "", end: "" }); }, "Cheque book created"); }}>Create book</button>
          {books.length > 0 && <div className="space-y-1 pt-1 text-xs text-muted-foreground">{books.map((b) => <p key={b.id}>{bankName(b.bankAccountId)} · {String(b.prefix ?? "")}{String(b.start)}–{String(b.end)} · next {n2(b)}</p>)}</div>}
        </div></Card>
        <Card><div className="space-y-3 p-5">
          <CardTitle>Issue cheque</CardTitle>
          <Field label="Cheque book"><Select ariaLabel="Cheque book" value={iss.bookId} onChange={(v) => setIss({ ...iss, bookId: v })} placeholder="Select book…" options={books.filter((b) => b.status !== "EXHAUSTED").map((b) => ({ value: b.id, label: `${bankName(b.bankAccountId)} · ${b.prefix ?? ""}${b.start}–${b.end} (next ${n2(b)})` }))} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Payee"><input aria-label="Payee" className={inputCls} value={iss.payee} onChange={(e) => setIss({ ...iss, payee: e.target.value })} /></Field>
            <Field label="Amount"><input aria-label="Cheque amount" type="number" className={inputCls} value={iss.amount} onChange={(e) => setIss({ ...iss, amount: e.target.value })} /></Field>
          </div>
          <Field label="Memo"><input aria-label="Memo" className={inputCls} placeholder="(optional)" value={iss.memo} onChange={(e) => setIss({ ...iss, memo: e.target.value })} /></Field>
          <button type="button" className={btn.smPrimary} onClick={() => { if (!iss.bookId || !iss.payee || !iss.amount) return flash("Book, payee & amount required", true); run(() => { const c = issueCheque({ bookId: iss.bookId, payee: iss.payee, amount: num(iss.amount), memo: iss.memo }); setIss({ bookId: iss.bookId, payee: "", amount: "", memo: "" }); flash(`Cheque ${c.number} issued`); }, "Cheque issued"); }}>Issue cheque</button>
        </div></Card>
        <Card><div className="space-y-3 p-5">
          <CardTitle>Record received cheque</CardTitle>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Received from"><input aria-label="Received from" className={inputCls} placeholder="Customer / payer" value={rcv.from} onChange={(e) => setRcv({ ...rcv, from: e.target.value })} /></Field>
            <Field label="Cheque no."><input aria-label="Cheque no." className={inputCls} value={rcv.number} onChange={(e) => setRcv({ ...rcv, number: e.target.value })} /></Field>
            <Field label="Amount"><input aria-label="Received amount" type="number" className={inputCls} value={rcv.amount} onChange={(e) => setRcv({ ...rcv, amount: e.target.value })} /></Field>
            <Field label="Cheque date"><DateInput ariaLabel="Cheque date" value={rcv.chequeDate} onChange={(v) => setRcv({ ...rcv, chequeDate: v })} /></Field>
          </div>
          <Field label="Deposit into"><Select ariaLabel="Deposit into" value={rcv.bankAccountId} onChange={(v) => setRcv({ ...rcv, bankAccountId: v })} placeholder="Bank account…" options={bankOpts} /></Field>
          <button type="button" className={btn.smPrimary} onClick={() => { if (!rcv.from || !rcv.number || !rcv.amount || !rcv.chequeDate || !rcv.bankAccountId) return flash("Payer, cheque no., amount, date & deposit bank required", true); run(() => { const c = recordReceivedCheque({ ...rcv, amount: num(rcv.amount) }); setRcv({ from: "", number: "", amount: "", chequeDate: "", bankAccountId: rcv.bankAccountId }); if (c.status === "PDC") flash("Received cheque recorded. It appears in the PDC register until it matures and clears."); }, "Received cheque recorded"); }}>Record cheque</button>
          <p className="text-xs text-muted-foreground">A future-dated cheque waits in the PDC register until maturity. Pair clearing with recording the customer receipt.</p>
        </div></Card>
        <Card><div className="space-y-3 p-5">
          <CardTitle>Post-dated cheques (PDC)</CardTitle>
          <p className="text-xs font-medium uppercase text-muted-foreground">Awaiting maturity</p>
          {awaiting.length === 0 ? <p className="text-sm">None.</p> : awaiting.map((c) => <div key={c.id} className="flex justify-between text-sm"><span>{String(c.payee)} · #{String(c.number)}</span><span>{fmtDate(c.date)} · {money(num(c.amount))}</span></div>)}
          <p className="text-xs font-medium uppercase text-muted-foreground">Matured — action needed</p>
          {matured.length === 0 ? <p className="text-sm">None.</p> : matured.map((c) => <div key={c.id} className="flex items-center justify-between gap-2 text-sm"><span>{String(c.payee)} · #{String(c.number)} · {money(num(c.amount))}</span><span className="flex gap-2"><button type="button" className="text-xs text-primary underline" onClick={() => updateRecord("cheques", c.id, { status: "DEPOSITED" })}>Mark deposited</button><button type="button" className="text-xs text-destructive underline" onClick={() => updateRecord("cheques", c.id, { status: "BOUNCED" })}>Bounced</button></span></div>)}
        </div></Card>
      </div>
      <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between"><CardTitle>Deposit slips</CardTitle><button type="button" className={btn.smOutline} onClick={() => setSlip({ ...slip, open: !slip.open })}>New slip</button></div>
        {slip.open && <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Deposit into"><Select ariaLabel="Slip bank" value={slip.bankAccountId} onChange={(v) => setSlip({ ...slip, bankAccountId: v })} placeholder="Bank…" options={bankOpts} /></Field>
            <Field label="Date"><DateInput ariaLabel="Slip date" value={slip.date} onChange={(v) => setSlip({ ...slip, date: v })} /></Field>
            <Field label="Cash amount"><input aria-label="Cash amount" type="number" className={inputCls} placeholder="0.00" value={slip.cash} onChange={(e) => setSlip({ ...slip, cash: e.target.value })} /></Field>
          </div>
          <p className="text-sm font-medium">Received cheques to deposit</p>
          {undeposited.length === 0 ? <p className="text-sm text-muted-foreground">No undeposited received cheques.</p> : undeposited.map((c) => <label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={slip.chequeIds.includes(c.id)} onChange={(e) => setSlip({ ...slip, chequeIds: e.target.checked ? [...slip.chequeIds, c.id] : slip.chequeIds.filter((x) => x !== c.id) })} />{String(c.payee)} · #{String(c.number)} · {money(num(c.amount))}</label>)}
          <button type="button" className={btn.smPrimary} onClick={() => { if (!slip.bankAccountId || (!num(slip.cash) && !slip.chequeIds.length)) return flash("Pick a bank and add cash and/or cheques", true); run(() => { createDepositSlip({ bankAccountId: slip.bankAccountId, date: slip.date, cash: num(slip.cash), chequeIds: slip.chequeIds }); setSlip({ open: false, bankAccountId: "", date: todayIso(), cash: "", chequeIds: [] }); }, "Deposit slip created. Included cheques are now deposited."); }}>Create slip</button>
        </div>}
        {slips.length === 0 ? <p className="text-sm text-muted-foreground">No deposit slips yet.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>No.</Th><Th>Bank</Th><Th>Date</Th><Th>Cheques</Th><Th className="text-right">Total</Th></tr></thead><tbody>{slips.map((s) => <tr key={s.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(s.number)}</td><td className="px-2 py-2">{bankName(s.bankAccountId)}</td><td className="px-2 py-2">{fmtDate(s.date)}</td><td className="px-2 py-2">{((s.chequeIds as string[]) ?? []).length}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(s.total))}</td></tr>)}</tbody></table>}
      </div></Card>
      <Card><div className="space-y-3 p-5">
        <CardTitle>Register</CardTitle>
        {cheques.length === 0 ? <p className="text-sm text-muted-foreground">No cheques yet.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>No.</Th><Th>Payee</Th><Th className="text-right">Amount</Th><Th>Date</Th><Th>Status</Th><Th /></tr></thead><tbody>{[...cheques].reverse().map((c) => (
          <tr key={c.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(c.number)}</td><td className="px-2 py-2">{String(c.payee)} <span className="text-xs text-muted-foreground">{c.direction === "RECEIVED" ? "(received)" : ""}</span></td><td className="px-2 py-2 text-right tabular-nums">{money(num(c.amount))}</td><td className="px-2 py-2">{fmtDate(c.date)}</td><td className="px-2 py-2"><Badge tone={CHEQUE_TONE[String(c.status)] ?? "muted"}>{String(c.status).toLowerCase()}</Badge></td>
            <td className="px-2 py-2 text-right"><span className="inline-flex gap-2">{c.direction === "ISSUED" && c.status === "ISSUED" && <><button type="button" aria-label={`Print ${c.number}`} className="text-muted-foreground hover:text-foreground" onClick={() => printCheque(c, bankName(c.bankAccountId))}><Printer className="size-4" /></button><button type="button" className="text-xs text-primary underline" onClick={() => updateRecord("cheques", c.id, { status: "CLEARED" })}>Clear</button><button type="button" className="text-xs text-muted-foreground underline" onClick={() => updateRecord("cheques", c.id, { status: "VOID" })}>Void</button></>}{c.direction === "RECEIVED" && c.status === "DEPOSITED" && <><button type="button" className="text-xs text-primary underline" onClick={() => updateRecord("cheques", c.id, { status: "CLEARED" })}>Clear</button><button type="button" className="text-xs text-destructive underline" onClick={() => updateRecord("cheques", c.id, { status: "BOUNCED" })}>Bounced</button></>}</span></td></tr>
        ))}</tbody></table>}
      </div></Card>
      {node}
    </div>
  );
}
const n2 = (b: Rec) => `${b.prefix ?? ""}${String(b.next).padStart(String(b.end).length, "0")}`;

/* ---------- document inbox ---------- */

export function Documents() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/documents");
  const docs = useCollection("documents");
  const settings = useCollection("doc-agent");
  const [tab, setTab] = useState("FOR_REVIEW");
  const [q, setQ] = useState("");
  const { node, flash } = useFlash();
  if (sub) return <DocumentDetail id={sub} />;
  const s = (settings[0]?.value as { mode?: string; cap?: string }) ?? {};
  const mode = s.mode ?? "MANUAL";
  const saveSettings = (v: { mode: string; cap: string }) => (settings[0] ? updateRecord("doc-agent", settings[0].id, { value: v }) : createRecord("doc-agent", { value: v }));
  const count = (st: string) => docs.filter((d) => st === "ALL" || d.state === st).length;
  const shown = docs.filter((d) => (tab === "ALL" || d.state === tab) && (!q || String(d.fileName).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => String(b.uploadedAt).localeCompare(String(a.uploadedAt)));
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    for (const fl of Array.from(files)) await sendToInbox(fl);
    flash("Each file is extracted and classified; review the proposals below when they're ready.");
  }
  function classifyPending() {
    let n = 0;
    for (const d of readCollection("documents").filter((x) => x.state === "FOR_REVIEW")) { const c = classify(d); updateRecord("documents", d.id, { kind: d.kind || c.kind, party: d.party || c.party, amount: d.amount || c.amount || null, confidence: c.confidence, classified: true }); n++; }
    flash(`Classification done — ${n} document(s)`);
  }
  function autoBook() {
    if (mode !== "SAFE") return flash("Auto-pilot is off — switch Agent autonomy to Safe", true);
    let n = 0;
    for (const d of readCollection("documents").filter((x) => x.state === "FOR_REVIEW")) {
      const known = d.kind === "EXPENSE" || (d.party && (d.kind === "BILL" ? readCollection("vendors") : readCollection("customers")).some((p) => p.name === d.party));
      if (num(d.confidence) >= 0.95 && known && num(d.amount) > 0 && (!s.cap || num(d.amount) <= num(s.cap)) && !duplicateOf(d) && d.kind !== "OTHER") { try { bookDocument(d.id); n++; } catch { /* stays for review */ } }
    }
    flash(`Auto-pilot finished — ${n} booked`);
  }
  const badge = (d: Rec) => d.state === "BOOKED" ? <Badge tone="success">Booked</Badge> : d.state === "EXCLUDED" ? <Badge>Excluded</Badge> : duplicateOf(d) ? <Badge tone="destructive">Possible duplicate</Badge> : !d.kind ? <Badge>Not classified</Badge> : ["BILL", "INVOICE"].includes(String(d.kind)) && !d.party ? <Badge tone="warning">Needs party</Badge> : <Badge tone="info">Ready</Badge>;
  return (
    <div className="space-y-4">
      <PageHeader title="Document Inbox" subtitle="Upload bills, invoices, receipts, photos or handwritten notes — review what the AI proposes, then book them into your accounts." actions={<>
        <button type="button" className={btn.outline} onClick={classifyPending}><Lightbulb /> Classify pending</button>
        <button type="button" className={btn.outline} title="Books only ≥95% known-party documents under your policy" onClick={autoBook}><Bot /> Auto-pilot</button>
        <label className={cn(btn.primary, "cursor-pointer")}><Upload /> Upload documents<input type="file" multiple className="sr-only" aria-label="Upload documents" accept={INBOX_TYPES} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} /></label>
      </>} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-lg bg-muted p-1">{([["FOR_REVIEW", "For review"], ["BOOKED", "Booked"], ["EXCLUDED", "Excluded"], ["ALL", "All"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => setTab(v)} className={cn("rounded-md px-3 py-1 text-sm", tab === v ? "bg-background font-medium shadow" : "text-muted-foreground")}>{l} ({count(v)})</button>)}</div>
        <input className={cn(inputCls, "max-w-xs")} placeholder="Search filename…" aria-label="Search filename" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="ml-auto flex items-end gap-2">
          <Field label="Agent autonomy"><Select ariaLabel="Agent autonomy" className="w-64" value={mode} onChange={(v) => saveSettings({ mode: v, cap: s.cap ?? "" })} options={[{ value: "MANUAL", label: "Manual — I review everything" }, { value: "SAFE", label: "Safe — auto-book obvious ones" }]} /></Field>
          {mode === "SAFE" && <Field label="Never auto-book above"><input aria-label="Never auto-book above" type="number" placeholder="No cap" className={cn(inputCls, "w-32")} value={s.cap ?? ""} onChange={(e) => saveSettings({ mode, cap: e.target.value })} /></Field>}
        </div>
      </div>
      {shown.length === 0 ? <Card><div className="p-10 text-center text-sm text-muted-foreground">{tab === "FOR_REVIEW" ? "Nothing to review — upload documents to get started." : "Nothing here."}</div></Card> : (
        <Card><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>File</Th><Th>Kind</Th><Th>Party</Th><Th>Date</Th><Th className="text-right">Amount</Th><Th>Status</Th></tr></thead><tbody>{shown.map((d) => (
          <tr key={d.id} className="cursor-pointer border-b border-border hover:bg-muted/50" onClick={() => router.push(`/documents/${d.id}`)}><td className="px-2 py-2"><span className="inline-flex items-center gap-2 font-medium"><FileText className="size-4 text-muted-foreground" />{String(d.fileName)}</span></td><td className="px-2 py-2">{DOC_KINDS.find((k) => k.value === d.kind)?.label ?? "—"}</td><td className="px-2 py-2">{String(d.party || "—")}</td><td className="px-2 py-2">{fmtDate(d.date)}</td><td className="px-2 py-2 text-right tabular-nums">{d.amount ? money(num(d.amount)) : "—"}</td><td className="px-2 py-2">{badge(d)}</td></tr>
        ))}</tbody></table></Card>
      )}
      {node}
    </div>
  );
}

function DocumentDetail({ id }: { id: string }) {
  const docs = useCollection("documents");
  const vendors = useCollection("vendors");
  const customers = useCollection("customers");
  const accounts = useAccounts();
  const { node, flash } = useFlash();
  const d = docs.find((x) => x.id === id);
  if (!d) return docs.length ? <Empty icon={FileText} title="Document not found" /> : null;
  const set = (p: Record<string, unknown>) => updateRecord("documents", d.id, p);
  const dup = duplicateOf(d);
  const editable = d.state === "FOR_REVIEW";
  const parties = d.kind === "BILL" ? vendors : d.kind === "INVOICE" ? customers : [...vendors];
  return (
    <div className="space-y-4">
      <Link href="/documents" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Document Inbox</Link>
      <PageHeader title={String(d.fileName)} subtitle="Review the proposal — party, dates, lines, tax — then book. Everything it creates links back here." actions={<>
        {editable && <button type="button" className={btn.primary} onClick={() => { try { bookDocument(d.id); flash("Booked into accounts"); } catch (e) { flash(e instanceof Error ? e.message : "Failed", true); } }}><Check /> Book into accounts</button>}
        {editable && <button type="button" className={btn.outline} onClick={() => set({ state: "EXCLUDED" })}><X /> Exclude</button>}
        {d.state === "EXCLUDED" && <button type="button" className={btn.outline} onClick={() => set({ state: "FOR_REVIEW" })}>Restore</button>}
      </>} />
      {dup && <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">Possible duplicate of <Link className="underline" href={`/documents/${dup.id}`}>{String(dup.fileName)}</Link> ({String(dup.state).toLowerCase().replace("_", " ")}).</div>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><div className="p-5"><CardTitle className="mb-1">File preview</CardTitle><p className="mb-3 text-xs text-muted-foreground">The uploaded document.</p>
          {d.dataUrl && String(d.mime).startsWith("image/") ? <img src={String(d.dataUrl)} alt={String(d.fileName)} className="max-h-[32rem] w-full rounded-md border border-border object-contain" /> : d.dataUrl && d.mime === "application/pdf" ? <iframe title="PDF preview" src={String(d.dataUrl)} className="h-[32rem] w-full rounded-md border border-border" /> : <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border text-sm text-muted-foreground"><FileText className="size-8" />{String(d.fileName)} · {Math.round(num(d.size) / 1024)} KB<span className="text-xs">{d.dataUrl ? "" : "Preview isn't stored for files over 400 KB."}</span></div>}
        </div></Card>
        <Card><div className="space-y-3 p-5">
          <CardTitle>Proposal</CardTitle>
          {d.state === "BOOKED" && <div className="rounded-md bg-success/10 p-3 text-sm text-success">Booked {fmtDate(d.bookedAt)} · {d.billId ? <Link className="underline" href={`/ap/bills/${d.billId}`}>open bill</Link> : d.invoiceId ? <Link className="underline" href={`/ar/invoices/${d.invoiceId}`}>open invoice</Link> : d.journalId ? <Link className="underline" href={`/financial/journal-entries/${d.journalId}`}>open journal entry</Link> : "kept on file"}</div>}
          <fieldset disabled={!editable} className="grid gap-3 sm:grid-cols-2">
            <Field label="Document kind" className="sm:col-span-2"><Select ariaLabel="Document kind" disabled={!editable} value={String(d.kind ?? "")} onChange={(v) => set({ kind: v, party: "" })} placeholder="Not classified" options={DOC_KINDS} /></Field>
            {d.kind !== "OTHER" && <>
              <Field label={d.kind === "INVOICE" ? "Customer" : d.kind === "EXPENSE" ? "Paid to (optional)" : "Vendor"} className="sm:col-span-2">{d.kind === "EXPENSE" ? <input aria-label="Party" className={inputCls} value={String(d.party ?? "")} onChange={(e) => set({ party: e.target.value })} /> : <Select ariaLabel="Party" disabled={!editable} value={String(d.party ?? "")} onChange={(v) => set({ party: v })} placeholder={d.kind === "INVOICE" ? "Select customer..." : "Select vendor..."} options={parties.map((p) => ({ value: String(p.name), label: String(p.name) }))} />}</Field>
              <Field label="Document no."><input aria-label="Document no." className={inputCls} value={String(d.number ?? "")} onChange={(e) => set({ number: e.target.value })} /></Field>
              <Field label="Date"><DateInput ariaLabel="Document date" value={String(d.date ?? "")} onChange={(v) => set({ date: v })} /></Field>
              {d.kind !== "EXPENSE" && <Field label="Due date"><DateInput ariaLabel="Due date" value={String(d.dueDate ?? "")} onChange={(v) => set({ dueDate: v })} /></Field>}
              <Field label="Total amount"><input aria-label="Total amount" type="number" step="0.01" className={inputCls} value={String(d.amount ?? "")} onChange={(e) => set({ amount: e.target.value === "" ? null : num(e.target.value) })} /></Field>
              <Field label="Tax included"><input aria-label="Tax included" type="number" step="0.01" className={inputCls} value={String(d.tax ?? "")} onChange={(e) => set({ tax: e.target.value === "" ? null : num(e.target.value) })} /></Field>
              {d.kind !== "INVOICE" && <Field label="Expense account" className="sm:col-span-2"><AccountPicker accounts={accounts} types={["EXPENSE", "ASSET"]} value={String(d.accountId ?? "")} onChange={(v) => set({ accountId: v })} placeholder={d.kind === "EXPENSE" ? "6000 - Miscellaneous Expenses" : "5300 - Office Supplies"} ariaLabel="Expense account" /></Field>}
              {d.kind === "EXPENSE" && <Field label="Paid from" className="sm:col-span-2"><AccountPicker accounts={accounts.filter((a) => ["1000", "1010", "1100", "1110"].includes(String(a.code)) || a.type === "ASSET")} types={["ASSET"]} value={String(d.paidFrom ?? "")} onChange={(v) => set({ paidFrom: v })} placeholder="1100 - Bank Account" ariaLabel="Paid from" /></Field>}
              <Field label="Description" className="sm:col-span-2"><textarea aria-label="Description" rows={2} className={textareaCls} value={String(d.description ?? "")} onChange={(e) => set({ description: e.target.value })} /></Field>
            </>}
          </fieldset>
          <p className="text-xs text-muted-foreground">Classification reads the file name; check every field before booking.</p>
        </div></Card>
      </div>
      {node}
    </div>
  );
}
