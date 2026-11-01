"use client";

import { useState } from "react";
import { Download, Table2, ListTree } from "lucide-react";
import { Card, Button } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export type ReportRow = {
  label: string;
  amount?: number;
  bold?: boolean;
  indent?: boolean;
  muted?: boolean;
};
export type ReportSection = { title?: string; rows: ReportRow[] };

function money(n?: number) {
  if (n == null) return "";
  return `${BRAND.currency}${n.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

export function ReportView({
  title,
  subtitle,
  asOf,
  sections,
  highlight,
}: {
  title: string;
  subtitle?: string;
  asOf?: boolean; // single "as of" date vs a from/to range
  sections: ReportSection[];
  highlight?: { label: string; amount: number };
}) {
  const [tree, setTree] = useState(false);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-full border border-border bg-card p-0.5 text-xs">
            <button
              onClick={() => setTree(false)}
              className={"flex items-center gap-1 rounded-full px-3 py-1 font-medium " + (!tree ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              <Table2 className="h-3.5 w-3.5" /> Table
            </button>
            <button
              onClick={() => setTree(true)}
              className={"flex items-center gap-1 rounded-full px-3 py-1 font-medium " + (tree ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              <ListTree className="h-3.5 w-3.5" /> Tree
            </button>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" /> Download
          </Button>
        </div>
      </div>

      {/* date controls */}
      <Card className="mb-4 flex flex-wrap items-end gap-4 p-4">
        {asOf ? (
          <DateField label="As of Date" value="2026-10-31" />
        ) : (
          <>
            <DateField label="Start Date" value="2026-10-01" />
            <DateField label="End Date" value="2026-10-31" />
          </>
        )}
        <Button size="sm">Apply</Button>
      </Card>

      <Card className={"p-0 " + (tree ? "pl-2" : "")}>
        <table className="w-full text-sm">
          <tbody>
            {sections.map((s, si) => (
              <SectionRows key={si} section={s} tree={tree} />
            ))}
          </tbody>
        </table>
      </Card>

      {highlight ? (
        <Card className="mt-4 flex items-center justify-between p-5">
          <span className="text-base font-bold">{highlight.label}</span>
          <span className="text-xl font-bold">{money(highlight.amount)}</span>
        </Card>
      ) : null}
    </div>
  );
}

function SectionRows({ section, tree }: { section: ReportSection; tree: boolean }) {
  return (
    <>
      {section.title ? (
        <tr className="border-b border-border bg-muted/40">
          <td className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.title}
          </td>
          <td />
        </tr>
      ) : null}
      {section.rows.map((r, i) => (
        <tr key={i} className={"border-b border-border/50 " + (r.bold ? "font-semibold" : "")}>
          <td
            className={
              "px-4 py-2 " +
              (r.indent ? (tree ? "pl-10" : "pl-8") : "") +
              (r.muted ? " text-muted-foreground" : "")
            }
          >
            {r.label}
          </td>
          <td className="px-4 py-2 text-right tabular-nums">{money(r.amount)}</td>
        </tr>
      ))}
    </>
  );
}

function DateField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <input
        type="date"
        defaultValue={value}
        className="h-9 rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
