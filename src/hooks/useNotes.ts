import { useEffect, useCallback, useRef, useState } from 'react';
import { 
  db, 
  createNote as dbCreateNote,
  updateNote as dbUpdateNote,
  deleteNote as dbDeleteNote,
  createActionItem as dbCreateActionItem,
  updateActionItem as dbUpdateActionItem,
  deleteActionItem as dbDeleteActionItem,
  createTag as dbCreateTag,
  deleteTag as dbDeleteTag,
  addTagToNote as dbAddTagToNote,
  removeTagFromNote as dbRemoveTagFromNote,
  getTagsForNote,
  initializeSettings,
  updateSettings,
  type Note,
  type NoteType,
  type ActionItem,
  type Tag,
} from '@/lib/db';
import { useUIStore } from '@/store/useStore';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { updateStatusBarForTheme } from '@/lib/native/statusBar';
import {
  scheduleNoteDueNotification,
  cancelNoteNotification,
  scheduleActionItemNotification,
  cancelActionItemNotification,
} from '@/lib/native/notifications';
import { hapticLight, hapticSuccess } from '@/lib/native/haptics';
import {
  trackNoteCreated,
  trackNoteUpdated,
  trackNoteArchived,
  trackNotePinned,
  trackActionCompleted,
  loadActionEvents,
} from '@/lib/actions/actionEvents';
import { getDefaultLifecycleStage, getNextStage, getPreviousStage } from '@/lib/lifecycle/lifecycleEngine';
import { type LifecycleStage } from '@/lib/db';
import { loadDecisionItems } from '@/hooks/useDecisions';
import { isIncubating, startIncubation, wakeUpNote as wakeUpNoteEngine } from '@/lib/incubation/incubationEngine';
import { trackLetGo } from '@/lib/letgo/letGoEngine';

// ==========================================
// SIMPLE DATA STORE (no Zustand sync issues)
// ==========================================

let notesCache: Note[] = [];
let actionItemsCache: ActionItem[] = [];
let tagsCache: Tag[] = [];
const listeners: Set<() => void> = new Set();

function notifyListeners() {
  listeners.forEach(listener => listener());
}

