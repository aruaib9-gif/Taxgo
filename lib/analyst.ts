"use client";

// The assistants' answer engine. There is no language model behind it: each question is matched
// to an intent (cash, overdue receivables, runway, P&L, pipeline, headcount, stock, vendors,
// statutory dues…) and answered from the live books, with a table and links where useful.
// "Draft a journal entry for $500 …" creates a real DRAFT entry for review.

import { readCollection, type Rec } from "@/lib/store";
import { createJournal, findAccountByCode } from "@/lib/ledger";
import { outstanding, statusFor } from "@/lib/sales";
import { billOpen, billOutstanding } from "@/lib/purchases";
import { balances } from "@/lib/stock";
import { BRAND } from "@/lib/brand";
import { balanceAsOf, daysBetween, movements, openItems, profitAndLoss, todayIso } from "@/lib/reports";

export type Answer = { text: string; table?: { headers: string[]; rows: (string | number)[][] }; links?: { label: string; href: string }[] };
export type Persona = "assistant" | "cfo" | "accountant" | "sales" | "hr" | "inventory" | "procurement" | "compliance" | "treasurer" | "query";

const n = (v: unknown) => Number(v ?? 0) || 0;
const m = (v: number) => `${v < 0 ? "-" : ""}${BRAND.currency}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const monthStart = (offset = 0) => { const d = new Date(); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + offset); return d.toISOString().slice(0, 10); };
const monthEnd = (offset = 0) => { const d = new Date(monthStart(offset + 1)); d.setUTCDate(0); return d.toISOString().slice(0, 10); };
const quarterStart = () => { const d = new Date(); return `${d.getUTCFullYear()}-${String(Math.floor(d.getUTCMonth() / 3) * 3 + 1).padStart(2, "0")}-01`; };
const addDays = (iso: string, k: number) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };
const numIn = (q: string, dflt: number) => Number(q.match(/(\d+)\s*(day|days|d\b)/)?.[1] ?? q.match(/\btop\s+(\d+)/)?.[1] ?? dflt);
const cashAccounts = () => readCollection("accounts").filter((a) => String(a.code) >= "1000" && String(a.code) <= "1110");

/* ---------- finance ---------- */

function cash(): Answer {
  const bal = balanceAsOf();
  const rows = cashAccounts().map((a) => [String(a.code), String(a.name), bal.get(a.id) ?? 0] as (string | number)[]);
  const total = rows.reduce((s, r) => s + Number(r[2]), 0);
  return { text: `Your cash and bank balance across ${rows.length} ledgers is **${m(total)}** as of ${todayIso()}.`, table: { headers: ["Code", "Ledger", "Balance"], rows: rows.map((r) => [r[0], r[1], m(Number(r[2]))]) }, links: [{ label: "Cash & Bank Book", href: "/reports/cash-book" }] };
}

function overdueAR(worst = false): Answer {
  const today = todayIso();
  const items = openItems(today).filter((x) => x.kind === "AR" && x.dueDate < today);
  if (!items.length) return { text: "No customer invoice is overdue right now. 🎉", links: [{ label: "AR Aging", href: "/reports/ar-aging" }] };
  if (worst) {
    const by = new Map<string, { amt: number; days: number; count: number }>();
    for (const x of items) { const b = by.get(x.party) ?? { amt: 0, days: 0, count: 0 }; b.amt += x.amount; b.days = Math.max(b.days, daysBetween(x.dueDate, today)); b.count++; by.set(x.party, b); }
    const rows = [...by].sort((a, b) => b[1].amt * b[1].days - a[1].amt * a[1].days);
    return { text: `${rows.length} customer(s) are paying late. Ranked by amount × days late, **${rows[0][0]}** is the biggest risk (${m(rows[0][1].amt)}, up to ${rows[0][1].days} days late).`, table: { headers: ["Customer", "Overdue invoices", "Overdue amount", "Oldest (days)"], rows: rows.map(([k, v]) => [k, v.count, m(v.amt), v.days]) }, links: [{ label: "Collections", href: "/ai/collections" }] };
  }
  const total = items.reduce((s, x) => s + x.amount, 0);
  return { text: `**${items.length}** invoice(s) are overdue, totalling **${m(total)}**.`, table: { headers: ["Invoice", "Customer", "Due", "Days late", "Outstanding"], rows: items.sort((a, b) => a.dueDate.localeCompare(b.dueDate)).map((x) => [x.number, x.party, x.dueDate, daysBetween(x.dueDate, today), m(x.amount)]) }, links: [{ label: "Payment Dues", href: "/reports/upcoming-dues" }] };
}

function topCustomers(q: string): Answer {
  const k = numIn(q, 10);
  const byOutstanding = /outstanding|owe|balance/.test(q);
  const map = new Map<string, number>();
  for (const i of readCollection("invoices").filter((x) => x.status !== "DRAFT" && x.status !== "CANCELLED")) map.set(String(i.customer), (map.get(String(i.customer)) ?? 0) + (byOutstanding ? outstanding(i) : n(i.subtotal) - n(i.discount)));
  const rows = [...map].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, k);
  if (!rows.length) return { text: byOutstanding ? "No customer owes you anything right now." : "There are no invoiced sales yet." };
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return { text: `Top ${rows.length} customer(s) by ${byOutstanding ? "outstanding balance" : "revenue"}. **${rows[0][0]}** leads with ${m(rows[0][1])}${total ? ` (${((rows[0][1] / total) * 100).toFixed(1)}% of the total)` : ""}.`, table: { headers: ["Customer", byOutstanding ? "Outstanding" : "Revenue (net)", "Share"], rows: rows.map(([c, v]) => [c, m(v), total ? `${((v / total) * 100).toFixed(1)}%` : "—"]) } };
}

function topExpenses(q: string): Answer {
  const last = /last month/.test(q);
  const from = monthStart(last ? -1 : 0), to = last ? monthEnd(-1) : todayIso();
  const p = profitAndLoss(from, to);
  const rows = [...p.cos, ...p.indirect].sort((a, b) => b.amount - a.amount).slice(0, 10);
  if (!rows.length) return { text: `No expenses booked ${last ? "last month" : "this month"} (${from} → ${to}).` };
  return { text: `Top expenses ${last ? "last month" : "this month"}: **${String(rows[0].account.name)}** is the largest at ${m(rows[0].amount)}. Total expenses ${m(p.totalExpenses)}.`, table: { headers: ["Account", "Amount"], rows: rows.map((r) => [`${r.account.code} ${r.account.name}`, m(r.amount)]) } };
}

function pnlCompare(): Answer {
  const a = profitAndLoss(monthStart(0), todayIso()), b = profitAndLoss(monthStart(-1), monthEnd(-1));
  const row = (l: string, x: number, y: number) => [l, m(x), m(y), y ? `${(((x - y) / Math.abs(y)) * 100).toFixed(1)}%` : "—"];
  return { text: `This month to date you've made **${m(a.net)}** net profit vs ${m(b.net)} for all of last month. Gross margin ${a.totalSales ? ((a.gross / a.totalSales) * 100).toFixed(1) : "—"}% (last month ${b.totalSales ? ((b.gross / b.totalSales) * 100).toFixed(1) : "—"}%).`, table: { headers: ["", "This month", "Last month", "Change"], rows: [row("Sales", a.totalSales, b.totalSales), row("Cost of sales", a.costOfSales, b.costOfSales), row("Gross profit", a.gross, b.gross), row("Other income", a.otherIncome, b.otherIncome), row("Indirect expenses", a.indirectTotal, b.indirectTotal), row("Net profit", a.net, b.net)] }, links: [{ label: "Income Statement", href: "/reports/income-statement" }] };
}

