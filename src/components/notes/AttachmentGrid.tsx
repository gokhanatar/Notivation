import { cn } from '@/lib/utils';
import { X, ImageIcon } from 'lucide-react';

interface AttachmentGridProps {
  attachments: string[];
  onRemove?: (index: number) => void;
  onImageClick?: (index: number) => void;
  readonly?: boolean;
}

export function AttachmentGrid({ attachments, onRemove, onImageClick, readonly = false }: AttachmentGridProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2">
      {attachments.map((src, index) => (
        <div
          key={index}
          className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
          onClick={() => onImageClick?.(index)}
        >
          <img
            src={src}
            alt={`Attachment ${index + 1}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {!readonly && onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(index);
              }}
              className={cn(
                'absolute top-1 right-1 w-9 h-9 rounded-full',
                'bg-black/70 text-white flex items-center justify-center',
                'tap-target'
              )}
              aria-label={`Remove attachment ${index + 1}`}
            >
              <X className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function AttachmentCount({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <ImageIcon className="w-3 h-3" />
      {count}
    </span>
  );
}
