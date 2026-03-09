# UNIVERSAL STORE DEPLOYMENT MANIFEST v1.6

Bu dosya **herhangi bir uygulama** için App Store ve Google Play Store deployment yapmak üzere tasarlanmıştır.
Herhangi bir projenin kök klasörüne kopyalanır ve Claude Code ile çalıştırılır.

## ÇALIŞMA KURALLARI — MUTLAK

```
⚡ LOW TOKEN MODE — HER ZAMAN AKTİF

1. ODAK: Sadece deployment işine odaklan. Başka bir şey yapma.
2. AÇIKLAMA YASAK: Teori, eğitim, "best practice" anlatısı, uzun yorum YASAK.
3. SORU SINIRI: Sadece tespit EDİLEMEYEN bilgileri sor. Gereksiz soru sorma.
4. DURMAK YOK: İşi %100 bitirene kadar DURMA. Hata alırsan düzelt ve devam et.
5. RAPOR ZORUNLU: Her adımı report dosyasına yaz. Adım başladı → ⏳, bitti → ✅/❌.
6. RETRY: Hata alınca aynı şeyi tekrarlama — FARKLI çözüm dene (max 5 retry).
7. TAM REPO TARAMASI YASAK: Sadece deployment için gereken dosyaları oku.
8. KOD DUMP YASAK: Tam dosya kopyalama yapma, sadece değişen kısımları göster.
9. EMOJI/SÜSLEME YASAK: Rapor dışında emoji, süsleme, gereksiz başlık kullanma.
10. TEK AKIŞ: Pipeline'ı baştan sona takip et, ara adım atlama.
```

```
🔄 İŞ TAMAMLAMA GARANTİSİ

- Bir adım başladıysa BİTİRİLİR. Yarım bırakma.
- Hata alındığında:
  1. Hatayı report'a yaz (tam mesaj + context)
  2. Kök sebebi tespit et
  3. Farklı çözüm uygula
  4. Tekrar dene
  5. 5 denemede çözülmezse → kullanıcıya bildir, diğer adımlara devam et
- Kullanıcı "devam" demeden durmak YOK (kritik onay gerektiren adımlar hariç)
- Kritik onay gerektiren tek adım: Screenshot onayı (çektikten sonra göster)
```

```
📋 RAPOR KURALLARI

- Report dosyası: store-deployment/reports/DEPLOYMENT_REPORT_{{TARIH}}.md
- Her adım için:
  → Başlamadan: "⏳ [ADIM ADI] çalışıyor..."
  → Bitince: "✅ [ADIM ADI] tamamlandı" veya "❌ [ADIM ADI] başarısız: [sebep]"
  → Retry: "🔄 Deneme 2/5: [farklı çözüm açıklaması]"
- Karşılaşılan sorunlar ve çözümler → SORUNLAR VE ÇÖZÜMLER tablosuna yaz
- Report'u her adım sonunda güncelle (oturum sonu DEĞİL, her adım SONUNDA)
- Süre takibi: Her adımın başlangıç ve bitiş zamanı
```

## ÇALIŞMA PRENSİBİ

Claude Code bu dosyayı okuduğunda şu sırayla hareket eder:

```
ADIM 1: PROJE TARAMA (OTOMATİK — soru sormadan)
  → Projeyi tarar, teknoloji stack'ini, dilleri, özellikleri tespit eder
  → Tüm bilgileri APP_CONFIG olarak derler
  → Deploy-blocker sorunları tespit et ve RAPOR'a yaz

ADIM 2: KULLANICIYA SORULAR (Pre-Deployment Questionnaire)
  → Sadece otomatik tespit EDİLEMEYEN bilgileri sorar
  → Tespit edilen bilgileri onay için gösterir
  → Gereksiz soru SORMA — tespit edebildiğini sor-ma

ADIM 3: METADATA OLUŞTURMA (Tüm diller)
  → Her dil için store listing metadata dosyalarını oluşturur
  → Karakter limitlerini doğrular
  → Hepsi PASS edene kadar düzelt

ADIM 4: DEPLOYMENT (Soru sormadan, baştan sona)
  → Build → Screenshot → Upload → Store ayarları → Review
  → Hata alırsa düzeltir ve tekrar dener (max 5 retry)
  → Her adımı REPORT dosyasına yazar
  → Screenshot adımında kullanıcı onayı al, geri kalanında DURMA
```

---

## İÇİNDEKİLER

