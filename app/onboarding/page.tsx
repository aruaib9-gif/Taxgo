"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  Upload,
  Store,
  Briefcase,
  Factory,
  ShoppingCart,
  HardHat,
  UtensilsCrossed,
  Stethoscope,
  GraduationCap,
  Truck,
  ShoppingBag,
  Sprout,
  HeartHandshake,
  LayoutGrid,
  Sparkles,
  Plus,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { BRAND } from "@/lib/brand";

const COUNTRIES = [
  { label: "UAE / GCC — AED, 5% VAT", country: "United Arab Emirates", currency: "AED", tax: "UAE VAT" },
  { label: "Saudi Arabia — SAR, 15% VAT", country: "Saudi Arabia", currency: "SAR", tax: "ZATCA VAT" },
  { label: "India — INR, GST", country: "India", currency: "INR", tax: "GST" },
  { label: "United States — USD, Sales tax", country: "United States", currency: "USD", tax: "Sales tax" },
  { label: "United Kingdom — GBP, 20% VAT", country: "United Kingdom", currency: "GBP", tax: "UK VAT" },
  { label: "Europe — EUR, VAT", country: "Europe", currency: "EUR", tax: "EU VAT" },
  { label: "Rest of world — USD", country: "Rest of world", currency: "USD", tax: "—" },
];

type Biz = { title: string; desc: string; icon: LucideIcon; pills: string[] };
const BIZ: Biz[] = [
  { title: "Trading / Distribution", desc: "Buy & sell goods, manage stock and suppliers.", icon: Store, pills: ["Inventory", "Purchasing", "Sales"] },
  { title: "Services / Consulting", desc: "Projects, timesheets and professional billing.", icon: Briefcase, pills: ["Projects", "Timesheets", "Proposals"] },
  { title: "Manufacturing", desc: "BOMs, production orders and inventory.", icon: Factory, pills: ["BOMs", "Production", "Costing"] },
  { title: "Retail / POS", desc: "Point of sale, multi-outlet and van sales.", icon: ShoppingCart, pills: ["POS", "Outlets", "Loyalty"] },
  { title: "Construction / Contracting", desc: "Projects, progress billing and site expenses.", icon: HardHat, pills: ["Projects", "Billing", "Costing"] },
  { title: "Restaurants / Hospitality", desc: "Tables, kitchen orders and daily takings.", icon: UtensilsCrossed, pills: ["POS", "Kitchen", "Tables"] },
  { title: "Healthcare / Clinics", desc: "Appointments-driven billing and consumables.", icon: Stethoscope, pills: ["Appointments", "Billing"] },
  { title: "Education / Training", desc: "Fees, batches and recurring collections.", icon: GraduationCap, pills: ["Fees", "Batches"] },
  { title: "Logistics / Transport", desc: "Fleet costs, trips and fuel expenses.", icon: Truck, pills: ["Fleet", "Van sales"] },
  { title: "E-commerce", desc: "Online orders, marketplaces and fulfilment.", icon: ShoppingBag, pills: ["Orders", "Fulfilment"] },
  { title: "Agriculture", desc: "Seasonal produce, stock and land assets.", icon: Sprout, pills: ["Stock", "Assets"] },
  { title: "Non-profit / NGO", desc: "Donations, grants and utilisation reporting.", icon: HeartHandshake, pills: ["Donations", "Grants"] },
  { title: "Something else", desc: "Start lean — every module stays a click away.", icon: LayoutGrid, pills: [] },
];

const COLORS = ["#0168b3", "#06b6d4", "#16a34a", "#0d9488", "#7c3aed", "#db2777", "#ea580c", "#dc2626", "#0f172a"];
const UNIT_TYPES = ["Branches", "Divisions", "Departments", "Regions", "Stores", "Teams", "Sub-companies", "Head office"];

