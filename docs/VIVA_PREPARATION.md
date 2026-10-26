# KANSEI AI — Viva Voce Examination & Project Defense Guide

This document is prepared specifically for academic project evaluations, viva voce examinations, and technical presentations of **KANSEI AI — Intelligent Sentiment Analyzer**.

---

## 1. Project Elevator Pitch (30-Second Summary)

> **"KANSEI AI** is an enterprise-grade sentiment intelligence web platform that uses Natural Language Processing and a deep-learning **Bidirectional GRU** neural network to classify customer reviews into positive, neutral, and negative sentiment. Unlike traditional bag-of-words or dictionary-based tools, KANSEI AI processes sequences bidirectionally to preserve temporal word order and negation context like *'not bad at all'*. We empirically benchmarked our deep-learning model against a TF-IDF + Logistic Regression baseline on 2,165 test samples, showing that our Bi-GRU achieves significantly higher recall on positive reviews (**71.72%** vs **60.06%**). The inference engine is integrated into a multi-tenant Flask REST backend featuring database-backed sessions, CSRF protection, and rate limiting, coupled with a futuristic glassmorphism React single-page application providing real-time telemetry, batch processing, and CSV exports."

---

## 2. Top Viva Voce Questions and Model Answers

### Category A: Natural Language Processing & Deep Learning

#### Q1: Why did you choose a Bidirectional GRU instead of an LSTM or simple RNN?
**Answer:**
- Standard simple RNNs suffer from vanishing and exploding gradients over sequence lengths of 80 tokens due to repeated matrix multiplications.
- Gated Recurrent Units (GRUs) solve vanishing gradients using internal **Reset** and **Update** gating mechanisms while having fewer parameters than LSTMs (2 gates in GRU vs 3 gates in LSTM: input, forget, output). This yields ~25% faster training convergence and reduced memory footprint without loss of sequence modeling capacity.
- Making it **Bidirectional** executes two passes: one reading tokens from left-to-right ($\overrightarrow{h}_t$) and one from right-to-left ($\overleftarrow{h}_t$). This allows the network to resolve modifiers that appear after a word (e.g., *"clean"* followed by *"it was not"* vs *"not clean"*).

#### Q2: The TF-IDF + Logistic Regression baseline had a higher overall accuracy (79.86%) than the Bidirectional GRU (76.40%). Why didn't you deploy the baseline instead?
**Answer:**
- This is an essential insight regarding **class imbalance**. The dataset is 62.94% negative.
- The baseline achieved 79.86% overall accuracy primarily by aggressively classifying samples into the majority negative class (achieving 94.13% negative recall), but it failed on minority classes, misclassifying 186 neutral reviews and 99 positive reviews as negative, resulting in a poor positive recall of **60.06%**.
- In business analytics, missing 40% of satisfied customers is unacceptable. The Bidirectional GRU achieved a **71.72% positive recall** (+19.4% improvement) and **57.52% neutral recall**, demonstrating a much more balanced decision boundary. The GRU had higher **Macro Recall** (0.7106 vs 0.6883).

#### Q3: Why did you preserve negation tokens in your stopword removal process?
**Answer:**
- Standard stopword lists indiscriminately discard words like `not`, `no`, `never`, `can't`, and `without`.
- In sentiment analysis, discarding negation completely flips polarity: *"The flight was not good"* becomes *"flight good"*, which an algorithm would falsely classify as positive.
- Our custom `clean_text` pipeline explicitly preserves negation markers and expands contractions (`don't` $\to$ `do not`) before tokenization.

#### Q4: Are your model confidence outputs true probabilities?
**Answer:**
- No. The model outputs are **softmax activation scores**:
  $$\text{Softmax}(z_i) = \frac{e^{z_i}}{\sum_{j=1}^3 e^{z_j}}$$
- While they are mathematically bounded between 0 and 1 and sum to 1.0, they represent relative uncalibrated network confidence rather than true Bayesian posterior probabilities. In our documentation and UI, we explicitly label them as *"Softmax Confidence Scores"* to uphold scientific accuracy.

#### Q5: How did you handle out-of-vocabulary (OOV) words and variable sequence lengths?
**Answer:**
- We fitted a 10,000-word vocabulary strictly on the training partition.
- Index `0` is reserved for `<PAD>` (zero-padding), and index `1` is reserved for `<OOV>`.
- Any word encountered during inference that was not in the training vocabulary is mapped to `<OOV>`.
- Sequences are normalized to a fixed length of 80 tokens using post-padding and post-truncation (`padding='post'`, `truncating='post'`).

---

### Category B: Backend & System Architecture

#### Q6: Why did you use server-side sessions instead of standard Flask signed-cookie sessions or JWTs?
**Answer:**
- Default Flask sessions store session data directly in the client cookie signed with an HMAC secret. Calling `session.clear()` only clears the cookie in the current browser; if an attacker has already copied that cookie, it remains valid until expiration because the server has no revocation registry.
- JWTs in localStorage are vulnerable to token theft via Cross-Site Scripting (XSS).
- KANSEI AI implements **server-side sessions** using `Flask-Session` with an SQLite database backend (`flask_sessions` table). The client receives only a cryptographically signed opaque session ID in an `HttpOnly`, `SameSite=Lax` cookie. When a user clicks Logout, the session record is immediately deleted from the database, achieving genuine server-side revocation.

