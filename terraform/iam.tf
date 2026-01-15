data "aws_iam_user" "gameswiper" {
  user_name = "GameSwiper"
}

resource "aws_iam_user_policy" "cloudfront_invalidation" {
  name = "cloudfront-invalidation"
  user = data.aws_iam_user.gameswiper.user_name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudfront:CreateInvalidation",
          "cloudfront:GetDistribution",
          "cloudfront:ListDistributions"
        ]
        Resource = "*"
      }
    ]
  })
}
