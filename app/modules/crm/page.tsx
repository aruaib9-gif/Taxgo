import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Quote } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  Container,
  H2,
  Kicker,
  LandingFooter,
  LandingHeader,
  Serif,
  btnOutline,
  btnPrimary,
} from "@/components/landing/chrome";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { BackToTop } from "@/components/landing/back-to-top";
import {
  AiNote,
  Caption,
  DataTable,
  Example,
  Figures,
  Flow,
  Fn,
  Formula,
  Ledger,
  Note,
  P,
  PartHeading,
} from "@/components/landing/guide";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: `CRM module`, // the root layout appends "· Tax GO"
  description: `The ${AI} CRM, sales pipeline and marketing module in full: nine functions across leads, opportunities, activities, quotes, campaigns, lead scoring, segments, forecasting and web-to-lead capture.`,
};

const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

type Photo = [src: string, alt: string];

const leadPhotos: Photo[] = [
  ["/crm/leads-1.jpg", "A sales team reviewing performance on screen"],
  ["/crm/leads-2.jpg", "A manager analysing a CRM dashboard on a tablet"],
  ["/crm/leads-3.jpg", "A marketing team planning customer acquisition"],
];

const campaignPhotos: Photo[] = [
  ["/crm/campaign-1.jpg", "An email marketing dashboard"],
  ["/crm/campaign-2.jpg", "Marketing analytics on screen"],
  ["/crm/campaign-3.jpg", "A campaign performance dashboard"],
];

const webPhotos: Photo[] = [
  ["/crm/web-1.jpg", "A landing page template on a laptop"],
  ["/crm/web-2.jpg", "A website demo request form"],
  ["/crm/web-3.jpg", "An automated lead capture assistant"],
];

/** What a lead record holds. */
const leadFields: [string, string][] = [
  ["Contact name", "Identify the potential customer"],
  ["Company name", "Identify the organisation"],
  ["Email address", "Enable communication"],
  ["Telephone", "Facilitate direct engagement"],
  ["Country", "Identify the geographical market"],
  ["Industry", "Classify the business sector"],
  ["Lead source", "Identify the acquisition channel"],
  ["Product interest", "Understand what they need"],
  ["Estimated deal value", "Assess the commercial potential"],
  ["Assigned salesperson", "Establish responsibility"],
  ["Lead score", "Prioritise sales engagement"],
  ["Lead status", "Track qualification progress"],
];

/** The pipeline, stage by stage. */
const pipeline: { stage: string; total: string; deals: [string, string][] }[] = [
  { stage: "Qualified", total: "$130,000", deals: [["ABC Retail Group", "$45,000"], ["Global Distribution", "$85,000"]] },
  { stage: "Discovery", total: "$60,000", deals: [["Prime Logistics", "$60,000"]] },
  { stage: "Proposal", total: "$155,000", deals: [["Metro Supermarket", "$35,000"], ["International Trading", "$120,000"]] },
  { stage: "Negotiation", total: "$75,000", deals: [["City Medical Centre", "$75,000"]] },
  { stage: "Won", total: "$50,000", deals: [["Smart Retail Ltd.", "$50,000"]] },
];

/** The engagement history on one deal. */
const timeline: [string, string, string][] = [
  ["Lead captured", "10 November · Website enquiry", "Interested in an integrated accounting and POS solution."],
  ["Qualification call", "11 November · Sales representative", "Confirmed the requirement for five retail branches."],
  ["Product demonstration", "14 November · Technical sales", "Showed accounting, inventory and POS."],
  ["Quotation sent", "17 November · Sales department", "Implementation and subscription proposal submitted."],
  ["Follow-up scheduled", "23 November · Pending", "Discuss the quotation and the implementation timeline."],
];

/** Quotation through to cash. */
const quoteLifecycle: [string, string][] = [
  ["Qualified opportunity", "The customer's requirements are identified"],
  ["Generate the quotation", "Products, quantities, prices and terms"],
  ["Customer acceptance", "The commercial terms are agreed"],
  ["Convert to a sales order", "It passes into sales operations"],
  ["Fulfilment and invoice", "Supply, then the accounting transaction"],
  ["Payment and reconciliation", "Record and match the receipt"],
];

