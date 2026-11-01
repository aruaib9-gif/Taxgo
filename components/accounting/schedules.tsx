"use client";

import { useState } from "react";
import { Play, Plus } from "lucide-react";
import { createRecord, deleteRecord, updateRecord, useCollection, type Rec } from "@/lib/store";
import { createJournal, isBalanced, totalsOf, useAccounts, type JournalLine } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { AccountPicker, Badge, DataTable, Dialog, Field, PageHeader, Select, btn, inputCls, longDate, money, num, today, type Column , DateInput } from "./kit";

/* ---------- date helpers ---------- */

const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

function addPeriod(iso: string, freq: string, n = 1) {
  const d = new Date(`${iso}T00:00:00Z`);
  if (freq === "Daily") d.setUTCDate(d.getUTCDate() + n);
  else if (freq === "Weekly") d.setUTCDate(d.getUTCDate() + 7 * n);
  else if (freq === "Quarterly") d.setUTCMonth(d.getUTCMonth() + 3 * n);
  else if (freq === "Yearly") d.setUTCFullYear(d.getUTCFullYear() + n);
  else d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}

/* ---------- recurring journals ---------- */

const TEMPLATE_TYPES = [
  { value: "STANDARD", label: "Standard (posts and stays)" },
  { value: "REVERSING", label: "Accrual / cut-off (auto-reverses)" },
];

