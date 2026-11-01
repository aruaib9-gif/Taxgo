"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, Download, FileText, Plus, Sparkles, Trash2 } from "lucide-react";
import { useAssistant } from "@/components/assistant";
import { deleteRecord, type Rec } from "@/lib/store";
import { accountLabel, createJournal, isBalanced, linesOf, postJournal, reverseJournal, totalsOf, useAccounts, useFiscalPeriods, useJournals, type JournalLine } from "@/lib/ledger";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";
import { AccountPicker, Badge, Card, CardTitle, DataTable, Dialog, Field, PageHeader, SearchInput, Select, SidePanel, btn, downloadFile, inputCls, longDate, money, textareaCls, toCSV, toExcelHTML, today, type Column , DateInput } from "./kit";

const BASE = "/financial/journal-entries";
const STATUSES = ["DRAFT", "POSTED", "REVERSED"];

export const statusBadge = (s: unknown) =>
  s === "POSTED" ? <Badge tone="success">POSTED</Badge> : s === "REVERSED" ? <Badge tone="warning">REVERSED</Badge> : <Badge>{String(s ?? "DRAFT")}</Badge>;

export function JournalEntries() {
  const router = useRouter();
  const pathname = usePathname();
  const journals = useJournals();
  const accounts = useAccounts();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All Status");
  const [aiOpen, setAiOpen] = useState(false);

  const sub = pathname.slice(BASE.length).replace(/^\//, "");
  const close = () => router.push(BASE);
  const rows = useMemo(
    () =>
      [...journals]
        .sort((a, b) => String(b.date ?? "").localeCompare(String(a.date ?? "")) || String(b.createdAt).localeCompare(String(a.createdAt)))
        .filter((j) => (status === "All Status" || j.status === status) && (!q.trim() || `${j.number} ${j.description}`.toLowerCase().includes(q.trim().toLowerCase()))),
    [journals, q, status],
  );

  const exportRows = () => rows.map((j) => [String(j.number ?? ""), String(j.date ?? ""), String(j.description ?? ""), String(j.source ?? ""), String(j.status ?? ""), totalsOf(linesOf(j)).debit]);
  const headers = ["Number", "Date", "Description", "Source", "Status", "Amount"];

  const columns: Column<Rec>[] = [
    { key: "date", header: "Date", cell: (j) => longDate(j.date) },
    { key: "desc", header: "Description", cell: (j) => <span className="font-medium">{String(j.description ?? "")}</span> },
    { key: "source", header: "Source", cell: (j) => String(j.source ?? "Manual") },
    { key: "status", header: "Status", cell: (j) => statusBadge(j.status) },
    { key: "created", header: "Created", cell: (j) => longDate(String(j.createdAt ?? "").slice(0, 10)) },
  ];
  const detail = sub && sub !== "new" ? journals.find((j) => j.id === sub) : undefined;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Journal Entries"
        subtitle="View and manage journal entries"
        actions={
          <>
            <ExportMenu
              onCSV={() => downloadFile("journal-entries.csv", toCSV(headers, exportRows()), "text/csv")}
              onExcel={() => downloadFile("journal-entries.xls", toExcelHTML(headers, exportRows()), "application/vnd.ms-excel")}
            />
            <button type="button" onClick={() => setAiOpen(true)} className={btn.outline}>
              <Sparkles /> New with AI
            </button>
            <Link href={`${BASE}/new`} className={btn.primary}>
              <Plus /> New Entry
            </Link>
          </>
        }
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search entries..." />
        <Select ariaLabel="Status" value={status} onChange={setStatus} options={["All Status", ...STATUSES]} className="w-[150px]" size="sm" />
      </div>
      <DataTable columns={columns} rows={rows} onRowClick={(j) => router.push(`${BASE}/${j.id}`)} />

      <AiDraftDialog open={aiOpen} onClose={() => setAiOpen(false)} />
      {sub === "new" && (
        <SidePanel onClose={close}>
          <JournalForm onDone={close} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <JournalDetail key={detail.id} entry={detail} accounts={accounts} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function ExportMenu({ onCSV, onExcel }: { onCSV: () => void; onExcel: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const item = "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent [&_svg]:size-4";
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cn(btn.outline, "h-8 px-3 text-xs")}>
        <Download /> Export <ChevronDown />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md">
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); onCSV(); }}>
            <FileText /> Download CSV
          </button>
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); onExcel(); }}>
            <FileText /> Download Excel
          </button>
        </div>
      )}
    </div>
  );
}

