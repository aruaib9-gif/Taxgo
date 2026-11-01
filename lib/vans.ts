"use client";

// Van distribution. Each van carries its own stock location (a warehouse flagged isVan), so loading
// and unloading are warehouse transfers and a confirmed van sale ships from the van at average cost.
//
//   Confirmed van sale   Dr 1000 Cash / 1100 Bank (card) / 1200 Receivable (credit)
//                        Cr 4000 Sales Revenue · 2100 Tax Output Payable   (+ COGS via the stock move)

import { createRecord, nextNumber, readCollection, updateRecord } from "@/lib/store";
import { createJournal, findAccountByCode, type JournalLine } from "@/lib/ledger";
import { onHand, shipStock, transferStock, valuation } from "@/lib/stock";

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const n = (v: unknown) => Number(v ?? 0) || 0;
const acc = (code: string) => findAccountByCode(code)?.id ?? "";
const todayIso = () => new Date().toISOString().slice(0, 10);

export function createVan(v: Record<string, unknown> & { vanCode: string; name: string }) {
  if (readCollection("vans").some((x) => String(x.vanCode).toLowerCase() === v.vanCode.toLowerCase())) throw new Error(`Van code ${v.vanCode} is already used`);
  const van = createRecord("vans", v);
  const wh = createRecord("warehouses", { code: v.vanCode.toUpperCase(), name: `Van — ${v.name}`, address: "", status: "ACTIVE", isVan: true, vanId: van.id });
  updateRecord("vans", van.id, { stockWarehouseId: wh.id });
  return van;
}

export const vanWarehouse = (vanId: string) => String(readCollection("vans").find((v) => v.id === vanId)?.stockWarehouseId ?? "");

type Move = { warehouseId: string; productId: string; quantity: number; unitCost?: number; transferredBy?: string; notes?: string };

export function loadVan(vanId: string, m: Move) {
  const have = onHand(m.productId, m.warehouseId);
  if (m.quantity > have + 1e-9) throw new Error(`Only ${have} in that warehouse`);
  transferStock({ date: todayIso(), from: m.warehouseId, to: vanWarehouse(vanId), reference: `Van load ${readCollection("vans").find((v) => v.id === vanId)?.vanCode ?? ""}`, lines: [{ productId: m.productId, qty: m.quantity }] });
  return createRecord("van-transfers", { vanId, transferType: "LOAD", transferDate: new Date().toISOString(), warehouseId: m.warehouseId, transferredBy: m.transferredBy, notes: m.notes, lines: [{ productId: m.productId, quantity: m.quantity, unitCost: m.unitCost }] });
}

export function unloadVan(vanId: string, m: Move) {
  const have = onHand(m.productId, vanWarehouse(vanId));
  if (m.quantity > have + 1e-9) throw new Error(`Only ${have} on the van`);
  transferStock({ date: todayIso(), from: vanWarehouse(vanId), to: m.warehouseId, reference: `Van unload ${readCollection("vans").find((v) => v.id === vanId)?.vanCode ?? ""}`, lines: [{ productId: m.productId, qty: m.quantity }] });
  return createRecord("van-transfers", { vanId, transferType: "UNLOAD", transferDate: new Date().toISOString(), warehouseId: m.warehouseId, transferredBy: m.transferredBy, notes: m.notes, lines: [{ productId: m.productId, quantity: m.quantity, unitCost: m.unitCost }] });
}

export function vanInventory(vanId: string) {
  const wh = vanWarehouse(vanId);
  const transfers = readCollection("van-transfers").filter((t) => t.vanId === vanId);
  const sales = readCollection("van-sales").filter((s) => s.vanId === vanId && ["CONFIRMED", "DELIVERED"].includes(String(s.status)));
  const products = readCollection("products");
  const ids = new Set(transfers.flatMap((t) => ((t.lines as { productId: string }[]) ?? []).map((l) => l.productId)));
  return [...ids].map((pid) => {
    const sum = (type: string) => transfers.filter((t) => t.transferType === type).flatMap((t) => (t.lines as { productId: string; quantity: number }[]) ?? []).filter((l) => l.productId === pid).reduce((a, l) => a + n(l.quantity), 0);
    const sold = sales.flatMap((s) => (s.lines as { productId: string; quantity: number }[]) ?? []).filter((l) => l.productId === pid).reduce((a, l) => a + n(l.quantity), 0);
    return { id: pid, productId: pid, productName: String(products.find((p) => p.id === pid)?.name ?? "—"), quantityLoaded: sum("LOAD"), quantitySold: sold, quantityReturned: sum("UNLOAD"), quantityAvailable: onHand(pid, wh), unitCost: valuation(pid).avg };
  });
}

