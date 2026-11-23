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

/** The dashboard's chart colours, as the guide draws them. */
const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

export const metadata = {
  title: `Purchasing module`, // the root layout appends "· Tax GO"
  description: `The ${AI} purchasing module in full: 13 functions across vendor management, procurement approvals, goods receipt, accounts payable and vendor payments — with worked examples for each.`,
};

/** The procure-to-pay cycle, end to end. */
const lifecycle: [string, string][] = [
  ["Vendor management", "Create suppliers and establish purchasing prices"],
  ["Purchase requisitions", "Identify requirements and obtain approval"],
  ["Request for quotation", "Request, evaluate and compare vendor offers"],
  ["Purchase orders & agreements", "Authorise purchases and manage long-term agreements"],
  ["Goods receipt & inspection", "Receive goods, inspect quality and manage returns"],
  ["Vendor bills & debit notes", "Record, verify and reconcile supplier obligations"],
  ["Payment runs & AP payments", "Prepare batch payments and settle supplier balances"],
];

/** The goods receipt walk-through, with the photographs from the guide. */
const receiving: { src: string; alt: string; title: string; text: string }[] = [
  {
    src: "/purchasing/receive-goods.jpg",
    alt: "Warehouse staff unloading a pallet from a delivery lorry at a loading dock",
    title: "Receive goods",
    text: "Identify the vendor and the original purchase order.",
  },
  {
    src: "/purchasing/verify-quantities.jpg",
    alt: "A warehouse worker scanning a carton's barcode against a printed checklist",
    title: "Verify quantities",
    text: "Compare delivered quantities with ordered quantities.",
  },
  {
    src: "/purchasing/inspect-goods.jpg",
    alt: "An inspector in a hard hat examining an electronic component in a stores area",
    title: "Inspect goods",
    text: "Identify damaged, defective or incorrect products.",
  },
  {
    src: "/purchasing/confirm-receipt.jpg",
    alt: "A warehouse worker checking boxes on a racking aisle with a handheld scanner",
    title: "Confirm receipt",
    text: "Update accepted stock and outstanding purchase quantities.",
  },
];

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Part F — the 13 functions as one lifecycle. */
const chain: [string, string][] = [
  ["Vendors", "Register approved suppliers and maintain their details."],
  ["Vendor prices", "Establish agreed prices and quantity discounts."],
  ["Purchase requisitions", "Employees request goods and obtain internal approval."],
  ["Request for quotation", "Compare vendor offers and select a supplier."],
  ["Purchase orders", "Prepare and authorise the purchasing commitment."],
  ["Blanket orders", "Manage long-term purchasing agreements where required."],
  ["Goods receipt notes", "Receive, inspect and record incoming goods."],
  ["Purchase returns", "Return defective or incorrect goods where necessary."],
  ["Bills", "Record and validate supplier invoices."],
  ["Recurring bills", "Automate scheduled supplier expenses."],
  ["Debit notes", "Apply vendor credits and purchasing adjustments."],
  ["Payment runs", "Consolidate approved bills into batch payments."],
  ["AP payments", "Record, allocate and reconcile vendor payments."],
];

/** Part G — the management dashboard. */
const dashboard: [string, string][] = [
  ["Monthly purchases", "$280,000"],
  ["Pending requisitions", "18"],
  ["Open purchase orders", "42"],
  ["Purchase commitments", "$185,000"],
  ["Accounts payable", "$210,000"],
  ["Overdue vendor bills", "$35,000"],
  ["Upcoming payment run", "$70,000"],
  ["Price negotiation savings", "$12,500"],
];

const ageing: [string, string, number][] = [
  ["Not yet due", "$175,000", 100],
  ["1–30 days overdue", "$20,000", 11.4],
  ["31–60 days overdue", "$10,000", 5.7],
  ["61–90 days overdue", "$3,000", 1.7],
  ["Over 90 days overdue", "$2,000", 1.1],
];

/** Part H — what you can ask her. */
const asks: [string, string][] = [
  ["Review all my vendor accounts.", "Identify duplicates, incomplete records and supplier balances"],
  ["Find the best purchase price for 500 units.", "Compare eligible vendor prices and quantity breaks"],
  ["Create a purchase request for 20 computers.", "Prepare a requisition and route it for approval"],
  ["Request quotations from our approved vendors.", "Prepare and send authorised RFQs"],
  ["Create purchase orders from approved requisitions.", "Generate purchase order drafts"],
  ["How much is remaining on our annual supplier agreements?", "Analyse blanket order utilisation"],
  ["Which purchase orders have not been fully delivered?", "Identify outstanding and partially received orders"],
  ["Show me all defective goods returned to suppliers.", "Prepare purchase return and supplier quality reports"],
  ["Check today's supplier invoices.", "Perform matching, tax checks and duplicate detection"],
  ["Set up monthly bills for rent and internet.", "Prepare recurring bill schedules"],
  ["Find all vendor credits we have not received.", "Identify unresolved returns and financial adjustments"],
  ["Prepare this week's supplier payment run.", "Select eligible bills and prepare payments for approval"],
  ["Reconcile yesterday's vendor payments.", "Match payment records against bank transactions"],
];

