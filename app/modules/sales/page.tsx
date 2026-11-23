import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Mail, Quote } from "lucide-react";
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
  Bullets,
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
  title: `Sales module`, // the root layout appends "· Tax GO"
  description: `The ${AI} sales module in full: 11 functions from the customer account and the proposal through delivery, invoicing, recurring revenue, collection and commissions — with worked examples for each.`,
};

/** The chart colours, as the guide draws them. */
const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

/** The sales lifecycle, end to end. */
const lifecycle: [string, string][] = [
  ["Customer management", "Create or import customer accounts"],
  ["Sales proposals", "Prepare quotations and agree the terms"],
  ["Sales orders", "Confirm orders and track fulfilment"],
  ["Delivery notes", "Dispatch goods and record deliveries"],
  ["Sales invoices", "Issue invoices and record receivables"],
  ["Payment collection", "Send reminders and receive payments"],
  ["Sales performance", "Subscriptions, revenue and commissions"],
];

/** Picking, packing, dispatch, confirmation. */
const delivery: { title: string; text: string; src: string; alt: string }[] = [
  {
    title: "Pick goods",
    text: "Prepare the products against the sales order.",
    src: "/sales/delivery-pick.jpg",
    alt: "A picker collecting stock from warehouse racking",
  },
  {
    title: "Pack goods",
    text: "Confirm the quantities and the packaging.",
    src: "/sales/delivery-pack.jpg",
    alt: "Cartons being packed and taped at a packing bench",
  },
  {
    title: "Dispatch",
    text: "Create the delivery note and record the stock movement.",
    src: "/sales/delivery-dispatch.jpg",
    alt: "Parcels being loaded for despatch",
  },
  {
    title: "Confirm delivery",
    text: "Record the delivery confirmation where available.",
    src: "/sales/delivery-confirm.jpg",
    alt: "A courier holding a parcel while the recipient signs for it",
  },
];

/** The reminder ladder. */
const reminders: [string, string][] = [
  ["23 November — before due", "A friendly reminder that payment is due in seven days."],
  ["30 November — due date", "Notify the customer that payment is now due."],
  ["7 December — 7 days overdue", "First overdue payment reminder."],
  ["14 December — 14 days overdue", "Second reminder, asking for a payment commitment."],
  ["30 December — 30 days overdue", "Escalate to the credit control team."],
];

/** Part E — the 11 functions as one lifecycle. */
const chain: [string, string][] = [
  ["Customers", "Create the account and configure the payment terms."],
  ["Proposals", "Prepare a commercial offer for products and services."],
  ["Sales orders", "Confirm the customer's order and quantities."],
  ["Delivery notes", "Dispatch the products and record fulfilment."],
  ["Invoices", "Issue the invoice and record the receivable."],
  ["Recurring invoices", "Automate the monthly billing for ongoing services."],
  ["Subscriptions", "Monitor recurring revenue and retention."],
  ["Invoice reminders", "Follow up on what is outstanding."],
  ["AR payment", "Receive and allocate customer payments."],
  ["Credit notes", "Adjust invoices for returns and corrections."],
  ["Sales commissions", "Calculate eligible commissions for review."],
];

/** Part F — the management dashboard. */
const dashboard: [string, string][] = [
  ["Monthly net sales", "$340,000"],
  ["Outstanding proposals", "$125,000"],
  ["Open sales orders", "48"],
  ["Monthly recurring revenue", "$75,000"],
  ["Accounts receivable", "$165,000"],
  ["Overdue invoices", "$42,500"],
  ["Customer payments", "$275,000"],
  ["Calculated commissions", "$14,300"],
];

const ageing: [string, string, number][] = [
  ["Not yet due", "$122,500", 100],
  ["1–30 days overdue", "$25,000", 20.4],
  ["31–60 days overdue", "$10,000", 8.2],
  ["61–90 days overdue", "$5,000", 4.1],
  ["Over 90 days overdue", "$2,500", 2],
];

