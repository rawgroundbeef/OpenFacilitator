type HttpSample = {
  path: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: number;
};

type OperationSample = {
  operation: 'verify' | 'settle';
  network: string;
  success: boolean;
  durationMs: number;
  timestamp: number;
};

const MAX_SAMPLES = 2_000;
const httpSamples: HttpSample[] = [];
const operationSamples: OperationSample[] = [];

function pushBounded<T>(samples: T[], sample: T): void {
  samples.push(sample);
  if (samples.length > MAX_SAMPLES) {
    samples.splice(0, samples.length - MAX_SAMPLES);
  }
}

function percentile(values: number[], percentileValue: number): number | null {
  if (values.length === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );

  return Math.round(sorted[index]);
}

function recent<T extends { timestamp: number }>(samples: T[], windowMs: number): T[] {
  const cutoff = Date.now() - windowMs;
  return samples.filter((sample) => sample.timestamp >= cutoff);
}

export function observeHttpRequest(sample: Omit<HttpSample, 'timestamp'>): void {
  pushBounded(httpSamples, {
    ...sample,
    timestamp: Date.now(),
  });
}

export function observeFacilitatorOperation(sample: Omit<OperationSample, 'timestamp'>): void {
  pushBounded(operationSamples, {
    ...sample,
    timestamp: Date.now(),
  });
}

export function getPublicOperationalMetrics(): {
  window: string;
  requestsObserved: number;
  responseTimeMs: {
    median: number | null;
    p95: number | null;
  };
  successRate: number | null;
  solanaSettleMs: {
    median: number | null;
    p95: number | null;
  };
  byOperation: Array<{
    operation: 'verify' | 'settle';
    network: string;
    count: number;
    successRate: number;
    medianMs: number | null;
    p95Ms: number | null;
  }>;
} {
  const windowMs = 60 * 60 * 1000;
  const recentHttp = recent(httpSamples, windowMs);
  const recentOps = recent(operationSamples, windowMs);

  const httpDurations = recentHttp.map((sample) => sample.durationMs);
  const successfulHttp = recentHttp.filter((sample) => sample.statusCode < 500).length;
  const solanaSettles = recentOps.filter((sample) =>
    sample.operation === 'settle' &&
    (sample.network === 'solana' || sample.network === 'solana-mainnet' || sample.network.startsWith('solana:'))
  );

  const operationGroups = new Map<string, OperationSample[]>();
  for (const sample of recentOps) {
    const key = `${sample.operation}|${sample.network}`;
    const group = operationGroups.get(key) ?? [];
    group.push(sample);
    operationGroups.set(key, group);
  }

  return {
    window: 'rolling 1h',
    requestsObserved: recentHttp.length,
    responseTimeMs: {
      median: percentile(httpDurations, 50),
      p95: percentile(httpDurations, 95),
    },
    successRate: recentHttp.length === 0
      ? null
      : Math.round((successfulHttp / recentHttp.length) * 1000) / 10,
    solanaSettleMs: {
      median: percentile(solanaSettles.map((sample) => sample.durationMs), 50),
      p95: percentile(solanaSettles.map((sample) => sample.durationMs), 95),
    },
    byOperation: Array.from(operationGroups.entries())
      .map(([key, samples]) => {
        const separatorIndex = key.indexOf('|');
        const operation = key.slice(0, separatorIndex) as 'verify' | 'settle';
        const network = key.slice(separatorIndex + 1);
        const successes = samples.filter((sample) => sample.success).length;
        const durations = samples.map((sample) => sample.durationMs);

        return {
          operation,
          network,
          count: samples.length,
          successRate: Math.round((successes / samples.length) * 1000) / 10,
          medianMs: percentile(durations, 50),
          p95Ms: percentile(durations, 95),
        };
      })
      .sort((a, b) => b.count - a.count),
  };
}
