"""
Notification Routes - Email, SMS, Push notifications
"""

from flask import Blueprint, request, jsonify, current_app
import logging

from src.services.sns_service import SNSService
from src.services.sqs_service import SQSService
from src.schemas import EmailNotificationSchema, SMSNotificationSchema, PushNotificationSchema

notification_bp = Blueprint('notifications', __name__)
logger = logging.getLogger(__name__)

# =============================================================================
# Routes
# =============================================================================

@notification_bp.route('/email', methods=['POST'])
def send_email():
    """Send email notification"""
    data = request.get_json()
    
    # Validate
    schema = EmailNotificationSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'error': 'Validation Error', 'details': errors}), 400
    
    try:
        sns_service = SNSService()
        
        message = {
            'type': 'email',
            'to': data['to'],
            'subject': data['subject'],
            'body': data['body'],
            'template': data.get('template')
        }
        
        # For production, you'd use SES instead
        # Here we publish to SNS for processing
        message_id = sns_service.publish(
            subject=f"Email: {data['subject']}",
            message=message
        )
        
        logger.info(f"Email notification queued: {message_id}")
        
        return jsonify({
            'message': 'Email notification queued',
            'message_id': message_id
        }), 202
        
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return jsonify({'error': 'Service Error', 'message': str(e)}), 500


@notification_bp.route('/sms', methods=['POST'])
def send_sms():
    """Send SMS notification"""
    data = request.get_json()
    
    # Validate
    schema = SMSNotificationSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'error': 'Validation Error', 'details': errors}), 400
    
    try:
        sns_service = SNSService()
        
        # For SMS, publish directly to phone number
        message_id = sns_service.publish_sms(
            phone_number=data['phone'],
            message=data['message']
        )
        
        logger.info(f"SMS notification sent: {message_id}")
        
        return jsonify({
            'message': 'SMS sent',
            'message_id': message_id
        }), 202
        
    except Exception as e:
        logger.error(f"Failed to send SMS: {str(e)}")
        return jsonify({'error': 'Service Error', 'message': str(e)}), 500


@notification_bp.route('/push', methods=['POST'])
def send_push():
    """Send push notification (placeholder for future implementation)"""
    data = request.get_json()
    
    # Validate
    schema = PushNotificationSchema()
    errors = schema.validate(data)
    if errors:
        return jsonify({'error': 'Validation Error', 'details': errors}), 400
    
    try:
        # Queue for async processing
        sqs_service = SQSService()
        
        message = {
            'type': 'push',
            'user_id': data['user_id'],
            'title': data['title'],
            'body': data['body'],
            'data': data.get('data', {})
        }
        
        message_id = sqs_service.send_message(message)
        
        logger.info(f"Push notification queued: {message_id}")
        
        return jsonify({
            'message': 'Push notification queued',
            'message_id': message_id
        }), 202
        
    except Exception as e:
        logger.error(f"Failed to queue push notification: {str(e)}")
        return jsonify({'error': 'Service Error', 'message': str(e)}), 500


@notification_bp.route('/batch', methods=['POST'])
def send_batch():
    """Send batch notifications"""
    data = request.get_json()
    
    if not data or 'notifications' not in data:
        return jsonify({'error': 'Bad Request', 'message': 'notifications array required'}), 400
    
    notifications = data['notifications']
    
    if len(notifications) > 100:
        return jsonify({'error': 'Bad Request', 'message': 'Maximum 100 notifications per batch'}), 400
    
    try:
        sqs_service = SQSService()
        results = []
        
        for notification in notifications:
            try:
                message_id = sqs_service.send_message(notification)
                results.append({'status': 'queued', 'message_id': message_id})
            except Exception as e:
                results.append({'status': 'failed', 'error': str(e)})
        
        success_count = sum(1 for r in results if r['status'] == 'queued')
        
        return jsonify({
            'message': f'{success_count}/{len(notifications)} notifications queued',
            'results': results
        }), 202
        
    except Exception as e:
        logger.error(f"Batch notification failed: {str(e)}")
        return jsonify({'error': 'Service Error', 'message': str(e)}), 500
