# Requirements: v1.3 Trim & Audit

**Status:** ACTIVE (planning)
**Milestone goal:** Remove unused features ($OPEN rewards program + storefronts) and run a full security audit on the slimmed surface area.

---

## v1.3 Requirements

### Storefronts Removal

- [ ] **STORE-01**: `storefronts-section` component removed from dashboard
- [ ] **STORE-02**: `db/storefronts` module removed; storefronts table dropped via migration
- [ ] **STORE-03**: Storefront references removed from `routes/admin.ts` and `routes/facilitator.ts`
- [ ] **STORE-04**: Dashboard storefront refs in `lib/api.ts` and `dashboard/[id]/page.tsx` cleaned
- [ ] **STORE-05**: Storefront types removed from `db/types.ts` and `db/index.ts`

### Rewards Removal

- [ ] **REWARDS-01**: `/rewards/*` server routes removed
- [ ] **REWARDS-02**: Rewards DB tables dropped via migration (`reward_addresses`, `campaigns`, `claims`, `volume_snapshots`)
- [ ] **REWARDS-03**: Dashboard rewards UI removed (`components/rewards/*`, `facilitator-rewards-section.tsx`, `rewards-info-banner.tsx`, rewards tab)
- [ ] **REWARDS-04**: Landing page rewards copy removed or replaced with facilitator/subscriptions messaging
- [ ] **REWARDS-05**: 2x facilitator multiplier logic removed from volume calculation
- [ ] **REWARDS-06**: Admin campaign CRUD removed (routes, UI, audit log entries)
- [ ] **REWARDS-07**: SPL transfer code and reward-claim signature verification removed
- [ ] **REWARDS-08**: Rewards env vars retired (`REWARDS_WALLET_PRIVATE_KEY`, `OPEN_TOKEN_MINT`); README and `.env.example` updated
- [ ] **REWARDS-09**: SDK skill references to rewards (`skills/openfacilitator/references/sdk-api.md`) updated
- [ ] **REWARDS-10**: `PROJECT.md` "Core Value" section rewritten — facilitator + subscriptions as the pitch

### Security Audit

- [ ] **SEC-01**: Authentication surface audited (Better Auth config, session handling, route protection, cookie flags)
- [ ] **SEC-02**: Multi-tenant isolation audited (`facilitator_id` scoping enforced on all queries, no cross-tenant leakage)
- [ ] **SEC-03**: Payment co-signing flow audited (Solana instruction allowlist completeness, EVM transaction signing, replay protection)
- [ ] **SEC-04**: Secrets and key management audited (env handling, private keys never logged, no secrets in responses)
- [ ] **SEC-05**: Input validation and API hardening audited (Hono route schemas, webhook signature verification, rate limits)
- [ ] **SEC-06**: All HIGH/CRITICAL audit findings remediated or explicitly accepted with rationale

---

## Future Requirements

(Carried forward from v1.2)

- Dashboard features spotlight for discoverability
- Email notifications (planned for v1.4)
- Sybil cluster detection dashboard for admins (likely dropped — depended on rewards)
- Prorated refunds for mid-cycle cancellation
- Fund button with checkout flow (alternative to direct addresses)

## Out of Scope

- New features — v1.3 is removal + audit only
- UI refresh — deferred to v1.4
- More chain support — deferred to v1.4
- Email notifications — deferred to v1.4
- Replacing rewards with a different incentive program — explicit non-goal; rewards is being removed, not redesigned

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| STORE-01 | Phase 22 | Planning |
| STORE-02 | Phase 22 | Planning |
| STORE-03 | Phase 22 | Planning |
| STORE-04 | Phase 22 | Planning |
| STORE-05 | Phase 22 | Planning |
| REWARDS-01 | Phase 23 | Planning |
| REWARDS-02 | Phase 23 | Planning |
| REWARDS-03 | Phase 24 | Planning |
| REWARDS-04 | Phase 24 | Planning |
| REWARDS-05 | Phase 23 | Planning |
| REWARDS-06 | Phase 23 | Planning |
| REWARDS-07 | Phase 23 | Planning |
| REWARDS-08 | Phase 24 | Planning |
| REWARDS-09 | Phase 24 | Planning |
| REWARDS-10 | Phase 24 | Planning |
| SEC-01 | Phase 25 | Planning |
| SEC-02 | Phase 25 | Planning |
| SEC-03 | Phase 25 | Planning |
| SEC-04 | Phase 25 | Planning |
| SEC-05 | Phase 25 | Planning |
| SEC-06 | Phase 25 | Planning |

**Coverage:** 21/21 requirements mapped to phases (100%) — no orphans, no duplicates.

---
*Last updated: 2026-05-16 — v1.3 roadmap created, traceability filled in by gsd-roadmapper*
