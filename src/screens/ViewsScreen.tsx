import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotes, useActionItems } from '@/hooks/useNotes';
import { useUIStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { NoteCard } from '@/components/notes/NoteCard';
import { ProLockedState } from '@/components/notes/ProLockedState';
import {
  Pin,
  Clock,
  Calendar,
  AlertCircle,
  Plus,
  Lock,
  Archive,
  Trash2,
  X
} from 'lucide-react';
import { isThisWeek, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Note, ActionItem, CustomView, NoteType } from '@/lib/db';
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface ViewsScreenProps {
  onNoteSelect: (noteId: string) => void;
  onOpenArchive?: () => void;
}

export function ViewsScreen({ onNoteSelect, onOpenArchive }: ViewsScreenProps) {
  const notes = useNotes();
  const actions = useActionItems();
  const isPro = useUIStore((s) => s.isPro);
  const { t } = useTranslation();
  const [customViews, setCustomViews] = useState<CustomView[]>([]);
  const [showCreateView, setShowCreateView] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  const [newViewType, setNewViewType] = useState<NoteType | ''>('');
  const [newViewPinned, setNewViewPinned] = useState(false);

  useEffect(() => {
    db.customViews.toArray().then(setCustomViews);
  }, []);

  const builtInViews = useMemo(() => [
    {
      id: 'pinned',
      label: t('views.pinnedDecisions'),
      icon: Pin,
      notes: notes.filter(n => n.pinned && n.type === 'decision')
    },
    {
      id: 'followup',
      label: t('views.waitingFollowup'),
      icon: Clock,
      notes: notes.filter(n => n.type === 'followup')
    },
    {
      id: 'this-week',
      label: t('views.thisWeekDecisions'),
      icon: Calendar,
      notes: notes.filter(n =>
        n.type === 'decision' &&
        n.dueDate &&
        isThisWeek(new Date(n.dueDate))
      )
    },
    {
      id: 'overdue',
      label: t('views.overdueActions'),
      icon: AlertCircle,
      notes: (() => {
        const overdueNoteIds = new Set(
          actions
            .filter(a => a.dueDate && isPast(new Date(a.dueDate)) && !a.isDone)
            .map(a => a.noteId)
        );
        return notes.filter(n => overdueNoteIds.has(n.id));
      })()
    },
  ], [notes, actions, t]);

  const getCustomViewNotes = (view: CustomView) => {
    let result = notes.filter(n => !n.archived);
    if (view.filters.type) result = result.filter(n => n.type === view.filters.type);
    if (view.filters.pinned) result = result.filter(n => n.pinned);
    return result;
  };

  const handleCreateView = async () => {
    if (!newViewName.trim()) return;
    const view: CustomView = {
      id: crypto.randomUUID(),
      name: newViewName.trim(),
      filters: {
        ...(newViewType ? { type: newViewType as NoteType } : {}),
        ...(newViewPinned ? { pinned: true } : {}),
      },
      sortBy: 'updatedAt',
      createdAt: new Date(),
    };
    await db.customViews.add(view);
    setCustomViews(prev => [...prev, view]);
    setShowCreateView(false);
    setNewViewName('');
    setNewViewType('');
    setNewViewPinned(false);
    toast.success(t('views.viewCreated'));
  };

  const handleDeleteView = async (id: string) => {
    await db.customViews.delete(id);
    setCustomViews(prev => prev.filter(v => v.id !== id));
    toast.success(t('views.viewDeleted'));
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('nav.views')}
        subtitle={t('views.subtitle')}
      />

      <div className="flex-1 overflow-y-auto -mx-4 px-4 md:-mx-0 md:px-0 pb-20 md:pb-6 space-y-6 scrollbar-hide">
        {/* Built-in Views */}
        <section>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            {t('views.builtIn')}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
            {builtInViews.map((view) => {
              const Icon = view.icon;
              return (
                <ViewCard
                  key={view.id}
                  icon={<Icon className="w-5 h-5" />}
                  label={view.label}
                  count={view.notes.length}
                  notes={view.notes}
                  onNoteSelect={onNoteSelect}
                  t={t}
                />
              );
            })}
          </div>
        </section>

        {/* Custom Views (Pro) */}
        <section>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            {t('views.custom')}
            {!isPro && <Lock className="w-3.5 h-3.5" />}
          </h3>

          {isPro ? (
            <div className="space-y-2">
              {customViews.map((view) => (
                <div key={view.id} className="relative">
                  <ViewCard
                    icon={<Pin className="w-5 h-5" />}
                    label={view.name}
                    count={getCustomViewNotes(view).length}
                    notes={getCustomViewNotes(view)}
                    onNoteSelect={onNoteSelect}
                    t={t}
                  />
                  <button
                    onClick={() => handleDeleteView(view.id)}
                    className="absolute top-4 right-12 w-6 h-6 rounded-full bg-muted flex items-center justify-center"
                  >
                    <Trash2 className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              ))}

              {showCreateView ? (
                <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <Input
                    placeholder={t('views.viewName')}
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 flex-wrap">
                    {(['decision', 'action', 'info', 'idea', 'followup'] as NoteType[]).map(type => (
                      <button
                        key={type}
                        onClick={() => setNewViewType(newViewType === type ? '' : type)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium border',
                          newViewType === type ? 'border-primary bg-primary/10' : 'border-border'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                    <button
                      onClick={() => setNewViewPinned(!newViewPinned)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1',
                        newViewPinned ? 'border-primary bg-primary/10' : 'border-border'
                      )}
                    >
                      <Pin className="w-3 h-3" /> Pinned
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCreateView} disabled={!newViewName.trim()}>
                      {t('common.save')}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowCreateView(false)}>
                      {t('common.cancel')}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" className="w-full justify-start tap-target" onClick={() => setShowCreateView(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('views.createCustom')}
                </Button>
              )}
            </div>
          ) : (
            <ProLockedState
              feature={t('views.custom')}
              description={t('views.customDescription')}
            />
          )}
        </section>

        {/* Archive */}
        <section>
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
            {t('views.archive')}
          </h3>
          <button
            onClick={() => onOpenArchive?.()}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-xl',
              'border border-border bg-card',
              'text-left tap-target press-effect'
            )}
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-medium">{t('views.archive')}</h4>
              <p className="text-sm text-muted-foreground">{t('views.archiveDesc')}</p>
            </div>
          </button>
        </section>
      </div>
    </div>
  );
}

function ViewCard({
  icon,
  label,
  count,
  notes,
  onNoteSelect,
  t
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  notes: Note[];
  onNoteSelect: (id: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      layout
      className={cn(
        'rounded-xl border border-border bg-card overflow-hidden',
        'transition-colors hover:border-border'
      )}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center gap-3 p-4 text-left',
          'tap-target press-effect'
        )}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-foreground">{label}</h4>
          <p className="text-sm text-muted-foreground">
            {t('views.noteCount', { count })}
          </p>
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-muted-foreground"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-border"
          >
            <div className="p-3 space-y-2 max-h-[300px] overflow-y-auto scrollbar-hide">
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('views.noNotes')}
                </p>
              ) : (
                notes.slice(0, 5).map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onClick={() => onNoteSelect(note.id)}
                  />
                ))
              )}
              {notes.length > 5 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  +{notes.length - 5} {t('common.more')}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
