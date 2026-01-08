"""
SQS Service - AWS Simple Queue Service
"""

import os
import json
import boto3

class SQSService:
    """SQS client for queueing notifications"""
    
    def __init__(self):
        self.region = os.getenv('AWS_REGION', 'us-east-1')
        self.endpoint = os.getenv('AWS_ENDPOINT')  # For LocalStack
        self.queue_url = os.getenv('SQS_QUEUE_URL', 'http://localhost:4566/000000000000/oracle-devops-dev-notifications')
        
        # Configure client
        config = {'region_name': self.region}
        if self.endpoint:
            config['endpoint_url'] = self.endpoint
            config['aws_access_key_id'] = 'test'
            config['aws_secret_access_key'] = 'test'
        
        self.client = boto3.client('sqs', **config)
    
    def send_message(self, message):
        """Send message to SQS queue"""
        if isinstance(message, dict):
            message = json.dumps(message)
        
        response = self.client.send_message(
            QueueUrl=self.queue_url,
            MessageBody=message
        )
        
        return response['MessageId']
    
    def send_batch(self, messages):
        """Send batch of messages"""
        entries = [
            {
                'Id': str(i),
                'MessageBody': json.dumps(msg) if isinstance(msg, dict) else msg
            }
            for i, msg in enumerate(messages)
        ]
        
        response = self.client.send_message_batch(
            QueueUrl=self.queue_url,
            Entries=entries
        )
        
        return response
    
    def receive_messages(self, max_messages=10):
        """Receive messages from queue"""
        response = self.client.receive_message(
            QueueUrl=self.queue_url,
            MaxNumberOfMessages=max_messages,
            WaitTimeSeconds=5
        )
        
        return response.get('Messages', [])
    
    def delete_message(self, receipt_handle):
        """Delete processed message"""
        self.client.delete_message(
            QueueUrl=self.queue_url,
            ReceiptHandle=receipt_handle
        )
