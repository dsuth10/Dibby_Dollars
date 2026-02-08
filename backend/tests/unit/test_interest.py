"""
Unit tests for interest calculation service.

Verifies:
- Weekly interest = rate × min_balance (minimum balance across daily snapshots)
- No interest when rate is 0
- No interest for zero/negative balance
- Daily snapshot creation
"""
from datetime import date, timedelta
import pytest

from api import db
from api.models import (
    User, UserRole, Transaction, TransactionType,
    DailySnapshot, SystemConfig,
)
from api.services import interest


@pytest.fixture
def one_student(app, db):
    """Single active student with balance. Returns student id (int)."""
    with app.app_context():
        student = User(
            username='stu1',
            first_name='Stu',
            last_name='One',
            role=UserRole.STUDENT,
            class_name='5A'
        )
        student.set_pin('1234')
        db.session.add(student)
        db.session.commit()
        student_id = student.id
        # Give student 100 DB$ via deposit
        t = Transaction(
            user_id=student_id,
            amount=100,
            type=TransactionType.DEPOSIT,
            notes='Seed',
            created_by_id=None
        )
        db.session.add(t)
        db.session.commit()
    return student_id


@pytest.fixture
def snapshots_for_week(app, one_student):
    """Create daily snapshots for the past week with varying balances."""
    with app.app_context():
        today = date.today()
        balances = [100, 80, 60, 50, 70, 90, 100]  # min = 50
        for i in range(7):
            d = today - timedelta(days=6 - i)
            snap = DailySnapshot(
                user_id=one_student,
                date=d,
                balance_at_snapshot=balances[i]
            )
            db.session.add(snap)
        db.session.commit()


def test_take_daily_snapshot_creates_one_per_student(app, one_student):
    """Daily snapshot should be created for each active student."""
    with app.app_context():
        count = interest.take_daily_snapshot()
    assert count == 1
    with app.app_context():
        snap = DailySnapshot.query.filter_by(user_id=one_student, date=date.today()).first()
        assert snap is not None
        assert snap.balance_at_snapshot == 100


def test_take_daily_snapshot_idempotent(app, one_student):
    """Running snapshot twice for same day should not duplicate."""
    with app.app_context():
        interest.take_daily_snapshot()
        count2 = interest.take_daily_snapshot()
    assert count2 == 0


def test_interest_skipped_when_rate_zero(app, one_student, snapshots_for_week):
    """When interest rate is 0, no interest should be applied."""
    with app.app_context():
        SystemConfig.set('interest_rate', '0')
        result = interest.calculate_weekly_interest()
    assert result.get('skipped') is True
    assert result.get('reason') == 'Interest rate is 0'


def test_interest_calculated_from_min_balance(app, one_student, snapshots_for_week):
    """
    Interest = (min_weekly_balance * rate) / 100.
    Min balance in snapshots is 50, rate 2% -> 1 DB$ (integer floor).
    """
    with app.app_context():
        SystemConfig.set('interest_rate', '2.0')
        result = interest.calculate_weekly_interest()
    assert result.get('success') is True
    assert result.get('studentsReceivingInterest') == 1
    assert result.get('totalInterestDistributed') == 1  # 50 * 0.02 = 1
    assert result.get('interestRate') == 2.0


def test_interest_uses_current_balance_if_no_snapshots(app, one_student):
    """If student has no snapshots, use current balance for interest."""
    with app.app_context():
        SystemConfig.set('interest_rate', '10')  # 10%
        result = interest.calculate_weekly_interest()
    assert result.get('success') is True
    assert result.get('totalInterestDistributed') == 10  # 100 * 0.10


def test_interest_not_applied_for_zero_balance(app, one_student):
    """Student with 0 balance should not receive interest."""
    with app.app_context():
        t = Transaction(
            user_id=one_student,
            amount=-100,
            type=TransactionType.SPEND,
            notes='Spend',
            created_by_id=None
        )
        db.session.add(t)
        db.session.commit()
        SystemConfig.set('interest_rate', '5')
        result = interest.calculate_weekly_interest()
    assert result.get('success') is True
    assert result.get('studentsReceivingInterest') == 0
    assert result.get('totalInterestDistributed') == 0


def test_interest_creates_transaction(app, one_student, snapshots_for_week):
    """Interest run should create an INTEREST transaction for the student."""
    with app.app_context():
        SystemConfig.set('interest_rate', '2.0')
        interest.calculate_weekly_interest()
        tx = Transaction.query.filter_by(
            user_id=one_student,
            type=TransactionType.INTEREST
        ).first()
    assert tx is not None
    assert tx.amount == 1
    assert 'min balance' in (tx.notes or '').lower()
