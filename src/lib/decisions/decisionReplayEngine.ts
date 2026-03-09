import { db, type Note, type ActionEvent } from '@/lib/db';
import { lifecycleStages } from '@/lib/lifecycle/lifecycleEngine';

export interface ReplayStep {
  stage: string;
  stageLabelKey: string;
  timestamp: Date;
  daysFromPrevious: number;
  mood?: string;
  eventType?: string;
}

export interface DecisionReplay {
  note: Note;
  steps: ReplayStep[];
  totalDays: number;
}

/**
 * Build a timeline replay for a note's lifecycle journey
 */
export async function buildDecisionReplay(noteId: string): Promise<DecisionReplay | null> {
  const note = await db.notes.get(noteId);
  if (!note) return null;

  // Get all lifecycle events for this note
  const events = await db.actionEvents
    .where('noteId')
    .equals(noteId)
    .toArray();

  // Filter lifecycle events and sort by timestamp
  const lifecycleEvents = events
    .filter(e => e.type === 'note_lifecycle_promoted' || e.type === 'note_lifecycle_demoted' || e.type === 'note_created')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const steps: ReplayStep[] = [];

  // Always start with creation
  steps.push({
    stage: 'created',
    stageLabelKey: 'replay.created',
    timestamp: new Date(note.createdAt),
    daysFromPrevious: 0,
    mood: note.mood || undefined,
    eventType: 'note_created',
  });

  // Add lifecycle promotion events
  let prevTimestamp = new Date(note.createdAt);
  for (const event of lifecycleEvents) {
    if (event.type === 'note_created') continue;

    const ts = new Date(event.timestamp);
    const daysDiff = Math.floor((ts.getTime() - prevTimestamp.getTime()) / (1000 * 60 * 60 * 24));

    const meta = event.metadata || {};
    const toStage = (meta.toStage as string) || '';
    const stageConfig = lifecycleStages.find(s => s.id === toStage);

    steps.push({
      stage: toStage,
      stageLabelKey: stageConfig?.labelKey || `lifecycle.${toStage}`,
      timestamp: ts,
      daysFromPrevious: daysDiff,
      mood: (meta.mood as string) || undefined,
      eventType: event.type,
    });

    prevTimestamp = ts;
  }

  // Add current stage if not in steps
  const currentStage = note.lifecycleStage || 'spark';
  if (!steps.find(s => s.stage === currentStage)) {
    const stageConfig = lifecycleStages.find(s => s.id === currentStage);
    steps.push({
      stage: currentStage,
      stageLabelKey: stageConfig?.labelKey || `lifecycle.${currentStage}`,
      timestamp: note.lifecyclePromotedAt ? new Date(note.lifecyclePromotedAt) : new Date(note.updatedAt),
      daysFromPrevious: 0,
      mood: note.mood || undefined,
    });
  }

  const totalDays = Math.floor(
    (new Date().getTime() - new Date(note.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  return { note, steps, totalDays };
}
