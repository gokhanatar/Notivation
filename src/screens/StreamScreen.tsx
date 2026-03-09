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
import { canPromote } from '@/lib/lifecycle/lifecycleEngine';
import { useEffect } from 'react';
import {
  Filter,
  SortAsc,
  Pin,
  Flame,
  Crown,
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
import { MorningBriefCard } from '@/components/morningBrief/MorningBriefCard';
import { MomentumBar } from '@/components/notes/MomentumBar';
import { CleanupFlow } from '@/components/modals/CleanupFlow';

interface StreamScreenProps {
  onNoteSelect: (noteId: string) => void;
}

export function StreamScreen({ onNoteSelect }: StreamScreenProps) {
  const notes = useNotes();
  const { activeFilter, setActiveFilter, clearFilters, sortBy, setSortBy, isPro, setShowProModal, setProModalFeature } = useUIStore();
  const { t } = useTranslation();
  const { archiveNote, promoteLifecycle } = useNoteActions();

  const [streak, setStreak] = useState({ current: 0, best: 0 });
  const [showCleanup, setShowCleanup] = useState(false);

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

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="Notivation"
        subtitle={filteredNotes.length > 0 ? `${filteredNotes.length} ${t('nav.notes').toLowerCase()}` : undefined}
        showLogo
      />

      {/* Morning Brief with Clarity & Memory Recall */}
      <MorningBriefCard
        onNoteSelect={onNoteSelect}
        onStartCleanup={() => setShowCleanup(true)}
      />

      {/* Momentum Bar — compact view */}
      <MomentumBar compact />

      {/* Cleanup Flow Modal */}
      <CleanupFlow open={showCleanup} onOpenChange={setShowCleanup} />

      <QuickNoteInput
        className="mb-4"
        onNoteCreated={onNoteSelect}
      />

      {/* Filter bar — compact single row */}
      <div className="flex items-center gap-2 mb-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={Object.keys(activeFilter).length > 0 ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5"
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              {t('inbox.filter')}
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
            <DropdownMenuItem
              onClick={() => setActiveFilter(
                activeFilter.pinned ? {} : { pinned: true }
              )}
              className={cn(activeFilter.pinned && 'bg-accent')}
            >
              <Pin className="w-4 h-4 mr-2" />
              {t('inbox.pinnedOnly')}
            </DropdownMenuItem>

            {hasActiveFilters && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { clearFilters(); setLifecycleFilter(null); }}>
                  {t('inbox.clearFilters')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2.5">
              <SortAsc className="w-3.5 h-3.5 mr-1" />
              {t('inbox.sort')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setSortBy('updatedAt')} className={cn(sortBy === 'updatedAt' && 'bg-accent')}>
              {t('inbox.lastUpdated')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('createdAt')} className={cn(sortBy === 'createdAt' && 'bg-accent')}>
              {t('inbox.dateCreated')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('dueDate')} className={cn(sortBy === 'dueDate' && 'bg-accent')}>
              {t('inbox.dueDate')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy('title')} className={cn(sortBy === 'title' && 'bg-accent')}>
              {t('inbox.title')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1" />

        {isPro && streak.current > 0 ? (
          <div className="flex items-center gap-1 text-xs text-orange-500">
            <Flame className="w-3.5 h-3.5" />
            <span className="font-medium">{streak.current}</span>
          </div>
        ) : !isPro ? (
          <button
            onClick={() => { setProModalFeature('Streaks'); setShowProModal(true); }}
            className="flex items-center gap-1 opacity-40 hover:opacity-60 transition-opacity"
          >
            <Flame className="w-3 h-3 text-muted-foreground" />
            <Crown className="w-2.5 h-2.5 text-amber-500" />
          </button>
        ) : null}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 md:-mx-0 md:px-0 pb-20 md:pb-6 scrollbar-hide">
        <AnimatePresence mode="popLayout">
          {filteredNotes.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="text-5xl mb-4">
                {hasActiveFilters ? '🔍' : '✨'}
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                {hasActiveFilters ? t('inbox.noNotesFiltered') : t('stream.emptyTitle')}
              </p>
              <p className="text-sm text-muted-foreground max-w-[260px]">
                {hasActiveFilters ? t('inbox.tryAdjusting') : t('stream.emptyDesc')}
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                onClick={() => onNoteSelect(note.id)}
                onSwipeArchive={() => archiveNote(note.id)}
                onSwipeDelete={() => archiveNote(note.id)}
                onSwipePromote={() => {
                  if (canPromote(note.lifecycleStage || 'spark')) {
                    promoteLifecycle(note.id);
                  }
                }}
              />
            ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
