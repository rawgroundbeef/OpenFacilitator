# Phase 24: Security Audit & Remediation - Context

**Gathered:** 2026-05-17
**Status:** Ready for planning

<domain>
## Phase Boundary

Audit the post-removal codebase across SEC-01 through SEC-05 (auth, multi-tenant isolation, payment co-signing, secrets/key management, input validation / API hardening), then satisfy SEC-06 by either fixing every CRITICAL and HIGH finding or recording an explicit acceptance with rationale in `SECURITY-DECISIONS.md`. The audit covers the full monorepo at its current slimmed state: `packages/server`, `apps/dashboard`, `packages/core`, `packages/sdk`, and `examples/`. The phase is the final phase of the v1.3 Trim & Audit milestone — no v1.3 phase comes after this.

**Not in scope:** any v1.4+ feature work; remediation of MEDIUM/LOW findings (logged for future); architectural rewrites larger than localized hardening (deferred via SECURITY-DECISIONS.md acceptance + compensating-control note); re-auditing the rewards / storefronts code paths (gone after Phases 22/23, but stale CONCERNS.md entries referencing them get marked "resolved by removal" in the audit doc).

</domain>

<decisions>
## Implementation Decisions

### Scope & Inputs

- **D-01:** Audit scope is the full monorepo at its post-removal state — `packages/server`, `apps/dashboard`, `packages/core`, `packages/sdk`, `examples/`. SDK is published to npm so consumer-trust matters even though its attack surface is small (no server, no signing). Rationale: removals in Phases 22/23 shrank the surface specifically so this audit could be exhaustive without being unmanageable.
- **D-02:** The 11 items in `.planning/codebase/CONCERNS.md` (analyzed 2026-01-19, pre-removal) are auto-promoted as starting findings for the audit. Each item is re-validated against the current codebase. Items that no longer apply because the offending code was removed in Phase 22/23 (e.g., the "Wallet Signature Verification Not Implemented" item in `routes/public.ts` lines 702-706 may have been reward-claim verification per Phase 23 REWARDS-07) get marked **"resolved by removal"** in the audit doc with the deleting commit hash. Items that still apply become Phase 24 findings with severity assigned per the rubric.
- **D-03:** Fix two REQUIREMENTS.md drifts in this phase's commit (matches Phase 23 D-04 pattern of fixing related drift in the same commit):
  - **SEC-05 wording** — currently reads "Hono route schemas"; correct stack is Express (`packages/server` uses Express 4.21 per STACK.md, confirmed by grep). Update to "Express route schemas".
  - **Traceability table** — SEC-01 through SEC-06 are currently mapped to "Phase 25" in the REQUIREMENTS.md trace table. The roadmap merged what was originally Phases 24+25 into a single Phase 24 (Security Audit & Remediation). Update mapping to "Phase 24" across all six rows.

### Audit Methodology

- **D-04:** Combine manual review with three automated tools:
  - **`pnpm audit`** at the workspace root — capture all advisories. Each becomes a finding with severity = the advisory's published severity (overrideable by auditor if context warrants).
  - **GitHub Advisory / Dependabot check** — verify Dependabot is enabled at the repo level, scan the Security tab for open advisories, and confirm none are silently auto-dismissed. If Dependabot is not enabled, that itself is a SEC-04 finding.
  - **semgrep** — run default JS/TS rulesets plus custom project-specific rules (see D-05). Capture findings into the audit doc; do not auto-suppress.
- **D-05:** Codify per-SEC-NN grep / semgrep patterns and commit them under `tools/security-audit/` (or similar — planner decides exact location) so they are re-runnable in future audits and could be wired into CI. Examples (planner will expand):
  - **SEC-02:** grep DB call sites that read from cross-tenant tables (`transactions`, `subscriptions`, `user_wallets`, `products`, `claims`, etc.) without filtering by `facilitator_id`.
  - **SEC-04:** grep `console.log` / `console.error` / `console.info` near identifiers matching `privateKey`, `secretKey`, `signingKey`, `authorization`, `signature`, `ENCRYPTION_KEY`, `BETTER_AUTH_SECRET`, `ACCESS_TOKEN_SECRET`.
  - **SEC-05:** grep `Router.<method>` handlers without an adjacent `z.object` / `zod` parse, and routes that read `req.body` / `req.query` without validation.
