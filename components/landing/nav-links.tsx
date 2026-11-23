"use client";

// The header's links. Client-side so the one for the page you are on can mark
// itself: brand underline, darker label, aria-current for screen readers.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export type NavLink = { href: string; label: string; page?: boolean };

/** True when `href` is the page being shown (or a page under it). */
export function isCurrent(pathname: string, l: NavLink) {
  return Boolean(l.page) && (pathname === l.href || pathname.startsWith(`${l.href}/`));
}

export function NavLinks({ links, hrefPrefix = "" }: { links: NavLink[]; hrefPrefix?: string }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden items-center gap-5.5 text-[14px] text-lp-body lg:flex">
      {links.map((l) => {
        const current = isCurrent(pathname, l);
        const className = cn(
          "relative py-0.5 transition-colors hover:text-lp-ink",
          current &&
            "font-medium text-lp-ink after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-lp-brand",
        );
        return l.page ? (
          <Link key={l.href} href={l.href} aria-current={current ? "page" : undefined} className={className}>
            {l.label}
          </Link>
        ) : (
          <a key={l.href} href={`${hrefPrefix}${l.href}`} className={className}>
            {l.label}
          </a>
        );
      })}
    </nav>
  );
}
