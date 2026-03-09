import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Feather, Sparkles, Check } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { type Note } from '@/lib/db';
import {
  generateGratitudePrompt,
  generateLearningExtraction,
  trackLetGo,
} from '@/lib/letgo/letGoEngine';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { hapticSuccess } from '@/lib/native/haptics';
import { toast } from 'sonner';
import { useNoteActions } from '@/hooks/useNotes';

interface LetGoFlowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: Note | null;
  onComplete: () => void;
}

export function LetGoFlow({ open, onOpenChange, note, onComplete }: LetGoFlowProps) {
  const { t } = useTranslation();
  const { archiveNote, createNote } = useNoteActions();
  const [step, setStep] = useState(1);
  const [reflection, setReflection] = useState('');
  const [lesson, setLesson] = useState('');

  // Generate prompts once when the note changes (memoized)
  const gratitudePrompt = useMemo(
    () => (note ? generateGratitudePrompt(note) : ''),
    [note?.id]
  );
  const learningPrompt = useMemo(
    () => (note ? generateLearningExtraction(note) : ''),
    [note?.id]
  );

  // Reset state when dialog opens/closes or note changes
  useEffect(() => {
    if (open) {
      setStep(1);
      setReflection('');
      setLesson('');
    }
  }, [open, note?.id]);

  // Auto-close after release step
  useEffect(() => {
    if (step === 4) {
      const timer = setTimeout(() => {
        onOpenChange(false);
        onComplete();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step, onOpenChange, onComplete]);

  const handleRelease = async () => {
    if (!note) return;

    // Track the let-go event
    const combinedReflection = [reflection, lesson].filter(Boolean).join('\n\n');
    await trackLetGo(note.id, note.title, combinedReflection || undefined);

    // Archive the note (also notifies data listeners)
    await archiveNote(note.id);

    // Optionally create an insight note from the reflection
    if (combinedReflection.trim()) {
      await createNote({
        type: 'info',
        title: `${t('letgo.insightPrefix')}: ${note.title}`,
        body: combinedReflection,
      });
    }

    hapticSuccess();
    toast.success(t('letgo.released'));
    setStep(4);
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Feather className="w-5 h-5 text-primary" />
            {t('letgo.title')}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{t('letgo.subtitle')}</p>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Select / Confirm */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>1/4</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-1/4 transition-all" />
                </div>
              </div>

              <h3 className="font-medium text-base">{t('letgo.step1Title')}</h3>
              <p className="text-sm text-muted-foreground">{t('letgo.step1Desc')}</p>

              <div className="p-4 rounded-lg bg-muted/50 border border-border">
                <h4 className="font-medium mb-1">{note.title || t('common.untitled')}</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.body || t('clarity.noContent')}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <Button className="w-full" onClick={() => setStep(2)}>
                {t('letgo.continue')}
              </Button>
            </motion.div>
          )}

          {/* Step 2: Reflect / Gratitude */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>2/4</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-2/4 transition-all" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <h3 className="font-medium text-base">{t('letgo.step2Title')}</h3>
              </div>

              <p className="text-sm text-muted-foreground italic">
                {gratitudePrompt}
              </p>

              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder={t('letgo.step2Placeholder')}
                className="min-h-[100px]"
              />

              <Button className="w-full" onClick={() => setStep(3)}>
                {t('letgo.continue')}
              </Button>
            </motion.div>
          )}

          {/* Step 3: Gratitude / Learning Extraction */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>3/4</span>
                <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full w-3/4 transition-all" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-medium text-base">{t('letgo.step3Title')}</h3>
              </div>

              <p className="text-sm text-muted-foreground italic">
                {learningPrompt}
              </p>

              <Textarea
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
                placeholder={t('letgo.step3Placeholder')}
                className="min-h-[100px]"
              />

              <Button
                className="w-full"
                onClick={handleRelease}
              >
                <Feather className="w-4 h-4 mr-1" />
                {t('letgo.letItGo')}
              </Button>
            </motion.div>
          )}

          {/* Step 4: Release / Confetti */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8 relative overflow-hidden"
            >
              {/* Simple confetti-like particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa', '#fb923c'][i % 6],
                    left: `${50 + (Math.random() - 0.5) * 60}%`,
                    top: '50%',
                  }}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{
                    y: [0, -80 - Math.random() * 60],
                    x: [(Math.random() - 0.5) * 100],
                    opacity: [1, 0],
                    scale: [1, 0.5],
                  }}
                  transition={{
                    duration: 1.2 + Math.random() * 0.5,
                    ease: 'easeOut',
                    delay: Math.random() * 0.3,
                  }}
                />
              ))}

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              >
                <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              </motion.div>
              <h3 className="font-semibold text-lg">{t('letgo.step4Title')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('letgo.step4Desc')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
