"use client";

import { useMutation } from "@tanstack/react-query";

export interface ClaimItem {
  kind: "doc" | "folder";
  slug: string;
  editToken: string;
}

export interface ClaimResult {
  kind: "doc" | "folder";
  slug: string;
  status: "claimed" | "not_found" | "bad_token" | "already_owned";
}

async function postClaim(items: ClaimItem[]): Promise<ClaimResult[]> {
  const res = await fetch("/api/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {}
    throw new Error(message);
  }
  const data = (await res.json()) as { results: ClaimResult[] };
  return data.results;
}

export function useClaim() {
  return useMutation({ mutationFn: postClaim });
}
