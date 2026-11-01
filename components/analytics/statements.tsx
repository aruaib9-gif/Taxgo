"use client";

// Analytics › financial statements and ledgers: trial balance, P&L, balance sheet, cash flow,
// ratios, general ledger, bills outstanding, payment dues, cash & bank book, group summary, funds
// flow, cost centre and group consolidation.

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronRight, EyeOff, Settings2 } from "lucide-react";
import { type Rec } from "@/lib/store";
import { useAccounts, useBankAccounts } from "@/lib/ledger";
import { useCollection } from "@/lib/store";
import { AGE_BUCKETS, ageing, balanceSheet, cashFlow, daysBetween, fundsFlow, ledgerFor, movements, openItems, profitAndLoss, ratios, sectionSigned, todayIso, trialBalance } from "@/lib/reports";
import { cn } from "@/lib/utils";
import { AccountPicker, Card, CardTitle, btn, inputCls, money, num } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { DownloadMenu, RangeFilter, ReportHeader, SimpleTable, TotalLine, ViewToggle, amt, pct, useBooks, useRange } from "@/components/analytics/kit";

const TYPES = [["ASSET", "Assets"], ["LIABILITY", "Liabilities"], ["EQUITY", "Equity"], ["REVENUE", "Income"], ["EXPENSE", "Expenses"]] as const;
const mono = (c: unknown) => <span className="font-mono">{String(c)}</span>;

/* ---------- trial balance ---------- */

export function TrialBalance() {
  const ready = useBooks();
  const r = useRange();
  const [tree, setTree] = useState(false);
  const [hideZero, setHideZero] = useState(false);
  const [cols, setCols] = useState({ opening: true, debit: true, credit: true, closing: true });
  const [config, setConfig] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const rows = ready ? trialBalance(r.from, r.to).filter((x) => !hideZero || x.opening || x.debit || x.credit || x.closing) : [];
  const keys = (["opening", "debit", "credit", "closing"] as const).filter((k) => cols[k]);
  const label = { opening: "Opening", debit: "Debit", credit: "Credit", closing: "Closing" };
  const tot = { opening: 0, debit: rows.reduce((s, x) => s + x.debit, 0), credit: rows.reduce((s, x) => s + x.credit, 0), closing: 0 };
  const line = (x: (typeof rows)[number]) => [mono(x.account.code), String(x.account.name), ...keys.map((k) => amt(x[k]))];
  return (
    <div className="space-y-4">
      <ReportHeader title="Trial Balance" subtitle="Debit and credit balances for all accounts" actions={<>
        <ViewToggle tree={tree} setTree={setTree} />
        <button type="button" className={cn(btn.smOutline, hideZero && "bg-accent")} onClick={() => setHideZero(!hideZero)}><EyeOff /> Hide zero balances</button>
        <div className="relative"><button type="button" className={btn.smOutline} onClick={() => setConfig(!config)}><Settings2 /> Configure</button>
          {config && <div className="absolute right-0 top-full z-30 mt-1 w-44 space-y-1 rounded-md border border-border bg-popover p-2 shadow-md">{keys.length === 0 && <p className="text-xs text-destructive">Pick at least one</p>}{(["opening", "debit", "credit", "closing"] as const).map((k) => <label key={k} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cols[k]} onChange={(e) => setCols({ ...cols, [k]: e.target.checked })} />{label[k]}</label>)}</div>}
        </div>
        <DownloadMenu name="trial-balance" table={() => ({ headers: ["Account Code", "Account Name", ...keys.map((k) => label[k])], rows: rows.map((x) => [String(x.account.code), String(x.account.name), ...keys.map((k) => x[k])]) })} />
      </>} />
      <RangeFilter r={r} />
      <Card><div className="p-4">
        {!tree ? <SimpleTable headers={["Account Code", "Account Name", ...keys.map((k) => label[k])]} right={keys.map((_, i) => i + 2)} rows={rows.map(line)} foot={["", "Total", ...keys.map((k) => (k === "debit" || k === "credit" ? money(tot[k]) : ""))]} /> : (
          <div className="divide-y divide-border">{TYPES.map(([t, name]) => { const g = rows.filter((x) => x.account.type === t); const isOpen = open[t] ?? true; return (
            <div key={t}>
              <button type="button" onClick={() => setOpen({ ...open, [t]: !isOpen })} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-semibold">{isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}{name}<span className="ml-auto flex gap-8 tabular-nums">{keys.map((k) => <span key={k} className="w-28 text-right">{amt(g.reduce((s, x) => s + x[k], 0))}</span>)}</span></button>
              {isOpen && g.map((x) => <div key={x.account.id} className="flex items-center gap-3 py-1.5 pl-10 pr-3 text-sm"><span className="w-14 font-mono text-xs">{String(x.account.code)}</span><span>{String(x.account.name)}</span><span className="ml-auto flex gap-8 tabular-nums">{keys.map((k) => <span key={k} className="w-28 text-right">{amt(x[k])}</span>)}</span></div>)}
            </div>
          ); })}</div>
        )}
        {ready && Math.abs(tot.debit - tot.credit) > 0.005 && <p className="mt-2 text-sm text-destructive">Out of balance by {money(tot.debit - tot.credit)}</p>}
      </div></Card>
    </div>
  );
}

