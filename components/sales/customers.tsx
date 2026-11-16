"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Check, ChevronDown, FileText, MapPin, Plus, Trash2, Upload } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { outstanding, statusFor } from "@/lib/sales";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";
import { Card, Field, PageHeader, SearchInput, Select, SidePanel, btn, downloadFile, inputCls, money, num, textareaCls, toCSV, toExcelHTML } from "@/components/accounting/kit";
import { NumberBanner, Opt, Req, Section, StatusBadge, useCustomers } from "./doc-kit";

const BASE = "/ar/customers";
const STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"];
type Address = { line1: string; line2: string; city: string; state: string; postal: string };
const blankAddress = (): Address => ({ line1: "", line2: "", city: "", state: "", postal: "" });

export function Customers() {
  const router = useRouter();
  const sub = usePathname().slice(BASE.length).replace(/^\//, "");
  const customers = useCustomers();
  const invoices = useCollection("invoices");
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState<{ x: number; y: number; row: Rec } | null>(null);
  const close = () => router.push(BASE);

  const stats = useMemo(() => {
    const m = new Map<string, { balance: number; open: number }>();
    for (const i of invoices) {
      if (!["UNPAID", "PARTIAL"].includes(statusFor(i))) continue;
      const s = m.get(String(i.customer)) ?? { balance: 0, open: 0 };
      m.set(String(i.customer), { balance: s.balance + outstanding(i), open: s.open + 1 });
    }
    return m;
  }, [invoices]);

  const rows = [...customers]
    .sort((a, b) => String(a.number).localeCompare(String(b.number)))
    .filter((c) => !q.trim() || `${c.number} ${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(q.trim().toLowerCase()));

  function exportRows(kind: "csv" | "xls") {
    const headers = ["Number", "Name", "Email", "Phone", "Mobile", "Tax ID", "Terms (days)", "Status", "Balance"];
    const data = rows.map((c) => [String(c.number ?? ""), String(c.name ?? ""), String(c.email ?? ""), String(c.phone ?? ""), String(c.mobile ?? ""), String(c.taxId ?? ""), num(c.terms), String(c.status ?? ""), stats.get(String(c.name))?.balance ?? 0]);
    if (kind === "csv") downloadFile("customers.csv", toCSV(headers, data), "text/csv");
    else downloadFile("customers.xls", toExcelHTML(headers, data), "application/vnd.ms-excel");
  }

  function remove(c: Rec) {
    if (invoices.some((i) => i.customer === c.name)) return alert(`${c.name} has invoices, so it can't be deleted. Set the status to INACTIVE instead.`);
    if (confirm(`Delete customer ${c.name}?`)) deleteRecord("customers", c.id);
  }

  const detail = sub && sub !== "new" && sub !== "import" ? customers.find((c) => c.id === sub) : undefined;

  return (
    <div className="space-y-4" onClick={() => setMenu(null)}>
      <PageHeader
        title="Customers"
        subtitle="Manage customer accounts"
        actions={
          <>
            <DownloadMenu onCSV={() => exportRows("csv")} onExcel={() => exportRows("xls")} />
            <Link href={`${BASE}/import`} className={btn.outline}>
              <Upload /> Import
            </Link>
            <Link href={`${BASE}/new`} className={btn.outline}>
              <Plus /> New Customer
            </Link>
          </>
        }
      />
      <SearchInput value={q} onChange={setQ} placeholder="Search customers..." />
      <p className="text-xs text-muted-foreground">Click a row to open it · double-click a field to edit it inline · right-click for more.</p>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[48rem] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              {["Number", "Name", "Email", "Phone", "Terms (days)", "Status", "Balance", "Open Inv."].map((h) => (
                <th key={h} className={cn("h-10 px-2 font-medium", h === "Terms (days)" && "w-16 text-center", h === "Open Inv." && "w-16 text-center")}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const s = stats.get(String(c.name));
              return (
                <tr
                  key={c.id}
                  onClick={() => router.push(`${BASE}/${c.id}`)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenu({ x: e.clientX, y: e.clientY, row: c });
                  }}
                  className="cursor-pointer border-b border-border/60 transition-colors hover:bg-muted/50"
                >
                  <td className="p-2 font-mono text-sm">{String(c.number)}</td>
                  <InlineCell row={c} field="name" className="font-medium" />
                  <InlineCell row={c} field="email" />
                  <InlineCell row={c} field="phone" />
                  <InlineCell row={c} field="terms" numeric className="text-center" />
                  <td className="p-2">{c.frozen ? <StatusBadge status="FROZEN" /> : <StatusBadge status={c.status} />}</td>
                  <td className="p-2 tabular-nums">{money(s?.balance ?? 0)}</td>
                  <td className="p-2 text-center">{s?.open ?? 0}</td>
                </tr>
              );
            })}
            <QuickAddRow />
          </tbody>
        </table>
      </div>

      {menu && (
        <div role="menu" style={{ top: menu.y, left: menu.x }} className="fixed z-50 min-w-40 rounded-md border border-border bg-popover p-1 text-sm shadow-md" onClick={(e) => e.stopPropagation()}>
          {[
            { label: "Open", run: () => router.push(`${BASE}/${menu.row.id}`) },
            { label: "New invoice", run: () => router.push(`/ar/invoices/new?customer=${encodeURIComponent(String(menu.row.name))}`) },
            { label: "Record payment", run: () => router.push(`/ar/payments/new?customer=${encodeURIComponent(String(menu.row.name))}`) },
            { label: menu.row.status === "INACTIVE" ? "Mark active" : "Mark inactive", run: () => updateRecord("customers", menu.row.id, { status: menu.row.status === "INACTIVE" ? "ACTIVE" : "INACTIVE" }) },
            { label: "Delete", run: () => remove(menu.row), danger: true },
          ].map((it) => (
            <button
              key={it.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setMenu(null);
                it.run();
              }}
              className={cn("flex w-full rounded-sm px-2 py-1.5 text-left hover:bg-accent", it.danger && "text-destructive")}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}

      {sub === "new" && (
        <SidePanel onClose={close}>
          <CustomerForm onDone={close} />
        </SidePanel>
      )}
      {sub === "import" && (
        <SidePanel onClose={close}>
          <ImportCustomers onDone={close} />
        </SidePanel>
      )}
      {detail && (
        <SidePanel onClose={close}>
          <CustomerForm key={detail.id} record={detail} onDone={close} />
        </SidePanel>
      )}
    </div>
  );
}

function DownloadMenu({ onCSV, onExcel }: { onCSV: () => void; onExcel: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const item = "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent [&_svg]:size-4";
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={cn(btn.outline, "h-8 px-3 text-xs")}>
        <FileText /> Download <ChevronDown />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1 w-44 rounded-md border border-border bg-popover p-1 shadow-md">
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); onCSV(); }}>
            <FileText /> Download CSV
          </button>
          <button type="button" role="menuitem" className={item} onClick={() => { setOpen(false); onExcel(); }}>
            <FileText /> Download Excel
          </button>
        </div>
      )}
    </div>
  );
}

