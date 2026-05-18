# Phase 23: Rewards Removal (Backend + Frontend + Docs) - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Excise the entire $OPEN rewards program from the codebase — server routes, services, DB tables, the 2x facilitator multiplier, dashboard pages and components, landing-page copy, env vars, the SDK skill reference, and PROJECT.md positioning. Pure deletion — no replacement feature, no stubs, no redirects, no data preservation, no behavior shims. After this phase the codebase has zero references to `$OPEN`, `reward_addresses`, `reward_claims`, `campaigns`, `campaign_audit`, `volume_snapshots`, `routes/rewards.ts`, `services/reward-transfer.ts`, `services/reward-claims.ts`, `db/volume-aggregation.ts`, `components/rewards/*`, `components/campaigns/*`, `facilitator-rewards-section.tsx`, `rewards-info-banner.tsx`, or the `/rewards` and `/rewards/admin` dashboard routes (excluding `.planning/` historical docs).

**Not in scope:** refund claims (`db/claims.ts`, `services/claims.ts`, `/api/claims`, `resource-owner/claims-list.tsx`) — these belong to the v1.1 whitelabel refund flow and must be preserved. The `claims` table is a refund table, not a rewards table.

</domain>

<decisions>
## Implementation Decisions

### Database Migration
- **D-01:** Add `005_drop_rewards.ts` migration that drops exactly these 5 tables in FK-safe order: `volume_snapshots → reward_claims → campaign_audit → campaigns → reward_addresses`. Use `DROP TABLE IF EXISTS` on each for idempotency.
  - Rationale: FKs are `volume_snapshots → {reward_addresses, campaigns}`, `reward_claims → campaigns`, `campaign_audit → campaigns`. Child tables drop before parents.
- **D-02:** Also strip the `CREATE TABLE IF NOT EXISTS` blocks and indexes for all 5 tables from `packages/server/src/db/index.ts` bootstrap (lines ~597–680) so fresh DBs never create them.
  - Rationale: matches Phase 22 pattern (D-02/D-03 there). Idempotent on fresh + existing DBs.
- **D-03:** Do NOT drop the `claims` table. It is the REFUND claims table (`packages/server/src/db/index.ts` ~line 568, scoped to `resource_owners` and used by `/api/claims` + `resource-owner/claims-list.tsx`). REQUIREMENTS.md REWARDS-02 currently lists `claims` — that text is wrong and should be amended in this phase's commit.

### Requirements Drift Fix
- **D-04:** Update `.planning/REQUIREMENTS.md` REWARDS-02 to list the correct table set (`reward_addresses, reward_claims, campaigns, campaign_audit, volume_snapshots`) — not `claims`. Same commit as the removal work.
  - Rationale: leaving the wrong list in REQUIREMENTS.md will confuse Phase 24 audit and future readers.

### Public Endpoint Handling
- **D-05:** Delete `/rewards/*` server route handlers entirely (`packages/server/src/routes/rewards.ts`). Express returns default 404. No 410 Gone, no redirect, no stub handlers. Same approach as Phase 22 D-01.
- **D-06:** Delete `apps/dashboard/src/app/rewards/page.tsx` and `apps/dashboard/src/app/rewards/admin/page.tsx` entirely. Next.js returns default 404 for `/rewards` and `/rewards/admin`. No redirect.

### Admin Surface Removal
- **D-07:** Delete `packages/server/src/utils/admin.ts`, the `requireAdmin` middleware in `packages/server/src/middleware/auth.ts`, and the `ADMIN_USER_IDS` env var (the "Rewards Program" section in `packages/server/.env.example` lines 92–99). Rationale: only consumer is `routes/rewards.ts`; after rewards is gone all three are dead. Smaller surface for Phase 24 audit. If admin features come back, rebuild on Better Auth roles rather than a comma-separated env list.

### Volume Aggregation
- **D-08:** Delete `packages/server/src/db/volume-aggregation.ts` entirely (672 lines, exclusively rewards/campaign volume + multiplier). No general-purpose volume calculation lives there — `routes/stats.ts` computes its own. Success criterion #3 (volume identical for facilitator owners vs regular users) is satisfied trivially because the 2x branch only exists inside the deleted file.

### Landing Page Copy
- **D-09:** Remove the two "Earn $OPEN rewards" `<li>` bullets from `apps/dashboard/src/app/page.tsx` lines 498–502 (Free tier) and 534–538 (Starter tier). Delete the `<li>` elements outright — do not replace with substitute bullets. Free tier drops from 5 → 4 bullets; Starter drops from 5 → 4 bullets.

