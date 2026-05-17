# Phase 24: Security Audit & Remediation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-17
**Phase:** 24-security-audit-remediation
**Areas discussed:** Audit Input Set + Scope, Methodology / Tooling, Findings Artifact + Severity Rubric, Plan Structure + Remediation Triggers

---

## Audit Input Set + Scope

### How to treat the 11 pre-existing CONCERNS.md items

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-promote, re-validate post-removal | Each CONCERNS.md item becomes a starting finding; audit validates it still applies after Phase 22/23. Stale items get marked "resolved by removal". | ✓ |
| Audit fresh, use CONCERNS.md only as reference | Run SEC-01..05 cold, cross-check against CONCERNS.md at end. More work, avoids confirmation bias. | |
| Auto-promote without re-validation | All 11 items become P24 findings as-is. | |

**User's choice:** Auto-promote, re-validate post-removal.
**Notes:** Keeps the prior analysis investment; stale items will get a "resolved by removal" marker with deleting commit hash (D-02).

### Audit scope boundary across the monorepo

| Option | Description | Selected |
|--------|-------------|----------|
| Server + dashboard + core | Server (HTTP, multi-tenancy, payments) + dashboard (auth, cookies) + core (signing). Excludes sdk + examples. | |
| Server only | packages/server exclusively. Tightest scope. | |
| Everything (server + dashboard + core + sdk + examples) | Full monorepo. SDK consumer-trust matters even though attack surface is small. | ✓ |
| Server + core only | All signing + payment + multi-tenant; defer dashboard. | |

**User's choice:** Everything (full monorepo).
**Notes:** Phases 22/23 specifically shrank the surface so this audit could be exhaustive without being unmanageable (D-01).

### REQUIREMENTS.md drift fix in this phase's commit

| Option | Description | Selected |
|--------|-------------|----------|
| Fix both in this phase | SEC-05 "Hono" → "Express" + traceability table "Phase 25" → "Phase 24". Same commit. | ✓ |
| Fix traceability only | Defer the Hono wording fix. | |
| Defer both to a docs cleanup phase | Don't touch REQUIREMENTS.md. | |

**User's choice:** Fix both in this phase.
**Notes:** Matches Phase 23 D-04 drift-fix-in-same-commit pattern (D-03).

---

## Methodology / Tooling

### Automated tooling alongside manual review (multi-select)

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm audit | CVEs in dependencies. Cheap, zero-config. | ✓ |
| GitHub Advisory / Dependabot check | Verify Dependabot enabled, check Security tab. | ✓ |
| semgrep / SAST scan | Default JS/TS rulesets + custom rules. | ✓ |
| Manual review only | Skip all automated tooling. | |

**User's choice:** All three tools alongside manual review (D-04).
**Notes:** Manual catches business-logic issues (multi-tenant scoping); automated catches CVEs and pattern issues cheaply.

### Codify per-SEC-NN grep patterns?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — codify per-SEC-NN grep patterns | Committed alongside the audit doc, re-runnable in future audits / CI. | ✓ |
| Yes but ad-hoc, don't commit | Lighter doc footprint; loses repeatability. | |
| No — manual review is enough | Skip pattern checks. | |

**User's choice:** Codify and commit (D-05).
**Notes:** Patterns live under tools/security-audit/ (or planner-chosen location); designed to be wireable into a future CI step (CI wiring itself is deferred — see Deferred Ideas in CONTEXT.md).

### SEC-02 (multi-tenant isolation) audit approach

| Option | Description | Selected |
|--------|-------------|----------|
| Enumerate every DB query, classify | Table: function name / table / WHERE / requires facilitator_id yes-no-by-design. | ✓ |
| Spot-check highest-risk modules | transactions, subscriptions, user-wallets, products, claims. Faster but less defensible. | |
| Trace every route handler back to its DB calls | Call-graph approach. Attacker-model proximate but hard to make exhaustive. | |

**User's choice:** Enumerate every DB query.
**Notes:** Produces defensible audit trail; D-06 specifies the table columns and that any "no" with no notes is a HIGH finding.

### SEC-03 (Solana co-signing) audit depth

| Option | Description | Selected |
|--------|-------------|----------|
| Allowlist completeness + replay protection | Verify instruction allowlist + nonce / recent-blockhash window. | |
| Plus: fuzz test malicious instructions | Above + tests that try to slip non-allowlisted instructions through co-signing. | ✓ |
| Light scan only | Read the co-signing code, eyeball gaps. | |

**User's choice:** Allowlist + replay + fuzz tests.
**Notes:** D-07 lists the malicious instruction classes to test (transfer to attacker, drain fees, setAuthority, closeAccount, arbitrary program invocation, oversized instruction sets).

---

## Findings Artifact + Severity Rubric

### Where audit findings live

| Option | Description | Selected |
|--------|-------------|----------|
| Single 24-SECURITY-AUDIT.md | One file with sections per SEC-NN. | ✓ |
| Per-SEC-NN files | 5 separate audit files plus an index. | |
| Inline in 24-VERIFICATION.md | Smallest footprint, doesn't fit audit-trail purpose. | |

**User's choice:** Single 24-SECURITY-AUDIT.md.
**Notes:** Matches Phase 22/23 single-artifact pattern; easier holistic review (D-09).

### Severity scheme

| Option | Description | Selected |
|--------|-------------|----------|
| Custom CRITICAL / HIGH / MEDIUM / LOW | Definitions at top of audit doc; matches success criteria #5 wording. | ✓ |
| CVSS v3.1 + 4 buckets | More defensible externally, adds scoring overhead. | |
| OWASP Top 10 categorization | Useful framing but doesn't answer fix-or-accept. | |

