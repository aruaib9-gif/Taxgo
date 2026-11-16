"use client";

// Double-entry helpers over the local store. Only POSTED entries move balances.

import { createRecord, nextNumber, readCollection, seedCollection, updateRecord, useCollection, type Rec } from "@/lib/store";
import { SEED_ACCOUNTS, SEED_BANK_ACCOUNTS, SEED_FISCAL_PERIODS, SEED_TAX_RATES, SEED_TAX_TYPES, type AccountType } from "@/lib/accounting-seed";

export type JournalLine = { accountId: string; memo?: string; debit: number; credit: number };
export type JournalStatus = "DRAFT" | "POSTED" | "REVERSED";

export const useAccounts = () => useCollection("accounts", SEED_ACCOUNTS);
export const useFiscalPeriods = () => useCollection("fiscal-periods", SEED_FISCAL_PERIODS);
export const useTaxTypes = () => useCollection("tax-types", SEED_TAX_TYPES);
export const useTaxRates = () => useCollection("tax-rates", SEED_TAX_RATES);
export const useBankAccounts = () => useCollection("bank-accounts", SEED_BANK_ACCOUNTS);
export const useJournals = () => useCollection("journal-entries");

// Leading code digit per type, used to suggest account codes.
export const TYPE_PREFIX: Record<AccountType, string> = { ASSET: "1", LIABILITY: "2", EQUITY: "3", REVENUE: "4", EXPENSE: "5" };
export const NORMAL_BALANCE: Record<AccountType, "DEBIT" | "CREDIT"> = { ASSET: "DEBIT", LIABILITY: "CREDIT", EQUITY: "CREDIT", REVENUE: "CREDIT", EXPENSE: "DEBIT" };
export const ACCOUNT_TYPES: AccountType[] = ["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"];

export const linesOf = (je: Rec) => (Array.isArray(je.lines) ? (je.lines as JournalLine[]) : []);
export const totalsOf = (lines: JournalLine[]) => ({
  debit: lines.reduce((s, l) => s + (Number(l.debit) || 0), 0),
  credit: lines.reduce((s, l) => s + (Number(l.credit) || 0), 0),
});
export const isBalanced = (lines: JournalLine[]) => {
  const t = totalsOf(lines);
  return t.debit > 0 && Math.abs(t.debit - t.credit) < 0.0005;
};

// A reversed entry stays on the books; its posted reversal is what offsets it.
export const onBooks = (je: Rec) => je.status === "POSTED" || je.status === "REVERSED";

// Signed balance per account id, in each account's normal-balance direction.
export function balancesFrom(accounts: Rec[], journals: Rec[]) {
  const raw = new Map<string, number>();
  for (const je of journals) {
    if (!onBooks(je)) continue;
    for (const l of linesOf(je)) raw.set(l.accountId, (raw.get(l.accountId) ?? 0) + (Number(l.debit) || 0) - (Number(l.credit) || 0));
  }
  const out = new Map<string, number>();
  for (const a of accounts) {
    const dr = raw.get(a.id) ?? 0;
    out.set(a.id, a.normalBalance === "CREDIT" ? -dr : dr);
  }
  return out;
}

// Settings › Posting Preferences: a transaction type switched off saves its entries as drafts.
const POSTING_SOURCES: Record<string, string> = { "Sales Invoice": "sales_invoices", "Vendor Bill": "purchase_bills", "AR Payment": "customer_payments", "AP Payment": "vendor_payments", POS: "pos_sales", Manual: "journal_vouchers", MANUAL: "journal_vouchers", VOUCHER: "journal_vouchers", QUICK: "journal_vouchers", "Credit Note": "credit_notes", "Debit Note": "debit_notes" };
function postsDirectly(source: string) {
  const type = POSTING_SOURCES[source];
  const prefs = readCollection("system-settings").find((r) => r.key === "posting-prefs")?.value as Record<string, boolean> | undefined;
  return !type || prefs?.[type] !== false;
}

export function createJournal(entry: { date: string; description: string; lines: JournalLine[]; status?: JournalStatus; source?: string; fiscalPeriodId?: string; reversalOf?: string; attachments?: unknown[] }) {
  const status = entry.status === "POSTED" && !postsDirectly(entry.source ?? "Manual") ? "DRAFT" : entry.status;
  return createRecord("journal-entries", {
    number: nextNumber("journal-entries", "JE"),
    source: "Manual",
    status: "DRAFT",
    ...entry,
    ...(status ? { status } : {}),
    lines: entry.lines.filter((l) => l.accountId && (Number(l.debit) || Number(l.credit))),
  });
}

export const postJournal = (id: string) => updateRecord("journal-entries", id, { status: "POSTED", postedAt: new Date().toISOString() });

// Reversal: mark the original REVERSED and post an equal-and-opposite entry.
export function reverseJournal(je: Rec, date: string) {
  updateRecord("journal-entries", je.id, { status: "REVERSED" });
  return createJournal({
    date,
    description: `Reversal of ${je.number ?? "entry"} — ${je.description ?? ""}`.trim(),
    lines: linesOf(je).map((l) => ({ ...l, debit: Number(l.credit) || 0, credit: Number(l.debit) || 0 })),
    status: "POSTED",
    source: "Reversal",
    reversalOf: je.id,
  });
}

export const accountLabel = (accounts: Rec[], id: unknown) => {
  const a = accounts.find((x) => x.id === id);
  return a ? `${a.code} - ${a.name}` : "—";
};

// Posting code (sales, depreciation…) can run before any Accounting screen has loaded the
// chart, so make sure the starting accounts exist before looking one up.
export function findAccountByCode(code: string) {
  seedCollection("accounts", SEED_ACCOUNTS);
  return readCollection("accounts").find((a) => a.code === code);
}
