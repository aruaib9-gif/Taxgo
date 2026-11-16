"use client";

// Analytics › AI pages. No model is connected: the assistants answer from the books through the
// rules in lib/analyst.ts, and the automations (categorizer, collections, forecast, anomalies,
// reconciliation matching, budget forecast) are deterministic scoring over live data.

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle, ArrowRight, Bot, Calculator, Check, Copy, MessageSquare, Package, Paperclip, Plus, RefreshCw, Search, Send, Shield, ShoppingCart, Sparkles, Target, Trash2, TrendingUp, Users, Wallet, X } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { createJournal, findAccountByCode, useAccounts } from "@/lib/ledger";
import { EXPENSE_WORDS, answer, type Answer, type Persona } from "@/lib/analyst";
import { budgetActuals } from "@/lib/finance";
import { matchCandidates, matchTxn } from "@/lib/banking";
import { balanceAsOf, daysAgo, daysBetween, lineNet, openItems, todayIso } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { INBOX_TYPES, sendToInbox } from "@/lib/attachments";
import { AccountPicker, Badge, Card, CardTitle, Dialog, btn, inputCls, money, num, textareaCls } from "@/components/accounting/kit";
import { Select } from "@/components/accounting/pickers";
import { ReportHeader, SimpleTable, useBooks } from "@/components/analytics/kit";
import { useFlash } from "@/components/hr/people";

const logAction = (agent: string, what: string) => createRecord("ai-actions", { agent, what, at: new Date().toISOString() });
const addDays = (iso: string, k: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };

/* ---------- agents hub ---------- */

const ASSISTANTS = [
  { key: "cfo", name: "Virtual CFO", href: "/ai/cfo", desc: "Strategic finance: cash runway, customer concentration, KPIs, board-ready answers.", icon: TrendingUp },
  { key: "accountant", name: "Virtual Accountant", href: "/ai/accountant", desc: "Day-to-day bookkeeping: journal entries, transaction explanations, GL lookups.", icon: Calculator },
  { key: "treasurer", name: "Virtual Treasurer", href: "/ai/treasurer", desc: "Bank positions, payment timing, FX exposure, cash runway.", icon: Wallet },
  { key: "compliance", name: "Virtual Compliance Officer", href: "/ai/compliance", desc: "India statutory tracking: GST, TDS, PF, ESI deadlines and non-compliant employee detection.", icon: Shield },
  { key: "sales", name: "Virtual Sales Manager", href: "/ai/sales", desc: "Pipeline health, stuck deals, rep coaching, lead prioritisation, win-loss analysis.", icon: Target },
  { key: "hr", name: "Virtual HR Manager", href: "/ai/hr", desc: "Headcount, leave, onboarding, performance cycles, document expiry, attrition risk.", icon: Users },
  { key: "inventory", name: "Virtual Inventory Manager", href: "/ai/inventory", desc: "Stock levels, reorder timing, dead stock, ABC analysis, lot/serial expiry.", icon: Package },
  { key: "procurement", name: "Virtual Procurement Officer", href: "/ai/procurement", desc: "Vendor scorecards, PO status, RFQ comparison, spend concentration.", icon: ShoppingCart },
  { key: "assistant", name: "General Assistant", href: "/ai/assistant", desc: "Full-access generalist. Use this when you're not sure which expert to ask.", icon: MessageSquare, enabled: true },
];
const AUTOMATIONS = [
  { key: "categorizer", name: "Auto-Categorizer", href: "/ai/categorizer", desc: "Suggests the right GL account & tax category for uncategorized bills, and learns your choices.", icon: Sparkles, enabled: true },
  { key: "collections", name: "Collections", href: "/ai/collections", desc: "Prioritises overdue invoices, drafts reminder emails, and suggests payment plans.", icon: MessageSquare, enabled: true },
  { key: "forecast", name: "Cash-Flow Forecast", href: "/ai/cash-flow-forecast", desc: "90-day daily cash projection from AR/AP patterns, with low-runway alerts.", icon: TrendingUp, enabled: true },
  { key: "reconciliation", name: "Smart Reconciliation", href: "/ai/reconciliation", desc: "Matches unreconciled bank transactions to journal entries with confidence scores.", icon: RefreshCw },
  { key: "budget", name: "Budget Forecast", href: "/ai/forecast", desc: "Projects spend per account from history and flags over-budget risk early.", icon: Target },
  { key: "anomalies", name: "Anomaly Detection", href: "/ai/anomalies", desc: "Surfaces duplicate invoices, unmatched bank lines, and unusual transactions.", icon: AlertTriangle },
];

export function AgentsHub() {
  const actions = useCollection("ai-actions");
  const since = daysAgo(30);
  const count = (k: string) => actions.filter((a) => a.agent === k && String(a.at) >= since).length;
  const card = (a: (typeof ASSISTANTS)[number] | (typeof AUTOMATIONS)[number], showCount: boolean) => (
    <Link key={a.key} href={a.href}><Card className="h-full transition-colors hover:border-primary/40"><div className="flex h-full flex-col p-5">
      <div className="mb-2 flex items-center justify-between"><span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><a.icon className="size-4" /></span>{"enabled" in a && a.enabled && <Badge tone="success">Enabled</Badge>}</div>
      <p className="font-semibold">{a.name}</p><p className="mt-1 flex-1 text-sm text-muted-foreground">{a.desc}</p>
      <div className="mt-3 flex items-center justify-between text-xs"><span className="flex items-center gap-1 font-medium text-primary">Open <ArrowRight className="size-3" /></span>{showCount && <span className="text-muted-foreground">{count(a.key)} actions / 30d</span>}</div>
    </div></Card></Link>
  );
  return (
    <div className="space-y-6">
      <ReportHeader title="AI Command Center" subtitle="Every AI feature in one place — chat assistants, accounting automations, and insights." />
      <section><h2 className="font-semibold">Chat Assistants</h2><p className="mb-3 text-sm text-muted-foreground">Specialised personas that work alongside your team. Pick the right expert for the question.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{ASSISTANTS.map((a) => card(a, a.key === "assistant"))}</div></section>
      <section><h2 className="font-semibold">AI Automations</h2><p className="mb-3 text-sm text-muted-foreground">Background agents that categorize, collect, forecast, reconcile, and watch for anomalies.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{AUTOMATIONS.map((a) => card(a, true))}</div></section>
      <section><h2 className="font-semibold">AI Insights</h2><p className="mb-3 text-sm text-muted-foreground">Ask your books anything in plain English.</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{card({ key: "query", name: "Natural-Language Query", href: "/ai/query", desc: "Ask questions about your books in plain English — answered with live data.", icon: Search }, false)}</div></section>
      <p className="text-xs text-muted-foreground">Answers and suggestions are computed from your books by built-in rules; nothing is posted without your approval.</p>
    </div>
  );
}

