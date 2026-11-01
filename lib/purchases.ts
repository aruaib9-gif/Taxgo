"use client";

// Payables logic shared by the Purchasing screens. Documents reference vendors by name, as
// sales documents do with customers, and post double-entry journals so Accounting stays in step.
//
// Postings:
//   GRN (posted)   Dr 1300 Inventory              Cr 2050 Goods Received Not Invoiced
//   Bill           Dr 2050 (if against a GRN) / 1300 (product lines) / line account (services)
//                  Dr 1500 Input Tax              Cr 2000 Accounts Payable
//   Payment        Dr 2000 Accounts Payable       Cr 1100 Bank / 1000 Cash
//   Debit note     Dr 2000 Accounts Payable       Cr 5090 Purchase Returns, Cr 1500 Input Tax

import { createRecord, nextNumber, readCollection, updateRecord, type Rec } from "@/lib/store";
import { createJournal, findAccountByCode, type JournalLine } from "@/lib/ledger";
import { docTotals, lineAmounts, type DiscountType, type DocLine } from "@/lib/sales";
import { receiveStock } from "@/lib/stock";

export type BillLine = DocLine & { accountId?: string };

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const n = (v: unknown) => Number(v ?? 0) || 0;
const acc = (code: string) => findAccountByCode(code)?.id ?? "";
const cashAccount = (method: string) => (/cash/i.test(method) ? acc("1000") : acc("1100"));

/* ---------- bills ---------- */

// Older records (e.g. dashboard sample data) carry only a PAID status, not amountPaid.
export const billOutstanding = (b: Rec) =>
  b.amountPaid === undefined && /^paid$/i.test(String(b.status)) ? 0 : r3(n(b.total) - n(b.amountPaid) - n(b.debited));

export function billStatus(b: Rec) {
  if (b.status === "DRAFT" || b.status === "CANCELLED") return String(b.status);
  const due = billOutstanding(b);
  if (due <= 0.0005) return "PAID";
  return n(b.amountPaid) + n(b.debited) > 0 ? "PARTIALLY_PAID" : "APPROVED";
}

export const billOpen = (b: Rec) => ["APPROVED", "PARTIALLY_PAID"].includes(billStatus(b));
export const billOverdue = (b: Rec, today: string) => billOpen(b) && !!b.dueDate && String(b.dueDate) < today;

export function createBill(data: Record<string, unknown> & { vendor: string; date: string; lines: BillLine[]; grnId?: string }) {
  const t = docTotals(data.lines, { discountType: data.discountType as DiscountType, discountValue: n(data.discountValue), shipping: n(data.shipping) });
  const bill = createRecord("bills", {
    ...data,
    number: nextNumber("bills", "BILL"),
    billNo: String(data.billNo || "") || undefined,
    subtotal: t.subtotal,
    discount: t.discount,
    tax: t.tax,
    shipping: t.shipping,
    total: t.total,
    amountPaid: 0,
    debited: 0,
    status: "APPROVED",
  });
  // Debit each line's net (after document discount) to where the goods/services land.
  const factor = t.subtotal ? (t.subtotal - t.discount) / t.subtotal : 1;
  const debits = new Map<string, number>();
  const add = (id: string, v: number) => id && v && debits.set(id, r3((debits.get(id) ?? 0) + v));
  for (const l of data.lines) {
    const target = data.grnId ? acc("2050") : l.accountId || (l.productId ? acc("1300") : acc("5300"));
    add(target, lineAmounts(l).net * factor);
  }
  add(data.grnId ? acc("2050") : acc("5000"), t.shipping);
  const lines: JournalLine[] = [...debits].map(([accountId, debit]) => ({ accountId, debit, credit: 0 }));
  if (t.tax) lines.push({ accountId: acc("1500"), memo: "Input tax", debit: t.tax, credit: 0 });
  lines.push({ accountId: acc("2000"), memo: String(bill.number), debit: 0, credit: t.total });
  if (t.total > 0) createJournal({ date: data.date, description: `Bill ${bill.number} — ${data.vendor}`, lines, status: "POSTED", source: "Vendor Bill" });
  if (data.poId) refreshPoBilling(String(data.poId));
  if (data.grnId) updateRecord("grns", data.grnId, { billId: bill.id });
  return bill;
}

/* ---------- vendor payments ---------- */

type Allocation = { billId: string; number: string; amount: number };

