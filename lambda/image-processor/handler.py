"""
Image Processor Lambda Function
Triggered by S3 uploads to process/resize images
"""

import json
import boto3
import os
from urllib.parse import unquote_plus
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize clients
s3 = boto3.client('s3')

# Configuration
OUTPUT_BUCKET = os.environ.get('OUTPUT_BUCKET', os.environ.get('ARTIFACTS_BUCKET'))
THUMBNAIL_SIZE = (150, 150)
MEDIUM_SIZE = (600, 600)


def handler(event, context):
    """
    Process uploaded images - create thumbnails and optimized versions.
    
    Trigger: S3 ObjectCreated events
    """
    logger.info(f"Event received: {json.dumps(event)}")
    
    processed = []
    errors = []
    
    for record in event.get('Records', []):
        try:
            # Extract S3 info
            bucket = record['s3']['bucket']['name']
            key = unquote_plus(record['s3']['object']['key'])
            size = record['s3']['object'].get('size', 0)
            
            logger.info(f"Processing: s3://{bucket}/{key} ({size} bytes)")
            
            # Skip if not an image
            if not is_image(key):
                logger.info(f"Skipping non-image file: {key}")
                continue
            
            # Skip if already processed
            if '/processed/' in key or '/thumbnails/' in key:
                logger.info(f"Skipping already processed: {key}")
                continue
            
            # Process the image
            result = process_image(bucket, key)
            processed.append(result)
            
            logger.info(f"Successfully processed: {key}")
            
        except Exception as e:
            error_msg = f"Error processing {record}: {str(e)}"
            logger.error(error_msg)
            errors.append(error_msg)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'processed': len(processed),
            'errors': len(errors),
            'results': processed
        })
    }


def is_image(key):
    """Check if file is an image based on extension."""
    extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    return any(key.lower().endswith(ext) for ext in extensions)


def process_image(bucket, key):
    """
    Process a single image.
    
    In production, this would:
    1. Download the original image
    2. Create thumbnail and medium versions using Pillow
    3. Optimize the image (compress, strip metadata)
    4. Upload processed versions to output bucket
    
    For demo, we just log and copy metadata.
    """
    # Get original metadata
    response = s3.head_object(Bucket=bucket, Key=key)
    content_type = response.get('ContentType', 'image/jpeg')
    original_size = response.get('ContentLength', 0)
    
    # Generate output keys
    filename = os.path.basename(key)
    name, ext = os.path.splitext(filename)
    
    thumbnail_key = f"thumbnails/{name}_thumb{ext}"
    medium_key = f"processed/{name}_medium{ext}"
    
    # In production: actual image processing would happen here
    # For now, just record what would be done
    
    result = {
        'original': {
            'bucket': bucket,
            'key': key,
            'size': original_size,
            'content_type': content_type
        },
        'outputs': {
            'thumbnail': thumbnail_key,
            'medium': medium_key
        },
        'status': 'processed'
    }
    
    # Tag the original as processed
    s3.put_object_tagging(
        Bucket=bucket,
        Key=key,
        Tagging={
            'TagSet': [
                {'Key': 'Processed', 'Value': 'true'},
                {'Key': 'ProcessedTime', 'Value': context.get('aws_request_id', 'unknown') if 'context' in dir() else 'local'}
            ]
        }
    )
    
    return result
