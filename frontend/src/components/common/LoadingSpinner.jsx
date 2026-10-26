import React from 'react';
import { Cpu } from 'lucide-react';

export default function LoadingSpinner({
  message = 'Analyzing text patterns...',
  subtext = 'Evaluating neural embeddings & GRU gates',
  size = 'md',
}) {
  return (
    <div className="d-flex flex-column align-items-center justify-content-center p-5 text-center">
      <div className="position-relative mb-4">
        {/* Orbital glow pulse */}
        <div
          className="position-absolute top-50 start-50 translate-middle rounded-circle"
          style={{
            width: size === 'lg' ? '90px' : '65px',
            height: size === 'lg' ? '90px' : '65px',
            background: 'radial-gradient(circle, rgba(0, 242, 254, 0.4) 0%, transparent 70%)',
            animation: 'pulse-subtle 1.8s infinite ease-in-out',
          }}
        />
        <div
          className="spinner-border text-info"
          style={{
            width: size === 'lg' ? '60px' : '45px',
            height: size === 'lg' ? '60px' : '45px',
            borderWidth: '3px',
            borderColor: 'rgba(0, 242, 254, 0.2)',
            borderTopColor: '#00F2FE',
          }}
          role="status"
        >
          <span className="visually-hidden">Loading...</span>
        </div>
        <div className="position-absolute top-50 start-50 translate-middle text-cyan">
          <Cpu size={20} color="#00F2FE" />
        </div>
      </div>
      <h4 className="h6 text-white fw-bold mb-1">{message}</h4>
      {subtext && <p className="text-muted small mb-0">{subtext}</p>}
    </div>
  );
}
