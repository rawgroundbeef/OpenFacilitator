---
phase: 24
slug: security-audit-remediation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-17
revised: 2026-05-17
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> Source-of-truth for verification targets: `24-RESEARCH.md` §8 (Validation Architecture).

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x (server), Vitest 3.x (integration-tests) |
| **Config file** | `packages/integration-tests/vitest.config.ts` (custom timeouts + setup.ts); `packages/server` uses defaults |
| **Quick run command** | `pnpm --filter @openfacilitator/server test` |
| **Full suite command** | `pnpm --filter @openfacilitator/integration-tests test:all` |
| **Solana security suite** | `pnpm --filter @openfacilitator/integration-tests test:security` |
| **Workspace audit** | `pnpm audit --json` at repo root |
| **Estimated runtime** | Quick: ~10s; Full: ~60-120s |

---

## Sampling Rate

- **After every task commit:** Run quick command (`pnpm --filter @openfacilitator/server test`) when source files in `packages/server` changed; otherwise N/A (audit-doc-only commits skip).
- **After every plan wave:** Run full suite (`pnpm --filter @openfacilitator/integration-tests test:all`).
- **Before `/gsd-verify-work`:** Full suite must be green AND the Plan 1 row-count gates from RESEARCH.md §8 must pass.
- **Max feedback latency:** ~120 seconds.

---

## Per-Task Verification Map

Per-task verification contract for Plan 1 (the audit). Plan 2 (remediation) tasks will be appended here after Plan 1 ships.

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 24-01-T1 | 01 | 1 | SEC-01..SEC-05 | (scaffold) | Re-runnable audit tooling scaffold + audit-doc header with D-10 severity rubric exist on disk | shell | `test -d tools/security-audit/grep && test -x tools/security-audit/run-all.sh && grep -q "Severity Rubric" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md` | ✅ | ⬜ pending |
| 24-01-T2 | 01 | 1 | SEC-01 | T-24-02 | §SEC-01 enumerates the three confirmed admin.ts auth gaps + Better Auth hygiene findings | audit-doc | `grep -q "SEC-01-001" .../24-SECURITY-AUDIT.md && grep -q "admin.ts:1623\|1653\|1687"` and ≥3 SEC-01- rows | ✅ | ⬜ pending |
| 24-01-T3 | 01 | 1 | SEC-02 | T-24-01 | §SEC-02 has ≥93 DB-query enumeration rows anchored on `Fn \| File:Line` column shape | audit-doc | `awk '/^## §SEC-02/,/^## §SEC-03/' \| grep -cE '^\| [a-zA-Z][a-zA-Z0-9_]+ +\| [a-z0-9-]+\.ts:[0-9]+'` ≥ 93 | ✅ | ⬜ pending |
| 24-01-T4 | 01 | 1 | SEC-03 | T-24-03, T-24-05 | §SEC-03 has ≥5 findings (EVM signature recovery gap, NonceManager in-memory, two console-log leaks, ALT-rejection positive) AND new Solana truncated-data fuzz test exits 0 | test + audit-doc | `grep -q "should reject token instruction with truncated data" packages/integration-tests/src/solana-security.test.ts && pnpm --filter @openfacilitator/integration-tests test:security` | ✅ | ⬜ pending |
| 24-01-T5 | 01 | 1 | SEC-04, SEC-05 | T-24-04, T-24-06, T-24-07, T-24-08, T-24-09, T-24-10, T-24-11 | §SEC-04 ≥26 secrets-in-logs rows + ACCESS_TOKEN_SECRET fallback + Dependabot finding + encryption-at-rest positive note; §SEC-05 ≥124 handler enumeration rows (Method column anchor) + rate-limit absence + webhook-signature length-mismatch + zod gaps + CORS/CSP findings | audit-doc | `awk '/^## §SEC-04/,/^## §SEC-05/' \| grep -cE '^\| SEC-04-LOG-'` ≥ 26 AND `awk '/^## §SEC-05/,/^### Findings/' \| grep -cE '^\| [^\|]+ +\| [^\|]+ +\| (GET\|POST\|PUT\|PATCH\|DELETE) +\|'` ≥ 124 | ✅ | ⬜ pending |
| 24-01-T6 | 01 | 1 | (all SEC) | (all) | CONCERNS re-validation block contains exactly 11 numbered rows (column 1 = literal `1`..`11`) + Findings Count table populated with real numbers | audit-doc | `awk '/^## CONCERNS.md Re-validation/,/^## §SEC-01/' \| grep -cE '^\| [0-9]+ \|'` = 11 AND `awk '/^## Findings Count/,/^##/' \| grep -qE "^\| CRITICAL +\| [0-9]+ \|"` | ✅ | ⬜ pending |
| 24-01-T7 | 01 | 1 | SEC-04 | T-24-09 | `pnpm audit --json` output (or explicit `"placeholder": true` fallback) captured and committed for diffability | shell | `test -s tools/security-audit/outputs/pnpm-audit-2026-05-17.json && head -c 1 .../pnpm-audit-2026-05-17.json \| grep -q '{' && (grep -q '"advisories"\|"actions"\|"metadata"' OR grep -q '"placeholder": true')` | ✅ | ⬜ pending |
| 24-01-T8 | 01 | 1 | (D-03 drift) | (n/a) | REQUIREMENTS.md drift fixed atomically: SEC-05 Hono→Express AND SEC-01..SEC-06 traceability Phase 25→Phase 24 | drift-fix | `grep -c "Hono" .planning/REQUIREMENTS.md` = 0 AND `grep -c "Phase 25" .planning/REQUIREMENTS.md` = 0 AND `grep -c '\| SEC-0[1-6] \| Phase 24 \|' .planning/REQUIREMENTS.md` = 6 | ✅ | ⬜ pending |
| 24-01-T9 | 01 | 1 | (all SEC, D-13 atomicity) | (all) | All Plan 1 deliverables land in ONE atomic commit with `feat(24-01): audit security surface...` subject containing audit doc + tools/security-audit/ + REQUIREMENTS.md + solana-security.test.ts | commit | `git log -1 --pretty=%s \| grep -q 'feat(24-01): audit security surface' && git log -1 --name-only \| grep -q '24-SECURITY-AUDIT.md\|REQUIREMENTS.md\|tools/security-audit\|solana-security.test.ts'` (AND-conditional, all four file refs) | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

