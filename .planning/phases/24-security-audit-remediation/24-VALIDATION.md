---
phase: 24
slug: security-audit-remediation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-17
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

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| _Populated by gsd-planner during planning_ | — | — | — | — | — | — | — | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

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
| SEC-02 DB-query enumeration rows | ≥ 93 | row count in `24-SECURITY-AUDIT.md` §SEC-02 table |
| SEC-05 handler enumeration rows | ≥ 124 | row count in `24-SECURITY-AUDIT.md` §SEC-05 table |
| SEC-04 secrets-in-logs grep rows | ≥ 26 | row count in `24-SECURITY-AUDIT.md` §SEC-04 table |
| CONCERNS.md re-validation rows | = 11 | row count in `24-SECURITY-AUDIT.md` re-validation block |
| Solana fuzz tests pass | exit 0 | `pnpm --filter @openfacilitator/integration-tests test:security` |
| REQUIREMENTS.md drift fixed | grep clean | `grep "Hono" .planning/REQUIREMENTS.md` returns no matches; `grep "Phase 25" .planning/REQUIREMENTS.md` returns no matches |

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Dependabot enablement at GitHub repo level | SEC-04 | Requires GitHub UI / repo settings access — not testable from code | Confirm `.github/dependabot.yml` exists OR a SECURITY-DECISIONS.md entry documents the gap |
| Severity assignment per finding | SEC-06 | Human judgement against D-10 rubric | Auditor signs off in `24-SECURITY-AUDIT.md` header block |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 120s
- [ ] `nyquist_compliant: true` set in frontmatter once planner populates the per-task verification map

**Approval:** pending
