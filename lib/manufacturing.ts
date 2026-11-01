"use client";

// Manufacturing: production orders run from a BOM, work orders (operations) on work centers,
// equipment maintenance, job work (subcontracting) and MRP.
//
// Completing a production run consumes the planned materials (scaled to produced + scrap) at
// average cost and adds the finished good at the materials' value plus absorbed labour, so scrap
// cost lands on the good units. Labour from completed work orders is absorbed into inventory:
//   Dr 1300 Inventory   Cr 5010 Direct Labor
// Material value only moves between inventory items, so it needs no journal.

import { createRecord, nextNumber, readCollection, updateRecord } from "@/lib/store";
import { createJournal, findAccountByCode } from "@/lib/ledger";
import { onHand, recordMove, valuation } from "@/lib/stock";

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const r4 = (v: number) => Math.round(v * 10000) / 10000;
const n = (v: unknown) => Number(v ?? 0) || 0;
const acc = (code: string) => findAccountByCode(code)?.id ?? "";
const todayIso = () => new Date().toISOString().slice(0, 10);

type Comp = { productId: string; qty: number; waste?: number; unitCost?: number };
export type Material = { id: string; componentId: string; componentSku: string; componentName: string; plannedQuantity: number; actualQuantity: number; unitCost: number };

export const activeBom = (productId: string) =>
  readCollection("boms").filter((b) => b.productId === productId && b.status === "ACTIVE").sort((a, b) => n(b.version) - n(a.version))[0];

export function createProductionOrder(o: { productId: string; quantity: number; warehouseId?: string; plannedStartDate?: string; plannedEndDate?: string; notes?: string }) {
  const p = readCollection("products").find((x) => x.id === o.productId);
  const bom = activeBom(o.productId);
  return createRecord("production-orders", { ...o, orderNumber: nextNumber("production-orders", "MO"), productName: p?.name, productSku: p?.sku, bomId: bom?.id, bomName: bom ? `${bom.name || "BOM"} v${bom.version}` : undefined, status: "DRAFT", materials: [], outputs: [] });
}

// Snapshots the BOM (including waste) for the order quantity.
export function planFromBom(id: string) {
  const o = readCollection("production-orders").find((x) => x.id === id)!;
  const bom = readCollection("boms").find((b) => b.id === o.bomId) ?? activeBom(String(o.productId));
  if (!bom) throw new Error("No active BOM for this product — create one under Inventory › BOM");
  const products = readCollection("products");
  const materials: Material[] = ((bom.components as Comp[]) ?? []).map((c) => {
    const p = products.find((x) => x.id === c.productId);
    return { id: crypto.randomUUID(), componentId: c.productId, componentSku: String(p?.sku ?? ""), componentName: String(p?.name ?? "—"), plannedQuantity: r4(c.qty * (1 + n(c.waste) / 100) * n(o.quantity)), actualQuantity: 0, unitCost: valuation(c.productId).avg || n(c.unitCost) };
  });
  updateRecord("production-orders", id, { materials, bomId: bom.id, bomName: `${bom.name || "BOM"} v${bom.version}`, status: "PLANNED" });
}

export const setOrderStatus = (id: string, status: string) => updateRecord("production-orders", id, { status, ...(status === "IN_PROGRESS" ? { startedAt: new Date().toISOString() } : {}) });

// Labour on an order: completed (or logged) hours × the work center's hourly rate.
export function laborCost(orderId: string) {
  const centers = readCollection("work-centers");
  return r3(readCollection("work-orders").filter((w) => w.productionOrderId === orderId && w.status !== "CANCELLED").reduce((a, w) => {
    const wc = centers.find((c) => c.code === w.workstation || c.name === w.workstation || c.id === w.workCenterId);
    return a + n(w.actualHours) * n(wc?.costPerHour);
  }, 0));
}

