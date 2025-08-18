# 🚀 Xiaomi Unlock System - Hızlı Referans Kartı

## ⚡ Hızlı Başlatma
```bash
1. START_SYSTEM.bat çalıştır
2. Client açılana kadar bekle
3. Cihazı bağla ve unlock et!
```

## 📱 Desteklenen Cihazlar
- ✅ **Xiaomi/Redmi/POCO** - Tüm modeller
- ✅ **Qualcomm Snapdragon** - Tam destek  
- ✅ **MediaTek (MTK)** - BROM mode
- ✅ **Android 6.0+** - Tüm sürümler

## 🔧 Unlock Türleri
| Tür | Açıklama | Süre |
|-----|----------|------|
| **FRP** | Google hesap kilidi | 5-10 dk |
| **EDL** | Emergency mode unlock | 10-15 dk |
| **Bootloader** | OEM unlock | 5 dk |
| **Mi Account** | Xiaomi hesap bypass | 15-20 dk |

## 🎯 Ana Menü Kısayolları
```
1 - Detect Devices     (Cihaz tespiti)
2 - Unlock Device      (Unlock işlemi)  
3 - Operation History  (İşlem geçmişi)
4 - Settings          (Ayarlar)
5 - Test Mode         (Test modu)
0 - Exit              (Çıkış)
```

## 🚨 Acil Durum Komutları
```bash
# Server'ı yeniden başlat
cd server && npm restart

# Logları kontrol et  
type server\logs\error.log

# Port kontrolü
netstat -an | find "3000"

# İşlemi durdur
Ctrl+C
```

## 📞 Acil Destek
- **Telefon:** +90-XXX-XXX-XXXX
- **WhatsApp:** +90-XXX-XXX-XXXX  
- **Email:** emergency@yourdomain.com

## ⚠️ Kritik Uyarılar
- 🔴 **Backup alın** - İşlem öncesi
- 🔴 **USB çıkarmayın** - İşlem sırasında
- 🔴 **Güç kesmeyin** - Cihazı kapatmayın
- 🔴 **Yasal kullanım** - Sadece kendi cihazınız

## 🔍 Yaygın Hatalar ve Çözümler

### "Device not detected"
```bash
✅ USB kablosunu değiştir
✅ Farklı USB port dene
✅ Cihaz driver güncelle
✅ EDL moduna tekrar al
```

### "Connection timeout" 
```bash
✅ Server'ı yeniden başlat
✅ İnternet bağlantısı kontrol et
✅ Firewall ayarları kontrol et
✅ Port 3000 açık mı kontrol et
```

### "Authentication failed"
```bash
✅ HMAC secret kontrol et
✅ Sistem saati doğru mu?
✅ Config.json ayarları kontrol et
✅ Server .env dosyası kontrol et
```

## 🎮 Cihaz Modları

### EDL Mode (Qualcomm)
```
1. Cihazı kapat
2. Volume Down + Power bas
3. USB bağla
4. "QDLoader 9008" görünmeli
```

### BROM Mode (MediaTek)
```
1. Cihazı kapat
2. Volume Up + Power bas  
3. USB bağla
4. "MediaTek PreLoader" görünmeli
```

### Fastboot Mode
```
1. Cihazı kapat
2. Volume Down + Power bas
3. "Fastboot Mode" yazısı görünmeli
```

## 📊 Sistem Durumu Kontrolü

### Server Sağlık Kontrolü
```bash
# Tarayıcıda aç:
http://localhost:3000/health

# Yanıt:
{"status":"OK","timestamp":"...","version":"v1"}
```

### Client Durumu
```python
# Test komutu:
python -c "import main; print('Client OK')"
```

### Database Bağlantısı
```bash
# Log dosyasında ara:
findstr "Database connected" server\logs\combined.log
```

## 🔄 Sistem Yeniden Başlatma

### Tam Yeniden Başlatma
```bash
1. Ctrl+C ile durdur
2. START_SYSTEM.bat çalıştır
3. 30 saniye bekle
4. Test et
```

### Sadece Server
```bash
cd server
npm start
```

### Sadece Client  
```bash
cd client
python main.py
```

## 📋 Log Dosyaları
```
server/logs/combined.log    - Genel loglar
server/logs/error.log       - Hata logları  
server/logs/security.log    - Güvenlik logları
client/logs/client.log      - Client logları
```

## 🔧 Konfigürasyon Dosyaları
```
server/.env                 - Server ayarları
client/config.json          - Client ayarları
client/settings.json        - Kullanıcı ayarları
```

## 📱 Test Cihazı Bilgileri
```
Model: Redmi Note 10 Pro
Chipset: Snapdragon 732G
Android: 11 (MIUI 12.5)
EDL Mode: Volume Down + Power
```

## 🎯 Performans İpuçları
- **SSD kullan** - Daha hızlı işlem
- **USB 3.0** - Hızlı veri transferi  
- **8GB RAM** - Çoklu işlem
- **Antivirus exception** - Tarama atla

## 📞 Destek Seviyeleri

### 🟢 Seviye 1 (Temel)
- Kurulum sorunları
- Basit kullanım hataları
- Dokümantasyon sorular

### 🟡 Seviye 2 (Orta)
- Cihaz uyumluluk sorunları  
- Konfigürasyon hataları
- Performance sorunları

### 🔴 Seviye 3 (İleri)
- Sistem çökmeleri
- Güvenlik sorunları
- API entegrasyonu

## 🏆 Başarı İpuçları
1. **Sabırlı olun** - İşlem süresi değişebilir
2. **Backup alın** - Her zaman yedekleyin
3. **Güncel tutun** - Düzenli güncelleme yapın
4. **Logları okuyun** - Hata mesajlarını anlayın
5. **Destek alın** - Çekinmeden sorun

---

## 🚀 Hızlı Başlangıç Checklist
- [ ] Node.js kurulu
- [ ] Python kurulu  
- [ ] USB driver kurulu
- [ ] Antivirus exception eklendi
- [ ] SETUP_CUSTOMER.bat çalıştırıldı
- [ ] START_SYSTEM.bat test edildi
- [ ] Test cihazı ile denendi
- [ ] Destek bilgileri kaydedildi

**Bu kartı yazdırıp masanızda bulundurun! 📄**
