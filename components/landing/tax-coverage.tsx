// Landing-page "Compliance, in the box" visual: a dark world map with a marker per continent, and a
// tile per continent. Everything links into /compliance, where the full country list lives.

import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { COVERAGE_CLAIM, MAJOR_COUNT, TAX_REGIONS } from "@/lib/tax-rates";
import { WORLD_PATH, WORLD_VIEWBOX } from "./world-map";

const MAP_W = 1000;
const MAP_H = 394;
const href = (slug: string) => `/compliance?region=${slug}`;

export function TaxCoverage() {
  return (
    <div className="mt-10">
      <div className="relative overflow-hidden rounded-3xl bg-lp-navy px-5 pb-6 pt-6 text-white sm:px-8 sm:pt-8">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_70%_at_50%_45%,rgba(217,104,42,0.16),transparent_70%)]" />

        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {[
              [COVERAGE_CLAIM, "countries covered"],
              [String(TAX_REGIONS.length), "continents"],
              ["VAT · GST · Sales tax", "and local e-invoicing"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-[26px] font-semibold leading-none tracking-[-0.04em] sm:text-[30px]">{n}</dd>
                <p className="mt-1.5 text-[12px] uppercase tracking-[0.18em] text-white/50">{l}</p>
              </div>
            ))}
          </dl>
          <Link
            href="/compliance"
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[14px] font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
          >
            Explore every country <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* map with one marker per continent */}
        <div className="relative mx-auto mt-6 max-w-5xl">
          <svg viewBox={WORLD_VIEWBOX} aria-hidden className="block h-auto w-full text-white/9">
            <path d={WORLD_PATH} fill="currentColor" />
          </svg>
          {TAX_REGIONS.map((r) => (
            <Link
              key={r.slug}
              href={href(r.slug)}
              aria-label={`${r.name} tax coverage`}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${(r.marker.x / MAP_W) * 100}%`, top: `${(r.marker.y / MAP_H) * 100}%` }}
            >
              <span className="relative mx-auto block h-3 w-3">
                <span className="absolute inset-0 animate-ping rounded-full bg-lp-brand/60 motion-reduce:hidden" />
                <span className="absolute inset-0 rounded-full bg-lp-brand ring-4 ring-lp-brand/25" />
              </span>
              <span className="mt-2 hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[12px] font-medium text-white ring-1 ring-white/15 backdrop-blur transition group-hover:bg-lp-brand group-hover:ring-lp-brand sm:flex">
                {r.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* one tile per continent */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {TAX_REGIONS.map((r) => (
          <Link
            key={r.slug}
            href={href(r.slug)}
            className="group flex flex-col rounded-2xl border border-lp-line bg-lp-card p-4 transition hover:-translate-y-0.5 hover:border-lp-brand/40 hover:shadow-[0_18px_40px_-24px_rgba(15,36,56,0.35)]"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{r.name}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-lp-muted transition group-hover:text-lp-brand" />
            </span>
            <span aria-hidden className="mt-3 flex gap-1 text-[18px] leading-none">
              {r.rows.slice(0, MAJOR_COUNT).map((row) => (
                <span key={row.country} title={row.country}>
                  {row.flag}
                </span>
              ))}
            </span>
            <span className="sr-only">Includes {r.rows.slice(0, MAJOR_COUNT).map((x) => x.country).join(", ")}</span>
            <span className="mt-3 flex flex-wrap gap-1">
              {r.regimes.map((g) => (
                <span key={g} className="rounded-full bg-lp-brand/10 px-2 py-0.5 text-[11px] font-medium text-lp-brand">
                  {g}
                </span>
              ))}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
