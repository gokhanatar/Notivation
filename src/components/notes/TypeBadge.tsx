import { type NoteType } from '@/lib/db';
import { cn } from '@/lib/utils';
import {
  Scale,
  CheckSquare,
  Info,
  Lightbulb,
  Clock,
  HelpCircle,
  BookOpen
} from 'lucide-react';

interface TypeBadgeProps {
  type: NoteType;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const typeConfig: Record<NoteType, { 
  label: string; 
  icon: typeof Scale;
  badgeClass: string;
}> = {
  decision: {
    label: 'Decision',
    icon: Scale,
    badgeClass: 'badge-decision',
  },
  action: {
    label: 'Action',
    icon: CheckSquare,
    badgeClass: 'badge-action',
  },
  info: {
    label: 'Info',
    icon: Info,
    badgeClass: 'badge-info',
  },
  idea: {
    label: 'Idea',
    icon: Lightbulb,
    badgeClass: 'badge-idea',
  },
  followup: {
    label: 'Follow-up',
    icon: Clock,
    badgeClass: 'badge-followup',
  },
  question: {
    label: 'Question',
    icon: HelpCircle,
    badgeClass: 'badge-question',
  },
  journal: {
    label: 'Journal',
    icon: BookOpen,
    badgeClass: 'badge-journal',
  },
};

export function TypeBadge({ type, size = 'sm', showLabel = true, className }: TypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        config.badgeClass,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export function getTypeConfig(type: NoteType) {
  return typeConfig[type];
}

export { typeConfig };
