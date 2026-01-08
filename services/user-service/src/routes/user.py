"""
User Routes - CRUD operations
"""

from flask import Blueprint, request, jsonify, g
from src.database import db
from src.models import User, UserProfile
from src.schemas import UserSchema, UserProfileSchema, UpdateUserSchema

user_bp = Blueprint('users', __name__)

# =============================================================================
# Helper Functions
# =============================================================================

def get_current_user_id():
    """Get user ID from request headers (set by API Gateway)"""
    return request.headers.get('X-User-ID')

# =============================================================================
# Routes
# =============================================================================

@user_bp.route('', methods=['GET'])
def list_users():
    """List all users (admin only in production)"""
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    # Limit per_page
    per_page = min(per_page, 100)
    
    pagination = User.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': UserSchema(many=True).dump(pagination.items),
        'pagination': {
            'page': pagination.page,
            'per_page': pagination.per_page,
            'total': pagination.total,
            'pages': pagination.pages,
            'has_next': pagination.has_next,
            'has_prev': pagination.has_prev
        }
    })


@user_bp.route('/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Not Found', 'message': 'User not found'}), 404
    
    return jsonify(UserSchema().dump(user))


@user_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get current authenticated user"""
    user_id = get_current_user_id()
    
    if not user_id:
        return jsonify({'error': 'Unauthorized', 'message': 'No user ID provided'}), 401
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Not Found', 'message': 'User not found'}), 404
    
    return jsonify(UserSchema().dump(user))


@user_bp.route('/<user_id>', methods=['PUT', 'PATCH'])
def update_user(user_id):
    """Update user"""
    # Check authorization
    current_user_id = get_current_user_id()
    if current_user_id != user_id:
        return jsonify({'error': 'Forbidden', 'message': 'Cannot update another user'}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Not Found', 'message': 'User not found'}), 404
    
    data = request.get_json()
    
    # Validate
    schema = UpdateUserSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'error': 'Validation Error', 'details': errors}), 400
    
    # Update fields
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    
    db.session.commit()
    
    return jsonify(UserSchema().dump(user))


@user_bp.route('/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user (soft delete)"""
    # Check authorization
    current_user_id = get_current_user_id()
    if current_user_id != user_id:
        return jsonify({'error': 'Forbidden', 'message': 'Cannot delete another user'}), 403
    
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'Not Found', 'message': 'User not found'}), 404
    
    # Soft delete
    user.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200


# =============================================================================
# Profile Routes
# =============================================================================

@user_bp.route('/<user_id>/profile', methods=['GET'])
def get_profile(user_id):
    """Get user profile"""
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    
    if not profile:
        return jsonify({'error': 'Not Found', 'message': 'Profile not found'}), 404
    
    return jsonify(UserProfileSchema().dump(profile))


@user_bp.route('/<user_id>/profile', methods=['PUT', 'PATCH'])
def update_profile(user_id):
    """Update or create user profile"""
    # Check authorization
    current_user_id = get_current_user_id()
    if current_user_id != user_id:
        return jsonify({'error': 'Forbidden', 'message': 'Cannot update another user profile'}), 403
    
    data = request.get_json()
    
    profile = UserProfile.query.filter_by(user_id=user_id).first()
    
    if not profile:
        # Create new profile
        profile = UserProfile(user_id=user_id)
        db.session.add(profile)
    
    # Update fields
    updateable_fields = ['avatar_url', 'phone', 'address_line1', 'address_line2', 
                         'city', 'state', 'postal_code', 'country', 'preferences']
    
    for field in updateable_fields:
        if field in data:
            setattr(profile, field, data[field])
    
    db.session.commit()
    
    return jsonify(UserProfileSchema().dump(profile))
