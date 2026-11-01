"use client";

// Products, categories, attributes, units of measure and warehouses.

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronDown, ChevronRight, FileText, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { useAccounts, useTaxRates } from "@/lib/ledger";
import { onHand, useMoves } from "@/lib/stock";
import { useAssistant } from "@/components/assistant";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";
import { AccountPicker, Card, CardTitle, DataTable, Field, Label, PageHeader, SearchInput, Select, SidePanel, Switch, btn, downloadFile, inputCls, money, num, textareaCls, toCSV, toExcelHTML, type Column } from "@/components/accounting/kit";
import { Opt, Req, Section, StatusBadge } from "@/components/sales/doc-kit";
import { EmptyCard, subOf } from "@/components/purchasing/kit";

export const useProducts = () => useCollection("products");
export const useCategories = () => useCollection("product-categories");
export const useUnits = () => useCollection("units");

const TYPES = ["GOODS", "SERVICE", "BUNDLE", "DIGITAL", "NON_INVENTORY"];
const STATUSES = ["ACTIVE", "INACTIVE", "DISCONTINUED"];
const COSTING = ["FIFO", "LIFO", "AVERAGE", "SPECIFIC"];
const DISCOUNTS = [{ value: "NONE", label: "None" }, { value: "PERCENT", label: "Percentage (%)" }, { value: "AMOUNT", label: "Fixed Amount" }];
const unitCodes = (units: Rec[]) => [...new Set(["EA", ...units.filter((u) => u.status !== "INACTIVE").map((u) => String(u.code))])];

/* ---------- products ---------- */

const P_BASE = "/inventory/products";

