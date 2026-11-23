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
  title: `Operations module`, // the root layout appends "· Tax GO"
  description: `The ${AI} point of sale, retail and service operations module in full: 19 functions across registers, restaurants, van sales, field service, repairs, appointments and the helpdesk — with worked examples for each.`,
};

type Photo = [src: string, alt: string];

/** Register, through to close of shift. */
const registerFlow: [string, string][] = [
  ["Open the shift", "Identify the cashier and record the opening float"],
  ["Scan or select products", "Prices, taxes and promotions retrieved"],
  ["Process the sale", "Quantities, discounts and payment method"],
  ["Issue the receipt", "Record it and update the stock balances"],
  ["Close the shift", "Count the cash and reconcile against the records"],
];

const registerPhotos: Photo[] = [
  ["/operations/register-1.jpg", "A cashier serving a customer at a point-of-sale terminal"],
  ["/operations/register-2.jpg", "A restaurant point-of-sale screen on the counter"],
  ["/operations/register-3.jpg", "A shop assistant completing a card payment"],
];

const floorPhotos: Photo[] = [
  ["/operations/floor-1.jpg", "Tables laid out across a restaurant dining room"],
  ["/operations/floor-2.jpg", "A waiter taking an order on a tablet at a table"],
  ["/operations/floor-3.jpg", "A restaurant dining area seen from the entrance"],
];

const kitchenPhotos: Photo[] = [
  ["/operations/kitchen-1.jpg", "A kitchen display screen showing incoming orders"],
  ["/operations/kitchen-2.jpg", "Kitchen staff working against an order screen"],
  ["/operations/kitchen-3.jpg", "An order queue on a kitchen display system"],
];

/** The live kitchen queue. */
const kitchenQueue: { ticket: string; age: string; state: "new" | "preparing" | "ready"; table: string; items: string[] }[] = [
  { ticket: "#1041", age: "2 min", state: "new", table: "Table 2", items: ["2 × Grilled chicken", "1 × French fries", "2 × Orange juice"] },
  { ticket: "#1042", age: "8 min", state: "preparing", table: "Table 7", items: ["1 × Beef burger", "2 × Chicken wings", "1 × Caesar salad"] },
  { ticket: "#1043", age: "12 min", state: "preparing", table: "Takeaway", items: ["2 × Pepperoni pizza", "1 × Garlic bread"] },
  { ticket: "#1040", age: "15 min", state: "ready", table: "Table 3", items: ["2 × Pasta", "1 × Garden salad"] },
];

/** The restaurant floor, table by table. */
const tables: [string, "Available" | "Occupied" | "Reserved" | "Awaiting payment", string][] = [
  ["Table 1", "Available", "4 seats"],
  ["Table 2", "Occupied", "4 seats"],
  ["Table 3", "Occupied", "2 seats"],
  ["Table 4", "Reserved", "6 seats"],
  ["Table 5", "Available", "2 seats"],
  ["Table 6", "Awaiting payment", "4 seats"],
  ["Table 7", "Occupied", "4 seats"],
  ["Table 8", "Available", "4 seats"],
  ["Table 9", "Reserved", "6 seats"],
];

/** The three terminals in the example estate. */
const terminals: { name: string; kind: string; src: string; alt: string }[] = [
  { name: "Terminal 01", kind: "Supermarket", src: "/operations/terminal-supermarket.jpg", alt: "A supermarket checkout terminal" },
  { name: "Terminal 02", kind: "Restaurant", src: "/operations/terminal-restaurant.jpg", alt: "A restaurant point-of-sale terminal" },
  { name: "Terminal 03", kind: "Retail store", src: "/operations/terminal-retail.jpg", alt: "A handheld retail terminal" },
];

/** The 19 terminal settings. */
const terminalSettings: [string, string][] = [
  ["Add new terminals", "Create tills, assign branches, configure users and settings"],
  ["Price lists", "Retail $100 · Wholesale $80 · Promotional $90"],
  ["Promotions", "Buy two products and receive a third free"],
  ["Gift cards", "Issue, redeem and track the outstanding balance"],
  ["Loyalty programmes", "One point per dollar, 500 points for a $5 reward"],
  ["Modifiers", "Extra cheese, no onions, and what each one costs"],
  ["Age-restricted products", "Prompt the cashier to verify eligibility"],
  ["Deposits", "Collect a refundable container deposit"],
  ["Weighed products", "1.5 kilograms of apples at $4 per kilogram"],
  ["Serial tracking", "Capture the serial number of a laptop at the till"],
  ["Labels", "Print barcode labels and shelf prices"],
  ["Profiles", "Separate profiles for a restaurant, pharmacy and supermarket"],
  ["Quick keys", "One-touch buttons for coffee, sandwiches, popular meals"],
  ["Supervisor PIN", "Approval for a large discount or a restricted refund"],
  ["Audit log", "Who processed the refund, and who authorised it"],
  ["Reports", "Daily sales and collections from a single terminal"],
  ["Receipt settings", "Logo, tax number and the returns policy"],
  ["Customer display", "Customers see prices and discounts as items are scanned"],
  ["Returns without receipt", "A controlled process, under the business return policy"],
];

/** What goes on a burger. */
const modifiers: [string, string][] = [
  ["Extra cheese", "+$1.50"],
  ["Extra beef patty", "+$4.00"],
  ["Bacon", "+$2.00"],
  ["No onions", "+$0.00"],
  ["Gluten-free bun", "+$2.50"],
];

const vanPhotos: Photo[] = [
  ["/operations/van-1.jpg", "A delivery van being loaded with stock"],
  ["/operations/van-2.jpg", "A delivery driver with a tablet beside a van"],
  ["/operations/van-3.jpg", "A distribution fleet parked at a depot"],
];

