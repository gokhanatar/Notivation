import { db, type Note, type ActionItem } from '@/lib/db';

export type LoopCategory = 'stale' | 'waiting' | 'active' | 'forgotten';

export interface OpenLoop {
  note: Note;
  category: LoopCategory;
  reason: string;
  actionItems: ActionItem[];
  daysSinceUpdate: number;
}

export interface OpenLoopsResult {
  all: OpenLoop[];
  stale: OpenLoop[];
  waiting: OpenLoop[];
  active: OpenLoop[];
  forgotten: OpenLoop[];
  totalCount: number;
}

export async function calculateOpenLoops(): Promise<OpenLoopsResult> {
  const notes = await db.notes.filter(n => !n.archived && !n.vault).toArray();
  const actionItems = await db.actionItems.toArray();
  const noteTags = await db.noteTags.toArray();
  const now = Date.now();

  const loops: OpenLoop[] = [];

  for (const note of notes) {
    // Skip incubating notes
    if (note.incubatingUntil && new Date(note.incubatingUntil).getTime() > now) continue;

    const noteActions = actionItems.filter(a => a.noteId === note.id);
    const hasOpenActions = noteActions.some(a => !a.isDone);
    const daysSinceUpdate = Math.floor((now - new Date(note.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    const hasTags = noteTags.some(nt => nt.noteId === note.id);

    let category: LoopCategory | null = null;
    let reason = '';

    // Stale: 30+ days untouched
    if (daysSinceUpdate >= 30) {
      category = 'stale';
      reason = `${daysSinceUpdate} days since last update`;
    }
    // Waiting: has future due date
    else if (note.dueDate && new Date(note.dueDate).getTime() > now) {
      category = 'waiting';
      reason = 'Has upcoming due date';
    }
    // Active: updated in last 7 days + has open actions
    else if (daysSinceUpdate <= 7 && hasOpenActions) {
      category = 'active';
      reason = 'Recently active with open actions';
    }
    // Forgotten: no tags, short body, older than 14 days
    else if (!hasTags && note.body.length < 100 && daysSinceUpdate > 14) {
      category = 'forgotten';
      reason = 'No tags, short content, untouched';
    }

    if (category) {
      loops.push({ note, category, reason, actionItems: noteActions, daysSinceUpdate });
    }
  }

  return {
    all: loops,
    stale: loops.filter(l => l.category === 'stale'),
    waiting: loops.filter(l => l.category === 'waiting'),
    active: loops.filter(l => l.category === 'active'),
    forgotten: loops.filter(l => l.category === 'forgotten'),
    totalCount: loops.length,
  };
}

export function getLoopCount(result: OpenLoopsResult): number {
  return result.totalCount;
}
