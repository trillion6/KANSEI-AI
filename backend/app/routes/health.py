from flask import Blueprint
from sqlalchemy import text
from ..extensions import db
from ..utils.responses import success_response, error_response

health_bp = Blueprint('health', __name__, url_prefix='/api/health')

@health_bp.route('', methods=['GET'])
def health_check():
    """
    Health check endpoint reporting API status and database connectivity.
    """
    db_status = "connected"
    try:
        db.session.execute(text('SELECT 1'))
    except Exception as e:
        db_status = f"disconnected: {str(e)}"
        return error_response(
            message="Database connectivity failure",
            status_code=503,
            details={"database": db_status}
        )

    return success_response(
        message="KANSEI AI Sentiment API is operational",
        data={
            "service": "kansei-sentiment-api",
            "phase": "Phase 3: Backend & Database Foundation",
            "database": db_status,
            "version": "1.0.0"
        }
    )
