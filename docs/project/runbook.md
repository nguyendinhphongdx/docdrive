---
title: Runbook
description: On-call procedures, common alerts, how to debug production issues.
tags: [project, ops, runbook, on-call]
---

# Runbook

> **Template** — replace with your project's actual content.

## Health checks

| Endpoint | Expected | Alarm if |
| --- | --- | --- |
| `GET /` | `200`, landing page renders | non-200 for > 1 min |
| BE `GET /health` | `200 { status: "ok" }` | non-200 for > 1 min |

## Common alerts

### "BE 5xx spike"

- **Likely cause**: BE deploy failed, DB unreachable, or upstream service degraded.
- **Steps**:
  1. Check BE logs / status page
  2. Check `NEXT_PUBLIC_API_URL` is reachable from the client (Network tab)
  3. Look for refresh-token loops in browser console (`apiClient` interceptor)
- **Mitigation**: roll back BE; FE will recover automatically (TanStack Query retries).

### "Auth 401 storm"

- **Likely cause**: BE rotated session secret, cookie domain mismatch, or clock skew.
- **Steps**:
  1. Check whether `NEXT_PUBLIC_SESSION_COOKIE` matches BE-set cookie name
  2. Inspect `Set-Cookie` headers in browser
  3. Compare server clock to NTP

## Useful commands

```bash
# Hot-reload local dev
pnpm dev

# Production-like build locally
pnpm build && pnpm start

# Quick lint+typecheck before pushing
pnpm check
```

## Escalation

- L1 (on-call): @… — Slack #…
- L2 (team lead): @…
- L3 (infra / BE): @…
