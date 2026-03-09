import { readFileSync } from 'fs';
import { createPrivateKey, sign } from 'crypto';

const KEY_PATH = '/Users/neslihan/Desktop/uygulama/mindful-notes-main/fastlane/AuthKey_3Y4L9XJC76.p8';
const KEY_ID = '3Y4L9XJC76';
const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';

function generateJWT() {
  const key = readFileSync(KEY_PATH, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const h = Buffer.from(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })).toString('base64url');
  const pk = createPrivateKey(key);
  const s = sign('SHA256', Buffer.from(`${h}.${p}`), { key: pk, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${h}.${p}.${s}`;
}

const token = generateJWT();
const BASE_V1 = 'https://api.appstoreconnect.apple.com/v1';
const BASE_V2 = 'https://api.appstoreconnect.apple.com/v2';

async function api(method, url, body) {
  const fullUrl = url.startsWith('http') ? url : `${BASE_V1}/${url}`;
  const opts = { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch(fullUrl, opts);
  const text = await resp.text();
  let data;
  try { data = JSON.parse(text); } catch { data = text; }
  return { ok: resp.ok, status: resp.status, data };
}

// IDs from previous creation
const MONTHLY_ID = '6759654031';
const YEARLY_ID = '6759654032';
const LIFETIME_ID = '6759654008';

// Target USD prices
const MONTHLY_PRICE_USD = 3.99;
const YEARLY_PRICE_USD = 29.99;
const LIFETIME_PRICE_USD = 49.99;

async function findSubscriptionPricePoint(subscriptionId, targetPrice) {
  // Fetch price points for USA territory
  let allPoints = [];
  let url = `subscriptions/${subscriptionId}/pricePoints?filter[territory]=USA&limit=200`;

  const resp = await api('GET', url);
  if (!resp.ok) {
    console.log(`  ❌ Could not fetch price points: ${resp.status}`);
    return null;
  }

  allPoints = resp.data?.data || [];
  console.log(`  Found ${allPoints.length} price points for USA`);

  // Find the closest matching price
  let bestMatch = null;
  let bestDiff = Infinity;

  for (const point of allPoints) {
    const price = parseFloat(point.attributes?.customerPrice || '0');
    const diff = Math.abs(price - targetPrice);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMatch = point;
    }
  }

  if (bestMatch) {
    console.log(`  Best match: $${bestMatch.attributes.customerPrice} (ID: ${bestMatch.id})`);
  }
  return bestMatch;
}

async function setSubscriptionPrice(subscriptionId, name, targetPrice) {
  console.log(`\n💰 Setting price for ${name} → $${targetPrice}...`);

  const pricePoint = await findSubscriptionPricePoint(subscriptionId, targetPrice);
  if (!pricePoint) {
    console.log(`  ❌ No matching price point found`);
    return;
  }

  // Check if price already set
  const existingResp = await api('GET', `subscriptions/${subscriptionId}/prices`);
  if (existingResp.ok && existingResp.data?.data?.length > 0) {
    console.log(`  ✅ Price already set`);
    return;
  }

  // Set the price
  const body = {
    data: {
      type: 'subscriptionPrices',
      attributes: {
        startDate: null, // Immediate
        preserveCurrentPrice: false,
      },
      relationships: {
        subscription: { data: { type: 'subscriptions', id: subscriptionId } },
        subscriptionPricePoint: { data: { type: 'subscriptionPricePoints', id: pricePoint.id } },
      },
    },
  };

  const resp = await api('POST', 'subscriptionPrices', body);
  if (resp.ok) {
    console.log(`  ✅ Price set to $${pricePoint.attributes.customerPrice}`);
  } else {
    console.log(`  ❌ ${resp.status}:`, resp.data?.errors?.[0]?.detail || JSON.stringify(resp.data?.errors?.[0]));
  }
}

async function findIAPPricePoint(iapId, targetPrice) {
  const resp = await api('GET', `${BASE_V2}/inAppPurchases/${iapId}/pricePoints?filter[territory]=USA&limit=200`);
  if (!resp.ok) {
    console.log(`  ❌ Could not fetch IAP price points: ${resp.status}`);
    return null;
  }

  const allPoints = resp.data?.data || [];
  console.log(`  Found ${allPoints.length} price points for USA`);

  let bestMatch = null;
  let bestDiff = Infinity;

  for (const point of allPoints) {
    const price = parseFloat(point.attributes?.customerPrice || '0');
    const diff = Math.abs(price - targetPrice);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestMatch = point;
    }
  }

  if (bestMatch) {
    console.log(`  Best match: $${bestMatch.attributes.customerPrice} (ID: ${bestMatch.id})`);
  }
  return bestMatch;
}

async function setIAPPrice(iapId, name, targetPrice) {
  console.log(`\n💰 Setting price for ${name} → $${targetPrice}...`);

  const pricePoint = await findIAPPricePoint(iapId, targetPrice);
  if (!pricePoint) {
    console.log(`  ❌ No matching price point found`);
    return;
  }

  // Set IAP price schedule
  const body = {
    data: {
      type: 'inAppPurchasePriceSchedules',
      relationships: {
        inAppPurchase: { data: { type: 'inAppPurchases', id: iapId } },
        baseTerritory: { data: { type: 'territories', id: 'USA' } },
        manualPrices: { data: [{ type: 'inAppPurchasePrices', id: '${price1}' }] },
      },
    },
    included: [{
      type: 'inAppPurchasePrices',
      id: '${price1}',
      attributes: { startDate: null },
      relationships: {
        inAppPurchasePricePoint: { data: { type: 'inAppPurchasePricePoints', id: pricePoint.id } },
      },
    }],
  };

  const resp = await api('POST', 'inAppPurchasePriceSchedules', body);
  if (resp.ok) {
    console.log(`  ✅ Price set to $${pricePoint.attributes.customerPrice}`);
  } else {
    console.log(`  ❌ ${resp.status}:`, resp.data?.errors?.[0]?.detail || JSON.stringify(resp.data?.errors?.[0]));
  }
}

async function main() {
  console.log('🔑 JWT ready\n');

  // Set subscription prices
  await setSubscriptionPrice(MONTHLY_ID, 'Pro Monthly', MONTHLY_PRICE_USD);
  await setSubscriptionPrice(YEARLY_ID, 'Pro Yearly', YEARLY_PRICE_USD);

  // Set IAP price
  await setIAPPrice(LIFETIME_ID, 'Pro Lifetime', LIFETIME_PRICE_USD);

  // Check final states
  console.log('\n📊 Final states:');
  for (const [name, id] of [['Monthly', MONTHLY_ID], ['Yearly', YEARLY_ID]]) {
    const resp = await api('GET', `subscriptions/${id}`);
    console.log(`  ${name}: ${resp.data?.data?.attributes?.state}`);
  }
  const iapResp = await api('GET', `${BASE_V2}/inAppPurchases/${LIFETIME_ID}`);
  console.log(`  Lifetime: ${iapResp.data?.data?.attributes?.state}`);
}

main().catch(console.error);
