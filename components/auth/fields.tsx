"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Eye, EyeOff, Globe, Search } from "lucide-react";
import { COUNTRIES, DEFAULT_COUNTRY, PINNED_COUNTRIES, flag, type Country } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { useDismiss } from "@/lib/use-dismiss";

export const inputClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";

export const primaryButton =
  "inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

export const outlineButton =
  "inline-flex h-9 w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-body px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0";

// Small uppercase heading that groups register fields ("You", "Reach you at", …).
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{children}</p>;
}

export function FieldLabel({ htmlFor, children, strong }: { htmlFor: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        "block",
        strong ? "mb-1.5 text-[12.5px] font-bold text-foreground/70" : "text-sm font-medium leading-none text-foreground",
      )}
    >
      {children}
    </label>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "info"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md px-3 py-2.5 text-sm",
        tone === "error" ? "bg-destructive/10 text-destructive" : "bg-foreground/5 text-muted-foreground",
      )}
    >
      {children}
    </div>
  );
}

export function PasswordInput({ id, autoComplete, ...props }: React.ComponentProps<"input"> & { id: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? "text" : "password"} autoComplete={autoComplete} className={cn(inputClass, "pr-10")} {...props} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex items-center rounded-r-md px-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

const byIso = new Map(COUNTRIES.map((c) => [c.iso, c]));
const pinned = PINNED_COUNTRIES.map((iso) => byIso.get(iso)!).filter(Boolean);
const rest = COUNTRIES.filter((c) => !PINNED_COUNTRIES.includes(c.iso));

export function PhoneInput({
  id,
  name = "phone",
  placeholder = "2015550123",
}: {
  id: string;
  name?: string;
  placeholder?: string;
}) {
  const [country, setCountry] = useState<Country>(byIso.get(DEFAULT_COUNTRY)!);
  const [number, setNumber] = useState("");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useDismiss(open, setOpen);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^\+/, "");
    if (!q) return null;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q) || c.dial.slice(1).startsWith(q));
  }, [query]);

  function pick(c: Country) {
    setCountry(c);
    setOpen(false);
    setQuery("");
  }

  const option = (c: Country) => (
    <li key={c.iso}>
      <button
        type="button"
        role="option"
        aria-selected={c.iso === country.iso}
        onClick={() => pick(c)}
        className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent"
      >
        <span aria-hidden>{flag(c.iso)}</span>
        <span className="min-w-0 flex-1 truncate">{c.name}</span>
        <span className="tabular-nums text-muted-foreground">{c.dial}</span>
        <Check className={cn("h-3.5 w-3.5 text-muted-foreground", c.iso !== country.iso && "invisible")} />
      </button>
    </li>
  );

  return (
    <div ref={ref} className="relative flex gap-2">
      <input type="hidden" name={name} value={number ? `${country.dial}${number}` : ""} />
      <button
        type="button"
        aria-label="Country code"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 shrink-0 items-center gap-1.5 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <span aria-hidden>{flag(country.iso)}</span>
        <span className="tabular-nums">{country.dial}</span>
        <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
      </button>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder={placeholder}
        value={number}
        onChange={(e) => setNumber(e.target.value.replace(/\D/g, ""))}
        className={inputClass}
      />

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code"
              aria-label="Search country or code"
              className="h-9 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <ul role="listbox" aria-label="Country" className="max-h-56 overflow-y-auto p-1">
            {matches ? (
              matches.length ? (
                matches.map(option)
              ) : (
                <li className="px-2 py-3 text-center text-sm text-muted-foreground">No country found.</li>
              )
            ) : (
              <>
                {pinned.map(option)}
                <li role="separator" className="-mx-1 my-1 h-px bg-border" />
                {rest.map(option)}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية" },
  { code: "hi", label: "हिन्दी" },
  { code: "ml", label: "മലയാളം" },
  { code: "ta", label: "தமிழ்" },
];

function storedLanguage() {
  try {
    return localStorage.getItem("lang") ?? "en";
  } catch {
    return "en";
  }
}

// Language picker. Remembers the choice; the copy itself is English-only until translations exist.
export function LanguageMenu() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const ref = useDismiss(open, setOpen);

  function choose(code: string) {
    setLang(code);
    setOpen(false);
    try {
      localStorage.setItem("lang", code);
    } catch {}
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (!open) setLang(storedLanguage());
          setOpen((o) => !o);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Globe className="h-4 w-4" />
        <span className="sr-only">Switch language</span>
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 min-w-36 rounded-xl border border-border bg-popover p-1 shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === l.code}
              onClick={() => choose(l.code)}
              className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm text-foreground hover:bg-accent"
            >
              {l.label}
              <Check className={cn("h-3.5 w-3.5 text-primary", lang !== l.code && "invisible")} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
