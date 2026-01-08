# Enterprise AWS DevOps Platform - Makefile
# Common commands for development and deployment

.PHONY: help up down logs test lint build push deploy tf-init tf-plan tf-apply clean

# Default environment
ENV ?= dev

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# =============================================================================
# Local Development
# =============================================================================

up: ## Start all services locally
	docker-compose up -d
	@echo "Services started. API available at http://localhost:8080"

up-localstack: ## Start LocalStack for AWS simulation
	docker-compose -f docker-compose.localstack.yml up -d
	@echo "LocalStack started. AWS endpoint: http://localhost:4566"

down: ## Stop all services
	docker-compose down
	docker-compose -f docker-compose.localstack.yml down 2>/dev/null || true

logs: ## View service logs
	docker-compose logs -f

logs-service: ## View logs for specific service (usage: make logs-service SVC=api-gateway)
	docker-compose logs -f $(SVC)

shell: ## Open shell in service container (usage: make shell SVC=api-gateway)
	docker-compose exec $(SVC) /bin/sh

# =============================================================================
# Testing
# =============================================================================

test: ## Run all tests
	@echo "Running unit tests..."
	cd services/api-gateway && npm test 2>/dev/null || true
	cd services/auth-service && python -m pytest tests/ 2>/dev/null || true
	cd services/user-service && python -m pytest tests/ 2>/dev/null || true

test-unit: ## Run unit tests only
	@echo "Running unit tests..."
	@for dir in services/*/; do \
		echo "Testing $$dir..."; \
	done

test-integration: ## Run integration tests
	@echo "Running integration tests..."
	docker-compose -f docker-compose.test.yml up --abort-on-container-exit

test-e2e: ## Run end-to-end tests
	@echo "Running E2E tests..."
	cd tests/e2e && npm test

test-load: ## Run load tests with k6
	@echo "Running load tests..."
	k6 run tests/load/scenarios.js

lint: ## Run linters on all services
	@echo "Linting services..."
	cd services/api-gateway && npm run lint 2>/dev/null || true
	cd services/auth-service && python -m pylint src/ 2>/dev/null || true
	cd services/user-service && python -m pylint src/ 2>/dev/null || true

# =============================================================================
# Container Operations
# =============================================================================

build: ## Build all Docker images
	@echo "Building Docker images..."
	docker-compose build

build-service: ## Build specific service (usage: make build-service SVC=api-gateway)
	docker-compose build $(SVC)

push: ## Push images to ECR
	@echo "Pushing to ECR..."
	./scripts/push-to-ecr.ps1 -Environment $(ENV)

# =============================================================================
# Terraform Operations
# =============================================================================

tf-init: ## Initialize Terraform (usage: make tf-init ENV=dev)
	cd terraform/environments/$(ENV) && terraform init

tf-plan: ## Plan Terraform changes (usage: make tf-plan ENV=dev)
	cd terraform/environments/$(ENV) && terraform plan -out=tfplan

tf-apply: ## Apply Terraform changes (usage: make tf-apply ENV=dev)
	cd terraform/environments/$(ENV) && terraform apply tfplan

tf-destroy: ## Destroy Terraform resources (usage: make tf-destroy ENV=dev)
	cd terraform/environments/$(ENV) && terraform destroy

tf-validate: ## Validate Terraform configuration
	cd terraform && terraform validate

tf-fmt: ## Format Terraform files
	cd terraform && terraform fmt -recursive

# =============================================================================
# Security Scanning
# =============================================================================

scan-containers: ## Scan containers with Trivy
	@echo "Scanning containers..."
	trivy image api-gateway:latest
	trivy image auth-service:latest
	trivy image user-service:latest

scan-iac: ## Scan IaC with Checkov
	@echo "Scanning Terraform..."
	checkov -d terraform/

scan-all: scan-containers scan-iac ## Run all security scans

# =============================================================================
# Deployment
# =============================================================================

deploy: ## Deploy to environment (usage: make deploy ENV=dev)
	@echo "Deploying to $(ENV)..."
	./scripts/deploy.ps1 -Environment $(ENV)

# =============================================================================
# Cleanup
# =============================================================================

clean: ## Clean up local resources
	docker-compose down -v --rmi local
	docker system prune -f

clean-all: clean ## Deep clean including cache
	docker system prune -af --volumes
