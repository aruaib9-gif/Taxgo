"use client";

// System › platform pages: approval policies, integration clients, WhatsApp, cost categories,
// Tally import, posting events & rules, webhooks and website enquiries.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bot, Check, Copy, KeyRound, Plus, QrCode, Send, Trash2, Upload, X } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { postJournal, useAccounts } from "@/lib/ledger";
import { answer } from "@/lib/analyst";
import { CLIENT_EVENTS, EVENT_TYPES, SOURCE_EVENT, WEBHOOK_EVENTS, eventLabel, importTally, parseTally, randomKey, seedPostingRules, sha256, testWebhook, type TallyPreview } from "@/lib/system";
import { cn } from "@/lib/utils";
import { AccountPicker, Badge, Card, CardTitle, DataTable, Dialog, Field, PageHeader, SidePanel, Switch, btn, inputCls, money, num, textareaCls } from "@/components/accounting/kit";
import { Select } from "@/components/accounting/pickers";
import { subOf } from "@/components/purchasing/kit";
import { Th, useFlash } from "@/components/hr/people";
import { AnswerView } from "@/components/analytics/ai";

const fmtWhen = (iso: unknown) => (iso ? new Date(String(iso)).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const Toggle = ({ items, value, onChange }: { items: string[]; value: string[]; onChange: (v: string[]) => void }) => <div className="flex flex-wrap gap-2">{items.map((e) => <label key={e} className={cn("flex cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 font-mono text-xs", value.includes(e) ? "border-primary bg-primary/10" : "border-border")}><input type="checkbox" className="sr-only" checked={value.includes(e)} onChange={(ev) => onChange(ev.target.checked ? [...value, e] : value.filter((x) => x !== e))} />{value.includes(e) && <Check className="size-3" />}{e}</label>)}</div>;

/* ---------- approval policies ---------- */

const DOC_TYPES = ["Expense Claim", "Purchase Order", "Purchase Requisition", "Payroll Run", "Sales Proposal", "AR Invoice"];
export function ApprovalPolicies() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/approvals/policies");
  const rows = useCollection("approval-policies");
  const sel = rows.find((r) => r.id === sub);
  const close = () => router.push("/approvals/policies");
  return (
    <div className="space-y-4">
      <PageHeader title="Approval Policies" subtitle="Multi-level approval rules per document type & amount threshold" actions={<Link href="/approvals/policies/new" className={btn.primary}><Plus /> New policy</Link>} />
      {rows.length === 0 ? <Card><div className="p-10 text-center"><p className="font-semibold">No approval policies yet</p><p className="text-sm text-muted-foreground">Without a policy, submissions are auto-approved. Define a policy to require approvals above an amount threshold.</p></div></Card> : (
        <DataTable rows={rows} onRowClick={(r) => router.push(`/approvals/policies/${r.id}`)} columns={[
          { key: "n", header: "Name", cell: (r) => <span className="font-medium">{String(r.name)}</span> },
          { key: "d", header: "Document type", cell: (r) => String(r.docType) },
          { key: "r", header: "Amount range", cell: (r) => `${money(num(r.min))} – ${r.max == null || r.max === "" ? "unlimited" : money(num(r.max))}` },
          { key: "l", header: "Levels", cell: (r) => ((r.levels as Rec[]) ?? []).map((l, i) => `${i + 1}. ${l.role} ×${l.count}`).join(" → ") },
          { key: "a", header: "Active", cell: (r) => <Badge tone={r.active === false ? "muted" : "success"}>{r.active === false ? "Inactive" : "Active"}</Badge> },
        ]} menu={(r) => [{ label: r.active === false ? "Activate" : "Deactivate", onSelect: () => updateRecord("approval-policies", r.id, { active: r.active === false }) }, { label: "Delete", destructive: true, onSelect: () => deleteRecord("approval-policies", r.id) }]} />
      )}
      <p className="text-xs text-muted-foreground">The policy that matches a document type and amount (smallest range first) decides who must approve; documents outside every range auto-approve.</p>
      {(sub === "new" || sel) && <SidePanel onClose={close}><PolicyForm key={sub} record={sel} onDone={close} /></SidePanel>}
    </div>
  );
}
function PolicyForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const roles = useCollection("roles");
  const [f, setF] = useState({ name: String(record?.name ?? ""), docType: String(record?.docType ?? "Expense Claim"), min: String(record?.min ?? "0"), max: String(record?.max ?? ""), description: String(record?.description ?? "") });
  const [levels, setLevels] = useState<{ role: string; count: number }[]>(((record?.levels as { role: string; count: number }[]) ?? [{ role: "Manager", count: 1 }]));
  const [err, setErr] = useState("");
  const roleOpts = ["Manager", ...roles.map((r) => String(r.key))];
  function save() {
    if (!f.name.trim()) return setErr("Name is required");
    if (f.max !== "" && num(f.max) < num(f.min)) return setErr("Max amount must be above the min amount");
    if (!levels.length) return setErr("Add at least one approval level");
    const clash = readCollection("approval-policies").find((p) => p.id !== record?.id && p.docType === f.docType && p.active !== false && num(f.min) <= (p.max === "" || p.max == null ? Infinity : num(p.max)) && num(p.min) <= (f.max === "" ? Infinity : num(f.max)));
    if (clash) return setErr(`Overlaps “${clash.name}” for the same document type`);
    const data = { ...f, name: f.name.trim(), min: num(f.min), max: f.max === "" ? "" : num(f.max), levels, active: record?.active ?? true };
    if (record) updateRecord("approval-policies", record.id, data); else createRecord("approval-policies", data);
    onDone();
  }
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">{record ? `Edit ${record.name}` : "New policy"}</h2>
      <Card><div className="space-y-3 p-5"><CardTitle>{record ? "Approval policy" : "New approval policy"}</CardTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Name *"><input aria-label="Policy name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Document type *"><Select ariaLabel="Document type" value={f.docType} onChange={(v) => setF({ ...f, docType: v })} options={DOC_TYPES} /></Field>
          <Field label="Min amount"><input aria-label="Min amount" type="number" className={inputCls} value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></Field>
          <Field label="Max amount (blank = unlimited)"><input aria-label="Max amount" type="number" className={inputCls} value={f.max} onChange={(e) => setF({ ...f, max: e.target.value })} /></Field>
          <Field label="Description" className="sm:col-span-2"><textarea aria-label="Policy description" rows={2} className={textareaCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        </div>
        <div className="flex items-center justify-between"><p className="text-sm font-medium">Approval levels (in order)</p><button type="button" className={btn.smOutline} onClick={() => setLevels([...levels, { role: "admin", count: 1 }])}><Plus /> Add level</button></div>
        {levels.map((l, i) => <div key={i} className="flex items-center gap-2"><span className="w-6 text-center text-sm font-semibold">{i + 1}</span><Select ariaLabel={`Level ${i + 1} role`} className="flex-1" value={l.role} onChange={(v) => setLevels(levels.map((x, j) => (j === i ? { ...x, role: v } : x)))} options={roleOpts} /><input aria-label={`Level ${i + 1} approvals`} type="number" min="1" className={cn(inputCls, "w-20")} value={l.count} onChange={(e) => setLevels(levels.map((x, j) => (j === i ? { ...x, count: Math.max(1, num(e.target.value)) } : x)))} /><button type="button" aria-label="Remove level" className="text-muted-foreground hover:text-destructive" onClick={() => setLevels(levels.filter((_, j) => j !== i))}><X className="size-4" /></button></div>)}
        <p className="text-xs text-muted-foreground">Right-most column is the number of required approvals at that level (for example, 2 means two different people with the role must approve).</p>
      </div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{record ? "Save policy" : "Create policy"}</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
    </div>
  );
}

