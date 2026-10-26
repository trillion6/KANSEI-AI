import os
import json
from pathlib import Path
import requests
import pandas as pd
from sklearn.model_selection import train_test_split

# Base paths
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_RAW_DIR = BASE_DIR / 'data' / 'raw'
DATA_SPLITS_DIR = BASE_DIR / 'data' / 'splits'

DATA_RAW_DIR.mkdir(parents=True, exist_ok=True)
DATA_SPLITS_DIR.mkdir(parents=True, exist_ok=True)

DATASET_URL = "https://raw.githubusercontent.com/satyajeetkrjha/kaggle-Twitter-US-Airline-Sentiment-/master/Tweets.csv"
RAW_CSV_PATH = DATA_RAW_DIR / 'Tweets.csv'
METADATA_PATH = DATA_RAW_DIR / 'dataset_info.json'

def download_dataset():
    """Downloads legitimate Crowdflower Twitter Airline Sentiment dataset."""
    if RAW_CSV_PATH.exists() and RAW_CSV_PATH.stat().st_size > 1000000:
        print(f"[*] Raw dataset already exists at {RAW_CSV_PATH} ({RAW_CSV_PATH.stat().st_size} bytes)")
        return

    print(f"[*] Downloading dataset from {DATASET_URL}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    response = requests.get(DATASET_URL, headers=headers, timeout=30)
    response.raise_for_status()

    with open(RAW_CSV_PATH, 'wb') as f:
        f.write(response.content)
    print(f"[+] Download complete: saved to {RAW_CSV_PATH} ({len(response.content)} bytes)")


def process_and_split():
    """
    Cleans, deduplicates, validates, and stratifies dataset into train/val/test splits.
    Guarantees no data leakage across partitions.
    """
    print(f"[*] Reading raw dataset from {RAW_CSV_PATH}...")
    df = pd.read_csv(RAW_CSV_PATH)
    raw_total = len(df)
    print(f"[*] Raw records: {raw_total}")

    # Verify required columns
    required_cols = ['text', 'airline_sentiment']
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Missing required column '{col}' in raw dataset.")

    # 1. Filter only valid text and label columns
    df = df[['text', 'airline_sentiment']].copy()
    df.rename(columns={'airline_sentiment': 'label'}, inplace=True)

    # 2. Drop nulls / empty entries
    null_count = df.isnull().sum().to_dict()
    df.dropna(subset=['text', 'label'], inplace=True)
    df = df[df['text'].str.strip() != '']

    # 3. Deduplicate
    dup_count = df.duplicated(subset=['text']).sum()
    df.drop_duplicates(subset=['text'], inplace=True)

    # 4. Normalize labels
    df['label'] = df['label'].str.lower().str.strip()
    valid_labels = {'positive', 'neutral', 'negative'}
    df = df[df['label'].isin(valid_labels)]

    cleaned_total = len(df)
    class_distribution = df['label'].value_counts().to_dict()
    print(f"[+] Cleaned records: {cleaned_total} (dropped {null_count} nulls, {dup_count} duplicates)")
    print(f"[*] Class distribution: {class_distribution}")

    # 5. Stratified Split: 70% Train, 15% Validation, 15% Test
    # First split: 70% train, 30% temp
    train_df, temp_df = train_test_split(
        df,
        test_size=0.30,
        random_state=42,
        stratify=df['label']
    )

    # Second split: 50% of temp -> 15% val, 15% test
    val_df, test_df = train_test_split(
        temp_df,
        test_size=0.50,
        random_state=42,
        stratify=temp_df['label']
    )

    print(f"[*] Split sizes: Train={len(train_df)}, Val={len(val_df)}, Test={len(test_df)}")

    # Save splits
    train_path = DATA_SPLITS_DIR / 'train.csv'
    val_path = DATA_SPLITS_DIR / 'val.csv'
    test_path = DATA_SPLITS_DIR / 'test.csv'

    train_df.to_csv(train_path, index=False)
    val_df.to_csv(val_path, index=False)
    test_df.to_csv(test_path, index=False)

    print(f"[+] Saved splits to {DATA_SPLITS_DIR}")

    # 6. Document Provenance and Metadata
    info = {
        "dataset_name": "Twitter US Airline Sentiment Dataset",
        "provenance": "Crowdflower (Data for Everyone library) / Kaggle Benchmark",
        "license": "Creative Commons Attribution 4.0 International (CC BY 4.0)",
        "source_url": DATASET_URL,
        "description": "Customer tweets regarding 6 major U.S. airlines annotated into three sentiment classes.",
        "raw_total_records": raw_total,
        "cleaned_records": cleaned_total,
        "class_distribution": class_distribution,
        "class_proportions": {
            k: round(v / cleaned_total, 4) for k, v in class_distribution.items()
        },
        "splits": {
            "train": {
                "count": len(train_df),
                "distribution": train_df['label'].value_counts().to_dict()
            },
            "validation": {
                "count": len(val_df),
                "distribution": val_df['label'].value_counts().to_dict()
            },
            "test": {
                "count": len(test_df),
                "distribution": test_df['label'].value_counts().to_dict()
            }
        },
        "limitations": [
            "Imbalanced classes (negative reviews dominate ~63%, mirroring real-world support channels).",
            "Domain-specific vocabulary focusing on travel, delays, and customer service.",
            "Contains social media handles and hashtags requiring regex normalization."
        ]
    }

    with open(METADATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(info, f, indent=2)

    print(f"[+] Saved dataset documentation to {METADATA_PATH}")

if __name__ == '__main__':
    download_dataset()
    process_and_split()
