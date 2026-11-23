import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, Check, Globe2, Sparkles } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  Container,
  H2,
  Kicker,
  LandingFooter,
  LandingHeader,
  Serif,
  btnOutline,
  btnPrimary,
} from "@/components/landing/chrome";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { BackToTop } from "@/components/landing/back-to-top";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: "Partners", // the root layout appends "· Tax GO"
  description: `The organisations behind ${AI} — the AI research labs whose models power her, and the trade, enterprise and innovation agencies supporting the business.`,
};

type Partner = {
  name: string;
  /** The logo file, where we hold an official one. Without it the name is set as type. */
  logo?: string;
  /** Natural width ÷ height, so every mark keeps its proportions in a fixed-height box. */
  ratio?: number;
  /** The monogram to use on the card where there is no logo file. */
  mark?: string;
  role: string;
  text: string;
  href?: string;
};

/** The AI research labs whose models she is built on. */
const technology: Partner[] = [
  {
    name: "Claude",
    logo: "/partners/claude.svg",
    ratio: 1,
    role: "AI research · Anthropic",
    text: `Claude's reasoning is what lets ${AI} read a document, follow an instruction in plain language and explain the work she has prepared.`,
    href: "https://www.anthropic.com/",
  },
  {
    name: "OpenAI",
    logo: "/partners/openai.svg",
    ratio: 1,
    role: "AI research",
    text: "Frontier language and vision models, behind the extraction, classification and drafting that runs underneath the modules.",
    href: "https://openai.com/",
  },
];

/** The trade, enterprise and innovation bodies behind the business. */
const institutional: Partner[] = [
  {
    name: "Enterprise Ireland",
    logo: "/partners/enterprise-ireland.png",
    ratio: 615 / 173,
    role: "Ireland · Enterprise development",
    text: "Ireland's state agency for growing businesses in world markets, supporting scaling, innovation and export development.",
    href: "https://www.enterprise-ireland.com/",
  },
  {
    name: "Chartered Accountants Ireland",
    logo: "/partners/chartered-accountants-ireland.svg",
    ratio: 338 / 199,
    role: "Ireland · Professional body",
    text: "The institute for chartered accountants on the island of Ireland, setting the professional standards the practices she works alongside are held to.",
    href: "https://www.charteredaccountants.ie/",
  },
  {
    name: "EDC Canada",
    logo: "/partners/edc.svg",
    ratio: 78 / 28,
    role: "Canada · Export credit",
    text: "Export Development Canada, the export credit agency supporting Canadian companies trading and investing abroad.",
    href: "https://www.edc.ca/",
  },
  {
    name: "World Trade Centre Toronto",
    logo: "/partners/wtc-toronto.png",
    ratio: 1042 / 301,
    role: "Canada · Trade acceleration",
    text: "The trade services arm of the Toronto Region Board of Trade, connecting businesses to international markets and buyers.",
    href: "https://bot.com/About/World-Trade-Centre",
  },
  {
    name: "Ministry of Economic Development, Job Creation & Trade",
    mark: "ON",
    role: "Ontario, Canada · Government",
    text: "The Ontario ministry responsible for economic development, investment attraction, job creation and trade.",
    href: "https://www.ontario.ca/page/ministry-economic-development-job-creation-trade",
  },
  {
    name: "Communitech",
    logo: "/partners/communitech.svg",
    ratio: 600 / 103.98,
    role: "Canada · Innovation hub",
    text: "The Waterloo Region innovation hub helping technology companies start, grow and scale.",
    href: "https://communitech.ca/",
  },
  {
    name: "TFO Canada",
    logo: "/partners/tfo-canada.png",
    ratio: 1536 / 1192,
    role: "Canada · Trade facilitation",
    text: "Trade Facilitation Office Canada, connecting exporters in developing countries with Canadian buyers and markets.",
    href: "https://www.tfocanada.ca/",
  },
];

/** What a partnership is actually for. */
const value: [string, string][] = [
  ["Markets", "Access to buyers, trade networks and export programmes across Canada, Ireland and beyond."],
  ["Technology", "Frontier AI models, kept current as the research moves, behind every module she runs."],
  ["Support", "Enterprise, innovation and trade agencies backing the growth of the business itself."],
];

/** What a commercial partner gets. */
const programme: string[] = [
  "Implementation and reseller partnerships",
  "Accounting and advisory practice programmes",
  "Referral arrangements for existing client bases",
  "Integration and technology partnerships",
  "Regional distribution in new markets",
  "Training, enablement and shared go-to-market",
];

