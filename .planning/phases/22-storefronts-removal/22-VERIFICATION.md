---
phase: 22-storefronts-removal
verified: 2026-05-17T13:47:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
gaps: []
human_verification: []
---

# Phase 22: Storefronts Removal Verification Report

**Phase Goal:** Storefronts feature is fully excised from server, database, and dashboard with no dangling references.
**Verified:** 2026-05-17T13:47:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | No storefront references remain in source code (excluding exempt migration/smoke files) | VERIFIED | All 6 modified source files return 0 hits on `grep -ci storefront`. Only files with "storefront" are `004_drop_storefronts.ts`, `migrations/index.ts`, and `smoke-test-migration.mjs` — all explicitly exempt per ROADMAP SC#1 |
| 2 | Migration 004 runs cleanly on fresh and existing DB, dropping storefront tables | VERIFIED | Fresh DB: smoke test passed on `/tmp` DB. Existing dev DB (`packages/server/data/openfacilitator.db`): `runMigrations` dropped both tables during verification; `004_drop_storefronts` recorded in migrations table. Idempotent: second run skips cleanly, no duplicate row |
| 3 | routes/admin.ts and routes/facilitator.ts compile with zero storefront handlers | VERIFIED | `pnpm --filter @openfacilitator/server build` exits 0. Both files have 0 storefront references. `/store` and `/store/:slug` handlers fully deleted; Express default 404 returned |
| 4 | Dashboard build succeeds with no missing-import errors | VERIFIED | `pnpm --filter @openfacilitator/dashboard build` exits 0. Pre-existing pino-pretty warning is unrelated to this phase. No missing-import errors for StorefrontsSection or lib/api storefront types |
| 5 | db/types.ts and db/index.ts export no storefront types or table accessors | VERIFIED | `StorefrontRecord` and `StorefrontProductRecord` deleted from types.ts (both return 0). `export * from './storefronts.js'` removed from db/index.ts (returns 0). `db/storefronts.ts` file deleted |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `packages/server/src/db/migrations/004_drop_storefronts.ts` | Idempotent migration dropping storefront_products then storefronts | VERIFIED | File exists; `DROP TABLE IF EXISTS storefront_products` on line 17, `DROP TABLE IF EXISTS storefronts` on line 18 (correct FK order per D-02); `name: '004_drop_storefronts'` present |
| `packages/server/src/db/migrations/index.ts` | Migration registration including m004 | VERIFIED | `import { migration as m004 } from './004_drop_storefronts.js'` at line 18; `m004` in array at line 25 |
| `packages/server/src/routes/admin.ts` | Admin router with zero storefront handlers | VERIFIED | 0 storefront references; imageUrl Zod fields preserved (1 match each for createProductSchema and updateProductSchema); D-04 comments rewritten |
| `packages/server/src/routes/facilitator.ts` | Facilitator router with zero /store handlers | VERIFIED | 0 storefront references; no /store or /store/:slug handlers remain |
| `packages/server/src/db/index.ts` | DB bootstrap with no storefront CREATE TABLE / re-export | VERIFIED | `CREATE TABLE IF NOT EXISTS storefronts` returns 0; `from './storefronts` returns 0; image_url column and ALTER TABLE block preserved (5 image_url matches) |
| `packages/server/src/db/types.ts` | Type exports without StorefrontRecord / StorefrontProductRecord | VERIFIED | 0 matches for both interface names |
| `apps/dashboard/src/lib/api.ts` | API client without Storefront types or storefront methods | VERIFIED | 0 storefront references |
| `apps/dashboard/src/app/dashboard/[id]/page.tsx` | Dashboard page with no storefronts tab, button, render branch, or import | VERIFIED | 0 storefront references; Tab union is `'transactions' \| 'products' \| 'webhooks' \| 'refunds' \| 'rewards' \| 'settings'`; rewards preserved (4 matches) |
| `packages/server/src/db/storefronts.ts` | DELETED | VERIFIED | File does not exist |
| `apps/dashboard/src/components/storefronts-section.tsx` | DELETED | VERIFIED | File does not exist |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `packages/server/src/db/migrations/index.ts` | `packages/server/src/db/migrations/004_drop_storefronts.ts` | imported as m004, pushed into migrations array | WIRED | Import at line 18, array entry at line 25; `runMigrations` called from `initializeDatabase` at db/index.ts:731 |
| `server startup (db/index.ts → runMigrations)` | `DROP TABLE IF EXISTS storefronts` | auto-run migrations on boot | WIRED | `initializeDatabase` at db/index.ts:21 calls `runMigrations(db)` at line 731; confirmed running against dev DB during verification |

### Data-Flow Trace (Level 4)

