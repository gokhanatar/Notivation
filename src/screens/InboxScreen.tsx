import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotes, useNoteActions } from '@/hooks/useNotes';
import { useUIStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { QuickNoteInput } from '@/components/notes/QuickNoteInput';
import { NoteCard } from '@/components/notes/NoteCard';
import { type NoteType } from '@/lib/db';
import { calculateStreak } from '@/lib/streaks';
import { useEffect } from 'react';
import {
  Filter,
  SortAsc,
  Pin,
  Lock,
  CheckSquare,
  Square,
  Archive,
  Trash2,
  X,
  Flame,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { typeConfig } from '@/components/notes/TypeBadge';
import { toast } from 'sonner';
import { hapticLight } from '@/lib/native/haptics';

interface InboxScreenProps {
  onNoteSelect: (noteId: string) => void;
}

export function InboxScreen({ onNoteSelect }: InboxScreenProps) {
  const notes = useNotes();
  const { activeFilter, setActiveFilter, clearFilters, sortBy, setSortBy, isPro, setShowProModal, setProModalFeature } = useUIStore();
  const { t } = useTranslation();
  const { archiveNote, deleteNote, togglePin } = useNoteActions();

  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState({ current: 0, best: 0 });

  useEffect(() => {
    if (isPro) calculateStreak().then(setStreak);
  }, [notes.length, isPro]);

  const filteredNotes = useMemo(() => {
    let result = notes.filter(n => !n.archived && !n.vault);

    if (activeFilter.type) {
      result = result.filter(n => n.type === activeFilter.type);
    }
    if (activeFilter.pinned) {
      result = result.filter(n => n.pinned);
    }
    if (activeFilter.vault) {
      result = result.filter(n => n.vault);
    }

    return result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      switch (sortBy) {
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'updatedAt':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }, [notes, activeFilter, sortBy]);

  const hasActiveFilters = Object.keys(activeFilter).length > 0;

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    setSelectedIds(new Set(filteredNotes.map(n => n.id)));
  };

  const handleBulkArchive = async () => {
    for (const id of selectedIds) {
      await archiveNote(id);
    }
    toast.success(t('bulk.archived', { count: String(selectedIds.size) }));
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await deleteNote(id);
    }
    toast.success(t('bulk.deleted', { count: String(selectedIds.size) }));
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkPin = async () => {
    for (const id of selectedIds) {
      await togglePin(id);
    }
    toast.success(t('bulk.pinToggled'));
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('nav.inbox')}
        subtitle={t('inbox.noteCount', { count: filteredNotes.length })}
        showLogo
      />

      {/* Streak Badge */}
      {isPro && streak.current > 0 ? (
        <div className="flex items-center gap-2 mb-3 px-1">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-500">
            {streak.current} {t('streak.days')}
          </span>
          {streak.best > streak.current && (
            <span className="text-xs text-muted-foreground">
              ({t('streak.best')}: {streak.best})
            </span>
          )}
        </div>
      ) : !isPro ? (
        <button
          onClick={() => { setProModalFeature('Streaks'); setShowProModal(true); }}
          className="flex items-center gap-1.5 mb-3 px-1 opacity-40 hover:opacity-60 transition-opacity"
        >
          <Flame className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{t('pro.streaks')}</span>
          <Crown className="w-2.5 h-2.5 text-amber-500" />
        </button>
      ) : null}

      <QuickNoteInput
        className="mb-4"
        onNoteCreated={onNoteSelect}
      />

      {/* Filters & Sort & Bulk */}
      <div className="flex items-center gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={hasActiveFilters ? "default" : "outline"}
              size="sm"
              className="tap-target"
            >
              <Filter className="w-4 h-4 mr-1.5" />
              {t('inbox.filter')}
              {hasActiveFilters && (
                <span className="ml-1.5 w-5 h-5 rounded-full bg-primary-foreground/20 text-xs flex items-center justify-center">
                  {Object.keys(activeFilter).length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>{t('inbox.byType')}</DropdownMenuLabel>
            {(Object.keys(typeConfig) as NoteType[]).map((type) => {
              const config = typeConfig[type];
              const Icon = config.icon;
              const isActive = activeFilter.type === type;

              return (
                <DropdownMenuItem
                  key={type}
                  onClick={() => setActiveFilter(isActive ? {} : { type })}
                  className={cn(isActive && 'bg-accent')}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {config.label}
                </DropdownMenuItem>
              );
            })}

            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t('inbox.other')}</DropdownMenuLabel>

            <DropdownMenuItem
              onClick={() => setActiveFilter(
                activeFilter.pinned ? {} : { pinned: true }
              )}
              className={cn(activeFilter.pinned && 'bg-accent')}
            >
              <Pin className="w-4 h-4 mr-2" />
              {t('inbox.pinnedOnly')}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => setActiveFilter(
                activeFilter.vault ? {} : { vault: true }
              )}
              className={cn(activeFilter.vault && 'bg-accent')}
            >
              <Lock className="w-4 h-4 mr-2" />
              {t('inbox.vaultNotes')}
            </DropdownMenuItem>

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={clearFilters}>
                  {t('inbox.clearFilters')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="tap-target">
              <SortAsc className="w-4 h-4 mr-1.5" />
              {t('inbox.sort')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onClick={() => setSortBy('updatedAt')}
              className={cn(sortBy === 'updatedAt' && 'bg-accent')}
            >
              {t('inbox.lastUpdated')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy('createdAt')}
              className={cn(sortBy === 'createdAt' && 'bg-accent')}
            >
              {t('inbox.dateCreated')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy('dueDate')}
              className={cn(sortBy === 'dueDate' && 'bg-accent')}
            >
              {t('inbox.dueDate')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setSortBy('title')}
              className={cn(sortBy === 'title' && 'bg-accent')}
            >
              {t('inbox.title')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {isPro ? (
          <Button
            variant={bulkMode ? "default" : "outline"}
            size="sm"
            className="tap-target ml-auto"
            onClick={() => {
              hapticLight();
              setBulkMode(!bulkMode);
              setSelectedIds(new Set());
            }}
          >
            <CheckSquare className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="tap-target ml-auto text-muted-foreground/50"
            onClick={() => {
              setProModalFeature('Bulk Operations');
              setShowProModal(true);
            }}
          >
            <div className="relative">
              <CheckSquare className="w-4 h-4" />
              <Crown className="w-2.5 h-2.5 text-amber-500 absolute -top-1.5 -right-1.5" />
            </div>
          </Button>
        )}
      </div>

      {/* Bulk Action Bar */}
      {bulkMode && (
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-muted">
          <Button variant="ghost" size="sm" onClick={selectAll}>
            {selectedIds.size === filteredNotes.length ? t('bulk.deselectAll') : t('bulk.selectAll')}
          </Button>
          <span className="text-xs text-muted-foreground flex-1">
            {selectedIds.size} {t('bulk.selected')}
          </span>
          <Button variant="ghost" size="sm" onClick={handleBulkPin} disabled={selectedIds.size === 0}>
            <Pin className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBulkArchive} disabled={selectedIds.size === 0}>
            <Archive className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBulkDelete} disabled={selectedIds.size === 0} className="text-destructive">
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { setBulkMode(false); setSelectedIds(new Set()); }}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 md:-mx-0 md:px-0 pb-20 md:pb-6 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Filter className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {hasActiveFilters ? t('inbox.noNotesFiltered') : t('inbox.noNotes')}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {hasActiveFilters ? t('inbox.tryAdjusting') : t('inbox.startCreating')}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNotes.map((note) => (
              <div key={note.id} className="flex items-start gap-2">
                {bulkMode && (
                  <button
                    onClick={() => toggleSelect(note.id)}
                    className="mt-4 flex-shrink-0"
                  >
                    {selectedIds.has(note.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                )}
                <div className="flex-1">
                  <NoteCard
                    note={note}
                    onClick={() => bulkMode ? toggleSelect(note.id) : onNoteSelect(note.id)}
                  />
                </div>
              </div>
            ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
