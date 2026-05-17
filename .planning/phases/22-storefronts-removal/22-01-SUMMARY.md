---
phase: 22-storefronts-removal
plan: "01"
subsystem: storefronts
tags: [removal, server, dashboard, migration, sqlite]
dependency_graph:
  requires: []
  provides: [STORE-01, STORE-02, STORE-03, STORE-04, STORE-05]
  affects: [packages/server, apps/dashboard]
tech_stack:
  added: []
  patterns: [idempotent-migration, atomic-deletion]
key_files:
  created:
    - packages/server/src/db/migrations/004_drop_storefronts.ts
    - packages/server/scripts/smoke-test-migration.mjs
  modified:
    - packages/server/src/db/migrations/index.ts
    - packages/server/src/db/index.ts
    - packages/server/src/db/types.ts
    - packages/server/src/routes/admin.ts
    - packages/server/src/routes/facilitator.ts
    - apps/dashboard/src/lib/api.ts
    - apps/dashboard/src/app/dashboard/[id]/page.tsx
  deleted:
    - packages/server/src/db/storefronts.ts
    - apps/dashboard/src/components/storefronts-section.tsx
decisions:
  - "Migration file necessarily contains 'storefront' in SQL DDL and name — exempt from zero-grep criterion by plan design (artifact must contain DROP TABLE statements)"
  - "tsconfig.tsbuildinfo excluded from grep gate — pre-existing stale build artifact regenerated on next build"
  - "Workspace deps (core, sdk) built before server tsc — pre-existing requirement not related to this plan"
  - "Migration smoke test uses initializeDatabase() not standalone runMigrations() — bootstrap must run first for migration pre-conditions to be satisfied"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-17"
  tasks: 5
  files: 9
---

# Phase 22 Plan 01: Storefronts Removal Summary

Excised the storefronts feature in a single atomic commit chain. Deleted 8 server-side storefront handlers, the db/storefronts module, the dashboard StorefrontsSection component, all storefront types and client methods, the storefronts tab integration, and the storefront bootstrap CREATE TABLE blocks. Added migration 004_drop_storefronts to drop the tables on existing DBs. Rewrote three trailing/leading comments on preserved code so the comment prose no longer mentions "storefront".

## Files Deleted

| File | Lines Removed |
|------|---------------|
| packages/server/src/db/storefronts.ts | ~252 |
| apps/dashboard/src/components/storefronts-section.tsx | ~629 |

**Total deleted: ~881 lines**

## Files Modified

| File | Changes |
|------|---------|
| packages/server/src/db/index.ts | Removed 27-line storefront bootstrap block (lines 475–501); removed `export * from './storefronts.js'`; rewrote 1 comment |
| packages/server/src/db/types.ts | Removed StorefrontRecord + StorefrontProductRecord interfaces (25 lines); rewrote 1 comment |
| packages/server/src/routes/admin.ts | Removed 14-line import block + 328-line storefront route block; rewrote 2 comments |
| packages/server/src/routes/facilitator.ts | Removed 4-line import block + 405-line /store handler block |
| apps/dashboard/src/lib/api.ts | Removed 43-line types block + 51-line methods block |
| apps/dashboard/src/app/dashboard/[id]/page.tsx | 4 edits: import, Tab union, button, render branch |
| packages/server/src/db/migrations/index.ts | Added m004 import + array entry |

**Total approximate LOC removed: ~1800 lines (net deletion across all files)**

## Migration Added

- **File:** packages/server/src/db/migrations/004_drop_storefronts.ts
- **Content:** `DROP TABLE IF EXISTS storefront_products; DROP TABLE IF EXISTS storefronts;` (join table first per D-02)
- **Registered:** m004 added to migrations array in migrations/index.ts
- **Name field:** `'004_drop_storefronts'`

## Comment Rewrites Applied (Task 2b.1 — D-04)

Three trailing/leading comments on preserved code were rewritten to remove "storefront" prose:

| File | Before | After |
|------|--------|-------|
| packages/server/src/db/index.ts line 118 | `// Add image_url column (for storefront display)` | `// Add image_url column for product image display` |
| packages/server/src/routes/admin.ts (createProductSchema) | `// Product image for storefront` | `// Product image` |
| packages/server/src/routes/admin.ts (updateProductSchema) | `// Product image for storefront` | `// Product image` |
| packages/server/src/db/types.ts (ProductRecord) | `// Product image for storefront display` | `// Product image URL` |

