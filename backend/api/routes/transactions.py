"""
Transactions Routes

Award, deposit, and view transaction history.
Core banking operations for DB$.
"""
from flask import Blueprint, request, jsonify
from api import db
from api.models import User, Transaction, TransactionType, UserRole, FocusBehavior
from api.middleware import teacher_required, login_required, get_current_user

transactions_bp = Blueprint('transactions', __name__)


@transactions_bp.route('/award', methods=['POST'])
@teacher_required
def award_db_dollar():
    """
    Award 1 DB$ to a student for positive behavior.
    
    Request body:
    {
        "studentId": 123,
        "behaviorId": 1,  // optional, FK to focus_behaviors
        "notes": "Great teamwork!"  // optional
    }
    
    Note: Awards are ALWAYS exactly 1 DB$.
    """
    data = request.get_json()
    current_user = get_current_user()
    
    if not data or not data.get('studentId'):
        return jsonify({'success': False, 'error': 'studentId required'}), 400
    
    student = User.query.filter_by(
        id=data['studentId'],
        role=UserRole.STUDENT,
        is_active=True
    ).first()
    
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    
    # Validate behavior if provided
    behavior_id = data.get('behaviorId')
    if behavior_id:
        behavior = FocusBehavior.query.get(behavior_id)
        if not behavior:
            return jsonify({'success': False, 'error': 'Behavior not found'}), 404
    
    # Create award transaction (always 1 DB$)
    transaction = Transaction(
        user_id=student.id,
        amount=1,  # Always 1 DB$ for awards
        type=TransactionType.AWARD,
        category_id=behavior_id,
        notes=data.get('notes', '').strip()[:255] or None,
        created_by_id=current_user.id
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'transaction': transaction.to_dict(),
        'newBalance': student.balance
    }), 201


@transactions_bp.route('/deposit', methods=['POST'])
@teacher_required
def deposit_tokens():
    """
    Deposit physical DB$ tokens into student's account.
    
    Request body:
    {
        "studentId": 123,
        "amount": 5,
        "notes": "Weekly token deposit"  // optional
    }
    """
    data = request.get_json()
    current_user = get_current_user()
    
    if not data:
        return jsonify({'success': False, 'error': 'No data provided'}), 400
    
    student_id = data.get('studentId')
    amount = data.get('amount')
    
    if not student_id or not amount:
        return jsonify({'success': False, 'error': 'studentId and amount required'}), 400
    
    if not isinstance(amount, int) or amount <= 0:
        return jsonify({'success': False, 'error': 'Amount must be a positive integer'}), 400
    
    student = User.query.filter_by(
        id=student_id,
        role=UserRole.STUDENT,
        is_active=True
    ).first()
    
    if not student:
        return jsonify({'success': False, 'error': 'Student not found'}), 404
    
    transaction = Transaction(
        user_id=student.id,
        amount=amount,
        type=TransactionType.DEPOSIT,
        notes=data.get('notes', '').strip()[:255] or None,
        created_by_id=current_user.id
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'transaction': transaction.to_dict(),
        'newBalance': student.balance
    }), 201


@transactions_bp.route('', methods=['GET'])
@login_required
def list_transactions():
    """
    Get transaction history.
    
    Query params:
    - user_id: Filter by specific user (teachers only)
    - type: Filter by transaction type
    - limit: Number of records (default 50)
    - offset: Pagination offset
    
    Students can only see their own transactions.
    Teachers can see all transactions.
    """
    current_user = get_current_user()
    user_id = request.args.get('user_id', type=int)
    tx_type = request.args.get('type')
    limit = min(request.args.get('limit', 50, type=int), 200)
    offset = request.args.get('offset', 0, type=int)
    
    # Students can only see their own
    if current_user.role == UserRole.STUDENT:
        user_id = current_user.id
    
    query = Transaction.query
    
    if user_id:
        query = query.filter_by(user_id=user_id)
    
    if tx_type:
        try:
            query = query.filter_by(type=TransactionType(tx_type))
        except ValueError:
            pass  # Invalid type, ignore filter
    
    total = query.count()
    transactions = query.order_by(Transaction.created_at.desc()).offset(offset).limit(limit).all()
    
    return jsonify({
        'success': True,
        'transactions': [t.to_dict() for t in transactions],
        'total': total,
        'limit': limit,
        'offset': offset
    })
