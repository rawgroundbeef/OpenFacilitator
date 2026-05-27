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
  const { hasFacilitators } = userState;

  const facilitatorCard: FeatureCardConfig = {
    id: 'facilitator',
    icon: 'globe',
    headline: hasFacilitators ? 'Add Another Facilitator' : 'Run Your Own Facilitator',
    description: 'Accept payments on your own domain with full control. $5/month per facilitator.',
    ctaText: hasFacilitators ? 'Create New →' : 'Create Facilitator →',
    onClick: 'createFacilitator',
  };

  return [facilitatorCard];
}
