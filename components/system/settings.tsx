"use client";

// System › settings pages: home, organization, users, roles, templates, posting preferences,
// purchase charges, document numbering, configurations, custom fields and the audit log.

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, BookOpen, Building2, ChevronDown, ChevronRight, Copy, Eye, EyeOff, Fingerprint, GitBranch, Keyboard, MessageSquare, Package, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { createRecord, deleteRecord, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { SEED_ACCOUNTS } from "@/lib/accounting-seed";
import { useAccounts } from "@/lib/ledger";
import { ACTIONS, BLUEPRINTS, HEAD_OFFICE, NUMBERING, PERM_TREE, POSTING_TYPES, SAMPLE_DOC, SEED_ROLES, TEMPLATE_TYPES, applyBlueprint, baseTemplate, clearAllData, clearSample, loadSample, permCount, renderTemplate, saveSetting, seedPostingRules, seedTemplates, useSetting } from "@/lib/system";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, DataTable, Dialog, Field, PageHeader, SidePanel, Switch, btn, inputCls, textareaCls } from "@/components/accounting/kit";
import { Select } from "@/components/accounting/pickers";
import { subOf } from "@/components/purchasing/kit";
import { Th, useFlash } from "@/components/hr/people";
import { activeCompanyId, DEFAULT_COMPANY } from "@/lib/store";
import { switchCompany, useCompanies, useCompanyName } from "@/lib/companies";

const omitId = (r: Record<string, unknown>) => Object.fromEntries(Object.entries(r).filter(([k]) => k !== "id" && k !== "createdAt"));
const fmtWhen = (iso: unknown) => (iso ? new Date(String(iso)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const Row = ({ icon: Icon, title, text, href, onClick }: { icon: typeof Building2; title: string; text: string; href?: string; onClick?: () => void }) => {
  const inner = <Card className="transition-colors hover:border-primary/40"><div className="flex items-center gap-4 p-4"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Icon className="size-4" /></span><div className="flex-1"><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div><ChevronRight className="size-4 text-muted-foreground" /></div></Card>;
  return href ? <Link href={href} className="block">{inner}</Link> : <button type="button" className="block w-full text-left" onClick={onClick}>{inner}</button>;
};

/* ---------- settings home ---------- */

type Profile = { legalName: string; tradeName: string; companyType: string; taxType: string; taxNumber: string; address: string; city: string; country: string; email: string; phone: string };
const REGION_CURRENCY: Record<string, string> = { "UAE / GCC": "AED", India: "INR", "United States": "USD", "United Kingdom": "GBP", International: "USD" };
const noSubscribe = () => () => {};
const BLANK_PROFILE: Profile = { legalName: "", tradeName: "", companyType: "LLC", taxType: "TRN", taxNumber: "", address: "", city: "", country: "UAE", email: "", phone: "" };

export function SettingsHome() {
  const companies = useCompanies();
  const activeCo = useSyncExternalStore(noSubscribe, activeCompanyId, () => DEFAULT_COMPANY);
  const companyName = useCompanyName();
  const profile = useSetting<Profile>("company-profile", { ...BLANK_PROFILE, legalName: companyName, tradeName: companyName });
  const keyboard = useSetting("keyboard", { tally: false });
  const logo = useSetting("company-logo", { dataUrl: "" });
  const accounts = useAccounts();
  const rules = useCollection("posting-rules");
  useEffect(() => { const t = setTimeout(seedPostingRules, 0); return () => clearTimeout(t); }, []);
  const sample = useCollection("sample-index");
  const [prof, setProf] = useState<Profile | null>(null);
  const [co, setCo] = useState({ name: "", region: "UAE / GCC" });
  const [danger, setDanger] = useState({ open: false, text: "" });
  const [resetOpen, setResetOpen] = useState(false);
  const { node, flash } = useFlash();
  const run = (fn: () => unknown, ok: (r: unknown) => string) => { try { flash(ok(fn())); } catch (e) { flash(e instanceof Error ? e.message : "Failed", true); } };
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Settings" />
      <Row icon={Building2} title="Company Profile" text="Legal name, company type, tax registration (GST/VAT/TRN/EIN), address & contact" onClick={() => setProf(profile)} />
      <Row icon={Fingerprint} title="Sign-in & security" text="Fingerprint / Face sign-in (passkeys) and a 6-digit quick-unlock PIN for your devices" href="/profile" />
      <Row icon={MessageSquare} title="WhatsApp" text="Pair a WhatsApp number, authorize operators & run the whole system from chat" href="/settings/whatsapp" />
      <Row icon={GitBranch} title="Manage organization" text="One place for your org structure — add, nest, rename units and control access. Used across HR, finance & inventory." href="/settings/organization" />
      <Card><div className="space-y-3 p-5"><CardTitle>Keyboard</CardTitle><p className="text-sm text-muted-foreground">How you move through screens and enter data on this device.</p>
        <div className="flex items-center gap-4"><span className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"><Keyboard className="size-4" /></span><div className="flex-1"><p className="font-medium">Tally-style keyboard entry</p><p className="text-xs text-muted-foreground">F-key shortcuts, the right-hand button bar and Enter-to-advance data entry, for teams migrating from Tally</p></div><Switch checked={keyboard.tally} onChange={(v) => saveSetting("keyboard", { tally: v })} label="Tally-style keyboard entry" /></div>
      </div></Card>
      <Card><div className="space-y-3 p-5"><CardTitle>Company Setup</CardTitle><p className="text-sm text-muted-foreground">Initialize your company with a chart of accounts, tax configuration, fiscal year, and posting rules.</p>
        <div className="flex items-center justify-between rounded-md bg-success/10 p-3 text-success"><div><p className="font-medium">Company accounting system is initialized</p><p className="text-xs">Country: {profile.country || "GENERIC"} · {accounts.length} accounts · {rules.length} posting rules</p></div><button type="button" className={btn.smOutline} onClick={() => setResetOpen(true)}>Reset Setup</button></div>
      </div></Card>
      <Card><div className="space-y-3 p-5"><CardTitle>Data Management</CardTitle><p className="text-sm text-muted-foreground">Load or clear sample data for exploring {BRAND.fullName} with realistic records.</p>
        <div className="flex items-center justify-between rounded-md border border-border p-3"><div><p className="font-medium">Sample Data</p><p className="text-xs text-muted-foreground">{sample.length ? `Loaded ${fmtWhen(sample[0].loadedAt)} — ${((sample[0].items as unknown[]) ?? []).length} records, all posted to the ledger.` : "No sample data loaded."}</p></div>
          {sample.length ? <button type="button" className={btn.smOutline} onClick={() => run(clearSample, (n) => `Removed ${n} sample record(s)`)}>Clear Sample Data</button> : <button type="button" className={btn.smPrimary} onClick={() => run(loadSample, (n) => `Loaded ${n} sample record(s)`)}>Load Sample Data</button>}</div>
      </div></Card>
      <Card><div className="space-y-3 p-5"><CardTitle>Company Management</CardTitle><p className="text-sm text-muted-foreground">Create new companies and manage your company access.</p>
        <div className="flex flex-wrap items-end gap-2"><Field label="Company Name" className="flex-1"><input aria-label="Company Name" className={inputCls} value={co.name} onChange={(e) => setCo({ ...co, name: e.target.value })} /></Field><Field label="Select Country / Region"><Select ariaLabel="Country / Region" className="w-48" value={co.region} onChange={(v) => setCo({ ...co, region: v })} options={["UAE / GCC", "India", "United States", "United Kingdom", "International"]} /></Field><button type="button" className={btn.primary} disabled={!co.name.trim()} onClick={() => { createRecord("companies", { name: co.name.trim(), region: co.region, country: co.region === "UAE / GCC" ? "UAE" : co.region, currency: REGION_CURRENCY[co.region] ?? "USD", role: "Owner", status: "Active" }); setCo({ name: "", region: co.region }); flash("Company created — switch to it from the company selector once multi-company books are enabled"); }}>Create Company</button></div>
        <div className="flex items-center gap-3">{logo.dataUrl ? <img src={logo.dataUrl} alt="Company logo" className="size-12 rounded border border-border object-contain" /> : null}<label className={cn(btn.smOutline, "cursor-pointer")}><Upload /> Upload Logo<input type="file" accept="image/*" className="sr-only" aria-label="Upload Logo" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; if (f.size > 300_000) return flash("Use an image under 300 KB", true); const r = new FileReader(); r.onload = () => { saveSetting("company-logo", { dataUrl: String(r.result) }); flash("Logo saved"); }; r.readAsDataURL(f); }} /></label>{logo.dataUrl && <button type="button" className="text-xs text-destructive underline" onClick={() => saveSetting("company-logo", { dataUrl: "" })}>Remove</button>}</div>
        <p className="text-sm font-medium">Your Companies</p>
        <div className="space-y-1 text-sm">{companies.map((c) => <div key={String(c.id)} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"><span>{String(c.name)} <span className="text-muted-foreground">({String(c.role ?? "Owner")})</span></span>{c.id === activeCo ? <Badge tone="success">Current</Badge> : <button type="button" className={btn.smOutline} onClick={() => switchCompany(c.id, "/settings")}>Switch</button>}</div>)}</div>
      </div></Card>
      <Card className="border-destructive/40"><div className="space-y-3 p-5"><CardTitle className="text-destructive">Danger Zone</CardTitle><p className="text-sm text-muted-foreground">Irreversible actions. Be certain before you proceed.</p>
        <div className="flex items-center justify-between gap-4 rounded-md border border-destructive/30 p-3"><div><p className="font-medium">Clear all entered data</p><p className="text-xs text-muted-foreground">Permanently deletes every transaction and master record you entered (invoices, journal entries, payments, POS sales, customers, vendors, products, employees, …). Your chart of accounts, currencies, fiscal periods, taxes, posting rules, org units, users, templates and settings are kept — a fresh start.</p></div><button type="button" className={cn(btn.smOutline, "border-destructive/40 text-destructive")} onClick={() => setDanger({ open: true, text: "" })}>Clear data…</button></div>
      </div></Card>
      {prof && <Dialog open onClose={() => setProf(null)} title="Company Profile" className="max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {([["legalName", "Legal name"], ["tradeName", "Trade name"], ["taxNumber", "Tax registration number"], ["email", "Email"], ["phone", "Phone"], ["city", "City"], ["country", "Country"]] as [keyof Profile, string][]).map(([k, l]) => <Field key={k} label={l}><input aria-label={l} className={inputCls} value={prof[k]} onChange={(e) => setProf({ ...prof, [k]: e.target.value })} /></Field>)}
          <Field label="Company type"><Select ariaLabel="Company type" value={prof.companyType} onChange={(v) => setProf({ ...prof, companyType: v })} options={["LLC", "Sole proprietorship", "Partnership", "Private limited", "Public limited", "Free zone company", "Non-profit"]} /></Field>
          <Field label="Tax registration type"><Select ariaLabel="Tax registration type" value={prof.taxType} onChange={(v) => setProf({ ...prof, taxType: v })} options={["TRN", "VAT", "GST", "EIN", "None"]} /></Field>
          <Field label="Address" className="sm:col-span-2"><textarea aria-label="Address" rows={2} className={textareaCls} value={prof.address} onChange={(e) => setProf({ ...prof, address: e.target.value })} /></Field>
        </div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setProf(null)}>Cancel</button><button type="button" className={btn.primary} disabled={!prof.legalName.trim()} onClick={() => { saveSetting("company-profile", prof); setProf(null); flash("Company profile saved"); }}>Save</button></div>
      </Dialog>}
      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} title="Reset setup?" description="Restores any missing accounts from the standard chart and the default posting rules. Nothing you entered is deleted.">
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setResetOpen(false)}>Cancel</button><button type="button" className={btn.primary} onClick={() => { const have = new Set(readCollection("accounts").map((a) => String(a.code))); let n = 0; for (const a of SEED_ACCOUNTS) if (!have.has(a.code)) { createRecord("accounts", omitId(a)); n++; } seedPostingRules(); setResetOpen(false); flash(`Setup checked — ${n} account(s) restored`); }}>Reset Setup</button></div>
      </Dialog>
      <Dialog open={danger.open} onClose={() => setDanger({ open: false, text: "" })} title={<span className="flex items-center gap-2 text-destructive"><AlertTriangle className="size-5" /> Clear all entered data?</span>} description="This permanently deletes every transaction and master record in this browser. Type DELETE to confirm.">
        <input aria-label="Type DELETE to confirm" className={inputCls} value={danger.text} onChange={(e) => setDanger({ ...danger, text: e.target.value })} />
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setDanger({ open: false, text: "" })}>Cancel</button><button type="button" className={cn(btn.primary, "bg-destructive hover:bg-destructive/90")} disabled={danger.text !== "DELETE"} onClick={() => { const n = clearAllData(); setDanger({ open: false, text: "" }); flash(`Cleared ${n} collection(s) — reload to see a fresh start`); }}>Clear data</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- organization ---------- */

