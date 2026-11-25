import { Fragment } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
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
  Flow,
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
  title: `Accounting module`, // the root layout appends "· Tax GO"
  description: `The ${AI} accounting module in full: 16 functions across the general ledger, tax configuration and reporting, fixed assets and depreciation — with worked examples for each.`,
};

/** The accounting cycle, end to end. */
const process: [string, string][] = [
  ["Configure accounting", "Chart of accounts · Fiscal periods · Tax setup · Asset categories"],
  ["Record & automate", "Journals · Recurring entries · Deferrals · Interest · Bills · Assets"],
  ["Validate & control", "Ledger integrity · Period locks · Tax mapping · Approvals"],
  ["Report & analyse", "Tax reports · Financial statements · Depreciation · AI insights"],
];

/** The tax side, from configuration through to the return. */
const taxFlow: [string, string][] = [
  ["Tax types", "GST · HST · PST · VAT · Sales tax"],
  ["Tax rates & categories", "Percentage · Country · Product · Effective date"],
  ["Fiscal position", "Customer and supplier rules · Exports · SEZ · Exemptions"],
  ["Invoice & ledger posting", "Apply the right taxes and record liabilities or recoverables"],
  ["Tax report", "Output tax − recoverable input tax = net tax position"],
];

/** The chart of accounts, as the guide sets it out. */
const coa: [string, string[]][] = [
  ["1000 — Assets", ["1100 — Bank accounts", "1200 — Accounts receivable", "1300 — Inventory", "1500 — Fixed assets"]],
  ["2000 — Liabilities", ["2100 — Accounts payable", "2200 — Tax payable", "2300 — Deferred revenue"]],
  ["3000 — Equity", ["3100 — Share capital", "3200 — Retained earnings"]],
  ["4000 — Income", ["4100 — Sales revenue", "4200 — Service revenue"]],
  ["5000 — Expenses", ["5100 — Salaries", "5200 — Rent", "5300 — Depreciation"]],
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Purchase to financial statements — the 16 functions in one chain. */
const chain: [string, string][] = [
  ["Chart of accounts", "The system identifies the fixed asset and accounts payable accounts."],
  ["Tax configuration", "Applicable purchase taxes are determined and recorded."],
  ["Bill references", "The supplier invoice is registered with its reference and due date."],
  ["Asset register", "The equipment is recorded as a fixed asset."],
  ["Asset category", "The asset inherits its depreciation policy."],
  ["Depreciation", "She calculates the scheduled monthly expense."],
  ["Journal entries", "Depreciation journals are prepared for posting."],
  ["Ledger integrity", "The system validates the journal and the posting rules."],
  ["Fiscal periods", "The entries land in the correct accounting period."],
  ["Financial reporting", "The asset, liability and depreciation expense appear in the statements."],
];

export default function AccountingPage() {
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
              One intelligent ledger. <Serif className="text-[32px] sm:text-[40px]">Complete accounting control.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              {AI} brings the whole accounting cycle into one system — from building a chart of accounts and recording
              daily transactions to automating journals, managing taxes, calculating depreciation and producing financial
              statements. Its foundation is double-entry bookkeeping: every posted transaction carries equal debits and
              credits.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              The aim is to cut the repetitive work while keeping accuracy, financial controls, audit trails and human
              oversight intact.
            </p>
          </div>
        </Container>
      </section>

      {/* the accounting process */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-lp-muted">
            The {AI} accounting process
          </h2>
          <Flow steps={process} />
          <p className="mt-6 max-w-4xl text-[13px] leading-[1.6] text-lp-muted">
            The guide below explains each function: what you enter, how it works and what {AI} should deliver. The
            examples illustrate intended functionality rather than confirming that every workflow is enabled in the live
            product.
          </p>
        </Container>
      </section>

      {/* the 16 functions */}
      <section>
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">

            <div>
              <PartHeading title="Core accounting & general ledger" />

              <Fn id="chart-of-accounts" title="Chart of accounts">
                <P>
                  The chart of accounts is the structured list of financial accounts used to record and classify every
                  business transaction. It is the foundation of the {AI} general ledger.
                </P>
                <P>
                  You can create, edit, group and deactivate accounts, assign account codes, and set parent-child
                  relationships.
                </P>
                <Caption>Example: chart of accounts structure</Caption>
                <ChartOfAccounts />
                <Example>
                  A Canadian company selects Canada as its country and creates accounts for HST payable, HST
                  recoverable, payroll liabilities, bank accounts and sales revenue.
                </Example>
                <AiNote>
                  {AI} can suggest a chart of accounts from the company&rsquo;s country, industry and business
                  activities, subject to your approval.
                </AiNote>
              </Fn>

              <Fn id="journals" title="Journal entries & recurring journals">
                <P>
                  Journal entries move amounts between general ledger accounts using equal debits and credits. They cover
                  adjustments, accruals, corrections, provisions and period-end entries.
                </P>
                <P>
                  Recurring journals automate the entries that repeat monthly, quarterly or annually — an accountant
                  creates a template for $2,000 of rent and schedules it for the last day of every month.
                </P>
                <Flow
                  steps={[
                    ["Create the template", "Accounts · Amount · Frequency · Start and end date"],
                    ["Generate on schedule", "Monthly · Quarterly · Annually"],
                    ["Validate & approve", "Balanced entry → review → post to the ledger"],
                  ]}
                />
                <AiNote>
                  {AI} can spot recurring patterns and recommend templates for depreciation, accruals, prepaid expenses
                  and period-end adjustments.
                </AiNote>
              </Fn>

              <Fn id="deferrals" title="Deferrals — deferred income & expenses">
                <P>
                  Deferrals recognise income and expenses in the periods they relate to, rather than when the cash moves.
                  Both deferred income and prepaid expenses are supported.
                </P>
                <Caption>Example A — deferred income</Caption>
                <P small>A customer pays $12,000 in January for a 12-month software subscription. At receipt:</P>
                <Ledger
                  rows={[
                    ["Bank", "$12,000", "—"],
                    ["Deferred revenue", "—", "$12,000"],
                  ]}
                />
                <P small>Each month, {AI} recognises $1,000 as revenue.</P>
                <Ledger
                  rows={[
                    ["Deferred revenue", "$1,000", "—"],
                    ["Subscription revenue", "—", "$1,000"],
                  ]}
                />
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {months.map((m) => (
                    <span key={m} className="rounded-lg bg-lp-brand/8 px-2.5 py-1.5 text-[12px] text-lp-body">
                      <b className="font-semibold text-lp-ink">{m}</b> $1,000
                    </span>
                  ))}
                </div>
                <Note>
                  Illustrative equal monthly recognition over 12 months, assuming the revenue recognition criteria are
                  satisfied.
                </Note>
                <Caption>Example B — prepaid expenses</Caption>
                <P small>
                  A business pays $6,000 for six months of insurance. {AI} records prepaid insurance and releases $1,000
                  a month to insurance expense.
                </P>
                <AiNote>
                  She can propose recognition schedules, generate the adjustment journals, and flag missing or
                  inconsistent deferral periods.
                </AiNote>
              </Fn>

              <Fn id="interest" title="Interest — receivable & payable">
                <P>
                  The interest function calculates, accrues and records interest earned on financial assets or owed on
                  financial liabilities. <b className="font-semibold text-lp-ink">Interest receivable</b> is interest
                  earned but not yet received, such as on loans granted or interest-bearing deposits.{" "}
                  <b className="font-semibold text-lp-ink">Interest payable</b> is interest incurred but not yet paid, on
                  business loans or borrowings.
                </P>
                <Caption>Example — loan interest</Caption>
                <P small>A business borrows $100,000 at 6% annual simple interest. For one full month, on a 1/12 convention:</P>
                <Formula>$100,000 × 6% ÷ 12 = $500</Formula>
                <Ledger
                  rows={[
                    ["Interest expense", "$500", "—"],
                    ["Interest payable", "—", "$500"],
                  ]}
                />
                <P small>You configure the principal, rate, interest method, calculation frequency and effective dates.</P>
                <AiNote>
                  {AI} can prepare interest schedules, identify upcoming payments and recommend accrual entries. The
                  calculations must follow the loan contract, including day-count and compounding rules.
                </AiNote>
              </Fn>

              <Fn id="bill-references" title="Bill references — outstanding bill tracking">
                <P>
                  Bill references link supplier bills to their original invoice numbers, purchase orders, payments and
                  outstanding balances, giving every payable a clear audit trail.
                </P>
                <DataTable
                  head={["Bill reference", "Supplier", "Amount", "Outstanding"]}
                  rows={[
                    ["INV-1001", "ABC Supplies", "$5,000", "$2,000"],
                    ["INV-1002", "Office Services", "$1,500", "$1,500"],
                    ["INV-1003", "Equipment Ltd", "$3,000", "$0"],
                  ]}
                />
                <P small>You can search by bill reference, supplier, due date or payment status.</P>
                <AiNote>
                  She can detect duplicate bill references, flag overdue payments and help reconcile supplier statements.
                </AiNote>
              </Fn>

              <Fn id="fiscal-periods" title="Fiscal periods">
                <P>
                  Fiscal periods divide the accounting year into reporting intervals — months, quarters and financial
                  years. You can create fiscal years, configure periods, close them, reopen them with permission, and
                  lock historical transactions.
                </P>
                <Caption>Example — calendar financial year</Caption>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {months.map((m, i) => {
                    const open = i >= 9;
                    return (
                      <span
                        key={m}
                        className={cn(
                          "rounded-lg px-2.5 py-1.5 text-[12px]",
                          open ? "bg-ai-done/12 text-lp-ink" : "bg-lp-alt text-lp-muted",
                        )}
                      >
                        <b className="font-semibold">{m}</b> {open ? "Open" : "Closed"}
                      </span>
                    );
                  })}
                </div>
                <Note>Illustrative status: January to September closed, October to December open.</Note>
                <Example>
                  A business closes October 2026 after reviewing reconciliations and journal adjustments. {AI} then stops
                  ordinary users posting backdated entries into that period.
                </Example>
                <AiNote>
                  {AI} can generate a month-end checklist, identify incomplete reconciliations and highlight outstanding
                  adjustments before closure.
                </AiNote>
              </Fn>

              <Fn id="ledger-integrity" title="Ledger integrity">
                <P>
                  Integrity checks confirm the records are mathematically balanced and obey the system&rsquo;s validation
                  rules. The most fundamental test is:
                </P>
                <Formula>Total debits = Total credits</Formula>
                <P small>
                  But a balanced journal is not necessarily a correct one. {AI} also checks for missing accounts, invalid
                  posting dates, duplicate journal identifiers, currency inconsistencies, unauthorised entries and broken
                  references.
                </P>
                <div className="mt-4 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ai-done/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai-done">
                    Balanced
                  </span>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Total debits", "$250,000"],
                      ["Total credits", "$250,000"],
                      ["Difference", "$0.00"],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">{k}</p>
                        <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-lp-ink">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <Note>This shows mathematical balance only, not a complete audit of accuracy.</Note>
                <AiNote>
                  She can explain detected exceptions, identify likely causes and prepare correction suggestions for
                  review.
                </AiNote>
              </Fn>

              <PartHeading title="Tax configuration, compliance & reporting" />
              <p className="-mt-2 mb-6 max-w-3xl text-[14.5px] leading-[1.65] text-lp-body">
                {AI} separates tax configuration from tax calculation and tax reporting, so a multinational business can
                run one accounting system while keeping different tax rules per country.
              </p>
              <Flow steps={taxFlow} />

              <Fn id="tax-types" title="Tax types">
                <P>
                  Tax types identify the taxes a business must collect, pay or report. You create and manage the ones
                  that apply in the countries you operate in.
                </P>
                <DataTable
                  head={["Country / region", "Tax types"]}
                  rows={[
                    ["Canada", "GST, HST, PST, QST"],
                    ["United States", "Federal and state taxes, sales and use tax"],
                    ["European Union", "VAT"],
                    ["United Kingdom", "VAT"],
                    ["India", "CGST, SGST, IGST, UTGST"],
                    ["Nigeria", "VAT"],
                  ]}
                />
                <Example>
                  A Canadian business operating in Ontario and British Columbia creates GST, HST and PST tax types. Each
                  carries its own ledger accounts, tax authority, reporting frequency and rates.
                </Example>
                <AiNote>
                  {AI} can recommend the tax types for your registered jurisdictions and point out missing
                  configurations.
                </AiNote>
              </Fn>

              <Fn id="tax-rates" title="Tax rates">
                <P>
                  Tax rates set the percentage or amount applied to a transaction. Each rate belongs to a tax type,
                  jurisdiction, effective date and tax treatment.
                </P>
                <Caption>Example — Canadian tax rates</Caption>
                <DataTable
                  head={["Tax type", "Rate", "Application"]}
                  rows={[
                    ["GST", "5%", "Federal GST"],
                    ["HST Ontario", "13%", "Ontario taxable supplies"],
                    ["HST Nova Scotia", "14%", "Nova Scotia taxable supplies"],
                    ["PST British Columbia", "7%", "Applicable BC supplies"],
                    ["QST Quebec", "9.975%", "Applicable Quebec supplies"],
                  ]}
                />
                <Caption>Example — an Ontario sale</Caption>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  {[
                    ["Sales before tax", "$1,000.00"],
                    ["HST at 13%", "$130.00"],
                    ["Customer invoice total", "$1,130.00"],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">{k}</p>
                      <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-lp-ink">{v}</p>
                    </div>
                  ))}
                </div>
                <P small>{AI} calculates the $130 HST and posts it to the right tax liability account.</P>
                <AiNote>
                  She can identify missing rates, highlight outdated configurations and suggest rates for review. Keep
                  rates dated so historical transactions stay accurate.
                </AiNote>
              </Fn>

              <Fn id="tax-categories" title="Tax categories — multinational classification">
                <P>
                  Tax categories group transactions, goods, services or activities by their tax treatment — particularly
                  useful across different tax systems.
                </P>
                <DataTable
                  head={["Category", "Description", "Example"]}
                  rows={[
                    ["Standard-rated", "Normal taxable supplies", "Office equipment"],
                    ["Reduced-rated", "Qualifying lower-rate supplies", "Certain food products"],
                    ["Zero-rated", "Taxable supplies charged at 0%", "Qualifying exports"],
                    ["Exempt", "Supplies exempt from tax", "Certain financial services"],
                    ["Reverse charge", "Recipient accounts for the tax", "Qualifying cross-border B2B services"],
                    ["Out of scope", "Outside a particular tax regime", "Certain non-taxable movements"],
                  ]}
                />
                <Example>
                  A company selling software in Canada, Ireland and the United States needs different treatments
                  depending on the customer, the product and the place of supply.
                </Example>
                <AiNote>
                  {AI} can recommend a category from the product description, the customer information and the rules of
                  the jurisdiction.
                </AiNote>
              </Fn>

              <Fn id="fiscal-position" title="Fiscal position — automatic tax mapping">
                <P>
                  Fiscal position changes the default tax treatment automatically, based on a customer&rsquo;s or
                  supplier&rsquo;s tax status, location and rules. It matters most for exports, special economic zones,
                  cross-border transactions and exemptions.
                </P>
                <Flow
                  steps={[
                    ["Create the customer invoice", "She identifies the customer and the transaction details"],
                    ["Determine the tax position", "Domestic · Export · Exempt · SEZ · Reverse charge"],
                    ["Apply the mapping", "Record the tax basis and the supporting evidence"],
                  ]}
                />
                <Example>
                  An Irish company invoices a customer outside the EU. If the transaction meets the export or
                  place-of-supply conditions, {AI} replaces the default domestic VAT treatment with the right one.
                </Example>
                <Note>
                  The system does not assume every foreign customer or SEZ transaction is automatically zero-rated.
                </Note>
                <AiNote>
                  She can identify mapping exceptions, request missing documentation and flag transactions that need
                  professional review.
                </AiNote>
              </Fn>

              <Fn id="tax-reports" title="Tax reports">
                <P>
                  Tax reports summarise the tax collected from customers, the recoverable tax paid to suppliers and the
                  resulting net position. They are built from posted transactions, with drill-down to the invoices and
                  journals behind every figure.
                </P>
                <Caption>Example — GST/HST tax report</Caption>
                <DataTable
                  head={["Description", "Amount"]}
                  rows={[
                    ["Taxable sales", "$100,000"],
                    ["Output tax collected", "$13,000"],
                    ["Eligible input tax credits", "($5,000)"],
                    [<b key="net" className="font-semibold text-lp-ink">Net tax payable</b>, <b key="netv" className="font-semibold text-lp-ink">$8,000</b>],
                  ]}
                />
                <ul className="mt-4 grid gap-1.5 text-[13.5px] leading-[1.5] text-lp-body sm:grid-cols-2">
                  {[
                    "Tax collected and paid, by tax type",
                    "Reports by country, branch and fiscal period",
                    "Input and output tax reconciliations",
                    "Exemptions, zero-rated sales and reverse charge",
                    "Tax return preparation and supporting schedules",
                    "Drill-down from totals to source documents",
                  ].map((c) => (
                    <li key={c} className="flex gap-2">
                      <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-lp-brand/70" strokeWidth={2.5} />
                      {c}
                    </li>
                  ))}
                </ul>
                <Note>The calculation above is simplified; recoverability and filing rules depend on the jurisdiction.</Note>
                <AiNote>
                  {AI} can investigate differences between the tax reports and the ledger, identify unusual treatments
                  and prepare explanations for your accountant.
                </AiNote>
              </Fn>

              <Fn id="ai-tax-classification" title="AI tax classification">
                <P>
                  Distinct from the multinational tax categories above: this classifies bank transactions into
                  income, expenses, capital and other tax headings, to support income tax estimates and preparation.
                </P>
                <DataTable
                  head={["Bank transaction", "AI classification", "Tax treatment for review"]}
                  rows={[
                    ["Customer payment — $5,000", "Business income", "Potential taxable revenue"],
                    ["Office rent — $2,000", "Rent expense", "Potential deductible expense"],
                    ["Laptop purchase — $1,500", "Capital asset", "Capital allowance / depreciation review"],
                    ["Bank loan received — $20,000", "Loan liability", "Generally not operating revenue"],
                    ["Bank interest — $150", "Interest income", "Assess the applicable treatment"],
                  ]}
                />
                <Flow
                  steps={[
                    ["Bank transactions imported", "Description · Supplier · Amount · History"],
                    ["She reviews each one", "Income · Expenses · Capital and other"],
                    ["Estimate & accountant review", "A tax estimate, with the workings behind it"],
                  ]}
                />
                <Note>
                  A bank transaction alone does not establish whether an item is taxable or deductible. Classifications
                  are reconciled against invoices, accounting records and the relevant rules before an estimate is
                  relied on.
                </Note>
                <AiNote>
                  She can propose classifications, detect unusual transactions and prepare estimated income tax
                  schedules.
                </AiNote>
              </Fn>

              <PartHeading title="Fixed assets & depreciation" />
              <p className="-mt-2 mb-6 max-w-3xl text-[14.5px] leading-[1.65] text-lp-body">
                Register, classify, depreciate and monitor fixed assets, with the financial impact reflected in the
                general ledger automatically.
              </p>

              <Fn id="asset-categories" title="Asset categories">
                <P>
                  Asset categories group fixed assets by nature, accounting treatment, depreciation method and useful
                  life — so you set the policy once instead of configuring every asset.
                </P>
                <DataTable
                  head={["Asset category", "Depreciation method", "Illustrative useful life"]}
                  rows={[
                    ["Computers & IT equipment", "Straight-line", "3 years"],
                    ["Office furniture", "Straight-line", "5 years"],
                    ["Motor vehicles", "Straight-line", "5 years"],
                    ["Plant & machinery", "Straight-line", "10 years"],
                    ["Buildings", "Straight-line", "40 years"],
                    ["Land", "Not depreciated", "N/A"],
                  ]}
                />
                <Note>
                  These are example policies, not statutory rates. Useful lives should reflect the asset&rsquo;s expected
                  economic use, and tax depreciation or capital allowances may follow different rules.
                </Note>
                <AiNote>
                  {AI} can suggest categories and depreciation policies from the type of asset, company policy and the
                  applicable accounting standards.
                </AiNote>
              </Fn>

              <Fn id="asset-register" title="Asset register">
                <P>
                  The asset register is the detailed record of the fixed assets the business owns or controls — costs,
                  locations, depreciation, carrying values and disposals. Each record holds the asset name and reference,
                  its category and acquisition date, purchase cost, currency and supplier, department, location and
                  custodian, depreciation method, useful life and residual value, accumulated depreciation and carrying
                  amount, and its status, disposal information and documents.
                </P>
                <Caption>Example — asset record</Caption>
                <div className="mt-3 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-lp-alt px-2.5 py-1 text-[12px] font-semibold tracking-[0.04em] text-lp-ink">
                      AST-000125
                    </span>
                    <span className="rounded-full bg-ai-done/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai-done">
                      Active
                    </span>
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">Dell business laptop</span>
                    <span className="text-[13px] text-lp-muted">Computers &amp; IT equipment</span>
                  </div>
                  <dl className="mt-4 grid gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-2">
                    {[
                      ["Acquisition date", "1 January 2026"],
                      ["Purchase cost", "$3,000"],
                      ["Useful life", "3 years"],
                      ["Residual value", "$0"],
                      ["Annual depreciation", "$1,000"],
                      ["Monthly depreciation", "$83.33*"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-lp-line pb-1.5 last:border-b-0">
                        <dt className="text-lp-muted">{k}</dt>
                        <dd className="font-medium text-lp-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <Note>*Rounded; the schedule absorbs rounding differences over the asset&rsquo;s life.</Note>
                <AiNote>
                  She can pull asset details from supplier invoices, recommend the category, spot duplicate assets and
                  prepare depreciation schedules.
                </AiNote>
              </Fn>

              <Fn id="depreciation" title="Depreciation — automated calculation & batch runs">
                <P>
                  Depreciation spreads the depreciable cost of an asset across its useful life. {AI} calculates it from
                  the policy on each asset and posts the entries to the general ledger. Methods can include
                  straight-line, reducing balance and units of production.
                </P>
                <Caption>Example — straight-line</Caption>
                <P small>Equipment costs $12,000, with a four-year life and no residual value.</P>
                <Formula>$12,000 ÷ 4 = $3,000 a year</Formula>
                <DataTable
                  head={["Year", "Depreciation", "Closing value"]}
                  rows={[
                    ["1", "$3,000", "$9,000"],
                    ["2", "$3,000", "$6,000"],
                    ["3", "$3,000", "$3,000"],
                    ["4", "$3,000", "$0"],
                  ]}
                />
                <Caption>Annual journal entry</Caption>
                <Ledger
                  rows={[
                    ["Depreciation expense", "$3,000", "—"],
                    ["Accumulated depreciation", "—", "$3,000"],
                  ]}
                />
                <P small>
                  Batch processing depreciates hundreds or thousands of assets at once:
                </P>
                <Flow
                  steps={[
                    ["Select the period", "November 2026"],
                    ["Identify eligible assets", "Active · Depreciation due · Valid policies"],
                    ["Calculate the batch", "Useful life · Method · Residual value · Prior depreciation"],
                    ["Review, approve & post", "Balanced journals, and the register updated"],
                  ]}
                />
                <Note>The same asset and period cannot be depreciated twice.</Note>
                <AiNote>
                  {AI} can find assets with no depreciation policy, detect unusual changes, calculate proposed
                  adjustments and flag assets reaching the end of their life.
                </AiNote>
              </Fn>
            </div>
          </div>
        </Container>
      </section>

      {/* part D — the chain */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>How the 16 work together</Kicker>
          <H2>From a purchase to the financial statements.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            The value comes from connecting these functions rather than running them separately. Take a company buying a
            $12,000 piece of equipment on supplier credit.
          </p>
          <ol className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {chain.map(([title, text]) => (
              <li key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-center text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
            {AI} — One intelligent ledger. Complete accounting control.{" "}
            <span className="text-lp-brand">Greater business efficiency.</span>
          </p>
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

/** The chart of accounts: a group row, then its accounts indented under it. */
function ChartOfAccounts() {
  return (
    <div className="mt-3 max-w-md overflow-x-auto rounded-xl border border-lp-line">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="bg-lp-alt">
            <th className="w-24 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-lp-muted">Code</th>
            <th className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-lp-muted">Account</th>
          </tr>
        </thead>
        <tbody>
          {coa.map(([group, children]) => {
            const [code, name] = group.split(" — ");
            return (
              <Fragment key={group}>
                <tr className="border-t border-lp-line bg-lp-alt/50">
                  <td className="px-4 py-1.75 font-semibold tabular-nums text-lp-ink">{code}</td>
                  <td className="px-4 py-1.75 font-semibold text-lp-ink">{name}</td>
                </tr>
                {children.map((child) => {
                  const [childCode, childName] = child.split(" — ");
                  return (
                    <tr key={child} className="border-t border-lp-line">
                      <td className="px-4 py-1.75 tabular-nums text-lp-muted">{childCode}</td>
                      <td className="px-4 py-1.75 text-lp-body">{childName}</td>
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
