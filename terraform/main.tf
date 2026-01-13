# ==========================================
# GameSwipe - Terraform Configuration
# AWS S3 + CloudFront + SSL
# ==========================================

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend for state management (optional - can use S3)
  # backend "s3" {
  #   bucket = "gameswipe-terraform-state"
  #   key    = "terraform.tfstate"
  #   region = "us-east-1"
  # }
}

# AWS Provider
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "GameSwipe"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Provider for ACM certificate (must be us-east-1 for CloudFront)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
