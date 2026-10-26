/**
 * KANSEI AI — Sentiment Analysis & Analytics Service
 * Connects React UI to live neural inference, history, and metrics endpoints.
 */

import { apiClient } from './api';

export const sentimentService = {
  /**
   * Submits a single text review to the real Bidirectional GRU model.
   * Automatically persists under the authenticated user session.
   * @param {string} text - The input review or customer text
   * @param {string} source - Source identifier (e.g. 'web_studio')
   * @returns {Promise<Object>} The standardized prediction envelope
   */
  async analyzeText(text, source = 'web_studio') {
    const response = await apiClient('/sentiment/analyze', {
      method: 'POST',
      body: { text, source },
    });
    return response.data;
  },

  /**
   * Submits a batch of reviews for vectorized inference and bulk persistence.
   * @param {string[]} texts - Array of string reviews
   * @returns {Promise<Object>} { items: Array, summary: Object }
   */
  async analyzeBatch(texts) {
    const response = await apiClient('/sentiment/batch', {
      method: 'POST',
      body: { texts },
    });
    return response.data;
  },

  /**
   * Retrieves the authenticated user's paginated analysis history.
   */
  async getHistory({ page = 1, per_page = 10, sentiment = 'all', search = '', sort = 'date-desc' } = {}) {
    const params = new URLSearchParams();
    if (page) params.append('page', page);
    if (per_page) params.append('per_page', per_page);
    if (sentiment && sentiment !== 'all') params.append('sentiment', sentiment);
    if (search) params.append('search', search);
    if (sort) params.append('sort', sort);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient(`/sentiment/history${query}`, { method: 'GET' });
    return response.data;
  },

  /**
   * Retrieves detail for a single analysis record owned by the user.
   */
  async getHistoryDetail(id) {
    const response = await apiClient(`/sentiment/history/${id}`, { method: 'GET' });
    return response.data;
  },

  /**
   * Deletes a specific history record owned by the authenticated user.
   */
  async deleteHistory(id) {
    const response = await apiClient(`/sentiment/history/${id}`, { method: 'DELETE' });
    return response.data;
  },

  /**
   * Retrieves dashboard analytics computed strictly for the current user.
   */
  async getAnalyticsMetrics() {
    const response = await apiClient('/analytics/metrics', { method: 'GET' });
    return response.data;
  },

  /**
   * Returns export CSV endpoint URL.
   */
  getExportUrl() {
    return '/api/analytics/export';
  },
};
