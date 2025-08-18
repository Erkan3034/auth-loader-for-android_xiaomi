# 📱 Xiaomi Unlock System - Müşteri Kullanım Kılavuzu

## 🎯 Sistem Özeti

**Xiaomi Unlock System**, Android cihazlarınızı güvenli bir şekilde unlock etmenizi sağlayan profesyonel bir sistemdir.

### ✨ Özellikler
- 🔓 **FRP Bypass** - Google hesap kilidi kaldırma
- 🚀 **EDL Mode Unlock** - Emergency Download Mode unlock
- 📱 **Bootloader Unlock** - Bootloader kilidi açma
- 🔐 **Mi Account Bypass** - Xiaomi hesap kilidi kaldırma
- 📊 **İşlem Geçmişi** - Tüm unlock işlemlerinin kayıtları
- 🛡️ **Güvenli API** - HMAC doğrulaması ile güvenli iletişim

## 🚀 Hızlı Başlangıç

### Adım 1: Sistemi Başlatın
```bash
# Windows'ta
cd server
npm start

# Linux/Mac'te
cd server
npm run start
```

### Adım 2: Client'ı Çalıştırın
```bash
cd client
python main.py
```

### Adım 3: Cihazınızı Bağlayın
1. Android cihazınızı USB ile bilgisayara bağlayın
2. **USB Debugging** aktif olmalı
3. Cihazı **EDL/BROM** moduna alın

## 📱 Desteklenen Cihazlar

### Xiaomi Cihazlar
- ✅ **Redmi Series** - Redmi Note, Redmi K serisi
- ✅ **Mi Series** - Mi 11, Mi 12, Mi 13 serisi
- ✅ **POCO Series** - POCO F, POCO X serisi
- ✅ **Black Shark** - Gaming telefonları

### Chipset Desteği
- 🟢 **Qualcomm Snapdragon** - Tam destek
- 🟢 **MediaTek (MTK)** - BROM mode desteği
- 🟢 **Xiaomi Custom** - Mi Assistant mode

## 🎮 Client Kullanımı

### Ana Menü
```
╭──────────────────── Xiaomi Unlock System ────────────────────╮
│   1    Detect Devices          - Cihaz tespiti               │
│   2    Unlock Device           - Cihaz unlock işlemi         │
│   3    Operation History       - İşlem geçmişi               │
│   4    Settings               - Ayarlar                      │
│   5    Test Mode              - Test modu                    │
│   0    Exit                   - Çıkış                        │
╰───────────────────────────────────────────────────────────────╯
```

### 1. Cihaz Tespiti
- **Seçenek 1**'i seçin
- Sistem otomatik olarak bağlı cihazları tarayacak
- Desteklenen modlar: EDL, BROM, Mi Assistant

### 2. Unlock İşlemi
- **Seçenek 2**'yi seçin
- Cihaz listesinden unlock etmek istediğiniz cihazı seçin
- Unlock türünü seçin:
  - **FRP Unlock** - Google hesap kilidi
  - **Bootloader Unlock** - Bootloader kilidi
  - **EDL Bypass** - Emergency mode bypass
  - **Mi Account Bypass** - Xiaomi hesap kilidi

### 3. İşlem Geçmişi
- **Seçenek 3**'ü seçin
- Geçmiş tüm unlock işlemlerini görüntüleyin
- Başarılı/başarısız işlemleri filtreleyin

## 🔧 Ayarlar ve Konfigürasyon

### Client Ayarları
```json
{
  "server": {
    "url": "http://localhost:3000",
    "timeout": 30
  },
  "client": {
    "id": "xiaomi-unlock-client",
    "hmac_secret": "your-secret-key"
  },
  "device": {
    "detection_timeout": 10,
    "operation_timeout": 300
  }
}
```

### Ayar Değiştirme
1. **Seçenek 4** - Settings menüsüne girin
2. Değiştirmek istediğiniz ayarı seçin
3. Yeni değeri girin
4. Ayarları kaydedin

## 📋 Adım Adım Unlock Süreci

### FRP Unlock (Google Hesap Kilidi)
1. **Cihazı hazırlayın:**
   - Cihazı kapatın
   - **Volume Down + Power** tuşlarına basarak EDL moduna alın
   - USB ile bilgisayara bağlayın

2. **Client'ta işlem:**
   - `python main.py` ile client'ı başlatın
   - **1 - Detect Devices** seçin
   - Cihaz tespit edildiğinde **2 - Unlock Device** seçin
   - **FRP Unlock** seçeneğini seçin

3. **İşlem süreci:**
   - Sistem otomatik olarak unlock işlemini başlatır
   - İlerleme çubuğu ile süreci takip edin
   - İşlem tamamlandığında cihaz otomatik olarak yeniden başlar

### Bootloader Unlock
1. **Ön hazırlık:**
   - Cihazda **Developer Options** aktif edin
   - **USB Debugging** ve **OEM Unlocking** aktif edin
   - Mi Unlock Tool ile bootloader unlock izni alın

