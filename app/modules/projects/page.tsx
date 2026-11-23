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
  title: `Projects module`, // the root layout appends "· Tax GO"
  description: `The ${AI} project management module in full: projects and milestones, personal task lists, weekly timesheets and billable hours, project billing, and project costing and profitability.`,
};

const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

type Photo = [src: string, alt: string];

const projectPhotos: Photo[] = [
  ["/projects/projects-1.jpg", "A team reviewing a project schedule on a meeting-room screen"],
  ["/projects/projects-2.jpg", "A team planning work on a task board"],
  ["/projects/projects-3.jpg", "An engineer and a manager reviewing drawings on a construction site"],
];

const timesheetPhotos: Photo[] = [
  ["/projects/timesheet-1.jpg", "Someone filling in a weekly timesheet on screen"],
  ["/projects/timesheet-2.jpg", "A team working at their laptops in an open office"],
  ["/projects/timesheet-3.jpg", "A timesheet on a laptop beside a printed invoice"],
];

const philosophyPhotos: Photo[] = [
  ["/projects/philosophy-1.jpg", "A project review meeting"],
  ["/projects/philosophy-2.jpg", "A site team reviewing a project dashboard"],
  ["/projects/philosophy-3.jpg", "A team celebrating a delivered project"],
];

/** The kinds of work a project can be. */
const projectTypes: [string, string][] = [
  ["Accounting & audit", "Audits, tax returns and financial reporting engagements"],
  ["Software development", "Application development, implementation and maintenance"],
  ["Construction", "Building projects, renovation and infrastructure development"],
  ["Consulting", "Business advisory and professional services"],
  ["Engineering", "Technical installations and engineering contracts"],
  ["Internal projects", "Organisational improvements, research and administration"],
];

/** A project, from creation to close. */
const projectLifecycle: [string, string][] = [
  ["Create project", "Define the customer, objectives and scope"],
  ["Plan resources & budget", "Estimate costs, hours and delivery dates"],
  ["Create tasks", "Break the project into manageable activities"],
  ["Assign responsibilities", "Allocate tasks to team members"],
  ["Execute the work", "Complete the assigned activities"],
  ["Record timesheets", "Capture actual hours and billable work"],
  ["Review performance", "Compare progress and costs against the plan"],
  ["Project billing", "Convert eligible completed work into invoices"],
  ["Project completion", "Review final delivery and profitability"],
];

/** What a project record holds. */
const projectFields: [string, string][] = [
  ["Project name", "Identify the engagement"],
  ["Project reference", "Unique tracking number"],
  ["Customer", "Link the project to a customer account"],
  ["Project manager", "Establish management responsibility"],
  ["Start date", "Planned commencement"],
  ["End date", "Expected completion"],
  ["Project description", "Define objectives and scope"],
  ["Assigned team", "Identify responsible employees"],
  ["Estimated hours", "Plan resource requirements"],
  ["Actual hours", "Monitor resource consumption"],
  ["Project budget", "Establish financial limits"],
  ["Billable work", "Identify revenue-generating activities"],
  ["Project status", "Monitor execution progress"],
];

/** The example project's milestones. */
const milestones: [string, number][] = [
  ["Requirements gathering", 100],
  ["System design", 100],
  ["Development", 80],
  ["Testing", 50],
  ["Staff training", 20],
  ["Go-live implementation", 0],
];

/** What a task record holds. */
const taskFields: [string, string][] = [
  ["Task name", "Identify the required activity"],
  ["Associated project", "Link work to the relevant project"],
  ["Assigned employee", "Establish responsibility"],
  ["Task description", "Explain expected deliverables"],
  ["Priority", "Determine urgency"],
  ["Start date", "Planned commencement"],
  ["Due date", "Completion deadline"],
  ["Estimated hours", "Plan workload"],
  ["Actual hours", "Measure time consumed"],
  ["Billable status", "Identify work eligible for billing"],
  ["Task status", "Monitor progress"],
];

/** One person's task list. */
const myTasks: [string, string, string, "late" | "high" | "doing" | "todo" | "done"][] = [
  ["Complete bank reconciliation", "Financial Audit · 4 hours", "Overdue", "late"],
  ["Review system test results", "ERP Implementation · 6 hours", "High priority", "high"],
  ["Prepare customer training material", "ERP Implementation · 5 hours", "In progress", "doing"],
  ["Review website design", "Website Development · 3 hours", "Pending", "todo"],
  ["Update financial schedules", "Financial Audit · 4 hours", "Completed", "done"],
];

