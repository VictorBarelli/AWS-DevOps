#!/bin/bash
# LocalStack initialization script
# Creates AWS resources for local development

set -e

echo "🚀 Initializing LocalStack AWS resources..."

# Wait for LocalStack to be ready
sleep 5

# =============================================================================
# S3 Buckets
# =============================================================================

echo "📦 Creating S3 buckets..."

awslocal s3 mb s3://oracle-devops-dev-artifacts
awslocal s3 mb s3://oracle-devops-dev-logs

# =============================================================================
# DynamoDB Tables
# =============================================================================

echo "📊 Creating DynamoDB tables..."

# Orders table
awslocal dynamodb create-table \
    --table-name oracle-devops-dev-orders \
    --attribute-definitions \
        AttributeName=order_id,AttributeType=S \
        AttributeName=created_at,AttributeType=S \
        AttributeName=user_id,AttributeType=S \
    --key-schema \
        AttributeName=order_id,KeyType=HASH \
        AttributeName=created_at,KeyType=RANGE \
    --global-secondary-indexes \
        "[{\"IndexName\": \"user-orders-index\", \"KeySchema\": [{\"AttributeName\": \"user_id\", \"KeyType\": \"HASH\"}, {\"AttributeName\": \"created_at\", \"KeyType\": \"RANGE\"}], \"Projection\": {\"ProjectionType\": \"ALL\"}, \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}}]" \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# Sessions table
awslocal dynamodb create-table \
    --table-name oracle-devops-dev-sessions \
    --attribute-definitions AttributeName=session_id,AttributeType=S \
    --key-schema AttributeName=session_id,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5

# =============================================================================
# SQS Queues
# =============================================================================

echo "📬 Creating SQS queues..."

awslocal sqs create-queue --queue-name oracle-devops-dev-notifications
awslocal sqs create-queue --queue-name oracle-devops-dev-orders-dlq
awslocal sqs create-queue --queue-name oracle-devops-dev-orders \
    --attributes '{
        "RedrivePolicy": "{\"deadLetterTargetArn\":\"arn:aws:sqs:us-east-1:000000000000:oracle-devops-dev-orders-dlq\",\"maxReceiveCount\":\"3\"}"
    }'

# =============================================================================
# SNS Topics
# =============================================================================

echo "📢 Creating SNS topics..."

awslocal sns create-topic --name oracle-devops-dev-alerts

# =============================================================================
# Secrets Manager
# =============================================================================

echo "🔐 Creating secrets..."

awslocal secretsmanager create-secret \
    --name oracle-devops/dev/db-credentials \
    --secret-string '{"username":"dbadmin","password":"localdevpassword","database":"oracledevops"}'

awslocal secretsmanager create-secret \
    --name oracle-devops/dev/jwt-secret \
    --secret-string '{"secret":"local-dev-jwt-secret-change-in-production"}'

echo "✅ LocalStack initialization complete!"
echo ""
echo "Available resources:"
echo "  - S3: oracle-devops-dev-artifacts, oracle-devops-dev-logs"
echo "  - DynamoDB: oracle-devops-dev-orders, oracle-devops-dev-sessions"
echo "  - SQS: oracle-devops-dev-notifications, oracle-devops-dev-orders"
echo "  - SNS: oracle-devops-dev-alerts"
echo "  - Secrets: oracle-devops/dev/db-credentials, oracle-devops/dev/jwt-secret"
