// In-depth tax tables for /compliance: United States sales tax and federal rates, and EU VAT. Reference figures only.
// State rates and population-weighted average combined (state + local) rates as of January 1, 2026,
// cross-checked against the Sales Tax Institute's November 1, 2026 state rate reference.
// Federal figures for 2026: IRS (corporate rate) and Tax Foundation (individual brackets).

export type UsState = {
  name: string;
  code: string;
  /** Statewide rate, percent. */
  state: number;
  /** Population-weighted average of state + local rates, percent. Not the rate for any one sale. */
  combined: number;
  note?: string;
};

export const US_STATES: UsState[] = [
  { name: "Alabama", code: "AL", state: 4, combined: 9.46 },
  { name: "Alaska", code: "AK", state: 0, combined: 1.82, note: "No statewide sales tax, but local sales taxes are allowed" },
  { name: "Arizona", code: "AZ", state: 5.6, combined: 8.52 },
  { name: "Arkansas", code: "AR", state: 6.5, combined: 9.46 },
  { name: "California", code: "CA", state: 7.25, combined: 8.99, note: "7.25% minimum includes a mandatory statewide county component" },
  { name: "Colorado", code: "CO", state: 2.9, combined: 7.89 },
  { name: "Connecticut", code: "CT", state: 6.35, combined: 6.35 },
  { name: "Delaware", code: "DE", state: 0, combined: 0 },
  { name: "Florida", code: "FL", state: 6, combined: 6.98 },
  { name: "Georgia", code: "GA", state: 4, combined: 7.49 },
  { name: "Hawaii", code: "HI", state: 4, combined: 4.5, note: "General excise tax rather than a retail sales tax" },
  { name: "Idaho", code: "ID", state: 6, combined: 6.03 },
  { name: "Illinois", code: "IL", state: 6.25, combined: 8.96 },
  { name: "Indiana", code: "IN", state: 7, combined: 7 },
  { name: "Iowa", code: "IA", state: 6, combined: 6.94 },
  { name: "Kansas", code: "KS", state: 6.5, combined: 8.69 },
  { name: "Kentucky", code: "KY", state: 6, combined: 6 },
  { name: "Louisiana", code: "LA", state: 5, combined: 10.11 },
  { name: "Maine", code: "ME", state: 5.5, combined: 5.5 },
  { name: "Maryland", code: "MD", state: 6, combined: 6 },
  { name: "Massachusetts", code: "MA", state: 6.25, combined: 6.25 },
  { name: "Michigan", code: "MI", state: 6, combined: 6 },
  { name: "Minnesota", code: "MN", state: 6.875, combined: 8.14 },
  { name: "Mississippi", code: "MS", state: 7, combined: 7.06 },
  { name: "Missouri", code: "MO", state: 4.225, combined: 8.44 },
  { name: "Montana", code: "MT", state: 0, combined: 0 },
  { name: "Nebraska", code: "NE", state: 5.5, combined: 6.98 },
  { name: "Nevada", code: "NV", state: 6.85, combined: 8.24 },
  { name: "New Hampshire", code: "NH", state: 0, combined: 0 },
  { name: "New Jersey", code: "NJ", state: 6.625, combined: 6.6 },
  { name: "New Mexico", code: "NM", state: 4.875, combined: 7.67, note: "Gross receipts tax rather than a retail sales tax" },
  { name: "New York", code: "NY", state: 4, combined: 8.54 },
  { name: "North Carolina", code: "NC", state: 4.75, combined: 7 },
  { name: "North Dakota", code: "ND", state: 5, combined: 7.09 },
  { name: "Ohio", code: "OH", state: 5.75, combined: 7.29 },
  { name: "Oklahoma", code: "OK", state: 4.5, combined: 9.06 },
  { name: "Oregon", code: "OR", state: 0, combined: 0 },
  { name: "Pennsylvania", code: "PA", state: 6, combined: 6.34 },
  { name: "Rhode Island", code: "RI", state: 7, combined: 7 },
  { name: "South Carolina", code: "SC", state: 6, combined: 7.49 },
  { name: "South Dakota", code: "SD", state: 4.2, combined: 6.11 },
  { name: "Tennessee", code: "TN", state: 7, combined: 9.61 },
  { name: "Texas", code: "TX", state: 6.25, combined: 8.2 },
  { name: "Utah", code: "UT", state: 6.1, combined: 7.42 },
  { name: "Vermont", code: "VT", state: 6, combined: 6.39 },
  { name: "Virginia", code: "VA", state: 5.3, combined: 5.77 },
  { name: "Washington", code: "WA", state: 6.5, combined: 9.51 },
  { name: "West Virginia", code: "WV", state: 6, combined: 6.59 },
  { name: "Wisconsin", code: "WI", state: 5, combined: 5.72 },
  { name: "Wyoming", code: "WY", state: 4, combined: 5.56 },
  { name: "District of Columbia", code: "DC", state: 6, combined: 6 },
];

export const US_FEDERAL = {
  salesTax: { rate: "0%", note: "No nationwide sales tax or VAT" },
  corporate: { rate: "21%", note: "Flat rate on taxable C-corporation profits" },
};

/** A figure and where it is published, so every rate on /compliance can be checked at the authority that sets it. */
export type TaxSource = { label: string; href: string };

/** Federal figures come from the IRS; state sales tax rates are set state by state. */
export const US_FEDERAL_SOURCES: TaxSource[] = [
  { label: "IRS — federal income tax rates and brackets", href: "https://www.irs.gov/filing/federal-income-tax-rates-and-brackets" },
  { label: "IRS — corporations", href: "https://www.irs.gov/businesses/small-businesses-self-employed/corporations" },
];

