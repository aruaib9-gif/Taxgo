"use client";

// Analytics › reports hub, the catalogue of operational reports (sales, purchasing, inventory,
// assets, budgets, currency), stock summary, report builder, columnar register and exceptions.

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Box, Building2, ChartLine, ChartPie, CircleDollarSign, Clock, FileText, Folder, Globe, Landmark, Package, Play, Save, Scale, ShoppingCart, Target, Trash2, Users, Wallet, X } from "lucide-react";
import { createRecord, deleteRecord, readCollection, useCollection, type Rec } from "@/lib/store";
import { balances } from "@/lib/stock";
import { outstanding, statusFor } from "@/lib/sales";
import { billOpen, billOutstanding, billStatus } from "@/lib/purchases";
import { budgetActuals, budgetTotal, rateOn } from "@/lib/finance";
import { accumulatedAsOf } from "@/components/accounting/assets";
import { AGE_BUCKETS, ageing, booked, daysAgo, daysBetween, docLines, exceptions, lineNet, todayIso } from "@/lib/reports";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, btn, inputCls, money, num } from "@/components/accounting/kit";
import { Select } from "@/components/accounting/pickers";
import { DownloadMenu, RangeFilter, ReportHeader, SimpleTable, amt, useBooks, useRange } from "@/components/analytics/kit";

/* ---------- hub ---------- */

type HubItem = { title: string; desc: string; href?: string; icon: typeof FileText };
const HUB: { cat: string; icon: typeof FileText; items: HubItem[]; soon?: HubItem[] }[] = [
  { cat: "Financial", icon: ChartLine, items: [
    { title: "Trial Balance", desc: "Debit and credit balances for all accounts", href: "/reports/trial-balance", icon: Scale },
    { title: "Income Statement (P&L)", desc: "Revenue, expenses, and net income", href: "/reports/income-statement", icon: ChartLine },
    { title: "Balance Sheet", desc: "Assets, liabilities, and equity snapshot", href: "/reports/balance-sheet", icon: ChartPie },
    { title: "Cash Flow", desc: "Operating, investing, and financing cash flows", href: "/reports/cash-flow", icon: Wallet },
    { title: "General Ledger", desc: "Detailed transaction history by account", href: "/reports/general-ledger", icon: BookOpen },
    { title: "Reconciliation", desc: "Reconcile bank statements", href: "/reports/bank-reconciliation", icon: Landmark },
    { title: "Budget vs Actual", desc: "Compare budgeted amounts to actual spending", href: "/reports/budget-vs-actual", icon: Target },
    { title: "Budget Summary", desc: "Overview of all budgets and utilization", href: "/reports/budget-summary", icon: FileText },
    { title: "Currency Exposure", desc: "Foreign currency positions and unrealized gains/losses", href: "/reports/currency-exposure", icon: Globe },
  ] },
  { cat: "Sales", icon: ShoppingCart, items: [
    { title: "AR Aging", desc: "Outstanding customer invoices by age", href: "/reports/ar-aging", icon: Clock },
    { title: "Payment Dues", desc: "Aged partner balances — overdue and due in next 10/20/30 days", href: "/reports/upcoming-dues", icon: Clock },
    { title: "Sales by Period", desc: "Sales volume and revenue over time", href: "/reports/sales-by-period", icon: ChartLine },
    { title: "Category Sales Report", desc: "Sales by main category and sub-category, product-wise", href: "/reports/sales-by-category", icon: ChartPie },
    { title: "Customer Sales Report", desc: "Each customer's purchases by category and product", href: "/reports/sales-by-customer", icon: Users },
    { title: "Salesman Report", desc: "Sales and commission per salesman, invoice-wise", href: "/reports/salesman", icon: Users },
    { title: "Salesman Item-wise Report", desc: "Items each salesman sold, by category and product", href: "/reports/salesman-items", icon: Package },
    { title: "FOC Report", desc: "Free goods given — customer-wise, invoice-wise and item-wise", href: "/reports/foc", icon: Box },
    { title: "Additional Discount Report", desc: "Fees and rebates given — customer-wise, invoice-wise and type-wise", href: "/reports/additional-discounts", icon: CircleDollarSign },
  ], soon: [{ title: "Sales Pipeline", desc: "Funnel value by stage", icon: Target }] },
  { cat: "Purchasing", icon: FileText, items: [
    { title: "AP Aging", desc: "Outstanding vendor bills by age", href: "/reports/ap-aging", icon: Clock },
    { title: "Purchase Report", desc: "Vendor-wise, bill-wise, item-wise and warehouse-wise", href: "/reports/purchases", icon: ShoppingCart },
    { title: "Purchases by Vendor", desc: "Total spend per supplier", href: "/reports/purchases-by-vendor", icon: Users },
    { title: "Purchase Register (item-wise)", desc: "GST purchases per item: HSN, taxable value and the CGST/SGST/IGST split", href: "/reports/purchase-register", icon: FileText },
  ], soon: [{ title: "Open POs", desc: "Outstanding purchase commitments", icon: FileText }, { title: "Vendor Spend Analysis", desc: "Category-wise spend breakdown", icon: ChartPie }] },
  { cat: "Inventory", icon: Package, items: [
    { title: "Inventory Valuation", desc: "Current stock quantities and values", href: "/reports/inventory-valuation", icon: Package },
    { title: "Stock Aging", desc: "On-hand value bucketed by days since last movement", href: "/inventory/aging", icon: Clock },
    { title: "Stock Summary", desc: "Balance stock, fast and slow movers — per branch and all branches", href: "/reports/stock-summary", icon: Box },
    { title: "Warehouse Stock", desc: "Stock in each warehouse and all warehouses together", href: "/reports/stock-summary?groupBy=warehouse", icon: Building2 },
    { title: "Expiry Report", desc: "Batches expired or expiring within their alert days", href: "/reports/expiry", icon: Clock },
    { title: "Slow-moving Items", desc: "Stock idle beyond a chosen threshold", href: "/reports/slow-moving", icon: Package },
  ], soon: [{ title: "Reorder Recommendations", desc: "Items below reorder point", icon: Package }, { title: "Stock Movement", desc: "Inflows, outflows and adjustments", icon: ChartLine }] },
  { cat: "Assets", icon: Building2, items: [
    { title: "Asset Register", desc: "Manage fixed assets", href: "/reports/asset-register", icon: Building2 },
    { title: "Depreciation Schedule", desc: "Asset depreciation over time", href: "/reports/depreciation-schedule", icon: ChartLine },
  ] },
  { cat: "HR & Payroll", icon: Users, items: [] },
  { cat: "Projects", icon: Folder, items: [] },
  { cat: "Manufacturing", icon: Package, items: [] },
];

