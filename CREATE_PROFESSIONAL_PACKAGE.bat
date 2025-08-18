@echo off
cls
title Xiaomi Unlock System - Professional Package Creator
echo.
echo ========================================
echo   XIAOMI UNLOCK PROFESSIONAL PACKAGE
echo        Package Creator v1.0
echo ========================================
echo.

:: Get current date for package naming
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set datetime=%mydate%_%mytime%

:: Create main package directory
set PACKAGE_NAME=Xiaomi-Unlock-Professional-%datetime%
echo [1/10] Creating package directory: %PACKAGE_NAME%
if exist "%PACKAGE_NAME%" rmdir /s /q "%PACKAGE_NAME%"
mkdir "%PACKAGE_NAME%"
mkdir "%PACKAGE_NAME%\server"
mkdir "%PACKAGE_NAME%\client"
mkdir "%PACKAGE_NAME%\docs"
mkdir "%PACKAGE_NAME%\license"
mkdir "%PACKAGE_NAME%\setup"
mkdir "%PACKAGE_NAME%\support"

:: Copy server source code (clean version)
echo [2/10] Copying server source code...
xcopy /E /I /Q server\src "%PACKAGE_NAME%\server\src\"
xcopy /E /I /Q server\migrations "%PACKAGE_NAME%\server\migrations\"
copy server\package.json "%PACKAGE_NAME%\server\"
copy server\ecosystem.config.js "%PACKAGE_NAME%\server\"
copy server\Dockerfile "%PACKAGE_NAME%\server\"

:: Copy client source code (clean version)
echo [3/10] Copying client source code...
xcopy /E /I /Q client\src "%PACKAGE_NAME%\client\src\"
copy client\main.py "%PACKAGE_NAME%\client\"
copy client\requirements.txt "%PACKAGE_NAME%\client\"
copy client\config.json "%PACKAGE_NAME%\client\"

:: Create production environment file
echo [4/10] Creating production environment...
echo # XIAOMI UNLOCK SYSTEM - PROFESSIONAL PACKAGE > "%PACKAGE_NAME%\server\.env.production"
echo # Generated on %date% %time% >> "%PACKAGE_NAME%\server\.env.production"
echo. >> "%PACKAGE_NAME%\server\.env.production"
echo # Server Configuration >> "%PACKAGE_NAME%\server\.env.production"
echo NODE_ENV=production >> "%PACKAGE_NAME%\server\.env.production"
echo PORT=3000 >> "%PACKAGE_NAME%\server\.env.production"
echo. >> "%PACKAGE_NAME%\server\.env.production"
echo # Database Configuration (Customer will configure) >> "%PACKAGE_NAME%\server\.env.production"
echo DB_HOST=localhost >> "%PACKAGE_NAME%\server\.env.production"
echo DB_PORT=5432 >> "%PACKAGE_NAME%\server\.env.production"
echo DB_NAME=xiaomi_unlock >> "%PACKAGE_NAME%\server\.env.production"
echo DB_USER=postgres >> "%PACKAGE_NAME%\server\.env.production"
echo DB_PASSWORD=your_password_here >> "%PACKAGE_NAME%\server\.env.production"
echo. >> "%PACKAGE_NAME%\server\.env.production"
echo # Security Keys (Customer specific - will be generated) >> "%PACKAGE_NAME%\server\.env.production"
echo JWT_SECRET=your_jwt_secret_here >> "%PACKAGE_NAME%\server\.env.production"
echo HMAC_SECRET=your_hmac_secret_here >> "%PACKAGE_NAME%\server\.env.production"

:: Copy documentation
echo [5/10] Copying documentation...
copy README_CUSTOMER.md "%PACKAGE_NAME%\README.md"
copy CUSTOMER_GUIDE.md "%PACKAGE_NAME%\docs\"
copy TECHNICAL_SUPPORT.md "%PACKAGE_NAME%\support\"
copy QUICK_REFERENCE.md "%PACKAGE_NAME%\docs\"
copy docs\*.md "%PACKAGE_NAME%\docs\" 2>nul

:: Create license files
echo [6/10] Creating license files...
copy LICENSE_CUSTOMER.md "%PACKAGE_NAME%\license\LICENSE_AGREEMENT.md"

