import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

// The small "TG." monogram — initials with the mint dot.
export function TGMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-baseline font-bold leading-none tracking-[-0.06em]", className)}>
      {BRAND.initials}
      <span className="ml-[0.06em] inline-block h-[0.22em] w-[0.22em] rounded-full bg-lp-mint" />
    </span>
  );
}

export function LandingLogo({ dark = false }: { dark?: boolean }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2.5", dark ? "text-white" : "text-lp-ink")}>
      <TGMark className="text-[12px]" />
      <span className="text-[19px] font-semibold tracking-[-0.035em]">{BRAND.fullName}</span>
    </Link>
  );
}

// Oversized, rotated "TG." used as a faint background ornament.
export function Watermark({ className, dot }: { className?: string; dot: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute select-none", className)}>
      <span className="relative block font-bold leading-none tracking-[-0.08em]">
        {BRAND.initials}
        <span className={cn("absolute -bottom-[0.02em] -right-[0.32em] h-[0.2em] w-[0.2em] rounded-full", dot)} />
      </span>
    </div>
  );
}

export function WhatsAppButton() {
  return (
    <a
      href={BRAND.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-lp-whatsapp text-white shadow-[0_0_0_10px_rgba(95,207,111,0.12),0_8px_20px_rgba(0,0,0,0.12)] transition-transform hover:scale-105"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden>
        <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.31l-.34-.2-3.57.93.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.23-9.43 9.44-9.43a9.37 9.37 0 0 1 6.67 2.77 9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.3 11.3 0 0 0 12.05.7C5.79.7.7 5.79.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.6l6.02-1.58a11.3 11.3 0 0 0 5.42 1.38h.01c6.26 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02" />
      </svg>
    </a>
  );
}
