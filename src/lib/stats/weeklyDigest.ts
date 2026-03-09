import { db } from '@/lib/db';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';

export interface WeeklyDigestData {
  // Summary stats
  totalNotesCreated: number;
  totalActionsCreated: number;
  totalActionsCompleted: number;
  completionRate: number;

  // By type breakdown
  notesByType: { type: string; count: number; color: string }[];

  // Daily activity (7 days)
  dailyActivity: { date: string; dayLabel: string; notes: number; actions: number }[];

  // Top notes (most updated)
  topNotes: { id: string; title: string; type: string; updateCount: number }[];

  // Streak info
  activeDays: number;
  totalDays: number;
}

const TYPE_COLORS: Record<string, string> = {
  decision: '#f97316',
  action: '#3b82f6',
  info: '#22c55e',
  idea: '#a855f7',
  followup: '#06b6d4',
};

export async function getWeeklyDigestData(): Promise<WeeklyDigestData> {
  const now = new Date();
  const weekAgo = startOfDay(subDays(now, 6));
  const todayEnd = endOfDay(now);

  // Get all notes and actions
  const allNotes = await db.notes.toArray();
  const allActions = await db.actionItems.toArray();
  const allEvents = await db.actionEvents
    .where('timestamp')
    .between(weekAgo, todayEnd)
    .toArray();

  // Notes created this week
  const notesThisWeek = allNotes.filter(
    (n) => new Date(n.createdAt) >= weekAgo && new Date(n.createdAt) <= todayEnd
  );

  // Actions created this week
  const actionsThisWeek = allActions.filter(
    (a) => new Date(a.createdAt) >= weekAgo && new Date(a.createdAt) <= todayEnd
  );

  // Actions completed this week (from events)
  const completedEvents = allEvents.filter((e) => e.type === 'action_completed');

  // Completion rate
  const totalActionsCreated = actionsThisWeek.length;
  const totalActionsCompleted = completedEvents.length;
  const completionRate = totalActionsCreated > 0
    ? Math.round((totalActionsCompleted / totalActionsCreated) * 100)
    : 0;

  // Notes by type
  const typeCounts: Record<string, number> = {};
  notesThisWeek.forEach((n) => {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  });
  const notesByType = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    color: TYPE_COLORS[type] || '#94a3b8',
  }));

  // Daily activity
  const days = eachDayOfInterval({ start: weekAgo, end: now });
  const dailyActivity = days.map((day) => {
    const dayStart = startOfDay(day);
    const dayEnd = endOfDay(day);

    const notesCount = allNotes.filter(
      (n) => new Date(n.createdAt) >= dayStart && new Date(n.createdAt) <= dayEnd
    ).length;

    const actionsCount = allActions.filter(
      (a) => new Date(a.createdAt) >= dayStart && new Date(a.createdAt) <= dayEnd
    ).length;

    return {
      date: format(day, 'yyyy-MM-dd'),
      dayLabel: format(day, 'EEE'),
      notes: notesCount,
      actions: actionsCount,
    };
  });

  // Active days
  const activeDays = dailyActivity.filter((d) => d.notes > 0 || d.actions > 0).length;

  // Top notes (most events)
  const noteEventCounts: Record<string, number> = {};
  allEvents.forEach((e) => {
    if (e.noteId) {
      noteEventCounts[e.noteId] = (noteEventCounts[e.noteId] || 0) + 1;
    }
  });

  const topNotes = Object.entries(noteEventCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([noteId, updateCount]) => {
      const note = allNotes.find((n) => n.id === noteId);
      return {
        id: noteId,
        title: note?.title || note?.body?.slice(0, 50) || 'Untitled',
        type: note?.type || 'info',
        updateCount,
      };
    });

  return {
    totalNotesCreated: notesThisWeek.length,
    totalActionsCreated,
    totalActionsCompleted,
    completionRate,
    notesByType,
    dailyActivity,
    topNotes,
    activeDays,
    totalDays: 7,
  };
}
