// Single source of truth for the brand. The source platform ships three names
// (Tax GO / Özra / BSuit ERP); replicate with ONE configurable brand.
export const BRAND = {
  name: "Tax GO",
  fullName: "Tax GO",
  tagline: "Say Tax GO and it's sorted.",
  initials: "TG",
  // The demo org + user from the capture, used for the default shell state.
  org: "AfriHub",
  user: { name: "Udu", fullName: "Udu Arua", initials: "UA" },
  currency: "$", // AfriHub's base currency on the live platform (USD)
  company: "Taxgoglobal Limited",
  contact: {
    address: "42 Summit Trail, Petawawa, Ontario K8H 3N5, Canada",
    phone: "+1-343-999-1997",
    phoneHref: "tel:+13439991997",
    email: "info@taxgoglobal.com",
    website: "www.taxgoglobal.com",
    websiteHref: "https://www.taxgoglobal.com",
  },
  // Sales WhatsApp chat link — append the business number, e.g. https://wa.me/971500000000
  whatsapp: "https://wa.me/",
} as const;
