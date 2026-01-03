'use client';

import { ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Facilitator } from '@/lib/api';

interface FacilitatorCardProps {
  facilitator: Facilitator;
  stats?: {
    networksConfigured: number;
    totalSettled: number;
  };
  onManageClick?: () => void;
}

function StatusBadge({ status }: { status: 'active' | 'pending' | 'expired' }) {
  const styles = {
    active: 'bg-primary/20 text-primary',
    pending: 'bg-yellow-500/20 text-yellow-500',
    expired: 'bg-red-500/20 text-red-500',
  };

  const dotStyles = {
    active: 'bg-primary',
    pending: 'bg-yellow-500',
    expired: 'bg-red-500',
  };

  const labels = {
    active: 'Active',
    pending: 'Pending DNS',
    expired: 'Expired',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1.5 ${styles[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`} />
      {labels[status]}
    </span>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toFixed(2);
}

export function FacilitatorCard({ facilitator, stats, onManageClick }: FacilitatorCardProps) {
  const domain = facilitator.customDomain || facilitator.subdomain;
  const url = facilitator.url;

  // Determine status based on facilitator data
  const getStatus = (): 'active' | 'pending' | 'expired' => {
    // For now, check if domain is configured
    if (!facilitator.customDomain) return 'pending';
    return 'active';
  };

  const status = getStatus();
  const networksConfigured = stats?.networksConfigured ?? facilitator.supportedChains.length;
  const totalSettled = stats?.totalSettled ?? 0;

  const handleCardClick = () => {
    onManageClick?.();
  };

  const handleExternalLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when clicking external link
  };

  return (
    <div 
      onClick={handleCardClick}
      className="
        border border-border rounded-lg p-5 bg-card
        flex flex-col h-full
        cursor-pointer
        transition-all duration-150
        hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02]
        active:scale-[0.98]
      "
    >
      {/* Content - grows to fill space */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{domain}</h3>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalLinkClick}
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 truncate"
            >
              {url}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{networksConfigured} chain{networksConfigured !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span>${formatNumber(totalSettled)} settled</span>
        </div>
      </div>

      {/* Footer - pinned to bottom */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Created {formatDate(facilitator.createdAt)}
        </span>
        <span className="text-xs font-medium text-primary">
          Manage →
        </span>
      </div>
    </div>
  );
}
