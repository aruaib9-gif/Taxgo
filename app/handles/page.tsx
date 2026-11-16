import Link from "next/link";
import { ArrowRight, FileText, Landmark, ShieldCheck, type LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { MODULES } from "@/lib/modules";
import {
  Container,
  H2,
  Kicker,
  LandingFooter,
  LandingHeader,
  Panel,
  Serif,
  btnOutline,
  btnPrimary,
} from "@/components/landing/chrome";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { ModuleTable } from "@/components/landing/module-table";
import { BackToTop } from "@/components/landing/back-to-top";

const AI = BRAND.fullName;

export const metadata = {
  title: `What ${BRAND.fullName} handles`, // the root layout appends "· Tax GO"
  description: `One login, ${MODULES.length} module groups, one shared ledger. What ${BRAND.fullName} handles across accounting, operations and growth — with a real-world example for every module.`,
};

/** How she works — the three steps, in the order a day actually runs. */
const steps: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: FileText,
    title: "She understands your business",
    text: `${AI} collects information from your invoices, receipts, customers, bank feeds and operational records.`,
  },
  {
    icon: Landmark,
    title: "She automates the work",
    text: "She processes transactions, prepares reconciliations, monitors inventory and manages routine workflows based on your settings.",
  },
  {
    icon: ShieldCheck,
    title: "She brings you the decisions",
    text: `${AI} highlights financial risks, unusual transactions, cash-flow concerns and opportunities requiring your judgement.`,
  },
];

export default function HandlesPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading + module table */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-[var(--lp-map)] lg:block" />
        <Container className="relative pb-20 pt-16">
          <div className="relative z-10 text-center">
            <Kicker>Her task</Kicker>
            <H2>
              One login. {MODULES.length} powerful modules.{" "}
              <Serif className="text-[32px] sm:text-[40px]">Complete business control.</Serif>
            </H2>
            <p className="mx-auto mt-4 max-w-170 text-[16px] leading-[1.6] text-lp-body">
              {AI} connects every department through one intelligent platform, eliminating disconnected systems, repetitive
              tasks and unnecessary administrative costs.
            </p>
          </div>

          <div className="relative z-10 mt-12">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">
                The {MODULES.length} module groups
              </h3>
              <p className="text-[13px] text-lp-muted">
                Click a module for its features, an everyday example and the time it saves.
              </p>
            </div>
            <ModuleTable />
            <p className="mt-4 text-[12.5px] leading-normal text-lp-muted">
              Examples describe intended workflows; actual automation depends on the integrations and features enabled.
            </p>
          </div>
        </Container>
      </section>

      {/* how she works */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-20">
          <div className="text-center">
            <Kicker>How she works</Kicker>
            <H2>You speak plainly. She does the rest.</H2>
          </div>
          <Panel className="mt-10 grid divide-y divide-lp-line md:grid-cols-3 md:divide-x md:divide-y-0">
            {steps.map((s, i) => (
              <div key={s.title} className="px-5.75 pb-8 pt-7">
                <div className="flex items-start justify-between">
                  <s.icon className="h-4 w-4 text-lp-brand" strokeWidth={1.75} />
                  <span className="font-serif text-[26px] italic leading-none text-lp-muted/50">{i + 1}</span>
                </div>
                <h3 className="mt-7 text-[17px] font-semibold tracking-[-0.035em] text-lp-ink">{s.title}</h3>
                <p className="mt-3 text-[14px] leading-[1.65] text-lp-body">{s.text}</p>
              </div>
            ))}
          </Panel>
          <p className="mx-auto mt-12 max-w-3xl text-center text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
            {AI} — One Intelligent Platform. {MODULES.length} Integrated Modules.{" "}
            <span className="text-lp-brand">Your Entire Business Working Together.</span>
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-2.5">
            <Link href="/register" className={btnPrimary}>
              Hire {AI} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link href="/pricing" className={btnOutline}>
              See pricing in your country <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Container>
      </section>

      {/* final CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <p className="mx-auto mt-9 max-w-2xl font-serif text-[22px] italic leading-[1.4] text-lp-sky sm:text-[26px]">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <h2 className="mt-7 text-[34px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[42px]">
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
          </Container>
        </section>
        <LandingFooter />
      </div>

      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}