/* ---------- chat ---------- */

const PERSONAS: Record<string, { persona: Persona; title: string; crumb: string; desc: string; icon: typeof Bot; prompts: string[]; placeholder: string }> = {
  assistant: { persona: "assistant", title: "Accountant Assistant", crumb: "AI Assistant", icon: MessageSquare, placeholder: "Ask about your financial data...", desc: "Ask questions about your financial data. I can look up balances, explain transactions, search journal entries, and help you create draft journal entries.", prompts: ["What's my current cash balance?", "Show me overdue receivables", "Explain journal entry #JE-001", "What are my top expenses this month?"] },
  cfo: { persona: "cfo", title: "Virtual CFO", crumb: "Cfo", icon: TrendingUp, placeholder: "Ask the Virtual CFO...", desc: "Strategic, KPI-driven analysis. Ask about cash position, AR aging, customer concentration, runway, margins, and what to do next.", prompts: ["Who are my worst paying customers / bad debtors?", "Who are my best clients by revenue?", "What is my cash runway at current burn?", "Show me a P&L summary for this month vs last month"] },
  accountant: { persona: "accountant", title: "Virtual Accountant", crumb: "Accountant", icon: Calculator, placeholder: "Ask the Virtual Accountant...", desc: "Day-to-day bookkeeping. Ask me to draft journal entries, explain transactions, look up invoices and bills, or walk you through how to record a business event.", prompts: ["Draft a journal entry for $500 office supplies expense paid in cash", "Explain the last journal entry I posted", "How do I record a customer refund?", "Show me the chart of accounts under EXPENSE"] },
  treasurer: { persona: "treasurer", title: "Virtual Treasurer", crumb: "Treasurer", icon: Wallet, placeholder: "Ask the Virtual Treasurer...", desc: "Bank balances, payment timing, FX exposure, cash runway. Ask about liquidity and treasury operations.", prompts: ["What's my total cash position across all bank accounts?", "Which bills are due in the next 7 days?", "What's my cash runway at current burn rate?", "Unreconciled bank transactions by account"] },
  compliance: { persona: "compliance", title: "Virtual Compliance Officer", crumb: "Compliance", icon: Shield, placeholder: "Ask the Virtual Compliance Officer...", desc: "India statutory tracking: GST, TDS, PF, ESI, PT. Filing deadlines + non-compliant employee detection.", prompts: ["What's due to be filed this month?", "Which employees are missing statutory IDs (PAN/UAN/ESI)?", "Summarize the last 3 months of GST returns filed", "Statutory deduction totals for this month"] },
  sales: { persona: "sales", title: "Virtual Sales Manager", crumb: "Sales", icon: Target, placeholder: "Ask the Virtual Sales Manager...", desc: "Pipeline health, deal coaching, rep performance, lead prioritization. Ask anything about your revenue motion.", prompts: ["What's my weighted pipeline this quarter?", "Which deals are stuck (no activity in 14 days)?", "Who are my top 5 leads by score?", "What's our quote-to-close conversion rate?"] },
  hr: { persona: "hr", title: "Virtual HR Manager", crumb: "Human Resources", icon: Users, placeholder: "Ask the Virtual HR Manager...", desc: "Headcount, leave, performance, onboarding, document expiry. Ask anything about your people operations.", prompts: ["What's our current headcount by org unit?", "Who is on leave next week?", "Any employee documents expiring in the next 60 days?", "How are open recruitment requisitions doing?"] },
  inventory: { persona: "inventory", title: "Virtual Inventory Manager", crumb: "Inventory", icon: Package, placeholder: "Ask the Virtual Inventory Manager...", desc: "Stock levels, reorder timing, dead stock, ABC analysis, lot/serial expiry. Ask about warehouse health.", prompts: ["What's my total stock value by warehouse?", "Which SKUs need reordering now?", "Show me products with no movement in 90 days", "Run an ABC analysis on my inventory"] },
  procurement: { persona: "procurement", title: "Virtual Procurement Officer", crumb: "Procurement", icon: ShoppingCart, placeholder: "Ask the Virtual Procurement Officer...", desc: "Vendor performance, PO status, RFQ comparisons, spend concentration. Ask about your supply chain.", prompts: ["Vendor scorecard: who's most reliable?", "What POs are pending approval?", "Top 5 vendors by spend this quarter", "Which vendors had late deliveries this month?"] },
};

type Msg = { role: "user" | "assistant"; text: string; answer?: Answer; at: string };