export function RecurringJournals() {
  const templates = useCollection("recurring-journals");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  // Generates every due run up to today, then advances each template's next run date.
  function runDue() {
    const now = today();
    let made = 0;
    for (const t of templates) {
      if (t.status !== "ACTIVE") continue;
      let next = String(t.nextRun);
      let generated = num(t.generated);
      const end = String(t.endDate ?? "");
      while (next <= now && (!end || next <= end)) {
        const lines = (t.lines as JournalLine[]) ?? [];
        const status = t.postImmediately ? "POSTED" : "DRAFT";
        createJournal({ date: next, description: String(t.narration || t.name), lines, status, source: "Recurring" });
        if (t.templateType === "REVERSING") {
          createJournal({
            date: addPeriod(next, "Daily"),
            description: `Auto-reversal — ${t.narration || t.name}`,
            lines: lines.map((l) => ({ ...l, debit: l.credit, credit: l.debit })),
            status,
            source: "Recurring",
          });
        }
        generated++;
        made++;
        next = addPeriod(next, String(t.frequency));
      }
      updateRecord("recurring-journals", t.id, { nextRun: next, generated, status: end && next > end ? "ENDED" : "ACTIVE" });
    }
    setNotice(made ? `Generated ${made} journal entr${made === 1 ? "y" : "ies"}.` : "Nothing was due.");
  }

  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (t) => <span className="font-medium">{String(t.name)}</span> },
    { key: "freq", header: "Frequency", cell: (t) => String(t.frequency) },
    { key: "status", header: "Status", cell: (t) => <Badge tone={t.status === "ACTIVE" ? "success" : "muted"}>{String(t.status)}</Badge> },
    { key: "amount", header: "Amount", cell: (t) => money(totalsOf((t.lines as JournalLine[]) ?? []).debit) },
    { key: "next", header: "Next run", cell: (t) => (t.status === "ACTIVE" ? longDate(t.nextRun) : "-") },
    { key: "gen", header: "Generated", cell: (t) => num(t.generated) },
    { key: "rev", header: "Auto-reverse", cell: (t) => (t.templateType === "REVERSING" ? "Yes" : "No") },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recurring Journals"
        subtitle="Templates that post journal entries on a schedule — rent, salaries, accruals. Reversing templates auto-reverse each entry (Tally reversing journal)."
      />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={btn.primary}>
          <Plus /> New recurring journal
        </button>
        <button type="button" onClick={runDue} className={btn.outline}>
          <Play /> Run due templates now
        </button>
        {notice && <span className="text-sm text-muted-foreground">{notice}</span>}
      </div>
      <DataTable
        columns={columns}
        rows={templates}
        menu={(t) => [
          { label: t.status === "PAUSED" ? "Resume" : "Pause", onSelect: () => updateRecord("recurring-journals", t.id, { status: t.status === "PAUSED" ? "ACTIVE" : "PAUSED" }) },
          { label: "Delete", destructive: true, onSelect: () => confirm(`Delete "${t.name}"?`) && deleteRecord("recurring-journals", t.id) },
        ]}
      />
      {open && <RecurringDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

const blankLine = (): JournalLine => ({ accountId: "", memo: "", debit: 0, credit: 0 });

function RecurringDialog({ onClose }: { onClose: () => void }) {
  const accounts = useAccounts();
  const [name, setName] = useState("");
  const [narration, setNarration] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [firstRun, setFirstRun] = useState(today());
  const [endDate, setEndDate] = useState("");
  const [templateType, setTemplateType] = useState("STANDARD");
  const [postImmediately, setPostImmediately] = useState(false);
  const [lines, setLines] = useState<JournalLine[]>([blankLine(), blankLine()]);
  const t = totalsOf(lines);
  const valid = name.trim() && isBalanced(lines) && lines.every((l) => !(l.debit || l.credit) || l.accountId);
  const set = (i: number, patch: Partial<JournalLine>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  function create() {
    createRecord("recurring-journals", {
      name: name.trim(),
      narration: narration.trim(),
      frequency,
      nextRun: firstRun,
      endDate,
      templateType,
      postImmediately,
      lines: lines.filter((l) => l.accountId),
      status: "ACTIVE",
      generated: 0,
    });
    onClose();
  }

  return (
    <Dialog open onClose={onClose} title="New recurring journal" className="max-w-2xl">
      <div className="space-y-3">
        <Field label="Name" htmlFor="rj-name">
          <input id="rj-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly office rent accrual" className={inputCls} />
        </Field>
        <Field label={<>Narration <span className="font-normal text-muted-foreground">(used on generated entries)</span></>} htmlFor="rj-narr">
          <input id="rj-narr" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="Optional" className={inputCls} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Frequency" htmlFor="rj-freq">
            <Select id="rj-freq" value={frequency} onChange={setFrequency} options={FREQUENCIES} />
          </Field>
          <Field label="First run" htmlFor="rj-first">
            <DateInput id="rj-first" value={firstRun} onChange={(v) => setFirstRun(v)} />
          </Field>
          <Field label={<>End date <span className="font-normal text-muted-foreground">(optional)</span></>} htmlFor="rj-end">
            <DateInput id="rj-end" value={endDate} onChange={(v) => setEndDate(v)} />
          </Field>
          <Field label="Template type" htmlFor="rj-type">
            <Select id="rj-type" value={templateType} onChange={setTemplateType} options={TEMPLATE_TYPES} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={postImmediately} onChange={(e) => setPostImmediately(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
          Post generated entries immediately
        </label>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Lines</span>
            <span className={cn("text-xs", isBalanced(lines) ? "text-success" : "text-destructive")}>
              Dr {money(t.debit)} / Cr {money(t.credit)}
            </span>
          </div>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_5.5rem_5.5rem]">
              <div className="col-span-2 sm:col-span-1">
                <AccountPicker ariaLabel={`Line ${i + 1} account`} accounts={accounts} value={l.accountId} onChange={(id) => set(i, { accountId: id })} />
              </div>
              <input aria-label="Memo" value={l.memo ?? ""} onChange={(e) => set(i, { memo: e.target.value })} placeholder="Memo" className={cn(inputCls, "col-span-2 sm:col-span-1")} />
              <input aria-label="Debit" type="number" min="0" value={l.debit || ""} onChange={(e) => set(i, { debit: Number(e.target.value) || 0, credit: 0 })} placeholder="Debit" className={inputCls} />
              <input aria-label="Credit" type="number" min="0" value={l.credit || ""} onChange={(e) => set(i, { credit: Number(e.target.value) || 0, debit: 0 })} placeholder="Credit" className={inputCls} />
            </div>
          ))}
          <button type="button" onClick={() => setLines([...lines, blankLine()])} className={btn.smOutline}>
            <Plus /> Add line
          </button>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btn.outline}>
          Cancel
        </button>
        <button type="button" disabled={!valid} onClick={create} className={btn.primary}>
          Create template
        </button>
      </div>
    </Dialog>
  );
}

/* ---------- deferrals ---------- */

const KINDS = [
  { value: "PREPAID_EXPENSE", label: "Prepaid expense" },
  { value: "DEFERRED_REVENUE", label: "Deferred revenue" },
];

