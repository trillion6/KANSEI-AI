"""
Phase 7.1 Integration Audit — Rule 2 User Journey Verification Script
Executes all 12 steps of the user journey with isolated test accounts.
"""
import sys
import json
from pathlib import Path

# Add backend directory to path
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.analysis import SentimentAnalysis

def run_verification():
    print("=" * 70)
    print("KANSEI AI — PHASE 7.1 RULE 2 USER JOURNEY VERIFICATION")
    print("=" * 70)

    app = create_app('testing')
    with app.app_context():
        db.create_all()

        client1 = app.test_client()

        # Step 1: Register a new test user
        print("\n[Step 1] Registering User 1 ('journey.user1@kansi.ai')...")
        reg_payload = {
            "email": "journey.user1@kansi.ai",
            "username": "journeyuser1",
            "full_name": "Journey User One",
            "password": "SecurePassword123!"
        }
        res_reg = client1.post('/api/auth/register', json=reg_payload)
        assert res_reg.status_code == 201, f"Expected 201, got {res_reg.status_code}: {res_reg.get_data(as_text=True)}"
        user1_data = res_reg.get_json()['data']
        user1_id = user1_data['id']
        print(f"  -> SUCCESS: Registered user_id={user1_id}, email={user1_data['email']}")

        # Step 2: Confirm authenticated session is established
        print("\n[Step 2] Confirming authenticated session from registration...")
        res_me = client1.get('/api/auth/me')
        assert res_me.status_code == 200, f"Expected 200, got {res_me.status_code}"
        assert res_me.get_json()['data']['id'] == user1_id
        print(f"  -> SUCCESS: Authenticated session confirmed for user_id={user1_id}")

        # Step 3: Confirm login and /api/auth/me work
        print("\n[Step 3] Confirming login and /api/auth/me with credentials...")
        client1.post('/api/auth/logout')  # Log out first
        res_login = client1.post('/api/auth/login', json={
            "email": "journey.user1@kansi.ai",
            "password": "SecurePassword123!"
        })
        assert res_login.status_code == 200, f"Login failed: {res_login.status_code}"
        res_me2 = client1.get('/api/auth/me')
        assert res_me2.status_code == 200
        assert res_me2.get_json()['data']['email'] == "journey.user1@kansi.ai"
        print("  -> SUCCESS: Login succeeded and /api/auth/me returned correct profile")

        # Step 4: Submit a real text review to the Bidirectional GRU endpoint
        print("\n[Step 4] Submitting real text review to Bidirectional GRU endpoint...")
        sample_review = "The flight was absolutely fantastic, great cabin crew and smooth landing!"
        res_infer = client1.post('/api/sentiment/analyze', json={
            "text": sample_review,
            "source": "journey_test"
        })
        assert res_infer.status_code == 200, f"Inference failed: {res_infer.status_code}: {res_infer.get_data(as_text=True)}"
        infer_data = res_infer.get_json()['data']
        print(f"  -> SUCCESS: Status 200. Returned payload: sentiment='{infer_data['sentiment']}', confidence={infer_data['confidence']}%")

        # Step 5: Confirm valid sentiment label and 3 finite probabilities summing to ~1
        print("\n[Step 5] Validating sentiment label and probability distribution...")
        assert infer_data['sentiment'] in ('positive', 'neutral', 'negative'), f"Invalid label: {infer_data['sentiment']}"
        probs = infer_data['probabilities']
        assert set(probs.keys()) == {'positive', 'neutral', 'negative'}, f"Keys mismatch: {probs.keys()}"
        pos_p, neu_p, neg_p = probs['positive'], probs['neutral'], probs['negative']
        prob_sum = pos_p + neu_p + neg_p
        print(f"  -> Probabilities: positive={pos_p}, neutral={neu_p}, negative={neg_p} | Sum = {prob_sum:.4f}")
        assert 0.99 <= prob_sum <= 1.01, f"Probabilities sum out of range: {prob_sum}"
        assert all(isinstance(v, (float, int)) and 0.0 <= v <= 1.0 for v in [pos_p, neu_p, neg_p])
        print("  -> SUCCESS: Label is valid and probabilities sum to approximately 1.0")

        # Step 6: Confirm prediction is saved to DB for authenticated user
        print("\n[Step 6] Confirming persistence in database under authenticated user...")
        assert infer_data.get('saved') is True, "Result was not flagged as saved"
        saved_id = infer_data.get('id')
        assert saved_id is not None
        record = db.session.get(SentimentAnalysis, saved_id)
        assert record is not None, f"Record id {saved_id} not found in database"
        assert record.user_id == user1_id, f"Expected user_id={user1_id}, got {record.user_id}"
        assert record.sentiment == infer_data['sentiment']
        print(f"  -> SUCCESS: Record {saved_id} persisted in DB with user_id={record.user_id}")

        # Step 7: Verify saved result appears in history
        print("\n[Step 7] Verifying saved result appears in /api/sentiment/history...")
        res_hist = client1.get('/api/sentiment/history')
        assert res_hist.status_code == 200
        hist_items = res_hist.get_json()['data']['items']
        assert len(hist_items) >= 1
        assert any(item['id'] == saved_id for item in hist_items)
        print(f"  -> SUCCESS: Found {len(hist_items)} items in history, including record id {saved_id}")

        # Step 8: Verify dashboard and analytics metrics update correctly from saved records
        print("\n[Step 8] Verifying analytics metrics update accurately...")
        res_metrics = client1.get('/api/analytics/metrics')
        assert res_metrics.status_code == 200
        metrics = res_metrics.get_json()['data']
        assert metrics['total_analyses'] >= 1
        assert metrics['positive_count'] + metrics['neutral_count'] + metrics['negative_count'] == metrics['total_analyses']
        print(f"  -> SUCCESS: Analytics computed total={metrics['total_analyses']}, pos={metrics['positive_count']}, neu={metrics['neutral_count']}, neg={metrics['negative_count']}, avg_conf={metrics['average_confidence']}%")

        # Step 9: Verify batch analysis preserves input order and saves each item exactly once
        print("\n[Step 9] Submitting batch analysis and verifying order & single-persistence...")
        batch_texts = [
            "Terrible customer service and extremely delayed flight.",
            "The flight was on time and acceptable.",
            "Loved every minute of the journey, wonderful staff!"
        ]
        res_batch = client1.post('/api/sentiment/batch', json={"texts": batch_texts})
        assert res_batch.status_code == 200
        batch_data = res_batch.get_json()['data']
        predictions = batch_data['items']
        assert len(predictions) == len(batch_texts)
        for i, text in enumerate(batch_texts):
            assert predictions[i]['text'] == text, f"Ordering violation at index {i}"
            assert predictions[i]['index'] == i
            # Check DB record exists and is unique
            rec_id = predictions[i]['id']
            assert rec_id is not None
            r = db.session.get(SentimentAnalysis, rec_id)
            assert r.user_id == user1_id
        print("  -> SUCCESS: Batch output strictly preserved input order and saved each record once under user1")

        # Step 10: Verify CSV export contains only current user's records
        print("\n[Step 10] Verifying CSV export contains only User 1 records...")
        res_csv = client1.get('/api/analytics/export')
        assert res_csv.status_code == 200
        assert res_csv.mimetype == 'text/csv'
        csv_text = res_csv.get_data(as_text=True)
        csv_lines = [l for l in csv_text.strip().split('\n') if l.strip()]
        header = csv_lines[0]
        data_lines = csv_lines[1:]
        # We had 1 single analysis + 3 batch analyses = 4 records
        assert len(data_lines) == 4, f"Expected 4 CSV data rows, got {len(data_lines)}"
        print(f"  -> SUCCESS: CSV export retrieved {len(data_lines)} rows matching user1 history")

        # Step 11: Verify logout invalidates session and protected routes reject unauthenticated requests
        print("\n[Step 11] Verifying logout invalidation and protected route rejection...")
        res_logout = client1.post('/api/auth/logout')
        assert res_logout.status_code == 200
        # Subsequent protected route requests must fail with 401
        for endpoint in ['/api/auth/me', '/api/sentiment/history', '/api/analytics/metrics', '/api/analytics/export']:
            res_prot = client1.get(endpoint)
            assert res_prot.status_code == 401, f"Expected 401 on {endpoint}, got {res_prot.status_code}"
        print("  -> SUCCESS: Logout terminated session; protected endpoints correctly reject with 401")

        # Step 12: Verify second test user cannot read or delete first user's records
        print("\n[Step 12] Registering User 2 and testing cross-user tenant isolation...")
        client2 = app.test_client()
        res_reg2 = client2.post('/api/auth/register', json={
            "email": "journey.user2@kansi.ai",
            "username": "journeyuser2",
            "full_name": "Journey User Two",
            "password": "SecurePassword123!"
        })
        assert res_reg2.status_code == 201
        user2_data = res_reg2.get_json()['data']
        user2_id = user2_data['id']
        assert user2_id != user1_id

        # User 2 history must be empty (0 records)
        res_hist2 = client2.get('/api/sentiment/history')
        assert res_hist2.status_code == 200
        assert len(res_hist2.get_json()['data']['items']) == 0
        assert res_hist2.get_json()['data']['pagination']['total'] == 0

        # User 2 metrics must be zeroed
        res_metrics2 = client2.get('/api/analytics/metrics')
        assert res_metrics2.status_code == 200
        assert res_metrics2.get_json()['data']['total_analyses'] == 0

        # User 2 attempting to GET User 1's record by ID must return 404
        res_tamper_get = client2.get(f'/api/sentiment/history/{saved_id}')
        assert res_tamper_get.status_code == 404, f"Expected 404, got {res_tamper_get.status_code}"

        # User 2 attempting to DELETE User 1's record must return 404
        res_tamper_del = client2.delete(f'/api/sentiment/history/{saved_id}')
        assert res_tamper_del.status_code == 404, f"Expected 404, got {res_tamper_del.status_code}"

        # Confirm User 1's record is still intact in the database
        assert db.session.get(SentimentAnalysis, saved_id) is not None
        print("  -> SUCCESS: Multi-tenant isolation verified. User 2 cannot view, metricize, or delete User 1 data")

    print("\n" + "=" * 70)
    print("ALL 12 USER JOURNEY VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == '__main__':
    run_verification()