export default function PartnersPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-(--lp-map) lg:block" />
        <Container className="relative py-20 text-center">
          <div className="relative z-10">
            <Kicker>Partners</Kicker>
            <H2 className="mx-auto mt-4 max-w-4xl">
              She is built on the best models. <Serif className="text-[32px] sm:text-[40px]">Backed by serious institutions.</Serif>
            </H2>
            <p className="mx-auto mt-5 max-w-170 text-[16px] leading-[1.65] text-lp-body">
              {AI} brings together frontier AI research and the trade, enterprise and innovation agencies that help
              businesses grow across borders.
            </p>
          </div>
        </Container>
      </section>

      {/* the logo wall */}
      <section className="border-y border-lp-line bg-lp-navy">
        <Container className="py-14">
          <p className="text-center text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
            Working with
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[...technology, ...institutional].map((p) => (
              <li key={p.name}>
                <LogoTile partner={p} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* why it matters */}
      <section>
        <Container className="py-16">
          <div className="grid gap-3 sm:grid-cols-3">
            {value.map(([title, text], i) => (
              <div key={title} className="rounded-2xl border border-lp-line bg-lp-card px-5 py-5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-lp-brand/10 text-lp-brand">
                  {[<Globe2 key="g" className="h-4.5 w-4.5" />, <Sparkles key="s" className="h-4.5 w-4.5" />, <Building2 key="b" className="h-4.5 w-4.5" />][i]}
                </span>
                <h3 className="mt-4 text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">{title}</h3>
                <p className="mt-2 text-[14px] leading-[1.6] text-lp-body">{text}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* technology partners */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Technology partners</Kicker>
          <H2>The models behind her.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Every module in {AI} rests on frontier language models. We follow the research rather than freeze on one
            release, so what she can read, draft and reason about improves as the models do.
          </p>
          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {technology.map((p) => (
              <PartnerCard key={p.name} partner={p} />
            ))}
          </div>
        </Container>
      </section>

      {/* institutional partners */}
      <section>
        <Container className="py-16">
          <Kicker>Trade, enterprise &amp; innovation</Kicker>
          <H2>The institutions behind the business.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Export agencies, government departments and innovation hubs across Ireland and Canada, supporting how the
            business grows and where it trades.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {institutional.map((p) => (
              <PartnerCard key={p.name} partner={p} />
            ))}
          </div>
        </Container>
      </section>

      {/* become a partner */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center">
            <div>
              <Kicker>Partner with us</Kicker>
              <H2>Bring {AI} to the businesses you serve.</H2>
              <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-lp-body">
                Accounting practices, implementation partners, resellers and technology providers — if you work with
                businesses that still run their back office by hand, there is a partnership here.
              </p>
              <div className="mt-7 flex flex-wrap gap-2.5">
                <a href={`mailto:${BRAND.contact.email}`} className={btnPrimary}>
                  Talk to us <ArrowRight className="h-3.5 w-3.5" />
                </a>
                <Link href="/handles" className={btnOutline}>
                  See what she handles <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            <ul className="grid gap-2">
              {programme.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl border border-lp-line bg-lp-card px-4 py-3 text-[14px] leading-[1.5] text-lp-body"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-ai-done" strokeWidth={2.5} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-10 text-[12.5px] leading-[1.6] text-lp-muted">
            All names and logos on this page are the property of their respective owners and are shown to identify
            those organisations. Their appearance does not imply any endorsement of {AI} beyond the relationship each
            organisation has agreed to.
          </p>
        </Container>
      </section>

      {/* final CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <h2 className="mt-9 text-[34px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[42px]">
              Stop running the back office.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">Tell {AI}.</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Hire {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/handles" className={cn(btnOutline, "border-white/40 bg-transparent text-white hover:bg-white/5")}>
                Her task &amp; our products <ArrowRight className="h-3.5 w-3.5" />
              </Link>
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

/* ---------- this page's own pieces ---------- */

/** One mark on the dark wall, sized to a common height so the row reads evenly. */
function LogoTile({ partner }: { partner: Partner }) {
  // a near-square mark is capped by height, so give it more of it than a wide wordmark
  const tall = (partner.ratio ?? 1) < 2.2;
  const inner = partner.logo ? (
    <span className={cn("relative block w-full", tall ? "h-14" : "h-11")}>
      <Image
        src={partner.logo}
        alt={`${partner.name} logo`}
        fill
        sizes="(min-width: 1024px) 18vw, (min-width: 640px) 28vw, 42vw"
        className="object-contain"
      />
    </span>
  ) : (
    <span className="flex h-11 items-center justify-center text-center text-[13px] font-semibold leading-[1.25] tracking-[-0.01em] text-white/80">
      {partner.name}
    </span>
  );

  const box =
    "flex h-24 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 transition-colors hover:border-white/25 hover:bg-white/8";

  return partner.href ? (
    <a href={partner.href} target="_blank" rel="noopener noreferrer" className={box}>
      {inner}
    </a>
  ) : (
    <span className={box}>{inner}</span>
  );
}

/** One partner, with what they are and what the relationship is. */
function PartnerCard({ partner }: { partner: Partner }) {
  const body = (
    <>
      {/* the marks are drawn for a dark ground, so each card carries its own */}
      <span className="flex h-12 items-center justify-center self-start rounded-xl bg-lp-navy px-3.5">
        {partner.logo ? (
          <span className="relative block h-6" style={{ width: `${1.5 * (partner.ratio ?? 1)}rem` }}>
            <Image src={partner.logo} alt={`${partner.name} logo`} fill sizes="200px" className="object-contain" />
          </span>
        ) : (
          <span className="text-[13px] font-semibold tracking-[0.04em] text-white/85">{partner.mark ?? initials(partner.name)}</span>
        )}
      </span>
      <h3 className="mt-4 text-[16px] font-semibold leading-[1.3] tracking-[-0.03em] text-lp-ink">{partner.name}</h3>
      <p className="mt-0.5 text-[12px] uppercase tracking-[0.1em] text-lp-brand">{partner.role}</p>
      <p className="mt-2.5 text-[14px] leading-[1.6] text-lp-body">{partner.text}</p>
      {partner.href && (
        <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-lp-muted transition-colors group-hover:text-lp-brand">
          Visit <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );

  const box =
    "group flex h-full flex-col rounded-2xl border border-lp-line bg-lp-card px-5 py-5 transition-colors hover:border-lp-brand/30";

  return partner.href ? (
    <a href={partner.href} target="_blank" rel="noopener noreferrer" className={box}>
      {body}
    </a>
  ) : (
    <div className={box}>{body}</div>
  );
}

function initials(name: string) {
  return name
    .replace(/[^A-Za-z ]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
