import type { Note } from '@/lib/db';

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

/**
 * Calculate context boost for search results
 * Gives higher scores to notes created at similar times/days
 */
export function calculateContextBoost(
  note: Note,
  currentTime?: Date
): number {
  const now = currentTime || new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  let boost = 0;

  // Time of day match: +0.15
  const currentTimeOfDay = getTimeOfDay(currentHour);
  if (note.contextTimeOfDay === currentTimeOfDay) {
    boost += 0.15;
  }

  // Day of week match: +0.15
  if (note.contextDayOfWeek === currentDay) {
    boost += 0.15;
  }

  return boost;
}

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/**
 * Parse time-based search terms and return matching time/day values
 */
export function parseTimeContext(query: string): {
  timeOfDay?: TimeOfDay;
  dayOfWeek?: number;
} {
  const lower = query.toLowerCase();
  const result: { timeOfDay?: TimeOfDay; dayOfWeek?: number } = {};

  // Time of day patterns (en + tr)
  const timePatterns: Record<string, TimeOfDay> = {
    'morning': 'morning', 'sabah': 'morning',
    'afternoon': 'afternoon', 'ogle': 'afternoon', 'oğleden sonra': 'afternoon',
    'evening': 'evening', 'aksam': 'evening', 'akşam': 'evening',
    'night': 'night', 'gece': 'night',
  };

  for (const [pattern, tod] of Object.entries(timePatterns)) {
    if (lower.includes(pattern)) {
      result.timeOfDay = tod;
      break;
    }
  }

  // Day of week patterns
  const dayPatterns: Record<string, number> = {
    'sunday': 0, 'pazar': 0,
    'monday': 1, 'pazartesi': 1,
    'tuesday': 2, 'sali': 2, 'salı': 2,
    'wednesday': 3, 'carsamba': 3, 'çarşamba': 3,
    'thursday': 4, 'persembe': 4, 'perşembe': 4,
    'friday': 5, 'cuma': 5,
    'saturday': 6, 'cumartesi': 6,
    'weekend': -1, 'hafta sonu': -1,
  };

  for (const [pattern, day] of Object.entries(dayPatterns)) {
    if (lower.includes(pattern)) {
      result.dayOfWeek = day;
      break;
    }
  }

  return result;
}
