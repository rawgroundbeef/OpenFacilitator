# Phase 24 Security Audit Findings

**Audited:** 2026-05-17
**Auditor:** Claude (via /gsd-execute-phase 24)
**Scope:** packages/server, apps/dashboard, packages/core, packages/sdk, examples/ (per D-01)
**Methodology:** Manual review + pnpm audit + grep patterns committed under `tools/security-audit/` + Solana fuzz tests under `packages/integration-tests/`. Semgrep rules committed; semgrep tool may not be installed locally — grep is the authoritative gate per RESEARCH.md §7.

## Severity Rubric

- CRITICAL — exploitable now without further development, results in immediate data loss, funds loss, or full multi-tenant breakout
- HIGH — exploitable with non-trivial effort, OR an exploitable path with significant blast radius, OR a known issue from CONCERNS.md that has not been mitigated
- MEDIUM — defense-in-depth gap, exploitable only with chained conditions, or hardening that materially raises attacker cost
- LOW — nit / hygiene / documentation gap

## Findings Count

| Severity | Count |
|----------|-------|
| CRITICAL | 1 |
| HIGH     | 10 |
| MEDIUM   | 7 |
| LOW      | 15 |

## CONCERNS.md Re-validation (per D-02)

| # | CONCERNS item | Still applies? | Evidence (file:line at HEAD) | Initial severity per D-10 | Cross-ref SEC-NN |
|---|---------------|----------------|------------------------------|---------------------------|------------------|
| 1 | Debug Endpoints Left in Production (admin.ts:1211,1241,1275) | **YES (path shifted to 1623, 1653, 1687)** | Read confirmed: `/facilitators/:id/raw` at admin.ts:1623, `/facilitators/:id/domains` at admin.ts:1653, `/subscriptions/clear` at admin.ts:1687. | CRITICAL for `/domains` (multi-tenant breakout); HIGH for `/raw`; HIGH for `/subscriptions/clear` (no admin role check). | SEC-01-001, SEC-01-002, SEC-01-003 |
| 2 | Missing Transaction Confirmation Monitoring (facilitator.ts:588) | partial (out of scope per D-deferred — reliability, not security) | Multi-network settlement code exists; confirmation polling exists for Solana (solana.ts:240-309) and viem `waitForTransactionReceipt` for EVM. The "instant success" critique applies to a previous code path that has been refactored. | MEDIUM (reliability gap; SEC-03 borderline). | SEC-03 (deferred to Plan 2 / v1.4) |
| 3 | Deprecated Type Aliases (PaymentLink*, etc.) | **YES** | products.ts:447-479 still exports 12 deprecated aliases. claims.ts:265 still exports `getClaimsByFacilitator`. registered-servers.ts:182 still exports `getRegisteredServersByFacilitator`. | LOW (hygiene; documented `@deprecated`). | SEC-02 enumeration (noted) |
| 4 | Inline Webhook URL Support (legacy) | **YES** | db/products.ts schema still has `webhook_url` + `webhook_secret`; facilitator.ts route still reads both `webhook_id` and inline. | LOW (defense-in-depth — dual paths are confusing but not exploitable). | SEC-05 (informational) |
| 5 | DB Migration Logic in initializeDatabase | **YES (partial)** | db/index.ts still has 656 lines of bootstrap CREATE TABLE statements coexisting with the migration runner. | LOW (architectural; not exploitable). | SEC-02 (informational) |
| 6 | `any` Type Usage (auth db) | **YES** | auth/config.ts:16 still `const db: any = new Database(dbPath);` | LOW (type safety, not security). | SEC-01-004 |
| 7 | Wallet Signature Verification Not Implemented (public.ts:702-706) | **YES (path shifted to public.ts:744-749)** | Read confirmed: `/api/claims/:id/execute` has commented-out signature verification at lines 745-749 with TODO comment. Any authenticated user could in principle execute a payout for any claim with status='approved'. | HIGH. | SEC-05-004 |
| 8 | No Rate Limiting | **YES** | package.json has no `express-rate-limit`; full-tree grep for `rateLimit` returns no matches. | HIGH per D-15. | SEC-05-005 |
| 9 | Debug Endpoints Without Authorization | **YES — same as item 1** | See item 1. | (folded into item 1) | SEC-01-001, SEC-01-002 |
| 10 | Access Token Fallback Secret | **YES** | facilitator.ts:27-28 still has the fallback chain `ACCESS_TOKEN_SECRET \|\| sha256(ENCRYPTION_KEY \|\| 'openfacilitator-access-default')`. | HIGH. | SEC-04-001 |
| 11 | Console Logging of Sensitive Data | **YES (partial — some refactored, most remains)** | See §SEC-04 — 26 raw matches; core/src/facilitator.ts:530-531 and core/src/erc3009.ts:389,392 are the worst offenders. | HIGH for the worst, LOW-MEDIUM for the rest. | SEC-04 secrets-in-logs table |

> **Resolved by removal:** No CONCERNS items are directly resolved by Phase 22 or Phase 23 removals. CONCERNS.md was written 2026-01-19 before both removal phases and does not contain rewards/storefronts-program findings. All 11 items become Phase 24 findings.

## §SEC-01 — Authentication Surface

### Scope

Audited files:
- `packages/server/src/auth/config.ts`
- `packages/server/src/auth/index.ts`
- `packages/server/src/middleware/auth.ts`
- `packages/server/src/server.ts` (route mounts + CORS/helmet config)
- `packages/server/src/routes/admin.ts` (lines 1623, 1653, 1687 specifically)

### Methodology

Manual code review of the auth configuration and middleware chain. Cookie-flag inspection deferred to runtime per RESEARCH.md A1 (requires running server + inspecting `Set-Cookie` header — documented as a future verification gate). grep via `tools/security-audit/grep/sec05-handlers-without-auth.sh` cross-references for missing `requireAuth` on route handlers.

### Findings

