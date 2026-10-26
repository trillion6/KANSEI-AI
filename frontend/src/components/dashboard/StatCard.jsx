import React from 'react';
import GlassCard from '../common/GlassCard';

export default function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend, // { direction: 'up' | 'down', label: string }
  glow = 'none',
}) {
  // Theme icon badge based on glow accent
  const iconTheme = {
    blue: {
      bg: 'rgba(0, 242, 254, 0.10)',
      border: 'rgba(0, 242, 254, 0.25)',
      color: '#00F2FE',
    },
    pos: {
      bg: 'rgba(16, 185, 129, 0.10)',
      border: 'rgba(16, 185, 129, 0.25)',
      color: '#10B981',
    },
    neu: {
      bg: 'rgba(245, 158, 11, 0.10)',
      border: 'rgba(245, 158, 11, 0.25)',
      color: '#F59E0B',
    },
    neg: {
      bg: 'rgba(244, 63, 94, 0.10)',
      border: 'rgba(244, 63, 94, 0.25)',
      color: '#F43F5E',
    },
  }[glow] || {
    bg: 'rgba(59, 130, 246, 0.10)',
    border: 'rgba(59, 130, 246, 0.25)',
    color: '#38BDF8',
  };

  return (
    <GlassCard glow={glow} className="h-100 p-3" interactive>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span
          className="text-secondary small fw-semibold text-uppercase tracking-wider"
          style={{ fontSize: '0.74rem', letterSpacing: '0.06em' }}
        >
          {title}
        </span>
        {Icon && (
          <div
            className="p-2 rounded-3 d-flex align-items-center justify-content-center"
            style={{
              background: iconTheme.bg,
              border: `1px solid ${iconTheme.border}`,
            }}
          >
            <Icon size={17} color={iconTheme.color} />
          </div>
        )}
      </div>

      <div className="d-flex align-items-baseline gap-2 mb-1">
        <span
          className="fw-extrabold text-white font-monospace"
          style={{ fontSize: '1.75rem', letterSpacing: '-0.02em', lineHeight: 1.1 }}
        >
          {value}
        </span>
        {trend && (
          <span
            className={`badge rounded-pill fs-8 ${
              trend.direction === 'up'
                ? 'text-success bg-success'
                : 'text-danger bg-danger'
            } bg-opacity-10 border border-opacity-25`}
            style={{ fontSize: '0.70rem', padding: '2px 8px' }}
          >
            {trend.direction === 'up' ? '↑' : '↓'} {trend.label}
          </span>
        )}
      </div>

      {subtext && (
        <span className="text-muted small d-block" style={{ fontSize: '0.78rem' }}>
          {subtext}
        </span>
      )}
    </GlassCard>
  );
}
