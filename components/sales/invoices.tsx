"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Banknote, CreditCard, Eye, EyeOff, NotebookPen, Plus, Printer, RefreshCw } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { addInterval, createInvoice, docTotals, isOverdue, monthlyValue, outstanding, runRecurring, statusFor, type DiscountType, type DocLine } from "@/lib/sales";
import { useTaxRates } from "@/lib/ledger";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Card, CardTitle, DataTable, DateInput, Field, PageHeader, SearchInput, Select, SidePanel, StatCard, btn, inputCls, longDate, money, num, textareaCls, today, type Column } from "@/components/accounting/kit";
import { CustomerPicker, DISCOUNT_TYPES, LineItems, NumberBanner, Opt, Req, Section, StatusBadge, ToggleRow, blankLine, validLines } from "./doc-kit";

const subOf = (pathname: string, base: string) => pathname.slice(base.length).replace(/^\//, "");
const plusDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

const PAYMENT_MODES = [
  { value: "Cash", label: "Cash", hint: "Paid now in cash — customer optional", icon: Banknote },
  { value: "Credit", label: "Credit", hint: "On account — customer required", icon: NotebookPen },
  { value: "Bank / Card", label: "Bank / Card", hint: "Paid now by bank transfer or card — customer optional", icon: CreditCard },
];
export const CURRENCIES = [
  { value: "USD", label: "USD (Base Currency)" },
  { value: "AED", label: "AED - UAE Dirhams" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - Pound" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "SAR", label: "SAR - Saudi Riyal" },
];
const INVOICE_TEMPLATES = ["Standard — Invoice", "Aurora — Invoice", "Noir — Invoice", "Vertex — Invoice"];
const STATUS_FILTER = ["DRAFT", "UNPAID", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"];
const WALK_IN = "Walk-in Customer";

/* ---------- invoices ---------- */

const BASE = "/ar/invoices";

export function Invoices() {
  const router = useRouter();
  const sub = subOf(usePathname(), BASE);
  const invoices = useCollection("invoices");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const now = today();
  const close = () => router.push(BASE);

  // /ar/invoices?status=OVERDUE (from the dashboard tile) preselects the filter.
  const statusParam = useSearchParams().get("status");
  const [lastParam, setLastParam] = useState<string | null>(null);
  if (statusParam !== lastParam) {
    setLastParam(statusParam);
    if (statusParam) setStatus(statusParam.toUpperCase());
  }

  const view = (i: Rec) => (isOverdue(i, now) ? "OVERDUE" : statusFor(i));
  const rows = invoices
    .filter((i) => (!status || view(i) === status) && (!q.trim() || `${i.number} ${i.customer} ${i.reference ?? ""}`.toLowerCase().includes(q.trim().toLowerCase())))
    .sort((a, b) => String(b.date).localeCompare(String(a.date)) || String(b.createdAt).localeCompare(String(a.createdAt)));

  const columns: Column<Rec>[] = [
    { key: "num", header: "Invoice #", cell: (i) => <span className="font-mono text-sm">{String(i.number)}</span> },
    { key: "cust", header: "Customer", cell: (i) => <span className="font-medium">{String(i.customer)}</span> },
    { key: "date", header: "Date", cell: (i) => longDate(i.date) },
    { key: "due", header: "Due Date", cell: (i) => longDate(i.dueDate) },
    { key: "mode", header: "Payment Mode", cell: (i) => String(i.paymentMode ?? "Credit") },
    { key: "total", header: "Total", cell: (i) => money(num(i.total)) },
    { key: "out", header: "Outstanding", cell: (i) => money(Math.max(0, outstanding(i))) },
    { key: "status", header: "Status", cell: (i) => <StatusBadge status={view(i)} /> },
  ];
  const detail = sub && sub !== "new" ? invoices.find((i) => i.id === sub) : undefined;

  return (
    <div className="space-y-4">
      <PageHeader title="Invoices" subtitle="Manage customer invoices" actions={<Link href={`${BASE}/new`} className={btn.primary}><Plus /> New Invoice</Link>} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search invoices..." />
        <Select ariaLabel="Status" size="sm" value={status} onChange={setStatus} options={[{ value: "", label: "All Status" }, ...STATUS_FILTER]} className="w-[150px]" />
      </div>
      <DataTable columns={columns} rows={rows} onRowClick={(i) => router.push(`${BASE}/${i.id}`)} />
      {sub === "new" && (
        <SidePanel onClose={close}>
          <InvoiceForm onDone={close} onCreated={(id) => router.push(`${BASE}/${id}`)} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <InvoiceView key={detail.id} invoice={detail} onClose={close} />
        </SidePanel>
      )}
    </div>
  );
}

function InvoiceForm({ onDone, onCreated }: { onDone: () => void; onCreated: (id: string) => void }) {
  const taxRates = useTaxRates();
  const notesList = useCollection("delivery-notes");
  const search = useSearchParams();
  const [preset] = useState(() => search.get("customer") ?? "");
  const [preview] = useState(() => nextNumber("invoices", "INV"));
  const [showPreview, setShowPreview] = useState(false);
  const [mode, setMode] = useState("Credit");
  const [customer, setCustomer] = useState(preset);
  const [reference, setReference] = useState("");
  const [dnId, setDnId] = useState("");
  const [date, setDate] = useState(today());
  // Without customer terms the due date defaults to one calendar month out, as on the live platform.
  const [dueDate, setDueDate] = useState(() => {
    const terms = readCollection("customers").find((c) => c.name === preset)?.terms;
    return terms === undefined ? addInterval(today(), "Monthly") : plusDays(today(), num(terms));
  });
  const [currency, setCurrency] = useState("USD");
  const [salesperson, setSalesperson] = useState("");
  const [notes, setNotes] = useState("");
  const [template, setTemplate] = useState(INVOICE_TEMPLATES[0]);
  const [shipping, setShipping] = useState("0");
  const [discountType, setDiscountType] = useState<DiscountType>("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [lines, setLines] = useState<DocLine[]>([blankLine()]);
  const [incomeAccount, setIncomeAccount] = useState(false);
  const [makeDn, setMakeDn] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("Monthly");
  const [error, setError] = useState("");
  const t = docTotals(lines, { discountType, discountValue: num(discountValue), shipping: num(shipping) });
  const modeInfo = PAYMENT_MODES.find((m) => m.value === mode)!;
  const ModeIcon = modeInfo.icon;

  function pickCustomer(name: string) {
    setCustomer(name);
    const terms = num(readCollection("customers").find((c) => c.name === name)?.terms ?? 30);
    setDueDate(plusDays(date, terms));
  }

  function submit() {
    const ls = validLines(lines);
    if (mode === "Credit" && !customer) return setError("A customer is required for credit invoices.");
    if (!ls.length) return setError("Add at least one line item.");
    if (dueDate && dueDate < date) return setError("Due date can't be before the invoice date.");
    const inv = createInvoice({
      customer: customer || WALK_IN,
      date,
      dueDate: mode === "Credit" ? dueDate : date,
      paymentMode: mode,
      reference,
      deliveryNoteId: dnId,
      currency,
      salesperson: salesperson || BRAND.user.fullName,
      notes,
      template,
      shipping: num(shipping),
      discountType,
      discountValue: num(discountValue),
      lines: ls,
    });
    if (dnId) updateRecord("delivery-notes", dnId, { invoiceId: inv.id });
    if (makeDn) createRecord("delivery-notes", { number: nextNumber("delivery-notes", "DN"), date, customer: customer || WALK_IN, invoiceId: inv.id, lines: ls.filter((l) => l.productId).map((l) => ({ productId: l.productId, uom: l.uom ?? "", qty: l.qty, notes: "" })), status: "DRAFT" });
    if (recurring)
      createRecord("recurring-invoices", { name: `${customer || WALK_IN} — ${frequency}`, customer: customer || WALK_IN, frequency, startDate: date, nextDate: addInterval(date, frequency), paymentTerms: 30, shipping: num(shipping), discountType, discountValue: num(discountValue), lines: ls, generated: 1, status: "ACTIVE", reference: inv.number });
    onCreated(inv.id);
  }

  // ⌘S / Ctrl+S saves.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        document.getElementById("invoice-submit")?.click();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Invoice</h1>
          <p className="mt-1 text-muted-foreground">Fill in the form. Toggle the live preview whenever you want it.</p>
        </div>
        <button type="button" onClick={() => setShowPreview((v) => !v)} className={cn(btn.smOutline, "rounded-full")}>
          {showPreview ? <EyeOff /> : <Eye />} {showPreview ? "Hide preview" : "Show preview"}
        </button>
      </div>

      {showPreview && <InvoicePaper number={preview} customer={customer || WALK_IN} date={date} dueDate={dueDate} lines={validLines(lines)} totals={t} notes={notes} template={template} />}

      <Section title="Payment Mode">
        <div className="space-y-1.5">
          <div className="relative">
            <ModeIcon className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Select ariaLabel="Payment mode" value={mode} onChange={setMode} options={PAYMENT_MODES} className="[&_button]:pl-9" />
          </div>
          <p className="text-xs text-muted-foreground">{modeInfo.hint}</p>
        </div>
      </Section>

      <Section title="Invoice Details">
        <NumberBanner label="Invoice #" value={preview} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Customer{mode === "Credit" ? <Req /> : <Opt />}</>}><CustomerPicker value={customer} onChange={pickCustomer} /></Field>
          <Field label={<>Reference<Opt /></>} htmlFor="inv-ref"><input id="inv-ref" value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} /></Field>
          <Field label={<>Delivery Note<Opt /></>}>
            <Select value={dnId} onChange={setDnId} placeholder="None (manual invoice)" options={notesList.filter((d) => !d.invoiceId && (!customer || d.customer === customer)).map((d) => ({ value: d.id, label: `${d.number} — ${d.customer}` }))} />
          </Field>
          <div className="hidden sm:block" />
          <Field label="Invoice Date"><DateInput value={date} onChange={setDate} /></Field>
          <Field label="Due Date"><DateInput value={dueDate} onChange={setDueDate} /></Field>
          <Field label={<>Currency<Opt /></>}><Select value={currency} onChange={setCurrency} options={CURRENCIES} /></Field>
          <Field label={<>Salesperson <span className="font-normal text-muted-foreground">(for commissions)</span></>}>
            <Select value={salesperson} onChange={setSalesperson} placeholder="Me (default)" options={[BRAND.user.fullName]} />
          </Field>
          <Field label={<>Notes<Opt /></>}><textarea aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} /></Field>
          <Field label={<>PDF Template<Opt /></>} hint="Defaults to your company's default invoice template; change it if needed.">
            <Select value={template} onChange={setTemplate} options={INVOICE_TEMPLATES} />
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <Field label={<>Shipping Charges<Opt /></>} htmlFor="inv-ship" className="w-56"><input id="inv-ship" type="number" min="0" step="0.01" value={shipping} onChange={(e) => setShipping(e.target.value)} className={inputCls} /></Field>
          <Field label={<>Invoice Discount<Opt /></>} className="w-56"><Select value={discountType} onChange={(v) => setDiscountType(v as DiscountType)} options={DISCOUNT_TYPES} /></Field>
          {discountType !== "NONE" && (
            <Field label={discountType === "PERCENT" ? "Discount %" : "Discount amount"} htmlFor="inv-disc" className="w-36">
              <input id="inv-disc" type="number" min="0" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className={inputCls} />
            </Field>
          )}
        </div>
      </Section>

      <Section title="Line Items" action={<ToggleRow label="Show income account" checked={incomeAccount} onChange={setIncomeAccount} />}>
        <LineItems lines={lines} setLines={setLines} cols={{ disc: true, tax: true }} taxRates={taxRates} />
        {incomeAccount && <p className="text-xs text-muted-foreground">Every line posts to 4000 · Sales Revenue - Goods. Per-line income accounts come with the product setup.</p>}
      </Section>

      <OptionCard checked={makeDn} onChange={setMakeDn} label="Create a delivery note for this invoice">
        <p className="text-sm text-muted-foreground">A draft delivery note is created for the product lines; pick its warehouse on the Delivery Notes page.</p>
      </OptionCard>
      <OptionCard checked={recurring} onChange={setRecurring} label="Make this a recurring invoice">
        <Field label="Frequency" className="w-48"><Select value={frequency} onChange={setFrequency} options={["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"]} /></Field>
      </OptionCard>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-muted/90 px-4 py-2.5 backdrop-blur">
        {[["Subtotal", t.subtotal], ["Tax", t.tax]].map(([k, v]) => (
          <div key={k as string} className="border-r border-border pr-4">
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="font-semibold tabular-nums">{money(v as number)}</p>
          </div>
        ))}
        <div>
          <p className="text-xs font-medium">Total</p>
          <p className="text-lg font-bold tabular-nums">{money(t.total)}</p>
        </div>
        <span className="ml-auto hidden text-xs text-muted-foreground sm:inline">⌘S / Ctrl+S to save</span>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        <button id="invoice-submit" type="submit" className={btn.primary}>Create Invoice</button>
      </div>
    </form>
  );
}

