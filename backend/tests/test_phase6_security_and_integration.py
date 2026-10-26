import pytest
from flask import session
from app import create_app
from app.extensions import db, limiter
from app.models.user import User
from app.models.analysis import SentimentAnalysis

def test_session_establishment_and_me_profile(client, db_session):
    """Verify login establishes session and /api/auth/me retrieves authenticated user profile."""
    # 1. Register test user
    client.post('/api/auth/register', json={
        "email": "session.user@kansi.ai",
        "username": "sessionuser",
        "full_name": "Session User",
        "password": "StrongPassword123!"
    })

    # 2. Check /api/auth/me immediately (registration establishes session)
    res_me = client.get('/api/auth/me')
    assert res_me.status_code == 200
    user_info = res_me.get_json()['data']
    assert user_info['email'] == "session.user@kansi.ai"
    assert user_info['username'] == "sessionuser"
    assert 'password_hash' not in user_info

    # 3. Explicit login also re-establishes session
    res_login = client.post('/api/auth/login', json={
        "email": "session.user@kansi.ai",
        "password": "StrongPassword123!"
    })
    assert res_login.status_code == 200

    # 4. Profile retrieval succeeds
    res_me2 = client.get('/api/auth/me')
    assert res_me2.status_code == 200
    assert res_me2.get_json()['data']['email'] == "session.user@kansi.ai"

def test_logout_invalidates_session(client, db_session):
    """Verify logout terminates session and prevents subsequent access to private endpoints."""
    # Register and login
    client.post('/api/auth/register', json={
        "email": "logout.test@kansi.ai",
        "username": "logouttest",
        "full_name": "Logout Tester",
        "password": "Password12345!"
    })

    # Verify authenticated
    assert client.get('/api/auth/me').status_code == 200

    # Call logout
    res_logout = client.post('/api/auth/logout')
    assert res_logout.status_code == 200
    assert "Logged out successfully" in res_logout.get_json()['message']

    # Subsequent /api/auth/me returns 401
    res_me = client.get('/api/auth/me')
    assert res_me.status_code == 401
    assert "Authentication required" in res_me.get_json()['message']

def test_protected_endpoints_reject_unauthenticated_requests(client, db_session):
    """Verify protected history and analytics endpoints return 401 for anonymous clients."""
    assert client.get('/api/auth/me').status_code == 401
    assert client.get('/api/sentiment/history').status_code == 401
    assert client.get('/api/sentiment/history/1').status_code == 401
    assert client.delete('/api/sentiment/history/1').status_code == 401
    assert client.get('/api/analytics/metrics').status_code == 401

def test_csrf_protection_and_token_generation():
    """Verify CSRF token generation and validation on state-changing requests when enabled."""
    app_csrf = create_app('testing')
    app_csrf.config['WTF_CSRF_ENABLED'] = True
    app_csrf.config['SECRET_KEY'] = 'test-csrf-secret'
    app_csrf.config['WTF_CSRF_HEADERS'] = ['X-CSRF-Token', 'X-CSRFToken']

    with app_csrf.app_context():
        db.create_all()
        client = app_csrf.test_client()

        # 1. State-changing request without token returns 400
        res_no_token = client.post('/api/auth/login', json={
            "email": "csrf.test@kansi.ai",
            "password": "AnyPassword123!"
        })
        assert res_no_token.status_code == 400
        assert "CSRF validation failed" in res_no_token.get_json()['message']

        # 2. Fetch fresh CSRF token from endpoint
        res_token = client.get('/api/auth/csrf-token')
        assert res_token.status_code == 200
        csrf_token = res_token.get_json()['data']['csrf_token']
        assert csrf_token and len(csrf_token) > 10

        # 3. Post with valid CSRF token header is processed (fails auth with 401, not CSRF 400)
        res_with_token = client.post(
            '/api/auth/login',
            json={"email": "csrf.test@kansi.ai", "password": "AnyPassword123!"},
            headers={'X-CSRF-Token': csrf_token}
        )
        assert res_with_token.status_code == 401
        assert "Invalid email address or password" in res_with_token.get_json()['message']

