#!/bin/bash

set -e

echo "🚀 Starting build optimization..."

# Clear previous builds and caches
echo "🧹 Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache
npm cache clean --force

# Install dependencies with production optimizations
echo "📦 Installing optimized dependencies..."
NODE_ENV=production npm ci --only=production --no-audit --no-fund

# Type checking in parallel
echo "🔍 Type checking..."
npm run type-check &
TYPE_CHECK_PID=$!

# Linting in parallel
echo "🔧 Linting..."
npm run lint &
LINT_PID=$!

# Wait for parallel processes
wait $TYPE_CHECK_PID
wait $LINT_PID

# Optimized production build
echo "🏗️ Building for production..."
NODE_ENV=production \
NEXT_TELEMETRY_DISABLED=1 \
npm run build

# Compress static assets
echo "🗜️ Compressing assets..."
find .next/static -name "*.js" -exec gzip -9 -k {} \;
find .next/static -name "*.css" -exec gzip -9 -k {} \;

# Generate build report
echo "📊 Generating build report..."
du -sh .next/ > build-report.txt
echo "Build completed at $(date)" >> build-report.txt

echo "✅ Build optimization completed!"
echo "📈 Build size: $(du -sh .next/ | cut -f1)"
