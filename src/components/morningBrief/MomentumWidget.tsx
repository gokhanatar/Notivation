import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';
import { calculateMomentum, getZoneForScore, type MomentumData } from '@/lib/momentum/momentumEngine';
import { Flame, Zap, Wind, Sun, Moon } from 'lucide-react';

const zoneIcons: Record<string, React.ReactNode> = {
  dormant: <Moon className="w-4 h-4" />,
  warming: <Sun className="w-4 h-4" />,
  flowing: <Wind className="w-4 h-4" />,
  peak: <Zap className="w-4 h-4" />,
  onFire: <Flame className="w-4 h-4" />,
};

export function MomentumWidget() {
  const { t } = useTranslation();
  const [data, setData] = useState<MomentumData | null>(null);

  useEffect(() => {
    calculateMomentum().then(setData);
  }, []);

  if (!data) return null;

  const { zone, color } = getZoneForScore(data.score);

  return (
    <div className="rounded-lg bg-background/60 p-3">
      <div className="flex items-center gap-2">
        <span style={{ color }}>{zoneIcons[zone]}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {t('momentum.widget')} — <span style={{ color }}>{t(data.zoneLabel)}</span>
          </p>
          {data.isStruggling ? (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-muted-foreground">{t('momentum.struggling')}</p>
              <p className="text-xs text-muted-foreground italic">{t('momentum.encouragement')}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              {t('momentum.score', { score: data.score })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
