"use client";

// POS back office: terminals, shifts, sales (with returns), approvals, reports, kitchen and floor plan.

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Ban, CheckCircle2, ChefHat, ChevronDown, Download, CreditCard, DollarSign, Eye, LayoutGrid, Mail, Plus, Printer, RefreshCw, Settings2, ShoppingCart, Trash2, Undo2, Users, X, XCircle } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { adjustStock, useMoves } from "@/lib/stock";
import { PAY_LABEL, closeShift, completeSale, processReturn, returnLines, seatTable, shiftReport, stockFor, terminalWarehouse, useReasons, voidSale } from "@/lib/pos";
import { useDismiss } from "@/lib/use-dismiss";
import { orgUnits } from "@/lib/hr";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Card, CardTitle, DataTable, Dialog, Field, Label, PageHeader, SearchInput, SidePanel, Switch, btn, downloadFile, inputCls, longDate, money, num, toCSV, toExcelHTML, today, type Column } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner, StatusBadge } from "@/components/sales/doc-kit";
import { EmptyCard, ProductPicker, subOf } from "@/components/purchasing/kit";
import { DenominationCounter, ReceiptView, countTotal, printReceipt, receiptFromSale } from "@/components/pos/kit";

const branchOpts = () => [{ value: "", label: "No branch" }, ...orgUnits().map((o) => ({ value: o.id, label: o.name }))];
const branchName = (v: unknown) => branchOpts().find((o) => o.value === v && v)?.label ?? "—";
const dateTime = (iso: unknown) => (iso ? new Date(String(iso)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "-");
const InfoCard = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Card><div className="p-4 pb-1 text-sm font-medium text-muted-foreground">{label}</div><div className="p-4 pt-0 font-medium">{children}</div></Card>
);

/* ---------- terminals ---------- */

const T_BASE = "/pos/terminals";
const SETTINGS_LINKS: [string, string][] = [
  ["/pos/price-lists", "Price lists"], ["/pos/promotions", "Promotions"], ["/pos/gift-cards", "Gift cards"], ["/pos/loyalty", "Loyalty"], ["/pos/modifiers", "Modifiers"], ["/pos/age-restricted", "Age-restricted"],
  ["/pos/deposits", "Deposits"], ["/pos/weighed", "Weighed"], ["/pos/serial-tracked", "Serial tracking"], ["/pos/labels", "Labels"], ["/pos/profile", "Profile"], ["/pos/quick-keys", "Quick keys"],
  ["/pos/supervisor-pin", "Supervisor PIN"], ["/pos/audit", "Audit log"], ["/pos/reports", "Reports"], ["/pos/receipt-settings", "Receipt settings"], ["/pos/customer-display", "Customer display"], ["/pos/returns/blind", "Return (no receipt)"],
];

export function Terminals() {
  const router = useRouter();
  const sub = subOf(usePathname(), T_BASE);
  const terminals = useCollection("pos-terminals");
  const sales = useCollection("pos-sales");
  const [branchFor, setBranchFor] = useState<Rec | null>(null);
  const [branch, setBranch] = useState("");
  const close = () => router.push(T_BASE);
  const columns: Column<Rec>[] = [
    { key: "name", header: "Name", cell: (t) => <span className="font-medium">{String(t.name)}</span> },
    { key: "loc", header: "Location", cell: (t) => String(t.location ?? "") },
    { key: "branch", header: "Branch", cell: (t) => <span className={t.orgUnitId ? "" : "text-muted-foreground"}>{branchName(t.orgUnitId)}</span> },
    { key: "status", header: "Status", cell: (t) => <StatusBadge status={t.isActive === false ? "INACTIVE" : "ACTIVE"} /> },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="POS Terminals" subtitle="Manage point of sale terminals" actions={
        <div className="flex w-full flex-wrap justify-end gap-2">
          <Link href={`${T_BASE}/new`} className={cn(btn.primary, "rounded-full")}><Plus /> New Terminal</Link>
          {SETTINGS_LINKS.map(([href, l]) => <Link key={href} href={href} target={href === "/pos/customer-display" ? "_blank" : undefined} className={cn(btn.outline, "rounded-full")}>{l}</Link>)}
        </div>
      } />
      <DataTable columns={columns} rows={terminals} menu={(t) => [
        { label: "Set branch", onSelect: () => { setBranchFor(t); setBranch(String(t.orgUnitId ?? "")); } },
        { label: "Delete", destructive: true, onSelect: () => sales.some((s) => s.terminalId === t.id) ? (confirm(`${t.name} has sales — disable it instead?`) && updateRecord("pos-terminals", t.id, { isActive: false })) : confirm(`Delete terminal ${t.name}?`) && deleteRecord("pos-terminals", t.id) },
      ]} />
      <Dialog open={!!branchFor} onClose={() => setBranchFor(null)} title={`Branch for ${branchFor?.name ?? ""}`} description="The outlet this till stands in. It decides what the register offers, which warehouse the sale draws from, and which branch the takings and their cost post to. A till with no branch falls back to the cashier's own, then the company default.">
        <div className="space-y-2"><Label>Branch</Label><Select value={branch} onChange={setBranch} options={branchOpts()} /></div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setBranchFor(null)}>Cancel</button><button type="button" className={btn.primary} onClick={() => { updateRecord("pos-terminals", branchFor!.id, { orgUnitId: branch || null }); setBranchFor(null); }}>Save</button></div>
      </Dialog>
      {sub === "new" && <SidePanel onClose={close}><TerminalForm onDone={close} /></SidePanel>}
    </div>
  );
}

function TerminalForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ name: "", location: "", orgUnitId: "", isActive: true, pricesIncludeTax: false });
  const set = (p: Partial<typeof f>) => setF((x) => ({ ...x, ...p }));
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return;
    createRecord("pos-terminals", { ...f, name: f.name.trim(), orgUnitId: f.orgUnitId || null, paymentMethods: ["CASH", "CREDIT_CARD", "DEBIT_CARD", "MOBILE_PAYMENT", "GIFT_CARD"], defaultTaxRate: 0, receiptWidth: "80mm", quickKeys: [] });
    onDone();
  }
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">New Terminal</h1>
      <Card className="max-w-2xl">
        <div className="p-6 pb-3"><CardTitle>Terminal Details</CardTitle></div>
        <form onSubmit={submit} className="space-y-4 p-6 pt-0">
          <Field label="Name" htmlFor="t-name"><input id="t-name" required autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} /></Field>
          <Field label="Location" htmlFor="t-loc"><input id="t-loc" value={f.location} onChange={(e) => set({ location: e.target.value })} className={inputCls} /></Field>
          <div className="space-y-2"><Label>Branch</Label><Select value={f.orgUnitId} onChange={(v) => set({ orgUnitId: v })} options={branchOpts()} /><p className="text-xs text-muted-foreground">The outlet this till stands in. It decides what the register offers, which warehouse the sale draws from, and which branch the takings and their cost post to.</p></div>
          <label className="flex items-center gap-2"><Switch checked={f.isActive} onChange={(v) => set({ isActive: v })} label="Active" /><Label>Active</Label></label>
          <label className="flex items-center gap-2"><Switch checked={f.pricesIncludeTax} onChange={(v) => set({ pricesIncludeTax: v })} label="Prices include tax" /><Label>Prices include tax</Label></label>
          <div className="flex gap-2"><button type="submit" className={btn.primary}>Create Terminal</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
        </form>
      </Card>
    </div>
  );
}

/* ---------- shifts ---------- */

const S_BASE = "/pos/shifts";

