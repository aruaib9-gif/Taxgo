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
  Note,
  P,
  PartHeading,
} from "@/components/landing/guide";
import { cn } from "@/lib/utils";

const AI = BRAND.fullName;

export const metadata = {
  title: `HR module`, // the root layout appends "· Tax GO"
  description: `The ${AI} human resources module in full: 21 functions across workforce planning, employee records, compensation, leave and attendance, recruitment, performance, documentation and organisational structure.`,
};

const CHART = {
  blue: "#4285F4",
  green: "#5CB85C",
  orange: "#ED8A5B",
  amber: "#F2CE5C",
  purple: "#A78BE8",
} as const;

type Photo = [src: string, alt: string];

const employeePhotos: Photo[] = [
  ["/hr/employees-1.jpg", "An HR manager reviewing employee performance data"],
  ["/hr/employees-2.jpg", "An HR manager going through candidate profiles"],
  ["/hr/employees-3.jpg", "A team working together in an office"],
];

const attendancePhotos: Photo[] = [
  ["/hr/attendance-1.jpg", "A biometric time clock at an entrance"],
  ["/hr/attendance-2.jpg", "An attendance register on screen"],
  ["/hr/attendance-3.jpg", "An HR system showing daily attendance"],
];

const recruitPhotos: Photo[] = [
  ["/hr/recruit-1.jpg", "A recruitment consultation in progress"],
  ["/hr/recruit-2.jpg", "A manager interviewing a candidate"],
  ["/hr/recruit-3.jpg", "A job interview at a modern office"],
];

/** The dashboard's twelve figures. */
const dashboard: [string, string][] = [
  ["Total employees", "250"],
  ["Active employees", "242"],
  ["New hires this year", "32"],
  ["Employee departures", "18"],
  ["On leave today", "12"],
  ["Attendance rate today", "93%"],
  ["Vacant positions", "16"],
  ["Active recruitment", "8"],
  ["Pending leave requests", "14"],
  ["Pending timesheets", "21"],
  ["Expiring documents", "7"],
  ["Annual basic salary budget", "$12.5M"],
];

const attention: string[] = [
  "Seven employee documents approaching expiry",
  "Fourteen leave requests to review",
  "Twenty-one timesheets awaiting approval",
  "Sixteen established positions still vacant",
];

/** The category tree. */
const categoryTree: [string, string[]][] = [
  ["100 — Permanent employees", ["110 — Executive management", "120 — Senior management", "130 — Professional staff", "140 — Administrative staff"]],
  ["200 — Contract employees", ["210 — Fixed-term employees", "220 — Project-based employees"]],
  ["300 — Temporary employees", ["310 — Seasonal employees", "320 — Agency workers"]],
  ["400 — Trainees", ["410 — Interns", "420 — Apprentices"]],
];

/** Job titles and their default grades. */
const designations: [string, string, string][] = [
  ["DES-001", "Chief Executive Officer", "G10"],
  ["DES-002", "Chief Financial Officer", "G9"],
  ["DES-003", "Finance Director", "G8"],
  ["DES-004", "Finance Manager", "G7"],
  ["DES-005", "Senior Accountant", "G6"],
  ["DES-006", "Financial Analyst", "G5"],
  ["DES-007", "Accounts Assistant", "G3"],
  ["DES-008", "Graduate Trainee", "G1"],
];

/** The salary structure. */
const bands: [string, string, string, string][] = [
  ["G1", "$30,000", "$35,000", "$40,000"],
  ["G2", "$35,000", "$42,500", "$50,000"],
  ["G3", "$45,000", "$55,000", "$65,000"],
  ["G4", "$55,000", "$67,500", "$80,000"],
  ["G5", "$70,000", "$85,000", "$100,000"],
  ["G6", "$85,000", "$100,000", "$115,000"],
  ["G7", "$100,000", "$125,000", "$150,000"],
  ["G8", "$130,000", "$165,000", "$200,000"],
  ["G9", "$180,000", "$240,000", "$300,000"],
  ["G10", "$250,000", "$350,000", "$450,000"],
];

/** This year's merit cycle. */
const merit: [string, number, string, number][] = [
  ["John", 80000, "5%", 84000],
  ["Sarah", 85000, "6%", 90100],
  ["David", 60000, "4%", 62400],
  ["Mary", 100000, "7%", 107000],
  ["James", 50000, "3%", 51500],
];

/** Leave types and what they cover. */
const leaveTypes: [string, string][] = [
  ["Annual leave", "Employee holidays"],
  ["Sick leave", "Illness and medical absence"],
  ["Maternity leave", "Maternity-related absence"],
  ["Paternity leave", "Paternity-related absence"],
  ["Parental leave", "Childcare entitlement"],
  ["Compassionate leave", "Bereavement and family circumstances"],
  ["Study leave", "Professional or educational development"],
  ["Unpaid leave", "Authorised absence without pay"],
  ["Other statutory leave", "Country-specific entitlements"],
];

/** One employee's balances. */
const balances: [string, number, number][] = [
  ["Annual leave", 14, 25],
  ["Sick leave", 8, 10],
  ["Study leave", 4, 5],
  ["Personal leave", 2, 3],
];

/** The shift templates. */
const shifts: [string, string, string, string, string][] = [
  ["Morning", "06:00", "14:00", "30 min", "7.5"],
  ["Afternoon", "14:00", "22:00", "30 min", "7.5"],
  ["Night", "22:00", "06:00", "30 min", "7.5"],
  ["Office", "09:00", "17:00", "30 min", "7.5"],
  ["Part-time", "09:00", "13:00", "—", "4"],
];

/** A week on the roster. */
const roster: [string, string[]][] = [
  ["John", ["M", "M", "M", "M", "M", "–", "–"]],
  ["Sarah", ["A", "A", "A", "–", "–", "M", "M"]],
  ["David", ["N", "N", "–", "–", "N", "N", "N"]],
  ["Mary", ["O", "O", "O", "O", "O", "–", "–"]],
  ["James", ["–", "M", "M", "M", "A", "A", "–"]],
];

