// Indirect-tax coverage by continent, shared by the landing page and /compliance.
// Standard rates for reference only; they change, so check before relying on them.
// Within each region the major markets come first; the landing page shows the first MAJOR_COUNT.

import { EU_VAT } from "@/lib/tax-detail";

export const MAJOR_COUNT = 5;

/** Extra notes for EU members, shown after their reduced rates. */
const EU_NOTES: Record<string, string> = { IT: "SDI e-invoicing", EL: "*17% on certain Aegean islands" };

/** EU members as cards: the listed codes first (in that order), then the rest alphabetically. */
function euRows(first: string[]): TaxRow[] {
  const ordered = [...first.map((c) => EU_VAT.find((e) => e.code === c)!), ...EU_VAT.filter((e) => !first.includes(e.code))];
  return ordered.map((e) => {
    const reduced = e.reduced.startsWith("No") ? e.reduced : `Reduced ${e.reduced}`;
    return { country: e.country, flag: e.flag, rate: e.standard, tax: "VAT", note: EU_NOTES[e.code] ? `${reduced} · ${EU_NOTES[e.code]}` : reduced };
  });
}

export type TaxRow = {
  country: string;
  flag: string;
  /** Headline rate, or a word when there is no single rate. */
  rate: string;
  /** The tax's local name: VAT, GST, IVA… */
  tax: string;
  note?: string;
};

export type TaxRegion = {
  slug: string;
  name: string;
  intro: string;
  /** Tax regimes covered, for the summary tiles. */
  regimes: string[];
  /** Marker position on the 1000×394 world map (equirectangular, see components/landing/world-map.ts). */
  marker: { x: number; y: number };
  rows: TaxRow[];
};

