"""
Health Check Routes
"""

from flask import Blueprint, jsonify
from datetime import datetime
import time

health_bp = Blueprint('health', __name__)

START_TIME = time.time()

@health_bp.route('/health')
def health():
    """Liveness probe"""
    return jsonify({
        'status': 'healthy',
        'service': 'auth-service',
        'timestamp': datetime.utcnow().isoformat(),
        'uptime': int(time.time() - START_TIME)
    })

@health_bp.route('/ready')
def ready():
    """Readiness probe - check database connection"""
    from src.database import db
    
    try:
        db.session.execute(db.text('SELECT 1'))
        db_status = 'up'
    except Exception as e:
        db_status = f'down: {str(e)}'
    
    is_ready = db_status == 'up'
    
    return jsonify({
        'status': 'ready' if is_ready else 'not ready',
        'service': 'auth-service',
        'timestamp': datetime.utcnow().isoformat(),
        'dependencies': {
            'database': db_status
        }
    }), 200 if is_ready else 503
