// The visitor's country (ISO alpha-2) from the hosting platform's geolocation header, so the pricing page
// can open on it. Returns { country: null } when the host adds no such header (e.g. local dev).

const HEADERS = ["x-vercel-ip-country", "cf-ipcountry", "cloudfront-viewer-country", "x-country-code"];

export function GET(request: Request) {
  const raw = HEADERS.map((h) => request.headers.get(h)).find(Boolean) ?? "";
  const code = raw.trim().toUpperCase();
  // Cloudflare uses XX for unknown and T1 for Tor.
  const country = /^[A-Z]{2}$/.test(code) && code !== "XX" && code !== "T1" ? code : null;
  return Response.json({ country }, { headers: { "Cache-Control": "private, no-store" } });
}
