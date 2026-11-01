"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ChevronDown, ChevronRight, ChevronsUpDown, Download, GitBranch, Plus, Sparkles, Table, Trash2, Upload } from "lucide-react";
import { useAssistant } from "@/components/assistant";
import { createRecord, deleteRecord, updateRecord, type Rec } from "@/lib/store";
import { ACCOUNT_TYPES, NORMAL_BALANCE, TYPE_PREFIX, balancesFrom, linesOf, useAccounts, useJournals } from "@/lib/ledger";
import type { AccountType } from "@/lib/accounting-seed";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, DataTable, Field, Label, PageHeader, SearchInput, Select, SidePanel, Switch, btn, downloadFile, inputCls, money, toCSV, type Column } from "./kit";

const BASE = "/financial/accounts";
const titleCase = (t: string) => t.charAt(0) + t.slice(1).toLowerCase();

export function ChartOfAccounts() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpen: openAssistant } = useAssistant();
  const accounts = useAccounts();
  const journals = useJournals();
  const balances = useMemo(() => balancesFrom(accounts, journals), [accounts, journals]);
  const [view, setView] = useState<"table" | "tree">("table");
  const [q, setQ] = useState("");
  const [hideZero, setHideZero] = useState(false);
  const [type, setType] = useState("All Types");

  const sub = pathname.slice(BASE.length).replace(/^\//, "");
  const close = () => router.push(BASE);
  const sorted = useMemo(() => [...accounts].sort((a, b) => String(a.code).localeCompare(String(b.code))), [accounts]);
  const rows = sorted.filter((a) => {
    if (type !== "All Types" && a.type !== type) return false;
    if (hideZero && !balances.get(a.id)) return false;
    const term = q.trim().toLowerCase();
    return !term || `${a.code} ${a.name}`.toLowerCase().includes(term);
  });

  function remove(a: Rec) {
    const used = journals.some((je) => linesOf(je).some((l) => l.accountId === a.id));
    if (used) return alert(`${a.code} - ${a.name} has journal lines, so it can't be deleted. Mark it inactive instead.`);
    if (accounts.some((x) => x.parentId === a.id)) return alert(`${a.code} - ${a.name} has sub-accounts. Move or delete them first.`);
    if (confirm(`Delete account ${a.code} - ${a.name}?`)) {
      deleteRecord("accounts", a.id);
      if (sub === a.id) close();
    }
  }

  function exportCSV() {
    const byId = new Map(accounts.map((a) => [a.id, a]));
    downloadFile(
      "chart-of-accounts.csv",
      toCSV(
        ["Code", "Name", "Type", "Normal Balance", "Parent Code", "Subtype", "Active"],
        sorted.map((a) => [String(a.code), String(a.name), String(a.type), String(a.normalBalance), String(byId.get(String(a.parentId))?.code ?? ""), String(a.accountSubtype ?? ""), a.isActive === false ? "false" : "true"]),
      ),
      "text/csv",
    );
  }

  const columns: Column<Rec>[] = [
    { key: "code", header: "Code", cell: (a) => <span className="font-mono text-sm">{String(a.code)}</span> },
    { key: "name", header: "Name", cell: (a) => <span className="font-medium">{String(a.name)}</span> },
    { key: "type", header: "Type", cell: (a) => <Badge>{String(a.type)}</Badge> },
    { key: "nb", header: "Normal Balance", cell: (a) => String(a.normalBalance) },
    { key: "status", header: "Status", cell: (a) => (a.isActive === false ? <Badge>Inactive</Badge> : <Badge tone="success">Active</Badge>) },
  ];

  const detail = sub && sub !== "new" && sub !== "import" ? accounts.find((a) => a.id === sub) : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage your general ledger accounts"
        actions={
          <>
            <div className="flex rounded-md border border-border">
              <button type="button" onClick={() => setView("table")} className={cn(view === "table" ? btn.smPrimary : btn.smOutline, "rounded-r-none border-0 shadow-none")}>
                <Table /> Table
              </button>
              <button type="button" onClick={() => setView("tree")} className={cn(view === "tree" ? btn.smPrimary : btn.smOutline, "rounded-l-none border-0 shadow-none")}>
                <GitBranch /> Tree
              </button>
            </div>
            <button type="button" onClick={exportCSV} className={btn.outline}>
              <Download /> Export
            </button>
            <Link href={`${BASE}/import`} className={btn.outline}>
              <Upload /> Import
            </Link>
            <button type="button" onClick={() => openAssistant(true)} className={btn.outline}>
              <Sparkles /> Create with AI
            </button>
            <Link href={`${BASE}/new`} className={btn.primary}>
              <Plus /> New Account
            </Link>
          </>
        }
      />

      {view === "table" ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SearchInput value={q} onChange={setQ} placeholder="Search accounts..." />
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <Switch id="hide-zero" checked={hideZero} onChange={setHideZero} />
                <label htmlFor="hide-zero" className="cursor-pointer whitespace-nowrap text-xs font-medium">
                  Hide zero-balance
                </label>
              </div>
              <Select ariaLabel="Account type" value={type} onChange={setType} options={["All Types", ...ACCOUNT_TYPES]} className="w-[150px]" size="sm" />
            </div>
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            onRowClick={(a) => router.push(`${BASE}/${a.id}`)}
            menu={(a) => [
              { label: "Open", onSelect: () => router.push(`${BASE}/${a.id}`) },
              { label: "Delete", onSelect: () => remove(a), destructive: true },
            ]}
          />
        </>
      ) : (
        <AccountTree accounts={sorted} balances={balances} onRemove={remove} />
      )}

      {sub === "new" && (
        <SidePanel onClose={close}>
          <NewAccountForm accounts={accounts} onDone={close} />
        </SidePanel>
      )}
      {sub === "import" && (
        <SidePanel onClose={close}>
          <ImportAccounts accounts={accounts} onDone={close} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <EditAccountForm key={detail.id} account={detail} accounts={accounts} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function AccountTree({ accounts, balances, onRemove }: { accounts: Rec[]; balances: Map<string, number>; onRemove: (a: Rec) => void }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const toggle = (k: string) => setCollapsed((s) => (s.has(k) ? new Set([...s].filter((x) => x !== k)) : new Set([...s, k])));
  const childrenOf = (id: string | null) => accounts.filter((a) => (a.parentId ?? null) === id);
  const groupKeys = [...ACCOUNT_TYPES, ...accounts.map((a) => a.id)];

  const renderRows = (list: Rec[], depth: number): React.ReactNode =>
    list.map((a) => {
      const kids = childrenOf(a.id);
      const open = !collapsed.has(a.id);
      return (
        <div key={a.id}>
          <div className="group flex items-center gap-2 border-b border-border/60 py-1.5 pr-2 text-sm hover:bg-muted/50" style={{ paddingLeft: 24 + depth * 20 }}>
            <button type="button" aria-label={open ? "Collapse" : "Expand"} onClick={() => toggle(a.id)} className={cn("w-4 text-muted-foreground", !kids.length && "invisible")}>
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
            <span className="w-14 font-mono text-muted-foreground">{String(a.code)}</span>
            <Link href={`${BASE}/${a.id}`} className="min-w-0 flex-1 truncate hover:underline">
              {String(a.name)}
            </Link>
            <span className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <Link href={`${BASE}/new?type=${a.type}&parent=${a.id}`} title="Add sub-account" className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                <Plus className="h-3.5 w-3.5" />
              </Link>
              <button type="button" title="Delete" onClick={() => onRemove(a)} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
            <span className="w-28 text-right tabular-nums">{money(balances.get(a.id) ?? 0)}</span>
          </div>
          {open && kids.length > 0 && renderRows(kids, depth + 1)}
        </div>
      );
    });

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => setCollapsed(new Set())} className={btn.smOutline}>
          <ChevronsUpDown /> Expand All
        </button>
        <button type="button" onClick={() => setCollapsed(new Set(groupKeys))} className={btn.smOutline}>
          <ChevronsUpDown /> Collapse All
        </button>
      </div>
      <div className="rounded-md border border-border">
        <div className="flex items-center border-b border-border px-6 py-2 text-xs font-medium uppercase text-muted-foreground">
          <span className="w-20 pl-6">Code</span>
          <span className="flex-1">Account</span>
          <span>Balance</span>
        </div>
        {ACCOUNT_TYPES.map((t) => {
          const roots = accounts.filter((a) => a.type === t && !accounts.some((p) => p.id === a.parentId));
          const open = !collapsed.has(t);
          return (
            <div key={t}>
              <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-2 py-2 text-sm font-semibold">
                <button type="button" onClick={() => toggle(t)} className="flex items-center gap-1">
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {titleCase(t)}
                </button>
                <Link href={`${BASE}/new?type=${t}`} title={`New ${titleCase(t)} account`} className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground">
                  <Plus className="h-3.5 w-3.5" />
                </Link>
              </div>
              {open && renderRows(roots, 0)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Keyword guess for "Suggest" — maps common account names to a type.
function suggestType(name: string): AccountType | "" {
  const n = name.toLowerCase();
  if (/(sales|revenue|income|fees earned|commission received|discount received)/.test(n)) return "REVENUE";
  if (/(payable|loan|accrued|deposit received|liabilit|tax output|vat payable|overdraft)/.test(n)) return "LIABILITY";
  if (/(capital|equity|retained|drawing|reserve)/.test(n)) return "EQUITY";
  if (/(bank|cash|receivable|inventory|stock|prepaid|equipment|vehicle|furniture|building|advance|deposit paid)/.test(n)) return "ASSET";
  if (/(rent|salar|wage|expense|utilit|fuel|travel|insurance|fee|repair|supplies|marketing|depreciation|charges)/.test(n)) return "EXPENSE";
  return "";
}

function nextFreeCode(accounts: Rec[], prefix: string) {
  const used = new Set(accounts.map((a) => String(a.code)));
  for (let n = Number(prefix.padEnd(4, "0")); n < Number(prefix.padEnd(4, "9")); n += 10) if (!used.has(String(n))) return String(n);
  return prefix.padEnd(4, "0");
}

function NewAccountForm({ accounts, onDone }: { accounts: Rec[]; onDone: () => void }) {
  const preset = useSearchParams();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType | "">((preset.get("type") as AccountType) ?? "");
  const [parentId, setParentId] = useState(preset.get("parent") ?? "");
  const [rest, setRest] = useState("");
  const [active, setActive] = useState(true);
  const [error, setError] = useState("");

  const parent = accounts.find((a) => a.id === parentId);
  const prefix = parent ? String(parent.code).slice(0, 2) : type ? TYPE_PREFIX[type] : "";
  const groups = accounts.filter((a) => a.type === type).sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const suggestion = prefix ? nextFreeCode(accounts, prefix).slice(prefix.length) : "";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const code = prefix + (rest || suggestion);
    if (!name.trim()) return setError("Account name is required.");
    if (!type) return setError("Pick an account type.");
    if (accounts.some((a) => a.code === code)) return setError(`Code ${code} is already used.`);
    createRecord("accounts", { code, name: name.trim(), type, normalBalance: NORMAL_BALANCE[type], parentId: parentId || null, isActive: active });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Account</h1>
        <p className="mt-1 text-muted-foreground">Add a new account to the chart of accounts</p>
      </div>
      <Card>
        <div className="space-y-4 p-6">
          <CardTitle>Account Details</CardTitle>
          <Field label="Account Name" htmlFor="acc-name">
            <div className="flex gap-2">
              <input id="acc-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Rent, Sales, Bank Account" className={inputCls} />
              <button
                type="button"
                disabled={!name.trim()}
                title="Suggest the account type from the name"
                onClick={() => {
                  const t = suggestType(name);
                  if (t) {
                    setType(t);
                    setParentId("");
                  }
                }}
                className={btn.outline}
              >
                <Sparkles /> Suggest
              </button>
            </div>
          </Field>
          <Field label="Account Type" htmlFor="acc-type">
            <Select id="acc-type" value={type} onChange={(v) => { setType(v as AccountType); setParentId(""); }} placeholder="Select type" options={ACCOUNT_TYPES} />
          </Field>
          <Field label="Group of Accounts (optional)" htmlFor="acc-group" hint={type ? undefined : "Choose an account type to see its groups."}>
            <Select
              id="acc-group"
              value={parentId}
              disabled={!type}
              onChange={setParentId}
              placeholder="No group (top-level account)"
              options={groups.map((g) => ({ value: g.id, label: `${g.code} - ${g.name}` }))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account Code" htmlFor="acc-code" hint="The leading digits are set automatically from the group/type.">
              <div className="flex">
                <span className="inline-flex min-w-9 items-center justify-center rounded-l-md border border-r-0 border-input bg-muted px-2 font-mono text-sm text-muted-foreground">{prefix || "—"}</span>
                <input
                  id="acc-code"
                  value={rest}
                  disabled={!prefix}
                  onChange={(e) => setRest(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={prefix ? suggestion : "Pick a group or type first"}
                  className={cn(inputCls, "rounded-l-none font-mono")}
                />
              </div>
            </Field>
            <Field label="Normal Balance" hint="Set automatically from the account type.">
              <div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">{type ? NORMAL_BALANCE[type] : "—"}</div>
            </Field>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="acc-active" checked={active} onChange={setActive} />
            <Label htmlFor="acc-active">Active</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className={btn.primary}>
              Create Account
            </button>
            <button type="button" onClick={onDone} className={btn.outline}>
              Cancel
            </button>
          </div>
        </div>
      </Card>
    </form>
  );
}

function EditAccountForm({ account, accounts, onDone }: { account: Rec; accounts: Rec[]; onDone: () => void }) {
  const [code, setCode] = useState(String(account.code ?? ""));
  const [name, setName] = useState(String(account.name ?? ""));
  const [type, setType] = useState(String(account.type ?? "ASSET"));
  const [normal, setNormal] = useState(String(account.normalBalance ?? "DEBIT"));
  const [parentId, setParentId] = useState(String(account.parentId ?? ""));
  const [active, setActive] = useState(account.isActive !== false);
  const [error, setError] = useState("");
  const parents = accounts.filter((a) => a.type === type && a.id !== account.id);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return setError("Code and name are required.");
    if (accounts.some((a) => a.id !== account.id && a.code === code.trim())) return setError(`Code ${code} is already used.`);
    updateRecord("accounts", account.id, { code: code.trim(), name: name.trim(), type, normalBalance: normal, parentId: parentId || null, isActive: active });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">
        Account: {String(account.code)} - {String(account.name)}
      </h1>
      <Card>
        <div className="space-y-4 p-6">
          <CardTitle>Edit Account</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Account Code" htmlFor="e-code">
              <input id="e-code" value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Account Name" htmlFor="e-name">
              <input id="e-name" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
            </Field>
            <Field label="Type" htmlFor="e-type">
              <Select id="e-type" value={type} onChange={(v) => { setType(v); setParentId(""); }} options={ACCOUNT_TYPES} />
            </Field>
            <Field label="Normal Balance" htmlFor="e-nb">
              <Select id="e-nb" value={normal} onChange={setNormal} options={["DEBIT", "CREDIT"]} />
            </Field>
          </div>
          <Field label="Parent Account (optional)" htmlFor="e-parent">
            <Select id="e-parent" value={parentId} onChange={setParentId} placeholder="No parent (root account)" options={parents.map((p) => ({ value: p.id, label: `${p.code} - ${p.name}` }))} />
          </Field>
          <div className="flex items-center gap-2">
            <Switch id="e-active" checked={active} onChange={setActive} />
            <Label htmlFor="e-active">Active</Label>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className={btn.primary}>
              Save Changes
            </button>
            <button type="button" onClick={onDone} className={btn.outline}>
              Cancel
            </button>
          </div>
        </div>
      </Card>
    </form>
  );
}

type ParsedRow = { code: string; name: string; type: AccountType; normalBalance: string; parentCode: string; active: boolean };

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim()));
}

function ImportAccounts({ accounts, onDone }: { accounts: Rec[]; onDone: () => void }) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [error, setError] = useState("");
  const existing = new Set(accounts.map((a) => String(a.code)));
  const fresh = rows?.filter((r) => !existing.has(r.code)) ?? [];

  async function pick(file: File | undefined) {
    setError("");
    setRows(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) return setError("This build reads .csv files. In Excel, use File → Save As → CSV, then pick that file.");
    const [head, ...body] = parseCSV(await file.text());
    const idx = (h: string) => head.findIndex((x) => x.trim().toLowerCase() === h);
    const c = { code: idx("code"), name: idx("name"), type: idx("type"), nb: idx("normal balance"), parent: idx("parent code"), active: idx("active") };
    if (c.code < 0 || c.name < 0 || c.type < 0) return setError("The file needs at least Code, Name and Type columns.");
    const parsed = body
      .map((r) => {
        const type = r[c.type]?.trim().toUpperCase() as AccountType;
        return {
          code: r[c.code]?.trim() ?? "",
          name: r[c.name]?.trim() ?? "",
          type,
          normalBalance: (c.nb >= 0 && r[c.nb]?.trim().toUpperCase()) || NORMAL_BALANCE[type] || "DEBIT",
          parentCode: c.parent >= 0 ? (r[c.parent]?.trim() ?? "") : "",
          active: c.active < 0 || !/^(false|no|0)$/i.test(r[c.active]?.trim() ?? ""),
        };
      })
      .filter((r) => r.code && r.name && ACCOUNT_TYPES.includes(r.type));
    if (!parsed.length) return setError("No valid rows found.");
    setRows(parsed);
  }

  function run() {
    const created = new Map<string, string>(accounts.map((a) => [String(a.code), a.id]));
    for (const r of fresh) {
      const rec = createRecord("accounts", { code: r.code, name: r.name, type: r.type, normalBalance: r.normalBalance, parentId: null, isActive: r.active });
      created.set(r.code, rec.id);
    }
    for (const r of fresh) if (r.parentCode && created.has(r.parentCode)) updateRecord("accounts", created.get(r.code)!, { parentId: created.get(r.parentCode) });
    onDone();
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onDone} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to accounts
      </button>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import Chart of Accounts</h1>
        <p className="mt-1 text-muted-foreground">Upload a CSV or Excel file to bulk-create accounts.</p>
      </div>
      <Card>
        <div className="space-y-3 p-6">
          <CardTitle>1. Choose a file</CardTitle>
          <p className="text-sm text-muted-foreground">
            Expected columns: <b className="text-foreground">Code, Name, Type, Normal Balance, Parent Code, Subtype, Active</b>. Use Parent Code to nest under a group. Existing codes are skipped. Tip: use Export on the Accounts page to get a template.
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm hover:bg-muted/50">
            <Upload className="h-4 w-4" /> Click to select a .csv or .xlsx file
            <input type="file" accept=".csv,.xlsx" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </Card>
      {rows && (
        <Card>
          <div className="space-y-3 p-6">
            <CardTitle>2. Review</CardTitle>
            <p className="text-sm text-muted-foreground">
              {fresh.length} new account(s); {rows.length - fresh.length} skipped because the code already exists.
            </p>
            <div className="max-h-64 overflow-auto rounded-md border border-border text-sm">
              {rows.map((r) => (
                <div key={r.code} className={cn("flex gap-3 border-b border-border/60 px-3 py-1.5", existing.has(r.code) && "text-muted-foreground line-through")}>
                  <span className="w-14 font-mono">{r.code}</span>
                  <span className="flex-1 truncate">{r.name}</span>
                  <span className="text-xs">{r.type}</span>
                </div>
              ))}
            </div>
            <button type="button" disabled={!fresh.length} onClick={run} className={btn.primary}>
              Import {fresh.length} account(s)
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}
