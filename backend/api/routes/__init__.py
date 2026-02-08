"""
API Routes Registration
"""
from flask import Blueprint


def register_routes(app):
    """Register all API route blueprints."""
    from api.routes.auth import auth_bp
    from api.routes.students import students_bp
    from api.routes.transactions import transactions_bp
    from api.routes.balance import balance_bp
    from api.routes.behaviors import behaviors_bp
    from api.routes.raffle import raffle_bp
    from api.routes.analytics import analytics_bp
    from api.routes.admin import admin_bp
    
    # Register blueprints with /api prefix
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(students_bp, url_prefix='/api/students')
    app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
    app.register_blueprint(balance_bp, url_prefix='/api/balance')
    app.register_blueprint(behaviors_bp, url_prefix='/api/behaviors')
    app.register_blueprint(raffle_bp, url_prefix='/api/raffle')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'dibby-dollars-api'}
