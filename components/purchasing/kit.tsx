"use client";

// Building blocks shared by the Purchasing screens.

import { Plus, Trash2 } from "lucide-react";
import { useCollection, type Rec } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Card, SearchInput, Select, btn, inputCls, money, textareaCls } from "@/components/accounting/kit";
import { RecordPicker } from "@/components/sales/doc-kit";

export const useVendors = () => useCollection("vendors");
export const useWarehouses = () => useCollection("warehouses");

export const subOf = (pathname: string, base: string) => pathname.slice(base.length).replace(/^\//, "");
export const plusDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
export const label = (s: string) => s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ");
export const statusOptions = (all: string, statuses: string[]) => [{ value: "", label: all }, ...statuses.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))];

export function VendorPicker({ value, onChange, placeholder = "Select vendor..." }: { value: string; onChange: (name: string) => void; placeholder?: string }) {
  const vendors = useVendors();
  const usable = vendors.filter((v) => v.status !== "INACTIVE" && !v.frozen);
  return (
    <RecordPicker
      ariaLabel="Vendor"
      items={usable}
      value={vendors.find((v) => v.name === value)?.id ?? ""}
      onChange={(id) => onChange(String(vendors.find((v) => v.id === id)?.name ?? ""))}
      placeholder={placeholder}
      getLabel={(v) => String(v.name)}
      getSub={(v) => String(v.number ?? "")}
      emptyText="No vendors yet — add one under Purchasing › Vendors."
    />
  );
}

export function ProductPicker({ value, onChange, placeholder = "Select product...", size = "sm" }: { value: string; onChange: (id: string, product: Rec) => void; placeholder?: string; size?: "sm" | "md" }) {
  const products = useCollection("products");
  return (
    <RecordPicker
      size={size}
      ariaLabel="Product"
      items={products.filter((p) => p.status !== "INACTIVE")}
      value={value}
      onChange={(id) => onChange(id, products.find((p) => p.id === id)!)}
      placeholder={placeholder}
      getLabel={(p) => String(p.name)}
      getSub={(p) => String(p.sku ?? "")}
      emptyText="No products yet — add one under Inventory › Products."
    />
  );
}

export function WarehousePicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const warehouses = useWarehouses();
  return (
    <RecordPicker
      ariaLabel="Warehouse"
      items={warehouses.filter((w) => w.status !== "INACTIVE")}
      value={value}
      onChange={onChange}
      placeholder={warehouses.length ? "Select warehouse" : "No warehouses"}
      getLabel={(w) => String(w.name)}
      getSub={(w) => String(w.code ?? "")}
      emptyText="No warehouses yet — add one under Inventory › Warehouses."
    />
  );
}

// Textarea with the "0/500 characters" counter used across the purchasing forms.
export function CountedTextarea({ value, onChange, placeholder, ariaLabel, max = 500, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; ariaLabel: string; max?: number; rows?: number }) {
  return (
    <div className="space-y-1">
      <textarea aria-label={ariaLabel} rows={rows} maxLength={max} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={textareaCls} />
      <p className="text-xs text-muted-foreground">
        {value.length}/{max} characters
      </p>
    </div>
  );
}

// Toolbar of a list page: search box, optional filters.
export function ListToolbar({ q, setQ, placeholder, children }: { q: string; setQ: (v: string) => void; placeholder: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <SearchInput value={q} onChange={setQ} placeholder={placeholder} />
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function StatusFilter({ value, onChange, statuses, all = "All statuses" }: { value: string; onChange: (v: string) => void; statuses: string[]; all?: string }) {
  return <Select ariaLabel="Status" size="sm" value={value} onChange={onChange} options={statusOptions(all, statuses)} className="w-44" />;
}

export function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <p className="p-6 py-8 text-center text-sm text-muted-foreground">{children}</p>
    </Card>
  );
}

/* ---------- editable line grid ---------- */

export type GridCol<L> = {
  key: string;
  header: React.ReactNode;
  width?: string;
  render: (line: L, set: (patch: Partial<L>) => void, index: number) => React.ReactNode;
};

// Generic line editor: each column renders its own cell; "Add Line" appends `blank()`.
export function LineGrid<L>({ lines, setLines, cols, blank, footer, minLines = 1, addInHeader, addLabel = "Add Line" }: {
  lines: L[];
  setLines: (l: L[]) => void;
  cols: GridCol<L>[];
  blank: () => L;
  footer?: React.ReactNode;
  minLines?: number;
  addInHeader?: boolean;
  addLabel?: string;
}) {
  const set = (i: number) => (patch: Partial<L>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const add = (
    <button type="button" onClick={() => setLines([...lines, blank()])} className={btn.smOutline}>
      <Plus /> {addLabel}
    </button>
  );
  return (
    <div className="space-y-2">
      {addInHeader && <div className="-mt-12 flex justify-end">{add}</div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              {cols.map((c) => (
                <th key={c.key} className="px-1 pb-2 text-sm font-medium text-muted-foreground" style={c.width ? { width: c.width } : undefined}>
                  {c.header}
                </th>
              ))}
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border/60">
                {cols.map((c) => (
                  <td key={c.key} className="px-1 py-1.5 align-middle">
                    {c.render(l, set(i), i)}
                  </td>
                ))}
                <td className="py-1.5">
                  <button type="button" aria-label="Remove line" disabled={lines.length <= minLines} onClick={() => setLines(lines.filter((_, k) => k !== i))} className={cn(btn.icon, "h-7 w-7 text-muted-foreground")}>
                    <Trash2 className="!size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
      {!addInHeader && <div className="rounded-md bg-muted/60 px-2 py-1.5">{add}</div>}
    </div>
  );
}

export const numInput = (value: number | undefined, onChange: (v: number) => void, aria: string, placeholder = "0") => (
  <input aria-label={aria} type="number" min="0" step="any" value={value || ""} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} placeholder={placeholder} className={cn(inputCls, "h-8 text-right")} />
);
export const textInput = (value: string | undefined, onChange: (v: string) => void, aria: string, placeholder = "") => (
  <input aria-label={aria} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(inputCls, "h-8")} />
);

export const TotalRow = ({ label: l, value, strong }: { label: string; value: number; strong?: boolean }) => (
  <div className={cn("flex justify-end gap-8 px-2 py-1 text-sm", strong && "font-semibold")}>
    <span className={strong ? "" : "text-muted-foreground"}>{l}</span>
    <span className="w-28 text-right tabular-nums">{money(value)}</span>
  </div>
);
