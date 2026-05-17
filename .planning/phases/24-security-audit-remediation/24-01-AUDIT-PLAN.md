---
phase: 24-security-audit-remediation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md
  - tools/security-audit/README.md
  - tools/security-audit/run-all.sh
  - tools/security-audit/grep/sec02-cross-tenant.sh
  - tools/security-audit/grep/sec04-secrets-in-logs.sh
  - tools/security-audit/grep/sec05-handlers-without-zod.sh
  - tools/security-audit/grep/sec05-handlers-without-auth.sh
  - tools/security-audit/semgrep/openfacilitator.yaml
  - tools/security-audit/outputs/pnpm-audit-2026-05-17.json
  - packages/integration-tests/src/solana-security.test.ts
  - .planning/REQUIREMENTS.md
autonomous: true
requirements:
  - SEC-01
  - SEC-02
  - SEC-03
  - SEC-04
  - SEC-05
  - SEC-06
tags:
  - security
  - audit
  - express
  - solana
  - evm
  - multi-tenant

must_haves:
  truths:
    - "The post-removal monorepo is audited end-to-end across SEC-01 through SEC-05 with a single findings artifact"
    - "Every CONCERNS.md item (all 11) is re-validated against HEAD with applicable / resolved-by-removal disposition"
    - "Every exported DB query function (≥93) is classified scoped / unscoped / cross-tenant-by-design / non-tenant"
    - "Every Express handler (≥124) is enumerated with auth and zod presence flags"
    - "Every secrets-in-logs grep hit (≥26) is classified with severity"
    - "Solana co-signing fuzz tests cover all 6 D-07 attack classes (5 pre-existing + 1 new truncated-data case)"
    - "Audit tooling is committed under tools/security-audit/ and re-runnable via bash"
    - "pnpm audit JSON output is captured and committed for diffability against future audits"
    - "REQUIREMENTS.md drift is fixed atomically in the same commit (SEC-05 'Hono'→'Express', SEC-01..SEC-06 'Phase 25'→'Phase 24')"
    - "The audit doc has a severity rubric (D-10 verbatim) at the top so any reader can interpret severity assignments"
  artifacts:
    - path: ".planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md"
      provides: "Single findings artifact per D-09: severity rubric + sections SEC-01..SEC-05 + CONCERNS re-validation block"
      contains: "## Severity Rubric"
      min_lines: 400
    - path: "tools/security-audit/run-all.sh"
      provides: "Top-level driver running grep gates + pnpm audit capture"
      contains: "#!/usr/bin/env bash"
    - path: "tools/security-audit/grep/sec02-cross-tenant.sh"
      provides: "SEC-02 cross-tenant DB-call grep, re-runnable"
    - path: "tools/security-audit/grep/sec04-secrets-in-logs.sh"
      provides: "SEC-04 secrets-in-console grep, re-runnable"
    - path: "tools/security-audit/grep/sec05-handlers-without-zod.sh"
      provides: "SEC-05 missing-zod grep, re-runnable"
    - path: "tools/security-audit/grep/sec05-handlers-without-auth.sh"
      provides: "SEC-05 missing-requireAuth grep, re-runnable"
    - path: "tools/security-audit/semgrep/openfacilitator.yaml"
      provides: "Custom semgrep rules committed for future CI use"
    - path: "tools/security-audit/outputs/pnpm-audit-2026-05-17.json"
      provides: "Captured pnpm audit baseline for diffability"
    - path: "tools/security-audit/README.md"
      provides: "Operator-focused docs for running the audit"
    - path: "packages/integration-tests/src/solana-security.test.ts"
      provides: "Solana co-signing fuzz tests including new truncated-data case"
      contains: "should reject token instruction with truncated data"
    - path: ".planning/REQUIREMENTS.md"
      provides: "Drift-fixed v1.3 requirements"
  key_links:
    - from: ".planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md"
      to: "tools/security-audit/grep/*.sh"
      via: "audit doc references the committed grep scripts as methodology"
      pattern: "tools/security-audit/grep/"
    - from: "tools/security-audit/run-all.sh"
      to: "tools/security-audit/outputs/pnpm-audit-*.json"
      via: "driver script writes pnpm audit output to outputs/"
      pattern: "pnpm audit --json"
    - from: ".planning/REQUIREMENTS.md"
      to: ".planning/ROADMAP.md"
      via: "Traceability table now maps SEC-01..SEC-06 to Phase 24 (matches ROADMAP §Phase 24)"
      pattern: "Phase 24"
---

<objective>
Run the v1.3 security audit on the post-removal monorepo and produce a single findings artifact, committed re-runnable tooling, captured pnpm-audit output, an appended Solana fuzz test for the one D-07 coverage gap, and an atomic REQUIREMENTS.md drift fix — all in one commit.

Purpose: This is the **audit half** of Phase 24 (per D-13). Plan 2 (remediation) is defined AFTER this plan ships. Plan 1 does NOT remediate findings — it enumerates them.

