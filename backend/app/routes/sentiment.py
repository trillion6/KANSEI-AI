from flask import Blueprint, request
from ml.predictor import SentimentPredictor, ModelNotAvailableError, InputValidationError
from ..extensions import db
from ..models.analysis import SentimentAnalysis
from ..utils.responses import success_response, error_response
from ..utils.security import get_current_user

sentiment_bp = Blueprint('sentiment', __name__, url_prefix='/api/sentiment')

@sentiment_bp.route('/analyze', methods=['POST'])
def analyze():
    """
    Analyzes sentiment of a single customer review/text.
    Expects JSON: { "text": "review content...", "source": "web_studio" }

    When invoked by an authenticated session, automatically persists the result
    into the database linked strictly to the authenticated user's ID.
    Rejects any client-supplied user ID to prevent privilege escalation.

    Returns:
    - Predicted sentiment ('positive', 'neutral', 'negative')
    - Softmax probability vector (positive, neutral, negative)
    - Highest predicted-class confidence score
    - Model version, character metrics, saved status, and ID
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return error_response(
            message="Invalid or missing JSON body. Expected {'text': '...'}",
            status_code=400
        )

    text = data.get('text')
    source = data.get('source', 'web_studio')

    try:
        predictor = SentimentPredictor.get_instance()
        result = predictor.predict_text(text)

        # Check server-side authenticated identity
        current_user = get_current_user()
        if current_user:
            # Securely persist under authenticated user ID
            record = SentimentAnalysis(
                user_id=current_user.id,
                text=text.strip(),
                sentiment=result['sentiment'],
                confidence=result['confidence'],
                word_count=len(text.strip().split()),
                char_count=len(text.strip()),
                source=source if isinstance(source, str) else 'web_studio'
            )
            record.set_probabilities(result['probabilities'])

            try:
                db.session.add(record)
                db.session.commit()
                result['saved'] = True
                result['id'] = record.id
                result['user_id'] = current_user.id
            except Exception as db_err:
                db.session.rollback()
                return error_response(
                    message=f"Database persistence failure while saving analysis: {str(db_err)}",
                    status_code=500
                )
        else:
            result['saved'] = False
            result['id'] = None

        return success_response(
            data=result,
            message="Sentiment analysis complete.",
            status_code=200
        )
    except InputValidationError as ve:
        return error_response(message=str(ve), status_code=400)
    except ModelNotAvailableError as me:
        return error_response(
            message=f"Sentiment analysis model service unavailable: {str(me)}",
            status_code=503
        )
    except Exception as e:
        return error_response(
            message=f"Inference failure: {str(e)}",
            status_code=500
        )

@sentiment_bp.route('/batch', methods=['POST'])
def analyze_batch():
    """
    Analyzes sentiment across a batch of customer texts while preserving ordering.
    Expects JSON: { "texts": ["review 1", "review 2", ...] }

    When invoked by an authenticated session, securely saves each item under
    the authenticated user within a single atomic database transaction.

    Returns list of prediction objects and summary distribution counts.
    """
    data = request.get_json(silent=True)
    if not data or not isinstance(data, dict):
        return error_response(
            message="Invalid or missing JSON body. Expected {'texts': ['...']}",
            status_code=400
        )

    texts = data.get('texts')

    try:
        predictor = SentimentPredictor.get_instance()
        results = predictor.predict_batch(texts)

        # Calculate batch distribution summary
        summary = {
            'total_analyzed': len(results),
            'positive_count': sum(1 for r in results if r['sentiment'] == 'positive'),
            'neutral_count': sum(1 for r in results if r['sentiment'] == 'neutral'),
            'negative_count': sum(1 for r in results if r['sentiment'] == 'negative'),
        }

        # Check server-side authenticated identity
        current_user = get_current_user()
        if current_user:
            saved_records = []
            for item in results:
                raw_text = item['text']
                record = SentimentAnalysis(
                    user_id=current_user.id,
                    text=raw_text,
                    sentiment=item['sentiment'],
                    confidence=item['confidence'],
                    word_count=len(raw_text.split()),
                    char_count=len(raw_text),
                    source='batch_inference'
                )
                record.set_probabilities(item['probabilities'])
                db.session.add(record)
                saved_records.append(record)

            try:
                db.session.commit()
                for item, record in zip(results, saved_records):
                    item['saved'] = True
                    item['id'] = record.id
                    item['user_id'] = current_user.id
            except Exception as db_err:
                db.session.rollback()
                return error_response(
                    message=f"Database persistence failure while saving batch analyses: {str(db_err)}",
                    status_code=500
                )
        else:
            for item in results:
                item['saved'] = False
                item['id'] = None

        return success_response(
            data={
                'items': results,
                'summary': summary
            },
            message=f"Batch analysis complete for {len(results)} texts.",
            status_code=200
        )
    except InputValidationError as ve:
        return error_response(message=str(ve), status_code=400)
    except ModelNotAvailableError as me:
        return error_response(
            message=f"Sentiment analysis model service unavailable: {str(me)}",
            status_code=503
        )
    except Exception as e:
        return error_response(
            message=f"Batch inference failure: {str(e)}",
            status_code=500
        )
