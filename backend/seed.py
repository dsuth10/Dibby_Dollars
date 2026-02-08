"""
Database Seeding Script

Creates default behaviors, admin user, and sample data.
"""
from app import create_app
from api import db
from api.models import User, UserRole, FocusBehavior, SystemConfig, Transaction, TransactionType


def seed_database():
    """Seed the database with initial data."""
    app = create_app()
    
    with app.app_context():
        print("Seeding database...")
        
        # Create tables
        db.create_all()
        
        # Seed default focus behaviors
        default_behaviors = [
            ("Helping Others", "Assisting classmates with their work or tasks"),
            ("Staying On Task", "Focused and working on assigned activities"),
            ("Following Instructions", "Listening and following teacher directions"),
            ("Being Kind", "Showing kindness and respect to others"),
            ("Good Manners", "Using polite language and appropriate behavior"),
            ("Leadership", "Taking initiative and leading by example"),
            ("Teamwork", "Working cooperatively with classmates"),
            ("Problem Solving", "Working through challenges independently"),
        ]
        
        for name, desc in default_behaviors:
            existing = FocusBehavior.query.filter_by(name=name).first()
            if not existing:
                behavior = FocusBehavior(
                    name=name,
                    description=desc,
                    is_system_default=True
                )
                db.session.add(behavior)
                print(f"  Created behavior: {name}")
        
        # Seed system config defaults
        for key, (value, desc) in SystemConfig.DEFAULTS.items():
            existing = SystemConfig.query.get(key)
            if not existing:
                config = SystemConfig(key=key, value=value, description=desc)
                db.session.add(config)
                print(f"  Created config: {key} = {value}")
        
        # Create default admin user
        admin = User.query.filter_by(username='admin').first()
        if not admin:
            admin = User(
                username='admin',
                first_name='System',
                last_name='Administrator',
                role=UserRole.ADMIN
            )
            admin.set_pin('admin123')  # Change in production!
            db.session.add(admin)
            print("  Created admin user (username: admin, password: admin123)")
        
        # Create a demo teacher
        teacher = User.query.filter_by(username='teacher').first()
        if not teacher:
            teacher = User(
                username='teacher',
                first_name='Demo',
                last_name='Teacher',
                role=UserRole.TEACHER
            )
            teacher.set_pin('teacher123')
            db.session.add(teacher)
            print("  Created demo teacher (username: teacher, password: teacher123)")
        
        # Create sample students
        sample_students = [
            ("Alice", "Johnson", "5A", "1111"),
            ("Bob", "Smith", "5A", "2222"),
            ("Charlie", "Brown", "5B", "3333"),
            ("Diana", "Prince", "5B", "4444"),
            ("Ethan", "Hunt", "6A", "5555"),
        ]
        
        for first, last, class_name, pin in sample_students:
            username = f"{first.lower()}.{last.lower()}"
            existing = User.query.filter_by(username=username).first()
            if not existing:
                student = User(
                    username=username,
                    first_name=first,
                    last_name=last,
                    class_name=class_name,
                    role=UserRole.STUDENT
                )
                student.set_pin(pin)
                db.session.add(student)
                print(f"  Created student: {first} {last} (PIN: {pin})")
        
        db.session.commit()
        print("\nSeeding complete!")
        
        # Give sample students some starting balance
        db.session.commit()  # Ensure students are committed first
        
        students = User.query.filter_by(role=UserRole.STUDENT).all()
        admin = User.query.filter_by(username='admin').first()
        
        for student in students:
            existing_tx = Transaction.query.filter_by(user_id=student.id).first()
            if not existing_tx:
                # Give initial deposit
                tx = Transaction(
                    user_id=student.id,
                    amount=10,
                    type=TransactionType.DEPOSIT,
                    notes="Welcome bonus",
                    created_by_id=admin.id if admin else None
                )
                db.session.add(tx)
                print(f"  Gave {student.full_name} 10 DB$ welcome bonus")
        
        db.session.commit()
        print("\nDatabase seeding complete!")


if __name__ == '__main__':
    seed_database()
