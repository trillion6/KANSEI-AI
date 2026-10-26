def test_user_registration_success(client, db_session):
    """Verify successful user registration and that response never contains password hash."""
    payload = {
        "email": "sarah.connor@kansi.ai",
        "username": "sarahconnor",
        "full_name": "Sarah Connor",
        "password": "ResistancePassword2026!"
    }
    response = client.post('/api/auth/register', json=payload)
    assert response.status_code == 201

    json_data = response.get_json()
    assert json_data['status'] == 'success'
    user_data = json_data['data']
    assert user_data['email'] == "sarah.connor@kansi.ai"
    assert user_data['username'] == "sarahconnor"
    assert 'password_hash' not in user_data
    assert 'password' not in user_data

def test_user_registration_validation_errors(client, db_session):
    """Verify that malformed email or short password return 400 Bad Request."""
    # Short password
    res_short = client.post('/api/auth/register', json={
        "email": "valid@kansi.ai",
        "username": "validuser",
        "full_name": "Valid User",
        "password": "123"
    })
    assert res_short.status_code == 400
    assert "8 characters" in res_short.get_json()['message']

    # Malformed email
    res_email = client.post('/api/auth/register', json={
        "email": "not-an-email",
        "username": "validuser2",
        "full_name": "Valid User",
        "password": "ValidPassword123!"
    })
    assert res_email.status_code == 400
    assert "valid email address" in res_email.get_json()['message']

def test_user_registration_duplicate_email_conflict(client, db_session):
    """Verify that registering with an already existing email returns 409 Conflict."""
    payload = {
        "email": "duplicate.test@kansi.ai",
        "username": "original_user",
        "full_name": "Original User",
        "password": "Password12345!"
    }
    client.post('/api/auth/register', json=payload)

    # Attempt second registration with same email
    res_dup = client.post('/api/auth/register', json={
        "email": "duplicate.test@kansi.ai",
        "username": "another_user",
        "full_name": "Another User",
        "password": "DifferentPassword123!"
    })
    assert res_dup.status_code == 409
    assert "already exists" in res_dup.get_json()['message']

def test_user_login_success_and_failure(client, db_session):
    """Verify credential verification for login."""
    # Register first
    client.post('/api/auth/register', json={
        "email": "login.test@kansi.ai",
        "username": "logintest",
        "full_name": "Login Tester",
        "password": "CorrectPassword123!"
    })

    # Successful login
    res_success = client.post('/api/auth/login', json={
        "email": "login.test@kansi.ai",
        "password": "CorrectPassword123!"
    })
    assert res_success.status_code == 200
    data = res_success.get_json()['data']
    assert data['email'] == "login.test@kansi.ai"
    assert 'password_hash' not in data

    # Incorrect password returns 401
    res_wrong_pass = client.post('/api/auth/login', json={
        "email": "login.test@kansi.ai",
        "password": "IncorrectPassword!"
    })
    assert res_wrong_pass.status_code == 401
    assert "Invalid email address or password" in res_wrong_pass.get_json()['message']

    # Non-existent email returns 401
    res_non_existent = client.post('/api/auth/login', json={
        "email": "ghost@kansi.ai",
        "password": "AnyPassword123!"
    })
    assert res_non_existent.status_code == 401
