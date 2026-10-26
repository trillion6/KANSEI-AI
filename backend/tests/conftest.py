import pytest
import sys
from pathlib import Path

# Ensure backend root is on Python sys.path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from app.extensions import db

@pytest.fixture(scope='session')
def app():
    """Session-wide test Flask application configured with in-memory database."""
    _app = create_app('testing')
    with _app.app_context():
        db.create_all()
        yield _app
        db.drop_all()

@pytest.fixture(scope='function')
def client(app):
    """Test client for issuing requests."""
    return app.test_client()

@pytest.fixture(scope='function')
def db_session(app):
    """
    Creates an isolated database session per test function.
    Rolls back any changes so tests do not interfere with each other.
    """
    with app.app_context():
        # Clear existing table data between tests
        db.session.rollback()
        for table in reversed(db.metadata.sorted_tables):
            db.session.execute(table.delete())
        db.session.commit()
        yield db.session
        db.session.rollback()
