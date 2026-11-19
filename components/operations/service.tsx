"use client";

// Service work: field service jobs, repair orders (parts & labour, billed to an invoice) and appointments.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarClock, Camera, Check, CheckCircle2, Clock, MapPin, Navigation, Phone, Plus, Receipt, Route as RouteIcon, ShieldCheck, Trash2, User, Wrench, X } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { shipStock, onHand } from "@/lib/stock";
import { createInvoice } from "@/lib/sales";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, Dialog, Field, Label, PageHeader, btn, inputCls, money, num, textareaCls, today } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { RecordPicker } from "@/components/sales/doc-kit";
import { ProductPicker } from "@/components/purchasing/kit";

const r3 = (v: number) => Math.round(v * 1000) / 1000;
function useFlash() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const node = msg && <div role="status" className={cn("fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg", msg.bad ? "border-destructive/30 bg-destructive text-white" : "border-border bg-card")}>{msg.text}</div>;
  return { node, flash: (text: string, bad = false) => { setMsg({ text, bad }); setTimeout(() => setMsg(null), 3000); } };
}
const staffName = (e: Rec) => String(e.fullName ?? ([e.firstName, e.lastName].filter(Boolean).join(" ") || e.employeeNumber || "—"));
const useStaff = () => useCollection("employees").map((e) => ({ id: e.id, name: staffName(e) }));
const PAY_MODES = [{ value: "CASH", label: "Cash" }, { value: "BANK", label: "Card / bank" }, { value: "CREDIT", label: "On account" }];
const invoiceMode = (m: string) => (m === "CREDIT" ? "Credit" : m === "BANK" ? "Bank Transfer" : "Cash");

/* ---------- field service ---------- */

const JOB_STATUSES = [["SCHEDULED", "Scheduled"], ["EN_ROUTE", "En route"], ["ON_SITE", "On site"], ["DONE", "Done"], ["CANCELLED", "Cancelled"]] as const;
const JOB_TONE: Record<string, "muted" | "info" | "primary" | "success" | "destructive"> = { SCHEDULED: "muted", EN_ROUTE: "info", ON_SITE: "primary", DONE: "success", CANCELLED: "destructive" };
const BLANK_JOB = { customerId: "", title: "", description: "", jobType: "SERVICE", priority: "MEDIUM", assignedTo: "", scheduledDate: "", address: "" };