function runway(): Answer {
  const ids = new Set(cashAccounts().map((a) => a.id));
  const months = [-3, -2, -1].map((o) => { let inflow = 0, outflow = 0; for (const j of readCollection("journal-entries").filter((x) => (x.status === "POSTED" || x.status === "REVERSED") && String(x.date) >= monthStart(o) && String(x.date) <= monthEnd(o))) for (const l of (j.lines as Rec[]) ?? []) if (ids.has(String(l.accountId))) { inflow += n(l.debit); outflow += n(l.credit); } return { inflow, outflow }; });
  const burn = months.reduce((s, x) => s + (x.outflow - x.inflow), 0) / 3;
  const c = cashAccounts().reduce((s, a) => s + (balanceAsOf().get(a.id) ?? 0), 0);
  if (burn <= 0) return { text: `Cash is ${m(c)} and you've been cash-positive over the last three months (average net inflow ${m(-burn)}/month), so there's no burn to run out on.`, links: [{ label: "Cash Flow Forecast", href: "/ai/cash-flow-forecast" }] };
  return { text: `At the last three months' average net burn of **${m(burn)}/month**, your cash of ${m(c)} lasts about **${(c / burn).toFixed(1)} months**.`, table: { headers: ["Month", "Cash in", "Cash out", "Net"], rows: months.map((x, i) => [monthStart(i - 3).slice(0, 7), m(x.inflow), m(x.outflow), m(x.inflow - x.outflow)]) }, links: [{ label: "Cash Flow Forecast", href: "/ai/cash-flow-forecast" }] };
}

function explainJournal(q: string): Answer {
  const js = readCollection("journal-entries");
  const num = q.match(/je-?\s*0*(\d+)/i)?.[1];
  const j = num ? js.find((x) => Number(String(x.number ?? "").replace(/\D/g, "")) === Number(num)) : [...js].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt))).pop();
  if (!j) return { text: num ? `I couldn't find journal entry JE-${num}.` : "There are no journal entries yet." };
  const accts = readCollection("accounts");
  const lines = (j.lines as Rec[]) ?? [];
  const dr = lines.filter((l) => n(l.debit)).map((l) => accts.find((a) => a.id === l.accountId)?.name).join(", ");
  const cr = lines.filter((l) => n(l.credit)).map((l) => accts.find((a) => a.id === l.accountId)?.name).join(", ");
  return { text: `**${j.number ?? "Entry"}** (${j.date}, ${String(j.status).toLowerCase()}) — “${j.description}”. It debits ${dr} and credits ${cr}${j.source ? `; it was created by ${j.source}` : ""}.`, table: { headers: ["Account", "Debit", "Credit", "Memo"], rows: lines.map((l) => { const a = accts.find((x) => x.id === l.accountId); return [`${a?.code ?? ""} ${a?.name ?? ""}`, n(l.debit) ? m(n(l.debit)) : "", n(l.credit) ? m(n(l.credit)) : "", String(l.memo ?? "")]; }) }, links: [{ label: "Open entry", href: `/financial/journal-entries/${j.id}` }] };
}

