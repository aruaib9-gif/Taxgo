"use client";

// Proposals → Sales Orders → Delivery Notes → Invoices.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Printer, Trash2 } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { createInvoice, docTotals, type DocLine } from "@/lib/sales";
import { onHand, shipStock, useMoves } from "@/lib/stock";
import { cn } from "@/lib/utils";
import { Card, DataTable, DateInput, Field, PageHeader, SearchInput, Select, SidePanel, Switch, btn, inputCls, longDate, money, num, textareaCls, today, type Column } from "@/components/accounting/kit";
import { CustomerPicker, LineItems, NumberBanner, Opt, RecordPicker, Req, Section, StatusBadge, blankLine, useCustomers, useProducts, validLines } from "./doc-kit";

const subOf = (pathname: string, base: string) => pathname.slice(base.length).replace(/^\//, "");
const plusDays = (iso: string, days: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};
const termsOf = (customer: string) => num(readCollection("customers").find((c) => c.name === customer)?.terms ?? 30);

// Turns a proposal/order into a posted credit invoice and returns its id.
function invoiceFrom(doc: Rec, sourceKey: string) {
  const inv = createInvoice({
    customer: String(doc.customer),
    date: today(),
    dueDate: plusDays(today(), termsOf(String(doc.customer))),
    lines: (doc.lines as DocLine[]) ?? [],
    paymentMode: "Credit",
    reference: String(doc.number),
    notes: String(doc.notes ?? ""),
    [sourceKey]: doc.id,
  });
  return inv.id;
}

function ListCard({ q, setQ, placeholder, status, setStatus, statuses, children }: {
  q: string;
  setQ: (v: string) => void;
  placeholder: string;
  status: string;
  setStatus: (v: string) => void;
  statuses: string[];
  children: React.ReactNode;
}) {
  return (
    <Card>
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput value={q} onChange={setQ} placeholder={placeholder} />
          <Select ariaLabel="Status" size="sm" value={status} onChange={setStatus} options={[{ value: "", label: "All Statuses" }, ...statuses.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, " ") }))]} className="w-36" />
        </div>
        {children}
      </div>
    </Card>
  );
}

const match = (r: Rec, q: string, status: string) =>
  (!status || r.status === status) && (!q.trim() || `${r.number} ${r.title ?? ""} ${r.customer}`.toLowerCase().includes(q.trim().toLowerCase()));
const byNewest = (a: Rec, b: Rec) => String(b.createdAt).localeCompare(String(a.createdAt));

/* ---------- proposals ---------- */

const P_BASE = "/ar/proposals";
const P_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "CONVERTED"];
const P_TEMPLATES = ["Lumière — Proposal", "Meridian — Proposal", "Onyx — Proposal"];
const PP_TEMPLATES = ["Lumière — Project Proposal", "Meridian — Project Proposal", "Onyx — Project Proposal"];

