"""
Routes Package
"""

from src.routes.notification import notification_bp
from src.routes.health import health_bp

__all__ = ['notification_bp', 'health_bp']