export function ReportsHub() {
  const [cat, setCat] = useState("Financial");
  const group = HUB.find((g) => g.cat === cat)!;
  return (
    <div className="space-y-4">
      <ReportHeader title="Reports" subtitle="Financial and operational reports" />
      <div role="tablist" className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">{HUB.map((g) => <button key={g.cat} role="tab" aria-selected={g.cat === cat} type="button" onClick={() => setCat(g.cat)} className={cn("flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm", g.cat === cat ? "bg-background font-medium shadow" : "text-muted-foreground")}><g.icon className="size-3.5" />{g.cat}<span className="text-[10px]">{g.items.length}</span></button>)}</div>
      {group.items.length === 0 && <Card><div className="p-8 text-center text-sm text-muted-foreground">No reports in this category yet.</div></Card>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.items.map((r) => <Link key={r.title} href={r.href!}><Card className="h-full transition-colors hover:border-primary/40"><div className="flex gap-3 p-5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><r.icon className="size-4" /></span><div><p className="font-semibold">{r.title}</p><p className="mt-1 text-sm text-muted-foreground">{r.desc}</p></div></div></Card></Link>)}</div>
      {group.soon && <><p className="pt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Coming soon</p><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{group.soon.map((r) => <Card key={r.title} className="opacity-60"><div className="flex gap-3 p-5"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted"><r.icon className="size-4" /></span><div><p className="flex items-center gap-2 font-semibold">{r.title}<Badge>SOON</Badge></p><p className="mt-1 text-sm text-muted-foreground">{r.desc}</p></div></div></Card>)}</div></>}
    </div>
  );
}

/* ---------- catalogue ---------- */

type Out = { headers: string[]; rows: (string | number)[][]; money?: number[]; foot?: (string | number)[]; note?: string; empty?: string };
type Def = { title: string; subtitle: string; filter: "range" | "asOf" | "none" | "days"; run: (p: { from?: string; to?: string; asOf: string; days: number }) => Out };

const prodName = (id: unknown) => String(readCollection("products").find((p) => p.id === id)?.name ?? "");
const catOf = (pid: unknown) => {
  const p = readCollection("products").find((x) => x.id === pid);
  const cats = readCollection("product-categories");
  const c = cats.find((x) => x.id === p?.categoryId);
  const parent = c?.parentId ? cats.find((x) => x.id === c.parentId) : undefined;
  return { main: String(parent?.name ?? c?.name ?? "Uncategorised"), sub: parent ? String(c?.name) : "—" };
};
const inRange = (d: unknown, from?: string, to?: string) => (!from || String(d) >= from) && (!to || String(d) <= to);
const invoicesIn = (from?: string, to?: string) => readCollection("invoices").filter((i) => booked(i) && inRange(i.date, from, to));
const billsIn = (from?: string, to?: string) => readCollection("bills").filter((b) => booked(b) && inRange(b.date, from, to));
const seller = (i: Rec) => String(i.salesperson || BRAND.user.fullName);
const sumBy = <T,>(rows: T[], key: (r: T) => string, val: (r: T) => number[]) => { const m = new Map<string, number[]>(); for (const r of rows) { const k = key(r); const v = val(r); const cur = m.get(k) ?? v.map(() => 0); m.set(k, cur.map((x, i) => x + v[i])); } return m; };
const lineItems = (docs: Rec[]) => docs.flatMap((d) => docLines(d).map((l) => ({ doc: d, l, net: lineNet(l), qty: num(l.qty) })));
const r3 = (v: number) => Math.round(v * 1000) / 1000;
const ageingOut = (kind: "AR" | "AP", asOf: string): Out => { const rows = ageing(kind, asOf); const tot = AGE_BUCKETS.map((_, i) => rows.reduce((s, x) => s + x.buckets[i], 0)); return { headers: [kind === "AR" ? "Customer" : "Vendor", ...AGE_BUCKETS, "Total"], rows: rows.map((x) => [x.party, ...x.buckets, x.total]), money: [1, 2, 3, 4, 5, 6], foot: rows.length ? ["Total", ...tot, tot.reduce((s, v) => s + v, 0)] : undefined, empty: "Nothing outstanding" }; };

