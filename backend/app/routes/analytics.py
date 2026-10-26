from collections import Counter
import re
from datetime import datetime, timedelta, timezone
from flask import Blueprint, request, Response
from ..extensions import db
from ..models.analysis import SentimentAnalysis
from ..utils.responses import success_response, error_response
from ..utils.security import login_required, get_current_user

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'is', 'it', 'this', 'that', 'i', 'you', 'he', 'she', 'we',
    'they', 'was', 'were', 'be', 'been', 'are', 'as', 'from', 'my', 'me', 'your'
}

@analytics_bp.route('/metrics', methods=['GET'])
@login_required
def get_metrics():
    """
    Returns analytics metrics calculated strictly from the authenticated user's records.
    Never uses global database aggregates that could leak cross-tenant metrics.
    Handles users with zero records cleanly.
    """
    user = get_current_user()
    user_id = user.id

    # Filter base query
    user_records = SentimentAnalysis.query.filter_by(user_id=user_id).all()
    total = len(user_records)

    if total == 0:
        return success_response(
            data={
                'total_analyses': 0,
                'positive_count': 0,
                'positive_pct': 0.0,
                'neutral_count': 0,
                'neutral_pct': 0.0,
                'negative_count': 0,
                'negative_pct': 0.0,
                'average_confidence': 0.0,
                'distribution': [
                    {'name': 'Positive', 'value': 0, 'color': '#10B981'},
                    {'name': 'Neutral', 'value': 0, 'color': '#00F2FE'},
                    {'name': 'Negative', 'value': 0, 'color': '#F43F5E'}
                ],
                'recent_activity': [],
                'sentiment_trends': [],
                'frequent_words': []
            },
            message="No records found for current user. Returning zeroed metrics.",
            status_code=200
        )

    pos_count = sum(1 for r in user_records if r.sentiment == 'positive')
    neu_count = sum(1 for r in user_records if r.sentiment == 'neutral')
    neg_count = sum(1 for r in user_records if r.sentiment == 'negative')

    conf_values = [r.confidence for r in user_records if r.confidence is not None]
    avg_conf = round(sum(conf_values) / len(conf_values), 2) if conf_values else 0.0

    pos_pct = round((pos_count / total) * 100, 1)
    neu_pct = round((neu_count / total) * 100, 1)
    neg_pct = round((neg_count / total) * 100, 1)

    # Recent activity (up to 5 records sorted desc)
    sorted_records = sorted(user_records, key=lambda r: r.created_at, reverse=True)
    recent_activity = [r.to_dict() for r in sorted_records[:5]]

    # Trends: group by date (YYYY-MM-DD)
    date_groups = {}
    for r in sorted_records:
        date_str = r.created_at.strftime('%Y-%m-%d') if r.created_at else 'Unknown'
        if date_str not in date_groups:
            date_groups[date_str] = {'date': date_str, 'positive': 0, 'neutral': 0, 'negative': 0, 'total': 0}
        date_groups[date_str][r.sentiment or 'neutral'] += 1
        date_groups[date_str]['total'] += 1

    # Take most recent 14 days sorted chronologically
    trends = sorted(date_groups.values(), key=lambda x: x['date'])[-14:]

    # Frequent words extraction
    word_counters = {'positive': Counter(), 'neutral': Counter(), 'negative': Counter()}
    for r in user_records:
        sentiment = r.sentiment or 'neutral'
        tokens = re.findall(r'[a-zA-Z]{3,}', r.text.lower())
        for token in tokens:
            if token not in STOPWORDS:
                word_counters[sentiment][token] += 1

    frequent_words = []
    for sentiment, counter in word_counters.items():
        for word, count in counter.most_common(5):
            frequent_words.append({
                'text': word,
                'count': count,
                'sentiment': sentiment
            })

    return success_response(
        data={
            'total_analyses': total,
            'positive_count': pos_count,
            'positive_pct': pos_pct,
            'neutral_count': neu_count,
            'neutral_pct': neu_pct,
            'negative_count': neg_count,
            'negative_pct': neg_pct,
            'average_confidence': avg_conf,
            'distribution': [
                {'name': 'Positive', 'value': pos_count, 'color': '#10B981'},
                {'name': 'Neutral', 'value': neu_count, 'color': '#00F2FE'},
                {'name': 'Negative', 'value': neg_count, 'color': '#F43F5E'}
            ],
            'recent_activity': recent_activity,
            'sentiment_trends': trends,
            'frequent_words': frequent_words
        },
        message="Analytics metrics computed successfully.",
        status_code=200
    )

@analytics_bp.route('/export', methods=['GET'])
@login_required
def export_csv():
    """
    Exports the authenticated user's sentiment history as a downloadable CSV.
    """
    user = get_current_user()
    records = SentimentAnalysis.query.filter_by(user_id=user.id).order_by(SentimentAnalysis.created_at.desc()).all()

    csv_rows = ['id,sentiment,confidence,word_count,char_count,source,created_at,text']
    for r in records:
        # Sanitize text quotes for CSV format
        safe_text = '"' + r.text.replace('"', '""') + '"'
        created_str = r.created_at.isoformat() if r.created_at else ''
        csv_rows.append(f'{r.id},{r.sentiment},{r.confidence or 0.0},{r.word_count},{r.char_count},{r.source},{created_str},{safe_text}')

    csv_data = "\n".join(csv_rows)
    return Response(
        csv_data,
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename=kansei_analyses_user_{user.id}.csv"}
    )
