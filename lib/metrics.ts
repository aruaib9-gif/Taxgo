"use client";

import { useCollection, type Rec } from "@/lib/store";
import { outstanding } from "@/lib/sales";
import { billOutstanding } from "@/lib/purchases";

const n = (v: unknown) => Number(v ?? 0) || 0;
const isPaid = (s: unknown) => /^(paid|reconciled|cancelled)$/i.test(String(s ?? "").trim());
const sum = (arr: Rec[], key: string) => arr.reduce((s, r) => s + n(r[key]), 0);

export type Activity = {
  type: string;
  title: string;
  sub?: string;
  amount?: number;
  when: string;
  href: string;
};

export function useDashboard() {
  const invoices = useCollection("invoices");
  const bills = useCollection("bills");
  const expenses = useCollection("expenses");
  const income = useCollection("income");
  const sales = useCollection("sales");
  const purchases = useCollection("purchases");
  const customers = useCollection("customers");
  const vendors = useCollection("vendors");
  const products = useCollection("products");
  const banks = useCollection("bank-accounts");
  const cash = useCollection("cash-accounts");
  const arPay = useCollection("ar-payments");
  const apPay = useCollection("ap-payments");
  const leads = useCollection("leads");
  const employees = useCollection("employees");
  const journals = useCollection("journal-entries");

  const openInvoices = invoices.filter((i) => !isPaid(i.status));
  const openBills = bills.filter((b) => !isPaid(b.status));
  const today = new Date().toISOString().slice(0, 10);
  const overdueInvoices = openInvoices.filter((i) => i.dueDate && String(i.dueDate) < today);
  const newest = (rows: Rec[]) => [...rows].sort((a, b) => (String(b.createdAt ?? "") > String(a.createdAt ?? "") ? 1 : -1)).slice(0, 5);

  const arOutstanding = openInvoices.reduce((s, i) => s + Math.max(0, outstanding(i)), 0);
  const apOutstanding = openBills.reduce((s, b) => s + Math.max(0, billOutstanding(b)), 0);
  const revenue = sum(income, "amount") + sum(sales, "total") + sum(invoices, "total");
  const expensesTotal = sum(expenses, "amount") + sum(purchases, "amount") + sum(bills, "total");
  const cashBalance =
    sum(banks, "openingBalance") + sum(cash, "openingBalance") + sum(arPay, "amount") - sum(apPay, "amount");

  // recent activity across the ledger
  const activity: Activity[] = [];
  const push = (rows: Rec[], map: (r: Rec) => Omit<Activity, "when">) => {
    rows.forEach((r) => activity.push({ ...map(r), when: String(r.createdAt ?? "") }));
  };
  push(invoices, (r) => ({ type: "Invoice", title: `${r.number ?? "Invoice"} · ${r.customer ?? ""}`, amount: n(r.total), href: "/ar/invoices" }));
  push(bills, (r) => ({ type: "Bill", title: `${r.number ?? "Bill"} · ${r.vendor ?? ""}`, amount: n(r.total), href: "/ap/bills" }));
  push(income, (r) => ({ type: "Income", title: String(r.description || r.customer || "Income"), amount: n(r.amount), href: "/income" }));
  push(expenses, (r) => ({ type: "Expense", title: String(r.description || r.vendor || "Expense"), amount: n(r.amount), href: "/expense" }));
  push(customers, (r) => ({ type: "Customer", title: String(r.name ?? "Customer"), href: "/ar/customers" }));
  push(leads, (r) => ({ type: "Lead", title: `${r.firstName ?? ""} ${r.lastName ?? ""}`.trim() || "Lead", href: "/crm/leads" }));
  activity.sort((a, b) => (b.when > a.when ? 1 : -1));

  const needsYou: { text: string; href: string }[] = [];
  if (overdueInvoices.length) needsYou.push({ text: `${overdueInvoices.length} overdue invoice${overdueInvoices.length === 1 ? "" : "s"} to chase`, href: "/ar/invoices?status=OVERDUE" });
  if (openBills.length) needsYou.push({ text: `${openBills.length} bill${openBills.length === 1 ? "" : "s"} to pay`, href: "/ap/bills" });
  const newLeads = leads.filter((l) => /new/i.test(String(l.status)));
  if (newLeads.length) needsYou.push({ text: `${newLeads.length} new lead${newLeads.length === 1 ? "" : "s"} to qualify`, href: "/crm/leads" });

  return {
    kpis: { cashBalance, arOutstanding, apOutstanding, overdue: overdueInvoices.length, revenue, expensesTotal },
    counts: {
      customers: customers.length,
      vendors: vendors.length,
      products: products.length,
      invoices: invoices.length,
      bills: bills.length,
      leads: leads.length,
      employees: employees.length,
      openInvoices: openInvoices.length,
      openBills: openBills.length,
      banks: banks.length,
    },
    openInvoices,
    openBills,
    activity: activity.slice(0, 6),
    recent: { journals: newest(journals), invoices: newest(invoices), bills: newest(bills) },
    needsYou,
    hasData: invoices.length + bills.length + customers.length + income.length + expenses.length > 0,
  };
}
