<#
.SYNOPSIS
    Cleanup AWS resources
.DESCRIPTION
    Destroys all Terraform resources and cleans up local development
.EXAMPLE
    .\cleanup.ps1 -Environment dev -Confirm
#>

param(
    [Parameter()]
    [ValidateSet("dev", "prod", "local")]
    [string]$Environment = "local",
    
    [Parameter()]
    [switch]$Confirm,
    
    [Parameter()]
    [switch]$IncludeState
)

$ErrorActionPreference = "Stop"

Write-Host "🧹 Cleanup Script for Oracle DevOps Platform" -ForegroundColor Cyan
Write-Host "   Environment: $Environment"
Write-Host ""

if (-not $Confirm) {
    Write-Host "⚠️  This will destroy resources. Run with -Confirm to proceed." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Cyan
    Write-Host "  .\cleanup.ps1 -Environment local -Confirm    # Clean local Docker"
    Write-Host "  .\cleanup.ps1 -Environment dev -Confirm      # Destroy dev AWS resources"
    Write-Host "  .\cleanup.ps1 -Environment dev -Confirm -IncludeState  # Also remove state"
    exit 0
}

if ($Environment -eq "local") {
    Write-Host "🐳 Cleaning up local Docker resources..." -ForegroundColor Cyan
    
    # Stop and remove containers
    docker-compose down -v 2>$null
    docker-compose -f docker-compose.localstack.yml down -v 2>$null
    
    # Remove images
    Write-Host "  Removing Docker images..."
    $images = docker images --filter "reference=oracle-devops*" -q
    if ($images) {
        docker rmi -f $images 2>$null
    }
    
    # Prune
    Write-Host "  Pruning unused resources..."
    docker system prune -f
    
    Write-Host "✅ Local cleanup complete!" -ForegroundColor Green
    
}
else {
    Write-Host "☁️  Destroying $Environment AWS resources..." -ForegroundColor Cyan
    Write-Host ""
    
    $tfPath = "terraform/environments/$Environment"
    
    if (-not (Test-Path $tfPath)) {
        Write-Host "❌ Terraform path not found: $tfPath" -ForegroundColor Red
        exit 1
    }
    
    Push-Location $tfPath
    
    try {
        # Initialize if needed
        if (-not (Test-Path ".terraform")) {
            Write-Host "  Initializing Terraform..."
            terraform init
        }
        
        # Destroy
        Write-Host "  Running terraform destroy..."
        terraform destroy -auto-approve
        
        Write-Host "✅ Terraform resources destroyed!" -ForegroundColor Green
        
    }
    finally {
        Pop-Location
    }
    
    # Remove state if requested
    if ($IncludeState) {
        Write-Host ""
        Write-Host "⚠️  Removing Terraform state..." -ForegroundColor Yellow
        
        $bucketName = "oracle-devops-terraform-state"
        $tableName = "oracle-devops-terraform-locks"
        
        # Empty and delete S3 bucket
        Write-Host "  Emptying S3 bucket..."
        aws s3 rm "s3://$bucketName" --recursive 2>$null
        
        Write-Host "  Deleting S3 bucket..."
        aws s3api delete-bucket --bucket $bucketName 2>$null
        
        # Delete DynamoDB table
        Write-Host "  Deleting DynamoDB table..."
        aws dynamodb delete-table --table-name $tableName 2>$null
        
        Write-Host "✅ State resources removed!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🎉 Cleanup complete!" -ForegroundColor Green
