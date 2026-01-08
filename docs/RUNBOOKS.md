# Operational Runbooks

This document contains runbooks for common operational tasks.

## Table of Contents

1. [Deployment](#deployment)
2. [Incident Response](#incident-response)
3. [Scaling](#scaling)
4. [Database Operations](#database-operations)
5. [Log Analysis](#log-analysis)

---

## Deployment

### Deploy to Development

```powershell
# Option 1: Git push (triggers CI/CD)
git push origin main

# Option 2: Manual deployment
.\scripts\deploy.ps1 -Environment dev
```

### Deploy to Production

1. **Verify dev is stable**
   ```bash
   aws ecs describe-services --cluster oracle-devops-dev-cluster --services oracle-devops-dev-api-gateway
   ```

2. **Trigger production deploy**
   - Go to GitHub Actions
   - Select "Deploy to Production" workflow
   - Click "Run workflow"
   - Type `deploy` to confirm

3. **Monitor deployment**
   ```bash
   aws ecs wait services-stable --cluster oracle-devops-prod-cluster --services oracle-devops-prod-api-gateway
   ```

### Rollback

```bash
# Find previous task definition
aws ecs list-task-definitions --family-prefix oracle-devops-dev-api-gateway --sort DESC

# Update service to previous version
aws ecs update-service \
  --cluster oracle-devops-dev-cluster \
  --service oracle-devops-dev-api-gateway \
  --task-definition oracle-devops-dev-api-gateway:PREVIOUS_VERSION
```

---

## Incident Response

### High CPU/Memory Alert

1. **Check ECS metrics**
   ```bash
   aws cloudwatch get-metric-statistics \
     --namespace AWS/ECS \
     --metric-name CPUUtilization \
     --dimensions Name=ServiceName,Value=oracle-devops-dev-api-gateway \
     --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
     --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
     --period 300 \
     --statistics Average
   ```

2. **Check logs**
   ```bash
   aws logs tail /ecs/oracle-devops-dev/api-gateway --follow
   ```

3. **Scale if needed**
   ```bash
   aws ecs update-service \
     --cluster oracle-devops-dev-cluster \
     --service oracle-devops-dev-api-gateway \
     --desired-count 3
   ```

### High Error Rate

1. **Check error logs**
   ```bash
   aws logs filter-log-events \
     --log-group-name /ecs/oracle-devops-dev/api-gateway \
     --filter-pattern "ERROR" \
     --start-time $(date -u -d '30 minutes ago' +%s000)
   ```

2. **Check recent deployments**
   ```bash
   aws ecs describe-services --cluster oracle-devops-dev-cluster \
     --services oracle-devops-dev-api-gateway \
     --query 'services[0].deployments'
   ```

3. **Rollback if necessary** (see Rollback section)

### Database Connection Issues

1. **Check RDS status**
   ```bash
   aws rds describe-db-instances \
     --db-instance-identifier oracle-devops-dev-postgres \
     --query 'DBInstances[0].DBInstanceStatus'
   ```

2. **Check connections**
   ```bash
   psql -h <RDS_ENDPOINT> -U dbadmin -d oracledevops -c "SELECT count(*) FROM pg_stat_activity;"
   ```

3. **Restart ECS tasks if needed**
   ```bash
   aws ecs update-service \
     --cluster oracle-devops-dev-cluster \
     --service oracle-devops-dev-auth-service \
     --force-new-deployment
   ```

---

## Scaling

### Manual Scaling

```bash
# Scale up
aws ecs update-service \
  --cluster oracle-devops-dev-cluster \
  --service oracle-devops-dev-api-gateway \
  --desired-count 3

# Scale down
aws ecs update-service \
  --cluster oracle-devops-dev-cluster \
  --service oracle-devops-dev-api-gateway \
  --desired-count 1
```

### View Current Scale

```bash
aws ecs describe-services \
  --cluster oracle-devops-dev-cluster \
  --services oracle-devops-dev-api-gateway oracle-devops-dev-auth-service \
  --query 'services[*].{name:serviceName,running:runningCount,desired:desiredCount}'
```

---

## Database Operations

### Create Database Backup

```bash
aws rds create-db-snapshot \
  --db-instance-identifier oracle-devops-dev-postgres \
  --db-snapshot-identifier manual-backup-$(date +%Y%m%d)
```

### Restore from Backup

```bash
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier oracle-devops-dev-postgres-restored \
  --db-snapshot-identifier manual-backup-20240101
```

### Connect to Database

```bash
# Get credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id oracle-devops/dev/db-credentials \
  --query SecretString --output text | jq -r '.password'

# Connect
psql -h <RDS_ENDPOINT> -U dbadmin -d oracledevops
```

---

## Log Analysis

### View Recent Logs

```bash
# All services
aws logs tail /ecs/oracle-devops-dev --follow

# Specific service
aws logs tail /ecs/oracle-devops-dev/api-gateway --follow --since 1h
```

### Search Logs

```bash
# Find errors
aws logs filter-log-events \
  --log-group-name /ecs/oracle-devops-dev/api-gateway \
  --filter-pattern "ERROR" \
  --start-time $(date -u -d '1 day ago' +%s000)

# Find specific request
aws logs filter-log-events \
  --log-group-name /ecs/oracle-devops-dev/api-gateway \
  --filter-pattern "REQUEST-ID-123"
```

### Export Logs

```bash
aws logs create-export-task \
  --log-group-name /ecs/oracle-devops-dev/api-gateway \
  --from $(date -u -d '1 day ago' +%s000) \
  --to $(date -u +%s000) \
  --destination oracle-devops-dev-logs \
  --destination-prefix exports/api-gateway
```
