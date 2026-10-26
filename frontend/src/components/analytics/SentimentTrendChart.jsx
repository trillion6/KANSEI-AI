import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-3 border border-secondary border-opacity-50"
        style={{
          background: 'rgba(11, 19, 43, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span className="d-block small text-muted mb-2 font-monospace">{label}</span>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="d-flex align-items-center gap-2 small mb-1">
            <span
              className="d-inline-block rounded-circle"
              style={{ width: 8, height: 8, background: entry.color }}
            />
            <span className="text-secondary text-capitalize">{entry.name}:</span>
            <span className="fw-bold text-white font-monospace">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function SentimentTrendChart({ data = [], height = 300 }) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPos" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorNeu" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorNeg" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0.0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
          <XAxis
            dataKey="date"
            stroke="#64748B"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-secondary small fw-medium text-capitalize">{value}</span>
            )}
          />

          <Area
            type="monotone"
            dataKey="positive"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPos)"
          />
          <Area
            type="monotone"
            dataKey="neutral"
            stroke="#F59E0B"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorNeu)"
          />
          <Area
            type="monotone"
            dataKey="negative"
            stroke="#F43F5E"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorNeg)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