export const CATALOG: Record<string, Def> = {
  "bank-reconciliation": { title: "Bank Reconciliation", subtitle: "Reconcile bank statements", filter: "none", run: () => { const banks = readCollection("bank-accounts"); return { headers: ["Reconciliation #", "Bank Account", "Period", "Statement Balance", "GL Balance", "Status"], money: [3, 4], rows: readCollection("reconciliations").map((r) => [String(r.recNumber), String(banks.find((b) => b.id === r.bankAccountId)?.accountName ?? "—"), `${r.periodStart} → ${r.periodEnd}`, num(r.statementBalance), num(r.glBalance), String(r.status)]), note: "Start or continue a reconciliation from Finance › Reconciliation.", empty: "No reconciliations yet." }; } },
  "budget-vs-actual": { title: "Budget vs Actual", subtitle: "Compare budgeted amounts to actual spending", filter: "none", run: () => { const accts = readCollection("accounts"); const rows = readCollection("budgets").filter((b) => ["ACTIVE", "APPROVED", "CLOSED"].includes(String(b.status))).flatMap((b) => budgetActuals(b).map((l) => { const a = accts.find((x) => x.id === l.accountId); return [String(b.name), `${a?.code ?? ""} ${a?.name ?? ""}`, l.amount, l.actual, l.variance, `${l.utilization.toFixed(1)}%`]; })); return { headers: ["Budget", "Account", "Budget", "Actual", "Variance", "Utilization"], money: [2, 3, 4], rows, empty: "No approved or active budgets." }; } },
  "budget-summary": { title: "Budget Summary", subtitle: "Overview of all budgets and utilization", filter: "none", run: () => ({ headers: ["Budget", "Fiscal Year", "Period Type", "Status", "Total Budget", "Actual", "Utilization"], money: [4, 5], rows: readCollection("budgets").map((b) => { const t = budgetTotal(b); const a = budgetActuals(b).reduce((s, l) => s + l.actual, 0); return [String(b.name), String(b.fiscalYear), String(b.periodType), String(b.status), t, a, t ? `${((a / t) * 100).toFixed(1)}%` : "—"]; }), empty: "No budgets yet." }) },
  "currency-exposure": { title: "Currency Exposure", subtitle: "Foreign currency positions and unrealized gains/losses", filter: "asOf", run: ({ asOf }) => {
    const pos = new Map<string, { recv: number; pay: number; booked: number; now: number }>();
    const add = (cur: string, base: number, date: string, sign: 1 | -1, kind: "recv" | "pay") => { const bookRate = rateOn(cur, "USD", date) || 1; const foreign = base / bookRate; const nowRate = rateOn(cur, "USD", asOf) || bookRate; const p = pos.get(cur) ?? { recv: 0, pay: 0, booked: 0, now: 0 }; p[kind] += foreign; p.booked += sign * base; p.now += sign * foreign * nowRate; pos.set(cur, p); };
    for (const i of readCollection("invoices").filter((x) => x.currency && x.currency !== "USD" && ["UNPAID", "PARTIAL"].includes(statusFor(x)))) add(String(i.currency), outstanding(i), String(i.date), 1, "recv");
    for (const b of readCollection("bills").filter((x) => x.currency && x.currency !== "USD" && billOpen(x))) add(String(b.currency), billOutstanding(b), String(b.date), -1, "pay");
    return { headers: ["Currency", "Receivable (FC)", "Payable (FC)", "Net position (FC)", "Booked value", "Value today", "Unrealized gain/loss"], money: [4, 5, 6], rows: [...pos].map(([c, p]) => [c, r3(p.recv), r3(p.pay), r3(p.recv - p.pay), r3(p.booked), r3(p.now), r3(p.now - p.booked)]), empty: "No open foreign-currency documents." };
  } },
  "ar-aging": { title: "AR Aging", subtitle: "Outstanding customer invoices by age", filter: "asOf", run: ({ asOf }) => ageingOut("AR", asOf) },
  "ap-aging": { title: "AP Aging", subtitle: "Outstanding vendor bills by age", filter: "asOf", run: ({ asOf }) => ageingOut("AP", asOf) },
  "sales-by-period": { title: "Sales by Period", subtitle: "Sales volume and revenue over time", filter: "range", run: ({ from, to }) => { const m = sumBy(invoicesIn(from, to), (i) => String(i.date).slice(0, 7), (i) => [1, num(i.subtotal), num(i.discount), num(i.tax), num(i.total)]); const rows = [...m].sort().map(([k, v]) => [new Date(`${k}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" }), ...v]); return { headers: ["Period", "Invoices", "Subtotal", "Discount", "Tax", "Total"], money: [2, 3, 4, 5], rows, foot: rows.length ? ["Total", ...[1, 2, 3, 4, 5].map((i) => rows.reduce((s, r) => s + Number(r[i]), 0))] : undefined, empty: "No sales in this period." }; } },
  "sales-by-category": { title: "Category Sales Report", subtitle: "Sales by main category and sub-category, product-wise", filter: "range", run: ({ from, to }) => { const m = sumBy(lineItems(invoicesIn(from, to)), (x) => { const c = catOf(x.l.productId); return `${c.main}|${c.sub}|${prodName(x.l.productId) || x.l.description}`; }, (x) => [x.qty, x.net]); return { headers: ["Main Category", "Sub-category", "Product", "Qty", "Amount"], money: [4], rows: [...m].sort().map(([k, v]) => [...k.split("|"), v[0], v[1]]), empty: "No sales in this period." }; } },
  "sales-by-customer": { title: "Customer Sales Report", subtitle: "Each customer's purchases by category and product", filter: "range", run: ({ from, to }) => { const m = sumBy(lineItems(invoicesIn(from, to)), (x) => `${x.doc.customer}|${catOf(x.l.productId).main}|${prodName(x.l.productId) || x.l.description}`, (x) => [x.qty, x.net]); return { headers: ["Customer", "Category", "Product", "Qty", "Amount"], money: [4], rows: [...m].sort().map(([k, v]) => [...k.split("|"), v[0], v[1]]), empty: "No sales in this period." }; } },
  salesman: { title: "Salesman Report", subtitle: "Sales and commission per salesman, invoice-wise", filter: "range", run: ({ from, to }) => { const plans = readCollection("commission-plans"); const rate = (s: string) => num((plans.find((p) => p.salesperson === s) ?? plans.find((p) => !p.salesperson))?.rate); const rows = invoicesIn(from, to).map((i) => { const s = seller(i); const net = num(i.subtotal) - num(i.discount); return [s, String(i.number), String(i.date), String(i.customer), net, r3((net * rate(s)) / 100)]; }).sort((a, b) => String(a[0]).localeCompare(String(b[0]))); return { headers: ["Salesman", "Invoice", "Date", "Customer", "Net Sales", "Commission"], money: [4, 5], rows, foot: rows.length ? ["Total", "", "", "", rows.reduce((s, r) => s + Number(r[4]), 0), rows.reduce((s, r) => s + Number(r[5]), 0)] : undefined, note: "Commission uses the salesperson's plan (Sales › Commissions), or the default plan.", empty: "No sales in this period." }; } },
  "salesman-items": { title: "Salesman Item-wise Report", subtitle: "Items each salesman sold, by category and product", filter: "range", run: ({ from, to }) => { const m = sumBy(lineItems(invoicesIn(from, to)), (x) => `${seller(x.doc)}|${catOf(x.l.productId).main}|${prodName(x.l.productId) || x.l.description}`, (x) => [x.qty, x.net]); return { headers: ["Salesman", "Category", "Product", "Qty", "Amount"], money: [4], rows: [...m].sort().map(([k, v]) => [...k.split("|"), v[0], v[1]]), empty: "No sales in this period." }; } },
  foc: { title: "FOC Report", subtitle: "Free goods given — customer-wise, invoice-wise and item-wise", filter: "range", run: ({ from, to }) => { const products = readCollection("products"); const rows = lineItems(invoicesIn(from, to)).filter((x) => x.qty > 0 && (num(x.l.unitPrice) === 0 || num(x.l.discPct) >= 100)).map((x) => { const p = products.find((y) => y.id === x.l.productId); return [String(x.doc.customer), String(x.doc.number), String(x.doc.date), prodName(x.l.productId) || String(x.l.description), x.qty, r3(x.qty * num(p?.retail ?? x.l.unitPrice))]; }); return { headers: ["Customer", "Invoice", "Date", "Item", "Free Qty", "Value at list price"], money: [5], rows, empty: "No free goods in this period — lines at zero price or 100% discount show here." }; } },
  "additional-discounts": { title: "Additional Discount Report", subtitle: "Fees and rebates given — customer-wise, invoice-wise and type-wise", filter: "range", run: ({ from, to }) => ({ headers: ["Customer", "Invoice", "Date", "Type", "Rate / Value", "Discount"], money: [5], rows: invoicesIn(from, to).filter((i) => num(i.discount) > 0).map((i) => [String(i.customer), String(i.number), String(i.date), i.discountType === "PERCENT" || i.discountType === "PERCENTAGE" ? "Percentage" : "Fixed amount", num(i.discountValue), num(i.discount)]), empty: "No document-level discounts in this period." }) },
  purchases: { title: "Purchase Report", subtitle: "Vendor-wise, bill-wise, item-wise and warehouse-wise", filter: "range", run: ({ from, to }) => { const wh = readCollection("warehouses"); return { headers: ["Vendor", "Bill", "Date", "Item", "Warehouse", "Qty", "Net", "Status"], money: [6], rows: lineItems(billsIn(from, to)).map((x) => [String(x.doc.vendor), String(x.doc.number), String(x.doc.date), prodName(x.l.productId) || String(x.l.description), String(wh.find((w) => w.id === x.doc.warehouseId)?.name ?? "—"), x.qty, r3(x.net), billStatus(x.doc)]), empty: "No purchases in this period." }; } },
  "purchases-by-vendor": { title: "Purchases by Vendor", subtitle: "Total spend per supplier", filter: "range", run: ({ from, to }) => { const m = sumBy(billsIn(from, to), (b) => String(b.vendor), (b) => [1, num(b.subtotal) - num(b.discount), num(b.tax), num(b.total)]); const rows = [...m].sort((a, b) => b[1][3] - a[1][3]).map(([k, v]) => [k, ...v]); return { headers: ["Vendor", "Bills", "Net", "Tax", "Total"], money: [2, 3, 4], rows, foot: rows.length ? ["Total", ...[1, 2, 3, 4].map((i) => rows.reduce((s, r) => s + Number(r[i]), 0))] : undefined, empty: "No purchases in this period." }; } },
  "purchase-register": { title: "Purchase Register (item-wise)", subtitle: "GST purchases per item: HSN, taxable value and the CGST/SGST/IGST split", filter: "range", run: ({ from, to }) => { const products = readCollection("products"); const vendors = readCollection("vendors"); return { headers: ["Bill", "Date", "Vendor", "Item", "HSN", "Taxable", "CGST", "SGST", "IGST"], money: [5, 6, 7, 8], rows: lineItems(billsIn(from, to)).map((x) => { const tax = r3((x.net * num(x.l.taxPct)) / 100); const v = vendors.find((y) => y.name === x.doc.vendor); const inter = Boolean(v?.interState); return [String(x.doc.number), String(x.doc.date), String(x.doc.vendor), prodName(x.l.productId) || String(x.l.description), String(products.find((p) => p.id === x.l.productId)?.hsn ?? "—"), r3(x.net), inter ? 0 : r3(tax / 2), inter ? 0 : r3(tax / 2), inter ? tax : 0]; }), note: "Intra-state purchases split tax equally into CGST and SGST.", empty: "No purchases in this period." }; } },
  "inventory-valuation": { title: "Inventory Valuation", subtitle: "Current stock quantities and values", filter: "asOf", run: ({ asOf }) => { const b = balances(readCollection("stock-moves").filter((m) => String(m.date) <= asOf) as Parameters<typeof balances>[0]); const m = sumBy(b, (x) => x.productId, (x) => [x.qty, x.value]); const products = readCollection("products"); const rows = [...m].filter(([, v]) => Math.abs(v[0]) > 0.0005).map(([pid, v]) => [String(products.find((p) => p.id === pid)?.sku ?? ""), prodName(pid), v[0], v[0] ? r3(v[1] / v[0]) : 0, r3(v[1])]); return { headers: ["SKU", "Product", "On Hand", "Avg Cost", "Value"], money: [3, 4], rows, foot: rows.length ? ["", "Total", rows.reduce((s, r) => s + Number(r[2]), 0), "", rows.reduce((s, r) => s + Number(r[4]), 0)] : undefined, empty: "No stock on hand." }; } },
  expiry: { title: "Expiry Report", subtitle: "Batches expired or expiring within their alert days", filter: "asOf", run: ({ asOf }) => { const products = readCollection("products"); const wh = readCollection("warehouses"); const rows = readCollection("product-batches").filter((b) => b.expiryDate).map((b) => { const p = products.find((x) => x.id === b.productId); const alert = num(p?.expiryAlertDays) || 30; const left = daysBetween(asOf, String(b.expiryDate)); return { b, p, left, alert }; }).filter((x) => x.left <= x.alert).sort((a, b) => a.left - b.left).map(({ b, p, left }) => [String(p?.name ?? "—"), String(b.batchNumber), String(wh.find((w) => w.id === b.warehouseId)?.name ?? "—"), num(b.qty), String(b.expiryDate), left < 0 ? `Expired ${-left}d ago` : left === 0 ? "Expires today" : `${left} days left`]); return { headers: ["Product", "Batch", "Warehouse", "Qty", "Expiry Date", "Status"], rows, empty: "No batches expired or inside their alert window." }; } },
  "slow-moving": { title: "Slow-moving Items", subtitle: "Stock idle beyond a chosen threshold", filter: "days", run: ({ asOf, days }) => { const b = balances(readCollection("stock-moves") as Parameters<typeof balances>[0]).filter((x) => x.qty > 0.0005); const wh = readCollection("warehouses"); const rows = b.map((x) => ({ x, idle: x.lastMove ? daysBetween(x.lastMove, asOf) : 9999 })).filter((y) => y.idle >= days).sort((a, c) => c.idle - a.idle).map(({ x, idle }) => [prodName(x.productId), String(wh.find((w) => w.id === x.warehouseId)?.name ?? "—"), x.qty, r3(x.value), x.lastMove || "—", idle === 9999 ? "—" : idle]); return { headers: ["Product", "Warehouse", "On Hand", "Value", "Last Movement", "Idle Days"], money: [3], rows, empty: `Nothing idle for ${days} days or more.` }; } },
  "asset-register": { title: "Asset Register", subtitle: "Manage fixed assets", filter: "asOf", run: ({ asOf }) => { const cats = readCollection("asset-categories"); const rows = readCollection("assets").map((a) => { const acc = a.status === "DISPOSED" ? num(a.accumulatedDepreciation) : accumulatedAsOf(a, asOf); return [String(a.number), String(a.name), String(cats.find((c) => c.id === a.categoryId)?.name ?? "—"), String(a.purchaseDate ?? a.inServiceDate ?? "—"), num(a.cost), acc, r3(num(a.cost) - acc), String(a.status)]; }); return { headers: ["Asset #", "Name", "Category", "Acquired", "Cost", "Accum. Depreciation", "Net Book Value", "Status"], money: [4, 5, 6], rows, foot: rows.length ? ["", "Total", "", "", rows.reduce((s, r) => s + Number(r[4]), 0), rows.reduce((s, r) => s + Number(r[5]), 0), rows.reduce((s, r) => s + Number(r[6]), 0), ""] : undefined, empty: "No fixed assets yet." }; } },
  "depreciation-schedule": { title: "Depreciation Schedule", subtitle: "Asset depreciation over time", filter: "none", run: () => { const rows: (string | number)[][] = []; for (const a of readCollection("assets")) { const start = String(a.inServiceDate || a.purchaseDate || ""); if (!start) continue; const years = Math.ceil(Math.max(1, num(a.usefulLife)) / 12) + 1; const y0 = Number(start.slice(0, 4)); for (let y = y0; y < y0 + years; y++) { const open = y === y0 ? 0 : accumulatedAsOf(a, `${y - 1}-12-31`); const close = accumulatedAsOf(a, `${y}-12-31`); if (close - open <= 0.0005 && y > y0) break; rows.push([String(a.number), String(a.name), y, r3(num(a.cost) - open), r3(close - open), r3(num(a.cost) - close)]); } } return { headers: ["Asset #", "Name", "Year", "Opening NBV", "Depreciation", "Closing NBV"], money: [3, 4, 5], rows, empty: "No fixed assets yet." }; } },
};

export function CatalogReport({ slug }: { slug: string }) {
  const def = CATALOG[slug];
  const ready = useBooks(["product-batches", "assets", "budgets"]);
  useCollection("reconciliations");
  const r = useRange();
  const [days, setDays] = useState(90);
  if (!def) return <Card><div className="p-8 text-center text-sm text-muted-foreground">Report not found. <Link className="text-primary underline" href="/reports">All reports</Link></div></Card>;
  const out = ready ? def.run({ from: r.from, to: r.to, asOf: r.to ?? todayIso(), days }) : null;
  const fmt = (row: (string | number)[]) => row.map((c, i) => (out?.money?.includes(i) && typeof c === "number" ? amt(c) : typeof c === "number" ? c.toLocaleString(undefined, { maximumFractionDigits: 3 }) : c));
  const right = out ? out.headers.map((_, i) => i).filter((i) => out.rows.some((row) => typeof row[i] === "number")) : [];
  return (
    <div className="space-y-4">
      <ReportHeader title={def.title} subtitle={def.subtitle} actions={out && <DownloadMenu name={slug} table={() => ({ headers: out.headers, rows: out.rows })} />} />
      {def.filter === "range" && <RangeFilter r={r} />}
      {(def.filter === "asOf" || def.filter === "days") && <RangeFilter r={r} single>{def.filter === "days" && <label className="space-y-1.5"><span className="text-sm font-medium">Idle for at least (days)</span><input aria-label="Idle days" type="number" min="1" className={cn(inputCls, "w-28")} value={days} onChange={(e) => setDays(num(e.target.value) || 1)} /></label>}</RangeFilter>}
      {out && <Card><div className="p-4"><SimpleTable headers={out.headers} right={right} empty={out.empty} rows={out.rows.map(fmt)} foot={out.foot ? fmt(out.foot) : undefined} />{out.note && <p className="mt-2 px-3 text-xs text-muted-foreground">{out.note}</p>}</div></Card>}
    </div>
  );
}

/* ---------- stock summary ---------- */

export function StockSummary({ byWarehouse }: { byWarehouse?: boolean }) {
  const ready = useBooks(["warehouses", "units"]);
  const warehouses = useCollection("warehouses");
  const products = useCollection("products");
  const [tab, setTab] = useState<"BALANCE" | "FAST" | "SLOW">("BALANCE");
  const [group, setGroup] = useState<"BRANCH" | "WAREHOUSE">(byWarehouse ? "WAREHOUSE" : "BRANCH");
  const [scope, setScope] = useState("");
  const [unit, setUnit] = useState("BASE");
  const moves = ready ? readCollection("stock-moves") : [];
  const b = balances(moves as Parameters<typeof balances>[0]);
  const branchOf = (wid: string) => String(warehouses.find((w) => w.id === wid)?.orgUnit || "Unassigned");
  const branches = [...new Set(warehouses.map((w) => String(w.orgUnit || "Unassigned")))];
  const keyOf = (wid: string) => (group === "BRANCH" ? branchOf(wid) : String(warehouses.find((w) => w.id === wid)?.name ?? "—"));
  const scoped = b.filter((x) => !scope || keyOf(x.warehouseId) === scope);
  const since = daysAgo(90);
  const sold = new Map<string, number>();
  for (const m of moves.filter((x) => x.type === "SALE" && String(x.date) >= since && (!scope || keyOf(String(x.warehouseId)) === scope))) sold.set(String(m.productId), (sold.get(String(m.productId)) ?? 0) - num(m.qty));
  const conv = (pid: string, q: number) => { const p = products.find((x) => x.id === pid); return unit === "ALT" && num(p?.altFactor) > 0 ? `${r3(q / num(p?.altFactor))} ${p?.altUnit ?? "alt"}` : `${q} ${p?.uom ?? ""}`.trim(); };
  const perProduct = [...sumBy(scoped, (x) => x.productId, (x) => [x.qty, x.value])].map(([pid, v]) => ({ pid, qty: v[0], value: v[1], sold: sold.get(pid) ?? 0, last: scoped.filter((x) => x.productId === pid).map((x) => x.lastMove).sort().pop() ?? "" }));
  const list = tab === "BALANCE" ? perProduct.filter((x) => Math.abs(x.qty) > 0.0005) : tab === "FAST" ? perProduct.filter((x) => x.sold > 0).sort((a, c) => c.sold - a.sold).slice(0, 25) : perProduct.filter((x) => x.qty > 0 && x.sold === 0).sort((a, c) => a.last.localeCompare(c.last));
  const seg = (on: boolean) => cn("rounded-md px-3 py-1 text-sm", on ? "bg-background font-medium shadow" : "text-muted-foreground");
  const headers = ["SKU", "Product", tab === "FAST" ? "Sold (90 days)" : "On Hand", "Value", "Last Movement"];
  const rows = list.map((x) => [String(products.find((p) => p.id === x.pid)?.sku ?? ""), prodName(x.pid), tab === "FAST" ? conv(x.pid, x.sold) : conv(x.pid, x.qty), money(x.value), x.last || "—"]);
  return (
    <div className="space-y-4">
      <ReportHeader title="Stock Summary" subtitle="Balance stock, fast-moving and slow-moving items — per branch or warehouse, and all together" actions={<DownloadMenu name="stock-summary" table={() => ({ headers, rows: rows.map((r) => r.map(String)) })} />} />
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex rounded-lg bg-muted p-1">{([["BALANCE", "Balance Stock"], ["FAST", "Fast Moving"], ["SLOW", "Slow Moving"]] as const).map(([v, l]) => <button key={v} type="button" className={seg(tab === v)} onClick={() => setTab(v)}>{l}</button>)}</div>
        <div className="flex rounded-lg bg-muted p-1">{([["BRANCH", "By Branch"], ["WAREHOUSE", "By Warehouse"]] as const).map(([v, l]) => <button key={v} type="button" className={seg(group === v)} onClick={() => { setGroup(v); setScope(""); }}>{l}</button>)}</div>
        <div className="space-y-1"><span className="text-xs font-medium">{group === "BRANCH" ? "Branch" : "Warehouse"}</span><Select ariaLabel={group === "BRANCH" ? "Branch" : "Warehouse"} className="w-48" value={scope} onChange={setScope} options={[{ value: "", label: group === "BRANCH" ? "All Branches" : "All Warehouses" }, ...(group === "BRANCH" ? branches : warehouses.map((w) => String(w.name))).map((x) => ({ value: x, label: x }))]} /></div>
        <div className="space-y-1"><span className="text-xs font-medium">Unit</span><Select ariaLabel="Unit" className="w-44" value={unit} onChange={setUnit} options={[{ value: "BASE", label: "View in: Base unit" }, { value: "ALT", label: "View in: Alternate unit" }]} /></div>
      </div>
      <Card><div className="p-4">{rows.length === 0 ? <div className="py-6 text-center"><p className="font-medium">No items</p><p className="text-sm text-muted-foreground">Nothing to show for {scope || (group === "BRANCH" ? "All Branches" : "All Warehouses")}.</p></div> : <SimpleTable headers={headers} right={[2, 3]} rows={rows} />}</div></Card>
      {tab !== "BALANCE" && <p className="text-xs text-muted-foreground">{tab === "FAST" ? "Top sellers by quantity shipped in the last 90 days." : "In stock with no sales in the last 90 days, oldest movement first."}</p>}
    </div>
  );
}

/* ---------- report builder ---------- */

type Col = { key: string; label: string; kind: "text" | "date" | "number"; get: (r: Rec) => string | number };
const DATASETS: Record<string, { label: string; rows: () => Rec[]; cols: Col[] }> = {
  invoices: { label: "Sales invoices", rows: () => readCollection("invoices"), cols: [
    { key: "number", label: "Invoice #", kind: "text", get: (r) => String(r.number) }, { key: "customer", label: "Customer", kind: "text", get: (r) => String(r.customer) },
    { key: "date", label: "Date", kind: "date", get: (r) => String(r.date) }, { key: "dueDate", label: "Due date", kind: "date", get: (r) => String(r.dueDate ?? "") },
    { key: "status", label: "Status", kind: "text", get: (r) => statusFor(r) }, { key: "currency", label: "Currency", kind: "text", get: (r) => String(r.currency ?? "USD") },
    { key: "subtotal", label: "Subtotal", kind: "number", get: (r) => num(r.subtotal) }, { key: "tax", label: "Tax", kind: "number", get: (r) => num(r.tax) },
    { key: "total", label: "Total", kind: "number", get: (r) => num(r.total) }, { key: "due", label: "Amount due", kind: "number", get: (r) => outstanding(r) } ] },
  bills: { label: "Purchase bills", rows: () => readCollection("bills"), cols: [
    { key: "number", label: "Bill #", kind: "text", get: (r) => String(r.number) }, { key: "vendor", label: "Vendor", kind: "text", get: (r) => String(r.vendor) },
    { key: "date", label: "Date", kind: "date", get: (r) => String(r.date) }, { key: "dueDate", label: "Due date", kind: "date", get: (r) => String(r.dueDate ?? "") },
    { key: "status", label: "Status", kind: "text", get: (r) => billStatus(r) }, { key: "currency", label: "Currency", kind: "text", get: (r) => String(r.currency ?? "USD") },
    { key: "subtotal", label: "Subtotal", kind: "number", get: (r) => num(r.subtotal) }, { key: "tax", label: "Tax", kind: "number", get: (r) => num(r.tax) },
    { key: "total", label: "Total", kind: "number", get: (r) => num(r.total) }, { key: "due", label: "Amount due", kind: "number", get: (r) => billOutstanding(r) } ] },
  customers: { label: "Customers", rows: () => readCollection("customers"), cols: [
    { key: "name", label: "Name", kind: "text", get: (r) => String(r.name) }, { key: "email", label: "Email", kind: "text", get: (r) => String(r.email ?? "") },
    { key: "phone", label: "Phone", kind: "text", get: (r) => String(r.phone ?? "") }, { key: "city", label: "City", kind: "text", get: (r) => String(r.city ?? "") },
    { key: "creditLimit", label: "Credit limit", kind: "number", get: (r) => num(r.creditLimit) },
    { key: "balance", label: "Balance due", kind: "number", get: (r) => readCollection("invoices").filter((i) => i.customer === r.name).reduce((s, i) => s + outstanding(i), 0) } ] },
  products: { label: "Products", rows: () => readCollection("products"), cols: [
    { key: "sku", label: "SKU", kind: "text", get: (r) => String(r.sku ?? "") }, { key: "name", label: "Name", kind: "text", get: (r) => String(r.name) },
    { key: "category", label: "Category", kind: "text", get: (r) => catOf(r.id).main }, { key: "retail", label: "Price", kind: "number", get: (r) => num(r.retail) },
    { key: "cost", label: "Cost", kind: "number", get: (r) => num(r.cost) },
    { key: "onHand", label: "On hand", kind: "number", get: (r) => readCollection("stock-moves").filter((m) => m.productId === r.id).reduce((s, m) => s + num(m.qty), 0) } ] },
};
type Filter = { col: string; op: string; value: string };
const test = (v: string | number, op: string, x: string) => { const a = typeof v === "number" ? v : String(v).toLowerCase(); const b = typeof v === "number" ? num(x) : x.toLowerCase(); switch (op) { case "≠": return a !== b; case "contains": return String(a).includes(String(b)); case "≥": return a >= b; case "≤": return a <= b; default: return a === b; } };

export function ReportBuilder() {
  const ready = useBooks();
  const views = useCollection("report-views");
  const [ds, setDs] = useState("invoices");
  const D = DATASETS[ds];
  const [cols, setCols] = useState<string[]>(D.cols.map((c) => c.key));
  const [filters, setFilters] = useState<Filter[]>([]);
  const [groupBy, setGroupBy] = useState("");
  const [result, setResult] = useState<{ headers: string[]; rows: (string | number)[][]; numeric: number[] } | null>(null);
  const [name, setName] = useState("");
  function pickDs(v: string) { setDs(v); setCols(DATASETS[v].cols.map((c) => c.key)); setFilters([]); setGroupBy(""); setResult(null); }
  function run(spec = { ds, cols, filters, groupBy }) {
    const d = DATASETS[spec.ds];
    const chosen = d.cols.filter((c) => spec.cols.includes(c.key));
    let rows = d.rows().filter((r) => spec.filters.every((f) => { const c = d.cols.find((x) => x.key === f.col); return !c || f.value === "" || test(c.get(r), f.op, f.value); }));
    if (spec.groupBy) {
      const g = d.cols.find((c) => c.key === spec.groupBy)!;
      const nums = chosen.filter((c) => c.kind === "number");
      const m = new Map<string, number[]>();
      for (const r of rows) { const k = String(g.get(r)); const cur = m.get(k) ?? [0, ...nums.map(() => 0)]; cur[0]++; nums.forEach((c, i) => (cur[i + 1] += Number(c.get(r)))); m.set(k, cur); }
      setResult({ headers: [g.label, "Count", ...nums.map((c) => c.label)], rows: [...m].map(([k, v]) => [k, ...v.map(r3)]), numeric: [1, ...nums.map((_, i) => i + 2)] });
      return;
    }
    rows = rows.slice(0, 1000);
    setResult({ headers: chosen.map((c) => c.label), rows: rows.map((r) => chosen.map((c) => c.get(r))), numeric: chosen.map((c, i) => (c.kind === "number" ? i : -1)).filter((i) => i >= 0) });
  }
  function load(v: Rec) { const s = v.spec as { ds: string; cols: string[]; filters: Filter[]; groupBy: string }; setDs(s.ds); setCols(s.cols); setFilters(s.filters); setGroupBy(s.groupBy); run(s); }
  return (
    <div className="space-y-4">
      <ReportHeader title="Report Builder" subtitle="Pick columns, filters and grouping on a register, run it, export it, save it as a view." />
      {views.length > 0 && <div className="flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Saved views:</span>{views.map((v) => <span key={v.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5"><button type="button" className="hover:underline" onClick={() => load(v)}>{String(v.name)}</button><button type="button" aria-label={`Delete view ${v.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecord("report-views", v.id)}><X className="size-3" /></button></span>)}</div>}
      <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
        <Card><div className="space-y-4 p-5">
          <CardTitle>Configure</CardTitle>
          <div className="block space-y-1.5"><span className="text-sm font-medium">Dataset</span><Select ariaLabel="Dataset" value={ds} onChange={pickDs} options={Object.entries(DATASETS).map(([k, v]) => ({ value: k, label: v.label }))} /></div>
          <div><p className="mb-1 text-sm font-medium">Columns</p><div className="space-y-1">{D.cols.map((c) => <label key={c.key} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={cols.includes(c.key)} onChange={(e) => setCols(e.target.checked ? [...cols, c.key] : cols.filter((x) => x !== c.key))} />{c.label}<span className="text-xs text-muted-foreground">({c.kind})</span></label>)}</div></div>
          <div><p className="mb-1 text-sm font-medium">Filters</p>
            {filters.map((f, i) => <div key={i} className="mb-2 flex gap-1"><Select ariaLabel={`Filter ${i + 1} column`} size="sm" className="w-28" value={f.col} onChange={(v) => setFilters(filters.map((x, j) => (j === i ? { ...x, col: v } : x)))} options={D.cols.map((c) => ({ value: c.key, label: c.label }))} /><Select ariaLabel={`Filter ${i + 1} operator`} size="sm" className="w-24" value={f.op} onChange={(v) => setFilters(filters.map((x, j) => (j === i ? { ...x, op: v } : x)))} options={["=", "≠", "contains", "≥", "≤"]} /><input aria-label={`Filter ${i + 1} value`} className={cn(inputCls, "h-8")} value={f.value} onChange={(e) => setFilters(filters.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} /><button type="button" aria-label="Remove filter" className="text-muted-foreground hover:text-destructive" onClick={() => setFilters(filters.filter((_, j) => j !== i))}><Trash2 className="size-4" /></button></div>)}
            <button type="button" className={btn.smOutline} onClick={() => setFilters([...filters, { col: D.cols[0].key, op: "=", value: "" }])}>Add filter</button>
          </div>
          <div className="block space-y-1.5"><span className="text-sm font-medium">Group by</span><Select ariaLabel="Group by" value={groupBy} onChange={setGroupBy} options={[{ value: "", label: "No grouping" }, ...D.cols.filter((c) => c.kind !== "number").map((c) => ({ value: c.key, label: c.label }))]} /><span className="block text-xs text-muted-foreground">Grouping sums the selected numeric columns.</span></div>
          <button type="button" className={btn.primary} disabled={!ready || !cols.length} onClick={() => run()}><Play /> Run</button>
        </div></Card>
        <Card><div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2"><CardTitle>Result {result && <span className="text-xs font-normal text-muted-foreground">· {result.rows.length} row(s)</span>}</CardTitle>
            <div className="flex gap-2">{result && <><input aria-label="View name" placeholder="View name" className={cn(inputCls, "h-8 w-40")} value={name} onChange={(e) => setName(e.target.value)} /><button type="button" className={btn.smOutline} disabled={!name.trim()} onClick={() => { createRecord("report-views", { name: name.trim(), spec: { ds, cols, filters, groupBy } }); setName(""); }}><Save /> Save view</button></>}<DownloadMenu label="Export" name={`report-${ds}`} table={() => result ?? { headers: [], rows: [] }} /></div></div>
          {!result ? <p className="py-10 text-center text-sm text-muted-foreground">Configure and press Run.</p> : <SimpleTable headers={result.headers} right={result.numeric} empty="No rows match." rows={result.rows.map((r) => r.map((c, i) => (result.numeric.includes(i) && typeof c === "number" ? c.toLocaleString(undefined, { maximumFractionDigits: 3 }) : c)))} />}
        </div></Card>
      </div>
    </div>
  );
}

/* ---------- columnar register ---------- */

export function ColumnarRegister() {
  const ready = useBooks();
  const [kind, setKind] = useState<"SALES" | "PURCHASE">("SALES");
  const [year, setYear] = useState(todayIso().slice(0, 4));
  const [month, setMonth] = useState<string | null>(null);
  const docs = ready ? (kind === "SALES" ? readCollection("invoices") : readCollection("bills")).filter((d) => booked(d) && String(d.date).startsWith(year)) : [];
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const agg = (ds: Rec[]) => [ds.length, ds.reduce((s, d) => s + num(d.subtotal), 0), ds.reduce((s, d) => s + num(d.discount), 0), ds.reduce((s, d) => s + num(d.tax), 0), ds.reduce((s, d) => s + num(d.total), 0)];
  const monthLabel = (m: string) => new Date(`${m}-01T00:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const cell = (v: number, i: number) => (!v ? "—" : i === 0 ? v : money(v));
  // Columnar view: one column per tax rate found in the month.
  const mDocs = month ? docs.filter((d) => String(d.date).startsWith(month)) : [];
  const rates = [...new Set(mDocs.flatMap((d) => docLines(d).map((l) => num(l.taxPct))))].sort((a, b) => a - b);
  const taxAt = (d: Rec, rate: number) => docLines(d).filter((l) => num(l.taxPct) === rate).reduce((s, l) => s + (lineNet(l) * rate) / 100, 0);
  return (
    <div className="space-y-4">
      <ReportHeader title="Columnar Register" subtitle="Monthly sales / purchase register with columnar tax breakup — booked documents only (drafts and cancelled excluded)" />
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg bg-muted p-1">{([["SALES", "Sales"], ["PURCHASE", "Purchase"]] as const).map(([v, l]) => <button key={v} type="button" onClick={() => { setKind(v); setMonth(null); }} className={cn("rounded-md px-3 py-1 text-sm", kind === v ? "bg-background font-medium shadow" : "text-muted-foreground")}>{l}</button>)}</div>
        <Select ariaLabel="Year" className="w-28" value={year} onChange={(v) => { setYear(v); setMonth(null); }} options={Array.from({ length: 6 }, (_, i) => String(Number(todayIso().slice(0, 4)) - 4 + i))} />
      </div>
      {!month ? <Card><div className="p-4"><CardTitle className="mb-2 px-3">{kind === "SALES" ? "Sales" : "Purchase"} register — {year}</CardTitle>
        <SimpleTable headers={["Month", "Vouchers", "Subtotal", "Discount", "Tax", "Total"]} right={[1, 2, 3, 4, 5]} rows={months.map((m) => { const a = agg(docs.filter((d) => String(d.date).startsWith(m))); return [a[0] ? <button key={m} type="button" className="text-primary hover:underline" onClick={() => setMonth(m)}>{monthLabel(m)}</button> : monthLabel(m), ...a.map(cell)]; })} foot={["Total", ...agg(docs).map(cell)]} />
        <p className="mt-2 px-3 text-xs text-muted-foreground">Click a month for its columnar voucher view.</p></div></Card> : <Card><div className="p-4">
        <div className="mb-2 flex items-center justify-between px-3"><CardTitle>{monthLabel(month)}</CardTitle><button type="button" className={btn.smOutline} onClick={() => setMonth(null)}>← All months</button></div>
        <SimpleTable headers={["Date", "Voucher", kind === "SALES" ? "Customer" : "Vendor", "Taxable", ...rates.map((r) => `Tax @ ${r}%`), "Total"]} right={[3, ...rates.map((_, i) => i + 4), rates.length + 4]} rows={mDocs.sort((a, b) => String(a.date).localeCompare(String(b.date))).map((d) => [String(d.date), String(d.number), String(d.customer ?? d.vendor), money(num(d.subtotal) - num(d.discount)), ...rates.map((r) => amt(taxAt(d, r))), money(num(d.total))])} />
      </div></Card>}
    </div>
  );
}

/* ---------- exceptions ---------- */

export function Exceptions() {
  const ready = useBooks(["ar-payments", "ap-payments"]);
  const x = ready ? exceptions() : null;
  if (!x) return null;
  const stats: [number, string][] = [[x.unposted.length, "Unposted documents"], [x.negative.length, "Negative stock"], [x.wrong.length, "Wrong-sided ledgers"], [x.overdueAR.length, "Overdue receivables"], [x.overdueAP.length, "Overdue payables"], [x.breaches.length, "Credit-limit breaches"]];
  const block = (title: string, none: string, headers: string[], rows: React.ReactNode[][], right: number[] = []) => <Card><div className="p-4"><CardTitle className="mb-2 px-3">{title}</CardTitle>{rows.length === 0 ? <p className="px-3 text-sm text-muted-foreground">{none}</p> : <SimpleTable headers={headers} right={right} rows={rows} />}</div></Card>;
  return (
    <div className="space-y-4">
      <ReportHeader title="Exception Reports" subtitle="Tally-style exception set — anything listed here needs attention" />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">{stats.map(([v, l]) => <Card key={l}><div className="p-4"><p className={cn("text-2xl font-bold", v > 0 && "text-destructive")}>{v}</p><p className="text-xs text-muted-foreground">{l}</p></div></Card>)}</div>
      {block("Documents with no journal entry (saved successfully but never reached the ledger)", "None — every payment, sale, asset, depreciation entry and reconciliation adjustment has a journal entry behind it.", ["Type", "Number", "Party", "Amount"], x.unposted.map((u) => [u.kind, u.number, u.party, money(u.amount)]), [3])}
      {block("Negative stock", "None — stock never went below zero.", ["Product", "Warehouse", "Quantity"], x.negative.map((u) => [u.product, u.warehouse, u.qty]), [2])}
      {block("Ledgers on the wrong side (balance contradicts the account's nature)", "None — every ledger sits on its expected side.", ["Code", "Ledger", "Balance", "Shows a"], x.wrong.map((u) => [u.code, u.name, money(Math.abs(u.balance)), `${u.side} balance`]), [2])}
      {block("Receivables overdue beyond credit period", "None — no customer invoice is past due.", ["Customer", "Invoice", "Due", "Days overdue", "Outstanding"], x.overdueAR.map((u) => [u.party, u.number, u.dueDate, u.days, money(u.amount)]), [3, 4])}
      {block("Payables overdue beyond credit period", "None — no vendor bill is past due.", ["Vendor", "Bill", "Due", "Days overdue", "Outstanding"], x.overdueAP.map((u) => [u.party, u.number, u.dueDate, u.days, money(u.amount)]), [3, 4])}
      {block("Credit-limit breaches", "None — every customer with a limit is inside it.", ["Customer", "Credit limit", "Balance", "Over by"], x.breaches.map((u) => [u.name, money(u.limit), money(u.balance), money(u.balance - u.limit)]), [1, 2, 3])}
    </div>
  );
}
