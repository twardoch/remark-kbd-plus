#!/bin/bash
set -e

echo "🔧 Installing remark-kbd-plus locally for development..."

# Build the package
echo "📦 Building package..."
npm run build

# Create a global symlink for local development
echo "🔗 Creating global symlink..."
npm link

echo "✅ Package installed globally!"
echo ""
echo "You can now use 'remark-kbd-plus' in other projects by running:"
echo "  npm link remark-kbd-plus"
echo ""
echo "To uninstall the global link:"
echo "  npm unlink -g remark-kbd-plus"