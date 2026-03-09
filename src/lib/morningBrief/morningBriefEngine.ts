import { db } from '@/lib/db';
import { calculateStreak } from '@/lib/streaks';

export interface MorningBrief {
  greeting: string; // Time-based: Good morning/afternoon/evening
  overdueActions: number;
  todayActions: number;
  agingNotes: number; // notes not touched in 30+ days
  streak: number;
  totalNotes: number;
  shouldShow: boolean;
}

function getGreetingKey(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'brief.greeting.morning';
  if (hour < 18) return 'brief.greeting.afternoon';
  return 'brief.greeting.evening';
}

function getTodayDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function shouldShowBrief(): boolean {
  const dateStr = getTodayDateStr();
  const dismissedKey = `notivation-brief-dismissed-${dateStr}`;
  return localStorage.getItem(dismissedKey) !== 'true';
}

export function dismissBrief(): void {
  const dateStr = getTodayDateStr();
  const dismissedKey = `notivation-brief-dismissed-${dateStr}`;
  localStorage.setItem(dismissedKey, 'true');
}

export async function generateMorningBrief(): Promise<MorningBrief> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all needed data
  const [allNotes, allActions, streakData] = await Promise.all([
    db.notes.filter(n => !n.archived).toArray(),
    db.actionItems.toArray(),
    calculateStreak(),
  ]);

  // Overdue actions: not done, has a due date before today
  const overdueActions = allActions.filter(a =>
    !a.isDone && a.dueDate && new Date(a.dueDate) < startOfToday
  ).length;

  // Today's actions: due today
  const todayActions = allActions.filter(a => {
    if (!a.dueDate || a.isDone) return false;
    const due = new Date(a.dueDate);
    return due >= startOfToday && due < endOfToday;
  }).length;

  // Aging notes: not touched in 30+ days
  const agingNotes = allNotes.filter(n =>
    new Date(n.updatedAt) < thirtyDaysAgo
  ).length;

  return {
    greeting: getGreetingKey(),
    overdueActions,
    todayActions,
    agingNotes,
    streak: streakData.current,
    totalNotes: allNotes.length,
    shouldShow: shouldShowBrief(),
  };
}
