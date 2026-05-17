# Roadmap: OpenFacilitator

## Milestones

- [x] **v1.0 MVP** - Phases 1-11 (shipped 2026-01-20)
- [x] **v1.1 SDK & Docs** - Phases 12-16 (shipped 2026-01-21)
- [x] **v1.2 Subscription Wallet Overhaul** - Phases 17-21 (shipped 2026-01-23)
- [ ] **v1.3 Trim & Audit** - Phases 22-24 (in progress)

## Phases

<details>
<summary>v1.0 MVP (Phases 1-11) - SHIPPED 2026-01-20</summary>

See: milestones/v1.0-ROADMAP.md for archived v1.0 phase details.

</details>

<details>
<summary>v1.1 SDK & Docs (Phases 12-16) - SHIPPED 2026-01-21</summary>

See: milestones/v1.1-ROADMAP.md for archived v1.1 phase details.

</details>

<details>
<summary>v1.2 Subscription Wallet Overhaul (Phases 17-21) - SHIPPED 2026-01-23</summary>

See: milestones/v1.2-ROADMAP.md for archived v1.2 phase details.

</details>

### v1.3 Trim & Audit (Planning)

**Milestone Goal:** Remove unused features ($OPEN rewards program + storefronts) and run a full security audit on the slimmed surface area.

- [x] **Phase 22: Storefronts Removal** - Cut the unused storefronts surface across dashboard, server routes, and DB (completed 2026-05-17)
- [x] **Phase 23: Rewards Removal (Backend + Frontend + Docs)** - Drop all rewards machinery — routes, DB tables, multiplier logic, admin CRUD, SPL transfer, dashboard UI, landing page, SDK docs, env vars, and PROJECT.md positioning (completed 2026-05-17)
- [ ] **Phase 24: Security Audit & Remediation** - Audit auth, multi-tenant isolation, signing, secrets, input validation; remediate HIGH/CRITICAL findings

## Phase Details

### Phase 22: Storefronts Removal
**Goal**: Storefronts feature is fully excised from server, database, and dashboard with no dangling references.
**Depends on**: Phase 21 (v1.2 shipped)
**Requirements**: STORE-01, STORE-02, STORE-03, STORE-04, STORE-05
**Success Criteria** (what must be TRUE):
  1. No references to `storefronts-section`, `db/storefronts`, or `storefronts` table remain in the codebase (verified by grep)
  2. Migration runs cleanly on a fresh and existing DB, dropping the `storefronts` table
  3. `routes/admin.ts` and `routes/facilitator.ts` compile and serve requests with no storefront handlers
  4. Dashboard build succeeds with no missing-import errors after storefront UI and `lib/api.ts` refs are removed
  5. `db/types.ts` and `db/index.ts` no longer export storefront types or table accessors
**Plans**: 1 plan
  - [x] 22-01-PLAN.md — Atomic excision of storefronts (server routes, db module + migration 004, dashboard component + api client + tab integration; grep + build verification)
**UI hint**: yes

### Phase 23: Rewards Removal (Backend + Frontend + Docs)
**Goal**: All rewards machinery is gone end-to-end — server routes, DB tables, multiplier logic, admin CRUD, SPL transfer, dashboard UI, landing page copy, SDK docs, env vars, and PROJECT.md positioning. Server and dashboard build and run cleanly with no rewards references.
**Depends on**: Phase 22
**Requirements**: REWARDS-01 through REWARDS-10
**Success Criteria** (what must be TRUE):
  1. No `/rewards/*` route is registered; requests to former rewards endpoints return 404
  2. Migration drops `reward_addresses`, `campaigns`, `claims`, and `volume_snapshots` tables cleanly on fresh and existing DBs
  3. Volume calculation produces identical results for facilitator owners and regular users (no 2x branch remains)
  4. Admin campaign CRUD routes, handlers, and audit log entries are removed; admin surface compiles
  5. SPL transfer helpers and reward-claim signature verification code paths are deleted and unreferenced (verified by grep)
  6. Dashboard renders with no rewards tab, rewards components, or rewards info banners; no broken imports remain
  7. Landing page no longer mentions $OPEN, claims, or rewards; copy reflects facilitator + subscriptions
  8. `REWARDS_WALLET_PRIVATE_KEY` and `OPEN_TOKEN_MINT` are removed from `.env.example` and README; running the server with neither var set succeeds
  9. `skills/openfacilitator/references/sdk-api.md` contains no rewards endpoints or examples
  10. `PROJECT.md` "Core Value" section names facilitator + subscriptions as the pitch with no rewards framing
**Plans**: 1 plan
  - [x] 23-01-PLAN.md — Atomic excision of $OPEN rewards program (server routes/services/db modules + migration 005, dashboard rewards pages/components/lib-api/tab integration, navbar + auth-provider surgery, landing-page bullets, PROJECT.md Core Value rewrite per D-10, REQUIREMENTS.md REWARDS-02 fix per D-04, .env.example Rewards Program section strip, full-repo grep gate + build + migration smoke test)
**UI hint**: yes

### Phase 24: Security Audit & Remediation
**Goal**: The slimmed surface area has been audited end-to-end and every HIGH/CRITICAL finding is either fixed or explicitly accepted with rationale.
**Depends on**: Phase 23
**Requirements**: SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06
**Success Criteria** (what must be TRUE):
  1. Authentication audit (Better Auth config, sessions, route protection, cookie flags) is documented with findings and severities
  2. Multi-tenant isolation audit confirms `facilitator_id` scoping on every cross-tenant query; any gaps logged as findings
  3. Payment co-signing audit verifies Solana instruction allowlist completeness, EVM signing safety, and replay protection; findings logged
  4. Secrets/key management and input validation/API hardening audits are complete with documented findings
  5. Every HIGH/CRITICAL finding has either a merged remediation PR or an explicit entry in `SECURITY-DECISIONS.md` with rationale for acceptance
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 22 → 23 → 24

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 22. Storefronts Removal | 1/1 | Complete    | 2026-05-17 |
| 23. Rewards Removal (Backend + Frontend + Docs) | 1/1 | Complete    | 2026-05-17 |
| 24. Security Audit & Remediation | 0/TBD | Not started | - |

---

*Next: `/gsd-execute-phase 23`*
*Last updated: 2026-05-17 — Phase 23 planned: single atomic plan 23-01-PLAN.md covers all REWARDS-01..REWARDS-10 deletions*
