import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory: backend/
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env if present
load_dotenv(BASE_DIR / '.env')


from datetime import timedelta

class BaseConfig:
    """Base configuration settings shared across all environments."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'kansi-ai-default-dev-secret-phase3')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

    # Cookie & Server-Side Session Security
    SESSION_TYPE = os.environ.get('SESSION_TYPE', 'sqlalchemy')
    SESSION_SQLALCHEMY_TABLE = 'flask_sessions'
    SESSION_USE_SIGNER = True  # Cryptographically sign opaque session identifier cookies
    SESSION_PERMANENT = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

    # CORS configuration - strict list of permitted client origins (never wildcard with credentials)
    raw_cors = os.environ.get('CORS_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173')
    CORS_ORIGINS = [o.strip() for o in raw_cors.split(',') if o.strip()]

    # CSRF Protection
    WTF_CSRF_ENABLED = True
    WTF_CSRF_HEADERS = ['X-CSRF-Token', 'X-CSRFToken']
    WTF_CSRF_TIME_LIMIT = 3600 * 24
    WTF_CSRF_CHECK_DEFAULT = True

    # Rate Limiting configuration
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = os.environ.get('RATELIMIT_STORAGE_URI', 'memory://')
    RATELIMIT_STRATEGY = 'fixed-window'
    RATELIMIT_DEFAULT = '200 per day;50 per hour'


class DevelopmentConfig(BaseConfig):
    """Development configuration with local SQLite database."""
    DEBUG = True
    TESTING = False
    SESSION_COOKIE_SECURE = False
    INSTANCE_DIR = BASE_DIR / 'instance'
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{INSTANCE_DIR / 'kansi.db'}"
    )


class TestingConfig(BaseConfig):
    """Testing configuration with in-memory SQLite database."""
    DEBUG = False
    TESTING = True
    SESSION_COOKIE_SECURE = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    RATELIMIT_ENABLED = False


class ProductionConfig(BaseConfig):
    """Production configuration with strict environment settings."""
    DEBUG = False
    TESTING = False
    SESSION_COOKIE_SECURE = True
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')


config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
