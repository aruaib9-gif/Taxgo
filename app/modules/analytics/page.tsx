import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Quote } from "lucide-react";
import { BRAND } from "@/lib/brand";
import {
  Container,
  H2,
  Kicker,
  LandingFooter,
  LandingHeader,
  Serif,
  btnOutline,
  btnPrimary,
} from "@/components/landing/chrome";
import { TLogo, Watermark, WhatsAppButton } from "@/components/landing/brand";
import { BackToTop } from "@/components/landing/back-to-top";
import {
  AiNote,
  Caption,
  DataTable,
  Figures,
  Fn,
  Formula,
  Ledger,
  Note,
  P,
  PartHeading,
} from "@/components/landing/guide";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: `Analytics module`, // the root layout appends "· Tax GO"
  description: `The ${AI} reporting, business intelligence and agentic AI module in full: 35 functions from group consolidation and the financial statements to ratio analysis, report building, eight virtual business managers and predictive automation.`,
};

const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

/** Entity roll-up. */
const entities: [string, number, number][] = [
  ["Canada", 4500000, 1300000],
  ["Ireland", 3200000, 700000],
  ["Nigeria", 2300000, 500000],
];

/** Receivables and payables, by age. */
const ageing: [string, number, number][] = [
  ["Not yet due", 400000, 300000],
  ["1–30 days", 150000, 90000],
  ["31–60 days", 55000, 35000],
  ["61–90 days", 30000, 15000],
  ["Over 90 days", 15000, 10000],
];

/** Where the inventory value sits. */
const stockMix: [string, number, string][] = [
  ["Fast-moving", 425000, CHART.green],
  ["Regular-moving", 300000, CHART.blue],
  ["Slow-moving", 90000, CHART.amber],
  ["Non-moving", 35000, CHART.orange],
];

/** The report library. */
const reportLibrary: [string, string][] = [
  ["Financial reports", "P&L, balance sheet, general ledger, trial balance"],
  ["Sales reports", "Revenue, invoices, customers, commissions"],
  ["Purchase reports", "Vendor spend, bills, purchase orders"],
  ["Inventory reports", "Stock, movements, ageing, valuation"],
  ["Banking reports", "Cash, payments, reconciliations"],
  ["HR & payroll", "Employees, compensation, attendance"],
  ["Tax reports", "VAT, GST and statutory information"],
  ["Project reports", "Time, costs, billing, profitability"],
  ["Manufacturing", "Production, capacity, materials"],
  ["CRM & marketing", "Pipeline, leads and forecasts"],
  ["Retail & POS", "Takings, branches and staff"],
  ["Management reports", "Ratios, budgets, KPIs and forecasts"],
];

/** The exception queue. */
const exceptions: [string, string][] = [
  ["Unbalanced or invalid journal records", "2"],
  ["Potential duplicate vendor bills", "3"],
  ["Invalid or missing tax information", "3"],
  ["Unreconciled bank transactions", "12"],
  ["Negative inventory balances", "4"],
  ["Overdue customer accounts", "8"],
  ["Missing supporting documents", "3"],
];

/** The eight virtual managers. */
const managers: { title: string; role: string; src: string; alt: string; body: string; asks: string[] }[] = [
  {
    title: "Virtual CFO",
    role: "Financial strategy",
    src: "/analytics/cfo.jpg",
    alt: "A finance executive reviewing performance",
    body: "Profitability, cash position, receivables, customer concentration, financial runway, budgets, capital allocation and the financial side of strategy.",
    asks: ["Can we afford to expand into a new country?", "Why are our margins declining?", "What happens if our largest customer leaves?"],
  },
  {
    title: "Virtual Accountant",
    role: "Financial records",
    src: "/analytics/accountant.jpg",
    alt: "An accountant working through a ledger",
    body: "Day-to-day transactions, journal entries, invoice and bill enquiries, account classifications and accounting procedure.",
    asks: ["We paid $12,000 for annual insurance — how should I record it?"],
  },
  {
    title: "Virtual Sales Manager",
    role: "Revenue growth",
    src: "/analytics/sales.jpg",
    alt: "A sales team reviewing their pipeline",
    body: "Pipeline health, conversion, representative performance, lead prioritisation and customer relationships.",
    asks: ["Which deals are most likely to close?", "Which salesperson is performing best?", "Which leads should we contact today?"],
  },
  {
    title: "Virtual HR Manager",
    role: "People operations",
    src: "/analytics/hr.jpg",
    alt: "An HR manager reviewing employee records",
    body: "Headcount, attendance, leave, performance, recruitment, onboarding, compensation and document expiry.",
    asks: ["Which employees have documents expiring within 30 days?", "Which departments are understaffed?", "What is our workforce cost?"],
  },
  {
    title: "Virtual Inventory Manager",
    role: "Stock optimisation",
    src: "/analytics/inventory.jpg",
    alt: "A warehouse manager checking stock",
    body: "Stock levels, reorder timing, ageing, dead stock, classifications, movements and expiry records.",
    asks: ["Which products will run out next week?", "What stock should we transfer?", "How much capital is tied up in dead stock?"],
  },
  {
    title: "Virtual Procurement Officer",
    role: "Supply chain",
    src: "/analytics/procurement.jpg",
    alt: "A procurement officer comparing supplier quotes",
    body: "Vendor performance, purchasing spend, order status, quotation comparisons, supplier concentration and procurement risk.",
    asks: ["Which vendor offers the best overall value?", "Are we too dependent on one supplier?", "Which purchase orders are overdue?"],
  },
  {
    title: "Virtual Compliance Officer",
    role: "Statutory obligations",
    src: "/analytics/compliance.jpg",
    alt: "A compliance officer reviewing tax filings",
    body: "Tax activity, statutory obligations, filing deadlines, payroll remittances, withholding taxes and employee records.",
    asks: ["What statutory obligations are outstanding?", "Which returns are due soon?", "Do our tax reports reconcile with the ledger?"],
  },
  {
    title: "Virtual Treasurer",
    role: "Liquidity management",
    src: "/analytics/treasurer.jpg",
    alt: "A treasury manager watching a cash dashboard",
    body: "Bank balances, cash availability, payment timing, currency exposure, debt obligations, financing needs and liquidity planning.",
    asks: ["Can we meet payroll next week?", "Which payments should we prioritise?", "Will we need funding within 90 days?"],
  },
];

