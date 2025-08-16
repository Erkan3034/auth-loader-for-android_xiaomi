@echo off
echo 🚀 Installing Xiaomi Device Unlock System...
echo =============================================

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    echo    Download from: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed. Please install Python 3.8+ first.
    echo    Download from: https://python.org/
    pause
    exit /b 1
)

echo.
echo 📦 Installing Server Dependencies...
cd server

REM Clean npm cache and node_modules
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
npm cache clean --force

REM Install dependencies one by one
echo Installing core dependencies...
call npm install express@^4.18.2 --save
call npm install cors@^2.8.5 --save
call npm install helmet@^7.1.0 --save
call npm install morgan@^1.10.0 --save
call npm install dotenv@^16.3.1 --save
call npm install bcryptjs@^2.4.3 --save
call npm install jsonwebtoken@^9.0.2 --save
call npm install pg@^8.11.3 --save
call npm install joi@^17.11.0 --save
call npm install rate-limiter-flexible@^2.4.2 --save
call npm install express-validator@^7.0.1 --save
call npm install winston@^3.11.0 --save
call npm install axios@^1.6.0 --save

echo Installing dev dependencies...
call npm install nodemon@^3.0.1 --save-dev
call npm install jest@^29.7.0 --save-dev
call npm install supertest@^6.3.3 --save-dev

if errorlevel 1 (
    echo ❌ Server installation failed. Please check the errors above.
    pause
    exit /b 1
)

echo ✅ Server dependencies installed successfully!

echo.
echo 🐍 Installing Client Dependencies...
cd ..\client

REM Create virtual environment
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Upgrade pip
python -m pip install --upgrade pip

REM Install dependencies
python -m pip install requests==2.31.0
python -m pip install pyserial==3.5
python -m pip install psutil==5.9.6
python -m pip install colorama==0.4.6
python -m pip install click==8.1.7
python -m pip install pydantic==2.5.0
python -m pip install cryptography==41.0.8
python -m pip install aiohttp==3.9.0

REM Optional dependencies
echo Installing optional dependencies...
python -m pip install rich==13.7.0 2>nul || echo ⚠️  Rich UI library not installed (optional)
python -m pip install pyusb==1.2.1 2>nul || echo ⚠️  PyUSB not installed (optional)

if errorlevel 1 (
    echo ❌ Client installation failed. Please check the errors above.
    pause
    exit /b 1
)

echo ✅ Client dependencies installed successfully!

echo.
echo 📋 Setup Configuration Files...
cd ..\server

REM Copy environment file
if not exist .env (
    copy env.example .env
    echo ✅ Created .env file (please edit with your database credentials)
) else (
    echo ℹ️  .env file already exists
)

echo.
echo 🎉 Installation Complete!
echo =========================
echo.
echo Next steps:
echo 1. 🗄️  Set up PostgreSQL database:
echo    - Install PostgreSQL from https://postgresql.org/
echo    - Create database: xiaomi_unlock
echo    - Create user with appropriate permissions
echo    - Edit server\.env with your database credentials
echo.
echo 2. 🚀 Start the system:
echo    Terminal 1 - Server:
echo    cd server ^&^& npm run migrate ^&^& npm start
echo.
echo    Terminal 2 - Client:
echo    cd client ^&^& python main.py
echo.
echo 3. 🧪 Test the system:
echo    cd server ^&^& node test_server.js
echo    cd client ^&^& python test_client.py
echo.
echo 📚 Documentation:
echo    - API: docs\api.md
echo    - Installation: docs\installation.md
echo    - Workflow: docs\workflow.md
echo.
echo ⚠️  IMPORTANT: This software is for educational purposes only.
echo    Use responsibly and comply with local laws.
echo.
pause
