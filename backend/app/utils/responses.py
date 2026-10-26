from flask import jsonify

def success_response(data=None, message="Success", status_code=200):
    """Returns a standardized JSON success envelope."""
    payload = {
        "status": "success",
        "message": message,
        "data": data,
        "error": None
    }
    return jsonify(payload), status_code

def error_response(message="An error occurred", status_code=400, details=None):
    """Returns a standardized JSON error envelope."""
    payload = {
        "status": "error",
        "message": message,
        "data": None,
        "error": details or message
    }
    return jsonify(payload), status_code
