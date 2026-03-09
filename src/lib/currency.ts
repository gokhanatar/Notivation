// Currency detection and pricing based on user's location
// Prices calculated using Latte Index (174 countries, USD=1.00 base)
// Base: US $1.99/month, $15.99/year, $47.99/lifetime
// Priority: GPS → Timezone → navigator.language → default (USD)

interface CurrencyInfo {
  code: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  monthly: number;
  yearly: number;
  lifetime: number;
  noDecimals?: boolean;
}

const tzCountryMap: Record<string, string> = {
  // Turkey
  'Europe/Istanbul': 'TR',
  // Russia
  'Europe/Moscow': 'RU', 'Asia/Yekaterinburg': 'RU', 'Asia/Novosibirsk': 'RU',
  'Europe/Kaliningrad': 'RU', 'Asia/Vladivostok': 'RU',
  // Western Europe
  'Europe/London': 'GB', 'Europe/Paris': 'FR', 'Europe/Berlin': 'DE',
  'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'Europe/Amsterdam': 'NL',
  'Europe/Brussels': 'BE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH',
  'Europe/Oslo': 'NO', 'Europe/Stockholm': 'SE', 'Europe/Copenhagen': 'DK',
  'Europe/Helsinki': 'FI', 'Europe/Dublin': 'IE', 'Europe/Luxembourg': 'LU',
  'Europe/Lisbon': 'PT', 'Europe/Athens': 'GR',
  // Eastern Europe
  'Europe/Warsaw': 'PL', 'Europe/Prague': 'CZ', 'Europe/Budapest': 'HU',
  'Europe/Bucharest': 'RO', 'Europe/Sofia': 'BG', 'Europe/Kiev': 'UA',
  'Europe/Zagreb': 'HR', 'Europe/Belgrade': 'RS', 'Europe/Ljubljana': 'SI',
  'Europe/Bratislava': 'SK', 'Europe/Tallinn': 'EE', 'Europe/Vilnius': 'LT',
  'Europe/Riga': 'LV',
  // Middle East
  'Asia/Riyadh': 'SA', 'Asia/Dubai': 'AE', 'Asia/Tehran': 'IR',
  'Asia/Baghdad': 'IQ', 'Asia/Amman': 'JO', 'Asia/Beirut': 'LB',
  'Asia/Kuwait': 'KW', 'Asia/Qatar': 'QA', 'Asia/Muscat': 'OM',
  'Asia/Jerusalem': 'IL',
  // Africa
  'Africa/Cairo': 'EG', 'Africa/Casablanca': 'MA', 'Africa/Tunis': 'TN',
  'Africa/Lagos': 'NG', 'Africa/Nairobi': 'KE', 'Africa/Johannesburg': 'ZA',
  'Africa/Algiers': 'DZ',
  // South Asia
  'Asia/Karachi': 'PK', 'Asia/Kolkata': 'IN', 'Asia/Dhaka': 'BD',
  'Asia/Colombo': 'LK', 'Asia/Kathmandu': 'NP',
  // Southeast Asia
  'Asia/Jakarta': 'ID', 'Asia/Kuala_Lumpur': 'MY', 'Asia/Singapore': 'SG',
  'Asia/Bangkok': 'TH', 'Asia/Ho_Chi_Minh': 'VN', 'Asia/Manila': 'PH',
  'Asia/Yangon': 'MM', 'Asia/Phnom_Penh': 'KH',
  // East Asia
  'Asia/Tokyo': 'JP', 'Asia/Seoul': 'KR', 'Asia/Taipei': 'TW',
  'Asia/Hong_Kong': 'HK', 'Asia/Shanghai': 'CN', 'Asia/Chongqing': 'CN',
  // Central Asia
  'Asia/Almaty': 'KZ', 'Asia/Tashkent': 'UZ', 'Asia/Baku': 'AZ',
  'Asia/Tbilisi': 'GE', 'Asia/Yerevan': 'AM',
  // Americas
  'America/New_York': 'US', 'America/Chicago': 'US',
  'America/Denver': 'US', 'America/Los_Angeles': 'US',
  'America/Toronto': 'CA', 'America/Vancouver': 'CA',
  'America/Sao_Paulo': 'BR', 'America/Mexico_City': 'MX',
  'America/Argentina/Buenos_Aires': 'AR', 'America/Bogota': 'CO',
  'America/Santiago': 'CL', 'America/Lima': 'PE',
  // Oceania
  'Australia/Sydney': 'AU', 'Australia/Melbourne': 'AU',
  'Pacific/Auckland': 'NZ',
};