export function Products() {
  const router = useRouter();
  const sub = subOf(usePathname(), P_BASE);
  const products = useProducts();
  const categories = useCategories();
  const warehouses = useCollection("warehouses");
  const units = useUnits();
  const taxRates = useTaxRates();
  const moves = useMoves();
  const { ask } = useAssistant();
  const [q, setQ] = useState("");
  const [f, setF] = useState({ category: "", brand: "", uom: "", type: "", status: "", warehouse: "", unit: "DEFAULT" });
  const [selected, setSelected] = useState<string[]>([]);
  const close = () => router.push(P_BASE);
  const catName = (id: unknown) => String(categories.find((c) => c.id === id)?.name ?? "");
  const brands = [...new Set(products.map((p) => String(p.brand ?? "")).filter(Boolean))].sort();
  const altUnits = [...new Set(products.filter((p) => p.multiUnit && p.altUnit).map((p) => String(p.altUnit)))];

  const stockOf = (p: Rec) => {
    const qty = onHand(p.id, f.warehouse || undefined, moves);
    if (f.unit !== "DEFAULT" && f.unit !== "BASE" && p.altUnit === f.unit && num(p.altFactor) > 0) return `${Math.round((qty / num(p.altFactor)) * 100) / 100} ${p.altUnit}`;
    return String(qty);
  };

  const rows = [...products]
    .sort((a, b) => String(a.sku).localeCompare(String(b.sku)))
    .filter((p) =>
      (!f.category || p.categoryId === f.category) && (!f.brand || p.brand === f.brand) && (!f.uom || p.uom === f.uom) && (!f.type || (p.type ?? "GOODS") === f.type) && (!f.status || (p.status ?? "ACTIVE") === f.status) &&
      (!f.warehouse || onHand(p.id, f.warehouse, moves) !== 0) && (!q.trim() || `${p.sku} ${p.name} ${p.barcode ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())),
    );

  function exportAs(kind: "csv" | "xls") {
    const headers = ["SKU", "Name", "Category", "Brand", "Type", "UOM", "Cost", "Retail", "Tax %", "Stock", "Status", "Barcode"];
    const data = rows.map((p) => [String(p.sku ?? ""), String(p.name), catName(p.categoryId), String(p.brand ?? ""), String(p.type ?? "GOODS"), String(p.uom ?? "EA"), num(p.cost), num(p.retail), num(p.tax), onHand(p.id, undefined, moves), String(p.status ?? "ACTIVE"), String(p.barcode ?? "")]);
    if (kind === "csv") downloadFile("products.csv", toCSV(headers, data), "text/csv");
    else downloadFile("products.xls", toExcelHTML(headers, data), "application/vnd.ms-excel");
  }

  function bulk(action: "deactivate" | "delete") {
    if (!selected.length) return;
    if (action === "deactivate") selected.forEach((id) => updateRecord("products", id, { status: "INACTIVE" }));
    else {
      const blocked = selected.filter((id) => moves.some((m) => m.productId === id));
      if (blocked.length) alert(`${blocked.length} product(s) have stock movements and were deactivated instead of deleted.`);
      selected.forEach((id) => (blocked.includes(id) ? updateRecord("products", id, { status: "INACTIVE" }) : deleteRecord("products", id)));
    }
    setSelected([]);
  }

  const filter = (key: keyof typeof f, all: string, options: (string | { value: string; label: string })[], w = "w-36") => (
    <Select ariaLabel={all} size="sm" value={f[key]} onChange={(v) => setF({ ...f, [key]: v })} options={[{ value: "", label: all }, ...options]} className={w} />
  );
  const detail = sub && sub !== "new" && sub !== "import" ? products.find((p) => p.id === sub) : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        subtitle="Manage products and services"
        actions={
          <>
            <ExportMenu onCSV={() => exportAs("csv")} onExcel={() => exportAs("xls")} />
            <Link href={`${P_BASE}/import`} className={btn.outline}><Upload /> Import</Link>
            <button type="button" onClick={() => ask("Import products from a supplier price list or catalogue I'll attach.")} className={btn.outline}><Sparkles /> AI Import</button>
            <Link href={`${P_BASE}/new`} className={btn.primary}><Plus /> New Product</Link>
          </>
        }
      />
      <SearchInput value={q} onChange={setQ} placeholder="Search products..." />
      <div className="flex flex-wrap gap-2">
        {filter("category", "All categories", categories.map((c) => ({ value: c.id, label: String(c.name) })))}
        {filter("brand", "All brands", brands)}
        {filter("uom", "All UOM", unitCodes(units), "w-28")}
        {filter("type", "All types", TYPES)}
        {filter("status", "All status", STATUSES)}
        {filter("warehouse", "All warehouses", warehouses.map((w) => ({ value: w.id, label: String(w.name) })), "w-44")}
        <Select ariaLabel="Unit" size="sm" value={f.unit} onChange={(v) => setF({ ...f, unit: v })} options={[{ value: "DEFAULT", label: "Unit: Default" }, { value: "BASE", label: "Unit: Base" }, ...altUnits.map((u) => ({ value: u, label: `Unit: ${u}` }))]} className="w-36" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs text-muted-foreground">Select rows to delete or deactivate in bulk · click a field to edit inline · double-click a row to open.</p>
        {selected.length > 0 && (
          <span className="flex items-center gap-2 text-xs">
            <b>{selected.length} selected</b>
            <button type="button" onClick={() => bulk("deactivate")} className={btn.smOutline}>Deactivate</button>
            <button type="button" onClick={() => confirm(`Delete ${selected.length} product(s)?`) && bulk("delete")} className={cn(btn.smOutline, "text-destructive")}>Delete</button>
          </span>
        )}
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[60rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="w-8 p-2"><input type="checkbox" aria-label="Select all" checked={!!rows.length && selected.length === rows.length} onChange={(e) => setSelected(e.target.checked ? rows.map((r) => r.id) : [])} className="accent-primary" /></th>
              {["SKU", "Item Name", "Category", "Brand", "UOM", "Cost", "Retail", "GST", "Stock", "Status"].map((h) => <th key={h} className="h-10 px-2 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} onDoubleClick={() => router.push(`${P_BASE}/${p.id}`)} className={cn("border-b border-border/60 hover:bg-muted/50", selected.includes(p.id) && "bg-accent/40")}>
                <td className="p-2"><input type="checkbox" aria-label={`Select ${p.name}`} checked={selected.includes(p.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, p.id] : selected.filter((x) => x !== p.id))} className="accent-primary" /></td>
                <EditCell collection="products" row={p} field="sku" className="font-mono text-xs" />
                <EditCell collection="products" row={p} field="name" className="font-medium" />
                <td className="p-2"><Select ariaLabel="Category" size="sm" value={String(p.categoryId ?? "")} onChange={(v) => updateRecord("products", p.id, { categoryId: v })} placeholder="—" options={categories.map((c) => ({ value: c.id, label: String(c.name) }))} className="w-32" /></td>
                <EditCell collection="products" row={p} field="brand" />
                <td className="p-2"><Select ariaLabel="UOM" size="sm" value={String(p.uom ?? "EA")} onChange={(v) => updateRecord("products", p.id, { uom: v })} options={unitCodes(units)} className="w-20" /></td>
                <EditCell collection="products" row={p} field="cost" numeric currency />
                <EditCell collection="products" row={p} field="retail" numeric currency />
                <td className="p-2"><TaxCell product={p} taxRates={taxRates} /></td>
                <td className="p-2 tabular-nums">{p.trackStock === false || ["SERVICE", "DIGITAL", "NON_INVENTORY"].includes(String(p.type)) ? "—" : stockOf(p)}</td>
                <td className="p-2"><StatusBadge status={p.status ?? "ACTIVE"} /></td>
              </tr>
            ))}
            <QuickAddProduct categories={categories} units={units} taxRates={taxRates} />
          </tbody>
        </table>
      </div>
      {sub === "new" && <SidePanel onClose={close}><ProductForm onDone={close} /></SidePanel>}
      {sub === "import" && <SidePanel onClose={close}><ImportProducts onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><ProductForm key={detail.id} record={detail} onDone={close} /></SidePanel>}
    </div>
  );
}

function ExportMenu({ onCSV, onExcel }: { onCSV: () => void; onExcel: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const item = "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent [&_svg]:size-4";
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={btn.outline}><FileText /> Export <ChevronDown /></button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md">
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); onCSV(); }}><FileText /> Download CSV</button>
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); onExcel(); }}><FileText /> Download Excel</button>
        </div>
      )}
    </div>
  );
}

const taxLabel = (r: Rec) => `${r.name} — ${num(r.rate)}%`;

function TaxCell({ product, taxRates }: { product: Rec; taxRates: Rec[] }) {
  return (
    <Select
      ariaLabel="Tax"
      size="sm"
      value={String(product.taxRateId ?? "")}
      onChange={(v) => updateRecord("products", product.id, { taxRateId: v, tax: v === "NONE" ? 0 : num(taxRates.find((r) => r.id === v)?.rate) })}
      placeholder="Company default (none set)"
      options={[{ value: "NONE", label: "No tax (0%)" }, ...taxRates.map((r) => ({ value: r.id, label: taxLabel(r) }))]}
      className="w-48"
    />
  );
}

// Click a cell to edit it in place; Enter/blur saves, Escape cancels.
export function EditCell({ collection, row, field, numeric, currency, className }: { collection: string; row: Rec; field: string; numeric?: boolean; currency?: boolean; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const save = () => {
    const v = value.trim();
    if ((field === "name" || field === "code") && !v) return setEditing(false);
    updateRecord(collection, row.id, { [field]: numeric ? Math.max(0, Number(v) || 0) : v });
    setEditing(false);
  };
  return (
    <td className={cn("cursor-text p-2", className)} onClick={(e) => { e.stopPropagation(); if (!editing) { setValue(String(row[field] ?? "")); setEditing(true); } }} onDoubleClick={(e) => editing && e.stopPropagation()}>
      {editing ? (
        <input autoFocus aria-label={`Edit ${field}`} type={numeric ? "number" : "text"} value={value} onChange={(e) => setValue(e.target.value)} onBlur={save} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }} className={cn(inputCls, "h-7")} />
      ) : (
        <span className={cn(!row[field] && row[field] !== 0 && "text-muted-foreground")}>{currency ? (row[field] !== undefined && row[field] !== "" ? money(num(row[field])) : "—") : String(row[field] ?? "") || "—"}</span>
      )}
    </td>
  );
}

function QuickAddProduct({ categories, units, taxRates }: { categories: Rec[]; units: Rec[]; taxRates: Rec[] }) {
  const blank = { sku: "", name: "", categoryId: "", brand: "", uom: "EA", retail: "", taxRateId: "" };
  const [f, setF] = useState(blank);
  const add = () => {
    if (!f.name.trim()) return;
    createRecord("products", { ...f, sku: f.sku.trim() || nextNumber("products", "PRD"), name: f.name.trim(), retail: num(f.retail), cost: 0, tax: f.taxRateId && f.taxRateId !== "NONE" ? num(taxRates.find((r) => r.id === f.taxRateId)?.rate) : 0, type: "GOODS", status: "ACTIVE", trackStock: true, sellable: true, purchasable: true, costingMethod: "AVERAGE" });
    setF(blank);
  };
  const cell = "h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring";
  const onKey = (e: React.KeyboardEvent) => e.key === "Enter" && add();
  return (
    <tr className="bg-muted/30">
      <td />
      <td className="p-1"><input aria-label="New product code" value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} onKeyDown={onKey} placeholder="Code (auto)" className={cn(cell, "font-mono text-xs")} /></td>
      <td className="p-1"><input aria-label="New product name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={onKey} placeholder="Add a product..." className={cell} /></td>
      <td className="p-1"><Select ariaLabel="New product category" size="sm" value={f.categoryId} onChange={(v) => setF({ ...f, categoryId: v })} placeholder="Category" options={categories.map((c) => ({ value: c.id, label: String(c.name) }))} className="w-32" /></td>
      <td className="p-1"><input aria-label="New product brand" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} onKeyDown={onKey} placeholder="Brand" className={cell} /></td>
      <td className="p-1"><Select ariaLabel="New product UOM" size="sm" value={f.uom} onChange={(v) => setF({ ...f, uom: v })} options={unitCodes(units)} className="w-20" /></td>
      <td />
      <td className="p-1"><input aria-label="New product retail" type="number" min="0" value={f.retail} onChange={(e) => setF({ ...f, retail: e.target.value })} onKeyDown={onKey} placeholder="Retail" className={cell} /></td>
      <td className="p-1"><Select ariaLabel="New product tax" size="sm" value={f.taxRateId} onChange={(v) => setF({ ...f, taxRateId: v })} placeholder="Company default (none set)" options={[{ value: "NONE", label: "No tax (0%)" }, ...taxRates.map((r) => ({ value: r.id, label: taxLabel(r) }))]} className="w-48" /></td>
      <td />
      <td className="p-1"><button type="button" aria-label="Add product" disabled={!f.name.trim()} onClick={add} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /></button></td>
    </tr>
  );
}

function ProductForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const categories = useCategories();
  const units = useUnits();
  const accounts = useAccounts();
  const taxRates = useTaxRates();
  const attributes = useCollection("product-attributes");
  const products = useProducts();
  const [preview] = useState(() => nextNumber("products", "PRD"));
  const [f, setF] = useState(() => ({
    sku: String(record?.sku ?? ""), name: String(record?.name ?? ""), description: String(record?.description ?? ""), categoryId: String(record?.categoryId ?? ""), brand: String(record?.brand ?? ""),
    type: String(record?.type ?? "GOODS"), status: String(record?.status ?? "ACTIVE"), availableIn: String(record?.availableIn ?? "ALL"), costingMethod: String(record?.costingMethod ?? "AVERAGE"),
    sellable: record?.sellable !== false, purchasable: record?.purchasable !== false, trackStock: record?.trackStock ?? (categories.find((c) => c.id === record?.categoryId)?.trackStock !== false), trackBatches: Boolean(record?.trackBatches),
    multiUnit: Boolean(record?.multiUnit), altUnit: String(record?.altUnit ?? ""), altFactor: String(record?.altFactor ?? ""), uom: String(record?.uom ?? "EA"), barcode: String(record?.barcode ?? ""),
    cost: String(record?.cost ?? ""), retail: String(record?.retail ?? ""), markup: String(record?.markup ?? ""), incomeAccountId: String(record?.incomeAccountId ?? ""), taxRateId: String(record?.taxRateId ?? ""),
    discountType: String(record?.discountType ?? "NONE"), discountValue: String(record?.discountValue ?? ""), hasVariants: Boolean(record?.hasVariants), variantAttrs: (record?.variantAttrs as string[]) ?? [],
  }));
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const stockable = !["SERVICE", "DIGITAL", "NON_INVENTORY"].includes(f.type);

  // Variants: every combination of the chosen attributes' values.
  const variants = useMemo(() => {
    if (!f.hasVariants || !f.variantAttrs.length) return [];
    const lists = f.variantAttrs.map((id) => ((attributes.find((a) => a.id === id)?.values as string[]) ?? []));
    return lists.reduce<string[][]>((acc, vals) => acc.flatMap((combo) => vals.map((v) => [...combo, v])), [[]]).filter((c) => c.length).map((c) => c.join(" / "));
  }, [f.hasVariants, f.variantAttrs, attributes]);

  function pickCategory(id: string) {
    const c = categories.find((x) => x.id === id);
    set({ categoryId: id, ...(c && !record ? { trackStock: c.trackStock !== false } : {}) });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError("Name is required.");
    const sku = f.sku.trim() || (record ? String(record.sku) : nextNumber("products", "PRD"));
    if (products.some((p) => p.id !== record?.id && String(p.sku).toLowerCase() === sku.toLowerCase())) return setError(`SKU ${sku} is already used.`);
    if (f.multiUnit && (!f.altUnit || num(f.altFactor) <= 1)) return setError("For multiple units, pick the second unit and how many base units it holds (more than 1).");
    const tax = f.taxRateId && f.taxRateId !== "NONE" ? num(taxRates.find((r) => r.id === f.taxRateId)?.rate) : 0;
    const data = { ...f, sku, name: f.name.trim(), cost: num(f.cost), retail: num(f.retail), markup: num(f.markup), altFactor: num(f.altFactor), discountValue: num(f.discountValue), tax, variants, trackStock: stockable && f.trackStock };
    if (record) updateRecord("products", record.id, data);
    else createRecord("products", data);
    onDone();
  }

  const toggle = (key: "sellable" | "purchasable" | "trackStock" | "trackBatches" | "multiUnit", lab: string, disabled = false) => (
    <label className={cn("flex items-center gap-2 text-sm", disabled && "opacity-50")}>
      <Switch checked={Boolean(f[key])} onChange={(v) => !disabled && set({ [key]: v } as Partial<typeof f>)} label={lab} /> {lab}
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? `Product: ${record.name}` : "New Product"}</h1>
      <Section title="Product Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>SKU<Opt /></>} htmlFor="p-sku"><input id="p-sku" autoFocus={!record} value={f.sku} onChange={(e) => set({ sku: e.target.value })} placeholder={`Auto: ${preview}`} className={inputCls} /></Field>
          <Field label={<>Name<Req /></>} htmlFor="p-name"><input id="p-name" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Office Chair" className={inputCls} /></Field>
        </div>
        <Field label="Description"><textarea aria-label="Description" value={f.description} onChange={(e) => set({ description: e.target.value })} className={textareaCls} /></Field>
        <Field label="Category"><Select value={f.categoryId} onChange={pickCategory} placeholder="Select category" options={categories.map((c) => ({ value: c.id, label: String(c.name) }))} /></Field>
        <Field label="Brand" htmlFor="p-brand">
          <input id="p-brand" list="brand-list" value={f.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Select brand" className={inputCls} />
          <datalist id="brand-list">{[...new Set(products.map((p) => String(p.brand ?? "")).filter(Boolean))].map((b) => <option key={b} value={b} />)}</datalist>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type"><Select value={f.type} onChange={(v) => set({ type: v })} options={TYPES} /></Field>
          <Field label="Status"><Select value={f.status} onChange={(v) => set({ status: v })} options={STATUSES} /></Field>
          <Field label="Available in"><Select value={f.availableIn} onChange={(v) => set({ availableIn: v })} options={[{ value: "ALL", label: "All branches" }, { value: "HEAD_OFFICE", label: "Head Office" }]} /></Field>
          <Field label="Costing Method" hint={f.costingMethod !== "AVERAGE" ? "Stock is valued at moving average in this build; the method is stored for reporting." : undefined}><Select value={f.costingMethod} onChange={(v) => set({ costingMethod: v })} options={COSTING} /></Field>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 rounded-lg border border-border p-3">
          {toggle("sellable", "Sellable")}
          {toggle("purchasable", "Purchasable")}
          {toggle("trackStock", "Track stock", !stockable)}
          {toggle("trackBatches", "Track batches", !stockable)}
          {toggle("multiUnit", "Sell & buy in multiple units")}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Unit of Measure"><Select value={f.uom} onChange={(v) => set({ uom: v })} options={unitCodes(units)} /></Field>
          <Field label="Barcode" htmlFor="p-bc"><input id="p-bc" value={f.barcode} onChange={(e) => set({ barcode: e.target.value })} className={inputCls} /></Field>
          {f.multiUnit && (
            <>
              <Field label="Second unit (e.g. CARTON)"><Select value={f.altUnit} onChange={(v) => set({ altUnit: v })} placeholder="Select unit" options={unitCodes(units).filter((u) => u !== f.uom)} /></Field>
              <Field label={`${f.uom} per ${f.altUnit || "unit"}`} htmlFor="p-af"><input id="p-af" type="number" min="1" value={f.altFactor} onChange={(e) => set({ altFactor: e.target.value })} placeholder="e.g. 12" className={inputCls} /></Field>
            </>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Standard Cost" htmlFor="p-cost"><input id="p-cost" type="number" min="0" step="0.01" value={f.cost} onChange={(e) => set({ cost: e.target.value, ...(num(f.markup) > 0 ? { retail: String(Math.round(num(e.target.value) * (1 + num(f.markup) / 100) * 100) / 100) } : {}) })} className={inputCls} /></Field>
          <Field label="Selling Price" htmlFor="p-retail"><input id="p-retail" type="number" min="0" step="0.01" value={f.retail} onChange={(e) => set({ retail: e.target.value })} className={inputCls} /></Field>
          <Field label="Default Markup %" htmlFor="p-mk" hint="Markup on cost: price = landed cost × (1 + markup). Pre-fills purchase orders."><input id="p-mk" type="number" min="0" value={f.markup} onChange={(e) => set({ markup: e.target.value, ...(num(f.cost) > 0 && e.target.value ? { retail: String(Math.round(num(f.cost) * (1 + num(e.target.value) / 100) * 100) / 100) } : {}) })} placeholder="—" className={inputCls} /></Field>
        </div>
        <Field label={<>Income Account <span className="text-xs font-normal text-muted-foreground">(default for invoice lines)</span></>}>
          <AccountPicker accounts={accounts} types={["REVENUE"]} value={f.incomeAccountId} onChange={(v) => set({ incomeAccountId: v })} placeholder="Default revenue account" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Default Tax Rate <span className="text-xs font-normal text-muted-foreground">(pre-fills invoice lines)</span></>}>
            <Select value={f.taxRateId} onChange={(v) => set({ taxRateId: v })} placeholder="Company default (none set)" options={[{ value: "NONE", label: "No tax (0%)" }, ...taxRates.map((r) => ({ value: r.id, label: taxLabel(r) }))]} />
          </Field>
          <Field label={<>Default Discount <span className="text-xs font-normal text-muted-foreground">(pre-fills invoice lines)</span></>}>
            <div className="flex gap-2">
              <Select value={f.discountType} onChange={(v) => set({ discountType: v })} options={DISCOUNTS} className="flex-1" />
              {f.discountType !== "NONE" && <input aria-label="Discount value" type="number" min="0" value={f.discountValue} onChange={(e) => set({ discountValue: e.target.value })} className={cn(inputCls, "w-24")} />}
            </div>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.hasVariants} onChange={(v) => set({ hasVariants: v })} label="Has Variants" /> Has Variants</label>
        {f.hasVariants && (
          <div className="space-y-2 rounded-lg border border-border p-3">
            {attributes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No attributes yet — define Color, Size and so on under <Link href="/inventory/attributes" className="text-primary hover:underline">Inventory › Attributes</Link>.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-3">
                  {attributes.map((a) => (
                    <label key={a.id} className="flex items-center gap-1.5 text-sm">
                      <input type="checkbox" checked={f.variantAttrs.includes(a.id)} onChange={(e) => set({ variantAttrs: e.target.checked ? [...f.variantAttrs, a.id] : f.variantAttrs.filter((x) => x !== a.id) })} className="accent-primary" />
                      {String(a.name)}
                    </label>
                  ))}
                </div>
                {variants.length > 0 && <p className="text-xs text-muted-foreground">{variants.length} variant(s): {variants.join(", ")}</p>}
              </>
            )}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className={btn.primary}>{record ? "Save Changes" : "Create Product"}</button>
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        </div>
      </Section>
    </form>
  );
}

function ImportProducts({ onDone }: { onDone: () => void }) {
  const products = useProducts();
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [error, setError] = useState("");
  const skus = new Set(products.map((p) => String(p.sku).toLowerCase()));
  const fresh = rows?.filter((r) => r.name && (!r.sku || !skus.has(r.sku.toLowerCase()))) ?? [];
  async function pick(file?: File) {
    setError("");
    setRows(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) return setError("This build reads .csv files. In Excel, use File → Save As → CSV.");
    const lines = (await file.text()).split(/\r?\n/).filter((l) => l.trim());
    const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
    const head = split(lines[0]).map((h) => h.toLowerCase());
    const idx = (...k: string[]) => head.findIndex((h) => k.includes(h));
    const map = { sku: idx("sku", "code"), name: idx("name", "item name"), brand: idx("brand"), uom: idx("uom", "unit"), cost: idx("cost"), retail: idx("retail", "price", "selling price"), barcode: idx("barcode") };
    if (map.name < 0) return setError("The file needs a Name column.");
    setRows(lines.slice(1).map(split).map((r) => Object.fromEntries(Object.entries(map).map(([k, i]) => [k, i >= 0 ? (r[i] ?? "") : ""]))));
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Import Products</h1>
      <Card>
        <div className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">Columns: <b className="text-foreground">Name</b> (required), SKU, Brand, UOM, Cost, Retail, Barcode. Existing SKUs are skipped. Tip: Export → CSV gives you a template.</p>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm hover:bg-muted/50"><Upload className="h-4 w-4" /> Click to select a .csv file<input type="file" accept=".csv" className="hidden" onChange={(e) => pick(e.target.files?.[0])} /></label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {rows && (
            <>
              <p className="text-sm text-muted-foreground">{fresh.length} new product(s); {rows.length - fresh.length} skipped.</p>
              <button type="button" disabled={!fresh.length} onClick={() => { for (const r of fresh) createRecord("products", { sku: r.sku || nextNumber("products", "PRD"), name: r.name, brand: r.brand, uom: r.uom || "EA", cost: num(r.cost), retail: num(r.retail), barcode: r.barcode, type: "GOODS", status: "ACTIVE", trackStock: true, sellable: true, purchasable: true, costingMethod: "AVERAGE" }); onDone(); }} className={btn.primary}>Import {fresh.length} product(s)</button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}

/* ---------- categories ---------- */

const C_BASE = "/inventory/categories";
const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function Categories() {
  const router = useRouter();
  const sub = subOf(usePathname(), C_BASE);
  const categories = useCategories();
  const products = useProducts();
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const close = () => router.push(C_BASE);
  const children = (parent: string) => categories.filter((c) => (c.parentId || "") === parent).sort((a, b) => num(a.sortOrder) - num(b.sortOrder) || String(a.name).localeCompare(String(b.name)));
  const count = (id: string) => products.filter((p) => p.categoryId === id).length;

  function remove(c: Rec) {
    if (children(c.id).length) return alert(`${c.name} has sub-categories. Move or delete them first.`);
    if (count(c.id) && !confirm(`${count(c.id)} product(s) use ${c.name}; they'll become uncategorised. Delete anyway?`)) return;
    readCollection("products").filter((p) => p.categoryId === c.id).forEach((p) => updateRecord("products", p.id, { categoryId: "" }));
    deleteRecord("product-categories", c.id);
  }

  const tree = (parent: string, depth: number): React.ReactNode =>
    children(parent).map((c) => {
      const kids = children(c.id);
      const open = !collapsed.includes(c.id);
      return (
        <div key={c.id}>
          <div className="group flex items-center gap-2 rounded-md py-1.5 pr-2 text-sm hover:bg-muted/50" style={{ paddingLeft: 8 + depth * 20 }}>
            <button type="button" aria-label={open ? "Collapse" : "Expand"} onClick={() => setCollapsed(open ? [...collapsed, c.id] : collapsed.filter((x) => x !== c.id))} className={cn("text-muted-foreground", !kids.length && "invisible")}>{open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}</button>
            <Link href={`${C_BASE}/${c.id}`} className={cn("flex-1 font-medium hover:underline", c.active === false && "text-muted-foreground line-through")}>{String(c.name)}</Link>
            <span className="text-xs text-muted-foreground">{count(c.id)} product(s)</span>
            {c.trackStock === false && <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">no stock</span>}
            {Boolean(c.sendToKitchen) && <span className="rounded bg-muted px-1.5 text-[10px] text-muted-foreground">KOT</span>}
            <span className="flex gap-1 opacity-0 group-hover:opacity-100">
              <Link href={`${C_BASE}/new?parent=${c.id}`} title="Add sub-category" className="rounded p-1 text-muted-foreground hover:bg-accent"><Plus className="h-3.5 w-3.5" /></Link>
              <button type="button" title="Delete" onClick={() => remove(c)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
            </span>
          </div>
          {open && tree(c.id, depth + 1)}
        </div>
      );
    });

  const detail = sub && sub !== "new" ? categories.find((c) => c.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Product Categories" actions={<Link href={`${C_BASE}/new`} className={btn.primary}><Plus /> New Category</Link>} />
      <Card>
        <div className="space-y-3 p-6">
          <CardTitle>Category Hierarchy</CardTitle>
          {categories.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No categories yet. Create one to get started.</p> : <div>{tree("", 0)}</div>}
        </div>
      </Card>
      {sub === "new" && <SidePanel onClose={close}><CategoryForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><CategoryForm key={detail.id} record={detail} onDone={close} /></SidePanel>}
    </div>
  );
}

function CategoryForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const categories = useCategories();
  const presetParent = useSearchParams().get("parent") ?? "";
  const [f, setF] = useState(() => ({ name: String(record?.name ?? ""), slug: String(record?.slug ?? ""), parentId: String(record?.parentId ?? presetParent), description: String(record?.description ?? ""), sortOrder: String(record?.sortOrder ?? "0"), active: record?.active !== false, trackStock: record?.trackStock !== false, sendToKitchen: record ? Boolean(record.sendToKitchen) : true }));
  const [slugTouched, setSlugTouched] = useState(!!record);
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  // A category can't sit under itself or one of its own descendants.
  const descendants = (id: string): string[] => categories.filter((c) => c.parentId === id).flatMap((c) => [c.id, ...descendants(c.id)]);
  const blocked = record ? [record.id, ...descendants(record.id)] : [];

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.slug.trim()) return setError("Name and slug are required.");
    if (categories.some((c) => c.id !== record?.id && c.slug === f.slug.trim())) return setError(`Slug "${f.slug}" is already used.`);
    const data = { ...f, name: f.name.trim(), slug: slugify(f.slug), sortOrder: num(f.sortOrder) };
    if (record) updateRecord("product-categories", record.id, data);
    else createRecord("product-categories", data);
    onDone();
  }

  const option = (key: "trackStock" | "sendToKitchen", title: string, text: string) => (
    <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-3">
      <div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs text-muted-foreground">{text}</p></div>
      <Switch checked={f[key]} onChange={(v) => set({ [key]: v } as Partial<typeof f>)} label={title} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? `Category: ${record.name}` : "New Product Category"}</h1>
      <Section title="Category Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Name<Req /></>} htmlFor="c-name"><input id="c-name" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="e.g. Office Chairs" className={inputCls} /></Field>
          <Field label={<>Slug<Req /></>} htmlFor="c-slug"><input id="c-slug" value={f.slug} onChange={(e) => { setSlugTouched(true); set({ slug: e.target.value }); }} placeholder="e.g. office-chairs" className={inputCls} /></Field>
        </div>
        <Field label="Parent Category"><Select value={f.parentId} onChange={(v) => set({ parentId: v })} placeholder="None (top-level)" options={categories.filter((c) => !blocked.includes(c.id)).map((c) => ({ value: c.id, label: String(c.name) }))} /></Field>
        <Field label="Description"><textarea aria-label="Description" value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="What products belong in this category" className={textareaCls} /></Field>
        <div className="flex items-end gap-4">
          <Field label="Sort Order" htmlFor="c-sort" className="flex-1"><input id="c-sort" type="number" value={f.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} className={inputCls} /></Field>
          <label className="flex h-9 items-center gap-2 text-sm"><Switch checked={f.active} onChange={(v) => set({ active: v })} label="Active" /> Active</label>
        </div>
        {option("trackStock", "Track stock for products in this category", "Products added here will count stock — quantities go down as they sell, and the register warns when they run low. Right for goods you hold, like a box of pencils. This sets the starting value for new products; each product can still be changed on its own, and products already in this category are unaffected.")}
        {option("sendToKitchen", "Send to kitchen (restaurant POS)", "Items in this category print on the kitchen ticket (KOT) when an order is placed. Right for food and drinks that are prepared.")}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
          <button type="submit" className={btn.primary}>{record ? "Save Changes" : "Create Category"}</button>
        </div>
      </Section>
    </form>
  );
}

