"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Brain,
  Building2,
  ChartColumn,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Circle,
  CircleCheck,
  Database,
  FileText,
  Landmark,
  Loader2,
  PackageOpen,
  Plus,
  Receipt,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useAssistant } from "@/components/assistant";
import { moduleGroups } from "@/lib/nav";
import { useDashboard } from "@/lib/metrics";
import { loadSampleData } from "@/lib/sample";
import type { Rec } from "@/lib/store";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

function money(v: number) {
  return `${BRAND.currency}${v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

const card = "rounded-xl border border-border bg-card text-card-foreground shadow";

// Time-of-day greeting; the server renders a neutral one so hydration never mismatches.
const noop = () => () => {};
function useGreeting() {
  return useSyncExternalStore(
    noop,
    () => {
      const h = new Date().getHours();
      return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
    },
    () => "Hello",
  );
}

export function HomeDashboard() {
  const { kpis, needsYou, counts, recent } = useDashboard();
  const greeting = useGreeting();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto mb-8 max-w-2xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight">
            {greeting}, {BRAND.user.name}
          </h1>
          <p className="mt-3 text-balance leading-relaxed text-muted-foreground">
            <span className="animate-lp-rise">Cash stands at {money(kpis.cashBalance)}. </span>
            <span className="animate-lp-rise [animation-delay:120ms]">
              Customers owe you {money(kpis.arOutstanding)}; you owe suppliers {money(kpis.apOutstanding)}.{" "}
            </span>
            {kpis.overdue === 0 ? (
              <span className="animate-lp-rise font-medium text-success [animation-delay:240ms]">Nothing is overdue.</span>
            ) : (
              <span className="animate-lp-rise font-medium text-warning [animation-delay:240ms]">
                {kpis.overdue} invoice{kpis.overdue === 1 ? " is" : "s are"} overdue.
              </span>
            )}
          </p>
        </div>

        <AskBar />

        <div className="mt-8">
          <div className={cn(card, "mx-auto mb-8 max-w-2xl")}>
            <div className="p-4 pb-2 text-sm font-semibold tracking-tight">Needs you</div>
            <div className="p-4 pt-1">
              {needsYou.length === 0 ? (
                <div className="flex items-center gap-2.5 py-2 text-sm text-muted-foreground">
                  <CircleCheck className="h-4 w-4 text-success" />
                  Nothing needs you right now — {BRAND.fullName} has the rest.
                </div>
              ) : (
                <ul>
                  {needsYou.map((it) => (
                    <li key={it.text}>
                      <Link href={it.href} className="flex items-center gap-2.5 rounded-md py-2 text-sm hover:text-primary">
                        <TriangleAlert className="h-4 w-4 text-warning" />
                        <span className="flex-1">{it.text}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto mb-8 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Kpi href="/bank/accounts" icon={Wallet} label="Cash Balance" value={money(kpis.cashBalance)} />
          <Kpi href="/ar/invoices" icon={ArrowDownRight} label="AR Outstanding" value={money(kpis.arOutstanding)} />
          <Kpi href="/ap/bills" icon={ArrowUpRight} label="AP Outstanding" value={money(kpis.apOutstanding)} />
          <Kpi href="/ar/invoices?status=OVERDUE" icon={TriangleAlert} label="Overdue Invoices" value={String(kpis.overdue)} />
          <Kpi href="/reports/income-statement" icon={TrendingUp} label="Revenue (Period)" value={money(kpis.revenue)} />
          <Kpi href="/reports/income-statement" icon={Receipt} label="Expenses (Period)" value={money(kpis.expensesTotal)} />
        </div>

        <GettingStarted counts={counts} />

        <h2 className="mb-4 mt-12 text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">Everything she runs</h2>
        <ModuleGrid />

        <h2 className="mb-4 mt-12 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">Recent Activity</h2>
        <RecentCard title="Recent Journal Entries" href="/financial/journal-entries" empty="No journal entries yet." rows={recent.journals} render={(r) => [String(r.number ?? ""), String(r.description ?? ""), String(r.status ?? "")]} />
        <div className={cn(card, "mt-6")}>
          <div className="flex flex-row items-center justify-between p-6 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <Brain className="h-4 w-4" /> AI Insights
            </div>
            <Link href="/ai/anomalies" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              View All →
            </Link>
          </div>
          <div className="p-6 pt-0">
            <p className="text-sm text-muted-foreground">No anomalies detected — ai continuously monitors your financial data</p>
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <RecentCard title="Recent Invoices" empty="No invoices yet." rows={recent.invoices} render={(r) => [String(r.number ?? ""), String(r.customer ?? ""), money(Number(r.total ?? 0))]} />
          <RecentCard title="Recent Bills" empty="No bills yet." rows={recent.bills} render={(r) => [String(r.number ?? ""), String(r.vendor ?? ""), money(Number(r.total ?? 0))]} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ href, icon: Icon, label, value }: { href: string; icon: LucideIcon; label: string; value: string }) {
  return (
    <Link href={href} className="rounded-xl border border-border bg-card p-3 transition-colors hover:bg-accent/50">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1 truncate text-base font-semibold tabular-nums">{value}</div>
    </Link>
  );
}

const SUGGESTIONS = [
  "What's my cash position?",
  "Close the month",
  "Chase my overdue invoices",
  "Record a fuel expense of 200",
  "Which customer owes me the most?",
];

const QUICK_ACTIONS: { label: string; href: string; icon: LucideIcon; primary?: boolean }[] = [
  { label: "Record Expense", href: "/expense/new", icon: Receipt, primary: true },
  { label: "Record Income", href: "/income/new", icon: Banknote, primary: true },
  { label: "New Sale", href: "/sale/new", icon: ShoppingCart, primary: true },
  { label: "Record Purchase", href: "/purchase/new", icon: PackageOpen },
  { label: "New Journal Entry", href: "/financial/journal-entries/new", icon: Plus },
  { label: "AI Assistant", href: "/ai/assistant", icon: Brain },
  { label: "View Reports", href: "/reports", icon: TrendingUp },
];

// "Tell Tax GO.ai —" prompt: rotating suggestions, ⌘K to focus, Enter asks the assistant.
function AskBar() {
  const { ask } = useAssistant();
  const [value, setValue] = useState("");
  const [hint, setHint] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setHint((h) => (h + 1) % SUGGESTIONS.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submit() {
    if (!value.trim()) return;
    ask(value);
    setValue("");
  }

  return (
    <div className="mb-2">
      <div className="mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm transition-shadow focus-within:border-ring focus-within:shadow-[0_0_0_1px_var(--ring),0_8px_30px_-12px_color-mix(in_srgb,var(--primary)_35%,transparent)]">
        <Sparkles className="h-5 w-5 shrink-0 text-primary" />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`Tell ${BRAND.fullName} — ${SUGGESTIONS[hint]}`}
          aria-label={`Tell ${BRAND.fullName} —`}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/70"
        />
        {value.trim() ? (
          <button
            type="button"
            onClick={submit}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Ask {BRAND.fullName} <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground sm:block">⌘K</kbd>
        )}
      </div>
      <p className="mx-auto mt-1.5 max-w-2xl text-center text-xs text-muted-foreground">Ask her anything, or type to find a module. Enter asks {BRAND.fullName}.</p>
      {value.trim() && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className={cn(
                "inline-flex animate-lp-rise items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                a.primary ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <a.icon className="h-3.5 w-3.5" /> {a.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const CHECKLIST_KEY = "taxgo:checklist";
const CHECKLIST_DISMISSED_KEY = "taxgo:checklist-dismissed";

type Counts = ReturnType<typeof useDashboard>["counts"];

const STEPS: { id: string; title: string; hint: string; href: string; icon: LucideIcon; auto?: (c: Counts) => boolean }[] = [
  { id: "company", title: "Set up company profile", hint: "Configure your business details", href: "/select-company", icon: Building2 },
  { id: "customer", title: "Create your first customer", hint: "Add a customer to start invoicing", href: "/ar/invoices", icon: Users, auto: (c) => c.customers > 0 },
  { id: "invoice", title: "Create your first invoice", hint: "Send your first invoice to a customer", href: "/ar/invoices/new", icon: FileText, auto: (c) => c.invoices > 0 },
  { id: "bank", title: "Add a bank account", hint: "Connect your bank for reconciliation", href: "/bank/accounts", icon: Landmark, auto: (c) => c.banks > 0 },
  { id: "bill", title: "Record your first bill", hint: "Track a vendor bill or expense", href: "/ap/bills/new", icon: Receipt, auto: (c) => c.bills > 0 },
  { id: "reports", title: "Explore reports", hint: "View financial statements and analytics", href: "/reports", icon: ChartColumn },
];

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function GettingStarted({ counts }: { counts: Counts }) {
  const [ticked, setTicked] = useState<Record<string, boolean>>({});
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setTicked(readJSON(CHECKLIST_KEY, {}));
      setDismissed(readJSON(CHECKLIST_DISMISSED_KEY, false));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  if (dismissed) return null;

  const isDone = (s: (typeof STEPS)[number]) => Boolean(ticked[s.id] || s.auto?.(counts));
  const done = STEPS.filter(isDone).length;
  const pct = Math.round((done / STEPS.length) * 100);

  function toggle(id: string) {
    setTicked((t) => {
      const next = { ...t, [id]: !t[id] };
      try {
        localStorage.setItem(CHECKLIST_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true");
    } catch {}
  }

  async function loadSample() {
    setLoading(true);
    await loadSampleData();
    setLoading(false);
  }

  return (
    <div className={cn(card, "mb-8")}>
      <div className="flex flex-row items-center justify-between p-6 pb-3">
        <div className="text-base font-semibold tracking-tight">Getting Started</div>
        <button type="button" onClick={dismiss} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Dismiss checklist</span>
        </button>
      </div>
      <div className="p-6 pt-0">
        {counts.invoices === 0 && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-info/20 bg-info/10 p-3">
            <div className="flex items-center gap-2 text-sm">
              <Database className="h-4 w-4 shrink-0" />
              <span>Load sample data to explore {BRAND.fullName} with realistic accounts, customers, invoices, and more.</span>
            </div>
            <button
              type="button"
              onClick={loadSample}
              disabled={loading}
              className="ml-3 inline-flex h-8 shrink-0 items-center gap-2 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
              Load Sample Data
            </button>
          </div>
        )}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {done} of {STEPS.length} complete
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="space-y-1">
          {STEPS.map((s) => {
            const complete = isDone(s);
            return (
              <div key={s.id} className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent">
                <button
                  type="button"
                  onClick={() => toggle(s.id)}
                  disabled={Boolean(s.auto?.(counts))}
                  aria-label={complete ? `Mark "${s.title}" not done` : `Mark "${s.title}" done`}
                  className="shrink-0 text-muted-foreground hover:text-primary disabled:cursor-default"
                >
                  {complete ? <CircleCheck className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <s.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <Link href={s.href} className="flex min-w-0 flex-1 items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className={cn("text-sm font-medium", complete && "text-muted-foreground line-through")}>{s.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.hint}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// "Everything she runs": one card per module; opening a card spans the row and lists its tools.
function ModuleGrid() {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {moduleGroups.map((g) => {
        const isOpen = open === g.key;
        return (
          <div key={g.key} className={cn(card, "transition-all", isOpen ? "col-span-full" : "hover:-translate-y-0.5 hover:shadow-md")}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : g.key)}
              className={cn("flex w-full items-center gap-3 p-4 text-left", isOpen && "border-b border-border")}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                <g.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold">{g.label}</div>
                <div className="truncate text-xs text-muted-foreground">{g.description}</div>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">{g.tiles.length}</span>
              {isOpen ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </button>
            {isOpen && (
              <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
                {g.tiles.map((t) => (
                  <Link
                    key={t.href + t.label}
                    href={t.href}
                    className="flex animate-lp-rise flex-col items-center rounded-xl border border-border bg-card p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/5 text-primary/70">
                      <t.icon className="h-5 w-5" />
                    </span>
                    <span className="mt-3 text-sm font-semibold">{t.label}</span>
                    <span className="mt-0.5 text-xs text-muted-foreground">{t.description}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecentCard({
  title,
  href,
  empty,
  rows,
  render,
}: {
  title: string;
  href?: string;
  empty: string;
  rows: Rec[];
  render: (r: Rec) => [string, string, string];
}) {
  return (
    <div className={card}>
      <div className="flex flex-row items-center justify-between p-6 pb-3">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        {href && (
          <Link href={href} className="text-xs text-muted-foreground transition-colors hover:text-foreground">
            View All →
          </Link>
        )}
      </div>
      <div className="p-6 pt-0">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{empty}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => {
              const [a, b, c] = render(r);
              return (
                <li key={r.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="w-20 shrink-0 font-medium tabular-nums">{a}</span>
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{b}</span>
                  <span className="shrink-0 tabular-nums">{c}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