export function Deferrals() {
  const deferrals = useCollection("deferrals");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");

  // Posts one straight-line slice for every period whose date has arrived.
  function recogniseDue() {
    const now = today();
    let made = 0;
    for (const d of deferrals) {
      if (d.status !== "ACTIVE") continue;
      const periods = num(d.periods);
      const per = Math.round((num(d.total) / periods) * 1000) / 1000;
      let done = num(d.periodsDone);
      let recognised = num(d.recognised);
      while (done < periods) {
        const date = addPeriod(String(d.startDate), "Monthly", done);
        if (date > now) break;
        const amount = done === periods - 1 ? Math.round((num(d.total) - recognised) * 1000) / 1000 : per;
        const prepaid = d.kind === "PREPAID_EXPENSE";
        createJournal({
          date,
          description: `${d.name} — period ${done + 1} of ${periods}`,
          status: "POSTED",
          source: "Deferral",
          lines: prepaid
            ? [{ accountId: String(d.targetAccountId), debit: amount, credit: 0 }, { accountId: String(d.balanceAccountId), debit: 0, credit: amount }]
            : [{ accountId: String(d.balanceAccountId), debit: amount, credit: 0 }, { accountId: String(d.targetAccountId), debit: 0, credit: amount }],
        });
        done++;
        recognised += amount;
        made++;
      }
      updateRecord("deferrals", d.id, { periodsDone: done, recognised, status: done >= periods ? "COMPLETED" : "ACTIVE" });
    }
    setNotice(made ? `Recognised ${made} period(s).` : "Nothing was due.");
  }

  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (d) => <span className="font-medium">{String(d.name)}</span> },
    { key: "kind", header: "Kind", cell: (d) => KINDS.find((k) => k.value === d.kind)?.label ?? String(d.kind) },
    { key: "status", header: "Status", cell: (d) => <Badge tone={d.status === "ACTIVE" ? "success" : "muted"}>{String(d.status)}</Badge> },
    { key: "total", header: "Total", cell: (d) => money(num(d.total)) },
    { key: "rec", header: "Recognised", cell: (d) => `${money(num(d.recognised))} (${num(d.periodsDone)}/${num(d.periods)})` },
    { key: "start", header: "Starts", cell: (d) => longDate(d.startDate) },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Deferrals" subtitle="Deferred revenue and prepaid expenses recognised straight-line over monthly periods — each period posts its own journal entry." />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setOpen(true)} className={btn.primary}>
          <Plus /> New deferral
        </button>
        <button type="button" onClick={recogniseDue} className={btn.outline}>
          <Play /> Recognise due periods now
        </button>
        {notice && <span className="text-sm text-muted-foreground">{notice}</span>}
      </div>
      <DataTable columns={columns} rows={deferrals} menu={(d) => [{ label: "Delete", destructive: true, onSelect: () => confirm(`Delete "${d.name}"?`) && deleteRecord("deferrals", d.id) }]} />
      {open && <DeferralDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function DeferralDialog({ onClose }: { onClose: () => void }) {
  const accounts = useAccounts();
  const [kind, setKind] = useState("PREPAID_EXPENSE");
  const [name, setName] = useState("");
  const [balanceAccountId, setBalance] = useState("");
  const [targetAccountId, setTarget] = useState("");
  const [total, setTotal] = useState("");
  const [periods, setPeriods] = useState("12");
  const [startDate, setStart] = useState(today());
  const prepaid = kind === "PREPAID_EXPENSE";
  const valid = name.trim() && balanceAccountId && targetAccountId && num(total) > 0 && num(periods) >= 1;

  function create() {
    createRecord("deferrals", { kind, name: name.trim(), balanceAccountId, targetAccountId, total: num(total), periods: Math.floor(num(periods)), startDate, periodsDone: 0, recognised: 0, status: "ACTIVE" });
    onClose();
  }

  return (
    <Dialog open onClose={onClose} title="New deferral schedule" description={prepaid ? "Releases a Prepaid Expense balance into expense month by month." : "Releases a Deferred Revenue balance into income month by month."}>
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Kind" htmlFor="df-kind">
            <Select id="df-kind" value={kind} onChange={(v) => { setKind(v); setBalance(""); setTarget(""); }} options={KINDS} />
          </Field>
          <Field label="Name" htmlFor="df-name">
            <input id="df-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual insurance 2026" className={inputCls} />
          </Field>
        </div>
        <Field label={prepaid ? "Prepaid account (asset)" : "Deferred revenue account (liability)"}>
          <AccountPicker accounts={accounts} types={prepaid ? ["ASSET"] : ["LIABILITY"]} value={balanceAccountId} onChange={setBalance} />
        </Field>
        <Field label={prepaid ? "Expense account" : "Income account"}>
          <AccountPicker accounts={accounts} types={prepaid ? ["EXPENSE"] : ["REVENUE"]} value={targetAccountId} onChange={setTarget} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Total amount" htmlFor="df-total">
            <input id="df-total" type="number" min="0" step="0.01" value={total} onChange={(e) => setTotal(e.target.value)} placeholder="0.00" className={inputCls} />
          </Field>
          <Field label="Monthly periods" htmlFor="df-periods">
            <input id="df-periods" type="number" min="1" value={periods} onChange={(e) => setPeriods(e.target.value)} className={inputCls} />
          </Field>
          <Field label="First recognition" htmlFor="df-start">
            <DateInput id="df-start" value={startDate} onChange={(v) => setStart(v)} />
          </Field>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className={btn.outline}>
          Cancel
        </button>
        <button type="button" disabled={!valid} onClick={create} className={btn.primary}>
          Create schedule
        </button>
      </div>
    </Dialog>
  );
}
