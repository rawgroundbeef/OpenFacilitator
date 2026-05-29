'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Check,
  Clock3,
  Copy,
  ExternalLink,
  Github,
  Globe2,
  HeartHandshake,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  YAxis,
} from 'recharts';
import { Navbar } from '@/components/navbar';

const PUBLIC_ENDPOINT = 'https://pay.openfacilitator.io';
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.openfacilitator.io';
const STATS_CACHE_KEY = 'openfacilitator:public-stats:v2';
const STATS_REFRESH_MS = 60 * 60 * 1000;

type StatsRange = '24h' | '30d' | 'all';

interface PublicStatsSeriesPoint {
  date: string;
  bucket?: string;
  label?: string;
  allSettlements: number;
  solanaSettlements: number;
  allVolumeUsd: string;
  solanaVolumeUsd: string;
}

interface PublicStatsRangePayload {
  label: string;
  bucket: 'hour' | 'day' | 'month';
  summary: {
    payments: number;
    verifications: number;
    volumeUsd: string;
    uniqueWallets: number;
  };
  series: PublicStatsSeriesPoint[];
}

interface PublicStatsResponse {
  success: boolean;
  generatedAt: string;
  facilitator: {
    name: string;
    endpoint: string;
    canonicalApi: string;
  };
  usage: {
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
    series: PublicStatsSeriesPoint[];
    ranges?: Record<StatsRange, PublicStatsRangePayload>;
  };
  performance: {
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
  };
}

function createFallbackSeries(count: number, range: StatsRange): PublicStatsSeriesPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(2026, 4, 26));

    if (range === '24h') {
      date.setUTCHours(date.getUTCHours() - (count - 1 - index), 0, 0, 0);
      const bucket = date.toISOString();

      return {
        date: bucket,
        bucket,
        label: bucket,
        allSettlements: 0,
        solanaSettlements: 0,
        allVolumeUsd: '0.00',
        solanaVolumeUsd: '0.00',
      };
    }

    date.setUTCDate(date.getUTCDate() - (count - 1 - index));
    const bucket = date.toISOString().slice(0, 10);

    return {
      date: bucket,
      bucket,
      label: bucket,
      allSettlements: 0,
      solanaSettlements: 0,
      allVolumeUsd: '0.00',
      solanaVolumeUsd: '0.00',
    };
  });
}

const fallbackThirtyDaySeries = createFallbackSeries(30, '30d');

const fallbackStats: PublicStatsResponse = {
  success: true,
  generatedAt: '1970-01-01T00:00:00.000Z',
  facilitator: {
    name: 'OpenFacilitator',
    endpoint: PUBLIC_ENDPOINT,
    canonicalApi: PUBLIC_ENDPOINT,
  },
  usage: {
    totals: {
      settlementsAllTime: 0,
      settlements24h: 0,
      verifications24h: 0,
      volumeUsdAllTime: '0.00',
      volumeUsd24h: '0.00',
      uniqueWallets: 0,
      successRate24h: 100,
    },
    byNetwork: [
      { network: 'Solana', settlements: 0, verifications: 0, volumeUsd: '0.00', successRate: 100 },
      { network: 'Base', settlements: 0, verifications: 0, volumeUsd: '0.00', successRate: 100 },
      { network: 'Stacks', settlements: 0, verifications: 0, volumeUsd: '0.00', successRate: 100 },
    ],
    series: fallbackThirtyDaySeries,
    ranges: {
      '24h': {
        label: 'Last 24h',
        bucket: 'hour',
        summary: { payments: 0, verifications: 0, volumeUsd: '0.00', uniqueWallets: 0 },
        series: createFallbackSeries(24, '24h'),
      },
      '30d': {
        label: 'Last 30d',
        bucket: 'day',
        summary: { payments: 0, verifications: 0, volumeUsd: '0.00', uniqueWallets: 0 },
        series: fallbackThirtyDaySeries,
      },
      all: {
        label: 'All time',
        bucket: 'month',
        summary: { payments: 0, verifications: 0, volumeUsd: '0.00', uniqueWallets: 0 },
        series: fallbackThirtyDaySeries,
      },
    },
  },
  performance: {
    window: 'rolling 1h',
    requestsObserved: 0,
    responseTimeMs: { median: null, p95: null },
    successRate: null,
    solanaSettleMs: { median: null, p95: null },
  },
};

