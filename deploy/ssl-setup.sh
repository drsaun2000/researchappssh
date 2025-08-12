#!/bin/bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔒 SSL Certificate Setup for PhysioHub Research Platform${NC}"
echo "================================================================"

# Check if domain is provided
if [ -z "$1" ]; then
    echo -e "${RED}❌ Please provide your domain name${NC}"
    echo "Usage: ./ssl-setup.sh your-domain.com"
    exit 1
fi

DOMAIN=$1

# Validate domain format
if [[ ! $DOMAIN =~ ^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$ ]]; then
    echo -e "${RED}❌ Invalid domain format${NC}"
    exit 1
fi

echo -e "${YELLOW}🌐 Setting up SSL for domain: $DOMAIN${NC}"

# Check if Certbot is installed
if ! command -v certbot &> /dev/null; then
    echo -e "${YELLOW}📦 Installing Certbot...${NC}"
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Stop Nginx temporarily
echo -e "${YELLOW}🛑 Stopping Nginx temporarily...${NC}"
sudo systemctl stop nginx

# Obtain SSL certificate
echo -e "${YELLOW}🔒 Obtaining SSL certificate...${NC}"
sudo certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN --email admin@$DOMAIN --agree-tos --no-eff-email

# Update Nginx configuration with SSL
echo -e "${YELLOW}⚙️ Updating Nginx configuration...${NC}"
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/nginx/sites-available/physiohub

# Enable SSL configuration in Nginx
sudo sed -i '/# SSL configuration/,/# }/ s/^# //' /etc/nginx/sites-available/physiohub

# Add HTTP to HTTPS redirect
sudo tee -a /etc/nginx/sites-available/physiohub > /dev/null <<EOF

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
EOF

# Test Nginx configuration
echo -e "${YELLOW}🔍 Testing Nginx configuration...${NC}"
sudo nginx -t

# Start Nginx
echo -e "${YELLOW}🚀 Starting Nginx...${NC}"
sudo systemctl start nginx

# Set up automatic renewal
echo -e "${YELLOW}🔄 Setting up automatic certificate renewal...${NC}"
sudo crontab -l 2>/dev/null | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet --nginx"; } | sudo crontab -

# Test SSL certificate
echo -e "${YELLOW}🔍 Testing SSL certificate...${NC}"
sleep 5
if curl -s -I https://$DOMAIN | grep -q "HTTP/2 200"; then
    echo -e "${GREEN}✅ SSL certificate installed successfully!${NC}"
    echo -e "${GREEN}🌐 Your site is now available at: https://$DOMAIN${NC}"
else
    echo -e "${RED}❌ SSL setup may have issues. Please check manually.${NC}"
fi

echo -e "${GREEN}🎉 SSL setup completed!${NC}"
