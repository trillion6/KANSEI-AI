import os
import sys
import json
import time
import pickle
from pathlib import Path
import numpy as np
import pandas as pd

# Set random seeds for reproducibility
SEED = 42
os.environ['PYTHONHASHSEED'] = str(SEED)
np.random.seed(SEED)

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = BASE_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

from ml.preprocessor import TextPreprocessor, LABEL_TO_INT, INT_TO_LABEL

DATA_SPLITS_DIR = BASE_DIR / 'data' / 'splits'
ARTIFACTS_DIR = BASE_DIR / 'artifacts'
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

TRAIN_CSV = DATA_SPLITS_DIR / 'train.csv'
VAL_CSV = DATA_SPLITS_DIR / 'val.csv'
GRU_MODEL_PATH = ARTIFACTS_DIR / 'gru_model.keras'
TOKENIZER_PICKLE_PATH = ARTIFACTS_DIR / 'tokenizer.pickle'
TOKENIZER_JSON_PATH = ARTIFACTS_DIR / 'tokenizer.json'
MODEL_METADATA_PATH = ARTIFACTS_DIR / 'model_metadata.json'

def build_gru_model(vocab_size: int, max_seq_len: int = 80, embedding_dim: int = 128):
    """
    Constructs a Bidirectional GRU sentiment classification network in Keras.
    """
    import tensorflow as tf
    import keras
    from keras import layers

    tf.random.set_seed(SEED)

    model = keras.Sequential([
        layers.Input(shape=(max_seq_len,), dtype='int32', name='input_tokens'),
        layers.Embedding(input_dim=vocab_size, output_dim=embedding_dim, name='embedding_layer'),
        layers.SpatialDropout1D(0.25, name='spatial_dropout'),
        layers.Bidirectional(
            layers.GRU(64, return_sequences=False, dropout=0.25),
            name='bidirectional_gru'
        ),
        layers.Dense(64, activation='relu', name='dense_projection'),
        layers.Dropout(0.3, name='dropout_regularization'),
        layers.Dense(3, activation='softmax', name='softmax_output')
    ], name='Kansi_BiGRU_Sentiment_Classifier')

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=1e-3),
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )

    return model

def one_hot_encode_labels(labels):
    """Converts string labels to one-hot encoded matrix."""
    num_classes = 3
    encoded = np.zeros((len(labels), num_classes), dtype=np.float32)
    for i, lbl in enumerate(labels):
        idx = LABEL_TO_INT[lbl.lower().strip()]
        encoded[i, idx] = 1.0
    return encoded

def train_gru():
    start_time = time.time()
    print("[*] Starting Bidirectional GRU model training pipeline...")

    # 1. Load splits
    print(f"[*] Loading training and validation splits...")
    train_df = pd.read_csv(TRAIN_CSV)
    val_df = pd.read_csv(VAL_CSV)

    X_train_raw = train_df['text'].fillna('').tolist()
    y_train_raw = train_df['label'].tolist()

    X_val_raw = val_df['text'].fillna('').tolist()
    y_val_raw = val_df['label'].tolist()

    print(f"[*] Training samples: {len(X_train_raw)}, Validation samples: {len(X_val_raw)}")

    # 2. Fit TextPreprocessor on Training data only
    max_vocab_size = 10000
    max_seq_len = 80
    preprocessor = TextPreprocessor(max_vocab_size=max_vocab_size, max_seq_len=max_seq_len)
    preprocessor.fit_on_texts(X_train_raw)
    vocab_size = len(preprocessor.word_index)
    print(f"[+] Fitted vocabulary on training partition: {vocab_size} unique tokens (max={max_vocab_size})")

    # 3. Transform inputs to padded sequences
    X_train = preprocessor.transform(X_train_raw)
    X_val = preprocessor.transform(X_val_raw)

    y_train = one_hot_encode_labels(y_train_raw)
    y_val = one_hot_encode_labels(y_val_raw)

    # 4. Save tokenizer artifacts (both pickle of dictionary state and JSON)
    preprocessor.save(TOKENIZER_JSON_PATH)
    with open(TOKENIZER_PICKLE_PATH, 'wb') as f:
        pickle.dump(preprocessor.to_dict(), f)
    print(f"[+] Saved tokenizer artifacts to {TOKENIZER_JSON_PATH} and {TOKENIZER_PICKLE_PATH}")

    # 5. Build and train model
    import keras
    model = build_gru_model(vocab_size=vocab_size, max_seq_len=max_seq_len, embedding_dim=128)

    callbacks = [
        keras.callbacks.EarlyStopping(
            monitor='val_loss',
            patience=3,
            restore_best_weights=True,
            verbose=1
        ),
        keras.callbacks.ModelCheckpoint(
            filepath=str(GRU_MODEL_PATH),
            monitor='val_loss',
            save_best_only=True,
            verbose=1
        )
    ]

    print("[*] Fitting Keras Bi-GRU model...")
    epochs = 8
    batch_size = 64
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=batch_size,
        callbacks=callbacks,
        verbose=1
    )

    model.save(str(GRU_MODEL_PATH))
    print(f"[+] Saved trained Bi-GRU model to {GRU_MODEL_PATH}")

    elapsed_time = round(time.time() - start_time, 2)
    print(f"[+] Training completed in {elapsed_time} seconds ({elapsed_time / 60:.2f} mins)")

    # 6. Save basic training metadata
    meta = {
        'model_architecture': 'Bidirectional GRU',
        'framework': 'TensorFlow / Keras 3',
        'max_vocab_size': max_vocab_size,
        'vocab_size': vocab_size,
        'max_seq_len': max_seq_len,
        'embedding_dim': 128,
        'gru_units': 64,
        'label_mapping': LABEL_TO_INT,
        'index_mapping': INT_TO_LABEL,
        'training_samples': len(X_train),
        'validation_samples': len(X_val),
        'epochs_configured': epochs,
        'epochs_trained': len(history.history['loss']),
        'training_duration_seconds': elapsed_time,
        'final_train_loss': round(float(history.history['loss'][-1]), 4),
        'final_train_accuracy': round(float(history.history['accuracy'][-1]), 4),
        'final_val_loss': round(float(history.history['val_loss'][-1]), 4),
        'final_val_accuracy': round(float(history.history['val_accuracy'][-1]), 4),
    }

    with open(MODEL_METADATA_PATH, 'w', encoding='utf-8') as f:
        json.dump(meta, f, indent=2)

    print(f"[+] Saved training metadata to {MODEL_METADATA_PATH}")

if __name__ == '__main__':
    train_gru()