Note: This map is populated by the planner. Status flips to ✅/❌ during `/gsd-execute-phase 24` execution. Plan 2 (remediation) tasks will be appended after Plan 1 ships.

---

## Wave 0 Requirements

- [ ] `tools/security-audit/` directory scaffold (per RESEARCH.md §10)
- [ ] `tools/security-audit/grep/sec02-cross-tenant.sh` — re-runnable
- [ ] `tools/security-audit/grep/sec04-secrets-in-logs.sh` — re-runnable
- [ ] `tools/security-audit/grep/sec05-handlers-without-zod.sh` — re-runnable
- [ ] `tools/security-audit/grep/sec05-handlers-without-auth.sh` — re-runnable
- [ ] Decision on `semgrep` install vs documented absence (planner picks)

---

## Plan 1 Row-Count Gates (deterministic, mechanically verifiable)

These are the gates the gsd-plan-checker will mechanically verify against `24-SECURITY-AUDIT.md` once Plan 1 ships:

| Gate | Target | Verification Command |
|------|--------|----------------------|
| SEC-02 DB-query enumeration rows | ≥ 93 | `awk '/^## §SEC-02/,/^## §SEC-03/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md \| grep -cE '^\| [a-zA-Z][a-zA-Z0-9_]+ +\| [a-z0-9-]+\.ts:[0-9]+'` ≥ 93 |
| SEC-05 handler enumeration rows | ≥ 124 | `awk '/^## §SEC-05/,/^### Findings/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md \| grep -cE '^\| [^\|]+ +\| [^\|]+ +\| (GET\|POST\|PUT\|PATCH\|DELETE) +\|'` ≥ 124 |
| SEC-04 secrets-in-logs grep rows | ≥ 26 | `awk '/^## §SEC-04/,/^## §SEC-05/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md \| grep -cE '^\| SEC-04-LOG-'` ≥ 26 |
| CONCERNS.md re-validation rows | = 11 | `awk '/^## CONCERNS.md Re-validation/,/^## §SEC-01/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md \| grep -cE '^\| [0-9]+ \|'` = 11 |
| Solana fuzz tests pass | exit 0 | `pnpm --filter @openfacilitator/integration-tests test:security` |
| REQUIREMENTS.md drift fixed | grep clean | `grep "Hono" .planning/REQUIREMENTS.md` returns no matches; `grep "Phase 25" .planning/REQUIREMENTS.md` returns no matches |
| pnpm audit captured (real or placeholder) | content gate | `head -c 1 tools/security-audit/outputs/pnpm-audit-2026-05-17.json \| grep -q '{'` AND (`grep -q '"advisories"\|"actions"\|"metadata"'` OR `grep -q '"placeholder": true'`) |
| Plan 1 atomic commit | git log | `git log -1 --pretty=%s \| grep -q 'feat(24-01): audit security surface'` AND `git log -1 --name-only` includes all four of: `24-SECURITY-AUDIT.md`, `REQUIREMENTS.md`, `tools/security-audit`, `solana-security.test.ts` |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dependabot enablement at GitHub repo level | SEC-04 | Requires GitHub UI / repo settings access — not testable from code | Confirm `.github/dependabot.yml` exists OR a SECURITY-DECISIONS.md entry documents the gap |
| Severity assignment per finding | SEC-06 | Human judgement against D-10 rubric | Auditor signs off in `24-SECURITY-AUDIT.md` header block |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 120s
- [x] `nyquist_compliant: true` set in frontmatter (planner-populated per-task verification map landed 2026-05-17 revision)

**Approval:** pending execution
