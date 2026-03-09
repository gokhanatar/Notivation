import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import type { Tag } from '@/lib/db';

interface TagChipProps {
  tag: Tag;
  size?: 'sm' | 'md';
  onRemove?: () => void;
  className?: string;
}

export function TagChip({ tag, size = 'sm', onRemove, className }: TagChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        'bg-secondary text-secondary-foreground',
        className
      )}
      style={{
        backgroundColor: `${tag.color}20`,
        color: tag.color,
      }}
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: tag.color }}
      />
      <span>{tag.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:bg-black/10 rounded-full p-1 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </span>
  );
}
