import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { getSettings } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  detectLandmarks,
  shouldShowFreshStart,
  dismissFreshStart,
  saveWeeklyIntention,
  type Landmark,
} from '@/lib/freshStart/freshStartEngine';

interface FreshStartBannerProps {
  onDismiss?: () => void;
}

export function FreshStartBanner({ onDismiss }: FreshStartBannerProps) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const [intention, setIntention] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const show = await shouldShowFreshStart();
      if (!show || cancelled) return;

      const settings = await getSettings();
      const detected = detectLandmarks(settings.userBirthday);
      if (detected.length === 0 || cancelled) return;

      setLandmarks(detected);
      setVisible(true);
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    dismissFreshStart();
    onDismiss?.();
  };

  const handleSaveIntention = async () => {
    if (!intention.trim()) return;
    await saveWeeklyIntention(intention.trim());
    setSaved(true);
  };

  const firstLandmark = landmarks[0];
  const isMonday = firstLandmark?.type === 'monday';

  if (!visible || !firstLandmark) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mb-4 overflow-hidden"
        >
          <div className="relative rounded-xl p-4 bg-primary/5 border border-primary/20">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h3 className="text-base font-semibold text-foreground">
                  {t('freshStart.title')}
                </h3>
              </div>
              <button
                onClick={handleDismiss}
                className="w-8 h-8 rounded-lg bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Landmark message */}
            <p className="text-sm text-foreground/80 mb-3">
              <span className="mr-1.5">{firstLandmark.emoji}</span>
              {t(firstLandmark.messageKey)}
            </p>

            {/* Weekly intention input (Monday only) */}
            {isMonday && !saved && (
              <div className="flex gap-2">
                <Input
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  placeholder={t('freshStart.intentionPlaceholder')}
                  className="flex-1 bg-background/60 border-border"
                />
                <Button
                  onClick={handleSaveIntention}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {t('freshStart.saveIntention')}
                </Button>
              </div>
            )}

            {/* Saved confirmation */}
            {isMonday && saved && (
              <p className="text-sm text-primary font-medium">
                {t('freshStart.intentionSaved')}
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
