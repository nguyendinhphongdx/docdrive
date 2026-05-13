---
title: Domain model
description: Business entities, relationships, glossary, and invariants for THIS project.
tags: [project, domain, glossary]
---

# Domain model

> **Template** — replace with your project's actual content.

## Glossary

| Term | Meaning |
| --- | --- |
| (term) | (definition) |

## Entities

Describe each top-level entity, its purpose, and key fields.

### `<EntityName>`

- **Purpose**: …
- **Key fields**: …
- **Lifecycle**: created when …, deleted when …

## Relationships

```text
EntityA 1 ── n EntityB
EntityB n ── n EntityC  (through join)
```

## Invariants

What MUST always be true. Each invariant should map to a check in code (validation, transaction, BE constraint).

- … (e.g. "An `Order` cannot transition from `SHIPPED` back to `PENDING`")

## Open questions / TODOs

- …
