"use client";

// Quality, reorder rules, batches, serials, bills of materials, landed costs and the
// analytics ("Intelligence") views.

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartColumn, ClipboardCheck, Hammer, ListOrdered, Package, Plus, ShoppingCart, TrendingUp, TriangleAlert } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { balances, onHand, recordMove, useMoves, valuation, type Move } from "@/lib/stock";
import { createJournal, findAccountByCode } from "@/lib/ledger";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Card, DataTable, DateInput, Dialog, Field, PageHeader, Select, SidePanel, btn, inputCls, longDate, money, num, textareaCls, today, type Column } from "@/components/accounting/kit";
import { Section, StatusBadge } from "@/components/sales/doc-kit";
import { LineGrid, ProductPicker, TotalRow, WarehousePicker, numInput, subOf, useWarehouses, type GridCol } from "@/components/purchasing/kit";
import { useProducts } from "./catalog";

const name = (rows: Rec[], id: unknown, fallback = "—") => String(rows.find((r) => r.id === id)?.name ?? fallback);
const sku = (rows: Rec[], id: unknown) => String(rows.find((r) => r.id === id)?.sku ?? "—");
const daysBetween = (a: string, b: string) => Math.floor((Date.parse(b) - Date.parse(a)) / 86400000);

/* ---------- quality ---------- */

const TRIGGERS = [{ value: "GOODS_RECEIPT", label: "Goods receipt" }, { value: "PRODUCTION", label: "Production" }, { value: "TRANSFER", label: "Transfer" }];
const CHECK_TYPES = [{ value: "PASS_FAIL", label: "Pass / fail" }, { value: "MEASUREMENT", label: "Measurement" }];

