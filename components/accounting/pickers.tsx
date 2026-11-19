"use client";

// App-styled replacements for the native <select> and <input type="date">, whose OS popups
// (grey macOS menus, the Chrome calendar) don't match the rest of the app.

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Calendar, Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";

type Option = string | { value: string; label: string };
const optValue = (o: Option) => (typeof o === "string" ? o : o.value);
const optLabel = (o: Option) => (typeof o === "string" ? o : o.label);

// Positions a popover under (or, when there's no room, above) its trigger using fixed
// coordinates, so scroll containers and cards never clip it.
function usePopoverPosition(open: boolean, trigger: React.RefObject<HTMLElement | null>, height: number) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = trigger.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom;
      const top = below < height + 8 && r.top > below ? Math.max(8, r.top - height - 4) : r.bottom + 4;
      setPos({ top, left: Math.min(r.left, window.innerWidth - 8 - Math.max(r.width, 200)), width: r.width });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, trigger, height]);
  return pos;
}

const triggerCls =
  "flex w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";
const popoverCls = "fixed z-[70] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md animate-lp-rise [animation-duration:120ms]";

export function Select({ value: controlled, defaultValue, onChange, options, className, triggerClassName, placeholder, disabled, id, ariaLabel, size = "md" }: {
  /** Omit (with `defaultValue`) for an uncontrolled select that keeps its own value. */
  value?: string;
  defaultValue?: string;
  onChange?: (v: string) => void;
  options: Option[];
  className?: string;
  /** Extra classes for the trigger button, e.g. a taller or pill-shaped field. */
  triggerClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [own, setOwn] = useState(defaultValue ?? "");
  const value = controlled ?? own;
  const ref = useDismiss(open, setOpen);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const all: Option[] = placeholder !== undefined ? [{ value: "", label: placeholder }, ...options] : options;
  const selected = all.find((o) => optValue(o) === value);
  const pos = usePopoverPosition(open, btnRef, Math.min(288, all.length * 32 + 8));

  useEffect(() => {
    if (open) listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  function openList() {
    setActive(Math.max(0, all.findIndex((o) => optValue(o) === value)));
    setOpen(true);
  }
  function choose(o: Option) {
    if (controlled === undefined) setOwn(optValue(o));
    onChange?.(optValue(o));
    setOpen(false);
    btnRef.current?.focus();
  }
  function onKey(e: React.KeyboardEvent) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") setActive((i) => Math.min(all.length - 1, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Enter" || e.key === " ") choose(all[active]);
    else if (e.key === "Tab") setOpen(false);
    else return;
    e.preventDefault();
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        id={id}
        role="combobox"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKey}
        className={cn(triggerCls, size === "sm" ? "h-8" : "h-9", triggerClassName)}
      >
        <span className={cn("min-w-0 flex-1 truncate", !value && "text-muted-foreground")}>{selected ? optLabel(selected) : (placeholder ?? "")}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && pos && (
        <div ref={listRef} id={listId} role="listbox" style={{ top: pos.top, left: pos.left, minWidth: pos.width }} className={cn(popoverCls, "max-h-72 overflow-y-auto")}>
          {all.map((o, i) => {
            const isSel = optValue(o) === value;
            return (
              <div
                key={optValue(o) || "__empty"}
                role="option"
                data-index={i}
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                className={cn("relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm", i === active && "bg-accent text-accent-foreground")}
              >
                <span className="truncate">{optLabel(o)}</span>
                {isSel && <Check className="absolute right-2 h-4 w-4" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- date picker ---------- */

const pad = (n: number) => String(n).padStart(2, "0");
const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const todayIso = () => {
  const d = new Date();
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
};
// Display and typing use MM/DD/YYYY, as on the live platform.
const display = (iso: string) => (/^\d{4}-\d{2}-\d{2}$/.test(iso) ? `${iso.slice(5, 7)}/${iso.slice(8, 10)}/${iso.slice(0, 4)}` : "");
function parseTyped(s: string) {
  const m = s.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) return null;
  const [mo, d, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return date.getMonth() === mo - 1 && date.getDate() === d ? toIso(y, mo - 1, d) : null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function DateInput({ value, onChange, id, ariaLabel, className, size = "md" }: {
  value: string;
  onChange: (iso: string) => void;
  id?: string;
  ariaLabel?: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(display(value));
  const [lastValue, setLastValue] = useState(value);
  const base = value || todayIso();
  const [view, setView] = useState({ y: Number(base.slice(0, 4)), m: Number(base.slice(5, 7)) - 1 });
  const ref = useDismiss(open, setOpen);
  const boxRef = useRef<HTMLDivElement>(null);
  const pos = usePopoverPosition(open, boxRef, 330);

  if (lastValue !== value) {
    setLastValue(value);
    setText(display(value));
  }

  function openCalendar() {
    const b = value || todayIso();
    setView({ y: Number(b.slice(0, 4)), m: Number(b.slice(5, 7)) - 1 });
    setOpen(true);
  }
  function pick(iso: string) {
    onChange(iso);
    setText(display(iso));
    setOpen(false);
  }
  function commitTyped() {
    if (!text.trim()) return value && onChange("");
    const iso = parseTyped(text);
    if (iso) onChange(iso);
    else setText(display(value));
  }
  const shift = (n: number) => setView(({ y, m }) => ({ y: y + Math.floor((m + n) / 12), m: (((m + n) % 12) + 12) % 12 }));

  const first = new Date(view.y, view.m, 1).getDay();
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(view.y, view.m, i - first + 1);
    return { iso: toIso(d.getFullYear(), d.getMonth(), d.getDate()), day: d.getDate(), inMonth: d.getMonth() === view.m };
  });
  const now = todayIso();
  const navBtn = "inline-flex h-7 w-7 items-center justify-center rounded-md border border-input bg-background opacity-70 hover:opacity-100";

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div ref={boxRef} className={cn("flex w-full items-center rounded-md border border-input bg-transparent shadow-sm focus-within:ring-1 focus-within:ring-ring", size === "sm" ? "h-8" : "h-9")}>
        <input
          id={id}
          aria-label={ariaLabel}
          value={text}
          placeholder="mm/dd/yyyy"
          inputMode="numeric"
          onChange={(e) => setText(e.target.value)}
          onBlur={commitTyped}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitTyped();
            } else if (e.key === "ArrowDown" && e.altKey) openCalendar();
          }}
          className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums outline-none placeholder:text-muted-foreground"
        />
        <button type="button" aria-label="Open calendar" aria-expanded={open} onClick={() => (open ? setOpen(false) : openCalendar())} className="mr-1 inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground">
          <Calendar className="h-4 w-4" />
        </button>
      </div>
      {open && pos && (
        <div role="dialog" aria-label="Choose date" style={{ top: pos.top, left: pos.left }} className={cn(popoverCls, "w-68 p-3")}>
          <div className="mb-2 flex items-center justify-between">
            <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className={navBtn}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div aria-live="polite" className="text-sm font-medium">
              {MONTHS[view.m]} {view.y}
            </div>
            <button type="button" aria-label="Next month" onClick={() => shift(1)} className={navBtn}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((w) => (
              <span key={w} className="py-1 text-[0.8rem] font-normal text-muted-foreground">{w}</span>
            ))}
            {cells.map((c) => (
              <button
                key={c.iso}
                type="button"
                onClick={() => pick(c.iso)}
                aria-label={c.iso}
                aria-pressed={c.iso === value}
                className={cn(
                  "mx-auto flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  !c.inMonth && "text-muted-foreground opacity-50",
                  c.iso === now && c.iso !== value && "bg-accent text-accent-foreground",
                  c.iso === value && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                )}
              >
                {c.day}
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <button type="button" onClick={() => pick("")} className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-accent">
              Clear
            </button>
            <button type="button" onClick={() => pick(now)} className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-accent">
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