/** The drip sequence. */
const drip: [string, string, string][] = [
  ["Day 1", "Welcome to the future of intelligent accounting", "Introduce Tax GO and what it brings together."],
  ["Day 3", "How much time do you spend on manual accounting?", "Explain the automation and the efficiency it buys."],
  ["Day 7", "See Tax GO in action", "Invite them to book a demonstration."],
  ["Day 14", "Transform your business with Tax GO", "Encourage registration or a consultation."],
];

/** Campaign results. */
const campaignFunnel: [string, number, string][] = [
  ["Emails sent", 10000, "—"],
  ["Delivered", 9800, "98.0% delivery rate"],
  ["Unique opens", 4200, "42.9% open rate"],
  ["Unique clicks", 1150, "11.7% click-through"],
  ["Leads generated", 320, "—"],
  ["Converted customers", 75, "23.4% lead conversion"],
];

/** The scoring rules. */
const scoringRules: [string, string][] = [
  ["Matches the target industry", "+15"],
  ["Company has over 50 employees", "+10"],
  ["Located in the target market", "+10"],
  ["Contact is a decision-maker", "+15"],
  ["Opens a marketing email", "+5"],
  ["Clicks a product information link", "+10"],
  ["Requests a product demonstration", "+25"],
  ["Requests a commercial quotation", "+30"],
  ["No engagement for 30 days", "−15"],
  ["Invalid contact information", "−30"],
];

/** The dynamic segments. */
const segments: [string, string][] = [
  ["Canadian retail businesses", "Country = Canada AND Industry = Retail"],
  ["High-priority leads", "Lead score ≥ 70"],
  ["Unconverted demonstration requests", "Demo requested AND Not converted"],
  ["European accounting practices", "Region = Europe AND Industry = Accounting"],
  ["Inactive customers", "No activity within 90 days"],
  ["Email campaign engagement", "Clicked a campaign link"],
  ["Logistics opportunities", "Industry = Logistics AND Open opportunity"],
];

/** Who each segment is pitched. */
const segmentTargets: { title: string; text: string; src: string; alt: string; count: string }[] = [
  {
    title: "Retail businesses",
    count: "450 contacts",
    text: "POS, inventory, branch management, loyalty and financial accounting.",
    src: "/crm/segment-retail.jpg",
    alt: "A grocery shop counter",
  },
  {
    title: "Accounting practices",
    count: "320 contacts",
    text: "Document processing, automated bookkeeping, bank reconciliation, tax reporting.",
    src: "/crm/segment-accounting.jpg",
    alt: "An accountant working with ledgers and a calculator",
  },
  {
    title: "Logistics & distribution",
    count: "180 contacts",
    text: "Fleet management, van sales, routes, inventory and operational accounting.",
    src: "/crm/segment-logistics.jpg",
    alt: "A distribution warehouse with loading bays",
  },
  {
    title: "Multinational organisations",
    count: "150 contacts",
    text: "Multi-currency accounting, international tax, consolidation and budgeting.",
    src: "/crm/segment-multinational.jpg",
    alt: "A business meeting in an international office",
  },
];

/** The weighted forecast. */
const forecast: [string, number, number][] = [
  ["Qualified", 200000, 10],
  ["Discovery", 300000, 25],
  ["Proposal", 450000, 50],
  ["Negotiation", 350000, 75],
  ["Final approval", 150000, 90],
];

/** What CRM activity does, and does not, post. */
const ledgerImpact: [string, string][] = [
  ["Lead created", "No posting"],
  ["Lead score updated", "No posting"],
  ["Sales opportunity created", "No posting"],
  ["Customer activity recorded", "No posting"],
  ["Marketing campaign created", "No posting by creation alone"],
  ["Sales forecast prepared", "No posting"],
  ["Quotation issued", "No posting"],
  ["Sales order confirmed", "Normally no GL posting"],
  ["Goods delivered", "Inventory and cost of sales where applicable"],
  ["Sales invoice posted", "Accounts receivable, revenue and applicable tax"],
  ["Customer payment received", "Bank or cash, and accounts receivable"],
  ["Bank transaction reconciled", "Confirms existing entries; adjustments where required"],
];

