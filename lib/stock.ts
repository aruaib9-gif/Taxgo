"use client";

// Stock is a log of movements (`stock-moves`); on-hand, value, aging and the stock ledger all
// derive from it. Valuation is moving-average cost per product, company-wide, as on the live
// platform ("valued at average cost"). Every valued movement also posts a journal entry.
//
//   Receipt (GRN)       Dr 1300 Inventory          Cr 2050 Goods Received Not Invoiced
//   Adjustment +/−      Dr/Cr 1300 Inventory       Cr/Dr 5000 Cost of Goods Sold
//   Extra / landed cost Dr 1300 Inventory          Cr cash, bank or 2010 Accrued Expenses
//   Scrap               Dr 6000 Misc. Expenses     Cr 1300 Inventory
//   Sale (dispatch)     Dr 5000 Cost of Goods Sold Cr 1300 Inventory
//   Transfer            no GL (same company), quantity moves between warehouses

import { createRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { createJournal, findAccountByCode, type JournalLine } from "@/lib/ledger";

export type MoveType = "PURCHASE" | "SALE" | "ADJUSTMENT" | "TRANSFER" | "RETURN" | "DAMAGED" | "WRITE_OFF";
export const MOVE_TYPES: MoveType[] = ["PURCHASE", "SALE", "ADJUSTMENT", "TRANSFER", "RETURN", "DAMAGED", "WRITE_OFF"];

export type Move = Rec & {
  date: string;
  productId: string;
  warehouseId: string;
  qty: number; // + in, − out; 0 for value-only (landed/extra cost)
  unitCost: number;
  value: number; // signed value change
  type: MoveType;
  reference?: string;
  bin?: string;
  batchId?: string;
};

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const n = (v: unknown) => Number(v ?? 0) || 0;
const acc = (code: string) => findAccountByCode(code)?.id ?? "";

export const useMoves = () => useCollection("stock-moves") as Move[];
const allMoves = () => readCollection("stock-moves") as Move[];
const chronological = (a: Move, b: Move) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt).localeCompare(String(b.createdAt));

// Moving-average valuation for one product over the given moves.
export function valuation(productId: string, moves: Move[] = allMoves()) {
  let qty = 0;
  let value = 0;
  for (const m of moves.filter((x) => x.productId === productId).sort(chronological)) {
    qty = r3(qty + n(m.qty));
    value = r3(value + n(m.value));
  }
  return { qty, value, avg: qty > 0 ? r3(value / qty) : 0 };
}

export function onHand(productId: string, warehouseId?: string, moves: Move[] = allMoves()) {
  return r3(moves.filter((m) => m.productId === productId && (!warehouseId || m.warehouseId === warehouseId)).reduce((s, m) => s + n(m.qty), 0));
}

// Balances per product × warehouse, valued at the product's average cost.
export function balances(moves: Move[]) {
  const map = new Map<string, { productId: string; warehouseId: string; qty: number; lastMove: string }>();
  for (const m of moves) {
    const k = `${m.productId}|${m.warehouseId}`;
    const b = map.get(k) ?? { productId: m.productId, warehouseId: m.warehouseId, qty: 0, lastMove: "" };
    b.qty = r3(b.qty + n(m.qty));
    if (n(m.qty) !== 0 && String(m.date) > b.lastMove) b.lastMove = String(m.date);
    map.set(k, b);
  }
  const avg = new Map<string, number>();
  for (const pid of new Set(moves.map((m) => m.productId))) avg.set(pid, valuation(pid, moves).avg);
  return [...map.values()].map((b) => ({ ...b, avg: avg.get(b.productId) ?? 0, value: r3(b.qty * (avg.get(b.productId) ?? 0)) }));
}

/* ---------- writing moves ---------- */

type MoveInput = { date: string; productId: string; warehouseId: string; qty: number; unitCost?: number; type: MoveType; reference?: string; bin?: string; batchId?: string; valueOnly?: number };

// Records a movement. Outgoing stock is valued at the current average; incoming at its cost.
export function recordMove(m: MoveInput) {
  const v = valuation(m.productId);
  const outgoing = m.qty < 0;
  const unitCost = m.valueOnly !== undefined ? 0 : outgoing ? v.avg : n(m.unitCost ?? v.avg);
  const value = m.valueOnly !== undefined ? r3(m.valueOnly) : r3(m.qty * unitCost);
  return createRecord("stock-moves", { ...m, qty: r3(m.qty), unitCost, value, valueOnly: undefined }) as Move;
}

function post(date: string, description: string, source: string, lines: JournalLine[]) {
  const ls = lines.filter((l) => l.accountId && (l.debit || l.credit));
  if (ls.length >= 2) createJournal({ date, description, status: "POSTED", source, lines: ls });
}

