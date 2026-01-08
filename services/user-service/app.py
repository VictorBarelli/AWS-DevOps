"""
User Service - Main Application
Flask application for user management (CRUD)
"""

import os
from flask import Flask, jsonify
from dotenv import load_dotenv

from src.routes import user_bp, health_bp
from src.database import db
from src.middleware import setup_middleware

load_dotenv()

def create_app(config_name=None):
    """Application factory pattern"""
    app = Flask(__name__)
    
    # Configuration
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
        'DATABASE_URL', 
        'postgresql://dbadmin:localdevpassword@localhost:5432/oracledevops'
    )
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Initialize extensions
    db.init_app(app)
    
    # Setup middleware
    setup_middleware(app)
    
    # Register blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(user_bp, url_prefix='/users')
    
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
    port = int(os.getenv('PORT', 8082))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
