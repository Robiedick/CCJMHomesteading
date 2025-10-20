# CCJM Homesteading — Technical Overview

## 1. Mission & High-Level Summary

CCJM Homesteading is a bilingual (English/Dutch) content platform where a small editorial team can publish homesteading guides, recipes, and notes. The public site presents categories and stories, while the `/admin` interface gives authenticated editors a fully dynamic CMS-like experience:

- publish, edit, and delete articles with Markdown support
- manage categories and their colors/descriptions
- invite additional users by single-use signup links
- adjust every piece of public-facing copy and imagery per locale without code changes
- run full-text search across stories, categories, users, and invitations with smart filters

The app is built with **Next.js 15** (App Router, Turbopack, server components) and uses **Prisma** to connect to **PostgreSQL** (Render) or **SQLite** (development). Authentication flows through **NextAuth** with username/password credentials seeded for the main admins.

## 2. Key Technologies & Dependencies

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend & API | Next.js 15 (App Router, React 19) | Server components for data fetching; client components where interactivity is required (forms, locale switcher). |
| Styling | Tailwind CSS 4 via `@tailwindcss/postcss` | Global styles in `app/globals.css`; utility-heavy markup for quick iteration. |
| ORM | Prisma 6 | Schema in `prisma/schema.prisma`; migrations under `prisma/migrations`. |
| Auth | NextAuth (credentials) | Sessions stored via JWT; two seeded admins (`Robiedick`, `Corina`). |
| Database | PostgreSQL (Render) / SQLite (local) | Prisma datasource toggled by `DATABASE_URL`; Postgres full-text search + `pg_trgm` indexes for queries. |
| Content rendering | `react-markdown` | Custom component mappings for Markdown headings, lists, code blocks, etc. |
| UI helpers | `clsx`, built-in React hooks | Layout, conditional class merging, navigation. |

## 3. Repository Structure Highlights

```
app/
  layout.tsx               – root layout, fonts, global styles
  page.tsx                 – redirects to locale-specific homepage
  [locale]/                – localized public pages and article/category routes
  admin/                   – protected admin dashboard, CRUD sections, homepage editor
  api/                     – REST endpoints for articles, categories, invitations, users, homepage copy
components/
  LocaleSwitcher.tsx       – client component toggling locales on current path
docs/
  PROJECT_OVERVIEW.md      – you are here
lib/
  auth.ts / homepage.ts    – NextAuth config, Prisma helpers for homepage copy
  search.ts               – Postgres full-text & trigram powered search helpers
  prisma.ts                – Prisma client singleton
  utils.ts                 – slug, date formatting helpers
  i18n.ts                  – lazy-loaded dictionaries, locale helpers
messages/
  en.json / nl.json        – default localized copy
prisma/
  schema.prisma            – models (Article, Category, User, Invitation, HomepageContent)
  migrations/              – SQL migrations, migration lock
scripts/
  start-dev.cjs            – local dev launcher (free ports + concurrent frontend/studio)
  seed.js                  – seeds demo categories/articles/users
```

## 4. Data Model Overview (Prisma)

### Core Models
- **User**: stores credential hash, role (`admin`/`user`), and relations to invitations.
- **Invitation**: single-use token with optional email, role assignment, timestamps for creation/usage, and relations to both the creator and the eventual `User`.
- **Category**: name + slug + optional color/description. Many-to-many with `Article`.
- **Article**: Markdown content, slug, publish status/timestamps, relations to `Category`.
- **HomepageContent**: per-locale overrides for all public-site copy and imagery (branding, navigation, hero, topics, stories, article/category labels, login UI, search strings, footer). If absent, defaults fall back to the translation dictionaries.
- **HomepagePreset**: named JSON snapshots that store an entire homepage configuration per locale, enabling quick swapping between saved setups.

Supporting indexes/extensions:
- `pg_trgm` extension for fuzzy matching on usernames & invitations.
- Expression-based GIN indexes on Article/Category text for full-text search.

All migrations are committed (see `prisma/migrations/*`). Because we now target PostgreSQL in production, the datasource provider is `postgresql`; local development must point `DATABASE_URL` to a Postgres instance (can be the Render external connection string or a local container).

## 5. Authentication & Authorization

- NextAuth credentials provider.
- `lib/auth.ts` ensures admin users are seeded/upserted with bcrypt-hashed passwords (`Robiedick` / `r1LeNipI!`, `Corina` / `Neverland00`).
- Middleware `middleware.ts` enforces:
  - `/admin/**` requires an authenticated admin JWT (validated via `withAuth`).
  - URL locale prefixing: any request without `/en` or `/nl` is redirected to `/en`.
  - `NEXTAUTH_SECRET` defaults in development, but must be explicit in production.
- `requireAdminSession()` helper guards API routes mutating protected resources.

## 6. API Endpoints (App Router)

