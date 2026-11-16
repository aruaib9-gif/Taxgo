import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Banknote,
  Calculator,
  ChartLine,
  Check,
  FileText,
  Hourglass,
  Landmark,
  MessageSquare,
  Plug,
  Plus,
  ScrollText,
  Search,
  ShieldCheck,
  Tags,
  TriangleAlert,
  Users,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { PriceLookup } from "@/components/landing/price-lookup";
import { ModuleExplorer } from "@/components/landing/module-explorer";
import { cn } from "@/lib/utils";
import {
  Container,
  H2,
  Kicker,
  LandingFooter,
  LandingHeader,
  Panel,
  Serif,
  btnOutline,
  btnPrimary,
} from "@/components/landing/chrome";
import { HeroDemo } from "@/components/landing/hero-demo";
import { CountUp } from "@/components/landing/count-up";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";

export const metadata = { title: `${BRAND.fullName} — The AI Business Operating System` };

const AI = BRAND.fullName;

const heroChecks = ["No credit card", "Live in five minutes", "Cancel anytime"];

const compliance = [
  { k: "EU", v: "EU VAT & Peppol" },
  { k: "AMERICA", v: "Retail sales, GST/HST" },
  { k: "ASIA", v: "GST/VAT" },
  { k: "AFRICA", v: "VAT" },
  { k: "AUSTRALIA", v: "GST" },
  { k: "GLOBAL", v: "Multi-entity & VAT" },
];

const worries = [
  ["Is our VAT filing accurate?", "Checked."],
  ["Have we paid that invoice twice?", "Detected."],
  ["Who still owes us money?", "Followed up."],
  ["Did we respond to that big sales lead?", "Replied."],
  ["Are we running low on stock?", "Reordered."],
  ["Can we afford next month's payroll?", "Forecasted."],
  ["Are our books audit-ready?", "Prepared."],
  ["How much profit did we actually make?", "Calculated."],
];

const oldWays: { icon: LucideIcon; kicker: string; title: string; text: string }[] = [
  {
    icon: Users,
    kicker: "More salary to pay",
    title: "Hire more admin",
    text: `Hire several back-office staff at 5–10× the cost of ${AI} — who will eventually leave to join your competitors.`,
  },
  {
    icon: Hourglass,
    kicker: "Someone else's schedule",
    title: "Outsource",
    text: "Your business shouldn't wait days for financial answers or depend on someone else's schedule. Stop chasing paperwork, waiting for reports, and sharing sensitive financial records unnecessarily.",
  },
];

const stats = [
  { n: "25–50%", count: true, t: "Potential reduction in administrative and staffing costs through intelligent automation." },
  { n: "Up to 5×", t: "Greater productivity by freeing your existing team from repetitive tasks." },
  { n: "24/7", count: true, t: "She works around the clock — nights, weekends, and month-end. No overtime. No downtime for holidays." },
];

const steps: { icon: LucideIcon; title: string; text: string; tag: string }[] = [
  {
    icon: FileText,
    title: "She Captures Everything",
    text: `Invoices, receipts, bank transactions, customer enquiries, emails, and inventory movements — ${AI} brings your business information together automatically.`,
    tag: "No duplicate entries. No endless paperwork.",
  },
  {
    icon: Landmark,
    title: "She Gets the Work Done",
    text: "From accounting entries and bank reconciliations to customer follow-ups, payroll processing, and inventory management, she handles routine operations across your business.",
    tag: "Less manual work. Greater accuracy. Higher productivity.",
  },
  {
    icon: ShieldCheck,
    title: "She Brings You the Decisions",
    text: `${AI} identifies unusual transactions, financial risks, business opportunities, and matters requiring your approval.`,
    tag: "You make the important decisions. She handles the execution.",
  },
];

const agents: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Brain, title: "Virtual CFO", text: "Monitors financial performance, identifies risks, and delivers insights to improve profitability and cash flow." },
  { icon: Calculator, title: "Virtual Accountant", text: "Automates bookkeeping, reconciliations, financial reporting, and month-end processes." },
  { icon: TriangleAlert, title: "Intelligent Anomaly Detection", text: "Flags duplicate invoices, unusual payments, suspicious transactions, and potential accounting errors." },
  { icon: ChartLine, title: "Cash Flow Forecasting", text: "Predicts future cash requirements, highlights potential shortfalls, and supports smarter financial planning." },
  { icon: Search, title: "Ask Your Business Anything", text: "Simply ask, “How much profit did we make last month?” and receive an instant, easy-to-understand answer from your business data." },
  { icon: Tags, title: "Smart Transaction Categorization", text: "Automatically classifies transactions into the appropriate accounts and cost centres." },
  { icon: MessageSquare, title: "AI Business Assistant", text: "Guides you through everyday tasks, automates workflows, and executes approved actions across your business." },
];

