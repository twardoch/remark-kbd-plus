#!/bin/bash
set -e

echo "🧪 Running comprehensive tests for remark-kbd-plus..."

# Run linting
echo "🔍 Running linter..."
npm run lint

# Run tests
echo "🧪 Running unit tests..."
npm test

# Run tests with coverage
echo "📊 Running tests with coverage..."
npm run coverage

echo "✅ All tests completed successfully!"