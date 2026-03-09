import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Lightbulb, CheckSquare, Scale } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

const features = [
  { icon: Lightbulb, labelKey: 'onboarding.feature1' },
  { icon: CheckSquare, labelKey: 'onboarding.feature2' },
  { icon: Scale, labelKey: 'onboarding.feature3' },
];

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="w-20 h-20 mx-auto mb-5 rounded-2xl overflow-hidden shadow-lg"><img src="/logo.png" alt="Notivation" className="w-full h-full object-cover" /></div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-3xl font-bold text-foreground mb-2"
      >
        Notivation
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-base text-muted-foreground max-w-xs mb-8"
      >
        {t('onboarding.tagline')}
      </motion.p>

      {/* Feature highlights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="space-y-3 w-full max-w-xs"
      >
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.labelKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.15 }}
              className="flex items-center gap-3 text-left px-4 py-3 rounded-xl bg-muted/50"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4.5 h-4.5 text-primary" />
              </div>
              <span className="text-sm text-foreground">{t(f.labelKey)}</span>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
