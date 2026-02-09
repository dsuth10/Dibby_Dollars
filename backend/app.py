"""
Dibby Dollars Backend - Flask Application Factory
"""
import os
from pathlib import Path
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
    # Resolve backend dir: same dir as this file if it contains "api", else backend/ under project root
    _here = Path(__file__).resolve().parent
    _backend_dir = str(_here) if (_here / "api").is_dir() else str(_here / "backend")
    _instance_dir = os.path.join(_backend_dir, "instance")
    _default_db_path = os.path.join(_instance_dir, 'dibby_dollars.db')
    # Forward slashes work for SQLite on Windows; avoid URL-encoding (sqlite3 can fail with %20)
    _path_uri = _default_db_path.replace("\\", "/")
    _default_db_uri = "sqlite:///" + _path_uri
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL',
        _default_db_uri
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Ensure instance folder exists
    try:
        os.makedirs(_instance_dir, exist_ok=True)
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


# Module-level app for Gunicorn (e.g. gunicorn app:app)
app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', os.environ.get('FLASK_RUN_PORT', 5000)))
    app.run(debug=True, port=port)
