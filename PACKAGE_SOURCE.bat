@echo off
echo ================================
echo   SOURCE CODE PACKAGING
echo     For Licensed Delivery
echo ================================
echo.

:: Create customer package
echo [1/6] Musteri paketi olusturuluyor...
if exist "customer-package" rmdir /s /q customer-package
mkdir customer-package
mkdir customer-package\xiaomi-unlock-system

:: Copy source code with license protection
echo [2/6] Kaynak kod kopyalaniyor...
xcopy /E /I server customer-package\xiaomi-unlock-system\server
xcopy /E /I client customer-package\xiaomi-unlock-system\client
xcopy /E /I docs customer-package\xiaomi-unlock-system\docs

:: Remove sensitive files
echo [3/6] Hassas dosyalar temizleniyor...
del customer-package\xiaomi-unlock-system\server\.env 2>nul
del customer-package\xiaomi-unlock-system\server\logs\*.log 2>nul
del customer-package\xiaomi-unlock-system\client\logs\*.log 2>nul

:: Copy customer documentation
echo [4/6] Dokumantasyon ekleniyor...
copy README_CUSTOMER.md customer-package\xiaomi-unlock-system\
copy CUSTOMER_GUIDE.md customer-package\xiaomi-unlock-system\
copy LICENSE_CUSTOMER.md customer-package\xiaomi-unlock-system\
copy TECHNICAL_SUPPORT.md customer-package\xiaomi-unlock-system\
copy QUICK_REFERENCE.md customer-package\xiaomi-unlock-system\
copy SETUP_CUSTOMER.bat customer-package\xiaomi-unlock-system\
copy START_SYSTEM.bat customer-package\xiaomi-unlock-system\

:: Add license protection
echo [5/6] Lisans korumasi ekleniyor...
echo. > customer-package\xiaomi-unlock-system\LICENSE_KEY.txt
echo ================================ >> customer-package\xiaomi-unlock-system\LICENSE_KEY.txt
echo   XIAOMI UNLOCK SYSTEM v1.0 >> customer-package\xiaomi-unlock-system\LICENSE_KEY.txt
echo     Licensed to: [CUSTOMER_NAME] >> customer-package\xiaomi-unlock-system\LICENSE_KEY.txt
echo     License Key: [LICENSE_KEY] >> customer-package\xiaomi-unlock-system\LICENSE_KEY.txt
echo     Valid Until: [EXPIRY_DATE] >> customer-package\xiaomi-unlock-system\LICENSE_KEY.txt
echo ================================ >> customer-package\xiaomi-unlock-system\LICENSE_KEY.txt

:: Create encrypted package
echo [6/6] Sifreli paket olusturuluyor...
cd customer-package
powershell Compress-Archive -Path "xiaomi-unlock-system" -DestinationPath "Xiaomi-Unlock-System-LICENSED.zip"
cd ..

echo.
echo ================================
echo   LISANSLI PAKET HAZIRLANDI!
echo ================================
echo.
echo Musteri dosyalari:
echo - customer-package\Xiaomi-Unlock-System-LICENSED.zip
echo.
echo ONEMLI: LICENSE_KEY.txt dosyasindaki bilgileri doldurun!
echo.
pause
