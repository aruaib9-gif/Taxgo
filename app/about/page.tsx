import Link from "next/link";
import { ArrowRight, Globe, Mail, MapPin, Phone, Quote, Target, Telescope, type LucideIcon } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { Container, H2, Kicker, LandingFooter, LandingHeader, Panel, Serif, btnOutline, btnPrimary } from "@/components/landing/chrome";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { BackToTop } from "@/components/landing/back-to-top";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: `About us — ${BRAND.fullName}`,
  description: `From a shoebox of receipts in Dublin in 2015 to a Canadian headquarters and AI-powered business automation: the story of ${BRAND.fullName}.`,
};

type Milestone = {
  year: string;
  flag: string;
  place: string;
  title: string;
  body: string[];
  products?: string[];
  pull?: string;
};

const milestones: Milestone[] = [
  {
    year: "2015",
    flag: "🇮🇪",
    place: "Dublin, Ireland",
    title: "Where the journey began",
    body: [
      "Synergy ieaccounts Ltd was established in Dublin, Ireland, with a simple mission: to make accounting and taxation easier, faster, and more accessible.",
      "The first innovation was the Ireland Tax Calculator, designed to simplify income tax calculations and help individuals and businesses understand their tax obligations. Encouraged by growing interest, the company expanded its tax technology solutions, developing the British Tax Calculator and American Tax Calculator.",
      "What began as a solution to everyday accounting frustrations was gradually becoming an international technology business.",
    ],
    products: ["Ireland Tax Calculator", "British Tax Calculator", "American Tax Calculator"],
  },
  {
    year: "2017",
    flag: "🇮🇪",
    place: "Dublin, Ireland",
    title: `The birth of ${AI}`,
    body: [
      "The next challenge was much bigger than calculating taxes. Businesses needed a better way to manage their entire accounting process, from recording transactions to producing financial reports.",
      `In 2017, ${AI} accounting software was developed to simplify bookkeeping, invoicing, financial reporting, and business administration. ${AI} was designed to reduce repetitive processes, improve accuracy, and give business owners greater control over their financial information.`,
    ],
    products: [`${AI} accounting software`],
    pull: "Accounting software should do more of the work, not simply provide another place for accountants to enter information.",
  },
  {
    year: "2018",
    flag: "🇮🇪",
    place: "Dublin, Ireland",
    title: "From accounting to global business solutions",
    body: [
      "As the company's products and ambitions expanded, Synergy ieaccounts Ltd evolved into Taxgoglobal Limited, reflecting its growing international focus.",
      "That same year, the company introduced Retail Xpress, a retail management solution designed to simplify sales, inventory, and customer transactions. It challenged traditional retail operations by introducing flexible technology that reduced dependence on conventional point-of-sale hardware.",
      "The goal was no longer just to simplify accounting. It was to connect everyday business operations with financial management.",
    ],
    products: ["Taxgoglobal Limited", "Retail Xpress"],
  },
  {
    year: "2019",
    flag: "🇮🇪",
    place: "Dublin, Ireland",
    title: "Connecting logistics with business management",
    body: [
      "The company expanded into logistics technology with Parcel-King, a last-mile delivery management platform developed to help businesses manage deliveries, drivers, vehicles, routes, and logistics operations more efficiently.",
      "By connecting logistics, retail, and accounting, the company continued building towards a single integrated business management ecosystem.",
    ],
    products: ["Parcel-King"],
  },
  {
    year: "2024",
    flag: "🇨🇦",
    place: "Ontario, Canada",
    title: "A new chapter: relocating from Ireland to Canada",
    body: [
      "After nearly a decade of innovation and business development in Ireland, Taxgoglobal relocated its head office from Dublin to Canada, marking a significant milestone in the company's international journey.",
      "The relocation was more than a change of address. It was a strategic step towards expanding the company's presence in North America, reaching new markets, and strengthening its position as a global business technology provider — with a renewed focus on innovation, intelligent automation, and technology for businesses worldwide.",
    ],
    pull: "Ireland is where our journey began. Canada is where we are building the next chapter of our global future.",
  },
  {
    year: "Today",
    flag: "🌍",
    place: "Worldwide",
    title: "The evolution into intelligent AI accounting",
    body: [
      "More than a decade after that first shoebox of receipts, the original challenge remains familiar. Businesses still spend valuable time entering data, chasing invoices, reconciling accounts, processing payroll, managing inventory, and preparing reports. But technology has changed.",
      `${AI} has evolved from traditional accounting software into an AI-powered business management platform: an intelligent AI colleague that assists with accounting, sales, purchasing, inventory, payroll, financial analysis, customer relationships, and everyday operations.`,
      `Instead of navigating different systems, business owners can simply ask ${AI} questions, request analyses, and automate routine workflows — with qualified accountants, tax specialists, and financial professionals on hand when human judgement is required.`,
    ],
    pull: "Let technology handle repetitive work while people focus on decisions, innovation, and business growth.",
  },
];