/* ---------- income statement ---------- */

type Line = { account: Rec; amount: number };
function Section({ title, rows, total, empty }: { title: string; rows: Line[]; total: number; empty: string }) {
  return (
    <Card><div className="p-4">
      <CardTitle className="mb-2 px-3">{title}</CardTitle>
      <SimpleTable headers={["Account Code", "Account Name", "Amount"]} right={[2]} empty={empty} rows={rows.map((x) => [mono(x.account.code), String(x.account.name), money(x.amount)])} />
      <TotalLine label={`Total ${title}`} value={money(total)} strong />
    </div></Card>
  );
}
function TreeSection({ title, rows, total }: { title: string; rows: Line[]; total: number }) {
  const [open, setOpen] = useState(true);
  return <div><button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold">{open ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}{title}<span className="ml-auto tabular-nums">{money(total)}</span></button>{open && rows.map((x) => <div key={x.account.id} className="flex py-1 pl-10 pr-3 text-sm"><span className="w-14 font-mono text-xs">{String(x.account.code)}</span>{String(x.account.name)}<span className="ml-auto tabular-nums">{money(x.amount)}</span></div>)}</div>;
}

export function IncomeStatement() {
  const ready = useBooks();
  const r = useRange();
  const [tree, setTree] = useState(false);
  const p = ready ? profitAndLoss(r.from, r.to) : null;
  const exportRows = () => { if (!p) return { headers: [], rows: [] }; const sec = (t: string, l: Line[]) => l.map((x) => [t, String(x.account.code), String(x.account.name), x.amount] as (string | number)[]); return { headers: ["Section", "Account Code", "Account Name", "Amount"], rows: [...sec("Sales", p.sales), ...sec("Cost of Sales", p.cos), ...sec("Other Income", p.other), ...sec("Indirect Expenses", p.indirect), ["", "", "Gross Profit", p.gross], ["", "", "Net Profit", p.net]] }; };
  return (
    <div className="space-y-4">
      <ReportHeader title="Income Statement (P&L)" subtitle="Trading account, gross profit, expenses and net profit" actions={<><ViewToggle tree={tree} setTree={setTree} /><DownloadMenu name="income-statement" table={exportRows} /></>} />
      <RangeFilter r={r} />
      {p && (tree ? <Card><div className="divide-y divide-border p-2"><TreeSection title="Sales" rows={p.sales} total={p.totalSales} /><TreeSection title="Cost of Sales" rows={p.cos} total={p.costOfSales} /><TreeSection title="Other Income" rows={p.other} total={p.otherIncome} /><TreeSection title="Indirect Expenses" rows={p.indirect} total={p.indirectTotal} /><TotalLine label="Net Profit" value={money(p.net)} strong tone={p.net < 0 ? "bad" : "good"} /></div></Card> : <>
        <Card><div className="p-4">
          <CardTitle className="mb-2 px-3">Trading Account</CardTitle>
          <TotalLine label="Opening Stock" value={money(p.openingStock)} />
          <TotalLine label="Add: Purchases" value={money(p.purchases)} />
          <TotalLine label="Less: Closing Stock" value={money(p.closingStock)} />
          {p.cos.map((x) => <TotalLine key={x.account.id} label={String(x.account.name)} value={money(x.amount)} />)}
          {p.cos.length === 0 && <TotalLine label="Cost of Goods Sold" value={money(0)} />}
          <TotalLine label="Total Cost of Sales" value={money(p.costOfSales)} strong />
          <TotalLine label="Sales" value={money(p.totalSales)} />
          <TotalLine label="Gross Profit" value={money(p.gross)} strong tone={p.gross < 0 ? "bad" : undefined} />
          <p className="px-3 text-xs text-muted-foreground">Cost of sales is the perpetual figure booked at each sale; the stock lines show the inventory movement behind it.</p>
        </div></Card>
        <Section title="Sales" rows={p.sales} total={p.totalSales} empty="No sales data" />
        {p.other.length > 0 && <Section title="Other Income" rows={p.other} total={p.otherIncome} empty="No other income" />}
        <Section title="Indirect Expenses" rows={p.indirect} total={p.indirectTotal} empty="No expense data" />
        <Card><div className="p-4">
          <TotalLine label="Gross Profit" value={money(p.gross)} />
          <TotalLine label="Add: Other Income" value={money(p.otherIncome)} />
          <TotalLine label="Less: Indirect Expenses" value={money(p.indirectTotal)} />
          <TotalLine label="Total Expenses (all)" value={money(p.totalExpenses)} />
          <TotalLine label="Net Profit" value={money(p.net)} strong tone={p.net < 0 ? "bad" : "good"} />
        </div></Card>
      </>)}
    </div>
  );
}

