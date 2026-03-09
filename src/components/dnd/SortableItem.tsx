import { type ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

// Dynamically import @dnd-kit modules
let useSortableHook: ((args: { id: string; disabled?: boolean }) => Record<string, unknown>) | null = null;
let CSS_util: Record<string, unknown> | null = null;
let dndLoaded = false;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sortable = require('@dnd-kit/sortable');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const utilities = require('@dnd-kit/utilities');
  useSortableHook = sortable.useSortable;
  CSS_util = utilities.CSS;
  dndLoaded = true;
} catch {
  // @dnd-kit not installed, will render without drag support
}

interface SortableItemProps {
  id: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SortableItem({ id, children, className, disabled = false }: SortableItemProps) {
  if (!dndLoaded || !useSortableHook) {
    // Fallback: render without drag support
    return <div className={className}>{children}</div>;
  }

  return <SortableItemInner id={id} className={className} disabled={disabled}>{children}</SortableItemInner>;
}

function SortableItemInner({ id, children, className, disabled }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortableHook!({ id, disabled });

  const style = {
    transform: (CSS_util as Record<string, Record<string, (t: unknown) => string>>)?.Transform?.toString(transform),
    transition: transition as string | undefined,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef as React.Ref<HTMLDivElement>}
      style={style}
      className={cn(className, isDragging && 'shadow-lg')}
      {...(attributes as Record<string, unknown>)}
      {...(listeners as Record<string, unknown>)}
    >
      {children}
    </div>
  );
}

// Re-export DnD kit types/components for convenience
export { dndLoaded };
