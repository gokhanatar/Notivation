import { db, type Note, type ActionItem } from '@/lib/db';

export interface ClarityScore {
  score: number; // 0-100
  level: 'clear' | 'good' | 'cloudy' | 'foggy';
  color: string;
  breakdown: {
    openDecisions: number;
    overdueActions: number;
    agingNotes: number;
    untaggedNotes: number;
  };
  cleanupCandidates: Note[];
}

/**
 * Calculate the Thought Entropy / Clarity Score
 * Score = 100 - (open decisions * 5) - (overdue actions * 8) - (30+ day old notes * 3) - (untagged * 2)
 */
export async function calculateClarityScore(): Promise<ClarityScore> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [notes, actions, noteTags] = await Promise.all([
    db.notes.filter(n => !n.archived).toArray(),
    db.actionItems.toArray(),
    db.noteTags.toArray(),
  ]);

  // Open decisions: decision notes not in 'outcome' lifecycle stage
  const openDecisions = notes.filter(
    n => n.type === 'decision' && n.lifecycleStage !== 'outcome'
  ).length;

  // Overdue actions
  const overdueActions = actions.filter(
    a => !a.isDone && a.dueDate && new Date(a.dueDate) < startOfToday
  ).length;

  // Aging notes (30+ days untouched)
  const agingNotes = notes.filter(
    n => new Date(n.updatedAt) < thirtyDaysAgo
  ).length;

  // Untagged notes
  const taggedNoteIds = new Set(noteTags.map(nt => nt.noteId));
  const untaggedNotes = notes.filter(n => !taggedNoteIds.has(n.id)).length;

  // Calculate score
  let score = 100;
  score -= openDecisions * 5;
  score -= overdueActions * 8;
  score -= agingNotes * 3;
  score -= untaggedNotes * 2;
  score = Math.max(0, Math.min(100, score));

  // Determine level
  let level: ClarityScore['level'];
  let color: string;
  if (score >= 75) {
    level = 'clear';
    color = '#22c55e'; // green
  } else if (score >= 50) {
    level = 'good';
    color = '#eab308'; // yellow
  } else if (score >= 25) {
    level = 'cloudy';
    color = '#f97316'; // orange
  } else {
    level = 'foggy';
    color = '#ef4444'; // red
  }

  // Cleanup candidates: oldest untouched notes
  const cleanupCandidates = notes
    .filter(n => new Date(n.updatedAt) < thirtyDaysAgo)
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
    .slice(0, 5);

  return {
    score,
    level,
    color,
    breakdown: {
      openDecisions,
      overdueActions,
      agingNotes,
      untaggedNotes,
    },
    cleanupCandidates,
  };
}