// No AI service is wired in this build, so the description goes to the assistant panel.
function AiDraftDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { ask } = useAssistant();
  const [text, setText] = useState("");
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={<><Sparkles className="h-4 w-4 text-primary" /> Create journal entry with AI</>}
      description="Describe the transaction or attach a receipt/invoice. The entry is saved as a draft — nothing is posted without your review."
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder={'e.g. "received 2,500 cash from Acme against invoice", "bought office chairs for 1,200 paid by card"'}
        className={textareaCls}
      />
      <div className="flex items-center justify-between gap-2">
        <label className={cn(btn.smOutline, "cursor-pointer")}>
          <FileText /> Attach file
          <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" />
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={btn.outline}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!text.trim()}
            onClick={() => {
              ask(`Draft a journal entry: ${text}`);
              setText("");
              onClose();
            }}
            className={btn.primary}
          >
            <Sparkles /> Create draft
          </button>
        </div>
      </div>
    </Dialog>
  );
}

const emptyLine = (): JournalLine => ({ accountId: "", memo: "", debit: 0, credit: 0 });

export function LinesEditor({ lines, setLines, accounts }: { lines: JournalLine[]; setLines: (l: JournalLine[]) => void; accounts: Rec[] }) {
  const t = totalsOf(lines);
  const diff = t.debit - t.credit;
  const set = (i: number, patch: Partial<JournalLine>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));
  const amount = (v: string) => Math.max(0, Number(v) || 0);
  return (
    <div className="space-y-2">
      <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,2fr)_6rem_6rem_2rem] gap-2 px-1 text-sm font-medium text-muted-foreground sm:grid">
        <span>
          Account <span className="text-destructive">*</span>
        </span>
        <span>Memo</span>
        <span>Debit</span>
        <span>Credit</span>
      </div>
      {lines.map((l, i) => (
        <div key={i} className="grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_6rem_6rem_2rem]">
          <div className="col-span-2 sm:col-span-1">
            <AccountPicker ariaLabel={`Line ${i + 1} account`} accounts={accounts} value={l.accountId} onChange={(id) => set(i, { accountId: id })} />
          </div>
          <input aria-label={`Line ${i + 1} memo`} value={l.memo ?? ""} onChange={(e) => set(i, { memo: e.target.value })} placeholder="Memo" className={cn(inputCls, "col-span-2 sm:col-span-1")} />
          <input aria-label={`Line ${i + 1} debit`} type="number" min="0" step="0.01" value={l.debit || ""} onChange={(e) => set(i, { debit: amount(e.target.value), credit: amount(e.target.value) ? 0 : l.credit })} placeholder="0.00" className={inputCls} />
          <input aria-label={`Line ${i + 1} credit`} type="number" min="0" step="0.01" value={l.credit || ""} onChange={(e) => set(i, { credit: amount(e.target.value), debit: amount(e.target.value) ? 0 : l.debit })} placeholder="0.00" className={inputCls} />
          <button type="button" aria-label="Remove line" disabled={lines.length <= 2} onClick={() => setLines(lines.filter((_, k) => k !== i))} className={cn(btn.icon, "hidden sm:inline-flex")}>
            <Trash2 />
          </button>
        </div>
      ))}
      <div className="flex items-center justify-between rounded-md bg-muted/60 px-2 py-1.5 text-sm">
        <button type="button" onClick={() => setLines([...lines, emptyLine()])} className={btn.smOutline}>
          <Plus /> Add Line
        </button>
        <div className="flex gap-6 font-semibold tabular-nums">
          <span>Total</span>
          <span>{money(t.debit)}</span>
          <span>{money(t.credit)}</span>
        </div>
      </div>
      <p className={cn("text-right text-sm font-medium", Math.abs(diff) < 0.0005 && t.debit > 0 ? "text-success" : "text-destructive")}>Difference: {money(Math.abs(diff))}</p>
    </div>
  );
}

