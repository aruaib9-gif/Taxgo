import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Bot,
  Brain,
  Calculator,
  Check,
  CheckCheck,
  MessageCircle,
  Plug,
  Quote,
  ScrollText,
  ShieldCheck,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
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
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { BackToTop } from "@/components/landing/back-to-top";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: `The humans behind ${BRAND.fullName}`, // the root layout appends "· Tax GO"
  description: `AI does the work; human experts deliver the confidence. Qualified accountants, CFOs, tax, payroll, audit and migration specialists, on demand alongside ${BRAND.fullName}.`,
};

type Expert = {
  icon: LucideIcon;
  title: string;
  tagline: string;
  intro?: string;
  gets?: string[];
  regions?: { flag: string; label: string; text: string }[];
  example: { ask: string; does: string };
  benefit: string;
  note?: string;
};

const experts: Expert[] = [
  {
    icon: Calculator,
    title: "On-demand professional accountant",
    tagline: "Your personal accounting expert, whenever you need one.",
    intro: `Your accountant works directly with your ${AI} records, helping you keep accurate financial information and understand your business performance.`,
    gets: [
      "Review and correction of accounting entries",
      "Bank and balance sheet reconciliations",
      "Monthly and annual financial statements",
      "Accounts payable and receivable reviews",
      "Month-end and year-end closing assistance",
      "Answers to accounting questions specific to your business",
    ],
    example: {
      ask: "My business accounts don't reconcile, and I need my monthly financial statements completed.",
      does: "Your human accountant reviews the transactions, investigates discrepancies, corrects approved errors and prepares your financial statements.",
    },
    benefit: "Professional accounting support without maintaining a full-time accounting department.",
  },
  {
    icon: Brain,
    title: "Virtual & fractional CFO",
    tagline: "Strategic financial leadership without the cost of a full-time CFO.",
    intro:
      "Your human CFO goes beyond bookkeeping to help you understand your financial position, manage risk and make better business decisions.",
    gets: [
      "Financial strategy and business planning",
      "Budget preparation and variance analysis",
      "Cash-flow management and forecasting",
      "Profitability and cost-efficiency reviews",
      "Financial models for expansion and investment",
      "Investor presentations and fundraising support",
      "Management and board reporting",
    ],
    example: {
      ask: "I'm planning to expand my business into another country. Can I afford the investment?",
      does: "Your CFO reviews your financial performance, prepares projections, evaluates funding requirements, identifies financial risks and recommends an appropriate strategy.",
    },
    benefit: "Experienced financial leadership when your business needs it.",
  },
  {
    icon: ScrollText,
    title: "Tax & compliance specialist",
    tagline: "Local tax expertise for businesses operating nationally or internationally.",
    intro: `${AI} organises and calculates your tax information, while qualified professionals review your obligations, prepare filings and advise on compliance.`,
    regions: [
      {
        flag: "🇺🇸",
        label: "United States — Sales Tax",
        text: "State and local sales tax obligations, taxable sales reviews, filing requirements and returns.",
      },
      {
        flag: "🇨🇦",
        label: "Canada — GST/HST",
        text: "GST/HST registration, input tax credits, return preparation, reconciliations and CRA enquiries.",
      },
      {
        flag: "🇪🇺",
        label: "European Union — VAT",
        text: "VAT calculations, domestic and cross-border transactions, VAT returns and electronic invoicing requirements.",
      },
    ],
    example: {
      ask: "I sell products in Canada and the United States. What sales taxes should I collect, and where must I register?",
      does: "Your tax specialist reviews your business activities, assesses the relevant tax obligations and explains the registration, reporting and filing requirements.",
    },
    benefit: "Professional guidance to reduce compliance risk and avoid costly mistakes.",
  },
  {
    icon: Banknote,
    title: "Human payroll specialist",
    tagline: "Payroll processed and reviewed by a professional who knows local employment rules.",
    gets: [
      "Payroll calculations and verification",
      "Employee payslips and payroll summaries",
      "Statutory deductions and remittance support",
      "Payroll tax and year-end reporting",
      "Employee benefits and payroll adjustments",
      "Assistance with payroll-related enquiries",
    ],
    example: {
      ask: "I have 15 employees, including two new starters. Please review this month's payroll before payment.",
      does: "Your payroll specialist checks salary calculations, deductions, employee changes and statutory obligations before preparing the payroll for approval.",
    },
    benefit: "Less payroll administration, and greater confidence in every salary calculation.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & assurance support",
    tagline: "Help when auditors, regulators, lenders or investors ask for your financial records.",
    gets: [
      "Audit preparation and supporting schedules",
      "Financial statement reconciliations",
      "Assistance responding to auditor enquiries",
      "Review of accounting documentation",
      "Internal control recommendations",
      "Coordination with independent external auditors",
    ],
    example: {
      ask: "Our annual audit starts next month, and the auditors need supporting schedules and reconciliations.",
      does: `Your human accountant reviews the records prepared through ${AI}, identifies missing documentation, prepares schedules and assists with audit enquiries.`,
    },
    benefit: "Better organised financial records and a more efficient audit.",
    note: "Independent audit opinions and assurance reports, where required, must be issued by appropriately authorised independent professionals.",
  },
  {
    icon: Plug,
    title: "Setup, migration & training specialist",
    tagline: `Move to ${AI} with professional help from the beginning.`,
    gets: [
      "Migration from QuickBooks, Sage, Tally, Zoho or spreadsheets",
      "Chart of accounts setup and review",
      "Opening balance verification",
      "Customer, supplier and inventory data migration",
      "Country-specific accounting and tax configuration",
      "Staff training and implementation support",
    ],
    example: {
      ask: `We have used QuickBooks for five years and want to move everything to ${AI}.`,
      does: "Your migration specialist transfers your accounting records, verifies opening balances, reviews outstanding invoices and guides your team through the new system.",
    },
    benefit: "A smoother transition, with less disruption to your business.",
  },
];

