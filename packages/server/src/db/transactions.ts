import { nanoid } from 'nanoid';
import { getDatabase } from './index.js';
import type { TransactionRecord } from './types.js';

// Only EVM addresses (0x-prefixed hex) are case-insensitive. Solana base58 and
// Stacks c32check addresses are case-sensitive and must be stored verbatim.
function normalizeAddress(addr: string): string {
  return addr.startsWith('0x') ? addr.toLowerCase() : addr;
}

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
      normalizeAddress(data.from_address),
      normalizeAddress(data.to_address),
      data.amount,
      normalizeAddress(data.asset),
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
  totalAmountSettled: string;
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

  // Calculate total amount settled (amounts are stored as atomic units, e.g., 50000 = $0.05 USDC)
  const amountStmt = db.prepare(
    "SELECT COALESCE(SUM(CAST(amount AS INTEGER)), 0) as total FROM transactions WHERE facilitator_id = ? AND type = 'settle' AND status = 'success'"
  );
  const totalAtomicUnits = (amountStmt.get(facilitatorId) as { total: number }).total;
  // Convert from atomic units (6 decimals for USDC) to dollars
  const totalAmountSettled = (totalAtomicUnits / 1_000_000).toFixed(2);

  return { total, verified, settled, failed, totalAmountSettled };
}

/**
 * Get daily aggregated stats for a facilitator (for charts)
 */
export function getDailyStats(
  facilitatorId: string,
  days: number = 30
): Array<{
  date: string;
  settlements: number;
  verifications: number;
  amount: number;
}> {
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT
      DATE(created_at) as date,
      SUM(CASE WHEN type = 'settle' AND status = 'success' THEN 1 ELSE 0 END) as settlements,
      SUM(CASE WHEN type = 'verify' AND status = 'success' THEN 1 ELSE 0 END) as verifications,
      COALESCE(SUM(CASE WHEN type = 'settle' AND status = 'success' THEN CAST(amount AS INTEGER) ELSE 0 END), 0) as amount_atomic
    FROM transactions
    WHERE facilitator_id = ?
      AND created_at >= datetime('now', ?)
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);

  const results = stmt.all(facilitatorId, `-${days} days`) as Array<{
    date: string;
    settlements: number;
    verifications: number;
    amount_atomic: number;
  }>;

  return results.map((row) => ({
    date: row.date,
    settlements: row.settlements,
    verifications: row.verifications,
    amount: row.amount_atomic / 1_000_000, // Convert atomic units to dollars
  }));
}

function normalizeNetworkLabel(network: string): string {
  const value = network.toLowerCase();

  if (value === 'solana' || value === 'solana-mainnet' || value.startsWith('solana:')) {
    return 'Solana';
  }
  if (value === 'solana-devnet') {
    return 'Solana Devnet';
  }
  if (value === 'base' || value === 'eip155:8453') {
    return 'Base';
  }
  if (value === 'base-sepolia' || value === 'eip155:84532') {
    return 'Base Sepolia';
  }
  if (value === 'stacks' || value === 'stacks:1') {
    return 'Stacks';
  }
  if (value === 'stacks-testnet' || value === 'stacks:2147483648') {
    return 'Stacks Testnet';
  }

  return network;
}

type PublicStatsRange = '24h' | '30d' | 'all';

type PublicStatsSeriesPoint = {
  date: string;
  bucket: string;
  label: string;
  allSettlements: number;
  solanaSettlements: number;
  allVolumeUsd: string;
  solanaVolumeUsd: string;
};

type PublicStatsRangePayload = {
  label: string;
  bucket: 'hour' | 'day' | 'month';
  summary: {
    payments: number;
    verifications: number;
    volumeUsd: string;
    uniqueWallets: number;
  };
  series: PublicStatsSeriesPoint[];
};

function createPublicSeriesPoint(date: string, label = date): PublicStatsSeriesPoint {
  return {
    date,
    bucket: date,
    label,
    allSettlements: 0,
    solanaSettlements: 0,
    allVolumeUsd: '0.00',
    solanaVolumeUsd: '0.00',
  };
}

