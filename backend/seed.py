"""
Database Seeding Script

Creates default behaviors, admin user, and sample data.
"""
import os
os.environ.setdefault("FLASK_ENV", "testing")  # Prevent scheduler from starting

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
        
        # Create demo teachers
        demo_teachers = [
            ("teacher", "Demo", "Teacher", "teacher123"),
            ("jones", "Sarah", "Jones", "jones123"),
            ("smith", "Michael", "Smith", "smith123"),
        ]
        
        for username, first, last, pin in demo_teachers:
            existing = User.query.filter_by(username=username).first()
            if not existing:
                teacher = User(
                    username=username,
                    first_name=first,
                    last_name=last,
                    role=UserRole.TEACHER
                )
                teacher.set_pin(pin)
                db.session.add(teacher)
                print(f"  Created teacher: {first} {last} (username: {username}, PIN: {pin})")
        
        # Create sample students across different classes
        sample_students = [
            # Class 5A (Ms. Jones's class)
            ("Alice", "Johnson", "5A", "1111"),
            ("Bob", "Smith", "5A", "2222"),
            ("Charlie", "Brown", "5A", "3333"),
            ("Diana", "Prince", "5A", "4444"),
            ("Emma", "Watson", "5A", "1234"),
            
            # Class 5B (Mr. Smith's class)
            ("Ethan", "Hunt", "5B", "5555"),
            ("Fiona", "Apple", "5B", "6666"),
            ("George", "Martin", "5B", "7777"),
            ("Hannah", "Montana", "5B", "8888"),
            ("Isaac", "Newton", "5B", "4321"),
            
            # Class 6A (Ms. Jones's class)
            ("Jack", "Sparrow", "6A", "9999"),
            ("Kate", "Winslet", "6A", "1010"),
            ("Liam", "Neeson", "6A", "2020"),
            ("Maya", "Angelou", "6A", "3030"),
            ("Noah", "Webster", "6A", "5678"),
            
            # Class 6B (Mr. Smith's class)
            ("Olivia", "Wilde", "6B", "4040"),
            ("Peter", "Parker", "6B", "5050"),
            ("Quinn", "Fabray", "6B", "6060"),
            ("Rachel", "Green", "6B", "7070"),
            ("Sam", "Wilson", "6B", "8765"),
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
        
        for i, student in enumerate(students):
            existing_tx = Transaction.query.filter_by(user_id=student.id).first()
            if not existing_tx:
                # Give varied initial deposits for realistic testing
                # Some students start with more, some with less
                amounts = [150, 200, 175, 125, 100, 180, 90, 160, 140, 110, 
                          195, 130, 170, 145, 105, 185, 155, 120, 165, 135]
                amount = amounts[i % len(amounts)]
                
                tx = Transaction(
                    user_id=student.id,
                    amount=amount,
                    type=TransactionType.DEPOSIT,
                    notes="Welcome bonus",
                    created_by_id=admin.id if admin else None
                )
                db.session.add(tx)
                print(f"  Gave {student.full_name} {amount} DB$ welcome bonus")
        
        db.session.commit()
        print("\nDatabase seeding complete!")


if __name__ == '__main__':
    seed_database()
