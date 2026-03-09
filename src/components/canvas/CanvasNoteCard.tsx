import { useRef, useCallback } from 'react';
import { type Note } from '@/lib/db';
import { typeConfig } from '@/components/notes/TypeBadge';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { cn } from '@/lib/utils';

interface CanvasNoteCardProps {
  note: Note & { x: number; y: number };
  onDragStart: () => void;
  onDragEnd: (x: number, y: number) => void;
  onDoubleClick: () => void;
  onLongPress: () => void;
  isSelected: boolean;
}

export function CanvasNoteCard({
  note,
  onDragStart,
  onDragEnd,
  onDoubleClick,
  onLongPress,
  isSelected,
}: CanvasNoteCardProps) {
  const dragRef = useRef<{ startX: number; startY: number; noteX: number; noteY: number; isDragging: boolean } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const config = typeConfig[note.type];
  const displayTitle = getDisplayTitle(note.title, note.body);
  const firstLine = note.body?.split('\n')[0]?.slice(0, 60) || '';

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    const el = cardRef.current;
    if (!el) return;

    el.setPointerCapture(e.pointerId);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      noteX: note.x,
      noteY: note.y,
      isDragging: false,
    };

    // Long press detection
    longPressTimer.current = setTimeout(() => {
      if (dragRef.current && !dragRef.current.isDragging) {
        onLongPress();
      }
    }, 500);
  }, [note.x, note.y, onLongPress]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 5 && !dragRef.current.isDragging) {
      dragRef.current.isDragging = true;
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      onDragStart();
    }

    if (dragRef.current.isDragging && cardRef.current) {
      // We apply a transform for smooth visual feedback during drag
      // The parent will read the scale from the viewport, but for now just translate
      cardRef.current.style.transform = `translate(${dragRef.current.noteX + dx}px, ${dragRef.current.noteY + dy}px)`;
    }
  }, [onDragStart]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (!dragRef.current) return;

    if (dragRef.current.isDragging) {
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = dragRef.current.noteX + dx;
      const newY = dragRef.current.noteY + dy;
      onDragEnd(newX, newY);
    }

    dragRef.current = null;
  }, [onDragEnd]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDoubleClick();
  }, [onDoubleClick]);

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute w-[180px] min-h-[80px] rounded-lg bg-card border border-border shadow-sm p-3 cursor-grab active:cursor-grabbing select-none transition-shadow',
        isSelected && 'border-primary ring-2 ring-primary/30'
      )}
      style={{
        transform: `translate(${note.x}px, ${note.y}px)`,
        zIndex: isSelected ? 10 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
    >
      {/* Type badge color dot */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <span
          className={cn('w-2.5 h-2.5 rounded-full shrink-0', config.badgeClass)}
          style={{ display: 'inline-block' }}
        />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium truncate">
          {config.label}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-medium leading-tight truncate text-foreground">
        {displayTitle}
      </h4>

      {/* First line of body */}
      {firstLine && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {firstLine}
        </p>
      )}
    </div>
  );
}