function emptyPublicSeries(days: number): PublicStatsSeriesPoint[] {
  const series: PublicStatsSeriesPoint[] = [];

  for (let i = days - 1; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    series.push(createPublicSeriesPoint(date.toISOString().slice(0, 10)));
  }

  return series;
}

function emptyHourlyPublicSeries(hours: number): PublicStatsSeriesPoint[] {
  const series: PublicStatsSeriesPoint[] = [];
  const now = new Date();
  now.setUTCMinutes(0, 0, 0);

  for (let i = hours - 1; i >= 0; i -= 1) {
    const date = new Date(now);
    date.setUTCHours(date.getUTCHours() - i);
    const bucket = date.toISOString();
    series.push(createPublicSeriesPoint(bucket, bucket));
  }

  return series;
}

function emptyMonthlyPublicSeries(firstMonth: string | null): PublicStatsSeriesPoint[] {
  const series: PublicStatsSeriesPoint[] = [];
  const now = new Date();
  const cursor = firstMonth
    ? new Date(`${firstMonth}-01T00:00:00.000Z`)
    : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  while (cursor <= end) {
    const bucket = cursor.toISOString().slice(0, 7);
    series.push(createPublicSeriesPoint(bucket, bucket));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }

  return series.length > 0 ? series : [createPublicSeriesPoint(end.toISOString().slice(0, 7))];
}

function getPublicRangeStats(
  facilitatorId: string,
  range: PublicStatsRange,
  days: number
): PublicStatsRangePayload {
  const db = getDatabase();
  const firstMonth = range === 'all'
    ? (db
        .prepare(
          `
          SELECT strftime('%Y-%m', MIN(created_at)) as first_month
          FROM transactions
          WHERE facilitator_id = ?
            AND type = 'settle'
            AND status = 'success'
        `
        )
        .get(facilitatorId) as { first_month: string | null }).first_month
    : null;

  const config = {
    '24h': {
      label: 'Last 24h',
      bucket: 'hour' as const,
      dateFilter: "AND created_at >= datetime('now', '-24 hours')",
      bucketExpression: "strftime('%Y-%m-%dT%H:00:00.000Z', created_at)",
      series: emptyHourlyPublicSeries(24),
    },
    '30d': {
      label: 'Last 30d',
      bucket: 'day' as const,
      dateFilter: `AND created_at >= datetime('now', '-${days - 1} days')`,
      bucketExpression: 'DATE(created_at)',
      series: emptyPublicSeries(days),
    },
    all: {
      label: 'All time',
      bucket: 'month' as const,
      dateFilter: '',
      bucketExpression: "strftime('%Y-%m', created_at)",
      series: emptyMonthlyPublicSeries(firstMonth),
    },
  }[range];

  const summary = db
    .prepare(
      `
      SELECT
        SUM(CASE WHEN type = 'settle' AND status = 'success' THEN 1 ELSE 0 END) as payments,
        SUM(CASE WHEN type = 'verify' AND status = 'success' THEN 1 ELSE 0 END) as verifications,
        COALESCE(SUM(CASE WHEN type = 'settle' AND status = 'success' THEN CAST(amount AS INTEGER) ELSE 0 END), 0) as volume_atomic,
        COUNT(DISTINCT CASE WHEN type = 'settle' AND status = 'success' THEN from_address END) as unique_wallets
      FROM transactions
      WHERE facilitator_id = ?
        ${config.dateFilter}
    `
    )
    .get(facilitatorId) as {
    payments: number | null;
    verifications: number | null;
    volume_atomic: number | null;
    unique_wallets: number | null;
  };

  const rows = db
    .prepare(
      `
      SELECT
        ${config.bucketExpression} as bucket,
        network,
        SUM(CASE WHEN type = 'settle' AND status = 'success' THEN 1 ELSE 0 END) as settlements,
        COALESCE(SUM(CASE WHEN type = 'settle' AND status = 'success' THEN CAST(amount AS INTEGER) ELSE 0 END), 0) as volume_atomic
      FROM transactions
      WHERE facilitator_id = ?
        ${config.dateFilter}
      GROUP BY bucket, network
      ORDER BY bucket ASC
    `
    )
    .all(facilitatorId) as Array<{
    bucket: string;
    network: string;
    settlements: number;
    volume_atomic: number;
  }>;

  const seriesByBucket = new Map(config.series.map((point) => [point.bucket, point]));

  for (const row of rows) {
    const point = seriesByBucket.get(row.bucket);
    if (!point) continue;

    const allVolumeAtomic = Math.round(Number(point.allVolumeUsd) * 1_000_000) + row.volume_atomic;
    point.allSettlements += row.settlements;
    point.allVolumeUsd = (allVolumeAtomic / 1_000_000).toFixed(2);

    if (normalizeNetworkLabel(row.network) === 'Solana') {
      const solanaVolumeAtomic = Math.round(Number(point.solanaVolumeUsd) * 1_000_000) + row.volume_atomic;
      point.solanaSettlements += row.settlements;
      point.solanaVolumeUsd = (solanaVolumeAtomic / 1_000_000).toFixed(2);
    }
  }

  return {
    label: config.label,
    bucket: config.bucket,
    summary: {
      payments: summary.payments ?? 0,
      verifications: summary.verifications ?? 0,
      volumeUsd: ((summary.volume_atomic ?? 0) / 1_000_000).toFixed(2),
      uniqueWallets: summary.unique_wallets ?? 0,
    },
    series: config.series,
  };
}

