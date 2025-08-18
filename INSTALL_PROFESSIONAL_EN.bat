@echo off
cls
title Xiaomi Unlock System - Professional Installation
color 0A
echo.
echo ========================================
echo   XIAOMI UNLOCK PROFESSIONAL PACKAGE
echo        Installation Wizard v1.0
echo ========================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as administrator!
    echo Right-click and select "Run as administrator".
    echo.
    pause
    exit /b 1
)

echo [INFO] Starting Xiaomi Unlock Professional installation...
echo.

:: Create necessary directories
echo [STEP 1/8] Creating system directories...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups
if not exist "license" mkdir license
if not exist "temp" mkdir temp

:: Check Node.js installation
echo [STEP 2/8] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js 18.x or higher from https://nodejs.org
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('node --version') do echo [SUCCESS] Node.js %%i detected
)

:: Check Python installation
echo [STEP 3/8] Checking Python installation...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Python not found!
    echo Please install Python 3.8+ from https://python.org
    echo.
    pause
    exit /b 1
) else (
    for /f "tokens=*" %%i in ('python --version') do echo [SUCCESS] %%i detected
)

:: Install server dependencies
echo [STEP 4/8] Installing server dependencies...
cd server
echo [INFO] Installing Node.js packages...
call npm install --production
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install server dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Server dependencies installed

:: Install client dependencies
echo [STEP 5/8] Installing client dependencies...
cd ../client
echo [INFO] Installing Python packages...
call pip install -r requirements.txt --quiet
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install client dependencies!
    echo Please check your internet connection and try again.
    pause
    exit /b 1
)
echo [SUCCESS] Client dependencies installed

:: Configure environment
echo [STEP 6/8] Configuring environment...
cd ../server
if exist ".env.production" (
    if not exist ".env" (
        copy .env.production .env
        echo [INFO] Production environment configured
    )
) else (
    if exist "env.example" (
        copy env.example .env
        echo [INFO] Environment template created
    )
)

:: Set up license system
echo [STEP 7/8] Setting up license system...
cd ..
if exist "license_template.json" (
    if not exist "license\license.json" (
        copy license_template.json license\license.json
        echo [INFO] License template copied
    )
)

:: Create startup shortcuts
echo [STEP 8/8] Creating startup shortcuts...
echo @echo off > START_SERVER.bat
echo title Xiaomi Unlock Server >> START_SERVER.bat
echo cd server >> START_SERVER.bat
echo npm start >> START_SERVER.bat

echo @echo off > START_CLIENT.bat
echo title Xiaomi Unlock Client >> START_CLIENT.bat
echo cd client >> START_CLIENT.bat
echo python main.py >> START_CLIENT.bat

echo @echo off > QUICK_START.bat
echo title Xiaomi Unlock System >> QUICK_START.bat
echo echo Starting Xiaomi Unlock System... >> QUICK_START.bat
echo start "Server" /min START_SERVER.bat >> QUICK_START.bat
echo timeout /t 3 /nobreak ^>nul >> QUICK_START.bat
echo START_CLIENT.bat >> QUICK_START.bat

echo.
echo ========================================
echo     INSTALLATION COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Your Xiaomi Unlock Professional system is now ready!
echo.
echo QUICK START:
echo ============
echo 1. Run QUICK_START.bat to start both server and client
echo 2. Configure your Xiaomi ID in client/config.json
echo 3. Set up your license key in license/license.json
echo.
echo MANUAL START:
echo =============
echo Server: START_SERVER.bat
echo Client: START_CLIENT.bat
echo.
echo DOCUMENTATION:
echo ==============
echo - README.md - Getting started guide
echo - CUSTOMER_GUIDE.md - Complete user manual
echo - TECHNICAL_SUPPORT.md - Support information
echo.
echo SUPPORT:
echo ========
echo Email: support@xiaomi-unlock.com
echo WhatsApp: Contact your sales representative
echo.
echo Thank you for choosing Xiaomi Unlock Professional!
echo.
pause
