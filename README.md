# GameSwipe

> Aplicação de descoberta de jogos estilo Tinder, com infraestrutura completa na AWS

[![React](https://img.shields.io/badge/React-18.2-61dafb?logo=react)](https://react.dev)
[![Terraform](https://img.shields.io/badge/Terraform-1.0+-7b42bc?logo=terraform)](https://terraform.io)
[![AWS](https://img.shields.io/badge/AWS-Cloud-ff9900?logo=amazon-aws)](https://aws.amazon.com)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?logo=docker)](https://docker.com)

## Sobre o Projeto

GameSwipe é uma aplicação web para descoberta de jogos. O usuário pode "swipar" para direita (curtir) ou esquerda (passar) em cards de jogos, criando uma lista de jogos para jogar depois.

O foco principal deste projeto é demonstrar práticas de **DevOps modernas**: infraestrutura como código, CI/CD multi-ambiente, monitoramento e containerização.

### Preview

- **Produção:** https://d1os8kgh3lqb33.cloudfront.net
- **Staging:** https://dpx34hhrgvpq3.cloudfront.net

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CloudFront CDN                          │
│                    (HTTPS, Cache, Edge Locations)               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                           S3 Bucket                             │
│                    (Static Website Hosting)                     │
└─────────────────────────────────────────────────────────────────┘
                                  │
       ┌──────────────────────────┼──────────────────────────┐
       ▼                          ▼                          ▼
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│   RAWG API  │           │  Supabase   │           │ CloudWatch  │
│  (Games DB) │           │ (Auth + DB) │           │ (Monitoring)│
└─────────────┘           └─────────────┘           └─────────────┘
```

## Stack Técnica

### Frontend
- React 18 + Vite
- Framer Motion (animações)
- Supabase (autenticação + banco de dados)

### Infraestrutura AWS
- **S3** - Hospedagem de arquivos estáticos
- **CloudFront** - CDN com SSL/TLS automático
- **CloudWatch** - Dashboard de métricas e alertas
- **SNS** - Notificações por email
- **ECR** - Repositório de imagens Docker (preparado)
- **ECS Fargate** - Orquestração de containers (preparado)

### DevOps
- **Terraform** - Infraestrutura como código
- **GitHub Actions** - CI/CD automatizado
- **Docker** - Containerização

## Funcionalidades

- Swipe em cards de jogos (direita = curtir, esquerda = passar)
- Login com Google OAuth
- Filtros por gênero
- Lista de jogos salvos persistente
- Modal com detalhes do jogo

## Estrutura do Projeto

```
├── .github/workflows/       # Pipelines CI/CD
│   ├── deploy-staging.yml   # Deploy automático (develop → staging)
│   ├── deploy-production.yml# Deploy com aprovação (main → prod)
│   └── deploy-ecs.yml       # Deploy para ECS (opcional)
├── terraform/               # Infraestrutura AWS
│   ├── main.tf              # Provider e configuração
│   ├── s3.tf                # Bucket de produção
│   ├── cloudfront.tf        # CDN
│   ├── staging.tf           # Ambiente de staging
│   ├── monitoring.tf        # CloudWatch + Alertas
│   └── ecs.tf               # ECS Fargate (demo)
├── src/                     # Código fonte React
├── Dockerfile               # Build multi-stage
├── nginx.conf               # Configuração do servidor
└── package.json
```

## Instalação Local

```bash
# Clonar repositório
git clone https://github.com/VictorBarelli/AWS-DevOps.git
cd AWS-DevOps

# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev
```

## Deploy

### Pré-requisitos
- AWS CLI configurado
- Terraform instalado
- Credenciais AWS com permissões necessárias

### Infraestrutura

```bash
cd terraform
terraform init
terraform plan
terraform apply
```

### CI/CD

O deploy é automatizado via GitHub Actions:

| Branch | Ambiente | Aprovação |
|--------|----------|-----------|
| `develop` | Staging | Automático |
| `main` | Produção | Manual |

## Monitoramento

Dashboard CloudWatch com métricas:
- Requests por minuto
- Taxa de erros 4xx/5xx
- Cache hit rate
- Bytes transferidos

Alertas configurados para:
- Erros 5xx acima de 5%
- Erros 4xx acima de 10%
- Cache hit rate abaixo de 70%
- Picos de tráfego anormais

## Decisões Técnicas

**Por que S3 + CloudFront em vez de ECS?**
Para uma SPA estática, S3 + CloudFront é mais econômico e simples. O setup de ECS está preparado no código para demonstrar conhecimento, mas não é necessário para este tipo de aplicação.

**Por que Terraform em vez de CloudFormation?**
Terraform é agnóstico de cloud e tem uma sintaxe mais limpa. Também é mais usado no mercado.

**Por que GitHub Actions em vez de CodePipeline?**
Integração mais simples com GitHub e documentação mais acessível. CodePipeline seria uma alternativa válida para projetos 100% AWS.

## Licença

MIT
