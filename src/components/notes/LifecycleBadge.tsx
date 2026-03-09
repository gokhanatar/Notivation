import { cn } from '@/lib/utils';
import { type LifecycleStage } from '@/lib/db';
import { lifecycleStageMap } from '@/lib/lifecycle/lifecycleEngine';
import { useTranslation } from '@/lib/i18n';
import { Sparkles, Brain, Scale, Zap, Trophy } from 'lucide-react';

const iconMap = {
  Sparkles,
  Brain,
  Scale,
  Zap,
  Trophy,
};

const badgeColorMap: Record<LifecycleStage, string> = {
  spark: 'bg-[hsl(var(--lifecycle-spark)/0.15)] text-[hsl(var(--lifecycle-spark))]',
  thought: 'bg-[hsl(var(--lifecycle-thought)/0.15)] text-[hsl(var(--lifecycle-thought))]',
  decision: 'bg-[hsl(var(--lifecycle-decision)/0.15)] text-[hsl(var(--lifecycle-decision))]',
  action: 'bg-[hsl(var(--lifecycle-action)/0.15)] text-[hsl(var(--lifecycle-action))]',
  outcome: 'bg-[hsl(var(--lifecycle-outcome)/0.15)] text-[hsl(var(--lifecycle-outcome))]',
};

interface LifecycleBadgeProps {
  stage: LifecycleStage;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

export function LifecycleBadge({ stage, size = 'sm', showLabel = true, className }: LifecycleBadgeProps) {
  const { t } = useTranslation();
  const config = lifecycleStageMap[stage];
  if (!config) return null;

  const Icon = iconMap[config.icon as keyof typeof iconMap];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full',
        badgeColorMap[stage],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        className
      )}
    >
      <Icon className={cn(size === 'sm' ? 'w-3 h-3' : 'w-4 h-4')} />
      {showLabel && <span>{t(config.labelKey)}</span>}
    </span>
  );
}
