import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useNoteActions } from '@/hooks/useNotes';
import { hapticMedium } from '@/lib/native/haptics';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { type Note } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, Scale } from 'lucide-react';

interface QuickDecisionProps {
  note: Note;
  onNoteSelect: (noteId: string) => void;
}

export function QuickDecision({ note, onNoteSelect }: QuickDecisionProps) {
  const { editNote } = useNoteActions();
  const { t } = useTranslation();

  const displayTitle = getDisplayTitle(note.title, note.body);

  const handleDecision = async (decision: 'yes' | 'no' | 'later') => {
    hapticMedium();
    if (decision === 'later') {
      // Do nothing special, just leave it open
      return;
    }

    // Mark as outcome stage with the decision in the body
    const decisionText = decision === 'yes' ? t('decision.decidedYes') : t('decision.decidedNo');
    const updatedBody = note.body
      ? `${note.body}\n\n---\n${decisionText} (${new Date().toLocaleDateString()})`
      : `${decisionText} (${new Date().toLocaleDateString()})`;

    await editNote(note.id, {
      lifecycleStage: 'outcome',
      body: updatedBody,
    });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl border border-border bg-card p-4 space-y-3 press-effect"
    >
      <button
        onClick={() => onNoteSelect(note.id)}
        className="w-full text-left"
      >
        <div className="flex items-start gap-2">
          <Scale className="w-4 h-4 text-decision mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{displayTitle}</p>
            {note.body && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {note.body.slice(0, 100)}
              </p>
            )}
          </div>
        </div>
      </button>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDecision('yes')}
          className="flex-1 text-green-600 border-green-500/30 hover:bg-green-500/10 h-10 tap-target min-w-0 px-2"
        >
          <Check className="w-4 h-4 flex-shrink-0 mr-1" />
          <span className="truncate text-xs">{t('decision.yes')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDecision('no')}
          className="flex-1 text-red-600 border-red-500/30 hover:bg-red-500/10 h-10 tap-target min-w-0 px-2"
        >
          <X className="w-4 h-4 flex-shrink-0 mr-1" />
          <span className="truncate text-xs">{t('decision.no')}</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleDecision('later')}
          className="flex-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10 h-10 tap-target min-w-0 px-2"
        >
          <Clock className="w-4 h-4 flex-shrink-0 mr-1" />
          <span className="truncate text-xs">{t('decision.later')}</span>
        </Button>
      </div>
    </motion.div>
  );
}
