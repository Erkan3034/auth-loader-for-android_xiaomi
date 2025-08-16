# Quick Setup Guide

## 🚨 Installation Issues Fixed

The npm installation error you encountered has been fixed. Here's the quick setup:

### Step 1: Install Dependencies (Fixed)

**Windows:**
```cmd
# Run the installation script
install.bat
```

**Linux/macOS:**
```bash
# Make script executable and run
chmod +x install.sh
./install.sh
```

**Manual Installation (if scripts fail):**

1. **Server Setup:**
   ```cmd
   cd server
   
   # Clean and install dependencies
   rmdir /s node_modules 2>nul
   del package-lock.json 2>nul
   npm cache clean --force
   
   # Install dependencies individually
   npm install express@^4.18.2 cors@^2.8.5 helmet@^7.1.0 morgan@^1.10.0 dotenv@^16.3.1 bcryptjs@^2.4.3 jsonwebtoken@^9.0.2 pg@^8.11.3 joi@^17.11.0 rate-limiter-flexible@^2.4.2 express-validator@^7.0.1 winston@^3.11.0 axios@^1.6.0 --save
   
   npm install nodemon@^3.0.1 jest@^29.7.0 supertest@^6.3.3 --save-dev
   ```

2. **Client Setup:**
   ```cmd
   cd client
   python -m venv venv
   venv\Scripts\activate
   pip install requests pyserial psutil colorama click pydantic cryptography aiohttp rich
   ```

### Step 2: Database Setup

**Option 1: PostgreSQL (Recommended)**
1. Install PostgreSQL from https://postgresql.org/
2. Create database and user:
   ```sql
   CREATE DATABASE xiaomi_unlock;
   CREATE USER xiaomi_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE xiaomi_unlock TO xiaomi_user;
   ```

**Option 2: SQLite (Quick Testing)**
If you want to skip PostgreSQL for now, modify `server/src/utils/database.js`:

```javascript
// Replace PostgreSQL with SQLite for quick testing
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.db = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database('./xiaomi_unlock.db', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve({ rows });
            });
        });
    }
}
```

Then install SQLite: `npm install sqlite3 --save`

### Step 3: Configuration

1. **Server Configuration:**
   ```cmd
   cd server
   copy env.example .env
   # Edit .env with your database credentials
   ```

2. **Client Configuration:**
   The `config.json` is already created with default settings.

### Step 4: Start the System

1. **Start Server:**
   ```cmd
   cd server
   npm run migrate
   npm start
   ```

2. **Start Client (in new terminal):**
   ```cmd
   cd client
   python main.py
   ```

### Step 5: Test Everything

1. **Test Server:**
   ```cmd
   cd server
   node test_server.js
   ```

2. **Test Client:**
   ```cmd
   cd client
   python test_client.py
   ```

### 🔧 Troubleshooting

**If npm install still fails:**
1. Update Node.js to latest LTS version
2. Clear npm cache: `npm cache clean --force`
3. Delete `node_modules` and `package-lock.json`
4. Install dependencies one by one

**If Python dependencies fail:**
1. Update pip: `python -m pip install --upgrade pip`
2. Use virtual environment
3. Install dependencies individually

**If database connection fails:**
1. Make sure PostgreSQL is running
2. Check credentials in `.env`
3. Test connection: `psql -h localhost -U xiaomi_user -d xiaomi_unlock`

### 🚀 Quick Test (Without Real Device)

```cmd
# Terminal 1: Start server
cd server && npm start

# Terminal 2: Test with mock device
cd client && python main.py --mock
```

This will run the system with simulated devices for testing.

### 📱 Supported Device Modes

- **EDL Mode**: Qualcomm Emergency Download Mode
- **BROM Mode**: MediaTek Boot ROM Mode  
- **Mi Assistant**: Xiaomi proprietary mode
- **Fastboot**: Standard Android bootloader
- **ADB**: Android Debug Bridge

### 🛡️ Security Features

- HMAC SHA256 authentication
- Time-limited auth keys (5 minutes)
- Rate limiting
- Input validation
- Secure logging

### 📚 Next Steps

1. Read `docs/api.md` for API documentation
2. Check `docs/workflow.md` for detailed process
3. See `docs/installation.md` for advanced setup
4. Review `DEPLOYMENT.md` for production deployment

### ⚠️ Important Notes

- **Educational Use Only**: This software is for learning purposes
- **Legal Compliance**: Ensure you follow local laws
- **Device Warranty**: Unlocking may void warranties
- **Use at Own Risk**: Authors not responsible for damage

The system is now ready to use! 🎉
