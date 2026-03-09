import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Note, ActionItem, Tag, NoteType, AppSettings } from '@/lib/db';

// ==========================================
// UI STATE STORE
// ==========================================

interface UIState {
  // Navigation
  activeTab: 'stream' | 'actions' | 'decide' | 'tools';
  setActiveTab: (tab: UIState['activeTab']) => void;

  // Drawer/overlay state
  showSettingsDrawer: boolean;
  setShowSettingsDrawer: (show: boolean) => void;
  showSearchOverlay: boolean;
  setShowSearchOverlay: (show: boolean) => void;
  
  // Note editing
  selectedNoteId: string | null;
  setSelectedNoteId: (id: string | null) => void;
  
  // Quick note
  quickNoteType: NoteType;
  setQuickNoteType: (type: NoteType) => void;
  
  // Filters
  activeFilter: {
    type?: NoteType;
    pinned?: boolean;
    vault?: boolean;
    tagId?: string;
  };
  setActiveFilter: (filter: UIState['activeFilter']) => void;
  clearFilters: () => void;
  
  // Sort
  sortBy: 'updatedAt' | 'createdAt' | 'dueDate' | 'title' | 'manual';
  setSortBy: (sort: UIState['sortBy']) => void;
  
  // Actions tab
  actionsView: 'today' | 'week' | 'overdue' | 'followup' | 'activity';
  setActionsView: (view: UIState['actionsView']) => void;
  
  // Search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Toast/Undo
  undoAction: (() => void) | null;
  setUndoAction: (action: (() => void) | null) => void;
  
  // Theme (synced with DB but kept here for quick access)
  theme: AppSettings['theme'];
  setTheme: (theme: AppSettings['theme']) => void;
  
  // Pro features
  isPro: boolean;
  setIsPro: (isPro: boolean) => void;
  
  // Modals
  showProModal: boolean;
  setShowProModal: (show: boolean) => void;
  proModalFeature: string;
  setProModalFeature: (feature: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Navigation
      activeTab: 'stream',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // Drawer/overlay
      showSettingsDrawer: false,
      setShowSettingsDrawer: (show) => set({ showSettingsDrawer: show }),
      showSearchOverlay: false,
      setShowSearchOverlay: (show) => set({ showSearchOverlay: show }),
      
      // Note editing
      selectedNoteId: null,
      setSelectedNoteId: (id) => set({ selectedNoteId: id }),
      
      // Quick note
      quickNoteType: 'decision',
      setQuickNoteType: (type) => set({ quickNoteType: type }),
      
      // Filters
      activeFilter: {},
      setActiveFilter: (filter) => set({ activeFilter: filter }),
      clearFilters: () => set({ activeFilter: {} }),
      
      // Sort
      sortBy: 'updatedAt',
      setSortBy: (sortBy) => set({ sortBy }),
      
      // Actions tab
      actionsView: 'today',
      setActionsView: (view) => set({ actionsView: view }),
      
      // Search
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Undo
      undoAction: null,
      setUndoAction: (action) => set({ undoAction: action }),
      
      // Theme
      theme: 'light',
      setTheme: (theme) => set({ theme }),
      
      // Pro
      isPro: false,
      setIsPro: (isPro) => set({ isPro }),
      
      // Modals
      showProModal: false,
      setShowProModal: (show) => set({ showProModal: show }),
      proModalFeature: '',
      setProModalFeature: (feature) => set({ proModalFeature: feature }),
    }),
    {
      name: 'decision-notes-ui',
      version: 3,
      partialize: (state) => ({
        theme: state.theme,
        sortBy: state.sortBy,
        quickNoteType: state.quickNoteType,
      }),
      migrate: (persisted: any, version: number) => {
        if (version < 2) {
          // Map old tab values to new ones
          const tabMap: Record<string, string> = {
            inbox: 'stream',
            views: 'stream',
            search: 'stream',
            settings: 'stream',
          };
          if (persisted.activeTab && tabMap[persisted.activeTab]) {
            persisted.activeTab = tabMap[persisted.activeTab];
          }
        }
        if (version < 3) {
          // v3: Pro state now determined by purchase/promo status
          delete persisted.isPro;
        }
        return persisted;
      },
    }
  )
);

// ==========================================
// DATA CACHE STORE (for reactive updates)
// ==========================================

interface DataState {
  notes: Note[];
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  removeNote: (id: string) => void;
  
  actionItems: ActionItem[];
  setActionItems: (items: ActionItem[]) => void;
  addActionItem: (item: ActionItem) => void;
  updateActionItem: (id: string, updates: Partial<ActionItem>) => void;
  removeActionItem: (id: string) => void;
  
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
  addTag: (tag: Tag) => void;
  removeTag: (id: string) => void;
  
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useDataStore = create<DataState>((set) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),
  addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates, updatedAt: new Date() } : n)),
  })),
  removeNote: (id) => set((state) => ({
    notes: state.notes.filter((n) => n.id !== id),
  })),
  
  actionItems: [],
  setActionItems: (items) => set({ actionItems: items }),
  addActionItem: (item) => set((state) => ({ actionItems: [...state.actionItems, item] })),
  updateActionItem: (id, updates) => set((state) => ({
    actionItems: state.actionItems.map((a) => (a.id === id ? { ...a, ...updates } : a)),
  })),
  removeActionItem: (id) => set((state) => ({
    actionItems: state.actionItems.filter((a) => a.id !== id),
  })),
  
  tags: [],
  setTags: (tags) => set({ tags }),
  addTag: (tag) => set((state) => ({ tags: [...state.tags, tag] })),
  removeTag: (id) => set((state) => ({
    tags: state.tags.filter((t) => t.id !== id),
  })),
  
  isLoading: true,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