const weekOne = [
  {
    day: "Day 1",
    title: "Get Started in Minutes",
    text: `Select your country, and ${AI} prepares your accounting structure, tax settings, currencies, and applicable e-invoicing requirements.`,
    tag: "One platform. Ready for business.",
  },
  {
    day: "Day 2",
    title: "Your Business Data Moves with You",
    text: "Switch from QuickBooks, Tally, Zoho, or spreadsheets. We help migrate your accounts, customers, suppliers, inventory, and outstanding invoices.",
    tag: "Your history stays. Your inefficiencies go.",
  },
  {
    day: "Day 3",
    title: "Your AI Colleague Gets to Work",
    text: `${AI} starts automating bookkeeping, identifying overdue payments, managing customer follow-ups, and monitoring daily transactions.`,
    tag: "Less administration. More productivity.",
  },
  {
    day: "Day 30",
    title: "Experience a Smarter Month-End",
    text: "Instead of spending days entering transactions, reconciling accounts, and preparing reports, your team focuses on reviewing exceptions and approving results.",
    tag: `You make the decisions. ${AI} handles the routine work.`,
  },
];

const humans: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Calculator,
    title: "On-Demand Accountant",
    text: `Qualified accountants manage your bookkeeping, reconciliations, month-end closing, and financial reporting — directly within ${AI}.`,
  },
  {
    icon: Brain,
    title: "Virtual & Fractional CFO",
    text: "Access experienced CFOs for financial strategy, cash-flow management, budgeting, forecasting, investor reporting, and fundraising support.",
  },
  {
    icon: ScrollText,
    title: "Tax & Regulatory Compliance",
    text: "Professional assistance with Sales Tax, VAT, GST, e-invoicing, tax returns, and statutory compliance, tailored to your country's requirements.",
  },
  {
    icon: Banknote,
    title: "Managed Payroll Services",
    text: "Payroll specialists handle salary processing, payslips, deductions, and statutory obligations while ensuring compliance with local regulations.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & Assurance Support",
    text: "Keep your financial records audit-ready with professional support for year-end accounts, audit preparation, and auditor enquiries.",
  },
  {
    icon: Plug,
    title: "Setup & Data Migration",
    text: `Move from Tally, Sage, Zoho, QuickBooks, or spreadsheets to ${AI} with expert assistance, ensuring your financial records are properly transferred and configured.`,
  },
];

// VAT / GST rates by region, as supplied in the marketing copy.
const africaCountries = [
  { name: "Nigeria", flag: "🇳🇬" },
  { name: "South Africa", flag: "🇿🇦" },
  { name: "Ghana", flag: "🇬🇭" },
  { name: "Morocco", flag: "🇲🇦" },
  { name: "Kenya", flag: "🇰🇪" },
  { name: "Egypt", flag: "🇪🇬" },
];

// "One simple rule": the two task colours used across the product (ai-done / needs-human tokens).
const rule = [
  {
    tag: `Turquoise · Done by ${AI}`,
    title: `${AI} executes`,
    text: "Routine work is completed automatically, checked for accuracy and recorded in the audit trail.",
    items: [
      "Invoices, receipts and bills captured",
      "Bank and card transactions reconciled",
      "Journal entries and adjustments posted",
      "Payment reminders sent and followed up",
      "Payroll, VAT and reports prepared",
    ],
    icon: Check,
    bar: "bg-ai-done",
    chip: "bg-ai-done/10 text-ai-done",
    tone: "text-ai-done",
  },
  {
    tag: "Blue · Needs your approval",
    title: "You decide",
    text: "Anything unusual, sensitive or above your approval limits waits for a person before it goes ahead.",
    items: [
      "Payments released to suppliers and staff",
      "Tax returns submitted to the authorities",
      "Payroll runs approved",
      "Unusual or flagged transactions reviewed",
      "Disputes, write-offs and exceptions resolved",
    ],
    icon: ShieldCheck,
    bar: "bg-needs-human",
    chip: "bg-needs-human/10 text-needs-human",
    tone: "text-needs-human",
  },
];

const taxRegions: { name: string; rows: { country: string; rate: string; note?: string }[] }[] = [
  {
    name: "Southeast Asia",
    rows: [
      { country: "Philippines", rate: "12%", note: "standard VAT" },
      { country: "Indonesia", rate: "12%", note: "standard VAT, increased from 11% in 2025" },
      { country: "Vietnam", rate: "8%", note: "temporary reduced rate for most goods/services; standard is 10%" },
      { country: "Cambodia", rate: "10%" },
      { country: "Laos (Lao PDR)", rate: "10%" },
      { country: "Singapore", rate: "9%", note: "GST" },
      { country: "Thailand", rate: "7%", note: "reduced rate extended via royal decree; statutory code is 10%" },
      { country: "Malaysia", rate: "No VAT/GST", note: "uses a 10% sales tax and 8% service tax system" },
      { country: "Myanmar", rate: "No VAT", note: "uses a 5% commercial tax" },
      { country: "Brunei / Timor-Leste", rate: "No VAT or GST" },
    ],
  },
  {
    name: "South & Central Asia / Middle East",
    rows: [
      { country: "India", rate: "18%", note: "GST standard structure" },
      { country: "Pakistan", rate: "18%", note: "for goods; 15%–16% for services" },
      { country: "Armenia / Azerbaijan", rate: "20% / 18%" },
      { country: "Kazakhstan", rate: "16%" },
      { country: "United Arab Emirates / Oman", rate: "5%" },
      { country: "Saudi Arabia", rate: "15%" },
    ],
  },
];

