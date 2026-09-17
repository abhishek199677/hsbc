# ─── S3 Module ───────────────────────────────────────────────────────────────

variable "project_name" { type = string }
variable "environment" { type = string }

locals {
  name = "${var.project_name}-${var.environment}"
}

# ─── Uploads Bucket ──────────────────────────────────────────────────────────

resource "aws_s3_bucket" "uploads" {
  bucket = "${local.name}-uploads"

  tags = {
    Name = "${local.name}-uploads"
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "expire-old-uploads"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }
  }
}

# ─── Static Assets Bucket ────────────────────────────────────────────────────

resource "aws_s3_bucket" "static" {
  bucket = "${local.name}-static"

  tags = {
    Name = "${local.name}-static"
  }
}

resource "aws_s3_bucket_public_access_block" "static" {
  bucket = aws_s3_bucket.static.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "static" {
  bucket = aws_s3_bucket.static.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.static.arn}/*"
      }
    ]
  })
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "bucket_name" {
  value = aws_s3_bucket.uploads.id
}

output "static_bucket_name" {
  value = aws_s3_bucket.static.id
}
