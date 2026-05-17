# Phase 23: Rewards Removal (Backend + Frontend + Docs) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 23-rewards-removal-backend-frontend-docs
**Areas discussed:** Tables to drop, Plan granularity, Core Value + landing copy, ADMIN_USER_IDS / requireAdmin scope

---

## Tables to drop (fix the list)

| Option | Description | Selected |
|--------|-------------|----------|
| Drop all 5 rewards tables | Drop `volume_snapshots, reward_claims, campaign_audit, campaigns, reward_addresses` in FK-safe order; KEEP `claims` (REFUNDS); strip CREATE blocks from bootstrap; amend REQUIREMENTS.md REWARDS-02 | ✓ |
| Same 5 + amend REQUIREMENTS silently | Same drop set, but no REQUIREMENTS.md edit | |
| Verify in plan-phase research instead | Defer FK chain confirmation to researcher | |

**User's choice:** Drop all 5 rewards tables (Recommended)
**Notes:** Codebase scout caught a drift between memory/REQUIREMENTS.md and the actual schema — `claims` is the REFUND claims table (used by /api/claims and resource-owner UI) and must be preserved. Real rewards tables are `reward_addresses, reward_claims, campaigns, campaign_audit, volume_snapshots`. Captured in CONTEXT.md D-01 through D-04.

---

## Plan granularity

| Option | Description | Selected |
|--------|-------------|----------|
| Single atomic plan | One PLAN.md for all ~5k LOC (server + dashboard + landing + docs + env). Matches Phase 22 pattern | ✓ |
| Split: backend / frontend / docs | 23-01 server, 23-02 dashboard, 23-03 docs. Smaller PRs but build breaks between commits | |
| Split: code / docs | 23-01 all code, 23-02 docs-only | |

**User's choice:** Single atomic plan (Recommended)
**Notes:** Phase 22 D-05 established the pattern at ~1k LOC. Splitting backend-from-frontend would leave api.ts methods pointing at deleted routes between commits — guaranteed broken intermediate build. Single atomic plan keeps revert clean. Captured in CONTEXT.md D-15.

---

## Core Value + landing copy

### Landing page bullets (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Replace with non-rewards bullets | Free → "Subscription billing", Starter → "Multi-chain subscriptions (Base + Solana)" | |
| Just remove the bullets | Delete the two `<li>` items outright; both tiers drop to 4 bullets | ✓ |
| Defer wording to planner | Lock direction only | |

**User's choice:** Just remove the bullets
**Notes:** Cleanest diff. Both pricing tiers drop from 5 → 4 bullets. Captured in CONTEXT.md D-09.

### PROJECT.md Core Value text

| Option | Description | Selected |
|--------|-------------|----------|
| Lock exact text now | "A multi-tenant x402 payment facilitator with multi-chain subscription management. Run a free shared facilitator at pay.openfacilitator.io, or stand up your own at a custom domain. Built-in subscription billing across Base and Solana, with chain preference, grace periods, and payment notifications." | ✓ |
| Lock direction, defer wording | Direction locked, planner drafts variations | |

**User's choice:** Lock exact text (Recommended)
**Notes:** Eliminates PR-time copywriting churn. Captured verbatim in CONTEXT.md D-10.

---

## ADMIN_USER_IDS / requireAdmin scope

| Option | Description | Selected |
|--------|-------------|----------|
| Remove entirely with rewards | Delete `utils/admin.ts`, `requireAdmin` middleware, `ADMIN_USER_IDS` env var. Only consumer is rewards routes | ✓ |
| Keep middleware and env var | Preserve as latent infra for future admin features | |
| Keep utility, drop env var section | Hybrid: keep code, remove env example | |

**User's choice:** Remove entirely with rewards (Recommended)
**Notes:** Shrinks attack surface for Phase 24 security audit. If admin features come back, the right answer is Better Auth roles, not a comma-separated env list. Captured in CONTEXT.md D-07.

---

## Claude's Discretion

- Order of file deletions inside the plan (must keep final commit green; intermediate state may break).
- `git rm` vs `rm` for whole-file deletions (mechanical).
- Exact grep verification command used by Verification phase (must satisfy success criterion #1 — zero rewards refs outside `.planning/` and the preserved-refunds files).
- Whether `services/reward-transfer.ts` deletion fully satisfies REWARDS-07 "SPL transfer code" or if broader Solana-transfer code (e.g., `packages/core/src/solana.ts`) needs review — planner to verify.
- Whether `packages/server/src/utils/solana-verify.ts` is rewards-claim-signature only (REWARDS-07) or has other consumers — planner to verify before whole-file delete.

## Deferred Ideas

- **Future admin role system on Better Auth.** If admin features return after this phase, rebuild on Better Auth roles rather than reviving `ADMIN_USER_IDS`. Not a Phase 24 item.
- **Sybil cluster detection dashboard** — already in REQUIREMENTS.md "Future Requirements" as likely-dropped (depended on rewards). Discussion did not revisit; remains deferred.
