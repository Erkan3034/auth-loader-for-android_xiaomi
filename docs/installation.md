# Installation Guide

This guide will help you set up the Xiaomi Device Unlock System on your local machine.

## Prerequisites

### System Requirements

- **Operating System**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 18.04+)
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: 2GB free space
- **Network**: Internet connection for package downloads

### Software Requirements

#### For Server
- **Node.js**: Version 16.0 or higher
- **npm**: Version 8.0 or higher (comes with Node.js)
- **PostgreSQL**: Version 12.0 or higher

#### For Client
- **Python**: Version 3.8 or higher
- **pip**: Python package installer
- **USB Drivers**: Device-specific USB drivers

## Server Installation

### Step 1: Install Node.js and npm

#### Windows
1. Download Node.js from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the setup wizard
3. Verify installation:
   ```cmd
   node --version
   npm --version
   ```

#### macOS
```bash
# Using Homebrew
brew install node

# Or download from nodejs.org
```

#### Linux (Ubuntu/Debian)
```bash
# Using NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 2: Install PostgreSQL

#### Windows
1. Download PostgreSQL from [postgresql.org](https://www.postgresql.org/download/)
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Ensure PostgreSQL service is running

#### macOS
```bash
# Using Homebrew
brew install postgresql
brew services start postgresql

# Create a database user
createuser -s postgres
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE xiaomi_unlock;
CREATE USER xiaomi_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE xiaomi_unlock TO xiaomi_user;
\q
```

### Step 3: Setup Server

1. **Navigate to server directory:**
   ```bash
   cd xiaomi-project/server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env file with your settings
   nano .env  # or use your preferred editor
   ```

4. **Update .env file:**
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=xiaomi_unlock
   DB_USER=xiaomi_user
   DB_PASSWORD=your_database_password

   # Security Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
   HMAC_SECRET=your_hmac_secret_key_here_change_in_production
   AUTH_KEY_EXPIRY=300

   # API Configuration
   API_VERSION=v1
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Logging
   LOG_LEVEL=info
   LOG_FILE=logs/server.log
   ```

5. **Run database migrations:**
   ```bash
   npm run migrate
   ```

6. **Start the server:**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm start
   ```

7. **Verify server is running:**
   ```bash
   curl http://localhost:3000/health
   ```

## Client Installation

### Step 1: Install Python

#### Windows
1. Download Python from [python.org](https://www.python.org/downloads/)
2. **Important**: Check "Add Python to PATH" during installation
3. Verify installation:
   ```cmd
   python --version
   pip --version
   ```

#### macOS
```bash
# Using Homebrew
brew install python

# Or download from python.org
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Verify installation
python3 --version
pip3 --version
```

### Step 2: Install USB Drivers

#### Windows
1. **Qualcomm EDL Drivers:**
   - Download Qualcomm USB drivers
   - Install in Device Manager when device is connected

2. **MediaTek BROM Drivers:**
   - Download MediaTek USB drivers
   - Install using the provided installer

3. **Generic ADB/Fastboot Drivers:**
   - Install Android SDK Platform Tools
   - Or use universal ADB drivers

#### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Android platform tools
brew install android-platform-tools
```

#### Linux
```bash
# Install ADB and Fastboot
sudo apt install android-tools-adb android-tools-fastboot

# Add udev rules for device access
sudo wget -O /etc/udev/rules.d/51-android.rules https://raw.githubusercontent.com/M0Rf30/android-udev-rules/master/51-android.rules
sudo chmod a+r /etc/udev/rules.d/51-android.rules
sudo udevadm control --reload-rules
```

### Step 3: Setup Client

1. **Navigate to client directory:**
   ```bash
   cd xiaomi-project/client
   ```

2. **Create virtual environment (recommended):**
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure client:**
   ```bash
   # Copy default configuration
   cp config.json config.json.backup
   
   # Edit configuration
   nano config.json  # or use your preferred editor
   ```

5. **Update config.json:**
   ```json
   {
     "server": {
       "url": "http://localhost:3000",
       "timeout": 30
     },
     "client": {
       "id": "your-unique-client-id",
       "hmac_secret": "same_secret_as_server"
     }
   }
   ```

6. **Test client installation:**
   ```bash
   python main.py --help
   ```

## Verification

### Test Server
```bash
cd server
npm test
# or
node test_server.js
```

### Test Client
```bash
cd client
python test_client.py
```

### Test Integration
1. Start the server:
   ```bash
   cd server
   npm start
   ```

2. In another terminal, test client:
   ```bash
   cd client
   python main.py --detect
   ```

## Troubleshooting

### Common Server Issues

#### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# Kill the process
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                 # macOS/Linux
```

#### Database Connection Failed
1. Verify PostgreSQL is running
2. Check database credentials in `.env`
3. Ensure database exists and user has permissions

#### Permission Denied
```bash
# Linux/macOS: Fix file permissions
chmod +x server/migrations/init.js
chown -R $USER:$USER server/logs/
```

### Common Client Issues

#### Python Module Not Found
```bash
# Ensure virtual environment is activated
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall requirements
pip install --upgrade -r requirements.txt
```

#### USB Device Not Detected
1. **Check USB drivers are installed**
2. **Try different USB ports**
3. **Enable Developer Options on Android device**
4. **Check device is in correct mode (EDL/BROM/Fastboot)**

#### Permission Denied (Linux)
```bash
# Add user to dialout group for serial port access
sudo usermod -a -G dialout $USER

# Add udev rules for USB devices
sudo cp 99-android.rules /etc/udev/rules.d/
sudo udevadm control --reload-rules
```

### Connection Issues

#### Server Not Reachable
1. Check server is running: `curl http://localhost:3000/health`
2. Verify firewall settings
3. Check network configuration

#### HMAC Authentication Failed
1. Ensure both server and client use the same `HMAC_SECRET`
2. Check system time is synchronized
3. Verify client ID matches configuration

## Production Deployment

### Server Production Setup

1. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start src/app.js --name xiaomi-server
   pm2 startup
   pm2 save
   ```

2. **Setup reverse proxy (Nginx):**
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
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **SSL Certificate (Let's Encrypt):**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

4. **Environment variables:**
   ```bash
   export NODE_ENV=production
   export DB_SSL=true
   export LOG_LEVEL=warn
   ```

### Security Considerations

1. **Change default secrets:**
   - Generate strong `JWT_SECRET` and `HMAC_SECRET`
   - Use different secrets for each environment

2. **Database security:**
   - Use SSL connections in production
   - Limit database user permissions
   - Regular backups

3. **Network security:**
   - Use HTTPS in production
   - Configure firewall rules
   - Implement rate limiting

4. **Monitoring:**
   - Set up log monitoring
   - Monitor server resources
   - Set up alerts for failures

## Next Steps

1. **Read the [API Documentation](api.md)**
2. **Check out [Usage Examples](examples.md)**
3. **Review [Security Guidelines](security.md)**
4. **Join our [Community Forum](https://github.com/your-repo/discussions)**

## Support

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search [existing issues](https://github.com/your-repo/issues)
3. Create a [new issue](https://github.com/your-repo/issues/new) with:
   - System information
   - Error messages
   - Steps to reproduce
   - Log files (remove sensitive information)

## License

This project is for educational and research purposes only. Please ensure you comply with local laws and device warranties when using this software.
