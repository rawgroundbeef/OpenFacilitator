# Roadmap: OpenFacilitator

## Milestones

- [x] **v1.0 MVP** - Phases 1-11 (shipped 2026-01-20)
- [x] **v1.1 SDK & Docs** - Phases 12-16 (shipped 2026-01-21)
- [x] **v1.2 Subscription Wallet Overhaul** - Phases 17-21 (shipped 2026-01-23)
- [ ] **v1.3 Trim & Audit** - Phases 22-25 (planning)

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

- [ ] **Phase 22: Storefronts Removal** - Cut the unused storefronts surface across dashboard, server routes, and DB
- [ ] **Phase 23: Rewards Backend Removal** - Drop rewards routes, DB tables, multiplier logic, admin CRUD, and SPL transfer code
- [ ] **Phase 24: Rewards UI & Docs Cleanup** - Remove rewards UI, retire env vars, update landing/SDK/README, rewrite Core Value
- [ ] **Phase 25: Security Audit & Remediation** - Audit auth, multi-tenant isolation, signing, secrets, input validation; remediate HIGH/CRITICAL findings

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
**Plans**: TBD
**UI hint**: yes

### Phase 23: Rewards Backend Removal
**Goal**: All server-side rewards machinery (routes, DB tables, multiplier logic, admin CRUD, SPL transfer, signature verification) is gone and the server runs cleanly without it.
**Depends on**: Phase 22
**Requirements**: REWARDS-01, REWARDS-02, REWARDS-05, REWARDS-06, REWARDS-07
**Success Criteria** (what must be TRUE):
  1. No `/rewards/*` route is registered; requests to former rewards endpoints return 404
  2. Migration drops `reward_addresses`, `campaigns`, `claims`, and `volume_snapshots` tables cleanly on fresh and existing DBs
  3. Volume calculation produces identical results for facilitator owners and regular users (no 2x branch remains)
  4. Admin campaign CRUD routes, handlers, and audit log entries are removed; admin surface compiles
  5. SPL transfer helpers and reward-claim signature verification code paths are deleted and unreferenced (verified by grep)
**Plans**: TBD

### Phase 24: Rewards UI & Docs Cleanup
**Goal**: Dashboard, landing page, SDK docs, environment config, and PROJECT.md no longer reference rewards; the public pitch is facilitator + subscriptions.
**Depends on**: Phase 23
**Requirements**: REWARDS-03, REWARDS-04, REWARDS-08, REWARDS-09, REWARDS-10
**Success Criteria** (what must be TRUE):
  1. Dashboard renders with no rewards tab, rewards components, or rewards info banners; no broken imports remain
  2. Landing page no longer mentions $OPEN, claims, or rewards; copy reflects facilitator + subscriptions
  3. `REWARDS_WALLET_PRIVATE_KEY` and `OPEN_TOKEN_MINT` are removed from `.env.example` and README; running the server with neither var set succeeds
  4. `skills/openfacilitator/references/sdk-api.md` contains no rewards endpoints or examples
  5. `PROJECT.md` "Core Value" section names facilitator + subscriptions as the pitch with no rewards framing
**Plans**: TBD
**UI hint**: yes

### Phase 25: Security Audit & Remediation
**Goal**: The slimmed surface area has been audited end-to-end and every HIGH/CRITICAL finding is either fixed or explicitly accepted with rationale.
**Depends on**: Phase 24
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
Phases execute in numeric order: 22 → 23 → 24 → 25

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 22. Storefronts Removal | 0/TBD | Not started | - |
| 23. Rewards Backend Removal | 0/TBD | Not started | - |
| 24. Rewards UI & Docs Cleanup | 0/TBD | Not started | - |
| 25. Security Audit & Remediation | 0/TBD | Not started | - |

---

*Next: `/gsd-plan-phase 22`*
*Last updated: 2026-05-16 — v1.3 Trim & Audit roadmap created*
