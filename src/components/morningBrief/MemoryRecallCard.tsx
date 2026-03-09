import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { getRecallItems, handleRecallResponse, type RecallItem } from '@/lib/memoryFade/memoryFadeEngine';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { Brain, Check, X, Clock } from 'lucide-react';

interface MemoryRecallCardProps {
  onNoteSelect?: (noteId: string) => void;
}

export function MemoryRecallCard({ onNoteSelect }: MemoryRecallCardProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<RecallItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    getRecallItems(3).then(setItems);
  }, []);

  if (items.length === 0) return null;

  const current = items[currentIndex];
  if (!current) return null;

  const handleResponse = async (response: 'yes' | 'no' | 'later') => {
    await handleRecallResponse(current.note.id, response);

    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setItems([]);
    }
  };

  const title = getDisplayTitle(current.note.title, current.note.body);
  const weeksAgo = Math.floor(current.daysSinceCreated / 7);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={current.note.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
      >
        <div className="flex items-start gap-2 mb-2">
          <Brain className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-purple-500 font-medium mb-1">
              {t('memoryFade.recallPrompt', {
                weeks: weeksAgo > 0 ? `${weeksAgo} ${t('memoryFade.weeksAgo')}` : `${current.daysSinceCreated} ${t('memoryFade.daysAgo')}`,
              })}
            </p>
            <button
              onClick={() => onNoteSelect?.(current.note.id)}
              className="text-sm font-medium text-foreground truncate block w-full text-left hover:text-primary transition-colors"
            >
              {title}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => handleResponse('yes')}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-green-500/10 text-green-600 text-xs font-medium hover:bg-green-500/20 transition-colors"
          >
            <Check className="w-3 h-3" />
            {t('memoryFade.stillValid')}
          </button>
          <button
            onClick={() => handleResponse('no')}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-red-500/10 text-red-500 text-xs font-medium hover:bg-red-500/20 transition-colors"
          >
            <X className="w-3 h-3" />
            {t('memoryFade.notAnymore')}
          </button>
          <button
            onClick={() => handleResponse('later')}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
          >
            <Clock className="w-3 h-3" />
            {t('memoryFade.later')}
          </button>
        </div>

        {items.length > 1 && (
          <div className="flex justify-center gap-1 mt-2">
            {items.map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  i === currentIndex ? 'bg-purple-500' : 'bg-purple-500/30'
                )}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
