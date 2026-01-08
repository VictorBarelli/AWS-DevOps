# Architecture Overview

This document describes the architecture of the Oracle DevOps Platform.

## System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              DEVELOPER WORKFLOW                               │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐     ┌─────────────┐     ┌─────────────────────────────┐   │
│   │   GitHub    │────▶│   GitHub    │────▶│     Security Scanning       │   │
│   │    Repo     │     │   Actions   │     │  (Trivy, Checkov, SAST)     │   │
│   └─────────────┘     └─────────────┘     └─────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│                       ┌─────────────┐                                        │
│                       │     ECR     │                                        │
│                       │  Registry   │                                        │
│                       └─────────────┘                                        │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           AWS INFRASTRUCTURE                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                              VPC (10.0.0.0/16)                         │  │
│  │  ┌──────────────────────────┐  ┌──────────────────────────────────┐   │  │
│  │  │     Public Subnets       │  │        Private Subnets           │   │  │
│  │  │  ┌────────┐ ┌────────┐   │  │  ┌─────────┐ ┌─────────────────┐ │   │  │
│  │  │  │  AZ-1  │ │  AZ-2  │   │  │  │   RDS   │ │   ECS Fargate   │ │   │  │
│  │  │  │        │ │        │   │  │  │Postgres │ │                 │ │   │  │
│  │  │  └────────┘ └────────┘   │  │  └─────────┘ │  ┌───────────┐  │ │   │  │
│  │  │       │          │       │  │              │  │API Gateway│  │ │   │  │
│  │  │       └────┬─────┘       │  │              │  │Auth Svc   │  │ │   │  │
│  │  │            │             │  │              │  │User Svc   │  │ │   │  │
│  │  │     ┌──────┴──────┐      │  │              │  │Order Svc  │  │ │   │  │
│  │  │     │   Internet  │      │  │              │  │Notify Svc │  │ │   │  │
│  │  │     │   Gateway   │      │  │              │  └───────────┘  │ │   │  │
│  │  │     └─────────────┘      │  │              └─────────────────┘ │   │  │
│  │  └──────────────────────────┘  └──────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           AWS Services                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │ │
│  │  │    S3    │  │ DynamoDB │  │   SQS    │  │   SNS    │  │ Secrets  │  │ │
│  │  │ Buckets  │  │  Tables  │  │  Queues  │  │  Topics  │  │ Manager  │  │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                          Observability                                  │ │
│  │  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │  │ CloudWatch Logs  │  │ CloudWatch Alarms│  │    X-Ray Tracing     │  │ │
│  │  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## Microservices

| Service | Language | Port | Responsibilities |
|---------|----------|------|------------------|
| **API Gateway** | Node.js | 8080 | Request routing, rate limiting, authentication |
| **Auth Service** | Python | 8081 | JWT tokens, Cognito integration, session management |
| **User Service** | Python | 8082 | User CRUD, profile management |
| **Order Service** | Node.js | 8083 | Order processing, DynamoDB persistence |
| **Notification Service** | Python | 8084 | Email/SMS via SNS, async messaging |

## Data Flow

```
Client Request
      │
      ▼
┌─────────────────┐
│   API Gateway   │  ← Rate limiting, auth validation
└────────┬────────┘
         │
    ┌────┴────┬─────────────┬─────────────┐
    ▼         ▼             ▼             ▼
┌───────┐ ┌───────┐   ┌─────────┐   ┌──────────┐
│ Auth  │ │ User  │   │  Order  │   │ Notify   │
│Service│ │Service│   │ Service │   │ Service  │
└───┬───┘ └───┬───┘   └────┬────┘   └────┬─────┘
    │         │            │              │
    ▼         ▼            ▼              ▼
┌─────────────────┐   ┌──────────┐   ┌─────────┐
│   PostgreSQL    │   │ DynamoDB │   │   SNS   │
│   (Users, Auth) │   │ (Orders) │   │ (Alerts)│
└─────────────────┘   └──────────┘   └─────────┘
```

## Security Model

- **Network**: VPC with public/private subnet separation
- **Authentication**: Cognito + JWT tokens
- **Secrets**: AWS Secrets Manager for credentials
- **IAM**: Least-privilege roles for each service
- **Encryption**: S3/RDS encryption at rest, TLS in transit

## Free Tier Compliance

All resources are configured to stay within AWS Free Tier:
- ECS Fargate: 750 hours/month (we use ~300)
- RDS t3.micro: 750 hours/month
- DynamoDB: 25GB, 25 WCU/RCU
- S3: 5GB storage
- Lambda: 1M requests/month