/* ---------- balance sheet ---------- */

export function BalanceSheet() {
  const ready = useBooks();
  const r = useRange();
  const [tree, setTree] = useState(false);
  const b = ready ? balanceSheet(r.to) : null;
  const equityRows = b ? [...b.equity, ...(b.earnings ? [{ account: { id: "cye", code: "—", name: "Current Year Earnings (unclosed P&L)" } as Rec, amount: b.earnings }] : [])] : [];
  return (
    <div className="space-y-4">
      <ReportHeader title="Balance Sheet" subtitle="Assets, liabilities, and equity snapshot" actions={<><ViewToggle tree={tree} setTree={setTree} /><DownloadMenu name="balance-sheet" table={() => ({ headers: ["Section", "Account Code", "Account Name", "Amount"], rows: b ? [...b.assets.map((x) => ["Assets", String(x.account.code), String(x.account.name), x.amount]), ...b.liabilities.map((x) => ["Liabilities", String(x.account.code), String(x.account.name), x.amount]), ...equityRows.map((x) => ["Equity", String(x.account.code), String(x.account.name), x.amount])] : [] })} /></>} />
      <RangeFilter r={r} single />
      {b && (tree ? <Card><div className="divide-y divide-border p-2"><TreeSection title="Assets" rows={b.assets} total={b.totalAssets} /><TreeSection title="Liabilities" rows={b.liabilities} total={b.totalLiabilities} /><TreeSection title="Equity" rows={equityRows} total={b.totalEquity} /><TotalLine label="Total Liabilities + Equity" value={money(b.totalLiabilities + b.totalEquity)} strong /></div></Card> : <>
        <Section title="Assets" rows={b.assets} total={b.totalAssets} empty="No data" />
        <Section title="Liabilities" rows={b.liabilities} total={b.totalLiabilities} empty="No data" />
        <Section title="Equity" rows={equityRows} total={b.totalEquity} empty="No data" />
        <Card><div className="p-4"><TotalLine label="Total Liabilities + Equity" value={money(b.totalLiabilities + b.totalEquity)} strong />{!b.balanced && <p className="px-3 text-sm text-destructive">Assets differ from liabilities + equity by {money(b.totalAssets - b.totalLiabilities - b.totalEquity)}</p>}</div></Card>
      </>)}
    </div>
  );
}