| # | Bölüm | Açıklama |
|---|-------|----------|
| 1 | [OTOMATİK PROJE TARAMA](#1-otomati̇k-proje-tarama) | Projeyi analiz et, stack tespit et |
| 2 | [PRE-DEPLOYMENT QUESTIONNAIRE](#2-pre-deployment-questionnaire) | Kullanıcıya sorular |
| 3 | [APP_CONFIG ŞABLONU](#3-app_config-şablonu) | Tarama + cevaplardan oluşan config |
| 4 | [STORE LİSTİNG KURALLARI](#4-store-li̇sti̇ng-kurallari) | Karakter limitleri, metadata format, dil kodu eşleme |
| 5 | [METADATA OLUŞTURMA REHBERİ](#5-metadata-oluşturma-rehberi̇) | Her dil için listing.json oluşturma kuralları |
| 6 | [FİYATLANDIRMA STRATEJİSİ](#6-fi̇yatlandirma-strateji̇si̇) | Subscription fiyatları ve tier'lar |
| 7 | [SCREENSHOT GEREKSİNİMLERİ](#7-screenshot-gereksinimleri̇) | Boyutlar, sıralama stratejisi, Puppeteer |
| 8 | [APP STORE CONNECT AYARLARI](#8-app-store-connect-ayarlari) | iOS store yapılandırması |
| 9 | [GOOGLE PLAY CONSOLE AYARLARI](#9-google-play-console-ayarlari) | Android store yapılandırması, API kullanım, kurulum listesi |
| 10 | [PRIVACY & ZORUNLU URL'LER](#10-privacy--zorunlu-urller) | Privacy Policy, Terms of Use |
| 11 | [APP ICON GEREKSİNİMLERİ](#11-app-icon-gereksinimleri̇) | Icon boyutları ve formatları |
| 12 | [BUILD & UPLOAD](#12-build--upload) | iOS ve Android build komutları |
| 13 | [EXECUTION PIPELINE](#13-execution-pipeline) | Deployment adımları |
| 14 | [RED SEBEPLERİ VE ÇÖZÜMLERİ](#14-red-sebepleri̇-ve-çözümleri̇) | En sık rejection sebepleri |
| 15 | [PRE-SUBMISSION CHECKLIST](#15-pre-submission-checklist) | Deploy öncesi kontrol listesi |
| 16 | [OTOMATİK DEPENDENCY KURULUMU](#16-otomati̇k-dependency-kurulumu) | Araç kurulumu |
| 17 | [DEPLOYMENT REPORT SİSTEMİ](#17-deployment-report-si̇stemi̇) | Raporlama formatı |
| 18 | [SUBSCRIPTION LOCALIZATION](#18-subscription-localization) | IAP display name şablonu |
| 19 | [POST-DEPLOYMENT](#19-post-deployment) | Yayın sonrası kontroller |
| 20 | [GÜNCELLEME DEPLOY](#20-güncelleme-deploy-workflow) | Sonraki sürümler için workflow |

---

## 1. OTOMATİK PROJE TARAMA

> **KURAL**: Bu bölümdeki tüm taramaları SORU SORMADAN yap.
> Sonuçları APP_CONFIG'e yaz. Kullanıcıya sadece onay için göster.

### 1.1 Temel Proje Bilgileri

```
TARA VE TESPİT ET:

1. FRAMEWORK TESPİTİ:
   → package.json → dependencies içinde ara:
     - "react" + "react-dom" → React
     - "vue" → Vue
     - "next" → Next.js
     - "@angular/core" → Angular
     - "react-native" → React Native
     - "flutter" → Flutter (pubspec.yaml kontrol et)
     - "ionic" → Ionic
   → Capacitor kontrolü:
     - "@capacitor/core" → Capacitor var, sürümünü not et
     - "cordova" → Cordova var
   → Build tool:
     - "vite" → Vite
     - "webpack" → Webpack
     - "expo" → Expo

2. APP BİLGİLERİ:
   → capacitor.config.ts VEYA capacitor.config.json:
     - appId → BUNDLE_ID
     - appName → APP_NAME
     - webDir → WEB_DIR
   → package.json:
     - name → PACKAGE_NAME
     - version → VERSION
   → Capacitor yoksa:
     - android/app/build.gradle → applicationId
     - ios/*/Info.plist → CFBundleIdentifier

3. DESTEKLENEN DİLLER:
   → Şu klasörleri sırayla kontrol et:
     - src/locales/ (i18next, react-intl)
     - src/i18n/ (alternatif)
     - src/translations/ (alternatif)
     - src/lang/ (alternatif)
     - locales/ (kök dizin)
     - assets/i18n/ (Angular)
     - lib/l10n/ (Flutter)
   → Dosya adlarından dil kodlarını çıkar (en.json → en, zh-CN.json → zh-CN)
   → Dil sayısını not et
   → Dil yoksa: sadece en (İngilizce) varsay

4. VERSİYON BİLGİLERİ:
   → package.json → version
   → android/app/build.gradle → versionCode, versionName
   → ios/App/App/Info.plist → CFBundleShortVersionString, CFBundleVersion
   → Uyumsuzluk varsa: kullanıcıya sor

5. NATIVE PROJE DURUMU:
   → ios/ klasörü var mı? → iOS desteği var
   → android/ klasörü var mı? → Android desteği var
   → ios/App/App.xcworkspace var mı? → CocoaPods/SPM kurulu
   → ios/App/Podfile var mı? → CocoaPods kullanılıyor
   → android/gradlew var mı? → Gradle wrapper mevcut
```

### 1.2 Uygulama Özellik Taraması

```
KAYNAK KODU TARA VE ÖZELLİKLERİ TESPİT ET:

1. AUTH SİSTEMİ:
   → Ara: "signIn", "signUp", "login", "register", "auth", "useAuth"
   → Firebase Auth? Supabase Auth? Custom? Local-only?
   → Sign in with Apple var mı? (iOS zorunluluğu kontrolü)
   → Google Sign-In var mı?
   → Hesap silme (Delete Account) özelliği var mı?
     → Ara: "deleteAccount", "delete account", "hesap sil", "removeAccount"
     → YOKSA: ⛔ Deploy-blocker olarak işaretle

2. ÖDEME SİSTEMİ:
   → Ara: "purchase", "subscribe", "subscription", "IAP", "StoreKit",
          "billing", "paywall", "premium", "pro", "upgrade"
   → Subscription var mı? Product ID'leri neler?
   → Restore Purchases var mı?
     → Ara: "restorePurchases", "restore purchases", "geri yükle"
     → YOKSA ve subscription varsa: ⛔ Deploy-blocker
   → Promo code sistemi var mı?
   → Free tier var mı?

3. BACKEND / API:
   → Ara: "supabase", "firebase", "axios", "fetch", "api", "backend"
   → Hangi backend kullanılıyor?
   → Offline-first mi? (IndexedDB, AsyncStorage, SQLite)
   → AI özellikleri var mı? → Hangi API? (OpenAI, Anthropic, Edge Functions)

4. ROUTING YAPISI:
   → React Router, Vue Router, Navigation kontrol et
   → Route listesini çıkar (ekran adları)
   → Her route = potansiyel screenshot ekranı
   → Public vs Protected route ayrımı

5. TEMA SİSTEMİ:
   → Dark mode var mı?
   → Birden fazla tema var mı?
   → Tema değiştirme mekanizması ne?

6. GAMİFİCATION:
   → Level sistemi var mı?
   → Achievement/badge var mı?
   → Progress tracking var mı?

7. İZİNLER (PERMISSIONS):
   → ios/App/App/Info.plist → Usage descriptions:
     - NSCameraUsageDescription → Kamera
     - NSPhotoLibraryUsageDescription → Fotoğraf
     - NSLocationWhenInUseUsageDescription → Konum
     - NSMicrophoneUsageDescription → Mikrofon
   → android/app/src/main/AndroidManifest.xml → uses-permission:
     - CAMERA, READ_EXTERNAL_STORAGE, ACCESS_FINE_LOCATION, vb.
   → Her izin için: Uygulama gerçekten kullanıyor mu?
   → Kullanılmayan izinler → ⚠️ Uyarı (rejection riski)

8. ÖZEL ÖZELLİKLER:
   → Uygulamayı benzersiz kılan şey ne?
   → Ana değer önerisi (value proposition) ne?
   → Bu bilgi screenshot sıralaması ve store listing için kullanılacak
```

### 1.3 Credential Taraması

```
CREDENTIAL DOSYALARINI BUL:

1. iOS (App Store Connect API):
   → Proje kökünde veya store-deployment/ içinde ara:
     - AuthKey_*.p8 (App Store Connect API key)
     - *.mobileprovision (provisioning profile)
   → Bulunamazsa: /Users/*/Desktop/Deploy/ios/ kontrol et
   → Bulunamazsa: Kullanıcıya sor

2. Android (Google Play Console API):
   → Proje kökünde veya store-deployment/ içinde ara:
     - *service-account*.json (Play Console API key)
     - *.keystore veya *.jks (signing keystore)
   → android/app/build.gradle → signingConfigs kontrol et
   → Bulunamazsa: Kullanıcıya sor

3. GÜVENLİK KONTROLÜ:
   → Keystore şifreleri build.gradle'da hardcoded mi?
     → Evetse: ⚠️ Güvenlik uyarısı ver
   → .gitignore'da credential dosyaları var mı?
     → Yoksa: ⚠️ Uyarı ver
```

### 1.4 Tarama Raporu Formatı

```
Tarama tamamlandıktan sonra kullanıcıya şu raporu göster:

╔══════════════════════════════════════════════════════╗
║              PROJE TARAMA RAPORU                     ║
╠══════════════════════════════════════════════════════╣
║ App Name      : [tespit edilen]                      ║
║ Bundle ID     : [tespit edilen]                      ║
║ Version       : [tespit edilen]                      ║
║ Framework     : [React/Vue/RN + Vite/Webpack]        ║
║ Native        : [Capacitor X.X / Cordova / RN]       ║
║ Diller        : [X dil tespit edildi: en, tr, ...]   ║
║ Auth          : [Local / Firebase / Supabase / Yok]  ║
║ Subscription  : [Var (X ürün) / Yok]                 ║
║ Backend       : [Offline-first / Supabase / Firebase] ║
║ Temalar       : [X tema / Dark mode / Yok]           ║
║ iOS Projesi   : [Var / Yok]                          ║
║ Android Proj. : [Var / Yok]                          ║
╠══════════════════════════════════════════════════════╣
║ ⛔ SORUNLAR:                                         ║
║   - [Delete Account yok / Restore Purchases yok]     ║
║ ⚠️ UYARILAR:                                         ║
║   - [Gereksiz izinler / Hardcoded credentials]       ║
╚══════════════════════════════════════════════════════╝

Bu bilgiler doğru mu? (Evet / Düzeltme var)
```

---

## 2. PRE-DEPLOYMENT QUESTIONNAIRE

> **KURAL**: Sadece otomatik tespit EDİLEMEYEN bilgileri sor.
> Tespit edilen bilgileri varsayılan olarak göster, kullanıcı değiştirebilir.
> Tüm cevaplar alındıktan sonra deployment boyunca HİÇBİR SORU SORMA.

### 2.1 Zorunlu Sorular (Her Zaman Sor)

```
Q1: Developer bilgileri nedir?
    → Ad Soyad:
    → Email:
    → Telefon:
    → Web sitesi: (varsa)
    → Apple Developer Team ID:
    → Google Play Console hesabı var mı?

Q2: Privacy Policy URL nedir?
    → Canlı ve erişilebilir olmalı
    → Yoksa: Oluşturulacak mı?

Q3: Terms of Use URL nedir?
    → Subscription varsa ZORUNLU

Q4: Support URL nedir?
    → App Store zorunlu kılıyor

Q5: Hangi store'lara deploy edilecek?
    → A: Her iki store (App Store + Google Play)
    → B: Sadece App Store
    → C: Sadece Google Play
    → Varsayılan: A

Q6: Önce Test mi, direkt Production mı?
    → iOS: TestFlight → App Review → Release
    → Android: Internal → Closed → Production
    → Varsayılan: Production

Q7: Backend aktif mi?
    → A: Evet, tamamen aktif
       → Review sırasında çalışıyor olmalı
       → Data Safety/App Privacy'de beyan edilmeli
    → B: Kısmen aktif (bazı özellikler)
       → Aktif olmayan özellikler graceful fallback vermeli
    → C: Hayır, tamamen offline
       → Review Notes'ta belirtilmeli
    → Varsayılan: Tarama sonucuna göre
    → ⚠️ Cevaba göre Data Safety, App Privacy, Review Notes otomatik güncellenir

Q8: Google Play Console'da daha önce uygulama yükledin mi?
    → Hayır ise: 20-tester Closed Testing gerekli (14 gün)
    → Varsayılan: Evet

Q9: AB pazarında dağıtım yapılacak mı?
    → Evet ise: EU Digital Services Act trader doğrulaması gerekli
    → Varsayılan: Evet (Worldwide)
```

### 2.2 Koşullu Sorular (Gerektiğinde Sor)

```
EĞER subscription tespit edildiyse:
  Q-SUB1: Subscription fiyatları onaylanıyor mu?
          → Bölüm 6'daki fiyat şablonu gösterilir
  Q-SUB2: Ücretsiz deneme süresi? → Varsayılan: 7 gün
  Q-SUB3: Hangi para biriminden? → Varsayılan: 4 katmanlı otomatik

EĞER çoklu dil tespit edildiyse:
  Q-LANG1: Tüm dillerde metadata oluşturulsun mu?
           → Varsayılan: Evet (tespit edilen tüm diller)
  Q-LANG2: Tüm dillerde screenshot alınsın mı?
           → Varsayılan: Minimum en + [ana pazar dili]

SCREENSHOT SORULARI:
  Q-SS1: Screenshot'larda cihaz çerçevesi kullanılsın mı?
         → Varsayılan: Hayır (tam ekran)
  Q-SS2: Screenshot'larda metin overlay eklensin mi?
         → Varsayılan: Evet
  Q-SS3: Hangi tema/görünüm kullanılsın?
         → Varsayılan: Karışık (farklı temalar)
  Q-SS: Screenshots nasıl alınacak?
     → Puppeteer ile OTOMATİK (her zaman tercih edilen yöntem)
     → Sign-in gerekiyorsa → Puppeteer otomatik giriş yapar
     → Pro/Premium gerekiyorsa → localStorage üzerinden plan aktive edilir
     → Fiyat gizleme → CSS injection ile otomatik
     → Manuel SADECE Puppeteer tamamen başarısız olursa kullanılır

EĞER app icon tespit EDİLEMEDİYSE:
  Q-ICON: App icon hazır mı?
          → iOS: 1024x1024 PNG
          → Android: 512x512 PNG + adaptive icon
```

### 2.3 Screenshot Kuralları (Soru Sormadan Uygula)

```
SCREENSHOT_RULE_0: Sign-in gerekiyorsa localStorage injection ile giriş yap
  → Auth sayfasına git (origin kurulsun)
  → Form doldurmak yerine localStorage'a session/credentials inject et
  → Uygulamanın auth persist key'ini bul (CapacitorStorage.*, auth-token vb.)
  → Reload et ve /app/* rotalarına redirect olduğunu doğrula
  → Form etkileşimi (page.type, page.click) SPA'larda GÜVENİLİR DEĞİL!
  → SONUÇ: Fiyatsız, tam özellikli uygulama ekranları

SCREENSHOT_RULE_0B: İKİ FAZLI SCREENSHOT AKIŞI (Store ÖNCE, Pro SONRA)
  → FAZ 1: Store/Subscription screenshot'larını FREE planda çek
    - Fiyatları CSS ile gizle (visibility: hidden + currency pattern detection)
    - Plan kartları "Upgrade" durumunda görünür (gerçek kullanıcı perspektifi)
  → FAZ 2: En yüksek planı aktive et, kalan screenshot'ları çek
    - Zustand/Redux persist storage key'ini bul ve güncelle
    - Tüm özellikler açık, premium içerik erişilebilir
  → NEDEN: Store sayfası FREE kullanıcının gördüğü haliyle olmalı

SCREENSHOT_RULE_1: Fiyat bilgisi ASLA görünmemeli
  → Fiyat görünüyorsa CSS ile gizle (visibility: hidden + TreeWalker)
  → Apple & Google kuralı: Screenshot'ta fiyat göstermek YASAK
  → Currency pattern detection: [$€£¥₺₹₩₽][0-9.,]+ regex ile text node'ları gizle

SCREENSHOT_RULE_2: Status bar'ı gizle veya temizle
  → CSS: .status-bar { display: none !important; }
  → Veya iOS simulator status bar: 9:41, full signal, full Wi-Fi

SCREENSHOT_RULE_3: Her zaman DOLU ekranlar göster
  → Boş/yeni uygulama ekranı ASLA screenshot olmaz
  → Demo data inject et veya seed data kullan
```

---

## 3. APP_CONFIG ŞABLONU

> Bu bölüm tarama + kullanıcı cevaplarından otomatik doldurulur.

```yaml
# ═══════════════════════════════════════════════════
# Bu değerler PROJE TARAMASI ile otomatik doldurulur
# ═══════════════════════════════════════════════════

# Uygulama Bilgileri
APP_NAME: "{{TARAMA: capacitor.config → appName}}"
BUNDLE_ID: "{{TARAMA: capacitor.config → appId}}"
VERSION: "{{TARAMA: package.json → version}}"
BUILD_NUMBER: {{TARAMA: mevcut build + 1}}
SKU: "{{APP_NAME küçük harf}}-{{YIL}}"

# Framework
FRAMEWORK: "{{TARAMA: React/Vue/Angular/RN}}"
BUILD_TOOL: "{{TARAMA: Vite/Webpack/Expo}}"
NATIVE_BRIDGE: "{{TARAMA: Capacitor X.X / Cordova / RN}}"

# Kategoriler (kullanıcıya sor veya tahmin et)
PRIMARY_CATEGORY_IOS: "{{uygulamanın ana kategorisi}}"
SECONDARY_CATEGORY_IOS: "{{uygulamanın ikincil kategorisi}}"
PRIMARY_CATEGORY_ANDROID: "{{uygulamanın ana kategorisi}}"
ANDROID_TAGS: "{{uygulamayla ilgili 4-5 etiket}}"

# Minimum Gereksinimler
MIN_IOS: "16.0"
MIN_ANDROID_SDK: 24
TARGET_ANDROID_SDK: {{TARAMA: android/variables.gradle → targetSdkVersion}}
COMPILE_ANDROID_SDK: {{TARAMA: android/variables.gradle → compileSdkVersion}}

# Yaş Sınıfı
AGE_RATING_IOS: "{{TARAMA: içerik analizine göre}}"
AGE_RATING_ANDROID: "{{TARAMA: içerik analizine göre}}"

# Varsayılan Dil
DEFAULT_LANGUAGE: "en-US"

# Proje Yolları
PROJECT_ROOT: "{{pwd}}"
IOS_PROJECT: "ios/App/App.xcodeproj"
ANDROID_PROJECT: "android"
WEB_DIR: "{{TARAMA: capacitor.config → webDir}}"
DEPLOY_DIR: "store-deployment"

# Desteklenen Diller
SUPPORTED_LANGUAGES:
  {{TARAMA: src/locales/ içindeki tüm dil kodları}}

# URL'ler (kullanıcıdan alınır)
PRIVACY_URL: "{{Q2 cevabı}}"
SUPPORT_URL: "{{Q4 cevabı}}"
MARKETING_URL: "{{varsa}}"
TERMS_URL: "{{Q3 cevabı}}"

# Developer
DEVELOPER_NAME: "{{Q1 cevabı}}"
DEVELOPER_EMAIL: "{{Q1 cevabı}}"
DEVELOPER_PHONE: "{{Q1 cevabı}}"
TEAM_ID: "{{Q1 cevabı}}"

# Credentials (tarama ile bulunan)
ASC_KEY_FILE: "{{TARAMA: AuthKey_*.p8 yolu}}"
ASC_KEY_ID: "{{TARAMA: key dosyasından}}"
ASC_ISSUER_ID: "{{kullanıcıdan}}"
PLAY_SERVICE_ACCOUNT: "{{TARAMA: *service-account*.json yolu}}"
ANDROID_KEYSTORE: "{{TARAMA: *.keystore yolu}}"

# Özellikler (taramadan)
HAS_SUBSCRIPTION: {{true/false}}
HAS_AUTH: {{true/false}}
HAS_DARK_MODE: {{true/false}}
HAS_AI_FEATURES: {{true/false}}
HAS_OFFLINE_MODE: {{true/false}}
HAS_DELETE_ACCOUNT: {{true/false}}
HAS_RESTORE_PURCHASES: {{true/false}}
BACKEND_TYPE: "{{offline/supabase/firebase/custom}}"
THEME_COUNT: {{sayı}}
LANGUAGE_COUNT: {{sayı}}
```

---

## 4. STORE LİSTİNG KURALLARI

### 4.1 Metadata Dosya Formatı

Her dil için `store-deployment/metadata/<lang_code>/listing.json`:
```json
{
  "title": "max 30 karakter",
  "subtitle": "max 30 karakter (App Store only)",
  "short_description": "max 80 karakter (Play Store only)",
  "full_description": "3900-4000 karakter arası (max 4000)",
  "promotional_text": "max 170 karakter (App Store only, review gerekmez, istediğin zaman değiştirilebilir)",
  "keywords": "95-100 karakter arası, virgülle ayrılmış (App Store only, max 100)",
  "whats_new": "sürüm notları (max 500)"
}
```

### 4.2 Karakter Limitleri — KRİTİK KURALLAR

```
ALAN               iOS (App Store)    Android (Play Store)   HEDEF
──────────────────────────────────────────────────────────────────────
title              max 30             max 30                  Tam kullan
subtitle           max 30             KULLANILMAZ             25-30 arası
short_description  KULLANILMAZ        max 80                  75-80 arası
full_description   max 4000           max 4000                3900-4000 arası
keywords           max 100            KULLANILMAZ             95-100 arası
whats_new          max 4000           max 500                 ≤500 (Play Store limiti)
promotional_text   max 170            KULLANILMAZ             150-170 arası (review gerekmez!)
```

> **KURAL**: Her metin alanı karakter sınırına EN YAKIN şekilde yazılmalı.
> Boş alan bırakma, her karakteri değerlendir.
> CJK dillerde (ja, ko, zh-CN) bile hedef aralığa yaklaşmaya çalış.

### 4.3 Dil Kodu Eşleme (App Store vs Play Store)

> **KRİTİK**: İki store farklı dil kodları kullanır.

```
Yaygın Dil     App Store (ASC)      Play Store (GPC)
─────────────────────────────────────────────────────
ar             ar-SA                ar
de             de-DE                de-DE
en             en-US                en-US
es             es-ES                es-ES
fr             fr-FR                fr-FR
hi             hi                   hi-IN
id             id                   id
it             it                   it-IT
ja             ja                   ja-JP
ko             ko                   ko-KR
nl             nl-NL                nl-NL
pl             pl                   pl-PL
pt             pt-BR                pt-BR
ru             ru                   ru-RU
sv             sv                   sv-SE
th             th                   th
tr             tr                   tr-TR
vi             vi                   vi
zh-CN          zh-Hans              zh-CN
zh-TW          zh-Hant              zh-TW
```

### 4.4 Listing Oluşturma Kuralları

```
✓ Her dil için native-sounding pazarlama metni yaz (çeviri YAPMA)
✓ Her dilin tonuna, kültürüne ve pazarlama diline uygun olsun
✓ Tüm app özelliklerini kapsasın (tarama sonuçlarından)
✓ full_description 3900-4000 karakter arası olsun
✓ keywords 95-100 karakter arası olsun (virgül-ayrılmış, boşluksuz)
✓ keywords'te app adını TEKRARLAMA (zaten indeksleniyor)
✓ title her dilde aynı olsun (marka tutarlılığı)
✗ Doğrudan çeviri YAPMA — native copywriter gibi yaz
✗ Rakip uygulama ismi kullanma
✗ Fiyat bilgisi yazma
✗ "En iyi", "#1" gibi doğrulanamaz iddialar yazma
✗ Aşırı BÜYÜK HARF başlık kullanma (Google spam sayabilir)
✗ 5'ten fazla ünlem işareti kullanma
✗ Aşırı emoji kullanma
```

### 4.5 Android / Play Store Ek Kuralları

```
1. short_description (max 80):
   - Play Store'da başlığın hemen altında görünür — EN KRİTİK alan
   - 75-80 karakter arası kullan
   - CJK dillerde bile 70+ karakter hedefle

2. whats_new (max 500):
   - Play Store limiti 500 — tüm dillerde ≤500 yaz
   - Bullet list formatı kullan

3. full_description (max 4000):
   - Play Store keyword indeksleme buradan yapılır
   - Aranabilir terimler dahil et

4. Metadata Doğrulama:
   Claude Code her dil için şu kontrolü yapmalı:
   - title ≤ 30    ✓/✗
   - subtitle ≤ 30  ✓/✗ (iOS only)
   - short_desc ≤ 80 ✓/✗ (Android)
   - full_desc ≤ 4000 ✓/✗
   - keywords ≤ 100  ✓/✗ (iOS only)
   - whats_new ≤ 500 ✓/✗
   Tüm alanlar PASS ise devam et, aksi halde düzelt
```

---

## 5. METADATA OLUŞTURMA REHBERİ

> Bu bölüm Claude Code'un metadata oluştururken izleyeceği adımları tanımlar.

### 5.1 Metadata Oluşturma Süreci

```
HER DİL İÇİN:

1. UYGULAMA ANALİZİ:
   → Taramada tespit edilen özellikleri listele
   → Uygulamanın değer önerisini belirle
   → Ana hedef kitleyi belirle

2. LISTING.JSON OLUŞTUR:
   → title: App adı (tüm dillerde aynı)
   → subtitle: O dilin doğal ifadesiyle kısa slogan (25-30 karakter)
   → short_description: Kısa ama etkili açıklama (75-80 karakter)
   → full_description: Kapsamlı pazarlama metni (3900-4000 karakter)
     → Yapı:
        a. Duygusal giriş (2-3 cümle)
        b. Ana özellik başlıkları (BÜYÜK HARF başlıklar + paragraflar)
        c. Her özellik grubu için detaylı açıklama
        d. Gizlilik/güvenlik vurgusu
        e. Platform desteği
        f. Dil desteği
        g. Ücretsiz başlangıç + premium tier'lar
        h. Kapanış CTA
   → keywords: Aranabilir terimler (95-100 karakter, virgülle ayrılmış)
   → whats_new: Sürüm notları (≤500 karakter)

3. DOĞRULAMA:
   → Karakter sayılarını Python ile doğrula
   → Limitlerde sorun varsa → düzelt → tekrar doğrula
   → Tüm diller PASS edene kadar tekrarla

4. KAYDETME:
   → store-deployment/metadata/<lang_code>/listing.json
   → JSON formatı, UTF-8 encoding
```

### 5.2 full_description Yapı Şablonu

```
[Duygusal giriş — uygulamanın metaforu veya vizyonu]

[ANA ÖZELLİK 1 — BÜYÜK HARF BAŞLIK]
[Detaylı açıklama — ne yapıyor, nasıl kullanılıyor, neden önemli]

[ANA ÖZELLİK 2 — BÜYÜK HARF BAŞLIK]
[Detaylı açıklama]

[ANA ÖZELLİK 3 — BÜYÜK HARF BAŞLIK]
[Detaylı açıklama]

... (uygulamanın tüm önemli özellikleri)

[GİZLİLİK / GÜVENLİK]
[Veri gizliliği vurgusu]

[PLATFORM DESTEĞİ]
[iOS, Android, Web — hangilerinde kullanılabilir]

[DİL DESTEĞİ]
[Kaç dilde kullanılabilir]

[ÜCRETSİZ BAŞLANGIÇ]
[Free tier ve premium seçenekler]

[Kapanış CTA — eyleme çağrı]
```

---

## 6. FİYATLANDIRMA STRATEJİSİ

> Subscription tespit edildiyse bu bölüm kullanılır.
> Subscription yoksa bu bölüm atlanır.

### 6.1 In-App Purchase Product IDs

```
{{BUNDLE_ID}}.{{tier1_name}}.monthly   → Tier 1 Aylık
{{BUNDLE_ID}}.{{tier1_name}}.yearly    → Tier 1 Yıllık
{{BUNDLE_ID}}.{{tier2_name}}.monthly   → Tier 2 Aylık (varsa)
{{BUNDLE_ID}}.{{tier2_name}}.yearly    → Tier 2 Yıllık (varsa)
```

### 6.2 Subscription Group

```
Group Name    : "{{APP_NAME}} Premium"
Group Level 1 : {{En yüksek tier}} (en yüksek)
Group Level 2 : {{Düşük tier}} (varsa)
```

### 6.3 Ücretsiz Deneme

```
Tüm subscription'lar: 7 gün ücretsiz deneme (free trial)
Trial bitiminde otomatik yenileme
Introductory Offer Type: Free Trial
Billing Grace Period: 16 gün (Apple), etkin (Google)
```

### 6.4 Fiyat Katmanları Şablonu

```
4 katmanlı fiyatlandırma stratejisi:

TIER 1 — Premium Pazarlar (ABD, Kanada, Avustralya, İsviçre, Kuzey Avrupa,
          Japonya, Güney Kore, Singapur, BAE, İsrail)
  → En yüksek fiyat (ör: $4.99/ay, $39.99/yıl)

TIER GULF — Körfez Premium Pazarları (3-4x Tier 1)
  Kuveyt, Katar
  → NOT: Bu ülkelerde alım gücü ve dijital harcama kapasitesi yüksek olduğundan,
    Tier 1 fiyatlarının 3-4 katı uygulanır. Apple/Google fiyat tier'larına yuvarlanır.
    Fiyatlar uygulamaya göre hesaplanır: Tier 1 USD fiyatı × 3.5 → KWD ve QAR karşılığı.

TIER 2 — Orta Gelirli Pazarlar (Güney Avrupa, Doğu Avrupa, Malezya, Tayland)
  → ~%30 indirimli (ör: ~$3.49/ay)

TIER 3 — Gelişmekte Olan Pazarlar (Türkiye, Brezilya, Meksika, Güney Afrika,
          Mısır, Endonezya, Filipinler, Vietnam)
  → ~%60 indirimli (ör: ~$1.99/ay)

TIER 4 — Düşük Gelirli Pazarlar (Hindistan, Pakistan, Bangladeş, Nijerya, Kenya)
  → ~%80 indirimli (ör: ~$0.99/ay)

KURALLAR:
- Yıllık plan her zaman aylığın ~%33 indirimi olmalı
- Fiyatlar .99 ile bitmeli (psikolojik fiyatlandırma)
- Apple/Google fiyat tier'larına yuvarla
- Güney Kore: Trial→ücretli geçişte ek onay gerekli
- Avusturya/Almanya/Polonya: Fiyat artışlarında müşteri onayı gerekli
```

### 6.5 Paywall Gereksinimleri (Her İki Store)

```
Subscription satın alma ekranında ZORUNLU:
- Subscription adı ve süresi
- Tam yenileme fiyatı (EN BELİRGİN fiyat öğesi)
- Deneme süresi detayları
- Gizlilik Politikası linki
- Kullanım Koşulları linki
- Satın alma geri yükleme seçeneği (Restore Purchases)
- Cancel/unsubscribe bilgisi
```

### 6.6 Promosyon Kodu Sistemi (iOS + Android)

#### Temel Kurallar
1. Uygulama içinde hardcoded promo kodu KULLANMA
2. **Native (iOS/Android): Promo UI GİZLİ** — Apple 3.1.1 kuralı gereği
3. **Web: Promo UI görünür** — platform redemption URL'sine yönlendirir
4. **Developer menu Pro toggle:** `import.meta.env.DEV` ile sarmala — production build'de görünmez
5. **Native'de pro vermek için:** App Store Connect > Offer Codes kullan (Apple kurallarına uygun)

#### Apple 3.1.1 Uyumluluğu — KRİTİK
```
Apple Kuralı 3.1.1: Tüm dijital içerik satın alımları App Store'un
in-app purchase sistemi üzerinden yapılmalıdır.

- Native build'de (iOS/Android) promo kodu UI'ı GÖSTERİLMEZ
- Guard: Capacitor.isNativePlatform() → promo UI gizle
- Kod: {!isNative && currentPlan !== 'studio' && ( <PromoCodeUI /> )}
- Native'de premium vermek için: App Store Connect Offer Codes
- Dev/test: import.meta.env.DEV guard'ı ile plan toggle (production'da görünmez)
```

#### iOS — App Store Connect Offer Codes
```
Oluşturma:
1. App Store Connect → uygulamayı seç
2. Subscriptions → Subscription Group → ilgili abonelik
3. Offer Codes sekmesi
4. "Create Offer Code" tıkla
5. Code type: One-time use veya Custom
6. Süre ve indirim oranı belirle
7. Generate → CSV olarak indir

Kullanıcı Redemption (App Store tarafından yönetilir):
- App Store → Account → Redeem Gift Card or Code
- Settings → Apple ID → Redeem Gift Card or Code
- URL: https://apps.apple.com/redeem?ctx=offercodes&code={CODE}

Limitler:
- Offer code başına max 25,000 kod
- Çeyrek başına max 150,000 toplam kod
- Kodlar tek kullanımlık (one-time use)
```

#### Android — Google Play Console Promo Codes
```
Oluşturma:
1. Play Console → uygulamayı seç
2. Monetize → Promotions
3. "Create promotion" tıkla
4. Promo code tipi seç (subscription veya one-time)
5. Kod sayısı belirle
6. Generate → CSV olarak indir

Kullanıcı Redemption (Play Store tarafından yönetilir):
- Play Store → Profile → Payments → Redeem code
- URL: https://play.google.com/redeem?code={CODE}

Limitler:
- Çeyrek başına max 500 promo kod (ücretli uygulamalar/IAP)
- Yıl başına max 10,000 promo kod (abonelikler)
```

#### Web Platform — Promo Code UI
```
- Promo kodu input alanı SADECE WEB'de görünür (native'de gizli)
- Guard: !Capacitor.isNativePlatform()
- Kullanıcı kodu girer → Apply butonuna basar
- nativePayments.redeemPromoCode(code) çağrılır
- Web'de: "Promo codes can only be redeemed on iOS or Android" mesajı gösterilir
```

#### Developer Test Toggle
```
- Sadece DEV build'de görünür: import.meta.env.DEV guard'ı
- Production build'de otomatik olarak kaldırılır (tree-shaking)
- Sarı banner ile Pro/Studio/Free toggle butonları
- Kod: {import.meta.env.DEV && ( <DevPlanToggle /> )}
```

#### Eğer hardcoded promo kodu varsa → Kaldır
```
1. const VALID_PROMO_CODE = '...' → SİL
2. handleApplyPromo() → hardcoded karşılaştırmayı kaldır
3. Promo UI'ı isNative guard ile sarmala (Apple 3.1.1)
4. Dev toggle ekle (import.meta.env.DEV guard ile)
5. APP_SCHEMA.md ve PRO_SCHEMA.md'deki referansları güncelle
```

---

## 7. SCREENSHOT GEREKSİNİMLERİ

### 7.1 App Store (iOS) — Zorunlu Boyutlar

| Cihaz | Piksel (Portrait) | Zorunlu | Notlar |
|-------|-------------------|---------|--------|
| **iPhone 6.7"** | **1290 x 2796** | **EVET** | Apple 6.9" ve 6.7"'yi aynı sınıf sayar |
| **iPhone 6.5"** | **1284 x 2778** | **EVET** | 6.7" yoksa zorunlu |
| **iPhone 5.5"** | **1242 x 2208** | **EVET** | iPhone 8 Plus, 7 Plus, 6s Plus |
| **iPad 13"** | **2064 x 2752** (yeni) veya **2048 x 2732** | **EVET** (iPad varsa) | iPad Pro |

```
FORMAT:
- PNG (tercih) veya JPEG
- sRGB veya Display P3
- Alpha/şeffaflık YOK
- Dosya boyutu: <10MB

SAYILAR:
- Minimum: 1 per device size per dil
- Maksimum: 10 per device size per dil
- HEDEF: 10 (TÜMÜNÜ KULLAN)

İÇERİK KURALLARI:
✓ Gerçek uygulama ekranı göster
✓ Metin overlay eklenebilir (kısa, okunabilir, 5-7 kelime)
✓ İlk screenshot en güçlü görsel olsun
✓ Her dil için ayrı screenshot seti
✓ En az bir dark mode screenshot
✗ Fiyat bilgisi göstermek → YASAK
✗ Android cihaz görseli → YASAK
✗ "App Store'da 1 numara" → YASAK
✗ Placeholder/lorem ipsum → YASAK
✗ Bulanık/düşük kalite → YASAK
```

### 7.2 Google Play Store — Zorunlu Boyutlar

| Grafik Tipi | Boyut (px) | Zorunlu | Notlar |
|-------------|-----------|---------|--------|
| **Feature Graphic** | **1024 x 500** | **EVET** | Her dil için ayrı |
| **Phone Screenshot** | 1080 x 1920 | **EVET** (min 2) | Min 320px, Max 3840px |
| 7" Tablet | 1200 x 1920 | Önerilir | Büyük ekran desteği |
| 10" Tablet | 1600 x 2560 | Önerilir | Büyük ekran desteği |

```
SAYILAR:
- Telefon: Min 2, Max 8 — HEDEF: 8
- Tablet: Max 8 — HEDEF: en az 4
- Feature Graphic: Tam olarak 1

KURALLAR:
- Tüm screenshot'lar aynı yönde olmalı (karışık YASAK)
- Alpha/şeffaflık YOK (24-bit)
- Max 8MB per screenshot
```

### 7.3 Screenshot Sıralama Stratejisi — KRİTİK

> **ÖNEMLİ**: İlk 3 screenshot arama sonuçlarında doğrudan görünür.
> İLK SCREENSHOT = %80 İLK İZLENİM.

```
SIRALAMA STRATEJİSİ (uygulamaya göre uyarla):

Pozisyon 1 — HERO SHOT
  → "Bu app ne yapıyor?" sorusuna 1 saniyede cevap ver
  → Uygulamanın EN ÇEKİCİ, EN DOLU ekranı
  → Boş ekran ASLA
  → Overlay: Uygulamanın tek cümlelik değer önerisi

Pozisyon 2 — TEMEL ÖZELLİK
  → Uygulamayı rakiplerden ayıran ana özellik
  → Detay gösteren, çeşitlilik içeren bir ekran

Pozisyon 3 — WOW FAKTÖRÜ
  → En etkileyici teknoloji/özellik (AI, animasyon, vb.)

Pozisyon 4-8/10 — DİĞER ÖZELLİKLER
  → Temalar, ayarlar, gamification, relaxation, premium, vb.
  → Her screenshot farklı bir özelliği göstermeli
  → Son screenshot: güven (gizlilik, çoklu platform)

ÖZELLİK KAPSAMA KONTROLÜ:
  Screenshot listesi OLUŞTURMADAN ÖNCE uygulamanın tüm özelliklerini listele.
  Ardından her özelliğin en az 1 screenshot'ta temsil edildiğinden emin ol.

  Tipik kapsanması gereken özellikler (varsa):
  □ Ana ekran / core feature (hero shot)
  □ Dashboard / ana sayfa (çoklu içerik)
  □ İkincil sayfalar (her biri farklı özellik)
  □ Tema çeşitliliği (en az 2 farklı tema: light + dark)
  □ Detail/info paneli (derinlik gösterir)
  □ Arama / keşfet / explore (içerik zenginliği)
  □ Profil / istatistik / seviye (kullanıcı bağlılığı)
  □ Premium / mağaza (monetization)
  □ Relaxation / yan özellik (uygulamanın genişliği)
  □ Analytics / grafikler (profesyonellik)

  KRİTİK HATA: 10 ekrandan 6'sı aynı sayfayı göstermek
  → Her ekran FARKLI bir route veya FARKLI bir UI state göstermeli
  → Aynı sayfayı göstermek gerekiyorsa: farklı tema + farklı state (panel açık vs kapalı)

İLK SCREENSHOT KURALLARI:
  ✓ DOLU görünsün
  ✓ Renk kontrastı yüksek olsun
  ✓ Overlay max 5-7 kelime
  ✓ Overlay: duygusal/değer önerisi (özellik listesi DEĞİL)
  ✓ Küçük thumbnail olarak bile çekici görünsün
  ✓ Her dil için ayrı overlay metin
  ✗ Login/splash/onboarding ekranı
  ✗ Boş dashboard
  ✗ Settings ekranı
  ✗ Fiyat/paywall ekranı
```

### 7.4 İki Fazlı Otomatik Screenshot Akışı (Sign-In Dahil)

> **KURAL**: Screenshot otomasyonu HER ZAMAN Puppeteer ile yapılır.
> **ÖNEMLİ**: Store/subscription screenshot'ları FREE planda çekilir (FAZ 1),
> ardından Pro/Premium aktive edilir ve kalan screenshot'lar çekilir (FAZ 2).
> Bu sayede store sayfası gerçek kullanıcı perspektifinden görünür.

```
İKİ FAZLI OTOMATİK SCREENSHOT AKIŞI (Puppeteer):

ADIM 1 — SIGN-IN TESPİTİ VE GİRİŞ
  → Uygulamayı aç, ana sayfaya git
  → /auth veya /login'e redirect oluyorsa → Sign-in gerekli
  → Sign-in gerekiyorsa:
    1. ÖNCELİKLİ: localStorage injection kullan (form doldurmak yerine!)
       - Auth sayfasına git (origin kurulsun)
       - Uygulamanın auth persist key'ini bul ve session inject et
       - Reload et ve /app/*'a redirect olduğunu doğrula
    2. FALLBACK: Form injection başarısız olursa formu doldur
       - Sign Up formunu bul ve doldur (isim + email + şifre)
       - Kayıt başarısızsa Sign In dene
       - Test credentials: screenshot@{app_domain} / Screenshot2026!
    3. Form etkileşimi SPA'larda güvenilir DEĞİL — localStorage tercih et!
  → Sign-in gerekmiyorsa → direkt ADIM 2'ye geç

ADIM 2 — DEMO İÇERİK OLUŞTUR (hâlâ FREE planda!)
  → Boş uygulama ile screenshot ALMA
  → Demo veri oluştur (gerçekçi, renkli, dolu görünsün)

═══════════════════════════════════════════════════
  FAZ 1: STORE SCREENSHOT'LARI (FREE PLAN)
═══════════════════════════════════════════════════

ADIM 3 — STORE/SUBSCRIPTION SCREENSHOT ÇEK (FREE planda)
  → Store/upgrade sayfasına git
  → Fiyatları CSS ile gizle:
    - visibility: hidden → price class'ları
    - TreeWalker + regex → currency pattern içeren text node'ları gizle
  → Plan kartları "Upgrade" butonu ile görünür (kullanıcı perspektifi)
  → Her dil × her cihaz boyutu için store screenshot'ını al
  → SONUÇ: Gerçek bir free kullanıcının göreceği store sayfası (fiyatsız)

═══════════════════════════════════════════════════
  FAZ 2: KALAN SCREENSHOT'LAR (PRO/PREMIUM PLAN)
═══════════════════════════════════════════════════

ADIM 4 — PRO/PREMIUM AKTİVASYON
  → localStorage'da uygulamanın Zustand/Redux/Context persist key'ini bul
  → Plan state'ini en yüksek tier'a ayarla (pro, premium, studio vb.)
  → Sayfayı yeniden yükle
  → SONUÇ: Tüm özellikler açık

ADIM 5 — KALAN SCREENSHOT'LARI ÇEK (PRO/PREMIUM planda)
  → Dil değiştir (localStorage i18nextLng veya eşdeğeri)
  → Tema uygula (varsa)
  → Status bar gizle
  → Her dil × her cihaz boyutu × tüm ekranlar (store HARİÇ)
  → Screenshot al → overlay metin ekle → kaydet

ADIM 6 — FEATURE GRAPHIC OLUŞTUR
  → 1024x500 SVG → PNG (Play Store için, her dil)

ADIM 7 — DOĞRULA
  → Boyut kontrolü (piksel bazında)
  → Alpha channel kontrolü (olmamalı)
  → Fiyat görünürlük kontrolü
  → Store screenshot'ları FREE planda mı çekildi?
```

#### Manuel Fallback (Puppeteer başarısız olursa)

```
Eğer Puppeteer sign-in yapamaz veya plan aktivasyonu başarısız olursa:

1. Kullanıcı screenshotları MANUEL alır
2. Dosya isimlendirme: {dil_kodu}{sıra_no}.png (en1, en2, tr1, tr2...)
3. Sıralama Claude Code belirler (kullanıcı DEĞİL)
4. Klasörlere koy: screenshots/appstore/{boyut}/{lang}/
5. Claude Code dosyaları store-uyumlu isimlere dönüştürür
6. FİYAT GİZLEME zorunlu — Store sayfasında fiyat görünmemeli
```

### 7.5 Screenshot Otomasyon Sistemi (Puppeteer)

#### Cihaz Konfigürasyonları

```javascript
const SCREENSHOT_CONFIGS = {
  // App Store
  'appstore-6.7':  { viewport: { width: 430, height: 932 },  scale: 3 },  // 1290x2796
  'appstore-6.5':  { viewport: { width: 428, height: 926 },  scale: 3 },  // 1284x2778
  'appstore-5.5':  { viewport: { width: 414, height: 736 },  scale: 3 },  // 1242x2208
  'appstore-ipad': { viewport: { width: 1024, height: 1366 }, scale: 2 }, // 2048x2732
  // Play Store
  'playstore-phone':    { viewport: { width: 360, height: 640 },  scale: 3 },  // 1080x1920
  'playstore-tablet-7': { viewport: { width: 600, height: 960 },  scale: 2 },  // 1200x1920
  'playstore-tablet-10':{ viewport: { width: 800, height: 1280 }, scale: 2 },  // 1600x2560
};
```

#### Ekran Tanımlama Yapısı

```javascript
// Her ekran bir obje ile tanımlanır:
const SCREENS = [
  {
    name: '01_hero_shot',       // Dosya adı (sıralama numarası dahil)
    route: 'SPACE',             // Rota (özel veya doğrudan URL)
    theme: 'garden-default',    // Uygulanacak tema
    spaceIdx: 0,                // Hangi demo space kullanılacak (0, 1, 2...)
  },
  {
    name: '02_dashboard',
    route: '/app/garden',       // Doğrudan URL
    theme: 'garden-default',
  },
  // ... her ekran için farklı route/theme/spaceIdx
];

// Özel route sabitleri:
// 'SPACE'      → /app/space/{spaceIds[spaceIdx]} olarak çözümlenir
// 'SPACE_NODE' → Aynı URL ama node detail paneli açılır
// '/app/xxx'   → Doğrudan bu URL'ye navigate edilir
```

#### Overlay Metin Tanımları

```javascript
// Her ekran için çok dilli overlay metinleri:
const OVERLAY_TEXTS = {
  '01_hero_shot':  { en: 'Ideas Grow Here',    tr: 'Fikirlerinizi Yeşertin' },
  '02_dashboard':  { en: 'Your Digital Garden', tr: 'Dijital Bahçeniz' },
  // ... her ekran her dil
};
// Kural: max 5-7 kelime, duygusal/değer önerisi, özellik listesi DEĞİL
```

#### takeScreenshot() Akışı

```
Her screenshot için şu adımlar sırayla uygulanır:

1. Viewport ayarla (cihaz boyutu + deviceScaleFactor)
2. Tema KOŞULSUZ uygula (localStorage + CSS variables)
   → Önceki ekranın teması sızmasın diye DEFAULT tema dahil sıfırla
3. Rota çözümle:
   → 'SPACE' ise → spaceIds[screen.spaceIdx] ile URL oluştur
   → 'SPACE_NODE' ise → aynı URL ama sonra node click yapılacak
   → Doğrudan URL ise → olduğu gibi kullan
4. page.goto(url, { waitUntil: 'networkidle0' })
5. 2 saniye delay (Zustand hydration + lazy load)
6. Temayı tekrar uygula (React hydration override edebilir)
7. Space route ise: React Flow node'ları bekle + fitView uygula
8. Status bar gizle (CSS injection)
9. Özel aksiyonlar çalıştır:
   → SPACE_NODE: leaf node tıkla → detail panel açılsın
   → Diğer özel aksiyonlar (tab seçimi, modal açma vb.)
10. 1 saniye delay (animasyonlar tamamlansın)
11. Screenshot al (PNG)
12. Boyut doğrula (expected = viewport × scale)
    → Uyuşmuyorsa sharp ile resize
13. Overlay metin ekle (dile göre)
14. Alpha channel kaldır (flatten)
15. Kaydet
```

#### Önemli Mimari Kararlar

```
KARAR 1: HER ekranda KOŞULSUZ tema sıfırlama
  → "if (theme !== default)" YANLIŞ YAKLAŞIM — tema kalıntısı yaratır
  → Doğru: applyTheme(page, screen.theme) → HER ekranda, koşulsuz

KARAR 2: Space ID DİZİSİ kullan, tekil ID DEĞİL
  → Demo data'dan spaceIds = spaces.map(s => s.id) dizisi çıkar
  → Her ekran screen.spaceIdx ile kendi space'ini seçer
  → Farklı ekranlar farklı space'lere navigate edebilir

KARAR 3: Leaf node tıklaması detail paneli açar
  → Parent/category node → collapse/expand → detail panel AÇILMAZ
  → Store'dan edge verilerini oku → leaf node'ları bul → leaf'e tıkla
  → Puppeteer page.click(selector) kullan — dispatchEvent ÇALIŞMAZ
  → React Flow kendi event sistemi var, sentetik DOM event'leri yoksayar
  → Selector'ı page.evaluate'den return et, sonra page.click() çağır

KARAR 4: İki fazlı fiyat yönetimi
  → FAZ 1 (Paywall): FREE plan → fiyatlar GÖRÜNÜR (IAP review için)
  → FAZ 2 (Store listing): Premium plan → fiyat endişesi yok

KARAR 5: Her ekranın benzersizliğini garanti et
  → 10 screenshot = 10 farklı GÖRÜNEN ekran
  → Kontrol: farklı route VEYA farklı tema VEYA farklı UI state
  → Script bitince görsel doğrulama YAP
```

### 7.6 Screenshot Dosya Yapısı

```
store-deployment/screenshots/
├── appstore/
│   ├── 6.7-inch/{tüm diller}/*.png
│   ├── 6.5-inch/{tüm diller}/*.png
│   ├── 5.5-inch/{tüm diller}/*.png              # 1242 x 2208 — iPhone 8 Plus, 7 Plus, 6s Plus
│   └── ipad-12.9/{tüm diller}/*.png
├── playstore/
│   ├── phone/{tüm diller}/*.png
│   ├── tablet-7/{en, ana_dil}/*.png
│   ├── tablet-10/{en, ana_dil}/*.png
│   └── feature-graphic/{tüm diller}.png
```

### 7.7 Feature Graphic

```
Boyut    : 1024 x 500
Arka plan: Ana tema renkleri
İçerik   : App icon + App adı + Kısa slogan
Safe zone: Kenarlardan 24px boş bırak
Format   : PNG 24-bit, alpha yok
```

### 7.8 Screenshot Troubleshooting (Puppeteer)

> Bu bölüm önceki deployment'larda karşılaşılan ve çözülen sorunları içerir.
> Yeni bir uygulama deploy ederken bu sorunları proaktif olarak önle.

```
SORUN 1: Tüm screenshot'lar Sign In / Login ekranı gösteriyor
  Sebep  : Auth state inject edilmedi veya Puppeteer form etkileşimi başarısız
  Çözüm  : localStorage injection kullan (form doldurmak yerine).
           CapacitorStorage veya uygulamanın persist key'ine session yaz.
           Reload et ve /app/* rotalarına redirect olduğunu doğrula.

SORUN 2: Sayfa tamamen boş (beyaz ekran)
  Sebep  : JavaScript crash, Zustand hydration hatası, veya missing import
  Çözüm  : page.on('pageerror', ...) ile console hatalarını yakala.
           Zustand persist formatını doğrula: { state: {...}, version: N }.
           Tüm import'ları kontrol et.

SORUN 3: Canvas/harita boş (bileşen render oluyor ama içerik yok)
  Sebep  : Demo veri inject edilmedi veya Zustand hydration timing sorunu
  Çözüm  : localStorage'a inject et + sayfayı reload et.
           Zustand persist key ve version numarasının doğru olduğundan emin ol.
           React Flow varsa: fitView prop mount'ta çalışır ama veri henüz
           yüklenmemiş olabilir → manuel fitView uygula.

SORUN 4: React Flow fitView çalışmıyor (node'lar viewport dışında)
  Sebep  : fitView prop, Zustand hydration tamamlanmadan çalışıyor
  Çözüm  : .react-flow__node selector ile node'ların DOM'a eklendiğini bekle.
           Node'ların CSS transform: translate(Xpx, Ypx) değerlerinden
           bounding box hesapla. .react-flow__viewport üzerinde
           translate + scale transform uygula.

SORUN 5: Welcome/Onboarding overlay ekranı kapıyor
  Sebep  : İlk kullanıcı deneyimi overlay'i gizlenmedi
  Çözüm  : Preferences/settings store'unda welcomeSeen: true,
           onboardingComplete: true gibi flag'leri inject et.

SORUN 6: Node/element tıklama başarısız
  Sebep  : SVG elemanlarında .click() fonksiyonu olmayabilir
  Çözüm  : element.click() yerine dispatchEvent(new MouseEvent('click',
           { bubbles: true })) kullan. SVG node'lar için parent wrapper
           element'ı (.react-flow__node gibi) hedefle.

SORUN 7: Tema değişikliği yansımıyor
  Sebep  : React hydration CSS override yapıyor
  Çözüm  : 1) localStorage store state'ini güncelle, 2) CSS variable'ları
           doğrudan document.documentElement.style ile override et,
           3) Navigate ettikten SONRA tekrar uygula. Dark tema için
           document.documentElement.classList.add('dark') ekle.

SORUN 8: Screenshot'lar hep aynı sayfayı gösteriyor
  Sebep  : Tüm space/route screenshot'ları aynı ID'ye/URL'ye navigate ediyor
  Çözüm  : Demo data'da birden fazla space/proje/dosya oluştur.
           SCREENS dizisinde her ekrana spaceIdx (veya benzeri) özelliği ekle.
           takeScreenshot fonksiyonunda ID dizisinden doğru index'i seç.
           Her screenshot FARKLI bir route veya FARKLI bir space göstermeli.
           Ayrıca her birine FARKLI tema uygulayarak görsel çeşitlilik sağla.
           Hedef: 10 screenshot = 10 farklı görünen ekran.

SORUN 9: Paywall screenshot'ları sadece bir tab gösteriyor
  Sebep  : Store sayfası birden fazla tab içeriyor ama varsayılan tab açılıyor
  Çözüm  : ?tab= URL parametresi ile doğrudan ilgili tab'a navigate et.
           Her satın alma türü (subscription, IAP, credit) için ayrı screenshot.

SORUN 10: IndexedDB version conflict (Dexie)
  Sebep  : Puppeteer'dan IndexedDB'yi Dexie başlamadan açma
  Çözüm  : IndexedDB'yi doğrudan AÇMA. Auth ve veri için localStorage
           injection yeterli. Dexie kendi versiyonlama mantığını kullanır;
           dışarıdan açmak conflict yaratır.

SORUN 11: Fiyat bilgileri store listing screenshot'larında görünüyor
  Sebep  : Store sayfası screenshot'ında $ / € / ₺ fiyat bilgisi var
  Çözüm  : İki fazlı yaklaşım:
           FAZ 1 (Paywall): FREE planda, fiyatlar GÖRÜNÜR — IAP review için
           FAZ 2 (Store listing): Premium planda + CSS ile fiyat gizleme:
             - visibility: hidden → price class'ları
             - TreeWalker + regex → currency pattern text node'ları gizle
             - Regex: /[$€£¥₺₹₩₽][0-9.,]+/gi

SORUN 12: Screenshot'ta alpha channel var (store reject eder)
  Sebep  : PNG screenshot varsayılan olarak alpha channel içerir
  Çözüm  : sharp(buffer).flatten({ background: { r: 255, g: 255, b: 255 } })
           Her screenshot'ı kaydetmeden önce flatten uygula.
           App Store ve Play Store alpha channel kabul ETMEZ.

SORUN 13: Screenshot boyutları yanlış (store gereksinimleri karşılamıyor)
  Sebep  : deviceScaleFactor hesaba katılmıyor
  Çözüm  : Beklenen boyut = viewport.width × scale, viewport.height × scale
           Örn: 430×932 viewport, scale 3 = 1290×2796 piksel
           Screenshot sonrası sharp ile metadata kontrol et.
           Boyut uyuşmuyorsa resize(expectedW, expectedH, { fit: 'fill' })

SORUN 14: Auth re-inject sonrası hala /auth'a redirect oluyor
  Sebep  : SPA router, state değişince bazen yeniden kontrol yapmıyor
  Çözüm  : Auth inject et → page.goto('/app/...') → 2s bekle →
           pathname kontrol et → hala /auth ise → tekrar inject + reload.
           İkinci deneme de başarısızsa Puppeteer'ı kapatıp yeni sayfa aç.

SORUN 15: Tema kalıntısı — Önceki ekranın teması sonraki ekrana sızıyor
  Sebep  : applyTheme() sadece garden-default dışı temalar için çalıştırılıyor.
           Screen 04 midnight-focus uygulayınca, screen 05 garden-default
           olmasına rağmen karanlık tema kalıyor.
  Çözüm  : HER ekran için — default tema dahil — navigasyondan ÖNCE
           applyTheme() çağır. "if (theme !== 'default')" koşulu YANLIŞ.
           Doğru yaklaşım: koşulsuz, HER ekranda tema sıfırla + uygula.
           localStorage store state'i + CSS variable'ları birlikte güncelle.

SORUN 16: Detail/info panel tıklamayla açılmıyor
  Sebep  : İki ayrı sorun olabilir:
           A) Parent/category node'lara tıklamak collapse/expand yapar,
              detail panel AÇMAZ. Sadece leaf node'lar panel açar.
           B) React Flow, dispatchEvent ile oluşturulan sentetik DOM
              event'lerini YOKSAYAR. Kendi event sistemi var.
  Çözüm  : 1) Store'dan edge verilerini oku (parent edge'lerin source'ları)
           2) Parent ID setini oluştur
           3) Bu sette OLMAYAN node'ları bul (leaf nodes)
           4) page.evaluate() ile leaf node selector'ını DÖNDÜR
           5) Puppeteer page.click(selector) kullan (gerçek browser event)
           6) 2-3 saniye bekle (panel animasyonu tamamlansın)
           KRİTİK: dispatchEvent(new MouseEvent('click')) ÇALIŞMAZ
           React Flow'da. Sadece Puppeteer native click çalışır.
           Örnek:
             const sel = await page.evaluate(() => {
               const parentIds = new Set(edges.filter(e => e.kind === 'parent').map(e => e.source));
               const leaf = nodes.find(n => !parentIds.has(n.id));
               return leaf ? `[data-id="${leaf.id}"]` : null;
             });
             if (sel) await page.click(sel);

SORUN 17: İki screenshot aynı görünüyor (farklı ekran olmasına rağmen)
  Sebep  : Aynı space + aynı tema = görsel olarak aynı.
           Örn: 01_hero ve 05_node_detail aynı space/tema ise, detail panel
           açılmadığında neredeyse aynı görünür.
  Çözüm  : Her ekran en az BİR benzersiz özellik göstermeli:
           - Farklı space (spaceIdx)
           - Farklı tema (tema rengi)
           - Farklı UI state (panel açık, modal görünür)
           - Farklı route (tamamen farklı sayfa)
           Doğrulama: Tüm screenshot'ları yan yana koy ve göz atla.
           İki tanesi benzer görünüyorsa → birinin route, tema veya state'ini değiştir.
```

#### GENEL İPUÇLARI (Tüm Puppeteer Screenshot İşlemleri İçin)

```
1. HER ZAMAN networkidle0 bekle + en az 2 saniye ek delay ekle
   → SPA render, Zustand hydration ve lazy load tamamlansın

2. Console hatalarını MUTLAKA yakala:
   → page.on('pageerror', err => errors.push(err.message))
   → Boş ekran sorunlarının %90'ı burada görünür

3. Her adımda diagnostics yap:
   → window.location.pathname kontrol et (doğru sayfada mıyız?)
   → document.querySelectorAll('.target-element').length kontrol et
   → document.body.innerText.length > 0 kontrol et (boş mu?)

4. Form etkileşimi ASLA kullanma:
   → page.type(), page.click() güvenilir DEĞİL SPA'larda
   → HER ZAMAN localStorage / sessionStorage injection kullan
   → Zustand, Redux, Context persist key'lerini bul ve inject et

5. Zustand persist formatı MUTLAKA doğru olmalı:
   → { state: { ... }, version: N }
   → version numarası store tanımındaki version ile EŞLEŞMELİ
   → Yanlış version = store hydration başarısız = boş uygulama

6. Capacitor Preferences web fallback formatı:
   → localStorage key: 'CapacitorStorage.' + originalKey
   → Örn: CapacitorStorage.mindbloom_session
   → Mobilde Capacitor.Preferences.get() bu key'i okur

7. Tema değişikliklerini navigate SONRASI tekrar uygula:
   → React hydration CSS variable'ları override edebilir
   → applyTheme() fonksiyonunu goto() SONRASI tekrar çağır

8. Demo data'da HER ZAMAN en az 3 farklı proje/space oluştur:
   → Her screenshot farklı bir proje gösterebilsin
   → Farklı temalar ile görsel çeşitlilik sağla

9. Tema değişikliğini HER ekranda koşulsuz uygula:
   → "if (theme !== 'default')" YANLIŞ — önceki tema sızar
   → applyTheme(page, screen.theme) → KOŞULSUZ, HER ekranda
   → Hem localStorage store hem CSS variable'ları birlikte güncelle
   → Navigate SONRASI tekrar uygula (React hydration override edebilir)

10. Detail/info panel screenshot'ı için LEAF node tıkla:
    → Parent/category node = collapse/expand (panel AÇILMAZ)
    → Leaf node = detail panel açılır
    → Store'dan edge verilerini oku → parent set oluştur → leaf bul
    → Puppeteer page.click(selector) kullan — page.evaluate içinde
      dispatchEvent ÇALIŞMAZ (React Flow sentetik event'leri yok sayar)
    → Selector'ı page.evaluate'den return et, sonra page.click() çağır

11. Her screenshot'ın BENZERSIZ görünmesini doğrula:
    → Script bitince tüm screenshot'ları aç ve yan yana kontrol et
    → İki screenshot birbirine benziyorsa → route/tema/state farklılaştır
    → En az BİR benzersiz özellik: farklı space, tema, açık panel, farklı sayfa

12. Uygulamanın ÖNEMLİ özelliklerini belirle ve kapsama al:
    → Her temel özellik en az 1 screenshot'ta görünmeli
    → Eksik kalan özellik = kaçırılan pazarlama fırsatı
    → Kontrol listesi: ana ekran, dashboard, profil, ayarlar, premium,
       tema çeşitliliği, arama/explore, detay paneli, gamification
```

#### SCREENSHOT DAVRANIS KURALLARI (Eğer ... Olursa ... Davran)

```
EĞER screenshot'ta yanlış/önceki tema görünüyorsa:
  → HER ekranda koşulsuz applyTheme(page, screen.theme) çağır.
  → "if (theme !== 'default')" KULLANMA — default tema dahil sıfırla.
  → localStorage store state'ini güncelle + CSS variable override uygula.
  → Navigate SONRASI tekrar uygula (React hydration override edebilir).

EĞER detail/info paneli tıklamayla açılmıyorsa:
  → Önce hedef node'un LEAF (çocuksuz) olduğundan emin ol.
  → Parent/category node tıklanınca collapse/expand olur, panel AÇILMAZ.
  → Store'dan edge verilerini oku → parent set oluştur → leaf bul.
  → page.evaluate() ile selector DÖNDÜR, sonra page.click(selector) kullan.
  → dispatchEvent(MouseEvent) KULLANMA — React Flow yok sayar.

EĞER dispatchEvent veya element.click() çalışmıyorsa:
  → Puppeteer native page.click(selector) kullan.
  → React Flow, Radix UI gibi kütüphaneler kendi event sistemi kullanır.
  → Sentetik DOM event'leri bu kütüphanelerin handler'larını TETIKLEMEZ.
  → page.click() gerçek browser-level mouse event üretir → her zaman çalışır.

EĞER iki screenshot birbirine çok benziyorsa:
  → Her ekranın en az BİR benzersiz özelliği olmalı.
  → Farklı space (spaceIdx), farklı tema, farklı UI state veya farklı route.
  → Aynı sayfayı farklı göstermek için: panel aç, tema değiştir, zoom değiştir.
  → Script bitince TÜM screenshot'ları yan yana aç ve kontrol et.

EĞER screenshot'ta boş/beyaz alan çok fazlaysa:
  → Demo data'da daha fazla içerik oluştur (node, kart, liste öğesi).
  → fitView'u manuel uygula (Zustand hydration timing sorunu olabilir).
  → Viewport boyutunu kontrol et — küçük viewport = daha dolu ekran.

EĞER tıklanan node yanlış aksiyonu tetikliyorsa (collapse vs detail):
  → Node'un çocuğu var mı kontrol et (edge'lerden parent ilişkisi).
  → Çocuğu olan node = parent → collapse/expand yapar.
  → Çocuğu olmayan node = leaf → detail panel açar.
  → Leaf node bulamıyorsan demo data'ya çocuksuz node ekle.

EĞER screenshot boyutu store gereksinimine uymuyorsa:
  → deviceScaleFactor hesapla: piksel = viewport × scale.
  → Screenshot sonrası sharp ile metadata kontrol et.
  → Uyuşmuyorsa: sharp.resize(expectedW, expectedH, {fit:'fill'}).

EĞER alpha channel hatası alırsan (store upload reject):
  → sharp(buffer).flatten({background:{r:255,g:255,b:255}}).png().toBuffer()
  → HER screenshot'ı kaydetmeden ÖNCE flatten uygula.

EĞER React hydration tema/state'i override ediyorsa:
  → Navigate SONRASI 2 saniye bekle.
  → Ardından tema/state'i TEKRAR uygula.
  → Hem localStorage hem CSS variable'ları birlikte güncelle.
  → React hydration 1-2 saniye sürebilir; beklemeden override geçersiz olur.

EĞER Zustand store hydration başarısız oluyorsa (boş uygulama):
  → Persist key adını doğrula (tam eşleşme şart).
  → Version numarasını doğrula (store tanımındaki ile EŞLEŞMELİ).
  → Format: { state: { ... }, version: N } — eksik field = başarısız hydration.
  → Inject sonrası page.reload() + 3 saniye delay.

EĞER auth redirect döngüsü varsa:
  → Auth inject et → navigate → 2s bekle → pathname kontrol et.
  → Hala /auth ise → tekrar inject + reload.
  → Hala başarısızsa → Puppeteer'ı kapat, yeni page aç, baştan inject et.
```

#### DEPLOYMENT DAVRANIS KURALLARI (Eğer ... Olursa ... Davran)

```
EĞER Google Play API "Package not found" hatası veriyorsa:
  → Uygulama Play Console'da oluşturulmuş mu kontrol et.
  → Oluşturulmuşsa: İlk AAB Play Console'dan MANUEL yüklenmeli.
  → Google Play API ilk AAB yüklemesini DESTEKLEMİYOR — bu Google'ın kısıtlaması.
  → İlk AAB yüklendikten sonra tüm sonraki upload'lar API/fastlane ile yapılabilir.
  → Service account erişimini de kontrol et: Ayarlar → API erişimi → Uygulamaları yönet.

EĞER Google Play API "Precondition check failed" veriyorsa:
  → Play Console'da kurulum kontrol listesi tamamlanmamış (Bölüm 9.8).
  → Content rating, data safety, hedef kitle, reklamlar, uygulama erişimi kontrol et.
  → Dashboard'daki TÜM maddeler yeşil tik olmalı.

EĞER Google Play API "Only releases with status draft may be created on draft app" veriyorsa:
  → Uygulama hala "draft" durumunda — kurulum kontrol listesi eksik.
  → Bu hata production VE internal track için geçerli (draft dışı status kullanılamaz).
  → Play Console'da tüm zorunlu alanları doldur (Bölüm 9.8), sonra tekrar dene.

EĞER fastlane supply "undefined method 'size' for nil" veriyorsa:
  → Track parametresi yanlış. AAB'nin yüklendiği track ile eşleştir.
  → Internal'a yüklenen AAB için track: "internal" kullan.
  → Production'da release yokken track: "production" kullanırsan bu hata gelir.

EĞER fastlane supply çalışıyor ama screenshots yüklenmiyorsa:
  → metadata_path doğru mu kontrol et (fastlane/metadata/android).
  → Dosya yapısı: metadata/android/{language}/images/{imageType}/{dosya}.png
  → imageType: phoneScreenshots, sevenInchScreenshots, tenInchScreenshots
  → Dosya adları alfabetik sıralanır — sıralama için "1_", "2_" prefix kullan.

EĞER Google Play icon yüklenmemişse:
  → Fastlane supply icon yükleyemiyor — doğrudan API kullan.
  → POST /upload/.../listings/{lang}/icon?uploadType=media (Content-Type: image/png)
  → 512x512 PNG olmalı — daha büyük veya küçük reject edilir.
  → Her dil için ayrı yükle (en-US, tr-TR vb.).

EĞER Play Console'da "uygulama erişimi" eksikse:
  → Uygulama içeriği → Uygulama erişimi.
  → Login gerektirmeyen veya yerel auth: "Tüm işlevler kısıtlama olmadan"
  → Gerçek backend auth varsa: test hesabı bilgilerini gir.

EĞER Python'da Google API çağrısı SSL hatası veriyorsa:
  → macOS'ta Python SSL sertifika sorunu yaygın.
  → Node.js kullan (https modülü sorunsuz çalışır).
  → Veya Ruby (fastlane) kullan.
  → Python zorunluysa: import ssl; ssl._create_default_https_context = ssl._create_unverified_context
    (güvenlik riski — sadece geliştirme ortamında).

EĞER GitHub repo'su private ise ve GitHub Pages gerekiyorsa:
  → Private repo'da GitHub Pages çalışmaz (ücretsiz plan).
  → Privacy policy için harici hosting kullan (WordPress, Notion, basit web sitesi).
  → ASLA public repo oluşturup kullanıcının kodunu expose etme.
  → Kullanıcının mevcut web sitesini sor ve orayı kullan.

EĞER production'a çıkarken "draft app" hatası geliyorsa:
  → Uygulamayı ÖNCE internal testing'de yayınla (status: completed).
  → Sonra production'a promote et.
  → Yeni uygulamalar için Google Play review süreci gerekir.
  → İlk production release → 1-7 gün review süresi.

EĞER uygulamada hardcoded promo kodu varsa:
  → KALDIR. Apple 3.1.1 kuralı: Tüm dijital satın alımlar App Store IAP üzerinden olmalı.
  → Uygulama içi kendi promo kodu validasyonu YASAK (native build'de).
  → Promo UI'ı native build'de GİZLE: Capacitor.isNativePlatform() guard kullan.
  → Web'de gösterebilirsin ama local validation YAPMA — platform redemption URL'sine yönlendir.
  → Premium vermek için: App Store Connect > Offer Codes (iOS), Play Console > Promotions (Android).
  → Dev/test için: import.meta.env.DEV guard'ı ile plan toggle ekle (production'da görünmez).

EĞER Apple review "3.1.1 Business - Payments - In-App Purchase" reddi gelirse:
  → Promo code UI'ın native build'de gizli olduğunu doğrula.
  → Hardcoded promo kodu kalmadığını doğrula.
  → Developer menu/toggle'ın production build'de görünmediğini doğrula.
  → Tüm satın alma akışlarının StoreKit üzerinden gittiğini doğrula.
```

---

## 8. APP STORE CONNECT AYARLARI

### 8.1 App Oluşturma
```
New App:
  Platform          : iOS
  Name              : {{APP_NAME}}
  Primary Language  : English (U.S.)
  Bundle ID         : {{BUNDLE_ID}}
  SKU               : {{SKU}}
  User Access       : Full Access
```

### 8.2 App Information
```
Name                    : {{APP_NAME}}
Subtitle                : (listing.json → subtitle)
Category                : {{PRIMARY_CATEGORY_IOS}}
Secondary Category      : {{SECONDARY_CATEGORY_IOS}}
Content Rights          : Does not contain third-party content
```

### 8.3 Pricing and Availability
```
Price                   : Free (subscription varsa)
In-App Purchases        : {{HAS_SUBSCRIPTION ? "Yes" : "No"}}
Available in            : All Territories
```

### 8.4 Age Rating Questionnaire
```
Cartoon/Fantasy Violence        : {{taramaya göre}}
Realistic Violence              : {{taramaya göre}}
Sexual Content                  : No
Nudity                          : No
Medical/Treatment Information   : {{taramaya göre}}
Profanity/Crude Humor           : No
Alcohol, Tobacco, Drugs         : No
Simulated Gambling              : {{taramaya göre}}
Horror/Fear Themes              : {{taramaya göre}}
Unrestricted Web Access         : {{taramaya göre}}
Gambling & Contests             : No
```

### 8.5 App Privacy (Privacy Nutrition Label)

```
EĞER offline-first ve backend YOK:
  → "This app does not collect any data"
  → AMA subscription varsa → Purchase History beyan et

EĞER backend AKTİF:
  → Kullanılan veri tiplerini beyan et
  → Analytics varsa → App Interactions beyan et
  → Firebase varsa → Device IDs beyan et
  → Supabase Auth varsa → Email beyan et

HER DURUMDA:
  → Privacy Policy URL gir
  → Subscription varsa → "Purchases → Purchase History: Yes" beyan et
```

### 8.6 Privacy Manifest (PrivacyInfo.xcprivacy)

> **ZORUNLU** (Mayıs 2024'ten itibaren).

```xml
<!-- ios/App/App/PrivacyInfo.xcprivacy -->
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <!-- Capacitor Preferences plugin -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array><string>CA92.1</string></array>
        </dict>
        <!-- Dosya erişim timestamp'leri -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array><string>C617.1</string></array>
        </dict>
        <!-- Sistem uptime -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategorySystemBootTime</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array><string>35F9.1</string></array>
        </dict>
        <!-- Disk alanı kontrolü -->
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryDiskSpace</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array><string>E174.1</string></array>
        </dict>
    </array>
</dict>
</plist>
```

> **NOT**: Bu Capacitor uygulamaları için standart yapıdır.
> React Native kullanılıyorsa farklı API'ler gerekebilir.
> Firebase, Analytics veya diğer SDK'lar ekliyse → ilgili API'leri ekle.

### 8.7 App Review Information

```
Sign-In Required        : {{HAS_AUTH ? "Yes" : "No"}}

Demo Account:
  Email    : reviewer@{{APP_NAME küçük}}.app
  Password : Review{{YIL}}!
  → Uygulama herhangi bir email/şifre ile hesap oluşturuyorsa:
    "Register with any email and password — no verification needed."

Review Notes:
"{{APP_NAME}} is {{BACKEND_TYPE == 'offline' ? 'an offline-first' : 'a cloud-connected'}} app.
{{HAS_AUTH ? 'On first launch, users register with any email and password.' : ''}}
{{BACKEND_TYPE == 'offline' ? 'All data is stored locally on the device.' : ''}}
Built with {{FRAMEWORK}} + {{NATIVE_BRIDGE}}."
```

### 8.8 EU Digital Services Act
```
AB'de dağıtım yapılacaksa:
  Trader Status: Verified
  → App Store Connect'te trader bilgileri doğrulanmalı
```

---

## 9. GOOGLE PLAY CONSOLE AYARLARI

### 9.1 App Oluşturma
```
App Name              : {{APP_NAME}}
Default Language      : en-US
App or Game           : App
Free or Paid          : Free
```

### 9.2 Store Listing
```
App Name              : (listing.json → title)
Short Description     : (listing.json → short_description)
Full Description      : (listing.json → full_description)
App Icon              : 512x512 PNG
Feature Graphic       : 1024x500
Screenshots           : (screenshots/playstore/)
```

### 9.3 Content Rating (IARC)
```
Category                                : {{PRIMARY_CATEGORY_ANDROID}}
Violence?                               : {{taramaya göre}}
Sexual content?                         : No
Bad language?                           : No
Drug references?                        : No
User interaction?                       : {{chat/forum varsa Yes}}
User location shared?                   : {{konum izni varsa Yes}}
In-app purchases?                       : {{HAS_SUBSCRIPTION ? "Yes" : "No"}}
Ads?                                    : {{reklam varsa "Yes" : "No"}}
Target children?                        : No
```

### 9.4 Data Safety

```
EĞER offline-first:
  Data collected    : {{HAS_SUBSCRIPTION ? "Yes (Purchase History)" : "No"}}
  Data shared       : No

EĞER backend aktif:
  → Kullanılan veri tiplerini beyan et
  → Firebase → Device IDs
  → Analytics → App Interactions
  → Auth → Email, User IDs

HER DURUMDA:
  Data encrypted in transit    : Yes (HTTPS)
  Users can request deletion   : Yes
  Subscription varsa           : Financial → Purchase History beyan et
```

### 9.5 20-Tester Requirement

```
Yeni kişisel geliştirici hesapları için:
1. Closed Testing track oluştur
2. 20 tester ekle (gerçek Google hesapları)
3. 14 gün test yaptır
4. Sonra Production erişimi açılır
```

### 9.6 Target API Level

```
Tarih                Gereksinim
─────────────────────────────────────────
Ağustos 2024        → targetSdkVersion >= 34
Ağustos 2025        → targetSdkVersion >= 35
→ Her zaman en yüksek stabil SDK'yı hedefle
→ android/variables.gradle kontrol et
```

### 9.7 Google Play API Doğrudan Kullanım (Node.js)

```
Google Play Developer API ile listing, screenshot, AAB yönetimi yapılabilir.
Fastlane supply'ın yapamadığı veya hata verdiği durumlarda doğrudan API kullan.

AUTHENTICATION:
1. Service account JSON'dan JWT oluştur (RS256)
2. https://oauth2.googleapis.com/token'a POST → access_token al
3. Scope: https://www.googleapis.com/auth/androidpublisher

TEMEL AKIŞ (her işlem için):
1. POST /edits → edit oluştur (editId al)
2. İşlemi yap (listing güncelle, image yükle, track ayarla)
3. POST /edits/{editId}:commit → değişiklikleri kaydet
⚠️ Commit yapmazsan hiçbir değişiklik kaydolmaz!

LISTING GÜNCELLEME:
PUT /edits/{editId}/listings/{language}
Body: { language, title, shortDescription, fullDescription }

IMAGE YÜKLEME (icon, featureGraphic, screenshots):
POST /upload/.../edits/{editId}/listings/{language}/{imageType}?uploadType=media
Content-Type: image/png
Body: PNG binary data
→ imageType: icon, featureGraphic, phoneScreenshots, sevenInchScreenshots, tenInchScreenshots

APP DETAILS (contact, privacy):
PUT /edits/{editId}/details
Body: { defaultLanguage, contactEmail, contactWebsite }
⚠️ Privacy policy URL'si contactWebsite alanında GİDER (ayrı alan yok)

AAB UPLOAD:
POST /upload/.../edits/{editId}/bundles?uploadType=media
Content-Type: application/octet-stream
Body: AAB binary data

TRACK AYARLAMA:
PUT /edits/{editId}/tracks/{trackName}
Body: { releases: [{ versionCodes: ["1"], status: "completed", releaseNotes: [...] }] }
trackName: internal, alpha, beta, production
status: draft, completed, halted, inProgress

⚠️ Python urllib SSL hatası verir (macOS sertifika sorunu).
   Node.js veya Ruby kullan.
```

### 9.8 Play Console Kurulum Kontrol Listesi (Draft App Sorunu)

```
Yeni oluşturulan uygulama "draft" durumundadır.
API ile "Only releases with status draft may be created on draft app" hatası alırsan
Play Console'da kurulum kontrol listesi tamamlanmamış demektir.

ZORUNLU ALANLAR (API İLE YAPILAMAZ — sadece Play Console UI):

1. Uygulama erişimi (App access)
   Yol: Uygulama içeriği → Uygulama erişimi
   → Oturum gerektirmiyorsa: "Tüm işlevler kısıtlama olmadan kullanılabilir"
   → Oturum gerektiriyorsa: Test hesap bilgilerini ver

2. Reklamlar (Ads)
   Yol: Uygulama içeriği → Reklamlar
   → Reklam yoksa: "Hayır, uygulamamda reklam yok"

3. İçerik derecelendirmesi (Content rating / IARC)
   Yol: Uygulama içeriği → İçerik derecelendirmesi → Anketi başlat
   → E-posta gir, kategori seç (genelde "Yardımcı Program, Verimlilik")
   → Productivity app için tüm sorulara "Hayır" (in-app purchase hariç)
   → Sonuç: PEGI 3 / Everyone

4. Hedef kitle (Target audience)
   Yol: Uygulama içeriği → Hedef kitle ve içerik
   → ⚠️ 13 yaş altını SEÇME — COPPA gereksinimleri devreye girer
   → Genelde: "18 ve üzeri" veya "13-15, 16-17, 18 ve üzeri"
   → "Çocuklara yönelik mü?" → Hayır

5. Veri güvenliği (Data safety)
   Yol: Uygulama içeriği → Veri güvenliği
   → Offline-first app: veri toplanmıyor, paylaşılmıyor
   → Subscription varsa: Financial → Purchase History beyan et
   → E-posta ile auth varsa: Personal info → Email → Toplanan, paylaşılmayan
   → Veriler aktarım sırasında şifreleniyor: Evet
   → Kullanıcılar silme isteyebilir: Evet

6. Uygulama kategorisi
   Yol: Ana mağaza listesi veya Mağaza ayarları
   → Uygulama tipi: Uygulama (Oyun değil)
   → Kategori: proje tipine göre (Verimlilik, Eğitim, Yaşam Tarzı vb.)

KONTROL:
→ Play Console → Dashboard'da "Uygulamanızı ayarlayın" listesindeki
  TÜM maddeler yeşil tik olmalı.
→ Kırmızı/gri madde varsa o alan eksik demektir.
→ Tümü yeşil olunca app "draft" durumundan çıkar ve production'a gönderilebilir.
```

### 9.9 Fastlane Supply Track Hatası

```
SORUN: fastlane supply "undefined method 'size' for nil" hatası
SEBEP: Supply, belirtilen track'te release bulamıyor (releases = nil)
ÇÖZÜM: Track'i AAB'nin yüklendiği track ile eşleştir
  → AAB internal'a yüklendiyse: track: "internal"
  → AAB production'a yüklendiyse: track: "production"
  → Yanlış track = releases nil = crash

SORUN: fastlane supply "Package not found"
SEBEP: 3 olası neden:
  1. Uygulama Play Console'da henüz oluşturulmamış
  2. İlk AAB henüz manuel yüklenmemiş (API ile ilk upload yapılamaz)
  3. Service account'a uygulama erişimi verilmemiş
ÇÖZÜM:
  1. Play Console'da uygulamayı oluştur
  2. İlk AAB'yi Play Console UI'dan yükle (Internal testing → Create release)
  3. Ayarlar → API erişimi → Service account → Uygulamaları yönet → uygulamayı ekle
```

---

## 10. PRIVACY & ZORUNLU URL'LER

```
Privacy Policy URL : {{PRIVACY_URL}}    ← ZORUNLU (her iki store)
Support URL        : {{SUPPORT_URL}}    ← ZORUNLU (App Store)
Marketing URL      : {{MARKETING_URL}}  ← İSTEĞE BAĞLI
Terms of Use URL   : {{TERMS_URL}}      ← ZORUNLU (subscription varsa)
```

### Privacy Policy Minimum İçerik

```
✓ Hangi veriler toplanıyor
✓ Veriler kimlerle paylaşılıyor
✓ Veri saklama süresi
✓ Veri silme hakkı
✓ Çocukların gizliliği (13 yaş altı hedef değil)
✓ İletişim bilgisi
✓ Değişiklik bildirimi
✓ Geçerlilik tarihi
```

### URL Canlılık Kontrolü

```
Deploy sırasında her URL'yi kontrol et:
1. HTTP GET → 200 OK beklenir
2. Erişilemezse → kullanıcıyı uyar
3. URL'ler canlı olana kadar store'a submit YAPMA
```

---

## 11. APP ICON GEREKSİNİMLERİ

### iOS
```
Boyut        : 1024 x 1024 px (kare)
Format       : PNG, alpha YOK
Köşeler      : Kare yükle — Apple otomatik yuvarlar
Dosya konumu : ios/App/App/Assets.xcassets/AppIcon.appiconset/
```

### Android
```
Foreground   : 108x108 dp (432x432 px @xxxhdpi)
Background   : 108x108 dp (432x432 px @xxxhdpi)
Play Store   : 512 x 512 px PNG (alpha yok)
Dosya konumu : android/app/src/main/res/mipmap-*/
```

---

## 12. BUILD & UPLOAD

### 12.1 iOS Build & Upload

```bash
# 1. Web build
npm run build

# 2. Sync
npx cap sync ios

# 3. Privacy Manifest kontrol
# ios/App/App/PrivacyInfo.xcprivacy dosyasının varlığını doğrula
# Yoksa Bölüm 8.6'dan oluştur

# 4. Archive
# ÖNEMLİ: Capacitor + CocoaPods = -workspace kullan (-project DEĞİL)
xcodebuild -workspace ios/App/App.xcworkspace \
  -scheme App -configuration Release \
  -archivePath /tmp/{{APP_NAME}}.xcarchive \
  -destination 'generic/platform=iOS' \
  archive \
  DEVELOPMENT_TEAM={{TEAM_ID}} \
  CODE_SIGN_STYLE=Automatic

# 5. Export IPA
xcodebuild -exportArchive \
  -archivePath /tmp/{{APP_NAME}}.xcarchive \
  -exportPath /tmp/{{APP_NAME}}-export \
  -exportOptionsPlist {{DEPLOY_DIR}}/ios/ExportOptions.plist

# ExportOptions.plist içeriği:
#   method: app-store-connect
#   teamID: {{TEAM_ID}}
#   signingStyle: automatic
#   uploadBitcode: false
#   uploadSymbols: true
#   destination: upload

# 6. Upload (3 yöntem — sırayla dene)
# Yöntem A: altool
xcrun altool --upload-app \
  -f /tmp/{{APP_NAME}}-export/App.ipa \
  -t ios \
  --apiKey {{ASC_KEY_ID}} \
  --apiIssuer {{ASC_ISSUER_ID}}

# Yöntem B: xcodebuild
xcodebuild -exportArchive \
  -archivePath /tmp/{{APP_NAME}}.xcarchive \
  -exportPath /tmp/{{APP_NAME}}-export \
  -exportOptionsPlist {{DEPLOY_DIR}}/ios/ExportOptions.plist \
  -allowProvisioningUpdates

# Yöntem C: Transporter (GUI, son çare)

# HATA ÇÖZÜMLEME:
# Code signing → CODE_SIGN_STYLE=Automatic
# Provisioning → Xcode'da Signing & Capabilities kontrol et
# "Invalid Binary" → Info.plist ve icon boyutlarını kontrol et
```

### 12.2 Android Build & Upload

```bash
# 1. Web build
npm run build

# 2. Sync
npx cap sync android

# 3. Build Release AAB
cd {{PROJECT_ROOT}}/android && ./gradlew bundleRelease

# AAB çıktı: android/app/build/outputs/bundle/release/app-release.aab
# Beklenen boyut: 10-50MB (Capacitor hybrid app)

# 4. Upload (3 yöntem — sıra önemli):

# ⚠️ KRİTİK: İLK AAB MUTLAKA PLAY CONSOLE'DAN MANUEL YÜKLENMELİ!
# Google Play Developer API ilk AAB yüklemesini desteklemez.
# "Package not found" hatası alırsan bu yüzdendir.
# İlk yüklemeden SONRA API/fastlane kullanılabilir.

# Yöntem A (İLK UPLOAD — zorunlu manuel):
# Play Console → MindBloom → Test → Internal testing → Create release → AAB sürükle

# Yöntem B (sonraki upload'lar — fastlane):
# Fastfile'a şu lane'i ekle:
#   platform :android do
#     lane :upload_aab do
#       supply(
#         json_key: "store-deployment/android/play-store-service-account.json",
#         package_name: "{{BUNDLE_ID_ANDROID}}",
#         aab: "android/app/build/outputs/bundle/release/app-release.aab",
#         track: "internal",  # veya "production"
#         skip_upload_metadata: true,
#         skip_upload_changelogs: true,
#         skip_upload_images: true,
#         skip_upload_screenshots: true,
#         release_status: "draft"
#       )
#     end
#   end
# Çalıştır: fastlane android upload_aab

# Yöntem C (direkt API — Node.js ile):
# Service account JSON'dan JWT oluştur → OAuth token al →
# edits.insert → bundles.upload → tracks.update → edits.commit
# (Detaylar: Bölüm 9.7 Google Play API Doğrudan Kullanım)

# HATA ÇÖZÜMLEME:
# "Package not found"     → İlk AAB Play Console'dan manuel yüklenmeli (Yöntem A)
# "draft app"             → Play Console kurulum kontrol listesi eksik (Bölüm 9.8)
# "Precondition failed"   → Content rating/data safety/hedef kitle eksik (Bölüm 9.8)
# Keystore hatası         → build.gradle signing config kontrol et
# Target SDK              → android/variables.gradle targetSdkVersion >= 35
# Version code            → önceki upload'dan yüksek olmalı
# AAB boyut               → 200MB limit
# SSL error (Python)      → Node.js veya Ruby (fastlane) kullan, Python SSL sertifika sorunu yaşar
```

---

## 13. EXECUTION PIPELINE

```
ADIM 0: Proje Taraması (Bölüm 1)
  □ Projeyi tara, APP_CONFIG oluştur
  □ Deploy-blocker sorunları tespit et

ADIM 1: Pre-Deployment Questionnaire (Bölüm 2)
  □ Kullanıcıya soruları sor
  □ Cevapları APP_CONFIG'e ekle

ADIM 2: Kontrol & Doğrulama
  □ Credential dosyaları mevcut mu?
  □ URL'ler canlı mı?
  □ Deploy-blocker sorun var mı? → Varsa kullanıcıyı uyar
  □ targetSdkVersion kontrol et

ADIM 3: Metadata Oluşturma
  □ Tüm diller için listing.json oluştur
  □ Karakter limitlerini doğrula (Python ile)
  □ Tüm diller PASS edene kadar düzelt

ADIM 4: Web Build & Sync
  □ npm run build
  □ npx cap sync ios
  □ npx cap sync android

ADIM 5: iOS Deploy
  □ PrivacyInfo.xcprivacy kontrol et / oluştur
  □ Archive → Export → Upload
  □ Hata varsa düzelt ve tekrar dene (max 5)

ADIM 6: Android Deploy
  □ npm run build → npx cap sync android → cd android && ./gradlew bundleRelease
  □ AAB oluştu mu kontrol et (android/app/build/outputs/bundle/release/app-release.aab)
  □ İLK UPLOAD ise → Play Console'dan manuel yükle (API ilk upload'u desteklemez!)
  □ Sonraki upload'lar → fastlane android upload_aab
  □ "Package not found" → İlk AAB manuel yüklenmeli + service account erişimi
  □ "draft app" → Play Console kurulum listesini tamamla (Bölüm 9.8)
  □ Hata varsa düzelt ve tekrar dene (max 5)

ADIM 7: Store Ayarları (Screenshot HARİÇ)
  □ Store listing — tüm diller için metadata yükle
  □ Fiyatlandırma ayarla (subscription varsa)
  □ Age Rating doldur
  □ Privacy / Data Safety doldur
  □ App Review bilgileri gir
  □ ANDROID EK: Play Console kurulum listesi (Bölüm 9.8):
    □ Uygulama erişimi, Reklamlar, İçerik derecelendirmesi
    □ Hedef kitle, Veri güvenliği, Uygulama kategorisi
    □ Contact email + Privacy URL (API ile yapılabilir — Bölüm 9.7)
    □ App icon 512x512 (API ile yükle — fastlane yapamaz)
  □ ANDROID EK: Dashboard'da TÜM maddeler yeşil tik olmalı

ADIM 8: Screenshot Al (EN SON ADIM)
  ══════════════════════════════════════════════════════
  KURAL: Screenshot bölümü tüm diğer ayarlar tamamlandıktan sonra
  EN SON çalışır. Alındıktan sonra KULLANICIYA ONAY SORULUR.
  ══════════════════════════════════════════════════════
  □ Puppeteer kur (yoksa)
  □ Dev server başlat
  □ İKİ FAZLI screenshot akışını çalıştır:
    FAZ 1: Store/subscription screenshot'larını FREE planda çek
           (fiyatlar CSS ile gizli, plan kartları upgrade durumunda)
    FAZ 2: En yüksek planı aktive et, kalan screenshot'ları çek
  □ Boyutları doğrula
  □ Feature Graphic oluştur
  □ ═══ KULLANICI ONAYI GEREKLİ ═══
    → Screenshot'ları kullanıcıya göster / klasör yolunu bildir
    → "Screenshot'lar hazır. Lütfen kontrol edin ve onaylayın."
    → Kullanıcı "onaylıyorum" derse → ADIM 9'a geç
    → Kullanıcı sorun bildirirse → düzelt ve tekrar çek

ADIM 9: Screenshot'ları Store'lara Yükle + Review'a Gönder
  □ Kullanıcı onayı alındı mı? → HAYIR ise DURMA, onay bekle
  □ Screenshots + Feature Graphic → App Store Connect'e yükle
  □ Screenshots + Feature Graphic → Google Play Console'a yükle
  □ iOS: Submit for Review
  □ Android: Start rollout
  □ Report dosyasını tamamla
```

### Hata Yönetimi

```
Her adımda hata alınırsa:
1. Hata mesajını + stack trace'i report'a HEMEN yaz
2. Kök sebebi tespit et (tahmin değil, kanıt bul)
3. Düzeltme uygula — her denemede FARKLI bir çözüm dene
4. Adımı tekrar çalıştır
5. Aynı hatayı aynı yöntemle tekrar deneme — FARKLI yaklaşım şart
6. 5 denemeden sonra başarısızsa:
   → Hatayı report'a detaylı yaz
   → Kullanıcıya bildir: "X adımı 5 denemede çözülemedi. Sebep: Y"
   → Diğer adımlara devam et (pipeline'ı tamamen durdurma)
   → Başarısız adımları report sonunda "ÇÖZÜLMEYENLER" listesine ekle
7. Hiçbir adımı atlamadan devam et
8. YASAK: Brute force retry (aynı komutu 5 kez çalıştırmak çözüm değil)
```

---

## 14. RED SEBEPLERİ VE ÇÖZÜMLERİ

### 14.1 App Store — Top Rejection Reasons

```
1. Guideline 2.1 — App Completeness
   SORUN: Crash, placeholder içerik, eksik özellik
   ÇÖZÜM: Her buton çalışmalı, "coming soon" YASAK, URL'ler canlı olmalı

2. Guideline 2.3 — Accurate Metadata
   SORUN: Yanıltıcı screenshot veya açıklama
   ÇÖZÜM: Gerçek ekranlar göster, mevcut olmayan özellik yazma

3. Guideline 4.2 — Minimum Functionality
   SORUN: WebView wrapper, minimum native özellik
   ÇÖZÜM: Offline çalışma, native API kullanımı, Review Notes'ta açıkla

4. Guideline 3.1.1 — IAP Requirement
   SORUN: Apple IAP dışında ödeme
   ÇÖZÜM: StoreKit 2 kullan, harici ödeme linki YASAK

5. Guideline 5.1.1 — Privacy
   SORUN: Privacy policy eksik/yanlış
   ÇÖZÜM: Canlı URL, doğru nutrition label, uygulama içinde erişim

6. Privacy Manifest Missing
   SORUN: PrivacyInfo.xcprivacy eksik
   ÇÖZÜM: Bölüm 8.6'dan oluştur, tüm API'leri beyan et

7. Account Deletion Missing
   SORUN: Hesap silme YOK
   ÇÖZÜM: Settings'te Delete Account ekle, tüm veri silinmeli

8. Subscription UI Incomplete
   SORUN: Paywall gereksinimleri eksik
   ÇÖZÜM: Fiyat, trial, cancel bilgisi, Restore Purchases, ToS + PP linkleri
```

### 14.2 Google Play — Top Rejection Reasons

```
1. Metadata Policy
   SORUN: Keyword stuffing, yanıltıcı açıklama
   ÇÖZÜM: CTA yazma, rakip isim kullanma, doğrulanamaz iddia yapma

2. User Data Policy
   SORUN: Data Safety yanlış
   ÇÖZÜM: Subscription → Purchase History beyan et

3. Permissions Policy
   SORUN: Gereksiz izinler
   ÇÖZÜM: AndroidManifest.xml kontrol et, gereksizleri kaldır

4. Target API Level
   SORUN: Düşük targetSdkVersion
   ÇÖZÜM: variables.gradle → >= 35

5. 20-Tester Requirement
   SORUN: Production erişimi yok (yeni hesap)
   ÇÖZÜM: Closed Testing → 20 tester → 14 gün → Production
```

### 14.3 Capacitor/Hybrid App Özel Sorunlar

```
SORUN 1: "Repackaged web app"
  → Review Notes'ta açıkla: offline-first, native API'ler
  → Native Capacitor API kullanımını öne çıkar: Haptics, StatusBar,
    SplashScreen, Preferences, PushNotifications
  → Uygulamanın internet olmadan çalıştığını göster (offline-first)

SORUN 2: iOS code signing
  → Automatic signing, doğru Team ID, -workspace kullan
  → xcodebuild'de CODE_SIGN_STYLE=Automatic kullan
  → Provisioning profile çakışması → Xcode → Clean Build Folder

SORUN 3: Android keystore
  → Şifreleri environment variable'a taşı, backup al
  → build.gradle'da signingConfigs'te HARDCODED şifre KOYMA!
  → Şifreleri gradle.properties veya local.properties'e taşı:
    storePassword project.property('STORE_PASSWORD')
  → .gitignore'a gradle.properties ekle
  → Keystore kaybedilirse app GÜNCELLENEMEZ — mutlaka backup al!

SORUN 4: Capacitor plugin izinleri
  → Her plugin AndroidManifest.xml'e izin ekleyebilir — kontrol et
  → iOS: Info.plist'te gereksiz usage description varsa Apple RED EDER
    (NSCameraUsageDescription, NSLocationWhenInUseUsageDescription vb.)
  → Capacitor plugin'leri otomatik ekliyor olabilir — kullanılmıyorsa kaldır
  → Test: Her izni grep ile ara, gerçekten çağrılıyor mu kontrol et

SORUN 5: App name tutarsızlığı
  → capacitor.config.ts → appName: "X"
  → ios/App/App/Info.plist → CFBundleDisplayName: "X"
  → Store Listing → title: "Y"
  → Eğer home screen adı ile store adı farklıysa Apple Guideline 2.3 rejection!
  → ÇÖZÜM: Tüm yerlerde aynı isim kullan (capacitor, plist, store listing)

SORUN 6: Capacitor config webDir yanlış
  → capacitor.config.ts → webDir build çıktı klasörüyle eşleşmeli
  → Vite: "dist", Next.js: "out", CRA: "build"
  → Yanlışsa npx cap sync boş uygulama kopyalar

SORUN 7: Google Play ilk AAB yüklemesi API ile yapılamıyor
  → Google Play Developer API ilk binary yüklemesini DESTEKLEMİYOR.
  → Hata: "Package not found: com.xxx.yyy"
  → ÇÖZÜM: İlk AAB'yi Play Console UI'dan manuel yükle
    (Internal testing → Create release → AAB sürükle bırak).
  → İlk yüklemeden sonra API/fastlane kullanılabilir.
  → Service account'a da uygulama erişimi verilmeli:
    Ayarlar → API erişimi → Service account → Uygulamaları yönet.

SORUN 8: Google Play "draft app" — kurulum listesi tamamlanmamış
  → Play Console'da yeni uygulama "draft" durumunda başlar.
  → Tüm zorunlu alanlar doldurulmadan release yayınlanamaz.
  → Zorunlu alanlar (sadece Play Console UI'dan — API'de YOK):
    1. Uygulama erişimi (App access)
    2. Reklamlar (Ads declaration)
    3. İçerik derecelendirmesi (IARC content rating)
    4. Hedef kitle (Target audience)
    5. Veri güvenliği (Data safety)
    6. Uygulama kategorisi
  → Dashboard → "Uygulamanızı ayarlayın" listesinde TÜM maddeler yeşil olmalı.

SORUN 9: Fastlane supply track uyumsuzluğu
  → AAB internal track'e yüklendiyse, supply'da track: "internal" kullan.
  → Yanlış track kullanılırsa: "undefined method 'size' for nil" hatası.
  → Bu, releases dizisinin nil dönmesinden kaynaklanır (o track'te release yok).

SORUN 10: Google Play icon fastlane ile yüklenmiyor
  → Fastlane supply icon yüklemeyi desteklemiyor.
  → ÇÖZÜM: Google Play Developer API'yi doğrudan kullan (Node.js ile).
  → POST /upload/.../listings/{lang}/icon?uploadType=media
  → Content-Type: image/png, Body: 512x512 PNG binary
  → Her dil için ayrı yüklenmeli.

SORUN 11: iOS fastlane deliver metadata dil kodu uyuşmazlığı
  → App Store dil kodları: en-US, tr (kısa kod)
  → Google Play dil kodları: en-US, tr-TR (uzun kod)
  → Fastlane metadata klasör yapısı store'a göre farklı olmalı:
    fastlane/metadata/{appstore_lang_code}/  (iOS)
    fastlane/metadata/android/{playstore_lang_code}/  (Android)
  → Yanlış dil kodu = metadata yüklenmez (sessiz başarısızlık!)
```

---

## 15. PRE-SUBMISSION CHECKLIST

```
⛔ DEPLOY-BLOCKER KONTROLLER (önce bunları çöz):
  □ Delete Account özelliği VAR ve ÇALIŞIYOR mu?
  □ Subscription varsa → Restore Purchases VAR ve ÇALIŞIYOR mu?
  □ Info.plist'te kullanılmayan izin YOK mu?
  □ App name tutarlı mı? (store listing = capacitor.config = Info.plist)
  □ Android keystore şifresi hardcoded DEĞİL mi? (gradle.properties'e taşı)
  □ Screenshot'lar birbirinden FARKLI sayfalar gösteriyor mu? (aynı ekran tekrarı yok)
  □ Screenshot'larda alpha channel YOK mu? (flatten uygulandı mı)

iOS App Store:
  □ PrivacyInfo.xcprivacy mevcut ve doğru
  □ Privacy Policy URL canlı
  □ App Privacy nutrition labels dolduruldu
  □ Subscription UI gereksinimleri karşılanıyor
  □ Account deletion çalışıyor
  □ Demo credentials Review Notes'ta
  □ Screenshot'lar güncel
  □ iPad desteği düzgün (varsa)
  □ Sign in with Apple (3rd party login varsa)
  □ "Coming soon" / placeholder YOK
  □ Xcode en son stabil sürüm ile build

Google Play Store:
  □ targetSdkVersion >= 35
  □ Data Safety formu doğru
  □ Privacy Policy URL girildi
  □ IARC Content Rating dolduruldu
  □ short_description ≤ 80 (tüm diller)
  □ whats_new ≤ 500 (tüm diller)
  □ AndroidManifest.xml'de gereksiz izin yok
  □ Play App Signing etkin
  □ Feature graphic 1024x500 mevcut
  □ Screenshot'larda fiyat YOK
  □ Metadata'da keyword stuffing yok

Her İki Store:
  □ Tüm dillerde metadata karakter limitleri PASS
  □ App icon formatları doğru
  □ Version ve build number doğru
  □ Production build (debug kodu yok)
  □ Tüm feature'lar çalışıyor
  □ URL'ler canlı
```

---

## 16. OTOMATİK DEPENDENCY KURULUMU

```bash
# Kontrol ve kurulum (gerekirse otomatik kur):

# 1. Node.js & npm
node --version || echo "ERROR: Node.js kurulu değil"

# 2. Puppeteer (screenshot için)
npm list puppeteer 2>/dev/null || npm install --save-dev puppeteer

# 3. Sharp (feature graphic için)
npm list sharp 2>/dev/null || npm install --save-dev sharp

# 4. Capacitor CLI
npx cap --version || npm install @capacitor/cli

# 5. Xcode Command Line Tools
xcode-select -p || xcode-select --install

# 6. CocoaPods
pod --version || sudo gem install cocoapods

# 7. Java / Gradle (Android)
java -version 2>&1 || echo "WARNING: Java kurulu değil"

# 8. xcrun (iOS upload)
xcrun --version || echo "WARNING: Xcode tools eksik"
```

---

## 17. DEPLOYMENT REPORT SİSTEMİ

### Report Dosya Yolu
```
store-deployment/reports/{{APP_NAME}}_deploy_{{TARIH}}.md
```

### Report Formatı

```markdown
# DEPLOYMENT REPORT: {{APP_NAME}}
Tarih    : {{TARIH_SAAT}}
Versiyon : {{VERSION}} (Build {{BUILD_NUMBER}})
Platform : {{deploy edilen platformlar}}

## ÖZET
- Toplam adım     : X
- Başarılı         : X
- Başarısız        : X
- Retry ile çözülen: X

## PRE-FLIGHT KONTROL
| # | Kontrol | Sonuç | Detay |
|---|---------|-------|-------|

## METADATA OLUŞTURMA
| # | Dil | full_desc | keywords | Sonuç |
|---|-----|-----------|----------|-------|

## SCREENSHOT ALMA
| # | Cihaz | Dil | Ekran | Boyut | Sonuç |
|---|-------|-----|-------|-------|-------|

## BUILD & UPLOAD
| # | Platform | Adım | Sonuç | Detay |
|---|----------|------|-------|-------|

## STORE AYARLARI
| # | Ayar | Store | Sonuç |
|---|------|-------|-------|

## SORUNLAR VE ÇÖZÜMLER
| # | Sorun | Adım | Çözüm |
|---|-------|------|-------|
```

### Report Kuralları
```
1. Her adım başlamadan "⏳ Çalışıyor..." yaz — report dosyasına HEMEN yaz
2. Bitince güncelle (✅, ⚠️, ❌) — oturum sonunu BEKLEME
3. Hata alınca: tam mesaj + deneme no + uygulanan çözüm + sonuç
4. Report HER ZAMAN güncel olsun — her adım sonunda kaydet
5. Süre takibi: adım başlangıç ve bitiş zamanı
6. Sorun/çözüm tablosunu her yeni sorun bulunduğunda güncelle
7. Oturum bittiğinde ÖZET bölümünü güncelle (toplam adım, başarılı, başarısız)
8. Report dosyası deployment'ın tek gerçek kaynağı (source of truth)
```

---

## 18. SUBSCRIPTION LOCALIZATION

> Her subscription ürünü için tüm dillerde display name ve açıklama gerekir.

### Şablon (Her Tier İçin)

```
HER DİL İÇİN OLUŞTUR:

{{tier_name}} Monthly:
  Display Name: "{{tier_name}} Monthly" / "{{tier_name}} Aylık" / ...
  Açıklama: "Unlock {{tier_name}} features with a monthly subscription. {{trial_days}}-day free trial."

{{tier_name}} Yearly:
  Display Name: "{{tier_name}} Yearly" / "{{tier_name}} Yıllık" / ...
  Açıklama: "Unlock {{tier_name}} features with an annual subscription. Save {{discount}}%."

→ Her dilde native-sounding olacak şekilde yaz
→ Trial süresi ve indirim oranı açıkça belirt
```

---

## 19. POST-DEPLOYMENT

### Review Süreleri
```
App Store: 24-48 saat (ilk: 1 hafta)
Play Store: 3-7 gün (yeni hesap: 14+ gün)
```

### Review Sonrası
```
✅ ONAYLANDI:
  □ Store listing canlı mı? → Kontrol et
  □ Tüm dillerde doğru mu?
  □ Fiyatlandırma doğru mu?
  □ IAP çalışıyor mu? (sandbox test)

❌ REDDEDİLDİ:
  □ Rejection nedenini oku
  □ Bölüm 14'teki çözümleri uygula
  □ Düzelt → Re-submit
  □ Report'a yaz
```

### Phased Release
```
iOS: 7 günde kademeli (%1 → %100)
Android: Manuel yüzde (%5 → %100)
```

---

## 20. GÜNCELLEME DEPLOY WORKFLOW

```
1. Version artır (package.json)
2. Build number artır
3. whats_new güncelle (tüm diller, ≤500 karakter)
4. npm run build
5. npx cap sync ios && npx cap sync android
6. iOS: Archive → Export → Upload
7. Android: bundleRelease → Upload AAB
8. Submit for Review
```

### Semantic Versioning
```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └── Bug fix (1.0.1)
  │     └────── Yeni özellik (1.1.0)
  └──────────── Breaking change (2.0.0)

Build Number: Her upload'ta artırılmalı
```

### Hotfix Deploy
```
1. Bug'ı düzelt
2. PATCH versiyonu artır
3. Build → Upload → Submit
4. iOS: Expedited Review talep et
5. Android: Hızlı rollout başlat
```

---

## 21. STORE-SPECİFİK NOTLAR (2025-2026)

### iOS Yeni Gereksinimler
```
- Privacy Manifest (PrivacyInfo.xcprivacy) → Mayıs 2024'ten itibaren zorunlu
- iOS 26 SDK gereksinimi → 28 Nisan 2026'dan itibaren (Xcode 26 ile build)
- Yeni yaş derecelendirme katmanları (13+, 16+, 18+) → 31 Ocak 2026
- Promo kodları kaldırılıyor → 26 Mart 2026 (Offer Codes ile değiştirildi)
- AB Digital Services Act → Trader doğrulaması zorunlu
- Güney Kore: Trial→ücretli geçişte ek onay → 14 Şub 2025
- Avusturya/Almanya/Polonya: Fiyat artışlarında müşteri onayı → 4 Ağu 2025
- SHA-256 receipt validation → 24 Ocak 2025
- Hesap silme özelliği → Uygulama içinde zorunlu
- StoreKit 2 → Yeni uygulamalarda StoreKit 2 kullanımı önerilir
- App Intents / Shortcuts → iOS 16+ uygulamaları için ekstra değer
```

### Android Yeni Gereksinimler
```
- Target API Level 34+ → Ağustos 2024 (aktif)
- Target API Level 35+ → Ağustos 2025 (beklenen)
- AAB format zorunlu → Ağustos 2021'den itibaren
- 20-tester Closed Testing → Yeni kişisel geliştirici hesapları için
- Data Safety Form → Zorunlu
- Play App Signing → Zorunlu
- Credential Manager migration → Eski giriş yöntemleri için
- Granüler medya izinleri → API 33+ (READ_MEDIA_IMAGES vs READ_EXTERNAL_STORAGE)
- Foreground service types → API 34+ (manifest'te beyan zorunlu)
- Photo Picker → READ_MEDIA_IMAGES yerine, API 33+
- Predictive back gesture → API 34+ (targetSdkVersion 34'te zorunlu)
- Edge-to-edge display → API 35+ (status bar/nav bar transparanlığı)
```

### Ortak Kurallar (Her İki Store)
```
- Privacy policy → ZORUNLU, canlı ve erişilebilir URL
- Hesap silme → Uygulama içinde zorunlu
- Demo hesap → Reviewer erişimi için bilgi sağla
- Yanıltıcı içerik → YASAK (screenshot, açıklama, feature listesi)
- "Coming soon" → YASAK (her özellik çalışmalı)
- Placeholder içerik → YASAK
- Rakip kötüleme → YASAK
- Sahte ödül/rozet → YASAK
- Fiyat screenshot'ta → YASAK
- Apple/Google logosu → YASAK
- "Also on [diğer platform]" → YASAK
```

---

## 22. DETAYLI FİYATLANDIRMA TABLOSU ŞABLONU

> Subscription tespit edildiğinde Claude Code bu tabloyu uygulamaya özel doldurur.

### 22.1 Fiyat Katmanı Şablonu

```
Fiyatlar oluşturulurken şu para birimlerini kapsa:

TIER 1 — Premium Pazarlar:
| Plan | USD | EUR | GBP | CHF | JPY | AUD | CAD | SEK | NOK | DKK |
|------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| {{Tier}} Aylık | $X.99 | €X.99 | £X.99 | X.90 CHF | ¥XXX | A$X.99 | C$X.99 | XX kr | XX kr | XX kr |
| {{Tier}} Yıllık | $XX.99 | €XX.99 | £XX.99 | XX.90 CHF | ¥X,XXX | A$XX.99 | C$XX.99 | XXX kr | XXX kr | XXX kr |

TIER 2 — Orta Gelirli:
| Plan | USD Karşılığı | PLN | CZK | HUF | RON | BGN | MYR | THB |
|------|--------------|-----|-----|-----|-----|-----|-----|-----|

TIER 3 — Gelişmekte Olan:
| Plan | USD Karşılığı | TRY | BRL | MXN | COP | ARS | ZAR | EGP | IDR | PHP | VND |
|------|--------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|

TIER 4 — Düşük Gelirli:
| Plan | USD Karşılığı | INR | PKR | BDT | NGN | KES |
|------|--------------|-----|-----|-----|-----|-----|

KURALLAR:
- Apple/Google fiyat tier'larına yuvarla
- Yıllık = aylığın ~%33 indirimi
- Fiyatlar .99 ile bitsin
- Her ülkenin satın alma gücüne göre ayarla
- Doğrudan kur çevirisi YAPMA — yerel psikolojik fiyat noktaları kullan
```

### 22.2 Önerilen Fiyat Aralıkları (Referans)

```
Uygulama Tipi        | T1 Aylık  | T1 Yıllık  | T3 Aylık  | T4 Aylık
─────────────────────────────────────────────────────────────────────
Utility / Productivity | $2.99-4.99 | $24.99-39.99 | $0.99-1.99 | $0.49-0.99
Creative / Design      | $4.99-9.99 | $39.99-79.99 | $1.99-3.99 | $0.99-1.99
AI / Premium Tools     | $9.99-19.99 | $79.99-149.99 | $3.99-6.99 | $1.99-2.99
Education             | $2.99-6.99 | $19.99-49.99 | $0.99-2.99 | $0.49-0.99
Health / Fitness      | $4.99-9.99 | $39.99-79.99 | $1.99-3.99 | $0.99-1.99

→ Claude Code uygulamanın kategorisine göre fiyat önerisi yapar
→ Kullanıcı onaylar veya değiştirir
```

---

## 23. DOSYA CHECKLIST ŞABLONU

### Deploy Sonrası Klasör Yapısı

```
store-deployment/
├── DEPLOY_TEMPLATE.md                           ← Bu dosya
├── APP_CONFIG.yaml                              ← Tarama sonuçları (otomatik oluşturulur)
├── reports/
│   └── {{APP_NAME}}_deploy_{{TARIH}}.md         ← Deployment raporu
├── ios/
│   ├── AuthKey_{{KEY_ID}}.p8                    ← App Store Connect API key
│   └── ExportOptions.plist                      ← Xcode export ayarları
├── android/
│   └── {{service-account}}.json                 ← Google Play API key
├── metadata/
│   ├── {{lang1}}/listing.json                   ← Her dil için metadata
│   ├── {{lang2}}/listing.json
│   └── .../listing.json
└── screenshots/
    ├── appstore/
    │   ├── 6.7-inch/{tüm diller}/*.png          ← 1290x2796
    │   ├── 6.5-inch/{tüm diller}/*.png          ← 1284x2778
    │   ├── 5.5-inch/{tüm diller}/*.png          ← 1242x2208
    │   └── ipad-12.9/{tüm diller}/*.png         ← 2048x2732
    └── playstore/
        ├── phone/{tüm diller}/*.png             ← 1080x1920
        ├── tablet-7/{en,...}/*.png               ← 1200x1920
        ├── tablet-10/{en,...}/*.png              ← 1600x2560
        └── feature-graphic/{tüm diller}.png     ← 1024x500
```

### Credential Yedek Kaynakları

```
Claude Code credential dosyalarını şu sırayla arar:

1. Proje içi: store-deployment/ios/ ve store-deployment/android/
2. Masaüstü: /Users/*/Desktop/Deploy/ios/ ve .../android/
3. Home: ~/.app-store-credentials/ (varsa)
4. Bulunamazsa: Kullanıcıya sor

Her iki yerde de yoksa kullanıcıya sorar.
Credential dosyalarını asla git'e commit etme.
```

---

## 24. PRIVACY MANIFEST DETAYLI REHBER

### Capacitor Uygulamaları İçin Zorunlu API'ler

```
Dosya: ios/App/App/PrivacyInfo.xcprivacy

API Category                                | Reason Code | Neden
────────────────────────────────────────────────────────────────────
NSPrivacyAccessedAPICategoryUserDefaults     | CA92.1      | Capacitor Preferences plugin
NSPrivacyAccessedAPICategoryFileTimestamp     | C617.1      | Dosya erişim timestamp'leri
NSPrivacyAccessedAPICategorySystemBootTime    | 35F9.1      | Sistem uptime hesaplama
NSPrivacyAccessedAPICategoryDiskSpace         | E174.1      | Disk alanı kontrolü
```

### React Native Uygulamaları İçin Ek API'ler

```
API Category                                | Reason Code | Neden
────────────────────────────────────────────────────────────────────
NSPrivacyAccessedAPICategoryUserDefaults     | CA92.1      | AsyncStorage
NSPrivacyAccessedAPICategoryFileTimestamp     | C617.1      | Metro bundler cache
NSPrivacyAccessedAPICategorySystemBootTime    | 35F9.1      | Performance monitoring
```

### Yaygın SDK'lar İçin Ek Gereksinimler

```
Firebase Analytics → NSPrivacyAccessedAPICategoryUserDefaults (CA92.1)
Firebase Crashlytics → NSPrivacyAccessedAPICategorySystemBootTime (35F9.1)
Google AdMob → NSPrivacyAccessedAPICategoryUserDefaults (CA92.1)
                + NSPrivacyAccessedAPICategoryDiskSpace (E174.1)
Facebook SDK → NSPrivacyAccessedAPICategoryUserDefaults (CA92.1)
              + NSPrivacyAccessedAPICategoryDiskSpace (E174.1)

Doğrulama: Xcode → Product → Archive → Generate Privacy Report
```

---

## 25. DATA SAFETY FORM DETAYLI REHBER

### Yaygın SDK'lar ve Topladıkları Veriler

```
┌────────────────────────────────────────────────────────────────┐
│ SDK / Bileşen          │ Topladığı Veri        │ Beyan Gerekli │
├────────────────────────────────────────────────────────────────┤
│ IndexedDB / SQLite     │ Yerel veri (cihazda)  │ Hayır*        │
│ AsyncStorage           │ Yerel veri (cihazda)  │ Hayır*        │
│ Capacitor Preferences  │ Yerel auth (cihazda)  │ Hayır*        │
│ Supabase Client        │ Email, user data      │ EVET          │
│ Firebase Auth          │ Email, phone, name    │ EVET          │
│ Firebase Analytics     │ App interactions      │ EVET          │
│ Firebase Crashlytics   │ Crash logs, device    │ EVET          │
│ Google AdMob           │ Device IDs, location  │ EVET          │
│ Facebook SDK           │ Device IDs            │ EVET          │
│ Sentry                 │ Crash logs            │ EVET          │
│ Amplitude              │ App interactions      │ EVET          │
│ Mixpanel               │ App interactions      │ EVET          │
│ Google Play Billing    │ Purchase history      │ EVET          │
│ StoreKit 2             │ Purchase history      │ EVET          │
│ RevenueCat             │ Purchase history      │ EVET          │
│ OneSignal              │ Device IDs            │ EVET          │
│ Stripe                 │ Financial info        │ EVET          │
└────────────────────────────────────────────────────────────────┘
* Cihazdan ÇIKMAYAN veri "collection" sayılmaz

Claude Code projedeki dependency'leri tarar ve bu tabloya göre
Data Safety Form'da beyan edilmesi gereken verileri otomatik belirler.
```

### Beyan Süreci

```
1. package.json / Podfile / build.gradle dependency'leri tara
2. Yukarıdaki tabloyla karşılaştır
3. Beyan edilmesi gereken veri tiplerini listele
4. Privacy Policy ile tutarlılığı kontrol et
5. Kullanıcıya rapor et ve onay al
6. Data Safety formunu doldur
```

---

## 26. SUBSCRIPTION RED SEBEPLERİ (DETAYLI)

```
SORUN 1: Free Trial tuzağı
  → Trial süresi ve bitişinde ne olacağı AÇIKÇA yazılmalı
  → "7-day free trial, then $X.XX/month" gibi net ifade
  → Cancel etme yöntemi uygulama içinde açıklanmalı

SORUN 2: Subscription upgrade/downgrade
  → Subscription Group Level'ları doğru ayarla
  → Yüksek tier = Level 1, düşük tier = Level 2
  → Upgrade: anında geçiş, kalan tutar iade
  → Downgrade: dönem sonunda geçiş

SORUN 3: Restore Purchases çalışmıyor
  → StoreKit 2 / Google Play Billing Library entegrasyonu
  → "Restore Purchases" butonu her paywall'da görünür olmalı
  → Transaction listener aktif olmalı

SORUN 4: Fiyat gösterimi tutarsız
  → Fiyatları StoreKit/Play Billing'den DİNAMİK çek
  → Hard-coded fiyat KULLANMA
  → Bölgeye göre doğru para birimi göster

SORUN 5: Subscription iptal zor
  → Kullanıcıya nasıl iptal edeceğini açıkça göster
  → "Settings → Subscriptions → Cancel" yönlendirmesi
  → Apple zorunlu kılıyor: iptal bilgisi paywall'da olmalı

SORUN 6: Grace period yönetimi
  → Apple: 16 gün billing grace period
  → Google: billing grace period etkin olmalı
  → Grace period boyunca özellikler açık kalmalı
  → Ödeme başarısız olunca kullanıcıyı bilgilendir
```

---

## 27. DEMO DATA HAZIRLAMA REHBERİ

> Screenshot'lar DOLU ve gerçekçi görünmeli. Boş uygulama ASLA screenshot olmaz.

### Genel Strateji

```
Claude Code screenshot öncesi şu adımları izler:

1. DEMO VERİ OLUŞTUR:
   → Uygulamanın ana özelliğine göre gerçekçi veri hazırla
   → Farklı durumları göster (tamamlanmış, devam eden, yeni)
   → Renkli ve çeşitli görünsün
   → BİRDEN FAZLA PROJE/SPACE OLUŞTUR (en az 3):
     - Her biri farklı konuda (iş, öğrenim, yaratıcı vb.)
     - Her screenshot farklı bir space'i gösterebilsin
     - Tek space ile tüm screenshot'ları alma → hepsi aynı görünür!

2. VERİ INJECT ET:
   → localStorage, IndexedDB, AsyncStorage'a veri yaz
   → Veya dev server'da seed data endpoint'i kullan
   → Veya Puppeteer ile otomatik form doldur + navigate et

3. FARKLI TEMALAR İÇİN:
   → İlk 3 screenshot: Ana/varsayılan tema
   → 1 screenshot: Dark mode (varsa)
   → Diğerleri: Farklı temalar (varsa)

4. BOŞLUK KONTROLÜ:
   → Her screenshot'ı çektikten sonra kontrol et:
     - Ekran dolu mu?
     - Anlamlı içerik var mı?
     - Gerçekçi görünüyor mu?
   → Boş görünüyorsa → daha fazla demo veri ekle → tekrar çek
```

### Uygulama Tipine Göre Demo Veri Örnekleri

```
PRODUCTIVITY / TODO:
  → 15-20 görev (bazıları tamamlanmış, bazıları devam eden)
  → 3-4 kategori/proje
  → Renkli etiketler/öncelikler

NOTE-TAKING:
  → 10-15 not (farklı uzunlukta)
  → Klasörler/etiketler
  → Zengin metin formatı, listeler

FINANCE:
  → 30+ işlem kaydı
  → Grafikler/chartlar dolu
  → Kategorize edilmiş harcamalar

HEALTH / FITNESS:
  → 2+ haftalık geçmiş veri
  → Grafikler trend göstersin
  → Başarı/streak göstergeleri

SOCIAL:
  → Profil dolu (avatar, bio, istatistikler)
  → Feed'de çeşitli içerik
  → Etkileşim göstergeleri (like, yorum)

EDUCATION:
  → İlerleme göstergeleri dolu
  → Tamamlanmış ve devam eden dersler
  → Quiz sonuçları/skorlar

CREATIVE (Photo, Design, Music):
  → 10+ oluşturulmuş proje/içerik
  → Galeri/portfolio görünümü dolu
  → Çeşitli stiller/filtreler göster
```

---

## 28. SCREENSHOT OVERLAY METİN OLUŞTURMA

> Claude Code her uygulama için otomatik overlay metin oluşturur.

### Overlay Metin Kuralları

```
1. HER EKRAN İÇİN:
   → Tüm desteklenen dillerde overlay metin oluştur
   → Max 5-7 kelime
   → Duygusal / değer önerisi (özellik listesi DEĞİL)
   → ✓ İYİ: "Your Ideas, Beautifully Organized"
   → ✗ KÖTÜ: "Todo lists, tags, reminders, cloud sync"

2. İLK 3 EKRAN ÖZELLİKLE GÜÇLÜ OLMALI:
   → Ekran 1: App'in tek cümlelik vizyonu
   → Ekran 2: En güçlü/farklı özellik
   → Ekran 3: Teknoloji/wow faktörü

3. DİL BAZLI YARATIM:
   → Her dilde native-sounding olsun
   → Doğrudan çeviri YAPMA
   → Kültürel uyumluluk (formal vs informal)

4. FORMAT:
   → Büyük punto, okunabilir font
   → Kontrast arka plan (yarı saydam şerit veya gölge)
   → Ekranın üst %20-30'unda konumlandır
   → App ekranını gizlemesin
```

### Claude Code Overlay Oluşturma Süreci

```
1. Uygulamanın özelliklerini tara
2. En güçlü 8-10 özelliği belirle
3. Her özellik için overlay metin yaz (tüm dillerde)
4. Kullanıcıya göster ve onay al
5. Screenshot çekerken overlay'i CSS/HTML ile ekle
   VEYA Sharp/Canvas ile görsel üzerine yaz
```

---

## 29. ExportOptions.plist ŞABLONU

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>{{TEAM_ID}}</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>uploadBitcode</key>
    <false/>
    <key>uploadSymbols</key>
    <true/>
    <key>destination</key>
    <string>upload</string>
</dict>
</plist>
```

> Claude Code bu dosyayı `store-deployment/ios/ExportOptions.plist` olarak oluşturur.
> TEAM_ID kullanıcıdan alınan değerle doldurulur.

---

## 30. METADATA DOĞRULAMA SÜRECİ

> Metadata oluşturulduktan sonra Claude Code bu doğrulamayı çalıştırır.

### Doğrulama Script'i (Python)

```python
# Claude Code bu script'i otomatik çalıştırır
import json, os

LIMITS = {
    'title': 30,
    'subtitle': 30,
    'short_description': 80,
    'full_description': 4000,
    'keywords': 100,
    'whats_new': 500,
}

TARGETS = {
    'full_description': (3900, 4000),
    'keywords': (95, 100),
    'short_description': (75, 80),
    'subtitle': (25, 30),
}

metadata_dir = 'store-deployment/metadata'
results = []

for lang in sorted(os.listdir(metadata_dir)):
    filepath = os.path.join(metadata_dir, lang, 'listing.json')
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    row = {'lang': lang}
    all_pass = True
    for field, limit in LIMITS.items():
        if field in data:
            length = len(data[field])
            row[field] = length
            if length > limit:
                all_pass = False
                row[f'{field}_status'] = 'FAIL'
            else:
                row[f'{field}_status'] = 'PASS'

    row['overall'] = 'PASS' if all_pass else 'FAIL'
    results.append(row)
    print(f"{lang} | T:{row.get('title','-')} | Sub:{row.get('subtitle','-')} | "
          f"SD:{row.get('short_description','-')} | FD:{row.get('full_description','-')} | "
          f"KW:{row.get('keywords','-')} | WN:{row.get('whats_new','-')} | {row['overall']}")

# Sonuç: Tüm diller PASS edene kadar düzelt ve tekrar çalıştır
```

### Doğrulama Rapor Formatı

```
Lang  | Title | Sub  | ShDesc | FullDesc | KW   | WhNew | iOS  | Android
─────────────────────────────────────────────────────────────────────────
en    |    XX |   XX |     XX |     XXXX |   XX |   XXX | PASS | PASS
tr    |    XX |   XX |     XX |     XXXX |   XX |   XXX | PASS | PASS
...   |   ... |  ... |    ... |      ... |  ... |   ... | ...  | ...
─────────────────────────────────────────────────────────────────────────
SONUÇ: XX/XX DİL — HER İKİ STORE'DA PASS
```

---

## 31. SUBSCRIPTION LOCALIZATION DETAYLI ŞABLON

> Claude Code her subscription ürünü için tüm dillerde display name ve açıklama oluşturur.

### Oluşturma Kuralları

```
HER SUBSCRIPTION ÜRÜNÜ × HER DİL İÇİN:

1. Display Name formatı:
   → {{Tier Adı}} {{Süre}}
   → Örnekler: "Pro Monthly", "Pro Aylık", "Pro月額", "Pro 월간"

2. Açıklama formatı:
   → "{{Tier}} özellikleri aç. {{Trial}} gün ücretsiz. {{İndirim}} tasarruf."
   → Native-sounding, çeviri DEĞİL

3. Zorunlu bilgiler:
   → Trial süresi
   → Yıllık planlarda indirim oranı
   → Nelerin kilidi açıldığı

4. Karakter limitleri:
   → Display Name: max 30 karakter (App Store)
   → Açıklama: max 45 karakter (App Store referans name)
```

### Tablo Formatı (Claude Code otomatik doldurur)

```
| Dil | Display Name | Açıklama |
|-----|-------------|----------|
| en | {{Tier}} Monthly | Unlock {{Tier}} features. 7-day free trial. |
| tr | {{Tier}} Aylık | {{Tier}} özelliklerin kilidini açın. 7 gün ücretsiz. |
| de | {{Tier}} Monatlich | {{Tier}}-Funktionen freischalten. 7 Tage kostenlos. |
| es | {{Tier}} Mensual | Desbloquea funciones {{Tier}}. 7 días de prueba. |
| fr | {{Tier}} Mensuel | Débloquez les fonctionnalités {{Tier}}. Essai 7 jours. |
| ja | {{Tier}}マンスリー | {{Tier}}機能をアンロック。7日間無料。 |
| ko | {{Tier}} 월간 | {{Tier}} 기능 잠금 해제. 7일 무료 체험. |
| zh-CN | {{Tier}} 月度 | 解锁{{Tier}}功能。7天免费试用。 |
| ar | {{Tier}} شهري | افتح ميزات {{Tier}}. تجربة مجانية 7 أيام. |
| hi | {{Tier}} मासिक | {{Tier}} सुविधाएं अनलॉक करें। 7 दिन निःशुल्क। |
| ... | ... | ... |

→ Tüm desteklenen diller için oluşturulur
→ Yıllık planda: "Save XX%" / "XX% tasarruf" eklenir
```

---

## 32. POST-DEPLOYMENT MONİTORİNG DETAYLI

### İlk 48 Saat Kontrol Listesi

```
□ Crash raporlarını izle:
  → iOS: App Store Connect → App Analytics → Crashes
  → Android: Play Console → Quality → Android Vitals → Crashes
□ Kullanıcı yorumlarını oku (her iki store)
□ Rating ortalamasını takip et
□ Download sayılarını kontrol et
□ IAP/Subscription gelirlerini kontrol et
□ Ciddi crash varsa → hotfix hazırla → acil güncelleme gönder
```

### Phased / Staged Release Detayları

```
iOS Phased Release:
  Gün 1: %1 | Gün 2: %2 | Gün 3: %5 | Gün 4: %10
  Gün 5: %20 | Gün 6: %50 | Gün 7: %100
  → İstediğin zaman herkese açabilir veya duraklatabilirsin

Android Staged Rollout:
  → Manuel yüzde: %5 → %10 → %25 → %50 → %100
  → Crash oranı yüksekse rollout'u durdur
  → Rollback mümkün (önceki sürümü yeniden yayınla)
```

### Expedited Review Başvurusu (Apple)

```
Ciddi bug/crash durumunda:
  → App Store Connect → Help → Contact Us
  → "App Review" → "Request expedited review"
  → Nedeni açıkla: "Critical bug fix affecting user experience"
  → Genelde aynı gün yanıt gelir
```

---

## 33. MULTI-APP DEPLOYMENT

> Birden fazla uygulama için bu dosya tekrar kullanılabilir.

### Kullanım

```
1. Bu dosyayı yeni projenin kök dizinine kopyala
2. Claude Code ile çalıştır
3. Proje otomatik taranır
4. Sorular sorulur
5. Metadata oluşturulur
6. Deploy yapılır

Her uygulama için ayrı:
- store-deployment/metadata/ klasörü oluşturulur
- store-deployment/reports/ klasöründe rapor oluşturulur
- store-deployment/screenshots/ klasöründe screenshot'lar saklanır
- APP_CONFIG değerleri o projeye özel olur
```

### Önceki Deploy'lardan Öğrenme

```
Claude Code önceki deployment'larda karşılaşılan sorunları hatırlar:
- Yaygın rejection sebepleri ve çözümleri
- Store kurallarındaki güncellemeler
- Karakter limiti sorunları ve çözümleri
- Screenshot boyut sorunları
- Build hataları ve çözümleri

Bu bilgiler report dosyalarında saklanır ve sonraki deploy'larda referans olarak kullanılır.
```

---

**VERSİYON**: 1.6
**TARİH**: 2026-02-20
**YAZAR**: Claude Code

### Changelog

**v1.6 (2026-02-20)**
- Bölüm 9.7: Google Play API Doğrudan Kullanım rehberi (Node.js) — auth, listing, image upload, AAB upload, track ayarlama
- Bölüm 9.8: Play Console Kurulum Kontrol Listesi — "draft app" sorunu ve 6 zorunlu alan
- Bölüm 9.9: Fastlane Supply Track Hatası — "undefined method size" ve "Package not found" çözümleri
- Bölüm 12.2: Android Build & Upload tamamen yenilendi — 3 yöntem (manuel/fastlane/API), ilk AAB kısıtlaması, fastlane lane şablonu
- Bölüm 14.3: 5 yeni Capacitor/Hybrid sorun eklendi (SORUN 7-11):
  - SORUN 7: Google Play ilk AAB API kısıtlaması
  - SORUN 8: Draft app kurulum listesi sorunu
  - SORUN 9: Fastlane supply track uyumsuzluğu
  - SORUN 10: Google Play icon fastlane desteği yok
  - SORUN 11: iOS/Android metadata dil kodu uyuşmazlığı
- DEPLOYMENT DAVRANIS KURALLARI eklendi — 12 "eğer...olursa...davran" kuralı (Google Play API, fastlane, SSL, GitHub Pages, draft app)
- Execution Pipeline güncellendi — Android deploy ve Store ayarları adımları detaylandırıldı
- İçindekiler tablosuna Bölüm 9.7, 9.8, 9.9 eklendi

**v1.5 (2026-02-20)**
- SCREENSHOT DAVRANIS KURALLARI eklendi — 11 "eğer...olursa...davran" kuralı
- React Flow sentetik event sorunu ve çözümü (page.click vs dispatchEvent)
- Leaf node tıklama doğrulaması (parent vs leaf node farkı)
- Tema kalıntısı koşulsuz sıfırlama kuralı
- Screenshot benzersizlik doğrulama kuralı
- Özellik kapsama kontrolü (her özellik en az 1 screenshot'ta)

**v1.4 (2026-02-19)**
- Section 7.5 genişletildi — Screenshot Otomasyon Sistemi (ekran tanımlama yapısı, akış, mimari kararlar)
- SORUN 15: Tema kalıntısı — koşulsuz tema sıfırlama zorunluluğu
- SORUN 16: Detail panel açılmıyor — leaf vs parent node click farkı
- SORUN 17: İki screenshot aynı görünüyor — benzersizlik doğrulama
- GENEL İPUÇLARI 9-12 eklendi: koşulsuz tema, leaf node, benzersizlik, özellik kapsamı
- Ekran tanımlama yapısı eklendi (spaceIdx, route sabitleri, overlay metinleri)
- Mimari kararlar bölümü eklendi (5 kritik karar)

**v1.3 (2026-02-19)**
- Screenshot Troubleshooting bölümü eklendi (7.8) — 14 sorun + 8 genel ipucu
- SORUN 8: Aynı ekranı gösteren screenshot'lar — spaceIdx / farklı route çözümü
- SORUN 10: IndexedDB/Dexie version conflict — localStorage-only injection
- SORUN 11: Fiyat bilgileri görünüyor — iki fazlı yaklaşım + CSS gizleme
- SORUN 12: Alpha channel — sharp flatten çözümü
- SORUN 13: Screenshot boyut uyuşmazlığı — deviceScaleFactor hesaplama
- SORUN 14: Auth re-inject sonrası redirect döngüsü
- GENEL İPUÇLARI bölümü eklendi — networkidle0, diagnostics, Zustand format, Capacitor fallback
- SCREENSHOT_RULE_0 güncellendi — form doldurmak yerine localStorage injection öncelikli (2.3)
- ADIM 1 güncellendi — localStorage injection öncelikli, form fallback (7.4)
- Demo data'da birden fazla space oluşturma kuralı eklendi (27)
- Capacitor/Hybrid sorunlar genişletildi (14.3) — 6 sorun, detaylı çözümler
- SORUN 5: App name tutarsızlığı (capacitor vs plist vs store)
- SORUN 6: webDir yanlış ayarı
- Pre-submission checklist'e 3 yeni blocker kontrol eklendi (15)
- ÇALIŞMA KURALLARI bölümü eklendi — low token mode, iş tamamlama garantisi, rapor kuralları
- Report kuralları genişletildi (17) — süre takibi, anlık güncelleme, source of truth
- Hata yönetimi güncellendi (13) — brute force yasağı, başarısız adım yönetimi
- ÇALIŞMA PRENSİBİ güncellendi — deploy-blocker tespiti, gereksiz soru yasağı

**v1.2 (2026-02-19)**
- Screenshot yöntemi sorusu (Q-SS4) tamamen yenilendi — Puppeteer her zaman varsayılan, Manuel sadece fallback (2.2)
- SCREENSHOT_RULE_0 ve SCREENSHOT_RULE_0B eklendi — otomatik sign-in ve Pro/Premium aktivasyonu zorunlu (2.3)
- Manuel Screenshot Kuralları (7.4) kaldırıldı, yerine Otomatik Screenshot Akışı (Sign-In Dahil) eklendi (7.4)
- Manuel Fallback bölümü eklendi — Puppeteer başarısız olursa kullanılacak workflow (7.4)

**v1.1 (2026-02-19)**
- iPhone 5.5" (1242x2208) zorunlu cihaz olarak eklendi (7.1 device tablosu, Puppeteer config, dosya yapısı)
- Metadata formatında `promotional_text` alanı `keywords` alanından önceye taşındı (4.1)
- `promotional_text` karakter limiti hedefi "150-170 arası (review gerekmez!)" olarak güncellendi (4.2)
- TIER GULF (Körfez Premium Pazarları — Kuveyt, Katar) fiyat katmanı eklendi (6.4)
- Manuel Screenshot Kuralları bölümü eklendi — sign-in gerektiren uygulamalar için workflow (7.4)
- Screenshot dosya yapısına 5.5-inch klasörü eklendi (7.6, 23)
- Puppeteer SCREENSHOT_CONFIGS'e appstore-5.5 viewport tanımı eklendi (7.5)

**v1.0 (2026-02-19)**
- İlk sürüm

---

Bu dosya herhangi bir projenin kök dizinine kopyalanıp Claude Code ile çalıştırıldığında:
1. Projeyi otomatik tarar (framework, diller, özellikler, credential'lar)
2. Kullanıcıya sadece tespit edilemeyen bilgileri sorar
3. Tüm dillerde store metadata oluşturur (karakter limitleri doğrulanmış)
4. Screenshot alır (Puppeteer ile otomatik veya manuel)
5. iOS ve Android build yapar
6. Her iki store'a upload eder
7. Store ayarlarını yapılandırır
8. Review'a gönderir
9. Tüm süreci detaylı bir REPORT dosyasına yazar
10. Hata alırsa düzeltir ve tekrar dener (max 5 retry per step)
