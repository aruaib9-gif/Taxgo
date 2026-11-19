"use client";

// The touch register: catalog on the left, cart on the right, behind an open shift.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Minus, Plus, ScanBarcode, ShoppingCart, Star, Trash2, Store, Loader2 } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { useAccounts } from "@/lib/ledger";
import {
  LOYALTY_DEFAULT, PAY_METHODS, cashMovement, closeTab, completeSale, evaluatePromotions, getSetting, listPrices, loyaltyPoints, openShift, pushDisplay,
  sendToKitchen, stockFor, storeCredit, terminalWarehouse, useReasons, type PaymentInput,
} from "@/lib/pos";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { AccountPicker, Card, Dialog, Label, btn, inputCls, money, num } from "@/components/accounting/kit";
import { Select } from "@/components/accounting/pickers";
import { RecordPicker } from "@/components/sales/doc-kit";
import { ApprovalDialog, DenominationCounter, Keypad, countTotal, printReceipt } from "@/components/pos/kit";
import { activeCompanyName } from "@/lib/companies";

type Line = {
  lineId: string; productId: string; name: string; sku: string; unitPrice: number; baseUnitPrice?: number; quantity: number; taxRate: number;
  modifiersLabel?: string; priceOverridden?: boolean; serials?: string[]; note?: string; discountPercent?: number; discountAmount?: number; discountReason?: string; stockAvailable?: number;
};
type CartDiscount = { type: "PERCENT" | "AMOUNT"; value: number; reason: string } | null;
const uid = () => crypto.randomUUID();
const lineDisc = (l: Line) => { const g = l.unitPrice * l.quantity; return l.discountAmount && l.discountAmount > 0 ? Math.min(l.discountAmount, g) : l.discountPercent && l.discountPercent > 0 ? (g * l.discountPercent) / 100 : 0; };
const ORDER_TYPES = [["COUNTER", "Counter"], ["DINE_IN", "Dine-in"], ["TAKEAWAY", "Takeaway"], ["DELIVERY", "Delivery"]] as const;
const chip = (on: boolean) => cn("whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors", on ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent");
const linkBtn = "rounded-md border border-border px-2 py-1 text-xs hover:bg-accent disabled:opacity-50";

export function Register() {
  const terminals = useCollection("pos-terminals");
  const shifts = useCollection("pos-shifts");
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 0); return () => clearTimeout(t); }, []);
  const shift = shifts.find((s) => s.status === "OPEN");
  if (!ready) return <div className="flex h-64 items-center justify-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  if (!shift) return <OpenShift terminals={terminals.filter((t) => t.isActive !== false)} />;
  return <Till key={shift.id} shift={shift} />;
}

/* ---------- open shift ---------- */

