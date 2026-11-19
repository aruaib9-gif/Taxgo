import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { COVERAGE_CLAIM, TAX_REGIONS } from "@/lib/tax-rates";
import { Container, H2, Kicker, LandingFooter, LandingHeader, Serif, btnPrimary } from "@/components/landing/chrome";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { TaxExplorer } from "@/components/landing/tax-explorer";
import { BackToTop } from "@/components/landing/back-to-top";
import { EuVatTable, UsTaxDetail } from "@/components/landing/tax-detail";

const AI = BRAND.fullName;

export const metadata = {
  title: `Global tax coverage — ${BRAND.fullName}`,
  description: `VAT, GST and sales tax rules for over 100 countries across ${TAX_REGIONS.length} continents, built into ${BRAND.fullName}.`,
};

export default function CompliancePage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-[var(--lp-map)] lg:block" />
        <Container className="relative pb-20 pt-16">
          <div className="relative z-10 text-center">
            <Kicker>Global tax coverage</Kicker>
            <H2>
              Local rules, built in. <Serif className="text-[32px] sm:text-[40px]">Wherever you trade.</Serif>
            </H2>
            <p className="mx-auto mt-4 max-w-160 text-[16px] leading-[1.6] text-lp-body">
              {AI} covers the VAT, GST and sales tax rules of {COVERAGE_CLAIM} countries across {TAX_REGIONS.length} continents — so
              invoices, returns and reports are right for every market you sell in. Below are the standard rates for the major
              markets.
            </p>
          </div>
          <Suspense>
            <TaxExplorer />
          </Suspense>
          <p className="mt-10 text-[12.5px] leading-normal text-lp-muted">
            Standard rates shown for reference. Rates and rules change; reduced rates, exemptions and local taxes may apply.
            {` ${AI}`} applies the current rules for each country you operate in.
          </p>
        </Container>
      </section>

      <Container className="space-y-20 pb-24">
        <UsTaxDetail />
        <EuVatTable />
      </Container>

      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <h2 className="mt-10 text-[34px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[42px]">
              One platform. Multiple countries.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">Smarter compliance.</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Start with {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a
                href={BRAND.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full border border-white/40 px-6.5 py-1.75 text-[15px] font-medium text-white transition hover:bg-white/5"
              >
                Ask about your country <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </Container>
        </section>
        <LandingFooter />
      </div>

      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}