export function Proposals() {
  const router = useRouter();
  const sub = subOf(usePathname(), P_BASE);
  const proposals = useCollection("proposals");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const close = () => router.push(P_BASE);
  const detail = sub && sub !== "new" ? proposals.find((p) => p.id === sub) : undefined;

  const columns: Column<Rec>[] = [
    { key: "num", header: "Proposal #", cell: (p) => <span className="font-mono text-sm">{String(p.number)}</span> },
    { key: "title", header: "Title", cell: (p) => <span className="font-medium">{String(p.title)}</span> },
    { key: "cust", header: "Customer", cell: (p) => String(p.customer) },
    { key: "date", header: "Date", cell: (p) => longDate(p.date) },
    { key: "valid", header: "Valid Until", cell: (p) => longDate(p.validUntil) },
    { key: "total", header: "Total", cell: (p) => money(num(p.total)) },
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Proposals" subtitle="Manage sales proposals and convert to invoices" actions={<Link href={`${P_BASE}/new`} className={btn.primary}><Plus /> New Proposal</Link>} />
      <ListCard q={q} setQ={setQ} placeholder="Search proposals..." status={status} setStatus={setStatus} statuses={P_STATUSES}>
        <DataTable columns={columns} rows={proposals.filter((p) => match(p, q, status)).sort(byNewest)} onRowClick={(p) => router.push(`${P_BASE}/${p.id}`)} emptyText="No proposals found. Create your first proposal to get started." />
      </ListCard>
      {sub === "new" && (
        <SidePanel onClose={close}>
          <ProposalForm onDone={close} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <DocDetail
            key={detail.id}
            doc={detail}
            kind="Proposal"
            onClose={close}
            meta={[["Title", String(detail.title)], ["Date", longDate(detail.date)], ["Valid until", longDate(detail.validUntil)], ["Template", String(detail.template || "—")]]}
            actions={
              <>
                {detail.status === "DRAFT" && <button type="button" className={btn.outline} onClick={() => updateRecord("proposals", detail.id, { status: "SENT" })}>Mark as Sent</button>}
                {["DRAFT", "SENT"].includes(String(detail.status)) && (
                  <>
                    <button type="button" className={btn.outline} onClick={() => updateRecord("proposals", detail.id, { status: "ACCEPTED" })}>Accept</button>
                    <button type="button" className={btn.outline} onClick={() => updateRecord("proposals", detail.id, { status: "REJECTED" })}>Reject</button>
                  </>
                )}
                {detail.status === "ACCEPTED" && (
                  <>
                    <button
                      type="button"
                      className={btn.primary}
                      onClick={() => {
                        const so = createRecord("sales-orders", { number: nextNumber("sales-orders", "SO"), customer: detail.customer, title: detail.title, date: today(), reference: detail.number, lines: detail.lines, notes: detail.notes, terms: detail.terms, total: detail.total, status: "CONFIRMED", proposalId: detail.id });
                        updateRecord("proposals", detail.id, { status: "CONVERTED", convertedTo: so.number });
                        router.push(`/ar/sales-orders/${so.id}`);
                      }}
                    >
                      Convert to Sales Order
                    </button>
                    <button
                      type="button"
                      className={btn.outline}
                      onClick={() => {
                        const id = invoiceFrom(detail, "proposalId");
                        updateRecord("proposals", detail.id, { status: "CONVERTED" });
                        router.push(`/ar/invoices/${id}`);
                      }}
                    >
                      Convert to Invoice
                    </button>
                  </>
                )}
                {detail.status === "DRAFT" && <DeleteButton collection="proposals" id={detail.id} onDone={close} />}
              </>
            }
          />
        </SidePanel>
      )}
    </div>
  );
}