export const TAX_REGIONS: TaxRegion[] = [
  {
    slug: "americas",
    name: "Americas",
    intro: "Retail sales tax, GST/HST and VAT across North, Central and South America.",
    regimes: ["Sales tax", "GST/HST", "IVA"],
    marker: { x: 255, y: 175 },
    rows: [
      { country: "United States", flag: "🇺🇸", rate: "Varies", tax: "Sales tax", note: "Federal and state taxes; no federal VAT, state rates 0–7.25% — see all 50 states below" },
      { country: "Canada", flag: "🇨🇦", rate: "5%", tax: "GST", note: "13–15% HST in participating provinces, PST in others" },
      { country: "Mexico", flag: "🇲🇽", rate: "16%", tax: "IVA", note: "8% in the northern border region" },
      { country: "Brazil", flag: "🇧🇷", rate: "Varies", tax: "ICMS · PIS/COFINS", note: "Dual VAT (CBS/IBS) phasing in from 2026" },
      { country: "Argentina", flag: "🇦🇷", rate: "21%", tax: "IVA" },
      { country: "Chile", flag: "🇨🇱", rate: "19%", tax: "IVA" },
      { country: "Colombia", flag: "🇨🇴", rate: "19%", tax: "IVA" },
      { country: "Peru", flag: "🇵🇪", rate: "18%", tax: "IGV", note: "Including municipal promotion tax" },
      { country: "Dominican Republic", flag: "🇩🇴", rate: "18%", tax: "ITBIS" },
      { country: "Jamaica", flag: "🇯🇲", rate: "15%", tax: "GCT" },
    ],
  },
  {
    slug: "europe",
    name: "Europe",
    intro: "VAT for all 27 EU member states with their reduced rates, Peppol e-invoicing and UK Making Tax Digital.",
    regimes: ["VAT", "Peppol", "MTD"],
    marker: { x: 528, y: 92 },
    rows: [
      { country: "United Kingdom", flag: "🇬🇧", rate: "20%", tax: "VAT", note: "Making Tax Digital · reduced 5%" },
      ...euRows(["DE", "FR", "IT", "ES", "NL", "IE", "BE", "PL", "PT", "SE", "EL", "AT"]),
      { country: "Switzerland", flag: "🇨🇭", rate: "8.1%", tax: "VAT", note: "Reduced 2.6%, 3.8%" },
    ],
  },
  {
    slug: "asia-middle-east",
    name: "Asia / Middle East",
    intro: "GST and VAT across Asia and the Gulf, including ZATCA e-invoicing.",
    regimes: ["GST", "VAT", "ZATCA"],
    marker: { x: 745, y: 150 },
    rows: [
      { country: "India", flag: "🇮🇳", rate: "18%", tax: "GST", note: "GST standard structure" },
      { country: "Saudi Arabia", flag: "🇸🇦", rate: "15%", tax: "VAT", note: "ZATCA e-invoicing" },
      { country: "United Arab Emirates / Oman", flag: "🇦🇪", rate: "5%", tax: "VAT" },
      { country: "Singapore", flag: "🇸🇬", rate: "9%", tax: "GST" },
      { country: "China", flag: "🇨🇳", rate: "13%", tax: "VAT", note: "Standard rate" },
      { country: "Japan", flag: "🇯🇵", rate: "10%", tax: "Consumption tax", note: "8% reduced rate" },
      { country: "Indonesia", flag: "🇮🇩", rate: "12%", tax: "VAT", note: "Standard VAT, increased from 11% in 2025" },
      { country: "Philippines", flag: "🇵🇭", rate: "12%", tax: "VAT", note: "Standard VAT" },
      { country: "Vietnam", flag: "🇻🇳", rate: "8%", tax: "VAT", note: "Temporary reduced rate for most goods/services; standard is 10%" },
      { country: "Thailand", flag: "🇹🇭", rate: "7%", tax: "VAT", note: "Reduced rate extended via royal decree; statutory code is 10%" },
      { country: "Malaysia", flag: "🇲🇾", rate: "No VAT", tax: "Sales & service tax", note: "Uses a 10% sales tax and 8% service tax system" },
      { country: "Pakistan", flag: "🇵🇰", rate: "18%", tax: "Sales tax", note: "For goods; 15%–16% for services" },
      { country: "Kazakhstan", flag: "🇰🇿", rate: "16%", tax: "VAT" },
      { country: "Armenia / Azerbaijan", flag: "🇦🇲", rate: "20% / 18%", tax: "VAT" },
      { country: "Cambodia", flag: "🇰🇭", rate: "10%", tax: "VAT" },
      { country: "Laos (Lao PDR)", flag: "🇱🇦", rate: "10%", tax: "VAT" },
      { country: "Myanmar", flag: "🇲🇲", rate: "No VAT", tax: "Commercial tax", note: "Uses a 5% commercial tax" },
      { country: "Brunei / Timor-Leste", flag: "🇧🇳", rate: "None", tax: "No VAT or GST" },
    ],
  },
  {
    slug: "africa",
    name: "Africa",
    intro: "VAT and GST calculations, invoicing, reporting and tax preparation across Nigeria, South Africa, Ghana, Morocco, Kenya, Egypt and many more African countries.",
    regimes: ["VAT", "eTIMS", "EFRIS"],
    marker: { x: 560, y: 228 },
    rows: [
      { country: "Nigeria", flag: "🇳🇬", rate: "7.5%", tax: "VAT" },
      { country: "South Africa", flag: "🇿🇦", rate: "15%", tax: "VAT" },
      { country: "Kenya", flag: "🇰🇪", rate: "16%", tax: "VAT", note: "eTIMS e-invoicing" },
      { country: "Egypt", flag: "🇪🇬", rate: "14%", tax: "VAT", note: "E-invoicing" },
      { country: "Morocco", flag: "🇲🇦", rate: "20%", tax: "VAT" },
      { country: "Ghana", flag: "🇬🇭", rate: "15%+", tax: "VAT", note: "Plus statutory levies" },
      { country: "Tanzania", flag: "🇹🇿", rate: "18%", tax: "VAT" },
      { country: "Uganda", flag: "🇺🇬", rate: "18%", tax: "VAT", note: "EFRIS e-invoicing" },
      { country: "Ethiopia", flag: "🇪🇹", rate: "15%", tax: "VAT" },
      { country: "Rwanda", flag: "🇷🇼", rate: "18%", tax: "VAT" },
      { country: "Zambia", flag: "🇿🇲", rate: "16%", tax: "VAT" },
      { country: "Côte d'Ivoire", flag: "🇨🇮", rate: "18%", tax: "VAT" },
    ],
  },
  {
    slug: "oceania",
    name: "Australia & Oceania",
    intro: "GST with BAS-ready reporting.",
    regimes: ["GST", "BAS"],
    marker: { x: 885, y: 300 },
    rows: [
      { country: "Australia", flag: "🇦🇺", rate: "10%", tax: "GST", note: "BAS-ready reporting" },
      { country: "New Zealand", flag: "🇳🇿", rate: "15%", tax: "GST" },
      { country: "Papua New Guinea", flag: "🇵🇬", rate: "10%", tax: "GST" },
      { country: "Samoa", flag: "🇼🇸", rate: "15%", tax: "VAGST" },
      { country: "Tonga", flag: "🇹🇴", rate: "15%", tax: "Consumption tax" },
    ],
  },
];

export const TAX_COUNTRY_COUNT = TAX_REGIONS.reduce((n, r) => n + r.rows.length, 0);

/** Marketing claim for total coverage; the tables above list the major markets, not every country. */
export const COVERAGE_CLAIM = "100+";