type NetworkLogoProps = {
  className?: string;
};

function SolanaLogo({ className }: NetworkLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="solana-logo-gradient" x1="3.60382" x2="18.154" y1="20.3813" y2="2.96106" gradientUnits="userSpaceOnUse">
          <stop offset="0.08" stopColor="#9945FF" />
          <stop offset="0.3" stopColor="#8752F3" />
          <stop offset="0.5" stopColor="#5497D5" />
          <stop offset="0.6" stopColor="#43B4CA" />
          <stop offset="0.72" stopColor="#28E0B9" />
          <stop offset="0.97" stopColor="#19FB9B" />
        </linearGradient>
      </defs>
      <path
        fill="url(#solana-logo-gradient)"
        d="M20.9022 16.6149L17.7656 19.7821C17.6975 19.8509 17.615 19.9057 17.5233 19.9432C17.4316 19.9807 17.3327 20.0001 17.2328 20H2.36413C2.29318 20 2.22378 19.9805 2.16445 19.9439C2.10513 19.9072 2.05846 19.8551 2.03018 19.7938C2.0019 19.7325 1.99324 19.6648 2.00527 19.599C2.01731 19.5332 2.0495 19.4721 2.0979 19.4232L5.23679 16.256C5.3048 16.1874 5.38702 16.1326 5.47839 16.0952C5.56978 16.0577 5.66835 16.0383 5.76804 16.0381H20.6359C20.7068 16.0381 20.7762 16.0576 20.8356 16.0942C20.8948 16.1309 20.9415 16.183 20.9699 16.2443C20.9981 16.3056 21.0068 16.3733 20.9947 16.4391C20.9827 16.5049 20.9505 16.566 20.9022 16.6149ZM17.7656 10.2369C17.6975 10.1681 17.615 10.1133 17.5233 10.0758C17.4316 10.0383 17.3327 10.019 17.2328 10.0191H2.36413C2.29318 10.0191 2.22378 10.0386 2.16445 10.0752C2.10513 10.1118 2.05846 10.164 2.03018 10.2252C2.0019 10.2865 1.99324 10.3542 2.00527 10.4201C2.01731 10.4859 2.0495 10.547 2.0979 10.5958L5.23679 13.7631C5.3048 13.8317 5.38702 13.8864 5.47839 13.9239C5.56978 13.9614 5.66835 13.9808 5.76804 13.9809H20.6359C20.7068 13.9809 20.7762 13.9614 20.8356 13.9248C20.8948 13.8882 20.9415 13.836 20.9699 13.7748C20.9981 13.7135 21.0068 13.6458 20.9947 13.5799C20.9827 13.5141 20.9505 13.453 20.9022 13.4042L17.7656 10.2369ZM2.36413 7.96191H17.2328C17.3327 7.96195 17.4316 7.94264 17.5233 7.90515C17.615 7.86765 17.6975 7.8128 17.7656 7.744L20.9022 4.57676C20.9505 4.52792 20.9827 4.46683 20.9947 4.401C21.0068 4.33517 20.9981 4.26746 20.9699 4.2062C20.9415 4.14493 20.8948 4.09278 20.8356 4.05615C20.7762 4.01952 20.7068 4 20.6359 4H5.76804C5.66835 4.00016 5.56978 4.01958 5.47839 4.05706C5.38702 4.09455 5.3048 4.14929 5.23679 4.21791L2.09871 7.38515C2.05036 7.43393 2.01818 7.49496 2.00612 7.56071C1.99406 7.62647 2.00265 7.69413 2.03082 7.75536C2.059 7.8166 2.10555 7.86875 2.16476 7.90544C2.22396 7.94213 2.29325 7.96175 2.36413 7.96191Z"
      />
    </svg>
  );
}

