/**
 * Tax GO subscription pricing, per country, in local currency.
 *
 * Source: "New Country Prices (1).xlsx" (Product / Currency / Country / Symbol /
 * Amount / 1 = monthly, 12 = annual). Amounts are per company, unlimited users.
 *
 * The workbook has one sheet per package. Every sheet derives from the Complete
 * Package column by a constant divisor, exactly and for all 166 rows, so the
 * monthly/annual figures below are the Complete Package and PACKAGES carries the
 * divisor. If sales ever decouples a package, give it its own figures and change
 * amountFor — nothing else reads the divisor.
 *
 * Notes on the source data:
 *  - Bahrain, North Macedonia, Slovakia and Gabon carried currency codes that
 *    contradicted their own symbol/country; corrected to BHD, MKD, EUR, XAF.
 *  - Gabon's two rows were both labelled "Annual"; split by the 1/12 column.
 *  - Ecuador's USD amounts were ~25,000x every other USD row; set to Panama's
 *    30 / 300 pending confirmation. See the comment on that row.
 */

export type CountryPrice = {
  /** ISO 3166-1 alpha-2 */
  code: string;
  country: string;
  region: Region;
  /** ISO 4217 */
  currency: string;
  symbol: string;
  flag: string;
  monthly: number;
  annual: number;
};

export type Region = "Africa" | "Americas" | "Asia-Pacific" | "Europe" | "Middle East";

export const REGIONS: Region[] = ["Africa", "Americas", "Asia-Pacific", "Europe", "Middle East"];

