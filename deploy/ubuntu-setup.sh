#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 PhysioHub Research Platform - Ubuntu Deployment Setup${NC}"
echo "================================================================"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}❌ This script should not be run as root${NC}"
   exit 1
fi

# Update system packages
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo -e "${YELLOW}📦 Installing Node.js 18.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
sudo apt install -y nginx

# Install PostgreSQL (if needed)
read -p "Do you want to install PostgreSQL? (y/n): " install_postgres
if [[ $install_postgres == "y" ]]; then
    echo -e "${YELLOW}📦 Installing PostgreSQL...${NC}"
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Install Redis (if needed)
read -p "Do you want to install Redis? (y/n): " install_redis
if [[ $install_redis == "y" ]]; then
    echo -e "${YELLOW}📦 Installing Redis...${NC}"
    sudo apt install -y redis-server
    sudo systemctl start redis-server
    sudo systemctl enable redis-server
fi

# Install SSL certificates with Let's Encrypt
read -p "Do you want to install Certbot for SSL certificates? (y/n): " install_certbot
if [[ $install_certbot == "y" ]]; then
    echo -e "${YELLOW}🔒 Installing Certbot...${NC}"
    sudo apt install -y certbot python3-certbot-nginx
fi

# Create application directory
echo -e "${YELLOW}📁 Creating application directory...${NC}"
sudo mkdir -p /var/www/physiohub
sudo chown -R $USER:$USER /var/www/physiohub

# Create logs directory
sudo mkdir -p /var/log/physiohub
sudo chown -R $USER:$USER /var/log/physiohub

# Create systemd service
echo -e "${YELLOW}⚙️ Creating systemd service...${NC}"
sudo tee /etc/systemd/system/physiohub.service > /dev/null <<EOF
[Unit]
Description=PhysioHub Research Platform
After=network.target

[Service]
Type=forking
User=$USER
WorkingDirectory=/var/www/physiohub
ExecStart=/usr/bin/pm2 start ecosystem.config.js --no-daemon
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable physiohub

echo -e "${GREEN}✅ Ubuntu setup completed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Copy your application files to /var/www/physiohub"
echo "2. Run the deployment script: ./deploy/deploy.sh"
echo "3. Configure Nginx with: sudo cp deploy/nginx.conf /etc/nginx/sites-available/physiohub"
echo "4. Enable the site: sudo ln -s /etc/nginx/sites-available/physiohub /etc/nginx/sites-enabled/"
echo "5. Test Nginx config: sudo nginx -t"
echo "6. Restart Nginx: sudo systemctl restart nginx"
