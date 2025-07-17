#!/bin/bash
set -e

echo "🚀 Preparing release for remark-kbd-plus..."

# Check if we're on a clean git state
if [ -n "$(git status --porcelain)" ]; then
    echo "❌ Working directory is not clean. Please commit or stash changes first."
    exit 1
fi

# Run build process
echo "🔧 Running build process..."
bash "$(dirname "$0")/build.sh"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "📦 Current version: $CURRENT_VERSION"

# Check if this is a dev version
if [[ "$CURRENT_VERSION" == *"-dev"* ]]; then
    echo "⚠️  This is a development version. To create a release:"
    echo "   1. Create and push a git tag: git tag v1.0.0 && git push origin v1.0.0"
    echo "   2. Run this script again"
    exit 1
fi

# Create tarball for distribution
echo "📦 Creating distribution tarball..."
npm pack

TARBALL="remark-kbd-plus-${CURRENT_VERSION}.tgz"
echo "✅ Release package created: $TARBALL"

echo ""
echo "🎉 Release preparation complete!"
echo "To publish to npm: npm publish $TARBALL"
echo "To test locally: npm install -g $TARBALL"