# 🛠️ Xiaomi Unlock System - Teknik Destek Kılavuzu

## 📞 Destek İletişim Bilgileri

### 🚨 Acil Destek (7/24)
- **Telefon:** +90-XXX-XXX-XXXX
- **WhatsApp:** +90-XXX-XXX-XXXX
- **Email:** emergency@yourdomain.com

### 📧 Genel Destek
- **Email:** support@yourdomain.com
- **Canlı Chat:** https://yourdomain.com/support
- **Destek Sistemi:** https://support.yourdomain.com

### ⏰ Destek Saatleri
- **Hafta içi:** 09:00 - 18:00 (GMT+3)
- **Hafta sonu:** 10:00 - 16:00 (GMT+3)
- **Acil durumlar:** 7/24 (ek ücretli)

## 🔧 Kendi Kendine Sorun Çözme

### 1. Sistem Durumu Kontrolü

#### Server Durumu
```bash
# Windows'ta
curl http://localhost:3000/health

# Çıktı şöyle olmalı:
# {"status":"OK","timestamp":"...","version":"v1"}
```

#### Client Durumu
```bash
cd client
python -c "import main; print('Client OK')"
```

#### Port Kontrolü
```bash
# Windows'ta
netstat -an | find "3000"

# Linux/Mac'te
netstat -an | grep 3000
```

### 2. Log Dosyaları İnceleme

#### Server Logları
```bash
# Ana log dosyası
server/logs/combined.log

# Hata logları
server/logs/error.log

# Güvenlik logları
server/logs/security.log
```

#### Client Logları
```bash
# Client log dosyası
client/logs/client.log

# Debug logları
client/logs/debug.log
```

### 3. Yaygın Hata Çözümleri

#### Hata: "Cannot connect to server"
**Çözüm:**
```bash
1. Server'ın çalışıp çalışmadığını kontrol edin:
   cd server && npm start

2. Port 3000'in kullanımda olup olmadığını kontrol edin:
   netstat -an | find "3000"

3. Firewall ayarlarını kontrol edin
```

#### Hata: "Device not detected"
**Çözüm:**
```bash
1. USB kablosunu değiştirin
2. Farklı USB portunu deneyin
3. Cihaz driver'larını güncelleyin
4. Cihazı EDL/BROM moduna tekrar alın
```

#### Hata: "Authentication failed"
**Çözüm:**
```bash
1. client/config.json dosyasındaki HMAC secret'ını kontrol edin
2. Server'daki .env dosyasındaki HMAC_SECRET ile eşleştiğinden emin olun
3. Sistem saatinin doğru olduğunu kontrol edin
```

#### Hata: "Operation timeout"
**Çözüm:**
```bash
1. İşlem sırasında USB kablosunu çıkarmayın
2. Cihazı kapatmayın
3. Timeout değerini artırın: config.json > operation_timeout: 600
4. İşlemi yeniden başlatın
```

## 🔍 Gelişmiş Sorun Giderme

### Debug Modu Aktifleştirme

#### Client Debug
```bash
# config.json dosyasında
{
  "logging": {
    "level": "DEBUG"
  },
  "advanced": {
    "enable_debug_logging": true
  }
}
```

#### Server Debug
```bash
# .env dosyasında
LOG_LEVEL=debug
NODE_ENV=development
```

### Sistem Bilgileri Toplama

#### Windows
```powershell
# Sistem bilgileri
systeminfo > system_info.txt

# USB cihazlar
Get-PnpDevice -Class USB > usb_devices.txt

# Çalışan servisler
Get-Service | Where-Object {$_.Status -eq "Running"} > services.txt
```

#### Linux/Mac
```bash
# Sistem bilgileri
uname -a > system_info.txt
lsusb > usb_devices.txt
ps aux > running_processes.txt
```

### Network Diagnostics
```bash
# Port tarama
nmap -p 3000 localhost

# Bağlantı testi
telnet localhost 3000

# DNS çözümleme
nslookup yourdomain.com
```

## 📊 Performans İzleme

### Server Performance
```bash
# CPU ve Memory kullanımı
top -p $(pgrep node)

# Disk kullanımı
du -sh server/logs/

# Network trafiği
netstat -i
```

### Database Performance
```sql
-- Aktif bağlantılar
SELECT * FROM pg_stat_activity;

-- Slow queries
SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;

-- Database boyutu
SELECT pg_size_pretty(pg_database_size('xiaomi_unlock'));
```

## 🚨 Acil Durum Prosedürleri

### Sistem Çökmesi
1. **İlk Müdahale:**
   ```bash
   # Tüm Node.js işlemlerini durdur
   pkill -f node
   
   # Database bağlantılarını kontrol et
   sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"
   
   # Sistem yeniden başlat
   cd server && npm start
   ```