/* ---------- cash flow ---------- */

export function CashFlow() {
  const ready = useBooks();
  const r = useRange();
  const c = ready ? cashFlow(r.from, r.to) : null;
  const block = (title: string, rows: [string, number][], total: number, totalLabel: string) => <Card><div className="p-4"><CardTitle className="mb-2 px-3">{title}</CardTitle><SimpleTable headers={["Description", "Amount"]} right={[1]} rows={rows.map(([l, v]) => [l, money(v)])} /><TotalLine label={totalLabel} value={money(total)} strong /></div></Card>;
  const op: [string, number][] = c ? [["Net Income", c.net], ["Depreciation & Amortization", c.dep], ["Change in Accounts Receivable", c.ar], ["Change in Accounts Payable", c.ap], ["Change in Inventory", c.inv], ...(c.otherOp ? [["Other working capital changes", c.otherOp] as [string, number]] : [])] : [];
  return (
    <div className="space-y-4">
      <ReportHeader title="Cash Flow Statement" subtitle="Operating, investing, and financing cash flows" actions={<DownloadMenu name="cash-flow" table={() => ({ headers: ["Section", "Description", "Amount"], rows: c ? [...op.map(([l, v]) => ["Operating", l, v]), ["Investing", "Purchase of Fixed Assets", c.fixed], ["Investing", "Proceeds from Asset Disposals", c.disposals], ["Financing", "Change in Long-term Liabilities", c.loans], ["Financing", "Change in Equity", c.equity], ["", "Net Change in Cash", c.change]] : [] })} />} />
      <RangeFilter r={r} />
      {c && <>
        {block("Operating Activities", op, c.operating, "Total Operating Activities")}
        {block("Investing Activities", [["Purchase of Fixed Assets", c.fixed], ["Proceeds from Asset Disposals", c.disposals]], c.investing, "Total Investing Activities")}
        {block("Financing Activities", [["Change in Long-term Liabilities", c.loans], ["Change in Equity", c.equity]], c.financing, "Total Financing Activities")}
        <Card><div className="p-4"><TotalLine label="Net Change in Cash" value={money(c.change)} strong />{Math.abs(c.change - c.cashChange) > 0.01 && <p className="px-3 text-xs text-muted-foreground">Cash & bank ledgers moved {money(c.cashChange)}; the {money(c.cashChange - c.change)} difference comes from postings straight to retained earnings (e.g. year-end closing).</p>}</div></Card>
      </>}
    </div>
  );
}

/* ---------- ratio analysis ---------- */

export function RatioAnalysis() {
  const ready = useBooks();
  const r = useRange();
  const x = ready ? ratios(r.to) : null;
  const f2 = (v: number | null) => (v == null || !Number.isFinite(v) ? "—" : v.toFixed(2));
  const group = (title: string, rows: [string, string][]) => <Card><div className="p-4"><CardTitle className="mb-2 px-3">{title}</CardTitle>{rows.map(([l, v]) => <TotalLine key={l} label={l} value={v} />)}</div></Card>;
  return (
    <div className="space-y-4">
      <ReportHeader title="Ratio Analysis" subtitle="Key financial ratios at a glance" />
      <RangeFilter r={r} single />
      {x && <div className="grid gap-4 md:grid-cols-2">
        {group("Liquidity", [["Current Ratio", f2(x.current)], ["Quick / Acid-Test Ratio", f2(x.quick)], ["Working Capital", x.workingCapital == null ? "—" : money(x.workingCapital)]])}
        {group("Solvency", [["Debt-Equity Ratio", f2(x.debtEquity)], ["Proprietary Ratio", f2(x.proprietary)]])}
        {group("Profitability", [["Gross Profit %", pct(x.gross)], ["Net Profit %", pct(x.netPct)], ["Operating Cost %", pct(x.opCost)]])}
        {group("Returns", [["Return on Equity %", pct(x.roe)], ["Return on Assets %", pct(x.roa)]])}
      </div>}
      <p className="text-xs text-muted-foreground">Profitability and returns use the year to date of the chosen date.</p>
    </div>
  );
}

