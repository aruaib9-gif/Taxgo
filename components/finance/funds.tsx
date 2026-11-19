"use client";

// Finance › Debts, Loans (dashboard, list, eligibility, settings), Chit Funds (dashboard, groups,
// settings), Currency (currencies, exchange rates, converter, revaluations) and Budgets.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, ArrowDownCircle, ArrowLeft, ArrowUpCircle, ArrowRight, Check, Coins, CreditCard, Dices, Plus, TrendingUp, Users, X } from "lucide-react";
import { createRecord, deleteRecord, updateRecord, useCollection, type Rec } from "@/lib/store";
import { useAccounts } from "@/lib/ledger";
import { BASE, DEBT_STATUSES, FREQS, LOAN_STATUSES, PERIODS, activateGroup, addMember, approveLoan, budgetActuals, budgetTotal, checkEligibility, conductRound, createDebt, createGroup, createLoan, debtOutstanding, disburseLoan, kuriSettings, loanCollected, markContribution, loanOutstanding, loanSettings, nextDebtNumber, overdueRows, payDebt, payLoanInstalment, pickWinner, rateOn, roundFigures, runRevaluation, saveKuriSettings, saveLoanSettings, seedCurrencies, setBudgetStatus, todayIso } from "@/lib/finance";
import { cn } from "@/lib/utils";
import { AccountPicker, Badge, Card, CardTitle, DataTable, Dialog, Field, PageHeader, SidePanel, Switch, btn, inputCls, money, num, textareaCls } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";
import { Th, fmtDate, useFlash } from "@/components/hr/people";

const title = (s: unknown) => String(s ?? "").toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const TONE: Record<string, "muted" | "success" | "info" | "warning" | "destructive"> = { ACTIVE: "success", PARTIALLY_PAID: "info", PAID: "success", DEFAULTED: "destructive", WRITTEN_OFF: "muted", DRAFT: "muted", APPROVED: "info", DISBURSED: "info", REPAYING: "warning", COMPLETED: "success", CANCELLED: "muted", CLOSED: "muted", PENDING: "muted", PARTIAL: "warning", OVERDUE: "destructive" };
const St = ({ s }: { s: unknown }) => <Badge tone={TONE[String(s)] ?? "muted"}>{title(s)}</Badge>;
const Stat = ({ icon: Icon, label, value, sub, bad, iconCls }: { icon?: typeof Coins; label: string; value: React.ReactNode; sub?: React.ReactNode; bad?: boolean; iconCls?: string }) => (
  <Card><div className="p-4"><p className="flex items-center gap-1.5 text-sm text-muted-foreground">{Icon && <Icon className={cn("size-3.5", iconCls)} />}{label}</p><p className={cn("mt-1 text-2xl font-bold tabular-nums", bad && "text-destructive")}>{value}</p>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div></Card>
);
const Back = ({ href, label }: { href: string; label: string }) => <Link href={href} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> {label}</Link>;
type ScheduleRow = { n: number; dueDate: string; principal: number; interest: number; total: number; paid: number; status: string };
const rowStatus = (r: ScheduleRow) => (r.status !== "PAID" && r.dueDate < todayIso() ? "OVERDUE" : r.status);

/* ---------- debts ---------- */

export function Debts() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/debt");
  const debts = useCollection("debts");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  if (sub && sub !== "new") return <DebtDetail id={sub} />;
  const sum = (t: string) => debts.filter((d) => d.debtType === t);
  const rows = debts.filter((d) => (!type || d.debtType === type) && (!status || d.status === status));
  return (
    <div className="space-y-4">
      <PageHeader title="Debt Management" actions={<Link href="/debt/new" className={btn.primary}><Plus /> New Debt</Link>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={ArrowDownCircle} iconCls="text-destructive" label="Loans Payable" value={money(sum("PAYABLE").reduce((a, d) => a + debtOutstanding(d), 0))} sub={`of ${money(sum("PAYABLE").reduce((a, d) => a + num(d.principal), 0))} total`} />
        <Stat icon={ArrowUpCircle} iconCls="text-success" label="Loans Receivable" value={money(sum("RECEIVABLE").reduce((a, d) => a + debtOutstanding(d), 0))} sub={`of ${money(sum("RECEIVABLE").reduce((a, d) => a + num(d.principal), 0))} total`} />
        <Stat label="Active Debts" value={debts.filter((d) => ["ACTIVE", "PARTIALLY_PAID"].includes(String(d.status))).length} />
        <Stat label="Overdue Schedules" value={debts.reduce((a, d) => a + overdueRows(d).length, 0)} bad />
      </div>
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Debts</CardTitle><div className="flex gap-2">
          <Select ariaLabel="Type" size="sm" className="w-40" value={type} onChange={setType} options={[{ value: "", label: "All Types" }, { value: "PAYABLE", label: "Loan Payable" }, { value: "RECEIVABLE", label: "Loan Receivable" }]} />
          <Select ariaLabel="Status" size="sm" className="w-40" value={status} onChange={setStatus} options={[{ value: "", label: "All Status" }, ...DEBT_STATUSES.map((s) => ({ value: s, label: title(s) }))]} />
        </div></div>
        {debts.length === 0 ? <p className="py-8 text-center text-muted-foreground">No debts found. Create your first debt to get started.</p> : <DataTable rows={rows} emptyText="No debts match these filters." onRowClick={(d) => router.push(`/debt/${d.id}`)} columns={[
          { key: "no", header: "Debt #", cell: (d) => <span className="font-mono text-xs">{String(d.debtNumber)}</span> },
          { key: "type", header: "Type", cell: (d) => (d.debtType === "PAYABLE" ? "Loan Payable" : "Loan Receivable") },
          { key: "cp", header: "Counterparty", cell: (d) => <span className="font-medium">{String(d.counterparty)}</span> },
          { key: "p", header: "Principal", cell: (d) => money(num(d.principal)) },
          { key: "o", header: "Outstanding", cell: (d) => money(debtOutstanding(d)) },
          { key: "r", header: "Rate", cell: (d) => `${num(d.rate)}%` },
          { key: "m", header: "Maturity", cell: (d) => fmtDate(d.maturityDate) },
          { key: "s", header: "Status", cell: (d) => <St s={d.status} /> },
        ]} />}
      </div></Card>
      {sub === "new" && <SidePanel onClose={() => router.push("/debt")}><DebtForm /></SidePanel>}
    </div>
  );
}

