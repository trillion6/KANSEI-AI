import React from 'react';

export default function GlassCard({
  children,
  className = '',
  variant = 'default', // 'default' | 'deep'
  glow = 'none', // 'none' | 'blue' | 'amber' | 'pos' | 'neu' | 'neg'
  interactive = false,
  header,
  headerAction,
  footer,
  style = {},
  ...props
}) {
  const glowClass = {
    none: '',
    blue: 'glow-blue',
    amber: 'glow-amber',
    pos: 'glow-pos',
    neu: 'glow-neu',
    neg: 'glow-neg',
  }[glow] || '';

  let cardBase = 'glass-panel';
  if (variant === 'deep') {
    cardBase = 'glass-panel-deep';
  } else if (interactive) {
    cardBase = 'glass-card-interactive';
  }

  // Only apply default p-4 padding if caller did not supply custom padding in className
  const hasPadding = /\bp(?:-[0-5]|x-[0-5]|y-[0-5])\b/.test(className);
  const paddingClass = hasPadding ? '' : 'p-4';

  return (
    <div
      className={`${cardBase} ${glowClass} ${paddingClass} ${className}`.trim()}
      style={style}
      {...props}
    >
      {(header || headerAction) && (
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom border-secondary border-opacity-25">
          {header && <h3 className="h6 mb-0 text-white fw-bold">{header}</h3>}
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="card-body-content">{children}</div>
      {footer && (
        <div className="mt-3 pt-3 border-top border-secondary border-opacity-25 text-muted small">
          {footer}
        </div>
      )}
    </div>
  );
}
