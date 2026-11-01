// Lightweight sample data for the fleshed-out demo pages (POS, invoice form).

export type Product = {
  sku: string;
  name: string;
  category: string;
  price: number;
  uom: string;
};

export const products: Product[] = [
  { sku: "COF-ESP", name: "Espresso", category: "Drinks", price: 2.5, uom: "EA" },
  { sku: "COF-CAP", name: "Cappuccino", category: "Drinks", price: 3.5, uom: "EA" },
  { sku: "COF-LAT", name: "Latte", category: "Drinks", price: 3.75, uom: "EA" },
  { sku: "TEA-GRN", name: "Green Tea", category: "Drinks", price: 2.25, uom: "EA" },
  { sku: "JCE-ORG", name: "Orange Juice", category: "Drinks", price: 4.0, uom: "EA" },
  { sku: "BKY-CRS", name: "Croissant", category: "Bakery", price: 2.75, uom: "EA" },
  { sku: "BKY-MUF", name: "Blueberry Muffin", category: "Bakery", price: 3.0, uom: "EA" },
  { sku: "BKY-BGL", name: "Bagel", category: "Bakery", price: 2.0, uom: "EA" },
  { sku: "SND-CLB", name: "Club Sandwich", category: "Food", price: 7.5, uom: "EA" },
  { sku: "SND-VEG", name: "Veggie Wrap", category: "Food", price: 6.5, uom: "EA" },
  { sku: "SAL-CSR", name: "Caesar Salad", category: "Food", price: 8.0, uom: "EA" },
  { sku: "SNK-CHP", name: "Potato Chips", category: "Snacks", price: 1.5, uom: "EA" },
  { sku: "SNK-CKE", name: "Chocolate Cookie", category: "Snacks", price: 1.75, uom: "EA" },
  { sku: "WTR-500", name: "Water 500ml", category: "Drinks", price: 1.0, uom: "EA" },
  { sku: "SNK-NUT", name: "Mixed Nuts", category: "Snacks", price: 3.25, uom: "PACK" },
  { sku: "BKY-DNT", name: "Glazed Donut", category: "Bakery", price: 2.25, uom: "EA" },
];

export const posCategories = ["All", "Drinks", "Bakery", "Food", "Snacks"];

export const customers = [
  "Walk-in Customer",
  "Acme Trading LLC",
  "Blue Ocean Foods",
  "Crescent Retail",
  "Desert Rose Catering",
];

export const salespeople = ["Me (default)", "Aisha K.", "Rahul S.", "Omar F."];
export const uoms = ["EA", "PACK", "BOX", "KG", "L"];
export const taxRates = [
  { label: "No tax (0%)", rate: 0 },
  { label: "Standard (5%)", rate: 5 },
  { label: "Standard (15%)", rate: 15 },
  { label: "GST (18%)", rate: 18 },
];

// "Load Sample Data" on the home checklist: a small, realistic book of records in the local store.
const isoDay = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

export async function loadSampleData() {
  const { createRecord, readCollection } = await import("@/lib/store");
  if (readCollection("invoices").some((r) => r.sample)) return; // already loaded

  const s = { sample: true };
  [
    { number: "C-01", name: "Acme Trading LLC", email: "accounts@acme.example", terms: 30, status: "ACTIVE" },
    { number: "C-02", name: "Blue Ocean Foods", email: "ap@blueocean.example", terms: 15, status: "ACTIVE" },
    { number: "C-03", name: "Crescent Retail", email: "finance@crescent.example", terms: 30, status: "ACTIVE" },
  ].forEach((c) => createRecord("customers", { ...c, ...s }));
  ["Gulf Traders", "Metro Wholesale"].forEach((name, i) => createRecord("vendors", { number: `V-0${i + 1}`, name, status: "ACTIVE", ...s }));

  createRecord("bank-accounts", { bankName: "Emirates NBD", accountName: "Operating Account", currency: "USD", openingBalance: 48250, status: "ACTIVE", ...s });

  [
    { number: "INV-01", customer: "Acme Trading LLC", date: isoDay(-40), dueDate: isoDay(-10), total: 12400, status: "UNPAID" },
    { number: "INV-02", customer: "Blue Ocean Foods", date: isoDay(-12), dueDate: isoDay(3), total: 5600, status: "UNPAID" },
    { number: "INV-03", customer: "Crescent Retail", date: isoDay(-25), dueDate: isoDay(-5), total: 8150, status: "PAID" },
  ].forEach((inv) => createRecord("invoices", { ...inv, paymentMode: "Bank Transfer", ...s }));

  [
    { number: "BILL-01", vendor: "Gulf Traders", date: isoDay(-9), dueDate: isoDay(21), total: 3900, status: "UNPAID" },
    { number: "BILL-02", vendor: "Metro Wholesale", date: isoDay(-30), dueDate: isoDay(-2), total: 2275, status: "PAID" },
  ].forEach((b) => createRecord("bills", { ...b, ...s }));

  createRecord("ar-payments", { amount: 8150, customer: "Crescent Retail", date: isoDay(-4), ...s });
  createRecord("ap-payments", { amount: 2275, vendor: "Metro Wholesale", date: isoDay(-2), ...s });

  [
    { number: "JE-01", date: isoDay(-4), description: "Receipt — Crescent Retail INV-03", source: "Manual", status: "POSTED" },
    { number: "JE-02", date: isoDay(-2), description: "Payment — Metro Wholesale BILL-02", source: "Manual", status: "POSTED" },
    { number: "JE-03", date: isoDay(-1), description: "Monthly rent accrual", source: "Manual", status: "DRAFT" },
  ].forEach((je) => createRecord("journal-entries", { ...je, ...s }));
}
