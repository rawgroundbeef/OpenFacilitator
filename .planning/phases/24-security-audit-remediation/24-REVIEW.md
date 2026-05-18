---
phase: 24-security-audit-remediation
reviewed: 2026-05-17T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - tools/security-audit/README.md
  - tools/security-audit/run-all.sh
  - tools/security-audit/grep/sec02-cross-tenant.sh
  - tools/security-audit/grep/sec04-secrets-in-logs.sh
  - tools/security-audit/grep/sec05-handlers-without-zod.sh
  - tools/security-audit/grep/sec05-handlers-without-auth.sh
  - tools/security-audit/semgrep/openfacilitator.yaml
  - packages/integration-tests/src/solana-security.test.ts
findings:
  critical: 6
  warning: 9
  info: 4
  total: 19
status: issues_found
---

# Phase 24: Code Review Report

**Reviewed:** 2026-05-17T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This review covers the Phase 24-01 audit *tooling* (re-runnable grep gates, semgrep rules, driver script, README) and the appended Solana fuzz test. Per the scope note, the audit findings themselves (`24-SECURITY-AUDIT.md`) are not reviewed.

The tooling exhibits a recurring pattern: **silent failure modes that allow the audit gate to return false-clean.** Six BLOCKER-class defects make the audit gate untrustworthy in its current form — most notably:

- `run-all.sh` invokes `brew install` / `pip install` unattended (system-modifying side effect on every run).
- Every grep gate silently produces zero matches when not run from the repo root (cwd assumption is undocumented and unverified).
- `run-all.sh` writes `pnpm audit` JSON to `$OUTPUTS_DIR` without ever creating that directory — combined with `|| true`, a failed write prints "Captured: ... ( bytes)" and exits 0.
- `sec02-cross-tenant.sh` regex misses ~66% of `db.prepare` calls in the audited tree (138 prepare statements; regex matches 46). It is single-line-only, omits `INSERT`, and the table allowlist is missing five of the tables in the SEC-02 plan.
- `sec05-handlers-without-zod.sh` regex `\.parse\(` matches `JSON.parse`/`Date.parse`/`parseInt` — 47 of 48 admin.ts hits are false positives, making the "auditor correlates" step infeasible.
- Solana fuzz tests under "attack vectors 1b, 2, 4b, 5c, 5d" omit signers entirely; the verifier may reject for missing signatures, not the security layer being tested. The negative `expect(isValid).toBe(false)` then passes for the wrong reason.

WARNINGs cover false-positive bloat in SEC-04 (regex hits "signature" inside human-readable strings like `"facilitator will add fee payer signature"`), duplicated grep work in `sec04-secrets-in-logs.sh`, stale README references to scripts that don't exist (`pnpm test:solana-all`), the unguarded happy-path settlement test that will spend real mainnet USDC if a local keypair exists, and assertions written as tautologies (`not.toContain('validation failed')`).

These defects do not block the *audit document* from being a useful one-shot snapshot, but they do block the tooling from delivering its stated purpose: *re-runnable, diffable* future audits per D-05.

## Critical Issues

### CR-01: Driver script silently installs system packages on every run

**File:** `tools/security-audit/run-all.sh:19-23`
**Issue:** When semgrep is missing, the driver runs `brew install semgrep 2>/dev/null || pip install semgrep 2>/dev/null` unattended. This is a destructive, network-dependent, multi-minute side effect that:
1. Modifies the user's system without consent (Homebrew may install dozens of dependencies — ca-certificates, openssl@3, cryptography, python@3.14, tree-sitter, etc.).
2. Will hang or fail on CI runners without Homebrew/pip, with no clear error path (the `|| echo` swallows failure but the install attempt may already have written partial state).
3. Contradicts the README which states semgrep is "optional".
4. The `2>/dev/null` swallows the install's own error output, so when it does fail the user has no diagnostic.

Verified empirically: running this script triggered an unprompted Homebrew install of 13+ packages.

**Fix:**
```bash
# Replace lines 19-23 with a passive check:
if ! command -v semgrep >/dev/null 2>&1; then
  echo "[INFO] semgrep not installed — skipping semgrep rules."
  echo "[INFO] To install: brew install semgrep   (or: pip install semgrep)"
  echo "[INFO] grep patterns are the authoritative gate per RESEARCH.md §7"
fi
```

---

### CR-02: All grep gates silently return zero matches when run outside the repo root

