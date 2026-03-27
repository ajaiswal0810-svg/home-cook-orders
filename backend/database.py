from flask_sqlalchemy import SQLAlchemy
from contextlib import contextmanager

db = SQLAlchemy()


def init_db(app):
    """Initialize database with app and create tables."""
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    # Import models to register them with db
    from backend.models import MenuItem, Order
    with app.app_context():
        db.create_all()
    return db


@contextmanager
def get_db(app):
    """Context manager to get database session."""
    with app.app_context():
        yield db.session
