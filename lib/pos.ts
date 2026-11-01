"use client";

// Point of sale: terminals, shifts, sales, returns and the register's pricing rules
// (price lists, promotions, gift cards, loyalty, store credit). A completed sale posts
//
//   Dr 1000 Cash (net of change) / 1100 Bank (card, mobile) / 2300 Customer Deposits (gift card, store credit)
//   Cr 4000 Sales Revenue (after discounts) · 2100 Tax Output Payable · 4100 Other Income (service charge)
//      2010 Accrued Expenses (tips owed to staff) · 2300 Customer Deposits (returnable deposits)
//
// and the goods leave the terminal's warehouse at average cost (Dr 5000 COGS / Cr 1300 Inventory).

import { createRecord, nextNumber, readCollection, seedCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { createJournal, findAccountByCode, reverseJournal, type JournalLine } from "@/lib/ledger";
import { onHand, recordMove, shipStock, valuation } from "@/lib/stock";

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const n = (v: unknown) => Number(v ?? 0) || 0;
const acc = (code: string) => findAccountByCode(code)?.id ?? "";
const todayIso = () => new Date().toISOString().slice(0, 10);

export const PAY_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CREDIT_CARD", label: "Credit card" },
  { value: "DEBIT_CARD", label: "Debit card" },
  { value: "MOBILE_PAYMENT", label: "Mobile" },
  { value: "GIFT_CARD", label: "Gift card" },
];
export const PAY_LABEL: Record<string, string> = { CASH: "Cash", CREDIT_CARD: "Credit card", DEBIT_CARD: "Debit card", MOBILE_PAYMENT: "Mobile", GIFT_CARD: "Gift card", CHECK: "Cheque", OTHER: "Other", STORE_CREDIT: "Store credit" };

const REASONS = ["Damaged packaging", "Loyal customer", "Manager special", "Price match", "Staff discount", "Wrong item", "Defective"];
export const useReasons = () => useCollection("pos-reasons", REASONS.map((name) => ({ name })));

export const useTerminals = () => useCollection("pos-terminals");
export const useShifts = () => useCollection("pos-shifts");
export const usePosSales = () => useCollection("pos-sales");

/* ---------- settings (single record per area) ---------- */

export function getSetting<T extends Record<string, unknown>>(key: string, fallback: T): T {
  const row = readCollection("pos-settings").find((r) => r.key === key);
  return { ...fallback, ...((row?.value as T) ?? {}) };
}
export function saveSetting(key: string, value: Record<string, unknown>) {
  const row = readCollection("pos-settings").find((r) => r.key === key);
  if (row) updateRecord("pos-settings", row.id, { value });
  else createRecord("pos-settings", { key, value });
}
export const LOYALTY_DEFAULT = { name: "Loyalty", earnRate: 1, redeemRate: 0.01, pointsExpiryDays: null as number | null, isActive: true };
export const RECEIPT_DEFAULT = { header: "", footer: "", logoUrl: "", returnPolicy: "", address: "" };

/* ---------- terminals & warehouses ---------- */

// The till's branch decides which warehouse a sale draws from; otherwise the first active one.
export function terminalWarehouse(terminalId?: string) {
  const t = readCollection("pos-terminals").find((x) => x.id === terminalId);
  const whs = readCollection("warehouses").filter((w) => (w.status ?? "ACTIVE") === "ACTIVE");
  return (t?.orgUnitId ? whs.find((w) => w.orgUnit === t.orgUnitId) : undefined)?.id ?? whs[0]?.id ?? "";
}

export const isStocked = (p: Rec | undefined) => !!p && p.trackStock !== false && !["SERVICE", "DIGITAL", "NON_INVENTORY"].includes(String(p.type ?? "GOODS"));

export function stockFor(productIds: string[], warehouseId: string) {
  const products = readCollection("products");
  const out: Record<string, number> = {};
  for (const id of productIds) {
    const p = products.find((x) => x.id === id);
    if (isStocked(p)) out[id] = onHand(id, warehouseId || undefined);
  }
  return out;
}

