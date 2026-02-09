"""
Raffle Routes

Conduct raffle draws and view history.
"""
from flask import Blueprint, request, jsonify
from datetime import datetime
import random

from api import db
from api.models import User, Transaction, TransactionType, UserRole, RaffleDraw, SystemConfig
from api.middleware import teacher_required, get_current_user

raffle_bp = Blueprint('raffle', __name__)


@raffle_bp.route('/draw', methods=['POST'])
@teacher_required
def conduct_draw():
    """
    Conduct a raffle draw. Randomly selects a winner from all active students.
    
    Request body:
    {
        "prizeAmount": 50,  // optional, uses default if not provided
        "prizeDescription": "Weekly Assembly Jackpot"  // optional
    }
    """
    data = request.get_json() or {}
    current_user = get_current_user()
    
    # Get prize amount (from request or default)
    prize_amount = data.get('prizeAmount')
    if prize_amount is None:
        prize_amount = int(SystemConfig.get('raffle_prize_default', '50'))
    
    if not isinstance(prize_amount, int) or prize_amount <= 0:
        return jsonify({'success': False, 'error': 'Prize amount must be a positive integer'}), 400
    
    prize_description = data.get('prizeDescription', '').strip()[:255] or 'Raffle Prize'
    
    # Get all active students
    students = User.query.filter_by(role=UserRole.STUDENT, is_active=True).all()
    
    if not students:
        return jsonify({'success': False, 'error': 'No active students to draw from'}), 400
    
    # Random selection
    winner = random.choice(students)
    
    # Create raffle draw record
    raffle = RaffleDraw(
        winner_id=winner.id,
        prize_amount=prize_amount,
        prize_description=prize_description,
        conducted_by_id=current_user.id
    )
    db.session.add(raffle)
    
    # Award the prize
    transaction = Transaction(
        user_id=winner.id,
        amount=prize_amount,
        type=TransactionType.RAFFLE,
        notes=f"Raffle: {prize_description}",
        created_by_id=current_user.id
    )
    db.session.add(transaction)
    
    db.session.commit()
    db.session.refresh(winner)  # Ensure winner reflects committed transaction for balance calc

    return jsonify({
        'success': True,
        'raffle': raffle.to_dict(),
        'winner': winner.to_dict(include_balance=True),
        'transaction': transaction.to_dict()
    }), 201


@raffle_bp.route('/history', methods=['GET'])
@teacher_required
def list_draws():
    """
    Get raffle draw history.
    
    Query params:
    - limit: Number of records (default 20)
    - offset: Pagination offset
    """
    limit = min(request.args.get('limit', 20, type=int), 100)
    offset = request.args.get('offset', 0, type=int)
    
    query = RaffleDraw.query.order_by(RaffleDraw.draw_date.desc())
    
    total = query.count()
    draws = query.offset(offset).limit(limit).all()
    
    return jsonify({
        'success': True,
        'draws': [d.to_dict() for d in draws],
        'total': total,
        'limit': limit,
        'offset': offset
    })