/** The van sales day. */
const vanDay: [string, string][] = [
  ["Main warehouse", "Prepare the products for mobile distribution"],
  ["Load van inventory", "Transfer the stock to the mobile location"],
  ["Visit customers", "Follow the assigned route"],
  ["Process sales", "Sell the products and record the collections"],
  ["Return to warehouse", "Bring back unsold stock"],
  ["Reconcile the day", "Products, revenue and collections"],
];

/** A day on the road. */
const route: [string, string][] = [
  ["08:00 — Warehouse departure", "Load the mobile inventory"],
  ["09:00 — Customer A", "Product sales and collection"],
  ["10:00 — Customer B", "Wholesale distribution"],
  ["11:00 — Field service appointment", "Equipment installation"],
  ["13:00 — Customer C", "Product replenishment"],
  ["14:30 — Customer D", "Customer sales visit"],
  ["16:00 — Return to warehouse", "Reconcile inventory and collections"],
];

const fieldPhotos: Photo[] = [
  ["/operations/field-1.jpg", "A technician installing cabling at a customer site"],
  ["/operations/field-2.jpg", "An engineer servicing equipment on site"],
  ["/operations/field-3.jpg", "A dispatcher scheduling field service jobs"],
];

/** The field service job, start to finish. */
const fieldFlow: [string, string][] = [
  ["Customer requests service", "The job is created and categorised"],
  ["Assign a technician", "And attach the job to a van route"],
  ["Technician attends", "Record the work, the parts and the labour"],
  ["Complete and invoice", "Generate the customer invoice"],
];

const repairPhotos: Photo[] = [
  ["/operations/repair-1.jpg", "A computer repair workshop bench"],
  ["/operations/repair-2.jpg", "A technician repairing a mobile phone"],
  ["/operations/repair-3.jpg", "A service counter taking in a customer device"],
];

/** The repair pipeline. */
const repairStages: [string, string][] = [
  ["Device received", "Record the customer, the device and the reported fault"],
  ["Diagnosis", "Inspect it and identify the repairs needed"],
  ["Quotation", "Estimate the parts and the labour"],
  ["Customer approval", "Authorisation before any chargeable work"],
  ["Repair in progress", "Record the parts consumed and the labour"],
  ["Quality testing", "Verify the repair"],
  ["Ready for collection", "Prepare the invoice and notify the customer"],
  ["Collected & closed", "Take payment and close the order"],
];

const apptPhotos: Photo[] = [
  ["/operations/appt-1.jpg", "A salon reception taking a booking"],
  ["/operations/appt-2.jpg", "A beauty treatment in progress"],
  ["/operations/appt-3.jpg", "A consultant meeting a client by appointment"],
];

/** The helpdesk queue. */
const tickets: [string, string, string, "Critical" | "High" | "Medium" | "Low"][] = [
  ["HD-1001", "Internet connection unavailable", "Network Engineering", "Critical"],
  ["HD-1002", "Incorrect customer invoice", "Finance Department", "High"],
  ["HD-1003", "POS terminal configuration issue", "Technical Support", "Medium"],
  ["HD-1004", "Request for product information", "Customer Services", "Low"],
];

/** The knowledge base. */
const articles: [string, string, string][] = [
  ["Month-end closing procedure", "Finance", "245"],
  ["Opening and closing a POS shift", "Retail", "382"],
  ["Fibre internet installation procedure", "Engineering", "196"],
  ["Handling customer complaints", "Customer Support", "165"],
  ["Employee onboarding procedure", "Human Resources", "120"],
  ["Stock reconciliation and adjustments", "Inventory", "211"],
  ["Daily van sales reconciliation", "Logistics", "145"],
];

/** What is coming up. */
const diary: [string, string, string][] = [
  ["23 Nov", "Weekly sales performance meeting", "09:00 · Sales"],
  ["24 Nov", "Customer equipment installation", "10:30 · Field Service"],
  ["26 Nov", "Warehouse stock reconciliation", "14:00 · Inventory"],
  ["30 Nov", "Month-end financial close", "Finance"],
  ["30 Nov", "Monthly branch performance report", "Retail Operations"],
];

/** Operations to the ledger. */
const matrix: [string, string, string][] = [
  ["Cash POS sale", "Cash", "Sales revenue and applicable tax"],
  ["Card sale", "Card clearing account", "Sales revenue and applicable tax"],
  ["Card settlement", "Bank and applicable fees", "Card clearing account"],
  ["Inventory sold", "Cost of goods sold", "Inventory"],
  ["Gift card issuance", "Cash or bank", "Gift card liability"],
  ["Gift card redemption", "Gift card liability", "Revenue and applicable tax"],
  ["Customer advance deposit", "Cash or bank", "Customer deposit liability"],
  ["Approved petty cash expense", "Expense", "Cash"],
  ["Approved inventory scrap", "Inventory loss", "Inventory"],
  ["Van stock loading", "Inventory — van", "Inventory — warehouse"],
  ["Van customer credit sale", "Accounts receivable", "Revenue and applicable tax"],
  ["Repair service invoice", "Accounts receivable", "Service revenue and applicable tax"],
  ["Repair parts consumed", "Cost of sales or work in progress", "Inventory"],
  ["Customer service invoice", "Accounts receivable", "Service revenue and applicable tax"],
  ["Customer payment", "Cash or bank", "Accounts receivable"],
];

/** The executive dashboard. */
const kpis: [string, string, string][] = [
  ["Average basket value", "$34.78", "Retail sales"],
  ["Gross profit margin", "35.0%", "Commercial profitability"],
  ["Table turnover", "4.2×", "Restaurant efficiency"],
  ["Average preparation time", "12 min", "Kitchen performance"],
  ["Route completion", "94%", "Van distribution"],
  ["First-time fix rate", "89%", "Field service"],
  ["Repair turnaround", "2.4 days", "Workshop operations"],
  ["Staff utilisation", "82%", "Service appointments"],
  ["SLA compliance", "96%", "Customer support"],
  ["Customer satisfaction", "92%", "Service quality"],
  ["Cash discrepancy rate", "0.12%", "Register controls"],
  ["Knowledge base articles", "245", "Organisational knowledge"],
];

