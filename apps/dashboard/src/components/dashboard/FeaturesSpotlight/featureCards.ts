export interface FeatureCardConfig {
  id: string;
  icon: 'shield' | 'globe';
  headline: string;
  description: string;
  ctaText: string;
  ctaHref?: string;
  onClick?: 'createFacilitator';
  badge?: string;
}

interface UserState {
  hasFacilitators: boolean;
  firstFacilitatorId?: string;
}

export function getFeatureCards(userState: UserState): FeatureCardConfig[] {
  const { hasFacilitators, firstFacilitatorId } = userState;

  const refundsCard: FeatureCardConfig = {
    id: 'refunds',
    icon: 'shield',
    headline: 'Refund Protection',
    description: 'Automatically refund customers when your API fails. Build trust and reduce disputes.',
    ctaText: hasFacilitators ? 'Configure →' : 'Get Started →',
    ctaHref: hasFacilitators && firstFacilitatorId
      ? `/dashboard/${firstFacilitatorId}?tab=refunds`
      : '/refunds/setup?facilitator=pay.openfacilitator.io',
  };

  const facilitatorCard: FeatureCardConfig = {
    id: 'facilitator',
    icon: 'globe',
    headline: hasFacilitators ? 'Add Another Facilitator' : 'Run Your Own Facilitator',
    description: 'Accept payments on your own domain with full control. $5/month per facilitator.',
    ctaText: hasFacilitators ? 'Create New →' : 'Create Facilitator →',
    onClick: 'createFacilitator',
  };

  return hasFacilitators
    ? [facilitatorCard, refundsCard]
    : [refundsCard, facilitatorCard];
}
