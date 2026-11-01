"use client";

// Payroll: salary components & structures, monthly runs (compute → approve → post → pay), payslips,
// loans with EMI schedules, expense claims, investment declarations, full & final settlements and
// statutory files. Statutory deductions follow the HR Settings country:
//   INDIA  PF 12% of basic (capped at 15,000), ESI 0.75% when gross ≤ 21,000, PT 200 above 15,000,
//          TDS from annualised income on the employee's regime (new or old, with verified declarations)
//   UK     PAYE on the tax code allowance (20/40/45%) and employee NI (8% / 2%)
//   GCC    no employee income tax; the air-ticket provision accrues as an employer cost
//
// Posting a run:  Dr 5100 Salaries & Wages (gross)
//                 Cr 2020 Salaries Payable (net) · 2030 Payroll Deductions Payable (statutory)
//                    1420 Employee Loans (EMI principal) · 4200 Interest Income (EMI interest)
// Paying a run:   Dr 2020 / Cr 1100 Bank.  Disbursing a loan: Dr 1420 / Cr 1100.

import { createRecord, nextNumber, readCollection, updateRecord, type Rec } from "@/lib/store";
import { createJournal, findAccountByCode, type JournalLine } from "@/lib/ledger";
import { currentSalary, fullName, hrSettings, leaveBalances, todayIso, updateEmployee, workingDays } from "@/lib/hr";

const n = (v: unknown) => Number(v ?? 0) || 0;
const r2 = (v: number) => Math.round(v * 100) / 100;

// Accounts payroll needs beyond the default chart are added on first use.
function account(code: string, name: string, type: string, normal: string) {
  const found = findAccountByCode(code);
  if (found) return found.id;
  return createRecord("accounts", { code, name, type, normalBalance: normal, parentId: null, isActive: true }).id;
}
const acc = {
  salary: () => account("5100", "Salaries & Wages", "EXPENSE", "DEBIT"),
  payable: () => account("2020", "Salaries Payable", "LIABILITY", "CREDIT"),
  deductions: () => account("2030", "Payroll Deductions Payable", "LIABILITY", "CREDIT"),
  loans: () => account("1420", "Employee Loans & Advances", "ASSET", "DEBIT"),
  interest: () => account("4200", "Interest Income", "REVENUE", "CREDIT"),
  bank: () => account("1100", "Bank Account", "ASSET", "DEBIT"),
  airTicket: () => account("2040", "Air-ticket Provision", "LIABILITY", "CREDIT"),
};

export const COMPONENT_KINDS = [
  { value: "EARNING_FIXED", label: "Earning (fixed amount)" }, { value: "EARNING_PERCENT", label: "Earning (% of basic)" },
  { value: "DEDUCTION_FIXED", label: "Deduction (fixed amount)" }, { value: "DEDUCTION_PERCENT", label: "Deduction (% of basic)" }, { value: "REIMBURSEMENT", label: "Reimbursement" },
];

/* ---------- statutory ---------- */

function slabTax(income: number, slabs: [number, number][]) {
  let tax = 0, prev = 0;
  for (const [upTo, rate] of slabs) { if (income <= prev) break; tax += (Math.min(income, upTo) - prev) * rate; prev = upTo; }
  return tax;
}

export function verifiedDeductions(employeeId: string, fy: string) {
  return readCollection("declarations").filter((d) => d.employeeId === employeeId && d.fy === fy && d.status === "verified").reduce((a, d) => a + Math.min(n(d.verifiedAmount ?? d.proofAmount), n(d.cap) || Infinity), 0);
}
export const fyOf = (year: number, month: number) => (month >= 4 ? `${year}-${String((year + 1) % 100).padStart(2, "0")}` : `${year - 1}-${String(year % 100).padStart(2, "0")}`);