const included = [
  "Unlimited users — your whole team, free",
  "All 15 module groups",
  `All of ${AI}'s agents`,
  "ZATCA · UAE VAT · India GST · EU Peppol",
  "Multi-currency & your whole org tree",
  "Real double-entry & full audit trail",
  "Priority onboarding & migration",
  "On-demand accountants & CFOs available",
];

const guarantees = [
  "Free to start — no credit card",
  "Free migration",
  "No lock-in — your data leaves with you",
  "Founding price, locked forever",
  "The 30–50% math shown on your numbers before you sign",
];

const faqs: [string, string][] = [
  [
    `What is ${AI}?`,
    `${AI} is an AI-powered business platform that runs your back office. It brings 15 integrated modules — accounting, sales, purchasing, inventory, payroll, CRM, finance, reporting and more — onto one shared ledger, and does the routine work inside them: capturing documents, posting entries, reconciling accounts, chasing payments and preparing returns. You keep the decisions.`,
  ],
  [
    `How much could ${AI} save my business?`,
    `Most businesses can expect a 25–50% reduction in administrative and staffing costs, depending on how much of your team's time goes on data entry, chasing payments, reconciliations and reports. Before you commit, we look at those hours with you and show you the estimate on your own numbers.`,
  ],
  [
    `What does "up to 5× the productivity" mean?`,
    `When ${AI} takes over the repetitive work, your existing team gets that time back for customers, decisions and growth. Teams that spent most of their week on admin can get several times more done — without hiring.`,
  ],
  [
    `What happens if ${AI} gets something wrong?`,
    `One simple rule: AI executes, humans decide. Anything unusual, uncertain or above your approval limits waits for a person. Turquoise means a task is done; blue means it needs your review. Every action is recorded in the audit trail, and entries can be reversed. Nothing moves money or is filed with a tax authority without your approval.`,
  ],
  [
    "Is it just AI, or are there real accountants and CFOs?",
    `Both. ${AI} handles the routine work, and qualified accountants, tax professionals and CFOs are available on demand for month-end, tax filings, payroll, audits and financial strategy. You pay only for the expert services you use.`,
  ],
  [
    "Which countries and taxes does it support?",
    `${AI} is built for global compliance: EU VAT and Peppol e-invoicing, retail sales tax and GST/HST in the Americas, GST and VAT across Asia and the Middle East, VAT across Africa, GST in Australia, and multi-entity VAT. When you pick your country, your chart of accounts, tax rates, currencies and e-invoicing requirements are set up for you.`,
  ],
  [
    "Can I switch from QuickBooks, Tally, Sage, Zoho or spreadsheets?",
    "Yes — switching is the part we handle. We help migrate your accounts, customers, suppliers, inventory and outstanding invoices, so your history comes with you. Migration assistance is included, subject to data compatibility and the scope of your business.",
  ],
  [
    "How quickly can I get started?",
    `You can be set up in minutes: choose your country and ${AI} prepares your accounting structure. Your data typically follows within a couple of days, and by your first month-end your team is reviewing and approving instead of typing and chasing. Timelines vary with the size of your business.`,
  ],
  [
    `How much does ${AI} cost?`,
    "One price per company in your local currency — never per user. The Complete Package covers every module; Accounting Only is half that, and HR & Payroll, Retail and CRM are a sixth each. Pay monthly or save with annual billing. Type your country in the pricing section above to see your price.",
  ],
  [
    "Can I manage several companies or countries?",
    `Yes. ${AI} supports multiple entities, multiple currencies and your whole organisation structure, with consolidated reporting across them.`,
  ],
  [
    "Is my data safe — and do I keep control of it?",
    "Your data is encrypted in transit and at rest, access is role-based, and every change is logged. It is a real double-entry ledger with a full audit trail. Your business, your data, your control — you can export everything and take it with you whenever you want.",
  ],
  [
    "Do I need accounting knowledge to use it?",
    `No. Ask in plain language — "How much profit did we make last month?" — and get a clear answer from your own data. ${AI} guides you through everyday tasks, and an expert is there when you need one.`,
  ],
  [
    "Can I cancel anytime?",
    "Yes. There's no credit card to start and no lock-in. If you leave, your data leaves with you.",
  ],
  [
    "What is the Cost vs. Efficiency Theory?",
    `It's the idea ${AI} is built on: lasting success comes from working more efficiently, not just from spending less. Instead of cutting corners, you stop paying for repetitive processes and invest in productivity, innovation and growth.`,
  ],
];

/* ---------- page ---------- */

