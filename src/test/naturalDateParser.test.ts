import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseNaturalDate, extractDateMention } from '@/lib/dates/naturalDateParser';

describe('naturalDateParser', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Thursday, February 19, 2026 at 10:00 AM
    vi.setSystemTime(new Date('2026-02-19T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('parseNaturalDate', () => {
    // --- Turkish keywords ---

    it('parses "bugün" as today', () => {
      const result = parseNaturalDate('bugün');
      expect(result).toEqual(new Date('2026-02-19T00:00:00'));
    });

    it('parses "yarın" as tomorrow', () => {
      const result = parseNaturalDate('yarın');
      expect(result).toEqual(new Date('2026-02-20T00:00:00'));
    });

    it('parses "dün" as yesterday', () => {
      const result = parseNaturalDate('dün');
      expect(result).toEqual(new Date('2026-02-18T00:00:00'));
    });

    it('parses "3 gün sonra" as +3 days', () => {
      const result = parseNaturalDate('3 gün sonra');
      expect(result).toEqual(new Date('2026-02-22T00:00:00'));
    });

    it('parses "2 hafta sonra" as +2 weeks', () => {
      const result = parseNaturalDate('2 hafta sonra');
      expect(result).toEqual(new Date('2026-03-05T00:00:00'));
    });

    it('parses "1 ay sonra" as +1 month', () => {
      const result = parseNaturalDate('1 ay sonra');
      expect(result).toEqual(new Date('2026-03-19T00:00:00'));
    });

    it('parses "gelecek cuma" as next Friday (Feb 20)', () => {
      // Feb 19 is Thursday, so next Friday is Feb 20
      const result = parseNaturalDate('gelecek cuma');
      expect(result).toEqual(new Date('2026-02-20T00:00:00'));
    });

    it('parses "önümüzdeki çarşamba" as next Wednesday (Feb 25)', () => {
      // Feb 19 is Thursday, so next Wednesday is Feb 25
      const result = parseNaturalDate('önümüzdeki çarşamba');
      expect(result).toEqual(new Date('2026-02-25T00:00:00'));
    });

    it('parses "bu cumartesi" as this Saturday (Feb 21)', () => {
      const result = parseNaturalDate('bu cumartesi');
      expect(result).toEqual(new Date('2026-02-21T00:00:00'));
    });

    it('parses "haftaya" as next Monday (Feb 23)', () => {
      const result = parseNaturalDate('haftaya');
      expect(result).toEqual(new Date('2026-02-23T00:00:00'));
    });

    it('parses "gelecek hafta" as next Monday (Feb 23)', () => {
      const result = parseNaturalDate('gelecek hafta');
      expect(result).toEqual(new Date('2026-02-23T00:00:00'));
    });

    it('parses "gelecek ay" as 1st of next month (Mar 1)', () => {
      const result = parseNaturalDate('gelecek ay');
      expect(result).toEqual(new Date('2026-03-01T00:00:00'));
    });

    it('parses "ayın sonu" as last day of current month (Feb 28)', () => {
      const result = parseNaturalDate('ayın sonu');
      expect(result).toEqual(new Date('2026-02-28T00:00:00'));
    });

    // --- English keywords ---

    it('parses "today"', () => {
      const result = parseNaturalDate('today');
      expect(result).toEqual(new Date('2026-02-19T00:00:00'));
    });

    it('parses "tomorrow"', () => {
      const result = parseNaturalDate('tomorrow');
      expect(result).toEqual(new Date('2026-02-20T00:00:00'));
    });

    it('parses "yesterday"', () => {
      const result = parseNaturalDate('yesterday');
      expect(result).toEqual(new Date('2026-02-18T00:00:00'));
    });

    it('parses "in 5 days"', () => {
      const result = parseNaturalDate('in 5 days');
      expect(result).toEqual(new Date('2026-02-24T00:00:00'));
    });

    it('parses "in 2 weeks"', () => {
      const result = parseNaturalDate('in 2 weeks');
      expect(result).toEqual(new Date('2026-03-05T00:00:00'));
    });

    it('parses "in 3 months"', () => {
      const result = parseNaturalDate('in 3 months');
      expect(result).toEqual(new Date('2026-05-19T00:00:00'));
    });

    it('parses "next friday" as next Friday (Feb 20)', () => {
      const result = parseNaturalDate('next friday');
      expect(result).toEqual(new Date('2026-02-20T00:00:00'));
    });

    it('parses "next week" as next Monday (Feb 23)', () => {
      const result = parseNaturalDate('next week');
      expect(result).toEqual(new Date('2026-02-23T00:00:00'));
    });

    it('parses "next month" as 1st of next month (Mar 1)', () => {
      const result = parseNaturalDate('next month');
      expect(result).toEqual(new Date('2026-03-01T00:00:00'));
    });

    it('parses "this monday" as next Monday (Feb 23)', () => {
      // Feb 19 is Thursday, so this Monday means next Monday
      const result = parseNaturalDate('this monday');
      expect(result).toEqual(new Date('2026-02-23T00:00:00'));
    });

    it('parses "end of month" as last day of February (Feb 28)', () => {
      const result = parseNaturalDate('end of month');
      expect(result).toEqual(new Date('2026-02-28T00:00:00'));
    });

    // --- Case insensitivity ---

    it('is case-insensitive for English', () => {
      const result = parseNaturalDate('TOMORROW');
      expect(result).toEqual(new Date('2026-02-20T00:00:00'));
    });

    it('is case-insensitive for Turkish', () => {
      const result = parseNaturalDate('YARIN');
      expect(result).toEqual(new Date('2026-02-20T00:00:00'));
    });

    // --- Whitespace handling ---

    it('handles leading and trailing whitespace', () => {
      const result = parseNaturalDate('  tomorrow  ');
      expect(result).toEqual(new Date('2026-02-20T00:00:00'));
    });

    // --- Null returns ---

    it('returns null for empty string', () => {
      expect(parseNaturalDate('')).toBeNull();
    });

    it('returns null for unrecognized text', () => {
      expect(parseNaturalDate('random gibberish')).toBeNull();
    });

    it('returns null for null/undefined input', () => {
      expect(parseNaturalDate(null as any)).toBeNull();
      expect(parseNaturalDate(undefined as any)).toBeNull();
    });
  });

  describe('extractDateMention', () => {
    it('extracts "yarın" from a Turkish sentence', () => {
      const result = extractDateMention('toplantı yarın olacak');
      expect(result).not.toBeNull();
      expect(result!.date).toEqual(new Date('2026-02-20T00:00:00'));
      expect(result!.matchedText).toBe('yarın');
    });

    it('extracts "tomorrow" from an English sentence', () => {
      const result = extractDateMention('the meeting is tomorrow afternoon');
      expect(result).not.toBeNull();
      expect(result!.date).toEqual(new Date('2026-02-20T00:00:00'));
      expect(result!.matchedText).toBe('tomorrow');
    });

    it('extracts "3 gün sonra" from a sentence', () => {
      const result = extractDateMention('bunu 3 gün sonra yapalım');
      expect(result).not.toBeNull();
      expect(result!.date).toEqual(new Date('2026-02-22T00:00:00'));
      expect(result!.matchedText).toBe('3 gün sonra');
    });

    it('extracts "in 5 days" from a sentence', () => {
      const result = extractDateMention('let us meet in 5 days please');
      expect(result).not.toBeNull();
      expect(result!.date).toEqual(new Date('2026-02-24T00:00:00'));
      expect(result!.matchedText).toBe('in 5 days');
    });

    it('extracts "next friday" from a sentence', () => {
      const result = extractDateMention('deadline is next friday for the report');
      expect(result).not.toBeNull();
      expect(result!.date).toEqual(new Date('2026-02-20T00:00:00'));
      expect(result!.matchedText).toBe('next friday');
    });

    it('extracts the earliest date mention when multiple exist', () => {
      const result = extractDateMention('bugün veya yarın');
      expect(result).not.toBeNull();
      expect(result!.matchedText).toBe('bugün');
      expect(result!.date).toEqual(new Date('2026-02-19T00:00:00'));
    });

    it('returns null for text without date mentions', () => {
      expect(extractDateMention('random text here')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(extractDateMention('')).toBeNull();
    });
  });
});
