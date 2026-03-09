# FEATURES.md — Mindful Notes

Bu dosya projedeki tüm özelliklerin tek referans kaynağıdır.
This file is the single source of truth for all features in the project.

---

## Core Features / Temel Özellikler

### Note Management / Not Yönetimi
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Create notes | Not oluşturma | Done | No | `src/hooks/useNotes.ts`, `src/lib/db.ts` |
| Edit notes (autosave) | Not düzenleme (otomatik kayıt) | Done | No | `src/screens/NoteDetailScreen.tsx` |
| Delete notes | Not silme | Done | No | `src/hooks/useNotes.ts` |
| Archive notes (with undo) | Not arşivleme (geri al ile) | Done | No | `src/hooks/useNotes.ts`, `src/components/modals/UndoToast.tsx` |
| Pin notes | Not sabitleme | Done | No | `src/hooks/useNotes.ts` |
| Due dates | Bitiş tarihi | Done | No | `src/screens/NoteDetailScreen.tsx` |
| Note types (decision, action, info, idea, followup) | Not tipleri | Done | No | `src/lib/db.ts`, `src/components/notes/TypeBadge.tsx` |

### Vault / Kasa
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Vault notes (hide/show) | Notları kasaya al | Done | Yes | `src/hooks/useNotes.ts`, `src/screens/NoteDetailScreen.tsx` |
| Biometric vault auth | Biyometrik kasa doğrulaması | Done | Yes | `src/lib/native/biometrics.ts`, `src/hooks/useBiometrics.ts` |

### Action Items / Eylem Maddeleri
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Create action items | Eylem maddesi oluşturma | Done | No | `src/hooks/useNotes.ts` |
| Toggle complete | Tamamlandı işaretle | Done | No | `src/hooks/useNotes.ts` |
| Edit/Delete action items | Eylem düzenleme/silme | Done | No | `src/hooks/useNotes.ts` |

### Tags / Etiketler
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Create tags | Etiket oluşturma | Done | No | `src/hooks/useNotes.ts`, `src/lib/db.ts` |
| Add/remove tags on notes | Notlara etiket ekle/çıkar | Done | No | `src/hooks/useNotes.ts` |
| Delete tags | Etiket silme | Done | No | `src/hooks/useNotes.ts` |
| Tag display in NoteDetailScreen | Not detayında etiket gösterimi | Done | No | `src/screens/NoteDetailScreen.tsx`, `src/components/notes/TagPills.tsx` |
| Tag display in NoteCard | Not kartında etiket gösterimi | Done | No | `src/components/notes/NoteCard.tsx` |
| Auto-tagging suggestions | Otomatik etiket önerileri | Done | No | `src/lib/tags/autoTagger.ts`, `src/screens/NoteDetailScreen.tsx` |
| Accept/dismiss tag suggestions | Etiket önerisi kabul/ret | Done | No | `src/screens/NoteDetailScreen.tsx`, `src/components/notes/TagPills.tsx` |

### Natural Date Parsing / Doğal Tarih Ayrıştırma
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Parse natural language dates (TR/EN) | Doğal dil tarih ayrıştırma | Done | No | `src/lib/dates/naturalDateParser.ts` |
| Auto due-date from QuickNoteInput | Hızlı not'tan otomatik bitiş tarihi | Done | No | `src/components/notes/QuickNoteInput.tsx` |
| Date detection hint in NoteDetail | Not detayında tarih algılama ipucu | Done | No | `src/screens/NoteDetailScreen.tsx` |

### Wikilinks / Not Bağlantıları
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| [[Wikilink]] syntax parsing | [[Wikilink]] sözdizimi | Done | Yes | `src/lib/notes/wikilinks.ts` |
| Clickable wikilinks in Markdown preview | Markdown'da tıklanabilir bağlantılar | Done | Yes | `src/components/notes/MarkdownPreview.tsx` |
| Wikilink navigation (open linked note) | Bağlantılı nota git | Done | Yes | `src/screens/NoteDetailScreen.tsx` |
| Backlinks (see notes linking to this) | Geri bağlantılar | Done | Yes | `src/screens/NoteDetailScreen.tsx`, `src/lib/notes/wikilinks.ts` |

