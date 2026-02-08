"""
Dibby Dollars - SQLAlchemy Models

Core entities for the school reward banking system.
"""
from datetime import datetime, date
from enum import Enum as PyEnum
from werkzeug.security import generate_password_hash, check_password_hash

from api import db


class UserRole(PyEnum):
    """User role enumeration."""
    ADMIN = "admin"
    TEACHER = "teacher"
    STUDENT = "student"


class TransactionType(PyEnum):
    """Transaction type enumeration."""
    DEPOSIT = "deposit"      # Physical token cashed in
    AWARD = "award"          # Behavioral reward (always 1 DB$)
    SPEND = "spend"          # Future: in-app purchases
    INTEREST = "interest"    # Weekly interest credit
    RAFFLE = "raffle"        # Raffle prize winnings


class User(db.Model):
    """
    User model for students, teachers, and admins.
    Students use PIN for login, teachers/admins use password.
    """
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False, index=True)
    pin_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.STUDENT)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    class_name = db.Column(db.String(50), nullable=True)  # e.g., "5A", "3B"
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    transactions = db.relationship('Transaction', backref='user', lazy='dynamic',
                                   foreign_keys='Transaction.user_id')
    daily_snapshots = db.relationship('DailySnapshot', backref='user', lazy='dynamic')
    focus_behaviors = db.relationship('TeacherFocusBehavior', backref='teacher', lazy='dynamic')
    
    def set_pin(self, pin: str):
        """Hash and store the PIN/password."""
        self.pin_hash = generate_password_hash(pin)
    
    def check_pin(self, pin: str) -> bool:
        """Verify PIN/password against stored hash."""
        return check_password_hash(self.pin_hash, pin)
    
    @property
    def full_name(self) -> str:
        """Return full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def balance(self) -> int:
        """Calculate current balance from transaction ledger."""
        from sqlalchemy import func
        result = db.session.query(func.sum(Transaction.amount)).filter(
            Transaction.user_id == self.id
        ).scalar()
        return result or 0
    
    def to_dict(self, include_balance=False):
        """Serialize user to dictionary."""
        data = {
            'id': self.id,
            'username': self.username,
            'role': self.role.value,
            'firstName': self.first_name,
            'lastName': self.last_name,
            'fullName': self.full_name,
            'className': self.class_name,
            'isActive': self.is_active,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
        if include_balance:
            data['balance'] = self.balance
        return data


class Transaction(db.Model):
    """
    Immutable ledger of all DB$ movements.
    Balance is calculated by summing all transactions for a user.
    """
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    amount = db.Column(db.Integer, nullable=False)  # Positive for credit, negative for debit
    type = db.Column(db.Enum(TransactionType), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('focus_behaviors.id'), nullable=True)
    notes = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relationships
    category = db.relationship('FocusBehavior', backref='transactions')
    created_by = db.relationship('User', foreign_keys=[created_by_id])
    
    def to_dict(self):
        """Serialize transaction to dictionary."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'amount': self.amount,
            'type': self.type.value,
            'categoryId': self.category_id,
            'categoryName': self.category.name if self.category else None,
            'notes': self.notes,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'createdById': self.created_by_id
        }


class DailySnapshot(db.Model):
    """
    Daily balance snapshot for interest calculation.
    Captured at end of each day to determine minimum weekly balance.
    """
    __tablename__ = 'daily_snapshots'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    date = db.Column(db.Date, nullable=False, index=True)
    balance_at_snapshot = db.Column(db.Integer, nullable=False, default=0)
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'date', name='unique_user_date_snapshot'),
    )
    
    def to_dict(self):
        """Serialize snapshot to dictionary."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'date': self.date.isoformat(),
            'balance': self.balance_at_snapshot
        }


class FocusBehavior(db.Model):
    """
    Behavioral categories for awarding DB$.
    Teachers select 3-5 focus behaviors for quick-award buttons.
    """
    __tablename__ = 'focus_behaviors'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=True)
    is_system_default = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        """Serialize behavior to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'isSystemDefault': self.is_system_default,
            'isActive': self.is_active
        }