function DebtForm() {
  const router = useRouter();
  const [f, setF] = useState({ debtType: "PAYABLE", counterparty: "", contact: "", principal: "", rate: "", interestType: "SIMPLE", frequency: "MONTHLY", startDate: todayIso(), maturityDate: "", notes: "" });
  const [err, setErr] = useState("");
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  function save() {
    try { const d = createDebt({ ...f, debtType: f.debtType as "PAYABLE" | "RECEIVABLE", principal: num(f.principal), rate: num(f.rate) }); router.push(`/debt/${d.id}`); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">New Debt</h2>
      <Card><div className="space-y-4 p-5">
        <CardTitle>Loan</CardTitle>
        <NumberBanner label="Debt #" value={nextDebtNumber()} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Debt Type" className="sm:col-span-2"><Select ariaLabel="Debt Type" value={f.debtType} onChange={(v) => set({ debtType: v })} options={[{ value: "PAYABLE", label: "Loan Payable (We Owe)" }, { value: "RECEIVABLE", label: "Loan Receivable (Owed to Us)" }]} /></Field>
          <Field label="Counterparty Name *" htmlFor="cp"><input id="cp" className={inputCls} value={f.counterparty} onChange={(e) => set({ counterparty: e.target.value })} /></Field>
          <Field label="Counterparty Contact" htmlFor="cc"><input id="cc" className={inputCls} value={f.contact} onChange={(e) => set({ contact: e.target.value })} /></Field>
          <Field label="Principal Amount *" htmlFor="pa"><input id="pa" type="number" min="0" className={inputCls} value={f.principal} onChange={(e) => set({ principal: e.target.value })} /></Field>
          <Field label="Interest Rate (% annual)" htmlFor="ir"><input id="ir" type="number" min="0" step="0.01" className={inputCls} value={f.rate} onChange={(e) => set({ rate: e.target.value })} /></Field>
          <Field label="Interest Type"><Select ariaLabel="Interest Type" value={f.interestType} onChange={(v) => set({ interestType: v })} options={[{ value: "SIMPLE", label: "Simple" }, { value: "COMPOUND", label: "Compound (amortising)" }]} /></Field>
          <Field label="Repayment Frequency"><Select ariaLabel="Repayment Frequency" value={f.frequency} onChange={(v) => set({ frequency: v })} options={FREQS.map((x) => ({ value: x.value, label: x.label }))} /></Field>
          <Field label="Start Date *"><DateInput ariaLabel="Start Date" value={f.startDate} onChange={(v) => set({ startDate: v })} /></Field>
          <Field label="Maturity Date *"><DateInput ariaLabel="Maturity Date" value={f.maturityDate} onChange={(v) => set({ maturityDate: v })} /></Field>
          <Field label="Notes" className="sm:col-span-2"><textarea aria-label="Notes" rows={2} className={textareaCls} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-muted-foreground">{f.debtType === "PAYABLE" ? "Posts Dr Bank · Cr Loans (short- or long-term by maturity)." : "Posts Dr Loans Receivable · Cr Bank."}</p>
      </div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Create Debt</button><Link href="/debt" className={btn.outline}>Cancel</Link></div>
    </div>
  );
}

function DebtDetail({ id }: { id: string }) {
  const debts = useCollection("debts");
  const [pay, setPay] = useState({ open: false, date: todayIso(), amount: "", method: "", reference: "", notes: "" });
  const { node, flash } = useFlash();
  const d = debts.find((x) => x.id === id);
  if (!d) return debts.length ? <p className="p-6 text-sm text-muted-foreground">Debt not found</p> : null;
  const rows = (d.schedule as ScheduleRow[]) ?? [];
  const payments = (d.payments as Rec[]) ?? [];
  const open = !["PAID", "WRITTEN_OFF"].includes(String(d.status));
  function save() {
    try { payDebt(d!.id, { date: pay.date, amount: num(pay.amount), method: pay.method, reference: pay.reference, notes: pay.notes }); setPay({ ...pay, open: false, amount: "" }); flash("Payment recorded"); }
    catch (e) { flash(e instanceof Error ? e.message : "Error", true); }
  }
  return (
    <div className="space-y-4">
      <Back href="/debt" label="Debts" />
      <PageHeader title={`${d.debtNumber} · ${d.counterparty}`} subtitle={`${d.debtType === "PAYABLE" ? "Loan Payable (We Owe)" : "Loan Receivable (Owed to Us)"} · ${num(d.rate)}% ${title(d.interestType)} · ${title(d.frequency)}`} actions={<>
        <St s={d.status} />
        {open && <button type="button" className={btn.primary} onClick={() => setPay({ ...pay, open: true, amount: String(rows.find((r) => r.status !== "PAID")?.total ?? "") })}>Record Payment</button>}
        {open && <button type="button" className={btn.outline} onClick={() => updateRecord("debts", d.id, { status: "DEFAULTED" })}>Mark defaulted</button>}
        {d.status === "DEFAULTED" && <button type="button" className={btn.outline} onClick={() => updateRecord("debts", d.id, { status: "WRITTEN_OFF" })}>Write off</button>}
      </>} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat icon={Coins} label="Principal" value={money(num(d.principal))} />
        <Stat icon={Check} label="Paid" value={money(num(d.principal) - debtOutstanding(d))} sub={`interest ${money(payments.reduce((a, p) => a + num(p.interestPart), 0))}`} />
        <Stat icon={CreditCard} label="Outstanding" value={money(debtOutstanding(d))} />
        <Stat icon={AlertTriangle} label="Overdue" value={overdueRows(d).length} bad={overdueRows(d).length > 0} />
      </div>
      <Card><div className="p-5"><CardTitle className="mb-3">Repayment Schedule</CardTitle>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">No schedule generated</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>#</Th><Th>Due Date</Th><Th className="text-right">Principal</Th><Th className="text-right">Interest</Th><Th className="text-right">Total</Th><Th className="text-right">Paid</Th><Th>Status</Th></tr></thead><tbody>{rows.map((r) => <tr key={r.n} className="border-b border-border"><td className="px-2 py-2">{r.n}</td><td className="px-2 py-2">{fmtDate(r.dueDate)}</td><td className="px-2 py-2 text-right tabular-nums">{money(r.principal)}</td><td className="px-2 py-2 text-right tabular-nums">{money(r.interest)}</td><td className="px-2 py-2 text-right tabular-nums">{money(r.total)}</td><td className="px-2 py-2 text-right tabular-nums">{money(r.paid)}</td><td className="px-2 py-2"><St s={rowStatus(r)} /></td></tr>)}</tbody></table>}
      </div></Card>
      <Card><div className="p-5"><CardTitle className="mb-3">Payment History</CardTitle>
        {payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded yet</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th className="text-right">Amount</Th><Th className="text-right">Principal</Th><Th className="text-right">Interest</Th><Th>Method</Th><Th>Reference</Th></tr></thead><tbody>{payments.map((p, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-2">{fmtDate(p.date)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(p.amount))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(p.principalPart))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(p.interestPart))}</td><td className="px-2 py-2">{String(p.method || "—")}</td><td className="px-2 py-2">{String(p.reference || "—")}</td></tr>)}</tbody></table>}
      </div></Card>
      {d.notes ? <Card><div className="p-5"><CardTitle className="mb-2">Notes</CardTitle><p className="whitespace-pre-wrap text-sm">{String(d.notes)}</p></div></Card> : null}
      <Dialog open={pay.open} onClose={() => setPay({ ...pay, open: false })} title="Record Payment">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount *"><input aria-label="Payment amount" type="number" className={inputCls} value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} /></Field>
          <Field label="Payment Date"><DateInput ariaLabel="Payment Date" value={pay.date} onChange={(v) => setPay({ ...pay, date: v })} /></Field>
          <Field label="Payment Method"><input aria-label="Payment Method" placeholder="e.g. Bank Transfer" className={inputCls} value={pay.method} onChange={(e) => setPay({ ...pay, method: e.target.value })} /></Field>
          <Field label="Reference"><input aria-label="Reference" className={inputCls} value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
          <Field label="Notes" className="sm:col-span-2"><textarea aria-label="Payment notes" rows={2} className={textareaCls} value={pay.notes} onChange={(e) => setPay({ ...pay, notes: e.target.value })} /></Field>
        </div>
        <p className="text-xs text-muted-foreground">Interest due is settled first, then principal.</p>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setPay({ ...pay, open: false })}>Cancel</button><button type="button" className={btn.primary} onClick={save}>Record Payment</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- loans ---------- */

const LOAN_TYPE = (t: unknown) => (t === "WITH_INTEREST" ? "With Interest" : "Interest-Free");

export function LoanDashboard() {
  const loans = useCollection("loans");
  const live = loans.filter((l) => ["DISBURSED", "REPAYING"].includes(String(l.status)));
  const disbursed = loans.filter((l) => ["DISBURSED", "REPAYING", "COMPLETED", "DEFAULTED"].includes(String(l.status)));
  const overdue = live.flatMap((l) => ((l.schedule as ScheduleRow[]) ?? []).filter((r) => rowStatus(r) === "OVERDUE"));
  return (
    <div className="space-y-4">
      <PageHeader title="Loan Management" subtitle="Interest-free and with-interest loans" actions={<Link href="/loan/loans/new" className={btn.primary}><Plus /> New Loan</Link>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={CreditCard} label="Active Loans" value={live.length} sub={`${live.filter((l) => l.loanType !== "WITH_INTEREST").length} interest-free, ${live.filter((l) => l.loanType === "WITH_INTEREST").length} with interest`} />
        <Stat icon={TrendingUp} label="Disbursed" value={money(disbursed.reduce((a, l) => a + num(l.principal), 0))} sub="total principal lent" />
        <Stat icon={Users} label="Outstanding" value={money(loans.reduce((a, l) => a + loanOutstanding(l), 0))} sub={`collected: ${money(loans.reduce((a, l) => a + loanCollected(l), 0))}`} />
        <Stat icon={AlertTriangle} label="Overdue" value={overdue.length} bad sub={`${money(overdue.reduce((a, r) => a + r.total - r.paid, 0))} overdue`} />
      </div>
      <Card><div className="p-5">
        <div className="mb-3 flex items-center justify-between"><CardTitle>Recent Loans</CardTitle><Link href="/loan/loans" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">View All <ArrowRight className="size-3" /></Link></div>
        {loans.length === 0 ? <p className="py-6 text-center text-muted-foreground">No loans yet. Create your first loan to get started.</p> : <table className="w-full text-sm"><tbody>{[...loans].reverse().slice(0, 6).map((l) => <tr key={l.id} className="border-b border-border"><td className="px-2 py-2"><Link className="font-mono text-xs text-primary" href={`/loan/loans/${l.id}`}>{String(l.loanNumber)}</Link></td><td className="px-2 py-2">{String(l.borrowerName)}</td><td className="px-2 py-2">{LOAN_TYPE(l.loanType)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(l.principal))}</td><td className="px-2 py-2"><St s={l.status} /></td></tr>)}</tbody></table>}
      </div></Card>
    </div>
  );
}

export function Loans() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/loan/loans");
  const loans = useCollection("loans");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  if (sub && sub !== "new") return <LoanDetail id={sub} />;
  return (
    <div className="space-y-4">
      <PageHeader title="Loans" subtitle="Manage all loans" actions={<Link href="/loan/loans/new" className={btn.primary}><Plus /> New Loan</Link>} />
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>All Loans</CardTitle><div className="flex gap-2">
          <Select ariaLabel="Status" size="sm" className="w-36" value={status} onChange={setStatus} options={[{ value: "", label: "All Status" }, ...LOAN_STATUSES.map((s) => ({ value: s, label: title(s) }))]} />
          <Select ariaLabel="Type" size="sm" className="w-36" value={type} onChange={setType} options={[{ value: "", label: "All Types" }, { value: "INTEREST_FREE", label: "Interest-Free" }, { value: "WITH_INTEREST", label: "With Interest" }]} />
        </div></div>
        <DataTable rows={loans.filter((l) => (!status || l.status === status) && (!type || l.loanType === type))} emptyText="No loans found." onRowClick={(l) => router.push(`/loan/loans/${l.id}`)} columns={[
          { key: "no", header: "Loan #", cell: (l) => <span className="font-mono text-xs">{String(l.loanNumber)}</span> },
          { key: "b", header: "Borrower", cell: (l) => <span className="font-medium">{String(l.borrowerName)}</span> },
          { key: "t", header: "Type", cell: (l) => LOAN_TYPE(l.loanType) },
          { key: "p", header: "Principal", cell: (l) => money(num(l.principal)) },
          { key: "o", header: "Outstanding", cell: (l) => money(loanOutstanding(l)) },
          { key: "term", header: "Term", cell: (l) => `${num(l.termMonths)} mo · ${title(l.frequency)}` },
          { key: "s", header: "Status", cell: (l) => <St s={l.status} /> },
        ]} />
      </div></Card>
      {sub === "new" && <SidePanel onClose={() => router.push("/loan/loans")}><LoanForm /></SidePanel>}
    </div>
  );
}

function LoanForm() {
  const router = useRouter();
  const [f, setF] = useState({ loanType: "INTEREST_FREE", borrowerName: "", phone: "", email: "", address: "", principal: "", termMonths: "12", frequency: "MONTHLY", interestRate: "", purpose: "", deposit: "", notes: "" });
  const [elig, setElig] = useState<string>("");
  const [err, setErr] = useState("");
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  function check() {
    const r = checkEligibility(num(f.deposit), 0, f.loanType);
    setElig(!num(f.deposit) ? "Enter deposit amount" : r.eligible ? `Eligible under “${r.rule?.name}” — max loan ${r.maxLoan == null ? "no cap" : money(r.maxLoan)}${r.maxRate != null ? `, max rate ${r.maxRate}%` : ""}` : "Not eligible under any active rule");
  }
  function save() {
    try { const l = createLoan({ ...f, principal: num(f.principal), termMonths: num(f.termMonths) || 12, interestRate: f.interestRate === "" ? undefined : num(f.interestRate), depositReference: num(f.deposit) || null }); router.push(`/loan/loans/${l.id}`); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">New Loan</h2>
      <Card><div className="space-y-4 p-5"><CardTitle>Loan Type & Borrower</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Loan Type *" className="sm:col-span-2"><Select ariaLabel="Loan Type" value={f.loanType} onChange={(v) => set({ loanType: v })} options={[{ value: "INTEREST_FREE", label: "Without Interest (Qard Hasan)" }, { value: "WITH_INTEREST", label: "With Interest" }]} /></Field>
          <Field label="Borrower Name *" htmlFor="bn"><input id="bn" className={inputCls} value={f.borrowerName} onChange={(e) => set({ borrowerName: e.target.value })} /></Field>
          <Field label="Phone" htmlFor="ph"><input id="ph" className={inputCls} value={f.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="Email" htmlFor="em"><input id="em" type="email" className={inputCls} value={f.email} onChange={(e) => set({ email: e.target.value })} /></Field>
          <Field label="Address" htmlFor="ad"><input id="ad" className={inputCls} value={f.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        </div>
      </div></Card>
      <Card><div className="space-y-4 p-5"><CardTitle>Loan Details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Principal Amount *" htmlFor="pr"><input id="pr" type="number" min="0" className={inputCls} value={f.principal} onChange={(e) => set({ principal: e.target.value })} /></Field>
          <Field label="Term (months)" htmlFor="tm"><input id="tm" type="number" min="1" className={inputCls} value={f.termMonths} onChange={(e) => set({ termMonths: e.target.value })} /></Field>
          <Field label="Repayment Frequency"><Select ariaLabel="Repayment Frequency" value={f.frequency} onChange={(v) => set({ frequency: v })} options={[{ value: "WEEKLY", label: "Weekly" }, { value: "MONTHLY", label: "Monthly" }, { value: "QUARTERLY", label: "Quarterly" }]} /></Field>
          {f.loanType === "WITH_INTEREST" && <Field label="Interest Rate (% annual)" htmlFor="rt"><input id="rt" type="number" min="0" step="0.01" placeholder={String(loanSettings().defaultRate)} className={inputCls} value={f.interestRate} onChange={(e) => set({ interestRate: e.target.value })} /></Field>}
          <Field label="Purpose" className="sm:col-span-2"><input aria-label="Purpose" className={inputCls} value={f.purpose} onChange={(e) => set({ purpose: e.target.value })} /></Field>
        </div>
      </div></Card>
      <Card><div className="space-y-3 p-5"><CardTitle>Eligibility Check (Optional)</CardTitle>
        <div className="flex items-end gap-2"><Field label="Deposit Reference Amount" className="flex-1"><input aria-label="Deposit Reference Amount" type="number" className={inputCls} value={f.deposit} onChange={(e) => set({ deposit: e.target.value })} /></Field><button type="button" className={btn.outline} onClick={check}>Check Eligibility</button></div>
        {elig && <p className="text-sm">{elig}</p>}
      </div></Card>
      <Field label="Notes"><textarea aria-label="Notes" rows={2} className={textareaCls} value={f.notes} onChange={(e) => set({ notes: e.target.value })} /></Field>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Create Loan</button><Link href="/loan/loans" className={btn.outline}>Cancel</Link></div>
    </div>
  );
}

function LoanDetail({ id }: { id: string }) {
  const loans = useCollection("loans");
  const { node, flash } = useFlash();
  const l = loans.find((x) => x.id === id);
  if (!l) return loans.length ? <p className="p-6 text-sm text-muted-foreground">Loan not found</p> : null;
  const rows = (l.schedule as ScheduleRow[]) ?? [];
  const act = (fn: () => void, msg: string) => { try { fn(); flash(msg); } catch (e) { flash(e instanceof Error ? e.message : "Error", true); } };
  return (
    <div className="space-y-4">
      <Back href="/loan/loans" label="Loans" />
      <PageHeader title={`${l.loanNumber} · ${l.borrowerName}`} subtitle={`${LOAN_TYPE(l.loanType)}${num(l.interestRate) ? ` · ${num(l.interestRate)}%` : ""} · ${num(l.termMonths)} months · ${title(l.frequency)}${l.purpose ? ` · ${l.purpose}` : ""}`} actions={<>
        <St s={l.status} />
        {l.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => act(() => approveLoan(l.id), "Loan approved")}>Approve</button>}
        {l.status === "APPROVED" && <button type="button" className={btn.primary} onClick={() => act(() => disburseLoan(l.id), "Loan disbursed")}>Disburse</button>}
        {["DISBURSED", "REPAYING"].includes(String(l.status)) && <button type="button" className={btn.outline} onClick={() => act(() => updateRecord("loans", l.id, { status: "DEFAULTED" }), "Marked defaulted")}>Mark defaulted</button>}
      </>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat icon={Coins} label="Principal" value={money(num(l.principal))} />
        <Stat icon={Check} label="Collected" value={money(loanCollected(l))} />
        <Stat icon={CreditCard} label="Outstanding" value={money(loanOutstanding(l))} />
      </div>
      <Card><div className="p-5"><CardTitle className="mb-3">Repayment Schedule</CardTitle>
        {rows.length === 0 ? <p className="text-sm text-muted-foreground">The schedule is generated when the loan is disbursed.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>#</Th><Th>Due Date</Th><Th className="text-right">Principal</Th><Th className="text-right">Interest</Th><Th className="text-right">Total Due</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{rows.map((r) => <tr key={r.n} className="border-b border-border"><td className="px-2 py-2">{r.n}</td><td className="px-2 py-2">{fmtDate(r.dueDate)}</td><td className="px-2 py-2 text-right tabular-nums">{money(r.principal)}</td><td className="px-2 py-2 text-right tabular-nums">{money(r.interest)}</td><td className="px-2 py-2 text-right tabular-nums">{money(r.total)}</td><td className="px-2 py-2"><St s={rowStatus(r)} /></td><td className="px-2 py-2">{r.status !== "PAID" && l.status !== "DEFAULTED" && <button type="button" className={btn.smOutline} onClick={() => act(() => payLoanInstalment(l.id, r.n), "Payment recorded")}>Record payment</button>}</td></tr>)}</tbody></table>}
      </div></Card>
      <Card><div className="grid gap-2 p-5 text-sm sm:grid-cols-2">{[["Phone", l.phone], ["Email", l.email], ["Address", l.address], ["Deposit reference", l.depositReference ? money(num(l.depositReference)) : ""], ["Notes", l.notes]].map(([k, v]) => <div key={String(k)}><span className="text-muted-foreground">{String(k)}: </span>{String(v || "—")}</div>)}</div></Card>
      {node}
    </div>
  );
}

export function Eligibility() {
  const rules = useCollection("eligibility-rules");
  const [calc, setCalc] = useState({ deposit: "", months: "", type: "ANY" });
  const [result, setResult] = useState("");
  const [open, setOpen] = useState(false);
  const blank = { name: "", priority: "0", description: "", minDeposit: "", minPeriod: "", multiplier: "", maxLoan: "", maxRate: "", loanType: "ANY" };
  const [f, setF] = useState(blank);
  const { node, flash } = useFlash();
  function check() {
    if (!calc.deposit) return setResult("Enter deposit amount");
    const r = checkEligibility(num(calc.deposit), num(calc.months), calc.type);
    setResult(r.eligible ? `Eligible — “${r.rule?.name}”: max loan ${r.maxLoan == null ? "no cap" : money(r.maxLoan)}${r.maxRate != null && r.maxRate !== "" ? ` · max interest ${r.maxRate}%` : ""}` : "Not eligible under any active rule");
  }
  function create() {
    if (!f.name.trim()) return flash("Rule name is required", true);
    createRecord("eligibility-rules", { name: f.name.trim(), priority: num(f.priority), description: f.description, minDeposit: num(f.minDeposit), minPeriod: num(f.minPeriod), multiplier: f.multiplier ? num(f.multiplier) : null, maxLoan: f.maxLoan ? num(f.maxLoan) : null, maxRate: f.maxRate ? num(f.maxRate) : null, loanType: f.loanType, isActive: true });
    setF(blank); setOpen(false); flash("Rule created");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Eligibility Rules" subtitle="Configure loan eligibility based on deposits" actions={<button type="button" className={open ? btn.outline : btn.primary} onClick={() => setOpen(!open)}>{open ? "Cancel" : <><Plus /> New Rule</>}</button>} />
      <Card><div className="space-y-3 p-5"><CardTitle>Eligibility Calculator</CardTitle>
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Deposit Amount"><input aria-label="Deposit Amount" type="number" placeholder="5000" className={cn(inputCls, "w-40")} value={calc.deposit} onChange={(e) => setCalc({ ...calc, deposit: e.target.value })} /></Field>
          <Field label="Deposit Period (months)"><input aria-label="Deposit Period" type="number" className={cn(inputCls, "w-40")} value={calc.months} onChange={(e) => setCalc({ ...calc, months: e.target.value })} /></Field>
          <Field label="Loan Type"><Select ariaLabel="Calculator loan type" className="w-40" value={calc.type} onChange={(v) => setCalc({ ...calc, type: v })} options={[{ value: "ANY", label: "Any Type" }, { value: "INTEREST_FREE", label: "Interest-Free" }, { value: "WITH_INTEREST", label: "With Interest" }]} /></Field>
          <button type="button" className={btn.primary} onClick={check}>Check</button>
        </div>
        {result && <p className="text-sm">{result}</p>}
      </div></Card>
      {open && <Card><div className="space-y-3 p-5"><CardTitle>New Eligibility Rule</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rule Name *"><input aria-label="Rule Name" placeholder="e.g. Standard Deposit Rule" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Priority" hint="Higher priority rules are checked first"><input aria-label="Priority" type="number" className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea aria-label="Rule description" rows={2} placeholder="Describe the rule..." className={textareaCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Min Deposit Amount"><input aria-label="Min Deposit Amount" type="number" placeholder="1000" className={inputCls} value={f.minDeposit} onChange={(e) => setF({ ...f, minDeposit: e.target.value })} /></Field>
          <Field label="Min Deposit Period (months)"><input aria-label="Min Deposit Period" type="number" className={inputCls} value={f.minPeriod} onChange={(e) => setF({ ...f, minPeriod: e.target.value })} /></Field>
          <Field label="Loan Multiplier" hint="e.g. 2x deposit = max loan"><input aria-label="Loan Multiplier" type="number" step="0.1" className={inputCls} value={f.multiplier} onChange={(e) => setF({ ...f, multiplier: e.target.value })} /></Field>
          <Field label="Max Loan Amount"><input aria-label="Max Loan Amount" type="number" placeholder="No cap" className={inputCls} value={f.maxLoan} onChange={(e) => setF({ ...f, maxLoan: e.target.value })} /></Field>
          <Field label="Max Interest Rate (%)"><input aria-label="Max Interest Rate" type="number" placeholder="No limit" className={inputCls} value={f.maxRate} onChange={(e) => setF({ ...f, maxRate: e.target.value })} /></Field>
          <Field label="Allowed Loan Type"><Select ariaLabel="Allowed Loan Type" value={f.loanType} onChange={(v) => setF({ ...f, loanType: v })} options={[{ value: "ANY", label: "Any Type" }, { value: "INTEREST_FREE", label: "Interest-Free Only" }, { value: "WITH_INTEREST", label: "With Interest Only" }]} /></Field>
        </div>
        <button type="button" className={btn.primary} onClick={create}>Create Rule</button>
      </div></Card>}
      <Card><div className="p-5"><CardTitle className="mb-3">Active Rules</CardTitle>
        {rules.length === 0 ? <p className="text-sm text-muted-foreground">No eligibility rules configured.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Rule Name</Th><Th>Priority</Th><Th>Min Deposit</Th><Th>Min Period</Th><Th>Multiplier</Th><Th>Max Loan</Th><Th>Type</Th><Th>Active</Th><Th /></tr></thead><tbody>{[...rules].sort((a, b) => num(b.priority) - num(a.priority)).map((r) => <tr key={r.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{String(r.name)}</td><td className="px-2 py-2">{num(r.priority)}</td><td className="px-2 py-2">{money(num(r.minDeposit))}</td><td className="px-2 py-2">{num(r.minPeriod)} mo</td><td className="px-2 py-2">{r.multiplier ? `${r.multiplier}x` : "—"}</td><td className="px-2 py-2">{r.maxLoan ? money(num(r.maxLoan)) : "No cap"}</td><td className="px-2 py-2">{r.loanType === "ANY" ? "Any" : LOAN_TYPE(r.loanType)}</td><td className="px-2 py-2"><Switch checked={r.isActive !== false} onChange={(v) => updateRecord("eligibility-rules", r.id, { isActive: v })} label={`Active ${r.name}`} /></td><td className="px-2 py-2 text-right"><button type="button" aria-label={`Delete ${r.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecord("eligibility-rules", r.id)}><X className="size-4" /></button></td></tr>)}</tbody></table>}
      </div></Card>
      {node}
    </div>
  );
}

export function LoanSettings() {
  const accounts = useAccounts();
  const [s, setS] = useState<ReturnType<typeof loanSettings> | null>(null);
  const { node, flash } = useFlash();
  useEffect(() => { const t = setTimeout(() => setS(loanSettings()), 0); return () => clearTimeout(t); }, []);
  if (!s) return null;
  const set = (p: Partial<typeof s>) => setS({ ...s, ...p });
  return (
    <div className="space-y-4">
      <PageHeader title="Loan Settings" />
      <Card><div className="space-y-4 p-5"><CardTitle>Loan Configuration</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Loan Number Prefix"><input aria-label="Loan Number Prefix" className={inputCls} value={s.prefix} onChange={(e) => set({ prefix: e.target.value })} /></Field>
          <Field label="Next Loan Number"><input aria-label="Next Loan Number" type="number" className={inputCls} value={s.nextNumber} onChange={(e) => set({ nextNumber: num(e.target.value) || 1 })} /></Field>
          <Field label="Default Interest Rate (%)"><input aria-label="Default Interest Rate" type="number" step="0.01" className={inputCls} value={s.defaultRate} onChange={(e) => set({ defaultRate: num(e.target.value) })} /></Field>
          <Field label="Max Loan Term (months)"><input aria-label="Max Loan Term" type="number" className={inputCls} value={s.maxTerm} onChange={(e) => set({ maxTerm: num(e.target.value) })} /></Field>
        </div>
      </div></Card>
      <Card><div className="space-y-4 p-5"><CardTitle>GL Posting</CardTitle>
        <Switch checked={s.autoPost} onChange={(v) => set({ autoPost: v })} label="Auto-post to General Ledger" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Loan Receivable Account"><AccountPicker accounts={accounts} types={["ASSET"]} value={s.receivableAccountId} onChange={(v) => set({ receivableAccountId: v })} ariaLabel="Loan Receivable Account" /></Field>
          <Field label="Interest Income Account"><AccountPicker accounts={accounts} types={["REVENUE"]} value={s.incomeAccountId} onChange={(v) => set({ incomeAccountId: v })} ariaLabel="Interest Income Account" /></Field>
          <Field label="Loan Fund Account"><AccountPicker accounts={accounts} types={["ASSET"]} value={s.fundAccountId} onChange={(v) => set({ fundAccountId: v })} ariaLabel="Loan Fund Account" /></Field>
        </div>
        <p className="text-xs text-muted-foreground">Left blank: 1420 Employee Loans & Advances, 4200 Interest Income and 1100 Bank Account.</p>
      </div></Card>
      <button type="button" className={btn.primary} onClick={() => { saveLoanSettings(s); flash("Settings saved"); }}>Save Settings</button>
      {node}
    </div>
  );
}

/* ---------- chit funds ---------- */

const METHOD = (m: unknown) => (m === "DRAW" ? "Draw" : m === "ROTATION" ? "Rotation" : "Auction");
const contributed = (g: Rec) => ((g.rounds as Rec[]) ?? []).reduce((a, r) => a + Object.values((r.contributions as Record<string, boolean>) ?? {}).filter(Boolean).length * num(g.contribution), 0);

export function KuriDashboard() {
  const groups = useCollection("kuri-groups");
  const rounds = groups.flatMap((g) => ((g.rounds as Rec[]) ?? []).filter((r) => r.status === "COMPLETED"));
  return (
    <div className="space-y-4">
      <PageHeader title="Chit Funds" subtitle="Manage rotating savings groups" actions={<Link href="/kuri/groups/new" className={btn.primary}><Plus /> New Group</Link>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Coins} label="Groups" value={groups.filter((g) => g.status === "ACTIVE").length} sub={`active of ${groups.length} total`} />
        <Stat icon={Users} label="Members" value={groups.filter((g) => g.status === "ACTIVE").reduce((a, g) => a + ((g.members as Rec[]) ?? []).length, 0)} sub="active members" />
        <Stat icon={TrendingUp} label="Collected" value={money(groups.reduce((a, g) => a + contributed(g), 0))} sub="total contributions" />
        <Stat icon={CreditCard} label="Paid Out" value={money(rounds.reduce((a, r) => a + num(r.payout), 0))} sub={`commission: ${money(rounds.reduce((a, r) => a + num(r.commission), 0))}`} />
      </div>
      <Card><div className="p-5">
        <div className="mb-3 flex items-center justify-between"><CardTitle>Recent Groups</CardTitle><Link href="/kuri/groups" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">View All <ArrowRight className="size-3" /></Link></div>
        {groups.length === 0 ? <p className="py-6 text-center text-muted-foreground">No groups yet. Create your first chit fund group to get started.</p> : <table className="w-full text-sm"><tbody>{[...groups].reverse().slice(0, 6).map((g) => <tr key={g.id} className="border-b border-border"><td className="px-2 py-2"><Link className="font-mono text-xs text-primary" href={`/kuri/groups/${g.id}`}>{String(g.groupNumber)}</Link></td><td className="px-2 py-2 font-medium">{String(g.name)}</td><td className="px-2 py-2">{((g.members as Rec[]) ?? []).length}/{num(g.totalMembers)} members</td><td className="px-2 py-2 text-right tabular-nums">{money(num(g.contribution))}</td><td className="px-2 py-2"><St s={g.status} /></td></tr>)}</tbody></table>}
      </div></Card>
    </div>
  );
}

export function KuriGroups() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/kuri/groups");
  const groups = useCollection("kuri-groups");
  const [status, setStatus] = useState("");
  if (sub && sub !== "new") return <GroupDetail id={sub} />;
  return (
    <div className="space-y-4">
      <PageHeader title="Chit Fund Groups" subtitle="Manage chit fund groups" actions={<Link href="/kuri/groups/new" className={btn.primary}><Plus /> New Group</Link>} />
      <Card><div className="space-y-3 p-5">
        <div className="flex items-center justify-between"><CardTitle>All Groups</CardTitle><Select ariaLabel="Status" size="sm" className="w-36" value={status} onChange={setStatus} options={[{ value: "", label: "All Status" }, ...["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"].map((s) => ({ value: s, label: title(s) }))]} /></div>
        <DataTable rows={groups.filter((g) => !status || g.status === status)} emptyText="No chit fund groups found." onRowClick={(g) => router.push(`/kuri/groups/${g.id}`)} columns={[
          { key: "no", header: "Group #", cell: (g) => <span className="font-mono text-xs">{String(g.groupNumber)}</span> },
          { key: "n", header: "Name", cell: (g) => <span className="font-medium">{String(g.name)}</span> },
          { key: "c", header: "Contribution", cell: (g) => money(num(g.contribution)) },
          { key: "m", header: "Members", cell: (g) => `${((g.members as Rec[]) ?? []).length}/${num(g.totalMembers)}` },
          { key: "r", header: "Rounds", cell: (g) => `${((g.rounds as Rec[]) ?? []).filter((r) => r.status === "COMPLETED").length}/${num(g.durationMonths)}` },
          { key: "me", header: "Method", cell: (g) => METHOD(g.method) },
          { key: "s", header: "Status", cell: (g) => <St s={g.status} /> },
        ]} />
      </div></Card>
      {sub === "new" && <SidePanel onClose={() => router.push("/kuri/groups")}><GroupForm /></SidePanel>}
    </div>
  );
}

function GroupForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", contribution: "", description: "", totalMembers: "10", durationMonths: "10", method: "AUCTION", commissionPct: "", startDate: todayIso(), endDate: "" });
  const [err, setErr] = useState("");
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  function save() {
    try { const g = createGroup({ ...f, contribution: num(f.contribution), totalMembers: num(f.totalMembers), durationMonths: num(f.durationMonths), commissionPct: f.commissionPct === "" ? kuriSettings().defaultCommission : num(f.commissionPct) }); router.push(`/kuri/groups/${g.id}`); }
    catch (e) { setErr(e instanceof Error ? e.message : "Failed"); }
  }
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">New Chit Fund Group</h2>
      <Card><div className="space-y-4 p-5"><CardTitle>Group Details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Group Name *" htmlFor="gn"><input id="gn" className={inputCls} value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Contribution Amount *" htmlFor="ca"><input id="ca" type="number" min="0" className={inputCls} value={f.contribution} onChange={(e) => set({ contribution: e.target.value })} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea aria-label="Description" rows={2} className={textareaCls} value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
          <Field label="Total Members" htmlFor="tm"><input id="tm" type="number" min="2" className={inputCls} value={f.totalMembers} onChange={(e) => set({ totalMembers: e.target.value, durationMonths: e.target.value })} /></Field>
          <Field label="Duration (months)" htmlFor="du"><input id="du" type="number" min="1" className={inputCls} value={f.durationMonths} onChange={(e) => set({ durationMonths: e.target.value })} /></Field>
          <Field label="Round Method"><Select ariaLabel="Round Method" value={f.method} onChange={(v) => set({ method: v })} options={[{ value: "AUCTION", label: "Auction" }, { value: "DRAW", label: "Draw" }, { value: "ROTATION", label: "Rotation" }]} /></Field>
          <Field label="Commission %" htmlFor="cm"><input id="cm" type="number" min="0" step="0.1" className={inputCls} placeholder={String(kuriSettings().defaultCommission)} value={f.commissionPct} onChange={(e) => set({ commissionPct: e.target.value })} /></Field>
          <Field label="Start Date"><DateInput ariaLabel="Start Date" value={f.startDate} onChange={(v) => set({ startDate: v })} /></Field>
          <Field label="End Date" hint="Optional"><DateInput ariaLabel="End Date" value={f.endDate} onChange={(v) => set({ endDate: v })} /></Field>
        </div>
      </div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Create Group</button><Link href="/kuri/groups" className={btn.outline}>Cancel</Link></div>
    </div>
  );
}

function GroupDetail({ id }: { id: string }) {
  const groups = useCollection("kuri-groups");
  const [member, setMember] = useState({ open: false, name: "", phone: "", email: "" });
  const [round, setRound] = useState<{ n: number; winnerId: string; discount: string } | null>(null);
  const [tab, setTab] = useState<"members" | "rounds" | "contributions">("members");
  const [cr, setCr] = useState(1);
  const { node, flash } = useFlash();
  const g = groups.find((x) => x.id === id);
  if (!g) return groups.length ? <p className="p-6 text-sm text-muted-foreground">Group not found</p> : null;
  const members = (g.members as Rec[]) ?? [];
  const rounds = (g.rounds as Rec[]) ?? [];
  const act = (fn: () => void, msg: string) => { try { fn(); flash(msg); return true; } catch (e) { flash(e instanceof Error ? e.message : "Error", true); return false; } };
  const nextRound = rounds.find((r) => r.status === "PENDING");
  const fig = roundFigures(g, round ? num(round.discount) : 0);
  const name = (mid: unknown) => String(members.find((m) => m.id === mid)?.name ?? "—");
  const curRound = rounds.find((r) => r.n === cr);
  return (
    <div className="space-y-4">
      <Back href="/kuri/groups" label="Groups" />
      <PageHeader title={`${g.groupNumber} · ${g.name}`} subtitle={`${money(num(g.contribution))} per member per round · ${METHOD(g.method)} · ${num(g.commissionPct)}% commission`} actions={<>
        <St s={g.status} />
        {g.status === "DRAFT" && <button type="button" className={btn.outline} onClick={() => setMember({ ...member, open: true })}><Plus /> Add member</button>}
        {g.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => act(() => activateGroup(g.id), "Group activated — rounds have been generated")}>Activate</button>}
        {g.status === "ACTIVE" && nextRound && <button type="button" className={btn.primary} onClick={() => setRound({ n: num(nextRound.n), winnerId: g.method === "AUCTION" ? "" : pickWinner(g), discount: "" })}>Conduct Round {num(nextRound.n)}</button>}
        {["DRAFT", "ACTIVE"].includes(String(g.status)) && <button type="button" className={btn.outline} onClick={() => confirm("Cancel this group?") && updateRecord("kuri-groups", g.id, { status: "CANCELLED" })}>Cancel group</button>}
      </>} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat icon={Users} label="Members" value={`${members.length}/${num(g.totalMembers)}`} />
        <Stat icon={Coins} label="Pool" value={money(num(g.contribution) * members.length)} sub="per round" />
        <Stat icon={TrendingUp} label="Contributed" value={money(contributed(g))} />
        <Stat icon={CreditCard} label="Rounds" value={`${rounds.filter((r) => r.status === "COMPLETED").length}/${num(g.durationMonths)}`} />
      </div>
      <div className="flex gap-1 rounded-lg bg-muted p-1 w-fit">{(["members", "rounds", "contributions"] as const).map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-md px-3 py-1 text-sm capitalize", tab === t ? "bg-background font-medium shadow" : "text-muted-foreground")}>{t}</button>)}</div>
      {tab === "members" && <Card><div className="p-5">{members.length === 0 ? <p className="text-sm text-muted-foreground">No members yet</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>#</Th><Th>Name</Th><Th>Phone</Th><Th>Email</Th><Th>Received</Th><Th>Status</Th></tr></thead><tbody>{members.map((m, i) => <tr key={String(m.id)} className="border-b border-border"><td className="px-2 py-2">{i + 1}</td><td className="px-2 py-2 font-medium">{String(m.name)}</td><td className="px-2 py-2">{String(m.phone || "—")}</td><td className="px-2 py-2">{String(m.email || "—")}</td><td className="px-2 py-2">{m.won ? `Round ${m.won}` : "—"}</td><td className="px-2 py-2"><St s={m.status} /></td></tr>)}</tbody></table>}</div></Card>}
      {tab === "rounds" && <Card><div className="p-5">{rounds.length === 0 ? <p className="text-sm text-muted-foreground">Rounds are generated when the group is activated.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Round</Th><Th>Date</Th><Th>Winner</Th><Th className="text-right">Pool</Th><Th className="text-right">Auction Discount</Th><Th className="text-right">Commission</Th><Th className="text-right">Payout</Th><Th>Status</Th></tr></thead><tbody>{rounds.map((r) => <tr key={num(r.n)} className="border-b border-border"><td className="px-2 py-2">{num(r.n)}</td><td className="px-2 py-2">{fmtDate(r.conductedAt ?? r.date)}</td><td className="px-2 py-2">{r.winnerId ? name(r.winnerId) : "—"}</td><td className="px-2 py-2 text-right tabular-nums">{r.pool ? money(num(r.pool)) : "—"}</td><td className="px-2 py-2 text-right tabular-nums">{r.status === "COMPLETED" ? money(num(r.auctionDiscount)) : "—"}</td><td className="px-2 py-2 text-right tabular-nums">{r.commission != null ? money(num(r.commission)) : "—"}</td><td className="px-2 py-2 text-right tabular-nums">{r.payout ? money(num(r.payout)) : "—"}</td><td className="px-2 py-2"><St s={r.status} /></td></tr>)}</tbody></table>}</div></Card>}
      {tab === "contributions" && <Card><div className="space-y-3 p-5">
        {rounds.length === 0 ? <p className="text-sm text-muted-foreground">Rounds are generated when the group is activated.</p> : <>
          <Field label="Round"><Select ariaLabel="Contribution round" className="w-40" value={String(cr)} onChange={(v) => setCr(num(v))} options={rounds.map((r) => ({ value: String(r.n), label: `Round ${r.n}` }))} /></Field>
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Member</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{members.map((m) => { const paid = Boolean(((curRound?.contributions as Record<string, boolean>) ?? {})[String(m.id)]); return <tr key={String(m.id)} className="border-b border-border"><td className="px-2 py-2">{String(m.name)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(g.contribution))}</td><td className="px-2 py-2">{paid ? <Badge tone="success">Received</Badge> : <Badge>Pending</Badge>}</td><td className="px-2 py-2">{!paid && g.status === "ACTIVE" && <button type="button" className={btn.smOutline} onClick={() => act(() => markContribution(g.id, cr, String(m.id)), "Contribution marked as paid")}>Mark paid</button>}</td></tr>; })}</tbody></table>
        </>}
      </div></Card>}
      <Dialog open={member.open} onClose={() => setMember({ ...member, open: false })} title="Add member">
        <div className="grid gap-3">
          <Field label="Name *"><input aria-label="Member name" placeholder="Full name" className={inputCls} value={member.name} onChange={(e) => setMember({ ...member, name: e.target.value })} /></Field>
          <Field label="Phone"><input aria-label="Member phone" placeholder="+1 416 555 0123" className={inputCls} value={member.phone} onChange={(e) => setMember({ ...member, phone: e.target.value })} /></Field>
          <Field label="Email"><input aria-label="Member email" placeholder="email@example.com" className={inputCls} value={member.email} onChange={(e) => setMember({ ...member, email: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setMember({ ...member, open: false })}>Cancel</button><button type="button" className={btn.primary} onClick={() => act(() => addMember(g.id, member), "Member added") && setMember({ open: false, name: "", phone: "", email: "" })}>Add</button></div>
      </Dialog>
      <Dialog open={!!round} onClose={() => setRound(null)} title={`Conduct Round ${round?.n ?? ""}`} description={`${METHOD(g.method)} — pool ${money(fig.pool)}, commission ${money(fig.commission)}.`}>
        {round && <div className="grid gap-3">
          <Field label="Winner *"><div className="flex gap-2"><Select ariaLabel="Winner" className="flex-1" value={round.winnerId} onChange={(v) => setRound({ ...round, winnerId: v })} placeholder="Select winner..." options={members.filter((m) => !m.won).map((m) => ({ value: String(m.id), label: String(m.name) }))} />{g.method === "DRAW" && <button type="button" className={btn.outline} onClick={() => setRound({ ...round, winnerId: pickWinner(g) })}><Dices /> Draw</button>}</div></Field>
          {g.method === "AUCTION" && <Field label="Auction Discount" hint="The amount the winner bids away; it stays with the group as a dividend."><input aria-label="Auction Discount" type="number" min="0" placeholder="0.00" className={inputCls} value={round.discount} onChange={(e) => setRound({ ...round, discount: e.target.value })} /></Field>}
          <p className="text-sm">Payout: <span className="font-semibold">{money(fig.payout)}</span></p>
        </div>}
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setRound(null)}>Cancel</button><button type="button" className={btn.primary} onClick={() => { if (!round) return; if (!round.winnerId) return flash("Select a winner", true); if (act(() => conductRound(g.id, round.n, round.winnerId, num(round.discount)), "Round completed")) setRound(null); }}>Conduct</button></div>
      </Dialog>
      {node}
    </div>
  );
}

export function KuriSettings() {
  const accounts = useAccounts();
  const [s, setS] = useState<ReturnType<typeof kuriSettings> | null>(null);
  const { node, flash } = useFlash();
  useEffect(() => { const t = setTimeout(() => setS(kuriSettings()), 0); return () => clearTimeout(t); }, []);
  if (!s) return null;
  const set = (p: Partial<typeof s>) => setS({ ...s, ...p });
  return (
    <div className="space-y-4">
      <PageHeader title="Chit Fund Settings" />
      <Card><div className="space-y-4 p-5"><CardTitle>Group Configuration</CardTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Group Number Prefix"><input aria-label="Group Number Prefix" className={inputCls} value={s.prefix} onChange={(e) => set({ prefix: e.target.value })} /></Field>
          <Field label="Next Group Number"><input aria-label="Next Group Number" type="number" className={inputCls} value={s.nextNumber} onChange={(e) => set({ nextNumber: num(e.target.value) || 1 })} /></Field>
          <Field label="Default Commission %"><input aria-label="Default Commission" type="number" step="0.1" className={inputCls} value={s.defaultCommission} onChange={(e) => set({ defaultCommission: num(e.target.value) })} /></Field>
        </div>
      </div></Card>
      <Card><div className="space-y-4 p-5"><CardTitle>GL Posting</CardTitle>
        <Switch checked={s.autoPost} onChange={(v) => set({ autoPost: v })} label="Auto-post to General Ledger" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Chit Fund Account" hint="Holds members' contributions until paid out (default 2310 Chit Fund Pool)."><AccountPicker accounts={accounts} types={["LIABILITY"]} value={s.fundAccountId} onChange={(v) => set({ fundAccountId: v })} ariaLabel="Chit Fund Account" /></Field>
          <Field label="Commission Income Account" hint="Default 4120 Chit Fund Commission."><AccountPicker accounts={accounts} types={["REVENUE"]} value={s.commissionAccountId} onChange={(v) => set({ commissionAccountId: v })} ariaLabel="Commission Income Account" /></Field>
        </div>
      </div></Card>
      <button type="button" className={btn.primary} onClick={() => { saveKuriSettings(s); flash("Settings saved"); }}>Save Settings</button>
      {node}
    </div>
  );
}

/* ---------- currency ---------- */

function useCurrencies() {
  const list = useCollection("currencies");
  useEffect(() => { const t = setTimeout(seedCurrencies, 0); return () => clearTimeout(t); }, []);
  return list;
}
const curOpts = (list: Rec[]) => list.filter((c) => c.isActive !== false).map((c) => ({ value: String(c.code), label: `${c.code} - ${c.name}` }));

export function Currencies() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/currency/currencies");
  const list = useCurrencies();
  const close = () => router.push("/currency/currencies");
  const sel = list.find((c) => c.id === sub);
  return (
    <div className="space-y-4">
      <PageHeader title="Currencies" subtitle="Manage currencies for multi-currency transactions" actions={<Link href="/currency/currencies/new" className={btn.primary}><Plus /> New Currency</Link>} />
      <DataTable rows={[...list].sort((a, b) => Number(Boolean(b.isBase)) - Number(Boolean(a.isBase)))} onRowClick={(c) => router.push(`/currency/currencies/${c.id}`)} columns={[
        { key: "c", header: "Code", cell: (c) => <span className="font-semibold">{String(c.code)}</span> },
        { key: "n", header: "Name", cell: (c) => String(c.name) },
        { key: "s", header: "Symbol", cell: (c) => String(c.symbol) },
        { key: "d", header: "Decimal Places", cell: (c) => num(c.decimals) },
        { key: "b", header: "Base", cell: (c) => (c.isBase ? <Badge tone="primary">BASE</Badge> : "") },
        { key: "a", header: "Active", cell: (c) => <Badge tone={c.isActive === false ? "muted" : "success"}>{c.isActive === false ? "Inactive" : "Active"}</Badge> },
      ]} menu={(c) => [{ label: "Edit", onSelect: () => router.push(`/currency/currencies/${c.id}`) }, ...(c.isBase ? [] : [{ label: c.isActive === false ? "Activate" : "Deactivate", onSelect: () => updateRecord("currencies", c.id, { isActive: c.isActive === false }) }])]} />
      {(sub === "new" || sel) && <SidePanel onClose={close}><CurrencyForm key={sub} record={sel} onDone={close} /></SidePanel>}
    </div>
  );
}

function CurrencyForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const list = useCollection("currencies");
  const [f, setF] = useState({ code: String(record?.code ?? ""), name: String(record?.name ?? ""), symbol: String(record?.symbol ?? ""), decimals: String(record?.decimals ?? "2"), isActive: record?.isActive !== false, isBase: Boolean(record?.isBase) });
  const [err, setErr] = useState("");
  function save() {
    const code = f.code.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) return setErr("Currency code must be 3 letters");
    if (!f.name.trim()) return setErr("Currency name is required");
    if (list.some((c) => c.code === code && c.id !== record?.id)) return setErr(`${code} already exists`);
    if (f.isBase && !record?.isBase) return setErr(`The base currency is ${BASE} — it's fixed once the books have entries.`);
    const data = { code, name: f.name.trim(), symbol: f.symbol, decimals: num(f.decimals), isActive: f.isActive, isBase: Boolean(record?.isBase) };
    if (record) updateRecord("currencies", record.id, data); else createRecord("currencies", data);
    onDone();
  }
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">{record ? `Edit ${record.code}` : "New Currency"}</h2><p className="text-sm text-muted-foreground">Add a new currency to the system</p></div>
      <Card><div className="space-y-4 p-5"><CardTitle>Currency Details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Currency Code"><input aria-label="Currency Code" maxLength={3} disabled={!!record} className={inputCls} value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /></Field>
          <Field label="Currency Name"><input aria-label="Currency Name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Symbol"><input aria-label="Symbol" className={inputCls} value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })} /></Field>
          <Field label="Decimal Places"><input aria-label="Decimal Places" type="number" min="0" max="4" className={inputCls} value={f.decimals} onChange={(e) => setF({ ...f, decimals: e.target.value })} /></Field>
        </div>
        <Switch checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} label="Active" />
        <Switch checked={f.isBase} onChange={(v) => setF({ ...f, isBase: v })} label="Base Currency" />
      </div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{record ? "Save Changes" : "Create Currency"}</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
    </div>
  );
}

export function ExchangeRates() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/currency/exchange-rates");
  const list = useCurrencies();
  const rates = useCollection("exchange-rates");
  const [f, setF] = useState({ from: "", to: BASE, rate: "", effectiveDate: todayIso(), source: "MANUAL" });
  const [err, setErr] = useState("");
  const close = () => router.push("/currency/exchange-rates");
  function save() {
    if (!f.from || !f.to || f.from === f.to) return setErr("Pick two different currencies");
    if (!(num(f.rate) > 0)) return setErr("Enter a rate greater than 0");
    createRecord("exchange-rates", { ...f, rate: num(f.rate) });
    setF({ from: "", to: BASE, rate: "", effectiveDate: todayIso(), source: "MANUAL" }); setErr(""); close();
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Exchange Rates" subtitle="View and manage currency exchange rates" actions={<Link href="/currency/exchange-rates/new" className={btn.primary}><Plus /> New Rate</Link>} />
      <DataTable rows={[...rates].sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate)))} columns={[
        { key: "f", header: "From", cell: (r) => <span className="font-semibold">{String(r.from)}</span> },
        { key: "t", header: "To", cell: (r) => String(r.to) },
        { key: "r", header: "Rate", cell: (r) => <span className="tabular-nums">{num(r.rate).toFixed(6)}</span> },
        { key: "d", header: "Effective Date", cell: (r) => fmtDate(r.effectiveDate) },
        { key: "s", header: "Source", cell: (r) => String(r.source) },
      ]} menu={(r) => [{ label: "Delete", destructive: true, onSelect: () => deleteRecord("exchange-rates", r.id) }]} />
      {sub === "new" && <SidePanel onClose={close}>
        <div className="space-y-5">
          <div><h2 className="text-xl font-semibold">New Exchange Rate</h2><p className="text-sm text-muted-foreground">Add a new currency exchange rate</p></div>
          <Card><div className="space-y-4 p-5"><CardTitle>Exchange Rate Details</CardTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="From Currency"><Select ariaLabel="From Currency" value={f.from} onChange={(v) => setF({ ...f, from: v })} placeholder="Select currency" options={curOpts(list)} /></Field>
              <Field label="To Currency"><Select ariaLabel="To Currency" value={f.to} onChange={(v) => setF({ ...f, to: v })} placeholder="Select currency" options={curOpts(list)} /></Field>
              <Field label="Exchange Rate"><input aria-label="Exchange Rate" type="number" step="0.000001" className={inputCls} value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></Field>
              <Field label="Effective Date"><DateInput ariaLabel="Effective Date" value={f.effectiveDate} onChange={(v) => setF({ ...f, effectiveDate: v })} /></Field>
              <Field label="Source"><Select ariaLabel="Source" value={f.source} onChange={(v) => setF({ ...f, source: v })} options={[{ value: "MANUAL", label: "MANUAL" }, { value: "API", label: "API" }, { value: "BANK", label: "BANK" }]} /></Field>
            </div>
          </div></Card>
          {err && <p className="text-sm text-destructive">{err}</p>}
          <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Create Exchange Rate</button><button type="button" className={btn.outline} onClick={close}>Cancel</button></div>
        </div>
      </SidePanel>}
    </div>
  );
}

export function Converter() {
  const list = useCurrencies();
  useCollection("exchange-rates");
  const [f, setF] = useState({ amount: "", from: "", to: "" });
  const [out, setOut] = useState<{ text: string; bad?: boolean } | null>(null);
  function convert() {
    if (!f.amount || !f.from || !f.to) return setOut({ text: "Missing fields — please fill in all fields", bad: true });
    const r = rateOn(f.from, f.to);
    if (r == null) return setOut({ text: `No rate found for ${f.from} → ${f.to}`, bad: true });
    setOut({ text: `${num(f.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} ${f.from} = ${(num(f.amount) * r).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} ${f.to}  ·  1 ${f.from} = ${r.toFixed(6)} ${f.to}` });
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Currency Converter" subtitle="Convert between currencies using the latest exchange rates" />
      <Card className="max-w-xl"><div className="space-y-4 p-5"><CardTitle>Convert Currency</CardTitle>
        <Field label="Amount"><input aria-label="Amount" type="number" placeholder="Enter amount" className={inputCls} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From"><Select ariaLabel="From" value={f.from} onChange={(v) => setF({ ...f, from: v })} placeholder="Select" options={curOpts(list)} /></Field>
          <Field label="To"><Select ariaLabel="To" value={f.to} onChange={(v) => setF({ ...f, to: v })} placeholder="Select" options={curOpts(list)} /></Field>
        </div>
        <button type="button" className={btn.primary} onClick={convert}>Convert</button>
        {out && <p role="status" className={cn("rounded-md border p-3 text-sm", out.bad ? "border-destructive/30 text-destructive" : "border-border font-medium")}>{out.text}</p>}
      </div></Card>
    </div>
  );
}

export function Revaluations() {
  const list = useCurrencies();
  const revals = useCollection("revaluations");
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ date: todayIso(), from: "", to: BASE, rate: "" });
  const { node, flash } = useFlash();
  function run() {
    try { const r = runRevaluation({ ...f, rate: num(f.rate) }); setOpen(false); flash(r.documents ? `Revaluation completed — ${r.documents} document(s), ${money(num(r.gainLoss))}` : "Revaluation completed — nothing to restate"); }
    catch (e) { flash(e instanceof Error ? e.message : "Error", true); }
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Revaluations" subtitle="Foreign currency revaluation history" actions={<button type="button" className={btn.primary} onClick={() => { setOpen(true); }}>Run Revaluation</button>} />
      <DataTable rows={[...revals].reverse()} columns={[
        { key: "d", header: "Date", cell: (r) => `${fmtDate(r.date)} · ${r.from}→${r.to} @ ${num(r.rate)}` },
        { key: "n", header: "Documents revalued", cell: (r) => num(r.documents) },
        { key: "g", header: "Unrealized gain/loss", cell: (r) => <span className={num(r.gainLoss) < 0 ? "text-destructive" : num(r.gainLoss) > 0 ? "text-success" : ""}>{money(num(r.gainLoss))}</span> },
        { key: "j", header: "Journal Entry", cell: (r) => (r.journalId ? <Link className="text-primary underline" href={`/financial/journal-entries/${r.journalId}`}>View JE (auto-reverses next day)</Link> : <span className="text-muted-foreground">nothing to restate</span>) },
      ]} />
      <Dialog open={open} onClose={() => setOpen(false)} title="Run Revaluation" description="Revalue foreign currency balances at a new exchange rate">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Revaluation Date" className="sm:col-span-2"><DateInput ariaLabel="Revaluation Date" value={f.date} onChange={(v) => setF({ ...f, date: v })} /></Field>
          <Field label="From Currency"><Select ariaLabel="From Currency" value={f.from} onChange={(v) => setF({ ...f, from: v, rate: String(rateOn(v, f.to, f.date) ?? "") })} placeholder="Select currency" options={curOpts(list).filter((c) => c.value !== BASE)} /></Field>
          <Field label="To Currency"><Select ariaLabel="To Currency" value={f.to} onChange={(v) => setF({ ...f, to: v })} placeholder="Select currency" options={curOpts(list)} /></Field>
          <Field label="Exchange Rate" className="sm:col-span-2"><input aria-label="Exchange Rate" type="number" step="0.0001" placeholder="e.g., 1.2500" className={inputCls} value={f.rate} onChange={(e) => setF({ ...f, rate: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setOpen(false)}>Cancel</button><button type="button" className={btn.primary} onClick={run}>Run Revaluation</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- budgets ---------- */

export function Budgets() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/budgets");
  const budgets = useCollection("budgets");
  const [status, setStatus] = useState("");
  if (sub && sub !== "new") return <BudgetDetail id={sub} />;
  return (
    <div className="space-y-4">
      <PageHeader title="Budgets" subtitle="Create and manage organizational budgets" actions={<Link href="/budgets/new" className={btn.primary}><Plus /> New Budget</Link>} />
      <Select ariaLabel="Status" className="w-44" value={status} onChange={setStatus} options={[{ value: "", label: "All Statuses" }, ...["DRAFT", "APPROVED", "ACTIVE", "CLOSED"].map((s) => ({ value: s, label: s }))]} />
      <DataTable rows={budgets.filter((b) => !status || b.status === status)} onRowClick={(b) => router.push(`/budgets/${b.id}`)} columns={[
        { key: "n", header: "Name", cell: (b) => <span className="font-medium">{String(b.name)}</span> },
        { key: "fy", header: "Fiscal Year", cell: (b) => String(b.fiscalYear) },
        { key: "p", header: "Period Type", cell: (b) => String(b.periodType) },
        { key: "s", header: "Status", cell: (b) => <St s={b.status} /> },
        { key: "t", header: "Total Amount", cell: (b) => money(budgetTotal(b)) },
      ]} />
      {sub === "new" && <SidePanel onClose={() => router.push("/budgets")}><BudgetForm /></SidePanel>}
    </div>
  );
}

function BudgetForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", description: "", fiscalYear: todayIso().slice(0, 4), periodType: "", warningThreshold: "80", criticalThreshold: "100", notes: "" });
  const [err, setErr] = useState("");
  function save() {
    if (!f.name.trim() || !/^\d{4}$/.test(f.fiscalYear)) return setErr("Please provide a name and fiscal year");
    if (!f.periodType) return setErr("Select period type");
    const b = createRecord("budgets", { ...f, name: f.name.trim(), warningThreshold: num(f.warningThreshold), criticalThreshold: num(f.criticalThreshold), status: "DRAFT", revision: 1, lines: [], history: [{ date: new Date().toISOString(), action: "Created", revision: 1, total: 0 }] });
    router.push(`/budgets/${b.id}`);
  }
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">New Budget</h2><p className="text-sm text-muted-foreground">Create a new budget for a fiscal year</p></div>
      <Card><div className="space-y-4 p-5"><CardTitle>Budget Details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Budget Name" className="sm:col-span-2"><input aria-label="Budget Name" placeholder="e.g., Operating Budget 2026" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea aria-label="Description" rows={2} placeholder="Optional description" className={textareaCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Fiscal Year"><input aria-label="Fiscal Year" type="number" className={inputCls} value={f.fiscalYear} onChange={(e) => setF({ ...f, fiscalYear: e.target.value })} /></Field>
          <Field label="Period Type"><Select ariaLabel="Period Type" value={f.periodType} onChange={(v) => setF({ ...f, periodType: v })} placeholder="Select period type" options={Object.keys(PERIODS).map((p) => ({ value: p, label: p }))} /></Field>
          <Field label="Warning Threshold (%)"><input aria-label="Warning Threshold" type="number" className={inputCls} value={f.warningThreshold} onChange={(e) => setF({ ...f, warningThreshold: e.target.value })} /></Field>
          <Field label="Critical Threshold (%)"><input aria-label="Critical Threshold" type="number" className={inputCls} value={f.criticalThreshold} onChange={(e) => setF({ ...f, criticalThreshold: e.target.value })} /></Field>
          <Field label="Notes" className="sm:col-span-2"><textarea aria-label="Notes" rows={2} placeholder="Optional notes" className={textareaCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
        </div>
      </div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Create Budget</button><Link href="/budgets" className={btn.outline}>Cancel</Link></div>
    </div>
  );
}

const LEVEL = { OK: "bg-success", WARNING: "bg-warning", CRITICAL: "bg-destructive" } as Record<string, string>;

function BudgetDetail({ id }: { id: string }) {
  const router = useRouter();
  const budgets = useCollection("budgets");
  const accounts = useAccounts();
  useCollection("journal-entries");
  const [line, setLine] = useState({ open: false, accountId: "", amount: "", notes: "" });
  const [clone, setClone] = useState({ open: false, name: "", fiscalYear: "" });
  const { node, flash } = useFlash();
  const b = budgets.find((x) => x.id === id);
  if (!b) return budgets.length ? <p className="p-6 text-sm text-muted-foreground">Budget not found</p> : null;
  const lines = (b.lines as Rec[]) ?? [];
  const draft = b.status === "DRAFT";
  const rows = budgetActuals(b);
  const total = budgetTotal(b), spent = rows.reduce((a, r) => a + r.actual, 0);
  const util = total ? (spent / total) * 100 : 0;
  const per = PERIODS[String(b.periodType) as keyof typeof PERIODS] ?? 1;
  const accLabel = (aid: unknown) => { const a = accounts.find((x) => x.id === aid); return a ? `${a.code} - ${a.name}` : "—"; };
  const history = (b.history as Rec[]) ?? [];
  return (
    <div className="space-y-4">
      <Back href="/budgets" label="Budgets" />
      <PageHeader title={String(b.name)} subtitle={`Fiscal Year ${b.fiscalYear} · ${b.periodType} · Revision ${num(b.revision) || 1}${b.description ? ` · ${b.description}` : ""}`} actions={<>
        <St s={b.status} />
        {draft && <button type="button" className={btn.primary} disabled={!lines.length} onClick={() => { setBudgetStatus(b.id, "APPROVED"); flash("Budget approved"); }}>Approve</button>}
        {b.status === "APPROVED" && <button type="button" className={btn.primary} onClick={() => { setBudgetStatus(b.id, "ACTIVE"); flash("Budget activated"); }}>Activate</button>}
        {b.status === "ACTIVE" && <button type="button" className={btn.outline} onClick={() => { setBudgetStatus(b.id, "CLOSED"); flash("Budget closed"); }}>Close</button>}
        {["APPROVED", "ACTIVE", "CLOSED"].includes(String(b.status)) && <button type="button" className={btn.outline} onClick={() => { setBudgetStatus(b.id, "DRAFT"); flash("Budget reopened for revision"); }}>Reopen</button>}
        <button type="button" className={btn.outline} onClick={() => setClone({ open: true, name: `${b.name} (copy)`, fiscalYear: String(num(b.fiscalYear) + 1) })}>Clone Budget</button>
      </>} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat icon={Coins} label="Total Budget" value={money(total)} />
        <Stat icon={CreditCard} label="Spent" value={money(spent)} />
        <Stat icon={TrendingUp} label="Variance" value={money(total - spent)} bad={total - spent < 0} />
        <Card><div className="p-4"><p className="text-sm text-muted-foreground">Overall Utilization</p><p className="mt-1 text-2xl font-bold">{util.toFixed(1)}%</p><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full", util >= num(b.criticalThreshold || 100) ? "bg-destructive" : util >= num(b.warningThreshold || 80) ? "bg-warning" : "bg-success")} style={{ width: `${Math.min(100, util)}%` }} /></div><p className="mt-1 text-xs text-muted-foreground">Thresholds: {num(b.warningThreshold)}% / {num(b.criticalThreshold)}%</p></div></Card>
      </div>
      <Card><div className="p-5">
        <div className="mb-3 flex items-center justify-between"><CardTitle>Budget Lines</CardTitle>{draft && <button type="button" className={btn.smOutline} onClick={() => setLine({ ...line, open: true })}><Plus /> Add Budget Line</button>}</div>
        {lines.length === 0 ? <p className="text-sm text-muted-foreground">No lines yet — add the accounts you&apos;re budgeting for.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Account</Th><Th className="text-right">Budget</Th><Th className="text-right">Per {b.periodType === "MONTHLY" ? "month" : b.periodType === "QUARTERLY" ? "quarter" : "year"}</Th><Th>Notes</Th><Th>Action</Th></tr></thead><tbody>{lines.map((l, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-2">{accLabel(l.accountId)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(l.amount))}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(l.amount) / per)}</td><td className="px-2 py-2">{String(l.notes || "—")}</td><td className="px-2 py-2">{draft && <button type="button" aria-label="Remove line" className="text-muted-foreground hover:text-destructive" onClick={() => { updateRecord("budgets", b.id, { lines: lines.filter((_, j) => j !== i) }); flash("Budget line removed"); }}><X className="size-4" /></button>}</td></tr>)}</tbody></table>}
      </div></Card>
      <Card><div className="p-5"><CardTitle className="mb-3">Budget vs Actual</CardTitle>
        {["DRAFT", "APPROVED"].includes(String(b.status)) || !lines.length ? <p className="text-sm text-muted-foreground">No variance data available. Approve and activate the budget first.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Account</Th><Th className="text-right">Budget</Th><Th className="text-right">Actual</Th><Th className="text-right">Variance</Th><Th className="text-right">Variance %</Th><Th>Utilization</Th></tr></thead><tbody>{rows.map((r, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-2">{accLabel(r.accountId)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(r.amount))}</td><td className="px-2 py-2 text-right tabular-nums">{money(r.actual)}</td><td className={cn("px-2 py-2 text-right tabular-nums", r.variance < 0 && "text-destructive")}>{money(r.variance)}</td><td className="px-2 py-2 text-right tabular-nums">{r.variancePct.toFixed(1)}%</td><td className="px-2 py-2"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-muted"><div className={cn("h-full", LEVEL[r.level])} style={{ width: `${Math.min(100, r.utilization)}%` }} /></div><span className="text-xs">{r.utilization.toFixed(0)}%</span></div></td></tr>)}</tbody></table>}
      </div></Card>
      <Card><div className="p-5"><CardTitle className="mb-3">Revision</CardTitle>
        {history.length === 0 ? <p className="text-sm text-muted-foreground">No revision history yet.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>Action</Th><Th>Revision</Th><Th className="text-right">Total</Th></tr></thead><tbody>{[...history].reverse().map((h, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-2">{fmtDate(h.date)}</td><td className="px-2 py-2">{String(h.action)}</td><td className="px-2 py-2">{num(h.revision)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(h.total))}</td></tr>)}</tbody></table>}
      </div></Card>
      {b.notes ? <Card><div className="p-5"><CardTitle className="mb-2">Notes</CardTitle><p className="whitespace-pre-wrap text-sm">{String(b.notes)}</p></div></Card> : null}
      <Dialog open={line.open} onClose={() => setLine({ ...line, open: false })} title="Add Budget Line">
        <div className="grid gap-3">
          <Field label="Account"><AccountPicker accounts={accounts} types={["EXPENSE", "REVENUE"]} value={line.accountId} onChange={(v) => setLine({ ...line, accountId: v })} ariaLabel="Budget account" /></Field>
          <Field label="Amount" hint={`Annual amount — split evenly across ${per} period(s).`}><input aria-label="Budget amount" type="number" placeholder="0.00" className={inputCls} value={line.amount} onChange={(e) => setLine({ ...line, amount: e.target.value })} /></Field>
          <Field label="Notes"><input aria-label="Line notes" className={inputCls} value={line.notes} onChange={(e) => setLine({ ...line, notes: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setLine({ ...line, open: false })}>Cancel</button><button type="button" className={btn.primary} onClick={() => { if (!line.accountId) return flash("Please select an account", true); if (lines.some((l) => l.accountId === line.accountId)) return flash("That account already has a line", true); updateRecord("budgets", b.id, { lines: [...lines, { accountId: line.accountId, amount: num(line.amount), notes: line.notes }] }); setLine({ open: false, accountId: "", amount: "", notes: "" }); flash("Budget line added"); }}>Add</button></div>
      </Dialog>
      <Dialog open={clone.open} onClose={() => setClone({ ...clone, open: false })} title="Clone Budget">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Budget Name"><input aria-label="Clone name" className={inputCls} value={clone.name} onChange={(e) => setClone({ ...clone, name: e.target.value })} /></Field>
          <Field label="Fiscal Year"><input aria-label="Clone fiscal year" type="number" className={inputCls} value={clone.fiscalYear} onChange={(e) => setClone({ ...clone, fiscalYear: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setClone({ ...clone, open: false })}>Cancel</button><button type="button" className={btn.primary} onClick={() => { if (!clone.name.trim() || !/^\d{4}$/.test(clone.fiscalYear)) return flash("Please provide a name and fiscal year", true); const c = createRecord("budgets", { name: clone.name.trim(), description: b.description, fiscalYear: clone.fiscalYear, periodType: b.periodType, warningThreshold: b.warningThreshold, criticalThreshold: b.criticalThreshold, notes: b.notes, status: "DRAFT", revision: 1, lines, history: [{ date: new Date().toISOString(), action: `Cloned from ${b.name}`, revision: 1, total }] }); setClone({ ...clone, open: false }); flash("Budget cloned"); router.push(`/budgets/${c.id}`); }}>Clone</button></div>
      </Dialog>
      {node}
    </div>
  );
}