### PROJECT.md Core Value (locked text)
- **D-10:** Replace the entire `## Core Value` section of `.planning/PROJECT.md` with this exact text:
  > A multi-tenant x402 payment facilitator with multi-chain subscription management. Run a free shared facilitator at pay.openfacilitator.io, or stand up your own at a custom domain. Built-in subscription billing across Base and Solana, with chain preference, grace periods, and payment notifications.

  Also update the `## What This Is` section to drop the rewards framing (remove "with a rewards program that pays users $OPEN tokens for volume processed"). Replace with a description that matches the new Core Value.

### SDK Skill Reference (REWARDS-09)
- **D-11:** Audit `skills/openfacilitator/references/sdk-api.md` for `$OPEN`, reward-claim, campaign, or reward-address references. The existing "Claims / Refunds" section (line ~64 onward) is REFUND claims (`getClaimable`, `executeClaim`, `getClaimHistory`) — KEEP that section unchanged. Only remove rewards-specific content if any exists. Likely a near-no-op; flag in plan if there's truly nothing to remove.

### Env Vars (REWARDS-08)
- **D-12:** `REWARDS_WALLET_PRIVATE_KEY` and `OPEN_TOKEN_MINT` are NOT currently in `packages/server/.env.example` — they're only referenced in `packages/server/src/services/reward-transfer.ts`. Removing that file (D-13) satisfies REWARDS-08 for those two vars. Also remove the entire "Rewards Program" section (lines 92–99) which contains `ADMIN_USER_IDS` per D-07. Update `README.md` if it mentions any of the three (verify with grep — current scan showed no matches).

### Files to Delete (Whole-File)
- **D-13:** Delete these files entirely (no partial edits):
  - `packages/server/src/routes/rewards.ts` (1274 lines)
  - `packages/server/src/services/reward-transfer.ts`
  - `packages/server/src/services/reward-claims.ts`
  - `packages/server/src/db/reward-addresses.ts` (135)
  - `packages/server/src/db/reward-claims.ts` (129)
  - `packages/server/src/db/campaigns.ts` (157)
  - `packages/server/src/db/campaign-audit.ts` (48)
  - `packages/server/src/db/volume-snapshots.ts` (123)
  - `packages/server/src/db/volume-aggregation.ts` (672)
  - `packages/server/src/utils/admin.ts`
  - `packages/server/src/utils/solana-verify.ts` (verify it's rewards-only first; it's the reward-claim signature verification per REWARDS-07)
  - `apps/dashboard/src/components/rewards/` (entire directory, 17 files, ~2400 LOC)
  - `apps/dashboard/src/components/campaigns/` (entire directory, 4 files)
  - `apps/dashboard/src/components/facilitator-rewards-section.tsx`
  - `apps/dashboard/src/components/rewards-info-banner.tsx`
  - `apps/dashboard/src/app/rewards/page.tsx`
  - `apps/dashboard/src/app/rewards/admin/page.tsx`

### Files to Edit (Partial)
- **D-14:** Partial edits required:
  - `packages/server/src/db/index.ts` — strip rewards CREATE TABLE blocks + indexes (~lines 597–680); remove `export *` lines for deleted db modules
  - `packages/server/src/db/types.ts` — remove rewards record types
  - `packages/server/src/db/migrations/index.ts` — register `m005`
  - `packages/server/src/server.ts` — remove rewards router mount
  - `packages/server/src/middleware/auth.ts` — remove `requireAdmin` export + `isAdmin` import (per D-07)
  - `packages/server/src/routes/admin.ts` — remove any rewards-specific routes (campaign CRUD per REWARDS-06)
  - `packages/server/src/routes/public.ts` — remove any rewards-specific routes (NOT `/api/claims` — those are refund claims)
  - `packages/server/src/routes/facilitator.ts` — verify no `$OPEN`/`reward` refs (volume multiplier may live here)
  - `packages/server/src/db/facilitators.ts` — remove `2x` multiplier branch if present
  - `apps/dashboard/src/lib/api.ts` — remove rewards types + client methods
  - `apps/dashboard/src/app/dashboard/[id]/page.tsx` — remove `'rewards'` from `Tab` union, the rewards tab button, the rewards render branch, the rewards-section + rewards-info-banner imports
  - `apps/dashboard/src/app/page.tsx` — remove two `<li>` bullets per D-09
  - `apps/dashboard/src/components/navbar.tsx`, `user-menu.tsx`, `auth-provider.tsx`, `archive/wallet-dropdown.tsx`, `refunds-section.tsx`, `dashboard/page.tsx`, `dashboard/FeaturesSpotlight/featureCards.ts`, `dashboard/FeaturesSpotlight/index.tsx`, `resource-owner/registered-servers.tsx`, `resource-owner/index.ts`, `app/refunds/page.tsx`, `app/refunds/setup/page.tsx`, `app/docs/sdk/refunds/page.mdx` — remove rewards references (links, menu items, feature cards, conditional renders)
  - `packages/server/.env.example` — delete the Rewards Program section (lines 92–99) per D-07/D-12
  - `.planning/REQUIREMENTS.md` — fix REWARDS-02 table list per D-04
  - `.planning/PROJECT.md` — rewrite `## Core Value` per D-10, drop rewards from `## What This Is`, update Validated requirements list (remove rewards entries) and Current Milestone section as appropriate
  - `skills/openfacilitator/references/sdk-api.md` — remove rewards content per D-11 (keep refund claims section)