function ProposalForm({ onDone }: { onDone: () => void }) {
  const [preview] = useState(() => nextNumber("proposals", "PROP"));
  const [customer, setCustomer] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [validUntil, setValidUntil] = useState("");
  const [reference, setReference] = useState("");
  const [template, setTemplate] = useState("");
  const [detailed, setDetailed] = useState(false);
  const [cover, setCover] = useState("");
  const [lines, setLines] = useState<DocLine[]>([blankLine()]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ls = validLines(lines);
    if (!customer || !title.trim() || !validUntil) return setError("Customer, title and valid-until date are required.");
    if (!ls.length) return setError("Add at least one line item.");
    if (validUntil < date) return setError("Valid Until must be on or after the proposal date.");
    createRecord("proposals", { number: nextNumber("proposals", "PROP"), customer, title: title.trim(), date, validUntil, reference, template, detailed, coverLetter: cover, lines: ls, notes, terms, total: docTotals(ls).total, status: "DRAFT" });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Proposal</h1>
        <p className="mt-1 text-muted-foreground">Create a new sales proposal</p>
      </div>
      <Section title="Proposal Details">
        <NumberBanner label="Proposal #" value={preview} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Customer<Req /></>}><CustomerPicker value={customer} onChange={setCustomer} /></Field>
          <Field label={<>Title<Req /></>} htmlFor="p-title"><input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Website Redesign Project" className={inputCls} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>Proposal Date<Opt /></>}><DateInput value={date} onChange={setDate} /></Field>
          <Field label={<>Valid Until<Req /></>}><DateInput value={validUntil} onChange={setValidUntil} /></Field>
          <Field label={<>Reference<Opt /></>} htmlFor="p-ref"><input id="p-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g., RFP-2024-001" className={inputCls} /></Field>
        </div>
        <Field label="Template" hint="Optional: Select a template for PDF generation. Choose a Project Proposal template for detailed section editors.">
          <Select value={template} onChange={setTemplate} placeholder="Select template..." options={[...P_TEMPLATES, ...PP_TEMPLATES]} />
        </Field>
        <div className="flex items-center justify-between gap-4 rounded-lg border border-border p-3">
          <div>
            <p className="text-sm font-medium">Detailed proposal</p>
            <p className="text-xs text-muted-foreground">Adds a cover page, executive summary &amp; structured sections (objectives, approach, modules, investment, …).</p>
          </div>
          <Switch checked={detailed} onChange={setDetailed} label="Detailed proposal" />
        </div>
      </Section>
      <Section title="Cover Letter">
        <textarea aria-label="Cover letter" value={cover} onChange={(e) => setCover(e.target.value)} rows={4} placeholder="Write an introduction or cover letter for this proposal..." className={textareaCls} />
      </Section>
      <Section title={<>Line Items <Req /></>}>
        <LineItems lines={lines} setLines={setLines} />
      </Section>
      <Section title="Additional Details">
        <Field label={<>Notes<Opt /></>}><textarea aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." className={textareaCls} /></Field>
        <Field label={<>Terms &amp; Conditions<Opt /></>}><textarea aria-label="Terms and conditions" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Terms and conditions..." className={textareaCls} /></Field>
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Create Proposal</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------- sales orders ---------- */

const SO_BASE = "/ar/sales-orders";
const SO_STATUSES = ["DRAFT", "CONFIRMED", "PARTIALLY_DELIVERED", "DELIVERED", "INVOICED", "CANCELLED"];

export function SalesOrders() {
  const router = useRouter();
  const sub = subOf(usePathname(), SO_BASE);
  const orders = useCollection("sales-orders");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const close = () => router.push(SO_BASE);
  const detail = sub && sub !== "new" ? orders.find((o) => o.id === sub) : undefined;

  const columns: Column<Rec>[] = [
    { key: "num", header: "SO #", cell: (o) => <span className="font-mono text-sm">{String(o.number)}</span> },
    { key: "title", header: "Title", cell: (o) => <span className="font-medium">{String(o.title || "—")}</span> },
    { key: "cust", header: "Customer", cell: (o) => String(o.customer) },
    { key: "date", header: "Order Date", cell: (o) => longDate(o.date) },
    { key: "exp", header: "Expected Date", cell: (o) => (o.expectedDate ? longDate(o.expectedDate) : "—") },
    { key: "total", header: "Total", cell: (o) => money(num(o.total)) },
    { key: "status", header: "Status", cell: (o) => <StatusBadge status={o.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Sales Orders" subtitle="Manage sales orders and track fulfillment" actions={<Link href={`${SO_BASE}/new`} className={btn.primary}><Plus /> New Sales Order</Link>} />
      <ListCard q={q} setQ={setQ} placeholder="Search sales orders..." status={status} setStatus={setStatus} statuses={SO_STATUSES}>
        <DataTable columns={columns} rows={orders.filter((o) => match(o, q, status)).sort(byNewest)} onRowClick={(o) => router.push(`${SO_BASE}/${o.id}`)} emptyText="No sales orders found. Create your first sales order to get started." />
      </ListCard>
      {sub === "new" && (
        <SidePanel onClose={close}>
          <SalesOrderForm onDone={close} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <DocDetail
            key={detail.id}
            doc={detail}
            kind="Sales Order"
            onClose={close}
            meta={[["Title", String(detail.title || "—")], ["Order date", longDate(detail.date)], ["Expected delivery", detail.expectedDate ? longDate(detail.expectedDate) : "—"], ["Reference", String(detail.reference || "—")]]}
            actions={
              <>
                {detail.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => updateRecord("sales-orders", detail.id, { status: "CONFIRMED" })}>Confirm Order</button>}
                {["CONFIRMED", "PARTIALLY_DELIVERED"].includes(String(detail.status)) && (
                  <Link href={`/inventory/delivery-notes/new?so=${detail.id}`} className={btn.outline}>Create Delivery Note</Link>
                )}
                {["CONFIRMED", "PARTIALLY_DELIVERED", "DELIVERED"].includes(String(detail.status)) && (
                  <button
                    type="button"
                    className={btn.primary}
                    onClick={() => {
                      const id = invoiceFrom(detail, "salesOrderId");
                      updateRecord("sales-orders", detail.id, { status: "INVOICED" });
                      router.push(`/ar/invoices/${id}`);
                    }}
                  >
                    Create Invoice
                  </button>
                )}
                {["DRAFT", "CONFIRMED"].includes(String(detail.status)) && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => confirm("Cancel this order?") && updateRecord("sales-orders", detail.id, { status: "CANCELLED" })}>Cancel Order</button>}
              </>
            }
          />
        </SidePanel>
      )}
    </div>
  );
}

function SalesOrderForm({ onDone }: { onDone: () => void }) {
  const [preview] = useState(() => nextNumber("sales-orders", "SO"));
  const [customer, setCustomer] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(today());
  const [expectedDate, setExpected] = useState("");
  const [reference, setReference] = useState("");
  const [lines, setLines] = useState<DocLine[]>([blankLine()]);
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ls = validLines(lines);
    if (!customer || !date) return setError("Customer and order date are required.");
    if (!ls.length) return setError("Add at least one line item.");
    createRecord("sales-orders", { number: nextNumber("sales-orders", "SO"), customer, title: title.trim(), date, expectedDate, reference, lines: ls, notes, terms, total: docTotals(ls).total, status: "DRAFT" });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New Sales Order</h1>
        <p className="mt-1 text-muted-foreground">Create a new sales order</p>
      </div>
      <Section title="Order Details">
        <NumberBanner label="Order #" value={preview} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Customer <Req /></>}><CustomerPicker value={customer} onChange={setCustomer} /></Field>
          <Field label="Title" htmlFor="so-title"><input id="so-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Website Redesign Project" className={inputCls} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>Order Date <Req /></>}><DateInput value={date} onChange={setDate} /></Field>
          <Field label="Expected Delivery Date"><DateInput value={expectedDate} onChange={setExpected} /></Field>
          <Field label="Reference" htmlFor="so-ref"><input id="so-ref" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g., PO-2024-001" className={inputCls} /></Field>
        </div>
      </Section>
      <Section title="Line Items"><LineItems lines={lines} setLines={setLines} /></Section>
      <Section title="Additional Details">
        <Field label="Notes"><textarea aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." className={textareaCls} /></Field>
        <Field label="Terms & Conditions"><textarea aria-label="Terms and conditions" value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Terms and conditions..." className={textareaCls} /></Field>
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Create Sales Order</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </form>
  );
}

