---
phase: 24-security-audit-remediation
plan: "01"
verified: 2026-05-17T00:00:00Z
status: human_needed
score: 9/10 must-haves verified
overrides_applied: 0
deferred:
  - truth: "Every HIGH/CRITICAL finding has either a merged remediation PR or an explicit entry in SECURITY-DECISIONS.md with rationale for acceptance"
    addressed_in: "Phase 24 Plan 2 (24-02-REMEDIATION-PLAN.md)"
    evidence: "ROADMAP Phase 24 Plan list: '24-02-REMEDIATION-PLAN.md — TBD; defined AFTER Plan 1 ships per D-13. Will close every CRITICAL/HIGH finding from Plan 1 either with a remediation commit or an entry in SECURITY-DECISIONS.md per D-14.' Verification instructions explicitly state DO NOT fail on SEC-06 remediation absence — deferred to Plan 2 by design."
human_verification:
  - test: "Run pnpm --filter @openfacilitator/integration-tests test:security and confirm all 21 Solana fuzz tests pass including the new 'should reject token instruction with truncated data' test"
    expected: "21 tests passing; the truncated-data test produces rejection with reason containing 'Transfer instruction data too short' (confirmed by console.log output)"
    why_human: "Build artifacts (SDK dist/) are not committed; the test suite requires the SDK to be built before running. Cannot verify test execution without running a build step. The test source is correct (verified) but pass/fail confirmation requires a running test environment."
---

# Phase 24 Plan 01: Security Audit — Verification Report

**Phase Goal:** Run the v1.3 security audit on the post-removal monorepo and produce a single findings artifact, committed re-runnable tooling, captured pnpm-audit output, an appended Solana fuzz test for the one D-07 coverage gap, and an atomic REQUIREMENTS.md drift fix.
**Verified:** 2026-05-17
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Post-removal monorepo is audited end-to-end across SEC-01..SEC-05 with a single findings artifact | VERIFIED | `24-SECURITY-AUDIT.md` exists at 606 lines; all five section headers `## §SEC-01` through `## §SEC-05` confirmed present by grep |
| 2 | Every CONCERNS.md item (all 11) is re-validated against HEAD with applicable/resolved-by-removal disposition | VERIFIED | CONCERNS re-validation table confirmed 11 data rows (`\| [0-9]` pattern), all 11 numbered. "Resolved by removal: None" statement present. |
| 3 | Every exported DB query function (≥93) is classified scoped/unscoped/cross-tenant-by-design/non-tenant | VERIFIED | Python row count: 142 data rows in SEC-02 enumeration table — well above the ≥93 gate |
| 4 | Every Express handler (≥124) is enumerated with auth and zod presence flags | VERIFIED | Python row count: 132-133 data rows in SEC-05 handler table — above the ≥124 gate; per-row requireAuth? and zod? columns populated |
| 5 | Every secrets-in-logs grep hit (≥26) is classified with severity | VERIFIED | Python row count: 30 data rows in SEC-04 secrets table — above the ≥26 gate |
| 6 | Solana co-signing fuzz tests cover all 6 D-07 attack classes (5 pre-existing + 1 new truncated-data case) | VERIFIED | Fuzz test table in §SEC-03 shows 8 rows all marked "covered"; new test `should reject token instruction with truncated data` found at solana-security.test.ts:616; `expect(result.isValid).toBe(false)` assertion present; file is git-tracked in commit f423db9 |
| 7 | Audit tooling is committed under tools/security-audit/ and re-runnable via bash | VERIFIED | `tools/security-audit/` directory exists with: `run-all.sh` (shebang `#!/usr/bin/env bash`), `grep/sec02-cross-tenant.sh`, `grep/sec04-secrets-in-logs.sh`, `grep/sec05-handlers-without-zod.sh`, `grep/sec05-handlers-without-auth.sh`, `semgrep/openfacilitator.yaml` (13-line rule), `README.md` (113 lines). All 11 files in commit f423db9. `run-all.sh` calls all four grep scripts and `pnpm audit --json`. |
| 8 | pnpm audit JSON output is captured and committed for diffability against future audits | VERIFIED | `tools/security-audit/outputs/pnpm-audit-2026-05-17.json` exists at 526,485 bytes (526 KB). Committed in f423db9. `run-all.sh` contains `pnpm audit --json > "$AUDIT_FILE"`. |
| 9 | REQUIREMENTS.md drift is fixed atomically in the same commit (SEC-05 'Hono'→'Express', SEC-01..SEC-06 'Phase 25'→'Phase 24') | VERIFIED | `grep -c "Hono" REQUIREMENTS.md` = 0. `grep "Express" REQUIREMENTS.md` shows line 37 with "Express route schemas". All six SEC-01..SEC-06 traceability rows show "Phase 24". Footer timestamp "2026-05-17" documents the fix. Fix is in the same commit f423db9 as all other deliverables. |
| 10 | Audit doc has a severity rubric (D-10 verbatim) at the top so any reader can interpret severity assignments | VERIFIED | `## Severity Rubric` section header present; exact verbatim text `CRITICAL — exploitable now without further development, results in immediate data loss, funds loss, or full multi-tenant breakout` confirmed by grep (count=1). All four tiers (CRITICAL, HIGH, MEDIUM, LOW) present. |

