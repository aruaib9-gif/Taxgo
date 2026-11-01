"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Percent, Plus, Send } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { docTotals, issueCreditNote, outstanding, recordPayment, statusFor, type DiscountType, type DocLine } from "@/lib/sales";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Card, CardTitle, DataTable, DateInput, Field, PageHeader, Select, SidePanel, btn, inputCls, longDate, money, num, textareaCls, today, type Column } from "@/components/accounting/kit";
import { CustomerPicker, DISCOUNT_TYPES, NumberBanner, Opt, Req, Section, StatusBadge } from "./doc-kit";

const subOf = (pathname: string, base: string) => pathname.slice(base.length).replace(/^\//, "");

/* ---------- AR payments ---------- */

const PAY_BASE = "/ar/payments";
const METHODS = ["Cash", "Check", "Bank Transfer", "Credit Card", "Other"];

export function ArPayments() {
  const router = useRouter();
  const sub = subOf(usePathname(), PAY_BASE);
  const payments = useCollection("ar-payments");
  const close = () => router.push(PAY_BASE);
  const columns: Column<Rec>[] = [
    { key: "num", header: "Payment #", cell: (p) => <span className="font-mono text-sm">{String(p.number)}</span> },
    { key: "cust", header: "Customer", cell: (p) => <span className="font-medium">{String(p.customer)}</span> },
    { key: "date", header: "Date", cell: (p) => longDate(p.date) },
    { key: "amount", header: "Amount", cell: (p) => money(num(p.amount)) },
    { key: "method", header: "Method", cell: (p) => String(p.method) },
    { key: "ref", header: "Reference", cell: (p) => String(p.reference || "—") },
    { key: "ledger", header: "Ledger", cell: (p) => (p.journalId ? <Link href={`/financial/journal-entries/${p.journalId}`} onClick={(e) => e.stopPropagation()} className="text-primary hover:underline">Posted</Link> : "—") },
  ];
  const detail = sub && sub !== "new" ? payments.find((p) => p.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="AR Payments" subtitle="Customer payment receipts" actions={<Link href={`${PAY_BASE}/new`} className={btn.primary}><Plus /> Record Payment</Link>} />
      <DataTable columns={columns} rows={[...payments].sort((a, b) => String(b.date).localeCompare(String(a.date)))} onRowClick={(p) => router.push(`${PAY_BASE}/${p.id}`)} />
      {sub === "new" && (
        <SidePanel onClose={close}>
          <PaymentForm onDone={close} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold tracking-tight">Payment {String(detail.number)}</h1>
            <Card>
              <dl className="grid gap-3 p-6 text-sm sm:grid-cols-2">
                {[["Customer", detail.customer], ["Date", longDate(detail.date)], ["Amount", money(num(detail.amount))], ["Method", detail.method], ["Reference", detail.reference || "—"], ["Currency", detail.currency || "USD"], ["Unapplied (on account)", money(num(detail.unapplied))]].map(([k, v]) => (
                  <div key={String(k)}><dt className="text-muted-foreground">{String(k)}</dt><dd className="font-medium">{String(v)}</dd></div>
                ))}
              </dl>
            </Card>
            <Section title="Applied to invoices">
              {((detail.allocations as { number: string; amount: number }[]) ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">Held on account — no open invoices at the time of payment.</p>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {(detail.allocations as { number: string; amount: number }[]).map((a) => (
                    <li key={a.number} className="flex justify-between py-2"><span>{a.number}</span><span className="tabular-nums">{money(a.amount)}</span></li>
                  ))}
                </ul>
              )}
            </Section>
            {detail.notes ? <p className="text-sm text-muted-foreground">{String(detail.notes)}</p> : null}
            <button type="button" className={btn.outline} onClick={close}>Close</button>
          </div>
        </SidePanel>
      )}
    </div>
  );
}