2. **Unlock işlemi:**
   - Cihazı **Fastboot** moduna alın
   - Client'ta **Bootloader Unlock** seçin
   - İşlem otomatik olarak tamamlanır

### EDL Mode Bypass
1. **EDL moduna alma:**
   - Cihazı kapatın
   - Test point yöntemi veya tuş kombinasyonu ile EDL moduna alın
   - Cihaz "Qualcomm HS-USB QDLoader 9008" olarak görünmeli

2. **Bypass işlemi:**
   - Client'ta **EDL Bypass** seçin
   - Sistem firmware'i bypass eder
   - Cihaz normal modda yeniden başlar

## ⚠️ Önemli Notlar ve Uyarılar

### Güvenlik
- ⚠️ **Backup alın** - İşlem öncesi cihazınızın tam yedeğini alın
- ⚠️ **Garantiyi etkiler** - Unlock işlemi cihaz garantisini geçersiz kılar
- ⚠️ **Risk** - Yanlış işlem cihazı brick edebilir

### Yasal Uyarı
- 📋 **Sadece kendi cihazınızı** unlock edin
- 📋 **Çalıntı cihazlarda** kullanmayın
- 📋 **Yerel yasalara** uygun şekilde kullanın

### Teknik Gereksinimler
- 💻 **Windows 10/11** veya **Linux Ubuntu 18.04+**
- 🔌 **USB 2.0+** port
- 📱 **Qualcomm/MTK** chipsetli Android cihaz
- 🌐 **İnternet bağlantısı** (lisans doğrulama için)

## 🔧 Sorun Giderme

### Yaygın Sorunlar

#### 1. Cihaz Tespit Edilmiyor
**Çözüm:**
```bash
# Windows'ta driver kurulumu
- Device Manager'da cihazı bulun
- Driver'ı güncelleyin
- ADB/Fastboot driver'larını kurun

# Linux'ta izinler
sudo usermod -a -G plugdev $USER
sudo udevadm control --reload-rules
```

#### 2. "Connection Timeout" Hatası
**Çözüm:**
- USB kablosunu değiştirin
- Farklı USB portunu deneyin
- Cihazı yeniden EDL moduna alın

#### 3. "Authentication Failed" Hatası
**Çözüm:**
- HMAC secret'ını kontrol edin
- Server'ın çalıştığından emin olun
- İnternet bağlantısını kontrol edin

#### 4. İşlem Yarıda Kesildi
**Çözüm:**
- Cihazı kapatmayın
- USB kablosunu çıkarmayın
- İşlemi yeniden başlatın

### Log Dosyaları
```bash
# Client logları
client/logs/client.log

# Server logları  
server/logs/combined.log
server/logs/error.log
```

## 📞 Destek ve İletişim

### Teknik Destek
- 📧 **Email:** support@yourdomain.com
- 💬 **Live Chat:** https://yourdomain.com/support
- 📱 **WhatsApp:** +90-XXX-XXX-XXXX

### Destek Saatleri
- 🕐 **Hafta içi:** 09:00 - 18:00
- 🕐 **Hafta sonu:** 10:00 - 16:00
- 🕐 **Tatil günleri:** Kapalı

### Sık Sorulan Sorular (FAQ)

**S: Hangi cihazlar destekleniyor?**
C: Qualcomm ve MediaTek chipsetli tüm Xiaomi/Redmi/POCO cihazlar desteklenmektedir.

**S: İşlem ne kadar sürer?**
C: Cihaz türüne göre 5-30 dakika arası değişir.

**S: Garantim geçersiz olur mu?**
C: Evet, unlock işlemi resmi garantiyi geçersiz kılar.

**S: Geri döndürülebilir mi?**
C: Bootloader unlock geri döndürülebilir, FRP bypass kalıcıdır.

**S: İnternet gerekli mi?**
C: Evet, lisans doğrulama için internet bağlantısı gereklidir.

## 📈 Gelişmiş Kullanım

### Toplu İşlem (Batch Processing)
```bash
# Birden fazla cihazı aynı anda işleme
python main.py --batch --devices device1,device2,device3
```

### Komut Satırı Kullanımı
```bash
# Tek komutla unlock
python main.py --device DEVICE_ID --operation frp_unlock --auto

# İşlem geçmişi
python main.py --history --export csv
```

### API Kullanımı (Gelişmiş)
```python
# Python API örneği
from xiaomi_unlock import XiaomiUnlockClient

client = XiaomiUnlockClient('http://localhost:3000')
devices = client.detect_devices()
result = client.unlock_device(devices[0], 'frp_unlock')
```

---

## 🎯 Sistem Gereksinimleri Özet

| Gereksinim | Minimum | Önerilen |
|------------|---------|----------|
| OS | Windows 10 | Windows 11 |
| RAM | 4GB | 8GB |
| Storage | 2GB | 5GB |
| CPU | Dual Core | Quad Core |
| USB | USB 2.0 | USB 3.0 |
| Internet | 1 Mbps | 5 Mbps |

**🎉 Xiaomi Unlock System kullanmaya başlamak için hazırsınız!**
