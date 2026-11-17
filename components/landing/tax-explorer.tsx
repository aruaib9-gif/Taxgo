"use client";

// /compliance: every country Tax GO covers, by continent, with search. Reads ?region= from the
// landing-page links, so render it inside <Suspense>.

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { TAX_REGIONS, type TaxRow } from "@/lib/tax-rates";
import { cn } from "@/lib/utils";

const ALL = "all";

function matches(row: TaxRow, q: string) {
  return [row.country, row.tax, row.note ?? "", row.rate].some((v) => v.toLowerCase().includes(q));
}

export function TaxExplorer() {
  const asked = useSearchParams().get("region");
  const [region, setRegion] = useState(TAX_REGIONS.some((r) => r.slug === asked) ? (asked as string) : ALL);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const top = useRef<HTMLDivElement>(null);

  // Arriving from a continent link: start at the list, not wherever the previous page was scrolled.
  useEffect(() => {
    if (asked) top.current?.scrollIntoView({ block: "start" });
  }, [asked]);

  const shown = TAX_REGIONS.filter((r) => region === ALL || r.slug === region)
    .map((r) => ({ ...r, rows: q ? r.rows.filter((row) => matches(row, q)) : r.rows }))
    .filter((r) => r.rows.length > 0);
  const total = shown.reduce((n, r) => n + r.rows.length, 0);

  return (
    <div ref={top} className="mt-10 scroll-mt-16">
      {/* toolbar */}
      <div className="sticky top-12.5 z-20 -mx-6 border-y border-lp-line bg-lp-canvas/90 px-6 py-3 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="flex min-w-0 items-center gap-2.5 rounded-full border border-lp-line bg-lp-card px-4 py-2 lg:w-60 lg:shrink-0">
            <Search className="h-4 w-4 shrink-0 text-lp-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a country or tax…"
              aria-label="Search countries"
              className="w-full bg-transparent text-[15px] text-lp-ink outline-none placeholder:text-lp-muted"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="text-lp-muted hover:text-lp-ink">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
          <div role="tablist" aria-label="Continent" className="flex gap-1.5 overflow-x-auto pb-0.5">
            {[{ slug: ALL, name: "All" }, ...TAX_REGIONS.map((r) => ({ slug: r.slug, name: r.name }))].map((t) => (
              <button
                key={t.slug}
                type="button"
                role="tab"
                aria-selected={region === t.slug}
                onClick={() => setRegion(t.slug)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition",
                  region === t.slug ? "border-lp-brand bg-lp-brand text-lp-on-brand" : "border-lp-line bg-lp-card text-lp-body hover:text-lp-ink",
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Only search results are counted; the full list is the major markets, not every country covered. */}
      <p aria-live="polite" className="mt-5 min-h-5 text-[13px] text-lp-muted">
        {q && total > 0 && <>{total} {total === 1 ? "country" : "countries"} matching &ldquo;{query.trim()}&rdquo;</>}
      </p>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-lp-line bg-lp-card px-6 py-14 text-center">
          <p className="text-[16px] font-semibold text-lp-ink">No country matches &ldquo;{query.trim()}&rdquo;.</p>
          <p className="mt-1.5 text-[14px] text-lp-muted">
            {BRAND.fullName} is adding countries all the time.{" "}
            <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="font-medium text-lp-brand hover:underline">
              Ask us about yours
            </a>
            .
          </p>
        </div>
      ) : (
        shown.map((r) => (
          <section key={r.slug} id={r.slug} aria-labelledby={`h-${r.slug}`} className="mt-8 scroll-mt-40">
            <div className="flex flex-wrap items-end justify-between gap-2 border-b border-lp-line pb-3">
              <div>
                <h2 id={`h-${r.slug}`} className="text-[22px] font-semibold tracking-[-0.04em] text-lp-ink">
                  {r.name}
                </h2>
                <p className="mt-1 max-w-170 text-[14px] leading-normal text-lp-muted">{r.intro}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {r.regimes.map((g) => (
                  <span key={g} className="rounded-full bg-lp-brand/10 px-2.5 py-0.5 text-[12px] font-medium text-lp-brand">
                    {g}
                  </span>
                ))}
              </div>
            </div>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {r.rows.map((row) => (
                <li key={row.country} className="flex flex-col rounded-2xl border border-lp-line bg-lp-card p-4 transition hover:border-lp-brand/40 hover:shadow-[0_18px_40px_-26px_rgba(15,36,56,0.35)]">
                  <div className="flex items-start justify-between gap-3">
                    <span aria-hidden className="text-[28px] leading-none">
                      {row.flag}
                    </span>
                    <span className="rounded-full border border-lp-line px-2 py-0.5 text-[11px] font-medium text-lp-body">{row.tax}</span>
                  </div>
                  <h3 className="mt-3 text-[15px] font-semibold leading-snug tracking-[-0.02em] text-lp-ink">{row.country}</h3>
                  <p className={cn("mt-1 font-semibold tracking-[-0.04em] text-lp-brand", /\d/.test(row.rate) ? "text-[28px] leading-none" : "text-[18px] leading-tight")}>{row.rate}</p>
                  {row.note && <p className="mt-2 text-[12.5px] leading-normal text-lp-muted">{row.note}</p>}
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
