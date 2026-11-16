"use client";

// "Choose a company": lists the login's companies and switches the app into the one picked.

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Building2, Check, ChevronRight, Plus } from "lucide-react";
import { switchCompany, useCompanies } from "@/lib/companies";
import { DEFAULT_COMPANY, activeCompanyId } from "@/lib/store";

const noSubscribe = () => () => {};

export function CompanyPicker() {
  const companies = useCompanies();
  const active = useSyncExternalStore(noSubscribe, activeCompanyId, () => DEFAULT_COMPANY);

  return (
    <>
      <div className="space-y-2">
        {companies.map((c) => {
          const current = c.id === active;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => switchCompany(c.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/30"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                <Building2 className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {String(c.name)}
                  {current ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
                      <Check className="h-3 w-3" /> Current
                    </span>
                  ) : null}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {[c.country, c.currency, c.role].filter(Boolean).map(String).join(" · ")}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <Link
        href="/onboarding"
        className="mt-3 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-border bg-card p-4 text-sm font-medium text-muted-foreground hover:bg-muted"
      >
        <Plus className="h-4 w-4" /> Create a new company
      </Link>
    </>
  );
}
