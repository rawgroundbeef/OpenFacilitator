'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { EnrollmentModal } from '@/components/rewards/enrollment-modal';
import { AddressList } from '@/components/rewards/address-list';
import { api, type RewardsStatus } from '@/lib/api';
import { ChevronDown, ChevronUp, Wallet } from 'lucide-react';

export function RewardsInfoBanner() {
  const { isAuthenticated, isEnrolled, isFacilitatorOwner, refetchRewardsStatus } = useAuth();
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);
  const [addresses, setAddresses] = useState<RewardsStatus['addresses']>([]);
  const [expanded, setExpanded] = useState(false);

  // Fetch addresses when component mounts or enrollment changes
  useEffect(() => {
    if (isAuthenticated) {
      api.getRewardsStatus().then((status) => {
        setAddresses(status.addresses);
      }).catch(console.error);
    }
  }, [isAuthenticated, isEnrolled]);

  const handleAddressRemoved = async () => {
    // Refetch addresses after removal
    const status = await api.getRewardsStatus();
    setAddresses(status.addresses);
    await refetchRewardsStatus();
  };

  const handleEnrollmentClose = async (open: boolean) => {
    setEnrollmentOpen(open);
    if (!open) {
      // Refetch when modal closes (in case address was added)
      const status = await api.getRewardsStatus();
      setAddresses(status.addresses);
    }
  };

  // Don't show if not authenticated
  if (!isAuthenticated) return null;

  // If enrolled, show address management section
  if (isEnrolled) {
    return (
      <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-primary">Rewards Program</h3>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded">
              Enrolled
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            <span className="ml-1">{addresses.length} address{addresses.length !== 1 ? 'es' : ''}</span>
          </Button>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-primary/10">
            <AddressList
              addresses={addresses}
              onAddAddress={() => setEnrollmentOpen(true)}
              onAddressRemoved={handleAddressRemoved}
            />
          </div>
        )}

        <EnrollmentModal
          open={enrollmentOpen}
          onOpenChange={handleEnrollmentClose}
        />
      </div>
    );
  }

  // Not enrolled - show enrollment CTA
  return (
    <div className="mb-6 p-4 rounded-lg border border-primary/20 bg-primary/5">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-primary">Earn $OPEN Rewards</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isFacilitatorOwner
              ? "Your facilitator volume qualifies for rewards! Register your pay-to address to start tracking."
              : "Track payment volume and earn $OPEN tokens. Connect your pay-to wallet to get started."}
          </p>
        </div>
        <Button onClick={() => setEnrollmentOpen(true)}>
          Get Started
        </Button>
      </div>

      <EnrollmentModal
        open={enrollmentOpen}
        onOpenChange={handleEnrollmentClose}
      />
    </div>
  );
}
