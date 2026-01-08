<#
.SYNOPSIS
    Setup LocalStack for local development
.DESCRIPTION
    Starts LocalStack and initializes AWS resources
.EXAMPLE
    .\localstack-setup.ps1
#>

param(
    [Parameter()]
    [switch]$SeedData
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up LocalStack..." -ForegroundColor Cyan
Write-Host ""

# Check Docker
try {
    $null = docker --version
    Write-Host "✅ Docker found" -ForegroundColor Green
}
catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if LocalStack is running
$localstackRunning = docker ps --filter "name=oracle-devops-localstack" --format "{{.Names}}"

if ($localstackRunning) {
    Write-Host "⚠️  LocalStack is already running" -ForegroundColor Yellow
}
else {
    Write-Host "🐳 Starting LocalStack..." -ForegroundColor Cyan
    docker-compose -f docker-compose.localstack.yml up -d
    
    # Wait for LocalStack to be ready
    Write-Host "⏳ Waiting for LocalStack to be ready..."
    $maxAttempts = 30
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $health = Invoke-RestMethod -Uri "http://localhost:4566/_localstack/health" -TimeoutSec 2
            if ($health.services) {
                Write-Host "✅ LocalStack is ready!" -ForegroundColor Green
                break
            }
        }
        catch {
            # Ignore errors while waiting
        }
        $attempt++
        Start-Sleep -Seconds 2
    }
    
    if ($attempt -ge $maxAttempts) {
        Write-Host "❌ LocalStack failed to start" -ForegroundColor Red
        exit 1
    }
}

# Configure AWS CLI for LocalStack
Write-Host ""
Write-Host "📝 Configuring AWS CLI profile for LocalStack..." -ForegroundColor Cyan

$awsConfig = @"
[profile localstack]
region = us-east-1
output = json
endpoint_url = http://localhost:4566
"@

$awsCredentials = @"
[localstack]
aws_access_key_id = test
aws_secret_access_key = test
"@

# Append to existing files or create new
$awsConfigPath = "$env:USERPROFILE\.aws\config"
$awsCredentialsPath = "$env:USERPROFILE\.aws\credentials"

if (-not (Test-Path "$env:USERPROFILE\.aws")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.aws" -Force | Out-Null
}

# Check if profile already exists
if (-not (Get-Content $awsConfigPath -ErrorAction SilentlyContinue | Select-String "profile localstack")) {
    Add-Content -Path $awsConfigPath -Value "`n$awsConfig"
    Write-Host "✅ Added LocalStack profile to AWS config" -ForegroundColor Green
}

if (-not (Get-Content $awsCredentialsPath -ErrorAction SilentlyContinue | Select-String "\[localstack\]")) {
    Add-Content -Path $awsCredentialsPath -Value "`n$awsCredentials"
    Write-Host "✅ Added LocalStack credentials" -ForegroundColor Green
}

# Seed data if requested
if ($SeedData) {
    Write-Host ""
    Write-Host "🌱 Seeding test data..." -ForegroundColor Cyan
    docker exec oracle-devops-localstack bash /etc/localstack/init/ready.d/seed-data.sh
}

Write-Host ""
Write-Host "✅ LocalStack setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "  AWS CLI:   aws --profile localstack s3 ls"
Write-Host "  Or set:    `$env:AWS_PROFILE = 'localstack'"
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  S3:        http://localhost:4566"
Write-Host "  DynamoDB:  http://localhost:4566"
Write-Host "  SQS:       http://localhost:4566"
Write-Host "  SNS:       http://localhost:4566"
Write-Host ""
