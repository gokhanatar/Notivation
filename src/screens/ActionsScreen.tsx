import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotes, useActionItems } from '@/hooks/useNotes';
import { useActionEvents } from '@/hooks/useActionEvents';
import { useUIStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { ActionRow } from '@/components/notes/ActionRow';
import { isToday, isTomorrow, isThisWeek, isPast, startOfToday, formatDistanceToNow, format } from 'date-fns';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  CalendarDays, 
  Activity,
  FileText,
  Edit3,
  Archive,
  Pin,
  CheckSquare,
  Star
} from 'lucide-react';

interface ActionsScreenProps {
  onNoteSelect: (noteId: string) => void;
}

const views = [
  { id: 'today' as const, label: 'Today', icon: CheckCircle2, labelKey: 'actions.today' },
  { id: 'week' as const, label: 'This Week', icon: CalendarDays, labelKey: 'actions.thisWeek' },
  { id: 'overdue' as const, label: 'Overdue', icon: AlertCircle, labelKey: 'actions.overdue' },
  { id: 'followup' as const, label: 'Follow-up', icon: Clock, labelKey: 'actions.followup' },
  { id: 'activity' as const, label: 'Activity', icon: Activity, labelKey: 'actions.activity' },
];

// Get icon for action event type
function getEventIcon(type: string) {
  switch (type) {
    case 'note_created': return FileText;
    case 'note_updated': return Edit3;
    case 'note_archived': return Archive;
    case 'note_pinned': return Pin;
    case 'note_unpinned': return Pin;
    case 'action_completed': return CheckSquare;
    case 'action_reopened': return CheckSquare;
    case 'note_favorited': return Star;
    default: return Activity;
  }
}

// Event label keys for translation
const eventLabelKeys: Record<string, string> = {
  'note_created': 'activity.noteCreated',
  'note_updated': 'activity.noteUpdated',
  'note_archived': 'activity.noteArchived',
  'note_pinned': 'activity.notePinned',
  'note_unpinned': 'activity.noteUnpinned',
  'action_completed': 'activity.actionCompleted',
  'action_reopened': 'activity.actionReopened',
  'note_favorited': 'activity.noteFavorited',
  'note_unfavorited': 'activity.noteUnfavorited',
};

