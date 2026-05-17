---
phase: 22-storefronts-removal
reviewed: 2026-05-17T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - packages/server/src/db/migrations/004_drop_storefronts.ts
  - packages/server/scripts/smoke-test-migration.mjs
  - packages/server/src/db/migrations/index.ts
  - packages/server/src/db/index.ts
  - packages/server/src/db/types.ts
  - packages/server/src/routes/admin.ts
  - packages/server/src/routes/facilitator.ts
  - apps/dashboard/src/lib/api.ts
  - apps/dashboard/src/app/dashboard/[id]/page.tsx
findings:
  critical: 0
  warning: 4
  info: 2
  total: 6
status: issues_found
---

# Phase 22: Code Review Report

**Reviewed:** 2026-05-17
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

Phase 22 deletes the storefronts feature cleanly. Cross-file grep confirms no
dangling references to `Storefront`, `StorefrontRecord`, `StorefrontProductRecord`,
`StorefrontsSection`, or `storefronts.ts` remain in source. The tab list and
render branch in `page.tsx` correctly remove the `'storefronts'` Tab union member
and its render branch. The migration FK ordering (drop join table before parent)
is correct and idempotent. Type-export surface (`db/index.ts`, `db/types.ts`)
is consistent — no orphaned `export * from './storefronts.js'`.

No BLOCKERs found. Defects below are quality issues introduced or left
behind by the deletion that should be cleaned up.

## Warnings

### WR-01: Unused `Store` icon import in dashboard page

**File:** `apps/dashboard/src/app/dashboard/[id]/page.tsx:23`
**Issue:** The `Store` icon from `lucide-react` is still imported but never
referenced anywhere in the file. It was the icon used by the now-removed
Storefronts tab/button. Grep across the file shows the only occurrence is
the import line itself. This will trigger linter warnings (unused import)
and adds dead weight to the bundle.
**Fix:** Remove `Store,` from the lucide-react import list:
```tsx
import {
  ArrowLeft,
  Copy,
  Check,
  ExternalLink,
  Activity,
  Globe,
  Key,
  Settings,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Trash2,
  Pencil,
  Upload,
  // Store,  <-- delete this line
} from 'lucide-react';
```

### WR-02: Smoke test never closes DB handles — leaks file descriptors and module singleton

**File:** `packages/server/scripts/smoke-test-migration.mjs:17,42`
**Issue:** The script calls `initializeDatabase(TEST_DB)` twice (Run 1 and
Run 2), but `initializeDatabase` (in `packages/server/src/db/index.ts:6,21-30`)
stores the handle in a module-level `let db` singleton and unconditionally
overwrites it with `db = new Database(databasePath)` without closing the
previous handle. The smoke test also never calls `closeDatabase()` or
`db.close()`/`db2.close()`. Result: when `db = await initializeDatabase(TEST_DB)`
runs the second time, the first `Database` instance leaks (the JS variable
`db` in the test still references it, but the underlying SQLite singleton
is overwritten), and on `process.exit` the WAL/SHM sidecars (`-wal`, `-shm`)
may not be checkpointed cleanly. WAL mode is explicitly enabled at
`db/index.ts:33`.

Beyond hygiene, this masks a real production bug in `initializeDatabase`:
if it's ever called twice in the same process (which the test now does),
the old connection is silently leaked. Either fix the test to call
`closeDatabase()` between runs, or fix `initializeDatabase` to be
idempotent / close-before-reopen.
**Fix:**
```js
import { initializeDatabase, closeDatabase } from '../dist/db/index.js';
// ...
const db = await initializeDatabase(TEST_DB);
// ... assertions on db ...
closeDatabase();           // close before re-init

const db2 = await initializeDatabase(TEST_DB);
// ... assertions on db2 ...
closeDatabase();
```
And consider hardening `initializeDatabase` itself to close any prior
singleton before reassigning.

### WR-03: Smoke test leaves WAL/SHM sidecar files behind and references unused `TEST_DB2`

**File:** `packages/server/scripts/smoke-test-migration.mjs:7,9-14,60-62`
**Issue:** Two problems here:

