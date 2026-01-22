'use client';

import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDate } from '@/lib/utils';
import type { SubscriptionPayment } from '@/lib/api';

function truncateTxHash(hash: string): string {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
}

function getExplorerUrl(txHash: string, chain: string): string {
  // Currently only Solana supported - Phase 18 adds Base
  if (chain === 'base') {
    return `https://basescan.org/tx/${txHash}`;
  }
  return `https://solscan.io/tx/${txHash}`;
}

interface PaymentHistoryProps {
  payments: SubscriptionPayment[];
  isLoading?: boolean;
}

export function PaymentHistory({ payments, isLoading }: PaymentHistoryProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No payment history yet.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Chain</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Transaction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4">
                      {formatDate(payment.date)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      ${payment.amount}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      {payment.chain}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {payment.txHash ? (
                        <a
                          href={getExplorerUrl(payment.txHash, payment.chain)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <code className="font-mono text-xs">
                            {truncateTxHash(payment.txHash)}
                          </code>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
