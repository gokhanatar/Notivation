import Dexie, { type Table } from 'dexie';

// ==========================================
// TYPE DEFINITIONS
// ==========================================

export type NoteType = 'decision' | 'action' | 'info' | 'idea' | 'followup' | 'question' | 'journal';

export type LifecycleStage = 'spark' | 'thought' | 'decision' | 'action' | 'outcome';

export type MoodType = 'great' | 'good' | 'neutral' | 'bad' | 'terrible' | null;

export interface Note {
  id: string;
  type: NoteType;
  title: string;
  body: string;
  pinned: boolean;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  archived: boolean;
  vault: boolean;
  color?: string;
  attachments?: string[];
  manualOrder?: number;
  reminderDate?: Date;
  mood?: MoodType;
  lifecycleStage?: LifecycleStage;
  lifecyclePromotedAt?: Date;
  // Memory Fade (A1)
  memoryStrength?: number;
  lastRecalledAt?: Date;
  // Note DNA (A5)
  writingDurationMs?: number;
  editCount?: number;
  writingSpeed?: 'fast' | 'slow' | 'normal';
  // Contextual Recall (B1)
  contextTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  contextDayOfWeek?: number;
  // Emotional Anchor (B4)
  decisionOutcome?: 'positive' | 'negative' | 'neutral';
  // Incubation Mode (v8)
  incubatingUntil?: Date;
  incubationStartedAt?: Date;
  // Confidence Calibration (v8)
  confidenceLevel?: number;
  // Nested Folders (v10)
  folderId?: string;
  // Canvas (v11)
  canvasX?: number;
  canvasY?: number;
}

export interface ActionItem {
  id: string;
  noteId: string;
  text: string;
  isDone: boolean;
  order: number;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface NoteTag {
  id: string;
  noteId: string;
  tagId: string;
}

export interface AppSettings {
  id: string;
  theme: 'light' | 'dark' | 'warm' | 'kids' | 'senior' | 'minimal' | 'oled' | 'ocean' | 'forest' | 'sunset';
  isPro: boolean;
  appLockEnabled: boolean;
  autoLockTimeout: number;
  lastActiveAt: Date;
  fontFamily?: string;
  // Write Speed (B3)
  writeSpeedIndicatorEnabled?: boolean;
  // Progressive Trust (C2)
  trustLevel?: 'seed' | 'sprout' | 'grow' | 'bloom';
  trustOverride?: boolean;
  firstUseDate?: Date;
  // Fresh Start Triggers
  freshStartEnabled?: boolean;
  userBirthday?: string; // MM-DD format
  weeklyIntention?: string;
  weeklyIntentionDate?: Date;
  // Momentum Bar
  momentumEnabled?: boolean;
  lastMomentumAverage?: number;
  // AI Integration (v12)
  aiProvider?: 'gemini' | 'openai' | 'anthropic';
  aiModel?: string;
  aiApiKey?: string;
  aiEnabled?: boolean;
  aiConsentGiven?: boolean;
}

export interface NoteVersion {
  id: string;
  noteId: string;
  title: string;
  body: string;
  timestamp: Date;
}

export interface CustomView {
  id: string;
  name: string;
  filters: {
    type?: NoteType;
    pinned?: boolean;
    vault?: boolean;
    tagId?: string;
    dateRange?: 'today' | 'week' | 'month' | 'all';
  };
  sortBy: string;
  createdAt: Date;
}

export type ActionEventType =
  | 'note_created'
  | 'note_updated'
  | 'note_archived'
  | 'note_deleted'
  | 'note_pinned'
  | 'note_unpinned'
  | 'note_favorited'
  | 'note_unfavorited'
  | 'note_tagged'
  | 'note_untagged'
  | 'action_created'
  | 'action_completed'
  | 'action_reopened'
  | 'note_lifecycle_promoted'
  | 'note_lifecycle_demoted'
  | 'pro_activated'
  | 'pro_renewed'
  | 'note_incubated'
  | 'note_awakened'
  | 'note_let_go'
  | 'scenario_created'
  | 'scenario_resolved';

export interface ActionEvent {
  id: string;
  type: ActionEventType;
  noteId?: string;
  noteTitle?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface DecisionItem {
  id: string;
  noteId: string;
  text: string;
  type: 'pro' | 'con';
  weight: number; // 1-5
  order: number;
  createdAt: Date;
}

export interface NoteTemplate {
  id: string;
  name: string;
  nameKey: string;
  type: NoteType;
  title: string;
  body: string;
  actionItems?: string[];
  isBuiltIn: boolean;
  createdAt: Date;
}

export interface Scenario {
  id: string;
  noteId: string;
  condition: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedOutcomeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScenarioOutcome {
  id: string;
  scenarioId: string;
  description: string;
  probability: number;
  order: number;
  isActual: boolean;
  notes?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  color?: string;
  icon?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasConnection {
  id: string;
  fromNoteId: string;
  toNoteId: string;
  label?: string;
  color?: string;
  createdAt: Date;
}

// ==========================================
// DATABASE CLASS
// ==========================================

class NotesDatabase extends Dexie {
  notes!: Table<Note>;
  actionItems!: Table<ActionItem>;
  tags!: Table<Tag>;
  noteTags!: Table<NoteTag>;
  settings!: Table<AppSettings>;
  actionEvents!: Table<ActionEvent>;
  templates!: Table<NoteTemplate>;
  noteVersions!: Table<NoteVersion>;
  customViews!: Table<CustomView>;
  decisionItems!: Table<DecisionItem>;
  scenarios!: Table<Scenario>;
  scenarioOutcomes!: Table<ScenarioOutcome>;
  folders!: Table<Folder>;
  canvasConnections!: Table<CanvasConnection>;

  constructor() {
    super('DecisionActionNotes');

    this.version(1).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
    });

    this.version(2).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
    });

