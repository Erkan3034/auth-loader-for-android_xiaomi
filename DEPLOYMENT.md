# Deployment Guide

This guide covers deployment options for the Xiaomi Device Unlock System.

## Quick Start

### Development Environment

1. **Start PostgreSQL Database:**
   ```bash
   # Using Docker
   docker run --name xiaomi-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:13

   # Or use local installation
   sudo service postgresql start
   ```

2. **Start Server:**
   ```bash
   cd server
   npm install
   cp env.example .env
   # Edit .env with your database credentials
   npm run migrate
   npm run dev
   ```

3. **Start Client:**
   ```bash
   cd client
   pip install -r requirements.txt
   python main.py
   ```

### Testing

1. **Test Server:**
   ```bash
   cd server
   node test_server.js
   ```

2. **Test Client:**
   ```bash
   cd client
   python test_client.py
   ```

## Production Deployment

### Using Docker

1. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:13
       environment:
         POSTGRES_DB: xiaomi_unlock
         POSTGRES_USER: xiaomi_user
         POSTGRES_PASSWORD: secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"

     server:
       build: ./server
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DB_HOST=postgres
         - DB_USER=xiaomi_user
         - DB_PASSWORD=secure_password
         - DB_NAME=xiaomi_unlock
       depends_on:
         - postgres

   volumes:
     postgres_data:
   ```

2. **Deploy:**
   ```bash
   docker-compose up -d
   ```

### Manual Production Setup

1. **Server Setup:**
   ```bash
   # Install PM2 for process management
   npm install -g pm2

   # Start server
   cd server
   npm install --production
   pm2 start src/app.js --name xiaomi-server
   pm2 startup
   pm2 save
   ```

2. **Nginx Configuration:**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **SSL Certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

## Security Checklist

- [ ] Change default HMAC and JWT secrets
- [ ] Use HTTPS in production
- [ ] Configure firewall rules
- [ ] Set up database SSL
- [ ] Enable request rate limiting
- [ ] Configure log rotation
- [ ] Set up monitoring and alerts
- [ ] Regular security updates

## Monitoring

### Health Checks
```bash
# Server health
curl https://your-domain.com/health

# Database connectivity
psql -h localhost -U xiaomi_user -d xiaomi_unlock -c "SELECT 1;"
```

### Log Monitoring
```bash
# Server logs
pm2 logs xiaomi-server

# Database logs
sudo tail -f /var/log/postgresql/postgresql-13-main.log
```

## Troubleshooting

### Common Issues

1. **Port 3000 already in use:**
   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Database connection failed:**
   - Check PostgreSQL is running
   - Verify credentials in .env
   - Check firewall settings

3. **HMAC authentication failed:**
   - Ensure secrets match between server and client
   - Check system time synchronization

## License

This project is for educational and research purposes only.
