"use client";

// "What Tax GO handles": the 15-module grid. Each tile opens a window with the module's features,
// an everyday example, what Tax GO automates and the time it saves.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Banknote,
  BookOpen,
  Calculator,
  ChartColumn,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cog,
  FolderOpen,
  Heart,
  Landmark,
  Package,
  PackageOpen,
  ShoppingCart,
  Sparkles,
  Store,
  Target,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

type Module = {
  icon: LucideIcon;
  title: string;
  text: string;
  accent?: boolean;
  summary: string;
  features: string[];
  example: string;
  automation: string[];
  saving: string;
};

const modules: Module[] = [
  {
    icon: Calculator,
    title: "Accounting",
    text: "GL, tax & compliance",
    summary: "A real double-entry ledger at the centre of your business, with tax and compliance built in.",
    features: ["Chart of accounts & general ledger", "Journal entries & period close", "VAT, GST & sales tax", "Financial statements & audit trail"],
    example: "At month-end, every invoice, bill and bank line is already posted. You open the trial balance, review two flagged entries and approve the close.",
    automation: ["Posts entries from invoices, bills and receipts", "Reconciles bank and card accounts", "Prepares accruals, depreciation and adjustments"],
    saving: "Close the month in days, not weeks.",
  },
  {
    icon: BookOpen,
    title: "Quick Entry",
    text: "Daybook, expense & income",
    summary: "Record day-to-day money in and money out in seconds, without accounting knowledge.",
    features: ["Daybook for everyday transactions", "Expense & income capture", "Receipt photos & attachments", "Petty cash"],
    example: "You snap a fuel receipt on your phone. It is read, categorised and posted to the right account before you leave the petrol station.",
    automation: ["Reads receipts and extracts amounts and tax", "Suggests the right account and cost centre", "Flags duplicates and missing receipts"],
    saving: "No more shoeboxes of receipts at month-end.",
  },
  {
    icon: ShoppingCart,
    title: "Sales",
    text: "Quote-to-cash, invoicing & AR",
    summary: "From the first quote to cash in the bank, with every step connected.",
    features: ["Quotes, sales orders & deliveries", "Invoices & credit notes", "Customer statements & receivables", "E-invoicing where required"],
    example: "A customer accepts a quote. The order, delivery note and invoice follow automatically, and a polite reminder goes out if payment is late.",
    automation: ["Turns quotes into orders and invoices", "Sends payment reminders and follow-ups", "Matches incoming payments to invoices"],
    saving: "Get paid faster, with far less chasing.",
  },
  {
    icon: PackageOpen,
    title: "Purchasing",
    text: "Procure-to-pay & bills",
    summary: "Control what you buy, what you owe and when you pay it.",
    features: ["Purchase requests & orders", "Goods received notes", "Supplier bills & payables", "Payment runs"],
    example: "A supplier bill arrives by email. It is matched to the purchase order and goods received, then queued for your approval before payment.",
    automation: ["Captures supplier bills from email and PDFs", "Three-way matches orders, receipts and bills", "Catches duplicate bills before they are paid"],
    saving: "Stop paying the same invoice twice.",
  },
  {
    icon: Package,
    title: "Inventory",
    text: "Products, stock & warehouses",
    summary: "Know what you have, where it is and what it is worth, in real time.",
    features: ["Products, variants & price lists", "Multiple warehouses & transfers", "Stock counts & adjustments", "Stock valuation"],
    example: "Your best-selling item drops below its reorder level. A purchase order to your usual supplier is drafted, ready for you to confirm.",
    automation: ["Updates stock with every sale and purchase", "Suggests reorders before you run out", "Values stock for your accounts"],
    saving: "Fewer stock-outs and no more manual stock sheets.",
  },
  {
    icon: Target,
    title: "CRM",
    text: "Leads, pipeline & activities",
    summary: "Win more business by keeping every lead, deal and conversation in one place.",
    features: ["Leads & lead scoring", "Opportunity pipeline & forecasts", "Quotes from deals", "Campaigns & web forms"],
    example: "A web enquiry becomes a scored lead. It is assigned, followed up, and turned into a quote and then a sales order without retyping a thing.",
    automation: ["Captures leads from web forms and enquiries", "Scores and prioritises leads", "Reminds your team to follow up"],
    saving: "No lead forgotten, no deal left waiting.",
  },
  {
    icon: Store,
    title: "Operations",
    text: "POS, van sales & helpdesk",
    summary: "Run the front line, from the shop counter to the delivery van and customer support.",
    features: ["Point of sale", "Van sales & routes", "Helpdesk tickets", "Service & field work"],
    example: "Your van sales team sells on the road. Every sale updates stock and the ledger, and the day's cash is reconciled when they return.",
    automation: ["Posts POS and van sales to the books", "Reconciles daily takings", "Routes support tickets to the right person"],
    saving: "End-of-day cash-up in minutes.",
  },
  {
    icon: Cog,
    title: "Manufacturing",
    text: "Production & work orders",
    summary: "Plan, produce and cost what you make.",
    features: ["Bills of materials", "Work orders & production", "Material consumption", "Production costing"],
    example: `A large order comes in. ${AI} checks materials, raises a work order, and updates stock and costs as production is completed.`,
    automation: ["Checks material availability", "Consumes materials and books finished goods", "Calculates the real cost of each product"],
    saving: "Know your true product costs without spreadsheets.",
  },
  {
    icon: FolderOpen,
    title: "Projects",
    text: "Projects, tasks & timesheets",
    summary: "Deliver projects on time and on budget, and bill for every hour.",
    features: ["Projects & tasks", "Timesheets", "Project budgets & costs", "Billing from time and milestones"],
    example: "Your team logs hours against a client project. At month-end the billable time becomes an invoice, and the project margin is up to date.",
    automation: ["Collects timesheets", "Tracks costs against budget", "Drafts invoices from billable time"],
    saving: "Bill every hour you work.",
  },
  {
    icon: Users,
    title: "HR",
    text: "Employees, leave & attendance",
    summary: "Look after your people, from hiring to everyday admin.",
    features: ["Employee records", "Leave & attendance", "Recruitment & onboarding", "Employee self-service"],
    example: "An employee requests leave from their phone. Their manager approves it, and payroll and the team calendar update automatically.",
    automation: ["Tracks leave balances and attendance", "Routes requests for approval", "Feeds approved changes into payroll"],
    saving: "Far less HR paperwork.",
  },
  {
    icon: Banknote,
    title: "Payroll",
    text: "Salary runs, claims & payslips",
    summary: "Accurate payroll, every pay day, following local rules.",
    features: ["Salary structures & allowances", "Statutory deductions", "Expense claims", "Payslips & bank payment files"],
    example: "On pay day, salaries, overtime, leave and claims are already calculated. You review one flagged item and approve the pay run.",
    automation: ["Calculates gross-to-net pay", "Applies tax and statutory deductions", "Prepares payslips, journals and payment files"],
    saving: "Run payroll in minutes instead of days.",
  },
  {
    icon: Landmark,
    title: "Finance",
    text: "Banking, loans & budgets",
    summary: "Stay on top of cash, borrowing and plans.",
    features: ["Bank accounts & feeds", "Loans & financing", "Budgets & variance", "Multi-currency"],
    example: `${AI} warns you that a large supplier payment next month will take cash below your reserve, while there is still time to act.`,
    automation: ["Imports and categorises bank transactions", "Forecasts cash flow", "Tracks spending against budget"],
    saving: "See cash problems weeks before they happen.",
  },
  {
    icon: Heart,
    title: "Social Impact",
    text: "Zakat & charity tracking",
    summary: "Track giving and obligations with the same care as the rest of your books.",
    features: ["Zakat calculation", "Donations & charity tracking", "Impact reporting"],
    example: "At year-end, your zakat base is calculated from your actual balances, with a clear report for your records.",
    automation: ["Calculates zakat from ledger balances", "Records donations against the right accounts", "Prepares impact reports"],
    saving: "No separate spreadsheets for giving.",
  },
  {
    icon: ChartColumn,
    title: "Analytics",
    text: "Reports & live dashboards",
    summary: "Answers, not just reports, from live business data.",
    features: ["Financial reports", "Live dashboards & KPIs", "Custom reports", "Ask questions in plain language"],
    example: "You ask, “How much profit did we make last month?” and get the answer, with the figures behind it, in seconds.",
    automation: ["Keeps dashboards up to date", "Highlights trends and anomalies", "Answers questions from your own data"],
    saving: "Decisions in minutes, not after a reporting week.",
  },
  {
    icon: Zap,
    title: `${AI}'s agents`,
    text: "Quiet automation across it all",
    accent: true,
    summary: `The AI colleagues working inside every module, so the busywork gets done while you focus on decisions.`,
    features: ["Virtual CFO & virtual accountant", "Anomaly detection", "Cash-flow forecasting", "AI business assistant"],
    example: "Overnight, the agents post the day's entries, reconcile the bank, chase overdue invoices and flag one unusual payment for you in the morning.",
    automation: ["Work across all 15 modules", "Execute routine tasks end to end", "Bring you only the decisions"],
    saving: "Hours of admin handled every day — around the clock.",
  },
];