### Note Color Coding / Not Renk Kodlama
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Color picker in NoteDetail | Not detayında renk seçici | Done | No | `src/components/notes/ColorPicker.tsx`, `src/screens/NoteDetailScreen.tsx` |
| Color indicator on NoteCard | Not kartında renk göstergesi | Done | No | `src/components/notes/NoteCard.tsx` |

### Search / Arama
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Full-text search | Tam metin arama | Done | No | `src/screens/SearchScreen.tsx`, `src/lib/db.ts` |
| Semantic search | Anlamsal arama | Done | No | `src/lib/search/semanticSearch.ts` |
| Intent-based matching | Niyet tabanlı eşleşme | Done | No | `src/lib/search/intentDictionary.ts` |

### Views / Görünümler
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Inbox screen | Gelen kutusu | Done | No | `src/screens/InboxScreen.tsx` |
| Actions screen (today/week/overdue) | Eylemler ekranı | Done | No | `src/screens/ActionsScreen.tsx` |
| Views screen | Görünümler ekranı | Done | No | `src/screens/ViewsScreen.tsx` |
| Search screen | Arama ekranı | Done | No | `src/screens/SearchScreen.tsx` |
| Settings screen | Ayarlar ekranı | Done | No | `src/screens/SettingsScreen.tsx` |

### Theming / Tema
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Multiple themes (light, dark, warm, kids, senior, minimal) | Çoklu tema | Done | No | `src/index.css`, `src/screens/SettingsScreen.tsx` |
| Class-based dark mode | Sınıf tabanlı karanlık mod | Done | No | `src/hooks/useNotes.ts` (useThemeManager) |

### i18n / Çoklu Dil
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Multi-language support | Çoklu dil desteği | Done | No | `src/lib/i18n/`, `src/lib/i18n/translations.ts` |

### Monetization / Gelir
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Promo code activation | Promosyon kodu etkinleştirme | Done | — | `src/lib/promoCode.ts`, `src/components/modals/ProModal.tsx` |
| Pro-gated features | Pro kilitli özellikler | Done | — | `src/components/notes/ProLockedState.tsx` |

### Data / Veri
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Offline-first (IndexedDB) | Çevrimdışı öncelikli | Done | No | `src/lib/db.ts` |
| Statistics | İstatistikler | Done | No | `src/lib/db.ts` (getStats) |

---

## Native iOS Features / Native iOS Özellikleri (Capacitor)

### Capacitor Integration / Capacitor Entegrasyonu
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Native iOS container | Native iOS container | Done | No | `capacitor.config.ts`, `src/lib/capacitor.ts` |
| Status bar sync | Durum çubuğu senkronu | Done | No | `src/lib/native/statusBar.ts` |
| Splash screen | Açılış ekranı | Done | No | `src/main.tsx` |
| Persistent storage | Kalıcı depolama | Done | No | `src/lib/db.ts` |

### Local Notifications / Yerel Bildirimler
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Due date notifications | Bitiş tarihi bildirimleri | Done | No | `src/lib/native/notifications.ts` |
| Notification tap → open note | Bildirime tıkla → notu aç | Done | No | `src/hooks/useNotifications.ts` |
| Vault notes skip notifications | Kasa notlarına bildirim gitmez | Done | No | `src/lib/native/notifications.ts` |

### Biometric Auth / Biyometrik Doğrulama
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Face ID / Touch ID | Face ID / Touch ID | Done | Yes | `src/lib/native/biometrics.ts` |
| App lock screen | Uygulama kilit ekranı | Done | Yes | `src/hooks/useBiometrics.ts`, `src/components/native/AppLockScreen.tsx` |
| Auto-lock on inactivity | İnaktivitede otomatik kilitleme | Done | Yes | `src/hooks/useBiometrics.ts` |

### Haptic Feedback / Dokunsal Geri Bildirim
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Haptic on interactions | Etkileşimlerde dokunsal geri bildirim | Done | No | `src/lib/native/haptics.ts` |

---

## Navigation / Navigasyon
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Bottom tab navigation | Alt sekme navigasyonu | Done | No | `src/components/layout/BottomNav.tsx` |
| Framer Motion transitions | Geçiş animasyonları | Done | No | `src/pages/Index.tsx` |

---

