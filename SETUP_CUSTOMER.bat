@echo off
echo ================================
echo  Xiaomi Unlock System Setup
echo ================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as administrator!
    echo Right-click and select "Run as administrator".
    pause
    exit /b 1
)

echo [INFO] Installing Xiaomi Unlock System...
echo.

:: Create directories
echo [STEP 1/6] Creating directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups

:: Check Node.js
echo [STEP 2/6] Checking Node.js...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please download Node.js 18.x from https://nodejs.org
    pause
    exit /b 1
)

:: Check Python
echo [STEP 3/6] Checking Python...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Python not found!
    echo Please download Python 3.8+ from https://python.org
    pause
    exit /b 1
)

:: Install server dependencies
echo [STEP 4/6] Installing server dependencies...
cd server
call npm install
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install server dependencies!
    pause
    exit /b 1
)

:: Install client dependencies
echo [STEP 5/6] Installing client dependencies...
cd ../client
call pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install client dependencies!
    pause
    exit /b 1
)

:: Create environment file
echo [STEP 6/6] Creating configuration file...
cd ../server
if not exist ".env" (
    copy env.example .env
    echo [INFO] .env file created. Please configure it.
)

echo.
echo ================================
echo     INSTALLATION COMPLETED!
echo ================================
echo.
echo Usage:
echo 1. Start server: cd server ^&^& npm start
echo 2. Start client: cd client ^&^& python main.py
echo.
echo For detailed usage, read CUSTOMER_GUIDE.md file.
echo.
pause
