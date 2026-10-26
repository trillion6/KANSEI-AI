import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Sparkles, 
  Trash2, 
  Copy, 
  Bookmark, 
  Layers, 
  Check, 
  HelpCircle,
  Download,
  AlertTriangle,
  Send,
  FileText,
  BarChart2
} from 'lucide-react';
import GlassCard from '../components/common/GlassCard';
import GlowButton from '../components/common/GlowButton';
import SentimentBadge from '../components/common/SentimentBadge';
import ConfidenceGauge from '../components/analyzer/ConfidenceGauge';
import ProbabilityBar from '../components/analyzer/ProbabilityBar';
import EmptyState from '../components/common/EmptyState';
import ErrorAlert from '../components/common/ErrorAlert';
import { sentimentService } from '../services/sentimentService';
import { DEMO_SAMPLE_PRESETS } from '../mock/mockData';

// 15 Standard customer reviews for comprehensive batch testing
const SAMPLE_15_REVIEWS = [
  "The product quality is excellent, and delivery was fast, but the packaging was damaged.",
  "I received my order yesterday. The product looks exactly like the pictures.",
  "I love the design and performance, but the battery drains too quickly.",
  "The customer service was disappointing, although the product itself is quite good.",
  "The price is reasonable, and the product works as expected.",
  "I am very happy with my purchase. Everything was perfect.",
  "The delivery arrived three days late, and nobody informed me about the delay.",
  "The product comes in three different colours and two sizes.",
  "The food tasted great, but the restaurant staff were rude.",
  "The application is easy to use, but sometimes it crashes unexpectedly.",
  "I ordered a black shirt in medium size, and it arrived this morning.",
  "The quality is average, the price is acceptable, and delivery was on time.",
  "Excellent customer support! They solved my problem quickly and politely.",
  "The headphones look premium, but the sound quality is worse than I expected.",
  "The product works fine. I have been using it for a week without any major issues."
];

