import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Brain,
  Banknote,
  Calculator,
  ChartColumn,
  ChartLine,
  Check,
  Cog,
  FileText,
  FolderOpen,
  Heart,
  Hourglass,
  Landmark,
  MessageSquare,
  Package,
  PackageOpen,
  Plug,
  Plus,
  ScrollText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Store,
  Tags,
  Target,
  TriangleAlert,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { HeroDemo } from "@/components/landing/hero-demo";
import { CountUp } from "@/components/landing/count-up";
import { LandingLogo, TGMark, Watermark, WhatsAppButton } from "@/components/landing/brand";

export const metadata = { title: `${BRAND.fullName} — The AI Business Operating System` };

const AI = BRAND.fullName;

const navLinks = [
  { href: "#handles", label: "What she handles" },
  { href: "#how", label: "How she works" },
  { href: "#humans", label: "The humans" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

const heroChecks = ["Live in five minutes", "No credit card", "No lock-in, cancel anytime", "A human when you want one"];

const compliance = [
  { k: "KSA", v: "ZATCA e-invoicing" },
  { k: "UAE", v: "FTA VAT & Corporate Tax" },
  { k: "IND", v: "GST & e-invoice" },
  { k: "GCC", v: "Multi-entity & VAT" },
  { k: "EU", v: "EU VAT & Peppol" },
];

const worries = [
  ["Is the VAT filing actually right this quarter?", "Filed."],
  ["Did we already pay that invoice once?", "Caught."],
  ["Who owes us money right now — and how much?", "Chased."],
  ["Did anyone follow up on that big lead?", "Replied."],
  ["Are we about to run out of our best seller?", "Reordered."],
  ["Can we make payroll next month?", "Forecast."],
  ["Are the books ready if the auditor calls?", "Ready."],
  ["What did we actually make this month?", "Closed."],
];

const oldWays: { icon: LucideIcon; kicker: string; title: string; text: string }[] = [
  {
    icon: Users,
    kicker: "Another salary",
    title: "Hire more admin",
    text: `A junior back-office hire costs 4–10× ${AI}, works eight hours, takes leave, needs managing — and eventually resigns with everything they know.`,
  },
  {
    icon: Boxes,
    kicker: "Another tool",
    title: "Buy more software",
    text: "Tally, Zoho, spreadsheets — they record the work; they don't do it. Six logins later, the typing, chasing and matching are still yours.",
  },
  {
    icon: Hourglass,
    kicker: "Another queue",
    title: "Outsource the books",
    text: "Your numbers sit in someone else's backlog. Answers arrive in days, strangers pass your books around — and you still chase the paperwork.",
  },
];

const stats = [
  { n: "30–50%", count: true, t: "lower salary cost, from the day she takes over the busywork", extra: "Guaranteed." },
  { n: "2×", t: "the output from the team you already have — they decide, she executes" },
  { n: "24/7", count: true, t: "she works nights, weekends and month-end — and never resigns" },
];

const modules: { icon: LucideIcon; title: string; text: string; accent?: boolean }[] = [
  { icon: Calculator, title: "Accounting", text: "GL, tax & compliance" },
  { icon: BookOpen, title: "Quick Entry", text: "Daybook, expense & income" },
  { icon: ShoppingCart, title: "Sales", text: "Quote-to-cash, invoicing & AR" },
  { icon: PackageOpen, title: "Purchasing", text: "Procure-to-pay & bills" },
  { icon: Package, title: "Inventory", text: "Products, stock & warehouses" },
  { icon: Target, title: "CRM", text: "Leads, pipeline & activities" },
  { icon: Store, title: "Operations", text: "POS, van sales & helpdesk" },
  { icon: Cog, title: "Manufacturing", text: "Production & work orders" },
  { icon: FolderOpen, title: "Projects", text: "Projects, tasks & timesheets" },
  { icon: Users, title: "HR", text: "Employees, leave & attendance" },
  { icon: Banknote, title: "Payroll", text: "Salary runs, claims & payslips" },
  { icon: Landmark, title: "Finance", text: "Banking, loans & budgets" },
  { icon: Heart, title: "Social Impact", text: "Zakat & charity tracking" },
  { icon: ChartColumn, title: "Analytics", text: "Reports & live dashboards" },
  { icon: Zap, title: `${AI}'s agents`, text: "Quiet automation across it all", accent: true },
];

const steps: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: FileText,
    title: "She reads everything.",
    text: `Invoices, receipts, bank feeds, leads, emails, stock counts. Everything that enters your business, ${AI} takes in. Nothing is typed twice.`,
  },
  {
    icon: Landmark,
    title: "She does the work.",
    text: "Posts the entries, chases the receivables, replies to the leads, runs the payroll, reorders the stock. Finished work on a true double-entry ledger — not suggestions.",
  },
  {
    icon: ShieldCheck,
    title: "She brings you the decisions.",
    text: "A judgement call, an odd amount, a deal worth your attention — the moments that need a human come to one. You decide. She carries it out.",
  },
];

