#!/bin/bash

# Xiaomi Device Unlock System - Installation Script

echo "🚀 Installing Xiaomi Device Unlock System..."
echo "============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if Python is installed
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "❌ Python is not installed. Please install Python 3.8+ first."
    echo "   Download from: https://python.org/"
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. You'll need to install PostgreSQL manually."
    echo "   Download from: https://postgresql.org/"
fi

echo ""
echo "📦 Installing Server Dependencies..."
cd server

# Clean npm cache and node_modules
rm -rf node_modules package-lock.json
npm cache clean --force

# Install dependencies one by one to avoid conflicts
echo "Installing core dependencies..."
npm install express@^4.18.2 --save
npm install cors@^2.8.5 --save
npm install helmet@^7.1.0 --save
npm install morgan@^1.10.0 --save
npm install dotenv@^16.3.1 --save
npm install bcryptjs@^2.4.3 --save
npm install jsonwebtoken@^9.0.2 --save
npm install pg@^8.11.3 --save
npm install joi@^17.11.0 --save
npm install rate-limiter-flexible@^2.4.2 --save
npm install express-validator@^7.0.1 --save
npm install winston@^3.11.0 --save
npm install axios@^1.6.0 --save

echo "Installing dev dependencies..."
npm install nodemon@^3.0.1 --save-dev
npm install jest@^29.7.0 --save-dev
npm install supertest@^6.3.3 --save-dev

if [ $? -eq 0 ]; then
    echo "✅ Server dependencies installed successfully!"
else
    echo "❌ Server installation failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🐍 Installing Client Dependencies..."
cd ../client

# Create virtual environment
python3 -m venv venv 2>/dev/null || python -m venv venv

# Activate virtual environment
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install requests==2.31.0
pip install pyserial==3.5
pip install psutil==5.9.6
pip install colorama==0.4.6
pip install click==8.1.7
pip install pydantic==2.5.0
pip install cryptography==41.0.8
pip install aiohttp==3.9.0

# Optional dependencies (may fail on some systems)
echo "Installing optional dependencies..."
pip install rich==13.7.0 || echo "⚠️  Rich UI library not installed (optional)"
pip install pyusb==1.2.1 || echo "⚠️  PyUSB not installed (optional)"

if [ $? -eq 0 ]; then
    echo "✅ Client dependencies installed successfully!"
else
    echo "❌ Client installation failed. Please check the errors above."
    exit 1
fi

echo ""
echo "📋 Setup Configuration Files..."
cd ../server

# Copy environment file
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ Created .env file (please edit with your database credentials)"
else
    echo "ℹ️  .env file already exists"
fi

cd ../client

# Check config file
if [ ! -f config.json ]; then
    echo "✅ config.json already exists"
else
    echo "ℹ️  config.json already exists"
fi

echo ""
echo "🎉 Installation Complete!"
echo "========================="
echo ""
echo "Next steps:"
echo "1. 🗄️  Set up PostgreSQL database:"
echo "   - Create database: xiaomi_unlock"
echo "   - Create user with appropriate permissions"
echo "   - Edit server/.env with your database credentials"
echo ""
echo "2. 🚀 Start the system:"
echo "   Terminal 1 - Server:"
echo "   cd server && npm run migrate && npm start"
echo ""
echo "   Terminal 2 - Client:"
echo "   cd client && python main.py"
echo ""
echo "3. 🧪 Test the system:"
echo "   cd server && node test_server.js"
echo "   cd client && python test_client.py"
echo ""
echo "📚 Documentation:"
echo "   - API: docs/api.md"
echo "   - Installation: docs/installation.md"
echo "   - Workflow: docs/workflow.md"
echo ""
echo "⚠️  IMPORTANT: This software is for educational purposes only."
echo "   Use responsibly and comply with local laws."