All endpoints live under `app/api/*` and speak JSON.

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/articles` | `GET`, `POST` | List or create articles; writes trigger revalidation. |
| `/api/articles/[id]` | `GET`, `PUT`, `DELETE` | CRUD for individual articles; handles slug regeneration and category associations. |
| `/api/categories` | `GET`, `POST` | Manage categories. |
| `/api/categories/[id]` | `PUT`, `DELETE` | Update/delete categories with slug changes and revalidation. |
| `/api/users` | `GET`, `POST` | Admin-only user creation. |
| `/api/users/[id]` | `PUT`, `DELETE` | Update usernames/roles/passwords with safeguards (e.g., prevent deleting the last admin). |
| `/api/invitations` | `GET`, `POST` | Issue single-use invite tokens with optional expiration. |
| `/api/invitations/[id]` | `DELETE` | Revoke unused invitations. |
| `/api/invitations/token/[token]` | `GET`, `POST` | Validate and redeem invitation tokens (creates new User). |
| `/api/homepage` | `GET`, `PUT`, `DELETE` | Fetch, upsert, or remove per-locale homepage copy overrides. |
| `/api/homepage/presets` | `GET`, `POST` | List or save named homepage configurations for a locale. |
| `/api/homepage/presets/[id]` | `DELETE` | Remove a saved homepage preset. |

All mutating routes call `requireAdminSession()` to enforce admin access.

## 7. Admin Interface

### Layout
- Side navigation (left column) lists: Overview, Search, Articles, Categories, Users, Change homepage.
- Top navigation collapsed for small screens; larger screens show the new vertical layout.
- Header displays signed-in username, links to view the public site, and a logout button.

### Sections
1. **Overview** (`app/admin/page.tsx`)
   - Dashboard counters (`prisma.article.count`, `prisma.category.count`).
   - Latest articles table with published/draft badges.
2. **Articles** (`app/admin/articles/*`)
   - Create/edit forms (Markdown textarea, slug auto-generation, category multi-select).
   - Delete buttons with on-hover warnings.
3. **Categories** (`app/admin/categories/*`)
   - Color pickers, inline editing, delete restrictions if linked to articles.
4. **Users** (`app/admin/users/*`)
   - Create users manually, edit roles/passwords, delete with safeguards.
   - Generate invitation links, copy to clipboard, track status (active/used/expired).
5. **Change homepage** (`app/admin/homepage/*`)
   - Locale tabs (EN/NL).
   - Editable inputs for every public string plus logo & hero image URLs (branding, navigation, hero, topics, stories, article/category labels, login UI, search UI, footer).
   - Save named presets, load or delete saved configurations, restore defaults, or clear the current override entirely.
   - "Load defaults" resets the form to translation values; "Clear saved override" deletes the stored override so the locale falls back to defaults.
6. **Search** (`app/admin/search/page.tsx`)
   - Unified search across articles, categories, users, and invitations.
   - Powered by Postgres full-text search with trigram fallbacks for fuzzy matches.

All admin pages export `dynamic = "force-dynamic"` so they always render fresh data and avoid static prerendering issues.

## 8. Public Experience

- `/` immediately redirects to `/en` (default locale) via middleware.
- `app/[locale]/page.tsx` fetches:
  - published articles with categories,
  - categories with published article counts,
  - complete locale-specific site copy, imagery, and search messaging (database override or dictionary fallback).
- Homepage search uses Postgres full-text search with optional filters to target stories or categories.
- Markdown-rich article pages using `react-markdown` with custom components for headings/lists/code.
- Category pages show published articles within that category; fallback for empty categories.
- Footer uses `{{year}}` placeholder replaced at render time.
- Language switcher rewrites the client-side path to the other locale while retaining deeper routes.

## 9. Deployment & Environment Configuration

### Local Development
1. Install dependencies: `npm install`
2. Set `.env` for local Postgres (or point to Render’s external URL):
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ccjmhomesteading"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="local-dev-secret"
   ```
3. Run migrations & seeds (once):
   ```
   npx prisma migrate deploy
   npm run seed
   ```
4. Start dev environment: `npm run dev` (launches Next.js + Prisma Studio, clearing ports 3000/5555 automatically).

### Render Deployment
Required environment variables:
```
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<db>?sslmode=require
NEXTAUTH_URL=https://<render-service>.onrender.com
NEXTAUTH_SECRET=<secure random string>
NODE_ENV=production
```

Build command: `npm install && npm run build`  
Start command: `npm run start`

Post-deploy initialization (on Render shell):
```
npx prisma migrate deploy
npm run seed
```

## 10. Testing & Tooling

- `npm run lint` runs ESLint with the Next.js TypeScript flat config.
- No automated tests yet; validation handled via Zod schemas and manual QA in admin forms.
- `scripts/seed.js` repopulates the database with demo categories/articles/users/invitations.
- Prisma Studio available locally via `npm run dev` (port 5555).

## 11. Future Enhancements & Ideas
- Support rich media (images) stored on an object storage service.
- Hook up transactional email (e.g., Resend) for invitation delivery.
- Implement granular roles (e.g., viewer vs editor).
- Introduce revision history for articles/homepage copy.
- Add automated tests (Playwright for E2E, Vitest for helpers).

## 12. Quick Reference Credentials (seeded)

| Username | Password | Role |
| --- | --- | --- |
| Robiedick | `r1LeNipI!` | admin |
| Corina | `Neverland00` | admin |

Guest accounts created via invitation default to `user` role, but can be promoted in the Users tab.

---

This document summarizes the current architecture, features, and deployment strategy for CCJM Homesteading. Keep it in sync with future changes to ensure onboarding remains painless. Happy homesteading! 🌱
