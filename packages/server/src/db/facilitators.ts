import { nanoid } from 'nanoid';
import { getDatabase } from './index.js';
import type { FacilitatorRecord } from './types.js';

/**
 * Create a new facilitator
 */
export function createFacilitator(data: {
  name: string;
  subdomain: string;
  owner_address: string;
  supported_chains: string;
  supported_tokens: string;
  encrypted_private_key?: string;
}): FacilitatorRecord | null {
  const db = getDatabase();
  const id = nanoid();

  try {
    const stmt = db.prepare(`
      INSERT INTO facilitators (id, name, subdomain, owner_address, supported_chains, supported_tokens, encrypted_private_key)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.name,
      data.subdomain.toLowerCase(),
      data.owner_address.toLowerCase(),
      data.supported_chains,
      data.supported_tokens,
      data.encrypted_private_key || null
    );

    return getFacilitatorById(id);
  } catch (error: unknown) {
    // Check for unique constraint violation
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return null;
    }
    throw error;
  }
}

/**
 * Get a facilitator by ID
 */
export function getFacilitatorById(id: string): FacilitatorRecord | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM facilitators WHERE id = ?');
  return (stmt.get(id) as FacilitatorRecord) || null;
}

/**
 * Get a facilitator by subdomain
 */
export function getFacilitatorBySubdomain(subdomain: string): FacilitatorRecord | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM facilitators WHERE subdomain = ?');
  return (stmt.get(subdomain.toLowerCase()) as FacilitatorRecord) || null;
}

/**
 * Get a facilitator by custom domain
 */
export function getFacilitatorByCustomDomain(domain: string): FacilitatorRecord | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM facilitators WHERE custom_domain = ?');
  return (stmt.get(domain.toLowerCase()) as FacilitatorRecord) || null;
}

/**
 * Get all facilitators for an owner address
 */
export function getFacilitatorsByOwner(ownerAddress: string): FacilitatorRecord[] {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM facilitators WHERE owner_address = ? ORDER BY created_at DESC');
  return stmt.all(ownerAddress.toLowerCase()) as FacilitatorRecord[];
}

/**
 * Update a facilitator
 */
export function updateFacilitator(
  id: string,
  updates: Partial<{
    name: string;
    custom_domain: string;
    supported_chains: string;
    supported_tokens: string;
    encrypted_private_key: string;
  }>
): FacilitatorRecord | null {
  const db = getDatabase();

  // Build dynamic update query
  const fields: string[] = [];
  const values: (string | null)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.custom_domain !== undefined) {
    fields.push('custom_domain = ?');
    values.push(updates.custom_domain || null);
  }
  if (updates.supported_chains !== undefined) {
    fields.push('supported_chains = ?');
    values.push(updates.supported_chains);
  }
  if (updates.supported_tokens !== undefined) {
    fields.push('supported_tokens = ?');
    values.push(updates.supported_tokens);
  }
  if (updates.encrypted_private_key !== undefined) {
    fields.push('encrypted_private_key = ?');
    values.push(updates.encrypted_private_key);
  }

  if (fields.length === 0) {
    return getFacilitatorById(id);
  }

  fields.push("updated_at = datetime('now')");
  values.push(id);

  const stmt = db.prepare(`UPDATE facilitators SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getFacilitatorById(id);
}

/**
 * Delete a facilitator
 */
export function deleteFacilitator(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM facilitators WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Check if a subdomain is available
 */
export function isSubdomainAvailable(subdomain: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('SELECT 1 FROM facilitators WHERE subdomain = ?');
  return !stmt.get(subdomain.toLowerCase());
}