/* ---------- delivery notes ---------- */

const DN_BASE = "/inventory/delivery-notes";
const DN_STATUSES = ["DRAFT", "DISPATCHED", "DELIVERED", "CANCELLED"];
type DnLine = { productId: string; uom: string; qty: number; notes: string };

export function DeliveryNotes() {
  const router = useRouter();
  const sub = subOf(usePathname(), DN_BASE);
  const notes = useCollection("delivery-notes");
  const warehouses = useCollection("warehouses");
  const [status, setStatus] = useState("");
  const close = () => router.push(DN_BASE);
  const detail = sub && sub !== "new" ? notes.find((d) => d.id === sub) : undefined;
  const whName = (id: unknown) => String(warehouses.find((w) => w.id === id)?.name ?? "—");

  const columns: Column<Rec>[] = [
    { key: "num", header: "DN #", cell: (d) => <span className="font-mono text-sm">{String(d.number)}</span> },
    { key: "date", header: "Date", cell: (d) => longDate(d.date) },
    { key: "cust", header: "Customer", cell: (d) => String(d.customer) },
    { key: "wh", header: "Warehouse", cell: (d) => whName(d.warehouseId) },
    { key: "status", header: "Status", cell: (d) => <StatusBadge status={d.status} /> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Delivery Notes" subtitle="Track outbound goods deliveries to customers" actions={<Link href={`${DN_BASE}/new`} className={btn.primary}><Plus /> New Delivery Note</Link>} />
      <Select ariaLabel="Status" size="sm" value={status} onChange={setStatus} options={[{ value: "", label: "All Statuses" }, ...DN_STATUSES.map((s) => ({ value: s, label: s.charAt(0) + s.slice(1).toLowerCase() }))]} className="w-36" />
      <DataTable columns={columns} rows={notes.filter((d) => !status || d.status === status).sort(byNewest)} onRowClick={(d) => router.push(`${DN_BASE}/${d.id}`)} />
      {sub === "new" && (
        <SidePanel onClose={close}>
          <DeliveryNoteForm onDone={close} onCreated={(id, print) => router.push(`${DN_BASE}/${id}${print ? "?print=1" : ""}`)} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <DeliveryNoteView key={detail.id} note={detail} warehouse={whName(detail.warehouseId)} onClose={close} />
        </SidePanel>
      )}
    </div>
  );
}

function DeliveryNoteForm({ onDone, onCreated }: { onDone: () => void; onCreated: (id: string, print: boolean) => void }) {
  const products = useProducts();
  const moves = useMoves();
  const warehouses = useCollection("warehouses");
  const orders = useCollection("sales-orders");
  const customers = useCustomers();
  const search = useSearchParams();
  const [preset] = useState(() => search.get("so") ?? "");
  const [preview] = useState(() => nextNumber("delivery-notes", "DN"));
  const initialSo = readCollection("sales-orders").find((o) => o.id === preset);
  const [date, setDate] = useState(today());
  const [warehouseId, setWarehouse] = useState("");
  const [customer, setCustomer] = useState(String(initialSo?.customer ?? ""));
  const [soId, setSoId] = useState(preset);
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<DnLine[]>(() =>
    initialSo ? ((initialSo.lines as DocLine[]) ?? []).filter((l) => l.productId).map((l) => ({ productId: String(l.productId), uom: String(l.uom ?? ""), qty: l.qty, notes: "" })) : [{ productId: "", uom: "", qty: 0, notes: "" }],
  );
  const [error, setError] = useState("");
  const openOrders = orders.filter((o) => ["CONFIRMED", "PARTIALLY_DELIVERED"].includes(String(o.status)) && (!customer || o.customer === customer));
  const set = (i: number, patch: Partial<DnLine>) => setLines(lines.map((l, k) => (k === i ? { ...l, ...patch } : l)));

  function pickCustomer(name: string) {
    setCustomer(name);
    const c = customers.find((x) => x.name === name);
    const a = c?.address as Record<string, string> | undefined;
    if (a && !address) setAddress([a.line1, a.line2, a.city, a.state, a.postal].filter(Boolean).join(", "));
  }

  function save(print: boolean) {
    const ls = lines.filter((l) => l.productId && l.qty > 0);
    if (!warehouseId || !customer || !date) return setError("Delivery date, warehouse and customer are required.");
    if (!ls.length) return setError("Add at least one product with a quantity.");
    const dn = createRecord("delivery-notes", { number: nextNumber("delivery-notes", "DN"), date, warehouseId, customer, salesOrderId: soId, address, notes, lines: ls, status: "DRAFT" });
    if (soId) updateRecord("sales-orders", soId, { status: "PARTIALLY_DELIVERED" });
    onCreated(dn.id, print);
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); save(false); }} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Delivery Note</h1>
      <Section title="Delivery Details">
        <NumberBanner label="DN Number" value={preview} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Delivery Date<Req /></>}><DateInput value={date} onChange={setDate} /></Field>
          <Field label={<>Warehouse<Req /></>}>
            <RecordPicker items={warehouses} value={warehouseId} onChange={setWarehouse} placeholder="Select warehouse" getLabel={(w) => String(w.name)} getSub={(w) => String(w.code ?? "")} emptyText="No warehouses yet — add one under Inventory › Warehouses." />
          </Field>
          <Field label={<>Customer<Req /></>}><CustomerPicker value={customer} onChange={pickCustomer} placeholder="Select customer" /></Field>
          <Field label="Sales Order">
            <Select value={soId} onChange={setSoId} placeholder="None (manual delivery)" options={openOrders.map((o) => ({ value: o.id, label: `${o.number} — ${o.customer}` }))} />
          </Field>
        </div>
        <Field label="Shipping Address" htmlFor="dn-addr"><input id="dn-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter delivery address" className={inputCls} /></Field>
        <Field label="Notes"><textarea aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className={textareaCls} /></Field>
      </Section>
      <Section title="Line Items" action={<button type="button" onClick={() => setLines([...lines, { productId: "", uom: "", qty: 0, notes: "" }])} className={btn.smOutline}><Plus /> Add Line</button>}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="pb-2 font-medium">Product<Req /></th>
              <th className="w-16 pb-2 font-medium">UOM</th>
              <th className="w-24 pb-2 font-medium">Quantity<Req /></th>
              <th className="w-20 pb-2 font-medium">Available</th>
              <th className="pb-2 font-medium">Notes</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {lines.map((l, i) => {
              const p = products.find((x) => x.id === l.productId);
              return (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-1.5 pr-2">
                    <RecordPicker size="sm" items={products} value={l.productId} onChange={(pid) => set(i, { productId: pid, uom: String(products.find((x) => x.id === pid)?.uom ?? "") })} placeholder="Select product" getLabel={(x) => String(x.name)} emptyText="No products yet — add one under Inventory › Products." />
                  </td>
                  <td className="py-1.5 text-muted-foreground">{l.uom || "-"}</td>
                  <td className="py-1.5 pr-2"><input aria-label="Quantity" type="number" min="0" value={l.qty || ""} onChange={(e) => set(i, { qty: Number(e.target.value) || 0 })} placeholder="0.00" className={cn(inputCls, "h-8 text-right")} /></td>
                  <td className="py-1.5 text-muted-foreground">{p ? (warehouseId ? onHand(p.id, warehouseId, moves) : "—") : "—"}</td>
                  <td className="py-1.5 pr-2"><input aria-label="Line notes" value={l.notes} onChange={(e) => set(i, { notes: e.target.value })} placeholder="Optional" className={cn(inputCls, "h-8")} /></td>
                  <td className="py-1.5">
                    <button type="button" aria-label="Remove line" disabled={lines.length <= 1} onClick={() => setLines(lines.filter((_, k) => k !== i))} className={cn(btn.icon, "h-7 w-7")}>
                      <Trash2 className="!size-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Create Delivery Note</button>
        <button type="button" onClick={() => save(true)} className={btn.outline}><Printer /> Create &amp; Print</button>
        <button type="button" onClick={onDone} className={btn.ghost}>Cancel</button>
      </div>
    </form>
  );
}

function DeliveryNoteView({ note, warehouse, onClose }: { note: Rec; warehouse: string; onClose: () => void }) {
  const products = useProducts();
  // "Create & Print" lands here with ?print=1.
  const printNow = useSearchParams().get("print") === "1";
  useEffect(() => {
    if (!printNow) return;
    const t = setTimeout(() => window.print(), 300);
    return () => clearTimeout(t);
  }, [printNow]);
  const lines = (note.lines as DnLine[]) ?? [];
  const advance = (status: string) => {
    // Goods leave stock (and cost of sales posts) the first time the note is dispatched or delivered.
    if (note.status === "DRAFT" && ["DISPATCHED", "DELIVERED"].includes(status)) {
      if (!note.warehouseId) return alert("This delivery note has no warehouse — set one before dispatching.");
      shipStock({ date: today(), warehouseId: String(note.warehouseId), reference: String(note.number), lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })) });
    }
    updateRecord("delivery-notes", note.id, { status });
    if (status === "DELIVERED" && note.salesOrderId) {
      const others = readCollection("delivery-notes").filter((d) => d.salesOrderId === note.salesOrderId && d.id !== note.id);
      if (others.every((d) => d.status === "DELIVERED")) updateRecord("sales-orders", String(note.salesOrderId), { status: "DELIVERED" });
    }
  };
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Delivery Note {String(note.number)}</h1>
          <p className="mt-1 text-muted-foreground">{String(note.customer)} · {longDate(note.date)} · {warehouse}</p>
        </div>
        <StatusBadge status={note.status} />
      </div>
      <Section title="Items">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 font-medium">UOM</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 pl-4 font-medium">Notes</th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2">{String(products.find((p) => p.id === l.productId)?.name ?? "—")}</td>
                <td className="py-2">{l.uom || "-"}</td>
                <td className="py-2 text-right tabular-nums">{l.qty}</td>
                <td className="py-2 pl-4 text-muted-foreground">{l.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {note.address ? <p className="text-sm text-muted-foreground">Ship to: {String(note.address)}</p> : null}
      </Section>
      <div className="flex flex-wrap gap-2">
        {note.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => advance("DISPATCHED")}>Mark Dispatched</button>}
        {["DRAFT", "DISPATCHED"].includes(String(note.status)) && <button type="button" className={btn.outline} onClick={() => advance("DELIVERED")}>Mark Delivered</button>}
        <button type="button" className={btn.outline} onClick={() => window.print()}><Printer /> Print</button>
        {note.status === "DRAFT" && <DeleteButton collection="delivery-notes" id={note.id} onDone={onClose} />}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- shared detail view ---------- */