function BaseLogo({ className }: NetworkLogoProps) {
  return (
    <svg viewBox="0 0 23 23" className={className} aria-hidden="true">
      <path
        fill="#0000FF"
        d="M22.0003 2.659C22.0003 2.09069 22.0003 1.8067 21.8931 1.588C21.7906 1.37866 21.6214 1.20951 21.4121 1.10697C21.1936 1 20.9096 1 20.3413 1H2.65926C2.09112 1 1.80679 1 1.58826 1.10713C1.37908 1.20967 1.20994 1.37882 1.10723 1.58816C1.00026 1.8067 1.00026 2.09085 1.00026 2.65916V20.3412C1.00026 20.9093 1.00026 21.1936 1.10723 21.4122C1.20994 21.6213 1.37908 21.7905 1.58826 21.8932C1.80679 22.0002 2.09112 22.0002 2.65926 22.0002H20.3413C20.9096 22.0002 21.1936 22.0002 21.4123 21.8932C21.6216 21.7905 21.7908 21.6213 21.8933 21.4122C22.0004 21.1936 22.0004 20.9093 22.0004 20.3412V2.659H22.0003Z"
      />
    </svg>
  );
}

function StacksLogo({ className }: NetworkLogoProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#FC6432"
        d="M22.9981 12.0275C22.9981 5.97458 18.0912 1.06769 12.0383 1.06769C5.98532 1.06769 1.07843 5.97458 1.07843 12.0275C1.07843 18.0805 5.98532 22.9874 12.0383 22.9874C18.0912 22.9874 22.9981 18.0805 22.9981 12.0275Z"
      />
      <path
        fill="#fff"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.9032 10.2063C13.8632 10.1375 13.8689 10.0514 13.9147 9.98258L15.8283 7.14319C15.8799 7.06289 15.8856 6.96538 15.8398 6.88507C15.7939 6.79903 15.708 6.75314 15.6163 6.75314H14.8716C14.7913 6.75314 14.7111 6.79329 14.6595 6.86787L12.4251 10.1949C12.3677 10.2809 12.276 10.3268 12.1729 10.3268H11.8922C11.7891 10.3268 11.6974 10.2752 11.6401 10.1949L9.41708 6.86212C9.37123 6.78756 9.28524 6.7474 9.20502 6.7474H8.46021C8.36854 6.7474 8.27686 6.79903 8.23676 6.88507C8.19092 6.97111 8.20239 7.06863 8.24822 7.14319L10.1619 9.98836C10.2077 10.0514 10.2134 10.1375 10.1733 10.2063C10.1332 10.2809 10.0645 10.321 9.98426 10.321H7.05648C6.91324 10.321 6.80438 10.4358 6.80438 10.5735V11.1929C6.80438 11.3363 6.91898 11.4453 7.05648 11.4453H17.0201C17.1633 11.4453 17.2722 11.3306 17.2722 11.1929V10.5735C17.2722 10.4415 17.1748 10.3383 17.0487 10.321C17.0373 10.321 17.0258 10.321 17.0144 10.321H14.0923C14.0121 10.321 13.9376 10.2809 13.9032 10.2063ZM11.6458 13.8602L9.41129 17.1872C9.36545 17.2618 9.27954 17.3019 9.19932 17.3019H8.45448C8.36281 17.3019 8.27687 17.2503 8.23103 17.17C8.1852 17.0897 8.19092 16.9865 8.24249 16.9119L10.1504 14.0725C10.1962 14.0037 10.202 13.9233 10.1619 13.8488C10.1218 13.7799 10.053 13.7341 9.97278 13.7341H7.05648C6.91898 13.7341 6.80438 13.625 6.80438 13.4816V12.8622C6.80438 12.7245 6.91324 12.6097 7.05648 12.6097H16.9972C16.9972 12.6097 17.0144 12.6097 17.0201 12.6097C17.1576 12.6097 17.2722 12.7188 17.2722 12.8622V13.4816C17.2722 13.6193 17.1633 13.7341 17.0201 13.7341H14.098C14.0121 13.7341 13.9434 13.7742 13.9089 13.8488C13.8689 13.9233 13.8746 14.0037 13.9204 14.0667L15.8341 16.9119C15.8799 16.9865 15.8913 17.0839 15.8456 17.17C15.7997 17.2561 15.7137 17.3077 15.6221 17.3077H14.8773C14.7913 17.3077 14.7168 17.2676 14.671 17.1987L12.4365 13.8717C12.3792 13.7857 12.2875 13.7398 12.1844 13.7398H11.9036C11.8005 13.7398 11.7088 13.7914 11.6515 13.8717L11.6458 13.8602Z"
      />
    </svg>
  );
}