**File:** `tools/security-audit/grep/sec02-cross-tenant.sh:9`, `sec04-secrets-in-logs.sh:11`, `sec05-handlers-without-zod.sh:10,14`, `sec05-handlers-without-auth.sh:10,15`
**Issue:** Each script greps relative paths (`packages/server/src/`, `packages/`, `apps/`). When run from any directory other than the repo root, grep returns "No such file or directory" — but the trailing `|| true` swallows the non-zero exit, and the script exits 0 with no output. This breaks the README contract that says **"zero matches means the pattern is clean at HEAD."** A reviewer who runs the gate from a worktree subdirectory or a CI step with the wrong cwd gets a false-clean signal.

Verified empirically:
```
$ cd /tmp && bash .../sec02-cross-tenant.sh
Expected ~ many matches as of 2026-05-17 — auditor classifies ...
exit=0
```

**Fix:** Anchor every script to the repo root explicitly, or fail loudly when the expected paths don't exist:
```bash
# At the top of each script (after set -euo pipefail):
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$REPO_ROOT"

# Then validate the audit tree:
if [[ ! -d packages/server/src ]]; then
  echo "[ERROR] Expected packages/server/src under $REPO_ROOT — wrong cwd?" >&2
  exit 2
fi
```

---

### CR-03: SEC-02 cross-tenant grep misses ~66% of DB queries and omits INSERT entirely

**File:** `tools/security-audit/grep/sec02-cross-tenant.sh:9`
**Issue:** The regex
```
db\.prepare\(.*(SELECT|UPDATE|DELETE).*FROM (transactions|products|...)
```
has three independent defects, each one alone causing significant false negatives. Together they invalidate the gate:

1. **Single-line-only.** The regex requires `db.prepare(`, the verb, and `FROM <table>` on one line. Multi-line template-literal SQL (e.g., `db.prepare(\`\n   SELECT ... FROM transactions ...\n\`)`) — used heavily in `claims.ts`, `facilitators.ts`, `products.ts`, `webhooks.ts` — is invisible.
2. **No INSERT.** `INSERT INTO <table>` is missing from the verb alternation. SEC-02 cross-tenant risk applies to writes too (an INSERT without `facilitator_id` creates an unscoped row). Verified: 10+ `INSERT INTO` statements across `db/*.ts` are not matched.
3. **Table allowlist is short.** The SEC-02 audit plan covers 17 tables (`24-01-AUDIT-PLAN.md` lines 146-162). The regex's allowlist covers only 11. Missing: `subscriptions`, `subscription_payments`, `user_wallets`, `user_preferences`, `notifications`, `pending_facilitators`. New DB code targeting these tables passes silently.

Verified coverage: `grep -rEn "db\.prepare\(" packages/server/src/db/*.ts | wc -l` → 138 prepare statements. The script matches 46 of them — a 66% miss rate.

**Fix:** Use ripgrep with `--multiline` (or `grep -P` with `(?s)`), broaden the verb set, and synchronize the table list with the SEC-02 plan:
```bash
# Prefer rg for multiline support:
rg --multiline --multiline-dotall -nE \
  'db\.prepare\(\s*[`"\'\''][\s\S]*?(SELECT|UPDATE|DELETE|INSERT INTO)\b[\s\S]*?\b(transactions|products|product_payments|webhooks|proxy_urls|resource_owners|registered_servers|claims|refund_wallets|refund_configs|facilitators|subscriptions|subscription_payments|user_wallets|user_preferences|notifications|pending_facilitators)\b' \
  packages/server/src/ --type ts
```
Document the canonical table list in the script comment, and add a CI check that the script's table list equals `Object.keys` of the migrations.

---

### CR-04: `run-all.sh` writes to OUTPUTS_DIR without creating it; failure is masked

**File:** `tools/security-audit/run-all.sh:9, 48-52`
**Issue:** `OUTPUTS_DIR="$SCRIPT_DIR/outputs"` is referenced for write but never created (`mkdir -p` is absent). If the directory is missing (e.g., after a fresh clone where it isn't committed, after a `git clean -fdx`, in a worktree, or if a future change removes the committed marker file), the redirect `> "$AUDIT_FILE"` fails. With `set -e + || true`, the failure is silently absorbed; the subsequent `wc -c < "$AUDIT_FILE"` also fails silently, and the script prints `Captured: ... ( bytes)` with an empty byte count and exits 0.

Verified empirically:
```
$ bash sim-with-missing-OUTPUTS_DIR.sh
sim.sh: line 6: .../pnpm-audit-test.json: No such file or directory
Captured: .../pnpm-audit-test.json ( bytes)
```

**Fix:**
```bash
# Line 9 area:
OUTPUTS_DIR="$SCRIPT_DIR/outputs"
mkdir -p "$OUTPUTS_DIR"