const langCountryMap: Record<string, string> = {
  'tr': 'TR', 'ru': 'RU', 'de': 'DE', 'fr': 'FR', 'es': 'ES',
  'it': 'IT', 'pt': 'BR', 'ja': 'JP', 'ko': 'KR', 'zh': 'CN',
  'ar': 'SA', 'hi': 'IN', 'nl': 'NL', 'pl': 'PL', 'uk': 'UA',
  'vi': 'VN', 'th': 'TH', 'id': 'ID', 'ms': 'MY', 'sv': 'SE',
  'da': 'DK', 'nb': 'NO', 'fi': 'FI', 'cs': 'CZ', 'sk': 'SK',
  'hu': 'HU', 'ro': 'RO', 'bg': 'BG', 'el': 'GR', 'he': 'IL',
  'fa': 'IR', 'bn': 'BD', 'ta': 'IN', 'ur': 'PK', 'sw': 'KE',
  'af': 'ZA', 'ka': 'GE', 'az': 'AZ', 'kk': 'KZ', 'uz': 'UZ',
  'hy': 'AM', 'hr': 'HR', 'sr': 'RS', 'sl': 'SI', 'et': 'EE',
  'lt': 'LT', 'lv': 'LV', 'fil': 'PH',
};

// Fallback prices (used on web and when store products unavailable)
// On native, real prices are fetched from App Store / Google Play
// Base: US $1.99/mo. Latte Index × exchange rate → local price
const currencyMap: Record<string, CurrencyInfo> = {
  // ═══════════════════════════════════════════════════
  // TIER 1 — Premium Markets (index > 1.50)
  // ═══════════════════════════════════════════════════

  // Qatar (7.00) — QAR×3.64
  QA: { code: 'QAR', symbol: 'ر.ق', symbolPosition: 'after', monthly: 22.99, yearly: 179.99, lifetime: 549.99 },
  // Saudi Arabia (5.00) — SAR×3.75
  SA: { code: 'SAR', symbol: 'ر.س', symbolPosition: 'after', monthly: 21.99, yearly: 174.99, lifetime: 529.99 },
  // Switzerland (2.29) — CHF×0.87
  CH: { code: 'CHF', symbol: 'CHF', symbolPosition: 'before', monthly: 3.99, yearly: 29.99, lifetime: 94.99 },
  // Norway (2.19) — NOK×10.5
  NO: { code: 'NOK', symbol: 'kr', symbolPosition: 'after', monthly: 45, yearly: 359, lifetime: 1079, noDecimals: true },
  // Denmark (2.09) — DKK×6.85
  DK: { code: 'DKK', symbol: 'kr', symbolPosition: 'after', monthly: 29, yearly: 229, lifetime: 699, noDecimals: true },
  // Singapore (1.89) — SGD×1.34
  SG: { code: 'SGD', symbol: 'S$', symbolPosition: 'before', monthly: 4.99, yearly: 39.99, lifetime: 119.99 },
  // Israel (3.22) — ILS×3.65
  IL: { code: 'ILS', symbol: '₪', symbolPosition: 'before', monthly: 12.99, yearly: 99.99, lifetime: 309.99 },
  // Ireland (1.79) — EUR
  IE: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },
  // UAE (1.74) — AED×3.67
  AE: { code: 'AED', symbol: 'د.إ', symbolPosition: 'after', monthly: 12.99, yearly: 99.99, lifetime: 309.99 },
  // Kuwait (4.00) — KWD×0.31
  KW: { code: 'KWD', symbol: 'د.ك', symbolPosition: 'after', monthly: 0.99, yearly: 7.99, lifetime: 23.99 },
  // Finland (1.64) — EUR
  FI: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },
  // Sweden (1.59) — SEK×10.5
  SE: { code: 'SEK', symbol: 'kr', symbolPosition: 'after', monthly: 35, yearly: 279, lifetime: 839, noDecimals: true },
  // Netherlands (1.54) — EUR
  NL: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },
  // France (1.49) — EUR
  FR: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },

  // ═══════════════════════════════════════════════════
  // TIER 2 — Standard Markets (index 0.80–1.50)
  // ═══════════════════════════════════════════════════

  // Belgium (1.44) — EUR
  BE: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },
  // UK (1.39) — GBP×0.77
  GB: { code: 'GBP', symbol: '£', symbolPosition: 'before', monthly: 2.09, yearly: 16.49, lifetime: 50 },
  // Austria (1.34) — EUR
  AT: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },
  // Germany (1.29) — EUR
  DE: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.19, yearly: 17.9, lifetime: 53.9 },
  // Italy (1.24) — EUR
  IT: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.29, yearly: 17.99, lifetime: 54.99 },
  // Luxembourg (2.04) — EUR
  LU: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },
  // USA (1.00) — reference
  US: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 1.99, yearly: 15.99, lifetime: 47.99 },
  // Canada (0.98) — CAD×1.37
  CA: { code: 'CAD', symbol: 'CA$', symbolPosition: 'before', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },
  // Australia (0.97) — AUD×1.55
  AU: { code: 'AUD', symbol: 'A$', symbolPosition: 'before', monthly: 2.99, yearly: 22.99, lifetime: 69.99 },
  // New Zealand (0.95) — NZD×1.70
  NZ: { code: 'NZD', symbol: 'NZ$', symbolPosition: 'before', monthly: 2.99, yearly: 22.99, lifetime: 69.99 },
  // Spain (0.94) — EUR
  ES: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.79, yearly: 13.99, lifetime: 42.99 },
  // South Korea (0.92) — KRW×1484
  KR: { code: 'KRW', symbol: '₩', symbolPosition: 'before', monthly: 2700, yearly: 21900, lifetime: 65500, noDecimals: true },
  // Japan (0.90) — JPY×149
  JP: { code: 'JPY', symbol: '¥', symbolPosition: 'before', monthly: 280, yearly: 2280, lifetime: 6800, noDecimals: true },
  // Taiwan (0.87) — TWD×32
  TW: { code: 'TWD', symbol: 'NT$', symbolPosition: 'before', monthly: 55, yearly: 439, lifetime: 1290, noDecimals: true },
  // Hong Kong (0.86) — HKD×7.8
  HK: { code: 'HKD', symbol: 'HK$', symbolPosition: 'before', monthly: 12.99, yearly: 99.99, lifetime: 309.99 },
  // Cyprus (0.85) — EUR
  CY: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Malta (0.84) — EUR
  MT: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Slovenia (0.83) — EUR
  SI: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Turkey (0.46) — TRY×44.18
  TR: { code: 'TRY', symbol: '₺', symbolPosition: 'before', monthly: 40, yearly: 329, lifetime: 979, noDecimals: true },
  // Estonia (0.81) — EUR
  EE: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Czech Republic (0.80) — CZK×23.5
  CZ: { code: 'CZK', symbol: 'Kč', symbolPosition: 'after', monthly: 37.99, yearly: 299.99, lifetime: 899.99 },

  // ═══════════════════════════════════════════════════
  // TIER 3 — Emerging Markets (index 0.40–0.80)
  // ═══════════════════════════════════════════════════

  // Slovakia (0.79) — EUR
  SK: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Greece (0.78) — EUR
  GR: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Portugal (0.77) — EUR
  PT: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Lithuania (0.76) — EUR
  LT: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Latvia (0.75) — EUR
  LV: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Poland (0.74) — PLN×4.05
  PL: { code: 'PLN', symbol: 'zł', symbolPosition: 'after', monthly: 5.99, yearly: 47.99, lifetime: 139.99 },
  // Hungary (0.73) — HUF×370
  HU: { code: 'HUF', symbol: 'Ft', symbolPosition: 'after', monthly: 549, yearly: 4390, lifetime: 12990, noDecimals: true },
  // Romania (0.72) — RON×4.6
  RO: { code: 'RON', symbol: 'lei', symbolPosition: 'after', monthly: 6.99, yearly: 54.99, lifetime: 164.99 },
  // Bulgaria (0.71) — BGN×1.80
  BG: { code: 'BGN', symbol: 'лв', symbolPosition: 'after', monthly: 2.49, yearly: 19.99, lifetime: 59.99 },
  // Croatia (0.70) — EUR
  HR: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.49, yearly: 11.99, lifetime: 34.99 },
  // Serbia (0.69) — EUR approximation
  RS: { code: 'EUR', symbol: '€', symbolPosition: 'after', monthly: 1.29, yearly: 9.99, lifetime: 29.99 },
  // Georgia (0.63) — use USD
  GE: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 1.29, yearly: 9.99, lifetime: 29.99 },
  // Armenia (0.62) — use USD
  AM: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 1.29, yearly: 9.99, lifetime: 29.99 },
  // Azerbaijan (0.61) — use USD
  AZ: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 1.29, yearly: 9.99, lifetime: 29.99 },
  // Russia (0.60) — RUB×95
  RU: { code: 'RUB', symbol: '₽', symbolPosition: 'after', monthly: 119, yearly: 949, lifetime: 2790, noDecimals: true },
  // Ukraine (0.58) — UAH×41
  UA: { code: 'UAH', symbol: '₴', symbolPosition: 'before', monthly: 47.99, yearly: 379.99, lifetime: 1149.99 },
  // Kazakhstan (0.57) — KZT×470
  KZ: { code: 'KZT', symbol: '₸', symbolPosition: 'before', monthly: 549, yearly: 4390, lifetime: 12990, noDecimals: true },
  // Uzbekistan (0.56) — use USD
  UZ: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 1.29, yearly: 9.99, lifetime: 29.99 },
  // China (0.51) — CNY×7.25
  CN: { code: 'CNY', symbol: '¥', symbolPosition: 'before', monthly: 7.90, yearly: 59.90, lifetime: 189.90 },
  // Brazil (0.50) — BRL×5.8
  BR: { code: 'BRL', symbol: 'R$', symbolPosition: 'before', monthly: 5.0, yearly: 42, lifetime: 125.9 },
  // Mexico (0.49) — MXN×20.3
  MX: { code: 'MXN', symbol: '$', symbolPosition: 'before', monthly: 17, yearly: 140, lifetime: 420, noDecimals: true },
  // Argentina (0.48) — ARS×900
  AR: { code: 'ARS', symbol: '$', symbolPosition: 'before', monthly: 899, yearly: 6990, lifetime: 21490, noDecimals: true },
  // Chile (0.47) — CLP×950
  CL: { code: 'CLP', symbol: '$', symbolPosition: 'before', monthly: 899, yearly: 6990, lifetime: 21490, noDecimals: true },
  // Colombia (0.46) — COP×4266
  CO: { code: 'COP', symbol: '$', symbolPosition: 'before', monthly: 3500, yearly: 27900, lifetime: 83500, noDecimals: true },
  // Peru (0.45) — PEN×3.75
  PE: { code: 'PEN', symbol: 'S/', symbolPosition: 'before', monthly: 3.49, yearly: 27.90, lifetime: 84.90 },

  // ═══════════════════════════════════════════════════
  // TIER 4 — Developing Markets (index 0.15–0.40)
  // ═══════════════════════════════════════════════════

  // India (0.24) — INR×92
  IN: { code: 'INR', symbol: '₹', symbolPosition: 'before', monthly: 45, yearly: 355, lifetime: 1059, noDecimals: true },
  // Pakistan (0.23) — PKR×280
  PK: { code: 'PKR', symbol: '₨', symbolPosition: 'before', monthly: 129, yearly: 990, lifetime: 2990, noDecimals: true },
  // Bangladesh (0.22) — BDT×110
  BD: { code: 'BDT', symbol: '৳', symbolPosition: 'before', monthly: 49, yearly: 390, lifetime: 1190, noDecimals: true },
  // Sri Lanka (0.21) — use USD
  LK: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.49, yearly: 3.99, lifetime: 11.99 },
  // Nepal (0.20) — use USD
  NP: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.49, yearly: 3.99, lifetime: 11.99 },
  // Indonesia (0.18) — IDR×16000
  ID: { code: 'IDR', symbol: 'Rp', symbolPosition: 'before', monthly: 5900, yearly: 47900, lifetime: 139900, noDecimals: true },
  // Malaysia (0.18) — MYR×4.45
  MY: { code: 'MYR', symbol: 'RM', symbolPosition: 'before', monthly: 1.90, yearly: 14.90, lifetime: 44.90 },
  // Philippines (0.17) — PHP×57
  PH: { code: 'PHP', symbol: '₱', symbolPosition: 'before', monthly: 19, yearly: 149, lifetime: 449, noDecimals: true },
  // Thailand (0.17) — THB×35
  TH: { code: 'THB', symbol: '฿', symbolPosition: 'before', monthly: 12.90, yearly: 99, lifetime: 299 },
  // Vietnam (0.16) — VND×25000
  VN: { code: 'VND', symbol: '₫', symbolPosition: 'after', monthly: 7900, yearly: 59000, lifetime: 189000, noDecimals: true },
  // Egypt (0.15) — EGP×51
  EG: { code: 'EGP', symbol: 'ج.م', symbolPosition: 'after', monthly: 15, yearly: 125, lifetime: 370, noDecimals: true },
  // Iran (0.15) — use USD
  IR: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.29, yearly: 2.29, lifetime: 6.99 },
  // Iraq (0.15) — use USD
  IQ: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.29, yearly: 2.29, lifetime: 6.99 },
  // Jordan (0.15) — use USD
  JO: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.29, yearly: 2.29, lifetime: 6.99 },
  // Lebanon (0.15) — use USD
  LB: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.29, yearly: 2.29, lifetime: 6.99 },
  // Oman (0.15) — use USD
  OM: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.29, yearly: 2.29, lifetime: 6.99 },
  // Morocco (0.15) — use USD
  MA: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.29, yearly: 2.29, lifetime: 6.99 },
  // Tunisia (0.15) — use USD
  TN: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.29, yearly: 2.29, lifetime: 6.99 },
  // Algeria (0.15) — use USD
  DZ: { code: 'USD', symbol: '$', symbolPosition: 'before', monthly: 0.29, yearly: 2.29, lifetime: 6.99 },
  // South Africa (0.15) — ZAR×18.5
  ZA: { code: 'ZAR', symbol: 'R', symbolPosition: 'before', monthly: 5.49, yearly: 44.99, lifetime: 134.99 },
  // Nigeria (0.15) — NGN×1550
  NG: { code: 'NGN', symbol: '₦', symbolPosition: 'before', monthly: 449, yearly: 3490, lifetime: 10900, noDecimals: true },
  // Kenya (0.15) — KES×155
  KE: { code: 'KES', symbol: 'KSh', symbolPosition: 'before', monthly: 45, yearly: 349, lifetime: 1090, noDecimals: true },
};

