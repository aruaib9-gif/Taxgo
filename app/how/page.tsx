import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CornerDownRight,
  Lightbulb,
  MessagesSquare,
  Quote,
  Sparkles,
  Target,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { DecidesMark, ReadsMark, ResultTick, WorksMark, type Mark } from "@/components/landing/how-icons";
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
  title: `How ${BRAND.fullName} works`, // the root layout appends "· Tax GO"
  description: `You ask. She understands. She analyses. She delivers. How to talk to ${BRAND.fullName} — and how the quality of your question shapes the quality of her answer.`,
};

/** What she does with a day's business activity, in three moves. */
const steps: { icon: Mark; title: string; text: string }[] = [
  {
    icon: ReadsMark,
    title: "She reads everything",
    text: "Invoices, receipts, bank feeds, emails, stock counts and sales — all your business data in one place.",
  },
  {
    icon: WorksMark,
    title: "She does the work",
    text: "Posts entries, reconciles bank and receivables, runs payroll, reorders stock and keeps a true double-entry ledger.",
  },
  {
    icon: DecidesMark,
    title: "She brings you the decisions",
    text: "Flags unusual items, cash risks and key opportunities — so you can make the right call, faster.",
  },
];

const results = [
  "Accurate, up-to-date books",
  "Less manual work, fewer errors",
  "Clear cash flow and early warnings",
  "Tax and regulatory compliance",
  "Faster month-end and reporting",
  "More time to focus on growth",
];

type Prompt = { q: string; result?: string };

type Ask = {
  icon: LucideIcon;
  title: string;
  intro: string;
  pair?: { basic: Prompt; better: Prompt };
  example?: Prompt;
  chain?: string[];
  note?: string;
};

/** The five habits that get a better answer out of her. */
const asks: Ask[] = [
  {
    icon: MessagesSquare,
    title: "Ask the right questions",
    intro: `You don't need accounting knowledge or technical language. Simply speak to ${AI} in everyday English.`,
    pair: {
      basic: {
        q: "How is my business doing?",
        result: "A general overview of your sales, expenses and profitability.",
      },
      better: {
        q: "Compare my sales, operating expenses and net profit for the last three months. Identify areas where costs have increased and recommend ways to improve profitability.",
        result: "A detailed financial analysis that identifies trends and highlights opportunities to improve.",
      },
    },
    note: "The more detail you provide, the deeper the analysis.",
  },
  {
    icon: Target,
    title: `Give ${AI} context`,
    intro: `${AI} understands your connected business records, but a little context helps her understand what you are trying to achieve.`,
    pair: {
      basic: { q: "Can I afford to hire another employee?" },
      better: {
        q: "Based on my current cash balance, average monthly revenue, operating expenses and outstanding receivables, can my business afford to hire two additional employees at $4,000 each per month over the next six months?",
        result: "She evaluates the financial impact, forecasts cash flow and identifies potential risks before you decide.",
      },
    },
  },
  {
    icon: Wand2,
    title: "Ask her to perform tasks",
    intro: `${AI} doesn't just provide information. She can carry out business processes through supported automation workflows.`,
    example: {
      q: "Review all unpaid customer invoices older than 30 days, identify the five largest outstanding balances, prepare polite payment reminders, and show me the messages for approval before sending.",
      result: "She identifies the overdue accounts, organises the information and prepares the follow-up actions.",
    },
    note: "You remain in control of the important decisions and approvals.",
  },
  {
    icon: Brain,
    title: "Use her as your Virtual CFO",
    intro:
      "Instead of waiting until month-end to understand performance, ask her to analyse your financial position whenever you need insight.",
    example: {
      q: "Act as my Virtual CFO. Review the last six months of financial performance, compare actual results against budget, identify unnecessary expenditure, forecast cash flow for the next 90 days, and recommend three practical ways to improve profitability.",
      result:
        "She turns your financial data into actionable business intelligence, subject to the completeness and accuracy of your records.",
    },
  },
  {
    icon: CornerDownRight,
    title: "Ask follow-up questions",
    intro: `Your conversation with ${AI} doesn't have to end with the first answer. Keep going:`,
    chain: [
      "Why did our expenses increase?",
      "Which department contributed most to the increase?",
      "What happens if we reduce those expenses by 15%?",
      "How would that affect our cash flow over the next six months?",
      "Prepare a management report showing your findings.",
    ],
    note: "Each follow-up helps her refine the analysis and focus on the decisions that matter most.",
  },
];

