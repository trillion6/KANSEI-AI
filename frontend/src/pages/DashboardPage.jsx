import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  ThumbsUp, 
  MinusCircle, 
  ThumbsDown, 
  Gauge, 
  Send, 
  Clock, 
  Sparkles, 
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import GlowButton from '../components/common/GlowButton';
import StatCard from '../components/dashboard/StatCard';
import SentimentBadge from '../components/common/SentimentBadge';
import SentimentDistributionPie from '../components/analytics/SentimentDistributionPie';
import DetailModal from '../components/history/DetailModal';
import ErrorAlert from '../components/common/ErrorAlert';
import { sentimentService } from '../services/sentimentService';
import { useAuth } from '../context/AuthContext';
import { 
  DEMO_METRICS, 
  DEMO_HISTORY_RECORDS 
} from '../mock/mockData';

export default function DashboardPage() {
  const { isDemoMode } = useAuth();

  const [metrics, setMetrics] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [quickText, setQuickText] = useState('');
  const [quickResult, setQuickResult] = useState(null);
  const [isQuickAnalyzing, setIsQuickAnalyzing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (isDemoMode) {
      setMetrics(DEMO_METRICS);
      setRecentRecords(DEMO_HISTORY_RECORDS.slice(0, 5));
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [metricsData, historyData] = await Promise.all([
        sentimentService.getAnalyticsMetrics(),
        sentimentService.getHistory({ per_page: 5 }),
      ]);
      setMetrics(metricsData);
      setRecentRecords(historyData?.items || []);
    } catch (err) {
      setError(err.message || 'Could not load live dashboard telemetry.');
      // Safe fallback to zero metrics if new or disconnected
      setMetrics({
        total_analyses: 0,
        positive_count: 0,
        positive_pct: 0,
        neutral_count: 0,
        neutral_pct: 0,
        negative_count: 0,
        negative_pct: 0,
        average_confidence: 0,
        distribution: [
          { name: 'Positive', value: 0, color: '#10B981' },
          { name: 'Neutral', value: 0, color: '#F59E0B' },
          { name: 'Negative', value: 0, color: '#F43F5E' },
        ],
      });
      setRecentRecords([]);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleQuickAnalyze = async (e) => {
    e.preventDefault();
    if (!quickText.trim()) return;

    setIsQuickAnalyzing(true);
    setError('');

    try {
      const result = await sentimentService.analyzeText(quickText.trim(), 'dashboard_quick');
      setQuickResult(result);
      setQuickText('');
      // Refresh dashboard feed to immediately reflect persisted analysis
      fetchDashboardData();
    } catch (err) {
      setError(err.message || 'Quick analysis failed.');
    } finally {
      setIsQuickAnalyzing(false);
    }
  };

  const displayMetrics = metrics || {
    total_analyses: 0,
    positive_count: 0,
    positive_pct: 0,
    neutral_count: 0,
    neutral_pct: 0,
    negative_count: 0,
    negative_pct: 0,
    average_confidence: 0,
    distribution: [],
  };

  const distributionData = displayMetrics.distribution && displayMetrics.distribution.length > 0
    ? displayMetrics.distribution
    : [
        { name: 'Positive', value: displayMetrics.positive_count || 0, color: '#10B981' },
        { name: 'Neutral', value: displayMetrics.neutral_count || 0, color: '#F59E0B' },
        { name: 'Negative', value: displayMetrics.negative_count || 0, color: '#F43F5E' },
      ];

  return (
    <div className="container-fluid px-3 px-sm-4 px-lg-5 py-4">
      {/* Top Banner & Status */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <h1 className="h3 text-white fw-bold mb-0">Workspace Dashboard</h1>
            <span
              className="badge rounded-pill fw-medium"
              style={{
                background: isDemoMode ? 'rgba(245, 158, 11, 0.12)' : 'rgba(0, 242, 254, 0.10)',
                color: isDemoMode ? '#FBBF24' : '#38BDF8',
                border: isDemoMode ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(0, 242, 254, 0.3)',
                fontSize: '0.72rem',
                padding: '3px 9px',
              }}
            >
              {isDemoMode ? 'Demo Mode' : 'Live Workspace'}
            </span>
          </div>
          <p className="text-secondary small mb-0">
            Real-time sentiment telemetry, authenticated user records, and instantaneous neural diagnostics.
          </p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn btn-sm btn-kansei-glass d-flex align-items-center gap-1"
            title="Refresh dashboard telemetry"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/analyzer" className="text-decoration-none">
            <GlowButton variant="primary" size="sm" icon={Sparkles}>
              Open Studio
            </GlowButton>
          </Link>
          <Link to="/history" className="text-decoration-none">
            <GlowButton variant="glass" size="sm" icon={Clock}>
              Full History
            </GlowButton>
          </Link>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Metric Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Total Analyses"
            value={(displayMetrics.total_analyses ?? displayMetrics.totalAnalyses ?? 0).toLocaleString()}
            subtext="User-scoped records"
            icon={Activity}
            trend={{ direction: 'up', label: 'Live authenticated' }}
            glow="blue"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Positive"
            value={`${displayMetrics.positive_pct ?? displayMetrics.positivePct ?? 0}%`}
            subtext={`${displayMetrics.positive_count ?? displayMetrics.positiveCount ?? 0} satisfied reviews`}
            icon={ThumbsUp}
            glow="pos"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Neutral"
            value={`${displayMetrics.neutral_pct ?? displayMetrics.neutralPct ?? 0}%`}
            subtext={`${displayMetrics.neutral_count ?? displayMetrics.neutralCount ?? 0} objective texts`}
            icon={MinusCircle}
            glow="neu"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Negative"
            value={`${displayMetrics.negative_pct ?? displayMetrics.negativePct ?? 0}%`}
            subtext={`${displayMetrics.negative_count ?? displayMetrics.negativeCount ?? 0} complaints flagged`}
            icon={ThumbsDown}
            glow="neg"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl">
          <StatCard
            title="Avg Confidence"
            value={`${displayMetrics.average_confidence ?? displayMetrics.avgConfidence ?? 0}%`}
            subtext="Softmax probability mean"
            icon={Gauge}
          />
        </div>
      </div>

      {/* Main Grid: Quick Analyzer & Sentiment Distribution */}
      <div className="row g-4 mb-4">
        {/* Quick Test Widget */}
        <div className="col-12 col-lg-7">
          <GlassCard
            header="Quick Sentiment Diagnostic"
            headerAction={
              <span
                className="badge rounded-pill fw-semibold"
                style={{
                  background: 'rgba(0, 242, 254, 0.10)',
                  color: '#00F2FE',
                  border: '1px solid rgba(0, 242, 254, 0.30)',
                  fontSize: '0.72rem',
                }}
              >
                Bi-GRU Model
              </span>
            }
            glow="blue"
            className="h-100 p-4"
          >
            <form onSubmit={handleQuickAnalyze} className="mb-3">
              <div className="mb-3">
                <textarea
                  className="form-control form-control-glass"
                  rows={4}
                  placeholder="Paste customer feedback, product review, or message for instant neural evaluation..."
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                  Automatically persisted to your database history
                </span>
                <GlowButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isQuickAnalyzing}
                  disabled={!quickText.trim()}
                  icon={Send}
                >
                  Analyze Text
                </GlowButton>
              </div>
            </form>

            {/* Diagnostic Output */}
            {quickResult && (
              <div
                className="p-3 rounded-3"
                style={{
                  background: 'rgba(7, 11, 25, 0.70)',
                  border: '1px solid var(--border-glass-medium)',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.35)',
                }}
              >
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="small text-secondary fw-medium">Diagnostic Classification</span>
                  <SentimentBadge sentiment={quickResult.sentiment} size="sm" />
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small">Softmax Confidence:</span>
                  <span className="text-white fw-bold font-monospace">
                    {quickResult.confidence ? quickResult.confidence.toFixed(1) : '0.0'}%
                  </span>
                </div>
                <div
                  className="progress rounded-pill overflow-hidden"
                  style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)' }}
                >
                  <div
                    className="progress-bar"
                    style={{
                      width: `${quickResult.confidence || 0}%`,
                      background: quickResult.sentiment === 'positive'
                        ? 'var(--sentiment-pos)'
                        : quickResult.sentiment === 'negative'
                        ? 'var(--sentiment-neg)'
                        : 'var(--sentiment-neu)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Sentiment Distribution Doughnut */}
        <div className="col-12 col-lg-5">
          <GlassCard
            header="Sentiment Distribution"
            headerAction={
              <Link to="/analytics" className="text-cyan small fw-medium text-decoration-none d-flex align-items-center gap-1">
                <span>Deep View</span>
                <ExternalLink size={12} />
              </Link>
            }
            className="h-100 p-4"
          >
            <SentimentDistributionPie data={distributionData} height={230} />
            <div className="text-center pt-3 border-top border-secondary border-opacity-25 mt-2">
              <span className="text-muted small" style={{ fontSize: '0.78rem' }}>
                {(displayMetrics.total_analyses ?? displayMetrics.totalAnalyses ?? 0) === 0
                  ? 'No records yet. Run an analysis to populate live telemetry.'
                  : `Calculated from ${(displayMetrics.total_analyses ?? displayMetrics.totalAnalyses ?? 0).toLocaleString()} user records`}
              </span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Recent Feed Table */}
      <GlassCard
        header="Recent Sentiment Activity"
        headerAction={
          <Link to="/history" className="btn btn-sm btn-kansei-glass text-decoration-none">
            View All ({recentRecords.length})
          </Link>
        }
        className="p-4"
      >
        {recentRecords.length === 0 ? (
          <div className="text-center py-5 text-secondary small">
            No sentiment records found in this workspace yet. Use the Quick Sentiment Diagnostic above or visit the Studio to analyze your first text.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-glass align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Text Excerpt</th>
                  <th style={{ width: '130px' }}>Sentiment</th>
                  <th style={{ width: '120px' }}>Confidence</th>
                  <th style={{ width: '120px' }}>Date</th>
                  <th style={{ width: '90px' }} className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentRecords.map((record) => (
                  <tr key={record.id}>
                    <td className="font-monospace text-cyan small">#{record.id}</td>
                    <td style={{ maxWidth: '340px' }} className="text-truncate">
                      "{record.text}"
                    </td>
                    <td>
                      <SentimentBadge sentiment={record.sentiment} size="sm" />
                    </td>
                    <td className="font-monospace text-white fw-semibold">
                      {record.confidence ? record.confidence.toFixed(1) : '0.0'}%
                    </td>
                    <td className="text-secondary small">
                      {record.created_at ? new Date(record.created_at).toLocaleDateString() : (record.createdAt || '-')}
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        onClick={() => setSelectedRecord(record)}
                        className="btn btn-sm btn-kansei-glass py-1 px-2 fs-8"
                        title="Inspect full neural telemetry"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Inspection Modal */}
      {selectedRecord && (
        <DetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
