import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { getAwakeningNotes, generateFreshPerspectivePrompt } from '@/lib/incubation/incubationEngine';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { type Note } from '@/lib/db';
import { Sunrise, ArrowRight } from 'lucide-react';

interface IncubationWakeUpCardProps {
  onNoteSelect?: (noteId: string) => void;
}

interface AwakenedNote {
  note: Note;
  prompt: string;
}

export function IncubationWakeUpCard({ onNoteSelect }: IncubationWakeUpCardProps) {
  const { t } = useTranslation();
  const [awakenedNotes, setAwakenedNotes] = useState<AwakenedNote[]>([]);

  useEffect(() => {
    getAwakeningNotes().then(notes => {
      setAwakenedNotes(
        notes.map(note => ({
          note,
          prompt: generateFreshPerspectivePrompt(note),
        }))
      );
    });
  }, []);

  if (awakenedNotes.length === 0) return null;

  return (
    <div className={cn('rounded-lg bg-primary/5 p-3')}>
      <div className="flex items-center gap-2 mb-3">
        <Sunrise className="w-4 h-4 text-primary" />
        <span className="text-xs font-semibold text-primary">
          {t('incubation.awakened')}
        </span>
      </div>

      <div className="space-y-3">
        {awakenedNotes.map(({ note, prompt }) => {
          const title = getDisplayTitle(note.title, note.body);

          return (
            <div
              key={note.id}
              className="bg-white/60 dark:bg-white/5 rounded-lg p-3"
            >
              <p className="text-sm font-medium text-foreground truncate mb-1">
                {title}
              </p>
              <p className="text-xs text-primary/80 italic mb-2">
                {t('incubation.freshPerspective')}: {prompt}
              </p>
              <button
                onClick={() => onNoteSelect?.(note.id)}
                className={cn(
                  'inline-flex items-center gap-1 text-xs font-medium',
                  'text-primary',
                  'hover:text-primary/80',
                  'transition-colors'
                )}
              >
                {t('incubation.openNote')}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
