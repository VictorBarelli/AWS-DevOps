# Lambda Module - Serverless Functions
# Free tier: 1 million requests, 400,000 GB-seconds

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, prod)"
  type        = string
}

variable "lambda_execution_role_arn" {
  description = "Lambda execution role ARN"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for Lambda in VPC"
  type        = string
  default     = ""
}

variable "private_subnet_ids" {
  description = "Private subnet IDs for Lambda in VPC"
  type        = list(string)
  default     = []
}

variable "artifacts_bucket_name" {
  description = "S3 bucket for Lambda artifacts"
  type        = string
}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Module = "lambda"
  }
}

# -----------------------------------------------------------------------------
# Lambda Security Group (if in VPC)
# -----------------------------------------------------------------------------

resource "aws_security_group" "lambda" {
  count = var.vpc_id != "" ? 1 : 0

  name        = "${local.name_prefix}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = var.vpc_id

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-sg"
  })
}

# -----------------------------------------------------------------------------
# Image Processor Lambda
# -----------------------------------------------------------------------------

data "archive_file" "image_processor" {
  type        = "zip"
  output_path = "${path.module}/files/image_processor.zip"

  source {
    content  = <<-EOF
      import json
      import boto3
      import os
      from urllib.parse import unquote_plus

      s3 = boto3.client('s3')

      def handler(event, context):
          """Process uploaded images - resize, optimize, etc."""
          print(f"Event: {json.dumps(event)}")
          
          for record in event.get('Records', []):
              bucket = record['s3']['bucket']['name']
              key = unquote_plus(record['s3']['object']['key'])
              
              print(f"Processing: s3://{bucket}/{key}")
              
              # In production, you would:
              # 1. Download the image
              # 2. Resize/optimize using Pillow
              # 3. Upload processed version
              
              # For now, just log
              print(f"Image processed successfully: {key}")
          
          return {
              'statusCode': 200,
              'body': json.dumps({'message': 'Images processed'})
          }
    EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "image_processor" {
  function_name = "${local.name_prefix}-image-processor"
  role          = var.lambda_execution_role_arn
  handler       = "lambda_function.handler"
  runtime       = "python3.11"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.image_processor.output_path
  source_code_hash = data.archive_file.image_processor.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT     = var.environment
      ARTIFACTS_BUCKET = var.artifacts_bucket_name
    }
  }

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-image-processor"
    Function = "image-processor"
  })
}

# S3 trigger for image processor
resource "aws_lambda_permission" "s3_trigger" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.image_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = "arn:aws:s3:::${var.artifacts_bucket_name}"
}

# -----------------------------------------------------------------------------
# Event Handler Lambda
# -----------------------------------------------------------------------------

data "archive_file" "event_handler" {
  type        = "zip"
  output_path = "${path.module}/files/event_handler.zip"

  source {
    content  = <<-EOF
      import json
      import boto3
      import os

      def handler(event, context):
          """Process events from SQS queue."""
          print(f"Event: {json.dumps(event)}")
          
          processed = 0
          failed = 0
          
          for record in event.get('Records', []):
              try:
                  body = json.loads(record['body'])
                  message_type = body.get('type', 'unknown')
                  
                  print(f"Processing {message_type} event")
                  
                  # Route based on event type
                  if message_type == 'order_created':
                      process_order(body)
                  elif message_type == 'user_registered':
                      process_registration(body)
                  else:
                      print(f"Unknown event type: {message_type}")
                  
                  processed += 1
                  
              except Exception as e:
                  print(f"Error processing record: {e}")
                  failed += 1
          
          return {
              'statusCode': 200,
              'body': json.dumps({
                  'processed': processed,
                  'failed': failed
              })
          }

      def process_order(event):
          print(f"Processing order: {event.get('order_id')}")
          # Send confirmation email, update inventory, etc.

      def process_registration(event):
          print(f"Processing registration: {event.get('user_id')}")
          # Send welcome email, provision resources, etc.
    EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "event_handler" {
  function_name = "${local.name_prefix}-event-handler"
  role          = var.lambda_execution_role_arn
  handler       = "lambda_function.handler"
  runtime       = "python3.11"
  timeout       = 60
  memory_size   = 256

  filename         = data.archive_file.event_handler.output_path
  source_code_hash = data.archive_file.event_handler.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-event-handler"
    Function = "event-handler"
  })
}

