# AWS Deployment Guide

## Prerequisites

1. **AWS CLI** installed and configured:
   ```bash
   aws configure
   # Enter: Access Key, Secret Key, Region (us-east-1), Output format (json)
   ```

2. **Terraform** installed:
   ```bash
   brew install terraform  # macOS
   ```

3. **Docker** installed and running

## Quick Start (5 commands)

```bash
# 1. Configure secrets
cp infra/terraform/terraform.tfvars.example infra/terraform/terraform.tfvars
# Edit terraform.tfvars with your values

# 2. Initialize and deploy infrastructure
cd infra/terraform
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# 3. Build and push Docker images
cd ../..
docker compose build
# (Follow ECR login instructions from terraform output)

# 4. Update ECS services
./infra/scripts/deploy.sh all deploy

# 5. Check status
./infra/scripts/deploy.sh all status
```

## Cost Estimate

| Resource | Hourly | Daily | Monthly |
|----------|--------|-------|---------|
| ECS Fargate (5 tasks) | $0.14 | $3.36 | $105 |
| RDS db.t4g.medium | $0.17 | $4.08 | $122 |
| NAT Gateway | $0.045 | $1.08 | $32 |
| ALB | $0.0225 | $0.54 | $16 |
| S3 + CloudWatch | - | $0.30 | $9 |
| **Total** | **~$0.38** | **~$9.36** | **~$284** |

## Shut Down (to stop charges)

```bash
# Option 1: Scale ECS to 0 (keeps database)
aws ecs update-service --cluster hsbc-prod-cluster --service hsbc-prod-frontend --desired-count 0
aws ecs update-service --cluster hsbc-prod-cluster --service hsbc-prod-backend --desired-count 0
# ... repeat for each service

# Option 2: Destroy everything (DELETES database!)
cd infra/terraform
terraform destroy
```

## Useful Commands

```bash
# Check service status
./infra/scripts/deploy.sh all status

# View logs
./infra/scripts/deploy.sh frontend logs
./infra/scripts/deploy.sh backend logs

# Redeploy a single service
./infra/scripts/deploy.sh frontend deploy

# Build images locally
docker compose build

# Run locally
docker compose --env-file .env.deploy up -d
```
