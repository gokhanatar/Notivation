import {
  addDays,
  addWeeks,
  addMonths,
  nextMonday,
  nextTuesday,
  nextWednesday,
  nextThursday,
  nextFriday,
  nextSaturday,
  nextSunday,
  lastDayOfMonth,
  startOfToday,
  startOfTomorrow,
  startOfYesterday,
  startOfDay,
} from 'date-fns';

interface DateParseResult {
  date: Date;
  matchedText: string;
}

// --- Day maps ---

const turkishDayMap: Record<string, (date: Date) => Date> = {
  'pazartesi': nextMonday,
  'salı': nextTuesday,
  'çarşamba': nextWednesday,
  'perşembe': nextThursday,
  'cuma': nextFriday,
  'cumartesi': nextSaturday,
  'pazar': nextSunday,
};

const englishDayMap: Record<string, (date: Date) => Date> = {
  'monday': nextMonday,
  'tuesday': nextTuesday,
  'wednesday': nextWednesday,
  'thursday': nextThursday,
  'friday': nextFriday,
  'saturday': nextSaturday,
  'sunday': nextSunday,
};

// --- Pattern definitions ---
// Each pattern has a regex and a resolver that receives the match groups and returns a Date.
// Patterns are tested in order; the first match wins.

interface DatePattern {
  regex: RegExp;
  resolve: (match: RegExpMatchArray) => Date;
}

function buildPatterns(): DatePattern[] {
  const now = () => new Date();

  // Turkish day names joined for regex alternation
  const trDays = Object.keys(turkishDayMap).join('|');
  const enDays = Object.keys(englishDayMap).join('|');

  return [
    // ---- Turkish exact / simple keywords ----
    {
      regex: /(?:^|\s)bugün(?:\s|$)/i,
      resolve: () => startOfToday(),
    },
    {
      regex: /(?:^|\s)yar[ıi]n(?:\s|$)/i,
      resolve: () => startOfTomorrow(),
    },
    {
      regex: /(?:^|\s)dün(?:\s|$)/i,
      resolve: () => startOfYesterday(),
    },

    // ---- English exact / simple keywords ----
    {
      regex: /\btoday\b/i,
      resolve: () => startOfToday(),
    },
    {
      regex: /\btomorrow\b/i,
      resolve: () => startOfTomorrow(),
    },
    {
      regex: /\byesterday\b/i,
      resolve: () => startOfYesterday(),
    },

    // ---- Turkish: "X gün/hafta/ay sonra" ----
    {
      regex: /(?:^|\s)(\d+)\s+gün\s+sonra(?:\s|$)/i,
      resolve: (m) => startOfDay(addDays(now(), parseInt(m[1], 10))),
    },
    {
      regex: /(?:^|\s)(\d+)\s+hafta\s+sonra(?:\s|$)/i,
      resolve: (m) => startOfDay(addWeeks(now(), parseInt(m[1], 10))),
    },
    {
      regex: /(?:^|\s)(\d+)\s+ay\s+sonra(?:\s|$)/i,
      resolve: (m) => startOfDay(addMonths(now(), parseInt(m[1], 10))),
    },

    // ---- English: "in X days/weeks/months" ----
    {
      regex: /\bin\s+(\d+)\s+days?\b/i,
      resolve: (m) => startOfDay(addDays(now(), parseInt(m[1], 10))),
    },
    {
      regex: /\bin\s+(\d+)\s+weeks?\b/i,
      resolve: (m) => startOfDay(addWeeks(now(), parseInt(m[1], 10))),
    },
    {
      regex: /\bin\s+(\d+)\s+months?\b/i,
      resolve: (m) => startOfDay(addMonths(now(), parseInt(m[1], 10))),
    },

    // ---- Turkish: "gelecek <day>" ----
    {
      regex: new RegExp(`(?:^|\\s)gelecek\\s+(${trDays})(?:\\s|$)`, 'i'),
      resolve: (m) => {
        const dayKey = m[1].toLowerCase();
        const fn = turkishDayMap[dayKey];
        return fn ? startOfDay(fn(now())) : startOfToday();
      },
    },

    // ---- Turkish: "önümüzdeki <day>" ----
    {
      regex: new RegExp(`(?:^|\\s)önümüzdeki\\s+(${trDays})(?:\\s|$)`, 'i'),
      resolve: (m) => {
        const dayKey = m[1].toLowerCase();
        const fn = turkishDayMap[dayKey];
        return fn ? startOfDay(fn(now())) : startOfToday();
      },
    },

    // ---- Turkish: "bu <day>" (this coming day) ----
    {
      regex: new RegExp(`(?:^|\\s)bu\\s+(${trDays})(?:\\s|$)`, 'i'),
      resolve: (m) => {
        const dayKey = m[1].toLowerCase();
        const fn = turkishDayMap[dayKey];
        return fn ? startOfDay(fn(now())) : startOfToday();
      },
    },

    // ---- English: "next <day>" ----
    {
      regex: new RegExp(`\\bnext\\s+(${enDays})\\b`, 'i'),
      resolve: (m) => {
        const dayKey = m[1].toLowerCase();
        const fn = englishDayMap[dayKey];
        return fn ? startOfDay(fn(now())) : startOfToday();
      },
    },

    // ---- English: "this <day>" ----
    {
      regex: new RegExp(`\\bthis\\s+(${enDays})\\b`, 'i'),
      resolve: (m) => {
        const dayKey = m[1].toLowerCase();
        const fn = englishDayMap[dayKey];
        return fn ? startOfDay(fn(now())) : startOfToday();
      },
    },

    // ---- Turkish: "gelecek hafta" (next week → next Monday) ----
    {
      regex: /(?:^|\s)gelecek\s+hafta(?:\s|$)/i,
      resolve: () => startOfDay(nextMonday(now())),
    },

    // ---- Turkish: "haftaya" (next week → next Monday) ----
    {
      regex: /(?:^|\s)haftaya(?:\s|$)/i,
      resolve: () => startOfDay(nextMonday(now())),
    },

    // ---- Turkish: "önümüzdeki hafta" (next week → next Monday) ----
    {
      regex: /(?:^|\s)önümüzdeki\s+hafta(?:\s|$)/i,
      resolve: () => startOfDay(nextMonday(now())),
    },

    // ---- English: "next week" → next Monday ----
    {
      regex: /\bnext\s+week\b/i,
      resolve: () => startOfDay(nextMonday(now())),
    },

    // ---- Turkish: "gelecek ay" (next month → 1st of next month) ----
    {
      regex: /(?:^|\s)gelecek\s+ay(?:\s|$)/i,
      resolve: () => {
        const d = addMonths(now(), 1);
        return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
      },
    },

    // ---- English: "next month" → 1st of next month ----
    {
      regex: /\bnext\s+month\b/i,
      resolve: () => {
        const d = addMonths(now(), 1);
        return startOfDay(new Date(d.getFullYear(), d.getMonth(), 1));
      },
    },

    // ---- Turkish: "ayın sonu" (end of current month) ----
    {
      regex: /(?:^|\s)ayın\s+sonu(?:\s|$)/i,
      resolve: () => startOfDay(lastDayOfMonth(now())),
    },

    // ---- English: "end of month" ----
    {
      regex: /\bend\s+of\s+month\b/i,
      resolve: () => startOfDay(lastDayOfMonth(now())),
    },
  ];
}