function DeleteButton({ collection, id, onDone }: { collection: string; id: string; onDone: () => void }) {
  return (
    <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => { if (confirm("Delete this draft?")) { deleteRecord(collection, id); onDone(); } }}>
      Delete
    </button>
  );
}

function DocDetail({ doc, kind, meta, actions, onClose }: { doc: Rec; kind: string; meta: [string, string][]; actions: React.ReactNode; onClose: () => void }) {
  const lines = (doc.lines as DocLine[]) ?? [];
  const t = docTotals(lines);
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{kind} {String(doc.number)}</h1>
          <p className="mt-1 text-muted-foreground">{String(doc.customer)}</p>
        </div>
        <StatusBadge status={doc.status} />
      </div>
      <Card>
        <dl className="grid gap-3 p-6 text-sm sm:grid-cols-2">
          {meta.map(([k, v]) => (
            <div key={k}>
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Section title="Line Items">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Description</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Unit Price</th><th className="py-2 text-right font-medium">Total</th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2">{l.description}</td>
                <td className="py-2 text-right tabular-nums">{l.qty} {l.uom}</td>
                <td className="py-2 text-right tabular-nums">{money(l.unitPrice)}</td>
                <td className="py-2 text-right tabular-nums">{money(l.qty * l.unitPrice)}</td>
              </tr>
            ))}
            <tr className="font-semibold"><td className="py-2" colSpan={3}>Total</td><td className="py-2 text-right tabular-nums">{money(t.total)}</td></tr>
          </tbody>
        </table>
        {doc.notes ? <p className="text-sm text-muted-foreground">{String(doc.notes)}</p> : null}
      </Section>
      <div className="flex flex-wrap gap-2">
        {actions}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
