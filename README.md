# docdrive

A drive-like Markdown / HTML workspace with shareable, expiring links.

- **Documents**: a piece of content (Markdown or HTML).
- **Folders**: nested containers — gather related documents under one shareable URL.
- **Editor**: CodeMirror on the left, live preview on the right (drag to resize, tabs on mobile).
- **TTL**: 1 hour, 1 day, 7 days, 30 days, or never. Expired documents are swept hourly by a cron.
- **Anonymous + accounts**: Create without signing in (edit-token stored locally), or sign up to manage everything from `/dashboard`.
- **Safe HTML**: All HTML output is run through DOMPurify with a strict allow-list. Markdown is sanitized too.

Built on top of [nextjs-boilerplate](https://github.com/nguyendinhphongdx/nextjs-boilerplate) — Next.js 16 (App Router) + React 19 + Tailwind 4 + shadcn/ui + TanStack Query + Zustand + Auth.js v5 + Prisma + Postgres.

## Quick start

```bash
# 1. Install deps
pnpm install

# 2. Copy env file and edit AUTH_SECRET / CRON_SECRET
cp .env.example .env
# generate a secret:
openssl rand -base64 32

# 3. Start Postgres locally (or point DATABASE_URL at any Postgres)
docker compose up -d

# 4. Apply schema
pnpm db:migrate

# 5. Run the dev server
pnpm dev
```

Open <http://localhost:3000/editor>, write something, click **Create document**.

## URL conventions

| URL | Purpose |
| --- | --- |
| `/` | Landing page |
| `/editor` | New document (split editor + preview) |
| `/editor/[slug]` | Edit an existing document (token in URL or localStorage, or signed-in owner) |
| `/d/[slug]` | Public document view + view counter |
| `/d/[slug]/expired` | Expired (410) page |
| `/f/[slug]` | Public folder view — breadcrumbs + subfolders + documents |
| `/dashboard` | Authenticated drive: folder tree + root documents |
| `/login`, `/register` | Auth pages |

## Project structure

```text
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts       # Auth.js handler
│   │   ├── auth/register/route.ts            # Sign-up endpoint
│   │   ├── documents/route.ts                # POST + GET (list mine, ?folderId=)
│   │   ├── documents/[slug]/route.ts         # GET / PATCH / DELETE (dual auth)
│   │   ├── folders/route.ts                  # POST + GET (list mine)
│   │   ├── folders/[slug]/route.ts           # GET / PATCH / DELETE (dual auth)
│   │   └── cron/cleanup/route.ts             # Delete expired documents
│   ├── editor/page.tsx                       # New document
│   ├── editor/[slug]/page.tsx                # Edit existing document
│   ├── d/[slug]/page.tsx                     # Public document view
│   ├── d/[slug]/expired/page.tsx             # 410 view
│   ├── f/[slug]/page.tsx                     # Public folder view
│   ├── dashboard/page.tsx                    # Auth-gated drive view
│   ├── login/page.tsx, register/page.tsx     # Auth pages
│   └── page.tsx                              # Landing
├── features/
│   ├── auth/                                 # Auth.js client wiring
│   ├── document/                             # Editor, preview, store, services
│   ├── folder/                               # Tree, picker, view, services
│   └── landing/                              # Landing sections
├── auth.ts                                   # Auth.js v5 (Credentials + JWT)
└── lib/db.ts                                 # Prisma client singleton
prisma/schema.prisma                          # User + Folder + Document
docker-compose.yml                            # Local Postgres
vercel.json                                   # Cron schedule
```

## Data model

```prisma
User      { id, email, password, name?, documents[], folders[] }
Folder    { id, slug, name, description?, parentId? (self-FK), ownerId?, editToken, ... }
Document  { id, slug, title?, contentType, content, folderId?, ownerId?, editToken,
            expiresAt?, viewCount, ... }
```

- `Folder.parentId` self-FK lets folders nest (capped at 10 levels via API guard).
- `Document.folderId` is optional — root-level documents have `folderId = null`.
- On folder delete, contained documents/subfolders are kept but become orphans (`SetNull`).

## Environment variables

| Name | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. |
| `AUTH_SECRET` | Auth.js JWT signing key (≥32 bytes). |
| `CRON_SECRET` | Required header on `POST /api/cron/cleanup`. |
| `NEXT_PUBLIC_SITE_URL` | Origin used to build shareable URLs server-side. |

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm dev` | Run dev server at <http://localhost:3000>. |
| `pnpm build` | Production build. |
| `pnpm start` | Serve the production build. |
| `pnpm check` | Lint + typecheck. |
| `pnpm db:migrate` | Apply Prisma migrations in dev. |
| `pnpm db:push` | Push schema without creating a migration file. |
| `pnpm db:studio` | Prisma Studio. |
| `pnpm db:generate` | Regenerate the Prisma client (also runs on `postinstall`). |

## How it works

| Step | What happens |
| --- | --- |
| Create document | `POST /api/documents` inserts a row with a 10-char `nanoid` slug and a 64-char `editToken`. Optional `folderId` requires either ownership or a folder edit-token header. If signed in, `ownerId` is attached. |
| Create folder | `POST /api/folders` similarly returns `{slug, editToken, viewUrl, editUrl}`. Optional `parentId` enforces the same dual auth. |
| Share | UI returns `viewUrl = /d/<slug>` (or `/f/<slug>` for folders) plus an `editUrl` for anonymous owners. Edit-tokens are stored in `localStorage["docdrive:owned-docs"]` and `localStorage["docdrive:owned-folders"]`. |
| View document | `/d/<slug>` is a server component. It checks `expiresAt`, increments `viewCount` (fire-and-forget), and renders the content. Header shows parent folder if any. |
| View folder | `/f/<slug>` lists subfolders + non-expired documents, with breadcrumbs walked up the `parentId` chain (server-side). Logged-in owners (or token holders) see Rename/Delete controls. |
| Edit | `/editor/<slug>` loads the document server-side. Client resolves `editToken` from `?token=` or localStorage and sends it as `x-edit-token` on `PATCH`. Owners may edit without a token. |
| Expire | `expiresAt <= now()` → GET returns 410. Hourly Vercel cron at `POST /api/cron/cleanup` (header `x-cron-secret: $CRON_SECRET`) deletes expired rows. |

## Security notes

- HTML content is sanitized with `isomorphic-dompurify` (strict allow-list: no `<script>`, `<iframe>`, event handlers, etc.).
- Markdown is rendered with `react-markdown` + `rehype-sanitize`.
- Edit-token comparison is constant-time.
- Passwords hashed with `bcryptjs` (10 rounds).
- Security headers (`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Content-Type-Options`) set globally in `next.config.ts`.
- Content size capped at 256 KB; folder nesting capped at 10 levels.

## Deploying

The app is Vercel-friendly: configure `DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET` (and optionally `NEXT_PUBLIC_SITE_URL`), then deploy. `vercel.json` registers the hourly cleanup cron — Vercel injects the secret automatically when the cron path is hit.