/* ---------- shifts ---------- */

export const openShiftOf = () => readCollection("pos-shifts").find((s) => s.status === "OPEN");

export function openShift(s: { terminalId: string; openedBy: string; openingCash: number; denominations?: Record<string, number> }) {
  if (readCollection("pos-shifts").some((x) => x.status === "OPEN" && x.terminalId === s.terminalId)) throw new Error("This terminal already has an open shift.");
  return createRecord("pos-shifts", { ...s, shiftNumber: nextNumber("pos-shifts", "SH", 3), cashierName: s.openedBy, openedAt: new Date().toISOString(), status: "OPEN" });
}

// Cash the drawer should hold: opening + cash taken (net of change) + cash in − cash out − cash refunds.
export function shiftReport(shiftId: string) {
  const shift = readCollection("pos-shifts").find((s) => s.id === shiftId);
  if (!shift) return null;
  const sales = readCollection("pos-sales").filter((s) => s.shiftId === shiftId && s.status !== "VOIDED");
  const pays: Record<string, number> = {};
  let cashSales = 0;
  for (const s of sales) for (const p of (s.payments as Rec[]) ?? []) {
    const amt = p.method === "CASH" ? n(p.amount) - n(s.changeGiven) : n(p.amount);
    pays[String(p.method)] = r3((pays[String(p.method)] ?? 0) + amt);
    if (p.method === "CASH") cashSales += amt;
  }
  const moves = readCollection("pos-cash-moves").filter((m) => m.shiftId === shiftId);
  const cashIn = moves.filter((m) => m.movementType === "CASH_IN").reduce((a, m) => a + n(m.amount), 0);
  const cashOut = moves.filter((m) => m.movementType === "CASH_OUT").reduce((a, m) => a + n(m.amount), 0);
  const refunds = readCollection("pos-returns").filter((r) => r.shiftId === shiftId && r.refundMethod !== "STORE_CREDIT").reduce((a, r) => a + n(r.totalRefund), 0);
  const expected = r3(n(shift.openingCash) + cashSales + cashIn - cashOut - refunds);
  const terminal = readCollection("pos-terminals").find((t) => t.id === shift.terminalId);
  return {
    kind: shift.status === "OPEN" ? "X" : "Z",
    shift: { ...shift, terminalName: String(terminal?.name ?? "—") } as Rec & { terminalName: string },
    sales: { count: sales.length, net: r3(sales.reduce((a, s) => a + n(s.subtotal), 0)), tax: r3(sales.reduce((a, s) => a + n(s.taxAmount), 0)), total: r3(sales.reduce((a, s) => a + n(s.totalAmount), 0)) },
    payments: Object.entries(pays).map(([type, amount]) => ({ type, amount })),
    cash: { openingCash: n(shift.openingCash), cashSales: r3(cashSales), cashIn: r3(cashIn), cashOut: r3(cashOut + refunds), expectedCash: expected, closingCash: shift.closingCash as number | undefined, variance: shift.cashDifference as number | undefined },
    generatedAt: new Date().toISOString(),
  };
}

export function closeShift(id: string, c: { closedBy: string; closingCash: number; denominations?: Record<string, number> }) {
  const rep = shiftReport(id);
  if (!rep) throw new Error("Shift not found");
  const diff = r3(c.closingCash - rep.cash.expectedCash);
  updateRecord("pos-shifts", id, { closedBy: c.closedBy, closingCash: c.closingCash, closingDenominations: c.denominations, closedAt: new Date().toISOString(), expectedCash: rep.cash.expectedCash, cashDifference: diff, status: "CLOSED" });
  // A drawer that is over or short is written off to Other Income / Miscellaneous Expenses.
  if (Math.abs(diff) > 0.0005)
    createJournal({ date: todayIso(), description: `Cash ${diff > 0 ? "over" : "short"} — shift ${String(rep.shift.shiftNumber)}`, status: "POSTED", source: "POS Shift", lines: diff > 0 ? [{ accountId: acc("1000"), debit: diff, credit: 0 }, { accountId: acc("4100"), debit: 0, credit: diff }] : [{ accountId: acc("6000"), debit: -diff, credit: 0 }, { accountId: acc("1000"), debit: 0, credit: -diff }] });
  return { ...readCollection("pos-shifts").find((s) => s.id === id)!, cashDifference: diff };
}

