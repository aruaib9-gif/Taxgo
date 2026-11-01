"use client";

// CRM logic shared by the CRM screens: pipeline stages, lead conversion, rule-based scoring,
// segment matching and campaign sends. Customers are referenced by name, like the rest of the app.

import { createRecord, nextNumber, readCollection, updateRecord, type Rec } from "@/lib/store";
import { todayIso } from "@/lib/reports";

const n = (v: unknown) => Number(v ?? 0) || 0;

export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Converted", "Lost"];
export const LEAD_SOURCES = ["WEB", "REFERRAL", "CAMPAIGN", "COLD_CALL", "EVENT", "PARTNER", "OTHER"];
export const ACTIVITY_TYPES = ["CALL", "EMAIL", "MEETING", "TASK", "NOTE"];
export const RELATED_TYPES = ["Lead", "Opportunity", "Customer"];
export const QUOTE_STATUSES = ["draft", "sent", "accepted", "rejected", "converted"];
export const CAMPAIGN_STATUSES = ["draft", "scheduled", "running", "paused", "completed", "cancelled"];
export const CAMPAIGN_KINDS = ["BLAST", "DRIP", "TRIGGER"];
export const SEGMENT_ENTITIES = ["LEAD", "CONTACT", "CUSTOMER", "OPPORTUNITY"];
export const SCORE_OPS = ["=", "!=", ">", "<", ">=", "<=", "contains", "exists"];
export const SEGMENT_OPS = ["=", "!=", ">", "<", "contains", "exists"];

export const leadName = (l: Rec | undefined) => (l ? `${l.firstName ?? ""} ${l.lastName ?? ""}`.trim() || String(l.organization || l.email || l.number || "Lead") : "—");

/* ---------- pipeline stages ---------- */

export type StageKind = "OPEN" | "WON" | "LOST";
// Won/Lost keep these names so older records and the assistant's "Won"/"Lost" checks still line up.
export const DEFAULT_STAGES: { name: string; probability: number; kind: StageKind }[] = [
  { name: "Qualification", probability: 10, kind: "OPEN" },
  { name: "Needs Analysis", probability: 25, kind: "OPEN" },
  { name: "Proposal", probability: 50, kind: "OPEN" },
  { name: "Negotiation", probability: 75, kind: "OPEN" },
  { name: "Won", probability: 100, kind: "WON" },
  { name: "Lost", probability: 0, kind: "LOST" },
];

export const sortStages = (stages: Rec[]) => [...stages].sort((a, b) => n(a.order) - n(b.order));

export function addDefaultStages() {
  const have = readCollection("pipeline-stages");
  DEFAULT_STAGES.forEach((s, i) => { if (!have.some((h) => String(h.name).toLowerCase() === s.name.toLowerCase())) createRecord("pipeline-stages", { ...s, order: have.length + i }); });
}

// Opportunities created before stages existed only carry a stage name.
export function stageOf(o: Rec, stages: Rec[]) {
  return stages.find((s) => s.id === o.stageId) ?? stages.find((s) => String(s.name).toLowerCase() === String(o.stage ?? "").toLowerCase());
}

export function oppStatus(o: Rec, stages: Rec[]): StageKind {
  const s = stageOf(o, stages);
  if (s) return s.kind as StageKind;
  return /won/i.test(String(o.stage)) ? "WON" : /lost/i.test(String(o.stage)) ? "LOST" : "OPEN";
}

export function moveOpportunity(o: Rec, stage: Rec) {
  const kind = stage.kind as StageKind;
  updateRecord("opportunities", o.id, { stageId: stage.id, stage: stage.name, probability: n(stage.probability), status: kind, closedAt: kind === "OPEN" ? null : todayIso() });
  logActivity({ type: "NOTE", relatedType: "Opportunity", relatedId: o.id, subject: `Stage changed to ${stage.name}` });
}

/* ---------- activities ---------- */

export function logActivity(a: { type: string; relatedType: string; relatedId: string; subject: string; notes?: string; dueDate?: string; status?: string; auto?: boolean }) {
  return createRecord("activities", { status: a.type === "TASK" ? "Open" : "Done", auto: true, ...a });
}