def test_login_rate_limiting():
    """Verify rate limiter blocks abusive repeated requests with HTTP 429."""
    from app.config import TestingConfig, config_by_name

    class RateLimitTestConfig(TestingConfig):
        RATELIMIT_ENABLED = True
        RATELIMIT_STORAGE_URI = 'memory://'

    config_by_name['ratelimit_test'] = RateLimitTestConfig
    app_rate = create_app('ratelimit_test')

    try:
        with app_rate.app_context():
            db.create_all()
            client = app_rate.test_client()

            # Route limit is 10 per minute. Fire 13 requests.
            status_codes = []
            for _ in range(13):
                res = client.post('/api/auth/login', json={
                    "email": "spam@kansi.ai",
                    "password": "WrongPassword!"
                })
                status_codes.append(res.status_code)

            # First 10 should be 401 (invalid creds), 11th onwards should be 429
            assert 429 in status_codes
            first_429_idx = status_codes.index(429)
            assert first_429_idx == 10
    finally:
        limiter.reset()
        limiter.enabled = False

def test_inference_persistence_for_authenticated_user(client, db_session):
    """Verify single and batch inference are automatically saved for authenticated sessions."""
    # Register & authenticate
    client.post('/api/auth/register', json={
        "email": "analyst@kansi.ai",
        "username": "analyst",
        "full_name": "Chief Analyst",
        "password": "Password123!"
    })

    # Single text analysis
    res_single = client.post('/api/sentiment/analyze', json={
        "text": "The flight was extraordinary! Amazing customer service and delightful snacks."
    })
    assert res_single.status_code == 200
    data_single = res_single.get_json()['data']
    assert data_single['sentiment'] == 'positive'
    assert data_single['saved'] is True
    assert data_single['id'] is not None

    record_id = data_single['id']

    # Verify record in database
    db_record = db.session.get(SentimentAnalysis, record_id)
    assert db_record is not None
    assert db_record.sentiment == 'positive'
    assert db_record.user.email == "analyst@kansi.ai"

    # Batch text analysis
    batch_payload = {
        "texts": [
            "Delayed for six hours, totally unacceptable service.",
            "Standard flight on time with normal cabin temperature."
        ]
    }
    res_batch = client.post('/api/sentiment/batch', json=batch_payload)
    assert res_batch.status_code == 200
    batch_data = res_batch.get_json()['data']
    assert len(batch_data['items']) == 2
    assert batch_data['items'][0]['saved'] is True
    assert batch_data['items'][1]['saved'] is True
    assert batch_data['items'][0]['id'] != batch_data['items'][1]['id']

def test_history_and_analytics_user_isolation(client, db_session):
    """Verify strict tenant isolation: users can never view, mutate, or aggregate other users' records."""
    # 1. User A creates records
    client.post('/api/auth/register', json={
        "email": "userA@kansi.ai",
        "username": "user_a",
        "full_name": "User Alpha",
        "password": "AlphaPassword123!"
    })

    res_a = client.post('/api/sentiment/analyze', json={
        "text": "User A exclusive positive review! Excellent service."
    })
    user_a_record_id = res_a.get_json()['data']['id']

    # Check User A history has 1 record
    res_hist_a = client.get('/api/sentiment/history')
    assert res_hist_a.status_code == 200
    assert len(res_hist_a.get_json()['data']['items']) == 1

    # Check User A analytics
    res_analytics_a = client.get('/api/analytics/metrics')
    assert res_analytics_a.get_json()['data']['total_analyses'] == 1

    # 2. User B registers and logs in
    client.post('/api/auth/register', json={
        "email": "userB@kansi.ai",
        "username": "user_b",
        "full_name": "User Beta",
        "password": "BetaPassword123!"
    })

    # User B history must be EMPTY
    res_hist_b = client.get('/api/sentiment/history')
    assert res_hist_b.status_code == 200
    assert len(res_hist_b.get_json()['data']['items']) == 0
    assert res_hist_b.get_json()['data']['pagination']['total'] == 0

    # User B analytics must be 0
    res_analytics_b = client.get('/api/analytics/metrics')
    assert res_analytics_b.get_json()['data']['total_analyses'] == 0
    assert res_analytics_b.get_json()['data']['average_confidence'] == 0.0

    # User B attempts to access User A's record -> 404 Not Found
    res_detail_b = client.get(f'/api/sentiment/history/{user_a_record_id}')
    assert res_detail_b.status_code == 404

    # User B attempts to delete User A's record -> 404 Not Found
    res_del_b = client.delete(f'/api/sentiment/history/{user_a_record_id}')
    assert res_del_b.status_code == 404

    # Verify User A's record was NOT deleted
    assert db.session.get(SentimentAnalysis, user_a_record_id) is not None