export function cashMovement(m: { shiftId: string; movementType: "CASH_IN" | "CASH_OUT"; amount: number; reason: string; offsetAccountId?: string }) {
  createRecord("pos-cash-moves", { ...m, date: todayIso() });
  if (m.offsetAccountId) {
    const cash = acc("1000");
    const lines: JournalLine[] = m.movementType === "CASH_IN" ? [{ accountId: cash, debit: m.amount, credit: 0 }, { accountId: m.offsetAccountId, debit: 0, credit: m.amount }] : [{ accountId: m.offsetAccountId, memo: m.reason, debit: m.amount, credit: 0 }, { accountId: cash, debit: 0, credit: m.amount }];
    createJournal({ date: todayIso(), description: `${m.movementType === "CASH_IN" ? "Cash in" : "Cash out"} — ${m.reason}`, status: "POSTED", source: "POS Cash", lines });
  }
}

/* ---------- pricing rules ---------- */

// Price-list price for each product: the customer's list first, then the company default.
export function listPrices(productIds: string[], customerId?: string) {
  const lists = readCollection("price-lists");
  const customer = readCollection("customers").find((c) => c.id === customerId);
  const ordered = [lists.find((l) => l.id === customer?.priceListId), lists.find((l) => l.isDefault)].filter(Boolean) as Rec[];
  const out: Record<string, number> = {};
  for (const id of productIds)
    for (const l of ordered) {
      const item = ((l.items as Rec[]) ?? []).find((i) => i.productId === id);
      if (item) { out[id] = n(item.price); break; }
    }
  return out;
}

type CartLine = { productId: string; quantity: number; unitPrice: number };

export function promoApplies(p: Rec, now = new Date()) {
  if (p.isActive === false) return false;
  if (p.maxRedemptions && n(p.redemptions) >= n(p.maxRedemptions)) return false;
  const days = (p.daysOfWeek as number[]) ?? [];
  if (days.length && !days.includes(now.getDay())) return false;
  const hm = now.toTimeString().slice(0, 5);
  if (p.startTime && hm < String(p.startTime)) return false;
  if (p.endTime && hm > String(p.endTime)) return false;
  return true;
}

// Promotions the cart qualifies for, each with its discount. Coupon promos need their code.
export function evaluatePromotions(subtotal: number, lines: CartLine[], code?: string) {
  const out: { id: string; name: string; discount: number }[] = [];
  for (const p of readCollection("promotions")) {
    if (!promoApplies(p)) continue;
    if (p.code && String(p.code).toLowerCase() !== (code ?? "").toLowerCase()) continue;
    if (subtotal < n(p.minSubtotal)) continue;
    let d = 0;
    if (p.type === "PERCENT") d = (subtotal * Math.min(n(p.value), 100)) / 100;
    else if (p.type === "AMOUNT") d = Math.min(n(p.value), subtotal);
    else if (p.type === "BOGO") {
      const bought = lines.filter((l) => l.productId === p.buyProductId).reduce((a, l) => a + l.quantity, 0);
      const get = lines.filter((l) => l.productId === p.getProductId);
      const getQty = get.reduce((a, l) => a + l.quantity, 0);
      const sets = Math.floor(bought / Math.max(1, n(p.buyQuantity)));
      // When buy and get are the same product, the free units come out of the same pile.
      const free = p.buyProductId === p.getProductId ? Math.floor(getQty / (n(p.buyQuantity) + n(p.getQuantity))) * n(p.getQuantity) : Math.min(getQty, sets * n(p.getQuantity));
      d = free * (get[0]?.unitPrice ?? 0) * (n(p.getDiscountPercent || 100) / 100);
    }
    if (d > 0) out.push({ id: p.id, name: String(p.name), discount: r3(d) });
  }
  return out;
}

