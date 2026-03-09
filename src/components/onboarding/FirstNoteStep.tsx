import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { QuickNoteInput } from '@/components/notes/QuickNoteInput';
import { Sparkles } from 'lucide-react';

interface FirstNoteStepProps {
  onComplete: () => void;
}

export function FirstNoteStep({ onComplete }: FirstNoteStepProps) {
  const { t } = useTranslation();
  const [noteCreated, setNoteCreated] = useState(false);

  const handleNoteCreated = () => {
    setNoteCreated(true);
  };

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6"
      >
        <Sparkles className="w-8 h-8 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-foreground mb-2 text-center"
      >
        {t('onboarding.firstNote')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground mb-8 text-center max-w-xs"
      >
        {t('quickNote.hint')}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm"
      >
        <QuickNoteInput
          onNoteCreated={handleNoteCreated}
        />
      </motion.div>

      {noteCreated && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-sm text-primary font-medium"
        >
          {t('quickNote.saved')}
        </motion.p>
      )}
    </div>
  );
}
