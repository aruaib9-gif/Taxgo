// Per-route metadata captured from the platform's screens. Drives the generic
// page renderer so every route shows a realistic header, actions, filters and
// table columns. Routes not listed fall back to their nav label + a generic list.

export type PageKind = "list" | "form" | "dashboard" | "settings" | "report";

export type PageMeta = {
  title: string;
  subtitle?: string;
  kind?: PageKind;
  actions?: string[]; // button labels; first is primary
  tabs?: string[]; // status filter chips
  filters?: string[]; // dropdown filters
  columns?: string[]; // table columns
  emptyTitle?: string;
  emptyHint?: string;
};

export const pageMeta: Record<string, PageMeta> = {
  // ---- Quick Entry ----
  "/daybook": {
    title: "Daybook",
    subtitle: "All transactions in one place",
    filters: ["All Types", "All Status"],
    columns: ["Date", "Type", "Reference", "Description / Party", "Amount", "Status"],
  },
  "/expense": {
    title: "Expenses",
    subtitle: "Track and manage your expenses",
    actions: ["New Expense"],
    filters: ["All Status"],
    columns: ["Date", "Description", "Vendor", "Amount", "Status"],
  },
  "/income": {
    title: "Income",
    subtitle: "Track and manage your income",
    actions: ["New Income"],
    filters: ["All Status"],
    columns: ["Date", "Description", "Customer", "Amount", "Status"],
  },
  "/sale": {
    title: "Sales",
    subtitle: "Manage your sales",
    actions: ["New Sale"],
    filters: ["All Status"],
    columns: ["Sale #", "Date", "Cashier", "Total", "Status"],
  },
  "/purchase": {
    title: "Purchases",
    subtitle: "Track and manage your purchases",
    actions: ["New Purchase"],
    filters: ["All Status"],
    columns: ["Date", "Reference", "Vendor", "Amount", "Status"],
  },

  // ---- Sales / AR ----
  "/ar/customers": {
    title: "Customers",
    subtitle: "Manage customer accounts",
    actions: ["New Customer", "Import", "Download"],
    columns: ["Number", "Name", "Email", "Phone", "Terms (days)", "Status", "Balance", "Open Inv."],
  },
  "/ar/sales-orders": {
    title: "Sales Orders",
    subtitle: "Manage sales orders and track fulfillment",
    actions: ["New Sales Order"],
    filters: ["All Statuses"],
    columns: ["SO #", "Title", "Customer", "Order Date", "Expected Date", "Total", "Status"],
  },
  "/ar/invoices": {
    title: "Invoices",
    subtitle: "Manage customer invoices",
    actions: ["New Invoice"],
    filters: ["All Status"],
    columns: ["Invoice #", "Customer", "Date", "Due Date", "Payment Mode", "Total", "Outstanding", "Status"],
  },
  "/ar/credit-notes": {
    title: "Credit Notes",
    subtitle: "Issue against returns, over-billing or goodwill, then apply to open invoices",
    actions: ["New Credit Note"],
    columns: ["Credit Note #", "Date", "Customer", "Total", "Applied", "Status"],
  },
  "/ar/payments": {
    title: "AR Payments",
    subtitle: "Customer payment receipts",
    actions: ["Record Payment"],
    columns: ["Payment #", "Customer", "Date", "Amount", "Method", "Reference", "Ledger"],
  },

  // ---- Purchasing / AP ----
  "/ap/vendors": {
    title: "Vendors",
    subtitle: "Manage vendor accounts",
    actions: ["New Vendor"],
    columns: ["Number", "Name", "Email", "Phone", "Tax ID", "Terms (days)", "Status", "Balance"],
  },
  "/ap/bills": {
    title: "Bills",
    subtitle: "Manage vendor bills",
    actions: ["New Bill"],
    filters: ["All Status"],
    columns: ["Bill #", "Vendor", "Date", "Due Date", "Total", "Outstanding", "Status"],
  },
  "/ap/payment-runs": {
    title: "Payment Runs",
    subtitle: "Pay many vendors in one batch — export the bank upload file (SEPA / NACHA / CSV)",
    actions: ["New payment run"],
    filters: ["All statuses"],
    emptyTitle: "No payment runs yet.",
  },
  "/inventory/purchase-orders": {
    title: "Purchase Orders",
    actions: ["New PO"],
    filters: ["All statuses"],
    columns: ["PO #", "Date", "Total", "Status", "Receipt", "Billing"],
  },

  // ---- Inventory ----
  "/inventory/products": {
    title: "Products",
    subtitle: "Manage products and services",
    actions: ["New Product", "AI Import", "Import", "Export"],
    filters: ["All categories", "All brands", "All UOM", "All types", "All status"],
    columns: ["SKU", "Item Name", "Category", "Brand", "UOM", "Cost", "Retail", "GST", "Stock", "Status"],
  },
  "/inventory/stock": {
    title: "Stock Balances",
    subtitle: "Current inventory levels",
    actions: ["Adjust Stock"],
    filters: ["All warehouses", "All stock"],
    columns: ["Product", "Warehouse", "Quantity"],
  },
  "/inventory/warehouses": {
    title: "Warehouses",
    actions: ["New Warehouse"],
    columns: ["Code", "Name", "Address", "Status"],
  },

  // ---- Accounting ----
  "/financial/journal-entries": {
    title: "Journal Entries",
    subtitle: "View and manage journal entries",
    actions: ["New Entry", "New with AI", "Export"],
    filters: ["All Status"],
    columns: ["Date", "Description", "Source", "Status", "Created"],
  },
  "/posting/events": {
    title: "Posting Events",
    subtitle: "Automated posting events — select pending and post to the ledger",
    filters: ["All Statuses", "All Event Types"],
    columns: ["Event Type", "Event Key", "Status", "Debit", "Credit", "Processed At", "Retries"],
  },

  // ---- Finance ----
  "/bank/accounts": {
    title: "Bank Accounts",
    subtitle: "Manage linked bank accounts",
    actions: ["New Bank Account"],
    columns: ["Bank Name", "Account Name", "Currency", "Current Balance", "GL Balance", "Status"],
  },

  // ---- HR ----
  "/hr/employees": {
    title: "Employees",
    subtitle: "Manage your team — directory, contacts, employment details",
    actions: ["New employee", "Import", "Export"],
    filters: ["All statuses", "All org units"],
    emptyTitle: "No employees yet",
    emptyHint: "Add your first employee to start managing payroll, leave and HR records.",
  },

  // ---- Payroll ----
  "/payroll/runs": {
    title: "Payroll Runs",
    subtitle: "Monthly payroll: compute → approve → post to GL → bank disbursement",
    actions: ["New run"],
    tabs: ["All", "draft", "computed", "approved", "posted", "paid", "cancelled"],
    emptyTitle: "No payroll runs yet",
  },
};

export function metaFor(href: string): PageMeta | undefined {
  return pageMeta[href];
}
