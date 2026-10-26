import os
from flask import Flask
from .config import config_by_name
from .extensions import db, cors, csrf, limiter, server_session
from .utils.errors import register_error_handlers
from .routes.health import health_bp
from .routes.auth import auth_bp
from .routes.sentiment import sentiment_bp
from .routes.history import history_bp
from .routes.analytics import analytics_bp

def create_app(config_name=None):
    """
    Application factory for KANSEI AI backend service.
    """
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')

    app = Flask(__name__)
    config_obj = config_by_name.get(config_name, config_by_name['development'])
    app.config.from_object(config_obj)

    # Initialize extensions
    db.init_app(app)

    # Configure and initialize server-side session management
    if app.config.get('SESSION_TYPE') == 'sqlalchemy':
        app.config['SESSION_SQLALCHEMY'] = db
        table_name = app.config.get('SESSION_SQLALCHEMY_TABLE', 'flask_sessions')
        if table_name in db.metadata.tables:
            db.metadata.remove(db.metadata.tables[table_name])
    server_session.init_app(app)

    # Configure CORS for known client origins with credential support (no wildcard)
    allowed_origins = app.config.get('CORS_ORIGINS', ['http://localhost:5173', 'http://127.0.0.1:5173'])
    cors.init_app(
        app,
        resources={
            r"/api/*": {
                "origins": allowed_origins,
                "supports_credentials": True,
                "allow_headers": ["Content-Type", "X-CSRF-Token", "X-CSRFToken", "Authorization"],
                "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
            }
        }
    )

    csrf.init_app(app)
    limiter.init_app(app)

    # Register centralized error handlers
    register_error_handlers(app)

    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(sentiment_bp)
    app.register_blueprint(history_bp)
    app.register_blueprint(analytics_bp)

    # Automatically create database tables for development/testing if they don't exist
    with app.app_context():
        # Import models so SQLAlchemy registers them with metadata
        from .models.user import User
        from .models.analysis import SentimentAnalysis
        db.create_all()

    return app