function PaymentForm({ onDone }: { onDone: () => void }) {
  const invoices = useCollection("invoices");
  const [preview] = useState(() => nextNumber("ar-payments", "PMT"));
  const search = useSearchParams();
  const [customer, setCustomer] = useState(() => search.get("customer") ?? "");
  const [date, setDate] = useState(today());
  const [amount, setAmount] = useState(() => search.get("amount") ?? "");
  const [method, setMethod] = useState("Bank Transfer");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [currency, setCurrency] = useState("");
  const [error, setError] = useState("");
  const open = invoices.filter((i) => i.customer === customer && ["UNPAID", "PARTIAL"].includes(statusFor(i)));
  const owed = open.reduce((s, i) => s + outstanding(i), 0);
  const valid = customer && num(amount) > 0 && date;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setError("Customer, date and a positive amount are required.");
    recordPayment({ customer, date, amount: num(amount), method, reference, notes, currency: currency || "USD" });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Record Payment</h1>
        <p className="mt-1 text-muted-foreground">Record a customer payment</p>
      </div>
      <Section title="Payment Details">
        <NumberBanner label="Receipt #" value={preview} />
        <Field label="Customer"><CustomerPicker value={customer} onChange={setCustomer} /></Field>
        {customer && <p className="-mt-2 text-xs text-muted-foreground">{open.length} open invoice(s) · {money(owed)} outstanding. Payments settle the oldest first; any extra stays on account.</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Payment Date"><DateInput value={date} onChange={setDate} /></Field>
          <Field label="Amount" htmlFor="pay-amt"><input id="pay-amt" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} /></Field>
          <Field label="Payment Method"><Select value={method} onChange={setMethod} options={METHODS} /></Field>
          <Field label="Reference" htmlFor="pay-ref"><input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} className={inputCls} /></Field>
        </div>
        <Field label="Notes"><textarea aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} /></Field>
        <Field label="Currency (if foreign)" className="w-56">
          <Select value={currency} onChange={setCurrency} placeholder="Base currency (USD)" options={["AED", "EUR", "GBP", "INR", "SAR"]} />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={!valid} className={btn.primary}>Record Payment</button>
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        </div>
      </Section>
    </form>
  );
}

/* ---------- credit notes ---------- */

const CN_BASE = "/ar/credit-notes";

export function CreditNotes() {
  const router = useRouter();
  const sub = subOf(usePathname(), CN_BASE);
  const notes = useCollection("credit-notes");
  if (sub === "new") return <CreditNoteForm onDone={() => router.push(CN_BASE)} />;
  const columns: Column<Rec>[] = [
    { key: "num", header: "Credit Note #", cell: (c) => <span className="font-mono text-sm">{String(c.number)}</span> },
    { key: "date", header: "Date", cell: (c) => longDate(c.date) },
    { key: "cust", header: "Customer", cell: (c) => <span className="font-medium">{String(c.customer)}</span> },
    { key: "total", header: "Total", cell: (c) => money(num(c.total)) },
    { key: "applied", header: "Applied", cell: (c) => money(num(c.applied)) },
    { key: "status", header: "Status", cell: (c) => <StatusBadge status={c.status} /> },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Credit Notes" subtitle="Customer credits — issue against returns, over-billing or goodwill, then apply to open invoices" actions={<Link href={`${CN_BASE}/new`} className={btn.primary}><Plus /> New Credit Note</Link>} />
      <DataTable columns={columns} rows={[...notes].sort((a, b) => String(b.date).localeCompare(String(a.date)))} />
    </div>
  );
}

type ReturnLine = { invoiceId: string; index: number; qty: number };

