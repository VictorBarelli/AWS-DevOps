# Development Environment Configuration
# Free tier optimized settings

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # Uncomment after bootstrap
  # backend "s3" {
  #   bucket         = "oracle-devops-terraform-state"
  #   key            = "dev/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "oracle-devops-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "oracle-devops"
}

variable "environment" {
  description = "Environment"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

# -----------------------------------------------------------------------------
# VPC Module
# -----------------------------------------------------------------------------

module "vpc" {
  source = "../../modules/vpc"

  project_name       = var.project_name
  environment        = var.environment
  vpc_cidr           = "10.0.0.0/16"
  availability_zones = ["us-east-1a", "us-east-1b"]
}

# -----------------------------------------------------------------------------
# ECR Module
# -----------------------------------------------------------------------------

module "ecr" {
  source = "../../modules/ecr"

  project_name = var.project_name
  environment  = var.environment
  repositories = [
    "api-gateway",
    "auth-service",
    "user-service",
    "order-service",
    "notification-service"
  ]
}

# -----------------------------------------------------------------------------
# ECS Module
# -----------------------------------------------------------------------------

module "ecs" {
  source = "../../modules/ecs"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
}

# -----------------------------------------------------------------------------
# RDS Module
# -----------------------------------------------------------------------------

module "rds" {
  source = "../../modules/rds"

  project_name            = var.project_name
  environment             = var.environment
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  allowed_security_groups = [module.ecs.security_group_id]
  database_name           = "oracledevops"
}

# -----------------------------------------------------------------------------
# S3 Module
# -----------------------------------------------------------------------------

module "s3" {
  source = "../../modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# -----------------------------------------------------------------------------
# DynamoDB Module
# -----------------------------------------------------------------------------

module "dynamodb" {
  source = "../../modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment
}

# -----------------------------------------------------------------------------
# IAM Module
# -----------------------------------------------------------------------------

module "iam" {
  source = "../../modules/iam"

  project_name        = var.project_name
  environment         = var.environment
  ecr_repository_arns = values(module.ecr.repository_arns)
  s3_bucket_arns      = [module.s3.artifacts_bucket_arn, module.s3.logs_bucket_arn]
  dynamodb_table_arns = [module.dynamodb.orders_table_arn, module.dynamodb.sessions_table_arn]
}

# -----------------------------------------------------------------------------
# CloudWatch Module
# -----------------------------------------------------------------------------

module "cloudwatch" {
  source = "../../modules/cloudwatch"

  project_name     = var.project_name
  environment      = var.environment
  ecs_cluster_name = module.ecs.cluster_name
}

# -----------------------------------------------------------------------------
# API Gateway Module
# -----------------------------------------------------------------------------

module "api_gateway" {
  source = "../../modules/api-gateway"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  ecs_security_group_id = module.ecs.security_group_id
}

# -----------------------------------------------------------------------------
# Lambda Module
# -----------------------------------------------------------------------------

module "lambda" {
  source = "../../modules/lambda"

  project_name              = var.project_name
  environment               = var.environment
  lambda_execution_role_arn = module.iam.lambda_execution_role_arn
  artifacts_bucket_name     = module.s3.artifacts_bucket_id
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "ecs_cluster_name" {
  description = "ECS Cluster Name"
  value       = module.ecs.cluster_name
}

output "ecr_repositories" {
  description = "ECR Repository URLs"
  value       = module.ecr.repository_urls
}

output "rds_endpoint" {
  description = "RDS Endpoint"
  value       = module.rds.endpoint
}

output "github_actions_role_arn" {
  description = "GitHub Actions Role ARN"
  value       = module.iam.github_actions_role_arn
}

output "api_endpoint" {
  description = "API Gateway Endpoint"
  value       = module.api_gateway.api_endpoint
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = module.cloudwatch.dashboard_url
}

output "lambda_functions" {
  description = "Lambda Function Names"
  value       = module.lambda.function_names
}