/** The anomalies worth catching. */
const anomalies: [string, string][] = [
  ["Duplicate invoices", "Duplicate payment"],
  ["Unusual vendor bank changes", "Payment diversion"],
  ["Unexpected expense increases", "Cost overruns or incorrect postings"],
  ["Unusual employee payments", "Payroll errors"],
  ["Transactions outside normal patterns", "Unauthorised activity"],
  ["Large manual journal entries", "Financial reporting risk"],
  ["Unexpected inventory adjustments", "Shrinkage or incorrect records"],
  ["Unusual customer credit notes", "Revenue leakage"],
  ["Abnormal tax treatment", "Statutory reporting errors"],
];

/** The executive dashboard. */
const executive: [string, string][] = [
  ["Revenue", "$5,000,000"],
  ["Gross profit", "$2,000,000"],
  ["Net profit", "$600,000"],
  ["Cash and bank", "$500,000"],
  ["Accounts receivable", "$650,000"],
  ["Accounts payable", "$450,000"],
  ["Inventory value", "$850,000"],
  ["Total assets", "$3,500,000"],
  ["Working capital", "$1,300,000"],
  ["Net profit margin", "12%"],
  ["Sales pipeline", "$1,200,000"],
  ["90-day cash forecast", "$380,000"],
];

const priorities: [string, string][] = [
  ["Accelerate collections", "$250,000 in overdue customer invoices"],
  ["Optimise inventory", "Review $125,000 in slow and non-moving stock"],
  ["Manage departmental costs", "Investigate a $70,000 adverse variance"],
  ["Review liquidity", "A projected $120,000 cash decline over 90 days"],
  ["Resolve exceptions", "35 items identified for review"],
];

/** Operations up to action, in eight layers. */
const layers: [string, string][] = [
  ["Business operations", "Sales · Purchases · Inventory · Payroll · Banking · Projects"],
  ["Financial accounting", "General ledger · Trial balance · Classifications"],
  ["Financial reporting", "Consolidation · P&L · Balance sheet · Cash flow"],
  ["Management intelligence", "Ratios · Ageing · Working capital · Cost centres · Exceptions"],
  ["Agentic AI command centre", "The assistant, eight virtual managers, natural language query"],
  ["Predictive & automated", "Forecasting · Collections · Categorisation · Anomalies · Reconciliation"],
  ["Human decision", "Management direction · Financial authority · Risk review"],
  ["Authorised action", "Execute · Monitor · Measure · Improve"],
];

/** The morning briefing. */
const briefing: [string, string][] = [
  ["Virtual CFO", "$5M revenue at a 12% net margin. Operations and marketing need a cost variance review."],
  ["Virtual Accountant", "The trial balance is balanced. Exceptions and unreconciled transactions are listed."],
  ["Virtual Sales Manager", "A $1.2M open pipeline, weighted at $480,000."],
  ["Virtual HR Manager", "250 employees. Seven documents approaching expiry."],
  ["Virtual Inventory Manager", "$850,000 of inventory; $125,000 slow and non-moving."],
  ["Virtual Procurement Officer", "$190,000 of vendor obligations over 30 days, including overdue."],
  ["Virtual Compliance Officer", "Outstanding tax reviews and incomplete statutory records identified."],
  ["Virtual Treasurer", "$500,000 available; the base 90-day forecast closes at $380,000."],
];

/** AI governance. */
const governance: [string, string][] = [
  ["Legal-entity data isolation", "Prevent inappropriate access across companies"],
  ["Role-based permissions", "Limit access to authorised information"],
  ["Source-data traceability", "Connect every report and answer to its records"],
  ["Human approval", "Keep authority over consequential decisions"],
  ["Segregation of duties", "Separate preparation, approval, posting and payment"],
  ["Accounting validation", "Transactions must satisfy accounting requirements"],
  ["AI action audit trail", "Record what the AI proposed and what it did"],
  ["Exception management", "Route uncertain or unusual items for review"],
  ["Period locking", "Prevent changes to closed periods"],
  ["Duplicate prevention", "Avoid repeated transactions and postings"],
  ["Confidentiality controls", "Protect employee, customer and financial information"],
  ["Forecast transparency", "State the assumptions and the limitations"],
  ["Compliance validation", "Apply current statutory requirements"],
  ["Access and action limits", "Stop the AI exceeding its authority"],
];

/** The old way against this one. */
const comparison: [string, string][] = [
  ["What happened?", "What happened, and why"],
  ["Historical reports", "Historical and predictive analysis"],
  ["Find the problems yourself", "Problems surfaced proactively"],
  ["Separately maintained reports", "Integrated across the business"],
  ["Navigate menus for answers", "Ask in natural language"],
  ["Analyse spreadsheets by hand", "AI-assisted analysis"],
  ["Separate departmental reporting", "Specialised virtual managers"],
  ["Periodic management reviews", "Intelligence on demand"],
  ["Repetitive admin", "Permission-controlled automation"],
];

