"use client";

// System settings and platform services: key/value settings, document numbering, posting
// preferences, org units, roles, sample data (loaded through the real posting code and removable
// again), "clear all data", Tally XML import, webhook test deliveries and API keys.

import { collectionOfKey, createRecord, deleteRecord, readCollection, type Rec, updateRecord, useCollection } from "@/lib/store";
import { moduleGroups } from "@/lib/nav";
import { createJournal, findAccountByCode } from "@/lib/ledger";
import { createInvoice, recordPayment } from "@/lib/sales";
import { createBill, payVendor } from "@/lib/purchases";

export const todayIso = () => new Date().toISOString().slice(0, 10);
const daysFromToday = (k: number) => { const d = new Date(`${todayIso()}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + k); return d.toISOString().slice(0, 10); };

/* ---------- key/value settings ---------- */

export function getSetting<T>(key: string, fallback: T): T {
  const r = readCollection("system-settings").find((x) => x.key === key);
  return r ? ({ ...(fallback as object), ...(r.value as object) } as T) : fallback;
}
export function saveSetting(key: string, value: unknown) {
  const r = readCollection("system-settings").find((x) => x.key === key);
  if (r) updateRecord("system-settings", r.id, { value }); else createRecord("system-settings", { key, value });
}
// Re-renders on change; returns the stored value merged over the fallback.
export function useSetting<T>(key: string, fallback: T): T {
  const rows = useCollection("system-settings");
  const r = rows.find((x) => x.key === key);
  return r ? ({ ...(fallback as object), ...(r.value as object) } as T) : fallback;
}

/* ---------- document numbering ---------- */

export const NUMBERING: { group: string; items: { coll: string; label: string; prefix: string; auto?: boolean }[] }[] = [
  { group: "Sales", items: [{ coll: "invoices", label: "Sales invoice", prefix: "INV" }, { coll: "credit-notes", label: "Credit note", prefix: "CN" }, { coll: "delivery-notes", label: "Delivery note", prefix: "DN", auto: true }, { coll: "ar-payments", label: "Customer receipt", prefix: "PMT" }, { coll: "sales-orders", label: "Sales order", prefix: "SO" }, { coll: "proposals", label: "Proposal / quote", prefix: "PROP" }, { coll: "customers", label: "Customer code", prefix: "C" }] },
  { group: "Purchasing", items: [{ coll: "bills", label: "Purchase bill", prefix: "BILL" }, { coll: "debit-notes", label: "Debit note", prefix: "DBN" }, { coll: "ap-payments", label: "Vendor payment", prefix: "VPMT" }, { coll: "purchase-orders", label: "Purchase order", prefix: "PO" }, { coll: "purchase-requisitions", label: "Purchase requisition", prefix: "PR" }, { coll: "rfqs", label: "Request for quotation", prefix: "RFQ" }, { coll: "purchase-returns", label: "Purchase return", prefix: "PRET" }, { coll: "purchase-agreements", label: "Blanket agreement", prefix: "BPA" }, { coll: "vendors", label: "Vendor code", prefix: "V" }] },
  { group: "Inventory", items: [{ coll: "products", label: "Product SKU", prefix: "PRD" }, { coll: "grns", label: "Goods receipt note", prefix: "GRN" }, { coll: "stock-transfers", label: "Stock transfer", prefix: "TRF", auto: true }, { coll: "scrap-orders", label: "Scrap order", prefix: "SCR" }, { coll: "job-work", label: "Job work order", prefix: "JW" }, { coll: "stock-journals", label: "Stock journal", prefix: "SJ" }, { coll: "stock-counts", label: "Stock count", prefix: "CNT" }, { coll: "production-orders", label: "Production order", prefix: "MO" }] },
  { group: "Point of Sale", items: [{ coll: "pos-sales", label: "POS sale", prefix: "POS" }, { coll: "pos-shifts", label: "POS shift", prefix: "SH" }, { coll: "pos-returns", label: "POS return", prefix: "RET" }, { coll: "van-sales", label: "Van sale", prefix: "VS" }] },
  { group: "Banking", items: [{ coll: "reconciliations", label: "Bank reconciliation", prefix: "REC" }, { coll: "payment-runs", label: "Payment run", prefix: "RUN" }, { coll: "deposit-slips", label: "Deposit slip", prefix: "DS" }] },
  { group: "Accounting & Assets", items: [{ coll: "journal-entries", label: "Journal entry", prefix: "JE" }, { coll: "assets", label: "Fixed asset", prefix: "FA" }, { coll: "maintenance-requests", label: "Maintenance request", prefix: "MR" }] },
  { group: "People & Projects", items: [{ coll: "employees", label: "Employee number", prefix: "EMP" }, { coll: "payroll-runs", label: "Payroll run", prefix: "PR" }, { coll: "expense-claims", label: "Expense claim", prefix: "EXC" }, { coll: "projects", label: "Project", prefix: "PRJ" }, { coll: "tickets", label: "Helpdesk ticket", prefix: "TKT" }, { coll: "repair-orders", label: "Repair order", prefix: "RO" }, { coll: "appointments", label: "Appointment", prefix: "APT" }] },
  { group: "CRM", items: [{ coll: "leads", label: "Lead", prefix: "LEAD" }, { coll: "opportunities", label: "Opportunity", prefix: "OPP" }, { coll: "quotes", label: "CRM quote", prefix: "QT" }] },
];

/* ---------- posting preferences ---------- */

export const POSTING_TYPES = [
  { key: "sales_invoices", label: "Sales invoices", desc: "Customer invoices — Accounts Receivable. Includes income entries.", sources: ["Sales Invoice"] },
  { key: "purchase_bills", label: "Purchase bills", desc: "Vendor bills — Accounts Payable. Includes expenses and purchases.", sources: ["Vendor Bill"] },
  { key: "customer_payments", label: "Customer payments", desc: "Receipts recorded against customers.", sources: ["AR Payment"] },
  { key: "vendor_payments", label: "Vendor payments", desc: "Payments recorded against vendors.", sources: ["AP Payment"] },
  { key: "pos_sales", label: "POS sales", desc: "Point-of-sale transactions.", sources: ["POS"] },
  { key: "journal_vouchers", label: "Journal vouchers", desc: "Manual journal entries and daybook vouchers.", sources: ["Manual", "MANUAL", "VOUCHER", "QUICK"] },
  { key: "credit_notes", label: "Credit notes", desc: "Customer credit notes — sales returns.", sources: ["Credit Note"] },
  { key: "debit_notes", label: "Debit notes", desc: "Vendor debit notes — purchase returns.", sources: ["Debit Note"] },
];

/* ---------- org units ---------- */

export const HEAD_OFFICE = { id: "HEAD_OFFICE", name: "Head Office", code: "HQ", level: "Head office", parentId: null };
export function orgUnitsAll(): Rec[] {
  const rows = readCollection("org-units");
  return rows.some((r) => r.id === "HEAD_OFFICE") ? rows : [HEAD_OFFICE as unknown as Rec, ...rows];
}
export const BLUEPRINTS: { key: string; name: string; desc: string; units: [string, string, string | null][] }[] = [
  { key: "divisional", name: "Divisional company", desc: "Divisions above branches — e.g. manufacturing vs trading arms.", units: [["Manufacturing", "Division", null], ["Trading", "Division", null], ["Plant 1", "Branch", "Manufacturing"], ["Main Store", "Branch", "Trading"]] },
  { key: "holding", name: "Holding group", desc: "A parent holding with subsidiary legal entities; divisions and teams inside each.", units: [["Subsidiary A", "Subsidiary", null], ["Subsidiary B", "Subsidiary", null], ["Operations", "Division", "Subsidiary A"], ["Finance", "Team", "Subsidiary A"]] },
  { key: "retail", name: "Retail chain", desc: "Regions containing stores; back office as its own branch.", units: [["North Region", "Region", null], ["South Region", "Region", null], ["Store 1", "Store", "North Region"], ["Store 2", "Store", "South Region"], ["Back Office", "Branch", null]] },
  { key: "service", name: "Service teams", desc: "Department-first: practice areas with teams, one legal office.", units: [["Advisory", "Practice", null], ["Delivery", "Practice", null], ["Team Alpha", "Team", "Delivery"]] },
  { key: "single", name: "Single office", desc: "One head office with a general department — the minimal setup.", units: [["General", "Department", null]] },
];
export function applyBlueprint(key: string) {
  const bp = BLUEPRINTS.find((b) => b.key === key)!;
  const made = new Map<string, string>();
  let added = 0;
  for (const [name, level, parent] of bp.units) {
    const existing = orgUnitsAll().find((u) => u.name === name);
    if (existing) { made.set(name, existing.id); continue; }
    const r = createRecord("org-units", { name, level, code: name.replace(/[^A-Za-z0-9]/g, "").slice(0, 4).toUpperCase(), parentId: parent ? made.get(parent) ?? null : "HEAD_OFFICE" });
    made.set(name, r.id); added++;
  }
  const levels = getSetting<{ list: string[] }>("org-levels", { list: ["Head office"] }).list;
  saveSetting("org-levels", { list: [...new Set([...levels, ...bp.units.map((u) => u[1])])] });
  return added;
}

/* ---------- roles & permissions ---------- */

export const ACTIONS = ["view", "create", "edit", "delete", "approve"] as const;
export const PERM_TREE = [{ key: "home", label: "Home & self-service", items: [{ href: "/home", label: "Home" }, { href: "/workspace", label: "My Workspace" }, { href: "/ess", label: "My Self-Service" }] }, ...moduleGroups.filter((g) => g.items.length).map((g) => ({ key: g.key, label: g.label, items: g.items.map((i) => ({ href: i.href, label: i.label })) }))];
const every = (pred: (g: string, a: string) => boolean) => Object.fromEntries(PERM_TREE.flatMap((g) => g.items.map((i) => [i.href, ACTIONS.filter((a) => pred(g.key, a))])).filter(([, a]) => (a as string[]).length));
export const SEED_ROLES = [
  { key: "admin", name: "Admin", description: "Manage users, configure modules, full access to all data.", type: "Locked", level: "Administrator", permissions: every(() => true) },
  { key: "employee", name: "Employee", description: "Self-service portal access only.", type: "Locked", level: "Read Only", permissions: { "/ess": ["view", "create"] } },
  { key: "owner", name: "Owner", description: "Full control including company settings, billing and user management.", type: "Locked", level: "Administrator", permissions: every(() => true) },
  { key: "accountant", name: "Accountant", description: "Full access to financial modules, can post journal entries and run reports.", type: "Predefined", level: "Accountant", permissions: every((g) => ["home", "accounting", "finance", "analytics", "sales", "purchasing", "payroll"].includes(g)) },
  { key: "readonly", name: "Read Only", description: "View-only access to all records. Cannot create, edit or post anything.", type: "Predefined", level: "Read Only", permissions: every((g, a) => a === "view" && g !== "system") },
  { key: "user", name: "User", description: "Day-to-day data entry: invoices, bills, customers, vendors. No admin access.", type: "Predefined", level: "Standard", permissions: every((g, a) => ["home", "quick-entry", "sales", "purchasing", "inventory", "crm"].includes(g) && a !== "delete" && a !== "approve") },
];
export const permCount = (p: unknown) => Object.values((p as Record<string, string[]>) ?? {}).reduce((s, a) => s + a.length, 0);

/* ---------- sample data (posted for real, removable) ---------- */

// Everything the user entered; set-up (chart, currencies, periods, taxes, numbering, posting
// rules, org units, users, roles, templates, settings) is kept.
const KEEP = new Set(["accounts", "currencies", "exchange-rates", "fiscal-periods", "tax-types", "tax-rates", "tax-categories", "tax-settings", "posting-rules", "org-units", "users", "roles", "doc-templates", "system-settings", "doc-numbering", "bank-accounts", "cash-accounts", "transaction-categories", "warehouses", "units", "product-categories", "leave-types", "holiday-calendars", "designations", "salary-components", "salary-structures", "custom-fields", "approval-policies", "webhooks", "integration-clients", "cost-categories", "cost-centres", "purchase-charges", "pipeline-stages", "scoring-rules", "segments", "web-forms", "welcomed", "audit-log"]);


const snapshot = () => { const m = new Map<string, Set<string>>(); for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; const c = collectionOfKey(k); if (!c) continue; try { const v = JSON.parse(localStorage.getItem(k) ?? "null"); if (Array.isArray(v)) m.set(c, new Set(v.map((r: Rec) => r.id))); } catch { /* not a collection */ } } return m; };

export function loadSample() {
  if (readCollection("sample-index").length) throw new Error("Sample data is already loaded");
  // Set-up collections seed lazily; make sure they exist first so they're never taken for sample rows.
  findAccountByCode("1000");
  const before = snapshot();
  const cust = ["Acme Trading LLC", "Blue Ocean Foods", "Crescent Retail"];
  cust.forEach((name, i) => createRecord("customers", { number: `C-S${i + 1}`, name, email: `accounts@${name.split(" ")[0].toLowerCase()}.example`, terms: 30, status: "ACTIVE", creditLimit: 20000 }));
  ["Gulf Traders", "Metro Wholesale"].forEach((name, i) => createRecord("vendors", { number: `V-S${i + 1}`, name, status: "ACTIVE" }));
  const capital = findAccountByCode("3000"), bank = findAccountByCode("1100");
  if (capital && bank) createJournal({ date: daysFromToday(-60), description: "Opening capital", status: "POSTED", source: "Manual", lines: [{ accountId: bank.id, debit: 50000, credit: 0 }, { accountId: capital.id, debit: 0, credit: 50000 }] });
  const line = (description: string, unitPrice: number, qty = 1, taxPct = 5) => ({ description, qty, unitPrice, discPct: 0, taxPct });
  createInvoice({ customer: cust[0], date: daysFromToday(-40), dueDate: daysFromToday(-10), paymentMode: "Credit", lines: [line("Consulting retainer", 8000), line("Implementation", 3800)] });
  createInvoice({ customer: cust[1], date: daysFromToday(-12), dueDate: daysFromToday(3), paymentMode: "Credit", lines: [line("Catering supplies", 40, 133)] });
  createInvoice({ customer: cust[2], date: daysFromToday(-25), dueDate: daysFromToday(-5), paymentMode: "Credit", lines: [line("Store fit-out", 7762)] });
  recordPayment({ customer: cust[2], date: daysFromToday(-4), amount: Number(readCollection("invoices").find((i) => i.customer === cust[2])?.total ?? 0), method: "Bank Transfer", reference: "TT-4471" });
  const rent = findAccountByCode("5200");
  createBill({ vendor: "Gulf Traders", date: daysFromToday(-9), dueDate: daysFromToday(21), lines: [{ ...line("Packaging materials", 3714.29), accountId: findAccountByCode("5300")?.id }] });
  const metro = createBill({ vendor: "Metro Wholesale", date: daysFromToday(-30), dueDate: daysFromToday(-2), lines: [{ ...line("Warehouse rent", 2166.67), accountId: rent?.id }] });
  payVendor({ vendor: "Metro Wholesale", date: daysFromToday(-2), amount: Number(metro.total), method: "Bank Transfer" });
  const after = snapshot();
  const index: { coll: string; id: string }[] = [];
  for (const [coll, ids] of after) if (!KEEP.has(coll) && coll !== "audit-log") for (const id of ids) if (!before.get(coll)?.has(id)) index.push({ coll, id });
  createRecord("sample-index", { items: index, loadedAt: new Date().toISOString() });
  return index.length;
}

export function clearSample() {
  const rows = readCollection("sample-index");
  let n = 0;
  for (const r of rows) { for (const it of (r.items as { coll: string; id: string }[]) ?? []) { deleteRecord(it.coll, it.id); n++; } deleteRecord("sample-index", r.id); }
  return n;
}

export function clearAllData() {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i)!; const c = collectionOfKey(k); if (c && !KEEP.has(c) && !/settings|prefs|agent|theme|sidebar|welcomed|active-unit/.test(k)) keys.push(k); }
  keys.forEach((k) => localStorage.removeItem(k));
  createRecord("audit-log", { at: new Date().toISOString(), action: "DELETE", table: "all data", recordId: "", by: "Udu Arua", summary: `Cleared ${keys.length} collections` });
  return keys.length;
}

/* ---------- Tally XML import ---------- */

export type TallyPreview = { ledgers: { name: string; parent: string; kind: "CUSTOMER" | "VENDOR" | "ACCOUNT"; type: string; exists: boolean; opening: number }[]; vouchers: { number: string; date: string; type: string; narration: string; lines: { ledger: string; amount: number }[]; exists: boolean }[]; errors: string[] };

const GROUP_TYPE: [RegExp, string][] = [[/sundry debtors|receivable/i, "ASSET"], [/sundry creditors|payable/i, "LIABILITY"], [/bank|cash|current assets|fixed assets|investments|loans & advances \(asset\)|deposits|stock/i, "ASSET"], [/capital|reserves|surplus/i, "EQUITY"], [/loans|liabilit|duties|provisions/i, "LIABILITY"], [/sales|income|revenue/i, "REVENUE"], [/purchase|expense|cost/i, "EXPENSE"]];
const tallyDate = (s: string) => (/^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : s);

export function parseTally(xml: string): TallyPreview {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) return { ledgers: [], vouchers: [], errors: ["The file isn't valid XML — export Masters / Day Book from Tally as XML."] };
  const txt = (el: Element, tag: string) => el.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";
  const accounts = readCollection("accounts"), customers = readCollection("customers"), vendors = readCollection("vendors"), journals = readCollection("journal-entries");
  const ledgers = Array.from(doc.getElementsByTagName("LEDGER")).map((l) => {
    const name = l.getAttribute("NAME") || txt(l, "NAME");
    const parent = txt(l, "PARENT");
    const kind = /sundry debtors/i.test(parent) ? "CUSTOMER" as const : /sundry creditors/i.test(parent) ? "VENDOR" as const : "ACCOUNT" as const;
    const type = GROUP_TYPE.find(([re]) => re.test(parent))?.[1] ?? "EXPENSE";
    const exists = kind === "CUSTOMER" ? customers.some((c) => c.name === name) : kind === "VENDOR" ? vendors.some((v) => v.name === name) : accounts.some((a) => String(a.name).toLowerCase() === name.toLowerCase());
    return { name, parent, kind, type, exists, opening: Number(txt(l, "OPENINGBALANCE") || 0) };
  }).filter((l) => l.name);
  const vouchers = Array.from(doc.getElementsByTagName("VOUCHER")).map((v) => {
    const number = txt(v, "VOUCHERNUMBER");
    const entries = [...Array.from(v.getElementsByTagName("ALLLEDGERENTRIES.LIST")), ...Array.from(v.getElementsByTagName("LEDGERENTRIES.LIST"))];
    // Tally: negative AMOUNT = debit, positive = credit.
    const lines = entries.map((e) => ({ ledger: txt(e, "LEDGERNAME"), amount: Number(txt(e, "AMOUNT") || 0) })).filter((x) => x.ledger && x.amount);
    const type = v.getAttribute("VCHTYPE") || txt(v, "VOUCHERTYPENAME");
    return { number, date: tallyDate(txt(v, "DATE")), type, narration: txt(v, "NARRATION"), lines, exists: journals.some((j) => j.tallyRef === `${type}/${number}`) };
  });
  const errors = vouchers.filter((v) => Math.abs(v.lines.reduce((s, l) => s + l.amount, 0)) > 0.005).map((v) => `Voucher ${v.type} ${v.number} doesn't balance — skipped`);
  if (!ledgers.length && !vouchers.length) errors.push("No LEDGER or VOUCHER elements found in this file.");
  return { ledgers, vouchers, errors };
}

const NORMAL: Record<string, string> = { ASSET: "DEBIT", EXPENSE: "DEBIT", LIABILITY: "CREDIT", EQUITY: "CREDIT", REVENUE: "CREDIT" };
const PREFIX: Record<string, string> = { ASSET: "1", LIABILITY: "2", EQUITY: "3", REVENUE: "4", EXPENSE: "6" };

export function importTally(p: TallyPreview) {
  let ledgers = 0, vouchers = 0;
  for (const l of p.ledgers.filter((x) => !x.exists)) {
    if (l.kind === "CUSTOMER") createRecord("customers", { name: l.name, status: "ACTIVE", source: "Tally" });
    else if (l.kind === "VENDOR") createRecord("vendors", { name: l.name, status: "ACTIVE", source: "Tally" });
    else {
      const used = new Set(readCollection("accounts").map((a) => String(a.code)));
      let code = Number(`${PREFIX[l.type]}900`);
      while (used.has(String(code))) code++;
      createRecord("accounts", { code: String(code), name: l.name, type: l.type, normalBalance: NORMAL[l.type], parentId: null, isActive: true, source: "Tally" });
    }
    ledgers++;
  }
  const accFor = (ledger: string) => {
    const pl = p.ledgers.find((x) => x.name === ledger);
    if (pl?.kind === "CUSTOMER") return findAccountByCode("1200")?.id;
    if (pl?.kind === "VENDOR") return findAccountByCode("2000")?.id;
    return readCollection("accounts").find((a) => String(a.name).toLowerCase() === ledger.toLowerCase())?.id;
  };
  for (const v of p.vouchers.filter((x) => !x.exists && Math.abs(x.lines.reduce((s, l) => s + l.amount, 0)) <= 0.005)) {
    const lines = v.lines.map((l) => ({ accountId: accFor(l.ledger) ?? "", memo: l.ledger, debit: l.amount < 0 ? -l.amount : 0, credit: l.amount > 0 ? l.amount : 0 }));
    if (lines.some((l) => !l.accountId)) continue;
    const je = createJournal({ date: v.date || todayIso(), description: `${v.type} ${v.number}${v.narration ? ` — ${v.narration}` : ""}`, status: "POSTED", source: "Tally Import", lines });
    updateRecord("journal-entries", je.id, { tallyRef: `${v.type}/${v.number}` });
    vouchers++;
  }
  return { ledgers, vouchers };
}

/* ---------- webhooks & API clients ---------- */

export const WEBHOOK_EVENTS = ["invoice.created", "invoice.posted", "payment.received", "bill.created", "bill.posted", "journal_entry.posted", "journal_entry.reversed", "sale.completed", "sale.voided", "customer.created", "vendor.created", "account.updated"];
export const CLIENT_EVENTS = ["SALE", "SALE_RETURN", "INVOICE_CREATED", "INVOICE_PAID", "BILL_CREATED", "BILL_PAID", "PAYMENT_RECEIVED", "PAYMENT_MADE", "INVENTORY_ADJUSTMENT", "EXPENSE"];

const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export async function hmac(secret: string, body: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
}
export async function sha256(s: string) { return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))); }
export const randomKey = (prefix: string) => `${prefix}_${hex(crypto.getRandomValues(new Uint8Array(24)).buffer as ArrayBuffer)}`;

