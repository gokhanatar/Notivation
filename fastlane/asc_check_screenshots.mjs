#!/usr/bin/env node
/**
 * Check screenshot status on App Store Connect for all locales
 */
import { readFileSync } from 'fs';
import { sign, createPrivateKey } from 'crypto';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KEY_ID = '3Y4L9XJC76';
const ISSUER_ID = '7927d78f-7f09-4ff0-bad9-6c36b8afcaf5';
const KEY_PATH = join(__dirname, `AuthKey_${KEY_ID}.p8`);
const APP_ID = '6759493897';

function base64url(data) { return Buffer.from(data).toString('base64url'); }

function generateJWT() {
  const key = readFileSync(KEY_PATH, 'utf8');
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }));
  const payload = base64url(JSON.stringify({ iss: ISSUER_ID, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' }));
  const privateKey = createPrivateKey(key);
  const sig = sign('SHA256', Buffer.from(`${header}.${payload}`), { key: privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${header}.${payload}.${sig}`;
}

const BASE = 'https://api.appstoreconnect.apple.com/v1';
let token;

async function api(path) {
  const url = path.startsWith('http') ? path : `${BASE}/${path}`;
  const resp = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await resp.json();
  return { ok: resp.ok, status: resp.status, data };
}

async function main() {
  token = generateJWT();

  // Get the app store version
  const versionsResp = await api(`apps/${APP_ID}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION`);
  if (!versionsResp.ok || !versionsResp.data?.data?.length) {
    console.log('No version found in PREPARE_FOR_SUBMISSION state');
    // Try getting all versions
    const allVersions = await api(`apps/${APP_ID}/appStoreVersions`);
    console.log('All versions:', JSON.stringify(allVersions.data?.data?.map(v => ({
      id: v.id,
      state: v.attributes?.appStoreState,
      version: v.attributes?.versionString
    }))));
    return;
  }

  const version = versionsResp.data.data[0];
  const versionId = version.id;
  console.log(`Version: ${version.attributes?.versionString} (${version.attributes?.appStoreState})\n`);

  // Get all localizations for this version
  const locsResp = await api(`appStoreVersions/${versionId}/appStoreVersionLocalizations`);
  if (!locsResp.ok) {
    console.log('Failed to get localizations');
    return;
  }

  const localizations = locsResp.data.data;
  console.log(`Found ${localizations.length} localizations\n`);

  // Check screenshots for each localization
  const results = [];
  for (const loc of localizations) {
    const locale = loc.attributes?.locale;
    const locId = loc.id;

    // Get screenshot sets
    const setsResp = await api(`appStoreVersionLocalizations/${locId}/appScreenshotSets`);
    let totalScreenshots = 0;
    const devices = [];

    if (setsResp.ok && setsResp.data?.data?.length > 0) {
      for (const set of setsResp.data.data) {
        const deviceType = set.attributes?.screenshotDisplayType;
        // Get screenshots in this set
        const ssResp = await api(`appScreenshotSets/${set.id}/appScreenshots`);
        const count = ssResp.ok ? (ssResp.data?.data?.length || 0) : 0;
        totalScreenshots += count;
        if (count > 0) {
          devices.push(`${deviceType}:${count}`);
        }
      }
    }

    const status = totalScreenshots > 0 ? '✅' : '❌';
    results.push({ locale, totalScreenshots, devices });
    console.log(`${status} ${locale}: ${totalScreenshots} screenshots ${devices.length > 0 ? `(${devices.join(', ')})` : '(EMPTY)'}`);
  }

  console.log('\n--- Summary ---');
  const withScreenshots = results.filter(r => r.totalScreenshots > 0);
  const withoutScreenshots = results.filter(r => r.totalScreenshots === 0);
  console.log(`With screenshots: ${withScreenshots.length} locales`);
  console.log(`Without screenshots: ${withoutScreenshots.length} locales`);
  if (withoutScreenshots.length > 0) {
    console.log(`Missing: ${withoutScreenshots.map(r => r.locale).join(', ')}`);
  }
}

main().catch(e => console.error('Error:', e.message));
