"use client";

// Receivables logic shared by the Sales screens. Documents reference customers by name (as the
// rest of the app does) and post double-entry journals so Accounting stays in step.

import { createRecord, nextNumber, readCollection, updateRecord, type Rec } from "@/lib/store";
import { createJournal, findAccountByCode, type JournalLine } from "@/lib/ledger";

export type DocLine = {
  productId?: string;
  description: string;
  qty: number;
  uom?: string;
  unitPrice: number;
  discPct?: number;
  taxPct?: number;
};

export type DiscountType = "NONE" | "PERCENT" | "AMOUNT";

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const n = (v: unknown) => Number(v ?? 0) || 0;

// Line net is after line discount, before tax. When prices include tax, tax is backed out.
export function lineAmounts(l: DocLine, pricesIncludeTax = false) {
  const gross = n(l.qty) * n(l.unitPrice) * (1 - n(l.discPct) / 100);
  const rate = n(l.taxPct) / 100;
  const net = pricesIncludeTax ? gross / (1 + rate) : gross;
  const tax = net * rate;
  return { net: r3(net), tax: r3(tax), total: r3(net + tax) };
}

export function docTotals(lines: DocLine[], opts: { discountType?: DiscountType; discountValue?: number; shipping?: number; pricesIncludeTax?: boolean } = {}) {
  const per = lines.map((l) => lineAmounts(l, opts.pricesIncludeTax));
  const subtotal = per.reduce((s, x) => s + x.net, 0);
  const tax = per.reduce((s, x) => s + x.tax, 0);
  const discount =
    opts.discountType === "PERCENT" ? subtotal * (n(opts.discountValue) / 100) : opts.discountType === "AMOUNT" ? Math.min(subtotal, n(opts.discountValue)) : 0;
  // Document discount reduces tax proportionally.
  const taxAfter = subtotal ? tax * (1 - discount / subtotal) : 0;
  const shipping = n(opts.shipping);
  return { subtotal: r3(subtotal), discount: r3(discount), tax: r3(taxAfter), shipping: r3(shipping), total: r3(subtotal - discount + taxAfter + shipping) };
}

// Older records (e.g. dashboard sample data) carry only a PAID status, not amountPaid.
export const outstanding = (inv: Rec) =>
  inv.amountPaid === undefined && /^paid$/i.test(String(inv.status)) ? 0 : r3(n(inv.total) - n(inv.amountPaid) - n(inv.credited));

export function statusFor(inv: Rec) {
  if (inv.status === "DRAFT" || inv.status === "CANCELLED") return String(inv.status);
  const due = outstanding(inv);
  if (due <= 0.0005) return "PAID";
  return n(inv.amountPaid) + n(inv.credited) > 0 ? "PARTIAL" : "UNPAID";
}

export const isOverdue = (inv: Rec, today: string) => ["UNPAID", "PARTIAL"].includes(statusFor(inv)) && !!inv.dueDate && String(inv.dueDate) < today;

const acc = (code: string) => findAccountByCode(code)?.id ?? "";
const cashAccount = (mode: string) => (/cash/i.test(mode) ? acc("1000") : acc("1100"));

/* ---------- invoices ---------- */

export function createInvoice(data: Record<string, unknown> & { customer: string; date: string; lines: DocLine[]; paymentMode: string }) {
  const t = docTotals(data.lines, { discountType: data.discountType as DiscountType, discountValue: n(data.discountValue), shipping: n(data.shipping) });
  const paidNow = data.paymentMode !== "Credit";
  const inv = createRecord("invoices", {
    ...data,
    number: nextNumber("invoices", "INV"),
    subtotal: t.subtotal,
    discount: t.discount,
    tax: t.tax,
    shipping: t.shipping,
    total: t.total,
    amountPaid: paidNow ? t.total : 0,
    credited: 0,
    status: paidNow ? "PAID" : "UNPAID",
  });
  // Dr receivable (or cash/bank when paid at sale) · Cr revenue, output tax, shipping income.
  const debit = paidNow ? cashAccount(String(data.paymentMode)) : acc("1200");
  const lines: JournalLine[] = [
    { accountId: debit, memo: String(inv.number), debit: t.total, credit: 0 },
    { accountId: acc("4000"), memo: "Sales", debit: 0, credit: r3(t.subtotal - t.discount) },
  ];
  if (t.tax) lines.push({ accountId: acc("2100"), memo: "Output tax", debit: 0, credit: t.tax });
  if (t.shipping) lines.push({ accountId: acc("4040"), memo: "Shipping", debit: 0, credit: t.shipping });
  if (t.total > 0) createJournal({ date: data.date, description: `Invoice ${inv.number} — ${data.customer}`, lines, status: "POSTED", source: "Sales Invoice" });
  return inv;
}

/* ---------- payments ---------- */

