"use client";

// Pieces shared by the Sales documents (proposals, orders, invoices, credit notes…).

import { useMemo, useState } from "react";
import { ChevronsUpDown, Plus, Search, Trash2 } from "lucide-react";
import { useCollection, type Rec } from "@/lib/store";
import { docTotals, lineAmounts, type DiscountType, type DocLine } from "@/lib/sales";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";
import { AccountPicker, Badge, Card, CardTitle, Select, Switch, btn, inputCls, money } from "@/components/accounting/kit";

export const useCustomers = () => useCollection("customers");
export const useProducts = () => useCollection("products");

export const blankLine = (): DocLine => ({ description: "", qty: 1, unitPrice: 0, discPct: 0, taxPct: 0 });

export function Section({ title, action, children, className }: { title: React.ReactNode; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <div className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          {action}
        </div>
        {children}
      </div>
    </Card>
  );
}

// "Invoice # INV-01 — Next number — assigned when you save."
export function NumberBanner({ label, value, saved, compact }: { label: string; value: string; saved?: boolean; compact?: boolean }) {
  return (
    <div className={cn("flex rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-sm", compact ? "flex-col gap-0.5" : "items-center justify-between")}>
      <span className="text-xs text-muted-foreground">
        {label} <b className="ml-1 font-mono text-sm text-foreground">{value}</b>
      </span>
      {!saved && <span className="text-xs text-muted-foreground">Next number — assigned when you save.</span>}
    </div>
  );
}

export const Opt = () => <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>;
export const Req = () => <span className="text-destructive">*</span>;

