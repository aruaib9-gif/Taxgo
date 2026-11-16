"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CornerDownLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { TLogo } from "./brand";

type Scenario = {
  chip: string;
  ask: string;
  onIt: string;
  lines: { text: string; human?: boolean }[];
  verdict: string;
  foot: string;
};

const scenarios: Scenario[] = [
  {
    chip: "Close the Month",
    ask: "Close the month. I want accurate, reconciled numbers I can trust by Friday.",
    onIt: "500 documents, 10 bank feeds, three ledgers. Let's get your books ready.",
    lines: [
      { text: "Reviewed — 500 invoices, receipts, bills and supporting documents, checking for missing information and duplicates." },
      { text: "Reconciled — 980 bank transactions matched against invoices, payments and ledger balances." },
      { text: "Prepared — 46 journal entries covering accruals, prepayments, depreciation and month-end adjustments." },
      { text: "Verified — Trial balance, accounts receivable, accounts payable and bank balances checked for discrepancies." },
      { text: "Needs your attention — Two unusual transactions flagged for review before final approval.", human: true },
    ],
    verdict: "Ready to close.",
    foot: "Accurate financial statements, reconciled accounts and a complete audit trail — ready for your approval, days ahead of schedule.",
  },
  {
    chip: "Chase My Overdue Invoices",
    ask: "Chase my overdue invoices. Politely, but make sure customers pay.",
    onIt: "17 overdue invoices across nine customers, totalling $300,000.",
    lines: [
      { text: "Prioritized — 17 overdue invoices ranked by age, outstanding balance, payment history and customer risk." },
      { text: "Personalized — 16 professional payment reminders prepared using each customer's name, invoice details and payment history." },
      { text: "Followed up — Automated reminders scheduled for customers who do not respond within the agreed timeframe." },
      { text: "Tracked — Customer responses, payment promises, partial settlements and outstanding balances monitored." },
      { text: "Needs your attention — Meridian disputes one invoice. The issue has been flagged for your review before further action.", human: true },
    ],
    verdict: "Collections underway.",
    foot: "Polite reminders, scheduled follow-ups and real-time visibility into outstanding payments — without damaging customer relationships.",
  },
  {
    chip: "Run Payroll for 12 People",
    ask: "Run payroll for 12 people. Include everything, check every deduction and make sure nobody is missed.",
    onIt: "12 employees, six contract types, one accurate payroll run.",
    lines: [
      { text: "Calculated — 12 salaries, hourly wages, bonuses, allowances, commissions and statutory deductions." },
      { text: "Included — Approved annual leave, sick leave, overtime, expense reimbursements and employee benefits." },
      { text: "Verified — Income tax, pension contributions, employment insurance and applicable statutory deductions based on local payroll regulations." },
      { text: "Prepared — 12 individual payslips, payroll journals, statutory reports and a bank payment file." },
      { text: "Reconciled — Gross salaries, deductions, net payments and payroll liabilities checked against accounting records." },
      { text: "Needs your attention — One overtime claim exceeds the employee's usual hours and requires your approval.", human: true },
    ],
    verdict: "Payroll ready.",
    foot: "12 employees processed, deductions checked and payment instructions prepared. One approval remains before payroll can be finalized and payments authorized.",
  },
  {
    chip: "File My VAT Return",
    ask: "My VAT return is due. Check everything, claim the correct input VAT and make sure the return is accurate.",
    onIt: "430 tax transactions across the quarter. Let's get your return ready.",
    lines: [
      { text: "Reviewed — 430 sales and purchase transactions checked against invoices, receipts and accounting records." },
      { text: "Validated — 125 electronic invoices checked for tax accuracy, supplier information, applicable VAT rates and required documentation." },
      { text: "Calculated — Output VAT on sales, recoverable input VAT on purchases, adjustments and the resulting tax payable or refundable." },
      { text: "Reconciled — VAT control accounts matched against the general ledger, sales records and purchase transactions." },
      { text: "Prepared — VAT return, supporting schedules and digital audit records, applying the relevant local tax requirements." },
      { text: `Needs your attention — One purchase invoice has an inconsistent VAT amount. ${BRAND.fullName} has isolated the discrepancy for your review.`, human: true },
    ],
    verdict: "VAT return ready.",
    foot: "Every transaction checked, eligible input VAT identified and supporting records organized. Review the flagged invoice and authorize submission to the relevant tax authority.",
  },
  {
    chip: "What's My Cash Position?",
    ask: "What's my cash position? Tell me what I have, what I owe and whether I can meet my commitments over the next few months.",
    onIt: "13 bank accounts, 980 transactions and a 17-week cash flow forecast.",
    lines: [
      { text: "Connected — 13 bank accounts reviewed for available balances, outstanding payments and recent cash movements." },
      { text: "Categorized — 980 transactions allocated to the correct accounts, departments, projects and cost centres." },
      { text: "Analyzed — Customer receivables, supplier payments, payroll commitments, tax liabilities and recurring operating expenses." },
      { text: "Forecasted — 17 weeks of expected cash inflows and outflows using historical transactions, outstanding invoices and scheduled obligations." },
      { text: "Identified — Potential cash shortages, overdue customer balances and opportunities to improve working capital." },
      { text: "Needs your attention — A significant supplier payment is scheduled next month and could reduce your available cash below your preferred operating reserve.", human: true },
    ],
    verdict: "Cash flow forecast ready.",
    foot: "Know how much cash you have, what is coming in, what is going out and when you may need to act.",
  },
];

