"use client";

// Banking & cash: accounts linked to GL accounts, receipt/payment vouchers (recorded, then approved
// onto the ledger), imported statement lines worked through the Bank Inbox (match a customer
// receipt or vendor payment, categorize, fee, interest — or exclude), bank rules with suggestions,
// reconciliation against the bank's GL account, cheques and the document inbox.

import { createRecord, nextNumber, readCollection, seedCollection, updateRecord, type Rec } from "@/lib/store";
import { SEED_ACCOUNTS, SEED_BANK_ACCOUNTS } from "@/lib/accounting-seed";
import { balancesFrom, createJournal, findAccountByCode, reverseJournal, type JournalLine } from "@/lib/ledger";
import { createInvoice, recordPayment, outstanding } from "@/lib/sales";
import { billOpen, billOutstanding, createBill, payVendor } from "@/lib/purchases";

const n = (v: unknown) => Number(v ?? 0) || 0;
const r3 = (v: number) => Math.round(v * 1000) / 1000;
export const todayIso = () => new Date().toISOString().slice(0, 10);
const accId = (code: string) => findAccountByCode(code)?.id ?? "";

/* ---------- accounts ---------- */

export function seedBanking() {
  seedCollection("bank-accounts", SEED_BANK_ACCOUNTS);
  seedCollection("accounts", SEED_ACCOUNTS);
}
export const bankGl = (b?: Rec) => String(b?.glAccountId || accId("1100"));
export const cashGl = (c?: Rec) => String(c?.glAccountId || accId("1000"));

export function glBalance(accountId: string, upTo?: string) {
  const journals = readCollection("journal-entries").filter((j) => !upTo || String(j.date) <= upTo);
  return r3(balancesFrom(readCollection("accounts"), journals).get(accountId) ?? 0);
}

/* ---------- vouchers (bank & cash) ---------- */

export type Direction = "RECEIPT" | "PAYMENT";
type VoucherInput = { date: string; direction: Direction; categoryId: string; accountKind: "ACCOUNT" | "CUSTOMER" | "VENDOR"; accountId: string; amount: number; description?: string };

// Recorded as pending; approving puts it on the ledger.
export function createVoucher(kind: "bank" | "cash", holderId: string, v: VoucherInput) {
  const coll = kind === "bank" ? "bank-transactions" : "cash-transactions";
  const prefix = v.direction === "RECEIPT" ? "RCPT" : "PAY";
  const voucherNo = `${prefix}-${String(readCollection(coll).filter((t) => String(t.voucherNo ?? "").startsWith(prefix)).length + 1).padStart(4, "0")}`;
  return createRecord(coll, { [kind === "bank" ? "bankAccountId" : "cashAccountId"]: holderId, date: v.date, transactionDate: v.date, description: v.description, amount: v.direction === "RECEIPT" ? r3(v.amount) : -r3(v.amount), direction: v.direction, type: v.direction === "RECEIPT" ? "DEPOSIT" : "WITHDRAWAL", categoryId: v.categoryId, accountKind: v.accountKind, counterAccountId: v.accountId, voucherNo, reference: voucherNo, source: "VOUCHER", postingState: "PENDING", status: "UNRECONCILED" });
}

export function approveVoucher(kind: "bank" | "cash", id: string) {
  const coll = kind === "bank" ? "bank-transactions" : "cash-transactions";
  const t = readCollection(coll).find((x) => x.id === id)!;
  const holder = readCollection(kind === "bank" ? "bank-accounts" : "cash-accounts").find((x) => x.id === (t.bankAccountId ?? t.cashAccountId));
  const gl = kind === "bank" ? bankGl(holder) : cashGl(holder);
  const amt = Math.abs(n(t.amount));
  const receipt = n(t.amount) > 0;
  let journalId: string | undefined;
  if (t.accountKind === "CUSTOMER") {
    const c = readCollection("customers").find((x) => x.id === t.counterAccountId);
    journalId = String(recordPayment({ customer: String(c?.name ?? ""), date: String(t.date), amount: amt, method: kind === "cash" ? "Cash" : "Bank Transfer", reference: String(t.voucherNo), cashAccountId: gl }).journalId);
  } else if (t.accountKind === "VENDOR") {
    const v = readCollection("vendors").find((x) => x.id === t.counterAccountId);
    journalId = String(payVendor({ vendor: String(v?.name ?? ""), date: String(t.date), amount: amt, method: kind === "cash" ? "Cash" : "Bank Transfer", reference: String(t.voucherNo), cashAccountId: gl }).journalId);
  } else {
    const lines: JournalLine[] = receipt ? [{ accountId: gl, debit: amt, credit: 0 }, { accountId: String(t.counterAccountId), memo: String(t.description ?? ""), debit: 0, credit: amt }] : [{ accountId: String(t.counterAccountId), memo: String(t.description ?? ""), debit: amt, credit: 0 }, { accountId: gl, debit: 0, credit: amt }];
    journalId = createJournal({ date: String(t.date), description: `${t.voucherNo} — ${t.description || (receipt ? "Receipt" : "Payment")}`, status: "POSTED", source: kind === "bank" ? "Bank Voucher" : "Cash Voucher", lines }).id;
  }
  updateRecord(coll, id, { postingState: "POSTED", journalId, approvedAt: new Date().toISOString() });
}