export function Quality() {
  const products = useProducts();
  const points = useCollection("quality-points");
  const checks = useCollection("quality-checks");
  const [f, setF] = useState({ name: "", trigger: "GOODS_RECEIPT", productId: "", checkType: "PASS_FAIL", instructions: "", min: "", max: "" });
  const [view, setView] = useState("PENDING");
  const [values, setValues] = useState<Record<string, string>>({});
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const rows = checks.filter((c) => view === "ALL" || (view === "FAILED" ? c.status === "FAILED" : c.status === view)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

  function record(c: Rec, pass?: boolean) {
    if (c.type === "MEASUREMENT") {
      const point = points.find((p) => p.id === c.pointId);
      const v = Number(values[c.id]);
      if (values[c.id] === undefined || Number.isNaN(v)) return;
      const ok = (point?.min === "" || point?.min === undefined || v >= num(point.min)) && (point?.max === "" || point?.max === undefined || v <= num(point.max));
      updateRecord("quality-checks", c.id, { status: ok ? "PASSED" : "FAILED", value: v, checkedBy: BRAND.user.fullName, checkedAt: today() });
    } else updateRecord("quality-checks", c.id, { status: pass ? "PASSED" : "FAILED", checkedBy: BRAND.user.fullName, checkedAt: today() });
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Quality" subtitle="Control points on goods receipt, production and transfers — matching events create pending checks; failures are your alert queue." />
      <Section title={<span className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Control points</span>}>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Name" className="w-44 [&_label]:text-xs"><input aria-label="Name" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Incoming inspection" className={cn(inputCls, "h-8")} /></Field>
          <Field label="Trigger" className="w-36 [&_label]:text-xs"><Select size="sm" ariaLabel="Trigger" value={f.trigger} onChange={(v) => set({ trigger: v })} options={TRIGGERS} /></Field>
          <Field label="Product" className="w-44 [&_label]:text-xs"><Select size="sm" ariaLabel="Product" value={f.productId} onChange={(v) => set({ productId: v })} placeholder="All products" options={products.map((p) => ({ value: p.id, label: String(p.name) }))} /></Field>
          <Field label="Type" className="w-32 [&_label]:text-xs"><Select size="sm" ariaLabel="Type" value={f.checkType} onChange={(v) => set({ checkType: v })} options={CHECK_TYPES} /></Field>
          {f.checkType === "MEASUREMENT" && (
            <>
              <Field label="Min" className="w-20 [&_label]:text-xs"><input aria-label="Minimum" type="number" value={f.min} onChange={(e) => set({ min: e.target.value })} className={cn(inputCls, "h-8")} /></Field>
              <Field label="Max" className="w-20 [&_label]:text-xs"><input aria-label="Maximum" type="number" value={f.max} onChange={(e) => set({ max: e.target.value })} className={cn(inputCls, "h-8")} /></Field>
            </>
          )}
          <Field label="Instructions" className="min-w-40 flex-1 [&_label]:text-xs"><input aria-label="Instructions" value={f.instructions} onChange={(e) => set({ instructions: e.target.value })} className={cn(inputCls, "h-8")} /></Field>
          <button type="button" disabled={!f.name.trim()} onClick={() => { createRecord("quality-points", { ...f, name: f.name.trim(), active: true }); setF({ ...f, name: "", instructions: "", min: "", max: "" }); }} className={btn.smPrimary}><Plus /> Add</button>
        </div>
        {points.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border text-sm">
            {points.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span><b className="font-medium">{String(p.name)}</b> <span className="text-muted-foreground">· {TRIGGERS.find((t) => t.value === p.trigger)?.label} · {p.productId ? name(products, p.productId) : "all products"} · {CHECK_TYPES.find((t) => t.value === p.checkType)?.label}{p.checkType === "MEASUREMENT" ? ` (${p.min || "−∞"}–${p.max || "∞"})` : ""}</span></span>
                <span className="flex gap-2">
                  <button type="button" onClick={() => updateRecord("quality-points", p.id, { active: p.active === false })} className={btn.smOutline}>{p.active === false ? "Enable" : "Disable"}</button>
                  <button type="button" onClick={() => deleteRecord("quality-points", p.id)} className={cn(btn.smOutline, "text-destructive")}>Delete</button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Checks" action={<Select ariaLabel="Check status" size="sm" value={view} onChange={setView} options={[{ value: "PENDING", label: "Pending" }, { value: "FAILED", label: "Failed (alerts)" }, { value: "PASSED", label: "Passed" }, { value: "ALL", label: "All" }]} className="w-40" />}>
        {rows.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No checks in this view.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Check</th><th className="py-2 font-medium">Product</th><th className="py-2 font-medium">Source</th><th className="py-2 font-medium">Status</th><th className="py-2 text-right font-medium" /></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-b border-border/60">
                  <td className="py-2"><b className="font-medium">{String(c.point)}</b>{c.instructions ? <span className="block text-xs text-muted-foreground">{String(c.instructions)}</span> : null}</td>
                  <td className="py-2">{name(products, c.productId)} × {num(c.qty)}</td>
                  <td className="py-2 text-muted-foreground">{String(c.source)} · {longDate(c.date)}</td>
                  <td className="py-2"><StatusBadge status={c.status} />{c.value !== undefined ? <span className="ml-1 text-xs text-muted-foreground">{String(c.value)}</span> : null}</td>
                  <td className="py-2 text-right">
                    {c.status === "PENDING" && (c.type === "MEASUREMENT" ? (
                      <span className="inline-flex gap-1"><input aria-label="Measured value" type="number" value={values[c.id] ?? ""} onChange={(e) => setValues({ ...values, [c.id]: e.target.value })} className={cn(inputCls, "h-8 w-24")} /><button type="button" onClick={() => record(c)} className={btn.smPrimary}>Record</button></span>
                    ) : (
                      <span className="inline-flex gap-1"><button type="button" onClick={() => record(c, true)} className={btn.smPrimary}>Pass</button><button type="button" onClick={() => record(c, false)} className={cn(btn.smOutline, "text-destructive")}>Fail</button></span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

/* ---------- reorder rules ---------- */

const R_BASE = "/inventory/reorder-rules";

export function ReorderRules() {
  const router = useRouter();
  const sub = subOf(usePathname(), R_BASE);
  const rules = useCollection("reorder-rules");
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const close = () => router.push(R_BASE);
  const low = (r: Rec) => onHand(String(r.productId), String(r.warehouseId), moves) <= num(r.reorderPoint);
  const columns: Column<Rec>[] = [
    { key: "sku", header: "SKU", cell: (r) => <span className="font-mono text-xs">{sku(products, r.productId)}</span> },
    { key: "p", header: "Product", cell: (r) => <span className="font-medium">{name(products, r.productId)}</span> },
    { key: "w", header: "Warehouse", cell: (r) => name(warehouses, r.warehouseId) },
    { key: "rp", header: "Reorder Point", cell: (r) => num(r.reorderPoint) },
    { key: "rq", header: "Reorder Qty", cell: (r) => num(r.reorderQty) },
    { key: "max", header: "Max Level", cell: (r) => (r.maxLevel ? num(r.maxLevel) : "—") },
    { key: "s", header: "Status", cell: (r) => (r.active === false ? <StatusBadge status="INACTIVE" /> : low(r) ? <StatusBadge status="OVERDUE" /> : <StatusBadge status="ACTIVE" />) },
  ];
  const detail = sub && sub !== "new" ? rules.find((r) => r.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Reorder Rules" actions={<Link href={`${R_BASE}/new`} className={btn.primary}><Plus /> New Rule</Link>} />
      <DataTable
        columns={columns}
        rows={rules}
        onRowClick={(r) => router.push(`${R_BASE}/${r.id}`)}
        menu={(r) => [
          { label: "Raise requisition", onSelect: () => { raiseRequisition([{ productId: String(r.productId), qty: reorderQty(r, moves) }]); router.push("/inventory/purchase-requisitions"); } },
          { label: r.active === false ? "Activate" : "Deactivate", onSelect: () => updateRecord("reorder-rules", r.id, { active: r.active === false }) },
          { label: "Delete", destructive: true, onSelect: () => deleteRecord("reorder-rules", r.id) },
        ]}
      />
      <p className="text-xs text-muted-foreground">A rule shows <b>OVERDUE</b> when on-hand stock is at or below its reorder point.</p>
      {sub === "new" && <SidePanel onClose={close}><RuleForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><RuleForm key={detail.id} record={detail} onDone={close} /></SidePanel>}
    </div>
  );
}

// Order up to the max level when one is set; otherwise the rule's reorder quantity.
const reorderQty = (r: Rec, moves: Move[]) => {
  const have = onHand(String(r.productId), String(r.warehouseId), moves);
  return Math.max(num(r.reorderQty), num(r.maxLevel) > 0 ? num(r.maxLevel) - have : 0);
};

function raiseRequisition(lines: { productId: string; qty: number }[]) {
  const products = readCollection("products");
  const ls = lines.filter((l) => l.qty > 0).map((l) => { const p = products.find((x) => x.id === l.productId); return { productId: l.productId, description: String(p?.name ?? ""), qty: l.qty, uom: String(p?.uom ?? ""), estPrice: num(p?.cost), vendor: "" }; });
  if (!ls.length) return;
  createRecord("purchase-requisitions", { number: nextNumber("purchase-requisitions", "PR"), title: "Replenishment (reorder rules)", priority: "NORMAL", lines: ls, total: ls.reduce((s, l) => s + l.qty * l.estPrice, 0), requestedBy: BRAND.user.fullName, status: "DRAFT" });
}

function RuleForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const rules = useCollection("reorder-rules");
  const [f, setF] = useState({ productId: String(record?.productId ?? ""), warehouseId: String(record?.warehouseId ?? ""), reorderPoint: String(record?.reorderPoint ?? ""), reorderQty: String(record?.reorderQty ?? ""), maxLevel: String(record?.maxLevel ?? "") });
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const valid = f.productId && f.warehouseId && f.reorderPoint !== "" && num(f.reorderQty) > 0;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return;
    if (rules.some((r) => r.id !== record?.id && r.productId === f.productId && r.warehouseId === f.warehouseId)) return setError("That product already has a rule for this warehouse.");
    if (f.maxLevel && num(f.maxLevel) <= num(f.reorderPoint)) return setError("Max level must be above the reorder point.");
    const data = { ...f, reorderPoint: num(f.reorderPoint), reorderQty: num(f.reorderQty), maxLevel: num(f.maxLevel) };
    if (record) updateRecord("reorder-rules", record.id, data);
    else createRecord("reorder-rules", { ...data, active: true });
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? "Reorder Rule" : "New Reorder Rule"}</h1>
      <Section title="Rule Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product"><ProductPicker size="md" value={f.productId} onChange={(id) => set({ productId: id })} placeholder="Select product" /></Field>
          <Field label="Warehouse"><WarehousePicker value={f.warehouseId} onChange={(id) => set({ warehouseId: id })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Reorder Point" htmlFor="rr-point"><input id="rr-point" type="number" min="0" value={f.reorderPoint} onChange={(e) => set({ reorderPoint: e.target.value })} className={inputCls} /></Field>
          <Field label="Reorder Quantity" htmlFor="rr-qty"><input id="rr-qty" type="number" min="0" value={f.reorderQty} onChange={(e) => set({ reorderQty: e.target.value })} className={inputCls} /></Field>
          <Field label="Max Level (optional)" htmlFor="rr-max"><input id="rr-max" type="number" min="0" value={f.maxLevel} onChange={(e) => set({ maxLevel: e.target.value })} className={inputCls} /></Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
          <button type="submit" disabled={!valid} className={btn.primary}>{record ? "Save Rule" : "Create Rule"}</button>
        </div>
      </Section>
    </form>
  );
}

/* ---------- batches ---------- */

const B_BASE = "/inventory/batches";

const batchStatus = (b: Rec, now: string) => (num(b.qty) <= 0 ? "DEPLETED" : b.expiryDate && String(b.expiryDate) < now ? "EXPIRED" : "ACTIVE");

export function Batches() {
  const router = useRouter();
  const sub = subOf(usePathname(), B_BASE);
  const batches = useCollection("product-batches");
  const products = useProducts();
  const warehouses = useWarehouses();
  const now = today();
  const [plan, setPlan] = useState({ productId: "", warehouseId: "", qty: "" });
  const [result, setResult] = useState<{ batch: Rec; take: number }[] | null>(null);
  const close = () => router.push(B_BASE);

  // FEFO by default (earliest expiry first); FIFO/LIFO by receipt date when the product says so.
  function planPick() {
    const p = products.find((x) => x.id === plan.productId);
    const strategy = String(p?.removalStrategy ?? "FEFO");
    const pool = batches.filter((b) => b.productId === plan.productId && (!plan.warehouseId || b.warehouseId === plan.warehouseId) && batchStatus(b, now) === "ACTIVE");
    pool.sort((a, b) => (strategy === "LIFO" ? String(b.mfgDate || b.createdAt).localeCompare(String(a.mfgDate || a.createdAt)) : strategy === "FIFO" ? String(a.mfgDate || a.createdAt).localeCompare(String(b.mfgDate || b.createdAt)) : String(a.expiryDate || "9999").localeCompare(String(b.expiryDate || "9999"))));
    let left = num(plan.qty);
    const out: { batch: Rec; take: number }[] = [];
    for (const b of pool) { if (left <= 0) break; const take = Math.min(left, num(b.qty)); out.push({ batch: b, take }); left -= take; }
    setResult(out);
  }

  const columns: Column<Rec>[] = [
    { key: "n", header: "Batch #", cell: (b) => <span className="font-mono text-sm">{String(b.batchNumber)}</span> },
    { key: "sku", header: "SKU", cell: (b) => <span className="font-mono text-xs">{sku(products, b.productId)}</span> },
    { key: "p", header: "Product", cell: (b) => <span className="font-medium">{name(products, b.productId)}</span> },
    { key: "q", header: "Qty", cell: (b) => num(b.qty) },
    { key: "e", header: "Expiry", cell: (b) => (b.expiryDate ? longDate(b.expiryDate) : "—") },
    { key: "w", header: "Warehouse", cell: (b) => name(warehouses, b.warehouseId) },
    { key: "s", header: "Status", cell: (b) => <StatusBadge status={batchStatus(b, now)} /> },
  ];
  const detail = sub && sub !== "new" ? batches.find((b) => b.id === sub) : undefined;
  const need = num(plan.qty);
  const planned = result?.reduce((s, r) => s + r.take, 0) ?? 0;
  return (
    <div className="space-y-4">
      <PageHeader title="Product Batches" subtitle="Track batch/lot numbers and expiry dates" actions={<Link href={`${B_BASE}/new`} className={btn.primary}><Plus /> New Batch</Link>} />
      <Card>
        <div className="space-y-3 p-4">
          <p className="flex items-center gap-1.5 text-sm"><ListOrdered className="h-4 w-4" /> <b className="font-semibold">Pick planner</b> <span className="text-muted-foreground">— which batches to pick, per the product&apos;s removal strategy (FEFO/FIFO/LIFO)</span></p>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Product" className="w-56 [&_label]:text-xs"><ProductPicker size="sm" value={plan.productId} onChange={(id) => { setPlan({ ...plan, productId: id }); setResult(null); }} placeholder="Select…" /></Field>
            <Field label="Warehouse (optional)" className="w-48 [&_label]:text-xs"><Select size="sm" ariaLabel="Warehouse" value={plan.warehouseId} onChange={(v) => setPlan({ ...plan, warehouseId: v })} placeholder="Any warehouse" options={warehouses.map((w) => ({ value: w.id, label: String(w.name) }))} /></Field>
            <Field label="Quantity" className="w-24 [&_label]:text-xs"><input aria-label="Pick quantity" type="number" min="0" value={plan.qty} onChange={(e) => setPlan({ ...plan, qty: e.target.value })} className={cn(inputCls, "h-8")} /></Field>
            <button type="button" disabled={!plan.productId || need <= 0} onClick={planPick} className={btn.smPrimary}>Plan pick</button>
          </div>
          {result && (
            result.length === 0 ? <p className="text-sm text-muted-foreground">No active batches for that product.</p> : (
              <div className="text-sm">
                <ol className="list-decimal space-y-0.5 pl-5">{result.map((r) => <li key={r.batch.id}>Pick <b>{r.take}</b> from batch <span className="font-mono">{String(r.batch.batchNumber)}</span>{r.batch.expiryDate ? ` (expires ${longDate(r.batch.expiryDate)})` : ""} · {name(warehouses, r.batch.warehouseId)}</li>)}</ol>
                {planned < need && <p className="mt-1 text-destructive">Short by {need - planned} — not enough in active batches.</p>}
              </div>
            )
          )}
        </div>
      </Card>
      <DataTable columns={columns} rows={batches} onRowClick={(b) => router.push(`${B_BASE}/${b.id}`)} menu={(b) => [{ label: "Delete", destructive: true, onSelect: () => deleteRecord("product-batches", b.id) }]} />
      {sub === "new" && <SidePanel onClose={close}><BatchForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><BatchForm key={detail.id} record={detail} onDone={close} /></SidePanel>}
    </div>
  );
}

function BatchForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const batches = useCollection("product-batches");
  const [f, setF] = useState({ productId: String(record?.productId ?? ""), batchNumber: String(record?.batchNumber ?? ""), qty: String(record?.qty ?? ""), warehouseId: String(record?.warehouseId ?? ""), mfgDate: String(record?.mfgDate ?? ""), expiryDate: String(record?.expiryDate ?? ""), notes: String(record?.notes ?? "") });
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.productId || !f.batchNumber.trim()) return setError("Product and batch number are required.");
    if (batches.some((b) => b.id !== record?.id && b.productId === f.productId && b.batchNumber === f.batchNumber.trim())) return setError("That batch number already exists for this product.");
    if (f.mfgDate && f.expiryDate && f.expiryDate < f.mfgDate) return setError("Expiry can't be before manufacture.");
    const data = { ...f, batchNumber: f.batchNumber.trim(), qty: num(f.qty) };
    if (record) updateRecord("product-batches", record.id, data);
    else createRecord("product-batches", data);
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? `Batch ${record.batchNumber}` : "New Product Batch"}</h1>
      <Section title="Batch Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product"><ProductPicker size="md" value={f.productId} onChange={(id) => set({ productId: id })} placeholder="Select product" /></Field>
          <Field label="Batch Number" htmlFor="b-num"><input id="b-num" value={f.batchNumber} onChange={(e) => set({ batchNumber: e.target.value })} placeholder="e.g., LOT-2024-001" className={inputCls} /></Field>
          <Field label="Quantity" htmlFor="b-qty" hint="Tracks how much of the stock on hand belongs to this lot; it doesn't move stock."><input id="b-qty" type="number" min="0" value={f.qty} onChange={(e) => set({ qty: e.target.value })} className={inputCls} /></Field>
          <Field label="Warehouse"><WarehousePicker value={f.warehouseId} onChange={(id) => set({ warehouseId: id })} /></Field>
          <Field label="Manufacturing Date"><DateInput value={f.mfgDate} onChange={(v) => set({ mfgDate: v })} /></Field>
          <Field label="Expiry Date"><DateInput value={f.expiryDate} onChange={(v) => set({ expiryDate: v })} /></Field>
        </div>
        <Field label="Notes"><textarea aria-label="Notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} className={textareaCls} /></Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="submit" className={btn.primary}>{record ? "Save Batch" : "Create Batch"}</button><button type="button" onClick={onDone} className={btn.outline}>Cancel</button></div>
      </Section>
    </form>
  );
}

/* ---------- serials ---------- */

const S_BASE = "/inventory/serials";
const SERIAL_STATUSES = ["IN_STOCK", "SOLD", "RETURNED", "SCRAPPED"];

export function Serials() {
  const router = useRouter();
  const sub = subOf(usePathname(), S_BASE);
  const serials = useCollection("serial-numbers");
  const products = useProducts();
  const warehouses = useWarehouses();
  const close = () => router.push(S_BASE);
  const columns: Column<Rec>[] = [
    { key: "n", header: "Serial #", cell: (s) => <span className="font-mono text-sm">{String(s.serial)}</span> },
    { key: "sku", header: "SKU", cell: (s) => <span className="font-mono text-xs">{sku(products, s.productId)}</span> },
    { key: "p", header: "Product", cell: (s) => <span className="font-medium">{name(products, s.productId)}</span> },
    { key: "w", header: "Warehouse", cell: (s) => name(warehouses, s.warehouseId) },
    { key: "st", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Serial Numbers" subtitle="Track individual product units by serial number" actions={<Link href={`${S_BASE}/new`} className={btn.primary}><Plus /> New Serial</Link>} />
      <DataTable columns={columns} rows={serials} menu={(s) => [...SERIAL_STATUSES.filter((x) => x !== s.status).map((x) => ({ label: `Mark ${x.replace("_", " ").toLowerCase()}`, onSelect: () => updateRecord("serial-numbers", s.id, { status: x }) })), { label: "Delete", destructive: true, onSelect: () => deleteRecord("serial-numbers", s.id) }]} />
      {sub === "new" && <SidePanel onClose={close}><SerialForm onDone={close} /></SidePanel>}
    </div>
  );
}

function SerialForm({ onDone }: { onDone: () => void }) {
  const serials = useCollection("serial-numbers");
  const batches = useCollection("product-batches");
  const [f, setF] = useState({ productId: "", serial: "", warehouseId: "", batchId: "", notes: "" });
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!f.productId || !f.serial.trim()) return setError("Product and serial number are required."); if (serials.some((s) => s.productId === f.productId && s.serial === f.serial.trim())) return setError("That serial already exists for this product."); createRecord("serial-numbers", { ...f, serial: f.serial.trim(), status: "IN_STOCK" }); onDone(); }} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Serial Number</h1>
      <Section title="Serial Number Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Product"><ProductPicker size="md" value={f.productId} onChange={(id) => set({ productId: id, batchId: "" })} placeholder="Select product" /></Field>
          <Field label="Serial Number" htmlFor="sn"><input id="sn" value={f.serial} onChange={(e) => set({ serial: e.target.value })} placeholder="e.g., SN-2024-00001" className={inputCls} /></Field>
          <Field label="Warehouse"><WarehousePicker value={f.warehouseId} onChange={(id) => set({ warehouseId: id })} /></Field>
          <Field label="Batch"><Select value={f.batchId} onChange={(v) => set({ batchId: v })} placeholder="Select batch (optional)" options={batches.filter((b) => b.productId === f.productId).map((b) => ({ value: b.id, label: String(b.batchNumber) }))} /></Field>
        </div>
        <Field label="Notes"><textarea aria-label="Notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} className={textareaCls} /></Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2"><button type="submit" className={btn.primary}>Create Serial</button><button type="button" onClick={onDone} className={btn.outline}>Cancel</button></div>
      </Section>
    </form>
  );
}

