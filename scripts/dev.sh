#!/bin/bash
set -e

echo "🔄 Development workflow for remark-kbd-plus..."

# Update version (will be dev version)
echo "📦 Updating version..."
npm run version

# Run tests in watch mode if available, otherwise run once
echo "🧪 Running tests..."
if command -v npm run test:watch &> /dev/null; then
    npm run test:watch
else
    npm test
fi