"use client";

// Manufacturing pages: production orders, work orders, work centers, maintenance, job work and MRP.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, CalendarClock, ChevronDown, Download, CheckCircle2, Factory, Hammer, Layers, Loader2, Pencil, Play, Plus, Settings2, ShoppingCart, Trash2, Wrench } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { useMoves } from "@/lib/stock";
import {
  completeMaintenance, completeProduction, createJobWork, createProductionOrder, itc04, laborCost, planFromBom, raiseMaintenance, receiveJobWork, registerEquipment, runMrp, runPreventive, setMaintenanceStatus, setOrderStatus,
  type JwLine, type Material,
} from "@/lib/manufacturing";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, Dialog, Field, Label, PageHeader, RowMenu, SidePanel, btn, downloadFile, inputCls, money, num, textareaCls, toCSV, toExcelHTML, today } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner, StatusBadge } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";

function useFlash() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const node = msg && <div role="status" className={cn("fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg", msg.bad ? "border-destructive/30 bg-destructive text-white" : "border-border bg-card")}>{msg.text}</div>;
  return { node, flash: (text: string, bad = false) => { setMsg({ text, bad }); setTimeout(() => setMsg(null), 3000); } };
}
const Pill = ({ children, tone }: { children: React.ReactNode; tone?: string }) => <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-xs font-medium", tone)}>{children}</span>;
const Th = ({ children, right }: { children?: React.ReactNode; right?: boolean }) => <th className={cn("px-2 py-2 text-left font-medium text-muted-foreground", right && "text-right")}>{children}</th>;
const Empty = ({ icon: Icon, title, text }: { icon: typeof Layers; title: string; text: string }) => (
  <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center"><div className="rounded-full bg-muted p-3"><Icon className="size-5 text-muted-foreground" /></div><p className="font-semibold">{title}</p><p className="max-w-sm text-sm text-muted-foreground">{text}</p></div>
);
const fmt = (v: unknown, d = 3) => num(v).toFixed(d);
const date = (iso: unknown, time = false) => (iso ? new Date(String(iso)).toLocaleString(undefined, time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }) : "—");
const WO_STATUSES = ["PLANNED", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"];

/* ---------- production orders ---------- */

const P_BASE = "/manufacturing/production-orders";
const PO_TABS = [["ALL", "All"], ["DRAFT", "Draft"], ["PLANNED", "Planned"], ["RELEASED", "Released"], ["IN_PROGRESS", "In progress"], ["COMPLETED", "Completed"]];

export function ProductionOrders() {
  const router = useRouter();
  const sub = subOf(usePathname(), P_BASE);
  const orders = useCollection("production-orders");
  const [status, setStatus] = useState("ALL");
  const close = () => router.push(P_BASE);
  const rows = [...orders].filter((o) => status === "ALL" || o.status === status).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const detail = sub && sub !== "new" ? orders.find((o) => o.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Production Orders" subtitle="Plan and execute manufacturing runs" actions={<Link href={`${P_BASE}/new`} className={btn.primary}><Plus /> New order</Link>} />
      <Card>
        <div className="space-y-3 p-5">
          <div role="tablist" className="inline-flex flex-wrap rounded-lg bg-muted p-1 text-sm">{PO_TABS.map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={status === v} onClick={() => setStatus(v)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", status === v && "bg-background text-foreground shadow")}>{l}</button>)}</div>
          {rows.length === 0 ? <Empty icon={Layers} title="No production orders yet" text="Create a production order to plan a manufacturing run from a BOM." /> : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-border"><Th>Order #</Th><Th>Product</Th><Th>Quantity</Th><Th>Planned start</Th><Th>Planned end</Th><Th>Status</Th><Th /></tr></thead>
              <tbody>{rows.map((o) => (
                <tr key={o.id} onClick={() => router.push(`${P_BASE}/${o.id}`)} className="cursor-pointer border-b border-border hover:bg-muted/50">
                  <td className="px-2 py-2 font-mono text-xs">{String(o.orderNumber)}</td><td className="px-2 py-2"><div className="font-medium">{String(o.productName)}</div><div className="text-xs text-muted-foreground">{String(o.productSku ?? "")}</div></td>
                  <td className="px-2 py-2 tabular-nums">{fmt(o.quantity)}</td><td className="px-2 py-2">{date(o.plannedStartDate)}</td><td className="px-2 py-2">{date(o.plannedEndDate)}</td><td className="px-2 py-2"><StatusBadge status={o.status} /></td>
                  <td className="px-2 py-2 text-right" onClick={(e) => e.stopPropagation()}><RowMenu items={[{ label: "Open", onSelect: () => router.push(`${P_BASE}/${o.id}`) }, ...(o.status === "DRAFT" || o.status === "PLANNED" ? [{ label: "Delete", destructive: true, onSelect: () => { if (confirm(`Delete ${o.orderNumber}?`)) { readCollection("work-orders").filter((w) => w.productionOrderId === o.id).forEach((w) => deleteRecord("work-orders", w.id)); deleteRecord("production-orders", o.id); } } }] : [])]} /></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </Card>
      {sub === "new" && <SidePanel onClose={close}><NewProductionOrder onDone={(id) => router.push(`${P_BASE}/${id}`)} onCancel={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><ProductionOrderDetail key={detail.id} order={detail} /></SidePanel>}
    </div>
  );
}

function NewProductionOrder({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const products = useCollection("products").filter((p) => p.status !== "INACTIVE");
  const warehouses = useCollection("warehouses").filter((w) => w.status !== "INACTIVE" && !w.isVan);
  const boms = useCollection("boms");
  const [f, setF] = useState({ productId: "", quantity: "", warehouseId: "", plannedStartDate: today(), plannedEndDate: "", notes: "" });
  const wh = f.warehouseId || warehouses[0]?.id || "";
  const hasBom = f.productId && boms.some((b) => b.productId === f.productId && b.status === "ACTIVE");
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.productId || !num(f.quantity)) return;
    const o = createProductionOrder({ productId: f.productId, quantity: num(f.quantity), warehouseId: wh || undefined, plannedStartDate: f.plannedStartDate || undefined, plannedEndDate: f.plannedEndDate || undefined, notes: f.notes || undefined });
    onDone(o.id);
  }
  const next = `MO-${String(readCollection("production-orders").length + 1).padStart(2, "0")}`;
  return (
    <form onSubmit={submit} className="space-y-4">
      <button type="button" onClick={onCancel} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back</button>
      <div><h1 className="text-2xl font-semibold tracking-tight">New Production Order</h1><p className="text-sm text-muted-foreground">Plan a manufacturing run from a BOM</p></div>
      <Card>
        <div className="space-y-4 p-5">
          <NumberBanner label="Order #" value={next} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Product *</Label><Select value={f.productId} onChange={(v) => setF({ ...f, productId: v })} placeholder="Choose finished good…" options={products.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))} /></div>
            <Field label="Quantity *" htmlFor="po-qty"><input id="po-qty" type="number" step="0.001" required value={f.quantity} onChange={(e) => setF({ ...f, quantity: e.target.value })} className={inputCls} /></Field>
          </div>
          {f.productId && !hasBom && <p className="text-xs text-warning">This product has no active BOM yet — add one under Inventory › BOM before planning.</p>}
          <div className="space-y-2"><Label>Warehouse</Label><Select value={wh} onChange={(v) => setF({ ...f, warehouseId: v })} placeholder="Choose warehouse…" options={warehouses.map((w) => ({ value: w.id, label: String(w.name) }))} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Planned start</Label><DateInput value={f.plannedStartDate} onChange={(v) => setF({ ...f, plannedStartDate: v })} /></div>
            <div className="space-y-2"><Label>Planned end</Label><DateInput value={f.plannedEndDate} onChange={(v) => setF({ ...f, plannedEndDate: v })} /></div>
          </div>
          <Field label="Notes" htmlFor="po-notes"><input id="po-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={inputCls} /></Field>
          <p className="text-xs text-muted-foreground">An active BOM for the product will be auto-linked. After creation, use <strong>Plan from BOM</strong> to snapshot the required materials.</p>
        </div>
      </Card>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onCancel}>Cancel</button><button type="submit" className={btn.primary} disabled={!f.productId || !f.quantity}>Create</button></div>
    </form>
  );
}

function ProductionOrderDetail({ order: o }: { order: Rec }) {
  const router = useRouter();
  const workOrders = useCollection("work-orders").filter((w) => w.productionOrderId === o.id).sort((a, b) => num(a.sequenceNo) - num(b.sequenceNo));
  const centers = useCollection("work-centers").filter((c) => c.isActive !== false);
  const warehouses = useCollection("warehouses");
  useMoves();
  const [tab, setTab] = useState("materials");
  const [completing, setCompleting] = useState(false);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState({ produced: String(num(o.quantity)), scrap: "0", notes: "" });
  const [op, setOp] = useState({ operationName: "", workstation: "", sequenceNo: String((workOrders.length + 1) * 10), plannedHours: "" });
  const { node, flash } = useFlash();
  const materials = (o.materials as Material[]) ?? [];
  const outputs = (o.outputs as Rec[]) ?? [];
  const act = (fn: () => void, label: string) => { try { fn(); flash(label); } catch (e) { flash((e as Error).message, true); } };
  const open = o.status !== "COMPLETED" && o.status !== "CANCELLED";
  return (
    <div className="space-y-4">
      <button type="button" onClick={() => router.push(P_BASE)} className={cn(btn.ghost, "h-8 px-2 text-xs")}><ArrowLeft /> Back</button>
      <PageHeader title={String(o.orderNumber)} subtitle={`${o.productName} · ${fmt(o.quantity)} units`} actions={<>
        {o.status === "DRAFT" && <button type="button" className={btn.primary} onClick={() => act(() => planFromBom(o.id), "Planned")}><Layers /> Plan from BOM</button>}
        {o.status === "PLANNED" && <button type="button" className={btn.primary} onClick={() => act(() => setOrderStatus(o.id, "RELEASED"), "Released")}>Release</button>}
        {o.status === "RELEASED" && <button type="button" className={btn.primary} onClick={() => act(() => setOrderStatus(o.id, "IN_PROGRESS"), "Started")}><Play /> Start</button>}
        {(o.status === "RELEASED" || o.status === "IN_PROGRESS") && <button type="button" className={btn.primary} onClick={() => setCompleting(true)}><CheckCircle2 /> Complete</button>}
        {open && <button type="button" className={btn.outline} onClick={() => act(() => setOrderStatus(o.id, "CANCELLED"), "Cancelled")}>Cancel</button>}
      </>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><div className="p-4 pb-1 text-sm text-muted-foreground">Status</div><div className="p-4 pt-0"><StatusBadge status={o.status} /></div></Card>
        <Card><div className="p-4 pb-1 text-sm text-muted-foreground">Quantity</div><div className="p-4 pt-0 text-xl font-semibold tabular-nums">{fmt(o.quantity)}</div></Card>
        <Card><div className="p-4 pb-1 text-sm text-muted-foreground">BOM</div><div className="p-4 pt-0 font-medium">{o.bomName ? String(o.bomName) : <span className="text-muted-foreground">None</span>}</div></Card>
        <Card><div className="p-4 pb-1 text-sm text-muted-foreground">Warehouse</div><div className="p-4 pt-0">{open ? <Select size="sm" value={String(o.warehouseId ?? "")} onChange={(v) => updateRecord("production-orders", o.id, { warehouseId: v })} placeholder="—" options={warehouses.filter((w) => !w.isVan).map((w) => ({ value: w.id, label: String(w.name) }))} ariaLabel="Warehouse" /> : <span className="font-medium">{String(warehouses.find((w) => w.id === o.warehouseId)?.name ?? "—")}</span>}</div></Card>
      </div>
      <div role="tablist" className="inline-flex rounded-lg bg-muted p-1 text-sm">{[["materials", `Materials (${materials.length})`], ["work-orders", `Work orders (${workOrders.length})`], ["outputs", `Outputs (${outputs.length})`]].map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", tab === v && "bg-background text-foreground shadow")}>{l}</button>)}</div>
      <Card><div className="p-5">
        {tab === "materials" && (materials.length === 0 ? <p className="text-sm text-muted-foreground">No materials snapshot yet. Click <strong>Plan from BOM</strong> to populate.</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>SKU</Th><Th>Component</Th><Th>Planned</Th><Th>Actual</Th><Th>Unit cost</Th></tr></thead>
            <tbody>{materials.map((m) => <tr key={m.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{m.componentSku}</td><td className="px-2 py-2">{m.componentName}</td><td className="px-2 py-2 tabular-nums">{fmt(m.plannedQuantity, 4)}</td><td className="px-2 py-2 tabular-nums">{fmt(m.actualQuantity, 4)}</td><td className="px-2 py-2 tabular-nums">{m.unitCost ? fmt(m.unitCost) : "—"}</td></tr>)}</tbody></table>
        ))}
        {tab === "work-orders" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between"><div className="font-medium">Operations</div>{open && <button type="button" className={btn.smOutline} onClick={() => setAdding(true)}><Plus /> Add operation</button>}</div>
            {workOrders.length === 0 ? <p className="text-sm text-muted-foreground">No operations yet</p> : (
              <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>#</Th><Th>Operation</Th><Th>Workstation</Th><Th>Planned hrs</Th><Th>Actual hrs</Th><Th>Status</Th></tr></thead>
                <tbody>{workOrders.map((w) => <tr key={w.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{num(w.sequenceNo)}</td><td className="px-2 py-2 font-medium">{String(w.operationName)}</td><td className="px-2 py-2">{String(w.workstation || "—")}</td><td className="px-2 py-2">{w.plannedHours ? num(w.plannedHours) : "—"}</td><td className="px-2 py-2">{w.actualHours ? num(w.actualHours) : "—"}</td><td className="px-2 py-2"><StatusBadge status={w.status} /></td></tr>)}</tbody></table>
            )}
            {laborCost(o.id) > 0 && <p className="text-xs text-muted-foreground">Labour so far: {money(laborCost(o.id))} — absorbed into the finished goods on completion.</p>}
          </div>
        )}
        {tab === "outputs" && (outputs.length === 0 ? <p className="text-sm text-muted-foreground">No outputs recorded yet</p> : (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>Produced</Th><Th>Scrap</Th><Th>Unit cost</Th><Th>Notes</Th></tr></thead>
            <tbody>{outputs.map((x) => <tr key={String(x.id)} className="border-b border-border"><td className="px-2 py-2">{date(x.outputDate, true)}</td><td className="px-2 py-2 font-medium tabular-nums">{fmt(x.producedQuantity)}</td><td className="px-2 py-2 tabular-nums">{fmt(x.scrapQuantity)}</td><td className="px-2 py-2 tabular-nums" title={`Materials ${money(num(x.materialCost))} + labour ${money(num(x.laborCost))}`}>{money(num(x.unitCost))}</td><td className="px-2 py-2 text-muted-foreground">{String(x.notes || "—")}</td></tr>)}</tbody></table>
        ))}
      </div></Card>
      <Dialog open={completing} onClose={() => setCompleting(false)} title="Complete production run">
        <Pill tone="w-fit">Will consume materials (MFG_CONSUME) and produce output (MFG_OUTPUT)</Pill>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Produced *" htmlFor="pc-prod"><input id="pc-prod" type="number" step="0.001" value={done.produced} onChange={(e) => setDone({ ...done, produced: e.target.value })} className={inputCls} /></Field>
          <Field label="Scrap" htmlFor="pc-scrap"><input id="pc-scrap" type="number" step="0.001" value={done.scrap} onChange={(e) => setDone({ ...done, scrap: e.target.value })} className={inputCls} /></Field>
        </div>
        <Field label="Notes" htmlFor="pc-notes"><input id="pc-notes" value={done.notes} onChange={(e) => setDone({ ...done, notes: e.target.value })} className={inputCls} /></Field>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!done.produced} onClick={() => { try { completeProduction(o.id, num(done.produced), num(done.scrap), done.notes || undefined); setCompleting(false); setTab("outputs"); flash("Completed"); } catch (e) { flash((e as Error).message, true); } }}>Complete</button></div>
      </Dialog>
      <Dialog open={adding} onClose={() => setAdding(false)} title="New work order">
        <Field label="Operation name *" htmlFor="op-name"><input id="op-name" autoFocus value={op.operationName} onChange={(e) => setOp({ ...op, operationName: e.target.value })} className={inputCls} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Workstation" htmlFor="op-ws"><input id="op-ws" list="work-centers" value={op.workstation} onChange={(e) => setOp({ ...op, workstation: e.target.value })} className={inputCls} /><datalist id="work-centers">{centers.map((c) => <option key={c.id} value={String(c.code)}>{String(c.name)}</option>)}</datalist></Field>
          <Field label="Sequence #" htmlFor="op-seq"><input id="op-seq" type="number" value={op.sequenceNo} onChange={(e) => setOp({ ...op, sequenceNo: e.target.value })} className={inputCls} /></Field>
        </div>
        <Field label="Planned hours" htmlFor="op-hrs"><input id="op-hrs" type="number" step="0.5" value={op.plannedHours} onChange={(e) => setOp({ ...op, plannedHours: e.target.value })} className={inputCls} /></Field>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!op.operationName.trim()} onClick={() => {
          createRecord("work-orders", { productionOrderId: o.id, productionOrderNumber: o.orderNumber, operationName: op.operationName.trim(), workstation: op.workstation || undefined, sequenceNo: num(op.sequenceNo), plannedHours: op.plannedHours ? num(op.plannedHours) : undefined, status: "PLANNED" });
          setAdding(false); setOp({ operationName: "", workstation: "", sequenceNo: String((workOrders.length + 2) * 10), plannedHours: "" }); flash("Operation added");
        }}>Add</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- work orders ---------- */

// Status changes stamp the clock; completing asks for actual hours (defaulting to the time it ran).
function setWoStatus(w: Rec, status: string) {
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status };
  if (status === "IN_PROGRESS" && !w.startedAt) patch.startedAt = now;
  if (status === "COMPLETED") {
    const ran = w.startedAt ? Math.round(((Date.now() - new Date(String(w.startedAt)).getTime()) / 3600_000) * 100) / 100 : num(w.plannedHours);
    const ans = window.prompt(`Actual hours for "${w.operationName}"`, String(num(w.actualHours) || ran || num(w.plannedHours) || 0));
    if (ans === null) return false;
    patch.actualHours = num(ans);
    patch.completedAt = now;
  }
  updateRecord("work-orders", w.id, patch);
  return true;
}

export function WorkOrders() {
  const wos = useCollection("work-orders");
  const [status, setStatus] = useState("ALL");
  const { node, flash } = useFlash();
  const rows = [...wos].filter((w) => status === "ALL" || w.status === status).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return (
    <div className="space-y-4">
      <PageHeader title="Work Orders" subtitle="Per-operation execution tracking across production orders" />
      <Card><div className="space-y-3 p-5">
        <Select value={status} onChange={setStatus} options={[{ value: "ALL", label: "All statuses" }, ...WO_STATUSES.map((s) => ({ value: s, label: s }))]} className="w-44" ariaLabel="Status" />
        {rows.length === 0 ? <Empty icon={Settings2} title="No work orders" text="Add operations from a production order detail page." /> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><Th>Operation</Th><Th>Production order</Th><Th>Workstation</Th><Th>Planned hrs</Th><Th>Actual hrs</Th><Th>Status</Th><Th /></tr></thead>
            <tbody>{rows.map((w) => (
              <tr key={w.id} className="border-b border-border">
                <td className="px-2 py-2 font-medium">{String(w.operationName)}</td><td className="px-2 py-2"><Link href={`${P_BASE}/${w.productionOrderId}`} className="font-mono text-xs text-primary hover:underline">{String(w.productionOrderNumber)}</Link></td>
                <td className="px-2 py-2">{String(w.workstation || "—")}</td><td className="px-2 py-2">{w.plannedHours ? num(w.plannedHours) : "—"}</td><td className="px-2 py-2">{w.actualHours ? num(w.actualHours) : "—"}</td>
                <td className="px-2 py-2"><Select size="sm" value={String(w.status)} onChange={(v) => setWoStatus(w, v) && flash(`Marked ${v}`)} options={WO_STATUSES.map((s) => ({ value: s, label: s }))} className="w-36" ariaLabel={`Status of ${w.operationName}`} /></td>
                <td className="px-2 py-2 text-right">{(w.status === "PLANNED" || w.status === "PAUSED") && <RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${w.operationName}?`) && deleteRecord("work-orders", w.id) }]} />}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- work centers ---------- */

const WC_BLANK = { code: "", name: "", description: "", capacityHoursPerDay: "8", costPerHour: "0" };

export function WorkCenters() {
  const centers = useCollection("work-centers");
  const wos = useCollection("work-orders");
  const [form, setForm] = useState<typeof WC_BLANK | null>(null);
  const [editing, setEditing] = useState<Rec | null>(null);
  const { node, flash } = useFlash();
  const month = today().slice(0, 7);
  const stats = (c: Rec) => {
    const mine = wos.filter((w) => w.workstation === c.code || w.workstation === c.name);
    const open = mine.filter((w) => ["PLANNED", "IN_PROGRESS", "PAUSED"].includes(String(w.status)));
    const hrs = mine.filter((w) => w.status === "COMPLETED" && String(w.completedAt ?? "").slice(0, 7) === month).reduce((a, w) => a + num(w.actualHours), 0);
    return { openWos: open.length, openPlanned: open.reduce((a, w) => a + num(w.plannedHours), 0), hrs, cost: hrs * num(c.costPerHour) };
  };
  function save() {
    if (!form) return;
    if (centers.some((c) => c.id !== editing?.id && String(c.code).toLowerCase() === form.code.trim().toLowerCase())) return flash(`Code ${form.code} is already used`, true);
    const data = { code: form.code.trim(), name: form.name.trim(), description: form.description || undefined, capacityHoursPerDay: num(form.capacityHoursPerDay) || 8, costPerHour: num(form.costPerHour) };
    if (editing) updateRecord("work-centers", editing.id, data); else createRecord("work-centers", { ...data, isActive: true });
    flash(editing ? "Work center updated" : "Work center created"); setForm(null); setEditing(null);
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Work Centers" subtitle="Where operations run — daily capacity and hourly cost rate. Load and labor cost update live from work orders." actions={<button type="button" className={btn.primary} onClick={() => { setEditing(null); setForm(WC_BLANK); }}><Plus /> New work center</button>} />
      <Card><div className="p-5">{centers.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No work centers yet.</p> : (
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead><tr className="border-b border-border"><Th>Code</Th><Th>Name</Th><Th right>Capacity (h/day)</Th><Th right>Cost / hour</Th><Th right>Open WOs</Th><Th right>Open planned h</Th><Th right>Hours this month</Th><Th right>Labor cost (month)</Th><Th /></tr></thead>
          <tbody>{centers.map((c) => { const s = stats(c); return (
            <tr key={c.id} className={cn("border-b border-border", c.isActive === false && "opacity-50")}>
              <td className="px-2 py-2 font-mono text-xs"><span className="inline-flex items-center gap-1"><Factory className="size-3.5 text-muted-foreground" /> {String(c.code)}</span></td>
              <td className="px-2 py-2">{String(c.name)}{c.isActive === false && <Pill tone="ml-2">inactive</Pill>}</td>
              <td className="px-2 py-2 text-right tabular-nums">{num(c.capacityHoursPerDay)}</td><td className="px-2 py-2 text-right tabular-nums">{money(num(c.costPerHour))}</td><td className="px-2 py-2 text-right tabular-nums">{s.openWos}</td><td className="px-2 py-2 text-right tabular-nums">{s.openPlanned}</td><td className="px-2 py-2 text-right tabular-nums">{s.hrs}</td><td className="px-2 py-2 text-right tabular-nums">{money(s.cost)}</td>
              <td className="px-2 py-2"><div className="flex justify-end gap-1">
                <button type="button" aria-label="Edit" className={btn.icon} onClick={() => { setEditing(c); setForm({ code: String(c.code), name: String(c.name), description: String(c.description ?? ""), capacityHoursPerDay: String(num(c.capacityHoursPerDay)), costPerHour: String(num(c.costPerHour)) }); }}><Pencil /></button>
                <button type="button" className={cn(btn.ghost, "h-8 px-2 text-xs")} onClick={() => updateRecord("work-centers", c.id, { isActive: c.isActive === false })}>{c.isActive === false ? "Enable" : "Disable"}</button>
                <button type="button" aria-label="Delete" className={btn.icon} onClick={() => (wos.some((w) => w.workstation === c.code || w.workstation === c.name) ? flash("Cannot delete — work orders use this center. Disable it instead.", true) : (deleteRecord("work-centers", c.id), flash("Work center deleted")))}><Trash2 /></button>
              </div></td>
            </tr>
          ); })}</tbody>
        </table></div>
      )}</div></Card>
      <Dialog open={!!form} onClose={() => setForm(null)} title={editing ? "Edit work center" : "New work center"}>
        {form && <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Code" htmlFor="wc-code"><input id="wc-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="ASSY-1" className={inputCls} /></Field>
            <Field label="Name" htmlFor="wc-name"><input id="wc-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Assembly line 1" className={inputCls} /></Field>
            <Field label="Capacity (hours/day)" htmlFor="wc-cap"><input id="wc-cap" type="number" min="0.5" step="0.5" value={form.capacityHoursPerDay} onChange={(e) => setForm({ ...form, capacityHoursPerDay: e.target.value })} className={inputCls} /></Field>
            <Field label="Cost per hour" htmlFor="wc-cost"><input id="wc-cost" type="number" min="0" step="0.5" value={form.costPerHour} onChange={(e) => setForm({ ...form, costPerHour: e.target.value })} className={inputCls} /></Field>
          </div>
          <Field label="Description" htmlFor="wc-desc"><input id="wc-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></Field>
          <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!form.code.trim() || !form.name.trim()} onClick={save}>{editing ? "Save" : "Create"}</button></div>
        </div>}
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- maintenance ---------- */

const RUN_KEY = "taxgo:preventive-last-run";

export function Maintenance() {
  const equipment = useCollection("equipment");
  const requests = useCollection("maintenance-requests");
  const [status, setStatus] = useState("OPEN");
  const [eq, setEq] = useState({ code: "", name: "", location: "", preventiveIntervalDays: "" });
  const [raising, setRaising] = useState(false);
  const [req, setReq] = useState({ equipmentId: "", title: "", description: "", priority: "MEDIUM" });
  const [completing, setCompleting] = useState<Rec | null>(null);
  const [c, setC] = useState({ downtimeHours: "", resolution: "" });
  const { node, flash } = useFlash();
  // Stands in for live's nightly 02:00 job: the first visit each day raises due preventive work.
  useEffect(() => {
    try { if (localStorage.getItem(RUN_KEY) !== today()) { localStorage.setItem(RUN_KEY, today()); runPreventive(); } } catch {}
  }, []);
  const rows = [...requests].filter((r) => status === "ALL" || r.status === status).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const openCount = (id: string) => requests.filter((r) => r.equipmentId === id && ["OPEN", "IN_PROGRESS"].includes(String(r.status))).length;
  return (
    <div className="space-y-4">
      <PageHeader title="Maintenance" subtitle="Equipment registry, preventive schedules (nightly at 02:00) and corrective tickets." actions={<>
        <button type="button" className={btn.outline} onClick={() => { const n = runPreventive(); flash(`${n} preventive request${n === 1 ? "" : "s"} raised`); }}><CalendarClock /> Run preventive now</button>
        <button type="button" className={btn.primary} onClick={() => setRaising(true)}><Plus /> New request</button>
      </>} />
      <Card>
        <div className="p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Wrench className="size-4" /> Equipment</CardTitle></div>
        <div className="space-y-3 p-5 pt-0">
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-28 space-y-1"><Label className="text-xs" htmlFor="eq-code">Code</Label><input id="eq-code" placeholder="CNC-01" value={eq.code} onChange={(e) => setEq({ ...eq, code: e.target.value })} className={inputCls} /></div>
            <div className="w-48 space-y-1"><Label className="text-xs" htmlFor="eq-name">Name</Label><input id="eq-name" placeholder="CNC mill" value={eq.name} onChange={(e) => setEq({ ...eq, name: e.target.value })} className={inputCls} /></div>
            <div className="w-40 space-y-1"><Label className="text-xs" htmlFor="eq-loc">Location</Label><input id="eq-loc" value={eq.location} onChange={(e) => setEq({ ...eq, location: e.target.value })} className={inputCls} /></div>
            <div className="w-40 space-y-1"><Label className="text-xs" htmlFor="eq-int">Preventive every (days)</Label><input id="eq-int" type="number" min="1" value={eq.preventiveIntervalDays} onChange={(e) => setEq({ ...eq, preventiveIntervalDays: e.target.value })} className={inputCls} /></div>
            <button type="button" className={btn.smPrimary} disabled={!eq.code.trim() || !eq.name.trim()} onClick={() => { try { registerEquipment({ code: eq.code.trim(), name: eq.name.trim(), location: eq.location || undefined, preventiveIntervalDays: eq.preventiveIntervalDays ? parseInt(eq.preventiveIntervalDays) : undefined }); setEq({ code: "", name: "", location: "", preventiveIntervalDays: "" }); flash("Equipment registered"); } catch (e) { flash((e as Error).message, true); } }}><Plus /> Register</button>
          </div>
          {equipment.length > 0 && <div className="divide-y divide-border rounded-md border border-border">{equipment.map((e) => (
            <div key={e.id} className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm">
              <span className="font-mono text-xs font-semibold">{String(e.code)}</span><span>{String(e.name)}{e.location ? ` · ${e.location}` : ""}</span>
              <Badge tone={e.status === "DOWN" ? "destructive" : "muted"}>{String(e.status)}</Badge>
              {Boolean(e.nextPreventiveDue) && <span className="text-xs text-muted-foreground">next service {date(e.nextPreventiveDue)}</span>}
              {openCount(e.id) > 0 && <Pill tone="bg-warning/10 text-warning">{openCount(e.id)} open</Pill>}
              <button type="button" aria-label={`Delete ${e.code}`} className={cn(btn.icon, "ml-auto")} onClick={() => (requests.some((r) => r.equipmentId === e.id) ? flash("Equipment has requests — it can't be deleted", true) : deleteRecord("equipment", e.id))}><Trash2 /></button>
            </div>
          ))}</div>}
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between p-5 pb-3"><CardTitle className="text-base">Requests</CardTitle><Select value={status} onChange={setStatus} options={[["OPEN", "Open"], ["IN_PROGRESS", "In progress"], ["DONE", "Done"], ["CANCELLED", "Cancelled"], ["ALL", "All"]].map(([v, l]) => ({ value: v, label: l }))} className="w-40" ariaLabel="Request status" /></div>
        <div className="p-5 pt-0">{rows.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No requests in this view.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><Th>Number</Th><Th>Equipment</Th><Th>Title</Th><Th>Kind</Th><Th>Priority</Th><Th>Status</Th><Th /></tr></thead>
            <tbody>{rows.map((r) => (
              <tr key={r.id} className="border-b border-border align-top">
                <td className="px-2 py-2 font-mono text-xs">{String(r.requestNumber)}</td><td className="px-2 py-2 font-mono text-xs">{String(r.equipmentCode)}</td>
                <td className="px-2 py-2">{String(r.title)}{Boolean(r.resolution) && <p className="text-xs text-muted-foreground">{String(r.resolution)}{r.downtimeHours != null ? ` · ${num(r.downtimeHours)}h downtime` : ""}</p>}</td>
                <td className="px-2 py-2"><Badge tone={r.kind === "PREVENTIVE" ? "info" : "muted"}>{String(r.kind)}</Badge></td><td className="px-2 py-2"><Badge tone={r.priority === "CRITICAL" || r.priority === "HIGH" ? "destructive" : "muted"}>{String(r.priority)}</Badge></td><td className="px-2 py-2"><Pill>{String(r.status)}</Pill></td>
                <td className="px-2 py-2"><div className="flex justify-end gap-1">
                  {r.status === "OPEN" && <button type="button" className={btn.smOutline} onClick={() => setMaintenanceStatus(r.id, "IN_PROGRESS")}><Play /> Start</button>}
                  {(r.status === "OPEN" || r.status === "IN_PROGRESS") && <><button type="button" className={btn.smPrimary} onClick={() => setCompleting(r)}>Complete</button><button type="button" className={cn(btn.ghost, "h-8 px-2 text-xs")} onClick={() => setMaintenanceStatus(r.id, "CANCELLED")}>Cancel</button></>}
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}</div>
      </Card>
      <Dialog open={raising} onClose={() => setRaising(false)} title="New maintenance request">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label>Equipment</Label><Select value={req.equipmentId} onChange={(v) => setReq({ ...req, equipmentId: v })} placeholder="Select…" options={equipment.map((e) => ({ value: e.id, label: `${e.code} — ${e.name}` }))} /></div>
          <Field label="Title" htmlFor="mr-title"><input id="mr-title" value={req.title} onChange={(e) => setReq({ ...req, title: e.target.value })} placeholder="e.g. Spindle vibration" className={inputCls} /></Field>
          <div className="space-y-1.5"><Label>Priority</Label><Select value={req.priority} onChange={(v) => setReq({ ...req, priority: v })} options={[["LOW", "Low"], ["MEDIUM", "Medium"], ["HIGH", "High"], ["CRITICAL", "Critical"]].map(([v, l]) => ({ value: v, label: l }))} /></div>
          <Field label="Description" htmlFor="mr-desc"><textarea id="mr-desc" value={req.description} onChange={(e) => setReq({ ...req, description: e.target.value })} className={textareaCls} /></Field>
        </div>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!req.equipmentId || !req.title.trim()} onClick={() => { raiseMaintenance({ ...req, title: req.title.trim() }); setRaising(false); setReq({ equipmentId: "", title: "", description: "", priority: "MEDIUM" }); flash("Request raised"); }}>Raise request</button></div>
      </Dialog>
      <Dialog open={!!completing} onClose={() => setCompleting(null)} title={`Complete ${completing?.requestNumber ?? ""}`}>
        <Field label="Downtime (hours, optional)" htmlFor="mr-down"><input id="mr-down" type="number" min="0" step="0.25" value={c.downtimeHours} onChange={(e) => setC({ ...c, downtimeHours: e.target.value })} className={inputCls} /></Field>
        <Field label="Resolution" htmlFor="mr-res"><textarea id="mr-res" value={c.resolution} onChange={(e) => setC({ ...c, resolution: e.target.value })} className={textareaCls} /></Field>
        <div className="flex justify-end"><button type="button" className={btn.primary} onClick={() => { completeMaintenance(completing!.id, { downtimeHours: c.downtimeHours ? num(c.downtimeHours) : undefined, resolution: c.resolution || undefined }); setCompleting(null); setC({ downtimeHours: "", resolution: "" }); flash("Request completed"); }}>Complete</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- job work ---------- */

type L = { productId: string; quantity: string };
const blank = (): L => ({ productId: "", quantity: "" });
function currentQuarter() { const t = new Date(), m = t.getMonth(); return { fy: m >= 3 ? t.getFullYear() : t.getFullYear() - 1, quarter: Math.floor(((m + 12 - 3) % 12) / 3) + 1 }; }

function LineEditor({ lines, setLines, products }: { lines: L[]; setLines: (l: L[]) => void; products: Rec[] }) {
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <div key={i} className="flex gap-2">
          <Select value={l.productId} onChange={(v) => setLines(lines.map((x, j) => (j === i ? { ...x, productId: v } : x)))} placeholder="Product…" options={products.map((p) => ({ value: p.id, label: `${p.sku} — ${p.name}` }))} className="flex-1" ariaLabel="Product" />
          <input type="number" min="0" step="1" placeholder="Qty" aria-label="Quantity" value={l.quantity} onChange={(e) => setLines(lines.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} className={cn(inputCls, "w-24")} />
          {lines.length > 1 && <button type="button" aria-label="Remove line" className={btn.icon} onClick={() => setLines(lines.filter((_, j) => j !== i))}><Trash2 /></button>}
        </div>
      ))}
      <button type="button" className={btn.smOutline} onClick={() => setLines([...lines, blank()])}><Plus /> Add line</button>
    </div>
  );
}

export function JobWork() {
  const orders = useCollection("job-work");
  const vendors = useCollection("vendors");
  const products = useCollection("products").filter((p) => p.status !== "INACTIVE");
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ vendorId: "", challanNumber: "", expectedReturnDate: "", notes: "" });
  const [sent, setSent] = useState<L[]>([blank()]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [got, setGot] = useState<L[]>([blank()]);
  const [q, setQ] = useState(currentQuarter);
  const [menu, setMenu] = useState(false);
  const { node, flash } = useFlash();
  const open = orders.find((o) => o.id === openId);
  const report = itc04(q.fy, q.quarter);
  const valid = (ls: L[]) => ls.filter((l) => l.productId && num(l.quantity) > 0).map((l) => ({ productId: l.productId, quantity: num(l.quantity) }));
  function exportItc(kind: "csv" | "xls") {
    const head = ["Table", "Date", "JW #", "Challan", "Vendor", "GSTIN", "SKU", "Product", "Qty"];
    const rows = [...report.sent.map((a) => ["Sent (4)", a.lineDate, a.jwNumber, a.challanNumber, a.vendorName, a.vendorGstin, a.productSku, a.productName, String(a.quantity)]), ...report.received.map((a) => ["Received (5A)", a.lineDate, a.jwNumber, "", a.vendorName, "", a.productSku, a.productName, String(a.quantity)])];
    const name = `itc04-${q.fy}-Q${q.quarter}`;
    if (kind === "csv") downloadFile(`${name}.csv`, toCSV(head, rows), "text/csv"); else downloadFile(`${name}.xls`, toExcelHTML(head, rows), "application/vnd.ms-excel");
    setMenu(false);
  }
  const statusTone = (s: unknown) => <StatusBadge status={s} />;
  return (
    <div className="space-y-4">
      <PageHeader title="Job Work" subtitle="Send components to a job worker under a challan and track processed goods coming back. Goods remain your stock — use a stock transfer to an 'at job worker' warehouse for the physical move." actions={<button type="button" className={btn.primary} onClick={() => setAdding(true)}><Plus /> New job work</button>} />
      <Card>
        <div className="p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><Hammer className="size-4" /> Orders</CardTitle></div>
        <div className="p-5 pt-0">{orders.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No job work orders yet.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><Th>Number</Th><Th>Vendor</Th><Th>Challan</Th><Th>Date</Th><Th right>Sent</Th><Th right>Received</Th><Th>Status</Th></tr></thead>
            <tbody>{[...orders].reverse().map((o) => (
              <tr key={o.id} onClick={() => { setOpenId(o.id); setGot([blank()]); }} className="cursor-pointer border-b border-border hover:bg-muted/50">
                <td className="px-2 py-2 font-mono text-xs">{String(o.jwNumber)}</td><td className="px-2 py-2">{String(o.vendorName)}</td><td className="px-2 py-2 font-mono text-xs">{String(o.challanNumber || "—")}</td><td className="px-2 py-2">{date(o.challanDate)}</td><td className="px-2 py-2 text-right tabular-nums">{num(o.sentQty)}</td><td className="px-2 py-2 text-right tabular-nums">{num(o.receivedQty)}</td><td className="px-2 py-2">{statusTone(o.status)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}</div>
      </Card>
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-3 p-5 pb-3">
          <CardTitle className="text-base">ITC-04 — goods sent to / received from job workers</CardTitle>
          <div className="flex items-end gap-2">
            <div className="w-24 space-y-1"><Label className="text-xs" htmlFor="itc-fy">FY start</Label><input id="itc-fy" type="number" value={q.fy} onChange={(e) => setQ({ ...q, fy: parseInt(e.target.value) || q.fy })} className={cn(inputCls, "h-8")} /></div>
            <div className="w-32 space-y-1"><Label className="text-xs">Quarter</Label><Select size="sm" value={String(q.quarter)} onChange={(v) => setQ({ ...q, quarter: parseInt(v) })} options={[["1", "Q1 Apr–Jun"], ["2", "Q2 Jul–Sep"], ["3", "Q3 Oct–Dec"], ["4", "Q4 Jan–Mar"]].map(([v, l]) => ({ value: v, label: l }))} ariaLabel="Quarter" /></div>
            <div className="relative"><button type="button" className={btn.smOutline} onClick={() => setMenu((m) => !m)}><Download /> Export <ChevronDown /></button>{menu && <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-40 rounded-md border border-border bg-popover p-1 shadow-md"><button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => exportItc("csv")}>Download CSV</button><button type="button" role="menuitem" className="w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => exportItc("xls")}>Download Excel</button></div>}</div>
          </div>
        </div>
        <div className="space-y-1 p-5 pt-0"><p className="text-sm">{report.from} → {report.to}: <span className="font-semibold">{report.sent.length}</span> sent line{report.sent.length === 1 ? "" : "s"} · <span className="font-semibold">{report.received.length}</span> received line{report.received.length === 1 ? "" : "s"}</p><p className="text-xs text-muted-foreground">{report.note}</p></div>
      </Card>
      <Dialog open={adding} onClose={() => setAdding(false)} title="New job work order" className="max-w-xl">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Job worker (vendor)</Label><Select value={f.vendorId} onChange={(v) => setF({ ...f, vendorId: v })} placeholder="Select…" options={vendors.map((v) => ({ value: v.id, label: String(v.name) }))} /></div>
            <Field label="Challan #" htmlFor="jw-ch"><input id="jw-ch" value={f.challanNumber} onChange={(e) => setF({ ...f, challanNumber: e.target.value })} className={inputCls} /></Field>
            <div className="space-y-1.5"><Label>Expected return</Label><DateInput value={f.expectedReturnDate} onChange={(v) => setF({ ...f, expectedReturnDate: v })} /></div>
            <Field label="Notes" htmlFor="jw-notes"><input id="jw-notes" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} className={inputCls} /></Field>
          </div>
          <div className="space-y-1.5"><Label>Components sent</Label><LineEditor lines={sent} setLines={setSent} products={products} /></div>
        </div>
        <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!f.vendorId} onClick={() => {
          const ls = valid(sent);
          if (!ls.length) return flash("Add at least one sent line", true);
          createJobWork({ vendorId: f.vendorId, challanNumber: f.challanNumber || undefined, expectedReturnDate: f.expectedReturnDate || undefined, notes: f.notes || undefined, sentLines: ls });
          setAdding(false); setF({ vendorId: "", challanNumber: "", expectedReturnDate: "", notes: "" }); setSent([blank()]); flash("Job work order created");
        }}>Create</button></div>
      </Dialog>
      <Dialog open={!!open} onClose={() => setOpenId(null)} title={<span className="flex items-center gap-2">{String(open?.jwNumber ?? "")} — {String(open?.vendorName ?? "")}{open && statusTone(open.status)}</span>} className="max-w-xl">
        {open && <div className="space-y-4">
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Kind</Th><Th>Product</Th><Th right>Qty</Th><Th>Date</Th></tr></thead>
            <tbody>{((open.lines as JwLine[]) ?? []).map((l) => <tr key={l.id} className="border-b border-border"><td className="px-2 py-1.5"><Badge tone={l.kind === "SENT" ? "info" : "muted"}>{l.kind}</Badge></td><td className="px-2 py-1.5">{l.productSku} — {l.productName}</td><td className="px-2 py-1.5 text-right tabular-nums">{l.quantity}</td><td className="px-2 py-1.5">{date(l.lineDate)}</td></tr>)}</tbody></table>
          {(open.status === "OPEN" || open.status === "PARTIALLY_RECEIVED") && (
            <div className="space-y-2 border-t border-border pt-3">
              <p className="text-sm font-medium">Record receipt (processed goods back)</p>
              <LineEditor lines={got} setLines={setGot} products={products} />
              <button type="button" className={btn.smPrimary} onClick={() => { const ls = valid(got); if (!ls.length) return flash("Add at least one received line", true); receiveJobWork(open.id, ls); setGot([blank()]); flash("Receipt recorded"); }}>Record receipt</button>
            </div>
          )}
          {(open.status === "OPEN" || open.status === "PARTIALLY_RECEIVED") && <div className="flex gap-2 border-t border-border pt-3"><button type="button" className={btn.smOutline} onClick={() => { updateRecord("job-work", open.id, { status: "CLOSED" }); flash("Order closed"); }}>Close order</button><button type="button" className={cn(btn.ghost, "h-8 px-3 text-xs")} onClick={() => { updateRecord("job-work", open.id, { status: "CANCELLED" }); flash("Order cancelled"); }}>Cancel</button></div>}
        </div>}
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- MRP ---------- */

export function Mrp() {
  const router = useRouter();
  const runs = useCollection("mrp-runs");
  const [sel, setSel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { node, flash } = useFlash();
  const sorted = [...runs].sort((a, b) => String(b.runDate).localeCompare(String(a.runDate)));
  const run = sorted.find((r) => r.id === sel) ?? sorted[0];
  const suggestions = (run?.suggestions as Rec[]) ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="MRP — Material Requirements Planning" subtitle="Scan reorder rules to detect shortages and suggest replenishment actions" actions={<button type="button" className={btn.primary} disabled={busy} onClick={() => { setBusy(true); const r = runMrp(); setSel(r.id); setBusy(false); flash(`MRP run complete — ${r.totalShortages} shortage(s) detected`); }}>{busy ? <Loader2 className="animate-spin" /> : <Play />}Run MRP</button>} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <Card className="min-h-32">
          <div className="p-4 pb-2"><CardTitle className="text-sm">Recent runs</CardTitle></div>
          <div className="space-y-1 p-2 pt-0">{sorted.length === 0 ? <p className="p-2 text-sm text-muted-foreground">No runs yet. Click <strong>Run MRP</strong> above.</p> : sorted.slice(0, 20).map((r) => (
            <button key={r.id} type="button" onClick={() => setSel(r.id)} className={cn("flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-accent", run?.id === r.id && "bg-accent")}>
              <div><div className="text-sm font-medium">{date(r.runDate, true)}</div><div className="text-xs text-muted-foreground">{num(r.totalShortages)} shortages</div></div><Pill>{String(r.status)}</Pill>
            </button>
          ))}</div>
        </Card>
        <div>{!run ? <Empty icon={Layers} title="Select a run" text="Click a run on the left to see its suggestions." /> : suggestions.length === 0 ? <Empty icon={Layers} title="No shortages found" text="All items are above their reorder points." /> : (
          <Card><div className="overflow-x-auto p-4"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><Th>Action</Th><Th>SKU</Th><Th>Product</Th><Th>On hand</Th><Th>Reorder pt</Th><Th>Suggested</Th><Th /></tr></thead>
            <tbody>{suggestions.map((s) => (
              <tr key={String(s.id)} className="border-b border-border">
                <td className="px-2 py-2"><Pill>{s.actionType === "PURCHASE" ? <><ShoppingCart className="mr-1 size-3" /> Purchase</> : <><Factory className="mr-1 size-3" /> Produce</>}</Pill></td>
                <td className="px-2 py-2 font-mono text-xs">{String(s.productSku)}</td><td className="px-2 py-2 font-medium">{String(s.productName)}</td><td className="px-2 py-2 tabular-nums">{fmt(s.currentQuantity)}</td><td className="px-2 py-2 tabular-nums">{fmt(s.reorderPoint)}</td><td className="px-2 py-2 font-semibold tabular-nums">{fmt(s.suggestedQuantity)}</td>
                <td className="px-2 py-2 text-right">{s.actionType === "PRODUCE"
                  ? <button type="button" className={btn.smOutline} onClick={() => { const o = createProductionOrder({ productId: String(s.productId), quantity: num(s.suggestedQuantity), warehouseId: String(s.warehouseId ?? "") || undefined }); router.push(`${P_BASE}/${o.id}`); }}>Create order</button>
                  : <Link href="/inventory/purchase-requisitions/new" className={btn.smOutline}>Raise requisition</Link>}</td>
              </tr>
            ))}</tbody>
          </table></div></Card>
        )}</div>
      </div>
      {node}
    </div>
  );
}