# -----------------------------------------------------------------------------
# Scheduled Job Lambda
# -----------------------------------------------------------------------------

data "archive_file" "scheduled_job" {
  type        = "zip"
  output_path = "${path.module}/files/scheduled_job.zip"

  source {
    content  = <<-EOF
      import json
      import boto3
      from datetime import datetime, timedelta

      dynamodb = boto3.resource('dynamodb')

      def handler(event, context):
          """Scheduled maintenance tasks."""
          print(f"Running scheduled job at {datetime.utcnow().isoformat()}")
          
          job_type = event.get('job_type', 'cleanup')
          
          if job_type == 'cleanup':
              cleanup_expired_sessions()
          elif job_type == 'report':
              generate_daily_report()
          elif job_type == 'health_check':
              run_health_checks()
          else:
              print(f"Unknown job type: {job_type}")
          
          return {
              'statusCode': 200,
              'body': json.dumps({
                  'job_type': job_type,
                  'completed_at': datetime.utcnow().isoformat()
              })
          }

      def cleanup_expired_sessions():
          """Remove expired sessions from DynamoDB."""
          print("Cleaning up expired sessions...")
          # Implementation would query sessions table and delete expired

      def generate_daily_report():
          """Generate and send daily metrics report."""
          print("Generating daily report...")
          # Implementation would aggregate metrics and send via SNS/SES

      def run_health_checks():
          """Check health of all services."""
          print("Running health checks...")
          # Implementation would check each service endpoint
    EOF
    filename = "lambda_function.py"
  }
}

resource "aws_lambda_function" "scheduled_job" {
  function_name = "${local.name_prefix}-scheduled-job"
  role          = var.lambda_execution_role_arn
  handler       = "lambda_function.handler"
  runtime       = "python3.11"
  timeout       = 300
  memory_size   = 256

  filename         = data.archive_file.scheduled_job.output_path
  source_code_hash = data.archive_file.scheduled_job.output_base64sha256

  environment {
    variables = {
      ENVIRONMENT = var.environment
    }
  }

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-scheduled-job"
    Function = "scheduled-job"
  })
}

# CloudWatch Event Rules for scheduled jobs
resource "aws_cloudwatch_event_rule" "cleanup" {
  name                = "${local.name_prefix}-cleanup-schedule"
  description         = "Trigger cleanup job every 6 hours"
  schedule_expression = "rate(6 hours)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "cleanup" {
  rule      = aws_cloudwatch_event_rule.cleanup.name
  target_id = "scheduled-job"
  arn       = aws_lambda_function.scheduled_job.arn

  input = jsonencode({
    job_type = "cleanup"
  })
}

resource "aws_lambda_permission" "cloudwatch_cleanup" {
  statement_id  = "AllowCloudWatchCleanup"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scheduled_job.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cleanup.arn
}

resource "aws_cloudwatch_event_rule" "daily_report" {
  name                = "${local.name_prefix}-daily-report"
  description         = "Trigger daily report at 8am UTC"
  schedule_expression = "cron(0 8 * * ? *)"

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "daily_report" {
  rule      = aws_cloudwatch_event_rule.daily_report.name
  target_id = "scheduled-job"
  arn       = aws_lambda_function.scheduled_job.arn

  input = jsonencode({
    job_type = "report"
  })
}

resource "aws_lambda_permission" "cloudwatch_report" {
  statement_id  = "AllowCloudWatchReport"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.scheduled_job.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_report.arn
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "image_processor_arn" {
  description = "Image Processor Lambda ARN"
  value       = aws_lambda_function.image_processor.arn
}

output "event_handler_arn" {
  description = "Event Handler Lambda ARN"
  value       = aws_lambda_function.event_handler.arn
}

output "scheduled_job_arn" {
  description = "Scheduled Job Lambda ARN"
  value       = aws_lambda_function.scheduled_job.arn
}

output "function_names" {
  description = "Map of Lambda function names"
  value = {
    image_processor = aws_lambda_function.image_processor.function_name
    event_handler   = aws_lambda_function.event_handler.function_name
    scheduled_job   = aws_lambda_function.scheduled_job.function_name
  }
}