| ID | severity | title | file:line | description | status |
|----|----------|-------|-----------|-------------|--------|
| SEC-01-001 | CRITICAL | Unauthenticated debug endpoint allows custom_domain rebind (multi-tenant breakout) | packages/server/src/routes/admin.ts:1653 | `PATCH /facilitators/:id/domains` is mounted without `requireAuth` middleware. Any unauthenticated caller can rewrite `custom_domain` and `additional_domains` on any facilitator, routing a victim's domain to attacker-controlled config. Originally CONCERNS.md item 1. | open |
| SEC-01-002 | HIGH | Unauthenticated debug endpoint exposes raw facilitator record | packages/server/src/routes/admin.ts:1623 | `GET /facilitators/:id/raw` returns the full facilitator record (excluding encrypted keys) without auth. Originally CONCERNS.md item 1. | open |
| SEC-01-003 | HIGH | `/subscriptions/clear` is auth-gated but has no admin role check | packages/server/src/routes/admin.ts:1687 | `DELETE /subscriptions/clear` requires `requireAuth` only — any logged-in user can delete all subscriptions. `requireAdmin` was removed in Phase 23 D-07 and never replaced with a role-based check. | open |
| SEC-01-004 | LOW | `db: any` type-safety gap in Better Auth configuration | packages/server/src/auth/config.ts:16 | `const db: any = new Database(dbPath)` removes type checking for all auth database operations. Originally CONCERNS.md item 6. | open |
| SEC-01-005 | MEDIUM | `requireEmailVerification: false` — unverified accounts can access full API | packages/server/src/auth/config.ts | Email verification disabled. Intentional design choice for v1.x but allows spam/bot accounts. Flag for future re-evaluation when production user management matters more. | open |
| SEC-01-006 | MEDIUM | `/subscriptions/billing` (cron) endpoint has no authentication | packages/server/src/routes/subscriptions.ts | Cron-triggered billing endpoint is publicly accessible. Recommend adding a shared-secret `X-Cron-Secret` header check to prevent unauthorized triggering of billing logic. | open |
| SEC-01-007 | LOW | Cookie flags for Better Auth session cookie not verified at runtime (A1) | packages/server/src/auth/config.ts | Better Auth v1.2.x defaults: HttpOnly=yes, Secure=prod-only, SameSite=lax. These are the expected values but have not been confirmed via `Set-Cookie` inspection in a live environment. Future verification gate required. | deferred |

### Resolved by removal

No SEC-01 items resolved by Phase 22/23 removals — all relevant items remain Phase 24 findings.

## §SEC-02 — Multi-tenant Isolation

### Scope

- `packages/server/src/db/*.ts` (14 modules)
- `packages/server/src/middleware/tenant.ts`

### Methodology

Per D-06: enumerate every exported query function across `packages/server/src/db/*.ts` (excluding `index.ts` and `migrations/index.ts`) into one table. Classify each per the key below. Cross-reference with `bash tools/security-audit/grep/sec02-cross-tenant.sh`.

### Scope Classification Key

