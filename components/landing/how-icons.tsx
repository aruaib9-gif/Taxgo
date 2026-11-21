import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

// The marks from the "How Tax GO works" artwork: the three moves (she reads, she
// works, she decides), the green tick on the result list, and the tinted chips for
// the AI team.
//
// Same build as the human marks: a 48×48 grid, a teal→blue gradient and a green
// accent, with `currentColor` standing in for the card behind the icon so badges
// and sheets knock out cleanly. Callers pass a size and nothing else.

export type Mark = (props: { className?: string }) => ReactElement;

const TEAL = "#2BC1C1";
const BLUE = "#2E6FBF";
const GREEN = "#22B455";

function Frame({ id, className, children }: { id: string; className?: string; children: ReactNode }) {
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

/** She reads everything: the invoice and the receipt, under the scanner. */
export const ReadsMark: Mark = ({ className }) => (
  <Frame id="hw-reads" className={className}>
    <path
      d="M4 15V7.5A1.5 1.5 0 0 1 5.5 6H13M44 15V7.5A1.5 1.5 0 0 0 42.5 6H35M4 33v7.5A1.5 1.5 0 0 0 5.5 42H13M44 33v7.5a1.5 1.5 0 0 1-1.5 1.5H35"
      stroke={TEAL}
      strokeWidth="2.4"
      strokeLinecap="round"
    />
    <rect x="10" y="10" width="19" height="27" rx="2.5" fill="currentColor" stroke="url(#hw-reads)" strokeWidth="2" />
    <rect x="13.5" y="13.5" width="12" height="4.6" rx="1.3" fill="url(#hw-reads)" />
    <path d="M13.5 23h11M13.5 27h8" stroke="url(#hw-reads)" strokeWidth="1.7" strokeLinecap="round" opacity="0.5" />
    <path
      d="M25 19.5A1.5 1.5 0 0 1 26.5 18h10a1.5 1.5 0 0 1 1.5 1.5V38l-2.6-1.7-2.6 1.7-2.6-1.7-2.6 1.7L25 36.3z"
      fill="currentColor"
      stroke="url(#hw-reads)"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path d="M28.5 23.5h6M28.5 27.5h6M28.5 31.5h4" stroke="url(#hw-reads)" strokeWidth="1.6" strokeLinecap="round" opacity="0.5" />
  </Frame>
);

/** She does the work: the checklist running itself. */
export const WorksMark: Mark = ({ className }) => (
  <Frame id="hw-works" className={className}>
    <rect x="5" y="7" width="32" height="24" rx="3" fill="currentColor" stroke="url(#hw-works)" strokeWidth="2.2" />
    {[12, 18.5, 25].map((y) => (
      <g key={y}>
        <rect x="9.5" y={y - 2.6} width="5.2" height="5.2" rx="1.4" fill={GREEN} />
        <path d={`m11 ${y} 1.1 1.1 2.1-2.3`} stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d={`M18 ${y}h12`} stroke="url(#hw-works)" strokeWidth="1.8" strokeLinecap="round" opacity="0.45" />
      </g>
    ))}
    <rect x="2" y="33" width="38" height="4.5" rx="2.25" fill="url(#hw-works)" />
    <circle cx="37" cy="31" r="9" fill={GREEN} stroke="currentColor" strokeWidth="2" />
    <circle cx="37" cy="31" r="2.5" stroke="#fff" strokeWidth="1.7" />
    <path
      d="M37 25.6v1.9M37 34.5v1.9M31.6 31h1.9M40.5 31h1.9M33.2 27.2l1.3 1.3M39.5 33.5l1.3 1.3M40.8 27.2l-1.3 1.3M33.2 34.8l1.3-1.3"
      stroke="#fff"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </Frame>
);

/** She brings you the decisions: the trend, and the call to make. */
export const DecidesMark: Mark = ({ className }) => (
  <Frame id="hw-decides" className={className}>
    <rect x="5" y="9" width="32" height="23" rx="3" fill="currentColor" stroke="url(#hw-decides)" strokeWidth="2.2" />
    <rect x="10" y="24" width="3.6" height="4" rx="1.2" fill={GREEN} />
    <rect x="15" y="21.5" width="3.6" height="6.5" rx="1.2" fill={GREEN} />
    <rect x="20" y="19" width="3.6" height="9" rx="1.2" fill={GREEN} />
    <rect x="25" y="16.5" width="3.6" height="11.5" rx="1.2" fill={TEAL} />
    <path d="M10 21.5 16 16l4 2.5 7.5-6.5" stroke="url(#hw-decides)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="2" y="34" width="38" height="4.5" rx="2.25" fill="url(#hw-decides)" />
    <circle cx="38" cy="12" r="8.5" fill={GREEN} stroke="currentColor" strokeWidth="2" />
    <path d="m34.3 12.2 2.6 2.6 4.9-5.2" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
  </Frame>
);

/** The green tick on the result list. */
export function ResultTick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <circle cx="12" cy="12" r="10" fill={GREEN} />
      <path d="m7.8 12.2 2.8 2.8 5.6-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// The AI team: a glyph on its own tinted chip, one hue each, as in the artwork.

const HUES = {
  teal: "#17A8A8",
  blue: "#2E6FBF",
  amber: "#D9992B",
  green: "#22A355",
  pink: "#D9566E",
  purple: "#7F63CC",
  red: "#D9573C",
} as const;

function Chip({ hue, className, children }: { hue: string; className?: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" aria-hidden className={cn("shrink-0", className)}>
      <rect width="48" height="48" rx="13" fill={hue} opacity="0.14" />
      <g transform="translate(12 12)" stroke={hue} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

/** Virtual CFO. */
export const CfoChip: Mark = ({ className }) => (
  <Chip hue={HUES.teal} className={className}>
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M8 6h8" />
    <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h.01M12 18h.01" />
    <path d="M16 14v4" />
  </Chip>
);

/** Virtual accountant. */
export const AccountantChip: Mark = ({ className }) => (
  <Chip hue={HUES.blue} className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M20 21v-1a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v1" />
  </Chip>
);

/** Anomaly detection. */
export const AnomalyChip: Mark = ({ className }) => (
  <Chip hue={HUES.amber} className={className}>
    <path d="M10.3 4 2.3 18a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3L13.7 4a2 2 0 0 0-3.4 0z" />
    <path d="M12 9.5v4M12 17.5h.01" />
  </Chip>
);

/** Cash-flow forecasting. */
export const ForecastChip: Mark = ({ className }) => (
  <Chip hue={HUES.green} className={className}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <path d="m7 14 4-4 3 3 5-6" />
    <path d="M19 7h-3.5M19 7v3.5" />
  </Chip>
);

/** Ask your business anything. */
export const AskChip: Mark = ({ className }) => (
  <Chip hue={HUES.blue} className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.2 9.3a3 3 0 0 1 5.8 1c0 2-3 3-3 3" />
    <path d="M12 17.5h.01" />
  </Chip>
);

/** Smart transaction categorisation. */
export const CategoryChip: Mark = ({ className }) => (
  <Chip hue={HUES.pink} className={className}>
    <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z" />
    <circle cx="7.3" cy="7.3" r="1.1" fill={HUES.pink} />
  </Chip>
);

/** The in-app assistant. */
export const AssistantChip: Mark = ({ className }) => (
  <Chip hue={HUES.purple} className={className}>
    <path d="M21 14.5a2.5 2.5 0 0 1-2.5 2.5H8l-5 4V5.5A2.5 2.5 0 0 1 5.5 3h13A2.5 2.5 0 0 1 21 5.5z" />
  </Chip>
);

/** Compliance and filing. */
export const ComplianceChip: Mark = ({ className }) => (
  <Chip hue={HUES.red} className={className}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 13.5 2 2 4-4" />
  </Chip>
);

/** Insights and reporting. */
export const InsightsChip: Mark = ({ className }) => (
  <Chip hue={HUES.blue} className={className}>
    <path d="M3 3v16a2 2 0 0 0 2 2h16" />
    <rect x="7" y="11" width="3.5" height="6" rx="1" />
    <rect x="14" y="6" width="3.5" height="11" rx="1" />
  </Chip>
);