- **D-06:** SEC-02 (multi-tenant isolation) is audited by **enumerating every query function** under `packages/server/src/db/*.ts` (~12 files per ARCHITECTURE.md) into a single table inside `24-SECURITY-AUDIT.md`. Columns: function name, file:line, table queried, WHERE clauses, requires `facilitator_id`? (yes / no / cross-tenant-by-design), notes. This produces a defensible audit trail that anyone can re-walk. The audit doc treats any "no" with no notes as a HIGH finding.
- **D-07:** SEC-03 (payment co-signing) depth target:
  1. **Allowlist completeness** for Solana co-signing — verify the instruction allowlist in `packages/core/src/solana.ts` (and any related co-signing entry point) covers exactly the intended instruction set (SPL token transfer, fee instructions, compute budget). Anything outside the allowlist must reject.
  2. **Replay protection** — verify nonce / recent-blockhash window for Solana; verify the ERC-3009 `NonceManager` in `packages/core/src/erc3009.ts` is resistant to replay (CONCERNS.md flagged in-memory tracking + race conditions on this file).
  3. **Fuzz tests for malicious instructions** — write tests in `packages/core` (or `packages/integration-tests`) that attempt to slip non-allowlisted Solana instructions (transfer to attacker, drain fees, set authority, close account) through the co-signing path. Tests must reject the malicious instruction without false positives on the legitimate set.
- **D-08:** EVM signing safety (SEC-03 sub-area) — verify signature recovery in ERC-3009 produces the expected `from` address and that the facilitator does not co-sign authorizations whose `to` differs from the intended `payTo`. Covered by manual review + replay-protection check; no additional tooling.

### Findings Artifact

- **D-09:** All audit findings live in a single file: `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md`. Top of file defines the severity rubric (D-10). Sections per SEC-NN (SEC-01 through SEC-05); each section has:
  - **Scope** — what code paths were reviewed
  - **Methodology** — manual review notes, tools run, grep patterns applied (with link to committed pattern file)
  - **Findings table** — `ID | severity | title | file:line | description | status (open / fixed / accepted)`
  - **Resolved by removal** — bulleted list of CONCERNS.md items that no longer apply, with deleting commit hash
- **D-10:** Severity rubric — custom four-tier, no CVSS overhead, no OWASP cross-tagging (auditor may add OWASP tag in description if helpful, but it is not a required field):
  - **CRITICAL** — exploitable now without further development, results in immediate data loss, funds loss, or full multi-tenant breakout
  - **HIGH** — exploitable with non-trivial effort, OR an exploitable path with significant blast radius, OR a known issue from CONCERNS.md that has not been mitigated
  - **MEDIUM** — defense-in-depth gap, exploitable only with chained conditions, or hardening that materially raises attacker cost
  - **LOW** — nit / hygiene / documentation gap

### Acceptance Log (SECURITY-DECISIONS.md)

- **D-11:** Acceptance log file lives at **repo root**: `SECURITY-DECISIONS.md`. Reasons: visible to drive-by repo readers (pairs with conventional `SECURITY.md`), survives the eventual archival of `.planning/phases/24-security-audit-remediation/` into `milestones/v1.3-ROADMAP.md`, and future audits can append without resurfacing the doc.
- **D-12:** Each acceptance entry is a structured heading with these required fields (no free-form prose entries):
  - **Finding ID** (mirrors `24-SECURITY-AUDIT.md`)
  - **Severity** (CRITICAL or HIGH only — MEDIUM/LOW do not require entries)
  - **Title** (short)
  - **Accepted by** (name + role)
  - **Date** (YYYY-MM-DD)
  - **Rationale** (why fix-in-this-phase is not the right call — must be specific, not "won't fix")
  - **Compensating control** (what mitigates residual risk — e.g., RPC-layer rate limit, monitoring alert, scheduled re-audit)
  - **Revisit trigger** (event or version that should re-open this — e.g., "v1.5 self-hosted launch", "when traffic > 1k req/s")

### Plan Structure

- **D-13:** Phase 24 is split into **two plans** — diverging from Phase 22/23's atomic-plan pattern because audit findings are unknowable in advance and remediation work scales with audit output:
  - **`24-01-AUDIT-PLAN.md`** — runs the audit. Deliverables: `24-SECURITY-AUDIT.md` populated, committed grep/semgrep patterns under the tools dir, `pnpm audit` output captured, DB-query enumeration table filled in, Solana co-signing fuzz tests written and passing on the existing allowlist, REQUIREMENTS.md drifts fixed (per D-03). Plan 1 does **not** do any remediation.
  - **`24-02-REMEDIATION-PLAN.md`** — **defined AFTER Plan 1 completes** (planner re-runs `/gsd-plan-phase 24` or equivalent after Plan 1 ships). Deliverables: every CRITICAL and HIGH finding either has a code-change commit closing it OR a `SECURITY-DECISIONS.md` entry per D-12; MEDIUM/LOW findings are recorded in the audit doc with `status: deferred` (no remediation required for Phase 24). Phase 24 is complete only when Plan 2 ships.