export function accountBalance(kind: "bank" | "cash", holder: Rec) {
  const coll = kind === "bank" ? "bank-transactions" : "cash-transactions";
  const key = kind === "bank" ? "bankAccountId" : "cashAccountId";
  return r3(n(holder.openingBalance) + readCollection(coll).filter((t) => t[key] === holder.id && t.inboxState !== "EXCLUDED" && !t.deleted).reduce((a, t) => a + n(t.amount), 0));
}

/* ---------- statement import ---------- */

export type StatementLine = { date: string; description: string; amount: number; reference?: string };

export function importStatement(bankAccountId: string, fileName: string, lines: StatementLine[]) {
  const batch = createRecord("bank-imports", { bankAccountId, fileName, rows: lines.length, importedAt: new Date().toISOString(), status: "IMPORTED" });
  for (const l of lines) createRecord("bank-transactions", { bankAccountId, date: l.date, transactionDate: l.date, description: l.description, amount: r3(l.amount), type: l.amount >= 0 ? "DEPOSIT" : "WITHDRAWAL", reference: l.reference, source: "IMPORT", importId: batch.id, inboxState: "FOR_REVIEW", postingState: "NONE", status: "UNRECONCILED" });
  return batch;
}

export function undoImport(batchId: string) {
  const lines = readCollection("bank-transactions").filter((t) => t.importId === batchId);
  if (lines.some((t) => t.inboxState === "DONE")) throw new Error("Some lines are already booked — unbook them first");
  for (const t of lines) updateRecord("bank-transactions", t.id, { deleted: true });
  updateRecord("bank-imports", batchId, { status: "UNDONE" });
}

/* ---------- inbox: rules, suggestions, actions ---------- */

export type Action = "RECEIVE_CUSTOMER" | "PAY_VENDOR" | "CATEGORIZE" | "BANK_FEE" | "BANK_INTEREST";
export type Suggestion = { action: Action; targetId?: string; confidence: number; reason: string; ruleId?: string; autoApply?: boolean };

export function agentSettings() {
  const r = readCollection("bank-agent")[0];
  return { mode: "SAFE", maxAuto: null as number | null, ...((r?.value as object) ?? {}) } as { mode: "MANUAL" | "SAFE"; maxAuto: number | null };
}
export function saveAgentSettings(v: { mode: string; maxAuto: number | null }) {
  const r = readCollection("bank-agent")[0];
  if (r) updateRecord("bank-agent", r.id, { value: v }); else createRecord("bank-agent", { value: v });
}