/** A task, from assignment to close. */
const taskFlow: [string, string][] = [
  ["Create & assign", "The project manager raises the task and gives it an owner"],
  ["It appears in My Tasks", "The employee sees it beside everything else they owe"],
  ["Work & record time", "Hours go onto the timesheet against the task"],
  ["Complete & review", "The deliverable is checked before the task closes"],
  ["Close & update", "Accepted work closes the task and moves project progress"],
];

/** Recording time, step by step. */
const timesheetLifecycle: [string, string][] = [
  ["Select project", "Identify the relevant customer or internal project"],
  ["Select task", "Identify the activity performed"],
  ["Record hours", "Enter daily hours on the weekly grid"],
  ["Identify billable work", "Distinguish customer work from internal activities"],
  ["Review timesheet", "Validate hours and project allocations"],
  ["Cost & bill", "Use recorded time for costing and eligible invoices"],
];

/** The example week. */
const week: [string, string, number[], number][] = [
  ["ERP Implementation", "Development", [4, 4, 4, 4, 4], 20],
  ["Financial Audit", "Reconciliation", [2, 2, 2, 2, 2], 10],
  ["Website Development", "Testing", [1, 1, 1, 1, 1], 5],
  ["Internal Operations", "Administration", [1, 1, 1, 1, 1], 5],
];

/** Which hours a customer pays for. */
const billableSplit: [string, string][] = [
  ["Customer consulting", "Internal administration"],
  ["Software development for clients", "Employee training"],
  ["Customer technical support under contract", "Internal meetings"],
  ["Accounting and auditing services", "Business development"],
  ["Engineering services", "Preparing unsuccessful proposals"],
  ["Customer project implementation", "General office activities"],
];

/** What the project's own people cost it. */
const labourCost: [string, number, number, number][] = [
  ["Project manager", 20, 60, 1200],
  ["Senior developer", 80, 50, 4000],
  ["Software developer", 100, 35, 3500],
  ["Quality analyst", 40, 30, 1200],
  ["Business analyst", 30, 40, 1200],
];

/** How work turns into an invoice. */
const billingFlow: [string, string][] = [
  ["Review unbilled work", "Eligible hours and completed tasks, against the contract"],
  ["Prepare the invoice", "Rates, descriptions and the billing period"],
  ["Validate charges & tax", "Check the amounts and the applicable taxes"],
  ["Approve & post", "An authorised person releases it to the customer"],
  ["Collect & reconcile", "Match the receipt against the invoice"],
];

/** The commercial arrangements. */
const billingMethods: [string, string][] = [
  ["Time-based billing", "Charge customers for eligible hours worked"],
  ["Fixed-price billing", "Charge an agreed amount for the project"],
  ["Milestone billing", "Invoice when contractual milestones are achieved"],
  ["Progress billing", "Invoice based on agreed project completion measures"],
  ["Time and materials", "Charge for labour and eligible materials"],
  ["Retainer billing", "Charge an agreed periodic service fee"],
  ["Expense reimbursement", "Recover authorised project-related expenses"],
];

/** The month's billable work. */
const billableWork: [string, number, number, number][] = [
  ["Project management", 20, 150, 3000],
  ["Software development", 100, 120, 12000],
  ["Business analysis", 30, 100, 3000],
  ["Quality testing", 40, 80, 3200],
  ["Staff training", 10, 100, 1000],
];

/** A $50,000 contract, split into billing milestones. */
const contractMilestones: [string, string, number, "invoiced" | "ready" | "pending"][] = [
  ["Project commencement", "20%", 10000, "invoiced"],
  ["Requirements and design", "20%", 10000, "invoiced"],
  ["Development completion", "30%", 15000, "ready"],
  ["Testing and acceptance", "20%", 10000, "pending"],
  ["Final implementation", "10%", 5000, "pending"],
];

/** Work done but not yet invoiced. */
const unbilled: [string, number, number][] = [
  ["ERP implementation", 120, 14400],
  ["Financial audit", 60, 6000],
  ["Website development", 45, 3600],
  ["Technical consulting", 30, 4500],
  ["Engineering services", 80, 8800],
];

/** Where the contract value goes. */
const projectCosts: [string, number, string][] = [
  ["Employee labour", 18000, CHART.blue],
  ["Subcontractors", 5000, CHART.orange],
  ["Materials & software", 3000, CHART.amber],
  ["Other project costs", 4000, CHART.purple],
];

