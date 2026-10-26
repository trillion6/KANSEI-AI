import React from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorAlert({ message, onDismiss, title = 'Attention', className = '' }) {
  if (!message) return null;

  return (
    <div
      className={`p-3 mb-4 rounded-3 d-flex align-items-start gap-3 border border-danger border-opacity-40 ${className}`.trim()}
      style={{
        background: 'rgba(244, 63, 94, 0.12)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 8px 24px -4px rgba(244, 63, 94, 0.2)',
      }}
      role="alert"
    >
      <AlertCircle size={20} className="text-danger flex-shrink-0 mt-1" />
      <div className="flex-grow-1">
        <strong className="text-white d-block mb-1">{title}</strong>
        <span className="text-danger-emphasis small" style={{ color: '#FDA4AF' }}>{message}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="btn btn-link text-white-50 p-0 border-0 ms-2"
          aria-label="Dismiss alert"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
}