/** The recruitment funnel. */
const funnel: [string, number][] = [
  ["Applications received", 120],
  ["Candidates screened", 65],
  ["Shortlisted", 25],
  ["First interviews", 12],
  ["Final interviews", 5],
  ["Offers issued", 2],
  ["Offers accepted", 1],
];

/** Onboarding and offboarding checklists. */
const onboarding = [
  "Accepted employment offer",
  "Employment contract",
  "Employee record",
  "Payroll registration",
  "Banking information",
  "Identity documentation",
  "Equipment allocation",
  "System access",
  "Policy acknowledgment",
  "Induction and training",
];

const offboarding = [
  "Confirm departure date",
  "Exit interview",
  "Knowledge handover",
  "Reassign outstanding tasks",
  "Return company equipment",
  "Revoke system access",
  "Review leave balances",
  "Calculate final pay",
  "Issue required documents",
  "Archive employee record",
];

/** Goals, and how they went. */
const goals: [string, string, string, string, number][] = [
  ["Monthly financial reporting", "By 5th working day", "5th working day", "25%", 100],
  ["Budget variance reporting", "100% completed", "100%", "20%", 100],
  ["Account reconciliations", "100% completed", "98%", "20%", 98],
  ["Process improvement", "4 improvements", "5 improvements", "20%", 125],
  ["Professional development", "40 training hours", "32 hours", "15%", 80],
];

/** The policy library. */
const policies: [string, string, string][] = [
  ["Employee handbook", "3.0", "General employment guidelines"],
  ["Code of conduct", "2.0", "Professional behaviour"],
  ["Information security", "4.0", "Protect company information"],
  ["Remote working", "2.0", "Remote and hybrid arrangements"],
  ["Health and safety", "3.0", "Workplace safety"],
  ["Travel and expenses", "2.0", "Business expenditure controls"],
  ["Leave policy", "3.0", "Leave administration"],
  ["AI acceptable use", "1.0", "Responsible use of artificial intelligence"],
  ["Data protection", "4.0", "Personal information management"],
  ["Anti-harassment", "2.0", "Respectful workplace standards"],
];

/** Holiday calendars by country. */
const countries: { country: string; note: string; src: string; alt: string }[] = [
  { country: "Canada", note: "Federal or provincial calendar, as applicable", src: "/hr/country-canada.jpg", alt: "A street in Ottawa" },
  { country: "Ireland", note: "Irish public holidays", src: "/hr/country-ireland.jpg", alt: "An aerial view of Ireland" },
  { country: "Nigeria", note: "National and local holidays", src: "/hr/country-nigeria.jpg", alt: "A development in Lagos" },
  { country: "India", note: "National and state-specific calendars", src: "/hr/country-india.jpg", alt: "The Mumbai skyline" },
];

/** The reporting hierarchy, as data. */
const hierarchy: [string, string, string][] = [
  ["EMP-001", "CEO", "—"],
  ["EMP-002", "Finance Director", "EMP-001"],
  ["EMP-003", "Operations Director", "EMP-001"],
  ["EMP-004", "Commercial Director", "EMP-001"],
  ["EMP-005", "HR Director", "EMP-001"],
  ["EMP-006", "Finance Manager", "EMP-002"],
  ["EMP-007", "Accountant", "EMP-006"],
];

/** The employee lifecycle, end to end. */
const lifecycle: [string, string][] = [
  ["Organisational planning", "Categories, designations, positions, compensation bands"],
  ["Recruitment", "Requisitions, candidates, interviews, offers"],
  ["Onboarding", "Records, documents and policy acknowledgment"],
  ["Employee management", "Team relationships and structure"],
  ["Daily operations", "Leave, attendance, shifts, timesheets"],
  ["Performance", "Goals, development and reviews"],
  ["Compensation", "Merit cycles and approved increases"],
  ["Compliance", "Document renewals, policies, settings"],
  ["Offboarding", "Departure, handover and final administration"],
];

/** What HR touches elsewhere. */
const integrations: [string, string][] = [
  ["Payroll", "Salaries, authorised changes and earnings"],
  ["Accounting", "Salary expenditure, liabilities and benefits"],
  ["Budgeting", "Workforce budgets and recruitment costs"],
  ["Projects", "Assignments and project labour costing"],
  ["Project billing", "Approved billable hours"],
  ["Manufacturing", "Work centre resources and labour costs"],
  ["Sales", "Sales personnel and commission information"],
  ["Banking", "Salary payments and reimbursements"],
  ["Loan management", "Employee loans and repayments"],
  ["Procurement", "Equipment and workplace resources"],
  ["AI agents", "Workforce analysis and authorised automation"],
];

/** What you can ask her, function by function. */
const asks: [string, string][] = [
  ["HR dashboard", "Give me a summary of our workforce today."],
  ["Employees", "Identify employees with incomplete records."],
  ["Employee categories", "Show our workforce by employment category."],
  ["Designations", "Review job titles and default pay grades."],
  ["Positions", "Show all vacant positions across the company."],
  ["Compensation bands", "Identify salaries outside approved bands."],
  ["Merit cycles", "Calculate the cost of a proposed 5% increase."],
  ["Leave management", "Show overlapping leave requests for next month."],
  ["Attendance", "Identify missing check-ins and check-outs."],
  ["Shift planning", "Review next week's roster for staffing shortages."],
  ["Timesheet approvals", "Show outstanding and unusual submitted hours."],
  ["My team", "Summarise my team's outstanding approvals."],
  ["Recruitment", "Prepare a recruitment pipeline report."],
  ["Onboarding & offboarding", "Show incomplete lifecycle activities."],
  ["Performance management", "Summarise progress against departmental goals."],
  ["Performance reviews", "Consolidate completed employee feedback."],
  ["Documents vault", "Which work permits expire within 30 days?"],
  ["Policy library", "Who has not acknowledged the latest policies?"],
  ["Holiday calendars", "Identify upcoming holidays across our locations."],
  ["Organisation chart", "Show missing reporting manager assignments."],
  ["HR settings", "Review our working-week and timezone configuration."],
];