// A rule match wins; otherwise an open invoice/bill with the exact amount (and its number or the
// party's name in the description) is proposed; fee/interest wording is recognised.
export function suggest(t: Rec): Suggestion | null {
  const desc = String(t.description ?? "").toLowerCase();
  const amt = n(t.amount);
  for (const r of readCollection("bank-rules")) {
    if (!desc.includes(String(r.match ?? "").toLowerCase())) continue;
    if ((r.direction === "IN" && amt < 0) || (r.direction === "OUT" && amt > 0)) continue;
    return { action: r.action as Action, targetId: String(r.targetId ?? ""), confidence: 0.99, reason: `Rule “${r.name}”`, ruleId: r.id, autoApply: Boolean(r.autoApply) };
  }
  if (amt > 0) {
    const inv = readCollection("invoices").filter((i) => ["UNPAID", "PARTIAL"].includes(String(i.status)) && Math.abs(outstanding(i) - amt) < 0.005);
    const named = inv.find((i) => desc.includes(String(i.number).toLowerCase()) || desc.includes(String(i.customer).toLowerCase()));
    const pick = named ?? (inv.length === 1 ? inv[0] : undefined);
    if (pick) { const c = readCollection("customers").find((x) => x.name === pick.customer); if (c) return { action: "RECEIVE_CUSTOMER", targetId: c.id, confidence: named ? 0.97 : 0.8, reason: `Matches ${pick.number} (${pick.customer})` }; }
    if (/interest/.test(desc)) return { action: "BANK_INTEREST", confidence: 0.9, reason: "Looks like bank interest" };
  } else {
    const bills = readCollection("bills").filter((b) => billOpen(b) && Math.abs(billOutstanding(b) + amt) < 0.005);
    const named = bills.find((b) => desc.includes(String(b.number).toLowerCase()) || desc.includes(String(b.vendor).toLowerCase()));
    const pick = named ?? (bills.length === 1 ? bills[0] : undefined);
    if (pick) { const v = readCollection("vendors").find((x) => x.name === pick.vendor); if (v) return { action: "PAY_VENDOR", targetId: v.id, confidence: named ? 0.97 : 0.8, reason: `Matches ${pick.number} (${pick.vendor})` }; }
    if (/fee|charge|commission/.test(desc)) return { action: "BANK_FEE", confidence: 0.9, reason: "Looks like a bank charge" };
  }
  return null;
}

export function applyLine(id: string, s: { action: Action; targetId?: string }, remember?: { name: string; match: string; autoApply: boolean }) {
  const t = readCollection("bank-transactions").find((x) => x.id === id)!;
  const bank = readCollection("bank-accounts").find((b) => b.id === t.bankAccountId);
  const gl = bankGl(bank);
  const amt = Math.abs(n(t.amount));
  const date = String(t.date);
  let journalId: string;
  let link: Record<string, unknown> = {};
  if (s.action === "RECEIVE_CUSTOMER") {
    const c = readCollection("customers").find((x) => x.id === s.targetId);
    if (!c) throw new Error("Pick a customer");
    const p = recordPayment({ customer: String(c.name), date, amount: amt, method: "Bank Transfer", reference: String(t.reference ?? t.description ?? ""), cashAccountId: gl });
    journalId = String(p.journalId); link = { arPaymentId: p.id };
  } else if (s.action === "PAY_VENDOR") {
    const v = readCollection("vendors").find((x) => x.id === s.targetId);
    if (!v) throw new Error("Pick a vendor");
    const p = payVendor({ vendor: String(v.name), date, amount: amt, method: "Bank Transfer", reference: String(t.reference ?? t.description ?? ""), cashAccountId: gl });
    journalId = String(p.journalId); link = { apPaymentId: p.id };
  } else {
    const other = s.action === "BANK_FEE" ? accId("5900") : s.action === "BANK_INTEREST" ? accId("4200") : String(s.targetId ?? "");
    if (!other) throw new Error("Pick an account");
    const lines: JournalLine[] = n(t.amount) > 0 ? [{ accountId: gl, debit: amt, credit: 0 }, { accountId: other, memo: String(t.description ?? ""), debit: 0, credit: amt }] : [{ accountId: other, memo: String(t.description ?? ""), debit: amt, credit: 0 }, { accountId: gl, debit: 0, credit: amt }];
    journalId = createJournal({ date, description: `Bank: ${t.description}`, status: "POSTED", source: "Bank Inbox", lines }).id;
  }
  updateRecord("bank-transactions", id, { inboxState: "DONE", postingState: "POSTED", journalId, appliedAction: s.action, appliedTargetId: s.targetId, ...link });
  if (remember?.match) createRecord("bank-rules", { name: remember.name || remember.match, match: remember.match, direction: n(t.amount) > 0 ? "IN" : "OUT", action: s.action, targetId: s.targetId, autoApply: remember.autoApply });
}

