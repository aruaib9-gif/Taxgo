"use client";

// Finance › Banking & Cash: bank and cash accounts (with Receipt/Payment vouchers), transactions
// (approve-to-post, statement imports with undo), reconciliations and transaction categories.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Banknote, Check, FileText, Pencil, Plus, Undo2, Upload, X } from "lucide-react";
import { createRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { useAccounts, useBankAccounts } from "@/lib/ledger";
import { accountBalance, approveVoucher, bankGl, cashGl, completeReconciliation, createVoucher, glBalance, importStatement, matchCandidates, matchTxn, reconSummary, startReconciliation, todayIso, undoImport, unmatchTxn, voidReconciliation, type Direction, type StatementLine } from "@/lib/banking";
import { parseCsv } from "@/lib/hr";
import { cn } from "@/lib/utils";
import { AccountPicker, Badge, Card, CardTitle, DataTable, Dialog, Field, PageHeader, SearchInput, SidePanel, btn, inputCls, money, num, textareaCls } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";
import { Th, fmtDate, useFlash } from "@/components/hr/people";

type Kind = "bank" | "cash";
const K = {
  bank: { coll: "bank-accounts", tx: "bank-transactions", key: "bankAccountId", base: "/bank/accounts", txBase: "/bank/transactions", noun: "Bank Account" },
  cash: { coll: "cash-accounts", tx: "cash-transactions", key: "cashAccountId", base: "/cash/accounts", txBase: "/cash/transactions", noun: "Cash Account" },
} as const;
const holderLabel = (kind: Kind, h?: Rec) => (!h ? "—" : kind === "bank" ? `${h.bankName} - ${h.accountName}` : String(h.accountName));
const ActiveBadge = ({ status }: { status: unknown }) => <Badge tone={status === "INACTIVE" ? "muted" : "success"}>{status === "INACTIVE" ? "Inactive" : "Active"}</Badge>;
const TARGET_KIND: Record<string, "ACCOUNT" | "VENDOR" | "CUSTOMER"> = { ACCOUNTS: "ACCOUNT", SUPPLIERS: "VENDOR", CUSTOMERS: "CUSTOMER" };
const KIND_LABEL: Record<string, string> = { ACCOUNT: "Account", VENDOR: "Supplier", CUSTOMER: "Customer" };

export function counterName(t: Rec, accounts: Rec[], vendors: Rec[], customers: Rec[]) {
  const id = t.counterAccountId;
  if (t.accountKind === "VENDOR") return String(vendors.find((v) => v.id === id)?.name ?? "—");
  if (t.accountKind === "CUSTOMER") return String(customers.find((c) => c.id === id)?.name ?? "—");
  const a = accounts.find((x) => x.id === id);
  return a ? `${a.code} - ${a.name}` : "—";
}

/* ---------- receipt / payment voucher ---------- */

export function VoucherDialog({ kind, holderId, direction, onClose }: { kind: Kind; holderId?: string; direction?: Direction; onClose: () => void }) {
  const holders = useCollection(K[kind].coll);
  const cats = useCollection("transaction-categories");
  const accounts = useAccounts();
  const vendors = useCollection("vendors");
  const customers = useCollection("customers");
  const [f, setF] = useState({ holderId: holderId ?? "", direction: direction ?? ("RECEIPT" as Direction), date: todayIso(), categoryId: "", accountId: "", amount: "", description: "" });
  const [err, setErr] = useState("");
  const { node, flash } = useFlash();
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const usable = cats.filter((c) => c.status !== "INACTIVE" && c.transactionType === (f.direction === "RECEIPT" ? "RECEIPT" : "PAYMENT"));
  const cat = cats.find((c) => c.id === f.categoryId);
  const target = TARGET_KIND[String(cat?.linkTarget ?? "ACCOUNTS")];
  const links = ((cat?.links as string[]) ?? []);
  const opts = target === "VENDOR" ? vendors.filter((v) => links.includes(v.id)).map((v) => ({ value: v.id, label: String(v.name) })) : target === "CUSTOMER" ? customers.filter((c) => links.includes(c.id)).map((c) => ({ value: c.id, label: String(c.name) })) : accounts.filter((a) => links.includes(a.id)).map((a) => ({ value: a.id, label: `${a.code} - ${a.name}` }));
  const receipt = f.direction === "RECEIPT";
  function save() {
    if (!f.holderId) return setErr(`Select a ${K[kind].noun.toLowerCase()}`);
    if (f.date > todayIso()) return setErr("Date cannot be in the future.");
    if (!f.categoryId) return setErr("Select Transaction Category");
    if (!f.accountId) return setErr(`Select ${KIND_LABEL[target]}`);
    if (!(num(f.amount) > 0)) return setErr("Enter amount");
    try {
      createVoucher(kind, f.holderId, { date: f.date, direction: f.direction, categoryId: f.categoryId, accountKind: target, accountId: f.accountId, amount: num(f.amount), description: f.description || undefined });
      flash(receipt ? "Receipt recorded" : "Payment recorded");
      setTimeout(onClose, 400);
    } catch (e) { setErr(e instanceof Error ? e.message : receipt ? "Could not record receipt" : "Could not record payment"); }
  }
  return (
    <Dialog open onClose={onClose} title={`${kind === "bank" ? "Bank" : "Cash"} ${receipt ? "Receipt" : "Payment"}`} className="max-w-xl">
      <div className="grid gap-3 sm:grid-cols-2">
        {!direction && <Field label="Type" className="sm:col-span-2"><div className="flex gap-2">{(["RECEIPT", "PAYMENT"] as Direction[]).map((d) => <button key={d} type="button" onClick={() => set({ direction: d, categoryId: "", accountId: "" })} className={cn(f.direction === d ? btn.smPrimary : btn.smOutline)}>{d === "RECEIPT" ? "Receipt" : "Payment"}</button>)}</div></Field>}
        <Field label={K[kind].noun}><Select ariaLabel={K[kind].noun} value={f.holderId} onChange={(v) => set({ holderId: v })} disabled={!!holderId} placeholder={`Select ${K[kind].noun.toLowerCase()}`} options={holders.filter((h) => h.status !== "INACTIVE").map((h) => ({ value: h.id, label: holderLabel(kind, h) }))} /></Field>
        <Field label="Date"><DateInput ariaLabel="Date" value={f.date} onChange={(v) => set({ date: v })} /></Field>
        <Field label="Voucher No."><input className={inputCls} disabled value="" placeholder={receipt ? "RCPT- (auto)" : "PAY- (auto)"} aria-label="Voucher No." /></Field>
        <Field label="Transaction Category">{usable.length === 0 ? <p className="text-xs text-muted-foreground">No {receipt ? "receipt" : "payment"} categories yet — <Link className="text-primary underline" href="/transaction-categories/new">create one</Link>.</p> : <Select ariaLabel="Transaction Category" value={f.categoryId} onChange={(v) => set({ categoryId: v, accountId: "" })} placeholder="Select Transaction Category" options={usable.map((c) => ({ value: c.id, label: String(c.name) }))} />}</Field>
        <Field label={f.categoryId ? KIND_LABEL[target] : "Account"}>{!f.categoryId ? <p className="py-2 text-xs text-muted-foreground">Select a category first</p> : opts.length === 0 ? <p className="py-2 text-xs text-muted-foreground">No {target === "VENDOR" ? "suppliers" : target === "CUSTOMER" ? "customers" : "accounts"} linked to this category</p> : <Select ariaLabel={KIND_LABEL[target]} value={f.accountId} onChange={(v) => set({ accountId: v })} placeholder={`Select ${KIND_LABEL[target]}`} options={opts} />}</Field>
        <Field label="Amount"><input className={inputCls} type="number" min="0" step="0.01" placeholder="Enter amount" aria-label="Amount" value={f.amount} onChange={(e) => set({ amount: e.target.value })} /></Field>
        <Field label="Description" className="sm:col-span-2"><textarea className={textareaCls} rows={2} aria-label="Description" placeholder={receipt ? "Payment received from ..." : "Paid for ..."} value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} onClick={save}>Save</button></div>
      {node}
    </Dialog>
  );
}

