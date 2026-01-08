# DynamoDB Module - NoSQL tables for caching and orders
# Free tier: 25GB storage, 25 RCU, 25 WCU

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# -----------------------------------------------------------------------------
# Variables
# -----------------------------------------------------------------------------

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
}

variable "environment" {
  description = "Environment (dev, prod)"
  type        = string
}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Module = "dynamodb"
  }
}

# -----------------------------------------------------------------------------
# Orders Table
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "orders" {
  name         = "${local.name_prefix}-orders"
  billing_mode = "PROVISIONED"
  
  # Free tier: 25 RCU, 25 WCU total
  read_capacity  = 5
  write_capacity = 5

  hash_key  = "order_id"
  range_key = "created_at"

  attribute {
    name = "order_id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  attribute {
    name = "user_id"
    type = "S"
  }

  global_secondary_index {
    name            = "user-orders-index"
    hash_key        = "user_id"
    range_key       = "created_at"
    projection_type = "ALL"
    read_capacity   = 5
    write_capacity  = 5
  }

  point_in_time_recovery {
    enabled = false # Disabled for simplicity
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-orders"
  })
}

# -----------------------------------------------------------------------------
# Sessions/Cache Table
# -----------------------------------------------------------------------------

resource "aws_dynamodb_table" "sessions" {
  name         = "${local.name_prefix}-sessions"
  billing_mode = "PROVISIONED"
  
  read_capacity  = 5
  write_capacity = 5

  hash_key = "session_id"

  attribute {
    name = "session_id"
    type = "S"
  }

  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sessions"
  })
}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "orders_table_name" {
  description = "Orders table name"
  value       = aws_dynamodb_table.orders.name
}

output "orders_table_arn" {
  description = "Orders table ARN"
  value       = aws_dynamodb_table.orders.arn
}

output "sessions_table_name" {
  description = "Sessions table name"
  value       = aws_dynamodb_table.sessions.name
}

output "sessions_table_arn" {
  description = "Sessions table ARN"
  value       = aws_dynamodb_table.sessions.arn
}
