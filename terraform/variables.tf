# ==========================================
# Variables
# ==========================================

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "gameswipe"
}

variable "domain_name" {
  description = "Custom domain name (optional, leave empty to use CloudFront domain)"
  type        = string
  default     = ""
}
