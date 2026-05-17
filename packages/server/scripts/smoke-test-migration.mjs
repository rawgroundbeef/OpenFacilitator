/**
 * Smoke test for migration 004_drop_storefronts
 * Uses initializeDatabase() to run bootstrap + migrations just like the server does.
 */
import { initializeDatabase, closeDatabase } from '../dist/db/index.js';
import { unlinkSync, existsSync } from 'fs';

const TEST_DB = '/tmp/openfac-phase22-smoke.db';

/**
 * Remove a SQLite database file along with its WAL/SHM sidecars. WAL mode
 * is enabled unconditionally in initializeDatabase, so each run produces
 * `${path}-wal` and `${path}-shm` next to `${path}`. Cleanup must remove
 * all three or stale WAL state persists across runs in /tmp.
 */
function cleanupDb(path) {
  for (const suffix of ['', '-wal', '-shm']) {
    const f = path + suffix;
    if (existsSync(f)) unlinkSync(f);
  }
}

// Clean up any previous test DB (and its WAL/SHM sidecars).
cleanupDb(TEST_DB);

console.log('=== Run 1: Fresh DB (first time) ===');
const db = await initializeDatabase(TEST_DB);

// Verify 004 recorded
const migs = db.prepare('SELECT name FROM migrations').all().map(r => r.name);
console.log('Recorded migrations:', migs);
const has004 = migs.includes('004_drop_storefronts');
if (!has004) {
  console.error('FAIL: 004_drop_storefronts not recorded in migrations table');
  process.exit(1);
}
console.log('004 recorded in migrations: ✓');

// Verify no storefront tables exist
const storefrontTables = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%storefront%'"
).all().map(r => r.name);

if (storefrontTables.length > 0) {
  console.error('FAIL: storefront tables exist after migration:', storefrontTables);
  process.exit(1);
}
console.log('Storefront tables: (none) ✓');

// Close before re-init so the module-level singleton in initializeDatabase
// does not leak the first handle (WAL/SHM remain open otherwise).
closeDatabase();

console.log('\n=== Run 2: Idempotency check (same DB) ===');
// Re-initialize same DB (simulates server restart)
const db2 = await initializeDatabase(TEST_DB);
const storefrontTables2 = db2.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%storefront%'"
).all().map(r => r.name);
if (storefrontTables2.length > 0) {
  console.error('FAIL: storefront tables appeared after second run:', storefrontTables2);
  process.exit(1);
}
console.log('Idempotency check (no duplicate migration, no storefront tables): ✓');

// Verify 004 row in migrations table
const row = db2.prepare("SELECT name FROM migrations WHERE name='004_drop_storefronts'").get();
if (!row) {
  console.error('FAIL: 004_drop_storefronts row not in migrations table');
  process.exit(1);
}
console.log('migrations table row for 004_drop_storefronts: ✓');

// Close the second handle before final cleanup so SQLite checkpoints WAL
// and releases the *-wal / *-shm sidecars.
closeDatabase();

// Cleanup (database file + WAL/SHM sidecars)
cleanupDb(TEST_DB);

console.log('\nMIGRATION SMOKE TEST PASSED ✓');
