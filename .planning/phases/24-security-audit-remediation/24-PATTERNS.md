# Phase 24: Security Audit & Remediation — Pattern Map (Plan 1 only)

**Mapped:** 2026-05-17
**Files classified:** 10 (8 new + 2 modified)
**Analogs found:** 5 strong / 10 total (5 are first-of-their-kind — see "No analog found" section)

---

## File Classification

| File | New / Mod | Role | Closest Analog | Match Quality |
|------|-----------|------|----------------|---------------|
| `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md` | New | audit doc (findings artifact) | `.planning/phases/22-storefronts-removal/22-VERIFICATION.md` + `23-VERIFICATION.md` | structural-match (severity rubric + findings tables are new shape) |
| `tools/security-audit/README.md` | New | tool docs | none in repo | **no analog** — scaffold from scratch |
| `tools/security-audit/run-all.sh` | New | driver shell script | `.husky/pre-commit`, `.husky/pre-push` (trivially short) | **partial** — no project bash conventions exist; propose `set -euo pipefail` |
| `tools/security-audit/grep/sec02-cross-tenant.sh` | New | grep wrapper shell script | RESEARCH.md §1 baseline command (literal grep recipe) | content-match |
| `tools/security-audit/grep/sec04-secrets-in-logs.sh` | New | grep wrapper shell script | RESEARCH.md §5 grep recipe (the D-05 verbatim pattern) | content-match |
| `tools/security-audit/grep/sec05-handlers-without-zod.sh` | New | grep wrapper shell script | RESEARCH.md §2 grep recipe | content-match |
| `tools/security-audit/grep/sec05-handlers-without-auth.sh` | New | grep wrapper shell script | RESEARCH.md §2 grep recipe (auth flank) | content-match |
| `tools/security-audit/semgrep/openfacilitator.yaml` | New | semgrep custom rules YAML | `.github/workflows/integration-tests.yml` (YAML reference only — different schema) | **no analog** — scaffold from semgrep registry docs |
| `tools/security-audit/outputs/pnpm-audit-2026-05-17.json` | New | captured tool output | none in repo | **no analog** — `pnpm audit --json` output is self-describing |
| `.planning/REQUIREMENTS.md` | Modified | planning doc edit (drift fix) | Phase 23 D-04 amendment to REWARDS-02 line | exact precedent |
| `packages/integration-tests/src/solana-security.test.ts` | Modified (append 1 test) | unit test append | existing tests in the same file (`should reject token CloseAccount instruction (type 9)` at lines 562–587 — same manual-buffer construction shape as the "truncated data" test) | exact in-file analog |

---

## Pattern Assignments

### `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md` (audit doc / findings artifact)

**Role:** Findings artifact per D-09 — single file holding the severity rubric, sections per SEC-NN, findings tables, DB-enumeration table, CONCERNS re-validation, secrets-in-logs table.

**Closest analog:** `.planning/phases/22-storefronts-removal/22-VERIFICATION.md` for the YAML frontmatter shape + table-heavy body. `23-VERIFICATION.md` for the multi-section structure (Goal Achievement / Required Artifacts / Anti-Patterns / Human Verification Required).

**Why not a perfect match:** VERIFICATION.md is a phase-level pass/fail report; `24-SECURITY-AUDIT.md` is a *findings* artifact. The skeleton is similar (frontmatter + tables + scope/methodology/findings per section) but the severity rubric block (D-10) and the "Resolved by removal" sub-section per SEC-NN (D-09) are new shapes. The audit doc has no overall pass/fail — it's an enumeration.

**Excerpt — frontmatter template from `22-VERIFICATION.md` lines 1–9** (copy-shape, change `verified` → `audited`, replace `score` with `findings_count` per severity):

```markdown
---
phase: 22-storefronts-removal
verified: 2026-05-17T13:47:00Z
status: passed
score: 5/5 must-haves verified
overrides_applied: 0
gaps: []
human_verification: []
---
```

