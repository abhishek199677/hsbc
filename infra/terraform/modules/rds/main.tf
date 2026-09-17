# ─── RDS Module ──────────────────────────────────────────────────────────────

variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "security_group_id" { type = string }
variable "db_password" { type = string, sensitive = true }
variable "instance_class" { type = string, default = "db.t4g.medium" }
variable "allocated_storage" { type = number, default = 20 }

locals {
  name   = "${var.project_name}-${var.environment}"
  db_name = replace("${var.project_name}${var.environment}", "-", "")
}

# ─── Subnet Group ────────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${local.name}-db-subnet"
  subnet_ids = var.subnet_ids

  tags = {
    Name = "${local.name}-db-subnet"
  }
}

# ─── RDS Instance ────────────────────────────────────────────────────────────

resource "aws_db_instance" "main" {
  identifier = "${local.name}-db"

  engine         = "postgres"
  engine_version = "16.4"
  instance_class = var.instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = local.db_name
  username = "hsbc_admin"
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [var.security_group_id]

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "Mon:04:00-Mon:05:00"

  skip_final_snapshot       = false
  final_snapshot_identifier = "${local.name}-final-snapshot"
  deletion_protection       = true

  tags = {
    Name = "${local.name}-rds"
  }
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "endpoint" {
  value = aws_db_instance.main.address
}

output "port" {
  value = aws_db_instance.main.port
}

output "db_name" {
  value = aws_db_instance.main.db_name
}
