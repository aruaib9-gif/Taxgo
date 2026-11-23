"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Plus, Search, Trash2, WandSparkles } from "lucide-react";
import { createRecord, deleteRecord, updateRecord, useCollection, type Rec } from "@/lib/store";
import { findAccountByCode, linesOf, onBooks, useBankAccounts, useJournals, useTaxRates, useTaxTypes } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, DataTable, Dialog, Field, Label, PageHeader, SearchInput, Select, SidePanel, StatCard, Switch, btn, inputCls, longDate, money, num, textareaCls, type Column , DateInput } from "./kit";

const rateLabel = (r: Rec) => `${String(r.name)} — ${num(r.rate)}%`;
const subOf = (pathname: string, base: string) => pathname.slice(base.length).replace(/^\//, "");

/* ---------- default tax settings (shared by Tax Types / Tax Rates) ---------- */

const SETTINGS_SEED = [{ id: "tax-settings", defaultRateId: "", pricesIncludeTax: true }];

function DefaultTaxCard() {
  const rates = useTaxRates();
  const [settings] = useCollection("tax-settings", SETTINGS_SEED);
  const s = settings ?? SETTINGS_SEED[0];
  const save = (patch: Record<string, unknown>) => settings && updateRecord("tax-settings", settings.id, patch);
  return (
    <Card>
      <div className="grid gap-6 p-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="default-tax">Default tax</Label>
          <Select
            id="default-tax"
            value={String(s.defaultRateId ?? "")}
            onChange={(v) => save({ defaultRateId: v })}
            placeholder="None"
            options={rates.filter((r) => r.isActive !== false).map((r) => ({ value: r.id, label: rateLabel(r) }))}
            className="max-w-60" size="sm"
          />
          <p className="max-w-sm text-xs text-muted-foreground">Filled in on new products and on invoice and bill lines. Products set to “No tax” stay untaxed.</p>
        </div>
        <div className="space-y-1.5 md:pt-4">
          <div className="flex items-center gap-2">
            <Switch id="prices-incl" checked={s.pricesIncludeTax !== false} onChange={(v) => save({ pricesIncludeTax: v })} />
            <Label htmlFor="prices-incl">Prices include tax</Label>
          </div>
          <p className="max-w-sm text-xs text-muted-foreground">The unit price typed on invoices and bills already includes tax; each document can untick it.</p>
        </div>
      </div>
    </Card>
  );
}

function ActiveBadge({ on }: { on: unknown }) {
  return on === false ? <Badge>Inactive</Badge> : <Badge tone="primary">Active</Badge>;
}

function FormShell({ title, cardTitle, onSubmit, submitLabel, onCancel, error, children }: {
  title: string;
  cardTitle: string;
  onSubmit: () => void;
  submitLabel: string;
  onCancel: () => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <Card>
        <div className="space-y-4 p-6">
          <CardTitle>{cardTitle}</CardTitle>
          {children}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className={btn.primary}>{submitLabel}</button>
            <button type="button" onClick={onCancel} className={btn.outline}>Cancel</button>
          </div>
        </div>
      </Card>
    </form>
  );
}

function ActiveToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Switch id="rec-active" checked={value} onChange={onChange} />
      <Label htmlFor="rec-active">Active</Label>
    </div>
  );
}

/* ---------- tax types ---------- */

const TT_BASE = "/tax/types";

