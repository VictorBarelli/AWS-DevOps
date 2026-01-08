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
        'service': 'notification-service',
        'timestamp': datetime.utcnow().isoformat(),
        'uptime': int(time.time() - START_TIME)
    })

@health_bp.route('/ready')
def ready():
    """Readiness probe"""
    from src.services.sns_service import SNSService
    
    try:
        sns_service = SNSService()
        sns_service.check_connection()
        sns_status = 'up'
    except Exception as e:
        sns_status = f'down: {str(e)}'
    
    is_ready = sns_status == 'up'
    
    return jsonify({
        'status': 'ready' if is_ready else 'not ready',
        'service': 'notification-service',
        'timestamp': datetime.utcnow().isoformat(),
        'dependencies': {
            'sns': sns_status
        }
    }), 200 if is_ready else 503
