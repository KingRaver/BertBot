# BertBot Deployment Guide

**Version:** 0.1.0
**Last Updated:** 2026-01-31

This guide covers production deployment options for BertBot including Docker, systemd, PM2, and reverse proxy configurations.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Docker Deployment](#docker-deployment)
3. [Systemd Service](#systemd-service)
4. [PM2 Process Manager](#pm2-process-manager)
5. [Reverse Proxy Setup](#reverse-proxy-setup)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **OS:** Linux (Ubuntu 20.04+, Debian 11+, RHEL 8+) or macOS Big Sur+
- **Node.js:** 18.0.0 or higher
- **Memory:** Minimum 512MB RAM, recommended 1GB+
- **Disk:** Minimum 1GB free space
- **Network:** Port 3030 (or custom) for WebSocket gateway

### Required Environment Variables

```bash
# At least one AI provider (required)
OPENAI_API_KEY=sk-proj-...
# OR
ANTHROPIC_API_KEY=sk-ant-api03-...
# OR
PERPLEXITY_API_KEY=pplx-...

# Session encryption (highly recommended for production)
SESSION_ENCRYPTION_KEY=$(openssl rand -base64 32)

# Production mode
NODE_ENV=production

# Optional: Messaging platforms
TELEGRAM_BOT_TOKEN=...
DISCORD_BOT_TOKEN=...
```

---

## Docker Deployment

### Option 1: Using Docker Compose (Recommended)

**1. Create Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 bertbot && \
    adduser -D -u 1001 -G bertbot bertbot && \
    chown -R bertbot:bertbot /app

USER bertbot

EXPOSE 3030

CMD ["npm", "start"]
```

**2. Create docker-compose.yml**

```yaml
version: '3.8'

services:
  bertbot:
    build: .
    container_name: bertbot
    restart: unless-stopped
    ports:
      - "3030:3030"
    environment:
      - NODE_ENV=production
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SESSION_ENCRYPTION_KEY=${SESSION_ENCRYPTION_KEY}
      - PORT=3030
    volumes:
      - ./data:/app/data
      - ./workspace:/app/workspace
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3030/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

**3. Deploy**

```bash
# Create .env file with your keys
echo "OPENAI_API_KEY=sk-proj-..." > .env
echo "SESSION_ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env

# Start the service
docker-compose up -d

# View logs
docker-compose logs -f bertbot

# Stop the service
docker-compose down
```

### Option 2: Plain Docker

```bash
# Build image
docker build -t bertbot:latest .

# Run container
docker run -d \
  --name bertbot \
  --restart unless-stopped \
  -p 3030:3030 \
  -e NODE_ENV=production \
  -e OPENAI_API_KEY="sk-proj-..." \
  -e SESSION_ENCRYPTION_KEY="$(openssl rand -base64 32)" \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/workspace:/app/workspace \
  bert bot:latest

# View logs
docker logs -f bertbot
```

---

## Systemd Service

For running BertBot as a native systemd service on Linux.

### 1. Create Service File

Create `/etc/systemd/system/bertbot.service`:

```ini
[Unit]
Description=BertBot AI Agent Gateway
After=network.target

[Service]
Type=simple
User=bertbot
Group=bertbot
WorkingDirectory=/opt/bertbot
Environment="NODE_ENV=production"
EnvironmentFile=/opt/bertbot/.env
ExecStart=/usr/bin/node -r tsconfig-paths/register /opt/bertbot/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=bertbot

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/bertbot/data /opt/bertbot/logs
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true

[Install]
WantedBy=multi-user.target
```

### 2. Setup

```bash
# Create user
sudo useradd -r -s /bin/false bertbot

# Create directories
sudo mkdir -p /opt/bertbot
sudo chown -R bertbot:bertbot /opt/bertbot

# Copy application files
cd /path/to/bertbot
sudo cp -r . /opt/bertbot/
cd /opt/bertbot

# Install dependencies and build
sudo -u bertbot npm ci --only=production
sudo -u bertbot npm run build

# Create .env file
sudo -u bertbot bash -c 'cat > /opt/bertbot/.env << EOF
OPENAI_API_KEY=sk-proj-...
SESSION_ENCRYPTION_KEY=$(openssl rand -base64 32)
NODE_ENV=production
PORT=3030
EOF'

# Set secure permissions
sudo chmod 600 /opt/bertbot/.env
sudo chmod 700 /opt/bertbot/data

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable bertbot
sudo systemctl start bertbot

# Check status
sudo systemctl status bertbot

# View logs
sudo journalctl -u bertbot -f
```

### 3. Management Commands

```bash
# Start service
sudo systemctl start bertbot

# Stop service
sudo systemctl stop bertbot

# Restart service
sudo systemctl restart bertbot

# View status
sudo systemctl status bertbot

# View logs
sudo journalctl -u bertbot -f

# View last 100 lines
sudo journalctl -u bertbot -n 100

# Disable service
sudo systemctl disable bertbot
```

---

## PM2 Process Manager

PM2 is ideal for Node.js process management with built-in monitoring and auto-restart.

### 1. Install PM2

```bash
npm install -g pm2
```

### 2. Create ecosystem.config.js

```javascript
module.exports = {
  apps: [{
    name: 'bertbot',
    script: './dist/index.js',
    node_args: '-r tsconfig-paths/register',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 3030
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3030
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    min_uptime: '10s',
    max_restarts: 10,
    kill_timeout: 5000
  }]
};
```

### 3. Deploy

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the displayed command

# Monitor
pm2 monit

# View logs
pm2 logs bertbot

# Restart
pm2 restart bertbot

# Stop
pm2 stop bertbot

# Delete
pm2 delete bertbot
```

### 4. PM2 Management Commands

```bash
# List all processes
pm2 list

# Monitor processes
pm2 monit

# View logs
pm2 logs bertbot

# Flush logs
pm2 flush

# Reload (zero-downtime restart)
pm2 reload bertbot

# Show detailed info
pm2 show bertbot

# Web dashboard
pm2 plus  # Requires PM2 Plus account
```

---

## Reverse Proxy Setup

### Nginx (Recommended)

**1. Install Nginx**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# RHEL/CentOS
sudo yum install nginx
```

**2. Create Nginx Configuration**

Create `/etc/nginx/sites-available/bertbot`:

```nginx
# WebSocket upgrade configuration
map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=bertbot_limit:10m rate=10r/s;

# Upstream
upstream bertbot {
    server localhost:3030;
    keepalive 64;
}

server {
    listen 80;
    server_name yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # WebSocket proxy
    location / {
        proxy_pass http://bertbot;
        proxy_http_version 1.1;

        # WebSocket headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;

        # Proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;

        # Rate limiting
        limit_req zone=bertbot_limit burst=20 nodelay;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://bertbot/health;
        access_log off;
    }

    # Access and error logs
    access_log /var/log/nginx/bertbot-access.log;
    error_log /var/log/nginx/bertbot-error.log;
}
```

**3. Enable and Test**

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/bertbot /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# View logs
sudo tail -f /var/log/nginx/bertbot-access.log
```

**4. SSL with Let's Encrypt**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (already set up by certbot)
sudo certbot renew --dry-run
```

### Caddy (Simpler Alternative)

**Caddyfile:**

```caddy
yourdomain.com {
    reverse_proxy localhost:3030

    # Automatic HTTPS with Let's Encrypt
    tls your-email@example.com

    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        X-XSS-Protection "1; mode=block"
    }

    # Rate limiting
    rate_limit {
        zone static_zone {
            key {remote_host}
            events 100
            window 1m
        }
    }
}
```

```bash
# Start Caddy
caddy run --config Caddyfile

# Or as service
sudo systemctl enable caddy
sudo systemctl start caddy
```

---

## Security Hardening

### 1. Firewall Configuration

**UFW (Ubuntu):**

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Deny direct access to BertBot port
sudo ufw deny 3030/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

**firewalld (RHEL/CentOS):**

```bash
# Allow HTTP and HTTPS
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https

# Block direct access to BertBot
sudo firewall-cmd --permanent --remove-port=3030/tcp

# Reload
sudo firewall-cmd --reload
```

### 2. File Permissions

```bash
# Application directory
sudo chown -R bertbot:bertbot /opt/bertbot
sudo chmod 750 /opt/bertbot

# Environment file
sudo chmod 600 /opt/bertbot/.env

# Data directory
sudo chmod 700 /opt/bertbot/data

# Session files
sudo chmod 600 /opt/bertbot/data/sessions/*
```

### 3. Fail2Ban Protection

Create `/etc/fail2ban/filter.d/bertbot.conf`:

```ini
[Definition]
failregex = .*Rate limit exceeded.*<HOST>
            .*Security violation.*<HOST>
ignoreregex =
```

Create `/etc/fail2ban/jail.d/bertbot.conf`:

```ini
[bertbot]
enabled = true
port = 80,443
filter = bertbot
logpath = /var/log/nginx/bertbot-access.log
maxretry = 5
ban time = 3600
findtime = 600
```

```bash
# Restart Fail2Ban
sudo systemctl restart fail2ban

# Check status
sudo fail2ban-client status bertbot
```

### 4. Security Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate and set `SESSION_ENCRYPTION_KEY`
- [ ] Configure reverse proxy with TLS/SSL
- [ ] Set restrictive file permissions (600 for .env, 700 for data/)
- [ ] Enable firewall and block direct access to port 3030
- [ ] Configure rate limiting (in Nginx or via `ENABLE_RATE_LIMIT=true`)
- [ ] Set up log rotation
- [ ] Configure Fail2Ban for additional protection
- [ ] Use allowlist for authorized users (`allowlist.json`)
- [ ] Keep dependencies updated (`npm audit`, `npm update`)

---

## Monitoring & Logging

### 1. Log Rotation

**Create `/etc/logrotate.d/bertbot`:**

```
/opt/bertbot/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 bertbot bertbot
    sharedscripts
    postrotate
        systemctl reload bertbot > /dev/null 2>&1 || true
    endscript
}
```

### 2. Health Monitoring

**Simple health check script:**

```bash
#!/bin/bash
# /opt/bertbot/health-check.sh

HEALTH_URL="http://localhost:3030/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ "$RESPONSE" != "200" ]; then
    echo "BertBot health check failed: HTTP $RESPONSE"
    systemctl restart bertbot
    # Send alert (email, Slack, etc.)
fi
```

**Add to crontab:**

```bash
# Edit crontab
crontab -e

# Add health check every 5 minutes
*/5 * * * * /opt/bertbot/health-check.sh
```

### 3. Application Monitoring

**PM2 Monitoring:**

```bash
# Real-time monitoring
pm2 monit

# Web dashboard
pm2 plus
```

**Systemd Journal:**

```bash
# Follow logs
sudo journalctl -u bertbot -f

# Show errors only
sudo journalctl -u bertbot -p err -f

# Export logs
sudo journalctl -u bertbot --since "1 hour ago" > /tmp/bertbot.log
```

### 4. Metrics & Alerts

For production monitoring, consider integrating:

- **Prometheus** - Metrics collection
- **Grafana** - Dashboards and visualization
- **Loki** - Log aggregation
- **Alertmanager** - Alert notifications

---

## Troubleshooting

### Service Won't Start

**Check logs:**

```bash
# Systemd
sudo journalctl -u bertbot -n 50

# PM2
pm2 logs bertbot --lines 50

# Docker
docker logs bertbot
```

**Common issues:**

1. **Missing environment variables**
   ```bash
   # Verify .env file exists and is readable
   cat /opt/bertbot/.env
   ```

2. **Port already in use**
   ```bash
   # Check what's using the port
   sudo lsof -i :3030
   ```

3. **Permission errors**
   ```bash
   # Fix ownership
   sudo chown -R bertbot:bertbot /opt/bertbot
   ```

### High Memory Usage

```bash
# Check memory usage
pm2 monit
# or
docker stats bertbot

# Restart if needed
pm2 restart bertbot --update-env
```

### WebSocket Connection Failures

1. **Check reverse proxy configuration**
   ```bash
   sudo nginx -t
   ```

2. **Verify WebSocket upgrade headers**
   ```bash
   curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:3030
   ```

3. **Check firewall rules**
   ```bash
   sudo ufw status
   ```

### Rate Limiting Issues

```bash
# Check if rate limiting is enabled
grep "ENABLE_RATE_LIMIT" /opt/bertbot/.env

# View rate limit violations in logs
sudo journalctl -u bertbot | grep "Rate limit"
```

---

## Additional Resources

- **Documentation:** [README.md](README.md)
- **API Reference:** [API.md](API.md)
- **Security Audit:** [AUDIT.md](AUDIT.md)
- **Security Policy:** [SECURITY.md](SECURITY.md)
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

---

**Last Updated:** 2026-01-31
**Maintained By:** BertBot Team