/* ---------- general ledger ---------- */

export function GeneralLedger({ fixedAccount, title = "General Ledger", subtitle = "Detailed transaction history by account" }: { fixedAccount?: string; title?: string; subtitle?: string }) {
  const ready = useBooks();
  const accounts = useAccounts();
  const r = useRange();
  const [acct, setAcct] = useState(fixedAccount ?? "");
  const [applied, setApplied] = useState(fixedAccount ?? "");
  const g = ready && applied ? ledgerFor(applied, r.from, r.to) : null;
  const a = accounts.find((x) => x.id === applied);
  return (
    <div className="space-y-4">
      <ReportHeader title={title} subtitle={subtitle} actions={<DownloadMenu name={`ledger-${a?.code ?? "account"}`} table={() => ({ headers: ["Date", "Entry #", "Description", "Debit", "Credit", "Balance"], rows: g ? g.rows.map((x) => [x.date, x.number, x.description, x.debit, x.credit, x.balance]) : [] })} />} />
      <RangeFilter r={{ ...r, apply: () => { r.apply(); setApplied(acct); } }}>
        {!fixedAccount && <div className="w-72 space-y-1.5"><span className="text-sm font-medium">Account</span><AccountPicker accounts={accounts} value={acct} onChange={setAcct} ariaLabel="Account" /></div>}
      </RangeFilter>
      <Card><div className="p-4">
        {a && <p className="mb-2 px-3 text-sm font-semibold">{String(a.code)} · {String(a.name)}</p>}
        <SimpleTable headers={["Date", "Entry #", "Description", "Debit", "Credit", "Balance"]} right={[3, 4, 5]} empty="No data available" rows={g ? [...(r.from ? [["", "", "Opening balance", "", "", money(g.opening)]] : []), ...g.rows.map((x) => [x.date, <Link key={x.journalId} className="font-mono text-xs text-primary" href={`/financial/journal-entries/${x.journalId}`}>{x.number || "JE"}</Link>, x.description, amt(x.debit), amt(x.credit), money(x.balance)])] : []} />
        {g && g.rows.length > 0 && <TotalLine label="Closing balance" value={money(g.rows[g.rows.length - 1].balance)} strong />}
      </div></Card>
    </div>
  );
}

/* ---------- bills outstanding ---------- */

export function BillsOutstanding() {
  const ready = useBooks();
  const r = useRange({ to: "" });
  const asOf = r.to ?? todayIso();
  const part = (kind: "AR" | "AP", title: string) => {
    const rows = ready ? ageing(kind, asOf) : [];
    const tot = AGE_BUCKETS.map((_, i) => rows.reduce((s, x) => s + x.buckets[i], 0));
    return <Card><div className="p-4"><CardTitle className="mb-2 px-3">{title}</CardTitle><SimpleTable headers={["Party", ...AGE_BUCKETS, "Total"]} right={[1, 2, 3, 4, 5, 6]} empty="Nothing outstanding" rows={rows.map((x) => [x.party, ...x.buckets.map(amt), money(x.total)])} foot={rows.length ? ["Total", ...tot.map(amt), money(tot.reduce((s, v) => s + v, 0))] : undefined} /></div></Card>;
  };
  return (
    <div className="space-y-4">
      <ReportHeader title="Bills Outstanding" subtitle="Receivables and payables by age" />
      <RangeFilter r={r} single />
      {part("AR", "Bills Receivable")}
      {part("AP", "Bills Payable")}
    </div>
  );
}

/* ---------- payment dues ---------- */

