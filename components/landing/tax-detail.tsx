"use client";

// /compliance, below the continent explorer: the United States in depth (all 50 states + DC, federal
// rates, an illustrative sales tax calculator, what the US tax engine does) and the full EU VAT table.

import { useState } from "react";
import { AlertTriangle, Calculator, ExternalLink, FileCheck2, History, MapPin, PackageSearch, Radar, ReceiptText, Search, X, type LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  EU_VAT,
  EU_VAT_SOURCES,
  US_BRACKETS_SINGLE,
  US_ENGINE_FEATURES,
  US_FEDERAL,
  US_FEDERAL_SOURCES,
  US_STATE_SOURCES,
  US_STATES,
  type TaxSource,
} from "@/lib/tax-detail";
import { cn } from "@/lib/utils";

const FEATURE_ICONS: LucideIcon[] = [MapPin, Radar, PackageSearch, FileCheck2, ReceiptText, History];

const FILTERS = [
  { id: "all", label: "All states", test: () => true },
  { id: "none", label: "No state tax", test: (s: (typeof US_STATES)[number]) => s.state === 0 },
  { id: "high", label: "9%+ average", test: (s: (typeof US_STATES)[number]) => s.combined >= 9 },
] as const;

const pct = (n: number) => `${n}%`;
const MAX_COMBINED = Math.max(...US_STATES.map((s) => s.combined));
const usd = (n: number) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

function SectionHead({ id, kicker, title, children }: { id?: string; kicker: string; title: string; children?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lp-brand">{kicker}</p>
      <h2 id={id} className="mt-2 text-[26px] font-semibold tracking-[-0.045em] text-lp-ink sm:text-[30px]">{title}</h2>
      {children ? <p className="mt-2 max-w-180 text-[15px] leading-[1.6] text-lp-body">{children}</p> : null}
    </div>
  );
}

function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-lp-line bg-lp-card", className)}>{children}</div>;
}

/** Links straight to the authority that publishes each figure, so a reader can check it at the source. */
function Sources({ links, className }: { links: TaxSource[]; className?: string }) {
  return (
    <p className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] leading-normal text-lp-muted", className)}>
      <span className="font-semibold text-lp-body">Official source{links.length > 1 ? "s" : ""}:</span>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-lp-body underline decoration-lp-line underline-offset-3 transition hover:text-lp-brand hover:decoration-lp-brand/60"
        >
          {l.label}
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
        </a>
      ))}
    </p>
  );
}