/** The executive view. */
const dashboard: [string, string][] = [
  ["Active projects", "48"],
  ["Completed projects", "125"],
  ["Outstanding tasks", "186"],
  ["Overdue tasks", "14"],
  ["Total recorded hours", "4,800"],
  ["Billable hours", "3,850"],
  ["Billable utilisation", "80.2%"],
  ["Unbilled project work", "$37,300"],
  ["Project revenue", "$480K"],
  ["Project costs", "$295K"],
  ["Project gross profit", "$185K"],
  ["Gross profit margin", "38.5%"],
];

const attention: [string, string][] = [
  ["Project delays", "Six projects are behind their planned schedules."],
  ["Outstanding tasks", "Fourteen tasks have exceeded their due dates."],
  ["Missing timesheets", "Seven employees have incomplete weekly timesheets."],
  ["Unbilled work", "$37,300 in potential project billing requires review."],
  ["Budget overruns", "Three projects require a detailed cost variance analysis."],
];

/** From a lead to the financial statements. */
const chain: [string, string][] = [
  ["CRM & sales opportunity", "Identify potential customer engagements"],
  ["Quotation & contract", "Agree commercial scope, prices and terms"],
  ["Projects", "Create and plan the customer engagement"],
  ["My Tasks", "Assign responsibilities and perform activities"],
  ["My Timesheet", "Record actual hours and billable work"],
  ["Project costing", "Evaluate labour, expenses and resource costs"],
  ["Project billing", "Prepare invoices from eligible project work"],
  ["Accounts receivable", "Monitor customer outstanding balances"],
  ["Bank reconciliation", "Match and verify customer receipts"],
  ["Financial reporting", "Analyse revenue, costs and project profitability"],
];

/** Where projects connect. */
const integrations: [string, string][] = [
  ["CRM", "Customer acquisition and commercial opportunities"],
  ["Sales", "Quotations, contracts and customer invoicing"],
  ["Purchasing", "Project materials and subcontractor services"],
  ["Inventory", "Materials consumed during project execution"],
  ["Human resources", "Employee information and resource management"],
  ["Payroll", "Employee compensation and labour cost information"],
  ["Accounting", "Revenue, expenses and financial transactions"],
  ["Budgeting", "Project financial planning and variance analysis"],
  ["Banking", "Customer payments and project-related expenditure"],
  ["Agentic AI", "Intelligent analysis, automation and decision support"],
];

/** What you can ask her. */
const asks: [string, string][] = [
  ["Create a project for our new customer.", "Prepare a project structure and initial activities"],
  ["Break this contract into project tasks.", "Suggest tasks, milestones and responsibilities"],
  ["Show me all my outstanding tasks.", "Summarise assigned activities and deadlines"],
  ["Which employees are overloaded?", "Analyse available workload information"],
  ["Review everyone's timesheets.", "Identify missing or unusual time entries"],
  ["Calculate our billable hours this month.", "Summarise eligible customer-related working hours"],
  ["Which projects are exceeding their budgets?", "Compare actual costs against planned costs"],
  ["Prepare invoices for all unbilled work.", "Generate proposed invoices for review"],
  ["Which projects are most profitable?", "Analyse project revenue and associated costs"],
  ["Prepare our monthly project report.", "Consolidate operational and financial performance"],
];

/** The controls. */
const controls: [string, string][] = [
  ["Project authorisation", "Prevent unauthorised project commencement"],
  ["Defined project scope", "Avoid uncontrolled additional work"],
  ["Task assignment", "Establish individual accountability"],
  ["Deadline monitoring", "Reduce project delivery delays"],
  ["Timesheet validation", "Ensure accurate recording of working hours"],
  ["Timesheet approval", "Prevent unauthorised or inaccurate time claims"],
  ["Billable classification", "Distinguish chargeable and internal work"],
  ["Billing rate validation", "Protect agreed commercial terms"],
  ["Budget monitoring", "Identify excessive resource consumption"],
  ["Duplicate billing checks", "Prevent invoicing the same work twice"],
  ["Invoice approval", "Prevent unauthorised customer charges"],
  ["Project cost reconciliation", "Ensure accurate financial reporting"],
  ["Revenue recognition", "Maintain appropriate accounting treatment"],
  ["User permissions", "Protect confidential project information"],
  ["AI approval controls", "Retain human oversight of significant actions"],
  ["Audit trail", "Establish accountability and transaction history"],
];

