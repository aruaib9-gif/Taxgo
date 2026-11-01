"use client";

// Building blocks for the accounting screens, matching the live platform's shadcn-style markup.

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronsUpDown, Ellipsis, Maximize2, Minimize2, Search, X } from "lucide-react";
import { useDismiss } from "@/lib/use-dismiss";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import type { AccountType } from "@/lib/accounting-seed";
import type { Rec } from "@/lib/store";

/* ---------- formatting ---------- */

export const money = (v: number) =>
  `${v < 0 ? "-" : ""}${BRAND.currency}${Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;

// "2026-12-01" → "Dec 1, 2026" (dates are calendar days, so no timezone shifting).
export function longDate(iso: unknown) {
  const s = String(iso ?? "");
  if (!/^\d{4}-\d{2}-\d{2}/.test(s)) return s || "-";
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export const today = () => new Date().toISOString().slice(0, 10);
export const num = (v: unknown) => Number(v ?? 0) || 0;

/* ---------- buttons & inputs ---------- */

const btnBase =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";

export const btn = {
  primary: cn(btnBase, "h-9 bg-primary px-4 py-2 text-primary-foreground shadow hover:bg-primary/90"),
  outline: cn(btnBase, "h-9 border border-input bg-background px-4 py-2 shadow-sm hover:bg-accent hover:text-accent-foreground"),
  ghost: cn(btnBase, "h-9 px-4 py-2 hover:bg-accent hover:text-accent-foreground"),
  icon: cn(btnBase, "h-8 w-8 hover:bg-accent hover:text-accent-foreground"),
  smPrimary: cn(btnBase, "h-8 rounded-md bg-primary px-3 text-xs text-primary-foreground shadow hover:bg-primary/90"),
  smOutline: cn(btnBase, "h-8 rounded-md border border-input bg-background px-3 text-xs shadow-sm hover:bg-accent hover:text-accent-foreground"),
};

export const inputCls =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export const textareaCls =
  "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm";

export function Label({ htmlFor, children, className }: { htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("text-sm font-medium leading-none", className)}>
      {children}
    </label>
  );
}

export function Field({ label, htmlFor, children, hint, className }: { label: React.ReactNode; htmlFor?: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export { DateInput, Select } from "./pickers";
import { Select } from "./pickers";

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder.replace(/\.+$/, "")}
      className={cn(inputCls, "h-8 w-[150px] lg:w-[250px]")}
    />
  );
}

export function Switch({ checked, onChange, id, label }: { checked: boolean; onChange: (v: boolean) => void; id?: string; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-input",
      )}
    >
      <span className={cn("block h-4 w-4 rounded-full bg-background shadow-lg transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
    </button>
  );
}

/* ---------- badges ---------- */

const badgeBase = "inline-flex items-center whitespace-nowrap rounded-md border px-2.5 py-0.5 text-xs font-medium transition-colors";

export function Badge({ tone = "muted", children }: { tone?: "muted" | "success" | "primary" | "info" | "warning" | "destructive"; children: React.ReactNode }) {
  const tones = {
    muted: "border-border bg-muted text-muted-foreground",
    success: "border-success/20 bg-success/10 text-success",
    primary: "border-transparent bg-primary text-primary-foreground",
    info: "border-primary/20 bg-primary/10 text-primary",
    warning: "border-warning/20 bg-warning/10 text-warning",
    destructive: "border-destructive/20 bg-destructive/10 text-destructive",
  };
  return <div className={cn(badgeBase, tones[tone])}>{children}</div>;
}

/* ---------- layout ---------- */

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-xl border border-border bg-card text-card-foreground shadow", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("font-semibold leading-none tracking-tight", className)}>{children}</div>;
}

export function EmptyCard({ children }: { children: React.ReactNode }) {
  return (
    <Card>
      <div className="p-6 py-10 text-center text-sm text-muted-foreground">{children}</div>
    </Card>
  );
}

export function StatCard({ label, value, tone, icon }: { label: string; value: string; tone?: "success" | "destructive"; icon?: React.ReactNode }) {
  return (
    <Card>
      <div className="p-4">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </p>
        <p className={cn("mt-1 text-2xl font-bold tabular-nums", tone === "success" && "text-success", tone === "destructive" && "text-destructive")}>{value}</p>
      </div>
    </Card>
  );
}

/* ---------- row menu ---------- */

export function RowMenu({ items }: { items: { label: string; onSelect: () => void; destructive?: boolean }[] }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  return (
    <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
      <button type="button" aria-label="Row actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={btn.icon}>
        <Ellipsis />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 min-w-32 rounded-md border border-border bg-popover p-1 text-left text-popover-foreground shadow-md">
          {items.map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                it.onSelect();
              }}
              className={cn("flex w-full rounded-sm px-2 py-1.5 text-sm hover:bg-accent", it.destructive && "text-destructive")}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- data table ---------- */

export type Column<T> = { key: string; header: string; cell: (row: T) => React.ReactNode; className?: string };

const PAGE_SIZES = [10, 20, 30, 50, 100];

export function DataTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  menu,
  pageSize: initialSize = 20,
  emptyText = "No results.",
}: {
  columns: Column<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  menu?: (row: T) => { label: string; onSelect: () => void; destructive?: boolean }[];
  pageSize?: number;
  emptyText?: string;
}) {
  const [size, setSize] = useState(initialSize);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pages - 1);
  const visible = rows.slice(current * size, current * size + size);
  const navBtn = cn(btn.icon, "border border-input bg-background shadow-sm");

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <div className="relative w-full overflow-auto">
          <table className="min-w-full caption-bottom text-sm">
            <thead>
              <tr className="border-b border-border">
                {columns.map((c) => (
                  <th key={c.key} className={cn("h-10 px-2 text-left align-middle font-medium text-muted-foreground", c.className)}>
                    {c.header}
                  </th>
                ))}
                {menu && <th className="h-10 w-10 px-2" />}
              </tr>
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (menu ? 1 : 0)} className="h-24 p-2 text-center align-middle">
                    {emptyText}
                  </td>
                </tr>
              ) : (
                visible.map((r) => (
                  <tr
                    key={r.id}
                    onClick={onRowClick ? () => onRowClick(r) : undefined}
                    className={cn("border-b border-border transition-colors hover:bg-muted/50", onRowClick && "cursor-pointer")}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn("p-2 align-middle", c.className)}>
                        {c.cell(r)}
                      </td>
                    ))}
                    {menu && (
                      <td className="w-10 p-2 text-right align-middle">
                        <RowMenu items={menu(r)} />
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {rows.length > PAGE_SIZES[0] && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-2">
          <div className="text-sm text-muted-foreground">{rows.length} total row(s)</div>
          <div className="flex items-center gap-6 lg:gap-8">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium">Rows per page</p>
              <Select
                ariaLabel="Rows per page"
                value={String(size)}
                onChange={(v) => {
                  setSize(Number(v));
                  setPage(0);
                }}
                options={PAGE_SIZES.map(String)}
                className="w-[70px]" size="sm"
              />
            </div>
            {pages > 1 && (
              <>
                <div className="text-sm font-medium">
                  Page {current + 1} of {pages}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" aria-label="First page" disabled={current === 0} onClick={() => setPage(0)} className={navBtn}>
                    <ChevronsLeft />
                  </button>
                  <button type="button" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)} className={navBtn}>
                    <ChevronLeft />
                  </button>
                  <button type="button" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className={navBtn}>
                    <ChevronRight />
                  </button>
                  <button type="button" aria-label="Last page" disabled={current >= pages - 1} onClick={() => setPage(pages - 1)} className={navBtn}>
                    <ChevronsRight />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- dialog ---------- */

export function Dialog({ open, onClose, title, description, children, className }: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div role="dialog" aria-modal="true" className={cn("relative grid w-full max-w-lg gap-4 rounded-lg border border-border bg-background p-6 shadow-lg", className)}>
        <div className="flex flex-col space-y-1.5">
          <h2 className="flex items-center gap-2 text-lg font-semibold leading-none tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
        <button type="button" onClick={onClose} className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- side panel ---------- */

const noop = () => () => {};
function useSlot() {
  return useSyncExternalStore(noop, () => document.getElementById("side-panel-slot"), () => null);
}

// Record panel ("New Account", account detail…) docked to the right of the list, like the live app.
// Opening it collapses the menus to icons (see the panel-open variant in globals.css).
export function SidePanel({ onClose, children, defaultExpanded = false }: { onClose: () => void; children: React.ReactNode; defaultExpanded?: boolean }) {
  const slot = useSlot();
  const [expanded, setExpanded] = useState(defaultExpanded);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[role=dialog]") && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  if (!slot) return null;
  return createPortal(
    <section
      aria-label="Record panel"
      data-panel-expanded={expanded || undefined}
      className={cn(
        "flex h-screen flex-col border-l border-border bg-card",
        expanded ? "w-full" : "fixed inset-0 z-40 w-full lg:static lg:w-[min(44rem,52vw)]",
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-end gap-2 border-b border-border px-4">
        <button type="button" onClick={() => setExpanded((e) => !e)} className={cn(btn.ghost, "h-8 px-2 text-muted-foreground hover:text-foreground", expanded && "bg-accent")}>
          {expanded ? "Minimize" : "Expand"} {expanded ? <Minimize2 className="!size-3.5" /> : <Maximize2 className="!size-3.5" />}
        </button>
        <button type="button" onClick={onClose} className={cn(btn.ghost, "h-8 px-2 text-muted-foreground hover:text-foreground")}>
          Close <X className="!size-3.5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
    </section>,
    slot,
  );
}

/* ---------- account picker ---------- */

const TYPE_ORDER: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];
const TYPE_PLURAL: Record<AccountType, string> = { ASSET: "Assets", LIABILITY: "Liabilities", EQUITY: "Equity", REVENUE: "Revenue", EXPENSE: "Expenses" };

// Searchable account combobox grouped by type ("ASSETS (21)"), as on the live journal form.
export function AccountPicker({ accounts, value, onChange, placeholder = "Select account...", types, ariaLabel }: {
  accounts: Rec[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  types?: AccountType[];
  ariaLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useDismiss(open, setOpen);
  const selected = accounts.find((a) => a.id === value);
  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    return TYPE_ORDER.filter((t) => !types || types.includes(t))
      .map((t) => ({
        type: t,
        rows: accounts
          .filter((a) => a.type === t && a.isActive !== false)
          .filter((a) => !term || `${a.code} ${a.name}`.toLowerCase().includes(term))
          .sort((a, b) => String(a.code).localeCompare(String(b.code))),
      }))
      .filter((g) => g.rows.length);
  }, [accounts, q, types]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn("flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-sm", !selected && "text-muted-foreground")}
      >
        <span className="truncate">{selected ? `${selected.code} - ${selected.name}` : placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-[min(22rem,90vw)] rounded-md border border-border bg-popover p-1 shadow-md">
          <div className="flex items-center gap-2 border-b border-border px-2">
            <Search className="h-4 w-4 shrink-0 opacity-50" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search accounts..." className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          </div>
          <div role="listbox" className="max-h-72 overflow-y-auto py-1">
            {groups.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No account found.</p>}
            {groups.map((g) => (
              <div key={g.type}>
                <p className="px-2 py-1.5 text-xs font-medium uppercase text-muted-foreground">
                  {TYPE_PLURAL[g.type]} <span className="opacity-70">({g.rows.length})</span>
                </p>
                {g.rows.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    role="option"
                    aria-selected={a.id === value}
                    onClick={() => {
                      onChange(a.id);
                      setOpen(false);
                      setQ("");
                    }}
                    className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent", a.id === value && "bg-accent")}
                  >
                    <span className="font-mono text-xs text-muted-foreground">{String(a.code)}</span>
                    <span className="truncate">{String(a.name)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- downloads ---------- */

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function toCSV(headers: string[], rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((r) => r.map(esc).join(",")).join("\n");
}

// Excel opens an HTML table saved as .xls; good enough for a one-click export without a library.
export function toExcelHTML(headers: string[], rows: (string | number)[][]) {
  const cell = (v: string | number, tag = "td") => `<${tag}>${String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</${tag}>`;
  return `<html><head><meta charset="utf-8"></head><body><table><tr>${headers.map((h) => cell(h, "th")).join("")}</tr>${rows.map((r) => `<tr>${r.map((v) => cell(v)).join("")}</tr>`).join("")}</table></body></html>`;
}