### Plan Granularity
- **D-15:** Single atomic plan covering all of the above. Matches Phase 22 D-05 pattern (~1k LOC there → 5k+ LOC here, still pure deletion). Atomic commit = clean revert. Splitting backend / frontend / docs would leave the dashboard build broken between commits (api.ts methods call deleted routes; tab renderers import deleted components).

### Claude's Discretion
- Order of file deletions inside the plan (planner's call — must keep the build green at the final commit).
- Whether to use `git rm` vs `rm` (mechanical).
- Verification approach: `grep -riE 'reward|campaign|\\$OPEN|REWARDS_WALLET|OPEN_TOKEN_MINT' packages/ apps/ skills/openfacilitator/ --include='*.ts' --include='*.tsx' --include='*.md'` must yield zero matches outside `.planning/`, `db/claims.ts`, `services/claims.ts`, `routes/public.ts /api/claims*` (refunds — KEEP), and `apps/dashboard/src/components/resource-owner/claims-list.tsx` (refunds — KEEP).
- Whether `services/reward-transfer.ts` deletion satisfies REWARDS-07's "SPL transfer code" or whether broader Solana-transfer code needs review (planner verifies).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & requirements
- `.planning/ROADMAP.md` §"Phase 23: Rewards Removal (Backend + Frontend + Docs)" — goal, depends-on (Phase 22), 10 success criteria
- `.planning/REQUIREMENTS.md` §"Rewards Removal" — REWARDS-01 through REWARDS-10 (note: REWARDS-02 table list needs the correction documented in D-04)
- `.planning/STATE.md` — current position and progress
- `.planning/PROJECT.md` — to be updated per D-10

### Prior phase (template to follow)
- `.planning/phases/22-storefronts-removal/22-CONTEXT.md` — Phase 22 decision pattern (atomic plan, drop + bootstrap-strip, no stubs, REQUIREMENTS drift handling)
- `.planning/phases/22-storefronts-removal/22-01-PLAN.md` — atomic-removal plan structure to emulate
- `.planning/phases/22-storefronts-removal/22-VERIFICATION.md` — verification approach Phase 22 used

### Migration system
- `packages/server/src/db/migrations/index.ts` — registration pattern (add `m005` to array)
- `packages/server/src/db/migrations/004_drop_storefronts.ts` — closest template (drop migration with IF EXISTS, FK-safe order)
- `packages/server/src/db/migrations/003_user_wallets_multi_chain.ts` — Migration interface example
- `packages/server/src/db/migrations/002_campaign_audit_table.ts` — CREATE-style migration; this migration ADDS `campaign_audit` which `005` will DROP, so `005` must run cleanly after `002` already executed

### Files to modify or delete (full paths — see D-13/D-14 for the complete list)
- See `<decisions>` D-13 (whole-file deletions) and D-14 (partial edits) for the authoritative file inventory with line counts and reasons.

### Preserve (do NOT touch)
- `packages/server/src/db/index.ts` `CREATE TABLE IF NOT EXISTS claims` block (~line 568) — REFUND claims table
- `packages/server/src/db/claims.ts` — REFUND claims queries
- `packages/server/src/services/claims.ts` — REFUND claims service
- `packages/server/src/routes/public.ts` `/api/claims*` routes — REFUND claims endpoints
- `apps/dashboard/src/components/resource-owner/claims-list.tsx` — REFUND claims UI
- `skills/openfacilitator/references/sdk-api.md` §"Claims / Refunds" — REFUND claims SDK surface
- All subscription, product, payment-link, facilitator, user-wallet, refund, and webhook code paths

### SDK skill
- `skills/openfacilitator/references/sdk-api.md` — keep refund "Claims / Refunds" section; remove only rewards-specific content per D-11

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 22 migration template** (`004_drop_storefronts.ts`) is the closest analog for `005_drop_rewards.ts` — same drop-migration shape with `IF EXISTS` and FK-safe ordering.
- **Phase 22 PLAN/VERIFICATION** structure is directly reusable — same pattern of grep-clean + build-clean + migration-smoke verification.

### Established Patterns
- Sequential migration numbering: `001_`, `002_`, `003_`, `004_`. Next is `005_drop_rewards.ts`.
- Bootstrap-and-migration coupling: removing a feature requires editing BOTH `db/index.ts` bootstrap (so fresh DBs skip the table) AND adding a drop migration (so existing DBs lose it). Phase 22 D-02/D-03.
- Atomic removal plan: Phase 22 used one PLAN for ~1k LOC of deletion. Phase 23 follows the same pattern at ~5k LOC.
- Dashboard tab pattern: `dashboard/[id]/page.tsx` uses a `Tab` union — removing rewards tab is union-member + button + render-branch removal (Phase 22 storefronts pattern).
- `routes/rewards.ts` is the only consumer of `requireAdmin` (`middleware/auth.ts`) and `isAdmin` (`utils/admin.ts`), which are the only consumers of `ADMIN_USER_IDS`. Removing the route chains through to safely removing all four.

### Integration Points
- `packages/server/src/server.ts` mounts the rewards router — remove the import and `app.use` line.
- `packages/server/src/db/index.ts` exports rewards DB modules via `export *` — remove those export lines (mirrors Phase 22 D-03 for storefronts on line 797).
- `apps/dashboard/src/lib/api.ts` has rewards types + client methods — remove (mirrors Phase 22 storefront removal in same file).
- `apps/dashboard/src/app/dashboard/[id]/page.tsx` Tab union currently includes `'rewards'` — Phase 22 CONTEXT noted "leave that alone for Phase 22 (rewards UI removal is Phase 24)"; Phase 23 is the now-merged version of that work and removes it.

### Verification Surface
- `grep -riE 'reward|campaign|\\$OPEN|REWARDS_WALLET|OPEN_TOKEN_MINT' packages/ apps/ skills/openfacilitator/ --include='*.ts' --include='*.tsx' --include='*.md'` should yield zero matches outside the preserved-refunds files and `.planning/` history.
- `pnpm build` must succeed in both `apps/dashboard` and `packages/server`.
- Migration smoke test: run `005_drop_rewards.ts` on an existing dev DB — drops tables without error and survives a second run (idempotency). Use `npm run test:migration` if it works for Phase 22 (WR-04 added that script).
- Request to former `/rewards/*` and `/rewards/admin` URLs returns 404.

</code_context>

<specifics>
## Specific Ideas

- Migration name: `005_drop_rewards.ts` with `name: '005_drop_rewards'` to match the established convention.
- Drop order (FK-safe): `volume_snapshots → reward_claims → campaign_audit → campaigns → reward_addresses`. `IF EXISTS` on all five for idempotency.
- PROJECT.md `## Core Value` exact replacement text is locked in D-10.
- Landing page treatment: delete the two `<li>` bullets outright; do not substitute (D-09).
- The "Rewards Program" section of `packages/server/.env.example` (lines 92–99, contains `ADMIN_USER_IDS`) is deleted entirely — including the section header and all comments.
- REQUIREMENTS.md REWARDS-02 amendment is part of THIS phase's commit (D-04), not deferred.
- `services/reward-transfer.ts` is the source of truth for the `REWARDS_WALLET_PRIVATE_KEY` / `OPEN_TOKEN_MINT` env var references — deleting the file removes the last consumers (D-12).
- Phase 22's `22-VERIFICATION.md` is the template for `23-VERIFICATION.md` — same shape, more tables and more files.

</specifics>

<deferred>
## Deferred Ideas

- **Future admin role system on Better Auth.** If admin features return after this phase, rebuild on Better Auth roles rather than reviving `ADMIN_USER_IDS`. Not a Phase 24 item — would be a separate post-audit milestone.
- **Sybil cluster detection dashboard** — already noted in REQUIREMENTS.md "Future Requirements" as likely-dropped (depended on rewards). Discussion did not revisit; remains deferred.

</deferred>

---

*Phase: 23-rewards-removal-backend-frontend-docs*
*Context gathered: 2026-05-17*