#### Q7: How does KANSEI AI protect against Cross-Site Request Forgery (CSRF)?
**Answer:**
- We use `Flask-WTF` to generate cryptographic tokens bound to the server session via `GET /api/auth/csrf-token`.
- Every state-changing request (`POST`, `PUT`, `DELETE`) must supply this token in the `X-CSRF-Token` header.
- Because malicious third-party sites cannot read cross-origin headers due to the browser's Same-Origin Policy (SOP), unauthorized cross-site requests are rejected with HTTP 400.

#### Q8: How is multi-tenant isolation enforced in the database?
**Answer:**
- The `sentiment_analyses` table contains a `user_id` foreign key referencing `users.id` with `ON DELETE CASCADE`.
- All queries strictly enforce server-side scoping:
  ```python
  SentimentAnalysis.query.filter_by(user_id=current_user.id)
  ```
- Any client-supplied `user_id` in request payloads is ignored. Tests verified that User 2 receives HTTP 404 when attempting to view or delete User 1's records.

#### Q9: How do you avoid reloading the heavy Keras deep-learning model on every API request?
**Answer:**
- In `backend/ml/predictor.py`, the `SentimentPredictor` class is implemented using the **Singleton Design Pattern**:
  ```python
  @classmethod
  def get_instance(cls):
      if cls._instance is None:
          cls._instance = cls()
      return cls._instance
  ```
- The model weights (`gru_model.keras`) and tokenizer dictionary are loaded into memory once on application startup or first call. Subsequent inferences execute directly against in-memory weights in ~15 ms.

---

### Category C: Frontend & Data Analytics

#### Q10: How does the application handle users with zero analysis history?
**Answer:**
- In `backend/app/routes/analytics.py`, when a user has zero records, the API returns a structured zero-state payload (`total_analyses: 0`, empty trends, zero counts) with status 200 rather than throwing a division-by-zero error.
- The React frontend conditionally renders an `EmptyState` component with a direct call-to-action button routing to `/analyzer`.

#### Q11: How is CSV export implemented without causing memory exhaustion?
**Answer:**
- In `/api/analytics/export`, the backend generates CSV text directly from the database and returns a `Response` with `mimetype="text/csv"` and a `Content-Disposition: attachment; filename=...` header.
- In `HistoryPage.jsx`, the frontend downloads the response as a `Blob` using `window.URL.createObjectURL(blob)`, allowing client browsers to save the file without holding duplicate state.

---

## 3. Step-by-Step Viva Demonstration Script

During your project viva or live examination, follow this 5-minute demonstration script:

1. **System Health Verification:**
   - Open browser or postman to `http://127.0.0.1:5000/api/health`.
   - Show that the API reports `database: "connected"`, confirming server and ORM health.
2. **Landing Page & Live Interactive Preview:**
   - Navigate to `http://localhost:5173/`.
   - Click the preset chips ("Positive Review", "Neutral Review", "Negative Review").
   - Highlight the animated Confidence Gauge and 3-Class Softmax Probability Bar updating in real time.
3. **User Registration & Security:**
   - Click "Register". Demonstrate live password strength meter feedback.
   - Register an account (e.g., `examiner@kansei.ai`).
   - Demonstrate automatic login into the Workspace Dashboard.
4. **Sentiment Studio Inference:**
   - Navigate to `/analyzer`.
   - Test a single text review with negation: *"The flight was delayed, but the gate agent Sarah was not rude at all and gave us free snacks."*
   - Show how the Bidirectional GRU correctly classifies it as **Positive** with the gauge and probability breakdown.
   - Switch to **Batch Mode**. Paste 3 lines of text and click "Analyze All Lines" to show batch inference and ordered tabular output.
5. **Analytics & History:**
   - Navigate to `/analytics` to show the Class Distribution Donut Chart, 14-Day Trend Chart, and Frequent Word Bar Chart.
   - Navigate to `/history` to demonstrate live search filtering and inspection modals.
   - Click "Export to CSV" to show immediate downloading of user records.
6. **Multi-Tenant Security Verification:**
   - Click "Sign Out".
   - Show that navigating directly to `/history` or calling protected endpoints redirects or rejects with HTTP 401.

---

## 4. Key Formulas to Write on the Whiteboard

### 1. GRU Gate Equations
$$\text{Update Gate: } z_t = \sigma(W_z x_t + U_z h_{t-1} + b_z)$$
$$\text{Reset Gate: } r_t = \sigma(W_r x_t + U_r h_{t-1} + b_r)$$
$$\text{Candidate State: } \tilde{h}_t = \tanh(W_h x_t + U_h (r_t \odot h_{t-1}) + b_h)$$
$$\text{Hidden State: } h_t = (1 - z_t) \odot h_{t-1} + z_t \odot \tilde{h}_t$$

### 2. Softmax Output
$$P(y = c \mid x) = \frac{e^{z_c}}{\sum_{k=1}^3 e^{z_k}}$$

### 3. Macro Recall vs Weighted Recall
$$\text{Macro Recall} = \frac{1}{3} \sum_{c=1}^3 \text{Recall}_c = \frac{0.8393 + 0.5752 + 0.7172}{3} = \mathbf{0.7106}$$
$$\text{Weighted Recall} = \sum_{c=1}^3 \left(\frac{N_c}{N_{\text{total}}}\right) \text{Recall}_c = \mathbf{0.7640}$$
