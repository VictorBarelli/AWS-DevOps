"""
Auth Routes - Login, Register, Token Refresh
"""

from flask import Blueprint, request, jsonify, current_app
import jwt
import bcrypt
from datetime import datetime, timedelta
from functools import wraps

from src.database import db
from src.models import User, RefreshToken
from src.schemas import UserSchema, LoginSchema, RegisterSchema

auth_bp = Blueprint('auth', __name__)

# =============================================================================
# Helper Functions
# =============================================================================

def generate_tokens(user_id, email):
    """Generate access and refresh tokens"""
    secret = current_app.config['SECRET_KEY']
    
    # Access token
    access_payload = {
        'sub': str(user_id),
        'email': email,
        'type': 'access',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(seconds=current_app.config['JWT_ACCESS_TOKEN_EXPIRES'])
    }
    access_token = jwt.encode(access_payload, secret, algorithm='HS256')
    
    # Refresh token
    refresh_payload = {
        'sub': str(user_id),
        'type': 'refresh',
        'iat': datetime.utcnow(),
        'exp': datetime.utcnow() + timedelta(seconds=current_app.config['JWT_REFRESH_TOKEN_EXPIRES'])
    }
    refresh_token = jwt.encode(refresh_payload, secret, algorithm='HS256')
    
    # Store refresh token hash
    token_hash = bcrypt.hashpw(refresh_token.encode(), bcrypt.gensalt()).decode()
    refresh_record = RefreshToken(
        user_id=user_id,
        token_hash=token_hash,
        expires_at=datetime.utcnow() + timedelta(seconds=current_app.config['JWT_REFRESH_TOKEN_EXPIRES'])
    )
    db.session.add(refresh_record)
    db.session.commit()
    
    return access_token, refresh_token

# =============================================================================
# Routes
# =============================================================================

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    data = request.get_json()
    
    # Validate input
    schema = RegisterSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'error': 'Validation Error', 'details': errors}), 400
    
    # Check if user exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Conflict', 'message': 'Email already registered'}), 409
    
    # Hash password
    password_hash = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode()
    
    # Create user
    user = User(
        email=data['email'],
        password_hash=password_hash,
        first_name=data.get('first_name'),
        last_name=data.get('last_name')
    )
    db.session.add(user)
    db.session.commit()
    
    # Generate tokens
    access_token, refresh_token = generate_tokens(user.id, user.email)
    
    return jsonify({
        'message': 'User registered successfully',
        'user': UserSchema().dump(user),
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Authenticate user and return tokens"""
    data = request.get_json()
    
    # Validate input
    schema = LoginSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'error': 'Validation Error', 'details': errors}), 400
    
    # Find user
    user = User.query.filter_by(email=data['email']).first()
    if not user:
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid credentials'}), 401
    
    # Check password
    if not bcrypt.checkpw(data['password'].encode(), user.password_hash.encode()):
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid credentials'}), 401
    
    # Check if active
    if not user.is_active:
        return jsonify({'error': 'Forbidden', 'message': 'Account is disabled'}), 403
    
    # Generate tokens
    access_token, refresh_token = generate_tokens(user.id, user.email)
    
    return jsonify({
        'user': UserSchema().dump(user),
        'access_token': access_token,
        'refresh_token': refresh_token,
        'token_type': 'Bearer',
        'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
    })


@auth_bp.route('/refresh', methods=['POST'])
def refresh():
    """Refresh access token using refresh token"""
    data = request.get_json()
    
    if not data or 'refresh_token' not in data:
        return jsonify({'error': 'Bad Request', 'message': 'Refresh token required'}), 400
    
    try:
        # Verify refresh token
        secret = current_app.config['SECRET_KEY']
        payload = jwt.decode(data['refresh_token'], secret, algorithms=['HS256'])
        
        if payload.get('type') != 'refresh':
            return jsonify({'error': 'Unauthorized', 'message': 'Invalid token type'}), 401
        
        # Get user
        user = User.query.get(payload['sub'])
        if not user or not user.is_active:
            return jsonify({'error': 'Unauthorized', 'message': 'User not found or inactive'}), 401
        
        # Generate new tokens
        access_token, refresh_token = generate_tokens(user.id, user.email)
        
        return jsonify({
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_type': 'Bearer',
            'expires_in': current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Unauthorized', 'message': 'Refresh token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid refresh token'}), 401


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Invalidate refresh tokens"""
    data = request.get_json()
    
    if not data or 'refresh_token' not in data:
        return jsonify({'error': 'Bad Request', 'message': 'Refresh token required'}), 400
    
    try:
        secret = current_app.config['SECRET_KEY']
        payload = jwt.decode(data['refresh_token'], secret, algorithms=['HS256'])
        
        # Revoke all refresh tokens for this user
        RefreshToken.query.filter_by(user_id=payload['sub']).update({'revoked_at': datetime.utcnow()})
        db.session.commit()
        
        return jsonify({'message': 'Successfully logged out'})
        
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Successfully logged out'})


@auth_bp.route('/verify', methods=['GET'])
def verify():
    """Verify access token and return user info"""
    auth_header = request.headers.get('Authorization')
    
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Unauthorized', 'message': 'No token provided'}), 401
    
    token = auth_header.split(' ')[1]
    
    try:
        secret = current_app.config['SECRET_KEY']
        payload = jwt.decode(token, secret, algorithms=['HS256'])
        
        user = User.query.get(payload['sub'])
        if not user:
            return jsonify({'error': 'Unauthorized', 'message': 'User not found'}), 401
        
        return jsonify({
            'valid': True,
            'user': UserSchema().dump(user)
        })
        
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Unauthorized', 'message': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid token'}), 401
