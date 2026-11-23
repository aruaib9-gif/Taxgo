"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { createRecord, updateRecord, nextNumber, useCollection, type Rec } from "@/lib/store";
import type { EntitySchema, Field } from "@/lib/schemas";
import { BRAND } from "@/lib/brand";
import { Select } from "@/components/accounting/pickers";

type Val = string | number | boolean;

function initialValues(schema: EntitySchema, record?: Rec) {
  const v: Record<string, Val> = {};
  for (const f of schema.fields) {
    if (record && record[f.name] !== undefined) v[f.name] = record[f.name] as Val;
    else if (f.default !== undefined) v[f.name] = f.default;
    else if (f.type === "checkbox") v[f.name] = false;
    else if (f.type === "date") v[f.name] = new Date().toISOString().slice(0, 10);
    else v[f.name] = "";
  }
  return v;
}

export function EntityForm({
  schema,
  record,
  onClose,
}: {
  schema: EntitySchema;
  record?: Rec;
  onClose: () => void;
}) {
  const editing = Boolean(record);
  const [values, setValues] = useState<Record<string, Val>>(() => initialValues(schema, record));
  const [error, setError] = useState<string | null>(null);

  const number = useMemo(() => {
    if (!schema.numberField) return null;
    if (editing) return String(record?.[schema.numberField.name] ?? "");
    return nextNumber(schema.collection, schema.numberField.prefix);
  }, [schema, editing, record]);

  const sections = useMemo(() => {
    const map = new Map<string, Field[]>();
    for (const f of schema.fields) {
      const s = f.section ?? "";
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(f);
    }
    return [...map.entries()];
  }, [schema]);

  function set(name: string, value: Val) {
    setValues((v) => ({ ...v, [name]: value }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const missing = schema.fields.find((f) => f.required && !String(values[f.name] ?? "").trim());
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    const data = { ...values };
    if (editing && record) {
      updateRecord(schema.collection, record.id, data);
    } else {
      if (schema.numberField && number) data[schema.numberField.name] = number;
      createRecord(schema.collection, data);
    }
    onClose();
  }

  const singular = schema.newLabel.replace(/^New\s+/i, "");
  const inputCls =
    "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <form
        onSubmit={submit}
        className="relative flex h-full w-full max-w-md flex-col border-l border-border bg-popover shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <h2 className="text-base font-semibold">
            {editing ? `Edit ${singular}` : schema.newLabel}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {schema.numberField && number ? (
            <div>
              <label className="text-xs text-muted-foreground">{schema.numberField.label}</label>
              <input className={inputCls + " text-muted-foreground"} value={number} readOnly />
              {!editing ? (
                <p className="mt-1 text-xs text-muted-foreground">Next number — assigned when you save.</p>
              ) : null}
            </div>
          ) : null}

          {sections.map(([section, fields]) => (
            <div key={section} className="space-y-3">
              {section ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {section}
                </p>
              ) : null}
              {fields.map((f) => (
                <FieldInput key={f.name} field={f} value={values[f.name]} onChange={(v) => set(f.name, v)} inputCls={inputCls} />
              ))}
            </div>
          ))}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm">
            {editing ? "Save changes" : `Create ${singular}`}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Label({ field }: { field: Field }) {
  return (
    <label className="text-xs text-muted-foreground">
      {field.label}
      {field.optional ? <span className="ml-1 opacity-60">(optional)</span> : null}
      {field.required ? <span className="ml-0.5 text-destructive">*</span> : null}
    </label>
  );
}

function RefSelect({ field, value, onChange }: { field: Field; value: Val; onChange: (v: Val) => void }) {
  const rows = useCollection(field.refCollection ?? "");
  const labelKey = field.refLabel ?? "name";
  const fromStore = rows.map((r) => String(r[labelKey] ?? "")).filter(Boolean);
  const options = Array.from(new Set([...fromStore, ...(field.refFallback ?? [])]));
  return (
    <div className="space-y-1">
      <Label field={field} />
      <Select value={String(value)} onChange={onChange} placeholder="Select…" options={options} ariaLabel={field.label} />
    </div>
  );
}

function FieldInput({
  field,
  value,
  onChange,
  inputCls,
}: {
  field: Field;
  value: Val;
  onChange: (v: Val) => void;
  inputCls: string;
}) {
  if (field.type === "ref") {
    return <RefSelect field={field} value={value} onChange={onChange} />;
  }

  if (field.type === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          className="accent-(--primary)"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1">
        <Label field={field} />
        <Select
          value={String(value)}
          onChange={onChange}
          placeholder={field.default ? undefined : "Select…"}
          options={field.options ?? []}
          ariaLabel={field.label}
        />
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1">
        <Label field={field} />
        <textarea
          className="min-h-20 w-full rounded-md border border-input bg-background p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder={field.placeholder}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  const type = field.type === "money" ? "number" : field.type;
  return (
    <div className="space-y-1">
      <Label field={field} />
      <div className="relative">
        {field.type === "money" ? (
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            {BRAND.currency}
          </span>
        ) : null}
        <input
          type={type}
          className={inputCls + (field.type === "money" ? " pl-7" : "")}
          placeholder={field.placeholder}
          value={String(value)}
          onChange={(e) =>
            onChange(field.type === "number" || field.type === "money" ? Number(e.target.value) : e.target.value)
          }
        />
      </div>
    </div>
  );
}
