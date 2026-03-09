import { cn } from '@/lib/utils';
import { Lock } from 'lucide-react';
import { useUIStore } from '@/store/useStore';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

interface ProLockedStateProps {
  feature: string;
  description: string;
  className?: string;
}

export function ProLockedState({ feature, description, className }: ProLockedStateProps) {
  const { setShowProModal, setProModalFeature } = useUIStore();
  const { t } = useTranslation();

  const handleUnlock = () => {
    setProModalFeature(feature);
    setShowProModal(true);
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 rounded-xl',
        'bg-gradient-to-br from-muted/50 to-muted',
        'border border-border/50',
        'text-center',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Lock className="w-6 h-6 text-primary" />
      </div>

      <h3 className="font-semibold text-foreground mb-1">{feature}</h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-[250px]">
        {description}
      </p>

      <Button onClick={handleUnlock} size="sm" className="tap-target">
        {t('pro.unlockWithPro')}
      </Button>
    </div>
  );
}
