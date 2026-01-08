"""
Notification Service - Main Application
Flask application for sending notifications via SNS/SES
"""

import os
from flask import Flask, jsonify
from dotenv import load_dotenv

from src.routes import notification_bp, health_bp
from src.middleware import setup_middleware

load_dotenv()

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['AWS_REGION'] = os.getenv('AWS_REGION', 'us-east-1')
    app.config['AWS_ENDPOINT'] = os.getenv('AWS_ENDPOINT')  # For LocalStack
    app.config['SNS_TOPIC_ARN'] = os.getenv('SNS_TOPIC_ARN')
    
    # Setup middleware
    setup_middleware(app)
    
    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(notification_bp, url_prefix='/notifications')
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Not Found', 'message': str(error)}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'error': 'Internal Server Error', 'message': 'An unexpected error occurred'}), 500
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8084))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
