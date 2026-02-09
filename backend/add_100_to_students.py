"""
One-off script: Add 100 DB$ to each active student.
For testing interest and collation. Run from backend: python add_100_to_students.py
"""
import os
# Avoid starting the background scheduler when running this script
os.environ.setdefault("FLASK_ENV", "testing")

from app import create_app
from api import db
from api.models import User, UserRole, Transaction, TransactionType


def add_100_to_students():
    app = create_app()
    with app.app_context():
        students = User.query.filter_by(role=UserRole.STUDENT, is_active=True).all()
        admin = User.query.filter_by(role=UserRole.ADMIN).first()
        created_by_id = admin.id if admin else None

        for student in students:
            tx = Transaction(
                user_id=student.id,
                amount=100,
                type=TransactionType.DEPOSIT,
                notes="Testing: +100 DB$ for interest/collation",
                created_by_id=created_by_id,
            )
            db.session.add(tx)
            print(f"  +100 DB$ -> {student.full_name} (new balance: {student.balance + 100})")

        db.session.commit()
        print(f"\nDone. Credited 100 DB$ to {len(students)} student(s).")


if __name__ == "__main__":
    add_100_to_students()