function detectCountry(): string {
  // 1. GPS-based country (set by setLocationFromGPS)
  const gpsCountry = localStorage.getItem('user-country-gps');
  if (gpsCountry) return gpsCountry.toUpperCase();

  // 2. Timezone-based detection
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tzCountryMap[tz]) return tzCountryMap[tz];
  } catch { /* ignore */ }

  // 3. navigator.language (last resort)
  try {
    const lang = navigator.language;
    // Try full locale first (en-US → US)
    const parts = lang.split('-');
    if (parts.length > 1) {
      const country = parts[1].toUpperCase();
      if (currencyMap[country]) return country;
    }
    // Try language code
    const langCode = parts[0].toLowerCase();
    if (langCountryMap[langCode]) return langCountryMap[langCode];
  } catch { /* ignore */ }

  // 4. Default
  return 'US';
}

export function getUserCurrency(): CurrencyInfo {
  const country = detectCountry();
  return currencyMap[country] || currencyMap.US;
}

export function formatPrice(amount: number, currency: CurrencyInfo): string {
  const value = currency.noDecimals ? Math.round(amount).toLocaleString() : amount.toFixed(2);
  if (currency.symbolPosition === 'after') {
    return `${value} ${currency.symbol}`;
  }
  return `${currency.symbol}${value}`;
}

export type PlanType = 'monthly' | 'yearly' | 'lifetime';

export interface PricingPlan {
  type: PlanType;
  price: number;
  priceString: string;
  period: string;
  monthlyEquivalent?: string;
  savePercent?: number;
}

export function getPricingPlans(): PricingPlan[] {
  const c = getUserCurrency();
  const monthlyPerYear = c.monthly * 12;
  const yearlySave = Math.round(((monthlyPerYear - c.yearly) / monthlyPerYear) * 100);

  return [
    {
      type: 'monthly',
      price: c.monthly,
      priceString: formatPrice(c.monthly, c),
      period: 'monthly',
    },
    {
      type: 'yearly',
      price: c.yearly,
      priceString: formatPrice(c.yearly, c),
      period: 'yearly',
      monthlyEquivalent: formatPrice(c.yearly / 12, c),
      savePercent: yearlySave,
    },
    {
      type: 'lifetime',
      price: c.lifetime,
      priceString: formatPrice(c.lifetime, c),
      period: 'lifetime',
    },
  ];
}
