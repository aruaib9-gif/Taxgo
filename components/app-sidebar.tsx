"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronUp, ChevronsLeft, ChevronsRight, Ellipsis, Info, Search, X } from "lucide-react";
import { groupForPath, railMore, railPrimary, topLinks, type NavGroup } from "@/lib/nav";
import { TLogo } from "@/components/landing/brand";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "taxgo:rail-collapsed";
const ALL_MODULES_KEY = "taxgo:show-all-modules";

function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}
function writeFlag(key: string, on: boolean) {
  try {
    localStorage.setItem(key, on ? "1" : "0");
  } catch {}
}

const rowBase = "relative flex h-11 w-full items-center overflow-hidden rounded-md transition-colors";
const rowIdle = "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const rowActive = "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary";

function RowIcon({ children }: { children: React.ReactNode }) {
  return <span className="flex h-11 w-10 shrink-0 items-center justify-center [&>svg]:h-4 [&>svg]:w-4">{children}</span>;
}

function RowLabel({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "flex flex-1 items-center gap-1 truncate text-left text-sm transition-[opacity,transform] duration-150 motion-reduce:transition-none",
        collapsed ? "-translate-x-1 opacity-0" : "translate-x-0 opacity-100 panel-open:-translate-x-1 panel-open:opacity-0",
      )}
    >
      {children}
    </span>
  );
}

const Divider = () => <div aria-hidden className="my-1 h-px shrink-0 bg-sidebar-border" />;

// Desktop: icon rail + the selected group's panel. Mobile: the same content in a drawer.
export function AppSidebar({ mobileOpen, onMobileClose }: { mobileOpen: boolean; onMobileClose: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showAll, setShowAll] = useState(false);
  // undefined = follow the route (a group's pages open its panel); null = closed by the user.
  const [panel, setPanel] = useState<string | null | undefined>(undefined);
  const [lastPanel, setLastPanel] = useState<string | null>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setPanel(undefined);
  }
  const currentGroup = groupForPath(pathname)?.key;
  const openKey = panel === undefined ? (currentGroup ?? null) : panel;

  // Restore persisted rail preferences after mount (localStorage isn't available during SSR).
  useEffect(() => {
    const t = setTimeout(() => {
      setCollapsed(readFlag(COLLAPSED_KEY));
      setShowAll(readFlag(ALL_MODULES_KEY));
    }, 0);
    return () => clearTimeout(t);
  }, []);

  // Ctrl+\ toggles labels, Ctrl+B toggles the group panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === "\\") {
        e.preventDefault();
        setCollapsed((c) => {
          writeFlag(COLLAPSED_KEY, !c);
          return !c;
        });
      } else if (e.key.toLowerCase() === "b") {
        e.preventDefault();
        setPanel(openKey ? null : (lastPanel ?? currentGroup ?? null));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lastPanel, openKey, currentGroup]);

  const expanded = showAll || showMore;
  const entries = expanded ? [...railPrimary, ...railMore] : railPrimary;
  const openGroup = [...railPrimary, ...railMore].find((e) => e.key === openKey)?.group ?? null;

  function togglePanel(key: string) {
    setPanel(openKey === key ? null : key);
    setLastPanel(key);
  }

  function toggleCollapsed() {
    setCollapsed((c) => {
      writeFlag(COLLAPSED_KEY, !c);
      return !c;
    });
  }

  const rail = (isDrawer: boolean) => {
    const narrow = collapsed && !isDrawer;
    return (
      <nav
        aria-label="Main navigation"
        className={cn(
          "relative z-10 flex h-full shrink-0 flex-col gap-0.5 overflow-hidden border-r border-sidebar-border bg-sidebar p-2 transition-[width] duration-200 motion-reduce:transition-none",
          narrow ? "w-14" : "w-60 panel-open:w-14",
        )}
      >
        <div className="mb-1 flex h-10 shrink-0 items-center justify-between px-1 text-sidebar-foreground">
          <Link href="/home" onClick={onMobileClose} className="inline-flex min-w-0 items-center gap-2 text-base font-semibold tracking-tight">
            <TLogo className="h-7 w-7" />
            {!narrow && <span className="truncate panel-open:hidden">{BRAND.name}</span>}
          </Link>
          {isDrawer && (
            <button type="button" onClick={onMobileClose} aria-label="Close menu" className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {topLinks.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              onClick={onMobileClose}
              aria-label={l.label}
              aria-current={active ? "page" : undefined}
              title={narrow ? l.label : undefined}
              className={cn(rowBase, active ? rowActive : rowIdle)}
            >
              <RowIcon>
                <l.icon />
              </RowIcon>
              <RowLabel collapsed={narrow}>{l.label}</RowLabel>
            </Link>
          );
        })}
        <Divider />

        <div className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden">
          {entries.map(({ key, divider, group }) => {
            const active = openKey === key || currentGroup === key;
            return (
              <div key={key}>
                <button
                  type="button"
                  aria-label={group.label}
                  aria-expanded={openKey === key}
                  title={narrow ? group.label : undefined}
                  onClick={() => togglePanel(key)}
                  className={cn(rowBase, active ? rowActive : rowIdle)}
                >
                  <RowIcon>
                    <group.icon />
                  </RowIcon>
                  <RowLabel collapsed={narrow}>{group.label}</RowLabel>
                </button>
                {divider && <Divider />}
              </div>
            );
          })}
        </div>

        <div className="shrink-0">
          {!showAll && (
            <>
              <Divider />
              <button
                type="button"
                aria-expanded={showMore}
                aria-label={showMore ? `Show ${railMore.length} fewer menu items` : `Show ${railMore.length} more menu items`}
                title={narrow ? (showMore ? "Show less" : "Show more") : undefined}
                onClick={() => setShowMore((s) => !s)}
                className={cn(rowBase, "font-medium", showMore ? rowActive : rowIdle)}
              >
                <RowIcon>{showMore ? <ChevronUp /> : <Ellipsis />}</RowIcon>
                <RowLabel collapsed={narrow}>
                  {showMore ? "Show less" : "Show more"}
                  <span className="text-xs text-muted-foreground/70">({railMore.length})</span>
                </RowLabel>
              </button>
            </>
          )}
          {!isDrawer && (
            <>
              <Divider />
              <button
                type="button"
                aria-expanded={!collapsed}
                aria-label={collapsed ? "Expand menu" : "Collapse menu"}
                title={`${collapsed ? "Expand" : "Collapse"} menu (Ctrl+\\)`}
                onClick={toggleCollapsed}
                className={cn(rowBase, "font-medium", rowIdle)}
              >
                <RowIcon>{collapsed ? <ChevronsRight /> : <ChevronsLeft />}</RowIcon>
                <RowLabel collapsed={narrow}>Collapse</RowLabel>
              </button>
            </>
          )}
        </div>

        {!narrow && (
          <div className="shrink-0 pt-1 panel-open:hidden">
            <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <span className="truncate">Show all modules</span>
              <button
                type="button"
                role="switch"
                aria-checked={showAll}
                onClick={() =>
                  setShowAll((s) => {
                    writeFlag(ALL_MODULES_KEY, !s);
                    return !s;
                  })
                }
                className={cn(
                  "inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent shadow-sm transition-colors",
                  showAll ? "bg-primary" : "bg-input",
                )}
              >
                <span className={cn("block h-4 w-4 rounded-full bg-background shadow-lg transition-transform", showAll ? "translate-x-4" : "translate-x-0")} />
              </button>
            </label>
          </div>
        )}
      </nav>
    );
  };

  return (
    <>
      <div className="hidden h-full shrink-0 lg:flex">
        {rail(false)}
        {openGroup && <GroupPanel key={openGroup.key} group={openGroup} pathname={pathname} onClose={() => setPanel(null)} />}
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onMobileClose} />
          <div className="relative flex h-full">
            {rail(true)}
            {openGroup && <GroupPanel key={openGroup.key} group={openGroup} pathname={pathname} onClose={() => setPanel(null)} onNavigate={onMobileClose} />}
          </div>
        </div>
      )}
    </>
  );
}

