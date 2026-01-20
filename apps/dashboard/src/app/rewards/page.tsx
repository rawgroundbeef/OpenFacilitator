'use client';

import { useQuery } from '@tanstack/react-query';
import { Loader2, Settings, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProgressDashboard } from '@/components/rewards/progress-dashboard';
import { CampaignHistory } from '@/components/campaigns/campaign-history';
import { api } from '@/lib/api';
import { useAuth } from '@/components/auth/auth-provider';

export default function RewardsPage() {
  const { isAdmin, isFacilitatorOwner, isLoading: authLoading } = useAuth();

  const { data: activeCampaign, isLoading: campaignLoading } = useQuery({
    queryKey: ['activeCampaign'],
    queryFn: () => api.getActiveCampaign(),
  });

  const { data: volumeData, isLoading: volumeLoading } = useQuery({
    queryKey: ['rewardsVolume', activeCampaign?.campaign?.id],
    queryFn: () => api.getRewardsVolume(activeCampaign!.campaign!.id),
    enabled: !!activeCampaign?.campaign?.id,
  });

  const { data: breakdownData } = useQuery({
    queryKey: ['volumeBreakdown', activeCampaign?.campaign?.id],
    queryFn: () => api.getVolumeBreakdown(activeCampaign!.campaign!.id),
    enabled: !!activeCampaign?.campaign?.id,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['campaignHistory'],
    queryFn: () => api.getCampaignHistory(),
  });

  const isLoading = authLoading || campaignLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              Rewards
            </h1>
            <p className="text-muted-foreground mt-2">
              Earn $OPEN tokens by processing volume through OpenFacilitator.
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Campaign */}
            {activeCampaign?.campaign ? (
              <ProgressDashboard
                campaign={activeCampaign.campaign}
                userVolume={volumeLoading ? '0' : (volumeData?.totalVolume ?? '0')}
                totalPoolVolume={activeCampaign.totalVolume}
                isFacilitatorOwner={isFacilitatorOwner}
                volumeBreakdown={breakdownData ?? null}
              />
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Active Campaign</p>
                  <p className="text-sm">
                    There is no rewards campaign running at the moment. Check back later!
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Campaign History */}
            <div>
              <h2 className="text-xl font-semibold mb-4">Campaign History</h2>
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <CampaignHistory history={historyData ?? []} />
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