class TeacherFocusBehavior(db.Model):
    """
    Junction table: which behaviors each teacher has selected.
    These become quick-award buttons on the teacher interface.
    """
    __tablename__ = 'teacher_focus_behaviors'
    
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    behavior_id = db.Column(db.Integer, db.ForeignKey('focus_behaviors.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    display_order = db.Column(db.Integer, default=0)
    
    # Relationships
    behavior = db.relationship('FocusBehavior')
    
    __table_args__ = (
        db.UniqueConstraint('teacher_id', 'behavior_id', name='unique_teacher_behavior'),
    )


class RaffleDraw(db.Model):
    """
    Record of raffle draws conducted at weekly assemblies.
    """
    __tablename__ = 'raffle_draws'
    
    id = db.Column(db.Integer, primary_key=True)
    draw_date = db.Column(db.DateTime, default=datetime.utcnow)
    winner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    prize_amount = db.Column(db.Integer, nullable=False)
    prize_description = db.Column(db.String(255), nullable=True)
    conducted_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Relationships
    winner = db.relationship('User', foreign_keys=[winner_id])
    conducted_by = db.relationship('User', foreign_keys=[conducted_by_id])
    
    def to_dict(self):
        """Serialize raffle draw to dictionary."""
        return {
            'id': self.id,
            'drawDate': self.draw_date.isoformat() if self.draw_date else None,
            'winnerId': self.winner_id,
            'winnerName': self.winner.full_name if self.winner else None,
            'prizeAmount': self.prize_amount,
            'prizeDescription': self.prize_description,
            'conductedById': self.conducted_by_id
        }


class SystemConfig(db.Model):
    """
    Key-value store for system configuration.
    Used for: interest_rate, raffle_prize_default, etc.
    """
    __tablename__ = 'system_config'
    
    key = db.Column(db.String(50), primary_key=True)
    value = db.Column(db.String(255), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Default configuration values
    DEFAULTS = {
        'interest_rate': ('2.0', 'Weekly interest rate as percentage'),
        'raffle_prize_default': ('50', 'Default DB$ prize for raffle winner'),
        'interest_day': ('sunday', 'Day of week to calculate interest'),
    }
    
    @classmethod
    def get(cls, key: str, default=None):
        """Get a config value by key."""
        config = cls.query.get(key)
        if config:
            return config.value
        # Return from defaults if not in database
        if key in cls.DEFAULTS:
            return cls.DEFAULTS[key][0]
        return default
    
    @classmethod
    def set(cls, key: str, value: str):
        """Set a config value."""
        config = cls.query.get(key)
        if config:
            config.value = value
        else:
            description = cls.DEFAULTS.get(key, (None, None))[1]
            config = cls(key=key, value=value, description=description)
            db.session.add(config)
        db.session.commit()


# =============================================================================
# Future-Proofed Models (V2: In-App Spending)
# =============================================================================

class Item(db.Model):
    """
    Items available for purchase with DB$.
    Future feature: students can spend DB$ on rewards.
    """
    __tablename__ = 'items'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    price = db.Column(db.Integer, nullable=False)  # Cost in DB$
    is_available = db.Column(db.Boolean, default=True)
    image_url = db.Column(db.String(255), nullable=True)
    quantity = db.Column(db.Integer, nullable=True)  # None = unlimited
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Serialize item to dictionary."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'isAvailable': self.is_available,
            'imageUrl': self.image_url,
            'quantity': self.quantity
        }


class Purchase(db.Model):
    """
    Record of item purchases.
    Future feature: tracks what students spend their DB$ on.
    """
    __tablename__ = 'purchases'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    item_id = db.Column(db.Integer, db.ForeignKey('items.id'), nullable=False)
    amount_paid = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='purchases')
    item = db.relationship('Item', backref='purchases')
    
    def to_dict(self):
        """Serialize purchase to dictionary."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'itemId': self.item_id,
            'itemName': self.item.name if self.item else None,
            'amountPaid': self.amount_paid,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
