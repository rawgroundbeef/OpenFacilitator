/**
 * Migration: Drop $OPEN rewards program tables
 *
 * Rewards program abandoned in v1.3 (Phase 23). Drops the five reward tables
 * in FK-safe order:
 *   volume_snapshots  → child of reward_addresses + campaigns
 *   reward_claims     → child of campaigns
 *   campaign_audit    → child of campaigns
 *   campaigns         → parent
 *   reward_addresses  → parent
 *
 * IF EXISTS on every statement makes this idempotent for fresh DBs (where
 * the bootstrap no longer creates the tables) and for existing DBs.
 */
import type Database from 'better-sqlite3';
import type { Migration } from './index.js';

export const migration: Migration = {
  name: '005_drop_rewards',

  up(db: Database.Database): void {
    db.exec(`
      DROP TABLE IF EXISTS volume_snapshots;
      DROP TABLE IF EXISTS reward_claims;
      DROP TABLE IF EXISTS campaign_audit;
      DROP TABLE IF EXISTS campaigns;
      DROP TABLE IF EXISTS reward_addresses;
    `);
    console.log('  reward tables dropped (if present): volume_snapshots, reward_claims, campaign_audit, campaigns, reward_addresses');
  },
};
