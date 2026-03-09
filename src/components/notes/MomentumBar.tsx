import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { calculateMomentum, getZoneForScore, type MomentumData } from '@/lib/momentum/momentumEngine';
import { Flame, Zap, Wind, Sun, Moon } from 'lucide-react';

interface MomentumBarProps {
  compact?: boolean;
}

const zoneIcons: Record<string, React.ReactNode> = {
  dormant: <Moon className="w-4 h-4" />,
  warming: <Sun className="w-4 h-4" />,
  flowing: <Wind className="w-4 h-4" />,
  peak: <Zap className="w-4 h-4" />,
  onFire: <Flame className="w-4 h-4" />,
};

export function MomentumBar({ compact = false }: MomentumBarProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<MomentumData | null>(null);

  useEffect(() => {
    calculateMomentum().then(setData);
  }, []);

  if (!data) return null;

  const { zone, color } = getZoneForScore(data.score);
  const barPercent = Math.min((data.score / 20) * 100, 100);
  const maxHistory = Math.max(...data.weeklyHistory, 1);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span style={{ color }}>{zoneIcons[zone]}</span>
        <div className="flex-1 h-2 rounded-full bg-muted/40 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${barPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{data.score}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ color }}>{zoneIcons[zone]}</span>
          <span className="text-sm font-medium">{t('momentum.title')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold" style={{ color }}>
            {t(data.zoneLabel)}
          </span>
          <span className="text-xs text-muted-foreground">
            {t('momentum.score', { score: data.score })}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${barPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Streak bonus */}
      {data.streakMultiplier > 1 && (
        <p className="text-xs text-muted-foreground">
          {t('momentum.streakBonus', { multiplier: `${data.streakMultiplier}x` })}
        </p>
      )}

      {/* Weekly mini chart */}
      <div className="flex items-end gap-1 h-8">
        {data.weeklyHistory.map((val, i) => {
          const h = Math.max((val / maxHistory) * 100, 6);
          const dayColor = getZoneForScore(val).color;
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-sm"
              style={{ backgroundColor: dayColor }}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: 'easeOut' }}
            />
          );
        })}
      </div>
    </div>
  );
}
