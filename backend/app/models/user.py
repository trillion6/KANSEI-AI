from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from ..extensions import db

class User(db.Model):
    """
    User model representing registered KANSEI AI workspace users.
    Enforces normalized unique email & username, secure password hashing,
    and automatic cascading deletion for associated sentiment records.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    full_name = db.Column(db.String(128), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(32), nullable=False, default='user')
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(
        db.DateTime, 
        nullable=False, 
        default=lambda: datetime.now(timezone.utc), 
        onupdate=lambda: datetime.now(timezone.utc)
    )

    # Cascading one-to-many relationship: deleting user purges all user-owned analyses
    analyses = db.relationship(
        'SentimentAnalysis',
        back_populates='user',
        cascade='all, delete-orphan',
        lazy='dynamic'
    )

    def set_password(self, plain_password: str) -> None:
        """Hashes the password using scrypt or pbkdf2 with salt."""
        if not plain_password or len(plain_password) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        self.password_hash = generate_password_hash(plain_password)

    def check_password(self, plain_password: str) -> bool:
        """Verifies plain password against stored hash."""
        if not self.password_hash or not plain_password:
            return False
        return check_password_hash(self.password_hash, plain_password)

    def to_dict(self) -> dict:
        """
        Serializes user object into a safe dictionary.
        CRITICAL: Never exposes password_hash or session secrets.
        """
        return {
            'id': self.id,
            'email': self.email,
            'username': self.username,
            'full_name': self.full_name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

    def __repr__(self) -> str:
        return f"<User id={self.id} username='{self.username}' email='{self.email}'>"
