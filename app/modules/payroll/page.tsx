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
  Example,
  Figures,
  Flow,
  Fn,
  Ledger,
  Note,
  P,
  PartHeading,
} from "@/components/landing/guide";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: `Payroll module`, // the root layout appends "· Tax GO"
  description: `The ${AI} payroll module in full: salary structures, payroll runs, payslips, expense claims, investment declarations and verification, employee loans, final settlements and statutory file exports.`,
};

const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

type Photo = [src: string, alt: string];

const expensePhotos: Photo[] = [
  ["/payroll/expense-1.jpg", "Someone scanning a receipt with a phone"],
  ["/payroll/expense-2.jpg", "Travel expenses being prepared"],
  ["/payroll/expense-3.jpg", "Receipts and tax documents being reviewed"],
];

const settlementPhotos: Photo[] = [
  ["/payroll/settlement-1.jpg", "An employee handing in a resignation letter"],
  ["/payroll/settlement-2.jpg", "An exit management discussion"],
  ["/payroll/settlement-3.jpg", "Final settlement paperwork being reviewed"],
];

/** The monthly salary structure. */
const structure: [string, string, string][] = [
  ["Basic salary", "Earnings", "$5,000"],
  ["Housing allowance", "Earnings", "$1,000"],
  ["Transport allowance", "Earnings", "$300"],
  ["Performance bonus", "Earnings", "$500"],
  ["Overtime", "Earnings", "$200"],
  ["Income tax", "Deduction", "$1,200"],
  ["Pension contribution", "Deduction", "$350"],
  ["Social insurance", "Deduction", "$200"],
  ["Employee loan repayment", "Deduction", "$250"],
];

/** What a payroll run goes through. */
const runSteps: [string, string][] = [
  ["Collect", "Salaries, attendance, overtime, leave, bonuses, approved claims"],
  ["Compute", "Gross earnings, deductions, contributions, net salaries"],
  ["Validate", "Missing information, exceptions, unexpected variations"],
  ["Approve", "Authorised review of the whole run"],
  ["Post", "Salary expenses, liabilities and deductions to the ledger"],
  ["Payslips", "Individual compensation statements"],
  ["Disburse", "Authorised payments, or the bank upload file"],
  ["Reconcile", "Confirm settlement and close the control accounts"],
];

/** The November run. */
const runFigures: [string, string][] = [
  ["Employees included", "250"],
  ["Gross salaries", "$1,250,000"],
  ["Income tax deductions", "$225,000"],
  ["Employee contributions", "$100,000"],
  ["Loan deductions", "$25,000"],
  ["Net salaries payable", "$900,000"],
  ["Employer contributions", "$150,000"],
  ["Total employer cost", "$1,400,000"],
];

/** The expense categories. */
const expenseCategories: [string, string][] = [
  ["Business travel", "Flights, trains and taxis"],
  ["Accommodation", "Hotels and business lodging"],
  ["Meals", "Approved business meals"],
  ["Mileage", "Business use of a personal vehicle"],
  ["Office supplies", "Stationery and work materials"],
  ["Telecommunications", "Approved telephone and internet"],
  ["Professional development", "Training and course fees"],
  ["Client entertainment", "Authorised business hospitality"],
  ["Other expenses", "Approved business expenditure"],
];

/** One claim, line by line. */
const claim: [string, string, boolean][] = [
  ["Flight tickets", "$650.00", true],
  ["Hotel accommodation", "$480.00", true],
  ["Taxi fares", "$120.00", true],
  ["Business meals", "$180.00", true],
  ["Mileage", "$75.00", true],
  ["Entertainment", "$95.00", false],
];

/** The Indian declaration categories. */
const declarationTypes: [string, string][] = [
  ["Section 80C", "Eligible investments, provident fund, life insurance and specified payments"],
  ["Section 80D", "Eligible medical insurance premiums and health expenditure"],
  ["HRA", "House rent allowance exemption, subject to conditions"],
  ["LTA", "Leave travel allowance exemption for qualifying travel"],
  ["Section 80CCD", "Eligible pension scheme contributions"],
  ["Other declarations", "Additional eligible deductions or exemptions"],
];

/** Declared against verified. */
const verification: [string, number, number][] = [
  ["Section 80C", 150000, 150000],
  ["Section 80D", 25000, 20000],
  ["HRA", 120000, 100000],
  ["LTA", 30000, 0],
];

/** The kinds of employee financing. */
const loanTypes: [string, string][] = [
  ["Salary advance", "An advance against future salary"],
  ["Interest-free loan", "No contractual interest"],
  ["Interest-bearing loan", "At an agreed rate"],
  ["Emergency loan", "For approved urgent circumstances"],
  ["Housing loan", "For eligible housing purposes"],
  ["Education loan", "Towards approved educational expenditure"],
  ["Vehicle loan", "Towards a vehicle purchase"],
];

/** The settlement. */
const entitlements: [string, string][] = [
  ["Outstanding salary", "$4,500"],
  ["Leave encashment", "$2,000"],
  ["Gratuity entitlement", "$8,000"],
  ["Outstanding bonus", "$1,000"],
  ["Approved expense reimbursement", "$500"],
];

