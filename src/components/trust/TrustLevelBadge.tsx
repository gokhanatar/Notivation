import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useTrust } from '@/hooks/useTrust';
import { trustLevels, trustLevelMap } from '@/lib/trust/progressiveTrustEngine';

export function TrustLevelBadge() {
  const { t } = useTranslation();
  const { trustLevel } = useTrust();
  const config = trustLevelMap[trustLevel];
  const currentOrder = config?.order ?? 0;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
      <span className="text-2xl">{config?.emoji}</span>
      <div className="flex-1">
        <p className="text-sm font-medium">{t(config?.labelKey || 'trust.seed')}</p>
        <div className="flex gap-1 mt-1">
          {trustLevels.map((level) => (
            <div
              key={level.id}
              className={cn(
                'h-1.5 flex-1 rounded-full transition-colors',
                level.order <= currentOrder ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
