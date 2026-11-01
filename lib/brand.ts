// Single source of truth for the brand. The source platform ships three names
// (Tax GO.ai / Özra / BSuit ERP); replicate with ONE configurable brand.
export const BRAND = {
  name: "Tax GO",
  fullName: "Tax GO.ai",
  tagline: "Tell Tax GO.ai It's handled.",
  initials: "TG",
  // The demo org + user from the capture, used for the default shell state.
  org: "AfriHub",
  user: { name: "Udu", fullName: "Udu Arua", initials: "UA" },
  currency: "$", // AfriHub's base currency on the live platform (USD)
  // Sales WhatsApp chat link — append the business number, e.g. https://wa.me/971500000000
  whatsapp: "https://wa.me/",
} as const;