/** Part G — what you can ask her. */
const asks: [string, string][] = [
  ["Import my customer list.", "Validate the records and identify duplicates before import"],
  ["Prepare a proposal for ABC Corporation.", "Draft the proposal from the supplied commercial terms"],
  ["Which customer orders have not been delivered?", "Identify outstanding and partly fulfilled orders"],
  ["Prepare invoices for goods delivered this week.", "Review eligible deliveries and draft the invoices"],
  ["Set up monthly billing for my 500 customers.", "Prepare the recurring invoice schedules"],
  ["How much recurring revenue do we have?", "Calculate MRR, ARR and subscription performance"],
  ["Which customers owe us money?", "Prepare an outstanding balance and ageing report"],
  ["Remind every customer whose invoice is overdue.", "Identify eligible invoices and prepare the reminders"],
  ["Match yesterday's bank receipts to customer invoices.", "Match the payments and flag uncertain allocations"],
  ["Issue a credit note for these returned goods.", "Prepare a credit note against the original invoice"],
  ["Calculate this month's sales commissions.", "Apply the plans and produce a report, with no GL postings"],
];

const integrations: [string, string][] = [
  ["Accounting", "Automatic revenue, receivables, tax and payment accounting"],
  ["CRM", "Customer relationships, leads and opportunities"],
  ["Inventory", "Product availability, reservations and stock movements"],
  ["Retail Xpress", "Retail and point-of-sale transactions"],
  ["Parcel-King", "Logistics, dispatch and last-mile delivery"],
  ["Tax engine", "VAT, GST, HST, PST and sales tax calculations"],
  ["AI agents", "Workflow automation and exception management"],
  ["Analytics", "Sales trends, profitability, behaviour and forecasting"],
];

/** The two dashboard charts, read from the guide. */
const monthly = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
const netSales = [180, 222, 240, 275, 305, 340]; // $000
const collections = [145, 183, 210, 235, 262, 275];
const mrr = [42, 49, 56, 63, 69, 75];

