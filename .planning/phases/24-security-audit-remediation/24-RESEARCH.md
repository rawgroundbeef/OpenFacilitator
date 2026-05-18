# Phase 24: Security Audit & Remediation — Research (Plan 1 scope only)

**Researched:** 2026-05-17
**Domain:** Security audit methodology — multi-tenant Express/Node monorepo with crypto co-signing
**Confidence:** HIGH (codebase-grounded; D-04..D-10 methodology is pre-locked)
**Scope:** Plan 1 (24-01-AUDIT-PLAN.md) ONLY. Plan 2 remediation is out of scope until findings exist.

---

## Summary

Phase 24 is split per D-13: Plan 1 runs the audit and populates `24-SECURITY-AUDIT.md`; Plan 2 (drafted later) remediates findings. This research grounds Plan 1 in the **actual current codebase** at HEAD on `phase/23-rewards-removal-backend-frontend-docs`, post Phase 22/23 removals.

**Key facts the planner needs immediately:**

1. The DB layer has **93 exported query functions across 14 modules** (excluding `index.ts` infrastructure + `migrations/index.ts`). Of these, **roughly 31 functions touch tenant-scoped tables and the audit must classify each one** (scoped / unscoped / cross-tenant-by-design / unclear). Section §1 contains the seed list.
2. The route surface is **124 Express handlers across 8 router files**. **All four** routes files that accept request bodies (`admin.ts`, `facilitator.ts`, `public.ts`, `subscriptions.ts`) import `zod` — zod adoption is broad but not universal. The grep-driven enumeration in §2 names every handler.
3. `routes/admin.ts:1623` (`GET /facilitators/:id/raw`) and `routes/admin.ts:1653` (`PATCH /facilitators/:id/domains`) are still mounted WITHOUT `requireAuth`. Confirmed by reading the current file. CONCERNS.md prediction holds.
4. The `ACCESS_TOKEN_SECRET` fallback at `routes/facilitator.ts:27-28` still derives from `ENCRYPTION_KEY` (not `BETTER_AUTH_SECRET`) with a literal default string `'openfacilitator-access-default'`. CONCERNS.md prediction holds. Plan 1 enumerates; Plan 2 will fix.
5. The Solana co-signing path (`packages/core/src/solana.ts` + `solana-validation.ts`) **already has a robust allowlist** and **fuzz tests already exist** at `packages/integration-tests/src/solana-security.test.ts` (24 test cases, all 5 attack vectors covered). D-07's "fuzz tests" requirement is **partially pre-satisfied** — Plan 1 should re-run + re-validate them and add any missing cases, not build from scratch.
6. The EVM ERC-3009 `NonceManager` is **in-memory only, single-process**, with a 10-minute TTL processing-nonces cache. CONCERNS.md prediction holds. Likely a HIGH finding for multi-instance deployments (but acceptable with single-instance compensating control per D-16).
7. **CRITICAL surprise:** the EVM `verify` path in `packages/core/src/facilitator.ts:316-369` **does NOT verify the ERC-3009 signature against the `from` address.** It only checks `validAfter`/`validBefore` timestamps and amount. The actual signature check happens implicitly during settle via the on-chain `transferWithAuthorization` revert, which is too late — by then the nonce is consumed. This may surface as CRITICAL or HIGH under D-10. Plan 1 documents; Plan 2 remediates.
8. `semgrep` is **NOT installed**. The planner must either include an install step in Plan 1 (Homebrew on macOS, pip on Linux) or accept it as a deferred/optional tool with grep-only patterns as the baseline. `pnpm audit` works. No `.github/dependabot.yml` exists — that itself becomes a SEC-04 finding per D-04.
9. `tools/security-audit/` (D-05's preferred default) does not exist yet. No `tools/` or `scripts/` dir at repo root. **Recommendation:** create `tools/security-audit/` per D-05's first-listed option; matches the spirit of "re-runnable" and "wireable into CI" without polluting `.planning/` (which is planning state, not source).

**Primary recommendation:** Plan 1 is one atomic commit per D-15 pattern with four substantive deliverables: (a) `24-SECURITY-AUDIT.md` populated, (b) `tools/security-audit/` committed with grep patterns + a documented run command, (c) `pnpm audit` JSON captured, (d) REQUIREMENTS.md drift fixed per D-03 — all in the same commit.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

All 16 decisions D-01 through D-16 in `.planning/phases/24-security-audit-remediation/24-CONTEXT.md` are locked. Research must not relitigate them. Highlights the planner MUST honor:

- **D-01:** Audit scope = full monorepo (`packages/server`, `apps/dashboard`, `packages/core`, `packages/sdk`, `examples/`).
- **D-02:** All 11 CONCERNS.md items auto-promoted as starting findings, each re-validated; "resolved by removal" marker with commit hash for those that no longer apply.
- **D-03:** REQUIREMENTS.md drift fixed in this phase's commit — SEC-05 "Hono" → "Express", traceability table "Phase 25" → "Phase 24" for SEC-01..SEC-06.
- **D-04:** Three audit tools — `pnpm audit`, Dependabot/GitHub Advisory check, `semgrep` (default JS/TS + custom rules).
- **D-05:** Per-SEC-NN grep/semgrep patterns committed; planner picks exact location.
- **D-06:** SEC-02 enumerates every query function under `packages/server/src/db/*.ts` into one table.
- **D-07:** SEC-03 depth = Solana instruction allowlist + EVM/Solana replay protection + fuzz tests for malicious instructions.
- **D-09:** Single findings artifact `24-SECURITY-AUDIT.md`; severity rubric at top.
- **D-10:** Four-tier severity (CRITICAL / HIGH / MEDIUM / LOW); no CVSS, no OWASP cross-tag required.
- **D-11:** `SECURITY-DECISIONS.md` at **repo root**.
- **D-12:** Acceptance entries are structured headings only (8 required fields).
- **D-13:** Two plans — Plan 1 (audit, this run) and Plan 2 (remediation, later run).
- **D-14:** Default = fix; acceptance is escape hatch with compensating control. MEDIUM/LOW logged but not required to remediate.
- **D-15:** New-code hardening in scope when standard (express-rate-limit, cookie flags, debug endpoint removal, sensitive-data log scrub).
- **D-16:** Wider rearchitecture → deferred to future phase via SECURITY-DECISIONS.md.

### Claude's Discretion

- **Exact location for grep/semgrep patterns** — research recommends `tools/security-audit/` (see §10).
- **Plan 1 single vs multi commit** — research recommends single atomic commit per Phase 22/23 D-15 precedent (see §12).
- **`pnpm audit` verbatim vs table** — research recommends JSON captured to `tools/security-audit/pnpm-audit-2026-05-17.json` AND a summary table inside `24-SECURITY-AUDIT.md` (see §7).
- **NonceManager unit tests** — explicitly Claude's-discretion in D; defer to Plan 2 per D-16/D-14 default-fix interpretation.
- **The post-Plan-2 verification gate** (zero secrets-in-console matches) is a Plan 2 concern.

### Deferred Ideas (OUT OF SCOPE for Plan 1)

- CI integration of committed patterns.
- `SECURITY.md` at repo root (optional Plan 2 nice-to-have).
- Middleware-level multi-tenant enforcement.
- Postgres migration for distributed nonce locking.
- Webhook retry / async tx confirmation / audit logging.
- NonceManager unit tests (unless naturally falls out of Plan 2).

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Authentication surface audited (Better Auth config, sessions, route protection, cookie flags) | §3 catalogues every auth-relevant file + every route's auth-gating status; cookie flag inventory included. |
| SEC-02 | Multi-tenant isolation audited (`facilitator_id` scoping on every query, no cross-tenant leakage) | §1 enumerates all 93 exported DB query functions with current WHERE clauses; classification seed produced. |
| SEC-03 | Payment co-signing audited (Solana allowlist, EVM signing, replay protection) | §4 documents current Solana allowlist (4 layers), ERC-3009 NonceManager structure, signature-verification gap in EVM verify. §9 maps existing Solana fuzz tests to D-07's malicious instruction classes. |
| SEC-04 | Secrets and key management audited (env handling, no key/secret logging) | §5 reports the SEC-04 grep yield (26 raw matches) with classification; §5 enumerates `.env.example` files and secret-shaped keys; ACCESS_TOKEN_SECRET fallback confirmed. |
| SEC-05 | Input validation and API hardening audited (Express route schemas, webhook sig verification, rate limits) | §2 inventories every Express route handler with zod-presence and auth-presence flags. CONCERNS.md "No Rate Limiting" re-validated (still applies — no rate-limit middleware installed). |
| SEC-06 | All HIGH/CRITICAL findings remediated or accepted | Plan 2 territory. Plan 1 produces the finding inventory that Plan 2 acts on. |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Multi-tenant query scoping | Database / Storage | API / Backend | Every query MUST filter by `facilitator_id` (or scoped FK like `resource_owner_id`); middleware-level enforcement is deferred per D-16. SEC-02 audit therefore happens at the DB module layer. |
| Session management | Frontend Server (SSR) | API / Backend | Better Auth mounts at `/api/auth/*` and issues HTTP-only session cookies. Dashboard reads session via auth-provider; server validates via `requireAuth` middleware. |
| Auth middleware enforcement | API / Backend | — | `requireAuth` and `requireFacilitator` are Express middleware; SEC-01 audits every router's middleware chain. |
| ERC-3009 signature verification + co-sign | API / Backend | Database / Storage | `packages/core/src/erc3009.ts` constructs and submits the on-chain tx using the facilitator's encrypted-at-rest private key. Replay protection is in-memory only (NonceManager). |
| Solana co-sign as fee payer | API / Backend | — | `packages/core/src/solana.ts` deserializes the payer-signed tx and adds facilitator signature. Instruction allowlist enforced in `solana-validation.ts`. |
| Encryption at rest (private keys) | Database / Storage | API / Backend | `packages/server/src/utils/crypto.ts` derives AES-256-GCM key via PBKDF2 from `BETTER_AUTH_SECRET` / `ENCRYPTION_SECRET` and a per-record salt. Audit confirms key never logged. |
| Webhook delivery + signing | API / Backend | — | HMAC-SHA256 signing; SEC-05 checks signature **verification** correctness in inbound paths (`internal-webhooks.ts`). |
| Input validation | API / Backend | — | Zod schemas at the route layer; SEC-05 grep finds handlers missing zod. |

---

## §1. SEC-02 DB Query Enumeration (seed table per D-06)

This is the seed for the enumeration the auditor will refine inside `24-SECURITY-AUDIT.md`. Source: read of every exported function across the 14 DB modules at HEAD `phase/23-rewards-removal-backend-frontend-docs`. Total: **93 exported query/CRUD functions**.

**Scope classification key:**
- **scoped** — WHERE clause includes `facilitator_id` (or the table's tenant column).
- **unscoped (by-id)** — keyed by primary ID; cross-tenant *only* if ID is unguessable AND no enumeration possible. Auditor decides if "unscoped" is acceptable here.
- **cross-tenant-by-design** — intentionally global (lookups by globally-unique attribute, e.g., `getSubscriptionByTxHash`, `getRegisteredServerByApiKeyHash`).
- **non-tenant** — operates on `user`-owned data, not facilitator-owned (subscriptions, user_wallets, notifications, user_preferences).
- **unclear** — needs auditor decision.

### facilitators.ts (10 functions)
| Fn | File:Line | Table | WHERE | Class |
|----|-----------|-------|-------|-------|
| createFacilitator | facilitators.ts:10 | facilitators | INSERT (owner_address tag) | unscoped (by-id) |
| getFacilitatorById | facilitators.ts:75 | facilitators | id=? | unscoped (by-id) |
| getFacilitatorBySubdomain | facilitators.ts:84 | facilitators | subdomain=? | unscoped (lookup) |
| getFacilitatorByCustomDomain | facilitators.ts:93 | facilitators | custom_domain=? + additional_domains JSON scan | unscoped (lookup) |
| getFacilitatorsByOwner | facilitators.ts:123 | facilitators | owner_address=? | scoped (by-owner) |
| updateFacilitator | facilitators.ts:132 | facilitators | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| deleteFacilitator | facilitators.ts:219 | facilitators | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| isSubdomainAvailable | facilitators.ts:229 | facilitators | subdomain=? | non-tenant lookup |
| getFacilitatorByDomainOrSubdomain | facilitators.ts:239 | facilitators | (composite) | unscoped (lookup) |
| isFacilitatorOwner | facilitators.ts:255 | facilitators | owner_address=? | scoped (by-owner) |
| backfillFacilitatorSubscriptions | facilitators.ts:266 | facilitators+user+subscriptions | DISTINCT join | admin / cross-tenant-by-design |

### transactions.ts (7 functions)
| Fn | File:Line | Table | WHERE | Class |
|----|-----------|-------|-------|-------|
| createTransaction | transactions.ts:8 | transactions | INSERT with facilitator_id | scoped |
| getTransactionById | transactions.ts:53 | transactions | id=? | unscoped (by-id) — **unclear** |
| getTransactionsByFacilitator | transactions.ts:62 | transactions | facilitator_id=? | scoped |
| updateTransactionStatus | transactions.ts:80 | transactions | id=? | unscoped (by-id) — **unclear** |
| getTransactionStats | transactions.ts:115 | transactions | facilitator_id=? | scoped |
| getDailyStats | transactions.ts:156 | transactions | facilitator_id=? | scoped |
| getGlobalStats | transactions.ts:198 | transactions + products + facilitators | (no WHERE; global aggregate) | cross-tenant-by-design |

### products.ts (18 functions)
| Fn | File:Line | Table | WHERE | Class |
|----|-----------|-------|-------|-------|
| createProduct | products.ts:8 | products | INSERT with facilitator_id | scoped |
| getProductById | products.ts:67 | products | id=? | unscoped (by-id) — **unclear** |
| getProductByIdOrSlug | products.ts:76 | products | id=? OR (facilitator_id=? AND slug=?) | partial scoped |
| getProductBySlug | products.ts:86 | products | facilitator_id=? AND slug=? | scoped |
| isProductSlugUnique | products.ts:95 | products | facilitator_id=? AND slug=? | scoped |
| getProductsByFacilitator | products.ts:108 | products | facilitator_id=? | scoped |
| getActiveProducts | products.ts:117 | products | facilitator_id=? AND active=1 | scoped |
| getProductsByGroup | products.ts:126 | products | facilitator_id=? AND group_name=? | scoped |
| getProductGroups | products.ts:135 | products | facilitator_id=? | scoped |
| updateProduct | products.ts:145 | products | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| deleteProduct | products.ts:271 | products | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| createProductPayment | products.ts:281 | product_payments | INSERT (child of products) | scoped (indirect via product_id FK) |
| getProductPaymentById | products.ts:315 | product_payments | id=? | unscoped (by-id) — **unclear** |
| getProductPayments | products.ts:324 | product_payments | product_id=? | scoped (indirect) |
| updateProductPaymentStatus | products.ts:333 | product_payments | id=? | unscoped (by-id) — **unclear** |
| getProductStats | products.ts:368 | product_payments | product_id=? | scoped (indirect) |
| getFacilitatorProductsStats | products.ts:404 | products + product_payments | facilitator_id=? | scoped |
| (12 deprecated aliases at products.ts:447-479) | products.ts:447 | (re-exports) | n/a | deprecated — recommend removal per CONCERNS.md |

### webhooks.ts (9 functions)
| Fn | File:Line | Table | WHERE | Class |
|----|-----------|-------|-------|-------|
| createWebhook | webhooks.ts:16 | webhooks | INSERT with facilitator_id | scoped |
| getWebhookById | webhooks.ts:48 | webhooks | id=? | unscoped (by-id) — **unclear** |
| getWebhooksByFacilitator | webhooks.ts:57 | webhooks | facilitator_id=? | scoped |
| getActiveWebhooks | webhooks.ts:66 | webhooks | facilitator_id=? AND active=1 | scoped |
| getWebhooksByEvent | webhooks.ts:75 | webhooks | facilitator_id=? (filter in JS) | scoped |
| updateWebhook | webhooks.ts:98 | webhooks | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| deleteWebhook | webhooks.ts:154 | webhooks | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| regenerateWebhookSecret | webhooks.ts:164 | webhooks | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| getWebhookStats | webhooks.ts:185 | webhooks | facilitator_id=? | scoped |

### proxy-urls.ts (7 functions)
| Fn | File:Line | Table | WHERE | Class |
|----|-----------|-------|-------|-------|
| createProxyUrl | proxy-urls.ts:56 | proxy_urls | INSERT with facilitator_id | scoped |
| getProxyUrlById | proxy-urls.ts:92 | proxy_urls | id=? | unscoped (by-id) — **unclear** |
| getProxyUrlBySlug | proxy-urls.ts:101 | proxy_urls | facilitator_id=? AND slug=? | scoped |
| getProxyUrlsByFacilitator | proxy-urls.ts:110 | proxy_urls | facilitator_id=? | scoped |
| updateProxyUrl | proxy-urls.ts:119 | proxy_urls | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| deleteProxyUrl | proxy-urls.ts:183 | proxy_urls | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| isSlugUnique | proxy-urls.ts:193 | proxy_urls | facilitator_id=? AND slug=? | scoped |

### resource-owners.ts (9 functions)
| Fn | File:Line | Table | WHERE | Class |
|----|-----------|-------|-------|-------|
| createResourceOwner | resource-owners.ts:8 | resource_owners | INSERT with facilitator_id | scoped |
| getResourceOwnerById | resource-owners.ts:36 | resource_owners | id=? | unscoped (by-id) — **unclear** |
| getResourceOwnerByUserId | resource-owners.ts:45 | resource_owners | facilitator_id=? AND user_id=? | scoped |
| getOrCreateResourceOwner | resource-owners.ts:59 | resource_owners | (composite via above) | scoped |
| getResourceOwnersByFacilitator | resource-owners.ts:75 | resource_owners | facilitator_id=? | scoped |
| getResourceOwnersByUserId | resource-owners.ts:86 | resource_owners | user_id=? | scoped (by-user, not by-facilitator) |
| updateResourceOwner | resource-owners.ts:97 | resource_owners | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| deleteResourceOwner | resource-owners.ts:135 | resource_owners | id=? | unscoped (by-id) — **auditor: caller must verify ownership** |
| getResourceOwnerStats | resource-owners.ts:145 | resource_owners | facilitator_id=? | scoped |

### refund-configs.ts (5 functions) — all keyed by `facilitator_id`
| Fn | File:Line | Class |
|----|-----------|-------|
| createRefundConfig | refund-configs.ts:8 | scoped |
| getRefundConfigByFacilitator | refund-configs.ts:25 | scoped |
| getOrCreateRefundConfig | refund-configs.ts:34 | scoped |
| updateRefundConfig | refund-configs.ts:45 | scoped |
| deleteRefundConfig | refund-configs.ts:79 | scoped |

### refund-wallets.ts (6 functions) — keyed by `resource_owner_id` (which has facilitator_id FK)
| Fn | File:Line | Class |
|----|-----------|-------|
| createRefundWallet | refund-wallets.ts:8 | scoped (indirect via resource_owner_id) |
| getRefundWalletsByResourceOwner | refund-wallets.ts:30 | scoped (indirect) |
| getRefundWallet | refund-wallets.ts:39 | scoped (indirect) |
| getRefundWalletById | refund-wallets.ts:48 | unscoped (by-id) — **unclear** |
| deleteRefundWallet | refund-wallets.ts:57 | scoped (indirect) |
| hasRefundWallet | refund-wallets.ts:67 | scoped (indirect) |

### registered-servers.ts (8 functions)
| Fn | File:Line | Table | Class |
|----|-----------|-------|-------|
| hashApiKey | registered-servers.ts:16 | (util) | n/a |
| createRegisteredServer | registered-servers.ts:23 | registered_servers | scoped (indirect via resource_owner_id) |
| getRegisteredServerById | registered-servers.ts:50 | registered_servers | unscoped (by-id) — **unclear** |
| getRegisteredServersByResourceOwner | registered-servers.ts:59 | registered_servers | scoped (indirect) |
| getRegisteredServerByApiKeyHash | registered-servers.ts:68 | registered_servers | api_key_hash=? AND active=1 | cross-tenant-by-design (lookup by globally-unique secret) |
| getRegisteredServerByApiKey | registered-servers.ts:77 | (via above) | cross-tenant-by-design |
| updateRegisteredServer | registered-servers.ts:85 | registered_servers | id=? | unscoped — **auditor: caller must verify** |
| deleteRegisteredServer | registered-servers.ts:126 | registered_servers | id=? | unscoped — **auditor: caller must verify** |
| regenerateServerApiKey | registered-servers.ts:136 | registered_servers | id=? | unscoped — **auditor: caller must verify** |
| getRegisteredServerStats | registered-servers.ts:155 | registered_servers | scoped (indirect) |

### claims.ts (10 functions, REFUND claims — preserved per Phase 23 D)
| Fn | File:Line | Class |
|----|-----------|-------|
| createClaim | claims.ts:8 | scoped (indirect via resource_owner_id+server_id) |
| getClaimById | claims.ts:49 | unscoped (by-id) — **unclear** |
| getClaimByTxHash | claims.ts:58 | cross-tenant-by-design (lookup by unique tx) |
| getClaimsByResourceOwner | claims.ts:67 | scoped (indirect) |
| getClaimsByUserWallet | claims.ts:103 | by-wallet — partial scoped |
| getClaimableByUserWallet | claims.ts:126 | by-wallet — partial scoped |
| updateClaimStatus | claims.ts:154 | unscoped (by-id) — **auditor: caller must verify** |
| getClaimStats | claims.ts:189 | scoped (indirect) |
| expireOldClaims | claims.ts:240 | UPDATE all eligible (no tenant filter) | cross-tenant-by-design (cron) |
| claimExistsForTxHash | claims.ts:258 | cross-tenant-by-design |

### subscriptions.ts (12 functions) — user-scoped, not facilitator-scoped
All keyed by `user_id` or `id` or `tx_hash`. **Non-tenant** (subscriptions are user-owned, not facilitator-owned). Auditor should mark each row "non-tenant" and confirm caller authenticates the user.

### subscription-payments.ts (4 functions) — same: non-tenant (user-scoped)

### user-wallets.ts (8 functions) — non-tenant (user-scoped)

### user-preferences.ts (2 functions) — non-tenant (user-scoped)

### notifications.ts (7 functions) — non-tenant (user-scoped)

### pending-facilitators.ts (5 functions) — non-tenant (user-scoped, ephemeral)

**Auditor's grep-driven baseline (per D-05 SEC-02):** Cross-check this list with this pattern, run from repo root:
```bash
grep -nE "db\.prepare\(.*(SELECT|UPDATE|DELETE).*FROM (transactions|products|product_payments|webhooks|proxy_urls|resource_owners|registered_servers|claims|refund_wallets|refund_configs|facilitators)" packages/server/src/ --include="*.ts"
```
Any matches where `WHERE` does NOT include `facilitator_id` or a tenant-FK ID column is a candidate finding.

---

## §2. SEC-05 Route Handler Inventory

**Total Express handlers:** 124 across 8 router files. All four routers that accept bodies import `zod`.

| Router | File | Path mount in server.ts | Handlers | zod imports | Notes |
|--------|------|-------------------------|----------|-------------|-------|
| facilitatorRouter | routes/facilitator.ts | `/` (resolveFacilitator) | 8 | yes | Routes: `/favicon.ico`, `/supported`, `/verify`, `/settle`, `/pay/:productId`, `/pay/:productId/requirements`, `/pay/:productId/complete`, `/u/:slug/requirements` |
| adminRouter | routes/admin.ts | `/api/admin` | 71 | yes | Almost all use `requireAuth` — exceptions below |
| publicRouter | routes/public.ts | `/` | 24 | yes | `/free/*`, `/demo/*`, `/api/claims*`, `/api/resource-owners/*` |
| subscriptionsRouter | routes/subscriptions.ts | `/api/subscriptions` | 7 | yes | Mostly `requireAuth`; `/pricing` is public; `/billing` (cron) has no auth — should it? |
| notificationsRouter | routes/notifications.ts | `/api/notifications` | 4 | no | All `requireAuth` |
| statsRouter | routes/stats.ts | `/` | 7 | no | x402-protected (`statsPaymentMiddleware`) where appropriate |
| discoveryRouter | routes/discovery.ts | `/` | 2 | no | Public `/discovery/*` endpoints |
| internalWebhooksRouter | routes/internal-webhooks.ts | `/api/internal/webhooks` | 1 | no | HMAC-SHA256 signature header check; **timingSafeEqual length-mismatch bug** (no length pre-check) |

### Routes missing `requireAuth` that handle facilitator-tenant data (CONFIRMED FINDINGS)
| Route | File:Line | Method | Auth | Notes |
|-------|-----------|--------|------|-------|
| `/facilitators/:id/raw` | admin.ts:1623 | GET | **NONE** | CONCERNS.md confirmed — TODO debug endpoint; returns raw facilitator record (excluding encrypted keys). HIGH per D-10. |
| `/facilitators/:id/domains` | admin.ts:1653 | PATCH | **NONE** | CONCERNS.md confirmed — TODO debug endpoint; allows ANY caller to rebind custom_domain and additional_domains. CRITICAL per D-10 (multi-tenant breakout — attacker can route a victim's domain to their own facilitator config). |
| `/subscriptions/clear` | admin.ts:1687 | DELETE | `requireAuth` | Has auth, but is destructive admin-only operation behind only per-user `requireAuth` (no admin role check post Phase 23 D-07 removal of `requireAdmin`). HIGH — any logged-in user can delete all subscriptions. |

### Routes lacking zod body parse (require auditor manual review)
The grep `req.body` (191 hits) vs `safeParse|\.parse\(|z\.object` (81 hits) is the audit signal — many handlers read `req.body` without an obvious schema. Audit Plan 1 must enumerate inside `24-SECURITY-AUDIT.md`:

```bash
grep -nE "req\.(body|query|params)" packages/server/src/routes/*.ts
```

then cross-reference against zod usage. Specific known gaps:

- **`internal-webhooks.ts:159`** — `const { event, payment, metadata } = req.body;` — no zod schema; fields used directly downstream.
- **`admin.ts:1653`** (`/facilitators/:id/domains`) — `const { custom_domain, additional_domains } = req.body;` — no zod schema; the debug endpoint above. Even with auth, this would fail SEC-05.

### Webhook signature verification
`internal-webhooks.ts:106-120` `verifyWebhookSignature`:
- Uses HMAC-SHA256, hex.
- Uses `crypto.timingSafeEqual` — correct primitive.
- **Bug:** does not pre-check buffer lengths. `timingSafeEqual` throws on mismatched lengths, leaking malformed-vs-wrong-signature info via the thrown error path (the catch path returns 500, not 401 — observable timing). Plan 1 records; Plan 2 fixes with explicit length check returning 401 first.

### Rate limiting
**Not installed.** `package.json` shows no `express-rate-limit` dependency. CONCERNS.md prediction confirmed. SEC-05 finding per D-15 (in scope to install in Plan 2).

### Helmet / CORS
- `helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' })` — CSP only in prod. Auditor should record: in dev, helmet default headers minus CSP are set; in prod, full helmet including CSP. Likely acceptable.
- `cors({ origin: getCorsOrigins(), credentials: true })` — origin allowlist driven by `DASHBOARD_URL` env + hardcoded list in `server.ts:30-44`. Includes dev `localhost:*`. Auditor records: production deployments inherit dev origins from the hardcoded array — likely MEDIUM finding (defense-in-depth: prod allows `localhost:3000` which should never match in prod, but is a hygiene gap).

---

## §3. SEC-01 Auth Surface

### Files
| File | Purpose | Notes |
|------|---------|-------|
| `packages/server/src/auth/config.ts` | Better Auth setup | `db: any` (CONCERNS.md type-safety gap); session `expiresIn: 7d`, `updateAge: 1d`, `cookieCache.maxAge: 5m`. Email verification disabled (`requireEmailVerification: false`). Trusted origins built from env + hardcoded list. databaseHooks creates wallet on signup (failure logged, signup proceeds). |
| `packages/server/src/auth/index.ts` | Singleton init | trivial. |
| `packages/server/src/middleware/auth.ts` | `requireAuth`, `optionalAuth` | Reads session via Better Auth `getSession`. On invalid: 401 + generic message (good — no enumeration). |

### Cookie configuration (Better Auth-managed)
Better Auth manages its own cookies (not directly visible in this codebase). Defaults per `better-auth ^1.2.0`:
- HttpOnly: yes (default).
- Secure: yes when `NODE_ENV=production` (Better Auth defaults).
- SameSite: `lax` by default.
- Domain scope: derived from `BETTER_AUTH_URL`.

Auditor MUST verify these are set correctly at runtime (e.g., by inspecting `Set-Cookie` header on a sign-in response in a dev shell). This is one of the human-verification gates analogous to Phase 23's runtime 404 check.

### Custom cookies (NOT Better Auth)
| Cookie | File:Line | Flags |
|--------|-----------|-------|
| `x402_access_${product.id}` | facilitator.ts:963 | `Path=/; Max-Age=${access_ttl}; HttpOnly; SameSite=Lax; Secure (prod only)` |
| `x402_access_${product.id}` (second write site) | facilitator.ts:2064 | identical to above |

These are signed JWT-like tokens (HMAC-SHA256 over `{productId, exp}`). HttpOnly + SameSite=Lax + Secure-in-prod are correct flags. The vulnerability is the **signing secret fallback** (see §5).

### Routes and their auth status (high-level — see §2 for the inventory)
- **Public (no auth required):** `/health`, `/api/auth/*` (Better Auth managed), `/supported`, `/verify`, `/settle`, `/free/*`, `/demo/*`, `/stats/*`, `/.well-known/*`, `/favicon.ico`, `/icon.svg`, `/discovery/*`, `/pay/:productId*` (token-gated), `/subscriptions/pricing`, `/subscriptions/billing` (cron — **MAY warrant secret header**), `/api/internal/webhooks/subscription` (HMAC-signed), `/api/claims*` (some pieces ungated — see CONCERNS.md item below)
- **`requireAuth`-gated:** all `/api/admin/*` EXCEPT the two confirmed debug endpoints above, all `/api/notifications/*`, all `/api/resource-owners/*`, `/subscriptions/{status,history,payments,purchase,reactivate}`
- **`requireFacilitator`-gated (tenant resolution required):** `/favicon.ico`, `/supported`, `/verify`, `/settle` inside `facilitatorRouter`

### Better Auth concerns to document
- `db: any` at config.ts:16 (CONCERNS.md prediction — still applies; LOW severity per D-10).
- `requireEmailVerification: false` — verifies that signup creates an account with an unverified email. SEC-01 audit notes this as a configuration choice (intentional for v1.x), not a vulnerability per se. Recommend MEDIUM-or-LOW finding flagged for future re-evaluation.
- No CSRF protection visible at the server layer beyond Better Auth's built-in same-site cookie. Better Auth claims to handle this; auditor confirms.

---

## §4. SEC-03 Co-signing Surface

### Solana — `packages/core/src/solana.ts` + `packages/core/src/solana-validation.ts`

**Allowed Programs** (`solana-validation.ts:71-79`):
- `TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA` (TOKEN_PROGRAM_ID)
- `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb` (TOKEN_2022_PROGRAM_ID)
- `ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL` (ASSOCIATED_TOKEN_PROGRAM_ID)
- `ComputeBudget111111111111111111111111111111` (ComputeBudgetProgram.programId)
- `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` (SPL Memo v2)
- `Memo1UhkJBfCR6MNLc2TcVvLBYhiC9TZSfN7CEcDuiw` (SPL Memo v1)

**Allowed token instruction types** (`solana-validation.ts:88-91`):
- `3` — Transfer
- `12` — TransferChecked

**Four-layer validation** (`solana-validation.ts:239-402`):
1. Program ID allowlist (any program outside the set above → reject).
2. Token instruction type allowlist (any token op besides Transfer/TransferChecked → reject; explicitly rejects SetAuthority(6), Approve(4), CloseAccount(9), MintTo(7)).
3. Fee payer isolation (facilitator MUST NOT be `source` or `authority` of token op).
4. Payment requirements (amount ≥ required, mint matches asset, destination ATA = derived ATA of `payTo`).

**Address Lookup Tables explicitly rejected** (`solana-validation.ts:144-153`) — VersionedTransactions with ALT cannot be validated without RPC lookup, so they are refused outright. **This is the correct safe choice.**

**Where co-signing happens**:
- `solana.ts:133-141` — `validateSolanaTransaction` runs before signing.
- `solana.ts:167` — `transaction.sign([facilitatorKeypair])` only if facilitator is fee payer (index 0 of `staticAccountKeys`).
- Blockhash freshness checked at `solana.ts:178-187` before send; re-checked during confirmation poll at `solana.ts:274-292`.

### EVM ERC-3009 — `packages/core/src/erc3009.ts`

**NonceManager structure** (erc3009.ts:72-189):
- In-memory `Map<string, number>` keyed by `${chainId}:${address}` — **single-process only**.
- Mutex via `Map<string, Promise<void>>` for serializing concurrent `acquireNonce` calls on the same key — race-condition-safe within one process.
- On first acquisition: reads on-chain `getTransactionCount(blockTag: 'pending')` and caches.
- `release()` does NOT decrement — comment says nonces may be skipped, chain handles via "nonce too high" recovery on next sync. Auditor records this design choice.
- `syncNonce` / `resetNonce` available for recovery.
- **Multi-instance scaling limit confirmed** — CONCERNS.md "ERC-3009 Nonce Management" still applies. Likely HIGH per D-10 unless production runs single-instance (compensating control per D-16).

**processingNonces dedupe cache** (erc3009.ts:24-56):
- Separate `Map<string, number>` from NonceManager — tracks the **ERC-3009 authorization nonce** (payer-provided), not the EVM tx nonce.
- 10-minute TTL via setInterval cleanup.
- Single-process only — same scaling limit.
- Lookup: `${chainId}:${from}:${authNonce}`. Duplicate submission → reject.

**Signature recovery — CRITICAL OBSERVATION:**
- `erc3009.ts:391-392` calls `parseSignature(signature)` to extract `{v, r, s}` for `transferWithAuthorization(from, to, value, ..., v, r, s)`. The on-chain contract revert is the only signature check.
- `packages/core/src/facilitator.ts:316-369` (the `verify` path for EVM) **does not call any signature recovery function** (no `recoverAddress`, no `recoverTypedData`, no `verifyTypedData` — confirmed via grep across `packages/`). It only checks:
  - chain support (`supportedChains.some(...)`)
  - timestamp validity (`validAfter <= now <= validBefore`)
  - amount sufficiency (`paymentAmount >= requiredAmount`)
- **Implication:** The facilitator returns `isValid: true` to a caller of `/verify` regardless of whether the signature matches `authorization.from`. The on-chain check during `/settle` will reject, but only after the EVM tx is broadcast and gas is paid. Worse, an attacker could spam `/verify` with arbitrary `from` addresses to confirm timestamps and amounts before crafting an exploit elsewhere.
- **Severity prediction:** HIGH or CRITICAL per D-10. The `to`-vs-`payTo` divergence question in D-08 needs the same analysis — currently no code path checks `authorization.to === requirements.payTo`.

### `packages/core/src/facilitator.ts:530-531` — secrets in logs (CONCERNS.md re-validated):
```
console.log('[Facilitator] EVM authorization received:', JSON.stringify(authorization, null, 2));
console.log('[Facilitator] EVM signature received:', signature);
```
Logs the full signature AND the full authorization (including `from`, `value`, `nonce`). HIGH per D-10 — leaks both the credential (signature) and PII-adjacent payment data.

---

## §5. SEC-04 Secrets / Console-log Audit

### Raw grep yield (D-05 pattern)

Command:
```bash
grep -rEn 'console\.(log|error|info|warn).*(privateKey|secretKey|signingKey|authorization|signature|ENCRYPTION_KEY|BETTER_AUTH_SECRET|ACCESS_TOKEN_SECRET)' packages/ apps/ --include='*.ts' --include='*.tsx'
```

**Result: 26 matches.** Classification (auditor refines in Plan 1):

| File:Line | Severity guess | Notes |
|-----------|----------------|-------|
| `packages/core/src/facilitator.ts:530` | HIGH | Logs full ERC-3009 `authorization` object — including `from`, `value`, `nonce`. |
| `packages/core/src/facilitator.ts:531` | HIGH | Logs full EVM `signature`. |
| `packages/core/src/erc3009.ts:352` | MEDIUM | Logs ERC-3009 nonce (the payer's authorization nonce, not the EVM tx nonce). Identifying but not directly exploitable. |
| `packages/core/src/erc3009.ts:389` | HIGH | Raw signature logged. |
| `packages/core/src/erc3009.ts:390` | LOW | Signature length only. |
| `packages/core/src/erc3009.ts:392` | HIGH | `v, r, s` components of signature — equivalent to logging the signature itself. |
| `packages/core/src/erc3009.ts:562-565` | LOW | Error-recovery hints — text only, no secret data. |
| `packages/core/src/solana.ts:155` | LOW | Signature count, not content. |
| `packages/core/src/solana.ts:165` | LOW | Status message, no secret. |
| `packages/core/src/solana.ts:168` | LOW | Signature count. |
| `packages/core/src/solana.ts:200` | MEDIUM | Logs the resulting tx signature (post-broadcast). On-chain data, so technically public, but logging makes correlation easier. |
| `packages/core/src/solana.ts:206` | MEDIUM | Same as above. |
| `packages/core/src/solana.ts:261, 301` | LOW | Confirmation status log; signature is on-chain. |
| `packages/core/src/solana.ts:311` | LOW | Same — signature is on-chain. |
| `packages/integration-tests/src/base-real.test.ts:255, 302` | INFO | Test file — truncated nonce log. Not production code; LOW or INFO. |
| `packages/integration-tests/src/solana-real.test.ts:206, 256` | INFO | Same — test. |
| `packages/server/src/routes/internal-webhooks.ts:153` | LOW | "Invalid signature" — no actual signature value logged. Acceptable. |
| `packages/server/src/services/x402-client.ts:189` | LOW | Status message. |
| `packages/server/src/services/x402-client.ts:420` | MEDIUM-HIGH | `console.log('[x402Client] Payer signature:', signature);` — logs full payer signature. |
| `packages/server/src/services/claims.ts:369` | LOW | Refund tx hash — on-chain. |
| `packages/server/src/services/claims.ts:402` | LOW | Authorization "Creating" — context only, no secret. |

**Net per D-15:** Plan 2 should remove or redact at least `packages/core/src/facilitator.ts:530-531`, `packages/core/src/erc3009.ts:389,392`, `packages/server/src/services/x402-client.ts:420`. Plan 1 just records.

### `.env.example` files

| File | Secret-shaped keys declared |
|------|------|
| `packages/server/.env.example` | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `RAILWAY_TOKEN`, `FREE_FACILITATOR_EVM_KEY`, `FREE_FACILITATOR_SOLANA_KEY`, `X402JOBS_API_KEY`, `SUBSCRIPTION_WEBHOOK_SECRET`, plus RPC URLs (low-risk). |
| `apps/dashboard/.env.example` | Only `NEXT_PUBLIC_*` (intentionally client-side). No secret-shaped vars. |

Notably **absent** from `.env.example` despite being read at runtime:
- `ACCESS_TOKEN_SECRET` (read at `facilitator.ts:27` — falls back to derived key if unset).
- `ENCRYPTION_KEY` (read at `facilitator.ts:28` as fallback chain for ACCESS_TOKEN_SECRET).
- `ENCRYPTION_SECRET` (read at `crypto.ts:16` as alternative to `BETTER_AUTH_SECRET`).

**These are findings per SEC-04 D-15:**
- ACCESS_TOKEN_SECRET fallback derivation is CONCERNS.md confirmed. Severity HIGH per D-10 — production deployments that forget to set it inherit a deterministic, low-entropy default (`sha256("openfacilitator-access-default")` if both ACCESS_TOKEN_SECRET and ENCRYPTION_KEY are unset; or `sha256(ENCRYPTION_KEY)` otherwise).
- `ENCRYPTION_KEY` and `ENCRYPTION_SECRET` not documented in `.env.example` is hygiene MEDIUM.

### `utils/crypto.ts` (encryption at rest)
- AES-256-GCM with per-record salt (32 bytes), IV (16 bytes), authTag (16 bytes), PBKDF2 100k iterations, SHA-256.
- Key derived from `BETTER_AUTH_SECRET || ENCRYPTION_SECRET`. **If neither is set, throws.** ✓ correct fail-closed behavior.
- Format: `base64(salt || iv || authTag || ciphertext)` — straightforward.
- No KMS / no key rotation — out of scope per D-16 (deferred).

---

## §6. CONCERNS.md Re-validation per D-02

Each of the 11 items in `.planning/codebase/CONCERNS.md` — re-validated against HEAD (`phase/23-rewards-removal-backend-frontend-docs`, commits up to `e143776 feat(23-01): excise $OPEN rewards program`).

| # | CONCERNS.md item | Still applies? | Evidence | Initial severity per D-10 |
|---|--------------------|----------------|----------|---------------------------|
| 1 | Debug Endpoints Left in Production (`admin.ts:1211,1241,1275`) | **YES (path shifted to 1623, 1653, 1687)** | Read confirmed: `/facilitators/:id/raw` at admin.ts:1623, `/facilitators/:id/domains` at admin.ts:1653, `/subscriptions/clear` at admin.ts:1687. | CRITICAL for `/domains` (multi-tenant breakout); HIGH for `/raw`; HIGH for `/subscriptions/clear` (no admin role check). |
| 2 | Missing Transaction Confirmation Monitoring (`facilitator.ts:588`) | partial (out of scope per D-deferred — reliability, not security) | Multi-network settlement code exists; confirmation polling exists for Solana (`solana.ts:240-309`) and viem `waitForTransactionReceipt` for EVM. The "instant success" critique applies to a previous code path that's been refactored. Auditor verifies. | MEDIUM (reliability gap; SEC-03 borderline). |
| 3 | Deprecated Type Aliases (`PaymentLink*`, etc.) | YES | `products.ts:447-479` still exports 12 deprecated aliases. `claims.ts:265` still exports `getClaimsByFacilitator`. `registered-servers.ts:182` still exports `getRegisteredServersByFacilitator`. | LOW (hygiene; documented `@deprecated`). |
| 4 | Inline Webhook URL Support (legacy) | YES | `db/products.ts` schema still has `webhook_url` + `webhook_secret`; `facilitator.ts` route still reads both `webhook_id` and inline. | LOW (defense-in-depth — dual paths are confusing but not exploitable). |
| 5 | DB Migration Logic in `initializeDatabase` | YES (partial — migrations system exists at `db/migrations/` and runs alongside bootstrap) | `db/index.ts` still has 656 lines of bootstrap CREATE TABLE statements coexisting with the migration runner. | LOW (architectural; not exploitable). |
| 6 | `any` Type Usage (auth db) | YES | `auth/config.ts:16` still `const db: any = new Database(dbPath);` | LOW (type safety, not security). |
| 7 | Wallet Signature Verification Not Implemented (`public.ts:702-706`) | YES (path shifted; still present at `public.ts:744-749`) | Read confirmed: `/api/claims/:id/execute` (refund claim payout) has commented-out signature verification at lines 745-749 with TODO comment. The endpoint relies on `getClaimById` ownership — any authenticated user could in principle execute a payout for any claim with status='approved'. Reading the handler more carefully: it does NOT check `req.user.id === claim.user_wallet`'s owning user. **HIGH per D-10.** | HIGH. |
| 8 | No Rate Limiting | YES | `package.json` has no `express-rate-limit`; full-tree grep for `rateLimit` returns no matches. | HIGH per D-15 (sensitive endpoints — `/verify`, `/settle`, auth — vulnerable to brute force / DoS). |
| 9 | Debug Endpoints Without Authorization | YES — same as item 1 | See item 1. | (folded into item 1) |
| 10 | Access Token Fallback Secret | YES | `facilitator.ts:27-28` still has the fallback chain `ACCESS_TOKEN_SECRET || sha256(ENCRYPTION_KEY || 'openfacilitator-access-default')`. | HIGH. |
| 11 | Console Logging of Sensitive Data | YES (partial — some refactored, most remains) | See §5 — 26 raw matches; `core/src/facilitator.ts:530-531` and `core/src/erc3009.ts:389,392` are the worst offenders. | HIGH for the worst, LOW-MEDIUM for the rest. |

### CONCERNS.md "resolved by removal" candidates

After re-reading the Phase 23 verification report, NO CONCERNS.md item was directly resolved by Phase 22 or 23 removals. The CONCERNS.md doc dated 2026-01-19 named files that all still exist post-removal. The Phase 23 verification report (line 39, "All admin campaign CRUD routes…") removed rewards-specific routes and files but did NOT touch the items above.

**Auditor's "resolved by removal" section in `24-SECURITY-AUDIT.md` will be empty** unless the auditor finds a CONCERNS item this research missed. Plan 1 should still include the section header for the structured artifact, with note "No CONCERNS items resolved by Phase 22/23 removals; all 11 items are now Phase 24 findings."

(Aside — CONCERNS.md was written before Phase 22/23 ran. It does NOT contain rewards-program findings, so there is nothing to mark "resolved by removal" specifically because of rewards being gone. The Phase 23 reward-claim signature verification removal does mean `utils/solana-verify.ts` is gone — but that file was NOT in CONCERNS.md.)

---

## §7. Tool Availability Survey

| Tool | Status | Notes |
|------|--------|-------|
| `pnpm` | ✓ 9.14.2 | Available. `pnpm audit` works at the workspace root. Output is JSON with `--json`. |
| `pnpm audit` baseline | not yet captured | Not previously run / not committed. Plan 1 captures fresh. |
| `semgrep` | ✗ NOT INSTALLED | `command -v semgrep` returns 1. No prior baseline. |
| Dependabot | ✗ DISABLED | No `.github/dependabot.yml` exists. Per D-04 this itself becomes a SEC-04 finding. Plan 1 records; Plan 2 either adds the YAML file or accepts the gap in SECURITY-DECISIONS.md (D-12). |
| GitHub Advisory tab | not checked in this research | The audit must inspect via `gh api repos/{owner}/{repo}/vulnerability-alerts` or the Security tab in the GitHub web UI during Plan 1. |
| Custom `tools/security-audit/` patterns | does not exist | Created in Plan 1 per D-05. |
| Existing fuzz tests | ✓ EXISTS | `packages/integration-tests/src/solana-security.test.ts` (28k bytes, 24 tests across 6 attack vector categories). |
| Test framework | Vitest 4.x (server), Vitest 3.x (integration-tests) | Run via `pnpm --filter @openfacilitator/server test` and `pnpm --filter @openfacilitator/integration-tests test`. |

**Decision per D-04 line: "**Run default JS/TS rulesets…**":** If semgrep is unavailable, Plan 1 must commit the rule files anyway (so they are re-runnable when semgrep is installed) AND fall back to a documented set of `grep -rE` patterns that approximate the semgrep rules. The grep patterns are the only thing that actually executes in this audit run.

**Recommendation:** Plan 1 includes one task `INSTALL semgrep (best effort)` that attempts `brew install semgrep || pip install semgrep` and marks "skip" if neither works. The grep patterns are the authoritative gate.

---

## §8. Validation Architecture (per Nyquist Dimension 8)

**Test infrastructure:**
| Property | Value |
|----------|-------|
| Framework | Vitest 4.x (server), Vitest 3.x (integration-tests) |
| Config files | `packages/server/vitest.config.ts` (defaults), `packages/integration-tests/vitest.config.ts` (custom timeouts + setup.ts) |
| Quick run command | `pnpm --filter @openfacilitator/server test` |
| Full suite (incl. real) | `pnpm --filter @openfacilitator/integration-tests test:all` |
| Solana security-only | `pnpm --filter @openfacilitator/integration-tests test:security` (per current package.json — verify, the doc string at top of solana-security.test.ts names it) |
| pnpm audit | `pnpm audit --json` (workspace root) |

### Plan 1 verification gates (the gate the plan-checker can mechanically verify)

| What the audit must prove | Negative test | How plan-checker verifies "audit was done" |
|---------------------------|---------------|---------------------------------------------|
| **SEC-01:** Every Express handler's auth status is enumerated. | "Are there routes accepting facilitator/user data without `requireAuth` or `requireFacilitator`?" — yes, the three confirmed debug endpoints. | `24-SECURITY-AUDIT.md` has a §SEC-01 findings table with ≥ 1 row referring to admin.ts:1623, ≥ 1 row referring to admin.ts:1653, ≥ 1 row referring to admin.ts:1687. |
| **SEC-02:** Every DB query function is row-classified. | "Are there cross-tenant queries with no facilitator_id filter and no acceptable rationale?" — at minimum 12 "unscoped (by-id)" rows in §1 need auditor decisions. | `24-SECURITY-AUDIT.md` §SEC-02 enumeration table contains ≥ 93 rows (one per exported DB function). Each row has a non-blank Class column. |
| **SEC-03:** Allowlist completeness verified against Solana SPL Token instruction set; ERC-3009 NonceManager + processingNonces structure documented. | Existing fuzz tests cover 5 attack vectors. Audit confirms no instruction type 4 (Approve), 6 (SetAuthority), 7 (MintTo), 9 (CloseAccount), or any non-allowlisted program reaches the signing path. | `pnpm --filter @openfacilitator/integration-tests test:security` exits 0 (existing tests pass against current allowlist). |
| **SEC-03 (EVM signature gap):** Auditor records that `Facilitator.verify` does NOT recover signature against `from` address. | Negative test would be: submit a `/verify` request with a forged signature — current code returns `isValid: true`. Plan 1 documents; Plan 2 remediates with `verifyTypedData` from viem. | `24-SECURITY-AUDIT.md` §SEC-03 contains a finding row citing `packages/core/src/facilitator.ts:316-369` and stating "no signature recovery". |
| **SEC-04:** Secrets-in-console grep result captured verbatim. | `grep` returns 26 matches today; audit categorizes each. | `24-SECURITY-AUDIT.md` §SEC-04 contains a table of all 26 grep hits with severity. `tools/security-audit/sec04-secrets-in-logs.sh` exists and committed. |
| **SEC-04 (Dependabot):** Dependabot status checked. | "Is `.github/dependabot.yml` present?" — no. | `24-SECURITY-AUDIT.md` §SEC-04 contains finding referencing the missing file. |
| **SEC-05:** Every handler enumerated with zod-presence + auth-presence flags. | Routes missing zod that read `req.body`/`req.query` — at minimum `internal-webhooks.ts:159`. | `24-SECURITY-AUDIT.md` §SEC-05 enumeration has 124 rows. |
| **SEC-05 (Rate limit):** Audit confirms no rate-limit middleware. | `grep -E "express-rate-limit|rateLimit" packages/server/package.json` returns no matches. | `24-SECURITY-AUDIT.md` §SEC-05 has a finding row for missing rate limit. |
| **SEC-06 (Plan 2 territory):** N/A in Plan 1. | — | Plan 1 is complete when items 1-5 above pass. |

### Plan 1 row-count gates (deterministic)
- §SEC-02 enumeration table row count ≥ 93 (the exported function count documented in §1; allow auditor to add rows for any function this research missed).
- §SEC-05 handler enumeration row count ≥ 124 (the Express handler count in §2).
- §SEC-04 grep result table row count ≥ 26 (the current pattern yield).
- §CONCERNS.md re-validation table row count = 11.

### Wave 0 gaps
- Install `semgrep` OR document its absence + use grep-only patterns.
- Confirm `pnpm --filter @openfacilitator/integration-tests test:security` actually exists as a script — verified yes via doc string at solana-security.test.ts:11.
- No `vitest.config.ts` in `packages/server` (using defaults) — acceptable for Plan 1.

---

## §9. SEC-03 Solana Fuzz Test Scaffolding (per D-07)

**Current state:** `packages/integration-tests/src/solana-security.test.ts` already exists with 24 tests across 6 categories. Mapping to D-07's attack classes:

| D-07 attack class | Existing test coverage | File:Line | Gap? |
|---|---|---|---|
| Transfer to attacker (token theft via facilitator-as-authority) | `attack vector 2: token theft via facilitator as authority` | solana-security.test.ts:362-417 | None. |
| Drain fees (SOL theft via SystemProgram) | `attack vector 1: SOL theft via SystemProgram` | solana-security.test.ts:311-360 | None. |
| `setAuthority` | `attack vector 5: token delegation via approve/setAuthority` → `should reject token SetAuthority instruction` | solana-security.test.ts:536 | None. |
| `closeAccount` | `should reject token CloseAccount instruction (type 9)` | solana-security.test.ts:562 | None. |
| Arbitrary program invocation | `attack vector 4: governance hijack via arbitrary program` | solana-security.test.ts:450-507 | None. |
| Oversized instruction sets / bypass length checks | NOT explicitly tested | — | **Gap.** Plan 1 adds a test like: build a tx with 100 ComputeBudget noops + 1 legit transfer (should pass — only Layer-1 allowlist enforced) and another with deliberately malformed instruction data shorter than expected (should fail Layer 2 length check). |
| `Approve` (token delegation) | `should reject token Approve instruction` | solana-security.test.ts:510 | None. |
| `MintTo` | `should reject token MintTo instruction (type 7)` | solana-security.test.ts:589 | None. |

**Plan 1 recommendation:** Add ONE new test case to `solana-security.test.ts` for the "oversized instruction sets" gap. Path: `packages/integration-tests/src/solana-security.test.ts`. Test name: `it('should reject token instruction with truncated data', async () => { ... })`. The test builds a Transfer instruction with `data: Buffer.from([3])` (only the type byte, missing the 8-byte amount) and asserts `/verify` returns `isValid: false` with reason matching `/data too short/i`.

Also: **rename does not apply** — the file is already correctly named. Just append the new test case.

---

## §10. Pattern File Location (per D-05)

**Survey of repo-root directories:**
- `tools/` — does not exist.
- `scripts/` — does not exist at repo root. (Per-package `packages/server/scripts/` exists for build/migration helpers.)
- `.planning/security-audit-patterns/` — does not exist.

**Recommendation: `tools/security-audit/`**

Reasoning:
- D-05 lists `tools/security-audit/` first; the language reads as the planner's expected default.
- Matches the "wireable into CI later" criterion — `tools/` is the conventional home for repo-level developer tooling (vs `scripts/` which is often per-package).
- Keeps `.planning/` clean — `.planning/` holds GSD planning state, not source artifacts.
- Future CI integration can call `bash tools/security-audit/run-all.sh` without path confusion.

**Proposed contents (Plan 1 creates):**
```
tools/security-audit/
├── README.md                          # How to re-run the audit
├── run-all.sh                         # Top-level driver: runs grep gates + pnpm audit
├── grep/
│   ├── sec02-cross-tenant.sh          # SEC-02 unscoped-query grep (per D-05)
│   ├── sec04-secrets-in-logs.sh       # SEC-04 console-log grep (per D-05)
│   ├── sec05-handlers-without-zod.sh  # SEC-05 missing-zod grep (per D-05)
│   └── sec05-handlers-without-auth.sh # SEC-05 missing-requireAuth grep
├── semgrep/
│   └── openfacilitator.yaml           # custom semgrep rules (present even if semgrep is uninstalled)
└── outputs/
    └── pnpm-audit-2026-05-17.json     # captured pnpm audit output
```

The `outputs/` subdirectory is git-tracked so subsequent audits can diff against prior runs.

---

## §11. REQUIREMENTS.md Drift Evidence (per D-03)

Exact lines that the Plan 1 commit must change in `.planning/REQUIREMENTS.md`:

### Change 1: SEC-05 wording
- **Line 37 (current):** `- [ ] **SEC-05**: Input validation and API hardening audited (Hono route schemas, webhook signature verification, rate limits)`
- **Replace `Hono route schemas` with `Express route schemas`**.
- After: `- [ ] **SEC-05**: Input validation and API hardening audited (Express route schemas, webhook signature verification, rate limits)`

### Change 2: Traceability table — six rows
Current state (lines 81-86):
```
| SEC-01 | Phase 25 | Planning |
| SEC-02 | Phase 25 | Planning |
| SEC-03 | Phase 25 | Planning |
| SEC-04 | Phase 25 | Planning |
| SEC-05 | Phase 25 | Planning |
| SEC-06 | Phase 25 | Planning |
```

Replace `Phase 25` with `Phase 24` on each of the six rows. Status column stays `Planning` per Phase 23 precedent (Phase 23 left checkboxes unchecked and Status = `Planning` after completion — these are post-milestone editorial decisions; not the responsibility of the audit run).

---

## §12. Drift-Fix Precedent (atomicity)

Phase 22 D-05 set the pattern: one atomic commit covering all changes (server routes, db module + migration, dashboard component + api.ts + tab integration + verification). Phase 23 D-15 extended the pattern to a 5k-LOC pure-deletion commit, and Phase 23 D-04 confirmed the same-commit drift-fix idiom by amending `REQUIREMENTS.md REWARDS-02` inside the removal commit.

For Phase 24 Plan 1, the same idiom applies: one atomic commit per D-15-precedent containing the populated `24-SECURITY-AUDIT.md`, the committed `tools/security-audit/` patterns, the captured `pnpm-audit-2026-05-17.json`, the new oversized-instruction Solana test case, and the REQUIREMENTS.md drift fix per D-03. This is consistent with Phase 22/23 atomicity, even though D-13 explicitly diverges from the atomic-plan structure at the *phase* level (by splitting into Plan 1 + Plan 2) — atomicity inside *each plan's commit* remains the convention.

---

## Runtime State Inventory

Phase 24 is an **audit**, not a rename/refactor/migration. No runtime state to inventory.

If Plan 2 ends up doing the standard hardening items per D-15 (express-rate-limit, cookie flags, log scrub, debug endpoint removal), those are pure code edits with no DB-side state. The ACCESS_TOKEN_SECRET fix would invalidate any in-flight `x402_access_*` cookies — but that is a Plan 2 concern and acceptable cookie-rotation behavior (cookies are short-lived per `access_ttl`).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `pnpm` | `pnpm audit`, `pnpm build`, `pnpm test` | ✓ | 9.14.2 | — |
| `pnpm audit` | D-04 baseline | ✓ | (via pnpm) | — |
| `semgrep` | D-04 (third tool) | ✗ | — | Use grep-only patterns; commit semgrep rules anyway for future runs. Plan 1 attempts `brew install semgrep \|\| pip install semgrep` best-effort. |
| Dependabot | D-04 (second tool) | ✗ (no `.github/dependabot.yml`) | — | Document as SEC-04 finding; Plan 2 may add the YAML or accept. |
| `gh` CLI | GitHub Advisory tab inspection | not surveyed in this research | — | Auditor runs `gh api repos/{owner}/{repo}/vulnerability-alerts` or visits GitHub Security tab in browser. |
| Node ≥20 | All builds | assumed ✓ (package.json engines) | ≥20 | — |
| Vitest | Test runs | ✓ | 4.x server / 3.x integration-tests | — |

**Missing dependencies with no fallback:** none — semgrep is the only missing tool and grep patterns are the documented fallback per D-04 language.

---

## Security Domain — ASVS Categories

Per repo config, `security_enforcement` defaults to enabled. Mapping the OWASP ASVS categories to Phase 24's audit:

| ASVS Category | Applies | Audit-area in Phase 24 |
|---------------|---------|------------------------|
| V2 Authentication | yes | SEC-01 — Better Auth config, session lifetime, requireAuth middleware |
| V3 Session Management | yes | SEC-01 — cookie flags (httpOnly, secure, sameSite, max-age, domain) |
| V4 Access Control | yes | SEC-01 + SEC-02 — route-level requireAuth + DB-level tenant scoping |
| V5 Input Validation | yes | SEC-05 — zod schemas at route layer |
| V6 Cryptography | yes | SEC-04 — AES-256-GCM with PBKDF2 (crypto.ts); HMAC-SHA256 for webhooks + access tokens; ed25519 (Solana) and secp256k1 (EVM) signatures via library code (libsodium / viem) — never hand-rolled |
| V7 Error Handling & Logging | yes | SEC-04 — console-log audit, no secret-leak in error paths |
| V9 Communication | partial | helmet + cors; TLS termination handled by Railway / hosting layer |
| V10 Malicious Code | yes | D-04 dependency advisories via `pnpm audit` + Dependabot |

### Known threat patterns for this stack

| Pattern | STRIDE | Standard mitigation | Current state |
|---------|--------|---------------------|----------------|
| SQL injection | Tampering | better-sqlite3 prepared statements with `?` placeholders | ✓ consistently used (verified by reading all 14 DB modules) |
| Cross-tenant data access | Information Disclosure | `WHERE facilitator_id = ?` on every tenant table | partial — §1 identifies ≥ 12 "by-id" queries that need caller-side ownership verification |
| Auth bypass on admin routes | Elevation of Privilege | `requireAuth` middleware on every admin handler | partial — 2 confirmed gaps (admin.ts:1623, admin.ts:1653) + 1 missing-admin-role gap (admin.ts:1687) |
| Signature forgery (EVM ERC-3009) | Spoofing | Recover address from signature, compare to `from` | **MISSING** — `core/src/facilitator.ts:316-369` does not recover. Likely CRITICAL. |
| Replay (EVM) | Tampering | Authorization nonce dedupe + on-chain nonce uniqueness | partial — in-memory dedupe only; on-chain check ultimate guarantee |
| Replay (Solana) | Tampering | Recent blockhash window + `isBlockhashValid` re-check | ✓ implemented at `solana.ts:178-187` + `solana.ts:280-292` |
| Malicious Solana instruction injection | Tampering / EoP | 4-layer instruction allowlist | ✓ implemented at `solana-validation.ts:239-402`; fuzz tests cover all 5 D-07 attack classes |
| Sensitive data in logs | Information Disclosure | Structured logging with redaction; never `console.log` raw signatures/keys | partial — 26 grep hits, several HIGH severity |
| Rate-limit / brute-force | Denial of Service | `express-rate-limit` per-IP and per-user | **MISSING** entirely |
| CSRF on session cookies | Spoofing | SameSite=Lax/Strict + state-changing endpoints require explicit auth header or anti-CSRF token | partial — Better Auth defaults; not explicitly audited |
| Insecure direct object reference | Information Disclosure | DB query filtering or per-handler ownership check | partial — §1 enumerates ≥ 12 unscoped-by-id queries that may IDOR |

---

## Assumptions Log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Better Auth default cookie flags (HttpOnly: yes, Secure: prod-only, SameSite: lax) match the version 1.2.x defaults | §3 | LOW — auditor must verify at runtime (Set-Cookie inspection); the actual default behavior depends on Better Auth version. If wrong, SEC-01 finding shifts severity. |
| A2 | The 26-result grep yield for SEC-04 matches `[CITED]` from running the D-05 pattern on HEAD — no false negatives missed | §5 | MEDIUM — Plan 1 auditor re-runs the grep to confirm; new commits between now and Plan 1 execution could shift the count. |
| A3 | The EVM `verify` path's lack of signature recovery is a CRITICAL-or-HIGH finding rather than intentional design | §4 | MEDIUM — auditor may discover this was intentional (the `/verify` endpoint is documented as "best-effort sanity check, settlement is the real check"). Severity could shift down to MEDIUM. The fact that on-chain `transferWithAuthorization` reverts on bad signature is a real compensating control; question is whether `/verify` returning `isValid: true` for forged signatures violates the protocol contract. |
| A4 | "Phase 25" in REQUIREMENTS.md traceability table is unambiguously a drift artifact (the original phase split predated the v1.3 roadmap merge) | §11 | LOW — Phase 23 verification report explicitly cites this same drift; D-03 in 24-CONTEXT.md confirms intent. |
| A5 | `tools/` is the right home for `security-audit/` patterns vs `scripts/` or `.planning/security-audit-patterns/` | §10 | LOW — D-05 explicitly leaves location to planner discretion; `tools/` is the first option D-05 lists. |
| A6 | All 11 CONCERNS.md items are Phase 24 findings, none are "resolved by removal" | §6 | LOW — re-reading CONCERNS.md and the Phase 22/23 verification reports, no CONCERNS.md item names a file that Phase 22 or 23 deleted. If the auditor finds a transitive resolution (e.g., a CONCERNS.md item was about a function that called into deleted code), the "resolved by removal" section will pick it up. |
| A7 | `pnpm audit` returns actionable advisories at the workspace root | §7 | LOW — confirmed by running `pnpm audit --json` during research (returned a JSON with `actions` array). |
| A8 | Dependabot has not been silently enabled at the GitHub repo level despite the missing `.github/dependabot.yml` | §7 | MEDIUM — Plan 1 auditor must check the GitHub Security tab via `gh api repos/{owner}/{repo}/vulnerability-alerts` to confirm. The file's absence is necessary but not sufficient evidence. |

**No claim in this research was tagged `[ASSUMED]` for compliance / retention / security target values** — these decisions are locked in CONTEXT.md (D-10 severity rubric, D-13 plan split, D-15 fix-or-accept).

---

## Open Questions

1. **Is the missing EVM signature recovery in `Facilitator.verify` intentional?**
   - What we know: code path simply does not call `recoverAddress` / `verifyTypedData`. The on-chain revert during settlement is the only signature check.
   - What's unclear: whether the original developer intended `/verify` to mean "all preconditions except cryptographic validity check out" or "this payment is genuine."
   - Recommendation: Plan 1 documents the gap with cite. Plan 2 fixes by adding `verifyTypedData` (viem) call. If the gap turns out to be intentional, Plan 2 instead adds a SECURITY-DECISIONS.md entry per D-12 with compensating control ("on-chain revert during settlement"). Severity remains CRITICAL or HIGH per D-10.

2. **Should `to`-vs-`payTo` mismatch be a verify-time check?**
   - What we know: D-08 calls this out as part of SEC-03 scope. No current code path checks `authorization.to === requirements.payTo` for EVM.
   - What's unclear: same question as #1 — is this the verify endpoint's responsibility or settlement's?
   - Recommendation: same answer as #1. Document in Plan 1; fix or accept in Plan 2.

3. **Does Dependabot exist at the GitHub project level despite the missing YAML?**
   - What we know: no `.github/dependabot.yml`. Dependabot may be enabled by default for public repos via GitHub.com settings, but it would still respect missing-config = no scanning.
   - What's unclear: whether the GitHub Security tab is showing any auto-dismissed advisories.
   - Recommendation: Plan 1 auditor runs `gh api repos/{owner}/{repo}/vulnerability-alerts` once during execution to capture state. Plan 2 either commits `.github/dependabot.yml` or accepts.

4. **Is the `services/x402-client.ts:420` payer-signature log a security risk?**
   - What we know: `console.log('[x402Client] Payer signature:', signature);` — logs full signature.
   - What's unclear: this is in the *internal x402 client*, used for dogfooding subscription activation. The signature logged is the OpenFacilitator-internal payer signature, signed by the OpenFacilitator-managed billing wallet. So leaking it would leak the system's own credentials, not a user's.
   - Recommendation: MEDIUM-or-HIGH finding (lean HIGH because the internal billing wallet IS the keys to the kingdom). Plan 2 removes the log line.

---

## Sources

### Primary (HIGH confidence — codebase read)
- `packages/server/src/db/*.ts` (14 files, 4,024 lines total) — read for §1 enumeration.
- `packages/server/src/routes/*.ts` (8 files) — read+grep for §2 inventory; spot-read of `admin.ts:1615-1700` for §3 confirmation of unauthenticated endpoints.
- `packages/server/src/auth/config.ts`, `auth/index.ts`, `middleware/auth.ts`, `middleware/tenant.ts`, `server.ts` — read for §3.
- `packages/core/src/erc3009.ts:1-450`, `solana.ts` (all), `solana-validation.ts` (all), `facilitator.ts:200-580` — read for §4.
- `packages/server/src/utils/crypto.ts`, `packages/server/.env.example`, `apps/dashboard/.env.example` — read for §5.
- `packages/integration-tests/src/solana-security.test.ts` — partial read + `describe`/`it` enumeration for §9.
- `packages/server/src/routes/internal-webhooks.ts` — full read for webhook-signature analysis.
- `packages/server/src/services/webhook.ts` — full read.
- `.planning/codebase/{CONCERNS,STACK,ARCHITECTURE,CONVENTIONS,STRUCTURE,TESTING}.md` — full read.
- `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`, `.planning/STATE.md` — full read.
- `.planning/phases/22-storefronts-removal/22-CONTEXT.md`, `.planning/phases/23-rewards-removal-backend-frontend-docs/23-CONTEXT.md`, `23-VERIFICATION.md` — full read.

### Secondary (MEDIUM confidence — tool output)
- `grep -rEn 'console\.(log|error|info|warn).*(privateKey|secretKey|signingKey|authorization|signature|ENCRYPTION_KEY|BETTER_AUTH_SECRET|ACCESS_TOKEN_SECRET)'` over `packages/` and `apps/` — 26 matches.
- `git log --oneline -- packages/server/src/routes/public.ts` (and similar for other files) — confirms `e143776 feat(23-01): excise $OPEN rewards program` and `2f6284b feat(22-01): delete server-side storefront code` as the removal commits.
- `pnpm audit --json` — returns JSON with `actions` array (advisories present).
- `which semgrep` → not found.
- `ls .github/dependabot.yml` → not found.

### Tertiary (LOW confidence — training knowledge, marked for live verification by Plan 1)
- Better Auth v1.2.x default cookie flags (A1 above).
- GitHub Dependabot auto-enablement behavior for public repos (A8 above).

---

## Metadata

**Confidence breakdown:**
- DB query enumeration (§1): HIGH — read every file's exported functions.
- Route handler inventory (§2): HIGH — grep + spot-read of debug endpoints confirmed CONCERNS.md predictions.
- Auth surface (§3): HIGH — read all 4 relevant files; only A1 (cookie flag defaults) is MEDIUM.
- Co-signing surface (§4): HIGH — read all 3 relevant core files; the EVM signature recovery gap is verified absent via cross-file grep.
- Secrets / console-log audit (§5): HIGH — raw grep output is reproducible.
- CONCERNS.md re-validation (§6): HIGH — every item's named files were checked at HEAD.
- Tool availability (§7): HIGH — direct shell checks.
- Validation architecture (§8): HIGH — Plan 1's verification gates are deterministic counts.
- Solana fuzz scaffolding (§9): HIGH — existing test file is mapped row-for-row to D-07 classes.
- Pattern file location (§10): HIGH — directory survey is exhaustive.
- REQUIREMENTS.md drift (§11): HIGH — exact lines named.
- Drift-fix precedent (§12): HIGH — cited Phase 22/23 D-decisions.

**Research date:** 2026-05-17
**Valid until:** 2026-06-16 (30 days for stable codebase; sooner if any of `packages/server/src/{routes,db,auth,middleware}/` or `packages/core/src/` changes meaningfully)

---

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` exists at the repo root. Project constraints from auto-memory:
- Repo is open-source; planning docs are public-facing.
- Always ship via PR (even solo).
- Never delete branches without explicit instruction.
- v1.3 is removal / repositioning; rewards are abandoned, not redesigned.

None of these constraints conflict with the Plan 1 audit work as scoped here.
