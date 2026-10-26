import os
import sys
import json
import pickle
from pathlib import Path
import numpy as np
import pandas as pd
import joblib
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix
)

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from preprocessor import TextPreprocessor, LABEL_TO_INT, INT_TO_LABEL

DATA_SPLITS_DIR = BASE_DIR / 'data' / 'splits'
ARTIFACTS_DIR = BASE_DIR / 'artifacts'

TEST_CSV = DATA_SPLITS_DIR / 'test.csv'
GRU_MODEL_PATH = ARTIFACTS_DIR / 'gru_model.keras'
TOKENIZER_PATH = ARTIFACTS_DIR / 'tokenizer.pickle'
BASELINE_PATH = ARTIFACTS_DIR / 'baseline.joblib'
EVAL_RESULTS_PATH = ARTIFACTS_DIR / 'evaluation_results.json'
METADATA_PATH = ARTIFACTS_DIR / 'model_metadata.json'

def evaluate_models():
    print("[*] Starting formal model evaluation on untouched test set...")
    test_df = pd.read_csv(TEST_CSV)
    X_test_raw = test_df['text'].fillna('').tolist()
    y_test_raw = test_df['label'].str.lower().str.strip().tolist()
    labels = ['negative', 'neutral', 'positive']
    y_test_ints = [LABEL_TO_INT[l] for l in y_test_raw]

    print(f"[*] Test partition size: {len(X_test_raw)} records")

    # 1. Evaluate Bidirectional GRU Model
    print("[*] Loading trained Keras Bi-GRU model & tokenizer...")
    import keras
    with open(TOKENIZER_PATH, 'rb') as f:
        preprocessor: TextPreprocessor = pickle.load(f)

    gru_model = keras.models.load_model(str(GRU_MODEL_PATH))
    X_test_seq = preprocessor.transform(X_test_raw)

    print("[*] Generating GRU predictions...")
    gru_probs = gru_model.predict(X_test_seq, batch_size=64, verbose=0)
    gru_pred_ints = np.argmax(gru_probs, axis=1)
    gru_preds = [INT_TO_LABEL[i] for i in gru_pred_ints]

    gru_acc = accuracy_score(y_test_raw, gru_preds)
    gru_macro_prec = precision_score(y_test_raw, gru_preds, average='macro', zero_division=0)
    gru_macro_rec = recall_score(y_test_raw, gru_preds, average='macro', zero_division=0)
    gru_macro_f1 = f1_score(y_test_raw, gru_preds, average='macro', zero_division=0)
    gru_weighted_f1 = f1_score(y_test_raw, gru_preds, average='weighted', zero_division=0)
    gru_cm = confusion_matrix(y_test_raw, gru_preds, labels=labels).tolist()
    gru_report = classification_report(y_test_raw, gru_preds, labels=labels, output_dict=True, zero_division=0)

    # 2. Evaluate Baseline TF-IDF + Logistic Regression Model
    print("[*] Loading Baseline TF-IDF + Logistic Regression model...")
    baseline_model = joblib.load(BASELINE_PATH)
    baseline_preds = baseline_model.predict(X_test_raw)

    base_acc = accuracy_score(y_test_raw, baseline_preds)
    base_macro_prec = precision_score(y_test_raw, baseline_preds, average='macro', zero_division=0)
    base_macro_rec = recall_score(y_test_raw, baseline_preds, average='macro', zero_division=0)
    base_macro_f1 = f1_score(y_test_raw, baseline_preds, average='macro', zero_division=0)
    base_weighted_f1 = f1_score(y_test_raw, baseline_preds, average='weighted', zero_division=0)
    base_cm = confusion_matrix(y_test_raw, baseline_preds, labels=labels).tolist()
    base_report = classification_report(y_test_raw, baseline_preds, labels=labels, output_dict=True, zero_division=0)

    # 3. Compile Comparative Evaluation Dictionary
    results = {
        'test_set_size': len(X_test_raw),
        'test_class_distribution': {
            'negative': y_test_raw.count('negative'),
            'neutral': y_test_raw.count('neutral'),
            'positive': y_test_raw.count('positive')
        },
        'models': {
            'bidirectional_gru': {
                'model_name': 'Bidirectional GRU (Keras 3)',
                'accuracy': round(float(gru_acc), 4),
                'macro_precision': round(float(gru_macro_prec), 4),
                'macro_recall': round(float(gru_macro_rec), 4),
                'macro_f1': round(float(gru_macro_f1), 4),
                'weighted_f1': round(float(gru_weighted_f1), 4),
                'per_class': {
                    'negative': {
                        'precision': round(float(gru_report['negative']['precision']), 4),
                        'recall': round(float(gru_report['negative']['recall']), 4),
                        'f1_score': round(float(gru_report['negative']['f1-score']), 4),
                        'support': int(gru_report['negative']['support'])
                    },
                    'neutral': {
                        'precision': round(float(gru_report['neutral']['precision']), 4),
                        'recall': round(float(gru_report['neutral']['recall']), 4),
                        'f1_score': round(float(gru_report['neutral']['f1-score']), 4),
                        'support': int(gru_report['neutral']['support'])
                    },
                    'positive': {
                        'precision': round(float(gru_report['positive']['precision']), 4),
                        'recall': round(float(gru_report['positive']['recall']), 4),
                        'f1_score': round(float(gru_report['positive']['f1-score']), 4),
                        'support': int(gru_report['positive']['support'])
                    }
                },
                'confusion_matrix': {
                    'labels': labels,
                    'matrix': gru_cm
                }
            },
            'baseline_tfidf_lr': {
                'model_name': 'TF-IDF + Logistic Regression (Baseline)',
                'accuracy': round(float(base_acc), 4),
                'macro_precision': round(float(base_macro_prec), 4),
                'macro_recall': round(float(base_macro_rec), 4),
                'macro_f1': round(float(base_macro_f1), 4),
                'weighted_f1': round(float(base_weighted_f1), 4),
                'per_class': {
                    'negative': {
                        'precision': round(float(base_report['negative']['precision']), 4),
                        'recall': round(float(base_report['negative']['recall']), 4),
                        'f1_score': round(float(base_report['negative']['f1-score']), 4),
                        'support': int(base_report['negative']['support'])
                    },
                    'neutral': {
                        'precision': round(float(base_report['neutral']['precision']), 4),
                        'recall': round(float(base_report['neutral']['recall']), 4),
                        'f1_score': round(float(base_report['neutral']['f1-score']), 4),
                        'support': int(base_report['neutral']['support'])
                    },
                    'positive': {
                        'precision': round(float(base_report['positive']['precision']), 4),
                        'recall': round(float(base_report['positive']['recall']), 4),
                        'f1_score': round(float(base_report['positive']['f1-score']), 4),
                        'support': int(base_report['positive']['support'])
                    }
                },
                'confusion_matrix': {
                    'labels': labels,
                    'matrix': base_cm
                }
            }
        }
    }

    # Save to evaluation_results.json
    with open(EVAL_RESULTS_PATH, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)

    # Also update model_metadata.json with test evaluation metrics
    if METADATA_PATH.exists():
        with open(METADATA_PATH, 'r', encoding='utf-8') as f:
            metadata = json.load(f)
        metadata['test_evaluation'] = results['models']['bidirectional_gru']
        with open(METADATA_PATH, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2)

    print("\n=======================================================")
    print("           MODEL TEST EVALUATION COMPARISON            ")
    print("=======================================================")
    print(f"{'Metric':<20} {'Baseline (TF-IDF)':<22} {'Deep Bi-GRU':<20}")
    print("-" * 62)
    print(f"{'Accuracy':<20} {base_acc * 100:.2f}%{'':<15} {gru_acc * 100:.2f}%")
    print(f"{'Macro Precision':<20} {base_macro_prec:.4f}{'':<16} {gru_macro_prec:.4f}")
    print(f"{'Macro Recall':<20} {base_macro_rec:.4f}{'':<16} {gru_macro_rec:.4f}")
    print(f"{'Macro F1-Score':<20} {base_macro_f1:.4f}{'':<16} {gru_macro_f1:.4f}")
    print(f"{'Weighted F1':<20} {base_weighted_f1:.4f}{'':<16} {gru_weighted_f1:.4f}")
    print("=" * 62)

    print("\nBi-GRU Confusion Matrix (rows=actual, cols=pred):")
    print(f"          Neg   Neu   Pos")
    for idx, row in enumerate(gru_cm):
        print(f"{labels[idx]:<8} {row[0]:<5} {row[1]:<5} {row[2]:<5}")

    print("\n[+] Saved complete evaluation results to:")
    print(f"    - {EVAL_RESULTS_PATH}")
    print(f"    - {METADATA_PATH}")

    return results

if __name__ == '__main__':
    evaluate_models()
