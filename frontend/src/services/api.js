/**
 * KANSEI AI — Base API Client
 * Manages HTTP communication with the Flask backend, including:
 * - Credentials (session cookies) on all requests
 * - Automatic CSRF token retrieval and header attachment
 * - Standardized error unwrapping
 */

const API_BASE_URL = '/api';

let cachedCsrfToken = null;

/**
 * Retrieves a fresh CSRF token from the server or returns cached token.
 */
export async function getCsrfToken(forceRefresh = false) {
  if (cachedCsrfToken && !forceRefresh) {
    return cachedCsrfToken;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' },
    });
    if (res.ok) {
      const json = await res.json();
      cachedCsrfToken = json?.data?.csrf_token || null;
      return cachedCsrfToken;
    }
  } catch (err) {
    console.warn('Could not retrieve CSRF token:', err);
  }
  return null;
}

export function clearCsrfToken() {
  cachedCsrfToken = null;
}

/**
 * Core API request client wrapper
 */
export async function apiClient(endpoint, { method = 'GET', body, headers = {}, ...customConfig } = {}) {
  const upperMethod = method.toUpperCase();
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(upperMethod);

  const reqHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...headers,
  };

  // Attach CSRF token for state-changing requests
  if (isStateChanging && !reqHeaders['X-CSRF-Token']) {
    const token = await getCsrfToken();
    if (token) {
      reqHeaders['X-CSRF-Token'] = token;
    }
  }

  const config = {
    method: upperMethod,
    credentials: 'include', // Mandate cookie inclusion for session auth
    headers: reqHeaders,
    ...customConfig,
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    let data = null;

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      // If CSRF error and we haven't retried yet, refresh token and retry once
      if (response.status === 400 && data?.message?.toLowerCase().includes('csrf') && !customConfig._retried) {
        cachedCsrfToken = null;
        const freshToken = await getCsrfToken(true);
        if (freshToken) {
          return apiClient(endpoint, {
            ...customConfig,
            method,
            body,
            headers: { ...headers, 'X-CSRF-Token': freshToken },
            _retried: true,
          });
        }
      }

      const errorMessage =
        data?.message ||
        data?.error ||
        (data?.errors ? Object.values(data.errors).join(', ') : null) ||
        `Request failed with HTTP status ${response.status}`;

      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error.status) {
      return Promise.reject(error);
    }
    const netErr = new Error(error.message || 'Network error communicating with KANSEI AI backend.');
    netErr.status = 0;
    return Promise.reject(netErr);
  }
}
