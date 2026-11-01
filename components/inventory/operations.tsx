"use client";

// Day-to-day stock: dashboard, balances & adjustments, transfers, stock journal, reconciliation,
// ledger, aging, scrap, bins and the scan station. Everything reads/writes lib/stock movements.

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeftRight, Boxes, ChartLine, FileText, Hourglass, Package, Plus, ScanBarcode, ScrollText, Trash2, TriangleAlert, Truck, Warehouse } from "lucide-react";
import { createRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { MOVE_TYPES, adjustStock, balances, onHand, recordMove, scrapStock, transferStock, useMoves, valuation } from "@/lib/stock";
import { createJournal, findAccountByCode } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { Card, CardTitle, DataTable, DateInput, Dialog, Field, PageHeader, SearchInput, Select, SidePanel, Switch, btn, inputCls, longDate, money, num, today, type Column } from "@/components/accounting/kit";
import { NumberBanner, Req, Section, StatusBadge } from "@/components/sales/doc-kit";
import { CountedTextarea, EmptyCard, LineGrid, ProductPicker, WarehousePicker, numInput, subOf, useWarehouses, type GridCol } from "@/components/purchasing/kit";
import { useProducts } from "./catalog";

const name = (rows: Rec[], id: unknown, fallback = "—") => String(rows.find((r) => r.id === id)?.name ?? fallback);
const daysBetween = (a: string, b: string) => Math.floor((Date.parse(b) - Date.parse(a)) / 86400000);
const stockable = (p?: Rec) => !!p && p.trackStock !== false && !["SERVICE", "DIGITAL", "NON_INVENTORY"].includes(String(p.type ?? "GOODS"));

function EmptyState({ icon: Icon, title, text }: { icon: typeof Package; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-border px-6 py-10 text-center">
      <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-muted"><Icon className="h-4 w-4 text-muted-foreground" /></span>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

/* ---------- dashboard ---------- */

export function InventoryDashboard() {
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const rules = useCollection("reorder-rules");
  const transfers = useCollection("stock-transfers");
  const now = today();
  const bal = useMemo(() => balances(moves), [moves]);
  const totalQty = bal.reduce((s, b) => s + b.qty, 0);
  const totalValue = bal.reduce((s, b) => s + b.value, 0);
  const low = rules.filter((r) => onHand(String(r.productId), String(r.warehouseId), moves) <= num(r.reorderPoint)).length;
  const inTransit = transfers.filter((t) => t.status === "IN_TRANSIT").length;
  const sales30 = new Map<string, number>();
  for (const m of moves) if (m.type === "SALE" && daysBetween(String(m.date), now) <= 30) sales30.set(m.productId, (sales30.get(m.productId) ?? 0) - num(m.qty));
  const top = [...sales30].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const dead = bal.filter((b) => b.qty > 0 && b.lastMove && daysBetween(b.lastMove, now) >= 90);
  const byWh = warehouses.map((w) => ({ w, qty: bal.filter((b) => b.warehouseId === w.id).reduce((s, b) => s + b.qty, 0), value: bal.filter((b) => b.warehouseId === w.id).reduce((s, b) => s + b.value, 0) })).filter((x) => x.qty !== 0 || x.value !== 0);

  const stat = (label: string, value: string, Icon: typeof Package) => (
    <Card>
      <div className="p-4">
        <p className="flex items-center justify-between text-xs text-muted-foreground">{label} <Icon className="h-3.5 w-3.5" /></p>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </div>
    </Card>
  );
  return (
    <div className="space-y-4">
      <PageHeader title="Inventory Dashboard" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {stat("Products", String(products.length), Package)}
        {stat("Warehouses", String(warehouses.length), Warehouse)}
        {stat("Total Qty", moves.length ? String(Math.round(totalQty * 100) / 100) : "—", Boxes)}
        {stat("Total Value", moves.length ? money(totalValue) : "—", ChartLine)}
        {stat("Low Stock", String(low), TriangleAlert)}
        {stat("In Transit", String(inTransit), Truck)}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title={<span className="flex items-center gap-2 text-sm"><ChartLine className="h-4 w-4" /> Top Movers (30 days)</span>}>
          {top.length === 0 ? <p className="text-sm text-muted-foreground">No sales data yet.</p> : (
            <ul className="divide-y divide-border text-sm">{top.map(([pid, q]) => <li key={pid} className="flex justify-between py-1.5"><span>{name(products, pid)}</span><span className="tabular-nums">{q} sold</span></li>)}</ul>
          )}
        </Section>
        <Section title={<span className="flex items-center gap-2 text-sm"><Hourglass className="h-4 w-4" /> Dead Stock (90+ days)</span>}>
          {dead.length === 0 ? <p className="text-sm text-muted-foreground">No dead stock detected.</p> : (
            <ul className="divide-y divide-border text-sm">{dead.map((b) => <li key={b.productId + b.warehouseId} className="flex justify-between py-1.5"><span>{name(products, b.productId)} · {name(warehouses, b.warehouseId)}</span><span className="tabular-nums">{b.qty} · {money(b.value)}</span></li>)}</ul>
          )}
        </Section>
      </div>
      <Section title={<span className="flex items-center gap-2 text-sm"><Warehouse className="h-4 w-4" /> Stock by Warehouse</span>}>
        {byWh.length === 0 ? <p className="text-sm text-muted-foreground">No warehouse data.</p> : (
          <div className="space-y-2">
            {byWh.map(({ w, qty, value }) => (
              <div key={w.id} className="text-sm">
                <div className="flex justify-between"><span className="font-medium">{String(w.name)}</span><span className="tabular-nums">{qty} units · {money(value)}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${totalValue > 0 ? Math.max(2, (value / totalValue) * 100) : 0}%` }} /></div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ---------- stock balances + adjust ---------- */

export function StockBalances() {
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const [q, setQ] = useState("");
  const [wh, setWh] = useState("");
  const [state, setState] = useState("");
  const [unit, setUnit] = useState("ALT");
  const [layout, setLayout] = useState("LIST");
  const [adjusting, setAdjusting] = useState(false);
  const bal = useMemo(() => balances(moves), [moves]);
  const match = (pid: string) => { const p = products.find((x) => x.id === pid); return !q.trim() || `${p?.sku} ${p?.name}`.toLowerCase().includes(q.trim().toLowerCase()); };
  const keep = (qty: number) => !state || (state === "IN" ? qty > 0 : state === "OUT" ? qty === 0 : qty < 0);
  const fmt = (pid: string, qty: number) => {
    const p = products.find((x) => x.id === pid);
    const f = num(p?.altFactor);
    if (!p?.multiUnit || f <= 1 || unit === "BASE") return `${qty} ${p?.uom ?? ""}`;
    if (unit === "ALT") return `${Math.round((qty / f) * 100) / 100} ${p.altUnit}`;
    const big = Math.trunc(qty / f);
    return `${big} ${p.altUnit} + ${Math.round((qty - big * f) * 100) / 100} ${p.uom}`;
  };
  const rows = bal.filter((b) => (!wh || b.warehouseId === wh) && match(b.productId) && keep(b.qty));
  const byProduct = [...new Set(rows.map((r) => r.productId))];
  return (
    <div className="space-y-4">
      <PageHeader title="Stock Balances" subtitle="Current inventory levels" actions={<button type="button" onClick={() => setAdjusting(true)} className={btn.primary}><ArrowLeftRight /> Adjust Stock</button>} />
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search product or SKU..." />
        <Select ariaLabel="Warehouse" size="sm" value={wh} onChange={setWh} options={[{ value: "", label: "All warehouses" }, ...warehouses.map((w) => ({ value: w.id, label: String(w.name) }))]} className="w-44" />
        <Select ariaLabel="Stock state" size="sm" value={state} onChange={setState} options={[{ value: "", label: "All stock" }, { value: "IN", label: "In stock" }, { value: "OUT", label: "Out of stock" }, { value: "NEG", label: "Negative" }]} className="w-36" />
        <Select ariaLabel="View in" size="sm" value={unit} onChange={setUnit} options={[{ value: "ALT", label: "View in: Carton" }, { value: "ALL", label: "View in: All units" }, { value: "BASE", label: "View in: Each unit" }]} className="w-44" />
        <Select ariaLabel="Layout" size="sm" value={layout} onChange={setLayout} options={[{ value: "LIST", label: "Layout: List" }, { value: "WH", label: "Layout: By warehouse" }]} className="w-44" />
      </div>
      <Card>
        <div className="overflow-x-auto p-4">
          {layout === "LIST" ? (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 font-medium">Warehouse</th><th className="py-2 text-right font-medium">Quantity</th><th className="py-2 text-right font-medium">Value</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No stock data</td></tr>}
                {rows.map((b) => <tr key={b.productId + b.warehouseId} className="border-b border-border/60"><td className="py-2 font-medium">{name(products, b.productId)}</td><td className="py-2">{name(warehouses, b.warehouseId)}</td><td className={cn("py-2 text-right tabular-nums", b.qty < 0 && "text-destructive")}>{fmt(b.productId, b.qty)}</td><td className="py-2 text-right tabular-nums">{money(b.value)}</td></tr>)}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th>{warehouses.map((w) => <th key={w.id} className="py-2 text-right font-medium">{String(w.name)}</th>)}<th className="py-2 text-right font-medium">Total</th></tr></thead>
              <tbody>
                {byProduct.length === 0 && <tr><td colSpan={warehouses.length + 2} className="py-8 text-center text-muted-foreground">No stock data</td></tr>}
                {byProduct.map((pid) => <tr key={pid} className="border-b border-border/60"><td className="py-2 font-medium">{name(products, pid)}</td>{warehouses.map((w) => <td key={w.id} className="py-2 text-right tabular-nums">{onHand(pid, w.id, moves) || "—"}</td>)}<td className="py-2 text-right font-semibold tabular-nums">{fmt(pid, onHand(pid, undefined, moves))}</td></tr>)}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      {adjusting && <AdjustDialog onClose={() => setAdjusting(false)} />}
    </div>
  );
}

function AdjustDialog({ onClose }: { onClose: () => void }) {
  const moves = useMoves();
  const [f, setF] = useState({ productId: "", warehouseId: "", qty: "", extra: "", paidFrom: "CASH", reason: "" });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const current = f.productId && f.warehouseId ? onHand(f.productId, f.warehouseId, moves) : null;
  const qty = Number(f.qty) || 0;
  const valid = f.productId && f.warehouseId && (qty !== 0 || num(f.extra) > 0) && (current === null || current + qty >= 0);
  return (
    <Dialog open onClose={onClose} title="Adjust Stock" className="max-w-md">
      <div className="space-y-3">
        <Field label="Product"><ProductPicker size="md" value={f.productId} onChange={(id) => set({ productId: id })} /></Field>
        <Field label="Warehouse"><WarehousePicker value={f.warehouseId} onChange={(id) => set({ warehouseId: id })} /></Field>
        <Field label="Quantity (+ to add, − to remove)" htmlFor="adj-qty" hint={current !== null ? `On hand: ${current}${qty ? ` → ${current + qty}` : ""}` : undefined}>
          <input id="adj-qty" type="number" step="any" value={f.qty} onChange={(e) => set({ qty: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Extra cost (optional)" htmlFor="adj-extra" hint="Added to the value of this stock and spread over the units on hand, so each carries what it really cost. It does not change the quantity.">
          <input id="adj-extra" type="number" min="0" step="0.01" value={f.extra} onChange={(e) => set({ extra: e.target.value })} placeholder="Carriage, handling, ice" className={inputCls} />
        </Field>
        <Field label="Paid from" hint="Which account the extra cost was paid from. Only used when an extra cost is entered."><Select value={f.paidFrom} onChange={(v) => set({ paidFrom: v })} options={[{ value: "CASH", label: "Cash in Hand" }, { value: "BANK", label: "Bank Account" }]} /></Field>
        <Field label="Reason" htmlFor="adj-reason"><input id="adj-reason" value={f.reason} onChange={(e) => set({ reason: e.target.value })} placeholder="e.g. Damage, cycle-count correction" className={inputCls} /></Field>
        {current !== null && current + qty < 0 && <p className="text-sm text-destructive">That would take stock below zero.</p>}
      </div>
      <div className="flex justify-end">
        <button type="button" disabled={!valid} onClick={() => { adjustStock({ date: today(), productId: f.productId, warehouseId: f.warehouseId, qty, extraCost: num(f.extra), paidFrom: f.paidFrom as "CASH" | "BANK", reason: f.reason }); onClose(); }} className={btn.primary}>Adjust</button>
      </div>
    </Dialog>
  );
}

/* ---------- transfers ---------- */

const T_BASE = "/inventory/transfers";
type TLine = { productId: string; qty: number; uom: string; unitCost: number; from?: string; to?: string };

export function Transfers() {
  const router = useRouter();
  const sub = subOf(usePathname(), T_BASE);
  const transfers = useCollection("stock-transfers");
  const warehouses = useWarehouses();
  const close = () => router.push(T_BASE);
  const columns: Column<Rec>[] = [
    { key: "num", header: "Transfer #", cell: (t) => <span className="font-mono text-sm">{String(t.number)}</span> },
    { key: "from", header: "From", cell: (t) => (t.multi ? "Multiple" : name(warehouses, t.from)) },
    { key: "to", header: "To", cell: (t) => (t.multi ? "Multiple" : name(warehouses, t.to)) },
    { key: "p", header: "Products", cell: (t) => ((t.lines as TLine[]) ?? []).length },
    { key: "q", header: "Qty", cell: (t) => ((t.lines as TLine[]) ?? []).reduce((s, l) => s + l.qty, 0) },
    { key: "d", header: "Date", cell: (t) => longDate(t.date) },
    { key: "s", header: "Status", cell: (t) => <StatusBadge status={t.status} /> },
  ];
  const detail = sub && sub !== "new" ? transfers.find((t) => t.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Stock Transfers" actions={<Link href={`${T_BASE}/new`} className={btn.primary}><Plus /> New Transfer</Link>} />
      <DataTable columns={columns} rows={[...transfers].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))} onRowClick={(t) => router.push(`${T_BASE}/${t.id}`)} />
      {sub === "new" && <SidePanel onClose={close}><TransferForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><TransferView key={detail.id} transfer={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

// Lines grouped per (from, to) so multi-warehouse transfers move each leg correctly.
function legs(t: Rec) {
  const map = new Map<string, { from: string; to: string; lines: TLine[] }>();
  for (const l of (t.lines as TLine[]) ?? []) {
    const from = String(t.multi ? l.from : t.from);
    const to = String(t.multi ? l.to : t.to);
    const k = `${from}|${to}`;
    map.set(k, { from, to, lines: [...(map.get(k)?.lines ?? []), l] });
  }
  return [...map.values()];
}

function TransferForm({ onDone }: { onDone: () => void }) {
  const moves = useMoves();
  const [preview] = useState(() => nextNumber("stock-transfers", "TRF"));
  const [date, setDate] = useState(today());
  const [multi, setMulti] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<TLine[]>([{ productId: "", qty: 0, uom: "", unitCost: 0 }]);
  const [error, setError] = useState("");

  function submit() {
    const ls = lines.filter((l) => l.productId && l.qty > 0);
    if (!multi && (!from || !to)) return setError("Pick both warehouses.");
    if (!multi && from === to) return setError("From and To must be different warehouses.");
    if (multi && ls.some((l) => !l.from || !l.to || l.from === l.to)) return setError("Each line needs two different warehouses.");
    if (!ls.length) return setError("Add at least one product with a quantity.");
    for (const l of ls) {
      const src = multi ? String(l.from) : from;
      const need = ls.filter((x) => x.productId === l.productId && (multi ? x.from : from) === src).reduce((s, x) => s + x.qty, 0);
      if (need > onHand(l.productId, src, moves)) return setError(`Not enough ${readCollection("products").find((p) => p.id === l.productId)?.name ?? "stock"} in the source warehouse (${onHand(l.productId, src, moves)} on hand).`);
    }
    createRecord("stock-transfers", { number: nextNumber("stock-transfers", "TRF"), date, multi, from, to, notes, lines: ls.map((l) => ({ ...l, unitCost: l.unitCost || valuation(l.productId).avg })), status: "DRAFT" });
    onDone();
  }

  const cols: GridCol<TLine>[] = [
    { key: "p", header: <>Product<Req /></>, width: "34%", render: (l, set) => <ProductPicker value={l.productId} placeholder="Select product" onChange={(id, p) => set({ productId: id, uom: String(p.uom ?? "") })} /> },
    ...(multi
      ? [
          { key: "f", header: "From", render: (l: TLine, set: (p: Partial<TLine>) => void) => <WarehousePicker value={l.from ?? ""} onChange={(v) => set({ from: v })} /> },
          { key: "t", header: "To", render: (l: TLine, set: (p: Partial<TLine>) => void) => <WarehousePicker value={l.to ?? ""} onChange={(v) => set({ to: v })} /> },
        ]
      : []),
    { key: "u", header: "UOM", width: "3rem", render: (l) => <span className="text-muted-foreground">{l.uom || "-"}</span> },
    { key: "q", header: <>Quantity<Req /></>, width: "6rem", render: (l, set) => numInput(l.qty, (v) => set({ qty: v }), "Quantity") },
    { key: "c", header: "Unit Cost", width: "6rem", render: (l, set) => numInput(l.unitCost, (v) => set({ unitCost: v }), "Unit cost", "Auto") },
  ];

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Stock Transfer</h1>
      <Section title="Transfer Details">
        <NumberBanner label="Transfer Number" value={preview} />
        <Field label={<>Transfer Date<Req /></>} className="w-56"><DateInput value={date} onChange={setDate} /></Field>
        <label className="flex items-center gap-2 text-sm"><Switch checked={multi} onChange={setMulti} label="Multiple warehouses" /> <span><b className="font-medium">Multiple warehouses</b> — pick From and To on each line</span></label>
        {!multi && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={<>From Warehouse<Req /></>}><WarehousePicker value={from} onChange={setFrom} /></Field>
            <Field label={<>To Warehouse<Req /></>}><WarehousePicker value={to} onChange={setTo} /></Field>
          </div>
        )}
        <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} /></Field>
      </Section>
      <Section title="Line Items">
        <LineGrid lines={lines} setLines={setLines} cols={cols} blank={() => ({ productId: "", qty: 0, uom: "", unitCost: 0 })} addInHeader />
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        <button type="submit" className={btn.primary}>Create Transfer</button>
      </div>
    </form>
  );
}

function TransferView({ transfer, onClose }: { transfer: Rec; onClose: () => void }) {
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const run = (leg: "OUT" | "IN" | "BOTH", status: string) => {
    if (leg !== "IN")
      for (const g of legs(transfer))
        for (const l of g.lines) if (l.qty > onHand(l.productId, g.from, moves)) return alert(`Not enough ${name(products, l.productId)} in ${name(warehouses, g.from)} any more.`);
    for (const g of legs(transfer)) transferStock({ date: today(), from: g.from, to: g.to, reference: String(transfer.number), lines: g.lines }, leg);
    updateRecord("stock-transfers", transfer.id, { status, [status === "IN_TRANSIT" ? "dispatchedAt" : "receivedAt"]: today() });
    // Quality: transfer-triggered control points open pending checks on receipt.
    if (status === "COMPLETED")
      for (const cp of readCollection("quality-points").filter((q) => q.trigger === "TRANSFER" && q.active !== false))
        for (const l of ((transfer.lines as TLine[]) ?? []).filter((x) => !cp.productId || cp.productId === x.productId))
          createRecord("quality-checks", { pointId: cp.id, point: cp.name, type: cp.checkType, instructions: cp.instructions, productId: l.productId, qty: l.qty, source: `Transfer ${transfer.number}`, date: today(), status: "PENDING" });
  };
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div><h1 className="text-2xl font-semibold tracking-tight">Transfer {String(transfer.number)}</h1><p className="mt-1 text-muted-foreground">{longDate(transfer.date)}{transfer.multi ? " · multiple warehouses" : ` · ${name(warehouses, transfer.from)} → ${name(warehouses, transfer.to)}`}</p></div>
        <StatusBadge status={transfer.status} />
      </div>
      <Section title="Lines">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th>{Boolean(transfer.multi) && <th className="py-2 font-medium">Route</th>}<th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Unit Cost</th></tr></thead>
          <tbody>{((transfer.lines as TLine[]) ?? []).map((l, i) => <tr key={i} className="border-b border-border/60"><td className="py-2">{name(products, l.productId)}</td>{Boolean(transfer.multi) && <td className="py-2">{name(warehouses, l.from)} → {name(warehouses, l.to)}</td>}<td className="py-2 text-right">{l.qty} {l.uom}</td><td className="py-2 text-right tabular-nums">{money(l.unitCost)}</td></tr>)}</tbody>
        </table>
      </Section>
      <div className="flex flex-wrap gap-2">
        {transfer.status === "DRAFT" && <><button type="button" className={btn.primary} onClick={() => run("BOTH", "COMPLETED")}>Transfer now</button><button type="button" className={btn.outline} onClick={() => run("OUT", "IN_TRANSIT")}>Dispatch (in transit)</button></>}
        {transfer.status === "IN_TRANSIT" && <button type="button" className={btn.primary} onClick={() => run("IN", "COMPLETED")}>Receive at destination</button>}
        {transfer.status === "DRAFT" && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => updateRecord("stock-transfers", transfer.id, { status: "CANCELLED" })}>Cancel</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- stock journal ---------- */

type SjLine = { productId: string; warehouseId: string; qty: number };

export function StockJournal() {
  const moves = useMoves();
  const products = useProducts();
  const journals = useCollection("stock-journals");
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState("");
  const [lines, setLines] = useState<SjLine[]>([{ productId: "", warehouseId: "", qty: 0 }, { productId: "", warehouseId: "", qty: 0 }]);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const net = lines.reduce((s, l) => s + (Number(l.qty) || 0), 0);

  // Outgoing lines are valued at average cost; incoming lines absorb that value (assembly,
  // repacking). One-sided journals post the difference against Cost of Goods Sold.
  function postJournal() {
    const ls = lines.filter((l) => l.productId && l.warehouseId && l.qty);
    if (!ls.length) return setMsg({ ok: false, text: "Add at least one product, warehouse and quantity." });
    for (const l of ls.filter((x) => x.qty < 0)) if (-l.qty > onHand(l.productId, l.warehouseId, moves)) return setMsg({ ok: false, text: `Not enough ${name(products, l.productId)} to consume.` });
    const number = nextNumber("stock-journals", "SJ");
    let outValue = 0;
    for (const l of ls.filter((x) => x.qty < 0)) outValue += -recordMove({ date, productId: l.productId, warehouseId: l.warehouseId, qty: l.qty, type: "ADJUSTMENT", reference: `${number} ${reason}`.trim() }).value;
    const ins = ls.filter((x) => x.qty > 0);
    const inQty = ins.reduce((s, l) => s + l.qty, 0);
    let inValue = 0;
    for (const l of ins) {
      const unitCost = outValue > 0 ? outValue / inQty : valuation(l.productId).avg || num(products.find((p) => p.id === l.productId)?.cost);
      inValue += recordMove({ date, productId: l.productId, warehouseId: l.warehouseId, qty: l.qty, unitCost, type: "ADJUSTMENT", reference: `${number} ${reason}`.trim() }).value;
    }
    const diff = Math.round((inValue - outValue) * 1000) / 1000;
    const inv = findAccountByCode("1300")?.id ?? "";
    const cogs = findAccountByCode("5000")?.id ?? "";
    if (Math.abs(diff) > 0.0005) createJournal({ date, description: `Stock journal ${number}${reason ? ` — ${reason}` : ""}`, status: "POSTED", source: "Stock Journal", lines: diff > 0 ? [{ accountId: inv, debit: diff, credit: 0 }, { accountId: cogs, debit: 0, credit: diff }] : [{ accountId: cogs, debit: -diff, credit: 0 }, { accountId: inv, debit: 0, credit: -diff }] });
    createRecord("stock-journals", { number, date, reason, lines: ls, outValue, inValue });
    setLines([{ productId: "", warehouseId: "", qty: 0 }, { productId: "", warehouseId: "", qty: 0 }]);
    setReason("");
    setMsg({ ok: true, text: `Posted ${number}: ${money(outValue)} consumed, ${money(inValue)} produced.` });
  }

  const cols: GridCol<SjLine>[] = [
    { key: "p", header: "Product", width: "38%", render: (l, set) => <ProductPicker value={l.productId} onChange={(id) => set({ productId: id })} /> },
    { key: "w", header: "Warehouse", width: "32%", render: (l, set) => <WarehousePicker value={l.warehouseId} onChange={(id) => set({ warehouseId: id })} /> },
    { key: "q", header: <span className="block text-right">Qty change (− out / + in)</span>, render: (l, set) => <input aria-label="Quantity change" type="number" step="any" value={l.qty || ""} onChange={(e) => set({ qty: Number(e.target.value) || 0 })} placeholder="0" className={cn(inputCls, "h-8 text-right")} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Stock Journal" subtitle="Consume / produce stock with automatic valuation and GL posting" />
      <Card>
        <div className="grid gap-4 p-4 sm:grid-cols-[14rem_1fr]">
          <Field label="Date"><DateInput value={date} onChange={setDate} /></Field>
          <Field label="Reason / Narration" htmlFor="sj-reason"><input id="sj-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Assemble kit, write-off, revaluation" className={inputCls} /></Field>
        </div>
      </Card>
      <Section title="Lines" action={<span className="text-xs text-muted-foreground">Net qty: {net}</span>}>
        <LineGrid lines={lines} setLines={setLines} cols={cols} blank={() => ({ productId: "", warehouseId: "", qty: 0 })} footer={<div className="flex justify-end"><button type="button" onClick={postJournal} className={btn.primary}>Post Stock Journal</button></div>} />
        {msg && <p className={cn("text-sm", msg.ok ? "text-success" : "text-destructive")}>{msg.text}</p>}
      </Section>
      {journals.length > 0 && (
        <Section title="Posted journals">
          <ul className="divide-y divide-border text-sm">{[...journals].reverse().slice(0, 10).map((j) => <li key={j.id} className="flex justify-between py-1.5"><span><b className="font-mono">{String(j.number)}</b> · {longDate(j.date)} · {String(j.reason || "—")}</span><span className="tabular-nums">{money(num(j.inValue) || num(j.outValue))}</span></li>)}</ul>
        </Section>
      )}
    </div>
  );
}

/* ---------- reconciliation ---------- */

export function Reconciliation() {
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const [wh, setWh] = useState("");
  const [snapshot, setSnapshot] = useState<{ warehouseId: string; rows: { productId: string; system: number; counted: string }[] } | null>(null);
  const [msg, setMsg] = useState("");

  function load() {
    const ids = wh ? [wh] : warehouses.map((w) => w.id);
    const rows = ids.flatMap((w) => products.filter(stockable).map((p) => ({ warehouseId: w, productId: p.id, system: onHand(p.id, w, moves), counted: "" })));
    setSnapshot({ warehouseId: wh, rows: rows.map(({ productId, system, counted, warehouseId }) => ({ productId: `${productId}|${warehouseId}`, system, counted })) });
    setMsg("");
  }

  function post() {
    if (!snapshot) return;
    const number = nextNumber("stock-counts", "CNT");
    let n = 0;
    for (const r of snapshot.rows) {
      if (r.counted === "") continue;
      const [productId, warehouseId] = r.productId.split("|");
      const diff = Number(r.counted) - r.system;
      if (!diff) continue;
      adjustStock({ date: today(), productId, warehouseId, qty: diff, reason: `Stock count ${number}`, reference: number });
      n++;
    }
    createRecord("stock-counts", { number, date: today(), warehouseId: snapshot.warehouseId, adjustments: n });
    setMsg(n ? `Posted ${n} adjustment(s) from count ${number}.` : "Counts match the system — nothing to adjust.");
    setSnapshot(null);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Stock Reconciliation" />
      <Card>
        <div className="space-y-3 p-4">
          <CardTitle className="text-sm">Select Warehouse</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select ariaLabel="Warehouse" size="sm" value={wh} onChange={setWh} options={[{ value: "", label: "All warehouses" }, ...warehouses.map((w) => ({ value: w.id, label: String(w.name) }))]} className="w-52" />
            <button type="button" disabled={!warehouses.length} onClick={load} className={btn.smPrimary}>Load Snapshot</button>
          </div>
          {!warehouses.length && <p className="text-xs text-muted-foreground">Add a warehouse first.</p>}
          {msg && <p className="text-sm text-success">{msg}</p>}
        </div>
      </Card>
      {snapshot && (
        <Section title={`Count sheet · ${snapshot.rows.length} line(s)`} action={<button type="button" onClick={post} className={btn.smPrimary}>Post adjustments</button>}>
          {snapshot.rows.length === 0 ? <p className="text-sm text-muted-foreground">No stock-tracked products.</p> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 font-medium">Warehouse</th><th className="py-2 text-right font-medium">System</th><th className="w-28 py-2 pl-3 font-medium">Counted</th><th className="py-2 text-right font-medium">Difference</th></tr></thead>
              <tbody>
                {snapshot.rows.map((r, i) => {
                  const [pid, wid] = r.productId.split("|");
                  const diff = r.counted === "" ? null : Number(r.counted) - r.system;
                  return (
                    <tr key={r.productId} className="border-b border-border/60">
                      <td className="py-1.5">{name(products, pid)}</td><td className="py-1.5">{name(warehouses, wid)}</td><td className="py-1.5 text-right tabular-nums">{r.system}</td>
                      <td className="py-1.5 pl-3"><input aria-label={`Counted ${name(products, pid)}`} type="number" min="0" value={r.counted} onChange={(e) => setSnapshot({ ...snapshot, rows: snapshot.rows.map((x, k) => (k === i ? { ...x, counted: e.target.value } : x)) })} className={cn(inputCls, "h-8 text-right")} /></td>
                      <td className={cn("py-1.5 text-right tabular-nums", diff && (diff < 0 ? "text-destructive" : "text-success"))}>{diff === null ? "—" : diff > 0 ? `+${diff}` : diff}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Section>
      )}
    </div>
  );
}

/* ---------- stock ledger ---------- */

export function StockLedger() {
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const [f, setF] = useState({ product: "", warehouse: "", type: "", from: "", to: "" });
  const rows = useMemo(() => {
    const sorted = [...moves].sort((a, b) => String(a.date).localeCompare(String(b.date)) || String(a.createdAt).localeCompare(String(b.createdAt)));
    const running = new Map<string, number>();
    return sorted
      .map((m) => {
        const k = `${m.productId}|${m.warehouseId}`;
        running.set(k, (running.get(k) ?? 0) + num(m.qty));
        return { ...m, balance: Math.round((running.get(k) ?? 0) * 1000) / 1000 };
      })
      .filter((m) => (!f.product || m.productId === f.product) && (!f.warehouse || m.warehouseId === f.warehouse) && (!f.type || m.type === f.type) && (!f.from || String(m.date) >= f.from) && (!f.to || String(m.date) <= f.to))
      .reverse();
  }, [moves, f]);
  return (
    <div className="space-y-4">
      <PageHeader title="Stock Ledger" subtitle="Transaction log of all stock movements" />
      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-5">
          <Field label="Product"><ProductPicker size="md" value={f.product} onChange={(id) => setF({ ...f, product: id })} placeholder="All products" /></Field>
          <Field label="Warehouse"><Select value={f.warehouse} onChange={(v) => setF({ ...f, warehouse: v })} options={[{ value: "", label: "All warehouses" }, ...warehouses.map((w) => ({ value: w.id, label: String(w.name) }))]} /></Field>
          <Field label="Type"><Select value={f.type} onChange={(v) => setF({ ...f, type: v })} options={[{ value: "", label: "All types" }, ...MOVE_TYPES]} /></Field>
          <Field label="From"><DateInput value={f.from} onChange={(v) => setF({ ...f, from: v })} /></Field>
          <Field label="To"><DateInput value={f.to} onChange={(v) => setF({ ...f, to: v })} /></Field>
        </div>
        {f.product && <button type="button" onClick={() => setF({ ...f, product: "" })} className="-mt-2 mb-2 ml-4 text-xs text-primary hover:underline">Clear product</button>}
      </Card>
      <Card>
        <div className="p-4">
          {rows.length === 0 ? <EmptyState icon={ScrollText} title="No stock movements" text="No movements match the selected filters." /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground">{["Date", "Product", "Warehouse", "Type", "Reference", "Qty", "Unit Cost", "Value", "Balance"].map((h) => <th key={h} className={cn("py-2 font-medium", ["Qty", "Unit Cost", "Value", "Balance"].includes(h) && "text-right")}>{h}</th>)}</tr></thead>
                <tbody>
                  {rows.map((m) => (
                    <tr key={m.id} className="border-b border-border/60">
                      <td className="py-1.5">{longDate(m.date)}</td><td className="py-1.5">{name(products, m.productId)}</td><td className="py-1.5">{name(warehouses, m.warehouseId)}</td><td className="py-1.5"><StatusBadge status={m.type} /></td>
                      <td className="py-1.5 text-muted-foreground">{String(m.reference ?? "")}</td>
                      <td className={cn("py-1.5 text-right tabular-nums", num(m.qty) < 0 ? "text-destructive" : num(m.qty) > 0 && "text-success")}>{num(m.qty) > 0 ? `+${m.qty}` : num(m.qty) === 0 ? "value" : m.qty}</td>
                      <td className="py-1.5 text-right tabular-nums">{num(m.qty) ? money(num(m.unitCost)) : "—"}</td><td className="py-1.5 text-right tabular-nums">{money(num(m.value))}</td><td className="py-1.5 text-right font-medium tabular-nums">{m.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------- aging ---------- */

const BUCKETS = [
  { key: "0-30", label: "0-30 days", min: 0, max: 30, tone: "bg-muted text-foreground" },
  { key: "31-60", label: "31-60 days", min: 31, max: 60, tone: "bg-muted text-foreground" },
  { key: "61-90", label: "61-90 days", min: 61, max: 90, tone: "bg-muted text-foreground" },
  { key: "91-180", label: "91-180 days", min: 91, max: 180, tone: "bg-primary text-primary-foreground" },
  { key: "180+", label: "180+ days", min: 181, max: Infinity, tone: "bg-destructive text-destructive-foreground" },
];

export function StockAging() {
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const now = today();
  const rows = useMemo(() => balances(moves).filter((b) => b.qty > 0).map((b) => ({ ...b, age: b.lastMove ? daysBetween(b.lastMove, now) : 0 })).sort((a, b) => b.age - a.age), [moves, now]);
  return (
    <div className="space-y-4">
      <PageHeader title="Stock Aging" subtitle="On-hand inventory value bucketed by days since last movement" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {BUCKETS.map((bk) => {
          const inB = rows.filter((r) => r.age >= bk.min && r.age <= bk.max);
          return (
            <Card key={bk.key}>
              <div className="p-4">
                <p className="flex items-center justify-between text-xs text-muted-foreground">{bk.label}<span className={cn("rounded-full px-2 text-[11px] font-semibold", bk.tone)}>{inB.reduce((s, r) => s + r.qty, 0)}</span></p>
                <p className="mt-2 text-xl font-bold tabular-nums">{money(inB.reduce((s, r) => s + r.value, 0))}</p>
                <p className="text-xs text-muted-foreground">{inB.length} items</p>
              </div>
            </Card>
          );
        })}
      </div>
      <Card>
        <div className="p-4">
          {rows.length === 0 ? <EmptyState icon={Hourglass} title="No on-hand stock" text="No products with positive on-hand quantity were found." /> : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 font-medium">Warehouse</th><th className="py-2 font-medium">Last movement</th><th className="py-2 text-right font-medium">Days</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Value</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r.productId + r.warehouseId} className="border-b border-border/60"><td className="py-1.5">{name(products, r.productId)}</td><td className="py-1.5">{name(warehouses, r.warehouseId)}</td><td className="py-1.5">{longDate(r.lastMove)}</td><td className={cn("py-1.5 text-right tabular-nums", r.age > 90 && "text-destructive")}>{r.age}</td><td className="py-1.5 text-right tabular-nums">{r.qty}</td><td className="py-1.5 text-right tabular-nums">{money(r.value)}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------- scrap ---------- */

const SCRAP_REASONS = ["Damaged", "Expired", "Quality reject", "Lost / missing", "Other"];

export function Scrap() {
  const scraps = useCollection("scrap-orders");
  const products = useProducts();
  const warehouses = useWarehouses();
  const [open, setOpen] = useState(false);
  const columns: Column<Rec>[] = [
    { key: "num", header: "Scrap #", cell: (s) => <span className="font-mono text-sm">{String(s.number)}</span> },
    { key: "d", header: "Date", cell: (s) => longDate(s.date) },
    { key: "p", header: "Product", cell: (s) => <span className="font-medium">{name(products, s.productId)}</span> },
    { key: "w", header: "Warehouse", cell: (s) => name(warehouses, s.warehouseId) },
    { key: "q", header: "Qty", cell: (s) => num(s.qty) },
    { key: "r", header: "Reason", cell: (s) => String(s.reason) },
    { key: "v", header: "Loss", cell: (s) => money(num(s.value)) },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Scrap" subtitle="Write damaged, expired or lost stock out with a reason. The loss is valued at average cost and posted to the ledger." actions={<button type="button" onClick={() => setOpen(true)} className={btn.primary}><Trash2 /> Scrap stock</button>} />
      {scraps.length === 0 ? <EmptyCard>No scrap orders yet.</EmptyCard> : <DataTable columns={columns} rows={[...scraps].reverse()} />}
      {open && <ScrapDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function ScrapDialog({ onClose }: { onClose: () => void }) {
  const moves = useMoves();
  const bins = useCollection("bins");
  const batches = useCollection("product-batches");
  const [f, setF] = useState({ productId: "", warehouseId: "", bin: "", batchId: "", qty: "", reason: "Damaged", notes: "" });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const avail = f.productId && f.warehouseId ? onHand(f.productId, f.warehouseId, moves) : null;
  const qty = num(f.qty);
  const valid = f.productId && f.warehouseId && qty > 0 && avail !== null && qty <= avail;
  return (
    <Dialog open onClose={onClose} title="Scrap stock" className="max-w-lg">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Product"><ProductPicker size="md" value={f.productId} onChange={(id) => set({ productId: id, batchId: "" })} placeholder="Select…" /></Field>
        <Field label="Warehouse"><WarehousePicker value={f.warehouseId} onChange={(id) => set({ warehouseId: id, bin: "" })} /></Field>
        <Field label={<>Bin <span className="font-normal text-muted-foreground">(optional)</span></>}><Select value={f.bin} onChange={(v) => set({ bin: v })} placeholder="No bin" options={bins.filter((b) => b.warehouseId === f.warehouseId).map((b) => String(b.code))} /></Field>
        <Field label={<>Batch <span className="font-normal text-muted-foreground">(optional)</span></>}><Select value={f.batchId} onChange={(v) => set({ batchId: v })} placeholder="No batch" options={batches.filter((b) => b.productId === f.productId && num(b.qty) > 0).map((b) => ({ value: b.id, label: `${b.batchNumber} (${num(b.qty)})` }))} /></Field>
        <Field label="Quantity" htmlFor="sc-qty" hint={avail !== null ? `${avail} on hand` : undefined}><input id="sc-qty" type="number" min="0" step="any" value={f.qty} onChange={(e) => set({ qty: e.target.value })} className={inputCls} /></Field>
        <Field label="Reason"><Select value={f.reason} onChange={(v) => set({ reason: v })} options={SCRAP_REASONS} /></Field>
        <Field label="Notes" className="sm:col-span-2"><textarea aria-label="Notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} className={cn(inputCls, "h-16 py-2")} /></Field>
      </div>
      {avail !== null && qty > avail && <p className="text-sm text-destructive">Only {avail} on hand in that warehouse.</p>}
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            const number = nextNumber("scrap-orders", "SCR");
            const value = scrapStock({ date: today(), productId: f.productId, warehouseId: f.warehouseId, qty, reason: f.reason, bin: f.bin, batchId: f.batchId, number });
            createRecord("scrap-orders", { ...f, number, qty, value, date: today() });
            onClose();
          }}
          className={cn(btn.primary, "bg-destructive hover:bg-destructive/90")}
        >
          Scrap
        </button>
      </div>
    </Dialog>
  );
}

/* ---------- bins & locations ---------- */

export function BinsLocations() {
  const warehouses = useWarehouses();
  const bins = useCollection("bins");
  const binMoves = useCollection("bin-moves");
  const products = useProducts();
  const moves = useMoves();
  const [wh, setWh] = useState("");
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [mv, setMv] = useState({ productId: "", from: "", to: "", qty: "" });
  const here = bins.filter((b) => b.warehouseId === wh);

  // Bin quantity = bin-tagged stock moves + physical bin-to-bin moves; the rest is unbinned.
  const binQty = (pid: string, bin: string) =>
    moves.filter((m) => m.productId === pid && m.warehouseId === wh && m.bin === bin).reduce((s, m) => s + num(m.qty), 0) +
    binMoves.filter((m) => m.productId === pid && m.warehouseId === wh).reduce((s, m) => s + (m.to === bin ? num(m.qty) : 0) - (m.from === bin ? num(m.qty) : 0), 0);
  const stocked = wh ? products.filter((p) => onHand(p.id, wh, moves) !== 0) : [];
  const unbinned = (pid: string) => onHand(pid, wh, moves) - here.reduce((s, b) => s + binQty(pid, String(b.code)), 0);
  const fromQty = mv.productId ? (mv.from ? binQty(mv.productId, mv.from) : unbinned(mv.productId)) : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Bins & Locations" subtitle="Named bins inside each warehouse. Bin moves are physical only — valuation and GL stay at warehouse level." />
      <Select ariaLabel="Warehouse" size="sm" value={wh} onChange={setWh} placeholder="Warehouse…" options={warehouses.map((w) => ({ value: w.id, label: String(w.name) }))} className="w-56" />
      {(
        <>
          <Section title={<span className="flex items-center gap-2"><Boxes className="h-4 w-4" /> Bins</span>}>
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Code" hint="Unique ID, used to identify this bin in stock moves and picking." className="w-40"><input aria-label="Bin code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="A-01-01" className={inputCls} /></Field>
              <Field label={<>Name <span className="font-normal text-muted-foreground">(optional)</span></>} hint="Description shown only on this page, to help staff find it." className="w-56"><input aria-label="Bin name" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rack A, shelf 1" className={inputCls} /></Field>
              <button type="button" disabled={!wh || !code.trim() || here.some((b) => b.code === code.trim())} title={wh ? undefined : "Pick a warehouse first"} onClick={() => { createRecord("bins", { warehouseId: wh, code: code.trim(), name: label.trim() }); setCode(""); setLabel(""); }} className={cn(btn.smPrimary, "mb-6")}><Plus /> Add bin</button>
            </div>
            {here.length > 0 && <div className="flex flex-wrap gap-2">{here.map((b) => <span key={b.id} className="rounded-md border border-border px-2.5 py-1 text-sm"><b className="font-mono">{String(b.code)}</b>{b.name ? <span className="text-muted-foreground"> · {String(b.name)}</span> : null}</span>)}</div>}
          </Section>
          {here.length > 0 && stocked.length > 0 && (
            <Section title="Move between bins">
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Product" className="w-56"><ProductPicker size="md" value={mv.productId} onChange={(id) => setMv({ ...mv, productId: id })} /></Field>
                <Field label="From" className="w-36"><Select value={mv.from} onChange={(v) => setMv({ ...mv, from: v })} placeholder="Unbinned" options={here.map((b) => String(b.code))} /></Field>
                <Field label="To" className="w-36"><Select value={mv.to} onChange={(v) => setMv({ ...mv, to: v })} placeholder="Unbinned" options={here.map((b) => String(b.code))} /></Field>
                <Field label="Qty" hint={mv.productId ? `${fromQty} available` : undefined} className="w-24"><input aria-label="Move quantity" type="number" min="0" value={mv.qty} onChange={(e) => setMv({ ...mv, qty: e.target.value })} className={inputCls} /></Field>
                <button type="button" disabled={!mv.productId || mv.from === mv.to || num(mv.qty) <= 0 || num(mv.qty) > fromQty} onClick={() => { createRecord("bin-moves", { warehouseId: wh, productId: mv.productId, from: mv.from, to: mv.to, qty: num(mv.qty), date: today() }); setMv({ productId: "", from: "", to: "", qty: "" }); }} className={cn(btn.smPrimary, mv.productId ? "mb-6" : "")}>Move</button>
              </div>
            </Section>
          )}
          <Section title="Stock by bin">
            {!wh || stocked.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No stock in this warehouse.</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th>{here.map((b) => <th key={b.id} className="py-2 text-right font-mono font-medium">{String(b.code)}</th>)}<th className="py-2 text-right font-medium">Unbinned</th><th className="py-2 text-right font-medium">Total</th></tr></thead>
                <tbody>{stocked.map((p) => <tr key={p.id} className="border-b border-border/60"><td className="py-1.5">{String(p.name)}</td>{here.map((b) => <td key={b.id} className="py-1.5 text-right tabular-nums">{binQty(p.id, String(b.code)) || "—"}</td>)}<td className="py-1.5 text-right tabular-nums">{unbinned(p.id)}</td><td className="py-1.5 text-right font-medium tabular-nums">{onHand(p.id, wh, moves)}</td></tr>)}</tbody>
              </table>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

/* ---------- scan station ---------- */

type ScanMode = "RECEIVE" | "PICK" | "COUNT";

export function ScanStation() {
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const [mode, setMode] = useState<ScanMode>("RECEIVE");
  const [wh, setWh] = useState("");
  const [code, setCode] = useState("");
  const [log, setLog] = useState<{ text: string; ok: boolean }[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const input = useRef<HTMLInputElement>(null);

  function scan() {
    const c = code.trim();
    setCode("");
    input.current?.focus();
    if (!c) return;
    if (!wh) return setLog((l) => [{ text: "Pick a warehouse first.", ok: false }, ...l]);
    const p = products.find((x) => String(x.barcode ?? "") === c || String(x.sku).toLowerCase() === c.toLowerCase());
    if (!p) return setLog((l) => [{ text: `${c} — no product with that barcode or SKU.`, ok: false }, ...l]);
    if (mode === "COUNT") {
      setCounts((x) => ({ ...x, [p.id]: (x[p.id] ?? 0) + 1 }));
      return setLog((l) => [{ text: `Counted ${p.name} (${(counts[p.id] ?? 0) + 1})`, ok: true }, ...l]);
    }
    if (mode === "PICK" && onHand(p.id, wh, moves) < 1) return setLog((l) => [{ text: `${p.name} — none on hand to pick.`, ok: false }, ...l]);
    adjustStock({ date: today(), productId: p.id, warehouseId: wh, qty: mode === "RECEIVE" ? 1 : -1, reason: mode === "RECEIVE" ? "Scan receive" : "Scan pick", reference: `Scan ${mode.toLowerCase()}` });
    setLog((l) => [{ text: `${mode === "RECEIVE" ? "Received" : "Picked"} 1 × ${p.name} — now ${onHand(p.id, wh) } on hand`, ok: true }, ...l]);
  }

  function applyCounts() {
    let n = 0;
    for (const [pid, counted] of Object.entries(counts)) {
      const diff = counted - onHand(pid, wh, moves);
      if (diff) { adjustStock({ date: today(), productId: pid, warehouseId: wh, qty: diff, reason: "Scan cycle count" }); n++; }
    }
    setCounts({});
    setLog((l) => [{ text: n ? `Cycle count applied — ${n} product(s) adjusted.` : "Cycle count matches the system.", ok: true }, ...l]);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Scan Station" subtitle="Barcode-driven receive, pick and cycle count. Scan or type a barcode/SKU and press Enter." />
      <div className="flex flex-wrap items-end gap-3">
        <div className="inline-flex rounded-lg bg-muted p-1 text-sm">
          {(["RECEIVE", "PICK", "COUNT"] as ScanMode[]).map((m) => <button key={m} type="button" onClick={() => setMode(m)} className={cn("rounded-md px-3 py-1 font-medium", mode === m ? "bg-background shadow-sm" : "text-muted-foreground")}>{m.charAt(0) + m.slice(1).toLowerCase()}</button>)}
        </div>
        <Field label="Warehouse" className="w-52"><Select ariaLabel="Warehouse" size="sm" value={wh} onChange={setWh} placeholder="Warehouse…" options={warehouses.map((w) => ({ value: w.id, label: String(w.name) }))} /></Field>
      </div>
      <Section title={<span className="flex items-center gap-2"><ScanBarcode className="h-4 w-4" /> Scan</span>}>
        <input ref={input} autoFocus aria-label="Scan barcode or SKU" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && scan()} placeholder="Scan barcode or type SKU, then Enter…" className={cn(inputCls, "max-w-md font-mono")} />
        {mode === "COUNT" && Object.keys(counts).length > 0 && (
          <div className="space-y-2 rounded-md border border-border p-3 text-sm">
            {Object.entries(counts).map(([pid, c]) => <p key={pid} className="flex justify-between"><span>{name(products, pid)}</span><span className="tabular-nums">counted {c} · system {onHand(pid, wh, moves)}</span></p>)}
            <button type="button" onClick={applyCounts} className={btn.smPrimary}>Apply counts</button>
          </div>
        )}
        {log.length > 0 && <ul className="max-h-60 space-y-1 overflow-y-auto text-sm">{log.map((l, i) => <li key={i} className={l.ok ? "text-foreground" : "text-destructive"}>{l.text}</li>)}</ul>}
      </Section>
    </div>
  );
}

/* ---------- stock history (till requests) ---------- */

export function StockHistory() {
  const requests = useCollection("stock-change-requests");
  const now = today();
  const [from, setFrom] = useState(`${now.slice(0, 7)}-01`);
  const [to, setTo] = useState(now);
  const [outcome, setOutcome] = useState("");
  const [type, setType] = useState("");
  const rows = requests.filter((r) => String(r.date) >= from && String(r.date) <= to && (!outcome || r.outcome === outcome) && (!type || r.type === type));
  return (
    <div className="space-y-4">
      <PageHeader title="Stock history" subtitle="Every stock correction, new product and scrap raised from a till — who raised it, and who approved or rejected it" />
      <Card>
        <div className="flex flex-wrap items-end gap-3 p-4">
          <Field label="From"><DateInput value={from} onChange={setFrom} className="w-40" /></Field>
          <Field label="To"><DateInput value={to} onChange={setTo} className="w-40" /></Field>
          <Field label="Outcome"><Select value={outcome} onChange={setOutcome} options={[{ value: "", label: "Everything" }, { value: "APPROVED", label: "Approved" }, { value: "REJECTED", label: "Rejected" }, { value: "PENDING", label: "Still waiting" }]} className="w-40" /></Field>
          <Field label="Type"><Select value={type} onChange={setType} options={[{ value: "", label: "All types" }, { value: "CORRECTION", label: "Stock correction" }, { value: "NEW_PRODUCT", label: "New product" }, { value: "SCRAP", label: "Scrap" }, { value: "CATEGORY_SCRAP", label: "Category scrap" }]} className="w-44" /></Field>
        </div>
      </Card>
      {rows.length === 0 ? (
        <Card><div className="p-6"><EmptyState icon={FileText} title="Nothing in this period" text="No stock change was raised from a till between these dates." /></div></Card>
      ) : (
        <DataTable columns={[{ key: "d", header: "Date", cell: (r) => longDate(r.date) }, { key: "t", header: "Type", cell: (r) => String(r.type) }, { key: "by", header: "Raised by", cell: (r) => String(r.raisedBy ?? "—") }, { key: "o", header: "Outcome", cell: (r) => <StatusBadge status={r.outcome} /> }]} rows={rows} />
      )}
    </div>
  );
}

