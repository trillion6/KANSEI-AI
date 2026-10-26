/**
 * KANSEI AI — Phase 2 Demonstration Dataset
 * ============================================================================
 * NOTE: This mock data is strictly for frontend prototyping and layout validation
 * in Phase 2. In Phase 3, 5 & 7, these will be replaced with real Flask API
 * calls and TensorFlow/Keras GRU model inference.
 * ============================================================================
 */

export const DEMO_METRICS = {
  totalAnalyses: 1248,
  positiveCount: 684,
  neutralCount: 298,
  negativeCount: 266,
  positivePct: 54.8,
  neutralPct: 23.9,
  negativePct: 21.3,
  avgConfidence: 89.4,
  modelStatus: 'Demonstration Mode',
};

export const DEMO_SAMPLE_PRESETS = [
  {
    label: 'Positive Review (Electronics)',
    sentiment: 'positive',
    text: 'The battery life on this device exceeded all my expectations! Super smooth interface and crisp sound quality. Absolutely worth every single penny.',
    probabilities: { positive: 0.942, neutral: 0.041, negative: 0.017 },
    confidence: 94.2,
    keywords: ['exceeded', 'smooth', 'crisp', 'worth'],
  },
  {
    label: 'Neutral Review (Shipping / Spec)',
    sentiment: 'neutral',
    text: 'Package arrived on Tuesday in standard brown packaging. Contains the 120W power adapter and the manual as described in the specs.',
    probabilities: { positive: 0.078, neutral: 0.852, negative: 0.070 },
    confidence: 85.2,
    keywords: ['arrived', 'standard', 'manual', 'described'],
  },
  {
    label: 'Negative Review (Customer Support)',
    sentiment: 'negative',
    text: 'Extremely frustrated with the delayed response from technical support. The app crashed three times today and erased my unsaved draft.',
    probabilities: { positive: 0.012, neutral: 0.053, negative: 0.935 },
    confidence: 93.5,
    keywords: ['frustrated', 'delayed', 'crashed', 'erased'],
  },
];

export const DEMO_HISTORY_RECORDS = [
  {
    id: 'KNS-1049',
    text: 'The battery life on this device exceeded all my expectations! Super smooth interface and crisp sound quality. Absolutely worth every single penny.',
    sentiment: 'positive',
    confidence: 94.2,
    probabilities: { positive: 0.942, neutral: 0.041, negative: 0.017 },
    wordCount: 23,
    charCount: 147,
    createdAt: '2026-10-26 21:14:00',
    source: 'web_studio',
  },
  {
    id: 'KNS-1048',
    text: 'Package arrived on Tuesday in standard brown packaging. Contains the 120W power adapter and the manual as described in the specs.',
    sentiment: 'neutral',
    confidence: 85.2,
    probabilities: { positive: 0.078, neutral: 0.852, negative: 0.070 },
    wordCount: 20,
    charCount: 130,
    createdAt: '2026-10-26 19:40:22',
    source: 'api_batch',
  },
  {
    id: 'KNS-1047',
    text: 'Extremely frustrated with the delayed response from technical support. The app crashed three times today and erased my unsaved draft.',
    sentiment: 'negative',
    confidence: 93.5,
    probabilities: { positive: 0.012, neutral: 0.053, negative: 0.935 },
    wordCount: 21,
    charCount: 138,
    createdAt: '2026-10-26 18:22:15',
    source: 'web_studio',
  },
  {
    id: 'KNS-1046',
    text: 'Setup took about 10 minutes. Works fine so far, standard Bluetooth connection with no noticeable lag.',
    sentiment: 'positive',
    confidence: 81.0,
    probabilities: { positive: 0.810, neutral: 0.155, negative: 0.035 },
    wordCount: 15,
    charCount: 102,
    createdAt: '2026-10-26 16:05:40',
    source: 'web_studio',
  },
  {
    id: 'KNS-1045',
    text: 'The color is slightly darker than the product photos, but the material and build quality match the dimensions in the catalog.',
    sentiment: 'neutral',
    confidence: 78.4,
    probabilities: { positive: 0.116, neutral: 0.784, negative: 0.100 },
    wordCount: 20,
    charCount: 126,
    createdAt: '2026-10-25 22:19:10',
    source: 'api_batch',
  },
  {
    id: 'KNS-1044',
    text: 'Terrible build quality. The plastic hinge cracked on the second day of normal use. I am requesting an immediate refund.',
    sentiment: 'negative',
    confidence: 96.8,
    probabilities: { positive: 0.008, neutral: 0.024, negative: 0.968 },
    wordCount: 21,
    charCount: 121,
    createdAt: '2026-10-25 15:44:33',
    source: 'web_studio',
  },
  {
    id: 'KNS-1043',
    text: 'Exceptional performance! Rendering 4K video exports in half the time compared to my previous rig. Couldn\'t be happier.',
    sentiment: 'positive',
    confidence: 97.4,
    probabilities: { positive: 0.974, neutral: 0.018, negative: 0.008 },
    wordCount: 19,
    charCount: 119,
    createdAt: '2026-10-24 11:10:05',
    source: 'web_studio',
  },
  {
    id: 'KNS-1042',
    text: 'Firmware version 2.4 was released yesterday. Installed without any reboot issues. Features remain largely unchanged.',
    sentiment: 'neutral',
    confidence: 88.6,
    probabilities: { positive: 0.062, neutral: 0.886, negative: 0.052 },
    wordCount: 16,
    charCount: 115,
    createdAt: '2026-10-23 09:30:18',
    source: 'api_batch',
  },
];

export const DEMO_TRENDS_DATA = [
  { date: 'Oct 14', positive: 42, neutral: 18, negative: 12 },
  { date: 'Oct 16', positive: 48, neutral: 22, negative: 16 },
  { date: 'Oct 18', positive: 55, neutral: 19, negative: 20 },
  { date: 'Oct 20', positive: 61, neutral: 25, negative: 15 },
  { date: 'Oct 22', positive: 70, neutral: 28, negative: 18 },
  { date: 'Oct 24', positive: 65, neutral: 24, negative: 22 },
  { date: 'Oct 26', positive: 78, neutral: 27, negative: 14 },
];

export const DEMO_DISTRIBUTION_DATA = [
  { name: 'Positive', value: 684, color: '#10B981' },
  { name: 'Neutral', value: 298, color: '#F59E0B' },
  { name: 'Negative', value: 266, color: '#F43F5E' },
];

export const DEMO_FREQUENT_WORDS = [
  { word: 'excellent', count: 184, sentiment: 'positive' },
  { word: 'battery', count: 162, sentiment: 'neutral' },
  { word: 'fast', count: 145, sentiment: 'positive' },
  { word: 'crashed', count: 112, sentiment: 'negative' },
  { word: 'standard', count: 98, sentiment: 'neutral' },
  { word: 'delayed', count: 91, sentiment: 'negative' },
  { word: 'smooth', count: 86, sentiment: 'positive' },
  { word: 'refund', count: 74, sentiment: 'negative' },
];

export const DEMO_USER_PROFILE = {
  name: 'Alex Vance',
  username: 'alex.vance',
  email: 'alex.vance@kansei.ai',
  role: 'AI Quality Lead',
  memberSince: 'October 2026',
  avatarUrl: null,
  preferences: {
    confidenceThreshold: 85,
    autoSaveHistory: true,
    theme: 'Dark Navy Glass',
    emailAlerts: false,
  },
};
