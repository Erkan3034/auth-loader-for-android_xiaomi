@echo off
title Xiaomi Unlock System
color 0A

echo ========================================
echo     XIAOMI UNLOCK SYSTEM v1.0
echo ========================================
echo.

:: Start server in background
echo [INFO] Starting server...
cd server
start "Xiaomi Server" /min cmd /c "npm start"

:: Wait for server to start
echo [INFO] Waiting for server to start...
timeout /t 5 /nobreak >nul

:: Check if server is running
echo [INFO] Checking server status...
curl -s http://localhost:3000/health >nul 2>&1
if %errorLevel% equ 0 (
    echo [SUCCESS] Server is running! ✓
) else (
    echo [WARNING] Server not ready yet, please wait a moment...
)

:: Start client
echo.
echo [INFO] Starting client...
cd ../client
python main.py

:: Cleanup on exit
echo.
echo [INFO] System shutting down...
taskkill /f /fi "WindowTitle eq Xiaomi Server*" >nul 2>&1
echo [INFO] Cleanup completed.
pause