function Bold({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*]+\*\*)/).map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>))}</>;
}
export function AnswerView({ a }: { a: Answer }) {
  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed"><Bold text={a.text} /></p>
      {a.table && <div className="overflow-x-auto rounded-md border border-border bg-background"><table className="w-full text-xs"><thead><tr className="border-b border-border">{a.table.headers.map((h) => <th key={h} className="px-2 py-1.5 text-left font-medium text-muted-foreground">{h}</th>)}</tr></thead><tbody>{a.table.rows.map((r, i) => <tr key={i} className="border-b border-border/60 last:border-0">{r.map((c, j) => <td key={j} className="px-2 py-1.5">{String(c)}</td>)}</tr>)}</tbody></table></div>}
      {a.links && <div className="flex flex-wrap gap-2">{a.links.map((l) => <Link key={l.href} href={l.href} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">{l.label} <ArrowRight className="size-3" /></Link>)}</div>}
    </div>
  );
}

export function Chat() {
  const key = usePathname().split("/").pop() ?? "assistant";
  const P = PERSONAS[key] ?? PERSONAS.assistant;
  const chats = useCollection("ai-chats").filter((c) => c.persona === P.persona).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  useBooks();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const active = chats.find((c) => c.id === activeId);
  const msgs = (active?.messages as Msg[]) ?? [];
  function ask(q: string) {
    const question = q.trim();
    if (!question) return;
    const a = answer(question, P.persona);
    const now = new Date().toISOString();
    const add: Msg[] = [{ role: "user", text: question, at: now }, { role: "assistant", text: a.text, answer: a, at: now }];
    if (active) updateRecord("ai-chats", active.id, { messages: [...msgs, ...add], updatedAt: now });
    else setActiveId(createRecord("ai-chats", { persona: P.persona, title: question.slice(0, 60), messages: add, updatedAt: now }).id);
    logAction(P.persona, question);
    setText("");
  }
  // There is no file-reading model here, so attachments go to the Document Inbox for classification and review.
  async function attach(files: File[]) {
    if (!files.length) return;
    const docs = await Promise.all(files.map((f) => sendToInbox(f)));
    const one = docs.length === 1;
    const a: Answer = {
      text: `Added ${one ? `**${files[0].name}**` : `**${docs.length} files**`} to the Document Inbox and classified ${one ? "it" : "them"}. Review the proposed booking there before anything is posted.`,
      links: [one ? { label: "Open in Document Inbox", href: `/documents/${docs[0].id}` } : { label: "Open Document Inbox", href: "/documents" }],
    };
    const now = new Date().toISOString();
    const add: Msg[] = [{ role: "user", text: `📎 ${files.map((f) => f.name).join(", ")}`, at: now }, { role: "assistant", text: a.text, answer: a, at: now }];
    if (active) updateRecord("ai-chats", active.id, { messages: [...msgs, ...add], updatedAt: now });
    else setActiveId(createRecord("ai-chats", { persona: P.persona, title: `Attachment: ${files[0].name}`.slice(0, 60), messages: add, updatedAt: now }).id);
  }
  return (
    <div className="-m-2 flex h-[calc(100vh-9rem)] min-h-[32rem] overflow-hidden">
      <aside className="hidden w-52 shrink-0 flex-col border-r border-border pr-2 md:flex">
        <button type="button" className={cn(btn.outline, "w-full")} onClick={() => setActiveId(null)}><Plus /> New chat</button>
        <div className="mt-3 flex-1 space-y-1 overflow-y-auto border-t border-border pt-3">{chats.length === 0 ? <p className="text-center text-xs text-muted-foreground">No chats yet</p> : chats.map((c) => <div key={c.id} className={cn("group flex items-center rounded-md px-2 py-1.5 text-sm", c.id === activeId ? "bg-accent" : "hover:bg-accent/60")}><button type="button" className="flex-1 truncate text-left" onClick={() => setActiveId(c.id)}>{String(c.title)}</button><button type="button" aria-label="Delete chat" className="hidden text-muted-foreground hover:text-destructive group-hover:block" onClick={() => { deleteRecord("ai-chats", c.id); if (activeId === c.id) setActiveId(null); }}><Trash2 className="size-3.5" /></button></div>)}</div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {msgs.length === 0 ? <div className="mx-auto flex h-full max-w-2xl flex-col items-center justify-center text-center">
            <P.icon className="size-10 text-muted-foreground/60" /><h2 className="mt-3 text-xl font-semibold">{P.title}</h2><p className="mt-2 text-muted-foreground">{P.desc}</p>
            <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">{P.prompts.map((p) => <button key={p} type="button" onClick={() => ask(p)} className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm hover:bg-accent">{p}</button>)}</div>
          </div> : <div className="mx-auto max-w-3xl space-y-4">{msgs.map((m, i) => m.role === "user" ? <div key={i} className="flex justify-end"><div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">{m.text}</div></div> : <div key={i} className="flex gap-2"><span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><P.icon className="size-3.5" /></span><div className="min-w-0 flex-1 rounded-2xl border border-border bg-card px-4 py-3">{m.answer ? <AnswerView a={m.answer} /> : m.text}</div></div>)}</div>}
        </div>
        <form className="flex items-center gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
          <label className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" title="Attach a receipt, invoice, bill or statement">
            <Paperclip className="size-4" />
            <input type="file" multiple aria-label="Attach" className="sr-only" accept={INBOX_TYPES} onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ""; void attach(f); }} />
          </label>
          <input aria-label="Message" className={cn(inputCls, "h-10 flex-1 rounded-full")} placeholder={P.placeholder} value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" aria-label="Send" className={cn(btn.primary, "size-10 rounded-full p-0")} disabled={!text.trim()}><Send /></button>
        </form>
      </section>
    </div>
  );
}

/* ---------- NL query ---------- */

export function NLQuery() {
  useBooks();
  const [q, setQ] = useState("");
  const [res, setRes] = useState<{ q: string; a: Answer }[]>([]);
  return (
    <div className="space-y-4">
      <ReportHeader title="AI Natural Language Query" subtitle="Ask questions about your financial data in plain English" />
      <Card><form className="flex gap-2 p-5" onSubmit={(e) => { e.preventDefault(); if (!q.trim()) return; setRes([{ q, a: answer(q, "query") }, ...res]); logAction("query", q); setQ(""); }}>
        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input aria-label="Ask anything about your data" className={cn(inputCls, "pl-9")} placeholder="Ask anything about your data" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <button type="submit" className={btn.primary}>Ask</button>
      </form></Card>
      {res.length === 0 ? <p className="text-center text-sm text-muted-foreground">Try questions like “What was total revenue last month?” or “Show me top 10 customers by outstanding balance”</p> : res.map((r, i) => <Card key={i}><div className="space-y-2 p-5"><p className="text-xs font-medium text-muted-foreground">{r.q}</p><AnswerView a={r.a} /></div></Card>)}
    </div>
  );
}

/* ---------- auto-categorizer ---------- */

type Pending = { bill: Rec; index: number; line: Rec; suggestion: string; why: string };
function suggestAccount(bill: Rec, line: Rec) {
  const mem = readCollection("categorizer-memory").find((x) => x.vendor === bill.vendor);
  if (mem) return { id: String(mem.accountId), why: `You filed ${bill.vendor} here before` };
  const text = `${line.description} ${bill.vendor}`.toLowerCase();
  const hit = EXPENSE_WORDS.find(([re]) => re.test(text));
  const acc = hit ? findAccountByCode(hit[1]) : undefined;
  return acc ? { id: acc.id, why: `“${text.match(hit![0])?.[0]}” in the description` } : { id: "", why: "No match yet" };
}
function pendingLines(): Pending[] {
  return readCollection("bills").filter((b) => b.status !== "DRAFT" && b.status !== "CANCELLED" && !b.grnId).flatMap((b) => ((b.lines as Rec[]) ?? []).map((l, i) => ({ l, i })).filter(({ l }) => !l.productId && !l.accountId && !l.categorized).map(({ l, i }) => { const s = suggestAccount(b, l); return { bill: b, index: i, line: l, suggestion: s.id, why: s.why }; }));
}
// Bills saved without an account post to Office Supplies (5300); categorizing reclassifies the line.
function categorize(p: Pending, accountId: string) {
  const def = findAccountByCode("5300")!;
  const amt = Math.round(lineNet(p.line) * 1000) / 1000;
  if (accountId !== def.id && amt > 0) createJournal({ date: todayIso(), description: `Reclassify ${p.bill.number} line ${p.index + 1} — ${p.line.description}`, status: "POSTED", source: "Auto-Categorizer", lines: [{ accountId, debit: amt, credit: 0 }, { accountId: def.id, debit: 0, credit: amt }] });
  updateRecord("bills", p.bill.id, { lines: ((p.bill.lines as Rec[]) ?? []).map((l, i) => (i === p.index ? { ...l, accountId, categorized: true } : l)) });
  const mem = readCollection("categorizer-memory").find((x) => x.vendor === p.bill.vendor);
  if (mem) updateRecord("categorizer-memory", mem.id, { accountId }); else createRecord("categorizer-memory", { vendor: p.bill.vendor, accountId });
  logAction("categorizer", `${p.bill.number} → ${accountId}`);
}

export function Categorizer() {
  const ready = useBooks(["categorizer-memory"]);
  const accounts = useAccounts();
  const [pick, setPick] = useState<Record<string, string>>({});
  const { node, flash } = useFlash();
  const list = ready ? pendingLines() : [];
  const keyOf = (p: Pending) => `${p.bill.id}:${p.index}`;
  const suggested = list.filter((p) => p.suggestion);
  return (
    <div className="space-y-4">
      <ReportHeader title="Auto-Categorizer" subtitle="AI-powered expense categorization" actions={<button type="button" className={btn.primary} disabled={!suggested.length} onClick={() => { suggested.forEach((p) => categorize(p, pick[keyOf(p)] || p.suggestion)); flash(`Categorized ${suggested.length} line(s)`); }}><Sparkles /> Auto-Run All</button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold">{list.length}</p></div></Card>
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Suggested</p><p className="text-2xl font-bold">{suggested.length}</p></div></Card>
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Status</p><p className="text-2xl font-bold">Ready</p></div></Card>
      </div>
      <Card><div className="p-5"><CardTitle className="mb-3">Uncategorized Bills</CardTitle>
        {list.length === 0 ? <p className="py-6 text-center text-muted-foreground">All bills are categorized!</p> : <SimpleTable headers={["Bill", "Vendor", "Line", "Amount", "Suggested account", "Why", ""]} right={[3]} rows={list.map((p) => [String(p.bill.number), String(p.bill.vendor), String(p.line.description), money(lineNet(p.line)), <div key="a" className="w-60"><AccountPicker accounts={accounts} types={["EXPENSE", "ASSET"]} value={pick[keyOf(p)] ?? p.suggestion} onChange={(v) => setPick({ ...pick, [keyOf(p)]: v })} ariaLabel={`Account for ${p.bill.number} line ${p.index + 1}`} /></div>, <span key="w" className="text-xs text-muted-foreground">{p.why}</span>, <button key="b" type="button" className={btn.smPrimary} disabled={!(pick[keyOf(p)] ?? p.suggestion)} onClick={() => { categorize(p, pick[keyOf(p)] ?? p.suggestion); flash("Categorized — the line was reclassified"); }}><Check /> Apply</button>])} />}
        <p className="mt-3 text-xs text-muted-foreground">Bill lines saved without a product or account post to 5300 Office Supplies; applying reclassifies them and remembers the vendor’s account for next time.</p>
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- collections ---------- */

const priority = (days: number, amt: number) => (days > 60 || amt >= 10000 ? "Critical" : days > 30 || amt >= 5000 ? "High" : days > 7 ? "Medium" : "Low");
const PRIO_TONE: Record<string, "destructive" | "warning" | "info" | "muted"> = { Critical: "destructive", High: "warning", Medium: "info", Low: "muted" };

export function Collections() {
  const ready = useBooks(["collection-emails"]);
  const emails = useCollection("collection-emails");
  const customers = useCollection("customers");
  const [tick, setTick] = useState(0);
  const [draft, setDraft] = useState<{ item: ReturnType<typeof queue>[number]; text: string } | null>(null);
  const [plan, setPlan] = useState<ReturnType<typeof queue>[number] | null>(null);
  const { node, flash } = useFlash();
  function queue() { const t = todayIso(); return openItems(t).filter((x) => x.kind === "AR" && x.dueDate < t).map((x) => { const days = daysBetween(x.dueDate, t); return { ...x, days, prio: priority(days, x.amount), sent: emails.filter((e) => e.invoiceId === x.id).length }; }).sort((a, b) => b.days * b.amount - a.days * a.amount); }
  const q = ready ? queue() : [];
  void tick;
  const month = todayIso().slice(0, 7);
  const write = (x: (typeof q)[number]) => `Subject: Payment reminder — ${x.number} (${money(x.amount)} overdue)\n\nDear ${x.party},\n\nOur records show invoice ${x.number} for ${money(x.amount)} was due on ${x.dueDate} and is now ${x.days} day(s) overdue.${x.sent ? ` This is reminder #${x.sent + 1}.` : ""}\n\nPlease arrange payment at your earliest convenience, or reply to agree a payment plan if that would help.\n\nThank you,\nAccounts Receivable`;
  return (
    <div className="space-y-4">
      <ReportHeader title="Collections Agent" subtitle="Monitor overdue invoices and manage collections" actions={<button type="button" className={btn.outline} onClick={() => { setTick(tick + 1); flash("Queue refreshed"); }}><RefreshCw /> Refresh Queue</button>} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Total Overdue</p><p className="text-2xl font-bold">{q.length}</p></div></Card>
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Outstanding Amount</p><p className="text-2xl font-bold">{money(q.reduce((s, x) => s + x.amount, 0))}</p></div></Card>
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Critical/High</p><p className="text-2xl font-bold"><span className="text-destructive">{q.filter((x) => x.prio === "Critical").length}</span><span className="text-warning">{q.filter((x) => x.prio === "High").length}</span></p></div></Card>
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Emails Sent (Month)</p><p className="text-2xl font-bold">{emails.filter((e) => String(e.at).startsWith(month)).length}</p></div></Card>
      </div>
      <Card><div className="p-5"><CardTitle className="mb-3">Collection Queue</CardTitle>
        {q.length === 0 ? <p className="py-6 text-center text-muted-foreground">No overdue invoices. Great job!</p> : <SimpleTable headers={["Priority", "Customer", "Invoice", "Due", "Days overdue", "Outstanding", "Reminders", ""]} right={[4, 5, 6]} rows={q.map((x) => [<Badge key="p" tone={PRIO_TONE[x.prio]}>{x.prio}</Badge>, x.party, x.number, x.dueDate, x.days, money(x.amount), x.sent, <span key="a" className="flex gap-2"><button type="button" className={btn.smOutline} onClick={() => setDraft({ item: x, text: write(x) })}>Draft email</button><button type="button" className={btn.smOutline} onClick={() => setPlan(x)}>Payment plan</button></span>])} />}
      </div></Card>
      <Dialog open={!!draft} onClose={() => setDraft(null)} title="Reminder email" description={draft ? `To: ${String(customers.find((c) => c.name === draft.item.party)?.email ?? "no email on file")}` : ""} className="max-w-2xl">
        {draft && <><textarea aria-label="Email" rows={12} className={textareaCls} value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} />
          <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => { navigator.clipboard?.writeText(draft.text); flash("Copied"); }}><Copy /> Copy</button>
            <a className={btn.outline} href={`mailto:${String(customers.find((c) => c.name === draft.item.party)?.email ?? "")}?subject=${encodeURIComponent(draft.text.split("\n")[0].replace("Subject: ", ""))}&body=${encodeURIComponent(draft.text.split("\n").slice(2).join("\n"))}`}>Open in mail app</a>
            <button type="button" className={btn.primary} onClick={() => { createRecord("collection-emails", { invoiceId: draft.item.id, number: draft.item.number, customer: draft.item.party, at: new Date().toISOString() }); logAction("collections", `Reminder ${draft.item.number}`); setDraft(null); flash("Marked as sent"); }}><Send /> Mark as sent</button></div></>}
      </Dialog>
      <Dialog open={!!plan} onClose={() => setPlan(null)} title="Suggested payment plan" description={plan ? `${plan.party} · ${plan.number} · ${money(plan.amount)}` : ""}>
        {plan && <SimpleTable headers={["Instalment", "Date", "Amount"]} right={[2]} rows={[0, 1, 2].map((i) => [i + 1, addDays(todayIso(), 7 + i * 30), money(i < 2 ? Math.floor((plan.amount / 3) * 100) / 100 : plan.amount - 2 * Math.floor((plan.amount / 3) * 100) / 100)])} />}
        <p className="text-xs text-muted-foreground">Three monthly instalments starting next week — paste them into the reminder if the customer asks for time.</p>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- cash-flow forecast ---------- */

type Day = { date: string; inflow: number; outflow: number; balance: number };
function forecast(): { days: Day[]; start: number; floor: number } {
  const today = todayIso();
  const bal = balanceAsOf();
  const start = readCollection("accounts").filter((a) => String(a.code) >= "1000" && String(a.code) <= "1110").reduce((s, a) => s + (bal.get(a.id) ?? 0), 0);
  const flows = new Map<string, { i: number; o: number }>();
  const add = (d: string, i: number, o: number) => { const f = flows.get(d) ?? { i: 0, o: 0 }; f.i += i; f.o += o; flows.set(d, f); };
  for (const x of openItems(today)) {
    // Overdue items are assumed to land over the next fortnight; receivables at 80% likelihood.
    const when = x.dueDate < today ? addDays(today, 7 + (x.number.length % 7)) : x.dueDate;
    if (x.kind === "AR") add(when, x.amount * (x.dueDate < today ? 0.8 : 0.95), 0); else add(when, 0, x.amount);
  }
  const runs = readCollection("payroll-runs").filter((r) => ["POSTED", "PAID"].includes(String(r.status)));
  const payroll = runs.length ? runs.reduce((s, r) => s + num(r.totalNet ?? r.netTotal), 0) / runs.length : 0;
  const days: Day[] = [];
  let b = start;
  for (let k = 0; k < 90; k++) {
    const d = addDays(today, k);
    const f = flows.get(d) ?? { i: 0, o: 0 };
    const nextDay = addDays(d, 1);
    if (payroll && nextDay.slice(8) === "01") f.o += payroll; // month-end payroll
    b += f.i - f.o;
    days.push({ date: d, inflow: f.i, outflow: f.o, balance: Math.round(b * 100) / 100 });
  }
  return { days, start, floor: Math.min(...days.map((x) => x.balance)) };
}

function ForecastChart({ days }: { days: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 900, H = 260, P = { l: 64, r: 16, t: 16, b: 28 };
  const vals = days.map((d) => d.balance);
  const lo = Math.min(0, ...vals), hi = Math.max(1, ...vals);
  const x = (i: number) => P.l + (i / (days.length - 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - lo) / (hi - lo || 1)) * (H - P.t - P.b);
  const path = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.balance).toFixed(1)}`).join("");
  const ticks = [lo, (lo + hi) / 2, hi];
  const h = hover == null ? null : days[hover];
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full" role="img" aria-label="Projected cash balance over the next 90 days" onMouseLeave={() => setHover(null)} onMouseMove={(e) => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); const px = ((e.clientX - r.left) / r.width) * W; setHover(Math.max(0, Math.min(days.length - 1, Math.round(((px - P.l) / (W - P.l - P.r)) * (days.length - 1))))); }}>
        {ticks.map((t) => <g key={t}><line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeWidth={1} /><text x={P.l - 8} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">{money(t).replace(/\.\d+$/, "")}</text></g>)}
        {lo < 0 && <line x1={P.l} x2={W - P.r} y1={y(0)} y2={y(0)} className="stroke-destructive" strokeDasharray="4 4" strokeWidth={1} />}
        {[0, 30, 60, 89].map((i) => <text key={i} x={x(i)} y={H - 8} textAnchor="middle" className="fill-muted-foreground text-[11px]">{days[i]?.date.slice(5)}</text>)}
        <path d={path} fill="none" className="stroke-primary" strokeWidth={2} strokeLinejoin="round" />
        {h && <><line x1={x(hover!)} x2={x(hover!)} y1={P.t} y2={H - P.b} className="stroke-muted-foreground" strokeWidth={1} /><circle cx={x(hover!)} cy={y(h.balance)} r={4} className="fill-primary stroke-card" strokeWidth={2} /></>}
      </svg>
      {h && <div className="pointer-events-none absolute top-2 rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md" style={{ left: `min(calc(${(x(hover!) / W) * 100}% + 12px), calc(100% - 11rem))` }}><p className="font-medium">{h.date}</p><p>Balance <span className="font-semibold tabular-nums">{money(h.balance)}</span></p>{h.inflow > 0 && <p className="text-muted-foreground">In {money(h.inflow)}</p>}{h.outflow > 0 && <p className="text-muted-foreground">Out {money(h.outflow)}</p>}</div>}
    </div>
  );
}

export function CashFlowForecast() {
  const ready = useBooks(["payroll-runs"]);
  const [f, setF] = useState<ReturnType<typeof forecast> | null>(null);
  const weeks = f ? Array.from({ length: 13 }, (_, w) => { const slice = f.days.slice(w * 7, w * 7 + 7); return slice.length ? [`${slice[0].date} → ${slice[slice.length - 1].date}`, money(slice.reduce((s, d) => s + d.inflow, 0)), money(slice.reduce((s, d) => s + d.outflow, 0)), money(slice[slice.length - 1].balance)] : null; }).filter(Boolean) as string[][] : [];
  const firstNeg = f?.days.find((d) => d.balance < 0);
  return (
    <div className="space-y-4">
      <ReportHeader title="Cash Flow Forecaster" subtitle="90-day cash position projection" actions={<button type="button" className={btn.primary} disabled={!ready} onClick={() => { setF(forecast()); logAction("forecast", "Generated forecast"); }}><TrendingUp /> Generate Forecast</button>} />
      {!f ? <Card><div className="p-10 text-center text-sm text-muted-foreground">No forecast available. Click &quot;Generate Forecast&quot; to create one.</div></Card> : <>
        <div className="grid gap-3 sm:grid-cols-4">
          <Card><div className="p-4"><p className="text-sm text-muted-foreground">Cash today</p><p className="text-2xl font-bold tabular-nums">{money(f.start)}</p></div></Card>
          <Card><div className="p-4"><p className="text-sm text-muted-foreground">In 90 days</p><p className="text-2xl font-bold tabular-nums">{money(f.days[89].balance)}</p></div></Card>
          <Card><div className="p-4"><p className="text-sm text-muted-foreground">Lowest point</p><p className={cn("text-2xl font-bold tabular-nums", f.floor < 0 && "text-destructive")}>{money(f.floor)}</p></div></Card>
          <Card><div className="p-4"><p className="text-sm text-muted-foreground">Expected in / out</p><p className="text-lg font-bold tabular-nums">{money(f.days.reduce((s, d) => s + d.inflow, 0))} / {money(f.days.reduce((s, d) => s + d.outflow, 0))}</p></div></Card>
        </div>
        {firstNeg && <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertTriangle className="size-4" /> Low-runway alert: cash is projected to go negative on {firstNeg.date}.</div>}
        <Card><div className="p-5"><CardTitle className="mb-1">Projected cash balance</CardTitle><p className="mb-3 text-xs text-muted-foreground">Open receivables at their due dates (overdue ones over the next two weeks, at 80%), open bills at their due dates, and average payroll at each month-end.</p><ForecastChart days={f.days} /></div></Card>
        <Card><div className="p-5"><CardTitle className="mb-3">Weekly view</CardTitle><SimpleTable headers={["Week", "Inflows", "Outflows", "Closing balance"]} right={[1, 2, 3]} rows={weeks} /></div></Card>
      </>}
    </div>
  );
}

/* ---------- anomalies ---------- */

type Anomaly = { id: string; severity: "High" | "Medium" | "Low"; type: string; text: string; href?: string };
function detect(): Anomaly[] {
  const out: Anomaly[] = [];
  const bills = readCollection("bills").filter((b) => b.status !== "CANCELLED");
  bills.forEach((b, i) => bills.slice(i + 1).forEach((c) => { if (b.vendor === c.vendor && Math.abs(num(b.total) - num(c.total)) < 0.005 && (Math.abs(daysBetween(String(b.date), String(c.date))) <= 7 || (b.billNo && b.billNo === c.billNo))) out.push({ id: `dupbill-${b.id}-${c.id}`, severity: "High", type: "Possible duplicate bill", text: `${b.number} and ${c.number} from ${b.vendor} are both ${money(num(b.total))}${b.billNo && b.billNo === c.billNo ? ` with the same vendor invoice no. ${b.billNo}` : " within a week"}.`, href: `/ap/bills/${c.id}` }); }));
  const inv = readCollection("invoices").filter((x) => x.status !== "CANCELLED");
  inv.forEach((a, i) => inv.slice(i + 1).forEach((c) => { if (a.customer === c.customer && Math.abs(num(a.total) - num(c.total)) < 0.005 && a.date === c.date) out.push({ id: `dupinv-${a.id}-${c.id}`, severity: "Medium", type: "Possible duplicate invoice", text: `${a.number} and ${c.number} to ${a.customer} are identical (${money(num(a.total))}) on ${a.date}.`, href: `/ar/invoices/${c.id}` }); }));
  for (const t of readCollection("bank-transactions").filter((x) => !x.deleted && x.inboxState === "FOR_REVIEW" && daysBetween(String(x.date), todayIso()) > 7)) out.push({ id: `bank-${t.id}`, severity: "Medium", type: "Unmatched bank line", text: `${t.date} “${t.description}” ${money(num(t.amount))} has waited ${daysBetween(String(t.date), todayIso())} days in the Bank Inbox.`, href: "/bank/inbox" });
  const accts = readCollection("accounts");
  const byAcc = new Map<string, { v: number; j: Rec }[]>();
  for (const j of readCollection("journal-entries").filter((x) => x.status === "POSTED")) for (const l of (j.lines as Rec[]) ?? []) { const v = num(l.debit) || num(l.credit); const k = String(l.accountId); byAcc.set(k, [...(byAcc.get(k) ?? []), { v, j }]); }
  for (const [k, xs] of byAcc) { if (xs.length < 6) continue; const mean = xs.reduce((s, x) => s + x.v, 0) / xs.length; const sd = Math.sqrt(xs.reduce((s, x) => s + (x.v - mean) ** 2, 0) / xs.length); for (const x of xs.filter((y) => sd > 0 && y.v > mean + 3 * sd)) out.push({ id: `big-${x.j.id}-${k}`, severity: "Medium", type: "Unusual amount", text: `${x.j.number} posts ${money(x.v)} to ${accts.find((a) => a.id === k)?.name}, over 3× the usual spread (average ${money(mean)}).`, href: `/financial/journal-entries/${x.j.id}` }); }
  for (const j of readCollection("journal-entries").filter((x) => x.status === "POSTED" && (x.source === "Manual" || !x.source))) { const d = new Date(`${j.date}T00:00:00Z`).getUTCDay(); if (d === 0 || d === 6) out.push({ id: `wkd-${j.id}`, severity: "Low", type: "Weekend manual entry", text: `${j.number} — a manual journal dated ${j.date} (a ${d === 0 ? "Sunday" : "Saturday"}).`, href: `/financial/journal-entries/${j.id}` }); }
  const bal = balanceAsOf();
  for (const a of accts.filter((x) => String(x.code) >= "1000" && String(x.code) <= "1110" && (bal.get(x.id) ?? 0) < -0.005)) out.push({ id: `neg-${a.id}`, severity: "High", type: "Negative cash balance", text: `${a.code} ${a.name} is overdrawn at ${money(bal.get(a.id) ?? 0)}.`, href: `/reports/cash-book?account=${a.id}` });
  return out;
}

export function Anomalies() {
  const ready = useBooks(["bank-transactions", "anomaly-dismissed"]);
  const dismissed = useCollection("anomaly-dismissed");
  const [sev, setSev] = useState("");
  const all = ready ? detect().filter((a) => !dismissed.some((d) => d.key === a.id)) : [];
  const list = all.filter((a) => !sev || a.severity === sev);
  const tone = { High: "destructive", Medium: "warning", Low: "muted" } as const;
  return (
    <div className="space-y-4">
      <ReportHeader title="AI Anomaly Detection" subtitle="AI-powered anomaly detection across your financial data" />
      <div className="flex items-center gap-3"><Select ariaLabel="Severity" className="w-44" value={sev} onChange={setSev} options={[{ value: "", label: "All Severities" }, { value: "High", label: "High" }, { value: "Medium", label: "Medium" }, { value: "Low", label: "Low" }]} /><span className="text-sm text-muted-foreground">{list.length} anomalies detected</span></div>
      {list.length === 0 ? <Card><div className="p-10 text-center"><p className="font-semibold">No anomalies detected</p><p className="text-sm text-muted-foreground">Your financial data looks healthy.</p></div></Card> : <div className="space-y-2">{list.map((a) => <Card key={a.id}><div className="flex items-start gap-3 p-4"><Badge tone={tone[a.severity]}>{a.severity}</Badge><div className="flex-1"><p className="font-medium">{a.type}</p><p className="text-sm text-muted-foreground">{a.text}</p></div>{a.href && <Link href={a.href} className={btn.smOutline}>Open</Link>}<button type="button" className={btn.smOutline} onClick={() => createRecord("anomaly-dismissed", { key: a.id, at: new Date().toISOString() })}><X /> Dismiss</button></div></Card>)}</div>}
    </div>
  );
}

/* ---------- smart reconciliation ---------- */

const words = (s: unknown) => new Set(String(s ?? "").toLowerCase().split(/\W+/).filter((w) => w.length > 2));
export function SmartReconciliation() {
  const banks = useCollection("bank-accounts");
  const recs = useCollection("reconciliations");
  const txns = useCollection("bank-transactions");
  useBooks();
  const [bank, setBank] = useState("");
  const { node, flash } = useFlash();
  const rec = recs.find((r) => r.bankAccountId === bank && r.status === "IN_PROGRESS");
  const matched = new Set(((rec?.matches as Rec[]) ?? []).map((x) => String(x.txnId)));
  const rows = rec ? txns.filter((t) => t.bankAccountId === bank && !t.deleted && t.inboxState !== "EXCLUDED" && t.status !== "RECONCILED" && !matched.has(t.id) && String(t.date) >= String(rec.periodStart) && String(t.date) <= String(rec.periodEnd)).map((t) => {
    const best = matchCandidates(rec, t).map((c) => { const dd = Math.abs(daysBetween(c.date, String(t.date))); const tw = words(t.description), cw = words(`${c.description} ${c.memo ?? ""}`); const overlap = [...tw].filter((w) => cw.has(w)).length / Math.max(1, tw.size); const conf = 0.6 + 0.25 * Math.max(0, 1 - dd / 14) + 0.15 * overlap + (c.journalId === t.journalId ? 0.15 : 0); return { c, conf: Math.min(0.99, conf) }; }).sort((a, b) => b.conf - a.conf)[0];
    return { t, best };
  }) : [];
  const accept = (t: Rec, key: string) => { matchTxn(rec!.id, t.id, key); logAction("reconciliation", `Matched ${t.description}`); };
  const sure = rows.filter((r) => r.best && r.best.conf >= 0.9);
  return (
    <div className="space-y-4">
      <ReportHeader title="AI Smart Reconciliation" subtitle="AI-powered reconciliation matching between bank transactions and journal entries" actions={sure.length > 0 && <button type="button" className={btn.primary} onClick={() => { sure.forEach((r) => accept(r.t, r.best!.c.key)); flash(`Matched ${sure.length} transaction(s)`); }}><Check /> Accept {sure.length} ≥ 90%</button>} />
      <div className="block w-72 space-y-1.5"><span className="text-sm font-medium">Bank Account</span><Select ariaLabel="Bank Account" value={bank} onChange={setBank} placeholder="Select bank account..." options={banks.map((b) => ({ value: b.id, label: `${b.bankName} - ${b.accountName}` }))} /></div>
      {bank && !rec && <Card><div className="p-8 text-center text-sm text-muted-foreground">Matches are recorded on a reconciliation. <Link href="/bank/reconciliations/new" className="text-primary underline">Start one for this account</Link> with its statement balance, then come back.</div></Card>}
      {rec && <Card><div className="p-5"><CardTitle className="mb-1">Suggested matches — {String(rec.recNumber)}</CardTitle><p className="mb-3 text-xs text-muted-foreground">Confidence weighs exact amount, date distance and shared words in the description. Accepted matches are reconciled when you complete {String(rec.recNumber)}.</p>
        {rows.length === 0 ? <p className="py-6 text-center text-muted-foreground">Everything in this period is matched. <Link className="text-primary underline" href={`/bank/reconciliations/${rec.id}`}>Open {String(rec.recNumber)}</Link></p> : <SimpleTable headers={["Date", "Bank line", "Amount", "Best journal match", "Confidence", ""]} right={[2]} rows={rows.map(({ t, best }) => [String(t.date), String(t.description || t.voucherNo), money(num(t.amount)), best ? `${best.c.number} · ${best.c.date} · ${best.c.description}` : <span key="n" className="text-muted-foreground">No journal line with this amount</span>, best ? <Badge key="c" tone={best.conf >= 0.9 ? "success" : best.conf >= 0.75 ? "warning" : "muted"}>{Math.round(best.conf * 100)}%</Badge> : "—", best ? <button key="b" type="button" className={btn.smPrimary} onClick={() => { accept(t, best.c.key); flash("Matched"); }}>Accept</button> : null])} />}
      </div></Card>}
      {node}
    </div>
  );
}

/* ---------- budget forecast ---------- */

export function BudgetForecast() {
  const ready = useBooks(["budgets"]);
  const budgets = useCollection("budgets");
  const accounts = useAccounts();
  const [sel, setSel] = useState("");
  const chosen = budgets.filter((b) => (sel ? b.id === sel : ["ACTIVE", "APPROVED"].includes(String(b.status))));
  const rows = ready ? chosen.flatMap((b) => { const fy = String(b.fiscalYear); const start = `${fy}-01-01`, end = `${fy}-12-31`; const t = todayIso(); const elapsed = t < start ? 0 : t > end ? 1 : (daysBetween(start, t) + 1) / 366; return budgetActuals(b).map((l) => { const fc = elapsed ? l.actual / elapsed : 0; return { b, l, fc, variance: l.amount - fc }; }); }) : [];
  const tb = rows.reduce((s, r) => s + r.l.amount, 0), tf = rows.reduce((s, r) => s + r.fc, 0);
  const label = (id: string) => { const a = accounts.find((x) => x.id === id); return a ? `${a.code} ${a.name}` : "—"; };
  return (
    <div className="space-y-4">
      <ReportHeader title="AI Budget Forecast" subtitle="AI-powered budget forecasting with variance analysis" />
      <div className="block w-72 space-y-1.5"><span className="text-sm font-medium">Budget (optional)</span><Select ariaLabel="Budget" value={sel} onChange={setSel} options={[{ value: "", label: "All budgets" }, ...budgets.map((b) => ({ value: b.id, label: `${b.name} (${b.fiscalYear})` }))]} /></div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Total Budget</p><p className="text-2xl font-bold">{money(tb)}</p></div></Card>
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Total Forecast</p><p className="text-2xl font-bold">{money(tf)}</p></div></Card>
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Total Variance</p><p className={cn("text-2xl font-bold", tb - tf < 0 && "text-destructive")}>{money(Math.abs(tb - tf))}<span className="ml-1 text-sm font-normal">{tb - tf < 0 ? "over" : "under"}</span></p></div></Card>
      </div>
      <Card><div className="p-5">{rows.length === 0 ? <div className="py-6 text-center"><p className="font-medium">No forecast data available</p><p className="text-sm text-muted-foreground">Select a budget or ensure budget data exists to generate forecasts.</p></div> : <><SimpleTable headers={["Budget", "Account", "Budget", "Actual YTD", "Year-end forecast", "Variance", "Risk"]} right={[2, 3, 4, 5]} rows={rows.map((r) => [String(r.b.name), label(String(r.l.accountId)), money(r.l.amount), money(r.l.actual), money(r.fc), money(r.variance), r.fc > r.l.amount ? <Badge key="r" tone="destructive">Over budget</Badge> : r.fc > r.l.amount * (num(r.b.warningThreshold || 80) / 100) ? <Badge key="r" tone="warning">Watch</Badge> : <Badge key="r" tone="success">On track</Badge>])} /><p className="mt-2 text-xs text-muted-foreground">Forecast extrapolates the year-to-date actual at the same daily rate to the end of the fiscal year.</p></>}</div></Card>
    </div>
  );
}
