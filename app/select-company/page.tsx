import Link from "next/link";
import { Building2, Check, Plus, ChevronRight } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Select company" };

const companies = [
  { name: BRAND.org, meta: "GENERIC · USD", role: "Owner", active: true },
  { name: "Crescent Retail FZE", meta: "UAE · AED", role: "Accountant", active: false },
  { name: "Blue Ocean Foods Pvt Ltd", meta: "India · INR", role: "Member", active: false },
];

export default function SelectCompanyPage() {
  return (
    <div className="flex min-h-screen flex-col items-center bg-[var(--body)] px-6 py-10">
      <div className="mb-8">
        <BrandMark href="/home" />
      </div>
      <div className="w-full max-w-md">
        <h1 className="text-center text-2xl font-bold tracking-tight">Choose a company</h1>
        <p className="mb-6 mt-1 text-center text-sm text-muted-foreground">Pick the company you want to work in.</p>

        <div className="space-y-2">
          {companies.map((c) => (
            <Link
              key={c.name}
              href="/home"
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {c.name}
                  {c.active ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                      <Check className="h-3 w-3" /> Current
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs text-muted-foreground">{c.meta} · {c.role}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          ))}
        </div>

        <Link
          href="/onboarding"
          className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-4 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-4 w-4" /> Create a new company
        </Link>

        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-muted-foreground hover:text-foreground">Log out</Link>
        </p>
      </div>
    </div>
  );
}
