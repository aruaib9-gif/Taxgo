"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Download, Eye, EyeOff, Play, Plus, Printer } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { addInterval, docTotals, type DiscountType } from "@/lib/sales";
import { billOpen, billOutstanding, billOverdue, billStatus, createBill, issueDebitNote, payVendor, poProgress, type BillLine, type GrnLine, type PoLine } from "@/lib/purchases";
import { useAccounts, useBankAccounts, useTaxRates } from "@/lib/ledger";
import { cn } from "@/lib/utils";
import { Card, DataTable, DateInput, Dialog, Field, PageHeader, Select, SidePanel, StatCard, btn, downloadFile, inputCls, longDate, money, num, toCSV, today, type Column } from "@/components/accounting/kit";
import { DISCOUNT_TYPES, LineItems, NumberBanner, Opt, Req, Section, StatusBadge, ToggleRow, blankLine, validLines } from "@/components/sales/doc-kit";
import { CURRENCIES, FREQUENCIES } from "@/components/sales/invoices";
import { CountedTextarea, EmptyCard, ListToolbar, StatusFilter, VendorPicker, WarehousePicker, plusDays, subOf } from "./kit";
import { useCompanyName } from "@/lib/companies";

const byDateDesc = (a: Rec, b: Rec) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt));
const textMatch = (q: string, ...vals: unknown[]) => !q.trim() || vals.join(" ").toLowerCase().includes(q.trim().toLowerCase());
const vendorTerms = (vendor: string) => readCollection("vendors").find((v) => v.name === vendor)?.terms;

/* ---------- bills ---------- */