- **D-14:** Fix-or-accept threshold matches success criteria #5 exactly: default = fix, acceptance is the escape hatch with a documented compensating control.
  - **CRITICAL** — default fix; acceptance allowed only if remediation requires a platform shift documented as a future-phase commitment (e.g., "move to Postgres for distributed nonce locking — v1.4 phase X").
  - **HIGH** — default fix; acceptance allowed with rationale + compensating control.
  - **MEDIUM / LOW** — logged in audit doc, no remediation required, no SECURITY-DECISIONS.md entry needed.
- **D-15:** New-code remediation is in scope **when it is standard hardening**, even for items that did not previously exist:
  - Adding `express-rate-limit` middleware to sensitive endpoints (auth, `/verify`, `/settle`) — CONCERNS.md "No Rate Limiting" item, in scope.
  - Removing the three debug endpoints (`/facilitators/:id/raw`, `/facilitators/:id/domains`, `/subscriptions/clear`) under `packages/server/src/routes/admin.ts` — CONCERNS.md flagged, in scope.
  - Tightening cookie flags (httpOnly, secure, sameSite) — in scope.
  - Removing console-logging of sensitive data in `packages/core/src/erc3009.ts`, `packages/core/src/facilitator.ts`, `packages/core/src/solana.ts` — in scope.
- **D-16:** Wider rearchitecture discovered during remediation gets accepted with a deferred-to-future-phase note, not implemented in Plan 2. Example: if SEC-02 audit reveals "multi-tenant scoping needs middleware-level enforcement instead of per-query", and Plan 2 finds a per-query fix for each unscoped call, Plan 2 ships the per-query fixes and writes a SECURITY-DECISIONS.md entry committing to a future-phase middleware refactor with "Revisit trigger: v1.4 planning".

### Claude's Discretion

- Exact file location for committed grep / semgrep patterns (planner picks — `tools/security-audit/`, `scripts/security-audit/`, or `.planning/security-audit-patterns/`).
- Whether Plan 1 lands as one commit or multiple per-SEC-NN commits (atomicity matters less here than in feature phases; planner picks).
- Whether `pnpm audit` output is committed verbatim or captured into the findings table.
- Whether the EVM `NonceManager` audit (D-07 part of SEC-03 + CONCERNS.md "ERC-3009 Nonce Management") justifies adding `NonceManager` unit tests as part of Plan 2 remediation.
- Verification gate: `grep -rE 'console\.(log|error|info).*(privateKey|secretKey|signingKey|BETTER_AUTH_SECRET|ENCRYPTION_KEY)' packages/ apps/ --include='*.ts' --include='*.tsx'` must yield zero matches after Plan 2 if logging-sensitive-data was a HIGH/CRITICAL finding.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor) MUST read these before planning or implementing.**

### Roadmap & requirements
- `.planning/ROADMAP.md` §"Phase 24: Security Audit & Remediation" — goal, depends-on (Phase 23), 5 success criteria
- `.planning/REQUIREMENTS.md` §"Security Audit" — SEC-01 through SEC-06 (note: SEC-05 "Hono" wording is wrong, will be corrected per D-03; traceability table mapping to "Phase 25" will be corrected per D-03)
- `.planning/STATE.md` — current position (Phase 23 complete, ready to plan Phase 24)
- `.planning/PROJECT.md` — current Core Value (post-Phase-23 rewrite): multi-tenant x402 facilitator + subscriptions

### Pre-flagged starting findings (auto-promoted per D-02)
- `.planning/codebase/CONCERNS.md` — 11 items: debug endpoints in admin.ts, missing tx confirmation, deprecated aliases, inline webhook URLs, ad-hoc DB migrations, `any` typed auth DB, missing wallet-sig verification, no rate limiting, debug endpoints without auth, ACCESS_TOKEN_SECRET fallback, console-logging of sensitive data, public RPC defaults, ERC-3009 nonce fragility, multi-network code path fragility, cookie-based access-token fragility, scaling limits, dep risks (better-auth, viem), missing critical features (tx-confirmation webhook, retry logic, audit logging), test coverage gaps. **Re-validate each — some may be "resolved by removal" post Phase 22/23.**

