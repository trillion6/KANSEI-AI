import pytest
from sqlalchemy.exc import IntegrityError
from app.models.user import User
from app.models.analysis import SentimentAnalysis

def test_user_password_hashing(db_session):
    """Verify that password is never stored in plain-text and hashes correctly."""
    plain_password = "SecureEnterprisePassword123!"
    user = User(
        email="dev.lead@kansi.ai",
        username="devlead",
        full_name="Dev Lead"
    )
    user.set_password(plain_password)
    db_session.add(user)
    db_session.commit()

    # Password hash must not equal plain text
    assert user.password_hash != plain_password
    assert len(user.password_hash) > 20
    assert user.check_password(plain_password) is True
    assert user.check_password("WrongPassword123!") is False

def test_user_to_dict_never_exposes_password_hash(db_session):
    """Verify that user serialization never leaks password hash or secrets."""
    user = User(
        email="privacy.audit@kansi.ai",
        username="privacyaudit",
        full_name="Privacy Auditor"
    )
    user.set_password("AuditPassword2026!")
    db_session.add(user)
    db_session.commit()

    serialized = user.to_dict()
    assert 'password_hash' not in serialized
    assert 'password' not in serialized
    assert serialized['email'] == "privacy.audit@kansi.ai"
    assert serialized['username'] == "privacyaudit"

def test_unique_email_constraint(db_session):
    """Verify that duplicate normalized emails trigger an IntegrityError."""
    user1 = User(
        email="duplicate@kansi.ai",
        username="user_one",
        full_name="User One"
    )
    user1.set_password("Password12345!")
    db_session.add(user1)
    db_session.commit()

    user2 = User(
        email="duplicate@kansi.ai",
        username="user_two",
        full_name="User Two"
    )
    user2.set_password("Password67890!")
    db_session.add(user2)

    with pytest.raises(IntegrityError):
        db_session.commit()

def test_sentiment_analysis_relationship_and_nullable_prediction(db_session):
    """
    Verify SentimentAnalysis creation, foreign key relationship to User,
    and verify that sentiment and confidence remain nullable until model inference.
    """
    user = User(
        email="analyst@kansi.ai",
        username="analyst_test",
        full_name="Sentiment Analyst"
    )
    user.set_password("SecurePassword2026!")
    db_session.add(user)
    db_session.commit()

    # Create analysis with nullable prediction fields (pre-inference state)
    analysis = SentimentAnalysis(
        user_id=user.id,
        text="The interface layout is extremely intuitive and fast.",
        word_count=8,
        char_count=52,
        sentiment=None,
        confidence=None,
        probabilities_json=None
    )
    db_session.add(analysis)
    db_session.commit()

    assert analysis.id is not None
    assert analysis.sentiment is None
    assert analysis.confidence is None
    assert analysis.user.id == user.id
    assert user.analyses.count() == 1

def test_cascade_delete_user_removes_analyses(db_session):
    """Verify that deleting a User cascades and deletes all associated analyses."""
    user = User(
        email="cascade@kansi.ai",
        username="cascade_user",
        full_name="Cascade User"
    )
    user.set_password("CascadePass123!")
    db_session.add(user)
    db_session.commit()

    analysis1 = SentimentAnalysis(
        user_id=user.id,
        text="Sample review one",
        sentiment="positive",
        confidence=94.5
    )
    analysis2 = SentimentAnalysis(
        user_id=user.id,
        text="Sample review two",
        sentiment="negative",
        confidence=88.2
    )
    db_session.add_all([analysis1, analysis2])
    db_session.commit()

    analysis_id1 = analysis1.id
    analysis_id2 = analysis2.id

    # Delete parent user
    db_session.delete(user)
    db_session.commit()

    # Child analyses must be purged
    assert db_session.get(SentimentAnalysis, analysis_id1) is None
    assert db_session.get(SentimentAnalysis, analysis_id2) is None
