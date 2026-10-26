from werkzeug.exceptions import HTTPException
from flask_wtf.csrf import CSRFError
from flask_limiter.errors import RateLimitExceeded
from .responses import error_response

def register_error_handlers(app):
    """Registers centralized JSON error handlers across the application."""

    @app.errorhandler(CSRFError)
    def handle_csrf_error(err):
        msg = f"CSRF validation failed: {err.description}" if hasattr(err, 'description') and err.description else "CSRF validation failed. The token is missing or invalid."
        return error_response(message=msg, status_code=400)

    @app.errorhandler(RateLimitExceeded)
    def handle_rate_limit_exceeded(err):
        return error_response(
            message="Too many requests. Rate limit exceeded. Please slow down and try again later.",
            status_code=429
        )

    @app.errorhandler(400)
    def handle_bad_request(err):
        msg = err.description if hasattr(err, 'description') and err.description else "Bad request syntax or invalid parameters."
        return error_response(message=msg, status_code=400)

    @app.errorhandler(401)
    def handle_unauthorized(err):
        msg = err.description if hasattr(err, 'description') and err.description else "Authentication required or credentials invalid."
        return error_response(message=msg, status_code=401)

    @app.errorhandler(403)
    def handle_forbidden(err):
        msg = err.description if hasattr(err, 'description') and err.description else "Access forbidden to requested resource."
        return error_response(message=msg, status_code=403)

    @app.errorhandler(404)
    def handle_not_found(err):
        return error_response(message="The requested endpoint does not exist or was not found.", status_code=404)

    @app.errorhandler(405)
    def handle_method_not_allowed(err):
        return error_response(message="HTTP method not allowed for this route.", status_code=405)

    @app.errorhandler(409)
    def handle_conflict(err):
        msg = err.description if hasattr(err, 'description') and err.description else "Resource conflict detected."
        return error_response(message=msg, status_code=409)

    @app.errorhandler(429)
    def handle_too_many_requests(err):
        return error_response(
            message="Too many requests. Rate limit exceeded. Please slow down and try again later.",
            status_code=429
        )

    @app.errorhandler(500)
    def handle_internal_error(err):
        return error_response(message="An internal server error occurred.", status_code=500)

    @app.errorhandler(Exception)
    def handle_generic_exception(err):
        if isinstance(err, HTTPException):
            return error_response(message=err.description, status_code=err.code)
        app.logger.error(f"Unhandled error: {err}", exc_info=True)
        return error_response(message="An unexpected server error occurred.", status_code=500)