export default function LandingPage() {
  return (
    <div className="bg-lp-canvas text-lp-body">
      {/* nav */}
      <LandingHeader />

      {/* hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,#dfe5ea_0%,#e9e9ea_45%,transparent_80%)]">
        {/* bare map; the logo sits apart from it, at the map's far right, above the result card */}
        <Watermark showTile={false} className="-right-20 top-5 hidden w-190 text-[#dcdfe2] lg:block" />
        <TLogo className="pointer-events-none absolute right-10 top-5 hidden h-21 w-21 opacity-60 drop-shadow-[0_14px_24px_rgba(15,36,56,0.16)] lg:block" />
        <Container className="relative pb-20 pt-20">
          <HeroDemo>
            <div className="mt-8 max-w-125 space-y-3 text-[17px] leading-[1.65] text-lp-body">
              <p>You didn&rsquo;t start a business to manage paperwork.</p>
              <p>
                {AI} automates your sales, inventory, invoicing, payroll, and accounting, helping you cut administrative costs by
                up to 50%, double productivity, and reclaim your time.
              </p>
            </div>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Join {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/login" className={btnOutline}>
                Check your numbers <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-7 flex max-w-120 flex-wrap gap-x-5 gap-y-2.5 text-[14px] text-lp-muted">
              {heroChecks.map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-lp-brand" strokeWidth={2.25} /> {c}
                </li>
              ))}
            </ul>
          </HeroDemo>
        </Container>
      </section>

      {/* the theory — moved out of the hero so it reads as a statement, not a paragraph */}
      <section className="border-t border-lp-line bg-lp-alt">
        <Container className="py-14 text-center">
          <Kicker>{AI} — Work Smarter. Grow Faster.</Kicker>
          <p className="mx-auto mt-5 max-w-3xl text-[22px] leading-[1.4] sm:text-[26px]">
            Built on our <b className="font-semibold text-lp-ink">Cost vs. Efficiency Theory:</b>{" "}
            <Serif className="text-[23px] sm:text-[27px]">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </Serif>
          </p>
          <p className="mt-5 text-[15px] font-semibold text-lp-ink">
            {AI} — Less Cost. More Efficiency. Greater Success.
          </p>
        </Container>
      </section>

      {/* the Tax GO difference — follows the hero demo */}
      <section>
        <Container className="py-16 text-center">
          <Kicker>The {AI} difference</Kicker>
          <H2 className="mx-auto max-w-3xl text-[28px] sm:text-[34px]">
            You ask. {AI} analyzes, prepares and explains.
            <br />
            <span className="text-lp-brand">You stay in control.</span>
          </H2>
          <div className="mx-auto mt-5 max-w-170 space-y-3 text-[16px] leading-[1.65] text-lp-body">
            <p>
              Whether you are running payroll, preparing tax returns or forecasting cash flow, {AI} transforms your financial
              data into actionable information.
            </p>
            <p>
              It does more than calculate numbers. It identifies unusual transactions, explains financial risks, recommends next
              steps and prepares the work for your review.
            </p>
            <p className="font-semibold text-lp-ink">Your AI does the groundwork. You make the decisions.</p>
          </div>
          <p className="mx-auto mt-8 max-w-160 text-[12.5px] italic leading-normal text-lp-muted">
            These examples illustrate intended {AI} workflows. Actual automation, regulatory coverage, payment execution and tax
            filing capabilities depend on the features and integrations enabled. Tax filings and payments require appropriate
            authorization.
          </p>
        </Container>
      </section>

      {/* compliance strip */}
      <section className="border-y border-lp-line">
        <Container className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-4.5">
          <Kicker className="mr-3 tracking-[0.24em]">Global compliant</Kicker>
          {compliance.map((c) => (
            <span key={c.k} className="flex items-center gap-2 text-[14px] text-lp-body">
              <span className="rounded-full border border-lp-line bg-lp-card px-1.5 py-0.5 text-[10px] font-semibold text-lp-ink">
                {c.k}
              </span>
              {c.v}
            </span>
          ))}
        </Container>
      </section>

      {/* the midnight checklist */}
      <section className="border-b border-lp-line">
        <Container className="pb-16 pt-24 text-center">
          <Kicker>The midnight checklist</Kicker>
          <H2>Business worries shouldn&rsquo;t keep you awake.</H2>
          <p className="mx-auto mt-4 max-w-160 text-[16px] leading-[1.6] text-lp-body">
            Every business owner knows the questions that come after midnight.{" "}
            <b className="font-semibold text-lp-ink">{AI} works on the answers while you sleep.</b>
          </p>
          <Panel className="mx-auto mt-12 max-w-3xl divide-y divide-lp-line text-left">
            {worries.map(([q, a]) => (
              <div key={q} className="flex items-center justify-between gap-4 px-6 py-3.5">
                <span className="text-[15px] font-medium text-lp-ink">&ldquo;{q}&rdquo;</span>
                <Serif className="shrink-0 text-[21px]">{a}</Serif>
              </div>
            ))}
          </Panel>
          <div className="mx-auto mt-14 max-w-160 space-y-2.5 text-[16px] leading-[1.6] text-lp-body">
            <p className="text-[18px] font-semibold tracking-[-0.02em] text-lp-ink">{AI} — Your AI-powered business partner, working 24/7.</p>
            <p className="font-semibold text-lp-ink">Less Worry. Greater Efficiency. Better Business.</p>
          </div>
          <p className="mt-10 font-serif text-[20px] italic text-lp-muted">Sleep genius. {AI}&rsquo;s got you covered.</p>
        </Container>
      </section>

      {/* the old ways */}
      <section className="border-b border-lp-line bg-lp-alt">
        <Container className="py-24 text-center">
          <Kicker>The old you</Kicker>
          <H2>
            You&rsquo;ve had two options.
            <br />
            None of them worked.
          </H2>
          <Panel className="mx-auto mt-10 grid max-w-3xl text-left md:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-lp-line">
            {oldWays.map((w) => (
              <div key={w.title} className="px-5.75 pb-7 pt-6">
                <w.icon className="h-4 w-4 text-lp-body" strokeWidth={1.5} />
                <Kicker className="mt-4 text-[10px] tracking-[0.3em]">{w.kicker}</Kicker>
                <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.035em] text-lp-ink">{w.title}</h3>
                <p className="mt-2.5 text-[14px] leading-[1.65] text-lp-body">{w.text}</p>
              </div>
            ))}
          </Panel>
          <div className="mx-auto mt-12 max-w-160 space-y-3 text-[16px] leading-[1.6]">
            <p className="font-semibold text-lp-ink">
              With {AI}, your numbers are at your fingertips — real-time insights, automated accounting, and smarter decisions,
              whenever you need them.
            </p>
            <p className="font-semibold text-lp-ink">Your Business. Your Data. Your Control.</p>
          </div>
          <Link href="/register" className="mt-8 inline-block">
            <Serif className="text-[26px] font-medium hover:underline">Or join {AI}.</Serif>
          </Link>
        </Container>
      </section>

      {/* the math */}
      <section>
        <Container className="py-24 text-center">
          <Kicker>The math</Kicker>
          <H2>Half the Cost. Up to 5× the Productivity.</H2>
          <p className="mx-auto mt-4 max-w-170 text-[17px] font-semibold leading-[1.6] text-lp-ink">
            {AI} isn&rsquo;t just software. She&rsquo;s your AI-powered colleague.
          </p>
          <p className="mx-auto mt-2 max-w-170 text-[16px] leading-[1.6] text-lp-body">
            She manages the repetitive work across your business, 24/7, while your team focuses on decisions, customers, and
            growth.
          </p>
          <Panel className="mx-auto mt-10 grid max-w-4xl md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-lp-line">
            {stats.map((s) => (
              <div key={s.n} className="px-6 pb-8 pt-7">
                <p className="text-[50px] font-semibold leading-none tracking-tighter text-lp-ink">{s.count ? <CountUp value={s.n} /> : s.n}</p>
                <p className="mx-auto mt-5 max-w-65 text-[14px] leading-[1.6] text-lp-body">{s.t}</p>
              </div>
            ))}
          </Panel>
          <div className="mx-auto mt-12 max-w-155 space-y-3 text-[16px] leading-[1.6] text-lp-body">
            <h3 className="text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">How Does the Math Work?</h3>
            <p>
              Calculate the hours your team spends entering data, chasing payments, reconciling accounts, and preparing reports.
            </p>
            <p className="font-semibold text-lp-ink">{AI} automates the busywork. Your people deliver the value.</p>
            <p className="font-semibold text-lp-ink">{AI} — Reduce Costs. Multiply Efficiency. Accelerate Growth.</p>
          </div>
          <Link href="/register" className={cn(btnOutline, "mt-7")}>
            Do the Math for Your Business <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Container>
      </section>

      {/* what she handles */}
      <section id="handles" className="scroll-mt-12">
        <Container className="pb-24 pt-14">
          <Kicker>What {AI} handles</Kicker>
          <H2>One Login. One Platform. Total Business Control.</H2>
          <div className="mt-4 max-w-170 space-y-3 text-[16px] leading-[1.65] text-lp-body">
            <p>Why juggle multiple systems when one intelligent platform can run your entire business?</p>
            <p>
              <b className="font-semibold text-lp-ink">{AI} brings 15 integrated business modules together</b>, powered by one
              shared ledger and real-time data.
            </p>
            <p>
              From sales and purchasing to inventory, payroll, accounting, and reporting, she automates your daily operations
              while you focus on growth.
            </p>
            <p className="font-semibold text-lp-ink">No disconnected systems. No endless spreadsheets. No wasted time.</p>

          </div>
          <ModuleExplorer />
          <p className="mx-auto mt-10 max-w-3xl text-center text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
            {AI} — One Intelligent Platform. 15 Integrated Modules.{" "}
            <span className="text-lp-brand">Your Entire Business Working Together.</span>
          </p>
        </Container>
      </section>

      {/* how Tax GO works */}
      <section id="how" className="scroll-mt-12 border-y border-lp-line bg-lp-alt">
        <Container className="py-24">
          <Kicker>How {AI} works</Kicker>
          <H2>You Ask. She Understands. She Delivers.</H2>
          <p className="mt-4 max-w-170 text-[17px] font-semibold leading-[1.6] text-lp-ink">
            {AI} isn&rsquo;t just another business software. She&rsquo;s your intelligent AI colleague, working 24/7 to make your
            business more efficient.
          </p>
          <Panel className="mt-10 grid md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-lp-line">
            {steps.map((s, i) => (
              <div key={s.title} className="px-5.75 pb-8 pt-7">
                <div className="flex items-start justify-between">
                  <s.icon className="h-4 w-4 text-lp-brand" strokeWidth={1.75} />
                  <span className="font-serif text-[26px] italic leading-none text-lp-muted/50">{i + 1}</span>
                </div>
                <h3 className="mt-7 text-[17px] font-semibold tracking-[-0.035em] text-lp-ink">{s.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.65] text-lp-body">{s.text}</p>
                <p className="mt-3 text-[14px] font-semibold leading-[1.55] text-lp-ink">{s.tag}</p>
              </div>
            ))}
          </Panel>
          <h3 className="mt-16 text-[24px] font-semibold tracking-[-0.04em] text-lp-ink">Your AI-Powered Business Team</h3>
          <div className="mt-7 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <div key={a.title} className="flex gap-3">
                <a.icon className="mt-0.75 h-4 w-4 shrink-0 text-lp-body" strokeWidth={1.5} />
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{a.title}</h3>
                  <p className="mt-1 text-[14px] leading-[1.6] text-lp-muted">{a.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Panel className="mx-auto mt-16 max-w-2xl px-8 pb-10 pt-10 text-center">
            <Kicker className="tracking-[0.3em]">The {AI} Philosophy</Kicker>
            <p className="mt-4 text-[16px] leading-[1.6] text-lp-body">
              Stop paying for repetitive processes. Start investing in productivity, innovation, and growth.
            </p>
            <p className="mt-3 text-[16px] font-semibold leading-[1.6] text-lp-ink">
              {AI} — Your Business. One Intelligent Platform. Unlimited Potential.
            </p>
            <Link href="/register" className={cn(btnPrimary, "mt-7")}>
              Put {AI} to Work <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Panel>
        </Container>
      </section>

      {/* your first 30 days */}
      <section className="border-b border-lp-line">
        <Container className="py-24 text-center">
          <Kicker>Your first 30 days with {AI}</Kicker>
          <H2>Switching Is Easy. We Handle the Hard Work.</H2>
          <p className="mx-auto mt-4 max-w-160 text-[16px] leading-[1.6] text-lp-body">
            No complicated implementation, expensive consultants, or weeks of disruption.{" "}
            <b className="font-semibold text-lp-ink">Sign up, and let {AI} take care of the transition.</b>
          </p>
          <Panel className="mx-auto mt-10 max-w-3xl divide-y divide-lp-line text-left">
            {weekOne.map((d) => (
              <div key={d.day} className="grid grid-cols-[56px_1fr] gap-x-5 px-6 pb-4.5 pt-5.5 sm:grid-cols-[56px_1fr]">
                <Kicker className="mt-0.75 text-[10px] tracking-[0.3em]">{d.day}</Kicker>
                <div>
                  <h3 className="text-[15.5px] font-semibold tracking-[-0.035em] text-lp-ink">{d.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-lp-muted">{d.text}</p>
                  <p className="mt-2 text-[14px] font-semibold leading-normal text-lp-ink">{d.tag}</p>
                </div>
              </div>
            ))}
          </Panel>
          <p className="mx-auto mt-14 max-w-160 text-[16px] font-semibold leading-[1.6] text-lp-ink">
            {AI} — Simple Transition. Intelligent Automation. Greater Business Efficiency.
          </p>
          <Link href="/register" className={cn(btnPrimary, "mt-7")}>
            Start Your Journey with {AI} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="mx-auto mt-4 max-w-140 text-[13px] italic leading-[1.6] text-lp-muted">
            Migration assistance is included, subject to data compatibility and the scope of your business requirements. Setup
            and automation timelines may vary.
          </p>
        </Container>
      </section>

      {/* the human expertise */}
      <section id="humans" className="scroll-mt-12 border-b border-lp-line">
        <Container className="py-24">
          <Kicker>The human expertise behind {AI}</Kicker>
          <H2>
            AI Efficiency. Human Expertise. <span className="text-lp-brand">Complete Peace of Mind.</span>
          </H2>
          <p className="mt-4 max-w-175 text-[17px] font-semibold leading-[1.6] text-lp-ink">
            {AI} handles the routine work. Our qualified accountants, tax professionals, and CFOs step in when you need expert
            judgement.
          </p>
          <p className="mt-3 max-w-175 text-[16px] leading-[1.65] text-lp-body">
            Get professional financial support on demand, without the cost of maintaining a full-time finance department. Pay
            for the services you need, when you need them.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {humans.map((h) => (
              <Panel key={h.title} className="px-5 pb-7 pt-6">
                <h.icon className="h-4 w-4 text-lp-brand" strokeWidth={1.75} />
                <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.035em] text-lp-ink">{h.title}</h3>
                <p className="mt-2.5 text-[14px] leading-[1.65] text-lp-muted">{h.text}</p>
              </Panel>
            ))}
          </div>

          <Panel className="mx-auto mt-12 max-w-2xl px-8 pb-10 pt-11 text-center">
            <Kicker className="tracking-[0.3em]">A message from the {AI} team</Kicker>
            <blockquote className="mt-6 font-serif text-[19px] font-medium italic leading-[1.55] text-lp-ink">
              &ldquo;For over a decade, we&rsquo;ve developed business management solutions and witnessed how administrative
              complexity limits business growth. We built {AI} to change that — combining intelligent automation with human
              expertise to make businesses more efficient, productive, and profitable. AI handles the repetitive work, while
              humans retain control of critical decisions.&rdquo;
            </blockquote>
            <p className="mt-6 text-[14px] font-semibold text-lp-ink">— The {AI} Team</p>
          </Panel>

          <div className="mt-14 text-center">
            <h3 className="text-[24px] font-semibold tracking-[-0.04em] text-lp-ink">One Simple Rule: AI Executes. Humans Decide.</h3>
            <p className="mx-auto mt-3 max-w-160 text-[16px] leading-[1.6] text-lp-body">
              Every task in {AI} carries one of two colours, so you always know what has been done and what is waiting for you.
            </p>
            <div className="mx-auto mt-8 grid max-w-4xl gap-5 text-left md:grid-cols-2">
              {rule.map((r) => (
                <Panel key={r.title} className="relative px-6 pb-7 pt-6">
                  <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1", r.bar)} />
                  <span className={cn("inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold", r.chip)}>
                    <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", r.bar)} />
                    {r.tag}
                  </span>
                  <h4 className="mt-4 text-[19px] font-semibold tracking-[-0.03em] text-lp-ink">{r.title}</h4>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-lp-body">{r.text}</p>
                  <ul className="mt-4 space-y-2 text-[14px] text-lp-body">
                    {r.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <r.icon className={cn("mt-0.75 h-3.5 w-3.5 shrink-0", r.tone)} strokeWidth={2.25} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </Panel>
              ))}
            </div>

            <p className="mx-auto mt-14 max-w-160 text-[16px] font-semibold leading-[1.6] text-lp-ink">
              {AI} — The Power of AI. The Confidence of Human Expertise.
            </p>
            <Link href="/register" className={cn(btnPrimary, "mt-7")}>
              Get Started with {AI} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Container>
      </section>

      {/* local compliance, global efficiency */}
      <section className="border-b border-lp-line bg-lp-alt">
        <Container className="py-20">
          <Kicker>Compliance, in the box</Kicker>
          <H2>Local Compliance. Global Efficiency.</H2>
          <p className="mt-4 max-w-170 text-[16px] leading-[1.65] text-lp-body">
            Whether you operate in one country or across multiple markets, {AI} helps automate financial processes, reduce
            administrative costs, and simplify compliance.
          </p>
          <div className="mt-10 grid items-start gap-5 md:grid-cols-2">
            {taxRegions.map((r) => (
              <Panel key={r.name}>
                <h3 className="border-b border-lp-line px-5 py-3.5 text-[15px] font-semibold tracking-[-0.03em] text-lp-ink">{r.name}</h3>
                <dl className="divide-y divide-lp-line">
                  {r.rows.map((row) => (
                    <div key={row.country} className="px-5 py-3">
                      <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-[14px] font-medium text-lp-ink">{row.country}</dt>
                        <dd className="shrink-0 text-right text-[14px] font-semibold text-lp-brand">{row.rate}</dd>
                      </div>
                      {row.note && <p className="mt-0.5 text-[12.5px] leading-normal text-lp-muted">{row.note}</p>}
                    </div>
                  ))}
                </dl>
              </Panel>
            ))}
            <Panel className="md:col-span-2">
              <h3 className="border-b border-lp-line px-5 py-3.5 text-[15px] font-semibold tracking-[-0.03em] text-lp-ink">Africa</h3>
              <div className="px-5 py-4">
                <p className="text-[14px] leading-[1.65] text-lp-body">
                  {AI} simplifies VAT and GST calculations, invoicing, reporting, and tax preparation across Nigeria, South Africa,
                  Ghana, Morocco, Kenya, Egypt, and many more African countries.
                </p>
                <ul className="mt-3.5 flex flex-wrap gap-2">
                  {africaCountries.map((c) => (
                    <li key={c.name} className="flex items-center gap-1.5 rounded-full border border-lp-line bg-lp-canvas px-3 py-1 text-[13px] text-lp-ink">
                      <span aria-hidden>{c.flag}</span>
                      {c.name}
                    </li>
                  ))}
                  <li className="rounded-full px-1 py-1 text-[13px] text-lp-muted">and many more</li>
                </ul>
              </div>
            </Panel>
          </div>
          <div className="mt-14 text-center">
            <p className="text-[16px] font-semibold text-lp-ink">{AI} — One Platform. Multiple Countries. Smarter Compliance.</p>
            <Link href="/register" className={cn(btnPrimary, "mt-7")}>
              Start with {AI} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Container>
      </section>

      {/* pricing */}
      <section id="pricing" className="scroll-mt-12 border-b border-lp-line">
        <Container className="py-24 text-center">
          <Kicker>Pricing</Kicker>
          <H2>Five packages. One price per company.</H2>
          <p className="mx-auto mt-4 max-w-170 text-[16px] leading-[1.6] text-lp-body">
            Take the Complete Package — everything she does — or just the part you need: Accounting, HR &amp; Payroll,
            Retail or CRM. Priced per company in your own currency, billed monthly or annually. Unlimited users — your
            team, your accountant, your auditor, all free. No per-seat math.
          </p>
          <Panel className="mx-auto mt-10 grid max-w-4xl text-left md:grid-cols-[468px_1fr] md:divide-x divide-y md:divide-y-0 divide-lp-line">
            <div className="px-6.5 pb-7 pt-7">
              <PriceLookup />
              <div className="mt-6 border-t border-lp-line pt-6">
                <p className="text-[14px] leading-[1.65] text-lp-body">
                  A junior back-office hire costs 4–10× this. Works 8 hours. Takes leave. Eventually resigns.{" "}
                  <Serif className="text-[15px] font-medium">{AI} doesn&rsquo;t.</Serif>
                </p>
                <Link href="/register" className={cn(btnPrimary, "mt-5 w-full")}>
                  Hire {AI} — free to start <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <p className="mt-3 text-center text-[12px] text-lp-muted">No credit card. Cancel anytime.</p>
              </div>
            </div>
            <div className="px-6.5 pb-7 pt-8.5">
              <Kicker className="text-[10px] tracking-[0.3em]">Complete Package — all included</Kicker>
              <ul className="mt-4 space-y-2.75">
                {included.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14px] text-lp-body">
                    <Check className="mt-0.75 h-3.5 w-3.5 shrink-0 text-lp-brand" strokeWidth={2} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
          <ul className="mx-auto mt-9 flex max-w-225 flex-wrap justify-center gap-x-5 gap-y-3 text-[14px] text-lp-body">
            {guarantees.map((g) => (
              <li key={g} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-lp-brand" strokeWidth={2} /> {g}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* faq */}
      <section id="faq" className="scroll-mt-12">
        <Container className="max-w-191.5 pb-20 pt-24">
          <Kicker>Frequently asked questions</Kicker>
          <H2>Everything you need to know.</H2>
          <div className="mt-8">
            {faqs.map(([q, a]) => (
              <details key={q} className="group border-b border-lp-line last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4.5 text-[16px] font-semibold tracking-[-0.03em] text-lp-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <Plus className="h-3 w-3 shrink-0 text-lp-muted transition-transform group-open:rotate-45" strokeWidth={2.5} />
                </summary>
                <p className="-mt-1 pb-5 pr-10 text-[14px] leading-[1.7] text-lp-muted">{a}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* final CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-28 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <h2 className="mt-12 text-[36px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[46px]">
              Automate your back office, GO efficient.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">Say {AI}.</span>
            </h2>
            <p className="mt-7 text-[18px] font-semibold tracking-[-0.02em]">In Just Five Minutes, Your Business Gets Smarter.</p>
            <p className="mx-auto mt-3 max-w-130 text-[16px] leading-[1.6] text-white/75">
              Your chart of accounts is ready, {AI} is processing her first invoice, and your business is moving towards
              intelligent automation.
            </p>
            <p className="mx-auto mt-3 max-w-140 text-[15px] font-semibold leading-[1.6] text-white/90">
              Less Administration. Greater Efficiency. More Time for What Matters.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Join {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/40 px-6.5 py-1.75 text-[15px] font-medium text-white transition hover:bg-white/5"
              >
                Talk to a person <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <div className="mx-auto mt-12 max-w-130 border-t border-white/10 pt-10">
              <p className="text-[17px] font-semibold tracking-[-0.02em]">Month-End Is Coming. Are You Ready?</p>
              <p className="mt-2 text-[15px] leading-[1.6] text-white/65">
                No more last-minute reconciliations, endless spreadsheets, or financial reporting stress.
              </p>
              <p className="mt-4 text-[15px] font-semibold text-white/90">You decide. {AI} gets it done.</p>
            </div>
            <p className="mt-10 font-serif text-[17px] italic text-lp-sky/80" lang="fr">
              &laquo;&nbsp;Vous le dites. {AI} s&rsquo;occupe du reste.&nbsp;&raquo;
            </p>
            <p className="mt-3 text-[13px] font-semibold uppercase tracking-[0.18em] text-white/50">
              Less Stress. Smarter Accounting. Greater Efficiency.
            </p>
          </Container>
        </section>

        <LandingFooter />
      </div>

      <WhatsAppButton />
    </div>
  );
}
