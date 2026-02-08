"""
Dibby Dollars Backend - Flask Application Factory
"""
import os
from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate

from api import db
from api.routes import register_routes
from api.scheduler import init_scheduler


def create_app(config_name=None):
    """Application factory pattern."""
    app = Flask(__name__, instance_relative_config=True)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 
        f"sqlite:///{os.path.join(app.instance_path, 'dibby_dollars.db')}"
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass
    
    # Initialize extensions
    db.init_app(app)
    Migrate(app, db)
    # Get CORS origins from environment or use development defaults
    cors_origins = [
        o.strip() for o in os.environ.get(
            'CORS_ORIGINS',
            'http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174'
        ).split(',') if o.strip()
    ]
    CORS(app, origins=cors_origins, supports_credentials=True)
    
    # Register routes
    register_routes(app)
    
    # Initialize scheduler for interest calculations
    if os.environ.get('FLASK_ENV') != 'testing':
        init_scheduler(app)
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, port=5000)
