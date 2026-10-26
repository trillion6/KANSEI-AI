import React from 'react';
import { ThumbsUp, MinusCircle, ThumbsDown } from 'lucide-react';

export default function SentimentBadge({
  sentiment = 'neutral',
  size = 'md',
  showIcon = true,
  className = '',
}) {
  const norm = (sentiment || '').toLowerCase();

  const config = {
    positive: {
      label: 'Positive',
      badgeClass: 'badge-pos',
      Icon: ThumbsUp,
    },
    neutral: {
      label: 'Neutral',
      badgeClass: 'badge-neu',
      Icon: MinusCircle,
    },
    negative: {
      label: 'Negative',
      badgeClass: 'badge-neg',
      Icon: ThumbsDown,
    },
  }[norm] || {
    label: 'Unknown',
    badgeClass: 'badge-neu',
    Icon: MinusCircle,
  };

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  return (
    <span
      className={`badge-sentiment ${config.badgeClass} ${
        size === 'sm' ? 'py-1 px-2 fs-8' : size === 'lg' ? 'py-2 px-3 fs-7' : ''
      } ${className}`.trim()}
    >
      {showIcon && <config.Icon size={iconSize} />}
      <span>{config.label}</span>
    </span>
  );
}
