"use client";

import type { SearchCriteria } from "./types";

export { defaultSearchCriteria, searchToQuery, queryToSearch } from "./criteria";

const STORAGE_KEY = "wheels.lastSearch";
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface StoredCriteria {
  criteria: SearchCriteria;
  ts: number;
}

export function readLastSearch(): SearchCriteria | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredCriteria;
    if (Date.now() - stored.ts > TTL_MS) return null;
    return stored.criteria;
  } catch {
    return null;
  }
}

export function writeLastSearch(criteria: SearchCriteria): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredCriteria = { criteria, ts: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // localStorage may be unavailable in private modes — fall through silently.
  }
}

export function clearLastSearch(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