### Codebase maps (existing)
- `.planning/codebase/STACK.md` — Express 4.21 (not Hono), Vitest, better-sqlite3, better-auth, viem 2.21, @solana/web3.js 1.98, zod 3.24, helmet 8, cors 2.8
- `.planning/codebase/ARCHITECTURE.md` — multi-tenant routing via `resolveFacilitator` middleware (`packages/server/src/middleware/tenant.ts`); auth via Better Auth (`packages/server/src/auth/`); 12 DB modules under `packages/server/src/db/`; routes under `packages/server/src/routes/`; cross-cutting encryption via `packages/server/src/utils/crypto.ts` with `ENCRYPTION_KEY`
- `.planning/codebase/INTEGRATIONS.md` — third-party integrations (Railway, RPC providers, etc.)
- `.planning/codebase/CONVENTIONS.md` — code conventions
- `.planning/codebase/STRUCTURE.md` — file/directory layout
- `.planning/codebase/TESTING.md` — test surface (Vitest server + integration-tests package)

### Prior phase patterns (template to emulate)
- `.planning/phases/22-storefronts-removal/22-CONTEXT.md` — atomic plan pattern, REQUIREMENTS drift fix in same commit (D-04 there)
- `.planning/phases/23-rewards-removal-backend-frontend-docs/23-CONTEXT.md` — drift-fix pattern (D-04 fixed REWARDS-02 in same commit as removal), atomic plan structure (Phase 24 diverges per D-13 — split into AUDIT + REMEDIATION)
- `.planning/phases/22-storefronts-removal/22-VERIFICATION.md` — verification doc shape
- `.planning/phases/23-rewards-removal-backend-frontend-docs/23-VERIFICATION.md` — verification doc shape

### Security-critical code paths (audit targets)
- **SEC-01 (Auth):** `packages/server/src/auth/config.ts`, `packages/server/src/auth/index.ts`, `packages/server/src/middleware/auth.ts`, all routes under `packages/server/src/routes/` (route-protection check), Better Auth cookie config, `apps/dashboard/src/components/auth-provider.tsx` and friends
- **SEC-02 (Multi-tenant):** `packages/server/src/middleware/tenant.ts`, every file under `packages/server/src/db/*.ts` (enumeration target per D-06)
- **SEC-03 (Co-signing):** `packages/core/src/erc3009.ts` (NonceManager + signing), `packages/core/src/solana.ts` (instruction allowlist + co-signing), `packages/core/src/facilitator.ts` (settle), `packages/server/src/routes/facilitator.ts` (`/verify`, `/settle` endpoints)
- **SEC-04 (Secrets):** `packages/server/src/utils/crypto.ts` (encryption-at-rest), `packages/server/.env.example`, `packages/server/src/routes/facilitator.ts` lines 31-32 (ACCESS_TOKEN_SECRET fallback per CONCERNS.md), all `console.log` call sites near key/secret identifiers (per D-05 grep pattern)
- **SEC-05 (Input validation / API hardening):** every Express handler under `packages/server/src/routes/*.ts` (zod schema check), `packages/server/src/services/webhook.ts` (signature verification), helmet + cors config, missing rate-limit middleware (CONCERNS.md flagged)

### Output artifacts (this phase creates / modifies)
- `.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md` — findings artifact per D-09
- `SECURITY-DECISIONS.md` (repo root) — acceptance log per D-11
- `tools/security-audit/` (or planner-chosen location) — committed grep / semgrep patterns per D-05
- `.planning/REQUIREMENTS.md` — SEC-05 wording + traceability fixes per D-03

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Phase 22 / 23 VERIFICATION.md** — directly reusable shape for Phase 24 Plan 1 verification (grep gates + build gates). Phase 24 adds tooling gates (pnpm audit output captured, semgrep pass, DB-query enumeration row count matches actual function count).
- **CONCERNS.md as prior security analysis** — 11 pre-flagged items shrink the audit cold-start; D-02 auto-promotes them. Saves duplicating the same triage.
- **Existing zod usage in route handlers** — D-05 SEC-05 grep pattern searches for handlers MISSING zod parses; existing zod patterns are the positive reference.
- **`packages/integration-tests` package** — natural home for SEC-03 fuzz tests (D-07) if `packages/core` doesn't want test code; planner picks.

