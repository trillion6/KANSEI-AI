import pickle
import json
import pytest
import numpy as np
from pathlib import Path
import keras

from ml.preprocessor import clean_text, TextPreprocessor, LABEL_TO_INT, INT_TO_LABEL

ARTIFACTS_DIR = Path(__file__).resolve().parent.parent / 'ml' / 'artifacts'
GRU_MODEL_PATH = ARTIFACTS_DIR / 'gru_model.keras'
TOKENIZER_PICKLE_PATH = ARTIFACTS_DIR / 'tokenizer.pickle'
TOKENIZER_JSON_PATH = ARTIFACTS_DIR / 'tokenizer.json'

def load_test_preprocessor() -> TextPreprocessor:
    """Helper to reload tokenizer from JSON or pickle artifact."""
    if TOKENIZER_JSON_PATH.exists():
        return TextPreprocessor.load(TOKENIZER_JSON_PATH)
    with open(TOKENIZER_PICKLE_PATH, 'rb') as f:
        obj = pickle.load(f)
    if isinstance(obj, dict):
        return TextPreprocessor.from_dict(obj)
    return obj

def test_preprocessing_edge_cases_and_negation_preservation():
    """Verify that text cleaning handles edge cases and preserves crucial negation polarity."""
    # 1. Negation preservation
    text_neg = "The seat was not comfortable, definitely won't fly with them again."
    cleaned_neg = clean_text(text_neg)
    assert 'not' in cleaned_neg
    assert 'fly' in cleaned_neg

    # 2. HTML unescaping and URL removal
    text_html_url = "Great customer service &amp; smooth onboarding! https://t.co/airline123"
    cleaned_html = clean_text(text_html_url)
    assert '&' not in cleaned_html
    assert 'https' not in cleaned_html
    assert 'great' in cleaned_html
    assert 'customer service' in cleaned_html

    # 3. Handle @mentions
    text_mention = "@VirginAmerica I loved the flight crew today! So kind."
    cleaned_mention = clean_text(text_mention)
    assert '@virginamerica' not in cleaned_mention
    assert 'loved' in cleaned_mention

    # 4. Empty and non-string edge cases
    assert clean_text("") == ""
    assert clean_text("   ") == ""
    assert clean_text(None) == ""
    assert clean_text(12345) == ""

def test_tokenizer_and_sequence_dimensions():
    """Verify tokenizer creates fixed-length padded sequences with valid integer IDs."""
    preprocessor = TextPreprocessor(max_vocab_size=500, max_seq_len=20)
    train_corpus = [
        "excellent flight smooth boarding and pleasant crew",
        "terrible delay luggage lost and rude desk agents",
        "standard departure on time as scheduled in the itinerary"
    ]
    preprocessor.fit_on_texts(train_corpus)

    test_samples = [
        "excellent flight",
        "",
        "unknown word completely out of vocabulary test"
    ]
    padded = preprocessor.transform(test_samples)

    assert isinstance(padded, np.ndarray)
    assert padded.shape == (3, 20)
    assert padded.dtype == np.int32
    assert padded[0, 0] > 0
    assert np.all(padded[1] == 0)

def test_saved_artifacts_can_be_reloaded():
    """Verify that saved tokenizer and Keras Bi-GRU model reload without errors."""
    assert GRU_MODEL_PATH.exists(), f"Missing {GRU_MODEL_PATH}"
    assert TOKENIZER_JSON_PATH.exists() or TOKENIZER_PICKLE_PATH.exists()

    reloaded_preprocessor = load_test_preprocessor()
    assert isinstance(reloaded_preprocessor, TextPreprocessor)
    assert reloaded_preprocessor.fitted is True
    assert len(reloaded_preprocessor.word_index) > 1000

    reloaded_model = keras.models.load_model(str(GRU_MODEL_PATH))
    assert isinstance(reloaded_model, keras.Model)
    assert reloaded_model.output_shape == (None, 3)

def test_model_inference_probabilities():
    """
    Verify inference on reloaded model:
    - Shape is (N, 3)
    - All probabilities are finite numbers between 0.0 and 1.0
    - Probabilities sum to 1.0 across the 3 classes
    """
    preprocessor = load_test_preprocessor()
    model = keras.models.load_model(str(GRU_MODEL_PATH))

    test_inputs = [
        "The flight attendants were wonderful, attentive, and incredibly polite! Best flight ever.",
        "Flight 402 departed at 10am and arrived at terminal 2 as listed on the ticket.",
        "Worst experience of my life. Flight was cancelled without notice and baggage was broken.",
        "",
        "??? !!!"
    ]

    X = preprocessor.transform(test_inputs)
    probs = model.predict(X, verbose=0)

    # 1. Output dimensions
    assert probs.shape == (len(test_inputs), 3)

    # 2. Numerical validity: finite and non-negative
    assert np.all(np.isfinite(probs))
    assert np.all(probs >= 0.0)
    assert np.all(probs <= 1.0)

    # 3. Softmax sums to approximately 1.0
    row_sums = np.sum(probs, axis=1)
    np.testing.assert_allclose(row_sums, 1.0, rtol=1e-5, err_msg="Probabilities must sum to 1.0")

    # 4. Verify distinct probability distributions
    assert not np.allclose(probs[0], probs[2]), "Positive and negative reviews must produce distinct distributions"
