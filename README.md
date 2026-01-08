# 🚀 Enterprise AWS DevOps Platform

[![CI/CD](https://github.com/yourusername/Oracle-DevOps/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/Oracle-DevOps/actions)
[![Terraform](https://img.shields.io/badge/Terraform-1.5+-purple)](https://terraform.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**A production-grade, cloud-native DevOps platform** demonstrating advanced AWS skills while staying **100% within AWS Free Tier limits**.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Developer Workflow                        │
│  ┌──────────┐    ┌────────────┐    ┌──────────────────────────┐ │
│  │  GitHub  │───▶│   GitHub   │───▶│  Security Scans          │ │
│  │   Repo   │    │   Actions  │    │  (Trivy + Checkov)       │ │
│  └──────────┘    └────────────┘    └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     AWS Free Tier Infrastructure                 │
│  ┌────────────┐  ┌───────────┐  ┌────────────────────────────┐  │
│  │ API Gateway│  │    ECS    │  │     Microservices          │  │
│  │            │──│  Fargate  │──│  • API Gateway (Node.js)   │  │
│  │  (1M req)  │  │ (750 hrs) │  │  • Auth (Python)           │  │
│  └────────────┘  └───────────┘  │  • User (Python)           │  │
│                                 │  • Order (Node.js)         │  │
│  ┌────────────┐  ┌───────────┐  │  • Notification (Python)   │  │
│  │    RDS     │  │ DynamoDB  │  └────────────────────────────┘  │
│  │ PostgreSQL │  │   (25GB)  │                                  │
│  │ (t3.micro) │  └───────────┘  ┌────────────────────────────┐  │
│  └────────────┘                 │     Observability          │  │
│                                 │  • CloudWatch Logs         │  │
│  ┌────────────┐  ┌───────────┐  │  • X-Ray Tracing           │  │
│  │     S3     │  │    ECR    │  │  • SNS Alerts              │  │
│  │  Buckets   │  │  Registry │  └────────────────────────────┘  │
│  └────────────┘  └───────────┘                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 📂 Project Structure

```
Oracle-DevOps/
├── .github/workflows/     # CI/CD Pipelines
├── terraform/             # Infrastructure as Code
│   ├── modules/           # Reusable Terraform modules
│   └── environments/      # Dev/Prod configurations
├── services/              # Microservices
├── lambda/                # Serverless functions
├── localstack/            # Local AWS simulation
├── scripts/               # Utility scripts
├── docs/                  # Documentation
└── tests/                 # Test suites
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Terraform >= 1.5
- AWS CLI (configured)
- Node.js 20+ & Python 3.11+

### Local Development
```bash
# Start all services locally
make up

# Run tests
make test

# View logs
make logs
```

### Deploy to AWS
```bash
# Initialize Terraform
make tf-init ENV=dev

# Plan changes
make tf-plan ENV=dev

# Apply infrastructure
make tf-apply ENV=dev
```

## 💰 Cost: $0/month

| Service | Free Tier Limit | Our Usage |
|---------|-----------------|-----------|
| ECS Fargate | 750 hours/month | ~300 hours |
| RDS t3.micro | 750 hours/month | 720 hours |
| DynamoDB | 25 GB + 25 WCU/RCU | <1 GB |
| Lambda | 1M requests/month | ~10K |
| API Gateway | 1M requests/month | ~50K |

## 📖 Documentation

- [Architecture Deep Dive](docs/ARCHITECTURE.md)
- [Setup Guide](docs/SETUP.md)
- [Runbooks](docs/RUNBOOKS.md)
- [Cost Optimization](docs/COST-OPTIMIZATION.md)

## 🛠️ Technologies

| Category | Tools |
|----------|-------|
| **Cloud** | AWS (ECS, RDS, DynamoDB, Lambda, S3, API Gateway, Cognito) |
| **IaC** | Terraform |
| **Containers** | Docker, ECS Fargate |
| **CI/CD** | GitHub Actions |
| **Monitoring** | CloudWatch, X-Ray |
| **Security** | Trivy, Checkov, Cognito |

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.
