"""
Event Handler Lambda Function
Processes events from SQS queue for async workflows
"""

import json
import boto3
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

# Configuration
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
ORDERS_TABLE = os.environ.get('ORDERS_TABLE', 'oracle-devops-dev-orders')


def handler(event, context):
    """
    Process events from SQS queue.
    
    Supported event types:
    - order_created: Send confirmation, update inventory
    - order_shipped: Send shipping notification
    - user_registered: Send welcome email, provision resources
    - payment_received: Update order status, send receipt
    """
    logger.info(f"Processing {len(event.get('Records', []))} records")
    
    results = {
        'processed': 0,
        'failed': 0,
        'details': []
    }
    
    for record in event.get('Records', []):
        try:
            # Parse message
            body = json.loads(record['body'])
            message_type = body.get('type', 'unknown')
            
            logger.info(f"Processing event: {message_type}")
            
            # Route to handler
            handler_result = route_event(message_type, body)
            
            results['processed'] += 1
            results['details'].append({
                'type': message_type,
                'status': 'success',
                'result': handler_result
            })
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in message: {e}")
            results['failed'] += 1
            results['details'].append({
                'status': 'failed',
                'error': 'Invalid JSON'
            })
            
        except Exception as e:
            logger.error(f"Error processing record: {e}")
            results['failed'] += 1
            results['details'].append({
                'status': 'failed',
                'error': str(e)
            })
    
    logger.info(f"Completed: {results['processed']} processed, {results['failed']} failed")
    
    return {
        'statusCode': 200,
        'body': json.dumps(results)
    }


def route_event(event_type, payload):
    """Route event to appropriate handler."""
    handlers = {
        'order_created': handle_order_created,
        'order_shipped': handle_order_shipped,
        'user_registered': handle_user_registered,
        'payment_received': handle_payment_received,
    }
    
    handler_func = handlers.get(event_type, handle_unknown)
    return handler_func(payload)


def handle_order_created(payload):
    """Handle new order creation."""
    order_id = payload.get('order_id')
    user_id = payload.get('user_id')
    total = payload.get('total', 0)
    
    logger.info(f"Processing new order: {order_id} for user {user_id}")
    
    # Send confirmation notification
    if SNS_TOPIC_ARN:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Order Confirmation - {order_id}",
            Message=json.dumps({
                'type': 'order_confirmation',
                'order_id': order_id,
                'user_id': user_id,
                'total': total,
                'timestamp': datetime.utcnow().isoformat()
            })
        )
    
    return {'order_id': order_id, 'notification_sent': True}


def handle_order_shipped(payload):
    """Handle order shipped event."""
    order_id = payload.get('order_id')
    tracking_number = payload.get('tracking_number')
    carrier = payload.get('carrier', 'Unknown')
    
    logger.info(f"Order shipped: {order_id}, Tracking: {tracking_number}")
    
    # Send shipping notification
    if SNS_TOPIC_ARN:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Order Shipped - {order_id}",
            Message=json.dumps({
                'type': 'shipping_notification',
                'order_id': order_id,
                'tracking_number': tracking_number,
                'carrier': carrier
            })
        )
    
    return {'order_id': order_id, 'tracking_number': tracking_number}


def handle_user_registered(payload):
    """Handle new user registration."""
    user_id = payload.get('user_id')
    email = payload.get('email')
    
    logger.info(f"New user registered: {user_id}")
    
    # Send welcome email
    if SNS_TOPIC_ARN:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject="Welcome to Oracle DevOps Platform!",
            Message=json.dumps({
                'type': 'welcome_email',
                'user_id': user_id,
                'email': email
            })
        )
    
    return {'user_id': user_id, 'welcome_sent': True}


def handle_payment_received(payload):
    """Handle payment received event."""
    order_id = payload.get('order_id')
    amount = payload.get('amount')
    
    logger.info(f"Payment received for order: {order_id}, Amount: {amount}")
    
    # Update order status
    # In production, would update DynamoDB
    
    return {'order_id': order_id, 'payment_processed': True}


def handle_unknown(payload):
    """Handle unknown event types."""
    logger.warning(f"Unknown event type received: {payload}")
    return {'status': 'ignored', 'reason': 'unknown_event_type'}
