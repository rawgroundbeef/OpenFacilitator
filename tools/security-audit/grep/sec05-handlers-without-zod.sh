#!/usr/bin/env bash
# SEC-05 missing-zod gate.
# Prints req.body/query/params usage and zod-parse usage separately — auditor correlates.
# Known gaps per RESEARCH.md §2: internal-webhooks.ts:159, admin.ts:1653.
#
# Usage: bash tools/security-audit/grep/sec05-handlers-without-zod.sh (from repo root)
set -euo pipefail

echo "--- req.body/query/params usage ---"
grep -nE "req\.(body|query|params)" packages/server/src/routes/*.ts || true

echo ""
echo "--- zod parse usage ---"
grep -nE "safeParse|\.parse\(|z\.object" packages/server/src/routes/*.ts || true