export function ActionsScreen({ onNoteSelect }: ActionsScreenProps) {
  const { t } = useTranslation();
  const actions = useActionItems();
  const notes = useNotes();
  const actionEvents = useActionEvents();
  const { actionsView, setActionsView } = useUIStore();

  const noteMap = useMemo(() => 
    new Map(notes.map(n => [n.id, n])), 
    [notes]
  );

  const filteredActions = useMemo(() => {
    if (actionsView === 'activity') return [];
    
    const today = startOfToday();
    
    return actions.filter(action => {
      const note = noteMap.get(action.noteId);
      if (!note || note.archived) return false;
      
      switch (actionsView) {
        case 'today':
          if (!action.dueDate) return false;
          return isToday(new Date(action.dueDate)) && !action.isDone;
          
        case 'week': {
          if (!action.dueDate) return false;
          const dueDate = new Date(action.dueDate);
          return isThisWeek(dueDate) && !isPast(dueDate) && !action.isDone;
        }
          
        case 'overdue':
          if (!action.dueDate) return false;
          return isPast(new Date(action.dueDate)) && !isToday(new Date(action.dueDate)) && !action.isDone;
          
        case 'followup':
          return note.type === 'followup' && !action.isDone;
          
        default:
          return true;
      }
    }).sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [actions, noteMap, actionsView]);

  const stats = useMemo(() => {
    const notArchivedActions = actions.filter(a => {
      const note = noteMap.get(a.noteId);
      return note && !note.archived;
    });
    
    return {
      today: notArchivedActions.filter(a => 
        a.dueDate && isToday(new Date(a.dueDate)) && !a.isDone
      ).length,
      week: notArchivedActions.filter(a => {
        if (!a.dueDate || a.isDone) return false;
        const d = new Date(a.dueDate);
        return isThisWeek(d) && !isPast(d);
      }).length,
      overdue: notArchivedActions.filter(a => 
        a.dueDate && isPast(new Date(a.dueDate)) && !isToday(new Date(a.dueDate)) && !a.isDone
      ).length,
      followup: notArchivedActions.filter(a => {
        const note = noteMap.get(a.noteId);
        return note?.type === 'followup' && !a.isDone;
      }).length,
      activity: actionEvents.length,
    };
  }, [actions, noteMap, actionEvents.length]);

  const CurrentIcon = views.find(v => v.id === actionsView)?.icon || CheckCircle2;

  // Group events by date for activity view
  const groupedEvents = useMemo(() => {
    if (actionsView !== 'activity') return {};
    
    const groups: Record<string, typeof actionEvents> = {};
    
    for (const event of actionEvents) {
      const date = new Date(event.timestamp);
      const key = isToday(date) 
        ? 'Today' 
        : format(date, 'MMMM d, yyyy');
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    }
    
    return groups;
  }, [actionEvents, actionsView]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader 
        title={t('actions.title')} 
        subtitle={actionsView === 'activity'
          ? t('activity.eventCount', { count: actionEvents.length })
          : t('activity.taskCount', { count: filteredActions.length })}
      />
      
      {/* View Tabs - Scrollable pill design */}
      <div className="mb-4 -mx-4">
        <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide" role="tablist" aria-label={t('actions.views') || 'Action views'}>
          {views.map((view) => {
            const isActive = actionsView === view.id;
            const count = stats[view.id];
            const Icon = view.icon;

            return (
              <button
                key={view.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`${t(view.labelKey)}${count > 0 ? ` (${count})` : ''}`}
                onClick={() => setActionsView(view.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-full',
                  'text-sm font-medium whitespace-nowrap transition-all',
                  'min-w-fit shrink-0',
                  'active:scale-95 transform duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{t(view.labelKey)}</span>
                {count > 0 && (
                  <span className={cn(
                    'min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold',
                    'flex items-center justify-center',
                    isActive 
                      ? 'bg-primary-foreground/25 text-primary-foreground' 
                      : 'bg-background text-foreground'
                  )}>
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto -mx-4 px-4 md:-mx-0 md:px-0 pb-20 md:pb-6 space-y-2 scrollbar-hide">
        {actionsView === 'activity' ? (
          // Activity Log View
          <AnimatePresence mode="popLayout">
            {actionEvents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Activity className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t('activity.noActivity')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('activity.noActivityDesc')}
                </p>
              </motion.div>
            ) : (
              Object.entries(groupedEvents).map(([date, events]) => (
                <div key={date} className="mb-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    {date}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {events.map((event) => {
                      const Icon = getEventIcon(event.type);
                      
                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          role={event.noteId ? 'button' : undefined}
                          tabIndex={event.noteId ? 0 : undefined}
                          aria-label={event.noteId ? `${t(eventLabelKeys[event.type] || event.type)}: ${event.noteTitle || ''}` : undefined}
                          onKeyDown={(e) => {
                            if (event.noteId && (e.key === 'Enter' || e.key === ' ')) {
                              e.preventDefault();
                              onNoteSelect(event.noteId);
                            }
                          }}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-xl',
                            'bg-card border border-border',
                            event.noteId && 'cursor-pointer hover:bg-muted/50 transition-colors'
                          )}
                          onClick={() => event.noteId && onNoteSelect(event.noteId)}
                        >
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            event.type === 'note_created' && 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
                            event.type === 'note_updated' && 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
                            event.type === 'note_archived' && 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
                            event.type === 'note_pinned' && 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
                            event.type === 'action_completed' && 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
                            !['note_created', 'note_updated', 'note_archived', 'note_pinned', 'action_completed'].includes(event.type) && 'bg-muted text-muted-foreground'
                          )}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {t(eventLabelKeys[event.type] || event.type)}
                            </p>
                            {event.noteTitle && (
                              <p className="text-sm text-muted-foreground truncate">
                                {event.noteTitle}
                              </p>
                            )}
                            {event.metadata?.actionText && (
                              <p className="text-sm text-muted-foreground truncate">
                                "{event.metadata.actionText}"
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </AnimatePresence>
        ) : (
          // Tasks View
          <AnimatePresence mode="popLayout">
            {filteredActions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CurrentIcon className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {t('actions.empty')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {actionsView === 'overdue'
                    ? t('actions.allCaughtUp')
                    : t('actions.emptyDesc')}
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {filteredActions.map((action) => (
                <ActionRow
                  key={action.id}
                  action={action}
                  note={noteMap.get(action.noteId)}
                  showParent
                  onNoteClick={() => onNoteSelect(action.noteId)}
                />
              ))}
              </div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
