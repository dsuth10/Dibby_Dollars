"""
Behaviors Routes

Manage focus behaviors for quick-award buttons.
"""
from flask import Blueprint, request, jsonify
from api import db
from api.models import FocusBehavior, TeacherFocusBehavior, User, UserRole
from api.middleware import teacher_required, get_current_user

behaviors_bp = Blueprint('behaviors', __name__)


@behaviors_bp.route('', methods=['GET'])
@teacher_required
def list_behaviors():
    """Get all available focus behaviors."""
    behaviors = FocusBehavior.query.filter_by(is_active=True).order_by(FocusBehavior.name).all()
    
    return jsonify({
        'success': True,
        'behaviors': [b.to_dict() for b in behaviors]
    })


@behaviors_bp.route('', methods=['POST'])
@teacher_required
def create_behavior():
    """
    Create a new focus behavior.
    
    Request body:
    {
        "name": "Helping Others",
        "description": "Assisting classmates with their work"
    }
    """
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'success': False, 'error': 'Name is required'}), 400
    
    name = data['name'].strip()
    
    # Check for duplicate
    existing = FocusBehavior.query.filter_by(name=name).first()
    if existing:
        return jsonify({'success': False, 'error': 'Behavior already exists'}), 400
    
    behavior = FocusBehavior(
        name=name,
        description=data.get('description', '').strip()[:255] or None,
        is_system_default=False
    )
    
    db.session.add(behavior)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'behavior': behavior.to_dict()
    }), 201


@behaviors_bp.route('/my-focus', methods=['GET'])
@teacher_required
def get_my_focus_behaviors():
    """Get the current teacher's selected focus behaviors."""
    current_user = get_current_user()
    
    selections = TeacherFocusBehavior.query.filter_by(
        teacher_id=current_user.id,
        is_active=True
    ).order_by(TeacherFocusBehavior.display_order).all()
    
    behaviors = [s.behavior.to_dict() for s in selections if s.behavior]
    
    return jsonify({
        'success': True,
        'focusBehaviors': behaviors
    })


@behaviors_bp.route('/my-focus', methods=['PUT'])
@teacher_required
def set_my_focus_behaviors():
    """
    Set the current teacher's focus behaviors.
    
    Request body:
    {
        "behaviorIds": [1, 3, 5]  // Up to 5 behavior IDs
    }
    """
    data = request.get_json()
    current_user = get_current_user()
    
    if not data or 'behaviorIds' not in data:
        return jsonify({'success': False, 'error': 'behaviorIds required'}), 400
    
    behavior_ids = data['behaviorIds']
    
    if not isinstance(behavior_ids, list):
        return jsonify({'success': False, 'error': 'behaviorIds must be an array'}), 400
    
    if len(behavior_ids) < 3:
        return jsonify({'success': False, 'error': 'Select 3 to 5 focus behaviors'}), 400
    
    if len(behavior_ids) > 5:
        return jsonify({'success': False, 'error': 'Maximum 5 focus behaviors allowed'}), 400
    
    # Validate all behavior IDs exist
    for bid in behavior_ids:
        if not FocusBehavior.query.get(bid):
            return jsonify({'success': False, 'error': f'Behavior {bid} not found'}), 404
    
    # Clear existing selections
    TeacherFocusBehavior.query.filter_by(teacher_id=current_user.id).delete()
    
    # Add new selections
    for order, bid in enumerate(behavior_ids):
        selection = TeacherFocusBehavior(
            teacher_id=current_user.id,
            behavior_id=bid,
            is_active=True,
            display_order=order
        )
        db.session.add(selection)
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Set {len(behavior_ids)} focus behaviors'
    })
