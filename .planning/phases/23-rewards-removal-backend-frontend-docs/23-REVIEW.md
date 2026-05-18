---
phase: 23-rewards-removal-backend-frontend-docs
reviewed: 2026-05-17T18:09:57Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - packages/server/src/db/migrations/005_drop_rewards.ts
  - packages/server/src/db/migrations/002_campaign_audit_table.ts
  - packages/server/src/db/migrations/index.ts
  - packages/server/src/db/index.ts
  - packages/server/src/db/types.ts
  - packages/server/src/db/facilitators.ts
  - packages/server/src/middleware/auth.ts
  - packages/server/src/routes/admin.ts
  - packages/server/src/routes/internal-webhooks.ts
  - packages/server/src/server.ts
  - packages/server/.env.example
  - apps/dashboard/src/lib/api.ts
  - apps/dashboard/src/components/auth/auth-provider.tsx
  - apps/dashboard/src/components/navbar.tsx
  - apps/dashboard/src/components/user-menu.tsx
  - apps/dashboard/src/components/archive/wallet-dropdown.tsx
  - apps/dashboard/src/components/dashboard/FeaturesSpotlight/featureCards.ts
  - apps/dashboard/src/components/dashboard/FeaturesSpotlight/index.tsx
  - apps/dashboard/src/app/dashboard/[id]/page.tsx
  - apps/dashboard/src/app/dashboard/page.tsx
  - apps/dashboard/src/app/page.tsx
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: issues_found
---

# Phase 23: Code Review Report

**Reviewed:** 2026-05-17T18:09:57Z
**Depth:** standard
**Files Reviewed:** 21
**Status:** issues_found

## Summary

Phase 23 excises the abandoned `$OPEN` rewards program from the server, dashboard,
and docs. The bulk of the change is deletion: 12 server files, ~21 dashboard
files/dirs, plus partial edits to keep the build green. New code is one migration
file (`005_drop_rewards.ts`) and a small fresh-DB guard added to
`002_campaign_audit_table.ts`.

**Migration correctness (focus area 1 & 2): clean.**
- `005_drop_rewards.ts` drops the 5 reward tables in the correct child-before-parent
  order (`volume_snapshots → reward_claims → campaign_audit → campaigns → reward_addresses`)
  and uses `DROP TABLE IF EXISTS` on every statement, making it idempotent for
  fresh DBs and existing DBs alike. The "FK-safe" ordering is technically
  redundant since better-sqlite3 leaves `PRAGMA foreign_keys=OFF` by default, but
  it's defensive and correct.
- `002_campaign_audit_table.ts` correctly short-circuits when the `campaigns`
  table is absent (fresh-DB case). The guard at line 19 is the only safe path —
  without it, the `CREATE TABLE … REFERENCES campaigns(id)` at line 32 would fail
  on a fresh DB.

**Rewards reference scan (focus area 5): clean.**
No orphaned references to `reward`, `campaign`, `$OPEN`, `volume_snapshot`,
`reward_claim`, or `reward_address` remain in any reviewed dashboard file or in
`routes/admin.ts`. Only the migrations themselves reference these names, which
is correct.

**Issues found:** one unused import left behind by the partial edit to
`db/facilitators.ts`, a redundant React Fragment in `navbar.tsx`, plus several
pre-existing concerns in files that this phase touched (which are now in scope).

## Warnings

### WR-01: Unused import `extendSubscription` in `db/facilitators.ts`

**File:** `packages/server/src/db/facilitators.ts:4`
**Issue:** `extendSubscription` is imported but never referenced anywhere in
the file. This is an orphan left by the Phase 23 partial edit (the rewards
excision removed call sites in this module without trimming the import). Grep
of the file body for `extendSubscription` returns zero hits after line 4.
**Fix:**
```typescript
// Before
import { getActiveSubscription, createSubscription, extendSubscription } from './subscriptions.js';

// After
import { getActiveSubscription, createSubscription } from './subscriptions.js';
```
TS strict mode with `noUnusedLocals` would flag this — its survival suggests
the lint/typecheck gate is not catching unused imports.

### WR-02: HMAC verification can throw `RangeError` on malformed signatures

**File:** `packages/server/src/routes/internal-webhooks.ts:116-119` (called at line 152)
**Issue:** `crypto.timingSafeEqual` throws `ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH`
when the two `Buffer` arguments have different lengths. The signature header
comes from the request (`req.headers['x-webhook-signature']`) and is not
length-validated before being passed to `Buffer.from(signature)`. An attacker
sending a signature of any length other than 64 hex chars (the length of a
SHA-256 hex digest) will trigger an unhandled exception inside the route
handler. The route handler has no `try/catch` wrapping the
`verifyWebhookSignature` call (only the subscription-extension block at
line 219 has try/catch), so the throw bubbles up to Express's default error
handler and returns a 500 instead of a 401.

This file was edited in Phase 23 (`ensureFacilitatorMarker` call sites
removed), placing it in scope. The bug is pre-existing but the partial edit
provides a natural opportunity to harden it.
**Fix:**
```typescript
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(signature, 'utf8');
  const expBuf = Buffer.from(expectedSignature, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}
```

### WR-03: Webhook HMAC verifies `JSON.stringify(req.body)`, not the raw body

