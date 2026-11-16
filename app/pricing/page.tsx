import Link from "next/link";
import { ArrowRight, Check, Plus } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { COUNTRY_PRICES } from "@/lib/pricing";
import {
  Container,
  H2,
  Kicker,
  LandingFooter,
  LandingHeader,
  Serif,
  btnPrimary,
} from "@/components/landing/chrome";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { Suspense } from "react";
import { PricingExplorer } from "@/components/landing/pricing-explorer";
import { BackToTop } from "@/components/landing/back-to-top";

const AI = BRAND.fullName;

export const metadata = {
  title: `Pricing — ${BRAND.fullName}`,
  description: `Five packages, priced in your own currency across ${COUNTRY_PRICES.length} countries. Unlimited users, billed monthly or annually.`,
};

const guarantees = [
  "Free to start — no credit card",
  "Free migration",
  "No lock-in — your data leaves with you",
  "Founding price, locked forever",
  "The 30–50% math shown on your numbers before you sign",
];

const faqs: [string, string][] = [
  [
    "Is the price per user?",
    "No. It's one price per company, and every user is free — your team, your accountant and your auditor included. Add people as you grow and nothing changes.",
  ],
  [
    "What's the difference between the packages?",
    "The Complete Package is the whole system — all 15 module groups. The others carve out one part of it: Accounting Only is the books, bank and filings at half the price; HR & Payroll, Retail and CRM are a sixth each. You can move up to Complete at any time.",
  ],
  [
    "Can I pay monthly instead of annually?",
    "Yes. Both are shown above for every package and country. Annual is the cheaper of the two and is locked for as long as you stay.",
  ],
  [
    "Which currency am I charged in?",
    "The local currency shown for your country. No conversion fees, no surprise FX on the invoice.",
  ],
  [
    "My country isn't on the list. Can I still sign up?",
    `Yes — talk to us and we'll price your country. ${AI} already runs in ${COUNTRY_PRICES.length} of them, and the product is the same everywhere.`,
  ],
  [
    "What happens after the free start?",
    "You'll have run real invoices and a real month-end before you pay anything. If the 30–50% saving isn't there on your own numbers, you don't pay.",
  ],
];

export default function PricingPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading + explorer */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        {/* bare map, centred behind the heading — the T tile would land on the headline */}
        <Watermark
          showTile={false}
          className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-[var(--lp-map)] lg:block"
        />
        <Container className="relative pb-24 pt-16">
          <div className="relative z-10 text-center">
            <Kicker>Pricing</Kicker>
            <H2>
              Five packages. <Serif className="text-[32px] sm:text-[40px]">Your currency.</Serif>
            </H2>
            <p className="mx-auto mt-4 max-w-160 text-[16px] leading-[1.6] text-lp-body">
              Pick a package and your country, and see exactly what {AI} costs there — per company, unlimited users,
              billed monthly or annually. {COUNTRY_PRICES.length} countries, priced locally.
            </p>
          </div>
          <Suspense>
            <PricingExplorer />
          </Suspense>
          <ul className="mx-auto mt-10 flex max-w-225 flex-wrap justify-center gap-x-5 gap-y-3 text-[14px] text-lp-body">
            {guarantees.map((g) => (
              <li key={g} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-lp-brand" strokeWidth={2} /> {g}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* comparison line */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-14 text-center">
          <p className="mx-auto max-w-160 text-[17px] leading-[1.6] text-lp-body">
            A junior back-office hire costs 4–10× this. Works 8 hours. Takes leave. Eventually resigns.{" "}
            <Serif className="text-[18px] font-medium">{AI} doesn&rsquo;t.</Serif>
          </p>
        </Container>
      </section>

      {/* faq */}
      <section>
        <Container className="max-w-191.5 pb-20 pt-20">
          <Kicker>Pricing questions</Kicker>
          <H2>Asked, answered.</H2>
          <div className="mt-8">
            {faqs.map(([q, a]) => (
              <details key={q} className="group border-b border-lp-line last:border-b-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4.5 text-[16px] font-semibold tracking-[-0.03em] text-lp-ink [&::-webkit-details-marker]:hidden">
                  {q}
                  <Plus className="h-3 w-3 shrink-0 text-lp-muted transition-transform group-open:rotate-45" strokeWidth={2.5} />
                </summary>
                <p className="-mt-1 pb-5 pr-10 text-[14px] leading-[1.7] text-lp-muted">{a}</p>
              </details>
            ))}
          </div>
          <p className="mt-10 text-center text-[14px] text-lp-muted">
            Want the whole story first?{" "}
            <Link href="/" className="font-medium text-lp-brand hover:underline">
              See what she handles
            </Link>
            .
          </p>
        </Container>
      </section>

      {/* final CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <h2 className="mt-10 text-[34px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[42px]">
              Stop running the back office.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">Tell {AI}.</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Hire {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/40 px-6.5 py-1.75 text-[15px] font-medium text-white transition hover:bg-white/5"
              >
                Talk to a person <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            <p className="mt-7 text-[14px] text-white/55">Month-end is coming either way.</p>
          </Container>
        </section>
        <LandingFooter />
      </div>

      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}
