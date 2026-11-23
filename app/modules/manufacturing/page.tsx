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
  Formula,
  Ledger,
  Note,
  P,
  PartHeading,
} from "@/components/landing/guide";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: `Manufacturing module`, // the root layout appends "· Tax GO"
  description: `The ${AI} manufacturing module in full: production orders, work orders, work centres, equipment maintenance, job work and material requirements planning — with worked costing for each.`,
};

const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

type Photo = [src: string, alt: string];

const productionPhotos: Photo[] = [
  ["/manufacturing/production-1.jpg", "A production schedule on a factory screen"],
  ["/manufacturing/production-2.jpg", "Workforce planning on a factory floor"],
  ["/manufacturing/production-3.jpg", "An inspector checking production equipment"],
];

const maintenancePhotos: Photo[] = [
  ["/manufacturing/maintenance-1.jpg", "Maintenance scheduling software"],
  ["/manufacturing/maintenance-2.jpg", "A proactive maintenance inspection"],
  ["/manufacturing/maintenance-3.jpg", "A technician inspecting machinery with a tablet"],
];

const jobWorkPhotos: Photo[] = [
  ["/manufacturing/jobwork-1.jpg", "A CNC machining service"],
  ["/manufacturing/jobwork-2.jpg", "Components prepared for an external contractor"],
  ["/manufacturing/jobwork-3.jpg", "A subcontracted machining operation"],
];

/** The bill of materials for the desk run. */
const materials: [string, string, string, string, string][] = [
  ["Wooden panels", "2", "200", "$25", "$5,000"],
  ["Steel legs", "4", "400", "$10", "$4,000"],
  ["Fastener kits", "1", "100", "$5", "$500"],
  ["Finishing materials", "1", "100", "$8", "$800"],
  ["Packaging", "1", "100", "$7", "$700"],
];

/** How far each operation has got. */
const operations: [string, number][] = [
  ["Material preparation", 100],
  ["Cutting", 100],
  ["Assembly", 85],
  ["Finishing", 80],
  ["Quality inspection", 75],
];

/** The work orders under the production order. */
const workOrders: [string, string, number, number, "Completed" | "In progress"][] = [
  ["WO-001", "Cutting", 10, 11, "Completed"],
  ["WO-002", "Drilling", 8, 8, "Completed"],
  ["WO-003", "Assembly", 20, 18, "In progress"],
  ["WO-004", "Finishing", 12, 9, "In progress"],
  ["WO-005", "Quality inspection", 5, 3, "In progress"],
  ["WO-006", "Packaging", 5, 2, "In progress"],
];

/** The work centres and what they cost. */
const workCentres: [string, string, string, number, number][] = [
  ["Cutting Centre", "16 hours", "$45", 14, 16],
  ["Drilling Centre", "16 hours", "$35", 12, 16],
  ["Assembly Centre", "24 hours", "$40", 28, 24],
  ["Finishing Centre", "16 hours", "$35", 10, 16],
  ["Quality Centre", "8 hours", "$30", 6, 8],
  ["Packaging Centre", "8 hours", "$25", 5, 8],
];

/** The four centres with photographs. */
const centrePhotos: { title: string; text: string; src: string; alt: string }[] = [
  { title: "Cutting centre", text: "Material preparation and cutting", src: "/manufacturing/centre-cutting.jpg", alt: "An industrial cutting machine" },
  { title: "Assembly centre", text: "Component and product assembly", src: "/manufacturing/centre-assembly.jpg", alt: "An assembly line in a furniture factory" },
  { title: "Finishing centre", text: "Painting and surface treatment", src: "/manufacturing/centre-finishing.jpg", alt: "Surface finishing of wooden furniture" },
  { title: "Quality centre", text: "Product inspection and testing", src: "/manufacturing/centre-quality.jpg", alt: "Quality inspection of manufactured goods" },
];

/** Labour cost by operation. */
const labour: [string, string, string, string][] = [
  ["Cutting", "11", "$45", "$495"],
  ["Drilling", "8", "$35", "$280"],
  ["Assembly", "18", "$40", "$720"],
  ["Finishing", "9", "$35", "$315"],
  ["Quality inspection", "3", "$30", "$90"],
  ["Packaging", "2", "$25", "$50"],
];

