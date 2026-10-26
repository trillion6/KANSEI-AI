import React from 'react';
import { Shield, Activity, GitBranch } from 'lucide-react';

export default function Footer() {
  return (
    <footer
      className="mt-auto py-4"
      style={{
        background: 'rgba(7, 11, 25, 0.90)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border-glass-subtle)',
      }}
    >
      <div className="container-fluid px-3 px-sm-4 px-lg-5">
        <div className="row align-items-center gy-3">
          <div className="col-12 col-md-6 d-flex flex-wrap align-items-center gap-2 gap-sm-3">
            <div className="d-flex align-items-center gap-2">
              <img
                src="/kansei-logo.png"
                alt="KANSEI AI"
                style={{
                  height: '24px',
                  width: 'auto',
                  maxHeight: '24px',
                  objectFit: 'contain',
                  display: 'block',
                  filter: 'drop-shadow(0 0 6px rgba(0, 242, 254, 0.25))',
                }}
              />
              <span className="fw-bold text-white small tracking-tight">KANSEI AI</span>
            </div>
            <span className="text-muted small d-none d-sm-inline">|</span>
            <span className="text-secondary small">
              Intelligent Sentiment Analyzer &copy; {new Date().getFullYear()}
            </span>
          </div>

          <div className="col-12 col-md-6 d-flex flex-wrap align-items-center justify-content-start justify-content-md-end gap-2 gap-sm-3">
            <span
              className="badge d-inline-flex align-items-center gap-1 py-1 px-2 rounded-pill"
              style={{
                background: 'rgba(0, 242, 254, 0.08)',
                color: '#38BDF8',
                border: '1px solid rgba(0, 242, 254, 0.25)',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              <GitBranch size={12} />
              Platform v1.0
            </span>
            <span
              className="badge d-inline-flex align-items-center gap-1 py-1 px-2 rounded-pill"
              style={{
                background: 'rgba(245, 158, 11, 0.08)',
                color: '#FBBF24',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              <Activity size={12} />
              Bi-GRU Model
            </span>
            <span
              className="badge d-inline-flex align-items-center gap-1 py-1 px-2 rounded-pill"
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-glass-subtle)',
                fontSize: '0.75rem',
                fontWeight: 500,
              }}
            >
              <Shield size={12} />
              Server-Side Session
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
