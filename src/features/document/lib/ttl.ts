import type { TtlPreset } from "../types";

export const TTL_OPTIONS: Array<{ value: TtlPreset; label: string; ms: number | null }> = [
  { value: "1h", label: "1 hour", ms: 60 * 60 * 1000 },
  { value: "1d", label: "1 day", ms: 24 * 60 * 60 * 1000 },
  { value: "7d", label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { value: "30d", label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
  { value: "never", label: "Never expires", ms: null },
];

export function computeExpiresAt(ttl: TtlPreset, now: Date = new Date()): Date | null {
  const option = TTL_OPTIONS.find((o) => o.value === ttl);
  if (!option || option.ms === null) return null;
  return new Date(now.getTime() + option.ms);
}

export function formatRemaining(expiresAt: Date | null, now: Date = new Date()): string {
  if (!expiresAt) return "Never expires";
  const ms = expiresAt.getTime() - now.getTime();
  if (ms <= 0) return "Expired";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `Expires in ${days}d`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `Expires in ${hours}h`;
  const minutes = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `Expires in ${minutes}m`;
}