/* ---------- attributes ---------- */

const A_BASE = "/inventory/attributes";

export function Attributes() {
  const router = useRouter();
  const sub = subOf(usePathname(), A_BASE);
  const attributes = useCollection("product-attributes");
  const close = () => router.push(A_BASE);
  const detail = sub && sub !== "new" ? attributes.find((a) => a.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Product Attributes" subtitle="Define attribute types (e.g., Color, Size) and their values for product variants" actions={<Link href={`${A_BASE}/new`} className={btn.primary}><Plus /> Add Attribute</Link>} />
      {attributes.length === 0 ? (
        <EmptyCard>No attributes defined yet. Create one to start building product variants.</EmptyCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {attributes.map((a) => (
            <Card key={a.id}>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <Link href={`${A_BASE}/${a.id}`} className="font-semibold hover:underline">{String(a.name)}</Link>
                  <button type="button" aria-label={`Delete ${a.name}`} onClick={() => confirm(`Delete ${a.name}?`) && deleteRecord("product-attributes", a.id)} className={btn.icon}><Trash2 /></button>
                </div>
                <div className="flex flex-wrap gap-1.5">{((a.values as string[]) ?? []).map((v) => <span key={v} className="rounded-full bg-accent px-2.5 py-0.5 text-xs">{v}</span>)}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {sub === "new" && <SidePanel onClose={close}><AttributeForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><AttributeForm key={detail.id} record={detail} onDone={close} /></SidePanel>}
    </div>
  );
}

function AttributeForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const [name, setName] = useState(String(record?.name ?? ""));
  const [values, setValues] = useState(((record?.values as string[]) ?? []).join(", "));
  const list = [...new Set(values.split(",").map((v) => v.trim()).filter(Boolean))];
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (!name.trim() || !list.length) return; if (record) updateRecord("product-attributes", record.id, { name: name.trim(), values: list }); else createRecord("product-attributes", { name: name.trim(), values: list }); onDone(); }} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{record ? `Attribute: ${record.name}` : "New Product Attribute"}</h1>
        <p className="mt-1 text-muted-foreground">Define an attribute type (e.g., Color, Size) and its values for product variants</p>
      </div>
      <Section title="Attribute Details">
        <Field label="Name" htmlFor="at-name"><input id="at-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Color, Size" className={inputCls} /></Field>
        <Field label="Values (comma-separated)" htmlFor="at-vals" hint={list.length ? `${list.length} value(s)` : undefined}><input id="at-vals" value={values} onChange={(e) => setValues(e.target.value)} placeholder="e.g., Red, Blue, Green" className={inputCls} /></Field>
        <div className="flex gap-2">
          <button type="submit" disabled={!name.trim() || !list.length} className={btn.primary}>{record ? "Save" : "Create"}</button>
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        </div>
      </Section>
    </form>
  );
}

/* ---------- units of measure ---------- */

export function Units() {
  const units = useUnits();
  const products = useProducts();
  const [f, setF] = useState({ code: "", name: "", symbol: "", decimals: "0" });
  const [focus, setFocus] = useState(0);
  const add = () => {
    const code = f.code.trim().toUpperCase();
    if (!code || units.some((u) => u.code === code)) return;
    createRecord("units", { code, name: f.name.trim() || code, symbol: f.symbol.trim(), decimals: Math.min(6, Math.max(0, Math.floor(num(f.decimals)))), status: "ACTIVE" });
    setF({ code: "", name: "", symbol: "", decimals: "0" });
  };
  const cell = "h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring";
  const onKey = (e: React.KeyboardEvent) => e.key === "Enter" && add();
  return (
    <div className="space-y-4">
      <PageHeader title="Units of Measure" subtitle="Manage units and their decimal precision" actions={<button type="button" onClick={() => setFocus((x) => x + 1)} className={btn.primary}><Plus /> New Unit</button>} />
      <p className="text-xs text-muted-foreground">Decimals set quantity precision (0 = whole numbers only, e.g. EA; KG = 3). Click a field to edit inline.</p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground">{["Code", "Name", "Symbol", "Decimals", "Status", ""].map((h) => <th key={h} className="h-10 px-2 font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-b border-border/60">
                <td className="p-2 font-mono text-sm">{String(u.code)}</td>
                <EditCell collection="units" row={u} field="name" />
                <EditCell collection="units" row={u} field="symbol" />
                <EditCell collection="units" row={u} field="decimals" numeric />
                <td className="p-2"><button type="button" onClick={() => updateRecord("units", u.id, { status: u.status === "INACTIVE" ? "ACTIVE" : "INACTIVE" })}><StatusBadge status={u.status} /></button></td>
                <td className="p-2 text-right">
                  <button type="button" aria-label={`Delete ${u.code}`} onClick={() => (products.some((p) => p.uom === u.code || p.altUnit === u.code) ? alert(`${u.code} is used by products — set it inactive instead.`) : deleteRecord("units", u.id))} className={cn(btn.icon, "h-7 w-7")}><Trash2 className="!size-3.5" /></button>
                </td>
              </tr>
            ))}
            <tr className="bg-muted/30">
              <td className="p-1"><input key={focus} autoFocus={focus > 0} aria-label="New unit code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} onKeyDown={onKey} placeholder="CODE *" className={cn(cell, "font-mono")} /></td>
              <td className="p-1"><input aria-label="New unit name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={onKey} placeholder="Add a unit..." className={cell} /></td>
              <td className="p-1"><input aria-label="New unit symbol" value={f.symbol} onChange={(e) => setF({ ...f, symbol: e.target.value })} onKeyDown={onKey} placeholder="Symbol" className={cell} /></td>
              <td className="p-1"><input aria-label="New unit decimals" type="number" min="0" max="6" value={f.decimals} onChange={(e) => setF({ ...f, decimals: e.target.value })} onKeyDown={onKey} className={cell} /></td>
              <td className="p-1"><button type="button" aria-label="Add unit" disabled={!f.code.trim()} onClick={add} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50"><Check className="h-3.5 w-3.5" /></button></td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- warehouses ---------- */