export function Organization() {
  const companyName = useCompanyName();
  const stored = useCollection("org-units");
  const levelsSet = useSetting("org-levels", { list: ["Head office"] });
  const units = [...(stored.some((u) => u.id === "HEAD_OFFICE") ? [] : [HEAD_OFFICE as unknown as Rec]), ...stored];
  const [sel, setSel] = useState<string | null>(null);
  const [newLevel, setNewLevel] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const { node, flash } = useFlash();
  const children = (pid: string | null) => units.filter((u) => (u.parentId ?? null) === pid && u.id !== "HEAD_OFFICE");
  const unit = units.find((u) => u.id === sel);
  const descendants = (id: string): string[] => units.filter((u) => u.parentId === id).flatMap((u) => [u.id, ...descendants(u.id)]);
  const inUse = (id: string) => readCollection("employees").some((e) => e.orgUnitId === id) || readCollection("pos-terminals").some((t) => t.orgUnitId === id) || readCollection("warehouses").some((w) => w.orgUnit === id);
  const addUnit = (parentId: string | null) => { const r = createRecord("org-units", { name: "New unit", code: "", level: levelsSet.list[1] ?? "Branch", parentId }); setSel(r.id); };
  const Node = ({ u, depth }: { u: Rec; depth: number }) => (
    <div>
      <div className="flex items-center gap-2" style={{ paddingLeft: depth * 24 }}>
        <button type="button" onClick={() => setSel(u.id)} className={cn("flex min-w-56 items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2 text-left shadow-sm", sel === u.id ? "border-primary ring-1 ring-primary" : "border-border hover:border-primary/40")}>
          <span><span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{String(u.level ?? "")}</span><span className="font-medium">{String(u.name)}</span>{u.code ? <span className="ml-2 font-mono text-xs text-muted-foreground">{String(u.code)}</span> : null}</span><span className="flex gap-1">{u.ownBooks ? <BookOpen aria-label="Own books" className="size-3.5 text-primary" /> : null}{u.ownInventory && !u.ownBooks ? <Package aria-label="Own inventory" className="size-3.5 text-warning" /> : null}</span>
        </button>
        <button type="button" aria-label={`Add unit under ${u.name}`} className={btn.icon} onClick={() => addUnit(u.id)}><Plus /></button>
      </div>
      <div className="mt-2 space-y-2">{children(u.id).map((c) => <Node key={c.id} u={c} depth={depth + 1} />)}</div>
    </div>
  );
  const bp = BLUEPRINTS.find((b) => b.key === preview);
  return (
    <div className="space-y-4">
      <PageHeader title="Organization" subtitle="Your org structure — any shape, any depth. Add the levels your business actually uses; everything in finance, HR and inventory is reported against this tree." />
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card><div className="space-y-2 overflow-x-auto p-5">
          <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Badge tone="info">COMPANY</Badge>{companyName}<span>·</span>{units.length} unit(s)</div>
          <Node u={units.find((u) => u.id === "HEAD_OFFICE")!} depth={0} />
          {children(null).map((u) => <Node key={u.id} u={u} depth={0} />)}
          {bp && <div className="mt-4 rounded-md border border-dashed border-primary/40 p-3 text-sm"><p className="mb-1 font-medium text-primary">Preview: {bp.name}</p>{bp.units.map(([n, l, p]) => <p key={n} className="text-muted-foreground" style={{ paddingLeft: p ? 24 : 0 }}>+ {n} <span className="text-xs">({l})</span></p>)}</div>}
          <button type="button" className={cn(btn.smOutline, "mt-3")} onClick={() => addUnit(null)}><Plus /> Add a top-level unit</button>
        </div></Card>
        <div className="space-y-4">
          <Card><div className="space-y-3 p-5"><CardTitle>{unit ? "Edit unit" : "Nothing selected"}</CardTitle>
            {!unit ? <p className="text-sm text-muted-foreground">Click a box on the chart to rename, move or delete it.</p> : unit.id === "HEAD_OFFICE" && !stored.some((u) => u.id === "HEAD_OFFICE") ? <><p className="text-sm">Head Office (HQ) is the root of the tree.</p><button type="button" className={btn.smOutline} onClick={() => { createRecord("org-units", { ...HEAD_OFFICE }); }}>Make editable</button></> : <>
              <Field label="Name"><input aria-label="Unit name" className={inputCls} value={String(unit.name)} onChange={(e) => updateRecord("org-units", unit.id, { name: e.target.value })} /></Field>
              <Field label="Code"><input aria-label="Unit code" className={inputCls} value={String(unit.code ?? "")} onChange={(e) => updateRecord("org-units", unit.id, { code: e.target.value.toUpperCase() })} /></Field>
              <Field label="Level"><Select ariaLabel="Unit level" value={String(unit.level ?? "")} onChange={(v) => updateRecord("org-units", unit.id, { level: v })} options={levelsSet.list} /></Field>
              {unit.id !== "HEAD_OFFICE" && <Field label="Parent"><Select ariaLabel="Parent unit" value={String(unit.parentId ?? "")} onChange={(v) => updateRecord("org-units", unit.id, { parentId: v || null })} options={[{ value: "", label: "— Top level —" }, ...units.filter((u) => u.id !== unit.id && !descendants(unit.id).includes(u.id)).map((u) => ({ value: u.id, label: String(u.name) }))]} /></Field>}
              {unit.id !== "HEAD_OFFICE" && <div className="space-y-2 rounded-md border border-border p-3">
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5" checked={!!unit.ownBooks} onChange={(e) => updateRecord("org-units", unit.id, { ownBooks: e.target.checked })} /><span><span className="flex items-center gap-1 font-medium"><BookOpen className="size-3.5 text-primary" /> Keeps its own books</span><span className="block text-xs text-muted-foreground">Its own ledger, customers, invoices, bank and reports. Otherwise it records into the books above it.</span></span></label>
                <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-0.5" checked={!!unit.ownInventory} disabled={!!unit.ownBooks} onChange={(e) => updateRecord("org-units", unit.id, { ownInventory: e.target.checked })} /><span><span className="flex items-center gap-1 font-medium"><Package className="size-3.5 text-warning" /> Keeps its own inventory</span><span className="block text-xs text-muted-foreground">{unit.ownBooks ? "Included — a unit with its own books has its own stock too." : "Separate products, warehouses and stock; books stay shared."}</span></span></label>
              </div>}
              {unit.id !== "HEAD_OFFICE" && <button type="button" className={cn(btn.smOutline, "text-destructive")} onClick={() => { if (children(unit.id).length) return flash("Move or delete its sub-units first", true); if (inUse(unit.id)) return flash("Employees, tills or warehouses still use this unit", true); deleteRecord("org-units", unit.id); setSel(null); }}><Trash2 /> Delete unit</button>}
            </>}
          </div></Card>
          <Card><div className="space-y-2 p-5"><CardTitle>Your levels</CardTitle><p className="text-xs text-muted-foreground">The words your business uses — Branch, Region, Store, Practice, Subsidiary. Rename or add any.</p>
            <div className="flex flex-wrap gap-1">{levelsSet.list.map((l) => <span key={l} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs">{l}{l !== "Head office" && <button type="button" aria-label={`Remove ${l}`} onClick={() => saveSetting("org-levels", { list: levelsSet.list.filter((x) => x !== l) })}><X className="size-3" /></button>}</span>)}</div>
            <div className="flex gap-2"><input aria-label="New level" placeholder="e.g. Branch" className={cn(inputCls, "h-8")} value={newLevel} onChange={(e) => setNewLevel(e.target.value)} /><button type="button" className={btn.smOutline} disabled={!newLevel.trim()} onClick={() => { saveSetting("org-levels", { list: [...new Set([...levelsSet.list, newLevel.trim()])] }); setNewLevel(""); }}>Add</button></div>
          </div></Card>
          <Card><div className="space-y-2 p-5"><CardTitle>Start from a blueprint</CardTitle><p className="text-xs text-muted-foreground">Hover to preview it on the chart. Applying only adds — nothing is renamed or deleted.</p>
            {BLUEPRINTS.map((b) => <button key={b.key} type="button" onMouseEnter={() => setPreview(b.key)} onMouseLeave={() => setPreview(null)} onClick={() => flash(`${applyBlueprint(b.key)} unit(s) added from “${b.name}”`)} className="block w-full rounded-md border border-border p-2 text-left hover:bg-accent"><p className="text-sm font-medium">{b.name}</p><p className="text-xs text-muted-foreground">{b.desc}</p></button>)}
          </div></Card>
        </div>
      </div>
      {node}
    </div>
  );
}

/* ---------- users ---------- */

function useRoles() {
  const roles = useCollection("roles");
  useEffect(() => { const t = setTimeout(() => { if (!readCollection("roles").length) SEED_ROLES.forEach((r) => createRecord("roles", r)); }, 0); return () => clearTimeout(t); }, []);
  return roles;
}

export function Users() {
  const companyName = useCompanyName();
  const users = useCollection("users");
  const roles = useRoles();
  const [inv, setInv] = useState<{ open: boolean; name: string; email: string; role: string }>({ open: false, name: "", email: "", role: "user" });
  const { node, flash } = useFlash();
  const all = [{ id: "owner", name: BRAND.user.fullName, email: "arua.ib9@gmail.com", role: "owner", status: "Active", lastLogin: new Date().toISOString(), you: true } as Rec, ...users];
  return (
    <div className="space-y-4">
      <PageHeader title="Users" subtitle="Manage who has access to this company and what they can do" actions={<button type="button" className={btn.primary} onClick={() => setInv({ ...inv, open: true })}><Plus /> Invite user</button>} />
      <Card><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Name</Th><Th>Role</Th><Th>Status</Th><Th>Last login</Th><Th /></tr></thead><tbody>{all.map((u) => (
        <tr key={u.id} className="border-b border-border"><td className="px-2 py-2"><p className="font-medium">{String(u.name)}{u.you ? <span className="text-muted-foreground">(you)</span> : null}</p><p className="text-xs text-muted-foreground">{String(u.email)}</p></td>
          <td className="px-2 py-2">{u.you ? "Owner" : <Select ariaLabel={`Role for ${u.email}`} size="sm" className="w-40" value={String(u.role)} onChange={(v) => updateRecord("users", u.id, { role: v })} options={roles.filter((r) => r.key !== "owner").map((r) => ({ value: String(r.key), label: String(r.name) }))} />}</td>
          <td className="px-2 py-2"><Badge tone={u.status === "Active" ? "success" : u.status === "Invited" ? "info" : "muted"}>{String(u.status)}</Badge></td><td className="px-2 py-2">{u.lastLogin ? fmtWhen(u.lastLogin) : "—"}</td>
          <td className="px-2 py-2 text-right">{!u.you && <span className="inline-flex gap-2">{u.status === "Invited" && <button type="button" className="text-xs text-primary underline" onClick={() => { navigator.clipboard?.writeText(`${location.origin}/signup?invite=${u.token}`); flash("Invite link copied"); }}>Copy invite link</button>}<button type="button" className="text-xs underline" onClick={() => updateRecord("users", u.id, { status: u.status === "Deactivated" ? "Active" : "Deactivated" })}>{u.status === "Deactivated" ? "Reactivate" : "Deactivate"}</button><button type="button" className="text-xs text-destructive underline" onClick={() => confirm(`Remove ${u.email}?`) && deleteRecord("users", u.id)}>Remove</button></span>}</td></tr>
      ))}</tbody></table></Card>
      <Dialog open={inv.open} onClose={() => setInv({ ...inv, open: false })} title="Invite user" description={`They get access to ${companyName} with the role you pick.`}>
        <div className="grid gap-3"><Field label="Name"><input aria-label="Invitee name" className={inputCls} value={inv.name} onChange={(e) => setInv({ ...inv, name: e.target.value })} /></Field><Field label="Email"><input aria-label="Invitee email" type="email" className={inputCls} value={inv.email} onChange={(e) => setInv({ ...inv, email: e.target.value })} /></Field><Field label="Role"><Select ariaLabel="Invitee role" value={inv.role} onChange={(v) => setInv({ ...inv, role: v })} options={roles.filter((r) => r.key !== "owner").map((r) => ({ value: String(r.key), label: String(r.name) }))} /></Field></div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setInv({ ...inv, open: false })}>Cancel</button><button type="button" className={btn.primary} onClick={() => { const email = inv.email.trim().toLowerCase(); if (!/^\S+@\S+\.\S+$/.test(email)) return flash("Enter a valid email", true); if (all.some((u) => String(u.email).toLowerCase() === email)) return flash("That person already has access", true); createRecord("users", { name: inv.name.trim() || email.split("@")[0], email, role: inv.role, status: "Invited", token: crypto.randomUUID() }); setInv({ open: false, name: "", email: "", role: "user" }); flash(`Invitation created for ${email} — copy the invite link to send it`); }}>Send invite</button></div>
      </Dialog>
      {node}
    </div>
  );
}

/* ---------- roles ---------- */

const LEVELS = [{ value: "Read Only", label: "Read Only", hint: "View records only" }, { value: "Standard", label: "Standard", hint: "Day-to-day data entry" }, { value: "Accountant", label: "Accountant", hint: "Financial modules, posting & reports" }, { value: "Administrator", label: "Administrator", hint: "Everything, including settings" }];

export function Roles() {
  const roles = useRoles();
  const users = useCollection("users");
  const [edit, setEdit] = useState<Rec | "new" | null>(null);
  const count = (k: unknown) => (k === "owner" ? 1 : 0) + users.filter((u) => u.role === k).length;
  return (
    <div className="space-y-4">
      <PageHeader title="Roles & Permissions" subtitle="Define what each role can do. Changes apply to assigned users immediately." actions={<button type="button" className={btn.primary} onClick={() => setEdit("new")}><Plus /> New role</button>} />
      <Card><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Role</Th><Th>Key</Th><Th>Users</Th><Th>Permissions</Th><Th>Type</Th><Th /></tr></thead><tbody>{roles.map((r) => (
        <tr key={r.id} className="cursor-pointer border-b border-border hover:bg-muted/50" onClick={() => setEdit(r)}><td className="px-2 py-2"><p className="font-medium">{String(r.name)}</p><p className="text-xs text-muted-foreground">{String(r.description ?? "")}</p></td><td className="px-2 py-2 font-mono text-xs">{String(r.key)}</td><td className="px-2 py-2">{count(r.key)}</td><td className="px-2 py-2">{permCount(r.permissions)}</td><td className="px-2 py-2"><Badge tone={r.type === "Custom" ? "info" : "muted"}>{String(r.type ?? "Custom")}</Badge></td>
          <td className="px-2 py-2 text-right">{r.type === "Custom" && <button type="button" aria-label={`Delete ${r.name}`} className="text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); if (count(r.key)) return alert("Reassign its users first"); if (confirm(`Delete ${r.name}?`)) deleteRecord("roles", r.id); }}><Trash2 className="size-4" /></button>}</td></tr>
      ))}</tbody></table></Card>
      {edit && <RoleDialog role={edit === "new" ? undefined : edit} onClose={() => setEdit(null)} />}
    </div>
  );
}

function RoleDialog({ role, onClose }: { role?: Rec; onClose: () => void }) {
  const locked = role?.type === "Locked";
  const [f, setF] = useState({ name: String(role?.name ?? ""), level: String(role?.level ?? "Standard"), description: String(role?.description ?? "") });
  const [perms, setPerms] = useState<Record<string, string[]>>(() => ({ ...((role?.permissions as Record<string, string[]>) ?? {}) }));
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [err, setErr] = useState("");
  const total = permCount(perms);
  const hidden = PERM_TREE.filter((g) => !g.items.some((i) => perms[i.href]?.length)).length;
  const toggleItem = (href: string, on: boolean) => setPerms((p) => { const n = { ...p }; if (on) n[href] = f.level === "Read Only" ? ["view"] : [...ACTIONS]; else delete n[href]; return n; });
  const toggleAction = (href: string, a: string) => setPerms((p) => { const cur = p[href] ?? []; const next = cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]; const n = { ...p }; if (next.length) n[href] = next.includes("view") ? next : ["view", ...next]; else delete n[href]; return n; });
  const groups = PERM_TREE.map((g) => ({ ...g, items: g.items.filter((i) => !q || `${g.label} ${i.label}`.toLowerCase().includes(q.toLowerCase())) })).filter((g) => g.items.length);
  function save() {
    if (!f.name.trim()) return setErr("Name is required");
    const key = f.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
    if (!role && readCollection("roles").some((r) => r.key === key)) return setErr("A role with this name exists");
    if (role) updateRecord("roles", role.id, { ...f, permissions: perms }); else createRecord("roles", { ...f, key, type: "Custom", permissions: perms });
    onClose();
  }
  return (
    <Dialog open onClose={onClose} title={role ? (locked ? String(role.name) : `Edit ${role.name}`) : "New role"} description={locked ? "Built-in role — permissions are fixed." : "Define what this role can do. You can assign it to users afterwards."} className="max-h-[92vh] max-w-3xl overflow-y-auto">
      <fieldset disabled={locked} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Name"><input aria-label="Role name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Access level" hint={LEVELS.find((l) => l.value === f.level)?.hint}><Select ariaLabel="Access level" disabled={locked} value={f.level} onChange={(v) => setF({ ...f, level: v })} options={LEVELS} /></Field></div>
        <Field label="Description"><input aria-label="Role description" placeholder="What this role is for" className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm font-medium">Permissions <Badge>{total}</Badge></p><p className="text-xs text-muted-foreground">Tick what this role can reach, then open a row for what they can do there. A main menu with nothing selected under it is hidden from their sidebar.</p></div><div className="relative"><Search className="absolute left-2.5 top-2 size-4 text-muted-foreground" /><input aria-label="Filter menus and permissions" placeholder="Filter menus and permissions" className={cn(inputCls, "h-8 pl-8")} value={q} onChange={(e) => setQ(e.target.value)} /></div></div>
        <p className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-xs"><EyeOff className="size-3.5" />{hidden} of {PERM_TREE.length} main menus will be hidden from this role.</p>
        <div className="space-y-1">{groups.map((g) => { const on = g.items.filter((i) => perms[i.href]?.length).length; const isOpen = open === g.key || !!q; return (
          <div key={g.key} className="rounded-md border border-border">
            <div className="flex items-center gap-2 px-3 py-2"><input type="checkbox" aria-label={`All of ${g.label}`} checked={on === g.items.length} ref={(el) => { if (el) el.indeterminate = on > 0 && on < g.items.length; }} onChange={(e) => g.items.forEach((i) => toggleItem(i.href, e.target.checked))} /><button type="button" className="flex flex-1 items-center gap-2 text-left text-sm font-medium" onClick={() => setOpen(isOpen && !q ? null : g.key)}>{g.label}{!on && <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 text-[10px] text-muted-foreground"><EyeOff className="size-3" />Hidden</span>}<span className="ml-auto text-xs text-muted-foreground">{on}/{g.items.length}</span>{isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</button></div>
            {isOpen && <div className="border-t border-border px-3 py-2">{g.items.map((i) => <div key={i.href} className="flex flex-wrap items-center gap-3 py-1 text-sm"><label className="flex w-56 items-center gap-2"><input type="checkbox" checked={!!perms[i.href]?.length} onChange={(e) => toggleItem(i.href, e.target.checked)} />{i.label}</label>{ACTIONS.map((a) => <label key={a} className="flex items-center gap-1 text-xs text-muted-foreground"><input type="checkbox" checked={!!perms[i.href]?.includes(a)} onChange={() => toggleAction(i.href, a)} />{a}</label>)}</div>)}</div>}
          </div>
        ); })}</div>
      </fieldset>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={onClose}>{locked ? "Close" : "Cancel"}</button>{!locked && <button type="button" className={btn.primary} onClick={save}>{role ? "Save role" : "Create role"}</button>}</div>
    </Dialog>
  );
}

/* ---------- templates ---------- */

export function Templates() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/settings/templates");
  const tpls = useCollection("doc-templates");
  const [type, setType] = useState("");
  const [preview, setPreview] = useState<Rec | null>(null);
  const { node, flash } = useFlash();
  useEffect(() => { const t = setTimeout(seedTemplates, 0); return () => clearTimeout(t); }, []);
  const shown = tpls.filter((t) => !type || t.type === type);
  const makeDefault = (t: Rec) => { for (const x of tpls.filter((y) => y.type === t.type && y.isDefault)) updateRecord("doc-templates", x.id, { isDefault: false }); updateRecord("doc-templates", t.id, { isDefault: true }); flash(`${t.name} is now the default`); };
  const sel = tpls.find((t) => t.id === sub);
  return (
    <div className="space-y-4">
      <PageHeader title="Document Templates" subtitle="Browse your world-class template gallery, set defaults, and customize." actions={<><button type="button" className={btn.outline} onClick={() => { const before = tpls.length; const missing = readCollection("doc-templates").length; if (!missing) seedTemplates(); flash(before ? "The template library is already installed" : "Library installed"); }}>Install Library</button><Link href="/settings/templates/new" className={btn.primary}><Plus /> New Template</Link></>} />
      <div className="flex items-center gap-3"><Select ariaLabel="Template type" className="w-56" value={type} onChange={setType} options={[{ value: "", label: "All Types" }, ...TEMPLATE_TYPES.map((t) => ({ value: t, label: `${t}s` }))]} /><span className="text-sm text-muted-foreground">{shown.length} templates</span></div>
      {TEMPLATE_TYPES.filter((t) => shown.some((x) => x.type === t)).map((t) => <div key={t} className="space-y-2"><p className="font-semibold">{t}s <span className="text-xs text-muted-foreground">{shown.filter((x) => x.type === t).length}</span></p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{shown.filter((x) => x.type === t).map((x) => <Card key={x.id}><div className="space-y-2 p-3">
          <button type="button" className="block h-36 w-full overflow-hidden rounded-md border border-border bg-white" onClick={() => setPreview(x)} aria-label={`Preview ${x.name}`}><iframe title={String(x.name)} srcDoc={renderTemplate(String(x.html), SAMPLE_DOC)} className="pointer-events-none h-[560px] w-[800px] origin-top-left scale-[0.3]" /></button>
          <div className="flex items-center justify-between"><p className="text-sm font-semibold">{String(x.name)}</p>{x.isDefault ? <Badge tone="success">Default</Badge> : null}</div>
          <p className="text-xs text-muted-foreground">{String(x.description ?? "")}</p>
          <div className="flex flex-wrap gap-2 text-xs">{!x.isDefault && <button type="button" className="text-primary underline" onClick={() => makeDefault(x)}>Set Default</button>}<Link className="underline" href={`/settings/templates/${x.id}`}>Edit</Link><button type="button" className="underline" onClick={() => { createRecord("doc-templates", { ...omitId(x), name: `${x.name} (copy)`, isDefault: false, builtIn: false }); flash("Duplicated"); }}>Duplicate</button>{!x.builtIn && !x.isDefault && <button type="button" className="text-destructive underline" onClick={() => deleteRecord("doc-templates", x.id)}>Delete</button>}</div>
        </div></Card>)}</div></div>)}
      {preview && <Dialog open onClose={() => setPreview(null)} title={String(preview.name)} className="max-w-4xl"><iframe title="Template preview" srcDoc={`<style>${preview.css ?? ""}</style>${renderTemplate(String(preview.html), SAMPLE_DOC)}`} className="h-[70vh] w-full rounded-md border border-border bg-white" /></Dialog>}
      {(sub === "new" || sel) && <SidePanel onClose={() => router.push("/settings/templates")} defaultExpanded><TemplateForm key={sub} record={sel} onDone={() => router.push("/settings/templates")} /></SidePanel>}
      {node}
    </div>
  );
}

function TemplateForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const [f, setF] = useState({ name: String(record?.name ?? ""), type: String(record?.type ?? "Invoice"), isDefault: Boolean(record?.isDefault), description: String(record?.description ?? ""), html: String(record?.html ?? baseTemplate("Standard", "Invoice")), css: String(record?.css ?? "") });
  const [show, setShow] = useState(true);
  const [err, setErr] = useState("");
  function save() {
    if (!f.name.trim()) return setErr("Template name is required");
    if ((f.html.match(/{{#each/g) ?? []).length !== (f.html.match(/{{\/each}}/g) ?? []).length) return setErr("Unbalanced {{#each}} … {{/each}} blocks");
    if (f.isDefault) for (const x of readCollection("doc-templates").filter((y) => y.type === f.type && y.isDefault && y.id !== record?.id)) updateRecord("doc-templates", x.id, { isDefault: false });
    if (record) updateRecord("doc-templates", record.id, f); else createRecord("doc-templates", { ...f, builtIn: false });
    onDone();
  }
  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-semibold">{record ? `Edit ${record.name}` : "New Template"}</h2><p className="text-sm text-muted-foreground">Create a document template for any document type</p></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><div className="space-y-3 p-5"><CardTitle>Template Details</CardTitle>
          <Field label="Template Name"><input aria-label="Template Name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Template Type"><Select ariaLabel="Template Type" value={f.type} onChange={(v) => setF({ ...f, type: v })} options={TEMPLATE_TYPES} /></Field>
          <Switch checked={f.isDefault} onChange={(v) => setF({ ...f, isDefault: v })} label="Set as default" />
          <Field label="Description"><input aria-label="Template description" className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          <Field label="Template HTML (Handlebars)"><textarea aria-label="Template HTML" rows={14} spellCheck={false} className={cn(textareaCls, "font-mono text-xs")} value={f.html} onChange={(e) => setF({ ...f, html: e.target.value })} /></Field>
          <Field label="Styles (CSS)"><textarea aria-label="Template CSS" rows={4} spellCheck={false} className={cn(textareaCls, "font-mono text-xs")} value={f.css} onChange={(e) => setF({ ...f, css: e.target.value })} /></Field>
          <details className="text-xs text-muted-foreground"><summary className="cursor-pointer font-medium">Variable Reference</summary><p className="mt-2 whitespace-pre-wrap font-mono">{`Company: {{companyName}}, {{companyAddress}}\nDocument: {{documentType}}, {{documentNumber}}, {{documentDate}}\nTotals: {{subtotal}}, {{taxAmount}}, {{totalAmount}}\nParty: {{customerName}} {{customerAddress}} / {{vendorName}} {{vendorAddress}}\nLines: {{#each lines}} {{this.lineNumber}} {{this.description}} {{this.quantity}} {{this.unitPrice}} {{this.lineTotal}} {{/each}}\nConditionals: {{#if notes}}…{{/if}}`}</p></details>
        </div></Card>
        <Card><div className="space-y-2 p-5"><div className="flex items-center justify-between"><CardTitle>Preview</CardTitle><button type="button" className={btn.smOutline} onClick={() => setShow(!show)}>{show ? <><EyeOff /> Hide Preview</> : <><Eye /> Show Preview</>}</button></div>
          {show && <iframe title="Live preview" srcDoc={`<style>${f.css}</style>${renderTemplate(f.html, SAMPLE_DOC)}`} className="h-[640px] w-full rounded-md border border-border bg-white" />}</div></Card>
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{record ? "Save Template" : "Create Template"}</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
    </div>
  );
}

/* ---------- posting preferences ---------- */

export function PostingPrefs() {
  const saved = useSetting<Record<string, boolean>>("posting-prefs", {});
  const [draft, setDraft] = useState<Record<string, boolean> | null>(null);
  const { node, flash } = useFlash();
  const cur = draft ?? Object.fromEntries(POSTING_TYPES.map((t) => [t.key, saved[t.key] !== false]));
  return (
    <div className="space-y-4">
      <PageHeader title="Posting Preferences" subtitle="Choose which transaction types post to the general ledger immediately when saved. Types that are off are saved as drafts and posted later." />
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-2"><div><CardTitle>Direct posting by transaction type</CardTitle><p className="mt-1 text-sm text-muted-foreground">Turn a type on to post it to the ledger the moment it is saved, or off to save it as a draft and post it later from System › Events.</p></div><div className="flex gap-2"><button type="button" className={btn.smOutline} onClick={() => setDraft(Object.fromEntries(POSTING_TYPES.map((t) => [t.key, true])))}>All on</button><button type="button" className={btn.smOutline} onClick={() => setDraft(Object.fromEntries(POSTING_TYPES.map((t) => [t.key, false])))}>All off</button></div></div>
        {POSTING_TYPES.map((t) => <div key={t.key} className="flex items-center justify-between gap-4 rounded-md border border-border p-3"><div><p className="font-medium">{t.label}</p><p className="text-xs text-muted-foreground">{t.desc} · {cur[t.key] ? "Posts immediately" : "Saved as draft"}</p></div><Switch checked={cur[t.key]} onChange={(v) => setDraft({ ...cur, [t.key]: v })} label={t.label} /></div>)}
        <button type="button" className={btn.primary} onClick={() => { saveSetting("posting-prefs", cur); setDraft(null); flash("Posting preferences saved"); }}>Save</button>
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- purchase charges ---------- */

export function PurchaseCharges() {
  const rows = useCollection("purchase-charges");
  const [f, setF] = useState({ name: "", accounting: "COST", split: "VALUE" });
  const { node, flash } = useFlash();
  const label = { COST: "Add to product cost", EXPENSE: "Expense" } as Record<string, string>;
  const split = { VALUE: "By line value", QTY: "By quantity", EQUAL: "Equal per line" } as Record<string, string>;
  return (
    <div className="space-y-4">
      <PageHeader title="Purchase Charges" subtitle="Charge types such as Shipping, Freight or Importing that can be added to purchase orders and goods receipts." />
      <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-end gap-2"><Field label="Name" className="flex-1"><input aria-label="Charge name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field><Field label="Accounting"><Select ariaLabel="Accounting" className="w-48" value={f.accounting} onChange={(v) => setF({ ...f, accounting: v })} options={Object.entries(label).map(([value, l]) => ({ value, label: l }))} /></Field><Field label="Split a PO-level charge"><Select ariaLabel="Split" className="w-44" value={f.split} onChange={(v) => setF({ ...f, split: v })} options={Object.entries(split).map(([value, l]) => ({ value, label: l }))} /></Field>
          <button type="button" className={btn.primary} disabled={!f.name.trim()} onClick={() => { if (rows.some((r) => String(r.name).toLowerCase() === f.name.trim().toLowerCase())) return flash("That charge type exists", true); createRecord("purchase-charges", { ...f, name: f.name.trim(), active: true }); setF({ ...f, name: "" }); }}>Add charge type</button></div>
        <p className="text-xs text-muted-foreground">&quot;Add to product cost&quot; charges raise each product&apos;s landed unit cost, so stock value and sale margin include them. &quot;Expense&quot; charges are posted to Shipping & Delivery when billed and never change product cost.</p>
        {rows.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">No charge types yet. Add Shipping, Freight or similar above.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Name</Th><Th>Accounting</Th><Th>Split</Th><Th>Active</Th><Th /></tr></thead><tbody>{rows.map((r) => <tr key={r.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{String(r.name)}</td><td className="px-2 py-2"><Select ariaLabel={`Accounting for ${r.name}`} size="sm" className="w-48" value={String(r.accounting)} onChange={(v) => updateRecord("purchase-charges", r.id, { accounting: v })} options={Object.entries(label).map(([value, l]) => ({ value, label: l }))} /></td><td className="px-2 py-2">{split[String(r.split)]}</td><td className="px-2 py-2"><Switch checked={r.active !== false} onChange={(v) => updateRecord("purchase-charges", r.id, { active: v })} label={`Active ${r.name}`} /></td><td className="px-2 py-2 text-right"><button type="button" aria-label={`Delete ${r.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecord("purchase-charges", r.id)}><Trash2 className="size-4" /></button></td></tr>)}</tbody></table>}
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- document numbering ---------- */

export function DocNumbering() {
  const cfgs = useCollection("doc-numbering");
  useCollection("invoices");
  // Previews read the stored documents, so they render after mount (not during SSR).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 0); return () => clearTimeout(t); }, []);
  const [edit, setEdit] = useState<{ coll: string; label: string; prefix: string; start: string; padding: string } | null>(null);
  const { node, flash } = useFlash();
  const total = NUMBERING.reduce((s, g) => s + g.items.length, 0);
  const preview = (coll: string, prefix: string) => { const c = cfgs.find((x) => x.coll === coll); const pre = String(c?.prefix ?? `${prefix}-`); const used = readCollection(coll).map((r) => String(r.number ?? r.sku ?? r.employeeNumber ?? r.recNumber ?? "")).filter((s) => s.startsWith(pre)).map((s) => Number(s.slice(pre.length)) || 0); const nx = c ? Math.max(Number(c.start) || 1, used.length ? Math.max(...used) + 1 : 0) : readCollection(coll).length + 1; return `${pre}${String(nx).padStart(Number(c?.padding ?? 2), "0")}`; };
  return (
    <div className="space-y-4">
      <PageHeader title="Document Numbering" subtitle="Set the prefix, starting number, current number and padding for each document type. Every type numbers itself with a short series (INV-01, PO-01 …) until you change it here." />
      <p className="text-sm text-muted-foreground">{total - cfgs.length} of {total} numbering automatically</p>
      {NUMBERING.map((g) => <Card key={g.group}><div className="p-5"><CardTitle className="mb-2">{g.group}</CardTitle><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Document</Th><Th>Next number</Th><Th>Padding</Th><Th>Status</Th><Th /></tr></thead><tbody>{g.items.map((i) => { const c = cfgs.find((x) => x.coll === i.coll); return (
        <tr key={i.coll} className="border-b border-border"><td className="px-2 py-2">{i.label}{i.auto && <p className="text-xs text-muted-foreground">Auto-numbered — the form no longer asks for one</p>}</td><td className="px-2 py-2 font-mono">{mounted ? preview(i.coll, i.prefix) : "—"}</td><td className="px-2 py-2">{String(c?.padding ?? 2)}</td><td className="px-2 py-2">{c ? <Badge tone="info">Custom</Badge> : <Badge>Automatic</Badge>}</td>
          <td className="px-2 py-2 text-right"><button type="button" className="text-xs text-primary underline" onClick={() => setEdit({ coll: i.coll, label: i.label, prefix: String(c?.prefix ?? `${i.prefix}-`), start: String(c?.start ?? 1), padding: String(c?.padding ?? 2) })}>Configure</button>{c && <button type="button" className="ml-3 text-xs underline" onClick={() => { deleteRecord("doc-numbering", c.id); flash(`${i.label} back to automatic`); }}>Reset</button>}</td></tr>
      ); })}</tbody></table></div></Card>)}
      {edit && <Dialog open onClose={() => setEdit(null)} title={`Configure — ${edit.label}`} description="Use {YYYY} or {MM} in the prefix for a series that restarts each year or month.">
        <div className="grid gap-3 sm:grid-cols-3"><Field label="Prefix"><input aria-label="Prefix" className={inputCls} value={edit.prefix} onChange={(e) => setEdit({ ...edit, prefix: e.target.value })} /></Field><Field label="Starting number"><input aria-label="Starting number" type="number" min="1" className={inputCls} value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} /></Field><Field label="Padding"><input aria-label="Padding" type="number" min="1" max="10" className={inputCls} value={edit.padding} onChange={(e) => setEdit({ ...edit, padding: e.target.value })} /></Field></div>
        <p className="text-sm">Next: <span className="font-mono">{edit.prefix.replace("{YYYY}", String(new Date().getFullYear())).replace("{MM}", String(new Date().getMonth() + 1).padStart(2, "0"))}{String(Math.max(1, Number(edit.start) || 1)).padStart(Number(edit.padding) || 1, "0")}</span> (or the next unused number after existing ones)</p>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setEdit(null)}>Cancel</button><button type="button" className={btn.primary} onClick={() => { if (!edit.prefix.trim()) return flash("Enter a prefix", true); const c = cfgs.find((x) => x.coll === edit.coll); const data = { coll: edit.coll, prefix: edit.prefix, start: Math.max(1, Number(edit.start) || 1), padding: Math.min(10, Math.max(1, Number(edit.padding) || 2)) }; if (c) updateRecord("doc-numbering", c.id, data); else createRecord("doc-numbering", data); setEdit(null); flash("Numbering saved"); }}>Save</button></div>
      </Dialog>}
      {node}
    </div>
  );
}

/* ---------- configurations ---------- */

export const CONFIG_DEFAULTS = { foc: false, deliveryWithInvoice: false, roundOff: false, additionalDiscounts: false, expiryDays: 30, overdueDays: 7 };
export function Configurations() {
  const saved = useSetting("configurations", CONFIG_DEFAULTS);
  const [days, setDays] = useState<{ expiryDays: string; overdueDays: string } | null>(null);
  const { node, flash } = useFlash();
  const set = (k: keyof typeof CONFIG_DEFAULTS, v: unknown) => { saveSetting("configurations", { ...saved, [k]: v }); flash("Saved"); };
  const d = days ?? { expiryDays: String(saved.expiryDays), overdueDays: String(saved.overdueDays) };
  const toggle = (k: "foc" | "deliveryWithInvoice" | "roundOff" | "additionalDiscounts", title: string, text: string) => <div className="flex items-start justify-between gap-4 rounded-md border border-border p-3"><div><p className="font-medium">{title}</p><p className="text-xs text-muted-foreground">{text}</p></div><Switch checked={Boolean(saved[k])} onChange={(v) => set(k, v)} label={title} /></div>;
  return (
    <div className="space-y-4">
      <PageHeader title="Configurations" subtitle="Switch optional features on or off for this company." />
      <Card><div className="space-y-3 p-5"><CardTitle>Sales</CardTitle><p className="text-sm text-muted-foreground">Options on sales documents.</p>
        {toggle("foc", "FOC on sales invoices", "Adds an FOC (free of charge) tick to each invoice line. A ticked line is given away: its price, discount and tax become zero, and the item still leaves stock.")}
        {toggle("deliveryWithInvoice", "Create delivery note with each invoice", "Saving a sales invoice also creates its delivery note and dispatches it, so the stock leaves the warehouse straight away. It can still be unticked on an invoice.")}
        {toggle("roundOff", "Round off on invoices and purchase bills", "Adds a Round off switch that rounds the grand total to the nearest whole unit. The difference posts to Round Off.")}
      </div></Card>
      <Card><div className="space-y-3 p-5"><CardTitle>Additional discounts</CardTitle><p className="text-sm text-muted-foreground">Fees and rebates given to customers against their invoices, booked as expenses.</p>{toggle("additionalDiscounts", "Additional discounts", "Shows Sales → Additional Discounts, where registration fees, listing fees, display and rebates are taken off posted invoices. Switching it off hides the screen; discounts already given stay as they are.")}</div></Card>
      <Card><div className="space-y-3 p-5"><CardTitle>Alerts</CardTitle><p className="text-sm text-muted-foreground">Daily notifications (bell icon) for stock nearing expiry and overdue invoices and bills.</p>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Expiry alert (days before expiry)" hint="Default for batch-tracked products. A product can set its own."><input aria-label="Expiry alert days" type="number" min="0" className={inputCls} value={d.expiryDays} onChange={(e) => setDays({ ...d, expiryDays: e.target.value })} /></Field><Field label="Overdue alert (days past due)" hint="Customer invoices and vendor bills unpaid this long after their due date."><input aria-label="Overdue alert days" type="number" min="0" className={inputCls} value={d.overdueDays} onChange={(e) => setDays({ ...d, overdueDays: e.target.value })} /></Field></div>
        <button type="button" className={btn.primary} onClick={() => { saveSetting("configurations", { ...saved, expiryDays: Math.max(0, Number(d.expiryDays) || 0), overdueDays: Math.max(0, Number(d.overdueDays) || 0) }); setDays(null); flash("Alert days saved"); }}>Save alert days</button>
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- custom fields ---------- */

const ENTITIES = [["customers", "Customers"], ["vendors", "Vendors"], ["products", "Products"], ["invoices", "Invoices"], ["bills", "Bills"], ["purchase-orders", "Purchase orders"], ["employees", "Employees"]];
const FTYPES = [["text", "Text"], ["number", "Number"], ["date", "Date"], ["boolean", "Yes / no"], ["select", "Select"]];
export function CustomFields() {
  const rows = useCollection("custom-fields");
  const [f, setF] = useState({ entity: "customers", label: "", type: "text", required: false, options: "" });
  const { node, flash } = useFlash();
  function add() {
    const label = f.label.trim();
    if (!label) return flash("Enter a label", true);
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    if (rows.some((r) => r.entity === f.entity && r.key === key)) return flash("That field already exists on this entity", true);
    if (f.type === "select" && !f.options.trim()) return flash("List the options, comma-separated", true);
    createRecord("custom-fields", { ...f, label, key, options: f.type === "select" ? f.options.split(",").map((s) => s.trim()).filter(Boolean) : [] });
    setF({ ...f, label: "", options: "", required: false }); flash("Field added");
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Custom Fields" subtitle="Define extra fields on core records — they appear automatically on the matching forms." />
      <Card><div className="flex flex-wrap items-end gap-2 p-5">
        <Field label="Entity"><Select ariaLabel="Entity" className="w-44" value={f.entity} onChange={(v) => setF({ ...f, entity: v })} options={ENTITIES.map(([value, label]) => ({ value, label }))} /></Field>
        <Field label="Label" className="flex-1"><input aria-label="Field label" className={inputCls} value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} /></Field>
        <Field label="Type"><Select ariaLabel="Field type" className="w-32" value={f.type} onChange={(v) => setF({ ...f, type: v })} options={FTYPES.map(([value, label]) => ({ value, label }))} /></Field>
        {f.type === "select" && <Field label="Options"><input aria-label="Options" placeholder="Gold, Silver, Bronze" className={inputCls} value={f.options} onChange={(e) => setF({ ...f, options: e.target.value })} /></Field>}
        <label className="flex h-9 items-center gap-2 text-sm"><input type="checkbox" checked={f.required} onChange={(e) => setF({ ...f, required: e.target.checked })} /> Required</label>
        <button type="button" className={btn.primary} onClick={add}>Add field</button>
      </div></Card>
      {rows.length === 0 ? <Card><div className="p-8 text-center text-sm text-muted-foreground">No custom fields defined yet.</div></Card> : ENTITIES.filter(([e]) => rows.some((r) => r.entity === e)).map(([e, l]) => <Card key={e}><div className="p-5"><CardTitle className="mb-2">{l}</CardTitle><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Label</Th><Th>Key</Th><Th>Type</Th><Th>Required</Th><Th /></tr></thead><tbody>{rows.filter((r) => r.entity === e).map((r) => <tr key={r.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{String(r.label)}</td><td className="px-2 py-2 font-mono text-xs">{String(r.key)}</td><td className="px-2 py-2">{FTYPES.find(([v]) => v === r.type)?.[1]}{(r.options as string[])?.length ? <span className="text-xs text-muted-foreground"> ({(r.options as string[]).join(", ")})</span> : null}</td><td className="px-2 py-2"><input type="checkbox" aria-label={`Required ${r.label}`} checked={Boolean(r.required)} onChange={(ev) => updateRecord("custom-fields", r.id, { required: ev.target.checked })} /></td><td className="px-2 py-2 text-right"><button type="button" aria-label={`Delete ${r.label}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecord("custom-fields", r.id)}><Trash2 className="size-4" /></button></td></tr>)}</tbody></table></div></Card>)}
      {node}
    </div>
  );
}

/* ---------- audit log ---------- */

export function AuditLog() {
  const log = useCollection("audit-log");
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Rec | null>(null);
  const rows = [...log].reverse().filter((r) => (!action || r.action === action) && (!q || `${r.table} ${r.summary} ${r.recordId}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-4">
      <PageHeader title="Audit Log" subtitle="Track every create, update and delete across the system" />
      <div className="flex flex-wrap gap-3"><Select ariaLabel="Action" className="w-40" value={action} onChange={setAction} options={[{ value: "", label: "All actions" }, { value: "INSERT", label: "INSERT" }, { value: "UPDATE", label: "UPDATE" }, { value: "DELETE", label: "DELETE" }]} /><input aria-label="Search the log" placeholder="Search table or record…" className={cn(inputCls, "max-w-xs")} value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <DataTable rows={rows} onRowClick={setSel} columns={[
        { key: "w", header: "When", cell: (r) => fmtWhen(r.at) },
        { key: "a", header: "Action", cell: (r) => <Badge tone={r.action === "DELETE" ? "destructive" : r.action === "INSERT" ? "success" : "info"}>{String(r.action)}</Badge> },
        { key: "t", header: "Table", cell: (r) => <span className="font-mono text-xs">{String(r.table)}</span> },
        { key: "s", header: "Record", cell: (r) => String(r.summary || String(r.recordId).slice(0, 8)) },
        { key: "b", header: "Changed by", cell: (r) => String(r.by) },
      ]} />
      {sel && <Dialog open onClose={() => setSel(null)} title={`${sel.action} · ${sel.table}`}><div className="space-y-1 text-sm"><p><span className="text-muted-foreground">When:</span> {fmtWhen(sel.at)}</p><p><span className="text-muted-foreground">Record id:</span> <span className="font-mono text-xs">{String(sel.recordId)}</span> <button type="button" aria-label="Copy id" onClick={() => navigator.clipboard?.writeText(String(sel.recordId))}><Copy className="inline size-3" /></button></p><p><span className="text-muted-foreground">Record:</span> {String(sel.summary || "—")}</p><p><span className="text-muted-foreground">Fields:</span> {((sel.fields as string[]) ?? []).join(", ") || "—"}</p><p><span className="text-muted-foreground">By:</span> {String(sel.by)}</p></div></Dialog>}
    </div>
  );
}
