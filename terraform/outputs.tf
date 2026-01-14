# ==========================================
# Outputs
# ==========================================

output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.website.id
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.website.arn
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_domain_name" {
  description = "CloudFront domain name (your website URL)"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "website_url" {
  description = "Website URL"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

# Monitoring Outputs
output "cloudwatch_dashboard_url" {
  description = "CloudWatch Dashboard URL"
  value       = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${var.project_name}-${var.environment}-dashboard"
}

output "sns_alerts_topic_arn" {
  description = "SNS Topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "logs_bucket_name" {
  description = "S3 bucket for access logs"
  value       = aws_s3_bucket.logs.id
}
