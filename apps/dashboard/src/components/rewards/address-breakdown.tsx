'use client';

import Link from 'next/link';
import { Building2, Wallet, Plus, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AddressBreakdownProps {
  addresses: Array<{
    id: string;
    address: string;
    chain_type: 'solana' | 'evm' | 'facilitator';
    volume: string;
    uniquePayers: number;
  }>;
  totalVolume: string;
}

function ChainBadge({ chainType }: { chainType: 'solana' | 'evm' | 'facilitator' }) {
  if (chainType === 'solana') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-bold">
        S
      </span>
    );
  }
  if (chainType === 'facilitator') {
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold">
        F
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-bold">
      E
    </span>
  );
}

function formatUSDC(amount: string): string {
  const value = Number(amount) / 1_000_000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function FacilitatorsCard({
  facilitators,
  totalVolumeNum,
}: {
  facilitators: AddressBreakdownProps['addresses'];
  totalVolumeNum: number;
}) {
  const hasVolume = facilitators.some((f) => Number(f.volume) > 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            My Facilitators
          </CardTitle>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
            <Sparkles className="h-3 w-3" />
            2x rewards
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {facilitators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Create your own facilitator to earn 2x rewards on all volume processed.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/facilitators/new">
                <Plus className="h-4 w-4 mr-1" />
                Create Facilitator
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {facilitators.map((addr) => {
              const volumeNum = Number(addr.volume);
              const percentage = totalVolumeNum > 0 ? (volumeNum / totalVolumeNum) * 100 : 0;

              return (
                <div
                  key={addr.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <ChainBadge chainType="facilitator" />
                    <span className="text-sm">Facilitator Volume</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{formatUSDC(addr.volume)}</span>
                    <span className="text-muted-foreground w-14 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
            {!hasVolume && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No volume yet. Send transactions through your facilitator to start earning.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PayToAddressesCard({
  addresses,
  totalVolumeNum,
}: {
  addresses: AddressBreakdownProps['addresses'];
  totalVolumeNum: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Pay-to Addresses
        </CardTitle>
      </CardHeader>
      <CardContent>
        {addresses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-3 rounded-full bg-muted/50 mb-3">
              <Wallet className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Register wallet addresses that receive payments through the free facilitator.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/refunds/setup">
                <Plus className="h-4 w-4 mr-1" />
                Register Address
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => {
              const volumeNum = Number(addr.volume);
              const percentage = totalVolumeNum > 0 ? (volumeNum / totalVolumeNum) * 100 : 0;

              return (
                <div
                  key={addr.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <ChainBadge chainType={addr.chain_type} />
                    <span className="font-mono text-sm">{truncateAddress(addr.address)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{formatUSDC(addr.volume)}</span>
                    <span className="text-muted-foreground w-14 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AddressBreakdown({ addresses, totalVolume }: AddressBreakdownProps) {
  const totalVolumeNum = Number(totalVolume);

  // Split addresses by type
  const facilitators = addresses.filter((a) => a.chain_type === 'facilitator');
  const payToAddresses = addresses.filter((a) => a.chain_type !== 'facilitator');

  return (
    <div className="space-y-4">
      <FacilitatorsCard facilitators={facilitators} totalVolumeNum={totalVolumeNum} />
      <PayToAddressesCard addresses={payToAddresses} totalVolumeNum={totalVolumeNum} />
    </div>
  );
}
