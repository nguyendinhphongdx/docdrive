---
title: Deployment
description: Environments, secrets, CI/CD, rollout and rollback procedures.
tags: [project, deployment, ci, ops]
---

# Deployment

> **Template** — replace with your project's actual content.

## Environments

| Env | URL | Branch | Auto-deploy | Notes |
| --- | --- | --- | --- | --- |
| dev | https://… | `main` | yes | wiped daily |
| staging | https://… | `staging` | yes | mirror of prod data |
| prod | https://… | tagged release | manual | … |

## Secrets

Where secrets live (Vercel env vars / AWS Secrets Manager / GCP Secret Manager / GitHub Actions secrets / …) and how a developer rotates them.

| Secret | Source | Rotation cadence |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Platform env | n/a (URL, not secret) |
| `<server-only-secret>` | … | … |

## CI/CD

- **CI**: which pipeline, where to find logs.
- **Build**: `pnpm install --frozen-lockfile && pnpm check && pnpm build`
- **Deploy**: how an artifact reaches the env (Vercel deploy, Docker → ECS, …).

## Rollout

Step-by-step for a normal release.

## Rollback

Step-by-step for reverting a bad deploy. Include the SLO for time-to-rollback.