export function PaymentDues() {
  const ready = useBooks();
  const [mode, setMode] = useState<"UPCOMING" | "AGING">("UPCOMING");
  const [side, setSide] = useState<"AR" | "AP">("AR");
  const [len, setLen] = useState(10);
  const asOf = todayIso();
  const items = ready ? openItems(asOf) : [];
  const count = (k: "AR" | "AP") => items.filter((x) => x.kind === k).length;
  const mine = items.filter((x) => x.kind === side);
  const L = Math.max(1, len);
  const buckets = mode === "UPCOMING" ? ["Overdue", `Due in 0-${L} days`, `Due in ${L + 1}-${2 * L} days`, `Due in ${2 * L + 1}-${3 * L} days`, `+${3 * L}`] : ["Current", `1-${L} days`, `${L + 1}-${2 * L} days`, `${2 * L + 1}-${3 * L} days`, `+${3 * L}`];
  const idx = (dueDate: string) => { const d = daysBetween(asOf, dueDate); if (mode === "UPCOMING") return d < 0 ? 0 : d <= L ? 1 : d <= 2 * L ? 2 : d <= 3 * L ? 3 : 4; const o = -d; return o <= 0 ? 0 : o <= L ? 1 : o <= 2 * L ? 2 : o <= 3 * L ? 3 : 4; };
  const parties = [...new Set(mine.map((x) => x.party))].map((p) => { const b = [0, 0, 0, 0, 0]; for (const x of mine.filter((y) => y.party === p)) b[idx(x.dueDate)] += x.amount; return { party: p, b, total: b.reduce((s, v) => s + v, 0) }; }).sort((a, b) => b.total - a.total);
  const totals = buckets.map((_, i) => parties.reduce((s, x) => s + x.b[i], 0));
  const seg = (on: boolean) => cn("rounded-full px-3 py-1 text-xs font-medium", on ? "bg-primary text-primary-foreground" : "text-foreground");
  return (
    <div className="space-y-4">
      <ReportHeader title="Payment Dues" subtitle="Aged partner balances — what's overdue and what falls due in the coming days, partner by partner." actions={<DownloadMenu label="Download Excel" name="payment-dues" table={() => ({ headers: ["Partner", ...buckets, "Total"], rows: parties.map((x) => [x.party, ...x.b, x.total]) })} />} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex rounded-full border border-border bg-card p-1">{([["UPCOMING", "Upcoming dues"], ["AGING", "Overdue (aging)"]] as const).map(([v, l]) => <button key={v} type="button" className={seg(mode === v)} onClick={() => setMode(v)}>{l}</button>)}</div>
        <div className="flex rounded-full border border-border bg-card p-1">{([["AR", "Receivables"], ["AP", "Payables"]] as const).map(([v, l]) => <button key={v} type="button" className={seg(side === v)} onClick={() => setSide(v)}>{l} ({count(v)})</button>)}</div>
        <label className="space-y-1"><span className="text-xs font-medium">Period length (days)</span><input aria-label="Period length (days)" type="number" min="1" className={cn(inputCls, "h-8 w-24")} value={len} onChange={(e) => setLen(num(e.target.value) || 1)} /></label>
        <span className="pb-2 text-xs text-muted-foreground">As of {asOf}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-5">{buckets.map((b, i) => <Card key={b} className={cn(i === 0 && mode === "UPCOMING" && "border-destructive/40")}><div className="p-4"><p className="text-xs text-muted-foreground">{b}</p><p className="mt-1 text-xl font-bold tabular-nums">{money(totals[i])}</p></div></Card>)}</div>
      <Card><div className="p-4">{parties.length === 0 ? <p className="py-6 text-center text-muted-foreground">Nothing outstanding on this side — all settled.</p> : <SimpleTable headers={["Partner", ...buckets, "Total"]} right={[1, 2, 3, 4, 5, 6]} rows={parties.map((x) => [x.party, ...x.b.map(amt), money(x.total)])} foot={["Total", ...totals.map(amt), money(totals.reduce((s, v) => s + v, 0))]} />}</div></Card>
    </div>
  );
}

/* ---------- cash & bank book ---------- */

