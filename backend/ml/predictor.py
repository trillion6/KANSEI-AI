import os
import sys
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np

# Base directory for ML artifacts
BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = BASE_DIR / 'artifacts'
GRU_MODEL_PATH = ARTIFACTS_DIR / 'gru_model.keras'
TOKENIZER_JSON_PATH = ARTIFACTS_DIR / 'tokenizer.json'
TOKENIZER_PICKLE_PATH = ARTIFACTS_DIR / 'tokenizer.pickle'
METADATA_PATH = ARTIFACTS_DIR / 'model_metadata.json'

# Ensure ml package is on sys.path
if str(BASE_DIR.parent) not in sys.path:
    sys.path.insert(0, str(BASE_DIR.parent))

from ml.preprocessor import TextPreprocessor, clean_text, LABEL_TO_INT, INT_TO_LABEL


class ModelNotAvailableError(Exception):
    """Raised when model weights or tokenizer artifacts are missing or corrupt."""
    pass


class InputValidationError(Exception):
    """Raised when input text or batch fails validation constraints."""
    pass


class SentimentPredictor:
    """
    Production-grade sentiment inference engine.
    Maintains loaded Keras Bi-GRU model and tokenizer in memory as a singleton.
    
    NOTE ON PROBABILITIES:
    The returned probability scores are normalized softmax activations produced
    by the final layer of the neural network. They represent relative model
    confidence across classes and are not necessarily calibrated Bayesian posterior
    probabilities.
    """

    _instance: Optional['SentimentPredictor'] = None

    def __init__(self, model_path: Path = GRU_MODEL_PATH, tokenizer_path: Path = TOKENIZER_JSON_PATH):
        self.model_path = model_path
        self.tokenizer_path = tokenizer_path
        self.model = None
        self.preprocessor = None
        self.metadata = {}
        self.model_version = "kansi-bi-gru-v1.0"
        self._load_artifacts()

    @classmethod
    def get_instance(cls) -> 'SentimentPredictor':
        """Singleton accessor ensuring artifacts are loaded only once in memory."""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _load_artifacts(self) -> None:
        """Loads Keras model and tokenizer into memory."""
        # 1. Verify tokenizer artifact
        if not self.tokenizer_path.exists() and not TOKENIZER_PICKLE_PATH.exists():
            raise ModelNotAvailableError(
                f"Tokenizer artifact not found at {self.tokenizer_path}. Run training pipeline first."
            )

        # 2. Verify model artifact
        if not self.model_path.exists():
            raise ModelNotAvailableError(
                f"Keras model artifact not found at {self.model_path}. Run training pipeline first."
            )

        try:
            # Load tokenizer
            if self.tokenizer_path.exists():
                self.preprocessor = TextPreprocessor.load(self.tokenizer_path)
            else:
                import pickle
                with open(TOKENIZER_PICKLE_PATH, 'rb') as f:
                    data = pickle.load(f)
                self.preprocessor = TextPreprocessor.from_dict(data)

            # Load Keras model
            import keras
            self.model = keras.models.load_model(str(self.model_path))

            # Load metadata if present
            if METADATA_PATH.exists():
                with open(METADATA_PATH, 'r', encoding='utf-8') as f:
                    self.metadata = json.load(f)
                    self.model_version = self.metadata.get('model_architecture', self.model_version)

        except Exception as e:
            raise ModelNotAvailableError(f"Failed to initialize sentiment model artifacts: {str(e)}")

    def validate_single_text(self, text: Any, max_length: int = 2000) -> str:
        """Validates single text input."""
        if text is None or not isinstance(text, str):
            raise InputValidationError("Input text must be a non-null string.")

        stripped = text.strip()
        if len(stripped) == 0:
            raise InputValidationError("Input text cannot be empty or pure whitespace.")

        if len(text) > max_length:
            raise InputValidationError(
                f"Input text exceeds maximum allowed length of {max_length} characters (got {len(text)})."
            )

        return stripped

    def validate_batch_texts(self, texts: Any, max_batch_size: int = 100, max_item_len: int = 2000) -> List[str]:
        """Validates list of batch inputs."""
        if texts is None or not isinstance(texts, list):
            raise InputValidationError("Batch request body must contain a 'texts' list.")

        if len(texts) == 0:
            raise InputValidationError("Batch texts list cannot be empty.")

        if len(texts) > max_batch_size:
            raise InputValidationError(
                f"Batch size exceeds maximum limit of {max_batch_size} items (got {len(texts)})."
            )

        validated = []
        for idx, item in enumerate(texts):
            if item is None or not isinstance(item, str) or not item.strip():
                raise InputValidationError(
                    f"Item at index {idx} must be a non-empty string."
                )
            if len(item) > max_item_len:
                raise InputValidationError(
                    f"Item at index {idx} exceeds maximum length of {max_item_len} characters."
                )
            validated.append(item.strip())

        return validated

    def predict_text(self, text: str) -> Dict[str, Any]:
        """
        Executes sentiment inference on a single text string.
        """
        valid_text = self.validate_single_text(text)
        return self._predict_single_internal(valid_text)

    def predict_batch(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Executes vectorized batch inference preserving exact input ordering.
        """
        validated_texts = self.validate_batch_texts(texts)

        # Vectorized transform
        X = self.preprocessor.transform(validated_texts)
        raw_probs = self.model.predict(X, batch_size=len(validated_texts), verbose=0)

        results = []
        for idx, text in enumerate(validated_texts):
            prob = raw_probs[idx]
            pred_int = int(np.argmax(prob))
            pred_label = INT_TO_LABEL[pred_int]
            confidence_pct = round(float(prob[pred_int]) * 100.0, 2)

            prob_dict = {
                'positive': round(float(prob[2]), 4),
                'neutral': round(float(prob[1]), 4),
                'negative': round(float(prob[0]), 4),
            }

            words = text.split()
            results.append({
                'index': idx,
                'text': text,
                'sentiment': pred_label,
                'confidence': confidence_pct,
                'probabilities': prob_dict,
                'word_count': len(words),
                'char_count': len(text),
                'model_version': self.model_version,
                'inference_status': 'success'
            })

        return results

    def _predict_single_internal(self, text: str) -> Dict[str, Any]:
        """Internal single-item inference helper."""
        X = self.preprocessor.transform([text])
        raw_probs = self.model.predict(X, verbose=0)[0]

        pred_int = int(np.argmax(raw_probs))
        pred_label = INT_TO_LABEL[pred_int]
        confidence_pct = round(float(raw_probs[pred_int]) * 100.0, 2)

        prob_dict = {
            'positive': round(float(raw_probs[2]), 4),
            'neutral': round(float(raw_probs[1]), 4),
            'negative': round(float(raw_probs[0]), 4),
        }

        # Extract tokens for keyword highlighting
        cleaned = clean_text(text)
        tokens = [t for t in cleaned.split() if t in self.preprocessor.word_index and len(t) > 2]

        return {
            'text': text,
            'sentiment': pred_label,
            'confidence': confidence_pct,
            'probabilities': prob_dict,
            'keywords': list(dict.fromkeys(tokens))[:6],
            'word_count': len(text.split()),
            'char_count': len(text),
            'model_version': self.model_version,
            'inference_status': 'success',
            'calibration_note': 'Softmax outputs reflect model class scores; not calibrated Bayesian posteriors.'
        }