export default function AnalyticsPage() {
  return (
    <div className="lp-site bg-lp-canvas text-lp-body">
      <LandingHeader hrefPrefix="/" />

      {/* heading */}
      <section className="relative overflow-hidden bg-[radial-gradient(ellipse_70%_90%_at_100%_0%,var(--lp-glow-a)_0%,var(--lp-glow-b)_45%,transparent_80%)]">
        <Watermark showTile={false} className="left-1/2 top-0 hidden w-320 -translate-x-1/2 text-(--lp-map) lg:block" />
        <Container className="relative pb-14 pt-14">
          <div className="relative z-10">
            <Link
              href="/handles"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-lp-muted transition-colors hover:text-lp-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Her task &amp; our products
            </Link>
            <H2 className="mt-7">
              What happened. <Serif className="text-[32px] sm:text-[40px]">And what to do next.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              Reporting, consolidation, management accounting, forecasting and a set of intelligent assistants in one
              place. Accounting software tells you what has happened; this module is built to tell you why, what could
              happen next, and what management might do about it.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              Record → report → analyse → predict → recommend → act. Thirty-five functions, eight virtual business
              managers, one ledger underneath.
            </p>
          </div>
        </Container>
      </section>

      {/* the 35 functions */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Consolidation & the financial statements" />

            <Fn id="consolidation" title="Group consolidation — every entity, one view">
              <P>
                A consolidated financial view across the active company and every legal entity beneath it — for
                holding companies, subsidiaries and businesses spread across jurisdictions and currencies.
              </P>
              <EntityChart />
              <DataTable
                head={["Legal entity", "Revenue", "Expenses", "Profit"]}
                rows={[
                  ["Canada", "$4,500,000", "$3,200,000", "$1,300,000"],
                  ["Ireland", "$3,200,000", "$2,500,000", "$700,000"],
                  ["Nigeria", "$2,300,000", "$1,800,000", "$500,000"],
                  ["Combined total", "$10,000,000", "$7,500,000", "$2,500,000"],
                  ["Intercompany eliminations", "($500,000)", "($500,000)", "$0"],
                  [
                    <b key="g" className="font-semibold text-lp-ink">Consolidated group</b>,
                    <b key="r" className="font-semibold text-lp-ink">$9,500,000</b>,
                    <b key="e" className="font-semibold text-lp-ink">$7,000,000</b>,
                    <b key="p" className="font-semibold text-lp-ink">$2,500,000</b>,
                  ],
                ]}
              />
              <Warning>
                A legal-entity roll-up is not the same as statutory consolidation, which may also need intercompany
                eliminations, ownership adjustments, non-controlling interests and other standards-driven changes.
              </Warning>
              <AiNote>
                {AI} can identify underperforming subsidiaries, intercompany discrepancies, currency exposure and
                where profitability differs by country.
              </AiNote>
            </Fn>

            <Fn id="general-ledger" title="General ledger — every posted transaction">
              <P>
                The central record, organised by account. Every invoice, bill, payroll journal and depreciation entry
                ends up here.
              </P>
              <Caption>Example — a bank account ledger</Caption>
              <DataTable
                head={["Date", "Description", "Debit", "Credit", "Balance"]}
                rows={[
                  ["Nov 1", "Opening balance", "—", "—", "$50,000"],
                  ["Nov 3", "Customer receipt", "$15,000", "—", "$65,000"],
                  ["Nov 5", "Vendor payment", "—", "$8,000", "$57,000"],
                  ["Nov 10", "Customer receipt", "$25,000", "—", "$82,000"],
                  ["Nov 15", "Payroll payment", "—", "$20,000", "$62,000"],
                  ["Nov 20", "Bank charges", "—", "$150", "$61,850"],
                ]}
              />
              <AiNote>
                She can explain an unusual transaction, spot a wrong classification and find the records you describe
                in plain language.
              </AiNote>
            </Fn>

            <Fn id="trial-balance" title="Trial balance — the arithmetic check">
              <P>
                Debit and credit balances for every account at a date, confirming the double entry adds up and giving
                the statements their starting point.
              </P>
              <Figures
                items={[
                  ["Total debits", "$2,000,000"],
                  ["Total credits", "$2,000,000"],
                  ["Difference", "$0.00"],
                ]}
              />
              <Warning>
                Balanced is not the same as correct. Missing transactions, wrong classifications and duplicate
                postings all survive a clean trial balance.
              </Warning>
              <AiNote>
                {AI} can review abnormal balances, suspense accounts, unusual movements and the adjustments they
                suggest.
              </AiNote>
            </Fn>

            <Fn id="income-statement" title="Income statement — profitability over a period">
              <P>
                Trading account, gross profit, operating expenses, finance costs, tax and net profit.
              </P>
              <div className="mt-4 space-y-1.5">
                {[
                  ["Sales revenue", "$5,000,000", "Income from trading", false],
                  ["Less: cost of sales", "($3,000,000)", "Direct costs of goods and services", false],
                  ["Gross profit", "$2,000,000", "40% gross margin", true],
                  ["Less: operating expenses", "($1,200,000)", "Salaries, rent, marketing, admin", false],
                  ["Operating profit", "$800,000", "Profit from operations", true],
                  ["Less: finance costs & tax", "($200,000)", "Interest and income tax", false],
                  ["Net profit", "$600,000", "12% net margin", true],
                ].map(([label, amount, note, strong]) => (
                  <div
                    key={label as string}
                    className={cn(
                      "flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl px-4 py-2.5",
                      strong ? "bg-lp-brand/8" : "bg-lp-card border border-lp-line",
                    )}
                  >
                    <span className={cn("text-[13.5px]", strong ? "font-semibold text-lp-ink" : "text-lp-body")}>{label}</span>
                    <span className="text-[12.5px] text-lp-muted">{note}</span>
                    <span className={cn("text-[15px] tabular-nums", strong ? "font-semibold text-lp-ink" : "text-lp-body")}>
                      {amount}
                    </span>
                  </div>
                ))}
              </div>
              <AiNote>
                She can explain a margin falling, identify the expenses growing, compare against budget and point at
                what needs attention.
              </AiNote>
            </Fn>

            <Fn id="balance-sheet" title="Balance sheet — position at a date">
              <P>Assets, liabilities and equity, on the oldest equation there is.</P>
              <Formula>Assets = Liabilities + Equity</Formula>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Total assets · $3.5M</p>
                  <ul className="mt-2 space-y-1 text-[13.5px]">
                    {[
                      ["Cash and bank", "$500K"],
                      ["Accounts receivable", "$650K"],
                      ["Inventory", "$850K"],
                      ["Net fixed assets", "$1.5M"],
                    ].map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-4 border-b border-lp-line pb-1 last:border-b-0">
                        <span className="text-lp-body">{k}</span>
                        <span className="font-medium text-lp-ink">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Liabilities & equity · $3.5M</p>
                  <ul className="mt-2 space-y-1 text-[13.5px]">
                    {[
                      ["Accounts payable", "$450K"],
                      ["Other current liabilities", "$250K"],
                      ["Long-term loans", "$800K"],
                      ["Shareholders&rsquo; equity", "$2.0M"],
                    ].map(([k, v]) => (
                      <li key={k} className="flex justify-between gap-4 border-b border-lp-line pb-1 last:border-b-0">
                        <span className="text-lp-body">{k}</span>
                        <span className="font-medium text-lp-ink">{v}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <AiNote>
                {AI} can assess liquidity, debt exposure, working capital adequacy, asset composition and how the
                position has shifted.
              </AiNote>
            </Fn>

            <Fn id="cash-flow" title="Cash flow statement — profit is not cash">
              <P>
                How cash moved through operating, investing and financing activity — because a profitable business is
                not automatically a cash-rich one.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {[
                  ["Operating", "+$750,000", "Collections, payments, salaries"],
                  ["Investing", "−$300,000", "Equipment, property, disposals"],
                  ["Financing", "−$150,000", "Borrowing, repayments, dividends"],
                ].map(([label, value, note]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-1 text-[18px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                    <p className="text-[12px] text-lp-muted">{note}</p>
                  </div>
                ))}
              </div>
              <Figures
                items={[
                  ["Opening cash", "$200,000"],
                  ["Net movement", "+$300,000"],
                  ["Closing cash", "$500,000"],
                ]}
              />
              <AiNote>
                She can explain the gap between profit and cash, show where cash is going and judge whether the
                obligations ahead can be met.
              </AiNote>
            </Fn>

            <PartHeading title="Analysis & working capital" />

            <Fn id="ratios" title="Ratio analysis — the health check">
              <P>
                Relationships between balances that measure profitability, liquidity, efficiency and solvency.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Gross profit margin", "40%"],
                  ["Net profit margin", "12%"],
                  ["Current ratio", "2.86×"],
                  ["Quick ratio", "1.64×"],
                  ["Return on equity", "30%"],
                  ["Debt-to-equity", "0.40×"],
                  ["Receivable days", "47.5"],
                  ["Inventory days", "103.4"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[18px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <DataTable
                head={["Ratio", "Calculation", "What it measures"]}
                rows={[
                  ["Gross profit margin", "Gross profit ÷ revenue", "Trading profitability"],
                  ["Net profit margin", "Net profit ÷ revenue", "Overall profitability"],
                  ["Current ratio", "Current assets ÷ current liabilities", "Short-term liquidity"],
                  ["Quick ratio", "Quick assets ÷ current liabilities", "Immediate liquidity"],
                  ["Debt-to-equity", "Interest-bearing debt ÷ equity", "Financial leverage"],
                  ["Return on assets", "Net profit ÷ average assets", "Asset profitability"],
                  ["Return on equity", "Net profit ÷ average equity", "Shareholder return"],
                  ["Receivable days", "Average receivables ÷ credit sales × 365", "Collection efficiency"],
                  ["Payable days", "Average payables ÷ credit purchases × 365", "Payment timing"],
                  ["Inventory turnover", "Cost of sales ÷ average inventory", "Inventory efficiency"],
                  ["Interest coverage", "EBIT ÷ interest expense", "Ability to service interest"],
                  ["Inventory days", "Average inventory ÷ cost of sales × 365", "Holding period"],
                ]}
              />
              <Note>
                Ratios only mean something against industry benchmarks, your own history and your business model.
                These use closing balances as a simplified proxy for averages.
              </Note>
              <AiNote>
                {AI} can explain a ratio in plain language, show the trend and say what deserves a closer look.
              </AiNote>
            </Fn>

            <Fn id="bills-outstanding" title="Bills outstanding — who owes what, and for how long">
              <P>Unpaid customer invoices and vendor bills, classified by how overdue they are.</P>
              <Figures
                items={[
                  ["Accounts receivable", "$650,000"],
                  ["Accounts payable", "$450,000"],
                  ["Overdue receivables", "$250,000"],
                  ["Overdue payables", "$150,000"],
                ]}
              />
              <AgeingChart />
              <AiNote>
                She can prioritise the overdue accounts, flag collection risk and highlight balances that may need an
                impairment assessment.
              </AiNote>
            </Fn>

            <Fn id="payment-dues" title="Payment dues — what falls due next">
              <P>
                Where bills outstanding ages the whole book, payment dues works partner by partner on what is overdue
                now and what lands in the coming days.
              </P>
              <DataTable
                head={["Vendor", "Overdue", "Next 7 days", "Days 8–30"]}
                rows={[
                  ["Technology Supplies", "$20,000", "$15,000", "$25,000"],
                  ["Logistics Services", "$10,000", "$12,000", "$18,000"],
                  ["Office Supplies", "$5,000", "$8,000", "$12,000"],
                  ["Network Services", "$15,000", "$20,000", "$30,000"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="o" className="font-semibold text-lp-ink">$50,000</b>,
                    <b key="n" className="font-semibold text-lp-ink">$55,000</b>,
                    <b key="d" className="font-semibold text-lp-ink">$85,000</b>,
                  ],
                ]}
              />
              <P small>$190,000 of commitments in total — review the overdue now, prepare the next seven days, plan the rest.</P>
              <AiNote>
                {AI} can recommend what to pay first on available liquidity, contractual terms, supplier importance
                and the receipts expected.
              </AiNote>
            </Fn>

            <Fn id="cash-book" title="Cash & bank book — the statement for any account">
              <P>
                Receipts, payments, transfers, opening and closing balances for any bank account, till or petty cash
                float.
              </P>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ["Canadian operating account", "$250,000"],
                  ["European operating account", "$150,000"],
                  ["Savings account", "$85,000"],
                  ["Petty cash", "$5,000"],
                  ["Retail cash tills", "$10,000"],
                  ["Total", "$500,000"],
                ].map(([place, amount], i, arr) => (
                  <li
                    key={place}
                    className={cn(
                      "flex items-baseline justify-between gap-4 rounded-xl border px-4 py-2.5",
                      i === arr.length - 1 ? "border-lp-brand/40 bg-lp-brand/8" : "border-lp-line bg-lp-card",
                    )}
                  >
                    <span className="text-[13.5px] text-lp-body">{place}</span>
                    <span className="text-[14px] font-semibold tabular-nums text-lp-ink">{amount}</span>
                  </li>
                ))}
              </ul>
              <Note>
                These are ledger records, which can differ from the bank&rsquo;s balance until the reconciling items clear.
              </Note>
              <AiNote>She can find unusual movements, retrieve a payment history and explain a change in balance.</AiNote>
            </Fn>

            <Fn id="group-summary" title="Group summary — balances by account group">
              <P>
                Ledger balances rolled into their top-level groups. Not to be confused with consolidation: this groups
                accounts, that combines legal entities.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {[
                  ["Assets", "$3,500,000", "Current $2.0M · Non-current $1.5M"],
                  ["Liabilities", "$1,500,000", "Current $700K · Non-current $800K"],
                  ["Equity", "$2,000,000", "Share capital and reserves"],
                ].map(([group, value, split]) => (
                  <div key={group} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{group}</p>
                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                    <p className="text-[12px] text-lp-muted">{split}</p>
                  </div>
                ))}
              </div>
              <AiNote>
                {AI} can point out unusual movements within a group and explain how a classification changes the
                reporting.
              </AiNote>
            </Fn>

            <Fn id="fund-flow" title="Fund flow — where the money came from, and went">
              <P>
                The movement of financial resources between two dates. Unlike cash flow, a working-capital fund flow
                can include non-cash resources.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <DataTable
                  head={["Sources of funds", "Amount"]}
                  rows={[
                    ["From operations", "$750,000"],
                    ["New long-term borrowing", "$300,000"],
                    ["New share capital", "$200,000"],
                    ["Disposal of fixed assets", "$100,000"],
                    [<b key="s" className="font-semibold text-lp-ink">Total</b>, <b key="sv" className="font-semibold text-lp-ink">$1,350,000</b>],
                  ]}
                />
                <DataTable
                  head={["Applications of funds", "Amount"]}
                  rows={[
                    ["Equipment acquired", "$500,000"],
                    ["Long-term loan repayments", "$250,000"],
                    ["Dividends", "$150,000"],
                    ["Increase in working capital", "$450,000"],
                    [<b key="a" className="font-semibold text-lp-ink">Total</b>, <b key="av" className="font-semibold text-lp-ink">$1,350,000</b>],
                  ]}
                />
              </div>
              <AiNote>
                She can analyse the financing decisions, the capital allocation and how expansion lines up with the
                funding behind it.
              </AiNote>
            </Fn>

            <Fn id="cost-centre" title="Cost centre — spending by department">
              <P>
                Posted amounts analysed by cost category and cost centre, across departments, projects, branches and
                activities.
              </P>
              <DataTable
                head={["Cost centre", "Budget", "Actual", "Variance"]}
                rows={[
                  ["Finance", "$250,000", "$240,000", <Status key="f" kind="ok">$10,000 favourable</Status>],
                  ["Marketing", "$350,000", "$390,000", <Status key="m" kind="no">$40,000 adverse</Status>],
                  ["Operations", "$850,000", "$900,000", <Status key="o" kind="no">$50,000 adverse</Status>],
                  ["Technology", "$300,000", "$290,000", <Status key="t" kind="ok">$10,000 favourable</Status>],
                  ["HR", "$200,000", "$200,000", <Status key="h" kind="info">On budget</Status>],
                  [
                    <b key="tt" className="font-semibold text-lp-ink">Total</b>,
                    <b key="tb" className="font-semibold text-lp-ink">$1,950,000</b>,
                    <b key="ta" className="font-semibold text-lp-ink">$2,020,000</b>,
                    <Status key="tv" kind="no">$70,000 adverse</Status>,
                  ],
                ]}
              />
              <AiNote>
                {AI} can identify the overspending departments, analyse the cost drivers behind them and explain the
                variance.
              </AiNote>
            </Fn>

            <Fn id="stock-summary" title="Stock summary — capital sitting in inventory">
              <P>
                Balances, valuation and what is moving, across branches, warehouses or the whole business.
              </P>
              <Figures
                items={[
                  ["Total inventory value", "$850,000"],
                  ["Active products", "2,450"],
                  ["Slow and non-moving", "$125,000"],
                ]}
              />
              <StockChart />
              <AiNote>
                She can recommend transfers, identify slow movers, review write-downs and show where working capital
                could be released.
              </AiNote>
            </Fn>

            <PartHeading title="Reporting & analytics" />

            <Fn id="all-reports" title="All reports — one library">
              <P>
                Every financial and operational report in one place, rather than hunting through each module for it.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {reportLibrary.map(([title, text]) => (
                  <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-[1.5] text-lp-muted">{text}</p>
                  </div>
                ))}
              </div>
              <AiNote>
                {AI} can pick the report that answers your question, and help read the result.
              </AiNote>
            </Fn>

            <Fn id="report-builder" title="Report builder — your own views">
              <P>
                Choose a register, pick the columns, filter, group, run — then export it or save it as a reusable
                view.
              </P>
              <DataTable
                head={["Configuration", "Purpose"]}
                rows={[
                  ["Register selection", "Choose the underlying data"],
                  ["Column selection", "Show only what matters"],
                  ["Filters", "Date, branch, customer, vendor and more"],
                  ["Grouping", "Organise into meaningful categories"],
                  ["Export", "Take the results elsewhere"],
                  ["Saved views", "Reuse a configuration"],
                ]}
              />
              <AiNote>
                She can turn a business question into the register, filters and grouping that answer it.
              </AiNote>
            </Fn>

            <Fn id="columnar-register" title="Columnar register — sales, purchases and tax">
              <P>
                Monthly sales and purchase documents laid out with their tax split into columns. Booked documents
                only — drafts and cancellations are excluded.
              </P>
              <DataTable
                head={["Invoice", "Net sales", "GST", "PST", "HST", "Total"]}
                rows={[
                  ["INV-001", "$10,000", "—", "—", "$1,300", "$11,300"],
                  ["INV-002", "$8,000", "$400", "$560", "—", "$8,960"],
                  ["INV-003", "$15,000", "—", "—", "$1,950", "$16,950"],
                  ["INV-004", "$5,000", "$250", "—", "—", "$5,250"],
                  ["INV-005", "$12,000", "—", "—", "—", "$12,000"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="n" className="font-semibold text-lp-ink">$50,000</b>,
                    <b key="g" className="font-semibold text-lp-ink">$650</b>,
                    <b key="p" className="font-semibold text-lp-ink">$560</b>,
                    <b key="h" className="font-semibold text-lp-ink">$3,250</b>,
                    <b key="tt" className="font-semibold text-lp-ink">$54,460</b>,
                  ],
                ]}
              />
              <Note>
                Drafts and cancelled invoices are out; booked invoices are in, paid or not. Credit notes follow the
                same reporting rules.
              </Note>
              <AiNote>
                {AI} can find inconsistent tax classifications, missing tax information and differences between the
                register and the tax reports.
              </AiNote>
            </Fn>

            <Fn id="exceptions" title="Exception reports — the short list that matters">
              <P>
                Transactions and conditions outside the expected accounting, operational or compliance rules. Instead
                of reviewing thousands of normal entries, management looks at the handful that need intervention.
              </P>
              <Figures
                items={[
                  ["Total exceptions", "35"],
                  ["High priority", "8"],
                  ["Other", "27"],
                ]}
              />
              <DataTable head={["Exception", "Count"]} rows={exceptions.map((e) => [...e])} />
              <Warning>
                A flagged transaction needs investigating. It is not by itself evidence of fraud or error.
              </Warning>
              <AiNote>
                She can detect the unusual conditions, rank them, explain the likely causes and draft the corrective
                action.
              </AiNote>
            </Fn>

            <PartHeading title="The AI command centre" />

            <Fn id="command-center" title="AI command center — where the assistants live">
              <P>
                The environment that brings together the assistants, the accounting automations, the forecasting tools
                and the insights — each agent understanding a different part of the business.
              </P>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {[...managers.map((m) => m.title), "Auto-categoriser", "Collections agent", "Cash flow forecaster", "Natural language query", "Anomaly detection", "Smart reconciliation", "Budget forecast"].map((name) => (
                  <span key={name} className="rounded-xl border border-lp-line bg-lp-card px-3.5 py-2.5 text-[13px] text-lp-body">
                    {name}
                  </span>
                ))}
              </div>
              <Note>
                Everything here operates inside the configured permissions, the available information, the applicable
                policies and the authority it has been given.
              </Note>
            </Fn>

            <Fn id="assistant" title="AI assistant — ask in plain language">
              <P>
                A conversation instead of a menu: request information, analyse performance, prepare transactions and
                start supported workflows without knowing which report holds the answer.
              </P>
              <Caption>Example — &ldquo;How is the business doing this month?&rdquo;</Caption>
              <div className="mt-3 rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
                <div className="grid gap-2 sm:grid-cols-4">
                  {[
                    ["Revenue", "$1,100,000"],
                    ["Gross profit", "$440,000"],
                    ["Net profit", "$132,000"],
                    ["Cash", "$500,000"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-lp-card px-3 py-2">
                      <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{k}</p>
                      <p className="text-[15px] font-semibold text-lp-ink">{v}</p>
                    </div>
                  ))}
                </div>
                <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                  {[
                    "$250,000 in overdue customer invoices",
                    "$190,000 of vendor commitments over the next 30 days",
                    "$125,000 tied up in slow and non-moving stock",
                    "Marketing $40,000 above budget",
                  ].map((line) => (
                    <li key={line} className="flex gap-2">
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-needs-human" strokeWidth={2} />
                      {line}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[13.5px] text-lp-body">
                  <b className="font-semibold text-lp-ink">No financial transactions have been executed.</b>
                </p>
              </div>
            </Fn>

            <PartHeading title="Eight virtual business managers" />
            <p className="-mt-2 mb-6 max-w-3xl text-[14.5px] leading-[1.65] text-lp-body">
              Each one specialises in a functional area, works from the same business information, and reports to you.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {managers.map((m) => (
                <div key={m.title} className="overflow-hidden rounded-2xl border border-lp-line bg-lp-card">
                  <div className="relative aspect-[5/2] bg-lp-alt">
                    <Image src={m.src} alt={m.alt} fill sizes="(min-width: 640px) 45vw, 90vw" className="object-cover" />
                  </div>
                  <div className="px-5 pb-5 pt-4">
                    <p className="text-[16px] font-semibold tracking-[-0.03em] text-lp-ink">{m.title}</p>
                    <p className="text-[12.5px] uppercase tracking-[0.12em] text-lp-brand">{m.role}</p>
                    <p className="mt-2 text-[13.5px] leading-[1.6] text-lp-body">{m.body}</p>
                    <ul className="mt-3 space-y-1">
                      {m.asks.map((q) => (
                        <li key={q} className="text-[13px] italic text-lp-muted">
                          &ldquo;{q}&rdquo;
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <Caption>What the Virtual CFO watches</Caption>
              <Figures
                items={[
                  ["Annual revenue", "$5M"],
                  ["Net profit margin", "12%"],
                  ["Working capital", "$1.3M"],
                  ["Cash runway", "6.25 months"],
                ]}
              />
              <Warning>
                Three customers account for 70% of revenue. The runway assumes $500,000 of unrestricted cash against a
                constant $80,000 monthly burn — and the Virtual CFO supports decisions, it does not carry
                management&rsquo;s fiduciary responsibility.
              </Warning>

              <Caption>What the Virtual Accountant does with a question</Caption>
              <P small>
                &ldquo;We paid $12,000 for annual insurance. How should I record it?&rdquo; — it proposes prepayment,
                then the monthly release:
              </P>
              <Ledger
                rows={[
                  ["Prepaid insurance", "$12,000", "—"],
                  ["Bank", "—", "$12,000"],
                ]}
              />
              <Ledger
                rows={[
                  ["Insurance expense", "$1,000", "—"],
                  ["Prepaid insurance", "—", "$1,000"],
                ]}
              />

              <Caption>What the Virtual Procurement Officer sees past price</Caption>
              <DataTable
                head={["Vendor", "Quoted price", "Lead time", "On-time delivery", "Defect rate"]}
                rows={[
                  ["Vendor A", "$50,000", "5 days", "98%", "0.5%"],
                  ["Vendor B", "$47,000", "14 days", "82%", "3.2%"],
                  ["Vendor C", "$51,000", "3 days", "99%", "0.3%"],
                ]}
              />
              <Note>
                Vendor B is cheapest on paper; the delivery time and the defect rate may cost more than the $3,000
                saved.
              </Note>

              <Caption>CFO or treasurer?</Caption>
              <DataTable
                head={["Virtual CFO", "Virtual Treasurer"]}
                rows={[
                  ["Overall financial strategy", "Daily liquidity management"],
                  ["Financial performance", "Bank and cash balances"],
                  ["Profitability and growth", "Payment timing"],
                  ["Capital investment decisions", "Financing and cash availability"],
                  ["Long-term financial planning", "Short-term cash management"],
                ]}
              />
              <Warning>
                Employee-sensitive information stays behind confidentiality and access controls, and employment
                decisions need human oversight.
              </Warning>
            </div>

            <PartHeading title="Accounting & business automations" />

            <Fn id="auto-categoriser" title="Auto-categoriser — classifying what arrives">
              <P>
                Transactions classified from their descriptions, the merchant, historical patterns, supporting
                documents and the configured rules.
              </P>
              <DataTable
                head={["Bank description", "Amount", "Suggested category"]}
                rows={[
                  ["Office Depot", "$125", "Office supplies"],
                  ["Internet provider", "$350", "Telecommunications"],
                  ["Commercial landlord", "$5,000", "Rent"],
                  ["Fuel station", "$180", "Vehicle expenses"],
                  ["Bank service charge", "$45", "Bank charges"],
                  ["Internal account transfer", "$10,000", "Bank transfer"],
                  ["Unidentified payment", "$2,500", <Status key="r" kind="wait">Requires review</Status>],
                ]}
              />
              <Warning>
                Recognising that an internal transfer is not an expense matters as much as classifying the real ones —
                and matching against existing invoices comes first, so nothing is counted twice.
              </Warning>
            </Fn>

            <Fn id="collections" title="Collections agent — chasing what is owed">
              <P>
                Outstanding invoices monitored, prioritised and followed up, with the administrative effort taken off
                the finance team.
              </P>
              <ul className="mt-4 space-y-2">
                {[
                  ["ABC Retail Corporation", "$45,000", "75 days overdue · high priority"],
                  ["Global Distribution Ltd", "$32,000", "48 days overdue · follow-up required"],
                  ["Metro Services Group", "$18,000", "21 days overdue · reminder required"],
                  ["Technology Partners", "$12,000", "7 days overdue · initial reminder"],
                ].map(([name, amount, state]) => (
                  <li
                    key={name}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-lp-line bg-lp-card px-4 py-3"
                  >
                    <span className="text-[13.5px] font-semibold text-lp-ink">{name}</span>
                    <span className="text-[12.5px] text-lp-muted">{state}</span>
                    <span className="text-[15px] font-semibold tabular-nums text-lp-ink">{amount}</span>
                  </li>
                ))}
              </ul>
              <Note>
                $107,000 across the priority accounts — with disputes, payment arrangements and customer sensitivities
                taken into account.
              </Note>
            </Fn>

            <Fn id="forecaster" title="Cash flow forecaster — the next 90 days">
              <P>
                Where the cash flow statement looks back, this looks forward: balances, expected collections,
                anticipated spending and known commitments.
              </P>
              <Figures
                items={[
                  ["Opening cash", "$500,000"],
                  ["90-day projection", "$380,000"],
                  ["Scenarios", "Base · optimistic · stress"],
                ]}
              />
              <Note>
                The point is seeing a shortage before it arrives, testing the alternatives and planning any financing.
              </Note>
            </Fn>

            <Fn id="nl-query" title="Natural language query — questions, not queries">
              <P>
                Ask about authorised business data in ordinary language: the question is interpreted, the data
                retrieved, the figures validated and the answer presented with its workings.
              </P>
              <DataTable
                head={["Question", "Illustrative answer"]}
                rows={[
                  ["What is our total outstanding receivable balance?", "$650,000"],
                  ["How much cash do we have?", "$500,000"],
                  ["What is our net profit margin?", "12%"],
                  ["Which department exceeded its budget most?", "Operations, by $50,000"],
                  ["What is our slow and non-moving inventory worth?", "$125,000"],
                  ["What is our total group revenue?", "$9,500,000 after eliminations"],
                ]}
              />
              <Note>
                An answer should name its period, its entity scope, its currency and its source records, so it can be
                checked.
              </Note>
            </Fn>

            <Fn id="anomalies" title="Anomaly detection — the things no rule caught">
              <P>
                Unusual transactions, patterns and deviations that ordinary reports do not surface — a
                telecommunications bill 400% above its baseline might be a genuine contract payment, a
                misclassification or duplicate billing.
              </P>
              <DataTable head={["Anomaly", "Possible risk"]} rows={anomalies.map((a) => [...a])} />
              <Warning>
                Exception reports catch broken rules; anomaly detection catches odd patterns where no rule was broken.
                A flagged anomaly is an indicator to investigate, not proof of wrongdoing.
              </Warning>
            </Fn>

            <Fn id="reconciliation" title="Smart reconciliation — matching the bank">
              <P>
                Potential matches between bank transactions and the accounting records, judged on amounts,
                references, dates and the parties involved.
              </P>
              <Figures
                items={[
                  ["Transactions imported", "1,250"],
                  ["Matching candidates", "1,180 · 94.4%"],
                  ["Unresolved", "30 · 2.4%"],
                ]}
              />
              <Note>
                Matched records are linked, not re-posted — the effort drops without losing accuracy or the audit
                trail.
              </Note>
            </Fn>

            <Fn id="budget-forecast" title="AI budget forecast — is the plan still achievable?">
              <P>
                History, approved budgets, actuals and commitments combined into a projection — so the plan is tested
                continuously rather than written once.
              </P>
              <DataTable
                head={["Category", "Original budget", "Latest forecast", "Variance"]}
                rows={[
                  ["Revenue", "$12,000,000", "$13,200,000", <Status key="r" kind="ok">$1,200,000 favourable</Status>],
                  ["Cost of sales", "$7,200,000", "$7,700,000", <Status key="c" kind="no">$500,000 adverse</Status>],
                  ["Gross profit", "$4,800,000", "$5,500,000", <Status key="g" kind="ok">$700,000 favourable</Status>],
                  ["Operating expenses", "$3,000,000", "$3,400,000", <Status key="o" kind="no">$400,000 adverse</Status>],
                  ["Operating profit", "$1,800,000", "$2,100,000", <Status key="p" kind="ok">$300,000 favourable</Status>],
                ]}
              />
              <Warning>
                Forecasts are estimates, not guarantees. They should state their assumptions and be updated when
                conditions change.
              </Warning>
            </Fn>
          </div>
        </Container>
      </section>

      {/* executive dashboard */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>The executive dashboard</Kicker>
          <H2>Sales, profit, cash, stock and commitments on one screen.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {executive.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
              </div>
            ))}
          </div>
          <Caption>What she would do first</Caption>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {priorities.map(([title, text]) => (
              <div key={title} className="rounded-xl border border-needs-human/30 bg-needs-human/6 px-4 py-3.5">
                <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                <p className="mt-1 text-[12.5px] leading-[1.5] text-lp-muted">{text}</p>
              </div>
            ))}
          </div>
          <Note>Illustrative annual management overview.</Note>
        </Container>
      </section>

      {/* the layers */}
      <section>
        <Container className="py-16">
          <Kicker>How the 35 fit together</Kicker>
          <H2>Eight layers, from a transaction to an action.</H2>
          <ol className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {layers.map(([title, text]) => (
              <li key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* the morning briefing */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>A day with the management team</Kicker>
          <H2>One question instead of twenty reports.</H2>
          <div className="mt-8 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Business owner · 7:00 am</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  {AI}, review my entire business. How are we performing, what is the sales team doing, how much money
                  do we need, what inventory is outstanding, are our staff records up to date, and what needs me
                  today?
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">
                {AI} — management briefing
              </p>
              <ul className="mt-3 space-y-2">
                {briefing.map(([who, what]) => (
                  <li key={who} className="flex flex-col gap-0.5 border-b border-lp-line/60 pb-2 last:border-b-0">
                    <span className="text-[12.5px] font-semibold uppercase tracking-[0.1em] text-lp-muted">{who}</span>
                    <span className="text-[13.5px] leading-[1.5] text-lp-body">{what}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex gap-2 text-[13.5px] leading-[1.55] text-lp-body">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                <span>
                  Recommended actions prepared.{" "}
                  <b className="font-semibold text-lp-ink">
                    Your approval is required for postings, external communications or payments beyond her configured
                    authority.
                  </b>
                </span>
              </p>
            </div>
          </div>
          <Note>Illustrative cross-functional briefing. No business data has been accessed, no action executed.</Note>
        </Container>
      </section>

      {/* governance + comparison */}
      <section>
        <Container className="py-16">
          <Kicker>AI governance & internal controls</Kicker>
          <H2>Intelligence alongside accountability.</H2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <DataTable head={["Control principle", "Purpose"]} rows={governance.map((g) => [...g])} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">
                Traditional reporting vs this
              </p>
              <DataTable head={["Traditional", `With ${AI}`]} rows={comparison.map((c) => [...c])} />
              <Warning>
                The virtual managers are decision-support assistants, not accountable corporate officers. The
                organisation and its management keep responsibility for the financial statements, the statutory
                obligations and the decisions.
              </Warning>
            </div>
          </div>
        </Container>
      </section>

      {/* philosophy */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["/analytics/philosophy-1.jpg", "Analysts working with financial intelligence tools"],
              ["/analytics/philosophy-2.jpg", "A finance training session in progress"],
              ["/analytics/philosophy-3.jpg", "A global finance and management network"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-canvas">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} analytics philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              From software that records to a business that understands.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              For decades the pattern was the same: the software recorded what had happened, accountants prepared the
              statements, controllers chased discrepancies, the CFO interpreted the result, and management eventually
              decided. The aim here is not to remove human expertise but to amplify it — less repetitive work, better
              information at the moment it is needed.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <div className="mt-8 grid gap-2.5 sm:grid-cols-5">
              {[
                ["Record", "Capture accurate transactions"],
                ["Understand", "Turn them into reports"],
                ["Analyse", "Find the opportunities and risks"],
                ["Anticipate", "Forecast what comes next"],
                ["Act", "Execute what is approved"],
              ].map(([title, text]) => (
                <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5 text-left">
                  <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                  <p className="mt-0.5 text-[12.5px] leading-[1.5] text-lp-muted">{text}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-[15px] leading-[1.7] text-lp-body">
              You ask. She understands. She analyses. She recommends. You approve. She executes.
            </p>
            <p className="mt-6 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — Your business. Your data.{" "}
              <span className="text-lp-brand">Your control.</span>
            </p>
          </div>
        </Container>
      </section>

      {/* final CTA + footer */}
      <div className="relative overflow-hidden bg-lp-navy text-white">
        <Watermark className="-left-10 top-10 hidden w-155 text-white/5 md:block" tile="opacity-25" />
        <section className="relative">
          <Container className="py-24 text-center">
            <TLogo className="mx-auto h-12 w-12" />
            <h2 className="mt-9 text-[34px] font-semibold leading-[1.1] tracking-[-0.045em] sm:text-[42px]">
              Stop running the back office.
              <br />
              <span className="font-serif font-semibold italic tracking-[-0.02em] text-lp-sky">Tell {AI}.</span>
            </h2>
            <div className="mt-8 flex flex-wrap justify-center gap-2.5">
              <Link href="/register" className={btnPrimary}>
                Hire {AI} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link href="/handles" className={cn(btnOutline, "border-white/40 bg-transparent text-white hover:bg-white/5")}>
                See the other modules <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </Container>
        </section>
        <LandingFooter />
      </div>

      <WhatsAppButton />
      <BackToTop />
    </div>
  );
}

/* ---------- this guide's own pieces ---------- */

function Status({ kind, children }: { kind: "ok" | "wait" | "no" | "info"; children: ReactNode }) {
  const tone = {
    ok: "bg-ai-done/12 text-ai-done",
    wait: "bg-needs-human/12 text-needs-human",
    no: "bg-lp-ink/10 text-lp-muted",
    info: "bg-lp-alt text-lp-body",
  }[kind];
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]", tone)}>
      {children}
    </span>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex max-w-3xl gap-2.5 rounded-xl border border-needs-human/30 bg-needs-human/8 px-4 py-3 text-[13.5px] leading-[1.6] text-lp-body">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-needs-human" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}

/** Revenue and profit by legal entity. */
function EntityChart() {
  const max = 5000000;
  const top = 10;
  const base = 150;
  const left = 56;
  const band = 140;
  const bar = 34;
  const y = (v: number) => base - (v / max) * (base - top);

  return (
    <div>
      <div className="mt-4 flex gap-5 text-[12px] text-lp-muted">
        {[
          ["Revenue", CHART.blue],
          ["Profit", CHART.green],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 500 185" className="mt-2 w-full" role="img" aria-label="Revenue and profit by legal entity">
        {[0, 2500000, 5000000].map((v) => (
          <g key={v}>
            <line x1={left} x2="490" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              ${v / 1000000}M
            </text>
          </g>
        ))}
        {entities.map(([name, revenue, profit], i) => {
          const x = left + i * band + (band - bar * 2 - 6) / 2;
          return (
            <g key={name}>
              <rect x={x} y={y(revenue)} width={bar} height={base - y(revenue)} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 6} y={y(profit)} width={bar} height={base - y(profit)} rx="3" fill={CHART.green} />
              <text x={left + i * band + band / 2} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[12px]">
                {name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Receivables against payables, by age. */
function AgeingChart() {
  const max = 400000;
  const top = 10;
  const base = 150;
  const left = 56;
  const band = 86;
  const bar = 24;
  const y = (v: number) => base - (v / max) * (base - top);

  return (
    <div>
      <div className="mt-4 flex gap-5 text-[12px] text-lp-muted">
        {[
          ["Receivables", CHART.blue],
          ["Payables", CHART.orange],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 500 185" className="mt-2 w-full" role="img" aria-label="Receivables and payables by ageing category">
        {[0, 200000, 400000].map((v) => (
          <g key={v}>
            <line x1={left} x2="490" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              ${v / 1000}K
            </text>
          </g>
        ))}
        {ageing.map(([label, receivable, payable], i) => {
          const x = left + i * band + (band - bar * 2 - 4) / 2;
          return (
            <g key={label}>
              <rect x={x} y={y(receivable)} width={bar} height={base - y(receivable)} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 4} y={y(payable)} width={bar} height={base - y(payable)} rx="3" fill={CHART.orange} />
              <text x={left + i * band + band / 2} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[10px]">
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** How the inventory value splits by movement. */
function StockChart() {
  const total = stockMix.reduce((sum, [, value]) => sum + value, 0);
  return (
    <div className="mt-4">
      <div className="flex h-6 overflow-hidden rounded-lg">
        {stockMix.map(([label, value, colour]) => (
          <div key={label} style={{ width: `${(value / total) * 100}%`, backgroundColor: colour }} title={label} />
        ))}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
        {stockMix.map(([label, value, colour]) => (
          <li key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} />
            <span className="flex-1 text-lp-body">{label}</span>
            <span className="font-semibold tabular-nums text-lp-ink">${(value / 1000).toFixed(0)}K</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
