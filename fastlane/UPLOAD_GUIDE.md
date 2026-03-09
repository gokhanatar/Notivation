# Notivation — App Store Upload Rehberi

## Hazırlanan Her Şey

### Metadata (30 dil)
| # | Locale | Dil |
|---|--------|-----|
| 1 | en-US | English (U.S.) |
| 2 | tr | Türkçe |
| 3 | ar-SA | Arapça |
| 4 | cs | Çekçe |
| 5 | da | Danca |
| 6 | de-DE | Almanca |
| 7 | el | Yunanca |
| 8 | es-ES | İspanyolca |
| 9 | fi | Fince |
| 10 | fr-FR | Fransızca |
| 11 | he | İbranice |
| 12 | hi | Hintçe |
| 13 | hu | Macarca |
| 14 | id | Endonezce |
| 15 | it | İtalyanca |
| 16 | ja | Japonca |
| 17 | ko | Korece |
| 18 | ms | Malayca |
| 19 | nl-NL | Hollandaca |
| 20 | no | Norveççe |
| 21 | pl | Lehçe |
| 22 | pt-BR | Portekizce (Brezilya) |
| 23 | ro | Romence |
| 24 | ru | Rusça |
| 25 | sk | Slovakça |
| 26 | sv | İsveççe |
| 27 | th | Tayca |
| 28 | uk | Ukraynaca |
| 29 | vi | Vietnamca |
| 30 | zh-Hans | Çince (Basitleştirilmiş) |

Her dil için:
- `name.txt` — Uygulama adı
- `subtitle.txt` — Alt başlık
- `description.txt` — Tam açıklama (~4000 karakter)
- `keywords.txt` — Anahtar kelimeler
- `promotional_text.txt` — Tanıtım metni
- `release_notes.txt` — Yenilikler
- `privacy_url.txt` — Gizlilik politikası URL
- `support_url.txt` — Destek URL
- `marketing_url.txt` — Pazarlama URL

### Screenshots (30 dosya)

| Sıra | Dosya | Açıklama | Kritiklik |
|------|-------|----------|-----------|
| **1** | **01_hero_inbox** | **Morning Brief, Clarity Score, Momentum** | **EN KRİTİK** |
| **2** | **02_note_detail** | **Karar analizi, Artı/Eksi, Confidence** | **EN KRİTİK** |
| **3** | **03_actions_today** | **Görev yönetimi, tarihler, ilerleme** | **EN KRİTİK** |
| 4 | 04_dark_mode_stream | Dark tema ana ekran | Yüksek |
| 5 | 05_decide_screen | Karar ekranı, hızlı kararlar | Orta |
| 6 | 06_tools_screen | Araçlar (Open Loops, Folders, Canvas) | Orta |
| 7 | 07_note_detail_action | Aksiyon notu detayı | Orta |
| 8 | 08_ocean_theme | Ocean tema ana ekran | Düşük |
| 9 | 09_settings | Ayarlar (10 tema, güvenlik, pro) | Düşük |
| 10 | 10_oled_dark | OLED dark tema | Düşük |

3 cihaz boyutu:
- **6.7-inch** (1290×2796) — iPhone 15 Pro Max
- **6.5-inch** (1284×2778) — iPhone 14 Plus
- **5.5-inch** (1242×2208) — iPhone 8 Plus

### App Store Connect Alanları

| Alan | Değer |
|------|-------|
| App Adı | Notivation |
| Bundle ID | com.mindfulnotes.app |
| SKU | com.mindfulnotes.app |
| Birincil Kategori | Utilities |
| İkincil Kategori | Productivity |
| Fiyat | Free (IAP ile) |
| Yaş Derecelendirmesi | 4+ |
| Telif | 2026 Notivation |
| Gizlilik | Data Not Collected |
| Şifreleme | Exempt (platform encryption only) |
| Phased Release | Evet (7 gün kademeli) |

### Abonelikler (App Store Connect'te Manuel Kurulmalı)

| Ürün ID | Tür | Fiyat | Deneme |
|---------|-----|-------|--------|
| `com.mindfulnotes.app.pro.monthly` | Aylık | $3.99 | 7 gün |
| `com.mindfulnotes.app.pro.yearly` | Yıllık | $29.99 | 7 gün |

Abonelik Grubu: **Notivation Premium**

---

## Yükleme Adımları

### Ön Koşullar

1. **App Store Connect API Key** dosyasını al:
   - https://appstoreconnect.apple.com/access/integrations/api
   - "Keys" > "Generate API Key" > "App Manager" rolü
   - `.p8` dosyasını indir
   - `fastlane/AuthKey_XXXXXXXX.p8` olarak kaydet

2. **Fastlane .env dosyasını oluştur:**
   ```bash
   cp fastlane/.env.example fastlane/.env
   # .env dosyasını düzenle ve bilgilerini gir
   ```

### Yükleme

```bash
# Her şeyi yükle (metadata + screenshots + IPA)
./upload-to-appstore.sh

# Sadece metadata + screenshot
./upload-to-appstore.sh metadata

# Sadece doğrulama (yükleme yapmaz)
./upload-to-appstore.sh validate
```

### Yüklemeden Sonra (App Store Connect'te Manuel)

1. **Subscriptions oluştur** (Monetization > Subscriptions):
   - Subscription Group: "Notivation Premium"
   - Pro Monthly: `com.mindfulnotes.app.pro.monthly` ($3.99/ay, 7 gün deneme)
   - Pro Yearly: `com.mindfulnotes.app.pro.yearly` ($29.99/yıl, 7 gün deneme)
   - Bölgesel fiyatlandırmayı `PRICING_STRATEGY.md`'den gir

2. **Privacy Labels** doldur:
   - App Privacy > "Data Not Collected" seç

3. **Age Rating** doldur:
   - Tüm sorulara "None" / "No" cevabı ver
   - Sonuç: 4+

4. **"Submit for Review"** butonuna bas

---

## Dosya Yapısı

```
fastlane/
├── Appfile                    # App identity
├── Deliverfile                # Deliver configuration
├── Fastfile                   # Lane definitions
├── .env.example               # Environment template
├── rating_config.json         # Age rating (4+)
├── review_notes.txt           # App Review notes
├── setup_metadata.mjs         # Metadata converter script
├── UPLOAD_GUIDE.md            # Bu dosya
├── metadata/
│   ├── copyright.txt
│   ├── primary_category.txt
│   ├── secondary_category.txt
│   ├── review_information/
│   │   └── notes.txt
│   ├── en-US/                 # + 29 diğer locale
│   │   ├── name.txt
│   │   ├── subtitle.txt
│   │   ├── description.txt
│   │   ├── keywords.txt
│   │   ├── promotional_text.txt
│   │   ├── release_notes.txt
│   │   ├── privacy_url.txt
│   │   ├── support_url.txt
│   │   └── marketing_url.txt
│   └── ...
└── screenshots/
    └── en-US/
        ├── 00_APP_IPHONE_67_01_hero_inbox.png
        ├── 00_APP_IPHONE_65_01_hero_inbox.png
        ├── 00_APP_IPHONE_55_01_hero_inbox.png
        ├── 01_APP_IPHONE_67_02_note_detail.png
        ├── ...
        └── 09_APP_IPHONE_55_10_oled_dark.png
```