/** Part I — the control framework. */
const controls: [string, string][] = [
  ["Approved vendor register", "Prevent purchasing from unauthorised suppliers"],
  ["Budget availability checks", "Control expenditure against approved budgets"],
  ["Purchase requisition approvals", "Confirm the business need before purchasing"],
  ["Competitive quotations", "Promote fair and cost-effective procurement"],
  ["Approval thresholds", "Route purchases according to delegated authority"],
  ["Three-way matching", "Prevent payment for unauthorised or undelivered goods"],
  ["Duplicate invoice detection", "Reduce the risk of paying the same invoice twice"],
  ["Vendor bank verification", "Reduce supplier payment redirection fraud"],
  ["Segregation of duties", "Separate purchasing, receiving, approval and payment"],
  ["Payment batch approval", "Prevent unauthorised financial transactions"],
  ["Audit trail", "Maintain evidence of purchasing decisions and approvals"],
];

const duties: [string, string][] = [
  ["Requesting department", "Identifies purchasing requirements"],
  ["Procurement officer", "Obtains quotations and prepares orders"],
  ["Warehouse / operations", "Receives and inspects goods"],
  ["Accounts payable", "Validates and records vendor bills"],
  ["Finance manager", "Reviews expenditure and payment batches"],
  ["Authorised signatory", "Authorises the release of funds"],
];

/** Part J — what purchasing plugs into. */
const integrations: [string, string][] = [
  ["Accounting", "Automatic expense, inventory, tax and payable accounting"],
  ["Inventory", "Stock replenishment, goods receipts and purchase returns"],
  ["Budgeting", "Expenditure control and purchasing commitments"],
  ["Manufacturing", "Raw material purchasing and production requirements"],
  ["Projects", "Project-specific procurement and cost allocation"],
  ["Tax engine", "Purchase VAT, GST, HST, PST and other treatments"],
  ["Banking", "Payment file generation and bank reconciliation"],
  ["AI agents", "Procurement automation, analysis and exception management"],
  ["Fixed assets", "Capital expenditure and asset registration"],
  ["Analytics", "Vendor performance, expenditure trends and efficiency"],
];

