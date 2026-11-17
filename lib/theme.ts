"use client";

// The colour theme, shared by the app and the public site. Stored in localStorage "theme" and applied as
// <html data-theme> (before paint, by the script in app/layout.tsx). "system" leaves data-theme unset, so
// the CSS follows the device's light/dark preference.

import { Droplet, Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

export type Theme = "blue" | "light" | "dark" | "system";

export const THEMES: { value: Theme; label: string; hint: string; icon: LucideIcon }[] = [
  { value: "blue", label: "Default", hint: "White with green", icon: Droplet },
  { value: "light", label: "Light", hint: "Soft grey-white", icon: Sun },
  { value: "dark", label: "Dark", hint: "Easy on the eyes", icon: Moon },
  { value: "system", label: "System", hint: "Match my device", icon: Monitor },
];

const KEY = "theme";

/** The saved choice, or null if the visitor has never picked one. */
export function savedTheme(): Theme | null {
  try {
    const t = localStorage.getItem(KEY);
    return THEMES.some((x) => x.value === t) ? (t as Theme) : null;
  } catch {
    return null;
  }
}

export function currentTheme(): Theme {
  return savedTheme() ?? "system";
}

export function applyTheme(t: Theme) {
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  try {
    localStorage.setItem(KEY, t);
  } catch {}
}
