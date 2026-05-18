#!/usr/bin/env bash
# SEC-04 secrets-in-console gate.
# Expected: 26 matches as of 2026-05-17 (RESEARCH.md §5).
# Drift detection: a count <26 means a fix landed elsewhere; >26 means new logging was added.
#
# Usage: bash tools/security-audit/grep/sec04-secrets-in-logs.sh (from repo root)
set -euo pipefail

PATTERN='console\.(log|error|info|warn).*(privateKey|secretKey|signingKey|authorization|signature|ENCRYPTION_KEY|BETTER_AUTH_SECRET|ACCESS_TOKEN_SECRET)'

grep -rEn "$PATTERN" packages/ apps/ --include='*.ts' --include='*.tsx' || true

echo "[SEC-04] match count: $(grep -rEn "$PATTERN" packages/ apps/ --include='*.ts' --include='*.tsx' 2>/dev/null | wc -l | tr -d ' ') (expected ≥ 26 as of 2026-05-17)"