**Excerpt — section-table pattern from `22-VERIFICATION.md` lines 20–28** (the "Observable Truths" table — same `| col | col |` shape that SEC-NN findings tables will use):

```markdown
| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | No storefront references remain in source code (excluding exempt migration/smoke files) | VERIFIED | All 6 modified source files return 0 hits on `grep -ci storefront`. ... |
| 2 | Migration 004 runs cleanly on fresh and existing DB, dropping storefront tables | VERIFIED | Fresh DB: smoke test passed on `/tmp` DB. ... |
```

**Excerpt — multi-section "Anti-Patterns Found" pattern from `22-VERIFICATION.md` lines 83–88** (shape to reuse for SEC-NN Findings table — same columns):

```markdown
| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `apps/dashboard/src/app/dashboard/[id]/page.tsx` | 23 | `Store,` imported from lucide-react but never referenced | Warning | Dead import from removed Storefronts tab button; triggers linter warnings; no functional impact |
```

**Excerpt — concrete sample SEC-01 finding row the planner can drop verbatim into `24-SECURITY-AUDIT.md`** (constructed from RESEARCH.md §2 confirmed findings):

```markdown
| ID | severity | title | file:line | description | status |
|----|----------|-------|-----------|-------------|--------|
| SEC-01-001 | CRITICAL | Unauthenticated debug endpoint allows custom_domain rebind (multi-tenant breakout) | packages/server/src/routes/admin.ts:1653 | `PATCH /facilitators/:id/domains` is mounted without `requireAuth` middleware. Any unauthenticated caller can rewrite `custom_domain` and `additional_domains` on any facilitator, routing a victim's domain to attacker-controlled config. Originally CONCERNS.md #1. | open |
| SEC-01-002 | HIGH | Unauthenticated debug endpoint exposes raw facilitator record | packages/server/src/routes/admin.ts:1623 | `GET /facilitators/:id/raw` returns the full facilitator record (excluding encrypted keys) without auth. Originally CONCERNS.md #1. | open |
| SEC-01-003 | HIGH | `/subscriptions/clear` is auth-gated but has no admin role check | packages/server/src/routes/admin.ts:1687 | `DELETE /subscriptions/clear` requires `requireAuth` only — any logged-in user can delete all subscriptions. `requireAdmin` was removed in Phase 23 D-07 and never replaced with a role-based check. | open |
```

**Excerpt — severity rubric block (D-10 verbatim) the planner pastes at the top of `24-SECURITY-AUDIT.md`** (constructed from CONTEXT.md D-10, four lines):

```markdown
## Severity Rubric

- **CRITICAL** — exploitable now without further development, results in immediate data loss, funds loss, or full multi-tenant breakout
- **HIGH** — exploitable with non-trivial effort, OR an exploitable path with significant blast radius, OR a known issue from CONCERNS.md that has not been mitigated
- **MEDIUM** — defense-in-depth gap, exploitable only with chained conditions, or hardening that materially raises attacker cost
- **LOW** — nit / hygiene / documentation gap
```

**Notes for planner:**
- The audit doc has no `score` field in frontmatter — replace with `findings_count: {critical: N, high: N, medium: N, low: N}` or omit frontmatter entirely (D-09 is silent on frontmatter).
- Section order per D-09: Severity rubric → SEC-01 → SEC-02 → SEC-03 → SEC-04 → SEC-05. Each SEC section: Scope / Methodology / Findings table / Resolved by removal.
- The CONCERNS.md re-validation table from RESEARCH.md §6 (11 rows) belongs **once at the top** before the SEC sections — not duplicated under each SEC. Per D-09 it's the seed for the per-section findings tables.
- Row-count gates per RESEARCH.md §8: SEC-02 enumeration ≥ 93 rows; SEC-05 handler enum ≥ 124 rows; SEC-04 secrets table ≥ 26 rows; CONCERNS re-validation = 11 rows.

