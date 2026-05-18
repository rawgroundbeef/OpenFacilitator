#!/usr/bin/env bash
# Phase 24 audit driver — runs every SEC-NN grep gate and captures `pnpm audit --json`.
# Exit 0 if every gate runs; matches are informational, auditor interprets.
#
# Usage: bash tools/security-audit/run-all.sh (from repo root)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUTS_DIR="$SCRIPT_DIR/outputs"
DATE="$(date +%Y-%m-%d)"

echo "=============================================="
echo "  OpenFacilitator Phase 24 Security Audit"
echo "  Run date: $DATE"
echo "=============================================="
echo ""

# Best-effort semgrep install — grep patterns are the authoritative gate if unavailable
if ! command -v semgrep >/dev/null 2>&1; then
  echo "[INFO] semgrep not installed — attempting best-effort install..."
  brew install semgrep 2>/dev/null || pip install semgrep 2>/dev/null || \
    echo "[INFO] semgrep not installed — grep patterns are the authoritative gate per RESEARCH.md §7"
fi

echo ""
echo "[SEC-02] cross-tenant query check"
echo "-------------------------------------------------------"
bash "$SCRIPT_DIR/grep/sec02-cross-tenant.sh" || true
echo ""

echo "[SEC-04] secrets-in-console check"
echo "-------------------------------------------------------"
bash "$SCRIPT_DIR/grep/sec04-secrets-in-logs.sh" || true
echo ""

echo "[SEC-05] handlers without zod check"
echo "-------------------------------------------------------"
bash "$SCRIPT_DIR/grep/sec05-handlers-without-zod.sh" || true
echo ""

echo "[SEC-05] handlers without auth check"
echo "-------------------------------------------------------"
bash "$SCRIPT_DIR/grep/sec05-handlers-without-auth.sh" || true
echo ""

echo "[SEC-04] pnpm audit baseline capture"
echo "-------------------------------------------------------"
AUDIT_FILE="$OUTPUTS_DIR/pnpm-audit-${DATE}.json"
echo "Capturing: pnpm audit --json > $AUDIT_FILE"
# pnpm audit returns non-zero when advisories exist; || true keeps driver exit 0
pnpm audit --json > "$AUDIT_FILE" 2>/dev/null || true
echo "Captured: $AUDIT_FILE ($(wc -c < "$AUDIT_FILE") bytes)"
echo ""

if command -v semgrep >/dev/null 2>&1; then
  echo "[SEC-04] semgrep custom rules"
  echo "-------------------------------------------------------"
  semgrep --config "$SCRIPT_DIR/semgrep/openfacilitator.yaml" packages/ apps/ || true
  echo ""
fi

echo "=============================================="
echo "[done] Run audit doc review on:"
echo "  .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md"
echo "=============================================="