export function UsTaxDetail() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const test = FILTERS.find((f) => f.id === filter)!.test;
  const rows = US_STATES.filter((s) => test(s) && (!q || s.name.toLowerCase().includes(q) || s.code.toLowerCase() === q));

  return (
    <section id="united-states" aria-labelledby="us-title" className="scroll-mt-20 border-t border-lp-line pt-16">
      <SectionHead id="us-title" kicker="United States in depth" title="Federal and state taxes">
        The United States has no national VAT. Federal taxes are set by the IRS, and each state sets its own sales tax
        &mdash; so a US business files with both. State rates and population-weighted average combined rates below are as
        of January 1, 2026, cross-checked against the Sales Tax Institute&rsquo;s November 1, 2026 reference.
      </SectionHead>

      {/* state table */}
      <h3 className="mt-12 text-[20px] font-semibold tracking-[-0.035em] text-lp-ink">State sales tax &mdash; all 50 states</h3>
      <Card className="mt-5 overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-lp-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Filter states" className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-full border px-3.5 py-1.25 text-[13px] font-medium transition",
                  filter === f.id ? "border-lp-brand bg-lp-brand text-lp-on-brand" : "border-lp-line text-lp-body hover:text-lp-ink",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-full border border-lp-line bg-lp-canvas px-3.5 py-1.5 sm:w-56">
            <Search className="h-3.5 w-3.5 shrink-0 text-lp-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a state…"
              aria-label="Find a state"
              className="w-full bg-transparent text-[14px] text-lp-ink outline-none placeholder:text-lp-muted"
            />
            {query ? (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear" className="text-lp-muted hover:text-lp-ink">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </label>
        </div>
        <div className="max-h-130 overflow-y-auto">
          <table className="w-full text-left text-[14px]">
            <thead className="sticky top-0 z-10 bg-lp-alt text-[11px] font-semibold uppercase tracking-[0.12em] text-lp-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5">State</th>
                <th scope="col" className="px-4 py-2.5 text-right">State rate</th>
                <th scope="col" className="px-4 py-2.5 text-right sm:w-[42%]">Avg. combined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lp-line">
              {rows.map((s) => (
                <tr key={s.code} className="align-top transition hover:bg-lp-alt/60">
                  <td className="px-4 py-2.5">
                    <span className="font-medium text-lp-ink">{s.name}</span> <span className="text-[12px] text-lp-muted">({s.code})</span>
                    {s.note ? <p className="mt-0.5 text-[12px] leading-snug text-lp-muted">{s.note}</p> : null}
                  </td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", s.state === 0 ? "text-lp-muted" : "text-lp-ink")}>{pct(s.state)}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-3">
                      <span className="hidden h-1.5 flex-1 overflow-hidden rounded-full bg-lp-line sm:block" aria-hidden>
                        <span className="block h-full rounded-full bg-lp-brand" style={{ width: `${(s.combined / MAX_COMBINED) * 100}%` }} />
                      </span>
                      <span className="w-14 text-right font-semibold tabular-nums text-lp-ink">{s.combined.toFixed(2)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-lp-muted">
                    No state matches &ldquo;{query.trim()}&rdquo;.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <p className="border-t border-lp-line px-4 py-2.5 text-[12.5px] text-lp-muted">
          Showing {rows.length} of {US_STATES.length} jurisdictions, including Washington, D.C. Combined figures are averages, not
          the rate to charge on an individual invoice.
        </p>
      </Card>
      <p className="mt-3 text-[12.5px] leading-normal text-lp-muted">
        <strong className="font-semibold text-lp-body">Important exceptions:</strong> Alaska has no statewide sales tax but allows
        local sales taxes. Hawaii uses a general excise tax, and New Mexico a gross receipts tax, rather than a conventional retail
        sales tax. California&rsquo;s 7.25% minimum includes a mandatory statewide county component.
      </p>
      <Sources links={US_STATE_SOURCES} className="mt-3" />

      {/* federal */}
      <h3 className="mt-14 text-[20px] font-semibold tracking-[-0.035em] text-lp-ink">Federal tax rates — 2026</h3>
      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr] lg:items-start">
        {[
          { label: "Federal sales tax", ...US_FEDERAL.salesTax },
          { label: "Federal corporate income tax", ...US_FEDERAL.corporate },
        ].map((f) => (
          <Card key={f.label} className="p-5">
            <p className="text-[13px] font-medium text-lp-muted">{f.label}</p>
            <p className="mt-2 font-display text-[44px] font-semibold leading-none tracking-[-0.05em] text-lp-brand">{f.rate}</p>
            <p className="mt-3 text-[14px] text-lp-body">{f.note}</p>
          </Card>
        ))}
        <Card className="overflow-hidden">
          <p className="px-5 pt-4 text-[13px] font-medium text-lp-muted">Individual income tax brackets — single filers</p>
          <table className="mt-2 w-full text-[14px]">
            <tbody className="divide-y divide-lp-line">
              {US_BRACKETS_SINGLE.map((b) => (
                <tr key={b.rate}>
                  <td className="w-16 px-5 py-1.75 font-semibold tabular-nums text-lp-ink">{b.rate}</td>
                  <td className="px-5 py-1.75 tabular-nums text-lp-body">{b.income}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t border-lp-line px-5 py-2.5 text-[12px] leading-snug text-lp-muted">
            Marginal rates; thresholds depend on filing status. These are not added to sales invoices. Federal excise taxes may
            apply separately to certain products and activities.
          </p>
        </Card>
      </div>
      <Sources links={US_FEDERAL_SOURCES} className="mt-3" />

      <div className="mt-14 grid gap-6 lg:grid-cols-[400px_1fr] lg:items-start">
        <SalesTaxCalculator />
        <div>
          <h3 className="text-[20px] font-semibold tracking-[-0.035em] text-lp-ink">How {BRAND.fullName} calculates US sales tax</h3>
          <p className="mt-2 text-[15px] leading-[1.6] text-lp-body">
            A tax engine that identifies the exact jurisdiction of each transaction and applies the rules that hold there.
          </p>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {US_ENGINE_FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <li key={f.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lp-brand/10 text-lp-brand">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block text-[14.5px] font-semibold tracking-[-0.02em] text-lp-ink">{f.title}</span>
                    <span className="mt-0.5 block text-[13.5px] leading-normal text-lp-body">{f.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-8 flex gap-3 rounded-2xl border border-lp-brand/30 bg-lp-brand/6 p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-lp-brand" />
        <p className="text-[14px] leading-normal text-lp-body">
          <strong className="font-semibold text-lp-ink">{BRAND.fullName} never assumes the state average is the right rate.</strong> The
          tax on a sale depends on its jurisdiction, date, the product or service, and any exemptions. Rates come from official state
          revenue data and a regularly updated address-level rate service, with the Sales Tax Institute&rsquo;s reference as the
          starting point.
        </p>
      </div>
    </section>
  );
}

function SalesTaxCalculator() {
  const [amount, setAmount] = useState("1000");
  const [rate, setRate] = useState("8.25");
  const base = Math.max(0, Number(amount) || 0);
  const tax = Math.round(base * (Math.max(0, Number(rate) || 0) / 100) * 100) / 100;
  const field = "mt-1 w-full rounded-xl border border-lp-line bg-lp-canvas px-3.5 py-2 text-[15px] tabular-nums text-lp-ink outline-none focus:border-lp-brand/60 focus:ring-2 focus:ring-lp-brand/20";

  return (
    <Card className="p-5">
      <p className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">
        <Calculator className="h-4 w-4 text-lp-brand" /> Illustrative sales tax calculation
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <label className="text-[12.5px] font-medium text-lp-muted">
          Taxable sale (USD)
          <input type="number" min={0} step="0.01" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={field} />
        </label>
        <label className="text-[12.5px] font-medium text-lp-muted">
          Combined tax rate (%)
          <input type="number" min={0} max={20} step="0.001" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} className={field} />
        </label>
      </div>
      <dl className="mt-4 space-y-2 border-t border-lp-line pt-4 text-[14px]">
        <div className="flex justify-between">
          <dt className="text-lp-body">Taxable amount</dt>
          <dd className="tabular-nums text-lp-ink">{usd(base)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-lp-body">Sales tax</dt>
          <dd className="tabular-nums text-lp-ink">{usd(tax)}</dd>
        </div>
        <div className="flex justify-between border-t border-lp-line pt-2 text-[16px] font-semibold">
          <dt className="text-lp-ink">Invoice total</dt>
          <dd className="tabular-nums text-lp-brand">{usd(base + tax)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[12px] leading-snug text-lp-muted">
        Illustrative only. Enter the combined rate for the customer&rsquo;s transaction location.
      </p>
    </Card>
  );
}

export function EuVatTable() {
  return (
    <section id="eu-vat" aria-labelledby="eu-title" className="scroll-mt-20 border-t border-lp-line pt-16">
      <SectionHead id="eu-title" kicker="European Union in depth" title="VAT rates in all 27 EU countries">
        Every member state has a standard rate and most have several reduced rates. Standard and principal reduced rates as of
        November 2026.
      </SectionHead>
      <Card className="mt-7 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-120 text-left text-[14px]">
            <thead className="bg-lp-alt text-[11px] font-semibold uppercase tracking-[0.12em] text-lp-muted">
              <tr>
                <th scope="col" className="px-4 py-2.5">Country</th>
                <th scope="col" className="px-4 py-2.5">Code</th>
                <th scope="col" className="px-4 py-2.5 text-right">Standard VAT</th>
                <th scope="col" className="px-4 py-2.5">Reduced VAT rates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-lp-line">
              {EU_VAT.map((e) => (
                <tr key={e.code} className="transition hover:bg-lp-alt/60">
                  <td className="px-4 py-2.5">
                    <span aria-hidden className="mr-2">
                      {e.flag}
                    </span>
                    <span className="font-medium text-lp-ink">{e.country}</span>
                  </td>
                  <td className="px-4 py-2.5 text-[12px] font-semibold tracking-wide text-lp-muted">{e.code}</td>
                  <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-lp-brand">{e.standard}</td>
                  <td className={cn("px-4 py-2.5 tabular-nums", e.reduced.startsWith("No") ? "text-lp-muted" : "text-lp-body")}>{e.reduced}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-lp-line px-4 py-2.5 text-[12.5px] text-lp-muted">
          *Greece&rsquo;s 17% applies on certain Aegean islands. Reduced rates cover specific goods and services; super-reduced
          and zero rates may also apply.
        </p>
      </Card>
      <Sources links={EU_VAT_SOURCES} className="mt-3" />
    </section>
  );
}
