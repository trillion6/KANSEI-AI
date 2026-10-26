import json
from pathlib import Path
import joblib
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score, precision_score, recall_score
from sklearn.pipeline import Pipeline

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_SPLITS_DIR = BASE_DIR / 'data' / 'splits'
ARTIFACTS_DIR = BASE_DIR / 'artifacts'
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_CSV = DATA_SPLITS_DIR / 'train.csv'
TEST_CSV = DATA_SPLITS_DIR / 'test.csv'
BASELINE_MODEL_PATH = ARTIFACTS_DIR / 'baseline.joblib'
BASELINE_METRICS_PATH = ARTIFACTS_DIR / 'baseline_metrics.json'

def train_and_evaluate_baseline():
    print("[*] Loading training and testing splits for Baseline model...")
    train_df = pd.read_csv(TRAIN_CSV)
    test_df = pd.read_csv(TEST_CSV)

    X_train = train_df['text'].fillna('')
    y_train = train_df['label']

    X_test = test_df['text'].fillna('')
    y_test = test_df['label']

    print(f"[*] Training samples: {len(X_train)}, Test samples: {len(X_test)}")

    # Construct TF-IDF + Logistic Regression pipeline
    # Learned vocabulary is fitted strictly on training data
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            sublinear_tf=True
        )),
        ('clf', LogisticRegression(
            max_iter=1000,
            random_state=42,
            C=1.0
        ))
    ])

    print("[*] Fitting Baseline TF-IDF + Logistic Regression model...")
    pipeline.fit(X_train, y_train)

    # Save model artifact
    joblib.dump(pipeline, BASELINE_MODEL_PATH)
    print(f"[+] Saved baseline artifact to {BASELINE_MODEL_PATH}")

    # Evaluate on untouched test set
    print("[*] Evaluating baseline on test partition...")
    y_pred = pipeline.predict(X_test)

    labels = ['negative', 'neutral', 'positive']
    acc = accuracy_score(y_test, y_pred)
    macro_prec = precision_score(y_test, y_pred, average='macro', zero_division=0)
    macro_rec = recall_score(y_test, y_pred, average='macro', zero_division=0)
    macro_f1 = f1_score(y_test, y_pred, average='macro', zero_division=0)
    weighted_f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
    cm = confusion_matrix(y_test, y_pred, labels=labels).tolist()
    report = classification_report(y_test, y_pred, labels=labels, output_dict=True, zero_division=0)

    metrics = {
        'model_name': 'TF-IDF + Logistic Regression (Baseline)',
        'accuracy': round(float(acc), 4),
        'macro_precision': round(float(macro_prec), 4),
        'macro_recall': round(float(macro_rec), 4),
        'macro_f1': round(float(macro_f1), 4),
        'weighted_f1': round(float(weighted_f1), 4),
        'confusion_matrix': {
            'labels': labels,
            'matrix': cm
        },
        'classification_report': report
    }

    with open(BASELINE_METRICS_PATH, 'w', encoding='utf-8') as f:
        json.dump(metrics, f, indent=2)

    print("\n--- BASELINE EVALUATION RESULTS ---")
    print(f"Accuracy:        {metrics['accuracy'] * 100:.2f}%")
    print(f"Macro Precision: {metrics['macro_precision']:.4f}")
    print(f"Macro Recall:    {metrics['macro_recall']:.4f}")
    print(f"Macro F1-Score:  {metrics['macro_f1']:.4f}")
    print(f"Weighted F1:     {metrics['weighted_f1']:.4f}")
    print("Confusion Matrix (rows=actual, cols=predicted):")
    print(f"          Neg   Neu   Pos")
    for idx, row in enumerate(cm):
        print(f"{labels[idx]:<8} {row[0]:<5} {row[1]:<5} {row[2]:<5}")
    print("-----------------------------------\n")

    return metrics

if __name__ == '__main__':
    train_and_evaluate_baseline()