function statutory(e: Rec, basic: number, gross: number, year: number, month: number) {
  const country = hrSettings().country;
  const out: { code: string; name: string; amount: number }[] = [];
  if (country === "INDIA") {
    out.push({ code: "PF_EE", name: "Provident Fund", amount: r2(Math.min(basic, 15000) * 0.12) });
    if (gross <= 21000) out.push({ code: "ESI_EE", name: "ESI", amount: r2(gross * 0.0075) });
    if (gross > 15000) out.push({ code: "PT", name: "Professional Tax", amount: 200 });
    const regime = String(e.taxRegime ?? "OLD");
    const annual = gross * 12;
    const taxable = regime === "OLD" ? annual - 50000 - verifiedDeductions(e.id, fyOf(year, month)) : annual - 75000;
    let tax = regime === "OLD" ? slabTax(taxable, [[250000, 0], [500000, 0.05], [1000000, 0.2], [Infinity, 0.3]]) : slabTax(taxable, [[400000, 0], [800000, 0.05], [1200000, 0.1], [1600000, 0.15], [2000000, 0.2], [2400000, 0.25], [Infinity, 0.3]]);
    if ((regime === "OLD" && taxable <= 500000) || (regime !== "OLD" && taxable <= 1200000)) tax = 0;
    if (tax > 0) out.push({ code: "TDS", name: "Income Tax (TDS)", amount: r2((tax * 1.04) / 12) });
  } else if (country === "UK") {
    const allowance = (parseInt(String(e.taxCode ?? "1257L")) || 1257) * 10;
    const annual = gross * 12;
    const tax = slabTax(Math.max(0, annual - allowance), [[37700, 0.2], [125140 - allowance, 0.4], [Infinity, 0.45]]);
    if (tax > 0) out.push({ code: "TDS", name: "PAYE Income Tax", amount: r2(tax / 12) });
    const ni = Math.max(0, Math.min(annual, 50270) - 12570) * 0.08 + Math.max(0, annual - 50270) * 0.02;
    if (ni > 0) out.push({ code: "NI_EE", name: "National Insurance", amount: r2(ni / 12) });
  }
  return out.filter((x) => x.amount > 0);
}

/* ---------- loans ---------- */

export function emi(principal: number, ratePct: number, months: number) {
  if (!months) return 0;
  const r = ratePct / 12 / 100;
  return r2(r ? (principal * r * (1 + r) ** months) / ((1 + r) ** months - 1) : principal / months);
}
export const loanOutstanding = (l: Rec) => r2(n(l.principal) - ((l.repayments as Rec[]) ?? []).reduce((a, p) => a + n(p.principal), 0));

export function disburseLoan(id: string) {
  const l = readCollection("employee-loans").find((x) => x.id === id)!;
  createJournal({ date: todayIso(), description: `Loan disbursed — ${l.loanNumber}`, status: "POSTED", source: "Payroll", lines: [{ accountId: acc.loans(), debit: n(l.principal), credit: 0 }, { accountId: acc.bank(), debit: 0, credit: n(l.principal) }] });
  updateRecord("employee-loans", id, { status: "ACTIVE", disbursedAt: todayIso() });
}

/* ---------- runs ---------- */

const periodOf = (y: number, m: number) => { const start = `${y}-${String(m).padStart(2, "0")}-01`; const last = new Date(y, m, 0).getDate(); return { start, end: `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}` }; };

export function createRun(year: number, month: number, notes?: string) {
  if (month < 1 || month > 12) throw new Error("Month must be 1–12");
  if (readCollection("payroll-runs").some((r) => n(r.periodYear) === year && n(r.periodMonth) === month && r.status !== "CANCELLED")) throw new Error(`A run for ${year}-${String(month).padStart(2, "0")} already exists`);
  const p = periodOf(year, month);
  return createRecord("payroll-runs", { runNumber: nextNumber("payroll-runs", "PR"), periodYear: year, periodMonth: month, periodStart: p.start, periodEnd: p.end, notes, status: "DRAFT", employeeCount: 0, totalGross: 0, totalDeductions: 0, totalNet: 0 });
}