export function CashBook() {
  const params = useSearchParams();
  const router = useRouter();
  const accounts = useAccounts();
  const banks = useBankAccounts();
  const cash = useCollection("cash-accounts");
  const sel = params.get("account");
  if (sel) return <div className="space-y-2"><button type="button" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => router.push("/reports/cash-book")}>← Cash & Bank Book</button><GeneralLedger key={sel} fixedAccount={sel} title="Cash & Bank Book" subtitle={String(accounts.find((a) => a.id === sel)?.name ?? "")} /></div>;
  const linked = new Set([...banks, ...cash].map((b) => String(b.glAccountId ?? "")).filter(Boolean));
  const ledgers = accounts.filter((a) => (String(a.code) >= "1000" && String(a.code) <= "1110") || linked.has(a.id)).sort((a, b) => String(a.code).localeCompare(String(b.code)));
  return (
    <div className="space-y-4">
      <ReportHeader title="Cash & Bank Book" subtitle="Open any cash or bank ledger to see its statement" />
      <Card><div className="p-4"><CardTitle className="mb-2 px-3">Cash & Bank Ledgers</CardTitle><SimpleTable headers={["Code", "Ledger", "Statement"]} rows={ledgers.map((a) => [mono(a.code), String(a.name), <Link key={a.id} href={`/reports/cash-book?account=${a.id}`} className="text-primary">View →</Link>])} /></div></Card>
    </div>
  );
}

/* ---------- group summary ---------- */

export function GroupSummary() {
  const ready = useBooks();
  const accounts = useAccounts();
  const { dr, cr } = ready ? movements() : { dr: new Map<string, number>(), cr: new Map<string, number>() };
  return (
    <div className="space-y-4">
      <ReportHeader title="Group Summary" subtitle="Top-level account groups by nature" actions={<DownloadMenu name="group-summary" table={() => ({ headers: ["Group", "Account", "Closing Balance"], rows: TYPES.flatMap(([t, l]) => accounts.filter((a) => a.type === t).map((a) => [l, String(a.name), sectionSigned(a, dr.get(a.id) ?? 0, cr.get(a.id) ?? 0)])) })} />} />
      {ready && TYPES.map(([t, l]) => { const rows = [...accounts].filter((a) => a.type === t).sort((a, b) => String(a.code).localeCompare(String(b.code))); const total = rows.reduce((s, a) => s + sectionSigned(a, dr.get(a.id) ?? 0, cr.get(a.id) ?? 0), 0); return (
        <Card key={t}><div className="p-4"><CardTitle className="mb-2 px-3">{l}</CardTitle><SimpleTable headers={["Group", "Closing Balance"]} right={[1]} rows={rows.map((a) => [String(a.name), money(sectionSigned(a, dr.get(a.id) ?? 0, cr.get(a.id) ?? 0))])} foot={["Total", money(total)]} /></div></Card>
      ); })}
    </div>
  );
}

/* ---------- funds flow ---------- */

export function FundsFlow() {
  const ready = useBooks();
  const [d, setD] = useState({ open: "", close: "" });
  const [res, setRes] = useState<ReturnType<typeof fundsFlow> | null>(null);
  const [err, setErr] = useState("");
  return (
    <div className="space-y-4">
      <ReportHeader title="Funds Flow" subtitle="Sources and applications of funds between two dates" />
      <Card><div className="flex flex-wrap items-end gap-3 p-5">
        <div className="space-y-1.5"><span className="text-sm font-medium">Opening Date</span><DateInput ariaLabel="Opening Date" className="w-40" value={d.open} onChange={(v) => setD({ ...d, open: v })} /></div>
        <div className="space-y-1.5"><span className="text-sm font-medium">Closing Date</span><DateInput ariaLabel="Closing Date" className="w-40" value={d.close} onChange={(v) => setD({ ...d, close: v })} /></div>
        <button type="button" className={btn.smPrimary} disabled={!ready} onClick={() => { if (!d.open || !d.close || d.close < d.open) { setErr("Pick an opening date on or before the closing date."); return; } setErr(""); setRes(fundsFlow(d.open, d.close)); }}>Generate</button>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </div></Card>
      {!res ? <Card><div className="p-8 text-center text-sm text-muted-foreground">Pick two dates and generate.</div></Card> : <>
        <div className="grid gap-4 md:grid-cols-2">
          <Card><div className="p-4"><CardTitle className="mb-2 px-3">Sources of Funds</CardTitle><SimpleTable headers={["Source", "Amount"]} right={[1]} empty="None" rows={res.sources.map((x) => [x.label, money(x.amount)])} foot={["Total sources", money(res.totalSources)]} /></div></Card>
          <Card><div className="p-4"><CardTitle className="mb-2 px-3">Application of Funds</CardTitle><SimpleTable headers={["Application", "Amount"]} right={[1]} empty="None" rows={res.uses.map((x) => [x.label, money(x.amount)])} foot={["Total applications", money(res.totalUses)]} /></div></Card>
        </div>
        <Card><div className="p-4"><TotalLine label="Working capital at opening" value={money(res.wcOpen)} /><TotalLine label="Working capital at closing" value={money(res.wcClose)} /><TotalLine label="Net increase / (decrease) in working capital" value={money(res.wcChange)} strong /></div></Card>
      </>}
    </div>
  );
}

