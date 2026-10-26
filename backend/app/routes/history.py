from flask import Blueprint, request
from ..extensions import db
from ..models.analysis import SentimentAnalysis
from ..utils.responses import success_response, error_response
from ..utils.security import login_required, get_current_user

history_bp = Blueprint('history', __name__, url_prefix='/api/sentiment/history')

@history_bp.route('', methods=['GET'])
@login_required
def list_history():
    """
    Lists the authenticated user's sentiment analysis records with pagination,
    filtering, and search. Never exposes another user's records.
    Query parameters:
    - page: int (default: 1)
    - per_page: int (default: 10, max: 100)
    - sentiment: string ('positive', 'neutral', 'negative', or 'all')
    - search: string (sub-string search within text)
    - sort: string ('date-desc', 'date-asc', 'conf-desc', 'conf-asc')
    """
    user = get_current_user()

    try:
        page = max(1, int(request.args.get('page', 1)))
        per_page = min(100, max(1, int(request.args.get('per_page', 10))))
    except (ValueError, TypeError):
        page = 1
        per_page = 10

    sentiment_filter = request.args.get('sentiment', 'all').strip().lower()
    search_query = request.args.get('search', '').strip()
    sort_by = request.args.get('sort', 'date-desc').strip().lower()

    # Base query strictly scoped to authenticated user
    query = SentimentAnalysis.query.filter_by(user_id=user.id)

    # Sentiment filtering
    if sentiment_filter in ('positive', 'neutral', 'negative'):
        query = query.filter_by(sentiment=sentiment_filter)

    # Search keyword filtering
    if search_query:
        query = query.filter(SentimentAnalysis.text.ilike(f"%{search_query}%"))

    # Sorting
    if sort_by == 'date-asc':
        query = query.order_by(SentimentAnalysis.created_at.asc())
    elif sort_by == 'conf-desc':
        query = query.order_by(SentimentAnalysis.confidence.desc())
    elif sort_by == 'conf-asc':
        query = query.order_by(SentimentAnalysis.confidence.asc())
    else:  # Default: date-desc
        query = query.order_by(SentimentAnalysis.created_at.desc())

    paginated = query.paginate(page=page, per_page=per_page, error_out=False)

    return success_response(
        data={
            'items': [record.to_dict() for record in paginated.items],
            'pagination': {
                'total': paginated.total,
                'page': paginated.page,
                'per_page': paginated.per_page,
                'pages': paginated.pages or 1
            }
        },
        message=f"Retrieved {len(paginated.items)} history records.",
        status_code=200
    )

@history_bp.route('/<int:record_id>', methods=['GET'])
@login_required
def get_history_detail(record_id: int):
    """
    Retrieves a single sentiment analysis record if and only if it belongs
    to the currently authenticated user. Returns 404 if not found or unauthorized.
    """
    user = get_current_user()
    record = SentimentAnalysis.query.filter_by(id=record_id, user_id=user.id).first()

    if not record:
        return error_response(
            message="Analysis record not found or access forbidden.",
            status_code=404
        )

    return success_response(
        data=record.to_dict(),
        message="History record retrieved.",
        status_code=200
    )

@history_bp.route('/<int:record_id>', methods=['DELETE'])
@login_required
def delete_history_record(record_id: int):
    """
    Deletes a specific sentiment analysis record owned by the authenticated user.
    Returns 404 if the record does not exist or belongs to another user.
    """
    user = get_current_user()
    record = SentimentAnalysis.query.filter_by(id=record_id, user_id=user.id).first()

    if not record:
        return error_response(
            message="Analysis record not found or access forbidden.",
            status_code=404
        )

    try:
        db.session.delete(record)
        db.session.commit()
        return success_response(
            data={'id': record_id},
            message="Analysis record deleted successfully.",
            status_code=200
        )
    except Exception as e:
        db.session.rollback()
        return error_response(
            message=f"Failed to delete analysis record: {str(e)}",
            status_code=500
        )
