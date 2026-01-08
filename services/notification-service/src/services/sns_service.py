"""
SNS Service - AWS Simple Notification Service
"""

import os
import json
import boto3
from flask import current_app

class SNSService:
    """SNS client for publishing notifications"""
    
    def __init__(self):
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        self.endpoint = os.getenv('AWS_ENDPOINT')  # For LocalStack
        self.topic_arn = os.getenv('SNS_TOPIC_ARN', 'arn:aws:sns:us-east-1:000000000000:oracle-devops-dev-alerts')
        
        # Configure client
        config = {'region_name': self.region}
        if self.endpoint:
            config['endpoint_url'] = self.endpoint
            config['aws_access_key_id'] = 'test'
            config['aws_secret_access_key'] = 'test'
        
        self.client = boto3.client('sns', **config)
    
    def publish(self, subject, message):
        """Publish message to SNS topic"""
        if isinstance(message, dict):
            message = json.dumps(message)
        
        response = self.client.publish(
            TopicArn=self.topic_arn,
            Subject=subject,
            Message=message
        )
        
        return response['MessageId']
    
    def publish_sms(self, phone_number, message):
        """Send SMS directly via SNS"""
        response = self.client.publish(
            PhoneNumber=phone_number,
            Message=message,
            MessageAttributes={
                'AWS.SNS.SMS.SMSType': {
                    'DataType': 'String',
                    'StringValue': 'Transactional'
                }
            }
        )
        
        return response['MessageId']
    
    def check_connection(self):
        """Check SNS connectivity"""
        self.client.list_topics(NextToken='')
        return True
