"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Play, Plus } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { accountLabel, createJournal, findAccountByCode, useAccounts } from "@/lib/ledger";
import { AccountPicker, Badge, Card, CardTitle, DataTable, Field, PageHeader, SearchInput, Select, SidePanel, StatCard, btn, inputCls, longDate, money, num, textareaCls, today, type Column , DateInput } from "./kit";

const METHODS = [
  { value: "STRAIGHT_LINE", label: "STRAIGHT LINE" },
  { value: "DECLINING_BALANCE", label: "DECLINING BALANCE" },
  { value: "SUM_OF_YEARS_DIGITS", label: "SUM OF YEARS DIGITS" },
];
const methodLabel = (m: unknown) => METHODS.find((x) => x.value === m)?.label ?? String(m ?? "");
const subOf = (pathname: string, base: string) => pathname.slice(base.length).replace(/^\//, "");
const round3 = (v: number) => Math.round(v * 1000) / 1000;

// Default accounts from the standard chart: PP&E, its accumulated depreciation, and depreciation expense.
const defaultAccounts = () => ({
  assetAccountId: findAccountByCode("1600")?.id ?? "",
  accumAccountId: findAccountByCode("1700")?.id ?? "",
  expenseAccountId: findAccountByCode("5700")?.id ?? "",
});

/* ---------- depreciation maths ---------- */

function monthsBetween(fromIso: string, toIso: string) {
  if (!fromIso || toIso < fromIso) return 0;
  const [fy, fm, fd] = fromIso.split("-").map(Number);
  const [ty, tm, td] = toIso.split("-").map(Number);
  return Math.max(0, (ty - fy) * 12 + (tm - fm) + (td >= fd ? 1 : 0));
}

// Accumulated depreciation an asset should carry as of a date.
export function accumulatedAsOf(a: Rec, asOf: string) {
  const cost = num(a.cost);
  const salvage = num(a.salvageValue);
  const life = Math.max(1, num(a.usefulLife));
  const base = Math.max(0, cost - salvage);
  const months = Math.min(life, monthsBetween(String(a.inServiceDate || a.purchaseDate || ""), asOf));
  if (a.method === "DECLINING_BALANCE") {
    let nbv = cost;
    const rate = 2 / life;
    for (let i = 0; i < months; i++) nbv = Math.max(salvage, nbv - nbv * rate);
    return round3(cost - nbv);
  }
  if (a.method === "SUM_OF_YEARS_DIGITS") {
    const years = Math.ceil(life / 12);
    const sum = (years * (years + 1)) / 2;
    let acc = 0;
    for (let m = 0; m < months; m++) acc += (base * (years - Math.floor(m / 12))) / sum / 12;
    return round3(Math.min(base, acc));
  }
  return round3((base / life) * months);
}

const nbv = (a: Rec) => num(a.cost) - num(a.accumulatedDepreciation);

/* ---------- asset categories ---------- */

const AC_BASE = "/assets/categories";

export function AssetCategories() {
  const router = useRouter();
  const sub = subOf(usePathname(), AC_BASE);
  const categories = useCollection("asset-categories");
  const accounts = useAccounts();
  const [q, setQ] = useState("");
  const rows = categories.filter((c) => !q.trim() || String(c.name).toLowerCase().includes(q.trim().toLowerCase()));
  const close = () => router.push(AC_BASE);
  const editing = sub && sub !== "new" ? categories.find((c) => c.id === sub) : undefined;

  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (c) => <span className="font-medium">{String(c.name)}</span> },
    { key: "life", header: "Useful Life (months)", cell: (c) => num(c.usefulLife) },
    { key: "method", header: "Depreciation Method", cell: (c) => methodLabel(c.method) },
    { key: "asset", header: "Asset Account", cell: (c) => accountLabel(accounts, c.assetAccountId) },
    { key: "accum", header: "Accum. Depr. Account", cell: (c) => accountLabel(accounts, c.accumAccountId) },
    { key: "exp", header: "Expense Account", cell: (c) => accountLabel(accounts, c.expenseAccountId) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Asset Categories" subtitle="Manage asset classification and default depreciation settings" actions={<Link href={`${AC_BASE}/new`} className={btn.primary}><Plus /> New Category</Link>} />
      <SearchInput value={q} onChange={setQ} placeholder="Search categories..." />
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(c) => router.push(`${AC_BASE}/${c.id}`)}
        menu={(c) => [
          { label: "Open", onSelect: () => router.push(`${AC_BASE}/${c.id}`) },
          {
            label: "Delete",
            destructive: true,
            onSelect: () => {
              if (readCollection("assets").some((a) => a.categoryId === c.id)) return alert(`${c.name} still has assets.`);
              if (confirm(`Delete ${c.name}?`)) deleteRecord("asset-categories", c.id);
            },
          },
        ]}
      />
      {(sub === "new" || editing) && (
        <SidePanel onClose={close}>
          <CategoryForm key={editing?.id ?? "new"} record={editing} accounts={accounts} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function CategoryForm({ record, accounts, onDone }: { record?: Rec; accounts: Rec[]; onDone: () => void }) {
  const [defaults] = useState(defaultAccounts);
  const [name, setName] = useState(String(record?.name ?? ""));
  const [life, setLife] = useState(String(record?.usefulLife ?? "60"));
  const [description, setDescription] = useState(String(record?.description ?? ""));
  const [method, setMethod] = useState(String(record?.method ?? "STRAIGHT_LINE"));
  const [assetAccountId, setAsset] = useState(String(record?.assetAccountId ?? defaults.assetAccountId));
  const [accumAccountId, setAccum] = useState(String(record?.accumAccountId ?? defaults.accumAccountId));
  const [expenseAccountId, setExpense] = useState(String(record?.expenseAccountId ?? defaults.expenseAccountId));
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setError("Name is required.");
    if (num(life) < 1) return setError("Useful life must be at least 1 month.");
    const data = { name: name.trim(), usefulLife: Math.floor(num(life)), description: description.trim(), method, assetAccountId, accumAccountId, expenseAccountId };
    if (record) updateRecord("asset-categories", record.id, data);
    else createRecord("asset-categories", data);
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? `Asset Category: ${record.name}` : "New Asset Category"}</h1>
      <Card>
        <div className="space-y-4 p-6">
          <CardTitle>Category Details</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="ac-name">
              <input id="ac-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Useful Life (months)" htmlFor="ac-life">
              <input id="ac-life" type="number" min="1" value={life} onChange={(e) => setLife(e.target.value)} className={inputCls} />
            </Field>
          </div>
          <Field label="Description" htmlFor="ac-desc">
            <textarea id="ac-desc" value={description} onChange={(e) => setDescription(e.target.value)} className={textareaCls} />
          </Field>
          <Field label="Depreciation Method" htmlFor="ac-method">
            <Select id="ac-method" value={method} onChange={setMethod} options={METHODS} />
          </Field>
          <Field label="Asset Account">
            <AccountPicker accounts={accounts} types={["ASSET"]} value={assetAccountId} onChange={setAsset} placeholder="Select asset account..." />
          </Field>
          <Field label="Accumulated Depreciation Account">
            <AccountPicker accounts={accounts} types={["ASSET"]} value={accumAccountId} onChange={setAccum} placeholder="Select accum. depreciation account..." />
          </Field>
          <Field label="Depreciation Expense Account">
            <AccountPicker accounts={accounts} types={["EXPENSE"]} value={expenseAccountId} onChange={setExpense} placeholder="Select expense account..." />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className={btn.primary}>{record ? "Save Changes" : "Create Category"}</button>
            <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
          </div>
        </div>
      </Card>
    </form>
  );
}

/* ---------- asset register ---------- */

const AL_BASE = "/assets/list";

const statusBadge = (s: unknown) =>
  s === "FULLY_DEPRECIATED" ? <Badge>FULLY DEPRECIATED</Badge> : s === "DISPOSED" ? <Badge tone="warning">DISPOSED</Badge> : <Badge tone="success">ACTIVE</Badge>;

export function AssetRegister() {
  const router = useRouter();
  const sub = subOf(usePathname(), AL_BASE);
  const assets = useCollection("assets");
  const categories = useCollection("asset-categories");
  const accounts = useAccounts();
  const [q, setQ] = useState("");
  const catName = (id: unknown) => String(categories.find((c) => c.id === id)?.name ?? "-");
  const rows = assets.filter((a) => !q.trim() || `${a.number} ${a.name} ${a.serialNumber}`.toLowerCase().includes(q.trim().toLowerCase()));
  const close = () => router.push(AL_BASE);
  const editing = sub && sub !== "new" ? assets.find((a) => a.id === sub) : undefined;

  const columns: Column<Rec>[] = [
    { key: "num", header: "Asset #", cell: (a) => <span className="font-mono text-sm">{String(a.number)}</span> },
    { key: "name", header: "Name", cell: (a) => <span className="font-medium">{String(a.name)}</span> },
    { key: "cat", header: "Category", cell: (a) => catName(a.categoryId) },
    { key: "date", header: "Purchase Date", cell: (a) => longDate(a.purchaseDate) },
    { key: "cost", header: "Cost", cell: (a) => money(num(a.cost)) },
    { key: "nbv", header: "Net Book Value", cell: (a) => money(nbv(a)) },
    { key: "status", header: "Status", cell: (a) => statusBadge(a.status) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Asset Register" subtitle="Track and manage fixed assets" actions={<Link href={`${AL_BASE}/new`} className={btn.primary}><Plus /> New Asset</Link>} />
      <SearchInput value={q} onChange={setQ} placeholder="Search assets..." />
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={(a) => router.push(`${AL_BASE}/${a.id}`)}
        menu={(a) => [
          { label: "Open", onSelect: () => router.push(`${AL_BASE}/${a.id}`) },
          { label: a.status === "DISPOSED" ? "Reinstate" : "Dispose", onSelect: () => updateRecord("assets", a.id, { status: a.status === "DISPOSED" ? "ACTIVE" : "DISPOSED" }) },
          { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${a.number} ${a.name}?`) && deleteRecord("assets", a.id) },
        ]}
      />
      {(sub === "new" || editing) && (
        <SidePanel onClose={close}>
          <AssetForm key={editing?.id ?? "new"} record={editing} categories={categories} accounts={accounts} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function AssetForm({ record, categories, accounts, onDone }: { record?: Rec; categories: Rec[]; accounts: Rec[]; onDone: () => void }) {
  const [defaults] = useState(defaultAccounts);
  const [preview] = useState(() => nextNumber("assets", "FA"));
  const [f, setF] = useState(() => ({
    serialNumber: String(record?.serialNumber ?? ""),
    name: String(record?.name ?? ""),
    description: String(record?.description ?? ""),
    categoryId: String(record?.categoryId ?? ""),
    purchaseDate: String(record?.purchaseDate ?? ""),
    inServiceDate: String(record?.inServiceDate ?? ""),
    cost: String(record?.cost ?? "0"),
    salvageValue: String(record?.salvageValue ?? "0"),
    usefulLife: String(record?.usefulLife ?? "60"),
    method: String(record?.method ?? "STRAIGHT_LINE"),
    assetAccountId: String(record?.assetAccountId ?? defaults.assetAccountId),
    accumAccountId: String(record?.accumAccountId ?? defaults.accumAccountId),
    expenseAccountId: String(record?.expenseAccountId ?? defaults.expenseAccountId),
  }));
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  // Picking a category fills in its life, method and accounts.
  function pickCategory(id: string) {
    const c = categories.find((x) => x.id === id);
    set(c ? { categoryId: id, usefulLife: String(c.usefulLife), method: String(c.method), assetAccountId: String(c.assetAccountId ?? ""), accumAccountId: String(c.accumAccountId ?? ""), expenseAccountId: String(c.expenseAccountId ?? "") } : { categoryId: id });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError("Name is required.");
    if (num(f.cost) <= 0) return setError("Cost must be greater than zero.");
    if (num(f.salvageValue) >= num(f.cost)) return setError("Salvage value must be below cost.");
    const data = { ...f, name: f.name.trim(), cost: num(f.cost), salvageValue: num(f.salvageValue), usefulLife: Math.max(1, Math.floor(num(f.usefulLife))) };
    if (record) updateRecord("assets", record.id, data);
    else createRecord("assets", { ...data, number: nextNumber("assets", "FA"), accumulatedDepreciation: 0, status: "ACTIVE" });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? `Asset: ${record.number} ${record.name}` : "New Asset"}</h1>
      <Card>
        <div className="space-y-4 p-6">
          <CardTitle>Asset Details</CardTitle>
          <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">
              Asset # <b className="ml-1 font-mono text-foreground">{String(record?.number ?? preview)}</b>
            </span>
            {!record && <span className="text-xs text-muted-foreground">Next number — assigned when you save.</span>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Serial Number" htmlFor="as-serial">
              <input id="as-serial" autoFocus value={f.serialNumber} onChange={(e) => set({ serialNumber: e.target.value })} placeholder="Optional — asset number auto-generates" className={inputCls} />
            </Field>
            <Field label="Name" htmlFor="as-name">
              <input id="as-name" value={f.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field label="Description" htmlFor="as-desc">
            <textarea id="as-desc" value={f.description} onChange={(e) => set({ description: e.target.value })} className={textareaCls} />
          </Field>
          <Field label="Category" htmlFor="as-cat">
            <Select id="as-cat" value={f.categoryId} onChange={pickCategory} placeholder="Select category" options={categories.map((c) => ({ value: c.id, label: String(c.name) }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Purchase Date" htmlFor="as-pdate">
              <DateInput id="as-pdate" value={f.purchaseDate} onChange={(v) => set({ purchaseDate: v })} />
            </Field>
            <Field label="In-Service Date" htmlFor="as-sdate">
              <DateInput id="as-sdate" value={f.inServiceDate} onChange={(v) => set({ inServiceDate: v })} />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cost" htmlFor="as-cost">
              <input id="as-cost" type="number" min="0" step="0.01" value={f.cost} onChange={(e) => set({ cost: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Salvage Value" htmlFor="as-salvage">
              <input id="as-salvage" type="number" min="0" step="0.01" value={f.salvageValue} onChange={(e) => set({ salvageValue: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Useful Life (months)" htmlFor="as-life">
              <input id="as-life" type="number" min="1" value={f.usefulLife} onChange={(e) => set({ usefulLife: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <Field label="Depreciation Method" htmlFor="as-method">
            <Select id="as-method" value={f.method} onChange={(v) => set({ method: v })} options={METHODS} />
          </Field>
          <Field label="Asset Account">
            <AccountPicker accounts={accounts} types={["ASSET"]} value={f.assetAccountId} onChange={(v) => set({ assetAccountId: v })} placeholder="Select asset account..." />
          </Field>
          <Field label="Accumulated Depreciation Account">
            <AccountPicker accounts={accounts} types={["ASSET"]} value={f.accumAccountId} onChange={(v) => set({ accumAccountId: v })} placeholder="Select accum. depreciation account..." />
          </Field>
          <Field label="Depreciation Expense Account">
            <AccountPicker accounts={accounts} types={["EXPENSE"]} value={f.expenseAccountId} onChange={(v) => set({ expenseAccountId: v })} placeholder="Select expense account..." />
          </Field>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className={btn.primary}>{record ? "Save Changes" : "Create Asset"}</button>
            <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
          </div>
        </div>
      </Card>
    </form>
  );
}

/* ---------- depreciation overview ---------- */

export function DepreciationOverview() {
  const assets = useCollection("assets");
  const [asOf, setAsOf] = useState(today());
  const [notice, setNotice] = useState("");
  const totals = useMemo(
    () => assets.reduce((s, a) => ({ cost: s.cost + num(a.cost), depr: s.depr + num(a.accumulatedDepreciation) }), { cost: 0, depr: 0 }),
    [assets],
  );

  // Brings every active asset's accumulated depreciation up to the chosen date, one posted entry each.
  function runBatch() {
    let posted = 0;
    let amount = 0;
    for (const a of assets) {
      if (a.status === "DISPOSED") continue;
      const target = accumulatedAsOf(a, asOf);
      const delta = round3(target - num(a.accumulatedDepreciation));
      if (delta <= 0) continue;
      if (a.expenseAccountId && a.accumAccountId) {
        createJournal({
          date: asOf,
          description: `Depreciation — ${a.number} ${a.name} through ${longDate(asOf)}`,
          status: "POSTED",
          source: "Depreciation",
          lines: [
            { accountId: String(a.expenseAccountId), debit: delta, credit: 0 },
            { accountId: String(a.accumAccountId), debit: 0, credit: delta },
          ],
        });
      }
      const fully = target >= num(a.cost) - num(a.salvageValue) - 0.0005;
      updateRecord("assets", a.id, { accumulatedDepreciation: target, depreciatedThrough: asOf, status: fully ? "FULLY_DEPRECIATED" : "ACTIVE" });
      posted++;
      amount += delta;
    }
    setNotice(posted ? `Posted depreciation of ${money(amount)} across ${posted} asset(s).` : "Every asset is already depreciated through this date.");
  }

  const columns: Column<Rec>[] = [
    { key: "num", header: "Asset #", cell: (a) => <span className="font-mono text-sm">{String(a.number)}</span> },
    { key: "name", header: "Name", cell: (a) => <span className="font-medium">{String(a.name)}</span> },
    { key: "method", header: "Method", cell: (a) => methodLabel(a.method) },
    { key: "cost", header: "Cost", cell: (a) => money(num(a.cost)) },
    { key: "depr", header: "Total Depr.", cell: (a) => money(num(a.accumulatedDepreciation)) },
    { key: "nbv", header: "Net Book Value", cell: (a) => money(nbv(a)) },
    { key: "status", header: "Status", cell: (a) => statusBadge(a.status) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Depreciation Overview"
        subtitle="Monitor depreciation status and run batch processing"
        actions={
          <>
            <DateInput aria-label="Depreciate through" value={asOf} onChange={(v) => setAsOf(v)} className="w-40" />
            <button type="button" onClick={runBatch} className={btn.primary}>
              <Play /> Run Batch Depreciation
            </button>
          </>
        }
      />
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total Asset Cost" value={money(totals.cost)} />
        <StatCard label="Total Depreciation" value={money(totals.depr)} />
        <StatCard label="Total Net Book Value" value={money(totals.cost - totals.depr)} />
      </div>
      <DataTable columns={columns} rows={assets} />
    </div>
  );
}