/** The executive dashboard. */
const dashboard: [string, string][] = [
  ["Total leads", "1,250"],
  ["Open opportunities", "185"],
  ["Open pipeline", "$1.45M"],
  ["Weighted forecast", "$717.5K"],
  ["Outstanding quotes", "$450K"],
  ["Won deals this month", "$285K"],
  ["Hot leads", "240"],
  ["Overdue activities", "18"],
];

const attention: [string, string][] = [
  ["High-priority leads", "12 high-scoring leads have not been contacted."],
  ["Sales opportunities", "Eight negotiations have had no recent activity."],
  ["Commercial quotations", "15 quotations are approaching expiry."],
  ["Sales forecast", "The weighted forecast is below the sales target."],
];

/** What you can ask her. */
const asks: [string, string][] = [
  ["Review all the new leads from yesterday.", "Analyse, classify and prioritise them"],
  ["Which opportunities can we close this month?", "Analyse stages and expected closing dates"],
  ["Organise my customer follow-ups today.", "Prepare the schedule and draft the communications"],
  ["Prepare a quotation for this customer.", "Draft it from the configured products and pricing"],
  ["Create a campaign for Canadian retailers.", "Prepare the content and identify the audience"],
  ["Show me our hottest leads.", "Review the configured scores and engagement signals"],
  ["Find logistics companies interested in our software.", "Prepare a dynamic segment"],
  ["Forecast next quarter's sales.", "Analyse weighted pipeline values and closing periods"],
  ["Review all enquiries from our website.", "Summarise them and recommend qualification actions"],
];

const controls: [string, string][] = [
  ["Lead ownership", "Establish individual sales responsibility"],
  ["Duplicate detection", "Maintain accurate customer records"],
  ["Opportunity stage controls", "Ensure pipeline progress means something"],
  ["Activity history", "Maintain the record of customer interactions"],
  ["Quotation approval", "Prevent unauthorised commercial commitments"],
  ["Pricing controls", "Protect margins and authorised discounts"],
  ["Campaign consent", "Support lawful marketing communication"],
  ["Lead scoring rules", "Keep qualification criteria consistent"],
  ["Segment validation", "Ensure the right audience is selected"],
  ["Forecast assumptions", "Keep revenue expectations realistic"],
  ["Website endpoint security", "Prevent spam and unauthorised access"],
  ["User permissions", "Protect confidential commercial information"],
  ["AI approval controls", "Keep human oversight of significant actions"],
  ["Audit trail", "Establish accountability for business decisions"],
];