// One payslip per employee employed during the period: basic and structure components, prorated
// for joining/leaving mid-month and unpaid leave, then statutory deductions and loan EMIs.
export function computeRun(runId: string) {
  const run = readCollection("payroll-runs").find((r) => r.id === runId)!;
  const y = n(run.periodYear), m = n(run.periodMonth);
  const { start, end } = periodOf(y, m);
  for (const old of readCollection("payslips").filter((p) => p.payrollRunId === runId)) updateRecord("payslips", old.id, { deleted: true });
  const salaries = readCollection("salaries");
  const structures = readCollection("salary-structures");
  const components = readCollection("salary-components");
  const unpaid = new Set(readCollection("leave-types").filter((t) => t.paid === false).map((t) => t.id));
  const leaves = readCollection("leave-requests").filter((l) => l.status === "APPROVED" && unpaid.has(String(l.leaveTypeId)));
  const loans = readCollection("employee-loans").filter((l) => l.status === "ACTIVE" && String(l.firstEmiDate ?? "") <= end && loanOutstanding(l) > 0);
  let gross = 0, ded = 0, net = 0, count = 0;
  for (const e of readCollection("employees")) {
    if (String(e.dateOfJoining ?? "") > end || (e.dateOfLeaving && String(e.dateOfLeaving) < start)) continue;
    const sal = salaries.filter((s) => s.employeeId === e.id && String(s.effectiveFrom) <= end).sort((a, b) => String(b.effectiveFrom).localeCompare(String(a.effectiveFrom)) || String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if (!sal) continue;
    const from = String(e.dateOfJoining) > start ? String(e.dateOfJoining) : start;
    const to = e.dateOfLeaving && String(e.dateOfLeaving) < end ? String(e.dateOfLeaving) : end;
    const total = workingDays(start, end) || 1;
    const lop = leaves.filter((l) => l.employeeId === e.id && String(l.fromDate) <= to && String(l.toDate) >= from).reduce((a, l) => a + workingDays(String(l.fromDate) > from ? String(l.fromDate) : from, String(l.toDate) < to ? String(l.toDate) : to), 0);
    const worked = Math.max(0, workingDays(from, to) - lop);
    const factor = worked / total;
    const basic = r2(n(sal.basic) * factor);
    const lines: { componentCode: string; componentName: string; kind: string; amount: number }[] = [{ componentCode: "BASIC", componentName: "Basic Salary", kind: "EARNING_FIXED", amount: basic }];
    const st = structures.find((s) => s.id === sal.structure || s.code === sal.structure);
    for (const sc of (st?.components as Rec[]) ?? []) {
      const c = components.find((x) => x.id === sc.componentId);
      if (!c || c.code === "BASIC") continue;
      const pct = String(c.kind).endsWith("PERCENT");
      const amount = r2(pct ? (n(sal.basic) * n(sc.percent ?? c.defaultPercentage)) / 100 * factor : n(sc.amount ?? c.defaultAmount) * (c.kind === "REIMBURSEMENT" ? 1 : factor));
      if (amount) lines.push({ componentCode: String(c.code), componentName: String(c.name), kind: String(c.kind), amount });
    }
    const g = r2(lines.filter((l) => l.kind.startsWith("EARNING") || l.kind === "REIMBURSEMENT").reduce((a, l) => a + l.amount, 0));
    for (const s of statutory(e, basic, g, y, m)) lines.push({ componentCode: s.code, componentName: s.name, kind: "DEDUCTION_FIXED", amount: s.amount });
    let loanTotal = 0;
    const emis: { loanId: string; principal: number; interest: number }[] = [];
    for (const l of loans.filter((x) => x.employeeId === e.id)) {
      const out = loanOutstanding(l);
      const interest = r2((out * n(l.interestRate)) / 1200);
      const principal = r2(Math.min(out, n(l.emiAmount) - interest));
      loanTotal += principal + interest;
      emis.push({ loanId: l.id, principal, interest });
    }
    if (loanTotal) lines.push({ componentCode: "LOAN_EMI", componentName: "Loan EMI", kind: "DEDUCTION_FIXED", amount: r2(loanTotal) });
    const d = r2(lines.filter((l) => l.kind.startsWith("DEDUCTION")).reduce((a, l) => a + l.amount, 0));
    const pick = (code: string) => lines.find((l) => l.componentCode === code)?.amount ?? 0;
    createRecord("payslips", {
      payrollRunId: runId, employeeId: e.id, employeeName: fullName(e), employeeNumber: e.employeeNumber, daysWorked: worked, workingDays: total, lopDays: lop,
      basicSalary: basic, grossAmount: g, deductionsAmount: d, netAmount: r2(g - d), pfEmployeeContribution: pick("PF_EE"), esiEmployeeContribution: pick("ESI_EE"), professionalTax: pick("PT"), incomeTaxDeducted: pick("TDS"), niContribution: pick("NI_EE"), loanEmiTotal: r2(loanTotal), emis,
      lines: lines.map((l) => ({ ...l, id: crypto.randomUUID() })), status: "DRAFT", iban: e.iban,
    });
    gross += g; ded += d; net += g - d; count++;
  }
  updateRecord("payroll-runs", runId, { status: "COMPUTED", employeeCount: count, totalGross: r2(gross), totalDeductions: r2(ded), totalNet: r2(net), computedAt: new Date().toISOString() });
  return count;
}

export const runPayslips = (runId: string, list = readCollection("payslips")) => list.filter((p) => p.payrollRunId === runId && !p.deleted);

export function approveRun(runId: string) {
  updateRecord("payroll-runs", runId, { status: "APPROVED", approvedAt: new Date().toISOString() });
}

export function postRun(runId: string) {
  const run = readCollection("payroll-runs").find((r) => r.id === runId)!;
  const slips = runPayslips(runId);
  const loanPrincipal = r2(slips.flatMap((s) => (s.emis as Rec[]) ?? []).reduce((a, x) => a + n(x.principal), 0));
  const loanInterest = r2(slips.flatMap((s) => (s.emis as Rec[]) ?? []).reduce((a, x) => a + n(x.interest), 0));
  const statutoryDed = r2(n(run.totalDeductions) - loanPrincipal - loanInterest);
  const period = `${run.periodYear}-${String(run.periodMonth).padStart(2, "0")}`;
  const lines: JournalLine[] = [
    { accountId: acc.salary(), memo: `Payroll ${period}`, debit: n(run.totalGross), credit: 0 },
    { accountId: acc.payable(), memo: "Net pay", debit: 0, credit: n(run.totalNet) },
    ...(statutoryDed ? [{ accountId: acc.deductions(), memo: "Statutory & other deductions", debit: 0, credit: statutoryDed }] : []),
    ...(loanPrincipal ? [{ accountId: acc.loans(), memo: "Loan EMI principal", debit: 0, credit: loanPrincipal }] : []),
    ...(loanInterest ? [{ accountId: acc.interest(), memo: "Loan EMI interest", debit: 0, credit: loanInterest }] : []),
  ];
  const je = createJournal({ date: String(run.periodEnd), description: `Payroll ${run.runNumber} (${period})`, status: "POSTED", source: "Payroll", lines });
  // Loan repayments are recorded once the run hits the books.
  for (const s of slips) for (const x of (s.emis as Rec[]) ?? []) {
    const l = readCollection("employee-loans").find((y) => y.id === x.loanId);
    if (!l) continue;
    const reps = [...((l.repayments as Rec[]) ?? []), { runId, date: run.periodEnd, principal: n(x.principal), interest: n(x.interest) }];
    updateRecord("employee-loans", l.id, { repayments: reps, status: n(l.principal) - reps.reduce((a, p) => a + n(p.principal), 0) <= 0.005 ? "COMPLETED" : "ACTIVE" });
  }
  // GCC air-ticket provision: an employer cost accrued monthly per employee on the run.
  const air = hrSettings().airTicket;
  if (hrSettings().country === "GCC" && air.enabled && air.value > 0 && air.frequency > 0 && slips.length) {
    const amt = r2((air.value / air.frequency) * slips.length);
    createJournal({ date: String(run.periodEnd), description: `Air-ticket provision ${period}`, status: "POSTED", source: "Payroll", lines: [{ accountId: acc.salary(), memo: "Air-ticket accrual", debit: amt, credit: 0 }, { accountId: acc.airTicket(), debit: 0, credit: amt }] });
  }
  for (const s of slips) updateRecord("payslips", s.id, { status: "FINALIZED" });
  updateRecord("payroll-runs", runId, { status: "POSTED", journalId: je.id, postedAt: new Date().toISOString() });
}

export function payRun(runId: string) {
  const run = readCollection("payroll-runs").find((r) => r.id === runId)!;
  createJournal({ date: todayIso(), description: `Salaries paid — ${run.runNumber}`, status: "POSTED", source: "Payroll", lines: [{ accountId: acc.payable(), debit: n(run.totalNet), credit: 0 }, { accountId: acc.bank(), debit: 0, credit: n(run.totalNet) }] });
  for (const s of runPayslips(runId)) updateRecord("payslips", s.id, { status: "PAID" });
  updateRecord("payroll-runs", runId, { status: "PAID", paidAt: new Date().toISOString() });
}

// Bank disbursement files built from the run's payslips (one credit per employee).
export function bankFile(runId: string, format: "nacha" | "sepa" | "csv") {
  const run = readCollection("payroll-runs").find((r) => r.id === runId)!;
  const slips = runPayslips(runId);
  const date = todayIso().replace(/-/g, "");
  if (format === "csv") return ["Employee Number,Employee Name,IBAN,Amount,Reference", ...slips.map((s) => `${s.employeeNumber},"${s.employeeName}",${s.iban ?? ""},${n(s.netAmount).toFixed(2)},${run.runNumber}`)].join("\n");
  if (format === "sepa") {
    const tx = slips.map((s, i) => `  <CdtTrfTxInf><PmtId><EndToEndId>${run.runNumber}-${i + 1}</EndToEndId></PmtId><Amt><InstdAmt Ccy="USD">${n(s.netAmount).toFixed(2)}</InstdAmt></Amt><Cdtr><Nm>${s.employeeName}</Nm></Cdtr><CdtrAcct><Id><IBAN>${s.iban ?? ""}</IBAN></Id></CdtrAcct><RmtInf><Ustrd>Salary ${run.periodYear}-${run.periodMonth}</Ustrd></RmtInf></CdtTrfTxInf>`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:pain.001.001.03"><CstmrCdtTrfInitn>\n <GrpHdr><MsgId>${run.runNumber}</MsgId><CreDtTm>${new Date().toISOString()}</CreDtTm><NbOfTxs>${slips.length}</NbOfTxs><CtrlSum>${n(run.totalNet).toFixed(2)}</CtrlSum></GrpHdr>\n <PmtInf>\n${tx.join("\n")}\n </PmtInf>\n</CstmrCdtTrfInitn></Document>`;
  }
  const pad = (s: unknown, l: number, c = " ", left = false) => (left ? String(s ?? "").padStart(l, c) : String(s ?? "").padEnd(l, c)).slice(0, l);
  const entries = slips.map((s, i) => `622${pad("", 9, "0")}${pad(s.iban ?? "", 17)}${pad(Math.round(n(s.netAmount) * 100), 10, "0", true)}${pad(s.employeeNumber, 15)}${pad(s.employeeName, 22)}  0${pad(i + 1, 15, "0", true)}`);
  return [`101 ${pad("", 9, "0")} ${pad("", 9, "0")}${date.slice(2)}0000A094101${pad("BANK", 23)}${pad("TAX GO", 23)}${pad("", 8)}`, `5220${pad("TAX GO", 16)}${pad("", 20)}${pad("", 10, "0")}PPDPAYROLL   ${date.slice(2)}${date.slice(2)}   1${pad("", 8, "0")}0000001`, ...entries, `8220${pad(slips.length, 6, "0", true)}${pad("", 10, "0")}${pad("", 12, "0")}${pad(Math.round(n(run.totalNet) * 100), 12, "0", true)}`, `9000001000001${pad(slips.length, 8, "0", true)}`].join("\n");
}

/* ---------- expense claims ---------- */

export const CLAIM_CATEGORIES = ["TRAVEL", "MEAL", "ACCOMMODATION", "OFFICE", "OTHER"];
const CLAIM_ACCOUNT: Record<string, [string, string]> = { TRAVEL: ["5800", "Travel & Transportation"], MEAL: ["5410", "Business Development"], ACCOMMODATION: ["5800", "Travel & Transportation"], OFFICE: ["5300", "Office Supplies"], OTHER: ["6000", "Miscellaneous Expenses"] };

export function reimburseClaim(id: string) {
  const c = readCollection("expense-claims").find((x) => x.id === id)!;
  const byAcc = new Map<string, number>();
  for (const l of (c.items as Rec[]) ?? []) { const [code, name] = CLAIM_ACCOUNT[String(l.category)] ?? CLAIM_ACCOUNT.OTHER; const a = account(code, name, "EXPENSE", "DEBIT"); byAcc.set(a, (byAcc.get(a) ?? 0) + n(l.amount)); }
  createJournal({ date: todayIso(), description: `Expense claim ${c.claimNumber} reimbursed`, status: "POSTED", source: "Expense Claim", lines: [...[...byAcc].map(([accountId, v]) => ({ accountId, memo: String(c.claimNumber), debit: r2(v), credit: 0 })), { accountId: acc.bank(), debit: 0, credit: n(c.totalAmount) }] });
  updateRecord("expense-claims", id, { status: "REIMBURSED", reimbursedAt: todayIso() });
}

/* ---------- declarations ---------- */

export const SECTIONS = [
  { code: "80C", description: "PPF, ELSS, LIC, EPF, principal on home loan", max: 150000, regime: "OLD" },
  { code: "80CCD(1B)", description: "Additional NPS contribution", max: 50000, regime: "OLD" },
  { code: "80D", description: "Medical insurance premium", max: 25000, regime: "OLD" },
  { code: "80E", description: "Interest on education loan", max: 0, regime: "OLD" },
  { code: "80G", description: "Donations to approved funds", max: 0, regime: "OLD" },
  { code: "80TTA", description: "Savings account interest", max: 10000, regime: "OLD" },
  { code: "24(b)", description: "Interest on housing loan (self-occupied)", max: 200000, regime: "OLD" },
  { code: "HRA", description: "House rent allowance exemption", max: 0, regime: "OLD" },
  { code: "LTA", description: "Leave travel allowance", max: 0, regime: "OLD" },
  { code: "80CCD(2)", description: "Employer NPS contribution", max: 0, regime: "BOTH" },
];

/* ---------- full & final ---------- */

export function computeFnf(employeeId: string, separationDate: string, noticeServed: number) {
  const e = readCollection("employees").find((x) => x.id === employeeId)!;
  const basic = n(currentSalary(employeeId)?.basic);
  const daily = basic / 30;
  const years = (new Date(`${separationDate}T00:00:00`).getTime() - new Date(`${e.dateOfJoining}T00:00:00`).getTime()) / (365.25 * 86400000);
  const country = hrSettings().country;
  // India: 15/26 of monthly basic per year after 5 years. GCC: 21 days a year for the first 5 years, 30 after (min 1 year).
  const gratuity = country === "INDIA" ? (years >= 5 ? (basic * 15 / 26) * Math.floor(years) : 0) : country === "GCC" ? (years >= 1 ? daily * (21 * Math.min(years, 5) + 30 * Math.max(0, years - 5)) : 0) : 0;
  const annual = leaveBalances(employeeId).find((b) => /annual|earned/i.test(b.name));
  const encashDays = Math.max(0, annual?.balance ?? 0);
  const noticeShort = Math.max(0, n(e.noticeDays) - noticeServed);
  const reimb = readCollection("expense-claims").filter((c) => c.employeeId === employeeId && c.status === "APPROVED").reduce((a, c) => a + n(c.totalAmount), 0);
  const loans = readCollection("employee-loans").filter((l) => l.employeeId === employeeId && l.status === "ACTIVE").reduce((a, l) => a + loanOutstanding(l), 0);
  const res = { gratuityAmount: r2(gratuity), leaveEncashmentDays: encashDays, leaveEncashmentAmount: r2(encashDays * daily), pendingReimbursementAmount: r2(reimb), noticeRecoveryDays: noticeShort, noticeRecoveryAmount: r2(noticeShort * daily), loanRecoveryAmount: r2(loans), yearsOfService: Math.round(years * 100) / 100 };
  const payable = res.gratuityAmount + res.leaveEncashmentAmount + res.pendingReimbursementAmount;
  const recoverable = res.noticeRecoveryAmount + res.loanRecoveryAmount;
  return { ...res, payable: r2(payable), recoverable: r2(recoverable), net: r2(payable - recoverable) };
}

export function createFnf(f: { employeeId: string; separationDate: string; separationReason?: string; noticeServed: number }) {
  return createRecord("fnf", { ...f, ...computeFnf(f.employeeId, f.separationDate, f.noticeServed), fnfNumber: nextNumber("fnf", "FNF"), status: "draft" });
}

// Processing books the settlement and closes the employee's loans and approved claims.
export function processFnf(id: string) {
  const s = readCollection("fnf").find((x) => x.id === id)!;
  const lines: JournalLine[] = [];
  const cost = n(s.gratuityAmount) + n(s.leaveEncashmentAmount);
  if (cost) lines.push({ accountId: acc.salary(), memo: "Gratuity & leave encashment", debit: r2(cost), credit: 0 });
  if (n(s.pendingReimbursementAmount)) lines.push({ accountId: account("6000", "Miscellaneous Expenses", "EXPENSE", "DEBIT"), memo: "Pending reimbursements", debit: n(s.pendingReimbursementAmount), credit: 0 });
  if (n(s.loanRecoveryAmount)) lines.push({ accountId: acc.loans(), memo: "Loan recovery", debit: 0, credit: n(s.loanRecoveryAmount) });
  if (n(s.noticeRecoveryAmount)) lines.push({ accountId: account("4100", "Other Income", "REVENUE", "CREDIT"), memo: "Notice recovery", debit: 0, credit: n(s.noticeRecoveryAmount) });
  if (n(s.net) > 0) lines.push({ accountId: acc.payable(), memo: "FNF payable", debit: 0, credit: n(s.net) });
  else if (n(s.net) < 0) lines.push({ accountId: account("1200", "Accounts Receivable", "ASSET", "DEBIT"), memo: "FNF recoverable from employee", debit: -n(s.net), credit: 0 });
  if (lines.length >= 2) createJournal({ date: String(s.separationDate), description: `Full & final ${s.fnfNumber}`, status: "POSTED", source: "Payroll", lines });
  for (const l of readCollection("employee-loans").filter((x) => x.employeeId === s.employeeId && x.status === "ACTIVE")) updateRecord("employee-loans", l.id, { status: "CLOSED", repayments: [...((l.repayments as Rec[]) ?? []), { date: s.separationDate, principal: loanOutstanding(l), interest: 0, fnf: s.fnfNumber }] });
  for (const c of readCollection("expense-claims").filter((x) => x.employeeId === s.employeeId && x.status === "APPROVED")) updateRecord("expense-claims", c.id, { status: "REIMBURSED", reimbursedAt: s.separationDate, viaFnf: s.fnfNumber });
  const e = readCollection("employees").find((x) => x.id === s.employeeId);
  if (e && !["RESIGNED", "TERMINATED"].includes(String(e.status))) updateEmployee(String(s.employeeId), { status: /terminat/i.test(String(s.separationReason ?? "")) ? "TERMINATED" : "RESIGNED", dateOfLeaving: s.separationDate }, String(s.separationDate));
  updateRecord("fnf", id, { status: "processed", processedAt: todayIso() });
}

export function payFnf(id: string) {
  const s = readCollection("fnf").find((x) => x.id === id)!;
  if (n(s.net) > 0) createJournal({ date: todayIso(), description: `FNF paid — ${s.fnfNumber}`, status: "POSTED", source: "Payroll", lines: [{ accountId: acc.payable(), debit: n(s.net), credit: 0 }, { accountId: acc.bank(), debit: 0, credit: n(s.net) }] });
  updateRecord("fnf", id, { status: "paid", paidAt: todayIso() });
}

/* ---------- statutory files ---------- */

export function periodPayslips(year: number, month: number) {
  const runs = readCollection("payroll-runs").filter((r) => n(r.periodYear) === year && n(r.periodMonth) === month && ["POSTED", "PAID"].includes(String(r.status)));
  return runs.flatMap((r) => runPayslips(r.id));
}

export function wpsSif(year: number, month: number, est: string, routing: string) {
  const slips = periodPayslips(year, month);
  const emps = readCollection("employees");
  const ym = `${String(month).padStart(2, "0")}${year}`;
  const edr = slips.map((s) => { const e = emps.find((x) => x.id === s.employeeId); const fixed = n(s.basicSalary); const variable = n(s.grossAmount) - fixed; return ["EDR", e?.labourCardNo ?? e?.employeeNumber ?? "", routing, e?.iban ?? "", `${year}-${String(month).padStart(2, "0")}-01`, `${year}-${String(month).padStart(2, "0")}-${new Date(year, month, 0).getDate()}`, s.workingDays, fixed.toFixed(2), Math.max(0, variable).toFixed(2), n(s.lopDays)].join(","); });
  const total = slips.reduce((a, s) => a + n(s.netAmount), 0);
  return [...edr, ["SCR", est, routing, todayIso(), new Date().toTimeString().slice(0, 5).replace(":", ""), ym, slips.length, total.toFixed(2), "USD", ""].join(",")].join("\n");
}

export function form24q(fy: string, quarter: number) {
  const startYear = Number(fy.slice(0, 4));
  const months = [[4, 5, 6], [7, 8, 9], [10, 11, 12], [1, 2, 3]][quarter - 1];
  const rows = months.flatMap((m) => periodPayslips(m >= 4 ? startYear : startYear + 1, m));
  const emps = readCollection("employees");
  return ["FH|NS1|R|" + todayIso() + "|1|24Q|" + fy + "|Q" + quarter, ...rows.map((s, i) => { const e = emps.find((x) => x.id === s.employeeId); return ["DD", i + 1, e?.nationalId ?? "PANNOTAVBL", s.employeeName, n(s.grossAmount).toFixed(2), n(s.incomeTaxDeducted).toFixed(2), String(s.createdAt).slice(0, 10)].join("|"); })].join("\n");
}

export function pfEcr(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const emps = readCollection("employees");
  return periodPayslips(y, m).filter((s) => n(s.pfEmployeeContribution)).map((s) => { const e = emps.find((x) => x.id === s.employeeId); const wages = Math.min(n(s.basicSalary), 15000); return [e?.nationalId ?? "", s.employeeName, Math.round(n(s.grossAmount)), Math.round(n(s.basicSalary)), Math.round(wages), Math.round(wages), Math.round(n(s.pfEmployeeContribution)), Math.round(wages * 0.0367), Math.round(wages * 0.0833), n(s.lopDays), 0].join("#~#"); }).join("\n");
}

export function esiReturn(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  const emps = readCollection("employees");
  return ["IP Number,IP Name,No of Days,Total Monthly Wages,Employee Contribution,Employer Contribution", ...periodPayslips(y, m).filter((s) => n(s.esiEmployeeContribution)).map((s) => { const e = emps.find((x) => x.id === s.employeeId); return [e?.nationalId ?? "", `"${s.employeeName}"`, n(s.daysWorked), n(s.grossAmount).toFixed(2), n(s.esiEmployeeContribution).toFixed(2), (n(s.grossAmount) * 0.0325).toFixed(2)].join(","); })].join("\n");
}
