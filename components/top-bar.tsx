"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight, Bell, BookOpen, Building2, Check, ChevronDown, ClipboardCheck, ExternalLink, Inbox, Menu, Network, Package, Settings, Store } from "lucide-react";
import { ThemeMenu } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { LanguageMenu } from "@/components/auth/fields";
import { useDismiss } from "@/lib/use-dismiss";
import { ROOT_UNIT, activeScope, setActiveUnit, useCollection, type Rec } from "@/lib/store";
import { HEAD_OFFICE } from "@/lib/system";
import { useCompanyName } from "@/lib/companies";
import { cn } from "@/lib/utils";

// The unit only changes with a page reload (see OrgSwitcher.pick), so there is nothing to subscribe to.
const noSubscribe = () => () => {};

const iconButton = "inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      <button type="button" onClick={onMenu} aria-label="Open menu" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent lg:hidden">
        <Menu className="h-4 w-4" />
      </button>
      <Link
        href="/"
        aria-label="Back to the website"
        title="Back to the website"
        className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back to website</span>
      </Link>
      <div className="flex-1" />
      <OrgSwitcher />
      <LanguageMenu />
      <ThemeMenu />
      <Notifications />
      <UserMenu />
    </header>
  );
}

// Company / branch picker. Picking a unit switches this tab into it (see lib/store.ts): a unit that keeps
// its own books or inventory has its own data; any other unit records into the nearest one above it.
function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const stored = useCollection("org-units");
  const companyName = useCompanyName();
  // The active unit lives in browser storage; the server render (and first paint) shows the head office.
  const scopeKey = useSyncExternalStore(
    noSubscribe,
    () => { const x = activeScope(); return `${x.unit}|${x.books}|${x.stock}`; },
    () => `${ROOT_UNIT}|${ROOT_UNIT}|${ROOT_UNIT}`,
  );
  const [unitId, booksId, stockId] = scopeKey.split("|");
  const scope = { unit: unitId, books: booksId, stock: stockId };
  const note = "px-2 py-1.5 text-[11px] leading-snug text-muted-foreground [&>svg]:mr-1 [&>svg]:inline [&>svg]:h-3 [&>svg]:w-3 [&>svg]:align-[-2px]";

  const units = stored.some((u) => u.id === ROOT_UNIT) ? stored : [HEAD_OFFICE as unknown as Rec, ...stored];
  const byId = new Map(units.map((u) => [u.id, u]));
  const kids = (pid: string | null) => units.filter((u) => (u.parentId ?? null) === pid && u.id !== ROOT_UNIT);
  const rows: { u: Rec; depth: number }[] = [];
  const walk = (u: Rec, depth: number) => {
    rows.push({ u, depth });
    kids(u.id).forEach((c) => walk(c, depth + 1));
  };
  walk(byId.get(ROOT_UNIT)!, 0);
  kids(null).forEach((u) => walk(u, 0));

  const current = byId.get(scope.unit) ?? byId.get(ROOT_UNIT)!;
  const atRoot = current.id === ROOT_UNIT;
  const nameOf = (id: string) => String(byId.get(id)?.name ?? "Head Office");

  function pick(id: string) {
    setOpen(false);
    if (id === scope.unit) return;
    setActiveUnit(id);
    window.location.reload(); // every screen re-reads its data for the new unit
  }

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title={atRoot ? companyName : `${companyName} · ${String(current.name)}`}
        className="flex h-9 w-[240px] items-center gap-2 rounded-md border border-border bg-background px-3 text-sm hover:bg-muted"
      >
        <Network className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-left">
          {companyName}
          {!atRoot && <span className="text-muted-foreground"> · {String(current.name)}</span>}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-[320px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Show</div>
          <div className="max-h-72 overflow-y-auto">
            {rows.map(({ u, depth }) => {
              const isActive = u.id === scope.unit;
              return (
                <div key={u.id} className={cn("flex items-center gap-1 rounded-sm px-1 hover:bg-accent", isActive && "bg-accent/60")}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isActive}
                    onClick={() => pick(u.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm"
                    style={{ paddingLeft: depth * 14 }}
                  >
                    {u.id === ROOT_UNIT ? <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" /> : <Store className="h-4 w-4 shrink-0 text-muted-foreground" />}
                    <span className="truncate">{String(u.name)}</span>
                    {(u.id === ROOT_UNIT || !!u.ownBooks) && <BookOpen aria-label="Own books" className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    {!!u.ownInventory && !u.ownBooks && <Package aria-label="Own inventory" className="h-3.5 w-3.5 shrink-0 text-warning" />}
                    {isActive && <Check aria-hidden className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                  </button>
                  <a
                    href={`/home?unit=${encodeURIComponent(u.id)}`}
                    target="_blank"
                    rel="noopener"
                    title={`Open ${String(u.name)} in a new tab`}
                    aria-label={`Open ${String(u.name)} in a new tab`}
                    className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
          {!atRoot && (
            <p className="mx-1 mt-1 rounded-sm bg-muted px-2 py-1.5 text-[11px] leading-snug text-muted-foreground">
              Working in <b className="font-semibold text-foreground">{String(current.name)}</b>
              {scope.books === scope.unit ? " — its own books" : <> — records into <b className="font-semibold text-foreground">{nameOf(scope.books)}</b>&rsquo;s books</>}
              {scope.stock !== scope.books && <>, own inventory</>}.
            </p>
          )}
          <div className="-mx-1 my-1 h-px bg-muted" />
          <p className={note}>
            <BookOpen className="text-primary" />
            keeps its own books — picking it opens that ledger. Everything else reports inside the books above it.
          </p>
          <p className={note}>
            <Package className="text-warning" />
            keeps its own inventory — products, warehouses and stock are isolated.
          </p>
          <p className={note}>
            <ExternalLink />
            opens that branch in a new browser tab, so you can compare two side by side.
          </p>
          <div className="-mx-1 my-1 h-px bg-muted" />
          <Link href="/settings/organization" onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
            <Settings className="h-4 w-4 text-muted-foreground" /> Manage organisation
          </Link>
          <Link href="/select-company" onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent">
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" /> Switch company
          </Link>
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Notifications" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className={iconButton}>
        <Bell className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md">
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <div className="text-sm font-semibold">Notifications</div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <div className="px-3 py-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</div>
          </div>
          <div className="border-t border-border">
            <Link href="/approvals" onClick={close} className="flex items-center justify-between px-3 py-2 text-xs transition-colors hover:bg-accent">
              <span className="flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" /> Pending approvals
              </span>
              <span className="rounded-md border border-border px-2.5 py-0.5 text-[10px] font-semibold">Soon</span>
            </Link>
            <Link href="/workspace" onClick={close} className="flex items-center gap-1.5 px-3 py-2 text-xs transition-colors hover:bg-accent">
              <Inbox className="h-3.5 w-3.5" /> Open My Workspace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
