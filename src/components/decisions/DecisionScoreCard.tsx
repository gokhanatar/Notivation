import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useDecisionItems } from '@/hooks/useDecisions';
import { calculateDecisionScore } from '@/lib/decisions/decisionEngine';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface DecisionScoreCardProps {
  noteId: string;
}

export function DecisionScoreCard({ noteId }: DecisionScoreCardProps) {
  const items = useDecisionItems(noteId);
  const { t } = useTranslation();

  const pros = useMemo(() => items.filter(i => i.type === 'pro'), [items]);
  const cons = useMemo(() => items.filter(i => i.type === 'con'), [items]);
  const score = useMemo(() => calculateDecisionScore(pros, cons), [pros, cons]);

  // Don't show score card if there are no items
  if (items.length === 0) return null;

  const scorePercent = ((score.score + 100) / 200) * 100; // map -100..100 to 0..100

  const recommendationConfig = {
    yes: {
      text: t('decision.goForIt'),
      icon: ThumbsUp,
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      barColor: 'bg-green-500',
    },
    no: {
      text: t('decision.probablyNot'),
      icon: ThumbsDown,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      barColor: 'bg-red-500',
    },
    neutral: {
      text: t('decision.thinkMore'),
      icon: Minus,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      barColor: 'bg-amber-500',
    },
  };

  const config = recommendationConfig[score.recommendation];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('rounded-xl border p-4 space-y-3', config.bg, config.border)}
    >
      {/* Recommendation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn('w-5 h-5', config.color)} />
          <span className={cn('font-semibold text-sm', config.color)}>
            {config.text}
          </span>
        </div>
        <span className={cn('text-2xl font-bold', config.color)}>
          {score.score > 0 ? '+' : ''}{score.score}
        </span>
      </div>

      {/* Score Bar */}
      <div className="space-y-1">
        <div className="relative h-3 rounded-full bg-muted overflow-hidden">
          {/* Center marker */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/20 z-10" />

          {/* Score indicator */}
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: `${scorePercent}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className={cn('absolute left-0 top-0 bottom-0 rounded-full', config.barColor)}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>-100</span>
          <span>0</span>
          <span>+100</span>
        </div>
      </div>

      {/* Pro/Con Totals */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">{t('decision.proTotal')}:</span>
          <span className="font-semibold text-green-600 dark:text-green-400">{score.proTotal}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">{t('decision.conTotal')}:</span>
          <span className="font-semibold text-red-600 dark:text-red-400">{score.conTotal}</span>
          <span className="w-2 h-2 rounded-full bg-red-500" />
        </div>
      </div>
    </motion.div>
  );
}
