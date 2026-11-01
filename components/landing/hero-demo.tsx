"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, CornerDownLeft } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { TGMark } from "./brand";

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
    chip: "Close the month",
    ask: "Close the month. I want numbers I can trust by Friday.",
    onIt: "142 documents, 6 bank feeds, one ledger.",
    lines: [
      { text: "Read — 142 invoices, receipts and bills" },
      { text: "Reconciled — 138 bank lines matched automatically" },
      { text: "Drafted — 12 journal entries, balanced to the cent" },
      { text: "Two entries look unusual — they wait for you", human: true },
    ],
    verdict: "Closed.",
    foot: "books you can defend, days early",
  },
  {
    chip: "Chase my overdue invoices",
    ask: "Chase my overdue invoices. Politely, but chase them.",
    onIt: "9 overdue across 7 customers · AED 64,300.",
    lines: [
      { text: "Sorted — 9 invoices by age, amount and history" },
      { text: "Sent — 7 reminders, each one personal and polite" },
      { text: "Scheduled — follow-ups for whoever goes quiet" },
      { text: "Meridian disputes one invoice — that one needs you", human: true },
    ],
    verdict: "Chased.",
    foot: "reminders out; replies already arriving",
  },
  {
    chip: "Run payroll for 12 people",
    ask: "Run payroll for 12 people. Everything in, nothing missed.",
    onIt: "12 staff, 3 contract types, one pay run.",
    lines: [
      { text: "Calculated — 12 salaries, allowances and deductions" },
      { text: "Folded in — leave, overtime and approved claims" },
      { text: "Drafted — payslips and the bank transfer file" },
      { text: "One overtime claim looks high — it waits for you", human: true },
    ],
    verdict: "Ready.",
    foot: "one approval and it pays",
  },
  {
    chip: "File my VAT return",
    ask: "The VAT return is due. Make sure it's right this time.",
    onIt: "312 tax lines across the quarter.",
    lines: [
      { text: "Checked — 312 VAT lines against source documents" },
      { text: "Validated — 56 e-invoices · ZATCA & Peppol clean" },
      { text: "Prepared — one return, fully reconciled" },
      { text: "One mismatch found and isolated — your call", human: true },
    ],
    verdict: "Filed.",
    foot: "you click submit; she did the rest",
  },
  {
    chip: "What's my cash position?",
    ask: "What's my cash position? Tell me honestly.",
    onIt: "6 accounts, 240 transactions, 13 weeks ahead.",
    lines: [
      { text: "Read — 6 bank accounts, live balances" },
      { text: "Categorized — 240 transactions to the right centres" },
      { text: "Forecast — 13 weeks of runway from real data" },
      { text: "One large outflow next month — worth a look", human: true },
    ],
    verdict: "Forecast.",
    foot: "you sleep on facts, not hope",
  },
];

// Timeline (ms). Typing runs per character; "playing" reveals the card step by step.
const IDLE = 1600; // pause before the very first prompt is typed
const PER_CHAR = 32;
const AFTER_TYPING = 350;
const ON_IT_AT = 700;
const FIRST_LINE_AT = 1300;
const LINE_GAP = 620;
const VERDICT_AFTER = 700;
const HOLD = 3000; // how long a finished card stays before moving on
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-body">
          The AI that runs your business · Human in the loop
        </p>
        <h1 className="mt-6 text-[44px] font-semibold leading-[1.08] tracking-[-0.045em] text-lp-ink sm:text-[62px]">
          Tell
          <br />
          {BRAND.fullName}.
          <br />
          <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-blue">It&rsquo;s handled.</span>
        </h1>

        {/* prompt box — clicking it runs the next example */}
        <button
          type="button"
          onClick={next}
          aria-label={`Show ${BRAND.fullName} handling the next example task`}
          className="mt-7 flex w-full max-w-xl items-center gap-3 rounded-2xl border border-lp-line bg-lp-card px-4 py-3.75 text-left shadow-[0_1px_0_rgba(22,35,58,0.05),0_20px_48px_-32px_rgba(22,35,58,0.4)] transition-shadow hover:shadow-[0_1px_0_rgba(22,35,58,0.05),0_20px_48px_-24px_rgba(22,35,58,0.45)]"
        >
          <TGMark className="shrink-0 text-[10px] text-lp-ink" />
          <span className="min-w-0 flex-1 truncate text-[17px]">
            {typedText ? (
              <span className={cn("text-lp-navy", view.phase === "typing" && !reduced && "lp-caret")}>{typedText}</span>
            ) : (
              <span className={cn("text-lp-muted/80", !reduced && "lp-caret")}>Tell {BRAND.fullName}…</span>
            )}
          </span>
          {view.phase === "playing" && !reduced ? (
            <span className="shrink-0 text-[14px] font-semibold text-lp-blue">On it.</span>
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
                  ? "border-lp-blue/50 bg-lp-chip text-lp-blue"
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
            <TGMark className="text-[9px]" /> {BRAND.fullName}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-lp-muted">
            <span className={cn("h-1.5 w-1.5 rounded-full bg-lp-blue", !finished && "animate-pulse")} />
            {finished ? "done" : view.phase === "playing" ? <span className="lp-thinking">turning</span> : "listening"}
          </span>
        </div>

        <div aria-live="polite" className="min-h-[19rem] px-4 pb-5 pt-4">
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

          <ul className="mt-3 space-y-2.25 border-l border-lp-line pl-3.5 text-[13px] text-lp-body">
            {s.lines.map((line, i) => (
              <li key={`${view.index}-${i}`} className={cn("flex items-center gap-2.5", rise(shown(FIRST_LINE_AT + i * LINE_GAP)))}>
                {line.human ? (
                  <span className="mx-0.5 h-1.75 w-1.75 shrink-0 rounded-full bg-lp-amber" />
                ) : (
                  <Check className="h-3 w-3 shrink-0 text-lp-blue" strokeWidth={2.5} />
                )}
                {line.text}
              </li>
            ))}
          </ul>

          <div className={cn("mt-4 flex items-end justify-between gap-4 border-t border-lp-line pt-4", rise(finished))}>
            <span
              key={`${view.index}-${finished}`}
              className={cn("font-serif text-[26px] font-semibold italic leading-none text-lp-blue", finished && !reduced && "lp-write")}
            >
              {s.verdict}
            </span>
            <span className="text-right text-[11px] text-lp-muted">{s.foot}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