# Line 51 — verify the write succeeded:
if ! pnpm audit --json > "$AUDIT_FILE" 2>/dev/null; then
  # pnpm audit returns non-zero when advisories exist — that's fine,
  # but if the file is empty or missing the write actually failed
  :
fi
if [[ ! -s "$AUDIT_FILE" ]]; then
  echo "[ERROR] pnpm audit produced no output to $AUDIT_FILE" >&2
  exit 1
fi
echo "Captured: $AUDIT_FILE ($(wc -c < "$AUDIT_FILE") bytes)"
```

---

### CR-05: SEC-05 zod gate cannot distinguish zod from `JSON.parse` / `Date.parse`

**File:** `tools/security-audit/grep/sec05-handlers-without-zod.sh:14`
**Issue:** The regex `safeParse|\.parse\(|z\.object` matches any `.parse(` call. In `packages/server/src/routes/admin.ts`, the script reports 48 hits for the "zod usage" section — but 47 of them are `JSON.parse(...)` calls (verified). The auditor's task is to "correlate req.body usage with zod usage" (script comment line 3), but the zod signal is buried under JSON.parse noise. The gate's stated purpose ("auditor correlates") is unachievable as written.

```
$ grep -nE "\.parse\(" packages/server/src/routes/admin.ts | grep "JSON\.parse" | wc -l
47
```

**Fix:** Tighten the regex to zod-specific patterns and exclude common non-zod parses:
```bash
echo "--- zod schema usage ---"
grep -nE "z\.(object|string|number|boolean|array|enum|union|literal|infer)" packages/server/src/routes/*.ts || true
echo "--- zod parse calls (safeParse / schema.parse) ---"
grep -nE "\b(safeParse|safeParseAsync)\(|\b[A-Z][A-Za-z]*Schema\.parse\(" packages/server/src/routes/*.ts || true
```

---

### CR-06: Solana fuzz tests omit signers — negative assertions may pass for the wrong reason

**File:** `packages/integration-tests/src/solana-security.test.ts:338-355, 366-387, 485-501, 567-587, 594-614`
**Issue:** Multiple "attack vector" tests build a transaction without `signers: [payerKeypair]`. The serialization uses `verifySignatures: false`, so the bytes leave the test, but the facilitator's `/verify` endpoint reasonably rejects requests with no signatures before reaching the security layer being asserted (program allowlist for attack 1b/4b, fee-payer isolation for attack 2, token instruction allowlist for attack 5c/5d). The test then asserts `expect(result.isValid).toBe(false)` and passes — but the rejection reason is "missing signature," not the layer the test claims to validate.

Affected tests (no `signers:` array passed to `buildTransaction`):
- L337-355 `should reject standalone SystemProgram.transfer` (attack 1b)
- L363-387 `should reject transfer where facilitator is the authority` (attack 2)
- L481-501 `should reject a well-known DeFi program (e.g. Raydium AMM)` (attack 4b)
- L562-587 `should reject token CloseAccount instruction (type 9)` (attack 5c)
- L589-614 `should reject token MintTo instruction (type 7)` (attack 5d)

**Fix:** Either (a) sign every adversarial tx with `payerKeypair` so it reaches the layer under test, or (b) assert on `result.invalidReason` so the test fails if rejection is due to missing signature rather than the security layer:
```ts
// Option (a) — preferred. Add signers to each affected buildTransaction call:
const tx = buildTransaction({
  feePayer: feePayerPubkey,
  blockhash,
  instructions: [ /* ... */ ],
  signers: [payerKeypair],  // <-- add
});

