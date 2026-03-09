import { db } from '@/lib/db';

export async function calculateStreak(): Promise<{ current: number; best: number }> {
  const notes = await db.notes.toArray();
  if (notes.length === 0) return { current: 0, best: 0 };

  // Get unique creation dates (YYYY-MM-DD)
  const dates = new Set<string>();
  notes.forEach(n => {
    const d = new Date(n.createdAt);
    dates.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  });

  const sortedDates = Array.from(dates).sort().reverse();
  if (sortedDates.length === 0) return { current: 0, best: 0 };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Current streak
  let current = 0;
  if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
    const checkDate = new Date(sortedDates[0]);
    for (const dateStr of sortedDates) {
      const expected = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      if (dateStr === expected) {
        current++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  // Best streak
  const allSorted = Array.from(dates).sort();
  let best = 0;
  let streak = 1;
  for (let i = 1; i < allSorted.length; i++) {
    const prev = new Date(allSorted[i - 1]);
    const curr = new Date(allSorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) {
      streak++;
    } else {
      best = Math.max(best, streak);
      streak = 1;
    }
  }
  best = Math.max(best, streak);

  return { current, best };
}