export function completeProduction(id: string, produced: number, scrap: number, notes?: string) {
  const o = readCollection("production-orders").find((x) => x.id === id)!;
  if (!(produced > 0)) throw new Error("Enter the quantity produced");
  const wh = String(o.warehouseId ?? "");
  if (!wh) throw new Error("Set a warehouse on the order before completing it");
  const materials = (o.materials as Material[]) ?? [];
  if (!materials.length) throw new Error("Plan from BOM first — the order has no materials");
  const factor = (produced + scrap) / Math.max(1e-9, n(o.quantity));
  for (const m of materials) {
    const need = r4(m.plannedQuantity * factor), have = onHand(m.componentId, wh);
    if (need > have + 1e-9) throw new Error(`Not enough ${m.componentName}: need ${need}, ${have} on hand`);
  }
  const ref = String(o.orderNumber);
  let value = 0;
  const used = materials.map((m) => {
    const q = r4(m.plannedQuantity * factor);
    value += -recordMove({ date: todayIso(), productId: m.componentId, warehouseId: wh, qty: -q, type: "ADJUSTMENT", reference: `${ref} consume` }).value;
    return { ...m, actualQuantity: r4(m.actualQuantity + q) };
  });
  const labour = laborCost(id) - n(o.laborAbsorbed);
  if (labour > 0) createJournal({ date: todayIso(), description: `Labour absorbed — ${ref}`, status: "POSTED", source: "Manufacturing", lines: [{ accountId: acc("1300"), debit: r3(labour), credit: 0 }, { accountId: acc("5010"), debit: 0, credit: r3(labour) }] });
  const total = value + Math.max(0, labour);
  recordMove({ date: todayIso(), productId: String(o.productId), warehouseId: wh, qty: produced, unitCost: total / produced, type: "ADJUSTMENT", reference: `${ref} output` });
  updateRecord("production-orders", id, {
    materials: used, status: "COMPLETED", completedAt: new Date().toISOString(), laborAbsorbed: n(o.laborAbsorbed) + Math.max(0, labour),
    outputs: [...((o.outputs as object[]) ?? []), { id: crypto.randomUUID(), outputDate: new Date().toISOString(), producedQuantity: produced, scrapQuantity: scrap, notes, materialCost: r3(value), laborCost: r3(Math.max(0, labour)), unitCost: r4(total / produced) }],
  });
}

/* ---------- maintenance ---------- */

const addDays = (iso: string, d: number) => { const x = new Date(iso); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10); };

export function registerEquipment(e: { code: string; name: string; location?: string; preventiveIntervalDays?: number }) {
  if (readCollection("equipment").some((x) => String(x.code).toLowerCase() === e.code.toLowerCase())) throw new Error(`Code ${e.code} is already registered`);
  return createRecord("equipment", { ...e, status: "OPERATIONAL", nextPreventiveDue: e.preventiveIntervalDays ? addDays(todayIso(), e.preventiveIntervalDays) : undefined });
}

export function raiseMaintenance(r: { equipmentId: string; title: string; description?: string; priority: string; kind?: string }) {
  const eq = readCollection("equipment").find((x) => x.id === r.equipmentId);
  // A high-priority breakdown takes the machine out of service until it is fixed.
  if (eq && (r.kind ?? "CORRECTIVE") === "CORRECTIVE" && ["HIGH", "CRITICAL"].includes(r.priority)) updateRecord("equipment", eq.id, { status: "DOWN" });
  return createRecord("maintenance-requests", { ...r, kind: r.kind ?? "CORRECTIVE", requestNumber: nextNumber("maintenance-requests", "MR", 4), equipmentCode: eq?.code, status: "OPEN" });
}

export function setMaintenanceStatus(id: string, status: "IN_PROGRESS" | "CANCELLED") {
  const r = readCollection("maintenance-requests").find((x) => x.id === id)!;
  updateRecord("maintenance-requests", id, { status, ...(status === "IN_PROGRESS" ? { startedAt: new Date().toISOString() } : {}) });
  if (status === "IN_PROGRESS" && r.kind === "CORRECTIVE") updateRecord("equipment", String(r.equipmentId), { status: "DOWN" });
  if (status === "CANCELLED") restoreIfClear(String(r.equipmentId), id);
}

function restoreIfClear(equipmentId: string, exceptId: string) {
  const open = readCollection("maintenance-requests").some((x) => x.id !== exceptId && x.equipmentId === equipmentId && x.kind === "CORRECTIVE" && ["OPEN", "IN_PROGRESS"].includes(String(x.status)) && (x.status === "IN_PROGRESS" || ["HIGH", "CRITICAL"].includes(String(x.priority))));
  if (!open) updateRecord("equipment", equipmentId, { status: "OPERATIONAL" });
}

export function completeMaintenance(id: string, c: { downtimeHours?: number; resolution?: string }) {
  const r = readCollection("maintenance-requests").find((x) => x.id === id)!;
  updateRecord("maintenance-requests", id, { ...c, status: "DONE", completedAt: new Date().toISOString() });
  const eq = readCollection("equipment").find((x) => x.id === r.equipmentId);
  if (!eq) return;
  if (r.kind === "PREVENTIVE") updateRecord("equipment", eq.id, { lastPreventiveAt: todayIso(), nextPreventiveDue: eq.preventiveIntervalDays ? addDays(todayIso(), n(eq.preventiveIntervalDays)) : undefined });
  restoreIfClear(eq.id, id);
}