// Pays the given bills in full, or (with no list) settles the vendor's open bills oldest-first.
export function payVendor(p: { vendor: string; date: string; amount: number; method: string; reference?: string; notes?: string; billIds?: string[]; runId?: string; cashAccountId?: string }) {
  const open = readCollection("bills")
    .filter((b) => b.vendor === p.vendor && billOpen(b) && (!p.billIds || p.billIds.includes(b.id)))
    .sort((a, b) => String(a.dueDate ?? a.date).localeCompare(String(b.dueDate ?? b.date)));
  let left = p.amount;
  const allocations: Allocation[] = [];
  for (const b of open) {
    if (left <= 0.0005) break;
    const take = r3(Math.min(left, billOutstanding(b)));
    const paid = r3(n(b.amountPaid) + take);
    updateRecord("bills", b.id, { amountPaid: paid, status: billStatus({ ...b, amountPaid: paid }) });
    allocations.push({ billId: b.id, number: String(b.number), amount: take });
    left = r3(left - take);
  }
  const je = createJournal({
    date: p.date,
    description: `Payment to ${p.vendor}${p.reference ? ` — ${p.reference}` : ""}`,
    status: "POSTED",
    source: "AP Payment",
    lines: [
      { accountId: acc("2000"), debit: p.amount, credit: 0 },
      { accountId: p.cashAccountId ?? cashAccount(p.method), debit: 0, credit: p.amount },
    ],
  });
  for (const a of allocations) {
    const b = readCollection("bills").find((x) => x.id === a.billId);
    if (b?.poId) refreshPoBilling(String(b.poId));
  }
  return createRecord("ap-payments", { ...p, number: nextNumber("ap-payments", "VPMT"), allocations, unapplied: left, journalId: je.id });
}

/* ---------- debit notes ---------- */

export function issueDebitNote(d: { vendor: string; date: string; reason?: string; lines: DocLine[]; billIds: string[] }) {
  const t = docTotals(d.lines);
  let left = t.total;
  for (const id of d.billIds) {
    const b = readCollection("bills").find((x) => x.id === id);
    if (!b || left <= 0.0005) continue;
    const take = r3(Math.min(left, billOutstanding(b)));
    const debited = r3(n(b.debited) + take);
    updateRecord("bills", b.id, { debited, status: billStatus({ ...b, debited }) });
    left = r3(left - take);
  }
  const je = createJournal({
    date: d.date,
    description: `Debit note — ${d.vendor}${d.reason ? ` (${d.reason})` : ""}`,
    status: "POSTED",
    source: "Debit Note",
    lines: [
      { accountId: acc("2000"), debit: t.total, credit: 0 },
      { accountId: acc("5090"), memo: "Purchase return", debit: 0, credit: t.subtotal },
      ...(t.tax ? [{ accountId: acc("1500"), memo: "Input tax reversed", debit: 0, credit: t.tax }] : []),
    ],
  });
  const applied = r3(t.total - left);
  // Whatever isn't set against open bills is due back from the vendor (a refund to recover).
  return createRecord("debit-notes", { ...d, number: nextNumber("debit-notes", "DBN"), total: t.total, applied, status: applied <= 0.0005 ? "ISSUED" : left > 0.0005 ? "PARTIALLY_APPLIED" : "APPLIED", journalId: je.id });
}

/* ---------- purchase orders & receipts ---------- */

export type PoLine = { productId: string; description?: string; qty: number; uom?: string; unitPrice: number; markupPct?: number; taxPct?: number };
export type GrnLine = { productId: string; uom?: string; expected: number; received: number; accepted: number; rejected: number; unitCost: number; taxPct?: number; poLineIndex?: number };

export const poTotal = (lines: PoLine[], charges: { amount: number }[] = []) =>
  r3(lines.reduce((s, l) => s + n(l.qty) * n(l.unitPrice), 0) + charges.reduce((s, c) => s + n(c.amount), 0));

// Receipt / billing progress shown on the PO list.
export function poProgress(po: Rec) {
  const lines = (po.lines as PoLine[]) ?? [];
  const ordered = lines.reduce((s, l) => s + n(l.qty), 0);
  const received = ((po.receivedQty as number[]) ?? []).reduce((s, q) => s + n(q), 0);
  const billed = readCollection("bills").filter((b) => b.poId === po.id && b.status !== "CANCELLED").reduce((s, b) => s + n(b.total), 0);
  return {
    receipt: received <= 0 ? "Not received" : received + 0.0005 < ordered ? "Partial" : "Received",
    billing: billed <= 0 ? "Not billed" : billed + 0.0005 < n(po.total) ? "Partial" : "Billed",
    received,
    ordered,
    billed,
  };
}

