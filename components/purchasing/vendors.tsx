"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, History, MapPin, Plus, Trash2 } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { billOpen, billOutstanding, type PoLine } from "@/lib/purchases";
import { cn } from "@/lib/utils";
import { Card, DataTable, DateInput, Dialog, Field, PageHeader, SearchInput, Select, SidePanel, btn, inputCls, longDate, money, num, type Column } from "@/components/accounting/kit";
import { NumberBanner, Opt, Req, Section, StatusBadge } from "@/components/sales/doc-kit";
import { CURRENCIES } from "@/components/sales/invoices";
import { CountedTextarea, ProductPicker, VendorPicker, subOf, useVendors } from "./kit";

const BASE = "/ap/vendors";

export function Vendors() {
  const router = useRouter();
  const sub = subOf(usePathname(), BASE);
  const vendors = useVendors();
  const bills = useCollection("bills");
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number; row: Rec } | null>(null);
  const close = () => router.push(BASE);

  const balances = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bills) if (billOpen(b)) m.set(String(b.vendor), (m.get(String(b.vendor)) ?? 0) + billOutstanding(b));
    return m;
  }, [bills]);

  const rows = [...vendors]
    .sort((a, b) => String(a.number).localeCompare(String(b.number)))
    .filter((v) => !q.trim() || `${v.number} ${v.name} ${v.email} ${v.phone} ${v.taxId}`.toLowerCase().includes(q.trim().toLowerCase()));

  function remove(v: Rec) {
    if (bills.some((b) => b.vendor === v.name) || readCollection("purchase-orders").some((p) => p.vendor === v.name)) return alert(`${v.name} has bills or orders, so it can't be deleted. Set the status to INACTIVE instead.`);
    if (confirm(`Delete vendor ${v.name}?`)) deleteRecord("vendors", v.id);
  }

  const detail = sub && sub !== "new" ? vendors.find((v) => v.id === sub) : undefined;

  return (
    <div className="space-y-4" onClick={() => setMenu(null)}>
      <PageHeader title="Vendors" subtitle="Manage vendor accounts" actions={<Link href={`${BASE}/new`} className={btn.primary}><Plus /> New Vendor</Link>} />
      <SearchInput value={q} onChange={setQ} placeholder="Search vendors..." />
      <p className="text-xs text-muted-foreground">Click any field to edit it inline · double-click a row to open · right-click for more.</p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              {["Number", "Name", "Email", "Phone", "Tax ID", "Terms (days)", "Status", "Balance"].map((h) => (
                <th key={h} className={cn("h-10 px-2 font-medium", h === "Terms (days)" && "w-24")}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((v) => (
              <tr
                key={v.id}
                onDoubleClick={() => router.push(`${BASE}/${v.id}`)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenu({ x: e.clientX, y: e.clientY, row: v });
                }}
                className="border-b border-border/60 transition-colors hover:bg-muted/50"
              >
                <td className="p-2 font-mono text-sm">{String(v.number)}</td>
                <ClickEditCell row={v} field="name" className="font-medium" />
                <ClickEditCell row={v} field="email" />
                <ClickEditCell row={v} field="phone" />
                <ClickEditCell row={v} field="taxId" />
                <ClickEditCell row={v} field="terms" numeric />
                <td className="p-2">{v.frozen ? <StatusBadge status="FROZEN" /> : <StatusBadge status={v.status} />}</td>
                <td className="p-2 tabular-nums">{money(balances.get(String(v.name)) ?? 0)}</td>
              </tr>
            ))}
            <QuickAddVendor />
          </tbody>
        </table>
      </div>

      {menu && (
        <div role="menu" style={{ top: menu.y, left: menu.x }} className="fixed z-50 min-w-40 rounded-md border border-border bg-popover p-1 text-sm shadow-md" onClick={(e) => e.stopPropagation()}>
          {[
            { label: "Open", run: () => router.push(`${BASE}/${menu.row.id}`) },
            { label: "New bill", run: () => router.push(`/ap/bills/new?vendor=${encodeURIComponent(String(menu.row.name))}`) },
            { label: "New purchase order", run: () => router.push(`/inventory/purchase-orders/new?vendor=${encodeURIComponent(String(menu.row.name))}`) },
            { label: "Record payment", run: () => router.push(`/ap/payments/new?vendor=${encodeURIComponent(String(menu.row.name))}`) },
            { label: menu.row.status === "INACTIVE" ? "Mark active" : "Mark inactive", run: () => updateRecord("vendors", menu.row.id, { status: menu.row.status === "INACTIVE" ? "ACTIVE" : "INACTIVE" }) },
            { label: "Delete", run: () => remove(menu.row), danger: true },
          ].map((it) => (
            <button key={it.label} type="button" role="menuitem" onClick={() => { setMenu(null); it.run(); }} className={cn("flex w-full rounded-sm px-2 py-1.5 text-left hover:bg-accent", it.danger && "text-destructive")}>
              {it.label}
            </button>
          ))}
        </div>
      )}

      {sub === "new" && (
        <SidePanel onClose={close}>
          <VendorForm onDone={close} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <VendorForm key={detail.id} record={detail} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

// Single click edits the field in place; Enter/blur saves, Escape cancels.
function ClickEditCell({ row, field, numeric, className }: { row: Rec; field: string; numeric?: boolean; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const save = () => {
    const v = value.trim();
    if (field === "name" && !v) return setEditing(false);
    updateRecord("vendors", row.id, { [field]: numeric ? Math.max(0, Math.floor(Number(v) || 0)) : v });
    setEditing(false);
  };
  return (
    <td
      className={cn("cursor-text p-2", className)}
      onClick={(e) => {
        e.stopPropagation();
        if (editing) return;
        setValue(String(row[field] ?? ""));
        setEditing(true);
      }}
      onDoubleClick={(e) => editing && e.stopPropagation()}
    >
      {editing ? (
        <input
          autoFocus
          aria-label={`Edit ${field}`}
          type={numeric ? "number" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className={cn(inputCls, "h-7")}
        />
      ) : (
        <span className={cn(!row[field] && row[field] !== 0 && "text-muted-foreground")}>{String(row[field] ?? "") || "—"}</span>
      )}
    </td>
  );
}

function QuickAddVendor() {
  const [f, setF] = useState({ name: "", email: "", phone: "", terms: "30" });
  const add = () => {
    if (!f.name.trim()) return;
    createRecord("vendors", { number: nextNumber("vendors", "V"), name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), terms: Math.floor(Number(f.terms) || 0), status: "ACTIVE" });
    setF({ name: "", email: "", phone: "", terms: "30" });
  };
  const cellInput = "h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring";
  const onKey = (e: React.KeyboardEvent) => e.key === "Enter" && add();
  return (
    <tr className="bg-muted/30">
      <td className="p-2 text-center text-muted-foreground"><Plus className="h-3.5 w-3.5" /></td>
      <td className="p-1"><input aria-label="New vendor name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={onKey} placeholder="Add a vendor..." className={cellInput} /></td>
      <td className="p-1"><input aria-label="New vendor email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} onKeyDown={onKey} placeholder="Email" className={cellInput} /></td>
      <td className="p-1"><input aria-label="New vendor phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} onKeyDown={onKey} placeholder="Phone" className={cellInput} /></td>
      <td />
      <td className="p-1"><input aria-label="New vendor terms" type="number" min="0" value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} onKeyDown={onKey} className={cn(cellInput, "text-center")} /></td>
      <td className="p-1">
        <button type="button" aria-label="Add vendor" disabled={!f.name.trim()} onClick={add} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          <Check className="h-3.5 w-3.5" />
        </button>
      </td>
      <td />
    </tr>
  );
}

type Address = { label: string; line1: string; city: string; postal: string };
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];

function VendorForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const vendors = useVendors();
  const [preview] = useState(() => nextNumber("vendors", "V"));
  const [f, setF] = useState(() => ({
    taxId: String(record?.taxId ?? ""), name: String(record?.name ?? ""), email: String(record?.email ?? ""), phone: String(record?.phone ?? ""), mobile: String(record?.mobile ?? ""),
    city: String(record?.city ?? ""), pincode: String(record?.pincode ?? ""), terms: String(record?.terms ?? "30"), status: String(record?.status ?? "ACTIVE"), frozen: Boolean(record?.frozen), notes: String(record?.notes ?? ""),
    bankName: String(record?.bankName ?? ""), iban: String(record?.iban ?? ""), swift: String(record?.swift ?? ""), accountNumber: String(record?.accountNumber ?? ""), routing: String(record?.routing ?? ""),
  }));
  const [addresses, setAddresses] = useState<Address[]>((record?.addresses as Address[]) ?? []);
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const valid = f.name.trim().length > 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setError("Name is required.");
    if (vendors.some((v) => v.id !== record?.id && String(v.name).toLowerCase() === f.name.trim().toLowerCase())) return setError(`A vendor named ${f.name.trim()} already exists.`);
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setError("Email doesn't look right.");
    const data = { ...f, name: f.name.trim(), terms: Math.max(0, Math.floor(Number(f.terms) || 0)), addresses: addresses.filter((a) => a.line1.trim()) };
    if (record) {
      updateRecord("vendors", record.id, data);
      // Documents reference vendors by name; keep them attached after a rename.
      if (record.name !== data.name)
        for (const c of ["bills", "purchase-orders", "grns", "purchase-returns", "recurring-bills", "ap-payments", "debit-notes", "vendor-prices", "purchase-agreements"])
          for (const d of readCollection(c)) if (d.vendor === record.name) updateRecord(c, d.id, { vendor: data.name });
    } else createRecord("vendors", { ...data, number: nextNumber("vendors", "V") });
    onDone();
  }

  const input = (key: keyof typeof f, lab: React.ReactNode, ph = "", type = "text") => (
    <Field label={lab} htmlFor={`v-${key}`}>
      <input id={`v-${key}`} type={type} value={String(f[key])} onChange={(e) => set({ [key]: e.target.value } as Partial<typeof f>)} placeholder={ph} className={inputCls} />
    </Field>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? `Vendor: ${record.name}` : "New Vendor"}</h1>
      <Section title="Vendor Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberBanner compact label="Vendor #" value={String(record?.number ?? preview)} saved={!!record} />
          {input("taxId", <>Tax ID<Opt /></>)}
          {input("name", <>Name<Req /></>, "e.g. Acme Supplies")}
          {input("email", <>Email<Opt /></>, "e.g. accounts@supplier.com", "email")}
          {input("phone", <>Phone<Opt /></>, "e.g. +91 484 123 4567")}
          {input("mobile", <>Mobile Number<Opt /></>, "e.g. +91 98765 43210")}
          {input("city", <>City<Opt /></>, "e.g. Kozhikode")}
          {input("pincode", <>Pincode<Opt /></>, "e.g. 673001")}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {input("terms", <>Payment Terms (days)<Opt /></>, "", "number")}
          <Field label={<>Status<Opt /></>}><Select ariaLabel="Status" value={f.status} onChange={(v) => set({ status: v })} options={STATUSES} /></Field>
          <Field label={<>Freeze A/c<Opt /></>}>
            <label className="flex h-9 items-center gap-2 text-sm">
              <input type="checkbox" checked={f.frozen} onChange={(e) => set({ frozen: e.target.checked })} className="h-4 w-4 accent-primary" /> Freeze
            </label>
          </Field>
        </div>
        <Field label={<>Notes<Opt /></>}><CountedTextarea ariaLabel="Notes" value={f.notes} onChange={(v) => set({ notes: v })} /></Field>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Bank details <span className="font-normal text-muted-foreground">(used in payment-run files: SEPA / NACHA / bank CSV)</span></p>
          <div className="grid gap-3 sm:grid-cols-2">
            {input("bankName", <>Bank name<Opt /></>, "e.g. State Bank of India")}
            {input("iban", <>IBAN<Opt /></>, "e.g. DE89370400440532013000")}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {input("swift", <>SWIFT / BIC<Opt /></>, "e.g. SBININBB")}
            {input("accountNumber", <>Account number<Opt /></>, "e.g. 12345678901234")}
            {input("routing", <>Routing / IFSC<Opt /></>, "e.g. SBIN0001234")}
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium"><MapPin className="h-3.5 w-3.5" /> Addresses</p>
            <button type="button" onClick={() => setAddresses([...addresses, { label: "", line1: "", city: "", postal: "" }])} className={btn.smOutline}><Plus /> Add address</button>
          </div>
          {addresses.length === 0 && <p className="text-sm text-muted-foreground">No saved addresses. Add ship-to or location addresses to pick them on invoices and delivery notes.</p>}
          {addresses.map((a, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_1fr_1fr_auto]">
              {(["label", "line1", "city", "postal"] as const).map((k) => (
                <input key={k} aria-label={k} value={a[k]} onChange={(e) => setAddresses(addresses.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))} placeholder={{ label: "Label", line1: "Address", city: "City", postal: "Postal code" }[k]} className={inputCls} />
              ))}
              <button type="button" aria-label="Remove address" onClick={() => setAddresses(addresses.filter((_, j) => j !== i))} className={btn.icon}><Trash2 /></button>
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={!valid} className={btn.primary}>{record ? "Save Changes" : "Create Vendor"}</button>
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        </div>
      </Section>
    </form>
  );
}

/* ---------- vendor prices ---------- */

export function VendorPrices() {
  const prices = useCollection("vendor-prices");
  const vendors = useVendors();
  const products = useCollection("products");
  const [vendor, setVendor] = useState("");
  const [product, setProduct] = useState("");
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const productName = (id: unknown) => String(products.find((p) => p.id === id)?.name ?? "—");
  const rows = prices.filter((p) => (!vendor || p.vendor === vendor) && (!product || p.productId === product));

  // Latest unit price per vendor + product from purchase orders becomes a vendor price.
  function seed() {
    const latest = new Map<string, { vendor: string; productId: string; price: number; date: string }>();
    for (const po of readCollection("purchase-orders").filter((p) => p.status !== "CANCELLED")) {
      for (const l of (po.lines as PoLine[]) ?? []) {
        const k = `${po.vendor}|${l.productId}`;
        if (!latest.has(k) || String(po.date) > latest.get(k)!.date) latest.set(k, { vendor: String(po.vendor), productId: l.productId, price: num(l.unitPrice), date: String(po.date) });
      }
    }
    let added = 0;
    for (const x of latest.values()) {
      if (prices.some((p) => p.vendor === x.vendor && p.productId === x.productId && !p.currency)) continue;
      createRecord("vendor-prices", { vendor: x.vendor, productId: x.productId, price: x.price, minQty: 0, validFrom: x.date, source: "PO history" });
      added++;
    }
    setNotice(added ? `Added ${added} price(s) from purchase-order history.` : "No new prices — every vendor/product pair from your POs already has one.");
  }

  const columns: Column<Rec>[] = [
    { key: "vendor", header: "Vendor", cell: (p) => <span className="font-medium">{String(p.vendor)}</span> },
    { key: "product", header: "Product", cell: (p) => productName(p.productId) },
    { key: "price", header: "Price", cell: (p) => (p.currency ? `${p.currency} ${num(p.price).toFixed(2)}` : money(num(p.price))) },
    { key: "min", header: "Min qty", cell: (p) => num(p.minQty) },
    { key: "valid", header: "Valid", cell: (p) => `${p.validFrom ? longDate(p.validFrom) : "Any time"} – ${p.validTo ? longDate(p.validTo) : "open"}` },
    { key: "code", header: "Vendor code", cell: (p) => String(p.vendorCode || "—") },
    { key: "lead", header: "Lead time", cell: (p) => (p.leadTime ? `${num(p.leadTime)} days` : "—") },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Vendor Prices"
        subtitle="Per-vendor purchase prices with validity windows and quantity breaks — used to default PO line prices."
        actions={
          <>
            <button type="button" onClick={seed} className={btn.outline}><History /> Seed from PO history</button>
            <button type="button" onClick={() => setOpen(true)} className={btn.primary}><Plus /> Add price</button>
          </>
        }
      />
      <div className="flex flex-wrap gap-2">
        <Select ariaLabel="Vendor filter" size="sm" value={vendor} onChange={setVendor} placeholder="All vendors" options={vendors.map((v) => String(v.name))} className="w-64" />
        <Select ariaLabel="Product filter" size="sm" value={product} onChange={setProduct} placeholder="All products" options={products.map((p) => ({ value: p.id, label: String(p.name) }))} className="w-64" />
      </div>
      {notice && <p className="text-sm text-muted-foreground">{notice}</p>}
      {rows.length === 0 ? (
        <Card><p className="p-6 py-10 text-center text-sm text-muted-foreground">No vendor prices yet. Add one or seed from PO history.</p></Card>
      ) : (
        <DataTable columns={columns} rows={rows} menu={(p) => [{ label: "Delete", destructive: true, onSelect: () => deleteRecord("vendor-prices", p.id) }]} />
      )}
      {open && <PriceDialog onClose={() => setOpen(false)} />}
    </div>
  );
}

function PriceDialog({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({ vendor: "", productId: "", price: "", minQty: "0", validFrom: "", validTo: "", vendorCode: "", leadTime: "", currency: "" });
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));
  const valid = f.vendor && f.productId && num(f.price) > 0 && (!f.validFrom || !f.validTo || f.validTo >= f.validFrom);
  return (
    <Dialog open onClose={onClose} title="New vendor price">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={<>Vendor<Req /></>}><VendorPicker value={f.vendor} onChange={(v) => set({ vendor: v })} placeholder="Select…" /></Field>
        <Field label={<>Product<Req /></>}><ProductPicker size="md" value={f.productId} onChange={(id) => set({ productId: id })} placeholder="Select…" /></Field>
        <Field label={<>Price<Req /></>} htmlFor="vp-price"><input id="vp-price" type="number" min="0" step="0.01" value={f.price} onChange={(e) => set({ price: e.target.value })} className={inputCls} /></Field>
        <Field label={<>Min qty <span className="font-normal text-muted-foreground">(quantity break)</span></>} htmlFor="vp-min"><input id="vp-min" type="number" min="0" value={f.minQty} onChange={(e) => set({ minQty: e.target.value })} className={inputCls} /></Field>
        <Field label="Valid from"><DateInput value={f.validFrom} onChange={(v) => set({ validFrom: v })} /></Field>
        <Field label="Valid to"><DateInput value={f.validTo} onChange={(v) => set({ validTo: v })} /></Field>
        <Field label="Vendor product code" htmlFor="vp-code"><input id="vp-code" value={f.vendorCode} onChange={(e) => set({ vendorCode: e.target.value })} className={inputCls} /></Field>
        <Field label="Lead time (days)" htmlFor="vp-lead"><input id="vp-lead" type="number" min="0" value={f.leadTime} onChange={(e) => set({ leadTime: e.target.value })} className={inputCls} /></Field>
        <Field label="Currency" hint="Only base-currency prices auto-fill purchase orders — a foreign price is recorded but not applied.">
          <Select value={f.currency} onChange={(v) => set({ currency: v === "USD" ? "" : v })} placeholder="Company base currency" options={CURRENCIES.map((c) => ({ value: c.value, label: c.label.replace(" (Base Currency)", " — US Dollar").replace(" - ", " — ") }))} />
        </Field>
      </div>
      <div className="flex justify-end">
        <button type="button" disabled={!valid} onClick={() => { createRecord("vendor-prices", { ...f, price: num(f.price), minQty: num(f.minQty), leadTime: num(f.leadTime) }); onClose(); }} className={btn.primary}>Add</button>
      </div>
    </Dialog>
  );
}

