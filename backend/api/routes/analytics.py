"""
Analytics Routes

Leaderboards, trends, and usage statistics.
Teacher-only access.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func, text

from api import db
from api.models import User, Transaction, TransactionType, UserRole, FocusBehavior
from api.middleware import teacher_required

analytics_bp = Blueprint('analytics', __name__)


@analytics_bp.route('/leaderboard', methods=['GET'])
@teacher_required
def get_leaderboard():
    """
    Get top savers and top earners leaderboards.
    
    Query params:
    - type: "savers" (by balance) or "earners" (by total earned this period)
    - limit: Number of entries (default 10)
    - class_name: Filter by class
    """
    leaderboard_type = request.args.get('type', 'savers')
    limit = min(request.args.get('limit', 10, type=int), 50)
    class_name = request.args.get('class_name')
    
    # Base query for active students
    student_ids_query = db.session.query(User.id).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True
    )
    
    if class_name:
        student_ids_query = student_ids_query.filter(User.class_name == class_name)
    
    student_ids = [r[0] for r in student_ids_query.all()]
    
    if not student_ids:
        return jsonify({
            'success': True,
            'leaderboard': [],
            'type': leaderboard_type
        })
    
    if leaderboard_type == 'earners':
        # Top earners: sum of positive transactions this week
        week_ago = datetime.utcnow() - timedelta(days=7)
        
        results = db.session.query(
            Transaction.user_id,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.user_id.in_(student_ids),
            Transaction.amount > 0,
            Transaction.created_at >= week_ago
        ).group_by(Transaction.user_id).order_by(
            func.sum(Transaction.amount).desc()
        ).limit(limit).all()
    else:
        # Top savers: current balance
        results = db.session.query(
            Transaction.user_id,
            func.sum(Transaction.amount).label('total')
        ).filter(
            Transaction.user_id.in_(student_ids)
        ).group_by(Transaction.user_id).order_by(
            func.sum(Transaction.amount).desc()
        ).limit(limit).all()
    
    # Build leaderboard with user details
    leaderboard = []
    for rank, (user_id, total) in enumerate(results, 1):
        user = User.query.get(user_id)
        if user:
            leaderboard.append({
                'rank': rank,
                'userId': user_id,
                'name': user.full_name,
                'className': user.class_name,
                'value': total or 0
            })
    
    return jsonify({
        'success': True,
        'leaderboard': leaderboard,
        'type': leaderboard_type
    })


@analytics_bp.route('/behavior-breakdown', methods=['GET'])
@teacher_required
def get_behavior_breakdown():
    """
    Get breakdown of awards by behavior category.
    Shows which behaviors are being rewarded most.
    """
    days = request.args.get('days', 30, type=int)
    since = datetime.utcnow() - timedelta(days=days)
    
    results = db.session.query(
        FocusBehavior.name,
        func.count(Transaction.id).label('count')
    ).join(
        Transaction, Transaction.category_id == FocusBehavior.id
    ).filter(
        Transaction.type == TransactionType.AWARD,
        Transaction.created_at >= since
    ).group_by(FocusBehavior.name).order_by(
        func.count(Transaction.id).desc()
    ).all()
    
    # Also count awards without category
    uncategorized = db.session.query(func.count(Transaction.id)).filter(
        Transaction.type == TransactionType.AWARD,
        Transaction.category_id.is_(None),
        Transaction.created_at >= since
    ).scalar() or 0
    
    breakdown = [{'behavior': name, 'count': count} for name, count in results]
    if uncategorized > 0:
        breakdown.append({'behavior': 'Other', 'count': uncategorized})
    
    return jsonify({
        'success': True,
        'breakdown': breakdown,
        'days': days
    })


@analytics_bp.route('/system-stats', methods=['GET'])
@teacher_required
def get_system_stats():
    """Get overall system statistics."""
    # Total students
    total_students = User.query.filter_by(role=UserRole.STUDENT, is_active=True).count()
    
    # Total DB$ in circulation
    total_circulation = db.session.query(func.sum(Transaction.amount)).scalar() or 0
    
    # Total transactions today
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    transactions_today = Transaction.query.filter(
        Transaction.created_at >= today_start
    ).count()
    
    # Total interest distributed
    total_interest = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.type == TransactionType.INTEREST
    ).scalar() or 0
    
    # Class breakdown
    class_stats = db.session.query(
        User.class_name,
        func.count(User.id).label('students')
    ).filter(
        User.role == UserRole.STUDENT,
        User.is_active == True,
        User.class_name.isnot(None)
    ).group_by(User.class_name).all()
    
    return jsonify({
        'success': True,
        'stats': {
            'totalStudents': total_students,
            'totalCirculation': total_circulation,
            'transactionsToday': transactions_today,
            'totalInterestDistributed': total_interest,
            'classCounts': {name: count for name, count in class_stats}
        }
    })
