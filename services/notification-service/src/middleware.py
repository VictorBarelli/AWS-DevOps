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
        g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))
        g.start_time = time.time()
    
    @app.after_request
    def after_request(response):
        response.headers['X-Request-ID'] = g.get('request_id', '')
        
        if hasattr(g, 'start_time'):
            duration = int((time.time() - g.start_time) * 1000)
            response.headers['X-Response-Time'] = f'{duration}ms'
        
        logger.info(f'{request.method} {request.path} - {response.status_code}')
        
        return response
