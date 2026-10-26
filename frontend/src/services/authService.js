/**
 * KANSEI AI — Authentication Service
 * Manages communication with Flask session authentication endpoints.
 */

import { apiClient, clearCsrfToken } from './api';

export const authService = {
  /**
   * Registers a new user account and establishes server-side session.
   */
  async register({ email, username, full_name, password }) {
    const res = await apiClient('/auth/register', {
      method: 'POST',
      body: { email, username, full_name, password },
    });
    return res.data;
  },

  /**
   * Authenticates user credentials and establishes server-side session.
   */
  async login({ email, password }) {
    const res = await apiClient('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    return res.data;
  },

  /**
   * Terminates active session.
   */
  async logout() {
    try {
      await apiClient('/auth/logout', { method: 'POST' });
    } finally {
      clearCsrfToken();
    }
  },

  /**
   * Retrieves current authenticated user profile from /api/auth/me.
   */
  async getCurrentUser() {
    const res = await apiClient('/auth/me', { method: 'GET' });
    return res.data;
  },
};