export function Shifts() {
  const router = useRouter();
  const sub = subOf(usePathname(), S_BASE);
  const shifts = useCollection("pos-shifts");
  const sales = useCollection("pos-sales");
  const [id, rest] = sub.split("/");
  if (rest === "report") return <ShiftReport id={id} />;
  const close = () => router.push(S_BASE);
  const rows = [...shifts].sort((a, b) => String(b.openedAt).localeCompare(String(a.openedAt)));
  const detail = id ? shifts.find((s) => s.id === id) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="POS Shifts" subtitle="View shift history" />
      <DataTable
        columns={[
          { key: "c", header: "Cashier", cell: (s) => <span className="font-medium">{String(s.openedBy || "-")}</span> },
          { key: "o", header: "Opened", cell: (s) => dateTime(s.openedAt) },
          { key: "cl", header: "Closed", cell: (s) => (s.closedAt ? dateTime(s.closedAt) : <span className="text-muted-foreground">-</span>) },
          { key: "oc", header: "Opening", cell: (s) => money(num(s.openingCash)) },
          { key: "cc", header: "Closing", cell: (s) => (s.closingCash != null ? money(num(s.closingCash)) : "-") },
          { key: "st", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
        ]}
        rows={rows}
        onRowClick={(s) => router.push(`${S_BASE}/${s.id}`)}
        menu={(s) => [
          { label: "Open", onSelect: () => router.push(`${S_BASE}/${s.id}`) },
          { label: "Delete", destructive: true, onSelect: () => (sales.some((x) => x.shiftId === s.id) ? alert(`Shift ${s.shiftNumber} has sales and can't be deleted.`) : confirm(`Delete shift ${s.shiftNumber}?`) && deleteRecord("pos-shifts", s.id)) },
        ]}
      />
      {detail && <SidePanel onClose={close}><ShiftDetail key={detail.id} shift={detail} /></SidePanel>}
    </div>
  );
}

function ShiftDetail({ shift }: { shift: Rec }) {
  const [closing, setClosing] = useState(false);
  const [msg, setMsg] = useState("");
  const open = shift.status === "OPEN";
  return (
    <div className="space-y-4">
      <PageHeader title={`Shift - ${shift.cashierName ?? shift.openedBy}`} actions={<>
        <button type="button" className={btn.outline} onClick={() => window.open(`${S_BASE}/${shift.id}/report`, "_blank")}>{open ? "X-report" : "Z-report"}</button>
        {open && <button type="button" className={btn.primary} onClick={() => setClosing(true)}><X /> Close Shift</button>}
      </>} />
      {msg && <p className="rounded-md border border-border bg-muted p-2 text-sm">{msg}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <InfoCard label="Status"><StatusBadge status={shift.status} /></InfoCard>
        <InfoCard label="Opened">{dateTime(shift.openedAt)}</InfoCard>
        <InfoCard label="Opening Cash">{money(num(shift.openingCash))}</InfoCard>
        <InfoCard label="Closing Cash">{shift.closingCash != null ? money(num(shift.closingCash)) : "-"}</InfoCard>
        {!open && <InfoCard label="Expected Cash">{shift.expectedCash != null ? money(num(shift.expectedCash)) : "-"}</InfoCard>}
        {!open && <InfoCard label="Variance"><span className={num(shift.cashDifference) < 0 ? "text-destructive" : ""}>{money(num(shift.cashDifference))}</span></InfoCard>}
      </div>
      {closing && <CloseShiftDialog shift={shift} onClose={() => setClosing(false)} onClosed={(d) => { setClosing(false); setMsg(`Shift closed — ${d === 0 ? "Cash balanced" : `${d > 0 ? "Over" : "Short"} ${money(Math.abs(d))}`}`); }} />}
    </div>
  );
}

function CloseShiftDialog({ shift, onClose, onClosed }: { shift: Rec; onClose: () => void; onClosed: (diff: number) => void }) {
  const [by, setBy] = useState<string>(BRAND.user.fullName);
  const [counting, setCounting] = useState(false);
  const [count, setCount] = useState<Record<string, number>>({});
  const [cash, setCash] = useState("0");
  const [error, setError] = useState("");
  function submit() {
    if (!by.trim()) return setError("Enter the cashier name");
    try { onClosed(num(closeShift(shift.id, { closedBy: by.trim(), closingCash: counting ? countTotal(count) : num(cash), denominations: counting ? count : undefined }).cashDifference)); } catch (e) { setError((e as Error).message); }
  }
  return (
    <Dialog open onClose={onClose} title="Close shift" className="max-w-md">
      <div className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="cs-by">Closed by</Label><input id="cs-by" value={by} onChange={(e) => setBy(e.target.value)} className={inputCls} /></div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between"><Label htmlFor="cs-cash">Closing cash</Label><button type="button" className="text-xs text-primary underline" onClick={() => setCounting((c) => !c)}>{counting ? "Enter amount" : "Count drawer"}</button></div>
          {counting ? <DenominationCounter value={count} onChange={setCount} /> : <input id="cs-cash" type="number" step="0.001" min={0} value={cash} onChange={(e) => setCash(e.target.value)} className={inputCls} />}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>Cancel</button><button type="button" className={btn.primary} onClick={submit}>Close shift</button></div>
    </Dialog>
  );
}

const RL = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => <div className={cn("flex justify-between", bold && "font-bold")}><span>{label}</span><span>{value}</span></div>;

function ShiftReport({ id }: { id: string }) {
  const shifts = useCollection("pos-shifts");
  useCollection("pos-sales");
  // The report reads browser storage, so it renders after mount.
  const r = shifts.length ? shiftReport(id) : null;
  if (!shifts.length) return null;
  if (!r) return <div className="p-6 text-sm text-muted-foreground">Shift not found</div>;
  const hr = <div className="my-2 border-t border-dashed border-black" />;
  return (
    <>
      <style>{`@media print { body * { visibility: hidden !important; } #pos-zreport, #pos-zreport * { visibility: visible !important; } #pos-zreport { position: absolute; inset-block-start: 0; inset-inline-start: 0; } }`}</style>
      <div className="mb-4 flex justify-center"><button type="button" className={btn.primary} onClick={() => window.print()}><Printer /> Print {r.kind}-report</button></div>
      <div id="pos-zreport" className="mx-auto w-[80mm] bg-white p-4 font-mono text-xs text-black shadow">
        <div className="text-center"><div className="text-base font-bold">{r.kind}-REPORT</div><div>{r.shift.terminalName}</div><div>Shift {String(r.shift.shiftNumber)}</div></div>
        {hr}<RL label="Status" value={String(r.shift.status)} /><RL label="Opened" value={new Date(String(r.shift.openedAt)).toLocaleString()} />{r.shift.closedAt ? <RL label="Closed" value={new Date(String(r.shift.closedAt)).toLocaleString()} /> : null}<RL label="By" value={String(r.shift.openedBy)} />
        {hr}<div className="font-bold">Sales</div><RL label="Transactions" value={String(r.sales.count)} /><RL label="Net" value={money(r.sales.net)} /><RL label="Tax" value={money(r.sales.tax)} /><RL label="Total" value={money(r.sales.total)} />
        {hr}<div className="font-bold">Tender</div>{r.payments.length === 0 ? <div className="text-gray-500">No payments</div> : r.payments.map((p) => <RL key={p.type} label={PAY_LABEL[p.type] ?? p.type} value={money(p.amount)} />)}
        {hr}<div className="font-bold">Cash reconciliation</div><RL label="Opening" value={money(r.cash.openingCash)} /><RL label="Cash sales" value={money(r.cash.cashSales)} /><RL label="Cash in" value={money(r.cash.cashIn)} /><RL label="Cash out" value={`-${money(r.cash.cashOut)}`} /><RL label="Expected" value={money(r.cash.expectedCash)} bold />
        {r.cash.closingCash != null && <RL label="Counted" value={money(num(r.cash.closingCash))} />}{r.cash.variance != null && <RL label="Variance" value={`${num(r.cash.variance) < 0 ? "-" : ""}${money(Math.abs(num(r.cash.variance)))}`} bold />}
        <div className="mt-3 text-center text-gray-500">{new Date(r.generatedAt).toLocaleString()}</div>
      </div>
    </>
  );
}

/* ---------- sales ---------- */

const SA_BASE = "/pos/sales";

export function PosSales() {
  const router = useRouter();
  const sub = subOf(usePathname(), SA_BASE);
  const sales = useCollection("pos-sales");
  const [q, setQ] = useState("");
  const [id, rest] = sub.split("/");
  if (sub === "summary") return <DailySummary />;
  if (rest === "return") return <ReturnPage id={id} />;
  const close = () => router.push(SA_BASE);
  const rows = [...sales].filter((s) => !q || `${s.saleNumber} ${s.cashierName ?? ""} ${s.customerName ?? ""}`.toLowerCase().includes(q.toLowerCase())).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const detail = id && id !== "new" ? sales.find((s) => s.id === id) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="POS Sales" subtitle="View and manage sales" actions={<Link href={`${SA_BASE}/new`} className={btn.primary}><Plus /> New Sale</Link>} />
      <div className="max-w-sm"><SearchInput value={q} onChange={setQ} placeholder="Search sales..." /></div>
      <DataTable
        columns={[
          { key: "n", header: "Sale #", cell: (s) => <span className="font-mono text-sm">{String(s.saleNumber)}</span> },
          { key: "d", header: "Date", cell: (s) => longDate(s.saleDate) },
          { key: "c", header: "Cashier", cell: (s) => String(s.cashierName ?? "") },
          { key: "t", header: "Total", cell: (s) => money(num(s.totalAmount)) },
          { key: "s", header: "Status", cell: (s) => <StatusBadge status={s.status} /> },
          { key: "p", header: "", cell: (s) => <button type="button" title="Print this receipt" className={cn(btn.ghost, "h-8 px-3")} onClick={(e) => { e.stopPropagation(); printReceipt(s); }}><Printer /><span className="sr-only">Print receipt</span></button> },
        ]}
        rows={rows}
        onRowClick={(s) => router.push(`${SA_BASE}/${s.id}`)}
      />
      {sub === "new" && <SidePanel defaultExpanded onClose={close}><NewSale onDone={(sid) => router.push(`${SA_BASE}/${sid}`)} /></SidePanel>}
      {detail && <SidePanel onClose={close}><SaleDetail key={detail.id} sale={detail} /></SidePanel>}
    </div>
  );
}

