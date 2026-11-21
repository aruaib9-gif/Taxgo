"use client";

// Settings › Billing: the company's plan, users and AI credits, and a plan picker priced from the same
// country price list as the public /pricing page (lib/pricing.ts), in the chosen country's currency.

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Minus, Plus, Sparkles, Users as UsersIcon } from "lucide-react";
import {
  COUNTRY_PRICES,
  PACKAGES,
  USERS_INCLUDED,
  USER_BLOCK_PCT,
  amountFor,
  annualSavingPct,
  formatMoney,
  packageFor,
  priceFor,
  quoteMultiplier,
  type Cycle,
  type PackageId,
} from "@/lib/pricing";
import { DEFAULT_COUNTRY } from "@/lib/countries";
import { useCollection } from "@/lib/store";
import { saveSetting, useSetting } from "@/lib/system";
import { cn } from "@/lib/utils";
import { Badge, Card, CardTitle, PageHeader, btn } from "@/components/accounting/kit";
import { Select } from "@/components/accounting/pickers";
import { useFlash } from "@/components/hr/people";

type Subscription = { packageId: PackageId | ""; country: string; cycle: Cycle; users: number; since: string };
const NO_SUB: Subscription = { packageId: "", country: DEFAULT_COUNTRY, cycle: "monthly", users: USERS_INCLUDED, since: "" };
const AI_CREDITS = { total: 500, used: 9.3 };

const COUNTRY_OPTIONS = [...COUNTRY_PRICES]
  .sort((a, b) => a.country.localeCompare(b.country))
  .map((p) => ({ value: p.code, label: `${p.flag}  ${p.country} — ${p.currency}` }));

