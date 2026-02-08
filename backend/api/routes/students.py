"""
Students Routes

CRUD operations for student management.
Teachers can view and manage students.
"""
from flask import Blueprint, request, jsonify
from api import db
from api.models import User, UserRole
from api.middleware import teacher_required, get_current_user

students_bp = Blueprint('students', __name__)


@students_bp.route('', methods=['GET'])
@teacher_required
def list_students():
    """
    Get all students with optional filtering.
    
    Query params:
    - class_name: Filter by class (e.g., "5A")
    - include_balance: If "true", include balance in response
    """
    class_name = request.args.get('class_name')
    include_balance = request.args.get('include_balance', 'false').lower() == 'true'
    
    query = User.query.filter_by(role=UserRole.STUDENT, is_active=True)
    
    if class_name:
        query = query.filter_by(class_name=class_name)
    
    students = query.order_by(User.last_name, User.first_name).all()
    
    return jsonify({
        'success': True,
        'students': [s.to_dict(include_balance=include_balance) for s in students],
        'count': len(students)
    })


@students_bp.route('/<int:student_id>', methods=['GET'])
@teacher_required
def get_student(student_id):
    """Get a single student by ID."""
    student = User.query.filter_by(
        id=student_id, 
        role=UserRole.STUDENT, 
        is_active=True
    ).first()
    
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    
    return jsonify({
        'success': True,
        'student': student.to_dict(include_balance=True)
    })


@students_bp.route('', methods=['POST'])
@teacher_required
def create_student():
    """
    Create a new student.
    
    Request body:
    {
        "firstName": "John",
        "lastName": "Smith",
        "className": "5A",
        "pin": "1234"
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    required = ['firstName', 'lastName', 'pin']
    for field in required:
        if not data.get(field):
            return jsonify({'success': False, 'error': f'{field} is required'}), 400
    
    # Generate username from name
    first_name = data['firstName'].strip()
    last_name = data['lastName'].strip()
    base_username = f"{first_name.lower()}.{last_name.lower()}"
    
    # Ensure unique username
    username = base_username
    counter = 1
    while User.query.filter_by(username=username).first():
        username = f"{base_username}{counter}"
        counter += 1
    
    # Create student
    student = User(
        username=username,
        first_name=first_name,
        last_name=last_name,
        class_name=data.get('className', '').strip() or None,
        role=UserRole.STUDENT
    )
    student.set_pin(data['pin'])
    
    db.session.add(student)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'student': student.to_dict(include_balance=True)
    }), 201


@students_bp.route('/<int:student_id>', methods=['PUT'])
@teacher_required
def update_student(student_id):
    """Update student details."""
    student = User.query.filter_by(
        id=student_id, 
        role=UserRole.STUDENT
    ).first()
    
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    
    data = request.get_json()
    
    if data.get('firstName'):
        student.first_name = data['firstName'].strip()
    if data.get('lastName'):
        student.last_name = data['lastName'].strip()
    if 'className' in data:
        student.class_name = data['className'].strip() or None
    if data.get('pin'):
        student.set_pin(data['pin'])
    if 'isActive' in data:
        student.is_active = data['isActive']
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'student': student.to_dict(include_balance=True)
    })


@students_bp.route('/classes', methods=['GET'])
@teacher_required
def list_classes():
    """Get list of all unique class names."""
    classes = db.session.query(User.class_name).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True,
        User.class_name.isnot(None)
    ).distinct().all()
    
    class_names = sorted([c[0] for c in classes if c[0]])
    
    return jsonify({
        'success': True,
        'classes': class_names
    })