const agents: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Brain, title: "Virtual CFO", text: "Reads your numbers and raises what needs attention before it hurts cash." },
  { icon: Calculator, title: "Virtual accountant", text: "Drafts entries, reconciles accounts and keeps your ledger close-ready." },
  { icon: TriangleAlert, title: "Anomaly detection", text: "Catches duplicate bills, odd amounts and unusual activity as they appear." },
  { icon: ChartLine, title: "Cash-flow forecasting", text: "Projects runway and upcoming crunches from your real transactions." },
  { icon: Search, title: "Ask your business", text: "“What did we spend on travel in Q1?” — the answer arrives in plain language." },
  { icon: Tags, title: "Auto-categorizer", text: "Tags every transaction to the right account and cost centre as it posts." },
  { icon: MessageSquare, title: "In-app assistant", text: "Guides any screen and takes actions on your behalf, end to end." },
];

const weekOne = [
  {
    day: "Day 1",
    title: "Live in five minutes.",
    text: "Pick your country. Your chart of accounts, taxes, currencies and e-invoicing exist before the kettle boils.",
  },
  {
    day: "Day 2",
    title: "Your history arrives.",
    text: "We move you off Tally, Zoho, QuickBooks or spreadsheets — accounts, contacts, stock and open invoices — free, and set up right.",
  },
  {
    day: "Day 3",
    title: "Her first morning.",
    text: "Overdue invoices chased, waiting leads answered, the day's entries posted. The first “Handled.” lands before your coffee.",
  },
  {
    day: "Day 30",
    title: "The month closes itself.",
    text: "Your first month-end where you review and approve instead of type and chase. It stays this way.",
  },
];

const humans: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Calculator,
    title: "On-demand accountant",
    text: "A qualified accountant to own your month-end, clean-ups and day-to-day books — inside your system.",
  },
  {
    icon: Brain,
    title: "Virtual & fractional CFO",
    text: "Board-ready reporting, cash strategy, budgets and fundraising help from a real CFO, when you need one.",
  },
  {
    icon: ScrollText,
    title: "Tax & compliance filing",
    text: "Experts file your ZATCA e-invoices, VAT, GST and returns — accurately, on time, every period.",
  },
  {
    icon: Banknote,
    title: "Payroll, run for you",
    text: "Hand salary runs, payslips and statutory payments to a specialist who knows your country's rules.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & assurance support",
    text: "Audit-ready books and a human who speaks your auditor's language at year-end.",
  },
  {
    icon: Plug,
    title: "Setup & migration",
    text: "We move you off Tally, Zoho, QuickBooks or spreadsheets and set your books up right from day one.",
  },
];

const regions = [
  {
    k: "KSA",
    name: "Saudi Arabia",
    text: "ZATCA Phase 2 (Fatoora) e-invoicing, 15% VAT, Arabic invoices and Saudi-ready reporting — built in.",
  },
  {
    k: "UAE",
    name: "United Arab Emirates",
    text: "FTA-compliant 5% VAT returns and UAE Corporate Tax, AED multi-currency books and free-zone invoicing.",
  },
  {
    k: "IND",
    name: "India",
    text: "GST with e-invoice (IRN/QR), TDS, HSN/SAC codes and GSTR-ready reports for every state.",
  },
  {
    k: "EU",
    name: "Europe",
    text: "EU VAT schemes, Peppol e-invoicing, EUR/GBP multi-currency and IFRS-friendly double-entry.",
  },
];

