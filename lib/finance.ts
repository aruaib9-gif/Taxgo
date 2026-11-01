"use client";

// Finance: debts (payable / receivable with schedules), loans (interest-free qard hasan or with
// interest, eligibility rules), chit funds (kuri groups, rounds, contributions), currencies with
// exchange rates and revaluation, and budgets with budget-vs-actual.

import { createRecord, readCollection, seedCollection, updateRecord, type Rec } from "@/lib/store";
import { createJournal, findAccountByCode, reverseJournal, type JournalLine } from "@/lib/ledger";
import { outstanding } from "@/lib/sales";
import { billOpen, billOutstanding } from "@/lib/purchases";

const n = (v: unknown) => Number(v ?? 0) || 0;
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r2 = (v: number) => Math.round(v * 100) / 100;
export const todayIso = () => new Date().toISOString().slice(0, 10);

function account(code: string, name: string, type: string, normal: string) {
  const found = findAccountByCode(code);
  if (found) return found.id;
  return createRecord("accounts", { code, name, type, normalBalance: normal, parentId: null, isActive: true }).id;
}
const acc = {
  bank: () => account("1100", "Bank Account", "ASSET", "DEBIT"),
  cash: () => account("1000", "Cash on Hand", "ASSET", "DEBIT"),
  shortLoans: () => account("2200", "Short-term Loans", "LIABILITY", "CREDIT"),
  longLoans: () => account("2500", "Long-term Loans", "LIABILITY", "CREDIT"),
  loansReceivable: () => account("1430", "Loans Receivable", "ASSET", "DEBIT"),
  staffLoans: () => account("1420", "Employee Loans & Advances", "ASSET", "DEBIT"),
  interestIncome: () => account("4200", "Interest Income", "REVENUE", "CREDIT"),
  interestExpense: () => account("5910", "Interest Expense", "EXPENSE", "DEBIT"),
  chitPool: () => account("2310", "Chit Fund Pool", "LIABILITY", "CREDIT"),
  chitCommission: () => account("4120", "Chit Fund Commission", "REVENUE", "CREDIT"),
  fxGain: () => account("4400", "Foreign Exchange Gain", "REVENUE", "CREDIT"),
  fxLoss: () => account("5920", "Foreign Exchange Loss", "EXPENSE", "DEBIT"),
  ar: () => account("1200", "Accounts Receivable", "ASSET", "DEBIT"),
  ap: () => account("2000", "Accounts Payable", "LIABILITY", "CREDIT"),
};