export default function CrmPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-(--lp-map) lg:block" />
        <Container className="relative pb-14 pt-14">
          <div className="relative z-10">
            <Link
              href="/handles"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-lp-muted transition-colors hover:text-lp-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Her task &amp; our products
            </Link>
            <H2 className="mt-7">
              From first contact. <Serif className="text-[32px] sm:text-[40px]">To financial success.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              The CRM module runs the whole customer acquisition journey — capturing someone&rsquo;s interest,
              qualifying it, working the deal and turning it into a confirmed sale. Most CRM systems sit apart from
              accounting, inventory and finance, which is where the duplication and the inconsistencies come from.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              Here, lead qualification, follow-ups, quotations, marketing segmentation and forecasting can be
              automated step by step, with management still holding the decisions.
            </p>
          </div>
        </Container>
      </section>

      {/* the nine functions */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Acquisition & relationships" />

            <Fn id="leads" title="Leads — capture, qualify, convert">
              <P>
                A lead is a person or organisation that has shown interest but has not yet bought anything. The leads
                function captures them, keeps their details, assigns a salesperson, assesses the potential and
                converts the qualified ones into opportunities.
              </P>
              <Photos photos={leadPhotos} />
              <Caption>Where leads come from</Caption>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Website", "Social media", "Email", "Referrals", "Exhibitions", "Manual entry"].map((source) => (
                  <span key={source} className="rounded-lg bg-lp-alt px-3 py-1.5 text-[13px] text-lp-body">
                    {source}
                  </span>
                ))}
              </div>
              <Flow
                steps={[
                  ["Capture", "Everything lands in one lead database"],
                  ["Qualify and score", "Against the configured rules"],
                  ["Convert, nurture or close", "An opportunity, continued engagement, or archived"],
                ]}
              />
              <Caption>Example — leads overview</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-4">
                {[
                  ["Total leads", "1,250"],
                  ["New this month", "185"],
                  ["Qualified", "420"],
                  ["Converted this month", "68"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <Caption>What a lead record holds</Caption>
              <DataTable head={["Field", "Purpose"]} rows={leadFields.map((f) => [...f])} />
              <Warning>
                A lead is not revenue. It is a potential commercial relationship that still has to be qualified and
                developed.
              </Warning>
              <AiNote>
                {AI} can assess the information on a lead, suggest a classification, find duplicates, recommend the
                follow-up and push the promising ones up the list.
              </AiNote>
            </Fn>

            <Fn id="opportunities" title="Opportunities — the pipeline">
              <P>
                An opportunity is a qualified deal that has moved past initial interest. The board shows deal values,
                expected closing dates, probabilities and progress, on a drag-and-drop kanban or as a table.
              </P>
              <Caption>Example — the open pipeline</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                {pipeline.map((column) => (
                  <div
                    key={column.stage}
                    className={cn(
                      "rounded-xl border px-3.5 py-3",
                      column.stage === "Won" ? "border-ai-done/30 bg-ai-done/8" : "border-lp-line bg-lp-card",
                    )}
                  >
                    <p className="text-[13px] font-semibold tracking-[-0.02em] text-lp-ink">{column.stage}</p>
                    <p className="text-[12px] text-lp-muted">
                      {column.deals.length} {column.deals.length === 1 ? "deal" : "deals"} · {column.total}
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {column.deals.map(([name, value]) => (
                        <li key={name} className="rounded-lg bg-lp-alt px-3 py-2">
                          <p className="text-[12.5px] font-medium text-lp-ink">{name}</p>
                          <p className="text-[12.5px] text-lp-muted">{value}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Figures
                items={[
                  ["Total open pipeline", "$420,000"],
                  ["Won deals", "$50,000"],
                  ["Stages", "Qualified → Won"],
                ]}
              />
              <Caption>What an opportunity carries</Caption>
              <DataTable
                head={["Information", "Why it matters"]}
                rows={[
                  ["Opportunity name", "Identify the deal"],
                  ["Customer or lead", "Link the buyer"],
                  ["Estimated value", "Measure the potential revenue"],
                  ["Sales stage", "Track the progress"],
                  ["Probability", "Estimate the likelihood"],
                  ["Expected closing date", "Support revenue planning"],
                  ["Sales representative", "Establish ownership"],
                  ["Win or loss reason", "Support performance analysis"],
                ]}
              />
              <AiNote>
                She can spot deals going quiet, flag the ones needing attention, recommend the next action and point
                out the risks to conversion.
              </AiNote>
            </Fn>

            <Fn id="activities" title="Activities — the engagement history">
              <P>
                Calls, emails, meetings, tasks and notes against leads, opportunities and customers — so follow-ups do
                not get forgotten and relationships do not live only in one person&rsquo;s memory.
              </P>
              <Caption>Example — ABC Retail Group, $45,000</Caption>
              <ol className="mt-3 space-y-2">
                {timeline.map(([what, when, detail]) => (
                  <li key={what} className="flex gap-3 rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lp-brand" />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-lp-ink">{what}</p>
                      <p className="text-[12.5px] text-lp-muted">{when}</p>
                      <p className="mt-0.5 text-[13px] text-lp-body">{detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Note>
                This is what makes accountability possible: who contacted the customer, what was discussed, what was
                promised and what is still outstanding.
              </Note>
              <AiNote>
                {AI} can summarise an interaction history, prepare the follow-up email, find overdue activities and
                recommend what suits the stage the deal is at.
              </AiNote>
            </Fn>

            <PartHeading title="Quotations & marketing" />

            <Fn id="quotes" title="Quotes — the formal offer">
              <P>
                A quotation sets out the products or services, the quantities, the prices, the taxes and the terms.
                Accepted, it converts into a sales order — which is where CRM hands over to the sales module.
              </P>
              <Flow steps={quoteLifecycle} />
              <Caption>Example — QT-2026-0045</Caption>
              <div className="mt-3 overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-lp-line px-5 py-4">
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">QT-2026-0045</p>
                    <p className="mt-0.5 text-[13px] text-lp-muted">ABC Retail Group · five retail locations</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-lp-muted">21 November 2026 · valid 30 days</span>
                    <Status kind="wait">Awaiting acceptance</Status>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <DataTable
                    head={["Description", "Amount"]}
                    rows={[
                      ["Accounting & ERP implementation", "$15,000"],
                      ["POS deployment", "$10,000"],
                      ["Inventory configuration", "$8,000"],
                      ["Staff training", "$5,000"],
                      ["Annual software subscription", "$7,000"],
                    ]}
                  />
                  <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-[13.5px]">
                    <div className="flex justify-between gap-6">
                      <dt className="text-lp-muted">Subtotal</dt>
                      <dd className="text-lp-body">$45,000</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt className="text-lp-muted">HST at 13%</dt>
                      <dd className="text-lp-body">$5,850</dd>
                    </div>
                    <div className="flex justify-between gap-6 border-t border-lp-line pt-1.5">
                      <dt className="font-semibold text-lp-ink">Total</dt>
                      <dd className="font-semibold text-lp-ink">$50,850</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <Warning>
                Issuing or even accepting a quotation does not create revenue or a ledger posting on its own. Revenue
                arrives when the recognition criteria are met.
              </Warning>
              <AiNote>
                {AI} can draft quotations from the customer&rsquo;s requirements, suggest the right products, check the
                pricing and prepare the follow-up.
              </AiNote>
            </Fn>

            <Fn id="campaigns" title="Campaigns — email marketing that runs itself">
              <P>
                Bulk campaigns and automated drip sequences: a series of scheduled messages that educate, engage and
                convert, with opens and clicks tracked so engagement can be judged.
              </P>
              <Photos photos={campaignPhotos} />
              <Caption>Example — a new customer acquisition sequence</Caption>
              <ol className="mt-3 space-y-2">
                {drip.map(([day, subject, purpose]) => (
                  <li key={day} className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <span className="rounded-lg bg-lp-alt px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-lp-ink">
                      {day}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13.5px] font-medium text-lp-ink">&ldquo;{subject}&rdquo;</span>
                      <span className="mt-0.5 block text-[13px] text-lp-muted">{purpose}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Caption>Campaign performance</Caption>
              <div className="mt-3 space-y-2">
                {campaignFunnel.map(([label, value, rate]) => (
                  <div key={label}>
                    <div className="flex items-baseline justify-between text-[13.5px]">
                      <span className="text-lp-body">{label}</span>
                      <span className="text-lp-muted">
                        <b className="font-semibold text-lp-ink">{value.toLocaleString("en-US")}</b>
                        {rate !== "—" && <> · {rate}</>}
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-lp-alt">
                      <div style={{ width: `${(value / 10000) * 100}%`, backgroundColor: CHART.blue }} className="h-full rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
              <Warning>
                Campaigns must follow the applicable privacy, consent, unsubscribe and electronic marketing rules —
                CASL in Canada, the GDPR-related requirements in Europe. Privacy protections and automated scanners
                also affect how accurate open tracking is.
              </Warning>
              <AiNote>
                She can draft the content, suggest the audience, analyse engagement trends, recommend the follow-up
                sequence and find the people worth contacting.
              </AiNote>
            </Fn>

            <PartHeading title="Qualification & segmentation" />

            <Fn id="lead-scoring" title="Lead scoring — who to call first">
              <P>
                Scores come from configured rules over the customer profile — industry, size, location, job title,
                product interest — and behavioural signals: email engagement, clicks, enquiries, demo requests, sales
                interactions.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {[
                  ["Cold", "0–39 points", "bg-lp-alt text-lp-muted"],
                  ["Warm", "40–69 points", "bg-needs-human/12 text-needs-human"],
                  ["Hot", "70+ points", "bg-ai-done/12 text-ai-done"],
                ].map(([band, range, tone]) => (
                  <div key={band} className={cn("rounded-xl px-4 py-3", tone)}>
                    <p className="text-[14px] font-semibold tracking-[-0.02em]">{band}</p>
                    <p className="mt-0.5 text-[13px] opacity-80">{range}</p>
                  </div>
                ))}
              </div>
              <DataTable
                head={["Characteristic or activity", "Score"]}
                rows={scoringRules.map(([rule, score]) => [
                  rule,
                  <span key={rule} className={cn("font-semibold", score.startsWith("−") ? "text-lp-muted" : "text-lp-brand")}>
                    {score}
                  </span>,
                ])}
              />
              <Example>
                A decision-maker at a 50-plus-employee company in the target market and industry who has requested a
                demonstration scores 70 — a hot lead, and one to call directly.
              </Example>
              <Note>Scores indicate priority, not guaranteed purchasing behaviour.</Note>
              <AiNote>
                {AI} can explain why a lead scored what it did, spot changes in engagement, analyse whether the scoring
                is working and recommend rule changes.
              </AiNote>
            </Fn>

            <Fn id="segments" title="Segments — lists that keep themselves current">
              <P>
                Segments divide leads and customers by shared characteristics, interests or behaviour, built with a
                filter DSL — a structured way of writing the conditions a record must satisfy. Unlike a static mailing
                list, a dynamic segment changes as the records do.
              </P>
              <DataTable head={["Segment", "Filter conditions"]} rows={segments.map((s) => [...s])} />
              <Caption>Example filter</Caption>
              <pre className="mt-3 overflow-x-auto rounded-xl bg-lp-alt px-4 py-3.5 font-mono text-[13px] leading-[1.7] text-lp-ink">
{`country = "Canada"
AND industry = "Retail"
AND lead_score >= 70
AND converted = false
AND marketing_consent = true`}
              </pre>
              <P small>
                High-priority Canadian retail leads that have not converted and may lawfully be contacted. A new lead
                meeting the conditions joins the segment; one whose details change leaves it.
              </P>
              <Caption>What each segment gets told</Caption>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {segmentTargets.map((segment) => (
                  <figure key={segment.title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image
                        src={segment.src}
                        alt={segment.alt}
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{segment.title}</p>
                      <p className="text-[12.5px] text-lp-brand">{segment.count}</p>
                      <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{segment.text}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Note>Segments may overlap — one contact can belong to several.</Note>
              <AiNote>
                She can analyse customer characteristics, suggest segments, identify high-engagement audiences and
                prepare the communications for each industry.
              </AiNote>
            </Fn>

            <PartHeading title="Forecasting" />

            <Fn id="forecasts" title="Sales forecasts — the pipeline, weighted">
              <P>
                Forecasting applies the stage probability to each open opportunity, which separates the total pipeline
                from the part of it likely to arrive.
              </P>
              <Formula>Weighted value = deal value × probability</Formula>
              <P small>
                An opportunity worth $100,000 in negotiation at 75% contributes $75,000 to the forecast.
              </P>
              <ForecastChart />
              <DataTable
                head={["Stage", "Pipeline value", "Probability", "Weighted value"]}
                rows={[
                  ...forecast.map(([stage, value, probability]) => [
                    stage,
                    `$${value.toLocaleString("en-US")}`,
                    `${probability}%`,
                    `$${((value * probability) / 100).toLocaleString("en-US")}`,
                  ]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="p" className="font-semibold text-lp-ink">$1,450,000</b>,
                    "—",
                    <b key="w" className="font-semibold text-lp-ink">$717,500</b>,
                  ],
                ]}
              />
              <Figures
                items={[
                  ["Weighted forecast", "$717.5K"],
                  ["Sales target", "$1M"],
                  ["Gap to target", "$282.5K"],
                ]}
              />
              <P small>Target achievement: 71.75%.</P>
              <Note>
                Forecasts support budgeting, recruitment, production scheduling, procurement, cash flow and expansion
                decisions.
              </Note>
              <Warning>
                Forecast sales are not guaranteed revenue, confirmed orders or cash. They stay separate from the
                accounting results until the transactions actually happen.
              </Warning>
              <AiNote>
                {AI} can analyse historical conversion rates, question unrealistic closing dates, highlight stalled
                deals, recommend probability adjustments and build scenarios.
              </AiNote>
            </Fn>

            <PartHeading title="Website lead capture" />

            <Fn id="web-to-lead" title="Web-to-lead forms — enquiries that arrive as records">
              <P>
                Public endpoints take an enquiry straight from the website into the CRM, so a form completed at
                midnight is a lead by morning without anyone retyping it.
              </P>
              <Photos photos={webPhotos} />
              <Flow
                steps={[
                  ["Website enquiry form", "Details, requirements and the applicable consent"],
                  ["Public capture endpoint", "Validate the submission and apply the controls"],
                  ["A new CRM lead", "Qualification, assignment, scoring and follow-up"],
                ]}
              />
              <Warning>
                A public endpoint needs submission validation, spam protection, rate limiting, duplicate detection,
                secure transmission, consent records and a privacy notice — and must expose nothing beyond intended
                lead submissions.
              </Warning>
              <AiNote>
                She can read the stated requirements, suggest products, classify the lead, recommend who should own it
                and prepare a personalised acknowledgement.
              </AiNote>
            </Fn>
          </div>
        </Container>
      </section>

      {/* accounting integration */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>CRM and the ledger</Kicker>
          <H2>From website visitor to financial statements.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            CRM is not a list of names and email addresses. It is the beginning of the revenue lifecycle — and most of
            it, correctly, posts nothing at all.
          </p>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Business activity", "General ledger impact"]} rows={ledgerImpact.map((r) => [...r])} />
          </div>

          <Caption>Example — a $45,000 opportunity, end to end</Caption>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ["Opportunity created", "$45,000", "No posting"],
              ["Weighted at 50%", "$22,500", "No posting"],
              ["Quotation accepted", "$45,000", "Commercial commitment"],
              ["Invoice posted", "$50,850", "Includes $5,850 HST"],
              ["Payment received", "$50,850", "Receivable settled"],
            ].map(([stage, value, note]) => (
              <div key={stage} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[13px] font-semibold tracking-[-0.02em] text-lp-ink">{stage}</p>
                <p className="mt-1 text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                <p className="text-[12px] text-lp-muted">{note}</p>
              </div>
            ))}
          </div>
          <Caption>When the invoice is posted</Caption>
          <Ledger
            rows={[
              ["Accounts receivable", "$50,850", "—"],
              ["Sales revenue", "—", "$45,000"],
              ["HST payable", "—", "$5,850"],
            ]}
          />
          <Caption>When the customer pays</Caption>
          <Ledger
            rows={[
              ["Bank", "$50,850", "—"],
              ["Accounts receivable", "—", "$50,850"],
            ]}
          />
          <Note>
            The CRM tracks commercial progress; the accounting module records what actually happened financially.
          </Note>
        </Container>
      </section>

      {/* dashboard */}
      <section>
        <Container className="py-16">
          <Kicker>Executive CRM dashboard</Kicker>
          <H2>How marketing turns into money.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                <p className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {attention.map(([title, text]) => (
              <div key={title} className="rounded-xl border border-needs-human/30 bg-needs-human/6 px-4 py-3.5">
                <p className="flex items-center gap-2 text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">
                  <CircleAlert className="h-3.5 w-3.5 shrink-0 text-needs-human" strokeWidth={2} /> {title}
                </p>
                <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{text}</p>
              </div>
            ))}
          </div>
          <Note>Illustrative executive dashboard, not live company information.</Note>
        </Container>
      </section>

      {/* agentic AI */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Agentic AI across all nine functions</Kicker>
          <H2>
            A CRM that helps do the work, <Serif className="text-[32px] sm:text-[40px]">not just record it.</Serif>
          </H2>
          <div className="mt-8">
            <DataTable
              head={[`What you ask ${AI}`, "What she can prepare or perform"]}
              rows={asks.map(([q, a]) => [
                <span key={q} className="font-medium text-lp-ink">
                  &ldquo;{q}&rdquo;
                </span>,
                a,
              ])}
            />
          </div>

          <Caption>Example — Monday morning with the sales director</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Sales director</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  Good morning, {AI}. Review the leads from the weekend, identify who is most likely to convert,
                  prepare the follow-up emails, review outstanding quotations and update the forecast.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                Good morning. Your sales action plan is prepared.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "86 new leads across four channels, 18 high-priority on the scoring rules",
                  "42 personalised follow-up drafts written",
                  "Nine opportunities needing immediate attention",
                  "15 quotations approaching expiry, three new drafts prepared",
                  "Two potential segments for new campaigns",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-4 rounded-lg bg-lp-card px-3 py-2.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">Updated weighted forecast</p>
                <p className="text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">$842,500</p>
                <p className="text-[12.5px] text-ai-done">+$125,000 against the previous forecast</p>
              </div>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Four things need your approval: sending the 42 emails, releasing three quotations, launching the
                retail campaign and the proposed probability adjustments.{" "}
                <b className="font-semibold text-lp-ink">You remain in control of the decisions.</b>
              </p>
            </div>
          </div>
          <Note>
            Illustrative workflow. What she can actually do depends on the integrations, the data access and the
            permissions configured.
          </Note>
        </Container>
      </section>

      {/* controls + philosophy */}
      <section>
        <Container className="py-16">
          <Kicker>CRM controls & governance</Kicker>
          <H2>Reliable information, and accountability for it.</H2>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Control", "Purpose"]} rows={controls.map((c) => [...c])} />
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              ["/crm/philosophy-1.jpg", "A sales conversation with a prospective customer"],
              ["/crm/philosophy-2.jpg", "A business team reviewing growth plans"],
              ["/crm/philosophy-3.jpg", "Marketing and sales metrics on a dashboard"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-alt">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} CRM philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              Every lead is an opportunity. Every relationship is an asset.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              Businesses do not grow because they hold more customer information. They grow because they understand it
              and act on it. A lead never contacted is a missed opportunity; a quotation never followed up is lost
              revenue; a campaign sent to the wrong audience is wasted money; a forecast disconnected from performance
              is unreliable planning.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-lp-body">
              Growing revenue does not mean growing the sales department at the same rate. It means better customer
              information, more effective engagement, intelligent automation and consistent follow-up. You build the
              relationships; she helps manage the opportunities.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — From first contact{" "}
              <span className="text-lp-brand">to financial success.</span>
            </p>
          </div>
        </Container>
      </section>

      {/* final CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <h2 className="mt-9 text-[34px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[42px]">
              Stop running the back office.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">Tell {AI}.</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Hire {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/handles" className={cn(btnOutline, "border-white/40 bg-transparent text-white hover:bg-white/5")}>
                See the other modules <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Container>
        </section>
        <LandingFooter />
      </div>

      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}

/* ---------- this guide's own pieces ---------- */

function Photos({ photos }: { photos: Photo[] }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {photos.map(([src, alt]) => (
        <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-alt">
          <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

function Status({ kind, children }: { kind: "ok" | "wait" | "no"; children: ReactNode }) {
  const tone = {
    ok: "bg-ai-done/12 text-ai-done",
    wait: "bg-needs-human/12 text-needs-human",
    no: "bg-lp-ink/10 text-lp-muted",
  }[kind];
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]", tone)}>
      {children}
    </span>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex max-w-3xl gap-2.5 rounded-xl border border-needs-human/30 bg-needs-human/8 px-4 py-3 text-[13.5px] leading-[1.6] text-lp-body">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-needs-human" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}

/** Pipeline against the probability-weighted forecast. */
function ForecastChart() {
  const max = 500000;
  const top = 10;
  const base = 196;
  const left = 56;
  const band = 94;
  const bar = 26;
  const y = (v: number) => base - (v / max) * (base - top);

  return (
    <div>
      <div className="mt-4 flex gap-5 text-[12px] text-lp-muted">
        {[
          ["Pipeline", CHART.blue],
          ["Weighted forecast", CHART.green],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 540 230" className="mt-2 w-full" role="img" aria-label="Pipeline value against weighted forecast by sales stage">
        {[0, 250000, 500000].map((v) => (
          <g key={v}>
            <line x1={left} x2="530" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              ${v / 1000}K
            </text>
          </g>
        ))}
        {forecast.map(([stage, value, probability], i) => {
          const weighted = (value * probability) / 100;
          const x = left + i * band + (band - bar * 2 - 5) / 2;
          return (
            <g key={stage}>
              <rect x={x} y={y(value)} width={bar} height={base - y(value)} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 5} y={y(weighted)} width={bar} height={base - y(weighted)} rx="3" fill={CHART.green} />
              <text x={left + i * band + band / 2} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[11px]">
                {stage}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