**User's choice:** Custom 4-tier.
**Notes:** D-10 documents the rubric verbatim. Auditor may add OWASP tag in description but it's not required.

### SECURITY-DECISIONS.md acceptance log entry format

| Option | Description | Selected |
|--------|-------------|----------|
| Structured: ID / severity / title / accepted-by / date / rationale / compensating-control | Forces explicit rationale, captures compensating control. | ✓ |
| Free-form prose | Easier to write, harder to audit. | |
| Bullet list of (finding_id → rationale) | Minimal. Loses date, accepted-by, compensating control. | |

**User's choice:** Structured headings.
**Notes:** D-12 adds a "Revisit trigger" field (event or version that should re-open the acceptance) on top of the standard structure.

### Where SECURITY-DECISIONS.md lives

| Option | Description | Selected |
|--------|-------------|----------|
| Repo root: SECURITY-DECISIONS.md | Visible, pairs with SECURITY.md convention, survives milestone archival. | ✓ |
| .planning/SECURITY-DECISIONS.md | Survives archival, less visible to drive-by readers. | |
| .planning/phases/24-.../24-SECURITY-DECISIONS.md | Risk: archived with v1.3, future audits can't append. | |

**User's choice:** Repo root.
**Notes:** D-11.

---

## Plan Structure + Remediation Triggers

### Plan split for Phase 24

| Option | Description | Selected |
|--------|-------------|----------|
| Two plans: 24-01-AUDIT → 24-02-REMEDIATION | Plan 2 defined after Plan 1 ships. Breaks chicken-and-egg of planning remediation before findings exist. | ✓ |
| Six plans (one per SEC-NN + one remediation) | Most granular, allows parallel audit work. More plan ceremony. | |
| One atomic plan | Phase 22/23 pattern; risk: planner must guess remediation scope before audit runs. | |
| Three plans: audit / remediation / re-audit | Most thorough, longest critical path. Re-audit could fold into VERIFICATION.md. | |

**User's choice:** Two plans.
**Notes:** D-13 specifies Plan 1 deliverables and that Plan 2 is defined only AFTER Plan 1 completes (no preemptive scaffolding of an empty 24-02-REMEDIATION-PLAN.md).

### Fix-or-accept threshold

| Option | Description | Selected |
|--------|-------------|----------|
| All CRITICAL+HIGH fixed; MEDIUM/LOW logged | Default = fix; acceptance is escape hatch with compensating control. | ✓ |
| All CRITICAL fixed; HIGH judged case-by-case | Stricter top-end. | |
| Time-box remediation; rest become acceptances | Ships faster, milestone quality drops if many findings. | |
| Fix everything (no acceptances) | Contradicts success criteria #5. | |

**User's choice:** CRITICAL+HIGH fixed by default; MEDIUM/LOW logged.
**Notes:** D-14 carves out the escape hatch (CRITICAL acceptance only if platform shift; HIGH acceptance allowed with rationale + compensating control).

### New-code remediation (rate limit middleware, etc.)

| Option | Description | Selected |
|--------|-------------|----------|
| In-scope if standard hardening | express-rate-limit, debug-endpoint removal, cookie flag tightening, sensitive-data-logging removal. | ✓ |
| In-scope only if mapped to HIGH/CRITICAL | Tighter scope, matches success-criteria literalism. | |
| Out of scope — hardening goes to a new phase | Misses the "remediation" half of the phase name. | |

**User's choice:** In-scope if standard hardening.
**Notes:** D-15 lists the concrete in-scope hardenings.

### Wider architectural problems discovered during remediation

| Option | Description | Selected |
|--------|-------------|----------|
| Plan 2 fixes finding directly; deeper rearchitecture deferred | Per-query fixes ship; middleware refactor deferred via SECURITY-DECISIONS.md compensating-control entries. | ✓ |
| Plan 2 always does the architecturally-correct fix | Risk: scope creep, milestone slip. | |
| User decides per-finding mid-execution | Highest control, slowest velocity. | |

**User's choice:** Plan 2 fixes directly; rearchitecture deferred.
**Notes:** D-16 makes the deferral explicit — Revisit trigger noted in the SECURITY-DECISIONS.md entry (e.g., "v1.4 planning").

---

## Claude's Discretion

- Exact file location for committed grep / semgrep patterns (tools/, scripts/, or .planning/security-audit-patterns/).
- Whether Plan 1 lands as one commit or multiple per-SEC-NN commits.
- Whether `pnpm audit` output is committed verbatim or captured into the findings table.
- Whether NonceManager unit tests are added during Plan 24-02 remediation (CONCERNS.md flagged the gap; Claude decides if it falls out naturally).
- Plan 24-02 may include a `SECURITY.md` (disclosure policy) as a nice-to-have, but it's not a finding and can slide to a future phase.

## Deferred Ideas

- CI integration of committed audit patterns (run grep / semgrep on every PR) — future v1.4 phase or dedicated CI hardening phase.
- `SECURITY.md` at repo root (disclosure policy) — Plan 24-02 nice-to-have or future phase.
- Middleware-level multi-tenant enforcement — deferred via SECURITY-DECISIONS.md compensating-control entries if SEC-02 audit reveals a pattern.
- Postgres migration for distributed nonce locking — CONCERNS.md flagged; v1.4+ platform shift.
- Webhook delivery retry / async tx confirmation monitoring / audit logging — reliability and forensics gaps, not security exploits; out of scope for a security phase unless audit promotes them to security findings.
- NonceManager unit tests — Claude's-discretion as noted above.