export const COUNTRY_PRICES: CountryPrice[] = [
  { code: "AO", country: "Angola", region: "Africa", currency: "AOA", symbol: "Kz", flag: "🇦🇴", monthly: 47000, annual: 450000 },
  { code: "AU", country: "Australia", region: "Asia-Pacific", currency: "AUD", symbol: "$", flag: "🇦🇺", monthly: 150, annual: 1720 },
  { code: "BS", country: "Bahamas", region: "Americas", currency: "BSD", symbol: "$", flag: "🇧🇸", monthly: 100, annual: 1200 },
  { code: "BH", country: "Bahrain", region: "Middle East", currency: "BHD", symbol: "دينار", flag: "🇧🇭", monthly: 40, annual: 377 },
  { code: "BD", country: "Bangladesh", region: "Asia-Pacific", currency: "BDT", symbol: "৳", flag: "🇧🇩", monthly: 3767, annual: 62000 },
  { code: "BO", country: "Bolivia", region: "Americas", currency: "BOB", symbol: "Bs.", flag: "🇧🇴", monthly: 360, annual: 3615 },
  { code: "BA", country: "Bosnia and Herzegovina", region: "Europe", currency: "BAM", symbol: "KM", flag: "🇧🇦", monthly: 52, annual: 524 },
  { code: "BW", country: "Botswana", region: "Africa", currency: "BWP", symbol: "P", flag: "🇧🇼", monthly: 420, annual: 4200 },
  { code: "BR", country: "Brazil", region: "Americas", currency: "BRL", symbol: "R$", flag: "🇧🇷", monthly: 150, annual: 1500 },
  { code: "BN", country: "Brunei", region: "Asia-Pacific", currency: "BND", symbol: "$", flag: "🇧🇳", monthly: 40, annual: 400 },
  { code: "BG", country: "Bulgaria", region: "Europe", currency: "BGN", symbol: "лв", flag: "🇧🇬", monthly: 52, annual: 525 },
  { code: "KH", country: "Cambodia", region: "Asia-Pacific", currency: "KHR", symbol: "៛", flag: "🇰🇭", monthly: 122505, annual: 1225050 },
  { code: "CM", country: "Cameroon", region: "Africa", currency: "XAF", symbol: "Fr", flag: "🇨🇲", monthly: 17600, annual: 175700 },
  { code: "CA", country: "Canada", region: "Americas", currency: "CAD", symbol: "$", flag: "🇨🇦", monthly: 105, annual: 1200 },
  { code: "KY", country: "Cayman Islands", region: "Americas", currency: "KYD", symbol: "$", flag: "🇰🇾", monthly: 25, annual: 250 },
  { code: "CO", country: "Colombia", region: "Americas", currency: "COP", symbol: "$", flag: "🇨🇴", monthly: 95920, annual: 959200 },
  { code: "HR", country: "Croatia", region: "Europe", currency: "HRK", symbol: "kn", flag: "🇭🇷", monthly: 202, annual: 2020 },
  { code: "CU", country: "Cuba", region: "Americas", currency: "CUP", symbol: "$", flag: "🇨🇺", monthly: 750, annual: 7500 },
  { code: "CZ", country: "Czech Republic", region: "Europe", currency: "CZK", symbol: "Kč", flag: "🇨🇿", monthly: 654, annual: 6540 },
  { code: "DO", country: "Dominican Republic", region: "Americas", currency: "DOP", symbol: "$", flag: "🇩🇴", monthly: 1842, annual: 18425 },
  // Ecuador: the sheet had 767,611 / 7,676,109 USD, ~25,000x every other USD row.
  // Aligned with Panama, the other USD country, pending confirmation from sales.
  { code: "EC", country: "Ecuador", region: "Americas", currency: "USD", symbol: "$", flag: "🇪🇨", monthly: 30, annual: 300 },
  { code: "EG", country: "Egypt", region: "Africa", currency: "EGP", symbol: "ج.م", flag: "🇪🇬", monthly: 1572, annual: 15720 },
  { code: "GQ", country: "Equatorial Guinea", region: "Africa", currency: "XAF", symbol: "Fr", flag: "🇬🇶", monthly: 17570, annual: 175684 },
  { code: "ER", country: "Eritrea", region: "Africa", currency: "ERN", symbol: "Nfk", flag: "🇪🇷", monthly: 450, annual: 4500 },
  { code: "EE", country: "Estonia", region: "Europe", currency: "EUR", symbol: "€", flag: "🇪🇪", monthly: 50, annual: 500 },
  { code: "ET", country: "Ethiopia", region: "Africa", currency: "ETB", symbol: "Br", flag: "🇪🇹", monthly: 4945, annual: 49454 },
  { code: "GA", country: "Gabon", region: "Africa", currency: "XAF", symbol: "Fr", flag: "🇬🇦", monthly: 175684, annual: 17568 },
  { code: "GR", country: "Greece", region: "Europe", currency: "EUR", symbol: "€", flag: "🇬🇷", monthly: 50, annual: 500 },
  { code: "GN", country: "Guinea", region: "Africa", currency: "GNF", symbol: "Fr", flag: "🇬🇳", monthly: 264480, annual: 2644803 },
  { code: "HT", country: "Haiti", region: "Americas", currency: "HTG", symbol: "G", flag: "🇭🇹", monthly: 3949, annual: 39486 },
  { code: "HU", country: "Hungary", region: "Europe", currency: "HUF", symbol: "Ft", flag: "🇭🇺", monthly: 9788, annual: 97888 },
  { code: "IN", country: "India", region: "Asia-Pacific", currency: "INR", symbol: "₹", flag: "🇮🇳", monthly: 2894, annual: 28939 },
  { code: "ID", country: "Indonesia", region: "Asia-Pacific", currency: "IDR", symbol: "Rp", flag: "🇮🇩", monthly: 537378, annual: 5373782 },
  { code: "IR", country: "Iran", region: "Middle East", currency: "IRR", symbol: "﷼", flag: "🇮🇷", monthly: 53406631, annual: 534066310 },
  { code: "IQ", country: "Iraq", region: "Middle East", currency: "IQD", symbol: "ع.د", flag: "🇮🇶", monthly: 46671, annual: 466713 },
  { code: "IE", country: "Ireland", region: "Europe", currency: "EUR", symbol: "€", flag: "🇮🇪", monthly: 105, annual: 1200 },
  { code: "IL", country: "Israel", region: "Middle East", currency: "ILS", symbol: "₪", flag: "🇮🇱", monthly: 306, annual: 3068 },
  { code: "JM", country: "Jamaica", region: "Americas", currency: "JMD", symbol: "$", flag: "🇯🇲", monthly: 4849, annual: 48490 },
  { code: "JP", country: "Japan", region: "Asia-Pacific", currency: "JPY", symbol: "¥", flag: "🇯🇵", monthly: 15835, annual: 158354 },
  { code: "JO", country: "Jordan", region: "Middle East", currency: "JOD", symbol: "د.ا", flag: "🇯🇴", monthly: 71, annual: 710 },
  { code: "KZ", country: "Kazakhstan", region: "Asia-Pacific", currency: "KZT", symbol: "₸", flag: "🇰🇿", monthly: 13862, annual: 138617 },
  { code: "KE", country: "Kenya", region: "Africa", currency: "KES", symbol: "Sh", flag: "🇰🇪", monthly: 3925, annual: 39244 },
  { code: "KW", country: "Kuwait", region: "Middle East", currency: "KWD", symbol: "د.ك", flag: "🇰🇼", monthly: 31, annual: 311 },
  { code: "LV", country: "Latvia", region: "Europe", currency: "EUR", symbol: "€", flag: "🇱🇻", monthly: 50, annual: 500 },
  { code: "LB", country: "Lebanon", region: "Middle East", currency: "LBP", symbol: "ل.ل", flag: "🇱🇧", monthly: 2688003, annual: 26880034 },
  { code: "LR", country: "Liberia", region: "Africa", currency: "LRD", symbol: "$", flag: "🇱🇷", monthly: 5159, annual: 51585 },
  { code: "LY", country: "Libya", region: "Africa", currency: "LYD", symbol: "ل.د", flag: "🇱🇾", monthly: 193, annual: 1933 },
  { code: "LT", country: "Lithuania", region: "Europe", currency: "EUR", symbol: "€", flag: "🇱🇹", monthly: 50, annual: 500 },
  { code: "MW", country: "Malawi", region: "Africa", currency: "MWK", symbol: "MK", flag: "🇲🇼", monthly: 52151, annual: 521512 },
  { code: "MY", country: "Malaysia", region: "Asia-Pacific", currency: "MYR", symbol: "RM", flag: "🇲🇾", monthly: 123, annual: 1227 },
  { code: "ML", country: "Mali", region: "Africa", currency: "XOF", symbol: "Fr", flag: "🇲🇱", monthly: 17568, annual: 175684 },
  { code: "MT", country: "Malta", region: "Europe", currency: "EUR", symbol: "€", flag: "🇲🇹", monthly: 50, annual: 500 },
  { code: "MX", country: "Mexico", region: "Americas", currency: "MXN", symbol: "$", flag: "🇲🇽", monthly: 553, annual: 5527 },
  { code: "MD", country: "Moldova", region: "Europe", currency: "MDL", symbol: "L", flag: "🇲🇩", monthly: 550, annual: 5503 },
  { code: "MN", country: "Mongolia", region: "Asia-Pacific", currency: "MNT", symbol: "₮", flag: "🇲🇳", monthly: 50000, annual: 500000 },
  { code: "MA", country: "Morocco", region: "Africa", currency: "MAD", symbol: "د.م.", flag: "🇲🇦", monthly: 300, annual: 3000 },
  { code: "NA", country: "Namibia", region: "Africa", currency: "NAD", symbol: "$", flag: "🇳🇦", monthly: 495, annual: 4955 },
  { code: "NZ", country: "New Zealand", region: "Asia-Pacific", currency: "NZD", symbol: "$", flag: "🇳🇿", monthly: 170, annual: 1700 },
  { code: "NE", country: "Niger", region: "Africa", currency: "XOF", symbol: "Fr", flag: "🇳🇪", monthly: 17568, annual: 175684 },
  { code: "NG", country: "Nigeria", region: "Africa", currency: "NGN", symbol: "₦", flag: "🇳🇬", monthly: 50000, annual: 500000 },
  { code: "MK", country: "North Macedonia", region: "Europe", currency: "MKD", symbol: "ден", flag: "🇲🇰", monthly: 1678, annual: 16781 },
  { code: "OM", country: "Oman", region: "Middle East", currency: "OMR", symbol: "ر.ع.", flag: "🇴🇲", monthly: 39, annual: 386 },
  { code: "PK", country: "Pakistan", region: "Asia-Pacific", currency: "PKR", symbol: "₨", flag: "🇵🇰", monthly: 8438, annual: 84376 },
  { code: "PA", country: "Panama", region: "Americas", currency: "USD", symbol: "$", flag: "🇵🇦", monthly: 30, annual: 300 },
  { code: "PH", country: "Philippines", region: "Asia-Pacific", currency: "PHP", symbol: "₱", flag: "🇵🇭", monthly: 1887, annual: 18866 },
  { code: "PL", country: "Poland", region: "Europe", currency: "PLN", symbol: "zł", flag: "🇵🇱", monthly: 118, annual: 1177 },
  { code: "PT", country: "Portugal", region: "Europe", currency: "EUR", symbol: "€", flag: "🇵🇹", monthly: 50, annual: 500 },
  { code: "QA", country: "Qatar", region: "Middle East", currency: "QAR", symbol: "ر.ق", flag: "🇶🇦", monthly: 112, annual: 1117 },
  { code: "RO", country: "Romania", region: "Europe", currency: "RON", symbol: "lei", flag: "🇷🇴", monthly: 143, annual: 1432 },
  { code: "RU", country: "Russia", region: "Europe", currency: "RUB", symbol: "₽", flag: "🇷🇺", monthly: 2553, annual: 25530 },
  { code: "RW", country: "Rwanda", region: "Africa", currency: "RWF", symbol: "Fr", flag: "🇷🇼", monthly: 44931, annual: 449306 },
  { code: "SA", country: "Saudi Arabia", region: "Middle East", currency: "SAR", symbol: "ر.س", flag: "🇸🇦", monthly: 381, annual: 3812 },
  { code: "RS", country: "Serbia", region: "Europe", currency: "RSD", symbol: "дин.", flag: "🇷🇸", monthly: 3145, annual: 31451 },
  { code: "SG", country: "Singapore", region: "Asia-Pacific", currency: "SGD", symbol: "S$", flag: "🇸🇬", monthly: 128, annual: 1282 },
  { code: "SK", country: "Slovakia", region: "Europe", currency: "EUR", symbol: "€", flag: "🇸🇰", monthly: 50, annual: 500 },
  { code: "ZA", country: "South Africa", region: "Africa", currency: "ZAR", symbol: "R", flag: "🇿🇦", monthly: 495, annual: 4955 },
  { code: "KR", country: "South Korea", region: "Asia-Pacific", currency: "KRW", symbol: "₩", flag: "🇰🇷", monthly: 134144, annual: 1341439 },
  { code: "LK", country: "Sri Lanka", region: "Asia-Pacific", currency: "LKR", symbol: "Rs", flag: "🇱🇰", monthly: 10073, annual: 100732 },
  { code: "CH", country: "Switzerland", region: "Europe", currency: "CHF", symbol: "Fr", flag: "🇨🇭", monthly: 83, annual: 830 },
  { code: "TH", country: "Thailand", region: "Asia-Pacific", currency: "THB", symbol: "฿", flag: "🇹🇭", monthly: 1006, annual: 10065 },
  { code: "TR", country: "Turkey", region: "Europe", currency: "TRY", symbol: "₺", flag: "🇹🇷", monthly: 1480, annual: 14804 },
  { code: "GB", country: "United Kingdom", region: "Europe", currency: "GBP", symbol: "£", flag: "🇬🇧", monthly: 105, annual: 1200 },
  // Not in the source sheet; set by the product owner to match Canada and the UK.
  { code: "US", country: "United States", region: "Americas", currency: "USD", symbol: "$", flag: "🇺🇸", monthly: 105, annual: 1200 },
  { code: "ZM", country: "Zambia", region: "Africa", currency: "ZMW", symbol: "ZK", flag: "🇿🇲", monthly: 606, annual: 6060 },
];

