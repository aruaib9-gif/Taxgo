"use client";

import { useEffect, useState } from "react";

// A tiny localStorage-backed collection store so "New X" forms create records
// that persist (per browser) and show up in the lists. Swap for a real API later.

export type Rec = Record<string, unknown> & { id: string };

/* ---------- companies and organisation units ----------
   A login can work in several companies (the "Choose a company" screen); each company's data is fully
   separate. Inside a company, the top-bar switcher picks the active unit (per browser tab): a unit that
   keeps its own books gets its own copy of every collection, one that keeps its own inventory gets its
   own stock collections, and anything else records into the nearest unit above it that does.
   The default company and its head office use the plain keys, so existing data stays where it was. */

export const DEFAULT_COMPANY = "main";
export const ROOT_UNIT = "HEAD_OFFICE";
const ACTIVE_COMPANY_KEY = "taxgo:active-company";
/** Belong to the login, not to a company. */
const ACCOUNT = new Set(["companies", "active-company"]);
/** Shared by every unit of a company: who can sign in, the org chart itself and system-wide settings. */
const GLOBAL = new Set(["org-units", "users", "roles", "system-settings", "audit-log", "welcomed"]);
/** Isolated by a unit that keeps its own inventory. */
const INVENTORY = new Set(["products", "product-batches", "product-attributes", "product-categories", "warehouses", "bins", "bin-moves", "stock-moves", "stock-transfers", "stock-journals", "stock-counts", "stock-change-requests", "serial-numbers", "reorder-rules", "scrap-orders"]);

const pinned = (k: string) => {
  try {
    return window.sessionStorage.getItem(k) ?? window.localStorage.getItem(k);
  } catch {
    return null;
  }
};
const pin = (k: string, v: string) => {
  try {
    window.sessionStorage.setItem(k, v);
    window.localStorage.setItem(k, v);
  } catch {}
};

export function activeCompanyId(): string {
  if (typeof window === "undefined") return DEFAULT_COMPANY;
  return pinned(ACTIVE_COMPANY_KEY) ?? DEFAULT_COMPANY;
}

/** Storage prefix for the active company's data. */
const companyBase = () => {
  const id = activeCompanyId();
  return id === DEFAULT_COMPANY ? "taxgo:" : `taxgo:co:${id}:`;
};
const activeUnitKey = () => `${companyBase()}active-unit`;

if (typeof window !== "undefined") {
  // ?company= / ?unit= (the switchers' "open in new tab") pin that tab to a company and unit.
  try {
    const q = new URLSearchParams(window.location.search);
    const co = q.get("company");
    if (co) window.sessionStorage.setItem(ACTIVE_COMPANY_KEY, co);
    const unit = q.get("unit");
    if (unit) window.sessionStorage.setItem(activeUnitKey(), unit);
  } catch {}
}

/** Switches this tab (and new tabs) to a company, starting at its head office. Callers reload. */
export function setActiveCompany(id: string) {
  pin(ACTIVE_COMPANY_KEY, id);
}

export function activeUnitId(): string {
  if (typeof window === "undefined") return ROOT_UNIT;
  return pinned(activeUnitKey()) ?? ROOT_UNIT;
}

/** Switches this tab (and new tabs) to a unit. Callers reload so every screen re-reads its data. */
export function setActiveUnit(id: string) {
  pin(activeUnitKey(), id);
}

let scopeCache: { raw: string | null; base: string; active: string; books: string; stock: string } | null = null;

/** The units whose books and inventory the active unit works in. */
export function activeScope(): { unit: string; books: string; stock: string } {
  const active = activeUnitId();
  const base = companyBase();
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(`${base}org-units`);
  } catch {}
  if (!scopeCache || scopeCache.raw !== raw || scopeCache.base !== base || scopeCache.active !== active) {
    const units = new Map<string, Rec>((raw ? (JSON.parse(raw) as Rec[]) : []).map((u) => [u.id, u]));
    let books = ROOT_UNIT;
    let stock = "";
    // Walk up from the active unit to the first one that keeps its own books (and inventory).
    for (let id: string | null = active, hops = 0; id && id !== ROOT_UNIT && hops < 50; hops++) {
      const u = units.get(id);
      if (!u) break;
      if (!stock && u.ownInventory) stock = id;
      if (u.ownBooks) {
        books = id;
        break;
      }
      id = (u.parentId as string | null) ?? null;
    }
    scopeCache = { raw, base, active, books, stock: stock || books };
  }
  return { unit: active, books: scopeCache.books, stock: scopeCache.stock };
}

const key = (c: string) => {
  if (ACCOUNT.has(c) || typeof window === "undefined") return `taxgo:${c}`;
  const base = companyBase();
  if (GLOBAL.has(c)) return `${base}${c}`;
  const s = activeScope();
  const owner = INVENTORY.has(c) ? s.stock : s.books;
  return owner === ROOT_UNIT ? `${base}${c}` : `${base}u:${owner}:${c}`;
};

