def test_404_not_found_json_response(client):
    """Verify that visiting a non-existent route returns standard JSON rather than HTML."""
    response = client.get('/api/route-that-does-not-exist')
    assert response.status_code == 404

    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'does not exist' in json_data['message']

def test_405_method_not_allowed_json_response(client):
    """Verify that calling an endpoint with an invalid HTTP method returns 405 JSON."""
    # /api/health only accepts GET
    response = client.post('/api/health')
    assert response.status_code == 405

    json_data = response.get_json()
    assert json_data['status'] == 'error'
    assert 'not allowed' in json_data['message']
