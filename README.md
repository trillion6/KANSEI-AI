# KANSEI AI — Intelligent Sentiment Analyzer

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19.3-cyan.svg)](https://react.dev/)
[![TensorFlow 2.21](https://img.shields.io/badge/tensorflow-2.21-orange.svg)](https://tensorflow.org/)
[![License: CC BY 4.0](https://img.shields.io/badge/Dataset_License-CC_BY_4.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

> **KANSEI AI** is an enterprise-grade sentiment intelligence platform that leverages Natural Language Processing and a deep-learning **Bidirectional GRU** neural network to evaluate customer reviews, product feedback, and social commentary into **Positive**, **Neutral**, and **Negative** sentiment classes.

---

## Key Highlights

- **Neural Sentiment Inference:** Pre-trained Bidirectional GRU model trained on the Twitter US Airline benchmark dataset (14,427 cleaned records) achieving **76.40%** overall test accuracy with **71.72%** positive-class recall.
- **Empirical Baseline Comparison:** Benchmarked against a TF-IDF + Logistic Regression baseline pipeline (**79.86%** test accuracy).
- **Production REST Architecture:** Modular Flask application factory pattern with centralized JSON error envelopes and health diagnostics.
- **Server-Side Session Security:** Database-backed sessions (`Flask-Session`), opaque signed cookies, `SameSite=Lax`, `HttpOnly`, WTForms CSRF token protection, and `Flask-Limiter` rate limiting.
- **Multi-Tenant Isolation:** Relational SQLite database with foreign key constraints and cascading deletes; queries strictly scoped by authenticated `user_id`.
- **Futuristic Glassmorphism SPA:** React 19 single-page application built on Vite, Bootstrap 5, Recharts visual analytics, circular confidence gauges, and batch analysis tools.
- **Single-Click CSV Export:** Real-time stream export of the authenticated user's complete sentiment history archive.

---

## System Architecture

```
KANSEI AI Architecture:
┌────────────────────────────────────────────────────────┐
│               React 19 SPA (Vite + Recharts)           │
│  - Landing Page with Live Interactive Preview          │
│  - Analyzer Studio (Single & Batch Modes)              │
│  - Workspace Dashboard & Real-Time Telemetry           │
│  - Analytics Deep Dive (Pie, Area, & Bar Charts)       │
│  - Searchable History Archive & Single-Click CSV       │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / JSON (Session Cookie + CSRF)
┌───────────────────────────▼────────────────────────────┐
│                    Flask RESTful API                   │
│  - /api/health          - /api/auth/*                  │
│  - /api/sentiment/*     - /api/analytics/*             │
├───────────────────────────┬────────────────────────────┤
│   Security & Middleware   │   Inference Engine         │
│   - Flask-Session (DB)    │   - Bidirectional GRU      │
│   - Flask-WTF (CSRF)      │   - TextPreprocessor       │
│   - Flask-Limiter         │   - In-memory Singleton    │
├───────────────────────────┴────────────────────────────┤
│             SQLite Database (SQLAlchemy ORM)           │
│   - users                 - sentiment_analyses         │
│   - flask_sessions                                     │
└────────────────────────────────────────────────────────┘
```

---

## Directory Layout

```
C:\Users\HP\Desktop\KANSI AI\
├── backend/
│   ├── app/
│   │   ├── models/            # SQLAlchemy User & SentimentAnalysis models
│   │   ├── routes/            # auth, sentiment, history, analytics, health
│   │   ├── services/          # Business logic & authentication helpers
│   │   ├── utils/             # Responses, security decorators, error handlers
│   │   ├── config.py          # Environment configuration (Dev/Test/Prod)
│   │   └── extensions.py      # SQLAlchemy, CSRF, Limiter, Session instances
│   ├── instance/              # SQLite database (kansi.db)
│   ├── ml/
│   │   ├── artifacts/         # gru_model.keras, tokenizer.json, baseline.joblib
│   │   ├── data/              # raw/Tweets.csv, splits/ (train, val, test)
│   │   ├── scripts/           # train_gru.py, train_baseline.py, evaluate.py
│   │   ├── predictor.py       # Production singleton inference service
│   │   └── preprocessor.py    # Text cleaning & sequence tokenization
│   ├── tests/                 # 39 Pytest cases + user journey verification
│   ├── requirements.txt       # Python dependencies
│   ├── run.py                 # Development server entry point (Port 5000)
│   └── venv/                  # Python 3.11 virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/        # GlassCard, GlowButton, Charts, Modals, Navbar
│   │   ├── context/           # AuthContext (server-side session sync)
│   │   ├── pages/             # Landing, Login, Register, Dashboard, Analyzer, etc.
│   │   ├── services/          # API client, authService, sentimentService
│   │   └── styles/            # glassmorphism.css, index.css
│   ├── package.json           # React 19, Vite, Bootstrap, Recharts dependencies
│   └── vite.config.js         # API proxy configuration (localhost:5000)
└── docs/                      # Academic documentation package
    ├── PROJECT_REPORT.md      # Comprehensive 23-section Academic Report
    ├── API_REFERENCE.md       # Full REST API endpoint specification
    ├── MODEL_EVALUATION.md    # Detailed model evaluation & baseline report
    ├── VIVA_PREPARATION.md    # Viva voce questions, answers & demo guide
    └── SCREENSHOT_CHECKLIST.md# UI screenshot capture guidelines
```

---

## Quickstart & Installation

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** and **npm** installed

### 1. Backend Setup
Open a terminal in the project root:
```powershell
cd backend

# Activate existing virtual environment
.\venv\Scripts\Activate.ps1

# (Optional) Verify dependencies
pip install -r requirements.txt

# Run database initialization and server
python run.py
```
*The Flask API will start on `http://127.0.0.1:5000` with the pre-trained Bidirectional GRU model loaded in memory.*

### 2. Frontend Setup
Open a second terminal window:
```powershell
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
*The React client will launch on `http://localhost:5173` with an automated proxy routing `/api` requests to port 5000.*

---

## Running the Automated Test Suite

### 1. Backend Unit & Security Tests
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python -m pytest -v
```
*Expected: 39 passed in ~12 seconds.*

### 2. End-to-End User Journey Verification
```powershell
cd backend
.\venv\Scripts\Activate.ps1
python tests/verify_rule2_journey.py
```
*Expected: All 12 user journey verification steps pass with success status.*

### 3. Frontend Production Build Check
```powershell
cd frontend
npm run build
```
*Expected: Vite production bundle compiles cleanly with 0 errors.*

---

## Model Evaluation Summary

| Metric | Bidirectional GRU | TF-IDF + Logistic Regression |
|---|---|---|
| **Test Accuracy** | **76.40%** | **79.86%** |
| **Macro Precision** | **0.6907** | **0.7742** |
| **Macro Recall** | **0.7106** | **0.6883** |
| **Macro F1-Score** | **0.6995** | **0.7206** |
| **Positive Class Recall** | **71.72%** | **60.06%** |
| **Neutral Class Recall** | **57.52%** | **52.29%** |

*Note: While the baseline achieved higher overall accuracy by exploiting the dataset's negative-class imbalance (94.13% negative recall), the Bidirectional GRU demonstrated significantly higher recall on positive and neutral sentiment by preserving temporal sequence gates and negation context.*

---

## Documentation Package

Full technical reports and viva voce defense notes are located in the [`docs/`](file:///C:/Users/HP/Desktop/KANSI%20AI/docs/) directory:
- [docs/PROJECT_REPORT.md](file:///C:/Users/HP/Desktop/KANSI%20AI/docs/PROJECT_REPORT.md): 23-section Academic Project Report.
- [docs/API_REFERENCE.md](file:///C:/Users/HP/Desktop/KANSI%20AI/docs/API_REFERENCE.md): Complete REST API contract and JSON schemas.
- [docs/MODEL_EVALUATION.md](file:///C:/Users/HP/Desktop/KANSI%20AI/docs/MODEL_EVALUATION.md): In-depth ML analysis and confusion matrices.
- [docs/VIVA_PREPARATION.md](file:///C:/Users/HP/Desktop/KANSI%20AI/docs/VIVA_PREPARATION.md): Exam defense Q&A and demo script.
- [docs/SCREENSHOT_CHECKLIST.md](file:///C:/Users/HP/Desktop/KANSI%20AI/docs/SCREENSHOT_CHECKLIST.md): Step-by-step UI screenshot checklist.

---

## Exporting Documentation to PDF

The project reports are formatted in standard GitHub Flavored Markdown with embedded SVG diagrams. To convert the reports into academic PDF format:
1. **VS Code (Recommended):** Install the `Markdown PDF` extension by yzane. Open `docs/PROJECT_REPORT.md` and run `Markdown PDF: Export (pdf)`.
2. **Browser Print:** Open the Markdown document in GitHub or a preview tool, select **Print $\to$ Save as PDF**, with background graphics enabled.
3. **Pandoc (if installed):**
   ```bash
   pandoc docs/PROJECT_REPORT.md -o docs/PROJECT_REPORT.pdf --pdf-engine=wkhtmltopdf
   ```

---

## Dataset Attribution & Licensing

The sentiment analysis model is trained on the **Twitter US Airline Sentiment Dataset**, curated by Crowdflower and distributed under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.
- Source: [Kaggle Twitter US Airline Sentiment](https://www.kaggle.com/datasets/crowdflower/twitter-airline-sentiment)
- Provenance: Data for Everyone Library / Crowdflower.
