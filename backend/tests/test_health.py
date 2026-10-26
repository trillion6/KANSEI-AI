def test_health_check_endpoint(client):
    """Verify that GET /api/health returns 200 with active database status."""
    response = client.get('/api/health')
    assert response.status_code == 200

    json_data = response.get_json()
    assert json_data['status'] == 'success'
    assert json_data['data']['database'] == 'connected'
    assert json_data['data']['service'] == 'kansei-sentiment-api'
    assert 'Phase 3' in json_data['data']['phase']