export function FieldService() {
  const jobs = useCollection("field-jobs");
  const customers = useCollection("customers");
  const routes = useCollection("van-routes").filter((r) => r.status === "PLANNED" || r.status === "IN_PROGRESS");
  const employees = useStaff();
  const techs = [{ id: "me", name: BRAND.user.fullName }, ...employees];
  const [status, setStatus] = useState("");
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState(BLANK_JOB);
  const [completing, setCompleting] = useState<Rec | null>(null);
  const [resolution, setResolution] = useState("");
  const [attaching, setAttaching] = useState<Rec | null>(null);
  const [routeId, setRouteId] = useState("");
  const { node, flash } = useFlash();
  const rows = [...jobs].filter((j) => !status || j.status === status).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  function schedule() {
    const c = customers.find((x) => x.id === f.customerId);
    createRecord("field-jobs", { ...f, jobNumber: nextNumber("field-jobs", "FSJ", 4), customerName: c?.name, assigneeName: techs.find((t) => t.id === f.assignedTo)?.name, status: "SCHEDULED" });
    setAdding(false); setF(BLANK_JOB); flash("Job scheduled");
  }
  function attach() {
    const r = routes.find((x) => x.id === routeId);
    if (!attaching || !r) return;
    const stops = (r.stops as Rec[]) ?? [];
    updateRecord("van-routes", r.id, { stops: [...stops, { id: crypto.randomUUID(), stopNumber: stops.length + 1, customerName: attaching.customerName || attaching.title, address: attaching.address || undefined, status: "PENDING", fieldJobId: attaching.id }] });
    updateRecord("field-jobs", attaching.id, { routeId: r.id, routeCode: r.routeCode });
    setAttaching(null); setRouteId(""); flash("Attached to route — a stop was added to the driver's plan");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Field Service" subtitle="Onsite jobs with a technician lifecycle — attach a job to a van route and it becomes a stop on the driver's plan." actions={<button type="button" className={btn.primary} onClick={() => setAdding(true)}><Plus /> New job</button>} />
      <Select value={status} onChange={setStatus} options={[{ value: "", label: "All statuses" }, ...JOB_STATUSES.map(([v, l]) => ({ value: v, label: l }))]} className="w-44" ariaLabel="Status" />
      <Card>
        <div className="p-4">{rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No jobs in this view.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground">{["Job", "Customer", "Type", "Assignee", "Date", "Route", "Status", ""].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rows.map((j) => (
              <tr key={j.id} className="border-b border-border align-top">
                <td className="px-2 py-2"><p className="font-mono text-xs">{String(j.jobNumber)}</p><p className="font-medium">{String(j.title)}</p>{Boolean(j.resolution) && <p className="text-xs text-success">✓ {String(j.resolution)}</p>}</td>
                <td className="px-2 py-2">{String(j.customerName || "—")}</td>
                <td className="px-2 py-2"><Badge>{String(j.jobType)}</Badge></td>
                <td className="px-2 py-2 text-muted-foreground">{String(j.assigneeName || "—")}</td>
                <td className="px-2 py-2">{j.scheduledDate ? new Date(String(j.scheduledDate)).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—"}</td>
                <td className="px-2 py-2 font-mono text-xs">{String(j.routeCode || "—")}</td>
                <td className="px-2 py-2"><Badge tone={JOB_TONE[String(j.status)]}>{String(j.status).replace("_", " ")}</Badge></td>
                <td className="px-2 py-2"><div className="flex flex-wrap justify-end gap-1">
                  {j.status === "SCHEDULED" && <button type="button" className={btn.smOutline} onClick={() => updateRecord("field-jobs", j.id, { status: "EN_ROUTE", enRouteAt: new Date().toISOString() })}><Navigation /> En route</button>}
                  {(j.status === "SCHEDULED" || j.status === "EN_ROUTE") && <button type="button" className={btn.smOutline} onClick={() => updateRecord("field-jobs", j.id, { status: "ON_SITE", onSiteAt: new Date().toISOString() })}><MapPin /> On site</button>}
                  {(j.status === "EN_ROUTE" || j.status === "ON_SITE") && <button type="button" className={btn.smPrimary} onClick={() => setCompleting(j)}><CheckCircle2 /> Complete</button>}
                  {j.status === "SCHEDULED" && !j.routeCode && routes.length > 0 && <button type="button" className={cn(btn.ghost, "h-8 px-2 text-xs")} onClick={() => setAttaching(j)}><RouteIcon /> Route</button>}
                  {["SCHEDULED", "EN_ROUTE", "ON_SITE"].includes(String(j.status)) && <button type="button" className={cn(btn.ghost, "h-8 px-2 text-xs")} onClick={() => updateRecord("field-jobs", j.id, { status: "CANCELLED" })}>Cancel</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}</div>
      </Card>
      <Dialog open={adding} onClose={() => setAdding(false)} title="New field service job" className="max-w-xl">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" htmlFor="fj-title"><input id="fj-title" autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Install POS terminal" className={inputCls} /></Field>
            <div className="space-y-2"><Label>Customer</Label><Select value={f.customerId} onChange={(v) => setF({ ...f, customerId: v })} options={[{ value: "", label: "No customer" }, ...customers.map((c) => ({ value: c.id, label: String(c.name) }))]} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2"><Label>Type</Label><Select value={f.jobType} onChange={(v) => setF({ ...f, jobType: v })} options={[["INSTALLATION", "Installation"], ["REPAIR", "Repair"], ["SERVICE", "Service"], ["INSPECTION", "Inspection"], ["OTHER", "Other"]].map(([v, l]) => ({ value: v, label: l }))} /></div>
            <div className="space-y-2"><Label>Priority</Label><Select value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={[["LOW", "Low"], ["MEDIUM", "Medium"], ["HIGH", "High"]].map(([v, l]) => ({ value: v, label: l }))} /></div>
            <div className="space-y-2"><Label>Date</Label><DateInput value={f.scheduledDate} onChange={(v) => setF({ ...f, scheduledDate: v })} /></div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2"><Label>Technician</Label><Select value={f.assignedTo} onChange={(v) => setF({ ...f, assignedTo: v })} options={[{ value: "", label: "Unassigned" }, ...techs.map((t) => ({ value: t.id, label: t.name }))]} /></div>
            <Field label="Address" htmlFor="fj-addr"><input id="fj-addr" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Description" htmlFor="fj-desc"><textarea id="fj-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={textareaCls} /></Field>
        </div>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!f.title.trim()} onClick={schedule}>Schedule</button></div>
      </Dialog>
      <Dialog open={!!completing} onClose={() => setCompleting(null)} title={`Complete ${completing?.jobNumber ?? ""}`}>
        <div className="space-y-2"><Label htmlFor="fj-res">Resolution</Label><textarea id="fj-res" value={resolution} onChange={(e) => setResolution(e.target.value)} placeholder="What was done on site?" className={textareaCls} /></div>
        <div className="flex justify-end"><button type="button" className={btn.primary} onClick={() => { updateRecord("field-jobs", completing!.id, { status: "DONE", resolution: resolution || undefined, completedAt: new Date().toISOString() }); if (completing!.routeId) { const r = readCollection("van-routes").find((x) => x.id === completing!.routeId); if (r) updateRecord("van-routes", r.id, { stops: ((r.stops as Rec[]) ?? []).map((s) => (s.fieldJobId === completing!.id ? { ...s, status: "COMPLETED", actualArrival: s.actualArrival ?? new Date().toISOString() } : s)) }); } setCompleting(null); setResolution(""); flash("Job completed"); }}>Complete</button></div>
      </Dialog>
      <Dialog open={!!attaching} onClose={() => setAttaching(null)} title={`Attach ${attaching?.jobNumber ?? ""} to a route`}>
        <div className="space-y-2"><Label>Route</Label><Select value={routeId} onChange={setRouteId} placeholder="Select…" options={routes.map((r) => ({ value: r.id, label: `${r.routeCode} — ${r.routeName}` }))} /><p className="text-xs text-muted-foreground">A stop is appended to the route at the job&apos;s address.</p></div>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!routeId} onClick={attach}>Attach</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- repair orders ---------- */

const REPAIR_STATUSES = ["RECEIVED", "DIAGNOSING", "AWAITING_APPROVAL", "APPROVED", "AWAITING_PARTS", "IN_PROGRESS", "READY", "DELIVERED", "CANCELLED"];
const REPAIR_TONE: Record<string, string> = { RECEIVED: "bg-muted text-foreground", DIAGNOSING: "bg-blue-100 text-blue-800", AWAITING_APPROVAL: "bg-amber-100 text-amber-800", APPROVED: "bg-indigo-100 text-indigo-800", AWAITING_PARTS: "bg-orange-100 text-orange-800", IN_PROGRESS: "bg-purple-100 text-purple-800", READY: "bg-emerald-100 text-emerald-800", DELIVERED: "bg-green-100 text-green-800", CANCELLED: "bg-red-100 text-red-800" };
const Pill = ({ tone, children }: { tone?: string; children: React.ReactNode }) => <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border border-border px-2.5 py-0.5 text-xs font-medium", tone)}>{children}</span>;
const deviceLabel = (r: Rec) => [r.deviceBrand, r.deviceModel].filter(Boolean).join(" ") || String(r.deviceType || "—");

export function RepairOrders() {
  const router = useRouter();
  const orders = useCollection("repair-orders");
  const [status, setStatus] = useState("ALL");
  const [q, setQ] = useState("");
  const rows = [...orders].filter((o) => (status === "ALL" || o.status === status) && (!q || `${o.orderNumber} ${o.deviceIdentifier ?? ""} ${o.deviceModel ?? ""} ${o.deviceBrand ?? ""}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return (
    <div className="space-y-4">
      <PageHeader title="Repair Orders" subtitle="Device intake, repair pipeline, parts & labour" actions={<button type="button" className={btn.primary} onClick={() => router.push("/repair-orders/new")}><Plus /> New Repair</button>} />
      <div className="flex flex-wrap gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order #, IMEI/VIN, model…" aria-label="Search" className={cn(inputCls, "max-w-xs")} />
        <Select value={status} onChange={setStatus} options={[{ value: "ALL", label: "All statuses" }, ...REPAIR_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))]} className="w-52" ariaLabel="Status" />
      </div>
      <Card>
        <div className="overflow-x-auto p-0"><table className="w-full text-sm">
          <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="p-3 font-medium">Order #</th><th className="p-3 font-medium">Device</th><th className="p-3 font-medium">Customer</th><th className="p-3 font-medium">Fault</th><th className="p-3 font-medium">Status</th><th className="p-3 text-right font-medium">Total</th></tr></thead>
          <tbody>{rows.length === 0 ? <tr><td colSpan={6} className="p-10 text-center text-muted-foreground"><Wrench className="mx-auto mb-2 size-8 opacity-40" />No repair orders yet.</td></tr> : rows.map((o) => (
            <tr key={o.id} onClick={() => router.push(`/repair-orders/${o.id}`)} className="cursor-pointer border-b border-border hover:bg-muted/50">
              <td className="p-3 font-mono text-xs">{String(o.orderNumber)}</td><td className="p-3">{deviceLabel(o)}<div className="text-xs text-muted-foreground">{String(o.deviceIdentifier ?? "")}</div></td><td className="p-3">{String(o.customerName || "—")}</td><td className="max-w-xs truncate p-3">{String(o.reportedFault || "—")}</td><td className="p-3"><Pill tone={REPAIR_TONE[String(o.status)]}>{String(o.status).replace(/_/g, " ")}</Pill></td><td className="p-3 text-right tabular-nums">{money(num(o.totalAmount))}</td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
    </div>
  );
}

export function NewRepair() {
  const router = useRouter();
  const customers = useCollection("customers");
  const [f, setF] = useState({ customerId: "", contactPhone: "", deviceType: "", deviceBrand: "", deviceModel: "", deviceIdentifier: "", reportedFault: "", conditionNotes: "", promisedDate: "" });
  const { node, flash } = useFlash();
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const input = (k: keyof typeof f, label: string, placeholder = "") => <Field label={label} htmlFor={`ro-${k}`}><input id={`ro-${k}`} value={f[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} className={inputCls} /></Field>;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.customerId && !f.reportedFault.trim()) return flash("Add a customer or the reported fault", true);
    const c = customers.find((x) => x.id === f.customerId);
    const o = createRecord("repair-orders", { ...f, customerName: c?.name, contactPhone: f.contactPhone || c?.phone, orderNumber: nextNumber("repair-orders", "RO", 4), status: "RECEIVED", lines: [], subtotal: 0, taxAmount: 0, totalAmount: 0, photos: [] });
    router.push(`/repair-orders/${o.id}`);
  }
  return (
    <div className="space-y-4">
      <PageHeader title="New Repair Order" subtitle="Intake a device for repair" />
      <Card className="max-w-3xl">
        <div className="p-6 pb-3"><CardTitle>Intake</CardTitle></div>
        <form onSubmit={submit} className="space-y-4 p-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Customer</Label><RecordPicker items={customers} value={f.customerId} onChange={(v) => set("customerId", v)} placeholder="Select customer..." getLabel={(c) => String(c.name)} getSub={(c) => String(c.phone ?? "")} emptyText="No customers yet — add one under Sales › Customers." /></div>
            {input("contactPhone", "Contact phone")}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">{input("deviceType", "Device type", "Phone / Vehicle / Laptop…")}{input("deviceIdentifier", "Identifier (IMEI / VIN / Serial)")}</div>
          <div className="grid gap-4 sm:grid-cols-2">{input("deviceBrand", "Brand")}{input("deviceModel", "Model")}</div>
          <Field label="Reported fault" htmlFor="ro-fault"><textarea id="ro-fault" value={f.reportedFault} onChange={(e) => set("reportedFault", e.target.value)} className={textareaCls} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Condition on intake" htmlFor="ro-cond"><textarea id="ro-cond" value={f.conditionNotes} onChange={(e) => set("conditionNotes", e.target.value)} className={textareaCls} /></Field>
            <div className="space-y-2"><Label>Promised date</Label><DateInput value={f.promisedDate} onChange={(v) => set("promisedDate", v)} /></div>
          </div>
          <div className="flex gap-2"><button type="submit" className={btn.primary}>Create Repair Order</button><button type="button" className={btn.outline} onClick={() => router.back()}>Cancel</button></div>
        </form>
      </Card>
      {node}
    </div>
  );
}

const BLANK_LINE = { lineType: "PART", productId: "", warehouseId: "", description: "", quantity: "1", unitPrice: "", taxRate: "" };

function repairTotals(lines: Rec[]) {
  const subtotal = lines.reduce((a, l) => a + num(l.quantity) * num(l.unitPrice), 0);
  const tax = lines.reduce((a, l) => a + (num(l.quantity) * num(l.unitPrice) * num(l.taxRate)) / 100, 0);
  return { subtotal: r3(subtotal), taxAmount: r3(tax), totalAmount: r3(subtotal + tax) };
}

export function RepairDetail({ id }: { id: string }) {
  const router = useRouter();
  const orders = useCollection("repair-orders");
  const products = useCollection("products");
  const warehouses = useCollection("warehouses").filter((w) => w.status !== "INACTIVE");
  const staff = useStaff();
  const [line, setLine] = useState(BLANK_LINE);
  const [mode, setMode] = useState("CASH");
  const { node, flash } = useFlash();
  const o = orders.find((x) => x.id === id);
  if (!orders.length) return null;
  if (!o) return <p className="p-6 text-sm text-muted-foreground">Repair order not found.</p>;
  const lines = (o.lines as Rec[]) ?? [];
  const billed = !!o.invoiceId;
  const hasLines = lines.length > 0;
  const save = (patch: Record<string, unknown>) => updateRecord("repair-orders", o.id, patch);
  function addLine() {
    if (!line.unitPrice) return flash("Enter a price", true);
    if (line.lineType === "PART" && (!line.productId || !line.warehouseId)) return flash("Part lines need a product and warehouse", true);
    const p = products.find((x) => x.id === line.productId);
    const next = [...lines, { id: crypto.randomUUID(), lineType: line.lineType, productId: line.productId || undefined, productName: p?.name, sku: p?.sku, warehouseId: line.warehouseId || undefined, warehouseName: warehouses.find((w) => w.id === line.warehouseId)?.name, description: line.description || (line.lineType === "PART" ? p?.name : "Labour"), quantity: num(line.quantity) || 1, unitPrice: num(line.unitPrice), taxRate: num(line.taxRate), lineTotal: r3((num(line.quantity) || 1) * num(line.unitPrice) * (1 + num(line.taxRate) / 100)) }];
    save({ lines: next, ...repairTotals(next), estimateApproved: false });
    setLine(BLANK_LINE);
  }
  function removeLine(lid: string) { const next = lines.filter((l) => l.id !== lid); save({ lines: next, ...repairTotals(next) }); }
  // Bills the job: an invoice for parts and labour, and the parts leave their warehouse.
  function checkout() {
    for (const l of lines.filter((x) => x.lineType === "PART")) {
      const have = onHand(String(l.productId), String(l.warehouseId));
      if (num(l.quantity) > have + 1e-9) return flash(`Only ${have} of ${l.productName} in ${l.warehouseName}`, true);
    }
    const inv = createInvoice({ customer: String(o!.customerName || "Walk-in customer"), date: today(), dueDate: today(), paymentMode: invoiceMode(mode), reference: o!.orderNumber, notes: `Repair ${o!.orderNumber} — ${deviceLabel(o!)}`, lines: lines.map((l) => ({ productId: l.productId as string | undefined, description: String(l.description || l.productName || "Item"), qty: num(l.quantity), unitPrice: num(l.unitPrice), discPct: 0, taxPct: num(l.taxRate) })) });
    const byWh = new Map<string, { productId: string; qty: number }[]>();
    for (const l of lines.filter((x) => x.lineType === "PART")) byWh.set(String(l.warehouseId), [...(byWh.get(String(l.warehouseId)) ?? []), { productId: String(l.productId), qty: num(l.quantity) }]);
    for (const [wh, ls] of byWh) shipStock({ date: today(), warehouseId: wh, reference: String(o!.orderNumber), lines: ls });
    save({ invoiceId: inv.id, invoiceNumber: inv.number, status: o!.status === "CANCELLED" ? o!.status : "DELIVERED", billedAt: new Date().toISOString() });
    router.push(`/ar/invoices/${inv.id}`);
  }
  function warrantyClaim() {
    const claim = createRecord("repair-orders", { customerId: o!.customerId, customerName: o!.customerName, contactPhone: o!.contactPhone, deviceType: o!.deviceType, deviceBrand: o!.deviceBrand, deviceModel: o!.deviceModel, deviceIdentifier: o!.deviceIdentifier, reportedFault: `Warranty claim on ${o!.orderNumber}`, orderNumber: nextNumber("repair-orders", "RO", 4), status: "RECEIVED", lines: [], subtotal: 0, taxAmount: 0, totalAmount: 0, photos: [], isWarrantyClaim: true, warrantyParentId: o!.id, warrantyParentNumber: o!.orderNumber });
    router.push(`/repair-orders/${claim.id}`);
  }
  function addPhoto(file: File) {
    if (file.size > 1_500_000) return flash("Photo is too large for browser storage — use one under 1.5 MB", true);
    const rd = new FileReader();
    rd.onload = () => save({ photos: [...((o!.photos as Rec[]) ?? []), { id: crypto.randomUUID(), filename: file.name, url: String(rd.result) }] });
    rd.readAsDataURL(file);
  }
  const photos = (o.photos as Rec[]) ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title={String(o.orderNumber)} subtitle={`${[o.deviceBrand, o.deviceModel].filter(Boolean).join(" ")}${o.customerName ? ` · ${o.customerName}` : ""}`} actions={<>
        {!billed && hasLines && !o.estimateApproved && <button type="button" className={btn.outline} onClick={() => save({ estimateApproved: true, estimateApprovedAt: new Date().toISOString(), status: o.status === "AWAITING_APPROVAL" || o.status === "DIAGNOSING" ? "APPROVED" : o.status })}><Check /> Approve estimate</button>}
        {billed && <button type="button" className={btn.outline} onClick={warrantyClaim}><ShieldCheck /> Warranty claim</button>}
        {billed ? <button type="button" className={btn.outline} onClick={() => router.push(`/ar/invoices/${o.invoiceId}`)}>View invoice</button> : <>
          <Select ariaLabel="Payment mode" value={mode} onChange={setMode} options={PAY_MODES} className="w-44" />
          <button type="button" className={btn.primary} disabled={!hasLines} onClick={checkout}><Receipt /> {mode === "CREDIT" ? "Bill on account" : "Check out"} + issue parts</button>
        </>}
      </>} />
      <Card><div className="flex flex-wrap items-center gap-2 p-4">
        <span className="mr-1 text-sm text-muted-foreground">Status:</span>
        {REPAIR_STATUSES.filter((s) => s !== "CANCELLED").map((s) => <button key={s} type="button" className={o.status === s ? btn.smPrimary : btn.smOutline} onClick={() => save({ status: s })}>{s.replace(/_/g, " ")}</button>)}
        <button type="button" className={cn(btn.ghost, "h-8 px-3 text-xs text-destructive")} onClick={() => save({ status: "CANCELLED" })}>Cancel</button>
      </div></Card>
      <Card><div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Technician</Label><Select value={String(o.assignedTo ?? "")} onChange={(v) => save({ assignedTo: v || null })} placeholder="Unassigned" options={staff.map((s) => ({ value: s.id, label: s.name }))} disabled={billed} /></div>
        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Warranty until</Label><DateInput value={String(o.warrantyUntil ?? "")} onChange={(v) => save({ warrantyUntil: v || null })} /></div>
        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Estimate</Label><div className="pt-1">{o.estimateApproved ? <Pill tone="bg-emerald-100 text-emerald-800">Approved{o.estimateApprovedAt ? ` · ${new Date(String(o.estimateApprovedAt)).toLocaleDateString()}` : ""}</Pill> : hasLines ? <Pill>Awaiting approval</Pill> : <span className="text-sm text-muted-foreground">No lines yet</span>}</div></div>
        <div className="space-y-1"><Label className="text-xs text-muted-foreground">Warranty</Label><div className="pt-1 text-sm">{o.isWarrantyClaim ? <button type="button" className="text-primary underline" onClick={() => o.warrantyParentId && router.push(`/repair-orders/${o.warrantyParentId}`)}>Claim on {String(o.warrantyParentNumber || "prior repair")}</button> : <span className="text-muted-foreground">Standard repair</span>}</div></div>
      </div></Card>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><div className="p-4 pb-1 text-sm font-medium text-muted-foreground">Device</div><div className="space-y-1 p-4 pt-0 text-sm"><div>{deviceLabel(o)}</div><div className="text-muted-foreground">ID: {String(o.deviceIdentifier || "—")}</div><div className="text-muted-foreground">Fault: {String(o.reportedFault || "—")}</div>{Boolean(o.conditionNotes) && <div className="text-muted-foreground">Condition: {String(o.conditionNotes)}</div>}{Boolean(o.promisedDate) && <div className="text-muted-foreground">Promised: {String(o.promisedDate)}</div>}</div></Card>
        <Card><div className="p-4 pb-1 text-sm font-medium text-muted-foreground">Customer</div><div className="space-y-1 p-4 pt-0 text-sm"><div>{String(o.customerName || "—")}</div><div className="text-muted-foreground">{String(o.contactPhone ?? "")}</div></div></Card>
        <Card><div className="p-4 pb-1 text-sm font-medium text-muted-foreground">Total</div><div className="p-4 pt-0"><div className="text-2xl font-bold">{money(num(o.totalAmount))}</div><div className="text-xs text-muted-foreground">Subtotal {money(num(o.subtotal))} · Tax {money(num(o.taxAmount))}</div></div></Card>
      </div>
      <Card>
        <div className="p-5 pb-3"><CardTitle>Parts &amp; Labour</CardTitle></div>
        <div className="space-y-4 p-5 pt-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Type</th><th className="font-medium">Item</th><th className="text-right font-medium">Qty</th><th className="text-right font-medium">Price</th><th className="text-right font-medium">Tax %</th><th className="text-right font-medium">Total</th><th /></tr></thead>
            <tbody>
              {lines.map((l) => <tr key={String(l.id)} className="border-b border-border"><td className="py-2"><Pill>{String(l.lineType)}</Pill></td><td>{String(l.description || l.productName || l.sku || "—")}{l.warehouseName ? <span className="text-xs text-muted-foreground"> · {String(l.warehouseName)}</span> : null}</td><td className="text-right">{num(l.quantity)}</td><td className="text-right">{money(num(l.unitPrice))}</td><td className="text-right">{num(l.taxRate)}%</td><td className="text-right">{money(num(l.lineTotal))}</td><td className="text-right">{!billed && <button type="button" aria-label="Remove line" className={btn.icon} onClick={() => removeLine(String(l.id))}><Trash2 /></button>}</td></tr>)}
              {lines.length === 0 && <tr><td colSpan={7} className="py-6 text-center text-muted-foreground">No lines yet.</td></tr>}
            </tbody>
          </table>
          {!billed && (
            <div className="grid items-end gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-[7rem_minmax(0,1fr)_minmax(0,1fr)_5rem_6rem_5rem_auto]">
              <div className="space-y-1"><Label className="text-xs">Type</Label><Select value={line.lineType} onChange={(v) => setLine({ ...line, lineType: v, productId: "", warehouseId: "" })} options={[{ value: "PART", label: "Part" }, { value: "LABOR", label: "Labour" }]} /></div>
              {line.lineType === "PART" ? <>
                <div className="space-y-1"><Label className="text-xs">Product</Label><ProductPicker size="md" value={line.productId} onChange={(pid, p) => setLine({ ...line, productId: pid, unitPrice: line.unitPrice || String(num(p?.retail) || ""), taxRate: line.taxRate || String(num(p?.tax) || "") })} /></div>
                <div className="space-y-1"><Label className="text-xs">Warehouse</Label><Select value={line.warehouseId} onChange={(v) => setLine({ ...line, warehouseId: v })} placeholder="—" options={warehouses.map((w) => ({ value: w.id, label: String(w.name) }))} /></div>
              </> : <div className="space-y-1 sm:col-span-2"><Label className="text-xs">Description</Label><input value={line.description} onChange={(e) => setLine({ ...line, description: e.target.value })} placeholder="e.g. Diagnostics + labour" className={inputCls} /></div>}
              <div className="space-y-1"><Label className="text-xs">Qty</Label><input type="number" step="0.001" value={line.quantity} onChange={(e) => setLine({ ...line, quantity: e.target.value })} aria-label="Qty" className={inputCls} /></div>
              <div className="space-y-1"><Label className="text-xs">Price</Label><input type="number" step="0.001" value={line.unitPrice} onChange={(e) => setLine({ ...line, unitPrice: e.target.value })} aria-label="Price" className={inputCls} /></div>
              <div className="space-y-1"><Label className="text-xs">Tax %</Label><input type="number" step="0.001" value={line.taxRate} placeholder="0" onChange={(e) => setLine({ ...line, taxRate: e.target.value })} aria-label="Tax %" className={inputCls} /></div>
              <button type="button" className={btn.primary} onClick={addLine}>Add</button>
            </div>
          )}
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between p-5 pb-3"><CardTitle>Device Photos</CardTitle><label className={cn(btn.smOutline, "cursor-pointer")}><Camera /> Add photo<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) addPhoto(file); e.currentTarget.value = ""; }} /></label></div>
        <div className="p-5 pt-0">{photos.length === 0 ? <p className="text-sm text-muted-foreground">No photos yet. Capture the device condition at intake.</p> : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{photos.map((p) => (
            <div key={String(p.id)} className="group relative overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={String(p.url)} alt={String(p.filename)} className="aspect-square w-full object-cover" />
              <button type="button" aria-label="Remove photo" onClick={() => save({ photos: photos.filter((x) => x.id !== p.id) })} className="absolute right-1 top-1 rounded bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100"><X className="size-3.5" /></button>
            </div>
          ))}</div>
        )}</div>
      </Card>
      {node}
    </div>
  );
}

/* ---------- appointments ---------- */

const APPT_STATUSES = ["SCHEDULED", "CONFIRMED", "CHECKED_IN", "COMPLETED", "CANCELLED", "NO_SHOW"];
const APPT_TONE: Record<string, string> = { SCHEDULED: "bg-blue-100 text-blue-800", CONFIRMED: "bg-indigo-100 text-indigo-800", CHECKED_IN: "bg-purple-100 text-purple-800", COMPLETED: "bg-emerald-100 text-emerald-800", CANCELLED: "bg-red-100 text-red-800", NO_SHOW: "bg-amber-100 text-amber-800" };
const hm = (iso: unknown) => new Date(String(iso)).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function Appointments() {
  const router = useRouter();
  const appts = useCollection("appointments");
  const [status, setStatus] = useState("ALL");
  const groups = useMemo(() => {
    const m = new Map<string, Rec[]>();
    for (const a of appts.filter((x) => status === "ALL" || x.status === status)) { const d = String(a.startAt).slice(0, 10); m.set(d, [...(m.get(d) ?? []), a]); }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([d, list]) => [d, list.sort((x, y) => String(x.startAt).localeCompare(String(y.startAt)))] as const);
  }, [appts, status]);
  return (
    <div className="space-y-4">
      <PageHeader title="Appointments" subtitle="Bookings for staff-service businesses — schedule, check in, and bill" actions={<button type="button" className={btn.primary} onClick={() => router.push("/appointments/new")}><Plus /> New appointment</button>} />
      <Select value={status} onChange={setStatus} options={[{ value: "ALL", label: "All statuses" }, ...APPT_STATUSES.map((s) => ({ value: s, label: s.replace("_", " ") }))]} className="w-44" ariaLabel="Status" />
      {groups.length === 0 ? (
        <Card><div className="flex flex-col items-center gap-2 p-10 text-center text-sm text-muted-foreground"><CalendarClock className="size-8 opacity-40" />No appointments. Click <span className="font-medium text-foreground">New appointment</span> to book one.</div></Card>
      ) : groups.map(([d, list]) => (
        <div key={d} className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{new Date(`${d}T00:00:00`).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</h3>
          {list.map((a) => (
            <Card key={a.id} className="cursor-pointer transition-colors hover:bg-muted/40">
              <button type="button" onClick={() => router.push(`/appointments/${a.id}`)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
                <div className="flex items-center gap-4">
                  <div className="flex w-20 items-center gap-1 text-sm font-medium"><Clock className="size-4 text-muted-foreground" />{hm(a.startAt)}</div>
                  <div><div className="font-medium">{String(a.title || a.productName || a.appointmentNumber)}</div><div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{Boolean(a.customerName) && <span>{String(a.customerName)}</span>}{Boolean(a.staffName) && <span className="flex items-center gap-1"><User className="size-3" /> {String(a.staffName)}</span>}{Boolean(a.resource) && <span>· {String(a.resource)}</span>}</div></div>
                </div>
                <div className="flex items-center gap-2">{num(a.price) > 0 && <span className="text-sm font-medium">{money(num(a.price))}</span>}{Boolean(a.invoiceId) && <Pill>Billed</Pill>}<Pill tone={APPT_TONE[String(a.status)]}>{String(a.status).replace("_", " ")}</Pill></div>
              </button>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
}

const localInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
function nextHour() { const s = new Date(); s.setMinutes(0, 0, 0); s.setHours(s.getHours() + 1); return { start: localInput(s), end: localInput(new Date(s.getTime() + 3600_000)) }; }

export function NewAppointment() {
  const router = useRouter();
  const customers = useCollection("customers");
  const staff = useStaff();
  const services = useCollection("products").filter((p) => p.status !== "INACTIVE");
  const [f, setF] = useState(() => { const t = nextHour(); return { customerId: "", staffId: "", productId: "", title: "", startAt: t.start, endAt: t.end, resource: "", price: "", taxRate: "", contactPhone: "", notes: "" }; });
  const { node, flash } = useFlash();
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  function pickService(id: string) { const p = services.find((x) => x.id === id); setF((x) => ({ ...x, productId: id, price: p && num(p.retail) ? String(num(p.retail)) : x.price, taxRate: p && num(p.tax) ? String(num(p.tax)) : x.taxRate, title: x.title || String(p?.name ?? "") })); }
  function book() {
    if (!f.startAt || !f.endAt) return flash("Pick a start and end time", true);
    if (f.endAt <= f.startAt) return flash("End must be after start", true);
    const startAt = new Date(f.startAt).toISOString(), endAt = new Date(f.endAt).toISOString();
    const clash = readCollection("appointments").find((a) => !["CANCELLED", "NO_SHOW"].includes(String(a.status)) && ((f.staffId && a.staffId === f.staffId) || (f.resource && a.resource === f.resource)) && String(a.startAt) < endAt && String(a.endAt) > startAt);
    if (clash) return flash(`Clashes with ${clash.appointmentNumber} (${hm(clash.startAt)}–${hm(clash.endAt)})`, true);
    const c = customers.find((x) => x.id === f.customerId);
    const a = createRecord("appointments", { ...f, startAt, endAt, price: f.price ? num(f.price) : 0, taxRate: f.taxRate ? num(f.taxRate) : 0, customerName: c?.name, contactPhone: f.contactPhone || c?.phone, staffName: staff.find((s) => s.id === f.staffId)?.name, productName: services.find((p) => p.id === f.productId)?.name, appointmentNumber: nextNumber("appointments", "APT", 4), status: "SCHEDULED" });
    router.push(`/appointments/${a.id}`);
  }
  const input = (k: keyof typeof f, label: string, type = "text", placeholder = "") => <Field label={label} htmlFor={`ap-${k}`}><input id={`ap-${k}`} type={type} min={type === "number" ? 0 : undefined} value={f[k]} placeholder={placeholder} onChange={(e) => set(k, e.target.value)} className={inputCls} /></Field>;
  return (
    <div className="space-y-4">
      <PageHeader title="New Appointment" subtitle="Book a customer with a provider for a time slot" />
      <Card>
        <div className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer" htmlFor="ap-cust"><Select id="ap-cust" value={f.customerId} onChange={(v) => set("customerId", v)} placeholder="Walk-in / none" options={customers.map((c) => ({ value: c.id, label: String(c.name) }))} /></Field>
            <Field label="Provider (staff)" htmlFor="ap-staff"><Select id="ap-staff" value={f.staffId} onChange={(v) => set("staffId", v)} placeholder="Unassigned" options={staff.map((s) => ({ value: s.id, label: s.name }))} /></Field>
            <Field label="Service" htmlFor="ap-svc"><Select id="ap-svc" value={f.productId} onChange={pickService} placeholder="None" options={services.map((p) => ({ value: p.id, label: String(p.name) }))} /></Field>
            {input("title", "Title", "text", "Haircut & style")}
            {input("startAt", "Start", "datetime-local")}
            {input("endAt", "End", "datetime-local")}
            {input("resource", "Resource (chair / room)", "text", "Chair 2")}
            {input("contactPhone", "Contact phone")}
            {input("price", "Price", "number")}
            {input("taxRate", "Tax rate %", "number")}
          </div>
          <Field label="Notes" htmlFor="ap-notes"><textarea id="ap-notes" rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} className={textareaCls} /></Field>
          <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => router.push("/appointments")}>Cancel</button><button type="button" className={btn.primary} onClick={book}>Book appointment</button></div>
        </div>
      </Card>
      {node}
    </div>
  );
}

export function AppointmentDetail({ id }: { id: string }) {
  const router = useRouter();
  const appts = useCollection("appointments");
  const [mode, setMode] = useState("CASH");
  const a = appts.find((x) => x.id === id);
  if (!appts.length) return null;
  if (!a) return <p className="p-6 text-sm text-muted-foreground">Appointment not found.</p>;
  function bill() {
    const inv = createInvoice({ customer: String(a!.customerName || "Walk-in customer"), date: today(), dueDate: today(), paymentMode: invoiceMode(mode), reference: a!.appointmentNumber, notes: `Appointment ${a!.appointmentNumber}`, lines: [{ productId: a!.productId as string | undefined, description: String(a!.title || a!.productName || "Appointment"), qty: 1, unitPrice: num(a!.price), discPct: 0, taxPct: num(a!.taxRate) }] });
    updateRecord("appointments", a!.id, { invoiceId: inv.id, status: a!.status === "CANCELLED" ? a!.status : "COMPLETED" });
    router.push(`/ar/invoices/${inv.id}`);
  }
  return (
    <div className="space-y-4">
      <PageHeader title={String(a.title || a.appointmentNumber)} subtitle={String(a.appointmentNumber)} actions={<>
        <Pill tone={APPT_TONE[String(a.status)]}>{String(a.status).replace("_", " ")}</Pill>
        {!a.invoiceId && num(a.price) > 0 && <>
          <Select ariaLabel="Payment mode" value={mode} onChange={setMode} options={PAY_MODES} className="w-44" />
          <button type="button" className={btn.primary} onClick={bill}><Receipt /> {mode === "CREDIT" ? "Bill on account" : "Check out"}</button>
        </>}
        {Boolean(a.invoiceId) && <button type="button" className={btn.outline} onClick={() => router.push(`/ar/invoices/${a.invoiceId}`)}>View invoice</button>}
      </>} />
      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <div className="p-5 pb-3"><CardTitle>Details</CardTitle></div>
          <div className="space-y-2 p-5 pt-0 text-sm">
            <div className="flex items-center gap-2"><Clock className="size-4 text-muted-foreground" />{new Date(String(a.startAt)).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })} — {hm(a.endAt)}</div>
            {Boolean(a.customerName) && <div>Customer: <span className="font-medium">{String(a.customerName)}</span></div>}
            {Boolean(a.staffName) && <div className="flex items-center gap-2"><User className="size-4 text-muted-foreground" /> {String(a.staffName)}</div>}
            {Boolean(a.productName) && <div>Service: {String(a.productName)}</div>}
            {Boolean(a.resource) && <div>Resource: {String(a.resource)}</div>}
            {Boolean(a.contactPhone) && <div className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" /> {String(a.contactPhone)}</div>}
            {num(a.price) > 0 && <div>Price: <span className="font-medium">{money(num(a.price))}</span>{num(a.taxRate) > 0 && <span className="text-muted-foreground"> + {num(a.taxRate)}% tax</span>}</div>}
            {Boolean(a.notes) && <p className="whitespace-pre-wrap text-muted-foreground">{String(a.notes)}</p>}
          </div>
        </Card>
        <Card>
          <div className="p-5 pb-3"><CardTitle>Status</CardTitle></div>
          <div className="flex flex-col gap-2 p-5 pt-0">
            {APPT_STATUSES.map((s) => <button key={s} type="button" disabled={a.status === s} className={cn(a.status === s ? btn.smPrimary : btn.smOutline, "justify-start disabled:opacity-100")} onClick={() => updateRecord("appointments", a.id, { status: s })}>{s.replace("_", " ")}</button>)}
            <button type="button" className={cn(btn.ghost, "h-8 justify-start px-3 text-xs text-destructive")} onClick={() => { if (confirm(`Delete ${a.appointmentNumber}?`)) { deleteRecord("appointments", a.id); router.push("/appointments"); } }}><Trash2 /> Delete</button>
          </div>
        </Card>
      </div>
      <p className="text-xs text-muted-foreground"><Link href="/appointments" className="underline">Back to appointments</Link></p>
    </div>
  );
}
