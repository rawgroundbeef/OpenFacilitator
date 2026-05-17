# Phase 22: Storefronts Removal - Context

**Gathered:** 2026-05-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Fully excise the storefronts feature from server, database, and dashboard. Pure deletion — no replacement feature, no data preservation, no behavior compatibility shims. After this phase the codebase has zero references to `storefronts`, `storefront_products`, `db/storefronts`, or the `storefronts-section` component.

</domain>

<decisions>
## Implementation Decisions

### Public Endpoint Handling
- **D-01:** Delete `GET /store` and `GET /store/:slug` route handlers entirely. Express returns default 404. No 410 Gone, no redirect, no stub handlers.
  - Rationale: matches the "no references remain" success criterion (STORE-03). Stubs would be dead code that still has to be maintained.

### Database Migration
- **D-02:** Add `004_drop_storefronts.ts` migration that runs `DROP TABLE IF EXISTS storefront_products; DROP TABLE IF EXISTS storefronts;` (drop the join table first to satisfy FK).
- **D-03:** Also remove the `CREATE TABLE IF NOT EXISTS storefronts/storefront_products` blocks and their 4 indexes from `packages/server/src/db/index.ts` bootstrap so fresh DBs never create the tables.
  - Rationale: idempotent on both fresh and existing DBs; satisfies success criterion #2.

### Schema Preservation
- **D-04:** Keep the `image_url` column on `payment_links`. It was originally added "for storefront display" but products use it on `/pay/:slug` pages independently. Treat it as part of the product domain now.
  - Rationale: removing it would break product image rendering and any clients setting it. The column is no longer storefront-coupled.

### Plan Granularity
- **D-05:** Single atomic plan covering: server routes, db module + migration, dashboard component + api.ts + tab integration, grep + build verification.
  - Rationale: ~1000 LOC of pure deletion. Atomic commit = clean revert. Splitting into 2–3 plans would let the dashboard build break between commits.

### Claude's Discretion
- Order of file deletions inside the plan (planner's call).
- Whether to delete `storefronts-section.tsx` and `db/storefronts.ts` files via `git rm` vs `rm` (mechanical).
- Whether to verify with `grep -ri storefront packages/ apps/` or a more targeted check (planner's call, must satisfy success criterion #1).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements
- `.planning/ROADMAP.md` §"Phase 22: Storefronts Removal" — goal, depends-on, success criteria (5 items)
- `.planning/REQUIREMENTS.md` §"Storefronts Removal" — STORE-01 through STORE-05

### Migration pattern (template to follow)
- `packages/server/src/db/migrations/index.ts` — registration pattern (add `m004` to array)
- `packages/server/src/db/migrations/003_user_wallets_multi_chain.ts` — Migration interface example with idempotency check
- `packages/server/src/db/migrations/002_campaign_audit_table.ts` — CREATE-style migration (inverse pattern)

### Files to modify or delete (full paths)
- `packages/server/src/routes/admin.ts` — 68 storefront refs (entire CRUD block ~line 3006 onward; imports lines 45–57)
- `packages/server/src/routes/facilitator.ts` — 14 refs (imports lines 17–19; `GET /store/:slug` ~line 3037; `GET /store` ~line 3185)
- `packages/server/src/db/storefronts.ts` — 252 lines, delete entire file
- `packages/server/src/db/index.ts` — remove `storefronts` + `storefront_products` CREATE blocks + 4 indexes (lines ~475–501); remove `export * from './storefronts.js'` (line 797)
- `packages/server/src/db/types.ts` — remove `StorefrontRecord`, `StorefrontProductRecord` interfaces (lines ~163–185)
- `apps/dashboard/src/components/storefronts-section.tsx` — 629 lines, delete entire file
- `apps/dashboard/src/lib/api.ts` — 13 refs: types (`Storefront`, `StorefrontProduct`, `CreateStorefrontRequest`, `StorefrontsResponse`, `StorefrontDetailResponse`, lines ~477–518) and 8 client methods (`getStorefronts`, `createStorefront`, `getStorefront`, `updateStorefront`, `deleteStorefront`, `addProductToStorefront`, `removeProductFromStorefront`, lines ~1234–1281)
- `apps/dashboard/src/app/dashboard/[id]/page.tsx` — import (line 46), `Tab` type (line 60), tab button (lines 447–456), tab render branch (lines 507–508)

### Preserve (do NOT touch)
- `image_url` column on `payment_links` table — used by product detail pages
- Product `imageUrl` Zod schema in `admin.ts` lines 2319, 2339 — keep (referenced by products, not just storefronts)
- All payment-link / product code paths

</canonical_refs>

<code_context>
## Existing Code Insights

### Migration system
- Sequential `001_`, `002_`, `003_` pattern under `packages/server/src/db/migrations/`. Next slot is `004_`. Each exports `migration: Migration` with `name` + `up(db)`. Registered in `migrations/index.ts` array. Runs once, tracked in `migrations` table, in a transaction.

### Bootstrap schema vs migrations
- `packages/server/src/db/index.ts` contains a single big bootstrap block with `CREATE TABLE IF NOT EXISTS` for every table. Migrations handle deltas after bootstrap. Removing a feature requires editing **both** the bootstrap (so fresh DBs don't get the table) AND adding a drop migration (so existing DBs lose it).

### Dashboard tab pattern
- `apps/dashboard/src/app/dashboard/[id]/page.tsx` uses a `Tab` union type and conditional render. Removing the `'storefronts'` tab is a single union-member removal + button removal + render-branch removal. No router state to migrate.

### Verification surface
- Grep `storefront` across `packages/` and `apps/` should yield zero matches after removal (excluding `.planning/` historical docs).
- `pnpm build` must succeed in both `apps/dashboard` and `packages/server`.
- Migration smoke test: run on an existing dev DB (`packages/server/data/openfacilitator.db`) — should drop tables without error and survive a second run (idempotency).

</code_context>

<specifics>
## Specific Ideas

- Migration name should match the established convention: `004_drop_storefronts.ts` with `name: '004_drop_storefronts'`.
- Drop order matters in SQL: `storefront_products` first (it has FK to `storefronts`), then `storefronts`. `IF EXISTS` on both for idempotency.
- The `Tab` type union in `dashboard/[id]/page.tsx` currently includes `'rewards'` — leave that alone for Phase 22 (rewards UI removal is Phase 24).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. Rewards UI tab removal is Phase 24's job; rewards backend is Phase 23's job; security audit on the slimmed surface is Phase 25's job.

</deferred>

---

*Phase: 22-storefronts-removal*
*Context gathered: 2026-05-16*
