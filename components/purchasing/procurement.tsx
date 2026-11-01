"use client";

// Requisition → RFQ → Purchase Order → Goods Receipt → (Bill), plus blanket agreements and returns.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { grnTotals, poProgress, poTotal, postGrn, vendorPrice, type GrnLine, type PoLine } from "@/lib/purchases";
import { returnToVendor } from "@/lib/stock";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Card, DataTable, DateInput, Dialog, Field, PageHeader, Select, SidePanel, btn, inputCls, longDate, money, num, today, type Column } from "@/components/accounting/kit";
import { NumberBanner, Req, Section, StatusBadge } from "@/components/sales/doc-kit";
import { CountedTextarea, EmptyCard, LineGrid, ListToolbar, ProductPicker, StatusFilter, TotalRow, VendorPicker, WarehousePicker, label, numInput, subOf, textInput, useWarehouses, type GridCol } from "./kit";

const useProducts = () => useCollection("products");
const productName = (products: Rec[], id: unknown) => String(products.find((p) => p.id === id)?.name ?? "—");
const byNewest = (a: Rec, b: Rec) => String(b.createdAt).localeCompare(String(a.createdAt));
const textMatch = (q: string, ...vals: unknown[]) => !q.trim() || vals.join(" ").toLowerCase().includes(q.trim().toLowerCase());

function DetailHeader({ title, subtitle, status }: { title: string; subtitle?: string; status: unknown }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn(btn.smOutline, "rounded-full")}>
      <ArrowLeft /> Back
    </button>
  );
}

/* ---------- purchase requisitions ---------- */

const PR_BASE = "/inventory/purchase-requisitions";
const PR_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "PARTIALLY_CONVERTED", "FULLY_CONVERTED", "CANCELLED", "CLOSED"];
const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
type PrLine = { productId: string; description: string; qty: number; uom: string; estPrice: number; vendor: string };