export function addMonths(iso: string, m: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + m);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.toISOString().slice(0, 10);
}
const addDays = (iso: string, days: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
const seq = (coll: string, field: string, prefix: string) => `${prefix}${String(Math.max(0, ...readCollection(coll).map((r) => Number(String(r[field] ?? "").replace(/\D/g, "")) || 0)) + 1).padStart(2, "0")}`;

/* ---------- debts ---------- */

export const FREQS = [
  { value: "MONTHLY", label: "Monthly", months: 1 },
  { value: "QUARTERLY", label: "Quarterly", months: 3 },
  { value: "SEMI_ANNUALLY", label: "Semi-Annually", months: 6 },
  { value: "ANNUALLY", label: "Annually", months: 12 },
  { value: "AT_MATURITY", label: "At Maturity", months: 0 },
];
export const DEBT_STATUSES = ["ACTIVE", "PARTIALLY_PAID", "PAID", "DEFAULTED", "WRITTEN_OFF"];
export const nextDebtNumber = () => seq("debts", "debtNumber", "DEBT-");

type Row = { n: number; dueDate: string; principal: number; interest: number; total: number; paid: number; status: string };

// Equal principal instalments; simple interest is charged on the original principal, compound
// (amortising) on the declining balance.
export function buildSchedule(p: { principal: number; rate: number; interestType: string; frequency: string; startDate: string; maturityDate: string }): Row[] {
  const step = FREQS.find((f) => f.value === p.frequency)?.months ?? 1;
  const months = Math.max(1, Math.round((new Date(p.maturityDate).getTime() - new Date(p.startDate).getTime()) / (30.4375 * 86400000)));
  const periods = step === 0 ? 1 : Math.max(1, Math.round(months / step));
  const perYear = step === 0 ? 12 / months : 12 / step;
  const i = n(p.rate) / 100 / perYear;
  const rows: Row[] = [];
  let bal = p.principal;
  const emi = p.interestType === "COMPOUND" && i > 0 ? (p.principal * i) / (1 - Math.pow(1 + i, -periods)) : 0;
  for (let k = 1; k <= periods; k++) {
    const interest = r2(p.interestType === "COMPOUND" ? bal * i : p.principal * i);
    let principal = r2(emi ? emi - bal * i : p.principal / periods);
    if (k === periods) principal = r2(bal);
    bal = r2(bal - principal);
    rows.push({ n: k, dueDate: step === 0 ? p.maturityDate : k === periods ? p.maturityDate : addMonths(p.startDate, step * k), principal, interest, total: r2(principal + interest), paid: 0, status: "PENDING" });
  }
  return rows;
}

export function createDebt(d: { debtType: "PAYABLE" | "RECEIVABLE"; counterparty: string; contact?: string; principal: number; rate: number; interestType: string; frequency: string; startDate: string; maturityDate: string; notes?: string }) {
  if (!d.counterparty.trim()) throw new Error("Counterparty name is required");
  if (!(d.principal > 0)) throw new Error("Principal must be greater than 0");
  if (!d.startDate || !d.maturityDate || d.maturityDate <= d.startDate) throw new Error("Maturity date must be after the start date");
  const schedule = buildSchedule(d);
  const payable = d.debtType === "PAYABLE";
  const longTerm = new Date(d.maturityDate).getTime() - new Date(d.startDate).getTime() > 366 * 86400000;
  const loanAcc = payable ? (longTerm ? acc.longLoans() : acc.shortLoans()) : acc.loansReceivable();
  const debtNumber = nextDebtNumber();
  const je = createJournal({ date: d.startDate, description: `${debtNumber} — ${payable ? "Loan from" : "Loan to"} ${d.counterparty}`, status: "POSTED", source: "Debt", lines: payable ? [{ accountId: acc.bank(), debit: d.principal, credit: 0 }, { accountId: loanAcc, debit: 0, credit: d.principal }] : [{ accountId: loanAcc, debit: d.principal, credit: 0 }, { accountId: acc.bank(), debit: 0, credit: d.principal }] });
  return createRecord("debts", { ...d, debtNumber, loanAccountId: loanAcc, schedule, payments: [], status: "ACTIVE", journalId: je.id });
}

export const debtPaid = (d: Rec) => r2(((d.payments as Rec[]) ?? []).reduce((a, p) => a + n(p.principalPart), 0));
export const debtOutstanding = (d: Rec) => r2(n(d.principal) - debtPaid(d));

// Each schedule row is settled interest first, then principal, oldest row first.
export function payDebt(id: string, p: { date: string; amount: number; method?: string; reference?: string; notes?: string }) {
  const d = readCollection("debts").find((x) => x.id === id)!;
  if (!(p.amount > 0)) throw new Error("Payment amount must be greater than 0");
  const rows = ((d.schedule as (Row & { paidInterest?: number; paidPrincipal?: number })[]) ?? []).map((r) => ({ ...r }));
  let left = p.amount, interestPart = 0, principalPart = 0;
  for (const r of rows) {
    if (left <= 0.005) break;
    const ti = Math.min(left, r2(r.interest - n(r.paidInterest)));
    left = r2(left - ti); interestPart = r2(interestPart + ti); r.paidInterest = r2(n(r.paidInterest) + ti);
    const tp = Math.min(left, r2(r.principal - n(r.paidPrincipal)));
    left = r2(left - tp); principalPart = r2(principalPart + tp); r.paidPrincipal = r2(n(r.paidPrincipal) + tp);
    r.paid = r2(r.paidInterest + r.paidPrincipal);
    r.status = r.paid >= r.total - 0.005 ? "PAID" : r.paid > 0 ? "PARTIAL" : r.status;
  }
  if (left > 0.005) throw new Error(`Payment exceeds what's left on the schedule by ${left.toFixed(2)}`);
  const payable = d.debtType === "PAYABLE";
  const lines: JournalLine[] = payable
    ? [{ accountId: String(d.loanAccountId), debit: principalPart, credit: 0 }, { accountId: acc.interestExpense(), debit: interestPart, credit: 0 }, { accountId: acc.bank(), debit: 0, credit: p.amount }]
    : [{ accountId: acc.bank(), debit: p.amount, credit: 0 }, { accountId: String(d.loanAccountId), debit: 0, credit: principalPart }, { accountId: acc.interestIncome(), debit: 0, credit: interestPart }];
  const je = createJournal({ date: p.date, description: `${d.debtNumber} — ${payable ? "Repayment to" : "Repayment from"} ${d.counterparty}`, status: "POSTED", source: "Debt", lines: lines.filter((l) => l.debit || l.credit) });
  const payments = [...((d.payments as Rec[]) ?? []), { ...p, principalPart, interestPart, journalId: je.id }];
  const paid = r2(payments.reduce((a, x) => a + n(x.principalPart), 0));
  updateRecord("debts", id, { schedule: rows, payments, status: paid >= n(d.principal) - 0.005 ? "PAID" : "PARTIALLY_PAID" });
}

export const overdueRows = (d: Rec, today = todayIso()) => ((d.schedule as Row[]) ?? []).filter((r) => r.status !== "PAID" && r.dueDate < today);

/* ---------- loans ---------- */

export const LOAN_STATUSES = ["DRAFT", "APPROVED", "DISBURSED", "REPAYING", "COMPLETED", "DEFAULTED"];
export function loanSettings() {
  const r = readCollection("loan-settings")[0];
  return { prefix: "LN-", nextNumber: 1, defaultRate: 0, maxTerm: 60, autoPost: true, receivableAccountId: "", incomeAccountId: "", fundAccountId: "", ...((r?.value as object) ?? {}) } as { prefix: string; nextNumber: number; defaultRate: number; maxTerm: number; autoPost: boolean; receivableAccountId: string; incomeAccountId: string; fundAccountId: string };
}
export function saveLoanSettings(v: ReturnType<typeof loanSettings>) {
  const r = readCollection("loan-settings")[0];
  if (r) updateRecord("loan-settings", r.id, { value: v }); else createRecord("loan-settings", { value: v });
}

export function checkEligibility(deposit: number, months: number, loanType: string) {
  const rules = readCollection("eligibility-rules").filter((r) => r.isActive !== false).sort((a, b) => n(b.priority) - n(a.priority));
  for (const r of rules) {
    if (r.loanType && r.loanType !== "ANY" && loanType && loanType !== "ANY" && r.loanType !== loanType) continue;
    if (deposit < n(r.minDeposit) || months < n(r.minPeriod)) continue;
    const byMult = n(r.multiplier) ? deposit * n(r.multiplier) : Infinity;
    const max = Math.min(byMult, n(r.maxLoan) || Infinity);
    return { eligible: true, rule: r, maxLoan: Number.isFinite(max) ? r2(max) : null, maxRate: r.maxRate ?? null };
  }
  return { eligible: false, rule: null, maxLoan: 0, maxRate: null };
}

export function loanSchedule(l: { principal: number; termMonths: number; frequency: string; interestRate: number; startDate: string }) {
  const step = l.frequency === "WEEKLY" ? 0.25 : l.frequency === "QUARTERLY" ? 3 : 1;
  const periods = Math.max(1, Math.round(l.termMonths / step));
  const i = n(l.interestRate) / 100 / (12 / step);
  const pay = i > 0 ? (l.principal * i) / (1 - Math.pow(1 + i, -periods)) : l.principal / periods;
  let bal = l.principal;
  const rows: Row[] = [];
  for (let k = 1; k <= periods; k++) {
    const interest = r2(bal * i);
    const principal = k === periods ? r2(bal) : r2(pay - interest);
    bal = r2(bal - principal);
    rows.push({ n: k, dueDate: step < 1 ? addDays(l.startDate, 7 * k) : addMonths(l.startDate, step * k), principal, interest, total: r2(principal + interest), paid: 0, status: "PENDING" });
  }
  return rows;
}

export function createLoan(l: Record<string, unknown> & { loanType: string; borrowerName: string; principal: number; termMonths: number; frequency: string; interestRate?: number }) {
  if (!l.borrowerName.trim()) throw new Error("Borrower name is required");
  if (!(l.principal > 0)) throw new Error("Principal must be greater than 0");
  const s = loanSettings();
  if (l.termMonths > s.maxTerm) throw new Error(`Term can't exceed ${s.maxTerm} months`);
  const loanNumber = `${s.prefix}${String(s.nextNumber).padStart(4, "0")}`;
  saveLoanSettings({ ...s, nextNumber: s.nextNumber + 1 });
  return createRecord("loans", { ...l, interestRate: l.loanType === "WITH_INTEREST" ? n(l.interestRate ?? s.defaultRate) : 0, loanNumber, status: "DRAFT", schedule: [] });
}

export function approveLoan(id: string) { updateRecord("loans", id, { status: "APPROVED", approvedAt: todayIso() }); }

export function disburseLoan(id: string, date = todayIso()) {
  const l = readCollection("loans").find((x) => x.id === id)!;
  const s = loanSettings();
  const schedule = loanSchedule({ principal: n(l.principal), termMonths: n(l.termMonths), frequency: String(l.frequency), interestRate: n(l.interestRate), startDate: date });
  let journalId: string | undefined;
  if (s.autoPost) journalId = createJournal({ date, description: `${l.loanNumber} — loan disbursed to ${l.borrowerName}`, status: "POSTED", source: "Loan", lines: [{ accountId: s.receivableAccountId || acc.staffLoans(), debit: n(l.principal), credit: 0 }, { accountId: s.fundAccountId || acc.bank(), debit: 0, credit: n(l.principal) }] }).id;
  updateRecord("loans", id, { status: "DISBURSED", disbursedAt: date, schedule, journalId });
}

export function payLoanInstalment(id: string, k: number, date = todayIso()) {
  const l = readCollection("loans").find((x) => x.id === id)!;
  const s = loanSettings();
  const rows = ((l.schedule as Row[]) ?? []).map((r) => ({ ...r }));
  const row = rows.find((r) => r.n === k);
  if (!row || row.status === "PAID") throw new Error("Instalment already paid");
  row.paid = row.total; row.status = "PAID"; (row as Row & { paidAt?: string }).paidAt = date;
  if (s.autoPost) createJournal({ date, description: `${l.loanNumber} — instalment ${k} from ${l.borrowerName}`, status: "POSTED", source: "Loan", lines: [{ accountId: s.fundAccountId || acc.bank(), debit: row.total, credit: 0 }, { accountId: s.receivableAccountId || acc.staffLoans(), debit: 0, credit: row.principal }, ...(row.interest ? [{ accountId: s.incomeAccountId || acc.interestIncome(), debit: 0, credit: row.interest }] : [])] });
  updateRecord("loans", id, { schedule: rows, status: rows.every((r) => r.status === "PAID") ? "COMPLETED" : "REPAYING" });
}

export const loanCollected = (l: Rec) => r2(((l.schedule as Row[]) ?? []).reduce((a, r) => a + n(r.paid), 0));
export const loanOutstanding = (l: Rec) => (["DISBURSED", "REPAYING", "DEFAULTED"].includes(String(l.status)) ? r2(((l.schedule as Row[]) ?? []).filter((r) => r.status !== "PAID").reduce((a, r) => a + r.principal, 0)) : 0);

/* ---------- chit funds ---------- */

export function kuriSettings() {
  const r = readCollection("kuri-settings")[0];
  return { prefix: "CF-", nextNumber: 1, defaultCommission: 5, autoPost: false, fundAccountId: "", commissionAccountId: "", ...((r?.value as object) ?? {}) } as { prefix: string; nextNumber: number; defaultCommission: number; autoPost: boolean; fundAccountId: string; commissionAccountId: string };
}
export function saveKuriSettings(v: ReturnType<typeof kuriSettings>) {
  const r = readCollection("kuri-settings")[0];
  if (r) updateRecord("kuri-settings", r.id, { value: v }); else createRecord("kuri-settings", { value: v });
}

export function createGroup(g: { name: string; contribution: number; description?: string; totalMembers: number; durationMonths: number; method: string; commissionPct: number; startDate: string; endDate?: string }) {
  if (!g.name.trim()) throw new Error("Group name is required");
  if (!(g.contribution > 0)) throw new Error("Contribution amount is required");
  const s = kuriSettings();
  const groupNumber = `${s.prefix}${String(s.nextNumber).padStart(3, "0")}`;
  saveKuriSettings({ ...s, nextNumber: s.nextNumber + 1 });
  return createRecord("kuri-groups", { ...g, groupNumber, status: "DRAFT", members: [], rounds: [] });
}

export function addMember(groupId: string, m: { name: string; phone?: string; email?: string }) {
  const g = readCollection("kuri-groups").find((x) => x.id === groupId)!;
  const members = (g.members as Rec[]) ?? [];
  if (members.length >= n(g.totalMembers)) throw new Error("The group is full");
  if (!m.name.trim()) throw new Error("Name is required");
  updateRecord("kuri-groups", groupId, { members: [...members, { id: `m${Date.now().toString(36)}`, ...m, status: "ACTIVE", order: members.length + 1 }] });
}

// Activation generates one round per month of the duration, each expecting every member's contribution.
export function activateGroup(groupId: string) {
  const g = readCollection("kuri-groups").find((x) => x.id === groupId)!;
  const members = (g.members as Rec[]) ?? [];
  if (members.length < 2) throw new Error("Add at least two members first");
  const rounds = Array.from({ length: Math.max(1, n(g.durationMonths)) }, (_, i) => ({ n: i + 1, date: addMonths(String(g.startDate || todayIso()), i), status: "PENDING", contributions: Object.fromEntries(members.map((m) => [m.id, false])) }));
  updateRecord("kuri-groups", groupId, { status: "ACTIVE", rounds });
}

export function markContribution(groupId: string, roundNo: number, memberId: string) {
  const g = readCollection("kuri-groups").find((x) => x.id === groupId)!;
  const s = kuriSettings();
  const rounds = ((g.rounds as Rec[]) ?? []).map((r) => (r.n === roundNo ? { ...r, contributions: { ...(r.contributions as object), [memberId]: true } } : r));
  updateRecord("kuri-groups", groupId, { rounds });
  if (s.autoPost) createJournal({ date: todayIso(), description: `${g.groupNumber} round ${roundNo} — contribution`, status: "POSTED", source: "Chit Fund", lines: [{ accountId: acc.cash(), debit: n(g.contribution), credit: 0 }, { accountId: s.fundAccountId || acc.chitPool(), debit: 0, credit: n(g.contribution) }] });
}

export function roundFigures(g: Rec, discount: number) {
  const pool = r2(n(g.contribution) * ((g.members as Rec[]) ?? []).length);
  const commission = r2((pool * n(g.commissionPct)) / 100);
  return { pool, commission, payout: r2(pool - commission - discount) };
}

export function conductRound(groupId: string, roundNo: number, winnerId: string, discount = 0) {
  const g = readCollection("kuri-groups").find((x) => x.id === groupId)!;
  if (!winnerId) throw new Error("Select a winner");
  const s = kuriSettings();
  const f = roundFigures(g, g.method === "AUCTION" ? discount : 0);
  if (f.payout <= 0) throw new Error("The auction discount leaves nothing to pay out");
  let journalId: string | undefined;
  if (s.autoPost) journalId = createJournal({ date: todayIso(), description: `${g.groupNumber} round ${roundNo} — payout`, status: "POSTED", source: "Chit Fund", lines: [{ accountId: s.fundAccountId || acc.chitPool(), debit: r2(f.payout + f.commission), credit: 0 }, { accountId: acc.cash(), debit: 0, credit: f.payout }, ...(f.commission ? [{ accountId: s.commissionAccountId || acc.chitCommission(), debit: 0, credit: f.commission }] : [])] }).id;
  const rounds = ((g.rounds as Rec[]) ?? []).map((r) => (r.n === roundNo ? { ...r, status: "COMPLETED", winnerId, auctionDiscount: g.method === "AUCTION" ? discount : 0, ...f, conductedAt: todayIso(), journalId } : r));
  const members = ((g.members as Rec[]) ?? []).map((m) => (m.id === winnerId ? { ...m, won: roundNo } : m));
  updateRecord("kuri-groups", groupId, { rounds, members, status: rounds.every((r) => r.status === "COMPLETED") ? "COMPLETED" : "ACTIVE" });
}

// Draw: random among members who haven't won; rotation: the next in joining order.
export function pickWinner(g: Rec) {
  const eligible = ((g.members as Rec[]) ?? []).filter((m) => !m.won);
  if (!eligible.length) return "";
  return g.method === "ROTATION" ? String(eligible.sort((a, b) => n(a.order) - n(b.order))[0].id) : String(eligible[Math.floor(Math.random() * eligible.length)].id);
}

/* ---------- currencies ---------- */

export const BASE = "USD";
const SEED_CURRENCIES = [
  { id: "cur-usd", code: "USD", name: "US Dollar", symbol: "$", decimals: 2, isBase: true, isActive: true },
  { id: "cur-aed", code: "AED", name: "UAE Dirhams", symbol: "د.إ", decimals: 2, isBase: false, isActive: true },
  { id: "cur-eur", code: "EUR", name: "Euro", symbol: "€", decimals: 2, isBase: false, isActive: true },
  { id: "cur-gbp", code: "GBP", name: "Pound", symbol: "£", decimals: 2, isBase: false, isActive: true },
  { id: "cur-inr", code: "INR", name: "Indian Rupee", symbol: "₹", decimals: 2, isBase: false, isActive: true },
  { id: "cur-sar", code: "SAR", name: "Saudi Riyal", symbol: "﷼", decimals: 2, isBase: false, isActive: true },
];
// Daily API rates captured from the live platform (most recent three days).
const RATES: [string, number[]][] = [["INR", [0.010494, 0.010505, 0.010496]], ["SAR", [0.266667, 0.266667, 0.266667]], ["EUR", [1.114579, 1.11433, 1.118693]], ["AED", [0.272294, 0.272294, 0.272294]], ["GBP", [1.330672, 1.331381, 1.334757]]];
export function seedCurrencies() {
  seedCollection("currencies", SEED_CURRENCIES);
  const t = todayIso();
  seedCollection("exchange-rates", RATES.flatMap(([c, v]) => v.map((rate, i) => ({ id: `fx-${c}-${i}`, from: c, to: BASE, rate, effectiveDate: addDays(t, -i), source: "API" }))));
}

// Latest rate on/before a date: direct, inverse, or crossed through the base currency.
export function rateOn(from: string, to: string, date = todayIso()): number | null {
  if (from === to) return 1;
  const rates = readCollection("exchange-rates").filter((r) => String(r.effectiveDate) <= date).sort((a, b) => String(b.effectiveDate).localeCompare(String(a.effectiveDate)));
  const direct = rates.find((r) => r.from === from && r.to === to);
  if (direct) return n(direct.rate);
  const inv = rates.find((r) => r.from === to && r.to === from);
  if (inv && n(inv.rate)) return 1 / n(inv.rate);
  if (from !== BASE && to !== BASE) { const a = rateOn(from, BASE, date), b = rateOn(to, BASE, date); if (a && b) return a / b; }
  return null;
}

// Restates open foreign-currency invoices/bills at the new rate. Each document carries the rate it
// was last valued at (booking-date rate at first); the difference posts to FX gain/loss, and the
// entry reverses the next day (unrealised).
export function runRevaluation(p: { date: string; from: string; to: string; rate: number }) {
  if (!p.from || !p.to || !(p.rate > 0)) throw new Error("Pick the currencies and enter a rate");
  const docs: { coll: string; doc: Rec; foreign: number; oldRate: number; diff: number; ar: boolean }[] = [];
  for (const inv of readCollection("invoices").filter((i) => i.currency === p.from && ["UNPAID", "PARTIAL"].includes(String(i.status)) && outstanding(i) > 0)) {
    const oldRate = n(inv.revalRate) || rateOn(p.from, p.to, String(inv.date)) || p.rate;
    const foreign = outstanding(inv) / oldRate;
    docs.push({ coll: "invoices", doc: inv, foreign, oldRate, diff: r3(foreign * p.rate - outstanding(inv)), ar: true });
  }
  for (const b of readCollection("bills").filter((x) => x.currency === p.from && billOpen(x) && billOutstanding(x) > 0)) {
    const oldRate = n(b.revalRate) || rateOn(p.from, p.to, String(b.date)) || p.rate;
    const foreign = billOutstanding(b) / oldRate;
    docs.push({ coll: "bills", doc: b, foreign, oldRate, diff: r3(foreign * p.rate - billOutstanding(b)), ar: false });
  }
  // Receivables gain when they grow; payables gain when they shrink.
  const gain = r3(docs.reduce((a, d) => a + (d.ar ? d.diff : -d.diff), 0));
  const arDiff = r3(docs.filter((d) => d.ar).reduce((a, d) => a + d.diff, 0));
  const apDiff = r3(docs.filter((d) => !d.ar).reduce((a, d) => a + d.diff, 0));
  let journalId: string | undefined, reversalId: string | undefined;
  if (docs.length && Math.abs(gain) + Math.abs(arDiff) + Math.abs(apDiff) > 0.0005) {
    const lines: JournalLine[] = [];
    if (arDiff) lines.push(arDiff > 0 ? { accountId: acc.ar(), debit: arDiff, credit: 0 } : { accountId: acc.ar(), debit: 0, credit: -arDiff });
    if (apDiff) lines.push(apDiff > 0 ? { accountId: acc.ap(), debit: 0, credit: apDiff } : { accountId: acc.ap(), debit: -apDiff, credit: 0 });
    if (gain > 0) lines.push({ accountId: acc.fxGain(), debit: 0, credit: gain }); else if (gain < 0) lines.push({ accountId: acc.fxLoss(), debit: -gain, credit: 0 });
    const je = createJournal({ date: p.date, description: `FX revaluation ${p.from}→${p.to} @ ${p.rate}`, status: "POSTED", source: "Revaluation", lines });
    journalId = je.id;
    reversalId = reverseJournal(je, addDays(p.date, 1))?.id;
  }
  return createRecord("revaluations", { ...p, documents: docs.length, gainLoss: gain, journalId, reversalId, details: docs.map((d) => ({ coll: d.coll, id: d.doc.id, number: d.doc.number, foreign: r3(d.foreign), oldRate: d.oldRate, diff: d.diff })) });
}

/* ---------- budgets ---------- */

export const PERIODS = { MONTHLY: 12, QUARTERLY: 4, ANNUAL: 1 } as const;

export function budgetActuals(b: Rec) {
  const fy = String(b.fiscalYear);
  const accounts = readCollection("accounts");
  const map = new Map<string, number>();
  for (const j of readCollection("journal-entries").filter((x) => x.status !== "DRAFT" && String(x.date).startsWith(fy))) for (const l of (j.lines as Rec[]) ?? []) {
    const a = accounts.find((x) => x.id === l.accountId);
    if (!a) continue;
    const v = a.normalBalance === "CREDIT" ? n(l.credit) - n(l.debit) : n(l.debit) - n(l.credit);
    map.set(String(l.accountId), r3((map.get(String(l.accountId)) ?? 0) + v));
  }
  return ((b.lines as Rec[]) ?? []).map((l) => {
    const actual = map.get(String(l.accountId)) ?? 0;
    const variance = r3(n(l.amount) - actual);
    const util = n(l.amount) ? (actual / n(l.amount)) * 100 : 0;
    return { accountId: String(l.accountId), amount: n(l.amount), notes: l.notes, actual, variance, variancePct: n(l.amount) ? r2((variance / n(l.amount)) * 100) : 0, utilization: r2(util), level: util >= n(b.criticalThreshold || 100) ? "CRITICAL" : util >= n(b.warningThreshold || 80) ? "WARNING" : "OK" };
  });
}

export const budgetTotal = (b: Rec) => r3(((b.lines as Rec[]) ?? []).reduce((a, l) => a + n(l.amount), 0));

export function setBudgetStatus(id: string, status: string, note?: string) {
  const b = readCollection("budgets").find((x) => x.id === id)!;
  const revision = status === "DRAFT" ? n(b.revision) + 1 : n(b.revision);
  updateRecord("budgets", id, { status, revision, history: [...((b.history as Rec[]) ?? []), { date: new Date().toISOString(), action: status === "DRAFT" ? "Reopened for revision" : status.charAt(0) + status.slice(1).toLowerCase(), revision, total: budgetTotal(b), note }] });
}
