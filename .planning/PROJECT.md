# OpenFacilitator Rewards Program

## What This Is

A rewards program that pays users $OPEN tokens (Solana SPL) for volume processed through OpenFacilitator. Users register pay-to addresses, prove ownership via wallet signatures, track volume in real-time, and claim tokens when thresholds are met. This is a customer acquisition strategy — no other facilitator pays users to use them.

## Core Value

Users who process volume through OpenFacilitator get rewarded with $OPEN tokens. Hit threshold, get tokens. Own a white-label facilitator, get 2x.

## Current State

**Shipped:** v1.0 Rewards Program (2026-01-20)

**Codebase:**
- Dashboard: ~17,400 LOC TypeScript/React
- Server: SQLite + Better Auth + Hono
- 47 files added/modified for rewards feature

**Tech stack:**
- Next.js 15.5 + React 19 + Tailwind + shadcn/ui
- @solana/wallet-adapter-react for Solana wallets
- wagmi + viem for EVM wallets
- @solana/web3.js + @solana/spl-token for token transfers

## Requirements

### Validated

- ✓ User authentication via Better Auth (email/password) — existing
- ✓ Multi-tenant facilitator system with subdomain/custom domain routing — existing
- ✓ Transaction logging with facilitator_id, to_address, from_address, amount — existing
- ✓ Free facilitator at pay.openfacilitator.io — existing
- ✓ Dashboard with facilitator management, products, stats — existing
- ✓ Solana wallet generation and SPL token support — existing
- ✓ Free users can register for rewards tracking — v1.0
- ✓ Users can add/verify Solana and EVM pay-to addresses — v1.0
- ✓ Dashboard shows volume, threshold progress, estimated rewards — v1.0
- ✓ Facilitator owners get 2x multiplier automatically — v1.0
- ✓ Admin can create and manage reward campaigns — v1.0
- ✓ Volume calculated from transaction logs for verified addresses — v1.0
- ✓ Users can claim $OPEN tokens when threshold met — v1.0
- ✓ SPL token transfer from rewards wallet on claim — v1.0
- ✓ Claim history with transaction signatures — v1.0

### Active

- [ ] Dashboard features spotlight for discoverability (Refunds, Facilitator, Rewards cards)
- [ ] Email notifications when threshold reached or claim available
- [ ] Sybil cluster detection dashboard for admins

### Out of Scope

- Leaderboards — deferred to post-launch based on demand
- Gamification (badges, streaks) — distraction from core value
- KYC verification — adds friction, not needed for loyalty program
- Complex tier systems — simplicity is a feature
- Mobile app — web dashboard sufficient
- OAuth login — email/password + wallet sufficient

## Context

**Production readiness:**
- Rewards wallet needs funding (REWARDS_WALLET_PRIVATE_KEY env var)
- OPEN_TOKEN_MINT address needs configuration
- CRON_SECRET for volume snapshot jobs
- First campaign needs creation via /rewards/admin

**Known limitations:**
- Single active campaign at a time (by design)
- 5 address limit per user (anti-gaming)
- 30-day claim window after campaign ends

## Constraints

- **Database**: SQLite (existing) — all rewards tables added to same DB
- **Auth**: Better Auth (existing) — rewards extends auth context
- **UI**: Integrated into existing dashboard at /rewards
- **Token**: $OPEN on Solana — SPL token transfers via @solana/spl-token
- **Timeline**: v1.0 shipped, claims available March 2026

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Integrate into existing dashboard | Reduces complexity, leverages existing auth | ✓ Good |
| SQLite for rewards tables | Consistent with existing infra | ✓ Good |
| Solana signature verification (Ed25519) | Industry standard, users already have wallets | ✓ Good |
| EVM signature verification (EIP-191) | Industry standard for Ethereum | ✓ Good |
| Proportional distribution | Fair allocation based on contribution | ✓ Good |
| Soft anti-gaming (track, don't block) | Gaming is acceptable CAC for v1 | — Pending |
| Snapshot + live delta for volume | Efficient aggregation at scale | ✓ Good |
| Ephemeral wallet connection for claims | Security - don't store wallet keys | ✓ Good |
| Combined initiate + execute claim | Atomic operation, simpler UX | ✓ Good |
| 5 address limit per user | Balance flexibility vs abuse prevention | ✓ Good |
| Single active campaign | Simplicity, clear rules for users | ✓ Good |

---
*Last updated: 2026-01-20 after v1.0 milestone*
