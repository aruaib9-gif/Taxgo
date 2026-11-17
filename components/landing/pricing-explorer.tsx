"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, Globe, Minus, Plus, Search, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  COUNTRY_PRICES,
  DEFAULT_CODE,
  DEFAULT_PACKAGE_ID,
  PACKAGES,
  REGIONS,
  USERS_INCLUDED,
  USER_BLOCK_PCT,
  type CountryPrice,
  type Cycle,
  type Package,
  type Region,
  amountFor,
  annualPerMonth,
  annualSavingPct,
  formatMoney,
  packageFor,
  priceFor,
  quoteMultiplier,
  searchCountries,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";
import { Panel, btnOutline, btnPrimary } from "@/components/landing/chrome";

const AI = BRAND.fullName;

/** True of every package, whichever modules it carries. */
const alwaysIncluded = [
  "Up to 5 users included — each extra 5 adds 25%",
  "Local tax, e-invoicing & statutory filings",
  "Priority onboarding & free migration",
];

/** The country to open on: an exact name match for `?country=`, else its first match, else the default. */
function initialCode(query: string): string {
  const q = query.trim().toLowerCase();
  if (!q) return DEFAULT_CODE;
  const matches = searchCountries(q);
  return (matches.find((m) => m.country.toLowerCase() === q) ?? matches[0])?.code ?? DEFAULT_CODE;
}

/** The visitor's country code: the host's geolocation header first, else a public IP lookup. Null if neither knows. */
async function detectCountry(): Promise<string | null> {
  try {
    const own = (await (await fetch("/api/geo")).json()) as { country: string | null };
    if (own.country) return own.country;
  } catch {}
  try {
    const res = await fetch("https://api.country.is/");
    const ip = (await res.json()) as { country?: string };
    return ip.country ?? null;
  } catch {
    return null;
  }
}

/** Reads `?country=` (sent by the landing-page search), so render it inside <Suspense>. Without one, it
 *  opens on the visitor's country (by IP) when we price there, until they pick a country themselves. */
export function PricingExplorer() {
  const asked = useSearchParams().get("country") ?? "";
  const [code, setCode] = useState<string>(() => initialCode(asked));
  const [cycle, setCycle] = useState<Cycle>("annual");
  const [pkgId, setPkgId] = useState<string>(DEFAULT_PACKAGE_ID);
  const [query, setQuery] = useState(asked);
  const [region, setRegion] = useState<Region | "All">("All");
  const [companies, setCompanies] = useState(1);
  const [users, setUsers] = useState(USERS_INCLUDED);
  const [located, setLocated] = useState<string | null>(null);
  const picked = useRef(Boolean(asked));

  useEffect(() => {
    if (picked.current) return;
    let live = true;
    detectCountry().then((c) => {
      if (!live || picked.current || !c || !priceFor(c)) return;
      setCode(c);
      setLocated(c);
    });
    return () => {
      live = false;
    };
  }, []);

  const pick = (c: string) => {
    picked.current = true;
    setCode(c);
  };

  const selected = priceFor(code) ?? COUNTRY_PRICES[0];
  const pkg = packageFor(pkgId);
  const results = useMemo(() => searchCountries(query, region), [query, region]);

  return (
    <>
      {/* package */}
      <div role="tablist" aria-label="Package" className="mt-8 flex flex-wrap justify-center gap-2">
        {PACKAGES.map((o) => (
          <button
            key={o.id}
            role="tab"
            aria-selected={o.id === pkg.id}
            onClick={() => setPkgId(o.id)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-[14px] font-medium transition",
              o.id === pkg.id
                ? "border-lp-ink bg-lp-ink text-lp-canvas"
                : "border-lp-line bg-lp-card text-lp-body hover:text-lp-ink",
            )}
          >
            {o.name}
          </button>
        ))}
      </div>

      {/* billing cycle */}
      <div className="mt-4 flex justify-center">
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
                cycle === c ? "bg-lp-brand text-lp-on-brand" : "text-lp-body hover:text-lp-ink",
              )}
            >
              {c}
              {c === "annual" && annualSavingPct(selected, pkg) > 0 ? (
                <span className={cn("ml-1.5 text-[12px]", cycle === c ? "text-lp-on-brand/75" : "text-lp-brand")}>
                  save {annualSavingPct(selected, pkg)}%
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
                      onClick={() => pick(p.code)}
                      aria-current={p.code === selected.code}
                      className={cn(
                        "flex w-full items-center justify-between gap-4 px-5 py-2.75 text-left transition",
                        p.code === selected.code ? "bg-lp-brand/7" : "hover:bg-lp-canvas",
                      )}
                    >
                      <span className="flex min-w-0 items-center gap-2.5">
                        <span aria-hidden className="text-[16px] leading-none">
                          {p.flag}
                        </span>
                        <span className="truncate text-[14px] text-lp-ink">{p.country}</span>
                        <span className="shrink-0 rounded-full border border-lp-line px-1.5 py-px text-[10px] font-semibold text-lp-muted">
                          {p.currency}
                        </span>
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-[11px] text-lp-muted">
                        <span className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">
                          {formatMoney(p, amountFor(p, pkg, cycle))}
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
          <SelectedCard
            price={selected}
            pkg={pkg}
            cycle={cycle}
            onPickPackage={setPkgId}
            companies={companies}
            onCompanies={setCompanies}
            users={users}
            onUsers={setUsers}
            located={located === selected.code}
          />
        </div>
      </div>
    </>
  );
}

