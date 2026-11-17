"use client";

import { useState } from "react";
import { Droplet, Moon, Sun, type LucideIcon } from "lucide-react";
import { useDismiss } from "@/lib/use-dismiss";
import { cn } from "@/lib/utils";

type Theme = "blue" | "light" | "dark";

const THEMES: { value: Theme; label: string; icon: LucideIcon }[] = [
  { value: "blue", label: "Default", icon: Droplet },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

function currentTheme(): Theme {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "light" || t === "dark" ? t : "blue";
}

export function ThemeMenu() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("blue");
  const ref = useDismiss(open, setOpen);

  function choose(next: Theme) {
    setTheme(next);
    setOpen(false);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!open) setTheme(currentTheme());
          setOpen((o) => !o);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all in-data-[theme=dark]:-rotate-90 in-data-[theme=dark]:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all in-data-[theme=dark]:rotate-0 in-data-[theme=dark]:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 min-w-32 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          {THEMES.map((t) => (
            <button
              key={t.value}
              type="button"
              role="menuitemradio"
              aria-checked={theme === t.value}
              onClick={() => choose(t.value)}
              className={cn("flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent", theme === t.value && "bg-accent")}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