const controls: [string, string][] = [
  ["Employee record validation", "Maintain reliable workforce information"],
  ["Company-scoped access", "Prevent cross-company data access"],
  ["Position authorisation", "Control organisational headcount"],
  ["Pay-grade validation", "Keep compensation structures consistent"],
  ["Merit cycle approval", "Prevent unauthorised salary changes"],
  ["Leave approval", "Control absence administration"],
  ["Attendance validation", "Keep working-hour records accurate"],
  ["Shift roster management", "Maintain sufficient coverage"],
  ["Timesheet approval", "Protect project costing and billing"],
  ["Recruitment authorisation", "Control workforce expansion"],
  ["Onboarding checklist", "Ensure employment requirements are met"],
  ["Offboarding checklist", "Protect company assets and information"],
  ["Performance review controls", "Support consistent, fair assessment"],
  ["Document expiry monitoring", "Reduce employment compliance risk"],
  ["Employee document access", "Protect confidential personal information"],
  ["Policy version control", "Keep corporate policies current"],
  ["Policy acknowledgment", "Establish version-specific accountability"],
  ["Reporting hierarchy", "Define management responsibilities"],
  ["HR settings validation", "Keep workforce calculations accurate"],
  ["AI permission controls", "Prevent unauthorised automated HR actions"],
  ["Audit trail", "Establish accountability and traceability"],
];

