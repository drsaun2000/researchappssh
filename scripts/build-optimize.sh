#!/bin/bash

set -e

echo "🚀 Starting optimized build process..."

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf .next out dist node_modules/.cache

# Install dependencies with frozen lockfile
echo "📦 Installing dependencies..."
npm ci --prefer-offline --no-audit

# Type checking
echo "🔍 Running type checks..."
npm run type-check

# Linting
echo "🔧 Running linter..."
npm run lint

# Build with optimizations
echo "🏗️ Building application..."
NODE_ENV=production npm run build

# Analyze bundle if requested
if [ "$ANALYZE" = "true" ]; then
  echo "📊 Analyzing bundle..."
  ANALYZE=true npm run build
fi

# Create deployment package
echo "📦 Creating deployment package..."
mkdir -p dist
cp -r .next dist/
cp -r public dist/
cp package.json dist/
cp next.config.mjs dist/

# Generate build info
echo "📝 Generating build info..."
cat > dist/build-info.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "gitCommit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
  "nodeVersion": "$(node --version)",
  "npmVersion": "$(npm --version)"
}
EOF

echo "✅ Build optimization complete!"
echo "📊 Build size:"
du -sh dist/