def test_history_filtering_search_and_deletion(client, db_session):
    """Verify history search, sentiment filtering, sorting, and user self-deletion."""
    client.post('/api/auth/register', json={
        "email": "filter.test@kansi.ai",
        "username": "filtertest",
        "full_name": "Filter Tester",
        "password": "Password12345!"
    })

    # Add 3 records: positive, negative, neutral
    res1 = client.post('/api/sentiment/analyze', json={"text": "Superb luxury flight experience."})
    id1 = res1.get_json()['data']['id']

    res2 = client.post('/api/sentiment/analyze', json={"text": "Horrible baggage loss and lost luggage."})
    id2 = res2.get_json()['data']['id']

    res3 = client.post('/api/sentiment/analyze', json={"text": "Boarding gate change announced."})
    id3 = res3.get_json()['data']['id']

    # Filter by positive
    res_pos = client.get('/api/sentiment/history?sentiment=positive')
    items_pos = res_pos.get_json()['data']['items']
    assert all(i['sentiment'] == 'positive' for i in items_pos)

    # Search for "baggage"
    res_search = client.get('/api/sentiment/history?search=baggage')
    items_search = res_search.get_json()['data']['items']
    assert len(items_search) == 1
    assert "luggage" in items_search[0]['text'].lower()

    # Delete record id2
    res_del = client.delete(f'/api/sentiment/history/{id2}')
    assert res_del.status_code == 200

    # Now total is 2
    res_after_del = client.get('/api/sentiment/history')
    assert res_after_del.get_json()['data']['pagination']['total'] == 2
    assert db.session.get(SentimentAnalysis, id2) is None

def test_empty_history_metrics_behavior(client, db_session):
    """Verify metrics handle new user with zero records cleanly without exceptions."""
    client.post('/api/auth/register', json={
        "email": "empty.user@kansi.ai",
        "username": "emptyuser",
        "full_name": "Empty User",
        "password": "Password12345!"
    })

    res = client.get('/api/analytics/metrics')
    assert res.status_code == 200
    data = res.get_json()['data']
    assert data['total_analyses'] == 0
    assert data['positive_count'] == 0
    assert data['neutral_count'] == 0
    assert data['negative_count'] == 0
    assert data['average_confidence'] == 0.0
    assert len(data['recent_activity']) == 0
    assert len(data['sentiment_trends']) == 0

def test_client_supplied_user_id_is_ignored(client, db_session):
    """Verify client cannot spoof user_id in payload."""
    client.post('/api/auth/register', json={
        "email": "honest@kansi.ai",
        "username": "honestuser",
        "full_name": "Honest User",
        "password": "Password12345!"
    })
    me = client.get('/api/auth/me').get_json()['data']
    real_user_id = me['id']

    # Submit analysis with forged user_id
    res = client.post('/api/sentiment/analyze', json={
        "text": "Great flight experience with forged id.",
        "user_id": 999999
    })
    assert res.status_code == 200
    data = res.get_json()['data']
    assert data['saved'] is True

    record = db.session.get(SentimentAnalysis, data['id'])
    assert record.user_id == real_user_id
    assert record.user_id != 999999

def test_database_persistence_failure_handling(client, db_session, monkeypatch):
    """Verify that unexpected database commit errors safely abort with 500 error and rollback."""
    client.post('/api/auth/register', json={
        "email": "dbfail@kansi.ai",
        "username": "dbfailuser",
        "full_name": "DB Fail User",
        "password": "Password12345!"
    })

    original_commit = db.session.commit
    called = False

    def mock_commit():
        nonlocal called
        if not called:
            called = True
            raise Exception("Simulated SQLite write/disk failure")
        return original_commit()

    monkeypatch.setattr(db.session, "commit", mock_commit)

    res = client.post('/api/sentiment/analyze', json={
        "text": "Great flight experience during database failure test."
    })
    assert res.status_code == 500
    assert "Database persistence failure" in res.get_json()['message']

