#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}📊 Setting up monitoring for PhysioHub Research Platform${NC}"
echo "================================================================"

# Install monitoring tools
echo -e "${YELLOW}📦 Installing monitoring tools...${NC}"
sudo apt update
sudo apt install -y htop iotop nethogs fail2ban logrotate

# Configure fail2ban for security
echo -e "${YELLOW}🔒 Configuring fail2ban...${NC}"
sudo tee /etc/fail2ban/jail.local > /dev/null <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Configure log rotation
echo -e "${YELLOW}📝 Configuring log rotation...${NC}"
sudo tee /etc/logrotate.d/physiohub > /dev/null <<EOF
/var/log/physiohub/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi \
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
EOF

# Create monitoring script
echo -e "${YELLOW}📊 Creating monitoring script...${NC}"
sudo tee /usr/local/bin/physiohub-monitor > /dev/null <<'EOF'
#!/bin/bash

# PhysioHub Monitoring Script
LOG_FILE="/var/log/physiohub/monitor.log"
APP_NAME="physiohub-research"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check if application is running
if ! pm2 list | grep -q "$APP_NAME.*online"; then
    log "ERROR: Application is not running. Attempting restart..."
    pm2 restart "$APP_NAME"
    
    # Wait and check again
    sleep 10
    if pm2 list | grep -q "$APP_NAME.*online"; then
        log "SUCCESS: Application restarted successfully"
    else
        log "CRITICAL: Failed to restart application"
        # Send alert (you can add email/slack notification here)
    fi
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "WARNING: Disk usage is at ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    log "WARNING: Memory usage is at ${MEMORY_USAGE}%"
fi

# Check application response
if ! curl -s -f http://localhost:3000/health > /dev/null; then
    log "ERROR: Application health check failed"
fi

log "INFO: Monitoring check completed"
EOF

sudo chmod +x /usr/local/bin/physiohub-monitor

# Set up monitoring cron job
echo -e "${YELLOW}⏰ Setting up monitoring cron job...${NC}"
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/physiohub-monitor") | crontab -

# Create system stats script
echo -e "${YELLOW}📈 Creating system stats script...${NC}"
sudo tee /usr/local/bin/physiohub-stats > /dev/null <<'EOF'
#!/bin/bash

echo "=== PhysioHub System Statistics ==="
echo "Date: $(date)"
echo ""

echo "=== System Info ==="
echo "Uptime: $(uptime -p)"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo ""

echo "=== Memory Usage ==="
free -h
echo ""

echo "=== Disk Usage ==="
df -h /
echo ""

echo "=== PM2 Status ==="
pm2 list
echo ""

echo "=== Nginx Status ==="
sudo systemctl status nginx --no-pager -l
echo ""

echo "=== Recent Application Logs ==="
tail -20 /var/log/physiohub/out.log
EOF

sudo chmod +x /usr/local/bin/physiohub-stats

echo -e "${GREEN}✅ Monitoring setup completed!${NC}"
echo ""
echo "Available monitoring commands:"
echo "- physiohub-stats: View system statistics"
echo "- pm2 monit: Real-time PM2 monitoring"
echo "- sudo fail2ban-client status: Check fail2ban status"
echo "- tail -f /var/log/physiohub/monitor.log: View monitoring logs"
