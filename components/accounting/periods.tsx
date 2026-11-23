"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CircleCheck, Lock, LockOpen, Percent, Plus, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, updateRecord, useCollection, type Rec } from "@/lib/store";
import { balancesFrom, isBalanced, onBooks, linesOf, totalsOf, useAccounts, useFiscalPeriods, useJournals } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, DataTable, Field, PageHeader, Select, SidePanel, btn, inputCls, longDate, money, num, today, type Column , DateInput } from "./kit";

/* ---------- fiscal periods ---------- */

const FP_BASE = "/financial/fiscal-periods";

export function FiscalPeriods() {
  const router = useRouter();
  const pathname = usePathname();
  const periods = useFiscalPeriods();
  const sub = pathname.slice(FP_BASE.length).replace(/^\//, "");
  const rows = useMemo(
    () => [...periods].sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)) || String(b.endDate).localeCompare(String(a.endDate))),
    [periods],
  );

  const columns: Column<Rec>[] = [
    { key: "name", header: "Period Name", cell: (p) => <span className="font-medium">{String(p.name)}</span> },
    { key: "start", header: "Start Date", cell: (p) => longDate(p.startDate) },
    { key: "end", header: "End Date", cell: (p) => longDate(p.endDate) },
    { key: "status", header: "Status", cell: (p) => (p.isLocked ? <Badge>Closed</Badge> : <Badge tone="info">Open</Badge>) },
    {
      key: "act",
      header: "",
      cell: (p) => (
        <button type="button" onClick={() => updateRecord("fiscal-periods", p.id, { isLocked: !p.isLocked })} className={btn.smOutline}>
          {p.isLocked ? <LockOpen /> : <Lock />} {p.isLocked ? "Reopen" : "Close"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fiscal Periods"
        subtitle="Manage accounting periods"
        actions={
          <Link href={`${FP_BASE}/new`} className={btn.primary}>
            <Plus /> New Period
          </Link>
        }
      />
      <DataTable
        columns={columns}
        rows={rows}
        menu={(p) => [{ label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${p.name}?`) && deleteRecord("fiscal-periods", p.id) }]}
      />
      {sub === "new" && (
        <SidePanel onClose={() => router.push(FP_BASE)}>
          <NewPeriodForm onDone={() => router.push(FP_BASE)} />
        </SidePanel>
      )}
    </div>
  );
}

function NewPeriodForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [error, setError] = useState("");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !start || !end) return setError("Name, start and end dates are required.");
    if (end < start) return setError("End date must be on or after the start date.");
    createRecord("fiscal-periods", { name: name.trim(), startDate: start, endDate: end, isLocked: false });
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Fiscal Period</h1>
      <Card className="max-w-xl">
        <div className="space-y-4 p-6">
          <CardTitle>Period Details</CardTitle>
          <Field label="Period Name" htmlFor="fp-name">
            <input id="fp-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., January 2026" className={inputCls} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start Date" htmlFor="fp-start">
              <DateInput id="fp-start" value={start} onChange={(v) => setStart(v)} />
            </Field>
            <Field label="End Date" htmlFor="fp-end">
              <DateInput id="fp-end" value={end} onChange={(v) => setEnd(v)} />
            </Field>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className={btn.primary}>
              Create Period
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

/* ---------- ledger integrity ---------- */

export function LedgerIntegrity() {
  const accounts = useAccounts();
  const journals = useJournals();
  const [validation, setValidation] = useState<{ ok: boolean; lines: string[] } | null>(null);
  const [rebuilt, setRebuilt] = useState("");

  function validate() {
    const ids = new Set(accounts.map((a) => a.id));
    const posted = journals.filter(onBooks);
    const issues: string[] = [];
    for (const j of posted) {
      if (!isBalanced(linesOf(j))) {
        const t = totalsOf(linesOf(j));
        issues.push(`${j.number ?? "Entry"} is out of balance: Dr ${money(t.debit)} vs Cr ${money(t.credit)}.`);
      }
      if (linesOf(j).some((l) => !ids.has(l.accountId))) issues.push(`${j.number ?? "Entry"} references an account that no longer exists.`);
    }
    const t = posted.reduce((s, j) => {
      const x = totalsOf(linesOf(j));
      return { d: s.d + x.debit, c: s.c + x.credit };
    }, { d: 0, c: 0 });
    setValidation(
      issues.length
        ? { ok: false, lines: issues }
        : { ok: true, lines: [`All ${posted.length} posted entr${posted.length === 1 ? "y balances" : "ies balance"}. Total debits ${money(t.d)} = total credits ${money(t.c)}.`] },
    );
  }

  function rebuild() {
    const b = balancesFrom(accounts, journals);
    const nonZero = [...b.values()].filter((v) => Math.abs(v) > 0.0005).length;
    setRebuilt(`Recalculated ${accounts.length} account balances from ${journals.filter(onBooks).length} posted entries — ${nonZero} non-zero.`);
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Ledger Integrity" subtitle="Validate data integrity and rebuild balances" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="space-y-3 p-6">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" /> Integrity Check
            </CardTitle>
            <p className="text-sm text-muted-foreground">Validate that all journal entries are balanced and account balances are correct.</p>
            <button type="button" onClick={validate} className={btn.primary}>
              <ShieldCheck /> Run Validation
            </button>
            {validation && (
              <div className={cn("space-y-1 rounded-md p-3 text-sm", validation.ok ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive")}>
                {validation.lines.map((l) => (
                  <p key={l} className="flex gap-2">
                    {validation.ok ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
                    {l}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Card>
        <Card>
          <div className="space-y-3 p-6">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" /> Rebuild Balances
            </CardTitle>
            <p className="text-sm text-muted-foreground">Recalculate all account period balances from journal entries. Use if integrity check finds balance discrepancies.</p>
            <button type="button" onClick={rebuild} className={btn.outline}>
              <RefreshCw /> Rebuild Balances
            </button>
            {rebuilt && <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">{rebuilt}</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- interest on outstandings ---------- */

const DEFAULT_RATE = 12;
const isOpen = (s: unknown) => !/^(paid|cancelled|draft)$/i.test(String(s ?? ""));

export function InterestOnOutstandings() {
  const [tab, setTab] = useState<"CUSTOMER" | "VENDOR">("CUSTOMER");
  const invoices = useCollection("invoices");
  const bills = useCollection("bills");
  const customers = useCollection("customers");
  const vendors = useCollection("vendors");
  const profiles = useCollection("interest-profiles");
  const now = today();

  const profileFor = (kind: string, party: string) =>
    profiles.find((p) => p.kind === kind && p.party === party) ?? profiles.find((p) => p.kind === kind && !p.party);

  const docs = (tab === "CUSTOMER" ? invoices : bills)
    .filter((d) => isOpen(d.status) && !d.interestCharged && d.dueDate)
    .map((d) => {
      const party = String(tab === "CUSTOMER" ? d.customer : d.vendor);
      const prof = profileFor(tab, party);
      const rate = prof ? num(prof.rate) : DEFAULT_RATE;
      const grace = prof ? num(prof.graceDays) : 0;
      const days = Math.floor((Date.parse(now) - Date.parse(String(d.dueDate))) / 86400000) - grace;
      const interest = days > 0 ? Math.round(num(d.total) * (rate / 100) * (days / 365) * 1000) / 1000 : 0;
      return { doc: d, party, rate, days, interest };
    })
    .filter((x) => x.interest > 0);

  function charge(x: (typeof docs)[number]) {
    const vendor = tab === "VENDOR";
    createRecord(vendor ? "bills" : "invoices", {
      number: nextNumber(vendor ? "bills" : "invoices", vendor ? "INTB" : "INTI"),
      [vendor ? "vendor" : "customer"]: x.party,
      date: now,
      dueDate: now,
      total: x.interest,
      status: "UNPAID",
      description: `Interest on ${x.doc.number} — ${x.days} day(s) at ${x.rate}% p.a.`,
    });
    updateRecord(vendor ? "bills" : "invoices", x.doc.id, { interestCharged: now });
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Interest on Outstandings" subtitle="Bill-wise simple interest on overdue receivables and payables — charging books a real interest invoice/bill into the ledger." />
      <div className="inline-flex rounded-lg bg-muted p-1 text-sm">
        {(["CUSTOMER", "VENDOR"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setTab(k)} className={cn("rounded-md px-3 py-1 font-medium transition-colors", tab === k ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>
            {k === "CUSTOMER" ? "Receivable" : "Payable"}
          </button>
        ))}
      </div>
      <Card>
        {docs.length === 0 ? (
          <p className="p-6 py-10 text-center text-sm text-muted-foreground">
            No accrued interest — every {tab === "CUSTOMER" ? "customer" : "vendor"} document is either current, within grace, or already charged.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                {["Document", tab === "CUSTOMER" ? "Customer" : "Vendor", "Due", "Days over", "Outstanding", "Interest", ""].map((h) => (
                  <th key={h} className="h-10 px-4 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.map((x) => (
                <tr key={x.doc.id} className="border-b border-border/60">
                  <td className="px-4 py-2 font-medium">{String(x.doc.number)}</td>
                  <td className="px-4 py-2">{x.party}</td>
                  <td className="px-4 py-2">{longDate(x.doc.dueDate)}</td>
                  <td className="px-4 py-2">{x.days}</td>
                  <td className="px-4 py-2 tabular-nums">{money(num(x.doc.total))}</td>
                  <td className="px-4 py-2 tabular-nums">{money(x.interest)}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => charge(x)} className={btn.smPrimary}>
                      Charge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      <InterestProfiles customers={customers} vendors={vendors} profiles={profiles} />
    </div>
  );
}

function InterestProfiles({ customers, vendors, profiles }: { customers: Rec[]; vendors: Rec[]; profiles: Rec[] }) {
  const [kind, setKind] = useState("CUSTOMER");
  const [party, setParty] = useState("");
  const [rate, setRate] = useState(String(DEFAULT_RATE));
  const [grace, setGrace] = useState("0");
  const parties = (kind === "CUSTOMER" ? customers : vendors).map((p) => String(p.name));
  const valid = rate !== "" && num(rate) >= 0 && num(grace) >= 0;

  function save() {
    const existing = profiles.find((p) => p.kind === kind && (p.party ?? "") === party);
    const data = { kind, party, rate: num(rate), graceDays: Math.floor(num(grace)) };
    if (existing) updateRecord("interest-profiles", existing.id, data);
    else createRecord("interest-profiles", data);
  }

  return (
    <Card>
      <div className="space-y-3 p-6">
        <CardTitle className="flex items-center gap-2">
          <Percent className="h-4 w-4" /> Interest profiles
        </CardTitle>
        <p className="text-sm text-muted-foreground">The default profile covers every party of its kind; a party-specific profile overrides it. Interest starts after the grace days.</p>
        <div className="flex flex-wrap items-end gap-2">
          <Field label="Applies to" className="w-36 [&_label]:text-xs">
            <Select ariaLabel="Applies to" value={kind} onChange={(v) => { setKind(v); setParty(""); }} options={[{ value: "CUSTOMER", label: "Customers" }, { value: "VENDOR", label: "Vendors" }]} />
          </Field>
          <Field label="Party" className="w-56 [&_label]:text-xs">
            <Select ariaLabel="Party" value={party} onChange={setParty} placeholder={`All (${kind === "CUSTOMER" ? "customer" : "vendor"} default)`} options={parties} />
          </Field>
          <Field label="Rate % p.a." className="w-24 [&_label]:text-xs">
            <input aria-label="Rate % p.a." type="number" min="0" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Grace days" className="w-24 [&_label]:text-xs">
            <input aria-label="Grace days" type="number" min="0" value={grace} onChange={(e) => setGrace(e.target.value)} className={inputCls} />
          </Field>
          <button type="button" disabled={!valid} onClick={save} className={btn.smPrimary}>
            <Plus /> Save profile
          </button>
        </div>
        {profiles.length > 0 && (
          <ul className="divide-y divide-border rounded-md border border-border text-sm">
            {profiles.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span>
                  {p.kind === "CUSTOMER" ? "Customers" : "Vendors"} · {p.party ? String(p.party) : "default"} — {num(p.rate)}% p.a., {num(p.graceDays)} grace day(s)
                </span>
                <button type="button" onClick={() => deleteRecord("interest-profiles", p.id)} className="text-xs text-destructive hover:underline">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

/* ---------- bill-wise references ---------- */

const REF_STATUSES = [
  { value: "OPEN", label: "Open" },
  { value: "SETTLED", label: "Settled" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "ALL", label: "All" },
];

export function BillReferences() {
  const refs = useCollection("bill-references");
  const [status, setStatus] = useState("OPEN");
  const rows = refs.filter((r) => status === "ALL" || r.status === status);
  const columns: Column<Rec>[] = [
    { key: "ref", header: "Reference", cell: (r) => <span className="font-medium">{String(r.reference)}</span> },
    { key: "party", header: "Party", cell: (r) => String(r.party ?? "") },
    { key: "type", header: "Type", cell: (r) => String(r.type ?? "New Ref") },
    { key: "date", header: "Date", cell: (r) => longDate(r.date) },
    { key: "amount", header: "Amount", cell: (r) => money(num(r.amount)) },
    { key: "pending", header: "Pending", cell: (r) => money(num(r.amount) - num(r.settled)) },
    { key: "status", header: "Status", cell: (r) => <Badge tone={r.status === "OPEN" ? "info" : "muted"}>{String(r.status)}</Badge> },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Bill-wise References" subtitle="Bill-wise references carried on journal-voucher lines — New Ref / Advance / On Account, settled by Against Ref lines or on-account adjustments. Trade documents live in Bills Outstanding." />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span>Status</span>
          <Select ariaLabel="Status" value={status} onChange={setStatus} options={REF_STATUSES} className="w-36" size="sm" />
        </div>
        <Link href="/reports/bills-outstanding" className="text-sm text-primary hover:underline">
          Trade bills outstanding →
        </Link>
      </div>
      {rows.length === 0 ? (
        <Card>
          <p className="p-6 py-10 text-center text-sm text-muted-foreground">No references. Add bill-wise allocations on journal-voucher lines to track them here.</p>
        </Card>
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}
    </div>
  );
}
