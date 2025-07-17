#!/bin/bash
set -e

echo "🔧 Building remark-kbd-plus..."

# Update version based on git tags
echo "📦 Updating version..."
npm run version

# Run linting
echo "🔍 Running linter..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm test

# Build the distribution
echo "🏗️ Building distribution..."
npm run prepare

echo "✅ Build completed successfully!"