export const EXPENSE_WORDS: [RegExp, string][] = [[/office supplies|stationery|supplies/, "5300"], [/rent/, "5200"], [/utilit|electric|water/, "5210"], [/internet|phone|telephone/, "5220"], [/travel|taxi|flight|fuel|transport/, "5800"], [/marketing|advertis/, "5400"], [/salar|wage/, "5100"], [/insurance/, "5600"], [/repair|maintenance/, "6100"], [/legal/, "5510"], [/audit/, "5520"], [/professional|consult|accounting fee/, "5500"], [/bank charge|bank fee/, "5900"], [/subscription|software/, "6300"], [/training/, "6200"], [/printing/, "5310"], [/equipment|computer|laptop/, "1630"], [/furniture/, "1610"]];

function draftJournal(q: string): Answer {
  const amount = Number(q.match(/[$€£₹]?\s*([\d,]+(?:\.\d+)?)/)?.[1]?.replace(/,/g, "") ?? 0);
  if (!amount) return { text: "Tell me the amount, e.g. “Draft a journal entry for $500 office supplies paid in cash”." };
  const code = EXPENSE_WORDS.find(([re]) => re.test(q))?.[1] ?? "6000";
  const credit = /on credit|unpaid|payable|owe/.test(q) ? "2000" : /bank|transfer|card|cheque/.test(q) ? "1100" : "1000";
  const da = findAccountByCode(code), ca = findAccountByCode(credit);
  if (!da || !ca) return { text: "I couldn't find the accounts for that entry in your chart." };
  const je = createJournal({ date: todayIso(), description: q.replace(/^draft (a )?journal entry (for )?/i, "").slice(0, 120) || "Drafted by assistant", status: "DRAFT", source: "AI Assistant", lines: [{ accountId: da.id, debit: amount, credit: 0 }, { accountId: ca.id, debit: 0, credit: amount }] });
  return { text: `I've drafted **${je.number ?? "a journal entry"}** for ${m(amount)} — it's a DRAFT, so nothing hits the ledger until you review and post it.`, table: { headers: ["Account", "Debit", "Credit"], rows: [[`${da.code} ${da.name}`, m(amount), ""], [`${ca.code} ${ca.name}`, "", m(amount)]] }, links: [{ label: "Review & post", href: `/financial/journal-entries/${je.id}` }] };
}

const GUIDES: [RegExp, string][] = [
  [/refund/, "**Customer refund:** (1) issue a credit note against the invoice (Sales › Credit Notes) — Dr Sales Returns / Output Tax, Cr Accounts Receivable; (2) record the money going back as a payment to the customer — Dr Accounts Receivable, Cr Bank. If the customer paid in advance and nothing was invoiced, refund straight from Customer Deposits (Dr 2300, Cr Bank)."],
  [/depreciat/, "**Depreciation:** set the asset's method and life in Accounting › Fixed Assets; running depreciation posts Dr Depreciation Expense (5700), Cr Accumulated Depreciation (17xx) each period."],
  [/prepaid|prepayment/, "**Prepaid expense:** pay it to Prepaid Expenses (Dr 1400, Cr Bank), then release it monthly with a deferral or recurring journal (Dr the expense, Cr 1400)."],
  [/accru/, "**Accrued expense:** at month-end, Dr the expense and Cr Accrued Expenses (2010); reverse it on the 1st of next month when the real bill is entered."],
  [/petty cash/, "**Petty cash:** top it up with a cash voucher (Dr Petty Cash 1010, Cr Bank) and record each spend as a payment voucher from the petty-cash box."],
  [/bad debt|write.?off/, "**Bad debt write-off:** issue a credit note for the unrecoverable amount, posting Dr Bad Debts (an expense) and Cr Accounts Receivable — or Dr Allowance for Doubtful Accounts (1210) if you provisioned for it."],
];

function chartUnder(q: string): Answer {
  const t = (["asset", "liabilit", "equity", "revenue", "income", "expense"].find((x) => q.includes(x)) ?? "expense");
  const type = t === "asset" ? "ASSET" : t === "liabilit" ? "LIABILITY" : t === "equity" ? "EQUITY" : t === "expense" ? "EXPENSE" : "REVENUE";
  const rows = readCollection("accounts").filter((a) => a.type === type).sort((a, b) => String(a.code).localeCompare(String(b.code)));
  return { text: `${rows.length} ${type.toLowerCase()} accounts in your chart:`, table: { headers: ["Code", "Name", "Normal balance"], rows: rows.map((a) => [String(a.code), String(a.name), String(a.normalBalance)]) }, links: [{ label: "Chart of Accounts", href: "/financial/accounts" }] };
}

