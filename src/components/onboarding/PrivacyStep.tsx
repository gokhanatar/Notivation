import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { Shield, CloudOff, UserX, Lock, Bot } from 'lucide-react';

interface PrivacyStepProps {
  onNext: () => void;
}

const privacyPoints = [
  { icon: CloudOff, labelKey: 'onboarding.noCloud' },
  { icon: UserX, labelKey: 'onboarding.noAccount' },
  { icon: Lock, labelKey: 'onboarding.yourData' },
  { icon: Bot, labelKey: 'onboarding.aiOptional' },
] as const;

export function PrivacyStep({ onNext }: PrivacyStepProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center min-h-[60vh] px-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
      >
        <Shield className="w-10 h-10 text-primary" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-bold text-foreground mb-2 text-center"
      >
        {t('onboarding.privacy')}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-muted-foreground mb-10 text-center max-w-xs"
      >
        {t('onboarding.privacyDesc')}
      </motion.p>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        {privacyPoints.map((point, i) => {
          const Icon = point.icon;
          return (
            <motion.div
              key={point.labelKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.15 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-card border border-border"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {t(point.labelKey)}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
