"use client";

// Below lg, the header's links fold into this menu: a hamburger that drops a panel under the header.

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function MobileNav({ links, hrefPrefix, cta }: { links: { href: string; label: string; page?: boolean }[]; hrefPrefix: string; cta: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [shownFor, setShownFor] = useState(pathname);

  // Close when the route changes (state reset during render, not in an effect).
  if (shownFor !== pathname) {
    setShownFor(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const wide = window.matchMedia("(min-width: 1024px)");
    const onWide = () => wide.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    wide.addEventListener("change", onWide);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const close = () => setOpen(false);
  const item = "flex items-center justify-between rounded-xl px-3 py-3 text-[16px] font-medium text-lp-ink transition hover:bg-lp-alt";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        aria-label={open ? "Close menu" : "Open menu"}
        className="-mr-1.5 grid h-9 w-9 place-items-center rounded-md text-lp-ink transition hover:bg-lp-alt lg:hidden"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div
        className={cn("absolute inset-x-0 top-full h-dvh bg-black/30 transition-opacity lg:hidden", open ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={close}
        aria-hidden
      />
      <nav
        id="mobile-nav"
        aria-label="Main"
        hidden={!open}
        className="absolute inset-x-0 top-full max-h-[calc(100dvh-50px)] overflow-y-auto border-b border-lp-line bg-lp-canvas px-4 pb-5 pt-2 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)] lg:hidden"
      >
        <ul className="divide-y divide-lp-line">
          {links.map((l) => (
            <li key={l.href}>
              {l.page ? (
                <Link href={l.href} onClick={close} className={item}>
                  {l.label} <ArrowRight className="h-4 w-4 text-lp-muted" />
                </Link>
              ) : (
                <a href={`${hrefPrefix}${l.href}`} onClick={close} className={item}>
                  {l.label} <ArrowRight className="h-4 w-4 text-lp-muted" />
                </a>
              )}
            </li>
          ))}
          <li>
            <Link href="/compliance" onClick={close} className={item}>
              Global tax coverage <ArrowRight className="h-4 w-4 text-lp-muted" />
            </Link>
          </li>
        </ul>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <Link href="/login" onClick={close} className="rounded-full border border-lp-ink/25 bg-lp-card py-2.5 text-center text-[15px] font-medium text-lp-ink">
            Sign in
          </Link>
          <Link href="/register" onClick={close} className="rounded-full bg-lp-brand py-2.5 text-center text-[15px] font-medium text-lp-on-brand">
            {cta}
          </Link>
        </div>
      </nav>
    </>
  );
}
