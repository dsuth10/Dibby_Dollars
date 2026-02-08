"""
Authentication Routes

Handles user login and session management.
Simple PIN-based auth for students, password for teachers/admins.
"""
from flask import Blueprint, request, jsonify, session
from api import db
from api.models import User, UserRole

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Authenticate user with username and PIN/password.
    
    Request body:
    {
        "username": "student123",
        "pin": "1234"
    }
    
    Response:
    {
        "success": true,
        "user": { ... }
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    username = data.get('username', '').strip().lower()
    pin = data.get('pin', '')
    
    if not username or not pin:
        return jsonify({'success': False, 'error': 'Username and PIN required'}), 400
    
    # Find user
    user = User.query.filter_by(username=username, is_active=True).first()
    
    if not user:
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    
    if not user.check_pin(pin):
        return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
    
    # Store user ID in session
    session['user_id'] = user.id
    session['user_role'] = user.role.value
    
    return jsonify({
        'success': True,
        'user': user.to_dict(include_balance=True)
    })


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Clear user session."""
    session.clear()
    return jsonify({'success': True, 'message': 'Logged out'})


@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    """Get the currently logged-in user."""
    user_id = session.get('user_id')
    
    if not user_id:
        return jsonify({'success': False, 'error': 'Not authenticated'}), 401
    
    user = User.query.get(user_id)
    
    if not user or not user.is_active:
        session.clear()
        return jsonify({'success': False, 'error': 'User not found'}), 401
    
    return jsonify({
        'success': True,
        'user': user.to_dict(include_balance=True)
    })