/** What to tell her, so she has everything she needs. */
const tellHer: [string, string][] = [
  ["What you want to know", "Sales, expenses, profitability, cash flow or business performance."],
  ["The period to analyse", "This month, last quarter or the previous financial year."],
  ["The level of detail", "A summary, a comparison, a forecast or a full analysis."],
  ["What you want her to do", "Explain, investigate, recommend, prepare — or execute an approved task."],
];

export default function HowPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading + the principle */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-(--lp-map) lg:block" />
        <Container className="relative pb-20 pt-16">
          <div className="relative z-10 text-center">
            <Kicker>How she works</Kicker>
            <H2>
              You ask. She understands. She analyses.{" "}
              <Serif className="text-[32px] sm:text-[40px]">She delivers.</Serif>
            </H2>
            <p className="mx-auto mt-4 max-w-170 text-[16px] leading-[1.6] text-lp-body">
              {AI} is more than accounting software. She is your intelligent AI business assistant — built to understand your
              business, analyse your financial information, automate routine work and help you make better decisions.
            </p>
          </div>

          {/* the three moves */}
          <Panel className="relative z-10 mt-12 grid divide-y divide-lp-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {steps.map((s) => (
              <div key={s.title} className="px-5.75 pb-8 pt-7">
                <s.icon className="h-11 w-11" />
                <h3 className="mt-7 text-[17px] font-semibold tracking-[-0.035em] text-lp-ink">{s.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.65] text-lp-body">{s.text}</p>
              </div>
            ))}
          </Panel>
          <ul className="relative z-10 mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2.5 text-[14px] text-lp-body">
            {results.map((r) => (
              <li key={r} className="flex items-center gap-1.5">
                <ResultTick className="h-4 w-4" /> {r}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* the principle */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16 text-center">
          <Kicker>One important principle</Kicker>
          <p className="mx-auto mt-5 max-w-3xl text-[22px] leading-[1.4] text-lp-ink sm:text-[26px]">
            The quality of your answer depends on{" "}
            <Serif className="text-[23px] sm:text-[27px]">the quality of your question.</Serif>
          </p>
          <p className="mx-auto mt-5 max-w-170 text-[15px] leading-[1.65] text-lp-body">
            Just like speaking to a professional accountant or CFO, the more specific and detailed your question, the more
            relevant, accurate and useful her response can be. {AI} uses the information in your business system, together with
            the instructions you give her, to deliver meaningful insight.
          </p>
        </Container>
      </section>

      {/* the five habits */}
      <section>
        <Container className="pb-20 pt-20">
          <div className="text-center">
            <Kicker>How to talk to her</Kicker>
            <H2>Five ways to get a better answer.</H2>
          </div>

          <div className="mt-12 space-y-10">
            {asks.map((a) => (
              <div key={a.title}>
                <div className="flex items-start gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-lp-brand/10 text-lp-brand">
                    <a.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[19px] font-semibold tracking-[-0.035em] text-lp-ink">{a.title}</h3>
                    <p className="mt-1.5 max-w-200 text-[15px] leading-[1.6] text-lp-body">{a.intro}</p>
                  </div>
                </div>

                <div className="mt-5 sm:pl-12.5">
                  {a.pair && (
                    <Panel className="grid divide-y divide-lp-line md:grid-cols-2 md:divide-x md:divide-y-0">
                      <PromptBlock label="Basic question" prompt={a.pair.basic} />
                      <PromptBlock label="Better question" prompt={a.pair.better} better />
                    </Panel>
                  )}
                  {a.example && (
                    <Panel>
                      <PromptBlock label="Example" prompt={a.example} better />
                    </Panel>
                  )}
                  {a.chain && (
                    <Panel className="px-5.5 py-5">
                      <ul className="space-y-2.5">
                        {a.chain.map((q) => (
                          <li key={q} className="flex items-start gap-2.5">
                            <CornerDownRight className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-brand" strokeWidth={2} />
                            <span className="text-[15px] leading-[1.5] text-lp-ink">&ldquo;{q}&rdquo;</span>
                          </li>
                        ))}
                      </ul>
                    </Panel>
                  )}
                  {a.note && (
                    <p className="mt-3 flex items-start gap-2 text-[14px] font-medium leading-[1.55] text-lp-ink">
                      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lp-brand" strokeWidth={2} />
                      {a.note}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* the formula */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-20">
          <div className="text-center">
            <Kicker>The {AI} formula</Kicker>
            <H2>Better answers, by design.</H2>
            <p className="mx-auto mt-7 max-w-3xl text-[17px] font-semibold leading-[1.5] tracking-[-0.02em] text-lp-ink sm:text-[20px]">
              Clear question <span className="text-lp-muted">+</span> relevant details{" "}
              <span className="text-lp-muted">+</span> accurate business data{" "}
              <span className="text-lp-brand">= more useful AI insight</span>
            </p>
          </div>
          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {tellHer.map(([title, text]) => (
              <div key={title} className="border-t border-lp-line pt-4">
                <h3 className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</h3>
                <p className="mt-1.5 text-[14px] leading-[1.6] text-lp-muted">{text}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-10 flex max-w-200 items-start gap-2.5 text-[14px] leading-[1.65] text-lp-body">
            <Sparkles className="mt-0.75 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2} />
            {AI} asks clarifying questions when information is missing — and important financial conclusions should always be
            checked against your underlying records.
          </p>
        </Container>
      </section>

      {/* philosophy + CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <p className="mt-9 text-[11px] font-semibold uppercase tracking-[0.28em] text-white/55">
              Our philosophy — the cost vs. efficiency theory
            </p>
            <p className="mx-auto mt-5 max-w-2xl font-serif text-[22px] italic leading-[1.4] text-lp-sky sm:text-[26px]">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mx-auto mt-5 max-w-170 text-[15px] leading-[1.65] text-white/70">
              {AI} is built to help you achieve more with the resources you already have, by combining intelligent automation,
              financial insight and human judgement.
            </p>
            <h2 className="mt-10 text-[30px] font-semibold leading-[1.15] tracking-[-0.045em] sm:text-[38px]">
              The better you ask,
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">the smarter she helps.</span>
            </h2>
            <p className="mt-5 text-[15px] font-medium text-white/80">
              You ask. She analyses. You decide. She executes.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Start talking to {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/handles" className={cn(btnOutline, "border-white/40 bg-transparent text-white hover:bg-white/5")}>
                See what she handles <ArrowRight className="h-3.5 w-3.5" />
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

/** One prompt, with what she can do with it. `better` tints the stronger of a pair. */
function PromptBlock({ label, prompt, better }: { label: string; prompt: Prompt; better?: boolean }) {
  return (
    <div className={cn("px-5.5 py-5", better && "bg-lp-brand/6")}>
      <p
        className={cn(
          "mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]",
          better ? "text-lp-brand" : "text-lp-muted",
        )}
      >
        {label}
      </p>
      <p className="flex gap-2.5 text-[15px] leading-[1.55] text-lp-ink">
        <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
        <span>&ldquo;{prompt.q}&rdquo;</span>
      </p>
      {prompt.result && <p className="mt-3 pl-6 text-[14px] leading-[1.6] text-lp-muted">{prompt.result}</p>}
    </div>
  );
}