/** The five shown on the landing page. Edit this list to change them. */
export const FEATURED_CODES = ["US", "CA", "GB", "AU", "NG", "IN"] as const;

export const DEFAULT_CODE = "US";

export function priceFor(code: string): CountryPrice | undefined {
  return COUNTRY_PRICES.find((p) => p.code === code);
}

export const FEATURED_PRICES: CountryPrice[] = FEATURED_CODES.map((c) => priceFor(c)).filter(
  (p): p is CountryPrice => Boolean(p),
);

/* ---------- packages ---------- */

export type PackageId = "complete" | "accounting" | "hr-payroll" | "retail" | "crm";

export type Package = {
  id: PackageId;
  name: string;
  blurb: string;
  /** Complete Package price / divisor, as the workbook derives each sheet. */
  divisor: number;
  includes: string[];
};

export const PACKAGES: Package[] = [
  {
    id: "complete",
    name: "Complete Package",
    blurb: "The whole business, end to end.",
    divisor: 1,
    includes: [
      "All 15 module groups",
      "Accounting, finance & tax compliance",
      "Sales, purchasing, inventory & manufacturing",
      "HR, payroll, CRM, POS & projects",
      "Every one of Tax GO's agents",
      "Analytics, reporting & the full audit trail",
    ],
  },
  {
    id: "accounting",
    name: "Accounting Only",
    blurb: "The books, the bank and the filings.",
    divisor: 2,
    includes: [
      "General ledger, tax & compliance",
      "Banking, loans, budgets & reconciliations",
      "Quick entry, daybook & Tally-style vouchers",
      "Reports, statements & analytics",
      "Real double-entry & full audit trail",
    ],
  },
  {
    id: "hr-payroll",
    name: "HR & Payroll",
    blurb: "Your people, paid and accounted for.",
    divisor: 6,
    includes: [
      "Employees, leave & attendance",
      "Salary structures & payroll runs",
      "Payslips, claims & statutory payments",
      "Payroll posting into the ledger",
    ],
  },
  {
    id: "retail",
    name: "Retail",
    blurb: "The counter, the stockroom and the van.",
    divisor: 6,
    includes: [
      "Point of sale & van distribution",
      "Products, stock & multi-warehouse",
      "Order-to-cash: quotes, orders, invoices",
      "Stock valuation & movement reports",
    ],
  },
  {
    id: "crm",
    name: "CRM",
    blurb: "Every lead, followed up.",
    divisor: 6,
    includes: [
      "Leads, opportunities & pipeline",
      "Activities, quotes & proposals",
      "Campaigns, segments & web forms",
      "Lead scoring & forecasts",
    ],
  },
];

