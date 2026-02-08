"""
Balance Routes

Get user balance and interest earned.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func

from api import db
from api.models import User, Transaction, TransactionType, UserRole
from api.middleware import login_required, teacher_required, get_current_user

balance_bp = Blueprint('balance', __name__)


@balance_bp.route('/me', methods=['GET'])
@login_required
def get_my_balance():
    """Get current user's balance and stats."""
    current_user = get_current_user()
    
    # Calculate total interest earned
    interest_earned = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == TransactionType.INTEREST
    ).scalar() or 0
    
    # Get savings rank (for students)
    rank = None
    total_students = None
    if current_user.role == UserRole.STUDENT:
        # Get all student balances
        from sqlalchemy import text
        result = db.session.execute(text("""
            SELECT user_id, SUM(amount) as balance
            FROM transactions
            WHERE user_id IN (SELECT id FROM users WHERE role = 'STUDENT' AND is_active = 1)
            GROUP BY user_id
            ORDER BY balance DESC
        """)).fetchall()
        
        total_students = len(result)
        for i, row in enumerate(result):
            if row[0] == current_user.id:
                rank = i + 1
                break
    
    return jsonify({
        'success': True,
        'balance': current_user.balance,
        'interestEarned': interest_earned,
        'rank': rank,
        'totalStudents': total_students
    })


@balance_bp.route('/<int:user_id>', methods=['GET'])
@teacher_required
def get_user_balance(user_id):
    """Get a specific user's balance (teacher access)."""
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'success': False, 'error': 'User not found'}), 404
    
    # Calculate interest earned
    interest_earned = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == user_id,
        Transaction.type == TransactionType.INTEREST
    ).scalar() or 0
    
    return jsonify({
        'success': True,
        'userId': user_id,
        'balance': user.balance,
        'interestEarned': interest_earned,
        'user': user.to_dict()
    })