const contact: { icon: LucideIcon; label: string; value: string; href?: string; external?: boolean }[] = [
  { icon: MapPin, label: "Head office", value: BRAND.contact.address },
  { icon: Phone, label: "Phone", value: BRAND.contact.phone, href: BRAND.contact.phoneHref },
  { icon: Mail, label: "Email", value: BRAND.contact.email, href: `mailto:${BRAND.contact.email}` },
  { icon: Globe, label: "Website", value: BRAND.contact.website, href: BRAND.contact.websiteHref, external: true },
];

export default function AboutPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-(--lp-map) lg:block" />
        <Container className="relative pb-16 pt-16">
          <div className="relative z-10 text-center">
            <Kicker>About us · Our story</Kicker>
            <H2>
              From a shoebox of receipts <br className="hidden sm:block" />
              <Serif className="text-[32px] sm:text-[40px]">to intelligent business automation.</Serif>
            </H2>
            <p className="mx-auto mt-4 max-w-170 text-[16px] leading-[1.6] text-lp-body">
              Every great innovation begins with a problem that needs solving. Ours started in Dublin, Ireland, in 2015.
            </p>
          </div>
        </Container>
      </section>

      {/* where it started */}
      <section className="border-t border-lp-line">
        <Container className="grid gap-10 py-20 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <Kicker>It all started in Dublin</Kicker>
            <div className="mt-5 space-y-4 text-[16px] leading-[1.7]">
              <p>
                In 2015, an accountant working from a small shared office on Fitzwilliam Square, Dublin 2, Ireland, faced a
                familiar challenge experienced by accountants everywhere.
              </p>
              <p>
                Clients would arrive with bags, envelopes, and sometimes shoeboxes filled with months of receipts, invoices,
                bank statements, and other financial documents. The accountant would spend countless hours sorting through
                paperwork, entering transactions, reconciling accounts, calculating taxes, and preparing financial statements.
              </p>
              <p>The process was repetitive, time-consuming, and inefficient. One question changed everything.</p>
            </div>
          </div>
          <Panel className="relative px-7 pb-8 pt-9">
            <Quote aria-hidden className="absolute right-6 top-6 h-10 w-10 text-lp-brand/15" />
            <p className="font-serif text-[24px] italic leading-[1.35] text-lp-ink sm:text-[27px]">
              &ldquo;Why should an accountant spend hours entering financial information when technology could do most of the
              work?&rdquo;
            </p>
            <p className="mt-5 text-[14px] font-semibold text-lp-brand">That question became the foundation of what is now {AI}.</p>
          </Panel>
        </Container>
      </section>

      {/* timeline */}
      <section className="border-t border-lp-line bg-lp-alt">
        <Container className="py-20">
          <div className="text-center">
            <Kicker>Our journey</Kicker>
            <H2>Born in Ireland. Growing globally.</H2>
          </div>

          <ol className="relative mx-auto mt-14 max-w-4xl">
            <span aria-hidden className="absolute bottom-3 left-4.5 top-3 w-px bg-lp-line sm:left-26" />
            {milestones.map((m) => (
              <li key={m.year} className="relative grid gap-x-10 pb-12 pl-14 last:pb-0 sm:grid-cols-[88px_1fr] sm:pl-0">
                <div className="sm:pt-1 sm:text-right">
                  <p className="font-display text-[26px] font-semibold leading-none tracking-[-0.04em] text-lp-ink">{m.year}</p>
                  <p className="mt-1.5 text-[12px] text-lp-muted">{m.place}</p>
                </div>
                <span
                  aria-hidden
                  className="absolute left-0 top-0 grid h-9 w-9 place-items-center rounded-full border border-lp-line bg-lp-card text-[17px] shadow-sm sm:left-[85px]"
                >
                  {m.flag}
                </span>
                <Panel className="mt-3 px-6 pb-6 pt-5 sm:mt-0 sm:ml-6">
                  <h3 className="text-[19px] font-semibold tracking-[-0.035em] text-lp-ink">{m.title}</h3>
                  <div className="mt-3 space-y-3 text-[15px] leading-[1.65]">
                    {m.body.map((b) => (
                      <p key={b.slice(0, 32)}>{b}</p>
                    ))}
                  </div>
                  {m.pull ? (
                    <p className="mt-4 border-l-2 border-lp-brand pl-4 font-serif text-[17px] italic leading-[1.45] text-lp-ink">{m.pull}</p>
                  ) : null}
                  {m.products ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {m.products.map((p) => (
                        <span key={p} className="rounded-full bg-lp-brand/10 px-2.5 py-0.75 text-[12px] font-medium text-lp-brand">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </Panel>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* philosophy, mission, vision */}
      <section className="border-t border-lp-line">
        <Container className="py-20">
          <div className="mx-auto max-w-3xl text-center">
            <Kicker>Our philosophy · Cost vs. efficiency theory</Kicker>
            <p className="mt-6 font-serif text-[30px] font-semibold italic leading-[1.25] tracking-[-0.02em] text-lp-brand sm:text-[38px]">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mx-auto mt-6 max-w-170 text-[16px] leading-[1.65]">
              We believe businesses do not necessarily need more employees, more software, or higher operating costs to achieve
              greater results. They need better processes, intelligent technology, and more efficient use of their existing
              resources. {AI} was built around that belief.
            </p>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2">
            {[
              {
                icon: Target,
                title: "Our mission",
                text: "To make intelligent accounting and business automation accessible to businesses of every size, helping them reduce administrative burdens, improve productivity, and make informed financial decisions.",
              },
              {
                icon: Telescope,
                title: "Our vision",
                text: "To create a world where business owners spend less time managing paperwork and more time building successful businesses.",
              },
            ].map((c) => (
              <Panel key={c.title} className="px-7 pb-8 pt-7">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-lp-brand/10 text-lp-brand">
                  <c.icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-5 text-[21px] font-semibold tracking-[-0.04em] text-lp-ink">{c.title}</h3>
                <p className="mt-2.5 text-[16px] leading-[1.65]">{c.text}</p>
              </Panel>
            ))}
          </div>
        </Container>
      </section>

      {/* contact */}
      <section id="contact" className="scroll-mt-14 border-t border-lp-line bg-lp-alt">
        <Container className="grid gap-10 py-20 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <Kicker>Contact</Kicker>
            <h2 className="mt-4 text-[36px] font-semibold leading-[1.1] tracking-[-0.045em] text-lp-brand sm:text-[44px]">Let&rsquo;s get in touch</h2>
            <p className="mt-4 max-w-110 text-[16px] leading-[1.6]">
              We&rsquo;re open for any suggestion or just to have a chat to know more.
            </p>
            <p className="mt-6 text-[14px] text-lp-muted">{BRAND.company} — head office in Ontario, Canada.</p>
          </div>
          <Panel>
            <ul className="divide-y divide-lp-line">
              {contact.map((c) => {
                const inner = (
                  <>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-lp-brand/10 text-lp-brand">
                      <c.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[12px] font-medium uppercase tracking-[0.14em] text-lp-muted">{c.label}</span>
                      <span className="mt-0.5 block break-words text-[16px] font-medium text-lp-ink">{c.value}</span>
                    </span>
                  </>
                );
                return (
                  <li key={c.label}>
                    {c.href ? (
                      <a
                        href={c.href}
                        {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                        className="group flex items-center gap-4 px-6 py-4.5 transition hover:bg-lp-alt"
                      >
                        {inner}
                        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-lp-muted transition group-hover:translate-x-0.5 group-hover:text-lp-brand" />
                      </a>
                    ) : (
                      <div className="flex items-center gap-4 px-6 py-4.5">{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>
        </Container>
      </section>

      {/* closing + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <p className="mx-auto mt-8 max-w-170 text-[16px] leading-[1.65] text-white/70">
              From a shoebox of receipts in Dublin in 2015 to our Canadian headquarters in 2024 and the evolution of intelligent
              AI-powered business automation — our journey has always been about solving real business problems. And we are
              only getting started.
            </p>
            <h2 className="mx-auto mt-8 max-w-3xl text-[30px] font-semibold leading-[1.15] tracking-[-0.045em] sm:text-[38px]">
              Born in Ireland. Growing globally.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">
                Built for efficiency. Powered by intelligence.
              </span>
            </h2>
            <div className="mt-9 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Get started with {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <a href="#contact" className={cn(btnOutline, "border-white/40 bg-transparent text-white hover:bg-white/5")}>
                Talk to us <ArrowRight className="h-3.5 w-3.5" />
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