// Sends a signed sample event to the endpoint from this browser and records the delivery.
export async function testWebhook(w: Rec) {
  const event = String(((w.events as string[]) ?? [])[0] ?? "invoice.created");
  const body = JSON.stringify({ id: crypto.randomUUID(), type: event, created: new Date().toISOString(), test: true, data: { message: "Test delivery from Tax GO" } });
  const headers: Record<string, string> = { "Content-Type": "application/json", "X-TaxGo-Event": event };
  if (w.secret) headers["X-TaxGo-Signature"] = `sha256=${await hmac(String(w.secret), body)}`;
  const started = Date.now();
  let status = "FAILED", detail = "";
  try {
    const res = await fetch(String(w.url), { method: "POST", headers, body, mode: "cors" });
    status = res.ok ? "DELIVERED" : "FAILED"; detail = `HTTP ${res.status}`;
  } catch (e) {
    detail = e instanceof Error ? `${e.message} (endpoint unreachable or it blocks browser CORS requests)` : "Network error";
  }
  return createRecord("webhook-deliveries", { webhookId: w.id, event, status, detail, ms: Date.now() - started, at: new Date().toISOString(), body });
}

/* ---------- templates ---------- */

export const TEMPLATE_TYPES = ["Invoice", "Proposal", "Project Proposal", "Sales Order", "Purchase Order", "Delivery Note", "Bill", "Credit Note", "Receipt"];
const STYLES: Record<string, string> = {
  Standard: "font-family:Arial,sans-serif;color:#111", Aurora: "font-family:Georgia,serif;color:#1e293b", Noir: "font-family:Helvetica,sans-serif;color:#000", Vertex: "font-family:Verdana,sans-serif;color:#0f172a",
  Lumiere: "font-family:Georgia,serif;color:#312e81", Meridian: "font-family:Arial,sans-serif;color:#134e4a", Onyx: "font-family:'Times New Roman',serif;color:#111",
};
export function baseTemplate(style: string, type: string) {
  const accent = { Standard: "#d9682a", Aurora: "#7c3aed", Noir: "#111111", Vertex: "#059669", Lumiere: "#6366f1", Meridian: "#0f766e", Onyx: "#b45309" }[style] ?? "#d9682a";
  const party = /Purchase|Bill/.test(type) ? "vendor" : "customer";
  return `<div style="${STYLES[style] ?? STYLES.Standard};padding:32px;max-width:800px">
  <div style="display:flex;justify-content:space-between;border-bottom:3px solid ${accent};padding-bottom:12px">
    <div><h2 style="margin:0">{{companyName}}</h2><div>{{companyAddress}}</div></div>
    <div style="text-align:right"><h1 style="margin:0;color:${accent}">{{documentType}}</h1><div>#{{documentNumber}}</div><div>{{documentDate}}</div></div>
  </div>
  <p><strong>${party === "vendor" ? "Vendor" : "Bill to"}:</strong> {{${party}Name}}<br/>{{${party}Address}}</p>
  <table style="width:100%;border-collapse:collapse">
    <tr style="background:${accent};color:#fff"><th align="left">#</th><th align="left">Description</th><th align="right">Qty</th><th align="right">Price</th><th align="right">Total</th></tr>
    {{#each lines}}<tr><td>{{this.lineNumber}}</td><td>{{this.description}}</td><td align="right">{{this.quantity}}</td><td align="right">{{this.unitPrice}}</td><td align="right">{{this.lineTotal}}</td></tr>{{/each}}
  </table>
  <p style="text-align:right">Subtotal {{subtotal}}<br/>Tax {{taxAmount}}<br/><strong>Total {{totalAmount}}</strong></p>
  {{#if notes}}<p>{{notes}}</p>{{/if}}
</div>`;
}
// A small Handlebars subset: {{var}}, {{this.x}}, {{#each list}}…{{/each}}, {{#if v}}…{{/if}}.
export function renderTemplate(html: string, data: Record<string, unknown>) {
  const get = (obj: Record<string, unknown>, path: string) => path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], obj);
  const esc = (v: unknown) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const run = (tpl: string, ctx: Record<string, unknown>): string => tpl
    .replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (_, k, inner) => ((get(ctx, k) as Record<string, unknown>[]) ?? []).map((item) => run(inner, { ...ctx, this: item })).join(""))
    .replace(/{{#if ([\w.]+)}}([\s\S]*?){{\/if}}/g, (_, k, inner) => (get(ctx, k) ? run(inner, ctx) : ""))
    .replace(/{{\s*([\w.]+)\s*}}/g, (_, k) => esc(get(ctx, k)));
  return run(html, data);
}
export const SAMPLE_DOC = { companyName: "AfriHub", companyAddress: "Dubai, UAE", documentType: "INVOICE", documentNumber: "INV-01", documentDate: todayIso(), customerName: "Acme Trading LLC", customerAddress: "Business Bay, Dubai", vendorName: "Gulf Traders", vendorAddress: "Deira, Dubai", subtotal: "$1,200.000", taxAmount: "$60.000", totalAmount: "$1,260.000", notes: "Thank you for your business.", lines: [{ lineNumber: 1, description: "Consulting", quantity: 10, unitPrice: "$100.000", lineTotal: "$1,000.000" }, { lineNumber: 2, description: "Setup fee", quantity: 1, unitPrice: "$200.000", lineTotal: "$200.000" }] };

export function seedTemplates() {
  if (readCollection("doc-templates").length) return;
  const set: [string, string[]][] = [["Invoice", ["Standard", "Aurora", "Noir", "Vertex"]], ["Proposal", ["Lumiere", "Meridian", "Onyx"]], ["Project Proposal", ["Lumiere", "Meridian", "Onyx"]], ["Sales Order", ["Aurora", "Noir", "Vertex"]], ["Purchase Order", ["Aurora", "Noir", "Vertex"]], ["Delivery Note", ["Aurora", "Noir", "Vertex"]], ["Bill", ["Aurora", "Noir", "Vertex"]], ["Credit Note", ["Aurora", "Noir", "Vertex"]], ["Receipt", ["Aurora", "Noir", "Vertex"]]];
  for (const [type, styles] of set) styles.forEach((s, i) => createRecord("doc-templates", { name: `${s === "Lumiere" ? "Lumière" : s} — ${type}`, style: s, type, isDefault: i === 0, description: s === "Standard" ? "Statutory tax-invoice layout — HSN/GST columns, totals summary, bank & signatory." : `${s} style ${type.toLowerCase()}.`, html: baseTemplate(s, type), builtIn: true }));
}

/* ---------- posting rules (reference configuration) ---------- */

export const EVENT_TYPES = [
  { group: "Sales", items: [["SALES_INVOICE", "Sales Invoice"], ["POS_SALE", "POS Sale"], ["PAYMENT_RECEIVED", "Receipt — Sales Payment Received"], ["COGS", "Inventory Sold (COGS)"]] },
  { group: "Purchase", items: [["PURCHASE_BILL", "Purchase Bill"], ["PURCHASE_BILL_INV", "Purchase Bill (with Inventory)"], ["PAYMENT_MADE", "Payment — Vendor Payment Made"], ["GRN", "Goods Received (GRN)"]] },
  { group: "Assets", items: [["ASSET_ACQUIRED", "Fixed Asset Acquired"], ["DEPRECIATION", "Depreciation"]] },
  { group: "Bank", items: [["BANK_FEE", "Bank Fee"], ["BANK_INTEREST", "Bank Interest"]] },
  { group: "Notes", items: [["CREDIT_NOTE", "Credit Note"], ["DEBIT_NOTE", "Debit Note"]] },
];
export const eventLabel = (k: unknown) => EVENT_TYPES.flatMap((g) => g.items).find(([v]) => v === k)?.[1] ?? String(k);
// Which journal sources each event type corresponds to (for the events view).
export const SOURCE_EVENT: Record<string, string> = { "Sales Invoice": "SALES_INVOICE", POS: "POS_SALE", "AR Payment": "PAYMENT_RECEIVED", "Vendor Bill": "PURCHASE_BILL", "AP Payment": "PAYMENT_MADE", Depreciation: "DEPRECIATION", "Bank Inbox": "BANK_FEE", Reconciliation: "BANK_FEE", "Credit Note": "CREDIT_NOTE", "Debit Note": "DEBIT_NOTE" };

export function seedPostingRules() {
  if (readCollection("posting-rules").length) return;
  const acc = (c: string) => findAccountByCode(c)?.id ?? "";
  const R = (name: string, eventType: string, priority: number, lines: [string, string, string][], conditions = "") => createRecord("posting-rules", { name, eventType, priority, active: true, conditions, memo: `{{documentNumber}} — ${name}`, lines: lines.map(([side, code, path]) => ({ side, accountId: acc(code), resolution: "FIXED", amountPath: path })) });
  R("Bank Invoice Posting", "SALES_INVOICE", 200, [["DEBIT", "1100", "total"], ["CREDIT", "4000", "netAmount"], ["CREDIT", "2100", "taxAmount"]], '{"paymentMode":"Bank Transfer"}');
  R("Cash Invoice Posting", "SALES_INVOICE", 200, [["DEBIT", "1000", "total"], ["CREDIT", "4000", "netAmount"], ["CREDIT", "2100", "taxAmount"]], '{"paymentMode":"Cash"}');
  R("Default Invoice Posting", "SALES_INVOICE", 100, [["DEBIT", "1200", "total"], ["CREDIT", "4000", "netAmount"], ["CREDIT", "2100", "taxAmount"]]);
  R("Default POS Sale Posting", "POS_SALE", 100, [["DEBIT", "1000", "total"], ["CREDIT", "4000", "netAmount"], ["CREDIT", "2100", "taxAmount"]]);
  R("Default Payment Received", "PAYMENT_RECEIVED", 100, [["DEBIT", "1100", "amount"], ["CREDIT", "1200", "amount"]]);
  R("Default Bill Posting", "PURCHASE_BILL", 100, [["DEBIT", "5300", "netAmount"], ["DEBIT", "1500", "taxAmount"], ["CREDIT", "2000", "total"]]);
  R("Default Vendor Payment", "PAYMENT_MADE", 100, [["DEBIT", "2000", "amount"], ["CREDIT", "1100", "amount"]]);
  R("Default Bank Fee", "BANK_FEE", 100, [["DEBIT", "5900", "amount"], ["CREDIT", "1100", "amount"]]);
  R("Default Bank Interest", "BANK_INTEREST", 100, [["DEBIT", "1100", "amount"], ["CREDIT", "4200", "amount"]]);
  R("Default Credit Note Posting", "CREDIT_NOTE", 100, [["DEBIT", "4020", "netAmount"], ["DEBIT", "2100", "taxAmount"], ["CREDIT", "1200", "total"]]);
  R("Default Debit Note Posting", "DEBIT_NOTE", 100, [["DEBIT", "2000", "total"], ["CREDIT", "5090", "netAmount"], ["CREDIT", "1500", "taxAmount"]]);
}
