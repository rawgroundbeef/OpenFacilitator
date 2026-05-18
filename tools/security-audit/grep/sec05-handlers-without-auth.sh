#!/usr/bin/env bash
# SEC-05 missing-requireAuth gate.
# Caveat: false positives when auth is applied via router.use(requireAuth).
# Known offenders per RESEARCH.md §3: admin.ts:1623 (GET /facilitators/:id/raw),
# admin.ts:1653 (PATCH /facilitators/:id/domains).
#
# Usage: bash tools/security-audit/grep/sec05-handlers-without-auth.sh (from repo root)
set -euo pipefail

grep -nE "router\.(get|post|put|patch|delete)\(" packages/server/src/routes/*.ts \
  | grep -vE "requireAuth|requireFacilitator|optionalAuth" || true

echo ""
echo "--- router.use lines (cross-reference for blanket auth application) ---"
grep -nE "router\.use\(" packages/server/src/routes/*.ts || true