Note: A fourth comment was found during Task 4 grep gate on `ProductRecord.image_url` in types.ts — also rewritten per Rule 2 pattern.

## Build Verification Results

| Build | Command | Result |
|-------|---------|--------|
| Server | `pnpm --filter @openfacilitator/server build` | Exit 0 |
| Dashboard | `pnpm --filter @openfacilitator/dashboard build` | Exit 0 |
| Full lint (pre-commit hook) | `turbo lint` (6 packages) | All 6 pass |

Note: Workspace dependencies (@openfacilitator/core, @openfacilitator/sdk) must be built before server `tsc`. This is a pre-existing project constraint.

## Migration Smoke Test

**Method chosen:** Node ESM script calling `initializeDatabase()` from compiled server dist. This mirrors the actual server startup path (bootstrap tables created first, then migrations run). Standalone `runMigrations()` was tested but requires pre-existing tables created by bootstrap, so full `initializeDatabase()` was used.

**Results:**
- First run (fresh DB): All 4 migrations run cleanly; `004_drop_storefronts` recorded in migrations table; zero storefront tables in schema
- Second run (idempotency): Runner skips 004 (already recorded); no error; zero storefront tables remain
- Migration row: `SELECT name FROM migrations WHERE name='004_drop_storefronts'` returns 1 row

## D-04 Preservation Checks

| Check | Command | Result |
|-------|---------|--------|
| image_url in db/index.ts | `grep -c "image_url"` | 5 matches |
| imageUrl in admin.ts | `grep -c "imageUrl"` | 8 matches |
| createProductSchema.imageUrl preserved | exact Zod field grep | 1 match |
| updateProductSchema.imageUrl nullable preserved | exact Zod field grep | 1 match |
| image_url TEXT (ALTER TABLE) | `grep -c 'image_url TEXT'` | 2 matches |

## Success Criteria Verification

1. **Zero storefront references** — Source code grep returns 0. The migration file (004_drop_storefronts.ts) and migrations/index.ts contain "storefront" by necessity (they are the DROP TABLE file) and are exempt from this criterion per plan design. Stale tsconfig.tsbuildinfo also excluded as pre-existing build artifact.

2. **Migration runs cleanly** — Fresh DB: 004 runs, tables absent, row recorded. Second run: idempotent, no error. Bootstrap: zero `CREATE TABLE IF NOT EXISTS storefronts` in db/index.ts.

3. **Server compiles, zero storefront handlers** — Build exits 0. `/store` returns Express default 404 (no stub/redirect per D-01).

4. **Dashboard build succeeds** — Build exits 0. No missing-import errors.

5. **db/types.ts and db/index.ts export no storefront types/accessors** — `StorefrontRecord`, `StorefrontProductRecord` deleted. `export * from './storefronts.js'` removed. `storefronts.ts` deleted.

## Locked Decisions Honored

- **D-01:** No 410/redirect/stub — handlers deleted entirely
- **D-02:** Migration drops `storefront_products` before `storefronts` (FK order)
- **D-03:** Bootstrap CREATE TABLE blocks removed from db/index.ts
- **D-04:** `payment_links.image_url` column preserved; product `imageUrl` Zod schemas preserved; comments rewritten
- **D-05:** Single atomic plan; both builds verified before final commit

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Additional comment rewrite in db/types.ts**
- **Found during:** Task 4 (grep gate)
- **Issue:** `ProductRecord.image_url` field comment in `db/types.ts` read `// Product image for storefront display` — not in the original three-comment list in Task 2b.1, but caught by grep gate
- **Fix:** Rewrote to `// Product image URL` per same D-04 comment-rewrite pattern
- **Files modified:** packages/server/src/db/types.ts
- **Commit:** 2f6284b

No other deviations — all line-precise deletion boundaries matched exactly as documented in the plan.

## Self-Check

- [x] packages/server/src/db/migrations/004_drop_storefronts.ts exists
- [x] packages/server/src/db/storefronts.ts deleted
- [x] apps/dashboard/src/components/storefronts-section.tsx deleted
- [x] Task 1 commit: 7bb2dec
- [x] Task 2 commit: 2f6284b
- [x] Task 3 commit: 632251d
- [x] Task 5 commit: ba8a7c2
- [x] Server build: exit 0
- [x] Dashboard build: exit 0
- [x] Migration smoke test: passed
