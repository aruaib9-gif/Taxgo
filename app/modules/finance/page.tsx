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
  title: `Finance module`, // the root layout appends "· Tax GO"
  description: `The ${AI} banking, treasury and financial management module in full: 24 functions across bank and cash accounts, reconciliation, document processing, debt, loans, rotating savings, currencies and budgets.`,
};

const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

type Photo = [src: string, alt: string];

const bankPhotos: Photo[] = [
  ["/finance/bank-1.jpg", "Bank balances shown on a dashboard"],
  ["/finance/bank-2.jpg", "Someone verifying a bank transfer on screen"],
  ["/finance/bank-3.jpg", "A cash and bank accounts overview"],
];

const chequePhotos: Photo[] = [
  ["/finance/cheque-1.jpg", "Cheque printing software on a laptop"],
  ["/finance/cheque-2.jpg", "A printed cheque being aligned"],
  ["/finance/cheque-3.jpg", "A business owner signing a chequebook"],
];

const docPhotos: Photo[] = [
  ["/finance/docs-1.jpg", "Paper receipts and invoices awaiting processing"],
  ["/finance/docs-2.jpg", "A receipt being captured with a phone"],
  ["/finance/docs-3.jpg", "Invoice data extracted automatically on screen"],
];

const chitPhotos: Photo[] = [
  ["/finance/chit-1.jpg", "Members of a savings group meeting"],
  ["/finance/chit-2.jpg", "A community savings collection"],
  ["/finance/chit-3.jpg", "A savings group recording contributions"],
];

const budgetPhotos: Photo[] = [
  ["/finance/budget-1.jpg", "An analyst reviewing a budgeting dashboard"],
  ["/finance/budget-2.jpg", "A finance team planning the year"],
  ["/finance/budget-3.jpg", "A budget variance analysis on screen"],
];

/** The consolidated banking portfolio. */
const accounts: [string, string, string, string][] = [
  ["Royal Bank of Canada", "Operating account · •••• 4821", "CAD", "$125,450.00"],
  ["Bank of Ireland", "European operations · •••• 6235", "EUR", "€85,200.00"],
  ["Guaranty Trust Bank", "African operations · •••• 1028", "NGN", "₦45,500,000.00"],
  ["US Dollar Account", "International trading · •••• 7854", "USD", "$92,500.00"],
  ["Business Savings", "Reserve account · •••• 4102", "CAD", "$75,000.00"],
];

/** The transaction feed. */
const transactions: [string, string, string, "Matched" | "Categorised" | "Review" | "Unmatched"][] = [
  ["Customer invoice INV-1045", "21 Nov", "+$12,500", "Matched"],
  ["Supplier payment", "20 Nov", "−$4,250", "Matched"],
  ["Office rent", "20 Nov", "−$2,500", "Categorised"],
  ["Bank service charges", "19 Nov", "−$45", "Categorised"],
  ["Unidentified deposit", "19 Nov", "+$3,200", "Review"],
  ["Insurance payment", "18 Nov", "−$850", "Unmatched"],
];

/** Physical cash, by where it sits. */
const cashHoldings: [string, string][] = [
  ["Main office safe", "$8,500.00"],
  ["Retail till 01", "$1,500.00"],
  ["Retail till 02", "$1,200.00"],
  ["Office petty cash", "$750.00"],
  ["Van sales cash", "$1,000.00"],
];

const cashKinds: { title: string; text: string; src: string; alt: string }[] = [
  { title: "Cash tills", text: "Daily retail collections", src: "/finance/cash-till.jpg", alt: "A retail cash register" },
  { title: "Petty cash", text: "Minor expenses", src: "/finance/cash-petty.jpg", alt: "A petty cash box with notes and coins" },
  { title: "Company safes", text: "Secure cash holdings", src: "/finance/cash-safe.jpg", alt: "An office safe" },
];

/** How transactions get classified. */
const categories: [string, string[]][] = [
  ["Income", ["Sales revenue", "Service income", "Rental income", "Interest received"]],
  ["Expenses", ["Office rent", "Utilities", "Travel expenses", "Bank charges"]],
  ["Assets", ["Equipment purchases", "Employee loans", "Prepayments", "Security deposits"]],
  ["Liabilities", ["Loan repayments", "Tax settlements", "Supplier payments", "Customer deposits"]],
  ["Equity", ["Capital introduced", "Owner withdrawals", "Share capital"]],
  ["Transfers", ["Bank to bank", "Bank to cash", "Cash to bank"]],
];

/** What a statement line can become. */
const inboxActions: [string, string][] = [
  ["Match", "An accounting transaction that already exists"],
  ["Create payment", "Settle an outstanding invoice or bill"],
  ["Categorise", "Record new income or expense"],
  ["Transfer", "A movement between your own accounts"],
];

const bankRules: [string, string, string][] = [
  ['Contains "BANK FEE"', "Categorise", "Bank charges"],
  ['Contains "OFFICE RENT"', "Categorise", "Rent expense"],
  ['Contains "PAYROLL"', "Match payroll payment", "Payroll payable"],
  ['Contains "INSURANCE"', "Review expense or prepayment", "Insurance"],
  ['Contains "INTEREST CREDIT"', "Categorise", "Interest income"],
  ["Matches your own account reference", "Internal transfer", "Bank clearing"],
  ['Contains "STRIPE"', "Match settlement", "Payment clearing account"],
];

const cheques: [string, string, "Cleared" | "Outstanding" | "Voided"][] = [
  ["000123", "$2,500", "Cleared"],
  ["000124", "$1,850", "Cleared"],
  ["000125", "$4,500", "Outstanding"],
  ["000126", "$950", "Outstanding"],
  ["000127", "$0", "Voided"],
];