const networkRows = [
  {
    name: 'Base',
    Logo: BaseLogo,
  },
  {
    name: 'Solana',
    Logo: SolanaLogo,
  },
  {
    name: 'Stacks',
    Logo: StacksLogo,
  },
];

function NetworkIconStrip() {
  return (
    <div className="mt-7 flex items-center justify-center gap-6" aria-label="Supported networks">
      {networkRows.map(({ name, Logo }) => (
        <div key={name} className="flex h-12 w-12 items-center justify-center" title={name}>
          <Logo className={name === 'Solana' ? 'h-14 w-14' : 'h-10 w-10'} />
          <span className="sr-only">{name}</span>
        </div>
      ))}
    </div>
  );
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

function formatUsd(value: string): string {
  return `$${Number(value || '0').toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatMs(value: number | null): string {
  if (value === null) return '...';
  return `${formatNumber(value)}ms`;
}

function formatBucketLabel(bucket: string, range: StatsRange): string {
  if (range === 'all' && /^\d{4}-\d{2}$/.test(bucket)) {
    return new Date(`${bucket}-01T00:00:00.000Z`).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }

  const date = new Date(bucket.includes('T') ? bucket : `${bucket}T00:00:00.000Z`);

  if (range === '24h') {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      timeZone: 'UTC',
    });
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function CopyButton({ text, label = 'Copy endpoint' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-100 p-4 shadow-sm dark:bg-card dark:shadow-none">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-4 text-4xl font-bold leading-none tracking-tight text-foreground">{value}</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary dark:bg-primary/15">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

const statsRanges: Array<{ value: StatsRange; label: string }> = [
  { value: '24h', label: '24h' },
  { value: '30d', label: '30d' },
  { value: 'all', label: 'All time' },
];

type CodeTab = 'express' | 'hono' | 'manual' | 'skill';

const codeTabs: Array<{ value: CodeTab; label: string }> = [
  { value: 'express', label: 'Express' },
  { value: 'hono', label: 'Hono' },
  { value: 'manual', label: 'Manual' },
  { value: 'skill', label: 'Skill' },
];

function SegmentedControl<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  variant = 'default',
}: {
  items: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  variant?: 'default' | 'stats';
}) {
  const isStats = variant === 'stats';

  return (
    <div
      className={`inline-grid gap-1 rounded-lg p-1 shadow-sm ${
        isStats
          ? 'bg-primary/5 shadow-primary/5 dark:bg-background/80 dark:shadow-none'
          : 'bg-background/80'
      }`}
      style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`h-9 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ${
            value === item.value
              ? isStats
                ? 'bg-primary/10 text-foreground shadow-sm dark:bg-muted'
                : 'bg-muted text-foreground shadow-sm'
              : isStats
                ? 'text-muted-foreground hover:bg-primary/5 hover:text-foreground dark:hover:bg-muted/50'
                : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

function StatsSection({ stats }: { stats: PublicStatsResponse }) {
  const [mounted, setMounted] = useState(false);
  const [range, setRange] = useState<StatsRange>('30d');
  const selectedRange = stats.usage.ranges?.[range];
  const selectedSeries = selectedRange?.series ?? stats.usage.series;
  const chartData = useMemo(
    () =>
      selectedSeries.map((point) => {
        const payments = point.allSettlements;
        const bucket = point.bucket ?? point.date;

        return {
          ...point,
          dateLabel: point.label ? formatBucketLabel(point.label, range) : formatBucketLabel(bucket, range),
          payments,
        };
      }),
    [selectedSeries, range]
  );
  const hasSettlementData = chartData.some((point) => point.payments > 0);
  const sparklineData = chartData.map((point) => ({
    ...point,
    sparklinePayments: hasSettlementData ? point.payments : 0.5,
  }));
  const thirtyDayPayments = chartData.reduce((sum, point) => sum + point.payments, 0);
  const thirtyDayVolume = selectedSeries.reduce((sum, point) => sum + Number(point.allVolumeUsd), 0);
  const selectedSummary = selectedRange?.summary;
  const selectedStats = {
    '24h': {
      payments: selectedSummary?.payments ?? stats.usage.totals.settlements24h,
      volume: selectedSummary?.volumeUsd ?? stats.usage.totals.volumeUsd24h,
    },
    '30d': {
      payments: selectedSummary?.payments ?? thirtyDayPayments,
      volume: selectedSummary?.volumeUsd ?? thirtyDayVolume.toFixed(2),
    },
    all: {
      payments: selectedSummary?.payments ?? stats.usage.totals.settlementsAllTime,
      volume: selectedSummary?.volumeUsd ?? stats.usage.totals.volumeUsdAllTime,
    },
  }[range];

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="stats" className="scroll-mt-20 bg-background pb-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="h-[22rem] overflow-hidden rounded-lg bg-zinc-100 shadow-sm dark:bg-card dark:shadow-none">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={sparklineData} margin={{ top: 18, right: 10, left: 10, bottom: 10 }}>
                <defs>
                  <linearGradient id="paymentsSparkline" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={[0, (dataMax: number) => Math.max(dataMax, 1)]} />
                <Tooltip
                  cursor={{ stroke: 'hsl(var(--primary))', strokeOpacity: 0.2 }}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.12)',
                  }}
                  formatter={(value) => [
                    hasSettlementData ? formatNumber(Number(value)) : '0',
                    'Payments',
                  ]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.dateLabel ?? ''}
                />
                <Area
                  type="monotone"
                  dataKey="sparklinePayments"
                  name="Payments"
                  stroke="hsl(var(--primary))"
                  fill="url(#paymentsSparkline)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))', stroke: 'white', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Metric
            icon={Activity}
            label="Payments"
            value={formatNumber(selectedStats.payments)}
          />
          <Metric
            icon={Globe2}
            label="USDC processed"
            value={formatUsd(selectedStats.volume)}
          />
          <Metric
            icon={Clock3}
            label="Response time"
            value={formatMs(stats.performance.responseTimeMs.p95)}
          />
        </div>

        <div className="mt-4 flex justify-center">
          <SegmentedControl
            items={statsRanges}
            value={range}
            onChange={setRange}
            ariaLabel="Stats range"
            variant="stats"
          />
        </div>
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className="pb-6 pt-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="mx-auto max-w-5xl text-balance text-center text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Start Accepting x402 Payments Today
        </h1>
        <p className="mx-auto mt-6 max-w-4xl text-center text-lg leading-8 text-muted-foreground">
          <span className="block">OpenFacilitator is a free, fast, open source x402 payment facilitator.</span>
          <span className="block">Use pay.openfacilitator.io now. No signup, no account, no rate limits.</span>
        </p>

        <NetworkIconStrip />

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row sm:flex-wrap">
          <Link
            href="/docs/quickstart"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            Quickstart
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="https://github.com/rawgroundbeef/openfacilitator"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-secondary"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>

      </div>
    </section>
  );
}