const recoveries: [string, string][] = [
  ["Outstanding employee loan", "$3,000"],
  ["Notice period recovery", "$1,000"],
  ["Statutory tax deductions", "$1,500"],
  ["Salary advance recovery", "$500"],
];

/** The six configured countries. */
const countries: { country: string; flag: string; alt: string; authority: string; detail: string; covers: string }[] = [
  {
    country: "United States",
    flag: "/payroll/flag-us.jpg",
    alt: "The flag of the United States",
    authority: "Internal Revenue Service",
    detail: "Form 1040 for individuals; W-2, W-3, Form 941 and Form 940 for employers.",
    covers: "Federal withholding, Social Security and Medicare",
  },
  {
    country: "Canada",
    flag: "/payroll/flag-canada.jpg",
    alt: "The flag of Canada",
    authority: "Canada Revenue Agency",
    detail: "T1 for individuals; T4 slips and summaries, with payroll remittances.",
    covers: "Income tax withholding, CPP/QPP, EI and provincial requirements",
  },
  {
    country: "Ireland",
    flag: "/payroll/flag-ireland.jpg",
    alt: "The flag of Ireland",
    authority: "Irish Revenue",
    detail: "Form 11 for self-assessment; PAYE submissions through Revenue's framework.",
    covers: "PAYE, PRSI, USC and Revenue Payroll Notifications",
  },
  {
    country: "United Kingdom",
    flag: "/payroll/flag-uk.jpg",
    alt: "The flag of the United Kingdom",
    authority: "HM Revenue & Customs",
    detail: "SA100 for Self Assessment; RTI submissions such as FPS and EPS, plus P60 and P45.",
    covers: "PAYE, National Insurance and workplace pensions",
  },
  {
    country: "India",
    flag: "/payroll/flag-india.jpg",
    alt: "The flag of India",
    authority: "Income Tax Department",
    detail: "Form 24Q for quarterly salary TDS; Form 16 for the employee; PF and ESI files.",
    covers: "TDS, EPF, ESI, professional tax and regional requirements",
  },
  {
    country: "United Arab Emirates",
    flag: "/payroll/flag-uae.jpg",
    alt: "The flag of the United Arab Emirates",
    authority: "Ministry of Human Resources and Emiratisation",
    detail: "WPS salary files, including the applicable Salary Information File formats.",
    covers: "Wage protection, salary payment and end-of-service reporting",
  },
];

/** And the ones the framework can be extended to. */
const moreCountries: [string, string][] = [
  ["Nigeria", "PAYE, pension and statutory contributions"],
  ["South Africa", "PAYE, UIF, SDL, EMP201, EMP501 and IRP5"],
  ["Australia", "Single Touch Payroll, PAYG withholding and superannuation"],
  ["New Zealand", "PAYE, payday filing and KiwiSaver"],
  ["Germany", "Wage tax, electronic reporting and social insurance"],
  ["France", "Income tax withholding and DSN reporting"],
  ["Saudi Arabia", "Wage Protection System and GOSI contributions"],
  ["Kenya", "PAYE and social and health contributions"],
  ["Ghana", "PAYE and SSNIT contributions"],
  ["Morocco", "Income tax withholding and CNSS reporting"],
  ["Singapore", "CPF and employee income reporting"],
  ["Indonesia", "PPh 21 and BPJS contributions"],
];

/** Four categories of statutory report. */
const reportKinds: [string, string, string][] = [
  ["Individual income tax returns", "Annual declarations of income, deductions and liabilities", "1040 · T1 · Form 11 · SA100"],
  ["Employer payroll reporting", "Employee earnings and employer withholding", "W-2 · T4 · PAYE · RTI · Form 24Q"],
  ["Social security & pension", "Employee and employer contributions to statutory schemes", "CPP · PRSI · NI · PF · ESI · GOSI"],
  ["Salary disbursement files", "Payment instructions for the bank", "WPS · SEPA · NACHA · Bank CSV"],
];

/** The compliance centre. */
const filings: [string, string, string, "ok" | "wait" | "no"][] = [
  ["🇺🇸 USA", "Form W-2", "Draft", "wait"],
  ["🇨🇦 Canada", "T4", "Draft", "wait"],
  ["🇮🇪 Ireland", "PAYE submission", "Accepted", "ok"],
  ["🇬🇧 UK", "RTI / FPS", "Accepted", "ok"],
  ["🇮🇳 India", "Form 24Q", "Review required", "no"],
  ["🇦🇪 UAE", "WPS salary file", "Ready for review", "wait"],
];

/** The payroll dashboard. */
const dashboard: [string, string][] = [
  ["Employees on payroll", "250"],
  ["Gross monthly payroll", "$1.25M"],
  ["Net salaries payable", "$900K"],
  ["Total employer cost", "$1.40M"],
  ["Statutory liabilities", "$475K"],
  ["Outstanding expense claims", "$32,500"],
  ["Employee loan balances", "$185K"],
  ["Monthly loan recoveries", "$25,000"],
  ["Pending expense approvals", "18"],
  ["Pending verifications", "12"],
  ["Final settlements pending", "3"],
  ["Payrolls awaiting approval", "1"],
];

