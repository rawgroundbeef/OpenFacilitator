# Next Milestones (scratch)

_Captured 2026-05-13 — not yet formalized. Run `/gsd-new-milestone` when ready._

## v1.3 — Trim & Audit (quiet)

Risk-management milestone. Public framing: "sunsetting some unused features."

**Phases:**

1. **Remove storefronts** (warmup, ~10 files)
   - `apps/dashboard/src/components/storefronts-section.tsx`
   - `packages/server/src/db/storefronts.ts`
   - References in `packages/server/src/routes/admin.ts`, `routes/facilitator.ts`, `db/types.ts`, `db/index.ts`
   - Dashboard refs: `src/lib/api.ts`, `src/app/dashboard/[id]/page.tsx`

2. **Remove rewards** ($OPEN program, ~40+ files)
   - DB tables: `reward_addresses`, `campaigns`, `claims`, `volume_snapshots` (write a removal migration)
   - Server: `packages/server/src/routes/rewards.ts`, admin campaign CRUD, volume aggregation
   - Dashboard: `components/rewards/*`, `facilitator-rewards-section.tsx`, `rewards-info-banner.tsx`, rewards tab, landing page rewards copy
   - SDK/skills: `skills/openfacilitator/references/sdk-api.md` rewards refs
   - Facilitator 2x multiplier logic
   - Env vars to retire: `REWARDS_WALLET_PRIVATE_KEY`, `OPEN_TOKEN_MINT`
   - Update `PROJECT.md` "Core value" — rewards is no longer the pitch
   - Keep: multi-chain wallet infra (subscriptions in v1.2 depends on it)

3. **Security audit with Claude**
   - Done after removals so audit isn't wasted on dead code
   - Use `/security-review` skill or `/gsd-secure-phase` retroactive flow

## v1.4 — Refresh & Reach (public pitch)

Growth milestone. This is the tweet copy:
> ui refresh, sunsetting some unused features, adding qol stuff like email notifications and support for more chains.

**Candidate phases:**

- UI refresh (scope TBD — design-system audit first?)
- Email notifications (deferred from v1.2; complement to existing in-app system)
- More chain support (TBD — Sui? Aptos? Tron? Bitcoin L2s? ask which)

## Notes

- Tweet announcing this went out 2026-05-12
- Recent firefighting commits (memo program, instruction allowlist, gas pricing, RPC fallback) suggest reliability is also a theme — could fold into v1.4 or its own slice