function GroupPanel({
  group,
  pathname,
  onClose,
  onNavigate,
}: {
  group: NavGroup;
  pathname: string;
  onClose: () => void;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const items = q ? group.items.filter((it) => it.label.toLowerCase().includes(q)) : group.items;

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar panel-open:w-14 panel-expanded:hidden">
      <header className="flex h-14 shrink-0 items-center gap-1 border-b border-sidebar-border px-3 panel-open:justify-center panel-open:px-0">
        <h2 className="flex-1 truncate text-sm font-semibold text-sidebar-foreground panel-open:hidden">{group.label}</h2>
        <span title={group.description} className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground panel-open:hidden">
          <Info className="h-4 w-4" />
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Collapse panel (Ctrl+B)"
          aria-label="Collapse panel"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
      </header>
      <div className="shrink-0 border-b border-sidebar-border p-2 panel-open:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label={`Search ${group.label}`}
            className="h-9 w-full rounded-md border border-sidebar-border bg-background pl-8 pr-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <p className="px-2.5 py-2 text-sm text-muted-foreground">No matches.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {items.map((it) => {
              const active = pathname === it.href;
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={it.label}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors panel-open:justify-center panel-open:px-0",
                      active ? "bg-primary/10 font-medium text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <span className={cn("shrink-0 [&_svg]:h-4 [&_svg]:w-4", active ? "text-primary" : "text-muted-foreground")}>
                      <it.icon />
                    </span>
                    <span className="truncate panel-open:hidden">{it.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