/* ---------- bank & cash accounts ---------- */

export function HolderAccounts({ kind }: { kind: Kind }) {
  const router = useRouter();
  const sub = subOf(usePathname(), K[kind].base);
  const bankRows = useBankAccounts();
  const cashRows = useCollection("cash-accounts");
  const rows = kind === "bank" ? bankRows : cashRows;
  useCollection(K[kind].tx);
  useCollection("journal-entries");
  const [q, setQ] = useState("");
  const [voucher, setVoucher] = useState<{ id: string; direction: Direction } | null>(null);
  const [id, mode] = sub.split("/");
  const close = () => router.push(K[kind].base);
  const filtered = rows.filter((r) => !q || `${r.bankName ?? ""} ${r.accountName} ${r.location ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const gl = (r: Rec) => glBalance(kind === "bank" ? bankGl(r) : cashGl(r));
  const iconBtn = (r: Rec, d: Direction) => (
    <button type="button" aria-label={`${d === "RECEIPT" ? "Receipt" : "Payment"} for ${r.accountName}`} title={d === "RECEIPT" ? "Receipt" : "Payment"} onClick={(e) => { e.stopPropagation(); setVoucher({ id: r.id, direction: d }); }} className={cn("inline-flex size-7 items-center justify-center rounded-full border", d === "RECEIPT" ? "border-primary/40 text-primary hover:bg-primary/10" : "border-success/40 text-success hover:bg-success/10")}>
      {d === "RECEIPT" ? <FileText className="size-3.5" /> : <Banknote className="size-3.5" />}
    </button>
  );
  const cols = [
    ...(kind === "bank" ? [{ key: "bank", header: "Bank Name", cell: (r: Rec) => <span className="font-semibold">{String(r.bankName)}</span> }] : []),
    { key: "name", header: "Account Name", cell: (r: Rec) => (kind === "cash" ? <span className="font-semibold">{String(r.accountName)}</span> : String(r.accountName)) },
    ...(kind === "cash" ? [{ key: "loc", header: "Location", cell: (r: Rec) => String(r.location || "—") }] : []),
    { key: "cur", header: "Currency", cell: (r: Rec) => String(r.currency ?? "USD") },
    { key: "bal", header: "Current Balance", cell: (r: Rec) => money(accountBalance(kind, r)) },
    { key: "gl", header: "GL Balance", cell: (r: Rec) => money(gl(r)) },
    { key: "status", header: "Status", cell: (r: Rec) => <ActiveBadge status={r.status} /> },
    { key: "rc", header: "Receipt", cell: (r: Rec) => iconBtn(r, "RECEIPT") },
    { key: "py", header: "Payment", cell: (r: Rec) => iconBtn(r, "PAYMENT") },
  ];
  const sel = rows.find((r) => r.id === id);
  return (
    <div className="space-y-4">
      <PageHeader title={kind === "bank" ? "Bank Accounts" : "Cash Accounts"} subtitle={kind === "bank" ? "Manage linked bank accounts" : "Cash on hand — tills, petty cash and safes"} actions={<Link href={`${K[kind].base}/new`} className={btn.primary}><Plus /> New {K[kind].noun}</Link>} />
      <div className="max-w-xs"><SearchInput value={q} onChange={setQ} placeholder={kind === "bank" ? "Search bank accounts..." : "Search cash accounts..."} /></div>
      <DataTable rows={filtered} columns={cols} onRowClick={(r) => router.push(`${K[kind].base}/${r.id}`)} menu={(r) => [
        { label: "View", onSelect: () => router.push(`${K[kind].base}/${r.id}`) },
        { label: "Edit", onSelect: () => router.push(`${K[kind].base}/${r.id}/edit`) },
        { label: r.status === "INACTIVE" ? "Activate" : "Deactivate", onSelect: () => updateRecord(K[kind].coll, r.id, { status: r.status === "INACTIVE" ? "ACTIVE" : "INACTIVE" }) },
      ]} />
      {voucher && <VoucherDialog kind={kind} holderId={voucher.id} direction={voucher.direction} onClose={() => setVoucher(null)} />}
      {sub === "new" && <SidePanel onClose={close}><HolderForm kind={kind} onDone={(rid) => router.push(`${K[kind].base}/${rid}`)} onCancel={close} /></SidePanel>}
      {sel && mode === "edit" && <SidePanel onClose={close}><HolderForm kind={kind} record={sel} onDone={(rid) => router.push(`${K[kind].base}/${rid}`)} onCancel={close} /></SidePanel>}
      {sel && !mode && <SidePanel onClose={close}><HolderDetail kind={kind} r={sel} onVoucher={(d) => setVoucher({ id: sel.id, direction: d })} /></SidePanel>}
    </div>
  );
}

function HolderForm({ kind, record, onDone, onCancel }: { kind: Kind; record?: Rec; onDone: (id: string) => void; onCancel: () => void }) {
  const accounts = useAccounts();
  const [f, setF] = useState({ bankName: String(record?.bankName ?? ""), accountName: String(record?.accountName ?? ""), accountNumber: String(record?.accountNumber ?? ""), routingNumber: String(record?.routingNumber ?? ""), location: String(record?.location ?? ""), currency: String(record?.currency ?? "USD"), glAccountId: String(record?.glAccountId ?? ""), openingBalance: String(record?.openingBalance ?? "") });
  const [err, setErr] = useState("");
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  function save() {
    if (kind === "bank" && !f.bankName.trim()) return setErr("Bank name is required");
    if (!f.accountName.trim()) return setErr("Account name is required");
    if (!/^[A-Z]{3}$/.test(f.currency.trim().toUpperCase())) return setErr("Currency code must be 3 letters");
    if (kind === "cash" && !record && !f.glAccountId) return setErr("Select the cash GL account");
    const data = { ...(kind === "bank" ? { bankName: f.bankName.trim(), accountNumber: f.accountNumber.trim() ? `****${f.accountNumber.trim().slice(-3)}` : "", routingNumber: f.routingNumber.trim() } : { location: f.location.trim() }), accountName: f.accountName.trim(), currency: f.currency.trim().toUpperCase(), glAccountId: f.glAccountId || null, openingBalance: num(f.openingBalance) };
    if (record) { updateRecord(K[kind].coll, record.id, data); onDone(record.id); } else onDone(createRecord(K[kind].coll, { ...data, status: "ACTIVE" }).id);
  }
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold">{record ? `Edit ${K[kind].noun}` : `New ${K[kind].noun}`}</h2>
      <Card><div className="space-y-4 p-5">
        <CardTitle>{K[kind].noun} Details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          {kind === "bank" && <Field label="Bank Name" htmlFor="bn"><input id="bn" className={inputCls} value={f.bankName} onChange={(e) => set({ bankName: e.target.value })} /></Field>}
          <Field label="Account Name" htmlFor="an"><input id="an" className={inputCls} value={f.accountName} onChange={(e) => set({ accountName: e.target.value })} /></Field>
          {kind === "bank" ? <>
            <Field label="Account Number (masked)" htmlFor="ac"><input id="ac" className={inputCls} placeholder="****1234" value={f.accountNumber} onChange={(e) => set({ accountNumber: e.target.value })} /></Field>
            <Field label="Routing Number" htmlFor="rn"><input id="rn" className={inputCls} value={f.routingNumber} onChange={(e) => set({ routingNumber: e.target.value })} /></Field>
          </> : <Field label="Location" htmlFor="loc"><input id="loc" className={inputCls} placeholder="e.g. Front desk till" value={f.location} onChange={(e) => set({ location: e.target.value })} /></Field>}
          <Field label="Currency Code" htmlFor="cc"><input id="cc" maxLength={3} className={inputCls} value={f.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} /></Field>
          <Field label="Opening Balance" htmlFor="ob"><input id="ob" type="number" step="0.01" className={inputCls} value={f.openingBalance} onChange={(e) => set({ openingBalance: e.target.value })} /></Field>
          <div className="sm:col-span-2"><Field label="Linked GL Account" hint={kind === "cash" ? "The cash ledger this box posts to. Cannot be changed once the account exists." : undefined}>
            {kind === "cash" && record ? <input className={inputCls} disabled value={(() => { const a = accounts.find((x) => x.id === cashGl(record)); return a ? `${a.code} - ${a.name}` : ""; })()} /> : <AccountPicker accounts={accounts} types={["ASSET"]} value={f.glAccountId} onChange={(v) => set({ glAccountId: v })} placeholder={kind === "cash" ? "Select cash GL account..." : "Select GL account..."} ariaLabel="Linked GL Account" />}
          </Field></div>
        </div>
      </div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{record ? "Save Changes" : `Create ${K[kind].noun}`}</button><button type="button" className={btn.outline} onClick={onCancel}>Cancel</button></div>
    </div>
  );
}

function HolderDetail({ kind, r, onVoucher }: { kind: Kind; r: Rec; onVoucher: (d: Direction) => void }) {
  const txns = useCollection(K[kind].tx).filter((t) => t[K[kind].key] === r.id && !t.deleted).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const accounts = useAccounts();
  const gl = accounts.find((a) => a.id === (kind === "bank" ? bankGl(r) : cashGl(r)));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-xl font-semibold">{holderLabel(kind, r)}</h2><p className="text-sm text-muted-foreground">{String(r.currency ?? "USD")}{r.accountNumber ? ` · ${r.accountNumber}` : ""}{r.location ? ` · ${r.location}` : ""}</p></div>
        <div className="flex gap-2"><button type="button" className={btn.smOutline} onClick={() => onVoucher("RECEIPT")}><FileText /> Receipt</button><button type="button" className={btn.smOutline} onClick={() => onVoucher("PAYMENT")}><Banknote /> Payment</button><Link className={btn.smOutline} href={`${K[kind].base}/${r.id}/edit`}><Pencil /> Edit</Link></div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><div className="p-4"><p className="text-xs text-muted-foreground">Current Balance</p><p className="text-xl font-bold">{money(accountBalance(kind, r))}</p></div></Card>
        <Card><div className="p-4"><p className="text-xs text-muted-foreground">GL Balance</p><p className="text-xl font-bold">{money(glBalance(String(gl?.id ?? "")))}</p></div></Card>
        <Card><div className="p-4"><p className="text-xs text-muted-foreground">Linked GL Account</p><p className="text-sm font-medium">{gl ? `${gl.code} - ${gl.name}` : "—"}</p></div></Card>
      </div>
      <Card><div className="p-5"><CardTitle className="mb-3">Recent Transactions</CardTitle>
        {txns.length === 0 ? <p className="text-sm text-muted-foreground">No transactions yet.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>Description</Th><Th className="text-right">Amount</Th><Th>Posting</Th></tr></thead><tbody>{txns.slice(0, 15).map((t) => <tr key={t.id} className="border-b border-border"><td className="px-2 py-2">{fmtDate(t.date)}</td><td className="px-2 py-2">{String(t.description || t.voucherNo || "—")}</td><td className={cn("px-2 py-2 text-right tabular-nums", num(t.amount) < 0 ? "text-destructive" : "text-success")}>{money(num(t.amount))}</td><td className="px-2 py-2"><PostingBadge t={t} /></td></tr>)}</tbody></table>}
      </div></Card>
    </div>
  );
}

/* ---------- transactions ---------- */

const PostingBadge = ({ t }: { t: Rec }) => (t.postingState === "POSTED" ? <Badge tone="success">Approved</Badge> : t.postingState === "PENDING" ? <Badge tone="warning">Pending</Badge> : <Badge>—</Badge>);
const StatusCell = ({ t }: { t: Rec }) => (t.inboxState === "FOR_REVIEW" ? <Badge tone="info">For review</Badge> : t.inboxState === "EXCLUDED" ? <Badge>Excluded</Badge> : t.status === "RECONCILED" ? <Badge tone="success">Reconciled</Badge> : t.status === "MATCHED" ? <Badge tone="info">Matched</Badge> : <Badge>Unreconciled</Badge>);

export function Transactions({ kind }: { kind: Kind }) {
  const router = useRouter();
  const params = useSearchParams();
  const sub = subOf(usePathname(), K[kind].txBase);
  const holders = useCollection(K[kind].coll);
  const all = useCollection(K[kind].tx);
  const imports = useCollection("bank-imports");
  const accounts = useAccounts();
  const vendors = useCollection("vendors");
  const customers = useCollection("customers");
  const [holder, setHolder] = useState("");
  const [adding, setAdding] = useState(false);
  const [showImports, setShowImports] = useState(false);
  const [undo, setUndo] = useState<Rec | null>(null);
  const { node, flash } = useFlash();
  const importId = params.get("import");
  if (sub === "import") return <ImportStatement kind={kind} />;
  const rows = all.filter((t) => !t.deleted && (!holder || t[K[kind].key] === holder) && (!importId || t.importId === importId)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const approve = (t: Rec) => { try { approveVoucher(kind, t.id); flash("Posted to the ledger"); } catch (e) { flash(e instanceof Error ? e.message : "Could not post", true); } };
  const amountCell = (t: Rec) => <span className={cn("tabular-nums", num(t.amount) < 0 ? "text-destructive" : "text-success")}>{money(num(t.amount))}</span>;
  const typeCell = (t: Rec) => (num(t.amount) >= 0 ? (kind === "bank" ? "Deposit" : "Receipt") : kind === "bank" ? "Withdrawal" : "Payment");
  const cols = kind === "bank" ? [
    { key: "date", header: "Date", cell: (t: Rec) => fmtDate(t.date) },
    { key: "desc", header: "Description", cell: (t: Rec) => <span className="font-medium">{String(t.description || t.voucherNo || "—")}</span> },
    { key: "amt", header: "Amount", cell: amountCell },
    { key: "type", header: "Type", cell: typeCell },
    { key: "ref", header: "Reference", cell: (t: Rec) => String(t.reference || "—") },
    { key: "status", header: "Status", cell: (t: Rec) => <StatusCell t={t} /> },
    { key: "post", header: "Posting", cell: (t: Rec) => <PostingBadge t={t} /> },
  ] : [
    { key: "date", header: "Date", cell: (t: Rec) => fmtDate(t.date) },
    { key: "v", header: "Voucher No.", cell: (t: Rec) => <span className="font-mono text-xs">{String(t.voucherNo || "—")}</span> },
    { key: "kind", header: "Type of Account", cell: (t: Rec) => KIND_LABEL[String(t.accountKind)] ?? "—" },
    { key: "acc", header: "Account", cell: (t: Rec) => counterName(t, accounts, vendors, customers) },
    { key: "desc", header: "Description", cell: (t: Rec) => String(t.description || "—") },
    { key: "amt", header: "Amount", cell: amountCell },
    { key: "type", header: "Type", cell: typeCell },
    { key: "post", header: "Posting", cell: (t: Rec) => <PostingBadge t={t} /> },
  ];
  const myImports = imports.filter((i) => kind === "bank" ? !i.cash : i.cash).sort((a, b) => String(b.importedAt).localeCompare(String(a.importedAt)));
  const sel = all.find((t) => t.id === sub);
  return (
    <div className="space-y-4">
      <PageHeader title={kind === "bank" ? "Bank Transactions" : "Cash Transactions"} subtitle={kind === "bank" ? "View and filter bank transactions" : "Receipts and payments across every cash account"} actions={<>
        <button type="button" className={btn.primary} onClick={() => setAdding(true)}><Plus /> Add Transaction</button>
        <button type="button" className={btn.outline} onClick={() => setShowImports((s) => !s)}>Imports</button>
        <Link href={`${K[kind].txBase}/import`} className={btn.outline}><Upload /> Import</Link>
      </>} />
      <div className="flex flex-wrap items-end gap-3">
        <Field label={K[kind].noun}><Select ariaLabel={K[kind].noun} className="w-60" value={holder} onChange={setHolder} options={[{ value: "", label: "All accounts" }, ...holders.map((h) => ({ value: h.id, label: String(h.accountName) }))]} /></Field>
        {importId && <div className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-xs">Filtered by one import batch <button type="button" className="text-primary underline" onClick={() => router.push(K[kind].txBase)}>Clear filter</button></div>}
      </div>
      {showImports && <Card><div className="p-5"><CardTitle className="mb-3">Statement imports</CardTitle>
        {myImports.length === 0 ? <p className="text-sm text-muted-foreground">No statement imports yet.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>File</Th><Th>Account</Th><Th>Rows</Th><Th>Imported</Th><Th>Status</Th><Th /></tr></thead><tbody>{myImports.map((i) => <tr key={i.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{String(i.fileName)}</td><td className="px-2 py-2">{holderLabel(kind, holders.find((h) => h.id === i.bankAccountId))}</td><td className="px-2 py-2">{String(i.rows)}</td><td className="px-2 py-2">{fmtDate(i.importedAt)}</td><td className="px-2 py-2">{i.status === "UNDONE" ? <Badge>Undone</Badge> : <Badge tone="success">Imported</Badge>}</td><td className="px-2 py-2 text-right">{i.status !== "UNDONE" && <><button type="button" className="mr-3 text-xs text-primary underline" onClick={() => router.push(`${K[kind].txBase}?import=${i.id}`)}>View</button><button type="button" className="text-xs text-destructive underline" onClick={() => setUndo(i)}><Undo2 className="mr-1 inline size-3" />Undo</button></>}</td></tr>)}</tbody></table>}
      </div></Card>}
      <DataTable rows={rows} columns={cols} onRowClick={(t) => router.push(`${K[kind].txBase}/${t.id}`)} menu={(t) => [
        { label: "Open", onSelect: () => router.push(`${K[kind].txBase}/${t.id}`) },
        ...(t.postingState === "PENDING" ? [{ label: "Approve", onSelect: () => approve(t) }] : []),
        ...(t.inboxState === "FOR_REVIEW" ? [{ label: "Review in Bank Inbox", onSelect: () => router.push(`/bank/inbox?account=${t.bankAccountId}`) }] : []),
      ]} />
      {adding && <VoucherDialog kind={kind} onClose={() => setAdding(false)} />}
      <Dialog open={!!undo} onClose={() => setUndo(null)} title="Undo this import?" description={`Removes the ${undo?.rows} unbooked line(s) from ${undo?.fileName}.`}>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setUndo(null)}>Cancel</button><button type="button" className={btn.primary} onClick={() => { try { undoImport(String(undo?.id)); flash("Import undone"); } catch (e) { flash(e instanceof Error ? e.message : "Undo failed", true); } setUndo(null); }}>Undo import</button></div>
      </Dialog>
      {sel && <SidePanel onClose={() => router.push(K[kind].txBase)}><TxnDetail kind={kind} t={sel} onApprove={() => approve(sel)} /></SidePanel>}
      {node}
    </div>
  );
}

function TxnDetail({ kind, t, onApprove }: { kind: Kind; t: Rec; onApprove: () => void }) {
  const holders = useCollection(K[kind].coll);
  const journals = useCollection("journal-entries");
  const accounts = useAccounts();
  const vendors = useCollection("vendors");
  const customers = useCollection("customers");
  const cats = useCollection("transaction-categories");
  const je = journals.find((j) => j.id === t.journalId);
  const row = (k: string, v: React.ReactNode) => <div className="flex justify-between gap-4 border-b border-border py-2 text-sm"><span className="text-muted-foreground">{k}</span><span className="text-right font-medium">{v}</span></div>;
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-2"><div><h2 className="text-xl font-semibold">{String(t.voucherNo || t.description || "Transaction")}</h2><p className="text-sm text-muted-foreground">{fmtDate(t.date)}</p></div>{t.postingState === "PENDING" && <button type="button" className={btn.primary} onClick={onApprove}><Check /> Approve</button>}{t.inboxState === "FOR_REVIEW" && <Link href={`/bank/inbox?account=${t.bankAccountId}`} className={btn.outline}>Review in Bank Inbox</Link>}</div>
      <Card><div className="p-5">
        {row(K[kind].noun, holderLabel(kind, holders.find((h) => h.id === t[K[kind].key])))}
        {row("Amount", <span className={num(t.amount) < 0 ? "text-destructive" : "text-success"}>{money(num(t.amount))}</span>)}
        {row("Description", String(t.description || "—"))}
        {row("Reference", String(t.reference || "—"))}
        {t.categoryId ? row("Transaction Category", String(cats.find((c) => c.id === t.categoryId)?.name ?? "—")) : null}
        {t.accountKind ? row(KIND_LABEL[String(t.accountKind)], counterName(t, accounts, vendors, customers)) : null}
        {row("Source", t.source === "IMPORT" ? "Statement import" : "Voucher")}
        {row("Status", <StatusCell t={t} />)}
        {row("Posting", <PostingBadge t={t} />)}
      </div></Card>
      {je && <Card><div className="p-5"><CardTitle className="mb-3">Journal entry {String(je.number ?? "")}</CardTitle><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Account</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th></tr></thead><tbody>{((je.lines as Rec[]) ?? []).map((l, i) => { const a = accounts.find((x) => x.id === l.accountId); return <tr key={i} className="border-b border-border"><td className="px-2 py-2">{a ? `${a.code} - ${a.name}` : "—"}</td><td className="px-2 py-2 text-right tabular-nums">{num(l.debit) ? money(num(l.debit)) : ""}</td><td className="px-2 py-2 text-right tabular-nums">{num(l.credit) ? money(num(l.credit)) : ""}</td></tr>; })}</tbody></table></div></Card>}
    </div>
  );
}

// "2026-10-29", "29/10/2026", "10/29/2026" (when the first part can't be a day-of-month swap) or anything Date parses.
function toIso(v: string) {
  const s = v.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) {
    let [d, mo] = [Number(m[1]), Number(m[2])];
    if (mo > 12 && d <= 12) [d, mo] = [mo, d];
    const y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  const t = new Date(s);
  return Number.isNaN(t.getTime()) ? "" : t.toISOString().slice(0, 10);
}

export function parseStatement(text: string): StatementLine[] {
  return parseCsv(text).map((r) => {
    const amount = r.amount !== undefined && r.amount !== "" ? num(r.amount.replace(/[^0-9.-]/g, "")) : num((r.credit ?? r.deposit ?? r.moneyin ?? "").replace(/[^0-9.]/g, "")) - num((r.debit ?? r.withdrawal ?? r.moneyout ?? "").replace(/[^0-9.]/g, ""));
    return { date: toIso(r.date ?? r.transactiondate ?? r.valuedate ?? ""), description: r.description ?? r.narration ?? r.details ?? r.memo ?? "", amount, reference: r.reference ?? r.ref ?? r.chequeno ?? undefined };
  }).filter((l) => l.date && l.amount);
}

function ImportStatement({ kind }: { kind: Kind }) {
  const router = useRouter();
  const holders = useCollection(K[kind].coll);
  const cats = useCollection("transaction-categories");
  const [holderId, setHolderId] = useState("");
  const [file, setFile] = useState("");
  const [lines, setLines] = useState<StatementLine[]>([]);
  const [err, setErr] = useState("");
  const { node, flash } = useFlash();
  async function onFile(fl?: File) {
    setErr(""); setLines([]);
    if (!fl) return;
    setFile(fl.name);
    if (!/\.csv$/i.test(fl.name)) return setErr("Could not read file — export the statement as CSV (date, description, amount) and try again.");
    const parsed = parseStatement(await fl.text());
    if (!parsed.length) return setErr("Could not parse any transactions. Check the file has date, description and amount columns.");
    setLines(parsed);
  }
  function run() {
    if (!holderId) return setErr(`Please select a ${K[kind].noun.toLowerCase()}`);
    if (!lines.length) return setErr("No transactions to import");
    if (kind === "bank") {
      const b = importStatement(holderId, file, lines);
      flash(`Import complete — ${lines.length} line(s) sent to the Bank Inbox`);
      setTimeout(() => router.push(`/bank/transactions?import=${b.id}`), 600);
    } else {
      // Cash sheets become pending vouchers against the first active category of each direction.
      const cat = (d: Direction) => cats.find((c) => c.status !== "INACTIVE" && c.transactionType === d && c.linkTarget === "ACCOUNTS" && ((c.links as string[]) ?? []).length);
      if (!cat("RECEIPT") && lines.some((l) => l.amount > 0)) return setErr("Create a Receipt category linked to an account first");
      if (!cat("PAYMENT") && lines.some((l) => l.amount < 0)) return setErr("Create a Payment category linked to an account first");
      const batch = createRecord("bank-imports", { bankAccountId: holderId, fileName: file, rows: lines.length, importedAt: new Date().toISOString(), status: "IMPORTED", cash: true });
      for (const l of lines) { const d: Direction = l.amount > 0 ? "RECEIPT" : "PAYMENT"; const c = cat(d)!; const v = createVoucher("cash", holderId, { date: l.date, direction: d, categoryId: c.id, accountKind: "ACCOUNT", accountId: String((c.links as string[])[0]), amount: Math.abs(l.amount), description: l.description }); updateRecord("cash-transactions", v.id, { importId: batch.id }); }
      flash("Import complete");
      setTimeout(() => router.push("/cash/transactions"), 600);
    }
  }
  return (
    <div className="space-y-4">
      <Link href={K[kind].txBase} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Back</Link>
      <PageHeader title="Import Transactions" subtitle={`Upload a CSV or Excel statement to import ${kind} transactions`} />
      <Card><div className="space-y-4 p-5">
        <CardTitle>Import Settings</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={K[kind].noun}><Select ariaLabel={K[kind].noun} value={holderId} onChange={setHolderId} placeholder={`Select ${K[kind].noun.toLowerCase()}`} options={holders.map((h) => ({ value: h.id, label: holderLabel(kind, h) }))} /></Field>
          <Field label="Statement File (CSV or Excel)" hint="Use a .csv, .xlsx, .ofx, .mt940 or camt.053 .xml statement file."><input aria-label="Statement File" type="file" accept=".csv,.xlsx,.xls,.ofx,.xml,.mt940,.sta" className={cn(inputCls, "pt-1.5")} onChange={(e) => onFile(e.target.files?.[0])} /></Field>
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
      </div></Card>
      {lines.length > 0 && <Card><div className="p-5">
        <div className="mb-3 flex items-center justify-between"><CardTitle>{lines.length} transaction(s)</CardTitle><button type="button" className={btn.smOutline} onClick={() => { setLines([]); setFile(""); }}><X /> Clear</button></div>
        <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>Description</Th><Th className="text-right">Amount</Th><Th>Type</Th><Th>Reference</Th></tr></thead><tbody>{lines.map((l, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-1.5">{fmtDate(l.date)}</td><td className="px-2 py-1.5">{l.description}</td><td className={cn("px-2 py-1.5 text-right tabular-nums", l.amount < 0 ? "text-destructive" : "text-success")}>{money(l.amount)}</td><td className="px-2 py-1.5">{l.amount < 0 ? "Debit" : "Credit"}</td><td className="px-2 py-1.5">{l.reference || "—"}</td></tr>)}</tbody></table>
        <div className="mt-4 flex justify-end"><button type="button" className={btn.primary} onClick={run}><Upload /> Import Transactions</button></div>
      </div></Card>}
      {node}
    </div>
  );
}

/* ---------- reconciliations ---------- */

export function Reconciliations() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/bank/reconciliations");
  const recs = useCollection("reconciliations");
  const banks = useBankAccounts();
  useCollection("journal-entries");
  if (sub && sub !== "new") return <ReconciliationDetail id={sub} />;
  const tone = (s: unknown) => (s === "COMPLETED" ? "success" : s === "VOIDED" ? "muted" : "warning") as "success" | "muted" | "warning";
  return (
    <div className="space-y-4">
      <PageHeader title="Reconciliations" subtitle="Bank statement reconciliation history" actions={<Link href="/bank/reconciliations/new" className={btn.primary}><Plus /> New Reconciliation</Link>} />
      <DataTable rows={[...recs].sort((a, b) => String(b.periodEnd).localeCompare(String(a.periodEnd)))} onRowClick={(r) => router.push(`/bank/reconciliations/${r.id}`)} columns={[
        { key: "bank", header: "Bank Account", cell: (r) => holderLabel("bank", banks.find((b) => b.id === r.bankAccountId)) },
        { key: "no", header: "Reconciliation #", cell: (r) => <span className="font-mono text-xs">{String(r.recNumber)}</span> },
        { key: "date", header: "Statement Date", cell: (r) => fmtDate(r.periodEnd) },
        { key: "sb", header: "Statement Balance", cell: (r) => money(num(r.statementBalance)) },
        { key: "gl", header: "GL Balance", cell: (r) => money(r.status === "COMPLETED" ? num(r.glBalance) : reconSummary(r).gl) },
        { key: "diff", header: "Difference", cell: (r) => { const d = r.status === "COMPLETED" ? 0 : reconSummary(r).difference; return <span className={d ? "text-destructive" : ""}>{money(d)}</span>; } },
        { key: "st", header: "Status", cell: (r) => <Badge tone={tone(r.status)}>{String(r.status).replace("_", " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}</Badge> },
      ]} />
      {sub === "new" && <SidePanel onClose={() => router.push("/bank/reconciliations")}><NewReconciliation /></SidePanel>}
    </div>
  );
}

function NewReconciliation() {
  const router = useRouter();
  const banks = useBankAccounts();
  const recs = useCollection("reconciliations");
  const [f, setF] = useState({ bankAccountId: "", periodStart: `${todayIso().slice(0, 8)}01`, periodEnd: todayIso(), statementBalance: "" });
  const [err, setErr] = useState("");
  function save() {
    if (!f.bankAccountId) return setErr("Select bank account");
    if (f.periodEnd < f.periodStart) return setErr("Period end must be after the start");
    if (f.statementBalance === "") return setErr("Enter the statement balance");
    if (recs.some((r) => r.bankAccountId === f.bankAccountId && r.status === "IN_PROGRESS")) return setErr("This account already has a reconciliation in progress");
    const r = startReconciliation({ ...f, statementBalance: num(f.statementBalance) });
    router.push(`/bank/reconciliations/${r.id}`);
  }
  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-semibold">New Reconciliation</h2><p className="text-sm text-muted-foreground">Start a new bank reconciliation</p></div>
      <Card><div className="space-y-4 p-5">
        <CardTitle>Reconciliation Details</CardTitle>
        <NumberBanner label="Reconciliation #" value={`REC-${String(recs.length + 1).padStart(2, "0")}`} />
        <Field label="Bank Account"><Select ariaLabel="Bank Account" value={f.bankAccountId} onChange={(v) => setF({ ...f, bankAccountId: v })} placeholder="Select bank account" options={banks.map((b) => ({ value: b.id, label: holderLabel("bank", b) }))} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Period Start"><DateInput ariaLabel="Period Start" value={f.periodStart} onChange={(v) => setF({ ...f, periodStart: v })} /></Field>
          <Field label="Period End"><DateInput ariaLabel="Period End" value={f.periodEnd} onChange={(v) => setF({ ...f, periodEnd: v })} /></Field>
        </div>
        <Field label="Statement Balance" htmlFor="sb"><input id="sb" type="number" step="0.01" className={inputCls} value={f.statementBalance} onChange={(e) => setF({ ...f, statementBalance: e.target.value })} /></Field>
      </div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Start Reconciliation</button><Link href="/bank/reconciliations" className={btn.outline}>Cancel</Link></div>
    </div>
  );
}

const Stat = ({ label, value, bad }: { label: string; value: number; bad?: boolean }) => <Card><div className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className={cn("text-xl font-bold tabular-nums", bad && "text-destructive")}>{money(value)}</p></div></Card>;

function ReconciliationDetail({ id }: { id: string }) {
  const recs = useCollection("reconciliations");
  const banks = useBankAccounts();
  const txAll = useCollection("bank-transactions");
  useCollection("journal-entries");
  const [picking, setPicking] = useState<Rec | null>(null);
  const [adj, setAdj] = useState({ open: false, type: "FEE", amount: "", memo: "" });
  const [voiding, setVoiding] = useState(false);
  const { node, flash } = useFlash();
  const rec = recs.find((r) => r.id === id);
  if (!rec) return recs.length ? <p className="p-6 text-sm text-muted-foreground">Reconciliation not found</p> : null;
  const open = rec.status === "IN_PROGRESS";
  const matches = (rec.matches as Rec[]) ?? [];
  const matchedIds = new Set(matches.map((m) => String(m.txnId)));
  const txns = txAll.filter((t) => t.bankAccountId === rec.bankAccountId && !t.deleted && t.inboxState !== "EXCLUDED" && String(t.date) >= String(rec.periodStart) && String(t.date) <= String(rec.periodEnd) && (t.status !== "RECONCILED" || t.reconciliationId === rec.id)).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const s = reconSummary(rec);
  const adjustments = (rec.adjustments as Rec[]) ?? [];
  return (
    <div className="space-y-4">
      <Link href="/bank/reconciliations" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Reconciliations</Link>
      <PageHeader title={String(rec.recNumber)} subtitle={`${holderLabel("bank", banks.find((b) => b.id === rec.bankAccountId))} · ${fmtDate(rec.periodStart)} – ${fmtDate(rec.periodEnd)}`} actions={<>
        <Badge tone={rec.status === "COMPLETED" ? "success" : rec.status === "VOIDED" ? "muted" : "warning"}>{rec.status === "IN_PROGRESS" ? "In progress" : rec.status === "COMPLETED" ? "Completed" : "Voided"}</Badge>
        {open && <button type="button" className={btn.primary} disabled={Math.abs(s.difference) > 0.005} title={Math.abs(s.difference) > 0.005 ? "The difference must be zero" : undefined} onClick={() => { completeReconciliation(rec.id); flash("Reconciliation completed successfully"); }}><Check /> Complete Reconciliation</button>}
        {rec.status !== "VOIDED" && <button type="button" className={btn.outline} onClick={() => setVoiding(true)}>Void</button>}
      </>} />
      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Statement Balance" value={num(rec.statementBalance)} />
        <Stat label="GL Balance" value={rec.status === "COMPLETED" ? num(rec.glBalance) : s.gl} />
        <Stat label="Adjusted GL" value={rec.status === "COMPLETED" ? num(rec.statementBalance) : s.adjustedGl} />
        <Stat label="Difference" value={rec.status === "COMPLETED" ? 0 : s.difference} bad={open && Math.abs(s.difference) > 0.005} />
      </div>
      <Card><div className="p-5">
        <div className="mb-1 flex items-center justify-between"><CardTitle>Reconciliation Items</CardTitle><span className="text-xs text-muted-foreground">Matched transactions: {matchedIds.size} · Unmatched transactions: {txns.length - txns.filter((t) => matchedIds.has(t.id)).length}</span></div>
        <p className="mb-3 text-xs text-muted-foreground">Transactions matched to journal entries. These will be reconciled on completion.</p>
        {txns.length === 0 ? <p className="text-sm text-muted-foreground">No bank transactions in this period.</p> : txns.every((t) => matchedIds.has(t.id)) && open ? <p className="mb-2 text-sm text-success">All transactions are matched</p> : null}
        {txns.length > 0 && <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>Description</Th><Th>Reference</Th><Th className="text-right">Amount</Th><Th>Status</Th><Th>Action</Th></tr></thead><tbody>{txns.map((t) => { const m = matchedIds.has(t.id); return (
          <tr key={t.id} className="border-b border-border"><td className="px-2 py-2">{fmtDate(t.date)}</td><td className="px-2 py-2">{String(t.description || t.voucherNo || "—")}</td><td className="px-2 py-2">{String(t.reference || "—")}</td><td className={cn("px-2 py-2 text-right tabular-nums", num(t.amount) < 0 ? "text-destructive" : "text-success")}>{money(num(t.amount))}</td><td className="px-2 py-2">{m || t.status === "RECONCILED" ? <Badge tone="success">Matched</Badge> : <Badge>Unmatched</Badge>}</td>
            <td className="px-2 py-2">{open && (m ? <button type="button" className="text-xs text-destructive underline" onClick={() => { unmatchTxn(rec.id, t.id); flash("Transaction unmatched"); }}>Unmatch</button> : <button type="button" className={btn.smOutline} onClick={() => setPicking(t)}>Match</button>)}</td></tr>
        ); })}</tbody></table>}
      </div></Card>
      <Card><div className="p-5">
        <div className="mb-3 flex items-center justify-between"><CardTitle>Adjustments</CardTitle>{open && <button type="button" className={btn.smOutline} onClick={() => setAdj({ ...adj, open: true })}><Plus /> Add Adjustment</button>}</div>
        {adjustments.length === 0 ? <p className="text-sm text-muted-foreground">Bank fees and interest on the statement but not yet in the books. They post when the reconciliation completes.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Type</Th><Th>Memo</Th><Th className="text-right">Amount</Th><Th /></tr></thead><tbody>{adjustments.map((a, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-2">{a.type === "INTEREST" ? "Interest" : "Bank Fee"}</td><td className="px-2 py-2">{String(a.memo || "—")}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(a.amount))}</td><td className="px-2 py-2 text-right">{open && <button type="button" aria-label="Remove adjustment" className="text-muted-foreground hover:text-destructive" onClick={() => updateRecord("reconciliations", rec.id, { adjustments: adjustments.filter((_, j) => j !== i) })}><X className="size-4" /></button>}{Boolean(a.posted) && <Badge tone="success">Posted</Badge>}</td></tr>)}</tbody></table>}
      </div></Card>
      {picking && <MatchDialog rec={rec} txn={picking} onClose={() => setPicking(null)} onMatched={() => { setPicking(null); flash("Transaction matched to journal line"); }} />}
      <Dialog open={adj.open} onClose={() => setAdj({ ...adj, open: false })} title="Add Adjustment">
        <div className="grid gap-3">
          <Field label="Type"><Select ariaLabel="Adjustment type" value={adj.type} onChange={(v) => setAdj({ ...adj, type: v })} options={[{ value: "FEE", label: "Bank Fee" }, { value: "INTEREST", label: "Interest" }]} /></Field>
          <Field label="Amount"><input aria-label="Adjustment amount" type="number" min="0" step="0.01" placeholder="0.00" className={inputCls} value={adj.amount} onChange={(e) => setAdj({ ...adj, amount: e.target.value })} /></Field>
          <Field label="Memo"><input aria-label="Memo" placeholder="Optional" className={inputCls} value={adj.memo} onChange={(e) => setAdj({ ...adj, memo: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setAdj({ ...adj, open: false })}>Cancel</button><button type="button" className={btn.primary} onClick={() => { if (!(num(adj.amount) > 0)) return; updateRecord("reconciliations", rec.id, { adjustments: [...adjustments, { type: adj.type, amount: num(adj.amount), memo: adj.memo }] }); setAdj({ open: false, type: "FEE", amount: "", memo: "" }); }}>Add Adjustment</button></div>
      </Dialog>
      <Dialog open={voiding} onClose={() => setVoiding(false)} title="Void Reconciliation?" description="This will void the reconciliation and unmatch all matched transactions. This cannot be undone.">
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setVoiding(false)}>Cancel</button><button type="button" className={cn(btn.primary, "bg-destructive hover:bg-destructive/90")} onClick={() => { voidReconciliation(rec.id); setVoiding(false); flash("Reconciliation voided"); }}>Void</button></div>
      </Dialog>
      {node}
    </div>
  );
}

function MatchDialog({ rec, txn, onClose, onMatched }: { rec: Rec; txn: Rec; onClose: () => void; onMatched: () => void }) {
  const cands = matchCandidates(rec, txn);
  return (
    <Dialog open onClose={onClose} title="Match Transaction" description={`${fmtDate(txn.date)} · ${txn.description || txn.voucherNo} · ${money(num(txn.amount))}`} className="max-w-2xl">
      {cands.length === 0 ? <p className="text-sm text-muted-foreground">No matching journal lines found for this transaction amount.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>Description</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th><Th /></tr></thead><tbody>{cands.map((c) => <tr key={c.key} className={cn("border-b border-border", c.journalId === txn.journalId && "bg-primary/5")}><td className="px-2 py-2">{fmtDate(c.date)}</td><td className="px-2 py-2">{c.description}</td><td className="px-2 py-2 text-right tabular-nums">{c.amount > 0 ? money(c.amount) : ""}</td><td className="px-2 py-2 text-right tabular-nums">{c.amount < 0 ? money(-c.amount) : ""}</td><td className="px-2 py-2 text-right"><button type="button" className={btn.smPrimary} onClick={() => { matchTxn(rec.id, txn.id, c.key); onMatched(); }}>Match</button></td></tr>)}</tbody></table>}
    </Dialog>
  );
}

/* ---------- transaction categories ---------- */

const catCode = (name: string, existing: Rec[]) => {
  const base = name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 12) || "CAT";
  return `${base}-${String(existing.filter((c) => String(c.code).startsWith(`${base}-`)).length + 1).padStart(2, "0")}`;
};

export function TransactionCategories() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/transaction-categories");
  const cats = useCollection("transaction-categories");
  const [q, setQ] = useState("");
  if (sub) return <CategoryForm record={sub === "new" ? undefined : cats.find((c) => c.id === sub)} key={sub} />;
  return (
    <div className="space-y-4">
      <PageHeader title="Transaction Categories" subtitle="Categories used to post transactions" actions={<Link href="/transaction-categories/new" className={btn.primary}><Plus /> New Transaction Category</Link>} />
      <div className="max-w-xs"><SearchInput value={q} onChange={setQ} placeholder="Search categories..." /></div>
      <DataTable rows={cats.filter((c) => !q || `${c.name} ${c.code}`.toLowerCase().includes(q.toLowerCase()))} onRowClick={(c) => router.push(`/transaction-categories/${c.id}`)} columns={[
        { key: "name", header: "Category Name", cell: (c) => <span className="font-medium">{String(c.name)}</span> },
        { key: "code", header: "Code", cell: (c) => <span className="font-mono text-xs">{String(c.code)}</span> },
        { key: "type", header: "Type", cell: (c) => (c.transactionType === "RECEIPT" ? "Receipt" : "Payment") },
        { key: "linked", header: "Linked", cell: (c) => `${((c.links as string[]) ?? []).length} ${c.linkTarget === "SUPPLIERS" ? "supplier(s)" : c.linkTarget === "CUSTOMERS" ? "customer(s)" : "account(s)"}` },
        { key: "st", header: "Status", cell: (c) => <ActiveBadge status={c.status} /> },
      ]} menu={(c) => [
        { label: "Edit", onSelect: () => router.push(`/transaction-categories/${c.id}`) },
        { label: c.status === "INACTIVE" ? "Activate" : "Deactivate", onSelect: () => updateRecord("transaction-categories", c.id, { status: c.status === "INACTIVE" ? "ACTIVE" : "INACTIVE" }) },
      ]} />
    </div>
  );
}

function CategoryForm({ record }: { record?: Rec }) {
  const router = useRouter();
  const cats = useCollection("transaction-categories");
  const accounts = useAccounts();
  const vendors = useCollection("vendors");
  const customers = useCollection("customers");
  const [f, setF] = useState({ name: String(record?.name ?? ""), transactionType: String(record?.transactionType ?? "PAYMENT"), description: String(record?.description ?? ""), status: String(record?.status ?? "ACTIVE"), linkTarget: String(record?.linkTarget ?? "ACCOUNTS"), links: ((record?.links as string[]) ?? []) as string[], defaultId: String(record?.defaultId ?? "") });
  const [typeF, setTypeF] = useState("");
  const [linkF, setLinkF] = useState("");
  const [err, setErr] = useState("");
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  const toggle = (id: string) => set({ links: f.links.includes(id) ? f.links.filter((x) => x !== id) : [...f.links, id] });
  const items: { id: string; code: string; name: string; type: string; status: string }[] = f.linkTarget === "SUPPLIERS" ? vendors.map((v) => ({ id: v.id, code: String(v.code ?? ""), name: String(v.name), type: "Supplier", status: "ACTIVE" })) : f.linkTarget === "CUSTOMERS" ? customers.map((c) => ({ id: c.id, code: String(c.code ?? ""), name: String(c.name), type: "Customer", status: "ACTIVE" })) : [...accounts].sort((a, b) => String(a.code).localeCompare(String(b.code))).map((a) => ({ id: a.id, code: String(a.code), name: String(a.name), type: String(a.type).charAt(0) + String(a.type).slice(1).toLowerCase(), status: a.isActive === false ? "INACTIVE" : "ACTIVE" }));
  const shown = items.filter((i) => (!typeF || i.type.toUpperCase() === typeF) && (!linkF || (linkF === "LINKED") === f.links.includes(i.id)));
  const noun = f.linkTarget === "SUPPLIERS" ? "suppliers" : f.linkTarget === "CUSTOMERS" ? "customers" : "accounts";
  function save() {
    if (!f.name.trim()) return setErr("Category name is required");
    if (cats.some((c) => c.id !== record?.id && String(c.name).toLowerCase() === f.name.trim().toLowerCase())) return setErr("A category with this name already exists");
    const data = { name: f.name.trim(), transactionType: f.transactionType, description: f.description, status: f.status, linkTarget: f.linkTarget, links: f.links, defaultId: f.links.includes(f.defaultId) ? f.defaultId : f.links[0] ?? null };
    if (record) updateRecord("transaction-categories", record.id, data); else createRecord("transaction-categories", { ...data, code: catCode(f.name, cats) });
    router.push("/transaction-categories");
  }
  const target = (v: string, title: string, text: string) => <button type="button" onClick={() => set({ linkTarget: v, links: [], defaultId: "" })} className={cn("rounded-lg border p-3 text-left", f.linkTarget === v ? "border-primary bg-primary/5" : "border-border hover:bg-accent")}><p className="text-sm font-medium">{title}</p><p className="text-xs text-muted-foreground">{text}</p></button>;
  return (
    <div className="space-y-4">
      <PageHeader title={record ? `Edit ${record.name}` : "New Transaction Category"} />
      <Card><div className="space-y-4 p-5">
        <CardTitle>Category Details</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category Name *" htmlFor="cn"><input id="cn" className={inputCls} value={f.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Category Code" hint={record ? undefined : "Built from the name, numbered on save."}><input aria-label="Category Code" className={inputCls} disabled value={record ? String(record.code) : f.name ? catCode(f.name, cats) : ""} /></Field>
          <Field label="Transaction Type *"><Select ariaLabel="Transaction Type" value={f.transactionType} onChange={(v) => set({ transactionType: v })} options={[{ value: "PAYMENT", label: "Payment" }, { value: "RECEIPT", label: "Receipt" }]} /></Field>
          <Field label="Status"><Select ariaLabel="Status" value={f.status} onChange={(v) => set({ status: v })} options={[{ value: "ACTIVE", label: "Active" }, { value: "INACTIVE", label: "Inactive" }]} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea aria-label="Description" rows={2} className={textareaCls} value={f.description} onChange={(e) => set({ description: e.target.value })} /></Field>
        </div>
        <div><p className="text-sm font-medium">Link With</p><p className="mb-2 text-xs text-muted-foreground">Choose what you want to link with this category</p>
          <div className="grid gap-2 sm:grid-cols-3">{target("ACCOUNTS", "Chart of Accounts", "Link one or more accounts from your chart of accounts")}{target("SUPPLIERS", "Suppliers", "Link one or more suppliers to this category")}{target("CUSTOMERS", "Customers", "Link one or more customers to this category")}</div>
        </div>
      </div></Card>
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><CardTitle>Linked {noun.charAt(0).toUpperCase() + noun.slice(1)}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Tick the {noun} you want linked to this category.</p></div>
          <div className="flex flex-wrap gap-2">{f.linkTarget === "ACCOUNTS" && <><Link href="/financial/accounts/new" className={btn.smOutline}><Plus /> New Account</Link><Select ariaLabel="Account type filter" size="sm" className="w-40" value={typeF} onChange={setTypeF} options={[{ value: "", label: "All account types" }, ...["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"].map((t) => ({ value: t, label: t.charAt(0) + t.slice(1).toLowerCase() }))]} /></>}<Select ariaLabel="Linked filter" size="sm" className="w-36" value={linkF} onChange={setLinkF} options={[{ value: "", label: `All ${noun}` }, { value: "LINKED", label: "Linked only" }, { value: "UNLINKED", label: "Not linked" }]} /></div></div>
        <div className="max-h-[28rem] overflow-y-auto rounded-md border border-border"><table className="w-full text-sm"><thead className="sticky top-0 bg-card"><tr className="border-b border-border"><Th className="w-8" /><Th>{f.linkTarget === "ACCOUNTS" ? "Account Code" : "Code"}</Th><Th>{f.linkTarget === "ACCOUNTS" ? "Account Name" : "Name"}</Th><Th>{f.linkTarget === "ACCOUNTS" ? "Account Type" : "Type"}</Th><Th>Default</Th><Th>Status</Th></tr></thead><tbody>{shown.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">No {noun} to show.</td></tr> : shown.map((i) => <tr key={i.id} className="border-b border-border"><td className="px-2 py-1.5"><input type="checkbox" aria-label={`Link ${i.name}`} checked={f.links.includes(i.id)} onChange={() => toggle(i.id)} /></td><td className="px-2 py-1.5 font-mono text-xs">{i.code || "—"}</td><td className="px-2 py-1.5">{i.name}</td><td className="px-2 py-1.5">{i.type}</td><td className="px-2 py-1.5">{f.links.includes(i.id) && <input type="radio" name="default" aria-label={`Default ${i.name}`} checked={(f.defaultId || f.links[0]) === i.id} onChange={() => set({ defaultId: i.id })} />}</td><td className="px-2 py-1.5"><ActiveBadge status={i.status} /></td></tr>)}</tbody></table></div>
        <p className="text-xs text-muted-foreground">{f.links.length} {noun} linked</p>
      </div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{record ? "Save Changes" : "Create Category"}</button><Link href="/transaction-categories" className={btn.outline}>Cancel</Link></div>
    </div>
  );
}

// Kept for the cockpit/inbox: which holder a bank line belongs to.
export const bankLabel = (b?: Rec) => holderLabel("bank", b);
export const readBanks = () => readCollection("bank-accounts");
