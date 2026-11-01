"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { TGMark } from "@/components/landing/brand";

const DEFAULT_LINES = [
  "Reconciled — 38 bank lines matched",
  "Drafted — VAT return ready for review",
  "Flagged — one duplicate bill waits for you",
];

// Loop timing (ms): each line types out, pauses, then the next; the finished list holds before restarting.
const PER_CHAR = 35;
const LINE_PAUSE = 1500;
const SETTLE = 200;
const HOLD = 3000;
const RESTART = 250;

type Progress = { line: number; chars: number; done: boolean };

export function WorkingPanel({
  kicker,
  lines = DEFAULT_LINES,
  footer = "You approve. She does the rest.",
}: {
  kicker: string;
  lines?: string[];
  footer?: string;
}) {
  const [p, setP] = useState<Progress>({ line: 0, chars: 0, done: false });

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      timer = setTimeout(() => setP({ line: lines.length, chars: 0, done: true }), 0);
      return () => clearTimeout(timer);
    }

    const type = (line: number, chars: number) => {
      setP({ line, chars, done: false });
      if (chars < lines[line].length) {
        timer = setTimeout(() => type(line, chars + 1), PER_CHAR);
      } else if (line < lines.length - 1) {
        timer = setTimeout(() => type(line + 1, 0), LINE_PAUSE);
      } else {
        timer = setTimeout(() => {
          setP({ line: lines.length, chars: 0, done: true });
          timer = setTimeout(() => {
            setP({ line: 0, chars: 0, done: false });
            timer = setTimeout(() => type(0, 1), RESTART);
          }, HOLD);
        }, SETTLE);
      }
    };
    timer = setTimeout(() => type(0, 1), PER_CHAR);
    return () => clearTimeout(timer);
  }, [lines]);

  return (
    <div className="w-[20rem] max-w-full">
      <p className="mb-4 text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{kicker}</p>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground">
            <TGMark className="text-[10px]" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-tight text-foreground">{BRAND.fullName}</p>
            {p.done ? (
              <p className="text-xs text-muted-foreground">All caught up</p>
            ) : (
              <p className="lp-thinking text-xs">{BRAND.fullName} is working…</p>
            )}
          </div>
        </div>

        <ul className="mt-5 space-y-3.5">
          {lines.map((text, i) => {
            const typing = !p.done && i === p.line;
            const visible = p.done || i < p.line ? text : typing ? text.slice(0, p.chars) : "";
            const checked = p.done || i < p.line || (typing && p.chars >= text.length);
            return (
              <li key={text} className="flex min-h-[1.75rem] items-start gap-2.5">
                <span
                  className={cn(
                    "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors duration-300",
                    checked ? "border-transparent bg-primary/10 text-primary" : "border-border text-transparent",
                  )}
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className={cn("text-sm leading-relaxed text-foreground", typing && !checked && "lp-caret")}>{visible}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="mt-4 text-center text-xs text-muted-foreground/70">{footer}</p>
    </div>
  );
}