---

### `tools/security-audit/README.md` (tool documentation)

**Role:** Plain-prose README explaining how to re-run the audit. Documents `run-all.sh` invocation, per-script grep purposes, semgrep install instructions, expected output locations.

**Closest analog:** **None in repo.** No `tools/` directory exists; no `scripts/README.md` exists at any level. `packages/server/scripts/` has TS scripts with file-header JSDoc but no README.

**Notes for planner:**
- Scaffold from scratch. Suggested skeleton (planner adjusts):
  1. What this directory is (the SEC-NN re-runnable audit gates).
  2. How to run all: `bash tools/security-audit/run-all.sh`.
  3. How to run one: `bash tools/security-audit/grep/sec02-cross-tenant.sh`.
  4. How to install semgrep (best-effort) and where the rules live.
  5. How outputs are interpreted (zero = clean; non-zero = re-investigate).
- Length target: 60–120 lines. Keep it operator-focused — not a security-policy doc.

---

### `tools/security-audit/run-all.sh` (driver shell script)

**Role:** Top-level driver that runs all grep gates + `pnpm audit --json` and prints a one-line pass/fail summary per gate.

**Closest analog:** **No analog inside the repo** for repo-level bash tooling. `.husky/pre-commit` (1 line: `pnpm lint`) and `.husky/pre-push` (1 line: `pnpm --filter=@openfacilitator/sdk test run`) are the only shell scripts in the project tree, and they are trivially short and use bare commands with no `set -e`.

**Excerpt — `.husky/pre-commit` (entire file, 1 line):**

```bash
pnpm lint
```

**Notes for planner:**
- **First of its kind.** Propose this bash header (project has no precedent so pick the standard safe one):
  ```bash
  #!/usr/bin/env bash
  set -euo pipefail
  ```
- Echo each gate's name before running so log output is greppable: `echo "[SEC-02] cross-tenant query check"`.
- Exit code convention: 0 if every gate passes, non-zero if any gate fails. The script is informational during Plan 1 (the audit is reading the output, not enforcing it), but the same script should be safely wireable into CI later (per D-05 "wireable into CI" criterion, even though CI integration is explicitly out of scope per CONTEXT.md "Deferred Ideas").
- Capture `pnpm audit --json > tools/security-audit/outputs/pnpm-audit-$(date +%Y-%m-%d).json` so the dated artifact rotates per run.

---

### `tools/security-audit/grep/sec02-cross-tenant.sh` (SEC-02 grep wrapper)

**Role:** Wraps the RESEARCH.md §1 baseline grep into a re-runnable shell script with explanatory header comment.

**Closest analog:** RESEARCH.md §1 supplies the verbatim grep:

```bash
grep -nE "db\.prepare\(.*(SELECT|UPDATE|DELETE).*FROM (transactions|products|product_payments|webhooks|proxy_urls|resource_owners|registered_servers|claims|refund_wallets|refund_configs|facilitators)" packages/server/src/ --include="*.ts"
```

**Notes for planner:**
- Wrap the grep in a script that:
  1. Echoes the SEC-02 purpose + what to look for in the output.
  2. Runs the grep from the script's directory's nearest repo-root.
  3. Notes that matches missing a `WHERE ... facilitator_id` clause are the audit signal.
- The script does NOT itself decide pass/fail — humans inspect the matches because cross-tenant-by-design queries (per RESEARCH.md §1 classification key) are intentional. Print this caveat in the script's leading comment.

---

### `tools/security-audit/grep/sec04-secrets-in-logs.sh` (SEC-04 grep wrapper)

**Role:** Re-runnable form of the D-05 SEC-04 grep pattern. RESEARCH.md §5 confirms it currently yields 26 matches.

**Closest analog:** D-05 / CONTEXT.md line 34 specifies the pattern; RESEARCH.md §5 supplies the exact command:

```bash
grep -rEn 'console\.(log|error|info|warn).*(privateKey|secretKey|signingKey|authorization|signature|ENCRYPTION_KEY|BETTER_AUTH_SECRET|ACCESS_TOKEN_SECRET)' packages/ apps/ --include='*.ts' --include='*.tsx'
```

The CONTEXT.md D-05 example list (line 34) names the identifier set verbatim — keep them in sync.

**Notes for planner:**
- Echo "Expected: 26 matches as of 2026-05-17" in the header comment so any future drift is loud.
- Plan 2's verification gate (per CONTEXT.md "Claude's Discretion" final bullet: `grep -rE 'console\.(log|error|info).*(privateKey|secretKey|signingKey|BETTER_AUTH_SECRET|ENCRYPTION_KEY)' packages/ apps/ --include='*.ts' --include='*.tsx'` must yield zero matches after Plan 2) uses a **subset** of identifiers. This script is the Plan 1 "find them all" pattern; Plan 2 will reuse this same script and aim for zero on the worst offenders.

---

### `tools/security-audit/grep/sec05-handlers-without-zod.sh` (SEC-05 grep wrapper — missing zod)

**Role:** Re-runnable form of the D-05 SEC-05 grep — finds Express handlers reading `req.body`/`req.query`/`req.params` whose nearby lines do NOT contain `z.object` / `.safeParse(` / `.parse(`.

**Closest analog:** RESEARCH.md §2 supplies the signal:

```bash
grep -nE "req\.(body|query|params)" packages/server/src/routes/*.ts
```

Cross-reference against the zod pattern:

```bash
grep -nE "safeParse|\.parse\(|z\.object" packages/server/src/routes/*.ts
```

**Notes for planner:**
- The single grep doesn't itself answer "missing zod". A two-step approach inside the script is fine: print req.body usage, then print zod usage, then leave the diff/correlation to the auditor. Document this caveat in the script's leading comment so users don't expect a one-line yes/no.
- Known gaps per RESEARCH.md §2: `internal-webhooks.ts:159` and `admin.ts:1653`. The script can hard-code these as "expected to surface" in its comment.

---

### `tools/security-audit/grep/sec05-handlers-without-auth.sh` (SEC-05 grep wrapper — missing requireAuth)

**Role:** Re-runnable form of the D-05 SEC-05 grep — finds `router.(get|post|put|patch|delete)` lines that do NOT mention `requireAuth` or `requireFacilitator` on the same line.

**Closest analog:** RESEARCH.md §2 / §3 confirms three known offenders (admin.ts:1623, 1653, 1687).

**Notes for planner:**
- A practical pattern:
  ```bash
  grep -nE "router\.(get|post|put|patch|delete)\(" packages/server/src/routes/*.ts \
    | grep -vE "requireAuth|requireFacilitator|optionalAuth"
  ```
- Caveat (document in script comment): some routes apply auth via `router.use(requireAuth)` once and then mount handlers — the per-line grep will produce false positives. Auditor cross-references against `router.use(` lines.

---

### `tools/security-audit/semgrep/openfacilitator.yaml` (custom semgrep rules YAML)

**Role:** Custom semgrep rules committed even if semgrep is not installed locally (per RESEARCH.md §7). Forward-looking — future CI runs will execute these.

**Closest analog:** **No analog in the repo.** No `.semgrep.yml`, no other `.yaml` rule files. `.github/workflows/integration-tests.yml` is YAML but its schema is GitHub Actions, not semgrep.

**Notes for planner:**
- Scaffold from semgrep's public registry shape. Minimum content:
  ```yaml
  rules:
    - id: of-no-console-secret
      pattern-either:
        - pattern: console.log(..., $X, ...)
        - pattern: console.error(..., $X, ...)
      pattern-where:
        - metavariable-regex:
            metavariable: $X
            regex: '(privateKey|secretKey|signingKey|BETTER_AUTH_SECRET|ENCRYPTION_KEY|ACCESS_TOKEN_SECRET)'
      message: "Sensitive identifier appears in console.log/error — SEC-04"
      severity: ERROR
      languages: [typescript]
  ```