// Quantity adjustment (and optional extra cost spread over units on hand).
export function adjustStock(a: { date: string; productId: string; warehouseId: string; qty: number; extraCost?: number; paidFrom?: "CASH" | "BANK"; reason?: string; reference?: string; unitCost?: number; type?: MoveType }) {
  const product = readCollection("products").find((p) => p.id === a.productId);
  const label = `${a.reason || "Stock adjustment"} — ${product?.name ?? "product"}`;
  if (a.qty) {
    const m = recordMove({ date: a.date, productId: a.productId, warehouseId: a.warehouseId, qty: a.qty, unitCost: a.unitCost ?? (n(product?.cost) || undefined), type: a.type ?? "ADJUSTMENT", reference: a.reference ?? a.reason });
    const v = Math.abs(m.value);
    post(a.date, label, "Stock Adjustment", a.qty > 0 ? [{ accountId: acc("1300"), debit: v, credit: 0 }, { accountId: acc("5000"), debit: 0, credit: v }] : [{ accountId: acc("5000"), debit: v, credit: 0 }, { accountId: acc("1300"), debit: 0, credit: v }]);
  }
  if (n(a.extraCost) > 0) {
    recordMove({ date: a.date, productId: a.productId, warehouseId: a.warehouseId, qty: 0, type: "ADJUSTMENT", reference: `Extra cost — ${a.reason || ""}`.trim(), valueOnly: n(a.extraCost) });
    post(a.date, `Extra cost — ${product?.name ?? ""}`, "Stock Adjustment", [{ accountId: acc("1300"), debit: n(a.extraCost), credit: 0 }, { accountId: a.paidFrom === "BANK" ? acc("1100") : acc("1000"), debit: 0, credit: n(a.extraCost) }]);
  }
}

export function scrapStock(s: { date: string; productId: string; warehouseId: string; qty: number; reason: string; bin?: string; batchId?: string; notes?: string; number: string }) {
  const m = recordMove({ date: s.date, productId: s.productId, warehouseId: s.warehouseId, qty: -Math.abs(s.qty), type: s.reason === "Lost / missing" ? "WRITE_OFF" : "DAMAGED", reference: `${s.number} · ${s.reason}`, bin: s.bin, batchId: s.batchId });
  const v = Math.abs(m.value);
  post(s.date, `Scrap ${s.number} — ${s.reason}`, "Scrap", [{ accountId: acc("6000"), memo: "Inventory write-off", debit: v, credit: 0 }, { accountId: acc("1300"), debit: 0, credit: v }]);
  if (s.batchId) {
    const b = readCollection("product-batches").find((x) => x.id === s.batchId);
    if (b) updateRecord("product-batches", b.id, { qty: Math.max(0, r3(n(b.qty) - Math.abs(s.qty))) });
  }
  return v;
}

// Goods leaving for a customer: stock out at average cost, cost of sales recognised.
export function shipStock(d: { date: string; warehouseId: string; reference: string; lines: { productId: string; qty: number }[] }) {
  let total = 0;
  for (const l of d.lines) {
    if (!l.productId || !l.qty) continue;
    const product = readCollection("products").find((p) => p.id === l.productId);
    if (product && product.trackStock === false) continue;
    total += Math.abs(recordMove({ date: d.date, productId: l.productId, warehouseId: d.warehouseId, qty: -Math.abs(l.qty), type: "SALE", reference: d.reference }).value);
  }
  post(d.date, `Cost of goods — ${d.reference}`, "Delivery", [{ accountId: acc("5000"), debit: r3(total), credit: 0 }, { accountId: acc("1300"), debit: 0, credit: r3(total) }]);
}

// Goods arriving from a vendor (GRN): stock in at cost, against Goods Received Not Invoiced.
export function receiveStock(g: { date: string; warehouseId: string; reference: string; lines: { productId: string; qty: number; unitCost: number }[]; extraValue?: number }) {
  let total = 0;
  for (const l of g.lines) {
    if (!l.productId || l.qty <= 0) continue;
    total += recordMove({ date: g.date, productId: l.productId, warehouseId: g.warehouseId, qty: l.qty, unitCost: l.unitCost, type: "PURCHASE", reference: g.reference }).value;
  }
  // Additional charges (freight etc.) are spread over the received value.
  const extra = n(g.extraValue);
  if (extra > 0 && total > 0)
    for (const l of g.lines) if (l.productId && l.qty > 0) recordMove({ date: g.date, productId: l.productId, warehouseId: g.warehouseId, qty: 0, type: "PURCHASE", reference: `${g.reference} charges`, valueOnly: (extra * l.qty * l.unitCost) / total });
  post(g.date, `Goods receipt ${g.reference}`, "GRN", [{ accountId: acc("1300"), debit: r3(total + extra), credit: 0 }, { accountId: acc("2050"), debit: 0, credit: r3(total + extra) }]);
  return r3(total + extra);
}

// Stock back out to a vendor (purchase return shipped). The debit note handles the money side.
export function returnToVendor(r: { date: string; warehouseId: string; reference: string; lines: { productId: string; qty: number }[] }) {
  let total = 0;
  for (const l of r.lines) if (l.productId && l.qty > 0) total += Math.abs(recordMove({ date: r.date, productId: l.productId, warehouseId: r.warehouseId, qty: -l.qty, type: "RETURN", reference: r.reference }).value);
  post(r.date, `Purchase return ${r.reference}`, "Purchase Return", [{ accountId: acc("2050"), debit: r3(total), credit: 0 }, { accountId: acc("1300"), debit: 0, credit: r3(total) }]);
}

// Moves quantity between warehouses at average cost; value follows the stock, so no journal.
export function transferStock(t: { date: string; from: string; to: string; reference: string; lines: { productId: string; qty: number }[] }, leg: "OUT" | "IN" | "BOTH" = "BOTH") {
  for (const l of t.lines) {
    if (!l.productId || l.qty <= 0) continue;
    const avg = valuation(l.productId).avg;
    if (leg !== "IN") recordMove({ date: t.date, productId: l.productId, warehouseId: t.from, qty: -l.qty, type: "TRANSFER", reference: t.reference });
    if (leg !== "OUT") recordMove({ date: t.date, productId: l.productId, warehouseId: t.to, qty: l.qty, unitCost: avg, type: "TRANSFER", reference: t.reference });
  }
}