/** The employee loan schedule. */
const loanSchedule: [string, string, string][] = [
  ["Disbursement", "—", "$6,000"],
  ["Month 1", "$500", "$5,500"],
  ["Month 2", "$500", "$5,000"],
  ["Month 3", "$500", "$4,500"],
  ["Month 6", "$500", "$3,000"],
  ["Month 9", "$500", "$1,500"],
  ["Month 12", "$500", "$0"],
];

/** The savings groups under administration. */
const chitGroups: [string, string, string, string, string][] = [
  ["Group A — monthly savings", "20", "$200", "$4,000", "8 of 20 months"],
  ["Group B — business savings", "15", "$500", "$7,500", "6 of 15 months"],
  ["Group C — employee savings", "10", "$300", "$3,000", "4 of 10 months"],
];

const currencies: [string, string, string][] = [
  ["🇺🇸", "USD", "1.380000"],
  ["🇪🇺", "EUR", "1.550000"],
  ["🇬🇧", "GBP", "1.780000"],
  ["🇳🇬", "NGN", "0.000900"],
  ["🇮🇳", "INR", "0.016000"],
  ["🇰🇪", "KES", "0.010500"],
];

/** Budget against actual, department by department. */
const budget: [string, number, number][] = [
  ["Finance", 250000, 240000],
  ["Marketing", 350000, 390000],
  ["Operations", 850000, 900000],
  ["IT", 300000, 290000],
  ["HR", 200000, 200000],
];

/** Finance activity, and what it posts. */
const matrix: [string, string, string][] = [
  ["Customer invoice settlement", "Bank", "Accounts receivable"],
  ["Supplier bill settlement", "Accounts payable", "Bank"],
  ["Bank charges", "Bank charges expense", "Bank"],
  ["Bank interest received", "Bank", "Interest income"],
  ["Cash deposited into bank", "Bank", "Cash on hand"],
  ["Cash withdrawn for petty cash", "Petty cash", "Bank"],
  ["Borrowing received", "Bank", "Loan liability"],
  ["Principal repayment", "Loan liability", "Bank"],
  ["Interest payment", "Interest expense or payable", "Bank"],
  ["Employee loan issued", "Employee loan receivable", "Bank"],
  ["Employee loan recovered", "Bank or payroll payable", "Employee loan receivable"],
  ["Interest earned on loans", "Interest receivable", "Interest income"],
  ["Savings contributions received", "Bank", "Member funds liability"],
  ["Savings distributions", "Member funds liability", "Bank"],
  ["Foreign currency asset gain", "Foreign currency asset", "Exchange gain"],
  ["Foreign currency asset loss", "Exchange loss", "Foreign currency asset"],
  ["AI-processed supplier bill", "Expense or asset, and recoverable tax", "Accounts payable"],
];

/** What you can ask her. */
const asks: [string, string][] = [
  ["What is our total cash position?", "Consolidate the available bank account information"],
  ["Review yesterday's bank transactions.", "Analyse receipts, payments and unusual movements"],
  ["Reconcile our bank accounts.", "Prepare the matches and the reconciliation schedules"],
  ["How much physical cash do we hold?", "Summarise tills, safes and petty cash"],
  ["Organise uncategorised transactions.", "Suggest the appropriate categories"],
  ["Process everything in the bank inbox.", "Propose matches, payments and classifications"],
  ["Explain this month's bank statement.", "Summarise the processing and its financial effects"],
  ["Automate our recurring bank expenses.", "Recommend suitable banking rules"],
  ["Which cheques have not cleared?", "Prepare an outstanding cheque report"],
  ["Process these 500 receipts.", "Extract the information and prepare the records"],
  ["What debts are due next month?", "Prepare a debt maturity schedule"],
  ["Review outstanding employee loans.", "Analyse repayments and balances"],
  ["Does this member qualify for a loan?", "Evaluate the configured eligibility criteria"],
  ["Who has missed a savings contribution?", "Identify outstanding contributions"],
  ["Show our foreign currency exposure.", "Summarise the balances by currency"],
  ["Prepare month-end currency revaluation.", "Propose the exchange gain and loss journals"],
  ["Explain why we are over budget.", "Analyse actual expenditure against the approved budget"],
];

/** Who this suits. */
const industries: { title: string; text: string; src: string; alt: string }[] = [
  {
    title: "Multinational organisations",
    text: "Multi-currency accounts, revaluation, consolidation, international payments and budgets.",
    src: "/finance/industry-multinational.jpg",
    alt: "An international finance team at work",
  },
  {
    title: "Cooperatives & savings associations",
    text: "Member deposits, eligibility rules, loan administration and rotating savings.",
    src: "/finance/industry-cooperative.jpg",
    alt: "A credit union branch counter",
  },
  {
    title: "Accounting practices",
    text: "Document processing, categorisation, matching, reconciliation and reporting.",
    src: "/finance/industry-practice.jpg",
    alt: "An accountant working with accounting software",
  },
  {
    title: "Not-for-profit & development",
    text: "Project budgets, international accounts, expenditure monitoring and documentation.",
    src: "/finance/industry-ngo.jpg",
    alt: "A budgeting workshop for programme staff",
  },
  {
    title: "Retail & distribution",
    text: "Till cash, daily deposits, collections, supplier payments and working capital.",
    src: "/finance/industry-retail.jpg",
    alt: "A retail payment terminal in use",
  },
  {
    title: "Lending organisations",
    text: "Loan portfolios, repayment schedules, interest, eligibility and debt monitoring.",
    src: "/finance/industry-lending.jpg",
    alt: "A loan officer reviewing an application",
  },
];

