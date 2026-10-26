import re
import html
import json
from pathlib import Path
from typing import List, Union
import numpy as np

# Preserved negation tokens crucial for sentiment polarity
PRESERVED_NEGATIONS = {
    'not', 'no', 'never', 'neither', 'nor', 'none',
    "don't", "didn't", "doesn't", "can't", "couldn't",
    "won't", "wouldn't", "shouldn't", "isn't", "aren't", "wasn't", "weren't"
}

LABEL_TO_INT = {
    'negative': 0,
    'neutral': 1,
    'positive': 2
}

INT_TO_LABEL = {
    0: 'negative',
    1: 'neutral',
    2: 'positive'
}

def clean_text(text: str) -> str:
    """
    Cleans raw text for sentiment analysis.
    - Unescapes HTML entities (&amp; -> &)
    - Removes URLs and hyperlinks
    - Removes Twitter handles / user mentions
    - Normalizes contractions
    - Retains negation words and essential sentiment punctuation
    - Collapses whitespace
    """
    if not isinstance(text, str):
        return ""

    # Unescape HTML entities
    text = html.unescape(text)

    # Remove URLs
    text = re.sub(r'https?://\S+|www\.\S+', '', text)

    # Remove Twitter handles / user mentions
    text = re.sub(r'@\w+', '', text)

    # Normalize contractions (expanding common negative contractions)
    contractions = {
        r"can\'t": "can not",
        r"cannot": "can not",
        r"won\'t": "will not",
        r"n\'t": " not",
        r"\'re": " are",
        r"\'s": " is",
        r"\'d": " would",
        r"\'ll": " will",
        r"\'ve": " have",
        r"\'m": " am",
    }
    for pattern, repl in contractions.items():
        text = re.sub(pattern, repl, text, flags=re.IGNORECASE)

    # Lowercase
    text = text.lower()

    # Remove special characters except letters, numbers, and basic punctuation
    text = re.sub(r'[^a-z0-9\s!\?]', ' ', text)

    # Collapse multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()

    return text


class TextPreprocessor:
    """
    Reusable text preprocessor managing cleaning, tokenization,
    integer sequence conversion, and fixed-length padding.
    """

    def __init__(self, max_vocab_size: int = 10000, max_seq_len: int = 80):
        self.max_vocab_size = max_vocab_size
        self.max_seq_len = max_seq_len
        self.word_index = {}
        self.index_word = {}
        self.fitted = False

    def fit_on_texts(self, texts: List[str]) -> None:
        """
        Builds vocabulary from a list of clean training texts.
        Token index 0 is reserved for padding; 1 is reserved for <OOV>.
        """
        cleaned_texts = [clean_text(t) for t in texts]
        word_counts = {}

        for text in cleaned_texts:
            tokens = text.split()
            for token in tokens:
                word_counts[token] = word_counts.get(token, 0) + 1

        # Sort by frequency
        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        top_words = sorted_words[: self.max_vocab_size - 2]

        self.word_index = {"<PAD>": 0, "<OOV>": 1}
        for idx, (word, _) in enumerate(top_words, start=2):
            self.word_index[word] = idx

        self.index_word = {idx: word for word, idx in self.word_index.items()}
        self.fitted = True

    def texts_to_sequences(self, texts: List[str]) -> List[List[int]]:
        """Converts texts to integer token sequences using vocabulary."""
        if not self.fitted:
            raise ValueError("TextPreprocessor must be fitted on training texts before transform.")

        sequences = []
        for text in texts:
            cleaned = clean_text(text)
            tokens = cleaned.split()
            seq = [self.word_index.get(token, 1) for token in tokens] # 1 is <OOV>
            sequences.append(seq)
        return sequences

    def pad_sequences(self, sequences: List[List[int]]) -> np.ndarray:
        """Pads or truncates integer sequences to fixed length self.max_seq_len."""
        padded = np.zeros((len(sequences), self.max_seq_len), dtype=np.int32)
        for i, seq in enumerate(sequences):
            if not seq:
                continue
            truncated = seq[: self.max_seq_len]
            padded[i, : len(truncated)] = truncated
        return padded

    def transform(self, texts: Union[str, List[str]]) -> np.ndarray:
        """Full pipeline: clean -> sequence -> pad."""
        if isinstance(texts, str):
            texts = [texts]
        seqs = self.texts_to_sequences(texts)
        return self.pad_sequences(seqs)

    def to_dict(self) -> dict:
        """Exports preprocessor state to serializable dictionary."""
        return {
            'max_vocab_size': self.max_vocab_size,
            'max_seq_len': self.max_seq_len,
            'vocab_size': len(self.word_index),
            'word_index': self.word_index,
        }

    @classmethod
    def from_dict(cls, data: dict) -> 'TextPreprocessor':
        """Reconstructs preprocessor from dictionary state."""
        instance = cls(
            max_vocab_size=data['max_vocab_size'],
            max_seq_len=data['max_seq_len']
        )
        instance.word_index = data['word_index']
        instance.index_word = {int(v): k for k, v in data['word_index'].items()}
        instance.fitted = True
        return instance

    def save(self, filepath: Union[str, Path]) -> None:
        """Saves tokenizer state cleanly to JSON file."""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> 'TextPreprocessor':
        """Loads tokenizer state from JSON file."""
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return cls.from_dict(data)