export default function AnalyzerPage() {
  const [activeTab, setActiveTab] = useState('single'); // 'single' | 'batch'
  const [inputText, setInputText] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [batchResults, setBatchResults] = useState([]);
  const [batchSummary, setBatchSummary] = useState(null);
  const [result, setResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const wordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const charCount = inputText.length;
  const maxChars = 2000;

  // Detect if user pasted multiple numbered/bulleted reviews into Single Text mode
  const detectedMultipleReviews = useMemo(() => {
    if (!inputText.trim()) return [];
    const lines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    // Identify lines starting with numbers like "1.", "1)", "[1]"
    const numberedLines = lines.filter((l) => /^(?:\d+[\.\)]|\[\d+\])\s+\S+/.test(l));
    return numberedLines.length >= 2 ? lines : [];
  }, [inputText]);

  const handleSwitchToBatch = () => {
    // Strip leading numbering for clean batch formatting
    const cleanedLines = detectedMultipleReviews.map((l) =>
      l.replace(/^(?:\d+[\.\)]|\[\d+\])\s*/, '').trim()
    ).filter((l) => l.length > 0);

    setBatchInput(cleanedLines.join('\n'));
    setActiveTab('batch');
    setError('');
  };

  const handlePresetSelect = (preset) => {
    setInputText(preset.text);
    setResult(null);
    setError('');
  };

  const handleClear = () => {
    setInputText('');
    setResult(null);
    setSaved(false);
    setError('');
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    setSaved(false);
    setError('');

    try {
      const data = await sentimentService.analyzeText(inputText.trim());
      setResult({
        ...data,
        wordCount: data.word_count || (inputText.trim() ? inputText.trim().split(/\s+/).length : 0),
        charCount: data.char_count || inputText.length,
        analyzedAt: new Date().toLocaleTimeString(),
        isRealModel: true,
      });
      if (data.saved) {
        setSaved(true);
      }
    } catch (err) {
      setError(err.message || 'Error occurred while communicating with the neural sentiment model.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleBatchAnalyze = async (e) => {
    e.preventDefault();
    const lines = batchInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setError('Please provide at least one review (one per line) for batch analysis.');
      return;
    }

    if (lines.length > 100) {
      setError(`Batch size exceeds the maximum limit of 100 items (found ${lines.length}).`);
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      const data = await sentimentService.analyzeBatch(lines);
      setBatchResults(data.items || []);
      setBatchSummary(data.summary || null);
    } catch (err) {
      setError(err.message || 'Batch inference error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCopyResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(
      `Sentiment: ${result.sentiment.toUpperCase()}\nConfidence: ${result.confidence}%\nText: "${result.text}"`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToHistory = () => {
    setSaved(true);
  };

  const handleExportBatchCSV = () => {
    if (batchResults.length === 0) return;
    const header = 'index,text,sentiment,confidence_pct,prob_positive,prob_neutral,prob_negative\n';
    const rows = batchResults.map((item, idx) => {
      const itemNum = idx + 1;
      const safeText = `"${(item.text || '').replace(/"/g, '""')}"`;
      const pos = item.probabilities?.positive ?? 0;
      const neu = item.probabilities?.neutral ?? 0;
      const neg = item.probabilities?.negative ?? 0;
      return `${itemNum},${safeText},${item.sentiment},${item.confidence},${pos},${neu},${neg}`;
    }).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `kansei_batch_results_${batchResults.length}_items.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Batch aggregate metrics calculations
  const totalAnalyzed = batchResults.length;
  const posCount = batchSummary?.positive_count ?? batchResults.filter((r) => r.sentiment === 'positive').length;
  const neuCount = batchSummary?.neutral_count ?? batchResults.filter((r) => r.sentiment === 'neutral').length;
  const negCount = batchSummary?.negative_count ?? batchResults.filter((r) => r.sentiment === 'negative').length;

  const posPct = totalAnalyzed > 0 ? ((posCount / totalAnalyzed) * 100).toFixed(1) : '0.0';
  const neuPct = totalAnalyzed > 0 ? ((neuCount / totalAnalyzed) * 100).toFixed(1) : '0.0';
  const negPct = totalAnalyzed > 0 ? ((negCount / totalAnalyzed) * 100).toFixed(1) : '0.0';

  const avgConfidence = totalAnalyzed > 0
    ? (batchResults.reduce((acc, r) => acc + (Number(r.confidence) || 0), 0) / totalAnalyzed).toFixed(1)
    : '0.0';

  return (
    <div className="container-fluid px-3 px-sm-4 px-lg-5 py-4">
      {/* Studio Header & Mode Selector */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 text-white fw-bold mb-1 d-flex align-items-center gap-2">
            <Activity size={26} color="#00F2FE" />
            <span>Sentiment Analysis Studio</span>
          </h1>
          <p className="text-secondary small mb-0">
            {activeTab === 'single'
              ? 'Single Text Mode: Analyzes one review or customer document as a single unit.'
              : 'Batch Analysis Mode: Analyzes multiple reviews independently with aggregate telemetry.'}
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div
          className="d-inline-flex p-1 rounded-3"
          style={{
            background: 'rgba(7, 11, 25, 0.85)',
            border: '1px solid var(--border-glass-subtle)',
          }}
        >
          <button
            type="button"
            className={`btn btn-sm d-flex align-items-center gap-1 ${
              activeTab === 'single'
                ? 'btn-kansei-primary'
                : 'btn-link text-secondary text-decoration-none'
            }`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => setActiveTab('single')}
          >
            <FileText size={14} />
            <span>Single Text</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm d-flex align-items-center gap-1 ${
              activeTab === 'batch'
                ? 'btn-kansei-primary'
                : 'btn-link text-secondary text-decoration-none'
            }`}
            style={{ fontSize: '0.85rem' }}
            onClick={() => setActiveTab('batch')}
          >
            <Layers size={14} />
            <span>Batch Analysis</span>
          </button>
        </div>
      </div>

      {activeTab === 'single' ? (
        /* ==========================================================================
           SINGLE TEXT MODE
           ========================================================================== */
        <div className="row g-4">
          {/* Input Configuration Panel */}
          <div className="col-12 col-lg-6">
            <GlassCard
              header="Input Text / Review"
              headerAction={
                <span className="text-muted small">Max {maxChars} Chars</span>
              }
              className="h-100 p-4"
            >
              <ErrorAlert message={error} onDismiss={() => setError('')} />

              {/* Preset Sample Quick Chips */}
              <div className="mb-3">
                <span className="text-secondary small d-block mb-2 fw-medium">
                  Quick Load Demo Presets:
                </span>
                <div className="d-flex flex-wrap gap-2">
                  {DEMO_SAMPLE_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handlePresetSelect(preset)}
                      className="btn btn-sm btn-kansei-glass text-secondary"
                      style={{ fontSize: '0.78rem' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Input Area */}
              <form onSubmit={handleAnalyze}>
                <div className="mb-3 position-relative">
                  <textarea
                    className="form-control form-control-glass font-monospace"
                    rows={7}
                    maxLength={maxChars}
                    placeholder="Paste or type a single customer review, survey feedback, or message here to analyze its sentiment..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    style={{ resize: 'vertical' }}
                    required
                  />
                  <div
                    className="d-flex justify-content-between align-items-center mt-2 px-1 text-muted small"
                    style={{ fontSize: '0.75rem' }}
                  >
                    <span>
                      {wordCount} words | {charCount} / {maxChars} characters
                    </span>
                    {charCount > 1800 && (
                      <span className="text-warning">Approaching character limit</span>
                    )}
                  </div>
                </div>

                {/* Multiple Numbered Reviews Advisory Alert */}
                {detectedMultipleReviews.length >= 2 && (
                  <div
                    className="p-3 rounded-3 mb-3 d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3"
                    style={{
                      background: 'rgba(0, 242, 254, 0.08)',
                      border: '1px solid rgba(0, 242, 254, 0.30)',
                      boxShadow: '0 0 16px rgba(0, 242, 254, 0.12)',
                    }}
                  >
                    <div className="d-flex align-items-start gap-2">
                      <AlertTriangle size={18} color="#00F2FE" className="flex-shrink-0 mt-1" />
                      <div>
                        <span className="small fw-bold text-white d-block">
                          Multiple Reviews Detected ({detectedMultipleReviews.length} items)
                        </span>
                        <span className="text-secondary small" style={{ fontSize: '0.78rem', lineHeight: '1.4' }}>
                          Single Text mode evaluates all lines as one combined document. Switch to Batch Analysis to classify each review independently.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleSwitchToBatch}
                      className="btn btn-sm btn-kansei-primary text-nowrap flex-shrink-0 align-self-start align-self-sm-center"
                      style={{ fontSize: '0.80rem' }}
                    >
                      Switch to Batch Mode →
                    </button>
                  </div>
                )}

                <div className="d-flex gap-2">
                  <GlowButton
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isAnalyzing}
                    disabled={!inputText.trim()}
                    icon={Sparkles}
                    className="flex-grow-1"
                  >
                    Run Sentiment Analysis
                  </GlowButton>

                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={!inputText}
                    className="btn btn-kansei-glass px-3"
                    title="Clear input"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </form>

              <div
                className="mt-4 p-3 rounded-3 border border-secondary border-opacity-25"
                style={{ background: 'rgba(255, 255, 255, 0.02)' }}
              >
                <div className="d-flex align-items-center gap-2 mb-1 text-secondary small fw-medium">
                  <HelpCircle size={15} color="#00F2FE" />
                  <span>Pipeline Architecture</span>
                </div>
                <p className="text-muted small mb-0" style={{ fontSize: '0.78rem' }}>
                  Input text undergoes NLTK regex sanitization, token sequence padding, and passes into a Bidirectional GRU yielding softmax probabilities across Positive, Neutral, and Negative classes.
                </p>
              </div>
            </GlassCard>
          </div>

          {/* Result Panel */}
          <div className="col-12 col-lg-6">
            <GlassCard
              header="Analysis Result & Metrics"
              headerAction={
                result && (
                  <span className="badge bg-secondary bg-opacity-25 text-white-50 small">
                    {result.analyzedAt}
                  </span>
                )
              }
              glow={
                result
                  ? result.sentiment === 'positive'
                    ? 'pos'
                    : result.sentiment === 'negative'
                    ? 'neg'
                    : 'neu'
                  : 'none'
              }
              className="h-100 p-4"
            >
              {result ? (
                <div>
                  {/* Model & Persistence Status Header */}
                  <div
                    className="d-flex justify-content-between align-items-center mb-3 p-2 rounded-2"
                    style={{ background: 'rgba(0, 242, 254, 0.08)', border: '1px solid rgba(0, 242, 254, 0.2)' }}
                  >
                    <span className="badge bg-cyan text-dark fw-bold">LIVE GRU MODEL (v1.0.0)</span>
                    <span className="text-secondary small">
                      {result.saved ? `Persisted to history (#${result.id})` : 'Inference Mode'}
                    </span>
                  </div>

                  {/* Top Sentiment Highlight */}
                  <div className="text-center py-2 mb-3">
                    <span className="text-secondary small d-block mb-2 text-uppercase tracking-wider">
                      Predicted Class
                    </span>
                    <SentimentBadge sentiment={result.sentiment} size="lg" />
                  </div>

                  {/* Confidence Gauge */}
                  <div className="my-3">
                    <ConfidenceGauge
                      score={result.confidence}
                      sentiment={result.sentiment}
                      size={160}
                      label="Softmax Confidence Score"
                    />
                  </div>

                  {/* 3-Class Probability Distribution */}
                  <div className="mb-4">
                    <ProbabilityBar probabilities={result.probabilities} />
                  </div>

                  {/* Keyword Tokens */}
                  {result.keywords && result.keywords.length > 0 && (
                    <div className="mb-4">
                      <span className="text-secondary small d-block mb-2 fw-medium">
                        Salient Sentiment Tokens:
                      </span>
                      <div className="d-flex flex-wrap gap-2">
                        {result.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="badge bg-white bg-opacity-10 text-cyan border border-info border-opacity-25 font-monospace"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="d-flex gap-2 pt-3 border-top border-secondary border-opacity-25">
                    <button
                      type="button"
                      onClick={handleCopyResult}
                      className="btn btn-sm btn-kansei-glass flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    >
                      {copied ? <Check size={16} color="#10B981" /> : <Copy size={16} />}
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Result'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveToHistory}
                      className="btn btn-sm btn-kansei-glass flex-grow-1 d-flex align-items-center justify-content-center gap-2"
                    >
                      {saved ? <Check size={16} color="#10B981" /> : <Bookmark size={16} />}
                      <span>{saved ? 'Saved to History' : 'Save Record'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Activity}
                  title="Awaiting Input Text"
                  description="Submit text in the input panel or select a quick demonstration preset to view the deep learning prediction matrix."
                  actionLabel="Load Sample Review"
                  onAction={() => handlePresetSelect(DEMO_SAMPLE_PRESETS[0])}
                />
              )}
            </GlassCard>
          </div>
        </div>
      ) : (
        /* ==========================================================================
           BATCH ANALYSIS MODE
           ========================================================================== */
        <div className="row g-4">
          {/* Batch Input Configuration */}
          <div className="col-12 col-lg-5">
            <GlassCard
              header="Batch Reviews Input"
              headerAction={<span className="text-muted small">One entry per line</span>}
              className="h-100 p-4"
            >
              <ErrorAlert message={error} onDismiss={() => setError('')} />

              {/* Sample Batch Quick Loaders */}
              <div className="mb-3">
                <span className="text-secondary small d-block mb-2 fw-medium">
                  Load Test Batches:
                </span>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchInput(SAMPLE_15_REVIEWS.join('\n'))}
                    className="btn btn-sm btn-kansei-glass text-cyan"
                    style={{ fontSize: '0.78rem' }}
                    title="Load 15 individual customer reviews"
                  >
                    <Sparkles size={12} className="me-1" />
                    Load 15-Review Benchmark
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setBatchInput(
                        `The display brightness and battery life are phenomenal!\nAverage sound quality, neither bad nor exceptional.\nCustomer service refused to honor the warranty replacement.`
                      )
                    }
                    className="btn btn-sm btn-kansei-glass text-secondary"
                    style={{ fontSize: '0.78rem' }}
                  >
                    Load 3 Sample Reviews
                  </button>
                </div>
              </div>

              <form onSubmit={handleBatchAnalyze}>
                <div className="mb-3">
                  <textarea
                    className="form-control form-control-glass font-monospace small"
                    rows={12}
                    placeholder={`The headphones are absolutely incredible!\nDelivery was delayed by 3 days and packaging was torn.\nDevice manual is included in the box.`}
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    required
                  />
                  <div className="d-flex justify-content-between align-items-center mt-2 text-muted small" style={{ fontSize: '0.75rem' }}>
                    <span>
                      {batchInput.trim() ? batchInput.split('\n').filter((l) => l.trim().length > 0).length : 0} lines detected
                    </span>
                    <span>Max 100 entries per batch</span>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <GlowButton
                    type="submit"
                    variant="primary"
                    size="md"
                    className="flex-grow-1"
                    isLoading={isAnalyzing}
                    disabled={!batchInput.trim()}
                    icon={Layers}
                  >
                    Analyze All Reviews
                  </GlowButton>

                  <button
                    type="button"
                    onClick={() => {
                      setBatchInput('');
                      setBatchResults([]);
                      setBatchSummary(null);
                      setError('');
                    }}
                    disabled={!batchInput && batchResults.length === 0}
                    className="btn btn-kansei-glass px-3"
                    title="Clear batch input and results"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </form>
            </GlassCard>
          </div>

          {/* Batch Results & Aggregate Analytics Panel */}
          <div className="col-12 col-lg-7">
            <GlassCard
              header={`Batch Results (${batchResults.length})`}
              headerAction={
                batchResults.length > 0 && (
                  <div className="d-flex align-items-center gap-2">
                    <button
                      type="button"
                      onClick={handleExportBatchCSV}
                      className="btn btn-sm btn-kansei-glass py-1 px-2 d-flex align-items-center gap-1 text-cyan"
                      style={{ fontSize: '0.75rem' }}
                      title="Export batch items and probabilities to CSV"
                    >
                      <Download size={13} />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBatchResults([]);
                        setBatchSummary(null);
                      }}
                      className="btn btn-link text-muted small p-0 text-decoration-none"
                    >
                      Clear
                    </button>
                  </div>
                )
              }
              className="h-100 p-4"
            >
              {batchResults.length > 0 ? (
                <div>
                  {/* Task 2: Aggregate Batch Telemetry Summary */}
                  <div
                    className="p-3 rounded-3 mb-4"
                    style={{
                      background: 'rgba(7, 11, 25, 0.85)',
                      border: '1px solid var(--border-glass-medium)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="small text-secondary fw-semibold text-uppercase tracking-wider">
                        Aggregate Batch Telemetry
                      </span>
                      <span className="badge rounded-pill bg-cyan bg-opacity-10 text-cyan border border-info border-opacity-25 small">
                        {totalAnalyzed} Reviews Processed
                      </span>
                    </div>

                    {/* Summary Metric Cards */}
                    <div className="row g-2 text-center mb-3">
                      <div className="col-6 col-sm-3">
                        <div
                          className="p-2 rounded-2 border"
                          style={{
                            background: 'rgba(16, 185, 129, 0.08)',
                            borderColor: 'rgba(16, 185, 129, 0.25)',
                          }}
                        >
                          <span className="d-block text-success fw-bold font-monospace fs-5">
                            {posCount}{' '}
                            <span className="fs-8 fw-normal">({posPct}%)</span>
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.70rem' }}>
                            Positive
                          </span>
                        </div>
                      </div>

                      <div className="col-6 col-sm-3">
                        <div
                          className="p-2 rounded-2 border"
                          style={{
                            background: 'rgba(245, 158, 11, 0.08)',
                            borderColor: 'rgba(245, 158, 11, 0.25)',
                          }}
                        >
                          <span className="d-block text-warning fw-bold font-monospace fs-5">
                            {neuCount}{' '}
                            <span className="fs-8 fw-normal">({neuPct}%)</span>
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.70rem' }}>
                            Neutral
                          </span>
                        </div>
                      </div>

                      <div className="col-6 col-sm-3">
                        <div
                          className="p-2 rounded-2 border"
                          style={{
                            background: 'rgba(244, 63, 94, 0.08)',
                            borderColor: 'rgba(244, 63, 94, 0.25)',
                          }}
                        >
                          <span className="d-block text-danger fw-bold font-monospace fs-5">
                            {negCount}{' '}
                            <span className="fs-8 fw-normal">({negPct}%)</span>
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.70rem' }}>
                            Negative
                          </span>
                        </div>
                      </div>

                      <div className="col-6 col-sm-3">
                        <div
                          className="p-2 rounded-2 border"
                          style={{
                            background: 'rgba(0, 242, 254, 0.08)',
                            borderColor: 'rgba(0, 242, 254, 0.25)',
                          }}
                        >
                          <span className="d-block text-cyan fw-bold font-monospace fs-5">
                            {avgConfidence}%
                          </span>
                          <span className="text-muted small" style={{ fontSize: '0.70rem' }}>
                            Avg Model Confidence
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stacked Aggregate Ratio Track */}
                    <div
                      className="progress rounded-pill overflow-hidden mb-2"
                      style={{ height: '8px', background: 'rgba(255, 255, 255, 0.06)' }}
                    >
                      <div
                        className="progress-bar"
                        style={{
                          width: `${posPct}%`,
                          background: 'var(--sentiment-pos)',
                          transition: 'width 0.4s ease',
                        }}
                        title={`Positive: ${posPct}%`}
                      />
                      <div
                        className="progress-bar"
                        style={{
                          width: `${neuPct}%`,
                          background: 'var(--sentiment-neu)',
                          transition: 'width 0.4s ease',
                        }}
                        title={`Neutral: ${neuPct}%`}
                      />
                      <div
                        className="progress-bar"
                        style={{
                          width: `${negPct}%`,
                          background: 'var(--sentiment-neg)',
                          transition: 'width 0.4s ease',
                        }}
                        title={`Negative: ${negPct}%`}
                      />
                    </div>

                    <div className="d-flex justify-content-between text-muted" style={{ fontSize: '0.72rem' }}>
                      <span>Distribution: {posPct}% Pos / {neuPct}% Neu / {negPct}% Neg</span>
                      <span>Note: Reflects average model confidence across predictions, not guaranteed accuracy.</span>
                    </div>
                  </div>

                  {/* Task 3: Individual Predictions Table */}
                  <div className="table-responsive" style={{ maxHeight: '420px' }}>
                    <table className="table table-glass align-middle mb-0">
                      <thead>
                        <tr>
                          <th style={{ width: '45px' }}>#</th>
                          <th>Review Text</th>
                          <th style={{ width: '110px' }}>Sentiment</th>
                          <th style={{ width: '150px' }}>3-Class Scores</th>
                          <th style={{ width: '110px' }} className="text-end">Model Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {batchResults.map((item, idx) => (
                          <tr key={item.id ?? item.index ?? idx}>
                            <td className="font-monospace text-cyan small">
                              #{idx + 1}
                            </td>
                            <td style={{ maxWidth: '260px' }} className="text-truncate" title={item.text}>
                              "{item.text}"
                            </td>
                            <td>
                              <SentimentBadge sentiment={item.sentiment} size="sm" />
                            </td>
                            <td>
                              <div
                                className="d-flex align-items-center gap-1 font-monospace"
                                style={{ fontSize: '0.72rem' }}
                                title="Softmax class probabilities (Positive / Neutral / Negative)"
                              >
                                <span className="text-success" title="Positive probability">
                                  P:{((item.probabilities?.positive ?? 0) * 100).toFixed(0)}%
                                </span>
                                <span className="text-muted">/</span>
                                <span className="text-warning" title="Neutral probability">
                                  N:{((item.probabilities?.neutral ?? 0) * 100).toFixed(0)}%
                                </span>
                                <span className="text-muted">/</span>
                                <span className="text-danger" title="Negative probability">
                                  Neg:{((item.probabilities?.negative ?? 0) * 100).toFixed(0)}%
                                </span>
                              </div>
                            </td>
                            <td className="text-end">
                              <span className="font-monospace text-white fw-bold small d-block">
                                {Number(item.confidence || 0).toFixed(1)}%
                              </span>
                              <span className="text-muted" style={{ fontSize: '0.68rem' }}>
                                max score
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={Layers}
                  title="No Batch Processed"
                  description="Paste multiple customer reviews (one per line) in the left panel and click 'Analyze All Reviews' to process them independently."
                  actionLabel="Fill 15-Review Benchmark"
                  onAction={() => setBatchInput(SAMPLE_15_REVIEWS.join('\n'))}
                />
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}