/** The collection a raw storage key holds for the active company and unit, or null if it belongs elsewhere. */
export function collectionOfKey(k: string): string | null {
  const base = companyBase();
  if (!k.startsWith(base) || (base === "taxgo:" && k.startsWith("taxgo:co:"))) return null;
  const rest = k.slice(base.length);
  const m = /^u:[^:]+:(.+)$/.exec(rest);
  const c = m ? m[1] : rest;
  return ACCOUNT.has(c) ? null : key(c) === k ? c : null;
}

const listeners = new Map<string, Set<() => void>>();

function emit(c: string) {
  listeners.get(c)?.forEach((cb) => cb());
}

export function readCollection(c: string): Rec[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key(c));
    return raw ? (JSON.parse(raw) as Rec[]) : [];
  } catch {
    return [];
  }
}

// Every create / update / delete is logged (newest last, capped) except the log itself and chatter.
const UNAUDITED = new Set(["audit-log", "ai-actions", "ai-chats", "system-settings", "sample-index", "campaign-sends"]);
function audit(c: string, action: "INSERT" | "UPDATE" | "DELETE", id: string, data?: Record<string, unknown>) {
  if (UNAUDITED.has(c) || typeof window === "undefined") return;
  try {
    const log = JSON.parse(window.localStorage.getItem(key("audit-log")) ?? "[]") as Rec[];
    const label = data ? String(data.number ?? data.name ?? data.title ?? data.description ?? "") : "";
    log.push({ id: crypto.randomUUID(), at: new Date().toISOString(), action, table: c, recordId: id, by: "Udu Arua", summary: label.slice(0, 80), fields: data ? Object.keys(data).filter((k) => k !== "id").slice(0, 12) : [] });
    window.localStorage.setItem(key("audit-log"), JSON.stringify(log.slice(-2000)));
    emit("audit-log");
  } catch {}
}

function write(c: string, rows: Rec[]) {
  try {
    window.localStorage.setItem(key(c), JSON.stringify(rows));
  } catch {}
  emit(c);
}

export function createRecord(c: string, data: Record<string, unknown>): Rec {
  const rec: Rec = { id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...data };
  write(c, [...readCollection(c), rec]);
  audit(c, "INSERT", rec.id, data);
  return rec;
}

export function updateRecord(c: string, id: string, data: Record<string, unknown>) {
  write(
    c,
    readCollection(c).map((r) => (r.id === id ? { ...r, ...data } : r)),
  );
  audit(c, "UPDATE", id, data);
}

export function deleteRecord(c: string, id: string) {
  const gone = readCollection(c).find((r) => r.id === id);
  write(c, readCollection(c).filter((r) => r.id !== id));
  audit(c, "DELETE", id, gone);
}

// Settings › Document Numbering can override a series: { prefix, start, padding }. The prefix may
// carry {YYYY}/{MM}; the number is the next free one at or above `start` for that prefix. Pure, so
// form previews can call it.
export function nextNumber(c: string, prefix: string, pad = 2): string {
  const cfg = readCollection("doc-numbering").find((r) => r.coll === c);
  if (!cfg) return `${prefix}-${String(readCollection(c).length + 1).padStart(pad, "0")}`;
  const now = new Date();
  const pre = String(cfg.prefix ?? `${prefix}-`).replace("{YYYY}", String(now.getFullYear())).replace("{MM}", String(now.getMonth() + 1).padStart(2, "0"));
  const used = readCollection(c).map((r) => String(r.number ?? r.sku ?? r.employeeNumber ?? r.recNumber ?? "")).filter((s) => s.startsWith(pre)).map((s) => Number(s.slice(pre.length)) || 0);
  const n = Math.max(Number(cfg.start ?? 1) || 1, used.length ? Math.max(...used) + 1 : 0);
  return `${pre}${String(n).padStart(Number(cfg.padding ?? pad), "0")}`;
}

// Writes starting rows the first time a collection is used in this browser (never after,
// so deleting every record sticks).
export function seedCollection(c: string, rows: Record<string, unknown>[]) {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage.getItem(key(c)) !== null) return;
  } catch {
    return;
  }
  const now = new Date().toISOString();
  write(c, rows.map((r) => ({ id: crypto.randomUUID(), createdAt: now, ...r }) as Rec));
}

export function useCollection(c: string, seed?: Record<string, unknown>[]): Rec[] {
  const [rows, setRows] = useState<Rec[]>([]);

  useEffect(() => {
    if (seed) seedCollection(c, seed);
    const refresh = () => setRows(readCollection(c));
    refresh();
    if (!listeners.has(c)) listeners.set(c, new Set());
    listeners.get(c)!.add(refresh);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key(c)) refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.get(c)?.delete(refresh);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed rows are static module data
  }, [c]);

  return rows;
}
