'use client';

import { Shield, Globe } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { getFeatureCards, type FeatureCardConfig } from './featureCards';

const iconMap = {
  shield: <Shield className="w-5 h-5" />,
  globe: <Globe className="w-5 h-5" />,
};

interface FeaturesSpotlightProps {
  hasFacilitators: boolean;
  firstFacilitatorId?: string;
  onCreateFacilitator: () => void;
}

export function FeaturesSpotlight({
  hasFacilitators,
  firstFacilitatorId,
  onCreateFacilitator,
}: FeaturesSpotlightProps) {
  const cards = getFeatureCards({
    hasFacilitators,
    firstFacilitatorId,
  });

  const handleCardAction = (card: FeatureCardConfig) => {
    if (card.onClick === 'createFacilitator') {
      onCreateFacilitator();
    }
  };

  return (
    <div className="my-8">
      <div className="flex flex-col md:flex-row gap-4">
        {cards.map((card) => (
          <FeatureCard
            key={card.id}
            icon={iconMap[card.icon]}
            headline={card.headline}
            description={card.description}
            ctaText={card.ctaText}
            ctaHref={card.ctaHref}
            onClick={card.onClick ? () => handleCardAction(card) : undefined}
            badge={card.badge}
          />
        ))}
      </div>
    </div>
  );
}
