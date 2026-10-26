import React, { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Eye, 
  ArrowUpDown, 
  CheckSquare,
  AlertTriangle,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import GlassCard from '../components/common/GlassCard';
import GlowButton from '../components/common/GlowButton';
import SentimentBadge from '../components/common/SentimentBadge';
import DetailModal from '../components/history/DetailModal';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { sentimentService } from '../services/sentimentService';
import { useAuth } from '../context/AuthContext';
import { DEMO_HISTORY_RECORDS } from '../mock/mockData';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { isDemoMode } = useAuth();

  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [page, setPage] = useState(1);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (isDemoMode) {
      const filtered = DEMO_HISTORY_RECORDS
        .filter((r) => {
          const matchSearch =
            r.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(r.id).toLowerCase().includes(searchTerm.toLowerCase());
          const matchSentiment =
            sentimentFilter === 'all' || r.sentiment.toLowerCase() === sentimentFilter.toLowerCase();
          return matchSearch && matchSentiment;
        })
        .sort((a, b) => {
          if (sortBy === 'date-desc') return new Date(b.createdAt) - new Date(a.createdAt);
          if (sortBy === 'date-asc') return new Date(a.createdAt) - new Date(b.createdAt);
          if (sortBy === 'conf-desc') return b.confidence - a.confidence;
          if (sortBy === 'conf-asc') return a.confidence - b.confidence;
          return 0;
        });
      setRecords(filtered);
      setTotalCount(filtered.length);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await sentimentService.getHistory({
        page,
        per_page: 20,
        sentiment: sentimentFilter,
        search: searchTerm,
        sort: sortBy,
      });
      setRecords(data.items || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      setError(err.message || 'Failed to load analysis history.');
      setRecords([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [isDemoMode, page, sentimentFilter, searchTerm, sortBy]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDelete = async (id) => {
    if (isDemoMode) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setDeleteConfirmId(null);
      return;
    }

    try {
      await sentimentService.deleteHistory(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setDeleteConfirmId(null);
    } catch (err) {
      setError(err.message || 'Failed to delete record.');
    }
  };

  const handleExportCSV = async () => {
    if (isDemoMode) {
      if (records.length === 0) return;

      const headers = ['ID', 'Sentiment', 'Confidence (%)', 'Word Count', 'Character Count', 'Date', 'Text'];
      const rows = records.map((r) => [
        `#${r.id}`,
        r.sentiment,
        r.confidence,
        r.word_count || r.wordCount || 0,
        r.char_count || r.charCount || 0,
        `"${r.created_at || r.createdAt || ''}"`,
        `"${(r.text || '').replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,' +
        [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `kansei_sentiment_history_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const response = await fetch('/api/analytics/export', {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`Export request returned status ${response.status}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kansei_sentiment_history_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message || 'Failed to download historical CSV export.');
    }
  };

  return (
    <div className="container-fluid px-lg-5 py-4">
      {/* Header and Actions */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 text-white fw-bold mb-1 d-flex align-items-center gap-2">
            <Clock size={26} color="#00F2FE" />
            <span>Analysis History & Audit Log</span>
          </h1>
          <p className="text-secondary small mb-0">
            Searchable, user-isolated archive of analyzed reviews with single-click CSV export.
          </p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={fetchHistory}
            disabled={loading}
            className="btn btn-sm btn-kansi-glass d-flex align-items-center gap-1"
            title="Refresh history"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <GlowButton
            variant="glass"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
            disabled={records.length === 0}
          >
            Export to CSV ({records.length})
          </GlowButton>
        </div>
      </div>

      <ErrorAlert message={error} onDismiss={() => setError('')} />

      {/* Search & Filter Toolbar */}
      <GlassCard className="p-3 mb-4">
        <div className="row g-3 align-items-center">
          {/* Keyword Search */}
          <div className="col-12 col-md-5">
            <div className="position-relative">
              <Search
                size={16}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
              />
              <input
                type="text"
                className="form-control form-control-glass ps-5"
                placeholder="Search by review content or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          {/* Sentiment Filter Dropdown */}
          <div className="col-6 col-md-3">
            <div className="d-flex align-items-center gap-2">
              <span className="text-secondary small text-nowrap">Filter:</span>
              <select
                className="form-select form-control-glass py-2 text-white"
                value={sentimentFilter}
                onChange={(e) => {
                  setSentimentFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="all" className="bg-dark">All Sentiments</option>
                <option value="positive" className="bg-dark">Positive Only</option>
                <option value="neutral" className="bg-dark">Neutral Only</option>
                <option value="negative" className="bg-dark">Negative Only</option>
              </select>
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="col-6 col-md-4">
            <div className="d-flex align-items-center gap-2 justify-content-md-end">
              <ArrowUpDown size={14} className="text-muted" />
              <select
                className="form-select form-control-glass py-2 text-white"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc" className="bg-dark">Newest First</option>
                <option value="date-asc" className="bg-dark">Oldest First</option>
                <option value="conf-desc" className="bg-dark">Highest Confidence</option>
                <option value="conf-asc" className="bg-dark">Lowest Confidence</option>
              </select>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* History Records Table */}
      {records.length === 0 ? (
        <EmptyState
          icon={Clock}
          title={searchTerm || sentimentFilter !== 'all' ? 'No Matching Records' : 'No Analysis History Yet'}
          description={
            searchTerm || sentimentFilter !== 'all'
              ? 'No historical predictions match your current search or sentiment filter.'
              : 'Your analyzed customer reviews and sentiment evaluations will appear here.'
          }
          actionLabel="Analyze Text Now"
          onAction={() => navigate('/analyzer')}
        />
      ) : (
        <GlassCard className="p-0 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-glass align-middle mb-0">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>ID</th>
                  <th>Review Text</th>
                  <th style={{ width: '130px' }}>Sentiment</th>
                  <th style={{ width: '130px' }}>Confidence</th>
                  <th style={{ width: '120px' }}>Tokens</th>
                  <th style={{ width: '150px' }}>Timestamp</th>
                  <th className="text-end" style={{ width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td className="font-monospace text-cyan small">#{record.id}</td>
                    <td style={{ maxWidth: '360px' }}>
                      <span className="text-truncate d-inline-block w-100" title={record.text}>
                        "{record.text}"
                      </span>
                    </td>
                    <td>
                      <SentimentBadge sentiment={record.sentiment} size="sm" />
                    </td>
                    <td>
                      <span className="font-monospace text-white fw-bold">
                        {record.confidence ? record.confidence.toFixed(1) : '0.0'}%
                      </span>
                    </td>
                    <td className="text-muted small">
                      {record.word_count || record.wordCount || 0} w / {record.char_count || record.charCount || 0} c
                    </td>
                    <td className="text-secondary small">
                      {record.created_at ? new Date(record.created_at).toLocaleString() : (record.createdAt || '-')}
                    </td>
                    <td className="text-end">
                      <div className="d-flex align-items-center justify-content-end gap-1">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          className="btn btn-sm btn-kansi-glass p-1 text-info"
                          title="Inspect details"
                        >
                          <Eye size={15} />
                        </button>

                        {deleteConfirmId === record.id ? (
                          <div className="d-flex align-items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDelete(record.id)}
                              className="btn btn-sm btn-danger p-1"
                              title="Confirm delete"
                            >
                              <CheckSquare size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="btn btn-sm btn-secondary p-1"
                              title="Cancel"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmId(record.id)}
                            className="btn btn-sm btn-kansi-glass p-1 text-danger"
                            title="Delete record"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {/* Detail Inspection Modal */}
      {selectedRecord && (
        <DetailModal
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
}