const W_BASE = "/inventory/warehouses";

export function Warehouses() {
  const router = useRouter();
  const sub = subOf(usePathname(), W_BASE);
  const warehouses = useCollection("warehouses");
  const moves = useMoves();
  const close = () => router.push(W_BASE);
  const columns: Column<Rec>[] = [
    { key: "code", header: "Code", cell: (w) => <span className="font-mono text-sm">{String(w.code)}</span> },
    { key: "name", header: "Name", cell: (w) => <span className="font-medium">{String(w.name)}</span> },
    { key: "addr", header: "Address", cell: (w) => String(w.address || "—") },
    { key: "status", header: "Status", cell: (w) => <StatusBadge status={w.status ?? "ACTIVE"} /> },
  ];
  const detail = sub && sub !== "new" ? warehouses.find((w) => w.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Warehouses" actions={<Link href={`${W_BASE}/new`} className={btn.primary}><Plus /> New Warehouse</Link>} />
      <DataTable
        columns={columns}
        rows={warehouses}
        onRowClick={(w) => router.push(`${W_BASE}/${w.id}`)}
        menu={(w) => [
          { label: "Open", onSelect: () => router.push(`${W_BASE}/${w.id}`) },
          { label: "Delete", destructive: true, onSelect: () => (moves.some((m) => m.warehouseId === w.id) ? alert(`${w.name} has stock movements — set it inactive instead.`) : confirm(`Delete ${w.name}?`) && deleteRecord("warehouses", w.id)) },
        ]}
      />
      {sub === "new" && <SidePanel onClose={close}><WarehouseForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><WarehouseForm key={detail.id} record={detail} onDone={close} /></SidePanel>}
    </div>
  );
}

function WarehouseForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const warehouses = useCollection("warehouses");
  const [f, setF] = useState({ code: String(record?.code ?? ""), name: String(record?.name ?? ""), address: String(record?.address ?? ""), orgUnit: String(record?.orgUnit ?? ""), active: (record?.status ?? "ACTIVE") === "ACTIVE" });
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.code.trim() || !f.name.trim()) return setError("Code and name are required.");
    if (warehouses.some((w) => w.id !== record?.id && String(w.code).toLowerCase() === f.code.trim().toLowerCase())) return setError(`Code ${f.code} is already used.`);
    const data = { code: f.code.trim().toUpperCase(), name: f.name.trim(), address: f.address.trim(), orgUnit: f.orgUnit, status: f.active ? "ACTIVE" : "INACTIVE" };
    if (record) updateRecord("warehouses", record.id, data);
    else createRecord("warehouses", data);
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? `Warehouse: ${record.name}` : "New Warehouse"}</h1>
      <Section title="Warehouse Details" className="max-w-xl">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Code<Req /></>} htmlFor="w-code"><input id="w-code" autoFocus value={f.code} onChange={(e) => set({ code: e.target.value })} placeholder="e.g. WH-01" className={inputCls} /></Field>
          <Field label={<>Name<Req /></>} htmlFor="w-name"><input id="w-name" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Main Warehouse" className={inputCls} /></Field>
        </div>
        <Field label="Address" htmlFor="w-addr"><input id="w-addr" value={f.address} onChange={(e) => set({ address: e.target.value })} placeholder="e.g. 12 Industrial Estate, Kochi" className={inputCls} /></Field>
        <Field label="Org Unit"><Select value={f.orgUnit} onChange={(v) => set({ orgUnit: v })} placeholder="Company-wide" options={[{ value: "HEAD_OFFICE", label: "Head Office (Head office)" }]} /></Field>
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.active} onChange={(v) => set({ active: v })} label="Active" /> <Label>Active</Label></label>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className={btn.primary}>{record ? "Save Changes" : "Create Warehouse"}</button>
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        </div>
      </Section>
    </form>
  );
}
