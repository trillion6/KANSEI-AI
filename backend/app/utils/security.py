from functools import wraps
from flask import session, g
from ..extensions import db
from ..models.user import User
from .responses import error_response

def get_current_user():
    """
    Retrieves the currently authenticated User instance from the active session.
    Always reads session['user_id'] to ensure freshness across requests.
    Returns None if no user is signed in or if the session is invalid.
    """
    user_id = session.get('user_id')
    if not user_id:
        if hasattr(g, 'current_user'):
            g.current_user = None
        return None

    # Check if cached instance on g matches the current session user_id
    if hasattr(g, 'current_user') and g.current_user is not None and g.current_user.id == user_id:
        return g.current_user

    user = db.session.get(User, user_id)
    if not user:
        # Session references a non-existent user record; clear stale session
        session.clear()
        g.current_user = None
        return None

    g.current_user = user
    return user

def login_required(f):
    """
    Decorator requiring an authenticated server-side session for private routes.
    Rejects unauthenticated requests with HTTP 401 and standardized error envelope.
    Never trusts client-supplied user IDs in headers or request bodies.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return error_response(
                message="Authentication required. Please sign in to access this resource.",
                status_code=401
            )
        return f(*args, **kwargs)
    return decorated_function