/**
 * Parse a complete text string as a natural language date expression.
 * Returns a Date (at start of day) if recognized, or null otherwise.
 * Case-insensitive. Leading/trailing whitespace is trimmed.
 */
export function parseNaturalDate(text: string): Date | null {
  if (!text || typeof text !== 'string') return null;

  // Use toLocaleLowerCase('tr') to handle Turkish İ/I correctly
  // e.g. "YARIN" → "yarın" (not "yarin"), "SALI" → "salı" (not "sali")
  const normalized = text.trim().toLocaleLowerCase('tr');
  if (normalized.length === 0) return null;

  const patterns = buildPatterns();

  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (match) {
      return pattern.resolve(match);
    }
  }

  return null;
}

/**
 * Find the first natural language date mention within a longer text.
 * Returns the parsed Date and the matched substring, or null if none found.
 */
export function extractDateMention(text: string): DateParseResult | null {
  if (!text || typeof text !== 'string') return null;

  const normalized = text.trim().toLocaleLowerCase('tr');
  if (normalized.length === 0) return null;

  const patterns = buildPatterns();

  // Track the earliest match by index position
  let bestResult: DateParseResult | null = null;
  let bestIndex = Infinity;

  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (match && match.index !== undefined && match.index < bestIndex) {
      bestIndex = match.index;
      bestResult = {
        date: pattern.resolve(match),
        matchedText: match[0].trim(),
      };
    }
  }

  return bestResult;
}
