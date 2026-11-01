"use client";

// Shared pieces for the Analytics pages: a ready gate over the books, the report frame with the
// Download menu, date filters and a plain report table.

import { useState } from "react";
import { ChevronDown, Download } from "lucide-react";
import { useCollection } from "@/lib/store";
import { useAccounts, useJournals } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { Card, btn, downloadFile, money, toCSV, toExcelHTML } from "@/components/accounting/kit";
import { DateInput } from "@/components/accounting/pickers";
import { useDismiss } from "@/lib/use-dismiss";

// Re-renders whenever the ledger or the main sub-ledgers change; reports render once the chart loads.
export function useBooks(extra: string[] = []) {
  const accounts = useAccounts();
  useJournals();
  useCollection("invoices");
  useCollection("bills");
  useCollection("stock-moves");
  useCollection(extra[0] ?? "products");
  useCollection(extra[1] ?? "customers");
  useCollection(extra[2] ?? "vendors");
  return accounts.length > 0;
}

export const amt = (v: number | null | undefined) => (v == null || Math.abs(v) < 0.0005 ? "—" : money(v));
export const pct = (v: number | null) => (v == null || !Number.isFinite(v) ? "—" : `${v.toFixed(2)}%`);

export type Table = { headers: string[]; rows: (string | number)[][] };

export function DownloadMenu({ name, table, label = "Download" }: { name: string; table: () => Table; label?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const get = (kind: "csv" | "xls") => { const t = table(); if (kind === "csv") downloadFile(`${name}.csv`, toCSV(t.headers, t.rows), "text/csv"); else downloadFile(`${name}.xls`, toExcelHTML(t.headers, t.rows), "application/vnd.ms-excel"); setOpen(false); };
  return (
    <div ref={ref} className="relative">
      <button type="button" className={btn.smOutline} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}><Download /> {label} <ChevronDown className="!size-3" /></button>
      {open && <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-40 rounded-md border border-border bg-popover p-1 shadow-md">
        <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => get("csv")}>CSV</button>
        <button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => get("xls")}>Excel</button>
      </div>}
    </div>
  );
}

export function ReportHeader({ title, subtitle, actions }: { title: string; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0"><h1 className="text-2xl font-semibold tracking-tight">{title}</h1>{subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}</div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Draft dates apply only on "Apply", like the live filters.
export function useRange(initial: { from?: string; to?: string } = {}) {
  const [draft, setDraft] = useState({ from: initial.from ?? "", to: initial.to ?? "" });
  const [applied, setApplied] = useState(draft);
  return { draft, setDraft, from: applied.from || undefined, to: applied.to || undefined, apply: () => setApplied(draft) };
}

export function RangeFilter({ r, single, labels = ["Start Date", "End Date"], children }: { r: ReturnType<typeof useRange>; single?: boolean; labels?: string[]; children?: React.ReactNode }) {
  return (
    <Card><div className="flex flex-wrap items-end gap-3 p-5">
      {!single && <div className="space-y-1.5"><span className="text-sm font-medium">{labels[0]}</span><DateInput ariaLabel={labels[0]} className="w-40" value={r.draft.from} onChange={(v) => r.setDraft({ ...r.draft, from: v })} /></div>}
      <div className="space-y-1.5"><span className="text-sm font-medium">{single ? "As of Date" : labels[1]}</span><DateInput ariaLabel={single ? "As of Date" : labels[1]} className="w-40" value={r.draft.to} onChange={(v) => r.setDraft({ ...r.draft, to: v })} /></div>
      {children}
      <button type="button" className={btn.smPrimary} onClick={r.apply}>Apply</button>
    </div></Card>
  );
}

export function ViewToggle({ tree, setTree }: { tree: boolean; setTree: (v: boolean) => void }) {
  return (
    <div className="inline-flex rounded-md border border-input bg-background p-0.5 shadow-sm">
      {[["Table", false], ["Tree", true]].map(([l, v]) => <button key={String(l)} type="button" onClick={() => setTree(Boolean(v))} className={cn("rounded px-3 py-1 text-xs font-medium", tree === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{String(l)}</button>)}
    </div>
  );
}

export function SimpleTable({ headers, rows, right = [], empty = "No data", foot }: { headers: string[]; rows: React.ReactNode[][]; right?: number[]; empty?: string; foot?: React.ReactNode[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border">{headers.map((h, i) => <th key={h + i} className={cn("h-10 px-3 text-left font-medium text-muted-foreground", right.includes(i) && "text-right")}>{h}</th>)}</tr></thead>
        <tbody>{rows.length === 0 ? <tr><td colSpan={headers.length} className="h-16 text-center text-muted-foreground">{empty}</td></tr> : rows.map((r, i) => <tr key={i} className="border-b border-border/60">{r.map((c, j) => <td key={j} className={cn("px-3 py-2", right.includes(j) && "text-right tabular-nums")}>{c}</td>)}</tr>)}</tbody>
        {foot && <tfoot><tr className="border-t-2 border-border font-semibold">{foot.map((c, j) => <td key={j} className={cn("px-3 py-2", right.includes(j) && "text-right tabular-nums")}>{c}</td>)}</tr></tfoot>}
      </table>
    </div>
  );
}

export function TotalLine({ label, value, strong, tone }: { label: string; value: React.ReactNode; strong?: boolean; tone?: "good" | "bad" }) {
  return <div className={cn("flex items-center justify-between px-3 py-2 text-sm", strong && "border-t border-border text-base font-bold", tone === "good" && "text-success", tone === "bad" && "text-destructive")}><span>{label}</span><span className="tabular-nums">{value}</span></div>;
}
