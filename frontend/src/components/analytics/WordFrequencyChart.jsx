import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const wordLabel = data.word || data.text || '';
    return (
      <div
        className="p-2 rounded-3 border border-secondary border-opacity-50"
        style={{
          background: 'rgba(11, 19, 43, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        <span className="d-block fw-bold text-white font-monospace">"{wordLabel}"</span>
        <span className="small text-secondary">
          Occurrences: <strong className="text-white">{data.count}</strong>
        </span>
        <span className="d-block text-capitalize small mt-1" style={{ color: getBarColor(data.sentiment) }}>
          Sentiment tendency: {data.sentiment}
        </span>
      </div>
    );
  }
  return null;
};

const getBarColor = (sentiment) => {
  switch (sentiment) {
    case 'positive':
      return '#10B981';
    case 'neutral':
      return '#F59E0B';
    case 'negative':
      return '#F43F5E';
    default:
      return '#00F2FE';
  }
};

export default function WordFrequencyChart({ data = [], height = 280 }) {
  const normalizedData = (data || []).map((item) => ({
    ...item,
    word: item.word || item.text || '',
  }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={normalizedData}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" horizontal={false} />
          <XAxis
            type="number"
            stroke="#64748B"
            tick={{ fill: '#94A3B8', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          <YAxis
            type="category"
            dataKey="word"
            stroke="#64748B"
            tick={{ fill: '#E2E8F0', fontSize: 12, fontFamily: 'monospace' }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
            width={75}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {normalizedData.map((entry, index) => (
              <Cell
                key={`bar-${index}`}
                fill={getBarColor(entry.sentiment)}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