### Established Patterns
- **Atomic-plan-with-drift-fix** (Phase 22 D-05, Phase 23 D-04 / D-15) — D-03 follows the same pattern for fixing REQUIREMENTS.md drift in this phase's commit. Plan 24-01 (audit) does the drift fix; Plan 24-02 (remediation) does not.
- **Resolved-by-removal marker** — Phases 22 and 23 left structured "no references to X remain" verification statements; Phase 24 uses an analogous "resolved by removal" marker for stale CONCERNS.md items per D-02.
- **Better Auth as the only session authority** — D-07 of Phase 23 noted any future admin features rebuild on Better Auth roles rather than reviving `ADMIN_USER_IDS`. SEC-01 audit confirms no parallel auth paths exist.
- **Express + zod for input validation** — D-05's SEC-05 grep pattern enforces this convention; non-conforming routes become findings.

### Integration Points
- **Plan 24-02 connects to GitHub Security tab** — D-04 requires confirming Dependabot is enabled at the repo level. If not, Plan 24-02 includes the GitHub repo settings change (or documents it for the user to action — not a code change).
- **Plan 24-02 connects to `tools/security-audit/`** — committed patterns are designed to be wireable into a future CI step, but adding the CI step itself is **out of scope** for Phase 24 (deferred — see "Deferred Ideas").
- **SECURITY-DECISIONS.md at repo root** — pairs with conventional `SECURITY.md` (security disclosure policy). If `SECURITY.md` doesn't already exist, that's a SEC-04-adjacent observation but NOT a finding (no exploitable issue) — could be a Plan 24-02 nice-to-have.

</code_context>

<specifics>
## Specific Ideas

- Audit doc file name: `24-SECURITY-AUDIT.md` (consistent with `23-VERIFICATION.md` numbering style).
- Severity rubric verbatim text per D-10 — written at the top of `24-SECURITY-AUDIT.md` so any reader can interpret severity assignments without external context.
- Drop the SEC-05 word "Hono" and replace with "Express" — verbatim string substitution in `.planning/REQUIREMENTS.md`.
- Traceability table fix: SEC-01 / SEC-02 / SEC-03 / SEC-04 / SEC-05 / SEC-06 rows all flip "Phase 25" → "Phase 24".
- SECURITY-DECISIONS.md template per D-12 — required heading fields, no free-form alternative.
- DB-query enumeration table per D-06 — single table in `24-SECURITY-AUDIT.md` SEC-02 section, one row per exported function across `packages/server/src/db/*.ts`.
- Solana fuzz tests per D-07 — attempt to slip these classes of malicious instructions: transfer to attacker, drain fees, `setAuthority`, `closeAccount`, arbitrary program invocation, oversized instruction sets that bypass length checks.
- Plan 24-02 only exists once Plan 24-01 ships — do **not** preemptively scaffold an empty `24-02-REMEDIATION-PLAN.md` during Plan 1.

</specifics>

<deferred>
## Deferred Ideas

- **CI integration of committed audit patterns.** D-05 commits grep / semgrep patterns under `tools/security-audit/`. Wiring those into a CI workflow (GitHub Actions) so they run on every PR is a follow-up — not Phase 24 work. Belongs in a future v1.4 phase or a dedicated CI hardening phase.
- **`SECURITY.md` at repo root** (security disclosure policy / coordinated disclosure contact). Not a finding (no exploit), but pairs naturally with the new `SECURITY-DECISIONS.md`. Could be a Plan 24-02 nice-to-have; if it slides, it goes here.
- **Middleware-level multi-tenant enforcement.** If SEC-02 audit shows a pattern of missing-scoping at call sites, the architecturally-correct fix is middleware enforcement. D-16 explicitly defers this to a future phase via SECURITY-DECISIONS.md compensating-control entries.
- **Postgres migration for distributed nonce locking.** CONCERNS.md flags ERC-3009 in-memory nonce tracking. Fix at scale requires a platform shift. Defer to v1.4+.
- **Webhook delivery retry / async tx confirmation monitoring.** CONCERNS.md "Missing Critical Features" items. Reliability gaps, not security exploits — out of scope for Phase 24 (a security phase).
- **Audit logging for admin actions.** CONCERNS.md flags this; legitimate compliance / forensics gap. If the audit surfaces it as a security finding (e.g., HIGH for SEC-01), Plan 24-02 may add basic structured logging; if it stays at MEDIUM, defer to future phase.
- **NonceManager unit tests.** Mentioned as Claude's-discretion in D-decisions; planner can include if it falls out naturally during Plan 24-02 remediation work.

</deferred>

---

*Phase: 24-security-audit-remediation*
*Context gathered: 2026-05-17*