    this.version(3).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
    });

    this.version(4).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
    });

    this.version(5).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood, lifecycleStage',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
    }).upgrade(tx => {
      return tx.table('notes').toCollection().modify(note => {
        // Assign default lifecycle stage based on note type
        if (!note.lifecycleStage) {
          switch (note.type) {
            case 'idea':
            case 'info':
            case 'question':
            case 'journal':
              note.lifecycleStage = 'spark';
              break;
            case 'followup':
              note.lifecycleStage = 'thought';
              break;
            case 'decision':
              note.lifecycleStage = 'decision';
              break;
            case 'action':
              note.lifecycleStage = 'action';
              break;
            default:
              note.lifecycleStage = 'spark';
          }
        }
      });
    });

    this.version(6).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood, lifecycleStage',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
      decisionItems: 'id, noteId, type, order, createdAt',
    });

    // v7: Memory Fade, Note DNA, Contextual Recall, Emotional Anchor, Write Speed, Progressive Trust
    this.version(7).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood, lifecycleStage, contextTimeOfDay, contextDayOfWeek',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
      decisionItems: 'id, noteId, type, order, createdAt',
    }).upgrade(tx => {
      // Helper to get time of day from a date
      function getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
        const h = date.getHours();
        if (h >= 5 && h < 12) return 'morning';
        if (h >= 12 && h < 17) return 'afternoon';
        if (h >= 17 && h < 21) return 'evening';
        return 'night';
      }

      return Promise.all([
        tx.table('notes').toCollection().modify(note => {
          // Memory Fade defaults
          if (note.memoryStrength === undefined) note.memoryStrength = 1.0;
          if (note.editCount === undefined) note.editCount = 0;
          // Context from createdAt
          const created = new Date(note.createdAt);
          if (note.contextTimeOfDay === undefined) note.contextTimeOfDay = getTimeOfDay(created);
          if (note.contextDayOfWeek === undefined) note.contextDayOfWeek = created.getDay();
        }),
        tx.table('settings').toCollection().modify(settings => {
          if (settings.writeSpeedIndicatorEnabled === undefined) settings.writeSpeedIndicatorEnabled = true;
          if (settings.trustLevel === undefined) settings.trustLevel = 'seed';
          if (settings.trustOverride === undefined) settings.trustOverride = false;
          if (settings.firstUseDate === undefined) settings.firstUseDate = new Date();
        }),
      ]);
    });

    // v8: Incubation Mode, Confidence Calibration, Let Go
    this.version(8).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood, lifecycleStage, contextTimeOfDay, contextDayOfWeek, incubatingUntil',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
      decisionItems: 'id, noteId, type, order, createdAt',
    });

    // v9: Future Cast (scenarios + scenarioOutcomes)
    this.version(9).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood, lifecycleStage, contextTimeOfDay, contextDayOfWeek, incubatingUntil',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
      decisionItems: 'id, noteId, type, order, createdAt',
      scenarios: 'id, noteId, resolved, createdAt',
      scenarioOutcomes: 'id, scenarioId, order',
    });

    // v10: Nested Folders
    this.version(10).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood, lifecycleStage, contextTimeOfDay, contextDayOfWeek, incubatingUntil, folderId',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
      decisionItems: 'id, noteId, type, order, createdAt',
      scenarios: 'id, noteId, resolved, createdAt',
      scenarioOutcomes: 'id, scenarioId, order',
      folders: 'id, name, parentId, order, createdAt',
    });

    // v11: Canvas / Mind Map
    this.version(11).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood, lifecycleStage, contextTimeOfDay, contextDayOfWeek, incubatingUntil, folderId',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
      decisionItems: 'id, noteId, type, order, createdAt',
      scenarios: 'id, noteId, resolved, createdAt',
      scenarioOutcomes: 'id, scenarioId, order',
      folders: 'id, name, parentId, order, createdAt',
      canvasConnections: 'id, fromNoteId, toNoteId, createdAt',
    });

    // v12: AI Integration settings
    this.version(12).stores({
      notes: 'id, type, pinned, dueDate, createdAt, updatedAt, archived, vault, color, manualOrder, reminderDate, mood, lifecycleStage, contextTimeOfDay, contextDayOfWeek, incubatingUntil, folderId',
      actionItems: 'id, noteId, isDone, order, dueDate, createdAt',
      tags: 'id, name',
      noteTags: 'id, noteId, tagId',
      settings: 'id',
      actionEvents: 'id, type, noteId, timestamp',
      templates: 'id, name, type, isBuiltIn',
      noteVersions: 'id, noteId, timestamp',
      customViews: 'id, name, createdAt',
      decisionItems: 'id, noteId, type, order, createdAt',
      scenarios: 'id, noteId, resolved, createdAt',
      scenarioOutcomes: 'id, scenarioId, order',
      folders: 'id, name, parentId, order, createdAt',
      canvasConnections: 'id, fromNoteId, toNoteId, createdAt',
    });
  }
}

