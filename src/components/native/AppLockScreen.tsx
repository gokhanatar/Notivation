import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/lib/i18n';

interface AppLockScreenProps {
  onUnlock: () => Promise<boolean>;
}

export function AppLockScreen({ onUnlock }: AppLockScreenProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6 p-8"
      >
        <div className="w-20 h-20 rounded-2xl overflow-hidden"><img src="/logo.png" alt="Notivation" className="w-full h-full object-cover" /></div>

        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Notivation</h1>
          <p className="text-muted-foreground text-sm">
            {t('settings.appLockDesc')}
          </p>
        </div>

        <Button
          size="lg"
          onClick={onUnlock}
          className="px-8 tap-target"
        >
          {t('common.unlock') || 'Unlock'}
        </Button>
      </motion.div>
    </div>
  );
}