/** Where payroll connects. */
const integrations: [string, string][] = [
  ["Human resources", "Employee records, structures and approved increases"],
  ["Attendance", "Actual working hours and exceptions"],
  ["Leave management", "Paid, unpaid and encashed leave"],
  ["Shift planning", "Working patterns and shift allowances"],
  ["Timesheets", "Approved hours and project allocation"],
  ["Projects", "Labour costs and project profitability"],
  ["Manufacturing", "Direct labour and production costing"],
  ["Sales", "Approved commission information"],
  ["Banking", "Net salary payments and remittances"],
  ["Employee loans", "Principal and interest recovery"],
  ["Budgeting", "Salary budgets and workforce forecasts"],
  ["Accounting", "Journals, expenses, liabilities and receivables"],
  ["Tax compliance", "Employee and employer statutory reporting"],
  ["AI agents", "Authorised preparation, validation and exceptions"],
];

/** Project labour allocation. */
const allocation: [string, number, number][] = [
  ["Project A", 120, 6000],
  ["Project B", 80, 4000],
  ["Project C", 60, 3000],
  ["Administration", 40, 2000],
];

/** The indicators. */
const kpis: [string, string][] = [
  ["Gross payroll cost", "Total earnings before deductions"],
  ["Total employer payroll cost", "Gross plus employer contributions and additional costs"],
  ["Average employee cost", "Employer payroll cost divided by headcount"],
  ["Payroll-to-revenue ratio", "Payroll expenditure against revenue"],
  ["Payroll variance", "Actual payroll against budget"],
  ["Overtime cost ratio", "Overtime against gross payroll"],
  ["Payroll accuracy rate", "Calculations without a confirmed error"],
  ["On-time payment rate", "Employees paid by the required date"],
  ["Loan recovery rate", "Actual recoveries against scheduled"],
  ["Reimbursement turnaround", "Claim submitted to reimbursed"],
  ["Statutory compliance rate", "Obligations completed correctly and on time"],
  ["Payroll processing time", "To prepare, review and complete a run"],
];

/** What you can ask her. */
const asks: [string, string][] = [
  ["Salary structures", "Review all structures and identify inconsistent deductions."],
  ["Payroll runs", "Prepare this month's payroll and compare it against last month."],
  ["Payslips", "Generate payslips for the approved run."],
  ["Expense claims", "Review outstanding claims and identify missing receipts."],
  ["Investment declarations", "Summarise declarations and missing documents."],
  ["Declaration verification", "Highlight ineligible or unverified amounts."],
  ["Employee loans", "Calculate this month's scheduled deductions."],
  ["Full & final settlement", "Prepare settlements for departing employees."],
  ["Statutory exports", "Prepare supported compliance files for our countries."],
];

/** Who does what. */
const duties: [string, string][] = [
  ["Human resources", "Maintain records and approved compensation"],
  ["Payroll administrator", "Prepare payroll and investigate exceptions"],
  ["Finance manager", "Review calculations, budgets and entries"],
  ["Authorised approver", "Give final payroll approval"],
  ["Bank signatory", "Authorise the disbursement"],
  ["Financial controller", "Reconcile liabilities and settlements"],
  ["Auditor", "Independently review controls and evidence"],
];

const controls: [string, string][] = [
  ["Employee master data validation", "Prevent fictitious or duplicate records"],
  ["Salary structure authorisation", "Prevent unauthorised compensation changes"],
  ["Merit cycle validation", "Ensure increments were approved"],
  ["Attendance and overtime review", "Prevent incorrect working-hour payments"],
  ["Expense claim verification", "Prevent duplicate or unauthorised reimbursements"],
  ["Investment proof verification", "Recognise only eligible tax relief"],
  ["Statutory calculation validation", "Catch incorrect tax and contributions"],
  ["Employee loan reconciliation", "Prevent incorrect deductions and balances"],
  ["Payroll variance analysis", "Identify unusual compensation movements"],
  ["Bank account verification", "Reduce salary diversion and payment fraud"],
  ["Payroll approval", "Establish management accountability"],
  ["General ledger validation", "Ensure the journals balance"],
  ["Payment authorisation", "Prevent unauthorised transfers"],
  ["Bank reconciliation", "Confirm the salaries actually landed"],
  ["Final settlement review", "Prevent incorrect departure payments"],
  ["Statutory export validation", "Reduce incorrect or rejected filings"],
  ["Role-based access", "Protect confidential compensation information"],
  ["Payroll period locking", "Prevent retrospective changes"],
  ["Audit trail", "Maintain traceability"],
  ["AI permissions", "Restrict automated actions to approved authority"],
];

