"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { OwnedDocumentRef } from "../types";

const KEY = "docdrive:owned-docs";
const EMPTY = "[]";

function parse(raw: string): OwnedDocumentRef[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OwnedDocumentRef[]) : [];
  } catch {
    return [];
  }
}

function readRaw(): string {
  if (typeof window === "undefined") return EMPTY;
  return window.localStorage.getItem(KEY) ?? EMPTY;
}

function readStorage(): OwnedDocumentRef[] {
  return parse(readRaw());
}

function writeStorage(list: OwnedDocumentRef[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function rememberOwnedDocument(ref: OwnedDocumentRef): void {
  const list = readStorage().filter((s) => s.slug !== ref.slug);
  list.unshift(ref);
  writeStorage(list.slice(0, 100));
}

export function forgetOwnedDocument(slug: string): void {
  writeStorage(readStorage().filter((s) => s.slug !== slug));
}

export function getOwnedDocumentToken(slug: string): string | undefined {
  return readStorage().find((s) => s.slug === slug)?.editToken;
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useOwnedDocuments(): OwnedDocumentRef[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY);
  return useMemo(() => parse(raw), [raw]);
}
