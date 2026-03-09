import { db, type Note } from '@/lib/db';

export interface RecallItem {
  note: Note;
  memoryStrength: number;
  daysSinceCreated: number;
  daysSinceRecalled: number;
}

/**
 * Ebbinghaus forgetting curve: R = e^(-t / (S * 7))
 * R = retention (0-1), t = days since last recall, S = memory strength multiplier
 */
function calculateRetention(daysSinceRecall: number, strength: number): number {
  const S = Math.max(strength, 0.1);
  return Math.exp(-daysSinceRecall / (S * 7));
}

/**
 * Get notes that need memory recall (R < 0.5)
 * Returns up to `limit` notes sorted by lowest retention first
 */
export async function getRecallItems(limit = 5): Promise<RecallItem[]> {
  const now = new Date();
  const notes = await db.notes
    .filter(n => !n.archived && !n.vault && (n.type === 'decision' || n.type === 'action' || n.type === 'idea'))
    .toArray();

  const items: RecallItem[] = [];

  for (const note of notes) {
    const strength = note.memoryStrength ?? 1.0;
    const lastRecalled = note.lastRecalledAt ? new Date(note.lastRecalledAt) : new Date(note.createdAt);
    const daysSinceRecalled = (now.getTime() - lastRecalled.getTime()) / (1000 * 60 * 60 * 24);
    const daysSinceCreated = (now.getTime() - new Date(note.createdAt).getTime()) / (1000 * 60 * 60 * 24);

    // Only include notes older than 3 days
    if (daysSinceCreated < 3) continue;

    const retention = calculateRetention(daysSinceRecalled, strength);

    if (retention < 0.5) {
      items.push({
        note,
        memoryStrength: retention,
        daysSinceCreated: Math.floor(daysSinceCreated),
        daysSinceRecalled: Math.floor(daysSinceRecalled),
      });
    }
  }

  // Sort by lowest retention first (most forgotten)
  items.sort((a, b) => a.memoryStrength - b.memoryStrength);

  return items.slice(0, limit);
}

/**
 * Handle user response to a recall prompt
 */
export async function handleRecallResponse(
  noteId: string,
  response: 'yes' | 'no' | 'later'
): Promise<void> {
  const now = new Date();

  switch (response) {
    case 'yes':
      // User confirms — strengthen memory
      await db.notes.update(noteId, {
        lastRecalledAt: now,
        memoryStrength: Math.min((await db.notes.get(noteId))?.memoryStrength ?? 1.0 + 0.2, 2.0),
      });
      break;
    case 'no':
      // No longer relevant — archive it
      await db.notes.update(noteId, {
        archived: true,
        lastRecalledAt: now,
      });
      break;
    case 'later':
      // Snooze — just update recall time with slight reduction
      await db.notes.update(noteId, {
        lastRecalledAt: now,
      });
      break;
  }
}
