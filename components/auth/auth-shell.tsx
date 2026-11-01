import { BrandMark } from "@/components/brand-mark";
import { BRAND } from "@/lib/brand";
import { WorkingPanel } from "./working-panel";

function Copyright({ className }: { className?: string }) {
  return <p className={className}>© 2026 {BRAND.fullName}. All rights reserved.</p>;
}

// Auth screens use the live product's tighter 0.2rem spacing unit, scoped here so the rest of the app is unaffected.
const AUTH_SPACING = "[--spacing:0.2rem]";

// Form on the left, the animated "she's working" panel on the right (lg+).
export function AuthSplit({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className={`${AUTH_SPACING} min-h-screen w-full bg-body lg:grid lg:grid-cols-2`}>
      <div className="flex min-h-screen flex-col px-6 py-8 sm:px-10">
        <div className="flex justify-center lg:justify-start">
          <BrandMark href="/" />
        </div>
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm animate-lp-rise">{children}</div>
        </div>
        <Copyright className="text-center text-xs text-muted-foreground/70 lg:text-start" />
      </div>

      <div
        aria-hidden
        className="relative hidden overflow-hidden border-s border-border bg-linear-to-br from-secondary/70 via-body to-accent/60 lg:flex lg:items-center lg:justify-center lg:p-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,color-mix(in_srgb,var(--primary)_7%,transparent),transparent_45%)] opacity-50" />
        <div className="relative">
          <WorkingPanel kicker={kicker} />
        </div>
      </div>
    </div>
  );
}

// Logo on top, one card in the middle, copyright at the bottom.
export function AuthCentered({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${AUTH_SPACING} flex min-h-screen flex-col bg-body px-6 py-8`}>
      <div className="flex justify-center">
        <BrandMark href="/" />
      </div>
      <div className="flex flex-1 items-center justify-center py-8">
        <div className="w-full max-w-md animate-lp-rise rounded-2xl border border-border bg-card p-5 shadow-sm">{children}</div>
      </div>
      <Copyright className="text-center text-xs text-muted-foreground/70" />
    </div>
  );
}
