@echo off
echo ================================
echo   XIAOMI UNLOCK SYSTEM
echo     Release Builder
echo ================================
echo.

:: Create release directory
echo [1/8] Release dizini olusturuluyor...
if exist "release" rmdir /s /q release
mkdir release
mkdir release\xiaomi-unlock-system
mkdir release\xiaomi-unlock-system\server
mkdir release\xiaomi-unlock-system\client
mkdir release\xiaomi-unlock-system\docs

:: Build server (Node.js executable)
echo [2/8] Server executable olusturuluyor...
cd server
call npm install -g pkg
call pkg . --target node18-win-x64 --output ../release/xiaomi-unlock-system/server/xiaomi-server.exe
cd ..

:: Build client (Python executable)
echo [3/8] Client executable olusturuluyor...
cd client
call pip install pyinstaller
call pyinstaller --onefile --windowed --name xiaomi-client main.py
copy dist\xiaomi-client.exe ..\release\xiaomi-unlock-system\client\
cd ..

:: Copy configuration files
echo [4/8] Konfigurasyonlar kopyalaniyor...
copy server\env.example release\xiaomi-unlock-system\server\.env
copy client\config.json release\xiaomi-unlock-system\client\
copy server\package.json release\xiaomi-unlock-system\server\

:: Copy customer files
echo [5/8] Musteri dosyalari kopyalaniyor...
copy README_CUSTOMER.md release\xiaomi-unlock-system\
copy CUSTOMER_GUIDE.md release\xiaomi-unlock-system\
copy LICENSE_CUSTOMER.md release\xiaomi-unlock-system\
copy TECHNICAL_SUPPORT.md release\xiaomi-unlock-system\
copy QUICK_REFERENCE.md release\xiaomi-unlock-system\

:: Create startup scripts
echo [6/8] Baslangic scriptleri olusturuluyor...
echo @echo off > release\xiaomi-unlock-system\START.bat
echo title Xiaomi Unlock System >> release\xiaomi-unlock-system\START.bat
echo echo Starting Xiaomi Unlock System... >> release\xiaomi-unlock-system\START.bat
echo start "Server" /min server\xiaomi-server.exe >> release\xiaomi-unlock-system\START.bat
echo timeout /t 3 /nobreak ^>nul >> release\xiaomi-unlock-system\START.bat
echo client\xiaomi-client.exe >> release\xiaomi-unlock-system\START.bat

:: Create installer
echo [7/8] Installer olusturuluyor...
echo [Setup] > release\setup.iss
echo AppName=Xiaomi Unlock System >> release\setup.iss
echo AppVersion=1.0 >> release\setup.iss
echo DefaultDirName={pf}\Xiaomi Unlock System >> release\setup.iss
echo DefaultGroupName=Xiaomi Unlock System >> release\setup.iss
echo [Files] >> release\setup.iss
echo Source: "xiaomi-unlock-system\*"; DestDir: "{app}"; Flags: recursesubdirs >> release\setup.iss

:: Create ZIP package
echo [8/8] ZIP paketi olusturuluyor...
cd release
powershell Compress-Archive -Path "xiaomi-unlock-system" -DestinationPath "Xiaomi-Unlock-System-v1.0.zip"
cd ..

echo.
echo ================================
echo    RELEASE HAZIRLANDI!
echo ================================
echo.
echo Dosyalar:
echo - release\Xiaomi-Unlock-System-v1.0.zip
echo - release\xiaomi-unlock-system\ (klasor)
echo.
pause