export function PurchaseRequisitions() {
  const router = useRouter();
  const sub = subOf(usePathname(), PR_BASE);
  const prs = useCollection("purchase-requisitions");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const close = () => router.push(PR_BASE);
  const rows = prs.filter((r) => (!status || r.status === status) && (!priority || r.priority === priority) && textMatch(q, r.number, r.title)).sort(byNewest);
  const columns: Column<Rec>[] = [
    { key: "num", header: "PR #", cell: (r) => <span className="font-mono text-sm">{String(r.number)}</span> },
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{String(r.title)}</span> },
    { key: "by", header: "Requested By", cell: (r) => String(r.requestedBy) },
    { key: "pri", header: "Priority", cell: (r) => label(String(r.priority)) },
    { key: "req", header: "Required By", cell: (r) => (r.requiredBy ? longDate(r.requiredBy) : "—") },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];
  const detail = sub && sub !== "new" ? prs.find((r) => r.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Purchase Requisitions" subtitle="Internal purchase requests with approval workflow" actions={<Link href={`${PR_BASE}/new`} className={btn.primary}><Plus /> New Requisition</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by PR # or title...">
        <StatusFilter value={status} onChange={setStatus} statuses={PR_STATUSES} />
        <Select ariaLabel="Priority" size="sm" value={priority} onChange={setPriority} options={[{ value: "", label: "All priorities" }, ...PRIORITIES]} className="w-36" />
      </ListToolbar>
      <DataTable columns={columns} rows={rows} onRowClick={(r) => router.push(`${PR_BASE}/${r.id}`)} />
      {sub === "new" && <SidePanel onClose={close}><RequisitionForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><RequisitionView key={detail.id} pr={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

function RequisitionForm({ onDone }: { onDone: () => void }) {
  const [preview] = useState(() => nextNumber("purchase-requisitions", "PR"));
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [requiredBy, setRequiredBy] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PrLine[]>([{ productId: "", description: "", qty: 1, uom: "", estPrice: 0, vendor: "" }]);
  const [error, setError] = useState("");
  const valid = lines.filter((l) => l.productId && l.qty > 0);
  const total = valid.reduce((s, l) => s + l.qty * l.estPrice, 0);

  function save(status: string) {
    if (!title.trim()) return setError("Title is required.");
    if (!valid.length) return setError("Add at least one product line.");
    createRecord("purchase-requisitions", { number: nextNumber("purchase-requisitions", "PR"), title: title.trim(), priority, requiredBy, notes, lines: valid, total, requestedBy: BRAND.user.fullName, status });
    onDone();
  }

  const cols: GridCol<PrLine>[] = [
    { key: "p", header: <>Product<Req /></>, width: "26%", render: (l, set) => <ProductPicker value={l.productId} onChange={(id, p) => set({ productId: id, uom: String(p.uom ?? ""), estPrice: num(p.cost) || l.estPrice, description: l.description || String(p.description ?? "") })} /> },
    { key: "d", header: "Description", render: (l, set) => textInput(l.description, (v) => set({ description: v }), "Description") },
    { key: "q", header: "Qty", width: "4.5rem", render: (l, set) => numInput(l.qty, (v) => set({ qty: v }), "Quantity") },
    { key: "u", header: "UOM", width: "3.5rem", render: (l) => <span className="text-muted-foreground">{l.uom || "-"}</span> },
    { key: "e", header: "Est. Price", width: "6rem", render: (l, set) => numInput(l.estPrice, (v) => set({ estPrice: v }), "Estimated price", "0.00") },
    { key: "v", header: "Preferred Vendor", width: "22%", render: (l, set) => <VendorPicker value={l.vendor} onChange={(v) => set({ vendor: v })} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">New Purchase Requisition</h1>
        <BackButton onClick={onDone} />
      </div>
      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Section title="Details">
          <NumberBanner compact label="Requisition #" value={preview} />
          <Field label={<>Title <Req /></>} htmlFor="pr-title"><input id="pr-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Office Furniture Request" className={inputCls} /></Field>
          <Field label="Priority" className="w-40"><Select ariaLabel="Priority" value={priority} onChange={setPriority} options={PRIORITIES.map((p) => ({ value: p, label: label(p) }))} /></Field>
          <Field label="Required By"><DateInput value={requiredBy} onChange={setRequiredBy} /></Field>
          <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} /></Field>
        </Section>
        <Section title="Summary">
          <p className="text-2xl font-bold tabular-nums">{money(total)}</p>
          <p className="text-sm text-muted-foreground">Estimated total ({valid.length} item{valid.length === 1 ? "" : "s"})</p>
        </Section>
      </div>
      <Section title="Line Items">
        <LineGrid lines={lines} setLines={setLines} cols={cols} blank={() => ({ productId: "", description: "", qty: 1, uom: "", estPrice: 0, vendor: "" })} addInHeader />
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => save("DRAFT")} className={btn.outline}>Save as Draft</button>
        <button type="button" onClick={() => save("PENDING_APPROVAL")} className={btn.primary}>Submit for Approval</button>
      </div>
    </div>
  );
}

function RequisitionView({ pr, onClose }: { pr: Rec; onClose: () => void }) {
  const router = useRouter();
  const products = useProducts();
  const lines = (pr.lines as PrLine[]) ?? [];
  const set = (status: string) => updateRecord("purchase-requisitions", pr.id, { status });

  // One draft PO per preferred vendor; lines without a vendor stay on the requisition.
  function convert() {
    const groups = new Map<string, PrLine[]>();
    for (const l of lines) if (l.vendor) groups.set(l.vendor, [...(groups.get(l.vendor) ?? []), l]);
    if (!groups.size) return alert("Pick a preferred vendor on at least one line before converting.");
    for (const [vendor, ls] of groups) {
      const poLines: PoLine[] = ls.map((l) => ({ productId: l.productId, description: l.description, qty: l.qty, uom: l.uom, unitPrice: l.estPrice }));
      createRecord("purchase-orders", { number: nextNumber("purchase-orders", "PO"), vendor, date: today(), expectedDate: pr.requiredBy, lines: poLines, total: poTotal(poLines), receivedQty: [], status: "DRAFT", requisitionId: pr.id, notes: `From ${pr.number}` });
    }
    set(groups.size && lines.every((l) => l.vendor) ? "FULLY_CONVERTED" : "PARTIALLY_CONVERTED");
    router.push("/inventory/purchase-orders");
  }

  return (
    <div className="space-y-4">
      <DetailHeader title={`Requisition ${pr.number}`} subtitle={`${pr.title} · ${label(String(pr.priority))} priority`} status={pr.status} />
      <Section title="Lines">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Est. Price</th><th className="py-2 pl-4 font-medium">Preferred Vendor</th></tr></thead>
          <tbody>{lines.map((l, i) => <tr key={i} className="border-b border-border/60"><td className="py-2">{productName(products, l.productId)}</td><td className="py-2 text-right">{l.qty} {l.uom}</td><td className="py-2 text-right tabular-nums">{money(l.estPrice)}</td><td className="py-2 pl-4">{l.vendor || "—"}</td></tr>)}</tbody>
        </table>
        <TotalRow label="Estimated total" value={num(pr.total)} strong />
      </Section>
      <div className="flex flex-wrap gap-2">
        {pr.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => set("PENDING_APPROVAL")}>Submit for Approval</button>}
        {pr.status === "PENDING_APPROVAL" && (
          <>
            <button type="button" className={btn.primary} onClick={() => set("APPROVED")}>Approve</button>
            <button type="button" className={btn.outline} onClick={() => set("REJECTED")}>Reject</button>
          </>
        )}
        {["APPROVED", "PARTIALLY_CONVERTED"].includes(String(pr.status)) && <button type="button" className={btn.primary} onClick={convert}>Convert to Purchase Orders</button>}
        {["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(String(pr.status)) && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => set("CANCELLED")}>Cancel</button>}
        {pr.status === "DRAFT" && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => { deleteRecord("purchase-requisitions", pr.id); onClose(); }}>Delete</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- RFQs ---------- */

const RFQ_BASE = "/inventory/rfqs";
const RFQ_STATUSES = ["DRAFT", "SENT", "PARTIALLY_RESPONDED", "RESPONDED", "UNDER_EVALUATION", "AWARDED", "NOT_AWARDED", "CANCELLED", "CLOSED"];
type RfqLine = { productId: string; description: string; qty: number; uom: string; specs: string };

export function Rfqs() {
  const router = useRouter();
  const sub = subOf(usePathname(), RFQ_BASE);
  const rfqs = useCollection("rfqs");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const close = () => router.push(RFQ_BASE);
  const columns: Column<Rec>[] = [
    { key: "num", header: "RFQ #", cell: (r) => <span className="font-mono text-sm">{String(r.number)}</span> },
    { key: "title", header: "Title", cell: (r) => <span className="font-medium">{String(r.title)}</span> },
    { key: "v", header: "Vendors", cell: (r) => ((r.vendors as string[]) ?? []).length },
    { key: "dl", header: "Deadline", cell: (r) => (r.deadline ? longDate(r.deadline) : "—") },
    { key: "status", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];
  const detail = sub && sub !== "new" ? rfqs.find((r) => r.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Requests for Quotation" subtitle="Request and compare vendor quotations" actions={<Link href={`${RFQ_BASE}/new`} className={btn.primary}><Plus /> New RFQ</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by RFQ # or title..."><StatusFilter value={status} onChange={setStatus} statuses={RFQ_STATUSES} /></ListToolbar>
      <DataTable columns={columns} rows={rfqs.filter((r) => (!status || r.status === status) && textMatch(q, r.number, r.title)).sort(byNewest)} onRowClick={(r) => router.push(`${RFQ_BASE}/${r.id}`)} />
      {sub === "new" && <SidePanel onClose={close}><RfqForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><RfqView key={detail.id} rfq={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

function RfqForm({ onDone }: { onDone: () => void }) {
  const [preview] = useState(() => nextNumber("rfqs", "RFQ"));
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [vendors, setVendors] = useState<string[]>([]);
  const [lines, setLines] = useState<RfqLine[]>([{ productId: "", description: "", qty: 1, uom: "", specs: "" }]);
  const [error, setError] = useState("");

  function save(status: string) {
    const ls = lines.filter((l) => l.productId && l.qty > 0);
    if (!title.trim()) return setError("Title is required.");
    if (!ls.length) return setError("Add at least one product to quote.");
    if (status === "SENT" && !vendors.length) return setError("Invite at least one vendor before sending.");
    createRecord("rfqs", { number: nextNumber("rfqs", "RFQ"), title: title.trim(), deadline, notes, vendors, lines: ls, quotes: {}, status });
    onDone();
  }

  const cols: GridCol<RfqLine>[] = [
    { key: "p", header: <>Product <Req /></>, width: "30%", render: (l, set) => <ProductPicker value={l.productId} onChange={(id, p) => set({ productId: id, uom: String(p.uom ?? "") })} /> },
    { key: "d", header: "Description", render: (l, set) => textInput(l.description, (v) => set({ description: v }), "Description") },
    { key: "q", header: "Qty", width: "4.5rem", render: (l, set) => numInput(l.qty, (v) => set({ qty: v }), "Quantity") },
    { key: "u", header: "UOM", width: "3.5rem", render: (l) => <span className="text-muted-foreground">{l.uom || "-"}</span> },
    { key: "s", header: "Specs", width: "22%", render: (l, set) => textInput(l.specs, (v) => set({ specs: v }), "Specs") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">New Request for Quotation</h1>
        <BackButton onClick={onDone} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Details">
          <NumberBanner compact label="RFQ #" value={preview} />
          <Field label={<>Title <Req /></>} htmlFor="rfq-title"><input id="rfq-title" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Office Furniture Quotation" className={inputCls} /></Field>
          <Field label="Response Deadline"><DateInput value={deadline} onChange={setDeadline} /></Field>
          <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} /></Field>
        </Section>
        <Section title={`Invite Vendors (${vendors.length})`}>
          <VendorPicker value="" onChange={(v) => v && !vendors.includes(v) && setVendors([...vendors, v])} />
          <div className="flex flex-wrap gap-1.5">
            {vendors.map((v) => (
              <span key={v} className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs">
                {v}
                <button type="button" aria-label={`Remove ${v}`} onClick={() => setVendors(vendors.filter((x) => x !== v))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        </Section>
      </div>
      <Section title="Items to Quote">
        <LineGrid lines={lines} setLines={setLines} cols={cols} blank={() => ({ productId: "", description: "", qty: 1, uom: "", specs: "" })} addInHeader />
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => save("DRAFT")} className={btn.outline}>Save as Draft</button>
        <button type="button" onClick={() => save("SENT")} className={btn.primary}>Create &amp; Send</button>
      </div>
    </div>
  );
}

// Quote grid: one column per invited vendor, unit price per line; award creates the PO.
function RfqView({ rfq, onClose }: { rfq: Rec; onClose: () => void }) {
  const router = useRouter();
  const products = useProducts();
  const lines = (rfq.lines as RfqLine[]) ?? [];
  const vendors = (rfq.vendors as string[]) ?? [];
  const quotes = (rfq.quotes as Record<string, number[]>) ?? {};
  const totalFor = (v: string) => lines.reduce((s, l, i) => s + l.qty * num(quotes[v]?.[i]), 0);
  const quoted = vendors.filter((v) => (quotes[v] ?? []).some((p) => num(p) > 0));
  const best = quoted.length ? quoted.reduce((a, b) => (totalFor(a) <= totalFor(b) ? a : b)) : "";

  function setPrice(v: string, i: number, price: number) {
    const next = { ...quotes, [v]: lines.map((_, k) => (k === i ? price : num(quotes[v]?.[k]))) };
    const responded = vendors.filter((x) => (next[x] ?? []).some((p) => num(p) > 0)).length;
    updateRecord("rfqs", rfq.id, { quotes: next, status: ["DRAFT", "AWARDED", "CANCELLED", "CLOSED"].includes(String(rfq.status)) ? rfq.status : responded === vendors.length ? "RESPONDED" : responded ? "PARTIALLY_RESPONDED" : "SENT" });
  }

  function award(v: string) {
    const poLines: PoLine[] = lines.map((l, i) => ({ productId: l.productId, description: l.description, qty: l.qty, uom: l.uom, unitPrice: num(quotes[v]?.[i]) }));
    const po = createRecord("purchase-orders", { number: nextNumber("purchase-orders", "PO"), vendor: v, date: today(), lines: poLines, total: poTotal(poLines), receivedQty: [], status: "DRAFT", rfqId: rfq.id, notes: `Awarded from ${rfq.number}` });
    updateRecord("rfqs", rfq.id, { status: "AWARDED", awardedTo: v, poId: po.id });
    router.push(`/inventory/purchase-orders/${po.id}`);
  }

  const editable = !["AWARDED", "CANCELLED", "CLOSED", "DRAFT"].includes(String(rfq.status));
  return (
    <div className="space-y-4">
      <DetailHeader title={`RFQ ${rfq.number}`} subtitle={`${rfq.title}${rfq.deadline ? ` · responses due ${longDate(rfq.deadline)}` : ""}`} status={rfq.status} />
      <Section title="Quotes">
        {vendors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vendors invited.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Item</th>
                  <th className="py-2 text-right font-medium">Qty</th>
                  {vendors.map((v) => <th key={v} className={cn("px-2 py-2 text-right font-medium", v === best && "text-success")}>{v}</th>)}
                </tr>
              </thead>
              <tbody>
                {lines.map((l, i) => (
                  <tr key={i} className="border-b border-border/60">
                    <td className="py-1.5">{productName(products, l.productId)}{l.specs ? <span className="block text-xs text-muted-foreground">{l.specs}</span> : null}</td>
                    <td className="py-1.5 text-right">{l.qty} {l.uom}</td>
                    {vendors.map((v) => (
                      <td key={v} className="w-32 px-2 py-1.5">
                        {editable ? numInput(num(quotes[v]?.[i]), (p) => setPrice(v, i, p), `${v} unit price`, "Unit price") : <span className="block text-right tabular-nums">{money(num(quotes[v]?.[i]))}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td className="py-2" colSpan={2}>Total</td>
                  {vendors.map((v) => <td key={v} className={cn("px-2 py-2 text-right tabular-nums", v === best && "text-success")}>{money(totalFor(v))}</td>)}
                </tr>
              </tbody>
            </table>
          </div>
        )}
        {editable && <p className="text-xs text-muted-foreground">Enter each vendor&apos;s quoted unit prices as they come in. The lowest total is highlighted.</p>}
      </Section>
      <div className="flex flex-wrap gap-2">
        {rfq.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => updateRecord("rfqs", rfq.id, { status: "SENT" })}>Send to vendors</button>}
        {editable && quoted.map((v) => <button key={v} type="button" className={v === best ? btn.primary : btn.outline} onClick={() => award(v)}>Award to {v}</button>)}
        {rfq.poId ? <Link href={`/inventory/purchase-orders/${rfq.poId}`} className={btn.outline}>Open purchase order</Link> : null}
        {editable && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => updateRecord("rfqs", rfq.id, { status: "CANCELLED" })}>Cancel RFQ</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- purchase orders ---------- */

const PO_BASE = "/inventory/purchase-orders";
const PO_STATUSES = ["DRAFT", "APPROVED", "SENT", "PARTIALLY_RECEIVED", "FULLY_RECEIVED", "PARTIALLY_BILLED", "FULLY_BILLED", "CANCELLED", "CLOSED"];

export function PurchaseOrders() {
  const router = useRouter();
  const sub = subOf(usePathname(), PO_BASE);
  const pos = useCollection("purchase-orders");
  useCollection("bills"); // keep billing progress live
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const close = () => router.push(PO_BASE);
  const columns: Column<Rec>[] = [
    { key: "num", header: "PO #", cell: (p) => <span className="font-mono text-sm">{String(p.number)}</span> },
    { key: "date", header: "Date", cell: (p) => longDate(p.date) },
    { key: "total", header: "Total", cell: (p) => money(num(p.total)) },
    { key: "status", header: "Status", cell: (p) => <StatusBadge status={p.status} /> },
    { key: "rec", header: "Receipt", cell: (p) => poProgress(p).receipt },
    { key: "bill", header: "Billing", cell: (p) => poProgress(p).billing },
  ];
  const detail = sub && sub !== "new" ? pos.find((p) => p.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Purchase Orders" actions={<Link href={`${PO_BASE}/new`} className={btn.primary}><Plus /> New PO</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by PO #..."><StatusFilter value={status} onChange={setStatus} statuses={PO_STATUSES} /></ListToolbar>
      <DataTable columns={columns} rows={pos.filter((p) => (!status || p.status === status) && textMatch(q, p.number, p.vendor)).sort(byNewest)} onRowClick={(p) => router.push(`${PO_BASE}/${p.id}`)} />
      {sub === "new" && <SidePanel onClose={close}><PoForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><PoView key={detail.id} po={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

type Charge = { type: string; amount: number };

function ChargesSection({ charges, setCharges }: { charges: Charge[]; setCharges: (c: Charge[]) => void }) {
  const types = useCollection("purchase-charges");
  return (
    <Section title="Additional Charges" action={<button type="button" disabled={!types.length} onClick={() => setCharges([...charges, { type: String(types[0]?.name ?? ""), amount: 0 }])} className={btn.smOutline}><Plus /> Add Charge</button>}>
      {types.length === 0 && <p className="text-sm text-muted-foreground">No charge types yet. Add Shipping, Freight and similar under Settings → Purchase Charges.</p>}
      {charges.map((c, i) => (
        <div key={i} className="flex gap-2">
          <Select ariaLabel="Charge type" value={c.type} onChange={(v) => setCharges(charges.map((x, k) => (k === i ? { ...x, type: v } : x)))} options={types.map((t) => String(t.name))} className="flex-1" />
          <div className="w-32">{numInput(c.amount, (v) => setCharges(charges.map((x, k) => (k === i ? { ...x, amount: v } : x))), "Charge amount", "0.00")}</div>
          <button type="button" aria-label="Remove charge" onClick={() => setCharges(charges.filter((_, k) => k !== i))} className={btn.icon}><X /></button>
        </div>
      ))}
    </Section>
  );
}

function PoForm({ onDone }: { onDone: () => void }) {
  const preset = useSearchParams();
  const [preview] = useState(() => nextNumber("purchase-orders", "PO"));
  const [vendor, setVendor] = useState(preset.get("vendor") ?? "");
  const [date, setDate] = useState(today());
  const [warehouseId, setWarehouse] = useState("");
  const [expectedDate, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PoLine[]>([{ productId: "", qty: 1, unitPrice: 0 }]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [error, setError] = useState("");
  const productsTotal = poTotal(lines);

  // Vendor price list fills the unit price when product, vendor and quantity line up.
  const priced = (l: PoLine, v = vendor) => {
    const vp = v && l.productId ? vendorPrice(v, l.productId, date, l.qty) : undefined;
    return vp ? { ...l, unitPrice: num(vp.price) } : l;
  };

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ls = lines.filter((l) => l.productId && l.qty > 0);
    if (!vendor || !date || !warehouseId) return setError("Vendor, order date and warehouse are required.");
    if (!ls.length || ls.some((l) => l.unitPrice <= 0)) return setError("Every line needs a product, quantity and unit price.");
    createRecord("purchase-orders", { number: nextNumber("purchase-orders", "PO"), vendor, date, warehouseId, expectedDate, notes, lines: ls, charges, total: poTotal(ls, charges), receivedQty: [], status: "DRAFT" });
    onDone();
  }

  const cols: GridCol<PoLine>[] = [
    { key: "p", header: <>Product <Req /></>, width: "32%", render: (l, set) => <ProductPicker value={l.productId} placeholder="Select product" onChange={(id, p) => set(priced({ ...l, productId: id, uom: String(p.uom ?? ""), unitPrice: num(p.cost) || l.unitPrice }))} /> },
    { key: "q", header: <>Quantity <Req /></>, width: "5.5rem", render: (l, set) => numInput(l.qty, (v) => set(priced({ ...l, qty: v })), "Quantity") },
    { key: "u", header: "UOM", width: "3.5rem", render: (l) => <span className="text-muted-foreground">{l.uom || "-"}</span> },
    { key: "pr", header: <span className="leading-tight">Unit Price <Req /><span className="block text-[10px] font-normal">incl. tax</span></span>, width: "7rem", render: (l, set) => numInput(l.unitPrice, (v) => set({ unitPrice: v }), "Unit price", "0.000") },
    { key: "m", header: "Markup %", width: "5.5rem", render: (l, set) => numInput(l.markupPct, (v) => set({ markupPct: v }), "Markup percent", "—") },
    { key: "t", header: "Total", width: "6rem", render: (l) => <span className="block text-right font-medium tabular-nums">{money(l.qty * l.unitPrice)}</span> },
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Purchase Order</h1>
      <Section title="Order Details">
        <NumberBanner label="PO #" value={preview} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Vendor <Req /></>}><VendorPicker value={vendor} onChange={(v) => { setVendor(v); setLines(lines.map((l) => priced(l, v))); }} placeholder="Select vendor" /></Field>
          <Field label={<>Order Date <Req /></>}><DateInput value={date} onChange={setDate} /></Field>
          <Field label={<>Deliver to Warehouse <Req /></>}><WarehousePicker value={warehouseId} onChange={setWarehouse} /></Field>
          <Field label="Expected Delivery Date"><DateInput value={expectedDate} onChange={setExpected} /></Field>
        </div>
        <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} /></Field>
      </Section>
      <Section title="Line Items">
        <LineGrid lines={lines} setLines={setLines} cols={cols} blank={() => ({ productId: "", qty: 1, unitPrice: 0 })} addInHeader footer={<div className="rounded-md bg-muted/60"><TotalRow label="Products Total (incl. tax)" value={productsTotal} strong /></div>} />
      </Section>
      <ChargesSection charges={charges} setCharges={setCharges} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Create Purchase Order</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </form>
  );
}

function PoView({ po, onClose }: { po: Rec; onClose: () => void }) {
  const products = useProducts();
  const warehouses = useWarehouses();
  const lines = (po.lines as PoLine[]) ?? [];
  const received = (po.receivedQty as number[]) ?? [];
  const pr = poProgress(po);
  const set = (status: string) => updateRecord("purchase-orders", po.id, { status });
  const receivable = ["APPROVED", "SENT", "PARTIALLY_RECEIVED", "PARTIALLY_BILLED"].includes(String(po.status)) && pr.receipt !== "Received";
  const billable = !["DRAFT", "CANCELLED", "CLOSED", "FULLY_BILLED"].includes(String(po.status)) && pr.billing !== "Billed";
  return (
    <div className="space-y-4">
      <DetailHeader title={`Purchase Order ${po.number}`} subtitle={`${po.vendor} · ${longDate(po.date)} · ${String(warehouses.find((w) => w.id === po.warehouseId)?.name ?? "—")}`} status={po.status} />
      <Section title="Lines">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 text-right font-medium">Ordered</th><th className="py-2 text-right font-medium">Received</th><th className="py-2 text-right font-medium">Unit Price</th><th className="py-2 text-right font-medium">Total</th></tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2">{productName(products, l.productId)}{num(l.markupPct) > 0 && <span className="ml-1 text-xs text-muted-foreground">(+{num(l.markupPct)}% markup)</span>}</td>
                <td className="py-2 text-right">{l.qty} {l.uom}</td>
                <td className="py-2 text-right">{num(received[i])}</td>
                <td className="py-2 text-right tabular-nums">{money(l.unitPrice)}</td>
                <td className="py-2 text-right tabular-nums">{money(l.qty * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {((po.charges as Charge[]) ?? []).map((c, i) => <TotalRow key={i} label={c.type} value={c.amount} />)}
        <TotalRow label="Total" value={num(po.total)} strong />
        <p className="text-xs text-muted-foreground">Receipt: {pr.receipt} · Billing: {pr.billing}{pr.billed ? ` (${money(pr.billed)})` : ""}</p>
      </Section>
      <div className="flex flex-wrap gap-2">
        {po.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => set("APPROVED")}>Approve</button>}
        {po.status === "APPROVED" && <button type="button" className={btn.outline} onClick={() => set("SENT")}>Mark as Sent</button>}
        {receivable && <Link href={`/inventory/grn/new?po=${po.id}`} className={btn.primary}>Receive Goods</Link>}
        {billable && <Link href={`/ap/bills/new?po=${po.id}`} className={btn.outline}>Create Bill</Link>}
        {["DRAFT", "APPROVED", "SENT"].includes(String(po.status)) && pr.received === 0 && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => confirm("Cancel this purchase order?") && set("CANCELLED")}>Cancel PO</button>}
        {!["DRAFT", "CANCELLED", "CLOSED"].includes(String(po.status)) && <button type="button" className={btn.outline} onClick={() => set("CLOSED")}>Close PO</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- purchase agreements (blanket orders) ---------- */

const PA_BASE = "/inventory/purchase-agreements";
const PA_STATUSES = ["DRAFT", "ACTIVE", "CLOSED", "CANCELLED"];
type PaLine = { productId: string; qty: number; unitPrice: number; released?: number };

export function PurchaseAgreements() {
  const router = useRouter();
  const sub = subOf(usePathname(), PA_BASE);
  const agreements = useCollection("purchase-agreements");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState(false);
  const close = () => router.push(PA_BASE);
  const rows = agreements.filter((a) => (!status || a.status === status) && textMatch(q, a.number, a.title, a.vendor)).sort(byNewest);
  const columns: Column<Rec>[] = [
    { key: "num", header: "Agreement #", cell: (a) => <span className="font-mono text-sm">{String(a.number)}</span> },
    { key: "title", header: "Title", cell: (a) => <span className="font-medium">{String(a.title || "—")}</span> },
    { key: "v", header: "Vendor", cell: (a) => String(a.vendor) },
    { key: "p", header: "Period", cell: (a) => `${longDate(a.startDate)} – ${longDate(a.endDate)}` },
    { key: "r", header: "Released", cell: (a) => { const ls = (a.lines as PaLine[]) ?? []; return `${ls.reduce((s, l) => s + num(l.released), 0)} / ${ls.reduce((s, l) => s + l.qty, 0)}`; } },
    { key: "s", header: "Status", cell: (a) => <StatusBadge status={a.status} /> },
  ];
  const detail = sub ? agreements.find((a) => a.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Blanket Orders" subtitle="Purchase agreements: agreed quantities and prices per vendor for a period — release POs against them as needed." actions={<button type="button" onClick={() => setOpen(true)} className={btn.primary}><Plus /> New agreement</button>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by number, title or vendor..."><StatusFilter value={status} onChange={setStatus} statuses={PA_STATUSES} /></ListToolbar>
      {rows.length === 0 ? <EmptyCard>No purchase agreements yet.</EmptyCard> : <DataTable columns={columns} rows={rows} onRowClick={(a) => router.push(`${PA_BASE}/${a.id}`)} />}
      {open && <AgreementDialog onClose={() => setOpen(false)} />}
      {detail && <SidePanel onClose={close}><AgreementView key={detail.id} agreement={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

function AgreementDialog({ onClose }: { onClose: () => void }) {
  const [vendor, setVendor] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStart] = useState("");
  const [endDate, setEnd] = useState("");
  const [lines, setLines] = useState<PaLine[]>([{ productId: "", qty: 0, unitPrice: 0 }]);
  const [notes, setNotes] = useState("");
  const ls = lines.filter((l) => l.productId && l.qty > 0 && l.unitPrice > 0);
  const valid = vendor && startDate && endDate && endDate >= startDate && ls.length > 0;
  return (
    <Dialog open onClose={onClose} title="New purchase agreement" className="max-w-xl">
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Vendor"><VendorPicker value={vendor} onChange={setVendor} placeholder="Select…" /></Field>
          <Field label={<>Title <span className="font-normal text-muted-foreground">(optional)</span></>} htmlFor="pa-title"><input id="pa-title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} /></Field>
          <Field label="Start date"><DateInput value={startDate} onChange={setStart} /></Field>
          <Field label="End date"><DateInput value={endDate} onChange={setEnd} /></Field>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Agreed lines</p>
          {lines.map((l, i) => (
            <div key={i} className="grid grid-cols-[1fr_5rem_6rem_auto] gap-2">
              <ProductPicker value={l.productId} placeholder="Product…" onChange={(id, p) => setLines(lines.map((x, k) => (k === i ? { ...x, productId: id, unitPrice: x.unitPrice || num(p.cost) } : x)))} />
              {numInput(l.qty, (v) => setLines(lines.map((x, k) => (k === i ? { ...x, qty: v } : x))), "Agreed quantity", "Qty")}
              {numInput(l.unitPrice, (v) => setLines(lines.map((x, k) => (k === i ? { ...x, unitPrice: v } : x))), "Agreed unit price", "Unit price")}
              <button type="button" aria-label="Remove line" disabled={lines.length <= 1} onClick={() => setLines(lines.filter((_, k) => k !== i))} className={cn(btn.icon, "h-8 w-8")}><X /></button>
            </div>
          ))}
          <button type="button" onClick={() => setLines([...lines, { productId: "", qty: 0, unitPrice: 0 }])} className={btn.smOutline}><Plus /> Add line</button>
        </div>
        <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} /></Field>
      </div>
      <div className="flex justify-end">
        <button type="button" disabled={!valid} onClick={() => { createRecord("purchase-agreements", { number: nextNumber("purchase-agreements", "BPA"), vendor, title, startDate, endDate, lines: ls, notes, status: "DRAFT" }); onClose(); }} className={btn.primary}>Create</button>
      </div>
    </Dialog>
  );
}

function AgreementView({ agreement, onClose }: { agreement: Rec; onClose: () => void }) {
  const router = useRouter();
  const products = useProducts();
  const lines = (agreement.lines as PaLine[]) ?? [];
  const [release, setRelease] = useState<number[]>(() => lines.map(() => 0));
  const inWindow = today() >= String(agreement.startDate) && today() <= String(agreement.endDate);
  const set = (status: string) => updateRecord("purchase-agreements", agreement.id, { status });

  function releasePo() {
    const poLines: PoLine[] = lines.flatMap((l, i) => (release[i] > 0 ? [{ productId: l.productId, qty: release[i], unitPrice: l.unitPrice }] : []));
    if (!poLines.length) return;
    const po = createRecord("purchase-orders", { number: nextNumber("purchase-orders", "PO"), vendor: agreement.vendor, date: today(), lines: poLines, total: poTotal(poLines), receivedQty: [], status: "DRAFT", agreementId: agreement.id, notes: `Released against ${agreement.number}` });
    updateRecord("purchase-agreements", agreement.id, { lines: lines.map((l, i) => ({ ...l, released: num(l.released) + release[i] })) });
    router.push(`/inventory/purchase-orders/${po.id}`);
  }

  return (
    <div className="space-y-4">
      <DetailHeader title={`Agreement ${agreement.number}`} subtitle={`${agreement.vendor} · ${longDate(agreement.startDate)} – ${longDate(agreement.endDate)}`} status={agreement.status} />
      <Section title="Agreed lines">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 text-right font-medium">Agreed</th><th className="py-2 text-right font-medium">Released</th><th className="py-2 text-right font-medium">Price</th>{agreement.status === "ACTIVE" && <th className="w-28 py-2 pl-2 font-medium">Release now</th>}</tr></thead>
          <tbody>
            {lines.map((l, i) => (
              <tr key={i} className="border-b border-border/60">
                <td className="py-2">{productName(products, l.productId)}</td>
                <td className="py-2 text-right">{l.qty}</td>
                <td className="py-2 text-right">{num(l.released)}</td>
                <td className="py-2 text-right tabular-nums">{money(l.unitPrice)}</td>
                {agreement.status === "ACTIVE" && <td className="py-1.5 pl-2">{numInput(release[i], (v) => setRelease(release.map((x, k) => (k === i ? Math.min(v, l.qty - num(l.released)) : x))), "Release quantity")}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {agreement.status === "ACTIVE" && !inWindow && <p className="text-xs text-warning">Today is outside the agreement period.</p>}
      </Section>
      <div className="flex flex-wrap gap-2">
        {agreement.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => set("ACTIVE")}>Activate</button>}
        {agreement.status === "ACTIVE" && <button type="button" disabled={!release.some((r) => r > 0) || !inWindow} className={btn.primary} onClick={releasePo}>Release PO</button>}
        {agreement.status === "ACTIVE" && <button type="button" className={btn.outline} onClick={() => set("CLOSED")}>Close agreement</button>}
        {["DRAFT", "ACTIVE"].includes(String(agreement.status)) && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => set("CANCELLED")}>Cancel</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- goods receipt notes ---------- */

const GRN_BASE = "/inventory/grn";
const GRN_STATUSES = ["DRAFT", "POSTED", "CANCELLED"];

export function GoodsReceipts() {
  const router = useRouter();
  const sub = subOf(usePathname(), GRN_BASE);
  const grns = useCollection("grns");
  const warehouses = useWarehouses();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const close = () => router.push(GRN_BASE);
  const columns: Column<Rec>[] = [
    { key: "num", header: "GRN #", cell: (g) => <span className="font-mono text-sm">{String(g.number)}</span> },
    { key: "date", header: "Date", cell: (g) => longDate(g.date) },
    { key: "wh", header: "Warehouse", cell: (g) => String(warehouses.find((w) => w.id === g.warehouseId)?.name ?? "—") },
    { key: "s", header: "Status", cell: (g) => <StatusBadge status={g.status} /> },
  ];
  const detail = sub && sub !== "new" ? grns.find((g) => g.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Goods Receipt Notes" subtitle="Record and inspect incoming goods" actions={<Link href={`${GRN_BASE}/new`} className={btn.primary}><Plus /> New GRN</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by GRN #..."><StatusFilter value={status} onChange={setStatus} statuses={GRN_STATUSES} /></ListToolbar>
      <DataTable columns={columns} rows={grns.filter((g) => (!status || g.status === status) && textMatch(q, g.number)).sort(byNewest)} onRowClick={(g) => router.push(`${GRN_BASE}/${g.id}`)} />
      {sub === "new" && <SidePanel onClose={close}><GrnForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><GrnView key={detail.id} grn={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

const blankGrnLine = (): GrnLine => ({ productId: "", expected: 0, received: 0, accepted: 0, rejected: 0, unitCost: 0 });

function GrnForm({ onDone }: { onDone: () => void }) {
  const pos = useCollection("purchase-orders");
  const [preview] = useState(() => nextNumber("grns", "GRN"));
  const search = useSearchParams();
  const [presetPo] = useState(() => readCollection("purchase-orders").find((p) => p.id === search.get("po")));
  const linesFromPo = (po?: Rec): GrnLine[] =>
    po ? ((po.lines as PoLine[]) ?? []).map((l, i) => { const left = Math.max(0, l.qty - num(((po.receivedQty as number[]) ?? [])[i])); return { productId: l.productId, uom: l.uom, expected: left, received: left, accepted: left, rejected: 0, unitCost: l.unitPrice, poLineIndex: i }; }).filter((l) => l.expected > 0) : [blankGrnLine()];
  const [date, setDate] = useState(today());
  const [warehouseId, setWarehouse] = useState(String(presetPo?.warehouseId ?? ""));
  const [poId, setPoId] = useState(String(presetPo?.id ?? ""));
  const [vendor, setVendor] = useState(String(presetPo?.vendor ?? ""));
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<GrnLine[]>(() => linesFromPo(presetPo));
  const [charges, setCharges] = useState<Charge[]>([]);
  const [error, setError] = useState("");
  const t = grnTotals(lines, charges);
  const openPos = pos.filter((p) => ["APPROVED", "SENT", "PARTIALLY_RECEIVED", "PARTIALLY_BILLED"].includes(String(p.status)) && poProgress(p).receipt !== "Received");

  function linkPo(id: string) {
    setPoId(id);
    const po = pos.find((p) => p.id === id);
    if (po) { setVendor(String(po.vendor)); if (po.warehouseId) setWarehouse(String(po.warehouseId)); }
    setLines(linesFromPo(po));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const ls = lines.filter((l) => l.productId && l.received > 0);
    if (!warehouseId) return setError("Pick the warehouse receiving the goods.");
    if (!ls.length) return setError("Enter a received quantity on at least one product.");
    if (ls.some((l) => l.accepted + l.rejected > l.received + 0.0005)) return setError("Accepted + rejected can't exceed received.");
    createRecord("grns", { number: nextNumber("grns", "GRN"), date, warehouseId, poId, vendor, notes, lines: ls, charges, ...grnTotals(ls, charges), status: "DRAFT" });
    onDone();
  }

  const cols: GridCol<GrnLine>[] = [
    { key: "p", header: "Product", width: "24%", render: (l, set) => <ProductPicker value={l.productId} placeholder="Product" onChange={(id, p) => set({ productId: id, uom: String(p.uom ?? ""), unitCost: l.unitCost || num(p.cost), taxPct: num(p.tax) })} /> },
    { key: "u", header: "UOM", width: "3rem", render: (l) => <span className="text-muted-foreground">{l.uom || "-"}</span> },
    { key: "e", header: "Expected", render: (l, set) => numInput(l.expected, (v) => set({ expected: v }), "Expected") },
    { key: "r", header: "Received", render: (l, set) => numInput(l.received, (v) => set({ received: v, accepted: Math.max(0, v - l.rejected) }), "Received") },
    { key: "a", header: "Accepted", render: (l, set) => numInput(l.accepted, (v) => set({ accepted: v }), "Accepted") },
    { key: "j", header: "Rejected", render: (l, set) => numInput(l.rejected, (v) => set({ rejected: v, accepted: Math.max(0, l.received - v) }), "Rejected") },
    { key: "c", header: <span className="leading-tight">Unit Cost<span className="block text-[10px] font-normal">incl. tax</span></span>, render: (l, set) => numInput(l.unitCost, (v) => set({ unitCost: v }), "Unit cost", "0.00") },
    { key: "t", header: "Total", width: "5.5rem", render: (l) => <span className="block text-right tabular-nums">{money(l.accepted * l.unitCost)}</span> },
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Goods Receipt Note</h1>
      <Section title="Receipt Details">
        <NumberBanner label="GRN Number" value={preview} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Receipt Date"><DateInput value={date} onChange={setDate} /></Field>
          <Field label="Warehouse"><WarehousePicker value={warehouseId} onChange={setWarehouse} /></Field>
          <Field label="Purchase Order (optional)"><Select ariaLabel="Purchase order" value={poId} onChange={linkPo} placeholder="Link to PO" options={openPos.map((p) => ({ value: p.id, label: `${p.number} — ${p.vendor}` }))} /></Field>
          <Field label="Vendor (optional)"><VendorPicker value={vendor} onChange={setVendor} placeholder="Select vendor" /></Field>
        </div>
        <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} /></Field>
      </Section>
      <Section title="Line Items">
        <LineGrid lines={lines} setLines={setLines} cols={cols} blank={blankGrnLine} addInHeader footer={<div className="rounded-md bg-muted/60 py-1"><TotalRow label="Net amount" value={t.net} /><TotalRow label="VAT" value={t.vat} /><TotalRow label="Grand total" value={t.total} strong /></div>} />
      </Section>
      <ChargesSection charges={charges} setCharges={setCharges} />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className={btn.primary}>Create GRN</button>
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
      </div>
    </form>
  );
}

function GrnView({ grn, onClose }: { grn: Rec; onClose: () => void }) {
  const products = useProducts();
  const lines = (grn.lines as GrnLine[]) ?? [];
  return (
    <div className="space-y-4">
      <DetailHeader title={`GRN ${grn.number}`} subtitle={`${longDate(grn.date)}${grn.vendor ? ` · ${grn.vendor}` : ""}`} status={grn.status} />
      <Section title="Received items">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 text-right font-medium">Received</th><th className="py-2 text-right font-medium">Accepted</th><th className="py-2 text-right font-medium">Rejected</th><th className="py-2 text-right font-medium">Unit Cost</th></tr></thead>
          <tbody>{lines.map((l, i) => <tr key={i} className="border-b border-border/60"><td className="py-2">{productName(products, l.productId)}</td><td className="py-2 text-right">{l.received}</td><td className="py-2 text-right">{l.accepted}</td><td className="py-2 text-right">{l.rejected}</td><td className="py-2 text-right tabular-nums">{money(l.unitCost)}</td></tr>)}</tbody>
        </table>
        <TotalRow label="Net amount" value={num(grn.net)} />
        <TotalRow label="VAT" value={num(grn.vat)} />
        <TotalRow label="Grand total" value={num(grn.total)} strong />
      </Section>
      {grn.status === "POSTED" && <p className="text-sm text-muted-foreground">Posted: accepted stock added at cost (Dr Inventory · Cr Goods Received Not Invoiced).{grn.billId ? " Billed." : " Bill it from Bills → Goods Receipt."}</p>}
      <div className="flex flex-wrap gap-2">
        {grn.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => postGrn(grn, String(grn.date))}>Post GRN</button>}
        {grn.status === "POSTED" && !grn.billId && <Link href={`/ap/bills/new?grn=${grn.id}`} className={btn.outline}>Create Bill</Link>}
        {grn.status === "DRAFT" && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => updateRecord("grns", grn.id, { status: "CANCELLED" })}>Cancel</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

/* ---------- purchase returns ---------- */

const RET_BASE = "/inventory/purchase-returns";
const RET_STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "REJECTED", "SHIPPED", "COMPLETED", "CANCELLED"];
type RetLine = { productId: string; description: string; qty: number; uom: string; unitPrice: number; reason: string };

export function PurchaseReturns() {
  const router = useRouter();
  const sub = subOf(usePathname(), RET_BASE);
  const returns = useCollection("purchase-returns");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const close = () => router.push(RET_BASE);
  const columns: Column<Rec>[] = [
    { key: "num", header: "Return #", cell: (r) => <span className="font-mono text-sm">{String(r.number)}</span> },
    { key: "v", header: "Vendor", cell: (r) => <span className="font-medium">{String(r.vendor)}</span> },
    { key: "po", header: "PO #", cell: (r) => String(r.poNumber || "—") },
    { key: "reason", header: "Reason", cell: (r) => <span className="line-clamp-1">{String(r.reason)}</span> },
    { key: "date", header: "Date", cell: (r) => longDate(r.date) },
    { key: "amt", header: "Amount", cell: (r) => money(num(r.total)) },
    { key: "s", header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
  ];
  const detail = sub && sub !== "new" ? returns.find((r) => r.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Purchase Returns" subtitle="Track and manage returns to vendors" actions={<Link href={`${RET_BASE}/new`} className={btn.primary}><Plus /> New Return</Link>} />
      <ListToolbar q={q} setQ={setQ} placeholder="Search by return #..."><StatusFilter value={status} onChange={setStatus} statuses={RET_STATUSES} /></ListToolbar>
      <DataTable columns={columns} rows={returns.filter((r) => (!status || r.status === status) && textMatch(q, r.number, r.vendor)).sort(byNewest)} onRowClick={(r) => router.push(`${RET_BASE}/${r.id}`)} />
      {sub === "new" && <SidePanel onClose={close}><ReturnForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><ReturnView key={detail.id} ret={detail} onClose={close} /></SidePanel>}
    </div>
  );
}

function ReturnForm({ onDone }: { onDone: () => void }) {
  const [preview] = useState(() => nextNumber("purchase-returns", "PRET"));
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState(today());
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<RetLine[]>([{ productId: "", description: "", qty: 1, uom: "", unitPrice: 0, reason: "" }]);
  const [error, setError] = useState("");
  const total = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  function submit() {
    const ls = lines.filter((l) => l.productId && l.qty > 0);
    if (!vendor || !reason.trim()) return setError("Vendor and reason are required.");
    if (!ls.length) return setError("Add at least one product to return.");
    createRecord("purchase-returns", { number: nextNumber("purchase-returns", "PRET"), vendor, date, reason: reason.trim(), notes, lines: ls, total: ls.reduce((s, l) => s + l.qty * l.unitPrice, 0), status: "DRAFT" });
    onDone();
  }

  const cols: GridCol<RetLine>[] = [
    { key: "p", header: <>Product <Req /></>, width: "22%", render: (l, set) => <ProductPicker value={l.productId} onChange={(id, p) => set({ productId: id, uom: String(p.uom ?? ""), unitPrice: l.unitPrice || num(p.cost) })} /> },
    { key: "d", header: "Description", render: (l, set) => textInput(l.description, (v) => set({ description: v }), "Description", "Description") },
    { key: "q", header: "Qty", width: "4rem", render: (l, set) => numInput(l.qty, (v) => set({ qty: v }), "Quantity") },
    { key: "u", header: "UOM", width: "3rem", render: (l) => <span className="text-muted-foreground">{l.uom || "-"}</span> },
    { key: "pr", header: "Unit Price", width: "6rem", render: (l, set) => numInput(l.unitPrice, (v) => set({ unitPrice: v }), "Unit price") },
    { key: "r", header: "Line Reason", render: (l, set) => textInput(l.reason, (v) => set({ reason: v }), "Line reason", "Reason") },
    { key: "t", header: "Total", width: "5rem", render: (l) => <span className="block text-right tabular-nums">{money(l.qty * l.unitPrice)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">New Purchase Return</h1>
        <BackButton onClick={onDone} />
      </div>
      <Section title="Return Details">
        <NumberBanner label="Return #" value={preview} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={<>Vendor <Req /></>}><VendorPicker value={vendor} onChange={setVendor} /></Field>
          <Field label="Return Date"><DateInput value={date} onChange={setDate} /></Field>
        </div>
        <Field label={<>Reason <Req /></>}><CountedTextarea ariaLabel="Reason" value={reason} onChange={setReason} placeholder="Why are these items being returned?" rows={2} /></Field>
        <Field label="Notes"><CountedTextarea ariaLabel="Notes" value={notes} onChange={setNotes} placeholder="Additional notes..." rows={2} /></Field>
      </Section>
      <Section title="Return Lines">
        <LineGrid lines={lines} setLines={setLines} cols={cols} blank={() => ({ productId: "", description: "", qty: 1, uom: "", unitPrice: 0, reason: "" })} addInHeader footer={<p className="text-right text-lg font-bold tabular-nums">Total: {money(total)}</p>} />
      </Section>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        <button type="button" onClick={submit} className={btn.primary}>Create Return</button>
      </div>
    </div>
  );
}

function ReturnView({ ret, onClose }: { ret: Rec; onClose: () => void }) {
  const products = useProducts();
  const lines = (ret.lines as RetLine[]) ?? [];
  const warehouses = useWarehouses();
  const [warehouseId, setWarehouseId] = useState(String(ret.warehouseId ?? warehouses[0]?.id ?? ""));
  const set = (status: string) => {
    // Shipping goods back takes them out of the chosen warehouse.
    if (status === "SHIPPED") {
      if (!warehouseId) return alert("Pick the warehouse the goods leave from.");
      returnToVendor({ date: today(), warehouseId, reference: String(ret.number), lines: lines.map((l) => ({ productId: l.productId, qty: l.qty })) });
    }
    updateRecord("purchase-returns", ret.id, { status, ...(status === "SHIPPED" ? { warehouseId } : {}) });
  };
  const next: Record<string, [string, string][]> = {
    DRAFT: [["PENDING_APPROVAL", "Submit for Approval"]],
    PENDING_APPROVAL: [["APPROVED", "Approve"], ["REJECTED", "Reject"]],
    APPROVED: [["SHIPPED", "Mark Shipped"]],
    SHIPPED: [["COMPLETED", "Mark Completed"]],
  };
  return (
    <div className="space-y-4">
      <DetailHeader title={`Return ${ret.number}`} subtitle={`${ret.vendor} · ${longDate(ret.date)}`} status={ret.status} />
      <Card><p className="p-4 text-sm"><span className="text-muted-foreground">Reason: </span>{String(ret.reason)}</p></Card>
      {ret.status === "APPROVED" && <Field label="Ship from warehouse" className="w-64"><WarehousePicker value={warehouseId} onChange={setWarehouseId} /></Field>}
      <Section title="Lines">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="py-2 text-right font-medium">Qty</th><th className="py-2 text-right font-medium">Unit Price</th><th className="py-2 pl-4 font-medium">Reason</th></tr></thead>
          <tbody>{lines.map((l, i) => <tr key={i} className="border-b border-border/60"><td className="py-2">{productName(products, l.productId)}</td><td className="py-2 text-right">{l.qty} {l.uom}</td><td className="py-2 text-right tabular-nums">{money(l.unitPrice)}</td><td className="py-2 pl-4 text-muted-foreground">{l.reason}</td></tr>)}</tbody>
        </table>
        <TotalRow label="Total" value={num(ret.total)} strong />
      </Section>
      <div className="flex flex-wrap gap-2">
        {(next[String(ret.status)] ?? []).map(([s, l], i) => <button key={s} type="button" className={i === 0 ? btn.primary : btn.outline} onClick={() => set(s)}>{l}</button>)}
        {["SHIPPED", "COMPLETED"].includes(String(ret.status)) && <Link href={`/ap/debit-notes/new?vendor=${encodeURIComponent(String(ret.vendor))}`} className={btn.outline}>Create Debit Note</Link>}
        {["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(String(ret.status)) && <button type="button" className={cn(btn.outline, "text-destructive")} onClick={() => set("CANCELLED")}>Cancel</button>}
        <button type="button" className={btn.outline} onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
