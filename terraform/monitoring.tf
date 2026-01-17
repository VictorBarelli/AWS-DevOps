resource "aws_s3_bucket" "logs" {
  bucket = "${var.project_name}-${var.environment}-logs"

  tags = {
    Name = "GameSwipe Access Logs"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 30
    }
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  depends_on = [aws_s3_bucket_ownership_controls.logs]
  bucket     = aws_s3_bucket.logs.id
  acl        = "private"
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "📊 CloudFront Requests"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "Requests", "DistributionId", aws_cloudfront_distribution.website.id, "Region", "Global", { stat = "Sum", period = 300 }]
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          title  = "📈 Bytes Downloaded"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "BytesDownloaded", "DistributionId", aws_cloudfront_distribution.website.id, "Region", "Global", { stat = "Sum", period = 300 }]
          ]
          view = "timeSeries"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "❌ 4xx Error Rate"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "4xxErrorRate", "DistributionId", aws_cloudfront_distribution.website.id, "Region", "Global", { stat = "Average", period = 300 }]
          ]
          view  = "timeSeries"
          yAxis = { left = { min = 0, max = 100 } }
        }
      },
      {
        type   = "metric"
        x      = 8
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "🔥 5xx Error Rate"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "5xxErrorRate", "DistributionId", aws_cloudfront_distribution.website.id, "Region", "Global", { stat = "Average", period = 300 }]
          ]
          view  = "timeSeries"
          yAxis = { left = { min = 0, max = 100 } }
          annotations = {
            horizontal = [
              { label = "Critical", value = 5, color = "#ff0000" }
            ]
          }
        }
      },
      {
        type   = "metric"
        x      = 16
        y      = 6
        width  = 8
        height = 6
        properties = {
          title  = "✅ Cache Hit Rate"
          region = "us-east-1"
          metrics = [
            ["AWS/CloudFront", "CacheHitRate", "DistributionId", aws_cloudfront_distribution.website.id, "Region", "Global", { stat = "Average", period = 300 }]
          ]
          view  = "timeSeries"
          yAxis = { left = { min = 0, max = 100 } }
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "🗄️ S3 Bucket Size"
          region = var.aws_region
          metrics = [
            ["AWS/S3", "BucketSizeBytes", "BucketName", aws_s3_bucket.website.id, "StorageType", "StandardStorage", { stat = "Average", period = 86400 }]
          ]
          view = "singleValue"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 12
        width  = 12
        height = 6
        properties = {
          title  = "📁 S3 Object Count"
          region = var.aws_region
          metrics = [
            ["AWS/S3", "NumberOfObjects", "BucketName", aws_s3_bucket.website.id, "StorageType", "AllStorageTypes", { stat = "Average", period = 86400 }]
          ]
          view = "singleValue"
        }
      },
      {
        type   = "text"
        x      = 0
        y      = 18
        width  = 24
        height = 2
        properties = {
          markdown = "## 🎮 GameSwipe Monitoring Dashboard\n**CloudFront Distribution:** `${aws_cloudfront_distribution.website.id}` | **URL:** https://${aws_cloudfront_distribution.website.domain_name}"
        }
      }
    ]
  })
}

resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"

  tags = {
    Name = "GameSwipe Alerts"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "CloudFront 5xx error rate is above 5%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website.id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "High 5xx Errors"
  }
}

resource "aws_cloudwatch_metric_alarm" "high_4xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-high-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 10
  alarm_description   = "CloudFront 4xx error rate is above 10%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website.id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "High 4xx Errors"
  }
}

resource "aws_cloudwatch_metric_alarm" "low_cache_hit_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-low-cache-hit-rate"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 3
  metric_name         = "CacheHitRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 70
  alarm_description   = "CloudFront cache hit rate is below 70%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website.id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "Low Cache Hit Rate"
  }
}

resource "aws_cloudwatch_metric_alarm" "traffic_spike" {
  alarm_name          = "${var.project_name}-${var.environment}-traffic-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Requests"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Sum"
  threshold           = 10000
  alarm_description   = "Unusual spike in traffic detected"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.website.id
    Region         = "Global"
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = {
    Name = "Traffic Spike"
  }
}