function JournalForm({ onDone }: { onDone: () => void }) {
  const { ask } = useAssistant();
  const accounts = useAccounts();
  const periods = useFiscalPeriods();
  const [ai, setAi] = useState("");
  const [date, setDate] = useState(today());
  const [periodId, setPeriodId] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState("");
  const valid = description.trim() && isBalanced(lines) && lines.every((l) => !(l.debit || l.credit) || l.accountId);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const period = periods.find((p) => p.id === periodId);
    if (period?.isLocked) return setError(`${period.name} is closed. Reopen it or pick another period.`);
    createJournal({ date, description: description.trim(), lines, fiscalPeriodId: periodId || undefined });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Journal Entry</h1>
      <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <p className="flex items-center gap-1.5 text-sm">
          <Sparkles className="h-4 w-4 text-primary" /> <b className="font-semibold">Fill with AI</b>
          <span className="text-muted-foreground">— describe the transaction or attach a receipt/invoice</span>
        </p>
        <textarea value={ai} onChange={(e) => setAi(e.target.value)} rows={2} placeholder={'e.g. "paid office rent 5,000 by bank transfer" or "sold goods to Acme for 12,000 on credit"'} className={cn(textareaCls, "bg-background")} />
        <div className="flex gap-2">
          <button type="button" disabled={!ai.trim()} onClick={() => ask(`Suggest a journal entry for: ${ai}`)} className={btn.smPrimary}>
            <Sparkles /> Suggest entry
          </button>
          <label className={cn(btn.smOutline, "cursor-pointer")}>
            <FileText /> Attach receipt/invoice
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" />
          </label>
        </div>
      </div>
      <Card>
        <div className="space-y-4 p-6">
          <CardTitle>Entry Details</CardTitle>
          <div className="grid gap-4 sm:grid-cols-[12rem_12rem]">
            <Field label="Entry Date" htmlFor="je-date">
              <DateInput id="je-date" value={date} onChange={(v) => setDate(v)} />
            </Field>
            <Field label="Fiscal Period" htmlFor="je-period">
              <Select id="je-period" value={periodId} onChange={setPeriodId} placeholder="Select period..." options={periods.map((p) => ({ value: p.id, label: String(p.name) }))} />
            </Field>
          </div>
          <Field label={<>Description <span className="text-destructive">*</span></>} htmlFor="je-desc">
            <textarea id="je-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description of this journal entry" className={textareaCls} />
          </Field>
        </div>
      </Card>
      <Card>
        <div className="space-y-4 p-6">
          <CardTitle>Lines</CardTitle>
          <LinesEditor lines={lines} setLines={setLines} accounts={accounts} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={!valid} className={btn.primary}>
              Create Entry
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

function JournalDetail({ entry, accounts, onDone }: { entry: Rec; accounts: Rec[]; onDone: () => void }) {
  const lines = linesOf(entry);
  const t = totalsOf(lines);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Journal Entry {String(entry.number ?? "")}</h1>
          <p className="mt-1 text-muted-foreground">
            {longDate(entry.date)} · {String(entry.source ?? "Manual")}
          </p>
        </div>
        {statusBadge(entry.status)}
      </div>
      <Card>
        <div className="space-y-3 p-6">
          <CardTitle>Description</CardTitle>
          <p className="text-sm">{String(entry.description ?? "")}</p>
        </div>
      </Card>
      <Card>
        <div className="p-6">
          <CardTitle className="mb-3">Lines</CardTitle>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="py-2 font-medium">Account</th>
                <th className="py-2 font-medium">Memo</th>
                <th className="py-2 text-right font-medium">Debit</th>
                <th className="py-2 text-right font-medium">Credit</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2">{accountLabel(accounts, l.accountId)}</td>
                  <td className="py-2 text-muted-foreground">{l.memo}</td>
                  <td className="py-2 text-right tabular-nums">{l.debit ? money(l.debit) : ""}</td>
                  <td className="py-2 text-right tabular-nums">{l.credit ? money(l.credit) : ""}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="py-2" colSpan={2}>
                  Total
                </td>
                <td className="py-2 text-right tabular-nums">{money(t.debit)}</td>
                <td className="py-2 text-right tabular-nums">{money(t.credit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
      <div className="flex flex-wrap gap-2">
        {entry.status === "DRAFT" && (
          <>
            <button type="button" disabled={!isBalanced(lines)} onClick={() => { postJournal(entry.id); onDone(); }} className={btn.primary}>
              Post Entry
            </button>
            <button type="button" onClick={() => { if (confirm("Delete this draft?")) { deleteRecord("journal-entries", entry.id); onDone(); } }} className={cn(btn.outline, "text-destructive")}>
              Delete Draft
            </button>
          </>
        )}
        {entry.status === "POSTED" && (
          <button type="button" onClick={() => { if (confirm("Post a reversing entry dated today?")) { reverseJournal(entry, today()); onDone(); } }} className={btn.outline}>
            Reverse Entry
          </button>
        )}
        <button type="button" onClick={onDone} className={btn.outline}>
          Close
        </button>
      </div>
    </div>
  );
}
