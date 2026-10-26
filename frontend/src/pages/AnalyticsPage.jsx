import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart2, 
  Calendar, 
  Filter, 
  Download, 
  TrendingUp, 
  PieChart as PieIcon, 
  Hash,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import GlassCard from '../components/common/GlassCard';
import GlowButton from '../components/common/GlowButton';
import SentimentDistributionPie from '../components/analytics/SentimentDistributionPie';
import SentimentTrendChart from '../components/analytics/SentimentTrendChart';
import WordFrequencyChart from '../components/analytics/WordFrequencyChart';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { sentimentService } from '../services/sentimentService';
import { useAuth } from '../context/AuthContext';
import { 
  DEMO_METRICS, 
  DEMO_TRENDS_DATA, 
  DEMO_DISTRIBUTION_DATA, 
  DEMO_FREQUENT_WORDS 
} from '../mock/mockData';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuth();

  const [dateRange, setDateRange] = useState('30d');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    if (isDemoMode) {
      setMetrics({
        ...DEMO_METRICS,
        distribution: DEMO_DISTRIBUTION_DATA,
        sentiment_trends: DEMO_TRENDS_DATA,
        frequent_words: DEMO_FREQUENT_WORDS,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await sentimentService.getAnalyticsMetrics();
      setMetrics(data);
    } catch (err) {
      setError(err.message || 'Failed to load live analytics telemetry.');
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const total = metrics?.total_analyses ?? metrics?.totalAnalyses ?? 0;
  const posCount = metrics?.positive_count ?? metrics?.positiveCount ?? 0;
  const neuCount = metrics?.neutral_count ?? metrics?.neutralCount ?? 0;
  const negCount = metrics?.negative_count ?? metrics?.negativeCount ?? 0;
  const posPct = metrics?.positive_pct ?? metrics?.positivePct ?? 0;
  const neuPct = metrics?.neutral_pct ?? metrics?.neutralPct ?? 0;
  const negPct = metrics?.negative_pct ?? metrics?.negativePct ?? 0;

  const distribution = metrics?.distribution || [
    { name: 'Positive', value: posCount, color: '#10B981' },
    { name: 'Neutral', value: neuCount, color: '#00F2FE' },
    { name: 'Negative', value: negCount, color: '#F43F5E' },
  ];

  const filteredDistribution = sentimentFilter === 'all'
    ? distribution
    : distribution.filter((d) => d.name.toLowerCase() === sentimentFilter.toLowerCase());

  const trends = metrics?.sentiment_trends || [];
  const words = metrics?.frequent_words || [];
  const filteredWords = sentimentFilter === 'all'
    ? words
    : words.filter((w) => w.sentiment.toLowerCase() === sentimentFilter.toLowerCase());

  const handleExportSummary = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Sentiment,Count,Percentage\n' +
      `Positive,${posCount},${posPct}%\n` +
      `Neutral,${neuCount},${neuPct}%\n` +
      `Negative,${negCount},${negPct}%\n` +
      `Total,${total},100%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kansei_analytics_summary_${dateRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid px-lg-5 py-4">
      {/* Header and Controls */}
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <div>
          <h1 className="h3 text-white fw-bold mb-1 d-flex align-items-center gap-2">
            <BarChart2 size={26} color="#00F2FE" />
            <span>Sentiment Intelligence & Analytics</span>
          </h1>
          <p className="text-secondary small mb-0">
            Statistical distribution, longitudinal volume shifts, and key token frequency.
          </p>
        </div>

        {/* Global Filter Bar */}
        <div className="d-flex flex-wrap align-items-center gap-2">
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={loading}
            className="btn btn-sm btn-kansi-glass d-flex align-items-center gap-1"
            title="Refresh analytics"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Sentiment Filter */}
          <div className="d-flex align-items-center gap-2 bg-dark bg-opacity-50 p-1 px-2 rounded-3 border border-secondary border-opacity-25">
            <Filter size={14} color="#00F2FE" />
            <select
              className="form-select form-select-sm bg-transparent border-0 text-white shadow-none"
              style={{ fontSize: '0.8rem' }}
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
            >
              <option value="all" className="bg-dark">All Sentiments</option>
              <option value="positive" className="bg-dark">Positive Focus</option>
              <option value="neutral" className="bg-dark">Neutral Focus</option>
              <option value="negative" className="bg-dark">Negative Focus</option>
            </select>
          </div>

          <GlowButton
            variant="glass"
            size="sm"
            icon={Download}
            onClick={handleExportSummary}
            disabled={total === 0}
          >
            Export Analytics CSV
          </GlowButton>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {total === 0 ? (
        <EmptyState
          icon={BarChart2}
          title="No Analytics Data Yet"
          description="You don't have any sentiment records analyzed in your workspace yet. Head over to the Sentiment Studio to run your first customer review analysis."
          actionLabel="Go to Sentiment Studio"
          onAction={() => navigate('/analyzer')}
        />
      ) : (
        <>
          {/* Top Charts Row */}
          <div className="row g-4 mb-4">
            {/* Sentiment Distribution Pie */}
            <div className="col-12 col-lg-5">
              <GlassCard
                header="Class Distribution"
                headerAction={
                  <span className="text-muted small">
                    {sentimentFilter === 'all' ? 'All Classes' : `${sentimentFilter.toUpperCase()} Filtered`}
                  </span>
                }
                className="h-100"
              >
                <SentimentDistributionPie data={filteredDistribution} height={260} />
                <div className="text-center pt-2 border-top border-secondary border-opacity-25 mt-2">
                  <span className="text-muted small">
                    Total: {total.toLocaleString()} records evaluated ({posCount} pos, {neuCount} neu, {negCount} neg)
                  </span>
                </div>
              </GlassCard>
            </div>

            {/* Time-Series Sentiment Trend Chart */}
            <div className="col-12 col-lg-7">
              <GlassCard
                header="Sentiment Volume Trend (Recent Days)"
                headerAction={
                  <span className="text-muted small">Daily Distribution</span>
                }
                className="h-100"
              >
                {trends.length > 0 ? (
                  <SentimentTrendChart data={trends} height={260} />
                ) : (
                  <div className="text-center py-5 text-secondary small">
                    Trend data will populate as records span multiple days.
                  </div>
                )}
              </GlassCard>
            </div>
          </div>

          {/* Bottom Chart: Salient Word Frequency */}
          <div className="row g-4">
            <div className="col-12">
              <GlassCard
                header="Salient Keyword & Token Frequency"
                headerAction={
                  <span className="text-muted small">Top Occurrences by Sentiment</span>
                }
              >
                {filteredWords.length > 0 ? (
                  <WordFrequencyChart data={filteredWords} height={280} />
                ) : (
                  <div className="text-center py-5 text-secondary small">
                    More analyzed text is required to extract recurring n-gram tokens.
                  </div>
                )}
              </GlassCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