export const db = new NotesDatabase();

// Request persistent storage (protects IndexedDB in WKWebView from eviction)
if (navigator.storage?.persist) {
  navigator.storage.persist().catch(() => {});
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

export async function initializeSettings(): Promise<AppSettings> {
  const existing = await db.settings.get('default');
  if (existing) return existing;

  const defaultSettings: AppSettings = {
    id: 'default',
    theme: 'light',
    isPro: false,
    appLockEnabled: false,
    autoLockTimeout: 5,
    lastActiveAt: new Date(),
  };

  await db.settings.add(defaultSettings);
  return defaultSettings;
}

export async function getSettings(): Promise<AppSettings> {
  const settings = await db.settings.get('default');
  if (!settings) return initializeSettings();
  return settings;
}

export async function updateSettings(updates: Partial<AppSettings>): Promise<void> {
  await db.settings.update('default', updates);
}

// ==========================================
// NOTE OPERATIONS
// ==========================================

function getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const h = date.getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export async function createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
  const now = new Date();
  const newNote: Note = {
    ...note,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    // Auto-set context fields
    memoryStrength: 1.0,
    editCount: 0,
    contextTimeOfDay: getTimeOfDay(now),
    contextDayOfWeek: now.getDay(),
  };
  await db.notes.add(newNote);
  return newNote;
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  await db.notes.update(id, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await db.transaction('rw', [db.notes, db.actionItems, db.noteTags, db.decisionItems], async () => {
    await db.notes.delete(id);
    await db.actionItems.where('noteId').equals(id).delete();
    await db.noteTags.where('noteId').equals(id).delete();
    await db.decisionItems.where('noteId').equals(id).delete();
  });
}

export async function getNotes(options?: {
  archived?: boolean;
  vault?: boolean;
  type?: NoteType;
  pinned?: boolean;
}): Promise<Note[]> {
  const collection = db.notes.toCollection();

  const notes = await collection.toArray();

  return notes.filter(note => {
    if (options?.archived !== undefined && note.archived !== options.archived) return false;
    if (options?.vault !== undefined && note.vault !== options.vault) return false;
    if (options?.type !== undefined && note.type !== options.type) return false;
    if (options?.pinned !== undefined && note.pinned !== options.pinned) return false;
    return true;
  }).sort((a, b) => {
    // Pinned first, then by updatedAt
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export async function searchNotes(query: string): Promise<Note[]> {
  const notes = await db.notes.toArray();
  const lowerQuery = query.toLowerCase();

  return notes.filter(note =>
    !note.archived &&
    (note.title.toLowerCase().includes(lowerQuery) ||
     note.body.toLowerCase().includes(lowerQuery))
  );
}

// ==========================================
// ACTION ITEM OPERATIONS
// ==========================================

export async function createActionItem(item: Omit<ActionItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<ActionItem> {
  const now = new Date();
  const newItem: ActionItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  await db.actionItems.add(newItem);

  // Update parent note
  await db.notes.update(item.noteId, { updatedAt: now });

  return newItem;
}

export async function updateActionItem(id: string, updates: Partial<ActionItem>): Promise<void> {
  const item = await db.actionItems.get(id);
  if (!item) return;

  await db.actionItems.update(id, {
    ...updates,
    updatedAt: new Date(),
  });

  // Update parent note
  await db.notes.update(item.noteId, { updatedAt: new Date() });
}

export async function deleteActionItem(id: string): Promise<void> {
  const item = await db.actionItems.get(id);
  if (!item) return;

  await db.actionItems.delete(id);
  await db.notes.update(item.noteId, { updatedAt: new Date() });
}

export async function getActionItemsByNote(noteId: string): Promise<ActionItem[]> {
  return db.actionItems.where('noteId').equals(noteId).sortBy('order');
}

export async function getAllActionItems(): Promise<ActionItem[]> {
  return db.actionItems.toArray();
}

export async function getActionItemsWithDueDate(): Promise<(ActionItem & { note?: Note })[]> {
  const items = await db.actionItems.toArray();
  const notes = await db.notes.toArray();
  const noteMap = new Map(notes.map(n => [n.id, n]));

  return items.map(item => ({
    ...item,
    note: noteMap.get(item.noteId),
  }));
}

// ==========================================
// TAG OPERATIONS
// ==========================================

export async function createTag(name: string, color: string): Promise<Tag> {
  const tag: Tag = {
    id: crypto.randomUUID(),
    name,
    color,
  };
  await db.tags.add(tag);
  return tag;
}

export async function getTags(): Promise<Tag[]> {
  return db.tags.toArray();
}

export async function deleteTag(id: string): Promise<void> {
  await db.transaction('rw', [db.tags, db.noteTags], async () => {
    await db.tags.delete(id);
    await db.noteTags.where('tagId').equals(id).delete();
  });
}

export async function addTagToNote(noteId: string, tagId: string): Promise<void> {
  const existing = await db.noteTags
    .where({ noteId, tagId })
    .first();

  if (!existing) {
    await db.noteTags.add({
      id: crypto.randomUUID(),
      noteId,
      tagId,
    });
  }
}

export async function removeTagFromNote(noteId: string, tagId: string): Promise<void> {
  await db.noteTags
    .where({ noteId, tagId })
    .delete();
}

export async function getTagsForNote(noteId: string): Promise<Tag[]> {
  const noteTags = await db.noteTags.where('noteId').equals(noteId).toArray();
  const tagIds = noteTags.map(nt => nt.tagId);
  return db.tags.where('id').anyOf(tagIds).toArray();
}

// ==========================================
// DECISION ITEM OPERATIONS
// ==========================================

export async function createDecisionItem(item: Omit<DecisionItem, 'id' | 'createdAt'>): Promise<DecisionItem> {
  const newItem: DecisionItem = {
    ...item,
    id: crypto.randomUUID(),
    createdAt: new Date(),
  };
  await db.decisionItems.add(newItem);

  // Update parent note
  await db.notes.update(item.noteId, { updatedAt: new Date() });

  return newItem;
}

export async function updateDecisionItem(id: string, updates: Partial<DecisionItem>): Promise<void> {
  const item = await db.decisionItems.get(id);
  if (!item) return;

  await db.decisionItems.update(id, updates);

  // Update parent note
  await db.notes.update(item.noteId, { updatedAt: new Date() });
}

export async function deleteDecisionItem(id: string): Promise<void> {
  const item = await db.decisionItems.get(id);
  if (!item) return;

  await db.decisionItems.delete(id);
  await db.notes.update(item.noteId, { updatedAt: new Date() });
}

export async function getDecisionItemsByNote(noteId: string): Promise<DecisionItem[]> {
  return db.decisionItems.where('noteId').equals(noteId).sortBy('order');
}

export async function bulkPutDecisionItems(items: DecisionItem[]): Promise<void> {
  await db.decisionItems.bulkPut(items);
}

// ==========================================
// STATISTICS
// ==========================================

export async function getStats() {
  const notes = await db.notes.filter(note => !note.archived).toArray();
  const actions = await db.actionItems.toArray();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfWeek = new Date(startOfToday);
  endOfWeek.setDate(endOfWeek.getDate() + 7);

  return {
    totalNotes: notes.length,
    decisionCount: notes.filter(n => n.type === 'decision').length,
    actionCount: notes.filter(n => n.type === 'action').length,
    pinnedCount: notes.filter(n => n.pinned).length,
    totalActions: actions.length,
    completedActions: actions.filter(a => a.isDone).length,
    overdueActions: actions.filter(a =>
      !a.isDone && a.dueDate && new Date(a.dueDate) < startOfToday
    ).length,
    todayActions: actions.filter(a => {
      if (!a.dueDate) return false;
      const due = new Date(a.dueDate);
      return due >= startOfToday && due < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
    }).length,
  };
}
