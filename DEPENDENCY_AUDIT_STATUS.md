# Dependency Audit Status

Date: 2026-05-27
Branch: `codex-dependency-audit`
Base: latest `main` after PR #26 merged (`8a335ea Remove hosted refund flows`)

## Current State

This branch contains the dependency/security audit cleanup for PR #27. It focuses on removing the unused dashboard wallet graph, tightening overrides, and making direct package checks work from a fresh checkout.

## Completed So Far

- Removed unused dashboard Solana wallet provider wiring.
- Removed unused `@solana/wallet-adapter-wallets`.
- Removed the dashboard `SolanaProvider` wrapper because the app was passing `wallets={[]}` and no wallet hooks/components were used.
- Removed the unused dashboard Wagmi/EVM provider wrapper and `wagmi` config.
- Removed unused dashboard dependencies: `wagmi`, direct `viem`, direct `@openfacilitator/core`, `bs58`, `canvas-confetti`, `@types/canvas-confetti`, and direct `zod`.
- Added an explicit dashboard dependency on `@openfacilitator/sdk` because the MDX docs import SDK examples, and updated `next.config.ts` to transpile the SDK instead of the removed core dependency.
- Added `.npmrc` with `auto-install-peers=false` so pnpm stops auto-installing large optional peers into production dependency trees.
- Updated direct dependencies:
  - `next` and `@next/mdx` to `15.5.18`
  - `better-auth` to `1.6.11`
  - `express` to `4.22.2`
  - `better-sqlite3` to `12.5.0`
  - `turbo` to `2.9.15`
  - `vitest` to `4.1.7`
  - `postcss` to `8.5.15`
  - `zod` to v4
  - `react-is` added explicitly for Recharts/React peers
  - `fastestsmallesttextencoderdecoder` added explicitly for Solana SPL Token peers
- Ran `pnpm install` after the `.npmrc` change to sync `node_modules` with the lockfile.
- Added root `pnpm.overrides` for conservative transitive patch fixes:
  - `bn.js@5.2.3`
  - `defu@6.1.7`
  - `path-to-regexp@0.1.13`
  - `picomatch@2.3.2` for v2 ranges
  - `picomatch@4.0.4` for v4 ranges
  - `postcss@8.5.15`
  - `qs@6.15.2`
  - `rollup@4.60.4`
  - `vite@8.0.14`
  - `ws@8.21.0` for the `@solana/rpc-subscriptions-channel-websocket`, `rpc-websockets`, and `viem` dependency paths
- Pruned stale override entries after removing the dashboard wallet graph.
- Fixed server Zod v4 compatibility issues in payment requirements and metadata schemas.
- Updated the core test script to pass when there are no test files.
- Updated the server test scripts to exclude ignored `dist/` output so stale build artifacts are not executed by Vitest.
- Updated direct server `build`, `lint`, and `test` scripts to build workspace dependencies first so they work in a fresh checkout without pre-existing `dist/` artifacts.
- Changed Better Auth initialization to use the configured database path lazily instead of opening the default database at module import time. Fresh checkout testing exposed this because auth sign-up could hit `./data/openfacilitator.db` while tests initialized `./data/test-openfacilitator.db`.

## Audit Progress

Initial production audit:

- low: 10
- moderate: 74
- high: 51
- critical: 1
- dependencies: 1528

After the completed cleanup/update pass:

- low: 3
- moderate: 42
- high: 20
- critical: 0
- dependencies: 954

After the override pass:

- low: 0
- moderate: 2
- high: 1
- critical: 0
- dependencies: 965

After removing the unused dashboard wallet graph:

- low: 0
- moderate: 1
- high: 1
- critical: 0
- dependencies: 635

Initial full audit:

- low: 11
- moderate: 77
- high: 52
- critical: 1
- dependencies: 1753

After the completed cleanup/update pass:

- low: 4
- moderate: 43
- high: 21
- critical: 0
- dependencies: 1118

After the override pass:

- low: 0
- moderate: 2
- high: 1
- critical: 0
- dependencies: 1131

After removing the unused dashboard wallet graph:

- low: 0
- moderate: 1
- high: 1
- critical: 0
- dependencies: 812

Latest temp audit files from this run:

- `/private/tmp/openfacilitator-audit-prod-after-wallet-cut.json`
- `/private/tmp/openfacilitator-audit-full-after-wallet-cut.json`

## Remaining Findings

Only two advisory families remain after overrides:

- `uuid`: audit wants `>=11.1.1`, but this is a major jump through Solana dependencies.
- `bigint-buffer`: audit reports no patched version. It comes through `@solana/spl-token` / `@solana/buffer-layout-utils`, so document as residual unless the Solana dependency path changes.

Current peer warning notes:

- The previous Wagmi/WalletConnect/Reown/MetaMask peer warnings are gone after removing the unused dashboard wallet graph.

## Verification

Passed:

- `pnpm --filter @openfacilitator/dashboard lint`
- `pnpm --filter @openfacilitator/server lint`
- `pnpm --filter @openfacilitator/sdk lint`
- `pnpm --filter @openfacilitator/core test`
- `pnpm --filter @openfacilitator/sdk test -- run`
- `pnpm --filter @openfacilitator/server test`
- `pnpm --filter @openfacilitator/dashboard build`

Fresh checkout verification:

- `pnpm install --frozen-lockfile` passed in `/private/tmp/openfacilitator-pr27-fresh-e3e3f6d`.
- Initial fresh server lint/test exposed missing `@openfacilitator/core`/`@openfacilitator/sdk` build artifacts; the server scripts now build those dependencies before running direct package checks.
- A later fresh server test exposed the Better Auth import-time database path issue; auth now initializes lazily through `initializeAuth()`/`getAuth()` so clean test databases include the expected Better Auth tables.
- Final clean clone verification passed in `/private/tmp/openfacilitator-pr27-fresh-ca81799`:
  - `pnpm install --frozen-lockfile`
  - `pnpm --filter @openfacilitator/dashboard lint`
  - `pnpm --filter @openfacilitator/sdk lint`
  - `pnpm --filter @openfacilitator/core test`
  - `pnpm --filter @openfacilitator/sdk test -- run`
  - `pnpm --filter @openfacilitator/server lint`
  - `pnpm --filter @openfacilitator/server test`
  - `pnpm --filter @openfacilitator/dashboard build`
- Fresh dashboard runtime smoke passed from `next start` on port 5101: `/`, `/docs`, and `/docs/api` all returned `200`.
- Fresh server runtime smoke passed from `node dist/index.js` on port 5102:
  - `/health` returned `200`.
  - `/api/verify?facilitator=pay` returned `200`.
  - `/stats/price` returned `200`.
  - `/free/supported` returned the expected unconfigured `503` with no facilitator wallet env.
  - With a dummy local `FREE_FACILITATOR_EVM_KEY`, `/free/supported` and `/free/info` returned `200`, and `/free/verify` returned a clean validation `400` for an intentionally empty payload.

Notes:

- `pnpm --filter @openfacilitator/server test` needs local listener/socket permission for Supertest in this sandbox.
- The first dashboard build attempt failed in the sandbox because `next/font` could not fetch Google Fonts; it passed when rerun with network access.

## Next Steps

1. Update PR #27 with the final verification results.
