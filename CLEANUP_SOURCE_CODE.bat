@echo off
echo ========================================
echo   SOURCE CODE CLEANUP FOR DELIVERY
echo ========================================
echo.

echo [1/8] Removing development files...
:: Remove development-only files
del server\.env 2>nul
del server\.env.local 2>nul
del server\.env.development 2>nul
del server\*.log 2>nul
del client\*.log 2>nul

echo [2/8] Cleaning log directories...
:: Clean log directories
if exist server\logs rmdir /s /q server\logs
if exist client\logs rmdir /s /q client\logs

echo [3/8] Removing node_modules and cache...
:: Remove node_modules and package-lock (customer will install fresh)
if exist server\node_modules rmdir /s /q server\node_modules

echo [4/8] Cleaning Python cache...
:: Remove Python cache files
for /d /r client %%d in (__pycache__) do @if exist "%%d" rmdir /s /q "%%d"
del client\*.pyc 2>nul

echo [5/8] Removing sensitive test files...
:: Remove test files with sensitive data
del server\test_server.js 2>nul
del client\test_client.py 2>nul

echo [6/8] Cleaning temporary files...
:: Remove temporary files
del *.tmp 2>nul
del *.temp 2>nul
del server\*.tmp 2>nul
del client\*.tmp 2>nul

echo [7/8] Removing IDE files...
:: Remove IDE specific files
if exist .vscode rmdir /s /q .vscode
if exist .idea rmdir /s /q .idea
del *.code-workspace 2>nul

echo [8/8] Creating clean environment template...
:: Create clean .env template for customer
echo # XIAOMI UNLOCK SYSTEM - CUSTOMER CONFIGURATION > server\.env.customer
echo # Please configure these values for your environment >> server\.env.customer
echo. >> server\.env.customer
echo # Server Settings >> server\.env.customer
echo NODE_ENV=production >> server\.env.customer
echo PORT=3000 >> server\.env.customer
echo. >> server\.env.customer
echo # Database Configuration >> server\.env.customer
echo DB_HOST=localhost >> server\.env.customer
echo DB_PORT=5432 >> server\.env.customer
echo DB_NAME=xiaomi_unlock >> server\.env.customer
echo DB_USER=postgres >> server\.env.customer
echo DB_PASSWORD=YOUR_DB_PASSWORD_HERE >> server\.env.customer
echo. >> server\.env.customer
echo # Security Keys (CHANGE THESE!) >> server\.env.customer
echo JWT_SECRET=YOUR_UNIQUE_JWT_SECRET_HERE >> server\.env.customer
echo HMAC_SECRET=YOUR_UNIQUE_HMAC_SECRET_HERE >> server\.env.customer

echo.
echo ========================================
echo   SOURCE CODE CLEANUP COMPLETED!
echo ========================================
echo.
echo Cleaned items:
echo [✓] Development environment files
echo [✓] Log files and directories  
echo [✓] Node modules and cache
echo [✓] Python cache files
echo [✓] Sensitive test files
echo [✓] Temporary files
echo [✓] IDE configuration files
echo [✓] Created customer .env template
echo.
pause