const kpiDefinitions: [string, string][] = [
  ["Average basket value", "Retail sales divided by completed transactions"],
  ["Sales per employee", "Sales revenue attributable to each employee"],
  ["Table turnover", "Dining parties served per table in a period"],
  ["Kitchen preparation time", "Average time from order receipt to readiness"],
  ["Sales per vehicle", "Revenue generated by each mobile sales vehicle"],
  ["Route profitability", "Route revenue less attributable operating costs"],
  ["Route completion rate", "Completed stops divided by planned stops"],
  ["First-time fix rate", "Service jobs resolved on the first visit"],
  ["Repair turnaround", "Average time from intake to repair completion"],
  ["Staff utilisation", "Productive hours against available hours"],
  ["SLA compliance", "Tickets meeting their agreed service targets"],
  ["Cash discrepancy rate", "Reconciliation differences against cash takings"],
];

/** What you can ask her. */
const asks: [string, string][] = [
  ["Reconcile today's register sales.", "Compare recorded sales and payment collections"],
  ["Which restaurant tables are taking too long?", "Analyse table activity and service duration"],
  ["Why are kitchen orders being delayed?", "Analyse preparation times and order queues"],
  ["Review all terminal configurations.", "Identify configuration inconsistencies"],
  ["Which cashiers have recurring shortages?", "Analyse historical shift reconciliations"],
  ["Show unusual refunds this week.", "Identify transactions needing review"],
  ["Review all pending POS approvals.", "Summarise the requests and their risks"],
  ["Which branch is most profitable?", "Compare sales against the available cost information"],
  ["Summarise today's van sales.", "Analyse mobile sales and collections"],
  ["Which vans are underutilised?", "Assess vehicle activity and performance"],
  ["Review tomorrow's distribution routes.", "Prepare route and visit recommendations"],
  ["Reconcile stock carried by the vans.", "Compare loaded, sold and returned stock"],
  ["Assign pending installation jobs.", "Recommend technicians and route assignments"],
  ["Which repair jobs are overdue?", "Analyse outstanding repair orders"],
  ["Find available appointment times.", "Review recorded employee availability"],
  ["Organise our customer complaints.", "Categorise and prioritise support tickets"],
  ["Show tickets about to breach their SLA.", "Identify approaching service deadlines"],
  ["Explain our refund policy to new staff.", "Retrieve the authorised knowledge base procedure"],
  ["Prepare my activities for tomorrow.", "Summarise meetings, deadlines and tasks"],
];

/** One platform, many trades. */
const industries: { title: string; text: string; src: string; alt: string }[] = [
  {
    title: "Retail & supermarkets",
    text: "Registers, scanning, promotions, loyalty, shifts, stock controls and branch reporting.",
    src: "/operations/industry-retail.jpg",
    alt: "A supermarket aisle with shoppers",
  },
  {
    title: "Restaurants & hospitality",
    text: "Floor plans, kitchen displays, modifiers, orders, payments and service performance.",
    src: "/operations/industry-restaurant.jpg",
    alt: "Tables set in a bistro dining room",
  },
  {
    title: "Wholesale & distribution",
    text: "Mobile inventory, van sales, fleet, routes, collections and daily reconciliation.",
    src: "/operations/industry-distribution.jpg",
    alt: "Crates of drinks ready for distribution",
  },
  {
    title: "Telecoms & technical services",
    text: "Field installations, technicians, support tickets, service commitments and know-how.",
    src: "/operations/industry-telecom.jpg",
    alt: "An engineer working on fibre network cabling",
  },
  {
    title: "Repair & maintenance",
    text: "Intake, diagnosis, quotations, spare parts, labour, billing and repair profitability.",
    src: "/operations/industry-repair.jpg",
    alt: "A phone repair workbench with tools",
  },
  {
    title: "Salons, spas & professional services",
    text: "Appointments, staff utilisation, check-ins, loyalty and service billing.",
    src: "/operations/industry-salon.jpg",
    alt: "A salon reception area",
  },
  {
    title: "Customer support organisations",
    text: "Tickets, SLA monitoring, knowledge management, coordination and analytics.",
    src: "/operations/industry-support.jpg",
    alt: "A support team working at their desks",
  },
];

const controls: [string, string][] = [
  ["Individual cashier identification", "Establish responsibility for transactions"],
  ["Opening and closing shifts", "Control daily register activity"],
  ["Supervisor PIN", "Restrict sensitive transactions"],
  ["POS approval queue", "Authorise stock corrections, scrap and petty cash"],
  ["Refund controls", "Reduce unauthorised customer refunds"],
  ["Cash reconciliation", "Identify shortages and overages"],
  ["Age verification", "Support compliance with sales restrictions"],
  ["Serial number tracking", "Maintain individual product traceability"],
  ["Van stock reconciliation", "Prevent unexplained mobile inventory losses"],
  ["Technician job assignment", "Establish service accountability"],
  ["Repair authorisation", "Customer approval before chargeable repairs"],
  ["SLA monitoring", "Identify service commitment breaches"],
  ["Knowledge base permissions", "Protect confidential information"],
  ["Audit logs", "Maintain evidence of operational activity"],
  ["Role-based access", "Restrict employees and AI agents to what they may do"],
  ["Human approval", "Keep management control over significant decisions"],
];