:: Create customer-specific license key template
echo [7/10] Creating license key template...
echo { > "%PACKAGE_NAME%\license\license_template.json"
echo   "customerId": "CUSTOMER_ID_HERE", >> "%PACKAGE_NAME%\license\license_template.json"
echo   "customerName": "CUSTOMER_NAME_HERE", >> "%PACKAGE_NAME%\license\license_template.json"
echo   "machineId": "MACHINE_ID_HERE", >> "%PACKAGE_NAME%\license\license_template.json"
echo   "expiry": "2026-01-18T23:59:59.000Z", >> "%PACKAGE_NAME%\license\license_template.json"
echo   "issued": "%date%T%time%", >> "%PACKAGE_NAME%\license\license_template.json"
echo   "version": "1.0", >> "%PACKAGE_NAME%\license\license_template.json"
echo   "package": "Professional", >> "%PACKAGE_NAME%\license\license_template.json"
echo   "features": ["source_code", "full_support", "whatsapp_group", "remote_setup"], >> "%PACKAGE_NAME%\license\license_template.json"
echo   "signature": "SIGNATURE_HERE" >> "%PACKAGE_NAME%\license\license_template.json"
echo } >> "%PACKAGE_NAME%\license\license_template.json"

:: Create setup scripts
echo [8/10] Creating setup scripts...
copy SETUP_CUSTOMER.bat "%PACKAGE_NAME%\setup\SETUP.bat"
copy START_SYSTEM.bat "%PACKAGE_NAME%\QUICK_START.bat"

:: Create professional installation script
echo [9/10] Creating professional installation script...
echo @echo off > "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo title Xiaomi Unlock System - Professional Installation >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo. >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo ======================================== >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo   XIAOMI UNLOCK PROFESSIONAL INSTALLATION >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo ======================================== >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo. >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo [1/5] Installing server dependencies... >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo cd server >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo call npm install >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo cd .. >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo. >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo [2/5] Installing client dependencies... >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo cd client >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo call pip install -r requirements.txt >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo cd .. >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo. >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo [3/5] Setting up configuration... >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo copy server\.env.production server\.env >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo. >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo [4/5] Creating shortcuts... >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo Installation completed successfully! >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo. >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo [5/5] Ready to start! >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo echo Run QUICK_START.bat to begin >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"
echo pause >> "%PACKAGE_NAME%\INSTALL_PROFESSIONAL.bat"

:: Create package info file
echo [10/10] Creating package information...
echo ======================================== > "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo   XIAOMI UNLOCK PROFESSIONAL PACKAGE >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo ======================================== >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo. >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo Package Type: Professional >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo Version: 1.0 >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo Created: %date% %time% >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo. >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo CONTENTS: >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo ========= >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo [✓] Full source code (server + client) >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo [✓] Complete documentation >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo [✓] License agreement >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo [✓] Setup automation scripts >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo [✓] Technical support info >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo [✓] 1 year support included >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo [✓] WhatsApp support group access >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo [✓] Remote installation support >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo. >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo INSTALLATION: >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo ============= >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo 1. Run INSTALL_PROFESSIONAL.bat >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo 2. Configure license in license/ folder >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo 3. Run QUICK_START.bat to begin >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo. >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo SUPPORT: >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo ======== >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo Email: support@xiaomi-unlock.com >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo WhatsApp: +90 XXX XXX XXXX >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"
echo Website: www.xiaomi-unlock.com >> "%PACKAGE_NAME%\PACKAGE_INFO.txt"

echo.
echo ========================================
echo   PROFESSIONAL PACKAGE CREATED!
echo ========================================
echo.
echo Package Location: %PACKAGE_NAME%\
echo Package Size: 
dir "%PACKAGE_NAME%" | find "File(s)"
echo.
echo NEXT STEPS:
echo 1. Fill customer information in license\license_template.json
echo 2. Generate unique license key
echo 3. Create ZIP package
echo 4. Send to customer securely
echo.
echo Would you like to create ZIP package now? (Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    echo Creating ZIP package...
    powershell Compress-Archive -Path "%PACKAGE_NAME%" -DestinationPath "%PACKAGE_NAME%.zip"
    echo ZIP package created: %PACKAGE_NAME%.zip
)
echo.
pause
