"""
Routes Package
"""

from src.routes.auth import auth_bp
from src.routes.health import health_bp

__all__ = ['auth_bp', 'health_bp']
