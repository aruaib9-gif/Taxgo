"use client";

// Helpdesk tickets with SLA tracking, the internal knowledge base, and the team calendar.

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlarmClock, ArrowLeft, BookOpen, CalendarPlus, ChevronLeft, ChevronRight, Copy, Eye, Headphones, MessageSquare, Pencil, Plus, Save, Search, Send, Trash2, User } from "lucide-react";
import { createRecord, deleteRecord, nextNumber, readCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, Dialog, Field, Label, PageHeader, RowMenu, SidePanel, btn, downloadFile, inputCls, textareaCls, today } from "@/components/accounting/kit";
import { DateInput, Select } from "@/components/accounting/pickers";
import { NumberBanner } from "@/components/sales/doc-kit";
import { subOf } from "@/components/purchasing/kit";

const PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"];
const STATUSES = ["NEW", "OPEN", "PENDING", "RESOLVED", "CLOSED"];
const PRI_TONE: Record<string, string> = { URGENT: "bg-destructive/10 text-destructive", HIGH: "bg-warning/10 text-warning", NORMAL: "bg-primary/10 text-primary", LOW: "bg-secondary text-secondary-foreground" };
const ST_TONE: Record<string, "info" | "primary" | "warning" | "success" | "muted"> = { NEW: "info", OPEN: "primary", PENDING: "warning", RESOLVED: "success", CLOSED: "muted" };
const Pill = ({ tone, children }: { tone?: string; children: React.ReactNode }) => <span className={cn("inline-flex items-center whitespace-nowrap rounded-md border border-border px-2 py-0.5 text-xs font-medium", tone)}>{children}</span>;
const when = (iso: unknown, time = false) => (iso ? new Date(String(iso)).toLocaleString(undefined, time ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" }) : "—");
const requester = (t: Rec) => String(t.customerName || t.requesterName || t.requesterEmail || "—");

/* ---------- tickets ---------- */

const H_BASE = "/helpdesk";

export function Helpdesk() {
  const router = useRouter();
  const sub = subOf(usePathname(), H_BASE);
  const tickets = useCollection("tickets");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  if (sub === "sla") return <HelpdeskSla />;
  if (sub === "kb") return <KnowledgeBase />;
  const close = () => router.push(H_BASE);
  const rows = [...tickets].filter((t) => (status === "ALL" || t.status === status) && (!q || `${t.ticketNumber} ${t.subject}`.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  const detail = sub && sub !== "new" ? tickets.find((t) => t.id === sub) : undefined;
  return (
    <div className="space-y-4">
      <PageHeader title="Helpdesk" subtitle="Support tickets — manage requests from customers and internal users" actions={<Link href={`${H_BASE}/new`} className={btn.primary}><Plus /> New ticket</Link>} />
      <Card>
        <div className="space-y-3 p-5">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by subject or ticket #" aria-label="Search tickets" className={cn(inputCls, "max-w-sm")} />
          <div role="tablist" className="inline-flex rounded-lg bg-muted p-1 text-sm">{["ALL", ...STATUSES].map((s) => <button key={s} role="tab" aria-selected={status === s} type="button" onClick={() => setStatus(s)} className={cn("rounded-md px-3 py-1 font-medium text-muted-foreground", status === s && "bg-background text-foreground shadow")}>{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</button>)}</div>
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-10 text-center"><div className="rounded-full bg-muted p-3"><Headphones className="size-5 text-muted-foreground" /></div><p className="font-semibold">No tickets yet</p><p className="max-w-sm text-sm text-muted-foreground">Create your first support ticket or wait for customers to reach out.</p></div>
          ) : (
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead><tr className="border-b border-border text-left text-muted-foreground">{["Ticket #", "Subject", "Requester", "Priority", "Assignee", "Status", "Created", ""].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>{rows.map((t) => (
                <tr key={t.id} onClick={() => router.push(`${H_BASE}/${t.id}`)} className="cursor-pointer border-b border-border hover:bg-muted/50">
                  <td className="px-2 py-2 font-mono text-xs">{String(t.ticketNumber)}</td><td className="px-2 py-2 font-medium">{String(t.subject)}</td><td className="px-2 py-2">{requester(t)}</td><td className="px-2 py-2"><Pill tone={PRI_TONE[String(t.priority)]}>{String(t.priority)}</Pill></td>
                  <td className="px-2 py-2">{t.assigneeName ? String(t.assigneeName) : <span className="text-muted-foreground">Unassigned</span>}</td><td className="px-2 py-2"><Badge tone={ST_TONE[String(t.status)]}>{String(t.status)}</Badge></td><td className="px-2 py-2 text-muted-foreground">{when(t.createdAt)}</td>
                  <td className="px-2 py-2" onClick={(e) => e.stopPropagation()}><RowMenu items={[{ label: "Open", onSelect: () => router.push(`${H_BASE}/${t.id}`) }, { label: "Delete", destructive: true, onSelect: () => confirm(`Delete ticket ${t.ticketNumber}?`) && deleteRecord("tickets", t.id) }]} /></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </Card>
      {sub === "new" && <SidePanel onClose={close}><NewTicket onDone={(id) => router.push(`${H_BASE}/${id}`)} onCancel={close} /></SidePanel>}
      {detail && <SidePanel onClose={close}><TicketDetail key={detail.id} ticket={detail} /></SidePanel>}
    </div>
  );
}

function NewTicket({ onDone, onCancel }: { onDone: (id: string) => void; onCancel: () => void }) {
  const [f, setF] = useState({ subject: "", description: "", priority: "NORMAL", requesterName: "", requesterEmail: "" });
  const next = `TKT-${String(readCollection("tickets").length + 1).padStart(2, "0")}`;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.subject.trim()) return;
    const t = createRecord("tickets", { ...f, subject: f.subject.trim(), ticketNumber: nextNumber("tickets", "TKT"), status: "NEW", source: "WEB", comments: [] });
    onDone(t.id);
  }
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New Ticket</h1><p className="text-sm text-muted-foreground">Create a new support ticket</p></div>
      <Card className="max-w-2xl">
        <div className="p-6 pb-3"><CardTitle>New support ticket</CardTitle></div>
        <div className="space-y-4 p-6 pt-0">
          <NumberBanner label="Ticket #" value={next} />
          <form onSubmit={submit} className="space-y-4">
            <Field label="Subject *" htmlFor="tk-subj"><input id="tk-subj" required autoFocus value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className={inputCls} /></Field>
            <Field label="Description" htmlFor="tk-desc"><input id="tk-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Requester name" htmlFor="tk-rn"><input id="tk-rn" value={f.requesterName} onChange={(e) => setF({ ...f, requesterName: e.target.value })} className={inputCls} /></Field>
              <Field label="Requester email" htmlFor="tk-re"><input id="tk-re" type="email" value={f.requesterEmail} onChange={(e) => setF({ ...f, requesterEmail: e.target.value })} className={inputCls} /></Field>
            </div>
            <div className="space-y-2"><Label>Priority</Label><Select value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={PRIORITIES.map((p) => ({ value: p, label: p }))} /></div>
            <div className="flex gap-2"><button type="submit" className={btn.primary} disabled={!f.subject.trim()}>Create</button><button type="button" className={btn.outline} onClick={onCancel}>Cancel</button></div>
          </form>
        </div>
      </Card>
    </div>
  );
}

function TicketDetail({ ticket }: { ticket: Rec }) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const comments = (ticket.comments as Rec[]) ?? [];
  function reply(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    const now = new Date().toISOString();
    updateRecord("tickets", ticket.id, {
      comments: [...comments, { id: crypto.randomUUID(), body: body.trim(), isInternal: internal, authorName: BRAND.user.fullName, createdAt: now }],
      // The first public reply stops the response clock and moves a new ticket to Open.
      ...(!internal && !ticket.firstResponseAt ? { firstResponseAt: now } : {}),
      ...(!internal && ticket.status === "NEW" ? { status: "OPEN" } : {}),
    });
    setBody(""); setInternal(false);
  }
  const set = (k: string, v: string) => updateRecord("tickets", ticket.id, { [k]: v, ...(k === "status" && (v === "RESOLVED" || v === "CLOSED") && !ticket.resolvedAt ? { resolvedAt: new Date().toISOString() } : {}) });
  return (
    <div className="space-y-4">
      <Link href={H_BASE} className={cn(btn.ghost, "h-8 px-2")}><ArrowLeft /> Back</Link>
      <PageHeader title={String(ticket.subject)} subtitle={String(ticket.ticketNumber)} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-4">
          {Boolean(ticket.description) && <Card><p className="whitespace-pre-wrap p-5 text-sm">{String(ticket.description)}</p></Card>}
          <Card>
            <div className="p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="size-4" />Conversation ({comments.length})</CardTitle></div>
            <div className="space-y-4 p-5 pt-0">
              {comments.length === 0 ? <p className="text-sm text-muted-foreground">No replies yet</p> : comments.map((c) => (
                <div key={String(c.id)} className={cn("rounded-lg border p-3", c.isInternal ? "border-warning/30 bg-warning/5" : "border-border")}>
                  <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><User className="size-3" /><span>{String(c.authorName || "System")}</span><span>·</span><span>{when(c.createdAt, true)}</span>{Boolean(c.isInternal) && <Pill>Internal</Pill>}</div>
                  <p className="whitespace-pre-wrap text-sm">{String(c.body)}</p>
                </div>
              ))}
              <form onSubmit={reply} className="space-y-2 border-t border-border pt-4">
                <Label htmlFor="tk-reply">Reply</Label>
                <textarea id="tk-reply" required value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type your reply…" className={textareaCls} />
                <div className="flex items-center justify-between"><label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} />Internal note (not visible to requester)</label><button type="submit" className={btn.smPrimary} disabled={!body.trim()}><Send /> Send</button></div>
              </form>
            </div>
          </Card>
        </div>
        <Card className="h-fit">
          <div className="p-5 pb-3"><CardTitle className="text-base">Details</CardTitle></div>
          <div className="space-y-4 p-5 pt-0 text-sm">
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Status</Label><Select size="sm" value={String(ticket.status)} onChange={(v) => set("status", v)} options={STATUSES.map((s) => ({ value: s, label: s }))} /></div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Priority</Label><Select size="sm" value={String(ticket.priority)} onChange={(v) => set("priority", v)} options={PRIORITIES.map((s) => ({ value: s, label: s }))} /></div>
            <div><div className="text-xs text-muted-foreground">Requester</div><div className="font-medium">{requester(ticket)}</div>{Boolean(ticket.requesterEmail) && <div className="text-xs text-muted-foreground">{String(ticket.requesterEmail)}</div>}</div>
            <div><div className="text-xs text-muted-foreground">Source</div><Pill>{String(ticket.source ?? "WEB")}</Pill></div>
            <div><div className="text-xs text-muted-foreground">Created</div><div>{when(ticket.createdAt, true)}</div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ---------- SLA ---------- */

const DEFAULT = "__DEFAULT__";
const hours = (h: number) => h * 3600_000;

export function slaReport(tickets: Rec[], policies: Rec[], now = Date.now()) {
  const open = tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(String(t.status)));
  const rows = open.map((t) => {
    const p = policies.find((x) => x.priority === t.priority) ?? policies.find((x) => !x.priority);
    const created = new Date(String(t.createdAt)).getTime();
    if (!p) return { t, responseDue: null, resolveDue: null, responseBreached: false, resolveBreached: false };
    const responseDue = created + hours(Number(p.firstResponseHours)), resolveDue = created + hours(Number(p.resolveHours));
    const responded = t.firstResponseAt ? new Date(String(t.firstResponseAt)).getTime() : now;
    return { t, responseDue, resolveDue, responseBreached: responded > responseDue, resolveBreached: now > resolveDue };
  });
  return { rows, summary: { openTickets: open.length, withPolicy: rows.filter((r) => r.responseDue != null).length, responseBreaches: rows.filter((r) => r.responseBreached).length, resolveBreaches: rows.filter((r) => r.resolveBreached).length } };
}

export function HelpdeskSla() {
  const tickets = useCollection("tickets");
  const policies = useCollection("sla-policies");
  const [f, setF] = useState({ priority: DEFAULT, firstResponseHours: "4", resolveHours: "24" });
  const [msg, setMsg] = useState("");
  const [now] = useState(() => Date.now());
  const rep = slaReport(tickets, policies, now);
  function save() {
    const pr = f.priority === DEFAULT ? null : f.priority;
    const data = { priority: pr, name: pr ? `${pr.charAt(0)}${pr.slice(1).toLowerCase()} priority` : "Default", firstResponseHours: Number(f.firstResponseHours) || 0.5, resolveHours: Number(f.resolveHours) || 0.5 };
    const existing = policies.find((p) => (p.priority ?? null) === pr);
    if (existing) updateRecord("sla-policies", existing.id, data); else createRecord("sla-policies", data);
    setMsg("SLA policy saved"); setTimeout(() => setMsg(""), 2500);
  }
  const stat = (label: string, v: number) => <Card><div className="p-4"><div className="text-sm text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-bold">{v}</div></div></Card>;
  return (
    <div className="space-y-4">
      <PageHeader title="Helpdesk SLA" subtitle="Response and resolution targets per priority — open tickets are checked live against them." />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{stat("Open tickets", rep.summary.openTickets)}{stat("Covered by SLA", rep.summary.withPolicy)}{stat("Response breaches", rep.summary.responseBreaches)}{stat("Resolution breaches", rep.summary.resolveBreaches)}</div>
      <Card>
        <div className="p-5 pb-3"><CardTitle className="flex items-center gap-2 text-base"><AlarmClock className="size-4" /> Policies</CardTitle></div>
        <div className="space-y-4 p-5 pt-0">
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-56 space-y-1"><Label className="text-xs">Priority</Label><Select value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={[{ value: DEFAULT, label: "Default (all priorities)" }, ...PRIORITIES.map((p) => ({ value: p, label: p.charAt(0) + p.slice(1).toLowerCase() }))]} /></div>
            <div className="w-44 space-y-1"><Label className="text-xs" htmlFor="sla-r">First response (hours)</Label><input id="sla-r" type="number" min="0.5" step="0.5" value={f.firstResponseHours} onChange={(e) => setF({ ...f, firstResponseHours: e.target.value })} className={inputCls} /></div>
            <div className="w-44 space-y-1"><Label className="text-xs" htmlFor="sla-s">Resolve (hours)</Label><input id="sla-s" type="number" min="0.5" step="0.5" value={f.resolveHours} onChange={(e) => setF({ ...f, resolveHours: e.target.value })} className={inputCls} /></div>
            <button type="button" className={btn.smPrimary} onClick={save}><Save /> Save policy</button>
            {msg && <span className="text-sm text-success">{msg}</span>}
          </div>
          {policies.length > 0 && <div className="space-y-2">{policies.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"><Badge tone={p.priority ? "info" : "muted"}>{String(p.priority || "Default")}</Badge><span className="font-medium">{String(p.name)}</span><span className="text-muted-foreground">respond {Number(p.firstResponseHours)}h · resolve {Number(p.resolveHours)}h</span><button type="button" aria-label="Delete policy" className={cn(btn.icon, "ml-auto")} onClick={() => deleteRecord("sla-policies", p.id)}><Trash2 /></button></div>
          ))}</div>}
        </div>
      </Card>
      <Card>
        <div className="p-5 pb-3"><CardTitle className="text-base">Open tickets vs SLA</CardTitle></div>
        <div className="p-5 pt-0">{rep.rows.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No open tickets.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-muted-foreground">{["Ticket", "Priority", "Status", "Respond by", "Resolve by", "SLA"].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody>{rep.rows.map(({ t, responseDue, resolveDue, responseBreached, resolveBreached }) => (
              <tr key={t.id} className="border-b border-border">
                <td className="px-2 py-2"><Link href={`${H_BASE}/${t.id}`} className="font-mono text-xs text-primary hover:underline">{String(t.ticketNumber)}</Link><p className="text-xs text-muted-foreground">{String(t.subject)}</p></td>
                <td className="px-2 py-2"><Badge>{String(t.priority)}</Badge></td><td className="px-2 py-2"><Pill>{String(t.status)}</Pill></td>
                <td className="px-2 py-2 text-xs">{responseDue ? new Date(responseDue).toLocaleString() : "—"}</td><td className="px-2 py-2 text-xs">{resolveDue ? new Date(resolveDue).toLocaleString() : "—"}</td>
                <td className="px-2 py-2">{responseDue == null ? <span className="text-xs text-muted-foreground">No policy</span> : responseBreached || resolveBreached ? <div className="flex flex-col gap-1">{responseBreached && <Badge tone="destructive">Response breached</Badge>}{resolveBreached && <Badge tone="destructive">Resolution breached</Badge>}</div> : <Badge tone="success">On track</Badge>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}</div>
      </Card>
    </div>
  );
}

/* ---------- knowledge base ---------- */

const BLANK_ART = { title: "", category: "", body: "", tags: "", status: "PUBLISHED" };

export function KnowledgeBase() {
  const articles = useCollection("kb-articles");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [open, setOpen] = useState<Rec | null>(null);
  const [editing, setEditing] = useState<Rec | null>(null);
  const [form, setForm] = useState<typeof BLANK_ART | null>(null);
  const cats = useMemo(() => { const m = new Map<string, number>(); for (const a of articles) if (a.category) m.set(String(a.category), (m.get(String(a.category)) ?? 0) + 1); return [...m]; }, [articles]);
  const rows = articles.filter((a) => (!cat || a.category === cat) && (!q.trim() || `${a.title} ${a.body} ${((a.tags as string[]) ?? []).join(" ")}`.toLowerCase().includes(q.trim().toLowerCase())));
  function view(a: Rec) { updateRecord("kb-articles", a.id, { viewCount: Number(a.viewCount ?? 0) + 1 }); setOpen({ ...a, viewCount: Number(a.viewCount ?? 0) + 1 }); }
  function save() {
    if (!form?.title.trim()) return;
    const data = { title: form.title.trim(), category: form.category.trim() || undefined, body: form.body, tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean), status: form.status, updatedAt: new Date().toISOString() };
    if (editing) updateRecord("kb-articles", editing.id, data); else createRecord("kb-articles", { ...data, viewCount: 0, authorName: BRAND.user.fullName });
    setForm(null); setEditing(null);
  }
  return (
    <div className="space-y-4">
      <PageHeader title="Knowledge Base" subtitle="Internal articles for the team — searchable, categorised, with view counts." actions={<button type="button" className={btn.primary} onClick={() => { setEditing(null); setForm(BLANK_ART); }}><Plus /> New article</button>} />
      <div className="flex flex-wrap gap-2">
        <div className="relative w-full max-w-sm"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles…" aria-label="Search articles" className={cn(inputCls, "pl-9")} /></div>
        <Select value={cat} onChange={setCat} options={[{ value: "", label: "All categories" }, ...cats.map(([c, n]) => ({ value: c, label: `${c} (${n})` }))]} className="w-52" ariaLabel="Category" />
      </div>
      {rows.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No articles found.</p> : (
        <div className="grid gap-3 md:grid-cols-2">{rows.map((a) => (
          <Card key={a.id} className="cursor-pointer transition-colors hover:bg-muted/40">
            <button type="button" onClick={() => view(a)} className="w-full space-y-2 p-4 text-left">
              <div className="flex items-start justify-between gap-2"><p className="font-semibold">{String(a.title)}</p>{a.status !== "PUBLISHED" && <Pill>{String(a.status)}</Pill>}</div>
              <p className="line-clamp-2 text-sm text-muted-foreground">{String(a.body ?? "").slice(0, 200)}</p>
              <div className="flex flex-wrap items-center gap-1.5">{Boolean(a.category) && <Badge>{String(a.category)}</Badge>}{((a.tags as string[]) ?? []).slice(0, 3).map((t) => <Pill key={t}>{t}</Pill>)}<span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground"><Eye className="size-3" /> {Number(a.viewCount ?? 0)}</span></div>
            </button>
          </Card>
        ))}</div>
      )}
      <Dialog open={!!open} onClose={() => setOpen(null)} title={<><BookOpen className="size-4" /><span>{String(open?.title ?? "")}</span></>} className="max-w-2xl">
        {open && <>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">{Boolean(open.category) && <Badge>{String(open.category)}</Badge>}{((open.tags as string[]) ?? []).map((t) => <Pill key={t}>{t}</Pill>)}<span>· {String(open.authorName || "Unknown")} · {when(open.updatedAt ?? open.createdAt)} · {Number(open.viewCount ?? 0)} views</span></div>
          <div className="max-h-[50vh] overflow-y-auto whitespace-pre-wrap text-sm">{String(open.body)}</div>
          <div className="flex justify-end gap-2"><button type="button" className={btn.smOutline} onClick={() => { setEditing(open); setForm({ title: String(open.title), category: String(open.category ?? ""), body: String(open.body ?? ""), tags: ((open.tags as string[]) ?? []).join(", "), status: String(open.status) }); setOpen(null); }}><Pencil /> Edit</button><button type="button" className={cn(btn.ghost, "h-8 px-3 text-xs")} onClick={() => { deleteRecord("kb-articles", open.id); setOpen(null); }}><Trash2 /> Delete</button></div>
        </>}
      </Dialog>
      <Dialog open={!!form} onClose={() => setForm(null)} title={editing ? "Edit article" : "New article"} className="max-w-2xl">
        {form && <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" htmlFor="kb-title"><input id="kb-title" autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} /></Field>
            <Field label="Category" htmlFor="kb-cat"><input id="kb-cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Billing" className={inputCls} /></Field>
          </div>
          <Field label="Body" htmlFor="kb-body"><textarea id="kb-body" rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className={textareaCls} /></Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={<>Tags <span className="text-xs font-normal text-muted-foreground">(comma separated)</span></>} htmlFor="kb-tags"><input id="kb-tags" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className={inputCls} /></Field>
            <div className="space-y-2"><Label>Status</Label><Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={[{ value: "PUBLISHED", label: "Published" }, { value: "DRAFT", label: "Draft" }, { value: "ARCHIVED", label: "Archived" }]} /></div>
          </div>
          <div className="flex justify-end"><button type="button" className={btn.primary} disabled={!form.title.trim()} onClick={save}>{editing ? "Save" : "Publish"}</button></div>
        </div>}
      </Dialog>
    </div>
  );
}

/* ---------- calendar ---------- */

const KINDS: Record<string, string> = { MEETING: "bg-blue-600", REMINDER: "bg-blue-400", TASK: "bg-sky-300", DEADLINE: "bg-green-600", OTHER: "bg-amber-500" };
const C_BASE = "/calendar";
const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const firstOf = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

function icsFor(events: Rec[]) {
  const stamp = (iso: string, allDay: boolean) => (allDay ? `;VALUE=DATE:${iso.slice(0, 10).replace(/-/g, "")}` : `:${new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`);
  const esc = (s: unknown) => String(s ?? "").replace(/[,;\\]/g, (c) => `\\${c}`).replace(/\n/g, "\\n");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", `PRODID:-//${BRAND.fullName}//Calendar//EN`, ...events.flatMap((e) => ["BEGIN:VEVENT", `UID:${e.id}@taxgo`, `DTSTART${stamp(String(e.startsAt), Boolean(e.allDay))}`, `SUMMARY:${esc(e.title)}`, ...(e.location ? [`LOCATION:${esc(e.location)}`] : []), ...(e.description ? [`DESCRIPTION:${esc(e.description)}`] : []), `CATEGORIES:${e.kind}`, "END:VEVENT"]), "END:VCALENDAR"].join("\r\n");
}

export function CalendarPage() {
  const router = useRouter();
  const sub = subOf(usePathname(), C_BASE);
  const events = useCollection("calendar-events");
  const [month, setMonth] = useState(() => firstOf(new Date()));
  const [subscribe, setSubscribe] = useState(false);
  const [del, setDel] = useState<Rec | null>(null);
  const start = new Date(month.getFullYear(), month.getMonth(), 1 - month.getDay());
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const byDay = new Map<string, Rec[]>();
  for (const e of events) { const d = ymd(new Date(String(e.startsAt))); byDay.set(d, [...(byDay.get(d) ?? []), e]); }
  const todayStr = new Date().toDateString();
  const close = () => router.push(C_BASE);
  return (
    <div className="space-y-4">
      <PageHeader title="Calendar" subtitle="Meetings, reminders, deadlines and tasks across your team" actions={<>
        <button type="button" className={btn.outline} onClick={() => setSubscribe(true)}><CalendarPlus /> Subscribe</button>
        <Link href={`${C_BASE}/new`} className={btn.primary}><Plus /> New event</Link>
      </>} />
      <Card>
        <div className="space-y-3 p-5">
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Previous month" className={cn(btn.outline, "size-8 p-0")} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button>
            <div className="min-w-32 text-center font-semibold">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
            <button type="button" aria-label="Next month" className={cn(btn.outline, "size-8 p-0")} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button>
            <button type="button" className={cn(btn.ghost, "h-8 px-3 text-xs")} onClick={() => setMonth(firstOf(new Date()))}>Today</button>
          </div>
          <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-border">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="border-b border-border bg-muted py-1 text-center text-xs font-semibold text-muted-foreground">{d}</div>)}
            {days.map((d, i) => {
              const inMonth = d.getMonth() === month.getMonth();
              const list = byDay.get(ymd(d)) ?? [];
              return (
                <div key={ymd(d)} role="button" tabIndex={0} onClick={() => router.push(`${C_BASE}/new?date=${ymd(d)}`)} onKeyDown={(e) => e.key === "Enter" && router.push(`${C_BASE}/new?date=${ymd(d)}`)} className={cn("flex h-[5.5rem] cursor-pointer flex-col gap-1 border-border p-1.5 text-left hover:bg-accent/50", i % 7 !== 6 && "border-r", i < 35 && "border-b", inMonth ? "bg-card" : "bg-muted/60 text-muted-foreground")}>
                  <span className={cn("flex size-5 items-center justify-center text-xs", d.toDateString() === todayStr && "rounded-full bg-primary font-semibold text-primary-foreground")}>{d.getDate()}</span>
                  {list.slice(0, 3).map((e) => <button key={e.id} type="button" onClick={(ev) => { ev.stopPropagation(); setDel(e); }} className="flex items-center gap-1 truncate rounded bg-muted px-1 text-[11px]"><span className={cn("size-1.5 shrink-0 rounded-full", KINDS[String(e.kind)] ?? KINDS.OTHER)} /><span className="truncate">{String(e.title)}</span></button>)}
                  {list.length > 3 && <span className="text-[10px] text-muted-foreground">+{list.length - 3} more</span>}
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">{Object.entries(KINDS).map(([k, c]) => <span key={k} className="flex items-center gap-1"><span className={cn("size-2 rounded-full", c)} />{k}</span>)}<span>·</span><span>Tap a day to add an event, tap an event to delete</span></div>
        </div>
      </Card>
      <Dialog open={subscribe} onClose={() => setSubscribe(false)} title="Subscribe from your calendar app">
        <p className="text-sm text-muted-foreground">Download an .ics file and import it into Google Calendar, Apple Calendar or Outlook. Events are kept in this browser, so there is no live feed URL — download again after changes.</p>
        <div className="flex gap-2">
          <button type="button" className={cn(btn.smOutline, "flex-1")} onClick={() => downloadFile("my-events.ics", icsFor(events), "text/calendar")}><Copy /> My events</button>
          <button type="button" className={cn(btn.smOutline, "flex-1")} onClick={() => downloadFile("company-events.ics", icsFor(events), "text/calendar")}><Copy /> Whole company</button>
        </div>
      </Dialog>
      <Dialog open={!!del} onClose={() => setDel(null)} title={`Delete event?`} description={del ? `${del.title} — ${when(del.startsAt, !del.allDay)}${del.location ? ` · ${del.location}` : ""}` : ""}>
        <div className="flex justify-end gap-2"><button type="button" className={btn.outline} onClick={() => setDel(null)}>Cancel</button><button type="button" className={cn(btn.primary, "bg-destructive hover:bg-destructive/90")} onClick={() => { deleteRecord("calendar-events", del!.id); setDel(null); }}>Delete</button></div>
      </Dialog>
      {sub === "new" && <SidePanel onClose={close}><NewEvent onDone={close} /></SidePanel>}
    </div>
  );
}

function NewEvent({ onDone }: { onDone: () => void }) {
  const params = useSearchParams();
  const [f, setF] = useState(() => ({ title: "", kind: "MEETING", date: params.get("date") || today(), time: "09:00", allDay: false, location: "", description: "" }));
  const [lastDate, setLastDate] = useState(params.get("date"));
  if (params.get("date") !== lastDate) { setLastDate(params.get("date")); if (params.get("date")) setF((x) => ({ ...x, date: params.get("date")! })); }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) return;
    const startsAt = new Date(f.allDay ? `${f.date}T00:00:00` : `${f.date}T${f.time}:00`).toISOString();
    createRecord("calendar-events", { title: f.title.trim(), kind: f.kind, startsAt, allDay: f.allDay, location: f.location || undefined, description: f.description || undefined, ownerName: BRAND.user.fullName });
    onDone();
  }
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-semibold tracking-tight">New event</h1><p className="text-sm text-muted-foreground">Add a meeting, reminder, deadline or task</p></div>
      <Card className="max-w-2xl">
        <div className="p-6 pb-3"><CardTitle>Event Details</CardTitle></div>
        <form onSubmit={submit} className="space-y-4 p-6 pt-0">
          <Field label="Title *" htmlFor="ev-title"><input id="ev-title" required autoFocus value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Kind</Label><Select value={f.kind} onChange={(v) => setF({ ...f, kind: v })} options={Object.keys(KINDS).map((k) => ({ value: k, label: k }))} /></div>
            <div className="space-y-2"><Label>Date *</Label><DateInput value={f.date} onChange={(v) => setF({ ...f, date: v })} /></div>
          </div>
          {!f.allDay && <Field label="Time" htmlFor="ev-time"><input id="ev-time" type="time" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} className={cn(inputCls, "w-40")} /></Field>}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.allDay} onChange={(e) => setF({ ...f, allDay: e.target.checked })} />All-day</label>
          <Field label="Location" htmlFor="ev-loc"><input id="ev-loc" value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} className={inputCls} /></Field>
          <Field label="Description" htmlFor="ev-desc"><input id="ev-desc" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className={inputCls} /></Field>
          <div className="flex gap-2"><button type="submit" className={btn.primary} disabled={!f.title.trim()}>Create</button><button type="button" className={btn.outline} onClick={onDone}>Cancel</button></div>
        </form>
      </Card>
    </div>
  );
}
