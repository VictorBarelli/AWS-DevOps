# Cost Optimization Guide

This document outlines strategies to stay within AWS Free Tier and minimize costs.

## Free Tier Limits

| Service | Free Tier Limit | Our Usage | Status |
|---------|-----------------|-----------|--------|
| **ECS Fargate** | 750 hours/month | ~300 hours | ✅ Safe |
| **RDS db.t3.micro** | 750 hours/month | 720 hours | ✅ Safe |
| **DynamoDB** | 25 GB, 25 WCU/RCU | <1 GB, 5 WCU/RCU | ✅ Safe |
| **S3** | 5 GB storage | ~1 GB | ✅ Safe |
| **Lambda** | 1M requests/month | ~10K | ✅ Safe |
| **API Gateway** | 1M API calls/month | ~50K | ✅ Safe |
| **CloudWatch** | 10 custom metrics | 10 | ✅ Safe |
| **ECR** | 500 MB storage | ~400 MB | ✅ Safe |
| **X-Ray** | 100K traces/month | ~1K | ✅ Safe |

## Cost Monitoring

### AWS Budgets Alert

We've set up a $1 budget alert. If you haven't, run:

```powershell
.\scripts\bootstrap.ps1
```

This creates a budget alert that emails you at $1 spend.

### Check Current Costs

```bash
# Current month spend
aws ce get-cost-and-usage \
  --time-period Start=$(date -u +%Y-%m-01),End=$(date -u +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --query 'ResultsByTime[0].Total.BlendedCost'
```

## Cost-Saving Configurations

### ECS Fargate

- **SPOT capacity provider**: Uses SPOT instances for 70% cost reduction
- **Minimum tasks**: Running 1 task per service (not 2)
- **Auto-stop dev environment**: Consider stopping dev at night

```bash
# Stop all dev services (save money when not developing)
aws ecs update-service --cluster oracle-devops-dev-cluster --service oracle-devops-dev-api-gateway --desired-count 0
aws ecs update-service --cluster oracle-devops-dev-cluster --service oracle-devops-dev-auth-service --desired-count 0
# ... repeat for other services
```

### RDS

- **Single-AZ**: No Multi-AZ (saves ~50% on RDS)
- **db.t3.micro**: Smallest instance eligible for free tier
- **20 GB storage**: No auto-scaling to prevent overages
- **7-day backup**: Included in free tier

### DynamoDB

- **Provisioned capacity**: Using 5 RCU/WCU instead of on-demand
- **TTL for sessions**: Auto-deletes expired data

### S3

- **Lifecycle policies**: Auto-delete logs after 30 days
- **No versioning on logs bucket**: Reduces storage

### Lambda

- **256 MB memory**: Minimum practical memory
- **Short timeout**: Prevents runaway costs

### CloudWatch

- **7-day log retention**: Minimum to save on storage
- **10 custom metrics only**: Stay within free tier

## Cleanup Commands

### Remove Unused Resources

```bash
# Delete old ECR images (keeping last 5)
# This is automated via lifecycle policy

# Empty and check S3 usage
aws s3 ls s3://oracle-devops-dev-logs --summarize --human-readable

# Check DynamoDB size
aws dynamodb describe-table --table-name oracle-devops-dev-orders \
  --query 'Table.TableSizeBytes'
```

### Full Environment Cleanup

```powershell
# Destroy all resources (when not using)
.\scripts\cleanup.ps1 -Environment dev -Confirm
```

## Warning Signs

Watch for these indicators of potential overages:

1. **ECS running hours > 600/month** - Scale down or use scheduling
2. **RDS storage > 18 GB** - Clean up old data
3. **S3 > 4 GB** - Check lifecycle policies
4. **Lambda invocations > 800K** - Check for loops
5. **API Gateway calls > 800K** - Check for abuse

## Monthly Checklist

- [ ] Check AWS Cost Explorer for unexpected charges
- [ ] Review ECS task count and uptime
- [ ] Verify log lifecycle policies are working
- [ ] Check ECR image count (should be ≤5 per repo)
- [ ] Review DynamoDB table sizes
- [ ] Confirm budget alerts are active
