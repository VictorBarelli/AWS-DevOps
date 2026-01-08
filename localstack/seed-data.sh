#!/bin/bash
# Seed data for local development
# Run after init-aws.sh

set -e

echo "🌱 Seeding test data..."

# =============================================================================
# Seed DynamoDB with sample orders
# =============================================================================

echo "📊 Adding sample orders to DynamoDB..."

awslocal dynamodb put-item \
    --table-name oracle-devops-dev-orders \
    --item '{
        "order_id": {"S": "ORD-001"},
        "created_at": {"S": "2024-01-15T10:30:00Z"},
        "user_id": {"S": "USR-001"},
        "status": {"S": "completed"},
        "total": {"N": "99.99"},
        "items": {"L": [
            {"M": {"product": {"S": "Widget A"}, "quantity": {"N": "2"}, "price": {"N": "29.99"}}},
            {"M": {"product": {"S": "Widget B"}, "quantity": {"N": "1"}, "price": {"N": "40.01"}}}
        ]}
    }'

awslocal dynamodb put-item \
    --table-name oracle-devops-dev-orders \
    --item '{
        "order_id": {"S": "ORD-002"},
        "created_at": {"S": "2024-01-16T14:15:00Z"},
        "user_id": {"S": "USR-001"},
        "status": {"S": "pending"},
        "total": {"N": "149.50"},
        "items": {"L": [
            {"M": {"product": {"S": "Widget C"}, "quantity": {"N": "3"}, "price": {"N": "49.83"}}}
        ]}
    }'

awslocal dynamodb put-item \
    --table-name oracle-devops-dev-orders \
    --item '{
        "order_id": {"S": "ORD-003"},
        "created_at": {"S": "2024-01-17T09:00:00Z"},
        "user_id": {"S": "USR-002"},
        "status": {"S": "shipped"},
        "total": {"N": "75.00"},
        "items": {"L": [
            {"M": {"product": {"S": "Widget A"}, "quantity": {"N": "1"}, "price": {"N": "29.99"}}},
            {"M": {"product": {"S": "Widget D"}, "quantity": {"N": "1"}, "price": {"N": "45.01"}}}
        ]}
    }'

# =============================================================================
# Seed S3 with sample files
# =============================================================================

echo "📦 Adding sample files to S3..."

echo '{"version": "1.0.0", "environment": "dev"}' | awslocal s3 cp - s3://oracle-devops-dev-artifacts/config/app-config.json
echo 'Sample log entry for testing' | awslocal s3 cp - s3://oracle-devops-dev-logs/sample.log

# =============================================================================
# Add test message to SQS
# =============================================================================

echo "📬 Adding test message to SQS..."

awslocal sqs send-message \
    --queue-url http://localhost:4566/000000000000/oracle-devops-dev-notifications \
    --message-body '{"type": "test", "message": "Hello from LocalStack!"}'

echo "✅ Seed data complete!"
echo ""
echo "Sample data added:"
echo "  - 3 sample orders in DynamoDB"
echo "  - Config file in S3 artifacts bucket"
echo "  - Test message in SQS queue"