export function TaxTypes() {
  const router = useRouter();
  const sub = subOf(usePathname(), TT_BASE);
  const types = useTaxTypes();
  const rates = useTaxRates();
  const [q, setQ] = useState("");
  const rows = types.filter((t) => !q.trim() || `${t.name} ${t.description}`.toLowerCase().includes(q.trim().toLowerCase()));
  const close = () => router.push(TT_BASE);
  const editing = sub && sub !== "new" ? types.find((t) => t.id === sub) : undefined;

  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (t) => <span className="font-medium">{String(t.name)}</span> },
    { key: "desc", header: "Description", cell: (t) => <span className="text-muted-foreground">{String(t.description ?? "")}</span> },
    { key: "active", header: "Active", cell: (t) => <ActiveBadge on={t.isActive} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Tax Types" subtitle="Manage tax type definitions" actions={<Link href={`${TT_BASE}/new`} className={btn.primary}><Plus /> New Tax Type</Link>} />
      <DefaultTaxCard />
      <SearchInput value={q} onChange={setQ} placeholder="Search tax types..." />
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(t) => router.push(`${TT_BASE}/${t.id}`)}
        menu={(t) => [
          { label: "Open", onSelect: () => router.push(`${TT_BASE}/${t.id}`) },
          {
            label: "Delete",
            destructive: true,
            onSelect: () => {
              if (rates.some((r) => r.taxTypeId === t.id)) return alert(`${t.name} has tax rates. Delete those first.`);
              if (confirm(`Delete tax type ${t.name}?`)) deleteRecord("tax-types", t.id);
            },
          },
        ]}
      />
      {(sub === "new" || editing) && (
        <SidePanel onClose={close}>
          <TaxTypeForm key={editing?.id ?? "new"} record={editing} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function TaxTypeForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const [name, setName] = useState(String(record?.name ?? ""));
  const [description, setDescription] = useState(String(record?.description ?? ""));
  const [active, setActive] = useState(record?.isActive !== false);
  const [error, setError] = useState("");
  return (
    <FormShell
      title={record ? `Tax Type: ${record.name}` : "New Tax Type"}
      cardTitle="Tax Type Details"
      submitLabel={record ? "Save Changes" : "Create Tax Type"}
      onCancel={onDone}
      error={error}
      onSubmit={() => {
        if (!name.trim()) return setError("Name is required.");
        const data = { name: name.trim(), description: description.trim(), isActive: active };
        if (record) updateRecord("tax-types", record.id, data);
        else createRecord("tax-types", data);
        onDone();
      }}
    >
      <Field label="Name" htmlFor="tt-name">
        <input id="tt-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Description" htmlFor="tt-desc">
        <textarea id="tt-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={textareaCls} />
      </Field>
      <ActiveToggle value={active} onChange={setActive} />
    </FormShell>
  );
}

/* ---------- tax rates ---------- */

const TR_BASE = "/tax/rates";

export function TaxRates() {
  const router = useRouter();
  const sub = subOf(usePathname(), TR_BASE);
  const rates = useTaxRates();
  const types = useTaxTypes();
  const [q, setQ] = useState("");
  const typeName = (id: unknown) => String(types.find((t) => t.id === id)?.name ?? "-");
  const rows = rates.filter((r) => !q.trim() || `${r.name} ${typeName(r.taxTypeId)}`.toLowerCase().includes(q.trim().toLowerCase()));
  const close = () => router.push(TR_BASE);
  const editing = sub && sub !== "new" ? rates.find((r) => r.id === sub) : undefined;

  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{String(r.name)}</span> },
    { key: "rate", header: "Rate (%)", cell: (r) => `${num(r.rate).toFixed(2)}%` },
    { key: "type", header: "Type", cell: (r) => typeName(r.taxTypeId) },
    { key: "from", header: "Effective From", cell: (r) => longDate(r.effectiveFrom) },
    { key: "to", header: "Effective To", cell: (r) => (r.effectiveTo ? longDate(r.effectiveTo) : "-") },
    { key: "active", header: "Active", cell: (r) => <ActiveBadge on={r.isActive} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Tax Rates" subtitle="Manage tax rates and percentages" actions={<Link href={`${TR_BASE}/new`} className={btn.primary}><Plus /> New Tax Rate</Link>} />
      <DefaultTaxCard />
      <SearchInput value={q} onChange={setQ} placeholder="Search tax rates..." />
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(r) => router.push(`${TR_BASE}/${r.id}`)}
        menu={(r) => [
          { label: "Open", onSelect: () => router.push(`${TR_BASE}/${r.id}`) },
          { label: "Delete", destructive: true, onSelect: () => confirm(`Delete tax rate ${r.name}?`) && deleteRecord("tax-rates", r.id) },
        ]}
      />
      {(sub === "new" || editing) && (
        <SidePanel onClose={close}>
          <TaxRateForm key={editing?.id ?? "new"} record={editing} types={types} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function TaxRateForm({ record, types, onDone }: { record?: Rec; types: Rec[]; onDone: () => void }) {
  const [name, setName] = useState(String(record?.name ?? ""));
  const [taxTypeId, setType] = useState(String(record?.taxTypeId ?? ""));
  const [rate, setRate] = useState(String(record?.rate ?? "0"));
  const [from, setFrom] = useState(String(record?.effectiveFrom ?? ""));
  const [to, setTo] = useState(String(record?.effectiveTo ?? ""));
  const [active, setActive] = useState(record?.isActive !== false);
  const [error, setError] = useState("");
  return (
    <FormShell
      title={record ? `Tax Rate: ${record.name}` : "New Tax Rate"}
      cardTitle="Tax Rate Details"
      submitLabel={record ? "Save Changes" : "Create Tax Rate"}
      onCancel={onDone}
      error={error}
      onSubmit={() => {
        if (!name.trim() || !taxTypeId) return setError("Name and tax type are required.");
        if (num(rate) < 0 || num(rate) > 100) return setError("Rate must be between 0 and 100.");
        if (from && to && to < from) return setError("Effective To must be after Effective From.");
        const data = { name: name.trim(), taxTypeId, rate: num(rate), effectiveFrom: from, effectiveTo: to, isActive: active };
        if (record) updateRecord("tax-rates", record.id, data);
        else createRecord("tax-rates", data);
        onDone();
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="tr-name">
          <input id="tr-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Tax Type" htmlFor="tr-type">
          <Select id="tr-type" value={taxTypeId} onChange={setType} placeholder="Select tax type" options={types.map((t) => ({ value: t.id, label: String(t.name) }))} />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Rate (%)" htmlFor="tr-rate">
          <input id="tr-rate" type="number" min="0" max="100" step="0.01" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Effective From" htmlFor="tr-from">
          <DateInput id="tr-from" value={from} onChange={(v) => setFrom(v)} />
        </Field>
        <Field label="Effective To" htmlFor="tr-to">
          <DateInput id="tr-to" value={to} onChange={(v) => setTo(v)} />
        </Field>
      </div>
      <ActiveToggle value={active} onChange={setActive} />
    </FormShell>
  );
}

/* ---------- tax categories ---------- */

const TC_BASE = "/tax/categories";

export function TaxCategories() {
  const router = useRouter();
  const sub = subOf(usePathname(), TC_BASE);
  const categories = useCollection("tax-categories");
  const rates = useTaxRates();
  const [q, setQ] = useState("");
  const rows = categories.filter((c) => !q.trim() || `${c.name} ${c.description}`.toLowerCase().includes(q.trim().toLowerCase()));
  const close = () => router.push(TC_BASE);
  const editing = sub && sub !== "new" ? categories.find((c) => c.id === sub) : undefined;
  const linked = (c: Rec) => ((c.rateIds as string[]) ?? []).map((id) => rates.find((r) => r.id === id)?.name).filter(Boolean).join(", ") || "-";

  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (c) => <span className="font-medium">{String(c.name)}</span> },
    { key: "desc", header: "Description", cell: (c) => <span className="text-muted-foreground">{String(c.description ?? "")}</span> },
    { key: "rates", header: "Linked Rates", cell: linked },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Tax Categories" subtitle="Group tax rates into categories" actions={<Link href={`${TC_BASE}/new`} className={btn.primary}><Plus /> New Category</Link>} />
      <SearchInput value={q} onChange={setQ} placeholder="Search categories..." />
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(c) => router.push(`${TC_BASE}/${c.id}`)}
        menu={(c) => [
          { label: "Open", onSelect: () => router.push(`${TC_BASE}/${c.id}`) },
          { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${c.name}?`) && deleteRecord("tax-categories", c.id) },
        ]}
      />
      {(sub === "new" || editing) && (
        <SidePanel onClose={close}>
          <TaxCategoryForm key={editing?.id ?? "new"} record={editing} rates={rates} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function TaxCategoryForm({ record, rates, onDone }: { record?: Rec; rates: Rec[]; onDone: () => void }) {
  const [name, setName] = useState(String(record?.name ?? ""));
  const [description, setDescription] = useState(String(record?.description ?? ""));
  const [rateIds, setRateIds] = useState<string[]>((record?.rateIds as string[]) ?? []);
  const [error, setError] = useState("");
  const toggle = (id: string) => setRateIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  return (
    <FormShell
      title={record ? `Tax Category: ${record.name}` : "New Tax Category"}
      cardTitle="Category Details"
      submitLabel={record ? "Save Changes" : "Create Category"}
      onCancel={onDone}
      error={error}
      onSubmit={() => {
        if (!name.trim()) return setError("Name is required.");
        const data = { name: name.trim(), description: description.trim(), rateIds };
        if (record) updateRecord("tax-categories", record.id, data);
        else createRecord("tax-categories", data);
        onDone();
      }}
    >
      <Field label="Name" htmlFor="tc-name">
        <input id="tc-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Description" htmlFor="tc-desc">
        <textarea id="tc-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={textareaCls} />
      </Field>
      <Field label="Tax Rates">
        <div className="min-h-40 space-y-1 rounded-md border border-input p-2">
          {rates.length === 0 && <p className="p-2 text-sm text-muted-foreground">No tax rates yet.</p>}
          {rates.map((r) => (
            <label key={r.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/60">
              <input type="checkbox" checked={rateIds.includes(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 rounded-full accent-(--primary)" />
              <span className="flex-1">{String(r.name)}</span>
              <span className="text-muted-foreground">{num(r.rate).toFixed(2)}%</span>
            </label>
          ))}
        </div>
      </Field>
    </FormShell>
  );
}

/* ---------- fiscal positions ---------- */

type RateRule = { from: string; to: string };

export function FiscalPositions() {
  const positions = useCollection("fiscal-positions");
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-4">
      <PageHeader
        title="Fiscal Positions"
        subtitle="Tax-rate mapping rules per partner — exports, designated zones, SEZ. Assigned parties get their invoice/bill line taxes remapped automatically."
        actions={<button type="button" onClick={() => setOpen(true)} className={btn.primary}><Plus /> New position</button>}
      />
      {positions.length === 0 ? (
        <Card>
          <p className="p-6 py-10 text-center text-sm text-muted-foreground">No fiscal positions yet.</p>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {positions.map((p) => (
            <Card key={p.id}>
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{String(p.name)}</p>
                    {p.notes ? <p className="text-sm text-muted-foreground">{String(p.notes)}</p> : null}
                  </div>
                  <button type="button" aria-label={`Delete ${p.name}`} onClick={() => confirm(`Delete ${p.name}?`) && deleteRecord("fiscal-positions", p.id)} className={btn.icon}>
                    <Trash2 />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {((p.rules as RateRule[]) ?? []).map((r, i) => (
                    <Badge key={i} tone="info">{r.from}% <ArrowRight className="mx-1 h-3 w-3" /> {r.to}%</Badge>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {open && <PositionDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function PositionDialog({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [rules, setRules] = useState<RateRule[]>([{ from: "5", to: "0" }]);
  const valid = name.trim() && rules.every((r) => r.from !== "" && r.to !== "");
  const set = (i: number, patch: Partial<RateRule>) => setRules(rules.map((r, k) => (k === i ? { ...r, ...patch } : r)));
  return (
    <Dialog open onClose={onClose} title="New fiscal position" description="Each rule replaces one source rate with another on document lines." className="max-w-md">
      <div className="space-y-3">
        <Field label="Name" htmlFor="fpos-name">
          <input id="fpos-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Export (zero-rated)" className={inputCls} />
        </Field>
        <Field label={<>Notes <span className="font-normal text-muted-foreground">(optional)</span></>} htmlFor="fpos-notes">
          <input id="fpos-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
        </Field>
        <div className="space-y-2">
          <Label>Rate rules</Label>
          {rules.map((r, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm">
              <input aria-label="From rate" type="number" min="0" value={r.from} onChange={(e) => set(i, { from: e.target.value })} className={cn(inputCls, "h-8 w-20")} />
              % <ArrowRight className="h-3.5 w-3.5" />
              <input aria-label="To rate" type="number" min="0" value={r.to} onChange={(e) => set(i, { to: e.target.value })} className={cn(inputCls, "h-8 w-20")} />
              %
              {rules.length > 1 && (
                <button type="button" aria-label="Remove rule" onClick={() => setRules(rules.filter((_, k) => k !== i))} className={btn.icon}>
                  <Trash2 />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={() => setRules([...rules, { from: "", to: "" }])} className={btn.smOutline}>
            <Plus /> Add rule
          </button>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!valid}
          onClick={() => {
            createRecord("fiscal-positions", { name: name.trim(), notes: notes.trim(), rules });
            onClose();
          }}
          className={btn.primary}
        >
          Create
        </button>
      </div>
    </Dialog>
  );
}

/* ---------- tax reports ---------- */

// Output tax = credits to Tax Output Payable (2100); input tax = debits to Input Tax Recoverable (1500), from posted entries.
export function TaxReports() {
  const journals = useJournals();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [result, setResult] = useState<{ output: number; input: number; count: number; from: string; to: string } | null>(null);

  function generate() {
    const outId = findAccountByCode("2100")?.id;
    const inId = findAccountByCode("1500")?.id;
    let output = 0;
    let input = 0;
    let count = 0;
    for (const j of journals) {
      if (!onBooks(j)) continue;
      const d = String(j.date ?? "");
      if ((from && d < from) || (to && d > to)) continue;
      let touched = false;
      for (const l of linesOf(j)) {
        if (l.accountId === outId) { output += num(l.credit) - num(l.debit); touched = true; }
        if (l.accountId === inId) { input += num(l.debit) - num(l.credit); touched = true; }
      }
      if (touched) count++;
    }
    setResult({ output, input, count, from, to });
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Tax Reports" subtitle="Output tax collected, input tax paid, and net tax liability from posted transactions" />
      <Card>
        <div className="space-y-4 p-6">
          <CardTitle>Report Parameters</CardTitle>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Date From" htmlFor="rep-from">
              <DateInput id="rep-from" value={from} onChange={(v) => setFrom(v)} className="w-44" />
            </Field>
            <Field label="Date To" htmlFor="rep-to">
              <DateInput id="rep-to" value={to} onChange={(v) => setTo(v)} className="w-44" />
            </Field>
            <button type="button" onClick={generate} className={btn.primary}>
              <Search /> Generate
            </button>
          </div>
        </div>
      </Card>
      {result && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Output Tax Collected" value={money(result.output)} />
            <StatCard label="Input Tax Paid" value={money(result.input)} />
            <StatCard label="Net Tax Liability" value={money(result.output - result.input)} tone={result.output - result.input > 0 ? "destructive" : "success"} />
          </div>
          <p className="text-sm text-muted-foreground">
            {result.count} posted transaction(s) touching tax accounts
            {result.from || result.to ? ` between ${result.from ? longDate(result.from) : "the start"} and ${result.to ? longDate(result.to) : "today"}` : ""}.
          </p>
        </>
      )}
    </div>
  );
}

/* ---------- tax categorize ---------- */

const HEADS = ["Business income", "Salary", "Interest income", "Rental income", "Other income", "Business expense", "Rent paid", "Personal", "Transfer", "Uncategorized"];

function guessHead(description: string, amount: number) {
  const d = description.toLowerCase();
  if (/(transfer|self|own account|neft to self)/.test(d)) return "Transfer";
  if (amount > 0) {
    if (/(salary|payroll)/.test(d)) return "Salary";
    if (/(interest|int\.? cr)/.test(d)) return "Interest income";
    if (/rent/.test(d)) return "Rental income";
    if (/(invoice|sale|payment from|receipt|customer)/.test(d)) return "Business income";
    return "Other income";
  }
  if (/rent/.test(d)) return "Rent paid";
  if (/(grocery|restaurant|movie|personal|atm)/.test(d)) return "Personal";
  return "Business expense";
}

function fiscalYear() {
  const now = new Date();
  const y = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return { from: `${y}-04-01`, to: `${y + 1}-03-31` };
}

export function TaxCategorize() {
  const banks = useBankAccounts();
  const txns = useCollection("bank-transactions");
  const [fy] = useState(fiscalYear);
  const [bank, setBank] = useState("");
  const [from, setFrom] = useState(fy.from);
  const [to, setTo] = useState(fy.to);
  const [notice, setNotice] = useState("");
  const rows = txns.filter((t) => (!bank || t.bankAccountId === bank) && String(t.date) >= from && String(t.date) <= to);
  const income = rows.filter((t) => num(t.amount) > 0 && t.taxHead !== "Transfer").reduce((s, t) => s + num(t.amount), 0);
  const expense = rows.filter((t) => num(t.amount) < 0 && t.taxHead !== "Transfer").reduce((s, t) => s - num(t.amount), 0);
  const uncategorized = rows.filter((t) => !t.taxHead || t.taxHead === "Uncategorized").length;

  function autoCategorize() {
    let n = 0;
    for (const t of rows) {
      if (t.taxHead && t.taxHead !== "Uncategorized") continue;
      updateRecord("bank-transactions", t.id, { taxHead: guessHead(String(t.description ?? ""), num(t.amount)) });
      n++;
    }
    setNotice(n ? `Categorized ${n} transaction(s) by keyword — review the heads below.` : "Nothing left to categorize.");
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Tax Categorize" subtitle="AI-classify your bank transactions into income, expense and other tax heads — the basis for your ITR estimate." />
      <Card>
        <div className="flex flex-wrap items-end gap-3 p-4">
          <Field label="Bank account" htmlFor="tc-bank">
            <Select id="tc-bank" value={bank} onChange={setBank} placeholder="All accounts" options={banks.map((b) => ({ value: b.id, label: `${b.bankName} — ${b.accountName}` }))} className="w-56" size="sm" />
          </Field>
          <Field label="From" htmlFor="tc-from">
            <DateInput id="tc-from" value={from} onChange={(v) => setFrom(v)} className="w-40" size="sm" />
          </Field>
          <Field label="To" htmlFor="tc-to">
            <DateInput id="tc-to" value={to} onChange={(v) => setTo(v)} className="w-40" size="sm" />
          </Field>
          <button type="button" onClick={autoCategorize} disabled={!rows.length} className={cn(btn.primary, "h-8")}>
            <WandSparkles /> Auto-categorize
          </button>
        </div>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Income" value={money(income)} tone="success" />
        <StatCard label="Expense" value={money(expense)} tone="destructive" />
        <StatCard label="Net" value={money(income - expense)} />
        <StatCard label="Uncategorized" value={String(uncategorized)} />
      </div>
      <Card>
        <div className="space-y-1 p-6 pb-3">
          <CardTitle>Transactions</CardTitle>
          <p className="text-sm text-muted-foreground">{rows.length} transaction(s). Adjust the tax head if the AI got it wrong.</p>
          {notice && <p className="text-sm text-primary">{notice}</p>}
        </div>
        {rows.length === 0 ? (
          <p className="p-6 pt-4 text-center text-sm text-muted-foreground">No transactions in this period. Import a bank statement first, then categorize.</p>
        ) : (
          <div className="overflow-x-auto px-6 pb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Date</th>
                  <th className="py-2 font-medium">Description</th>
                  <th className="py-2 text-right font-medium">Amount</th>
                  <th className="py-2 pl-4 font-medium">Tax head</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t.id} className="border-b border-border/60">
                    <td className="py-2">{longDate(t.date)}</td>
                    <td className="py-2">{String(t.description ?? "")}</td>
                    <td className={cn("py-2 text-right tabular-nums", num(t.amount) < 0 ? "text-destructive" : "text-success")}>{money(num(t.amount))}</td>
                    <td className="py-2 pl-4">
                      <Select ariaLabel="Tax head" value={String(t.taxHead ?? "Uncategorized")} onChange={(v) => updateRecord("bank-transactions", t.id, { taxHead: v })} options={HEADS} className="w-44" size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
