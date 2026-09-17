terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "hsbc-terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region
}

# ─── Variables ────────────────────────────────────────────────────────────────

variable "aws_region" {
  default = "us-east-1"
}

variable "project_name" {
  default = "hsbc"
}

variable "environment" {
  default = "prod"
}

variable "db_password" {
  sensitive = true
}

variable "jwt_secret" {
  sensitive = true
}

variable "openai_api_key" {
  sensitive = true
}

# ─── VPC ──────────────────────────────────────────────────────────────────────

module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
}

# ─── Security Groups ──────────────────────────────────────────────────────────

module "security" {
  source = "./modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc.vpc_id
}

# ─── RDS ──────────────────────────────────────────────────────────────────────

module "rds" {
  source = "./modules/rds"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  subnet_ids         = module.vpc.private_subnet_ids
  security_group_id  = module.security.rds_security_group_id
  db_password        = var.db_password
  instance_class     = "db.t4g.medium"
  allocated_storage  = 20
}

# ─── S3 ───────────────────────────────────────────────────────────────────────

module "s3" {
  source = "./modules/s3"

  project_name = var.project_name
  environment  = var.environment
}

# ─── ECS ──────────────────────────────────────────────────────────────────────

module "ecs" {
  source = "./modules/ecs"

  project_name       = var.project_name
  environment        = var.environment
  vpc_id             = module.vpc.vpc_id
  public_subnet_ids  = module.vpc.public_subnet_ids
  private_subnet_ids = module.vpc.private_subnet_ids
  alb_security_group_id = module.security.alb_security_group_id
  ecs_security_group_id = module.security.ecs_security_group_id
  db_endpoint        = module.rds.endpoint
  db_name            = module.rds.db_name
  db_password        = var.db_password
  jwt_secret         = var.jwt_secret
  openai_api_key     = var.openai_api_key
  s3_bucket_name     = module.s3.bucket_name
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "alb_dns_name" {
  value = module ecs.alb_dns_name
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "rds_endpoint" {
  value = module.rds.endpoint
  sensitive = true
}

output "s3_bucket_name" {
  value = module.s3.bucket_name
}
