import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Activity, 
  BarChart3, 
  ShieldCheck, 
  ArrowRight, 
  Layers, 
  CheckCircle2,
  Lock,
  Zap
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import GlowButton from '../components/common/GlowButton';
import SentimentBadge from '../components/common/SentimentBadge';
import ConfidenceGauge from '../components/analyzer/ConfidenceGauge';
import ProbabilityBar from '../components/analyzer/ProbabilityBar';
import { DEMO_SAMPLE_PRESETS } from '../mock/mockData';

export default function LandingPage() {
  const [selectedPreset, setSelectedPreset] = useState(DEMO_SAMPLE_PRESETS[0]);
  const [inputText, setInputText] = useState(DEMO_SAMPLE_PRESETS[0].text);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setInputText(preset.text);
  };

  return (
    <div className="container-fluid px-3 px-sm-4 px-lg-5 py-4">
      {/* Hero Section */}
      <div className="row align-items-center gy-5 min-vh-75 py-3 py-lg-4">
        <div className="col-12 col-lg-6">
          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3"
            style={{
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.30)',
              boxShadow: '0 0 16px rgba(0, 242, 254, 0.15)',
            }}
          >
            <Sparkles size={14} color="#00F2FE" />
            <span className="small fw-semibold text-gradient-cyan">
              Deep Learning Sentiment Classifier
            </span>
          </div>

          <h1
            className="fw-extrabold text-white mb-3 lh-tight"
            style={{ fontSize: 'clamp(2.1rem, 4.5vw, 3.4rem)', letterSpacing: '-0.03em' }}
          >
            Classify Customer Sentiment with{' '}
            <span className="text-gradient-cyan">Neural Precision</span>
          </h1>

          <p className="lead text-secondary mb-4" style={{ fontSize: '1.15rem', lineHeight: '1.65' }}>
            Transform raw feedback, product reviews, and customer messages into actionable sentiment intelligence. Powered by Bidirectional GRU architectures, real softmax confidence, and comprehensive analytics.
          </p>

          <div className="d-flex flex-wrap align-items-center gap-3 mb-4 mb-lg-5">
            <Link to="/analyzer" className="text-decoration-none">
              <GlowButton variant="primary" size="lg" icon={Activity}>
                Launch Studio
              </GlowButton>
            </Link>
            <Link to="/register" className="text-decoration-none">
              <GlowButton variant="glass" size="lg" icon={ArrowRight}>
                Create Account
              </GlowButton>
            </Link>
          </div>

          {/* Key Value Highlights */}
          <div className="row g-3 pt-3 border-top border-secondary border-opacity-25">
            <div className="col-4">
              <span className="h4 fw-bold text-white d-block mb-0 font-monospace">3-Class</span>
              <span className="text-muted small">Pos / Neu / Neg</span>
            </div>
            <div className="col-4">
              <span className="h4 fw-bold text-cyan d-block mb-0 font-monospace">Bi-GRU</span>
              <span className="text-muted small">Deep Learning</span>
            </div>
            <div className="col-4">
              <span className="h4 fw-bold text-amber d-block mb-0 font-monospace">100%</span>
              <span className="text-muted small">Softmax Scores</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Preview Card */}
        <div className="col-12 col-lg-6">
          <div className="position-relative">
            {/* Ambient Background Glow Orb */}
            <div
              className="position-absolute top-50 start-50 translate-middle rounded-circle"
              style={{
                width: '320px',
                height: '320px',
                background: selectedPreset.sentiment === 'positive'
                  ? 'radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)'
                  : selectedPreset.sentiment === 'negative'
                  ? 'radial-gradient(circle, rgba(244, 63, 94, 0.22) 0%, transparent 70%)'
                  : 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)',
                filter: 'blur(50px)',
                zIndex: 0,
                pointerEvents: 'none',
                transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />

            <GlassCard
              glow={selectedPreset.sentiment === 'positive' ? 'pos' : selectedPreset.sentiment === 'negative' ? 'neg' : 'neu'}
              className="position-relative p-4"
              style={{ zIndex: 1 }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="small text-secondary fw-semibold text-uppercase tracking-wider">
                  Interactive Live Preview
                </span>
                <span
                  className="badge rounded-pill px-2 py-1 small fw-medium"
                  style={{
                    background: 'rgba(0, 242, 254, 0.10)',
                    color: '#38BDF8',
                    border: '1px solid rgba(0, 242, 254, 0.25)',
                    fontSize: '0.72rem',
                  }}
                >
                  Model Telemetry
                </span>
              </div>

              {/* Sample Preset Chips */}
              <div className="d-flex flex-wrap gap-2 mb-3">
                {DEMO_SAMPLE_PRESETS.map((preset, idx) => {
                  const isSelected = selectedPreset.label === preset.label;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`btn btn-sm ${
                        isSelected
                          ? 'btn-kansei-primary'
                          : 'btn-kansei-glass'
                      }`}
                      style={{
                        fontSize: '0.78rem',
                        padding: isSelected ? '5px 12px' : '5px 12px',
                        borderRadius: '20px',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Input Display Area */}
              <div
                className="p-3 rounded-3 mb-4 font-monospace"
                style={{
                  background: 'rgba(7, 11, 25, 0.85)',
                  border: '1px solid var(--border-glass-subtle)',
                  fontSize: '0.88rem',
                  lineHeight: '1.55',
                  color: '#CBD5E1',
                  minHeight: '80px',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
                }}
              >
                "{inputText}"
              </div>

              {/* Prediction Results Panel */}
              <div className="row align-items-center g-3">
                <div className="col-12 col-sm-6 text-center text-sm-start">
                  <span className="text-secondary small d-block mb-2">Classified Sentiment</span>
                  <SentimentBadge sentiment={selectedPreset.sentiment} size="lg" />
                  <div className="mt-3">
                    <ProbabilityBar probabilities={selectedPreset.probabilities} />
                  </div>
                </div>

                <div className="col-12 col-sm-6 d-flex justify-content-center">
                  <ConfidenceGauge
                    score={selectedPreset.confidence}
                    sentiment={selectedPreset.sentiment}
                    size={135}
                    label="Model Confidence"
                  />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Feature Capabilities Grid */}
      <div className="py-5 my-3 my-lg-4">
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold text-white mb-2">Architected for Production AI</h2>
          <p className="text-secondary mx-auto" style={{ maxWidth: '600px' }}>
            Built from the ground up with genuine machine learning pipelines, high-security sessions, and rich data intelligence.
          </p>
        </div>

        <div className="row g-4">
          <div className="col-12 col-md-4">
            <GlassCard interactive className="h-100 p-4" glow="blue">
              <div
                className="p-3 rounded-3 d-inline-flex mb-3"
                style={{
                  background: 'rgba(0, 242, 254, 0.10)',
                  border: '1px solid rgba(0, 242, 254, 0.25)',
                  boxShadow: '0 0 16px rgba(0, 242, 254, 0.15)',
                }}
              >
                <Layers size={24} color="#00F2FE" />
              </div>
              <h3 className="h5 text-white fw-bold mb-2">Deep GRU Classification</h3>
              <p className="text-secondary small mb-0 lh-base">
                Bidirectional Gated Recurrent Unit network trained with spatial dropout and dense softmax activation for nuanced text context understanding.
              </p>
            </GlassCard>
          </div>

          <div className="col-12 col-md-4">
            <GlassCard interactive className="h-100 p-4" glow="amber">
              <div
                className="p-3 rounded-3 d-inline-flex mb-3"
                style={{
                  background: 'rgba(245, 158, 11, 0.10)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  boxShadow: '0 0 16px rgba(245, 158, 11, 0.15)',
                }}
              >
                <BarChart3 size={24} color="#F59E0B" />
              </div>
              <h3 className="h5 text-white fw-bold mb-2">Live Trend Analytics</h3>
              <p className="text-secondary small mb-0 lh-base">
                Visualize multi-day sentiment volume, class distributions, and high-frequency keywords with high-contrast Recharts visualizations.
              </p>
            </GlassCard>
          </div>

          <div className="col-12 col-md-4">
            <GlassCard interactive className="h-100 p-4" glow="pos">
              <div
                className="p-3 rounded-3 d-inline-flex mb-3"
                style={{
                  background: 'rgba(16, 185, 129, 0.10)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  boxShadow: '0 0 16px rgba(16, 185, 129, 0.15)',
                }}
              >
                <ShieldCheck size={24} color="#10B981" />
              </div>
              <h3 className="h5 text-white fw-bold mb-2">Per-User Data Isolation</h3>
              <p className="text-secondary small mb-0 lh-base">
                Secure session cookies, rate-limited endpoints, CSRF defenses, and user-scoped SQLite records with instantaneous CSV export.
              </p>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Call to Action Banner */}
      <GlassCard className="p-4 p-md-5 text-center my-4 my-lg-5 position-relative overflow-hidden" glow="blue">
        <h2 className="display-6 fw-bold text-white mb-3">
          Ready to Analyze Your Customer Feedback?
        </h2>
        <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '540px', lineHeight: '1.6' }}>
          Explore the full sentiment studio, examine multi-line batches, and inspect historical confidence metrics today.
        </p>
        <div className="d-flex flex-wrap justify-content-center gap-3">
          <Link to="/analyzer" className="text-decoration-none">
            <GlowButton variant="primary" size="lg" icon={Sparkles}>
              Start Analyzing Now
            </GlowButton>
          </Link>
          <Link to="/dashboard" className="text-decoration-none">
            <GlowButton variant="glass" size="lg" icon={Activity}>
              Explore Dashboard
            </GlowButton>
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