// Records a receipt and settles the customer's open invoices oldest-first; any remainder stays on account.
export function recordPayment(p: { customer: string; date: string; amount: number; method: string; reference?: string; notes?: string; currency?: string; cashAccountId?: string }) {
  const open = readCollection("invoices")
    .filter((i) => i.customer === p.customer && ["UNPAID", "PARTIAL"].includes(statusFor(i)))
    .sort((a, b) => String(a.dueDate ?? a.date).localeCompare(String(b.dueDate ?? b.date)));
  let left = p.amount;
  const allocations: { invoiceId: string; number: string; amount: number }[] = [];
  for (const inv of open) {
    if (left <= 0.0005) break;
    const take = r3(Math.min(left, outstanding(inv)));
    const paid = r3(n(inv.amountPaid) + take);
    updateRecord("invoices", inv.id, { amountPaid: paid, status: statusFor({ ...inv, amountPaid: paid }) });
    allocations.push({ invoiceId: inv.id, number: String(inv.number), amount: take });
    left = r3(left - take);
  }
  const je = createJournal({
    date: p.date,
    description: `Receipt from ${p.customer}${p.reference ? ` — ${p.reference}` : ""}`,
    status: "POSTED",
    source: "AR Payment",
    lines: [
      { accountId: p.cashAccountId ?? cashAccount(p.method), debit: p.amount, credit: 0 },
      { accountId: acc("1200"), debit: 0, credit: p.amount },
    ],
  });
  return createRecord("ar-payments", { ...p, number: nextNumber("ar-payments", "PMT"), allocations, unapplied: left, journalId: je.id });
}

/* ---------- credit notes ---------- */

export function issueCreditNote(c: { customer: string; date: string; reason?: string; lines: DocLine[]; invoiceIds: string[]; discountType?: DiscountType; discountValue?: number; shipping?: number }) {
  const t = docTotals(c.lines, { discountType: c.discountType, discountValue: c.discountValue, shipping: c.shipping });
  let left = t.total;
  for (const id of c.invoiceIds) {
    const inv = readCollection("invoices").find((i) => i.id === id);
    if (!inv || left <= 0.0005) continue;
    const take = r3(Math.min(left, outstanding(inv)));
    const credited = r3(n(inv.credited) + take);
    updateRecord("invoices", inv.id, { credited, status: statusFor({ ...inv, credited }) });
    left = r3(left - take);
  }
  const je = createJournal({
    date: c.date,
    description: `Credit note — ${c.customer}${c.reason ? ` (${c.reason})` : ""}`,
    status: "POSTED",
    source: "Credit Note",
    lines: [
      { accountId: acc("4020"), memo: "Sales return", debit: r3(t.subtotal - t.discount + t.shipping), credit: 0 },
      ...(t.tax ? [{ accountId: acc("2100"), memo: "Output tax reversed", debit: t.tax, credit: 0 }] : []),
      { accountId: acc("1200"), debit: 0, credit: t.total },
    ],
  });
  return createRecord("credit-notes", { ...c, number: nextNumber("credit-notes", "CN"), total: t.total, applied: r3(t.total - left), status: left > 0.0005 ? "OPEN" : "APPLIED", journalId: je.id });
}

/* ---------- recurring ---------- */

export function addInterval(iso: string, freq: string, times = 1) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (freq === "Weekly") d.setUTCDate(d.getUTCDate() + 7 * times);
  else if (freq === "Quarterly") d.setUTCMonth(d.getUTCMonth() + 3 * times);
  else if (freq === "Yearly") d.setUTCFullYear(d.getUTCFullYear() + times);
  else d.setUTCMonth(d.getUTCMonth() + times);
  return d.toISOString().slice(0, 10);
}

// Monthly-normalised pre-tax value of a recurring schedule (shipping excluded), as used for MRR.
export function monthlyValue(r: Rec) {
  const t = docTotals((r.lines as DocLine[]) ?? [], { discountType: r.discountType as DiscountType, discountValue: n(r.discountValue) });
  const net = t.subtotal - t.discount;
  return r3(r.frequency === "Weekly" ? (net * 52) / 12 : r.frequency === "Quarterly" ? net / 3 : r.frequency === "Yearly" ? net / 12 : net);
}

// Generates every due invoice for a schedule up to `today`, advancing its next date.
export function runRecurring(r: Rec, today: string) {
  let next = String(r.nextDate);
  let count = n(r.generated);
  let made = 0;
  const max = n(r.maxOccurrences);
  while (r.status === "ACTIVE" && next <= today && (!r.endDate || next <= String(r.endDate)) && (!max || count < max)) {
    const d = new Date(`${next}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + n(r.paymentTerms));
    createInvoice({
      customer: String(r.customer),
      date: next,
      dueDate: d.toISOString().slice(0, 10),
      lines: (r.lines as DocLine[]) ?? [],
      paymentMode: "Credit",
      reference: String(r.reference ?? ""),
      notes: String(r.notes ?? ""),
      shipping: n(r.shipping),
      discountType: r.discountType,
      discountValue: n(r.discountValue),
      recurringId: r.id,
    });
    count++;
    made++;
    next = addInterval(next, String(r.frequency));
  }
  const ended = (!!r.endDate && next > String(r.endDate)) || (!!max && count >= max);
  updateRecord("recurring-invoices", r.id, { nextDate: next, generated: count, status: ended ? "ENDED" : r.status, ...(ended && r.status === "ACTIVE" ? { endedAt: today } : {}) });
  return made;
}
