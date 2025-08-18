# 🚀 Xiaomi Unlock System - Production Deployment Guide

## 📋 Prerequisites

### System Requirements
- **OS:** Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **CPU:** 2+ cores (4+ recommended)
- **RAM:** 4GB minimum (8GB+ recommended)
- **Storage:** 50GB+ SSD
- **Network:** Static IP, Domain name configured

### Software Requirements
- **Node.js:** 18.x LTS
- **PostgreSQL:** 13+
- **Redis:** 6+
- **Nginx:** 1.18+
- **PM2:** Latest
- **Docker & Docker Compose:** Latest (if using containers)

## 🔧 Pre-Deployment Setup

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git nginx postgresql postgresql-contrib redis-server ufw fail2ban

# Create application user
sudo useradd -m -s /bin/bash xiaomi
sudo usermod -aG sudo xiaomi
```

### 2. Security Hardening
```bash
# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Configure fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Database Setup
```bash
# Configure PostgreSQL
sudo -u postgres createuser xiaomi_user
sudo -u postgres createdb xiaomi_unlock_prod -O xiaomi_user
sudo -u postgres psql -c "ALTER USER xiaomi_user PASSWORD 'STRONG_PASSWORD_HERE';"

# Enable and start PostgreSQL
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 4. Redis Configuration
```bash
# Configure Redis
sudo sed -i 's/# requirepass foobared/requirepass STRONG_REDIS_PASSWORD/' /etc/redis/redis.conf
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## 🚀 Deployment Methods

### Method 1: Docker Deployment (Recommended)

#### 1. Clone Repository
```bash
git clone https://github.com/yourusername/xiaomi-unlock-server.git
cd xiaomi-unlock-server
```

#### 2. Environment Configuration
```bash
# Copy and configure environment variables
cp .env.example .env
nano .env

# Set strong passwords and secrets
DB_PASSWORD=your_strong_db_password
REDIS_PASSWORD=your_strong_redis_password
JWT_SECRET=your_64_character_jwt_secret
HMAC_SECRET=your_64_character_hmac_secret
GRAFANA_PASSWORD=your_grafana_password
```

#### 3. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p ssl

# Option 1: Let's Encrypt (Recommended)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/certificate.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/private.key

# Option 2: Self-signed (Development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt
```

#### 4. Deploy with Docker Compose
```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f server
```

### Method 2: Traditional Deployment

#### 1. Install Node.js
```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2
```

#### 2. Application Setup
```bash
# Clone and setup application
git clone https://github.com/yourusername/xiaomi-unlock-server.git /var/www/xiaomi-unlock-server
cd /var/www/xiaomi-unlock-server/server

# Install dependencies
npm ci --only=production

# Configure environment
cp env.production .env
nano .env
# Configure all environment variables

# Run database migrations
npm run migrate:prod

# Start application with PM2
npm run prod
```

#### 3. Nginx Configuration
```bash
# Copy nginx configuration
sudo cp nginx/nginx.conf /etc/nginx/nginx.conf
sudo cp nginx/conf.d/xiaomi-unlock.conf /etc/nginx/sites-available/xiaomi-unlock
sudo ln -s /etc/nginx/sites-available/xiaomi-unlock /etc/nginx/sites-enabled/

# Test and reload nginx
sudo nginx -t
sudo systemctl reload nginx
```

## 🔐 Security Configuration

### 1. Environment Variables (CRITICAL)
```bash
# Generate strong secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Set in .env file
JWT_SECRET=your_generated_64_character_secret
HMAC_SECRET=your_generated_64_character_secret
DB_PASSWORD=your_strong_database_password
REDIS_PASSWORD=your_strong_redis_password
```

### 2. Database Security
```bash
# PostgreSQL security
sudo nano /etc/postgresql/13/main/postgresql.conf
# Set: listen_addresses = 'localhost'

sudo nano /etc/postgresql/13/main/pg_hba.conf
# Ensure only local connections allowed
```

### 3. File Permissions
```bash
# Set proper file permissions
sudo chown -R xiaomi:xiaomi /var/www/xiaomi-unlock-server
sudo chmod -R 755 /var/www/xiaomi-unlock-server
sudo chmod 600 /var/www/xiaomi-unlock-server/server/.env
```

## 📊 Monitoring & Maintenance

### 1. Health Checks
```bash
# Application health
curl -f http://localhost:3000/health

# PM2 status
pm2 status

# System resources
htop
df -h
```

### 2. Log Management
```bash
# Application logs
pm2 logs

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u xiaomi-unlock-server -f
```

### 3. Backup Strategy
```bash
# Database backup
pg_dump -U xiaomi_user -h localhost xiaomi_unlock_prod > backup_$(date +%Y%m%d).sql

# Application backup
tar -czf app_backup_$(date +%Y%m%d).tar.gz /var/www/xiaomi-unlock-server

# Automated backup script
#!/bin/bash
# Add to crontab: 0 2 * * * /path/to/backup_script.sh
```

### 4. Update Procedure
```bash
# 1. Backup current version
cp -r /var/www/xiaomi-unlock-server /var/www/xiaomi-unlock-server.backup

# 2. Pull updates
cd /var/www/xiaomi-unlock-server
git pull origin main

# 3. Install dependencies
cd server
npm ci --only=production

# 4. Run migrations
npm run migrate:prod

# 5. Restart application
pm2 reload ecosystem.config.js
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check logs
pm2 logs xiaomi-unlock-server

# Check environment
cat .env

# Check database connection
psql -U xiaomi_user -h localhost -d xiaomi_unlock_prod -c "SELECT NOW();"
```

#### 2. High Memory Usage
```bash
# Check PM2 memory usage
pm2 monit

# Restart if needed
pm2 restart xiaomi-unlock-server
```

#### 3. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connections
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
```

#### 4. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/certificate.crt -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew
```

## 📈 Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_devices_client_id ON devices(client_id);
CREATE INDEX CONCURRENTLY idx_unlock_operations_device_id ON unlock_operations(device_id);
CREATE INDEX CONCURRENTLY idx_unlock_operations_created_at ON unlock_operations(created_at);
```

### 2. Nginx Optimization
```nginx
# Add to nginx.conf
worker_processes auto;
worker_connections 4096;
keepalive_timeout 65;
client_max_body_size 10m;
```

### 3. PM2 Optimization
```javascript
// In ecosystem.config.js
instances: 'max', // Use all CPU cores
max_memory_restart: '1G',
node_args: '--max-old-space-size=1024'
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v0.1.5
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/xiaomi-unlock-server
            git pull origin main
            cd server
            npm ci --only=production
            npm run migrate:prod
            pm2 reload ecosystem.config.js
```

## 📞 Support & Maintenance

### Regular Maintenance Tasks
- [ ] Weekly security updates
- [ ] Monthly dependency updates
- [ ] Quarterly security audits
- [ ] Database maintenance and optimization
- [ ] Log rotation and cleanup
- [ ] SSL certificate renewal
- [ ] Backup verification

### Monitoring Checklist
- [ ] Application uptime
- [ ] Response times
- [ ] Error rates
- [ ] Database performance
- [ ] Disk usage
- [ ] Memory usage
- [ ] CPU usage
- [ ] SSL certificate expiry

---

## 🆘 Emergency Contacts

**System Administrator:** your-email@domain.com  
**Database Administrator:** dba@domain.com  
**Security Team:** security@domain.com  

**Emergency Hotline:** +1-XXX-XXX-XXXX
