"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, BookOpen, ChevronDown, ClipboardCheck, ExternalLink, Inbox, Menu, Network, Package, Store } from "lucide-react";
import { ThemeMenu } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { LanguageMenu } from "@/components/auth/fields";
import { BRAND } from "@/lib/brand";
import { useDismiss } from "@/lib/use-dismiss";

const iconButton = "inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b border-border bg-background px-4 lg:px-6">
      <button type="button" onClick={onMenu} aria-label="Open menu" className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent lg:hidden">
        <Menu className="h-4 w-4" />
      </button>
      <div className="flex-1" />
      <OrgSwitcher />
      <LanguageMenu />
      <ThemeMenu />
      <Notifications />
      <UserMenu />
    </header>
  );
}

// Company / branch picker. Each branch can keep its own books and inventory.
function OrgSwitcher() {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, setOpen);
  const note = "px-2 py-1.5 text-[11px] leading-snug text-muted-foreground [&>svg]:mr-1 [&>svg]:inline [&>svg]:h-3 [&>svg]:w-3 [&>svg]:align-[-2px]";

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 w-[240px] items-center gap-2 rounded-md border border-border bg-background px-3 text-sm hover:bg-muted"
      >
        <Network className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="min-w-0 flex-1 truncate text-left">{BRAND.org}</span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-[300px] rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md">
          <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Show</div>
          <div className="flex items-center gap-1 rounded-sm px-1 hover:bg-accent">
            <button type="button" role="menuitem" onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left text-sm">
              <Store className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                <span className="truncate">Head Office</span>
              </span>
            </button>
            <a
              href="/home"
              target="_blank"
              rel="noopener"
              title="Open Head Office in a new tab"
              className="grid h-6 w-6 shrink-0 place-items-center rounded text-muted-foreground hover:bg-background hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
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
