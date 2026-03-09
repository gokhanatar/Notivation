import { db, type ActionEvent, type ActionEventType } from '@/lib/db';

export type { ActionEvent, ActionEventType };

// Create a new action event
export async function createActionEvent(
  type: ActionEventType,
  noteId?: string,
  noteTitle?: string,
  metadata?: Record<string, unknown>
): Promise<ActionEvent> {
  const event: ActionEvent = {
    id: crypto.randomUUID(),
    type,
    noteId,
    noteTitle,
    timestamp: new Date(),
    metadata,
  };

  await db.actionEvents.add(event);
  return event;
}

// Get all action events sorted by timestamp (newest first)
export async function getActionEvents(limit: number = 50): Promise<ActionEvent[]> {
  return db.actionEvents
    .orderBy('timestamp')
    .reverse()
    .limit(limit)
    .toArray();
}

// Get action events for a specific note
export async function getActionEventsForNote(noteId: string): Promise<ActionEvent[]> {
  return db.actionEvents
    .where('noteId')
    .equals(noteId)
    .reverse()
    .sortBy('timestamp');
}

// Clear old action events (keep last N days)
export async function pruneActionEvents(daysToKeep: number = 30): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  await db.actionEvents
    .where('timestamp')
    .below(cutoffDate)
    .delete();
}

// Action event cache for reactive updates
let actionEventsCache: ActionEvent[] = [];
const actionEventListeners: Set<() => void> = new Set();

function notifyActionEventListeners() {
  actionEventListeners.forEach(listener => listener());
}

export function subscribeToActionEvents(listener: () => void) {
  actionEventListeners.add(listener);
  return () => {
    actionEventListeners.delete(listener);
  };
}

export function getActionEventsSnapshot() {
  return actionEventsCache;
}

export async function loadActionEvents() {
  actionEventsCache = await getActionEvents(100);
  notifyActionEventListeners();
}

export async function addActionEventToCache(event: ActionEvent) {
  actionEventsCache = [event, ...actionEventsCache].slice(0, 100);
  notifyActionEventListeners();
}

// Helper to track note creation
export async function trackNoteCreated(noteId: string, noteTitle: string) {
  const event = await createActionEvent('note_created', noteId, noteTitle);
  await addActionEventToCache(event);
}

// Helper to track note update
export async function trackNoteUpdated(noteId: string, noteTitle: string) {
  const event = await createActionEvent('note_updated', noteId, noteTitle);
  await addActionEventToCache(event);
}

// Helper to track note archived
export async function trackNoteArchived(noteId: string, noteTitle: string) {
  const event = await createActionEvent('note_archived', noteId, noteTitle);
  await addActionEventToCache(event);
}

// Helper to track note pinned
export async function trackNotePinned(noteId: string, noteTitle: string, isPinned: boolean) {
  const event = await createActionEvent(
    isPinned ? 'note_pinned' : 'note_unpinned',
    noteId,
    noteTitle
  );
  await addActionEventToCache(event);
}

// Helper to track action completion
export async function trackActionCompleted(noteId: string, actionText: string, isCompleted: boolean) {
  const event = await createActionEvent(
    isCompleted ? 'action_completed' : 'action_reopened',
    noteId,
    undefined,
    { actionText }
  );
  await addActionEventToCache(event);
}
