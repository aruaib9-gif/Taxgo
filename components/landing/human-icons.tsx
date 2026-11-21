import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

// The six human-expert marks, drawn to match the "humans behind Tax GO" artwork:
// a laptop with a person badge, the CFO and his bars, the TAX filing, the payroll
// card, the audit shield and the migration cloud.
//
// Each mark is a two-tone teal→blue gradient with a green accent badge, on a 48×48
// grid. `currentColor` is the card behind the icon — it knocks the badges and the
// front sheets out of what sits under them — so the wrapper sets text-lp-card and
// callers pass only a size.

export type HumanMark = (props: { className?: string }) => ReactElement;

const TEAL = "#2BC1C1";
const BLUE = "#2E6FBF";
const GREEN = "#22B455";

function Mark({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={cn("shrink-0 text-lp-card", className)}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={TEAL} />
          <stop offset="1" stopColor={BLUE} />
        </linearGradient>
      </defs>
      {children}
    </svg>
  );
}

/** A laptop showing the books, with the accountant's badge on the corner. */
export const AccountantMark: HumanMark = ({ className }) => (
  <Mark id="hm-accountant" className={className}>
    <rect x="5" y="6" width="32" height="24" rx="3.5" stroke="url(#hm-accountant)" strokeWidth="2.2" />
    <path d="M10 12h12M10 16h8" stroke="url(#hm-accountant)" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    <rect x="10" y="21" width="3.4" height="5" rx="1.2" fill={GREEN} />
    <rect x="15.8" y="18" width="3.4" height="8" rx="1.2" fill={GREEN} />
    <rect x="21.6" y="14.5" width="3.4" height="11.5" rx="1.2" fill={TEAL} />
    <rect x="2" y="32.5" width="38" height="4.5" rx="2.25" fill="url(#hm-accountant)" />
    <circle cx="37" cy="31" r="9" fill="url(#hm-accountant)" stroke="currentColor" strokeWidth="2" />
    <circle cx="37" cy="28.2" r="2.9" fill="#fff" />
    <path d="M31.8 35.9c.6-2.6 2.7-4.1 5.2-4.1s4.6 1.5 5.2 4.1A8.9 8.9 0 0 1 37 40a8.9 8.9 0 0 1-5.2-4.1z" fill="#fff" />
  </Mark>
);

/** The CFO in a suit, beside his rising bars. */
export const CfoMark: HumanMark = ({ className }) => (
  <Mark id="hm-cfo" className={className}>
    <circle cx="16" cy="12.5" r="6.8" fill="url(#hm-cfo)" />
    <path d="M4 39v-2c0-5.9 5.4-10.4 12-10.4S28 31.1 28 37v2z" fill="url(#hm-cfo)" />
    <path d="M13.4 27 16 31l2.6-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M16 31l-1.3 8h2.6z" fill={GREEN} />
    <rect x="31" y="28" width="4.6" height="11" rx="1.4" fill={GREEN} />
    <rect x="37.4" y="22.5" width="4.6" height="16.5" rx="1.4" fill={TEAL} />
    <rect x="43.8" y="17" width="4.2" height="22" rx="1.4" fill={BLUE} />
  </Mark>
);

/** The TAX return, filed and ticked. */
export const TaxFilingMark: HumanMark = ({ className }) => (
  <Mark id="hm-tax" className={className}>
    <rect x="15" y="4" width="22" height="30" rx="3" stroke="url(#hm-tax)" strokeWidth="2" opacity="0.4" />
    <rect x="7" y="8" width="22" height="31" rx="3" fill="currentColor" stroke="url(#hm-tax)" strokeWidth="2.2" />
    <rect x="11" y="12" width="14" height="9" rx="2.2" stroke="url(#hm-tax)" strokeWidth="1.6" />
    <text x="18" y="18.8" textAnchor="middle" fontSize="6.6" fontWeight="700" letterSpacing="0.2" fill="url(#hm-tax)">
      TAX
    </text>
    <path d="M11 26h14M11 30h10" stroke="url(#hm-tax)" strokeWidth="1.8" strokeLinecap="round" opacity="0.5" />
    <circle cx="34" cy="33" r="8.5" fill={GREEN} stroke="currentColor" strokeWidth="2" />
    <path d="m30.3 33.2 2.6 2.6 4.9-5.2" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Mark>
);

/** The payroll card: an employee and what they are paid. */
export const PayrollMark: HumanMark = ({ className }) => (
  <Mark id="hm-payroll" className={className}>
    <path d="M15 4v5M29 4v5" stroke="url(#hm-payroll)" strokeWidth="2.6" strokeLinecap="round" />
    <rect x="4" y="8" width="35" height="28" rx="4.5" stroke="url(#hm-payroll)" strokeWidth="2.2" />
    <circle cx="15.5" cy="18" r="3.8" fill="url(#hm-payroll)" />
    <path d="M9.3 28.5c0-3.5 2.8-5.7 6.2-5.7s6.2 2.2 6.2 5.7z" fill="url(#hm-payroll)" />
    <path d="M26 17h8M26 22h6" stroke="url(#hm-payroll)" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
    <circle cx="34" cy="31" r="8.5" fill={GREEN} stroke="currentColor" strokeWidth="2" />
    <text x="34" y="35.2" textAnchor="middle" fontSize="11.5" fontWeight="700" fill="#fff">
      $
    </text>
  </Mark>
);

/** The audit shield over the schedules it backs up. */
export const AuditMark: HumanMark = ({ className }) => (
  <Mark id="hm-audit" className={className}>
    <rect x="24" y="14" width="17" height="23" rx="2.5" fill="currentColor" stroke="url(#hm-audit)" strokeWidth="2" />
    <path d="M28.5 20.5h8M28.5 25h8M28.5 29.5h5" stroke="url(#hm-audit)" strokeWidth="1.7" strokeLinecap="round" opacity="0.5" />
    <path
      d="M18 4 5 9.2v10.4c0 8.9 5.5 14.3 13 17.2 7.5-2.9 13-8.3 13-17.2V9.2z"
      fill="url(#hm-audit)"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="m12.4 19.8 3.9 3.9 7.3-7.6" stroke="#fff" strokeWidth="2.7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </Mark>
);

/** Your books going up into Tax GO. */
export const MigrationMark: HumanMark = ({ className }) => (
  <Mark id="hm-migration" className={className}>
    <rect x="7" y="8" width="34" height="24" rx="3" stroke="url(#hm-migration)" strokeWidth="2" opacity="0.4" />
    <path d="M21 32v5M27 32v5" stroke="url(#hm-migration)" strokeWidth="2.2" strokeLinecap="round" opacity="0.45" />
    <rect x="14" y="37" width="20" height="3.2" rx="1.6" fill="url(#hm-migration)" />
    <g transform="translate(3 2) scale(1.55)" stroke="url(#hm-migration)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" fill="currentColor" />
      <path d="M12.3 16.4v-6m0 0-2.4 2.4m2.4-2.4 2.4 2.4" fill="none" />
    </g>
  </Mark>
);