**File:** `packages/server/src/routes/internal-webhooks.ts:151-152`
**Issue:** `const rawBody = JSON.stringify(req.body);` reconstructs the body
from Express's parsed JSON object. Whitespace, key ordering, and unicode
escaping are not guaranteed to match the bytes the sender originally signed.
If the sender (OpenFacilitator's own webhook delivery service) signs a
canonical raw payload, this verification will silently reject valid
signatures — or worse, accept signatures over a re-serialized payload that
differs from what was actually transmitted, defeating the integrity
guarantee. In v1.3, the only sender is OpenFacilitator's own webhook service,
which serializes with `JSON.stringify` itself, so this may currently work by
accident. It will break the moment a sender uses a different JSON formatter
or includes any whitespace.

This file is in scope due to the Phase 23 edit.
**Fix:** Use `express.raw({ type: 'application/json' })` for this endpoint
and verify against the actual bytes:
```typescript
router.post('/subscription',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const rawBody = (req.body as Buffer).toString('utf8');
    // verify HMAC against rawBody
    const parsed = JSON.parse(rawBody);
    const { event, payment, metadata } = parsed;
    // ...rest of handler uses parsed
  }
);
```

### WR-04: Empty `catch` blocks swallow all migration errors silently

**File:** `packages/server/src/db/index.ts:77-79, 131-133, 143-145, 155-157, 167-169, 209-211, 242-244`
**Issue:** Seven `try { … } catch (e) { /* Table might not exist yet */ }`
blocks in the legacy ad-hoc migration section silently swallow every error,
not just "table doesn't exist" errors. A genuine schema corruption,
constraint violation, or `SQLITE_BUSY` during one of these ALTERs would be
invisible. After Phase 23 these blocks remain entirely intact — none were
touched — but the file is in scope and the pattern works against the
migration-system invariants that Phase 23's new `005_drop_rewards` relies on
(if one of the legacy migrations corrupts state silently, subsequent
migrations may fail in confusing ways).
**Fix:** Narrow the catch and at least log unexpected errors:
```typescript
} catch (e) {
  if (e instanceof Error && /no such table/i.test(e.message)) return;
  console.error('Unexpected migration error:', e);
  throw e;
}
```
Out of scope for a strict "rewards-removal" phase, but worth queuing.

## Info

### IN-01: Redundant React Fragment wrapping a single child in `navbar.tsx`

**File:** `apps/dashboard/src/components/navbar.tsx:21-22, 134-135`
**Issue:** The component wraps a single `<nav>` element in `<> … </>`. The
fragment serves no purpose since there is exactly one root child. This was
introduced/left over by the Phase 23 rewrite of `navbar.tsx`.
**Fix:** Remove the fragment:
```tsx
return (
  <nav className="fixed w-full z-50 …">
    {/* … existing content … */}
  </nav>
);
```

### IN-02: Archive file `archive/wallet-dropdown.tsx` is unreferenced dead code

**File:** `apps/dashboard/src/components/archive/wallet-dropdown.tsx` (entire file, 177 lines)
**Issue:** Grep shows no importers anywhere in `apps/dashboard/src` for
`WalletDropdown` or `archive/wallet-dropdown`. The file's own header comment
marks it as "ARCHIVED: 2026-01-22" from Phase 17. Phase 23 edited the file
(per commit `e143776` description) to strip a Rewards link block, but the
file itself remains unused dead code in the source tree, still compiled by
`tsc`. If it is truly preserved-for-reference, it belongs in
`.planning/archive/` or a separate non-compiled directory, not in `src/`.
**Fix:** Either delete the file, or move it out of `src/` so it is not
type-checked / bundled.

### IN-03: Deprecated type aliases and method aliases still exported from `api.ts`

**File:** `apps/dashboard/src/lib/api.ts:279-280, 311-312, 324-325, 346-347, 359-360, 366-367, 966-976`
**Issue:** The file carries a substantial set of `@deprecated` aliases for
the `PaymentLink* → Product*` rename (~15 aliases including type aliases,
re-exported classes via `getPaymentLinks = this.getProducts`, etc.). These
predate Phase 23 but the file was edited as part of this phase (10 reward
types + 20 reward methods removed). Since the file was already opened, the
deprecated names could be removed at the same time if no external consumer
relies on them — particularly the method-property aliases (lines 966-976),
which are assigned without `bind()` so calling
`api.getPaymentLinks(facilitatorId)` works but `const fn = api.getPaymentLinks; fn(id)`
would break `this`.
**Fix:** Audit usage and remove in a follow-up cleanup phase, or
explicitly bind the methods to avoid the `this`-loss footgun:
```typescript
getPaymentLinks = this.getProducts.bind(this);
```

### IN-04: Migration `004_drop_storefronts` no longer needs the v1.3 comment context

**File:** `packages/server/src/db/migrations/002_campaign_audit_table.ts:7-9` (cosmetic)
**Issue:** The note added in Phase 23 is correct but mentions
"v1.3 bootstrap cleanup" — once v1.3 ships and the rewards excision is
common knowledge, this comment becomes stale historical context. Not a bug;
just a maintainability note.
**Fix:** Optional — consider trimming the comment in a future cleanup, or
keep as-is for history.

---

_Reviewed: 2026-05-17T18:09:57Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