function OptionCard({ checked, onChange, label, children }: { checked: boolean; onChange: (v: boolean) => void; label: string; children: React.ReactNode }) {
  return (
    <Card>
      <div className="space-y-3 p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-primary" />
          {label}
        </label>
        {checked && children}
      </div>
    </Card>
  );
}

// Printable invoice layout used by the live preview and the invoice view.
function InvoicePaper({ number, customer, date, dueDate, lines, totals, notes, template }: { number: string; customer: string; date: string; dueDate: string; lines: DocLine[]; totals: ReturnType<typeof docTotals>; notes?: string; template?: string }) {
  return (
    <div className="print-area rounded-xl border border-border bg-white p-8 text-sm text-neutral-900 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-bold">{BRAND.org}</p>
          <p className="text-xs text-neutral-500">{template}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold tracking-tight">INVOICE</p>
          <p className="font-mono">{number}</p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs uppercase text-neutral-500">Bill to</p>
          <p className="font-medium">{customer}</p>
        </div>
        <div className="text-right text-xs">
          <p>Date: {longDate(date)}</p>
          <p>Due: {longDate(dueDate)}</p>
        </div>
      </div>
      <table className="mt-6 w-full">
        <thead>
          <tr className="border-b border-neutral-300 text-left text-xs uppercase text-neutral-500">
            <th className="py-1.5">Item</th>
            <th className="py-1.5 text-right">Qty</th>
            <th className="py-1.5 text-right">Price</th>
            <th className="py-1.5 text-right">Tax</th>
            <th className="py-1.5 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr>
              <td colSpan={5} className="py-4 text-center text-neutral-400">Line items appear here.</td>
            </tr>
          )}
          {lines.map((l, i) => (
            <tr key={i} className="border-b border-neutral-100">
              <td className="py-1.5">{l.description || "—"}</td>
              <td className="py-1.5 text-right">{l.qty} {l.uom}</td>
              <td className="py-1.5 text-right">{money(l.unitPrice)}</td>
              <td className="py-1.5 text-right">{num(l.taxPct)}%</td>
              <td className="py-1.5 text-right">{money(l.qty * l.unitPrice * (1 - num(l.discPct) / 100))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto mt-4 w-56 space-y-1 text-xs">
        <p className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></p>
        {totals.discount > 0 && <p className="flex justify-between"><span>Discount</span><span>-{money(totals.discount)}</span></p>}
        <p className="flex justify-between"><span>Tax</span><span>{money(totals.tax)}</span></p>
        {totals.shipping > 0 && <p className="flex justify-between"><span>Shipping</span><span>{money(totals.shipping)}</span></p>}
        <p className="flex justify-between border-t border-neutral-300 pt-1 text-sm font-semibold"><span>Total</span><span>{money(totals.total)}</span></p>
      </div>
      {notes ? <p className="mt-6 text-xs text-neutral-500">{notes}</p> : null}
    </div>
  );
}

function InvoiceView({ invoice, onClose }: { invoice: Rec; onClose: () => void }) {
  const lines = (invoice.lines as DocLine[]) ?? [];
  const t = docTotals(lines, { discountType: invoice.discountType as DiscountType, discountValue: num(invoice.discountValue), shipping: num(invoice.shipping) });
  const st = isOverdue(invoice, today()) ? "OVERDUE" : statusFor(invoice);
  const due = Math.max(0, outstanding(invoice));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Invoice {String(invoice.number)}</h1>
          <p className="mt-1 text-muted-foreground">{String(invoice.customer)} · {String(invoice.paymentMode ?? "Credit")}</p>
        </div>
        <StatusBadge status={st} />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total" value={money(num(invoice.total))} />
        <StatCard label="Paid / credited" value={money(num(invoice.amountPaid) + num(invoice.credited))} />
        <StatCard label="Outstanding" value={money(due)} tone={due > 0 ? "destructive" : "success"} />
      </div>
      <InvoicePaper number={String(invoice.number)} customer={String(invoice.customer)} date={String(invoice.date)} dueDate={String(invoice.dueDate)} lines={lines} totals={t} notes={String(invoice.notes ?? "")} template={String(invoice.template ?? "")} />
      <div className="flex flex-wrap gap-2">
        {due > 0 && <Link href={`/ar/payments/new?customer=${encodeURIComponent(String(invoice.customer))}&amount=${due}`} className={btn.primary}>Record Payment</Link>}
        {due > 0 && <Link href={`/ar/credit-notes/new?invoice=${invoice.id}`} className={btn.outline}>Issue Credit Note</Link>}
        <button type="button" className={btn.outline} onClick={() => window.print()}><Printer /> Print</button>
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- recurring invoices ---------- */

const R_BASE = "/ar/recurring-invoices";
export const FREQUENCIES = ["Daily", "Weekly", "Monthly", "Quarterly", "Yearly"];

export function RecurringInvoices() {
  const router = useRouter();
  const sub = subOf(usePathname(), R_BASE);
  const schedules = useCollection("recurring-invoices");
  const [notice, setNotice] = useState("");
  const close = () => router.push(R_BASE);

  function generate(r: Rec) {
    const made = runRecurring(r, today());
    setNotice(made ? `Generated ${made} invoice(s) for ${r.name}.` : `${r.name} has nothing due yet (next ${longDate(r.nextDate)}).`);
  }

  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (r) => <span className="font-medium">{String(r.name)}</span> },
    { key: "cust", header: "Customer", cell: (r) => String(r.customer) },
    { key: "freq", header: "Frequency", cell: (r) => String(r.frequency) },
    { key: "next", header: "Next Invoice", cell: (r) => (r.status === "ACTIVE" ? longDate(r.nextDate) : "—") },
    { key: "amount", header: "Amount", cell: (r) => money(docTotals((r.lines as DocLine[]) ?? []).total) },
    { key: "gen", header: "Generated", cell: (r) => num(r.generated) },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Recurring Invoices" subtitle="Automatically generate invoices on a schedule" actions={<Link href={`${R_BASE}/new`} className={btn.primary}><Plus /> New Recurring Invoice</Link>} />
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      {schedules.length === 0 ? (
        <Card><p className="p-6 text-center text-muted-foreground">No recurring invoices yet. Create one to automate your billing.</p></Card>
      ) : (
        <DataTable
          columns={columns}
          rows={schedules}
          menu={(r) => [
            { label: "Generate due invoices", onSelect: () => generate(r) },
            { label: r.status === "PAUSED" ? "Resume" : "Pause", onSelect: () => updateRecord("recurring-invoices", r.id, { status: r.status === "PAUSED" ? "ACTIVE" : "PAUSED" }) },
            { label: "Cancel schedule", destructive: true, onSelect: () => confirm(`Cancel ${r.name}?`) && updateRecord("recurring-invoices", r.id, { status: "ENDED", endedAt: today() }) },
            { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${r.name}?`) && deleteRecord("recurring-invoices", r.id) },
          ]}
        />
      )}
      {sub === "new" && (
        <SidePanel onClose={close}>
          <RecurringForm onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function RecurringForm({ onDone }: { onDone: () => void }) {
  const taxRates = useTaxRates();
  const [f, setF] = useState({ name: "", customer: "", frequency: "Monthly", startDate: today(), endDate: "", maxOccurrences: "", paymentTerms: "30", reference: "", shipping: "0", discountType: "NONE" as DiscountType, discountValue: "", notes: "" });
  const [lines, setLines] = useState<DocLine[]>([blankLine()]);
  const [incomeAccount, setIncomeAccount] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ls = validLines(lines);
    if (!f.name.trim() || !f.customer || !f.startDate) return setError("Name, customer and start date are required.");
    if (!ls.length) return setError("Add at least one line item.");
    if (f.endDate && f.endDate < f.startDate) return setError("End date must be after the start date.");
    createRecord("recurring-invoices", { ...f, name: f.name.trim(), nextDate: f.startDate, paymentTerms: num(f.paymentTerms), maxOccurrences: num(f.maxOccurrences), shipping: num(f.shipping), discountValue: num(f.discountValue), lines: ls, generated: 0, status: "ACTIVE" });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Recurring Invoice</h1>
      <Section title="Schedule Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Name <Req /></>} htmlFor="ri-name"><input id="ri-name" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Monthly Web Hosting" className={inputCls} /></Field>
          <Field label={<>Customer <Req /></>}><CustomerPicker value={f.customer} onChange={(v) => set({ customer: v })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>Frequency <Req /></>}><Select value={f.frequency} onChange={(v) => set({ frequency: v })} options={FREQUENCIES} /></Field>
          <Field label={<>Start Date <Req /></>}><DateInput value={f.startDate} onChange={(v) => set({ startDate: v })} /></Field>
          <Field label="End Date (Optional)"><DateInput value={f.endDate} onChange={(v) => set({ endDate: v })} /></Field>
          <Field label="Max Occurrences (Optional)" htmlFor="ri-max"><input id="ri-max" type="number" min="1" value={f.maxOccurrences} onChange={(e) => set({ maxOccurrences: e.target.value })} className={inputCls} /></Field>
          <Field label={<>Payment Terms (days) <Req /></>} htmlFor="ri-terms"><input id="ri-terms" type="number" min="0" value={f.paymentTerms} onChange={(e) => set({ paymentTerms: e.target.value })} className={inputCls} /></Field>
          <Field label="Reference" htmlFor="ri-ref"><input id="ri-ref" value={f.reference} onChange={(e) => set({ reference: e.target.value })} className={inputCls} /></Field>
          <Field label="Shipping Charges" htmlFor="ri-ship"><input id="ri-ship" type="number" min="0" value={f.shipping} onChange={(e) => set({ shipping: e.target.value })} className={inputCls} /></Field>
          <Field label="Invoice Discount Type"><Select value={f.discountType} onChange={(v) => set({ discountType: v as DiscountType })} options={DISCOUNT_TYPES} /></Field>
          {f.discountType !== "NONE" && <Field label="Discount value" htmlFor="ri-disc"><input id="ri-disc" type="number" min="0" value={f.discountValue} onChange={(e) => set({ discountValue: e.target.value })} className={inputCls} /></Field>}
        </div>
        <Field label="Notes"><textarea aria-label="Notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} className={textareaCls} /></Field>
      </Section>
      <Section title="Line Items Template" action={<ToggleRow label="Show income account" checked={incomeAccount} onChange={setIncomeAccount} />}>
        <LineItems lines={lines} setLines={setLines} cols={{ disc: true, tax: true }} taxRates={taxRates} />
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Create Recurring Invoice</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------- subscriptions ---------- */

const ym = (iso: string) => iso.slice(0, 7);

export function Subscriptions() {
  const schedules = useCollection("recurring-invoices");
  const now = today();
  const m = useMemo(() => {
    const active = schedules.filter((r) => r.status === "ACTIVE");
    const mrr = active.reduce((s, r) => s + monthlyValue(r), 0);
    const customers = new Set(active.map((r) => r.customer)).size;
    const thisMonth = ym(now);
    const newThis = schedules.filter((r) => ym(String(r.startDate)) === thisMonth).length;
    const churned = schedules.filter((r) => r.status === "ENDED" && ym(String(r.endedAt ?? "")) === thisMonth).length;
    const months = Array.from({ length: 12 }, (_, i) => addInterval(`${thisMonth}-01`, "Monthly", i - 11).slice(0, 7));
    // A schedule counts in a month if it started by then and hadn't ended before it.
    const series = months.map((mo) => ({
      month: mo,
      mrr: schedules.filter((r) => ym(String(r.startDate)) <= mo && !(r.status === "ENDED" && ym(String(r.endedAt ?? "9999")) < mo)).reduce((s, r) => s + monthlyValue(r), 0),
    }));
    const startOfMonthActive = active.length + churned - newThis;
    return { mrr, arr: mrr * 12, active: active.length, customers, arpa: customers ? mrr / customers : 0, newThis, churned, churnPct: startOfMonthActive > 0 ? (churned / startOfMonthActive) * 100 : null, series };
  }, [schedules, now]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Subscriptions"
        subtitle="Subscription-lite view over recurring invoices — MRR, churn and per-schedule monthly value."
        actions={<Link href="/ar/recurring-invoices" className={btn.outline}><RefreshCw /> Manage recurring invoices</Link>}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="MRR" value={money(m.mrr)} />
        <Metric label="ARR" value={money(m.arr)} />
        <Metric label="Active subscriptions" value={String(m.active)} sub={`${m.customers} customers`} />
        <Metric label="ARPA" value={money(m.arpa)} sub="avg MRR / customer" />
        <Metric label="New this month" value={String(m.newThis)} />
        <Metric label="Churn" value={m.churnPct === null ? "—" : `${m.churnPct.toFixed(1)}%`} sub={`${m.churned} churned this month`} />
      </div>
      <Card>
        <div className="space-y-3 p-6">
          <CardTitle className="text-sm">MRR — last 12 months</CardTitle>
          <MrrChart series={m.series} />
        </div>
      </Card>
      <Card>
        <div className="space-y-3 p-6">
          <CardTitle className="text-sm">Schedules by monthly value</CardTitle>
          {schedules.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No recurring invoices yet — create one from a new invoice (&quot;Make this a recurring invoice&quot;) or the recurring-invoices page.</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Schedule</th><th className="py-2 font-medium">Customer</th><th className="py-2 font-medium">Frequency</th><th className="py-2 font-medium">Status</th><th className="py-2 text-right font-medium">Monthly value</th></tr></thead>
              <tbody>
                {[...schedules].sort((a, b) => monthlyValue(b) - monthlyValue(a)).map((r) => (
                  <tr key={r.id} className="border-b border-border/60">
                    <td className="py-2 font-medium">{String(r.name)}</td>
                    <td className="py-2">{String(r.customer)}</td>
                    <td className="py-2">{String(r.frequency)}</td>
                    <td className="py-2"><StatusBadge status={r.status} /></td>
                    <td className="py-2 text-right tabular-nums">{money(monthlyValue(r))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
      <p className="text-xs text-muted-foreground">Computed live from recurring-invoice schedules (pre-tax net, normalised to monthly; shipping excluded). Cancellation timing is approximated by the last update to the schedule.</p>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <div className="space-y-1 p-4">
        <p className="text-xs font-medium">{label}</p>
        <p className="text-lg font-semibold tabular-nums">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
    </Card>
  );
}

function MrrChart({ series }: { series: { month: string; mrr: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 240;
  const pad = { l: 40, r: 8, t: 8, b: 24 };
  const max = Math.max(4, ...series.map((s) => s.mrr));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f * 100) / 100);
  const x = (i: number) => pad.l + (i * (W - pad.l - pad.r)) / (series.length - 1);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const path = series.map((s, i) => `${i ? "L" : "M"}${x(i)},${y(s.mrr)}`).join(" ");
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full" role="img" aria-label="Monthly recurring revenue, last 12 months" onMouseLeave={() => setHover(null)}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="stroke-border" strokeDasharray="3 3" />
            <text x={pad.l - 6} y={y(t)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[12px]">{t >= 1000 ? `${Math.round(t / 1000)}k` : t}</text>
          </g>
        ))}
        {series.map((s, i) => (
          <text key={s.month} x={x(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">{s.month}</text>
        ))}
        <path d={path} fill="none" className="stroke-primary" strokeWidth={2} />
        {series.map((s, i) => (
          <rect key={s.month} x={x(i) - 20} y={pad.t} width={40} height={H - pad.t - pad.b} fill="transparent" onMouseEnter={() => setHover(i)} />
        ))}
        {hover !== null && <circle cx={x(hover)} cy={y(series[hover].mrr)} r={4} className="fill-primary" />}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-0 rounded-md border border-border bg-popover px-2 py-1 text-xs shadow" style={{ left: `${(x(hover) / W) * 100}%` }}>
          {series[hover].month}: <b>{money(series[hover].mrr)}</b>
        </div>
      )}
    </div>
  );
}

