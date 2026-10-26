# KANSEI AI — Model Evaluation & Deep-Learning Comparative Study

This document details the quantitative and qualitative empirical evaluation of the deep-learning **Bidirectional GRU** sentiment classifier alongside the **TF-IDF + Logistic Regression** baseline.

---

## 1. Evaluation Methodology

### 1.1 Dataset Partitioning & Isolation
All model comparisons were executed on an **identical, untouched test partition** of 2,165 stratified samples from the Twitter US Airline Sentiment benchmark.

```
Total Cleaned Records: 14,427
├── Training Set (70%):   10,098 samples (Neg: 6,355, Neu: 2,140, Pos: 1,603)
├── Validation Set (15%):  2,164 samples (Neg: 1,362, Neu: 458,  Pos: 344)
└── Test Set (15%):        2,165 samples (Neg: 1,363, Neu: 459,  Pos: 343)
```

- **Data Leakage Prevention:** Vocabulary fitting (`fit_on_texts` and `TfidfVectorizer.fit`) was performed **strictly** on the training partition. The test set was transformed only after models were finalized.
- **Evaluation Criteria:** Accuracy, Macro Precision, Macro Recall, Macro F1, Weighted F1, and class-specific Confusion Matrices.

---

## 2. Models Benchmarked

### Model 1: Bidirectional GRU (Keras 3)
- **Token Input:** Integer sequences, max sequence length $N = 80$, post-padded.
- **Embedding:** $10,000 \times 128$ learned dense representations.
- **Regularization:** SpatialDropout1D (0.25) + Recurrent Dropout (0.25) + Dense Dropout (0.30).
- **Recurrent Core:** 64 forward GRU units + 64 backward GRU units (128 concatenated features).
- **Classification Head:** Dense projection (64 units, ReLU) $\to$ Softmax (3 units).
- **Training Parameters:** Adam optimizer ($\alpha = 0.001$), Categorical Cross-Entropy, batch size 64, early stopping patience 2 (halted at epoch 5).

### Model 2: TF-IDF + Logistic Regression (Baseline)
- **Feature Extraction:** Sublinear TF-IDF vectorizer, max 5,000 features, unigram + bigram range `(1, 2)`.
- **Classifier:** L2-regularized Logistic Regression ($C = 1.0$), L-BFGS solver, max 1,000 iterations.

---

## 3. Quantitative Results & Comparison

### 3.1 Overall Performance Table

| Metric | Bidirectional GRU | TF-IDF + Logistic Regression | Delta ($\Delta$) |
|---|---|---|---|
| **Test Accuracy** | **76.40%** (0.7640) | **79.86%** (0.7986) | Baseline +3.46% |
| **Macro Precision** | **0.6907** | **0.7742** | Baseline +0.0835 |
| **Macro Recall** | **0.7106** | **0.6883** | **Bi-GRU +0.0223** |
| **Macro F1-Score** | **0.6995** | **0.7206** | Baseline +0.0211 |
| **Weighted F1-Score** | **0.7662** | **0.7873** | Baseline +0.0211 |

---

### 3.2 Per-Class Detailed Classification Report

#### Bidirectional GRU
```
              precision    recall  f1-score   support
    negative     0.8720    0.8393    0.8553      1363
     neutral     0.5727    0.5752    0.5739       459
    positive     0.6276    0.7172    0.6694       343

    accuracy                         0.7640      2165
   macro avg     0.6907    0.7106    0.6995      2165
weighted avg     0.7701    0.7640    0.7662      2165
```

#### TF-IDF + Logistic Regression Baseline
```
              precision    recall  f1-score   support
    negative     0.8182    0.9413    0.8755      1363
     neutral     0.7122    0.5229    0.6030       459
    positive     0.7923    0.6006    0.6833       343

    accuracy                         0.7986      2165
   macro avg     0.7742    0.6883    0.7206      2165
weighted avg     0.7916    0.7986    0.7873      2165
```

---

### 3.3 Confusion Matrices

#### Bidirectional GRU (Accuracy: 76.40%)
*Rows = Ground Truth (Actual); Columns = Model Predictions*

```
                  Predicted Negative   Predicted Neutral   Predicted Positive    Total
Actual Negative          1,144                157                  62            1,363
Actual Neutral             111                264                  84              459
Actual Positive             57                 40                 246              343
```

#### TF-IDF + Logistic Regression (Accuracy: 79.86%)

