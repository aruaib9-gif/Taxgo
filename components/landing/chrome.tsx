import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { LandingLogo } from "@/components/landing/brand";

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
  "inline-flex items-center justify-center gap-2.5 rounded-full bg-lp-brand px-5.5 py-1.75 text-[15px] font-medium text-lp-navy transition hover:brightness-110";
export const btnOutline =
  "inline-flex items-center justify-center gap-2.5 rounded-full border border-lp-ink/25 bg-lp-card px-6.5 py-1.75 text-[15px] font-medium text-lp-ink transition hover:bg-white";

/* ---------- nav ---------- */

export const navLinks = [
  { href: "#handles", label: `What ${AI} handles` },
  { href: "#how", label: `How ${AI} works` },
  { href: "#humans", label: "The humans" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

/**
 * `hrefPrefix` is "" on the landing page (plain anchors) and "/" elsewhere, so
 * the same links jump back home first.
 */
export function LandingHeader({ hrefPrefix = "" }: { hrefPrefix?: string }) {
  return (
    <header className="sticky top-0 z-30 border-b border-lp-line bg-lp-canvas/90 backdrop-blur">
      <Container className="flex h-12.5 items-center justify-between gap-6">
        <div className="flex items-center gap-6.5">
          <LandingLogo />
          <nav className="hidden items-center gap-5.5 text-[14px] text-lp-body lg:flex">
            {navLinks.map((l) => (
              <a key={l.href} href={`${hrefPrefix}${l.href}`} className="transition-colors hover:text-lp-ink">
                {l.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-5">
          <Link href="/login" className="hidden text-[14px] font-medium text-lp-ink sm:block">
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-lp-brand px-3.5 py-1.25 text-[14px] font-medium text-lp-navy transition hover:brightness-110"
          >
            Hire {AI}
          </Link>
        </div>
      </Container>
    </header>
  );
}

/* ---------- footer ---------- */

export function LandingFooter() {
  return (
    <footer className="relative border-t border-white/10">
      <Container className="flex flex-col items-center justify-between gap-4 py-7 sm:flex-row">
        <LandingLogo dark />
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[14px] text-white/65">
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/login" className="hover:text-white">
            Sign in
          </Link>
          <Link href="/register" className="hover:text-white">
            Create account
          </Link>
          <a href={BRAND.whatsapp} target="_blank" rel="noopener noreferrer" className="hover:text-white">
            Partners
          </a>
          <span>© 2026 {AI}. All rights reserved.</span>
        </nav>
      </Container>
    </footer>
  );
}
