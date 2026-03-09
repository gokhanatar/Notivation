import { cn } from '@/lib/utils';
import { format, isToday, isTomorrow, isPast, isThisWeek } from 'date-fns';
import { Calendar } from 'lucide-react';

interface DueDatePillProps {
  date: Date;
  size?: 'sm' | 'md';
  className?: string;
}

export function DueDatePill({ date, size = 'sm', className }: DueDatePillProps) {
  const dateObj = new Date(date);
  const isOverdue = isPast(dateObj) && !isToday(dateObj);
  const isTodayDate = isToday(dateObj);
  const isTomorrowDate = isTomorrow(dateObj);
  const isThisWeekDate = isThisWeek(dateObj);

  const getLabel = () => {
    if (isTodayDate) return 'Today';
    if (isTomorrowDate) return 'Tomorrow';
    if (isThisWeekDate) return format(dateObj, 'EEEE');
    return format(dateObj, 'MMM d');
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        isOverdue && 'bg-destructive/10 text-destructive',
        isTodayDate && !isOverdue && 'bg-accent/20 text-accent-foreground',
        !isOverdue && !isTodayDate && 'bg-muted text-muted-foreground',
        className
      )}
    >
      <Calendar className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      <span>{getLabel()}</span>
    </span>
  );
}
