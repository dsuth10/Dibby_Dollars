"""
Admin Routes

System configuration and admin-only management.
"""
from flask import Blueprint, request, jsonify
from api import db
from api.models import User, UserRole, SystemConfig
from api.middleware import admin_required, get_current_user

admin_bp = Blueprint('admin', __name__)


@admin_bp.route('/config', methods=['GET'])
@admin_required
def get_config():
    """Get all system configuration values."""
    configs = SystemConfig.query.all()
    
    # Build config dict including defaults
    config_dict = {}
    for key, (default_val, desc) in SystemConfig.DEFAULTS.items():
        config_dict[key] = {
            'value': default_val,
            'description': desc
        }
    
    # Override with actual values
    for config in configs:
        config_dict[config.key] = {
            'value': config.value,
            'description': config.description
        }
    
    return jsonify({
        'success': True,
        'config': config_dict
    })


@admin_bp.route('/config', methods=['PUT'])
@admin_required
def update_config():
    """
    Update system configuration.
    
    Request body:
    {
        "interestRate": "2.5",
        "rafflePrizeDefault": "75"
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    # Map camelCase to snake_case keys
    key_map = {
        'interestRate': 'interest_rate',
        'rafflePrizeDefault': 'raffle_prize_default',
        'interestDay': 'interest_day'
    }
    
    updated = []
    for camel_key, value in data.items():
        snake_key = key_map.get(camel_key, camel_key)
        
        # Validate specific values
        if snake_key == 'interest_rate':
            try:
                rate = float(value)
                if rate < 0 or rate > 100:
                    return jsonify({'success': False, 'error': 'Interest rate must be 0-100'}), 400
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid interest rate'}), 400
        
        if snake_key == 'raffle_prize_default':
            try:
                prize = int(value)
                if prize <= 0:
                    return jsonify({'success': False, 'error': 'Prize must be positive'}), 400
            except ValueError:
                return jsonify({'success': False, 'error': 'Invalid prize amount'}), 400
        
        SystemConfig.set(snake_key, str(value))
        updated.append(snake_key)
    
    return jsonify({
        'success': True,
        'updated': updated
    })


@admin_bp.route('/users', methods=['GET'])
@admin_required
def list_users():
    """Get all users (teachers and admins)."""
    users = User.query.filter(
        User.role.in_([UserRole.TEACHER, UserRole.ADMIN])
    ).order_by(User.role, User.last_name).all()
    
    return jsonify({
        'success': True,
        'users': [u.to_dict() for u in users]
    })


@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """
    Create a teacher or admin user.
    
    Request body:
    {
        "username": "teacher1",
        "password": "secure123",
        "firstName": "Jane",
        "lastName": "Doe",
        "role": "teacher"  // or "admin"
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    required = ['username', 'password', 'firstName', 'lastName']
    for field in required:
        if not data.get(field):
            return jsonify({'success': False, 'error': f'{field} is required'}), 400
    
    username = data['username'].strip().lower()
    
    # Check if username exists
    if User.query.filter_by(username=username).first():
        return jsonify({'success': False, 'error': 'Username already exists'}), 400
    
    # Determine role
    role_str = data.get('role', 'teacher').lower()
    if role_str == 'admin':
        role = UserRole.ADMIN
    else:
        role = UserRole.TEACHER
    
    user = User(
        username=username,
        first_name=data['firstName'].strip(),
        last_name=data['lastName'].strip(),
        role=role
    )
    user.set_pin(data['password'])
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'user': user.to_dict()
    }), 201


@admin_bp.route('/trigger-interest', methods=['POST'])
@admin_required
def trigger_interest_calculation():
    """Manually trigger interest calculation (for testing)."""
    from api.services.interest import calculate_weekly_interest
    
    result = calculate_weekly_interest()
    
    return jsonify({
        'success': True,
        'message': 'Interest calculation triggered',
        'result': result
    })