type QLine = { lineId: string; productId: string; productName: string; quantity: number; unitPrice: number; savedPrice: number; discountAmount: number; taxRate: number; foc: boolean; unit: string; cost: number };

function NewSale({ onDone }: { onDone: (id: string) => void }) {
  const [cashier, setCashier] = useState("");
  const [lines, setLines] = useState<QLine[]>([]);
  const [pays, setPays] = useState([{ method: "CASH", amount: "" }]);
  const [error, setError] = useState("");
  useMoves();
  const wh = terminalWarehouse();
  const stock = stockFor(lines.map((l) => l.productId), wh);
  const qtyBy: Record<string, number> = {};
  for (const l of lines) qtyBy[l.productId] = (qtyBy[l.productId] ?? 0) + l.quantity;
  const over = Object.entries(qtyBy).some(([pid, q]) => pid in stock && q > stock[pid]);
  const net = (l: QLine) => Math.max(0, l.quantity * l.unitPrice - l.discountAmount);
  const disc = lines.reduce((a, l) => a + l.discountAmount, 0);
  const sub = lines.reduce((a, l) => a + net(l), 0);
  const tax = lines.reduce((a, l) => a + (net(l) * l.taxRate) / 100, 0);
  const total = sub + tax;
  const paid = pays.reduce((a, p) => a + num(p.amount), 0);
  const set = (id: string, p: Partial<QLine>) => setLines((ls) => ls.map((l) => (l.lineId === id ? { ...l, ...p } : l)));
  function addProduct(id: string, p: Rec) {
    if (!p) return;
    setLines((ls) => [...ls, { lineId: crypto.randomUUID(), productId: id, productName: String(p.name), quantity: 1, unitPrice: num(p.retail), savedPrice: num(p.retail), discountAmount: 0, taxRate: num(p.tax), foc: false, unit: String(p.uom || "-"), cost: num(p.cost) }]);
  }
  function complete() {
    if (!lines.length) return setError("Add items");
    try {
      const sale = completeSale({ cashierName: cashier || undefined, source: "QUICK", lines: lines.map((l) => ({ productId: l.productId, description: l.foc ? `${l.productName} [FOC]` : l.productName, quantity: l.quantity || 1, unitPrice: l.unitPrice, discountAmount: l.discountAmount, taxRate: l.taxRate })), payments: pays.filter((p) => num(p.amount) > 0).map((p) => ({ method: p.method, amount: num(p.amount) })) });
      onDone(sale.id);
    } catch (e) { setError((e as Error).message); }
  }
  const next = `POS-${String(readCollection("pos-sales").length + 1).padStart(2, "0")}`;
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New Sale</h1><p className="text-sm text-muted-foreground">Quick point of sale</p></div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <Card>
            <div className="p-5 pb-3"><CardTitle className="flex items-center gap-2"><ShoppingCart className="size-4" /> Add Products</CardTitle></div>
            <div className="space-y-4 p-5 pt-0">
              <Field label="Cashier" htmlFor="ns-cashier"><input id="ns-cashier" value={cashier} onChange={(e) => setCashier(e.target.value)} placeholder="Cashier name" className={inputCls} /></Field>
              <div className="space-y-2"><Label>Search Product</Label><ProductPicker size="md" value="" onChange={addProduct} /></div>
            </div>
          </Card>
          <Card>
            <div className="p-5 pb-3"><CardTitle>Items</CardTitle></div>
            <div className="overflow-x-auto p-5 pt-0">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="w-16 font-medium">UOM</th><th className="w-20 font-medium">Qty</th><th className="w-24 font-medium">Price</th><th className="w-24 font-medium">Discount</th><th className="w-12 font-medium">FOC</th><th className="w-28 text-right font-medium">Total</th><th className="w-8" /></tr></thead>
                <tbody>
                  {lines.map((l) => {
                    const s = stock[l.productId];
                    const short = typeof s === "number" && (qtyBy[l.productId] ?? 0) > s;
                    const margin = !l.foc && l.cost > 0 ? net(l) - l.cost * l.quantity : null;
                    const pct = margin != null && net(l) > 0 ? (margin / net(l)) * 100 : -100;
                    return (
                      <tr key={l.lineId} className="border-b border-border align-top">
                        <td className="py-2 font-medium">{l.productName}{l.foc && <span className="ml-1 rounded bg-muted px-1 text-[10px]">FOC</span>}</td>
                        <td className="py-2 text-muted-foreground">{l.unit}</td>
                        <td className="py-2"><input type="number" min={1} aria-label="Qty" value={l.quantity} onChange={(e) => set(l.lineId, { quantity: parseInt(e.target.value) || 0 })} onBlur={() => l.quantity < 1 && set(l.lineId, { quantity: 1 })} className={cn(inputCls, "h-8 w-16")} />{typeof s === "number" && <div className={cn("mt-0.5 text-[10px] tabular-nums", short ? "font-medium text-destructive" : "text-muted-foreground")}>{short ? `Only ${s} in stock` : `${s} in stock`}</div>}</td>
                        <td className="py-2"><input type="number" step="0.001" min={0} aria-label="Price" disabled={l.foc} value={l.unitPrice} onChange={(e) => set(l.lineId, { unitPrice: parseFloat(e.target.value) || 0 })} className={cn(inputCls, "h-8 w-24")} /></td>
                        <td className="py-2"><input type="number" step="0.001" min={0} aria-label="Discount" disabled={l.foc} value={l.discountAmount} placeholder="0.00" onChange={(e) => set(l.lineId, { discountAmount: Math.max(0, parseFloat(e.target.value) || 0) })} className={cn(inputCls, "h-8 w-24")} /></td>
                        <td className="py-2 text-center"><input type="checkbox" aria-label="Free of charge" checked={l.foc} onChange={() => set(l.lineId, l.foc ? { foc: false, unitPrice: l.savedPrice } : { foc: true, savedPrice: l.unitPrice, unitPrice: 0 })} className="mt-2 size-4 accent-[var(--color-primary)]" /></td>
                        <td className="py-2 text-right tabular-nums">{money(net(l))}{margin != null && <div title={margin < 0 ? `Cost ${money(l.cost * l.quantity)} — this line sells below cost` : `Cost ${money(l.cost * l.quantity)}`} className={cn("mt-0.5 whitespace-nowrap text-[10.5px] font-semibold", margin < 0 ? "text-destructive" : pct < 10 ? "text-warning" : "text-success")}>{margin < 0 ? `below cost by ${money(-margin)}` : `margin ${pct.toFixed(0)}% · room ${money(margin)}`}</div>}</td>
                        <td className="py-2"><button type="button" aria-label="Remove" className={btn.icon} onClick={() => setLines((ls) => ls.filter((x) => x.lineId !== l.lineId))}><Trash2 /></button></td>
                      </tr>
                    );
                  })}
                  {lines.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No items added. Search for a product above.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="p-5 pb-3"><CardTitle>Order Summary</CardTitle></div>
            <div className="space-y-2 p-5 pt-0 text-sm">
              <NumberBanner label="Receipt #" value={next} compact />
              <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{money(sub)}</span></div>
              {disc > 0 && <div className="flex justify-between text-success"><span>Discount</span><span className="tabular-nums">−{money(disc)}</span></div>}
              <div className="flex justify-between"><span>Tax</span><span className="tabular-nums">{money(tax)}</span></div>
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold"><span>Total</span><span className="tabular-nums">{money(total)}</span></div>
            </div>
          </Card>
          <Card>
            <div className="p-5 pb-3"><CardTitle>Payment</CardTitle></div>
            <div className="space-y-2 p-5 pt-0">
              {pays.map((p, i) => (
                <div key={i} className="space-y-2">
                  <Select value={p.method} onChange={(v) => setPays((x) => x.map((y, j) => (j === i ? { ...y, method: v } : y)))} options={[{ value: "CASH", label: "Cash" }, { value: "CREDIT_CARD", label: "Credit Card" }, { value: "DEBIT_CARD", label: "Debit Card" }, { value: "MOBILE_PAYMENT", label: "Mobile" }]} ariaLabel="Payment method" />
                  <input type="number" step="0.001" placeholder="Amount" value={p.amount} onChange={(e) => setPays((x) => x.map((y, j) => (j === i ? { ...y, amount: e.target.value } : y)))} className={inputCls} />
                </div>
              ))}
              <button type="button" className={btn.smOutline} onClick={() => setPays((x) => [...x, { method: "CASH", amount: "" }])}><Plus /> Split Payment</button>
              {over && <p className="text-xs text-destructive">Quantity exceeds available stock</p>}
              {paid - total > 0 && <div className="flex justify-between text-sm font-medium text-success"><span>Change</span><span>{money(paid - total)}</span></div>}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <button type="button" onClick={complete} disabled={!lines.length || paid < total - 1e-9} className={cn(btn.primary, "h-10 w-full")}><ShoppingCart /> Complete Sale</button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SaleDetail({ sale }: { sale: Rec }) {
  const router = useRouter();
  const [preview, setPreview] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  const [msg, setMsg] = useState("");
  const email = () => {
    const to = window.prompt("Email the receipt to (leave blank to use the customer's email):");
    if (to === null) return;
    const addr = to || String(readCollection("customers").find((c) => c.id === sale.customerId)?.email ?? "");
    setMsg(addr ? `Queued for ${addr} (SMTP not configured)` : "No email address — enter one to send the receipt.");
  };
  return (
    <div className="space-y-4">
      <PageHeader title={`Sale ${sale.saleNumber}`} actions={<>
        <button type="button" className={btn.outline} onClick={() => setPreview(true)}><Eye /> Preview receipt</button>
        <button type="button" className={btn.outline} onClick={() => printReceipt(sale)}><Printer /> Print receipt</button>
        <button type="button" className={btn.outline} onClick={email}><Mail /> Email receipt</button>
        {sale.status !== "VOIDED" && <button type="button" className={btn.outline} onClick={() => router.push(`${SA_BASE}/${sale.id}/return`)}><Undo2 /> Return</button>}
        {sale.status === "PAID" && <button type="button" className={cn(btn.primary, "bg-destructive hover:bg-destructive/90")} onClick={() => setConfirmVoid(true)}><Ban /> Void</button>}
      </>} />
      {msg && <p className="rounded-md border border-border bg-muted p-2 text-sm">{msg}</p>}
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Status"><StatusBadge status={sale.status} /></InfoCard>
        <InfoCard label="Date">{longDate(sale.saleDate)}</InfoCard>
        <InfoCard label="Cashier">{String(sale.cashierName || "-")}</InfoCard>
        <InfoCard label="Total"><span className="text-xl font-bold">{money(num(sale.totalAmount))}</span></InfoCard>
        <InfoCard label="Change">{money(num(sale.changeGiven))}</InfoCard>
      </div>
      <Card>
        <div className="p-5 pb-3"><CardTitle>Items</CardTitle></div>
        <div className="p-5 pt-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Product</th><th className="text-right font-medium">Qty</th><th className="text-right font-medium">Price</th><th className="text-right font-medium">Total</th></tr></thead>
            <tbody>{((sale.lines as Rec[]) ?? []).map((l, i) => <tr key={i} className="border-b border-border"><td className="py-2">{String(l.description || "Unnamed item")}{num(l.returned) > 0 && <span className="ml-2 text-xs text-muted-foreground">({num(l.returned)} returned)</span>}</td><td className="text-right">{num(l.quantity)}</td><td className="text-right">{money(num(l.unitPrice))}</td><td className="text-right">{money(num(l.lineTotal))}</td></tr>)}</tbody>
            <tfoot>
              <tr><td colSpan={3} className="py-1 text-right text-muted-foreground">Subtotal</td><td className="text-right">{money(num(sale.subtotal))}</td></tr>
              <tr><td colSpan={3} className="py-1 text-right text-muted-foreground">Tax</td><td className="text-right">{money(num(sale.taxAmount))}</td></tr>
              <tr><td colSpan={3} className="py-1 text-right font-semibold">Total</td><td className="text-right font-semibold">{money(num(sale.totalAmount))}</td></tr>
            </tfoot>
          </table>
        </div>
      </Card>
      {((sale.payments as Rec[]) ?? []).length > 0 && (
        <Card>
          <div className="p-5 pb-3"><CardTitle>Payments</CardTitle></div>
          <div className="p-5 pt-0"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground"><th className="py-2 font-medium">Method</th><th className="text-right font-medium">Amount</th><th className="pl-4 font-medium">Reference</th></tr></thead>
            <tbody>{((sale.payments as Rec[]) ?? []).map((p, i) => <tr key={i} className="border-b border-border"><td className="py-2">{String(p.method)}</td><td className="text-right">{money(num(p.amount))}</td><td className="pl-4">{String(p.reference || "-")}</td></tr>)}</tbody></table></div>
        </Card>
      )}
      <Dialog open={preview} onClose={() => setPreview(false)} title="Receipt Preview" className="max-w-md"><div className="max-h-[70vh] overflow-y-auto rounded bg-muted p-3"><ReceiptView receipt={receiptFromSale(sale)} /></div></Dialog>
      <Dialog open={confirmVoid} onClose={() => setConfirmVoid(false)} title="Void Sale?" description="This will void the sale and reverse the transaction.">
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setConfirmVoid(false)}>Cancel</button><button type="button" className={cn(btn.primary, "bg-destructive hover:bg-destructive/90")} onClick={() => { voidSale(sale.id, BRAND.user.fullName); setConfirmVoid(false); setMsg("Sale voided"); }}>Void Sale</button></div>
      </Dialog>
    </div>
  );
}

function ReturnPage({ id }: { id: string }) {
  const router = useRouter();
  const sales = useCollection("pos-sales");
  const reasons = useReasons();
  const sale = sales.find((s) => s.id === id);
  const lines = useMemo(() => (sale ? returnLines(sale) : []), [sale]);
  const [state, setState] = useState<Record<string, { qty: string; restock: boolean }>>({});
  const [reason, setReason] = useState("");
  const [method, setMethod] = useState("ORIGINAL");
  const [error, setError] = useState("");
  if (!sale) return <div className="p-6 text-sm text-muted-foreground">Sale not found</div>;
  const st = (k: string) => state[k] ?? { qty: "0", restock: true };
  const refund = lines.reduce((a, l) => a + Math.min(num(st(l.saleLineId).qty), l.remaining) * (l.quantity > 0 ? l.lineTotal / l.quantity : 0), 0);
  function submit() {
    const chosen = lines.map((l) => ({ l, qty: num(st(l.saleLineId).qty) })).filter((x) => x.qty > 0);
    if (!chosen.length) return setError("Select at least one item to return");
    const bad = chosen.find((x) => x.qty > x.l.remaining);
    if (bad) return setError(`Only ${bad.l.remaining} of "${bad.l.description}" can be returned`);
    if (method !== "ORIGINAL" && !sale!.customerId) return setError("Store credit and exchange need a customer on the sale.");
    try {
      processReturn({ saleId: id, lines: chosen.map((x) => ({ saleLineId: x.l.saleLineId, quantity: x.qty, restock: st(x.l.saleLineId).restock })), refundMethod: method as "ORIGINAL", reason: reason || undefined, actor: BRAND.user.fullName });
      router.push(`${SA_BASE}/${id}`);
    } catch (e) { setError((e as Error).message); }
  }
  return (
    <div className="space-y-4">
      <PageHeader title={`Return — ${sale.saleNumber}`} subtitle="Select items and quantities to return" />
      <Card>
        <div className="p-5 pb-3"><CardTitle>Items</CardTitle></div>
        <div className="space-y-3 p-5 pt-0">{lines.map((l) => (
          <div key={l.saleLineId} className="flex flex-wrap items-center gap-4 border-b border-border pb-3">
            <div className="min-w-0 flex-1"><div className="font-medium">{l.description}</div><div className="text-xs text-muted-foreground">Sold {l.quantity} · returned {l.alreadyReturned} · {money(l.unitPrice)} each</div></div>
            <div className="flex items-center gap-2"><Label className="text-xs">Return</Label><input type="number" min={0} max={l.remaining} step="0.001" disabled={l.remaining <= 0} value={st(l.saleLineId).qty} onChange={(e) => setState((s) => ({ ...s, [l.saleLineId]: { ...st(l.saleLineId), qty: e.target.value } }))} className={cn(inputCls, "h-8 w-20")} /><span className="text-xs text-muted-foreground">/ {l.remaining}</span></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={st(l.saleLineId).restock} onChange={(e) => setState((s) => ({ ...s, [l.saleLineId]: { ...st(l.saleLineId), restock: e.target.checked } }))} className="size-4" />Restock</label>
          </div>
        ))}</div>
      </Card>
      <Card className="max-w-md">
        <div className="space-y-4 p-5">
          <div className="space-y-1.5"><Label>Refund method</Label><Select value={method} onChange={setMethod} options={[{ value: "ORIGINAL", label: "Original tender" }, { value: "STORE_CREDIT", label: "Store credit" }, { value: "EXCHANGE", label: "Exchange" }]} /></div>
          <div className="space-y-1.5"><Label>Reason</Label><Select value={reason} onChange={setReason} placeholder="Optional" options={reasons.map((r) => ({ value: String(r.name), label: String(r.name) }))} /></div>
          <div className="flex justify-between text-lg font-bold"><span>Refund total</span><span className="tabular-nums">{money(refund)}</span></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2"><button type="button" className={btn.primary} disabled={refund <= 0} onClick={submit}>Process return</button><button type="button" className={btn.outline} onClick={() => router.push(`${SA_BASE}/${id}`)}>Cancel</button></div>
        </div>
      </Card>
    </div>
  );
}

function DailySummary() {
  const sales = useCollection("pos-sales");
  const [date, setDate] = useState(today());
  const day = sales.filter((s) => s.saleDate === date);
  const paid = day.filter((s) => s.status !== "VOIDED");
  const revenue = paid.reduce((a, s) => a + num(s.totalAmount), 0);
  const byPay: Record<string, number> = {};
  for (const s of paid) for (const p of (s.payments as Rec[]) ?? []) byPay[String(p.method)] = (byPay[String(p.method)] ?? 0) + num(p.amount);
  const voided = day.length - paid.length;
  return (
    <div className="space-y-4">
      <PageHeader title="Daily Sales Summary" subtitle="Overview of sales performance by date" />
      <div className="w-48 space-y-1.5"><Label>Date</Label><DateInput value={date} onChange={setDate} /></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><div className="p-4"><div className="flex items-center justify-between text-sm font-medium">Total Sales <ShoppingCart className="size-4 text-muted-foreground" /></div><div className="mt-2 text-2xl font-bold">{paid.length}</div>{voided > 0 && <p className="text-xs text-muted-foreground">{voided} voided</p>}</div></Card>
        <Card><div className="p-4"><div className="flex items-center justify-between text-sm font-medium">Total Revenue <DollarSign className="size-4 text-muted-foreground" /></div><div className="mt-2 text-2xl font-bold">{money(revenue)}</div><p className="text-xs text-muted-foreground">Avg: {money(paid.length ? revenue / paid.length : 0)}</p></div></Card>
        <Card><div className="p-4"><div className="flex items-center justify-between text-sm font-medium">Tax Collected <CreditCard className="size-4 text-muted-foreground" /></div><div className="mt-2 text-2xl font-bold">{money(paid.reduce((a, s) => a + num(s.taxAmount), 0))}</div></div></Card>
        <Card><div className="p-4"><div className="flex items-center justify-between text-sm font-medium">Total Discounts <Users className="size-4 text-muted-foreground" /></div><div className="mt-2 text-2xl font-bold">{money(paid.reduce((a, s) => a + num(s.discountAmount), 0))}</div></div></Card>
      </div>
      <Card>
        <div className="p-5 pb-3"><CardTitle>Payment Method Breakdown</CardTitle></div>
        <div className="p-5 pt-0">{Object.keys(byPay).length ? <div className="space-y-2">{Object.entries(byPay).map(([m, v]) => <div key={m} className="flex justify-between border-b border-border pb-2 text-sm"><span className="font-medium">{m}</span><span className="tabular-nums">{money(v)}</span></div>)}</div> : <p className="text-sm text-muted-foreground">No payment data for this date.</p>}</div>
      </Card>
    </div>
  );
}

/* ---------- approvals ---------- */

const KIND_LABEL: Record<string, string> = { CORRECTION: "Stock correction", ADJUSTMENT: "Stock correction", NEW_PRODUCT: "New product", SCRAP: "Scrap", CATEGORY_SCRAP: "Category scrap" };

export function Approvals() {
  const requests = useCollection("stock-change-requests");
  const petty = useCollection("cash-transactions");
  const products = useCollection("products");
  const warehouses = useCollection("warehouses");
  const [kind, setKind] = useState("");
  const [, setTick] = useState(0);
  const items = [
    ...requests.filter((r) => r.outcome === "PENDING").map((r) => ({ id: r.id, kind: "STOCK", label: KIND_LABEL[String(r.type)] ?? String(r.type), detail: [products.find((p) => p.id === r.productId)?.name ?? r.productName, warehouses.find((w) => w.id === r.warehouseId)?.name, r.qty != null ? `qty ${r.qty}` : null].filter(Boolean).join(" · "), raisedBy: r.raisedBy as string, raisedAt: String(r.date ?? r.createdAt), amount: null as number | null, rec: r })),
    ...petty.filter((t) => t.postingState === "PENDING" && t.direction === "PAYMENT").map((t) => ({ id: t.id, kind: "PETTY_CASH", label: "Petty cash", detail: [t.description, t.reference].filter(Boolean).join(" · "), raisedBy: null as unknown as string, raisedAt: String(t.transactionDate ?? t.createdAt), amount: Math.abs(num(t.amount)), rec: t })),
  ].filter((i) => !kind || i.kind === kind).sort((a, b) => b.raisedAt.localeCompare(a.raisedAt));
  function decide(i: (typeof items)[number], approve: boolean) {
    if (i.kind === "STOCK") {
      const r = i.rec;
      if (approve && r.productId && r.warehouseId && num(r.qty)) adjustStock({ date: today(), productId: String(r.productId), warehouseId: String(r.warehouseId), qty: r.type === "SCRAP" ? -Math.abs(num(r.qty)) : num(r.qty), reason: `Till request — ${KIND_LABEL[String(r.type)] ?? r.type}`, type: r.type === "SCRAP" ? "DAMAGED" : "ADJUSTMENT" });
      updateRecord("stock-change-requests", r.id, { outcome: approve ? "APPROVED" : "REJECTED", decidedBy: BRAND.user.fullName, decidedAt: new Date().toISOString() });
    } else updateRecord("cash-transactions", i.id, { postingState: "POSTED", approvedBy: BRAND.user.fullName });
    setTick((x) => x + 1);
  }
  return (
    <div className="space-y-4">
      <PageHeader title="POS Approvals" subtitle="Everything raised from the tills and waiting on a decision — stock corrections, scrap and petty cash" actions={<>
        <Select value={kind} onChange={setKind} options={[{ value: "", label: "All requests" }, { value: "STOCK", label: "Stock" }, { value: "PETTY_CASH", label: "Petty cash" }]} className="w-40" />
        <button type="button" className={btn.outline} onClick={() => setTick((x) => x + 1)}>Refresh</button>
        <Link href="/inventory/stock-requests" className={btn.outline}>Stock history</Link>
        <Link href="/cash/transactions" className={btn.outline}>Cash register</Link>
      </>} />
      <Card>
        <div className="p-0">{items.length ? (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground"><th className="p-3 font-medium">Raised</th><th className="p-3 font-medium">Type</th><th className="p-3 font-medium">Detail</th><th className="p-3 font-medium">By</th><th className="p-3 text-right font-medium">Amount</th><th className="p-3 text-right font-medium">Action</th></tr></thead>
            <tbody>{items.map((i) => (
              <tr key={`${i.kind}-${i.id}`} className="border-b border-border">
                <td className="p-3">{longDate(i.raisedAt)}</td><td className="p-3"><span className="rounded-md border border-border px-2 py-0.5 text-xs">{i.label}</span></td>
                <td className="max-w-xs truncate p-3" title={i.detail}>{i.detail || "—"}</td><td className="p-3">{i.raisedBy ?? "—"}</td><td className="p-3 text-right">{i.amount != null ? money(i.amount) : "—"}</td>
                <td className="p-3"><div className="flex justify-end gap-2"><button type="button" className={btn.smPrimary} onClick={() => decide(i, true)}><CheckCircle2 /> Approve</button>{i.kind === "STOCK" && <button type="button" className={btn.smOutline} onClick={() => decide(i, false)}><XCircle /> Reject</button>}</div></td>
              </tr>
            ))}</tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center gap-2 p-10 text-center"><CheckCircle2 className="size-8 text-muted-foreground" /><p className="font-medium">Nothing waiting</p><p className="text-sm text-muted-foreground">Requests raised at a till appear here until someone approves them.</p></div>
        )}</div>
      </Card>
    </div>
  );
}

/* ---------- reports ---------- */

const ymd = (d: Date) => d.toISOString().slice(0, 10);
const PRESETS: { key: string; label: string; range: () => [string, string] }[] = [
  { key: "today", label: "Today", range: () => [today(), today()] },
  { key: "yesterday", label: "Yesterday", range: () => { const d = new Date(); d.setDate(d.getDate() - 1); return [ymd(d), ymd(d)]; } },
  { key: "week", label: "Last 7 days", range: () => { const d = new Date(); d.setDate(d.getDate() - 6); return [ymd(d), today()]; } },
  { key: "month", label: "This month", range: () => { const d = new Date(); return [ymd(new Date(d.getFullYear(), d.getMonth(), 1)), today()]; } },
];
const REPORT_PAY: Record<string, string> = { CASH: "Cash", CREDIT_CARD: "Card", DEBIT_CARD: "Card", MOBILE_PAYMENT: "UPI", GIFT_CARD: "Gift card", CHECK: "Cheque", OTHER: "Other", STORE_CREDIT: "Store credit" };

export function PosReports() {
  const sales = useCollection("pos-sales");
  const returns = useCollection("pos-returns");
  const products = useCollection("products");
  const categories = useCollection("product-categories");
  const terminals = useCollection("pos-terminals");
  const moves = useMoves();
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [preset, setPreset] = useState("today");
  const [run, setRun] = useState(0);
  const data = useMemo(() => {
    void run;
    const inRange = (d: unknown) => String(d) >= from && String(d) <= to;
    const all = sales.filter((s) => inRange(s.saleDate));
    const ok = all.filter((s) => s.status !== "VOIDED");
    const voids = all.filter((s) => s.status === "VOIDED");
    const refunds = returns.filter((r) => inRange(r.date));
    const group = (rows: Rec[], key: (s: Rec) => string) => {
      const m = new Map<string, { name: string; sales: number; revenue: number }>();
      for (const s of rows) { const k = key(s); const g = m.get(k) ?? { name: k, sales: 0, revenue: 0 }; g.sales += 1; g.revenue += num(s.totalAmount); m.set(k, g); }
      return [...m.values()];
    };
    const byProduct = new Map<string, { name: string; qty: number; revenue: number; margin: number; category: string }>();
    for (const s of ok) for (const l of (s.lines as Rec[]) ?? []) {
      const p = products.find((x) => x.id === l.productId);
      const k = String(l.productId || l.description);
      const g = byProduct.get(k) ?? { name: String(p?.name ?? l.description), qty: 0, revenue: 0, margin: 0, category: String(categories.find((c) => c.id === p?.categoryId)?.name ?? "Uncategorised") };
      const net = num(l.lineTotal) - num(l.taxAmount);
      g.qty += num(l.quantity); g.revenue += net; g.margin += net - num(l.cost); byProduct.set(k, g);
    }
    const prod = [...byProduct.values()];
    const byCat = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const p of prod) { const g = byCat.get(p.category) ?? { name: p.category, qty: 0, revenue: 0 }; g.qty += p.qty; g.revenue += p.revenue; byCat.set(p.category, g); }
    const byPay = new Map<string, { method: string; count: number; amount: number }>();
    for (const s of ok) for (const p of (s.payments as Rec[]) ?? []) { const k = REPORT_PAY[String(p.method)] ?? String(p.method); const g = byPay.get(k) ?? { method: k, count: 0, amount: 0 }; g.count += 1; g.amount += num(p.amount) - (p.method === "CASH" ? num(s.changeGiven) : 0); byPay.set(k, g); }
    const scrap = moves.filter((m) => (m.type === "DAMAGED" || m.type === "WRITE_OFF") && inRange(m.date)).map((m) => ({ name: String(products.find((p) => p.id === m.productId)?.name ?? "—"), reason: String(m.reference ?? "").split(" · ")[1] ?? "", qty: Math.abs(num(m.qty)), value: Math.abs(num(m.value)) }));
    return {
      totals: { sales: ok.length, revenue: ok.reduce((a, s) => a + num(s.totalAmount), 0), tax: ok.reduce((a, s) => a + num(s.taxAmount), 0), discount: ok.reduce((a, s) => a + num(s.discountAmount), 0), margin: prod.reduce((a, p) => a + p.margin, 0), voids: { count: voids.length, amount: voids.reduce((a, s) => a + num(s.totalAmount), 0) }, refunds: { count: refunds.length, amount: refunds.reduce((a, r) => a + num(r.totalRefund), 0) } },
      byBranch: group(ok, (s) => branchName(terminals.find((t) => t.id === s.terminalId)?.orgUnitId) === "—" ? "Company" : branchName(terminals.find((t) => t.id === s.terminalId)?.orgUnitId)),
      byStaff: group(ok, (s) => String(s.cashierName || "—")),
      fast: [...prod].sort((a, b) => b.qty - a.qty), slow: [...prod].sort((a, b) => a.qty - b.qty), top: [...prod].sort((a, b) => b.revenue - a.revenue),
      byCat: [...byCat.values()], byPay: [...byPay.values()],
      byHour: group(ok, (s) => `${String(new Date(String(s.createdAt)).getHours()).padStart(2, "0")}:00`).sort((a, b) => a.name.localeCompare(b.name)).map((g) => ({ hour: g.name, sales: g.sales, revenue: g.revenue })),
      scrap,
    };
  }, [sales, returns, products, categories, terminals, moves, from, to, run]);
  const t = data.totals;
  return (
    <div className="space-y-4">
      <PageHeader title="POS & Branch Report" subtitle="Takings, fast and slow movers, staff, branch, tender and hour" />
      <div className="flex flex-wrap gap-2">{PRESETS.map((p) => <button key={p.key} type="button" className={preset === p.key ? btn.smPrimary : btn.smOutline} onClick={() => { const [a, b] = p.range(); setPreset(p.key); setFrom(a); setTo(b); }}>{p.label}</button>)}</div>
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1"><Label className="text-xs">From</Label><DateInput value={from} onChange={(v) => { setPreset(""); setFrom(v); }} className="w-44" /></div>
        <div className="space-y-1"><Label className="text-xs">To</Label><DateInput value={to} onChange={(v) => { setPreset(""); setTo(v); }} className="w-44" /></div>
        <button type="button" className={btn.outline} onClick={() => setRun((x) => x + 1)}>Run</button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {([["Sales", String(t.sales)], ["Revenue", money(t.revenue)], ["Tax", money(t.tax)], ["Discounts", money(t.discount)], ["Margin", money(t.margin)], ["Voids", `${t.voids.count} · ${money(t.voids.amount)}`], ["Refunds", `${t.refunds.count} · ${money(t.refunds.amount)}`]] as const).map(([l, v]) => (
          <Card key={l}><div className="p-3"><div className="text-xs text-muted-foreground">{l}</div><div className="text-lg font-semibold tabular-nums">{v}</div></div></Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportTable title="By branch" rows={data.byBranch} cols={["name", "sales", "revenue"]} />
        <ReportTable title="By staff" rows={data.byStaff} cols={["name", "sales", "revenue"]} />
        <ReportTable title="Fast movers — most sold" rows={data.fast} cols={["name", "qty", "revenue", "margin"]} />
        <ReportTable title="Slow movers — least sold" rows={data.slow} cols={["name", "qty", "revenue", "margin"]} />
        <ReportTable title="Highest earning — by value" rows={data.top} cols={["name", "qty", "revenue", "margin"]} />
        <ReportTable title="By category" rows={data.byCat} cols={["name", "qty", "revenue"]} />
        <ReportTable title="By payment" rows={data.byPay} cols={["method", "count", "amount"]} />
        <ReportTable title="By hour" rows={data.byHour} cols={["hour", "sales", "revenue"]} />
        <ReportTable title="Scrapped stock" rows={data.scrap} cols={["name", "reason", "qty", "value"]} />
      </div>
    </div>
  );
}

const MONEY_COLS = new Set(["revenue", "margin", "amount", "cost", "value"]);
function ReportTable({ title, rows, cols }: { title: string; rows: object[]; cols: string[] }) {
  const r = rows as Record<string, unknown>[];
  return (
    <Card>
      <div className="flex items-center justify-between p-5 pb-2">
        <CardTitle>{title}</CardTitle>
        <ExportMenu disabled={!r.length} onPick={(kind) => { const rows = r.map((x) => cols.map((c) => (MONEY_COLS.has(c) ? num(x[c]).toFixed(3) : String(x[c] ?? "")))); if (kind === "csv") downloadFile(`${title}.csv`, toCSV(cols, rows), "text/csv"); else downloadFile(`${title}.xls`, toExcelHTML(cols, rows), "application/vnd.ms-excel"); }} />
      </div>
      <div className="p-5 pt-0">{r.length === 0 ? <div className="py-6 text-center text-sm text-muted-foreground">No data.</div> : (
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-border text-left text-muted-foreground">{cols.map((c) => <th key={c} className={cn("py-1.5 font-medium", c !== cols[0] && "text-right")}>{c}</th>)}</tr></thead>
          <tbody>{r.slice(0, 50).map((x, i) => <tr key={i} className="border-b border-border">{cols.map((c, j) => <td key={c} className={cn("py-1.5", j > 0 && "text-right tabular-nums")}>{MONEY_COLS.has(c) ? money(num(x[c])) : typeof x[c] === "number" ? Math.round(num(x[c]) * 1000) / 1000 : String(x[c] ?? "")}</td>)}</tr>)}</tbody></table></div>
      )}</div>
    </Card>
  );
}

/* ---------- kitchen display ---------- */

const KDS = [
  { key: "NEW", label: "New", next: "PREPARING", nextLabel: "Start", tone: "border-t-red-400" },
  { key: "PREPARING", label: "Preparing", next: "READY", nextLabel: "Ready", tone: "border-t-amber-400" },
  { key: "READY", label: "Ready", next: "SERVED", nextLabel: "Served", tone: "border-t-emerald-400" },
];
const ago = (iso: unknown) => { const m = Math.floor((Date.now() - new Date(String(iso)).getTime()) / 60000); return m < 1 ? "just now" : `${m}m`; };

export function Kitchen() {
  const router = useRouter();
  const tickets = useCollection("kitchen-tickets").filter((t) => t.status !== "SERVED");
  const [, setTick] = useState(0);
  return (
    <div className="space-y-4">
      <PageHeader title="Kitchen Display" subtitle="Live tickets — bump each order as it progresses" actions={<>
        <button type="button" className={btn.outline} onClick={() => router.push("/pos/tables")}><LayoutGrid /> Floor</button>
        <button type="button" className={btn.outline} onClick={() => setTick((x) => x + 1)}><RefreshCw /> Refresh</button>
      </>} />
      {tickets.length === 0 ? <EmptyCard>No active tickets.</EmptyCard> : (
        <div className="grid gap-4 md:grid-cols-3">{KDS.map((col) => {
          const list = tickets.filter((t) => t.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center gap-2"><h3 className="font-semibold">{col.label}</h3><span className="rounded-md bg-muted px-2 text-xs">{list.length}</span></div>
              {list.map((t) => (
                <Card key={t.id} className={cn("border-t-4", col.tone)}>
                  <div className="space-y-2 p-4">
                    <div className="flex justify-between"><div className="font-semibold">#{String(t.ticketNumber)} · {String(t.sourceLabel || t.orderType)}</div><span className="text-xs text-muted-foreground">{ago(t.createdAt)}</span></div>
                    <ul className="space-y-1 text-sm">{((t.lines as Rec[]) ?? []).map((l) => <li key={l.id} className="flex flex-col"><span><span className="font-semibold">{num(l.quantity)}×</span> {String(l.description)}</span>{l.modifiers ? <span className="pl-5 text-xs text-muted-foreground">{String(l.modifiers)}</span> : null}</li>)}</ul>
                    {col.next && <button type="button" className={cn(btn.smPrimary, "w-full")} onClick={() => updateRecord("kitchen-tickets", t.id, { status: col.next })}>{col.nextLabel}</button>}
                  </div>
                </Card>
              ))}
            </div>
          );
        })}</div>
      )}
    </div>
  );
}

/* ---------- floor plan ---------- */

const TABLE_TONE: Record<string, string> = { FREE: "border-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40", OCCUPIED: "border-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40", RESERVED: "border-blue-300 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40" };
const TABLE_LABEL: Record<string, string> = { FREE: "Free", OCCUPIED: "Occupied", RESERVED: "Reserved" };

export function FloorPlan() {
  const router = useRouter();
  const tables = useCollection("pos-tables");
  const [manage, setManage] = useState(false);
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ name: "", section: "", seats: "2" });
  const [error, setError] = useState("");
  const sections = new Map<string, Rec[]>();
  for (const t of tables) { const k = String(t.section || "Floor"); sections.set(k, [...(sections.get(k) ?? []), t]); }
  function open(t: Rec) {
    if (t.status === "OCCUPIED" && t.activeTabId) return router.push(`/pos/register?tab=${t.activeTabId}`);
    const tab = seatTable(t.id);
    router.push(`/pos/register?tab=${tab.id}`);
  }
  function add() {
    if (!f.name.trim()) return setError("Name is required");
    createRecord("pos-tables", { name: f.name.trim(), section: f.section.trim() || undefined, seats: Number(f.seats) || 2, status: "FREE" });
    setAdding(false); setF({ name: "", section: "", seats: "2" }); setError("");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Floor Plan" subtitle="Tap a table to open or resume its check" actions={<>
        <button type="button" className={btn.outline} onClick={() => router.push("/pos/kitchen")}><ChefHat /> Kitchen</button>
        <button type="button" className={manage ? btn.primary : btn.outline} onClick={() => setManage((m) => !m)}><Settings2 /> {manage ? "Done" : "Manage"}</button>
        {manage && <button type="button" className={btn.primary} onClick={() => setAdding(true)}><Plus /> Add table</button>}
      </>} />
      {tables.length === 0 ? <EmptyCard>No tables yet. Click <span className="font-medium">Manage → Add table</span> to lay out your floor.</EmptyCard> : (
        <div className="space-y-6">{[...sections].map(([name, list]) => (
          <div key={name}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{name}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">{list.map((t) => (
              <div key={t.id} className="relative">
                <button type="button" onClick={() => open(t)} className={cn("flex h-24 w-full flex-col items-center justify-center rounded-lg border-2 transition-colors", TABLE_TONE[String(t.status)] ?? TABLE_TONE.FREE)}>
                  <div className="text-lg font-bold">{String(t.name)}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" /> {num(t.seats)}</div>
                  <div className="text-xs font-medium">{TABLE_LABEL[String(t.status)]}</div>
                </button>
                <div className="absolute right-1 top-1">
                  {manage ? <button type="button" aria-label={`Remove ${t.name}`} className={cn(btn.icon, "size-6")} onClick={() => deleteRecord("pos-tables", t.id)}><Trash2 className="!size-3.5" /></button>
                    : t.status === "OCCUPIED" ? <button type="button" className="rounded px-1.5 text-[11px] hover:bg-background" onClick={() => updateRecord("pos-tables", t.id, { status: "FREE", activeTabId: null })}>Release</button>
                    : <button type="button" className="rounded px-1.5 text-[11px] hover:bg-background" onClick={() => updateRecord("pos-tables", t.id, { status: t.status === "RESERVED" ? "FREE" : "RESERVED" })}>{t.status === "RESERVED" ? "Unreserve" : "Reserve"}</button>}
                </div>
              </div>
            ))}</div>
          </div>
        ))}</div>
      )}
      <Dialog open={adding} onClose={() => setAdding(false)} title="Add table">
        <div className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="tb-name">Name</Label><input id="tb-name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="T1" className={inputCls} /></div>
          <div className="space-y-1.5"><Label htmlFor="tb-sec">Section (optional)</Label><input id="tb-sec" value={f.section} onChange={(e) => setF({ ...f, section: e.target.value })} placeholder="Main / Patio / Bar" className={inputCls} /></div>
          <div className="space-y-1.5"><Label htmlFor="tb-seats">Seats</Label><input id="tb-seats" type="number" min={1} value={f.seats} onChange={(e) => setF({ ...f, seats: e.target.value })} className={inputCls} /></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setAdding(false)}>Cancel</button><button type="button" className={btn.primary} onClick={add}>Add</button></div>
      </Dialog>
    </div>
  );
}

function ExportMenu({ disabled, onPick }: { disabled: boolean; onPick: (kind: "csv" | "xls") => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const item = "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent";
  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cn(btn.ghost, "h-8 px-2 text-xs text-muted-foreground")}><Download /> Export <ChevronDown /></button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-40 rounded-md border border-border bg-popover p-1 shadow-md">
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); onPick("csv"); }}>Download CSV</button>
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); onPick("xls"); }}>Download Excel</button>
        </div>
      )}
    </div>
  );
}