export function subscribeToData(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getNotesSnapshot() {
  return notesCache;
}

export function getActionItemsSnapshot() {
  return actionItemsCache;
}

export function getTagsSnapshot() {
  return tagsCache;
}

async function loadAllData() {
  const [notes, actions, tags] = await Promise.all([
    db.notes.filter(note => !note.archived).toArray(),
    db.actionItems.toArray(),
    db.tags.toArray(),
  ]);

  // Filter out incubating notes from main view
  const now = Date.now();
  notesCache = notes
    .filter(n => !n.incubatingUntil || new Date(n.incubatingUntil).getTime() <= now)
    .sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  actionItemsCache = actions;
  tagsCache = tags;
  notifyListeners();
}

// ==========================================
// INITIALIZATION HOOK
// ==========================================

export function useInitializeApp() {
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    async function init() {
      try {
        const settings = await initializeSettings();
        useUIStore.getState().setTheme(settings.theme);
        // Sync Pro status from localStorage (purchases/promo)
        const { isProOwned } = await import('@/lib/native/purchases');
        if (isProOwned()) {
          useUIStore.getState().setIsPro(true);
        }
        await Promise.all([loadAllData(), loadActionEvents(), loadDecisionItems()]);
      } catch (error) {
        console.error('Init error:', error);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, []);

  return isLoading;
}

// ==========================================
// DATA HOOKS
// ==========================================

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>(notesCache);
  
  useEffect(() => {
    // Set initial state
    setNotes(notesCache);
    
    // Subscribe to updates
    const unsubscribe = subscribeToData(() => {
      setNotes([...notesCache]);
    });
    
    return unsubscribe;
  }, []);
  
  return notes;
}

export function useActionItems() {
  const [items, setItems] = useState<ActionItem[]>(actionItemsCache);
  
  useEffect(() => {
    setItems(actionItemsCache);
    
    const unsubscribe = subscribeToData(() => {
      setItems([...actionItemsCache]);
    });
    
    return unsubscribe;
  }, []);
  
  return items;
}

export function useTags() {
  const [tags, setTags] = useState<Tag[]>(tagsCache);
  
  useEffect(() => {
    setTags(tagsCache);
    
    const unsubscribe = subscribeToData(() => {
      setTags([...tagsCache]);
    });
    
    return unsubscribe;
  }, []);
  
  return tags;
}

// ==========================================
// THEME HOOK
// ==========================================

export function useThemeManager() {
  const theme = useUIStore((s) => s.theme);
  const prevTheme = useRef<string | null>(null);

  useEffect(() => {
    if (prevTheme.current === theme) return;
    prevTheme.current = theme;

    const root = document.documentElement;
    root.classList.remove('dark', 'warm', 'kids', 'senior', 'minimal', 'oled', 'ocean', 'forest', 'sunset');
    if (theme !== 'light') {
      root.classList.add(theme);
    }

    updateStatusBarForTheme(theme);

    if (prevTheme.current !== null) {
      updateSettings({ theme });
    }
  }, [theme]);

  // Apply saved font on load
  useEffect(() => {
    db.settings.get('main').then(s => {
      if (s?.fontFamily) {
        document.documentElement.style.setProperty('--font-family', s.fontFamily);
      }
    });
  }, []);
}

// ==========================================
// NOTE OPERATIONS
// ==========================================

export function useNoteActions() {
  const createNote = useCallback(async (data: {
    type: NoteType;
    title: string;
    body?: string;
    pinned?: boolean;
    dueDate?: Date;
    vault?: boolean;
    lifecycleStage?: import('@/lib/db').LifecycleStage;
  }) => {
    const note = await dbCreateNote({
      type: data.type,
      title: data.title,
      body: data.body || '',
      pinned: data.pinned || false,
      dueDate: data.dueDate,
      archived: false,
      vault: data.vault || false,
      lifecycleStage: data.lifecycleStage || getDefaultLifecycleStage(data.type),
    });
    
    notesCache = [note, ...notesCache];
    notifyListeners();

    // Track event with display title
    await trackNoteCreated(note.id, getDisplayTitle(note.title, note.body));

    // Schedule notification if due date exists
    if (note.dueDate && !note.vault) {
      scheduleNoteDueNotification(note.id, getDisplayTitle(note.title, note.body), note.dueDate, note.vault);
    }

    return note;
  }, []);

  const editNote = useCallback(async (id: string, updates: Partial<Note>) => {
    await dbUpdateNote(id, updates);
    
    const note = notesCache.find(n => n.id === id);
    notesCache = notesCache.map(n => 
      n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n
    );
    notifyListeners();
    
    // Track update event with display title
    if (note) {
      const updatedNote = notesCache.find(n => n.id === id);
      await trackNoteUpdated(id, getDisplayTitle(updatedNote?.title || note.title, updatedNote?.body || note.body));

      // Update notification if dueDate changed
      if ('dueDate' in updates) {
        const merged = updatedNote || note;
        if (updates.dueDate && !merged.vault) {
          scheduleNoteDueNotification(id, getDisplayTitle(merged.title, merged.body), updates.dueDate, merged.vault);
        } else {
          cancelNoteNotification(id);
        }
      }
    }
  }, []);

  const archiveNote = useCallback(async (id: string) => {
    const note = notesCache.find(n => n.id === id);
    if (!note) return;
    hapticLight();

    await dbUpdateNote(id, { archived: true });
    notesCache = notesCache.filter(n => n.id !== id);
    notifyListeners();
    
    // Track archive event with display title
    await trackNoteArchived(id, getDisplayTitle(note.title, note.body));

    // Cancel any scheduled notification
    cancelNoteNotification(id);

    // Set up undo
    useUIStore.getState().setUndoAction(async () => {
      await dbUpdateNote(id, { archived: false });
      notesCache = [{ ...note, archived: false }, ...notesCache];
      notifyListeners();
    });
  }, []);

  const permanentlyDeleteNote = useCallback(async (id: string) => {
    await dbDeleteNote(id);
    notesCache = notesCache.filter(n => n.id !== id);
    notifyListeners();
  }, []);

  const togglePin = useCallback(async (id: string) => {
    const note = notesCache.find(n => n.id === id);
    if (!note) return;
    hapticLight();

    const newPinned = !note.pinned;
    await dbUpdateNote(id, { pinned: newPinned });
    notesCache = notesCache.map(n => 
      n.id === id ? { ...n, pinned: newPinned, updatedAt: new Date() } : n
    ).sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    notifyListeners();
    
    // Track pin event with display title
    await trackNotePinned(id, getDisplayTitle(note.title, note.body), newPinned);
  }, []);

  const toggleVault = useCallback(async (id: string) => {
    const note = notesCache.find(n => n.id === id);
    if (!note) return;
    hapticLight();

    const newVault = !note.vault;
    await dbUpdateNote(id, { vault: newVault });
    notesCache = notesCache.map(n =>
      n.id === id ? { ...n, vault: newVault, updatedAt: new Date() } : n
    );
    notifyListeners();

    // Cancel notification when moving to vault; reschedule when leaving vault
    if (newVault) {
      cancelNoteNotification(id);
    } else if (note.dueDate) {
      scheduleNoteDueNotification(id, getDisplayTitle(note.title, note.body), note.dueDate, false);
    }
  }, []);

  const promoteLifecycle = useCallback(async (id: string) => {
    const note = notesCache.find(n => n.id === id);
    if (!note) return;
    const currentStage = note.lifecycleStage || 'spark';
    const nextStage = getNextStage(currentStage);
    if (!nextStage) return;
    hapticSuccess();
    await dbUpdateNote(id, { lifecycleStage: nextStage, lifecyclePromotedAt: new Date() });
    notesCache = notesCache.map(n =>
      n.id === id ? { ...n, lifecycleStage: nextStage, lifecyclePromotedAt: new Date(), updatedAt: new Date() } : n
    );
    notifyListeners();

    // Track lifecycle promotion for Decision Replay (B2)
    await db.actionEvents.add({
      id: crypto.randomUUID(),
      type: 'note_lifecycle_promoted',
      noteId: id,
      noteTitle: getDisplayTitle(note.title, note.body),
      timestamp: new Date(),
      metadata: { fromStage: currentStage, toStage: nextStage, mood: note.mood || null },
    });
  }, []);

  const demoteLifecycle = useCallback(async (id: string) => {
    const note = notesCache.find(n => n.id === id);
    if (!note) return;
    const currentStage = note.lifecycleStage || 'spark';
    const prevStage = getPreviousStage(currentStage);
    if (!prevStage) return;
    hapticLight();
    await dbUpdateNote(id, { lifecycleStage: prevStage });
    notesCache = notesCache.map(n =>
      n.id === id ? { ...n, lifecycleStage: prevStage, updatedAt: new Date() } : n
    );
    notifyListeners();

    // Track lifecycle demotion for Decision Replay (B2)
    await db.actionEvents.add({
      id: crypto.randomUUID(),
      type: 'note_lifecycle_demoted',
      noteId: id,
      noteTitle: getDisplayTitle(note.title, note.body),
      timestamp: new Date(),
      metadata: { fromStage: currentStage, toStage: prevStage, mood: note.mood || null },
    });
  }, []);

  const incubateNote = useCallback(async (id: string, days: number) => {
    await startIncubation(id, days);
    // Remove from cache (incubating notes are hidden)
    notesCache = notesCache.filter(n => n.id !== id);
    notifyListeners();
  }, []);

  const wakeUpNoteAction = useCallback(async (id: string) => {
    await wakeUpNoteEngine(id);
    await loadAllData();
  }, []);

  const letGoNote = useCallback(async (id: string, reflection?: string) => {
    const note = notesCache.find(n => n.id === id);
    if (!note) return;
    await trackLetGo(id, getDisplayTitle(note.title, note.body), reflection);
    await dbUpdateNote(id, { archived: true });
    notesCache = notesCache.filter(n => n.id !== id);
    notifyListeners();
  }, []);

  return {
    createNote,
    editNote,
    archiveNote,
    permanentlyDeleteNote,
    togglePin,
    toggleVault,
    promoteLifecycle,
    demoteLifecycle,
    incubateNote,
    wakeUpNote: wakeUpNoteAction,
    letGoNote,
  };
}

// ==========================================
// ACTION ITEMS
// ==========================================

export function useActionItemActions() {
  const createActionItem = useCallback(async (data: {
    noteId: string;
    text: string;
    order?: number;
    dueDate?: Date;
  }) => {
    const existingItems = actionItemsCache.filter(a => a.noteId === data.noteId);
    const item = await dbCreateActionItem({
      noteId: data.noteId,
      text: data.text,
      isDone: false,
      order: data.order ?? existingItems.length,
      dueDate: data.dueDate,
    });

    actionItemsCache = [...actionItemsCache, item];
    notifyListeners();

    // Schedule notification for action item due date
    if (item.dueDate) {
      scheduleActionItemNotification(item.id, item.noteId, item.text, item.dueDate);
    }

    return item;
  }, []);

  const editActionItem = useCallback(async (id: string, updates: Partial<ActionItem>) => {
    await dbUpdateActionItem(id, updates);
    const item = actionItemsCache.find(a => a.id === id);
    actionItemsCache = actionItemsCache.map(a =>
      a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
    );
    notifyListeners();

    // Update notification if dueDate changed
    if ('dueDate' in updates && item) {
      if (updates.dueDate && !item.isDone) {
        scheduleActionItemNotification(id, item.noteId, updates.text || item.text, updates.dueDate);
      } else {
        cancelActionItemNotification(id);
      }
    }
  }, []);

  const toggleActionItem = useCallback(async (id: string) => {
    const item = actionItemsCache.find(a => a.id === id);
    if (!item) return;

    const newDone = !item.isDone;
    if (newDone) hapticSuccess();
    await dbUpdateActionItem(id, { isDone: newDone });
    actionItemsCache = actionItemsCache.map(a =>
      a.id === id ? { ...a, isDone: newDone, updatedAt: new Date() } : a
    );
    notifyListeners();

    // Cancel notification when completing; reschedule when uncompleting
    if (newDone) {
      cancelActionItemNotification(id);
    } else if (item.dueDate) {
      scheduleActionItemNotification(id, item.noteId, item.text, item.dueDate);
    }
  }, []);

  const deleteActionItem = useCallback(async (id: string) => {
    await dbDeleteActionItem(id);
    actionItemsCache = actionItemsCache.filter(a => a.id !== id);
    notifyListeners();

    // Cancel any scheduled notification
    cancelActionItemNotification(id);
  }, []);

  return {
    createActionItem,
    editActionItem,
    toggleActionItem,
    deleteActionItem,
  };
}

// ==========================================
// TAGS
// ==========================================

export function useTagActions() {
  const createTag = useCallback(async (name: string, color: string) => {
    const tag = await dbCreateTag(name, color);
    tagsCache = [...tagsCache, tag];
    notifyListeners();
    return tag;
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    await dbDeleteTag(id);
    tagsCache = tagsCache.filter(t => t.id !== id);
    notifyListeners();
  }, []);

  const addTagToNote = useCallback(async (noteId: string, tagId: string) => {
    await dbAddTagToNote(noteId, tagId);
  }, []);

  const removeTagFromNote = useCallback(async (noteId: string, tagId: string) => {
    await dbRemoveTagFromNote(noteId, tagId);
  }, []);

  return {
    createTag,
    deleteTag,
    addTagToNote,
    removeTagFromNote,
    getTagsForNote,
  };
}
