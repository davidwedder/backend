#!/bin/bash

# FeAutos API Deployment Script
echo "🚀 Deploying FeAutos API..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npm run prisma:generate

# Run database migrations
echo "🗃️ Running database migrations..."
npm run prisma:migrate:deploy

# Seed database
echo "🌱 Seeding database..."
npm run prisma:seed

# Build the application
echo "🔨 Building application..."
npm run build

echo "✅ API deployment completed!"
echo "🌐 API will be available at the configured port (default: 3001)"