export function unbookLine(id: string) {
  const t = readCollection("bank-transactions").find((x) => x.id === id)!;
  if (t.status === "RECONCILED") throw new Error("Reconciled lines can't be unbooked — void the reconciliation first");
  const je = readCollection("journal-entries").find((j) => j.id === t.journalId);
  if (je) reverseJournal(je, todayIso());
  // A receipt/payment that settled documents is reversed above; the allocations are released too.
  if (t.arPaymentId) { const p = readCollection("ar-payments").find((x) => x.id === t.arPaymentId); for (const a of (p?.allocations as Rec[]) ?? []) { const inv = readCollection("invoices").find((i) => i.id === a.invoiceId); if (inv) updateRecord("invoices", inv.id, { amountPaid: r3(n(inv.amountPaid) - n(a.amount)), status: n(inv.amountPaid) - n(a.amount) <= 0.005 ? "UNPAID" : "PARTIAL" }); } }
  if (t.apPaymentId) { const p = readCollection("ap-payments").find((x) => x.id === t.apPaymentId); for (const a of (p?.allocations as Rec[]) ?? []) { const b = readCollection("bills").find((x) => x.id === a.billId); if (b) updateRecord("bills", b.id, { amountPaid: r3(n(b.amountPaid) - n(a.amount)), status: n(b.amountPaid) - n(a.amount) <= 0.005 ? "APPROVED" : "PARTIALLY_PAID" }); } }
  updateRecord("bank-transactions", id, { inboxState: t.source === "IMPORT" ? "FOR_REVIEW" : t.inboxState, postingState: t.source === "IMPORT" ? "NONE" : "PENDING", reversedJournalId: t.journalId, journalId: null, appliedAction: null });
}

// Auto-pilot: in Safe mode apply rule matches marked auto-apply, or suggestions ≥ 95% confidence,
// within the amount cap. Manual mode only suggests.
export function autopilot(bankAccountId: string) {
  const s = agentSettings();
  let applied = 0, left = 0;
  for (const t of readCollection("bank-transactions").filter((x) => x.bankAccountId === bankAccountId && x.inboxState === "FOR_REVIEW" && !x.deleted)) {
    const sug = suggest(t);
    const ok = s.mode === "SAFE" && sug && (sug.autoApply || sug.confidence >= 0.95) && (s.maxAuto == null || Math.abs(n(t.amount)) <= s.maxAuto) && (sug.action === "BANK_FEE" || sug.action === "BANK_INTEREST" || sug.targetId);
    if (ok) { try { applyLine(t.id, sug!); applied++; } catch { left++; } } else left++;
  }
  return { applied, left };
}

/* ---------- reconciliation ---------- */

export function startReconciliation(r: { bankAccountId: string; periodStart: string; periodEnd: string; statementBalance: number }) {
  return createRecord("reconciliations", { ...r, recNumber: nextNumber("reconciliations", "REC"), status: "IN_PROGRESS", matches: [], adjustments: [] });
}

// Journal lines on the bank's GL account in the period that aren't already matched.
export function glLinesFor(rec: Rec) {
  const bank = readCollection("bank-accounts").find((b) => b.id === rec.bankAccountId);
  const gl = bankGl(bank);
  const used = new Set(readCollection("reconciliations").filter((r) => r.status !== "VOIDED").flatMap((r) => ((r.matches as Rec[]) ?? []).map((m) => String(m.lineKey))));
  // A reversed entry and its reversal cancel out, so neither is a match candidate.
  return readCollection("journal-entries").filter((j) => j.status === "POSTED" && !j.reversalOf && String(j.date) >= String(rec.periodStart) && String(j.date) <= String(rec.periodEnd)).flatMap((j) => ((j.lines as Rec[]) ?? []).map((l, i) => ({ key: `${j.id}:${i}`, journalId: j.id, number: j.number, date: String(j.date), description: String(j.description), memo: l.memo, amount: r3(n(l.debit) - n(l.credit)), accountId: l.accountId }))).filter((l) => l.accountId === gl && !used.has(l.key));
}

export function reconSummary(rec: Rec) {
  const bank = readCollection("bank-accounts").find((b) => b.id === rec.bankAccountId);
  const gl = glBalance(bankGl(bank), String(rec.periodEnd));
  const adj = ((rec.adjustments as Rec[]) ?? []).filter((a) => !a.posted).reduce((a, x) => a + (x.type === "INTEREST" ? n(x.amount) : -n(x.amount)), 0);
  return { gl, adjustedGl: r3(gl + adj), difference: r3(n(rec.statementBalance) - gl - adj) };
}

