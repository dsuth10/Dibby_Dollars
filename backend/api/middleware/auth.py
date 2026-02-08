"""
Authorization Middleware

Decorators for protecting routes based on user role.
"""
from functools import wraps
from flask import session, jsonify
from api.models import User, UserRole


def get_current_user():
    """Get the currently authenticated user from session."""
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)


def login_required(f):
    """Decorator: Require any authenticated user."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or not user.is_active:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function


def teacher_required(f):
    """Decorator: Require teacher or admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or not user.is_active:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        if user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
            return jsonify({'success': False, 'error': 'Teacher access required'}), 403
        return f(*args, **kwargs)
    return decorated_function


def admin_required(f):
    """Decorator: Require admin role."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user or not user.is_active:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        if user.role != UserRole.ADMIN:
            return jsonify({'success': False, 'error': 'Admin access required'}), 403
        return f(*args, **kwargs)
    return decorated_function
