# KANSEI AI — REST API Reference Specification

This document provides complete technical specifications for the KANSEI AI Flask REST API.

---

## 1. Global Conventions

### Base URL
```
Development: http://127.0.0.1:5000/api
Vite Proxy:  http://localhost:5173/api
```

### Standard Response Envelope
All API endpoints return JSON conforming to the standardized envelope structure:

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Descriptive human-readable error explanation.",
  "status_code": 400
}
```

### Authentication & Session Headers
- **Session Identification:** Stored in a cryptographically signed cookie named `session`.
- **Cookie Security Attributes:** `HttpOnly=True`, `SameSite=Lax`, `Path=/`, `Max-Age=604800` (7 days).
- **CSRF Token Header:** State-changing requests (`POST`, `PUT`, `DELETE`) require the header:
  ```http
  X-CSRF-Token: <token_from_api_auth_csrf-token>
  ```
- **Credentials:** Client `fetch` calls must include `credentials: "include"`.

---

## 2. Health & System Diagnostics

### GET `/api/health`
Checks API operational status and validates SQLite database connectivity.

- **Authentication:** None
- **Rate Limit:** None
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "KANSEI AI Sentiment API is operational",
  "data": {
    "service": "kansei-sentiment-api",
    "phase": "Phase 7: Integrated Platform",
    "database": "connected",
    "version": "1.0.0"
  }
}
```

---

## 3. Authentication & Security Endpoints

### GET `/api/auth/csrf-token`
Issues a cryptographically secure CSRF token associated with the current session.

- **Authentication:** None
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "CSRF token issued successfully.",
  "data": {
    "csrf_token": "IjM2MmY0MzA4...<64-char-token>"
  }
}
```

---

### POST `/api/auth/register`
Creates a new user workspace account, securely hashes the password with scrypt, and starts an authenticated session.

- **Authentication:** None
- **Rate Limit:** 10 requests per minute per IP
- **Request Headers:**
  ```http
  Content-Type: application/json
  X-CSRF-Token: <csrf_token>
  ```
- **Request Body:**
```json
{
  "email": "user@example.com",
  "username": "user123",
  "full_name": "Jane Doe",
  "password": "SecurePassword123!"
}
```
- **Validation Rules:**
  - `email`: Valid email format, lowercase normalized, unique.
  - `username`: 3–32 alphanumeric/underscore characters, unique.
  - `full_name`: 2–128 characters, non-empty.
  - `password`: Minimum 8 characters.
- **Response (201 Created):**
```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "user123",
    "full_name": "Jane Doe",
    "role": "user",
    "created_at": "2026-10-27T01:15:30.123456+00:00",
    "updated_at": "2026-10-27T01:15:30.123456+00:00"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Input validation failed.
  - `409 Conflict`: Email or username already registered.
  - `429 Too Many Requests`: Rate limit exceeded.

---

### POST `/api/auth/login`
Authenticates user credentials against salted password hashes and establishes a server-side session.

- **Authentication:** None
- **Rate Limit:** 10 requests per minute per IP
- **Request Headers:**
  ```http
  Content-Type: application/json
  X-CSRF-Token: <csrf_token>
  ```
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Authentication successful.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "user123",
    "full_name": "Jane Doe",
    "role": "user",
    "created_at": "2026-10-27T01:15:30.123456+00:00",
    "updated_at": "2026-10-27T01:15:30.123456+00:00"
  }
}
```
- **Error Responses:**
  - `401 Unauthorized`: Invalid email or password.
  - `429 Too Many Requests`: Rate limit exceeded.

---

### POST `/api/auth/logout`
Terminates the active user session and deletes the server-side session record.

- **Authentication:** None required (no-op if unauthenticated)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully.",
  "data": null
}
```

---

### GET `/api/auth/me`
Retrieves the profile of the currently authenticated user session.

