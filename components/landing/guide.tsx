import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// The building blocks of a module guide — the long, worked walk-through of one
// Tax GO module. Shared by every page under /modules so the guides read alike.

/** The heading that opens a group of functions. */
export function PartHeading({ title }: { title: string }) {
  return (
    <h2 className="mb-8 mt-14 text-[26px] font-semibold leading-[1.2] tracking-[-0.04em] text-lp-ink first:mt-0">
      {title}
    </h2>
  );
}

/** One function within a group. */
export function Fn({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-lp-line py-8 first-of-type:border-t-0 first-of-type:pt-0">
      <h3 className="text-[20px] font-semibold tracking-[-0.035em] text-lp-ink">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function P({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <p className={cn("mt-3 max-w-3xl leading-[1.65] text-lp-body first:mt-0", small ? "text-[13.5px]" : "text-[14.5px]")}>
      {children}
    </p>
  );
}

/** The small label above an example. */
export function Caption({ children }: { children: ReactNode }) {
  return <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-lp-muted">{children}</p>;
}

/** A caveat in the guide's quieter voice. */
export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-3 max-w-3xl text-[12.5px] leading-[1.6] text-lp-muted">{children}</p>;
}

export function Example({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 max-w-3xl border-l-2 border-lp-brand/40 pl-4 text-[14px] leading-[1.6] text-lp-body">
      <b className="font-semibold text-lp-ink">Example: </b>
      {children}
    </p>
  );
}

export function Formula({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 inline-block rounded-xl bg-lp-alt px-4 py-2.5 font-mono text-[14px] text-lp-ink">{children}</p>
  );
}

export function AiNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 flex max-w-3xl gap-2.5 rounded-xl bg-lp-brand/6 px-4 py-3 text-[13.5px] leading-[1.6] text-lp-body">
      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-lp-brand" strokeWidth={1.75} />
      <span>
        <b className="font-semibold text-lp-ink">How AI helps: </b>
        {children}
      </span>
    </p>
  );
}

export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-lp-line">
      <table className="w-full border-collapse text-left text-[13.5px]">
        <thead>
          <tr className="bg-lp-alt">
            {head.map((h) => (
              <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-lp-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-lp-line">
              {r.map((c, j) => (
                <td key={j} className="px-4 py-2.5 align-top text-lp-body">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A double-entry: account, debit, credit. */
export function Ledger({ rows }: { rows: [string, string, string][] }) {
  return <DataTable head={["Account", "Debit", "Credit"]} rows={rows.map((r) => [...r])} />;
}

/** A workflow across the page, one card per move. */
export function Flow({ steps }: { steps: [string, string][] }) {
  return (
    <ol
      className={cn(
        "mt-4 grid gap-2.5",
        steps.length >= 6 && "sm:grid-cols-2 lg:grid-cols-3",
        steps.length === 5 && "sm:grid-cols-2 lg:grid-cols-5",
        steps.length === 4 && "sm:grid-cols-2 lg:grid-cols-4",
        steps.length <= 3 && "sm:grid-cols-3",
      )}
    >
      {steps.map(([title, text]) => (
        <li key={title} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3.5">
          <p className="text-[14px] font-semibold tracking-[-0.02em] text-lp-ink">{title}</p>
          <p className="mt-1 text-[13px] leading-[1.5] text-lp-muted">{text}</p>
        </li>
      ))}
    </ol>
  );
}

/** A figure with its label, for the small stat rows the guides use. */
export function Figures({ items }: { items: [string, string][] }) {
  return (
    <div className={cn("mt-3 grid gap-2.5", items.length === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-3")}>
      {items.map(([label, value]) => (
        <div key={label} className="rounded-xl border border-lp-line bg-lp-card px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.14em] text-lp-muted">{label}</p>
          <p className="mt-0.5 text-[17px] font-semibold tracking-[-0.02em] text-lp-ink">{value}</p>
        </div>
      ))}
    </div>
  );
}

/** A plain bulleted list of what a function does. */
export function Bullets({ items, title }: { items: string[]; title?: string }) {
  return (
    <>
      {title && <Caption>{title}</Caption>}
      <ul className="mt-3 grid max-w-4xl gap-1.5 text-[13.5px] leading-[1.5] text-lp-body sm:grid-cols-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden className="mt-1.75 h-1 w-1 shrink-0 rounded-full bg-lp-brand" />
            {item}
          </li>
        ))}
      </ul>
    </>
  );
}