export const giftCard = (code: string) => readCollection("gift-cards").find((g) => String(g.code).toLowerCase() === code.trim().toLowerCase());

export function issueGiftCard(amount: number, code?: string) {
  const c = (code || `GC-${Math.random().toString(36).slice(2, 8).toUpperCase()}`).trim();
  if (giftCard(c)) throw new Error(`Gift card ${c} already exists`);
  const g = createRecord("gift-cards", { code: c, balance: r3(amount), initial: r3(amount), isActive: true });
  // The money is held as a liability until the card is spent.
  createJournal({ date: todayIso(), description: `Gift card ${c} issued`, status: "POSTED", source: "Gift Card", lines: [{ accountId: acc("1000"), debit: amount, credit: 0 }, { accountId: acc("2300"), memo: c, debit: 0, credit: amount }] });
  return g;
}

export const storeCredit = (customerId?: string) => n(readCollection("customers").find((c) => c.id === customerId)?.storeCredit);
export const loyaltyPoints = (customerId?: string) => n(readCollection("customers").find((c) => c.id === customerId)?.loyaltyPoints);

/* ---------- sales ---------- */

export type SaleLineInput = { productId?: string; description: string; quantity: number; unitPrice: number; taxRate: number; discountAmount?: number; discountPercent?: number; discountReason?: string; serials?: string[]; uomFactor?: number };
export type PaymentInput = { method: string; amount: number; reference?: string };

const lineDisc = (l: SaleLineInput) => {
  const gross = l.unitPrice * l.quantity;
  return l.discountAmount && l.discountAmount > 0 ? Math.min(l.discountAmount, gross) : l.discountPercent && l.discountPercent > 0 ? (gross * l.discountPercent) / 100 : 0;
};

