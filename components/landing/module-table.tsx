"use client";

// The module table on the "What Tax GO handles" page: one row per module group —
// what she handles, and a real-world example. A row opens the full module window.

import { useCallback, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { MODULES } from "@/lib/modules";
import { ModuleChip } from "@/components/landing/module-chip";
import { ModuleDialog } from "@/components/landing/module-detail";

const AI = BRAND.fullName;

export function ModuleTable() {
  const [open, setOpen] = useState<number | null>(null);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const lastOpened = useRef(0);

  const show = useCallback((i: number) => {
    lastOpened.current = i;
    setOpen(i);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    rows.current[lastOpened.current]?.focus();
  }, []);

  return (
    <div>
      {/* column headings — the table's own header row on wide screens */}
      <div className="hidden items-center gap-4 border-b border-lp-line px-5 pb-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lp-muted lg:grid lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,1.15fr)_1.25rem]">
        <span>Module</span>
        <span>What {AI} handles</span>
        <span>Real-world example</span>
        <span className="sr-only">Open</span>
      </div>

      <ul className="overflow-hidden rounded-2xl border border-lp-line bg-lp-card lg:rounded-t-none lg:border-t-0">
        {MODULES.map((m, i) => (
          <li key={m.title} className="border-b border-lp-line last:border-b-0">
            <button
              ref={(el) => {
                rows.current[i] = el;
              }}
              type="button"
              onClick={() => show(i)}
              aria-haspopup="dialog"
              className="group grid w-full gap-x-4 gap-y-1.5 px-5 py-4 text-left transition-colors hover:bg-lp-brand/6 focus-visible:bg-lp-brand/6 focus-visible:outline-none lg:grid-cols-[minmax(0,13rem)_minmax(0,1fr)_minmax(0,1.15fr)_1.25rem] lg:items-baseline"
            >
              <span className="flex items-center gap-2.5">
                <ModuleChip mod={m} className="h-7.5 w-7.5" glyph="h-4 w-4" />
                <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{m.title}</span>
                <span className="font-serif text-[13px] italic text-lp-muted/70 lg:hidden">{i + 1}</span>
              </span>
              <span className="text-[14px] leading-[1.55] text-lp-body">{m.handles}</span>
              <span className="text-[14px] leading-[1.55] text-lp-muted">
                <span className="font-semibold text-lp-body lg:hidden">Example: </span>
                {m.realWorld}
              </span>
              <ArrowUpRight className="hidden h-3.5 w-3.5 self-center text-lp-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 lg:block" />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && <ModuleDialog index={open} onIndex={show} onClose={close} />}
    </div>
  );
}
