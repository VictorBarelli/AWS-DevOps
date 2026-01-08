# Setup Guide

Step-by-step guide to get the Oracle DevOps Platform running locally and deploying to AWS.

## Prerequisites

- **Docker Desktop** (v20+)
- **Terraform** (v1.5+)
- **AWS CLI** (v2+)
- **Node.js** (v20+)
- **Python** (v3.11+)
- **Git**

## Quick Start (Local Development)

```powershell
# 1. Clone the repository
git clone https://github.com/yourusername/Oracle-DevOps.git
cd Oracle-DevOps

# 2. Start LocalStack (AWS simulation)
.\scripts\localstack-setup.ps1

# 3. Start all services
docker-compose up -d

# 4. Verify services are running
curl http://localhost:8080/health
```

## AWS Deployment

### Step 1: Configure AWS CLI

```powershell
aws configure
# Enter your Access Key, Secret Key, and Region (us-east-1)
```

### Step 2: Bootstrap Terraform State

```powershell
.\scripts\bootstrap.ps1
```

This creates:
- S3 bucket for Terraform state
- DynamoDB table for state locking
- Budget alert at $1

### Step 3: Uncomment Backend Configuration

Edit `terraform/environments/dev/main.tf` and uncomment the backend block:

```hcl
backend "s3" {
  bucket         = "oracle-devops-terraform-state"
  key            = "dev/terraform.tfstate"
  region         = "us-east-1"
  encrypt        = true
  dynamodb_table = "oracle-devops-terraform-locks"
}
```

### Step 4: Deploy Infrastructure

```powershell
cd terraform/environments/dev
terraform init
terraform plan
terraform apply
```

### Step 5: Deploy Services

```powershell
.\scripts\deploy.ps1 -Environment dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | us-east-1 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `AWS_ENDPOINT` | LocalStack endpoint (local only) | http://localhost:4566 |

## Useful Commands

```powershell
# View logs
make logs

# Run tests
make test

# Security scan
make scan-all

# Clean up local resources
.\scripts\cleanup.ps1 -Environment local -Confirm

# Destroy AWS resources
.\scripts\cleanup.ps1 -Environment dev -Confirm
```

## Troubleshooting

### LocalStack not starting

```powershell
# Check Docker is running
docker ps

# Restart LocalStack
docker-compose -f docker-compose.localstack.yml down
docker-compose -f docker-compose.localstack.yml up -d
```

### Terraform state locked

```powershell
# Force unlock (use with caution)
terraform force-unlock <LOCK_ID>
```

### Services can't connect to database

Ensure PostgreSQL is running and healthy:

```powershell
docker-compose ps postgres
docker-compose logs postgres
```
