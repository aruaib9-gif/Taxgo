"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Globe, Search, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  COUNTRY_PRICES,
  DEFAULT_CODE,
  REGIONS,
  type CountryPrice,
  type Region,
  annualPerMonth,
  annualSavingPct,
  formatMoney,
  priceFor,
  searchCountries,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Panel, btnOutline, btnPrimary } from "@/components/landing/chrome";

const AI = BRAND.fullName;

type Cycle = "monthly" | "annual";

const included = [
  "Unlimited users — your whole team, free",
  "All 15 module groups",
  `All of ${AI}'s agents`,
  "Local tax, e-invoicing & statutory filings",
  "Multi-currency & your whole org tree",
  "Real double-entry & full audit trail",
  "Priority onboarding & free migration",
  "On-demand accountants & CFOs available",
];

/** The country to open on: an exact name match for `?country=`, else its first match, else the default. */
function initialCode(query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return DEFAULT_CODE;
  const matches = searchCountries(q);
  return (matches.find((m) => m.country.toLowerCase() === q) ?? matches[0])?.code ?? DEFAULT_CODE;
}

/** Reads `?country=` (sent by the landing-page search), so render it inside <Suspense>. */
export function PricingExplorer() {
  const asked = useSearchParams().get("country") ?? "";
  const [code, setCode] = useState<string>(() => initialCode(asked));
  const [cycle, setCycle] = useState<Cycle>("annual");
  const [query, setQuery] = useState(asked);
  const [region, setRegion] = useState<Region | "All">("All");

  const selected = priceFor(code) ?? COUNTRY_PRICES[0];
  const results = useMemo(() => searchCountries(query, region), [query, region]);

  return (
    <>
      {/* billing cycle */}
      <div className="mt-9 flex justify-center">
        <div
          role="tablist"
          aria-label="Billing cycle"
          className="inline-flex rounded-full border border-lp-line bg-lp-card p-1"
        >
          {(["monthly", "annual"] as Cycle[]).map((c) => (
            <button
              key={c}
              role="tab"
              aria-selected={cycle === c}
              onClick={() => setCycle(c)}
              className={cn(
                "rounded-full px-5 py-1.5 text-[14px] font-medium capitalize transition",
                cycle === c ? "bg-lp-brand text-lp-navy" : "text-lp-body hover:text-lp-ink",
              )}
            >
              {c}
              {c === "annual" && annualSavingPct(selected) > 0 ? (
                <span className={cn("ml-1.5 text-[12px]", cycle === c ? "text-lp-navy/70" : "text-lp-brand")}>
                  save {annualSavingPct(selected)}%
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div id="explore" className="mt-10 grid scroll-mt-20 gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        {/* selector */}
        <Panel className="order-2 lg:order-1">
          <div className="border-b border-lp-line px-5 py-4">
            <label className="flex items-center gap-2.5 rounded-full border border-lp-line bg-lp-canvas px-4 py-2">
              <Search className="h-4 w-4 shrink-0 text-lp-muted" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${COUNTRY_PRICES.length} countries or a currency…`}
                className="w-full bg-transparent text-[15px] text-lp-ink outline-none placeholder:text-lp-muted"
                aria-label="Search countries"
              />
              {query ? (
                <button onClick={() => setQuery("")} aria-label="Clear search" className="text-lp-muted hover:text-lp-ink">
                  <X className="h-4 w-4" strokeWidth={2} />
                </button>
              ) : null}
            </label>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(["All", ...REGIONS] as (Region | "All")[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  aria-pressed={region === r}
                  className={cn(
                    "rounded-full border px-3 py-0.75 text-[12px] font-medium transition",
                    region === r
                      ? "border-lp-brand bg-lp-brand/10 text-lp-brand"
                      : "border-lp-line text-lp-muted hover:text-lp-ink",
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-140 overflow-y-auto">
            {results.length === 0 ? (
              <p className="px-5 py-10 text-center text-[14px] text-lp-muted">
                No match for &ldquo;{query}&rdquo;. We price in {COUNTRY_PRICES.length} countries —{" "}
                <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="text-lp-brand hover:underline">
                  ask us about yours
                </a>
                .
              </p>
            ) : (
              <ul className="divide-y divide-lp-line">
                {results.map((p) => (
                  <li key={p.code}>
                    <button
                      onClick={() => setCode(p.code)}
                      aria-current={p.code === selected.code}
                      className={cn(
                        "flex w-full items-center justify-between gap-4 px-5 py-2.75 text-left transition",
                        p.code === selected.code ? "bg-lp-brand/[0.07]" : "hover:bg-lp-canvas",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span aria-hidden className="text-[16px] leading-none">
                          {p.flag}
                        </span>
                        <span className="truncate text-[14px] text-lp-ink">{p.country}</span>
                        <span className="shrink-0 rounded-full border border-lp-line px-1.5 py-0.25 text-[10px] font-semibold text-lp-muted">
                          {p.currency}
                        </span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-lp-muted">
                        <span className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">
                          {formatMoney(p, cycle === "annual" ? p.annual : p.monthly)}
                        </span>{" "}
                        / {cycle === "annual" ? "yr" : "mo"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Panel>

        {/* selected country */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-17.5">
          <SelectedCard price={selected} cycle={cycle} />
        </div>
      </div>
    </>
  );
}

function SelectedCard({ price, cycle }: { price: CountryPrice; cycle: Cycle }) {
  const amount = cycle === "annual" ? price.annual : price.monthly;
  const saving = annualSavingPct(price);

  return (
    <Panel className="px-6.5 pb-7 pt-7 text-left">
      <p className="flex items-center gap-2.5 text-[14px] text-lp-body">
        <span aria-hidden className="text-[20px] leading-none">
          {price.flag}
        </span>
        <span className="font-medium text-lp-ink">{price.country}</span>
        <span className="rounded-full border border-lp-line px-1.5 py-0.25 text-[10px] font-semibold text-lp-muted">
          {price.currency}
        </span>
      </p>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-2">
        <span className="text-[40px] font-semibold leading-[1.05] tracking-[-0.045em] text-lp-ink">
          {formatMoney(price, amount)}
        </span>
        <span className="text-[14px] text-lp-muted">
          / company / {cycle === "annual" ? "year" : "month"}
        </span>
      </p>

      <p className="mt-2 text-[13px] text-lp-muted">
        {cycle === "annual" ? (
          <>
            Works out to {formatMoney(price, annualPerMonth(price))} a month
            {saving > 0 ? <> — {saving}% below paying monthly</> : null}.
          </>
        ) : (
          <>
            {saving > 0 ? (
              <>
                Pay annually at {formatMoney(price, price.annual)} and save {saving}%.
              </>
            ) : (
              <>Annual billing: {formatMoney(price, price.annual)}.</>
            )}
          </>
        )}
      </p>

      <div className="mt-6 border-t border-lp-line pt-6">
        <ul className="space-y-2.75">
          {included.map((f) => (
            <li key={f} className="flex items-start gap-3 text-[14px] text-lp-body">
              <Check className="mt-0.75 h-3.5 w-3.5 shrink-0 text-lp-brand" strokeWidth={2} /> {f}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 border-t border-lp-line pt-6">
        <Link href="/register" className={cn(btnPrimary, "w-full")}>
          Hire {AI} — free to start <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className={cn(btnOutline, "mt-2.5 w-full")}>
          Talk to a person <ArrowRight className="h-3.5 w-3.5" />
        </a>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[12px] text-lp-muted">
          <Globe className="h-3 w-3" strokeWidth={2} /> No credit card. Cancel anytime.
        </p>
      </div>
    </Panel>
  );
}
