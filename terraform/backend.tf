# Terraform Backend Configuration
# Stores state in S3 with DynamoDB locking

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Uncomment after creating the S3 bucket and DynamoDB table
  # backend "s3" {
  #   bucket         = "oracle-devops-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "oracle-devops-terraform-locks"
  # }
}

# Default provider configuration
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Oracle-DevOps"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
  default     = "dev"
}
