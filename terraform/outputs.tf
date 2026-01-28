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



output "backend_public_ip" {
  value = aws_instance.backend.public_ip
}

output "backend_instance_id" {
  value = aws_instance.backend.id
}

output "cognito_user_pool_id" {
  value = aws_cognito_user_pool.main.id
}

output "cognito_client_id" {
  value = aws_cognito_user_pool_client.web.id
}

output "cognito_domain" {
  value = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.aws_region}.amazoncognito.com"
}
