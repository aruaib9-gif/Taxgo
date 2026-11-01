"use client";

// Van sales: dashboard, fleet (with stock loaded onto each van), delivery routes and van sales.

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Download, Loader2, MapPin, Package, Play, Plus, Route as RouteIcon, ShoppingCart, SkipForward, Trash2, Truck, Upload, User } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { onHand } from "@/lib/stock";
import { confirmVanSale, createVan, createVanSale, loadVan, routeTotals, unloadVan, vanInventory, vanTotals, vanWarehouse } from "@/lib/vans";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, Field, Label, PageHeader, RowMenu, SidePanel, btn, inputCls, money, num, textareaCls, today } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner, Req } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";

type Tone = "muted" | "success" | "info" | "warning" | "destructive";
const TONE: Record<string, Tone> = { AVAILABLE: "success", ON_ROUTE: "info", MAINTENANCE: "warning", INACTIVE: "muted", PLANNED: "muted", IN_PROGRESS: "info", COMPLETED: "success", CANCELLED: "destructive", DRAFT: "muted", CONFIRMED: "info", DELIVERED: "success", PENDING: "muted", VISITED: "info", SKIPPED: "warning" };
const Status = ({ s }: { s: unknown }) => <Badge tone={TONE[String(s)] ?? "muted"}>{String(s ?? "").replace(/_/g, " ")}</Badge>;
const usd = (v: unknown) => `$${num(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const VAN_STATUSES = [{ value: "AVAILABLE", label: "Available" }, { value: "ON_ROUTE", label: "On Route" }, { value: "MAINTENANCE", label: "Maintenance" }, { value: "INACTIVE", label: "Inactive" }];
const vanLabel = (v: Rec) => `${v.name} (${v.vanCode})`;
function Flash({ msg }: { msg: { text: string; bad?: boolean } | null }) {
  return msg ? <div role="status" className={cn("fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-md border px-4 py-2 text-sm shadow-lg", msg.bad ? "border-destructive/30 bg-destructive text-white" : "border-border bg-card")}>{msg.text}</div> : null;
}
function useFlash() {
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  return { msg, flash: (text: string, bad = false) => { setMsg({ text, bad }); setTimeout(() => setMsg(null), 3000); } };
}
const ListCard = ({ title, filter, children }: { title: string; filter?: React.ReactNode; children: React.ReactNode }) => (
  <Card><div className="flex items-center justify-between gap-2 p-5 pb-3"><CardTitle>{title}</CardTitle>{filter}</div><div className="p-5 pt-0">{children}</div></Card>
);
const Empty = ({ icon: Icon, text }: { icon: typeof Truck; text: string }) => <div className="flex flex-col items-center gap-3 py-10 text-center text-muted-foreground"><Icon className="size-10 opacity-50" /><p>{text}</p></div>;
const th = "px-3 py-2 text-left font-medium text-muted-foreground";

/* ---------- dashboard ---------- */

export function VanDashboard() {
  const vans = useCollection("vans");
  const routes = useCollection("van-routes");
  const sales = useCollection("van-sales");
  const active = vans.filter((v) => v.status === "AVAILABLE" || v.status === "ON_ROUTE");
  const open = routes.filter((r) => r.status === "PLANNED" || r.status === "IN_PROGRESS");
  const recent = [...sales].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5);
  const stat = (label: string, icon: React.ReactNode, value: string, sub?: string) => (
    <Card><div className="p-5"><div className="flex items-center justify-between text-sm font-medium">{label}<span className="text-muted-foreground">{icon}</span></div><div className="mt-2 text-2xl font-bold">{value}</div>{sub && <p className="text-xs text-muted-foreground">{sub}</p>}</div></Card>
  );
  const panel = (title: string, sub: string, href: string, body: React.ReactNode) => (
    <Card>
      <div className="flex items-start justify-between p-5"><div><CardTitle>{title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{sub}</p></div><Link href={href} className={cn(btn.ghost, "h-8 px-3")}>View All <ArrowRight /></Link></div>
      <div className="p-5 pt-0">{body}</div>
    </Card>
  );
  return (
    <div className="space-y-6">
      <PageHeader title="Van Sales" subtitle="Mobile distribution and route sales management" actions={<>
        <Link href="/van-sales/vans/new" className={btn.smOutline}><Plus /> Add Van</Link>
        <Link href="/van-sales/routes/new" className={btn.smOutline}><Plus /> New Route</Link>
        <Link href="/van-sales/sales/new" className={btn.smPrimary}><Plus /> New Sale</Link>
      </>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stat("Active Vans", <Truck className="size-4" />, String(active.length), `${vans.length} total registered`)}
        {stat("Today's Routes", <RouteIcon className="size-4" />, String(open.length), `${routes.length} total routes`)}
        {stat("Recent Sales", <ShoppingCart className="size-4" />, String(Math.min(sales.length, 5)))}
        {stat("Sales Amount", <ShoppingCart className="size-4" />, money(recent.reduce((a, s) => a + num(s.totalAmount), 0)))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {panel("Fleet Status", "Current van availability", "/van-sales/vans", vans.length ? <div className="space-y-2">{vans.slice(0, 5).map((v) => (
          <Link key={v.id} href={`/van-sales/vans/${v.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent"><div className="flex items-center gap-3"><Truck className="size-5 text-muted-foreground" /><div><p className="font-medium">{String(v.name)}</p><p className="text-xs text-muted-foreground">{String(v.vanCode)} {v.driverName ? `- ${v.driverName}` : ""}</p></div></div><Status s={v.status} /></Link>
        ))}</div> : <p className="py-8 text-center text-muted-foreground">No vans registered yet.</p>)}
        {panel("Routes", "Recent delivery routes", "/van-sales/routes", routes.length ? <div className="space-y-2">{routes.slice(0, 5).map((r) => (
          <Link key={r.id} href={`/van-sales/routes/${r.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent"><div className="flex items-center gap-3"><MapPin className="size-5 text-muted-foreground" /><div><p className="font-medium">{String(r.routeName)}</p><p className="text-xs text-muted-foreground">{String(r.plannedDate)} - {((r.stops as Rec[]) ?? []).length} stops</p></div></div><Status s={r.status} /></Link>
        ))}</div> : <p className="py-8 text-center text-muted-foreground">No routes planned yet.</p>)}
      </div>
      {panel("Recent Van Sales", "Latest sales from vans", "/van-sales/sales", recent.length ? <div className="space-y-2">{recent.map((s) => (
        <Link key={s.id} href={`/van-sales/sales/${s.id}`} className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-accent"><div><p className="font-medium">{String(s.saleNumber)}</p><p className="text-xs text-muted-foreground">{String(s.customerName || "Walk-in")} - {String(s.saleDate)}</p></div><div className="flex items-center gap-3"><span className="font-medium">{money(num(s.totalAmount))}</span><Status s={s.status} /></div></Link>
      ))}</div> : <p className="py-8 text-center text-muted-foreground">No van sales recorded yet.</p>)}
    </div>
  );
}

/* ---------- vans ---------- */

const V_BASE = "/van-sales/vans";

export function Vans() {
  const router = useRouter();
  const sub = subOf(usePathname(), V_BASE);
  const vans = useCollection("vans");
  const sales = useCollection("van-sales");
  const [status, setStatus] = useState("all");
  const close = () => router.push(V_BASE);
  const rows = vans.filter((v) => status === "all" || v.status === status);
  const detail = sub && sub !== "new" ? vans.find((v) => v.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Van Fleet" actions={<Link href={`${V_BASE}/new`} className={btn.primary}><Plus /> Add Van</Link>} />
      <ListCard title="Vans" filter={<Select value={status} onChange={setStatus} options={[{ value: "all", label: "All Status" }, ...VAN_STATUSES]} className="w-40" ariaLabel="Status" />}>
        {rows.length ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className={th}>Van Code</th><th className={th}>Name</th><th className={th}>Plate Number</th><th className={th}>Driver</th><th className={th}>Status</th><th className={cn(th, "text-right")}>Actions</th></tr></thead>
            <tbody>{rows.map((v) => (
              <tr key={v.id} className="border-b border-border">
                <td className="px-3 py-2"><Link href={`${V_BASE}/${v.id}`} className="font-medium text-primary hover:underline">{String(v.vanCode)}</Link></td><td className="px-3 py-2">{String(v.name)}</td><td className="px-3 py-2">{String(v.plateNumber || "-")}</td><td className="px-3 py-2">{String(v.driverName || "-")}</td><td className="px-3 py-2"><Status s={v.status} /></td>
                <td className="px-3 py-2"><div className="flex justify-end gap-1"><Link href={`${V_BASE}/${v.id}`} className={cn(btn.ghost, "h-8 px-3")}>View</Link><RowMenu items={[{ label: "Delete", destructive: true, onSelect: () => {
                  const used = sales.some((s) => s.vanId === v.id) || readCollection("stock-moves").some((m) => m.warehouseId === v.stockWarehouseId);
                  if (used) { if (confirm(`${v.vanCode} has history — set it inactive instead?`)) updateRecord("vans", v.id, { status: "INACTIVE" }); }
                  else if (confirm(`Delete van ${v.vanCode}?`)) { deleteRecord("vans", v.id); if (v.stockWarehouseId) deleteRecord("warehouses", String(v.stockWarehouseId)); }
                } }]} /></div></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Empty icon={Truck} text="No vans found. Register your first van to get started." />}
      </ListCard>
      {sub === "new" && <SidePanel onClose={close}><VanForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><VanDetail key={detail.id} van={detail} /></SidePanel>}
    </div>
  );
}

function VanForm({ onDone }: { onDone: () => void }) {
  const warehouses = useCollection("warehouses").filter((w) => !w.isVan && w.status !== "INACTIVE");
  const [f, setF] = useState({ vanCode: "", name: "", plateNumber: "", driverName: "", driverPhone: "", status: "AVAILABLE", capacityWeight: "", capacityVolume: "", warehouseId: "", notes: "" });
  const { msg, flash } = useFlash();
  const set = (k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const field = (k: keyof typeof f, label: React.ReactNode, placeholder = "", type = "text") => <Field label={label} htmlFor={`van-${k}`}><input id={`van-${k}`} type={type} step={type === "number" ? "0.001" : undefined} value={f[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} className={inputCls} /></Field>;
  function submit() {
    if (!f.vanCode.trim()) return flash("Van code is required", true);
    if (!f.name.trim()) return flash("Van name is required", true);
    try { createVan({ ...f, vanCode: f.vanCode.trim(), name: f.name.trim(), capacityWeight: f.capacityWeight ? num(f.capacityWeight) : undefined, capacityVolume: f.capacityVolume ? num(f.capacityVolume) : undefined }); onDone(); } catch (e) { flash((e as Error).message, true); }
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Register New Van</h1>
      <Card>
        <div className="p-6 pb-3"><CardTitle>Van Details</CardTitle></div>
        <div className="space-y-4 p-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2">{field("vanCode", "Van Code *", "e.g. VAN-001")}{field("name", "Name *", "e.g. Delivery Van 1")}</div>
          <div className="grid gap-4 sm:grid-cols-2">{field("plateNumber", "Plate Number", "e.g. ABC-1234")}<div className="space-y-2"><Label>Status</Label><Select value={f.status} onChange={(v) => set("status", v)} options={VAN_STATUSES} /></div></div>
          <div className="grid gap-4 sm:grid-cols-2">{field("driverName", "Driver Name", "Driver full name")}{field("driverPhone", "Driver Phone", "Phone number")}</div>
          <div className="grid gap-4 sm:grid-cols-3">{field("capacityWeight", "Capacity - Weight (kg)", "e.g. 1000", "number")}{field("capacityVolume", "Capacity - Volume (m3)", "e.g. 10", "number")}<div className="space-y-2"><Label>Warehouse</Label><Select value={f.warehouseId} onChange={(v) => set("warehouseId", v)} placeholder="Select warehouse" options={warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }))} /></div></div>
          <Field label="Notes" htmlFor="van-notes"><textarea id="van-notes" value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Optional notes..." className={textareaCls} /></Field>
        </div>
      </Card>
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={submit}>Register Van</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      <Flash msg={msg} />
    </div>
  );
}

function VanDetail({ van }: { van: Rec }) {
  const warehouses = useCollection("warehouses").filter((w) => !w.isVan && w.status !== "INACTIVE");
  const products = useCollection("products");
  const transfers = useCollection("van-transfers").filter((t) => t.vanId === van.id);
  useCollection("stock-moves");
  useCollection("van-sales");
  const [mode, setMode] = useState<"" | "LOAD" | "UNLOAD">("");
  const blank = { warehouseId: String(van.warehouseId ?? ""), productId: "", quantity: "", unitCost: "", transferredBy: "", notes: "" };
  const [t, setT] = useState(blank);
  const { msg, flash } = useFlash();
  const inv = vanInventory(van.id);
  function submit() {
    if (!t.warehouseId || !t.productId || !t.quantity) return flash("Warehouse, product, and quantity are required", true);
    try {
      const m = { warehouseId: t.warehouseId, productId: t.productId, quantity: num(t.quantity), unitCost: t.unitCost ? num(t.unitCost) : undefined, transferredBy: t.transferredBy || undefined, notes: t.notes || undefined };
      if (mode === "LOAD") loadVan(van.id, m); else unloadVan(van.id, m);
      flash(mode === "LOAD" ? "Stock loaded successfully" : "Stock unloaded successfully"); setMode(""); setT(blank);
    } catch (e) { flash((e as Error).message, true); }
  }
  const prodOpts = (mode === "UNLOAD" ? products.filter((p) => onHand(p.id, vanWarehouse(van.id)) > 0) : products.filter((p) => p.status !== "INACTIVE")).map((p) => ({ value: p.id, label: `${p.sku ? `${p.sku} - ` : ""}${p.name}` }));
  return (
    <div className="space-y-4">
      <PageHeader title={String(van.name)} actions={<>
        <button type="button" className={btn.outline} onClick={() => { setT(blank); setMode("LOAD"); }}><Download /> Load Stock</button>
        <button type="button" className={btn.outline} onClick={() => { setT(blank); setMode("UNLOAD"); }}><Upload /> Unload Stock</button>
      </>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><div className="space-y-1 p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><Truck className="size-4" /> Van Details</div><p className="font-semibold">{String(van.vanCode)}</p><p className="text-sm text-muted-foreground">{String(van.plateNumber || "No plate number")}</p></div></Card>
        <Card><div className="space-y-1 p-4"><div className="text-sm text-muted-foreground">Driver</div><p className="font-semibold">{String(van.driverName || "Unassigned")}</p><p className="text-sm text-muted-foreground">{String(van.driverPhone || "-")}</p></div></Card>
        <Card><div className="space-y-1 p-4"><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Status</div><Select size="sm" value={String(van.status)} onChange={(v) => updateRecord("vans", van.id, { status: v })} options={VAN_STATUSES} className="w-36" ariaLabel="Van status" /></div>
          {Boolean(van.capacityWeight || van.capacityVolume) && <div className="text-xs text-muted-foreground">{van.capacityWeight ? `Weight: ${van.capacityWeight} kg` : ""}{van.capacityWeight && van.capacityVolume ? " | " : ""}{van.capacityVolume ? `Volume: ${van.capacityVolume} m3` : ""}</div>}
          {Boolean(van.notes) && <p className="text-xs text-muted-foreground">{String(van.notes)}</p>}</div></Card>
      </div>
      {mode && (
        <Card>
          <div className="p-5 pb-3"><CardTitle>{mode === "LOAD" ? "Load Stock onto Van" : "Unload Stock from Van"}</CardTitle></div>
          <div className="space-y-4 p-5 pt-0">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Warehouse *</Label><Select value={t.warehouseId} onChange={(v) => setT({ ...t, warehouseId: v })} placeholder="Select warehouse" options={warehouses.map((w) => ({ value: w.id, label: `${w.code} - ${w.name}` }))} /></div>
              <div className="space-y-2"><Label>Product *</Label><Select value={t.productId} onChange={(v) => setT({ ...t, productId: v })} placeholder="Select product" options={prodOpts} /></div>
              <Field label="Quantity *" htmlFor="vl-qty"><input id="vl-qty" type="number" value={t.quantity} onChange={(e) => setT({ ...t, quantity: e.target.value })} placeholder="Qty" className={inputCls} /></Field>
            </div>
            {t.productId && t.warehouseId && <p className="text-xs text-muted-foreground">{mode === "LOAD" ? `${onHand(t.productId, t.warehouseId)} in the warehouse` : `${onHand(t.productId, vanWarehouse(van.id))} on the van`}</p>}
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Unit Cost" htmlFor="vl-cost"><input id="vl-cost" type="number" step="0.001" value={t.unitCost} onChange={(e) => setT({ ...t, unitCost: e.target.value })} className={inputCls} /></Field>
              <Field label="Transferred By" htmlFor="vl-by"><input id="vl-by" value={t.transferredBy} onChange={(e) => setT({ ...t, transferredBy: e.target.value })} className={inputCls} /></Field>
              <Field label="Notes" htmlFor="vl-notes"><input id="vl-notes" value={t.notes} onChange={(e) => setT({ ...t, notes: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="flex gap-2"><button type="button" className={btn.primary} onClick={submit}>{mode === "LOAD" ? "Load Stock" : "Unload Stock"}</button><button type="button" className={btn.outline} onClick={() => setMode("")}>Cancel</button></div>
          </div>
        </Card>
      )}
      <Card>
        <div className="p-5 pb-3"><CardTitle className="flex items-center gap-2"><Package className="size-4" />Current Inventory</CardTitle></div>
        <div className="p-5 pt-0">{inv.length ? (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><th className={th}>Product</th><th className={th}>Loaded</th><th className={th}>Sold</th><th className={th}>Returned</th><th className={th}>Available</th><th className={th}>Unit Cost</th></tr></thead>
            <tbody>{inv.map((i) => <tr key={i.id} className="border-b border-border"><td className="px-3 py-2 font-medium">{i.productName}</td><td className="px-3 py-2">{i.quantityLoaded}</td><td className="px-3 py-2">{i.quantitySold}</td><td className="px-3 py-2">{i.quantityReturned}</td><td className="px-3 py-2 font-medium">{i.quantityAvailable}</td><td className="px-3 py-2">{usd(i.unitCost)}</td></tr>)}</tbody></table>
        ) : <p className="py-4 text-center text-sm text-muted-foreground">No inventory loaded on this van</p>}</div>
      </Card>
      <Card>
        <div className="p-5 pb-3"><CardTitle>Transfer History</CardTitle></div>
        <div className="p-5 pt-0">{transfers.length ? (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><th className={th}>Date</th><th className={th}>Type</th><th className={th}>Items</th><th className={th}>Transferred By</th><th className={th}>Notes</th></tr></thead>
            <tbody>{[...transfers].reverse().map((x) => <tr key={x.id} className="border-b border-border"><td className="px-3 py-2">{new Date(String(x.transferDate)).toLocaleDateString()}</td><td className="px-3 py-2"><Badge tone={x.transferType === "LOAD" ? "success" : "info"}>{String(x.transferType)}</Badge></td><td className="px-3 py-2">{((x.lines as Rec[]) ?? []).length} item(s)</td><td className="px-3 py-2">{String(x.transferredBy || "-")}</td><td className="px-3 py-2">{String(x.notes || "-")}</td></tr>)}</tbody></table>
        ) : <p className="py-4 text-center text-sm text-muted-foreground">No transfer history</p>}</div>
      </Card>
      <Flash msg={msg} />
    </div>
  );
}

/* ---------- routes ---------- */

const R_BASE = "/van-sales/routes";
const ROUTE_STATUSES = [{ value: "PLANNED", label: "Planned" }, { value: "IN_PROGRESS", label: "In Progress" }, { value: "COMPLETED", label: "Completed" }, { value: "CANCELLED", label: "Cancelled" }];

export function VanRoutes() {
  const router = useRouter();
  const sub = subOf(usePathname(), R_BASE);
  const routes = useCollection("van-routes");
  const vans = useCollection("vans");
  useCollection("van-sales");
  const [status, setStatus] = useState("all");
  const close = () => router.push(R_BASE);
  const rows = routes.filter((r) => status === "all" || r.status === status);
  const detail = sub && sub !== "new" ? routes.find((r) => r.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Routes" actions={<Link href={`${R_BASE}/new`} className={btn.primary}><Plus /> New Route</Link>} />
      <ListCard title="Route List" filter={<Select value={status} onChange={setStatus} options={[{ value: "all", label: "All Status" }, ...ROUTE_STATUSES]} className="w-40" ariaLabel="Status" />}>
        {rows.length ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className={th}>Route Code</th><th className={th}>Name</th><th className={th}>Van</th><th className={th}>Date</th><th className={th}>Stops</th><th className={th}>Status</th><th className={th}>Sales Amount</th><th className={cn(th, "text-right")}>Actions</th></tr></thead>
            <tbody>{rows.map((r) => { const t = routeTotals(r.id); const v = vans.find((x) => x.id === r.vanId); return (
              <tr key={r.id} className="border-b border-border">
                <td className="px-3 py-2"><Link href={`${R_BASE}/${r.id}`} className="font-medium text-primary hover:underline">{String(r.routeCode)}</Link></td><td className="px-3 py-2">{String(r.routeName)}</td><td className="px-3 py-2">{v ? String(v.name) : "-"}</td><td className="px-3 py-2">{String(r.plannedDate)}</td><td className="px-3 py-2">{t.completedStops}/{t.totalStops}</td><td className="px-3 py-2"><Status s={r.status} /></td><td className="px-3 py-2">{usd(t.totalSalesAmount)}</td>
                <td className="px-3 py-2"><div className="flex justify-end gap-1"><Link href={`${R_BASE}/${r.id}`} className={cn(btn.ghost, "h-8 px-3")}>View</Link><RowMenu items={[...(r.status === "PLANNED" ? [{ label: "Cancel route", onSelect: () => updateRecord("van-routes", r.id, { status: "CANCELLED" }) }] : []), { label: "Delete", destructive: true, onSelect: () => confirm(`Delete route ${r.routeCode}?`) && deleteRecord("van-routes", r.id) }]} /></div></td>
              </tr>
            ); })}</tbody>
          </table></div>
        ) : <Empty icon={RouteIcon} text="No routes found. Create your first route to get started." />}
      </ListCard>
      {sub === "new" && <SidePanel onClose={close}><RouteForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><RouteDetail key={detail.id} route={detail} /></SidePanel>}
    </div>
  );
}

function RouteForm({ onDone }: { onDone: () => void }) {
  const vans = useCollection("vans");
  const [f, setF] = useState({ routeCode: "", routeName: "", vanId: "", salespersonName: "", plannedDate: today() });
  const [stops, setStops] = useState([{ customerName: "", address: "", plannedArrival: "" }]);
  const { msg, flash } = useFlash();
  const setStop = (i: number, p: Partial<(typeof stops)[number]>) => setStops((s) => s.map((x, j) => (j === i ? { ...x, ...p } : x)));
  function submit() {
    if (!f.routeCode.trim()) return flash("Route code is required", true);
    if (!f.routeName.trim()) return flash("Route name is required", true);
    if (!f.plannedDate) return flash("Planned date is required", true);
    const valid = stops.filter((s) => s.customerName.trim());
    if (!valid.length) return flash("At least one stop with a customer name is required", true);
    if (readCollection("van-routes").some((r) => String(r.routeCode).toLowerCase() === f.routeCode.trim().toLowerCase())) return flash(`Route code ${f.routeCode} is already used`, true);
    createRecord("van-routes", { ...f, routeCode: f.routeCode.trim(), routeName: f.routeName.trim(), status: "PLANNED", stops: valid.map((s, i) => ({ id: crypto.randomUUID(), stopNumber: i + 1, customerName: s.customerName.trim(), address: s.address || undefined, plannedArrival: s.plannedArrival || undefined, status: "PENDING" })) });
    onDone();
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Create New Route</h1>
      <Card>
        <div className="p-6 pb-3"><CardTitle>Route Details</CardTitle></div>
        <div className="space-y-4 p-6 pt-0">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Route Code *" htmlFor="rt-code"><input id="rt-code" value={f.routeCode} onChange={(e) => setF({ ...f, routeCode: e.target.value })} placeholder="e.g. RT-001" className={inputCls} /></Field>
            <Field label="Route Name *" htmlFor="rt-name"><input id="rt-name" value={f.routeName} onChange={(e) => setF({ ...f, routeName: e.target.value })} placeholder="e.g. Downtown Route" className={inputCls} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2"><Label>Van</Label><Select value={f.vanId} onChange={(v) => setF({ ...f, vanId: v })} placeholder="Select a van" options={vans.map((v) => ({ value: v.id, label: vanLabel(v) }))} /></div>
            <Field label="Salesperson Name" htmlFor="rt-sp"><input id="rt-sp" value={f.salespersonName} onChange={(e) => setF({ ...f, salespersonName: e.target.value })} placeholder="Salesperson" className={inputCls} /></Field>
            <div className="space-y-2"><Label>Planned Date *</Label><DateInput value={f.plannedDate} onChange={(v) => setF({ ...f, plannedDate: v })} /></div>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between p-6 pb-3"><CardTitle>Stops</CardTitle><button type="button" className={btn.smOutline} onClick={() => setStops((s) => [...s, { customerName: "", address: "", plannedArrival: "" }])}><Plus /> Add Stop</button></div>
        <div className="space-y-3 p-6 pt-0">{stops.map((s, i) => (
          <div key={i} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <div className="mt-6 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{i + 1}</div>
            <div className="grid flex-1 gap-3 sm:grid-cols-3">
              <Field label="Customer Name *" htmlFor={`st-c-${i}`}><input id={`st-c-${i}`} value={s.customerName} onChange={(e) => setStop(i, { customerName: e.target.value })} placeholder="Customer name" className={inputCls} /></Field>
              <Field label="Address" htmlFor={`st-a-${i}`}><input id={`st-a-${i}`} value={s.address} onChange={(e) => setStop(i, { address: e.target.value })} placeholder="Delivery address" className={inputCls} /></Field>
              <Field label="Planned Arrival" htmlFor={`st-t-${i}`}><input id={`st-t-${i}`} type="time" value={s.plannedArrival} onChange={(e) => setStop(i, { plannedArrival: e.target.value })} className={inputCls} /></Field>
            </div>
            <button type="button" aria-label="Remove stop" disabled={stops.length <= 1} className={cn(btn.icon, "mt-6")} onClick={() => setStops((x) => x.filter((_, j) => j !== i))}><Trash2 className="text-destructive" /></button>
          </div>
        ))}</div>
      </Card>
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={submit}>Create Route</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      <Flash msg={msg} />
    </div>
  );
}

function RouteDetail({ route }: { route: Rec }) {
  const vans = useCollection("vans");
  useCollection("van-sales");
  const van = vans.find((v) => v.id === route.vanId);
  const t = routeTotals(route.id);
  const stops = [...((route.stops as Rec[]) ?? [])].sort((a, b) => num(a.stopNumber) - num(b.stopNumber));
  const setStop = (id: string, status: string) => updateRecord("van-routes", route.id, { stops: stops.map((s) => (s.id === id ? { ...s, status, ...(status !== "SKIPPED" && !s.actualArrival ? { actualArrival: new Date().toISOString() } : {}) } : s)) });
  return (
    <div className="space-y-4">
      <PageHeader title={String(route.routeName)} actions={<>
        {route.status === "PLANNED" && <button type="button" className={btn.primary} onClick={() => { updateRecord("van-routes", route.id, { status: "IN_PROGRESS", startTime: new Date().toISOString() }); if (van) updateRecord("vans", van.id, { status: "ON_ROUTE" }); }}><Play /> Start Route</button>}
        {route.status === "IN_PROGRESS" && <button type="button" className={btn.primary} onClick={() => { updateRecord("van-routes", route.id, { status: "COMPLETED", endTime: new Date().toISOString() }); if (van) updateRecord("vans", van.id, { status: "AVAILABLE" }); }}><CheckCircle2 /> Complete Route</button>}
      </>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><div className="space-y-1 p-4"><div className="text-sm text-muted-foreground">Route Code</div><p className="font-semibold">{String(route.routeCode)}</p><Status s={route.status} /></div></Card>
        <Card><div className="space-y-1 p-4"><div className="text-sm text-muted-foreground">Van / Salesperson</div><p className="font-semibold">{van ? String(van.name) : "No van"}</p><p className="text-sm text-muted-foreground">{String(route.salespersonName || "-")}</p></div></Card>
        <Card><div className="space-y-1 p-4"><div className="text-sm text-muted-foreground">Planned Date</div><p className="font-semibold">{new Date(String(route.plannedDate)).toLocaleDateString()}</p>{Boolean(route.startTime) && <p className="text-xs text-muted-foreground">Started: {new Date(String(route.startTime)).toLocaleTimeString()}</p>}</div></Card>
        <Card><div className="space-y-1 p-4"><div className="text-sm text-muted-foreground">Progress</div><p className="font-semibold">{t.completedStops}/{t.totalStops} stops</p><p className="text-xs text-muted-foreground">Total Sales: {usd(t.totalSalesAmount)}</p></div></Card>
      </div>
      <Card>
        <div className="p-5 pb-3"><CardTitle className="flex items-center gap-2"><MapPin className="size-4" />Route Stops</CardTitle></div>
        <div className="space-y-3 p-5 pt-0">{stops.length ? stops.map((s) => (
          <div key={String(s.id)} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{num(s.stopNumber)}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><p className="font-medium">{String(s.customerName || "Unknown Customer")}</p><Status s={s.status} /></div>
              {Boolean(s.address) && <p className="text-sm text-muted-foreground">{String(s.address)}</p>}
              <div className="flex gap-3 text-xs text-muted-foreground">{Boolean(s.plannedArrival) && <span>Planned: {String(s.plannedArrival)}</span>}{Boolean(s.actualArrival) && <span>Arrived: {new Date(String(s.actualArrival)).toLocaleTimeString()}</span>}</div>
            </div>
            {route.status === "IN_PROGRESS" && s.status === "PENDING" && <div className="flex gap-1"><button type="button" className={btn.smOutline} onClick={() => setStop(String(s.id), "VISITED")}><User /> Visited</button><button type="button" className={btn.smOutline} onClick={() => setStop(String(s.id), "COMPLETED")}><CheckCircle2 /> Complete</button><button type="button" className={cn(btn.ghost, "h-8 px-3 text-xs")} onClick={() => setStop(String(s.id), "SKIPPED")}><SkipForward /> Skip</button></div>}
            {route.status === "IN_PROGRESS" && s.status === "VISITED" && <button type="button" className={btn.smOutline} onClick={() => setStop(String(s.id), "COMPLETED")}><CheckCircle2 /> Complete</button>}
          </div>
        )) : <p className="text-sm text-muted-foreground">No stops defined for this route</p>}</div>
      </Card>
    </div>
  );
}

/* ---------- van sales ---------- */

const VS_BASE = "/van-sales/sales";
const SALE_STATUSES = [{ value: "DRAFT", label: "Draft" }, { value: "CONFIRMED", label: "Confirmed" }, { value: "DELIVERED", label: "Delivered" }, { value: "CANCELLED", label: "Cancelled" }];
const PAY = [{ value: "CASH", label: "Cash" }, { value: "CARD", label: "Card" }, { value: "CREDIT", label: "Credit" }];

export function VanSales() {
  const router = useRouter();
  const sub = subOf(usePathname(), VS_BASE);
  const sales = useCollection("van-sales");
  const [status, setStatus] = useState("all");
  const close = () => router.push(VS_BASE);
  const rows = [...sales].filter((s) => status === "all" || s.status === status).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const detail = sub && sub !== "new" ? sales.find((s) => s.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Van Sales" actions={<Link href={`${VS_BASE}/new`} className={btn.primary}><Plus /> New Sale</Link>} />
      <ListCard title="Sales" filter={<Select value={status} onChange={setStatus} options={[{ value: "all", label: "All Status" }, ...SALE_STATUSES]} className="w-40" ariaLabel="Status" />}>
        {rows.length ? (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className={th}>Sale Number</th><th className={th}>Customer</th><th className={th}>Date</th><th className={th}>Amount</th><th className={th}>Status</th><th className={th}>Payment Method</th></tr></thead>
            <tbody>{rows.map((s) => (
              <tr key={s.id} onClick={() => router.push(`${VS_BASE}/${s.id}`)} className="cursor-pointer border-b border-border hover:bg-muted/50">
                <td className="px-3 py-2"><Link href={`${VS_BASE}/${s.id}`} className="font-medium text-primary hover:underline">{String(s.saleNumber)}</Link></td><td className="px-3 py-2">{String(s.customerName || "Walk-in")}</td><td className="px-3 py-2">{String(s.saleDate)}</td><td className="px-3 py-2">{usd(s.totalAmount)}</td><td className="px-3 py-2"><Status s={s.status} /></td><td className="px-3 py-2">{String(s.paymentMethod || "-")}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Empty icon={ShoppingCart} text="No sales found. Create your first van sale to get started." />}
      </ListCard>
      {sub === "new" && <SidePanel onClose={close}><VanSaleForm onDone={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><VanSaleDetail key={detail.id} sale={detail} /></SidePanel>}
    </div>
  );
}

const blankLine = () => ({ productId: "", description: "", quantity: "1", unitPrice: "0", discountPercent: "0", taxRate: "0" });

function VanSaleForm({ onDone }: { onDone: () => void }) {
  const vans = useCollection("vans");
  const products = useCollection("products");
  const routes = useCollection("van-routes");
  useCollection("stock-moves");
  const [f, setF] = useState({ vanId: "", routeId: "", customerName: "", salespersonName: "", paymentMethod: "CASH", paymentReference: "", deliveryAddress: "", deliveryNotes: "" });
  const [lines, setLines] = useState([blankLine()]);
  const { msg, flash } = useFlash();
  const loaded = f.vanId ? vanInventory(f.vanId) : [];
  const setLine = (i: number, p: Partial<ReturnType<typeof blankLine>>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...p } : l)));
  const parsed = lines.map((l) => ({ productId: l.productId, description: l.description, quantity: num(l.quantity), unitPrice: num(l.unitPrice), discountPercent: num(l.discountPercent), taxRate: num(l.taxRate) }));
  const t = vanTotals(parsed);
  const productOpts = loaded.length ? loaded.map((i) => ({ value: i.productId, label: `${i.productName} (Avail: ${i.quantityAvailable})` })) : products.filter((p) => p.status !== "INACTIVE").map((p) => ({ value: p.id, label: `${p.sku ? `${p.sku} - ` : ""}${p.name}` }));
  function submit() {
    if (!f.vanId) return flash("Please select a van", true);
    const valid = parsed.filter((l) => l.productId && l.quantity > 0 && l.unitPrice > 0);
    if (!valid.length) return flash("At least one line item with product, quantity, and price is required", true);
    createVanSale({ ...f, routeId: f.routeId || undefined, lines: valid });
    onDone();
  }
  const next = `VS-${String(readCollection("van-sales").length + 1).padStart(2, "0")}`;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Create Van Sale</h1>
      <Card>
        <div className="p-6 pb-3"><CardTitle>Sale Details</CardTitle></div>
        <div className="space-y-4 p-6 pt-0">
          <NumberBanner label="Sale #" value={next} />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Van <Req /></Label><Select value={f.vanId} onChange={(v) => setF({ ...f, vanId: v })} placeholder="Select a van" options={vans.filter((v) => v.status !== "INACTIVE").map((v) => ({ value: v.id, label: vanLabel(v) }))} /></div>
            <Field label="Customer Name" htmlFor="vs-cust"><input id="vs-cust" value={f.customerName} onChange={(e) => setF({ ...f, customerName: e.target.value })} placeholder="Walk-in if empty" className={inputCls} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Salesperson Name" htmlFor="vs-sp"><input id="vs-sp" value={f.salespersonName} onChange={(e) => setF({ ...f, salespersonName: e.target.value })} className={inputCls} /></Field>
            <div className="space-y-2"><Label>Payment Method</Label><Select value={f.paymentMethod} onChange={(v) => setF({ ...f, paymentMethod: v })} options={PAY} /></div>
            <Field label="Payment Reference" htmlFor="vs-ref"><input id="vs-ref" value={f.paymentReference} onChange={(e) => setF({ ...f, paymentReference: e.target.value })} placeholder="Ref #" className={inputCls} /></Field>
          </div>
          {routes.some((r) => r.vanId === f.vanId && r.status !== "COMPLETED" && r.status !== "CANCELLED") && <div className="space-y-2"><Label>Route</Label><Select value={f.routeId} onChange={(v) => setF({ ...f, routeId: v })} placeholder="No route" options={routes.filter((r) => r.vanId === f.vanId && r.status !== "COMPLETED" && r.status !== "CANCELLED").map((r) => ({ value: r.id, label: `${r.routeCode} — ${r.routeName}` }))} /></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Delivery Address" htmlFor="vs-addr"><input id="vs-addr" value={f.deliveryAddress} onChange={(e) => setF({ ...f, deliveryAddress: e.target.value })} className={inputCls} /></Field>
            <Field label="Delivery Notes" htmlFor="vs-notes"><textarea id="vs-notes" value={f.deliveryNotes} onChange={(e) => setF({ ...f, deliveryNotes: e.target.value })} placeholder="Optional delivery notes..." className={textareaCls} /></Field>
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex items-center justify-between p-6 pb-3"><CardTitle>Line Items</CardTitle><button type="button" className={btn.smOutline} onClick={() => setLines((l) => [...l, blankLine()])}><Plus /> Add Line</button></div>
        <div className="space-y-3 p-6 pt-0">
          {lines.map((l, i) => (
            <div key={i} className="grid items-end gap-2 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)_4rem_6rem_4rem_4rem_5rem_2rem]">
              <div className="space-y-1"><Label>Product *</Label><Select value={l.productId} onChange={(v) => { const p = products.find((x) => x.id === v); setLine(i, { productId: v, unitPrice: p ? String(num(p.retail)) : l.unitPrice, taxRate: p ? String(num(p.tax)) : l.taxRate }); }} placeholder="Select product" options={productOpts} /></div>
              <div className="space-y-1"><Label>Description</Label><input value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} placeholder="Desc" aria-label="Description" className={inputCls} /></div>
              <div className="space-y-1"><Label>Qty *</Label><input type="number" value={l.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} aria-label="Qty" className={inputCls} /></div>
              <div className="space-y-1"><Label>Unit Price *</Label><input type="number" step="0.001" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} aria-label="Unit Price" className={inputCls} /></div>
              <div className="space-y-1"><Label>Disc %</Label><input type="number" step="0.001" value={l.discountPercent} onChange={(e) => setLine(i, { discountPercent: e.target.value })} aria-label="Disc %" className={inputCls} /></div>
              <div className="space-y-1"><Label>Tax %</Label><input type="number" step="0.001" value={l.taxRate} onChange={(e) => setLine(i, { taxRate: e.target.value })} aria-label="Tax %" className={inputCls} /></div>
              <div className="space-y-1"><Label>Total</Label><p className="py-2 text-sm font-medium">{usd(parsed[i].quantity * parsed[i].unitPrice * (1 - parsed[i].discountPercent / 100) * (1 + parsed[i].taxRate / 100))}</p></div>
              <button type="button" aria-label="Remove line" disabled={lines.length <= 1} className={btn.icon} onClick={() => setLines((x) => x.filter((_, j) => j !== i))}><Trash2 className="text-destructive" /></button>
            </div>
          ))}
          <div className="space-y-1 border-t border-border pt-3 text-right text-sm"><p className="text-muted-foreground">Subtotal: {usd(t.subtotal)}</p><p className="text-muted-foreground">Tax: {usd(t.tax)}</p><p className="text-lg font-bold">Total: {usd(t.total)}</p></div>
        </div>
      </Card>
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={submit}>Create Sale</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
      <Flash msg={msg} />
    </div>
  );
}

function VanSaleDetail({ sale }: { sale: Rec }) {
  const products = useCollection("products");
  const vans = useCollection("vans");
  const [busy, setBusy] = useState(false);
  const { msg, flash } = useFlash();
  const lines = (sale.lines as Rec[]) ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title={String(sale.saleNumber)} actions={<>
        {sale.status === "DRAFT" && <button type="button" className={btn.primary} disabled={busy} onClick={() => { setBusy(true); try { confirmVanSale(sale.id); flash("Sale confirmed"); } catch (e) { flash((e as Error).message, true); } setBusy(false); }}>{busy ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Confirm Sale</button>}
        {sale.status === "CONFIRMED" && <button type="button" className={btn.outline} onClick={() => updateRecord("van-sales", sale.id, { status: "DELIVERED" })}><Truck /> Mark Delivered</button>}
        {sale.status === "DRAFT" && <button type="button" className={btn.outline} onClick={() => updateRecord("van-sales", sale.id, { status: "CANCELLED" })}>Cancel Sale</button>}
      </>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><div className="space-y-1 p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><User className="size-4" /> Sale Details</div><p className="font-semibold">{String(sale.customerName || "Walk-in Customer")}</p><p className="text-sm text-muted-foreground">{String(sale.salespersonName || "-")}</p><p className="text-sm text-muted-foreground">{new Date(String(sale.saleDate)).toLocaleDateString()}</p><p className="text-xs text-muted-foreground">{String(vans.find((v) => v.id === sale.vanId)?.name ?? "")}</p></div></Card>
        <Card><div className="space-y-1 p-4"><div className="flex items-center gap-2 text-sm text-muted-foreground"><ShoppingCart className="size-4" /> Payment</div><p className="text-xl font-bold">{usd(sale.totalAmount)}</p><div className="text-sm text-muted-foreground">{Boolean(sale.paymentMethod) && <span>Method: {String(sale.paymentMethod)}</span>}{Boolean(sale.paymentReference) && <span> | Ref: {String(sale.paymentReference)}</span>}</div>{num(sale.amountDue) > 0 && <p className="text-sm text-destructive">Amount Due: {usd(sale.amountDue)}</p>}</div></Card>
        <Card><div className="space-y-1 p-4"><div className="flex items-center justify-between"><div className="text-sm text-muted-foreground">Status</div><Status s={sale.status} /></div><div className="text-sm"><p>Subtotal: {usd(sale.subtotal)}</p><p>Tax: {usd(sale.taxAmount)}</p><p>Discount: {usd(sale.discountAmount)}</p><p className="font-semibold">Total: {usd(sale.totalAmount)}</p></div></div></Card>
      </div>
      {Boolean(sale.deliveryAddress || sale.deliveryNotes) && (
        <Card><div className="p-5 pb-3"><CardTitle className="flex items-center gap-2"><MapPin className="size-4" />Delivery Information</CardTitle></div><div className="space-y-1 p-5 pt-0 text-sm">{Boolean(sale.deliveryAddress) && <div><span className="text-muted-foreground">Address: </span>{String(sale.deliveryAddress)}</div>}{Boolean(sale.deliveryNotes) && <div><span className="text-muted-foreground">Notes: </span>{String(sale.deliveryNotes)}</div>}</div></Card>
      )}
      <Card>
        <div className="p-5 pb-3"><CardTitle>Line Items</CardTitle></div>
        <div className="overflow-x-auto p-5 pt-0">{lines.length ? (
          <table className="w-full text-sm"><thead><tr className="border-b border-border"><th className={th}>#</th><th className={th}>Product</th><th className={th}>Description</th><th className={th}>Qty</th><th className={th}>Unit Price</th><th className={th}>Discount %</th><th className={th}>Tax %</th><th className={cn(th, "text-right")}>Total</th></tr></thead>
            <tbody>{lines.map((l, i) => <tr key={String(l.id ?? i)} className="border-b border-border"><td className="px-3 py-2">{i + 1}</td><td className="px-3 py-2">{String(products.find((p) => p.id === l.productId)?.name ?? "-")}</td><td className="px-3 py-2">{String(l.description || "-")}</td><td className="px-3 py-2">{num(l.quantity)}</td><td className="px-3 py-2">{usd(l.unitPrice)}</td><td className="px-3 py-2">{num(l.discountPercent)}%</td><td className="px-3 py-2">{num(l.taxRate)}%</td><td className="px-3 py-2 text-right">{usd(l.lineTotal)}</td></tr>)}</tbody>
            <tfoot><tr><td colSpan={7} className="px-3 py-2 text-right font-semibold">Total:</td><td className="px-3 py-2 text-right font-semibold">{usd(sale.totalAmount)}</td></tr></tfoot></table>
        ) : <p className="text-sm text-muted-foreground">No line items</p>}</div>
      </Card>
      <Flash msg={msg} />
    </div>
  );
}
