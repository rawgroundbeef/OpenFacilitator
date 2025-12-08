import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;

/**
 * Get the database instance
 */
export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

/**
 * Initialize the SQLite database
 */
export function initializeDatabase(dbPath?: string): Database.Database {
  const databasePath = dbPath || process.env.DATABASE_PATH || './data/openfacilitator.db';

  // Ensure directory exists
  const dir = path.dirname(databasePath);
  if (dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }

  db = new Database(databasePath);

  // Enable WAL mode for better concurrent performance
  db.pragma('journal_mode = WAL');

  // Create tables
  db.exec(`
    -- Facilitators table
    CREATE TABLE IF NOT EXISTS facilitators (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      custom_domain TEXT UNIQUE,
      owner_address TEXT NOT NULL,
      supported_chains TEXT NOT NULL DEFAULT '[]',
      supported_tokens TEXT NOT NULL DEFAULT '[]',
      encrypted_private_key TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Transactions table
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      facilitator_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('verify', 'settle')),
      network TEXT NOT NULL,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      amount TEXT NOT NULL,
      asset TEXT NOT NULL,
      transaction_hash TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (facilitator_id) REFERENCES facilitators(id) ON DELETE CASCADE
    );

    -- Users table (for dashboard authentication)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      wallet_address TEXT UNIQUE NOT NULL,
      tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'pro')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Custom domain verification table
    CREATE TABLE IF NOT EXISTS domain_verifications (
      id TEXT PRIMARY KEY,
      facilitator_id TEXT NOT NULL,
      domain TEXT NOT NULL,
      verification_token TEXT NOT NULL,
      verified_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (facilitator_id) REFERENCES facilitators(id) ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_facilitators_subdomain ON facilitators(subdomain);
    CREATE INDEX IF NOT EXISTS idx_facilitators_custom_domain ON facilitators(custom_domain);
    CREATE INDEX IF NOT EXISTS idx_facilitators_owner ON facilitators(owner_address);
    CREATE INDEX IF NOT EXISTS idx_transactions_facilitator ON transactions(facilitator_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
  `);

  console.log('✅ Database initialized at', databasePath);

  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}

export * from './facilitators.js';
export * from './transactions.js';
export * from './types.js';

