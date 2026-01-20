# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-01-19)

**Core value:** Users who process volume through OpenFacilitator get rewarded with $OPEN tokens
**Current focus:** Phase 10 - Claims Engine

## Current Position

Phase: 10 of 11 (Claims Engine)
Plan: 0 of 3 in current phase
Status: Ready to discuss/plan
Last activity: 2026-01-20 - Phase 9 verified complete

Progress: [########..] 82%

## Performance Metrics

**Velocity:**
- Total plans completed: 13
- Average duration: 3m 51s
- Total execution time: 0.83 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-database-foundation | 1 | 3m 9s | 3m 9s |
| 02-auth-integration | 2 | 5m 51s | 2m 56s |
| 03-solana-address-management | 2 | 12m 0s | 6m 0s |
| 04-evm-address-management | 1 | 4m 0s | 4m 0s |
| 05-address-ui | 2 | 7m 4s | 3m 32s |
| 06-volume-tracking-engine | 1 | 2m 34s | 2m 34s |
| 07-campaign-system | 2 | 9m 21s | 4m 41s |
| 08-rewards-dashboard | 1 | 4m 0s | 4m 0s |
| 09-wallet-connection | 1 | 4m 0s | 4m 0s |

**Recent Trend:**
- Last 5 plans: 07-01 (3m 25s), 07-02 (5m 56s), 08-01 (4m 0s), 09-01 (4m 0s)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| ID | Decision | Phase |
|----|----------|-------|
| D-01-01-001 | Store monetary amounts as TEXT strings for precision | 01-01 |
| D-01-01-002 | Normalize EVM addresses lowercase, preserve Solana case | 01-01 |
| D-01-01-003 | UNIQUE(user_id, campaign_id) prevents duplicate claims | 01-01 |
| D-02-01-001 | Admin users defined by ADMIN_USER_IDS env var (comma-separated) | 02-01 |
| D-02-01-002 | Enrollment check via isUserEnrolledInRewards returns boolean from reward_addresses table | 02-01 |
| D-02-02-001 | Rewards banner is informational only - no enrollment action until Phase 3 | 02-02 |
| D-03-01-001 | 5 address limit per user - enough for multiple pay-to addresses without enabling abuse | 03-01 |
| D-03-01-002 | Mainnet network with auto-detect wallets (empty wallets array) | 03-01 |
| D-03-01-003 | autoConnect=false - user explicitly triggers wallet connection | 03-01 |
| D-03-02-001 | Facilitator owners auto-enrolled - volume tracked via facilitator, no address needed | 03-02 |
| D-03-02-002 | isEnrolled = hasAddresses OR isFacilitatorOwner (simple boolean logic) | 03-02 |
| D-04-01-001 | mainnet, base, polygon chains supported - most common EVM networks | 04-01 |
| D-04-01-002 | injected, MetaMask, Safe connectors - covers browser extensions and Safe wallets | 04-01 |
| D-04-01-003 | Chain selector tabs in modal - simple toggle between Solana and EVM | 04-01 |
| D-05-01-001 | Purple 'S' badge for Solana, blue 'E' badge for EVM chain indicators | 05-01 |
| D-05-01-002 | Pending cards have opacity-70 dimming plus warning text | 05-01 |
| D-05-01-003 | Add button disabled at 5 address limit with info message | 05-01 |
| D-05-02-001 | Volume history preserved on address removal | 05-02 |
| D-05-02-002 | Last verified address removal shows amber warning but allowed | 05-02 |
| D-05-02-003 | Verify button opens enrollment modal to re-sign ownership | 05-02 |
| D-06-01-001 | Volume aggregation uses snapshot + live delta pattern for performance | 06-01 |
| D-06-01-002 | Address-based and facilitator-ownership volume stack (2x when both apply) | 06-01 |
| D-06-01-003 | Snapshot endpoint uses CRON_SECRET header (not auth middleware) for external scheduler access | 06-01 |
| D-07-01-001 | Campaign status flow: draft -> published -> active -> ended | 07-01 |
| D-07-01-002 | Audit logging captures diff (from/to) for each field changed | 07-01 |
| D-07-01-003 | Only draft campaigns can be deleted | 07-01 |
| D-07-02-001 | USDC amounts stored as atomic units (divide by 1e6 for display) | 07-02 |
| D-07-02-002 | Worked example shows effective volume with multiplier applied | 07-02 |
| D-07-02-003 | Admin page redirects non-admins to /rewards | 07-02 |
| D-08-01-001 | Progress bar turns green when threshold met (celebrates achievement) | 08-01 |
| D-08-01-002 | Facilitator addresses show 'F' badge with emerald color | 08-01 |
| D-08-01-003 | Campaign ended state shows 'Rewards being calculated...' message | 08-01 |
| D-09-01-001 | Ephemeral wallet connection - disconnect on modal close for security | 09-01 |
| D-09-01-002 | $OPEN tokens use 9 decimals (standard SPL token) | 09-01 |
| D-09-01-003 | Claim wallet stored on claim record, not user account | 09-01 |

### Pending Todos

None yet.

### Blockers/Concerns

- **Pre-Phase 10:** Rewards wallet must be funded and multisig configured before claims go live
- **Pre-Launch:** Legal review for securities compliance (frame as loyalty program)
- **Pre-Production:** CRON_SECRET env var must be configured for volume snapshot cron jobs

## Session Continuity

Last session: 2026-01-20
Stopped at: Phase 9 verified complete
Resume file: None
