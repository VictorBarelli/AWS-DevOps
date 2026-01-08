# CloudWatch Module - Observability Stack
# Dashboards, Alarms, Log Groups, and Metrics
# Free tier: 10 custom metrics, 10 alarms, 5GB logs

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

variable "ecs_cluster_name" {
  description = "ECS cluster name for metrics"
  type        = string
}

variable "sns_alert_topic_arn" {
  description = "SNS topic ARN for alerts"
  type        = string
  default     = ""
}

variable "services" {
  description = "List of microservices to monitor"
  type        = list(string)
  default = [
    "api-gateway",
    "auth-service",
    "user-service",
    "order-service",
    "notification-service"
  ]
}

# -----------------------------------------------------------------------------
# Locals
# -----------------------------------------------------------------------------

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  
  common_tags = {
    Module = "cloudwatch"
  }
}

# -----------------------------------------------------------------------------
# SNS Topic for Alerts
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alerts"
  })
}

resource "aws_sns_topic_policy" "alerts" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudWatchAlarms"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}

# -----------------------------------------------------------------------------
# Log Groups for Services
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(var.services)

  name              = "/ecs/${local.name_prefix}/${each.value}"
  retention_in_days = 7 # Short retention for free tier

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-${each.value}-logs"
    Service = each.value
  })
}

# -----------------------------------------------------------------------------
# Metric Alarms - ECS Service Health
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  for_each = toset(var.services)

  alarm_name          = "${local.name_prefix}-${each.value}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "CPU utilization high for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = "${local.name_prefix}-${each.value}"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Service = each.value
  })
}

resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  for_each = toset(var.services)

  alarm_name          = "${local.name_prefix}-${each.value}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Memory utilization high for ${each.value}"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ClusterName = var.ecs_cluster_name
    ServiceName = "${local.name_prefix}-${each.value}"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Service = each.value
  })
}

# -----------------------------------------------------------------------------
# Metric Alarm - Error Rate (Log-based)
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_log_metric_filter" "error_count" {
  for_each = toset(var.services)

  name           = "${local.name_prefix}-${each.value}-errors"
  pattern        = "[timestamp, level=ERROR, ...]"
  log_group_name = aws_cloudwatch_log_group.services[each.value].name

  metric_transformation {
    name          = "${each.value}-error-count"
    namespace     = "${var.project_name}/Services"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_metric_alarm" "error_rate" {
  for_each = toset(var.services)

  alarm_name          = "${local.name_prefix}-${each.value}-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "${each.value}-error-count"
  namespace           = "${var.project_name}/Services"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "High error rate for ${each.value}"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Service = each.value
  })
}

# -----------------------------------------------------------------------------
# CloudWatch Dashboard
# -----------------------------------------------------------------------------

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${local.name_prefix}-dashboard"

  dashboard_body = jsonencode({
    widgets = concat(
      # Header
      [
        {
          type   = "text"
          x      = 0
          y      = 0
          width  = 24
          height = 1
          properties = {
            markdown = "# ${var.project_name} - ${var.environment} Environment"
          }
        }
      ],
      # ECS Cluster Overview
      [
        {
          type   = "metric"
          x      = 0
          y      = 1
          width  = 12
          height = 6
          properties = {
            title   = "ECS CPU Utilization"
            view    = "timeSeries"
            stacked = false
            region  = data.aws_region.current.name
            metrics = [
              for svc in var.services : [
                "AWS/ECS", "CPUUtilization",
                "ClusterName", var.ecs_cluster_name,
                "ServiceName", "${local.name_prefix}-${svc}",
                { label = svc }
              ]
            ]
          }
        },
        {
          type   = "metric"
          x      = 12
          y      = 1
          width  = 12
          height = 6
          properties = {
            title   = "ECS Memory Utilization"
            view    = "timeSeries"
            stacked = false
            region  = data.aws_region.current.name
            metrics = [
              for svc in var.services : [
                "AWS/ECS", "MemoryUtilization",
                "ClusterName", var.ecs_cluster_name,
                "ServiceName", "${local.name_prefix}-${svc}",
                { label = svc }
              ]
            ]
          }
        }
      ],
      # Error Rates
      [
        {
          type   = "metric"
          x      = 0
          y      = 7
          width  = 24
          height = 6
          properties = {
            title   = "Error Count by Service"
            view    = "timeSeries"
            stacked = true
            region  = data.aws_region.current.name
            metrics = [
              for svc in var.services : [
                "${var.project_name}/Services", "${svc}-error-count",
                { label = svc }
              ]
            ]
          }
        }
      ],
      # Alarms Status
      [
        {
          type   = "alarm"
          x      = 0
          y      = 13
          width  = 24
          height = 4
          properties = {
            title  = "Alarm Status"
            alarms = [
              for svc in var.services : aws_cloudwatch_metric_alarm.ecs_cpu_high[svc].arn
            ]
          }
        }
      ]
    )
  })
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_region" "current" {}

# -----------------------------------------------------------------------------
# Outputs
# -----------------------------------------------------------------------------

output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "log_group_names" {
  description = "Map of service to log group names"
  value = {
    for svc, lg in aws_cloudwatch_log_group.services : svc => lg.name
  }
}
