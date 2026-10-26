import React from 'react';

export default function ConfidenceGauge({
  score = 0, // 0 - 100
  sentiment = 'positive',
  size = 140,
  label = 'Model Confidence',
}) {
  const numScore = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = (size / 2) - 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (numScore / 100) * circumference;

  const colorMap = {
    positive: '#10B981',
    neutral: '#F59E0B',
    negative: '#F43F5E',
  };

  const activeColor = colorMap[(sentiment || 'positive').toLowerCase()] || '#00F2FE';

  return (
    <div className="d-flex flex-column align-items-center justify-content-center text-center">
      <div className="position-relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="10"
            fill="none"
          />
          {/* Animated score circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={activeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.4s ease',
              filter: `drop-shadow(0 0 8px ${activeColor})`,
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="position-absolute top-50 start-50 translate-middle d-flex flex-column align-items-center">
          <span className="fs-3 fw-bold text-white lh-1 font-monospace">
            {numScore.toFixed(1)}%
          </span>
          <span className="text-muted" style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>
            Score
          </span>
        </div>
      </div>
      {label && <span className="small text-secondary mt-2 fw-medium">{label}</span>}
    </div>
  );
}