const controls: [string, string][] = [
  ["Bank account authorisation", "Restrict access to financial accounts"],
  ["Bank reconciliation", "Confirm the accuracy of banking records"],
  ["Physical cash counts", "Verify cash held by employees and branches"],
  ["Transaction category mapping", "Keep the accounting treatment consistent"],
  ["Duplicate detection", "Reduce duplicate financial postings"],
  ["Bank rule approvals", "Control automated transaction processing"],
  ["Document validation", "Verify the supporting documentation"],
  ["Cheque register", "Monitor issued and outstanding cheques"],
  ["Loan approval workflow", "Prevent unauthorised lending"],
  ["Eligibility checks", "Apply consistent lending criteria"],
  ["Member-level records", "Protect the integrity of savings schemes"],
  ["Exchange rate controls", "Maintain reliable currency conversions"],
  ["Revaluation approval", "Verify period-end currency adjustments"],
  ["Budget monitoring", "Identify departures from the plan"],
  ["Audit trail", "Maintain evidence of financial activity"],
  ["AI access permissions", "Restrict AI to authorised data and actions"],
  ["Human approval", "Keep control over significant financial decisions"],
];

export default function FinancePage() {
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
              Manage your money. <Serif className="text-[32px] sm:text-[40px]">Understand your numbers.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              The finance module is where the money lives: bank and cash accounts, reconciliation, intelligent document
              processing, debt and loans, cooperative savings, foreign currencies and budgets. The usual routine —
              download the statement, classify every line, match the payments, key in the receipts — is the part that
              gets automated.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              One account or twelve, in one currency or six, with employee loans and a savings scheme on the side: the
              administration stays in one place.
            </p>
          </div>
        </Container>
      </section>

      {/* the 24 functions */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Banking & cash management" />

            <Fn id="bank-accounts" title="Bank accounts — all of them, in one view">
              <P>
                Each account is linked to its general ledger account, its currency and its institution — including
                accounts held in other countries, subject to entity-level accounting controls.
              </P>
              <Photos photos={bankPhotos} />
              <Caption>Example — a consolidated portfolio</Caption>
              <ul className="mt-3 space-y-2">
                {accounts.map(([bank, detail, currency, balance]) => (
                  <li
                    key={bank}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-lp-line bg-lp-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{bank}</p>
                      <p className="text-[12.5px] text-lp-muted">{detail}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-lg bg-lp-alt px-2 py-1 text-[11px] font-semibold tracking-[0.08em] text-lp-muted">
                        {currency}
                      </span>
                      <span className="text-[15px] font-semibold tabular-nums text-lp-ink">{balance}</span>
                    </div>
                  </li>
                ))}
              </ul>
              <Note>Balances in different currencies have to be converted before they can be consolidated.</Note>
              <DataTable
                head={["Configuration", "Purpose"]}
                rows={[
                  ["Bank name", "Identify the institution"],
                  ["Account number", "Identify the account"],
                  ["Account currency", "Establish the transaction currency"],
                  ["Opening balance", "Record the starting position"],
                  ["GL account", "Connect banking to accounting"],
                  ["Bank connection", "Enable supported transaction imports"],
                  ["Account status", "Manage active and inactive accounts"],
                  ["Branch or entity", "Associate the account with operations"],
                ]}
              />
              <AiNote>
                {AI} can analyse the available balances, identify liquidity shortages, compare cash movements and
                prepare the consolidated cash position.
              </AiNote>
            </Fn>

            <Fn id="bank-transactions" title="Bank transactions — the feed">
              <P>
                Receipts, payments, transfers, charges and interest, filterable by date, amount, account, description,
                type and reconciliation status.
              </P>
              <DataTable
                head={["Description", "Date", "Amount", "Status"]}
                rows={transactions.map(([description, date, amount, status]) => [
                  description,
                  date,
                  <span key={description} className={cn("font-medium", amount.startsWith("+") ? "text-ai-done" : "text-lp-ink")}>
                    {amount}
                  </span>,
                  <Status
                    key={`${description}-s`}
                    kind={status === "Matched" ? "ok" : status === "Categorised" ? "info" : status === "Review" ? "wait" : "no"}
                  >
                    {status}
                  </Status>,
                ])}
              />
              <AiNote>
                She can identify duplicates, suggest classifications, recognise recurring expenses and highlight
                unusual payments for investigation.
              </AiNote>
            </Fn>

            <Fn id="reconciliations" title="Reconciliations — agreeing with the bank">
              <P>
                Comparing what the books say with what the bank confirms, and keeping the history of every completed
                reconciliation for the controls and for the audit.
              </P>
              <Caption>Example — the two sides, adjusted</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Adjusted bank balance</p>
                  <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">$128,250.00</p>
                  <p className="text-[12.5px] text-lp-muted">Statement, plus deposits in transit, less outstanding cheques</p>
                </div>
                <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Adjusted ledger balance</p>
                  <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">$128,250.00</p>
                  <p className="text-[12.5px] text-lp-muted">Ledger, less unrecorded bank charges</p>
                </div>
              </div>
              <Note>
                A zero difference is necessary, but it does not replace transaction-level verification.
              </Note>
              <DataTable
                head={["Period", "Account", "Difference", "Status"]}
                rows={[
                  ["August 2026", "Operating account", "$0.00", <Status key="a" kind="ok">Completed</Status>],
                  ["September 2026", "Operating account", "$0.00", <Status key="s" kind="ok">Completed</Status>],
                  ["October 2026", "Operating account", "$0.00", <Status key="o" kind="ok">Completed</Status>],
                  ["November 2026", "Operating account", "$150.00", <Status key="n" kind="wait">Under review</Status>],
                ]}
              />
              <AiNote>
                {AI} can suggest matches, find unrecorded charges, investigate differences and prepare the supporting
                schedules for the auditors.
              </AiNote>
            </Fn>

            <Fn id="cash-accounts" title="Cash accounts — the money not in a bank">
              <P>
                Tills, petty cash, safes, branch holdings and cash carried by authorised employees — each reconcilable
                against a physical count, which is what makes people accountable for it.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {cashKinds.map((kind) => (
                  <figure key={kind.title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image src={kind.src} alt={kind.alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{kind.title}</p>
                      <p className="mt-0.5 text-[13px] text-lp-muted">{kind.text}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Caption>Example — $12,950.00 on hand</Caption>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {cashHoldings.map(([place, amount]) => (
                  <li key={place} className="flex items-baseline justify-between gap-4 rounded-xl border border-lp-line bg-lp-card px-4 py-2.5">
                    <span className="text-[13.5px] text-lp-body">{place}</span>
                    <span className="text-[14px] font-semibold tabular-nums text-lp-ink">{amount}</span>
                  </li>
                ))}
              </ul>
              <AiNote>
                She can compare recorded against counted cash, find recurring shortages and highlight unusual
                movements.
              </AiNote>
            </Fn>

            <Fn id="cash-transactions" title="Cash transactions — receipts and payments">
              <P>
                Every physical receipt, payment and transfer across the cash accounts, documented and reflected in the
                accounting records.
              </P>
              <DataTable
                head={["Transaction", "Debit", "Credit"]}
                rows={[
                  ["Customer pays an outstanding invoice", "Cash", "Accounts receivable"],
                  ["Purchase office supplies", "Office expenses", "Cash"],
                  ["Withdraw money from the bank", "Petty cash", "Bank"],
                  ["Deposit till collections", "Bank", "Till cash"],
                  ["Refund a customer", "Sales returns or receivable", "Cash"],
                  ["Employee repays a loan", "Cash", "Employee loan receivable"],
                ]}
              />
              <Warning>
                Internal transfers between cash and bank are not additional income or expenditure.
              </Warning>
              <AiNote>{AI} can suggest descriptions, classify expenditure and prepare the cash movement reports.</AiNote>
            </Fn>

            <Fn id="categories" title="Transaction categories — one classification scheme">
              <P>
                Predefined classifications that post transactions to the right accounts, so processing is consistent
                across employees, branches and entities.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map(([group, items]) => (
                  <div key={group} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{group}</p>
                    <ul className="mt-2 space-y-1 text-[12.5px] text-lp-muted">
                      {items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Example>
                Office equipment may be a fixed asset rather than an immediate expense, depending on the
                capitalisation policy — the category decides which.
              </Example>
              <AiNote>
                She can recommend a category from the description, past classifications, the supplier and the
                configured policy.
              </AiNote>
            </Fn>

            <PartHeading title="Intelligent banking & automation" />

            <Fn id="bank-inbox" title="Bank inbox — deciding what each line is">
              <P>
                A workspace for statement lines: instead of a journal entry per transaction, each line is matched,
                paid, categorised or recognised as an internal transfer.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {inboxActions.map(([title, text]) => (
                  <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-[1.5] text-lp-muted">{text}</p>
                  </div>
                ))}
              </div>
              <Caption>Example — an AI-assisted match</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Incoming statement line</p>
                  <p className="mt-1 text-[14px] font-semibold text-lp-ink">ABC Trading Limited</p>
                  <p className="text-[12.5px] text-lp-muted">Reference INV-2026-1045</p>
                  <p className="mt-1 text-[18px] font-semibold text-ai-done">+$5,650</p>
                </div>
                <div className="rounded-xl border border-lp-brand/30 bg-lp-brand/6 px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-brand">Suggested action</p>
                  <p className="mt-1 text-[14px] font-semibold text-lp-ink">Match to invoice INV-2026-1045</p>
                  <p className="mt-1 text-[12.5px] text-lp-muted">
                    Invoice $5,650.00 · received $5,650.00 · outstanding $0.00
                  </p>
                  <p className="mt-1 text-[12.5px] text-lp-body">
                    Evidence: customer name, invoice reference and the exact amount.
                  </p>
                </div>
              </div>
              <Note>
                The inbox checks whether a transaction already exists before proposing a new posting, which is what
                keeps duplicates out.
              </Note>
              <AiNote>
                {AI} can work through large volumes, suggest the matches, recognise the recurring items and set aside
                the ambiguous ones for a person.
              </AiNote>
            </Fn>

            <Fn id="statement-cockpit" title="Statement cockpit — everything one statement did">
              <P>
                Rather than hunting across screens, the cockpit shows a statement&rsquo;s processing progress, its
                supporting documents, its financial contribution, its tax treatment and its reconciliation status
                together.
              </P>
              <Caption>Example — October 2026, operating account</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Statement transactions", "1,250"],
                  ["Processed", "1,220"],
                  ["Pending review", "30"],
                  ["Completion", "97.6%"],
                  ["Opening balance", "$120,000"],
                  ["Closing balance", "$175,000"],
                  ["Total receipts", "$280,000"],
                  ["Total payments", "$225,000"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <Figures
                items={[
                  ["Net cash movement", "+$55,000"],
                  ["New income recognised", "$45,000"],
                  ["Net P&L contribution", "$13,000"],
                ]}
              />
              <Warning>
                Cash movement is not profit. Receiving payment for an existing invoice raises the bank balance without
                creating new revenue — the cockpit shows both.
              </Warning>
              <AiNote>
                She can summarise how a statement performed, explain what is still unprocessed, find missing documents
                and prepare a reconciliation readiness report.
              </AiNote>
            </Fn>

            <Fn id="bank-rules" title="Bank rules — automating the obvious ones">
              <P>
                Conditions that trigger a recommended or automatic action when a matching line arrives, so recurring
                charges, utilities, premiums and subscriptions do not need classifying every month.
              </P>
              <DataTable head={["Statement condition", "Suggested action", "Classification"]} rows={bankRules.map((r) => [...r])} />
              <Example>
                Rule &ldquo;Monthly bank service charges&rdquo;: when the description contains BANK SERVICE FEE, treat
                it as an expense against Bank Charges — in suggest-for-review mode.
              </Example>
              <AiNote>
                {AI} can spot repetitive patterns and recommend new rules, so the routine work automates itself
                gradually.
              </AiNote>
            </Fn>

            <Fn id="cheques" title="Cheques — books, issuing, printing">
              <P>
                Cheque books, issued cheques, the register and printing — with a clear record of what is issued,
                cleared, outstanding, cancelled or voided.
              </P>
              <Photos photos={chequePhotos} />
              <Caption>Cheque register</Caption>
              <DataTable
                head={["Cheque", "Amount", "Status"]}
                rows={cheques.map(([number, amount, status]) => [
                  number,
                  amount,
                  <Status key={number} kind={status === "Cleared" ? "ok" : status === "Outstanding" ? "wait" : "no"}>
                    {status}
                  </Status>,
                ])}
              />
              <AiNote>
                She can find long-outstanding cheques, detect duplicated references and prepare the outstanding cheque
                schedule.
              </AiNote>
            </Fn>

            <Fn id="document-inbox" title="Document inbox — the shoebox, processed">
              <P>
                Supplier bills, customer invoices, receipts, photographs, PDFs and handwritten notes go in; proposed
                accounting records come out for review and approval. This is the original idea behind {AI} — the hours
                accountants lose to bags of receipts.
              </P>
              <Photos photos={docPhotos} />
              <Caption>Example — extracting a supplier invoice</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">The document</p>
                  <p className="mt-1 text-[14px] font-semibold text-lp-ink">ABC Office Supplies Ltd.</p>
                  <p className="text-[12.5px] text-lp-muted">INV-10025 · 21 November 2026</p>
                  <p className="mt-2 text-[13.5px] text-lp-body">Office supplies $500 · HST 13% $65</p>
                  <p className="text-[16px] font-semibold text-lp-ink">Total $565</p>
                </div>
                <div className="rounded-xl border border-lp-brand/30 bg-lp-brand/6 px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-brand">What she extracted</p>
                  <dl className="mt-2 space-y-1 text-[13px]">
                    {[
                      ["Supplier", "ABC Office Supplies Ltd."],
                      ["Proposed account", "Office expenses"],
                      ["Tax treatment", "HST 13%"],
                      ["Document type", "Supplier bill"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4">
                        <dt className="text-lp-muted">{k}</dt>
                        <dd className="font-medium text-lp-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <Ledger
                rows={[
                  ["Office expenses", "$500", "—"],
                  ["Recoverable HST", "$65", "—"],
                  ["Accounts payable", "—", "$565"],
                ]}
              />
              <Warning>
                Recognition does not replace judgement. Unclear handwriting, missing tax information, duplicate
                invoices and wrong supplier details go to a person.
              </Warning>
              <AiNote>
                {AI} can extract the information, suggest the classification, detect duplicates, organise the
                supporting documents and take the keying out of it.
              </AiNote>
            </Fn>

            <PartHeading title="Debt, lending & loans" />

            <Fn id="debt" title="Debt management — what you owe, and when">
              <P>
                An organised view of obligations and outstanding balances, for repayment planning and risk: creditors,
                borrowing, repayment arrangements, interest and anything overdue.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Total outstanding debt", "$480,000"],
                  ["Due within 30 days", "$32,000"],
                  ["Overdue obligations", "$8,500"],
                  ["Monthly repayments", "$18,500"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <DataTable
                head={["Information", "Purpose"]}
                rows={[
                  ["Creditor", "Identify the party owed"],
                  ["Original debt", "Establish the initial liability"],
                  ["Outstanding principal", "Monitor what is left"],
                  ["Interest rate", "Determine the borrowing cost"],
                  ["Repayment schedule", "Plan the future payments"],
                  ["Maturity date", "Identify the final repayment"],
                  ["Overdue amounts", "Monitor default exposure"],
                  ["Security or guarantees", "Record the associated commitments"],
                ]}
              />
              <AiNote>
                She can forecast upcoming repayments, identify the cash shortages they could cause, compare borrowing
                costs and set repayment priorities.
              </AiNote>
            </Fn>

            <Fn id="employee-loans" title="Employee loans — advances and staff lending">
              <P>
                Salary advances, emergency loans, education and housing assistance: disbursements, repayment
                schedules, payroll deductions and outstanding balances.
              </P>
              <Flow
                steps={[
                  ["Request and assess", "Against the employee loan policy"],
                  ["Approve and disburse", "Authorise the amount and the terms"],
                  ["Repay and close", "Payroll deductions until the balance clears"],
                ]}
              />
              <Caption>Example — $6,000 interest-free over 12 months</Caption>
              <DataTable head={["Month", "Repayment", "Outstanding"]} rows={loanSchedule.map((r) => [...r])} />
              <DataTable
                head={["Transaction", "Debit", "Credit"]}
                rows={[
                  ["Loan disbursement", "Employee loans receivable", "Bank"],
                  ["Payroll deduction", "Payroll payable", "Employee loans receivable"],
                  ["Direct repayment", "Bank", "Employee loans receivable"],
                ]}
              />
              <Warning>
                Payroll deductions and any taxable employment benefit must comply with local legislation.
              </Warning>
              <AiNote>
                {AI} can monitor the outstanding loans, prepare the schedules and flag missed or incomplete
                repayments.
              </AiNote>
            </Fn>

            <Fn id="loans" title="Loan management — interest-free and interest-bearing">
              <P>
                Loan amounts, interest calculations, repayment periods, schedules and balances — relevant to
                cooperatives, credit associations, employee schemes, community organisations and any business that
                lends.
              </P>
              <Caption>Example — $20,000 over 24 months</Caption>
              <Figures
                items={[
                  ["Monthly repayment", "$904.55"],
                  ["Total interest", "$1,709.10"],
                  ["Total repayment", "$21,709.10"],
                ]}
              />
              <Note>
                Illustrative, assuming equal monthly payments, no fees and no missed repayments. Methods can be
                interest-free, reducing balance or flat rate.
              </Note>
              <P small>
                For loans granted, principal repayments reduce the receivable and earned interest is income. For loans
                received, principal reduces the liability and interest is a financing expense.
              </P>
              <AiNote>
                She can prepare the schedules, analyse performance, find overdue instalments and forecast future
                interest.
              </AiNote>
            </Fn>

            <Fn id="eligibility" title="Eligibility rules — who qualifies, and for how much">
              <P>
                Criteria that decide whether a member or employee qualifies and for what maximum — for cooperatives
                and savings organisations, usually based on accumulated deposits.
              </P>
              <Caption>Example — a 3× deposit multiplier</Caption>
              <Figures
                items={[
                  ["Deposit-based limit", "$15,000.00"],
                  ["Existing exposure", "$2,000.00"],
                  ["Additional eligibility", "$13,000.00"],
                ]}
              />
              <Note>
                Illustrative policy only. Eligibility still depends on repayment capacity, regulatory requirements and
                authorised approval, and may also weigh membership duration, deposit history and past behaviour.
              </Note>
              <AiNote>
                {AI} can evaluate an application against the configured rules, explain the calculation and flag the
                ones needing closer assessment.
              </AiNote>
            </Fn>

            <Fn id="loan-settings" title="Loan settings — the lending policy, once">
              <P>
                Interest policies, repayment terms, approval controls, lending limits, accounting rules and default
                policies, configured centrally instead of decided per application.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ["Interest policies", "Rates and calculation methods"],
                  ["Repayment terms", "Frequency and duration"],
                  ["Approval controls", "Authorisation requirements"],
                  ["Loan limits", "Minimum and maximum amounts"],
                  ["Accounting rules", "Principal and interest accounts"],
                  ["Default policies", "Overdue handling and escalation"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                    <p className="mt-0.5 text-[12.5px] text-lp-muted">{text}</p>
                  </div>
                ))}
              </div>
              <Warning>Any interest, fees or penalties must be permissible under the applicable lending laws.</Warning>
              <AiNote>
                She can review the configured policies, highlight inconsistencies and model what a proposed change
                would do.
              </AiNote>
            </Fn>

            <PartHeading title="Chit funds & cooperative savings" />

            <Fn id="chit-funds" title="Chit funds — rotating savings">
              <P>
                A group contributes an agreed amount at regular intervals and the pool goes to each member in turn —
                Ajo or Esusu in Nigeria, tontines across Africa, chit funds in India, ROSCAs internationally.
              </P>
              <Photos photos={chitPhotos} />
              <Caption>Example — six members, $500 each, a $3,000 monthly pool</Caption>
              <DataTable
                head={["Month", "Contributions", "Recipient", "Distribution"]}
                rows={[
                  ["January", "$3,000", "Member 1", "$3,000"],
                  ["February", "$3,000", "Member 2", "$3,000"],
                  ["March", "$3,000", "Member 3", "$3,000"],
                  ["April", "$3,000", "Member 4", "$3,000"],
                  ["May", "$3,000", "Member 5", "$3,000"],
                  ["June", "$3,000", "Member 6", "$3,000"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="c" className="font-semibold text-lp-ink">$18,000</b>,
                    "6 members",
                    <b key="d" className="font-semibold text-lp-ink">$18,000</b>,
                  ],
                ]}
              />
              <Note>
                A fixed-turn arrangement without fees, auctions or investment returns. Formal chit funds may work
                differently and are subject to local legal requirements.
              </Note>
              <AiNote>
                {AI} can monitor collections, identify missed contributions, prepare the distribution schedule and
                forecast the group&rsquo;s funding.
              </AiNote>
            </Fn>

            <Fn id="chit-groups" title="Chit fund groups — several schemes at once">
              <P>
                Multiple independent groups, each with its own participants, contribution, duration and distribution
                arrangements, without their records mixing.
              </P>
              <DataTable
                head={["Group", "Members", "Contribution", "Monthly pool", "Progress"]}
                rows={chitGroups.map((g) => [...g])}
              />
              <Note>
                Administration covers registration, membership status, contribution history, distribution schedules,
                missed contributions and group-level reporting.
              </Note>
              <AiNote>
                She can compare group performance, identify contribution gaps and prepare individual member
                statements.
              </AiNote>
            </Fn>

            <Fn id="chit-settings" title="Chit fund settings — the scheme's policies">
              <P>
                Membership rules, contribution policies, distribution rules, arrears handling, permitted
                administrative fees, accounting configuration and approval controls.
              </P>
              <DataTable
                head={["Transaction", "Debit", "Credit"]}
                rows={[
                  ["Member contribution received", "Bank", "Member funds liability"],
                  ["Distribution to a member", "Member funds liability", "Bank"],
                  ["Separately earned administration fee", "Bank or receivable", "Administration fee income"],
                  ["Refund of a contribution", "Member funds liability", "Bank"],
                ]}
              />
              <Warning>
                Contributions held for participants are not automatically the administrator&rsquo;s revenue. The
                treatment depends on the legal and contractual structure of the arrangement.
              </Warning>
              <AiNote>
                {AI} can find inconsistencies in the configuration, prepare the contribution reports and flag
                distributions needing authorisation.
              </AiNote>
            </Fn>

            <PartHeading title="Multi-currency & international" />

            <Fn id="currencies" title="Currencies — operating in more than one">
              <P>
                The currency used to invoice a customer or pay a supplier often differs from the entity&rsquo;s
                functional currency and from the group&rsquo;s reporting currency. Currency records carry the ISO
                code, the symbol, the decimal precision and the status.
              </P>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ["🇨🇦", "CAD"],
                  ["🇺🇸", "USD"],
                  ["🇪🇺", "EUR"],
                  ["🇬🇧", "GBP"],
                  ["🇳🇬", "NGN"],
                  ["🇮🇳", "INR"],
                  ["🇰🇪", "KES"],
                  ["🇿🇦", "ZAR"],
                  ["🇦🇪", "AED"],
                  ["🇸🇦", "SAR"],
                  ["🇮🇩", "IDR"],
                  ["🇬🇹", "GTQ"],
                ].map(([flag, code]) => (
                  <span key={code} className="flex items-center gap-1.5 rounded-lg bg-lp-alt px-3 py-1.5 text-[13px] text-lp-body">
                    <span aria-hidden>{flag}</span> {code}
                  </span>
                ))}
              </div>
              <AiNote>
                She can analyse currency exposure, summarise international balances and identify the transactions
                affected by rate movements.
              </AiNote>
            </Fn>

            <Fn id="exchange-rates" title="Exchange rates — and when each applies">
              <P>
                Rates are needed for international sales, supplier bills, foreign bank transactions, loan balances and
                period-end revaluation.
              </P>
              <DataTable
                head={["Currency", "CAD per unit"]}
                rows={currencies.map(([flag, code, rate]) => [
                  <span key={code} className="flex items-center gap-2">
                    <span aria-hidden>{flag}</span> {code}
                  </span>,
                  <span key={`${code}-r`} className="tabular-nums">
                    {rate}
                  </span>,
                ])}
              />
              <Note>
                Illustrative rates, not market quotations. Every rate needs an effective date and a source —
                transaction-date rates, closing rates or approved averages, depending on the requirement.
              </Note>
              <AiNote>
                {AI} can identify missing rates, flag abnormal changes and highlight transactions needing a
                currency-related review.
              </AiNote>
            </Fn>

            <Fn id="converter" title="Currency converter — quick equivalents">
              <P>
                Equivalent amounts between currencies at the latest applicable rate — useful when quoting, reviewing
                international supplier prices, planning transfers or comparing costs across countries.
              </P>
              <Figures
                items={[
                  ["Amount", "10,000 USD"],
                  ["Rate", "1 USD = 1.38 CAD"],
                  ["Converted", "13,800.00 CAD"],
                ]}
              />
              <Note>Illustrative fixed rates. Bank fees and conversion spreads are excluded.</Note>
              <AiNote>
                She can compare the converted cost of international purchases, analyse the currency effect on
                profitability and prepare multi-currency estimates.
              </AiNote>
            </Fn>

            <Fn id="revaluation" title="Revaluation — the period-end adjustment">
              <P>
                Eligible foreign currency monetary assets and liabilities are restated at the reporting-date rate:
                foreign bank accounts, outstanding invoices, supplier bills and foreign currency loans.
              </P>
              <Caption>Example — a USD balance against a CAD functional currency</Caption>
              <Figures
                items={[
                  ["Original carrying value", "$67,500.00"],
                  ["Revalued carrying value", "$70,000.00"],
                  ["Unrealised exchange gain", "$2,500.00"],
                ]}
              />
              <Ledger
                rows={[
                  ["Foreign currency asset", "$2,500.00", "—"],
                  ["Exchange gain", "—", "$2,500.00"],
                ]}
              />
              <Note>
                Assumes ordinary monetary balances with exchange differences recognised in profit or loss — which
                matters most for groups reporting across several countries in one currency.
              </Note>
              <AiNote>
                {AI} can identify the balances needing revaluation, prepare the proposed adjustments and explain what
                the rate movement did to performance.
              </AiNote>
            </Fn>

            <PartHeading title="Budgeting & financial planning" />

            <Fn id="budgets" title="Budget list — the plan, against what happened">
              <P>
                Budgets across departments, branches, projects and entities, compared with actual ledger results so
                variances surface while something can still be done about them.
              </P>
              <Photos photos={budgetPhotos} />
              <Caption>Example — the annual operating budget</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                {[
                  ["Budgeted revenue", "$2.50M", "Actual $2.65M — 6% above"],
                  ["Budgeted expenses", "$1.95M", "Actual $2.02M — 3.6% above"],
                  ["Operating profit", "$630,000", "+$80,000 favourable"],
                ].map(([label, value, note]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                    <p className="text-[12px] text-lp-muted">{note}</p>
                  </div>
                ))}
              </div>
              <Caption>Budget against actual, by department</Caption>
              <BudgetChart />
              <DataTable
                head={["Department", "Budget", "Actual", "Variance", "Performance"]}
                rows={[
                  ...budget.map(([department, planned, actual]) => {
                    const variance = planned - actual;
                    return [
                      department,
                      `$${planned.toLocaleString("en-US")}`,
                      `$${actual.toLocaleString("en-US")}`,
                      `${variance < 0 ? "−" : ""}$${Math.abs(variance).toLocaleString("en-US")}`,
                      <Status key={department} kind={variance > 0 ? "ok" : variance < 0 ? "no" : "info"}>
                        {variance > 0 ? "Favourable" : variance < 0 ? "Adverse" : "On budget"}
                      </Status>,
                    ];
                  }),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="b" className="font-semibold text-lp-ink">$1,950,000</b>,
                    <b key="a" className="font-semibold text-lp-ink">$2,020,000</b>,
                    <b key="v" className="font-semibold text-lp-ink">−$70,000</b>,
                    <Status key="s" kind="no">Adverse</Status>,
                  ],
                ]}
              />
              <AiNote>
                {AI} can analyse the variances, identify the spending trends behind them, prepare forecasts, explain
                where the overspend came from and write the management narrative.
              </AiNote>
            </Fn>
          </div>
        </Container>
      </section>

      {/* accounting integration */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Finance and the ledger</Kicker>
          <H2>From financial activity to financial statements.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Banking, cash, documents, payments, loans and currency adjustments all run through the transaction engine
            — classified, matched, validated, approved — and into the general ledger.
          </p>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Business activity", "Debit", "Credit"]} rows={matrix.map((r) => [...r])} />
          </div>
          <Note>
            Creating budgets, configuring bank rules, setting loan eligibility and maintaining currency records do not
            ordinarily post anything by themselves.
          </Note>
        </Container>
      </section>

      {/* agentic AI */}
      <section>
        <Container className="py-16">
          <Kicker>Agentic AI across all 24 functions</Kicker>
          <H2>
            You ask. She understands. <Serif className="text-[32px] sm:text-[40px]">She delivers.</Serif>
          </H2>
          <div className="mt-8">
            <DataTable
              head={[`What you ask ${AI}`, "What she can prepare or perform"]}
              rows={asks.map(([q, a]) => [
                <span key={q} className="font-medium text-lp-ink">
                  &ldquo;{q}&rdquo;
                </span>,
                a,
              ])}
            />
          </div>

          <Caption>Example — Monday morning with the finance director</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Finance director</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  Good morning, {AI}. Review all our bank accounts, process the outstanding transactions, check the
                  loans, identify upcoming debt repayments, prepare the currency exposure report and explain our
                  budget performance.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {[
                  ["Consolidated cash", "$485,000"],
                  ["Due within 30 days", "$32,000"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-lp-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{k}</p>
                    <p className="text-[15px] font-semibold text-lp-ink">{v}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "12 bank accounts across six currencies, 1,250 statement transactions",
                  "790 matched against existing invoices and bills",
                  "350 categorised, 80 internal transfers, 30 set aside for clarification",
                  "42 outstanding employee and member loans reviewed",
                  "Currency exposure report and preliminary budget variance prepared",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Needing you: 30 unclear statement lines, $8,500 overdue, three employees behind on instalments, a
                potential $4,250 exchange loss, and marketing $40,000 over budget.
              </p>
            </div>
          </div>
          <Note>Illustrative interaction; no financial transactions have been processed.</Note>
        </Container>
      </section>

      {/* industries */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>One financial platform, many kinds of organisation</Kicker>
          <H2>Different books, same plumbing.</H2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((industry) => (
              <figure key={industry.title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                <div className="relative aspect-[3/2] bg-lp-canvas">
                  <Image
                    src={industry.src}
                    alt={industry.alt}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="px-4 pb-4 pt-3">
                  <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{industry.title}</p>
                  <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{industry.text}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </Container>
      </section>

      {/* controls + philosophy */}
      <section>
        <Container className="py-16">
          <Kicker>Financial controls & governance</Kicker>
          <H2>Automation is not the same as oversight.</H2>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Control", "Purpose"]} rows={controls.map((c) => [...c])} />
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              ["/finance/philosophy-1.jpg", "A cash flow forecast on screen"],
              ["/finance/philosophy-2.jpg", "Bookkeeping being automated"],
              ["/finance/philosophy-3.jpg", "An international transfer being arranged"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-alt">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} financial philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              Your money. Your information. Your control.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              Every transaction tells you something. A customer payment is about collections; a supplier payment about
              expenditure; a loan about commitments; a rate movement about exposure; a budget variance about whether
              the plan is holding. Run through disconnected systems, accountants spend longer collecting that
              information than interpreting it.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-lp-body">
              Growing transaction volumes do not have to mean a larger finance department. The point of intelligent
              accounting is not to remove the accountant — it is to remove the repetitive work, so the judgement, the
              risk and the advice get the attention.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — Manage your money. Understand your numbers.{" "}
              <span className="text-lp-brand">Control your future.</span>
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

/** Department budgets against what was actually spent. */
function BudgetChart() {
  const max = 1000000;
  const top = 10;
  const base = 196;
  const left = 56;
  const band = 94;
  const bar = 26;
  const y = (v: number) => base - (v / max) * (base - top);

  return (
    <div>
      <div className="mt-4 flex gap-5 text-[12px] text-lp-muted">
        {[
          ["Budget", CHART.blue],
          ["Actual", CHART.green],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 540 230" className="mt-2 w-full" role="img" aria-label="Budget against actual expenditure by department">
        {[0, 500000, 1000000].map((v) => (
          <g key={v}>
            <line x1={left} x2="530" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              ${v / 1000}K
            </text>
          </g>
        ))}
        {budget.map(([department, planned, actual], i) => {
          const x = left + i * band + (band - bar * 2 - 5) / 2;
          return (
            <g key={department}>
              <rect x={x} y={y(planned)} width={bar} height={base - y(planned)} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 5} y={y(actual)} width={bar} height={base - y(actual)} rx="3" fill={CHART.green} />
              <text x={left + i * band + band / 2} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[11px]">
                {department}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
