variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "project_name" {
  type    = string
  default = "gameswipe"
}

variable "domain_name" {
  type    = string
  default = ""
}

variable "key_pair_name" {
  type        = string
  default     = "gameswipe-key"
  description = "Name of the EC2 key pair for SSH access"
}
