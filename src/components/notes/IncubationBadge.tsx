import { cn } from '@/lib/utils';
import { type Note } from '@/lib/db';
import { isIncubating, getRemainingTime } from '@/lib/incubation/incubationEngine';
import { Moon } from 'lucide-react';

interface IncubationBadgeProps {
  note: Note;
}

export function IncubationBadge({ note }: IncubationBadgeProps) {
  if (!isIncubating(note)) return null;

  const { days, hours } = getRemainingTime(note);

  const timeText = days > 0
    ? `${days}d ${hours}h`
    : `${hours}h`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full',
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
      )}
    >
      <Moon className="w-3 h-3" />
      <span>{timeText}</span>
    </span>
  );
}
