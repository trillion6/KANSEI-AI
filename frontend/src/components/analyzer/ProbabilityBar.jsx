import React from 'react';

export default function ProbabilityBar({
  probabilities = { positive: 0.33, neutral: 0.33, negative: 0.34 },
}) {
  const safeProbs = probabilities || { positive: 0.33, neutral: 0.33, negative: 0.34 };
  const toPct = (val) => {
    const num = Number(val) || 0;
    return num <= 1 ? Math.round(num * 100) : Math.round(num);
  };
  const posPct = toPct(safeProbs.positive);
  const neuPct = toPct(safeProbs.neutral);
  const negPct = toPct(safeProbs.negative);

  return (
    <div className="w-100">
      <div className="d-flex justify-content-between align-items-center mb-2 small">
        <span className="text-secondary fw-medium">Softmax Class Distribution</span>
        <span className="text-muted font-monospace" style={{ fontSize: '0.75rem' }}>
          3-Class Vector
        </span>
      </div>

      {/* Tri-color progress track */}
      <div
        className="progress rounded-pill overflow-hidden"
        style={{
          height: '12px',
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div
          className="progress-bar"
          role="progressbar"
          style={{
            width: `${posPct}%`,
            background: 'linear-gradient(90deg, #059669, #10B981)',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
            transition: 'width 0.6s ease',
          }}
          aria-valuenow={posPct}
          aria-valuemin="0"
          aria-valuemax="100"
          title={`Positive: ${posPct}%`}
        />
        <div
          className="progress-bar"
          role="progressbar"
          style={{
            width: `${neuPct}%`,
            background: 'linear-gradient(90deg, #D97706, #F59E0B)',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.4)',
            transition: 'width 0.6s ease',
          }}
          aria-valuenow={neuPct}
          aria-valuemin="0"
          aria-valuemax="100"
          title={`Neutral: ${neuPct}%`}
        />
        <div
          className="progress-bar"
          role="progressbar"
          style={{
            width: `${negPct}%`,
            background: 'linear-gradient(90deg, #E11D48, #F43F5E)',
            boxShadow: '0 0 10px rgba(244, 63, 94, 0.4)',
            transition: 'width 0.6s ease',
          }}
          aria-valuenow={negPct}
          aria-valuemin="0"
          aria-valuemax="100"
          title={`Negative: ${negPct}%`}
        />
      </div>

      {/* Legend & Percentages */}
      <div className="row g-2 mt-2 pt-1 text-center">
        <div className="col-4">
          <div className="p-2 rounded-2" style={{ background: 'rgba(16, 185, 129, 0.08)' }}>
            <span className="d-block text-success small fw-bold">{posPct}%</span>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Positive</span>
          </div>
        </div>
        <div className="col-4">
          <div className="p-2 rounded-2" style={{ background: 'rgba(245, 158, 11, 0.08)' }}>
            <span className="d-block text-warning small fw-bold">{neuPct}%</span>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Neutral</span>
          </div>
        </div>
        <div className="col-4">
          <div className="p-2 rounded-2" style={{ background: 'rgba(244, 63, 94, 0.08)' }}>
            <span className="d-block text-danger small fw-bold">{negPct}%</span>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>Negative</span>
          </div>
        </div>
      </div>
    </div>
  );
}