- Mirror the grep patterns in `grep/sec04-secrets-in-logs.sh` so both tools have the same coverage. The file lives even when semgrep is uninstalled — committed for future re-runs.
- Plan 1 includes ONE attempted install line in `run-all.sh`: `command -v semgrep >/dev/null || brew install semgrep 2>/dev/null || pip install semgrep 2>/dev/null || echo "semgrep not installed — grep patterns are the authoritative gate"`. Don't fail the script if install fails (RESEARCH.md §7).

---

### `tools/security-audit/outputs/pnpm-audit-2026-05-17.json` (captured tool output)

**Role:** Raw `pnpm audit --json` output captured at the time of Plan 1 execution, committed for diffability against future audits.

**Closest analog:** **None.** The file content is whatever `pnpm audit --json` emits at runtime.

**Notes for planner:**
- Generated by `pnpm audit --json > tools/security-audit/outputs/pnpm-audit-$(date +%Y-%m-%d).json` from `run-all.sh`.
- The filename date is per CONTEXT.md D-decisions (the file lives under `outputs/` and rotates per run).
- Don't try to validate the JSON shape in advance — `pnpm audit --json` is self-describing.

---

### `.planning/REQUIREMENTS.md` (Modified — drift fix per D-03)

**Role:** Two-line planning-doc edit folded into the same commit as the audit deliverables (atomicity per RESEARCH.md §12, mirroring Phase 22 D-05 and Phase 23 D-04).

**Closest analog:** Phase 23 D-04 (REWARDS-02 description corrected in the same commit as the removal). Phase 22 D-05 (atomic commit pattern). Both are documented in those phase CONTEXT.md files.

**Excerpt — current line 37 (verified by direct read just now):**

```markdown
- [ ] **SEC-05**: Input validation and API hardening audited (Hono route schemas, webhook signature verification, rate limits)
```

**Excerpt — target line 37 (per D-03 + RESEARCH.md §11):**

```markdown
- [ ] **SEC-05**: Input validation and API hardening audited (Express route schemas, webhook signature verification, rate limits)
```

**Excerpt — current lines 81–86 (verified by direct read just now):**

```markdown
| SEC-01 | Phase 25 | Planning |
| SEC-02 | Phase 25 | Planning |
| SEC-03 | Phase 25 | Planning |
| SEC-04 | Phase 25 | Planning |
| SEC-05 | Phase 25 | Planning |
| SEC-06 | Phase 25 | Planning |
```

**Excerpt — target lines 81–86 (per D-03 + RESEARCH.md §11):**

```markdown
| SEC-01 | Phase 24 | Planning |
| SEC-02 | Phase 24 | Planning |
| SEC-03 | Phase 24 | Planning |
| SEC-04 | Phase 24 | Planning |
| SEC-05 | Phase 24 | Planning |
| SEC-06 | Phase 24 | Planning |
```

**Notes for planner:**
- Line numbers in RESEARCH.md §11 (line 37 for SEC-05 wording, lines 81–86 for traceability) are **confirmed correct** as of this pattern-mapping pass.
- Per Phase 23 precedent (verification report lines 121–123), the `Status` column stays `Planning` — checkbox-ticking and Status flips are post-milestone editorial decisions, not the audit run's responsibility.
- The Status column does NOT change in this drift fix; only the Phase column changes ("Phase 25" → "Phase 24" on all six rows).

---

### `packages/integration-tests/src/solana-security.test.ts` (Modified — append ONE new test case)

**Role:** Append a single new `it(...)` block per RESEARCH.md §9 — fills the D-07 "oversized/truncated instruction data" gap. No other edits.