export function completeSale(s: {
  terminalId?: string; shiftId?: string; cashierName?: string; customerId?: string; lines: SaleLineInput[]; payments: PaymentInput[];
  cartDiscount?: { type: "PERCENT" | "AMOUNT"; value: number; reason: string } | null; promotions?: { id: string; name: string; discount: number }[];
  loyaltyRedeemPoints?: number; serviceCharge?: number; tip?: number; orderType?: string; guestCount?: number; staffId?: string; couponCode?: string; source?: string;
}) {
  const settings = s.terminalId ? readCollection("pos-terminals").find((t) => t.id === s.terminalId) : undefined;
  const inclusive = settings?.pricesIncludeTax === true;
  // Per-line net after line discounts; order-level discounts are spread pro rata for tax.
  const nets = s.lines.map((l) => l.unitPrice * l.quantity - lineDisc(l));
  const netSum = nets.reduce((a, v) => a + v, 0);
  const lineDiscTotal = s.lines.reduce((a, l) => a + lineDisc(l), 0);
  const cartDisc = s.cartDiscount && s.cartDiscount.value > 0 && netSum > 0 ? (s.cartDiscount.type === "PERCENT" ? (netSum * Math.min(s.cartDiscount.value, 100)) / 100 : Math.min(s.cartDiscount.value, netSum)) : 0;
  const promoDisc = Math.max(0, Math.min((s.promotions ?? []).reduce((a, p) => a + p.discount, 0), netSum - cartDisc));
  const loyalty = getSetting("loyalty", LOYALTY_DEFAULT);
  const pts = Math.min(n(s.loyaltyRedeemPoints), loyaltyPoints(s.customerId));
  const loyaltyDisc = Math.max(0, Math.min(pts * loyalty.redeemRate, netSum - cartDisc - promoDisc));
  const orderDisc = cartDisc + promoDisc + loyaltyDisc;
  let tax = 0;
  const lines = s.lines.map((l, i) => {
    const share = netSum > 0 ? (orderDisc * nets[i]) / netSum : 0;
    const base = nets[i] - share;
    const lt = inclusive ? base - base / (1 + l.taxRate / 100) : (base * l.taxRate) / 100;
    tax += lt;
    const cost = l.productId ? r3(valuation(l.productId).avg * l.quantity * (l.uomFactor || 1)) : 0;
    return { ...l, discountAmount: r3(lineDisc(l)), taxAmount: r3(lt), lineTotal: r3(inclusive ? base : base + lt), cost, returned: 0 };
  });
  const goods = netSum - orderDisc;
  const subtotal = r3(inclusive ? goods - tax : goods);
  tax = r3(tax);
  const service = n(s.serviceCharge), tip = n(s.tip);
  const total = r3(subtotal + tax + service + tip);
  const paid = r3(s.payments.reduce((a, p) => a + p.amount, 0));
  if (paid + 0.0005 < total) throw new Error(`Payment ${paid.toFixed(3)} is short of the total ${total.toFixed(3)}`);
  const change = r3(paid - total);
  if (change > 0 && !s.payments.some((p) => p.method === "CASH")) throw new Error("Only cash can be over-tendered.");

  for (const p of s.payments) {
    if (p.method === "GIFT_CARD") {
      const g = giftCard(p.reference ?? "");
      if (!g || g.isActive === false) throw new Error(`Gift card ${p.reference || "(no code)"} not found`);
      if (n(g.balance) + 0.0005 < p.amount) throw new Error(`Gift card ${g.code} has only ${n(g.balance).toFixed(3)} left`);
    }
    if (p.method === "STORE_CREDIT" && storeCredit(s.customerId) + 0.0005 < p.amount) throw new Error("Store credit exceeds the available balance.");
  }

  const customer = readCollection("customers").find((c) => c.id === s.customerId);
  const today = todayIso();
  const tokenNumber = readCollection("pos-sales").filter((x) => x.saleDate === today).length + 1;
  const sale = createRecord("pos-sales", {
    saleNumber: nextNumber("pos-sales", "POS"), saleDate: today, terminalId: s.terminalId, shiftId: s.shiftId, cashierName: s.cashierName, customerId: s.customerId, customerName: customer?.name,
    lines, subtotal, discountAmount: r3(lineDiscTotal + orderDisc), lineDiscount: r3(lineDiscTotal), cartDiscount: r3(cartDisc), promoDiscount: r3(promoDisc), loyaltyDiscount: r3(loyaltyDisc), cartDiscountReason: s.cartDiscount?.reason,
    promotions: s.promotions, couponCode: s.couponCode, taxAmount: tax, serviceCharge: service, tip, totalAmount: total, amountPaid: paid, changeGiven: change,
    payments: s.payments.map((p) => ({ ...p, id: crypto.randomUUID() })), orderType: s.orderType ?? "COUNTER", guestCount: s.guestCount, staffId: s.staffId, tokenNumber, status: "PAID", source: s.source ?? "REGISTER",
  });

  // Money side.
  const debit = (m: string) => (m === "CASH" ? acc("1000") : m === "GIFT_CARD" || m === "STORE_CREDIT" ? acc("2300") : acc("1100"));
  const jl: JournalLine[] = s.payments.map((p) => ({ accountId: debit(p.method), memo: PAY_LABEL[p.method] ?? p.method, debit: r3(p.method === "CASH" ? p.amount - change : p.amount), credit: 0 })).filter((l) => l.debit > 0);
  const deposits = lines.filter((l) => !l.productId && l.description.startsWith("Deposit — ")).reduce((a, l) => a + l.lineTotal, 0);
  jl.push({ accountId: acc("4000"), memo: "POS sales", debit: 0, credit: r3(subtotal - deposits) });
  if (deposits) jl.push({ accountId: acc("2300"), memo: "Returnable deposits", debit: 0, credit: r3(deposits) });
  if (tax) jl.push({ accountId: acc("2100"), memo: "Output tax", debit: 0, credit: tax });
  if (service) jl.push({ accountId: acc("4100"), memo: "Service charge", debit: 0, credit: service });
  if (tip) jl.push({ accountId: acc("2010"), memo: "Tips payable", debit: 0, credit: tip });
  const je = total > 0 ? createJournal({ date: today, description: `POS sale ${sale.saleNumber}`, status: "POSTED", source: "POS", lines: jl.filter((l) => l.accountId && (l.debit || l.credit)) }) : null;

  // Goods side.
  const wh = terminalWarehouse(s.terminalId);
  const products = readCollection("products");
  const stockLines = lines.filter((l) => l.productId && isStocked(products.find((p) => p.id === l.productId))).map((l) => ({ productId: l.productId!, qty: l.quantity * (l.uomFactor || 1) }));
  if (wh && stockLines.length) shipStock({ date: today, warehouseId: wh, reference: String(sale.saleNumber), lines: stockLines });

  // Tender side effects.
  for (const p of s.payments) {
    if (p.method === "GIFT_CARD") { const g = giftCard(p.reference ?? "")!; updateRecord("gift-cards", g.id, { balance: r3(n(g.balance) - p.amount) }); }
    if (p.method === "STORE_CREDIT" && customer) updateRecord("customers", customer.id, { storeCredit: r3(storeCredit(customer.id) - p.amount) });
  }
  if (customer && loyalty.isActive) updateRecord("customers", customer.id, { loyaltyPoints: r3(loyaltyPoints(customer.id) - pts + Math.floor(total * loyalty.earnRate)) });
  for (const p of s.promotions ?? []) { const pr = readCollection("promotions").find((x) => x.id === p.id); if (pr) updateRecord("promotions", pr.id, { redemptions: n(pr.redemptions) + 1 }); }

  updateRecord("pos-sales", sale.id, { journalId: je?.id, warehouseId: wh });
  return { ...sale, journalId: je?.id } as Rec;
}

