import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type ActionItem, type Note } from '@/lib/db';
import { DueDatePill } from './DueDatePill';
import { Checkbox } from '@/components/ui/checkbox';
import { useActionItemActions } from '@/hooks/useNotes';

interface ActionRowProps {
  action: ActionItem;
  note?: Note;
  showParent?: boolean;
  onNoteClick?: () => void;
  className?: string;
}

export function ActionRow({ 
  action, 
  note, 
  showParent = true, 
  onNoteClick,
  className 
}: ActionRowProps) {
  const { toggleActionItem } = useActionItemActions();
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg',
        'bg-card border border-border/50',
        'hover:border-border transition-colors',
        className
      )}
    >
      <Checkbox
        checked={action.isDone}
        onCheckedChange={() => toggleActionItem(action.id)}
        className={cn(
          'mt-0.5 transition-all',
          action.isDone && 'opacity-50'
        )}
      />
      
      <div className="flex-1 min-w-0">
        <p 
          className={cn(
            'text-sm transition-all',
            action.isDone && 'line-through text-muted-foreground'
          )}
        >
          {action.text}
        </p>
        
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {showParent && note && (
            <button
              onClick={onNoteClick}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[200px]"
            >
              {note.title || 'Untitled'}
            </button>
          )}
          
          {action.dueDate && (
            <DueDatePill date={action.dueDate} size="sm" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