/**
 * Get aggregate public stats for the public pay.openfacilitator.io endpoint. These values are safe
 * to expose publicly because they only contain aggregate transaction counts,
 * volume, and broad network groupings.
 */
export function getPublicFacilitatorStats(
  facilitatorId: string = 'free-facilitator',
  days: number = 14
): {
  totals: {
    settlementsAllTime: number;
    settlements24h: number;
    verifications24h: number;
    volumeUsdAllTime: string;
    volumeUsd24h: string;
    uniqueWallets: number;
    successRate24h: number;
  };
  byNetwork: Array<{
    network: string;
    settlements: number;
    verifications: number;
    volumeUsd: string;
    successRate: number;
  }>;
  series: Array<{
    date: string;
    bucket: string;
    label: string;
    allSettlements: number;
    solanaSettlements: number;
    allVolumeUsd: string;
    solanaVolumeUsd: string;
  }>;
  ranges: Record<PublicStatsRange, PublicStatsRangePayload>;
} {
  const db = getDatabase();

  const totals = db
    .prepare(
      `
      SELECT
        SUM(CASE WHEN type = 'settle' AND status = 'success' THEN 1 ELSE 0 END) as settlements_all_time,
        SUM(CASE WHEN type = 'settle' AND status = 'success' AND created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as settlements_24h,
        SUM(CASE WHEN type = 'verify' AND status = 'success' AND created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as verifications_24h,
        COALESCE(SUM(CASE WHEN type = 'settle' AND status = 'success' THEN CAST(amount AS INTEGER) ELSE 0 END), 0) as volume_all_time,
        COALESCE(SUM(CASE WHEN type = 'settle' AND status = 'success' AND created_at > datetime('now', '-24 hours') THEN CAST(amount AS INTEGER) ELSE 0 END), 0) as volume_24h,
        COUNT(DISTINCT CASE WHEN type = 'settle' AND status = 'success' THEN from_address END) as unique_wallets,
        SUM(CASE WHEN created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as total_24h,
        SUM(CASE WHEN status = 'success' AND created_at > datetime('now', '-24 hours') THEN 1 ELSE 0 END) as success_24h
      FROM transactions
      WHERE facilitator_id = ?
    `
    )
    .get(facilitatorId) as {
    settlements_all_time: number | null;
    settlements_24h: number | null;
    verifications_24h: number | null;
    volume_all_time: number | null;
    volume_24h: number | null;
    unique_wallets: number | null;
    total_24h: number | null;
    success_24h: number | null;
  };

  const networkRows = db
    .prepare(
      `
      SELECT
        network,
        SUM(CASE WHEN type = 'settle' AND status = 'success' THEN 1 ELSE 0 END) as settlements,
        SUM(CASE WHEN type = 'verify' AND status = 'success' THEN 1 ELSE 0 END) as verifications,
        COALESCE(SUM(CASE WHEN type = 'settle' AND status = 'success' THEN CAST(amount AS INTEGER) ELSE 0 END), 0) as volume_atomic,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success
      FROM transactions
      WHERE facilitator_id = ?
      GROUP BY network
    `
    )
    .all(facilitatorId) as Array<{
    network: string;
    settlements: number;
    verifications: number;
    volume_atomic: number;
    total: number;
    success: number;
  }>;

  const byNetworkMap = new Map<string, {
    settlements: number;
    verifications: number;
    volumeAtomic: number;
    total: number;
    success: number;
  }>();

  for (const row of networkRows) {
    const label = normalizeNetworkLabel(row.network);
    const existing = byNetworkMap.get(label) ?? {
      settlements: 0,
      verifications: 0,
      volumeAtomic: 0,
      total: 0,
      success: 0,
    };

    existing.settlements += row.settlements;
    existing.verifications += row.verifications;
    existing.volumeAtomic += row.volume_atomic;
    existing.total += row.total;
    existing.success += row.success;
    byNetworkMap.set(label, existing);
  }

  const total24h = totals.total_24h ?? 0;
  const success24h = totals.success_24h ?? 0;

  const ranges = {
    '24h': getPublicRangeStats(facilitatorId, '24h', days),
    '30d': getPublicRangeStats(facilitatorId, '30d', days),
    all: getPublicRangeStats(facilitatorId, 'all', days),
  };

  return {
    totals: {
      settlementsAllTime: totals.settlements_all_time ?? 0,
      settlements24h: totals.settlements_24h ?? 0,
      verifications24h: totals.verifications_24h ?? 0,
      volumeUsdAllTime: ((totals.volume_all_time ?? 0) / 1_000_000).toFixed(2),
      volumeUsd24h: ((totals.volume_24h ?? 0) / 1_000_000).toFixed(2),
      uniqueWallets: totals.unique_wallets ?? 0,
      successRate24h: total24h === 0 ? 100 : Math.round((success24h / total24h) * 1000) / 10,
    },
    byNetwork: Array.from(byNetworkMap.entries())
      .map(([network, value]) => ({
        network,
        settlements: value.settlements,
        verifications: value.verifications,
        volumeUsd: (value.volumeAtomic / 1_000_000).toFixed(2),
        successRate: value.total === 0 ? 100 : Math.round((value.success / value.total) * 1000) / 10,
      }))
      .sort((a, b) => b.settlements - a.settlements),
    series: ranges['30d'].series,
    ranges,
  };
}

