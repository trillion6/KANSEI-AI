import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div
        className="p-2 px-3 rounded-3"
        style={{
          background: 'rgba(11, 20, 38, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid var(--border-glass-medium)',
          boxShadow: '0 8px 25px rgba(0, 0, 0, 0.6)',
        }}
      >
        <span className="d-block fw-bold small" style={{ color: data.payload.color }}>
          {data.name} Sentiment
        </span>
        <span className="small text-white font-monospace">
          {(data.value || 0).toLocaleString()} analyses{data.percent !== undefined ? ` (${(data.percent * 100).toFixed(1)}%)` : ''}
        </span>
      </div>
    );
  }
  return null;
};

export default function SentimentDistributionPie({
  data = [
    { name: 'Positive', value: 684, color: '#10B981' },
    { name: 'Neutral', value: 298, color: '#F59E0B' },
    { name: 'Negative', value: 266, color: '#F43F5E' },
  ],
  height = 260,
}) {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                stroke="rgba(7, 11, 25, 0.9)"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value) => (
              <span className="text-secondary small fw-medium">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
