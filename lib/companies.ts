"use client";

// The companies this login can work in (account-level, see lib/store.ts) and the active one's name.

import { useSyncExternalStore } from "react";
import { BRAND } from "@/lib/brand";
import { DEFAULT_COMPANY, activeCompanyId, readCollection, seedCollection, setActiveCompany, useCollection, type Rec } from "@/lib/store";

export const SEED_COMPANIES = [
  { id: DEFAULT_COMPANY, name: BRAND.org, country: "Generic", currency: "USD", role: "Owner", status: "Active" },
  { id: "crescent-retail", name: "Crescent Retail FZE", country: "UAE", currency: "AED", role: "Accountant", status: "Active" },
  { id: "blue-ocean", name: "Blue Ocean Foods Pvt Ltd", country: "India", currency: "INR", role: "Member", status: "Active" },
];

export function useCompanies(): Rec[] {
  return useCollection("companies", SEED_COMPANIES);
}

/** Makes sure the starting companies exist before anything adds to the list. */
export const ensureCompanies = () => seedCollection("companies", SEED_COMPANIES);

/** The active company's record, read outside React (event handlers, print builders). */
export function activeCompany(): Rec {
  ensureCompanies();
  const id = activeCompanyId();
  return readCollection("companies").find((c) => c.id === id) ?? (SEED_COMPANIES[0] as Rec);
}

export const activeCompanyName = () => String(activeCompany().name);

const noSubscribe = () => () => {};

/** The active company's name; the server render (and first paint) shows the default company. */
export function useCompanyName(): string {
  const companies = useCompanies();
  const id = useSyncExternalStore(noSubscribe, activeCompanyId, () => DEFAULT_COMPANY);
  return String(companies.find((c) => c.id === id)?.name ?? (id === DEFAULT_COMPANY ? BRAND.org : "Company"));
}

/** Moves this tab into another company (at its head office) and reloads the app there. */
export function switchCompany(id: string, to = "/home") {
  setActiveCompany(id);
  window.location.assign(to);
}