function refreshPoBilling(poId: string) {
  const po = readCollection("purchase-orders").find((p) => p.id === poId);
  if (!po || ["CANCELLED", "CLOSED", "DRAFT"].includes(String(po.status))) return;
  const pr = poProgress(po);
  const status = pr.billing === "Billed" ? "FULLY_BILLED" : pr.billing === "Partial" ? "PARTIALLY_BILLED" : pr.receipt === "Received" ? "FULLY_RECEIVED" : pr.receipt === "Partial" ? "PARTIALLY_RECEIVED" : String(po.status);
  updateRecord("purchase-orders", poId, { status });
}

const grnNet = (l: GrnLine) => {
  const gross = n(l.accepted) * n(l.unitCost);
  return r3(gross / (1 + n(l.taxPct) / 100));
};
export const grnTotals = (lines: GrnLine[], charges: { amount: number }[] = []) => {
  const net = r3(lines.reduce((s, l) => s + grnNet(l), 0) + charges.reduce((s, c) => s + n(c.amount), 0));
  const gross = r3(lines.reduce((s, l) => s + n(l.accepted) * n(l.unitCost), 0) + charges.reduce((s, c) => s + n(c.amount), 0));
  return { net, vat: r3(gross - net), total: gross };
};

// Posting a GRN brings accepted stock in at net cost (see lib/stock) and updates the PO's received quantities.
export function postGrn(grn: Rec, date: string) {
  const lines = (grn.lines as GrnLine[]) ?? [];
  const charges = (grn.charges as { amount: number }[]) ?? [];
  const t = grnTotals(lines, charges);
  receiveStock({
    date,
    warehouseId: String(grn.warehouseId),
    reference: String(grn.number),
    lines: lines.map((l) => ({ productId: l.productId, qty: n(l.accepted), unitCost: r3(n(l.unitCost) / (1 + n(l.taxPct) / 100)) })),
    extraValue: charges.reduce((s, c) => s + n(c.amount), 0),
  });
  for (const l of lines) if (l.productId && n(l.accepted) > 0) updateRecord("products", l.productId, { cost: r3(n(l.unitCost) / (1 + n(l.taxPct) / 100)) });
  // Quality: matching goods-receipt control points open pending checks.
  for (const cp of readCollection("quality-points").filter((q) => q.trigger === "GOODS_RECEIPT" && q.active !== false))
    for (const l of lines.filter((x) => n(x.accepted) > 0 && (!cp.productId || cp.productId === x.productId)))
      createRecord("quality-checks", { pointId: cp.id, point: cp.name, type: cp.checkType, instructions: cp.instructions, productId: l.productId, qty: n(l.accepted), source: `GRN ${grn.number}`, date, status: "PENDING" });
  if (grn.poId) {
    const po = readCollection("purchase-orders").find((x) => x.id === grn.poId);
    if (po) {
      const received = [...((po.receivedQty as number[]) ?? [])];
      lines.forEach((l) => l.poLineIndex !== undefined && (received[l.poLineIndex] = n(received[l.poLineIndex]) + n(l.accepted)));
      // A PO line's markup sets the product's selling price once it's received.
      for (const [i, pl] of ((po.lines as PoLine[]) ?? []).entries())
        if (n(pl.markupPct) > 0 && lines.some((l) => l.poLineIndex === i)) updateRecord("products", pl.productId, { retail: r3(n(pl.unitPrice) * (1 + n(pl.markupPct) / 100)) });
      updateRecord("purchase-orders", po.id, { receivedQty: received });
      refreshPoBilling(po.id);
    }
  }
  updateRecord("grns", grn.id, { status: "POSTED", postedAt: date, net: t.net, vat: t.vat, total: t.total });
}

/* ---------- vendor prices ---------- */

// Best base-currency price for a vendor/product on a date and quantity (highest qualifying break).
export function vendorPrice(vendor: string, productId: string, date: string, qty: number) {
  return readCollection("vendor-prices")
    .filter((p) => p.vendor === vendor && p.productId === productId && !p.currency && (!p.validFrom || String(p.validFrom) <= date) && (!p.validTo || String(p.validTo) >= date) && n(p.minQty) <= qty)
    .sort((a, b) => n(b.minQty) - n(a.minQty))[0];
}