**Closest analog:** The **same file** already contains the exact scaffold the new test must follow. Most directly: `should reject token CloseAccount instruction (type 9)` at lines 562–587, which constructs a `TransactionInstruction` with manual `Buffer.alloc(1)` data — the same approach the new test needs (manually craft truncated bytes instead of using the SDK helper).

**Excerpt — `solana-security.test.ts` lines 562–587 (the analog test, verbatim):**

```typescript
    it('should reject token CloseAccount instruction (type 9)', async () => {
      // Manually construct CloseAccount (type 9) since there may not be a helper
      const closeAccountData = Buffer.alloc(1);
      closeAccountData.writeUInt8(9, 0);

      const tx = buildTransaction({
        feePayer: feePayerPubkey,
        blockhash,
        instructions: [
          new TransactionInstruction({
            programId: TOKEN_PROGRAM_ID,
            keys: [
              { pubkey: facilitatorATA, isSigner: false, isWritable: true },  // account to close
              { pubkey: payerPubkey, isSigner: false, isWritable: true },     // destination for rent
              { pubkey: feePayerPubkey, isSigner: true, isWritable: false },  // owner
            ],
            data: closeAccountData,
          }),
        ],
      });

      const result = await facilitator.verify(makePayload(tx, payerPubkey, payTo), requirements);

      expect(result.isValid).toBe(false);
      console.log('  Attack 5c rejected:', result.invalidReason);
    });
```

