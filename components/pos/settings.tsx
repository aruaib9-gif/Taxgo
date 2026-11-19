"use client";

// POS settings pages linked from Terminals: pricing rules, product flags, labels, terminal profile,
// supervisor PIN, audit log, receipt branding, the customer display and no-receipt returns.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, CheckCircle2, Loader2, Plus, Printer, ShieldCheck, ShoppingBag, Star, Trash2 } from "lucide-react";
import { createRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { useAccounts } from "@/lib/ledger";
import { DISPLAY_STORAGE_KEY, LOYALTY_DEFAULT, PAY_METHODS, RECEIPT_DEFAULT, audit, blindReturn, getSetting, giftCard, issueGiftCard, openShiftOf, readDisplay, saveSetting, type DisplayState } from "@/lib/pos";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { AccountPicker, Card, CardTitle, Label, PageHeader, Switch, btn, inputCls, money, num, textareaCls } from "@/components/accounting/kit";
import { Select } from "@/components/accounting/pickers";
import { RecordPicker } from "@/components/sales/doc-kit";
import { ProductPicker } from "@/components/purchasing/kit";
import { ApprovalDialog, ReceiptView, type ReceiptData } from "@/components/pos/kit";

const Box = ({ title, children, className }: { title: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <Card className={className}><div className="p-5 pb-3"><CardTitle className="text-base">{title}</CardTitle></div><div className="space-y-3 p-5 pt-0">{children}</div></Card>
);
function useFlash() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const flash = (text: string, bad = false) => { setMsg({ text, bad }); setTimeout(() => setMsg(null), 3000); };
  const node = msg && <div role="status" className={cn("fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg", msg.bad ? "border-destructive/30 bg-destructive text-white" : "border-border bg-card")}>{msg.text}</div>;
  return { flash, node };
}
const productName = (id: unknown) => readCollection("products").find((p) => p.id === id);

/* ---------- price lists ---------- */

export function PriceLists() {
  const lists = useCollection("price-lists");
  useCollection("products");
  const [sel, setSel] = useState("");
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [pid, setPid] = useState("");
  const [price, setPrice] = useState("");
  const { flash, node } = useFlash();
  const list = lists.find((l) => l.id === sel);
  function create() {
    if (!name.trim()) return;
    if (isDefault) lists.filter((l) => l.isDefault).forEach((l) => updateRecord("price-lists", l.id, { isDefault: false }));
    const l = createRecord("price-lists", { name: name.trim(), isDefault, items: [] });
    setName(""); setIsDefault(false); setSel(l.id); flash("Price list created");
  }
  const setItem = (productId: string, value: number | null) => {
    const items = ((list!.items as Rec[]) ?? []).filter((i) => i.productId !== productId);
    updateRecord("price-lists", list!.id, { items: value == null ? items : [...items, { id: crypto.randomUUID(), productId, price: value }] });
  };
  return (
    <div className="space-y-4">
      <PageHeader title="Price Lists" subtitle="Customer and location price tiers applied at the register" />
      <div className="grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <Box title="Lists">
          <div className="space-y-1">
            {lists.map((l) => <button key={l.id} type="button" onClick={() => setSel(l.id)} className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent", sel === l.id && "bg-accent font-medium")}><span>{String(l.name)}</span>{Boolean(l.isDefault) && <Star className="size-3.5 fill-warning text-warning" />}</button>)}
            {lists.length === 0 && <p className="text-sm text-muted-foreground">No price lists yet.</p>}
          </div>
          <div className="space-y-2 border-t border-border pt-3">
            <Label className="text-xs">New list</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wholesale" className={inputCls} />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="size-4 rounded-full" /> Company default</label>
            <button type="button" className={btn.smPrimary} onClick={create}><Plus /> Create</button>
          </div>
        </Box>
        <Box title={list ? String(list.name) : "Select a list"}>
          {list ? (
            <>
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-56 flex-1 space-y-1"><Label className="text-xs">Product</Label><ProductPicker size="md" value={pid} onChange={(id) => setPid(id)} /></div>
                <div className="w-32 space-y-1"><Label className="text-xs">Price</Label><input type="number" step="0.001" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} /></div>
                <button type="button" className={btn.primary} disabled={!pid || !price} onClick={() => { setItem(pid, num(price)); setPid(""); setPrice(""); }}>Set</button>
              </div>
              <div className="divide-y divide-border">
                {((list.items as Rec[]) ?? []).map((i) => { const p = productName(i.productId); return (
                  <div key={String(i.id)} className="flex items-center justify-between py-2 text-sm"><span>{String(p?.name ?? "—")} <span className="text-muted-foreground">({String(p?.sku ?? "")})</span></span><div className="flex items-center gap-2"><span className="tabular-nums">{money(num(i.price))}</span><button type="button" aria-label="Remove price" className={btn.icon} onClick={() => setItem(String(i.productId), null)}><Trash2 /></button></div></div>
                ); })}
                {!((list.items as Rec[]) ?? []).length && <p className="text-sm text-muted-foreground">No product prices yet.</p>}
              </div>
              <label className="flex items-center gap-2 border-t border-border pt-3 text-sm"><Switch checked={Boolean(list.isDefault)} onChange={(v) => { if (v) lists.filter((l) => l.isDefault).forEach((l) => updateRecord("price-lists", l.id, { isDefault: false })); updateRecord("price-lists", list.id, { isDefault: v }); }} label="Company default" /> Company default</label>
            </>
          ) : <p className="text-sm text-muted-foreground">Pick a price list to edit its product prices.</p>}
        </Box>
      </div>
      {node}
    </div>
  );
}

/* ---------- promotions ---------- */

const PROMO_BLANK = { name: "", type: "PERCENT", value: "", minSubtotal: "", code: "", maxRedemptions: "" };

export function Promotions() {
  const promos = useCollection("promotions");
  const [f, setF] = useState(PROMO_BLANK);
  const [buy, setBuy] = useState("");
  const [get, setGet] = useState("");
  const [bogo, setBogo] = useState({ buyQty: "1", getQty: "1", getPct: "100" });
  const [hh, setHh] = useState<{ days: number[]; start: string; end: string }>({ days: [], start: "", end: "" });
  const { flash, node } = useFlash();
  function create() {
    if (!f.name.trim()) return flash("Name is required", true);
    if (f.type === "BOGO" && (!buy || !get)) return flash("Pick the buy and get products", true);
    if (f.type !== "BOGO" && !f.value) return flash("Value is required", true);
    createRecord("promotions", {
      name: f.name.trim(), type: f.type, value: num(f.value), minSubtotal: num(f.minSubtotal), code: f.code.trim() || undefined, maxRedemptions: f.maxRedemptions ? parseInt(f.maxRedemptions) : undefined,
      daysOfWeek: hh.days.length ? hh.days : undefined, startTime: hh.start || undefined, endTime: hh.end || undefined, isActive: true, redemptions: 0,
      ...(f.type === "BOGO" ? { buyProductId: buy, buyQuantity: num(bogo.buyQty) || 1, getProductId: get, getQuantity: num(bogo.getQty) || 1, getDiscountPercent: num(bogo.getPct) || 100 } : {}),
    });
    setF(PROMO_BLANK); setBuy(""); setGet(""); setBogo({ buyQty: "1", getQty: "1", getPct: "100" }); setHh({ days: [], start: "", end: "" }); flash("Promotion created");
  }
  const field = (k: keyof typeof f, label: string, type = "text", placeholder?: string) => (
    <div className="space-y-1.5"><Label htmlFor={`pr-${k}`}>{label}</Label><input id={`pr-${k}`} type={type} step={type === "number" ? "0.001" : undefined} value={f[k]} placeholder={placeholder} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls} /></div>
  );
  return (
    <div className="space-y-4">
      <PageHeader title="Promotions" subtitle="Order-level discounts auto-applied at the register" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Box title="Active promotions">
          {promos.length === 0 ? <p className="text-sm text-muted-foreground">No promotions yet.</p> : <div className="divide-y divide-border">{promos.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 py-2">
              <div><div className="text-sm font-medium">{String(p.name)}</div><div className="text-xs text-muted-foreground">{p.type === "PERCENT" ? `${p.value}% off` : p.type === "AMOUNT" ? `${money(num(p.value))} off` : "Buy X get Y"}{num(p.minSubtotal) > 0 ? ` over ${money(num(p.minSubtotal))}` : ""}{p.code ? ` · code ${p.code}` : " · auto"}{p.maxRedemptions ? ` · ${num(p.redemptions)}/${p.maxRedemptions} used` : ""}</div></div>
              <button type="button" onClick={() => updateRecord("promotions", p.id, { isActive: p.isActive === false })} className={cn("text-xs", p.isActive === false ? "text-muted-foreground" : "text-emerald-600")}>{p.isActive === false ? "Inactive" : "Active"}</button>
            </div>
          ))}</div>}
        </Box>
        <Box title="New promotion">
          {field("name", "Name", "text", "e.g. 10% off over 50")}
          <div className="space-y-1.5"><Label>Type</Label><Select value={f.type} onChange={(v) => setF({ ...f, type: v })} options={[{ value: "PERCENT", label: "Percent off order" }, { value: "AMOUNT", label: "Amount off order" }, { value: "BOGO", label: "Buy X get Y (BOGO)" }]} /></div>
          {f.type !== "BOGO" ? field("value", f.type === "PERCENT" ? "Percent" : "Amount", "number") : (
            <div className="space-y-2 rounded-md border border-border p-2">
              <div className="space-y-1"><Label className="text-xs">Buy product</Label><ProductPicker value={buy} onChange={(id) => setBuy(id)} /></div>
              <div className="space-y-1"><Label className="text-xs">Buy qty</Label><input type="number" min={1} value={bogo.buyQty} onChange={(e) => setBogo({ ...bogo, buyQty: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><Label className="text-xs">Get product</Label><ProductPicker value={get} onChange={(id) => setGet(id)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Get qty</Label><input type="number" min={1} value={bogo.getQty} onChange={(e) => setBogo({ ...bogo, getQty: e.target.value })} className={inputCls} /></div>
                <div className="space-y-1"><Label className="text-xs">Get % off</Label><input type="number" min={0} max={100} value={bogo.getPct} onChange={(e) => setBogo({ ...bogo, getPct: e.target.value })} className={inputCls} /></div>
              </div>
            </div>
          )}
          {field("minSubtotal", "Minimum subtotal (optional)", "number")}
          {field("code", "Coupon code (optional — blank = auto-apply)")}
          {field("maxRedemptions", "Max redemptions (optional)", "number")}
          <div className="space-y-2 rounded-md border border-border p-2">
            <Label className="text-xs">Happy hour (optional)</Label>
            <div className="flex flex-wrap gap-1">{["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d, i) => <button key={d} type="button" onClick={() => setHh((h) => ({ ...h, days: h.days.includes(i) ? h.days.filter((x) => x !== i) : [...h.days, i] }))} className={cn("rounded border px-2 py-0.5 text-xs", hh.days.includes(i) ? "border-primary bg-primary text-primary-foreground" : "border-border")}>{d}</button>)}</div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">From</Label><input type="time" value={hh.start} onChange={(e) => setHh({ ...hh, start: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><Label className="text-xs">To</Label><input type="time" value={hh.end} onChange={(e) => setHh({ ...hh, end: e.target.value })} className={inputCls} /></div>
            </div>
          </div>
          <button type="button" className={btn.primary} onClick={create}><Plus /> Create</button>
        </Box>
      </div>
      {node}
    </div>
  );
}

/* ---------- gift cards ---------- */

export function GiftCards() {
  useCollection("gift-cards");
  const [amount, setAmount] = useState("");
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState<Rec | null>(null);
  const [check, setCheck] = useState("");
  const [found, setFound] = useState<Rec | null>(null);
  const { flash, node } = useFlash();
  function issue() {
    if (!amount) return flash("Enter an amount", true);
    try { const g = issueGiftCard(num(amount), code.trim() || undefined); setIssued(g); setAmount(""); setCode(""); flash(`Gift card ${g.code} issued`); } catch (e) { flash((e as Error).message, true); }
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Gift Cards" subtitle="Issue and check gift cards" />
      <div className="grid gap-4 md:grid-cols-2">
        <Box title="Issue a gift card">
          <div className="space-y-1.5"><Label htmlFor="gc-amt">Amount</Label><input id="gc-amt" type="number" step="0.001" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></div>
          <div className="space-y-1.5"><Label htmlFor="gc-code">Code (optional — auto-generated if blank)</Label><input id="gc-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} /></div>
          <button type="button" className={btn.primary} onClick={issue}>Issue</button>
          {issued && <div className="rounded-md bg-muted p-3 text-sm">Issued <span className="font-mono font-semibold">{String(issued.code)}</span> · {money(num(issued.balance))}</div>}
          <p className="text-xs text-muted-foreground">The cash taken is held in Customer Deposits until the card is spent at the register.</p>
        </Box>
        <Box title="Check balance">
          <div className="flex gap-2"><input value={check} onChange={(e) => setCheck(e.target.value)} placeholder="Gift card code" className={inputCls} /><button type="button" className={btn.outline} onClick={() => { const g = giftCard(check); setFound(g ?? null); if (!g) flash("Not found", true); }}>Check</button></div>
          {found && <div className="rounded-md bg-muted p-3"><div className="font-mono text-sm">{String(found.code)}</div><div className="text-2xl font-bold">{money(num(found.balance))}</div><div className="text-xs text-muted-foreground">{found.isActive === false ? "Inactive" : "Active"}</div></div>}
        </Box>
      </div>
      {node}
    </div>
  );
}

/* ---------- loyalty ---------- */

export function Loyalty() {
  const [ready, setReady] = useState(false);
  const [f, setF] = useState({ name: "", earnRate: "1", redeemRate: "0.01", pointsExpiryDays: "", isActive: true });
  const { flash, node } = useFlash();
  useEffect(() => {
    const t = setTimeout(() => { const s = getSetting("loyalty", LOYALTY_DEFAULT); setF({ name: s.name, earnRate: String(s.earnRate), redeemRate: String(s.redeemRate), pointsExpiryDays: s.pointsExpiryDays != null ? String(s.pointsExpiryDays) : "", isActive: s.isActive }); setReady(true); }, 0);
    return () => clearTimeout(t);
  }, []);
  if (!ready) return <div className="flex h-40 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  const field = (k: "name" | "earnRate" | "redeemRate" | "pointsExpiryDays", label: string, type = "number") => (
    <div className="space-y-1.5"><Label htmlFor={`ly-${k}`}>{label}</Label><input id={`ly-${k}`} type={type} step="0.001" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={inputCls} /></div>
  );
  return (
    <div className="space-y-4">
      <PageHeader title="Loyalty Program" subtitle="Points earning and redemption" />
      <Box title="Settings" className="max-w-xl">
        {field("name", "Program name", "text")}
        {field("earnRate", "Points earned per 1.00 spent")}
        {field("redeemRate", "Value per point (currency)")}
        {field("pointsExpiryDays", "Points expiry (days, blank = never)")}
        <label className="flex items-center gap-2"><Switch checked={f.isActive} onChange={(v) => setF({ ...f, isActive: v })} label="Active" /><Label>Active</Label></label>
        <button type="button" className={btn.primary} onClick={() => { saveSetting("loyalty", { name: f.name, earnRate: num(f.earnRate), redeemRate: num(f.redeemRate), pointsExpiryDays: f.pointsExpiryDays ? parseInt(f.pointsExpiryDays) : null, isActive: f.isActive }); flash("Loyalty program saved"); }}>Save</button>
      </Box>
      {node}
    </div>
  );
}

/* ---------- modifiers ---------- */

export function Modifiers() {
  const groups = useCollection("modifier-groups");
  const [g, setG] = useState({ name: "", minSelect: "0", maxSelect: "1" });
  const [drafts, setDrafts] = useState<Record<string, { name: string; delta: string }>>({});
  const [attach, setAttach] = useState({ product: "", groupId: "" });
  const { flash, node } = useFlash();
  const draft = (id: string) => drafts[id] ?? { name: "", delta: "" };
  return (
    <div className="space-y-4">
      <PageHeader title="Modifiers" subtitle="Modifier groups for drinks / food (size, milk, add-ons)" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Box title="Groups">
          {groups.length === 0 ? <p className="text-sm text-muted-foreground">No modifier groups yet.</p> : groups.map((x) => (
            <div key={x.id} className="space-y-2 rounded-md border border-border p-3">
              <div className="text-sm font-medium">{String(x.name)} <span className="text-xs text-muted-foreground">(min {num(x.minSelect)}, max {num(x.maxSelect)})</span></div>
              <div className="flex flex-wrap gap-1">{((x.modifiers as Rec[]) ?? []).map((m) => <span key={String(m.id)} className="rounded-full bg-muted px-2 py-0.5 text-xs">{String(m.name)} {num(m.priceDelta) ? money(num(m.priceDelta)) : ""}</span>)}</div>
              {((x.productIds as string[]) ?? []).length > 0 && <div className="text-xs text-muted-foreground">On: {((x.productIds as string[]) ?? []).map((id) => String(productName(id)?.name ?? "—")).join(", ")}</div>}
              <div className="flex gap-2">
                <input placeholder="Modifier name" value={draft(x.id).name} onChange={(e) => setDrafts((d) => ({ ...d, [x.id]: { ...draft(x.id), name: e.target.value } }))} className={cn(inputCls, "h-8")} />
                <input placeholder="±price" type="number" step="0.001" value={draft(x.id).delta} onChange={(e) => setDrafts((d) => ({ ...d, [x.id]: { ...draft(x.id), delta: e.target.value } }))} className={cn(inputCls, "h-8 w-24")} />
                <button type="button" className={btn.smOutline} onClick={() => { if (!draft(x.id).name.trim()) return; updateRecord("modifier-groups", x.id, { modifiers: [...((x.modifiers as Rec[]) ?? []), { id: crypto.randomUUID(), name: draft(x.id).name.trim(), priceDelta: num(draft(x.id).delta) }] }); setDrafts((d) => ({ ...d, [x.id]: { name: "", delta: "" } })); }}>Add</button>
              </div>
            </div>
          ))}
        </Box>
        <div className="space-y-4">
          <Box title="New group">
            <input placeholder="e.g. Size" value={g.name} onChange={(e) => setG({ ...g, name: e.target.value })} className={inputCls} />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Min</Label><input type="number" value={g.minSelect} onChange={(e) => setG({ ...g, minSelect: e.target.value })} className={inputCls} /></div>
              <div className="space-y-1"><Label className="text-xs">Max (0=∞)</Label><input type="number" value={g.maxSelect} onChange={(e) => setG({ ...g, maxSelect: e.target.value })} className={inputCls} /></div>
            </div>
            <button type="button" className={btn.smPrimary} onClick={() => { if (!g.name.trim()) return; createRecord("modifier-groups", { name: g.name.trim(), minSelect: parseInt(g.minSelect) || 0, maxSelect: parseInt(g.maxSelect) || 0, modifiers: [], productIds: [] }); setG({ name: "", minSelect: "0", maxSelect: "1" }); flash("Group created"); }}><Plus /> Create</button>
          </Box>
          <Box title="Attach to product">
            <ProductPicker size="md" value={attach.product} onChange={(id) => setAttach((a) => ({ ...a, product: id }))} />
            <Select value={attach.groupId} onChange={(v) => setAttach((a) => ({ ...a, groupId: v }))} ariaLabel="Group" placeholder="Select a group" options={groups.map((x) => ({ value: x.id, label: String(x.name) }))} />
            <button type="button" className={btn.smOutline} onClick={() => {
              if (!attach.product || !attach.groupId) return flash("Pick a product and a group", true);
              const grp = groups.find((x) => x.id === attach.groupId)!;
              updateRecord("modifier-groups", grp.id, { productIds: [...new Set([...((grp.productIds as string[]) ?? []), attach.product])] });
              flash("Attached");
            }}>Attach</button>
          </Box>
        </div>
      </div>
      {node}
    </div>
  );
}

/* ---------- product flags: age-restricted, deposits, weighed, serial-tracked ---------- */

type FlagCfg = { title: string; subtitle: string; addTitle: string; listTitle: string; productLabel: string; flag: string; value?: { key: string; label: string; def: string; type: "number" | "text"; fmt: (p: Rec) => string }; addLabel: string; done: string };
const FLAGS: Record<string, FlagCfg> = {
  age: { title: "Age-Restricted Products", subtitle: "Force an age-verification prompt at the register", addTitle: "Add", listTitle: "Restricted products", productLabel: "Product", flag: "ageRestricted", value: { key: "minAge", label: "Min age", def: "18", type: "number", fmt: (p) => (p.minAge ? `${p.minAge}+` : "restricted") }, addLabel: "Add", done: "Marked age-restricted" },
  deposit: { title: "Returnable Deposits", subtitle: "Auto-add a refundable deposit line when these products sell", addTitle: "Set a deposit", listTitle: "Products with deposits", productLabel: "Product", flag: "depositAmount", value: { key: "depositAmount", label: "Deposit", def: "", type: "number", fmt: (p) => money(num(p.depositAmount)) }, addLabel: "Set", done: "Deposit set" },
  weighed: { title: "Weighed Products", subtitle: "Sold by weight — the register prompts for weight (price × weight)", addTitle: "Add", listTitle: "Weighed products", productLabel: "Product (selling price = price per unit)", flag: "soldByWeight", value: { key: "weightUnit", label: "Unit", def: "kg", type: "text", fmt: (p) => `${money(num(p.retail))} / ${p.weightUnit || "kg"}` }, addLabel: "Add", done: "Marked as weighed" },
  serial: { title: "Serial / Batch Tracking", subtitle: "Capture a serial/batch/lot at sale for these products", addTitle: "Add", listTitle: "Serial-tracked products", productLabel: "Product", flag: "trackSerial", addLabel: "Add", done: "Serial capture on" },
};

export function ProductFlags({ kind }: { kind: keyof typeof FLAGS }) {
  const cfg = FLAGS[kind];
  const products = useCollection("products");
  const [pid, setPid] = useState("");
  const [value, setValue] = useState(cfg.value?.def ?? "");
  const { flash, node } = useFlash();
  const on = (p: Rec) => (cfg.flag === "depositAmount" ? num(p.depositAmount) > 0 : Boolean(p[cfg.flag]));
  function add() {
    if (!pid) return;
    if (cfg.flag === "depositAmount") { if (!(num(value) > 0)) return flash("Enter a deposit amount", true); updateRecord("products", pid, { depositAmount: num(value) }); }
    else updateRecord("products", pid, { [cfg.flag]: true, ...(cfg.value ? { [cfg.value.key]: cfg.value.type === "number" ? (value ? parseInt(value) : null) : value || cfg.value.def } : {}) });
    setPid(""); setValue(cfg.value?.def ?? ""); flash(cfg.done);
  }
  const remove = (id: string) => updateRecord("products", id, cfg.flag === "depositAmount" ? { depositAmount: 0 } : { [cfg.flag]: false });
  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader title={cfg.title} subtitle={cfg.subtitle} />
      <Box title={cfg.addTitle}>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1 space-y-1"><Label className="text-xs">{cfg.productLabel}</Label><ProductPicker size="md" value={pid} onChange={(id) => setPid(id)} /></div>
          {cfg.value && <div className={cn("space-y-1", cfg.value.type === "text" ? "w-20" : "w-28")}><Label className="text-xs">{cfg.value.label}</Label><input type={cfg.value.type} step={cfg.value.type === "number" ? "0.001" : undefined} value={value} onChange={(e) => setValue(e.target.value)} className={inputCls} /></div>}
          <button type="button" className={btn.primary} disabled={!pid} onClick={add}>{cfg.addLabel}</button>
        </div>
      </Box>
      <Box title={cfg.listTitle}>
        {products.filter(on).length === 0 ? <p className="text-sm text-muted-foreground">None yet.</p> : <div className="divide-y divide-border">{products.filter(on).map((p) => (
          <div key={p.id} className="flex items-center justify-between py-2 text-sm"><span>{String(p.name)} <span className="text-muted-foreground">({String(p.sku ?? "")})</span></span><div className="flex items-center gap-2">{cfg.value && <span className="text-muted-foreground">{cfg.value.fmt(p)}</span>}<button type="button" aria-label="Remove" className={btn.icon} onClick={() => remove(p.id)}><Trash2 /></button></div></div>
        ))}</div>}
      </Box>
      {node}
    </div>
  );
}

/* ---------- barcode labels (Code 39) ---------- */

const C39: Record<string, string> = { "0": "nnnwwnwnn", "1": "wnnwnnnnw", "2": "nnwwnnnnw", "3": "wnwwnnnnn", "4": "nnnwwnnnw", "5": "wnnwwnnnn", "6": "nnwwwnnnn", "7": "nnnwnnwnw", "8": "wnnwnnwnn", "9": "nnwwnnwnn", A: "wnnnnwnnw", B: "nnwnnwnnw", C: "wnwnnwnnn", D: "nnnnwwnnw", E: "wnnnwwnnn", F: "nnwnwwnnn", G: "nnnnnwwnw", H: "wnnnnwwnn", I: "nnwnnwwnn", J: "nnnnwwwnn", K: "wnnnnnnww", L: "nnwnnnnww", M: "wnwnnnnwn", N: "nnnnwnnww", O: "wnnnwnnwn", P: "nnwnwnnwn", Q: "nnnnnnwww", R: "wnnnnnwwn", S: "nnwnnnwwn", T: "nnnnwnwwn", U: "wwnnnnnnw", V: "nwwnnnnnw", W: "wwwnnnnnn", X: "nwnnwnnnw", Y: "wwnnwnnnn", Z: "nwwnwnnnn", "-": "nwnnnnwnw", ".": "wwnnnnwnn", " ": "nwwnnnwnn", $: "nwnwnwnnn", "/": "nwnwnnnwn", "+": "nwnnnwnwn", "%": "nnnwnwnwn", "*": "nwnnwnwnn" };
function code39(text: string, mw = 1.5, h = 40) {
  const up = (text || "").toUpperCase();
  const s = `*${[...up].every((c) => C39[c]) ? up : ""}*`;
  let x = 0;
  const bars: string[] = [];
  [...s].forEach((c, i) => { const p = C39[c]; for (let j = 0; j < p.length; j++) { const w = (p[j] === "w" ? 3 : 1) * mw; if (j % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${w}" height="${h}"/>`); x += w; } if (i < s.length - 1) x += mw; });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${x}" height="${h}" viewBox="0 0 ${x} ${h}" fill="#000">${bars.join("")}</svg>`;
}

export function Labels() {
  const [items, setItems] = useState<{ key: string; name: string; code: string; price: number; count: number }[]>([]);
  const [count, setCount] = useState("1");
  const sheet = items.flatMap((t) => Array.from({ length: t.count }, (_, i) => ({ ...t, key: `${t.key}-${i}` })));
  return (
    <div className="space-y-4">
      <style>{`@media print { body * { visibility: hidden !important; } #label-sheet, #label-sheet * { visibility: visible !important; } #label-sheet { position: absolute; inset-block-start: 0; inset-inline-start: 0; width: 100%; } }`}</style>
      <PageHeader title="Barcode Labels" subtitle="Generate printable shelf / product labels" actions={<button type="button" className={btn.primary} disabled={!sheet.length} onClick={() => window.print()}><Printer /> Print</button>} />
      <Box title="Add product" className="max-w-3xl">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-56 flex-1 space-y-1"><Label className="text-xs">Product</Label><ProductPicker size="md" value="" onChange={(id, p) => p && setItems((x) => [...x, { key: `${id}-${x.length}`, name: String(p.name), code: String(p.barcode || p.sku || ""), price: num(p.retail), count: parseInt(count) || 1 }])} /></div>
          <div className="w-24 space-y-1"><Label className="text-xs">Labels</Label><input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} className={inputCls} /></div>
          {items.length > 0 && <button type="button" className={btn.outline} onClick={() => setItems([])}>Clear</button>}
        </div>
      </Box>
      <div id="label-sheet" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sheet.map((t) => (
          <div key={t.key} className="flex flex-col items-center rounded-md border border-dashed border-border bg-white p-3 text-black">
            <div className="line-clamp-1 text-sm font-medium">{t.name}</div>
            <div className="text-base font-bold">{money(t.price)}</div>
            <div className="my-1" dangerouslySetInnerHTML={{ __html: code39(t.code) }} />
            <div className="font-mono text-xs">{t.code}</div>
          </div>
        ))}
        {sheet.length === 0 && <div className="col-span-full py-8 text-center text-sm text-muted-foreground">Add products to generate labels.</div>}
      </div>
    </div>
  );
}

/* ---------- terminal profile & quick keys ---------- */

export function TerminalProfile() {
  const terminals = useCollection("pos-terminals");
  const [tid, setTid] = useState("");
  const id = tid || terminals[0]?.id || "";
  const t = terminals.find((x) => x.id === id);
  const [draft, setDraft] = useState<{ id: string; methods: string[]; tax: string; width: string } | null>(null);
  const { flash, node } = useFlash();
  const d = draft && draft.id === id ? draft : t ? { id, methods: (t.paymentMethods as string[]) ?? PAY_METHODS.map((m) => m.value), tax: String(num(t.defaultTaxRate)), width: String(t.receiptWidth || "80mm") } : null;
  return (
    <div className="space-y-4">
      <PageHeader title="Terminal Profile" subtitle="Per-terminal register configuration" />
      <Box title="Settings" className="max-w-xl">
        <div className="space-y-1.5"><Label>Terminal</Label><Select value={id} onChange={setTid} placeholder="Select a terminal" options={terminals.map((x) => ({ value: x.id, label: String(x.name) }))} /></div>
        {d && (
          <>
            <div className="space-y-2"><Label>Payment methods</Label><div className="grid grid-cols-2 gap-2">{PAY_METHODS.map((m) => <label key={m.value} className="flex items-center gap-2 text-sm"><input type="checkbox" className="size-4" checked={d.methods.includes(m.value)} onChange={() => setDraft({ ...d, methods: d.methods.includes(m.value) ? d.methods.filter((x) => x !== m.value) : [...d.methods, m.value] })} />{m.label}</label>)}</div></div>
            <div className="space-y-1.5"><Label htmlFor="tp-tax">Default tax rate (%)</Label><input id="tp-tax" type="number" step="0.001" value={d.tax} onChange={(e) => setDraft({ ...d, tax: e.target.value })} className={inputCls} /></div>
            <div className="space-y-1.5"><Label>Receipt width</Label><Select value={d.width} onChange={(v) => setDraft({ ...d, width: v })} options={[{ value: "58mm", label: "58mm" }, { value: "80mm", label: "80mm" }, { value: "a4", label: "A4" }]} /></div>
            <button type="button" className={btn.primary} onClick={() => { updateRecord("pos-terminals", id, { paymentMethods: d.methods, defaultTaxRate: num(d.tax), receiptWidth: d.width }); flash("Profile saved"); }}>Save</button>
          </>
        )}
      </Box>
      {node}
    </div>
  );
}

export function QuickKeys() {
  const terminals = useCollection("pos-terminals");
  const products = useCollection("products");
  const [tid, setTid] = useState("");
  const id = tid || terminals[0]?.id || "";
  const t = terminals.find((x) => x.id === id);
  const [draft, setDraft] = useState<{ id: string; keys: string[] } | null>(null);
  const keys = draft && draft.id === id ? draft.keys : ((t?.quickKeys as string[]) ?? []);
  const setKeys = (k: string[]) => setDraft({ id, keys: k });
  const { flash, node } = useFlash();
  const move = (i: number, d: number) => { const k = [...keys]; const j = i + d; if (j < 0 || j >= k.length) return; [k[i], k[j]] = [k[j], k[i]]; setKeys(k); };
  return (
    <div className="space-y-4">
      <PageHeader title="Quick Keys" subtitle="Pin frequent products to the top of the register catalog" />
      <Box title="Layout" className="max-w-xl">
        <div className="space-y-1.5"><Label>Terminal</Label><Select value={id} onChange={setTid} placeholder="Select a terminal" options={terminals.map((x) => ({ value: x.id, label: String(x.name) }))} /></div>
        {t && (
          <>
            <div className="space-y-1"><Label className="text-xs">Add product</Label><ProductPicker size="md" value="" onChange={(pid) => pid && !keys.includes(pid) && setKeys([...keys, pid])} /></div>
            <div className="divide-y divide-border">{keys.length === 0 ? <p className="text-sm text-muted-foreground">No quick keys yet.</p> : keys.map((k, i) => (
              <div key={k} className="flex items-center justify-between py-1.5 text-sm"><span>{String(products.find((p) => p.id === k)?.name ?? "—")}</span><div className="flex">
                <button type="button" aria-label="Move up" className={btn.icon} onClick={() => move(i, -1)}><ArrowUp /></button><button type="button" aria-label="Move down" className={btn.icon} onClick={() => move(i, 1)}><ArrowDown /></button><button type="button" aria-label="Remove" className={btn.icon} onClick={() => setKeys(keys.filter((x) => x !== k))}><Trash2 /></button>
              </div></div>
            ))}</div>
            <button type="button" className={btn.primary} onClick={() => { updateRecord("pos-terminals", id, { quickKeys: keys }); flash("Quick keys saved"); }}>Save</button>
          </>
        )}
      </Box>
      {node}
    </div>
  );
}

/* ---------- supervisor PIN & audit log ---------- */

export function SupervisorPin() {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const { flash, node } = useFlash();
  function save() {
    if (pin.length < 4) return flash("PIN must be at least 4 digits", true);
    if (pin !== confirmPin) return flash("PINs do not match", true);
    saveSetting("supervisor", { pin, name: BRAND.user.fullName });
    setPin(""); setConfirmPin(""); flash("Supervisor PIN set");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Supervisor PIN" subtitle="Set your PIN to approve gated register actions (void, refund, price override)" />
      <Box title="Set PIN" className="max-w-md">
        <div className="space-y-1.5"><Label htmlFor="pin-1">New PIN</Label><input id="pin-1" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} className={inputCls} /></div>
        <div className="space-y-1.5"><Label htmlFor="pin-2">Confirm PIN</Label><input id="pin-2" type="password" inputMode="numeric" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} className={inputCls} /></div>
        <button type="button" className={btn.primary} onClick={save}>Save PIN</button>
        <p className="text-xs text-muted-foreground">Approval only succeeds if your role holds the matching POS permission.</p>
      </Box>
      {node}
    </div>
  );
}

export function AuditLog() {
  const rows = useCollection("pos-audit");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(0);
  const list = [...rows].filter((r) => !action || r.action === action).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const pages = Math.max(1, Math.ceil(list.length / 20));
  return (
    <div className="space-y-4">
      <PageHeader title="POS Audit Log" subtitle="Void, refund, approval and other sensitive register actions" />
      <div className="flex flex-wrap gap-2">{["", "VOID", "REFUND", "APPROVAL", "NO_SALE"].map((a) => <button key={a || "all"} type="button" className={action === a ? btn.smPrimary : btn.smOutline} onClick={() => { setAction(a); setPage(0); }}>{a || "All"}</button>)}</div>
      <Card>
        {list.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No audit entries.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="p-3 font-medium">When</th><th className="p-3 font-medium">Action</th><th className="p-3 font-medium">Cashier</th><th className="p-3 font-medium">Approver</th><th className="p-3 font-medium">Details</th></tr></thead>
            <tbody>{list.slice(page * 20, page * 20 + 20).map((r) => <tr key={r.id} className="border-b border-border"><td className="whitespace-nowrap p-3">{new Date(String(r.createdAt)).toLocaleString()}</td><td className="p-3 font-medium">{String(r.action)}</td><td className="p-3">{String(r.actorName || "-")}</td><td className="p-3">{String(r.approverName || "-")}</td><td className="p-3 font-mono text-xs">{r.details ? JSON.stringify(r.details) : ""}</td></tr>)}</tbody>
          </table>
          {pages > 1 && <div className="flex items-center justify-end gap-2 p-3 text-sm"><button type="button" className={btn.smOutline} disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {pages}</span><button type="button" className={btn.smOutline} disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button></div>}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------- receipt settings ---------- */

export function ReceiptSettings() {
  const [ready, setReady] = useState(false);
  const [f, setF] = useState(RECEIPT_DEFAULT);
  const { flash, node } = useFlash();
  useEffect(() => { const t = setTimeout(() => { setF(getSetting("receipt", RECEIPT_DEFAULT)); setReady(true); }, 0); return () => clearTimeout(t); }, []);
  if (!ready) return <div className="flex h-40 items-center justify-center"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>;
  const sample: ReceiptData = {
    company: { name: "Your Store", address: f.address || undefined, header: f.header || undefined, footer: [f.footer, f.returnPolicy].filter(Boolean).join("\n\n") || undefined, logoUrl: f.logoUrl || undefined },
    sale: { saleNumber: "POS-20260628-000123", saleDate: "2026-06-28", saleTime: "14:05", cashierName: "Sam", customerName: null, status: "PAID" },
    lines: [{ description: "Cola 330ml", quantity: 2, unitPrice: 1.5, discountAmount: 0, taxRate: 5, taxAmount: 0.15, lineTotal: 3.15 }, { description: "Crisps", quantity: 1, unitPrice: 2, discountAmount: 0.5, taxRate: 5, taxAmount: 0.08, lineTotal: 1.58 }],
    totals: { subtotal: 4.5, discount: 0.5, tax: 0.23, total: 4.73, amountPaid: 5, changeGiven: 0.27 },
    payments: [{ method: "CASH", amount: 5, reference: null }],
  };
  const area = (k: keyof typeof f, label: string) => <div className="space-y-1.5"><Label htmlFor={`rs-${k}`}>{label}</Label><textarea id={`rs-${k}`} rows={2} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} className={textareaCls} /></div>;
  return (
    <div className="space-y-4">
      <PageHeader title="Receipt Settings" subtitle="Branding and legal text printed on POS receipts" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Box title="Settings">
          {area("address", "Printed address")}
          <div className="space-y-1.5"><Label htmlFor="rs-logo">Logo URL</Label><input id="rs-logo" value={f.logoUrl} onChange={(e) => setF({ ...f, logoUrl: e.target.value })} placeholder="https://…" className={inputCls} /></div>
          {area("header", "Header")}{area("footer", "Footer")}{area("returnPolicy", "Return policy")}
          <button type="button" className={btn.primary} onClick={() => { saveSetting("receipt", f); flash("Receipt settings saved"); }}>Save</button>
        </Box>
        <div><Box title="Preview"><div className="rounded-xl border border-border bg-muted p-4"><ReceiptView receipt={sample} /></div></Box></div>
      </div>
      {node}
    </div>
  );
}

/* ---------- customer display ---------- */

export function CustomerDisplay() {
  const [s, setS] = useState<DisplayState | null>(null);
  const [thanks, setThanks] = useState<DisplayState["completed"]>(null);
  useEffect(() => {
    const load = () => {
      const d = readDisplay();
      setS(d);
      if (d?.completed) { setThanks(d.completed); setTimeout(() => setThanks(null), 5000); }
    };
    const t = setTimeout(load, 0);
    const onStorage = (e: StorageEvent) => e.key === DISPLAY_STORAGE_KEY && load();
    window.addEventListener("storage", onStorage);
    return () => { clearTimeout(t); window.removeEventListener("storage", onStorage); };
  }, []);
  const empty = !s || (s.lines.length === 0 && !thanks);
  return (
    <div className="flex min-h-[80vh] flex-col rounded-xl bg-slate-950 p-8 text-white">
      {s?.shopName && <div className="mb-6 text-center"><h1 className="text-3xl font-bold">{s.shopName}</h1></div>}
      {thanks ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3"><CheckCircle2 className="size-20 text-emerald-400" /><h2 className="text-4xl font-bold">Thank you!</h2><p className="text-2xl">{money(thanks.paidTotal)}</p>{thanks.change > 0 && <p className="text-xl">Change: <span className="font-bold">{money(thanks.change)}</span></p>}</div>
      ) : empty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-400"><ShoppingBag className="size-20" /><p className="text-3xl">Welcome</p></div>
      ) : (
        <div className="flex flex-1 flex-col">
          <div className="flex-1 space-y-2 overflow-y-auto">{s!.lines.map((l, i) => <div key={i} className="flex items-baseline justify-between border-b border-slate-800 py-2 text-xl"><span className="flex-1">{l.name}</span><span className="w-40 text-right text-slate-400">{l.quantity} × {money(l.unitPrice)}</span><span className="w-36 text-right font-semibold">{money(l.lineTotal)}</span></div>)}</div>
          <div className="mt-4 space-y-1 border-t border-slate-700 pt-4 text-xl">
            {s!.discount > 0 && <div className="flex justify-between"><span>Discount</span><span>-{money(s!.discount)}</span></div>}
            <div className="flex justify-between"><span>Tax</span><span>{money(s!.tax)}</span></div>
            <div className="flex justify-between text-4xl font-bold"><span>TOTAL</span><span>{money(s!.total)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- return without receipt ---------- */

export function BlindReturn() {
  const router = useRouter();
  const accounts = useAccounts();
  const customers = useCollection("customers");
  const [items, setItems] = useState([{ description: "", quantity: "1", refundAmount: "" }]);
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState<"ORIGINAL" | "STORE_CREDIT">("ORIGINAL");
  const [customerId, setCustomerId] = useState("");
  const [offset, setOffset] = useState("");
  const [approver, setApprover] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);
  const { flash, node } = useFlash();
  const total = items.reduce((a, l) => a + num(l.refundAmount) * num(l.quantity), 0);
  const set = (i: number, p: Partial<(typeof items)[number]>) => setItems((x) => x.map((l, j) => (j === i ? { ...l, ...p } : l)));
  function submit() {
    const shift = openShiftOf();
    if (!shift) return flash("Open a shift first — a blind return needs an open till.", true);
    if (!approver) return setAsking(true);
    const lines = items.filter((l) => l.description.trim() && num(l.quantity) > 0 && num(l.refundAmount) > 0).map((l) => ({ description: l.description.trim(), quantity: num(l.quantity), refundAmount: num(l.refundAmount) }));
    if (!lines.length) return flash("Add at least one item with a price", true);
    if (method === "STORE_CREDIT" && !customerId) return flash("Store credit needs a customer", true);
    blindReturn({ terminalId: String(shift.terminalId), lines, refundMethod: method, customerId: customerId || undefined, reason: reason || undefined, offsetAccountId: offset || undefined, approver, actor: String(shift.openedBy ?? BRAND.user.fullName) });
    router.push("/pos/terminals");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Return without receipt" subtitle="Blind return at current price — requires supervisor approval" />
      <Box title="Items">
        {items.map((l, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1 space-y-1"><Label className="text-xs">Description</Label><input value={l.description} onChange={(e) => set(i, { description: e.target.value })} placeholder="Item" className={inputCls} /></div>
            <div className="w-24 space-y-1"><Label className="text-xs">Qty</Label><input type="number" min={0} step="0.001" value={l.quantity} onChange={(e) => set(i, { quantity: e.target.value })} className={inputCls} /></div>
            <div className="w-32 space-y-1"><Label className="text-xs">Price each</Label><input type="number" min={0} step="0.001" value={l.refundAmount} onChange={(e) => set(i, { refundAmount: e.target.value })} className={inputCls} /></div>
            <button type="button" aria-label="Remove item" className={btn.icon} onClick={() => setItems((x) => (x.length > 1 ? x.filter((_, j) => j !== i) : x))}><Trash2 /></button>
          </div>
        ))}
        <button type="button" className={btn.smOutline} onClick={() => setItems((x) => [...x, { description: "", quantity: "1", refundAmount: "" }])}><Plus /> Add item</button>
      </Box>
      <Card className="max-w-md">
        <div className="space-y-4 p-5">
          <div className="space-y-1.5"><Label>Refund method</Label><Select value={method} onChange={(v) => setMethod(v as "ORIGINAL")} options={[{ value: "ORIGINAL", label: "Cash" }, { value: "STORE_CREDIT", label: "Store credit" }]} /></div>
          {method === "STORE_CREDIT" && <div className="space-y-1.5"><Label>Customer</Label><RecordPicker items={customers} value={customerId} onChange={setCustomerId} placeholder="Select customer..." getLabel={(c) => String(c.name)} emptyText="No customers yet." /></div>}
          <div className="space-y-1.5"><Label htmlFor="br-reason">Reason</Label><input id="br-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Optional" className={inputCls} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Sales-returns account (posts to GL)</Label><AccountPicker accounts={accounts} value={offset} onChange={setOffset} placeholder="No GL posting" /></div>
          {approver && <p className="flex items-center gap-1 text-sm text-success"><ShieldCheck className="size-4" /> Approved by {approver}</p>}
          <div className="flex justify-between text-lg font-bold"><span>Refund total</span><span className="tabular-nums">{money(total)}</span></div>
          <div className="flex gap-2"><button type="button" className={btn.primary} disabled={total <= 0} onClick={submit}>{approver ? "Process return" : "Approve & process"}</button><button type="button" className={btn.outline} onClick={() => router.push("/pos/terminals")}>Cancel</button></div>
        </div>
      </Card>
      {asking && <ApprovalDialog title="Approve no-receipt return" onClose={() => setAsking(false)} onApproved={(name) => { setApprover(name); setAsking(false); audit("APPROVAL", BRAND.user.fullName, { action: "blind return" }, name); flash(`Approved by ${name} — press Process return to finish.`); }} />}
      {node}
    </div>
  );
}