function SelectedCard({
  price,
  pkg,
  cycle,
  onPickPackage,
  companies,
  onCompanies,
  users,
  onUsers,
  located,
}: {
  price: CountryPrice;
  pkg: Package;
  cycle: Cycle;
  onPickPackage: (id: string) => void;
  companies: number;
  onCompanies: (n: number) => void;
  users: number;
  onUsers: (n: number) => void;
  located: boolean;
}) {
  const unit = amountFor(price, pkg, cycle);
  const multiplier = quoteMultiplier(companies, users);
  const amount = Math.round(unit * multiplier);
  const extraBlocks = Math.ceil(Math.max(0, users - USERS_INCLUDED) / USERS_INCLUDED);
  const saving = annualSavingPct(price, pkg);
  const others = PACKAGES.filter((p) => p.id !== pkg.id);

  return (
    <Panel className="px-6.5 pb-7 pt-7 text-left">
      <p className="flex items-center gap-2.5 text-[14px] text-lp-body">
        <span aria-hidden className="text-[20px] leading-none">
          {price.flag}
        </span>
        <span className="font-medium text-lp-ink">{price.country}</span>
        <span className="rounded-full border border-lp-line px-1.5 py-px text-[10px] font-semibold text-lp-muted">
          {price.currency}
        </span>
        {located ? <span className="ml-auto text-[12px] text-lp-muted">Based on your location</span> : null}
      </p>

      <p className="mt-5 text-[15px] font-semibold tracking-[-0.03em] text-lp-ink">{pkg.name}</p>
      <p className="text-[13px] text-lp-muted">{pkg.blurb}</p>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.045em] text-lp-ink">
          {formatMoney(price, amount)}
        </span>
        <span className="text-[14px] text-lp-muted">
          / {companies === 1 ? "company" : `${companies} companies`} / {cycle === "annual" ? "year" : "month"}
        </span>
      </p>
      {multiplier !== 1 ? (
        <p className="mt-1 text-[12px] text-lp-muted">
          {formatMoney(price, unit)} base
          {extraBlocks > 0 ? <> + {extraBlocks * USER_BLOCK_PCT}% for {users} users</> : null}
          {companies > 1 ? <> × {companies} companies</> : null}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Stepper label="Companies" value={companies} min={1} step={1} onChange={onCompanies} />
        <Stepper label="Users per company" value={users} min={1} step={USERS_INCLUDED} onChange={onUsers} />
      </div>
      <p className="mt-2 text-[12px] text-lp-muted">
        Priced per company. Up to {USERS_INCLUDED} users included; each extra {USERS_INCLUDED} adds {USER_BLOCK_PCT}%.
      </p>

      <p className="mt-2 text-[13px] text-lp-muted">
        {cycle === "annual" ? (
          <>
            Works out to {formatMoney(price, Math.round(annualPerMonth(price, pkg) * multiplier))} a month
            {saving > 0 ? <> — {saving}% below paying monthly</> : null}.
          </>
        ) : (
          <>
            {saving > 0 ? (
              <>
                Pay annually at {formatMoney(price, Math.round(amountFor(price, pkg, "annual") * multiplier))} and save {saving}%.
              </>
            ) : (
              <>Annual billing: {formatMoney(price, Math.round(amountFor(price, pkg, "annual") * multiplier))}.</>
            )}
          </>
        )}
      </p>

      <div className="mt-6 border-t border-lp-line pt-6">
        <ul className="space-y-2.75">
          {[...pkg.includes, ...alwaysIncluded].map((f) => (
            <li key={f} className="flex items-start gap-3 text-[14px] text-lp-body">
              <Check className="mt-0.75 h-3.5 w-3.5 shrink-0 text-lp-brand" strokeWidth={2} /> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* the other packages, priced in the same currency and cycle */}
      <div className="mt-6 border-t border-lp-line pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-lp-muted">Other packages</p>
        <ul className="mt-2.5 -mx-2">
          {others.map((o) => (
            <li key={o.id}>
              <button
                onClick={() => onPickPackage(o.id)}
                className="flex w-full items-baseline justify-between gap-4 rounded-lg px-2 py-1.5 text-left transition hover:bg-lp-canvas"
              >
                <span className="truncate text-[14px] text-lp-body">{o.name}</span>
                <span className="shrink-0 whitespace-nowrap text-[11px] text-lp-muted">
                  <span className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">
                    {formatMoney(price, Math.round(amountFor(price, o, cycle) * multiplier))}
                  </span>{" "}
                  / {cycle === "annual" ? "yr" : "mo"}
                </span>
              </button>
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

/** A small − value + counter. Step snaps to multiples (users go 5, 10, 15…), never below `min`. */
function Stepper({
  label,
  value,
  min,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step: number;
  onChange: (n: number) => void;
}) {
  const down = Math.max(min, step === 1 ? value - 1 : Math.ceil(value / step) * step - step);
  const up = step === 1 ? value + 1 : Math.floor(value / step) * step + step;
  const btn =
    "grid h-8 w-8 place-items-center rounded-full text-lp-body transition hover:bg-lp-alt hover:text-lp-ink disabled:opacity-40 disabled:hover:bg-transparent";
  return (
    <div>
      <p className="text-[12px] font-medium text-lp-muted">{label}</p>
      <div className="mt-1 flex items-center justify-between rounded-full border border-lp-line bg-lp-canvas p-0.5">
        <button type="button" onClick={() => onChange(down)} disabled={value <= min} aria-label={`Fewer ${label.toLowerCase()}`} className={btn}>
          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min={min}
          max={999}
          value={value}
          onChange={(e) => onChange(Math.min(999, Math.max(min, Math.floor(Number(e.target.value)) || min)))}
          aria-label={label}
          className="w-12 bg-transparent text-center text-[15px] font-semibold text-lp-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button type="button" onClick={() => onChange(Math.min(999, up))} aria-label={`More ${label.toLowerCase()}`} className={btn}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