// Raises a preventive request for every machine whose service is due and not already open.
export function runPreventive() {
  const reqs = readCollection("maintenance-requests");
  let raised = 0;
  for (const e of readCollection("equipment")) {
    if (!e.preventiveIntervalDays || !e.nextPreventiveDue || String(e.nextPreventiveDue) > todayIso()) continue;
    if (reqs.some((r) => r.equipmentId === e.id && r.kind === "PREVENTIVE" && ["OPEN", "IN_PROGRESS"].includes(String(r.status)))) continue;
    raiseMaintenance({ equipmentId: e.id, title: `Preventive service — ${e.name}`, priority: "MEDIUM", kind: "PREVENTIVE" });
    raised++;
  }
  return raised;
}

/* ---------- job work ---------- */

export type JwLine = { id: string; kind: "SENT" | "RECEIVED"; productId: string; productSku: string; productName: string; quantity: number; lineDate: string };

const jwLines = (kind: JwLine["kind"], lines: { productId: string; quantity: number }[]) => {
  const products = readCollection("products");
  return lines.map((l) => { const p = products.find((x) => x.id === l.productId); return { id: crypto.randomUUID(), kind, productId: l.productId, productSku: String(p?.sku ?? ""), productName: String(p?.name ?? "—"), quantity: l.quantity, lineDate: todayIso() }; });
};
const sum = (lines: JwLine[], kind: string) => lines.filter((l) => l.kind === kind).reduce((a, l) => a + l.quantity, 0);

export function createJobWork(j: { vendorId: string; challanNumber?: string; expectedReturnDate?: string; notes?: string; sentLines: { productId: string; quantity: number }[] }) {
  const v = readCollection("vendors").find((x) => x.id === j.vendorId);
  const lines = jwLines("SENT", j.sentLines);
  return createRecord("job-work", { vendorId: j.vendorId, vendorName: v?.name, vendorGstin: v?.taxId ?? v?.gstin ?? "", challanNumber: j.challanNumber, challanDate: todayIso(), expectedReturnDate: j.expectedReturnDate, notes: j.notes, jwNumber: nextNumber("job-work", "JW", 4), lines, sentQty: sum(lines, "SENT"), receivedQty: 0, status: "OPEN" });
}

export function receiveJobWork(id: string, lines: { productId: string; quantity: number }[]) {
  const j = readCollection("job-work").find((x) => x.id === id)!;
  const all = [...((j.lines as JwLine[]) ?? []), ...jwLines("RECEIVED", lines)];
  const sent = sum(all, "SENT"), got = sum(all, "RECEIVED");
  updateRecord("job-work", id, { lines: all, receivedQty: got, status: got >= sent ? "RECEIVED" : "PARTIALLY_RECEIVED" });
}

// Indian FY quarters: Q1 Apr–Jun … Q4 Jan–Mar of the following year.
export function itc04(fy: number, quarter: number) {
  const startMonth = [3, 6, 9, 0][quarter - 1], year = quarter === 4 ? fy + 1 : fy;
  const from = `${year}-${String(startMonth + 1).padStart(2, "0")}-01`;
  const to = new Date(year, startMonth + 3, 0);
  const toIso = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}-${String(to.getDate()).padStart(2, "0")}`;
  const rows = readCollection("job-work").flatMap((j) => ((j.lines as JwLine[]) ?? []).filter((l) => l.lineDate >= from && l.lineDate <= toIso).map((l) => ({ ...l, jwNumber: String(j.jwNumber), challanNumber: String(j.challanNumber ?? ""), vendorName: String(j.vendorName ?? ""), vendorGstin: String(j.vendorGstin ?? "") })));
  return { from, to: toIso, sent: rows.filter((r) => r.kind === "SENT"), received: rows.filter((r) => r.kind === "RECEIVED"), note: "ITC-04 prepared data (Table 4: sent to job worker; Table 5A: received back). UQC/taxable-value columns need item master data not yet captured — export and complete in the portal template." };
}

/* ---------- MRP ---------- */

// Scans reorder rules: anything at or below its reorder point gets a Produce (has an active BOM)
// or Purchase suggestion, topped up to max level when one is set.
export function runMrp() {
  const products = readCollection("products");
  const suggestions = readCollection("reorder-rules").filter((r) => r.active !== false).flatMap((r) => {
    const pid = String(r.productId), have = onHand(pid, String(r.warehouseId));
    if (have > n(r.reorderPoint)) return [];
    const p = products.find((x) => x.id === pid);
    const qty = Math.max(n(r.reorderQty), n(r.maxLevel) ? n(r.maxLevel) - have : 0, n(r.reorderPoint) - have);
    return [{ id: crypto.randomUUID(), actionType: activeBom(pid) ? "PRODUCE" : "PURCHASE", productId: pid, productSku: String(p?.sku ?? ""), productName: String(p?.name ?? "—"), warehouseId: r.warehouseId, currentQuantity: have, reorderPoint: n(r.reorderPoint), suggestedQuantity: r3(qty) }];
  });
  return createRecord("mrp-runs", { runDate: new Date().toISOString(), totalShortages: suggestions.length, status: "COMPLETED", suggestions });
}