const PHASES = ["Your company", "Organization", "Identity", "People", "Ready"];
const PHASE_OF = [0, 0, 1, 1, 2, 2, 3, 4];
const TOTAL = 8;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [ci, setCi] = useState(0);
  const [biz, setBiz] = useState<string[]>([]);
  const [units, setUnits] = useState<string[]>(["Head Office"]);
  const [unitInput, setUnitInput] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [taxId, setTaxId] = useState("");
  const [reg, setReg] = useState("");
  const [people, setPeople] = useState<{ email: string; role: string }[]>([{ email: "", role: "Member" }]);
  const [loadSample, setLoadSample] = useState(false);

  const c = COUNTRIES[ci];
  const name = company || "Your company";
  const docName = displayName || company || "Your company";
  const phase = PHASE_OF[step];

  const pills = useMemo(() => {
    const base = ["Accounting", "Invoicing", "Banking", "Reports", "Taxes", "AI assistant"];
    const extra = new Set<string>();
    biz.forEach((t) => BIZ.find((b) => b.title === t)?.pills.forEach((p) => extra.add(p)));
    return { base, extra: [...extra] };
  }, [biz]);

  function next() {
    if (step < TOTAL - 1) setStep(step + 1);
    else router.push("/home");
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }
  function toggleBiz(t: string) {
    setBiz((b) => (b.includes(t) ? b.filter((x) => x !== t) : [...b, t]));
  }

  const primaryLabel = step === 0 ? "Create my company" : step === TOTAL - 1 ? "Go to dashboard" : "Continue";
  const canSkip = step >= 3 && step <= 6;
  const hint = [
    "Next: what you do",
    "Next: how you're organized",
    "Next: name your units",
    "Next: your brand",
    "Next: tax registration",
    "Next: partners & capital",
    "Then: you're live",
    "",
  ][step];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* top bar */}
      <header className="flex h-16 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-2.5">
          <BrandMark href="/" />
          <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Setup
          </span>
        </div>
        <ol className="hidden items-center gap-2 text-sm md:flex">
          {PHASES.map((p, i) => (
            <li key={p} className="flex items-center gap-2">
              <span
                className={
                  "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold " +
                  (i < phase ? "bg-primary text-primary-foreground" : i === phase ? "bg-foreground text-background" : "border border-border text-muted-foreground")
                }
              >
                {i < phase ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span className={i === phase ? "font-semibold" : "text-muted-foreground"}>{p}</span>
              {i < PHASES.length - 1 ? <span className="mx-1 h-px w-6 bg-border" /> : null}
            </li>
          ))}
        </ol>
        <span className="text-xs text-muted-foreground">Saved automatically</span>
      </header>

      {/* body */}
      <div className="grid flex-1 lg:grid-cols-2">
        {/* left: form */}
        <div className="flex flex-col overflow-y-auto border-r border-border px-6 py-8 md:px-12">
          {/* segments */}
          <div className="mb-6 flex gap-1">
            {Array.from({ length: TOTAL }).map((_, i) => (
              <span key={i} className={"h-1.5 flex-1 rounded-full " + (i <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>

          {/* summary rows */}
          <div className="mb-6 space-y-1.5 text-sm">
            {step > 0 ? <SummaryRow label="Company" value={`${name} · ${c.currency}`} /> : null}
            {step > 1 && biz.length ? <SummaryRow label="Business" value={biz[0] + (biz.length > 1 ? ` +${biz.length - 1}` : "")} /> : null}
            {step > 3 ? <SummaryRow label="Structure" value={`${units.length} unit${units.length === 1 ? "" : "s"}`} /> : null}
            {step > 5 ? <SummaryRow label="Brand" value={docName} /> : null}
            {step > 5 ? <SummaryRow label="Tax IDs" value={taxId ? taxId : "Later"} /> : null}
          </div>

          <div className="max-w-md flex-1">
            {step === 0 && <CompanyStep {...{ company, setCompany, ci, setCi }} />}
            {step === 1 && <BusinessStep {...{ biz, toggleBiz, loadSample, setLoadSample }} />}
            {step === 2 && <OrgStep {...{ name, units, setUnits }} />}
            {step === 3 && <UnitsStep {...{ name, units, setUnits, unitInput, setUnitInput }} />}
            {step === 4 && <BrandStep {...{ displayName, setDisplayName, name, color, setColor }} />}
            {step === 5 && <TaxStep {...{ taxId, setTaxId, reg, setReg }} />}
            {step === 6 && <PeopleStep {...{ people, setPeople }} />}
            {step === 7 && <ReadyStep name={name} />}
          </div>
        </div>

        {/* right: preview */}
        <div className="hidden items-center justify-center bg-[var(--body)] p-10 lg:flex">
          {phase === 0 && <CompanyPreview name={name} c={c} step={step} pills={pills} />}
          {phase === 1 && <OrgPreview name={name} units={units} />}
          {phase === 2 && <InvoicePreview docName={docName} color={color} currency={c.currency} />}
          {phase === 3 && <SetupSummary name={name} c={c} units={units} docName={docName} taxId={taxId} />}
          {phase === 4 && <LivePreview name={name} />}
        </div>
      </div>

      {/* footer */}
      <footer className="flex items-center justify-between border-t border-border px-6 py-4">
        <div className="w-40">
          {step > 0 ? (
            <button onClick={back} className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          ) : null}
        </div>
        <span className="hidden text-sm text-muted-foreground sm:block">{hint}</span>
        <div className="flex w-40 items-center justify-end gap-3">
          {canSkip ? (
            <button onClick={next} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Skip for now
            </button>
          ) : null}
          <button onClick={next} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
            {primaryLabel} <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- left step bodies ---------------- */

function Serif({ children }: { children: React.ReactNode }) {
  return <span className="italic text-primary">{children}</span>;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 font-medium">
        <Check className="h-3.5 w-3.5 text-primary" /> {label}
      </span>
      <span className="text-muted-foreground">{value}</span>
    </div>
  );
}

const fieldCls =
  "h-11 w-full rounded-full border border-input bg-card px-4 text-sm outline-none focus:ring-2 focus:ring-ring";
const labelCls = "mb-1.5 block text-sm font-semibold";

function CompanyStep({ company, setCompany, ci, setCi }: { company: string; setCompany: (v: string) => void; ci: number; setCi: (v: number) => void }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        What&apos;s your company <Serif>called</Serif>?
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Name and country are all it takes — the chart of accounts, tax regime, currency and fiscal calendar follow from them, instantly.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label className={labelCls}>Company name</label>
          <input autoFocus className={fieldCls} placeholder="e.g. Acme Trading LLC" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Country of operation</label>
          <select className={fieldCls} value={ci} onChange={(e) => setCi(Number(e.target.value))}>
            {COUNTRIES.map((c, i) => (
              <option key={c.label} value={i}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Company logo (optional)</label>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </span>
            <button className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
              <Upload className="h-4 w-4" /> Upload logo
            </button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          We&apos;ll set up <b className="text-foreground">{COUNTRIES[ci].currency}</b> as your base currency with{" "}
          <b className="text-foreground">{COUNTRIES[ci].tax}</b> rules and the Jan–Dec fiscal year.
        </p>
      </div>
    </div>
  );
}

function BusinessStep({ biz, toggleBiz, loadSample, setLoadSample }: { biz: string[]; toggleBiz: (t: string) => void; loadSample: boolean; setLoadSample: (v: boolean) => void }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        What kind of <Serif>business</Serif> is it?
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Pick every one that applies — a business is rarely just one thing. This decides which modules light up on day one; everything else stays a click away.
      </p>
      <div className="mt-6 space-y-2.5">
        {BIZ.map((b) => {
          const on = biz.includes(b.title);
          return (
            <button
              key={b.title}
              onClick={() => toggleBiz(b.title)}
              className={"flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-colors " + (on ? "border-primary bg-accent/40" : "border-border hover:bg-muted/50")}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <b.icon className="h-5 w-5" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">{b.title}</span>
                <span className="block text-xs text-muted-foreground">{b.desc}</span>
              </span>
              <span className={"flex h-5 w-5 items-center justify-center rounded-full border " + (on ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                {on ? <Check className="h-3 w-3" /> : null}
              </span>
            </button>
          );
        })}
        <label className="flex items-start gap-2.5 rounded-2xl bg-muted/50 p-3 text-sm">
          <input type="checkbox" className="mt-0.5 accent-[var(--primary)]" checked={loadSample} onChange={(e) => setLoadSample(e.target.checked)} />
          <span>
            <b>Load sample data to explore.</b> <span className="text-muted-foreground">Demo customers, products, invoices — clear anytime.</span>
          </span>
        </label>
      </div>
    </div>
  );
}

function OrgStep({ name, units, setUnits }: { name: string; units: string[]; setUnits: (u: string[]) => void }) {
  const [picked, setPicked] = useState<string[]>(["Head office"]);
  function toggle(t: string) {
    setPicked((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  }
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        How is <Serif>{name}</Serif> organized?
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Pick every kind of unit you have — branches, divisions, sub-companies, your own words. {BRAND.fullName} builds the levels; you&apos;ll name the units next.
      </p>
      <button
        onClick={() => setUnits(["Head Office"])}
        className="mt-6 flex w-full items-start gap-3 rounded-2xl border border-border p-4 text-left hover:bg-muted/50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Building2 className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-semibold">Just us — one office</span>
          <span className="block text-xs text-muted-foreground">One location, one set of books. You can add structure anytime.</span>
        </span>
      </button>
      <p className="mt-5 text-sm font-semibold">Or pick what you have</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {UNIT_TYPES.map((t) => {
          const on = picked.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggle(t)}
              className={"inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm " + (on ? "border-primary bg-accent/50 text-accent-foreground" : "border-border hover:bg-muted")}
            >
              {on ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />} {t}
            </button>
          );
        })}
      </div>
      <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4">
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Or tell {BRAND.fullName} — she builds it
        </p>
        <textarea className="min-h-20 w-full rounded-xl border border-input bg-card p-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder={`e.g. "We're one company with two trademarks. The first has 7 branches, the second has 2."`} />
        <p className="mt-2 text-xs text-muted-foreground">She drafts a plan — nothing is created until you approve it.</p>
      </div>
    </div>
  );
}

function UnitsStep({ name, units, setUnits, unitInput, setUnitInput }: { name: string; units: string[]; setUnits: (u: string[]) => void; unitInput: string; setUnitInput: (v: string) => void }) {
  function add() {
    if (unitInput.trim()) {
      setUnits([...units, unitInput.trim()]);
      setUnitInput("");
    }
  }
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Now <Serif>name the units</Serif>.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your levels are ready — pick one, pick where it sits, type the name. Toggle &apos;own books&apos; on a unit to give it its own ledger.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label className={labelCls}>Under</label>
          <select className={fieldCls}>
            <option>{name}</option>
            {units.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Unit name</label>
          <div className="flex gap-2">
            <input className={fieldCls} placeholder="e.g. Kochi Branch" value={unitInput} onChange={(e) => setUnitInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            <button onClick={add} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
        <ul className="space-y-2">
          {units.map((u, i) => (
            <li key={u + i} className="flex items-center justify-between rounded-2xl border border-border p-3">
              <span>
                <span className="block text-sm font-semibold">{u}</span>
                <span className="block text-xs text-muted-foreground">under {name}</span>
              </span>
              {units.length > 1 ? (
                <button onClick={() => setUnits(units.filter((_, j) => j !== i))} aria-label="Remove">
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BrandStep({ displayName, setDisplayName, name, color, setColor }: { displayName: string; setDisplayName: (v: string) => void; name: string; color: string; setColor: (v: string) => void }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Now make it <Serif>yours</Serif>.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your logo and colour go on every invoice, quote and statement — watch the invoice on the right wear them as you pick.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label className={labelCls}>Display name on documents</label>
          <input className={fieldCls} placeholder={name} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Logo</label>
          <button className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Upload className="h-4 w-4" /> Upload logo
          </button>
        </div>
        <div>
          <label className={labelCls}>Brand colour</label>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={c}
                className={"h-8 w-8 rounded-full ring-offset-2 ring-offset-background " + (color === c ? "ring-2 ring-foreground" : "")}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaxStep({ taxId, setTaxId, reg, setReg }: { taxId: string; setTaxId: (v: string) => void; reg: string; setReg: (v: string) => void }) {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Your <Serif>tax registration</Serif>.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        These go straight onto your invoices and tax reports — see the invoice update as you type. Add them now or after your accountant confirms.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label className={labelCls}>Tax ID / VAT number</label>
          <input className={fieldCls} placeholder="Tax identification number" value={taxId} onChange={(e) => setTaxId(e.target.value)} />
        </div>
        <div>
          <label className={labelCls}>Registration number</label>
          <input className={fieldCls} placeholder="Company registration no." value={reg} onChange={(e) => setReg(e.target.value)} />
        </div>
        <p className="text-sm text-muted-foreground">• Your fiscal year (Jan–Dec) and 12 accounting periods are already in place.</p>
      </div>
    </div>
  );
}

function PeopleStep({ people, setPeople }: { people: { email: string; role: string }[]; setPeople: (p: { email: string; role: string }[]) => void }) {
  function update(i: number, patch: Partial<{ email: string; role: string }>) {
    setPeople(people.map((p, j) => (j === i ? { ...p, ...patch } : p)));
  }
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Who <Serif>works with you</Serif>?
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">They&apos;ll get access to this company with the role you choose. Skip if it&apos;s just you for now.</p>
      <div className="mt-6 space-y-3">
        {people.map((p, i) => (
          <div key={i} className="flex gap-2">
            <input className={fieldCls} placeholder="teammate@company.com" value={p.email} onChange={(e) => update(i, { email: e.target.value })} />
            <select className="h-11 w-32 rounded-full border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" value={p.role} onChange={(e) => update(i, { role: e.target.value })}>
              <option>Member</option>
              <option>Admin</option>
              <option>Accountant</option>
              <option>Read Only</option>
            </select>
          </div>
        ))}
        <button onClick={() => setPeople([...people, { email: "", role: "Member" }])} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
          <Plus className="h-4 w-4" /> Add another
        </button>
      </div>
    </div>
  );
}

function ReadyStep({ name }: { name: string }) {
  return (
    <div className="flex h-full flex-col justify-center">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ai-done/15 text-ai-done">
        <Check className="h-7 w-7" />
      </span>
      <h1 className="text-3xl font-bold tracking-tight">
        <Serif>{name}</Serif> is live.
      </h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Your ledger, tax regime and fiscal calendar are set. {BRAND.fullName} is ready to read her first invoice. Press continue and she gets to work.
      </p>
    </div>
  );
}

/* ---------------- right preview panels ---------------- */

function CompanyPreview({ name, c, step, pills }: { name: string; c: (typeof COUNTRIES)[number]; step: number; pills: { base: string[]; extra: string[] } }) {
  const created = step >= 1;
  const checks = [
    { label: `Company registered in ${BRAND.fullName}`, value: "" },
    { label: "Base currency & tax regime", value: `${c.currency} · ${c.tax}` },
    { label: "Fiscal year + 12 periods", value: "FY Jan–Dec" },
    { label: "Chart of accounts drafted", value: "79 accounts" },
    { label: "Posting rules & ledger live", value: "" },
  ];
  return (
    <div className="w-full max-w-md space-y-4">
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className={"text-xl font-bold " + (created ? "" : "text-muted-foreground")}>{name}</p>
            <p className="text-sm text-muted-foreground">{c.country} · {c.currency} — ready to create</p>
          </div>
        </div>
        <ul className="space-y-2">
          {checks.map((ch) => (
            <li key={ch.label} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-sm">
              <span className={"flex items-center gap-2.5 " + (created ? "font-medium" : "text-muted-foreground")}>
                <span className={"flex h-4 w-4 items-center justify-center rounded-full text-[10px] " + (created ? "bg-primary text-primary-foreground" : "border border-border")}>
                  {created ? <Check className="h-3 w-3" /> : ""}
                </span>
                {ch.label}
              </span>
              {ch.value ? <span className="text-xs text-muted-foreground">{ch.value}</span> : null}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" /> Your workspace
        </p>
        <div className="flex flex-wrap gap-2">
          {pills.base.map((p) => (
            <span key={p} className="rounded-full bg-muted px-3 py-1 text-xs font-medium">{p}</span>
          ))}
          {pills.extra.map((p) => (
            <span key={p} className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">{p}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrgPreview({ name, units }: { name: string; units: string[] }) {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-0">
      <Node tag="Company · Books" title={name} sub="GENERIC · USD" primary />
      <span className="h-8 w-px bg-border" />
      <div className="flex flex-wrap items-center justify-center gap-4">
        {units.map((u) => (
          <Node key={u} tag="Head office" title={u} sub="GENERIC · USD" />
        ))}
      </div>
    </div>
  );
}
function Node({ tag, title, sub, primary }: { tag: string; title: string; sub: string; primary?: boolean }) {
  return (
    <div className={"w-56 rounded-2xl border bg-card p-4 shadow-sm " + (primary ? "border-primary/40" : "border-border")}>
      <span className="inline-block rounded-md bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">{tag}</span>
      <p className="mt-2 text-base font-bold">{title}</p>
      <p className="text-xs uppercase text-muted-foreground">{sub}</p>
    </div>
  );
}

function InvoicePreview({ docName, color, currency }: { docName: string; color: string; currency: string }) {
  const lines = [
    ["Consulting retainer — March", "4,500.00"],
    ["On-site support (6 hrs)", "900.00"],
    ["Sales tax", "270.00"],
  ];
  return (
    <div className="w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="h-2 w-full" style={{ background: color }} />
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </span>
            <p className="text-lg font-bold">{docName}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color }}>Tax Invoice</p>
            <p className="text-sm text-muted-foreground">INV-000214</p>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2 font-medium">Description</th>
              <th className="py-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(([d, a]) => (
              <tr key={d} className="border-b border-border/60">
                <td className="py-2">{d}</td>
                <td className="py-2 text-right">{a}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 flex items-center justify-between font-bold">
          <span>Total ({currency})</span>
          <span style={{ color }}>5,670.00</span>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">This is how your invoices, quotes and statements will look.</p>
      </div>
    </div>
  );
}

function SetupSummary({ name, c, units, docName, taxId }: { name: string; c: (typeof COUNTRIES)[number]; units: string[]; docName: string; taxId: string }) {
  const rows = [
    { label: "Company & books", value: `${name} · ${c.currency}` },
    { label: `${c.tax} + fiscal year Jan–Dec`, value: "" },
    { label: "Organization structure", value: `${units.length} units · ${units.length} ledgers` },
    { label: "Brand on documents", value: docName },
    { label: "Tax registration", value: taxId || "Add anytime" },
    { label: "Partners & capital", value: "Optional" },
  ];
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-sm">
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What we&apos;ve set up together</p>
      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between rounded-xl border border-border px-4 py-2.5 text-sm">
            <span className="flex items-center gap-2.5 font-medium">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
              {r.label}
            </span>
            {r.value ? <span className="text-xs text-muted-foreground">{r.value}</span> : null}
          </li>
        ))}
        <li className="flex items-center gap-2.5 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground">
          <span className="h-4 w-4 rounded-full border border-border" /> Team invited
        </li>
      </ul>
    </div>
  );
}

function LivePreview({ name }: { name: string }) {
  return (
    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-ai-done/15 text-ai-done">
        <Sparkles className="h-7 w-7" />
      </span>
      <p className="text-xl font-bold">{name} is ready</p>
      <p className="mt-2 text-sm text-muted-foreground">Chart of accounts, posting engine and your AI colleague are all live. Welcome aboard.</p>
    </div>
  );
}
