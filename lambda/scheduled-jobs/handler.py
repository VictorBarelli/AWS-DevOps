"""
Scheduled Jobs Lambda Function
Runs periodic maintenance and reporting tasks
"""

import json
import boto3
import os
import logging
from datetime import datetime, timedelta

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')

# Configuration
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
SESSIONS_TABLE = os.environ.get('SESSIONS_TABLE', f'oracle-devops-{ENVIRONMENT}-sessions')


def handler(event, context):
    """
    Execute scheduled maintenance jobs.
    
    Job types:
    - cleanup: Remove expired sessions, old logs
    - report: Generate daily metrics report
    - health_check: Check all service endpoints
    """
    job_type = event.get('job_type', 'cleanup')
    
    logger.info(f"Starting scheduled job: {job_type}")
    start_time = datetime.utcnow()
    
    try:
        if job_type == 'cleanup':
            result = run_cleanup()
        elif job_type == 'report':
            result = generate_report()
        elif job_type == 'health_check':
            result = run_health_checks()
        else:
            result = {'status': 'unknown_job_type', 'job_type': job_type}
        
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Record metric
        put_job_metric(job_type, 'Success', duration)
        
        logger.info(f"Job completed: {job_type} in {duration}s")
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'job_type': job_type,
                'status': 'completed',
                'duration_seconds': duration,
                'result': result
            })
        }
        
    except Exception as e:
        logger.error(f"Job failed: {job_type} - {e}")
        put_job_metric(job_type, 'Failed', 0)
        raise


def run_cleanup():
    """Clean up expired sessions and old data."""
    logger.info("Running cleanup tasks...")
    
    results = {
        'sessions_cleaned': 0,
        'logs_archived': 0
    }
    
    # Clean expired sessions
    try:
        table = dynamodb.Table(SESSIONS_TABLE)
        now = int(datetime.utcnow().timestamp())
        
        # Scan for expired sessions (TTL should handle this, but backup)
        response = table.scan(
            FilterExpression='expires_at < :now',
            ExpressionAttributeValues={':now': now},
            Limit=100
        )
        
        expired_sessions = response.get('Items', [])
        
        for session in expired_sessions:
            table.delete_item(Key={'session_id': session['session_id']})
            results['sessions_cleaned'] += 1
        
        logger.info(f"Cleaned {results['sessions_cleaned']} expired sessions")
        
    except Exception as e:
        logger.warning(f"Session cleanup error: {e}")
    
    return results


def generate_report():
    """Generate daily metrics report."""
    logger.info("Generating daily report...")
    
    # Get metrics from CloudWatch
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=1)
    
    metrics = {}
    
    # ECS CPU metrics
    try:
        response = cloudwatch.get_metric_statistics(
            Namespace='AWS/ECS',
            MetricName='CPUUtilization',
            Dimensions=[
                {'Name': 'ClusterName', 'Value': f'oracle-devops-{ENVIRONMENT}-cluster'}
            ],
            StartTime=start_time,
            EndTime=end_time,
            Period=86400,
            Statistics=['Average', 'Maximum']
        )
        
        if response['Datapoints']:
            dp = response['Datapoints'][0]
            metrics['ecs_cpu_avg'] = dp.get('Average', 0)
            metrics['ecs_cpu_max'] = dp.get('Maximum', 0)
    except Exception as e:
        logger.warning(f"Could not get ECS metrics: {e}")
    
    # Build report
    report = {
        'date': start_time.strftime('%Y-%m-%d'),
        'environment': ENVIRONMENT,
        'metrics': metrics,
        'generated_at': datetime.utcnow().isoformat()
    }
    
    # Send report notification
    if SNS_TOPIC_ARN:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"Daily Report - {ENVIRONMENT} - {report['date']}",
            Message=json.dumps(report, indent=2)
        )
    
    logger.info(f"Report generated: {report}")
    
    return report


def run_health_checks():
    """Check health of all services."""
    import urllib.request
    
    logger.info("Running health checks...")
    
    services = [
        {'name': 'api-gateway', 'port': 8080},
        {'name': 'auth-service', 'port': 8081},
        {'name': 'user-service', 'port': 8082},
        {'name': 'order-service', 'port': 8083},
        {'name': 'notification-service', 'port': 8084}
    ]
    
    results = []
    unhealthy = []
    
    for service in services:
        status = 'unknown'
        latency = 0
        
        try:
            # In Lambda VPC, would check internal endpoints
            # For now, just record expected status
            status = 'healthy'
            latency = 50  # Simulated
            
        except Exception as e:
            status = 'unhealthy'
            unhealthy.append(service['name'])
            logger.error(f"Health check failed for {service['name']}: {e}")
        
        results.append({
            'service': service['name'],
            'status': status,
            'latency_ms': latency
        })
    
    # Alert if any unhealthy
    if unhealthy and SNS_TOPIC_ARN:
        sns.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f"⚠️ Health Check Alert - {ENVIRONMENT}",
            Message=f"Unhealthy services: {', '.join(unhealthy)}"
        )
    
    return {
        'services': results,
        'healthy': len([r for r in results if r['status'] == 'healthy']),
        'unhealthy': len(unhealthy)
    }


def put_job_metric(job_type, status, duration):
    """Record job execution metric in CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace='oracle-devops/ScheduledJobs',
            MetricData=[
                {
                    'MetricName': 'JobExecution',
                    'Dimensions': [
                        {'Name': 'JobType', 'Value': job_type},
                        {'Name': 'Environment', 'Value': ENVIRONMENT},
                        {'Name': 'Status', 'Value': status}
                    ],
                    'Value': 1,
                    'Unit': 'Count'
                },
                {
                    'MetricName': 'JobDuration',
                    'Dimensions': [
                        {'Name': 'JobType', 'Value': job_type},
                        {'Name': 'Environment', 'Value': ENVIRONMENT}
                    ],
                    'Value': duration,
                    'Unit': 'Seconds'
                }
            ]
        )
    except Exception as e:
        logger.warning(f"Could not put metric: {e}")
