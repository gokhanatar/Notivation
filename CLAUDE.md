# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

- `npm run dev` — Start Vite dev server on localhost:8080
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run test` — Run Vitest (jsdom environment)
- `npm run test:watch` — Vitest in watch mode

Single test: `npx vitest run src/test/example.test.ts`

## Architecture

**Notivation** is an offline-first PWA for capturing decisions, actions, and notes. Built with React 18 + TypeScript + Vite (SWC) + Tailwind CSS.

### Data Layer

- **Database**: Dexie (IndexedDB wrapper) defined in `src/lib/db.ts`. Tables: `notes`, `actionItems`, `tags`, `noteTags`, `settings`. All CRUD goes through helper functions in that file.
- **Note types**: `decision`, `action`, `info`, `idea`, `followup` — each has a dedicated color in Tailwind config.
- **Action items** are sub-items within notes, tracked separately in the `actionItems` table with `noteId` foreign key.

### State Management

- **Zustand** store in `src/store/useStore.ts` holds UI state (active tab, filters, sorting, theme, pro status, modals) and an in-memory data cache. UI preferences persist via Zustand's `persist` middleware (storage key: `decision-notes-ui`).
- **Data sync hooks** in `src/hooks/useNotes.ts` use a custom listener/subscriber pattern to broadcast data changes across components, decoupled from Zustand.
- **TanStack React Query** is configured but the app primarily reads/writes through Dexie directly.

### Routing & Screens

- Single route (`/`) renders `src/pages/Index.tsx`, which switches between screens based on Zustand's `activeTab`.
- Screens live in `src/screens/` — InboxScreen, ActionsScreen, ViewsScreen, SearchScreen, SettingsScreen, NoteDetailScreen.
- Bottom tab navigation in `src/components/layout/BottomNav.tsx` with Framer Motion animations.

### UI Components

- **shadcn/ui** components in `src/components/ui/` — import and customize from there, don't create parallel component sets.
- Path alias: `@/` maps to `src/` (configured in vite.config.ts and tsconfig).
- Theming: class-based dark mode with multiple themes (light, dark, warm, kids, senior, minimal) via CSS variables in `src/index.css`.

### Monetization

- Web promo code system in `src/lib/promoCode.ts`. Valid code activates lifetime Pro via localStorage.
- Pro-gated features use `ProLockedState` component and `isPro` from Zustand.
- ProModal in `src/components/modals/ProModal.tsx` shows promo code input.

### i18n

- Translation system in `src/lib/i18n/` with a hook-based API. Large translation object in `translations.ts`.

### Search

- Semantic search with scoring in `src/lib/search/semanticSearch.ts` and intent-based keyword matching in `intentDictionary.ts`.

## TypeScript Configuration

TypeScript is configured loosely: `noImplicitAny: false`, `strictNullChecks: false`, no unused variable checks. Target is ES2020 with bundler module resolution.

## Testing

Tests use Vitest with jsdom and globals enabled. Setup file at `src/test/setup.ts` mocks `matchMedia`.

## Feature Documentation

- `FEATURES.md` projedeki tüm özelliklerin tek referans kaynağıdır.
- Her özellik eklendiğinde/değiştiğinde/kaldırıldığında güncellenmeli.

## Native iOS & Android (Capacitor)

- Capacitor 6 config in `capacitor.config.ts`, appId: `com.mindfulnotes.app`
- Native helpers in `src/lib/capacitor.ts` — `isNative`, `isIOS`, `isAndroid`, `isWeb`, `runNative()`
- Status bar sync: `src/lib/native/statusBar.ts`
- Local notifications: `src/lib/native/notifications.ts`
- Biometric auth (Face ID / Touch ID / Android BiometricPrompt): `src/lib/native/biometrics.ts`
- Haptic feedback: `src/lib/native/haptics.ts`
- All native calls are guarded with `isNative` — web builds skip silently
- Auth: Device-local only (biometric + passcode). No Firebase/Supabase — no backend needed.
- Build for iOS: `npm run cap:ios`
- Build for Android: `npm run cap:android`
- Sync both: `npm run cap:sync`