/* ---------- integration clients ---------- */

export function Integrations() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/settings/integrations");
  const rows = useCollection("integration-clients");
  const [shown, setShown] = useState<{ name: string; key: string } | null>(null);
  const close = () => router.push("/settings/integrations");
  async function issue(id: string, name: string) { const key = randomKey("tg_live"); const r = readCollection("integration-clients").find((x) => x.id === id)!; updateRecord("integration-clients", id, { keys: [...((r.keys as Rec[]) ?? []).map((k) => ({ ...k, revoked: true })), { prefix: key.slice(0, 12), hash: await sha256(key), createdAt: new Date().toISOString() }] }); setShown({ name, key }); }
  return (
    <div className="space-y-4">
      <PageHeader title="Integration Clients" subtitle="Manage external system integrations and API keys" actions={<Link href="/settings/integrations/new" className={btn.primary}><Plus /> New Client</Link>} />
      <DataTable rows={rows} columns={[
        { key: "n", header: "Name", cell: (r) => <span className="font-medium">{String(r.name)}</span> },
        { key: "s", header: "Status", cell: (r) => <Badge tone={r.status === "ACTIVE" ? "success" : "muted"}>{String(r.status)}</Badge> },
        { key: "k", header: "API Keys", cell: (r) => ((r.keys as Rec[]) ?? []).filter((k) => !k.revoked).map((k) => <span key={String(k.prefix)} className="font-mono text-xs">{String(k.prefix)}…</span>) },
        { key: "e", header: "Events", cell: (r) => num(r.eventCount) },
        { key: "rl", header: "Rate Limit", cell: (r) => `${num(r.rpm)}/min · ${num(r.rpd)}/day` },
        { key: "ae", header: "Allowed Events", cell: (r) => (((r.events as string[]) ?? []).length ? ((r.events as string[]) ?? []).join(", ") : "All") },
        { key: "c", header: "Created", cell: (r) => fmtWhen(r.createdAt) },
      ]} menu={(r) => [{ label: "Rotate API key", onSelect: () => issue(r.id, String(r.name)) }, { label: r.status === "ACTIVE" ? "Suspend" : "Activate", onSelect: () => updateRecord("integration-clients", r.id, { status: r.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE" }) }, { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${r.name}? Its keys stop working.`) && deleteRecord("integration-clients", r.id) }]} />
      {sub === "new" && <SidePanel onClose={close}><ClientForm onDone={async (id, name) => { close(); await issue(id, name); }} onCancel={close} /></SidePanel>}
      <Dialog open={!!shown} onClose={() => setShown(null)} title={<span className="flex items-center gap-2"><KeyRound className="size-5" /> API key for {shown?.name}</span>} description="Copy it now — only a hash is stored, so it can't be shown again.">
        <code className="block break-all rounded-md bg-muted p-3 text-xs">{shown?.key}</code>
        <div className="flex justify-end"><button type="button" className={btn.primary} onClick={() => { navigator.clipboard?.writeText(shown?.key ?? ""); setShown(null); }}><Copy /> Copy & close</button></div>
      </Dialog>
    </div>
  );
}
function ClientForm({ onDone, onCancel }: { onDone: (id: string, name: string) => void; onCancel: () => void }) {
  const [f, setF] = useState({ name: "", description: "", email: "", rpm: "60", rpd: "10000", callbackUrl: "", callbackSecret: "" });
  const [events, setEvents] = useState<string[]>([]);
  const [err, setErr] = useState("");
  function save() {
    if (!f.name.trim()) return setErr("Name is required");
    if (f.callbackUrl && !/^https?:\/\//.test(f.callbackUrl)) return setErr("Callback URL must start with http(s)://");
    const r = createRecord("integration-clients", { ...f, name: f.name.trim(), rpm: num(f.rpm), rpd: num(f.rpd), events, status: "ACTIVE", keys: [], eventCount: 0 });
    onDone(r.id, String(r.name));
  }
  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-semibold">New Integration Client</h2><p className="text-sm text-muted-foreground">Register an external system for API access</p></div>
      <Card><div className="space-y-3 p-5"><CardTitle>Client Details</CardTitle>
        <Field label="Name"><input aria-label="Client name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Description"><input aria-label="Client description" className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Contact Email"><input aria-label="Contact Email" type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      </div></Card>
      <Card><div className="grid gap-3 p-5 sm:grid-cols-2"><CardTitle className="sm:col-span-2">Rate Limits</CardTitle><Field label="Requests per minute"><input aria-label="Requests per minute" type="number" className={inputCls} value={f.rpm} onChange={(e) => setF({ ...f, rpm: e.target.value })} /></Field><Field label="Requests per day"><input aria-label="Requests per day" type="number" className={inputCls} value={f.rpd} onChange={(e) => setF({ ...f, rpd: e.target.value })} /></Field></div></Card>
      <Card><div className="space-y-2 p-5"><CardTitle>Allowed Event Types</CardTitle><p className="text-xs text-muted-foreground">Select which event types this client can submit. Leave all unchecked to allow all types.</p><Toggle items={CLIENT_EVENTS} value={events} onChange={setEvents} /></div></Card>
      <Card><div className="space-y-3 p-5"><CardTitle>Webhook Callback (Optional)</CardTitle><Field label="Callback URL" hint="Receive notifications when events are processed."><input aria-label="Callback URL" className={inputCls} value={f.callbackUrl} onChange={(e) => setF({ ...f, callbackUrl: e.target.value })} /></Field><Field label="Callback Secret"><input aria-label="Callback Secret" className={inputCls} value={f.callbackSecret} onChange={(e) => setF({ ...f, callbackSecret: e.target.value })} /></Field></div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>Create Client</button><button type="button" className={btn.outline} onClick={onCancel}>Cancel</button></div>
    </div>
  );
}

/* ---------- WhatsApp ---------- */

export function WhatsApp() {
  const ops = useCollection("wa-operators");
  const tasks = useCollection("wa-tasks");
  const log = useCollection("wa-log");
  const [tab, setTab] = useState("Connection");
  const [op, setOp] = useState({ phone: "", name: "", autonomy: "CONFIRM" });
  const [task, setTask] = useState({ text: "", time: "09:00", operatorId: "" });
  const [test, setTest] = useState({ operatorId: "", text: "" });
  const [qr, setQr] = useState(false);
  const { node, flash } = useFlash();
  function send() {
    const o = ops.find((x) => x.id === test.operatorId);
    if (!o) return flash("Pick an operator to send as", true);
    if (!test.text.trim()) return;
    const a = answer(test.text, "assistant");
    createRecord("wa-log", { phone: o.phone, from: o.name, text: test.text.trim(), reply: a.text, answer: a, at: new Date().toISOString() });
    setTest({ ...test, text: "" });
  }
  return (
    <div className="space-y-4">
      <PageHeader title="WhatsApp" subtitle="Pair a WhatsApp number, authorize operators, and run the entire system from chat" />
      <div className="inline-flex rounded-lg bg-muted p-1">{["Connection", "Operators", "Scheduled Tasks", "Message Log"].map((t) => <button key={t} type="button" onClick={() => setTab(t)} className={cn("rounded-md px-3 py-1 text-sm", tab === t ? "bg-background font-medium shadow" : "text-muted-foreground")}>{t}</button>)}</div>
      {tab === "Connection" && <div className="grid gap-4 lg:grid-cols-2">
        <Card><div className="space-y-3 p-5"><div className="flex items-center justify-between"><CardTitle>WhatsApp connection</CardTitle><Badge>Not connected</Badge></div><p className="text-sm text-muted-foreground">Pair a dedicated business WhatsApp number. People you authorize as operators can then run the whole system by chatting with it.</p>
          <p className="rounded-md border border-warning/30 bg-warning/10 p-3 text-xs">Demo mode. There is no WhatsApp engine behind this browser app, so the QR is a placeholder — scanning it won&apos;t connect a phone. Use the Message Log tab to try the operator conversation here.</p>
          {qr ? <div className="flex size-48 items-center justify-center rounded-md border border-dashed border-border"><QrCode className="size-24 text-muted-foreground" /></div> : <button type="button" className={btn.primary} onClick={() => setQr(true)}>Connect WhatsApp</button>}</div></Card>
        <Card><div className="space-y-2 p-5 text-sm"><CardTitle>Before you connect</CardTitle><p><strong>Use a dedicated number.</strong> This connection automates WhatsApp Web for the paired number. Use a separate business number — not a personal one — and keep the phone online.</p><p><strong>Only authorized numbers can operate.</strong> Messages from numbers not in the Operators list are politely refused. Each operator acts with the permissions of the linked user account.</p><p><strong>Writes need confirmation.</strong> By default the assistant asks the operator to reply YES before posting invoices, bills or journal entries. Full autonomy can be granted per operator.</p><p><strong>Note on WhatsApp terms.</strong> Automating a regular WhatsApp account is not officially supported by WhatsApp; heavy outbound volume can get a number restricted.</p></div></Card>
      </div>}
      {tab === "Operators" && <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-end gap-2"><Field label="Phone (with country code)"><input aria-label="Operator phone" placeholder="+14165550123" className={inputCls} value={op.phone} onChange={(e) => setOp({ ...op, phone: e.target.value })} /></Field><Field label="Name"><input aria-label="Operator name" className={inputCls} value={op.name} onChange={(e) => setOp({ ...op, name: e.target.value })} /></Field><Field label="Autonomy"><Select ariaLabel="Autonomy" className="w-56" value={op.autonomy} onChange={(v) => setOp({ ...op, autonomy: v })} options={[{ value: "READ", label: "Read only" }, { value: "CONFIRM", label: "Writes need YES" }, { value: "FULL", label: "Full autonomy" }]} /></Field>
          <button type="button" className={btn.primary} onClick={() => { if (!/^\+\d{8,15}$/.test(op.phone.replace(/\s/g, ""))) return flash("Enter the number as +<country><number>", true); if (ops.some((o) => o.phone === op.phone.replace(/\s/g, ""))) return flash("Already an operator", true); createRecord("wa-operators", { ...op, phone: op.phone.replace(/\s/g, ""), name: op.name.trim() || op.phone }); setOp({ phone: "", name: "", autonomy: "CONFIRM" }); }}>Add operator</button></div>
        {ops.length === 0 ? <p className="text-sm text-muted-foreground">No operators yet.</p> : <table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Phone</Th><Th>Name</Th><Th>Autonomy</Th><Th /></tr></thead><tbody>{ops.map((o) => <tr key={o.id} className="border-b border-border"><td className="px-2 py-2 font-mono text-xs">{String(o.phone)}</td><td className="px-2 py-2">{String(o.name)}</td><td className="px-2 py-2"><Select ariaLabel={`Autonomy for ${o.name}`} size="sm" className="w-48" value={String(o.autonomy)} onChange={(v) => updateRecord("wa-operators", o.id, { autonomy: v })} options={[{ value: "READ", label: "Read only" }, { value: "CONFIRM", label: "Writes need YES" }, { value: "FULL", label: "Full autonomy" }]} /></td><td className="px-2 py-2 text-right"><button type="button" aria-label={`Remove ${o.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecord("wa-operators", o.id)}><Trash2 className="size-4" /></button></td></tr>)}</tbody></table>}
      </div></Card>}
      {tab === "Scheduled Tasks" && <Card><div className="space-y-3 p-5">
        <p className="text-sm text-muted-foreground">Questions sent to an operator on a daily schedule, e.g. “Show me overdue receivables” at 09:00.</p>
        <div className="flex flex-wrap items-end gap-2"><Field label="Question" className="flex-1"><input aria-label="Task question" className={inputCls} value={task.text} onChange={(e) => setTask({ ...task, text: e.target.value })} /></Field><Field label="Daily at"><input aria-label="Task time" type="time" className={cn(inputCls, "w-28")} value={task.time} onChange={(e) => setTask({ ...task, time: e.target.value })} /></Field><Field label="Send to"><Select ariaLabel="Task operator" className="w-48" value={task.operatorId} onChange={(v) => setTask({ ...task, operatorId: v })} placeholder="Operator…" options={ops.map((o) => ({ value: o.id, label: String(o.name) }))} /></Field><button type="button" className={btn.primary} onClick={() => { if (!task.text.trim() || !task.operatorId) return flash("Question and operator are required", true); createRecord("wa-tasks", { ...task, active: true }); setTask({ text: "", time: "09:00", operatorId: task.operatorId }); }}>Add task</button></div>
        {tasks.length === 0 ? <p className="text-sm text-muted-foreground">No scheduled tasks.</p> : <table className="w-full text-sm"><tbody>{tasks.map((t) => <tr key={t.id} className="border-b border-border"><td className="px-2 py-2">{String(t.text)}</td><td className="px-2 py-2">{String(t.time)}</td><td className="px-2 py-2">{String(ops.find((o) => o.id === t.operatorId)?.name ?? "—")}</td><td className="px-2 py-2"><Switch checked={t.active !== false} onChange={(v) => updateRecord("wa-tasks", t.id, { active: v })} label="Active" /></td><td className="px-2 py-2 text-right"><button type="button" className="mr-3 text-xs text-primary underline" onClick={() => { const o = ops.find((x) => x.id === t.operatorId); const a = answer(String(t.text), "assistant"); createRecord("wa-log", { phone: o?.phone, from: "Scheduled task", text: t.text, reply: a.text, answer: a, at: new Date().toISOString() }); flash("Ran now — see Message Log"); }}>Run now</button><button type="button" aria-label="Delete task" className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecord("wa-tasks", t.id)}><Trash2 className="inline size-4" /></button></td></tr>)}</tbody></table>}
      </div></Card>}
      {tab === "Message Log" && <Card><div className="space-y-3 p-5">
        <div className="flex flex-wrap items-end gap-2 rounded-md border border-border p-3"><Bot className="mb-2 size-5 text-primary" /><Field label="Send as operator"><Select ariaLabel="Send as operator" className="w-48" value={test.operatorId} onChange={(v) => setTest({ ...test, operatorId: v })} placeholder="Operator…" options={ops.map((o) => ({ value: o.id, label: String(o.name) }))} /></Field><Field label="Message" className="flex-1"><input aria-label="WhatsApp message" placeholder="What's my cash balance?" className={inputCls} value={test.text} onChange={(e) => setTest({ ...test, text: e.target.value })} onKeyDown={(e) => e.key === "Enter" && send()} /></Field><button type="button" className={btn.primary} onClick={send}><Send /> Send</button></div>
        {log.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p> : [...log].reverse().map((m) => <div key={m.id} className="space-y-1 border-b border-border pb-3"><p className="text-xs text-muted-foreground">{fmtWhen(m.at)} · {String(m.from)} {m.phone ? `(${m.phone})` : ""}</p><p className="ml-auto w-fit max-w-[80%] rounded-2xl bg-success/15 px-3 py-1.5 text-sm">{String(m.text)}</p><div className="max-w-[90%] rounded-2xl border border-border bg-card px-3 py-2">{m.answer ? <AnswerView a={m.answer as Parameters<typeof AnswerView>[0]["a"]} /> : String(m.reply)}</div></div>)}
      </div></Card>}
      {node}
    </div>
  );
}

/* ---------- cost categories ---------- */

export function CostCategories() {
  const cats = useCollection("cost-categories");
  const centres = useCollection("cost-centres");
  const classes = useCollection("cost-classes");
  const [name, setName] = useState("");
  const [centre, setCentre] = useState<Record<string, string>>({});
  const [cls, setCls] = useState<{ name: string; category: string; split: Record<string, string> }>({ name: "", category: "", split: {} });
  const { node, flash } = useFlash();
  const catCentres = (id: string) => centres.filter((c) => c.categoryId === id);
  const total = Object.values(cls.split).reduce((s, v) => s + num(v), 0);
  return (
    <div className="space-y-4">
      <PageHeader title="Cost Categories" subtitle="Define cost categories and the cost centres under them" />
      <Card><div className="flex flex-wrap items-end gap-2 p-5"><Field label="New cost category" className="flex-1"><input aria-label="New cost category" placeholder="e.g. Departments" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></Field><button type="button" className={btn.primary} disabled={!name.trim()} onClick={() => { if (cats.some((c) => String(c.name).toLowerCase() === name.trim().toLowerCase())) return flash("That category exists", true); createRecord("cost-categories", { name: name.trim() }); setName(""); }}>Add</button></div></Card>
      {cats.length === 0 ? <Card><div className="p-8 text-center text-sm text-muted-foreground">No cost categories yet. Add one above.</div></Card> : cats.map((c) => <Card key={c.id}><div className="space-y-2 p-5">
        <div className="flex items-center justify-between"><CardTitle>{String(c.name)}</CardTitle><button type="button" aria-label={`Delete ${c.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => { if (catCentres(c.id).length) return flash("Delete its cost centres first", true); deleteRecord("cost-categories", c.id); }}><Trash2 className="size-4" /></button></div>
        <div className="flex flex-wrap gap-2">{catCentres(c.id).map((x) => <span key={x.id} className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-sm">{String(x.name)}<button type="button" aria-label={`Remove ${x.name}`} onClick={() => deleteRecord("cost-centres", x.id)}><X className="size-3" /></button></span>)}{!catCentres(c.id).length && <span className="text-sm text-muted-foreground">No cost centres yet.</span>}</div>
        <div className="flex gap-2"><input aria-label={`New cost centre in ${c.name}`} placeholder="New cost centre" className={cn(inputCls, "h-8 max-w-xs")} value={centre[c.id] ?? ""} onChange={(e) => setCentre({ ...centre, [c.id]: e.target.value })} /><button type="button" className={btn.smOutline} disabled={!centre[c.id]?.trim()} onClick={() => { createRecord("cost-centres", { name: centre[c.id].trim(), categoryId: c.id, category: c.name }); setCentre({ ...centre, [c.id]: "" }); }}>Add centre</button></div>
      </div></Card>)}
      <Card><div className="space-y-3 p-5"><CardTitle>Cost-centre classes</CardTitle><p className="text-sm text-muted-foreground">A class splits every voucher ledger line across cost centres at fixed percentages. Pick the class on the voucher screen — allocation happens automatically on Accept.</p>
        <div className="flex flex-wrap items-end gap-2"><Field label="Class name"><input aria-label="Class name" className={inputCls} value={cls.name} onChange={(e) => setCls({ ...cls, name: e.target.value })} /></Field><Field label="Cost category"><Select ariaLabel="Cost category" className="w-48" value={cls.category} onChange={(v) => setCls({ ...cls, category: v, split: {} })} placeholder="Cost category" options={cats.map((c) => ({ value: c.id, label: String(c.name) }))} /></Field></div>
        {cls.category && <div className="space-y-1">{catCentres(cls.category).map((x) => <div key={x.id} className="flex items-center gap-2 text-sm"><span className="w-40">{String(x.name)}</span><input aria-label={`Percent for ${x.name}`} type="number" className={cn(inputCls, "h-8 w-24")} value={cls.split[x.id] ?? ""} onChange={(e) => setCls({ ...cls, split: { ...cls.split, [x.id]: e.target.value } })} />%</div>)}<p className={cn("text-xs", Math.abs(total - 100) > 0.001 ? "text-destructive" : "text-success")}>Total {total}%</p>
          <button type="button" className={btn.smPrimary} onClick={() => { if (!cls.name.trim()) return flash("Name the class", true); if (Math.abs(total - 100) > 0.001) return flash("Percentages must add up to 100", true); createRecord("cost-classes", { name: cls.name.trim(), categoryId: cls.category, split: Object.fromEntries(Object.entries(cls.split).map(([k, v]) => [k, num(v)]).filter(([, v]) => v)) }); setCls({ name: "", category: "", split: {} }); flash("Class created"); }}>Create class</button></div>}
        {classes.length > 0 && <table className="w-full text-sm"><tbody>{classes.map((k) => <tr key={k.id} className="border-b border-border"><td className="px-2 py-2 font-medium">{String(k.name)}</td><td className="px-2 py-2 text-xs text-muted-foreground">{Object.entries((k.split as Record<string, number>) ?? {}).map(([id, p]) => `${centres.find((c) => c.id === id)?.name ?? "?"} ${p}%`).join(" · ")}</td><td className="px-2 py-2 text-right"><button type="button" aria-label={`Delete ${k.name}`} className="text-muted-foreground hover:text-destructive" onClick={() => deleteRecord("cost-classes", k.id)}><Trash2 className="size-4" /></button></td></tr>)}</tbody></table>}
      </div></Card>
      {node}
    </div>
  );
}

/* ---------- Tally import ---------- */

export function TallyImport() {
  const [file, setFile] = useState("");
  const [xml, setXml] = useState("");
  const [p, setP] = useState<TallyPreview | null>(null);
  const [done, setDone] = useState("");
  const [err, setErr] = useState("");
  return (
    <div className="space-y-4">
      <PageHeader title="Import from Tally" subtitle="Bring your Tally masters and vouchers in from an XML export" />
      <Card><div className="space-y-3 p-5"><CardTitle>1. Choose your Tally XML export</CardTitle>
        <Field label="Tally XML or Excel file"><input aria-label="Tally XML file" type="file" accept=".xml,.xlsx,.xls" className={cn(inputCls, "pt-1.5")} onChange={async (e) => { const f = e.target.files?.[0]; setP(null); setDone(""); setErr(""); if (!f) return; setFile(f.name); if (!/\.xml$/i.test(f.name)) { setErr("Excel exports aren't read here — export Masters and Day Book from Tally as XML (Export › XML)."); return; } setXml(await f.text()); }} /></Field>
        <div className="flex gap-2"><button type="button" className={btn.outline} disabled={!xml} onClick={() => setP(parseTally(xml))}>Preview</button><button type="button" className={btn.primary} disabled={!p || (!p.ledgers.some((l) => !l.exists) && !p.vouchers.some((v) => !v.exists))} onClick={() => { const r = importTally(p!); setDone(`Imported ${r.ledgers} ledger(s) and ${r.vouchers} voucher(s) from ${file}.`); setP(parseTally(xml)); }}><Upload /> Import</button></div>
        <p className="text-xs text-muted-foreground">Preview shows what will be created without writing anything. Import is safe to re-run — existing ledgers and vouchers are skipped.</p>
        {err && <p className="text-sm text-destructive">{err}</p>}{done && <p className="text-sm text-success">{done}</p>}
      </div></Card>
      {p && <>
        {p.errors.length > 0 && <Card><div className="space-y-1 p-5 text-sm text-destructive">{p.errors.map((e) => <p key={e}>{e}</p>)}</div></Card>}
        <Card><div className="p-5"><CardTitle className="mb-2">Ledgers ({p.ledgers.length})</CardTitle><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Name</Th><Th>Tally group</Th><Th>Becomes</Th><Th /></tr></thead><tbody>{p.ledgers.map((l) => <tr key={l.name} className="border-b border-border"><td className="px-2 py-1.5">{l.name}</td><td className="px-2 py-1.5">{l.parent}</td><td className="px-2 py-1.5">{l.kind === "CUSTOMER" ? "Customer" : l.kind === "VENDOR" ? "Vendor" : `${l.type.toLowerCase()} account`}</td><td className="px-2 py-1.5">{l.exists ? <Badge>Exists — skipped</Badge> : <Badge tone="success">New</Badge>}</td></tr>)}</tbody></table></div></Card>
        <Card><div className="p-5"><CardTitle className="mb-2">Vouchers ({p.vouchers.length})</CardTitle><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th>Date</Th><Th>Type</Th><Th>No.</Th><Th>Narration</Th><Th className="text-right">Amount</Th><Th /></tr></thead><tbody>{p.vouchers.map((v, i) => <tr key={i} className="border-b border-border"><td className="px-2 py-1.5">{v.date}</td><td className="px-2 py-1.5">{v.type}</td><td className="px-2 py-1.5">{v.number}</td><td className="px-2 py-1.5">{v.narration}</td><td className="px-2 py-1.5 text-right tabular-nums">{money(v.lines.filter((l) => l.amount < 0).reduce((s, l) => s - l.amount, 0))}</td><td className="px-2 py-1.5">{v.exists ? <Badge>Imported</Badge> : <Badge tone="success">New</Badge>}</td></tr>)}</tbody></table></div></Card>
      </>}
    </div>
  );
}

/* ---------- posting events ---------- */

export function PostingEvents() {
  const journals = useCollection("journal-entries");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const [help, setHelp] = useState(false);
  const { node, flash } = useFlash();
  const events = journals.filter((j) => SOURCE_EVENT[String(j.source)]).map((j) => { const lines = (j.lines as Rec[]) ?? []; return { j, type: SOURCE_EVENT[String(j.source)], status: j.status === "DRAFT" ? "PENDING" : "POSTED", debit: lines.reduce((s, l) => s + num(l.debit), 0), credit: lines.reduce((s, l) => s + num(l.credit), 0) }; }).filter((e) => (!status || e.status === status) && (!type || e.type === type)).reverse();
  const pending = events.filter((e) => e.status === "PENDING");
  return (
    <div className="space-y-4">
      <PageHeader title="Posting Events" subtitle="View and manage automated posting events" actions={<button type="button" className={btn.primary} disabled={!sel.length} onClick={() => { sel.forEach((id) => postJournal(id)); flash(`Posted ${sel.length} event(s) to the ledger`); setSel([]); }}>Post selected ({sel.length})</button>} />
      <div className="flex flex-wrap gap-3"><Select ariaLabel="Status" className="w-40" value={status} onChange={setStatus} options={[{ value: "", label: "All Statuses" }, ...["PENDING", "POSTED"].map((s) => ({ value: s, label: s }))]} /><Select ariaLabel="Event type" className="w-64" value={type} onChange={setType} options={[{ value: "", label: "All Event Types" }, ...EVENT_TYPES.flatMap((g) => g.items.map(([v, l]) => ({ value: v, label: l })))]} /></div>
      <p className="text-xs text-muted-foreground">Select pending events and use &quot;Post selected&quot; to write their journal entries to the ledger. Events are pending when Posting Preferences save that type as a draft.</p>
      <Card><table className="w-full text-sm"><thead><tr className="border-b border-border"><Th><input type="checkbox" aria-label="Select all pending" checked={!!pending.length && sel.length === pending.length} onChange={(e) => setSel(e.target.checked ? pending.map((x) => x.j.id) : [])} /></Th><Th>Event Type</Th><Th>Event Key</Th><Th>Status</Th><Th className="text-right">Debit</Th><Th className="text-right">Credit</Th><Th>Processed At</Th><Th>Retries</Th></tr></thead><tbody>{events.length === 0 ? <tr><td colSpan={8} className="h-20 text-center text-muted-foreground">No results.</td></tr> : events.map((e) => <tr key={e.j.id} className="border-b border-border"><td className="px-2 py-2">{e.status === "PENDING" && <input type="checkbox" aria-label={`Select ${e.j.number}`} checked={sel.includes(e.j.id)} onChange={(ev) => setSel(ev.target.checked ? [...sel, e.j.id] : sel.filter((x) => x !== e.j.id))} />}</td><td className="px-2 py-2">{eventLabel(e.type)}</td><td className="px-2 py-2"><Link className="text-primary" href={`/financial/journal-entries/${e.j.id}`}>{String(e.j.number)}</Link> <span className="text-xs text-muted-foreground">{String(e.j.description ?? "").slice(0, 50)}</span></td><td className="px-2 py-2"><Badge tone={e.status === "POSTED" ? "success" : "warning"}>{e.status}</Badge></td><td className="px-2 py-2 text-right tabular-nums">{money(e.debit)}</td><td className="px-2 py-2 text-right tabular-nums">{money(e.credit)}</td><td className="px-2 py-2">{e.status === "POSTED" ? fmtWhen(e.j.postedAt ?? e.j.createdAt) : "—"}</td><td className="px-2 py-2">0</td></tr>)}</tbody></table></Card>
      <button type="button" className="text-sm text-primary underline" onClick={() => setHelp(!help)}>How the Posting Engine Works</button>
      {help && <Card><div className="space-y-2 p-5 text-sm text-muted-foreground"><p>Every business document (invoice, bill, receipt, payment, POS sale, credit/debit note, bank fee…) raises a posting event when it is saved. The event carries the document&apos;s amounts.</p><p>If its type posts directly (System › Posting Preferences), the journal entry is written straight away and the event shows as POSTED. Otherwise the entry is saved as a draft and the event waits here as PENDING until you post it.</p><p>Posting Rules describe which accounts each event type debits and credits.</p></div></Card>}
      {node}
    </div>
  );
}

/* ---------- posting rules ---------- */

const AMOUNT_PATHS = ["total", "netAmount", "taxAmount", "amount", "discountAmount", "shipping", "costOfGoods"];
export function PostingRules() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/posting/rules");
  const rules = useCollection("posting-rules");
  useEffect(() => { const t = setTimeout(seedPostingRules, 0); return () => clearTimeout(t); }, []);
  const sel = rules.find((r) => r.id === sub);
  const close = () => router.push("/posting/rules");
  return (
    <div className="space-y-4">
      <PageHeader title="Posting Rules" subtitle="Configure automated journal entry posting rules" actions={<Link href="/posting/rules/new" className={btn.primary}><Plus /> New Rule</Link>} />
      <DataTable rows={[...rules].sort((a, b) => num(b.priority) - num(a.priority))} onRowClick={(r) => router.push(`/posting/rules/${r.id}`)} columns={[
        { key: "n", header: "Name", cell: (r) => <span className="font-medium">{String(r.name)}</span> },
        { key: "e", header: "Event Type", cell: (r) => <>{eventLabel(r.eventType)}{["CREDIT_NOTE", "DEBIT_NOTE"].includes(String(r.eventType)) && <span className="ml-1 text-xs text-muted-foreground">future</span>}</> },
        { key: "p", header: "Priority", cell: (r) => num(r.priority) },
        { key: "a", header: "Active", cell: (r) => <Badge tone={r.active === false ? "muted" : "success"}>{r.active === false ? "Inactive" : "Active"}</Badge> },
        { key: "l", header: "Lines", cell: (r) => `${((r.lines as Rec[]) ?? []).length} lines` },
      ]} menu={(r) => [{ label: r.active === false ? "Activate" : "Deactivate", onSelect: () => updateRecord("posting-rules", r.id, { active: r.active === false }) }, { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ${r.name}?`) && deleteRecord("posting-rules", r.id) }]} />
      {(sub === "new" || sel) && <SidePanel onClose={close}><RuleForm key={sub} record={sel} onDone={close} /></SidePanel>}
    </div>
  );
}
function RuleForm({ record, onDone }: { record?: Rec; onDone: () => void }) {
  const accounts = useAccounts();
  const [f, setF] = useState({ name: String(record?.name ?? ""), eventType: String(record?.eventType ?? ""), description: String(record?.description ?? ""), memo: String(record?.memo ?? ""), priority: String(record?.priority ?? "100"), conditions: String(record?.conditions ?? ""), active: record?.active !== false });
  const [lines, setLines] = useState<{ side: string; resolution: string; amountPath: string; accountId: string; memo?: string }[]>(((record?.lines as { side: string; resolution: string; amountPath: string; accountId: string }[]) ?? [{ side: "", resolution: "FIXED", amountPath: "", accountId: "" }, { side: "", resolution: "FIXED", amountPath: "", accountId: "" }]));
  const [err, setErr] = useState("");
  const setLine = (i: number, p: Partial<(typeof lines)[number]>) => setLines(lines.map((l, j) => (j === i ? { ...l, ...p } : l)));
  function save() {
    if (!f.name.trim() || !f.eventType) return setErr("Rule name and event type are required");
    if (f.conditions.trim()) { try { JSON.parse(f.conditions); } catch { return setErr("Conditions must be valid JSON"); } }
    if (lines.length < 2 || !lines.some((l) => l.side === "DEBIT") || !lines.some((l) => l.side === "CREDIT")) return setErr("A rule needs at least one debit and one credit line");
    if (lines.some((l) => !l.side || !l.accountId || !l.amountPath)) return setErr("Every line needs a side, an amount path and an account");
    const data = { ...f, name: f.name.trim(), priority: num(f.priority), lines };
    if (record) updateRecord("posting-rules", record.id, data); else createRecord("posting-rules", data);
    onDone();
  }
  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-semibold">{record ? `Edit ${record.name}` : "New Posting Rule"}</h2><p className="text-sm text-muted-foreground">Create an automated posting rule</p></div>
      <Card><div className="space-y-3 p-5"><CardTitle>Rule Details</CardTitle>
        <Field label="Rule Name"><input aria-label="Rule Name" className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Event Type"><Select ariaLabel="Event Type" value={f.eventType} onChange={(v) => setF({ ...f, eventType: v })} placeholder="Select event type" options={EVENT_TYPES.flatMap((g) => g.items.map(([v, l]) => ({ value: v, label: l })))} /></Field>
        <Field label="Description"><input aria-label="Rule description" className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Memo Template" hint="Template for the journal entry description"><input aria-label="Memo Template" placeholder="{{documentNumber}} — {{partyName}}" className={inputCls} value={f.memo} onChange={(e) => setF({ ...f, memo: e.target.value })} /></Field>
        <Field label="Priority" hint="Higher priority rules are matched first"><input aria-label="Priority" type="number" className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} /></Field>
        <Field label="Conditions (JSON, optional)" hint="Only events matching these conditions will trigger this rule"><textarea aria-label="Conditions" rows={2} className={cn(textareaCls, "font-mono text-xs")} placeholder='{"paymentMode":"Cash"}' value={f.conditions} onChange={(e) => setF({ ...f, conditions: e.target.value })} /></Field>
        <Switch checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Active" />
      </div></Card>
      <Card><div className="space-y-3 p-5"><div className="flex items-center justify-between"><CardTitle>Posting Lines</CardTitle><button type="button" className={btn.smOutline} onClick={() => setLines([...lines, { side: "", resolution: "FIXED", amountPath: "", accountId: "" }])}><Plus /> Add Line</button></div>
        {lines.map((l, i) => <div key={i} className="space-y-2 rounded-md border border-border p-3"><div className="flex items-center justify-between"><p className="text-sm font-medium">Line {i + 1}</p>{lines.length > 2 && <button type="button" aria-label={`Remove line ${i + 1}`} className="text-muted-foreground hover:text-destructive" onClick={() => setLines(lines.filter((_, j) => j !== i))}><X className="size-4" /></button>}</div>
          <div className="grid gap-2 sm:grid-cols-3"><Field label="Side"><Select ariaLabel={`Line ${i + 1} side`} value={l.side} onChange={(v) => setLine(i, { side: v })} placeholder="Select side" options={["DEBIT", "CREDIT"]} /></Field><Field label="Account Resolution"><Select ariaLabel={`Line ${i + 1} resolution`} value={l.resolution} onChange={(v) => setLine(i, { resolution: v })} options={[{ value: "FIXED", label: "Fixed Account" }, { value: "PARTY", label: "Party's control account" }]} /></Field><Field label="Amount Path"><Select ariaLabel={`Line ${i + 1} amount path`} disabled={!f.eventType} value={l.amountPath} onChange={(v) => setLine(i, { amountPath: v })} placeholder={f.eventType ? "Select amount" : "Select an event type first"} options={AMOUNT_PATHS} /></Field></div>
          <Field label="Account"><AccountPicker accounts={accounts} value={l.accountId} onChange={(v) => setLine(i, { accountId: v })} ariaLabel={`Line ${i + 1} account`} /></Field>
        </div>)}
      </div></Card>
      <p className="text-xs text-muted-foreground">Rules document the account mapping per event. The built-in posting code follows the default rules; custom rules are kept as configuration for the posting engine.</p>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={save}>{record ? "Save Rule" : "Create Rule"}</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
    </div>
  );
}

/* ---------- webhooks ---------- */

export function Webhooks() {
  const router = useRouter();
  const sub = subOf(usePathname(), "/webhooks");
  const rows = useCollection("webhooks");
  const deliveries = useCollection("webhook-deliveries");
  const [busy, setBusy] = useState("");
  const { node, flash } = useFlash();
  const close = () => router.push("/webhooks");
  const sel = rows.find((r) => r.id === sub);
  async function test(w: Rec) { setBusy(w.id); const d = await testWebhook(w); setBusy(""); flash(d.status === "DELIVERED" ? `Delivered — ${d.detail}` : `Failed — ${d.detail}`, d.status !== "DELIVERED"); }
  return (
    <div className="space-y-4">
      <PageHeader title="Webhooks" subtitle="Manage webhook endpoints for event notifications" actions={<Link href="/webhooks/new" className={btn.primary}><Plus /> New Webhook</Link>} />
      <DataTable rows={rows} onRowClick={(r) => router.push(`/webhooks/${r.id}`)} columns={[
        { key: "u", header: "URL", cell: (r) => <span className="font-mono text-xs">{String(r.url)}</span> },
        { key: "e", header: "Event Types", cell: (r) => ((r.events as string[]) ?? []).join(", ") },
        { key: "s", header: "Status", cell: (r) => <Badge tone={r.active === false ? "muted" : "success"}>{r.active === false ? "Inactive" : "Active"}</Badge> },
        { key: "c", header: "Created", cell: (r) => fmtWhen(r.createdAt) },
      ]} menu={(r) => [{ label: busy === r.id ? "Sending…" : "Send test event", onSelect: () => test(r) }, { label: r.active === false ? "Activate" : "Deactivate", onSelect: () => updateRecord("webhooks", r.id, { active: r.active === false }) }, { label: "Delete", destructive: true, onSelect: () => deleteRecord("webhooks", r.id) }]} />
      {sub === "new" && <SidePanel onClose={close}><WebhookForm onDone={close} /></SidePanel>}
      {sel && <SidePanel onClose={close}><div className="space-y-4"><h2 className="break-all text-lg font-semibold">{String(sel.url)}</h2><div className="flex gap-2"><button type="button" className={btn.primary} disabled={busy === sel.id} onClick={() => test(sel)}><Send /> {busy === sel.id ? "Sending…" : "Send test event"}</button></div>
        <Card><div className="p-5"><CardTitle className="mb-2">Recent deliveries</CardTitle>{deliveries.filter((d) => d.webhookId === sel.id).length === 0 ? <p className="text-sm text-muted-foreground">No deliveries yet.</p> : <table className="w-full text-sm"><tbody>{[...deliveries].filter((d) => d.webhookId === sel.id).reverse().map((d) => <tr key={d.id} className="border-b border-border"><td className="px-2 py-2">{fmtWhen(d.at)}</td><td className="px-2 py-2 font-mono text-xs">{String(d.event)}</td><td className="px-2 py-2"><Badge tone={d.status === "DELIVERED" ? "success" : "destructive"}>{String(d.status)}</Badge></td><td className="px-2 py-2 text-xs text-muted-foreground">{String(d.detail)} · {num(d.ms)} ms</td></tr>)}</tbody></table>}</div></Card>
        <p className="text-xs text-muted-foreground">Test events are signed with HMAC-SHA256 of the body using your secret, sent as <code>X-TaxGo-Signature: sha256=…</code>. They&apos;re sent from this browser, so the endpoint must allow cross-origin requests.</p></div></SidePanel>}
      {node}
    </div>
  );
}
function WebhookForm({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ url: "", secret: "", active: true });
  const [events, setEvents] = useState<string[]>([]);
  const [err, setErr] = useState("");
  return (
    <div className="space-y-4">
      <div><h2 className="text-xl font-semibold">New Webhook</h2><p className="text-sm text-muted-foreground">Register a new webhook endpoint</p></div>
      <Card><div className="space-y-3 p-5"><CardTitle>Endpoint Configuration</CardTitle>
        <Field label="Endpoint URL"><input aria-label="Endpoint URL" placeholder="https://example.com/webhooks/taxgo" className={inputCls} value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} /></Field>
        <Field label="Secret (optional)" hint="Used to sign webhook payloads for verification."><div className="flex gap-2"><input aria-label="Secret" className={inputCls} value={f.secret} onChange={(e) => setF({ ...f, secret: e.target.value })} /><button type="button" className={btn.outline} onClick={() => setF({ ...f, secret: randomKey("whsec") })}>Generate</button></div></Field>
        <Switch checked={f.active} onChange={(v) => setF({ ...f, active: v })} label="Active" />
      </div></Card>
      <Card><div className="space-y-2 p-5"><CardTitle>Event Types</CardTitle><p className="text-xs text-muted-foreground">Select the events that will trigger this webhook.</p><Toggle items={WEBHOOK_EVENTS} value={events} onChange={setEvents} /></div></Card>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <div className="flex gap-2"><button type="button" className={btn.primary} onClick={() => { try { const u = new URL(f.url); if (!/^https?:$/.test(u.protocol)) throw new Error(); } catch { return setErr("Enter a valid http(s) URL"); } if (!events.length) return setErr("Pick at least one event type"); createRecord("webhooks", { ...f, events }); onDone(); }}>Create Webhook</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
    </div>
  );
}

/* ---------- enquiries ---------- */

const ENQ_TYPES = ["Sales", "Demo", "Practice partner", "Reseller", "Support", "General"];
const ENQ_STATUS = ["New", "Contacted", "Qualified", "Won", "Closed"];
export function Enquiries() {
  const rows = useCollection("enquiries");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [add, setAdd] = useState(false);
  const [f, setF] = useState({ name: "", company: "", email: "", phone: "", type: "Sales", message: "" });
  const { node, flash } = useFlash();
  const list = rows.filter((r) => (!type || r.type === type) && (!status || r.status === status)).reverse();
  const stat = (l: string, v: number) => <Card><div className="p-4"><p className="text-2xl font-bold">{v}</p><p className="text-xs text-muted-foreground">{l}</p></div></Card>;
  return (
    <div className="space-y-4">
      <PageHeader title="Enquiries" subtitle="Inbound leads from the website — sales, demos, partners and resellers." actions={<button type="button" className={btn.outline} onClick={() => setAdd(true)}><Plus /> Add enquiry</button>} />
      <div className="grid gap-3 sm:grid-cols-4">{stat("Total", rows.length)}{stat("New", rows.filter((r) => r.status === "New").length)}{stat("Partners", rows.filter((r) => r.type === "Practice partner").length)}{stat("Resellers", rows.filter((r) => r.type === "Reseller").length)}</div>
      <div className="flex gap-3"><Select ariaLabel="Type" className="w-44" value={type} onChange={setType} options={[{ value: "", label: "All types" }, ...ENQ_TYPES]} /><Select ariaLabel="Status" className="w-44" value={status} onChange={setStatus} options={[{ value: "", label: "All statuses" }, ...ENQ_STATUS]} /></div>
      {list.length === 0 ? <Card><div className="p-8 text-center text-sm text-muted-foreground">No enquiries yet. New leads from the website will land here.</div></Card> : <div className="space-y-2">{list.map((r) => <Card key={r.id}><div className="flex flex-wrap items-start gap-3 p-4"><div className="flex-1"><div className="flex flex-wrap items-center gap-2 font-medium">{String(r.name)}{r.company ? ` · ${r.company}` : ""} <Badge>{String(r.type)}</Badge></div><p className="text-xs text-muted-foreground">{String(r.email)}{r.phone ? ` · ${r.phone}` : ""} · {fmtWhen(r.createdAt)}</p>{r.message ? <p className="mt-1 text-sm">{String(r.message)}</p> : null}</div><Select ariaLabel={`Status of ${r.name}`} size="sm" className="w-36" value={String(r.status)} onChange={(v) => updateRecord("enquiries", r.id, { status: v })} options={ENQ_STATUS} />{!r.leadId && <button type="button" className={btn.smOutline} onClick={() => { const [firstName, ...rest] = String(r.name ?? "").trim().split(/\s+/); const l = createRecord("leads", { number: nextNumber("leads", "LEAD"), firstName, lastName: rest.join(" "), organization: r.company ?? "", email: r.email ?? "", phone: r.phone ?? "", source: "WEB", status: "New", notes: r.message ?? "" }); updateRecord("enquiries", r.id, { leadId: l.id, status: r.status === "New" ? "Contacted" : r.status }); flash("Converted to a CRM lead"); }}>Convert to lead</button>}</div></Card>)}</div>}
      <Dialog open={add} onClose={() => setAdd(false)} title="Add enquiry">
        <div className="grid gap-3 sm:grid-cols-2">{(["name", "company", "email", "phone"] as const).map((k) => <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)}><input aria-label={`Enquiry ${k}`} className={inputCls} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></Field>)}<Field label="Type"><Select ariaLabel="Enquiry type" value={f.type} onChange={(v) => setF({ ...f, type: v })} options={ENQ_TYPES} /></Field><Field label="Message" className="sm:col-span-2"><textarea aria-label="Enquiry message" rows={3} className={textareaCls} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field></div>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setAdd(false)}>Cancel</button><button type="button" className={btn.primary} onClick={() => { if (!f.name.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return flash("Name and a valid email are required", true); createRecord("enquiries", { ...f, status: "New" }); setF({ name: "", company: "", email: "", phone: "", type: "Sales", message: "" }); setAdd(false); }}>Add</button></div>
      </Dialog>
      {node}
    </div>
  );
}
