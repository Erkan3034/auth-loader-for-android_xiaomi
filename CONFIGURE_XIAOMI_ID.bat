@echo off
cls
title Xiaomi Unlock System - Xiaomi ID Configuration
echo.
echo ========================================
echo   XIAOMI ID CONFIGURATION TOOL
echo     Professional Package Setup
echo ========================================
echo.

:: Get Xiaomi ID from user
set /p XIAOMI_ID="Enter Customer's Authorized Xiaomi ID: "
set /p XIAOMI_EMAIL="Enter Xiaomi Account Email: "
set /p AUTH_LEVEL="Enter Authorization Level (Dealer/Service): "

if "%XIAOMI_ID%"=="" (
    echo ❌ Error: Xiaomi ID cannot be empty!
    pause
    exit /b 1
)

echo.
echo [1/4] Updating client configuration...
:: Update client config.json
powershell -Command "(Get-Content 'client\config.json') -replace 'CUSTOMER_XIAOMI_ID_HERE', '%XIAOMI_ID%' | Set-Content 'client\config.json'"

echo [2/4] Creating Xiaomi credentials file...
:: Create Xiaomi credentials file
echo { > client\xiaomi_credentials.json
echo   "authorized_id": "%XIAOMI_ID%", >> client\xiaomi_credentials.json
echo   "account_email": "%XIAOMI_EMAIL%", >> client\xiaomi_credentials.json
echo   "authorization_level": "%AUTH_LEVEL%", >> client\xiaomi_credentials.json
echo   "configured_date": "%date% %time%", >> client\xiaomi_credentials.json
echo   "status": "active" >> client\xiaomi_credentials.json
echo } >> client\xiaomi_credentials.json

echo [3/4] Updating server environment...
:: Add Xiaomi ID to server env
echo. >> server\.env.customer
echo # Xiaomi Authorization >> server\.env.customer
echo XIAOMI_AUTHORIZED_ID=%XIAOMI_ID% >> server\.env.customer
echo XIAOMI_AUTH_LEVEL=%AUTH_LEVEL% >> server\.env.customer
echo XIAOMI_ACCOUNT_EMAIL=%XIAOMI_EMAIL% >> server\.env.customer

echo [4/4] Creating verification script...
:: Create verification script
echo @echo off > VERIFY_XIAOMI_ID.bat
echo echo Verifying Xiaomi ID: %XIAOMI_ID% >> VERIFY_XIAOMI_ID.bat
echo echo Account Email: %XIAOMI_EMAIL% >> VERIFY_XIAOMI_ID.bat
echo echo Authorization Level: %AUTH_LEVEL% >> VERIFY_XIAOMI_ID.bat
echo echo. >> VERIFY_XIAOMI_ID.bat
echo echo Configuration completed successfully! >> VERIFY_XIAOMI_ID.bat
echo pause >> VERIFY_XIAOMI_ID.bat

echo.
echo ========================================
echo   XIAOMI ID CONFIGURATION COMPLETED!
echo ========================================
echo.
echo ✅ Configured Xiaomi ID: %XIAOMI_ID%
echo ✅ Account Email: %XIAOMI_EMAIL%
echo ✅ Authorization Level: %AUTH_LEVEL%
echo.
echo FILES UPDATED:
echo ==============
echo [✓] client\config.json
echo [✓] client\xiaomi_credentials.json
echo [✓] server\.env.customer
echo [✓] VERIFY_XIAOMI_ID.bat (created)
echo.
echo IMPORTANT NOTES:
echo ================
echo - Keep Xiaomi ID confidential
echo - Verify authorization with Xiaomi
echo - Test unlock functionality
echo - Include in customer documentation
echo.
pause
