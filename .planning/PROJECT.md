# OpenFacilitator

## What This Is

A multi-tenant x402 payment facilitator with multi-chain subscription management. Users can create facilitators on custom domains and accept payments across Base and Solana with built-in subscription billing.

## Core Value

A multi-tenant x402 payment facilitator with multi-chain subscription management. Run a free shared facilitator at pay.openfacilitator.io, or stand up your own at a custom domain. Built-in subscription billing across Base and Solana, with chain preference, grace periods, and payment notifications.

## Current State

**Shipped:**
- v1.0 Rewards Program (2026-01-20)
- v1.1 SDK & Docs (2026-01-21)
- v1.2 Subscription Wallet Overhaul (2026-01-23)

## Current Milestone: v1.3 Trim & Audit

**Goal:** Remove unused features ($OPEN rewards program + storefronts) and run a full security audit on the slimmed surface area.

**Target work:**
- Remove storefronts (admin/facilitator route surface, db/storefronts, dashboard section)
- Remove $OPEN rewards program (DB tables, /rewards/* routes, dashboard rewards UI, 2x multiplier, claims engine, SPL transfer code, signature verification flows, rewards env vars)
- Security audit of the remaining surface area (auth, payments, signing, multi-tenant isolation)

**Why these removals:** Neither feature found product-market fit. Removing them shrinks the attack surface before the security audit and lets the project refocus on what's working (multi-tenant facilitator + subscriptions).

**Status:** Phases 22 (storefronts removal) and 23 (rewards removal) shipped. Phase 24 audit half complete (2026-05-17) — `24-SECURITY-AUDIT.md` enumerates 1 CRITICAL, 10 HIGH, 7 MEDIUM, 15 LOW findings across SEC-01..SEC-05 plus an 11-row CONCERNS re-validation; re-runnable grep/semgrep tooling and pnpm-audit baseline committed under `tools/security-audit/`. Phase 24 remediation half (24-02) is the next planned plan and will act on the audit findings per the D-14 fix-or-accept threshold.

**Constraints:**
- Keep multi-chain wallet infra (v1.2 subscriptions depend on it)
- `## Core Value` will be rewritten as part of this milestone — facilitator + subscriptions is the new pitch
- Audit runs LAST so it isn't wasted on dead code

**Codebase:**
- Dashboard: ~18,000 LOC TypeScript/React
- Server: SQLite + Better Auth + Hono
- SDK: x402 v1 and v2 type support with TypeScript narrowing
- 3 milestones shipped, 21 phases, 37 plans executed

**Tech stack:**
- Next.js 15.5 + React 19 + Tailwind + shadcn/ui
- @solana/wallet-adapter-react for Solana wallets
- wagmi + viem for EVM wallets
- @solana/web3.js + @solana/spl-token for token transfers
- node-cron for billing automation

## Requirements

### Validated

- ✓ User authentication via Better Auth (email/password) — existing
- ✓ Multi-tenant facilitator system with subdomain/custom domain routing — existing
- ✓ Transaction logging with facilitator_id, to_address, from_address, amount — existing
- ✓ Free facilitator at pay.openfacilitator.io — existing
- ✓ Dashboard with facilitator management, products, stats — existing
- ✓ Solana wallet generation and SPL token support — existing
- ✓ SDK x402 v2 type definitions with TypeScript narrowing — v1.1
- ✓ Type guards for runtime version discrimination — v1.1
- ✓ verify() and settle() handle v1 and v2 formats — v1.1
- ✓ Comprehensive refund documentation for merchants — v1.1
- ✓ Whitelabel facilitator volume tracking — v1.1
- ✓ Legacy embedded wallet removed from header — v1.2
- ✓ Subscriptions dashboard section with status display — v1.2
- ✓ Base wallet alongside Solana wallet — v1.2
- ✓ Wallet addresses visible for direct funding — v1.2
- ✓ Chain preference toggle with intelligent defaults — v1.2
- ✓ Daily billing cron with preferred chain fallback — v1.2
- ✓ 7-day grace period for failed payments — v1.2
- ✓ Low balance and payment status notifications — v1.2
- ✓ Subscription payment history with tx hashes — v1.2

### Future

- Dashboard features spotlight for discoverability
- Email notifications
- Prorated refunds for mid-cycle cancellation
- Fund button with checkout flow (alternative to direct addresses)

### Out of Scope

- Leaderboards — deferred to post-launch based on demand
- Gamification (badges, streaks) — distraction from core value
- KYC verification — adds friction, not needed for loyalty program
- Complex tier systems — simplicity is a feature
- Mobile app — web dashboard sufficient
- OAuth login — email/password + wallet sufficient

## Context

**Production readiness:**
- CRON_SECRET for subscription billing cron
- Stripe-style billing wallet flow for facilitator subscriptions

## Constraints

- **Database**: SQLite (existing) — all tables in same DB
- **Auth**: Better Auth (existing) — extends auth context
- **UI**: Integrated into existing dashboard

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Integrate into existing dashboard | Reduces complexity, leverages existing auth | ✓ Good |
| SQLite for all tables | Consistent with existing infra | ✓ Good |
| Literal x402Version types (1, 2) | Enables TypeScript narrowing | ✓ Good |
| PaymentRequirements field presence discrimination | No version field needed, use maxAmountRequired | ✓ Good |
| getVersionSafe defaults to v1 | Backward compatibility with pre-versioning payloads | ✓ Good |
| Middleware-first refund docs | Simpler DX for most merchants | ✓ Good |
| Show wallet addresses directly | Power user friendly, direct deposits | ✓ Good |
| 7-day grace period | Standard industry practice | ✓ Good |
| Pre-fund any amount | Flexibility for users | ✓ Good |
| No mid-cycle refunds | Simpler, subscription runs until end | ✓ Good |
| Prominent chain preference toggle | Easy discoverability, user control | ✓ Good |
| node-cron for billing | Built-in, no external scheduler needed | ✓ Good |
| Notification duplicate prevention | 24h/72h windows prevent spam | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-18 — Phase 24 audit half complete: security findings enumerated, audit tooling committed; Phase 24-02 remediation is next*
