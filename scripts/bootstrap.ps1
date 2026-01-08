<#
.SYNOPSIS
    Bootstrap script for Oracle DevOps Platform
.DESCRIPTION
    Creates initial AWS resources for Terraform state management
.EXAMPLE
    .\bootstrap.ps1 -Region us-east-1
#>

param(
    [Parameter()]
    [string]$Region = "us-east-1",
    
    [Parameter()]
    [string]$ProjectName = "oracle-devops"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Bootstrapping Oracle DevOps Platform..." -ForegroundColor Cyan
Write-Host ""

# Check AWS CLI
try {
    $null = aws --version
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Check AWS credentials
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "✅ Authenticated as: $($identity.Arn)" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS credentials not configured. Run 'aws configure' first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Creating Terraform state resources..." -ForegroundColor Cyan

# Create S3 bucket for state
$bucketName = "$ProjectName-terraform-state"
Write-Host "  Creating S3 bucket: $bucketName"

try {
    if ($Region -eq "us-east-1") {
        aws s3api create-bucket --bucket $bucketName --region $Region
    } else {
        aws s3api create-bucket --bucket $bucketName --region $Region `
            --create-bucket-configuration LocationConstraint=$Region
    }
    Write-Host "  ✅ S3 bucket created" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*BucketAlreadyOwnedByYou*") {
        Write-Host "  ⚠️  S3 bucket already exists (owned by you)" -ForegroundColor Yellow
    } else {
        throw
    }
}

# Enable versioning
Write-Host "  Enabling versioning..."
aws s3api put-bucket-versioning --bucket $bucketName `
    --versioning-configuration Status=Enabled

# Enable encryption
Write-Host "  Enabling encryption..."
aws s3api put-bucket-encryption --bucket $bucketName `
    --server-side-encryption-configuration '{
        "Rules": [{
            "ApplyServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
            }
        }]
    }'

# Block public access
Write-Host "  Blocking public access..."
aws s3api put-public-access-block --bucket $bucketName `
    --public-access-block-configuration '{
        "BlockPublicAcls": true,
        "IgnorePublicAcls": true,
        "BlockPublicPolicy": true,
        "RestrictPublicBuckets": true
    }'

# Create DynamoDB table for locking
$tableName = "$ProjectName-terraform-locks"
Write-Host "  Creating DynamoDB table: $tableName"

try {
    aws dynamodb create-table `
        --table-name $tableName `
        --attribute-definitions AttributeName=LockID,AttributeType=S `
        --key-schema AttributeName=LockID,KeyType=HASH `
        --billing-mode PAY_PER_REQUEST `
        --region $Region
    
    Write-Host "  ✅ DynamoDB table created" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*ResourceInUseException*") {
        Write-Host "  ⚠️  DynamoDB table already exists" -ForegroundColor Yellow
    } else {
        throw
    }
}

# Create budget alert
Write-Host ""
Write-Host "💰 Creating budget alert at $1..." -ForegroundColor Cyan

$budgetJson = @{
    BudgetName = "$ProjectName-budget"
    BudgetLimit = @{
        Amount = "1"
        Unit = "USD"
    }
    BudgetType = "COST"
    TimeUnit = "MONTHLY"
} | ConvertTo-Json -Depth 5

try {
    $accountId = $identity.Account
    aws budgets create-budget `
        --account-id $accountId `
        --budget "$budgetJson"
    Write-Host "  ✅ Budget alert created" -ForegroundColor Green
} catch {
    if ($_.Exception.Message -like "*DuplicateRecordException*") {
        Write-Host "  ⚠️  Budget already exists" -ForegroundColor Yellow
    } else {
        Write-Host "  ⚠️  Could not create budget: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Bootstrap complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Uncomment the backend configuration in terraform/environments/dev/main.tf"
Write-Host "  2. Run: cd terraform/environments/dev && terraform init"
Write-Host "  3. Run: terraform plan"
Write-Host ""
