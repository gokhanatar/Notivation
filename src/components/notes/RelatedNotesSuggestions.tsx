import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { type SearchResult } from '@/lib/search/semanticSearch';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { Lightbulb } from 'lucide-react';

interface RelatedNotesSuggestionsProps {
  suggestions: SearchResult[];
  onNoteSelect?: (noteId: string) => void;
}

export function RelatedNotesSuggestions({ suggestions, onNoteSelect }: RelatedNotesSuggestionsProps) {
  const { t } = useTranslation();

  if (suggestions.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="space-y-1.5 overflow-hidden"
      >
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          {t('reverseSearch.related')}
        </p>
        {suggestions.map((result) => (
          <motion.button
            key={result.note.id}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => onNoteSelect?.(result.note.id)}
            className="w-full text-left px-2.5 py-1.5 rounded-md bg-muted/40 hover:bg-muted transition-colors text-xs"
          >
            <span className="font-medium text-foreground">
              {getDisplayTitle(result.note.title, result.note.body)}
            </span>
            <span className="text-muted-foreground ml-1.5 line-clamp-1">
              {result.snippet}
            </span>
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}
