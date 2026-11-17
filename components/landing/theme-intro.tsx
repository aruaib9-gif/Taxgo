"use client";

// First visit to the public site: a small card offering the themes. Shown once, and never to someone who
// has already picked a theme (here or in the app). The header's sun/moon menu changes it later.

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { savedTheme } from "@/lib/theme";
import { ThemeChoices } from "@/components/theme-choices";
import { btnPrimary } from "@/components/landing/chrome";
import { cn } from "@/lib/utils";

const SEEN_KEY = "taxgo:theme-intro";

export function ThemeIntro() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1" || savedTheme() !== null;
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(t);
  }, []);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="theme-intro-title"
      className="fixed bottom-5 left-5 z-50 w-[calc(100vw-40px)] max-w-sm animate-lp-rise rounded-2xl border border-lp-line bg-lp-card p-4 text-lp-ink shadow-[0_18px_50px_-12px_rgba(0,0,0,0.35)]"
    >
      <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 text-lp-muted transition hover:text-lp-ink">
        <X className="h-4 w-4" />
      </button>
      <p id="theme-intro-title" className="pr-6 text-[15px] font-semibold tracking-[-0.02em]">
        Choose your look
      </p>
      <p className="mt-0.5 text-[13px] text-lp-muted">Light, dark or matched to your device. Change it any time from the sun/moon icon.</p>
      <div className="mt-3">
        <ThemeChoices tone="site" />
      </div>
      <button type="button" onClick={close} className={cn(btnPrimary, "mt-3.5 w-full py-1.5 text-[14px]")}>
        Done
      </button>
    </div>
  );
}
