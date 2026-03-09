import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { calculateClarityScore, type ClarityScore } from '@/lib/clarity/clarityEngine';
import { useNoteActions } from '@/hooks/useNotes';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { type Note } from '@/lib/db';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Archive, SkipForward, Eye, Sparkles } from 'lucide-react';

interface CleanupFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CleanupFlow({ open, onOpenChange }: CleanupFlowProps) {
  const { t } = useTranslation();
  const { archiveNote } = useNoteActions();
  const [candidates, setCandidates] = useState<Note[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState(0);

  useEffect(() => {
    if (open) {
      calculateClarityScore().then(result => {
        setCandidates(result.cleanupCandidates);
        setCurrentIndex(0);
        setReviewed(0);
      });
    }
  }, [open]);

  const current = candidates[currentIndex];
  const isComplete = !current || currentIndex >= candidates.length;

  const handleKeep = () => {
    setReviewed(prev => prev + 1);
    setCurrentIndex(prev => prev + 1);
  };

  const handleArchive = async () => {
    if (current) {
      await archiveNote(current.id);
      setReviewed(prev => prev + 1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleSkip = () => {
    setCurrentIndex(prev => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {t('clarity.cleanupTitle')}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isComplete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-6"
            >
              <Sparkles className="w-10 h-10 text-primary mx-auto mb-3" />
              <p className="font-medium">{t('clarity.cleanupDone')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('clarity.reviewedCount', { count: reviewed })}
              </p>
              <Button
                className="mt-4"
                onClick={() => onOpenChange(false)}
              >
                {t('common.done')}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key={current.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              {/* Progress */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{currentIndex + 1}/{candidates.length}</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${((currentIndex + 1) / candidates.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Note preview */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium mb-1">
                  {getDisplayTitle(current.title, current.body)}
                </h4>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {current.body || t('clarity.noContent')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(current.updatedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleKeep}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  {t('clarity.keep')}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-amber-600 hover:text-amber-700"
                  onClick={handleArchive}
                >
                  <Archive className="w-4 h-4 mr-1" />
                  {t('clarity.archive')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkip}
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