function CreditNoteForm({ onDone }: { onDone: () => void }) {
  const invoices = useCollection("invoices");
  const search = useSearchParams();
  const [preset] = useState(() => readCollection("invoices").find((i) => i.id === search.get("invoice")));
  const [preview] = useState(() => nextNumber("credit-notes", "CN"));
  const [customer, setCustomer] = useState(String(preset?.customer ?? ""));
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState("");
  const [discountType, setDiscountType] = useState<DiscountType>("NONE");
  const [discountValue, setDiscountValue] = useState("");
  const [shipping, setShipping] = useState("0");
  const [open, setOpen] = useState(() => !!preset);
  const [picked, setPicked] = useState<string[]>(preset ? [preset.id] : []);
  const [returns, setReturns] = useState<ReturnLine[]>([]);
  const [error, setError] = useState("");
  const candidates = invoices.filter((i) => i.customer === customer && statusFor(i) !== "DRAFT" && statusFor(i) !== "CANCELLED");
  const qtyOf = (invoiceId: string, index: number) => returns.find((r) => r.invoiceId === invoiceId && r.index === index)?.qty ?? 0;
  const setQty = (invoiceId: string, index: number, qty: number) =>
    setReturns((rs) => [...rs.filter((r) => !(r.invoiceId === invoiceId && r.index === index)), ...(qty > 0 ? [{ invoiceId, index, qty }] : [])]);

  const creditLines: DocLine[] = useMemo(
    () =>
      returns.flatMap((r) => {
        const l = ((invoices.find((i) => i.id === r.invoiceId)?.lines as DocLine[]) ?? [])[r.index];
        return l ? [{ ...l, qty: r.qty }] : [];
      }),
    [returns, invoices],
  );
  const t = docTotals(creditLines, { discountType, discountValue: num(discountValue), shipping: num(shipping) });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer || !date) return setError("Customer and date are required.");
    if (!creditLines.length) return setError("Enter a return quantity on at least one invoice line.");
    issueCreditNote({ customer, date, reason, lines: creditLines, invoiceIds: [...new Set(returns.map((r) => r.invoiceId))], discountType, discountValue: num(discountValue), shipping: num(shipping) });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <PageHeader title="New Credit Note" subtitle="Return against a customer's invoice(s) — issue it to post the reversal to the ledger" />
      <Section title="Details">
        <NumberBanner label="Credit note #" value={preview} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>Customer<Req /></>}><CustomerPicker value={customer} onChange={(v) => { setCustomer(v); setPicked([]); setReturns([]); }} /></Field>
          <Field label={<>Credit Note Date<Req /></>}><DateInput value={date} onChange={setDate} /></Field>
          <Field label={<>Reason<Opt /></>} htmlFor="cn-reason"><input id="cn-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Returned goods, over-billing" className={inputCls} /></Field>
          <Field label={<>Document discount<Opt /></>}><Select value={discountType} onChange={(v) => setDiscountType(v as DiscountType)} options={DISCOUNT_TYPES} /></Field>
          <Field label={<>Discount value<Opt /></>} htmlFor="cn-disc"><input id="cn-disc" type="number" min="0" disabled={discountType === "NONE"} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} placeholder="0" className={inputCls} /></Field>
          <Field label={<>Shipping credited back<Opt /></>} htmlFor="cn-ship"><input id="cn-ship" type="number" min="0" value={shipping} onChange={(e) => setShipping(e.target.value)} className={inputCls} /></Field>
        </div>
      </Section>
      <Card>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between p-6 text-left">
          <CardTitle>Invoices to return against <Req /></CardTitle>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="space-y-3 px-6 pb-6">
            {!customer && <p className="text-sm text-muted-foreground">Pick a customer to see their invoices.</p>}
            {customer && candidates.length === 0 && <p className="text-sm text-muted-foreground">{customer} has no issued invoices.</p>}
            {candidates.map((inv) => {
              const on = picked.includes(inv.id);
              return (
                <div key={inv.id} className="rounded-lg border border-border">
                  <label className="flex cursor-pointer items-center gap-2 p-3 text-sm">
                    <input type="checkbox" checked={on} onChange={(e) => { setPicked(e.target.checked ? [...picked, inv.id] : picked.filter((x) => x !== inv.id)); if (!e.target.checked) setReturns(returns.filter((r) => r.invoiceId !== inv.id)); }} className="h-4 w-4 accent-primary" />
                    <span className="font-mono">{String(inv.number)}</span>
                    <span className="text-muted-foreground">{longDate(inv.date)} · {money(num(inv.total))} · outstanding {money(Math.max(0, outstanding(inv)))}</span>
                  </label>
                  {on && (
                    <table className="w-full border-t border-border text-sm">
                      <thead><tr className="text-left text-muted-foreground"><th className="px-3 py-1.5 font-medium">Item</th><th className="px-3 py-1.5 text-right font-medium">Invoiced</th><th className="px-3 py-1.5 text-right font-medium">Price</th><th className="w-28 px-3 py-1.5 font-medium">Return qty</th></tr></thead>
                      <tbody>
                        {((inv.lines as DocLine[]) ?? []).map((l, idx) => (
                          <tr key={idx} className="border-t border-border/60">
                            <td className="px-3 py-1.5">{l.description}</td>
                            <td className="px-3 py-1.5 text-right">{l.qty}</td>
                            <td className="px-3 py-1.5 text-right tabular-nums">{money(l.unitPrice)}</td>
                            <td className="px-3 py-1.5"><input aria-label={`Return quantity for ${l.description}`} type="number" min="0" max={l.qty} value={qtyOf(inv.id, idx) || ""} onChange={(e) => setQty(inv.id, idx, Math.min(l.qty, Math.max(0, Number(e.target.value) || 0)))} placeholder="0" className={cn(inputCls, "h-8 text-right")} /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {creditLines.length > 0 && <p className="text-right text-sm">Credit total <b className="ml-2 tabular-nums">{money(t.total)}</b> <span className="text-muted-foreground">(incl. {money(t.tax)} tax)</span></p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Issue Credit Note</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------- invoice reminders ---------- */

const TRIGGERS = [
  { value: "BEFORE", label: "Before Due Date" },
  { value: "ON", label: "On Due Date" },
  { value: "AFTER", label: "After Due Date" },
];

const fill = (tpl: string, inv: Rec) =>
  tpl
    .replace(/\{\{invoiceNumber\}\}/g, String(inv.number))
    .replace(/\{\{customerName\}\}/g, String(inv.customer))
    .replace(/\{\{totalAmount\}\}/g, money(num(inv.total)))
    .replace(/\{\{amountDue\}\}/g, money(Math.max(0, outstanding(inv))))
    .replace(/\{\{dueDate\}\}/g, longDate(inv.dueDate));

export function InvoiceReminders() {
  const rules = useCollection("invoice-reminders");
  const log = useCollection("reminder-log");
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");

  // Logs a reminder for each open invoice whose trigger day is today (once per rule + invoice).
  function processNow() {
    const now = today();
    const sent = new Set(log.map((l) => `${l.ruleId}:${l.invoiceId}`));
    let n = 0;
    for (const r of rules.filter((x) => x.active !== false)) {
      for (const inv of readCollection("invoices")) {
        if (!["UNPAID", "PARTIAL"].includes(statusFor(inv)) || !inv.dueDate || sent.has(`${r.id}:${inv.id}`)) continue;
        const d = new Date(`${inv.dueDate}T00:00:00Z`);
        d.setUTCDate(d.getUTCDate() + (r.trigger === "BEFORE" ? -1 : r.trigger === "AFTER" ? 1 : 0) * num(r.days));
        if (d.toISOString().slice(0, 10) > now) continue;
        const email = String(readCollection("customers").find((c) => c.name === inv.customer)?.email ?? "");
        createRecord("reminder-log", { ruleId: r.id, rule: r.name, invoiceId: inv.id, invoice: inv.number, customer: inv.customer, email, subject: fill(String(r.subject || "Reminder: {{invoiceNumber}}"), inv), date: now, status: email ? "QUEUED" : "NO EMAIL" });
        n++;
      }
    }
    setNotice(n ? `Logged ${n} reminder(s). Email delivery isn't connected in this build, so they're queued, not sent.` : "No invoices are due a reminder right now.");
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoice Reminders"
        subtitle="Configure automatic email reminders for invoices"
        actions={
          <>
            <button type="button" onClick={processNow} className={btn.outline}><Send /> Process Now</button>
            <button type="button" onClick={() => setAdding(true)} className={btn.primary}><Plus /> New Rule</button>
          </>
        }
      />
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      {adding && <RuleForm onDone={() => setAdding(false)} />}
      <Section title="Reminder Rules">
        {rules.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">No reminder rules configured.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rules.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div>
                  <p className="font-medium">{String(r.name)}</p>
                  <p className="text-xs text-muted-foreground">{r.trigger === "ON" ? "On the due date" : `${num(r.days)} day(s) ${r.trigger === "BEFORE" ? "before" : "after"} the due date`} · “{String(r.subject)}”</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => updateRecord("invoice-reminders", r.id, { active: r.active === false })} className={btn.smOutline}>{r.active === false ? "Enable" : "Disable"}</button>
                  <button type="button" onClick={() => confirm(`Delete ${r.name}?`) && deleteRecord("invoice-reminders", r.id)} className={cn(btn.smOutline, "text-destructive")}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Recent Reminder Log">
        {log.length === 0 ? (
          <p className="py-4 text-center text-muted-foreground">No reminders sent yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Date</th><th className="py-2 font-medium">Invoice</th><th className="py-2 font-medium">Customer</th><th className="py-2 font-medium">Rule</th><th className="py-2 font-medium">Status</th></tr></thead>
            <tbody>
              {[...log].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 10).map((l) => (
                <tr key={l.id} className="border-b border-border/60"><td className="py-2">{longDate(l.date)}</td><td className="py-2 font-mono">{String(l.invoice)}</td><td className="py-2">{String(l.customer)}</td><td className="py-2">{String(l.rule)}</td><td className="py-2 text-xs">{String(l.status)}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>
    </div>
  );
}

function RuleForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("BEFORE");
  const [days, setDays] = useState("7");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const valid = name.trim() && subject.trim();
  return (
    <Section title="New Reminder Rule">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Name" htmlFor="rr-name"><input id="rr-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. 7 Days Before Due" className={inputCls} /></Field>
        <Field label="Trigger"><Select value={trigger} onChange={setTrigger} options={TRIGGERS} /></Field>
        <Field label="Days Offset" htmlFor="rr-days"><input id="rr-days" type="number" min="0" disabled={trigger === "ON"} value={days} onChange={(e) => setDays(e.target.value)} className={inputCls} /></Field>
      </div>
      <Field label="Email Subject" htmlFor="rr-subj"><input id="rr-subj" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Use {{invoiceNumber}}, {{customerName}}, {{dueDate}}" className={inputCls} /></Field>
      <Field label="Email Body"><textarea aria-label="Email body" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Use {{invoiceNumber}}, {{customerName}}, {{totalAmount}}, {{amountDue}}, {{dueDate}}" className={textareaCls} /></Field>
      <div className="flex gap-2">
        <button type="button" disabled={!valid} onClick={() => { createRecord("invoice-reminders", { name: name.trim(), trigger, days: trigger === "ON" ? 0 : num(days), subject: subject.trim(), body, active: true }); onDone(); }} className={btn.primary}>Save Rule</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </Section>
  );
}

/* ---------- commissions ---------- */

const BASIS = [
  { value: "INVOICED", label: "Invoiced (net)" },
  { value: "COLLECTED", label: "Collected" },
];
const PLAN_TYPES = [
  { value: "SALESPERSON", label: "Salesperson" },
  { value: "DEFAULT", label: "Default (everyone)" },
];

export function Commissions() {
  const plans = useCollection("commission-plans");
  const invoices = useCollection("invoices");
  const [type, setType] = useState("SALESPERSON");
  const [person, setPerson] = useState("");
  const [rate, setRate] = useState("");
  const [basis, setBasis] = useState("INVOICED");
  const now = today();
  const [from, setFrom] = useState(`${now.slice(0, 7)}-01`);
  const [to, setTo] = useState(now);
  const people = [BRAND.user.fullName];
  const valid = num(rate) > 0 && num(rate) <= 100 && (type === "DEFAULT" || person);

  function save() {
    const key = type === "DEFAULT" ? "" : person;
    const existing = plans.find((p) => (p.salesperson ?? "") === key);
    const data = { type, salesperson: key, rate: num(rate), basis };
    if (existing) updateRecord("commission-plans", existing.id, data);
    else createRecord("commission-plans", data);
    setRate("");
  }

  // One row per salesperson with a plan (or the default plan): net invoiced or cash collected in the period.
  const report = useMemo(() => {
    const inRange = invoices.filter((i) => String(i.date) >= from && String(i.date) <= to && statusFor(i) !== "DRAFT" && statusFor(i) !== "CANCELLED");
    const sellers = [...new Set(inRange.map((i) => String(i.salesperson || BRAND.user.fullName)))];
    return sellers.flatMap((s) => {
      const plan = plans.find((p) => p.salesperson === s) ?? plans.find((p) => !p.salesperson);
      if (!plan) return [];
      const mine = inRange.filter((i) => String(i.salesperson || BRAND.user.fullName) === s);
      const base = plan.basis === "COLLECTED" ? mine.reduce((t, i) => t + num(i.amountPaid), 0) : mine.reduce((t, i) => t + num(i.subtotal) - num(i.discount), 0);
      return [{ salesperson: s, invoices: mine.length, base, rate: num(plan.rate), basis: String(plan.basis), commission: Math.round(base * num(plan.rate) * 10) / 1000 }];
    });
  }, [invoices, plans, from, to]);

  return (
    <div className="space-y-4">
      <PageHeader title="Sales Commissions" subtitle="One %-plan per salesperson, computed on invoiced (pre-tax net) or collected amounts. Nothing posts to the GL." />
      <Card>
        <div className="space-y-3 p-6">
          <CardTitle className="flex items-center gap-2"><Percent className="h-4 w-4" /> Plans</CardTitle>
          <div className="flex flex-wrap items-end gap-2">
            <Field label="Type" className="w-32 [&_label]:text-xs"><Select size="sm" ariaLabel="Type" value={type} onChange={setType} options={PLAN_TYPES} /></Field>
            <Field label="Salesperson" className="w-48 [&_label]:text-xs"><Select size="sm" ariaLabel="Salesperson" value={type === "DEFAULT" ? "" : person} onChange={setPerson} disabled={type === "DEFAULT"} placeholder="Select..." options={people} /></Field>
            <Field label="Rate %" className="w-24 [&_label]:text-xs"><input aria-label="Rate %" type="number" min="0" max="100" step="0.1" value={rate} onChange={(e) => setRate(e.target.value)} className={cn(inputCls, "h-8")} /></Field>
            <Field label="Basis" className="w-36 [&_label]:text-xs"><Select size="sm" ariaLabel="Basis" value={basis} onChange={setBasis} options={BASIS} /></Field>
            <button type="button" disabled={!valid} onClick={save} className={btn.smPrimary}>Save plan</button>
          </div>
          {plans.length > 0 && (
            <ul className="divide-y divide-border rounded-md border border-border text-sm">
              {plans.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2">
                  <span>{p.salesperson ? String(p.salesperson) : "Default (everyone)"} — {num(p.rate)}% of {p.basis === "COLLECTED" ? "collected" : "invoiced (net)"}</span>
                  <button type="button" onClick={() => deleteRecord("commission-plans", p.id)} className="text-xs text-destructive hover:underline">Remove</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
      <Card>
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <CardTitle>Commission report</CardTitle>
            <div className="flex gap-2">
              <Field label="From" className="[&_label]:text-xs"><DateInput size="sm" value={from} onChange={setFrom} className="w-40" /></Field>
              <Field label="To" className="[&_label]:text-xs"><DateInput size="sm" value={to} onChange={setTo} className="w-40" /></Field>
            </div>
          </div>
          {report.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No active plans (or no activity in the period).</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Salesperson</th><th className="py-2 text-right font-medium">Invoices</th><th className="py-2 font-medium">Basis</th><th className="py-2 text-right font-medium">Base</th><th className="py-2 text-right font-medium">Rate</th><th className="py-2 text-right font-medium">Commission</th></tr></thead>
              <tbody>
                {report.map((r) => (
                  <tr key={r.salesperson} className="border-b border-border/60">
                    <td className="py-2 font-medium">{r.salesperson}</td><td className="py-2 text-right">{r.invoices}</td><td className="py-2">{r.basis === "COLLECTED" ? "Collected" : "Invoiced (net)"}</td>
                    <td className="py-2 text-right tabular-nums">{money(r.base)}</td><td className="py-2 text-right">{r.rate}%</td><td className="py-2 text-right font-semibold tabular-nums">{money(r.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