export function relatedName(type: unknown, id: unknown) {
  if (type === "Lead") return leadName(readCollection("leads").find((l) => l.id === id));
  if (type === "Opportunity") { const o = readCollection("opportunities").find((x) => x.id === id); return o ? String(o.title) : "—"; }
  const c = readCollection("customers").find((x) => x.id === id || x.name === id);
  return c ? String(c.name) : String(id ?? "—");
}

/* ---------- lead conversion ---------- */

export function convertLead(lead: Rec, opts: { customerName: string; createOpportunity: boolean; title: string; amount: number; stageId: string; closeDate: string }) {
  const name = opts.customerName.trim();
  let customer = readCollection("customers").find((c) => String(c.name).toLowerCase() === name.toLowerCase());
  if (!customer) customer = createRecord("customers", { number: nextNumber("customers", "C"), name, email: lead.email ?? "", phone: lead.phone ?? "", terms: 30, status: "ACTIVE", leadId: lead.id });
  let opp: Rec | undefined;
  if (opts.createOpportunity) {
    const stage = readCollection("pipeline-stages").find((s) => s.id === opts.stageId);
    opp = createRecord("opportunities", { number: nextNumber("opportunities", "OPP"), title: opts.title.trim(), customer: customer.name, leadId: lead.id, stageId: stage?.id ?? "", stage: stage?.name ?? "Qualification", probability: n(stage?.probability), status: stage?.kind ?? "OPEN", value: opts.amount, closeDate: opts.closeDate });
  }
  updateRecord("leads", lead.id, { status: "Converted", customerId: customer.id, customer: customer.name, opportunityId: opp?.id ?? null, convertedAt: todayIso() });
  logActivity({ type: "NOTE", relatedType: "Lead", relatedId: lead.id, subject: `Converted to customer ${customer.name}${opp ? ` and opportunity ${opp.number}` : ""}` });
  return { customer, opportunity: opp };
}

/* ---------- conditions (scoring rules and segments) ---------- */

export function test(actual: unknown, op: string, value: string) {
  const a = actual == null ? "" : String(actual);
  if (op === "exists") return a.trim() !== "";
  if (op === "contains") return a.toLowerCase().includes(value.toLowerCase());
  const both = a.trim() !== "" && value.trim() !== "" && Number.isFinite(Number(a)) && Number.isFinite(Number(value));
  const x: number | string = both ? Number(a) : a.toLowerCase(), y: number | string = both ? Number(value) : value.toLowerCase();
  switch (op) {
    case "=": return x === y;
    case "!=": return x !== y;
    case ">": return x > y;
    case "<": return x < y;
    case ">=": return x >= y;
    case "<=": return x <= y;
  }
  return false;
}

// Field names offered in the rule/segment builders; any record key also works.
export const ENTITY_FIELDS: Record<string, string[]> = {
  LEAD: ["firstName", "lastName", "organization", "jobTitle", "email", "phone", "source", "estValue", "status", "score"],
  CONTACT: ["name", "email", "phone", "organization", "kind"],
  CUSTOMER: ["name", "email", "phone", "terms", "status"],
  OPPORTUNITY: ["title", "customer", "stage", "value", "probability", "closeDate", "status"],
};

/* ---------- lead scoring ---------- */

// FIELD rules test a lead field. ACTIVITY rules count the lead's activities of type `field`
// (CALL, EMAIL, MEETING…) and test that count; with no op they award points once any exist.
export function scoreBreakdown(lead: Rec, rules: Rec[], activities: Rec[]) {
  const mine = activities.filter((a) => a.relatedType === "Lead" && a.relatedId === lead.id);
  const hits = rules.filter((r) => r.active !== false).map((r) => {
    if (r.kind === "ACTIVITY") {
      const count = mine.filter((a) => String(a.type).toUpperCase() === String(r.field).toUpperCase()).length;
      return { rule: r, hit: r.op === "exists" || !String(r.value ?? "").trim() ? count > 0 : test(count, String(r.op), String(r.value ?? "")) };
    }
    return { rule: r, hit: test(lead[String(r.field)], String(r.op), String(r.value ?? "")) };
  });
  const raw = hits.reduce((s, h) => s + (h.hit ? n(h.rule.points) : 0), 0);
  return { hits, score: Math.max(0, Math.min(100, raw)) };
}