function billsDue(q: string): Answer {
  const k = numIn(q, 7), today = todayIso(), until = addDays(today, k);
  const items = openItems(today).filter((x) => x.kind === "AP" && x.dueDate <= until).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  if (!items.length) return { text: `No bills fall due in the next ${k} days.` };
  return { text: `**${items.length}** bill(s) totalling **${m(items.reduce((s, x) => s + x.amount, 0))}** are due by ${until} (including anything already overdue).`, table: { headers: ["Bill", "Vendor", "Due", "Amount"], rows: items.map((x) => [x.number, x.party, x.dueDate < today ? `${x.dueDate} (overdue)` : x.dueDate, m(x.amount)]) }, links: [{ label: "Payment runs", href: "/ap/payment-runs" }] };
}

function unreconciled(): Answer {
  const banks = readCollection("bank-accounts");
  const rows = banks.map((b) => { const t = readCollection("bank-transactions").filter((x) => x.bankAccountId === b.id && !x.deleted && x.status !== "RECONCILED" && x.inboxState !== "EXCLUDED"); return [String(b.accountName), t.length, m(t.reduce((s, x) => s + n(x.amount), 0)), t.filter((x) => x.inboxState === "FOR_REVIEW").length]; });
  return { text: `${rows.reduce((s, r) => s + Number(r[1]), 0)} bank line(s) are not reconciled yet.`, table: { headers: ["Account", "Unreconciled lines", "Net amount", "Still in inbox"], rows }, links: [{ label: "Bank Inbox", href: "/bank/inbox" }, { label: "Smart Reconciliation", href: "/ai/reconciliation" }] };
}

function revenue(q: string): Answer {
  const last = /last month/.test(q), year = /year|ytd/.test(q);
  const from = year ? `${todayIso().slice(0, 4)}-01-01` : monthStart(last ? -1 : 0), to = last ? monthEnd(-1) : todayIso();
  const p = profitAndLoss(from, to);
  return { text: `Revenue ${year ? "this year" : last ? "last month" : "this month"} (${from} → ${to}): **${m(p.totalSales + p.otherIncome)}** — ${m(p.totalSales)} from sales and ${m(p.otherIncome)} other income.`, links: [{ label: "Sales by Period", href: "/reports/sales-by-period" }] };
}

/* ---------- sales ---------- */

