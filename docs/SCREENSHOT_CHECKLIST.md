# KANSEI AI — User Interface Screenshot Capture Checklist

This checklist provides step-by-step guidelines for capturing genuine screenshots of the running KANSEI AI application for inclusion in academic project presentation slides and submission portfolios.

> **Note on Verification:** Automated browser driver binaries are restricted in this sandbox environment. In accordance with project integrity standards, visual automation was not simulated or claimed. Follow the manual capture procedures below to record authentic visual evidence from a local browser.

---

## 1. Setup Instructions Before Capturing

1. **Start Backend Server:**
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   python run.py
   ```
   *Verify that `http://127.0.0.1:5000/api/health` returns status 200.*

2. **Start Frontend Server:**
   ```powershell
   cd frontend
   npm run dev
   ```
   *Open `http://localhost:5173` in Google Chrome or Microsoft Edge.*

3. **Recommended Viewport Resolutions:**
   - **Desktop Layout:** 1920 $\times$ 1080 px (or 1440 $\times$ 900 px), 100% zoom.
   - **Mobile Viewport:** 390 $\times$ 844 px (iPhone 14/15 profile in Chrome DevTools Device Mode).
   - **Format & Quality:** PNG or JPEG with high color depth to preserve dark navy `#070B19` gradients and electric-blue `#00F2FE` glows.
   - **Target Directory:** Save all captured image files into `docs/screenshots/`.

---

## 2. Screenshot Inventory Checklist

| # | Screenshot Filename | Screen / Component | Route | Required State / Data Displayed |
|---|---|---|---|---|
| 1 | `01_landing_hero.png` | Landing Page (Hero) | `/` | Hero title with gradient text, navigation bar, and primary "Launch Studio" button. |
| 2 | `02_landing_live_preview.png` | Landing Page (Live Preview) | `/` | Preset chip clicked ("Positive Review"), showing active Circular Confidence Gauge and Softmax Probability Bar. |
| 3 | `03_register_screen.png` | Account Registration | `/register` | Registration form filled out, showing the live animated password strength meter in green (Strong). |
| 4 | `04_login_screen.png` | User Authentication | `/login` | Login form with dark glass card and informational server-side session security note. |
| 5 | `05_dashboard_overview.png` | Workspace Dashboard | `/dashboard` | 5 stat cards across the top, quick sentiment test widget, and Recharts sentiment distribution donut chart. |
| 6 | `06_analyzer_single_result.png` | Sentiment Studio (Single) | `/analyzer` | Review analyzed, showing green "POSITIVE" badge, 98% Circular Confidence Gauge, and salient token tags. |
| 7 | `07_analyzer_batch_mode.png` | Sentiment Studio (Batch) | `/analyzer` | Batch tab active with 3 lines of input and ordered table showing item `#1`, `#2`, `#3` with sentiment tags. |
| 8 | `08_analytics_charts.png` | Analytics Deep Dive | `/analytics` | 3 Recharts components: Class Distribution Donut, 14-Day Sentiment Trend Area Chart, and Frequent Word Bar Chart. |
| 9 | `09_history_table.png` | Analysis History Archive | `/history` | Search toolbar, sentiment filter dropdown, paginated table of historical predictions, and "Export to CSV" button. |
| 10| `10_history_detail_modal.png` | Record Inspection Modal | `/history` | `DetailModal` open showing review excerpt, timestamp, word count, character count, and 3-class softmax bar. |
| 11| `11_user_profile.png` | User Profile & Settings | `/profile` | Account owner card, confidence alert threshold slider, auto-save toggle switch, and password update card. |
| 12| `12_mobile_responsive_view.png`| Mobile Responsive View | `/analyzer` | Mobile viewport (390px) showing collapsed hamburger menu and stacked cards. |

---

## 3. Step-by-Step Capture Instructions

### Screenshot 1: Landing Page Hero & Interactive Preview
- Navigate to `http://localhost:5173/`.
- Click the chip **"Positive Review (Electronics)"** in the Live Preview widget.
- Observe the gauge animate to ~94.2% and the badge display "POSITIVE".
- Capture the viewport. Save as `01_landing_hero.png` and `02_landing_live_preview.png`.

### Screenshot 2: Authentication & Registration
- Navigate to `http://localhost:5173/register`.
- Enter `Jane Doe`, `jane.doe@kansei.ai`, and password `SecurePassword123!`.
- Observe the password strength bar fill to 100% green.
- Capture as `03_register_screen.png`.
- Submit registration and observe redirect to `/dashboard`.

### Screenshot 3: Workspace Dashboard
- On `/dashboard`, ensure at least 2 reviews have been analyzed.
- Confirm the 5 stat cards display non-zero counts (Total Analyses, Positive %, Neutral %, Negative %, Avg Confidence).
- Capture as `05_dashboard_overview.png`.

### Screenshot 4: Sentiment Studio Single & Batch Inference
- Navigate to `/analyzer`.
- Enter: *"The flight was delayed by 2 hours, but the flight attendants were exceptionally kind and gave us free snacks."*
- Click "Analyze Review".
- Confirm the Circular Confidence Gauge shows green (~78–90%) and salient tags are visible.
- Capture as `06_analyzer_single_result.png`.
- Click the **"Batch Processing"** tab.
- Click "Fill Sample Batch" and click "Analyze All Lines".
- Capture the ordered table as `07_analyzer_batch_mode.png`.

### Screenshot 5: Analytics Charts
- Navigate to `/analytics`.
- Confirm the Donut Chart, Trend Area Chart, and Word Frequency Bar Chart render with live values.
- Hover over the Word Frequency Bar Chart to display the dark glass tooltip.
- Capture as `08_analytics_charts.png`.

### Screenshot 6: History & Detail Modal
- Navigate to `/history`.
- Capture the full records table as `09_history_table.png`.
- Click the blue **Inspect (Eye)** icon on any row to open the `DetailModal`.
- Confirm the modal displays the formatted `#ID`, full text, word count, character count, and probability vector.
- Capture as `10_history_detail_modal.png`.

### Screenshot 7: User Profile & Settings
- Navigate to `/profile`.
- Adjust the "Confidence Alert Threshold" slider to 85%.
- Capture as `11_user_profile.png`.

### Screenshot 8: Mobile Responsiveness
- Open Chrome DevTools (`F12` or `Ctrl+Shift+I`).
- Click the Device Toolbar icon (`Ctrl+Shift+M`) and select **iPhone 14 Pro** (393 $\times$ 852).
- Navigate to `/analyzer` and click the mobile hamburger menu icon to reveal the mobile drawer.
- Capture as `12_mobile_responsive_view.png`.
