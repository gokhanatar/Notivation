import { cn } from '@/lib/utils';
import { type LifecycleStage } from '@/lib/db';
import { stageOrder, getLifecycleStageIndex } from '@/lib/lifecycle/lifecycleEngine';

interface LifecycleProgressBarProps {
  stage: LifecycleStage;
  className?: string;
}

const segmentColors: Record<LifecycleStage, string> = {
  spark: 'bg-[hsl(var(--lifecycle-spark))]',
  thought: 'bg-[hsl(var(--lifecycle-thought))]',
  decision: 'bg-[hsl(var(--lifecycle-decision))]',
  action: 'bg-[hsl(var(--lifecycle-action))]',
  outcome: 'bg-[hsl(var(--lifecycle-outcome))]',
};

export function LifecycleProgressBar({ stage, className }: LifecycleProgressBarProps) {
  const activeIndex = getLifecycleStageIndex(stage);

  return (
    <div className={cn('flex gap-0.5 h-1', className)}>
      {stageOrder.map((s, i) => (
        <div
          key={s}
          className={cn(
            'flex-1 rounded-full transition-colors',
            i <= activeIndex ? segmentColors[s] : 'bg-muted'
          )}
        />
      ))}
    </div>
  );
}
