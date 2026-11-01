"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Inbox, Pencil } from "lucide-react";
import { Card, Button, Badge, PageHeader } from "@/components/ui";
import { EntityForm } from "@/components/entity-form";
import { useCollection, deleteRecord, type Rec } from "@/lib/store";
import { schemaFor, type Column } from "@/lib/schemas";
import { BRAND } from "@/lib/brand";

function money(n: unknown) {
  const v = Number(n ?? 0);
  return `${BRAND.currency}${v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

function cell(row: Rec, col: Column) {
  const val = row[col.key];
  if (col.money) return money(val);
  if (col.badge) {
    const s = String(val ?? "");
    const tone = /ACTIVE|PAID|RECEIVED|POSTED|CONFIRMED|FULFILLED|Won|Qualified|Converted/i.test(s)
      ? "success"
      : /DRAFT|New|UNPAID|PENDING|ON_LEAVE/i.test(s)
        ? "muted"
        : /INACTIVE|CANCELLED|Lost|SUSPENDED|TERMINATED/i.test(s)
          ? "warning"
          : "info";
    return s ? <Badge tone={tone as "success" | "muted" | "warning" | "info"}>{s}</Badge> : "";
  }
  return val != null && val !== "" ? String(val) : <span className="text-muted-foreground">—</span>;
}

type FormState = { mode: "create" } | { mode: "edit"; record: Rec } | null;

export function EntityList({ href }: { href: string }) {
  const schema = schemaFor(href)!;
  const rows = useCollection(schema.collection);
  const [form, setForm] = useState<FormState>(null);
  const [tab, setTab] = useState(schema.tabs?.[0] ?? "All");

  const editable = schema.fields.length > 0;
  const filtered =
    schema.tabs && tab !== "All"
      ? rows.filter((r) => String(r.status ?? "").toLowerCase() === tab.toLowerCase())
      : rows;

  const newButton = schema.createHref ? (
    <Link href={schema.createHref}>
      <Button size="sm">
        <Plus className="h-4 w-4" /> {schema.newLabel}
      </Button>
    </Link>
  ) : (
    <Button size="sm" onClick={() => setForm({ mode: "create" })}>
      <Plus className="h-4 w-4" /> {schema.newLabel}
    </Button>
  );

  return (
    <div>
      <PageHeader title={schema.title} subtitle={schema.subtitle} actions={newButton} />

      {schema.tabs ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {schema.tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={
                "rounded-full px-3 py-1 text-xs font-medium " +
                (t === tab ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground")
              }
            >
              {t}
            </button>
          ))}
        </div>
      ) : null}

      {editable ? (
        <p className="mb-2 text-xs text-muted-foreground">
          Click a row to edit it.
        </p>
      ) : null}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                {schema.columns.map((c) => (
                  <th key={c.key} className={"px-4 py-3 font-medium" + (c.money ? " text-right" : "")}>
                    {c.label}
                  </th>
                ))}
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={schema.columns.length + 1} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <Inbox className="h-5 w-5 text-muted-foreground" />
                      </span>
                      <p className="text-sm text-muted-foreground">
                        No {schema.title.toLowerCase()} yet. Click{" "}
                        <span className="font-medium text-foreground">{schema.newLabel}</span> to add one.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => editable && setForm({ mode: "edit", record: row })}
                    className={
                      "border-b border-border/50 last:border-0 hover:bg-muted/40 " +
                      (editable ? "cursor-pointer" : "")
                    }
                  >
                    {schema.columns.map((c) => (
                      <td key={c.key} className={"px-4 py-2.5" + (c.money ? " text-right tabular-nums" : "")}>
                        {cell(row, c)}
                      </td>
                    ))}
                    <td className="px-2">
                      <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                        {editable ? <Pencil className="h-3.5 w-3.5 opacity-40" /> : null}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRecord(schema.collection, row.id);
                          }}
                          aria-label="Delete"
                          className="hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 ? (
          <div className="px-4 py-2.5 text-xs text-muted-foreground">
            {filtered.length} record{filtered.length === 1 ? "" : "s"}
          </div>
        ) : null}
      </Card>

      {form ? (
        <EntityForm
          schema={schema}
          record={form.mode === "edit" ? form.record : undefined}
          onClose={() => setForm(null)}
        />
      ) : null}
    </div>
  );
}