export function completeReconciliation(id: string) {
  const rec = readCollection("reconciliations").find((r) => r.id === id)!;
  const bank = readCollection("bank-accounts").find((b) => b.id === rec.bankAccountId);
  const gl = bankGl(bank);
  for (const a of ((rec.adjustments as Rec[]) ?? []).filter((x) => !x.posted)) {
    const interest = a.type === "INTEREST";
    const other = interest ? accId("4200") : accId("5900");
    createJournal({ date: String(rec.periodEnd), description: `${rec.recNumber} — ${interest ? "Bank interest" : "Bank fee"}${a.memo ? `: ${a.memo}` : ""}`, status: "POSTED", source: "Reconciliation", lines: interest ? [{ accountId: gl, debit: n(a.amount), credit: 0 }, { accountId: other, debit: 0, credit: n(a.amount) }] : [{ accountId: other, debit: n(a.amount), credit: 0 }, { accountId: gl, debit: 0, credit: n(a.amount) }] });
  }
  for (const m of (rec.matches as Rec[]) ?? []) updateRecord("bank-transactions", String(m.txnId), { status: "RECONCILED", reconciliationId: id });
  updateRecord("reconciliations", id, { status: "COMPLETED", completedAt: todayIso(), adjustments: ((rec.adjustments as Rec[]) ?? []).map((a) => ({ ...a, posted: true })), glBalance: reconSummary(rec).gl });
}

export function voidReconciliation(id: string) {
  const rec = readCollection("reconciliations").find((r) => r.id === id)!;
  for (const m of (rec.matches as Rec[]) ?? []) updateRecord("bank-transactions", String(m.txnId), { status: "UNRECONCILED", reconciliationId: null });
  updateRecord("reconciliations", id, { status: "VOIDED", matches: [] });
}

// Candidate journal lines for one statement line: same amount, on the bank's GL, in the period.
export function matchCandidates(rec: Rec, txn: Rec) {
  return glLinesFor(rec).filter((l) => Math.abs(l.amount - n(txn.amount)) < 0.005);
}

export function matchTxn(recId: string, txnId: string, lineKey: string) {
  const rec = readCollection("reconciliations").find((r) => r.id === recId)!;
  updateRecord("reconciliations", recId, { matches: [...((rec.matches as Rec[]) ?? []).filter((m) => m.txnId !== txnId), { txnId, lineKey }] });
  updateRecord("bank-transactions", txnId, { status: "MATCHED" });
}

export function unmatchTxn(recId: string, txnId: string) {
  const rec = readCollection("reconciliations").find((r) => r.id === recId)!;
  updateRecord("reconciliations", recId, { matches: ((rec.matches as Rec[]) ?? []).filter((m) => m.txnId !== txnId) });
  updateRecord("bank-transactions", txnId, { status: "UNRECONCILED" });
}

/* ---------- cheques (register only — the money moves through vouchers / receipts) ---------- */

export function createChequeBook(b: { bankAccountId: string; prefix: string; start: number; end: number }) {
  if (!b.bankAccountId) throw new Error("Pick a bank account");
  if (!(b.start > 0) || !(b.end >= b.start)) throw new Error("End number must be on or after the start number");
  return createRecord("cheque-books", { ...b, next: b.start, status: "ACTIVE" });
}

export function issueCheque(c: { bookId: string; payee: string; amount: number; memo?: string; date?: string }) {
  const book = readCollection("cheque-books").find((b) => b.id === c.bookId);
  if (!book) throw new Error("Pick a cheque book");
  if (n(book.next) > n(book.end)) throw new Error("This cheque book is used up");
  if (!c.payee.trim() || !(c.amount > 0)) throw new Error("Payee and amount are required");
  const number = `${book.prefix ?? ""}${String(book.next).padStart(String(book.end).length, "0")}`;
  updateRecord("cheque-books", book.id, { next: n(book.next) + 1, status: n(book.next) + 1 > n(book.end) ? "EXHAUSTED" : "ACTIVE" });
  return createRecord("cheques", { direction: "ISSUED", bookId: book.id, bankAccountId: book.bankAccountId, number, payee: c.payee.trim(), amount: r3(c.amount), memo: c.memo, date: c.date ?? todayIso(), status: "ISSUED" });
}

export function recordReceivedCheque(c: { from: string; number: string; amount: number; chequeDate: string; bankAccountId: string }) {
  if (!c.from.trim() || !c.number.trim() || !(c.amount > 0) || !c.chequeDate) throw new Error("Payer, cheque number, amount and date are required");
  return createRecord("cheques", { direction: "RECEIVED", payee: c.from.trim(), number: c.number.trim(), amount: r3(c.amount), date: c.chequeDate, bankAccountId: c.bankAccountId, status: c.chequeDate > todayIso() ? "PDC" : "RECEIVED" });
}

