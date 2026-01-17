output "s3_bucket_name" {
  value = aws_s3_bucket.website.id
}

output "s3_bucket_arn" {
  value = aws_s3_bucket.website.arn
}

output "cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.website.id
}

output "cloudfront_domain_name" {
  value = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "website_url" {
  value = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "cloudwatch_dashboard_url" {
  value = "https://${var.aws_region}.console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${var.project_name}-${var.environment}-dashboard"
}

output "sns_alerts_topic_arn" {
  value = aws_sns_topic.alerts.arn
}

output "logs_bucket_name" {
  value = aws_s3_bucket.logs.id
}

output "staging_s3_bucket_name" {
  value = aws_s3_bucket.staging.id
}

output "staging_cloudfront_distribution_id" {
  value = aws_cloudfront_distribution.staging.id
}

output "staging_website_url" {
  value = "https://${aws_cloudfront_distribution.staging.domain_name}"
}

output "ecr_repository_url" {
  value = aws_ecr_repository.app.repository_url
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "alb_dns_name" {
  value = "http://${aws_lb.main.dns_name}"
}
