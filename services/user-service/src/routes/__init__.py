"""
Routes Package
"""

from src.routes.user import user_bp
from src.routes.health import health_bp

__all__ = ['user_bp', 'health_bp']