export function audit(action: string, actorName: string, details?: Record<string, unknown>, approverName?: string) {
  createRecord("pos-audit", { action, actorName, approverName, details });
}

// Puts stock back at the cost it left with and reverses that cost of sale.
function restock(items: { productId: string; qty: number; unitCost: number }[], warehouseId: string, reference: string) {
  let total = 0;
  for (const it of items) if (it.productId && it.qty > 0 && warehouseId) total += recordMove({ date: todayIso(), productId: it.productId, warehouseId, qty: it.qty, unitCost: it.unitCost, type: "RETURN", reference }).value;
  if (total > 0) createJournal({ date: todayIso(), description: `Restock ${reference}`, status: "POSTED", source: "POS Return", lines: [{ accountId: acc("1300"), debit: r3(total), credit: 0 }, { accountId: acc("5000"), debit: 0, credit: r3(total) }] });
}

export function voidSale(id: string, actor: string, reason = "Voided by user") {
  const sale = readCollection("pos-sales").find((s) => s.id === id);
  if (!sale || sale.status !== "PAID") throw new Error("Only a paid sale can be voided");
  const je = readCollection("journal-entries").find((j) => j.id === sale.journalId);
  if (je) reverseJournal(je, todayIso());
  const products = readCollection("products");
  const lines = (sale.lines as Rec[]) ?? [];
  restock(lines.filter((l) => l.productId && isStocked(products.find((p) => p.id === l.productId))).map((l) => ({ productId: String(l.productId), qty: n(l.quantity) * (n(l.uomFactor) || 1) - n(l.returned), unitCost: n(l.cost) / Math.max(1e-9, n(l.quantity) * (n(l.uomFactor) || 1)) })), String(sale.warehouseId ?? ""), `Void ${sale.saleNumber}`);
  for (const p of (sale.payments as Rec[]) ?? []) if (p.method === "GIFT_CARD") { const g = giftCard(String(p.reference ?? "")); if (g) updateRecord("gift-cards", g.id, { balance: r3(n(g.balance) + n(p.amount)) }); }
  updateRecord("pos-sales", id, { status: "VOIDED", voidReason: reason, voidedAt: new Date().toISOString() });
  audit("VOID", actor, { sale: sale.saleNumber, total: sale.totalAmount, reason });
}