const pricing = [
  { region: "India", price: "₹1,00,000" },
  { region: "United Arab Emirates", price: "AED 4,499" },
  { region: "Saudi Arabia", price: "SAR 4,499" },
  { region: "Europe", price: "€1,099" },
  { region: "Rest of world", price: "$1,199" },
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
    `What exactly is ${AI}?`,
    `An AI colleague that runs your back office. ${AI} sits on a full double-entry ledger with 15 module groups — accounting, sales, purchasing, stock, payroll, CRM and more — and does the work inside them: reading documents, posting entries, chasing payments and filing returns, while you make the decisions.`,
  ],
  [
    `What if ${AI} gets something wrong?`,
    "She drafts; a human approves. Anything unusual, uncertain or above your thresholds waits for sign-off, every action is in the audit trail, and any entry can be reversed. Nothing moves money or files with a tax authority without your approval.",
  ],
  [
    "I'm already on Tally, Zoho or spreadsheets. How painful is switching?",
    "Not at all — switching is the part we do for you. We migrate your accounts, contacts, stock and open invoices free of charge, and you're typically running in parallel within two days.",
  ],
  [
    "Is this just AI, or are there real accountants and CFOs?",
    "Both. The AI does the heavy lifting; qualified accountants and CFOs stand behind her on demand for month-end, filings, payroll and audits. You pay only for the human time you use.",
  ],
  [
    "How is the 30–50% guarantee measured?",
    "Before you sign, we count the hours your team spends typing, chasing, matching and filing, and price them at your real salary costs. We show you the math on your numbers — and if the saving isn't there, you don't pay.",
  ],
  [
    "Is it an alternative to Tally, Zoho Books, QuickBooks or an ERP?",
    `Yes. ${AI} replaces your accounting software and the ERP modules around it — and unlike them, she does the work rather than just recording it.`,
  ],
  [
    "Does it support ZATCA e-invoicing in Saudi Arabia?",
    "Yes. ZATCA Phase 2 (Fatoora) integration, cryptographic stamps and QR codes, Arabic and bilingual invoices, and 15% VAT returns are built in.",
  ],
  [
    "Does it handle UAE VAT and Corporate Tax?",
    "Yes — FTA-compliant 5% VAT returns, UAE Corporate Tax computations, free-zone invoicing and AED multi-currency books.",
  ],
  [
    "Does it support GST and e-invoicing in India?",
    "Yes — GST with IRN/QR e-invoicing, e-way bills, TDS, HSN/SAC codes and GSTR-ready reports for every state.",
  ],
  [
    "Is my data safe, and is it real accounting?",
    "Your data is encrypted in transit and at rest, access is role-based, and every change is logged. Underneath is a true double-entry ledger with a full audit trail — and your data leaves with you whenever you want.",
  ],
  [
    "How fast can I get started?",
    "Five minutes. Pick your country and your chart of accounts, taxes, currencies and e-invoicing are set up instantly. Your history follows within a couple of days.",
  ],
  [
    `Why is it called ${AI}?`,
    "Because tax and compliance are where back offices hurt most, and because she goes wherever you operate — Saudi Arabia, the UAE, India, Europe and beyond. Tell her, and it's handled.",
  ],
];

/* ---------- small building blocks ---------- */

function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-[1148px] px-6", className)}>{children}</div>;
}

function Kicker({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-body", className)}>{children}</p>
  );
}

function H2({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={cn("mt-4 text-[32px] font-semibold leading-[1.15] tracking-[-0.045em] text-lp-ink sm:text-[40px]", className)}>
      {children}
    </h2>
  );
}

function Serif({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("font-serif font-semibold italic text-lp-blue", className)}>{children}</span>;
}

function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("overflow-hidden rounded-2xl border border-lp-line bg-lp-card", className)}>{children}</div>;
}

const btnPrimary =
  "inline-flex items-center justify-center gap-2.5 rounded-full bg-lp-blue px-[22px] py-[7px] text-[15px] font-medium text-lp-navy transition hover:brightness-110";
const btnOutline =
  "inline-flex items-center justify-center gap-2.5 rounded-full border border-lp-ink/25 bg-lp-card px-[26px] py-[7px] text-[15px] font-medium text-lp-ink transition hover:bg-white";

