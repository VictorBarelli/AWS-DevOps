<#
.SYNOPSIS
    Deploy services to AWS
.DESCRIPTION
    Builds, pushes, and deploys services to ECS
.EXAMPLE
    .\deploy.ps1 -Environment dev -Services api-gateway,auth-service
#>

param(
    [Parameter(Mandatory)]
    [ValidateSet("dev", "prod")]
    [string]$Environment,
    
    [Parameter()]
    [string[]]$Services = @("api-gateway", "auth-service", "user-service", "order-service", "notification-service"),
    
    [Parameter()]
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Deploying to $Environment environment..." -ForegroundColor Cyan
Write-Host "   Services: $($Services -join ', ')"
Write-Host ""

# Get AWS account ID
$accountId = (aws sts get-caller-identity --query Account --output text)
$ecrRegistry = "$accountId.dkr.ecr.$Region.amazonaws.com"

# Login to ECR
Write-Host "🔐 Logging into ECR..." -ForegroundColor Cyan
aws ecr get-login-password --region $Region | docker login --username AWS --password-stdin $ecrRegistry
Write-Host ""

foreach ($service in $Services) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    Write-Host "📦 Processing: $service" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
    
    $servicePath = "services/$service"
    $repoName = "oracle-devops-$Environment-$service"
    $imageUri = "$ecrRegistry/${repoName}:latest"
    
    # Check if service directory exists
    if (-not (Test-Path $servicePath)) {
        Write-Host "  ⚠️  Service directory not found, skipping" -ForegroundColor Yellow
        continue
    }
    
    # Build Docker image
    Write-Host "  🔨 Building Docker image..."
    docker build -t $repoName $servicePath
    docker tag "${repoName}:latest" $imageUri
    
    # Push to ECR
    Write-Host "  📤 Pushing to ECR..."
    docker push $imageUri
    
    # Update ECS service
    Write-Host "  🔄 Updating ECS service..."
    $clusterName = "oracle-devops-$Environment-cluster"
    $serviceName = "oracle-devops-$Environment-$service"
    
    try {
        aws ecs update-service `
            --cluster $clusterName `
            --service $serviceName `
            --force-new-deployment `
            --region $Region `
            --output text | Out-Null
        
        Write-Host "  ✅ Service updated successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️  ECS service not found (may need to create task definition first)" -ForegroundColor Yellow
    }
    
    Write-Host ""
}

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Check service status:" -ForegroundColor Cyan
Write-Host "  aws ecs describe-services --cluster oracle-devops-$Environment-cluster --services $($Services | ForEach-Object { "oracle-devops-$Environment-$_" } | Join-String -Separator ' ')"