export const US_STATE_SOURCES: TaxSource[] = [
  { label: "Streamlined Sales Tax Governing Board — state rate and boundary files", href: "https://www.streamlinedsalestax.org/" },
];

/** 2026 federal individual income tax brackets, single filers. Marginal rates; thresholds vary by filing status. */
export const US_BRACKETS_SINGLE: { rate: string; income: string }[] = [
  { rate: "10%", income: "$0 – $12,400" },
  { rate: "12%", income: "$12,401 – $50,400" },
  { rate: "22%", income: "$50,401 – $105,700" },
  { rate: "24%", income: "$105,701 – $201,775" },
  { rate: "32%", income: "$201,776 – $256,225" },
  { rate: "35%", income: "$256,226 – $640,600" },
  { rate: "37%", income: "Above $640,600" },
];

/** What a US sales tax engine in Tax GO does, beyond a single rate per state. */
export const US_ENGINE_FEATURES: { title: string; text: string }[] = [
  { title: "Address-based tax determination", text: "Rates from state, county, city and special-district boundaries, not the state alone." },
  { title: "Economic nexus monitoring", text: "Tracks when sales or transaction thresholds create registration and collection obligations in another state." },
  { title: "Product-specific taxability", text: "The right rules for physical goods, food, clothing, software, digital products and services." },
  { title: "Exemptions & resale certificates", text: "Keeps exemption documentation on file and applies valid exemptions automatically." },
  { title: "Sales & use tax reporting", text: "State-specific returns, tax liability reconciliations and filing schedules." },
  { title: "Historical tax rates", text: "Effective dates are stored, so past transactions keep the rate that applied when laws change." },
];

/* ---------- EU VAT ---------- */

export type EuVat = { country: string; code: string; flag: string; standard: string; reduced: string };

export const EU_VAT_SOURCES: TaxSource[] = [
  { label: "European Commission — VAT rates", href: "https://taxation-customs.ec.europa.eu/taxation/vat/vat-rates_en" },
  { label: "Your Europe — VAT rules and rates", href: "https://europa.eu/youreurope/business/taxation/vat/vat-rules-rates/index_en.htm" },
];

/** All 27 EU member states, standard and principal reduced VAT rates, November 2026 (source: Your Europe). */
export const EU_VAT: EuVat[] = [
  { country: "Austria", code: "AT", flag: "🇦🇹", standard: "20%", reduced: "10%, 13%" },
  { country: "Belgium", code: "BE", flag: "🇧🇪", standard: "21%", reduced: "6%, 12%" },
  { country: "Bulgaria", code: "BG", flag: "🇧🇬", standard: "20%", reduced: "9%" },
  { country: "Croatia", code: "HR", flag: "🇭🇷", standard: "25%", reduced: "5%, 13%" },
  { country: "Cyprus", code: "CY", flag: "🇨🇾", standard: "19%", reduced: "3%, 5%, 9%" },
  { country: "Czechia", code: "CZ", flag: "🇨🇿", standard: "21%", reduced: "12%" },
  { country: "Denmark", code: "DK", flag: "🇩🇰", standard: "25%", reduced: "No general reduced rate" },
  { country: "Estonia", code: "EE", flag: "🇪🇪", standard: "24%", reduced: "9%, 13%" },
  { country: "Finland", code: "FI", flag: "🇫🇮", standard: "25.5%", reduced: "10%, 13.5%" },
  { country: "France", code: "FR", flag: "🇫🇷", standard: "20%", reduced: "2.1%, 5.5%, 10%" },
  { country: "Germany", code: "DE", flag: "🇩🇪", standard: "19%", reduced: "7%" },
  { country: "Greece", code: "EL", flag: "🇬🇷", standard: "24%", reduced: "4%, 6%, 13%, 17%*" },
  { country: "Hungary", code: "HU", flag: "🇭🇺", standard: "27%", reduced: "5%, 18%" },
  { country: "Ireland", code: "IE", flag: "🇮🇪", standard: "23%", reduced: "4.8%, 9%, 13.5%" },
  { country: "Italy", code: "IT", flag: "🇮🇹", standard: "22%", reduced: "4%, 5%, 10%" },
  { country: "Latvia", code: "LV", flag: "🇱🇻", standard: "21%", reduced: "5%, 12%" },
  { country: "Lithuania", code: "LT", flag: "🇱🇹", standard: "21%", reduced: "5%, 12%" },
  { country: "Luxembourg", code: "LU", flag: "🇱🇺", standard: "17%", reduced: "3%, 8%, 14%" },
  { country: "Malta", code: "MT", flag: "🇲🇹", standard: "18%", reduced: "5%, 7%, 12%" },
  { country: "Netherlands", code: "NL", flag: "🇳🇱", standard: "21%", reduced: "9%" },
  { country: "Poland", code: "PL", flag: "🇵🇱", standard: "23%", reduced: "5%, 8%" },
  { country: "Portugal", code: "PT", flag: "🇵🇹", standard: "23%", reduced: "6%, 13%" },
  { country: "Romania", code: "RO", flag: "🇷🇴", standard: "21%", reduced: "11%" },
  { country: "Slovakia", code: "SK", flag: "🇸🇰", standard: "23%", reduced: "5%, 19%" },
  { country: "Slovenia", code: "SI", flag: "🇸🇮", standard: "22%", reduced: "5%, 9.5%" },
  { country: "Spain", code: "ES", flag: "🇪🇸", standard: "21%", reduced: "4%, 10%" },
  { country: "Sweden", code: "SE", flag: "🇸🇪", standard: "25%", reduced: "6%, 12%" },
];
