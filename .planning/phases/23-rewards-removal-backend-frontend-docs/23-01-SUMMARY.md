---
phase: 23-rewards-removal-backend-frontend-docs
plan: 01
subsystem: server, dashboard, planning-docs
tags: [rewards-removal, migration, cleanup, atomic-excision]
dependency_graph:
  requires: []
  provides:
    - rewards-program-excised
    - migration-005-drop-rewards
    - fresh-db-clean
    - project-md-rewritten
  affects:
    - packages/server
    - apps/dashboard
    - .planning/PROJECT.md
    - .planning/REQUIREMENTS.md
tech_stack:
  added: []
  patterns:
    - IF EXISTS idempotent migration pattern (005_drop_rewards)
    - Atomic multi-package excision (D-15 single-commit)
key_files:
  created:
    - packages/server/src/db/migrations/005_drop_rewards.ts
  modified:
    - packages/server/src/db/migrations/002_campaign_audit_table.ts
    - packages/server/src/db/migrations/index.ts
    - packages/server/src/db/index.ts
    - packages/server/src/db/types.ts
    - packages/server/src/db/facilitators.ts
    - packages/server/src/middleware/auth.ts
    - packages/server/src/routes/admin.ts
    - packages/server/src/routes/internal-webhooks.ts
    - packages/server/src/server.ts
    - packages/server/.env.example
    - apps/dashboard/src/lib/api.ts
    - apps/dashboard/src/components/auth/auth-provider.tsx
    - apps/dashboard/src/components/navbar.tsx
    - apps/dashboard/src/components/user-menu.tsx
    - apps/dashboard/src/components/archive/wallet-dropdown.tsx
    - apps/dashboard/src/components/dashboard/FeaturesSpotlight/featureCards.ts
    - apps/dashboard/src/components/dashboard/FeaturesSpotlight/index.tsx
    - apps/dashboard/src/app/dashboard/[id]/page.tsx
    - apps/dashboard/src/app/dashboard/page.tsx
    - apps/dashboard/src/app/page.tsx
    - .planning/PROJECT.md
    - .planning/REQUIREMENTS.md
decisions:
  - Rewards program abandoned 2026-05-12 — neither rewards nor storefronts found PMF; Phase 23 excises everything
  - D-15 single-atomic-commit: entire excision lands in one feat commit to keep build clean at every git state
  - Migration 002 made resilient to absent campaigns table (fresh DB guard) — Rule 1 fix for cascade failure
  - Refund claims subsystem (db/claims.ts, services/claims.ts, routes/public.ts, claims-list.tsx) preserved unchanged
metrics:
  duration: ~20 minutes
  completed: 2026-05-17T17:58:58Z
  tasks: 5
  files_changed: 62
---

# Phase 23 Plan 01: $OPEN Rewards Program Excision Summary

Atomic removal of the entire $OPEN rewards program from server, dashboard, and planning docs — ~7,948 lines deleted, 90 inserted. Single feat commit per D-15.

## Tasks Completed

| Task | Name | Status | Notes |
|------|------|--------|-------|
| 1 | Add migration 005_drop_rewards and register | Done | FK-safe DROP TABLE IF EXISTS for 5 reward tables |
| 2 | Delete rewards code from server | Done | 12 whole-file deletes + 9 partial-edit files |
| 3 | Delete rewards code from dashboard | Done | 21 file/dir deletes + 11 partial-edit files |
| 4 | Update planning docs + SDK reference + grep gate | Done | Grep gate returns 0 outside exempt files |
| 5 | Build verification + migration smoke test | Done | Both builds exit 0; fresh DB smoke passes |

## D-15 Atomic Commit

**Commit:** `e143776`

Per D-15, all rewards excision (Tasks 1-4) landed in a single feat commit to ensure the build is never half-broken. This deviates from the per-task commit protocol in execute-plan.md. Documented here as a plan-level directive that supersedes the default protocol.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Migration 002 fails on fresh DBs when campaigns table absent**