export default function OperationsPage() {
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
              Sell anywhere. <Serif className="text-[32px] sm:text-[40px]">Serve everywhere.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              The operations module runs the daily commercial work of shops, restaurants, supermarkets, mobile
              distribution, repair centres, professional services and support desks. Unlike a till that only takes
              money, it ties the front line to inventory, accounting, customer records, the fleet and service jobs.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              Selling from a supermarket, serving a table, distributing from a van, repairing a device or answering a
              support request — one operating environment behind all of it.
            </p>
          </div>
        </Container>
      </section>

      {/* the 19 functions */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Point of sale & restaurant management" />

            <Fn id="register" title="Register — the till, and the shift around it">
              <P>
                The transaction interface where cashiers sell, scan, discount, take payment, issue receipts and open or
                close a shift — for supermarkets, restaurants, pharmacies, fashion, electronics and wholesalers.
              </P>
              <Photos photos={registerPhotos} />
              <Caption>Example — a sale at Register 01</Caption>
              <div className="mt-3 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                <p className="text-[13px] text-lp-muted">Ottawa branch · Cashier 001 · shift open</p>
                <ul className="mt-3 space-y-1.5 text-[13.5px]">
                  {[
                    ["Wireless mouse", "2 × $25.00", "$50.00"],
                    ["USB keyboard", "1 × $45.00", "$45.00"],
                    ["USB-C cable", "3 × $15.00", "$45.00"],
                  ].map(([item, qty, total]) => (
                    <li key={item} className="flex items-baseline justify-between gap-4 border-b border-lp-line pb-1.5">
                      <span className="text-lp-ink">{item}</span>
                      <span className="text-lp-muted">{qty}</span>
                      <span className="font-medium text-lp-ink">{total}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 ml-auto max-w-xs space-y-1.5 text-[13.5px]">
                  <div className="flex justify-between gap-6">
                    <dt className="text-lp-muted">Subtotal</dt>
                    <dd className="text-lp-body">$140.00</dd>
                  </div>
                  <div className="flex justify-between gap-6">
                    <dt className="text-lp-muted">Sales tax</dt>
                    <dd className="text-lp-body">$18.20</dd>
                  </div>
                  <div className="flex justify-between gap-6 border-t border-lp-line pt-1.5">
                    <dt className="font-semibold text-lp-ink">Total payable</dt>
                    <dd className="font-semibold text-lp-ink">$158.20</dd>
                  </div>
                </dl>
              </div>
              <Caption>The shift, in five moves</Caption>
              <Flow steps={registerFlow} />
              <Caption>Accounting integration</Caption>
              <P small>For that $140 sale plus 13% HST, with goods costing $85:</P>
              <Ledger
                rows={[
                  ["Cash", "$158.20", "—"],
                  ["Sales revenue", "—", "$140.00"],
                  ["HST payable", "—", "$18.20"],
                  ["Cost of goods sold", "$85.00", "—"],
                  ["Inventory", "—", "$85.00"],
                ]}
              />
              <AiNote>
                {AI} can analyse cashier performance, spot unusual discounts, highlight suspicious refunds, investigate
                discrepancies and prepare the daily reconciliation.
              </AiNote>
            </Fn>

            <Fn id="floor-plan" title="Floor plan — the room at a glance">
              <P>
                A visual of the tables, seating and sections, so staff can see what is free, what is occupied, which
                orders are outstanding and which tables are waiting to pay.
              </P>
              <Photos photos={floorPhotos} />
              <Caption>Example — main dining area</Caption>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {tables.map(([name, state, seats]) => (
                  <div
                    key={name}
                    className={cn(
                      "rounded-xl border px-4 py-3",
                      state === "Available" && "border-ai-done/30 bg-ai-done/8",
                      state === "Occupied" && "border-lp-line bg-lp-card",
                      state === "Reserved" && "border-needs-human/30 bg-needs-human/8",
                      state === "Awaiting payment" && "border-lp-brand/40 bg-lp-brand/8",
                    )}
                  >
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{name}</p>
                    <p className="mt-0.5 text-[12.5px] text-lp-body">{state}</p>
                    <p className="text-[12px] text-lp-muted">{seats}</p>
                  </div>
                ))}
              </div>
              <Note>
                Day to day this means seating customers, raising orders against a table, adding items, transferring
                tables, splitting bills and taking final payment.
              </Note>
              <AiNote>
                She can analyse table turnover, identify the peak periods, recommend staffing and flag tables whose
                service is taking unusually long.
              </AiNote>
            </Fn>

            <Fn id="kitchen" title="Kitchen display — orders straight to the pass">
              <P>
                Orders flow from the point of sale to a kitchen screen instead of handwritten dockets or printed
                tickets, and the kitchen marks them through preparation to ready.
              </P>
              <Photos photos={kitchenPhotos} />
              <Caption>Example — the lunch queue</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {kitchenQueue.map((order) => (
                  <div
                    key={order.ticket}
                    className={cn(
                      "rounded-xl border px-4 py-3",
                      order.state === "new" && "border-lp-line bg-lp-card",
                      order.state === "preparing" && "border-needs-human/30 bg-needs-human/8",
                      order.state === "ready" && "border-ai-done/30 bg-ai-done/8",
                    )}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="text-[13.5px] font-semibold text-lp-ink">{order.ticket}</span>
                      <span className="text-[12px] text-lp-muted">{order.age}</span>
                    </div>
                    <p className="mt-0.5 text-[12px] uppercase tracking-[0.12em] text-lp-muted">
                      {order.state === "new" ? "New order" : order.state === "preparing" ? "Preparing" : "Ready"} ·{" "}
                      {order.table}
                    </p>
                    <ul className="mt-2 space-y-0.5 text-[12.5px] text-lp-body">
                      {order.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Flow
                steps={[
                  ["Waiter enters the order", "Straight from the point of sale"],
                  ["Kitchen prepares it", "The queue shows what is next and how long it has waited"],
                  ["Ready, served, settled", "The bill follows the table"],
                ]}
              />
              <AiNote>
                {AI} can analyse preparation times, identify kitchen bottlenecks, forecast peak demand and recommend
                improvements.
              </AiNote>
            </Fn>

            <Fn id="terminals" title="POS terminals — configuring the estate">
              <P>
                The admin side: creating and configuring terminals across stores, branches and restaurants, each set up
                for what its location actually does.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {terminals.map((t) => (
                  <figure key={t.name} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image src={t.src} alt={t.alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{t.name}</p>
                      <p className="mt-0.5 text-[13px] text-lp-muted">{t.kind}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Caption>What a terminal can be configured to do</Caption>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {terminalSettings.map(([title, text]) => (
                  <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-[1.5] text-lp-muted">{text}</p>
                  </div>
                ))}
              </div>
              <Caption>Example — restaurant modifiers</Caption>
              <div className="mt-3 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 sm:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt sm:w-48">
                  <Image
                    src="/operations/burger.jpg"
                    alt="A beef burger photographed for a menu"
                    fill
                    sizes="(min-width: 640px) 192px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">
                    Classic beef burger — base price $12.00
                  </p>
                  <ul className="mt-3 space-y-1 text-[13.5px]">
                    {modifiers.map(([name, price]) => (
                      <li key={name} className="flex justify-between gap-4 border-b border-lp-line pb-1 last:border-b-0">
                        <span className="text-lp-body">{name}</span>
                        <span className="text-lp-muted">{price}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-[13.5px]">
                    <b className="font-semibold text-lp-ink">Customised price $13.50</b> — with extra cheese, no onions.
                  </p>
                </div>
              </div>
              <Caption>Gift card accounting</Caption>
              <P small>A $100 gift card is a liability, not revenue, until it is spent.</P>
              <DataTable
                head={["Transaction", "Debit", "Credit"]}
                rows={[
                  ["Gift card issuance", "Cash $100", "Gift card liability $100"],
                  ["Redemption of $60, excluding tax", "Gift card liability $60", "Sales revenue $60"],
                ]}
              />
              <Note>
                The remaining liability is $40. The tax treatment depends on local legislation and the kind of card.
              </Note>
              <AiNote>
                She can analyse promotion effectiveness, loyalty performance, discount patterns, refund activity and
                terminal profitability.
              </AiNote>
            </Fn>

            <PartHeading title="POS controls, sales & reporting" />

            <Fn id="shifts" title="Shifts — reconciling the drawer">
              <P>
                Every shift is a controlled window between opening and closing a register: the cashier, the terminal,
                the times, the float, sales, refunds, cash movements, expected cash, actual cash and the difference.
              </P>
              <Caption>Example — shift closing report, Register 01</Caption>
              <Figures
                items={[
                  ["Expected register cash", "$2,450.00"],
                  ["Cash counted", "$2,430.00"],
                  ["Cash variance", "−$20.00"],
                ]}
              />
              <Warning>A cash shortage of $20 requires review before the shift is signed off.</Warning>
              <AiNote>
                {AI} can identify recurring shortages, compare cashiers, highlight unusual cash movements and prepare
                the reconciliation summaries.
              </AiNote>
            </Fn>

            <Fn id="pos-sales" title="POS sales — every transaction, kept">
              <P>
                The central record of what went through the terminals: the sale, the customer, the payment method, the
                value, discounts, taxes, returns and the receipt.
              </P>
              <DataTable
                head={["Transaction", "Terminal", "Payment", "Total", "Status"]}
                rows={[
                  ["POS-10001", "Till 01", "Cash", "$125.00", <Status key="1" kind="ok">Completed</Status>],
                  ["POS-10002", "Till 02", "Card", "$350.00", <Status key="2" kind="ok">Completed</Status>],
                  ["POS-10003", "Till 01", "Gift card", "$75.00", <Status key="3" kind="ok">Completed</Status>],
                  ["POS-10004", "Till 03", "Card", "$240.00", <Status key="4" kind="ok">Completed</Status>],
                  ["POS-10005", "Till 02", "Cash", "$50.00", <Status key="5" kind="no">Refunded</Status>],
                ]}
              />
              <P small>One completed sale touches six places at once:</P>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["Sales revenue", "Income recognition"],
                  ["Inventory", "Stock quantity reduced"],
                  ["Tax liability", "Applicable sales taxes"],
                  ["Payment records", "Cash or settlement"],
                  ["Customer history", "Purchase information"],
                  ["General ledger", "The accounting entries"],
                ].map(([title, text]) => (
                  <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                    <p className="mt-0.5 text-[12.5px] text-lp-muted">{text}</p>
                  </div>
                ))}
              </div>
              <AiNote>
                She can identify trends, investigate abnormal transactions, analyse gross profit and compare
                performance across products, employees and locations.
              </AiNote>
            </Fn>

            <Fn id="pos-approvals" title="POS approvals — what a cashier may not decide alone">
              <P>
                Activities raised at a till that need authorisation — stock corrections, scrap, petty cash — queue for
                a supervisor instead of changing the records unchecked.
              </P>
              <div className="mt-4 space-y-2.5">
                {[
                  ["Stock correction", "Till 01 · Cashier 004", "+15 units", "Physical count difference"],
                  ["Inventory scrap", "Till 03 · Cashier 007", "$240.00", "Damaged products"],
                  ["Petty cash request", "Till 02 · Cashier 002", "$85.00", "Emergency cleaning supplies"],
                ].map(([kind, who, amount, reason]) => (
                  <div
                    key={kind}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-needs-human/30 bg-needs-human/6 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{kind}</p>
                      <p className="mt-0.5 text-[12.5px] text-lp-muted">
                        {who} · {reason}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[15px] font-semibold text-lp-ink">{amount}</span>
                      <Status kind="wait">Awaiting decision</Status>
                    </div>
                  </div>
                ))}
              </div>
              <Note>
                This is what gives segregation of duties, financial control, stock accountability and transparency
                their teeth at the front line.
              </Note>
              <AiNote>
                {AI} can analyse requests against historical patterns, highlight suspicious activity and recommend what
                to investigate. The decision stays with an authorised user.
              </AiNote>
            </Fn>

            <Fn id="branch-report" title="POS & branch report — where the money is made">
              <P>
                Performance consolidated across terminals, cashiers, products, branches, payment methods and trading
                hours, so you can see the profitable locations, the fast movers and the inefficiencies.
              </P>
              <Caption>Illustrative monthly performance</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Total takings", "$433,000"],
                  ["Transactions", "12,450"],
                  ["Average basket", "$34.78"],
                  ["Active branches", "4"],
                  ["Gross profit", "$151,550"],
                  ["Gross margin", "35%"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <DataTable
                head={["Report", "What it tells management"]}
                rows={[
                  ["Takings report", "Money collected through the terminals"],
                  ["Fast movers", "Products with high sales volumes"],
                  ["Slow movers", "Products with low customer demand"],
                  ["Staff performance", "Cashier and sales associate activity"],
                  ["Branch report", "How the locations compare"],
                  ["Tender report", "Collections by payment method"],
                  ["Hourly report", "Peak and quiet trading periods"],
                  ["Terminal report", "How each register performs"],
                ]}
              />
              <AiNote>
                She can prepare daily branch summaries, recommend staffing, suggest stock redistribution and point out
                where product profitability could improve.
              </AiNote>
            </Fn>

            <PartHeading title="Van sales & mobile distribution" />

            <Fn id="van-dashboard" title="Van sales dashboard — the road, today">
              <P>
                An overview of mobile operations: the vehicles, routes, customer visits, stock on board, sales and
                collections — a sales location at every customer, without a shop at every customer.
              </P>
              <Photos photos={vanPhotos} />
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Active vans", "18 / 20"],
                  ["Active routes", "12"],
                  ["Customer visits", "245 / 300"],
                  ["Today's sales", "$48,750"],
                  ["Collections", "$42,500"],
                  ["Stock carried", "$125,000"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <P small>Customer visit completion: 81.7%.</P>
              <AiNote>
                {AI} can analyse route profitability, identify underperforming vans, forecast mobile stock needs and
                recommend better coverage.
              </AiNote>
            </Fn>

            <Fn id="van" title="Van — the fleet as mobile branches">
              <P>
                Each vehicle is managed as a mobile sales location, with its driver, its stock and its route.
              </P>
              <div className="mt-4 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 lg:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt lg:w-56">
                  <Image
                    src="/operations/van-fleet.jpg"
                    alt="A white panel van used for mobile distribution"
                    fill
                    sizes="(min-width: 1024px) 224px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">VAN-001 · Ford Transit</span>
                    <span className="rounded-full bg-ai-done/12 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ai-done">
                      Active
                    </span>
                  </div>
                  <dl className="mt-4 grid gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-2">
                    {[
                      ["Registration", "ABC-1234"],
                      ["Assigned driver", "Driver 001"],
                      ["Assigned route", "Route North"],
                      ["Mobile stock value", "$12,500"],
                      ["Today's sales", "$5,200"],
                      ["Customer stops", "18 / 20"],
                      ["Odometer", "85,400 km"],
                      ["Next service", "90,000 km"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 border-b border-lp-line pb-1.5 last:border-b-0">
                        <dt className="text-lp-muted">{k}</dt>
                        <dd className="font-medium text-lp-ink">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <Warning>
                The vehicle is normally a fixed asset; the products inside it are inventory. They are accounted for
                separately.
              </Warning>
              <AiNote>
                She can analyse fleet utilisation, plan maintenance and work out what each vehicle actually costs to
                run.
              </AiNote>
            </Fn>

            <Fn id="routes" title="Routes — the day, in order">
              <P>
                Routes define the customer stops, the visit sequence, the assigned vehicle and the schedule, so drivers
                are not sent out without a plan.
              </P>
              <ol className="mt-4 space-y-2">
                {route.map(([when, what]) => (
                  <li key={when} className="flex gap-3 rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-lp-brand" />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-lp-ink">{when}</p>
                      <p className="mt-0.5 text-[13px] text-lp-muted">{what}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <Note>Illustrative route, not an actual geographic map.</Note>
              <AiNote>
                {AI} can analyse past visits, recommend the visit sequence, identify missed stops and find route
                efficiencies where the location data supports it.
              </AiNote>
            </Fn>

            <Fn id="van-sales" title="Van sales — selling from the vehicle">
              <P>
                Transactions made directly from a van: visit the customer, sell from mobile stock, record the payment —
                food distributors, beverages, pharmaceutical wholesalers, consumer goods.
              </P>
              <Flow steps={vanDay} />
              <Caption>Example — daily van inventory reconciliation</Caption>
              <DataTable
                head={["Product", "Loaded", "Sold", "Returned", "Variance"]}
                rows={[
                  ["Bottled water", "500", "380", "120", "0"],
                  ["Soft drinks", "300", "250", "48", "−2"],
                  ["Energy drinks", "200", "150", "50", "0"],
                  ["Biscuits", "400", "320", "80", "0"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="l" className="font-semibold text-lp-ink">1,400</b>,
                    <b key="s" className="font-semibold text-lp-ink">1,100</b>,
                    <b key="r" className="font-semibold text-lp-ink">298</b>,
                    <b key="v" className="font-semibold text-lp-ink">−2</b>,
                  ],
                ]}
              />
              <Warning>
                Two units are unaccounted for. Loading a van from the warehouse is an internal transfer, not a sale —
                revenue is recognised when the goods reach the customer.
              </Warning>
              <AiNote>
                She can identify missing mobile stock, reconcile collections, compare drivers and recommend what each
                van should carry.
              </AiNote>
            </Fn>

            <PartHeading title="Service operations" />

            <Fn id="field-service" title="Field service — work at the customer's premises">
              <P>
                Installations, repairs, maintenance, inspections and technical support at customer sites, each job
                running from creation and assignment through to completion and billing. A job can attach to a van
                route and become a planned stop.
              </P>
              <Photos photos={fieldPhotos} />
              <Flow steps={fieldFlow} />
              <Caption>Example — a fibre installation</Caption>
              <DataTable
                head={["Job information", "Details"]}
                rows={[
                  ["Job reference", "FS-2026-001"],
                  ["Service", "Fibre-to-shop installation"],
                  ["Technician", "Engineer 003"],
                  ["Route", "Electronics Market Route"],
                  ["Equipment", "1 ONT device"],
                  ["Materials", "50 metres of fibre cable"],
                  ["Estimated labour", "2 hours"],
                  ["Status", <Status key="s" kind="wait">Assigned</Status>],
                ]}
              />
              <Note>
                The technician records the equipment and materials used, completes the work and updates the job. The
                service and equipment charges can then be invoiced — connecting field work to sales, inventory, the
                fleet and accounting.
              </Note>
              <AiNote>
                {AI} can prioritise jobs, analyse technician workload, schedule service, estimate materials and flag
                what is overdue.
              </AiNote>
            </Fn>

            <Fn id="repairs" title="Repair orders — the workshop pipeline">
              <P>
                The full repair life of a customer device, from intake and fault assessment through quotation, repair,
                testing, billing and collection — electronics, computers, phones, equipment maintenance, automotive.
              </P>
              <Photos photos={repairPhotos} />
              <Caption>The pipeline</Caption>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {repairStages.map(([title, text]) => (
                  <div key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                    <p className="mt-0.5 text-[12.5px] leading-[1.5] text-lp-muted">{text}</p>
                  </div>
                ))}
              </div>
              <Caption>Example — repair order RO-10025</Caption>
              <div className="mt-3 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 lg:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt lg:w-48">
                  <Image
                    src="/operations/repair-laptop.jpg"
                    alt="A laptop screen being replaced on a workbench"
                    fill
                    sizes="(min-width: 1024px) 192px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] text-lp-body">
                    Business laptop · damaged screen and faulty battery
                  </p>
                  <Figures
                    items={[
                      ["Customer charge", "$410"],
                      ["Direct cost", "$220"],
                      ["Gross profit", "$190"],
                    ]}
                  />
                </div>
              </div>
              <DataTable
                head={["Repair item", "Customer charge", "Direct cost"]}
                rows={[
                  ["Replacement screen", "$180", "$110"],
                  ["Replacement battery", "$90", "$50"],
                  ["Diagnostic service", "$40", "$15"],
                  ["Repair labour", "$100", "$45"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total before tax</b>,
                    <b key="c" className="font-semibold text-lp-ink">$410</b>,
                    <b key="d" className="font-semibold text-lp-ink">$220</b>,
                  ],
                ]}
              />
              <P small>A gross margin of 46.3% on the job.</P>
              <AiNote>
                She can estimate repair costs, identify recurring faults, analyse technician performance, flag delayed
                repairs and compare profitability.
              </AiNote>
            </Fn>

            <Fn id="appointments" title="Service appointments — booking people's time">
              <P>
                Customer bookings, employee availability, check-ins, completion and billing — for salons, spas, beauty
                clinics, consultancies, maintenance companies and professional services.
              </P>
              <Photos photos={apptPhotos} />
              <Note>
                An appointment carries the customer, the service, the assigned employee, the duration, the agreed
                price, the date and the completion status.
              </Note>
              <AiNote>
                {AI} can find scheduling conflicts, analyse demand, highlight unfilled capacity and recommend better
                scheduling.
              </AiNote>
            </Fn>

            <PartHeading title="Support & knowledge" />

            <Fn id="helpdesk" title="Helpdesk — requests in one place">
              <P>
                Requests, complaints, technical issues and enquiries from customers and staff, kept as structured
                records instead of scattered across email, messages and phone calls.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-4">
                {[
                  ["Open tickets", "24"],
                  ["In progress", "12"],
                  ["Awaiting response", "8"],
                  ["Resolved today", "18"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <DataTable
                head={["Ticket", "Issue", "Assigned to", "Priority"]}
                rows={tickets.map(([id, issue, team, priority]) => [
                  id,
                  issue,
                  team,
                  <Status key={id} kind={priority === "Critical" || priority === "High" ? "no" : priority === "Medium" ? "wait" : "ok"}>
                    {priority}
                  </Status>,
                ])}
              />
              <Flow
                steps={[
                  ["Request received", "The ticket is created and categorised"],
                  ["Assigned and investigated", "To the responsible department"],
                  ["Resolved and closed", "With the resolution confirmed"],
                ]}
              />
              <AiNote>
                She can classify incoming tickets, judge urgency, suggest the department, draft responses and surface
                unresolved or recurring issues.
              </AiNote>
            </Fn>

            <Fn id="sla" title="Helpdesk SLA — the clock on every ticket">
              <P>
                An SLA sets how quickly a request should get its first response and its resolution. Targets are set by
                priority, and open tickets are watched against them.
              </P>
              <DataTable
                head={["Priority", "First response", "Resolution target"]}
                rows={[
                  ["Critical", "15 minutes", "4 hours"],
                  ["High", "1 hour", "8 hours"],
                  ["Medium", "4 hours", "24 hours"],
                  ["Low", "24 hours", "72 hours"],
                ]}
              />
              <Caption>Example — a critical ticket, 2h 30m old</Caption>
              <Figures
                items={[
                  ["First-response target", "15 minutes — met"],
                  ["Resolution consumed", "63%"],
                  ["Time remaining", "1h 30m"],
                ]}
              />
              <Note>
                Illustrative elapsed-time monitoring. Real SLA calculations may account for business hours, holidays,
                pauses and recorded response timestamps.
              </Note>
              <AiNote>
                {AI} can identify tickets approaching their deadline, prioritise the urgent ones, recommend escalation
                and analyse recurring service failures.
              </AiNote>
            </Fn>

            <Fn id="knowledge-base" title="Knowledge base — what the company knows">
              <P>
                Internal articles, standard procedures, training material, policies, troubleshooting guides and FAQs,
                categorised and searchable. Without one, knowledge leaves when experienced staff do.
              </P>
              <DataTable
                head={["Article", "Department", "Views"]}
                rows={articles.map((a) => [...a])}
              />
              <Example>
                An employee asks, &ldquo;{AI}, what is our procedure for installing fibre internet for a new
                customer?&rdquo; — and she answers from the authorised internal procedure, including the documents, the
                approvals and the controls, rather than from general knowledge.
              </Example>
              <AiNote>
                She can help staff find the right article, summarise a procedure, draft training material and point out
                gaps in the documentation.
              </AiNote>
            </Fn>

            <Fn id="calendar" title="Calendar — one view of the week">
              <P>
                Meetings, reminders, deadlines, appointments and team tasks in one place, so operational and financial
                obligations do not get missed.
              </P>
              <ul className="mt-4 space-y-2">
                {diary.map(([date, what, who]) => (
                  <li key={what} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <span className="rounded-lg bg-lp-alt px-2.5 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-lp-ink">
                      {date}
                    </span>
                    <span className="min-w-0 flex-1 text-[13.5px] text-lp-ink">{what}</span>
                    <span className="text-[12.5px] text-lp-muted">{who}</span>
                  </li>
                ))}
              </ul>
              <Note>
                Activities can include management meetings, tax filing deadlines, customer appointments, field visits,
                reporting deadlines, stock counts, fleet maintenance and staff training.
              </Note>
              <AiNote>
                {AI} can analyse what is coming, find conflicts, prepare reminders, write meeting preparation summaries
                and coordinate across departments.
              </AiNote>
            </Fn>
          </div>
        </Container>
      </section>

      {/* accounting integration */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Operations and the ledger</Kicker>
          <H2>From the shop floor to the financial statements.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            A sale at a till, a product sold from a van, a completed repair or a billed appointment should reach the
            accounting records without anyone keying it twice.
          </p>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Business activity", "Debit", "Credit"]} rows={matrix.map((r) => [...r])} />
          </div>
          <Note>
            Raising a helpdesk ticket, configuring a floor plan, scheduling an appointment or writing a knowledge base
            article does not ordinarily post anything to the general ledger.
          </Note>
        </Container>
      </section>

      {/* KPIs */}
      <section>
        <Container className="py-16">
          <Kicker>Operational performance indicators</Kicker>
          <H2>Twelve numbers that describe the day.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(([label, value, context]) => (
              <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                <p className="text-[12px] text-lp-muted">{context}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Indicator", "Definition"]} rows={kpiDefinitions.map((k) => [...k])} />
          </div>
          <Note>Illustrative management KPIs.</Note>
        </Container>
      </section>

      {/* agentic AI */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Agentic AI across all 19 functions</Kicker>
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

          <Caption>Example — your AI operations manager, 7:00 am</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Business owner</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  Good morning, {AI}. Review yesterday&rsquo;s sales across all branches, reconcile the registers,
                  check our vans, identify overdue repairs, review the helpdesk tickets and prepare today&rsquo;s
                  priorities.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                Good morning. I have been through the operational records across the business.
              </p>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "Sales from 12 terminals across four branches",
                  "Eight completed cashier shift reconciliations, two discrepancies totalling $65",
                  "Mobile sales from 18 active vehicles",
                  "Three field service jobs awaiting a technician",
                  "Four repair orders past their expected completion",
                  "Five helpdesk tickets approaching their SLA deadlines",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Your daily operations report and the proposed actions are{" "}
                <b className="font-semibold text-lp-ink">ready for review.</b>
              </p>
            </div>
          </div>
          <Note>
            Illustrative interaction. What she can act on depends on configured permissions, available data and
            approval requirements.
          </Note>
        </Container>
      </section>

      {/* industries */}
      <section>
        <Container className="py-16">
          <Kicker>One platform, many trades</Kicker>
          <H2>The same system behind very different counters.</H2>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {industries.map((industry) => (
              <figure key={industry.title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                <div className="relative aspect-[3/2] bg-lp-alt">
                  <Image
                    src={industry.src}
                    alt={industry.alt}
                    fill
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
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
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Operational controls & governance</Kicker>
          <H2>Processing transactions is not the same as controlling them.</H2>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Control", "Purpose"]} rows={controls.map((c) => [...c])} />
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              ["/operations/philosophy-1.jpg", "A modern store interior with digital displays"],
              ["/operations/philosophy-2.jpg", "Staff serving guests in a restaurant"],
              ["/operations/philosophy-3.jpg", "Equipment and tools in a service business"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-canvas">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} operations philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              Your business does not stop at the cash register.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              A supermarket sale moves inventory, revenue, tax and loyalty. A restaurant order moves the kitchen, the
              table, the ingredients and the staff. A van sale moves mobile stock, the route and the collections. A
              repair moves parts, labour, satisfaction and profit. Run those through disconnected systems and the time
              goes on transferring information, reconciling records and correcting what does not match.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-lp-body">
              A business does not necessarily need more cashiers, administrators, vehicles or supervisors. It needs
              better information, more efficient processes, intelligent automation and real controls — with management
              still responsible for the decisions that matter.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — Sell anywhere. Serve everywhere.{" "}
              <span className="text-lp-brand">Manage everything.</span>
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

/** Three photographs across, as the guide sets them. */
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

/** A status pill. */
function Status({ kind, children }: { kind: "ok" | "wait" | "no"; children: ReactNode }) {
  const tone = {
    ok: "bg-ai-done/12 text-ai-done",
    wait: "bg-needs-human/12 text-needs-human",
    no: "bg-lp-ink/10 text-lp-muted",
  }[kind];
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]", tone)}>
      {children}
    </span>
  );
}

/** A control worth noticing. */
function Warning({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 flex max-w-3xl gap-2.5 rounded-xl border border-needs-human/30 bg-needs-human/8 px-4 py-3 text-[13.5px] leading-[1.6] text-lp-body">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-needs-human" strokeWidth={1.75} />
      <span>{children}</span>
    </p>
  );
}
