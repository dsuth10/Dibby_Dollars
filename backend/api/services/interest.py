"""
Interest Calculation Service

Weekly interest on minimum balance.
"""
from datetime import datetime, timedelta, date
from sqlalchemy import func

from api import db
from api.models import User, Transaction, TransactionType, UserRole, DailySnapshot, SystemConfig


def take_daily_snapshot():
    """
    Capture daily balance snapshot for all students.
    Should run at end of each day.
    """
    today = date.today()
    
    students = User.query.filter_by(role=UserRole.STUDENT, is_active=True).all()
    
    snapshots_created = 0
    for student in students:
        # Check if snapshot already exists for today
        existing = DailySnapshot.query.filter_by(user_id=student.id, date=today).first()
        if existing:
            continue
        
        snapshot = DailySnapshot(
            user_id=student.id,
            date=today,
            balance_at_snapshot=student.balance
        )
        db.session.add(snapshot)
        snapshots_created += 1
    
    db.session.commit()
    return snapshots_created


def calculate_weekly_interest():
    """
    Calculate and apply weekly interest based on minimum balance.
    Should run every Sunday at 23:59 (or configured day).
    
    Interest = (minimum_weekly_balance * interest_rate) / 100
    """
    # Get interest rate from config
    interest_rate = float(SystemConfig.get('interest_rate', '2.0'))
    
    if interest_rate <= 0:
        return {'skipped': True, 'reason': 'Interest rate is 0'}
    
    # Calculate date range for this week
    today = date.today()
    week_start = today - timedelta(days=7)
    
    students = User.query.filter_by(role=UserRole.STUDENT, is_active=True).all()
    
    interest_applied = 0
    total_interest_amount = 0
    
    for student in students:
        # Get minimum balance from snapshots this week
        min_balance = db.session.query(func.min(DailySnapshot.balance_at_snapshot)).filter(
            DailySnapshot.user_id == student.id,
            DailySnapshot.date >= week_start,
            DailySnapshot.date <= today
        ).scalar()
        
        # If no snapshots, use current balance as fallback
        if min_balance is None:
            min_balance = student.balance
        
        # Only apply interest on positive balances
        if min_balance <= 0:
            continue
        
        # Calculate interest (rounded down to nearest integer)
        interest_amount = int(min_balance * interest_rate / 100)
        
        if interest_amount <= 0:
            continue
        
        # Create interest transaction
        transaction = Transaction(
            user_id=student.id,
            amount=interest_amount,
            type=TransactionType.INTEREST,
            notes=f"Weekly interest ({interest_rate}% on min balance {min_balance})",
            created_by_id=None  # System-generated
        )
        db.session.add(transaction)
        
        interest_applied += 1
        total_interest_amount += interest_amount
    
    db.session.commit()
    
    return {
        'success': True,
        'studentsReceivingInterest': interest_applied,
        'totalInterestDistributed': total_interest_amount,
        'interestRate': interest_rate
    }