export default function SalesPage() {
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
              More selling. <Serif className="text-[32px] sm:text-[40px]">Less administration.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              The sales module runs the whole customer journey — opening the account, preparing the proposal,
              delivering the goods, issuing the invoice, collecting the payment and measuring how the sales team did.
              Customers, sales, inventory and accounting sit in one system rather than four.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              The aim: sell more, automate the admin, improve cash flow and keep the financial records right.
            </p>
          </div>
        </Container>
      </section>

      {/* the lifecycle */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-lp-muted">The {AI} sales lifecycle</h2>
          <Flow steps={lifecycle} />
          <Note>The figures and workflows in this guide are illustrative examples.</Note>
        </Container>
      </section>

      {/* the 11 functions */}
      <section>
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Customer & sales order management" />

            <Fn id="customers" title="Customers — the account behind everything">
              <P>
                A central database for creating, importing and maintaining customer accounts. Each account is the
                reference point for proposals, orders, invoices, payments, credit notes and outstanding balances.
              </P>
              <div className="mt-4 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 lg:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt lg:w-64">
                  <Image
                    src="/sales/customers.jpg"
                    alt="A customer relationship management screen on a laptop"
                    fill
                    sizes="(min-width: 1024px) 256px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">
                      ABC Retail Corporation
                    </span>
                    <span className="text-[13px] text-lp-muted">CUST-000125 · Canada · CAD</span>
                    <span className="rounded-full bg-ai-done/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai-done">
                      Active
                    </span>
                  </div>
                  <Figures
                    items={[
                      ["Credit limit", "$50,000"],
                      ["Payment terms", "30 days"],
                      ["Outstanding balance", "$12,500"],
                      ["Available credit", "$37,500"],
                    ]}
                  />
                </div>
              </div>
              <Bullets
                title="What you can do"
                items={[
                  "Create individual and corporate accounts",
                  "Import an existing customer list",
                  "Manage contact and billing information",
                  "Configure payment terms and credit limits",
                  "Assign currencies and fiscal positions",
                  "Monitor transaction history and balances",
                ]}
              />
              <Note>
                A business moving from another system can import hundreds or thousands of customer records instead of
                keying in each account.
              </Note>
              <AiNote>
                {AI} can find duplicate accounts, flag incomplete records, analyse payment behaviour and identify
                customers who look like a credit risk.
              </AiNote>
            </Fn>

            <Fn id="proposals" title="Proposals — the offer before the invoice">
              <P>
                A proposal sets out what is being offered, at what price, in what quantity, on what delivery conditions
                and payment terms — a professional offer to a prospect or an existing customer before any invoice
                exists.
              </P>
              <Flow
                steps={[
                  ["Create the proposal", "Customer · Products · Pricing · Terms"],
                  ["Send it to the customer", "With a validity period attached"],
                  ["Accepted, or not", "Convert it to an invoice, or revise, follow up and close"],
                ]}
              />
              <Caption>Example — a software company&rsquo;s proposal</Caption>
              <DataTable
                head={["Description", "Amount"]}
                rows={[
                  ["Software implementation", "$5,000"],
                  ["Annual subscription", "$12,000"],
                  ["Staff training", "$2,000"],
                  ["Subtotal", "$19,000"],
                  ["Ontario HST at 13%", "$2,470"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Proposal total</b>,
                    <b key="v" className="font-semibold text-lp-ink">$21,470</b>,
                  ],
                ]}
              />
              <Note>
                Once accepted it converts to an invoice without re-entering anything. A proposal does not normally
                create a general ledger posting.
              </Note>
              <AiNote>
                She can draft proposals, recommend products, spot expired quotations and prepare the follow-up.
              </AiNote>
            </Fn>

            <Fn id="sales-orders" title="Sales orders — what you agreed to supply">
              <P>
                A sales order records a confirmed order and what the business has agreed to supply. It is the link
                between the sales desk and inventory, the warehouse, logistics and accounting.
              </P>
              <div className="mt-4 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 lg:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt lg:w-64">
                  <Image
                    src="/sales/sales-orders.jpg"
                    alt="Stock held on pallet racking in a fulfilment warehouse"
                    fill
                    sizes="(min-width: 1024px) 256px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">
                    SO-001025 · ABC Retail Corporation
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {[
                      ["Laptop computers", 15, 20],
                      ["Computer monitors", 40, 40],
                      ["Office printers", 0, 10],
                    ].map(([name, done, total]) => (
                      <li key={name as string}>
                        <div className="flex items-baseline justify-between text-[13.5px]">
                          <span className="text-lp-body">{name}</span>
                          <span className="text-lp-muted">
                            {done} of {total} delivered
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lp-alt">
                          <div
                            className="h-full rounded-full bg-lp-brand"
                            style={{ width: `${((done as number) / (total as number)) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[13.5px] text-lp-body">
                    <b className="font-semibold text-lp-ink">78.6% fulfilled</b> — 55 of 70 units delivered, 15
                    outstanding.
                  </p>
                </div>
              </div>
              <Note>
                Confirming an order does not by itself recognise revenue; that follows the applicable accounting
                policy.
              </Note>
              <AiNote>
                {AI} can identify delayed orders, highlight insufficient stock, recommend fulfilment priorities and
                warn the sales team about delivery problems.
              </AiNote>
            </Fn>

            <Fn id="delivery-notes" title="Delivery notes — goods out of the door">
              <P>
                A delivery note records what was dispatched to a customer, tying the sales order, the inventory
                movement and the physical delivery together.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {delivery.map((step) => (
                  <figure key={step.title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image
                        src={step.src}
                        alt={step.alt}
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{step.title}</p>
                      <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{step.text}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <DataTable
                head={["Product", "Ordered", "Delivered", "Outstanding"]}
                rows={[
                  ["Laptops", "20", "15", "5"],
                  ["Monitors", "40", "40", "0"],
                  ["Printers", "10", "0", "10"],
                ]}
              />
              <Note>
                Where inventory accounting is integrated, the confirmed movement can also trigger inventory and
                cost-of-sales entries under your accounting policy. Delivery can hand over to Parcel-King for
                logistics and last-mile management.
              </Note>
              <AiNote>
                She can identify incomplete deliveries, discrepancies between ordered and dispatched quantities, and
                orders still waiting to be fulfilled.
              </AiNote>
            </Fn>

            <PartHeading title="Invoicing & recurring revenue" />

            <Fn id="invoices" title="Invoices — asking to be paid">
              <P>
                A sales invoice requests payment for what was supplied. Once posted it creates the accounting records:
                accounts receivable, revenue or deferred revenue, and the applicable taxes.
              </P>
              <Caption>Example — sales invoice</Caption>
              <div className="mt-3 overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-lp-line px-5 py-4">
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">INV-2026-00125</p>
                    <p className="mt-0.5 text-[13px] text-lp-muted">
                      ABC Retail Corporation, Ontario · payment terms 30 days
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[13px] text-lp-muted">21 November 2026</span>
                    <span className="rounded-full bg-needs-human/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-needs-human">
                      Unpaid
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4">
                  <DataTable
                    head={["Description", "Qty", "Amount"]}
                    rows={[
                      ["Laptop computers", "10", "$10,000"],
                      ["Installation service", "1", "$500"],
                    ]}
                  />
                  <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-[13.5px]">
                    <div className="flex justify-between gap-6">
                      <dt className="text-lp-muted">Subtotal</dt>
                      <dd className="text-lp-body">$10,500.00</dd>
                    </div>
                    <div className="flex justify-between gap-6">
                      <dt className="text-lp-muted">HST at 13%</dt>
                      <dd className="text-lp-body">$1,365.00</dd>
                    </div>
                    <div className="flex justify-between gap-6 border-t border-lp-line pt-1.5">
                      <dt className="font-semibold text-lp-ink">Total due</dt>
                      <dd className="font-semibold text-lp-ink">$11,865.00</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <Caption>Automatic accounting entry</Caption>
              <P small>Assuming the sale qualifies for immediate revenue recognition:</P>
              <Ledger
                rows={[
                  ["Accounts receivable", "$11,865", "—"],
                  ["Sales revenue", "—", "$10,500"],
                  ["HST payable", "—", "$1,365"],
                ]}
              />
              <AiNote>
                {AI} can prepare invoices, spot unusual prices, detect duplicates, recommend the tax treatment and keep
                watch on what is outstanding.
              </AiNote>
            </Fn>

            <Fn id="recurring-invoices" title="Recurring invoices — billing that repeats itself">
              <P>
                Recurring invoices generate customer invoices on a schedule — software subscriptions, internet
                services, rent, retainers, maintenance contracts. You configure the customer, the services, the
                amount, the frequency, the dates and the payment terms.
              </P>
              <Caption>Example — a monthly internet subscription</Caption>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                  <span key={m} className="rounded-lg bg-lp-brand/8 px-2.5 py-1.5 text-[12px] text-lp-body">
                    <b className="font-semibold text-lp-ink">{m}</b> $150
                  </span>
                ))}
              </div>
              <P small>$150 a month — $1,800 a year, generated automatically, before applicable taxes.</P>
              <Example>
                An internet provider with 500 customers at $150 a month would otherwise create 500 invoices every
                month: 6,000 a year that no longer need preparing by hand.
              </Example>
              <AiNote>
                She can monitor the schedules, catch failed generations, flag expiring contracts and suggest where
                else billing could be automated.
              </AiNote>
            </Fn>

            <Fn id="subscriptions" title="Subscriptions — the recurring revenue view">
              <P>
                A subscription-lite view built on the recurring invoice schedules: what is active, monthly recurring
                revenue, churn, and the monthly equivalent of every schedule — without a separate subscription system.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Monthly recurring revenue", "$75,000"],
                  ["Annualised recurring revenue", "$900,000"],
                  ["Active subscriptions", "500"],
                  ["Monthly customer churn", "2.0%"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">{label}</p>
                    <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <Caption>Monthly recurring revenue trend</Caption>
              <MrrChart />
              <DataTable
                head={["Metric", "Definition"]}
                rows={[
                  ["MRR", "The normalised monthly value of active recurring subscriptions"],
                  ["ARR", "Annualised recurring revenue, generally MRR × 12"],
                  ["Customer churn", "The percentage of customers lost during a period"],
                  ["Revenue churn", "Recurring revenue lost against opening recurring revenue"],
                  ["Active subscriptions", "Recurring invoice schedules currently active"],
                  ["Monthly schedule value", "A recurring invoice converted to its monthly equivalent"],
                ]}
              />
              <Note>
                A customer paying $1,200 a year contributes $100 to MRR, even though the invoice goes out once. MRR and
                ARR are operational indicators — they do not necessarily equal recognised revenue or cash received.
              </Note>
              <AiNote>
                {AI} can analyse recurring revenue trends, identify cancellations, forecast future billing and point
                out retention opportunities.
              </AiNote>
            </Fn>

            <PartHeading title="Receivables & collection" />

            <Fn id="reminders" title="Invoice reminders — chasing payment politely">
              <P>
                Automated emails before and after an invoice falls due, so collecting money does not mean someone
                contacting every customer by hand. You set the timing, the templates, the frequency and the escalation.
              </P>
              <Caption>Example — invoice issued 1 November, 30-day terms</Caption>
              <ol className="mt-3 space-y-2">
                {reminders.map(([when, what], i) => (
                  <li key={when} className="flex gap-3 rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <span
                      className={cn(
                        "mt-1 h-2 w-2 shrink-0 rounded-full",
                        i < 2 ? "bg-lp-brand" : i < 4 ? "bg-needs-human" : "bg-lp-ink/40",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-lp-ink">{when}</p>
                      <p className="mt-0.5 text-[13px] text-lp-muted">{what}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Caption>The reminder itself</Caption>
              <div className="mt-3 max-w-xl rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                <p className="flex items-center gap-2 border-b border-lp-line pb-2.5 text-[13px] font-semibold text-lp-ink">
                  <Mail className="h-3.5 w-3.5 text-lp-brand" strokeWidth={2} /> Payment reminder — invoice INV-00125
                </p>
                <div className="mt-3 space-y-2 text-[13.5px] leading-[1.6] text-lp-body">
                  <p>Dear Customer,</p>
                  <p>This is a friendly reminder that your invoice of $11,865 is due for payment.</p>
                  <p>
                    We would appreciate payment at your earliest convenience. If payment has already been made, please
                    disregard this reminder.
                  </p>
                  <p>Thank you for your continued business.</p>
                  <p className="text-lp-muted">Accounts Receivable Team</p>
                </div>
              </div>
              <Note>
                Reminders stop automatically when an invoice is settled, and account for partial payments, credit notes
                and disputed balances.
              </Note>
              <AiNote>
                She can prioritise overdue invoices, personalise the wording, identify repeat late payers and
                recommend a collection strategy.
              </AiNote>
            </Fn>

            <Fn id="ar-payment" title="AR payment — money in, allocated">
              <P>
                Customer receipts recorded and allocated against outstanding invoices, so customer balances and the
                accounting records reflect what has actually arrived.
              </P>
              <Bullets
                title="What you can do"
                items={[
                  "Record customer receipts",
                  "Allocate one payment across several invoices",
                  "Process partial payments",
                  "Manage advances and unallocated amounts",
                  "Record references and payment methods",
                  "Reconcile receipts against the bank",
                ]}
              />
              <Caption>Example — allocating one receipt</Caption>
              <div className="mt-3 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                <p className="text-[13.5px] text-lp-body">
                  Customer bank payment received <b className="font-semibold text-lp-ink">$15,000</b>
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {[
                    ["INV-001", "$5,000"],
                    ["INV-002", "$7,000"],
                    ["INV-003", "$3,000"],
                  ].map(([ref, amount]) => (
                    <div key={ref} className="rounded-lg bg-lp-alt px-3 py-2.5">
                      <p className="text-[12px] text-lp-muted">{ref}</p>
                      <p className="text-[14px] font-semibold text-lp-ink">{amount}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-3 flex items-center gap-2 text-[13px] text-ai-done">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> All $15,000 allocated
                </p>
              </div>
              <Ledger
                rows={[
                  ["Bank account", "$15,000", "—"],
                  ["Accounts receivable", "—", "$15,000"],
                ]}
              />
              <P small>This reduces the customer balance without recognising the invoiced revenue twice.</P>
              <AiNote>
                {AI} can match bank receipts to invoices on customer names, references, dates and amounts, and hand the
                uncertain ones to you.
              </AiNote>
            </Fn>

            <Fn id="credit-notes" title="Credit notes — giving money back">
              <P>
                A credit note reduces something already invoiced: returned goods, damage, overbilling, an agreed
                discount, a service dispute or a goodwill adjustment. The credit can sit against an outstanding
                invoice, stay on the account, or be refunded through an authorised payment.
              </P>
              <Caption>Example — a customer returns goods</Caption>
              <Figures
                items={[
                  ["Original invoice", "$11,300"],
                  ["Credit note issued", "−$2,260"],
                  ["Revised balance", "$9,040"],
                ]}
              />
              <P small>Assuming returned goods worth $2,000 before Ontario HST:</P>
              <Ledger
                rows={[
                  ["Sales returns", "$2,000", "—"],
                  ["HST payable", "$260", "—"],
                  ["Accounts receivable", "—", "$2,260"],
                ]}
              />
              <Note>
                Where goods physically come back, the inventory and cost-of-sales adjustments are processed separately.
              </Note>
              <AiNote>
                She can spot potentially duplicated credit notes, point to the right original invoice, calculate the tax
                adjustment and flag customers whose return rate looks unusual.
              </AiNote>
            </Fn>

            <PartHeading title="Sales performance & incentives" />

            <Fn id="commissions" title="Sales commissions — what the team earned">
              <P>
                Percentage-based commission plans per salesperson, calculated one of two ways.
              </P>
              <DataTable
                head={["Method", "What it is calculated on"]}
                rows={[
                  ["Invoiced basis", "Eligible pre-tax net invoiced sales"],
                  ["Collected basis", "Eligible customer payments collected, excluding tax"],
                ]}
              />
              <P small>
                The collected method pushes salespeople to care not only about winning the sale but about the customer
                actually paying.
              </P>
              <Caption>Example — one plan at 5%</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Invoiced basis</p>
                  <p className="mt-1 text-[13.5px] text-lp-body">$100,000 eligible net sales</p>
                  <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">$5,000</p>
                </div>
                <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Collected basis</p>
                  <p className="mt-1 text-[13.5px] text-lp-body">$80,000 eligible net collections</p>
                  <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">$4,000</p>
                </div>
              </div>
              <Caption>Commission report</Caption>
              <DataTable
                head={["Salesperson", "Net invoiced", "Net collected", "Rate", "Basis", "Commission"]}
                rows={[
                  ["John", "$100,000", "$80,000", "5%", "Invoiced", "$5,000"],
                  ["Sarah", "$150,000", "$120,000", "4%", "Collected", "$4,800"],
                  ["David", "$90,000", "$75,000", "6%", "Collected", "$4,500"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="i" className="font-semibold text-lp-ink">$340,000</b>,
                    <b key="c" className="font-semibold text-lp-ink">$275,000</b>,
                    "—",
                    "—",
                    <b key="v" className="font-semibold text-lp-ink">$14,300</b>,
                  ],
                ]}
              />
              <Warning>
                Commissions are a calculation and reporting tool only. Nothing posts to the general ledger, creates a
                payroll liability or initiates a payment — approved commissions go through payroll or the appropriate
                accounting workflow.
              </Warning>
              <AiNote>
                {AI} can compare performance, explain how a figure was reached, identify outstanding collections
                holding commission back and prepare the management summary.
              </AiNote>
            </Fn>
          </div>
        </Container>
      </section>

      {/* part E — the chain */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>How the 11 work together</Kicker>
          <H2>From customer acquisition to cash collection.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Take a business supplying products and recurring software services to a corporate customer.
          </p>
          <ol className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {chain.map(([title, text]) => (
              <li key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{text}</p>
              </li>
            ))}
          </ol>
          <Note>
            Recurring invoices, credit notes, reminders and commissions are conditional steps, not mandatory ones for
            every sale.
          </Note>
        </Container>
      </section>

      {/* part F — the dashboard */}
      <section>
        <Container className="py-16">
          <Kicker>The sales dashboard</Kicker>
          <H2>Revenue, receivables and what is still owed.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">{label}</p>
                <p className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <div className="rounded-xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">
                Monthly sales vs collections
              </p>
              <SalesChart />
            </div>
            <div className="rounded-xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">
                Accounts receivable ageing
              </p>
              <ul className="mt-3 space-y-2.5">
                {ageing.map(([label, value, width]) => (
                  <li key={label}>
                    <div className="flex items-baseline justify-between text-[13.5px]">
                      <span className="text-lp-body">{label}</span>
                      <span className="font-semibold text-lp-ink">{value}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lp-alt">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${width}%`, backgroundColor: width === 100 ? CHART.green : CHART.orange }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <Note>Sample data for demonstration only.</Note>
        </Container>
      </section>

      {/* part G — the assistant */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>The agentic AI sales assistant</Kicker>
          <H2>
            You ask. She understands. <Serif className="text-[32px] sm:text-[40px]">She delivers.</Serif>
          </H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Owners and sales teams can work through their business in plain language instead of walking through
            screens.
          </p>
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

          <Caption>Example — an agentic sales workflow</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Business owner</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  {AI}, review all our sales this month, identify outstanding customer payments, follow up on overdue
                  invoices, and calculate commissions for my sales team.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                I&rsquo;ve reviewed your sales transactions, customer accounts and commission plans.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "Analysed $340,000 in net monthly sales",
                  "Identified $165,000 in outstanding customer balances",
                  "Highlighted $42,500 in overdue invoices",
                  "Prepared payment reminders for the eligible customers",
                  "Calculated $14,300 in salesperson commissions",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Three disputed invoices are excluded from the reminders and need your review.{" "}
                <b className="font-semibold text-lp-ink">Ready for your approval.</b>
              </p>
            </div>
          </div>
          <Note>Illustrative interaction. No invoices, messages or payments are being processed here.</Note>
        </Container>
      </section>

      {/* integrations + philosophy */}
      <section>
        <Container className="py-16">
          <Kicker>Integration with the other modules</Kicker>
          <H2>Sales does not work alone.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {integrations.map(([mod, benefit]) => (
              <div key={mod} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{mod}</p>
                <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-3xl text-center">
            <Kicker>The {AI} sales philosophy</Kicker>
            <p className="mt-5 text-[19px] leading-[1.5] text-lp-ink">
              Selling should be about building customer relationships, generating revenue and growing a business — not
              hours spent preparing invoices, chasing payments and working out commissions.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.65] text-lp-body">
              Salespeople concentrate on selling, accountants on financial management, owners on growth — while
              customers, orders, deliveries, invoices, subscriptions and payments stay connected behind them.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — More selling. Less administration.{" "}
              <span className="text-lp-brand">Better cash flow.</span>
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

/** A control worth noticing. */
function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex max-w-3xl gap-2.5 rounded-xl border border-needs-human/30 bg-needs-human/8 px-4 py-3 text-[13.5px] leading-[1.6] text-lp-body">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-needs-human" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}

/** Net sales against collections, month by month. */
function SalesChart() {
  const max = 360;
  const top = 10;
  const base = 196;
  const left = 46;
  const band = 84;
  const bar = 24;
  const y = (v: number) => base - (v / max) * (base - top);

  return (
    <div>
      <div className="mt-3 flex gap-5 text-[12px] text-lp-muted">
        {[
          ["Net sales", CHART.blue],
          ["Collections", CHART.green],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 550 230" className="mt-2 w-full" role="img" aria-label="Monthly net sales against collections, June to November">
        {[0, 90, 180, 270, 360].map((v) => (
          <g key={v}>
            <line x1={left} x2="540" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              ${v}K
            </text>
          </g>
        ))}
        {monthly.map((m, i) => {
          const x = left + i * band + (band - bar * 2 - 6) / 2;
          return (
            <g key={m}>
              <rect x={x} y={y(netSales[i])} width={bar} height={base - y(netSales[i])} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 6} y={y(collections[i])} width={bar} height={base - y(collections[i])} rx="3" fill={CHART.green} />
              <text x={left + i * band + band / 2} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[12px]">
                {m}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Monthly recurring revenue, climbing. */
function MrrChart() {
  const max = 90;
  const min = 30;
  const top = 12;
  const base = 120;
  const left = 46;
  const step = (520 - left) / (monthly.length - 1);
  const y = (v: number) => base - ((v - min) / (max - min)) * (base - top);
  const points = mrr.map((v, i) => `${left + i * step},${y(v)}`).join(" ");

  return (
    <svg viewBox="0 0 540 160" className="mt-3 w-full" role="img" aria-label="Monthly recurring revenue, June to November">
      {[30, 60, 90].map((v) => (
        <g key={v}>
          <line x1={left} x2="528" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
          <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[10px]">
            ${v}K
          </text>
        </g>
      ))}
      <polyline points={points} fill="none" stroke={CHART.blue} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {mrr.map((v, i) => (
        <g key={monthly[i]}>
          <circle cx={left + i * step} cy={y(v)} r="3.5" fill={CHART.blue} />
          <text x={left + i * step} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[11px]">
            {monthly[i]}
          </text>
        </g>
      ))}
    </svg>
  );
}
