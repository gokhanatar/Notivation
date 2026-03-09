import { db, type Note } from '@/lib/db';

export async function getLetGoCandidates(): Promise<Note[]> {
  const notes = await db.notes.filter(n => !n.archived).toArray();
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;

  return notes.filter(n => {
    const age = now - new Date(n.updatedAt).getTime();
    // Old notes that haven't been touched in 30+ days
    if (age > thirtyDays) return true;
    // Notes with completed lifecycle
    if (n.lifecycleStage === 'outcome') return true;
    return false;
  }).sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
}

export function generateGratitudePrompt(note: Note): string {
  const prompts: Record<string, string[]> = {
    decision: [
      'What did this decision teach you about yourself?',
      'How did making this choice help you grow?',
      'What would you tell someone facing the same decision?',
    ],
    action: [
      'What skills did you develop working on this?',
      'How did this action move you forward?',
      'What unexpected lessons came from this task?',
    ],
    idea: [
      'How did this idea expand your thinking?',
      'What new possibilities did this idea open up?',
      'What part of this idea might seed something new?',
    ],
    default: [
      'What value did this note bring to your life?',
      'How has your perspective changed since writing this?',
      'What would you want to remember from this experience?',
    ],
  };

  const typePrompts = prompts[note.type] || prompts.default;
  return typePrompts[Math.floor(Math.random() * typePrompts.length)];
}

export function generateLearningExtraction(note: Note): string {
  const extractions = [
    'If you could distill one lesson from this, what would it be?',
    'What pattern did you notice that you want to carry forward?',
    'What\'s the most important insight from this note?',
    'How would you summarize what you learned in one sentence?',
  ];
  return extractions[Math.floor(Math.random() * extractions.length)];
}

export async function trackLetGo(noteId: string, noteTitle: string, reflection?: string): Promise<void> {
  await db.actionEvents.add({
    id: crypto.randomUUID(),
    type: 'note_let_go',
    noteId,
    noteTitle,
    timestamp: new Date(),
    metadata: { reflection },
  });
}
