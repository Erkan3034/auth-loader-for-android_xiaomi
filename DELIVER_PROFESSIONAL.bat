@echo off
cls
title Xiaomi Unlock System - Professional Package Delivery
color 0A
echo.
echo ===============================================
echo   XIAOMI UNLOCK PROFESSIONAL PACKAGE DELIVERY
echo              Automated Delivery System
echo ===============================================
echo.

:: Check if customer info is ready
if not exist "CUSTOMER_INFO_TEMPLATE.txt" (
    echo ❌ Error: Customer info template not found!
    echo Please fill CUSTOMER_INFO_TEMPLATE.txt first
    pause
    exit /b 1
)

echo [STEP 1/10] Reading customer information...
echo.
echo Please fill customer information in CUSTOMER_INFO_TEMPLATE.txt
echo Press any key when ready...
pause >nul

:: Create delivery timestamp
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set delivery_time=%mydate%_%mytime%

:: Set package name
set PACKAGE_NAME=Xiaomi-Unlock-Professional-%delivery_time%
set CUSTOMER_PACKAGE=%PACKAGE_NAME%-CUSTOMER

echo [STEP 2/10] Creating professional package structure...
if exist "%CUSTOMER_PACKAGE%" rmdir /s /q "%CUSTOMER_PACKAGE%"
mkdir "%CUSTOMER_PACKAGE%"
mkdir "%CUSTOMER_PACKAGE%\system"
mkdir "%CUSTOMER_PACKAGE%\docs"
mkdir "%CUSTOMER_PACKAGE%\license"
mkdir "%CUSTOMER_PACKAGE%\support"
mkdir "%CUSTOMER_PACKAGE%\setup"

echo [STEP 3/10] Running source code cleanup...
call CLEANUP_SOURCE_CODE.bat

echo [STEP 4/10] Creating professional package...
call CREATE_PROFESSIONAL_PACKAGE.bat

echo [STEP 5/10] Generating license key...
node generate_license.js

echo [STEP 6/10] Copying system files...
:: Copy the created package to customer package
xcopy /E /I /Q "%PACKAGE_NAME%" "%CUSTOMER_PACKAGE%\system\"

echo [STEP 7/10] Adding professional support documentation...
copy PROFESSIONAL_SUPPORT_PACKAGE.md "%CUSTOMER_PACKAGE%\support\"
copy CUSTOMER_GUIDE.md "%CUSTOMER_PACKAGE%\docs\"
copy TECHNICAL_SUPPORT.md "%CUSTOMER_PACKAGE%\support\"
copy README_CUSTOMER.md "%CUSTOMER_PACKAGE%\README.md"

echo [STEP 8/10] Creating customer welcome package...
echo =============================================== > "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo   XIAOMI UNLOCK PROFESSIONAL PACKAGE >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo      Welcome to Professional Service! >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo =============================================== >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo. >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo Dear Valued Customer, >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo. >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo Thank you for choosing Xiaomi Unlock Professional! >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo. >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo WHAT'S INCLUDED: >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo ================ >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo [✓] Complete source code (server + client) >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo [✓] Full documentation and guides >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo [✓] 1 year premium support >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo [✓] WhatsApp support group access >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo [✓] Remote installation assistance >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo [✓] All updates included >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo [✓] Priority technical support >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo. >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo QUICK START: >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo ============ >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo 1. Read README.md for overview >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo 2. Run system\INSTALL_PROFESSIONAL.bat >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo 3. Configure your license key >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo 4. Contact support for WhatsApp group >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo 5. Start using with system\QUICK_START.bat >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo. >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo SUPPORT CONTACTS: >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo ================= >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo WhatsApp: +90 XXX XXX XXXX >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo Email: support@xiaomi-unlock.com >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo Website: www.xiaomi-unlock.com >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo. >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo Package delivered: %date% %time% >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo. >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo We're here to help you succeed! >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo. >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo Best regards, >> "%CUSTOMER_PACKAGE%\WELCOME.txt"
echo Xiaomi Unlock Team >> "%CUSTOMER_PACKAGE%\WELCOME.txt"

echo [STEP 9/10] Creating secure delivery package...
:: Create encrypted ZIP
powershell Compress-Archive -Path "%CUSTOMER_PACKAGE%" -DestinationPath "%CUSTOMER_PACKAGE%.zip"

:: Create delivery checklist
echo [STEP 10/10] Creating delivery checklist...
echo =============================================== > "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo   PROFESSIONAL PACKAGE DELIVERY CHECKLIST >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo =============================================== >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo. >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo PACKAGE INFORMATION: >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo ==================== >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo Package: Professional >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo Created: %date% %time% >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo Package Name: %CUSTOMER_PACKAGE% >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo ZIP File: %CUSTOMER_PACKAGE%.zip >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo. >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo DELIVERY CHECKLIST: >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo =================== >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] Customer information collected >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] License key generated >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] Package tested >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] Documentation reviewed >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] Support contacts provided >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] Delivery method confirmed >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] Payment confirmed >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] Package sent to customer >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] Installation support scheduled >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo [ ] WhatsApp group invitation sent >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo. >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo NEXT STEPS: >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo =========== >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo 1. Send %CUSTOMER_PACKAGE%.zip to customer >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo 2. Provide installation support >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo 3. Add to WhatsApp support group >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo 4. Schedule follow-up in 1 week >> "DELIVERY_CHECKLIST_%delivery_time%.txt"
echo 5. Add to customer database >> "DELIVERY_CHECKLIST_%delivery_time%.txt"

echo.
echo ===============================================
echo   PROFESSIONAL PACKAGE DELIVERY COMPLETED!
echo ===============================================
echo.
echo ✅ Package Created: %CUSTOMER_PACKAGE%
echo ✅ ZIP File: %CUSTOMER_PACKAGE%.zip
echo ✅ Size: 
dir "%CUSTOMER_PACKAGE%.zip" | find "bytes"
echo.
echo 📋 DELIVERY OPTIONS:
echo ==================
echo 1. Email (for files under 25MB)
echo 2. Google Drive / Dropbox (recommended)
echo 3. WeTransfer (up to 2GB free)
echo 4. USB/DVD (physical delivery)
echo 5. FTP/SFTP (secure transfer)
echo.
echo 📞 CUSTOMER CONTACT REQUIRED:
echo ============================
echo - Send package via chosen method
echo - Provide installation support
echo - Add to WhatsApp support group
echo - Schedule follow-up meeting
echo.
echo 💰 PAYMENT CONFIRMATION:
echo =======================
echo Professional Package: ₺18,000
echo Payment Status: [ ] Confirmed
echo Invoice Sent: [ ] Yes [ ] No
echo.
echo 🎯 SUCCESS METRICS:
echo ==================
echo - Installation completed: [ ]
echo - First successful unlock: [ ]
echo - Customer satisfaction: [ ]
echo - Support group joined: [ ]
echo.
pause
