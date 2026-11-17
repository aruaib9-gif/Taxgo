"use client";

import Link from "next/link";
import { Card, StatCard, PageHeader } from "@/components/ui";
import { useDashboard } from "@/lib/metrics";
import { BRAND } from "@/lib/brand";

function money(v: number) {
  return `${BRAND.currency}${v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}`;
}

const quickLinks = [
  { label: "Submit expense", href: "/expense" },
  { label: "Record payment", href: "/ar/payments" },
  { label: "New invoice", href: "/ar/invoices/new" },
  { label: "Fill timesheet", href: "/projects/timesheets" },
];

export default function WorkspacePage() {
  const { kpis, counts, openInvoices, openBills } = useDashboard();

  return (
    <div>
      <PageHeader title="Good morning" subtitle="Here's what needs your attention today." />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Pending approvals" value="0" />
        <StatCard label="Overdue invoices" value={String(counts.openInvoices)} />
        <StatCard label="Bills to pay" value={String(counts.openBills)} />
        <StatCard label="AR outstanding" value={money(kpis.arOutstanding)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Overdue invoices</p>
            <Link href="/ar/invoices" className="text-xs text-primary">View all</Link>
          </div>
          {openInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">No overdue invoices.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {openInvoices.slice(0, 5).map((i) => (
                <li key={i.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{String(i.number ?? "")} · {String(i.customer ?? "")}</span>
                  <span className="font-medium tabular-nums">{money(Number(i.total) || 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Bills awaiting payment</p>
            <Link href="/ap/bills" className="text-xs text-primary">View all</Link>
          </div>
          {openBills.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bills awaiting payment.</p>
          ) : (
            <ul className="divide-y divide-border/60">
              {openBills.slice(0, 5).map((b) => (
                <li key={b.id} className="flex items-center justify-between py-2 text-sm">
                  <span>{String(b.number ?? "")} · {String(b.vendor ?? "")}</span>
                  <span className="font-medium tabular-nums">{money(Number(b.total) || 0)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <p className="mb-3 text-sm font-semibold">Quick links</p>
        <div className="flex flex-wrap gap-2">
          {quickLinks.map((q) => (
            <Link key={q.label} href={q.href} className="rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
              {q.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
