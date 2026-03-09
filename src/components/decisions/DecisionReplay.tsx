import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { buildDecisionReplay, type DecisionReplay as DecisionReplayType } from '@/lib/decisions/decisionReplayEngine';
import { format } from 'date-fns';
import { GitCommitVertical, Sparkles, Brain, Scale, Zap, Trophy, Plus } from 'lucide-react';
import { moodEmoji } from '@/components/notes/MoodPicker';
import type { MoodType } from '@/lib/db';

interface DecisionReplayProps {
  noteId: string;
}

const stageIcons: Record<string, typeof Sparkles> = {
  created: Plus,
  spark: Sparkles,
  thought: Brain,
  decision: Scale,
  action: Zap,
  outcome: Trophy,
};

const stageColors: Record<string, string> = {
  created: 'text-muted-foreground',
  spark: 'text-yellow-500',
  thought: 'text-blue-500',
  decision: 'text-purple-500',
  action: 'text-orange-500',
  outcome: 'text-green-500',
};

export function DecisionReplay({ noteId }: DecisionReplayProps) {
  const { t } = useTranslation();
  const [replay, setReplay] = useState<DecisionReplayType | null>(null);

  useEffect(() => {
    buildDecisionReplay(noteId).then(setReplay);
  }, [noteId]);

  if (!replay || replay.steps.length < 2) return null;

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
        <GitCommitVertical className="w-3.5 h-3.5" />
        {t('replay.title')}
      </h3>

      <div className="relative pl-6">
        {/* Vertical line */}
        <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-border" />

        {replay.steps.map((step, index) => {
          const Icon = stageIcons[step.stage] || GitCommitVertical;
          const color = stageColors[step.stage] || 'text-muted-foreground';

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-3 pb-4 last:pb-0"
            >
              {/* Dot on timeline */}
              <div className={cn(
                'absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center bg-background border-2 border-border z-10',
                color
              )}>
                <Icon className="w-3 h-3" />
              </div>

              {/* Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <span className={cn('text-sm font-medium', color)}>
                    {t(step.stageLabelKey)}
                  </span>
                  {step.mood && (
                    <span className="text-sm">{moodEmoji(step.mood as MoodType)}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(step.timestamp), 'MMM d, yyyy')}</span>
                  {step.daysFromPrevious > 0 && (
                    <span className="text-muted-foreground/60">
                      +{step.daysFromPrevious}d
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {replay.totalDays > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {t('replay.totalDays', { days: replay.totalDays })}
        </p>
      )}
    </div>
  );
}
