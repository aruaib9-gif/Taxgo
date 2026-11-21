"use client";

// The module window, shared by the landing grid and the "What Tax GO handles" page:
// features, an everyday example, what she automates and the time it saves.

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, Sparkles, X, type LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { MODULES } from "@/lib/modules";
import { ModuleChip } from "@/components/landing/module-chip";

const AI = BRAND.fullName;

/**
 * Esc closes, the arrow keys browse, the page behind does not scroll.
 * `index` is the open module; `onIndex` moves to another, `onClose` closes.
 */
export function ModuleDialog({
  index,
  onIndex,
  onClose,
}: {
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") onIndex((index + 1) % MODULES.length);
      else if (e.key === "ArrowLeft") onIndex((index - 1 + MODULES.length) % MODULES.length);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [index, onIndex, onClose]);

  const m = MODULES[index];
  const prev = MODULES[(index - 1 + MODULES.length) % MODULES.length];
  const next = MODULES[(index + 1) % MODULES.length];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div aria-hidden className="animate-lp-rise absolute inset-0 bg-lp-navy/55 [animation-duration:150ms]" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="module-title"
        className="animate-lp-rise relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-lp-line bg-lp-card shadow-[0_30px_80px_-20px_rgba(15,36,56,0.45)] [animation-duration:200ms] sm:rounded-2xl"
      >
        <div className="flex items-start gap-3.5 border-b border-lp-line px-6 py-5">
          <ModuleChip mod={m} className="h-10 w-10" glyph="h-5 w-5" />
          <div className="min-w-0 flex-1">
            <h3 id="module-title" className="text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">
              {m.title}
            </h3>
            <p className="mt-0.5 text-[14.5px] leading-normal text-lp-body">{m.summary}</p>
          </div>
          <button
            autoFocus
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-lp-muted transition-colors hover:bg-lp-canvas hover:text-lp-ink"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="grid divide-y divide-lp-line md:grid-cols-3 md:divide-x md:divide-y-0">
            <Block title="Features">
              <ul className="space-y-2">
                {m.features.map((f) => (
                  <li key={f} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lp-brand" />
                    {f}
                  </li>
                ))}
              </ul>
            </Block>
            <Block title="Everyday example">
              <p>{m.example}</p>
            </Block>
            <Block title={`What ${AI} automates`} icon={Sparkles}>
              <ul className="space-y-2">
                {m.automation.map((a) => (
                  <li key={a} className="flex gap-2.5">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ai-done" />
                    {a}
                  </li>
                ))}
              </ul>
            </Block>
          </div>

          <div className="flex items-center gap-3 border-t border-lp-line bg-lp-brand/6 px-6 py-4">
            <Clock className="h-4.5 w-4.5 shrink-0 text-lp-brand" strokeWidth={2} />
            <p className="text-[14.5px] text-lp-ink">
              <b className="font-semibold">Time saved:</b> {m.saving}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-lp-line px-4 py-3 text-[13px]">
          <button
            type="button"
            onClick={() => onIndex((index - 1 + MODULES.length) % MODULES.length)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-lp-body transition-colors hover:bg-lp-canvas hover:text-lp-ink"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{prev.title}</span>
            <span className="sm:hidden">Previous</span>
          </button>
          <span className="text-lp-muted">
            {index + 1} of {MODULES.length}
          </span>
          <button
            type="button"
            onClick={() => onIndex((index + 1) % MODULES.length)}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-lp-body transition-colors hover:bg-lp-canvas hover:text-lp-ink"
          >
            <span className="hidden sm:inline">{next.title}</span>
            <span className="sm:hidden">Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Block({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 text-[14px] leading-[1.6] text-lp-body">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lp-muted">
        {Icon && <Icon className="h-3.5 w-3.5 text-ai-done" strokeWidth={2} />}
        {title}
      </p>
      {children}
    </div>
  );
}
