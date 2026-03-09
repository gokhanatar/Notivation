import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { calculateClarityScore, type ClarityScore } from '@/lib/clarity/clarityEngine';
import { Sparkles } from 'lucide-react';

interface ClarityScoreWidgetProps {
  onStartCleanup?: () => void;
}

export function ClarityScoreWidget({ onStartCleanup }: ClarityScoreWidgetProps) {
  const { t } = useTranslation();
  const [clarity, setClarity] = useState<ClarityScore | null>(null);

  useEffect(() => {
    calculateClarityScore().then(setClarity);
  }, []);

  if (!clarity) return null;

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (clarity.score / 100) * circumference;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-background/60">
      {/* Circular gauge */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 40 40">
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="text-muted/30"
          />
          <motion.circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={clarity.color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: clarity.color }}>
          {clarity.score}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" style={{ color: clarity.color }} />
          {t(`clarity.level.${clarity.level}`)}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('clarity.description')}
        </p>
      </div>

      {clarity.score < 50 && clarity.cleanupCandidates.length > 0 && (
        <button
          onClick={onStartCleanup}
          className="text-xs font-medium px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors whitespace-nowrap"
        >
          {t('clarity.cleanup')}
        </button>
      )}
    </div>
  );
}