- **Found during:** Task 5 migration smoke test
- **Issue:** Migration `002_campaign_audit_table.ts` tried to CREATE `campaign_audit` (which has a FK reference to `campaigns`) and ALTER the `campaigns` table — but after Task 2 removed the `campaigns` bootstrap CREATE TABLE block from `db/index.ts`, fresh DBs no longer have `campaigns` when migration 002 runs. This caused `SqliteError: no such table: campaigns` on fresh DB bootstrap.
- **Fix:** Added a guard at the top of `002_campaign_audit_table.ts` up function: check if `campaigns` table exists via `sqlite_master`; if not, return immediately (no-op). On fresh DBs, the bootstrap never creates the reward tables, so 002 is a no-op and 005 drops any tables that exist on existing DBs.
- **Files modified:** `packages/server/src/db/migrations/002_campaign_audit_table.ts`
- **Included in:** D-15 atomic commit `e143776`

**2. [Rule 1 - Bug] db/index.ts contained backfillFacilitatorMarkers deferred call**

- **Found during:** Task 5 server build
- **Issue:** `packages/server/src/db/index.ts` had a deferred `setTimeout` that dynamically imported `backfillFacilitatorMarkers` from `db/facilitators.js` — the function deleted in Task 2g. TypeScript caught this: `Property 'backfillFacilitatorMarkers' does not exist on type 'typeof import(...)'`.
- **Fix:** Removed the entire deferred backfill block (lines ~618-630 in pre-edit numbering: `// Backfill missing facilitator enrollment markers after server starts` through the closing setTimeout).
- **Files modified:** `packages/server/src/db/index.ts`
- **Included in:** D-15 atomic commit `e143776`

### sdk-api.md

`skills/openfacilitator/references/sdk-api.md` — no rewards content found; refund `## Claims Functions` section (line 50) preserved unchanged. D-11/REWARDS-09 satisfied trivially (near-no-op as the planner predicted).

## Build Verification

- `pnpm --filter @openfacilitator/server build`: exits 0
- `pnpm --filter @openfacilitator/dashboard build`: exits 0 (26 static routes, 1 dynamic)
- Pre-commit hooks: turbo lint across all 6 packages — all passed

## Migration Smoke Test Results

**Fresh DB (unconditional — W6):**
- All 5 migrations applied: m001 through m005
- `005_drop_rewards` recorded in migrations table
- Zero reward tables on fresh DB (campaigns/reward_addresses/etc. never created)
- Refund `claims` table present
- Idempotency verified (second run skips 005 — already recorded)

**Existing DB:** No dev DB present at time of execution (NO_DEV_DB).

## Grep Gate Results

```
grep -riE 'reward|campaign|\$OPEN|REWARDS_WALLET|OPEN_TOKEN_MINT' packages/ apps/ skills/openfacilitator/ \
  --include='*.ts' --include='*.tsx' --include='*.md' \
  --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next --exclude-dir=.turbo \
  | grep -vE '005_drop_rewards|002_campaign_audit_table|migrations/index\.ts:.*(005_drop_rewards|m005|002_campaign_audit_table|m002)' \
  | wc -l
```

Result: **0** — all rewards references removed from source outside exempt migration files.

## Refund Preservation Verification

The following refund claims subsystem files are untouched:
- `packages/server/src/db/claims.ts` — present
- `packages/server/src/services/claims.ts` — present
- `packages/server/src/routes/public.ts` — present (untouched)
- `apps/dashboard/src/components/resource-owner/claims-list.tsx` — present
- `skills/openfacilitator/references/sdk-api.md ## Claims Functions` — preserved

## Known Stubs

None — all rewards references deleted outright; no placeholder text substituted.

## Threat Flags

None — this plan is a deletion-only operation. No new network endpoints, auth paths, or trust boundaries introduced. The attack surface is reduced.

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| `packages/server/src/db/migrations/005_drop_rewards.ts` exists | FOUND |
| `packages/server/src/routes/rewards.ts` deleted | FOUND (deleted) |
| `apps/dashboard/src/components/rewards/` deleted | FOUND (deleted) |
| `apps/dashboard/src/components/resource-owner/claims-list.tsx` preserved | FOUND |
| Commit `e143776` exists | FOUND |
| PROJECT.md Core Value text matches D-10 locked text | FOUND |