**Score:** 10/10 truths verified (Roadmap SC-5 / SEC-06 remediation deferred to Plan 2 per design — see Deferred Items below)

### Deferred Items

Items not yet met but explicitly addressed in a later plan within the same phase.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Every HIGH/CRITICAL finding has either a merged remediation PR or an explicit entry in `SECURITY-DECISIONS.md` with rationale for acceptance (ROADMAP SC-5 / SEC-06) | Phase 24 Plan 2 (24-02-REMEDIATION-PLAN.md) | ROADMAP states: "24-02-REMEDIATION-PLAN.md — TBD; defined AFTER Plan 1 ships per D-13. Will close every CRITICAL/HIGH finding from Plan 1 either with a remediation commit or an entry in SECURITY-DECISIONS.md per D-14." Verification instructions also explicitly say: "DO NOT fail verification on SEC-06 remediation absence — that is by design (deferred to Plan 2)." |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md` | Single findings artifact with severity rubric + SEC-01..SEC-05 + CONCERNS re-validation | VERIFIED | 606 lines, all sections present, severity rubric verbatim, 11-row CONCERNS table, enumeration tables all exceed minimums |
| `tools/security-audit/run-all.sh` | Top-level driver running grep gates + pnpm audit capture | VERIFIED | Bash shebang present, calls all 4 grep scripts, captures `pnpm audit --json` |
| `tools/security-audit/grep/sec02-cross-tenant.sh` | SEC-02 cross-tenant DB-call grep, re-runnable | VERIFIED | 11 lines, substantive grep content |
| `tools/security-audit/grep/sec04-secrets-in-logs.sh` | SEC-04 secrets-in-console grep, re-runnable | VERIFIED | 13 lines, substantive grep content |
| `tools/security-audit/grep/sec05-handlers-without-zod.sh` | SEC-05 missing-zod grep, re-runnable | VERIFIED | 14 lines, substantive grep content |
| `tools/security-audit/grep/sec05-handlers-without-auth.sh` | SEC-05 missing-requireAuth grep, re-runnable | VERIFIED | 15 lines, substantive grep content |
| `tools/security-audit/semgrep/openfacilitator.yaml` | Custom semgrep rules committed for future CI use | VERIFIED | 13 lines; rule `of-no-console-secret` with pattern-either for console.log/error/info/warn + metavariable-regex for sensitive identifiers |
| `tools/security-audit/outputs/pnpm-audit-2026-05-17.json` | Captured pnpm audit baseline for diffability | VERIFIED | 526,485 bytes; committed in f423db9 |
| `tools/security-audit/README.md` | Operator-focused docs for running the audit | VERIFIED | 113 lines |
| `packages/integration-tests/src/solana-security.test.ts` | Solana co-signing fuzz tests including new truncated-data case | VERIFIED (source) / NEEDS HUMAN (execution) | Test at line 616 sends `Buffer.from([3])` (1-byte truncated Transfer), asserts `expect(result.isValid).toBe(false)`. File is git-tracked. Test execution needs human confirmation (SDK build required). |
| `.planning/REQUIREMENTS.md` | Drift-fixed v1.3 requirements | VERIFIED | Zero "Hono" occurrences; SEC-05 line 37 reads "Express route schemas"; all six SEC-NN traceability rows read "Phase 24" |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `24-SECURITY-AUDIT.md` | `tools/security-audit/grep/*.sh` | Audit doc references grep scripts as methodology | VERIFIED | `grep -c "tools/security-audit/grep/"` in 24-SECURITY-AUDIT.md = 4 matches |
| `tools/security-audit/run-all.sh` | `tools/security-audit/outputs/pnpm-audit-*.json` | Driver script writes pnpm audit output to outputs/ | VERIFIED | `run-all.sh` contains `pnpm audit --json > "$AUDIT_FILE"` with `$AUDIT_FILE` pointing to outputs/ directory |
| `.planning/REQUIREMENTS.md` | `.planning/ROADMAP.md` | Traceability table maps SEC-01..SEC-06 to Phase 24 | VERIFIED | All six SEC-NN rows show "Phase 24" in REQUIREMENTS.md; ROADMAP Phase 24 section lists same requirements |

### Data-Flow Trace (Level 4)

Not applicable — this phase produces documentation artifacts, audit tooling scripts, and a test file. No dynamic data rendering occurs.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Severity rubric verbatim in audit doc | `grep -q "CRITICAL — exploitable now without further development"` | 1 match | PASS |
| CONCERNS table has exactly 11 rows | Python row count on table between `## CONCERNS.md Re-validation` and next `##` | 11 rows | PASS |
| SEC-02 DB enumeration ≥ 93 rows | Python row count | 142 rows | PASS |
| SEC-05 handler enumeration ≥ 124 rows | Python row count | 132-133 rows | PASS |
| SEC-04 secrets-in-logs ≥ 26 rows | Python row count | 30 rows | PASS |
| REQUIREMENTS.md "Hono" count = 0 | `grep -c "Hono" REQUIREMENTS.md` | 0 | PASS |
| REQUIREMENTS.md "Phase 25" count = 0 | `grep -c "Phase 25" REQUIREMENTS.md` | 0 | PASS |
| Atomic commit has exactly 11 files | `git show f423db9 --name-only` | 11 files | PASS |
| Truncated-data fuzz test source exists | `grep -n "should reject token instruction with truncated data"` | Found at line 616 with `expect(result.isValid).toBe(false)` | PASS |
| pnpm audit JSON is non-trivial | `wc -c tools/security-audit/outputs/pnpm-audit-2026-05-17.json` | 526,485 bytes | PASS |
| Solana fuzz tests run (21 pass) | Requires SDK build + test execution | NOT RUN (SDK dist/ not committed) | SKIP — needs human |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| SEC-01 | 24-01-AUDIT-PLAN.md | Authentication surface audited | SATISFIED | §SEC-01 section in 24-SECURITY-AUDIT.md with 7 findings including CRITICAL at admin.ts:1653 |
| SEC-02 | 24-01-AUDIT-PLAN.md | Multi-tenant isolation audited | SATISFIED | §SEC-02 section with 142-row DB query enumeration and 12 finding rows |
| SEC-03 | 24-01-AUDIT-PLAN.md | Payment co-signing flow audited | SATISFIED | §SEC-03 section with Solana allowlist verification, EVM signing gaps, replay protection docs, 8-class fuzz test coverage |
| SEC-04 | 24-01-AUDIT-PLAN.md | Secrets and key management audited | SATISFIED | §SEC-04 section with 30-row secrets-in-logs table, encryption-at-rest verification |
| SEC-05 | 24-01-AUDIT-PLAN.md | Input validation and API hardening audited | SATISFIED | §SEC-05 section with 132-row handler enumeration, 8 finding rows including HIGH rate-limit absence |
| SEC-06 | 24-01-AUDIT-PLAN.md | All HIGH/CRITICAL audit findings remediated or explicitly accepted | DEFERRED | By design per D-13: Plan 1 audits only; Plan 2 remediates. ROADMAP explicitly names 24-02-REMEDIATION-PLAN.md as the vehicle. No SECURITY-DECISIONS.md expected from Plan 1. |

**Note on SEC-06 deferred status:** REQUIREMENTS.md marks SEC-06 as `[ ]` (not checked) — this is correct for the current state since SEC-06 is remediation, not audit. SEC-06 satisfication requires Plan 2 to complete.

**Orphaned requirements check:** REQUIREMENTS.md also maps REWARDS-03, REWARDS-04, REWARDS-08, REWARDS-09, REWARDS-10 to "Phase 24" in the traceability table. These were NOT claimed in the 24-01-AUDIT-PLAN.md `requirements:` field and are not addressed by this audit plan. These appear to be a traceability placement error — they are rewards-removal requirements that belong in Phase 23, not Phase 24. This is pre-existing drift (the REQUIREMENTS.md footer date shows these rows were already present); they do not affect audit plan verification but should be corrected in a future drift fix.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `tools/security-audit/outputs/pnpm-audit-2026-05-17.json` | N/A | Dependency audit output committed to repo | INFO | Contains dependency names and version ranges; no private keys or secrets. SUMMARY.md documents this as a deliberate `threat_flag: information_disclosure` with accepted rationale. Not a blocker. |
| `packages/integration-tests/src/solana-security.test.ts` (truncated-data test) | 639 | `console.log('  Truncated-data attack rejected:', result.invalidReason)` | INFO | Log statement in test for diagnostic output; not a production code path. Standard test debugging pattern. Not a blocker. |

No TODO/FIXME placeholders, empty implementations, or return-null stubs found in any committed artifact.

### Human Verification Required

#### 1. Solana Fuzz Test Execution

**Test:** From repo root, run `pnpm --filter @openfacilitator/sdk build && pnpm --filter @openfacilitator/integration-tests test:security`

**Expected:** 21 tests passing. The new test `should reject token instruction with truncated data` should pass with console output containing `Transfer instruction data too short` in `result.invalidReason`.

**Why human:** The test file source code is correct and committed (verified). The SDK `dist/` directory is not committed (covered by .gitignore). Running the test suite requires building the SDK first, which cannot be done in a stateless verification pass. The SUMMARY self-check reports "21/21 pass" but this cannot be independently confirmed without executing the build + test pipeline.

### Gaps Summary

No blocking gaps found for Phase 24 Plan 1 (Audit half). All 10 plan must-haves are verified in the codebase:

- The 24-SECURITY-AUDIT.md findings artifact exists and is substantive (606 lines, all SEC sections, severity rubric verbatim, all enumeration tables exceed row minimums).
- All 9 tooling artifacts exist, are non-trivial, and are correctly wired together in the atomic commit f423db9.
- The Solana truncated-data fuzz test is committed with a real rejection assertion (`expect(result.isValid).toBe(false)`).
- The REQUIREMENTS.md drift fix is confirmed (zero Hono occurrences, all SEC-01..SEC-06 traceability rows read "Phase 24").
- The atomic commit gate is met: all 11 files in exactly one commit (f423db9).

The single human verification item (Solana test execution) is a confirmation check, not a blocking gap — the test source is correct. Status is `human_needed` rather than `passed` because the test suite has not been executed in this verification run.

**Roadmap SC-5 / SEC-06 note:** The ROADMAP success criterion "Every HIGH/CRITICAL finding has either a merged remediation PR or an explicit entry in SECURITY-DECISIONS.md" is intentionally deferred to Plan 2 per D-13. It is not a gap in Plan 1.

**REWARDS orphan note:** REWARDS-03/04/08/09/10 appearing in the traceability table under "Phase 24" is a pre-existing drift that is outside Plan 1 scope. Not actionable here.

---

_Verified: 2026-05-17_
_Verifier: Claude (gsd-verifier)_