Output: 11 new/modified files in one atomic commit covering SEC-01..SEC-05 enumeration deliverables plus SEC-06 finding inventory (SEC-06's fix-or-accept is Plan 2 territory).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/phases/24-security-audit-remediation/24-CONTEXT.md
@.planning/phases/24-security-audit-remediation/24-RESEARCH.md
@.planning/phases/24-security-audit-remediation/24-PATTERNS.md
@.planning/phases/24-security-audit-remediation/24-VALIDATION.md
@.planning/codebase/CONCERNS.md
@.planning/codebase/STACK.md
@.planning/codebase/ARCHITECTURE.md
@.planning/codebase/CONVENTIONS.md

<source_files_for_audit>
The audit reads — but does NOT modify — these source files. They are the audit subject:

SEC-01 (Auth):
- packages/server/src/auth/config.ts
- packages/server/src/auth/index.ts
- packages/server/src/middleware/auth.ts
- packages/server/src/server.ts (route mounts + CORS/helmet config)
- packages/server/src/routes/admin.ts (lines 1623, 1653, 1687 specifically)

SEC-02 (Multi-tenant):
- packages/server/src/middleware/tenant.ts
- packages/server/src/db/facilitators.ts
- packages/server/src/db/transactions.ts
- packages/server/src/db/products.ts
- packages/server/src/db/webhooks.ts
- packages/server/src/db/proxy-urls.ts
- packages/server/src/db/resource-owners.ts
- packages/server/src/db/refund-configs.ts
- packages/server/src/db/refund-wallets.ts
- packages/server/src/db/registered-servers.ts
- packages/server/src/db/claims.ts
- packages/server/src/db/subscriptions.ts
- packages/server/src/db/subscription-payments.ts
- packages/server/src/db/user-wallets.ts
- packages/server/src/db/user-preferences.ts
- packages/server/src/db/notifications.ts
- packages/server/src/db/pending-facilitators.ts

SEC-03 (Co-signing):
- packages/core/src/solana.ts
- packages/core/src/solana-validation.ts
- packages/core/src/erc3009.ts
- packages/core/src/facilitator.ts (lines 316-369 specifically — EVM verify path)

SEC-04 (Secrets):
- packages/server/src/utils/crypto.ts
- packages/server/.env.example
- apps/dashboard/.env.example
- packages/server/src/routes/facilitator.ts (lines 27-28 — ACCESS_TOKEN_SECRET fallback)
- output of: grep -rEn 'console\.(log|error|info|warn).*(privateKey|secretKey|signingKey|authorization|signature|ENCRYPTION_KEY|BETTER_AUTH_SECRET|ACCESS_TOKEN_SECRET)' packages/ apps/ --include='*.ts' --include='*.tsx'

SEC-05 (Input validation / hardening):
- packages/server/src/routes/admin.ts
- packages/server/src/routes/facilitator.ts
- packages/server/src/routes/public.ts
- packages/server/src/routes/subscriptions.ts
- packages/server/src/routes/notifications.ts
- packages/server/src/routes/stats.ts
- packages/server/src/routes/discovery.ts
- packages/server/src/routes/internal-webhooks.ts
- packages/server/src/services/webhook.ts
- packages/server/package.json (rate-limit dependency check)

CONCERNS re-validation:
- .planning/codebase/CONCERNS.md (all 11 items)
</source_files_for_audit>

<interfaces>
Key facts from RESEARCH.md that the executor must use directly — no codebase re-exploration needed:

DB query function counts per file (§1):
- facilitators.ts: 10 functions (lines 10, 75, 84, 93, 123, 132, 219, 229, 239, 255, 266)
- transactions.ts: 7 functions (lines 8, 53, 62, 80, 115, 156, 198)
- products.ts: 18 functions + 12 deprecated aliases at lines 447-479
- webhooks.ts: 9 functions
- proxy-urls.ts: 7 functions
- resource-owners.ts: 9 functions
- refund-configs.ts: 5 functions
- refund-wallets.ts: 6 functions
- registered-servers.ts: 8 functions (+ hashApiKey util at line 16)
- claims.ts: 10 functions
- subscriptions.ts: 12 functions (non-tenant — user-scoped)
- subscription-payments.ts: 4 functions (non-tenant)
- user-wallets.ts: 8 functions (non-tenant)
- user-preferences.ts: 2 functions (non-tenant)
- notifications.ts: 7 functions (non-tenant)
- pending-facilitators.ts: 5 functions (non-tenant)
TOTAL: 93 minimum (some files exclude utility/aliases — auditor adds rows if discovered)

Confirmed pre-existing findings (RESEARCH.md §2, §3, §5, §6):
- admin.ts:1623 — GET /facilitators/:id/raw — NO requireAuth — HIGH
- admin.ts:1653 — PATCH /facilitators/:id/domains — NO requireAuth — CRITICAL (multi-tenant breakout)
- admin.ts:1687 — DELETE /subscriptions/clear — requireAuth but no admin role check — HIGH
- facilitator.ts:316-369 — EVM verify path lacks signature recovery — HIGH/CRITICAL (planner-surprise #1)
- facilitator.ts:27-28 — ACCESS_TOKEN_SECRET fallback chain — HIGH
- facilitator.ts:530-531 — console.log full ERC-3009 authorization + signature — HIGH
- erc3009.ts:389, 392 — console.log signature + v/r/s — HIGH
- internal-webhooks.ts:106-120 — timingSafeEqual length-mismatch bug — MEDIUM
- internal-webhooks.ts:159 — req.body destructure with no zod — MEDIUM
- public.ts:744-749 — claim execute lacks signature verification (commented out) — HIGH
- No express-rate-limit in package.json — HIGH (per D-15 "in scope to install in Plan 2")
- No .github/dependabot.yml — SEC-04 finding

D-10 Severity rubric verbatim (must appear at top of 24-SECURITY-AUDIT.md):
- CRITICAL — exploitable now without further development, results in immediate data loss, funds loss, or full multi-tenant breakout
- HIGH — exploitable with non-trivial effort, OR an exploitable path with significant blast radius, OR a known issue from CONCERNS.md that has not been mitigated
- MEDIUM — defense-in-depth gap, exploitable only with chained conditions, or hardening that materially raises attacker cost
- LOW — nit / hygiene / documentation gap

SEC-04 grep pattern (D-05 verbatim, must appear in sec04-secrets-in-logs.sh):
grep -rEn 'console\.(log|error|info|warn).*(privateKey|secretKey|signingKey|authorization|signature|ENCRYPTION_KEY|BETTER_AUTH_SECRET|ACCESS_TOKEN_SECRET)' packages/ apps/ --include='*.ts' --include='*.tsx'

SEC-02 grep pattern (RESEARCH.md §1 verbatim, must appear in sec02-cross-tenant.sh):
grep -nE "db\.prepare\(.*(SELECT|UPDATE|DELETE).*FROM (transactions|products|product_payments|webhooks|proxy_urls|resource_owners|registered_servers|claims|refund_wallets|refund_configs|facilitators)" packages/server/src/ --include="*.ts"

REQUIREMENTS.md drift exact edits (per RESEARCH.md §11):
- Line 37: "Hono route schemas" → "Express route schemas"
- Lines 81-86: "Phase 25" → "Phase 24" on six SEC-01..SEC-06 traceability rows
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Scaffold tools/security-audit/ skeleton + 24-SECURITY-AUDIT.md header</name>
  <files>
    tools/security-audit/README.md
    tools/security-audit/run-all.sh
    tools/security-audit/grep/sec02-cross-tenant.sh
    tools/security-audit/grep/sec04-secrets-in-logs.sh
    tools/security-audit/grep/sec05-handlers-without-zod.sh
    tools/security-audit/grep/sec05-handlers-without-auth.sh
    tools/security-audit/semgrep/openfacilitator.yaml
    .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md
  </files>
  <read_first>
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md (§7, §10 — pattern file locations and tool availability)
    - .planning/phases/24-security-audit-remediation/24-PATTERNS.md (the "tools/security-audit/" subsections — scaffold guidance for every script + the bash header convention)
    - .planning/phases/24-security-audit-remediation/24-CONTEXT.md (D-05 grep pattern verbatim, D-09 audit-doc structure, D-10 severity rubric verbatim)
  </read_first>
  <action>
    Create `tools/security-audit/` directory and scaffold seven files per D-05 + RESEARCH.md §10 + PATTERNS.md.

    **All bash scripts use this header** (PATTERNS.md "Bash header convention"):
    ```bash
    #!/usr/bin/env bash
    set -euo pipefail
    ```

    **1. `tools/security-audit/README.md`** (60-120 lines, operator-focused):
    Sections: (a) Purpose — re-runnable SEC-NN audit gates per Phase 24 D-05; (b) Run all — `bash tools/security-audit/run-all.sh`; (c) Run one — `bash tools/security-audit/grep/sec02-cross-tenant.sh`; (d) Install semgrep best-effort (`brew install semgrep || pip install semgrep`); (e) Interpreting output — zero matches = clean; non-zero requires auditor review (some matches are cross-tenant-by-design per RESEARCH.md §1 classification key); (f) Output files — `outputs/pnpm-audit-YYYY-MM-DD.json` dated per run. NOT a security-policy doc — link to `SECURITY-DECISIONS.md` for that (created in Plan 2).

    **2. `tools/security-audit/run-all.sh`** (driver):
    - Header comment: "Phase 24 audit driver — runs every SEC-NN grep gate and captures `pnpm audit --json`. Exit 0 if every gate runs; matches are informational, auditor interprets."
    - Echo each gate name before running: `echo "[SEC-02] cross-tenant query check"` etc.
    - Best-effort semgrep install: `command -v semgrep >/dev/null || brew install semgrep 2>/dev/null || pip install semgrep 2>/dev/null || echo "semgrep not installed — grep patterns are the authoritative gate"`
    - Run each `grep/*.sh` script in order.
    - Capture `pnpm audit --json > tools/security-audit/outputs/pnpm-audit-$(date +%Y-%m-%d).json` — note: pnpm audit returns non-zero on advisories; use `pnpm audit --json > outputs/... || true` so the driver exits 0 even when advisories are present.
    - Final summary echo: "[done] Run audit doc review on `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md`"

    **3. `tools/security-audit/grep/sec02-cross-tenant.sh`**:
    - Header: `# SEC-02 cross-tenant query gate. Matches missing a WHERE ... facilitator_id (or tenant FK) clause are findings. Cross-tenant-by-design queries are intentional — auditor interprets.`
    - Body: the RESEARCH.md §1 verbatim grep:
      ```bash
      grep -nE "db\.prepare\(.*(SELECT|UPDATE|DELETE).*FROM (transactions|products|product_payments|webhooks|proxy_urls|resource_owners|registered_servers|claims|refund_wallets|refund_configs|facilitators)" packages/server/src/ --include="*.ts" || true
      ```
    - Trailing `echo "Expected ~ many matches as of 2026-05-17 — auditor classifies in 24-SECURITY-AUDIT.md §SEC-02 enumeration table"`.

    **4. `tools/security-audit/grep/sec04-secrets-in-logs.sh`**:
    - Header: `# SEC-04 secrets-in-console gate. Expected: 26 matches as of 2026-05-17 (RESEARCH.md §5). Drift detection: a count <26 means a fix landed elsewhere; >26 means new logging was added.`
    - Body: D-05 verbatim pattern:
      ```bash
      grep -rEn 'console\.(log|error|info|warn).*(privateKey|secretKey|signingKey|authorization|signature|ENCRYPTION_KEY|BETTER_AUTH_SECRET|ACCESS_TOKEN_SECRET)' packages/ apps/ --include='*.ts' --include='*.tsx' || true
      ```
    - Trailing count echo: `echo "[SEC-04] match count: $(grep -rEn '...' ... | wc -l)"`.

    **5. `tools/security-audit/grep/sec05-handlers-without-zod.sh`**:
    - Header: `# SEC-05 missing-zod gate. Prints req.body/query/params usage and zod-parse usage separately — auditor correlates. Known gaps per RESEARCH.md §2: internal-webhooks.ts:159, admin.ts:1653.`
    - Body two-step:
      ```bash
      echo "--- req.body/query/params usage ---"
      grep -nE "req\.(body|query|params)" packages/server/src/routes/*.ts || true
      echo "--- zod parse usage ---"
      grep -nE "safeParse|\.parse\(|z\.object" packages/server/src/routes/*.ts || true
      ```

    **6. `tools/security-audit/grep/sec05-handlers-without-auth.sh`**:
    - Header: `# SEC-05 missing-requireAuth gate. Caveat: false positives when auth is applied via router.use(requireAuth). Known offenders per RESEARCH.md §3: admin.ts:1623 (GET /facilitators/:id/raw), admin.ts:1653 (PATCH /facilitators/:id/domains).`
    - Body:
      ```bash
      grep -nE "router\.(get|post|put|patch|delete)\(" packages/server/src/routes/*.ts \
        | grep -vE "requireAuth|requireFacilitator|optionalAuth" || true
      echo "--- router.use lines (cross-reference for blanket auth application) ---"
      grep -nE "router\.use\(" packages/server/src/routes/*.ts || true
      ```

    **7. `tools/security-audit/semgrep/openfacilitator.yaml`** (one starter rule per PATTERNS.md):
    ```yaml
    rules:
      - id: of-no-console-secret
        pattern-either:
          - pattern: console.log(..., $X, ...)
          - pattern: console.error(..., $X, ...)
          - pattern: console.info(..., $X, ...)
          - pattern: console.warn(..., $X, ...)
        metavariable-regex:
          metavariable: $X
          regex: '(privateKey|secretKey|signingKey|BETTER_AUTH_SECRET|ENCRYPTION_KEY|ACCESS_TOKEN_SECRET|authorization|signature)'
        message: "Sensitive identifier appears in console.log/error/info/warn — SEC-04"
        severity: ERROR
        languages: [typescript]
    ```

    **8. `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md`** (header scaffold only — body filled by tasks 2-6):
    Top of file MUST contain the **D-10 severity rubric verbatim**:
    ```markdown
    # Phase 24 Security Audit Findings

    **Audited:** 2026-05-17
    **Auditor:** Claude (via /gsd-execute-phase 24)
    **Scope:** packages/server, apps/dashboard, packages/core, packages/sdk, examples/ (per D-01)
    **Methodology:** Manual review + pnpm audit + grep patterns committed under `tools/security-audit/` + Solana fuzz tests under `packages/integration-tests/`. Semgrep rules committed; semgrep tool may not be installed locally — grep is the authoritative gate per RESEARCH.md §7.

    ## Severity Rubric

    - **CRITICAL** — exploitable now without further development, results in immediate data loss, funds loss, or full multi-tenant breakout
    - **HIGH** — exploitable with non-trivial effort, OR an exploitable path with significant blast radius, OR a known issue from CONCERNS.md that has not been mitigated
    - **MEDIUM** — defense-in-depth gap, exploitable only with chained conditions, or hardening that materially raises attacker cost
    - **LOW** — nit / hygiene / documentation gap

    ## Findings Count

    | Severity | Count |
    |----------|-------|
    | CRITICAL | _filled by auditor_ |
    | HIGH     | _filled by auditor_ |
    | MEDIUM   | _filled by auditor_ |
    | LOW      | _filled by auditor_ |

    ## CONCERNS.md Re-validation (per D-02)

    _Populated by Task 6 below — exactly 11 rows._

    ## §SEC-01 — Authentication Surface

    _Populated by Task 2._

    ## §SEC-02 — Multi-tenant Isolation

    _Populated by Task 3._

    ## §SEC-03 — Payment Co-signing

    _Populated by Task 4._

    ## §SEC-04 — Secrets & Key Management

    _Populated by Task 5._

    ## §SEC-05 — Input Validation & API Hardening

    _Populated by Task 5 (combined commit with SEC-04 to share the helmet/cors/rate-limit findings)._
    ```

    `chmod +x` all `tools/security-audit/**/*.sh` files via `find tools/security-audit -name '*.sh' -exec chmod +x {} \;`.
  </action>
  <verify>
    <automated>test -d tools/security-audit/grep && test -d tools/security-audit/semgrep && test -d tools/security-audit/outputs && test -x tools/security-audit/run-all.sh && test -x tools/security-audit/grep/sec02-cross-tenant.sh && test -x tools/security-audit/grep/sec04-secrets-in-logs.sh && test -x tools/security-audit/grep/sec05-handlers-without-zod.sh && test -x tools/security-audit/grep/sec05-handlers-without-auth.sh && test -f tools/security-audit/semgrep/openfacilitator.yaml && test -f tools/security-audit/README.md && grep -q "Severity Rubric" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "CRITICAL — exploitable now without further development" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "set -euo pipefail" tools/security-audit/run-all.sh && bash tools/security-audit/grep/sec02-cross-tenant.sh > /dev/null && bash tools/security-audit/grep/sec04-secrets-in-logs.sh > /dev/null && bash tools/security-audit/grep/sec05-handlers-without-zod.sh > /dev/null && bash tools/security-audit/grep/sec05-handlers-without-auth.sh > /dev/null</automated>
  </verify>
  <done>
    All seven `tools/security-audit/` files exist; all four `grep/*.sh` scripts are executable and exit 0 when invoked; `24-SECURITY-AUDIT.md` exists with the D-10 verbatim severity rubric at the top and placeholder sections for SEC-01..SEC-05 + CONCERNS re-validation; `tools/security-audit/outputs/` directory exists (empty — populated by Task 7).
  </done>
</task>

<task type="auto">
  <name>Task 2: Populate §SEC-01 (Auth surface) findings</name>
  <files>
    .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md
  </files>
  <read_first>
    - .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md (scaffold from Task 1)
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §3 (Auth surface — files, cookie config, route auth status, Better Auth concerns)
    - .planning/phases/24-security-audit-remediation/24-PATTERNS.md (sample SEC-01 finding rows verbatim under "Excerpt — concrete sample SEC-01 finding row")
    - packages/server/src/auth/config.ts (cookie + session config — verify A1 cookie defaults)
    - packages/server/src/auth/index.ts
    - packages/server/src/middleware/auth.ts (requireAuth shape)
    - packages/server/src/routes/admin.ts (read at lines 1610-1700 — confirm the three RESEARCH.md §3 confirmed gaps still match line numbers at this HEAD)
    - packages/server/src/server.ts (route mount order + cors/helmet)
  </read_first>
  <action>
    Append a complete §SEC-01 section under the `## §SEC-01 — Authentication Surface` heading. Section MUST contain four sub-sections per D-09:

    **Scope** — bullet list of audited files (mirror the SEC-01 source files from `<source_files_for_audit>` above).

    **Methodology** — manual code review + cookie-flag inspection (deferred to runtime per RESEARCH.md A1 — note as future verification gate) + grep via `tools/security-audit/grep/sec05-handlers-without-auth.sh`.

    **Findings table** with columns `| ID | severity | title | file:line | description | status |`. MUST include **at least these 3 rows** verbatim from PATTERNS.md sample:

    | ID | severity | title | file:line | description | status |
    |----|----------|-------|-----------|-------------|--------|
    | SEC-01-001 | CRITICAL | Unauthenticated debug endpoint allows custom_domain rebind (multi-tenant breakout) | packages/server/src/routes/admin.ts:1653 | `PATCH /facilitators/:id/domains` is mounted without `requireAuth` middleware. Any unauthenticated caller can rewrite `custom_domain` and `additional_domains` on any facilitator, routing a victim's domain to attacker-controlled config. Originally CONCERNS.md item 1. | open |
    | SEC-01-002 | HIGH | Unauthenticated debug endpoint exposes raw facilitator record | packages/server/src/routes/admin.ts:1623 | `GET /facilitators/:id/raw` returns the full facilitator record (excluding encrypted keys) without auth. Originally CONCERNS.md item 1. | open |
    | SEC-01-003 | HIGH | `/subscriptions/clear` is auth-gated but has no admin role check | packages/server/src/routes/admin.ts:1687 | `DELETE /subscriptions/clear` requires `requireAuth` only — any logged-in user can delete all subscriptions. `requireAdmin` was removed in Phase 23 D-07 and never replaced with a role-based check. | open |

    Plus additional rows for:
    - Better Auth `db: any` type-safety gap at `packages/server/src/auth/config.ts:16` — LOW (CONCERNS.md item 6).
    - `requireEmailVerification: false` at `packages/server/src/auth/config.ts` — MEDIUM-or-LOW (intentional design but flag for future re-evaluation).
    - `/subscriptions/billing` (cron) has no auth (RESEARCH.md §2 row 4 note) — MEDIUM. Auditor decides whether to require a secret header.
    - CSRF / Better Auth defaults verification — LOW (A1 — needs runtime verification gate).

    **Resolved by removal** — bullet list. Per RESEARCH.md §6 last paragraph: "No CONCERNS.md item was directly resolved by Phase 22 or 23 removals." Include the literal note: "No SEC-01 items resolved by Phase 22/23 removals — all relevant items remain Phase 24 findings."

    Do NOT remediate any of these — just enumerate. Plan 2 remediates per D-13.
  </action>
  <verify>
    <automated>grep -q "SEC-01-001" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "admin.ts:1653" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "admin.ts:1623" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "admin.ts:1687" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "Resolved by removal" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && [ "$(awk '/^## §SEC-01/,/^## §SEC-02/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md | grep -c '^| SEC-01-')" -ge 3 ]</automated>
  </verify>
  <done>
    §SEC-01 section is populated. Findings table has ≥3 rows referencing admin.ts:1623, admin.ts:1653, and admin.ts:1687. Scope/Methodology/Resolved-by-removal sub-sections all present.
  </done>
</task>

<task type="auto">
  <name>Task 3: Populate §SEC-02 (Multi-tenant) — ≥93 DB-query enumeration rows</name>
  <files>
    .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md
  </files>
  <read_first>
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §1 (the seed enumeration — every exported DB function across 14 modules with WHERE clauses + classification)
    - .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md (placeholder from Task 1 + SEC-01 content from Task 2)
    - packages/server/src/middleware/tenant.ts (resolveFacilitator middleware — the tenant resolution path)
    - packages/server/src/db/facilitators.ts (10 functions)
    - packages/server/src/db/transactions.ts (7 functions)
    - packages/server/src/db/products.ts (18 functions + 12 deprecated aliases)
    - packages/server/src/db/webhooks.ts (9 functions)
    - packages/server/src/db/proxy-urls.ts (7 functions)
    - packages/server/src/db/resource-owners.ts (9 functions)
    - packages/server/src/db/refund-configs.ts (5 functions)
    - packages/server/src/db/refund-wallets.ts (6 functions)
    - packages/server/src/db/registered-servers.ts (8 functions + hashApiKey util)
    - packages/server/src/db/claims.ts (10 functions)
    - packages/server/src/db/subscriptions.ts (12 functions — non-tenant)
    - packages/server/src/db/subscription-payments.ts (4 functions — non-tenant)
    - packages/server/src/db/user-wallets.ts (8 functions — non-tenant)
    - packages/server/src/db/user-preferences.ts (2 functions — non-tenant)
    - packages/server/src/db/notifications.ts (7 functions — non-tenant)
    - packages/server/src/db/pending-facilitators.ts (5 functions — non-tenant)
  </read_first>
  <action>
    Append a complete §SEC-02 section under `## §SEC-02 — Multi-tenant Isolation`.

    **Scope** — `packages/server/src/db/*.ts` (14 modules), `packages/server/src/middleware/tenant.ts`.

    **Methodology** — Per D-06: enumerate every exported query function across `packages/server/src/db/*.ts` (excluding `index.ts` and `migrations/index.ts`) into one big table. Classify each per RESEARCH.md §1 key (scoped / unscoped-by-id / cross-tenant-by-design / non-tenant / unclear). Cross-reference with `bash tools/security-audit/grep/sec02-cross-tenant.sh`.

    **Scope Classification Key** — paste the RESEARCH.md §1 verbatim key:
    - **scoped** — WHERE includes facilitator_id (or tenant column)
    - **unscoped (by-id)** — keyed by primary ID; caller must verify ownership
    - **cross-tenant-by-design** — intentionally global
    - **non-tenant** — user-owned (subscriptions, wallets, notifications, preferences)
    - **unclear** — needs auditor decision

    **DB Query Enumeration (≥93 rows total)** — copy the seed tables from RESEARCH.md §1 verbatim and use them as the foundation. Tables to include:
    - facilitators.ts: 10 rows (lines 10, 75, 84, 93, 123, 132, 219, 229, 239, 255, 266 — note the §1 seed shows 11 functions including backfillFacilitatorSubscriptions; if more functions are discovered during read, add them)
    - transactions.ts: 7 rows
    - products.ts: 18 rows + a single row for the 12 deprecated aliases at lines 447-479 (note as "deprecated — recommend removal per CONCERNS.md item 3")
    - webhooks.ts: 9 rows
    - proxy-urls.ts: 7 rows
    - resource-owners.ts: 9 rows
    - refund-configs.ts: 5 rows
    - refund-wallets.ts: 6 rows
    - registered-servers.ts: 9 rows (8 fns + hashApiKey util as utility)
    - claims.ts: 10 rows
    - subscriptions.ts: 12 rows (all marked non-tenant)
    - subscription-payments.ts: 4 rows (all non-tenant)
    - user-wallets.ts: 8 rows (all non-tenant)
    - user-preferences.ts: 2 rows (all non-tenant)
    - notifications.ts: 7 rows (all non-tenant)
    - pending-facilitators.ts: 5 rows (all non-tenant)

    For each row, columns: `| Fn | File:Line | Table | WHERE | Class | Notes |`. **Total rows: 93 minimum** (RESEARCH.md §8 row-count gate).

    Note in scope text: "Auditor's row count is `93+`; if a function was missed in RESEARCH.md §1 seed it is added here. Any 'unscoped (by-id)' row where the caller path does not provably scope by facilitator becomes a finding in the Findings table below."

    **Findings table** below the enumeration with columns `| ID | severity | title | file:line | description | status |`. Per RESEARCH.md §1, RESEARCH.md §8, and D-15: the candidate findings are every `unscoped (by-id)` row whose caller path does NOT provably enforce facilitator ownership. Auditor records — at minimum — SEC-02-XXX rows for the ~12 "unclear" by-id queries (RESEARCH.md §1 lists them: getTransactionById, updateTransactionStatus, getProductById, getProductPaymentById, updateProductPaymentStatus, getWebhookById, getProxyUrlById, getResourceOwnerById, getRefundWalletById, getClaimById, etc.). Severity per D-10: HIGH if caller does not verify ownership; MEDIUM if caller does (defense-in-depth gap).

    **Resolved by removal** — same RESEARCH.md §6 note: no SEC-02 items resolved by Phase 22/23 removals.

    Plan 2 remediates findings; Plan 1 enumerates.
  </action>
  <verify>
    <automated>SEC02_ROWS=$(awk '/^## §SEC-02/,/^## §SEC-03/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md | grep -cE '^\| (createFacilitator|getFacilitatorById|getFacilitatorBySubdomain|createTransaction|getTransactionById|createProduct|getProductById|createWebhook|getWebhookById|createProxyUrl|getProxyUrlById|createResourceOwner|createRefundConfig|createRefundWallet|hashApiKey|createRegisteredServer|createClaim|getClaimById|createSubscription|createSubscriptionPayment|createUserWallet|getUserPreferences|createNotification|createPendingFacilitator) '); echo "SEC-02 enumeration row count: $SEC02_ROWS"; [ "$SEC02_ROWS" -ge 93 ] && grep -q "Scope Classification Key" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "products.ts:447" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md</automated>
  </verify>
  <done>
    §SEC-02 enumeration table contains ≥93 rows spanning all 14 DB modules (excluding `index.ts` infrastructure). Scope classification key is present. Findings table below enumeration captures the "unclear" by-id queries as candidate HIGH/MEDIUM findings. Deprecated aliases at products.ts:447 noted.
  </done>
</task>

<task type="auto">
  <name>Task 4: Populate §SEC-03 (Co-signing) + append Solana truncated-data fuzz test</name>
  <files>
    .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md
    packages/integration-tests/src/solana-security.test.ts
  </files>
  <read_first>
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §4 (Co-signing surface — Solana allowlist, ERC-3009 NonceManager, EVM verify signature-recovery gap)
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §9 (Solana fuzz test mapping — D-07 attack classes + the one gap: oversized/truncated instruction data)
    - .planning/phases/24-security-audit-remediation/24-PATTERNS.md ("solana-security.test.ts" sub-section — the verbatim CloseAccount analog at lines 562-587 and the recommended truncated-data test body)
    - packages/integration-tests/src/solana-security.test.ts (full file — for context on existing helpers buildTransaction, makePayload, payerATA, payToATA, facilitatorATA, payerKeypair, etc. The `describe('attack vector 5...')` block ends around line 615.)
    - packages/core/src/solana.ts
    - packages/core/src/solana-validation.ts
    - packages/core/src/erc3009.ts (NonceManager + processingNonces structure)
    - packages/core/src/facilitator.ts (lines 316-369 — the EVM verify gap RESEARCH.md flags as planner-critical surprise #1)
  </read_first>
  <action>
    Two deliverables in one task.

    **(a) Append the truncated-data Solana fuzz test to `packages/integration-tests/src/solana-security.test.ts`.**

    Insertion point: inside the existing `describe('attack vector 5: token delegation via approve/setAuthority', ...)` block (the block ending around line 615 — after the `MintTo` test). Append the test EXACTLY as RESEARCH.md §9 + PATTERNS.md prescribe — all helpers (`buildTransaction`, `makePayload`, `payerATA`, `payToATA`, `payerKeypair`, `payerPubkey`, `feePayerPubkey`, `blockhash`, `requirements`) are already in scope:

    ```typescript
        it('should reject token instruction with truncated data', async () => {
          // Transfer (type 3) requires 9 bytes (type + 8-byte amount). Send only the type byte.
          const truncatedData = Buffer.from([3]);
          const tx = buildTransaction({
            feePayer: feePayerPubkey,
            blockhash,
            instructions: [
              new TransactionInstruction({
                programId: TOKEN_PROGRAM_ID,
                keys: [
                  { pubkey: payerATA, isSigner: false, isWritable: true },
                  { pubkey: payToATA, isSigner: false, isWritable: true },
                  { pubkey: payerPubkey, isSigner: true, isWritable: false },
                ],
                data: truncatedData,
              }),
            ],
            signers: [payerKeypair],
          });
          const result = await facilitator.verify(makePayload(tx, payerPubkey, payTo), requirements);
          expect(result.isValid).toBe(false);
          console.log('  Truncated-data attack rejected:', result.invalidReason);
        });
    ```

    No new imports, no new fixtures. Mirror the CloseAccount test's exact shape (PATTERNS.md lines 309-334).

    **(b) Append a complete §SEC-03 section to `24-SECURITY-AUDIT.md` under `## §SEC-03 — Payment Co-signing`.**

    Sub-sections per D-09:

    **Scope** — `packages/core/src/solana.ts`, `packages/core/src/solana-validation.ts`, `packages/core/src/erc3009.ts`, `packages/core/src/facilitator.ts:316-369` (EVM verify path), `packages/server/src/routes/facilitator.ts` (/verify, /settle endpoints), `packages/integration-tests/src/solana-security.test.ts` (fuzz tests).

    **Methodology** — Per D-07: (i) Solana instruction allowlist completeness — verify the 6 programs + 2 token instruction types in `solana-validation.ts:71-91` cover exactly the intended set. (ii) Replay protection — Solana recent-blockhash window (`solana.ts:178-187, 280-292`); ERC-3009 NonceManager structure + processingNonces dedupe (`erc3009.ts:24-189`); (iii) Fuzz tests — existing 24 cases mapped to D-07's 5 attack classes + 1 new truncated-data case (this commit).

    **Allowlist verification subsection (positive findings, no severity)**:
    - Solana programs allowlisted (6): TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, ComputeBudgetProgram.programId, SPL Memo v2, SPL Memo v1.
    - Token instruction types allowlisted (2): 3 (Transfer), 12 (TransferChecked).
    - Rejected instruction types verified by fuzz tests: 4 (Approve), 6 (SetAuthority), 7 (MintTo), 9 (CloseAccount), arbitrary programs.
    - Address Lookup Tables explicitly rejected at `solana-validation.ts:144-153` — correct safe choice.

    **Findings table** with at minimum these rows:

    | ID | severity | title | file:line | description | status |
    |----|----------|-------|-----------|-------------|--------|
    | SEC-03-001 | HIGH | EVM verify path lacks signature recovery against `authorization.from` | packages/core/src/facilitator.ts:316-369 | The `verify` path checks chain support, timestamps, and amount but does NOT call `recoverAddress`/`verifyTypedData` against `authorization.from`. On-chain `transferWithAuthorization` revert is the only signature check — too late, nonce is consumed and gas is paid. Recommendation: add viem `verifyTypedData` call. Severity may be CRITICAL pending Plan 2 auditor decision (Open Question #1 in RESEARCH.md). | open |
    | SEC-03-002 | HIGH | EVM verify does not check `authorization.to === requirements.payTo` | packages/core/src/facilitator.ts:316-369 | Per D-08 scope: no current code path verifies the authorization's recipient matches the merchant's `payTo`. Same compensating control as SEC-03-001 (on-chain revert), same severity question. | open |
    | SEC-03-003 | HIGH | ERC-3009 NonceManager is single-process, in-memory only | packages/core/src/erc3009.ts:72-189 | NonceManager + processingNonces (lines 24-56) are `Map<string, ...>` with no persistence; multi-instance deployments will race on the same on-chain nonce. CONCERNS.md "ERC-3009 Nonce Management" — still applies. Acceptable with single-instance compensating control per D-16. | open |
    | SEC-03-004 | HIGH | Sensitive ERC-3009 logging — full authorization + signature in console.log | packages/core/src/facilitator.ts:530-531 | `console.log('[Facilitator] EVM authorization received:', JSON.stringify(authorization, null, 2))` and signature log. Leaks credential. (Cross-referenced under SEC-04.) | open |
    | SEC-03-005 | HIGH | Sensitive signature logging in ERC-3009 utility | packages/core/src/erc3009.ts:389,392 | Raw signature + v/r/s components logged. (Cross-referenced under SEC-04.) | open |

    Note: SEC-03-004/005 are duplicated in §SEC-04 — that is intentional cross-listing per D-09 finding structure.

    **Fuzz test coverage table** showing the D-07 attack-class to test-name mapping (from RESEARCH.md §9). Include the new truncated-data row as "covered as of this commit".

    **Resolved by removal** — none (Phase 23 D removed reward-claim signature verification at `utils/solana-verify.ts` — but that wasn't in CONCERNS.md). Include note.

    Plan 1 enumerates; Plan 2 either remediates SEC-03-001/002 with `verifyTypedData` OR accepts them in `SECURITY-DECISIONS.md` with compensating control "on-chain settlement revert is the cryptographic check" per D-12.
  </action>
  <verify>
    <automated>grep -q "should reject token instruction with truncated data" packages/integration-tests/src/solana-security.test.ts && grep -q "Truncated-data attack rejected" packages/integration-tests/src/solana-security.test.ts && grep -q "facilitator.ts:316-369" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "SEC-03-001" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "Address Lookup Tables" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && pnpm --filter @openfacilitator/integration-tests test:security 2>&1 | tail -20 | grep -qE "(Test Files.*passed|Tests.*passed)"</automated>
  </verify>
  <done>
    New truncated-data test exists inside the existing `attack vector 5` describe block; `pnpm --filter @openfacilitator/integration-tests test:security` exits 0; §SEC-03 has at minimum 5 finding rows including the EVM signature recovery gap at facilitator.ts:316-369 and the ALT-rejection positive finding.
  </done>
</task>

<task type="auto">
  <name>Task 5: Populate §SEC-04 + §SEC-05 — secrets/logs (≥26 rows) and handler enum (≥124 rows)</name>
  <files>
    .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md
  </files>
  <read_first>
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §5 (Secrets/Console-log audit — 26 raw grep matches classified by severity)
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §2 (SEC-05 route handler inventory — 124 handlers across 8 router files)
    - .planning/phases/24-security-audit-remediation/24-PATTERNS.md (findings-table column shape)
    - packages/server/.env.example
    - apps/dashboard/.env.example
    - packages/server/src/utils/crypto.ts (AES-256-GCM, PBKDF2, fail-closed)
    - packages/server/src/routes/facilitator.ts (lines 27-28 for ACCESS_TOKEN_SECRET fallback; lines 530-531 for sensitive logging)
    - packages/server/src/routes/internal-webhooks.ts (signature verification at lines 106-120; req.body at line 159)
    - packages/server/src/routes/admin.ts (the 71 handlers)
    - packages/server/src/routes/public.ts (the 24 handlers + claim execute signature gap at lines 744-749)
    - packages/server/src/routes/subscriptions.ts (the 7 handlers)
    - packages/server/src/routes/facilitator.ts (the 8 router-mounted handlers including /verify, /settle)
    - packages/server/src/routes/notifications.ts (4 handlers)
    - packages/server/src/routes/stats.ts (7 handlers)
    - packages/server/src/routes/discovery.ts (2 handlers)
    - packages/server/src/services/webhook.ts
    - packages/server/package.json (verify no express-rate-limit dependency)
    - tools/security-audit/grep/sec04-secrets-in-logs.sh (created in Task 1 — run it to confirm current count)
    - tools/security-audit/grep/sec05-handlers-without-zod.sh
    - tools/security-audit/grep/sec05-handlers-without-auth.sh
  </read_first>
  <action>
    Two SEC sections in one task because they share the helmet/cors/rate-limit context and both depend on the Task 1 grep scripts.

    **(a) §SEC-04 — Secrets & Key Management**

    Append under `## §SEC-04 — Secrets & Key Management`.

    **Scope** — `packages/server/src/utils/crypto.ts`, `.env.example` files, all `console.*` call sites near key/secret identifiers (per D-05 grep), `packages/server/src/routes/facilitator.ts:27-28` ACCESS_TOKEN_SECRET fallback chain.

    **Methodology** — Run `bash tools/security-audit/grep/sec04-secrets-in-logs.sh` and capture the row count (expected 26 per RESEARCH.md §5). Inspect `.env.example` for documented secret-shaped vars vs runtime usage. Inspect `crypto.ts` for fail-closed behavior + PBKDF2 + AES-256-GCM correctness.

    **Secrets-in-Logs table (≥26 rows)** — copy RESEARCH.md §5 verbatim into a markdown table. Columns: `| ID | File:Line | Severity | Notes |`. Use IDs `SEC-04-LOG-001` through `SEC-04-LOG-026` (or more if grep yields more at execution time). Include every row from RESEARCH.md §5 — facilitator.ts:530, facilitator.ts:531, erc3009.ts:352, erc3009.ts:389, erc3009.ts:390, erc3009.ts:392, erc3009.ts:562-565, solana.ts:155, solana.ts:165, solana.ts:168, solana.ts:200, solana.ts:206, solana.ts:261, solana.ts:301, solana.ts:311, integration-tests/base-real.test.ts:255, integration-tests/base-real.test.ts:302, integration-tests/solana-real.test.ts:206, integration-tests/solana-real.test.ts:256, internal-webhooks.ts:153, x402-client.ts:189, x402-client.ts:420, claims.ts:369, claims.ts:402, and any additional rows the grep surfaces. Add a note above the table: "If the live grep produces more than 26 rows, all are added — 26 is the minimum gate per RESEARCH.md §8."

    **.env.example findings table** with rows:
    | ID | severity | title | file:line | description | status |
    | SEC-04-001 | HIGH | ACCESS_TOKEN_SECRET fallback derives from low-entropy default | packages/server/src/routes/facilitator.ts:27-28 | Fallback chain: `ACCESS_TOKEN_SECRET || sha256(ENCRYPTION_KEY \|\| 'openfacilitator-access-default')`. Production missing both vars inherits deterministic default. | open |
    | SEC-04-002 | MEDIUM | ENCRYPTION_KEY / ENCRYPTION_SECRET not documented in .env.example | packages/server/.env.example | Read at runtime in `crypto.ts` and `routes/facilitator.ts` but not declared. Hygiene gap. | open |
    | SEC-04-003 | MEDIUM | Dependabot is not enabled (`.github/dependabot.yml` missing) | .github/dependabot.yml | Per D-04 the absence is a SEC-04 finding. Audit confirms Dependabot not enabled at the YAML level; live `gh api repos/{owner}/{repo}/vulnerability-alerts` check is a future verification gate per RESEARCH.md A8. | open |
    | SEC-04-004 | LOW | `pnpm audit` baseline captured for diff against future audits | tools/security-audit/outputs/pnpm-audit-2026-05-17.json | First-time baseline. Specific advisories are listed in the JSON; each will become a SEC-04 finding row when re-audited. | informational |

    **Encryption-at-rest verification (positive note)** — `crypto.ts` uses AES-256-GCM with per-record 32-byte salt + 16-byte IV + 16-byte authTag, PBKDF2 100k iterations, SHA-256, key from `BETTER_AUTH_SECRET || ENCRYPTION_SECRET`. Fails closed if neither set. Auditor confirms — no finding.

    **Resolved by removal** — none.

    **(b) §SEC-05 — Input Validation & API Hardening**

    Append under `## §SEC-05 — Input Validation & API Hardening`.

    **Scope** — every Express handler under `packages/server/src/routes/*.ts` (8 router files), `packages/server/src/services/webhook.ts`, helmet + CORS config in `packages/server/src/server.ts:30-44`, rate-limit middleware (absent).

    **Methodology** — Enumerate every Express handler with `requireAuth` and `zod` presence flags. Cross-reference against `tools/security-audit/grep/sec05-handlers-without-zod.sh` and `tools/security-audit/grep/sec05-handlers-without-auth.sh`. Inspect `internal-webhooks.ts` signature verification for known bugs.

    **Handler Enumeration table (≥124 rows)** with columns `| Router | Path | Method | File:Line | requireAuth? | zod? | Notes |`. Per RESEARCH.md §2: facilitatorRouter (8) + adminRouter (71) + publicRouter (24) + subscriptionsRouter (7) + notificationsRouter (4) + statsRouter (7) + discoveryRouter (2) + internalWebhooksRouter (1) = 124 minimum.

    The auditor enumerates each handler by reading each router file. RESEARCH.md §2 supplies the per-router counts and the known offenders (admin.ts:1623, admin.ts:1653, admin.ts:1687, internal-webhooks.ts:159). For routers where reading every handler would explode this task (admin.ts has 71), the auditor MAY group routes by sub-path (e.g., `/admin/facilitators/*`) provided each handler still gets a row. **The row-count gate is ≥124 individual handler rows — not 124 sub-paths.**

    **Findings table** with rows:
    | ID | severity | title | file:line | description | status |
    | SEC-05-001 | MEDIUM | Webhook signature verification has length-mismatch leak | packages/server/src/routes/internal-webhooks.ts:106-120 | `verifyWebhookSignature` uses `crypto.timingSafeEqual` correctly but does not pre-check buffer lengths; mismatched lengths throw and the catch path returns 500, observable timing difference vs 401 for wrong-signature. | open |
    | SEC-05-002 | MEDIUM | `internal-webhooks.ts:159` reads req.body fields without zod schema | packages/server/src/routes/internal-webhooks.ts:159 | `const { event, payment, metadata } = req.body;` — fields used downstream without validation. | open |
    | SEC-05-003 | MEDIUM | `admin.ts:1653` reads req.body without zod schema | packages/server/src/routes/admin.ts:1653 | Same finding pair as SEC-01-001 (debug endpoint, no auth) — also fails SEC-05 because the body destructure is unvalidated. | open |
    | SEC-05-004 | HIGH | Wallet signature verification commented-out on claim execute | packages/server/src/routes/public.ts:744-749 | `/api/claims/:id/execute` (refund-claim payout) has TODO + commented-out signature check. CONCERNS.md item 7. | open |
    | SEC-05-005 | HIGH | No rate-limit middleware on the server | packages/server/package.json | `express-rate-limit` not in dependencies; full-tree grep for `rateLimit` returns no matches. Sensitive endpoints (`/verify`, `/settle`, auth) are open to brute force/DoS. CONCERNS.md item 8. | open |
    | SEC-05-006 | MEDIUM | CORS allowlist includes dev origins in production | packages/server/src/server.ts:30-44 | `getCorsOrigins()` hardcoded array includes `localhost:*`. Likely defense-in-depth gap. | open |
    | SEC-05-007 | LOW | helmet CSP only enabled in production | packages/server/src/server.ts | `helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' })` — acceptable. | informational |
    | SEC-05-008 | MEDIUM | `/subscriptions/billing` (cron) has no auth | packages/server/src/routes/subscriptions.ts | Cron endpoint with no secret header — auditor recommends shared-secret header. | open |

    **Resolved by removal** — none.

    Plan 1 enumerates; Plan 2 either fixes (express-rate-limit, signature recovery, CORS prune) or accepts.
  </action>
  <verify>
    <automated>SEC04_ROWS=$(awk '/^## §SEC-04/,/^## §SEC-05/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md | grep -cE '^\| SEC-04-LOG-'); echo "SEC-04 secrets-in-logs row count: $SEC04_ROWS"; SEC05_ROWS=$(awk '/^## §SEC-05/,0' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md | grep -cE '^\| [a-zA-Z]'); echo "SEC-05 handler+findings row count: $SEC05_ROWS"; [ "$SEC04_ROWS" -ge 26 ] && [ "$SEC05_ROWS" -ge 124 ] && grep -q "facilitator.ts:27-28" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "express-rate-limit" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "dependabot.yml" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && grep -q "public.ts:744" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md</automated>
  </verify>
  <done>
    §SEC-04 has ≥26 secrets-in-logs rows + ACCESS_TOKEN_SECRET fallback finding + Dependabot finding + encryption-at-rest positive note. §SEC-05 has ≥124 handler enumeration rows + ≥6 finding rows including rate-limit absence and the four known specific gaps.
  </done>
</task>

<task type="auto">
  <name>Task 6: Populate CONCERNS.md re-validation block (exactly 11 rows) + finalize findings count</name>
  <files>
    .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md
  </files>
  <read_first>
    - .planning/codebase/CONCERNS.md (all 11 items — verbatim source)
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §6 (CONCERNS re-validation table — every item validated against HEAD with severity)
    - .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md (SEC-01 through SEC-05 populated by tasks 2-5 — for cross-reference)
  </read_first>
  <action>
    Populate the `## CONCERNS.md Re-validation (per D-02)` block near the top of the audit doc with **exactly 11 rows** (one per CONCERNS.md item).

    Columns: `| # | CONCERNS item | Still applies? | Evidence (file:line at HEAD) | Initial severity per D-10 | Cross-ref SEC-NN |`

    Copy the rows verbatim from RESEARCH.md §6, but add a "Cross-ref" column linking each row to the SEC-NN finding ID that absorbs it (e.g., item 1 → SEC-01-001/002/003; item 7 → SEC-05-004; item 8 → SEC-05-005; item 10 → SEC-04-001; item 11 → SEC-04-LOG-* rows).

    Below the table, include the note from RESEARCH.md §6 verbatim:

    > **Resolved by removal:** No CONCERNS items are directly resolved by Phase 22 or Phase 23 removals. CONCERNS.md was written 2026-01-19 before both removal phases and does not contain rewards/storefronts-program findings. All 11 items become Phase 24 findings.

    Finally, **fill in the "Findings Count" table at the top of the audit doc** by counting actual rows across SEC-01..SEC-05 + CONCERNS:
    - Count CRITICAL: SEC-01-001 + any others auditor flagged (likely SEC-03-001 if upgraded). Minimum: 1 (admin.ts:1653 PATCH /domains).
    - Count HIGH: at least SEC-01-002, SEC-01-003, SEC-03-001, SEC-03-002, SEC-03-003, SEC-03-004, SEC-03-005, SEC-04-001, SEC-05-004, SEC-05-005 → minimum 10.
    - Count MEDIUM: SEC-04-002, SEC-04-003, SEC-05-001, SEC-05-002, SEC-05-003, SEC-05-006, SEC-05-008 → minimum 7.
    - Count LOW: SEC-05-007 + the LOW-severity rows from the secrets-in-logs table → varies. Auditor counts.

    The exact numbers depend on Task 2-5 outputs. Auditor updates the table with the live count. Format:
    | Severity | Count |
    | CRITICAL | 1 |
    | HIGH | 10 |
    | MEDIUM | 7 |
    | LOW | 15 |
  </action>
  <verify>
    <automated>CONCERNS_ROWS=$(awk '/^## CONCERNS.md Re-validation/,/^## §SEC-01/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md | grep -cE '^\| [0-9]+ \|'); echo "CONCERNS re-validation row count: $CONCERNS_ROWS"; [ "$CONCERNS_ROWS" -eq 11 ] && grep -q "Resolved by removal:.*No CONCERNS items" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md && awk '/^## Findings Count/,/^##/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md | grep -qE "^\| CRITICAL +\| [0-9]+ \|" && awk '/^## Findings Count/,/^##/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md | grep -qE "^\| HIGH +\| [0-9]+ \|"</automated>
  </verify>
  <done>
    The re-validation block contains exactly 11 rows (one per CONCERNS.md item). The "Resolved by removal" note is verbatim from RESEARCH.md §6. The top-of-doc Findings Count table has real numbers (not placeholders) for all 4 severity levels.
  </done>
</task>

<task type="auto">
  <name>Task 7: Capture pnpm audit baseline output</name>
  <files>
    tools/security-audit/outputs/pnpm-audit-2026-05-17.json
  </files>
  <read_first>
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §7 (Tool Availability — pnpm audit works; no semgrep; no dependabot.yml)
    - tools/security-audit/run-all.sh (the capture command from Task 1)
  </read_first>
  <action>
    Run `pnpm audit --json > tools/security-audit/outputs/pnpm-audit-2026-05-17.json || true` from the repo root.

    `pnpm audit` returns non-zero when advisories exist; the `|| true` ensures the captured JSON is committed regardless. The JSON content is self-describing per `pnpm audit --json` schema (RESEARCH.md §7 + PATTERNS.md "no analog" entry).

    No further edits — the file is committed verbatim.

    If `pnpm audit --json` errors out (e.g., network failure), write a minimal placeholder JSON: `{"error": "pnpm audit failed at capture time", "captured": "2026-05-17", "command": "pnpm audit --json"}` and note in the §SEC-04 methodology that the capture step is retried as part of Plan 2 if blocked. Do NOT fail the task on `pnpm audit` non-zero exit — that is expected when advisories exist.
  </action>
  <verify>
    <automated>test -f tools/security-audit/outputs/pnpm-audit-2026-05-17.json && [ "$(wc -c < tools/security-audit/outputs/pnpm-audit-2026-05-17.json)" -gt 10 ] && head -c 1 tools/security-audit/outputs/pnpm-audit-2026-05-17.json | grep -q "{"</automated>
  </verify>
  <done>
    File `tools/security-audit/outputs/pnpm-audit-2026-05-17.json` exists, is non-empty, and starts with `{` (valid JSON-ish). Content captured from `pnpm audit --json` (or placeholder if capture errored).
  </done>
</task>

<task type="auto">
  <name>Task 8: REQUIREMENTS.md drift fix (atomic with the rest of Plan 1)</name>
  <files>
    .planning/REQUIREMENTS.md
  </files>
  <read_first>
    - .planning/REQUIREMENTS.md (current state — lines 37 + 81-86 are the drift)
    - .planning/phases/24-security-audit-remediation/24-RESEARCH.md §11 (exact lines to change with before/after)
    - .planning/phases/24-security-audit-remediation/24-PATTERNS.md ("REQUIREMENTS.md (Modified — drift fix per D-03)" — exact before/after blocks)
    - .planning/phases/22-storefronts-removal/22-CONTEXT.md (D-05 atomic-with-drift-fix precedent)
    - .planning/phases/23-rewards-removal-backend-frontend-docs/23-CONTEXT.md (D-04 same pattern)
  </read_first>
  <action>
    Two surgical edits to `.planning/REQUIREMENTS.md`:

    **Change 1 — line 37 (SEC-05 wording fix per D-03 / RESEARCH.md §11):**

    Before:
    ```
    - [ ] **SEC-05**: Input validation and API hardening audited (Hono route schemas, webhook signature verification, rate limits)
    ```

    After:
    ```
    - [ ] **SEC-05**: Input validation and API hardening audited (Express route schemas, webhook signature verification, rate limits)
    ```

    **Change 2 — lines 81-86 (traceability table fix per D-03 / RESEARCH.md §11):**

    Before (six consecutive rows):
    ```
    | SEC-01 | Phase 25 | Planning |
    | SEC-02 | Phase 25 | Planning |
    | SEC-03 | Phase 25 | Planning |
    | SEC-04 | Phase 25 | Planning |
    | SEC-05 | Phase 25 | Planning |
    | SEC-06 | Phase 25 | Planning |
    ```

    After:
    ```
    | SEC-01 | Phase 24 | Planning |
    | SEC-02 | Phase 24 | Planning |
    | SEC-03 | Phase 24 | Planning |
    | SEC-04 | Phase 24 | Planning |
    | SEC-05 | Phase 24 | Planning |
    | SEC-06 | Phase 24 | Planning |
    ```

    Do NOT modify the `Status` column (per Phase 22/23 precedent — Status flips and checkbox-ticking are post-milestone editorial decisions, not the audit run's responsibility). Do NOT modify any other lines.

    Update the trailing "Last updated" footer to add a note: `2026-05-17 — Phase 24 D-03 drift fix: SEC-05 Hono→Express, SEC-01..SEC-06 traceability Phase 25→Phase 24`.
  </action>
  <verify>
    <automated>grep -c "Hono" .planning/REQUIREMENTS.md | grep -q "^0$" && grep -c "Phase 25" .planning/REQUIREMENTS.md | grep -q "^0$" && grep -q "Express route schemas" .planning/REQUIREMENTS.md && [ "$(grep -c '| SEC-0[1-6] | Phase 24 |' .planning/REQUIREMENTS.md)" -eq 6 ] && grep -q "Phase 24 D-03 drift fix" .planning/REQUIREMENTS.md</automated>
  </verify>
  <done>
    Zero occurrences of "Hono" or "Phase 25" remain in REQUIREMENTS.md. All six SEC-01..SEC-06 traceability rows say "Phase 24". The footer notes the drift fix.
  </done>
</task>

<task type="auto">
  <name>Task 9: Final commit gate — run row-count + fuzz-test gates, then commit atomically</name>
  <files>
    (no new files — verifies prior tasks + creates one commit)
  </files>
  <read_first>
    - .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md (final state from tasks 1-6)
    - .planning/phases/24-security-audit-remediation/24-VALIDATION.md (Plan 1 Row-Count Gates table)
    - tools/security-audit/run-all.sh (driver — sanity check it runs)
    - packages/integration-tests/src/solana-security.test.ts (truncated-data test from Task 4)
    - .planning/REQUIREMENTS.md (drift fix from Task 8)
  </read_first>
  <action>
    Sanity gate before committing. Run each row-count + content gate from `24-VALIDATION.md` "Plan 1 Row-Count Gates" — these are what `gsd-plan-checker` will mechanically verify.

    Then commit atomically per RESEARCH.md §12 / D-15 precedent. Single commit covering:
    - `tools/security-audit/**` (8 files)
    - `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md`
    - `packages/integration-tests/src/solana-security.test.ts`
    - `.planning/REQUIREMENTS.md`

    Commit message:
    ```
    feat(24-01): audit security surface across SEC-01..SEC-05

    Plan 1 of Phase 24 per D-13 — runs the audit, does not remediate.

    - Adds .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md
      with severity rubric (D-10) and finding tables for SEC-01..SEC-05
      plus 11-row CONCERNS.md re-validation block (D-02).
    - Scaffolds tools/security-audit/ with re-runnable grep wrappers (D-05),
      a starter semgrep rule, and pnpm-audit baseline output.
    - Appends one Solana fuzz test for the D-07 truncated-data gap;
      existing 5 attack-class tests retained.
    - Fixes REQUIREMENTS.md drift per D-03: SEC-05 Hono→Express,
      SEC-01..SEC-06 traceability Phase 25→Phase 24 (atomic with Plan 1
      deliverables, mirroring Phase 22 D-05 / Phase 23 D-04 precedent).

    Remediation of findings is Plan 24-02 (defined after this ships).

    Per CLAUDE.md: ship via PR.
    ```

    Do NOT push or open the PR in this task — that is for the user (per project memory rule "Always ship via PR — `gh pr create`").

    **Mechanical gates the executor verifies before committing:**
    1. `[ "$(awk '/^## §SEC-02/,/^## §SEC-03/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md | grep -cE '^\| (createFacilitator|getFacilitatorById|getFacilitatorBySubdomain|createTransaction|...)') ` ≥ 93
    2. SEC-05 handler enumeration row count ≥ 124
    3. SEC-04 secrets-in-logs row count ≥ 26
    4. CONCERNS re-validation row count = 11
    5. `pnpm --filter @openfacilitator/integration-tests test:security` exits 0
    6. `grep -c "Hono" .planning/REQUIREMENTS.md` = 0
    7. `grep -c "Phase 25" .planning/REQUIREMENTS.md` = 0
    8. `bash tools/security-audit/grep/sec02-cross-tenant.sh` exits 0 + non-empty output
    9. `bash tools/security-audit/grep/sec04-secrets-in-logs.sh` exits 0 + non-empty output
    10. `bash tools/security-audit/grep/sec05-handlers-without-zod.sh` exits 0 + non-empty output
    11. `bash tools/security-audit/grep/sec05-handlers-without-auth.sh` exits 0 + non-empty output
    12. `tools/security-audit/outputs/pnpm-audit-2026-05-17.json` exists, non-empty, starts with `{`

    If ANY gate fails, do NOT commit. Surface the failure to the user.
  </action>
  <verify>
    <automated>git status --short | grep -q "24-SECURITY-AUDIT.md\|tools/security-audit\|solana-security.test.ts\|REQUIREMENTS.md" || git log -1 --pretty=%s | grep -q "feat(24-01): audit security surface"</automated>
  </verify>
  <done>
    All twelve gates pass. One atomic commit lands containing the audit doc, tools/security-audit/ scaffold, captured pnpm audit JSON, appended Solana fuzz test, and REQUIREMENTS.md drift fix. Commit message follows the template above. No push; user opens the PR per project memory.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries (Phase 24 — audit phase)

| Boundary | Description |
|----------|-------------|
| Client → API | Untrusted HTTP requests cross into Express handlers; SEC-05 audits zod schemas + auth middleware presence |
| Tenant A code → Tenant B data | Cross-tenant boundary inside the multi-tenant facilitator; SEC-02 audits `facilitator_id` scoping on every DB query |
| OpenFacilitator → blockchain | Facilitator co-signs / submits payment transactions; SEC-03 audits Solana instruction allowlist + ERC-3009 signature recovery |
| Filesystem / env → application | Secrets cross from env vars into process memory; SEC-04 audits `.env.example` documentation, fallback chains, and console-log leakage |
| Application → log sinks | Sensitive data crosses into structured logs; SEC-04 audits for credential/key leaks via grep pattern |

## STRIDE Threat Register (Phase 24 audit — Plan 1 enumerates, Plan 2 remediates)

The exhaustive threat enumeration for this phase IS the deliverable `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md`. The audit doc contains every finding row with severity, file:line, and disposition. Per CONTEXT.md D-13 and security_threat_model in planning context: this PLAN.md's threat-model block points to the audit doc as the comprehensive register rather than re-enumerating threats here.

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-24-01 | Information Disclosure | Multi-tenant DB queries (`packages/server/src/db/*.ts`) | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-02 — every "unscoped (by-id)" query becomes a SEC-02-NNN finding; Plan 2 adds caller-side ownership checks or accepts with rationale |
| T-24-02 | Elevation of Privilege | Unauthenticated admin endpoints (`admin.ts:1623, 1653, 1687`) | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-01-001/002/003 — Plan 2 deletes the debug endpoints per D-15 |
| T-24-03 | Spoofing | EVM verify path (`facilitator.ts:316-369`) — signature not recovered | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-03-001/002 — Plan 2 adds viem `verifyTypedData` or accepts via SECURITY-DECISIONS.md compensating control (on-chain settlement revert) |
| T-24-04 | Information Disclosure | Console logs of secrets (`facilitator.ts:530-531`, `erc3009.ts:389,392`, etc.) | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-04 secrets-in-logs table — Plan 2 removes or redacts HIGH-severity logs per D-15 |
| T-24-05 | Tampering | ERC-3009 replay protection — in-memory NonceManager | accept (Plan 2 candidate) | See `24-SECURITY-AUDIT.md` §SEC-03-003 — single-instance compensating control documented per D-16; Postgres migration deferred to v1.4+ |
| T-24-06 | Denial of Service | No rate-limit middleware | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-05-005 — Plan 2 installs `express-rate-limit` per D-15 |
| T-24-07 | Tampering | Input validation gaps (handlers without zod) | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-05-001/002/003 — Plan 2 adds zod schemas to the known offenders |
| T-24-08 | Information Disclosure | ACCESS_TOKEN_SECRET fallback chain | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-04-001 — Plan 2 removes fallback, requires explicit env var or fail-closed |
| T-24-09 | Information Disclosure | Dependabot not enabled | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-04-003 — Plan 2 adds `.github/dependabot.yml` or accepts |
| T-24-10 | Tampering | Webhook signature length-mismatch leak (`internal-webhooks.ts:106-120`) | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-05-001 — Plan 2 adds explicit length pre-check |
| T-24-11 | Spoofing | Wallet signature verification commented-out on claim execute (`public.ts:744-749`) | mitigate (Plan 2) | See `24-SECURITY-AUDIT.md` §SEC-05-004 + CONCERNS.md item 7 — Plan 2 implements the verification |

Per ASVS L1 mapping in RESEARCH.md §"Security Domain": V2 (Auth), V3 (Session), V4 (Access Control), V5 (Input Validation), V6 (Crypto), V7 (Logging), V9 (Comms), V10 (Malicious Code dependencies) — all covered by SEC-01..SEC-05.

For the full threat register with file:line, description, and per-finding severity per D-10, see `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md` after Plan 1 ships.
</threat_model>

<verification>
## Phase Verification (mechanical gates per 24-VALIDATION.md)

These are the Plan 1 row-count + fuzz-test gates the `gsd-plan-checker` will run after Plan 1 ships:

| Gate | Target | Verification Command |
|------|--------|----------------------|
| SEC-02 DB-query enumeration rows | ≥ 93 | `awk '/^## §SEC-02/,/^## §SEC-03/' .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md \| grep -cE '^\| (createFacilitator\|getFacilitatorById\|...)' ` ≥ 93 |
| SEC-05 handler enumeration rows | ≥ 124 | row count in `24-SECURITY-AUDIT.md` §SEC-05 handler enumeration table |
| SEC-04 secrets-in-logs grep rows | ≥ 26 | row count in `24-SECURITY-AUDIT.md` §SEC-04 secrets-in-logs table (`grep -c '^\| SEC-04-LOG-' ...` ≥ 26) |
| CONCERNS.md re-validation rows | = 11 | row count in `24-SECURITY-AUDIT.md` CONCERNS re-validation block (`grep -c '^\| [0-9]+ \|' ...` = 11) |
| Solana fuzz tests pass | exit 0 | `pnpm --filter @openfacilitator/integration-tests test:security` exits 0 |
| Solana truncated-data test present | grep | `grep -q "should reject token instruction with truncated data" packages/integration-tests/src/solana-security.test.ts` |
| REQUIREMENTS.md drift fixed (Hono) | grep clean | `grep -c "Hono" .planning/REQUIREMENTS.md` = 0 |
| REQUIREMENTS.md drift fixed (Phase 25) | grep clean | `grep -c "Phase 25" .planning/REQUIREMENTS.md` = 0 |
| tools/security-audit/ scaffold | files exist | `test -x tools/security-audit/run-all.sh && test -x tools/security-audit/grep/sec02-cross-tenant.sh && test -x tools/security-audit/grep/sec04-secrets-in-logs.sh && test -x tools/security-audit/grep/sec05-handlers-without-zod.sh && test -x tools/security-audit/grep/sec05-handlers-without-auth.sh && test -f tools/security-audit/semgrep/openfacilitator.yaml && test -f tools/security-audit/README.md` |
| pnpm audit JSON captured | file exists | `test -s tools/security-audit/outputs/pnpm-audit-2026-05-17.json` |
| Severity rubric at top of audit doc | content gate | `grep -q "CRITICAL — exploitable now without further development" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md` |
| Three known-finding file:line refs | content gate | `grep -q "admin.ts:1623" 24-SECURITY-AUDIT.md && grep -q "admin.ts:1653" 24-SECURITY-AUDIT.md && grep -q "admin.ts:1687" 24-SECURITY-AUDIT.md` |
| EVM signature-recovery gap recorded | content gate | `grep -q "facilitator.ts:316-369" .planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md` |

## Manual-Only Verifications (deferred to Plan 2 or post-Plan-1 runtime check)

| Behavior | Why Manual | Test Instructions |
|----------|------------|-------------------|
| Better Auth cookie flags at runtime (HttpOnly/Secure/SameSite per RESEARCH.md A1) | Requires running server + inspecting Set-Cookie header | `curl -i -X POST http://localhost:3000/api/auth/sign-in/email -d '...'` and read Set-Cookie. Document in Plan 2 if discrepancy found. |
| Dependabot enablement at GitHub repo level | Requires GitHub UI / API access | `gh api repos/{owner}/{repo}/vulnerability-alerts` — Plan 2 either commits `.github/dependabot.yml` or records acceptance |
| Severity assignment per finding | Human judgement against D-10 rubric | Auditor signs off in `24-SECURITY-AUDIT.md` Findings Count block after final pass |
</verification>

<success_criteria>
Plan 1 succeeds when ALL of the following are true (cross-referenced with ROADMAP §Phase 24 success criteria):

1. **(ROADMAP #1 — Auth audit)** `24-SECURITY-AUDIT.md` §SEC-01 has findings table with ≥3 rows (the three confirmed admin.ts:1623/1653/1687 gaps) plus auditor-added rows for Better Auth concerns. Cookie-flag runtime check is documented as a future verification gate (RESEARCH.md A1).

2. **(ROADMAP #2 — Multi-tenant audit)** §SEC-02 has an enumeration table with ≥93 rows, every row classified per the RESEARCH.md §1 key. Candidate findings (unclear by-id queries) appear in the Findings table below the enumeration. Gaps marked open for Plan 2.

3. **(ROADMAP #3 — Co-signing audit)** §SEC-03 documents Solana 4-layer allowlist completeness (positive note), ERC-3009 NonceManager structure (HIGH finding for in-memory only), EVM verify signature-recovery gap (HIGH/CRITICAL finding at facilitator.ts:316-369). Solana fuzz tests exit 0 and now cover the truncated-data gap.

4. **(ROADMAP #4 — Secrets + Input validation)** §SEC-04 has ≥26 secrets-in-logs rows + ACCESS_TOKEN_SECRET fallback finding + Dependabot finding + encryption-at-rest positive note. §SEC-05 has ≥124 handler enumeration rows + rate-limit absence + webhook-signature length-mismatch + zod gaps + CORS + CSP findings.

5. **(ROADMAP #5 — Fix-or-accept)** Plan 1 does NOT fix or accept anything — that is Plan 2 territory per D-13. Plan 1 produces the finding inventory that Plan 2 acts on. Phase 24 is only complete after Plan 2 ships.

6. **(D-03 drift fix)** `.planning/REQUIREMENTS.md` has zero "Hono" matches and zero "Phase 25" matches; six SEC-01..SEC-06 rows now say "Phase 24"; footer notes the drift fix.

7. **(D-05 tooling)** `tools/security-audit/` has four executable grep scripts, one semgrep YAML, one README, one driver script, one outputs/ subdirectory with the pnpm-audit JSON. All bash scripts use `#!/usr/bin/env bash` + `set -euo pipefail`.

8. **(D-02 CONCERNS)** Top-of-doc re-validation block has exactly 11 rows; "Resolved by removal" note states no items resolved by Phase 22/23.

9. **(Atomicity per RESEARCH.md §12)** All deliverables land in one git commit per Phase 22 D-05 / Phase 23 D-04 precedent.

Plan 2 (24-02-REMEDIATION-PLAN.md) is **NOT** created in this run — per CONTEXT.md `<specifics>`: "Plan 24-02 only exists once Plan 24-01 ships."
</success_criteria>

<output>
After completion, create `.planning/phases/24-security-audit-remediation/24-01-SUMMARY.md` per the standard execute-plan workflow. Summary should include:

- Finding counts by severity (the live numbers from §"Findings Count" in the audit doc)
- The 3-5 highest-severity findings (one-line each) for Plan 2's input
- Confirmation that pnpm audit baseline is captured + diffable
- Confirmation that REQUIREMENTS.md drift is fixed
- Pointer to `tools/security-audit/run-all.sh` for re-running the audit
- Note: "Plan 24-02 (Remediation) is to be planned next via `/gsd-plan-phase 24` (re-invocation will produce Plan 02 because Plan 01 is now complete)."
</output>
