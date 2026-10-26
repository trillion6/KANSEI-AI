import React from 'react';
import { Sparkles } from 'lucide-react';
import GlowButton from './GlowButton';

export default function EmptyState({
  icon: Icon = Sparkles,
  title = 'No analyses recorded yet',
  description = 'Analyze your first customer review or feedback to generate real-time sentiment intelligence.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex p-3 rounded-circle mb-3"
        style={{
          background: 'rgba(0, 242, 254, 0.08)',
          border: '1px solid rgba(0, 242, 254, 0.2)',
          boxShadow: '0 0 20px rgba(0, 242, 254, 0.1)',
        }}
      >
        <Icon size={36} color="#00F2FE" />
      </div>
      <h4 className="h5 text-white fw-semibold mb-2">{title}</h4>
      <p className="text-muted mx-auto mb-4" style={{ maxWidth: '420px', fontSize: '0.92rem' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <GlowButton variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </GlowButton>
      )}
    </div>
  );
}