// Timeline (ms). Typing runs per character; "playing" reveals the card step by step.
const IDLE = 1600; // pause before the very first prompt is typed
const PER_CHAR = 22;
const AFTER_TYPING = 350;
const ON_IT_AT = 700;
const FIRST_LINE_AT = 1300;
const LINE_GAP = 700;
const VERDICT_AFTER = 700;
const HOLD = 5500; // how long a finished card stays before moving on (results are a full sentence)
const TICK = 120; // playback clock resolution, keeps re-renders cheap

const doneAt = (s: Scenario) => FIRST_LINE_AT + s.lines.length * LINE_GAP + VERDICT_AFTER;

type Phase = "idle" | "typing" | "playing";
type View = { index: number; phase: Phase; typed: number; t: number };

function useHeroLoop() {
  const [view, setView] = useState<View>({ index: 0, phase: "idle", typed: 0, t: 0 });
  const [reduced, setReduced] = useState(false);
  // Mutable timeline driven by requestAnimationFrame; `manual` stops the auto-advance.
  const run = useRef({ index: 0, phase: "idle" as Phase, start: 0, manual: false, reduced: false });
  const last = useRef(view);

  useEffect(() => {
    const push = (v: View) => {
      const p = last.current;
      if (p.index !== v.index || p.phase !== v.phase || p.typed !== v.typed || p.t !== v.t) {
        last.current = v;
        setView(v);
      }
    };

    let frame = 0;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Reduced motion: skip the timeline and show the first card complete.
      run.current.reduced = true;
      frame = requestAnimationFrame(() => {
        setReduced(true);
        push({ index: 0, phase: "playing", typed: scenarios[0].ask.length, t: Number.MAX_SAFE_INTEGER });
      });
      return () => cancelAnimationFrame(frame);
    }

    run.current.start = performance.now();
    const step = (now: number) => {
      const r = run.current;
      const s = scenarios[r.index];
      const elapsed = now - r.start;

      if (r.phase === "idle") {
        if (elapsed >= IDLE) {
          r.phase = "typing";
          r.start = now;
        }
        push({ index: r.index, phase: r.phase, typed: 0, t: 0 });
      } else if (r.phase === "typing") {
        if (elapsed >= s.ask.length * PER_CHAR + AFTER_TYPING) {
          r.phase = "playing";
          r.start = now;
          push({ index: r.index, phase: "playing", typed: s.ask.length, t: 0 });
        } else {
          push({ index: r.index, phase: "typing", typed: Math.min(Math.floor(elapsed / PER_CHAR), s.ask.length), t: 0 });
        }
      } else if (!r.manual && elapsed >= doneAt(s) + HOLD) {
        r.index = (r.index + 1) % scenarios.length;
        r.phase = "typing";
        r.start = now;
        push({ index: r.index, phase: "typing", typed: 0, t: 0 });
      } else {
        push({ index: r.index, phase: "playing", typed: s.ask.length, t: Math.min(Math.floor(elapsed / TICK) * TICK, doneAt(s) + HOLD) });
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Picking a chip types that prompt and stays on it (no auto-advance afterwards).
  const select = useCallback((index: number) => {
    if (run.current.reduced) {
      run.current = { ...run.current, index, phase: "playing", manual: true };
      last.current = { index, phase: "playing", typed: scenarios[index].ask.length, t: Number.MAX_SAFE_INTEGER };
      setView(last.current);
      return;
    }
    run.current = { ...run.current, index, phase: "typing", start: performance.now(), manual: true };
  }, []);

  const next = useCallback(() => select((run.current.index + 1) % scenarios.length), [select]);

  return { view, reduced, select, next };
}

// Headline ending: starts on "sorted." and cycles through what Tax GO finishes, each word underlined as it lands.
const HEADLINE_WORDS = ["sorted.", "filed.", "reconciled.", "paid.", "closed."];

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((n) => (n + 1) % HEADLINE_WORDS.length), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="relative inline-block whitespace-nowrap">
      <span key={i} className="lp-word-in inline-block">
        {HEADLINE_WORDS[i]}
      </span>
      <svg key={`u${i}`} aria-hidden viewBox="0 0 300 18" preserveAspectRatio="none" className="pointer-events-none absolute -bottom-[0.12em] left-0 h-[0.22em] w-[calc(100%-0.25em)] overflow-visible text-lp-brand/70">
        <path className="lp-underline" d="M3 12 C 60 4, 140 3, 200 7 S 280 14, 297 6" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" pathLength={1} />
      </svg>
    </span>
  );
}

export function HeroDemo({ children }: { children?: React.ReactNode }) {
  const { view, reduced, select, next } = useHeroLoop();
  const s = scenarios[view.index];
  const typedText = s.ask.slice(0, view.typed);
  const shown = (at: number) => reduced || (view.phase === "playing" && view.t >= at);
  const finished = shown(doneAt(s));
  const rise = (on: boolean) => cn("transition-all duration-500 ease-out", on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0");

  return (
    <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_476px] lg:gap-16">
      <div className="min-w-0">
        <p className="inline-flex items-center gap-2.5 rounded-full border border-lp-line bg-lp-card/80 py-1.5 pl-2.5 pr-3.5 text-[10.5px] font-semibold uppercase tracking-[0.22em] text-lp-body shadow-[0_1px_0_rgba(22,35,58,0.04)] backdrop-blur">
          <span aria-hidden className="relative flex h-2 w-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-ai-done/60 motion-reduce:hidden" />
            <span className="relative h-2 w-2 rounded-full bg-ai-done" />
          </span>
          Your trusted AI assistant that runs your business
        </p>
        <h1
          aria-label={`Say ${BRAND.fullName} and it's sorted.`}
          className="mt-7 text-[46px] font-semibold leading-[1.04] tracking-[-0.045em] text-lp-ink sm:text-[66px]"
        >
          <span aria-hidden>
            Say <span className="lp-shimmer bg-[linear-gradient(100deg,#EC8A35_0%,#D9682A_35%,#F2A65A_50%,#D9682A_65%,#B9531B_100%)] bg-clip-text text-transparent">{BRAND.fullName}</span>
          </span>
          <br />
          <span aria-hidden className="font-serif font-semibold italic tracking-[-0.02em] text-lp-brand">
            and it&rsquo;s <RotatingWord />
          </span>
        </h1>

        {/* prompt box — clicking it runs the next example */}
        <button
          type="button"
          onClick={next}
          aria-label={`Show ${BRAND.fullName} handling the next example task`}
          className="mt-8 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-lp-line bg-lp-card px-4 py-3.75 text-left shadow-[0_1px_0_rgba(22,35,58,0.05),0_20px_48px_-32px_rgba(22,35,58,0.4)] transition-shadow hover:shadow-[0_1px_0_rgba(22,35,58,0.05),0_20px_48px_-24px_rgba(22,35,58,0.45)]"
        >
          <TLogo className="h-6 w-6" />
          <span className="min-w-0 flex-1 truncate text-[17px]">
            {typedText ? (
              <span className={cn("text-lp-ink", view.phase === "typing" && !reduced && "lp-caret")}>{typedText}</span>
            ) : (
              <span className={cn("text-lp-muted/80", !reduced && "lp-caret")}>Tell {BRAND.fullName}…</span>
            )}
          </span>
          {view.phase === "playing" && !reduced ? (
            <span className="shrink-0 text-[14px] font-semibold text-lp-brand">On it.</span>
          ) : (
            <CornerDownLeft aria-hidden className="h-4 w-4 shrink-0 text-lp-muted/70" />
          )}
        </button>

        {/* chips */}
        <div className="mt-3 flex max-w-xl flex-wrap gap-2">
          {scenarios.map((sc, i) => (
            <button
              key={sc.chip}
              type="button"
              onClick={() => select(i)}
              aria-pressed={i === view.index}
              style={{ animationDelay: `${i * 70}ms` }}
              className={cn(
                "animate-lp-rise rounded-full border px-3 py-1.25 text-[13px] font-medium transition-colors",
                i === view.index
                  ? "border-lp-brand/50 bg-lp-chip text-lp-brand"
                  : "border-lp-line bg-lp-card text-lp-body hover:border-lp-muted/40 hover:text-lp-ink",
              )}
            >
              {sc.chip}
            </button>
          ))}
        </div>

        {children}
      </div>

      {/* result card */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-lp-line bg-lp-card shadow-[0_24px_60px_-20px_rgba(15,36,56,0.18)]">
        <div className="flex items-center justify-between border-b border-lp-line px-4 py-3">
          <span className="flex items-center gap-2.5 text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">
            <TLogo className="h-5 w-5" /> {BRAND.fullName}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-lp-muted">
            <span className={cn("h-1.5 w-1.5 rounded-full bg-lp-brand", !finished && "animate-pulse")} />
            {finished ? "done" : view.phase === "playing" ? <span className="lp-thinking">turning</span> : "listening"}
          </span>
        </div>

        <div aria-live="polite" className="min-h-120 px-4 pb-5 pt-4">
          <div
            className={cn(
              "flex justify-end transition-all duration-500 ease-out",
              shown(0) ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0",
            )}
          >
            <p className="max-w-[90%] rounded-2xl rounded-br-sm bg-lp-navy px-3.5 py-2 text-[13px] text-white">{s.ask}</p>
          </div>

          <p className={cn("mt-4 text-[13px] text-lp-muted", rise(shown(ON_IT_AT)))}>
            <b className="font-semibold text-lp-ink">On it.</b>&nbsp; {s.onIt}
          </p>

          <ul className="mt-3 space-y-2.5 border-l border-lp-line pl-3.5 text-[12.5px] leading-snug text-lp-body">
            {s.lines.map((line, i) => {
              const [label, ...rest] = line.text.split(" — ");
              return (
                <li key={`${view.index}-${i}`} className={cn("flex items-start gap-2.5", rise(shown(FIRST_LINE_AT + i * LINE_GAP)))}>
                  {line.human ? (
                    <span className="mx-0.5 mt-1.25 h-1.75 w-1.75 shrink-0 rounded-full bg-needs-human" />
                  ) : (
                    <Check className="mt-0.5 h-3 w-3 shrink-0 text-lp-brand" strokeWidth={2.5} />
                  )}
                  <span>
                    <b className={cn("font-semibold", line.human ? "text-needs-human" : "text-lp-ink")}>{label}</b>
                    {rest.length > 0 && <> — {rest.join(" — ")}</>}
                  </span>
                </li>
              );
            })}
          </ul>

          <div className={cn("mt-4 border-t border-lp-line pt-4", rise(finished))}>
            <span
              key={`${view.index}-${finished}`}
              className={cn("block font-serif text-[24px] font-semibold italic leading-none text-lp-brand", finished && !reduced && "lp-write")}
            >
              {s.verdict}
            </span>
            <p className="mt-2 text-[12px] leading-normal text-lp-muted">{s.foot}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