/* ---------- page ---------- */

export default function LandingPage() {
  return (
    <div className="bg-lp-canvas text-lp-body">
      {/* nav */}
      <header className="sticky top-0 z-30 border-b border-lp-line bg-lp-canvas/90 backdrop-blur">
        <Container className="flex h-[50px] items-center justify-between gap-6">
          <div className="flex items-center gap-[26px]">
            <LandingLogo />
            <nav className="hidden items-center gap-[22px] text-[14px] text-lp-body lg:flex">
              {navLinks.map((l) => (
                <a key={l.href} href={l.href} className="transition-colors hover:text-lp-ink">
                  {l.label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hidden text-[14px] font-medium text-lp-ink sm:block">
              Sign in
            </Link>
            <Link href="/register" className="rounded-full bg-lp-blue px-3.5 py-[5px] text-[14px] font-medium text-lp-navy transition hover:brightness-110">
              Hire {AI}
            </Link>
          </div>
        </Container>
      </header>

      {/* hero */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,#dfe5ea_0%,#e9e9ea_45%,transparent_80%)]">
        <Watermark
          className="lp-turn right-[-60px] top-[60px] hidden rotate-[70deg] text-[300px] text-[#d9dcdf] lg:block"
          dot="bg-[#cdd5de]"
        />
        <Container className="relative pb-20 pt-20">
          <HeroDemo>
            <p className="mt-9 max-w-[500px] text-[17px] leading-[1.72] text-lp-body">
              You didn&rsquo;t start a company to run its admin. {AI} runs your sales, stock, invoices, payroll and books end to
              end — and brings you only the decisions. Owners cut salary costs 30–50%, double their output, and get their
              evenings back.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Hire {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/home" className={btnOutline}>
                See her on your numbers <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-8 flex max-w-[480px] flex-wrap gap-x-4 gap-y-2.5 text-[14px] text-lp-muted">
              {heroChecks.map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-lp-blue" strokeWidth={2.25} /> {c}
                </li>
              ))}
            </ul>
          </HeroDemo>
        </Container>
      </section>

      {/* compliance strip */}
      <section className="border-y border-lp-line">
        <Container className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 py-[18px]">
          <Kicker className="mr-3 tracking-[0.24em]">Compliant where you operate</Kicker>
          {compliance.map((c) => (
            <span key={c.k} className="flex items-center gap-2 text-[14px] text-lp-body">
              <span className="rounded-full border border-lp-line bg-lp-card px-1.5 py-[2px] text-[10px] font-semibold text-lp-ink">
                {c.k}
              </span>
              {c.v}
            </span>
          ))}
        </Container>
      </section>

      {/* the 2 a.m. list */}
      <section className="border-b border-lp-line">
        <Container className="pb-16 pt-24 text-center">
          <Kicker>The 2 a.m. list</Kicker>
          <H2>The questions that keep owners awake.</H2>
          <p className="mx-auto mt-4 max-w-[640px] text-[16px] leading-[1.6] text-lp-body">
            You know the list. It visits after midnight. {AI} works through it while you sleep.
          </p>
          <Panel className="mx-auto mt-12 max-w-[768px] divide-y divide-lp-line text-left">
            {worries.map(([q, a]) => (
              <div key={q} className="flex items-center justify-between gap-4 px-6 py-[14px]">
                <span className="text-[15px] text-lp-body">&ldquo;{q}&rdquo;</span>
                <Serif className="shrink-0 text-[21px]">{a}</Serif>
              </div>
            ))}
          </Panel>
          <p className="mt-14 font-serif text-[18px] italic text-lp-muted">Sleep. She&rsquo;s turning.</p>
        </Container>
      </section>

      {/* the old ways */}
      <section className="border-b border-lp-line bg-lp-alt">
        <Container className="py-24 text-center">
          <Kicker>The old ways</Kicker>
          <H2>
            You&rsquo;ve had three options.
            <br />
            None of them worked.
          </H2>
          <Panel className="mx-auto mt-10 grid max-w-[1024px] text-left md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-lp-line">
            {oldWays.map((w) => (
              <div key={w.title} className="px-[23px] pb-7 pt-6">
                <w.icon className="h-4 w-4 text-lp-body" strokeWidth={1.5} />
                <Kicker className="mt-4 text-[10px] tracking-[0.3em]">{w.kicker}</Kicker>
                <h3 className="mt-2 text-[18px] font-semibold tracking-[-0.035em] text-lp-ink">{w.title}</h3>
                <p className="mt-2.5 text-[14px] leading-[1.65] text-lp-body">{w.text}</p>
              </div>
            ))}
          </Panel>
          <Serif className="mt-12 block text-[26px] font-medium">Or tell {AI}.</Serif>
        </Container>
      </section>

      {/* the math */}
      <section>
        <Container className="py-24 text-center">
          <Kicker>The math</Kicker>
          <H2>Half the payroll. Twice the output.</H2>
          <p className="mx-auto mt-4 max-w-[680px] text-[16px] leading-[1.6] text-lp-body">
            {AI} isn&rsquo;t a tool your team uses. She&rsquo;s a colleague who does the work — across every corner of the
            business, around the clock — while your people keep the judgement. The busywork stops needing salaries.
          </p>
          <Panel className="mx-auto mt-10 grid max-w-[896px] md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-lp-line">
            {stats.map((s) => (
              <div key={s.n} className="px-6 pb-8 pt-7">
                <p className="text-[50px] font-semibold leading-none tracking-[-0.05em] text-lp-ink">{s.count ? <CountUp value={s.n} /> : s.n}</p>
                <p className="mx-auto mt-5 max-w-[260px] text-[14px] leading-[1.6] text-lp-body">{s.t}</p>
                {s.extra && <Serif className="mt-3 block text-[19px] font-medium">{s.extra}</Serif>}
              </div>
            ))}
          </Panel>
          <p className="mx-auto mt-10 max-w-[560px] text-[16px] leading-[1.6] text-lp-body">
            How can we guarantee it? Count the hours your team spends typing, chasing, matching and filing. {AI} does those
            hours. The rest is arithmetic.
          </p>
          <Link href="/register" className={cn(btnOutline, "mt-6")}>
            Do the math on your business <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Container>
      </section>

      {/* what she handles */}
      <section id="handles" className="scroll-mt-12">
        <Container className="pb-24 pt-14">
          <Kicker>What she handles</Kicker>
          <H2>One login in the morning. Not six.</H2>
          <p className="mt-4 max-w-[660px] text-[16px] leading-[1.65] text-lp-body">
            Fifteen module groups on one shared ledger — one version of the truth, and {AI} working inside every one of them.
            Sell, buy, hire, pay and report from a single place, and retire the spreadsheet graveyard.
          </p>
          <Panel className="mt-11 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
            {modules.map((m) => (
              <div key={m.title} className="-mb-px -mr-px border-b border-r border-lp-line px-[17px] pb-[19px] pt-[17px]">
                <m.icon className={cn("h-4 w-4", m.accent ? "text-lp-blue" : "text-lp-body")} strokeWidth={1.5} />
                <h3 className="mt-3 text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{m.title}</h3>
                <p className="mt-1 text-[12.5px] text-lp-muted">{m.text}</p>
              </div>
            ))}
          </Panel>
        </Container>
      </section>

      {/* how she works */}
      <section id="how" className="scroll-mt-12 border-y border-lp-line bg-lp-alt">
        <Container className="py-24">
          <Kicker>How she works</Kicker>
          <H2>You speak plainly. She does the rest.</H2>
          <Panel className="mt-10 grid md:grid-cols-3 md:divide-x divide-y md:divide-y-0 divide-lp-line">
            {steps.map((s, i) => (
              <div key={s.title} className="px-[23px] pb-8 pt-7">
                <div className="flex items-start justify-between">
                  <s.icon className="h-4 w-4 text-lp-blue" strokeWidth={1.75} />
                  <span className="font-serif text-[26px] italic leading-none text-lp-muted/50">{i + 1}</span>
                </div>
                <h3 className="mt-7 text-[17px] font-semibold tracking-[-0.035em] text-lp-ink">{s.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.65] text-lp-body">{s.text}</p>
              </div>
            ))}
          </Panel>
          <div className="mt-12 grid gap-x-10 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <div key={a.title} className="flex gap-3">
                <a.icon className="mt-[3px] h-4 w-4 shrink-0 text-lp-body" strokeWidth={1.5} />
                <div>
                  <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{a.title}</h3>
                  <p className="mt-1 text-[14px] leading-[1.6] text-lp-muted">{a.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* week one */}
      <section className="border-b border-lp-line">
        <Container className="py-24 text-center">
          <Kicker>Week one</Kicker>
          <H2>Switching is the part we do for you.</H2>
          <p className="mx-auto mt-4 max-w-[640px] text-[16px] leading-[1.6] text-lp-body">
            No implementation project, no consultants, no six-week migration. You sign up; we carry everything over — and she
            gets to work.
          </p>
          <Panel className="mx-auto mt-10 max-w-[768px] divide-y divide-lp-line text-left">
            {weekOne.map((d) => (
              <div key={d.day} className="grid grid-cols-[56px_1fr] gap-x-5 px-6 pb-[18px] pt-[22px] sm:grid-cols-[56px_1fr]">
                <Kicker className="mt-[3px] text-[10px] tracking-[0.3em]">{d.day}</Kicker>
                <div>
                  <h3 className="text-[15.5px] font-semibold tracking-[-0.035em] text-lp-ink">{d.title}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.6] text-lp-muted">{d.text}</p>
                </div>
              </div>
            ))}
          </Panel>
          <Link href="/register" className={cn(btnPrimary, "mt-7")}>
            Start day one <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <p className="mt-3 text-[14px] text-lp-muted">Migration is included. So is changing your mind.</p>
        </Container>
      </section>

      {/* the humans */}
      <section id="humans" className="scroll-mt-12 border-b border-lp-line">
        <Container className="py-24">
          <Kicker>The humans behind her</Kicker>
          <H2>
            When you want a human, <span className="text-lp-blue">a human steps in.</span>
          </H2>
          <p className="mt-4 max-w-[680px] text-[16px] leading-[1.65] text-lp-body">
            {AI} does the heavy lifting. Qualified accountants and CFOs stand behind her — on demand for month-end, filings,
            payroll and audits. Pay only for what you use. No retainers, no minimums, no strangers to your books.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {humans.map((h) => (
              <Panel key={h.title} className="px-5 pb-7 pt-6">
                <h.icon className="h-4 w-4 text-lp-blue" strokeWidth={1.75} />
                <h3 className="mt-4 text-[16px] font-semibold tracking-[-0.035em] text-lp-ink">{h.title}</h3>
                <p className="mt-2.5 text-[14px] leading-[1.65] text-lp-muted">{h.text}</p>
              </Panel>
            ))}
          </div>

          <Panel className="mx-auto mt-12 max-w-[672px] px-8 pb-10 pt-11 text-center">
            <Kicker className="tracking-[0.3em]">A note from the people building her</Kicker>
            <blockquote className="mt-6 font-serif text-[19px] font-medium italic leading-[1.55] text-lp-ink">
              &ldquo;We spent ten years building ERPs and watching owners drown in their own back office. {AI} is everything we
              know, folded into a colleague who never tires — she drafts, a human approves, and that rule is permanent.&rdquo;
            </blockquote>
            <p className="mt-6 text-[14px] text-lp-body">— the {AI} team, Bairuha Tech</p>
          </Panel>

          <p className="mt-12 text-center text-[14px] text-lp-body">
            The legend is simple, here and inside the product: <b className="font-medium text-lp-teal">turquoise</b> means
            she&rsquo;s done it; <b className="font-medium text-lp-blue">blue</b> means it needs a human.
          </p>
        </Container>
      </section>

      {/* compliance, in the box */}
      <section className="border-b border-lp-line bg-lp-alt">
        <Container className="py-20">
          <Kicker>Compliance, in the box</Kicker>
          <H2>The local rules ship with her.</H2>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {regions.map((r) => (
              <Panel key={r.k} className="flex gap-4 px-5 py-5">
                <span className="flex h-[31px] w-[38px] shrink-0 items-center justify-center rounded-full bg-lp-ink text-[11px] font-semibold text-white">
                  {r.k}
                </span>
                <div>
                  <h3 className="text-[16px] font-semibold tracking-[-0.035em] text-lp-ink">{r.name}</h3>
                  <p className="mt-1.5 text-[14px] leading-[1.65] text-lp-muted">{r.text}</p>
                </div>
              </Panel>
            ))}
          </div>
        </Container>
      </section>

      {/* pricing */}
      <section id="pricing" className="scroll-mt-12 border-b border-lp-line">
        <Container className="py-24 text-center">
          <Kicker>Pricing</Kicker>
          <H2>One plan. Everything she does.</H2>
          <p className="mx-auto mt-4 max-w-[680px] text-[16px] leading-[1.6] text-lp-body">
            Per company, per year. Unlimited users — your team, your accountant, your auditor, all free. No per-seat math, no
            surprise tiers, no feature you have to unlock later.
          </p>
          <Panel className="mx-auto mt-10 grid max-w-[896px] text-left md:grid-cols-[468px_1fr] md:divide-x divide-y md:divide-y-0 divide-lp-line">
            <div className="px-[26px] pb-7 pt-7">
              <dl className="space-y-[14px]">
                {pricing.map((p) => (
                  <div key={p.region} className="flex items-baseline justify-between gap-4">
                    <dt className="text-[14px] text-lp-body">{p.region}</dt>
                    <dd className="whitespace-nowrap text-[11px] text-lp-muted">
                      <span className="text-[16px] font-semibold tracking-[-0.03em] text-lp-ink">{p.price}</span> / company / year
                    </dd>
                  </div>
                ))}
              </dl>
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
            <div className="px-[26px] pb-7 pt-[34px]">
              <Kicker className="text-[10px] tracking-[0.3em]">Everything included</Kicker>
              <ul className="mt-4 space-y-[11px]">
                {included.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[14px] text-lp-body">
                    <Check className="mt-[3px] h-3.5 w-3.5 shrink-0 text-lp-blue" strokeWidth={2} /> {f}
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
          <ul className="mx-auto mt-9 flex max-w-[900px] flex-wrap justify-center gap-x-5 gap-y-3 text-[14px] text-lp-body">
            {guarantees.map((g) => (
              <li key={g} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-lp-blue" strokeWidth={2} /> {g}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* faq */}
      <section id="faq" className="scroll-mt-12">
        <Container className="max-w-[766px] pb-20 pt-24">
          <Kicker>Questions</Kicker>
          <H2>Asked, answered.</H2>
          <div className="mt-8">
            {faqs.map(([q, a]) => (
              <details key={q} className="group border-b border-lp-line last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-[18px] text-[16px] font-semibold tracking-[-0.03em] text-lp-ink [&::-webkit-details-marker]:hidden">
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
        <Watermark
          className="-bottom-[90px] left-[40px] hidden rotate-[160deg] text-[260px] text-white/[0.05] md:block"
          dot="bg-[#3f5d7a]"
        />
        <section className="relative">
          <Container className="py-28 text-center">
            <TGMark className="text-[22px] text-white" />
            <h2 className="mt-12 text-[36px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[46px]">
              Stop running the back office.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">Tell {AI}.</span>
            </h2>
            <p className="mx-auto mt-6 max-w-[460px] text-[16px] leading-[1.6] text-white/75">
              Five minutes from now, your chart of accounts exists and {AI} is reading her first invoice. Your evenings come
              back.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Hire {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/40 px-[26px] py-[7px] text-[15px] font-medium text-white transition hover:bg-white/5"
              >
                Talk to a person <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="mt-7 text-[14px] text-white/55">Month-end is coming either way.</p>
            <p className="mt-12 font-serif text-[15px] italic text-white/45">Sen söyle. {AI} halleder.</p>
          </Container>
        </section>

        <footer className="relative border-t border-white/10">
          <Container className="flex flex-col items-center justify-between gap-4 py-7 sm:flex-row">
            <LandingLogo dark />
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] text-white/65">
              <Link href="/login" className="hover:text-white">
                Sign in
              </Link>
              <Link href="/register" className="hover:text-white">
                Create account
              </Link>
              <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                Partners
              </a>
              <span>© 2026 {AI}. All rights reserved.</span>
            </nav>
          </Container>
        </footer>
      </div>

      <WhatsAppButton />
    </div>
  );
}
