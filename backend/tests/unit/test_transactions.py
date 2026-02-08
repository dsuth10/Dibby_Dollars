"""
Unit tests for transaction integrity and award/deposit logic.

Verifies:
- Award always creates exactly 1 DB$ and balance increases by 1
- Deposit creates correct amount and balance updates
- Balance is sum of all transactions
"""
import pytest
from api import db
from api.models import User, UserRole, Transaction, TransactionType


@pytest.fixture
def teacher_and_student(app, db):
    """One teacher and one student. Returns dict with ids."""
    with app.app_context():
        teacher = User(
            username='t1',
            first_name='T',
            last_name='One',
            role=UserRole.TEACHER,
            class_name='5A'
        )
        teacher.set_pin('pass')
        db.session.add(teacher)
        db.session.flush()
        student = User(
            username='s1',
            first_name='S',
            last_name='One',
            role=UserRole.STUDENT,
            class_name='5A'
        )
        student.set_pin('1234')
        db.session.add(student)
        db.session.commit()
        return {'teacher_id': teacher.id, 'student_id': student.id}


def test_award_increases_balance_by_one(app, db, teacher_and_student):
    """Award 1 DB$ to student -> balance increases by exactly 1."""
    with app.app_context():
        student_id = teacher_and_student['student_id']
        teacher_id = teacher_and_student['teacher_id']
        student = User.query.get(student_id)
        initial = student.balance
        assert initial == 0
        t = Transaction(
            user_id=student_id,
            amount=1,
            type=TransactionType.AWARD,
            notes='Test',
            created_by_id=teacher_id
        )
        db.session.add(t)
        db.session.commit()
        after = User.query.get(student_id)
        assert after.balance == initial + 1
        assert after.balance == 1


def test_deposit_increases_balance_by_amount(app, db, teacher_and_student):
    """Deposit N DB$ -> balance increases by N."""
    with app.app_context():
        student_id = teacher_and_student['student_id']
        teacher_id = teacher_and_student['teacher_id']
        t = Transaction(
            user_id=student_id,
            amount=10,
            type=TransactionType.DEPOSIT,
            notes='Tokens',
            created_by_id=teacher_id
        )
        db.session.add(t)
        db.session.commit()
        after = User.query.get(student_id)
        assert after.balance == 10


def test_balance_is_sum_of_all_transactions(app, db, teacher_and_student):
    """Balance property equals sum of all transaction amounts."""
    with app.app_context():
        student_id = teacher_and_student['student_id']
        teacher_id = teacher_and_student['teacher_id']
        db.session.add(Transaction(user_id=student_id, amount=5, type=TransactionType.DEPOSIT, created_by_id=teacher_id))
        db.session.add(Transaction(user_id=student_id, amount=1, type=TransactionType.AWARD, created_by_id=teacher_id))
        db.session.add(Transaction(user_id=student_id, amount=1, type=TransactionType.AWARD, created_by_id=teacher_id))
        db.session.commit()
        after = User.query.get(student_id)
        assert after.balance == 7
