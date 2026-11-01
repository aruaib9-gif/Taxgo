"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, House } from "lucide-react";

const titleCase = (s: string) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
// URL segments whose label differs from the raw path segment (as on the live platform).
const LABELS: Record<string, string> = { "/ai": "AI Intelligence", "/crm": "CRM", "/crm/scoring": "Scoring", "/crm/web-forms": "Web Forms", "/bank": "Banking", "/bank/reconciliations": "Reconciliation", "/kuri": "Chit Funds", "/payroll/structures": "Salary Structures", "/payroll/runs": "Payroll Runs", "/payroll/expense-claims": "Expense Claims", "/hr": "Human Resources", "/pos": "Point of Sale", "/assets": "Fixed Assets", "/assets/list": "Register", "/ar": "Receivables", "/ap": "Payables", "/inventory/rfqs": "RFQs", "/inventory/grn": "Goods Receipt Notes", "/inventory/bom": "Bill of Materials", "/inventory/serials": "Serial Numbers" };

// Record ids (uuids, generated ids) read as "Detail", like the live platform.
const isId = (s: string) => /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(s) || /^[a-z]+-[a-z0-9-]*\d[a-z0-9-]*$/i.test(s);

// Path-based trail: /financial/accounts/new → Financial › Accounts › New.
export function Breadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex items-center space-x-1 text-sm text-muted-foreground">
      <Link href="/home" aria-label="Home" className="transition-colors hover:text-foreground">
        <House className="h-4 w-4" />
      </Link>
      {parts.map((p, i) => {
        const label = isId(p) ? "Detail" : (LABELS["/" + parts.slice(0, i + 1).join("/")] ?? titleCase(p));
        const last = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4" />
            {last ? (
              <span className="font-medium text-foreground">{label}</span>
            ) : (
              <Link href={"/" + parts.slice(0, i + 1).join("/")} className="transition-colors hover:text-foreground">
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
