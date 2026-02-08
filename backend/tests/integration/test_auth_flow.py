"""
Integration tests for authentication flow.

Verifies:
- Correct PIN -> login success, session established
- Wrong PIN -> 401
- Protected routes return 401 when not authenticated
- Role enforcement: student cannot access teacher/admin endpoints
"""
import pytest


def test_login_success(client, seeded):
    """Valid credentials should return 200 and user data."""
    r = client.post('/api/auth/login', json={
        'username': 'teacher',
        'pin': 'teacher123'
    })
    assert r.status_code == 200
    data = r.get_json()
    assert data.get('success') is True
    assert 'user' in data
    assert data['user']['username'] == 'teacher'
    assert data['user']['role'] == 'teacher'


def test_login_wrong_pin_returns_401(client, seeded):
    """Wrong PIN should return 401."""
    r = client.post('/api/auth/login', json={
        'username': 'teacher',
        'pin': 'wrong'
    })
    assert r.status_code == 401
    assert r.get_json().get('success') is False


def test_login_missing_credentials_returns_400(client):
    """Missing username or PIN should return 400."""
    r = client.post('/api/auth/login', json={})
    assert r.status_code == 400
    r2 = client.post('/api/auth/login', json={'username': 'x'})
    assert r2.status_code == 400


def test_me_returns_401_when_not_logged_in(client, seeded):
    """GET /api/auth/me without session should return 401."""
    r = client.get('/api/auth/me')
    assert r.status_code == 401


def test_me_returns_user_when_logged_in(client, seeded):
    """After login, GET /api/auth/me should return current user."""
    client.post('/api/auth/login', json={'username': 'teacher', 'pin': 'teacher123'})
    r = client.get('/api/auth/me')
    assert r.status_code == 200
    assert r.get_json()['user']['username'] == 'teacher'


def test_logout_clears_session(client, seeded):
    """After logout, /api/auth/me should return 401."""
    client.post('/api/auth/login', json={'username': 'teacher', 'pin': 'teacher123'})
    client.post('/api/auth/logout')
    r = client.get('/api/auth/me')
    assert r.status_code == 401


def test_student_cannot_access_teacher_endpoint(client, seeded):
    """Student logged in -> POST /api/transactions/award should return 403."""
    client.post('/api/auth/login', json={'username': 'student1', 'pin': '1234'})
    r = client.post('/api/transactions/award', json={'studentId': seeded['student_id']})
    assert r.status_code == 403


def test_student_cannot_access_admin_config(client, seeded):
    """Student -> GET /api/admin/config should return 403."""
    client.post('/api/auth/login', json={'username': 'student1', 'pin': '1234'})
    r = client.get('/api/admin/config')
    assert r.status_code == 403


def test_teacher_can_award_and_balance_increases(client, seeded):
    """Teacher awards 1 DB$ to student -> balance increases by exactly 1."""
    client.post('/api/auth/login', json={'username': 'teacher', 'pin': 'teacher123'})
    student_id = seeded['student_id']
    r = client.post('/api/transactions/award', json={'studentId': student_id, 'notes': 'Test'})
    assert r.status_code == 201
    data = r.get_json()
    assert data.get('newBalance') == 1
    assert data['transaction']['amount'] == 1
    assert data['transaction']['type'] == 'award'
