import pytest
from pathlib import Path
from ml.predictor import SentimentPredictor, ModelNotAvailableError, InputValidationError

def test_analyze_positive_review(client):
    """Verify single-text inference on clearly positive customer feedback."""
    payload = {
        "text": "The flight was absolutely magnificent! Incredible customer service, lovely crew, and comfortable seats."
    }
    response = client.post('/api/sentiment/analyze', json=payload)
    assert response.status_code == 200

    data = response.get_json()['data']
    assert data['sentiment'] == 'positive'
    assert data['confidence'] > 50.0
    assert 'positive' in data['probabilities']
    assert 'neutral' in data['probabilities']
    assert 'negative' in data['probabilities']

    # Softmax probabilities must be finite and sum to approximately 1.0
    prob_sum = sum(data['probabilities'].values())
    assert 0.99 <= prob_sum <= 1.01
    assert data['inference_status'] == 'success'

def test_analyze_negative_review(client):
    """Verify single-text inference on clearly negative customer feedback."""
    payload = {
        "text": "Worst airline ever. Flight cancelled without notice, lost all my bags, and customer service was incredibly rude."
    }
    response = client.post('/api/sentiment/analyze', json=payload)
    assert response.status_code == 200

    data = response.get_json()['data']
    assert data['sentiment'] == 'negative'
    assert data['confidence'] > 60.0
    assert data['probabilities']['negative'] > data['probabilities']['positive']

def test_analyze_neutral_review(client):
    """Verify single-text inference on neutral informational statement."""
    payload = {
        "text": "Flight 102 departs from gate B14 at 10:30am as listed on the flight schedule."
    }
    response = client.post('/api/sentiment/analyze', json=payload)
    assert response.status_code == 200

    data = response.get_json()['data']
    assert data['sentiment'] in ('neutral', 'negative', 'positive')
    assert 0.0 <= data['confidence'] <= 100.0

def test_analyze_empty_and_whitespace_validation(client):
    """Verify that empty, whitespace, or missing inputs return 400 Bad Request."""
    # 1. Pure whitespace
    res_empty = client.post('/api/sentiment/analyze', json={"text": "   "})
    assert res_empty.status_code == 400
    assert "empty or pure whitespace" in res_empty.get_json()['message']

    # 2. Non-string input
    res_num = client.post('/api/sentiment/analyze', json={"text": 98765})
    assert res_num.status_code == 400
    assert "must be a non-null string" in res_num.get_json()['message']

    # 3. Missing 'text' key
    res_none = client.post('/api/sentiment/analyze', json={})
    assert res_none.status_code == 400

    # 4. Non-JSON body
    res_no_json = client.post('/api/sentiment/analyze', data="raw string")
    assert res_no_json.status_code == 400

def test_analyze_oversized_text(client):
    """Verify that text exceeding maximum length (2000 chars) is rejected with 400."""
    oversized = "a" * 2050
    response = client.post('/api/sentiment/analyze', json={"text": oversized})
    assert response.status_code == 400
    assert "exceeds maximum allowed length" in response.get_json()['message']

def test_batch_inference_success_and_ordering(client):
    """Verify batch inference preserves exact input ordering and produces summary counts."""
    inputs = [
        "Loved the experience! Highly recommend to everyone.",
        "Flight delayed 4 hours and no water was provided. Terrible.",
        "The aircraft landed on runway 3 at 2pm."
    ]
    response = client.post('/api/sentiment/batch', json={"texts": inputs})
    assert response.status_code == 200

    json_body = response.get_json()
    items = json_body['data']['items']
    summary = json_body['data']['summary']

    assert len(items) == 3
    assert items[0]['index'] == 0
    assert items[0]['text'] == inputs[0]
    assert items[0]['sentiment'] == 'positive'

    assert items[1]['index'] == 1
    assert items[1]['text'] == inputs[1]
    assert items[1]['sentiment'] == 'negative'

    assert items[2]['index'] == 2
    assert items[2]['text'] == inputs[2]

    assert summary['total_analyzed'] == 3
    assert summary['positive_count'] >= 1
    assert summary['negative_count'] >= 1

def test_batch_validation_errors(client):
    """Verify batch input validation: empty list, non-list, empty item, oversized batch."""
    # 1. Empty list
    res_empty = client.post('/api/sentiment/batch', json={"texts": []})
    assert res_empty.status_code == 400
    assert "cannot be empty" in res_empty.get_json()['message']

    # 2. Non-list
    res_str = client.post('/api/sentiment/batch', json={"texts": "just one text"})
    assert res_str.status_code == 400
    assert "must contain a 'texts' list" in res_str.get_json()['message']

    # 3. List with empty item
    res_blank_item = client.post('/api/sentiment/batch', json={"texts": ["Valid text", "   "]})
    assert res_blank_item.status_code == 400
    assert "must be a non-empty string" in res_blank_item.get_json()['message']

    # 4. Oversized batch (> 100 items)
    oversized_batch = ["Flight test"] * 105
    res_oversized = client.post('/api/sentiment/batch', json={"texts": oversized_batch})
    assert res_oversized.status_code == 400
    assert "exceeds maximum limit" in res_oversized.get_json()['message']

def test_missing_artifacts_error():
    """Verify that SentimentPredictor raises ModelNotAvailableError when files do not exist."""
    with pytest.raises(ModelNotAvailableError):
        SentimentPredictor(
            model_path=Path("non_existent_model_file.keras"),
            tokenizer_path=Path("non_existent_tokenizer.json")
        )
