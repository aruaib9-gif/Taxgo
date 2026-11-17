"use client";

// A row of theme tiles with a small preview of each palette, applied as soon as one is picked.
// Used by the first-visit prompts (the app's welcome dialog and the website's look card).

import { useState } from "react";
import { Check } from "lucide-react";
import { THEMES, applyTheme, currentTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

/** Page / card / accent colours for each tile's preview. "system" splits light and dark. */
const PREVIEW: Record<Exclude<Theme, "system">, [string, string, string]> = {
  blue: ["#ffffff", "#f3f6f4", "#15803d"],
  light: ["#f7f8f7", "#ffffff", "#15803d"],
  dark: ["#0b0f0d", "#1a231e", "#3fbf6a"],
};

function Swatch({ theme }: { theme: Exclude<Theme, "system"> }) {
  const [page, card, accent] = PREVIEW[theme];
  return (
    <span className="flex h-full w-full flex-col gap-1 p-1.5" style={{ background: page }}>
      <span className="h-1.5 w-2/3 rounded-full" style={{ background: accent }} />
      <span className="flex-1 rounded-sm" style={{ background: card }} />
    </span>
  );
}

export function ThemeChoices({ tone = "app", onPick }: { tone?: "app" | "site"; onPick?: (t: Theme) => void }) {
  const [theme, setTheme] = useState<Theme>(() => (typeof window === "undefined" ? "system" : currentTheme()));
  const site = tone === "site";

  return (
    <div role="radiogroup" aria-label="Theme" className="grid grid-cols-4 gap-2">
      {THEMES.map((t) => {
        const on = theme === t.value;
        return (
          <button
            key={t.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              setTheme(t.value);
              applyTheme(t.value);
              onPick?.(t.value);
            }}
            className={cn(
              "group flex flex-col items-stretch gap-1.5 rounded-xl border p-1.5 text-left transition",
              site
                ? on
                  ? "border-lp-brand ring-2 ring-lp-brand/25"
                  : "border-lp-line hover:border-lp-brand/50"
                : on
                  ? "border-primary ring-2 ring-primary/25"
                  : "border-border hover:border-primary/50",
            )}
          >
            <span className="relative block h-12 overflow-hidden rounded-lg border border-black/10">
              {t.value === "system" ? (
                <span className="flex h-full">
                  <span className="w-1/2 overflow-hidden">
                    <Swatch theme="blue" />
                  </span>
                  <span className="w-1/2 overflow-hidden">
                    <Swatch theme="dark" />
                  </span>
                </span>
              ) : (
                <Swatch theme={t.value} />
              )}
              {on ? (
                <span className={cn("absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full", site ? "bg-lp-brand text-lp-on-brand" : "bg-primary text-primary-foreground")}>
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              ) : null}
            </span>
            <span className="flex items-center gap-1 px-0.5 text-[12px] font-medium">
              <t.icon className={cn("h-3 w-3 shrink-0", site ? "text-lp-muted" : "text-muted-foreground")} />
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
