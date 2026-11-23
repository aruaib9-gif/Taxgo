"use client";

// The 15-module grid. Each tile opens the module window; the data lives in lib/modules.ts
// so the "What Tax GO handles" page shows the same 15 modules.

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MODULES } from "@/lib/modules";
import { cn } from "@/lib/utils";
import { ModuleChip } from "@/components/landing/module-chip";
import { ModuleDialog } from "@/components/landing/module-detail";

export function ModuleExplorer({ className }: { className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const lastOpened = useRef(0);

  const show = useCallback((i: number) => {
    lastOpened.current = i;
    setOpen(i);
  }, []);

  const close = useCallback(() => {
    setOpen(null);
    tiles.current[lastOpened.current]?.focus();
  }, []);

  return (
    <div className={cn("mt-11", className)}>
      <p className="mb-3 text-[13px] text-lp-muted">Click a module to see what it does.</p>
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-lp-line bg-lp-card sm:grid-cols-3 lg:grid-cols-5">
        {MODULES.map((mod, i) => {
          const tile =
            "group -mb-px -mr-px border-b border-r border-lp-line px-4.25 pb-4.75 pt-4.25 text-left transition-colors hover:bg-lp-brand/6 focus-visible:bg-lp-brand/6 focus-visible:outline-none";
          const body = (
            <>
              <span className="flex items-center justify-between">
                <ModuleChip mod={mod} className="h-8 w-8" glyph="h-4 w-4" />
                <ArrowUpRight className="h-3.5 w-3.5 text-lp-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </span>
              <h3 className="mt-3 text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{mod.title}</h3>
              <p className="mt-1 text-[12.5px] text-lp-muted">{mod.text}</p>
            </>
          );
          // a module with its own page goes there; the rest open the window
          return mod.page ? (
            <Link key={mod.title} href={mod.page} className={`block ${tile}`}>
              {body}
            </Link>
          ) : (
            <button
              key={mod.title}
              ref={(el) => {
                tiles.current[i] = el;
              }}
              type="button"
              onClick={() => show(i)}
              aria-haspopup="dialog"
              className={tile}
            >
              {body}
            </button>
          );
        })}
      </div>

      {open !== null && <ModuleDialog index={open} onIndex={show} onClose={close} />}
    </div>
  );
}