/**
 * Get global transaction statistics across all facilitators
 */
export function getGlobalStats(): {
  global: {
    totalTransactionsAllTime: number;
    totalTransactions24h: number;
    volumeUsdAllTime: string;
    volumeUsd24h: string;
    uniqueWallets: number;
  };
  paymentLinks: {
    totalSellers: number;
    totalLinks: number;
    totalPayments: number;
    volumeUsd: string;
  };
  facilitators: Array<{
    id: string;
    name: string;
    subdomain: string;
    transactionCount: number;
    volumeUsd: string;
    uniqueWallets: number;
    totalSellers: number;
    totalLinks: number;
  }>;
} {
  const db = getDatabase();

  // Total settled transactions all time
  const totalAllTime = db
    .prepare(
      "SELECT COUNT(*) as count FROM transactions WHERE type = 'settle' AND status = 'success'"
    )
    .get() as { count: number };

  // Total settled transactions 24h
  const total24h = db
    .prepare(
      "SELECT COUNT(*) as count FROM transactions WHERE type = 'settle' AND status = 'success' AND created_at > datetime('now', '-24 hours')"
    )
    .get() as { count: number };

  // Volume all time (sum of settled amounts in atomic units)
  const volumeAllTime = db
    .prepare(
      "SELECT COALESCE(SUM(CAST(amount AS INTEGER)), 0) as total FROM transactions WHERE type = 'settle' AND status = 'success'"
    )
    .get() as { total: number };

  // Volume 24h
  const volume24h = db
    .prepare(
      "SELECT COALESCE(SUM(CAST(amount AS INTEGER)), 0) as total FROM transactions WHERE type = 'settle' AND status = 'success' AND created_at > datetime('now', '-24 hours')"
    )
    .get() as { total: number };

  // Unique wallets (distinct payers)
  const uniqueWallets = db
    .prepare(
      "SELECT COUNT(DISTINCT from_address) as count FROM transactions WHERE type = 'settle' AND status = 'success'"
    )
    .get() as { count: number };

  // Payment links stats (sellers = unique pay_to_address)
  const paymentLinksStats = db
    .prepare(
      `
      SELECT
        COUNT(DISTINCT pl.pay_to_address) as total_sellers,
        COUNT(DISTINCT pl.id) as total_links,
        COUNT(plp.id) as total_payments,
        COALESCE(SUM(CASE WHEN plp.status = 'success' THEN CAST(plp.amount AS INTEGER) ELSE 0 END), 0) as volume_atomic
      FROM products pl
      LEFT JOIN product_payments plp ON pl.id = plp.product_id
    `
    )
    .get() as {
    total_sellers: number;
    total_links: number;
    total_payments: number;
    volume_atomic: number;
  };

  // Per-facilitator breakdown (includes seller count from payment_links)
  const perFacilitator = db
    .prepare(
      `
    SELECT
      f.id,
      f.name,
      f.subdomain,
      COUNT(t.id) as transaction_count,
      COALESCE(SUM(CAST(t.amount AS INTEGER)), 0) as volume_atomic,
      COUNT(DISTINCT t.from_address) as unique_wallets,
      (SELECT COUNT(DISTINCT pay_to_address) FROM products WHERE facilitator_id = f.id) as total_sellers,
      (SELECT COUNT(*) FROM products WHERE facilitator_id = f.id) as total_links
    FROM facilitators f
    LEFT JOIN transactions t ON f.id = t.facilitator_id
      AND t.type = 'settle'
      AND t.status = 'success'
    GROUP BY f.id, f.name, f.subdomain
    ORDER BY volume_atomic DESC
  `
    )
    .all() as Array<{
    id: string;
    name: string;
    subdomain: string;
    transaction_count: number;
    volume_atomic: number;
    unique_wallets: number;
    total_sellers: number;
    total_links: number;
  }>;

  return {
    global: {
      totalTransactionsAllTime: totalAllTime.count,
      totalTransactions24h: total24h.count,
      volumeUsdAllTime: (volumeAllTime.total / 1_000_000).toFixed(2),
      volumeUsd24h: (volume24h.total / 1_000_000).toFixed(2),
      uniqueWallets: uniqueWallets.count,
    },
    paymentLinks: {
      totalSellers: paymentLinksStats.total_sellers,
      totalLinks: paymentLinksStats.total_links,
      totalPayments: paymentLinksStats.total_payments,
      volumeUsd: (paymentLinksStats.volume_atomic / 1_000_000).toFixed(2),
    },
    facilitators: perFacilitator.map((f) => ({
      id: f.id,
      name: f.name,
      subdomain: f.subdomain,
      transactionCount: f.transaction_count,
      volumeUsd: (f.volume_atomic / 1_000_000).toFixed(2),
      uniqueWallets: f.unique_wallets,
      totalSellers: f.total_sellers,
      totalLinks: f.total_links,
    })),
  };
}