export default function PayrollPage() {
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
              Pay accurately. <Serif className="text-[32px] sm:text-[40px]">Comply globally.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              Nine functions covering the whole compensation lifecycle: defining salary structures, calculating pay,
              applying statutory deductions, issuing payslips, posting the journals and preparing the bank
              disbursement — plus expenses, tax declarations, employee loans, departures and country filings.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              Configure, calculate, approve, post, pay, report — with the approvals kept firmly in human hands.
            </p>
          </div>
        </Container>
      </section>

      {/* the nine functions */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Configuration & processing" />

            <Fn id="structures" title="Salary structures — the template behind the pay">
              <P>
                A reusable template setting out how earnings, allowances, deductions and employer contributions are
                organised, rather than configuring every employee by hand.
              </P>
              <DataTable
                head={["Component", "Type", "Monthly amount"]}
                rows={[
                  ...structure.slice(0, 5).map((s) => [...s]),
                  [
                    <b key="g" className="font-semibold text-lp-ink">Gross earnings</b>,
                    "",
                    <b key="gv" className="font-semibold text-lp-ink">$7,000</b>,
                  ],
                  ...structure.slice(5).map((s) => [...s]),
                  [
                    <b key="d" className="font-semibold text-lp-ink">Total deductions</b>,
                    "",
                    <b key="dv" className="font-semibold text-lp-ink">$2,000</b>,
                  ],
                  [
                    <b key="n" className="font-semibold text-lp-ink">Net salary payable</b>,
                    "",
                    <b key="nv" className="font-semibold text-lp-ink">$5,000</b>,
                  ],
                ]}
              />
              <PayBar />
              <Warning>
                Employer contributions are calculated separately: they are an additional cost to the organisation, not
                a deduction from the employee&rsquo;s net pay.
              </Warning>
              <AiNote>
                {AI} can find inconsistent structures, missing deductions, unusual components and salaries that drift
                outside the approved compensation bands.
              </AiNote>
            </Fn>

            <Fn id="runs" title="Payroll runs — compute, approve, post, pay">
              <P>
                The controlled process of calculating a period&rsquo;s compensation, applying deductions, getting
                approval, posting the accounting and preparing the disbursement.
              </P>
              <Flow steps={runSteps.slice(0, 4)} />
              <Flow steps={runSteps.slice(4)} />
              <Caption>Example — November 2026</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {runFigures.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 rounded-xl border border-needs-human/30 bg-needs-human/6 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-needs-human">
                  Validation summary
                </p>
                <ul className="mt-2.5 space-y-1 text-[13.5px] text-lp-body">
                  {[
                    "247 employee calculations validated",
                    "One unusually high overtime claim",
                    "Two employees with incomplete bank information",
                    "Payroll awaiting management approval",
                  ].map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </div>
              <Caption>The payroll journal</Caption>
              <Ledger
                rows={[
                  ["Salaries and wages expense", "$1,250,000", "—"],
                  ["Employer contribution expense", "$150,000", "—"],
                  ["Income tax payable", "—", "$225,000"],
                  ["Employee contributions payable", "—", "$100,000"],
                  ["Employer contributions payable", "—", "$150,000"],
                  ["Employee loan receivables", "—", "$25,000"],
                  ["Net salaries payable", "—", "$900,000"],
                ]}
              />
              <Caption>And when the salaries are paid</Caption>
              <Ledger
                rows={[
                  ["Net salaries payable", "$900,000", "—"],
                  ["Bank account", "—", "$900,000"],
                ]}
              />
              <Warning>
                Generating a bank file does not mean anyone has been paid — the disbursement still has to be confirmed
                and reconciled. Preparation, approval, posting and payment authorisation stay separate, and posted
                corrections go through controlled adjustments rather than editing.
              </Warning>
              <AiNote>
                {AI} can calculate the run, compare it against last period, flag unusual movements, validate the
                deductions and prepare the journals and disbursement information for approval.
              </AiNote>
            </Fn>

            <Fn id="payslips" title="Payslips — what each employee receives">
              <P>
                The individual statement from a run: earnings, deductions and the net salary for the period, for the
                employee&rsquo;s own clarity and for the record.
              </P>
              <Caption>Example — November 2026</Caption>
              <div className="mt-3 overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-lp-line px-5 py-4">
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">Sarah Williams</p>
                    <p className="mt-0.5 text-[13px] text-lp-muted">
                      EMP-0045 · Finance Manager · Global Business Services Ltd
                    </p>
                  </div>
                  <p className="text-[13px] text-lp-muted">PR-2026-011 · paid 30 November · CAD</p>
                </div>
                <div className="grid gap-5 px-5 py-4 sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Earnings</p>
                    <ul className="mt-2 space-y-1 text-[13.5px]">
                      {structure.slice(0, 5).map(([name, , amount]) => (
                        <li key={name} className="flex justify-between gap-4 border-b border-lp-line pb-1">
                          <span className="text-lp-body">{name}</span>
                          <span className="text-lp-ink">{amount}.00</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-4 pt-1 font-semibold text-lp-ink">
                        <span>Gross earnings</span>
                        <span>$7,000.00</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Deductions</p>
                    <ul className="mt-2 space-y-1 text-[13.5px]">
                      {structure.slice(5).map(([name, , amount]) => (
                        <li key={name} className="flex justify-between gap-4 border-b border-lp-line pb-1">
                          <span className="text-lp-body">{name}</span>
                          <span className="text-lp-ink">{amount}.00</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-4 pt-1 font-semibold text-lp-ink">
                        <span>Total deductions</span>
                        <span>$2,000.00</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="flex items-baseline justify-between border-t border-lp-line bg-lp-brand/6 px-5 py-3.5">
                  <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-lp-brand">
                    Net salary payable
                  </span>
                  <span className="text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">$5,000.00</span>
                </div>
              </div>
              <Warning>A payslip is a compensation statement. It is not proof that the bank payment completed.</Warning>
              <AiNote>
                She can explain what a component means, highlight what changed since last month and answer an
                employee&rsquo;s question inside their own access permissions.
              </AiNote>
            </Fn>

            <PartHeading title="Expenses & tax declarations" />

            <Fn id="expenses" title="Expense claims — paying people back">
              <P>
                A structured route for submitting, reviewing, approving and reimbursing what employees spend on the
                business.
              </P>
              <Photos photos={expensePhotos} />
              <DataTable head={["Category", "Examples"]} rows={expenseCategories.map((e) => [...e])} />
              <Caption>Example — EXP-2026-0085, a business development trip</Caption>
              <DataTable
                head={["Expense", "Amount", "Documentation"]}
                rows={claim.map(([name, amount, provided]) => [
                  name,
                  amount,
                  <Status key={name} kind={provided ? "ok" : "no"}>
                    {provided ? "Provided" : "Missing"}
                  </Status>,
                ])}
              />
              <Figures
                items={[
                  ["Total submitted", "$1,600.00"],
                  ["Validated", "$1,505.00"],
                  ["Needing review", "$95.00"],
                ]}
              />
              <Ledger
                rows={[
                  ["Business travel and other expenses", "$1,505", "—"],
                  ["Employee reimbursement payable", "—", "$1,505"],
                ]}
              />
              <Ledger
                rows={[
                  ["Employee reimbursement payable", "$1,505", "—"],
                  ["Bank account", "—", "$1,505"],
                ]}
              />
              <Warning>
                A legitimate business reimbursement is not the same thing as a taxable allowance or salary — the
                distinction matters for the employee&rsquo;s tax.
              </Warning>
              <AiNote>
                {AI} can read the receipts, spot duplicate claims, compare spending against policy and prepare the
                reimbursement recommendation.
              </AiNote>
            </Fn>

            <Fn id="declarations" title="Investment declarations — employee tax relief">
              <P>
                Employees declare the investments, expenditure and allowances that may qualify for relief. Relevant
                above all to Indian payroll, where declarations and proofs feed the employer&rsquo;s tax calculation
                and Form 16.
              </P>
              <div className="mt-4 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 lg:flex-row">
                <div className="relative aspect-[3/2] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt lg:w-48">
                  <Image
                    src="/payroll/declarations.jpg"
                    alt="The flag of India"
                    fill
                    sizes="(min-width: 1024px) 192px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <DataTable head={["Category", "What it covers"]} rows={declarationTypes.map((d) => [...d])} />
                </div>
              </div>
              <Caption>Example — one employee&rsquo;s declaration</Caption>
              <DataTable
                head={["Category", "Amount declared"]}
                rows={[
                  ["Eligible Section 80C investments", "₹150,000"],
                  ["Eligible Section 80D expenditure", "₹25,000"],
                  ["HRA exemption claimed", "₹120,000"],
                  ["LTA exemption claimed", "₹30,000"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total submitted</b>,
                    <b key="v" className="font-semibold text-lp-ink">₹325,000</b>,
                  ],
                ]}
              />
              <Warning>
                A declaration does not automatically qualify for relief: it depends on the financial year, the tax
                regime, statutory limits, circumstances and proof. Many traditional deductions are restricted under
                the newer regime, so the regime has to be settled before withholding is adjusted.
              </Warning>
              <AiNote>
                She can organise the declarations, extract information from the proofs, find what is missing and
                estimate the effect on taxable income.
              </AiNote>
            </Fn>

            <Fn id="verification" title="Declaration verification — checking the proofs">
              <P>
                The employer&rsquo;s review of what was declared before any of it reaches a tax calculation — the
                control between a claim and its statutory treatment.
              </P>
              <DataTable
                head={["Declaration", "Verification"]}
                rows={[
                  ["The employee submits", "The employer reviews"],
                  ["Records claimed amounts", "Determines what is accepted"],
                  ["Employee uploads proofs", "Finance or HR validates them"],
                  ["Supports an estimate", "Supports the verified treatment"],
                  ["Does not guarantee eligibility", "Confirms what the employer will apply"],
                ]}
              />
              <Caption>Example — declared against verified</Caption>
              <VerificationChart />
              <DataTable
                head={["Category", "Declared", "Verified", "Difference"]}
                rows={[
                  ...verification.map(([name, declared, verified]) => [
                    name,
                    `₹${declared.toLocaleString("en-US")}`,
                    `₹${verified.toLocaleString("en-US")}`,
                    `₹${(declared - verified).toLocaleString("en-US")}`,
                  ]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="d" className="font-semibold text-lp-ink">₹325,000</b>,
                    <b key="v" className="font-semibold text-lp-ink">₹270,000</b>,
                    <b key="x" className="font-semibold text-lp-ink">₹55,000</b>,
                  ],
                ]}
              />
              <Example>
                ₹1,200,000 of income less ₹270,000 of verified reliefs gives ₹930,000 of adjusted taxable income —
                assuming those reliefs are permitted under the employee&rsquo;s regime.
              </Example>
              <AiNote>
                {AI} can review the uploads, find duplicate proofs, check document dates and highlight the gap between
                declared and verified. The final call stays with an authorised person.
              </AiNote>
            </Fn>

            <PartHeading title="Employee financing & settlement" />

            <Fn id="loans" title="Employee loans & advances — recovered through payroll">
              <P>
                Money lent to an employee and recovered on an agreed schedule, with the instalments deducted
                automatically during the run.
              </P>
              <DataTable head={["Type", "What it is"]} rows={loanTypes.map((l) => [...l])} />
              <Flow
                steps={[
                  ["Request and approve", "Eligibility, policy and repayment capacity"],
                  ["Disburse and schedule", "Recognise the receivable, set the instalments"],
                  ["Deduct and close", "Payroll recovers it until the balance clears"],
                ]}
              />
              <Caption>Example — $12,000 over 12 months</Caption>
              <Ledger
                rows={[
                  ["Employee loan receivable", "$12,000", "—"],
                  ["Bank account", "—", "$12,000"],
                ]}
              />
              <P small>Interest-free, the monthly deduction is $1,000, applied through payroll:</P>
              <Ledger
                rows={[
                  ["Salaries payable", "$1,000", "—"],
                  ["Employee loan receivable", "—", "$1,000"],
                ]}
              />
              <Warning>
                A loan is a receivable, not a salary expense. Where it carries interest, repayments split principal
                from interest — and interest-free or below-market lending may itself be a taxable employee benefit
                depending on the country.
              </Warning>
              <AiNote>
                She can monitor balances, catch missed repayments, calculate the schedules and flag the loans nearing
                settlement.
              </AiNote>
            </Fn>

            <Fn id="settlement" title="Full & final settlement — when someone leaves">
              <P>
                Everything outstanding at a departure, in both directions: entitlements owed to the employee, lawful
                recoveries owed back.
              </P>
              <Photos photos={settlementPhotos} />
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-ai-done/30 bg-ai-done/8 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Entitlements</p>
                  <ul className="mt-2 space-y-1 text-[13.5px]">
                    {entitlements.map(([name, amount]) => (
                      <li key={name} className="flex justify-between gap-4 border-b border-lp-line pb-1 last:border-b-0">
                        <span className="text-lp-body">{name}</span>
                        <span className="font-medium text-lp-ink">{amount}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2.5 flex justify-between text-[14px] font-semibold text-lp-ink">
                    <span>Total</span>
                    <span>$16,000</span>
                  </p>
                </div>
                <div className="rounded-xl border border-needs-human/30 bg-needs-human/8 px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Recoveries</p>
                  <ul className="mt-2 space-y-1 text-[13.5px]">
                    {recoveries.map(([name, amount]) => (
                      <li key={name} className="flex justify-between gap-4 border-b border-lp-line pb-1 last:border-b-0">
                        <span className="text-lp-body">{name}</span>
                        <span className="font-medium text-lp-ink">({amount})</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2.5 flex justify-between text-[14px] font-semibold text-lp-ink">
                    <span>Total</span>
                    <span>($6,000)</span>
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between rounded-xl bg-lp-brand/8 px-5 py-3.5">
                <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-lp-brand">
                  Net final settlement payable
                </span>
                <span className="text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">$10,000</span>
              </div>
              <Caption>The settlement entry</Caption>
              <Ledger
                rows={[
                  ["Salaries expense", "$4,500", "—"],
                  ["Leave encashment liability", "$2,000", "—"],
                  ["Gratuity liability", "$8,000", "—"],
                  ["Bonus expense", "$1,000", "—"],
                  ["Employee reimbursement payable", "$500", "—"],
                  ["Employee loan receivable", "—", "$3,000"],
                  ["Salary advance receivable", "—", "$500"],
                  ["Notice recovery income", "—", "$1,000"],
                  ["Statutory tax payable", "—", "$1,500"],
                  ["Final settlement payable", "—", "$10,000"],
                ]}
              />
              <Warning>
                Existing provisions must be taken into account so nothing is expensed twice. Gratuity, severance,
                leave encashment and notice recovery all vary by country and contract — and not every outstanding
                balance can lawfully be deducted from final wages.
              </Warning>
              <AiNote>
                {AI} can consolidate the entitlements, check the loan balances, find unpaid claims, calculate the
                proposed settlement and prepare the entries for approval.
              </AiNote>
            </Fn>

            <PartHeading title="International statutory compliance" />

            <Fn id="statutory" title="Statutory file exports — what each country wants">
              <P>
                Structured reports for revenue agencies, pension administrators, social insurance bodies and banks.
                Individual tax returns, employer payroll filings, social insurance reports and salary disbursement
                files are related but separate things.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {countries.map((c) => (
                  <div key={c.country} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image
                        src={c.flag}
                        alt={c.alt}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{c.country}</p>
                      <p className="text-[12px] uppercase tracking-[0.1em] text-lp-brand">{c.authority}</p>
                      <p className="mt-1.5 text-[13px] leading-[1.5] text-lp-body">{c.detail}</p>
                      <p className="mt-1.5 text-[12.5px] leading-[1.5] text-lp-muted">{c.covers}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Caption>Four categories, often confused</Caption>
              <DataTable
                head={["Category", "What it is", "Examples"]}
                rows={reportKinds.map((r) => [...r])}
              />
              <Note>
                An individual return can include rental, investment, self-employment and capital gains income that
                payroll never sees — payroll data supports those returns, it does not complete them.
              </Note>
              <Caption>Extending to other countries</Caption>
              <DataTable head={["Country", "Examples of requirements"]} rows={moreCountries.map((c) => [...c])} />
              <Note>
                These are examples of what a multinational payroll may need to support. Production-ready exports and
                direct filing integrations should be confirmed per jurisdiction and reporting year.
              </Note>
              <Caption>The compliance centre</Caption>
              <Figures
                items={[
                  ["Countries configured", "6"],
                  ["Obligations tracked", "24"],
                  ["Completed", "17 · 70.8%"],
                ]}
              />
              <DataTable
                head={["Country", "Reporting item", "Status"]}
                rows={filings.map(([country, item, status, kind]) => [
                  country,
                  item,
                  <Status key={country} kind={kind}>
                    {status}
                  </Status>,
                ])}
              />
              <Warning>
                Generating a statutory file is not filing it. Submission acknowledgments, acceptance by the authority
                and payment reconciliation are all still controls that matter.
              </Warning>
              <AiNote>
                {AI} can consolidate the payroll data, find missing statutory information, validate the totals,
                prepare the supported exports and list what compliance work is outstanding.
              </AiNote>
            </Fn>
          </div>
        </Container>
      </section>

      {/* dashboard + integration */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>The payroll dashboard</Kicker>
          <H2>Compensation, liabilities and what is pending.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 rounded-xl border border-needs-human/30 bg-needs-human/6 px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-needs-human">
              Management attention
            </p>
            <ul className="mt-2.5 grid gap-1.5 text-[13.5px] text-lp-body sm:grid-cols-2">
              {[
                "Two employees have incomplete bank information",
                "Eighteen reimbursement claims await approval",
                "Twelve investment declarations need verification",
                "Three employees need a final settlement",
                "Two statutory validation exceptions are unresolved",
              ].map((line) => (
                <li key={line} className="flex gap-2">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-needs-human" strokeWidth={2} />
                  {line}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <Kicker>One run, many modules</Kicker>
              <h3 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink">
                Where payroll touches the rest.
              </h3>
              <DataTable head={["Module", "Relationship"]} rows={integrations.map((i) => [...i])} />
            </div>
            <div>
              <Kicker>Labour, allocated</Kicker>
              <h3 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink">
                What each project actually cost.
              </h3>
              <p className="mt-4 text-[14.5px] leading-[1.65] text-lp-body">
                Approved timesheets push compensation costs onto the work they belong to.
              </p>
              <DataTable
                head={["Project", "Hours", "Rate", "Labour cost"]}
                rows={[
                  ...allocation.map(([name, hours, cost]) => [name, String(hours), "$50", `$${cost.toLocaleString("en-US")}`]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="h" className="font-semibold text-lp-ink">300</b>,
                    "",
                    <b key="c" className="font-semibold text-lp-ink">$15,000</b>,
                  ],
                ]}
              />
              <Warning>
                Allocations redistribute or capitalise payroll costs already recognised — they must not duplicate
                them in the ledger.
              </Warning>
            </div>
          </div>
        </Container>
      </section>

      {/* KPIs + AI */}
      <section>
        <Container className="py-16">
          <Kicker>Payroll performance indicators</Kicker>
          <H2>Twelve numbers worth watching.</H2>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <DataTable head={["Indicator", "Definition"]} rows={kpis.map((k) => [...k])} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Worked example</p>
              <div className="mt-3 space-y-2">
                {[
                  ["Total employer payroll cost", "$1,400,000"],
                  ["Payroll-to-revenue ratio", "28.0%"],
                  ["Average monthly employee cost", "$5,600"],
                  ["Budget variance", "+$50,000"],
                  ["Annualised payroll cost", "$16,800,000"],
                ].map(([k, v]) => (
                  <div
                    key={k}
                    className="flex items-baseline justify-between gap-4 rounded-xl border border-lp-line bg-lp-card px-4 py-3"
                  >
                    <span className="text-[13.5px] text-lp-body">{k}</span>
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{v}</span>
                  </div>
                ))}
              </div>
              <Note>$1,400,000 actual against a $1,350,000 budget — payroll is over.</Note>
            </div>
          </div>
        </Container>
      </section>

      {/* agentic AI */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Agentic AI across all nine functions</Kicker>
          <H2>
            You ask. She calculates. <Serif className="text-[32px] sm:text-[40px]">You approve.</Serif>
          </H2>
          <div className="mt-8">
            <DataTable
              head={["Function", `What you can ask ${AI}`]}
              rows={asks.map(([fn, q]) => [
                fn,
                <span key={fn} className="font-medium text-lp-ink">
                  &ldquo;{q}&rdquo;
                </span>,
              ])}
            />
          </div>

          <Caption>Example — month-end with the finance manager</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Finance manager</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  {AI}, run payroll for our 250 employees. Include approved overtime, bonuses, expense claims, loan
                  repayments, verified tax declarations and all applicable deductions. Compare it against last month
                  and make sure nothing is missed.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                250 employees, six operating countries, multiple salary structures, one consolidated review.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  ["Gross payroll", "$1,250,000"],
                  ["Total deductions", "$350,000"],
                  ["Net salaries", "$900,000"],
                  ["Employer contributions", "$150,000"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-lp-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{k}</p>
                    <p className="text-[15px] font-semibold text-lp-ink">{v}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "$25,000 of scheduled loan recoveries applied",
                  "Verified declarations and statutory contributions calculated",
                  "Compared against last month and the approved budget",
                  "Balanced journals, payslips and bank files prepared",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Three exceptions: one overtime claim beyond the usual pattern, two employees with incomplete bank
                details.{" "}
                <b className="font-semibold text-lp-ink">
                  Payroll is prepared but not posted or disbursed — ready for your approval.
                </b>
              </p>
            </div>
          </div>
          <Note>Illustrative workflow, subject to supported functionality, permissions and statutory rules.</Note>
        </Container>
      </section>

      {/* controls + philosophy */}
      <section>
        <Container className="py-16">
          <Kicker>Payroll controls & risk</Kicker>
          <H2>The most sensitive ledger in the business.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            An error or an unauthorised change here means unhappy employees, financial loss, incorrect statutory
            reporting and reputational damage.
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <DataTable head={["Control", "Purpose"]} rows={controls.map((c) => [...c])} />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">
                Segregation of duties
              </p>
              <ul className="mt-3 space-y-2">
                {duties.map(([role, work]) => (
                  <li key={role} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{role}</p>
                    <p className="mt-0.5 text-[12.5px] text-lp-muted">{work}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              ["/payroll/philosophy-1.jpg", "Finance professionals at work"],
              ["/payroll/philosophy-2.jpg", "A manager listening to an employee"],
              ["/payroll/philosophy-3.jpg", "A payroll team reviewing figures"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-alt">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} payroll philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              More than paying salaries. Financial responsibility towards people.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              Every employee expects to be paid accurately and on time. Every business needs to understand what its
              workforce costs. Every government expects compliance with its tax and employment law. Those three
              things meet in one process every month.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-lp-body">
              A payroll department should not have to grow headcount just because the company did. She calculates,
              prepares and validates; finance keeps the authorisation, the exceptions, the postings and the
              disbursements.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — Pay accurately. Operate efficiently.{" "}
              <span className="text-lp-brand">Comply globally.</span>
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

function Photos({ photos }: { photos: Photo[] }) {
  return (
    <div className="mt-4 grid gap-3 sm:grid-cols-3">
      {photos.map(([src, alt]) => (
        <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-alt">
          <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

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

/** Where the $7,000 goes. */
function PayBar() {
  const parts: [string, number, string][] = [
    ["Net salary", 5000, CHART.green],
    ["Income tax", 1200, CHART.blue],
    ["Pension & social insurance", 550, CHART.amber],
    ["Loan repayment", 250, CHART.orange],
  ];
  const total = 7000;
  return (
    <div className="mt-5">
      <div className="flex h-7 overflow-hidden rounded-lg">
        {parts.map(([label, value, colour]) => (
          <div key={label} style={{ width: `${(value / total) * 100}%`, backgroundColor: colour }} title={label} />
        ))}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
        {parts.map(([label, value, colour]) => (
          <li key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} />
            <span className="flex-1 text-lp-body">{label}</span>
            <span className="font-semibold tabular-nums text-lp-ink">${value.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12.5px] text-lp-muted">$7,000 gross · $5,000 net.</p>
    </div>
  );
}

/** Declared against verified, category by category. */
function VerificationChart() {
  const max = 160000;
  const top = 10;
  const base = 150;
  const left = 62;
  const band = 104;
  const bar = 30;
  const y = (v: number) => base - (v / max) * (base - top);

  return (
    <div>
      <div className="mt-4 flex gap-5 text-[12px] text-lp-muted">
        {[
          ["Declared", CHART.blue],
          ["Verified", CHART.green],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 500 185" className="mt-2 w-full" role="img" aria-label="Declared against verified amounts by category">
        {[0, 80000, 160000].map((v) => (
          <g key={v}>
            <line x1={left} x2="490" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              ₹{v / 1000}K
            </text>
          </g>
        ))}
        {verification.map(([name, declared, verified], i) => {
          const x = left + i * band + (band - bar * 2 - 6) / 2;
          return (
            <g key={name}>
              <rect x={x} y={y(declared)} width={bar} height={base - y(declared)} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 6} y={y(verified)} width={bar} height={Math.max(base - y(verified), 0)} rx="3" fill={CHART.green} />
              <text x={left + i * band + band / 2} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[11px]">
                {name}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-1 text-[12.5px] text-lp-muted">₹270,000 of ₹325,000 verified — 83.1%.</p>
    </div>
  );
}