function AddX402Section() {
  const [codeTab, setCodeTab] = useState<CodeTab>('express');

  return (
    <section id="integration" className="bg-background pb-16 pt-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center gap-4 rounded-xl bg-zinc-100 p-4 shadow-sm dark:bg-card dark:shadow-none">
            <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap font-mono text-sm text-foreground sm:text-lg">
              {PUBLIC_ENDPOINT}
            </span>
            <CopyButton text={PUBLIC_ENDPOINT} label="Copy URL" />
          </div>

          <div className="mt-6 overflow-hidden rounded-xl bg-zinc-100 shadow-sm dark:bg-card dark:shadow-none">
            <div className="flex flex-col gap-3 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[#27ca40]" />
                </div>
                <span className="ml-2 text-xs text-[#8b949e]">
                  {codeTab === 'skill' ? 'skill' : codeTab === 'manual' ? 'example.ts' : 'server.ts'}
                </span>
              </div>
              <SegmentedControl
                items={codeTabs}
                value={codeTab}
                onChange={setCodeTab}
                ariaLabel="Code example"
              />
            </div>

            {codeTab === 'skill' && (
              <pre className="overflow-x-auto border-0 bg-[#0d1117] p-4 font-mono text-sm leading-relaxed">
                <code className="text-[#c9d1d9]">
                  <span className="text-[#8b949e]"># Install the OpenFacilitator skill</span>
                  {'\n'}
                  <span className="text-[#d4a574]">$</span> npx <span className="text-[#ffa657]">skills</span> add rawgroundbeef/openfacilitator
                  {'\n\n'}
                  <span className="text-[#8b949e]"># Then ask your coding assistant:</span>
                  {'\n'}
                  <span className="text-[#a5d6ff]">&quot;Add x402 USDC payments to my Hono server&quot;</span>
                </code>
              </pre>
            )}

            {codeTab !== 'skill' && (
              <pre className="overflow-x-auto border-0 bg-[#0d1117] p-4 font-mono text-sm leading-relaxed">
                {codeTab === 'hono' && (
                  <code className="text-[#c9d1d9]">
                    <span className="text-[#ff7b72]">import</span>{' '}
                    {'{ '}
                    <span className="text-[#ffa657]">honoPaymentMiddleware</span>
                    {' } '}
                    <span className="text-[#ff7b72]">from</span>
                    <span className="text-[#a5d6ff]"> &apos;@openfacilitator/sdk&apos;</span>;
                    {'\n\n'}
                    app.<span className="text-[#d2a8ff]">post</span>(
                    <span className="text-[#a5d6ff]">&apos;/api/resource&apos;</span>,{' '}
                    <span className="text-[#d2a8ff]">honoPaymentMiddleware</span>({'{'}
                    {'\n'}  <span className="text-[#d2a8ff]">getRequirements</span>: () =&gt; ({'{'}
                    {'\n'}    scheme: <span className="text-[#a5d6ff]">&apos;exact&apos;</span>,
                    {'\n'}    network: <span className="text-[#a5d6ff]">&apos;base&apos;</span>,
                    {'\n'}    maxAmountRequired: <span className="text-[#a5d6ff]">&apos;1000000&apos;</span>,
                    {'\n'}    asset: <span className="text-[#a5d6ff]">&apos;0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&apos;</span>,
                    {'\n'}    payTo: <span className="text-[#a5d6ff]">&apos;0xYourAddress&apos;</span>,
                    {'\n'}  {'}'}),
                    {'\n'}
                    {'}'}), <span className="text-[#ff7b72]">async</span> (c) =&gt; {'{'}
                    {'\n'}  <span className="text-[#8b949e]">// Payment verified &amp; settled automatically</span>
                    {'\n'}  <span className="text-[#ff7b72]">return</span> c.<span className="text-[#d2a8ff]">json</span>({'{'} success: <span className="text-[#79c0ff]">true</span> {'}'});
                    {'\n'}
                    {'}'});
                  </code>
                )}
                {codeTab === 'express' && (
                  <code className="text-[#c9d1d9]">
                    <span className="text-[#ff7b72]">import</span>{' '}
                    {'{ '}
                    <span className="text-[#ffa657]">createPaymentMiddleware</span>
                    {' } '}
                    <span className="text-[#ff7b72]">from</span>
                    <span className="text-[#a5d6ff]"> &apos;@openfacilitator/sdk&apos;</span>;
                    {'\n\n'}
                    <span className="text-[#ff7b72]">const</span> paymentMiddleware ={' '}
                    <span className="text-[#d2a8ff]">createPaymentMiddleware</span>({'{'}
                    {'\n'}  <span className="text-[#d2a8ff]">getRequirements</span>: () =&gt; ({'{'}
                    {'\n'}    scheme: <span className="text-[#a5d6ff]">&apos;exact&apos;</span>,
                    {'\n'}    network: <span className="text-[#a5d6ff]">&apos;base&apos;</span>,
                    {'\n'}    maxAmountRequired: <span className="text-[#a5d6ff]">&apos;1000000&apos;</span>,
                    {'\n'}    asset: <span className="text-[#a5d6ff]">&apos;0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913&apos;</span>,
                    {'\n'}    payTo: <span className="text-[#a5d6ff]">&apos;0xYourAddress&apos;</span>,
                    {'\n'}  {'}'}),
                    {'\n'}
                    {'}'});
                    {'\n\n'}
                    app.<span className="text-[#d2a8ff]">post</span>(
                    <span className="text-[#a5d6ff]">&apos;/api/resource&apos;</span>, paymentMiddleware,{' '}
                    <span className="text-[#ff7b72]">async</span> (req, res) =&gt; {'{'}
                    {'\n'}  <span className="text-[#8b949e]">// Payment verified &amp; settled automatically</span>
                    {'\n'}  res.<span className="text-[#d2a8ff]">json</span>({'{'} success: <span className="text-[#79c0ff]">true</span> {'}'});
                    {'\n'}
                    {'}'});
                  </code>
                )}
                {codeTab === 'manual' && (
                  <code className="text-[#c9d1d9]">
                    <span className="text-[#ff7b72]">import</span>{' '}
                    {'{ '}
                    <span className="text-[#ffa657]">OpenFacilitator</span>
                    {' } '}
                    <span className="text-[#ff7b72]">from</span>
                    <span className="text-[#a5d6ff]"> &apos;@openfacilitator/sdk&apos;</span>;
                    {'\n\n'}
                    <span className="text-[#ff7b72]">const</span> facilitator = <span className="text-[#ff7b72]">new</span>{' '}
                    <span className="text-[#ffa657]">OpenFacilitator</span>(
                    <span className="text-[#a5d6ff]">&apos;pay.openfacilitator.io&apos;</span>);
                    {'\n'}
                    <span className="text-[#ff7b72]">const</span> {'{'} isValid {'}'} = <span className="text-[#ff7b72]">await</span> facilitator.
                    <span className="text-[#d2a8ff]">verify</span>(payment, requirements);
                    {'\n'}
                    <span className="text-[#ff7b72]">const</span> {'{'} transaction {'}'} = <span className="text-[#ff7b72]">await</span> facilitator.
                    <span className="text-[#d2a8ff]">settle</span>(payment, requirements);
                  </code>
                )}
              </pre>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}

function MoreContextSection() {
  return (
    <section className="py-16">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">
        <div className="flex flex-col rounded-lg bg-zinc-100 p-6 shadow-sm dark:bg-card dark:shadow-none">
          <Github className="mb-4 h-8 w-8 text-primary" />
          <h3 className="text-xl font-semibold">Open source first</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The platform, SDK, and facilitator code are public. Use the hosted endpoint or fork the repo.
          </p>
          <a
            href="https://github.com/rawgroundbeef/openfacilitator"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-primary hover:underline"
          >
            View source
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="flex flex-col rounded-lg bg-zinc-100 p-6 shadow-sm dark:bg-card dark:shadow-none">
          <HeartHandshake className="mb-4 h-8 w-8 text-primary" />
          <h3 className="text-xl font-semibold">Support OpenFacilitator</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Free infrastructure still costs money. Help keep pay.openfacilitator.io fast, reliable, and free for builders.
          </p>
          <a
            href="https://www.coingecko.com/en/coins/openfacilitator"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-flex items-center gap-2 pt-4 font-mono text-sm font-semibold text-primary hover:underline"
          >
            cpbq...open
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
        <div className="flex flex-col rounded-lg bg-zinc-100 p-6 shadow-sm dark:bg-card dark:shadow-none">
          <Zap className="mb-4 h-8 w-8 text-primary" />
          <h3 className="text-xl font-semibold">Built for speed</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            The endpoint stays lean and observable today. Public stats will guide dedicated workers and chain-specific optimizations as usage grows.
          </p>
          <a
            href="#stats"
            className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold text-primary hover:underline"
          >
            View stats
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="" className="h-6 w-6" />
          <span className="font-semibold text-foreground">OpenFacilitator</span>
          <span>Apache 2.0</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/docs" className="hover:text-foreground">Docs</Link>
          <a href="https://github.com/rawgroundbeef/openfacilitator" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            GitHub
          </a>
          <a href="https://x.com/openfacilitator" target="_blank" rel="noopener noreferrer" className="hover:text-foreground">
            X
          </a>
        </div>
      </div>
    </footer>
  );
}

interface CachedPublicStats {
  cachedAt: number;
  data: PublicStatsResponse;
}

function readCachedPublicStats(): CachedPublicStats | null {
  try {
    const raw = window.localStorage.getItem(STATS_CACHE_KEY);
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedPublicStats;
    if (!cached.cachedAt || !cached.data) return null;

    return cached;
  } catch {
    return null;
  }
}

function writeCachedPublicStats(data: PublicStatsResponse) {
  try {
    window.localStorage.setItem(
      STATS_CACHE_KEY,
      JSON.stringify({
        cachedAt: Date.now(),
        data,
      } satisfies CachedPublicStats)
    );
  } catch {
    // localStorage can be unavailable in privacy-restricted browser contexts.
  }
}

export default function Home() {
  const [stats, setStats] = useState<PublicStatsResponse>(fallbackStats);

  useEffect(() => {
    let cancelled = false;

    const cached = readCachedPublicStats();
    if (cached) {
      setStats(cached.data);
    }

    async function loadStats() {
      try {
        const response = await fetch(`${API_BASE}/public/stats`);
        if (!response.ok) throw new Error(`Stats request failed: ${response.status}`);
        const data = (await response.json()) as PublicStatsResponse;
        if (!cancelled) {
          setStats(data);
          writeCachedPublicStats(data);
        }
      } catch {
        if (!cancelled && !cached) {
          setStats(fallbackStats);
        }
      }
    }

    if (!cached || Date.now() - cached.cachedAt >= STATS_REFRESH_MS) {
      loadStats();
    }
    const interval = window.setInterval(loadStats, STATS_REFRESH_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        <HeroSection />
        <AddX402Section />
        <StatsSection stats={stats} />
        <MoreContextSection />
      </main>
      <Footer />
    </div>
  );
}
