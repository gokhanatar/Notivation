#!/usr/bin/env node
/**
 * Capture IAP Review Screenshots for App Store Connect
 *
 * Generates screenshots of ProModal for each plan (monthly, yearly, lifetime).
 * Uses Puppeteer to bypass onboarding, expose Zustand store, and capture.
 *
 * Apple IAP Review requires: PNG, min 640x920
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, '..', 'fastlane', 'screenshots', 'iap-review');
const DEV_URL = 'http://localhost:8090';

// Apple review device: iPad Air 11-inch (M3) - 820x1180 viewport
const DEVICES = [
  { name: 'ipad_air_11', width: 820, height: 1180, scale: 2 },
  { name: 'iphone_15_pro_max', width: 430, height: 932, scale: 3 },
];

const PLANS = ['monthly', 'yearly', 'lifetime'];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function captureForDevice(browser, device) {
  console.log(`\n📱 ${device.name} (${device.width}x${device.height} @${device.scale}x):`);

  const page = await browser.newPage();
  await page.setViewport({
    width: device.width,
    height: device.height,
    deviceScaleFactor: device.scale,
  });

  // Step 1: Set localStorage BEFORE loading the page to skip onboarding
  await page.goto(DEV_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.evaluate(() => {
    localStorage.setItem('notivation-onboarded', 'true');
    // Ensure not in Pro state so the ProModal shows purchase options
    localStorage.removeItem('mindful-notes-pro-status');
    localStorage.removeItem('mindful-notes-pro-plan');
  });

  // Reload with onboarding bypassed
  await page.goto(DEV_URL, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // Verify we're past onboarding
  const pageState = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return {
      buttons: btns.map(b => b.textContent?.trim()?.substring(0, 40)),
      hasNav: !!document.querySelector('nav'),
      hasBackdrop: !!document.querySelector('[class*="backdrop"]'),
    };
  });
  console.log(`  Page loaded: ${pageState.buttons.length} buttons, nav: ${pageState.hasNav}`);

  if (!pageState.hasNav) {
    // Still on onboarding or some other screen - try clicking Skip
    await page.evaluate(() => {
      const btns = document.querySelectorAll('button');
      for (const btn of btns) {
        const text = (btn.textContent || '').toLowerCase();
        if (text.includes('atla') || text.includes('skip')) {
          btn.click();
          return;
        }
      }
    });
    await new Promise(r => setTimeout(r, 2000));
  }

  // Now capture each plan
  for (const plan of PLANS) {
    console.log(`  Capturing ${plan}...`);

    // Open ProModal by manipulating Zustand persist storage directly
    // The store is persisted under 'decision-notes-ui' key
    await page.evaluate(() => {
      // Read current persisted state
      const stored = localStorage.getItem('decision-notes-ui');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.state.showProModal = true;
          localStorage.setItem('decision-notes-ui', JSON.stringify(parsed));
        } catch (e) { }
      }
    });

    // Reload to apply the persisted state change
    await page.goto(DEV_URL, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 2500));

    // Check if modal is open
    let modalOpen = await page.evaluate(() => {
      return !!document.querySelector('[class*="backdrop-blur"]');
    });

    if (!modalOpen) {
      console.log(`    Modal not open via persist, trying UI click...`);

      // Try settings → Pro feature click approach
      // First navigate to settings/tools
      await page.evaluate(() => {
        const nav = document.querySelector('nav');
        if (nav) {
          const btns = nav.querySelectorAll('button');
          // Try tools tab (usually 4th or settings-like)
          for (const btn of btns) {
            const text = (btn.textContent || '').toLowerCase();
            if (text.includes('tool') || text.includes('araç') || text.includes('ayar') || text.includes('settings')) {
              btn.click();
              return;
            }
          }
          // Click last nav button as fallback
          if (btns.length > 0) btns[btns.length - 1].click();
        }
      });
      await new Promise(r => setTimeout(r, 1500));

      // Scroll and look for Pro-locked features
      await page.evaluate(() => {
        const scrollContainers = document.querySelectorAll('[class*="overflow-y-auto"], [class*="overflow-auto"]');
        for (const container of scrollContainers) {
          container.scrollTop = 300;
        }
      });
      await new Promise(r => setTimeout(r, 800));

      // Click on Pro-locked features
      await page.evaluate(() => {
        const allElements = document.querySelectorAll('button, [role="button"], div[class*="cursor-pointer"]');
        for (const el of allElements) {
          const text = (el.textContent || '').toLowerCase();
          if (
            text.includes('pro') || text.includes('premium') ||
            text.includes('focus') || text.includes('odak') ||
            text.includes('graph') || text.includes('grafik') ||
            text.includes('calendar') || text.includes('takvim') ||
            text.includes('unlock') || text.includes('kilidi')
          ) {
            el.click();
            return true;
          }
        }
        return false;
      });
      await new Promise(r => setTimeout(r, 1500));

      modalOpen = await page.evaluate(() => !!document.querySelector('[class*="backdrop-blur"]'));
    }

    if (!modalOpen) {
      console.log(`    Still no modal, trying direct settings drawer...`);

      // Try opening settings drawer
      await page.evaluate(() => {
        // Look for settings gear icon
        const allBtns = document.querySelectorAll('button');
        for (const btn of allBtns) {
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          if (ariaLabel.includes('settings') || ariaLabel.includes('ayar')) {
            btn.click();
            return;
          }
        }
      });
      await new Promise(r => setTimeout(r, 1500));

      // Look for Pro features in settings drawer
      await page.evaluate(() => {
        const elements = document.querySelectorAll('button, [role="button"], div[class*="cursor"]');
        for (const el of elements) {
          const text = (el.textContent || '').toLowerCase();
          if (text.includes('pro') || text.includes('focus') || text.includes('odak') ||
              text.includes('theme') || text.includes('tema') || text.includes('font')) {
            el.click();
            return;
          }
        }
      });
      await new Promise(r => setTimeout(r, 1500));

      modalOpen = await page.evaluate(() => !!document.querySelector('[class*="backdrop-blur"]'));
    }

    if (modalOpen) {
      // Select the correct plan
      await page.evaluate((planType) => {
        // ProModal plan buttons have border-2 and rounded-2xl classes
        const planButtons = document.querySelectorAll('button[class*="rounded-2xl"][class*="border-2"]');
        const planIndex = { monthly: 0, yearly: 1, lifetime: 2 };
        const idx = planIndex[planType];
        if (planButtons[idx]) {
          planButtons[idx].click();
        }
      }, plan);
      await new Promise(r => setTimeout(r, 600));

      // Capture screenshot
      const filename = `iap_review_${device.name}_${plan}.png`;
      const outputPath = path.join(OUTPUT_DIR, filename);
      await page.screenshot({ path: outputPath, type: 'png' });
      console.log(`    ✅ ${filename}`);

      // Close modal
      await page.evaluate(() => {
        const closeBtn = document.querySelector('[aria-label="Close"]');
        if (closeBtn) closeBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));
    } else {
      // Debug: take screenshot to see what's on screen
      const debugPath = path.join(OUTPUT_DIR, `_debug_${device.name}_${plan}.png`);
      await page.screenshot({ path: debugPath, type: 'png' });
      console.log(`    ❌ Could not open ProModal (debug saved to ${path.basename(debugPath)})`);
    }
  }

  await page.close();
}

async function main() {
  console.log('🎬 Capturing IAP Review Screenshots for App Store Connect\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    for (const device of DEVICES) {
      await captureForDevice(browser, device);
    }
  } finally {
    await browser.close();
  }

  // List generated files
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => !f.startsWith('_'));
  console.log(`\n📁 Generated ${files.length} screenshots in: fastlane/screenshots/iap-review/`);
  files.forEach(f => console.log(`   • ${f}`));

  console.log('\n📋 Upload instructions:');
  console.log('   App Store Connect → My Apps → Notivation');
  console.log('   ─ Subscriptions → Pro Monthly → Review Info → Upload iap_review_*_monthly.png');
  console.log('   ─ Subscriptions → Pro Yearly → Review Info → Upload iap_review_*_yearly.png');
  console.log('   ─ In-App Purchases → Pro Lifetime → Review Info → Upload iap_review_*_lifetime.png');
}

main().catch(console.error);
