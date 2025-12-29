'use client';

import { Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SubscriptionConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tier: 'basic' | 'pro' | null;
  balance: string | null;
  isPurchasing: boolean;
  onConfirm: () => void;
}

const PRICING = {
  basic: 5,
  pro: 25,
} as const;

const BENEFITS = {
  basic: [
    'Your own subdomain (yourname.openfacilitator.io)',
    'Dashboard & analytics',
    'Email support',
  ],
  pro: [
    'Custom domain (pay.yourdomain.com)',
    'Auto SSL certificates',
    'Priority support',
  ],
} as const;

export function SubscriptionConfirmDialog({
  open,
  onOpenChange,
  tier,
  balance,
  isPurchasing,
  onConfirm,
}: SubscriptionConfirmDialogProps) {
  if (!tier) return null;

  const price = PRICING[tier];
  const balanceNum = balance ? parseFloat(balance) : 0;
  const hasInsufficientBalance = balanceNum < price;
  const benefits = BENEFITS[tier];

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Upgrade to {tier === 'basic' ? 'Basic' : 'Pro'}
          </DialogTitle>
        </DialogHeader>

        {/* Benefits */}
        <ul className="space-y-2 py-2">
          {benefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Price and balance - inline */}
        <div className={`text-sm ${hasInsufficientBalance ? 'text-orange-500' : 'text-muted-foreground'}`}>
          ${price}/month · {hasInsufficientBalance ? 'Insufficient balance' : 'Paying from your wallet'} (${balance ?? '0.00'} available)
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPurchasing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={hasInsufficientBalance || isPurchasing}
          >
            {isPurchasing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Upgrade Now'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