export function returnLines(sale: Rec) {
  return ((sale.lines as Rec[]) ?? []).map((l, i) => ({ saleLineId: String(i), description: String(l.description), quantity: n(l.quantity), unitPrice: n(l.unitPrice), lineTotal: n(l.lineTotal), alreadyReturned: n(l.returned), remaining: r3(n(l.quantity) - n(l.returned)) }));
}

// Return against a receipt: refunds the line value (tax included) and optionally restocks.
export function processReturn(r: { saleId: string; lines: { saleLineId: string; quantity: number; restock: boolean }[]; refundMethod: "ORIGINAL" | "STORE_CREDIT" | "EXCHANGE"; reason?: string; actor: string }) {
  const sale = readCollection("pos-sales").find((s) => s.id === r.saleId);
  if (!sale) throw new Error("Sale not found");
  const lines = [...((sale.lines as Rec[]) ?? [])].map((l) => ({ ...l }));
  let refund = 0, taxPart = 0;
  const back: { productId: string; qty: number; unitCost: number }[] = [];
  const products = readCollection("products");
  for (const x of r.lines) {
    const l = lines[Number(x.saleLineId)];
    if (!l || x.quantity <= 0) continue;
    const left = n(l.quantity) - n(l.returned);
    if (x.quantity > left + 1e-9) throw new Error(`Only ${left} of "${l.description}" can be returned`);
    const share = x.quantity / n(l.quantity);
    refund += n(l.lineTotal) * share;
    taxPart += n(l.taxAmount) * share;
    l.returned = r3(n(l.returned) + x.quantity);
    const f = n(l.uomFactor) || 1;
    if (x.restock && l.productId && isStocked(products.find((p) => p.id === l.productId))) back.push({ productId: String(l.productId), qty: x.quantity * f, unitCost: n(l.cost) / Math.max(1e-9, n(l.quantity) * f) });
  }
  refund = r3(refund); taxPart = r3(taxPart);
  const shift = openShiftOf();
  const ret = createRecord("pos-returns", { returnNumber: nextNumber("pos-returns", "RET"), originalSaleId: sale.id, saleNumber: sale.saleNumber, shiftId: shift?.id, lines: r.lines, totalRefund: refund, refundMethod: r.refundMethod, reason: r.reason, date: todayIso() });
  const credit = r.refundMethod === "ORIGINAL" ? acc("1000") : acc("2300");
  createJournal({ date: todayIso(), description: `POS return ${ret.returnNumber} — ${sale.saleNumber}`, status: "POSTED", source: "POS Return", lines: [{ accountId: acc("4020"), debit: r3(refund - taxPart), credit: 0 }, ...(taxPart ? [{ accountId: acc("2100"), debit: taxPart, credit: 0 }] : []), { accountId: credit, debit: 0, credit: refund }] });
  restock(back, String(sale.warehouseId ?? ""), String(ret.returnNumber));
  if (r.refundMethod !== "ORIGINAL" && sale.customerId) updateRecord("customers", String(sale.customerId), { storeCredit: r3(storeCredit(String(sale.customerId)) + refund) });
  const fully = lines.every((l) => n(l.returned) >= n(l.quantity) - 1e-9);
  updateRecord("pos-sales", sale.id, { lines, status: fully ? "REFUNDED" : "PARTIALLY_REFUNDED" });
  audit("REFUND", r.actor, { sale: sale.saleNumber, return: ret.returnNumber, amount: refund });
  return ret;
}