const STAGE_P: Record<string, number> = { Qualification: 10, Proposal: 40, Negotiation: 70, Won: 100, Lost: 0 };
function pipeline(): Answer {
  const opps = readCollection("opportunities").filter((o) => (o.status ?? "OPEN") === "OPEN" && !["Won", "Lost"].includes(String(o.stage)) && (!o.closeDate || String(o.closeDate) >= quarterStart()));
  const rows = opps.map((o) => { const p = n(o.probability) || STAGE_P[String(o.stage)] || 0; return [String(o.title), String(o.customer ?? "—"), String(o.stage), m(n(o.value)), `${p}%`, m((n(o.value) * p) / 100)]; });
  const w = opps.reduce((s, o) => s + (n(o.value) * (n(o.probability) || STAGE_P[String(o.stage)] || 0)) / 100, 0);
  return opps.length ? { text: `Weighted pipeline this quarter: **${m(w)}** across ${opps.length} open deal(s) (unweighted ${m(opps.reduce((s, o) => s + n(o.value), 0))}).`, table: { headers: ["Deal", "Account", "Stage", "Amount", "Probability", "Weighted"], rows }, links: [{ label: "Opportunities", href: "/crm/opportunities" }] } : { text: "No open opportunities this quarter.", links: [{ label: "Opportunities", href: "/crm/opportunities" }] };
}
function stuckDeals(q: string): Answer {
  const k = numIn(q, 14), cutoff = addDays(todayIso(), -k);
  const rows = readCollection("opportunities").filter((o) => (o.status ?? "OPEN") === "OPEN" && !["Won", "Lost"].includes(String(o.stage)) && String(o.updatedAt ?? o.createdAt).slice(0, 10) <= cutoff);
  return rows.length ? { text: `${rows.length} deal(s) have had no update for ${k}+ days.`, table: { headers: ["Deal", "Stage", "Amount", "Last touched"], rows: rows.map((o) => [String(o.title), String(o.stage), m(n(o.value)), String(o.updatedAt ?? o.createdAt).slice(0, 10)]) } } : { text: `No open deal has gone ${k} days without activity.` };
}
function topLeads(q: string): Answer {
  const k = numIn(q, 5), W: Record<string, number> = { New: 10, Contacted: 30, Qualified: 60, Converted: 0, Lost: 0 };
  const scored = readCollection("leads").filter((l) => !["Converted", "Lost"].includes(String(l.status))).map((l) => ({ l, score: l.score != null && l.score !== "" ? n(l.score) : Math.round((W[String(l.status)] ?? 10) + Math.min(40, n(l.estValue) / 1000)) })).sort((a, b) => b.score - a.score).slice(0, k);
  return scored.length ? { text: `Top ${scored.length} lead(s) by score.`, table: { headers: ["Lead", "Status", "Est. value", "Score"], rows: scored.map(({ l, score }) => [`${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || String(l.organization || l.name || "—"), String(l.status), m(n(l.estValue)), score]) } } : { text: "No open leads yet." };
}
function quoteConversion(): Answer {
  const quotes = [...readCollection("proposals"), ...readCollection("quotes")], orders = readCollection("sales-orders");
  const won = quotes.filter((x) => /accept|won|convert/i.test(String(x.status))).length;
  return quotes.length ? { text: `Quote-to-close: **${((won / quotes.length) * 100).toFixed(1)}%** — ${won} of ${quotes.length} proposals accepted; ${orders.length} sales order(s) on file.` } : { text: "No proposals have been sent yet, so there's no conversion rate to show." };
}

/* ---------- HR ---------- */

const current = () => readCollection("employees").filter((e) => !["RESIGNED", "TERMINATED"].includes(String(e.status)));
function headcount(): Answer {
  const by = new Map<string, number>();
  for (const e of current()) by.set(String(e.orgUnitName ?? e.orgUnitId ?? "Head Office"), (by.get(String(e.orgUnitName ?? e.orgUnitId ?? "Head Office")) ?? 0) + 1);
  return { text: `Current headcount: **${current().length}**.`, table: { headers: ["Org unit", "Employees"], rows: [...by].map(([k, v]) => [k === "HEAD_OFFICE" ? "Head Office" : k, v]) }, links: [{ label: "Employees", href: "/hr/employees" }] };
}
function onLeave(): Answer {
  const start = addDays(todayIso(), 7 - new Date().getUTCDay() + 1 > 7 ? 1 : 8 - new Date().getUTCDay()), end = addDays(start, 6);
  const emps = readCollection("employees");
  const rows = readCollection("leave-requests").filter((r) => ["APPROVED", "PENDING"].includes(String(r.status)) && String(r.fromDate) <= end && String(r.toDate) >= start).map((r) => { const e = emps.find((x) => x.id === r.employeeId); return [`${e?.firstName ?? ""} ${e?.lastName ?? ""}`.trim(), String(r.fromDate), String(r.toDate), String(r.status).toLowerCase()]; });
  return rows.length ? { text: `${rows.length} leave request(s) overlap next week (${start} → ${end}).`, table: { headers: ["Employee", "From", "To", "Status"], rows } } : { text: `Nobody has leave booked for next week (${start} → ${end}).` };
}
function docExpiry(q: string): Answer {
  const k = numIn(q, 60), until = addDays(todayIso(), k), emps = readCollection("employees");
  const rows = readCollection("employee-documents").filter((d) => d.expiresOn && String(d.expiresOn) <= until).sort((a, b) => String(a.expiresOn).localeCompare(String(b.expiresOn))).map((d) => { const e = emps.find((x) => x.id === d.employeeId); return [`${e?.firstName ?? ""} ${e?.lastName ?? ""}`.trim(), String(d.type), String(d.number ?? "—"), String(d.expiresOn)]; });
  return rows.length ? { text: `${rows.length} document(s) expire within ${k} days.`, table: { headers: ["Employee", "Document", "Number", "Expires"], rows }, links: [{ label: "Document Vault", href: "/hr/documents" }] } : { text: `No employee documents expire in the next ${k} days.` };
}
function recruitment(): Answer {
  const reqs = readCollection("requisitions"), cands = readCollection("candidates");
  return reqs.length ? { text: `${reqs.filter((r) => r.status !== "CLOSED").length} open requisition(s), ${cands.length} candidate(s) in the pipeline.`, table: { headers: ["Requisition", "Status", "Candidates", "Hired"], rows: reqs.map((r) => [String(r.title), String(r.status ?? "OPEN"), cands.filter((c) => c.requisitionId === r.id).length, cands.filter((c) => c.requisitionId === r.id && /hired/i.test(String(c.stage ?? c.status))).length]) }, links: [{ label: "Recruitment", href: "/hr/recruitment" }] } : { text: "No recruitment requisitions are open." };
}

/* ---------- inventory & procurement ---------- */

const prodName = (id: unknown) => String(readCollection("products").find((p) => p.id === id)?.name ?? "—");
function stockByWarehouse(): Answer {
  const wh = readCollection("warehouses"), map = new Map<string, number>();
  for (const b of balances(readCollection("stock-moves") as Parameters<typeof balances>[0])) map.set(b.warehouseId, (map.get(b.warehouseId) ?? 0) + b.value);
  const total = [...map.values()].reduce((s, v) => s + v, 0);
  return { text: `Total stock value: **${m(total)}**.`, table: { headers: ["Warehouse", "Stock value"], rows: [...map].map(([k, v]) => [String(wh.find((w) => w.id === k)?.name ?? k), m(v)]) }, links: [{ label: "Inventory Valuation", href: "/reports/inventory-valuation" }] };
}
function reorder(): Answer {
  const bal = balances(readCollection("stock-moves") as Parameters<typeof balances>[0]);
  const rows = readCollection("reorder-rules").map((r) => ({ r, have: bal.filter((b) => b.productId === r.productId && (!r.warehouseId || b.warehouseId === r.warehouseId)).reduce((s, b) => s + b.qty, 0) })).filter((x) => x.have <= n(x.r.reorderPoint));
  return rows.length ? { text: `${rows.length} SKU(s) are at or below their reorder point.`, table: { headers: ["Product", "On hand", "Reorder point", "Suggested qty"], rows: rows.map(({ r, have }) => [prodName(r.productId), have, n(r.reorderPoint), Math.max(n(r.reorderQty), n(r.maxLevel) - have)]) }, links: [{ label: "Reorder rules", href: "/inventory/reorder-rules" }] } : { text: "Nothing is below its reorder point. (Only products with a reorder rule are checked.)" };
}
function noMovement(q: string): Answer {
  const k = numIn(q, 90), today = todayIso();
  const rows = balances(readCollection("stock-moves") as Parameters<typeof balances>[0]).filter((b) => b.qty > 0 && (!b.lastMove || daysBetween(b.lastMove, today) >= k));
  return rows.length ? { text: `${rows.length} stock line(s) haven't moved in ${k}+ days, tying up ${m(rows.reduce((s, b) => s + b.value, 0))}.`, table: { headers: ["Product", "On hand", "Value", "Last movement"], rows: rows.map((b) => [prodName(b.productId), b.qty, m(b.value), b.lastMove || "—"]) }, links: [{ label: "Slow-moving Items", href: "/reports/slow-moving" }] } : { text: `Everything in stock has moved within the last ${k} days.` };
}
function abc(): Answer {
  const since = addDays(todayIso(), -365), map = new Map<string, number>();
  for (const x of readCollection("stock-moves").filter((y) => y.type === "SALE" && String(y.date) >= since)) map.set(String(x.productId), (map.get(String(x.productId)) ?? 0) - n(x.value));
  const rows = [...map].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  const total = rows.reduce((s, r) => s + r[1], 0);
  if (!total) return { text: "No sales in the last 12 months to classify." };
  let cum = 0;
  const out = rows.map(([pid, v]) => { cum += v; const share = cum / total; return [prodName(pid), m(v), `${((v / total) * 100).toFixed(1)}%`, share <= 0.8 ? "A" : share <= 0.95 ? "B" : "C"]; });
  return { text: `ABC by 12-month consumption value (cost of goods sold): ${out.filter((r) => r[3] === "A").length} A, ${out.filter((r) => r[3] === "B").length} B, ${out.filter((r) => r[3] === "C").length} C item(s).`, table: { headers: ["Product", "Consumption value", "Share", "Class"], rows: out } };
}
function vendorSpend(q: string): Answer {
  const k = numIn(q, 5), from = /quarter/.test(q) ? quarterStart() : /month/.test(q) ? monthStart(0) : `${todayIso().slice(0, 4)}-01-01`;
  const map = new Map<string, number>();
  for (const b of readCollection("bills").filter((x) => x.status !== "DRAFT" && String(x.date) >= from)) map.set(String(b.vendor), (map.get(String(b.vendor)) ?? 0) + n(b.total));
  const rows = [...map].sort((a, b) => b[1] - a[1]).slice(0, k);
  return rows.length ? { text: `Top ${rows.length} vendor(s) by spend since ${from}.`, table: { headers: ["Vendor", "Spend"], rows: rows.map(([v, x]) => [v, m(x)]) } } : { text: `No vendor bills since ${from}.` };
}
function vendorScorecard(late = false): Answer {
  const pos = readCollection("purchase-orders"), grns = readCollection("grns"), today = todayIso();
  const rows = [...new Set(pos.map((p) => String(p.vendor)))].map((v) => {
    const mine = pos.filter((p) => p.vendor === v && p.expectedDate);
    const lateOnes = mine.filter((p) => { const g = grns.filter((x) => x.poId === p.id).map((x) => String(x.date)).sort()[0]; return g ? g > String(p.expectedDate) : String(p.expectedDate) < today && !["RECEIVED", "CLOSED", "CANCELLED"].includes(String(p.status)); });
    return { v, total: mine.length, late: lateOnes, onTime: mine.length ? ((mine.length - lateOnes.length) / mine.length) * 100 : 100 };
  });
  if (late) { const lates = rows.flatMap((r) => r.late.filter((p) => String(p.expectedDate) >= monthStart(0)).map((p) => [r.v, String(p.number), String(p.expectedDate), String(p.status)])); return lates.length ? { text: `${lates.length} purchase order(s) arrived late (or are past due) this month.`, table: { headers: ["Vendor", "PO", "Expected", "Status"], rows: lates } } : { text: "No late deliveries this month." }; }
  return rows.length ? { text: `Vendor reliability by on-time delivery (GRN date vs expected date). **${[...rows].sort((a, b) => b.onTime - a.onTime)[0].v}** is the most reliable.`, table: { headers: ["Vendor", "POs with a date", "Late", "On-time %"], rows: rows.sort((a, b) => b.onTime - a.onTime).map((r) => [r.v, r.total, r.late.length, `${r.onTime.toFixed(0)}%`]) } } : { text: "No purchase orders yet to score vendors on." };
}
function pendingPOs(): Answer {
  const rows = readCollection("purchase-orders").filter((p) => ["DRAFT", "PENDING_APPROVAL", "SUBMITTED"].includes(String(p.status)));
  return rows.length ? { text: `${rows.length} purchase order(s) are waiting for approval.`, table: { headers: ["PO", "Vendor", "Date", "Total", "Status"], rows: rows.map((p) => [String(p.number), String(p.vendor), String(p.date), m(n(p.total)), String(p.status)]) }, links: [{ label: "Purchase Orders", href: "/inventory/purchase-orders" }] } : { text: "No purchase orders are pending approval." };
}

/* ---------- compliance (India) ---------- */

function filingsDue(): Answer {
  const ym = todayIso().slice(0, 7), next = monthStart(1).slice(0, 7);
  const rows = [["TDS deposit (previous month)", `${ym}-07`], ["GSTR-1 (monthly)", `${ym}-11`], ["PF ECR & payment", `${ym}-15`], ["ESI contribution", `${ym}-15`], ["GSTR-3B (monthly)", `${ym}-20`], ["Professional tax (most states)", `${ym}-${String(new Date(Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0)).getUTCDate())}`], ["Next TDS deposit", `${next}-07`]].map(([l, d]) => [l, d, d < todayIso() ? "Past due date" : `${daysBetween(todayIso(), d)} day(s) left`]);
  return { text: "Statutory filings due this month (standard Indian due dates — check state-specific PT dates):", table: { headers: ["Filing", "Due", "Status"], rows }, links: [{ label: "Statutory exports", href: "/payroll/statutory-exports" }] };
}
function missingIds(): Answer {
  const docs = readCollection("employee-documents");
  const has = (e: Rec, re: RegExp, field: string) => Boolean(e[field]) || docs.some((d) => d.employeeId === e.id && re.test(String(d.type)));
  const rows = current().map((e) => ({ e, miss: [["PAN", /pan/i, "pan"], ["UAN", /uan|pf/i, "uan"], ["ESI", /esi/i, "esiNumber"]].filter(([, re, f]) => !has(e, re as RegExp, f as string)).map((x) => x[0]) })).filter((x) => x.miss.length);
  return rows.length ? { text: `${rows.length} employee(s) are missing statutory IDs.`, table: { headers: ["Employee", "Missing"], rows: rows.map(({ e, miss }) => [`${e.firstName} ${e.lastName ?? ""}`.trim(), miss.join(", ")]) }, links: [{ label: "Employees", href: "/hr/employees" }] } : { text: "Every current employee has PAN, UAN and ESI on file." };
}
function gstSummary(): Answer {
  const out = findAccountByCode("2100"), inp = findAccountByCode("1500");
  const rows = [-2, -1, 0].map((o) => { const { dr, cr } = movements(monthStart(o), o === 0 ? todayIso() : monthEnd(o)); const o2 = (cr.get(out?.id ?? "") ?? 0) - (dr.get(out?.id ?? "") ?? 0), i2 = (dr.get(inp?.id ?? "") ?? 0) - (cr.get(inp?.id ?? "") ?? 0); return [monthStart(o).slice(0, 7), m(o2), m(i2), m(o2 - i2)]; });
  return { text: "GST for the last three months, from the ledger (output tax on 2100, input credit on 1500):", table: { headers: ["Month", "Output tax", "Input tax credit", "Net payable"], rows }, links: [{ label: "Tax returns", href: "/tax" }] };
}
function statutoryTotals(): Answer {
  const ym = todayIso().slice(0, 7), runs = readCollection("payroll-runs").filter((r) => `${r.periodYear}-${String(r.periodMonth).padStart(2, "0")}` === ym).map((r) => r.id);
  const ps = readCollection("payslips").filter((p) => runs.includes(String(p.payrollRunId)));
  const s = (k: string) => m(ps.reduce((a, p) => a + n(p[k]), 0));
  return ps.length ? { text: `Statutory deductions on ${ps.length} payslip(s) for ${ym}:`, table: { headers: ["Deduction", "Total"], rows: [["PF (employee)", s("pfEmployeeContribution")], ["ESI (employee)", s("esiEmployeeContribution")], ["Professional tax", s("professionalTax")], ["TDS", s("incomeTaxDeducted")]] } } : { text: `No payroll has been run for ${ym} yet.`, links: [{ label: "Payroll runs", href: "/payroll/runs" }] };
}

/* ---------- routing ---------- */

const INTENTS: [RegExp, (q: string) => Answer][] = [
  [/draft (a )?(journal|je|entry)|record .*(paid|expense).*\d|book .*\d/, draftJournal],
  [/how (do|should|to) i (record|book|post|handle)|how to record/, (q) => ({ text: GUIDES.find(([re]) => re.test(q))?.[1] ?? "Tell me the business event (refund, depreciation, prepaid, accrual, petty cash, bad debt) and I'll walk you through the entry." })],
  [/explain|journal entry #|je-?\d|last journal/, explainJournal],
  [/chart of accounts|accounts under|list .*accounts/, chartUnder],
  [/worst pay|bad debtor|slow pay|late pay/, () => overdueAR(true)],
  [/overdue (receivable|invoice)|receivables? overdue|who owes|overdue/, () => overdueAR(false)],
  [/best client|top (\d+ )?(customer|client)|biggest customer|customer concentration/, topCustomers],
  [/runway|burn/, runway],
  [/p&l|profit and loss|pnl|profit .*month|vs last month/, pnlCompare],
  [/top expense|biggest expense|largest expense|expenses this month|spend(ing)? this month/, topExpenses],
  [/cash (balance|position)|how much cash|bank balance|total cash/, cash],
  [/bills? (due|payable)|due in the next|pay .*next/, billsDue],
  [/unreconciled|not reconciled/, unreconciled],
  [/revenue|sales (last|this) (month|year)|turnover/, revenue],
  [/weighted pipeline|pipeline/, pipeline],
  [/stuck|no activity|stale deal/, stuckDeals],
  [/lead/, topLeads],
  [/conversion|quote.to.close|win rate/, quoteConversion],
  [/headcount|how many employees|org unit/, headcount],
  [/on leave|leave next week|who is (off|away)/, onLeave],
  [/expir/, (q) => (/batch|lot|stock|product/.test(q) ? noMovement(q) : docExpiry(q))],
  [/recruit|requisition|hiring|candidate/, recruitment],
  [/stock value|inventory value|value by warehouse/, stockByWarehouse],
  [/reorder|running low|out of stock/, reorder],
  [/no movement|dead stock|slow.moving|not moved/, noMovement],
  [/abc/, abc],
  [/late deliver/, () => vendorScorecard(true)],
  [/scorecard|reliable|vendor performance/, () => vendorScorecard(false)],
  [/pending approval|awaiting approval|pos? pending/, pendingPOs],
  [/vendors? by spend|top .*vendor|spend concentration|supplier spend/, vendorSpend],
  [/due to be filed|filing|deadline|what.*due.*month/, filingsDue],
  [/missing .*(id|pan|uan|esi)|statutory ids?/, missingIds],
  [/gst return|gst for|last 3 months of gst|gst summary/, gstSummary],
  [/statutory deduction|pf|esi|tds total/, statutoryTotals],
];

export const HELP: Record<Persona, string> = {
  assistant: "balances, overdue receivables, journal entries, top expenses, draft entries",
  query: "revenue, top customers, outstanding balances, expenses, cash, bills due",
  cfo: "cash, runway, P&L month vs month, best and worst customers",
  accountant: "draft journal entries, explain entries, how-to-record guides, chart of accounts",
  treasurer: "cash position, bills due, runway, unreconciled bank lines",
  sales: "weighted pipeline, stuck deals, top leads, quote conversion, top customers",
  hr: "headcount, leave next week, expiring documents, recruitment",
  inventory: "stock value by warehouse, reorder needs, dead stock, ABC analysis",
  procurement: "vendor scorecard, pending POs, top vendors by spend, late deliveries",
  compliance: "filings due this month, missing statutory IDs, GST summary, statutory deductions",
};

export function answer(question: string, persona: Persona): Answer {
  const q = question.toLowerCase().trim();
  if (!q) return { text: "Ask me something about your books." };
  for (const [re, fn] of INTENTS) if (re.test(q)) { try { return fn(q); } catch (e) { return { text: `I hit a problem answering that: ${e instanceof Error ? e.message : "unknown error"}.` }; } }
  // Fallback: look the words up across parties and documents.
  const words = q.split(/\W+/).filter((w) => w.length > 2);
  const hits: (string | number)[][] = [];
  for (const c of readCollection("customers").filter((x) => words.some((w) => String(x.name).toLowerCase().includes(w)))) hits.push(["Customer", String(c.name), m(readCollection("invoices").filter((i) => i.customer === c.name).reduce((s, i) => s + outstanding(i), 0)) + " due"]);
  for (const v of readCollection("vendors").filter((x) => words.some((w) => String(x.name).toLowerCase().includes(w)))) hits.push(["Vendor", String(v.name), m(readCollection("bills").filter((b) => b.vendor === v.name && billOpen(b)).reduce((s, b) => s + billOutstanding(b), 0)) + " owed"]);
  for (const i of readCollection("invoices").filter((x) => words.some((w) => String(x.number).toLowerCase() === w))) hits.push(["Invoice", String(i.number), `${statusFor(i)} · ${m(outstanding(i))} due`]);
  if (hits.length) return { text: "Here's what I found in your records:", table: { headers: ["Type", "Name", "Status"], rows: hits.slice(0, 20) } };
  return { text: `I answer from your books with built-in rules, so I understand a fixed set of questions. As ${persona === "query" ? "a query tool" : "this assistant"} I can help with: ${HELP[persona]}. Try one of the suggestions.` };
}

