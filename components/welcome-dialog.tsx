"use client";

import { useEffect, useState } from "react";
import { Calculator, Sparkles, Wallet, X } from "lucide-react";
import { BRAND } from "@/lib/brand";

const SEEN_KEY = "taxgo:welcomed";

const POINTS = [
  { icon: Wallet, text: "Track finances across invoices, bills, and bank accounts" },
  { icon: Calculator, text: "Automate accounting with posting rules and journal entries" },
  { icon: Sparkles, text: "Get AI-powered insights and anomaly detection" },
];

// First-visit welcome. Shown once per browser.
export function WelcomeDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(SEEN_KEY) === "1";
    } catch {}
    if (seen) return;
    const t = setTimeout(() => setOpen(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function close() {
    setOpen(false);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {}
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 animate-lp-rise [animation-duration:200ms]" onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="relative w-full max-w-md animate-lp-rise rounded-lg border border-border bg-background p-5 shadow-lg"
      >
        <h2 id="welcome-title" className="text-xl font-semibold tracking-tight">
          Welcome to {BRAND.fullName}.
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">Your all-in-one business management platform. Here&apos;s what you can do:</p>
        <ul className="mt-5 space-y-3">
          {POINTS.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-sm">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <p.icon className="h-3.5 w-3.5" />
              </span>
              {p.text}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Get Started
          </button>
        </div>
        <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