export function ModuleExplorer() {
  const [open, setOpen] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastOpened = useRef(0);

  const close = useCallback(() => {
    setOpen(null);
    tiles.current[lastOpened.current]?.focus();
  }, []);

  function show(i: number) {
    lastOpened.current = i;
    setOpen(i);
  }

  // While the window is open: Esc closes, arrow keys browse, the page behind does not scroll.
  useEffect(() => {
    if (open === null) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show((open + 1) % modules.length);
      else if (e.key === "ArrowLeft") show((open - 1 + modules.length) % modules.length);
    };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const m = open === null ? null : modules[open];

  return (
    <div className="mt-11">
      <p className="mb-3 text-[13px] text-lp-muted">Click a module to see what it does.</p>
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-lp-line bg-lp-card sm:grid-cols-3 lg:grid-cols-5">
        {modules.map((mod, i) => (
          <button
            key={mod.title}
            ref={(el) => {
              tiles.current[i] = el;
            }}
            type="button"
            onClick={() => show(i)}
            aria-haspopup="dialog"
            className="group -mb-px -mr-px border-b border-r border-lp-line px-4.25 pb-4.75 pt-4.25 text-left transition-colors hover:bg-lp-brand/[0.06] focus-visible:bg-lp-brand/[0.06] focus-visible:outline-none"
          >
            <span className="flex items-center justify-between">
              <mod.icon className={cn("h-4 w-4", mod.accent ? "text-lp-brand" : "text-lp-body group-hover:text-lp-brand")} strokeWidth={1.5} />
              <ArrowUpRight className="h-3.5 w-3.5 text-lp-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
            </span>
            <h3 className="mt-3 text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{mod.title}</h3>
            <p className="mt-1 text-[12.5px] text-lp-muted">{mod.text}</p>
          </button>
        ))}
      </div>

      {m && open !== null && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
          <div aria-hidden className="animate-lp-rise absolute inset-0 bg-lp-navy/55 [animation-duration:150ms]" onClick={close} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="module-title"
            className="animate-lp-rise relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-2xl border border-lp-line bg-lp-card shadow-[0_30px_80px_-20px_rgba(15,36,56,0.45)] [animation-duration:200ms] sm:rounded-2xl"
          >
            <div className="flex items-start gap-3.5 border-b border-lp-line px-6 py-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lp-brand/10 text-lp-brand">
                <m.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="module-title" className="text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">
                  {m.title}
                </h3>
                <p className="mt-0.5 text-[14.5px] leading-normal text-lp-body">{m.summary}</p>
              </div>
              <button
                ref={closeBtn}
                type="button"
                onClick={close}
                aria-label="Close"
                className="-mr-2 -mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-lp-muted transition-colors hover:bg-lp-canvas hover:text-lp-ink"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="overflow-y-auto">
              <div className="grid divide-y divide-lp-line md:grid-cols-3 md:divide-x md:divide-y-0">
                <Block title="Features">
                  <ul className="space-y-2">
                    {m.features.map((f) => (
                      <li key={f} className="flex gap-2.5">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lp-brand" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </Block>
                <Block title="Everyday example">
                  <p>{m.example}</p>
                </Block>
                <Block title={`What ${AI} automates`} icon={Sparkles}>
                  <ul className="space-y-2">
                    {m.automation.map((a) => (
                      <li key={a} className="flex gap-2.5">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-ai-done" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </Block>
              </div>

              <div className="flex items-center gap-3 border-t border-lp-line bg-lp-brand/[0.06] px-6 py-4">
                <Clock className="h-4.5 w-4.5 shrink-0 text-lp-brand" strokeWidth={2} />
                <p className="text-[14.5px] text-lp-ink">
                  <b className="font-semibold">Time saved:</b> {m.saving}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-lp-line px-4 py-3 text-[13px]">
              <button
                type="button"
                onClick={() => show((open - 1 + modules.length) % modules.length)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-lp-body transition-colors hover:bg-lp-canvas hover:text-lp-ink"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{modules[(open - 1 + modules.length) % modules.length].title}</span>
                <span className="sm:hidden">Previous</span>
              </button>
              <span className="text-lp-muted">
                {open + 1} of {modules.length}
              </span>
              <button
                type="button"
                onClick={() => show((open + 1) % modules.length)}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium text-lp-body transition-colors hover:bg-lp-canvas hover:text-lp-ink"
              >
                <span className="hidden sm:inline">{modules[(open + 1) % modules.length].title}</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="px-6 py-5 text-[14px] leading-[1.6] text-lp-body">
      <p className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-lp-muted">
        {Icon && <Icon className="h-3.5 w-3.5 text-ai-done" strokeWidth={2} />}
        {title}
      </p>
      {children}
    </div>
  );
}
