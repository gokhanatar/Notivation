import { db, type Note } from '@/lib/db';

/**
 * Check whether a note is currently incubating (incubatingUntil is in the future).
 */
export function isIncubating(note: Note): boolean {
  if (!note.incubatingUntil) return false;
  return new Date(note.incubatingUntil).getTime() > Date.now();
}

/**
 * Start incubation for a note. Sets incubatingUntil = now + days and
 * incubationStartedAt = now, then logs an action event.
 */
export async function startIncubation(noteId: string, days: number): Promise<void> {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  await db.notes.update(noteId, {
    incubatingUntil: until,
    incubationStartedAt: now,
    updatedAt: now,
  });

  await db.actionEvents.add({
    id: crypto.randomUUID(),
    type: 'note_incubated',
    noteId,
    timestamp: now,
    metadata: { days },
  });
}

/**
 * Wake up a note early by clearing incubation fields,
 * then log an awakened action event.
 */
export async function wakeUpNote(noteId: string): Promise<void> {
  const now = new Date();

  await db.notes.update(noteId, {
    incubatingUntil: undefined,
    incubationStartedAt: undefined,
    updatedAt: now,
  });

  await db.actionEvents.add({
    id: crypto.randomUUID(),
    type: 'note_awakened',
    noteId,
    timestamp: now,
  });
}

/**
 * Return notes whose incubatingUntil has passed (they have "woken up"
 * naturally but still carry the incubation fields).
 */
export async function getAwakeningNotes(): Promise<Note[]> {
  const now = Date.now();
  const notes = await db.notes
    .filter(n => {
      if (!n.incubatingUntil || !n.incubationStartedAt) return false;
      if (n.archived) return false;
      return new Date(n.incubatingUntil).getTime() <= now;
    })
    .toArray();

  return notes;
}

/**
 * Return the remaining time for an incubating note as { days, hours }.
 * If the note is not incubating, returns { days: 0, hours: 0 }.
 */
export function getRemainingTime(note: Note): { days: number; hours: number } {
  if (!note.incubatingUntil) return { days: 0, hours: 0 };

  const remaining = new Date(note.incubatingUntil).getTime() - Date.now();
  if (remaining <= 0) return { days: 0, hours: 0 };

  const totalHours = remaining / (1000 * 60 * 60);
  const days = Math.floor(totalHours / 24);
  const hours = Math.floor(totalHours % 24);

  return { days, hours };
}

// ==========================================
// Fresh Perspective Prompts
// ==========================================

const perspectivePrompts: Record<string, string[]> = {
  decision: [
    'What new information has surfaced since you set this aside?',
    'If you had to decide right now, what would you choose?',
    'Has the urgency of this decision changed?',
    'What would your future self think about this decision?',
    'Have the trade-offs shifted since you last considered this?',
  ],
  action: [
    'Is this action still the right next step?',
    'What has changed since you paused this?',
    'Can you break this into a smaller first step?',
    'Is there someone who could help with this?',
    'What would happen if you dropped this entirely?',
  ],
  idea: [
    'Does this idea still excite you with fresh eyes?',
    'What connections do you see now that you did not see before?',
    'How could you test this idea in the smallest way possible?',
    'Has something happened that makes this idea more relevant?',
    'What is the simplest version of this idea you could try?',
  ],
  info: [
    'Is this information still accurate and relevant?',
    'How does this connect to what you have learned since?',
    'What action could this information inspire today?',
    'Has your understanding of this topic deepened?',
    'Who else might benefit from knowing this?',
  ],
  followup: [
    'Is this follow-up still needed?',
    'Has the situation resolved itself while you waited?',
    'What is the best way to follow up now?',
    'Has the relationship or context changed?',
    'What outcome are you hoping for from this follow-up?',
  ],
  question: [
    'Have you found the answer elsewhere since then?',
    'Is this question still the right one to ask?',
    'How would you rephrase this question now?',
    'Who might have a good perspective on this?',
    'What assumptions are embedded in this question?',
  ],
  journal: [
    'How do you feel about this topic now compared to before?',
    'What patterns do you notice looking back?',
    'Has your perspective shifted during the break?',
    'What would you add to this entry today?',
    'What surprised you re-reading this?',
  ],
};

const genericPrompts = [
  'Look at this with completely fresh eyes. What stands out?',
  'What has changed since you last visited this note?',
  'Does this still matter to you? Why or why not?',
  'What would you do differently if you started from scratch?',
  'What is the one thing here that deserves your attention?',
];

/**
 * Generate a random "fresh perspective" prompt based on the note's type.
 */
export function generateFreshPerspectivePrompt(note: Note): string {
  const typePrompts = perspectivePrompts[note.type] || genericPrompts;
  const allPrompts = [...typePrompts, ...genericPrompts];
  const index = Math.floor(Math.random() * allPrompts.length);
  return allPrompts[index];
}
