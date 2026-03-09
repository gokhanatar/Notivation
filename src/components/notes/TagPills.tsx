import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import type { Tag } from '@/lib/db';
import type { SuggestedTag } from '@/lib/tags/autoTagger';

interface TagPillsProps {
  tags: Tag[];
  suggestedTags?: SuggestedTag[];
  onRemoveTag?: (tagId: string) => void;
  onAcceptSuggestion?: (suggestion: SuggestedTag) => void;
}

export function TagPills({ tags, suggestedTags = [], onRemoveTag, onAcceptSuggestion }: TagPillsProps) {
  if (tags.length === 0 && suggestedTags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Existing tags */}
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
          {onRemoveTag && (
            <button
              onClick={() => onRemoveTag(tag.id)}
              className="ml-0.5 p-1 -mr-1 rounded-full hover:bg-black/10 transition-colors"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
      ))}

      {/* Suggested tags (dashed border) */}
      {suggestedTags.map((suggestion) => (
        <button
          key={suggestion.category}
          onClick={() => onAcceptSuggestion?.(suggestion)}
          className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium',
            'border border-dashed transition-all',
            'hover:border-solid hover:opacity-90 tap-target'
          )}
          style={{
            borderColor: suggestion.color,
            color: suggestion.color,
          }}
          aria-label={`Add suggested tag ${suggestion.name}`}
        >
          <Plus className="w-3 h-3" />
          {suggestion.name}
        </button>
      ))}
    </div>
  );
}