/* ---------- bill of materials ---------- */

const BOM_BASE = "/inventory/bom";
type Comp = { productId: string; qty: number; unitCost: number; waste: number };
const compCost = (c: Comp) => c.qty * (1 + c.waste / 100) * c.unitCost;

export function Boms() {
  const router = useRouter();
  const sub = subOf(usePathname(), BOM_BASE);
  const boms = useCollection("boms");
  const products = useProducts();
  const [assembling, setAssembling] = useState<Rec | null>(null);
  const close = () => router.push(BOM_BASE);
  const columns: Column<Rec>[] = [
    { key: "p", header: "Product", cell: (b) => <span className="font-medium">{name(products, b.productId)}</span> },
    { key: "n", header: "Name", cell: (b) => String(b.name || "—") },
    { key: "v", header: "Version", cell: (b) => `v${num(b.version)}` },
    { key: "c", header: "Total Cost", cell: (b) => money(((b.components as Comp[]) ?? []).reduce((s, c) => s + compCost(c), 0)) },
    { key: "s", header: "Status", cell: (b) => <StatusBadge status={b.status} /> },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Bill of Materials" subtitle="Manage product assembly recipes" actions={<Link href={`${BOM_BASE}/new`} className={btn.primary}><Plus /> New BOM</Link>} />
      <DataTable columns={columns} rows={boms} menu={(b) => [{ label: "Assemble…", onSelect: () => setAssembling(b) }, { label: b.status === "ACTIVE" ? "Archive" : "Activate", onSelect: () => updateRecord("boms", b.id, { status: b.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE" }) }, { label: "Delete", destructive: true, onSelect: () => deleteRecord("boms", b.id) }]} />
      {sub === "new" && <SidePanel onClose={close}><BomForm onDone={close} /></SidePanel>}
      {assembling && <AssembleDialog bom={assembling} onClose={() => setAssembling(null)} />}
    </div>
  );
}

function BomForm({ onDone }: { onDone: () => void }) {
  const boms = useCollection("boms");
  const [productId, setProduct] = useState("");
  const [bomName, setName] = useState("");
  const [description, setDescription] = useState("");
  const [comps, setComps] = useState<Comp[]>([{ productId: "", qty: 0, unitCost: 0, waste: 0 }]);
  const [error, setError] = useState("");
  const total = comps.reduce((s, c) => s + compCost(c), 0);
  const cols: GridCol<Comp>[] = [
    { key: "p", header: "Component Product", width: "36%", render: (c, set) => <ProductPicker value={c.productId} placeholder="Component" onChange={(id, p) => set({ productId: id, unitCost: valuation(id).avg || num(p.cost) })} /> },
    { key: "q", header: "Qty", render: (c, set) => numInput(c.qty, (v) => set({ qty: v }), "Component quantity", "0.00") },
    { key: "u", header: "Unit Cost", render: (c, set) => numInput(c.unitCost, (v) => set({ unitCost: v }), "Unit cost", "0.00") },
    { key: "w", header: "Waste %", render: (c, set) => numInput(c.waste, (v) => set({ waste: v }), "Waste percent") },
    { key: "l", header: "Line Cost", render: (c) => <span className="block text-right tabular-nums">{money(compCost(c))}</span> },
  ];
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const cs = comps.filter((c) => c.productId && c.qty > 0);
    if (!productId) return setError("Pick the finished product.");
    if (!cs.length) return setError("Add at least one component.");
    if (cs.some((c) => c.productId === productId)) return setError("A product can't be a component of itself.");
    const version = boms.filter((b) => b.productId === productId).reduce((m, b) => Math.max(m, num(b.version)), 0) + 1;
    createRecord("boms", { productId, name: bomName.trim(), description, components: cs, version, status: "ACTIVE" });
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Bill of Materials</h1>
      <Section title="BOM Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Finished Product"><ProductPicker size="md" value={productId} onChange={(id) => setProduct(id)} placeholder="Select product to assemble" /></Field>
          <Field label="BOM Name" htmlFor="bom-name"><input id="bom-name" value={bomName} onChange={(e) => setName(e.target.value)} placeholder="e.g., Standard Assembly v1" className={inputCls} /></Field>
        </div>
        <Field label="Description"><textarea aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} className={textareaCls} /></Field>
      </Section>
      <Section title="Components">
        <LineGrid lines={comps} setLines={setComps} cols={cols} blank={() => ({ productId: "", qty: 0, unitCost: 0, waste: 0 })} addInHeader addLabel="Add Component" footer={<div className="rounded-md bg-muted/60"><TotalRow label="Total Cost" value={total} strong /></div>} />
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2"><button type="submit" className={btn.primary}>Create BOM</button><button type="button" onClick={onDone} className={btn.outline}>Cancel</button></div>
    </form>
  );
}

// Consumes components (incl. waste) at average cost and produces the finished good at that cost.
function AssembleDialog({ bom, onClose }: { bom: Rec; onClose: () => void }) {
  const products = useProducts();
  const moves = useMoves();
  const [qty, setQty] = useState("1");
  const [wh, setWh] = useState("");
  const comps = (bom.components as Comp[]) ?? [];
  const need = (c: Comp) => Math.round(c.qty * (1 + c.waste / 100) * num(qty) * 1000) / 1000;
  const short = wh ? comps.filter((c) => need(c) > onHand(c.productId, wh, moves)) : [];
  const valid = wh && num(qty) > 0 && !short.length;
  function assemble() {
    const ref = `Assembly ${name(products, bom.productId)} × ${num(qty)}`;
    let value = 0;
    for (const c of comps) value += -recordMove({ date: today(), productId: c.productId, warehouseId: wh, qty: -need(c), type: "ADJUSTMENT", reference: ref }).value;
    recordMove({ date: today(), productId: String(bom.productId), warehouseId: wh, qty: num(qty), unitCost: value / num(qty), type: "ADJUSTMENT", reference: ref });
    onClose();
  }
  return (
    <Dialog open onClose={onClose} title={<><Hammer className="h-4 w-4" /> Assemble {name(products, bom.productId)}</>} description="Consumes the components (including waste) at average cost and adds the finished product at that cost. No GL entry — value stays in inventory.">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Quantity to build" htmlFor="as-qty"><input id="as-qty" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} /></Field>
        <Field label="Warehouse"><WarehousePicker value={wh} onChange={setWh} /></Field>
      </div>
      <ul className="text-sm">{comps.map((c, i) => <li key={i} className={cn("flex justify-between py-0.5", short.includes(c) && "text-destructive")}><span>{name(products, c.productId)}</span><span className="tabular-nums">{need(c)}{wh ? ` / ${onHand(c.productId, wh, moves)} on hand` : ""}</span></li>)}</ul>
      <div className="flex justify-end"><button type="button" disabled={!valid} onClick={assemble} className={btn.primary}>Assemble</button></div>
    </Dialog>
  );
}

/* ---------- landed costs ---------- */

const L_BASE = "/inventory/landed-costs";
const COST_TYPES = ["FREIGHT", "INSURANCE", "CUSTOMS", "HANDLING", "INSPECTION", "OTHER"];
const METHODS = [{ value: "BY_VALUE", label: "BY VALUE" }, { value: "BY_QUANTITY", label: "BY QUANTITY" }, { value: "EQUAL", label: "EQUAL" }];
type LcLine = { productId: string; qty: number; baseValue: number; warehouseId?: string };

const shares = (lines: LcLine[], method: string, amount: number) => {
  const basis = lines.map((l) => (method === "BY_QUANTITY" ? l.qty : method === "EQUAL" ? 1 : l.baseValue));
  const total = basis.reduce((s, b) => s + b, 0);
  return lines.map((_, i) => (total > 0 ? Math.round((amount * basis[i] * 1000) / total) / 1000 : 0));
};

export function LandedCosts() {
  const router = useRouter();
  const sub = subOf(usePathname(), L_BASE);
  const costs = useCollection("landed-costs");
  const products = useProducts();
  const close = () => router.push(L_BASE);
  const columns: Column<Rec>[] = [
    { key: "d", header: "Description", cell: (c) => <span className="font-medium">{String(c.description)}</span> },
    { key: "t", header: "Cost Type", cell: (c) => String(c.costType) },
    { key: "a", header: "Amount", cell: (c) => money(num(c.amount)) },
    { key: "m", header: "Method", cell: (c) => String(c.method).replace("_", " ") },
    { key: "s", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
    { key: "al", header: "Allocated", cell: (c) => (c.status === "POSTED" ? money(num(c.amount)) : "—") },
  ];

  // Allocation raises each product's stock value (value-only moves) against Accrued Expenses.
  function allocate(c: Rec) {
    const lines = (c.lines as LcLine[]) ?? [];
    const split = shares(lines, String(c.method), num(c.amount));
    lines.forEach((l, i) => {
      const wh = l.warehouseId || readCollection("stock-moves").find((m) => m.productId === l.productId && num(m.qty) > 0)?.warehouseId;
      if (wh) recordMove({ date: today(), productId: l.productId, warehouseId: String(wh), qty: 0, type: "PURCHASE", reference: `Landed cost — ${c.description}`, valueOnly: split[i] });
    });
    createJournal({ date: today(), description: `Landed cost — ${c.description} (${String(c.costType).toLowerCase()})`, status: "POSTED", source: "Landed Cost", lines: [{ accountId: findAccountByCode("1300")?.id ?? "", debit: num(c.amount), credit: 0 }, { accountId: findAccountByCode("2010")?.id ?? "", debit: 0, credit: num(c.amount) }] });
    updateRecord("landed-costs", c.id, { status: "POSTED", allocation: split, postedAt: today() });
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Landed Costs" subtitle="Allocate additional costs to received goods" actions={<Link href={`${L_BASE}/new`} className={btn.primary}><Plus /> New Landed Cost</Link>} />
      <DataTable
        columns={columns}
        rows={costs}
        menu={(c) => (c.status === "DRAFT" ? [{ label: "Allocate & post", onSelect: () => confirm(`Allocate ${money(num(c.amount))} across ${((c.lines as LcLine[]) ?? []).length} product(s)?`) && allocate(c) }, { label: "Delete", destructive: true, onSelect: () => deleteRecord("landed-costs", c.id) }] : [{ label: "View allocation", onSelect: () => alert(((c.lines as LcLine[]) ?? []).map((l, i) => `${name(products, l.productId)}: ${money(((c.allocation as number[]) ?? [])[i] ?? 0)}`).join("\n")) }])}
      />
      {sub === "new" && <SidePanel onClose={close}><LandedCostForm onDone={close} /></SidePanel>}
    </div>
  );
}

function LandedCostForm({ onDone }: { onDone: () => void }) {
  const grns = useCollection("grns");
  const pos = useCollection("purchase-orders");
  const [f, setF] = useState({ description: "", costType: "FREIGHT", amount: "", method: "BY_VALUE", grnId: "", poId: "", notes: "" });
  const [lines, setLines] = useState<LcLine[]>([{ productId: "", qty: 0, baseValue: 0 }]);
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const base = lines.reduce((s, l) => s + l.baseValue, 0);

  function linkGrn(id: string) {
    set({ grnId: id });
    const g = grns.find((x) => x.id === id);
    if (g) setLines(((g.lines as { productId: string; accepted: number; unitCost: number }[]) ?? []).map((l) => ({ productId: l.productId, qty: l.accepted, baseValue: Math.round(l.accepted * l.unitCost * 1000) / 1000, warehouseId: String(g.warehouseId) })));
  }
  function linkPo(id: string) {
    set({ poId: id });
    const p = pos.find((x) => x.id === id);
    if (p && !f.grnId) setLines(((p.lines as { productId: string; qty: number; unitPrice: number }[]) ?? []).map((l) => ({ productId: l.productId, qty: l.qty, baseValue: Math.round(l.qty * l.unitPrice * 1000) / 1000, warehouseId: String(p.warehouseId ?? "") })));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ls = lines.filter((l) => l.productId);
    if (!f.description.trim() || num(f.amount) <= 0) return setError("Description and a positive amount are required.");
    if (!ls.length) return setError("Add the products this cost applies to.");
    if (f.method === "BY_VALUE" && !ls.some((l) => l.baseValue > 0)) return setError("Allocating by value needs base values.");
    createRecord("landed-costs", { ...f, description: f.description.trim(), amount: num(f.amount), lines: ls, status: "DRAFT" });
    onDone();
  }

  const cols: GridCol<LcLine>[] = [
    { key: "p", header: "Product", width: "46%", render: (l, set) => <ProductPicker value={l.productId} placeholder="Product" onChange={(id) => set({ productId: id })} /> },
    { key: "q", header: "Quantity", render: (l, set) => numInput(l.qty, (v) => set({ qty: v }), "Quantity") },
    { key: "b", header: "Base Value", render: (l, set) => numInput(l.baseValue, (v) => set({ baseValue: v }), "Base value") },
  ];
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Landed Cost Allocation</h1>
      <Section title="Cost Details">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Description" htmlFor="lc-desc"><input id="lc-desc" value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="e.g., Ocean freight for Jan shipment" className={inputCls} /></Field>
          <Field label="Cost Type"><Select value={f.costType} onChange={(v) => set({ costType: v })} options={COST_TYPES} /></Field>
          <Field label="Amount" htmlFor="lc-amt"><input id="lc-amt" type="number" min="0" step="0.01" value={f.amount} onChange={(e) => set({ amount: e.target.value })} className={inputCls} /></Field>
          <Field label="Allocation Method"><Select value={f.method} onChange={(v) => set({ method: v })} options={METHODS} /></Field>
          <Field label="GRN (optional)"><Select value={f.grnId} onChange={linkGrn} placeholder="Link to GRN" options={grns.filter((g) => g.status === "POSTED").map((g) => ({ value: g.id, label: String(g.number) }))} /></Field>
          <Field label="PO (optional)"><Select value={f.poId} onChange={linkPo} placeholder="Link to PO" options={pos.map((p) => ({ value: p.id, label: `${p.number} — ${p.vendor}` }))} /></Field>
        </div>
        <Field label="Notes"><textarea aria-label="Notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} className={textareaCls} /></Field>
      </Section>
      <Section title="Products to Allocate">
        <LineGrid lines={lines} setLines={setLines} cols={cols} blank={() => ({ productId: "", qty: 0, baseValue: 0 })} addInHeader addLabel="Add Product" footer={<p className="text-right text-sm text-muted-foreground">Total base value: {money(base)}</p>} />
        {num(f.amount) > 0 && lines.some((l) => l.productId) && <p className="text-xs text-muted-foreground">Allocation preview: {lines.filter((l) => l.productId).map((l, i) => `${money(shares(lines.filter((x) => x.productId), f.method, num(f.amount))[i])}`).join(" · ")}</p>}
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2"><button type="submit" className={btn.primary}>Create Landed Cost</button><button type="button" onClick={onDone} className={btn.outline}>Cancel</button></div>
    </form>
  );
}

/* ---------- intelligence ---------- */

const TABS = [
  { key: "forecast", label: "Demand Forecast", icon: TrendingUp },
  { key: "abc", label: "ABC Analysis", icon: ChartColumn },
  { key: "dead", label: "Dead Stock", icon: Package },
  { key: "anomalies", label: "Anomalies", icon: TriangleAlert },
  { key: "reorder", label: "Smart Reorder", icon: ShoppingCart },
] as const;

// Statistics over the stock-movement history (not a trained model).
export function Intelligence() {
  const router = useRouter();
  const products = useProducts();
  const warehouses = useWarehouses();
  const moves = useMoves();
  const rules = useCollection("reorder-rules");
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("forecast");
  const now = today();

  const sales = useMemo(() => {
    const m = new Map<string, number>();
    for (const mv of moves) if (mv.type === "SALE" && daysBetween(String(mv.date), now) <= 90) m.set(mv.productId, (m.get(mv.productId) ?? 0) - num(mv.qty));
    return m;
  }, [moves, now]);
  const bal = useMemo(() => balances(moves), [moves]);
  const stockOf = (pid: string) => bal.filter((b) => b.productId === pid).reduce((s, b) => s + b.qty, 0);

  const forecast = [...sales].map(([pid, q90]) => { const daily = q90 / 90; const have = stockOf(pid); return { pid, daily, next30: Math.round(daily * 30 * 10) / 10, have, cover: daily > 0 ? Math.floor(have / daily) : Infinity }; }).sort((a, b) => a.cover - b.cover);

  const abc = (() => {
    const rows = bal.reduce((m, b) => m.set(b.productId, (m.get(b.productId) ?? 0) + b.value), new Map<string, number>());
    const sorted = [...rows].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    const out: { pid: string; value: number; share: number; cls: string }[] = [];
    let cum = 0;
    for (const [pid, v] of sorted) {
      cum += v;
      const pct = (cum / total) * 100;
      out.push({ pid, value: v, share: (v / total) * 100, cls: pct <= 80 ? "A" : pct <= 95 ? "B" : "C" });
    }
    return out;
  })();

  const dead = bal.filter((b) => b.qty > 0 && (!b.lastMove || daysBetween(b.lastMove, now) >= 90));

  const anomalies = [
    ...bal.filter((b) => b.qty < 0).map((b) => ({ key: `neg${b.productId}${b.warehouseId}`, text: `${name(products, b.productId)} is negative (${b.qty}) in ${name(warehouses, b.warehouseId)}.` })),
    ...products.flatMap((p) => {
      const ins = moves.filter((m) => m.productId === p.id && num(m.qty) > 0 && m.type === "PURCHASE").sort((a, b) => String(a.date).localeCompare(String(b.date)));
      if (ins.length < 2) return [];
      const last = ins[ins.length - 1];
      const prevAvg = ins.slice(0, -1).reduce((s, m) => s + num(m.unitCost), 0) / (ins.length - 1);
      return prevAvg > 0 && Math.abs(num(last.unitCost) - prevAvg) / prevAvg > 0.3 ? [{ key: `cost${p.id}`, text: `${p.name}: last purchase cost ${money(num(last.unitCost))} is ${Math.round(((num(last.unitCost) - prevAvg) / prevAvg) * 100)}% off its earlier average ${money(prevAvg)}.` }] : [];
    }),
    ...products.filter((p) => num(p.retail) > 0 && valuation(p.id, moves).avg > num(p.retail)).map((p) => ({ key: `margin${p.id}`, text: `${p.name} costs ${money(valuation(p.id, moves).avg)} on average but sells for ${money(num(p.retail))}.` })),
  ];

  const reorder = [
    ...rules.filter((r) => r.active !== false && onHand(String(r.productId), String(r.warehouseId), moves) <= num(r.reorderPoint)).map((r) => ({ pid: String(r.productId), qty: reorderQty(r, moves), why: `at/below reorder point ${num(r.reorderPoint)} in ${name(warehouses, r.warehouseId)}` })),
    ...forecast.filter((f) => f.cover < 30 && !rules.some((r) => r.productId === f.pid)).map((f) => ({ pid: f.pid, qty: Math.max(1, Math.ceil(f.daily * 45 - f.have)), why: `${f.cover} day(s) of cover at ${Math.round(f.daily * 10) / 10}/day` })),
  ];

  const body = () => {
    if (tab === "forecast") return forecast.length === 0 ? <p className="text-center text-sm text-muted-foreground">No sales data available for forecasting.</p> : (
      <table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 text-right font-medium">Avg / day (90d)</th><th className="py-2 text-right font-medium">Next 30 days</th><th className="py-2 text-right font-medium">On hand</th><th className="py-2 text-right font-medium">Days of cover</th></tr></thead>
        <tbody>{forecast.map((f) => <tr key={f.pid} className="border-b border-border/60"><td className="py-1.5">{name(products, f.pid)}</td><td className="py-1.5 text-right tabular-nums">{Math.round(f.daily * 100) / 100}</td><td className="py-1.5 text-right tabular-nums">{f.next30}</td><td className="py-1.5 text-right tabular-nums">{f.have}</td><td className={cn("py-1.5 text-right tabular-nums", f.cover < 14 && "text-destructive")}>{f.cover === Infinity ? "∞" : f.cover}</td></tr>)}</tbody></table>
    );
    if (tab === "abc") return abc.length === 0 ? <p className="text-center text-sm text-muted-foreground">No stock value to classify yet.</p> : (
      <table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Class</th><th className="py-2 font-medium">Product</th><th className="py-2 text-right font-medium">Stock value</th><th className="py-2 text-right font-medium">Share</th></tr></thead>
        <tbody>{abc.map((r) => <tr key={r.pid} className="border-b border-border/60"><td className="py-1.5"><span className={cn("rounded px-2 py-0.5 text-xs font-bold", r.cls === "A" ? "bg-primary text-primary-foreground" : r.cls === "B" ? "bg-accent" : "bg-muted")}>{r.cls}</span></td><td className="py-1.5">{name(products, r.pid)}</td><td className="py-1.5 text-right tabular-nums">{money(r.value)}</td><td className="py-1.5 text-right tabular-nums">{r.share.toFixed(1)}%</td></tr>)}</tbody></table>
    );
    if (tab === "dead") return dead.length === 0 ? <p className="text-center text-sm text-muted-foreground">No dead stock — everything on hand moved in the last 90 days.</p> : (
      <ul className="divide-y divide-border text-sm">{dead.map((b) => <li key={b.productId + b.warehouseId} className="flex justify-between py-1.5"><span>{name(products, b.productId)} · {name(warehouses, b.warehouseId)}</span><span className="tabular-nums">{b.qty} · {money(b.value)} · last moved {b.lastMove ? longDate(b.lastMove) : "never"}</span></li>)}</ul>
    );
    if (tab === "anomalies") return anomalies.length === 0 ? <p className="text-center text-sm text-muted-foreground">No anomalies found.</p> : <ul className="space-y-1.5 text-sm">{anomalies.map((a) => <li key={a.key} className="flex gap-2"><TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" />{a.text}</li>)}</ul>;
    return reorder.length === 0 ? <p className="text-center text-sm text-muted-foreground">Nothing needs reordering right now.</p> : (
      <div className="space-y-3">
        <ul className="divide-y divide-border text-sm">{reorder.map((r) => <li key={r.pid + r.why} className="flex justify-between py-1.5"><span>{name(products, r.pid)} <span className="text-muted-foreground">— {r.why}</span></span><span className="tabular-nums">order {r.qty}</span></li>)}</ul>
        <button type="button" onClick={() => { raiseRequisition(reorder.map((r) => ({ productId: r.pid, qty: r.qty }))); router.push("/inventory/purchase-requisitions"); }} className={btn.smPrimary}><ShoppingCart /> Raise requisition for all</button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Inventory Intelligence" subtitle="AI-powered inventory analytics and insights" />
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} className={cn("-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium", tab === t.key ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </div>
      <Card><div className="p-6">{body()}</div></Card>
      <p className="text-xs text-muted-foreground">Calculated from your stock movements: 90-day sales rates, stock value ranking (A = top 80%), 90-day inactivity, and cost/margin checks.</p>
    </div>
  );
}