export default function ProjectsPage() {
  const labourTotal = labourCost.reduce((a, [, , , cost]) => a + cost, 0);
  const labourHours = labourCost.reduce((a, [, hours]) => a + hours, 0);
  const billableTotal = billableWork.reduce((a, [, , , amount]) => a + amount, 0);
  const unbilledHours = unbilled.reduce((a, [, hours]) => a + hours, 0);
  const unbilledValue = unbilled.reduce((a, [, , value]) => a + value, 0);

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
              Every hour has a cost. <Serif className="text-[32px] sm:text-[40px]">Every project should create value.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              Four functions covering project planning, task management, employee time tracking and project-based
              invoicing — so the work your people do, the hours they record and the invoices your customers receive
              are the same information, not three separate systems.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              Plan, assign, execute, track, bill, analyse.
            </p>
          </div>
        </Container>
      </section>

      {/* the four functions */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Project planning & execution" />

            <Fn id="projects" title="Projects — the whole engagement in one record">
              <P>
                A structured collection of activities, resources, responsibilities and deliverables organised to
                achieve a business objective within a defined timeframe and budget — for an external customer or for
                the organisation itself.
              </P>
              <Photos photos={projectPhotos} />
              <DataTable head={["Type of project", "What it covers"]} rows={projectTypes.map((t) => [...t])} />
              <Caption>Creation to completion</Caption>
              <Flow steps={projectLifecycle.slice(0, 3)} />
              <Flow steps={projectLifecycle.slice(3, 6)} />
              <Flow steps={projectLifecycle.slice(6)} />
              <Caption>What the project record holds</Caption>
              <DataTable head={["Field", "Business purpose"]} rows={projectFields.map((f) => [...f])} />
              <Caption>Example — a software implementation</Caption>
              <div className="mt-3 overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-lp-line px-5 py-4">
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">
                      Business ERP Implementation
                    </p>
                    <p className="mt-0.5 text-[13px] text-lp-muted">PRJ-2026-00125 · ABC Retail Group</p>
                  </div>
                  <Status kind="doing">In progress</Status>
                </div>
                <div className="grid gap-2.5 px-5 py-4 sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    ["Contract value", "$50,000"],
                    ["Cost budget", "$30,000"],
                    ["Estimated hours", "500 hrs"],
                    ["Actual hours", "320 hrs"],
                    ["Assigned employees", "8"],
                    ["Tasks completed", "28 / 40"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                      <p className="mt-0.5 text-[16px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="border-t border-lp-line px-5 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Milestones</p>
                  <ul className="mt-3 space-y-2.5">
                    {milestones.map(([name, pct]) => (
                      <li key={name} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5">
                        <span className="text-[13.5px] text-lp-body">{name}</span>
                        <span className="text-[13px] font-semibold tabular-nums text-lp-ink">{pct}%</span>
                        <span className="col-span-2 h-1.5 overflow-hidden rounded-full bg-lp-alt">
                          <span
                            className="block h-full rounded-full bg-lp-brand"
                            style={{ width: `${Math.max(pct, 1.5)}%` }}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <Warning>
                Task completion counts completed tasks. It is not the same as the percentage of contractual work
                actually delivered, and the two can drift a long way apart.
              </Warning>
              <AiNote>
                {AI} can help plan the project, analyse progress, identify delays, compare estimated against actual
                hours, highlight budget overruns and recommend better resource allocation.
              </AiNote>
            </Fn>

            <Fn id="tasks" title="My Tasks — one list of everything you owe">
              <P>
                A task is a specific activity or deliverable assigned to someone as part of a larger project. My Tasks
                gathers every task assigned to an employee across every project into one personal workspace, instead
                of making them open each project to find out what they owe.
              </P>
              <DataTable head={["Information", "Purpose"]} rows={taskFields.map((f) => [...f])} />
              <Caption>Example — one employee&rsquo;s list</Caption>
              <Figures
                items={[
                  ["Assigned", "24"],
                  ["Completed", "12"],
                  ["In progress", "8"],
                  ["Overdue", "4"],
                ]}
              />
              <ul className="mt-2.5 space-y-2">
                {myTasks.map(([name, where, label, kind]) => (
                  <li
                    key={name}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-xl border border-lp-line bg-lp-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium tracking-[-0.02em] text-lp-ink">{name}</p>
                      <p className="mt-0.5 text-[12.5px] text-lp-muted">{where}</p>
                    </div>
                    <Status kind={kind}>{label}</Status>
                  </li>
                ))}
              </ul>
              <Caption>How a task moves</Caption>
              <Flow steps={taskFlow} />
              <P>
                That sequence is what creates accountability: who is responsible for each activity, when it is due,
                and how much time has actually gone into it.
              </P>
              <AiNote>
                She can analyse workloads, prioritise upcoming deadlines, identify overdue tasks, recommend a daily
                work schedule and summarise what is outstanding.
              </AiNote>
            </Fn>

            <PartHeading title="Employee time & resource management" />

            <Fn id="timesheet" title="My Timesheet — the week, hour by hour">
              <P>
                A structured record of the time someone spends on specific projects and tasks, entered on a weekly
                grid. Tab moves between cells, so a week goes in quickly without a separate form for every activity.
              </P>
              <Photos photos={timesheetPhotos} />
              <Caption>Recording time</Caption>
              <Flow steps={timesheetLifecycle} />
              <Caption>Example — week of 16–20 November 2026</Caption>
              <WeekGrid />
              <Figures
                items={[
                  ["Total recorded", "40 hrs"],
                  ["Billable", "35 hrs"],
                  ["Non-billable", "5 hrs"],
                  ["Potential billing value", "$3,800.00"],
                ]}
              />
              <Caption>Which hours a customer pays for</Caption>
              <DataTable
                head={["Billable activities", "Non-billable activities"]}
                rows={billableSplit.map((b) => [...b])}
              />
              <P>
                Both kinds matter. Billable hours become potential revenue; non-billable hours are how management
                understands what it actually costs to run the organisation.
              </P>
              <Caption>Utilisation</Caption>
              <Formula>Billable utilisation = billable hours ÷ total recorded hours × 100</Formula>
              <UtilisationBar />
              <Warning>
                Utilisation should be read alongside work quality, an employee&rsquo;s responsibilities and project
                outcomes — never on its own as a measure of someone&rsquo;s performance.
              </Warning>
              <Caption>Project labour costing</Caption>
              <P small>The same hours give the labour cost of the project itself.</P>
              <DataTable
                head={["Employee", "Project hours", "Internal cost rate", "Project labour cost"]}
                rows={[
                  ...labourCost.map(([role, hours, rate, cost]) => [
                    role,
                    String(hours),
                    `$${rate}`,
                    `$${cost.toLocaleString("en-US")}`,
                  ]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="h" className="font-semibold text-lp-ink">{labourHours}</b>,
                    "",
                    <b key="c" className="font-semibold text-lp-ink">${labourTotal.toLocaleString("en-US")}</b>,
                  ],
                ]}
              />
              <Warning>
                The internal cost rate is not the customer billing rate. Someone may cost the business $50 an hour
                while their work is billed at $120. And recording time does not by itself create a ledger entry —
                that depends on how payroll, project costing and accounting are configured.
              </Warning>
              <AiNote>
                {AI} can find missing timesheets, detect unusual entries, analyse project labour costs, highlight
                excessive non-billable time and compare actual hours against what the project estimated.
              </AiNote>
            </Fn>

            <PartHeading title="Project revenue & financial management" />

            <Fn id="billing" title="Project billing — work performed becomes an invoice">
              <P>
                Generating customer invoices from eligible billable work performed against a project, so there is a
                direct line between what was delivered and what was charged.
              </P>
              <Flow steps={billingFlow} />
              <Caption>Common arrangements</Caption>
              <DataTable head={["Billing method", "Explanation"]} rows={billingMethods.map((m) => [...m])} />

              <Caption>Time-based billing — a month of consulting</Caption>
              <DataTable
                head={["Service", "Billable hours", "Customer rate", "Amount"]}
                rows={[
                  ...billableWork.map(([name, hours, rate, amount]) => [
                    name,
                    String(hours),
                    `$${rate}`,
                    `$${amount.toLocaleString("en-US")}`,
                  ]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="h" className="font-semibold text-lp-ink">200</b>,
                    "",
                    <b key="a" className="font-semibold text-lp-ink">${billableTotal.toLocaleString("en-US")}</b>,
                  ],
                ]}
              />
              <Caption>The invoice that comes out</Caption>
              <div className="mt-3 overflow-hidden rounded-xl border border-lp-line bg-lp-card">
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-lp-line px-5 py-4">
                  <div>
                    <p className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">INV-2026-00450</p>
                    <p className="mt-0.5 text-[13px] text-lp-muted">
                      ABC Retail Group · ERP Implementation · PRJ-2026-00125
                    </p>
                  </div>
                  <p className="text-[13px] text-lp-muted">November 2026 · 30 days</p>
                </div>
                <ul className="divide-y divide-lp-line px-5">
                  {billableWork.map(([name, hours, , amount]) => (
                    <li key={name} className="flex justify-between gap-4 py-2.5 text-[13.5px]">
                      <span className="text-lp-body">
                        {name} — {hours} hrs
                      </span>
                      <span className="tabular-nums text-lp-ink">${amount.toLocaleString("en-US")}</span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-lp-line px-5 py-3 text-[13.5px]">
                  <p className="flex justify-between gap-4">
                    <span className="text-lp-body">Subtotal</span>
                    <span className="tabular-nums text-lp-ink">$22,200</span>
                  </p>
                  <p className="mt-1 flex justify-between gap-4">
                    <span className="text-lp-body">HST (illustrative 13%)</span>
                    <span className="tabular-nums text-lp-ink">$2,886</span>
                  </p>
                </div>
                <div className="flex items-baseline justify-between border-t border-lp-line bg-lp-brand/6 px-5 py-3.5">
                  <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-lp-brand">
                    Total invoice amount
                  </span>
                  <span className="text-[20px] font-semibold tracking-[-0.03em] text-lp-ink">$25,086</span>
                </div>
              </div>
              <Note>200 billable hours, prepared from eligible project work.</Note>

              <Caption>Milestone billing — a $50,000 contract</Caption>
              <ul className="mt-3 space-y-2">
                {contractMilestones.map(([name, share, amount, state]) => (
                  <li
                    key={name}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 rounded-xl border border-lp-line bg-lp-card px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium tracking-[-0.02em] text-lp-ink">{name}</p>
                      <p className="mt-0.5 text-[12.5px] text-lp-muted">{share} of the contract</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Status kind={state === "invoiced" ? "done" : state === "ready" ? "doing" : "todo"}>
                        {state === "invoiced" ? "Invoiced" : state === "ready" ? "Ready for review" : "Pending"}
                      </Status>
                      <span className="w-20 text-right text-[15px] font-semibold tabular-nums text-lp-ink">
                        ${amount.toLocaleString("en-US")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
              <Figures
                items={[
                  ["Invoiced", "$20,000"],
                  ["Ready for review", "$15,000"],
                  ["Pending", "$15,000"],
                ]}
              />

              <Caption>Unbilled work — where revenue leaks</Caption>
              <P small>
                Eligible services performed but not yet on any invoice: forgotten timesheets, missed billing runs,
                incomplete invoicing.
              </P>
              <DataTable
                head={["Project", "Unbilled hours", "Potential billing value"]}
                rows={[
                  ...unbilled.map(([name, hours, value]) => [
                    name,
                    String(hours),
                    `$${value.toLocaleString("en-US")}`,
                  ]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="h" className="font-semibold text-lp-ink">{unbilledHours}</b>,
                    <b key="v" className="font-semibold text-lp-ink">${unbilledValue.toLocaleString("en-US")}</b>,
                  ],
                ]}
              />
              <Warning>
                Unbilled work should be checked against the contract, the authorised rates and what has already been
                invoiced, so the same hours are never charged twice.
              </Warning>

              <Caption>What posting the invoice does</Caption>
              <Ledger
                rows={[
                  ["Accounts receivable", "$25,086", "—"],
                  ["Professional service revenue", "—", "$22,200"],
                  ["HST payable", "—", "$2,886"],
                ]}
              />
              <Caption>And when the customer pays</Caption>
              <Ledger
                rows={[
                  ["Bank account", "$25,086", "—"],
                  ["Accounts receivable", "—", "$25,086"],
                ]}
              />
              <Warning>
                This assumes the revenue recognition requirements are satisfied. Where the project has already
                recognised unbilled revenue, the invoice clears the contract asset instead — and billing in advance
                may need deferred revenue treatment.
              </Warning>
              <AiNote>
                {AI} can identify unbilled activities, calculate what they are worth, detect duplicate billing risk,
                prepare invoice drafts and highlight outstanding customer payments.
              </AiNote>
            </Fn>
          </div>
        </Container>
      </section>

      {/* profitability */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Project costing &amp; profitability</Kicker>
          <H2>Revenue is not the same thing as profit.</H2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.65] text-lp-body">
            A project with impressive revenue is not necessarily a profitable one, if employee hours, subcontractors
            and operating costs quietly consume it. Integrating project management with accounting is what makes the
            real answer visible.
          </p>
          <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <Caption>Where a $50,000 contract goes</Caption>
              <CostBar />
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
                {[
                  ["Project revenue", "$50,000"],
                  ["Total project costs", "$30,000"],
                  ["Gross profit", "$20,000"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[18px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-[13.5px] text-lp-body">A 40% gross profit margin — if the plan holds.</p>
            </div>
            <div>
              <Caption>What overrunning the hours costs</Caption>
              <p className="mt-3 text-[14.5px] leading-[1.65] text-lp-body">
                The same project, planned at 500 hours, ends up consuming 750 at an internal cost of $36 an hour.
                Nothing about the contract changes.
              </p>
              <div className="mt-4 space-y-2">
                {[
                  ["Planned hours", "500 hrs", false],
                  ["Actual hours", "750 hrs", false],
                  ["Additional labour cost", "$9,000", false],
                  ["Original gross profit", "$20,000", false],
                  ["Revised gross profit", "$11,000", true],
                ].map(([label, value, strong]) => (
                  <div
                    key={label as string}
                    className={cn(
                      "flex items-baseline justify-between gap-4 rounded-xl border px-4 py-3",
                      strong ? "border-needs-human/30 bg-needs-human/8" : "border-lp-line bg-lp-card",
                    )}
                  >
                    <span className="text-[13.5px] text-lp-body">{label}</span>
                    <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">{value}</span>
                  </div>
                ))}
              </div>
              <Note>
                Simplified: it assumes the full contract revenue is earned, and excludes corporate overheads and
                taxes. It is why planning and timesheet discipline are financial controls, not admin.
              </Note>
            </div>
          </div>
        </Container>
      </section>

      {/* dashboard */}
      <section>
        <Container className="py-16">
          <Kicker>Project intelligence</Kicker>
          <H2>Every active project, in one monthly view.</H2>
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
              {attention.map(([label, text]) => (
                <li key={label} className="flex gap-2">
                  <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-needs-human" strokeWidth={2} />
                  <span>
                    <b className="font-medium text-lp-ink">{label}: </b>
                    {text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <Kicker>Contract to financial statements</Kicker>
              <h3 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink">
                One continuous chain.
              </h3>
              <ol className="mt-5 space-y-2">
                {chain.map(([step, text]) => (
                  <li key={step} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{step}</p>
                    <p className="mt-0.5 text-[12.5px] text-lp-muted">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
            <div>
              <Kicker>One project, many modules</Kicker>
              <h3 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink">
                Where projects touch the rest.
              </h3>
              <DataTable head={["Module", "Relationship"]} rows={integrations.map((i) => [...i])} />
            </div>
          </div>
        </Container>
      </section>

      {/* agentic AI */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>Agentic AI across all four functions</Kicker>
          <H2>
            You deliver the work. <Serif className="text-[32px] sm:text-[40px]">She manages the process.</Serif>
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

          <Caption>Example — Monday morning with the managing director</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Managing director</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  Good morning, {AI}. Review all our active projects, check overdue tasks, identify missing
                  timesheets, calculate our unbilled hours and prepare customer invoices for completed work. And tell
                  me which projects are exceeding their budgets.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <p className="mt-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                Good morning. I have reviewed your project records and prepared the weekly management report.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {[
                  ["Projects reviewed", "48"],
                  ["Unbilled hours", "335"],
                  ["Potential billing", "$37,300"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-lp-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{k}</p>
                    <p className="text-[15px] font-semibold text-lp-ink">{v}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "186 outstanding tasks analysed, 14 of them overdue",
                  "Seven incomplete employee timesheets identified",
                  "12 draft customer invoices prepared",
                  "Three projects exceeding their cost budgets",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Four things need your approval: releasing the 12 invoices, the timesheet reminders, the proposed task
                reassignments and the corrective actions on those three projects.{" "}
                <b className="font-semibold text-lp-ink">
                  Nothing has been released to a customer without you.
                </b>
              </p>
            </div>
          </div>
          <Note>Illustrative workflow, subject to implemented capabilities, data access and configured permissions.</Note>
        </Container>
      </section>

      {/* controls + philosophy */}
      <section>
        <Container className="py-16">
          <Kicker>Project management controls</Kicker>
          <H2>Unauthorised work, inaccurate hours, revenue that leaks.</H2>
          <div className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {controls.map(([control, purpose]) => (
              <div key={control} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{control}</p>
                <p className="mt-1 text-[12.5px] leading-[1.5] text-lp-muted">{purpose}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {philosophyPhotos.map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-alt">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} project philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              Every hour has a cost. Every task has a purpose. Every project should create value.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              An unrecorded hour is lost revenue. An overdue task is a delay forming. An unbilled service is cash
              arriving late. An uncontrolled cost is margin disappearing. None of them announce themselves.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-lp-body">
              A business does not need to double its workforce to double the value of what it delivers. It needs
              better planning, honest time records, intelligent billing and resources used well. The value of a
              project manager was never in updating spreadsheets.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — from working hours to{" "}
              <span className="text-lp-brand">financial success.</span>
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

function Status({
  kind,
  children,
}: {
  kind: "late" | "high" | "doing" | "todo" | "done";
  children: ReactNode;
}) {
  const tone = {
    late: "bg-needs-human/12 text-needs-human",
    high: "bg-[#ED8A5B]/15 text-[#B5602F]",
    doing: "bg-lp-brand/10 text-lp-brand",
    todo: "bg-lp-ink/8 text-lp-muted",
    done: "bg-ai-done/12 text-ai-done",
  }[kind];
  return (
    <span className={cn("inline-block shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.1em]", tone)}>
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

/** The weekly grid, as the timesheet shows it. */
function WeekGrid() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-lp-line">
      <table className="w-full min-w-[32rem] border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="bg-lp-alt">
            <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-lp-muted">
              Project / task
            </th>
            {days.map((d) => (
              <th
                key={d}
                className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-lp-muted"
              >
                {d}
              </th>
            ))}
            <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-lp-muted">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {week.map(([project, task, hours, total]) => (
            <tr key={project} className="border-t border-lp-line">
              <td className="px-4 py-2.5 align-top">
                <span className="block font-medium text-lp-ink">{project}</span>
                <span className="block text-[12.5px] text-lp-muted">{task}</span>
              </td>
              {hours.map((h, i) => (
                <td key={i} className="px-3 py-2.5 text-right tabular-nums text-lp-body">
                  {h}
                </td>
              ))}
              <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-lp-ink">{total}</td>
            </tr>
          ))}
          <tr className="border-t border-lp-line bg-lp-alt">
            <td className="px-4 py-2.5 font-semibold text-lp-ink">Total</td>
            {days.map((d) => (
              <td key={d} className="px-3 py-2.5 text-right font-semibold tabular-nums text-lp-ink">
                8
              </td>
            ))}
            <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-lp-ink">40</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** 35 billable hours against 5 non-billable. */
function UtilisationBar() {
  const parts: [string, number, string][] = [
    ["Billable work", 35, CHART.green],
    ["Non-billable work", 5, CHART.blue],
  ];
  return (
    <div className="mt-4">
      <div className="flex h-7 overflow-hidden rounded-lg">
        {parts.map(([label, value, colour]) => (
          <div key={label} style={{ width: `${(value / 40) * 100}%`, backgroundColor: colour }} title={label} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
        {parts.map(([label, value, colour]) => (
          <li key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} />
            <span className="text-lp-body">{label}</span>
            <span className="font-semibold tabular-nums text-lp-ink">{value} hrs</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12.5px] text-lp-muted">40 recorded hours · 87.5% billable utilisation.</p>
    </div>
  );
}

/** Where the contract value goes. */
function CostBar() {
  const revenue = 50000;
  const profit = 20000;
  return (
    <div className="mt-4">
      <div className="flex h-7 overflow-hidden rounded-lg">
        {projectCosts.map(([label, value, colour]) => (
          <div key={label} style={{ width: `${(value / revenue) * 100}%`, backgroundColor: colour }} title={label} />
        ))}
        <div style={{ width: `${(profit / revenue) * 100}%` }} className="bg-ai-done" title="Gross profit" />
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
        {[...projectCosts, ["Gross profit", profit, "var(--color-ai-done)"] as [string, number, string]].map(
          ([label, value, colour]) => (
            <li key={label} className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} />
              <span className="flex-1 text-lp-body">{label}</span>
              <span className="font-semibold tabular-nums text-lp-ink">${value.toLocaleString("en-US")}</span>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
