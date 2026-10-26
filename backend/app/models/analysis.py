import json
from datetime import datetime, timezone
from ..extensions import db

class SentimentAnalysis(db.Model):
    """
    SentimentAnalysis model storing customer reviews/feedback records.
    Fields `sentiment`, `confidence`, and `probabilities_json` remain nullable
    until genuine model predictions are executed in Phase 4/5.
    """
    __tablename__ = 'sentiment_analyses'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    user_id = db.Column(
        db.Integer, 
        db.ForeignKey('users.id', ondelete='CASCADE'), 
        nullable=False, 
        index=True
    )
    text = db.Column(db.Text, nullable=False)
    
    # Nullable until genuine model inference
    sentiment = db.Column(db.String(32), nullable=True) # 'positive' | 'neutral' | 'negative'
    confidence = db.Column(db.Float, nullable=True) # Softmax confidence (0.0 to 100.0)
    probabilities_json = db.Column(db.Text, nullable=True) # JSON-encoded probability vector

    word_count = db.Column(db.Integer, nullable=False, default=0)
    char_count = db.Column(db.Integer, nullable=False, default=0)
    source = db.Column(db.String(64), nullable=False, default='web_studio')
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    # Relationship back to User
    user = db.relationship('User', back_populates='analyses')

    def set_probabilities(self, prob_dict: dict) -> None:
        """Stores the 3-class probability dictionary as a JSON string."""
        if prob_dict is not None:
            self.probabilities_json = json.dumps(prob_dict)
        else:
            self.probabilities_json = None

    def get_probabilities(self) -> dict:
        """Deserializes probability JSON string into Python dict."""
        if self.probabilities_json:
            try:
                return json.loads(self.probabilities_json)
            except (ValueError, TypeError):
                return {}
        return {}

    def to_dict(self) -> dict:
        """Serializes sentiment analysis record into dictionary format."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'text': self.text,
            'sentiment': self.sentiment,
            'confidence': round(self.confidence, 2) if self.confidence is not None else None,
            'probabilities': self.get_probabilities(),
            'word_count': self.word_count,
            'char_count': self.char_count,
            'source': self.source,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

    def __repr__(self) -> str:
        return f"<SentimentAnalysis id={self.id} user_id={self.user_id} sentiment='{self.sentiment}'>"