**Excerpt — `solana-security.test.ts` helper signatures the new test reuses** (already imported at the top of the file, lines 14–38):

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import { OpenFacilitator } from '@openfacilitator/sdk';
import { TEST_CONFIG } from './setup';
import {
  Connection, Keypair, PublicKey, Transaction, TransactionInstruction,
  SystemProgram, ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  createTransferInstruction, ..., TOKEN_PROGRAM_ID, ..., getAssociatedTokenAddress,
} from '@solana/spl-token';
```

**Excerpt — `buildTransaction` helper signature already in the file (lines 70–87 — DO NOT re-add):**

```typescript
function buildTransaction(options: BuildTxOptions): string {
  const tx = new Transaction();
  tx.feePayer = options.feePayer;
  tx.recentBlockhash = options.blockhash;
  for (const ix of options.instructions) { tx.add(ix); }
  if (options.signers?.length) { tx.partialSign(...options.signers); }
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false }).toString('base64');
}
```

**Notes for planner:**
- Insertion location: inside the existing `describe('attack vector 5: token delegation via approve/setAuthority', ...)` block — append after the `MintTo` test (the block ending at line 615), OR alternatively introduce a new `describe('attack vector 6: malformed instruction data', ...)` block immediately before the `payment requirements validation` describe at line 621.
- Test body shape (per RESEARCH.md §9 recommendation, planner finalizes the literal expectation regex):
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
- All helpers (`buildTransaction`, `makePayload`, `deriveATA`, `payerATA`/`payToATA`/`facilitatorATA`, `payerKeypair`, `payerPubkey`, `feePayerPubkey`, `blockhash`, `requirements`) are **already available in scope** — no new imports, no new fixtures.
- Reuses the file's existing convention of logging the rejection reason via `console.log('  ... rejected:', result.invalidReason)` for human-readable test output.

---

## Shared Patterns

### Atomic-commit drift-fix idiom

**Source:** Phase 22 D-05 + Phase 23 D-04 (see `.planning/phases/22-storefronts-removal/22-CONTEXT.md` and `.planning/phases/23-rewards-removal-backend-frontend-docs/23-CONTEXT.md`).

**Apply to:** Plan 1 commit. The audit deliverables + `tools/security-audit/` files + `pnpm-audit-*.json` + the REQUIREMENTS.md drift fix + the appended solana-security test case all land in **one atomic commit**, per RESEARCH.md §12.

**Excerpt — Phase 23 plan front-matter `truths` showing the atomic commit framing (`23-01-PLAN.md` lines 53–63):**

```yaml
- "Single atomic commit per D-15 means the build is never half-broken."
```

### Bash header convention (when first-of-its-kind is unavoidable)

**Source:** Repo has no bash convention (`.husky/pre-commit` and `.husky/pre-push` are 1-line each with no shebang/no set flags — too trivial to copy from).

**Apply to:** All four `tools/security-audit/grep/*.sh` files + `tools/security-audit/run-all.sh`. Use:

```bash
#!/usr/bin/env bash
set -euo pipefail
```

Plus a leading `#` comment block stating the SEC-NN purpose, the expected match count as of 2026-05-17 (so future drift is loud), and the caveat (auditor interprets matches; some are intentional cross-tenant-by-design).

### Findings-table column shape (audit doc)

**Source:** `22-VERIFICATION.md` "Anti-Patterns Found" table (lines 83–88).

**Apply to:** Every SEC-NN findings table inside `24-SECURITY-AUDIT.md`. The exact columns differ (D-09 specifies `ID | severity | title | file:line | description | status`) but the markdown-table-with-header-row idiom is identical to the verification reports the project already produces.

---

## No Analog Found

Files with no close match in the codebase — planner must scaffold from scratch using the conventions documented above:

| File | Role | Reason |
|------|------|--------|
| `tools/security-audit/README.md` | tool docs | No `tools/` or `scripts/README.md` precedent exists anywhere in the repo. |
| `tools/security-audit/semgrep/openfacilitator.yaml` | semgrep custom rules | Only YAML in the repo is GitHub Actions; semgrep schema is wholly different. Scaffold from semgrep registry docs. |
| `tools/security-audit/outputs/pnpm-audit-2026-05-17.json` | tool output | Content is whatever `pnpm audit --json` emits; not authored by hand. |
| `tools/security-audit/run-all.sh` + four `grep/*.sh` files | shell scripts | Repo has effectively no bash scripts of its own beyond `.husky` 1-liners. Use `set -euo pipefail` as the conservative default. |

The `24-SECURITY-AUDIT.md` shape is a partial-analog case — frontmatter and markdown-table conventions transfer from `22-VERIFICATION.md` / `23-VERIFICATION.md`, but the severity rubric block, the multi-section-per-SEC-NN scope/methodology/findings/resolved-by-removal layout, and the DB-enumeration mega-table (≥93 rows per RESEARCH.md §8) are new shapes the planner must compose.

---

## Summary (one-paragraph scan)

Phase 24 Plan 1 produces ten deliverables: a single findings doc (`24-SECURITY-AUDIT.md`) whose **structural shape** copies the frontmatter and markdown-table idioms from `22-VERIFICATION.md` but whose **content layout** (severity rubric → per-SEC scope/methodology/findings tables + "resolved by removal" sub-section, plus a ≥93-row DB enumeration and a ≥26-row secrets-in-logs table) is a new shape the planner composes from D-09/D-10 specs; a one-test append to `packages/integration-tests/src/solana-security.test.ts` whose exact analog (`should reject token CloseAccount instruction (type 9)`, lines 562–587) lives in the same file and supplies the manual-buffer + `TransactionInstruction` scaffold verbatim; a two-line drift fix in `.planning/REQUIREMENTS.md` at line 37 (Hono→Express) and lines 81–86 (Phase 25→Phase 24 ×6) per the Phase 22 D-05 / Phase 23 D-04 atomic-commit-with-drift-fix precedent; and a new `tools/security-audit/` directory whose six executable files (one driver, four grep wrappers, one semgrep YAML) plus README and dated `pnpm-audit-*.json` output have **no in-repo analog** — the planner scaffolds them with `#!/usr/bin/env bash` + `set -euo pipefail` headers, with the grep patterns drawn verbatim from RESEARCH.md §1/§2/§5 and a one-rule starter semgrep YAML for SEC-04 console-log-of-secrets. The whole Plan 1 commit is atomic per RESEARCH.md §12.
