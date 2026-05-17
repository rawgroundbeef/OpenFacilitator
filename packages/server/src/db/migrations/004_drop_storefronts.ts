/**
 * Migration: Drop storefronts and storefront_products tables
 *
 * Storefronts feature removed in v1.3 (Phase 22). Drops the join table first
 * to satisfy the FK constraint, then drops storefronts itself. IF EXISTS on
 * both makes this idempotent for fresh DBs (where the bootstrap no longer
 * creates the tables) and for existing DBs.
 */
import type Database from 'better-sqlite3';
import type { Migration } from './index.js';

export const migration: Migration = {
  name: '004_drop_storefronts',

  up(db: Database.Database): void {
    db.exec(`
      DROP TABLE IF EXISTS storefront_products;
      DROP TABLE IF EXISTS storefronts;
    `);
    console.log('  storefronts and storefront_products tables dropped (if present)');
  },
};
