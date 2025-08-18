@echo off
title Xiaomi Unlock System
color 0A

echo ========================================
echo     XIAOMI UNLOCK SYSTEM v1.0
echo ========================================
echo.

:: Start server in background
echo [BİLGİ] Server başlatılıyor...
cd server
start "Xiaomi Server" /min cmd /c "npm start"

:: Wait for server to start
echo [BİLGİ] Server başlatılması bekleniyor...
timeout /t 5 /nobreak >nul

:: Check if server is running
echo [BİLGİ] Server durumu kontrol ediliyor...
curl -s http://localhost:3000/health >nul 2>&1
if %errorLevel% equ 0 (
    echo [BAŞARILI] Server çalışıyor! ✓
) else (
    echo [UYARI] Server henüz hazır değil, biraz daha bekleyin...
)

:: Start client
echo.
echo [BİLGİ] Client başlatılıyor...
cd ../client
python main.py

:: Cleanup on exit
echo.
echo [BİLGİ] Sistem kapatılıyor...
taskkill /f /fi "WindowTitle eq Xiaomi Server*" >nul 2>&1
echo [BİLGİ] Temizlik tamamlandı.
pause