export function createDepositSlip(s: { bankAccountId: string; date: string; cash: number; chequeIds: string[] }) {
  if (!s.bankAccountId) throw new Error("Pick the bank account");
  const cheques = readCollection("cheques").filter((c) => s.chequeIds.includes(c.id));
  if (!cheques.length && !(s.cash > 0)) throw new Error("Add cash or at least one cheque");
  const slip = createRecord("deposit-slips", { number: nextNumber("deposit-slips", "DS"), ...s, total: r3(s.cash + cheques.reduce((a, c) => a + n(c.amount), 0)) });
  for (const c of cheques) updateRecord("cheques", c.id, { status: "DEPOSITED", slipId: slip.id });
  return slip;
}

/* ---------- document inbox ---------- */

export const DOC_KINDS = [{ value: "BILL", label: "Vendor bill" }, { value: "EXPENSE", label: "Expense receipt (paid)" }, { value: "INVOICE", label: "Sales invoice" }, { value: "OTHER", label: "Other / keep only" }];

// No model behind this: classification reads the file name ("invoice", "receipt", amounts like 123.45).
export function classify(d: Rec) {
  const name = String(d.fileName ?? "").toLowerCase();
  const kind = /receipt|expense|fuel|taxi|meal/.test(name) ? "EXPENSE" : /sales|inv-?out|our-invoice/.test(name) ? "INVOICE" : /bill|invoice|inv/.test(name) ? "BILL" : String(d.kind || "");
  const amt = name.match(/(\d+[.,]\d{2})(?!\d)/);
  const flat = name.replace(/[^a-z0-9]+/g, " ");
  const parties = readCollection(kind === "INVOICE" ? "customers" : "vendors");
  const party = String(d.party || parties.find((x) => flat.includes(String(x.name).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()))?.name || "");
  return { kind, party, amount: n(d.amount) || (amt ? Number(amt[1].replace(",", ".")) : 0), confidence: kind ? (amt ? 0.9 : 0.6) + (party ? 0.06 : 0) : 0.2 };
}

export function duplicateOf(d: Rec) {
  return readCollection("documents").find((x) => x.id !== d.id && x.state !== "EXCLUDED" && ((x.fileName === d.fileName && x.size === d.size) || (d.number && x.number === d.number && x.party === d.party && n(x.amount) === n(d.amount))));
}

// Books the reviewed document: a bill (AP), a paid expense (Dr expense + input tax, Cr bank/cash) or a sales invoice.
export function bookDocument(id: string) {
  const d = readCollection("documents").find((x) => x.id === id)!;
  const amount = n(d.amount), tax = n(d.tax), net = r3(amount - tax);
  if (!(amount > 0)) throw new Error("Enter the total amount");
  const date = String(d.date || todayIso());
  const line = { description: String(d.description || d.fileName), qty: 1, unitPrice: net, discPct: 0, taxPct: net ? r3((tax / net) * 100) : 0 };
  let link: Record<string, unknown> = {};
  if (d.kind === "BILL") {
    if (!d.party) throw new Error("Pick the vendor");
    link = { billId: createBill({ vendor: String(d.party), date, dueDate: d.dueDate || date, billNo: d.number, lines: [{ ...line, accountId: String(d.accountId || accId("5300")) }] }).id };
  } else if (d.kind === "INVOICE") {
    if (!d.party) throw new Error("Pick the customer");
    link = { invoiceId: createInvoice({ customer: String(d.party), date, dueDate: d.dueDate || date, paymentMode: "Credit", lines: [line] }).id };
  } else if (d.kind === "EXPENSE") {
    const paidFrom = String(d.paidFrom || accId("1100"));
    const lines: JournalLine[] = [{ accountId: String(d.accountId || accId("6000")), memo: String(d.description || d.fileName), debit: net, credit: 0 }];
    if (tax) lines.push({ accountId: accId("1500"), memo: "Input tax", debit: tax, credit: 0 });
    lines.push({ accountId: paidFrom, debit: 0, credit: amount });
    link = { journalId: createJournal({ date, description: `Expense${d.party ? ` — ${d.party}` : ""}${d.number ? ` (${d.number})` : ""}`, status: "POSTED", source: "Document Inbox", lines }).id };
  }
  updateRecord("documents", id, { state: "BOOKED", bookedAt: new Date().toISOString(), ...link });
}