/* ---------- cost centre ---------- */

export function CostCentre() {
  const ready = useBooks();
  const journals = useCollection("journal-entries");
  const centres = useCollection("cost-centres");
  const map = new Map<string, { cat: string; centre: string; dr: number; cr: number }>();
  if (ready) for (const j of journals.filter((x) => x.status === "POSTED" || x.status === "REVERSED")) for (const l of (j.lines as Rec[]) ?? []) {
    if (!l.costCentre) continue;
    const c = centres.find((x) => x.id === l.costCentre || x.name === l.costCentre);
    const k = String(l.costCentre);
    const row = map.get(k) ?? { cat: String(c?.category ?? "Primary"), centre: String(c?.name ?? l.costCentre), dr: 0, cr: 0 };
    row.dr += num(l.debit); row.cr += num(l.credit); map.set(k, row);
  }
  const rows = [...map.values()];
  return (
    <div className="space-y-4">
      <ReportHeader title="Cost Centre" subtitle="Posted amounts by cost category and cost centre" />
      <Card><div className="p-4"><SimpleTable headers={["Cost Category", "Cost Centre", "Debit", "Credit", "Net"]} right={[2, 3, 4]} empty="No cost-centre postings yet. Tag voucher lines with a cost centre to see them here." rows={rows.map((x) => [x.cat, x.centre, money(x.dr), money(x.cr), money(x.dr - x.cr)])} /></div></Card>
    </div>
  );
}

/* ---------- consolidation ---------- */

export function Consolidation() {
  const [cur, setCur] = useState("USD");
  const r = useRange();
  return (
    <div className="space-y-4">
      <ReportHeader title="Group Consolidation" subtitle="Consolidated view across the active company and every entity under it (the legal-entity subtree)." />
      <Card><div className="flex flex-wrap items-end gap-3 p-5">
        <div className="space-y-1.5"><span className="text-sm font-medium">From</span><DateInput ariaLabel="From" className="w-40" value={r.draft.from} onChange={(v) => r.setDraft({ ...r.draft, from: v })} /></div>
        <div className="space-y-1.5"><span className="text-sm font-medium">To</span><DateInput ariaLabel="To" className="w-40" value={r.draft.to} onChange={(v) => r.setDraft({ ...r.draft, to: v })} /></div>
        <div className="space-y-1.5"><span className="text-sm font-medium">Reporting currency</span><Select ariaLabel="Reporting currency" className="w-32" value={cur} onChange={setCur} options={["USD", "SAR", "AED", "INR", "GBP", "EUR"]} /></div>
        <span className="pb-2 text-sm text-muted-foreground">1 entity in group</span>
      </div></Card>
      <Card><div className="p-8 text-center"><p className="font-semibold">No subsidiaries under this company</p><p className="mt-1 text-sm text-muted-foreground">This entity has no companies beneath it. Switch to a parent company (e.g. the group / muʼassasa) in the company selector to see the consolidated group view.</p></div></Card>
    </div>
  );
}
