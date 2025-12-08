import { nanoid } from 'nanoid';
import { getDatabase } from './index.js';
import type { TransactionRecord } from './types.js';

/**
 * Create a new transaction record
 */
export function createTransaction(data: {
  facilitator_id: string;
  type: 'verify' | 'settle';
  network: string;
  from_address: string;
  to_address: string;
  amount: string;
  asset: string;
  transaction_hash?: string;
  status: 'pending' | 'success' | 'failed';
  error_message?: string;
}): TransactionRecord | null {
  const db = getDatabase();
  const id = nanoid();

  try {
    const stmt = db.prepare(`
      INSERT INTO transactions (id, facilitator_id, type, network, from_address, to_address, amount, asset, transaction_hash, status, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      data.facilitator_id,
      data.type,
      data.network,
      data.from_address.toLowerCase(),
      data.to_address.toLowerCase(),
      data.amount,
      data.asset.toLowerCase(),
      data.transaction_hash || null,
      data.status,
      data.error_message || null
    );

    return getTransactionById(id);
  } catch (error) {
    console.error('Failed to create transaction:', error);
    return null;
  }
}

/**
 * Get a transaction by ID
 */
export function getTransactionById(id: string): TransactionRecord | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
  return (stmt.get(id) as TransactionRecord) || null;
}

/**
 * Get transactions for a facilitator
 */
export function getTransactionsByFacilitator(
  facilitatorId: string,
  limit = 50,
  offset = 0
): TransactionRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM transactions 
    WHERE facilitator_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `);
  return stmt.all(facilitatorId, limit, offset) as TransactionRecord[];
}

/**
 * Update transaction status
 */
export function updateTransactionStatus(
  id: string,
  status: 'pending' | 'success' | 'failed',
  transactionHash?: string,
  errorMessage?: string
): TransactionRecord | null {
  const db = getDatabase();

  const fields: string[] = ['status = ?'];
  const values: (string | null)[] = [status];

  if (transactionHash !== undefined) {
    fields.push('transaction_hash = ?');
    values.push(transactionHash);
  }
  if (errorMessage !== undefined) {
    fields.push('error_message = ?');
    values.push(errorMessage);
  }

  values.push(id);

  const stmt = db.prepare(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);

  if (result.changes === 0) {
    return null;
  }

  return getTransactionById(id);
}

/**
 * Get transaction statistics for a facilitator
 */
export function getTransactionStats(facilitatorId: string): {
  total: number;
  verified: number;
  settled: number;
  failed: number;
} {
  const db = getDatabase();

  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE facilitator_id = ?');
  const total = (totalStmt.get(facilitatorId) as { count: number }).count;

  const verifiedStmt = db.prepare(
    "SELECT COUNT(*) as count FROM transactions WHERE facilitator_id = ? AND type = 'verify' AND status = 'success'"
  );
  const verified = (verifiedStmt.get(facilitatorId) as { count: number }).count;

  const settledStmt = db.prepare(
    "SELECT COUNT(*) as count FROM transactions WHERE facilitator_id = ? AND type = 'settle' AND status = 'success'"
  );
  const settled = (settledStmt.get(facilitatorId) as { count: number }).count;

  const failedStmt = db.prepare(
    "SELECT COUNT(*) as count FROM transactions WHERE facilitator_id = ? AND status = 'failed'"
  );
  const failed = (failedStmt.get(facilitatorId) as { count: number }).count;

  return { total, verified, settled, failed };
}

