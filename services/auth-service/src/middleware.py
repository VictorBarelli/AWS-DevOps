"""
Middleware Configuration
"""

from flask import request, g
import uuid
import logging
import time

logger = logging.getLogger(__name__)

def setup_middleware(app):
    """Setup request/response middleware"""
    
    @app.before_request
    def before_request():
        """Add request ID and start time"""
        g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        """Add response headers and logging"""
        # Add request ID header
        response.headers['X-Request-ID'] = g.get('request_id', '')
        
        # Add response time header
        if hasattr(g, 'start_time'):
            duration = int((time.time() - g.start_time) * 1000)
            response.headers['X-Response-Time'] = f'{duration}ms'
        
        # Log request
        logger.info(
            f'{request.method} {request.path} - {response.status_code}',
            extra={
                'request_id': g.get('request_id'),
                'method': request.method,
                'path': request.path,
                'status': response.status_code
            }
        )
        
        return response
