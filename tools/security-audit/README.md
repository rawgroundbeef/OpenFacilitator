# Security Audit Tools — OpenFacilitator

Re-runnable security audit gate scripts per Phase 24 D-05.

---

## Purpose

These scripts implement the SEC-NN grep gates from the Phase 24 security audit
(`.planning/phases/24-security-audit-remediation/24-SECURITY-AUDIT.md`). They are
committed to the repo so the audit is reproducible and future audits can diff against
the current baseline.

Each script exits 0 even when matches are found — matches are informational; the
auditor interprets them against the findings table in `24-SECURITY-AUDIT.md`.

---

## Run All Gates

From the repo root:

```bash
bash tools/security-audit/run-all.sh
```

The driver runs every SEC-NN grep gate in order and captures `pnpm audit --json` to
`tools/security-audit/outputs/pnpm-audit-YYYY-MM-DD.json`.

---

## Run One Gate

```bash
bash tools/security-audit/grep/sec02-cross-tenant.sh
bash tools/security-audit/grep/sec04-secrets-in-logs.sh
bash tools/security-audit/grep/sec05-handlers-without-zod.sh
bash tools/security-audit/grep/sec05-handlers-without-auth.sh
```

---

## Semgrep (Optional — Requires Install)

Committed rules are in `tools/security-audit/semgrep/openfacilitator.yaml`. Install semgrep
to run them:

```bash
brew install semgrep
# or
pip install semgrep
```

Then run:

```bash
semgrep --config tools/security-audit/semgrep/openfacilitator.yaml packages/ apps/
```

Semgrep is optional — the grep scripts in `grep/` are the **authoritative gates** per
RESEARCH.md §7. Semgrep adds pattern-matching power but requires a local install.

---

## Interpreting Output

- **Zero matches** from a grep gate means the pattern is clean at HEAD.
- **Non-zero matches** require auditor review. Some matches are intentional:
  - `sec02-cross-tenant.sh`: cross-tenant-by-design queries will match (e.g.,
    `getGlobalStats`, `getRegisteredServerByApiKeyHash`). See the classification
    key in `24-SECURITY-AUDIT.md §SEC-02`.
  - `sec04-secrets-in-logs.sh`: test files will match. These are informational (LOW/INFO).
- As of 2026-05-17, the expected match counts are:
  - SEC-02: many matches (auditor classifies each into scoped / unscoped / cross-tenant-by-design / non-tenant)
  - SEC-04: ≥ 26 matches (see `24-SECURITY-AUDIT.md §SEC-04` for full classification table)
  - SEC-05 (zod): many `req.body` hits; auditor cross-references against zod usage
  - SEC-05 (auth): many handler lines; `router.use(requireAuth)` applies blanket auth to many routes

---

## Output Files

```
tools/security-audit/outputs/
└── pnpm-audit-YYYY-MM-DD.json    # Captured by run-all.sh; dated per run
```

Run the driver script to update the baseline. Each run writes a new dated file for
diffability against prior audits.

---

## Security Policy

For the fix-or-accept log (acceptance rationale, compensating controls, revisit triggers),
see `SECURITY-DECISIONS.md` at the repo root. That file is created in Plan 24-02
(Remediation) once Plan 24-01 (this audit) ships.

---

## Re-running the Audit

The Phase 24 audit captured findings at HEAD on 2026-05-17. To re-run:

1. `bash tools/security-audit/run-all.sh` — refreshes grep gates + pnpm-audit baseline
2. Compare grep output to the findings tables in `24-SECURITY-AUDIT.md`
3. Any new matches are candidate new findings; any dropped matches may indicate a fix
   from `SECURITY-DECISIONS.md` remediation list
4. Re-check `pnpm audit` advisories against the previous JSON for new CVEs

---

*Phase 24 D-05 — committed 2026-05-17*