export default function HrPage() {
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
              From recruitment. <Serif className="text-[32px] sm:text-[40px]">To retirement.</Serif>
            </H2>
            <p className="mt-4 max-w-3xl text-[16px] leading-[1.65] text-lp-body">
              The HR module runs the whole employee lifecycle — hiring and onboarding, structure and compensation,
              leave, attendance and shifts, performance and development, documentation and departure. Managing people
              is not just keeping records and paying salaries; it is understanding structure, capacity and how the
              organisation actually works.
            </p>
            <p className="mt-3 max-w-3xl text-[16px] font-medium leading-[1.65] text-lp-ink">
              And because HR, payroll, projects and accounting sit in one place, the cost of every decision is visible
              where it lands.
            </p>
          </div>
        </Container>
      </section>

      {/* the 21 functions */}
      <section className="border-t border-lp-line">
        <Container className="pb-20 pt-14">
          <div className="mx-auto max-w-4xl">
            <PartHeading title="Workforce management & organisational planning" />

            <Fn id="dashboard" title="HR dashboard — the workforce, today">
              <P>
                A live, company-scoped overview: who you have, who is available, what is being recruited, and what is
                waiting on someone — without anyone compiling it by hand.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {dashboard.map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{label}</p>
                    <p className="mt-0.5 text-[18px] font-semibold tracking-[-0.03em] text-lp-ink">{value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 rounded-xl border border-needs-human/30 bg-needs-human/6 px-5 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-needs-human">
                  Requiring attention
                </p>
                <ul className="mt-2.5 grid gap-1.5 text-[13.5px] text-lp-body sm:grid-cols-2">
                  {attention.map((a) => (
                    <li key={a} className="flex gap-2">
                      <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-needs-human" strokeWidth={2} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
              <Note>
                Company-scoped reporting matters for multinationals: each entity&rsquo;s workforce is reviewed in its
                own context.
              </Note>
              <AiNote>
                {AI} can summarise workforce performance, identify staffing shortages, analyse trends and prepare the
                recommendations.
              </AiNote>
            </Fn>

            <Fn id="employees" title="Employees — the master record">
              <P>
                The central directory: contact details, employment information, organisational relationships, pay,
                documents, leave, attendance and performance history.
              </P>
              <Photos photos={employeePhotos} />
              <Caption>Example — an employee profile</Caption>
              <div className="mt-3 rounded-xl border border-lp-line bg-lp-card px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[15px] font-semibold tracking-[-0.02em] text-lp-ink">Sarah Williams</span>
                  <span className="text-[13px] text-lp-muted">Senior Financial Analyst · EMP-2026-0045 · Finance</span>
                  <Status kind="ok">Active</Status>
                </div>
                <dl className="mt-4 grid gap-x-8 gap-y-2 text-[13.5px] sm:grid-cols-2">
                  {[
                    ["Employment type", "Full-time"],
                    ["Location", "Ottawa, Canada"],
                    ["Reporting manager", "Finance Manager"],
                    ["Pay grade", "G5"],
                    ["Start date", "15 January 2024"],
                    ["Basic annual salary", "$85,000"],
                    ["Annual leave balance", "14 days"],
                    ["Working hours", "37.5 hrs/week"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4 border-b border-lp-line pb-1.5 last:border-b-0">
                      <dt className="text-lp-muted">{k}</dt>
                      <dd className="font-medium text-lp-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <AiNote>
                She can find incomplete records, flag expiring documentation and prepare workforce summaries for
                authorised management.
              </AiNote>
            </Fn>

            <Fn id="categories" title="Employee categories — how the workforce is classified">
              <P>
                A nested category tree, each with a code and a name, for grouping people by employment arrangement
                without separate databases.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {categoryTree.map(([group, children]) => (
                  <div key={group} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                    <p className="text-[13.5px] font-semibold tracking-[-0.02em] text-lp-ink">{group}</p>
                    <ul className="mt-2 space-y-1 text-[12.5px] text-lp-muted">
                      {children.map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <AiNote>
                {AI} can analyse the distribution across categories and flag classifications that look inconsistent.
              </AiNote>
            </Fn>

            <Fn id="designations" title="Designations — job titles, and the grade behind them">
              <P>
                Standardised titles, each tied to a default pay grade — so a Finance Manager means the same thing, and
                costs the same band, wherever they sit.
              </P>
              <DataTable head={["Code", "Job title", "Default grade"]} rows={designations.map((d) => [...d])} />
              <Example>
                Finance Manager → grade G7 → the $100,000–$150,000 band → assigned to an employee or a position.
              </Example>
              <AiNote>
                She can compare titles, find inconsistent grade assignments and support an organisational review.
              </AiNote>
            </Fn>

            <Fn id="positions" title="Positions — the slot, not the person">
              <P>
                A position is an established job slot with its title, unit, grade and FTE. Unlike an employee record,
                it can exist with nobody in it — which is how capacity gets planned before anyone is hired.
              </P>
              <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                <div className="rounded-xl border border-ai-done/30 bg-ai-done/8 px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">POS-001 · Canada · 1.0 FTE</p>
                  <p className="mt-1 text-[14px] font-semibold text-lp-ink">Senior Accountant — John Smith</p>
                  <p className="text-[12.5px] text-lp-muted">Occupied</p>
                </div>
                <div className="rounded-xl border border-needs-human/30 bg-needs-human/8 px-4 py-3.5">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">POS-002 · Ireland · 1.0 FTE</p>
                  <p className="mt-1 text-[14px] font-semibold text-lp-ink">Senior Accountant — vacant</p>
                  <p className="text-[12.5px] text-lp-muted">Recruitment required</p>
                </div>
              </div>
              <Caption>What FTE means</Caption>
              <DataTable
                head={["Working arrangement", "Weekly hours", "FTE"]}
                rows={[
                  ["Full-time", "40", "1.00"],
                  ["Part-time", "20", "0.50"],
                  ["Reduced hours", "30", "0.75"],
                  ["Part-time", "10", "0.25"],
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="h" className="font-semibold text-lp-ink">100</b>,
                    <b key="f" className="font-semibold text-lp-ink">2.50</b>,
                  ],
                ]}
              />
              <Figures
                items={[
                  ["Established positions", "258"],
                  ["Occupied", "242"],
                  ["Vacant", "16"],
                  ["Occupancy", "93.8%"],
                ]}
              />
              <AiNote>
                {AI} can identify the vacancies, assess departmental capacity and estimate what proposed recruitment
                would cost.
              </AiNote>
            </Fn>

            <PartHeading title="Compensation" />

            <Fn id="bands" title="Compensation bands — the range for each grade">
              <P>
                A minimum, a midpoint and a maximum per grade, so pay stays consistent, spend stays predictable and
                anyone outside their range is visible.
              </P>
              <DataTable head={["Grade", "Minimum", "Midpoint", "Maximum"]} rows={bands.map((b) => [...b])} />
              <Caption>Compa-ratio — where someone sits in their band</Caption>
              <Formula>Compa-ratio = salary ÷ band midpoint × 100</Formula>
              <Figures
                items={[
                  ["Salary", "$76,500 · grade G5"],
                  ["Compa-ratio", "90%"],
                  ["Position in band", "21.7%"],
                ]}
              />
              <Note>Within the band, below its midpoint.</Note>
              <AiNote>
                She can find compensation exceptions, analyse how salaries are distributed and support a remuneration
                review from authorised information.
              </AiNote>
            </Fn>

            <Fn id="merit" title="Merit cycles — planning the increases">
              <P>
                A structured salary review: plan it, budget it, propose the increments, cost them, get approval, and
                finalising applies the new basic salaries to the employee records.
              </P>
              <Flow
                steps={[
                  ["Plan and budget", "Define the review period and the money available"],
                  ["Propose and cost", "Revised salaries, against the bands and the budget"],
                  ["Approve and finalise", "Authorised changes applied to future payroll"],
                ]}
              />
              <Caption>Example — an annual review</Caption>
              <MeritChart />
              <DataTable
                head={["Employee", "Current", "Increment", "Revised"]}
                rows={[
                  ...merit.map(([name, current, pct, revised]) => [
                    name,
                    `$${current.toLocaleString("en-US")}`,
                    pct,
                    `$${revised.toLocaleString("en-US")}`,
                  ]),
                  [
                    <b key="t" className="font-semibold text-lp-ink">Total</b>,
                    <b key="c" className="font-semibold text-lp-ink">$375,000</b>,
                    <b key="p" className="font-semibold text-lp-ink">5.33%</b>,
                    <b key="r" className="font-semibold text-lp-ink">$395,000</b>,
                  ],
                ]}
              />
              <Figures
                items={[
                  ["Additional annual cost", "$20,000"],
                  ["Additional monthly cost", "$1,666.67"],
                  ["Average increase", "5.33%"],
                ]}
              />
              <Warning>
                Employer contributions, benefits and payroll taxes come on top. Finalising a merit cycle is
                consequential — authorisation, effective dates and payroll-period controls matter.
              </Warning>
              <AiNote>
                {AI} can simulate proposed increases, compare them against the bands, calculate the budget impact and
                prepare the recommendation for a human to approve.
              </AiNote>
            </Fn>

            <PartHeading title="Leave, attendance & scheduling" />

            <Fn id="leave" title="Leave management — entitlements and absence">
              <P>
                Requests, approvals, balances and authorised absence, with visibility over who is actually available.
              </P>
              <DataTable head={["Leave type", "Purpose"]} rows={leaveTypes.map((l) => [...l])} />
              <Caption>Example — one employee&rsquo;s balances</Caption>
              <ul className="mt-3 space-y-2.5">
                {balances.map(([type, remaining, entitlement]) => (
                  <li key={type}>
                    <div className="flex items-baseline justify-between text-[13.5px]">
                      <span className="text-lp-body">{type}</span>
                      <span className="text-lp-muted">
                        <b className="font-semibold text-lp-ink">{remaining} days</b> of {entitlement} remaining
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-lp-alt">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${(remaining / entitlement) * 100}%`, backgroundColor: CHART.green }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <Warning>Entitlement and eligibility must follow the applicable employment law and company policy.</Warning>
              <AiNote>
                She can spot overlapping requests, analyse departmental availability and warn a manager before the
                cover runs out.
              </AiNote>
            </Fn>

            <Fn id="attendance" title="Attendance — who was in, and when">
              <P>Daily presence, check-in and check-out times, and the status behind each one.</P>
              <Photos photos={attendancePhotos} />
              <DataTable
                head={["Employee", "Check-in", "Check-out", "Net hours", "Status"]}
                rows={[
                  ["John", "09:00", "17:00", "7.5", <Status key="j" kind="ok">Present</Status>],
                  ["Sarah", "08:55", "17:00", "7.58", <Status key="s" kind="ok">Present</Status>],
                  ["David", "09:30", "17:00", "7.0", <Status key="d" kind="wait">Late</Status>],
                  ["Mary", "—", "—", "—", <Status key="m" kind="info">Annual leave</Status>],
                  ["James", "—", "—", "—", <Status key="ja" kind="no">Absent</Status>],
                  ["Grace", "09:00", "18:00", "8.5", <Status key="g" kind="ok">Present</Status>],
                ]}
              />
              <Note>Net hours assume a 30-minute unpaid break.</Note>
              <AttendanceChart />
              <Warning>
                Attendance can support payroll, but the records alone do not determine overtime entitlement or salary
                deductions.
              </Warning>
              <AiNote>
                {AI} can highlight missing check-outs, inconsistent records, recurring lateness and overtime that needs
                a decision.
              </AiNote>
            </Fn>

            <Fn id="shifts" title="Shift planning — templates and the roster">
              <P>
                Working-hour templates and a daily roster. Marking a rostered shift as attended creates the attendance
                record from the template hours — no second round of data entry.
              </P>
              <DataTable
                head={["Shift", "Start", "End", "Unpaid break", "Net hours"]}
                rows={shifts.map((s) => [...s])}
              />
              <Caption>A week on the roster</Caption>
              <div className="mt-3 overflow-x-auto rounded-xl border border-lp-line">
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="bg-lp-alt">
                      <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-lp-muted">
                        Employee
                      </th>
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                        <th key={d} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.1em] text-lp-muted">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map(([name, days]) => (
                      <tr key={name} className="border-t border-lp-line">
                        <td className="px-4 py-2 text-lp-body">{name}</td>
                        {days.map((d, i) => (
                          <td key={i} className="px-3 py-2 text-center">
                            <span
                              className={cn(
                                "inline-block min-w-6 rounded-md px-1.5 py-0.5 text-[12px] font-semibold",
                                d === "–" ? "text-lp-muted/50" : "text-lp-ink",
                                d === "M" && "bg-lp-brand/15",
                                d === "A" && "bg-amber-400/20",
                                d === "N" && "bg-needs-human/15",
                                d === "O" && "bg-lp-alt",
                              )}
                            >
                              {d}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Note>M morning · A afternoon · N night · O office · – off duty.</Note>
              <AiNote>
                She can analyse coverage, find scheduling conflicts and flag understaffing or hours running too long.
              </AiNote>
            </Fn>

            <Fn id="timesheets" title="Timesheet approvals — validating the hours">
              <P>
                Reviewing and authorising submitted hours, which is where HR meets project costing, productivity and
                billing.
              </P>
              <DataTable
                head={["Employee", "Submitted", "Billable", "Status"]}
                rows={[
                  ["John", "40", "35", <Status key="j" kind="wait">Pending</Status>],
                  ["Sarah", "37.5", "32", <Status key="s" kind="ok">Approved</Status>],
                  ["David", "48", "42", <Status key="d" kind="no">Review required</Status>],
                  ["Mary", "40", "36", <Status key="m" kind="wait">Pending</Status>],
                  ["James", "32", "28", <Status key="ja" kind="info">Returned</Status>],
                ]}
              />
              <Caption>Attendance or timesheets?</Caption>
              <DataTable
                head={["Attendance", "Timesheets"]}
                rows={[
                  ["Records presence", "Records activity"],
                  ["Check-in and check-out", "Hours against projects and tasks"],
                  ["Supports availability", "Supports project costing"],
                  ["Identifies absence and lateness", "Identifies billable and non-billable work"],
                  ["When people worked", "What they worked on"],
                ]}
              />
              <AiNote>
                {AI} can compare timesheets against attendance, highlight missing entries, detect unusually high hours
                and prepare the approval recommendation.
              </AiNote>
            </Fn>

            <Fn id="my-team" title="My team — the manager's workspace">
              <P>
                A manager&rsquo;s direct and indirect reports, with leave and timesheet approvals scoped to their own
                people.
              </P>
              <Figures
                items={[
                  ["Direct reports", "2"],
                  ["Indirect reports", "4"],
                  ["Total team", "6"],
                ]}
              />
              <Note>
                Decentralised day-to-day HR, with accountability and access controls kept intact.
              </Note>
              <AiNote>
                She can summarise team workload, surface outstanding approvals and keep a manager inside their
                authorised scope.
              </AiNote>
            </Fn>

            <PartHeading title="Recruitment & lifecycle" />

            <Fn id="recruitment" title="Recruitment — requisition to accepted offer">
              <P>
                Job requisitions, candidate pipelines, interviews and offers, from identifying the need to creating
                the employment record.
              </P>
              <Photos photos={recruitPhotos} />
              <Caption>Example — the funnel for one Finance Manager vacancy</Caption>
              <ul className="mt-3 space-y-2">
                {funnel.map(([stage, count]) => (
                  <li key={stage}>
                    <div className="flex items-baseline justify-between text-[13.5px]">
                      <span className="text-lp-body">{stage}</span>
                      <span className="font-semibold tabular-nums text-lp-ink">{count}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-lp-alt">
                      <div className="h-full rounded-full" style={{ width: `${(count / 120) * 100}%`, backgroundColor: CHART.blue }} />
                    </div>
                  </li>
                ))}
              </ul>
              <Figures
                items={[
                  ["Positions filled", "1"],
                  ["Offer acceptance rate", "50%"],
                  ["Applications per hire", "120"],
                ]}
              />
              <DataTable
                head={["Indicator", "What it tells you"]}
                rows={[
                  ["Open requisitions", "Outstanding recruitment requirements"],
                  ["Time to hire", "From candidate entry to accepted offer"],
                  ["Time to fill", "How long a position stays open"],
                  ["Cost per hire", "Recruitment spend per successful hire"],
                  ["Offer acceptance rate", "Proportion of offers accepted"],
                  ["Candidate conversion", "Progress through the stages"],
                ]}
              />
              <Warning>
                She can draft descriptions, organise applications, schedule interviews and summarise candidates
                against the criteria. The hiring decision stays with authorised people.
              </Warning>
            </Fn>

            <Fn id="onboarding" title="Onboarding & offboarding — the two checklists">
              <P>
                Structured lifecycle activities at both ends: a good start makes someone productive sooner, a
                controlled exit protects information, assets, continuity and the employee&rsquo;s own entitlements.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Checklist title="Onboarding" items={onboarding} done={7} />
                <Checklist title="Offboarding" items={offboarding} done={4} />
              </div>
              <AiNote>
                {AI} can prepare role-specific checklists, find the incomplete activities and tell the responsible
                department where configured.
              </AiNote>
            </Fn>

            <PartHeading title="Performance & development" />

            <Fn id="performance" title="Performance management — goals that ladder up">
              <P>
                Company objectives become departmental targets become individual goals, monitored continuously rather
                than discovered at review time.
              </P>
              <DataTable
                head={["Objective", "Target", "Achieved", "Weight"]}
                rows={goals.map(([objective, target, actual, weight]) => [objective, target, actual, weight])}
              />
              <Caption>Progress against goals</Caption>
              <ul className="mt-3 space-y-2">
                {goals.map(([objective, , , , progress]) => (
                  <li key={objective}>
                    <div className="flex items-baseline justify-between text-[13.5px]">
                      <span className="text-lp-body">{objective}</span>
                      <span className="font-semibold text-lp-ink">{progress}%</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-lp-alt">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: progress >= 100 ? CHART.green : progress >= 90 ? CHART.blue : CHART.amber,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <AiNote>
                She can summarise progress, identify what is outstanding and help a manager prepare a constructive
                development conversation.
              </AiNote>
            </Fn>

            <Fn id="reviews" title="Performance reviews — self, manager and 360">
              <P>
                A formal evaluation over a period, drawing on self-assessment, the manager&rsquo;s view, peers and —
                where it applies — direct reports.
              </P>
              <DataTable
                head={["Review type", "Purpose"]}
                rows={[
                  ["Self-review", "The employee assesses their own achievements and challenges"],
                  ["Manager review", "The manager evaluates the agreed objectives"],
                  ["Peer feedback", "Colleagues assess teamwork and collaboration"],
                  ["Direct report feedback", "The team provides leadership feedback"],
                  ["Consolidated review", "Management considers it all, and development"],
                ]}
              />
              <Figures
                items={[
                  ["Self-review", "4.44 / 5"],
                  ["Manager review", "4.28 / 5"],
                  ["360 feedback", "4.32 / 5"],
                ]}
              />
              <Caption>Management or review?</Caption>
              <DataTable
                head={["Performance management", "Performance reviews"]}
                rows={[
                  ["Continuous", "Periodic and formal"],
                  ["Establishes objectives", "Evaluates achievement"],
                  ["Monitors progress", "Documents the outcome"],
                  ["Looks forward", "Looks back"],
                ]}
              />
              <Warning>
                She can consolidate the feedback and suggest development. Evaluations and consequential employment
                decisions stay with human judgment.
              </Warning>
            </Fn>

            <PartHeading title="Documentation & governance" />

            <Fn id="documents" title="Documents vault — and what expires when">
              <P>
                Identification, immigration, qualifications and employment paperwork in one repository, with expiry
                alerts for whatever needs renewing — passports, visas, work permits, certificates, contracts,
                professional licences.
              </P>
              <Figures
                items={[
                  ["Documents registered", "780"],
                  ["Valid", "768"],
                  ["Expiring within 30 days", "7"],
                  ["Expired", "5"],
                ]}
              />
              <ul className="mt-3 space-y-2">
                {[
                  ["Work permit", "EMP-0045", "Expires in 8 days"],
                  ["Professional certificate", "EMP-0082", "Expires in 15 days"],
                  ["Passport", "EMP-0102", "Expires in 28 days"],
                ].map(([doc, who, when]) => (
                  <li
                    key={who}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl border border-needs-human/30 bg-needs-human/6 px-4 py-3"
                  >
                    <span className="text-[13.5px] font-semibold text-lp-ink">{doc}</span>
                    <span className="text-[12.5px] text-lp-muted">{who}</span>
                    <span className="text-[13px] text-needs-human">{when}</span>
                  </li>
                ))}
              </ul>
              <Warning>
                These documents are highly confidential and need access permissions, security measures and a
                retention policy behind them.
              </Warning>
              <AiNote>
                {AI} can track the expiry dates, highlight what is missing and prepare the renewal reminders without
                exposing more than it needs to.
              </AiNote>
            </Fn>

            <Fn id="policies" title="Policy library — versioned, and acknowledged">
              <P>
                The policies employees must read and acknowledge. Editing one increments its version and reopens the
                acknowledgment, so nobody counts as having accepted an amendment they never saw.
              </P>
              <DataTable head={["Policy", "Version", "Purpose"]} rows={policies.map((p) => [...p])} />
              <Caption>What a revision does</Caption>
              <Flow
                steps={[
                  ["Version 1 acknowledged", "250 of 250 employees"],
                  ["HR edits the policy", "Version 1 → version 2"],
                  ["Acknowledgment reopens", "180 acknowledged, 70 outstanding — 72%"],
                ]}
              />
              <Warning>
                An acknowledgment evidences that a version was acknowledged. It does not by itself establish agreement
                to every contractual change, nor replace legally required consultation.
              </Warning>
              <AiNote>
                She can compare versions, summarise what changed, identify who has not acknowledged and prepare the
                communication.
              </AiNote>
            </Fn>

            <Fn id="holidays" title="Holiday calendars — by country and location">
              <P>
                Different calendars for different operating locations, feeding leave, attendance and shift planning —
                because an employee in Canada and one in Ireland do not share public holidays.
              </P>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {countries.map((c) => (
                  <figure key={c.country} className="overflow-hidden rounded-xl border border-lp-line bg-lp-card">
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
                      <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{c.country}</p>
                      <p className="mt-0.5 text-[12.5px] leading-[1.5] text-lp-muted">{c.note}</p>
                    </figcaption>
                  </figure>
                ))}
              </div>
              <AiNote>
                {AI} can analyse availability across countries, find the scheduling conflicts and help plan around
                local holidays.
              </AiNote>
            </Fn>

            <PartHeading title="Structure & configuration" />

            <Fn id="org-chart" title="Organisation chart — built from the data">
              <P>
                The chart is derived from each employee&rsquo;s reporting manager rather than drawn separately, so
                changing a manager changes the chart.
              </P>
              <DataTable head={["Employee", "Role", "Reports to"]} rows={hierarchy.map((h) => [...h])} />
              <Note>
                It establishes accountability, shows direct and indirect reports, and backs the approval hierarchies.
              </Note>
              <AiNote>
                She can analyse the structure, find missing or circular manager relationships and flag management
                spans worth reviewing.
              </AiNote>
            </Fn>

            <Fn id="settings" title="HR settings — the operating rules">
              <P>
                The working week, the weekend, the locale and the timezone — the context leave, attendance, shifts and
                holiday calendars all calculate against.
              </P>
              <Figures
                items={[
                  ["Working days", "Monday–Friday"],
                  ["Standard day", "7.5 hours"],
                  ["Standard week", "37.5 hours"],
                  ["Locale & timezone", "English (Canada) · America/Toronto"],
                ]}
              />
              <Note>
                For multinationals, locale and timezone matter more than they look: they decide what a working day
                even is.
              </Note>
              <AiNote>
                {AI} can find inconsistent configurations across companies and locations and help an administrator
                review them.
              </AiNote>
            </Fn>
          </div>
        </Container>
      </section>

      {/* lifecycle + finance integration */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>The complete employee lifecycle</Kicker>
          <H2>Nine stages, one connected record.</H2>
          <ol className="mt-8 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map(([title, text]) => (
              <li key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
                <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
                <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <Kicker>HR and the money</Kicker>
              <h3 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink">
                What the workforce actually costs.
              </h3>
              <Figures
                items={[
                  ["Total annual workforce cost", "$16.30M"],
                  ["Average cost per employee", "$65,200"],
                  ["Monthly workforce spend", "$1.36M"],
                ]}
              />
              <Note>
                Basic salaries are 76.7% of it; the rest is bonuses and incentives, benefits, employer contributions,
                recruitment and training. An illustrative organisation of 250 people.
              </Note>
            </div>
            <div>
              <Kicker>Where HR connects</Kicker>
              <h3 className="mt-3 text-[22px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink">
                Eleven modules downstream.
              </h3>
              <DataTable head={["Module", "What HR gives it"]} rows={integrations.map((i) => [...i])} />
            </div>
          </div>
        </Container>
      </section>

      {/* agentic AI */}
      <section>
        <Container className="py-16">
          <Kicker>Agentic AI across all 21 functions</Kicker>
          <H2>
            You ask. She understands. <Serif className="text-[32px] sm:text-[40px]">She delivers.</Serif>
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

          <Caption>Example — Monday morning with the managing director</Caption>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-lp-line bg-lp-card px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">Managing director</p>
              <p className="mt-2.5 flex gap-2.5 text-[14.5px] leading-[1.6] text-lp-ink">
                <Quote className="mt-1 h-3.5 w-3.5 shrink-0 text-lp-muted/60" strokeWidth={2} />
                <span>
                  Good morning, {AI}. Review our workforce, check attendance, identify outstanding leave requests and
                  timesheets, review recruitment, check expiring documents, and tell me what needs me this week.
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-lp-brand/30 bg-lp-brand/6 px-5 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-brand">{AI}</p>
              <div className="mt-2.5 grid gap-2 sm:grid-cols-2">
                {[
                  ["Employee records reviewed", "250"],
                  ["Vacant positions", "16"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-lp-card px-3 py-2">
                    <p className="text-[11px] uppercase tracking-[0.12em] text-lp-muted">{k}</p>
                    <p className="text-[15px] font-semibold text-lp-ink">{v}</p>
                  </div>
                ))}
              </div>
              <ul className="mt-3 space-y-1.5 text-[13.5px] leading-[1.5] text-lp-body">
                {[
                  "14 pending leave requests, 21 timesheets awaiting approval",
                  "Attendance exceptions reviewed",
                  "Seven documents expiring within 30 days",
                  "Eight active requisitions, six incomplete onboarding activities",
                  "70 outstanding policy acknowledgments",
                ].map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai-done" strokeWidth={2.5} />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[13.5px] leading-[1.55] text-lp-body">
                Waiting on you: the leave requests, timesheet corrections, priority requisitions, the proposed salary
                adjustments before the merit cycle is finalised, and the roster changes.{" "}
                <b className="font-semibold text-lp-ink">You remain in control of employee decisions.</b>
              </p>
            </div>
          </div>
          <Note>
            Illustrative workflow, subject to implemented capabilities, configured permissions and the applicable
            employment and privacy requirements.
          </Note>
        </Container>
      </section>

      {/* controls + philosophy */}
      <section className="border-y border-lp-line bg-lp-alt">
        <Container className="py-16">
          <Kicker>HR controls & governance</Kicker>
          <H2>Protecting people&rsquo;s information, and the numbers.</H2>
          <div className="mt-8 max-w-4xl">
            <DataTable head={["Control", "Purpose"]} rows={controls.map((c) => [...c])} />
          </div>

          <div className="mt-14 grid gap-3 sm:grid-cols-3">
            {[
              ["/hr/philosophy-1.jpg", "A diverse team working together around a laptop"],
              ["/hr/philosophy-2.jpg", "A new employee starting their first job"],
              ["/hr/philosophy-3.jpg", "A team applauding a result"],
            ].map(([src, alt]) => (
              <div key={src} className="relative aspect-[3/2] overflow-hidden rounded-xl bg-lp-canvas">
                <Image src={src} alt={alt} fill sizes="(min-width: 640px) 30vw, 90vw" className="object-cover" />
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl text-center">
            <Kicker>The {AI} HR philosophy</Kicker>
            <h2 className="mt-4 text-[28px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink sm:text-[34px]">
              Not simply managing people. Developing potential.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.7] text-lp-body">
              An unfilled position is unused capacity. A poor onboarding delays productivity. An overdue review is a
              missed development opportunity. An uncontrolled pay structure creates financial uncertainty. An
              unacknowledged policy creates governance risk.
            </p>
            <p className="mt-6 font-serif text-[22px] italic leading-[1.4] text-lp-brand">
              &ldquo;Success is not a cost factor, but an efficiency factor.&rdquo;
            </p>
            <p className="mt-6 text-[15px] leading-[1.7] text-lp-body">
              Doubling productivity does not require doubling the workforce. It takes better planning, leadership,
              resource allocation, development and less administrative drag — technology reducing the burden without
              removing the judgment, empathy and leadership that managing people needs.
            </p>
            <p className="mt-7 text-[18px] font-semibold leading-normal tracking-[-0.02em] text-lp-ink">
              {AI} — Empowering people. Simplifying processes.{" "}
              <span className="text-lp-brand">Transforming organisations.</span>
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

/** A lifecycle checklist, part done. */
function Checklist({ title, items, done }: { title: string; items: string[]; done: number }) {
  return (
    <div className="rounded-xl border border-lp-line bg-lp-card px-5 py-4">
      <div className="flex items-baseline justify-between">
        <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
        <p className="text-[12.5px] text-lp-muted">
          {done} of {items.length} complete
        </p>
      </div>
      <ul className="mt-3 space-y-1.5">
        {items.map((item, i) => (
          <li key={item} className="flex items-center gap-2 text-[13px]">
            <span
              className={cn(
                "grid h-4 w-4 shrink-0 place-items-center rounded-full",
                i < done ? "bg-ai-done/15 text-ai-done" : "border border-lp-line",
              )}
            >
              {i < done && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
            </span>
            <span className={i < done ? "text-lp-muted line-through" : "text-lp-body"}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Current against revised salaries in the merit cycle. */
function MeritChart() {
  const max = 110000;
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
          ["Current salary", CHART.blue],
          ["Revised salary", CHART.green],
        ].map(([label, colour]) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: colour }} /> {label}
          </span>
        ))}
      </div>
      <svg viewBox="0 0 500 185" className="mt-2 w-full" role="img" aria-label="Current against revised salaries">
        {[0, 55000, 110000].map((v) => (
          <g key={v}>
            <line x1={left} x2="490" y1={y(v)} y2={y(v)} stroke="currentColor" strokeWidth="1" className="text-lp-line" />
            <text x={left - 8} y={y(v) + 4} textAnchor="end" className="fill-lp-muted text-[11px]">
              ${v / 1000}K
            </text>
          </g>
        ))}
        {merit.map(([name, current, , revised], i) => {
          const x = left + i * band + (band - bar * 2 - 4) / 2;
          return (
            <g key={name}>
              <rect x={x} y={y(current)} width={bar} height={base - y(current)} rx="3" fill={CHART.blue} />
              <rect x={x + bar + 4} y={y(revised)} width={bar} height={base - y(revised)} rx="3" fill={CHART.green} />
              <text x={left + i * band + band / 2} y={base + 18} textAnchor="middle" className="fill-lp-muted text-[11px]">
                {name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** Who turned up, out of those scheduled. */
function AttendanceChart() {
  const parts: [string, number, string][] = [
    ["Present on time", 202, CHART.green],
    ["Late arrivals", 12, CHART.amber],
    ["Absent", 16, CHART.orange],
  ];
  const total = 230;
  return (
    <div className="mt-4">
      <div className="flex h-6 overflow-hidden rounded-lg">
        {parts.map(([label, value, colour]) => (
          <div key={label} style={{ width: `${(value / total) * 100}%`, backgroundColor: colour }} title={label} />
        ))}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-3">
        {parts.map(([label, value, colour]) => (
          <li key={label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: colour }} />
            <span className="flex-1 text-lp-body">{label}</span>
            <span className="font-semibold tabular-nums text-lp-ink">{value}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[12.5px] text-lp-muted">230 scheduled · an attendance rate of about 93%.</p>
    </div>
  );
}