def test_server_side_session_revocation_on_logout(app, client, db_session):
    """
    Phase 6.1: Verify true server-side session invalidation.
    When a user logs out, the session row is deleted from the server-side store (flask_sessions).
    Any copied or captured session cookie cannot be replayed after logout.
    """
    # 1. Register and login
    res_reg = client.post('/api/auth/register', json={
        "email": "revocation.user@kansi.ai",
        "username": "revocationuser",
        "full_name": "Revocation User",
        "password": "Password12345!"
    })
    assert res_reg.status_code == 201

    # Capture the session cookie
    cookie_headers = [h for h in res_reg.headers.getlist('Set-Cookie') if 'session=' in h]
    assert len(cookie_headers) > 0
    session_cookie_val = cookie_headers[0].split(';')[0].split('=', 1)[1]

    # Verify session exists in server-side table
    with app.app_context():
        rows = db.session.execute(db.text("SELECT session_id FROM flask_sessions")).fetchall()
        assert len(rows) > 0

    # 2. Second independent test client replays the copied cookie
    c2 = app.test_client()
    c2.set_cookie('session', session_cookie_val)
    res_c2_before = c2.get('/api/auth/me')
    assert res_c2_before.status_code == 200
    assert res_c2_before.get_json()['data']['email'] == "revocation.user@kansi.ai"

    # 3. User logs out on client 1
    res_logout = client.post('/api/auth/logout')
    assert res_logout.status_code == 200

    # Verify session row is purged from server-side store
    with app.app_context():
        rows_after = db.session.execute(db.text("SELECT session_id FROM flask_sessions")).fetchall()
        assert len(rows_after) == 0

    # 4. Attempt to replay the captured cookie on client 2 must fail with 401
    res_c2_after = c2.get('/api/auth/me')
    assert res_c2_after.status_code == 401
    assert "Authentication required" in res_c2_after.get_json()['message']

def test_session_fixation_prevention_on_login(app, db_session):
    """
    Phase 6.1: Verify session fixation defense.
    An anonymous visitor receives an anonymous session ID.
    Upon login, session_interface.regenerate() issues a fresh session ID and drops the anonymous ID.
    An attacker cannot fix the session ID prior to authentication.
    """
    c = app.test_client()

    # Create user in database
    with app.app_context():
        u = User(email="fixation@kansi.ai", username="fixationuser", full_name="Fixation User")
        u.set_password("Password12345!")
        db.session.add(u)
        db.session.commit()

    # 1. Anonymous request obtains CSRF token and anonymous session cookie
    res_anon = c.get('/api/auth/csrf-token')
    anon_cookies = [h for h in res_anon.headers.getlist('Set-Cookie') if 'session=' in h]
    assert len(anon_cookies) > 0
    anon_session_val = anon_cookies[0].split(';')[0].split('=', 1)[1]

    # 2. Authenticate
    res_login = c.post('/api/auth/login', json={
        "email": "fixation@kansi.ai",
        "password": "Password12345!"
    })
    assert res_login.status_code == 200
    login_cookies = [h for h in res_login.headers.getlist('Set-Cookie') if 'session=' in h]
    assert len(login_cookies) > 0
    auth_session_val = login_cookies[0].split(';')[0].split('=', 1)[1]

    # 3. Session IDs must differ
    assert anon_session_val != auth_session_val

    # 4. An attacker attempting to access /api/auth/me with the pre-login anonymous session ID is rejected
    c_attacker = app.test_client()
    c_attacker.set_cookie('session', anon_session_val)
    res_attacker = c_attacker.get('/api/auth/me')
    assert res_attacker.status_code == 401

def test_session_cookie_flags_enforced(client, db_session):
    """
    Phase 6.1: Verify session cookie security flags (HttpOnly, SameSite).
    """
    res = client.post('/api/auth/register', json={
        "email": "cookieflags@kansi.ai",
        "username": "cookieflags",
        "full_name": "Cookie Flags",
        "password": "Password12345!"
    })
    cookie_headers = [h for h in res.headers.getlist('Set-Cookie') if 'session=' in h]
    assert len(cookie_headers) > 0
    raw_cookie = cookie_headers[0]

    # Check HttpOnly and SameSite
    assert 'HttpOnly' in raw_cookie
    assert 'SameSite=Lax' in raw_cookie

def test_tampered_session_cookie_rejected(app, db_session):
    """
    Phase 6.1: Verify cryptographically signed session cookies reject tampered IDs.
    """
    c = app.test_client()
    c.set_cookie('session', 'fake-tampered-session-token.invalid-signature')
    res = c.get('/api/auth/me')
    assert res.status_code == 401