function OpenShift({ terminals }: { terminals: Rec[] }) {
  const [terminalId, setTerminalId] = useState(String(terminals[0]?.id ?? ""));
  const [cashier, setCashier] = useState<string>(BRAND.user.fullName);
  const [cash, setCash] = useState("0");
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  function open() {
    if (!terminalId) return setError("Select a terminal");
    if (!cashier.trim()) return setError("Enter the cashier name");
    try { openShift({ terminalId, openedBy: cashier.trim(), openingCash: counting ? countTotal(count) : num(cash), denominations: counting ? count : undefined }); } catch (e) { setError((e as Error).message); }
  }
  return (
    <div className="flex justify-center pt-[12vh]">
      <Card className="w-full max-w-md">
        <div className="p-6 pb-3"><h2 className="flex items-center gap-2 font-semibold tracking-tight"><LockKeyhole className="size-4" /> Open a shift to start selling</h2></div>
        <div className="space-y-4 p-6 pt-0">
          {terminals.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active POS terminals yet. Create one under <Link className="underline" href="/pos/terminals/new">POS → Terminals</Link> first.</p>
          ) : (
            <>
              <div className="space-y-2"><Label>Terminal</Label><Select value={terminalId} onChange={setTerminalId} placeholder="Select a terminal" options={terminals.map((t) => ({ value: t.id, label: `${t.name}${t.location ? ` — ${t.location}` : ""}` }))} /></div>
              <div className="space-y-2"><Label htmlFor="os-cashier">Cashier</Label><input id="os-cashier" value={cashier} onChange={(e) => setCashier(e.target.value)} placeholder="Cashier name" className={inputCls} /></div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label htmlFor="os-cash">Opening cash</Label><button type="button" className="text-xs text-primary underline" onClick={() => setCounting((c) => !c)}>{counting ? "Enter amount" : "Count drawer"}</button></div>
                {counting ? <DenominationCounter value={count} onChange={setCount} /> : <input id="os-cash" type="number" inputMode="decimal" step="0.001" min={0} value={cash} onChange={(e) => setCash(e.target.value)} className={inputCls} />}
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="button" onClick={open} className={cn(btn.primary, "w-full")}>Open Shift</button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------- the till ---------- */

function Till({ shift }: { shift: Rec }) {
  const router = useRouter();
  const params = useSearchParams();
  const terminals = useCollection("pos-terminals");
  const customers = useCollection("customers");
  const tabs = useCollection("pos-tabs").filter((t) => t.status === "OPEN");
  const held = useCollection("pos-held").filter((h) => h.terminalId === shift.terminalId);
  const employees = useCollection("employees");
  const reasons = useReasons();
  const terminal = terminals.find((t) => t.id === shift.terminalId);
  const warehouseId = terminalWarehouse(String(shift.terminalId));
  const defaultTax = num(terminal?.defaultTaxRate);
  const loyalty = getSetting("loyalty", LOYALTY_DEFAULT);

  const [cart, setCart] = useState<Line[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [cartDiscount, setCartDiscount] = useState<CartDiscount>(null);
  const [coupon, setCoupon] = useState("");
  const [points, setPoints] = useState("");
  const [orderType, setOrderType] = useState("COUNTER");
  const [guests, setGuests] = useState("");
  const [staffId, setStaffId] = useState("");
  const [service, setService] = useState("");
  const [tip, setTip] = useState("");
  const [tabId, setTabId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; bad?: boolean } | null>(null);
  const [dialog, setDialog] = useState<null | { kind: "pay" | "cash" | "tabs" | "held" | "discount" } | { kind: "line"; id: string } | { kind: "age" | "serial" | "weight"; product: Rec } | { kind: "mods"; product: Rec; groups: Rec[] } | { kind: "done"; sale: Rec }>(null);

  const say = (text: string, bad = false) => { setToast({ text, bad }); setTimeout(() => setToast(null), 3500); };

  // Resume a tab opened from the floor plan (?tab=…).
  const [tabParam, setTabParam] = useState(params.get("tab"));
  if (tabParam) {
    const t = readCollection("pos-tabs").find((x) => x.id === tabParam);
    setTabParam(null);
    if (t) { const p = (t.payload as Rec) ?? {}; setCart((p.cart as Line[]) ?? []); setCustomerId(String(p.customerId ?? "")); setCartDiscount((p.cartDiscount as CartDiscount) ?? null); setTabId(t.id); setOrderType("DINE_IN"); }
  }

  const add = (p: Rec, opts?: { mods?: { name: string; priceDelta: number }[]; quantity?: number; serials?: string[] }) => {
    const delta = (opts?.mods ?? []).reduce((a, m) => a + num(m.priceDelta), 0);
    const rate = p.tax != null && num(p.tax) > 0 ? num(p.tax) : defaultTax;
    if (!(num(p.tax) > 0)) say(rate > 0 ? `No GST rate on "${p.name}" — using terminal default (${rate}%)` : `No GST rate on "${p.name}" — tax will be 0%`, true);
    const price = listPrices([p.id], customerId)[p.id] ?? num(p.retail);
    const stock = stockFor([p.id], warehouseId)[p.id];
    const lines: Line[] = [{ lineId: uid(), productId: p.id, name: String(p.name), sku: String(p.sku ?? ""), unitPrice: price + delta, baseUnitPrice: price, quantity: opts?.quantity ?? 1, taxRate: rate, modifiersLabel: opts?.mods?.length ? opts.mods.map((m) => m.name).join(", ") : undefined, priceOverridden: !!opts?.mods?.length, serials: opts?.serials, stockAvailable: stock }];
    if (num(p.depositAmount) > 0) lines.push({ lineId: uid(), productId: "", name: `Deposit — ${p.name}`, sku: "DEPOSIT", unitPrice: num(p.depositAmount), quantity: 1, taxRate: 0, priceOverridden: true });
    setCart((c) => [...c, ...lines]);
  };

  const addWithMods = (p: Rec) => {
    const groups = readCollection("modifier-groups").filter((g) => ((g.productIds as string[]) ?? []).includes(p.id));
    if (groups.length) return setDialog({ kind: "mods", product: p, groups });
    add(p);
  };

  const pick = (p: Rec) => {
    if (p.ageRestricted) return setDialog({ kind: "age", product: p });
    if (p.trackSerial) return setDialog({ kind: "serial", product: p });
    if (p.soldByWeight) return setDialog({ kind: "weight", product: p });
    addWithMods(p);
  };

  function scan(code: string) {
    const c = code.trim().toLowerCase();
    if (!c) return;
    const p = readCollection("products").find((x) => String(x.barcode ?? "").toLowerCase() === c || String(x.sku ?? "").toLowerCase() === c);
    if (!p) return say(`Not found — no product for "${code}"`, true);
    pick(p);
  }

  // Re-price list-priced lines when the customer changes (their price list may differ).
  const [priceFor, setPriceFor] = useState(customerId);
  if (priceFor !== customerId) {
    setPriceFor(customerId);
    const prices = listPrices(cart.map((l) => l.productId).filter(Boolean), customerId);
    setCart((c) => c.map((l) => (!l.priceOverridden && l.productId ? { ...l, unitPrice: prices[l.productId] ?? num(readCollection("products").find((p) => p.id === l.productId)?.retail) } : l)));
  }

  const promoLines = cart.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.unitPrice }));
  const netBefore = cart.reduce((a, l) => a + l.unitPrice * l.quantity - lineDisc(l), 0);
  const promotions = netBefore > 0 ? evaluatePromotions(netBefore, promoLines, coupon.trim() || undefined) : [];
  const credit = storeCredit(customerId);
  const ptsAvail = loyalty.isActive ? loyaltyPoints(customerId) : 0;

  const t = (() => {
    const gross = cart.reduce((a, l) => a + l.unitPrice * l.quantity, 0);
    const lineD = cart.reduce((a, l) => a + lineDisc(l), 0);
    const nets = cart.map((l) => l.unitPrice * l.quantity - lineDisc(l));
    const net = nets.reduce((a, v) => a + v, 0);
    const cartD = cartDiscount && cartDiscount.value > 0 && net > 0 ? (cartDiscount.type === "PERCENT" ? (net * Math.min(cartDiscount.value, 100)) / 100 : Math.min(cartDiscount.value, net)) : 0;
    const promoD = Math.max(0, Math.min(promotions.reduce((a, p) => a + p.discount, 0), net - cartD));
    const loyaltyD = Math.max(0, Math.min(Math.min(num(points), ptsAvail) * loyalty.redeemRate, net - cartD - promoD));
    const orderD = cartD + promoD + loyaltyD;
    const inclusive = terminal?.pricesIncludeTax === true;
    const tax = cart.reduce((a, l, i) => { const base = nets[i] - (net > 0 ? (orderD * nets[i]) / net : 0); return a + (inclusive ? base - base / (1 + l.taxRate / 100) : (base * l.taxRate) / 100); }, 0);
    const subtotal = inclusive ? net - orderD - tax : net - orderD;
    return { gross, lineD, cartD, promoD, loyaltyD, discount: lineD + orderD, subtotal, tax, total: subtotal + tax };
  })();
  const serviceAmt = Math.max(0, num(service)), tipAmt = Math.max(0, num(tip));
  const grand = Math.round((t.total + serviceAmt + tipAmt) * 1000) / 1000;

  // Mirror the cart on the customer-facing display.
  useEffect(() => {
    pushDisplay({ shopName: activeCompanyName(), lines: cart.map((l) => ({ name: l.modifiersLabel ? `${l.name} (${l.modifiersLabel})` : l.name, quantity: l.quantity, unitPrice: l.unitPrice, lineTotal: l.unitPrice * l.quantity - lineDisc(l) })), subtotal: t.subtotal, discount: t.discount, tax: t.tax, total: grand, completed: null });
  }, [cart, grand, t.subtotal, t.discount, t.tax]);

  function reset() {
    setCart([]); setCartDiscount(null); setCustomerId(""); setCoupon(""); setPoints(""); setTabId(null); setService(""); setTip(""); setGuests(""); setStaffId(""); setOrderType("COUNTER");
  }

  function charge(payments: PaymentInput[]) {
    try {
      const sale = completeSale({
        terminalId: String(shift.terminalId), shiftId: shift.id, cashierName: String(shift.openedBy ?? ""), customerId: customerId || undefined,
        lines: cart.map((l) => ({ productId: l.productId || undefined, description: l.modifiersLabel ? `${l.name} (${l.modifiersLabel})` : l.name, quantity: l.quantity, unitPrice: l.unitPrice, taxRate: l.taxRate, discountAmount: l.discountAmount, discountPercent: l.discountPercent, discountReason: l.discountReason, serials: l.serials })),
        payments, cartDiscount, promotions, couponCode: coupon.trim() || undefined, loyaltyRedeemPoints: num(points) || undefined, serviceCharge: serviceAmt, tip: tipAmt, orderType, guestCount: guests ? parseInt(guests) : undefined, staffId: staffId || undefined,
      });
      if (tabId) closeTab(tabId, sale.id);
      reset();
      pushDisplay({ shopName: activeCompanyName(), lines: [], subtotal: 0, discount: 0, tax: 0, total: 0, completed: { saleNumber: String(sale.saleNumber), change: num(sale.changeGiven), paidTotal: num(sale.amountPaid) } });
      setDialog({ kind: "done", sale });
      printReceipt(sale);
    } catch (e) {
      say(`Checkout failed — ${(e as Error).message}`, true);
    }
  }

  const snapshot = () => ({ cart, customerId, cartDiscount });
  function hold() {
    createRecord("pos-held", { terminalId: shift.terminalId, label: customers.find((c) => c.id === customerId)?.name || `${cart.length} item${cart.length > 1 ? "s" : ""}`, payload: snapshot() });
    setCart([]); setCartDiscount(null); setCustomerId(""); say("Cart held");
  }
  function resume(h: Rec) {
    const p = (h.payload as Rec) ?? {};
    setCart((p.cart as Line[]) ?? []); setCustomerId(String(p.customerId ?? "")); setCartDiscount((p.cartDiscount as CartDiscount) ?? null);
    deleteRecord("pos-held", h.id); setDialog(null);
  }
  function kitchen() {
    const tab = tabs.find((x) => x.id === tabId);
    const label = String(tab?.tableLabel || tab?.label || ORDER_TYPES.find(([k]) => k === orderType)![1]);
    const k = sendToKitchen({ lines: cart.filter((l) => l.productId).map((l) => ({ productId: l.productId, description: l.name, quantity: l.quantity, modifiers: [l.modifiersLabel, l.note].filter(Boolean).join(" · ") || undefined })), tabId: tabId ?? undefined, sourceLabel: label, orderType });
    say(`Sent to kitchen — ticket #${k.ticketNumber}`);
  }
  const lineBeingEdited = dialog?.kind === "line" ? cart.find((l) => l.lineId === dialog.id) : undefined;

  return (
    <div className="space-y-3">
      <ScanBar onScan={scan} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <Card className="flex min-h-[70vh] flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight"><Store className="size-4" /> Catalog</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Terminal {String(terminal?.name ?? "—")} · Shift {String(shift.shiftNumber)}</span>
              <button type="button" className={linkBtn} onClick={() => setDialog({ kind: "cash" })}>Cash in/out</button>
              <button type="button" className={linkBtn} onClick={() => window.open("/pos/customer-display", "pos-display", "width=900,height=700")}>Customer display</button>
            </div>
          </div>
          <Catalog onAdd={pick} warehouseId={warehouseId} quickKeys={(terminal?.quickKeys as string[]) ?? []} />
        </Card>

        <Card className="flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 p-4 pb-2">
            <h2 className="flex items-center gap-2 font-semibold tracking-tight"><ShoppingCart className="size-4" /> Cart</h2>
            <div className="flex flex-wrap gap-1.5">
              <button type="button" className={linkBtn} onClick={() => setDialog({ kind: "tabs" })}>{tabId ? "Tab ✓" : `Tabs (${tabs.length})`}</button>
              {tabId && cart.length > 0 && <button type="button" className={linkBtn} onClick={() => { updateRecord("pos-tabs", tabId, { payload: snapshot() }); say("Tab saved"); }}>Save tab</button>}
              <button type="button" className={linkBtn} disabled={!held.length} onClick={() => setDialog({ kind: "held" })}>Held ({held.length})</button>
              {cart.length > 0 && <button type="button" className={linkBtn} onClick={hold}>Hold</button>}
              {cart.length > 0 && <button type="button" className={linkBtn} onClick={kitchen}>Send to kitchen</button>}
              {cart.length > 0 && <button type="button" className={linkBtn} onClick={() => { setCart([]); setCartDiscount(null); setCustomerId(""); setCoupon(""); setPoints(""); setTabId(null); }}>Clear</button>}
            </div>
          </div>
          <div className="px-4 pb-2">
            <RecordPicker size="sm" ariaLabel="Customer" items={customers} value={customerId} onChange={setCustomerId} placeholder="Walk-in customer" getLabel={(c) => String(c.name)} getSub={(c) => [c.phone, num(c.storeCredit) ? `credit ${money(num(c.storeCredit))}` : "", num(c.loyaltyPoints) ? `${num(c.loyaltyPoints)} pts` : ""].filter(Boolean).join(" · ")} emptyText="No customers yet — add one under Sales › Customers." />
            {customerId && <button type="button" onClick={() => setCustomerId("")} className="mt-1 text-xs text-muted-foreground underline">Walk-in instead</button>}
          </div>
          <div className="min-h-40 flex-1 space-y-2 overflow-y-auto px-4">
            {cart.length === 0 ? <div className="py-10 text-center text-sm text-muted-foreground">Tap a product to add it.</div> : cart.map((l) => (
              <div key={l.lineId} className="flex items-start gap-2 border-b border-border pb-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{l.name}</div>
                  {l.modifiersLabel && <div className="text-xs text-muted-foreground">{l.modifiersLabel}</div>}
                  <div className="text-xs text-muted-foreground">{money(l.unitPrice)} each{l.priceOverridden && !l.modifiersLabel ? " (override)" : ""}</div>
                  {typeof l.stockAvailable === "number" && (l.quantity > l.stockAvailable ? <div className="text-xs font-medium text-destructive">Only {l.stockAvailable} in stock — overselling</div> : <div className="text-xs text-muted-foreground">{l.stockAvailable} in stock</div>)}
                  {lineDisc(l) > 0 && <div className="text-xs text-success">−{money(lineDisc(l))}{l.discountReason ? ` · ${l.discountReason}` : ""}</div>}
                  {l.serials?.length ? <div className="text-xs text-muted-foreground">S/N: {l.serials.join(", ")}</div> : null}
                  {l.note && <div className="text-xs italic text-muted-foreground">“{l.note}”</div>}
                </div>
                <div className="flex items-center gap-1">
                  <button type="button" aria-label="Decrease" className={cn(btn.outline, "size-7 p-0")} onClick={() => setCart((c) => c.map((x) => (x.lineId === l.lineId ? { ...x, quantity: x.quantity - 1 } : x)).filter((x) => x.quantity > 0))}><Minus /></button>
                  <button type="button" title="Set quantity / note" onClick={() => setDialog({ kind: "line", id: l.lineId })} className="min-w-8 rounded px-1 text-sm font-semibold tabular-nums hover:bg-accent">{l.quantity}</button>
                  <button type="button" aria-label="Increase" className={cn(btn.outline, "size-7 p-0")} onClick={() => setCart((c) => c.map((x) => (x.lineId === l.lineId ? { ...x, quantity: x.quantity + 1 } : x)))}><Plus /></button>
                </div>
                <div className="w-20 text-right text-sm font-medium tabular-nums">{money(l.unitPrice * l.quantity)}</div>
                <button type="button" aria-label="Remove" className={cn(btn.icon, "size-7")} onClick={() => setCart((c) => c.filter((x) => x.lineId !== l.lineId))}><Trash2 className="text-muted-foreground" /></button>
              </div>
            ))}
          </div>
          <div className="space-y-2 border-t border-border p-4">
            {t.discount > 0 && (
              <div className="space-y-1 text-sm">
                <Row label="Items" value={money(t.gross)} muted />
                {t.lineD > 0 && <Row label="Line discounts" value={`−${money(t.lineD)}`} good />}
                {t.cartD > 0 && <Row label={`Cart discount${cartDiscount?.reason ? ` · ${cartDiscount.reason}` : ""}`} value={`−${money(t.cartD)}`} good />}
                {t.promoD > 0 && <Row label={`Promo${promotions.length === 1 ? ` · ${promotions[0].name}` : promotions.length > 1 ? ` · ${promotions.length} offers` : ""}`} value={`−${money(t.promoD)}`} good />}
                {t.loyaltyD > 0 && <Row label="Points redeemed" value={`−${money(t.loyaltyD)}`} good />}
              </div>
            )}
            {cart.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button type="button" className={linkBtn} onClick={() => setDialog({ kind: "discount" })}>{cartDiscount ? "Edit cart discount" : "Add cart discount"}</button>
                <input value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Coupon code" aria-label="Coupon code" className={cn(inputCls, "h-7 w-32 text-xs")} />
                {ptsAvail > 0 && <input type="number" min={0} max={ptsAvail} value={points} onChange={(e) => setPoints(e.target.value)} placeholder={`Redeem points (${ptsAvail} avail)`} className={cn(inputCls, "h-7 w-44 text-xs")} />}
              </div>
            )}
            <div className="space-y-2">
              <div className="flex gap-1">{ORDER_TYPES.map(([k, lab]) => <button key={k} type="button" onClick={() => setOrderType(k)} className={cn("flex-1 rounded px-1 py-1 text-xs", orderType === k ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")}>{lab}</button>)}</div>
              <div className="grid grid-cols-2 gap-2">
                {orderType === "DINE_IN" && <input type="number" value={guests} onChange={(e) => setGuests(e.target.value)} placeholder="Guests" className={cn(inputCls, "h-8")} />}
                <Select value={staffId} onChange={setStaffId} ariaLabel="Staff" placeholder="Staff / server…" size="sm" className={orderType === "DINE_IN" ? "" : "col-span-2"} options={employees.map((e) => ({ value: e.id, label: String(e.fullName ?? ([e.firstName, e.lastName].filter(Boolean).join(" ") || e.employeeNumber || "—")) }))} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={service} onChange={(e) => setService(e.target.value)} placeholder="Service charge" className={cn(inputCls, "h-8")} />
                <input type="number" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="Tip" className={cn(inputCls, "h-8")} />
              </div>
            </div>
            <Row label="Subtotal" value={money(t.subtotal)} muted />
            <Row label="Tax" value={money(t.tax)} muted />
            {serviceAmt > 0 && <Row label="Service charge" value={money(serviceAmt)} muted />}
            {tipAmt > 0 && <Row label="Tip" value={money(tipAmt)} muted />}
            <div className="flex justify-between text-lg font-bold"><span>Total</span><span className="tabular-nums">{money(grand)}</span></div>
            <button type="button" disabled={cart.length === 0} onClick={() => setDialog({ kind: "pay" })} className={cn(btn.primary, "h-12 w-full text-base")}>Pay {money(grand)}</button>
          </div>
        </Card>
      </div>

      {toast && <div role="status" className={cn("fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg", toast.bad ? "border-destructive/30 bg-destructive text-white" : "border-border bg-card")}>{toast.text}</div>}

      {lineBeingEdited && <LineDialog line={lineBeingEdited} reasons={reasons} onClose={() => setDialog(null)} onSave={(patch) => { setCart((c) => c.map((x) => (x.lineId === lineBeingEdited.lineId ? { ...x, ...patch } : x))); setDialog(null); }} />}
      {dialog?.kind === "pay" && <PayDialog total={grand} storeCreditMax={credit} allowed={(terminal?.paymentMethods as string[]) ?? null} onClose={() => setDialog(null)} onConfirm={charge} />}
      {dialog?.kind === "cash" && <CashDialog shiftId={shift.id} onClose={() => setDialog(null)} onDone={(m) => { setDialog(null); say(m); }} />}
      {dialog?.kind === "discount" && <CartDiscountDialog current={cartDiscount} reasons={reasons} onClose={() => setDialog(null)} onSave={(d) => { setCartDiscount(d); setDialog(null); }} />}
      {dialog?.kind === "age" && (
        <Dialog open onClose={() => setDialog(null)} title="Age-restricted item">
          <p className="text-sm"><span className="font-medium">{String(dialog.product.name)}</span> is age-restricted{dialog.product.minAge ? ` (${dialog.product.minAge}+)` : ""}. Confirm the customer meets the minimum age.</p>
          <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setDialog(null)}>Cancel</button><button type="button" className={btn.primary} onClick={() => { const p = dialog.product; setDialog(null); addWithMods(p); }}>Verified — add</button></div>
        </Dialog>
      )}
      {dialog?.kind === "serial" && <SerialDialog product={dialog.product} onClose={() => setDialog(null)} onConfirm={(s) => { add(dialog.product, { serials: s, quantity: s.length }); setDialog(null); }} />}
      {dialog?.kind === "weight" && <WeightDialog product={dialog.product} onClose={() => setDialog(null)} onConfirm={(w) => { add(dialog.product, { quantity: w }); setDialog(null); }} />}
      {dialog?.kind === "mods" && <ModsDialog product={dialog.product} groups={dialog.groups} onClose={() => setDialog(null)} onConfirm={(m) => { add(dialog.product, { mods: m }); setDialog(null); }} />}
      {dialog?.kind === "held" && (
        <Dialog open onClose={() => setDialog(null)} title="Held carts">
          <div className="max-h-80 space-y-2 overflow-y-auto">{held.length === 0 ? <div className="text-sm text-muted-foreground">No held carts.</div> : held.map((h) => (
            <button key={h.id} type="button" onClick={() => resume(h)} className="flex w-full items-center justify-between rounded-md border border-border p-2 text-left hover:bg-accent"><span className="text-sm font-medium">{String(h.label || "Held cart")}</span><span className="text-xs text-muted-foreground">{new Date(String(h.createdAt)).toLocaleTimeString()}</span></button>
          ))}</div>
        </Dialog>
      )}
      {dialog?.kind === "tabs" && (
        <TabsDialog tabs={tabs} activeTabId={tabId} onClose={() => setDialog(null)}
          onLoad={(tab) => { const p = (tab.payload as Rec) ?? {}; setCart((p.cart as Line[]) ?? []); setCustomerId(String(p.customerId ?? "")); setCartDiscount((p.cartDiscount as CartDiscount) ?? null); setTabId(tab.id); setDialog(null); }}
          onOpen={(label, table) => { const tab = createRecord("pos-tabs", { label: label || undefined, tableLabel: table || undefined, payload: snapshot(), terminalId: shift.terminalId, status: "OPEN" }); setTabId(tab.id); setDialog(null); say("Tab opened"); }} />
      )}
      {dialog?.kind === "done" && (
        <Dialog open onClose={() => setDialog(null)} title={`Sale ${dialog.sale.saleNumber}`} className="max-w-sm">
          <div className="space-y-3 text-center">
            {dialog.sale.tokenNumber != null && <div><div className="text-xs uppercase text-muted-foreground">Order token</div><div className="text-4xl font-bold">#{String(dialog.sale.tokenNumber)}</div></div>}
            {num(dialog.sale.changeGiven) > 0 && <div className="text-lg">Change due <span className="font-bold">{money(num(dialog.sale.changeGiven))}</span></div>}
            <button type="button" className={cn(btn.primary, "w-full")} onClick={() => printReceipt(dialog.sale)}>Print receipt</button>
            <button type="button" className={cn(btn.outline, "w-full")} onClick={() => setDialog(null)}>New sale</button>
            <button type="button" className="text-xs text-muted-foreground underline" onClick={() => router.push(`/pos/sales/${dialog.sale.id}`)}>Open sale</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

const Row = ({ label, value, muted, good }: { label: string; value: string; muted?: boolean; good?: boolean }) => (
  <div className={cn("flex justify-between text-sm", muted && "text-muted-foreground", good && "text-success")}><span>{label}</span><span className="tabular-nums">{value}</span></div>
);

function ScanBar({ onScan }: { onScan: (code: string) => void }) {
  const [v, setV] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <ScanBarcode className="size-4 text-muted-foreground" />
      <input ref={ref} value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onScan(v); setV(""); ref.current?.focus(); } }} placeholder="Scan barcode or type SKU, then Enter" aria-label="Scan barcode" autoComplete="off" className="h-8 w-full bg-transparent text-sm outline-none" />
    </div>
  );
}

function Catalog({ onAdd, warehouseId, quickKeys }: { onAdd: (p: Rec) => void; warehouseId: string; quickKeys: string[] }) {
  const products = useCollection("products");
  const categories = useCollection("product-categories");
  useCollection("stock-moves");
  const [cat, setCat] = useState("");
  const [q, setQ] = useState("");
  const active = products.filter((p) => (p.status ?? "ACTIVE") === "ACTIVE" && p.sellable !== false);
  const shown = active.filter((p) => (!cat || p.categoryId === cat) && (!q || `${p.name} ${p.sku} ${p.barcode ?? ""}`.toLowerCase().includes(q.toLowerCase())));
  const stock = stockFor(shown.map((p) => p.id), warehouseId);
  const inStock = shown.filter((p) => (stock[p.id] ?? 1) > 0);
  const favs = inStock.filter((p) => p.favorite === true);
  const keys = quickKeys.map((id) => active.find((p) => p.id === id)).filter(Boolean) as Rec[];
  const keyStock = stockFor(keys.map((p) => p.id), warehouseId);
  const tile = (p: Rec, fav: boolean, key: string, s?: number) => (
    <button key={key} type="button" onClick={() => onAdd(p)} className="flex flex-col justify-between rounded-lg border border-border bg-background p-3 text-left transition-colors hover:border-primary hover:bg-accent">
      <div className="flex items-start justify-between gap-1"><span className="line-clamp-2 text-sm font-medium">{String(p.name)}</span>{fav && <Star className="size-3.5 shrink-0 fill-warning text-warning" />}</div>
      <div className="mt-2 flex items-end justify-between gap-1"><span className="truncate text-xs text-muted-foreground">{typeof s === "number" ? `${s} in stock` : String(p.sku ?? "")}</span><span className="text-sm font-semibold tabular-nums">{money(num(p.retail))}</span></div>
    </button>
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 p-4 pt-1">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products by name or SKU" aria-label="Search products" className={inputCls} />
      {keys.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground"><Star className="size-3" /> Quick keys</div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">{keys.map((p) => tile(p, true, `qk-${p.id}`, keyStock[p.id]))}</div>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button type="button" className={chip(cat === "")} onClick={() => setCat("")}>All</button>
        {categories.filter((c) => c.isActive !== false).map((c) => <button key={c.id} type="button" className={chip(cat === c.id)} onClick={() => setCat(c.id)}>{String(c.name)}</button>)}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {inStock.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">{shown.length > 0 ? "Nothing in stock at this branch." : "No products found."}</div> : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {favs.map((p) => tile(p, true, `fav-${p.id}`, stock[p.id]))}
            {inStock.map((p) => tile(p, false, p.id, stock[p.id]))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- dialogs ---------- */

function quickAmounts(total: number) {
  const s = new Set([Math.ceil(total * 100) / 100]);
  for (const d of [1, 5, 10, 20, 50, 100, 200, 500]) s.add(Math.ceil(total / d) * d);
  return [...s].filter((v) => v >= total).sort((a, b) => a - b).slice(0, 5);
}

function PayDialog({ total, storeCreditMax, allowed, onClose, onConfirm }: { total: number; storeCreditMax: number; allowed: string[] | null; onClose: () => void; onConfirm: (p: PaymentInput[]) => void }) {
  const methods = allowed ? PAY_METHODS.filter((m) => allowed.includes(m.value)) : PAY_METHODS;
  const options = storeCreditMax > 0 ? [...methods, { value: "STORE_CREDIT", label: `Store credit (${storeCreditMax})` }] : methods;
  const [rows, setRows] = useState([{ method: methods[0]?.value ?? "CASH", amount: total.toFixed(2), reference: "" }]);
  const tendered = rows.reduce((a, r) => a + num(r.amount), 0);
  const sc = rows.filter((r) => r.method === "STORE_CREDIT").reduce((a, r) => a + num(r.amount), 0);
  const remaining = Math.max(0, total - tendered), change = Math.max(0, tendered - total);
  const scOver = sc > storeCreditMax + 1e-4;
  const ok = tendered >= total - 1e-4 && total > 0 && !scOver;
  const set = (i: number, p: Partial<(typeof rows)[number]>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return (
    <Dialog open onClose={onClose} title="Take payment" className="max-w-md">
      <div className="space-y-4">
        <div className="flex items-baseline justify-between"><span className="text-sm text-muted-foreground">Total due</span><span className="text-2xl font-bold tabular-nums">{money(total)}</span></div>
        <div className="flex flex-wrap gap-2">{quickAmounts(total).map((v) => <button key={v} type="button" className={btn.smOutline} onClick={() => setRows([{ method: "CASH", amount: v.toFixed(2), reference: "" }])}>{money(v)}</button>)}</div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-2">
              <Select value={r.method} onChange={(v) => set(i, { method: v })} options={options} className="w-40" ariaLabel="Payment method" />
              <input type="number" step="0.001" min={0} value={r.amount} onChange={(e) => set(i, { amount: e.target.value })} aria-label="Amount" className={cn(inputCls, "flex-1")} />
              {r.method === "GIFT_CARD" && <input value={r.reference} onChange={(e) => set(i, { reference: e.target.value })} placeholder="Card code" className={cn(inputCls, "w-28")} />}
              {rows.length > 1 && <button type="button" aria-label="Remove payment" className={btn.icon} onClick={() => setRows((x) => x.filter((_, j) => j !== i))}><Trash2 /></button>}
            </div>
          ))}
          <button type="button" className={btn.smOutline} onClick={() => setRows((x) => [...x, { method: "CREDIT_CARD", amount: remaining.toFixed(2), reference: "" }])}><Plus /> Split payment</button>
        </div>
        <div className="space-y-1 rounded-md bg-muted p-3 text-sm">
          <div className="flex justify-between"><span>Tendered</span><span className="tabular-nums">{money(tendered)}</span></div>
          {remaining > 0 ? <div className="flex justify-between text-destructive"><span>Remaining</span><span className="tabular-nums">{money(remaining)}</span></div> : <div className="flex justify-between font-semibold"><span>Change due</span><span className="tabular-nums">{money(change)}</span></div>}
        </div>
        {scOver && <p className="text-sm text-destructive">Store credit exceeds the available balance ({storeCreditMax}).</p>}
        <button type="button" disabled={!ok} onClick={() => onConfirm(rows.filter((r) => num(r.amount) > 0).map((r) => ({ method: r.method, amount: num(r.amount), reference: r.reference || undefined })))} className={cn(btn.primary, "h-11 w-full")}>Charge {money(total)}</button>
      </div>
    </Dialog>
  );
}

function LineDialog({ line, reasons, onClose, onSave }: { line: Line; reasons: Rec[]; onClose: () => void; onSave: (p: Partial<Line>) => void }) {
  const [qty, setQty] = useState(String(line.quantity));
  const [note, setNote] = useState(line.note ?? "");
  const [price, setPrice] = useState(String(line.unitPrice));
  const [mode, setMode] = useState<"pct" | "amt">(line.discountAmount ? "amt" : "pct");
  const [disc, setDisc] = useState(line.discountAmount ? String(line.discountAmount) : line.discountPercent ? String(line.discountPercent) : "");
  const [reason, setReason] = useState(line.discountReason ?? "");
  const [unlocked, setUnlocked] = useState(false);
  const [asking, setAsking] = useState(false);
  const q = parseFloat(qty), p = parseFloat(price), d = num(disc);
  const overridden = p !== line.unitPrice, discounted = d > 0, needsReason = overridden || discounted;
  const ok = q > 0 && p >= 0 && (mode !== "pct" || d <= 100) && (!needsReason || reason.trim().length > 0);
  return (
    <Dialog open onClose={onClose} title={line.name} className="max-w-md">
      <div className="space-y-4">
        <div>
          <Label>Quantity</Label>
          <div className="my-2 rounded-md border border-border bg-muted px-3 py-2 text-right text-2xl font-semibold tabular-nums">{qty || "0"}</div>
          <Keypad value={qty} onChange={setQty} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Label>Unit price {unlocked ? "(override)" : ""}</Label>{!unlocked && <button type="button" className="text-xs text-primary underline" onClick={() => setAsking(true)}>Manager override</button>}</div>
          <input type="number" step="0.001" min={0} value={price} disabled={!unlocked} onChange={(e) => setPrice(e.target.value)} aria-label="Unit price" className={inputCls} />
        </div>
        {asking && <ApprovalDialog title="Price override" onClose={() => setAsking(false)} onApproved={() => { setUnlocked(true); setAsking(false); }} />}
        <div className="space-y-1.5">
          <Label>Discount</Label>
          <div className="flex gap-2">
            <div className="flex overflow-hidden rounded-md border border-input text-sm">
              <button type="button" className={mode === "pct" ? "bg-primary px-3 text-primary-foreground" : "px-3"} onClick={() => setMode("pct")}>%</button>
              <button type="button" className={mode === "amt" ? "bg-primary px-3 text-primary-foreground" : "px-3"} onClick={() => setMode("amt")}>amt</button>
            </div>
            <input type="number" step="0.001" min={0} value={disc} onChange={(e) => setDisc(e.target.value)} placeholder={mode === "pct" ? "0 %" : "0.00"} aria-label="Discount" className={inputCls} />
          </div>
        </div>
        {needsReason && <div className="space-y-1.5"><Label>Reason *</Label><Select value={reason} onChange={setReason} placeholder="Select a reason" options={reasons.map((r) => ({ value: String(r.name), label: String(r.name) }))} /></div>}
        <div className="space-y-1.5"><Label htmlFor="ln-note">Note (optional)</Label><input id="ln-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. no ice, gift wrap" className={inputCls} /></div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className={btn.outline} onClick={onClose}>Cancel</button>
        <button type="button" className={btn.primary} disabled={!ok} onClick={() => onSave({ quantity: q, note: note.trim() || undefined, unitPrice: p, priceOverridden: overridden || line.priceOverridden, discountPercent: mode === "pct" && discounted ? d : undefined, discountAmount: mode === "amt" && discounted ? d : undefined, discountReason: needsReason ? reason.trim() : undefined })}>Save</button>
      </div>
    </Dialog>
  );
}

function CartDiscountDialog({ current, reasons, onClose, onSave }: { current: CartDiscount; reasons: Rec[]; onClose: () => void; onSave: (d: CartDiscount) => void }) {
  const [type, setType] = useState<"PERCENT" | "AMOUNT">(current?.type ?? "PERCENT");
  const [value, setValue] = useState(current ? String(current.value) : "");
  const [reason, setReason] = useState(current?.reason ?? "");
  const v = num(value);
  const ok = v > 0 && (type !== "PERCENT" || v <= 100) && reason.trim().length > 0;
  return (
    <Dialog open onClose={onClose} title="Cart discount" className="max-w-sm">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex overflow-hidden rounded-md border border-input text-sm">
            <button type="button" className={type === "PERCENT" ? "bg-primary px-3 text-primary-foreground" : "px-3"} onClick={() => setType("PERCENT")}>%</button>
            <button type="button" className={type === "AMOUNT" ? "bg-primary px-3 text-primary-foreground" : "px-3"} onClick={() => setType("AMOUNT")}>amt</button>
          </div>
          <input type="number" step="0.001" min={0} value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === "PERCENT" ? "0 %" : "0.00"} aria-label="Discount value" className={inputCls} />
        </div>
        <div className="space-y-1.5"><Label>Reason *</Label><Select value={reason} onChange={setReason} placeholder="Select a reason" options={reasons.map((r) => ({ value: String(r.name), label: String(r.name) }))} /></div>
      </div>
      <div className="flex justify-end gap-2">
        {current && <button type="button" className={btn.outline} onClick={() => onSave(null)}>Remove</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Cancel</button>
        <button type="button" className={btn.primary} disabled={!ok} onClick={() => onSave({ type, value: v, reason: reason.trim() })}>Apply</button>
      </div>
    </Dialog>
  );
}

function CashDialog({ shiftId, onClose, onDone }: { shiftId: string; onClose: () => void; onDone: (msg: string) => void }) {
  const accounts = useAccounts();
  const [type, setType] = useState<"CASH_OUT" | "CASH_IN">("CASH_OUT");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [offset, setOffset] = useState("");
  const ok = num(amount) > 0 && reason.trim().length > 0;
  return (
    <Dialog open onClose={onClose} title="Cash movement" className="max-w-sm">
      <div className="space-y-4">
        <div className="flex overflow-hidden rounded-md border border-input">
          <button type="button" className={cn("flex-1 py-2 text-sm", type === "CASH_OUT" && "bg-primary text-primary-foreground")} onClick={() => setType("CASH_OUT")}>Cash out</button>
          <button type="button" className={cn("flex-1 py-2 text-sm", type === "CASH_IN" && "bg-primary text-primary-foreground")} onClick={() => setType("CASH_IN")}>Cash in</button>
        </div>
        <div className="space-y-1.5"><Label htmlFor="cm-amt">Amount</Label><input id="cm-amt" type="number" step="0.001" min={0} autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></div>
        <div className="space-y-1.5"><Label htmlFor="cm-reason">Reason</Label><input id="cm-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. petty cash, float top-up" className={inputCls} /></div>
        <div className="space-y-1.5"><Label className="text-xs">Offset account (optional — posts to GL)</Label><AccountPicker accounts={accounts} value={offset} onChange={setOffset} placeholder="No GL posting" /></div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className={btn.outline} onClick={onClose}>Cancel</button>
        <button type="button" className={btn.primary} disabled={!ok} onClick={() => { cashMovement({ shiftId, movementType: type, amount: num(amount), reason: reason.trim(), offsetAccountId: offset || undefined }); onDone(type === "CASH_IN" ? "Cash in recorded" : "Cash out recorded"); }}>Record</button>
      </div>
    </Dialog>
  );
}

function SerialDialog({ product, onClose, onConfirm }: { product: Rec; onClose: () => void; onConfirm: (s: string[]) => void }) {
  const [v, setV] = useState("");
  const list = v.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  return (
    <Dialog open onClose={onClose} title={String(product.name)} className="max-w-sm">
      <div className="space-y-1.5"><Label htmlFor="sn" className="text-xs">Serial / batch / lot (one per line or comma-separated)</Label><input id="sn" autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder="e.g. SN-00123" className={inputCls} /></div>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={!list.length} onClick={() => onConfirm(list)}>Add</button></div>
    </Dialog>
  );
}

function WeightDialog({ product, onClose, onConfirm }: { product: Rec; onClose: () => void; onConfirm: (w: number) => void }) {
  const [v, setV] = useState("");
  const unit = String(product.weightUnit || "kg");
  return (
    <Dialog open onClose={onClose} title={String(product.name)} className="max-w-sm">
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground">{money(num(product.retail))} / {unit}</div>
        <div className="flex items-baseline justify-end gap-1 rounded-md border border-border bg-muted px-3 py-2"><span className="text-2xl font-semibold tabular-nums">{v || "0"}</span><span className="text-sm text-muted-foreground">{unit}</span></div>
        <Keypad value={v} onChange={setV} />
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Line total</span><span className="font-semibold tabular-nums">{money(num(product.retail) * num(v))}</span></div>
      </div>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={num(v) <= 0} onClick={() => onConfirm(num(v))}>Add</button></div>
    </Dialog>
  );
}

function ModsDialog({ product, groups, onClose, onConfirm }: { product: Rec; groups: Rec[]; onClose: () => void; onConfirm: (m: { name: string; priceDelta: number }[]) => void }) {
  const [sel, setSel] = useState<Record<string, string[]>>({});
  const toggle = (g: Rec, id: string) => setSel((s) => {
    const cur = s[g.id] ?? [];
    if (cur.includes(id)) return { ...s, [g.id]: cur.filter((x) => x !== id) };
    const max = num(g.maxSelect);
    if (max === 1) return { ...s, [g.id]: [id] };
    if (max > 0 && cur.length >= max) return s;
    return { ...s, [g.id]: [...cur, id] };
  });
  const chosen = groups.flatMap((g) => ((g.modifiers as Rec[]) ?? []).filter((m) => (sel[g.id] ?? []).includes(m.id)).map((m) => ({ name: String(m.name), priceDelta: num(m.priceDelta) })));
  const delta = chosen.reduce((a, m) => a + m.priceDelta, 0);
  const short = groups.some((g) => (sel[g.id]?.length ?? 0) < num(g.minSelect));
  return (
    <Dialog open onClose={onClose} title={String(product.name)}>
      <div className="max-h-[60vh] space-y-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.id} className="space-y-2">
            <Label>{String(g.name)}{num(g.minSelect) > 0 ? ` · choose ${g.minSelect}${num(g.maxSelect) && g.maxSelect !== g.minSelect ? `–${g.maxSelect}` : ""}` : num(g.maxSelect) === 1 ? " · pick one" : ""}</Label>
            <div className="flex flex-wrap gap-2">{((g.modifiers as Rec[]) ?? []).map((m) => <button key={m.id} type="button" onClick={() => toggle(g, m.id)} className={chip((sel[g.id] ?? []).includes(m.id))}>{String(m.name)}{num(m.priceDelta) ? ` ${num(m.priceDelta) > 0 ? "+" : ""}${money(num(m.priceDelta))}` : ""}</button>)}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} disabled={short} onClick={() => onConfirm(chosen)}>Add{delta ? ` (${delta > 0 ? "+" : ""}${money(delta)})` : ""}</button></div>
    </Dialog>
  );
}

function TabsDialog({ tabs, activeTabId, onClose, onOpen, onLoad }: { tabs: Rec[]; activeTabId: string | null; onClose: () => void; onOpen: (label: string, table: string) => void; onLoad: (t: Rec) => void }) {
  const [label, setLabel] = useState("");
  const [table, setTable] = useState("");
  return (
    <Dialog open onClose={onClose} title="Tabs">
      <div className="space-y-4">
        <div className="max-h-60 space-y-2 overflow-y-auto">{tabs.length === 0 ? <div className="text-sm text-muted-foreground">No open tabs.</div> : tabs.map((t) => (
          <button key={t.id} type="button" onClick={() => onLoad(t)} className={cn("flex w-full items-center justify-between rounded-md border p-2 text-start hover:bg-accent", t.id === activeTabId ? "border-primary" : "border-border")}><span className="text-sm font-medium">{String(t.label || "Tab")}</span><span className="text-xs text-muted-foreground">{String(t.tableLabel || "")}</span></button>
        ))}</div>
        <div className="space-y-2 border-t border-border pt-3">
          <Label>Open a new tab</Label>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Name (e.g. John / Tab 4)" className={inputCls} />
          <input value={table} onChange={(e) => setTable(e.target.value)} placeholder="Table (optional)" className={inputCls} />
          <button type="button" className={btn.primary} onClick={() => onOpen(label, table)}>Open tab with current cart</button>
        </div>
      </div>
    </Dialog>
  );
}