- **Authentication:** **Required** (Server-side session cookie)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "User profile retrieved.",
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "user123",
    "full_name": "Jane Doe",
    "role": "user",
    "created_at": "2026-10-27T01:15:30.123456+00:00",
    "updated_at": "2026-10-27T01:15:30.123456+00:00"
  }
}
```
- **Error Response:**
  - `401 Unauthorized`: User not signed in.

---

## 4. Sentiment Inference Endpoints

### POST `/api/sentiment/analyze`
Evaluates the sentiment of a single customer review or text snippet using the Bidirectional GRU model. Automatically persists the result if the request contains an authenticated session.

- **Authentication:** Optional (authenticated sessions persist to DB; guest requests return predictions only)
- **Request Headers:**
  ```http
  Content-Type: application/json
  X-CSRF-Token: <csrf_token> (if authenticated)
  ```
- **Request Body:**
```json
{
  "text": "The cabin crew was exceptionally polite and the flight landed 20 minutes early!",
  "source": "web_studio"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Sentiment analysis complete.",
  "data": {
    "text": "The cabin crew was exceptionally polite and the flight landed 20 minutes early!",
    "sentiment": "positive",
    "confidence": 98.11,
    "probabilities": {
      "negative": 0.0061,
      "neutral": 0.0127,
      "positive": 0.9811
    },
    "tokens": ["the", "cabin", "crew", "was", "exceptionally", "polite", "and", "the", "flight", "landed", "20", "minutes", "early"],
    "keywords": ["exceptionally", "polite", "early", "landed"],
    "word_count": 13,
    "char_count": 79,
    "saved": true,
    "id": 42,
    "user_id": 1,
    "model_version": "Bidirectional GRU"
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Empty, whitespace, or oversized text (>2,000 characters).
  - `503 Service Unavailable`: Model weights missing or uninitialized.

---

### POST `/api/sentiment/batch`
Evaluates an ordered list of reviews sequentially. When authenticated, saves all records within a single atomic database transaction.

- **Authentication:** Optional
- **Request Body:**
```json
{
  "texts": [
    "Amazing customer support, resolved my issue in minutes!",
    "Flight was delayed 3 hours without any announcement.",
    "The meal included a sandwich and a bottle of water."
  ]
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Batch analysis complete for 3 texts.",
  "data": {
    "items": [
      {
        "index": 0,
        "text": "Amazing customer support, resolved my issue in minutes!",
        "sentiment": "positive",
        "confidence": 96.84,
        "probabilities": { "negative": 0.012, "neutral": 0.019, "positive": 0.968 },
        "saved": true,
        "id": 43,
        "user_id": 1
      },
      {
        "index": 1,
        "text": "Flight was delayed 3 hours without any announcement.",
        "sentiment": "negative",
        "confidence": 99.12,
        "probabilities": { "negative": 0.991, "neutral": 0.006, "positive": 0.003 },
        "saved": true,
        "id": 44,
        "user_id": 1
      },
      {
        "index": 2,
        "text": "The meal included a sandwich and a bottle of water.",
        "sentiment": "neutral",
        "confidence": 88.45,
        "probabilities": { "negative": 0.045, "neutral": 0.885, "positive": 0.070 },
        "saved": true,
        "id": 45,
        "user_id": 1
      }
    ],
    "summary": {
      "total_analyzed": 3,
      "positive_count": 1,
      "neutral_count": 1,
      "negative_count": 1
    }
  }
}
```
- **Error Responses:**
  - `400 Bad Request`: Missing `texts` array or list is empty/exceeds batch limit (100).

---

## 5. History & Export Endpoints

### GET `/api/sentiment/history`
Returns paginated, searchable, sorted sentiment records owned strictly by the authenticated user.

- **Authentication:** **Required**
- **Query Parameters:**
  - `page`: Integer page number (default: 1)
  - `per_page`: Integer records per page (default: 10, max: 100)
  - `sentiment`: Filter by class (`all`, `positive`, `neutral`, `negative`)
  - `search`: Substring search in text
  - `sort`: Sort order (`date-desc`, `date-asc`, `conf-desc`, `conf-asc`)
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Retrieved 10 history records.",
  "data": {
    "items": [
      {
        "id": 42,
        "user_id": 1,
        "text": "The cabin crew was exceptionally polite...",
        "sentiment": "positive",
        "confidence": 98.11,
        "probabilities": { "negative": 0.0061, "neutral": 0.0127, "positive": 0.9811 },
        "word_count": 13,
        "char_count": 79,
        "source": "web_studio",
        "created_at": "2026-10-27T01:20:15.000000+00:00"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "per_page": 10,
      "pages": 5
    }
  }
}
```

---

### GET `/api/sentiment/history/<id>`
Retrieves detail for a single analysis record owned by the authenticated user.

- **Authentication:** **Required**
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "History record retrieved.",
  "data": {
    "id": 42,
    "user_id": 1,
    "text": "The cabin crew was exceptionally polite...",
    "sentiment": "positive",
    "confidence": 98.11,
    "probabilities": { "negative": 0.0061, "neutral": 0.0127, "positive": 0.9811 },
    "word_count": 13,
    "char_count": 79,
    "source": "web_studio",
    "created_at": "2026-10-27T01:20:15.000000+00:00"
  }
}
```
- **Error Response:**
  - `404 Not Found`: Record does not exist or belongs to another user.

---

### DELETE `/api/sentiment/history/<id>`
Permanently deletes an analysis record owned by the authenticated user.

- **Authentication:** **Required**
- **Request Headers:**
  ```http
  X-CSRF-Token: <csrf_token>
  ```
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Analysis record deleted successfully.",
  "data": null
}
```
- **Error Response:**
  - `404 Not Found`: Record does not exist or unauthorized.

---

## 6. Analytics & Telemetry Endpoints

### GET `/api/analytics/metrics`
Computes real-time aggregate telemetry from the authenticated user's records.

- **Authentication:** **Required**
- **Response (200 OK):**
```json
{
  "success": true,
  "message": "Analytics metrics computed successfully.",
  "data": {
    "total_analyses": 42,
    "positive_count": 23,
    "positive_pct": 54.8,
    "neutral_count": 10,
    "neutral_pct": 23.8,
    "negative_count": 9,
    "negative_pct": 21.4,
    "average_confidence": 91.24,
    "distribution": [
      { "name": "Positive", "value": 23, "color": "#10B981" },
      { "name": "Neutral", "value": 10, "color": "#00F2FE" },
      { "name": "Negative", "value": 9, "color": "#F43F5E" }
    ],
    "recent_activity": [ ... ],
    "sentiment_trends": [
      { "date": "2026-10-25", "positive": 5, "neutral": 2, "negative": 1, "total": 8 },
      { "date": "2026-10-26", "positive": 18, "neutral": 8, "negative": 8, "total": 34 }
    ],
    "frequent_words": [
      { "text": "polite", "count": 14, "sentiment": "positive" },
      { "text": "delayed", "count": 8, "sentiment": "negative" },
      { "text": "standard", "count": 6, "sentiment": "neutral" }
    ]
  }
}
```

---

### GET `/api/analytics/export`
Streams the complete historical archive for the authenticated user as a downloadable CSV.

- **Authentication:** **Required**
- **Response Headers:**
  ```http
  Content-Type: text/csv
  Content-Disposition: attachment; filename=kansei_analyses_user_1.csv
  ```
- **Response Body Sample:**
```csv
id,sentiment,confidence,word_count,char_count,source,created_at,text
42,positive,98.11,13,79,web_studio,2026-10-27T01:20:15.000000+00:00,"The cabin crew was exceptionally polite and the flight landed 20 minutes early!"
```