/** The equipment register's fields. */
const equipmentFields: [string, string][] = [
  ["Equipment reference", "Unique identification"],
  ["Equipment name", "Identify the machinery"],
  ["Serial number", "Manufacturer identification"],
  ["Work centre", "Operational assignment"],
  ["Installation date", "Lifecycle tracking"],
  ["Maintenance frequency", "Preventive servicing requirements"],
  ["Last maintenance", "Servicing history"],
  ["Next maintenance", "Future planning"],
  ["Equipment status", "Available, under maintenance or unavailable"],
];

/** The MRP picture. */
const mrp: [string, number, number, number][] = [
  ["Wooden panels", 120, 200, 480],
  ["Steel legs", 250, 400, 950],
  ["Fastener kits", 80, 100, 320],
  ["Finishing materials", 180, 100, 0],
  ["Packaging", 60, 100, 240],
];

/** Demand through to profit. */
const chain: [string, string][] = [
  ["Sales & customer demand", "Orders and forecast requirements"],
  ["Material requirements planning", "Review stock, identify what is needed"],
  ["Procurement", "Buy the raw materials"],
  ["Goods receipt", "Receive and inspect the components"],
  ["Production orders", "Plan the manufacturing quantities"],
  ["Work orders & centres", "Execute the operations, capture the cost"],
  ["Maintenance & job work", "Keep equipment running, manage outsourcing"],
  ["Finished goods & quality", "Inspect and record what was made"],
  ["Sales & distribution", "Deliver and invoice"],
  ["Financial accounting", "Costs, revenue, inventory and profit"],
];

/** The executive dashboard. */
const dashboard: [string, string][] = [
  ["Active production orders", "48"],
  ["Completed orders", "125"],
  ["Units manufactured", "12,500"],
  ["Open work orders", "186"],
  ["On-time production", "92%"],
  ["Work centre utilisation", "85.2%"],
  ["Operational equipment", "87.5%"],
  ["Material shortages", "14"],
  ["Stock at job workers", "$85,000"],
  ["Manufacturing cost", "$625K"],
  ["Manufactured goods revenue", "$850K"],
  ["Gross profit", "$225K"],
];

const attention: [string, string][] = [
  ["Production delays", "Six production orders are behind schedule"],
  ["Work centre capacity", "Assembly exceeds its available capacity"],
  ["Equipment maintenance", "Three preventive tasks are overdue"],
  ["Job work", "Two contractors have outstanding material returns"],
  ["Material shortages", "Fourteen materials need a replenishment review"],
];

/** What you can ask her. */
const asks: [string, string][] = [
  ["Plan the production of 500 office desks.", "Prepare the requirements from the product and BOM"],
  ["Show me all delayed work orders.", "Identify unfinished operations and bottlenecks"],
  ["Which work centres are overloaded?", "Compare scheduled workload against capacity"],
  ["Calculate the actual manufacturing cost.", "Material consumption, labour and allocated overheads"],
  ["Which machines require maintenance?", "Review preventive schedules and open tickets"],
  ["Why does this machine keep breaking down?", "Analyse the fault and maintenance history"],
  ["What stock is still with our job workers?", "Dispatched, returned and outstanding materials"],
  ["Run material requirements planning.", "Find the reorder-rule shortages and suggest quantities"],
  ["Prepare purchase requisitions for shortages.", "Draft the purchasing requirements for approval"],
  ["Which products are most profitable?", "Compare production costs against actual sales"],
];

const controls: [string, string][] = [
  ["Production order authorisation", "Prevent unauthorised manufacturing"],
  ["Bill of materials validation", "Ensure appropriate material consumption"],
  ["Work order tracking", "Establish operational accountability"],
  ["Work centre capacity monitoring", "Prevent resource overloading"],
  ["Labour hour validation", "Keep production costs accurate"],
  ["Material consumption tracking", "Identify waste and discrepancies"],
  ["Quality inspections", "Keep defective goods out of available stock"],
  ["Preventive maintenance", "Reduce unexpected machinery failures"],
  ["Corrective maintenance tickets", "Establish responsibility for repairs"],
  ["Job work challan", "Maintain accountability for externally held stock"],
  ["Stock transfer controls", "Track physical material movements"],
  ["Job work reconciliation", "Identify missing or outstanding materials"],
  ["MRP review and approval", "Prevent unnecessary purchasing"],
  ["Production cost reconciliation", "Validate finished goods valuation"],
  ["User permissions", "Prevent unauthorised operational changes"],
  ["AI approval controls", "Retain human oversight"],
  ["Audit trail", "Maintain accountability and traceability"],
];

