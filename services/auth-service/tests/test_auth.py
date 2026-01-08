"""
Auth Service Tests
"""

import pytest
from app import create_app
from src.database import db

@pytest.fixture
def app():
    """Create test application"""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

class TestHealth:
    """Health endpoint tests"""
    
    def test_health_returns_200(self, client):
        response = client.get('/health')
        assert response.status_code == 200
        data = response.get_json()
        assert data['status'] == 'healthy'
        assert data['service'] == 'auth-service'

class TestAuth:
    """Authentication tests"""
    
    def test_register_creates_user(self, client):
        response = client.post('/auth/register', json={
            'email': 'test@example.com',
            'password': 'SecurePass123',
            'first_name': 'Test',
            'last_name': 'User'
        })
        assert response.status_code == 201
        data = response.get_json()
        assert 'access_token' in data
        assert 'refresh_token' in data
        assert data['user']['email'] == 'test@example.com'
    
    def test_register_requires_valid_email(self, client):
        response = client.post('/auth/register', json={
            'email': 'invalid-email',
            'password': 'SecurePass123'
        })
        assert response.status_code == 400
    
    def test_register_requires_strong_password(self, client):
        response = client.post('/auth/register', json={
            'email': 'test@example.com',
            'password': 'weak'
        })
        assert response.status_code == 400
    
    def test_login_with_valid_credentials(self, client):
        # First register
        client.post('/auth/register', json={
            'email': 'login@example.com',
            'password': 'SecurePass123'
        })
        
        # Then login
        response = client.post('/auth/login', json={
            'email': 'login@example.com',
            'password': 'SecurePass123'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
    
    def test_login_with_invalid_password(self, client):
        # Register user
        client.post('/auth/register', json={
            'email': 'user@example.com',
            'password': 'SecurePass123'
        })
        
        # Try wrong password
        response = client.post('/auth/login', json={
            'email': 'user@example.com',
            'password': 'WrongPassword123'
        })
        assert response.status_code == 401
    
    def test_verify_token(self, client):
        # Register and get token
        register_response = client.post('/auth/register', json={
            'email': 'verify@example.com',
            'password': 'SecurePass123'
        })
        token = register_response.get_json()['access_token']
        
        # Verify token
        response = client.get('/auth/verify', headers={
            'Authorization': f'Bearer {token}'
        })
        assert response.status_code == 200
        data = response.get_json()
        assert data['valid'] is True
    
    def test_refresh_token(self, client):
        # Register and get tokens
        register_response = client.post('/auth/register', json={
            'email': 'refresh@example.com',
            'password': 'SecurePass123'
        })
        refresh_token = register_response.get_json()['refresh_token']
        
        # Refresh
        response = client.post('/auth/refresh', json={
            'refresh_token': refresh_token
        })
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
