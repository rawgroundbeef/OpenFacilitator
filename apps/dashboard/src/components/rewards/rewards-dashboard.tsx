'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Trophy, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ProgressTab } from './progress-tab';
import { AddressesTab } from './addresses-tab';
import { useAuth } from '@/components/auth/auth-provider';

export function RewardsDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin, isFacilitatorOwner } = useAuth();

  // Facilitator owners don't need addresses tab - their volume is tracked automatically
  const showAddressesTab = !isFacilitatorOwner;
  const validTabs = showAddressesTab
    ? ['progress', 'addresses']
    : ['progress'];

  // Read tab from URL or default to 'progress'
  const tabParam = searchParams.get('tab');
  const currentTab = validTabs.includes(tabParam as string)
    ? tabParam!
    : 'progress';

  const handleTabChange = (value: string) => {
    router.push(`/rewards?tab=${value}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            Rewards
          </h1>
          <p className="text-muted-foreground mt-2">
            Earn{' '}
            <a
              href="https://www.coingecko.com/en/coins/openfacilitator"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              $OPEN
            </a>
            {' '}by processing your application's x402 payments with OpenFacilitator.
          </p>
        </div>
        {isAdmin && (
          <Link href="/rewards/admin">
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Manage Campaigns
            </Button>
          </Link>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className={`grid w-full ${showAddressesTab ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          {showAddressesTab && <TabsTrigger value="addresses">Addresses</TabsTrigger>}
        </TabsList>

        <TabsContent value="progress" className="mt-6">
          <ProgressTab />
        </TabsContent>

        {showAddressesTab && (
          <TabsContent value="addresses" className="mt-6">
            <AddressesTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
