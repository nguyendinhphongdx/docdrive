"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { OwnedFolderRef } from "../types";

const KEY = "docdrive:owned-folders";
const EMPTY = "[]";

function parse(raw: string): OwnedFolderRef[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OwnedFolderRef[]) : [];
  } catch {
    return [];
  }
}

function readRaw(): string {
  if (typeof window === "undefined") return EMPTY;
  return window.localStorage.getItem(KEY) ?? EMPTY;
}

function readStorage(): OwnedFolderRef[] {
  return parse(readRaw());
}

function writeStorage(list: OwnedFolderRef[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY }));
}

export function rememberOwnedFolder(ref: OwnedFolderRef): void {
  const list = readStorage().filter((f) => f.id !== ref.id);
  list.unshift(ref);
  writeStorage(list.slice(0, 100));
}

export function forgetOwnedFolder(id: string): void {
  writeStorage(readStorage().filter((f) => f.id !== id));
}

export function getOwnedFolderToken(slugOrId: string): string | undefined {
  const list = readStorage();
  return (
    list.find((f) => f.slug === slugOrId)?.editToken ??
    list.find((f) => f.id === slugOrId)?.editToken
  );
}

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useOwnedFolders(): OwnedFolderRef[] {
  const raw = useSyncExternalStore(subscribe, readRaw, () => EMPTY);
  return useMemo(() => parse(raw), [raw]);
}
