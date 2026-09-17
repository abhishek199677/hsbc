#!/bin/bash
#
# Deploy script for AWS ECS
# Usage: ./infra/scripts/deploy.sh [service] [action]
# Example: ./infra/scripts/deploy.sh frontend deploy
#          ./infra/scripts/deploy.sh all deploy
#          ./infra/scripts/deploy.sh all destroy
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_DIR="$(dirname "$INFRA_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

usage() {
  echo "Usage: $0 [service] [action]"
  echo ""
  echo "Services: frontend, backend, agent, evaluator, ml, all"
  echo "Actions: deploy, destroy, status, logs"
  echo ""
  echo "Examples:"
  echo "  $0 frontend deploy    # Deploy only frontend"
  echo "  $0 all deploy         # Deploy all services"
  echo "  $0 all destroy        # Destroy all infrastructure"
  echo "  $0 all status         # Show status of all services"
  exit 1
}

# ─── Prerequisites Check ──────────────────────────────────────────────────────

check_prerequisites() {
  echo -e "${YELLOW}Checking prerequisites...${NC}"
  
  for cmd in aws terraform docker; do
    if ! command -v $cmd &> /dev/null; then
      echo -e "${RED}Error: $cmd is not installed${NC}"
      exit 1
    fi
  done

  # Check AWS credentials
  if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured. Run 'aws configure'${NC}"
    exit 1
  fi

  echo -e "${GREEN}All prerequisites met${NC}"
}

# ─── Terraform Operations ─────────────────────────────────────────────────────

terraform_init() {
  echo -e "${YELLOW}Initializing Terraform...${NC}"
  cd "$INFRA_DIR/terraform"
  terraform init
  cd "$PROJECT_DIR"
}

terraform_plan() {
  echo -e "${YELLOW}Planning Terraform changes...${NC}"
  cd "$INFRA_DIR/terraform"
  terraform plan -out=tfplan
  cd "$PROJECT_DIR"
}

terraform_apply() {
  echo -e "${YELLOW}Applying Terraform changes...${NC}"
  cd "$INFRA_DIR/terraform"
  terraform apply tfplan
  cd "$PROJECT_DIR"
}

terraform_destroy() {
  echo -e "${RED}Destroying all infrastructure...${NC}"
  read -p "Are you sure? This will delete ALL resources. (yes/no): " confirm
  if [ "$confirm" = "yes" ]; then
    cd "$INFRA_DIR/terraform"
    terraform destroy -auto-approve
    cd "$PROJECT_DIR"
    echo -e "${GREEN}Infrastructure destroyed${NC}"
  else
    echo "Aborted."
  fi
}

# ─── Docker Operations ────────────────────────────────────────────────────────

build_all() {
  echo -e "${YELLOW}Building all Docker images...${NC}"
  cd "$PROJECT_DIR"
  docker compose build
  echo -e "${GREEN}All images built${NC}"
}

push_to_ecr() {
  echo -e "${YELLOW}Pushing images to ECR...${NC}"
  
  AWS_REGION="${AWS_REGION:-us-east-1}"
  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
  
  SERVICES=("frontend" "backend" "agent" "evaluator" "ml")
  
  for service in "${SERVICES[@]}"; do
    REPO_NAME="hsbc-prod-${service}"
    ECR_URL="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"
    
    echo -e "${YELLOW}Pushing ${service}...${NC}"
    
    # Login to ECR
    aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
    
    # Tag
    docker tag "hsbc-${service}:latest" "${ECR_URL}:latest"
    
    # Push
    docker push "${ECR_URL}:latest"
    
    echo -e "${GREEN}Pushed ${service}${NC}"
  done
}

# ─── ECS Operations ───────────────────────────────────────────────────────────

update_ecs_service() {
  local service=$1
  echo -e "${YELLOW}Updating ECS service: ${service}...${NC}"
  
  aws ecs update-service \
    --cluster "hsbc-prod-cluster" \
    --service "hsbc-prod-${service}" \
    --force-new-deployment \
    --region "us-east-1"
  
  echo -e "${GREEN}Service ${service} updated${NC}"
}

update_all_services() {
  SERVICES=("frontend" "backend" "agent" "evaluator" "ml")
  for service in "${SERVICES[@]}"; do
    update_ecs_service "$service"
  done
}

show_status() {
  echo -e "${YELLOW}ECS Service Status:${NC}"
  aws ecs list-services \
    --cluster "hsbc-prod-cluster" \
    --region "us-east-1" \
    --query 'serviceArns[*]'
  
  echo ""
  echo -e "${YELLOW}Running Tasks:${NC}"
  aws ecs list-tasks \
    --cluster "hsbc-prod-cluster" \
    --region "us-east-1" \
    --query 'taskArns[*]'
}

show_logs() {
  local service=${1:-"frontend"}
  echo -e "${YELLOW}Logs for ${service} (last 50 lines):${NC}"
  aws logs get-log-events \
    --log-group-name "/ecs/hsbc-prod-${service}" \
    --log-stream-name "$(aws logs describe-log-streams --log-group-name "/ecs/hsbc-prod-${service}" --order-by LastEventTime --descending --limit 1 --query 'logStreams[0].logStreamName' --output text)" \
    --limit 50 \
    --region "us-east-1" \
    --query 'events[*].message' \
    --output text
}

# ─── Main ──────────────────────────────────────────────────────────────────────

check_prerequisites

SERVICE="${1:-all}"
ACTION="${2:-deploy}"

case "$ACTION" in
  init)
    terraform_init
    ;;
  plan)
    terraform_plan
    ;;
  apply)
    terraform_apply
    ;;
  destroy)
    terraform_destroy
    ;;
  deploy)
    terraform_init
    terraform_plan
    terraform_apply
    build_all
    push_to_ecr
    update_all_services
    echo -e "${GREEN}Deployment complete!${NC}"
    ;;
  status)
    show_status
    ;;
  logs)
    show_logs "$SERVICE"
    ;;
  build)
    build_all
    ;;
  push)
    push_to_ecr
    ;;
  *)
    usage
    ;;
esac
