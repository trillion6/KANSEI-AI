from flask import Blueprint, request, session, jsonify, current_app
from flask_wtf.csrf import generate_csrf
from ..extensions import limiter
from ..services.auth_service import AuthService
from ..utils.responses import success_response, error_response
from ..utils.security import get_current_user, login_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/csrf-token', methods=['GET'])
def get_csrf_token():
    """
    Returns a freshly generated CSRF token associated with the caller's session.
    Clients must attach this token in the 'X-CSRF-Token' header for state-changing operations.
    """
    token = generate_csrf()
    response = success_response(
        data={'csrf_token': token},
        message="CSRF token issued successfully.",
        status_code=200
    )
    # Also set as a non-HttpOnly cookie for client convenience if desired
    return response

@auth_bp.route('/register', methods=['POST'])
@limiter.limit("10 per minute")
def register():
    """
    Registers a new user account with validated input and scrypt password hashing.
    Establishes server-managed session upon successful registration.
    Expects JSON: { email, username, full_name, password }
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return error_response(message="Invalid or missing JSON request body.", status_code=400)

    email = data.get('email')
    username = data.get('username')
    full_name = data.get('full_name')
    password = data.get('password')

    user, err_msg = AuthService.register_user(
        email=email,
        username=username,
        full_name=full_name,
        password=password
    )

    if err_msg:
        status_code = 409 if "already exists" in err_msg or "already taken" in err_msg else 400
        return error_response(message=err_msg, status_code=status_code)

    # Safely establish authenticated session with session fixation defense
    if hasattr(current_app.session_interface, 'regenerate'):
        current_app.session_interface.regenerate(session)
    session.clear()
    session['user_id'] = user.id
    session.permanent = True
    session.modified = True

    return success_response(
        data=user.to_dict(),
        message="Account created successfully.",
        status_code=201
    )

@auth_bp.route('/login', methods=['POST'])
@limiter.limit("10 per minute")
def login():
    """
    Authenticates user credentials against salted password hashes.
    Establishes server-managed session state.
    Expects JSON: { email, password }
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return error_response(message="Invalid or missing JSON request body.", status_code=400)

    email = data.get('email')
    password = data.get('password')

    user, err_msg = AuthService.authenticate_user(email=email, password=password)

    if err_msg:
        return error_response(message=err_msg, status_code=401)

    # Safely establish authenticated session with session fixation defense
    if hasattr(current_app.session_interface, 'regenerate'):
        current_app.session_interface.regenerate(session)
    session.clear()
    session['user_id'] = user.id
    session.permanent = True
    session.modified = True

    return success_response(
        data=user.to_dict(),
        message="Authentication successful.",
        status_code=200
    )

@auth_bp.route('/logout', methods=['POST'])
def logout():
    """
    Terminates the user's active session.
    Server-side invalidation removes session entry from the server-side store.
    """
    session.clear()
    session.modified = True
    return success_response(
        data=None,
        message="Logged out successfully.",
        status_code=200
    )

@auth_bp.route('/me', methods=['GET'])
@login_required
def get_current_user_profile():
    """
    Returns the current authenticated user's safe profile.
    Rejects unauthenticated requests with HTTP 401.
    Never exposes password hashes or session secrets.
    """
    user = get_current_user()
    return success_response(
        data=user.to_dict(),
        message="User profile retrieved.",
        status_code=200
    )