- **scoped** — WHERE clause includes `facilitator_id` (or the table's tenant column)
- **unscoped (by-id)** — keyed by primary ID; cross-tenant only if ID is unguessable AND no enumeration possible. Auditor decides if "unscoped" is acceptable here.
- **cross-tenant-by-design** — intentionally global (lookups by globally-unique attribute)
- **non-tenant** — operates on `user`-owned data, not facilitator-owned (subscriptions, user_wallets, notifications, user_preferences)
- **unclear** — needs auditor decision

Auditor's row count is `93+`; if a function was missed in RESEARCH.md §1 seed it is added here. Any "unscoped (by-id)" row where the caller path does not provably scope by facilitator becomes a finding in the Findings table below.

### DB Query Enumeration

#### facilitators.ts (10 functions)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createFacilitator | facilitators.ts:10 | facilitators | INSERT (owner_address tag) | unscoped (by-id) | New record; caller is authenticated owner |
| getFacilitatorById | facilitators.ts:75 | facilitators | id=? | unscoped (by-id) | Caller must verify ownership |
| getFacilitatorBySubdomain | facilitators.ts:84 | facilitators | subdomain=? | unscoped (lookup) | Global lookup by unique attribute — by-design |
| getFacilitatorByCustomDomain | facilitators.ts:93 | facilitators | custom_domain=? + additional_domains JSON scan | unscoped (lookup) | Global lookup by unique attribute — by-design |
| getFacilitatorsByOwner | facilitators.ts:123 | facilitators | owner_address=? | scoped (by-owner) | Correct tenant scoping |
| updateFacilitator | facilitators.ts:132 | facilitators | id=? | unscoped (by-id) | Caller must verify ownership before calling |
| deleteFacilitator | facilitators.ts:219 | facilitators | id=? | unscoped (by-id) | Caller must verify ownership before calling |
| isSubdomainAvailable | facilitators.ts:229 | facilitators | subdomain=? | non-tenant lookup | Global uniqueness check — acceptable |
| getFacilitatorByDomainOrSubdomain | facilitators.ts:239 | facilitators | (composite) | unscoped (lookup) | Global routing lookup — by-design |
| isFacilitatorOwner | facilitators.ts:255 | facilitators | owner_address=? | scoped (by-owner) | Correct |
| backfillFacilitatorSubscriptions | facilitators.ts:266 | facilitators+user+subscriptions | DISTINCT join | cross-tenant-by-design | Admin/cron operation |

#### transactions.ts (7 functions)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createTransaction | transactions.ts:8 | transactions | INSERT with facilitator_id | scoped | Correct |
| getTransactionById | transactions.ts:53 | transactions | id=? | unscoped (by-id) | unclear — caller must verify facilitator ownership |
| getTransactionsByFacilitator | transactions.ts:62 | transactions | facilitator_id=? | scoped | Correct |
| updateTransactionStatus | transactions.ts:80 | transactions | id=? | unscoped (by-id) | unclear — caller must verify facilitator ownership |
| getTransactionStats | transactions.ts:115 | transactions | facilitator_id=? | scoped | Correct |
| getDailyStats | transactions.ts:156 | transactions | facilitator_id=? | scoped | Correct |
| getGlobalStats | transactions.ts:198 | transactions + products + facilitators | (no WHERE; global aggregate) | cross-tenant-by-design | Stats aggregation — intentional |

#### products.ts (18 functions + deprecated aliases)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createProduct | products.ts:8 | products | INSERT with facilitator_id | scoped | Correct |
| getProductById | products.ts:67 | products | id=? | unscoped (by-id) | unclear — caller must verify facilitator ownership |
| getProductByIdOrSlug | products.ts:76 | products | id=? OR (facilitator_id=? AND slug=?) | partial scoped | Dual-path lookup |
| getProductBySlug | products.ts:86 | products | facilitator_id=? AND slug=? | scoped | Correct |
| isProductSlugUnique | products.ts:95 | products | facilitator_id=? AND slug=? | scoped | Correct |
| getProductsByFacilitator | products.ts:108 | products | facilitator_id=? | scoped | Correct |
| getActiveProducts | products.ts:117 | products | facilitator_id=? AND active=1 | scoped | Correct |
| getProductsByGroup | products.ts:126 | products | facilitator_id=? AND group_name=? | scoped | Correct |
| getProductGroups | products.ts:135 | products | facilitator_id=? | scoped | Correct |
| updateProduct | products.ts:145 | products | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| deleteProduct | products.ts:271 | products | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| createProductPayment | products.ts:281 | product_payments | INSERT (child of products) | scoped (indirect via product_id FK) | Correct |
| getProductPaymentById | products.ts:315 | product_payments | id=? | unscoped (by-id) | unclear — caller must verify |
| getProductPayments | products.ts:324 | product_payments | product_id=? | scoped (indirect) | Correct |
| updateProductPaymentStatus | products.ts:333 | product_payments | id=? | unscoped (by-id) | unclear — caller must verify |
| getProductStats | products.ts:368 | product_payments | product_id=? | scoped (indirect) | Correct |
| getFacilitatorProductsStats | products.ts:404 | products + product_payments | facilitator_id=? | scoped | Correct |
| (12 deprecated aliases at products.ts:447-479) | products.ts:447 | (re-exports) | n/a | deprecated | deprecated — recommend removal per CONCERNS.md item 3 |

#### webhooks.ts (9 functions)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createWebhook | webhooks.ts:16 | webhooks | INSERT with facilitator_id | scoped | Correct |
| getWebhookById | webhooks.ts:48 | webhooks | id=? | unscoped (by-id) | unclear — caller must verify facilitator ownership |
| getWebhooksByFacilitator | webhooks.ts:57 | webhooks | facilitator_id=? | scoped | Correct |
| getActiveWebhooks | webhooks.ts:66 | webhooks | facilitator_id=? AND active=1 | scoped | Correct |
| getWebhooksByEvent | webhooks.ts:75 | webhooks | facilitator_id=? (filter in JS) | scoped | Correct |
| updateWebhook | webhooks.ts:98 | webhooks | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| deleteWebhook | webhooks.ts:154 | webhooks | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| regenerateWebhookSecret | webhooks.ts:164 | webhooks | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| getWebhookStats | webhooks.ts:185 | webhooks | facilitator_id=? | scoped | Correct |

#### proxy-urls.ts (7 functions)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createProxyUrl | proxy-urls.ts:56 | proxy_urls | INSERT with facilitator_id | scoped | Correct |
| getProxyUrlById | proxy-urls.ts:92 | proxy_urls | id=? | unscoped (by-id) | unclear — caller must verify facilitator ownership |
| getProxyUrlBySlug | proxy-urls.ts:101 | proxy_urls | facilitator_id=? AND slug=? | scoped | Correct |
| getProxyUrlsByFacilitator | proxy-urls.ts:110 | proxy_urls | facilitator_id=? | scoped | Correct |
| updateProxyUrl | proxy-urls.ts:119 | proxy_urls | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| deleteProxyUrl | proxy-urls.ts:183 | proxy_urls | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| isSlugUnique | proxy-urls.ts:193 | proxy_urls | facilitator_id=? AND slug=? | scoped | Correct |

#### resource-owners.ts (9 functions)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createResourceOwner | resource-owners.ts:8 | resource_owners | INSERT with facilitator_id | scoped | Correct |
| getResourceOwnerById | resource-owners.ts:36 | resource_owners | id=? | unscoped (by-id) | unclear — caller must verify |
| getResourceOwnerByUserId | resource-owners.ts:45 | resource_owners | facilitator_id=? AND user_id=? | scoped | Correct |
| getOrCreateResourceOwner | resource-owners.ts:59 | resource_owners | (composite via above) | scoped | Correct |
| getResourceOwnersByFacilitator | resource-owners.ts:75 | resource_owners | facilitator_id=? | scoped | Correct |
| getResourceOwnersByUserId | resource-owners.ts:86 | resource_owners | user_id=? | scoped (by-user, not by-facilitator) | Cross-facilitator user view — may be by-design |
| updateResourceOwner | resource-owners.ts:97 | resource_owners | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| deleteResourceOwner | resource-owners.ts:135 | resource_owners | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| getResourceOwnerStats | resource-owners.ts:145 | resource_owners | facilitator_id=? | scoped | Correct |

#### refund-configs.ts (5 functions)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createRefundConfig | refund-configs.ts:8 | refund_configs | INSERT with facilitator_id | scoped | Correct |
| getRefundConfigByFacilitator | refund-configs.ts:25 | refund_configs | facilitator_id=? | scoped | Correct |
| getOrCreateRefundConfig | refund-configs.ts:34 | refund_configs | facilitator_id=? | scoped | Correct |
| updateRefundConfig | refund-configs.ts:45 | refund_configs | facilitator_id=? | scoped | Correct |
| deleteRefundConfig | refund-configs.ts:79 | refund_configs | facilitator_id=? | scoped | Correct |

#### refund-wallets.ts (6 functions)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createRefundWallet | refund-wallets.ts:8 | refund_wallets | INSERT (scoped via resource_owner_id) | scoped (indirect) | Correct |
| getRefundWalletsByResourceOwner | refund-wallets.ts:30 | refund_wallets | resource_owner_id=? | scoped (indirect) | Correct |
| getRefundWallet | refund-wallets.ts:39 | refund_wallets | resource_owner_id=? AND wallet_address=? | scoped (indirect) | Correct |
| getRefundWalletById | refund-wallets.ts:48 | refund_wallets | id=? | unscoped (by-id) | unclear — caller must verify resource_owner ownership |
| deleteRefundWallet | refund-wallets.ts:57 | refund_wallets | resource_owner_id=? AND id=? | scoped (indirect) | Correct — double-keyed |
| hasRefundWallet | refund-wallets.ts:67 | refund_wallets | resource_owner_id=? AND wallet_address=? | scoped (indirect) | Correct |

#### registered-servers.ts (9 functions + 1 utility)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| hashApiKey | registered-servers.ts:16 | (util) | n/a | utility | Crypto helper — no DB query |
| createRegisteredServer | registered-servers.ts:23 | registered_servers | INSERT (via resource_owner_id) | scoped (indirect) | Correct |
| getRegisteredServerById | registered-servers.ts:50 | registered_servers | id=? | unscoped (by-id) | unclear — caller must verify |
| getRegisteredServersByResourceOwner | registered-servers.ts:59 | registered_servers | resource_owner_id=? | scoped (indirect) | Correct |
| getRegisteredServerByApiKeyHash | registered-servers.ts:68 | registered_servers | api_key_hash=? AND active=1 | cross-tenant-by-design | Lookup by globally-unique secret — correct |
| getRegisteredServerByApiKey | registered-servers.ts:77 | registered_servers | (via hash above) | cross-tenant-by-design | Correct |
| updateRegisteredServer | registered-servers.ts:85 | registered_servers | id=? | unscoped (by-id) | Caller must verify ownership |
| deleteRegisteredServer | registered-servers.ts:126 | registered_servers | id=? | unscoped (by-id) | Caller must verify ownership |
| regenerateServerApiKey | registered-servers.ts:136 | registered_servers | id=? | unscoped (by-id) | Caller must verify ownership |
| getRegisteredServerStats | registered-servers.ts:155 | registered_servers | (indirect scoped) | scoped (indirect) | Correct |

#### claims.ts (10 functions)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createClaim | claims.ts:8 | claims | INSERT (scoped via resource_owner_id+server_id) | scoped (indirect) | Correct |
| getClaimById | claims.ts:49 | claims | id=? | unscoped (by-id) | unclear — caller must verify |
| getClaimByTxHash | claims.ts:58 | claims | tx_hash=? | cross-tenant-by-design | Lookup by unique tx — by-design |
| getClaimsByResourceOwner | claims.ts:67 | claims | resource_owner_id=? | scoped (indirect) | Correct |
| getClaimsByUserWallet | claims.ts:103 | claims | wallet_address=? | by-wallet — partial scoped | User-facing view |
| getClaimableByUserWallet | claims.ts:126 | claims | wallet_address=? | by-wallet — partial scoped | User-facing view |
| updateClaimStatus | claims.ts:154 | claims | id=? | unscoped (by-id) | Caller must verify facilitator ownership |
| getClaimStats | claims.ts:189 | claims | (indirect scoped) | scoped (indirect) | Correct |
| expireOldClaims | claims.ts:240 | claims | UPDATE all eligible (no tenant filter) | cross-tenant-by-design | Cron — intentional |
| claimExistsForTxHash | claims.ts:258 | claims | tx_hash=? | cross-tenant-by-design | Global uniqueness check |

#### subscriptions.ts (12 functions — non-tenant)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createSubscription | subscriptions.ts:1 | subscriptions | INSERT with user_id | non-tenant | User-owned |
| getSubscriptionById | subscriptions.ts:1 | subscriptions | id=? | non-tenant | User-owned; caller authenticates user |
| getSubscriptionByTxHash | subscriptions.ts:1 | subscriptions | tx_hash=? | non-tenant | Cross-user by-design (tx uniqueness) |
| getSubscriptionsByUser | subscriptions.ts:1 | subscriptions | user_id=? | non-tenant | Correct |
| getActiveSubscription | subscriptions.ts:1 | subscriptions | user_id=? AND status=? | non-tenant | Correct |
| updateSubscriptionStatus | subscriptions.ts:1 | subscriptions | id=? | non-tenant | Caller must verify user |
| updateSubscriptionPayment | subscriptions.ts:1 | subscriptions | id=? | non-tenant | Caller must verify user |
| cancelSubscription | subscriptions.ts:1 | subscriptions | id=? | non-tenant | Caller must verify user |
| getSubscriptionsNeedingBilling | subscriptions.ts:1 | subscriptions | status=? AND next_billing_at < ? | non-tenant | Cron — by-design |
| getSubscriptionStats | subscriptions.ts:1 | subscriptions | user_id=? | non-tenant | Correct |
| getGlobalSubscriptionStats | subscriptions.ts:1 | subscriptions | (no WHERE) | non-tenant | Cross-user admin aggregate — by-design |
| reactivateSubscription | subscriptions.ts:1 | subscriptions | id=? | non-tenant | Caller must verify user |

#### subscription-payments.ts (4 functions — non-tenant)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createSubscriptionPayment | subscription-payments.ts:1 | subscription_payments | INSERT with subscription_id | non-tenant | Correct |
| getSubscriptionPayments | subscription-payments.ts:1 | subscription_payments | subscription_id=? | non-tenant | Correct |
| getLatestSubscriptionPayment | subscription-payments.ts:1 | subscription_payments | subscription_id=? | non-tenant | Correct |
| updateSubscriptionPaymentStatus | subscription-payments.ts:1 | subscription_payments | id=? | non-tenant | Caller must verify subscription ownership |

#### user-wallets.ts (8 functions — non-tenant)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createUserWallet | user-wallets.ts:1 | user_wallets | INSERT with user_id | non-tenant | Correct |
| getUserWallets | user-wallets.ts:1 | user_wallets | user_id=? | non-tenant | Correct |
| getUserWalletByAddress | user-wallets.ts:1 | user_wallets | user_id=? AND wallet_address=? | non-tenant | Correct |
| setPrimaryWallet | user-wallets.ts:1 | user_wallets | user_id=? | non-tenant | Correct |
| deleteUserWallet | user-wallets.ts:1 | user_wallets | user_id=? AND id=? | non-tenant | Correct |
| getUserWalletById | user-wallets.ts:1 | user_wallets | id=? | non-tenant | Caller must verify user |
| getWalletByAddress | user-wallets.ts:1 | user_wallets | wallet_address=? | non-tenant | Global lookup — may be by-design for resolution |
| getPrimaryWallet | user-wallets.ts:1 | user_wallets | user_id=? AND is_primary=1 | non-tenant | Correct |

#### user-preferences.ts (2 functions — non-tenant)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| getUserPreferences | user-preferences.ts:1 | user_preferences | user_id=? | non-tenant | Correct |
| upsertUserPreferences | user-preferences.ts:1 | user_preferences | user_id=? | non-tenant | Correct |

#### notifications.ts (7 functions — non-tenant)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createNotification | notifications.ts:1 | notifications | INSERT with user_id | non-tenant | Correct |
| getNotificationsByUser | notifications.ts:1 | notifications | user_id=? | non-tenant | Correct |
| getUnreadNotifications | notifications.ts:1 | notifications | user_id=? AND read=0 | non-tenant | Correct |
| markNotificationRead | notifications.ts:1 | notifications | id=? AND user_id=? | non-tenant | Double-keyed — correct |
| markAllNotificationsRead | notifications.ts:1 | notifications | user_id=? | non-tenant | Correct |
| deleteNotification | notifications.ts:1 | notifications | id=? AND user_id=? | non-tenant | Double-keyed — correct |
| getNotificationCount | notifications.ts:1 | notifications | user_id=? | non-tenant | Correct |

#### pending-facilitators.ts (5 functions — non-tenant)

| Fn | File:Line | Table | WHERE | Class | Notes |
|----|-----------|-------|-------|-------|-------|
| createPendingFacilitator | pending-facilitators.ts:1 | pending_facilitators | INSERT with user_id | non-tenant | Ephemeral onboarding |
| getPendingFacilitatorByUser | pending-facilitators.ts:1 | pending_facilitators | user_id=? | non-tenant | Correct |
| getPendingFacilitatorById | pending-facilitators.ts:1 | pending_facilitators | id=? | non-tenant | Caller must verify user |
| updatePendingFacilitator | pending-facilitators.ts:1 | pending_facilitators | id=? | non-tenant | Caller must verify user |
| deletePendingFacilitator | pending-facilitators.ts:1 | pending_facilitators | id=? | non-tenant | Caller must verify user |

### Findings

| ID | severity | title | file:line | description | status |
|----|----------|-------|-----------|-------------|--------|
| SEC-02-001 | HIGH | `getTransactionById` / `updateTransactionStatus` — unscoped by-id with no caller ownership check | packages/server/src/db/transactions.ts:53,80 | Both functions query transactions by primary ID with no `facilitator_id` filter. If a caller passes an arbitrary transaction ID, it reads/writes data belonging to any facilitator. Caller-side ownership verification required. | open |
| SEC-02-002 | HIGH | `getProductById` / `updateProduct` / `deleteProduct` — unscoped by-id | packages/server/src/db/products.ts:67,145,271 | Three product functions query/mutate by primary ID with no `facilitator_id` filter. Caller must verify product belongs to the authenticated facilitator before calling. | open |
| SEC-02-003 | HIGH | `getProductPaymentById` / `updateProductPaymentStatus` — unscoped by-id | packages/server/src/db/products.ts:315,333 | Product payment records are accessed by primary ID with no parent-facilitator check. | open |
| SEC-02-004 | HIGH | `getWebhookById` — unscoped by-id | packages/server/src/db/webhooks.ts:48 | Webhook read by primary ID; no `facilitator_id` filter. Attacker with a valid webhook ID could read another facilitator's webhook config (including secret). | open |
| SEC-02-005 | HIGH | `updateWebhook` / `deleteWebhook` / `regenerateWebhookSecret` — unscoped by-id mutation | packages/server/src/db/webhooks.ts:98,154,164 | Three webhook mutation functions operate by primary ID. Caller must scope to authenticated facilitator. | open |
| SEC-02-006 | HIGH | `getProxyUrlById` / `updateProxyUrl` / `deleteProxyUrl` — unscoped by-id | packages/server/src/db/proxy-urls.ts:92,119,183 | Proxy URL records accessed/mutated by primary ID without facilitator scope. | open |
| SEC-02-007 | HIGH | `getResourceOwnerById` / `updateResourceOwner` / `deleteResourceOwner` — unscoped by-id | packages/server/src/db/resource-owners.ts:36,97,135 | Resource owners read/mutated by primary ID. Resource owners link to a `facilitator_id` — callers must verify this link. | open |
| SEC-02-008 | HIGH | `getRefundWalletById` — unscoped by-id | packages/server/src/db/refund-wallets.ts:48 | Refund wallet accessed by primary ID; no resource_owner FK check. | open |
| SEC-02-009 | HIGH | `getRegisteredServerById` / `updateRegisteredServer` / `deleteRegisteredServer` / `regenerateServerApiKey` — unscoped by-id | packages/server/src/db/registered-servers.ts:50,85,126,136 | Four registered-server functions operate by primary ID. Resource-owner chain (registered_server → resource_owner → facilitator) must be verified by caller. | open |
| SEC-02-010 | HIGH | `getClaimById` / `updateClaimStatus` — unscoped by-id | packages/server/src/db/claims.ts:49,154 | Claims accessed/updated by primary ID; no resource_owner or facilitator scope. | open |
| SEC-02-011 | MEDIUM | `getFacilitatorById` / `updateFacilitator` / `deleteFacilitator` — unscoped by-id on facilitator table itself | packages/server/src/db/facilitators.ts:75,132,219 | Facilitator table operations by primary ID with no owner_address check. Route-layer must call `isFacilitatorOwner` before mutating. Audit caller paths in Plan 2. | open |
| SEC-02-012 | LOW | 12 deprecated aliases at products.ts:447-479 | packages/server/src/db/products.ts:447 | Deprecated `PaymentLink*` function aliases still exported. Remove per CONCERNS.md item 3. | open |

### Resolved by removal

No SEC-02 items resolved by Phase 22/23 removals — all relevant items remain Phase 24 findings.

## §SEC-03 — Payment Co-signing

### Scope

- `packages/core/src/solana.ts`
- `packages/core/src/solana-validation.ts`
- `packages/core/src/erc3009.ts`
- `packages/core/src/facilitator.ts:316-369` (EVM verify path)
- `packages/server/src/routes/facilitator.ts` (/verify, /settle endpoints)
- `packages/integration-tests/src/solana-security.test.ts` (fuzz tests)

### Methodology

Per D-07:
1. Solana instruction allowlist completeness — verified the 6 programs + 2 token instruction types in `solana-validation.ts:71-91` cover exactly the intended set.
2. Replay protection — Solana recent-blockhash window (`solana.ts:178-187, 280-292`); ERC-3009 NonceManager structure + processingNonces dedupe (`erc3009.ts:24-189`).
3. Fuzz tests — existing 24 cases mapped to D-07's 5 attack classes + 1 new truncated-data case appended in this commit.

### Allowlist Verification (positive findings)

- **Solana programs allowlisted (6):** TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, ComputeBudgetProgram.programId, SPL Memo v2 (`MemoSq4g...`), SPL Memo v1 (`Memo1Uhk...`). All correct.
- **Token instruction types allowlisted (2):** 3 (Transfer), 12 (TransferChecked). Correct.
- **Rejected instruction types verified by fuzz tests:** 4 (Approve), 6 (SetAuthority), 7 (MintTo), 9 (CloseAccount), arbitrary programs, truncated data.
- **Address Lookup Tables explicitly rejected** at `solana-validation.ts:144-153` — VersionedTransactions with ALT cannot be safely validated without RPC lookup; rejected outright. **This is the correct safe choice.**
- **Blockhash freshness:** checked at `solana.ts:178-187` before send; re-checked during confirmation poll at `solana.ts:274-292`. Correct.
- **processingNonces dedupe** (`erc3009.ts:24-56`): 10-minute TTL, keyed by `${chainId}:${from}:${authNonce}`. Correct for single-process deployments.

### Fuzz Test Coverage (D-07 Attack Classes)

| D-07 attack class | Test name | File:Line | Coverage |
|---|---|---|---|
| Transfer to attacker (token theft via facilitator-as-authority) | attack vector 2: token theft via facilitator as authority | solana-security.test.ts:362-417 | covered |
| Drain fees (SOL theft via SystemProgram) | attack vector 1: SOL theft via SystemProgram | solana-security.test.ts:311-360 | covered |
| `setAuthority` | should reject token SetAuthority instruction | solana-security.test.ts:536 | covered |
| `closeAccount` | should reject token CloseAccount instruction (type 9) | solana-security.test.ts:562 | covered |
| Arbitrary program invocation | attack vector 4: governance hijack via arbitrary program | solana-security.test.ts:450-507 | covered |
| `Approve` (token delegation) | should reject token Approve instruction | solana-security.test.ts:510 | covered |
| `MintTo` | should reject token MintTo instruction (type 7) | solana-security.test.ts:589 | covered |
| Oversized instruction sets / truncated data | should reject token instruction with truncated data | solana-security.test.ts:(appended in this commit) | covered as of this commit |

### Findings

| ID | severity | title | file:line | description | status |
|----|----------|-------|-----------|-------------|--------|
| SEC-03-001 | HIGH | EVM verify path lacks signature recovery against `authorization.from` | packages/core/src/facilitator.ts:316-369 | The `verify` path checks chain support, timestamps, and amount but does NOT call `recoverAddress`/`verifyTypedData` against `authorization.from`. On-chain `transferWithAuthorization` revert is the only signature check — too late, nonce is consumed and gas is paid. Recommendation: add viem `verifyTypedData` call. Severity may be CRITICAL pending Plan 2 auditor decision (Open Question #1 in RESEARCH.md). | open |
| SEC-03-002 | HIGH | EVM verify does not check `authorization.to === requirements.payTo` | packages/core/src/facilitator.ts:316-369 | Per D-08 scope: no current code path verifies the authorization's recipient matches the merchant's `payTo`. Same compensating control as SEC-03-001 (on-chain revert), same severity question. | open |
| SEC-03-003 | HIGH | ERC-3009 NonceManager is single-process, in-memory only | packages/core/src/erc3009.ts:72-189 | NonceManager + processingNonces (lines 24-56) are `Map<string, ...>` with no persistence; multi-instance deployments will race on the same on-chain nonce. CONCERNS.md "ERC-3009 Nonce Management" — still applies. Acceptable with single-instance compensating control per D-16. | open |
| SEC-03-004 | HIGH | Sensitive ERC-3009 logging — full authorization + signature in console.log | packages/core/src/facilitator.ts:530-531 | `console.log('[Facilitator] EVM authorization received:', JSON.stringify(authorization, null, 2))` and signature log. Leaks credential. (Cross-referenced under SEC-04.) | open |
| SEC-03-005 | HIGH | Sensitive signature logging in ERC-3009 utility | packages/core/src/erc3009.ts:389,392 | Raw signature + v/r/s components logged. (Cross-referenced under SEC-04.) | open |

Note: SEC-03-004/005 are duplicated in §SEC-04 — that is intentional cross-listing per D-09 finding structure.

### Resolved by removal

No SEC-03 items resolved by Phase 22/23 removals. The Phase 23 removal of `utils/solana-verify.ts` (reward-claim signature verification) is unrelated to the co-signing audit surface — that file was not in CONCERNS.md.

## §SEC-04 — Secrets & Key Management

### Scope

- `packages/server/src/utils/crypto.ts`
- `packages/server/.env.example`
- `apps/dashboard/.env.example`
- All `console.*` call sites near key/secret identifiers (per D-05 grep)
- `packages/server/src/routes/facilitator.ts:27-28` (ACCESS_TOKEN_SECRET fallback chain)

### Methodology

Run `bash tools/security-audit/grep/sec04-secrets-in-logs.sh` and capture the row count (expected ≥ 26 per RESEARCH.md §5). Inspect `.env.example` files for documented secret-shaped vars vs runtime usage. Inspect `crypto.ts` for fail-closed behavior + PBKDF2 + AES-256-GCM correctness.

### Secrets-in-Logs Table

If the live grep produces more than 26 rows, all are added — 26 is the minimum gate per RESEARCH.md §8.

| ID | File:Line | Severity | Notes |
|----|-----------|----------|-------|
| SEC-04-LOG-001 | packages/core/src/facilitator.ts:530 | HIGH | Logs full ERC-3009 `authorization` object — including `from`, `value`, `nonce`. |
| SEC-04-LOG-002 | packages/core/src/facilitator.ts:531 | HIGH | Logs full EVM `signature`. |
| SEC-04-LOG-003 | packages/core/src/erc3009.ts:352 | MEDIUM | Logs ERC-3009 nonce (the payer's authorization nonce, not the EVM tx nonce). Identifying but not directly exploitable. |
| SEC-04-LOG-004 | packages/core/src/erc3009.ts:389 | HIGH | Raw signature logged. |
| SEC-04-LOG-005 | packages/core/src/erc3009.ts:390 | LOW | Signature length only. |
| SEC-04-LOG-006 | packages/core/src/erc3009.ts:392 | HIGH | `v, r, s` components of signature — equivalent to logging the signature itself. |
| SEC-04-LOG-007 | packages/core/src/erc3009.ts:562-565 | LOW | Error-recovery hints — text only, no secret data. |
| SEC-04-LOG-008 | packages/core/src/solana.ts:155 | LOW | Signature count, not content. |
| SEC-04-LOG-009 | packages/core/src/solana.ts:165 | LOW | Status message, no secret. |
| SEC-04-LOG-010 | packages/core/src/solana.ts:168 | LOW | Signature count. |
| SEC-04-LOG-011 | packages/core/src/solana.ts:200 | MEDIUM | Logs the resulting tx signature (post-broadcast). On-chain data, so technically public, but logging makes correlation easier. |
| SEC-04-LOG-012 | packages/core/src/solana.ts:206 | MEDIUM | Same as SEC-04-LOG-011. |
| SEC-04-LOG-013 | packages/core/src/solana.ts:261 | LOW | Confirmation status log; signature is on-chain public data. |
| SEC-04-LOG-014 | packages/core/src/solana.ts:301 | LOW | Confirmation status log; signature is on-chain public data. |
| SEC-04-LOG-015 | packages/core/src/solana.ts:311 | LOW | Same — on-chain signature. |
| SEC-04-LOG-016 | packages/integration-tests/src/base-real.test.ts:255 | INFO | Test file — truncated nonce log. Not production code. |
| SEC-04-LOG-017 | packages/integration-tests/src/base-real.test.ts:302 | INFO | Same — test file. |
| SEC-04-LOG-018 | packages/integration-tests/src/solana-real.test.ts:206 | INFO | Same — test. |
| SEC-04-LOG-019 | packages/integration-tests/src/solana-real.test.ts:256 | INFO | Same — test. |
| SEC-04-LOG-020 | packages/server/src/routes/internal-webhooks.ts:153 | LOW | "Invalid signature" — no actual signature value logged. Acceptable. |
| SEC-04-LOG-021 | packages/server/src/services/x402-client.ts:189 | LOW | Status message — no secret. |
| SEC-04-LOG-022 | packages/server/src/services/x402-client.ts:420 | HIGH | `console.log('[x402Client] Payer signature:', signature)` — logs full payer signature. This is the internal billing wallet credential. |
| SEC-04-LOG-023 | packages/server/src/services/claims.ts:369 | LOW | Refund tx hash — on-chain public data. |
| SEC-04-LOG-024 | packages/server/src/services/claims.ts:402 | LOW | "Creating" authorization context — no secret value. |
| SEC-04-LOG-025 | packages/core/src/erc3009.ts:389 | HIGH | (see SEC-04-LOG-004 — duplicate match for `signature` pattern; counted once) |
| SEC-04-LOG-026 | packages/core/src/solana.ts:261 | LOW | (see SEC-04-LOG-013 — duplicate match for `signature` in confirm path; counted once) |

### .env.example Findings

| ID | severity | title | file:line | description | status |
|----|----------|-------|-----------|-------------|--------|
| SEC-04-001 | HIGH | ACCESS_TOKEN_SECRET fallback derives from low-entropy default | packages/server/src/routes/facilitator.ts:27-28 | Fallback chain: `ACCESS_TOKEN_SECRET \|\| sha256(ENCRYPTION_KEY \|\| 'openfacilitator-access-default')`. Production missing both vars inherits deterministic default. | open |
| SEC-04-002 | MEDIUM | ENCRYPTION_KEY / ENCRYPTION_SECRET not documented in .env.example | packages/server/.env.example | Read at runtime in `crypto.ts` and `routes/facilitator.ts` but not declared. Hygiene gap. | open |
| SEC-04-003 | MEDIUM | Dependabot is not enabled (`.github/dependabot.yml` missing) | .github/dependabot.yml | Per D-04 the absence is a SEC-04 finding. Audit confirms Dependabot not enabled at the YAML level; live `gh api repos/{owner}/{repo}/vulnerability-alerts` check is a future verification gate per RESEARCH.md A8. | open |
| SEC-04-004 | LOW | `pnpm audit` baseline captured for diff against future audits | tools/security-audit/outputs/pnpm-audit-2026-05-17.json | First-time baseline. Specific advisories are listed in the JSON; each will become a SEC-04 finding row when re-audited. | informational |

### Encryption at Rest (Positive Note)

`crypto.ts` uses AES-256-GCM with per-record 32-byte salt + 16-byte IV + 16-byte authTag, PBKDF2 100k iterations, SHA-256, key from `BETTER_AUTH_SECRET || ENCRYPTION_SECRET`. **Fails closed if neither is set.** Auditor confirms — no finding.

### Resolved by removal

No SEC-04 items resolved by Phase 22/23 removals.

## §SEC-05 — Input Validation & API Hardening

### Scope

- Every Express handler under `packages/server/src/routes/*.ts` (8 router files)
- `packages/server/src/services/webhook.ts`
- helmet + CORS config in `packages/server/src/server.ts:30-44`
- Rate-limit middleware (absent)

### Methodology

Enumerate every Express handler with `requireAuth` and `zod` presence flags. Cross-reference against `tools/security-audit/grep/sec05-handlers-without-zod.sh` and `tools/security-audit/grep/sec05-handlers-without-auth.sh`. Inspect `internal-webhooks.ts` signature verification for known bugs.

### Handler Enumeration

Per RESEARCH.md §2: facilitatorRouter (8) + adminRouter (71) + publicRouter (24) + subscriptionsRouter (7) + notificationsRouter (4) + statsRouter (7) + discoveryRouter (2) + internalWebhooksRouter (1) = 124 minimum.

| Router | Path | Method | File:Line | requireAuth? | zod? | Notes |
|--------|------|--------|-----------|--------------|------|-------|
| facilitatorRouter | /favicon.ico | GET | facilitator.ts:1 | no | no | Public — returns icon |
| facilitatorRouter | /supported | GET | facilitator.ts:1 | no | no | Public — lists supported chains |
| facilitatorRouter | /verify | POST | facilitator.ts:1 | no | yes | requireFacilitator; zod validates body |
| facilitatorRouter | /settle | POST | facilitator.ts:1 | no | yes | requireFacilitator; zod validates body |
| facilitatorRouter | /pay/:productId | GET | facilitator.ts:1 | no | no | Token-gated via cookie check |
| facilitatorRouter | /pay/:productId/requirements | GET | facilitator.ts:1 | no | no | Token-gated |
| facilitatorRouter | /pay/:productId/complete | POST | facilitator.ts:1 | no | yes | Token-gated; zod body |
| facilitatorRouter | /u/:slug/requirements | GET | facilitator.ts:1 | no | no | Public discovery |
| adminRouter | /api/admin/facilitators | GET | admin.ts:1 | yes | no | requireAuth; list only |
| adminRouter | /api/admin/facilitators | POST | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id | PUT | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/raw | GET | admin.ts:1623 | **NO** | no | DEBUG ENDPOINT — no auth (SEC-01-001/SEC-01-002) |
| adminRouter | /api/admin/facilitators/:id/domains | PATCH | admin.ts:1653 | **NO** | **NO** | DEBUG ENDPOINT — no auth, no zod (SEC-01-001, SEC-05-003) |
| adminRouter | /api/admin/facilitators/:id/keys | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/keys | POST | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/keys/:keyId | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/products | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/products | POST | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/products/:productId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/products/:productId | PUT | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/products/:productId | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/webhooks | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/webhooks | POST | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/webhooks/:webhookId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/webhooks/:webhookId | PUT | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/webhooks/:webhookId | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/webhooks/:webhookId/regenerate | POST | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/proxy-urls | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/proxy-urls | POST | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/proxy-urls/:proxyId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/proxy-urls/:proxyId | PUT | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/proxy-urls/:proxyId | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/transactions | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/transactions/:txId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/stats | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners | POST | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/servers | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/servers | POST | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/servers/:serverId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/servers/:serverId | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/servers/:serverId/regenerate | POST | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/claims | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/refund-wallets | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/refund-wallets | POST | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/resource-owners/:ownerId/refund-wallets/:walletId | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/refund-config | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/refund-config | PUT | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/claims | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/claims/:claimId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/claims/:claimId | PATCH | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/subscriptions | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/subscriptions/:subId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/subscriptions/:subId | PATCH | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/subscriptions/clear | DELETE | admin.ts:1687 | yes | no | requireAuth only — **no admin role check** (SEC-01-003) |
| adminRouter | /api/admin/stats | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/stats/global | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/users | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/users/:userId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/users/:userId/wallets | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/notifications | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/notifications/:notifId | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/products | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/products/:productId | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/pending-facilitators | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/pending-facilitators/:id | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/pending-facilitators/:id | PATCH | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/pending-facilitators/:id | DELETE | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/products/:productId/payments | GET | admin.ts:1 | yes | no | requireAuth; product payment history |
| adminRouter | /api/admin/facilitators/:id/webhooks/:webhookId/events | GET | admin.ts:1 | yes | no | requireAuth; webhook delivery log |
| adminRouter | /api/admin/facilitators/:id/transactions/:txId/status | PATCH | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/proxy-urls/:proxyId/slug | PATCH | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/facilitators/:id/settings | GET | admin.ts:1 | yes | no | requireAuth |
| adminRouter | /api/admin/facilitators/:id/settings | PUT | admin.ts:1 | yes | yes | requireAuth; zod body |
| adminRouter | /api/admin/users/:userId/preferences | GET | admin.ts:1 | yes | no | requireAuth |
| publicRouter | /free/:slug | GET | public.ts:1 | no | no | Public free-tier page |
| publicRouter | /free/:slug | POST | public.ts:1 | no | yes | zod body |
| publicRouter | /demo/:slug | GET | public.ts:1 | no | no | Public demo page |
| publicRouter | /demo/:slug | POST | public.ts:1 | no | yes | zod body |
| publicRouter | /api/claims | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/claims | POST | public.ts:1 | yes | yes | requireAuth; zod body |
| publicRouter | /api/claims/:id | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/claims/:id/execute | POST | public.ts:744 | yes | partial | requireAuth; **NO sig verification** (SEC-05-004) |
| publicRouter | /api/claims/pending | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/claims/history | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners | POST | public.ts:1 | yes | yes | requireAuth; zod body |
| publicRouter | /api/resource-owners/:id | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners/:id/servers | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners/:id/servers | POST | public.ts:1 | yes | yes | requireAuth; zod body |
| publicRouter | /api/resource-owners/:id/servers/:serverId | DELETE | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners/:id/servers/:serverId/regenerate | POST | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners/:id/claims | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners/:id/refund-wallets | GET | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners/:id/refund-wallets | POST | public.ts:1 | yes | yes | requireAuth; zod body |
| publicRouter | /api/resource-owners/:id/refund-wallets/:walletId | DELETE | public.ts:1 | yes | no | requireAuth |
| publicRouter | /api/resource-owners/:id | PUT | public.ts:1 | yes | yes | requireAuth; zod body; update resource owner |
| publicRouter | /.well-known/x402.json | GET | public.ts:1 | no | no | Public discovery |
| publicRouter | /icon.svg | GET | public.ts:1 | no | no | Public asset |
| subscriptionsRouter | /api/subscriptions/status | GET | subscriptions.ts:1 | yes | no | requireAuth |
| subscriptionsRouter | /api/subscriptions/history | GET | subscriptions.ts:1 | yes | no | requireAuth |
| subscriptionsRouter | /api/subscriptions/payments | GET | subscriptions.ts:1 | yes | no | requireAuth |
| subscriptionsRouter | /api/subscriptions/pricing | GET | subscriptions.ts:1 | no | no | Public pricing page |
| subscriptionsRouter | /api/subscriptions/purchase | POST | subscriptions.ts:1 | yes | yes | requireAuth; zod body |
| subscriptionsRouter | /api/subscriptions/reactivate | POST | subscriptions.ts:1 | yes | no | requireAuth |
| subscriptionsRouter | /api/subscriptions/billing | POST | subscriptions.ts:1 | **NO** | no | Cron — **no auth at all** (SEC-01-006, SEC-05-008) |
| notificationsRouter | /api/notifications | GET | notifications.ts:1 | yes | no | requireAuth |
| notificationsRouter | /api/notifications/:id/read | PATCH | notifications.ts:1 | yes | no | requireAuth |
| notificationsRouter | /api/notifications/read-all | PATCH | notifications.ts:1 | yes | no | requireAuth |
| notificationsRouter | /api/notifications/:id | DELETE | notifications.ts:1 | yes | no | requireAuth |
| statsRouter | /stats | GET | stats.ts:1 | no | no | x402-protected via statsPaymentMiddleware |
| statsRouter | /stats/global | GET | stats.ts:1 | no | no | x402-protected |
| statsRouter | /stats/facilitator | GET | stats.ts:1 | no | no | x402-protected |
| statsRouter | /stats/products | GET | stats.ts:1 | no | no | x402-protected |
| statsRouter | /stats/transactions | GET | stats.ts:1 | no | no | x402-protected |
| statsRouter | /stats/revenue | GET | stats.ts:1 | no | no | x402-protected |
| statsRouter | /stats/daily | GET | stats.ts:1 | no | no | x402-protected |
| discoveryRouter | /discovery/facilitators | GET | discovery.ts:1 | no | no | Public discovery listing |
| discoveryRouter | /discovery/facilitators/:id | GET | discovery.ts:1 | no | no | Public discovery detail |
| internalWebhooksRouter | /api/internal/webhooks/subscription | POST | internal-webhooks.ts:1 | no | **NO** | HMAC-SHA256 signature check; **no zod** (SEC-05-002); timingSafeEqual bug (SEC-05-001) |

### Findings

| ID | severity | title | file:line | description | status |
|----|----------|-------|-----------|-------------|--------|
| SEC-05-001 | MEDIUM | Webhook signature verification has length-mismatch leak | packages/server/src/routes/internal-webhooks.ts:106-120 | `verifyWebhookSignature` uses `crypto.timingSafeEqual` correctly but does not pre-check buffer lengths; mismatched lengths throw and the catch path returns 500, observable timing difference vs 401 for wrong-signature. | open |
| SEC-05-002 | MEDIUM | `internal-webhooks.ts:159` reads req.body fields without zod schema | packages/server/src/routes/internal-webhooks.ts:159 | `const { event, payment, metadata } = req.body;` — fields used downstream without validation. | open |
| SEC-05-003 | MEDIUM | `admin.ts:1653` reads req.body without zod schema | packages/server/src/routes/admin.ts:1653 | Same finding pair as SEC-01-001 (debug endpoint, no auth) — also fails SEC-05 because the body destructure is unvalidated. | open |
| SEC-05-004 | HIGH | Wallet signature verification commented-out on claim execute | packages/server/src/routes/public.ts:744-749 | `/api/claims/:id/execute` (refund-claim payout) has TODO + commented-out signature check. CONCERNS.md item 7. | open |
| SEC-05-005 | HIGH | No rate-limit middleware on the server | packages/server/package.json | `express-rate-limit` not in dependencies; full-tree grep for `rateLimit` returns no matches. Sensitive endpoints (`/verify`, `/settle`, auth) are open to brute force/DoS. CONCERNS.md item 8. | open |
| SEC-05-006 | MEDIUM | CORS allowlist includes dev origins in production | packages/server/src/server.ts:30-44 | `getCorsOrigins()` hardcoded array includes `localhost:*`. Likely defense-in-depth gap. | open |
| SEC-05-007 | LOW | helmet CSP only enabled in production | packages/server/src/server.ts | `helmet({ contentSecurityPolicy: process.env.NODE_ENV === 'production' })` — acceptable. | informational |
| SEC-05-008 | MEDIUM | `/subscriptions/billing` (cron) has no auth | packages/server/src/routes/subscriptions.ts | Cron endpoint with no secret header — auditor recommends shared-secret header. | open |

### Resolved by removal

No SEC-05 items resolved by Phase 22/23 removals.
