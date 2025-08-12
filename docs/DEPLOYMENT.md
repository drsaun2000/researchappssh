# Deployment Guide

This guide covers deploying the PhysioHub Research Platform on Ubuntu servers.

## Prerequisites

- Ubuntu 20.04 LTS or higher
- Root or sudo access
- Domain name (for SSL setup)
- At least 2GB RAM and 20GB disk space

## Automated Ubuntu Setup

The easiest way to deploy is using our automated setup script:

\`\`\`bash
# Download and run the setup script
wget https://raw.githubusercontent.com/your-org/physiohub-research/main/deploy/ubuntu-setup.sh
chmod +x ubuntu-setup.sh
./ubuntu-setup.sh
\`\`\`

This script will:
- Update system packages
- Install Node.js 18.x
- Install PM2 process manager
- Install Nginx web server
- Install PostgreSQL (optional)
- Install Redis (optional)
- Install Certbot for SSL certificates
- Create application directories
- Set up systemd service

## Manual Setup

If you prefer manual setup or need customization:

### 1. System Updates

\`\`\`bash
sudo apt update && sudo apt upgrade -y
\`\`\`

### 2. Install Node.js

\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

### 3. Install PM2

\`\`\`bash
sudo npm install -g pm2
\`\`\`

### 4. Install Nginx

\`\`\`bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
\`\`\`

### 5. Install Database (Optional)

**PostgreSQL:**
\`\`\`bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE physiohub;
CREATE USER physiohub_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE physiohub TO physiohub_user;
\q
\`\`\`

**Redis:**
\`\`\`bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
\`\`\`

## Application Deployment

### 1. Create Application Directory

\`\`\`bash
sudo mkdir -p /var/www/physiohub
sudo chown -R $USER:$USER /var/www/physiohub
\`\`\`

### 2. Clone and Build Application

\`\`\`bash
cd /var/www/physiohub
git clone https://github.com/your-org/physiohub-research.git .
npm ci --only=production
npm run build
\`\`\`

### 3. Configure Environment

\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
nano .env
\`\`\`

### 4. Start with PM2

\`\`\`bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

## Nginx Configuration

### 1. Create Nginx Configuration

\`\`\`bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/physiohub
sudo ln -s /etc/nginx/sites-available/physiohub /etc/nginx/sites-enabled/
\`\`\`

### 2. Update Domain Name

\`\`\`bash
sudo sed -i 's/your-domain.com/yourdomain.com/g' /etc/nginx/sites-available/physiohub
\`\`\`

### 3. Test and Restart Nginx

\`\`\`bash
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

## SSL Certificate Setup

### Automatic SSL with Let's Encrypt

\`\`\`bash
chmod +x deploy/ssl-setup.sh
./deploy/ssl-setup.sh yourdomain.com
\`\`\`

### Manual SSL Setup

\`\`\`bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
\`\`\`

## Monitoring Setup

### 1. Install Monitoring Tools

\`\`\`bash
chmod +x deploy/monitor-setup.sh
./deploy/monitor-setup.sh
\`\`\`

### 2. Configure Log Rotation

The monitoring script automatically sets up log rotation for:
- Application logs (`/var/log/physiohub/`)
- Nginx logs (`/var/log/nginx/`)

### 3. Set Up Health Monitoring

The monitoring script creates:
- Health check script (`/usr/local/bin/physiohub-monitor`)
- System stats script (`/usr/local/bin/physiohub-stats`)
- Automated monitoring cron job (runs every 5 minutes)

## Firewall Configuration

\`\`\`bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
\`\`\`

## Database Setup

### 1. Run Migrations

\`\`\`bash
cd /var/www/physiohub
npm run db:migrate
\`\`\`

### 2. Seed Database (Optional)

\`\`\`bash
npm run db:seed
\`\`\`

## Backup Strategy

### 1. Database Backup

\`\`\`bash
# Create backup script
sudo tee /usr/local/bin/backup-physiohub > /dev/null <<'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/physiohub"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U physiohub_user -h localhost physiohub > $BACKUP_DIR/db_backup_$DATE.sql

# Backup application files
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www/physiohub .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /usr/local/bin/backup-physiohub
\`\`\`

### 2. Schedule Backups

\`\`\`bash
# Add to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-physiohub") | crontab -
\`\`\`

## Performance Tuning

### 1. PM2 Optimization

\`\`\`bash
# Use cluster mode for better performance
pm2 delete all
pm2 start ecosystem.config.js
\`\`\`

### 2. Nginx Optimization

Add to `/etc/nginx/nginx.conf`:

```nginx
worker_processes auto;
worker_connections 1024;

gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_comp_level 6;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

client_max_body_size 10M;