const BILL_BASE = "/ap/bills";
const BILL_STATUSES = ["DRAFT", "APPROVED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];

export function Bills() {
  const router = useRouter();
  const sub = subOf(usePathname(), BILL_BASE);
  const bills = useCollection("bills");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const now = today();
  const close = () => router.push(BILL_BASE);
  const view = (b: Rec) => (billOverdue(b, now) ? "OVERDUE" : billStatus(b));
  const columns: Column<Rec>[] = [
    { key: "num", header: "Bill #", cell: (b) => <span className="font-mono text-sm">{String(b.billNo || b.number)}</span> },
    { key: "v", header: "Vendor", cell: (b) => <span className="font-medium">{String(b.vendor)}</span> },
    { key: "date", header: "Date", cell: (b) => longDate(b.date) },
    { key: "due", header: "Due Date", cell: (b) => longDate(b.dueDate) },
    { key: "total", header: "Total", cell: (b) => money(num(b.total)) },
    { key: "out", header: "Outstanding", cell: (b) => money(Math.max(0, billOutstanding(b))) },
    { key: "s", header: "Status", cell: (b) => <StatusBadge status={view(b)} /> },
  ];
  const detail = sub && sub !== "new" ? bills.find((b) => b.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Bills" subtitle="Manage vendor bills" actions={<Link href={`${BILL_BASE}/new`} className={btn.primary}><Plus /> New Bill</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search bills..."><StatusFilter value={status} onChange={setStatus} statuses={BILL_STATUSES} all="All Status" /></ListToolbar>
      <DataTable columns={columns} rows={bills.filter((b) => (!status || view(b) === status) && textMatch(q, b.number, b.billNo, b.vendor, b.reference)).sort(byDateDesc)} onRowClick={(b) => router.push(`${BILL_BASE}/${b.id}`)} />
      {sub === "new" && <SidePanel onClose={close}><BillForm onDone={close} onCreated={(id) => router.push(`${BILL_BASE}/${id}`)} /></SidePanel>}
      {detail && <SidePanel onClose={close}><BillView key={detail.id} bill={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

function BillForm({ onDone, onCreated }: { onDone: () => void; onCreated: (id: string) => void }) {
  const accounts = useAccounts();
  const taxRates = useTaxRates();
  const pos = useCollection("purchase-orders");
  const grns = useCollection("grns");
  const search = useSearchParams();
  const [preset] = useState(() => ({ vendor: search.get("vendor") ?? "", po: search.get("po") ?? "", grn: search.get("grn") ?? "" }));
  const [preview] = useState(() => nextNumber("bills", "BILL"));
  const [showPreview, setShowPreview] = useState(false);
  const [poId, setPoId] = useState("");
  const [grnId, setGrnId] = useState("");
  const [vendor, setVendor] = useState(preset.vendor);
  const [billNo, setBillNo] = useState("");
  const [reference, setReference] = useState("");
  const [warehouseId, setWarehouse] = useState("");
  const [date, setDate] = useState(today());
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState(() => plusDays(today(), num(vendorTerms(preset.vendor) ?? 30)));
  const [more, setMore] = useState(false);
  const [currency, setCurrency] = useState("USD");
  const [shipping, setShipping] = useState("0");
  const [discountType, setDiscountType] = useState<DiscountType>("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<BillLine[]>([blankLine()]);
  const [showAccount, setShowAccount] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("Monthly");
  const [error, setError] = useState("");
  const t = docTotals(lines, { discountType, discountValue: num(discountValue), shipping: num(shipping) });
  const openPos = pos.filter((p) => !["DRAFT", "CANCELLED", "CLOSED", "FULLY_BILLED"].includes(String(p.status)) && poProgress(p).billing !== "Billed");
  const openGrns = grns.filter((g) => g.status === "POSTED" && !g.billId);

  function pickVendor(v: string) {
    setVendor(v);
    setDueDate(plusDays(date, num(vendorTerms(v) ?? 30)));
  }
  function fromPo(id: string) {
    setPoId(id);
    setGrnId("");
    const po = pos.find((p) => p.id === id);
    if (!po) return;
    pickVendor(String(po.vendor));
    if (po.warehouseId) setWarehouse(String(po.warehouseId));
    setLines(((po.lines as PoLine[]) ?? []).map((l) => ({ productId: l.productId, description: l.description || "", qty: l.qty, uom: l.uom, unitPrice: l.unitPrice })));
  }
  function fromGrn(id: string) {
    setGrnId(id);
    setPoId("");
    const g = grns.find((x) => x.id === id);
    if (!g) return;
    if (g.vendor) pickVendor(String(g.vendor));
    setWarehouse(String(g.warehouseId ?? ""));
    if (g.poId) setPoId(String(g.poId));
    const products = readCollection("products");
    setLines(((g.lines as GrnLine[]) ?? []).map((l) => ({ productId: l.productId, description: String(products.find((p) => p.id === l.productId)?.name ?? ""), qty: l.accepted, uom: l.uom, unitPrice: Math.round((l.unitCost / (1 + num(l.taxPct) / 100)) * 1000) / 1000, taxPct: num(l.taxPct) })));
  }

  // Deep links: /ap/bills/new?po=… or ?grn=…
  useEffect(() => {
    const t = setTimeout(() => { if (preset.grn) fromGrn(preset.grn); else if (preset.po) fromPo(preset.po); }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once with the initial query
  }, []);

  function submit() {
    const ls = validLines(lines);
    if (!vendor) return setError("Vendor is required.");
    if (!ls.length) return setError("Add at least one line item.");
    if (!dueDate || dueDate < date) return setError("Due date must be on or after the bill date.");
    const bill = createBill({ vendor, billNo, reference, warehouseId, date, invoiceDate, dueDate, currency, shipping: num(shipping), discountType, discountValue: num(discountValue), notes, lines: ls, poId, grnId });
    if (recurring)
      createRecord("recurring-bills", { name: `${vendor} — ${frequency}`, vendor, frequency, startDate: date, nextDate: addInterval(date, frequency), paymentTerms: num(vendorTerms(vendor) ?? 30), shipping: num(shipping), discountType, discountValue: num(discountValue), lines: ls, generated: 1, status: "ACTIVE", reference: bill.number });
    onCreated(bill.id);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") { e.preventDefault(); document.getElementById("bill-submit")?.click(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Bill</h1>
          <p className="mt-1 text-muted-foreground">Fill in the form. Toggle the live preview whenever you want it.</p>
        </div>
        <button type="button" onClick={() => setShowPreview((v) => !v)} className={cn(btn.smOutline, "rounded-full")}>{showPreview ? <EyeOff /> : <Eye />} {showPreview ? "Hide preview" : "Show preview"}</button>
      </div>
      {showPreview && <BillPaper number={billNo || preview} vendor={vendor || "—"} date={date} dueDate={dueDate} lines={validLines(lines)} totals={t} />}
      <Section title="Bill Details">
        <NumberBanner label="Bill #" value={preview} />
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-semibold">Bill against</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={<>Purchase Order<Opt /></>}><Select ariaLabel="Purchase order" value={poId} onChange={fromPo} placeholder="None — standalone bill" options={openPos.map((p) => ({ value: p.id, label: `${p.number} — ${p.vendor}` }))} /></Field>
            <Field label="Goods Receipt"><Select ariaLabel="Goods receipt" value={grnId} onChange={fromGrn} disabled={!openGrns.length} placeholder={openGrns.length ? "None" : "No approved receipts"} options={openGrns.map((g) => ({ value: g.id, label: `${g.number}${g.vendor ? ` — ${g.vendor}` : ""}` }))} /></Field>
          </div>
          <p className="text-xs text-muted-foreground">Optional. Bill an order, or a receipt on its own — leave both for a plain bill.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Vendor<Req /></>}><VendorPicker value={vendor} onChange={pickVendor} /></Field>
          <Field label={<>Bill No<Opt /></>} htmlFor="b-no" hint="Leave blank to number it automatically, or type the supplier's invoice number."><input id="b-no" value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder={preview} className={inputCls} /></Field>
          <Field label={<>Reference<Opt /></>} htmlFor="b-ref"><input id="b-ref" value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} /></Field>
          <Field label="Warehouse"><WarehousePicker value={warehouseId} onChange={setWarehouse} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>Bill Date<Req /></>}><DateInput value={date} onChange={(v) => { setDate(v); setDueDate(plusDays(v, num(vendorTerms(vendor) ?? 30))); }} /></Field>
          <Field label={<>Invoice Date<Opt /></>} hint="The date on the supplier's invoice, if it differs from the bill date. Printed in the purchase register; leave blank when they are the same."><DateInput value={invoiceDate} onChange={setInvoiceDate} /></Field>
          <Field label={<>Due Date<Req /></>}><DateInput value={dueDate} onChange={setDueDate} /></Field>
        </div>
        <div className="rounded-lg border border-border">
          <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium">
            More options <ChevronDown className={cn("h-4 w-4 transition-transform", more && "rotate-180")} />
          </button>
          {more && (
            <div className="grid gap-4 border-t border-border p-3 sm:grid-cols-2">
              <Field label={<>Currency<Opt /></>}><Select value={currency} onChange={setCurrency} options={CURRENCIES} /></Field>
              <Field label={<>Shipping Charges<Opt /></>} htmlFor="b-ship"><input id="b-ship" type="number" min="0" value={shipping} onChange={(e) => setShipping(e.target.value)} className={inputCls} /></Field>
              <Field label={<>Bill Discount<Opt /></>}><Select value={discountType} onChange={(v) => setDiscountType(v as DiscountType)} options={DISCOUNT_TYPES} /></Field>
              {discountType !== "NONE" && <Field label="Discount value" htmlFor="b-disc"><input id="b-disc" type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className={inputCls} /></Field>}
              <Field label={<>Notes<Opt /></>} className="sm:col-span-2"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} /></Field>
            </div>
          )}
        </div>
      </Section>
      <Section title="Line Items" action={<ToggleRow label="Show expense account" checked={showAccount} onChange={setShowAccount} />}>
        <LineItems lines={lines} setLines={setLines} cols={{ disc: true, tax: true, accounts: showAccount ? accounts : undefined }} taxRates={taxRates} />
        {grnId && <p className="text-xs text-muted-foreground">Billed against a goods receipt: the cost clears 2050 Goods Received Not Invoiced instead of hitting inventory again.</p>}
      </Section>
      <Card>
        <div className="space-y-3 p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 accent-primary" /> Make this a recurring bill
          </label>
          {recurring && <Field label="Frequency" className="w-48"><Select value={frequency} onChange={setFrequency} options={FREQUENCIES} /></Field>}
        </div>
      </Card>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/90 px-4 py-2.5 backdrop-blur">
        {([["Subtotal", t.subtotal], ["Tax", t.tax]] as const).map(([k, v]) => (
          <div key={k} className="border-r border-border pr-4"><p className="text-xs text-muted-foreground">{k}</p><p className="font-semibold tabular-nums">{money(v)}</p></div>
        ))}
        <div><p className="text-xs font-medium">Total</p><p className="text-lg font-bold tabular-nums">{money(t.total)}</p></div>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">⌘S / Ctrl+S to save</span>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        <button id="bill-submit" type="submit" className={btn.primary}>Create Bill</button>
      </div>
    </form>
  );
}

function BillPaper({ number, vendor, date, dueDate, lines, totals }: { number: string; vendor: string; date: string; dueDate: string; lines: BillLine[]; totals: ReturnType<typeof docTotals> }) {
  const companyName = useCompanyName();
  return (
    <div className="rounded-xl border border-border bg-white p-8 text-sm text-neutral-900 shadow-sm">
      <div className="flex items-start justify-between">
        <div><p className="text-xs uppercase text-neutral-500">From</p><p className="text-lg font-bold">{vendor}</p></div>
        <div className="text-right"><p className="text-2xl font-semibold tracking-tight">BILL</p><p className="font-mono">{number}</p></div>
      </div>
      <div className="mt-4 flex justify-between text-xs"><p>To: {companyName}</p><p>Date {longDate(date)} · Due {longDate(dueDate)}</p></div>
      <table className="mt-4 w-full">
        <thead><tr className="border-b border-neutral-300 text-left text-xs uppercase text-neutral-500"><th className="py-1.5">Item</th><th className="py-1.5 text-right">Qty</th><th className="py-1.5 text-right">Price</th><th className="py-1.5 text-right">Amount</th></tr></thead>
        <tbody>
          {lines.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-neutral-400">Line items appear here.</td></tr>}
          {lines.map((l, i) => <tr key={i} className="border-b border-neutral-100"><td className="py-1.5">{l.description || "—"}</td><td className="py-1.5 text-right">{l.qty} {l.uom}</td><td className="py-1.5 text-right">{money(l.unitPrice)}</td><td className="py-1.5 text-right">{money(l.qty * l.unitPrice * (1 - num(l.discPct) / 100))}</td></tr>)}
        </tbody>
      </table>
      <div className="ml-auto mt-4 w-56 space-y-1 text-xs">
        <p className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></p>
        {totals.discount > 0 && <p className="flex justify-between"><span>Discount</span><span>-{money(totals.discount)}</span></p>}
        <p className="flex justify-between"><span>Tax</span><span>{money(totals.tax)}</span></p>
        {totals.shipping > 0 && <p className="flex justify-between"><span>Shipping</span><span>{money(totals.shipping)}</span></p>}
        <p className="flex justify-between border-t border-neutral-300 pt-1 text-sm font-semibold"><span>Total</span><span>{money(totals.total)}</span></p>
      </div>
    </div>
  );
}

function BillView({ bill, onClose }: { bill: Rec; onClose: () => void }) {
  const lines = (bill.lines as BillLine[]) ?? [];
  const t = docTotals(lines, { discountType: bill.discountType as DiscountType, discountValue: num(bill.discountValue), shipping: num(bill.shipping) });
  const due = Math.max(0, billOutstanding(bill));
  const st = billOverdue(bill, today()) ? "OVERDUE" : billStatus(bill);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bill {String(bill.billNo || bill.number)}</h1>
          <p className="mt-1 text-muted-foreground">{String(bill.vendor)}{bill.invoiceDate ? ` · supplier invoice ${longDate(bill.invoiceDate)}` : ""}</p>
        </div>
        <StatusBadge status={st} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={money(num(bill.total))} />
        <StatCard label="Paid / debited" value={money(num(bill.amountPaid) + num(bill.debited))} />
        <StatCard label="Outstanding" value={money(due)} tone={due > 0 ? "destructive" : "success"} />
      </div>
      <BillPaper number={String(bill.billNo || bill.number)} vendor={String(bill.vendor)} date={String(bill.date)} dueDate={String(bill.dueDate)} lines={lines} totals={t} />
      <div className="flex flex-wrap gap-2">
        {due > 0 && <Link href={`/ap/payments/new?vendor=${encodeURIComponent(String(bill.vendor))}&amount=${due}`} className={btn.primary}>Record Payment</Link>}
        {due > 0 && <Link href={`/ap/debit-notes/new?bill=${bill.id}`} className={btn.outline}>Issue Debit Note</Link>}
        <button type="button" className={btn.outline} onClick={() => window.print()}><Printer /> Print</button>
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- recurring bills ---------- */

const RB_BASE = "/ap/recurring-bills";
const RB_STATUSES = ["ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"];

function runRecurringBill(r: Rec, now: string) {
  let next = String(r.nextDate);
  let count = num(r.generated);
  let made = 0;
  const max = num(r.maxOccurrences);
  while (r.status === "ACTIVE" && next <= now && (!r.endDate || next <= String(r.endDate)) && (!max || count < max)) {
    createBill({ vendor: String(r.vendor), date: next, dueDate: plusDays(next, num(r.paymentTerms)), lines: (r.lines as BillLine[]) ?? [], reference: String(r.reference ?? ""), notes: String(r.notes ?? ""), shipping: num(r.shipping), discountType: r.discountType, discountValue: num(r.discountValue), recurringId: r.id });
    count++;
    made++;
    next = addInterval(next, String(r.frequency));
  }
  const done = (!!r.endDate && next > String(r.endDate)) || (!!max && count >= max);
  updateRecord("recurring-bills", r.id, { nextDate: next, generated: count, status: done ? "COMPLETED" : r.status });
  return made;
}

export function RecurringBills() {
  const router = useRouter();
  const sub = subOf(usePathname(), RB_BASE);
  const schedules = useCollection("recurring-bills");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [notice, setNotice] = useState("");
  const close = () => router.push(RB_BASE);
  const rows = schedules.filter((r) => (!status || r.status === status) && textMatch(q, r.name));
  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{String(r.name)}</span> },
    { key: "v", header: "Vendor", cell: (r) => String(r.vendor) },
    { key: "f", header: "Frequency", cell: (r) => String(r.frequency) },
    { key: "n", header: "Next Bill", cell: (r) => (r.status === "ACTIVE" ? longDate(r.nextDate) : "—") },
    { key: "a", header: "Amount", cell: (r) => money(docTotals((r.lines as BillLine[]) ?? []).total) },
    { key: "g", header: "Generated", cell: (r) => num(r.generated) },
    { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Recurring Bills" subtitle="Automatically generate bills on a schedule" actions={<Link href={`${RB_BASE}/new`} className={btn.primary}><Plus /> New Recurring Bill</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by name..."><StatusFilter value={status} onChange={setStatus} statuses={RB_STATUSES} /></ListToolbar>
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      {rows.length === 0 ? (
        <EmptyCard>No recurring bills yet. Create one to automate your payables.</EmptyCard>
      ) : (
        <DataTable
          columns={columns}
          rows={rows}
          menu={(r) => [
            { label: "Generate due bills", onSelect: () => { const n = runRecurringBill(r, today()); setNotice(n ? `Generated ${n} bill(s) for ${r.name}.` : `${r.name} has nothing due yet (next ${longDate(r.nextDate)}).`); } },
            { label: r.status === "PAUSED" ? "Resume" : "Pause", onSelect: () => updateRecord("recurring-bills", r.id, { status: r.status === "PAUSED" ? "ACTIVE" : "PAUSED" }) },
            { label: "Cancel schedule", destructive: true, onSelect: () => confirm(`Cancel ${r.name}?`) && updateRecord("recurring-bills", r.id, { status: "CANCELLED" }) },
            { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${r.name}?`) && deleteRecord("recurring-bills", r.id) },
          ]}
        />
      )}
      {sub === "new" && <SidePanel onClose={close}><RecurringBillForm onDone={close} /></SidePanel>}
    </div>
  );
}

function RecurringBillForm({ onDone }: { onDone: () => void }) {
  const accounts = useAccounts();
  const taxRates = useTaxRates();
  const [f, setF] = useState({ name: "", vendor: "", frequency: "Monthly", startDate: today(), endDate: "", maxOccurrences: "", paymentTerms: "30", reference: "", shipping: "0", discountType: "NONE" as DiscountType, discountValue: "", notes: "" });
  const [lines, setLines] = useState<BillLine[]>([blankLine()]);
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ls = validLines(lines);
    if (!f.name.trim() || !f.vendor) return setError("Name and vendor are required.");
    if (!ls.length) return setError("Add at least one line item.");
    if (f.endDate && f.endDate < f.startDate) return setError("End date must be after the start date.");
    createRecord("recurring-bills", { ...f, name: f.name.trim(), nextDate: f.startDate, paymentTerms: num(f.paymentTerms), maxOccurrences: num(f.maxOccurrences), shipping: num(f.shipping), discountValue: num(f.discountValue), lines: ls, generated: 0, status: "ACTIVE" });
    onDone();
  }
  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Recurring Bill</h1>
      <Section title="Schedule Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="rb-name"><input id="rb-name" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Monthly Office Supplies" className={inputCls} /></Field>
          <Field label="Vendor"><VendorPicker value={f.vendor} onChange={(v) => set({ vendor: v, paymentTerms: String(vendorTerms(v) ?? f.paymentTerms) })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Frequency"><Select value={f.frequency} onChange={(v) => set({ frequency: v })} options={FREQUENCIES} /></Field>
          <Field label="Start Date"><DateInput value={f.startDate} onChange={(v) => set({ startDate: v })} /></Field>
          <Field label="End Date (Optional)"><DateInput value={f.endDate} onChange={(v) => set({ endDate: v })} /></Field>
          <Field label="Max Occurrences (Optional)" htmlFor="rb-max"><input id="rb-max" type="number" min="1" value={f.maxOccurrences} onChange={(e) => set({ maxOccurrences: e.target.value })} className={inputCls} /></Field>
          <Field label="Payment Terms (days)" htmlFor="rb-terms"><input id="rb-terms" type="number" min="0" value={f.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value })} className={inputCls} /></Field>
          <Field label="Reference" htmlFor="rb-ref"><input id="rb-ref" value={f.reference} onChange={(e) => set({ reference: e.target.value })} className={inputCls} /></Field>
          <Field label="Shipping Charges" htmlFor="rb-ship"><input id="rb-ship" type="number" min="0" value={f.shipping} onChange={(e) => set({ shipping: e.target.value })} className={inputCls} /></Field>
          <Field label="Bill Discount Type"><Select value={f.discountType} onChange={(v) => set({ discountType: v as DiscountType })} options={DISCOUNT_TYPES} /></Field>
          {f.discountType !== "NONE" && <Field label="Discount value" htmlFor="rb-disc"><input id="rb-disc" type="number" min="0" value={f.discountValue} onChange={(e) => set({ discountValue: e.target.value })} className={inputCls} /></Field>}
        </div>
        <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={f.notes} onChange={(v) => set({ notes: v })} /></Field>
      </Section>
      <Section title="Line Items Template">
        <LineItems lines={lines} setLines={setLines} cols={{ tax: true, accounts }} taxRates={taxRates} />
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Create Recurring Bill</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------- debit notes ---------- */

const DN_BASE = "/ap/debit-notes";
const DN_STATUSES = ["DRAFT", "ISSUED", "PARTIALLY_APPLIED", "APPLIED", "RECOVERED", "CANCELLED"];

export function DebitNotes() {
  const router = useRouter();
  const sub = subOf(usePathname(), DN_BASE);
  const notes = useCollection("debit-notes");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  if (sub === "new") return <DebitNoteForm onDone={() => router.push(DN_BASE)} />;
  const columns: Column<Rec>[] = [
    { key: "num", header: "Debit Note #", cell: (d) => <span className="font-mono text-sm">{String(d.number)}</span> },
    { key: "date", header: "Date", cell: (d) => longDate(d.date) },
    { key: "v", header: "Vendor", cell: (d) => <span className="font-medium">{String(d.vendor)}</span> },
    { key: "t", header: "Total", cell: (d) => money(num(d.total)) },
    { key: "a", header: "Applied", cell: (d) => money(num(d.applied)) },
    { key: "s", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Debit Notes" subtitle="Vendor debits — issue against purchase returns, over-billing or price differences, then apply to open bills" actions={<Link href={`${DN_BASE}/new`} className={btn.primary}><Plus /> New Debit Note</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by debit note #..."><StatusFilter value={status} onChange={setStatus} statuses={DN_STATUSES} /></ListToolbar>
      <DataTable
        columns={columns}
        rows={notes.filter((d) => (!status || d.status === status) && textMatch(q, d.number, d.vendor)).sort(byDateDesc)}
        menu={(d) => (["ISSUED", "PARTIALLY_APPLIED"].includes(String(d.status)) ? [{ label: "Mark refund received", onSelect: () => updateRecord("debit-notes", d.id, { status: "RECOVERED" }) }] : [])}
      />
    </div>
  );
}

type ReturnPick = { billId: string; index: number; qty: number };

function DebitNoteForm({ onDone }: { onDone: () => void }) {
  const bills = useCollection("bills");
  const search = useSearchParams();
  const [preset] = useState(() => ({ bill: readCollection("bills").find((b) => b.id === search.get("bill")), vendor: search.get("vendor") ?? "" }));
  const [preview] = useState(() => nextNumber("debit-notes", "DBN"));
  const [vendor, setVendor] = useState(String(preset.bill?.vendor ?? preset.vendor));
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState("");
  const [picked, setPicked] = useState<string[]>(preset.bill ? [preset.bill.id] : []);
  const [returns, setReturns] = useState<ReturnPick[]>([]);
  const [error, setError] = useState("");
  const candidates = bills.filter((b) => b.vendor === vendor && !["DRAFT", "CANCELLED"].includes(billStatus(b)));
  const qtyOf = (billId: string, index: number) => returns.find((r) => r.billId === billId && r.index === index)?.qty ?? 0;
  const setQty = (billId: string, index: number, qty: number) => setReturns((rs) => [...rs.filter((r) => !(r.billId === billId && r.index === index)), ...(qty > 0 ? [{ billId, index, qty }] : [])]);
  const debitLines: BillLine[] = useMemo(() => returns.flatMap((r) => { const l = ((bills.find((b) => b.id === r.billId)?.lines as BillLine[]) ?? [])[r.index]; return l ? [{ ...l, qty: r.qty }] : []; }), [returns, bills]);
  const t = docTotals(debitLines);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!vendor || !date) return setError("Vendor and date are required.");
    if (!debitLines.length) return setError("Enter a return quantity on at least one bill line.");
    issueDebitNote({ vendor, date, reason, lines: debitLines, billIds: [...new Set(returns.map((r) => r.billId))] });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHeader title="New Debit Note" subtitle="Return against a vendor's bill(s) — issue it to post the purchase return to the ledger" />
      <Section title="Details">
        <NumberBanner label="Debit note #" value={preview} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>Vendor<Req /></>}><VendorPicker value={vendor} onChange={(v) => { setVendor(v); setPicked([]); setReturns([]); }} /></Field>
          <Field label={<>Debit Note Date<Req /></>}><DateInput value={date} onChange={setDate} /></Field>
          <Field label={<>Reason<Opt /></>}><CountedTextarea ariaLabel="Reason" value={reason} onChange={setReason} placeholder="e.g. Damaged goods, price difference" rows={1} /></Field>
        </div>
      </Section>
      <Section title={<>Bills to return against <Req /></>}>
        {!vendor && <p className="text-sm text-muted-foreground">Select a vendor to choose which bill(s) this debit note returns against.</p>}
        {vendor && candidates.length === 0 && <p className="text-sm text-muted-foreground">{vendor} has no approved bills.</p>}
        {candidates.map((b) => {
          const on = picked.includes(b.id);
          return (
            <div key={b.id} className="rounded-lg border border-border">
              <label className="flex cursor-pointer items-center gap-2 p-3 text-sm">
                <input type="checkbox" checked={on} onChange={(e) => { setPicked(e.target.checked ? [...picked, b.id] : picked.filter((x) => x !== b.id)); if (!e.target.checked) setReturns(returns.filter((r) => r.billId !== b.id)); }} className="h-4 w-4 accent-primary" />
                <span className="font-mono">{String(b.billNo || b.number)}</span>
                <span className="text-muted-foreground">{longDate(b.date)} · {money(num(b.total))} · outstanding {money(Math.max(0, billOutstanding(b)))}</span>
              </label>
              {on && (
                <table className="w-full border-t border-border text-sm">
                  <thead><tr className="text-left text-muted-foreground"><th className="px-3 py-1.5 font-medium">Item</th><th className="px-3 py-1.5 text-right font-medium">Billed</th><th className="px-3 py-1.5 text-right font-medium">Price</th><th className="w-28 px-3 py-1.5 font-medium">Return qty</th></tr></thead>
                  <tbody>
                    {((b.lines as BillLine[]) ?? []).map((l, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="px-3 py-1.5">{l.description}</td><td className="px-3 py-1.5 text-right">{l.qty}</td><td className="px-3 py-1.5 text-right tabular-nums">{money(l.unitPrice)}</td>
                        <td className="px-3 py-1.5"><input aria-label={`Return quantity for ${l.description}`} type="number" min="0" max={l.qty} value={qtyOf(b.id, i) || ""} onChange={(e) => setQty(b.id, i, Math.min(l.qty, Math.max(0, Number(e.target.value) || 0)))} placeholder="0" className={cn(inputCls, "h-8 text-right")} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}
      </Section>
      {debitLines.length > 0 && <p className="text-right text-sm">Debit total <b className="ml-2 tabular-nums">{money(t.total)}</b> <span className="text-muted-foreground">(incl. {money(t.tax)} tax)</span></p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Issue Debit Note</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------- payment runs ---------- */

const RUN_BASE = "/ap/payment-runs";
const RUN_STATUSES = ["DRAFT", "EXECUTING", "EXECUTED", "PARTIAL", "CANCELLED"];

export function PaymentRuns() {
  const router = useRouter();
  const sub = subOf(usePathname(), RUN_BASE);
  const runs = useCollection("payment-runs");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const close = () => router.push(RUN_BASE);
  const rows = runs.filter((r) => (!status || r.status === status) && textMatch(q, r.number)).sort(byDateDesc);
  const columns: Column<Rec>[] = [
    { key: "num", header: "Run #", cell: (r) => <span className="font-mono text-sm">{String(r.number)}</span> },
    { key: "date", header: "Payment date", cell: (r) => longDate(r.date) },
    { key: "bills", header: "Bills", cell: (r) => ((r.billIds as string[]) ?? []).length },
    { key: "vendors", header: "Vendors", cell: (r) => num(r.vendorCount) },
    { key: "amt", header: "Amount", cell: (r) => money(num(r.total)) },
    { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];
  const detail = sub ? runs.find((r) => r.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Payment Runs" subtitle="Pay many vendors in one batch — select open bills, execute one payment per vendor, and export the bank upload file (SEPA / NACHA / CSV)." actions={<button type="button" onClick={() => setOpen(true)} className={btn.primary}><Plus /> New payment run</button>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by run #..."><StatusFilter value={status} onChange={setStatus} statuses={RUN_STATUSES} /></ListToolbar>
      {rows.length === 0 ? <EmptyCard>No payment runs yet.</EmptyCard> : <DataTable columns={columns} rows={rows} onRowClick={(r) => router.push(`${RUN_BASE}/${r.id}`)} />}
      {open && <RunDialog onClose={() => setOpen(false)} onCreated={(id) => router.push(`${RUN_BASE}/${id}`)} />}
      {detail && <SidePanel onClose={close}><RunView key={detail.id} run={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

function RunDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const bills = useCollection("bills");
  const banks = useBankAccounts();
  const [date, setDate] = useState(today());
  const [bankId, setBankId] = useState("");
  const open = bills.filter(billOpen).sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  const [picked, setPicked] = useState<string[]>([]);
  const total = open.filter((b) => picked.includes(b.id)).reduce((s, b) => s + billOutstanding(b), 0);
  function create() {
    const chosen = open.filter((b) => picked.includes(b.id));
    const run = createRecord("payment-runs", { number: nextNumber("payment-runs", "RUN"), date, bankAccountId: bankId, billIds: picked, total, vendorCount: new Set(chosen.map((b) => b.vendor)).size, status: "DRAFT" });
    onClose();
    onCreated(run.id);
  }
  return (
    <Dialog open onClose={onClose} title="New payment run" description="Every selected bill is paid in full; one payment per vendor." className="max-w-xl">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Payment date"><DateInput value={date} onChange={setDate} /></Field>
        <Field label={<>Paying bank account <span className="font-normal text-muted-foreground">(optional)</span></>}><Select value={bankId} onChange={setBankId} placeholder="Default cash/bank" options={banks.map((b) => ({ value: b.id, label: String(b.accountName) }))} /></Field>
      </div>
      <div className="max-h-72 overflow-y-auto rounded-md border border-border">
        {open.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted-foreground">No open bills to pay.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="w-8 p-2"><input type="checkbox" aria-label="Select all" checked={picked.length === open.length} onChange={(e) => setPicked(e.target.checked ? open.map((b) => b.id) : [])} className="accent-primary" /></th><th className="p-2 font-medium">Bill</th><th className="p-2 font-medium">Vendor</th><th className="p-2 font-medium">Due</th><th className="p-2 text-right font-medium">Outstanding</th></tr></thead>
            <tbody>
              {open.map((b) => (
                <tr key={b.id} className="border-b border-border/60">
                  <td className="p-2"><input type="checkbox" aria-label={`Pay ${b.number}`} checked={picked.includes(b.id)} onChange={(e) => setPicked(e.target.checked ? [...picked, b.id] : picked.filter((x) => x !== b.id))} className="accent-primary" /></td>
                  <td className="p-2 font-mono">{String(b.billNo || b.number)}</td><td className="p-2">{String(b.vendor)}</td><td className={cn("p-2", billOverdue(b, today()) && "text-destructive")}>{longDate(b.dueDate)}</td><td className="p-2 text-right tabular-nums">{money(billOutstanding(b))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm">{picked.length} bills · <b className="tabular-nums">{money(total)}</b></span>
        <button type="button" disabled={!picked.length} onClick={create} className={btn.primary}>Create run</button>
      </div>
    </Dialog>
  );
}

function RunView({ run, onClose }: { run: Rec; onClose: () => void }) {
  const bills = useCollection("bills");
  const banks = useBankAccounts();
  const vendors = useCollection("vendors");
  const chosen = bills.filter((b) => ((run.billIds as string[]) ?? []).includes(b.id));
  const byVendor = useMemo(() => {
    const m = new Map<string, Rec[]>();
    for (const b of chosen) m.set(String(b.vendor), [...(m.get(String(b.vendor)) ?? []), b]);
    return m;
  }, [chosen]);
  const bank = banks.find((b) => b.id === run.bankAccountId);

  // One payment per vendor; each pays that vendor's selected bills in full.
  function execute() {
    let paid = 0;
    let skipped = 0;
    const paymentIds: string[] = [];
    for (const [vendor, bs] of byVendor) {
      const open = bs.filter(billOpen);
      const amount = open.reduce((s, b) => s + billOutstanding(b), 0);
      if (amount <= 0) { skipped++; continue; }
      const p = payVendor({ vendor, date: String(run.date), amount, method: /cash/i.test(String(bank?.accountName ?? "")) ? "Cash" : "Bank Transfer", reference: String(run.number), billIds: open.map((b) => b.id), runId: run.id });
      paymentIds.push(p.id);
      paid++;
    }
    updateRecord("payment-runs", run.id, { status: skipped && paid ? "PARTIAL" : paid ? "EXECUTED" : "PARTIAL", paymentIds, executedAt: today() });
  }

  function exportFile() {
    const rows = [...byVendor].map(([vendor, bs]) => {
      const v = vendors.find((x) => x.name === vendor);
      return [vendor, String(v?.bankName ?? ""), String(v?.iban ?? ""), String(v?.swift ?? ""), String(v?.accountNumber ?? ""), String(v?.routing ?? ""), bs.reduce((s, b) => s + num(b.total) - num(b.debited), 0).toFixed(2), String(run.number), bs.map((b) => b.billNo || b.number).join(" ")];
    });
    downloadFile(`${run.number}-bank-file.csv`, toCSV(["Beneficiary", "Bank", "IBAN", "SWIFT/BIC", "Account number", "Routing/IFSC", "Amount", "Payment reference", "Bills"], rows), "text/csv");
  }

  const missingBank = [...byVendor.keys()].filter((v) => { const x = vendors.find((y) => y.name === v); return !x?.iban && !x?.accountNumber; });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Payment Run {String(run.number)}</h1>
          <p className="mt-1 text-muted-foreground">{longDate(run.date)} · {String(bank?.accountName ?? "Default cash/bank")}</p>
        </div>
        <StatusBadge status={run.status} />
      </div>
      <Section title={`${byVendor.size} vendor payment(s) · ${money(num(run.total))}`}>
        {[...byVendor].map(([vendor, bs]) => (
          <div key={vendor} className="rounded-md border border-border p-3 text-sm">
            <p className="font-medium">{vendor}</p>
            <ul className="mt-1 text-muted-foreground">{bs.map((b) => <li key={b.id} className="flex justify-between"><span>{String(b.billNo || b.number)} · due {longDate(b.dueDate)}</span><span className="tabular-nums">{billOpen(b) ? money(billOutstanding(b)) : <StatusBadge status={billStatus(b)} />}</span></li>)}</ul>
          </div>
        ))}
        {missingBank.length > 0 && <p className="text-xs text-warning">No bank details on file for {missingBank.join(", ")} — add them on the vendor before uploading the bank file.</p>}
      </Section>
      <div className="flex flex-wrap gap-2">
        {run.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => confirm(`Pay ${byVendor.size} vendor(s) ${money(num(run.total))}?`) && execute()}><Play /> Execute run</button>}
        <button type="button" className={btn.outline} onClick={exportFile}><Download /> Export bank file (CSV)</button>
        {run.status === "DRAFT" && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => updateRecord("payment-runs", run.id, { status: "CANCELLED" })}>Cancel run</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- AP payments ---------- */

const PAY_BASE = "/ap/payments";
const METHODS = ["Bank Transfer", "Cash", "Check", "Other"];

export function ApPayments() {
  const router = useRouter();
  const sub = subOf(usePathname(), PAY_BASE);
  const payments = useCollection("ap-payments");
  const [q, setQ] = useState("");
  const close = () => router.push(PAY_BASE);
  const columns: Column<Rec>[] = [
    { key: "num", header: "Payment #", cell: (p) => <span className="font-mono text-sm">{String(p.number ?? "—")}</span> },
    { key: "date", header: "Date", cell: (p) => longDate(p.date) },
    { key: "amt", header: "Amount", cell: (p) => money(num(p.amount)) },
    { key: "m", header: "Method", cell: (p) => String(p.method ?? "—") },
    { key: "ref", header: "Reference", cell: (p) => String(p.reference || "—") },
    { key: "l", header: "Ledger", cell: (p) => (p.journalId ? <Link href={`/financial/journal-entries/${p.journalId}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">Posted</Link> : "—") },
  ];
  const detail = sub && sub !== "new" ? payments.find((p) => p.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="AP Payments" subtitle="Vendor payment records" actions={<Link href={`${PAY_BASE}/new`} className={btn.primary}><Plus /> Record Payment</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by payment # or reference..." />
      <DataTable columns={columns} rows={payments.filter((p) => textMatch(q, p.number, p.reference, p.vendor)).sort(byDateDesc)} onRowClick={(p) => router.push(`${PAY_BASE}/${p.id}`)} />
      {sub === "new" && <SidePanel onClose={close}><VendorPaymentForm onDone={close} /></SidePanel>}
      {detail && (
        <SidePanel onClose={close}>
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">Payment {String(detail.number)}</h1>
            <Card>
              <dl className="grid gap-3 p-6 text-sm sm:grid-cols-2">
                {[["Vendor", detail.vendor], ["Date", longDate(detail.date)], ["Amount", money(num(detail.amount))], ["Method", detail.method], ["Reference", detail.reference || "—"], ["Unapplied (advance)", money(num(detail.unapplied))]].map(([k, v]) => (
                  <div key={String(k)}><dt className="text-muted-foreground">{String(k)}</dt><dd className="font-medium">{String(v)}</dd></div>
                ))}
              </dl>
            </Card>
            <Section title="Applied to bills">
              {((detail.allocations as { number: string; amount: number }[]) ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Held as an advance — no open bills at the time of payment.</p> : (
                <ul className="divide-y divide-border text-sm">{(detail.allocations as { number: string; amount: number }[]).map((a) => <li key={a.number} className="flex justify-between py-2"><span>{a.number}</span><span className="tabular-nums">{money(a.amount)}</span></li>)}</ul>
              )}
            </Section>
            <button type="button" className={btn.outline} onClick={close}>Close</button>
          </div>
        </SidePanel>
      )}
    </div>
  );
}

function VendorPaymentForm({ onDone }: { onDone: () => void }) {
  const bills = useCollection("bills");
  const [preview] = useState(() => nextNumber("ap-payments", "VPMT"));
  const search = useSearchParams();
  const [vendor, setVendor] = useState(() => search.get("vendor") ?? "");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState(() => search.get("amount") ?? "");
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const open = bills.filter((b) => b.vendor === vendor && billOpen(b));
  const owed = open.reduce((s, b) => s + billOutstanding(b), 0);
  const valid = vendor && num(amount) > 0 && date;
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (valid) { payVendor({ vendor, date, amount: num(amount), method, reference, notes }); onDone(); } }} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Record Payment</h1>
        <p className="mt-1 text-muted-foreground">Record a vendor payment</p>
      </div>
      <Section title="Payment Details">
        <NumberBanner label="Payment #" value={preview} />
        <Field label="Vendor"><VendorPicker value={vendor} onChange={setVendor} /></Field>
        {vendor && <p className="-mt-2 text-xs text-muted-foreground">{open.length} open bill(s) · {money(owed)} outstanding. Payments settle the oldest first; any extra is held as an advance.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment Date"><DateInput value={date} onChange={setDate} /></Field>
          <Field label="Amount" htmlFor="vp-amt"><input id="vp-amt" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></Field>
          <Field label="Method"><Select value={method} onChange={setMethod} options={METHODS} /></Field>
          <Field label="Reference" htmlFor="vp-ref"><input id="vp-ref" value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} /></Field>
        <div className="flex gap-2">
          <button type="submit" disabled={!valid} className={btn.primary}>Record Payment</button>
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        </div>
      </Section>
    </form>
  );
}

