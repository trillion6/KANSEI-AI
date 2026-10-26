import re
from typing import Optional, Tuple
from ..extensions import db
from ..models.user import User

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')

class AuthService:
    """Authentication and user management service layer."""

    @staticmethod
    def register_user(
        email: str,
        username: str,
        full_name: str,
        password: str,
        role: str = 'user'
    ) -> Tuple[Optional[User], Optional[str]]:
        """
        Validates credentials and registers a new user.
        Returns (user, None) on success or (None, error_message) on failure.
        """
        # 1. Input presence validation
        if not email or not username or not full_name or not password:
            return None, "All fields (email, username, full_name, password) are required."

        # 2. Email normalization and format validation
        norm_email = email.strip().lower()
        if not EMAIL_REGEX.match(norm_email):
            return None, "Please provide a valid email address format."

        # 3. Username normalization and length validation
        norm_username = username.strip().lower()
        if len(norm_username) < 3 or not norm_username.replace('_', '').replace('.', '').isalnum():
            return None, "Username must be at least 3 characters and contain only alphanumeric characters, dots, or underscores."

        # 4. Password length validation
        if len(password) < 8:
            return None, "Password must be at least 8 characters long."

        # 5. Check uniqueness constraints
        if User.query.filter_by(email=norm_email).first():
            return None, "An account with this email address already exists."

        if User.query.filter_by(username=norm_username).first():
            return None, "This username is already taken. Please choose another."

        # 6. Instantiate and hash password
        user = User(
            email=norm_email,
            username=norm_username,
            full_name=full_name.strip(),
            role=role,
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        return user, None

    @staticmethod
    def authenticate_user(email: str, password: str) -> Tuple[Optional[User], Optional[str]]:
        """
        Verifies credentials against hashed password.
        Returns (user, None) on success or (None, error_message) on failure.
        """
        if not email or not password:
            return None, "Email and password are required."

        norm_email = email.strip().lower()
        user = User.query.filter_by(email=norm_email).first()

        if not user or not user.check_password(password):
            return None, "Invalid email address or password."

        return user, None
