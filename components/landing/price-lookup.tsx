"use client";

// Landing-page pricing card: the featured countries and a country search, both opening the pricing page
// on that country. Prices themselves are shown only on the pricing page.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { COUNTRY_PRICES, FEATURED_PRICES } from "@/lib/pricing";

export function PriceLookup() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/pricing?country=${encodeURIComponent(q)}#explore` : "/pricing#explore");
  }

  return (
    <div>
      <p className="text-[13px] font-medium text-lp-ink">Popular countries</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {FEATURED_PRICES.map((p) => (
          <li key={p.code}>
            <Link
              href={`/pricing?country=${encodeURIComponent(p.country)}#explore`}
              title={`${p.country} pricing`}
              className="inline-flex items-center gap-2 rounded-full border border-lp-line bg-lp-canvas py-1.5 pl-2.5 pr-3.5 text-[14px] text-lp-ink transition hover:border-lp-brand/50 hover:bg-lp-brand/6"
            >
              <span aria-hidden className="text-[16px] leading-none">
                {p.flag}
              </span>
              {p.country}
            </Link>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="mt-5 border-t border-lp-line pt-5">
        <label htmlFor="price-country" className="text-[13px] font-medium text-lp-ink">
          Not listed? Find your country&rsquo;s price
        </label>
        <div className="mt-2 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lp-muted" />
            <input
              id="price-country"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Kenya, Ireland, Japan…"
              className="h-11 w-full rounded-full border border-lp-line bg-lp-card pl-10 pr-4 text-[15px] text-lp-ink outline-none placeholder:text-lp-muted/70 focus:border-lp-brand/60 focus:ring-2 focus:ring-lp-brand/20"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-lp-ink/25 bg-lp-card px-4 text-[14px] font-medium text-lp-ink transition hover:bg-lp-alt"
          >
            See price <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-2.5 text-[12px] text-lp-muted">
          {COUNTRY_PRICES.length} countries, priced in local currency.{" "}
          <Link href="/pricing" className="font-medium text-lp-brand hover:underline">
            See all countries
          </Link>
        </p>
      </form>
    </div>
  );
}