export const DEFAULT_PACKAGE_ID: PackageId = "complete";

export function packageFor(id: string): Package {
  return PACKAGES.find((p) => p.id === id) ?? PACKAGES[0];
}

export type Cycle = "monthly" | "annual";

/** The price of one package in a country, rounded to whole currency units. */
export function amountFor(p: CountryPrice, pkg: Package, cycle: Cycle): number {
  return Math.round((cycle === "annual" ? p.annual : p.monthly) / pkg.divisor);
}

/* ---------- formatting ---------- */

const LETTERS_ONLY = /^\p{L}[\p{L}.]*$/u;
/** Right-to-left scripts render badly inline, so those fall back to the ISO code. */
const RTL = /[֐-׿؀-ۿ܀-ݏ]/;

/** e.g. "₹28,939", "Kz 450,000", "BHD 377" */
export function formatMoney(p: CountryPrice, amount: number): string {
  const n = amount.toLocaleString("en-US");
  if (RTL.test(p.symbol)) return `${p.currency} ${n}`;
  return LETTERS_ONLY.test(p.symbol) ? `${p.symbol} ${n}` : `${p.symbol}${n}`;
}

/** Percent saved by paying annually instead of 12 × monthly. 0 when there is none. */
export function annualSavingPct(p: CountryPrice, pkg: Package = PACKAGES[0]): number {
  const monthly = amountFor(p, pkg, "monthly");
  const annual = amountFor(p, pkg, "annual");
  const full = monthly * 12;
  if (full <= annual) return 0;
  return Math.round(((full - annual) / full) * 100);
}

/** What the annual plan works out to per month. */
export function annualPerMonth(p: CountryPrice, pkg: Package = PACKAGES[0]): number {
  return Math.round(amountFor(p, pkg, "annual") / 12);
}

/** Other names people type for a country. */
const ALIASES: Record<string, string[]> = {
  US: ["usa", "america", "united states of america"],
  GB: ["uk", "britain", "great britain", "england", "scotland", "wales"],
  AE: ["uae", "emirates", "dubai"],
  SA: ["ksa"],
};

export function searchCountries(query: string, region: Region | "All" = "All"): CountryPrice[] {
  const q = query.trim().toLowerCase();
  return COUNTRY_PRICES.filter((p) => {
    if (region !== "All" && p.region !== region) return false;
    if (!q) return true;
    return (
      p.country.toLowerCase().includes(q) ||
      p.currency.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      (ALIASES[p.code] ?? []).some((a) => a.startsWith(q))
    );
  });
}
