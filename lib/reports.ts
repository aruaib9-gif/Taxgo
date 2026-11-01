"use client";

// Report maths over the ledger and the sub-ledgers: trial balance, P&L (trading account), balance
// sheet, indirect cash flow, ratios, ageing, funds flow, registers and exception checks.

import { readCollection, type Rec } from "@/lib/store";
import { onBooks } from "@/lib/ledger";
import { outstanding, statusFor } from "@/lib/sales";
import { billOpen, billOutstanding } from "@/lib/purchases";

const n = (v: unknown) => Number(v ?? 0) || 0;
const r3 = (v: number) => Math.round(v * 1000) / 1000;
export const todayIso = () => new Date().toISOString().slice(0, 10);
export const dayBefore = (iso: string) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - 1); return d.toISOString().slice(0, 10); };
export const daysAgo = (k: number) => { const d = new Date(`${todayIso()}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - k); return d.toISOString().slice(0, 10); };
export const daysBetween = (a: string, b: string) => Math.round((new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86400000);

export const accountsSorted = () => [...readCollection("accounts")].sort((a, b) => String(a.code).localeCompare(String(b.code)));
const journals = () => readCollection("journal-entries").filter(onBooks);

// Signed movement per account between two dates (inclusive; open ends allowed), natural sign.
export function movements(from?: string, to?: string) {
  const dr = new Map<string, number>(), cr = new Map<string, number>();
  for (const j of journals()) {
    const d = String(j.date ?? "");
    if ((from && d < from) || (to && d > to)) continue;
    for (const l of (j.lines as Rec[]) ?? []) {
      const id = String(l.accountId);
      dr.set(id, (dr.get(id) ?? 0) + n(l.debit));
      cr.set(id, (cr.get(id) ?? 0) + n(l.credit));
    }
  }
  return { dr, cr };
}

// Balance in the account's natural direction (debit-normal positive when debit).
export const natural = (a: Rec, debit: number, credit: number) => r3(a.normalBalance === "CREDIT" ? credit - debit : debit - credit);

// Amount in its statement section's direction: assets & expenses debit-positive, the rest credit-positive.
// Contra accounts (returns, accumulated depreciation, drawings) therefore come out negative.
export const sectionSigned = (a: Rec, debit: number, credit: number) => r3(a.type === "ASSET" || a.type === "EXPENSE" ? debit - credit : credit - debit);

export function balanceAsOf(asOf?: string) {
  const { dr, cr } = movements(undefined, asOf);
  return new Map(accountsSorted().map((a) => [a.id, sectionSigned(a, dr.get(a.id) ?? 0, cr.get(a.id) ?? 0)]));
}

export function trialBalance(from?: string, to?: string) {
  const open = from ? movements(undefined, dayBefore(from)) : { dr: new Map<string, number>(), cr: new Map<string, number>() };
  const mv = movements(from, to);
  return accountsSorted().map((a) => {
    const opening = natural(a, open.dr.get(a.id) ?? 0, open.cr.get(a.id) ?? 0);
    const debit = r3(mv.dr.get(a.id) ?? 0), credit = r3(mv.cr.get(a.id) ?? 0);
    return { account: a, opening, debit, credit, closing: r3(opening + natural(a, debit, credit)) };
  });
}

/* ---------- P&L ---------- */

const code = (a: Rec) => String(a.code);
export const isCostOfSales = (a: Rec) => a.type === "EXPENSE" && code(a) >= "5000" && code(a) < "5100";
export const isTradingSales = (a: Rec) => a.type === "REVENUE" && code(a) >= "4000" && code(a) < "4100";

// Inventory value on a date from the stock moves (perpetual valuation).
export function stockValue(asOf?: string) {
  return r3(readCollection("stock-moves").filter((m) => !asOf || String(m.date) <= asOf).reduce((s, m) => s + n(m.value), 0));
}

export function profitAndLoss(from?: string, to?: string) {
  const { dr, cr } = movements(from, to);
  const amt = (a: Rec) => sectionSigned(a, dr.get(a.id) ?? 0, cr.get(a.id) ?? 0);
  const accts = accountsSorted();
  const rows = (pred: (a: Rec) => boolean) => accts.filter(pred).map((a) => ({ account: a, amount: amt(a) })).filter((r) => r.amount !== 0);
  const sales = rows(isTradingSales), cos = rows(isCostOfSales);
  const other = rows((a) => a.type === "REVENUE" && !isTradingSales(a)), indirect = rows((a) => a.type === "EXPENSE" && !isCostOfSales(a));
  const sum = (r: { amount: number }[]) => r3(r.reduce((s, x) => s + x.amount, 0));
  const openingStock = stockValue(from ? dayBefore(from) : "0000-00-00");
  const closingStock = stockValue(to);
  const purchases = r3(readCollection("stock-moves").filter((m) => n(m.value) > 0 && ["PURCHASE", "ADJUSTMENT", "RETURN"].includes(String(m.type)) && (!from || String(m.date) >= from) && (!to || String(m.date) <= to)).reduce((s, m) => s + n(m.value), 0));
  const totalSales = sum(sales), costOfSales = sum(cos), otherIncome = sum(other), indirectTotal = sum(indirect);
  const gross = r3(totalSales - costOfSales);
  return { sales, cos, other, indirect, openingStock, purchases, closingStock, totalSales, costOfSales, otherIncome, indirectTotal, gross, totalExpenses: r3(costOfSales + indirectTotal), net: r3(gross + otherIncome - indirectTotal) };
}

/* ---------- balance sheet ---------- */

export function balanceSheet(asOf?: string) {
  const { dr, cr } = movements(undefined, asOf);
  const accts = accountsSorted();
  const amt = (a: Rec) => sectionSigned(a, dr.get(a.id) ?? 0, cr.get(a.id) ?? 0);
  const rows = (t: string) => accts.filter((a) => a.type === t).map((a) => ({ account: a, amount: amt(a) })).filter((r) => r.amount !== 0);
  const total = (r: { amount: number }[]) => r3(r.reduce((s, x) => s + x.amount, 0));
  const earnings = r3(accts.filter((a) => a.type === "REVENUE").reduce((s, a) => s + amt(a), 0) - accts.filter((a) => a.type === "EXPENSE").reduce((s, a) => s + amt(a), 0));
  const assets = rows("ASSET"), liabilities = rows("LIABILITY"), equity = rows("EQUITY");
  const totalAssets = total(assets), totalLiabilities = total(liabilities), totalEquity = r3(total(equity) + earnings);
  return { assets, liabilities, equity, earnings, totalAssets, totalLiabilities, totalEquity, balanced: Math.abs(totalAssets - totalLiabilities - totalEquity) < 0.01 };
}

/* ---------- cash flow (indirect) ---------- */

const inRange = (lo: string, hi: string) => (a: Rec) => code(a) >= lo && code(a) <= hi;
const CASH = inRange("1000", "1110");

export function cashFlow(from?: string, to?: string) {
  const start = from ? balanceAsOf(dayBefore(from)) : new Map<string, number>();
  const end = balanceAsOf(to);
  const accts = accountsSorted();
  const delta = (pred: (a: Rec) => boolean) => r3(accts.filter(pred).reduce((s, a) => s + (end.get(a.id) ?? 0) - (start.get(a.id) ?? 0), 0));
  const pnl = profitAndLoss(from, to);
  const dep = -delta(inRange("1700", "1730")) - delta(inRange("1810", "1810")); // accumulated depreciation / amortisation grows (negative asset)
  const ar = -delta(inRange("1200", "1210"));
  const ap = delta(inRange("2000", "2000"));
  const inv = -delta(inRange("1300", "1310"));
  const otherOp = r3(-delta((a) => a.type === "ASSET" && !CASH(a) && !inRange("1200", "1310")(a) && !inRange("1600", "1810")(a)) + delta((a) => a.type === "LIABILITY" && !inRange("2000", "2000")(a) && !inRange("2200", "2600")(a)));
  const fixed = -delta(inRange("1600", "1630"));
  const intangibles = -delta(inRange("1800", "1800"));
  const loans = delta(inRange("2200", "2600"));
  const equity = delta((a) => a.type === "EQUITY" && !["3100", "3200"].includes(code(a)));
  const operating = r3(pnl.net + dep + ar + ap + inv + otherOp);
  const investing = r3(fixed + intangibles);
  const financing = r3(loans + equity);
  return { net: pnl.net, dep, ar, ap, inv, otherOp, fixed: r3(Math.min(0, fixed + intangibles)), disposals: r3(Math.max(0, fixed + intangibles)), loans, equity, operating, investing, financing, change: r3(operating + investing + financing), cashChange: delta(CASH) };
}

/* ---------- ratios ---------- */

export function ratios(asOf?: string) {
  const bal = balanceAsOf(asOf);
  const accts = accountsSorted();
  const sum = (pred: (a: Rec) => boolean) => r3(accts.filter(pred).reduce((s, a) => s + (bal.get(a.id) ?? 0), 0));
  const ca = sum((a) => a.type === "ASSET" && code(a) < "1600"), inv = sum(inRange("1300", "1310")), cl = sum((a) => a.type === "LIABILITY" && code(a) < "2500");
  const bs = balanceSheet(asOf), year = (asOf ?? todayIso()).slice(0, 4);
  const p = profitAndLoss(`${year}-01-01`, asOf);
  const pct = (a: number, b: number) => (b ? (a / b) * 100 : null);
  return {
    current: cl ? ca / cl : null, quick: cl ? (ca - inv) / cl : null, workingCapital: ca || cl ? ca - cl : null,
    debtEquity: bs.totalEquity ? bs.totalLiabilities / bs.totalEquity : null, proprietary: bs.totalAssets ? bs.totalEquity / bs.totalAssets : null,
    gross: pct(p.gross, p.totalSales), netPct: pct(p.net, p.totalSales + p.otherIncome), opCost: pct(p.totalExpenses, p.totalSales),
    roe: pct(p.net, bs.totalEquity), roa: pct(p.net, bs.totalAssets),
  };
}

/* ---------- general ledger ---------- */

export function ledgerFor(accountId: string, from?: string, to?: string) {
  const a = readCollection("accounts").find((x) => x.id === accountId);
  if (!a) return { opening: 0, rows: [] as { date: string; number: string; journalId: string; description: string; debit: number; credit: number; balance: number }[] };
  const { dr, cr } = from ? movements(undefined, dayBefore(from)) : { dr: new Map(), cr: new Map() };
  const opening = natural(a, dr.get(accountId) ?? 0, cr.get(accountId) ?? 0);
  let bal = opening;
  const rows = journals().filter((j) => (!from || String(j.date) >= from) && (!to || String(j.date) <= to)).sort((x, y) => String(x.date).localeCompare(String(y.date)) || String(x.createdAt).localeCompare(String(y.createdAt)))
    .flatMap((j) => ((j.lines as Rec[]) ?? []).filter((l) => l.accountId === accountId).map((l) => {
      bal = r3(bal + natural(a, n(l.debit), n(l.credit)));
      return { date: String(j.date), number: String(j.number ?? ""), journalId: j.id, description: String(l.memo || j.description || ""), debit: n(l.debit), credit: n(l.credit), balance: bal };
    }));
  return { opening, rows };
}

/* ---------- receivables / payables ageing ---------- */

export type Due = { party: string; number: string; id: string; date: string; dueDate: string; amount: number; kind: "AR" | "AP" };
export function openItems(asOf = todayIso()): Due[] {
  const ar = readCollection("invoices").filter((i) => ["UNPAID", "PARTIAL"].includes(statusFor(i)) && String(i.date) <= asOf).map((i) => ({ party: String(i.customer), number: String(i.number), id: i.id, date: String(i.date), dueDate: String(i.dueDate || i.date), amount: outstanding(i), kind: "AR" as const }));
  const ap = readCollection("bills").filter((b) => billOpen(b) && String(b.date) <= asOf).map((b) => ({ party: String(b.vendor), number: String(b.number), id: b.id, date: String(b.date), dueDate: String(b.dueDate || b.date), amount: billOutstanding(b), kind: "AP" as const }));
  return [...ar, ...ap].filter((x) => x.amount > 0.0005);
}

export const AGE_BUCKETS = ["Not Due", "1–30", "31–60", "61–90", "90+"];
export function bucketOf(dueDate: string, asOf: string) {
  const d = daysBetween(dueDate, asOf);
  return d <= 0 ? 0 : d <= 30 ? 1 : d <= 60 ? 2 : d <= 90 ? 3 : 4;
}
export function ageing(kind: "AR" | "AP", asOf = todayIso()) {
  const map = new Map<string, number[]>();
  for (const it of openItems(asOf).filter((x) => x.kind === kind)) {
    const row = map.get(it.party) ?? [0, 0, 0, 0, 0];
    row[bucketOf(it.dueDate, asOf)] += it.amount;
    map.set(it.party, row);
  }
  return [...map].map(([party, b]) => ({ party, buckets: b.map(r3), total: r3(b.reduce((s, x) => s + x, 0)) })).sort((a, b) => b.total - a.total);
}

/* ---------- funds flow (working-capital view) ---------- */

export function fundsFlow(open: string, close: string) {
  const a = balanceAsOf(open), b = balanceAsOf(close);
  const accts = accountsSorted();
  const current = (x: Rec) => (x.type === "ASSET" && code(x) < "1600") || (x.type === "LIABILITY" && code(x) < "2500");
  const wc = (m: Map<string, number>) => r3(accts.filter(current).reduce((s, x) => s + (m.get(x.id) ?? 0) * (x.type === "ASSET" ? 1 : -1), 0));
  const p = profitAndLoss(open, close);
  const sources: { label: string; amount: number }[] = [], uses: { label: string; amount: number }[] = [];
  if (p.net > 0) sources.push({ label: "Funds from operations (net profit)", amount: p.net }); else if (p.net < 0) uses.push({ label: "Loss from operations", amount: -p.net });
  for (const x of accts.filter((y) => !current(y) && (y.type === "ASSET" || y.type === "LIABILITY" || (y.type === "EQUITY" && !["3100", "3200"].includes(code(y)))))) {
    const d = r3((b.get(x.id) ?? 0) - (a.get(x.id) ?? 0));
    if (!d) continue;
    const isAsset = x.type === "ASSET";
    const signed = d;
    // More fixed assets = an application; more long-term funding/equity = a source (and the reverse).
    if (isAsset ? signed > 0 : signed < 0) uses.push({ label: `${isAsset ? "Increase" : "Decrease"} in ${x.name}`, amount: Math.abs(signed) });
    else sources.push({ label: `${isAsset ? "Decrease" : "Increase"} in ${x.name}`, amount: Math.abs(signed) });
  }
  const wcOpen = wc(a), wcClose = wc(b);
  return { sources, uses, wcOpen, wcClose, wcChange: r3(wcClose - wcOpen), totalSources: r3(sources.reduce((s, x) => s + x.amount, 0)), totalUses: r3(uses.reduce((s, x) => s + x.amount, 0)) };
}

/* ---------- exceptions ---------- */

export function exceptions(asOf = todayIso()) {
  const descs = journals().map((j) => String(j.description ?? "")).join("\n") + "\n" + readCollection("journal-entries").map((j) => String(j.description ?? "")).join("\n");
  const unposted = [
    ...readCollection("invoices").filter((i) => i.status !== "DRAFT" && i.status !== "CANCELLED" && n(i.total) > 0 && !descs.includes(String(i.number))).map((i) => ({ kind: "Invoice", number: String(i.number), party: String(i.customer), amount: n(i.total) })),
    ...readCollection("bills").filter((b) => b.status !== "DRAFT" && b.status !== "CANCELLED" && n(b.total) > 0 && !descs.includes(String(b.number))).map((b) => ({ kind: "Bill", number: String(b.number), party: String(b.vendor), amount: n(b.total) })),
    ...readCollection("ar-payments").filter((p) => !p.journalId).map((p) => ({ kind: "Receipt", number: String(p.number), party: String(p.customer), amount: n(p.amount) })),
    ...readCollection("ap-payments").filter((p) => !p.journalId).map((p) => ({ kind: "Payment", number: String(p.number), party: String(p.vendor), amount: n(p.amount) })),
  ];
  const stock = new Map<string, number>();
  for (const m of readCollection("stock-moves")) { const k = `${m.productId}|${m.warehouseId}`; stock.set(k, r3((stock.get(k) ?? 0) + n(m.qty))); }
  const products = readCollection("products"), warehouses = readCollection("warehouses");
  const negative = [...stock].filter(([, q]) => q < -0.0005).map(([k, q]) => { const [p, w] = k.split("|"); return { product: String(products.find((x) => x.id === p)?.name ?? p), warehouse: String(warehouses.find((x) => x.id === w)?.name ?? w), qty: q }; });
  const mv = movements(undefined, asOf);
  const nat = new Map(accountsSorted().map((a) => [a.id, natural(a, mv.dr.get(a.id) ?? 0, mv.cr.get(a.id) ?? 0)]));
  const wrong = accountsSorted().filter((a) => (nat.get(a.id) ?? 0) < -0.005).map((a) => ({ code: String(a.code), name: String(a.name), balance: nat.get(a.id) ?? 0, side: a.normalBalance === "CREDIT" ? "Debit" : "Credit" }));
  const items = openItems(asOf);
  const customers = readCollection("customers");
  const overdue = (k: "AR" | "AP") => items.filter((x) => x.kind === k && x.dueDate < asOf).map((x) => ({ ...x, days: daysBetween(x.dueDate, asOf) }));
  const breaches = customers.filter((c) => n(c.creditLimit) > 0).map((c) => ({ name: String(c.name), limit: n(c.creditLimit), balance: r3(items.filter((x) => x.kind === "AR" && x.party === c.name).reduce((s, x) => s + x.amount, 0)) })).filter((c) => c.balance > c.limit);
  return { unposted, negative, wrong, overdueAR: overdue("AR"), overdueAP: overdue("AP"), breaches };
}

/* ---------- registers ---------- */

export const lineNet = (l: Rec) => n(l.qty) * n(l.unitPrice) * (1 - n(l.discPct) / 100);
export const docLines = (d: Rec) => ((d.lines as Rec[]) ?? []);
export const booked = (d: Rec) => d.status !== "DRAFT" && d.status !== "CANCELLED";
