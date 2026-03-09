#!/usr/bin/env node
/**
 * Converts store-deployment/metadata/{lang}/listing.json → fastlane/metadata/{locale}/ text files
 * AND organizes screenshots into fastlane/screenshots/{locale}/ with correct naming.
 *
 * Run: node fastlane/setup_metadata.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

const ROOT = resolve(import.meta.dirname, '..');
const STORE_META = join(ROOT, 'store-deployment', 'metadata');
const FASTLANE_META = join(ROOT, 'fastlane', 'metadata');
const STORE_SCREENSHOTS = join(ROOT, 'store-deployment', 'screenshots');
const FASTLANE_SCREENSHOTS = join(ROOT, 'fastlane', 'screenshots');

// ============================================================
// LANGUAGE CODE MAPPING: our codes → App Store Connect locales
// ============================================================
const LOCALE_MAP = {
  'en':    'en-US',
  'en-US': 'en-US',
  'tr':    'tr',
  'ar':    'ar-SA',
  'cs':    'cs',
  'da':    'da',
  'de':    'de-DE',
  'el':    'el',
  'es':    'es-ES',
  'fi':    'fi',
  'fr':    'fr-FR',
  'he':    'he',
  'hi':    'hi',
  'hu':    'hu',
  'id':    'id',
  'it':    'it',
  'ja':    'ja',
  'ko':    'ko',
  'ms':    'ms',
  'nl':    'nl-NL',
  'no':    'no',
  'pl':    'pl',
  'pt':    'pt-BR',
  'ro':    'ro',
  'ru':    'ru',
  'sk':    'sk',
  'sv':    'sv',
  'th':    'th',
  'uk':    'uk',
  'vi':    'vi',
  'zh':    'zh-Hans',
  // Not supported by App Store Connect — skip:
  // 'af', 'bg', 'bn', 'fa', 'sw', 'ta', 'ur'
};

// ============================================================
// PART 1: CONVERT METADATA
// ============================================================
console.log('=== METADATA CONVERSION ===\n');

let metaCount = 0;
const processedLocales = new Set();

for (const [ourCode, ascLocale] of Object.entries(LOCALE_MAP)) {
  const listingPath = join(STORE_META, ourCode, 'listing.json');
  if (!existsSync(listingPath)) {
    console.log(`  [skip] ${ourCode} — no listing.json found`);
    continue;
  }

  // Avoid duplicates (en and en-US both map to en-US)
  if (processedLocales.has(ascLocale)) continue;
  processedLocales.add(ascLocale);

  const listing = JSON.parse(readFileSync(listingPath, 'utf8'));
  const outDir = join(FASTLANE_META, ascLocale);
  mkdirSync(outDir, { recursive: true });

  // name.txt — App Store name (max 30 chars)
  writeFileSync(join(outDir, 'name.txt'), listing.title || 'Notivation');

  // subtitle.txt — App Store subtitle (max 30 chars)
  writeFileSync(join(outDir, 'subtitle.txt'), listing.subtitle || '');

  // description.txt — Full description (max 4000 chars)
  writeFileSync(join(outDir, 'description.txt'), listing.full_description || '');

  // keywords.txt — Comma-separated keywords (max 100 chars total)
  writeFileSync(join(outDir, 'keywords.txt'), listing.keywords || '');

  // promotional_text.txt — Promotional text (max 170 chars, can be updated without new version)
  writeFileSync(join(outDir, 'promotional_text.txt'), listing.promotional_text || '');

  // release_notes.txt — What's new (max 4000 chars)
  writeFileSync(join(outDir, 'release_notes.txt'), listing.whats_new || '');

  // privacy_url.txt
  writeFileSync(join(outDir, 'privacy_url.txt'), 'https://owebsite.wordpress.com/notivation-privacy-policy-terms-and-services/');

  // support_url.txt
  writeFileSync(join(outDir, 'support_url.txt'), 'https://owebsite.wordpress.com/contact/');

  // marketing_url.txt
  writeFileSync(join(outDir, 'marketing_url.txt'), 'https://owebsite.wordpress.com/notivation-privacy-policy-terms-and-services/');

  console.log(`  [ok] ${ourCode} → ${ascLocale} (${Object.keys(listing).length} fields)`);
  metaCount++;
}

// Write trade_representative_contact_information (required for some countries)
mkdirSync(join(FASTLANE_META, 'trade_representative_contact_information'), { recursive: true });

// Write review_information directory
mkdirSync(join(FASTLANE_META, 'review_information'), { recursive: true });
writeFileSync(join(FASTLANE_META, 'review_information', 'notes.txt'),
  readFileSync(join(ROOT, 'fastlane', 'review_notes.txt'), 'utf8'));

// Write copyright
writeFileSync(join(FASTLANE_META, 'copyright.txt'), '2026 Notivation');

// Write primary_category
writeFileSync(join(FASTLANE_META, 'primary_category.txt'), 'UTILITIES');
writeFileSync(join(FASTLANE_META, 'secondary_category.txt'), 'PRODUCTIVITY');

console.log(`\nMetadata: ${metaCount} locales converted.\n`);

// ============================================================
// PART 2: ORGANIZE SCREENSHOTS
// ============================================================
console.log('=== SCREENSHOT ORGANIZATION ===\n');

// Screenshot naming for fastlane deliver:
// {sort_order}_{device_type}_{screenshot_name}.png
//
// Device types for App Store Connect:
// APP_IPHONE_67   → 6.7-inch (iPhone 15 Pro Max) — 1290x2796
// APP_IPHONE_65   → 6.5-inch (iPhone 14 Plus)    — 1284x2778
// APP_IPHONE_55   → 5.5-inch (iPhone 8 Plus)     — 1242x2208

const DEVICE_MAP = {
  '6.7-inch':        'APP_IPHONE_67',
  '6.5-inch':        'APP_IPHONE_65',
  '5.5-inch':        'APP_IPHONE_55',
  'ipad-13-inch':    'APP_IPAD_PRO_6GEN_13',
};

// IMPORTANT: First 3 screenshots are most critical for App Store conversion.
// Current order is optimal:
//   01_hero_inbox    — Shows main value prop (Morning Brief, Clarity Score)
//   02_note_detail   — Shows depth (Decision analysis, Pros/Cons)
//   03_actions_today — Shows productivity (Task management)
//
// These 3 appear in search results and category listings.
// The remaining 7 show variety: themes, tools, settings.

// Languages that have generated screenshots
const SCREENSHOT_LANGS = ['en', 'tr', 'es', 'ar', 'hi', 'zh', 'pt', 'fr', 'de'];

let screenshotCount = 0;
const processedSSLocales = new Set();

for (const lang of SCREENSHOT_LANGS) {
  const ascLocale = LOCALE_MAP[lang];
  if (!ascLocale || processedSSLocales.has(ascLocale)) continue;
  processedSSLocales.add(ascLocale);

  const srcDir = join(STORE_SCREENSHOTS, 'appstore');
  if (!existsSync(srcDir)) continue;

  const outDir = join(FASTLANE_SCREENSHOTS, ascLocale);
  mkdirSync(outDir, { recursive: true });

  for (const [deviceDir, deviceType] of Object.entries(DEVICE_MAP)) {
    const devicePath = join(srcDir, deviceDir, lang);
    if (!existsSync(devicePath)) {
      console.log(`  [skip] ${ascLocale}/${deviceDir} — directory not found`);
      continue;
    }

    const files = readdirSync(devicePath)
      .filter(f => f.endsWith('.png'))
      .sort();

    files.forEach((file, index) => {
      const src = join(devicePath, file);
      // Fastlane naming: {order}_{device_type}_{seq}_{name}.png
      const dst = join(outDir, `${String(index).padStart(2, '0')}_${deviceType}_${String(index + 1).padStart(2, '0')}_${file}`);
      copyFileSync(src, dst);
      screenshotCount++;
    });

    console.log(`  [ok] ${ascLocale}/${deviceDir} (${deviceType}) — ${files.length} screenshots`);
  }
}

console.log(`\nScreenshots: ${screenshotCount} files across ${processedSSLocales.size} locales organized.\n`);

// ============================================================
// SUMMARY
// ============================================================
console.log('=== SUMMARY ===');
console.log(`  Metadata locales:  ${metaCount}`);
console.log(`  Screenshots:       ${screenshotCount}`);
console.log(`  Fastlane metadata: ${FASTLANE_META}`);
console.log(`  Fastlane screenshots: ${FASTLANE_SCREENSHOTS}`);
console.log(`\nReady for: fastlane upload_all`);
console.log('');
