#!/usr/bin/env bash
# SEC-02 cross-tenant query gate.
# Matches missing a WHERE ... facilitator_id (or tenant FK) clause are findings.
# Cross-tenant-by-design queries are intentional — auditor interprets.
#
# Usage: bash tools/security-audit/grep/sec02-cross-tenant.sh (from repo root)
set -euo pipefail

grep -nE "db\.prepare\(.*(SELECT|UPDATE|DELETE).*FROM (transactions|products|product_payments|webhooks|proxy_urls|resource_owners|registered_servers|claims|refund_wallets|refund_configs|facilitators)" packages/server/src/ --include="*.ts" -r || true

echo "Expected ~ many matches as of 2026-05-17 — auditor classifies in 24-SECURITY-AUDIT.md §SEC-02 enumeration table"
