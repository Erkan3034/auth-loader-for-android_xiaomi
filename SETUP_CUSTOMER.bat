@echo off
echo ================================
echo  Xiaomi Unlock System Setup
echo ================================
echo.

:: Check if running as administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Bu script yönetici olarak çalıştırılmalıdır!
    echo Sağ tıklayıp "Yönetici olarak çalıştır" seçin.
    pause
    exit /b 1
)

echo [BİLGİ] Xiaomi Unlock System kuruluyor...
echo.

:: Create directories
echo [ADIM 1/6] Dizinler oluşturuluyor...
if not exist "logs" mkdir logs
if not exist "uploads" mkdir uploads
if not exist "backups" mkdir backups

:: Check Node.js
echo [ADIM 2/6] Node.js kontrol ediliyor...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Node.js bulunamadı!
    echo Node.js 18.x sürümünü https://nodejs.org adresinden indirin.
    pause
    exit /b 1
)

:: Check Python
echo [ADIM 3/6] Python kontrol ediliyor...
python --version >nul 2>&1
if %errorLevel% neq 0 (
    echo [HATA] Python bulunamadı!
    echo Python 3.8+ sürümünü https://python.org adresinden indirin.
    pause
    exit /b 1
)

:: Install server dependencies
echo [ADIM 4/6] Server bağımlılıkları kuruluyor...
cd server
call npm install
if %errorLevel% neq 0 (
    echo [HATA] Server bağımlılıkları kurulamadı!
    pause
    exit /b 1
)

:: Install client dependencies
echo [ADIM 5/6] Client bağımlılıkları kuruluyor...
cd ../client
call pip install -r requirements.txt
if %errorLevel% neq 0 (
    echo [HATA] Client bağımlılıkları kurulamadı!
    pause
    exit /b 1
)

:: Create environment file
echo [ADIM 6/6] Yapılandırma dosyası oluşturuluyor...
cd ../server
if not exist ".env" (
    copy env.example .env
    echo [BİLGİ] .env dosyası oluşturuldu. Lütfen yapılandırın.
)

echo.
echo ================================
echo     KURULUM TAMAMLANDI!
echo ================================
echo.
echo Kullanım:
echo 1. Server başlatma: cd server ^&^& npm start
echo 2. Client başlatma: cd client ^&^& python main.py
echo.
echo Detaylı kullanım için CUSTOMER_GUIDE.md dosyasını okuyun.
echo.
pause