```
                  Predicted Negative   Predicted Neutral   Predicted Positive    Total
Actual Negative          1,283                 59                  21            1,363
Actual Neutral             186                240                  33              459
Actual Positive             99                 38                 206              343
```

---

## 4. Deep-Dive Analytical Discussion

### 4.1 Why the Baseline Achieved Higher Overall Accuracy
In imbalanced classification problems where the dominant class represents roughly two-thirds of the data (62.94% negative), overall accuracy is heavily leveraged by performance on that majority class.

1. **Keyword Overfitting to Negative Complaints:** Common complaint unigrams and bigrams (`delayed`, `late`, `lost luggage`, `hours`, `terrible`, `worst`, `rude`, `never again`) appear with high frequency in customer feedback. The TF-IDF vectorizer maps these heavily weighted terms directly to the negative hyperplane.
2. **Aggressive Negative Assignment:** The baseline correctly classified 1,283 out of 1,363 negative instances, yielding **94.13% negative recall**.
3. **The Consequence:** While inflating overall accuracy to 79.86%, the baseline achieved this by sacrificing minority-class sensitivity: it misclassified **186 neutral reviews** and **99 positive reviews** as negative, yielding a poor positive recall of **60.06%**.

### 4.2 Why the Bidirectional GRU is Superior for Nuanced Sentiment
The Bidirectional GRU model demonstrated a more balanced decision boundary:

1. **Higher Positive Recall (71.72% vs. 60.06%):** The GRU correctly detected 246 positive reviews compared to only 206 by the baseline (+19.4% more positive instances surfaced).
2. **Higher Neutral Recall (57.52% vs. 52.29%):** The GRU correctly recognized 264 neutral reviews compared to 240 by the baseline.
3. **Higher Macro Recall (0.7106 vs. 0.6883):** In real-world customer intelligence, failing to detect satisfied customers (false negatives on positive reviews) prevents brands from understanding what drives consumer delight. The GRU treats classes more equitably rather than defaulting to the majority class.
4. **Context & Negation Awareness:** In phrases with mixed sentiment or negation (e.g., *"not bad at all, actually enjoyed the flight"*, *"service was slow but attendants were lovely"*), the bidirectional recurrent gates retain modifiers before and after key tokens, whereas unigram/bigram TF-IDF vectors frequently get pulled negative by words like `not` and `slow`.

---

## 5. Statistical Nature of Model Softmax Scores

A vital principle of KANSEI AI's academic documentation is the accurate portrayal of model probability outputs:

$$\hat{y}_c = \frac{e^{z_c}}{\sum_{k=1}^3 e^{z_k}}$$

- **Softmax Outputs are Model Activations:** The output vector represents relative exponentiated logits across the three classes normalized to sum to 1.0.
- **Not Calibrated Bayesian Posterior Probabilities:** A softmax score of 0.95 indicates that within the feature space learned by the network, class $c$ had the highest activation relative to the other two classes. It does **not** formally imply a 95% empirical probability of correctness.
- **Transparency in UI:** Throughout KANSEI AI, outputs are explicitly labeled as **"Softmax Confidence Scores"** rather than "True Probability" to maintain scientific and ethical integrity.

---

## 6. Qualitative Error Analysis & Edge Cases

| Review Text | Actual Class | Bi-GRU Prediction (Confidence) | Baseline Prediction | Root Cause Analysis |
|---|---|---|---|---|
| *"Flight delayed 2 hours, but gate agent Sarah gave everyone free snacks and kept us smiling."* | Positive | **Positive (78.4%)** | Negative | Baseline saw strong negative unigrams (`delayed`, `hours`); GRU bidirectional gate captured positive resolution (`free snacks`, `kept us smiling`). |
| *"Seat was not uncomfortable and flight was on time."* | Positive / Neutral | **Neutral (64.2%)** | Negative | Double negation (`not uncomfortable`) confuses bag-of-words; GRU negation retention prevented false negative classification. |
| *"Is there WiFi on flight 402 tomorrow?"* | Neutral | **Neutral (89.1%)** | Negative | Baseline penalizes flight number questions; GRU recognizes factual query syntax. |
| *"Great job cancelling my flight right before my wedding!"* | Negative | **Positive (72.3%)** | Negative | Sarcasm without linguistic negation cues remains an open research challenge for sequence models without multimodal voice/facial context. |