// Option (b) — pin the reason so silent skips are caught:
expect(result.isValid).toBe(false);
expect(result.invalidReason).toMatch(/disallowed program|disallowed token instruction|facilitator/i);
expect(result.invalidReason).not.toMatch(/missing signature|no signature/i);
```

## Warnings

### WR-01: SEC-04 grep produces high-volume false positives from "signature" in human-readable strings

**File:** `tools/security-audit/grep/sec04-secrets-in-logs.sh:9`
**Issue:** The pattern matches `signature` as a substring on the entire log call line. Several flagged lines log no actual secret — the word "signature" appears in the message literal:
- `packages/server/src/services/x402-client.ts:189` — `console.log('[x402Client] Partially signed (facilitator will add fee payer signature)')` — message-literal only, no variable.
- `packages/server/src/routes/internal-webhooks.ts:153` — `console.warn('[Subscription Webhook] Invalid signature')` — error message about an invalid input, no secret logged.
- `packages/core/src/solana.ts:165, 168, 200, 311` — operational logs ("Facilitator IS fee payer, adding signature...", "Transaction sent! Signature:") that print only the on-chain tx signature (public).
- `packages/core/src/erc3009.ts:565` — `console.error('  4. Invalid signature')` — a numbered diagnostic line.

The "26 matches" baseline therefore mixes real findings with diagnostic noise. Drift detection becomes useless: a real new secret leak could land while an unrelated message-literal is reworded, keeping the count at 26.

**Fix:** Restrict the regex to call-argument positions (a comma or `${...}` before the keyword), and exclude message-literal-only matches:
```bash
# Match keyword as variable, member access, or interpolation — not in a quoted literal
PATTERN='console\.(log|error|info|warn)\([^)]*[,$\{}][^)]*\b(privateKey|secretKey|signingKey|ENCRYPTION_KEY|BETTER_AUTH_SECRET|ACCESS_TOKEN_SECRET)\b'
# Or use ripgrep with negative lookbehind via -P to exclude in-string matches
```
Better: pin the script to classify each match against `24-SECURITY-AUDIT.md §SEC-04` so the count is "true positives only."

---

### WR-02: `sec04-secrets-in-logs.sh` runs the same grep twice

**File:** `tools/security-audit/grep/sec04-secrets-in-logs.sh:11, 13`
**Issue:** Line 11 runs the grep for printing; line 13 runs it again inside `$(...)` to get the count. This doubles the work and creates a race: if a file changes between the two greps, the printed lines and the count disagree, confusing the auditor.

**Fix:** Capture once, print twice:
```bash
MATCHES="$(grep -rEn "$PATTERN" packages/ apps/ --include='*.ts' --include='*.tsx' 2>/dev/null || true)"
echo "$MATCHES"
COUNT="$(printf '%s\n' "$MATCHES" | grep -c . || true)"
echo "[SEC-04] match count: $COUNT (expected ≥ 26 as of 2026-05-17)"
```

---

### WR-03: SEC-05 auth gate has high false-positive rate from `router.use(requireAuth)` blanket auth

**File:** `tools/security-audit/grep/sec05-handlers-without-auth.sh:10-15`
**Issue:** The script greps `router.{verb}(` lines and excludes any line containing `requireAuth|requireFacilitator|optionalAuth`. For routers that apply auth via `router.use(requireAuth)` (typical Express pattern), every handler line lacks per-route auth text and so appears as "without auth." The script does print `router.use(...)` lines for cross-reference, but it places the burden of correlating ~30 handler lines against a single `router.use(optionalAuth)` line on the auditor. The script comment acknowledges this caveat — but treating it as a known limitation rather than fixing it means the gate cannot meaningfully reduce noise for future audits.

Also: the regex is single-line only and misses multi-line handlers:
```ts
router.get(
  '/path',
  requireAuth,
  async (req, res) => { ... }
);
```
The first line (`router.get(`) lacks any auth marker and would be flagged.

**Fix:** Parse routes properly with a tiny AST helper (e.g., `ts-morph` or `typescript-estree` in a Node script) and resolve each handler's effective middleware chain (handler-specific + router.use stack). Keep the grep as a quick check but mark its output "noisy — use only as a sanity check; canonical answer comes from the AST script."

---

### WR-04: Semgrep rule cannot detect template-literal interpolation or non-comma argument shapes

**File:** `tools/security-audit/semgrep/openfacilitator.yaml:1-13`
**Issue:** The semgrep pattern `console.log(..., $X, ...)` requires `$X` to be a comma-separated positional argument. The `metavariable-regex` then checks `$X` matches one of the keywords. Several real-world leak shapes do not bind a positional metavariable:

1. **Template literals:** `console.log(\`secret = ${privateKey}\`)` — only one argument; `$X` doesn't bind to `privateKey`.
2. **Object spread:** `console.log({ ...secret })` — `$X` binds to the object expression, not the property name.
3. **Aliased variables:** `console.log('priv:', pk)` — `pk` is the actual secret but the variable name doesn't match the regex; the rule misses.

The rule will catch only the narrow case where a positional argument's text contains one of the literal keywords (e.g., `console.log('foo', privateKey)` or `console.log('foo', obj.privateKey)`).

**Fix:** Augment with additional patterns:
```yaml
rules:
  - id: of-no-console-secret
    pattern-either:
      - pattern: console.$M(..., $X, ...)
      - pattern: console.$M(`...${$X}...`)
      - pattern: console.$M(`...${$Y.$X}...`)
    metavariable-regex:
      metavariable: $X
      regex: '(privateKey|secretKey|signingKey|BETTER_AUTH_SECRET|ENCRYPTION_KEY|ACCESS_TOKEN_SECRET|password|apiKey)'
    metavariable-regex:
      metavariable: $M
      regex: '(log|error|info|warn|debug)'
    languages: [typescript]
```
Also add `password`, `apiKey`, `mnemonic`, `seedPhrase` to the keyword list — these are common JS secret names.

---

### WR-05: Happy-path settlement test will spend real mainnet USDC if a local keypair exists

**File:** `packages/integration-tests/src/solana-security.test.ts:710-797`
**Issue:** The test reads `~/.config/solana/id.json` (the Solana CLI default mainnet wallet), checks the USDC balance, and if balance ≥ $0.01 USDC **broadcasts a real settlement against `payTo` returned by `/supported`**. There is no environment guard (e.g., `RUN_SETTLEMENT_TEST=1`). A developer who runs `pnpm test:all`, `pnpm test:security`, or even a misconfigured `pnpm install`-triggered test hook would silently lose USDC to whatever address the configured facilitator's `/supported` endpoint advertises — including, in principle, a compromised or test-configured endpoint.

Additional risks within this test:
- The `to:` field is read from `(supported as any).signers?.['solana:*']?.[0] || feePayerAddress` (L176). If the SDK shape changes, this silently falls back to the facilitator's fee-payer address — funds going to the wrong destination.
- `console.log` of the local wallet public key (L723) — privacy leak in CI logs.

**Fix:** Add an explicit opt-in guard and isolate the test:
```ts
const ALLOW_REAL_SETTLEMENT = process.env.RUN_SETTLEMENT_TEST === '1';

describe('happy path settlement (requires funded wallet)', () => {
  it.skipIf(!ALLOW_REAL_SETTLEMENT)(
    'should settle a real valid USDC transfer',
    async () => { ... }
  );
});
```
Also pin `payTo` to an env-configured test recipient instead of trusting the `/supported` response.

---

### WR-06: Happy-path test "skips" with `return`, reporting as passed instead of skipped

**File:** `packages/integration-tests/src/solana-security.test.ts:712-715, 717-721`
**Issue:** When the local keypair is missing or the wallet is unfunded, the test prints a message and returns. Vitest reports the test as PASSED, not SKIPPED. A reviewer looking at the CI output cannot distinguish "settlement worked" from "settlement was skipped."

**Fix:**
```ts
import { describe, it, expect, beforeAll } from 'vitest';

it('should settle a real valid USDC transfer', async (ctx) => {
  const keypair = loadLocalKeypair();
  if (!keypair) {
    ctx.skip();  // proper skip reporting
    return;
  }
  // ...
});
```

---

### WR-07: Tautological negative assertions in happy-path settlement test

**File:** `packages/integration-tests/src/solana-security.test.ts:791-796`
**Issue:** Four `expect(result.errorReason).not.toContain(...)` assertions are only checked **when settlement fails** (`if (!result.success && result.errorReason)`). If `errorReason` is `undefined` or an empty string, all four assertions pass trivially. If settlement succeeds, none of the four assertions run. The test therefore provides no meaningful security regression coverage — it asserts a negative against a possibly-missing field.

**Fix:** Convert to positive assertion against expected success path, and separately test each rejection reason as its own case:
```ts
expect(result).toBeDefined();
if (!result.success) {
  // Acceptable failure modes: expired blockhash, RPC timeout, insufficient balance.
  // Anything else (esp. validation failures) means the test layer regressed.
  const acceptable = /blockhash|timeout|insufficient/i;
  expect(result.errorReason ?? '').toMatch(acceptable);
}
```

---

### WR-08: Blockhash captured once in `beforeAll` may expire mid-suite

**File:** `packages/integration-tests/src/solana-security.test.ts:186-188, 195`
**Issue:** A single Solana mainnet blockhash is fetched in `beforeAll` and reused across 24+ tests. Solana blockhashes expire after ~60-90s (150 slots). A slow test run (each `/verify` is a network roundtrip to the facilitator and the test suite runs serially) can plausibly exceed the blockhash validity window, causing later "happy-path" tests to fail for the wrong reason — and the security assertions to pass for the wrong reason on the negative tests.

**Fix:** Fetch a fresh blockhash before each test (or batch them) with `beforeEach`:
```ts
beforeEach(async () => {
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  const { blockhash: bh } = await connection.getLatestBlockhash('confirmed');
  blockhash = bh;
});
```

---

### WR-09: README references `pnpm test:solana-all` script that does not exist

**File:** `packages/integration-tests/src/solana-security.test.ts:10`
**Issue:** The file-header doctring instructs users to run `pnpm test:solana-all — includes settlement happy path (needs funded wallet)`. That script is not defined in `packages/integration-tests/package.json` (only `test:security`, `test:solana`, `test:real`, `test:all` exist). A new developer following the docstring instruction will hit "Missing script" — and if they then run `pnpm test:all` as a guess, they trigger the real-USDC settlement path (WR-05).

**Fix:** Either add `"test:solana-all": "vitest run src/solana-security.test.ts src/solana-real.test.ts"` to `packages/integration-tests/package.json`, or correct the docstring to reference the real script names.

## Info

### IN-01: README forward-references `SECURITY-DECISIONS.md` that does not yet exist

**File:** `tools/security-audit/README.md:96, 108`
**Issue:** Two sections reference `SECURITY-DECISIONS.md` "at the repo root" — which does not exist (Plan 24-02 creates it). The README does say "created in Plan 24-02 (Remediation) once Plan 24-01 (this audit) ships" once, but a reader landing in section "Re-running the Audit" (step 3) sees `SECURITY-DECISIONS.md` referenced without that caveat.

**Fix:** In each reference, append "(created by Plan 24-02; not yet present)" or guard with "once Plan 24-02 ships."

---

### IN-02: README's "Output Files" claims dated-per-run, but only one file is ever generated

**File:** `tools/security-audit/README.md:81-89`
**Issue:** "Each run writes a new dated file for diffability." True only across days — if `run-all.sh` is run twice in one day, the second run overwrites the first (`pnpm-audit-YYYY-MM-DD.json` is the same path). The README's "diffability" claim implies per-run uniqueness; the behavior is per-day.

**Fix:** Either include timestamp (`pnpm-audit-YYYYMMDD-HHMMSS.json`) or correct the README to "Each run *on a new date* writes a new file; same-day re-runs overwrite."

---

### IN-03: SEC-02 script's "Expected ~ many matches" note is too vague to be useful

**File:** `tools/security-audit/grep/sec02-cross-tenant.sh:11`
**Issue:** The script echoes `Expected ~ many matches as of 2026-05-17 — auditor classifies in 24-SECURITY-AUDIT.md §SEC-02 enumeration table`. Compared to SEC-04's concrete "expected ≥ 26 matches" baseline, "many" gives no drift signal. A reviewer can't tell whether the current output is consistent with the recorded audit.

**Fix:** Record the actual baseline count after running the SEC-02 enumeration: e.g., `Expected: 46 matches (88 prepare statements minus 42 cross-tenant-by-design/non-tenant — see 24-SECURITY-AUDIT.md §SEC-02 enumeration table)`.

---

### IN-04: `requirements` object uses `undefined as string | undefined` then mutated later

**File:** `packages/integration-tests/src/solana-security.test.ts:154-160, 178`
**Issue:** The shared `requirements` object is declared with `payTo: undefined as string | undefined` and mutated inside `beforeAll`. This works because `beforeAll` runs before any `it`, but it's a code smell that bypasses TypeScript's intent: the verifier likely requires a non-optional `payTo` string. A reviewer reading `requirements.payTo` cannot tell from the declaration whether the field is required.

**Fix:** Build `requirements` inside `beforeAll` and expose it via a closure:
```ts
let requirements: { scheme: string; network: string; maxAmountRequired: string; asset: string; payTo: string };

beforeAll(async () => {
  // ... resolve payTo ...
  requirements = {
    scheme: 'exact',
    network: 'solana',
    maxAmountRequired: TEST_AMOUNT.toString(),
    asset: USDC_MINT,
    payTo,
  };
});
```

---

_Reviewed: 2026-05-17T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
