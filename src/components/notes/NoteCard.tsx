import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type Note, type Tag, getTagsForNote } from '@/lib/db';
import { TypeBadge } from './TypeBadge';
import { ThoughtAge } from './ThoughtAge';
import { DueDatePill } from './DueDatePill';
import { IncubationBadge } from './IncubationBadge';
import { FolderChip } from './FolderChip';
import { Pin, Lock, ChevronRight, Archive, Trash2, ArrowUp } from 'lucide-react';
import { useActionItems } from '@/hooks/useNotes';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  onSwipeArchive?: () => void;
  onSwipeDelete?: () => void;
  onSwipePromote?: () => void;
  className?: string;
}

export function NoteCard({ note, onClick, onSwipeArchive, onSwipeDelete, onSwipePromote, className }: NoteCardProps) {
  const allActionItems = useActionItems();
  const actionItems = allActionItems.filter((a) => a.noteId === note.id);
  const [tags, setTags] = useState<Tag[]>([]);

  const { isDragging, offsetX, direction, handlers } = useSwipeGesture({
    onSwipeRight: onSwipeArchive,
    onSwipeLeft: onSwipeDelete,
    onSwipeUp: onSwipePromote,
  });

  useEffect(() => {
    getTagsForNote(note.id).then(setTags);
  }, [note.id]);

  const completedActions = actionItems.filter((a) => a.isDone).length;
  const totalActions = actionItems.length;

  // Get display title (user title or auto-generated)
  const displayTitle = getDisplayTitle(note.title, note.body);

  // Get first line of body for preview (skip if title is empty as body becomes title)
  const bodyPreview = note.title ? note.body.split('\n')[0]?.slice(0, 100) :
    note.body.split('\n').slice(1).join(' ').slice(0, 100) || '';
  
  // Lifecycle-based left border color
  const lifecycleBorderColor = note.lifecycleStage
    ? `hsl(var(--lifecycle-${note.lifecycleStage}))`
    : undefined;
  const borderStyle = note.color
    ? { borderLeftColor: note.color, borderLeftWidth: '3px' }
    : lifecycleBorderColor
    ? { borderLeftColor: lifecycleBorderColor, borderLeftWidth: '3px' }
    : undefined;

  return (
    <div className="relative overflow-hidden rounded-xl" {...handlers}>
      {/* Swipe background indicators */}
      {isDragging && direction === 'right' && (
        <div className="absolute inset-0 flex items-center pl-4 bg-green-500/20 rounded-xl z-0">
          <Archive className="w-5 h-5 text-green-600" />
        </div>
      )}
      {isDragging && direction === 'left' && (
        <div className="absolute inset-0 flex items-center justify-end pr-4 bg-red-500/20 rounded-xl z-0">
          <Trash2 className="w-5 h-5 text-red-600" />
        </div>
      )}
      {isDragging && direction === 'up' && (
        <div className="absolute inset-0 flex items-center justify-center bg-purple-500/20 rounded-xl z-0">
          <ArrowUp className="w-5 h-5 text-purple-600" />
        </div>
      )}
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, x: isDragging ? offsetX * 0.3 : 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'w-full text-left p-4 rounded-xl bg-card shadow-card relative z-10',
        'border border-border/50 hover:border-border',
        'transition-all duration-200 cursor-pointer',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'group',
        className
      )}
      style={borderStyle}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header with badges — compact row */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <TypeBadge type={note.type} size="sm" />
            {note.pinned && (
              <Pin className="w-3 h-3 text-primary fill-primary flex-shrink-0" />
            )}
            {note.vault && (
              <Lock className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            )}
            {note.dueDate && (
              <DueDatePill date={note.dueDate} size="sm" />
            )}
            <IncubationBadge note={note} />
            <div className="flex-1" />
            <ThoughtAge date={note.updatedAt} />
          </div>
          
          {/* Title */}
          <h3 className="font-semibold text-foreground line-clamp-1 mb-1">
            {displayTitle}
          </h3>
          
          {/* Body preview */}
          {bodyPreview && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {bodyPreview}
            </p>
          )}
          
          {/* Action progress */}
          {totalActions > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    completedActions === totalActions
                      ? 'bg-status-done'
                      : 'bg-primary'
                  )}
                  style={{ width: `${(completedActions / totalActions) * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {completedActions}/{totalActions}
              </span>
            </div>
          )}

          {/* Tags */}
          {(tags.length > 0 || note.folderId) && (
            <div className="flex flex-wrap gap-1 mt-1">
              {note.folderId && <FolderChip folderId={note.folderId} />}
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white max-w-[80px] truncate"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Arrow indicator */}
        <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors flex-shrink-0 mt-1" />
      </div>

    </motion.button>
    </div>
  );
}