export default function ManufacturingPage() {
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
              From raw materials. <Serif className="text-[32px] sm:text-[40px]">To financial success.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              Six functions for planning, running, watching and costing production. Manufacturing is not just turning
              materials into products — it is coordinating materials, machinery, labour, capacity, contractors,
              maintenance and the money behind all of it.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              Because production sits beside inventory, procurement, sales and accounting, you see both how much you
              made and what it actually cost.
            </p>
          </div>
        </Container>
      </section>

      {/* the six functions */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Production planning & execution" />

            <Fn id="production-orders" title="Production orders — authorising a run">
              <P>
                A production order is the instruction to manufacture a quantity of a product, using defined materials,
                labour, equipment and processes. It is where the bill of materials from inventory meets the factory
                floor.
              </P>
              <Photos photos={productionPhotos} />
              <Flow
                steps={[
                  ["Demand to order", "Customer orders, forecast or a stock shortage"],
                  ["BOM and availability", "What it needs, and what you actually have"],
                  ["Execute and inspect", "Work orders, then quality"],
                  ["Complete and post", "Consumption, finished goods, cost"],
                ]}
              />
              <Caption>Example — 100 office desks</Caption>
              <DataTable
                head={["Material", "Per desk", "Total", "Unit cost", "Cost"]}
                rows={[
                  ...materials.map((m) => [...m]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total material cost</b>,
                    "",
                    "",
                    "",
                    <b key="v" className="font-semibold text-lp-ink">$11,000</b>,
                  ],
                ]}
              />
              <div className="mt-4 flex flex-col gap-5 rounded-xl border border-lp-line bg-lp-card p-5 lg:flex-row">
                <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-lg bg-lp-alt lg:w-56">
                  <Image
                    src="/manufacturing/desk.jpg"
                    alt="An executive office desk with a metal frame"
                    fill
                    sizes="(min-width: 1024px) 224px, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">MO-000125</span>
                    <span className="text-[13px] text-lp-muted">Executive office desk</span>
                    <Status kind="wait">In progress</Status>
                  </div>
                  <Figures
                    items={[
                      ["Planned", "100 units"],
                      ["Completed", "75 units"],
                      ["Remaining", "25 units"],
                    ]}
                  />
                  <ul className="mt-4 space-y-2">
                    {operations.map(([name, pct]) => (
                      <li key={name}>
                        <div className="flex items-baseline justify-between text-[13px]">
                          <span className="text-lp-body">{name}</span>
                          <span className="text-lp-muted">{pct}%</span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-lp-alt">
                          <div className="h-full rounded-full bg-lp-brand" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <AiNote>
                {AI} can analyse demand, find material shortages, track progress, highlight delays and recommend
                production priorities against the resources you have.
              </AiNote>
            </Fn>

            <Fn id="work-orders" title="Work orders — the individual operations">
              <P>
                The production order says what to make; a work order says how one step of it gets done. One order can
                carry several, each at a different work centre, machine or team.
              </P>
              <DataTable
                head={["Work order", "Operation", "Planned hours", "Actual hours", "Status"]}
                rows={[
                  ...workOrders.map(([id, op, planned, actual, status]) => [
                    id,
                    op,
                    String(planned),
                    String(actual),
                    <Status key={id} kind={status === "Completed" ? "ok" : "wait"}>
                      {status}
                    </Status>,
                  ]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    "",
                    <b key="p" className="font-semibold text-lp-ink">60</b>,
                    <b key="a" className="font-semibold text-lp-ink">51</b>,
                    "",
                  ],
                ]}
              />
              <HoursChart />
              <Caption>Production order or work order?</Caption>
              <DataTable
                head={["Production order", "Work order"]}
                rows={[
                  ["The overall instruction", "One manufacturing operation"],
                  ["Specifies the finished product", "Specifies an activity"],
                  ["Defines the total quantity", "Tracks that operation's progress"],
                  ["Uses the bill of materials", "Uses work centre resources"],
                  ["Consolidates performance", "Provides the operational detail"],
                ]}
              />
              <AiNote>
                She can identify delayed work orders, compare planned against actual hours, find the bottleneck and
                recommend a change to the schedule.
              </AiNote>
            </Fn>

            <PartHeading title="Resources & equipment" />

            <Fn id="work-centres" title="Work centres — capacity, labour and cost">
              <P>
                A work centre is where an operation happens: a machine, an assembly station, a department, a
                packaging area, a team. Each has a daily capacity and an hourly rate, and work orders fill both in.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {centrePhotos.map((c) => (
                  <figure key={c.title} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                    <div className="relative aspect-[3/2] bg-lp-alt">
                      <Image
                        src={c.src}
                        alt={c.alt}
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover"
                      />
                    </div>
                    <figcaption className="px-4 pb-4 pt-3">
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{c.title}</p>
                      <p className="mt-0.5 text-[12.5px] leading-[1.5] text-lp-muted">{c.text}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <Caption>Capacity today</Caption>
              <ul className="mt-3 space-y-2.5">
                {workCentres.map(([name, , , scheduled, available]) => {
                  const pct = (scheduled / available) * 100;
                  const over = pct > 100;
                  return (
                    <li key={name}>
                      <div className="flex items-baseline justify-between text-[13.5px]">
                        <span className="text-lp-body">{name}</span>
                        <span className={cn("font-semibold", over ? "text-needs-human" : "text-lp-ink")}>
                          {pct.toFixed(1)}%{" "}
                          <span className="font-normal text-lp-muted">
                            ({scheduled} of {available} hrs)
                          </span>
                        </span>
                      </div>
                      <div className="mt-1 h-2 overflow-hidden rounded-full bg-lp-alt">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: over ? CHART.orange : pct > 80 ? CHART.amber : CHART.green,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              <Warning>
                88 hours of capacity against 75 scheduled — so there is room overall, but the assembly centre is 4
                hours over and that is where the run will stall.
              </Warning>
              <Caption>Work centre rates</Caption>
              <DataTable
                head={["Work centre", "Daily capacity", "Hourly cost"]}
                rows={workCentres.map(([name, capacity, rate]) => [name, capacity, rate])}
              />
              <Caption>What the labour cost</Caption>
              <Formula>Operation cost = actual hours × hourly rate</Formula>
              <DataTable
                head={["Operation", "Actual hours", "Rate", "Cost"]}
                rows={[
                  ...labour.map((l) => [...l]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="h" className="font-semibold text-lp-ink">51</b>,
                    "",
                    <b key="c" className="font-semibold text-lp-ink">$1,950</b>,
                  ],
                ]}
              />
              <AiNote>
                {AI} can analyse utilisation, find the overloaded resources, compare costs, highlight productivity
                variances and suggest another way to run it.
              </AiNote>
            </Fn>

            <Fn id="maintenance" title="Maintenance — before the breakdown">
              <P>
                An equipment registry, preventive schedules and corrective tickets — the point being to move from
                fixing machines when they stop to servicing them before they do.
              </P>
              <Photos photos={maintenancePhotos} />
              <Caption>The equipment registry</Caption>
              <DataTable head={["Information", "Purpose"]} rows={equipmentFields.map((e) => [...e])} />
              <Caption>The nightly scheduler</Caption>
              <P small>
                At 02:00 every night the scheduler reviews registered equipment, evaluates the preventive schedules,
                finds whatever is due and raises the tasks or tickets — so servicing does not depend on someone
                remembering a date.
              </P>
              <Caption>Example — the maintenance picture</Caption>
              <div className="mt-3 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Registered equipment", "48"],
                  ["Operational", "42"],
                  ["Under maintenance", "4"],
                  ["Breakdowns", "2"],
                  ["Preventive tasks due", "8"],
                  ["Open tickets", "6"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-2.5 space-y-2">
                {[
                  ["CNC cutting machine 02", "Unexpected mechanical breakdown", "no"],
                  ["Assembly machine 04", "Scheduled servicing due", "wait"],
                  ["Painting equipment 01", "Preventive maintenance overdue", "no"],
                ].map(([machine, issue, kind]) => (
                  <li
                    key={machine}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-needs-human/30 bg-needs-human/6 px-4 py-3"
                  >
                    <span className="text-[13.5px] font-semibold text-lp-ink">{machine}</span>
                    <span className="text-[12.5px] text-lp-muted">{issue}</span>
                    <Status kind={kind as "no" | "wait"}>{kind === "no" ? "Action needed" : "Due"}</Status>
                  </li>
                ))}
              </ul>
              <Note>
                A failure is not only an operational problem: it means lost production, extra labour, emergency
                purchases, late deliveries and thinner margins.
              </Note>
              <AiNote>
                She can analyse maintenance history, find recurring faults, flag overdue servicing, spot downtime
                patterns and rank what to fix first.
              </AiNote>
            </Fn>

            <PartHeading title="Outsourced manufacturing" />

            <Fn id="job-work" title="Job work — sending materials out">
              <P>
                Raw materials, components or semi-finished goods go to an external contractor for processing,
                assembly or finishing, and come back. The principle that matters: what you send remains your
                inventory, moved to an &ldquo;at job worker&rdquo; warehouse by stock transfer.
              </P>
              <Photos photos={jobWorkPhotos} />
              <Flow
                steps={[
                  ["Raise the job work order", "The contractor and what they will do"],
                  ["Issue the challan", "Document the materials sent out"],
                  ["Transfer the stock", "Into the at-job-worker warehouse"],
                  ["Receive and inspect", "Returned quantities, outstanding materials"],
                  ["Record the service bill", "Processing charges from the vendor"],
                ]}
              />
              <Caption>What a challan records</Caption>
              <DataTable
                head={["Challan information", "Purpose"]}
                rows={[
                  ["Challan reference", "Track the movement"],
                  ["Job worker", "Identify the external manufacturer"],
                  ["Material description", "Identify the components supplied"],
                  ["Quantity dispatched", "Establish accountability"],
                  ["Expected return date", "Monitor the deadline"],
                  ["Returned quantity", "Track what came back"],
                  ["Outstanding quantity", "What is still held externally"],
                ]}
              />
              <Note>Challan and tax requirements depend on the country you operate in.</Note>
              <Caption>Example — 1,000 components out for coating</Caption>
              <DataTable
                head={["Description", "Quantity / value"]}
                rows={[
                  ["Components dispatched", "1,000 units"],
                  ["Material cost per unit", "$12"],
                  ["Material value dispatched", "$12,000"],
                  ["Processing charge per unit", "$3"],
                  ["Expected processing charges", "$3,000"],
                  ["Expected finished value", "$15,000"],
                  [
                    <b key="u" className="font-semibold text-lp-ink">Cost per finished component</b>,
                    <b key="v" className="font-semibold text-lp-ink">$15</b>,
                  ],
                ]}
              />
              <Caption>JW-00045 — where the stock is</Caption>
              <Figures
                items={[
                  ["Dispatched", "1,000"],
                  ["Returned", "800 · $9,600"],
                  ["Still outstanding", "200 · $2,400"],
                ]}
              />
              <Warning>
                Sending stock to a job worker is not a sale. It stays your asset; the transfer may need an internal
                reclassification where warehouses have separate ledger accounts, but it creates no revenue. Eligible
                processing costs can go into inventory valuation rather than straight to expense.
              </Warning>
              <AiNote>
                {AI} can monitor what is still out there, flag overdue returns, compare processing costs, catch
                quantity discrepancies and prompt the follow-up.
              </AiNote>
            </Fn>

            <PartHeading title="Material planning" />

            <Fn id="mrp" title="MRP — spotting the shortages">
              <P>
                The MRP function scans the configured reorder rules, detects shortages and suggests replenishment —
                connecting what production needs to inventory and procurement.
              </P>
              <Note>
                Full-scale MRP systems also do multi-level BOM explosion, time-phased demand and production
                scheduling. This function is specifically shortage detection against reorder rules, with a
                recommendation.
              </Note>
              <Caption>Example — the material position</Caption>
              <DataTable
                head={["Material", "Available", "Minimum", "Suggested replenishment", "Status"]}
                rows={mrp.map(([name, available, minimum, suggested]) => [
                  name,
                  String(available),
                  String(minimum),
                  suggested ? String(suggested) : "—",
                  <Status key={name} kind={available < minimum ? "no" : "ok"}>
                    {available < minimum ? "Shortage" : "Sufficient"}
                  </Status>,
                ])}
              />
              <Figures
                items={[
                  ["Materials reviewed", "5"],
                  ["Replenishment required", "4"],
                  ["Replenish up to", "Maximum stock level"],
                ]}
              />
              <Example>
                Wooden panels: 150 projected against a 200 minimum — a 50 shortfall, a recommended 450 units to reach
                the maximum, an $11,250 purchase commitment.
              </Example>
              <Note>
                Actual order quantities still depend on supplier minimums, lead times and existing purchase
                commitments.
              </Note>
              <AiNote>
                She can explain a shortage, analyse availability, rank the purchasing priorities, estimate the cost
                and warn about the production it would interrupt.
              </AiNote>
            </Fn>
          </div>
        </Container>
      </section>

      {/* costing + accounting */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Manufacturing and the ledger</Kicker>
          <H2>What the run cost, and what it made.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            Manufacturing cost is three things: direct materials, direct labour and eligible production overheads.
            For the hundred desks:
          </p>
          <CostChart />
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <Caption>Raw materials consumed</Caption>
              <Ledger
                rows={[
                  ["Work in progress", "$11,000", "—"],
                  ["Raw materials inventory", "—", "$11,000"],
                ]}
              />
              <Caption>Labour and overhead allocated</Caption>
              <Ledger
                rows={[
                  ["Work in progress", "$4,000", "—"],
                  ["Labour cost absorption", "—", "$2,400"],
                  ["Production overhead absorption", "—", "$1,600"],
                ]}
              />
            </div>
            <div>
              <Caption>Production completed</Caption>
              <Ledger
                rows={[
                  ["Finished goods inventory", "$15,000", "—"],
                  ["Work in progress", "—", "$15,000"],
                ]}
              />
              <Caption>And sold, at $220 each</Caption>
              <Ledger
                rows={[
                  ["Accounts receivable", "$22,000", "—"],
                  ["Sales revenue", "—", "$22,000"],
                  ["Cost of goods sold", "$15,000", "—"],
                  ["Finished goods inventory", "—", "$15,000"],
                ]}
              />
            </div>
          </div>
          <Figures
            items={[
              ["Cost per unit", "$150.00"],
              ["Gross profit", "$7,000 · $70 a unit"],
              ["Gross margin", "31.82%"],
            ]}
          />
          <Note>
            A conventional work-in-progress model. The actual postings depend on the configured stock journal,
            valuation and ledger policies — and additional overheads should exclude anything already inside the
            hourly work centre rate, or it gets counted twice.
          </Note>

          <Caption>Demand through to profit</Caption>
          <ol className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {chain.map(([title, text]) => (
              <li key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                <p className="mt-1 text-[12.5px] leading-[1.5] text-lp-muted">{text}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* dashboard */}
      <section>
        <Container className="py-16">
          <Kicker>The manufacturing dashboard</Kicker>
          <H2>Output, capacity, equipment and margin.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {dashboard.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                <p className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
              </div>
            ))}
          </div>
          <Caption>Requiring attention</Caption>
          <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
            {attention.map(([title, text]) => (
              <div key={title} className="rounded-xl border border-needs-human/30 bg-needs-human/6 px-4 py-3.5">
                <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                <p className="mt-1 text-[12.5px] leading-[1.5] text-lp-muted">{text}</p>
              </div>
            ))}
          </div>
          <Note>Illustrative monthly overview.</Note>
        </Container>
      </section>

      {/* agentic AI */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Agentic AI across all six functions</Kicker>
          <H2>
            You ask. She understands. <Serif className="text-[32px] sm:text-[40px]">She delivers.</Serif>
          </H2>
          <div className="mt-8">
            <DataTable
              head={[`What you ask ${AI}`, "What she can analyse or prepare"]}
              rows={asks.map(([q, a]) => [
                <span key={q} className="font-medium text-lp-ink">
                  &ldquo;{q}&rdquo;
                </span>,
                a,
              ])}
            />
          </div>

          <Caption>Example — Monday morning with the manufacturing director</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">
                Manufacturing director
              </p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  Good morning, {AI}. Review the production orders, check material availability, identify delays,
                  review equipment maintenance and tell me what needs me this week.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {[
                  ["Production orders reviewed", "48"],
                  ["Replenishment commitment", "$24,650"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-lp-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{k}</p>
                    <p className="text-[15px] font-semibold text-lp-ink">{v}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "186 open work orders analysed; six production orders behind schedule",
                  "A capacity bottleneck at the assembly centre",
                  "14 materials needing replenishment",
                  "Outstanding inventory still held by job workers",
                  "Proposed purchasing and production adjustments prepared",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Needing approval: the purchase requisitions, reallocating work orders, maintenance for three
                machines, chasing the job workers, and the revised production priorities.{" "}
                <b className="font-semibold text-lp-ink">You remain in control of the decisions.</b>
              </p>
            </div>
          </div>
          <Note>Illustrative workflow, subject to the integrations, permissions and capabilities in place.</Note>
        </Container>
      </section>

      {/* controls + philosophy */}
      <section>
        <Container className="py-16">
          <Kicker>Manufacturing controls & governance</Kicker>
          <H2>Material losses start where the controls stop.</H2>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Control", "Purpose"]} rows={controls.map((c) => [...c])} />
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              ["/manufacturing/philosophy-1.jpg", "An automated production line"],
              ["/manufacturing/philosophy-2.jpg", "A production manager on the factory floor"],
              ["/manufacturing/philosophy-3.jpg", "A finished goods warehouse"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-alt">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} manufacturing philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              Every material has a cost. Every operation creates value.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              An idle machine is unused capacity. A material shortage is a delay waiting to happen. Excess inventory
              is working capital tied up. A breakdown is lost productivity. And an inaccurate production cost makes
              every profitability number unreliable.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-lp-body">
              Doubling output does not require doubling the workforce. It takes better planning, resources used
              properly, reliable machinery, intelligent material management — and the repetitive monitoring handled
              for you, so people can concentrate on engineering, quality and the work itself.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — From raw materials{" "}
              <span className="text-lp-brand">to financial success.</span>
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

/** Planned against actual hours, operation by operation. */
function HoursChart() {
  const max = 24;
  const top = 10;
  const base = 150;
  const left = 46;
  const band = 74;
  const bar = 22;
  const y = (v: number) => base - (v / max) * (base - top);

  return (
    <div>
      <div className="mt-4 flex gap-5 text-[12px] text-lp-muted">
        {[
          ["Planned hours", CHART.blue],
          ["Actual hours", CHART.green],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 500 185" className="mt-2 w-full" role="img" aria-label="Planned against actual hours by operation">
        {[0, 12, 24].map((v) => (
          <g key={v}>
            <line x1={left} x2="490" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              {v}h
            </text>
          </g>
        ))}
        {workOrders.map(([, operation, planned, actual], i) => {
          const x = left + i * band + (band - bar * 2 - 4) / 2;
          return (
            <g key={operation}>
              <rect x={x} y={y(planned)} width={bar} height={base - y(planned)} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 4} y={y(actual)} width={bar} height={base - y(actual)} rx="3" fill={CHART.green} />
              <text x={left + i * band + band / 2} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[10px]">
                {operation.split(" ")[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** What makes up the $15,000. */
function CostChart() {
  const parts: [string, number, string][] = [
    ["Direct materials", 11000, CHART.blue],
    ["Direct labour", 2400, CHART.green],
    ["Production overheads", 1600, CHART.amber],
  ];
  const total = 15000;
  return (
    <div className="mt-6">
      <div className="flex h-7 overflow-hidden rounded-lg">
        {parts.map(([label, value, colour]) => (
          <div key={label} style={{ width: `${(value / total) * 100}%`, backgroundColor: colour }} title={label} />
        ))}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[13.5px] sm:grid-cols-3">
        {parts.map(([label, value, colour]) => (
          <li key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} />
            <span className="flex-1 text-lp-body">{label}</span>
            <span className="font-semibold tabular-nums text-lp-ink">${value.toLocaleString("en-US")}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12.5px] text-lp-muted">
        $15,000 total · 100 finished products · $150.00 a unit.
      </p>
    </div>
  );
}
