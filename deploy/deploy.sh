#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="physiohub-research"
APP_DIR="/var/www/physiohub"
BACKUP_DIR="/var/backups/physiohub"
LOG_FILE="/var/log/physiohub/deploy.log"

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Start deployment
log "🚀 Starting deployment of PhysioHub Research Platform"

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    error "Application directory $APP_DIR does not exist. Run ubuntu-setup.sh first."
fi

# Create backup
log "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
if [ -d "$APP_DIR/.next" ]; then
    tar -czf "$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).tar.gz" -C "$APP_DIR" .next package.json || warning "Backup creation failed"
fi

# Stop the application
log "🛑 Stopping application..."
pm2 stop "$APP_NAME" || warning "Application was not running"

# Copy new files
log "📁 Copying application files..."
rsync -av --exclude=node_modules --exclude=.git --exclude=.next . "$APP_DIR/"

# Navigate to app directory
cd "$APP_DIR"

# Install dependencies
log "📦 Installing dependencies..."
npm ci --only=production --prefer-offline --no-audit

# Build application
log "🏗️ Building application..."
npm run build

# Run database migrations (if applicable)
if [ -f "scripts/migrate.js" ]; then
    log "🗄️ Running database migrations..."
    npm run db:migrate || warning "Database migration failed"
fi

# Update PM2 configuration
log "⚙️ Updating PM2 configuration..."
pm2 delete "$APP_NAME" 2>/dev/null || true
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Test application health
log "🔍 Testing application health..."
sleep 10

# Check if application is running
if pm2 list | grep -q "$APP_NAME.*online"; then
    success "✅ Application deployed successfully!"
    
    # Display application info
    echo ""
    echo "=== Deployment Summary ==="
    echo "Application: $APP_NAME"
    echo "Directory: $APP_DIR"
    echo "Status: $(pm2 list | grep "$APP_NAME" | awk '{print $10}')"
    echo "URL: http://localhost:3000"
    echo ""
    
    # Show PM2 status
    pm2 list
    
else
    error "❌ Application failed to start. Check logs with: pm2 logs $APP_NAME"
fi

log "🎉 Deployment completed!"