Not applicable — this phase is a pure deletion. No new data-rendering artifacts were introduced.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Server build exits 0 | `pnpm --filter @openfacilitator/server build` | Exit 0 | PASS |
| Dashboard build exits 0 | `pnpm --filter @openfacilitator/dashboard build` | Exit 0 (with pre-existing pino-pretty warning) | PASS |
| Migration 004 runs on existing dev DB | `initializeDatabase('./packages/server/data/openfacilitator.db')` | `004_drop_storefronts` ran, tables dropped, recorded in migrations | PASS |
| Migration idempotent (second run) | `initializeDatabase('./packages/server/data/openfacilitator.db')` (second call) | Skipped (already recorded); 1 row, no duplicate; 0 storefront tables | PASS |
| Zero storefront refs in modified source files | `grep -ci storefront` across 6 key files | 0 in all 6 | PASS |
| DB bootstrap will not recreate storefront tables on fresh DB | `grep -c 'CREATE TABLE IF NOT EXISTS storefronts' packages/server/src/db/index.ts` | 0 | PASS |

### Requirements Coverage

| Requirement | Description | Status | Evidence |
|-------------|-------------|--------|----------|
| STORE-01 | storefronts-section component removed from dashboard | SATISFIED | `apps/dashboard/src/components/storefronts-section.tsx` deleted; import removed from page.tsx; Tab union, button, and render branch removed |
| STORE-02 | db/storefronts module removed; storefronts table dropped via migration | SATISFIED | `packages/server/src/db/storefronts.ts` deleted; `004_drop_storefronts.ts` drops both tables; confirmed on dev DB |
| STORE-03 | Storefront references removed from routes/admin.ts and routes/facilitator.ts | SATISFIED | Both files have 0 storefront references; route blocks deleted; imports removed |
| STORE-04 | Dashboard storefront refs in lib/api.ts and dashboard/[id]/page.tsx cleaned | SATISFIED | Both files have 0 storefront references; types block and methods block removed from api.ts |
| STORE-05 | Storefront types removed from db/types.ts and db/index.ts | SATISFIED | StorefrontRecord and StorefrontProductRecord deleted from types.ts; re-export and bootstrap block removed from db/index.ts |

All 5 requirements (STORE-01 through STORE-05) are SATISFIED with implementation evidence.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/dashboard/src/app/dashboard/[id]/page.tsx` | 23 | `Store,` imported from lucide-react but never referenced | Warning | Dead import from removed Storefronts tab button; triggers linter warnings; no functional impact — build exits 0, no storefront feature exposed |

Note: The `Store` icon orphan was documented in code review as WR-01. It does not prevent the phase goal from being achieved — no storefront UI is rendered and no storefront code paths exist. This is a residual quality gap from the deletion.

### Grep Gate Detail

The PLAN's exact grep command `grep -ri --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=dist --exclude-dir=.turbo storefront packages/ apps/` returns 27 matches, not 0. However, all matches fall into explicitly exempt categories per ROADMAP SC#1:

- `packages/server/src/db/migrations/004_drop_storefronts.ts` — the migration file (exempt by ROADMAP: "the migration file `004_drop_storefronts.ts` and its smoke test necessarily reference the table names; that is by design")
- `packages/server/src/db/migrations/index.ts` — imports `'./004_drop_storefronts.js'` (same exemption)
- `packages/server/scripts/smoke-test-migration.mjs` — the smoke test verifying tables were dropped (same exemption)
- Binary files: `packages/server/test.db-wal`, `packages/server/data/openfacilitator.db` — DB artifacts, not source code

Zero storefront references remain in any application source file. The ROADMAP exemption is applied correctly.

### D-04 Preservation Verified

| Check | Result |
|-------|--------|
| `grep -c "image_url" packages/server/src/db/index.ts` | 5 matches (payment_links CREATE + ALTER TABLE block) |
| `grep -c "imageUrl" packages/server/src/routes/admin.ts` | 8 matches |
| `grep -c 'imageUrl: z.string().url().max(2048).optional(),' packages/server/src/routes/admin.ts` | 1 match (createProductSchema preserved) |
| `grep -c 'imageUrl: z.string().url().max(2048).optional().nullable(),' packages/server/src/routes/admin.ts` | 1 match (updateProductSchema preserved) |
| `grep -c 'image_url TEXT' packages/server/src/db/index.ts` | 2 matches (ALTER TABLE preserved) |
| Comment rewrites applied | db/index.ts line 118, admin.ts lines 2305/2325 — confirmed no "storefront" prose remains in comments on preserved code |

### Human Verification Required

None — all success criteria are verifiable programmatically. The build results, migration execution, and grep gate are all confirmed by automated checks.

### Gaps Summary

No gaps. All 5 ROADMAP success criteria are achieved:

1. Zero storefront references in source code (exempt files correctly identified)
2. Migration 004 runs cleanly on fresh DB (smoke test) and existing dev DB (verified during verification run)
3. routes/admin.ts and routes/facilitator.ts compile with zero storefront handlers (server build exits 0)
4. Dashboard build succeeds with no missing-import errors (exit 0)
5. db/types.ts and db/index.ts export no storefront types or table accessors

The one code-quality issue (WR-01: unused `Store` icon import) does not constitute a gap for the phase goal — the storefronts feature is fully excised and the build succeeds.

---

_Verified: 2026-05-17T13:47:00Z_
_Verifier: Claude (gsd-verifier)_
