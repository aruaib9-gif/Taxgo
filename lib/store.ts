"use client";

import { useEffect, useState } from "react";

// A tiny localStorage-backed collection store so "New X" forms create records
// that persist (per browser) and show up in the lists. Swap for a real API later.

export type Rec = Record<string, unknown> & { id: string };

const key = (c: string) => `taxgo:${c}`;
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