export function blindReturn(r: { terminalId: string; lines: { description: string; quantity: number; refundAmount: number }[]; refundMethod: "ORIGINAL" | "STORE_CREDIT"; customerId?: string; reason?: string; offsetAccountId?: string; approver: string; actor: string }) {
  const total = r3(r.lines.reduce((a, l) => a + l.quantity * l.refundAmount, 0));
  const shift = openShiftOf();
  const ret = createRecord("pos-returns", { returnNumber: nextNumber("pos-returns", "RET"), blind: true, terminalId: r.terminalId, shiftId: shift?.id, lines: r.lines, totalRefund: total, refundMethod: r.refundMethod, customerId: r.customerId, reason: r.reason, approver: r.approver, date: todayIso() });
  if (r.offsetAccountId) createJournal({ date: todayIso(), description: `Blind return ${ret.returnNumber}`, status: "POSTED", source: "POS Return", lines: [{ accountId: r.offsetAccountId, debit: total, credit: 0 }, { accountId: r.refundMethod === "ORIGINAL" ? acc("1000") : acc("2300"), debit: 0, credit: total }] });
  if (r.refundMethod === "STORE_CREDIT" && r.customerId) updateRecord("customers", r.customerId, { storeCredit: r3(storeCredit(r.customerId) + total) });
  audit("REFUND", r.actor, { return: ret.returnNumber, amount: total, blind: true }, r.approver);
  return ret;
}

/* ---------- supervisor approval ---------- */

export function checkPin(pin: string) {
  const s = getSetting("supervisor", { pin: "", name: "" });
  return s.pin && s.pin === pin ? String(s.name || "Supervisor") : null;
}

/* ---------- kitchen, tabs, tables ---------- */

export function sendToKitchen(k: { lines: { productId?: string; description: string; quantity: number; modifiers?: string }[]; tabId?: string; sourceLabel: string; orderType: string }) {
  const ticketNumber = readCollection("kitchen-tickets").length + 1;
  return createRecord("kitchen-tickets", { ...k, ticketNumber, status: "NEW", lines: k.lines.map((l) => ({ ...l, id: crypto.randomUUID() })) });
}

export function seatTable(tableId: string) {
  const t = readCollection("pos-tables").find((x) => x.id === tableId)!;
  const tab = createRecord("pos-tabs", { label: t.name, tableLabel: t.name, tableId, payload: { cart: [] }, status: "OPEN" });
  updateRecord("pos-tables", tableId, { status: "OCCUPIED", activeTabId: tab.id });
  return tab;
}

export function closeTab(tabId: string, saleId?: string) {
  const tab = readCollection("pos-tabs").find((t) => t.id === tabId);
  if (!tab) return;
  updateRecord("pos-tabs", tabId, { status: "CLOSED", saleId });
  if (tab.tableId) updateRecord("pos-tables", String(tab.tableId), { status: "FREE", activeTabId: null });
}

/* ---------- customer display (same browser, another window) ---------- */

export type DisplayState = { shopName: string; lines: { name: string; quantity: number; unitPrice: number; lineTotal: number }[]; subtotal: number; discount: number; tax: number; total: number; completed: { saleNumber: string; change: number; paidTotal: number } | null };
const DISPLAY_KEY = "taxgo:pos-display";
export function pushDisplay(s: DisplayState) {
  try { localStorage.setItem(DISPLAY_KEY, JSON.stringify({ ...s, at: Date.now() })); } catch {}
}
export function readDisplay(): DisplayState | null {
  try { return JSON.parse(localStorage.getItem(DISPLAY_KEY) || "null"); } catch { return null; }
}
export const DISPLAY_STORAGE_KEY = DISPLAY_KEY;

export function seedPos() {
  seedCollection("pos-reasons", REASONS.map((name) => ({ name })));
}
