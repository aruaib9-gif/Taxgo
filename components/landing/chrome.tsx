import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { LandingLogo } from "@/components/landing/brand";
import { ThemeMenu } from "@/components/theme-toggle";
import { ThemeIntro } from "@/components/landing/theme-intro";
import { MobileNav } from "@/components/landing/mobile-nav";
import { NavLinks, type NavLink } from "@/components/landing/nav-links";

const AI = BRAND.fullName;

/* ---------- layout primitives shared by the landing and pricing pages ---------- */

export function Container({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mx-auto w-full max-w-287 px-6", className)}>{children}</div>;
}

export function Kicker({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("text-[11px] font-semibold uppercase tracking-[0.28em] text-lp-body", className)}>{children}</p>
  );
}

export function H2({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h2 className={cn("mt-4 text-[32px] font-semibold leading-[1.15] tracking-[-0.045em] text-lp-ink sm:text-[40px]", className)}>
      {children}
    </h2>
  );
}

export function Serif({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={cn("font-serif font-semibold italic text-lp-brand", className)}>{children}</span>;
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("overflow-hidden rounded-2xl border border-lp-line bg-lp-card", className)}>{children}</div>;
}

export const btnPrimary =
  "inline-flex items-center justify-center gap-2.5 rounded-full bg-lp-brand px-5.5 py-1.75 text-[15px] font-medium text-lp-on-brand transition hover:brightness-110";
export const btnOutline =
  "inline-flex items-center justify-center gap-2.5 rounded-full border border-lp-ink/25 bg-lp-card px-6.5 py-1.75 text-[15px] font-medium text-lp-ink transition hover:bg-lp-alt";

/* ---------- nav ---------- */

export const navLinks: NavLink[] = [
  { href: "/handles", label: "Her Task & Our Products", page: true },
  { href: "/how", label: "How she works", page: true },
  { href: "/humans", label: "The humans", page: true },
  { href: "/pricing", label: "Pricing", page: true },
  { href: "#faq", label: "FAQ" },
  { href: "/partners", label: "Partners", page: true },
  { href: "/about", label: "About", page: true },
];

/**
 * `hrefPrefix` is "" on the landing page (plain anchors) and "/" elsewhere, so
 * the same links jump back home first.
 */
export function LandingHeader({ hrefPrefix = "" }: { hrefPrefix?: string }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-lp-line bg-lp-canvas/90 backdrop-blur">
        <Container className="flex h-12.5 items-center justify-between gap-6">
          <div className="flex items-center gap-6.5">
            <LandingLogo />
            <NavLinks links={navLinks} hrefPrefix={hrefPrefix} />
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="text-lp-body [&_button[aria-haspopup]]:hover:bg-lp-alt [&_button[aria-haspopup]]:hover:text-lp-ink">
              <ThemeMenu />
            </div>
            <Link href="/login" className="hidden text-[14px] font-medium text-lp-ink sm:block">
              Sign in
            </Link>
            <Link
              href="/register"
              className="hidden rounded-full bg-lp-brand px-3.5 py-1.25 text-[14px] font-medium text-lp-on-brand transition hover:brightness-110 min-[380px]:block"
            >
              Hire {AI}
            </Link>
            <MobileNav links={navLinks} hrefPrefix={hrefPrefix} cta={`Hire ${AI}`} />
          </div>
        </Container>
      </header>
      <ThemeIntro />
    </>
  );
}

/* ---------- footer ---------- */

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/10">
      <Container className="flex flex-col items-center justify-between gap-4 py-7 sm:flex-row">
        <LandingLogo dark />
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] text-white/65">
          <Link href="/handles" className="hover:text-white">
            Her Task &amp; Our Products
          </Link>
          <Link href="/how" className="hover:text-white">
            How she works
          </Link>
          <Link href="/humans" className="hover:text-white">
            The humans
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-white">
            About us
          </Link>
          <a href={`mailto:${BRAND.contact.email}`} className="hover:text-white">
            {BRAND.contact.email}
          </a>
          <Link href="/login" className="hover:text-white">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-white">
            Create account
          </Link>
          <Link href="/partners" className="hover:text-white">
            Partners
          </Link>
          <span>© 2026 {AI}. All rights reserved.</span>
        </nav>
      </Container>
    </footer>
  );
}