export type VanLine = { productId: string; description?: string; quantity: number; unitPrice: number; discountPercent?: number; taxRate?: number };

export function vanTotals(lines: VanLine[]) {
  let subtotal = 0, tax = 0, discount = 0;
  for (const l of lines) {
    const gross = l.quantity * l.unitPrice;
    const net = gross * (1 - n(l.discountPercent) / 100);
    discount += gross - net; subtotal += net; tax += (net * n(l.taxRate)) / 100;
  }
  return { subtotal: r3(subtotal), tax: r3(tax), discount: r3(discount), total: r3(subtotal + tax) };
}

export function createVanSale(s: Record<string, unknown> & { vanId: string; lines: VanLine[] }) {
  const t = vanTotals(s.lines);
  return createRecord("van-sales", {
    ...s, saleNumber: nextNumber("van-sales", "VS"), saleDate: todayIso(), status: "DRAFT", subtotal: t.subtotal, taxAmount: t.tax, discountAmount: t.discount, totalAmount: t.total,
    lines: s.lines.map((l) => ({ ...l, id: crypto.randomUUID(), lineTotal: r3(l.quantity * l.unitPrice * (1 - n(l.discountPercent) / 100) * (1 + n(l.taxRate) / 100)) })),
  });
}

// Confirming books the sale: stock leaves the van and the money (or receivable) is recorded.
export function confirmVanSale(id: string) {
  const s = readCollection("van-sales").find((x) => x.id === id);
  if (!s || s.status !== "DRAFT") throw new Error("Only a draft sale can be confirmed");
  const lines = (s.lines as VanLine[]) ?? [];
  const wh = vanWarehouse(String(s.vanId));
  for (const l of lines) {
    const have = onHand(l.productId, wh);
    if (l.quantity > have + 1e-9) throw new Error(`Only ${have} of ${readCollection("products").find((p) => p.id === l.productId)?.name ?? "this product"} on the van`);
  }
  const debit = s.paymentMethod === "CREDIT" ? acc("1200") : s.paymentMethod === "CARD" ? acc("1100") : acc("1000");
  const jl: JournalLine[] = [{ accountId: debit, memo: String(s.customerName || "Walk-in"), debit: n(s.totalAmount), credit: 0 }, { accountId: acc("4000"), memo: "Van sales", debit: 0, credit: n(s.subtotal) }];
  if (n(s.taxAmount)) jl.push({ accountId: acc("2100"), memo: "Output tax", debit: 0, credit: n(s.taxAmount) });
  if (n(s.totalAmount) > 0) createJournal({ date: todayIso(), description: `Van sale ${s.saleNumber}`, status: "POSTED", source: "Van Sales", lines: jl });
  shipStock({ date: todayIso(), warehouseId: wh, reference: String(s.saleNumber), lines: lines.map((l) => ({ productId: l.productId, qty: l.quantity })) });
  updateRecord("van-sales", id, { status: "CONFIRMED", amountDue: s.paymentMethod === "CREDIT" ? n(s.totalAmount) : 0, confirmedAt: new Date().toISOString() });
}

export function routeTotals(routeId: string) {
  const r = readCollection("van-routes").find((x) => x.id === routeId);
  const stops = (r?.stops as { status: string }[]) ?? [];
  const sales = readCollection("van-sales").filter((s) => s.routeId === routeId && s.status !== "CANCELLED");
  return { totalStops: stops.length, completedStops: stops.filter((x) => x.status === "COMPLETED").length, totalSalesAmount: r3(sales.reduce((a, s) => a + n(s.totalAmount), 0)) };
}
