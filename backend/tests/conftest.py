"""
Pytest configuration and fixtures for Dibby Dollars backend tests.
Uses in-memory SQLite per test and provides app, client, and seeded data.
"""
import os
import pytest

# Ensure testing mode before app is imported
os.environ['FLASK_ENV'] = 'testing'


@pytest.fixture
def app():
    """Create application for testing with in-memory database (fresh per test)."""
    from app import create_app
    app = create_app()
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['SECRET_KEY'] = 'test-secret-key'
    app.config['WTF_CSRF_ENABLED'] = False
    return app


@pytest.fixture
def client(app):
    """Test client for making requests."""
    return app.test_client()


@pytest.fixture
def db(app):
    """Create database and tables for each test. Teardown drops tables."""
    from api import db
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()


@pytest.fixture
def seeded(app, db):
    """
    Populate database with minimal data. Returns dict of ids (and names) so tests
    avoid detached instance errors. Each test gets a fresh in-memory DB.
    """
    from api.models import (
        User, UserRole, FocusBehavior, SystemConfig,
    )
    with app.app_context():
        admin = User(
            username='admin',
            first_name='Admin',
            last_name='User',
            role=UserRole.ADMIN,
            class_name=None
        )
        admin.set_pin('admin123')
        db.session.add(admin)
        db.session.flush()
        admin_id = admin.id

        teacher = User(
            username='teacher',
            first_name='Test',
            last_name='Teacher',
            role=UserRole.TEACHER,
            class_name='5A'
        )
        teacher.set_pin('teacher123')
        db.session.add(teacher)
        db.session.flush()
        teacher_id = teacher.id

        student_ids = []
        for i in range(3):
            s = User(
                username=f'student{i+1}',
                first_name=f'Student',
                last_name=f'{i+1}',
                role=UserRole.STUDENT,
                class_name='5A'
            )
            s.set_pin('1234')
            db.session.add(s)
            db.session.flush()
            student_ids.append(s.id)

        for name in ['Helping Others', 'On Task', 'Respectful']:
            db.session.add(FocusBehavior(name=name, is_system_default=True, is_active=True))
        db.session.flush()

        for key, (value, _) in SystemConfig.DEFAULTS.items():
            db.session.add(SystemConfig(key=key, value=value))
        db.session.commit()

        first_student_id = student_ids[0]

    return {
        'admin_id': admin_id,
        'teacher_id': teacher_id,
        'student_ids': student_ids,
        'student_id': first_student_id,
    }