/** The hand-off, step by step. */
const together: { icon: LucideIcon; title: string; text: string; quote?: string }[] = [
  {
    icon: MessageCircle,
    title: `Ask ${AI}`,
    text: "Describe your problem or request in everyday language.",
    quote: "I need help preparing my year-end accounts and tax returns.",
  },
  {
    icon: Bot,
    title: `${AI} prepares the work`,
    text: "She organises your available financial records, identifies outstanding items and prepares the information for professional review.",
  },
  {
    icon: UserRoundCheck,
    title: "A human expert steps in",
    text: "A qualified professional reviews the information, applies professional judgement, resolves complex issues and provides recommendations or completed services.",
  },
  {
    icon: CheckCheck,
    title: "You review and approve",
    text: "You receive the completed work, the explanations and the recommendations through the agreed service process — and you keep control of every important financial decision.",
  },
];

export default function HumansPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-[var(--lp-map)] lg:block" />
        <Container className="relative pb-16 pt-16">
          <div className="relative z-10 text-center">
            <Kicker>The humans behind {AI}</Kicker>
            <H2>
              AI does the work. <Serif className="text-[32px] sm:text-[40px]">Human experts give you the confidence.</Serif>
            </H2>
            <p className="mx-auto mt-4 max-w-170 text-[16px] leading-[1.6] text-lp-body">
              {AI} combines the efficiency of artificial intelligence with the knowledge, experience and professional
              judgement of qualified accountants, tax specialists, payroll professionals and CFOs. While she automates your
              daily operations, our human professionals are there when you need expert advice, financial guidance,
              regulatory support or help with a complex decision.
            </p>
            <p className="mx-auto mt-4 max-w-170 text-[16px] font-semibold leading-[1.6] text-lp-ink">
              You don&rsquo;t need to employ a full-time finance team to get professional financial expertise.
            </p>
          </div>
        </Container>
      </section>

      {/* the six specialists */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-16">
          <div className="text-center">
            <Kicker>What you get</Kicker>
            <H2>Your human assistant, on demand.</H2>
          </div>

          <div className="mt-11 grid gap-5 lg:grid-cols-2">
            {experts.map((e) => (
              <Panel key={e.title} className="flex flex-col px-6 pb-6 pt-6">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-lp-brand/10 text-lp-brand">
                  <e.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-[18px] font-semibold tracking-[-0.035em] text-lp-ink">{e.title}</h3>
                <p className="mt-1.5 text-[14.5px] font-medium leading-[1.55] text-lp-ink">{e.tagline}</p>
                {e.intro && <p className="mt-2 text-[14px] leading-[1.65] text-lp-muted">{e.intro}</p>}

                {e.gets && (
                  <>
                    <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lp-muted">What you get</p>
                    <ul className="mt-2.5 space-y-1.75">
                      {e.gets.map((g) => (
                        <li key={g} className="flex items-start gap-2.5 text-[14px] leading-[1.5] text-lp-body">
                          <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-brand" strokeWidth={2.25} />
                          {g}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {e.regions && (
                  <ul className="mt-5 space-y-2.5">
                    {e.regions.map((r) => (
                      <li key={r.label} className="rounded-xl border border-lp-line bg-lp-canvas px-4 py-3">
                        <p className="flex items-center gap-2 text-[14px] font-semibold text-lp-ink">
                          <span aria-hidden className="text-[15px] leading-none">
                            {r.flag}
                          </span>
                          {r.label}
                        </p>
                        <p className="mt-1 text-[13.5px] leading-[1.55] text-lp-muted">{r.text}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {/* example and benefit sit at the foot of the card, so a row of cards lines up */}
                <div className="mt-auto pt-5">
                <div className="rounded-xl bg-lp-brand/6 px-4.5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-lp-brand">Example</p>
                  <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.5] text-lp-ink">
                    <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                    <span>&ldquo;{e.example.ask}&rdquo;</span>
                  </p>
                  <p className="mt-2.5 pl-6 text-[13.5px] leading-[1.6] text-lp-muted">{e.example.does}</p>
                </div>

                <p className="mt-4 text-[14px] leading-[1.55] text-lp-ink">
                  <b className="font-semibold">The benefit:</b> {e.benefit}
                </p>
                {e.note && <p className="mt-3 text-[12.5px] leading-[1.55] text-lp-muted">{e.note}</p>}
                </div>
              </Panel>
            ))}
          </div>
        </Container>
      </section>

      {/* the hand-off */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-20">
          <div className="text-center">
            <Kicker>How it fits together</Kicker>
            <H2>AI and human experts, in four steps.</H2>
          </div>
          <Panel className="mx-auto mt-10 max-w-4xl divide-y divide-lp-line">
            {together.map((t, i) => (
              <div key={t.title} className="flex items-start gap-4 px-6 py-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lp-brand/10 text-lp-brand">
                  <t.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[16px] font-semibold tracking-[-0.03em] text-lp-ink">
                    <span className="text-lp-muted">Step {i + 1} — </span>
                    {t.title}
                  </h3>
                  <p className="mt-1.5 text-[14px] leading-[1.65] text-lp-body">{t.text}</p>
                  {t.quote && (
                    <p className="mt-2 font-serif text-[14.5px] italic text-lp-muted">&ldquo;{t.quote}&rdquo;</p>
                  )}
                </div>
              </div>
            ))}
          </Panel>
        </Container>
      </section>

      {/* the argument + CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <h2 className="mx-auto mt-10 max-w-3xl text-[30px] font-semibold leading-[1.15] tracking-[-0.045em] sm:text-[38px]">
              Why pay for a full-time team
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">
                when you can call on expertise on demand?
              </span>
            </h2>
            <p className="mx-auto mt-7 max-w-2xl font-serif text-[20px] italic leading-[1.4] text-lp-sky sm:text-[23px]">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mx-auto mt-5 max-w-170 text-[15px] leading-[1.65] text-white/70">
              Instead of paying for unnecessary administration, your business combines AI automation with professional
              expertise whenever it is needed.
            </p>
            <p className="mt-7 text-[15px] font-semibold text-white">
              {AI} — AI efficiency. Human expertise. One intelligent business platform.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Get started with {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/pricing" className={cn(btnOutline, "border-white/40 bg-transparent text-white hover:bg-white/5")}>
                See pricing in your country <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="mx-auto mt-10 max-w-3xl text-[12.5px] leading-[1.6] text-white/45">
              Professional services are subject to availability, scope, applicable fees and the licensing requirements of
              each jurisdiction. Human experts require appropriate access to your records, with your authorisation.
            </p>
          </Container>
        </section>
        <LandingFooter />
      </div>

      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}