## UI Components / UI Bileşenleri
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Drag & Drop wrapper (SortableItem) | Sürükle & Bırak | Done | No | `src/components/dnd/SortableItem.tsx` |
| Markdown preview (lazy-loaded) | Markdown önizleme | Done | Yes | `src/components/notes/MarkdownPreview.tsx` |
| Photo attachments (camera/gallery) | Fotoğraf ekleri | Done | No | `src/screens/NoteDetailScreen.tsx`, `src/lib/native/camera.ts` |
| Image viewer modal | Resim görüntüleyici | Done | No | `src/components/modals/ImageViewer.tsx` |
| Auto-title for untitled notes | Başlıksız notlara otomatik başlık | Done | No | `src/lib/utils/autoTitle.ts` |

---

## Activity & Reports / Aktivite & Raporlar
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Activity log | Aktivite günlüğü | Done | No | `src/screens/ActionsScreen.tsx`, `src/lib/actions/actionEvents.ts` |
| Weekly digest / report | Haftalık özet rapor | Done | Yes | `src/screens/WeeklyDigestScreen.tsx` |
| Archive screen | Arşiv ekranı | Done | No | `src/screens/ArchiveScreen.tsx` |

---

## Accessibility / Erişilebilirlik
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| aria-label on all icon-only buttons | Tüm ikon butonlarda aria-label | Done | No | All screens |
| role="radiogroup" for type/color selectors | Tip/renk seçicilerde role | Done | No | `NoteDetailScreen`, `QuickNoteInput`, `ColorPicker` |
| aria-expanded/pressed states | ARIA durum öznitelikleri | Done | No | `NoteDetailScreen`, `SearchScreen` |
| role="tablist" for navigation tabs | Navigasyon sekmelerinde role | Done | No | `ActionsScreen`, `BottomNav` |
| aria-live for dynamic feedback | Dinamik geri bildirim için aria-live | Done | No | `QuickNoteInput` |
| Keyboard support for interactive elements | Etkileşimli öğelerde klavye desteği | Done | No | `ActionsScreen` |
| role="search" for search input | Arama girişinde role | Done | No | `SearchScreen` |

---

## Cognitive Companion Features / Bilişsel Yardımcı Özellikleri (PRD v3.0)

### Incubation Mode / Yaratıcı Kuluçka
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Incubate notes (hide for X days) | Notları kuluçkaya alma | Done | Yes | `src/lib/incubation/incubationEngine.ts`, `src/components/modals/IncubationSheet.tsx` |
| Incubation badge on NoteCard | NoteCard'da kuluçka rozeti | Done | Yes | `src/components/notes/IncubationBadge.tsx` |
| Wake-up card in Morning Brief | Morning Brief'te uyanma kartı | Done | Yes | `src/components/morningBrief/IncubationWakeUpCard.tsx` |
| Early wake-up | Erken uyandırma | Done | Yes | `src/components/modals/IncubationSheet.tsx` |

### Fresh Start Triggers / Taze Başlangıç Tetikleyicileri
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Milestone day detection | Kilometre taşı günü algılama | Done | No | `src/lib/freshStart/freshStartEngine.ts` |
| Motivational banner in Morning Brief | Morning Brief'te motivasyon banneri | Done | No | `src/components/morningBrief/FreshStartBanner.tsx` |
| Weekly intention setting | Haftalık niyet belirleme | Done | No | `src/components/morningBrief/FreshStartBanner.tsx` |
| Birthday setting | Doğum günü ayarı | Done | No | `src/screens/SettingsScreen.tsx` |

### Let Go Ritual / Bırakma Ritueli
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Guided release flow | Yönlendirilmiş bırakma akışı | Done | Yes | `src/components/modals/LetGoFlow.tsx` |
| Gratitude & reflection steps | Minnettarlık & yansıma adımları | Done | Yes | `src/components/modals/LetGoFlow.tsx` |
| Learning extraction | Öğrenim çıkarma | Done | Yes | `src/lib/letgo/letGoEngine.ts` |