2. **Log Analizi:**
   ```bash
   # Son hataları görüntüle
   tail -n 100 server/logs/error.log
   
   # Kritik hataları filtrele
   grep -i "critical\|fatal\|error" server/logs/combined.log
   ```

3. **Backup'tan Geri Yükleme:**
   ```bash
   # Database backup'tan geri yükle
   psql -U xiaomi_user -d xiaomi_unlock < backup_latest.sql
   
   # Uygulama dosyalarını geri yükle
   cp -r backup/server/* server/
   ```

### Güvenlik İhlali Şüphesi
1. **Anında Müdahale:**
   ```bash
   # Servisi durdur
   pm2 stop all
   
   # Şüpheli bağlantıları kes
   netstat -an | grep :3000
   
   # Güvenlik loglarını incele
   grep -i "suspicious\|attack\|unauthorized" server/logs/security.log
   ```

2. **İnceleme:**
   ```bash
   # Son 24 saatin logları
   find server/logs/ -name "*.log" -mtime -1 -exec grep -l "ERROR\|WARN" {} \;
   
   # IP adreslerini analiz et
   awk '{print $1}' server/logs/access.log | sort | uniq -c | sort -nr
   ```

## 📋 Destek Talebi Oluşturma

### Gerekli Bilgiler
Destek talebi oluştururken aşağıdaki bilgileri hazırlayın:

#### 1. Sistem Bilgileri
- **OS:** Windows 11 Pro / Ubuntu 20.04
- **Node.js Version:** v18.17.0
- **Python Version:** 3.9.7
- **RAM:** 8GB
- **CPU:** Intel i5-8400

#### 2. Hata Detayları
- **Hata Mesajı:** Tam hata metnini kopyalayın
- **Hata Zamanı:** Tarih ve saat
- **Yapılan İşlem:** Hangi adımda hata oluştu
- **Cihaz Bilgileri:** Xiaomi Redmi Note 10 Pro

#### 3. Log Dosyaları
```bash
# Log dosyalarını zip'leyin
# Windows
powershell Compress-Archive -Path "server/logs/*" -DestinationPath "logs.zip"

# Linux/Mac
tar -czf logs.tar.gz server/logs/ client/logs/
```

#### 4. Ekran Görüntüleri
- Hata mesajının ekran görüntüsü
- Client arayüzünün görüntüsü
- System information ekranı

### Destek Talebi Template
```
Konu: [ACIL/NORMAL] - [Hata Türü] - [Kısa Açıklama]

Müşteri Bilgileri:
- Ad Soyad: 
- Şirket: 
- Lisans No: 
- Telefon: 
- Email: 

Sistem Bilgileri:
- OS: 
- Xiaomi Unlock System Version: 
- Node.js Version: 
- Python Version: 

Hata Detayları:
- Hata Mesajı: 
- Hata Zamanı: 
- Yapılan İşlem: 
- Cihaz Modeli: 

Ek Bilgiler:
- Log dosyaları ekte
- Ekran görüntüleri ekte
- Daha önce çalışıyor muydu? Evet/Hayır
- Son değişiklikler: 

Beklenen Çözüm:
- 
```

## 🔄 Güncellemeler ve Bakım

### Otomatik Güncellemeler
```bash
# Güncellemeleri kontrol et
cd server && npm run check-updates

# Güvenlik güncellemelerini yükle
npm audit fix

# Client güncellemeleri
cd client && pip list --outdated
```

### Bakım Prosedürleri
```bash
# Haftalık bakım
1. Log dosyalarını temizle (7 günden eski)
2. Database vacuum işlemi yap
3. Sistem performansını kontrol et
4. Backup al

# Aylık bakım
1. Güvenlik güncellemelerini yükle
2. SSL sertifikasını kontrol et
3. Disk alanını kontrol et
4. Performans raporunu oluştur
```

## 📞 Uzaktan Destek

### TeamViewer
1. TeamViewer'ı indirin: https://www.teamviewer.com
2. ID ve şifreyi destek ekibine iletin
3. Uzaktan bağlantıya izin verin

### AnyDesk
1. AnyDesk'i indirin: https://anydesk.com
2. Address'i destek ekibine iletin
3. Bağlantı talebini onaylayın

### SSH (Linux/Mac)
```bash
# SSH servisi başlat
sudo systemctl start ssh

# Kullanıcı oluştur (geçici)
sudo useradd -m support_temp
sudo passwd support_temp

# Bağlantı bilgilerini iletin
```

---

## 🎯 Destek Kalite Standartları

- **Yanıt Süresi:** 2 saat içinde (iş saatleri)
- **Çözüm Süresi:** 24 saat içinde (kritik olmayan)
- **Acil Durum:** 1 saat içinde müdahale
- **Müşteri Memnuniyeti:** %95+ hedef

**Teknik destek ekibimiz 7/24 hizmetinizdedir!** 🚀