export default function PurchasingPage() {
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
              Smarter purchasing. <Serif className="text-[32px] sm:text-[40px]">Stronger financial controls.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              The purchasing module runs the whole procure-to-pay cycle — from identifying a requirement and choosing a
              vendor to receiving goods, processing supplier bills and paying them. Rather than handling procurement,
              inventory, suppliers and accounts payable in separate systems, {AI} connects them in one place.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              The aim: keep expenditure under control, negotiate better prices, prevent duplicate payments, improve
              supplier relationships and automate the repetitive parts of procurement.
            </p>
          </div>
        </Container>
      </section>

      {/* the lifecycle */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-12">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.2em] text-lp-muted">
            The {AI} procure-to-pay lifecycle
          </h2>
          <Flow steps={lifecycle} />
          <Note>
            Illustrative procurement workflow. The processes used depend on your own procurement policies and purchasing
            requirements.
          </Note>
        </Container>
      </section>

      {/* the 13 functions */}
      <section>
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">

            <div>
              <PartHeading title="Vendor management & purchasing configuration" />

              <Fn id="vendors" title="Vendors — vendor account management">
                <P>
                  A central database for creating and maintaining supplier accounts. Every vendor account is the
                  reference point for purchasing prices, quotations, purchase orders, goods receipts, bills, debit notes
                  and payments.
                </P>
                <Bullets
                  title="What you can do"
                  items={[
                    "Create and maintain vendor accounts",
                    "Manage supplier addresses and contacts",
                    "Configure payment terms and currencies",
                    "Maintain tax registrations and fiscal positions",
                    "Review purchasing and payment history",
                    "Monitor outstanding bills and vendor balances",
                    "Maintain approved supplier banking details",
                  ]}
                />
                <Caption>Working the list</Caption>
                <Flow
                  steps={[
                    ["Single-click a field", "Edit vendor information without opening the full record"],
                    ["Double-click a row", "Open the vendor's account and transaction history"],
                    ["Right-click a row", "Reach the available vendor management actions"],
                  ]}
                />
                <Caption>Example — a vendor account</Caption>
                <div className="mt-3 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">
                      Global Technology Supplies Ltd
                    </span>
                    <span className="text-[13px] text-lp-muted">VEND-00125 · Canada · CAD</span>
                    <span className="rounded-full bg-ai-done/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai-done">
                      Active
                    </span>
                  </div>
                  <Figures
                    items={[
                      ["Payment terms", "30 days"],
                      ["Annual purchases", "$250,000"],
                      ["Outstanding bills", "$35,000"],
                      ["Overdue bills", "$5,000"],
                    ]}
                  />
                </div>
                <Note>Illustrative vendor account.</Note>
                <AiNote>
                  {AI} can find duplicate vendor accounts, analyse payment history, flag incomplete records and
                  highlight unusual changes to supplier information.
                </AiNote>
                <Warning>
                  Changes to sensitive information — vendor banking details above all — should require independent
                  verification and approval rather than unrestricted inline editing.
                </Warning>
              </Fn>

              <Fn id="vendor-prices" title="Vendor prices — supplier pricing">
                <P>
                  Vendor prices are the agreed purchase prices for a product or service from a particular supplier. You
                  can hold different prices for the same product across vendors, with validity periods and
                  quantity-based arrangements.
                </P>
                <Bullets
                  title="What you can do"
                  items={[
                    "Maintain product-specific prices per vendor",
                    "Configure price validity start and end dates",
                    "Set quantity discounts and price breaks",
                    "Maintain vendor-specific currencies",
                    "Default eligible prices onto purchase order lines",
                    "Compare supplier purchasing costs",
                  ]}
                />
                <Caption>Example — buying laptops</Caption>
                <DataTable
                  head={["Vendor", "Minimum quantity", "Unit price"]}
                  rows={[
                    ["Vendor A", "1", "$850"],
                    ["Vendor A", "50", "$800"],
                    ["Vendor A", "100", "$750"],
                    ["Vendor B", "1", "$820"],
                    ["Vendor B", "50", "$790"],
                    ["Vendor B", "100", "$780"],
                  ]}
                />
                <P small>
                  Assuming every price is valid on the purchasing date, {AI} picks the right quantity break for the
                  vendor you choose. At 100 laptops:
                </P>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-lp-brand/40 bg-lp-brand/6 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-lp-brand">Vendor A — lowest</p>
                    <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-lp-ink">$75,000.00</p>
                    <p className="text-[12.5px] text-lp-muted">$750.00 per unit</p>
                  </div>
                  <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Vendor B</p>
                    <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-lp-ink">$78,000.00</p>
                    <p className="text-[12.5px] text-lp-muted">$780.00 per unit</p>
                  </div>
                  <div className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">Potential saving</p>
                    <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-ai-done">$3,000.00</p>
                    <p className="text-[12.5px] text-lp-muted">On this order</p>
                  </div>
                </div>
                <Note>Excludes taxes, shipping, duties, quality differences and other purchasing costs.</Note>
                <AiNote>
                  She can compare vendor prices, spot expired pricing agreements, recommend cost-saving quantities and
                  highlight unexpected increases.
                </AiNote>
              </Fn>

              <PartHeading title="Procurement & purchasing approvals" />

              <Fn id="requisitions" title="Purchase requisitions — internal requests">
                <P>
                  A requisition is an internal request to buy goods or services. Unlike a purchase order it does not
                  normally commit you to a supplier — it lets management review the need, the budget and the authority
                  before any purchase is made.
                </P>
                <Caption>The approval route</Caption>
                <Flow
                  steps={[
                    ["Employee raises the requisition", "Department · Items · Quantity · Business justification"],
                    ["Budget availability check", "Confirm the funding and the expenditure allocation"],
                    ["Department manager review", "Assess the operational requirement"],
                    ["Finance or authorised approval", "Budget, procurement policy and approval limits"],
                    ["Approved, or returned", "Proceed to quotation, or revise, justify or cancel"],
                  ]}
                />
                <Caption>Example — the IT department needs 20 computers</Caption>
                <DataTable
                  head={["Requisition details", "Information"]}
                  rows={[
                    ["Reference", "PR-2026-00125"],
                    ["Department", "Information Technology"],
                    ["Requested quantity", "20 computers"],
                    ["Estimated unit cost", "$800"],
                    ["Estimated total", "$16,000"],
                    ["Budget category", "IT Equipment"],
                    ["Status", "Awaiting approval"],
                  ]}
                />
                <Note>Requisitions prevent unauthorised expenditure and leave a clear procurement audit trail.</Note>
                <AiNote>
                  {AI} can prepare requisitions from operational requirements, check available budgets, find similar
                  existing requests and recommend the approval route.
                </AiNote>
              </Fn>

              <Fn id="rfq" title="Request for quotation — RFQ management">
                <P>
                  An RFQ is a formal invitation to one or more vendors for prices, delivery conditions, payment terms
                  and other commercial information. It supports competitive procurement: compare the offers before
                  committing.
                </P>
                <Caption>Example — quotations for 20 laptops</Caption>
                <DataTable
                  head={["Evaluation criteria", "Vendor A", "Vendor B", "Vendor C"]}
                  rows={[
                    ["Purchase cost", "$16,000", "$15,600", "$16,400"],
                    ["Delivery time", "5 days", "14 days", "3 days"],
                    ["Payment terms", "30 days", "Advance", "60 days"],
                    ["Warranty", "2 years", "1 year", "3 years"],
                  ]}
                />
                <Note>
                  The cheapest supplier is not necessarily the most suitable one. Delivery speed, warranty, quality,
                  working capital and procurement compliance may justify a higher-priced offer.
                </Note>
                <AiNote>
                  She can summarise quotations, compare commercial terms, calculate the differences and prepare a
                  supplier evaluation for management approval.
                </AiNote>
              </Fn>

              <Fn id="purchase-orders" title="Purchase orders — authorised purchasing">
                <P>
                  A purchase order is the formal document issued to a vendor: the goods or services, quantities, agreed
                  prices, delivery requirements and payment terms. It establishes an authorised commitment, subject to
                  the contractual terms.
                </P>
                <Bullets
                  title="What you can do"
                  items={[
                    "Raise orders directly, or from approved requisitions and quotations",
                    "Apply agreed vendor prices automatically",
                    "Configure delivery dates and locations",
                    "Apply the appropriate purchase taxes",
                    "Track ordered, received and outstanding quantities",
                    "Monitor partial fulfilment and completion",
                  ]}
                />
                <Caption>Example — purchase order</Caption>
                <div className="mt-3 overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-lp-line px-5 py-4">
                    <div>
                      <p className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">PO-2026-00125</p>
                      <p className="mt-0.5 text-[13px] text-lp-muted">
                        Global Technology Supplies Ltd · payment terms 30 days
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] text-lp-muted">21 November 2026</span>
                      <span className="rounded-full bg-ai-done/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai-done">
                        Approved
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <DataTable
                      head={["Product", "Qty", "Unit price", "Total"]}
                      rows={[
                        ["Laptops", "20", "$800", "$16,000"],
                        ["Monitors", "20", "$200", "$4,000"],
                      ]}
                    />
                    <dl className="mt-4 ml-auto max-w-xs space-y-1.5 text-[13.5px]">
                      <div className="flex justify-between gap-6">
                        <dt className="text-lp-muted">Subtotal</dt>
                        <dd className="text-lp-body">$20,000</dd>
                      </div>
                      <div className="flex justify-between gap-6">
                        <dt className="text-lp-muted">HST at 13%</dt>
                        <dd className="text-lp-body">$2,600</dd>
                      </div>
                      <div className="flex justify-between gap-6 border-t border-lp-line pt-1.5">
                        <dt className="font-semibold text-lp-ink">Total commitment</dt>
                        <dd className="font-semibold text-lp-ink">$22,600</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                <Note>
                  Issuing a purchase order does not normally create an expense or a payable on its own, though its value
                  can appear in commitment and budget availability reports.
                </Note>
                <AiNote>
                  {AI} can prepare orders from approved requests, recommend vendor pricing, flag excessive quantities
                  and catch orders above the authorised budget.
                </AiNote>
              </Fn>

              <Fn id="blanket-orders" title="Blanket orders — long-term agreements">
                <P>
                  A blanket purchase order sets agreed quantities, prices and conditions with a vendor over a period.
                  Instead of negotiating each purchase, you release individual orders against the agreement as you need
                  the goods — useful in manufacturing, retail, construction, healthcare and hospitality.
                </P>
                <Caption>Example — annual purchasing agreement</Caption>
                <div className="mt-3 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                  <p className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">
                    BO-2026-001 · Electrical supplies
                  </p>
                  <Figures
                    items={[
                      ["Agreed quantity", "1,200 units"],
                      ["Agreed unit price", "$50"],
                      ["Agreement value", "$60,000"],
                      ["Agreement period", "12 months"],
                    ]}
                  />
                  <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">
                    Orders released against it
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      ["January", "200 units"],
                      ["February", "300 units"],
                      ["March", "250 units"],
                    ].map(([m, q]) => (
                      <span key={m} className="rounded-lg bg-lp-alt px-2.5 py-1.5 text-[12px] text-lp-body">
                        <b className="font-semibold text-lp-ink">{m}</b> {q}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline justify-between text-[13px]">
                      <span className="text-lp-body">Released 750 of 1,200 units</span>
                      <span className="font-semibold text-lp-ink">62.5% utilised</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-lp-alt">
                      <div className="h-full rounded-full bg-lp-brand" style={{ width: "62.5%" }} />
                    </div>
                    <p className="mt-2 text-[13px] text-lp-muted">
                      450 units remaining · $22,500 of agreement value left
                    </p>
                  </div>
                </div>
                <Note>{AI} monitors expiry dates, remaining quantities, released orders and prices.</Note>
                <AiNote>
                  She can identify underused agreements, forecast the remaining requirement, recommend releases and
                  highlight purchases beyond the agreed quantities.
                </AiNote>
              </Fn>

              <PartHeading title="Goods receipt & inventory" />

              <Fn id="goods-receipt" title="Goods receipt notes — receiving & inspecting">
                <P>
                  A goods receipt note records what a vendor delivered against a purchase order: the quantities, their
                  condition and whether they meet the requirement. It is the link between procurement, inventory and
                  accounts payable.
                </P>
                <Caption>The receiving process</Caption>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {receiving.map((step) => (
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
                <Caption>Example — goods receipt inspection</Caption>
                <DataTable
                  head={["Product", "Ordered", "Received", "Accepted", "Rejected"]}
                  rows={[
                    ["Laptops", "20", "20", "18", "2"],
                    ["Monitors", "20", "15", "15", "0"],
                    [
                      <b key="t" className="font-semibold text-lp-ink">Total</b>,
                      <b key="o" className="font-semibold text-lp-ink">40</b>,
                      <b key="r" className="font-semibold text-lp-ink">35</b>,
                      <b key="a" className="font-semibold text-lp-ink">33</b>,
                      <b key="x" className="font-semibold text-lp-ink">2</b>,
                    ],
                  ]}
                />
                <P small>
                  Five monitors remain undelivered, and two laptops need a return, a replacement or another resolution.
                </P>
                <Caption>Inventory accounting</Caption>
                <P small>
                  Under perpetual inventory with a goods-received-not-invoiced account, receiving $17,400 of accepted
                  stock may generate:
                </P>
                <Ledger
                  rows={[
                    ["Inventory", "$17,400", "—"],
                    ["Goods received not invoiced", "—", "$17,400"],
                  ]}
                />
                <Note>
                  The actual treatment depends on your inventory policy and on when control of the goods transfers.
                </Note>
                <AiNote>
                  {AI} can find quantity discrepancies, highlight late deliveries, detect duplicated receipts and
                  prepare GRNI reconciliation reports.
                </AiNote>
              </Fn>

              <Fn id="purchase-returns" title="Purchase returns — sending goods back">
                <P>
                  Purchase returns record goods going back to a vendor — damaged, defective, wrongly specified or
                  simply too many — and connect the original purchase order, the goods receipt, the inventory movement
                  and the financial adjustment.
                </P>
                <Flow
                  steps={[
                    ["Identify the goods", "Damaged, defective or incorrect items"],
                    ["Create the return", "Reference the original order and receipt"],
                    ["Authorise & dispatch", "Confirm the quantity and the supplier arrangements"],
                    ["Update inventory", "Remove returned items from owned stock where applicable"],
                    ["Adjust financially", "Request a vendor credit, or record a debit note"],
                  ]}
                />
                <Example>
                  A business buys 100 products at $50. Five accepted items turn out to be defective and go back to the
                  vendor.
                </Example>
                <DataTable
                  head={["Description", "Value"]}
                  rows={[
                    ["Original purchase", "$5,000"],
                    ["Returned quantity", "5 units"],
                    ["Purchase return value", "$250"],
                    ["Remaining purchase value", "$4,750"],
                  ]}
                />
                <Note>
                  Where the purchase has already been invoiced, the return may lead to a vendor debit note or a supplier
                  credit note. The physical return and the financial adjustment must not be counted twice.
                </Note>
                <AiNote>
                  She can analyse supplier defect rates, identify frequently returned products, detect unresolved vendor
                  credits and prepare supplier performance reports.
                </AiNote>
              </Fn>

              <PartHeading title="Accounts payable & vendor billing" />

              <Fn id="bills" title="Bills — vendor invoice management">
                <P>
                  A vendor bill is the supplier&rsquo;s invoice. Once posted it creates or confirms the expense or
                  asset, the recoverable tax and the accounts payable balance.
                </P>
                <Bullets
                  title="What you can do"
                  items={[
                    "Create and manage vendor bills",
                    "Record supplier references and due dates",
                    "Attach the supporting documents",
                    "Match bills to purchase orders and goods receipts",
                    "Apply the appropriate purchase taxes",
                    "Track paid, unpaid, overdue and part-paid bills",
                    "Detect potential duplicate invoices",
                  ]}
                />
                <Caption>Three-way matching</Caption>
                <P small>
                  One of the module&rsquo;s most important controls: compare the purchase order, the goods receipt note
                  and the vendor bill before authorising payment.
                </P>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
                  {[
                    ["Purchase order", "What was ordered?", "100 units"],
                    ["Goods receipt", "What was received?", "95 units"],
                    ["Vendor bill", "What was invoiced?", "100 units"],
                  ].map(([title, q, v]) => (
                    <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">{title}</p>
                      <p className="mt-1 text-[13px] text-lp-muted">{q}</p>
                      <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-lp-ink">{v}</p>
                    </div>
                  ))}
                </div>
                <Warning>
                  Quantity discrepancy detected: five invoiced units have not been received. Hold the bill, or route it
                  for exception approval under your procurement policy.
                </Warning>
                <Caption>Example — vendor bill accounting</Caption>
                <P small>
                  A Canadian business receives a professional services invoice for $10,000 plus 13% HST, with the HST
                  fully recoverable.
                </P>
                <Ledger
                  rows={[
                    ["Professional services expense", "$10,000", "—"],
                    ["HST recoverable", "$1,300", "—"],
                    ["Accounts payable", "—", "$11,300"],
                  ]}
                />
                <AiNote>
                  {AI} can extract the information from supplier invoices, compare the supporting documents, identify
                  duplicate charges, detect quantity or price discrepancies and prepare bills for approval.
                </AiNote>
              </Fn>

              <Fn id="recurring-bills" title="Recurring bills — automated vendor billing">
                <P>
                  Recurring bills generate vendor bill records on a schedule — office rent, internet, insurance,
                  equipment leases, software subscriptions, professional retainers. You configure the vendor, expense
                  categories, amount, frequency, start and end dates, tax treatment and payment terms.
                </P>
                <Caption>Example — monthly office rent</Caption>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {months.map((m) => (
                    <span key={m} className="rounded-lg bg-lp-brand/8 px-2.5 py-1.5 text-[12px] text-lp-body">
                      <b className="font-semibold text-lp-ink">{m}</b> $5,000
                    </span>
                  ))}
                </div>
                <P small>
                  $5,000 a month, a $60,000 annual commitment, generated automatically before applicable taxes. A
                  business with 50 recurring supplier expenses would otherwise key in 600 bills a year.
                </P>
                <Note>
                  Generated bills should be reconciled against the actual supplier invoices where required, and
                  generating one does not authorise payment.
                </Note>
                <AiNote>
                  She can identify recurring expenditure patterns, recommend schedules, detect unexpected increases and
                  highlight expired supplier contracts.
                </AiNote>
              </Fn>

              <Fn id="debit-notes" title="Debit notes — vendor credits & adjustments">
                <P>
                  A debit note records an adjustment in your favour, reducing what you owe a vendor or establishing a
                  credit against future purchases. They arise from returns, overbilling, incorrect prices, quantity
                  discrepancies or agreed commercial adjustments.
                </P>
                <Caption>Example — supplier overbilling</Caption>
                <Figures
                  items={[
                    ["Original vendor bill", "$11,300"],
                    ["Debit note issued", "−$1,130"],
                    ["Revised vendor balance", "$10,170"],
                  ]}
                />
                <P small>Assuming an agreed $1,000 expense reduction plus $130 of recoverable HST:</P>
                <Ledger
                  rows={[
                    ["Accounts payable", "$1,130", "—"],
                    ["Original expense account", "—", "$1,000"],
                    ["HST recoverable", "—", "$130"],
                  ]}
                />
                <Note>
                  The credit may go to inventory or another asset account instead, depending on the original purchase.
                  Keep the supplier credit note or other supporting documentation.
                </Note>
                <AiNote>
                  {AI} can identify unmatched vendor credits, recommend debit note allocations, calculate the tax
                  adjustment and highlight recurring overbilling.
                </AiNote>
              </Fn>

              <PartHeading title="Vendor payments & cash management" />

              <Fn id="payment-runs" title="Payment runs — batch vendor payments">
                <P>
                  A payment run selects multiple outstanding bills and processes them together. Rather than preparing a
                  transfer per invoice, {AI} consolidates the selected bills into one payment per vendor within the
                  currency, bank account and payment method, then generates a bank upload file.
                </P>
                <Flow
                  steps={[
                    ["Select outstanding bills", "Filter by due date, vendor, currency and priority"],
                    ["Validate the details", "Balances, credits, approvals and banking information"],
                    ["Consolidate by vendor", "Group eligible bills into one payment each"],
                    ["Review & authorise", "Confirm the cash is there and obtain the approvals"],
                    ["Export the bank file", "SEPA · NACHA · Bank-compatible CSV"],
                    ["Bank processing", "Upload, authorise and reconcile the results"],
                  ]}
                />
                <Caption>Example — a supplier payment run</Caption>
                <DataTable
                  head={["Vendor", "Bills selected", "Total payment"]}
                  rows={[
                    ["Global Technology", "4", "$25,000"],
                    ["Office Supplies Ltd", "3", "$12,500"],
                    ["Internet Services Ltd", "2", "$4,800"],
                    ["Logistics Solutions", "5", "$18,700"],
                    ["Utilities Company", "2", "$9,000"],
                    [
                      <b key="t" className="font-semibold text-lp-ink">Total</b>,
                      <b key="b" className="font-semibold text-lp-ink">16</b>,
                      <b key="v" className="font-semibold text-lp-ink">$70,000</b>,
                    ],
                  ]}
                />
                <P small>
                  Sixteen separate transfers become five vendor payments, assuming a common currency and compatible
                  arrangements.
                </P>
                <Caption>Supported bank formats</Caption>
                <DataTable
                  head={["Format", "Application"]}
                  rows={[
                    ["SEPA", "Euro credit transfers within the SEPA area, subject to bank requirements"],
                    ["NACHA", "ACH payment files for the United States"],
                    ["CSV", "Bank-specific upload formats for supported jurisdictions"],
                  ]}
                />
                <Note>
                  Each bank has its own file structure, validation rules, security procedures and authorisation process.
                </Note>
                <Warning>
                  Generating or exporting a payment file does not mean the payments have settled. {AI} distinguishes
                  prepared, approved, exported, submitted, confirmed, rejected and reconciled payments.
                </Warning>
                <AiNote>
                  She can recommend who to pay on due dates, available cash, early payment discounts, supplier
                  importance and contractual obligations. High-value payments stay subject to human authorisation.
                </AiNote>
              </Fn>

              <Fn id="ap-payments" title="AP payments — payment records & allocation">
                <P>
                  The accounts payable payments function keeps the record of individual payments and allocates them
                  against outstanding bills, so the vendor ledger, the bank records and the payable balances agree.
                </P>
                <Bullets
                  title="What you can do"
                  items={[
                    "Record individual vendor payments",
                    "Allocate one payment across several bills",
                    "Process partial payments",
                    "Record supplier advances and unallocated payments",
                    "Maintain payment dates, references, methods and currencies",
                    "Review payments generated by a batch run",
                    "Reconcile payments against bank statements",
                  ]}
                />
                <Caption>Example — allocating one payment</Caption>
                <div className="mt-3 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                  <p className="text-[13.5px] text-lp-body">
                    Payment to Global Technology Supplies Ltd{" "}
                    <b className="font-semibold text-lp-ink">$25,000</b>
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {[
                      ["BILL-001", "$10,000"],
                      ["BILL-002", "$5,000"],
                      ["BILL-003", "$7,500"],
                      ["BILL-004", "$2,500"],
                    ].map(([ref, amount]) => (
                      <div key={ref} className="rounded-lg bg-lp-alt px-3 py-2.5">
                        <p className="text-[12px] text-lp-muted">{ref}</p>
                        <p className="text-[14px] font-semibold text-lp-ink">{amount}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 flex items-center gap-2 text-[13px] text-ai-done">
                    <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Four outstanding bills settled
                  </p>
                </div>
                <Caption>Accounting entry</Caption>
                <Ledger
                  rows={[
                    ["Accounts payable", "$25,000", "—"],
                    ["Bank account", "—", "$25,000"],
                  ]}
                />
                <P small>This reduces the supplier balance without recognising the original expense a second time.</P>
                <Caption>Payment runs vs AP payments</Caption>
                <DataTable
                  head={["Payment runs", "AP payments"]}
                  rows={[
                    ["Organises and prepares batch payments", "Maintains individual payment records"],
                    ["Consolidates multiple outstanding bills", "Allocates payments to specific bills"],
                    ["Supports batch approval", "Supports individual payment tracking"],
                    ["Generates bank upload files", "Supports bank reconciliation"],
                    ["Focuses on preparation and execution", "Focuses on accounting and settlement"],
                  ]}
                />
                <AiNote>
                  {AI} can match bank transactions to payments, identify unallocated amounts, detect duplicate transfers
                  and prepare accounts payable reconciliations.
                </AiNote>
              </Fn>
            </div>
          </div>
        </Container>
      </section>

      {/* part F — the chain */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>How the 13 work together</Kicker>
          <H2>One procurement lifecycle.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Take a technology company buying equipment for its operations.
          </p>
          <ol className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {chain.map(([title, text]) => (
              <li key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{text}</p>
              </li>
            ))}
          </ol>
          <Note>
            Blanket agreements may come before individual orders. Returns, quotations, recurring bills and debit notes
            are conditional steps, not mandatory ones.
          </Note>
        </Container>
      </section>

      {/* part G — the dashboard */}
      <section>
        <Container className="py-16">
          <Kicker>The purchasing dashboard</Kicker>
          <H2>Expenditure, commitments and what is due.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            An immediate overview of spending, procurement commitments, vendor obligations, payment requirements and
            purchasing efficiency.
          </p>
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
                Monthly purchases vs vendor payments
              </p>
              <PurchasesChart />
            </div>
            <div className="rounded-xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">
                Expenditure by category
              </p>
              <CategoryChart />
            </div>
          </div>
          <div className="mt-2.5 max-w-3xl rounded-xl border border-lp-line bg-lp-card px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Accounts payable ageing</p>
            <ul className="mt-3 space-y-2.5">
              {ageing.map(([label, value, width]) => (
                <li key={label}>
                  <div className="flex items-baseline justify-between text-[13.5px]">
                    <span className="text-lp-body">{label}</span>
                    <span className="font-semibold text-lp-ink">{value}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lp-alt">
                    <div
                      className={cn("h-full rounded-full", width === 100 ? "bg-lp-brand" : "bg-needs-human")}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <Note>Illustrative management dashboard for November 2026 — not live {AI} data.</Note>
        </Container>
      </section>

      {/* part H — the agentic assistant */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>The agentic AI purchasing assistant</Kicker>
          <H2>
            You ask. She understands. <Serif className="text-[32px] sm:text-[40px]">She delivers.</Serif>
          </H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Procurement officers, accountants and owners can start and follow purchasing work in plain language, instead
            of walking through screens and hundreds of documents.
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

          <Caption>Example — an agentic procurement workflow</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Finance manager</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  {AI}, review all outstanding supplier invoices, check them against purchase orders and goods receipts,
                  apply available vendor credits, and prepare a payment run for Friday without exceeding $100,000.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                I&rsquo;ve reviewed the outstanding supplier accounts and prepared your proposed payment run.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "Reviewed 145 outstanding supplier invoices",
                  "Validated 138 against the supporting purchasing records",
                  "Identified $8,500 in available supplier credits",
                  "Prioritised invoices approaching their deadlines",
                  "Prepared 72 eligible invoices, consolidated into 28 vendor payments",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {[
                  ["Spending limit", "$100,000"],
                  ["Proposed run", "$94,250"],
                  ["Remaining", "$5,750"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-lp-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{k}</p>
                    <p className="text-[15px] font-semibold text-lp-ink">{v}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Seven invoices have discrepancies and are excluded pending your review. Your payment run is ready for
                approval — <b className="font-semibold text-lp-ink">no funds have been transferred.</b>
              </p>
            </div>
          </div>
          <Note>
            Illustrative interaction. What she can actually execute depends on configured permissions, verified records
            and available integrations.
          </Note>
        </Container>
      </section>

      {/* part I — controls */}
      <section>
        <Container className="py-16">
          <Kicker>Procurement controls & governance</Kicker>
          <H2>Where weak controls cost money.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Purchasing is one of the areas where weak internal controls lead to losses, unauthorised expenditure, fraud
            and inefficiency. The module is built around a control framework.
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div>
              <DataTable head={["Internal control", "Purpose"]} rows={controls.map(([c, p]) => [c, p])} />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Segregation of duties</p>
              <ul className="mt-3 space-y-2">
                {duties.map(([role, work]) => (
                  <li key={role} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{role}</p>
                    <p className="mt-0.5 text-[13px] text-lp-muted">{work}</p>
                  </li>
                ))}
              </ul>
              <Note>
                Assign these to different people, with compensating controls where staffing prevents full separation.
                It matters most for multinationals, government-funded projects, NGOs and businesses under strict donor
                or corporate procurement policies.
              </Note>
            </div>
          </div>
        </Container>
      </section>

      {/* part J — integration + philosophy */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Integration with the other modules</Kicker>
          <H2>Purchasing does not work alone.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {integrations.map(([mod, benefit]) => (
              <div key={mod} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{mod}</p>
                <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{benefit}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-3xl text-center">
            <Kicker>The {AI} purchasing philosophy</Kicker>
            <p className="mt-5 text-[19px] leading-[1.5] text-lp-ink">
              Purchasing is not simply buying goods and paying suppliers. It is making sure every pound spent creates
              value. A business can negotiate excellent prices and still lose money through inefficient processes,
              excess inventory, duplicate payments and weak expenditure control.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.65] text-lp-body">
              The agentic assistant handles the repetitive work, finds the exceptions and prepares recommendations.
              Management keeps authority over the commercial decisions and the financial commitments.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — Smarter purchasing. Stronger financial controls.{" "}
              <span className="text-lp-brand">Greater business efficiency.</span>
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

/** Purchases against payments, month by month — the dashboard's bar chart. */
function PurchasesChart() {
  const months = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const purchases = [160, 187, 200, 225, 248, 280]; // $000
  const payments = [145, 160, 182, 200, 235, 258];
  const max = 300;
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
          ["Purchases", CHART.blue],
          ["Payments", CHART.green],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 550 230" className="mt-2 w-full" role="img" aria-label="Monthly purchases against vendor payments, June to November">
        {[0, 75, 150, 225, 300].map((v) => (
          <g key={v}>
            <line x1={left} x2="540" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              ${v}K
            </text>
          </g>
        ))}
        {months.map((m, i) => {
          const x = left + i * band + (band - bar * 2 - 6) / 2;
          return (
            <g key={m}>
              <rect x={x} y={y(purchases[i])} width={bar} height={base - y(purchases[i])} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 6} y={y(payments[i])} width={bar} height={base - y(payments[i])} rx="3" fill={CHART.green} />
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

/** Where the month's spend went — the dashboard's doughnut. */
function CategoryChart() {
  const slices: [string, number, string][] = [
    ["Equipment", 45, CHART.blue],
    ["Inventory", 22, CHART.green],
    ["Other expenses", 13, CHART.orange],
    ["Professional services", 12, CHART.amber],
    ["Utilities", 8, CHART.purple],
  ];
  const r = 56;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-5">
      <svg viewBox="0 0 150 150" className="h-36 w-36 shrink-0 -rotate-90" role="img" aria-label="Purchasing expenditure by category">
        {slices.map(([label, pct, colour]) => {
          const dash = (pct / 100) * circumference;
          const el = (
            <circle
              key={label}
              cx="75"
              cy="75"
              r={r}
              fill="none"
              stroke={colour}
              strokeWidth="26"
              strokeDasharray={`${dash - 2} ${circumference - dash + 2}`}
              strokeDashoffset={-offset}
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      <ul className="min-w-0 flex-1 space-y-1.5 text-[12.5px]">
        {slices.map(([label, pct, colour]) => (
          <li key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} />
            <span className="min-w-0 flex-1 truncate text-lp-body">{label}</span>
            <span className="font-semibold tabular-nums text-lp-ink">{pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** A control the guide wants you to notice. */
function Warning({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 flex max-w-3xl gap-2.5 rounded-xl border border-needs-human/30 bg-needs-human/8 px-4 py-3 text-[13.5px] leading-[1.6] text-lp-body">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-needs-human" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}