### Momentum Bar + Struggle Zone / İvme Çubuğu + Mücadele Bölgesi
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Daily momentum calculation | Günlük ivme hesaplama | Done | No | `src/lib/momentum/momentumEngine.ts` |
| Momentum bar (compact/full) | İvme çubuğu | Done | No | `src/components/notes/MomentumBar.tsx` |
| Momentum widget in Morning Brief | Morning Brief'te ivme widgeti | Done | No | `src/components/morningBrief/MomentumWidget.tsx` |
| Struggle zone detection + empathy | Mücadele bölgesi algılama | Done | No | `src/components/modals/StruggleZoneSheet.tsx` |

### Open Loops Manager / Açık Döngü Yöneticisi
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Categorized open loops (Stale/Waiting/Active/Forgotten) | Kategorize açık döngüler | Done | Yes | `src/lib/openLoops/openLoopsEngine.ts`, `src/screens/OpenLoopsScreen.tsx` |
| Triage actions (Resolve/Defer/Archive) | Triyaj eylemleri | Done | Yes | `src/screens/OpenLoopsScreen.tsx` |
| Open loops summary in Morning Brief | Morning Brief'te açık döngü özeti | Done | Yes | `src/components/morningBrief/OpenLoopsSummary.tsx` |

### Confidence Calibration / Güven Kalibrasyonu
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Confidence slider (1-10) on decisions | Kararlarda güven slideri | Done | Yes | `src/components/decisions/ConfidenceSlider.tsx` |
| Calibration chart (predicted vs actual) | Kalibrasyon grafiği | Done | Yes | `src/components/decisions/CalibrationChart.tsx` |
| Calibration card in Decide screen | Decide ekranında kalibrasyon kartı | Done | Yes | `src/components/decisions/CalibrationCard.tsx` |

### Future Cast / Gelecek Tahmini (If-Then Senaryolar)
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Scenario builder (condition + outcomes) | Senaryo oluşturucu | Done | Yes | `src/components/decisions/ScenarioBuilder.tsx` |
| Scenario tree visualization | Senaryo ağaç görselleştirme | Done | Yes | `src/components/decisions/ScenarioTree.tsx` |
| Scenario resolution flow | Senaryo çözüm akışı | Done | Yes | `src/components/decisions/ScenarioResolveFlow.tsx` |
| Scenario cards in NoteDetail | Not detayında senaryo kartları | Done | Yes | `src/components/decisions/ScenarioCard.tsx` |

### My Words / Kelimelerim
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Word frequency analysis (TF-IDF) | Kelime frekans analizi | Done | Yes | `src/lib/myWords/myWordsEngine.ts` |
| Word cloud view | Kelime bulutu | Done | Yes | `src/components/modals/MyWordsModal.tsx` |
| Vocabulary growth tracking | Kelime dağarcığı büyüme takibi | Done | Yes | `src/components/modals/MyWordsModal.tsx` |

### Nested Folders / İç İçe Klasörler
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Folder CRUD + tree structure | Klasör CRUD + ağaç yapısı | Done | Yes | `src/lib/folders/folderEngine.ts`, `src/screens/FoldersScreen.tsx` |
| Folder picker for notes | Not için klasör seçici | Done | Yes | `src/components/notes/FolderPicker.tsx` |
| Folder breadcrumb in NoteDetail | Not detayında klasör yolu | Done | Yes | `src/components/notes/FolderBreadcrumb.tsx` |
| Folder chip on NoteCard | NoteCard'da klasör etiketi | Done | Yes | `src/components/notes/FolderChip.tsx` |

### Canvas / Mind Map / Zihin Haritası
| Feature | Özellik | Status | Pro | Files |
|---------|---------|--------|-----|-------|
| Canvas view (draggable note cards) | Kanvas görünümü | Done | Yes | `src/components/canvas/CanvasView.tsx`, `src/components/canvas/CanvasNoteCard.tsx` |
| Note connections (SVG bezier) | Not bağlantıları | Done | Yes | `src/components/canvas/ConnectionLine.tsx` |
| Canvas toolbar (zoom, layout, connect) | Kanvas araç çubuğu | Done | Yes | `src/components/canvas/CanvasToolbar.tsx` |
| Auto-layout (force-directed) | Otomatik düzenleme | Done | Yes | `src/lib/canvas/canvasEngine.ts` |
| Connection dialog | Bağlantı oluşturma dialogu | Done | Yes | `src/components/canvas/CanvasConnectionDialog.tsx` |
