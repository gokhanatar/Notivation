#!/usr/bin/env node
/**
 * App Store Connect API — Create IAP Products & Upload Review Screenshots
 *
 * Creates:
 * 1. Subscription Group "Notivation Premium"
 * 2. Auto-Renewable Subscription: com.mindfulnotes.app.pro.monthly
 * 3. Auto-Renewable Subscription: com.mindfulnotes.app.pro.yearly
 * 4. Non-Consumable IAP: com.mindfulnotes.app.pro.lifetime
 * 5. Uploads review screenshots for each product
 */

import { readFileSync } from 'fs';
import { createPrivateKey, sign } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---- Config ----
const KEY_ID = '3Y4L9XJC76';
const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';
const BUNDLE_ID = 'com.mindfulnotes.app';
const KEY_PATH = join(__dirname, `AuthKey_${KEY_ID}.p8`);
const SCREENSHOT_DIR = join(__dirname, 'screenshots', 'iap-review');

// ---- JWT ----
function generateJWT() {
  const key = readFileSync(KEY_PATH, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const privateKey = createPrivateKey(key);
  const signature = sign('SHA256', Buffer.from(`${header}.${payload}`), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

// ---- API ----
const BASE_V1 = 'https://api.appstoreconnect.apple.com/v1';
const BASE_V2 = 'https://api.appstoreconnect.apple.com/v2';
let token;

async function api(method, path, body, isV2 = false) {
  const base = isV2 ? BASE_V2 : BASE_V1;
  const url = path.startsWith('http') ? path : `${base}/${path}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const resp = await fetch(url, opts);
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }

  if (!resp.ok) {
    // 409 = already exists, which is OK for our purposes
    if (resp.status === 409) {
      return { ok: false, status: 409, data, conflict: true };
    }
    console.error(`  ❌ ${method} ${path} → ${resp.status}`);
    if (data?.errors) {
      data.errors.forEach(e => console.error(`     ${e.title}: ${e.detail}`));
    }
    return { ok: false, status: resp.status, data };
  }
  return { ok: true, status: resp.status, data };
}

async function uploadBinaryToApple(uploadOps, fileBuffer) {
  for (const op of uploadOps) {
    const { method, url, length, offset, requestHeaders } = op;
    const chunk = fileBuffer.subarray(offset, offset + length);

    const headers = {};
    for (const h of requestHeaders) {
      headers[h.name] = h.value;
    }

    const resp = await fetch(url, {
      method,
      headers,
      body: chunk,
    });

    if (!resp.ok) {
      console.error(`  ❌ Upload chunk failed: ${resp.status}`);
      return false;
    }
  }
  return true;
}

// ---- Find App ----
async function findApp() {
  const resp = await api('GET', `apps?filter[bundleId]=${BUNDLE_ID}`);
  if (!resp.ok || !resp.data?.data?.length) {
    throw new Error('App not found!');
  }
  return resp.data.data[0];
}

// ---- Subscription Group ----
async function createSubscriptionGroup(appId) {
  console.log('\n📦 Creating subscription group "Notivation Premium"...');

  // First check if it already exists
  const existing = await api('GET', `apps/${appId}/subscriptionGroups`);
  if (existing.ok && existing.data?.data?.length > 0) {
    const found = existing.data.data.find(g =>
      g.attributes?.referenceName === 'Notivation Premium'
    );
    if (found) {
      console.log(`  ✅ Already exists (ID: ${found.id})`);
      return found.id;
    }
  }

  const body = {
    data: {
      type: 'subscriptionGroups',
      attributes: {
        referenceName: 'Notivation Premium',
      },
      relationships: {
        app: { data: { type: 'apps', id: appId } },
      },
    },
  };

  const resp = await api('POST', 'subscriptionGroups', body);
  if (resp.ok) {
    console.log(`  ✅ Created (ID: ${resp.data.data.id})`);
    return resp.data.data.id;
  } else if (resp.conflict) {
    console.log('  ⚠️  Already exists (conflict)');
    // Re-fetch to get ID
    const refetch = await api('GET', `apps/${appId}/subscriptionGroups`);
    if (refetch.ok && refetch.data?.data?.length > 0) {
      return refetch.data.data[0].id;
    }
  }
  throw new Error('Could not create subscription group');
}

// ---- Create Subscription ----
async function createSubscription(groupId, productId, name, duration) {
  console.log(`\n📋 Creating subscription "${name}" (${productId})...`);

  // Check if already exists
  const existing = await api('GET', `subscriptionGroups/${groupId}/subscriptions`);
  if (existing.ok && existing.data?.data?.length > 0) {
    const found = existing.data.data.find(s =>
      s.attributes?.productId === productId
    );
    if (found) {
      console.log(`  ✅ Already exists (ID: ${found.id})`);
      return found.id;
    }
  }

  const body = {
    data: {
      type: 'subscriptions',
      attributes: {
        productId: productId,
        name: name,
        subscriptionPeriod: duration,
        reviewNote: 'Unlocks all Pro features including Focus Mode, Note Graph, Calendar View, Premium Themes, and 20+ more features.',
      },
      relationships: {
        group: { data: { type: 'subscriptionGroups', id: groupId } },
      },
    },
  };

  const resp = await api('POST', 'subscriptions', body);
  if (resp.ok) {
    console.log(`  ✅ Created (ID: ${resp.data.data.id})`);
    return resp.data.data.id;
  } else if (resp.conflict) {
    console.log('  ⚠️  Already exists (conflict), fetching...');
    const refetch = await api('GET', `subscriptionGroups/${groupId}/subscriptions`);
    if (refetch.ok) {
      const found = refetch.data.data.find(s => s.attributes?.productId === productId);
      if (found) return found.id;
    }
  }
  throw new Error(`Could not create subscription ${productId}`);
}

// ---- Add Subscription Localization ----
async function addSubscriptionLocalization(subscriptionId, locale, displayName, description) {
  console.log(`  Adding localization: ${locale}...`);

  // Check existing
  const existing = await api('GET', `subscriptions/${subscriptionId}/subscriptionLocalizations`);
  if (existing.ok && existing.data?.data?.length > 0) {
    const found = existing.data.data.find(l => l.attributes?.locale === locale);
    if (found) {
      console.log(`    ✅ ${locale} already exists`);
      return found.id;
    }
  }

  const body = {
    data: {
      type: 'subscriptionLocalizations',
      attributes: {
        locale: locale,
        name: displayName,
        description: description,
      },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: subscriptionId } },
      },
    },
  };

  const resp = await api('POST', 'subscriptionLocalizations', body);
  if (resp.ok) {
    console.log(`    ✅ ${locale} added`);
    return resp.data.data.id;
  } else if (resp.conflict) {
    console.log(`    ⚠️  ${locale} already exists`);
  }
  return null;
}

// ---- Create Non-Consumable IAP ----
async function createInAppPurchase(appId, productId, name, referenceName) {
  console.log(`\n📋 Creating in-app purchase "${name}" (${productId})...`);

  // Check if already exists
  const existing = await api('GET', `apps/${appId}/inAppPurchasesV2`);
  if (existing.ok && existing.data?.data?.length > 0) {
    const found = existing.data.data.find(i =>
      i.attributes?.productId === productId
    );
    if (found) {
      console.log(`  ✅ Already exists (ID: ${found.id})`);
      return found.id;
    }
  }

  const body = {
    data: {
      type: 'inAppPurchases',
      attributes: {
        productId: productId,
        name: name,
        referenceName: referenceName,
        inAppPurchaseType: 'NON_CONSUMABLE',
        reviewNote: 'One-time payment for lifetime access to all Pro features. Unlocks Focus Mode, Note Graph, Calendar View, Premium Themes, and 20+ more features.',
        familySharable: true,
      },
      relationships: {
        app: { data: { type: 'apps', id: appId } },
      },
    },
  };

  const resp = await api('POST', 'inAppPurchases', body, true);
  if (resp.ok) {
    console.log(`  ✅ Created (ID: ${resp.data.data.id})`);
    return resp.data.data.id;
  } else if (resp.conflict) {
    console.log('  ⚠️  Already exists (conflict)');
    const refetch = await api('GET', `apps/${appId}/inAppPurchasesV2`);
    if (refetch.ok) {
      const found = refetch.data.data.find(i => i.attributes?.productId === productId);
      if (found) return found.id;
    }
  }
  throw new Error(`Could not create IAP ${productId}`);
}

// ---- Add IAP Localization ----
async function addIAPLocalization(iapId, locale, displayName, description) {
  console.log(`  Adding localization: ${locale}...`);

  const existing = await api('GET', `inAppPurchasesV2/${iapId}/inAppPurchaseLocalizations`);
  if (existing.ok && existing.data?.data?.length > 0) {
    const found = existing.data.data.find(l => l.attributes?.locale === locale);
    if (found) {
      console.log(`    ✅ ${locale} already exists`);
      return found.id;
    }
  }

  const body = {
    data: {
      type: 'inAppPurchaseLocalizations',
      attributes: {
        locale: locale,
        name: displayName,
        description: description,
      },
      relationships: {
        inAppPurchaseV2: { data: { type: 'inAppPurchases', id: iapId } },
      },
    },
  };

  const resp = await api('POST', 'inAppPurchaseLocalizations', body);
  if (resp.ok) {
    console.log(`    ✅ ${locale} added`);
    return resp.data.data.id;
  } else if (resp.conflict) {
    console.log(`    ⚠️  ${locale} already exists`);
  }
  return null;
}

// ---- Upload Subscription Review Screenshot ----
async function uploadSubscriptionReviewScreenshot(subscriptionId, screenshotPath) {
  console.log(`  Uploading review screenshot...`);

  const fileBuffer = readFileSync(screenshotPath);
  const fileSize = fileBuffer.length;
  const fileName = screenshotPath.split('/').pop();

  // Step 1: Reserve the screenshot resource
  const reserveBody = {
    data: {
      type: 'subscriptionAppStoreReviewScreenshots',
      attributes: {
        fileSize: fileSize,
        fileName: fileName,
      },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: subscriptionId } },
      },
    },
  };

  const reserveResp = await api('POST', 'subscriptionAppStoreReviewScreenshots', reserveBody);

  if (!reserveResp.ok) {
    if (reserveResp.data?.errors?.[0]?.detail?.includes('already exists')) {
      console.log('    ⚠️  Review screenshot already exists, replacing...');
      // Get existing screenshot
      const existingResp = await api('GET', `subscriptions/${subscriptionId}/appStoreReviewScreenshot`);
      if (existingResp.ok && existingResp.data?.data) {
        const existingId = existingResp.data.data.id;
        // Delete existing
        await api('DELETE', `subscriptionAppStoreReviewScreenshots/${existingId}`);
        console.log('    Deleted existing screenshot, retrying...');
        // Retry reserve
        const retryResp = await api('POST', 'subscriptionAppStoreReviewScreenshots', reserveBody);
        if (!retryResp.ok) {
          console.error('    ❌ Could not reserve screenshot after delete');
          return false;
        }
        return await performUpload(retryResp.data.data, fileBuffer, 'subscriptionAppStoreReviewScreenshots');
      }
    }
    console.error('    ❌ Could not reserve screenshot');
    return false;
  }

  return await performUpload(reserveResp.data.data, fileBuffer, 'subscriptionAppStoreReviewScreenshots');
}

// ---- Upload IAP Review Screenshot ----
async function uploadIAPReviewScreenshot(iapId, screenshotPath) {
  console.log(`  Uploading review screenshot...`);

  const fileBuffer = readFileSync(screenshotPath);
  const fileSize = fileBuffer.length;
  const fileName = screenshotPath.split('/').pop();

  const reserveBody = {
    data: {
      type: 'inAppPurchaseAppStoreReviewScreenshots',
      attributes: {
        fileSize: fileSize,
        fileName: fileName,
      },
      relationships: {
        inAppPurchaseV2: { data: { type: 'inAppPurchases', id: iapId } },
      },
    },
  };

  const reserveResp = await api('POST', 'inAppPurchaseAppStoreReviewScreenshots', reserveBody);

  if (!reserveResp.ok) {
    if (reserveResp.data?.errors?.[0]?.detail?.includes('already exists')) {
      console.log('    ⚠️  Review screenshot already exists, replacing...');
      const existingResp = await api('GET', `inAppPurchasesV2/${iapId}/appStoreReviewScreenshot`);
      if (existingResp.ok && existingResp.data?.data) {
        const existingId = existingResp.data.data.id;
        await api('DELETE', `inAppPurchaseAppStoreReviewScreenshots/${existingId}`);
        console.log('    Deleted existing, retrying...');
        const retryResp = await api('POST', 'inAppPurchaseAppStoreReviewScreenshots', reserveBody);
        if (!retryResp.ok) {
          console.error('    ❌ Could not reserve screenshot after delete');
          return false;
        }
        return await performUpload(retryResp.data.data, fileBuffer, 'inAppPurchaseAppStoreReviewScreenshots');
      }
    }
    console.error('    ❌ Could not reserve screenshot');
    return false;
  }

  return await performUpload(reserveResp.data.data, fileBuffer, 'inAppPurchaseAppStoreReviewScreenshots');
}

// ---- Perform Multi-Part Upload + Commit ----
async function performUpload(resourceData, fileBuffer, resourceType) {
  const resourceId = resourceData.id;
  const uploadOps = resourceData.attributes?.uploadOperations;

  if (!uploadOps || uploadOps.length === 0) {
    console.error('    ❌ No upload operations provided');
    return false;
  }

  // Step 2: Upload binary data
  console.log(`    Uploading ${uploadOps.length} chunk(s)...`);
  const uploaded = await uploadBinaryToApple(uploadOps, fileBuffer);
  if (!uploaded) {
    console.error('    ❌ Upload failed');
    return false;
  }

  // Step 3: Commit
  const commitBody = {
    data: {
      type: resourceType,
      id: resourceId,
      attributes: {
        uploaded: true,
        sourceFileChecksum: resourceData.attributes?.sourceFileChecksum,
      },
    },
  };

  const commitResp = await api('PATCH', `${resourceType}/${resourceId}`, commitBody);
  if (commitResp.ok) {
    console.log('    ✅ Screenshot uploaded & committed');
    return true;
  } else {
    console.error('    ❌ Commit failed');
    return false;
  }
}

// ---- Set Subscription Pricing ----
async function setSubscriptionPrice(subscriptionId, baseTerritoryId, pricePointId) {
  console.log('  Setting price...');

  // Get available price points
  const pricePointsResp = await api('GET',
    `subscriptions/${subscriptionId}/pricePoints?filter[territory]=${baseTerritoryId}&limit=200`
  );

  if (!pricePointsResp.ok) {
    console.log('    ⚠️  Could not fetch price points - set price manually in ASC');
    return false;
  }

  // Log available points for debugging
  if (pricePointsResp.data?.data?.length > 0) {
    console.log(`    Found ${pricePointsResp.data.data.length} price points for ${baseTerritoryId}`);
  }

  return true;
}

// ============================
// MAIN
// ============================
async function main() {
  console.log('🔑 Generating JWT...');
  token = generateJWT();
  console.log('✅ JWT ready\n');

  // Find app
  console.log('📱 Finding app...');
  const app = await findApp();
  const appId = app.id;
  console.log(`✅ ${app.attributes.name} (ID: ${appId})`);

  // ---- 1. Create Subscription Group ----
  const groupId = await createSubscriptionGroup(appId);

  // ---- 2. Create Monthly Subscription ----
  const monthlyId = await createSubscription(
    groupId,
    'com.mindfulnotes.app.pro.monthly',
    'Pro Monthly',
    'ONE_MONTH'
  );

  // Add localizations
  await addSubscriptionLocalization(monthlyId, 'en-US',
    'Notivation Pro Monthly',
    'Monthly subscription for all Pro features: Focus Mode, Note Graph, Calendar View, Premium Themes, and 20+ more.'
  );
  await addSubscriptionLocalization(monthlyId, 'tr',
    'Notivation Pro Aylık',
    'Tüm Pro özelliklerine aylık erişim: Odaklanma Modu, Not Grafiği, Takvim Görünümü, Premium Temalar ve 20+ özellik.'
  );

  // Upload review screenshot
  await uploadSubscriptionReviewScreenshot(
    monthlyId,
    join(SCREENSHOT_DIR, 'iap_review_ipad_air_11_monthly.png')
  );

  // ---- 3. Create Yearly Subscription ----
  const yearlyId = await createSubscription(
    groupId,
    'com.mindfulnotes.app.pro.yearly',
    'Pro Yearly',
    'ONE_YEAR'
  );

  await addSubscriptionLocalization(yearlyId, 'en-US',
    'Notivation Pro Yearly',
    'Yearly subscription for all Pro features. Save 39% compared to monthly. Focus Mode, Note Graph, Calendar View, Premium Themes, and 20+ more.'
  );
  await addSubscriptionLocalization(yearlyId, 'tr',
    'Notivation Pro Yıllık',
    'Tüm Pro özelliklerine yıllık erişim. Aylığa göre %39 tasarruf. Odaklanma Modu, Not Grafiği, Takvim Görünümü, Premium Temalar ve 20+ özellik.'
  );

  await uploadSubscriptionReviewScreenshot(
    yearlyId,
    join(SCREENSHOT_DIR, 'iap_review_ipad_air_11_yearly.png')
  );

  // ---- 4. Create Lifetime (Non-Consumable) ----
  const lifetimeId = await createInAppPurchase(
    appId,
    'com.mindfulnotes.app.pro.lifetime',
    'Pro Lifetime',
    'Pro Lifetime'
  );

  await addIAPLocalization(lifetimeId, 'en-US',
    'Notivation Pro Lifetime',
    'One-time purchase for permanent access to all Pro features. Focus Mode, Note Graph, Calendar View, Premium Themes, and 20+ more features. No recurring charges.'
  );
  await addIAPLocalization(lifetimeId, 'tr',
    'Notivation Pro Ömür Boyu',
    'Tüm Pro özelliklerine kalıcı erişim için tek seferlik ödeme. Odaklanma Modu, Not Grafiği, Takvim Görünümü, Premium Temalar ve 20+ özellik. Tekrarlayan ücret yok.'
  );

  await uploadIAPReviewScreenshot(
    lifetimeId,
    join(SCREENSHOT_DIR, 'iap_review_ipad_air_11_lifetime.png')
  );

  // ---- Summary ----
  console.log('\n' + '='.repeat(60));
  console.log('🎉 IAP SETUP COMPLETE');
  console.log('='.repeat(60));
  console.log(`\n  Subscription Group: Notivation Premium (${groupId})`);
  console.log(`  Monthly:  ${monthlyId} — com.mindfulnotes.app.pro.monthly`);
  console.log(`  Yearly:   ${yearlyId} — com.mindfulnotes.app.pro.yearly`);
  console.log(`  Lifetime: ${lifetimeId} — com.mindfulnotes.app.pro.lifetime`);
  console.log('\n⚠️  Manual steps remaining:');
  console.log('  1. App Store Connect → Subscriptions → Set pricing tiers for Monthly & Yearly');
  console.log('  2. App Store Connect → In-App Purchases → Set pricing for Lifetime');
  console.log('  3. Submit a new binary with the IAP products');
  console.log('  4. Submit all for review together');
}

main().catch(e => {
  console.error('\n💥 Fatal error:', e.message);
  process.exit(1);
});