1. `TEST_DB2 = '/tmp/openfac-phase22-smoke2.db'` is declared and the script
   bothers to clean it up at start and end, but **nothing ever creates,
   opens, reads, or writes it**. It is pure dead code, suggesting an earlier
   version of the test was multi-DB and the second path was never excised.
2. `Database` is imported from `better-sqlite3` on line 6 but never
   instantiated directly — `initializeDatabase` is the only entry point used.
3. Cleanup uses `unlinkSync(TEST_DB)` only — but WAL mode (enabled
   unconditionally in `initializeDatabase`) creates `*.db-wal` and `*.db-shm`
   sidecars next to the database file. Combined with WR-02 (no close), these
   sidecars persist in `/tmp` after every run. Not a correctness issue, but
   it pollutes `/tmp` and may cause subsequent test runs to inherit stale
   WAL state if `initializeDatabase` ever changes behavior.
**Fix:**
```js
// Drop the unused Database import:
// import Database from 'better-sqlite3';        <-- delete
// Drop TEST_DB2 entirely (declaration + both cleanup branches).

function cleanupDb(path) {
  for (const suffix of ['', '-wal', '-shm']) {
    const f = path + suffix;
    if (existsSync(f)) unlinkSync(f);
  }
}
// then: cleanupDb(TEST_DB); at start and end (after closeDatabase()).
```

### WR-04: Smoke test not wired into npm scripts or CI

**File:** `packages/server/package.json:15-24`, `packages/server/scripts/smoke-test-migration.mjs`
**Issue:** The smoke test was added specifically to validate migration 004
end-to-end against `initializeDatabase` (bootstrap + migrations), but there
is no `test:migration` (or equivalent) script in `package.json`. The only
way to run it is to remember the path and invoke
`node scripts/smoke-test-migration.mjs` manually, which means:
- CI will not run it.
- Future engineers adding migration 005 are unlikely to discover it exists.
- The protection it provides decays to zero over time.
**Fix:** Add to `packages/server/package.json` scripts:
```json
"test:migration": "npm run build && node scripts/smoke-test-migration.mjs",
```
And consider invoking it from the existing `test` step or from the CI
workflow that runs migrations. (If intentionally kept manual, add a comment
at the top of the script explaining when to run it.)

## Info

### IN-01: Smoke test uses `console.log`/`process.exit(1)` and inline equality checks rather than a test runner

**File:** `packages/server/scripts/smoke-test-migration.mjs` (whole file)
**Issue:** The repo already depends on `vitest` (see `packages/server/package.json:55`),
yet this smoke test is hand-rolled with `console.error` + `process.exit(1)`
on each assertion. It works, but it produces inconsistent output and no
machine-readable test reporting. Rewriting as a `vitest` spec under
`packages/server/test/migration.test.ts` would let it run alongside the
existing `npm test` step and remove the need for WR-04 entirely.
**Fix:** Convert to a `vitest` `describe`/`it` block using the same logic.
Lower priority than wiring it into scripts.

### IN-02: Migration uses `console.log` for status with leading two-space indent

**File:** `packages/server/src/db/migrations/004_drop_storefronts.ts:20`
**Issue:** The migration prints `'  storefronts and storefront_products tables dropped (if present)'`
with a leading two-space indent that's stylistically inconsistent with
the surrounding migration runner output, which uses emoji-prefixed lines
(`'🔄 Running migration: ...'`, `'✅ Migration complete: ...'` —
see `db/migrations/index.ts:53,61`). Other migrations
(001/002/003) don't have an internal `console.log`; the runner already
brackets each migration with start/complete logs, so this extra line is
redundant noise.
**Fix:** Remove the `console.log` line entirely, or align the format with
the runner's `✅` convention. Suggested:
```ts
up(db: Database.Database): void {
  db.exec(`
    DROP TABLE IF EXISTS storefront_products;
    DROP TABLE IF EXISTS storefronts;
  `);
}
```

---

_Reviewed: 2026-05-17_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