export function Billing() {
  const sub = useSetting<Subscription>("subscription", NO_SUB);
  const credits = useSetting("ai-credits", AI_CREDITS);
  const team = useCollection("users").length + 1; // invited users plus the owner
  const { node, flash } = useFlash();

  // The draft starts from the saved plan; nothing is saved until "Switch to this plan".
  const [draft, setDraft] = useState<Subscription | null>(null);
  const d = draft ?? { ...sub, packageId: sub.packageId || "complete", users: Math.max(sub.users, team) };
  const set = (patch: Partial<Subscription>) => setDraft({ ...d, ...patch });

  const price = priceFor(d.country) ?? priceFor(DEFAULT_COUNTRY) ?? COUNTRY_PRICES[0];
  const pkg = packageFor(d.packageId);
  const mult = quoteMultiplier(1, d.users);
  const base = amountFor(price, pkg, d.cycle);
  const total = Math.round(base * mult);
  const extraPct = Math.round((mult - 1) * 100);
  const saving = annualSavingPct(price, pkg);
  const current = sub.packageId ? packageFor(sub.packageId) : null;
  const currentPrice = current ? priceFor(sub.country) : undefined;
  const unchanged = Boolean(current) && sub.packageId === d.packageId && sub.country === d.country && sub.cycle === d.cycle && sub.users === d.users;
  const per = d.cycle === "annual" ? "year" : "month";
  const left = Math.max(0, credits.total - credits.used);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeader title="Billing" subtitle="Plans, users and AI credits" />

      {/* current plan */}
      <Card>
        <div className="grid gap-4 p-5 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <CardTitle>Your plan</CardTitle>
            {current && currentPrice ? (
              <>
                <p className="mt-2 text-lg font-semibold">{current.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentPrice.flag} {currentPrice.country} · {formatMoney(currentPrice, Math.round(amountFor(currentPrice, current, sub.cycle) * quoteMultiplier(1, sub.users)))} / {sub.cycle === "annual" ? "year" : "month"}
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-lg font-semibold">Growth</p>
                <p className="text-sm text-muted-foreground">No paid subscription yet — choose a plan below.</p>
              </>
            )}
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><UsersIcon className="size-4" /></span>
            <div>
              <p className="text-xs text-muted-foreground">Users</p>
              <p className="font-semibold">
                {team} of {current ? sub.users : USERS_INCLUDED} included
              </p>
              <Link href="/settings/users" className="text-xs text-primary hover:underline">Manage users</Link>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Sparkles className="size-4" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground">AI credits left</p>
              <p className="font-semibold tabular-nums">{left.toLocaleString("en-US", { maximumFractionDigits: 1 })} of {credits.total}</p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(left / credits.total) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* plan picker */}
      <Card>
        <div className="space-y-5 p-5">
          <div>
            <CardTitle>Choose a plan</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Prices depend on your country and are billed in its currency — {COUNTRY_PRICES.length} countries. One price per company, up to {USERS_INCLUDED} users included.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <div>
              <p className="mb-1.5 text-sm font-medium">Country</p>
              <Select searchable ariaLabel="Country" value={d.country} onChange={(v) => set({ country: v })} options={COUNTRY_OPTIONS} />
            </div>
            <div>
              <p className="mb-1.5 text-sm font-medium">Billing cycle</p>
              <div role="radiogroup" aria-label="Billing cycle" className="inline-flex h-9 rounded-md border border-input p-0.5">
                {(["monthly", "annual"] as Cycle[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={d.cycle === c}
                    onClick={() => set({ cycle: c })}
                    className={cn("rounded px-3 text-sm font-medium capitalize transition", d.cycle === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                  >
                    {c}
                    {c === "annual" && saving > 0 ? <span className={cn("ml-1 text-xs", d.cycle === c ? "opacity-80" : "text-primary")}>−{saving}%</span> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div role="radiogroup" aria-label="Package" className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {PACKAGES.map((p) => {
              const on = p.id === d.packageId;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ packageId: p.id })}
                  className={cn("relative rounded-lg border p-3.5 text-left transition", on ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:border-primary/40")}
                >
                  {sub.packageId === p.id ? <span className="absolute right-3 top-3"><Badge tone="success">Current</Badge></span> : on ? <Check className="absolute right-3 top-3 size-4 text-primary" /> : null}
                  <p className="pr-16 font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.blurb}</p>
                  <p className="mt-2 text-lg font-semibold tabular-nums">
                    {formatMoney(price, amountFor(price, p, d.cycle))} <span className="text-xs font-normal text-muted-foreground">/ {per}</span>
                  </p>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <p className="mb-1.5 text-sm font-medium">Users</p>
              <div className="inline-flex h-9 items-center rounded-md border border-input">
                <button type="button" aria-label="Fewer users" disabled={d.users <= Math.max(1, team)} onClick={() => set({ users: Math.max(team, Math.ceil(d.users / USERS_INCLUDED) * USERS_INCLUDED - USERS_INCLUDED) })} className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground disabled:opacity-40">
                  <Minus className="size-3.5" />
                </button>
                <span className="w-12 text-center font-semibold tabular-nums">{d.users}</span>
                <button type="button" aria-label="More users" onClick={() => set({ users: Math.floor(d.users / USERS_INCLUDED) * USERS_INCLUDED + USERS_INCLUDED })} className="grid h-full w-9 place-items-center text-muted-foreground hover:text-foreground">
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
            <p className="max-w-md text-xs text-muted-foreground">
              {USERS_INCLUDED} users are included; each extra {USERS_INCLUDED} adds {USER_BLOCK_PCT}% of the package price. You have {team} user{team === 1 ? "" : "s"} today.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-muted/60 p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {pkg.name} · {price.flag} {price.country} · {d.users} users
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {formatMoney(price, total)} <span className="text-sm font-normal text-muted-foreground">/ {per}</span>
              </p>
              {extraPct > 0 && (
                <p className="text-xs text-muted-foreground">
                  {formatMoney(price, base)} base + {extraPct}% for {d.users} users
                </p>
              )}
            </div>
            <button
              type="button"
              className={btn.primary}
              disabled={unchanged}
              onClick={() => {
                saveSetting("subscription", { ...d, since: new Date().toISOString() });
                setDraft(null);
                flash(`Plan saved: ${pkg.name}, ${formatMoney(price, total)} / ${per}`);
              }}
            >
              <CreditCard /> {unchanged ? "Your current plan" : current ? "Switch to this plan" : "Choose this plan"}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Payment collection isn&apos;t connected yet — saving a plan records it for this company. See every country&apos;s prices on the{" "}
            <Link href="/pricing" className="text-primary hover:underline">pricing page</Link>.
          </p>
        </div>
      </Card>
      {node}
    </div>
  );
}