export function recomputeScores() {
  const rules = readCollection("scoring-rules"), acts = readCollection("activities");
  const leads = readCollection("leads");
  for (const l of leads) { const { score } = scoreBreakdown(l, rules, acts); if (n(l.score) !== score || l.score == null) updateRecord("leads", l.id, { score }); }
  return leads.length;
}

export function rescoreLead(id: string) {
  const l = readCollection("leads").find((x) => x.id === id);
  if (!l) return;
  const { score } = scoreBreakdown(l, readCollection("scoring-rules"), readCollection("activities"));
  if (n(l.score) !== score || l.score == null) updateRecord("leads", id, { score });
}

/* ---------- segments ---------- */

export type Member = { id: string; name: string; email: string; kind: string; href?: string; rec: Rec };

// Contacts are the people CRM can reach: leads plus customers that have an email.
export function entityRows(entity: string): Member[] {
  const leads = () => readCollection("leads").map((l) => ({ id: l.id, name: leadName(l), email: String(l.email ?? ""), kind: "Lead", href: `/crm/leads/${l.id}`, rec: l }));
  const customers = () => readCollection("customers").map((c) => ({ id: c.id, name: String(c.name), email: String(c.email ?? ""), kind: "Customer", href: `/ar/customers/${c.id}`, rec: c }));
  if (entity === "LEAD") return leads();
  if (entity === "CUSTOMER") return customers();
  if (entity === "OPPORTUNITY") return readCollection("opportunities").map((o) => ({ id: o.id, name: String(o.title), email: String(readCollection("customers").find((c) => c.name === o.customer)?.email ?? ""), kind: "Opportunity", href: `/crm/opportunities/${o.id}`, rec: o }));
  return [...leads(), ...customers()].filter((m) => m.email).map((m) => ({ ...m, rec: { ...m.rec, name: m.name, kind: m.kind } }));
}

export function segmentMembers(seg: Rec): Member[] {
  const filters = ((seg.filters as Rec[]) ?? []).filter((f) => String(f.field ?? "").trim());
  return entityRows(String(seg.entity)).filter((m) => filters.every((f) => test(m.rec[String(f.field)], String(f.op), String(f.value ?? ""))));
}

/* ---------- campaigns ---------- */

export const merge = (text: string, m: Member) => {
  const first = String(m.rec.firstName ?? m.name.split(" ")[0] ?? "");
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k: string) => (k === "firstName" ? first : k === "name" ? m.name : k === "email" ? m.email : String(m.rec[k] ?? "")));
};

export function campaignAudience(c: Rec) {
  const seg = readCollection("segments").find((s) => s.id === c.segmentId);
  return seg ? segmentMembers(seg).filter((m) => m.email) : [];
}