// Searchable picker over records (customers, products, warehouses…).
export function RecordPicker({ items, value, onChange, placeholder, getLabel, getSub, emptyText, ariaLabel, size = "md" }: {
  items: Rec[];
  value: string;
  onChange: (id: string) => void;
  placeholder: string;
  getLabel: (r: Rec) => string;
  getSub?: (r: Rec) => string;
  emptyText: string;
  ariaLabel?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useDismiss(open, setOpen);
  const selected = items.find((r) => r.id === value);
  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return items.filter((r) => !t || `${getLabel(r)} ${getSub?.(r) ?? ""}`.toLowerCase().includes(t));
  }, [items, q, getLabel, getSub]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={undefined}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex w-full items-center justify-between gap-2 rounded-md border border-input bg-muted/40 px-3 text-left text-sm shadow-sm", size === "sm" ? "h-8" : "h-9", !selected && "text-foreground/80")}
      >
        <span className="truncate">{selected ? getLabel(selected) : placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[max(100%,16rem)] rounded-md border border-border bg-popover p-1 shadow-md">
          <div className="flex items-center gap-2 border-b border-border px-2">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search..." className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div role="listbox" className="max-h-64 overflow-y-auto py-1">
            {rows.length === 0 && <p className="px-2 py-5 text-center text-sm text-muted-foreground">{items.length ? "No matches." : emptyText}</p>}
            {rows.map((r) => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={r.id === value}
                onClick={() => {
                  onChange(r.id);
                  setOpen(false);
                  setQ("");
                }}
                className={cn("flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent", r.id === value && "bg-accent")}
              >
                <span className="truncate">{getLabel(r)}</span>
                {getSub && <span className="shrink-0 text-xs text-muted-foreground">{getSub(r)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomerPicker({ value, onChange, placeholder = "Select customer..." }: { value: string; onChange: (name: string) => void; placeholder?: string }) {
  const customers = useCustomers();
  const active = customers.filter((c) => c.status !== "INACTIVE" && !c.frozen);
  const id = customers.find((c) => c.name === value)?.id ?? "";
  return (
    <RecordPicker
      ariaLabel="Customer"
      items={active}
      value={id}
      onChange={(cid) => onChange(String(customers.find((c) => c.id === cid)?.name ?? ""))}
      placeholder={placeholder}
      getLabel={(c) => String(c.name)}
      getSub={(c) => String(c.number ?? "")}
      emptyText="No customers yet — add one under Sales › Customers."
    />
  );
}

export const DISCOUNT_TYPES = [
  { value: "NONE", label: "None" },
  { value: "PERCENT", label: "Percentage (%)" },
  { value: "AMOUNT", label: "Fixed amount" },
];

// `accounts` adds a per-line ledger account column (bills: "Show expense account").
type Cols = { disc?: boolean; tax?: boolean; accounts?: Rec[] };

// Line items table. With no products set up, the description alone carries the line.
export function LineItems<L extends DocLine & { accountId?: string }>({ lines, setLines, cols = {}, taxRates = [] }: { lines: L[]; setLines: (l: L[]) => void; cols?: Cols; taxRates?: Rec[] }) {
  const products = useProducts();
  const set = (i: number, patch: Partial<DocLine & { accountId?: string }>) => setLines(lines.map((l, k) => (k === i ? ({ ...l, ...patch } as L) : l)));
  const pick = (i: number, pid: string) => {
    const p = products.find((x) => x.id === pid);
    if (p) set(i, { productId: pid, description: String(p.description || p.name), uom: String(p.uom ?? ""), unitPrice: Number(p.retail ?? 0) || 0, taxPct: Number(p.tax ?? lines[i].taxPct ?? 0) || 0 });
  };
  const total = lines.reduce((s, l) => s + lineAmounts(l).total, 0);
  const head = "px-2 pb-2 text-left text-sm font-medium text-muted-foreground";
  const cell = "px-1 py-1.5 align-middle";
  const num = cn(inputCls, "h-8 text-right");

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className={cn(head, "w-[24%]")}>Product</th>
              <th className={head}>Description</th>
              <th className={cn(head, "w-16")}>Qty</th>
              <th className={cn(head, "w-14")}>UOM</th>
              <th className={cn(head, "w-24")}>Unit Price</th>
              {cols.disc && <th className={cn(head, "w-16")}>Disc %</th>}
              {cols.tax && <th className={cn(head, "w-28")}>Tax %</th>}
              {cols.accounts && <th className={cn(head, "w-44")}>Account</th>}
              <th className={cn(head, "w-24 text-right")}>Total</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className={cell}>
                  <RecordPicker
                    size="sm"
                    ariaLabel={`Line ${i + 1} product`}
                    items={products.filter((p) => p.status !== "INACTIVE")}
                    value={l.productId ?? ""}
                    onChange={(pid) => pick(i, pid)}
                    placeholder="Select product..."
                    getLabel={(p) => String(p.name)}
                    getSub={(p) => money(Number(p.retail ?? 0) || 0)}
                    emptyText="No products yet — type a description instead."
                  />
                </td>
                <td className={cell}>
                  <input aria-label={`Line ${i + 1} description`} value={l.description} onChange={(e) => set(i, { description: e.target.value })} placeholder="Description" className={cn(inputCls, "h-8")} />
                </td>
                <td className={cell}>
                  <input aria-label={`Line ${i + 1} quantity`} type="number" min="0" value={l.qty} onChange={(e) => set(i, { qty: Number(e.target.value) || 0 })} className={num} />
                </td>
                <td className={cn(cell, "text-center text-muted-foreground")}>{l.uom || "-"}</td>
                <td className={cell}>
                  <input aria-label={`Line ${i + 1} unit price`} type="number" min="0" step="0.01" value={l.unitPrice || ""} onChange={(e) => set(i, { unitPrice: Number(e.target.value) || 0 })} placeholder="0.00" className={num} />
                </td>
                {cols.disc && (
                  <td className={cell}>
                    <input aria-label={`Line ${i + 1} discount`} type="number" min="0" max="100" value={l.discPct || ""} onChange={(e) => set(i, { discPct: Math.min(100, Number(e.target.value) || 0) })} placeholder="0" className={num} />
                  </td>
                )}
                {cols.tax && (
                  <td className={cell}>
                    <Select
                      size="sm"
                      ariaLabel={`Line ${i + 1} tax`}
                      value={String(l.taxPct ?? 0)}
                      onChange={(v) => set(i, { taxPct: Number(v) })}
                      options={[{ value: "0", label: "No tax (0%)" }, ...taxRates.filter((r) => Number(r.rate) > 0).map((r) => ({ value: String(Number(r.rate)), label: `${r.name} (${Number(r.rate)}%)` }))]}
                    />
                  </td>
                )}
                {cols.accounts && (
                  <td className={cell}>
                    <AccountPicker ariaLabel={`Line ${i + 1} account`} accounts={cols.accounts} types={["EXPENSE", "ASSET"]} value={l.accountId ?? ""} onChange={(id) => set(i, { accountId: id })} />
                  </td>
                )}
                <td className={cn(cell, "text-right tabular-nums")}>{money(lineAmounts(l).total)}</td>
                <td className={cell}>
                  <button type="button" aria-label="Remove line" disabled={lines.length <= 1} onClick={() => setLines(lines.filter((_, k) => k !== i))} className={cn(btn.icon, "h-7 w-7 text-muted-foreground")}>
                    <Trash2 className="!size-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between rounded-md bg-muted/60 px-2 py-1.5">
        <button type="button" onClick={() => setLines([...lines, blankLine() as L])} className={btn.smOutline}>
          <Plus /> Add Line
        </button>
        <span className="pr-10 text-sm font-semibold tabular-nums">{money(total)}</span>
      </div>
    </div>
  );
}

export const validLines = (lines: DocLine[]) => lines.filter((l) => (l.description.trim() || l.productId) && l.qty > 0);

export function TotalsBox({ lines, discountType, discountValue, shipping }: { lines: DocLine[]; discountType?: DiscountType; discountValue?: number; shipping?: number }) {
  const t = docTotals(lines, { discountType, discountValue, shipping });
  const row = (label: string, v: number, strong?: boolean) => (
    <div className={cn("flex justify-between gap-8", strong && "border-t border-border pt-2 text-base font-semibold")}>
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="tabular-nums">{money(v)}</span>
    </div>
  );
  return (
    <div className="ml-auto w-64 space-y-1.5 text-sm">
      {row("Subtotal", t.subtotal)}
      {t.discount > 0 && row("Discount", -t.discount)}
      {row("Tax", t.tax)}
      {t.shipping > 0 && row("Shipping", t.shipping)}
      {row("Total", t.total, true)}
    </div>
  );
}

const STATUS_TONES: Record<string, "muted" | "success" | "primary" | "info" | "warning" | "destructive"> = {
  DRAFT: "muted", SENT: "info", ACCEPTED: "success", REJECTED: "destructive", CONVERTED: "primary",
  CONFIRMED: "info", PARTIALLY_DELIVERED: "warning", DELIVERED: "success", INVOICED: "primary", CANCELLED: "destructive",
  DISPATCHED: "info", UNPAID: "warning", PARTIAL: "info", PAID: "success", OVERDUE: "destructive",
  ACTIVE: "success", PAUSED: "muted", ENDED: "muted", INACTIVE: "muted", SUSPENDED: "destructive", OPEN: "info", APPLIED: "success",
  PENDING_APPROVAL: "warning", APPROVED: "info", PARTIALLY_CONVERTED: "warning", FULLY_CONVERTED: "primary", CLOSED: "muted",
  PARTIALLY_RESPONDED: "warning", RESPONDED: "info", UNDER_EVALUATION: "warning", AWARDED: "success", NOT_AWARDED: "muted",
  PARTIALLY_RECEIVED: "warning", FULLY_RECEIVED: "success", PARTIALLY_BILLED: "warning", FULLY_BILLED: "primary",
  POSTED: "success", SHIPPED: "info", COMPLETED: "success", PARTIALLY_PAID: "info", ISSUED: "info", PARTIALLY_APPLIED: "warning",
  RECOVERED: "success", EXECUTING: "warning", EXECUTED: "success",
};

export function StatusBadge({ status }: { status: unknown }) {
  const s = String(status ?? "DRAFT").toUpperCase();
  return <Badge tone={STATUS_TONES[s] ?? "muted"}>{s.replace(/_/g, " ")}</Badge>;
}

export function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      <Switch checked={checked} onChange={onChange} label={label} />
      {label}
    </label>
  );
}