// Double-click to edit a cell in place; Enter saves, Escape cancels.
function InlineCell({ row, field, numeric, className }: { row: Rec; field: string; numeric?: boolean; className?: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const save = () => {
    const v = value.trim();
    if (field === "name" && !v) return setEditing(false);
    updateRecord("customers", row.id, { [field]: numeric ? Math.max(0, Math.floor(Number(v) || 0)) : v });
    setEditing(false);
  };
  return (
    <td
      className={cn("p-2", className)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        setValue(String(row[field] ?? ""));
        setEditing(true);
      }}
      onClick={(e) => editing && e.stopPropagation()}
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

// The always-present "Add a customer…" row at the bottom of the table.
function QuickAddRow() {
  const [f, setF] = useState({ name: "", email: "", phone: "", terms: "30" });
  const add = () => {
    if (!f.name.trim()) return;
    createRecord("customers", { number: nextNumber("customers", "C"), name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), terms: Math.floor(Number(f.terms) || 0), status: "ACTIVE" });
    setF({ name: "", email: "", phone: "", terms: "30" });
  };
  const cellInput = "h-8 w-full rounded-md bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground focus:bg-background focus:ring-1 focus:ring-ring";
  const onKey = (e: React.KeyboardEvent) => e.key === "Enter" && add();
  return (
    <tr className="bg-muted/30">
      <td className="p-2 text-center text-muted-foreground">
        <Plus className="h-3.5 w-3.5" />
      </td>
      <td className="p-1">
        <input aria-label="New customer name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} onKeyDown={onKey} placeholder="Add a customer..." className={cellInput} />
      </td>
      <td className="p-1">
        <input aria-label="New customer email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} onKeyDown={onKey} placeholder="Email" className={cellInput} />
      </td>
      <td className="p-1">
        <input aria-label="New customer phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} onKeyDown={onKey} placeholder="Phone" className={cellInput} />
      </td>
      <td className="p-1">
        <input aria-label="New customer terms" type="number" min="0" value={f.terms} onChange={(e) => setF({ ...f, terms: e.target.value })} onKeyDown={onKey} className={cn(cellInput, "text-center")} />
      </td>
      <td colSpan={2} />
      <td className="p-1 text-center">
        <button type="button" aria-label="Add customer" disabled={!f.name.trim()} onClick={add} className="inline-flex h-6 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-50">
          <Check className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

function AddressFields({ value, onChange, required }: { value: Address; onChange: (a: Address) => void; required?: boolean }) {
  const set = (patch: Partial<Address>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3">
      <Field label={<>Address line 1{required ? <Req /> : <Opt />}</>}>
        <input aria-label="Address line 1" value={value.line1} onChange={(e) => set({ line1: e.target.value })} placeholder="Building, street" className={inputCls} />
      </Field>
      <Field label={<>Address line 2<Opt /></>}>
        <input aria-label="Address line 2" value={value.line2} onChange={(e) => set({ line2: e.target.value })} placeholder="Area, landmark" className={inputCls} />
      </Field>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label={<>City{required ? <Req /> : <Opt />}</>}>
          <input aria-label="City" value={value.city} onChange={(e) => set({ city: e.target.value })} placeholder="e.g. Austin" className={inputCls} />
        </Field>
        <Field label={<>State / Region<Opt /></>}>
          <input aria-label="State / Region" value={value.state} onChange={(e) => set({ state: e.target.value })} placeholder="e.g. Texas" className={inputCls} />
        </Field>
        <Field label={<>Postal code<Opt /></>}>
          <input aria-label="Postal code" value={value.postal} onChange={(e) => set({ postal: e.target.value })} placeholder="e.g. 73301" className={inputCls} />
        </Field>
      </div>
    </div>
  );
}

function CustomerForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const customers = useCustomers();
  const [preview] = useState(() => nextNumber("customers", "C"));
  const [f, setF] = useState(() => ({
    taxId: String(record?.taxId ?? ""),
    name: String(record?.name ?? ""),
    email: String(record?.email ?? ""),
    phone: String(record?.phone ?? ""),
    mobile: String(record?.mobile ?? ""),
    terms: String(record?.terms ?? "30"),
    status: String(record?.status ?? "ACTIVE"),
    frozen: Boolean(record?.frozen),
    notes: String(record?.notes ?? ""),
  }));
  const [address, setAddress] = useState<Address>((record?.address as Address) ?? blankAddress());
  const [others, setOthers] = useState<(Address & { label: string })[]>((record?.deliveryAddresses as (Address & { label: string })[]) ?? []);
  const [error, setError] = useState("");
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setError("Name is required.");
    if (!address.line1.trim() || !address.city.trim()) return setError("Address line 1 and city are required.");
    if (customers.some((c) => c.id !== record?.id && String(c.name).toLowerCase() === f.name.trim().toLowerCase())) return setError(`A customer named ${f.name.trim()} already exists.`);
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setError("Email doesn't look right.");
    const oldName = record?.name;
    const data = { ...f, name: f.name.trim(), terms: Math.max(0, Math.floor(Number(f.terms) || 0)), address, deliveryAddresses: others.filter((o) => o.line1.trim()) };
    if (record) {
      updateRecord("customers", record.id, data);
      // Documents reference customers by name; keep them attached after a rename.
      if (oldName && oldName !== data.name)
        for (const c of ["invoices", "proposals", "sales-orders", "delivery-notes", "recurring-invoices", "ar-payments", "credit-notes"])
          for (const d of readCollection(c)) if (d.customer === oldName) updateRecord(c, d.id, { customer: data.name });
    } else createRecord("customers", { ...data, number: nextNumber("customers", "C") });
    onDone();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">{record ? `Customer: ${record.name}` : "New Customer"}</h1>
      <Section title="Customer Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberBanner compact label="Customer #" value={String(record?.number ?? preview)} saved={!!record} />
          <Field label={<>Tax ID<Opt /></>} htmlFor="c-tax">
            <input id="c-tax" value={f.taxId} onChange={(e) => set({ taxId: e.target.value })} className={inputCls} />
          </Field>
          <Field label={<>Name<Req /></>} htmlFor="c-name">
            <input id="c-name" autoFocus value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Acme Corp" className={inputCls} />
          </Field>
          <Field label={<>Email<Opt /></>} htmlFor="c-email">
            <input id="c-email" type="email" value={f.email} onChange={(e) => set({ email: e.target.value })} placeholder="e.g. billing@acme.com" className={inputCls} />
          </Field>
          <Field label={<>Phone<Opt /></>} htmlFor="c-phone">
            <input id="c-phone" value={f.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="e.g. +1 201 555 0123" className={inputCls} />
          </Field>
          <Field label={<>Mobile Number<Opt /></>} htmlFor="c-mobile">
            <input id="c-mobile" value={f.mobile} onChange={(e) => set({ mobile: e.target.value })} placeholder="e.g. +1 201 555 0198" className={inputCls} />
          </Field>
        </div>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <MapPin className="h-3.5 w-3.5" /> Address
          </p>
          <AddressFields value={address} onChange={setAddress} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={<>Payment Terms (days)<Opt /></>} htmlFor="c-terms">
            <input id="c-terms" type="number" min="0" value={f.terms} onChange={(e) => set({ terms: e.target.value })} className={inputCls} />
          </Field>
          <Field label={<>Status<Opt /></>} htmlFor="c-status">
            <Select id="c-status" value={f.status} onChange={(v) => set({ status: v })} options={STATUSES} />
          </Field>
          <Field label={<>Freeze A/c<Opt /></>}>
            <label className="flex h-9 items-center gap-2 text-sm">
              <input type="checkbox" checked={f.frozen} onChange={(e) => set({ frozen: e.target.checked })} className="h-4 w-4 accent-primary" />
              Freeze
            </label>
          </Field>
        </div>
        <Field label={<>Notes<Opt /></>} htmlFor="c-notes">
          <textarea id="c-notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} className={textareaCls} />
        </Field>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-sm font-medium">
              <MapPin className="h-3.5 w-3.5" /> Other delivery addresses
            </p>
            <button type="button" onClick={() => setOthers([...others, { label: "", ...blankAddress() }])} className={btn.smOutline}>
              <Plus /> Add another address
            </button>
          </div>
          {others.length === 0 && <p className="text-sm text-muted-foreground">Optional. Add ship-to or location addresses to pick them on invoices and delivery notes.</p>}
          {others.map((o, i) => (
            <div key={i} className="space-y-3 rounded-md border border-border/60 p-3">
              <div className="flex gap-2">
                <input aria-label="Address label" value={o.label} onChange={(e) => setOthers(others.map((x, k) => (k === i ? { ...x, label: e.target.value } : x)))} placeholder="Label, e.g. Warehouse" className={inputCls} />
                <button type="button" aria-label="Remove address" onClick={() => setOthers(others.filter((_, k) => k !== i))} className={btn.icon}>
                  <Trash2 />
                </button>
              </div>
              <AddressFields value={o} onChange={(a) => setOthers(others.map((x, k) => (k === i ? { ...x, ...a } : x)))} />
            </div>
          ))}
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" className={btn.primary}>{record ? "Save Changes" : "Create Customer"}</button>
          <button type="button" onClick={onDone} className={btn.outline}>Cancel</button>
        </div>
      </Section>
    </form>
  );
}

function ImportCustomers({ onDone }: { onDone: () => void }) {
  const customers = useCustomers();
  const [rows, setRows] = useState<Record<string, string>[] | null>(null);
  const [error, setError] = useState("");
  const names = new Set(customers.map((c) => String(c.name).toLowerCase()));
  const fresh = rows?.filter((r) => r.name && !names.has(r.name.toLowerCase())) ?? [];

  async function pick(file?: File) {
    setError("");
    setRows(null);
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) return setError("This build reads .csv files. In Excel, use File → Save As → CSV.");
    const lines = (await file.text()).split(/\r?\n/).filter((l) => l.trim());
    const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)?.map((c) => c.replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? [];
    const head = split(lines[0]).map((h) => h.toLowerCase());
    const idx = (...k: string[]) => head.findIndex((h) => k.includes(h));
    const map = { name: idx("name", "customer"), email: idx("email"), phone: idx("phone"), terms: idx("terms (days)", "terms"), taxId: idx("tax id", "taxid") };
    if (map.name < 0) return setError("The file needs a Name column.");
    setRows(lines.slice(1).map(split).map((r) => Object.fromEntries(Object.entries(map).map(([k, i]) => [k, i >= 0 ? (r[i] ?? "") : ""]))));
  }

  function run() {
    for (const r of fresh) createRecord("customers", { number: nextNumber("customers", "C"), name: r.name, email: r.email, phone: r.phone, taxId: r.taxId, terms: Number(r.terms) || 30, status: "ACTIVE" });
    onDone();
  }

  return (
    <div className="space-y-4">
      <button type="button" onClick={onDone} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" /> Back to customers
      </button>
      <h1 className="text-2xl font-semibold tracking-tight">Import Customers</h1>
      <Card>
        <div className="space-y-3 p-6">
          <p className="text-sm text-muted-foreground">
            Columns: <b className="text-foreground">Name</b> (required), Email, Phone, Terms (days), Tax ID. Existing names are skipped. Tip: Download → CSV gives you a template.
          </p>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-border px-4 py-3 text-sm hover:bg-muted/50">
            <Upload className="h-4 w-4" /> Click to select a .csv file
            <input type="file" accept=".csv" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {rows && (
            <>
              <p className="text-sm text-muted-foreground">{fresh.length} new customer(s); {rows.length - fresh.length} skipped.</p>
              <button type="button" disabled={!fresh.length} onClick={run} className={btn.primary}>
                Import {fresh.length} customer(s)
              </button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