// Records each due step for each audience member once. A step is due `delayDays` after the
// campaign started; a TRIGGER campaign starts its clock when a member first joins the segment.
export function processCampaign(c: Rec, today = todayIso()) {
  if (c.status !== "running") return 0;
  const steps = (c.steps as Rec[]) ?? [];
  if (!steps.length) return 0;
  const sends = readCollection("campaign-sends").filter((s) => s.campaignId === c.id);
  const audience = campaignAudience(c);
  let made = 0;
  for (const m of audience) {
    const mine = sends.filter((s) => s.recipientId === m.id);
    const start = c.kind === "TRIGGER" ? String(mine[0]?.date ?? today) : String(c.startedAt ?? today);
    steps.forEach((st, i) => {
      if (mine.some((s) => n(s.step) === i)) return;
      if (c.kind === "BLAST" && i > 0) return;
      const due = new Date(`${start}T00:00:00`);
      due.setDate(due.getDate() + (c.kind === "BLAST" ? 0 : n(st.delayDays)));
      if (due.toISOString().slice(0, 10) > today) return;
      createRecord("campaign-sends", { campaignId: c.id, step: i, recipientId: m.id, recipient: m.name, email: m.email, subject: merge(String(st.subject ?? ""), m), date: today, status: "SENT" });
      if (m.kind === "Lead") logActivity({ type: "EMAIL", relatedType: "Lead", relatedId: m.id, subject: `Campaign "${c.name}": ${merge(String(st.subject ?? ""), m)}` });
      made++;
    });
  }
  const left = c.kind !== "TRIGGER" && audience.length > 0 && audience.every((m) => (c.kind === "BLAST" ? [0] : steps.map((_, i) => i)).every((i) => readCollection("campaign-sends").some((s) => s.campaignId === c.id && s.recipientId === m.id && n(s.step) === i)));
  if (left) updateRecord("campaigns", c.id, { status: "completed", completedAt: today });
  return made;
}

export function processDueCampaigns() {
  let made = 0;
  for (const c of readCollection("campaigns")) {
    if (c.status === "scheduled" && c.scheduledAt && String(c.scheduledAt).slice(0, 10) <= todayIso()) { updateRecord("campaigns", c.id, { status: "running", startedAt: todayIso() }); made += processCampaign({ ...c, status: "running", startedAt: todayIso() }); }
    else made += processCampaign(c);
  }
  if (made) recomputeScores();
  return made;
}

/* ---------- web forms ---------- */

export const WEB_FORM_FIELDS = ["Name", "Email", "Phone", "Company"];

export function submitWebForm(form: Rec, data: { name: string; email: string; phone: string; company: string; message?: string }) {
  const [firstName, ...rest] = data.name.trim().split(/\s+/);
  const lead = createRecord("leads", { number: nextNumber("leads", "LEAD"), firstName, lastName: rest.join(" "), organization: data.company.trim(), email: data.email.trim(), phone: data.phone.trim(), source: "WEB", status: "New", notes: data.message ?? "", webFormId: form.id });
  updateRecord("web-forms", form.id, { submissions: n(form.submissions) + 1, lastSubmissionAt: new Date().toISOString() });
  logActivity({ type: "NOTE", relatedType: "Lead", relatedId: lead.id, subject: `Submitted web form "${form.name}"` });
  rescoreLead(lead.id);
  return lead;
}

/* ---------- forecasts ---------- */

export function forecast(opps: Rec[], stages: Rec[]) {
  const sorted = sortStages(stages);
  const open = opps.filter((o) => oppStatus(o, stages) === "OPEN");
  const prob = (o: Rec) => n(o.probability) || n(stageOf(o, stages)?.probability);
  const byStage = sorted.filter((s) => s.kind === "OPEN").map((s) => {
    const deals = open.filter((o) => stageOf(o, stages)?.id === s.id);
    const amount = deals.reduce((t, o) => t + n(o.value), 0);
    return { stage: s, deals: deals.length, amount, weighted: deals.reduce((t, o) => t + (n(o.value) * prob(o)) / 100, 0) };
  });
  const months = new Map<string, { amount: number; weighted: number; deals: number }>();
  for (const o of open) {
    const k = o.closeDate ? String(o.closeDate).slice(0, 7) : "No date";
    const m = months.get(k) ?? { amount: 0, weighted: 0, deals: 0 };
    m.amount += n(o.value); m.weighted += (n(o.value) * prob(o)) / 100; m.deals++;
    months.set(k, m);
  }
  const byMonth = [...months.entries()].sort(([a], [b]) => (a === "No date" ? 1 : b === "No date" ? -1 : a.localeCompare(b))).map(([month, v]) => ({ month, ...v }));
  return { open, byStage, byMonth, amount: open.reduce((t, o) => t + n(o.value), 0), weighted: byStage.reduce((t, s) => t + s.weighted, 0) + open.filter((o) => !stageOf(o, stages)).reduce((t, o) => t + (n(o.value) * prob(o)) / 100, 0) };
}
