import React from 'react';
import { X, Calendar, Type, Hash, Sparkles } from 'lucide-react';
import SentimentBadge from '../common/SentimentBadge';
import ConfidenceGauge from '../analyzer/ConfidenceGauge';
import ProbabilityBar from '../analyzer/ProbabilityBar';

export default function DetailModal({ record, onClose }) {
  if (!record) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      role="dialog"
      aria-modal="true"
      style={{ background: 'rgba(3, 7, 18, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content glass-modal">
          {/* Header */}
          <div className="modal-header border-secondary border-opacity-25 pb-3">
            <div className="d-flex align-items-center gap-3">
              <div
                className="p-2 rounded-3"
                style={{
                  background: 'rgba(0, 242, 254, 0.1)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                }}
              >
                <Sparkles size={18} color="#00F2FE" />
              </div>
              <div>
                <h5 className="modal-title fw-bold text-white mb-0">Analysis Details</h5>
                <span className="text-muted small font-monospace">
                  {record.id ? `#${record.id}` : 'Local Analysis'}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-link text-white-50 p-1 border-0"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body p-4">
            <div className="row g-4">
              {/* Left Column: Text & Metrics */}
              <div className="col-12 col-md-7">
                <label className="text-secondary small fw-medium mb-2 d-block">
                  Input Review / Text
                </label>
                <div
                  className="p-3 rounded-3 mb-3"
                  style={{
                    background: 'rgba(7, 11, 25, 0.7)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: '#E2E8F0',
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}
                >
                  "{record.text}"
                </div>

                <div className="d-flex flex-wrap gap-3 text-secondary small">
                  <div className="d-flex align-items-center gap-1">
                    <Calendar size={14} />
                    <span>{record.createdAt || (record.created_at ? new Date(record.created_at).toLocaleString() : 'Recently')}</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <Type size={14} />
                    <span>{record.wordCount ?? record.word_count ?? (record.text ? record.text.trim().split(/\s+/).filter(Boolean).length : 0)} words</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <Hash size={14} />
                    <span>{record.charCount ?? record.char_count ?? (record.text ? record.text.length : 0)} chars</span>
                  </div>
                </div>

                <div className="mt-4">
                  <ProbabilityBar probabilities={record.probabilities} />
                </div>
              </div>

              {/* Right Column: Sentiment & Confidence Gauge */}
              <div className="col-12 col-md-5 d-flex flex-column align-items-center justify-content-center border-start-md border-secondary border-opacity-25 pt-2">
                <div className="mb-3 text-center">
                  <span className="text-secondary small d-block mb-2">Classified Sentiment</span>
                  <SentimentBadge sentiment={record.sentiment} size="lg" />
                </div>

                <ConfidenceGauge
                  score={Number(record.confidence) || 0}
                  sentiment={record.sentiment}
                  size={150}
                  label="Confidence Level"
                />

                <span
                  className="badge bg-secondary bg-opacity-25 text-white-50 mt-3 text-capitalize"
                  style={{ fontSize: '0.72rem' }}
                >
                  Source: {(record.source || 'single_input').replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer border-secondary border-opacity-25 pt-2">
            <button type="button" className="btn btn-kansi-glass btn-sm" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
