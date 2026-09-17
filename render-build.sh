#!/bin/bash
set -euo pipefail

echo "==> Installing dependencies..."
npm install

echo "==> Generating Prisma client..."
./node_modules/.bin/prisma generate

echo "==> Pushing database schema..."
./node_modules/.bin/prisma db push --skip-generate

echo "==> Building Next.js..."
npm run build

echo "==> Build complete!"
