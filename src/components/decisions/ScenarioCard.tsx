import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { hapticLight } from '@/lib/native/haptics';
import { Button } from '@/components/ui/button';
import { ScenarioTree } from '@/components/decisions/ScenarioTree';
import { CheckCircle2, Circle, Trash2, GitBranch } from 'lucide-react';
import type { Scenario, ScenarioOutcome } from '@/lib/db';

interface ScenarioCardProps {
  scenario: Scenario & { outcomes: ScenarioOutcome[] };
  onResolve: () => void;
  onDelete: () => void;
}

export function ScenarioCard({ scenario, onResolve, onDelete }: ScenarioCardProps) {
  const { t } = useTranslation();
  const isResolved = scenario.resolved;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={cn(
        'rounded-lg border p-4 space-y-3',
        isResolved
          ? 'border-green-500/20 bg-green-500/5'
          : 'border-blue-500/20 bg-blue-500/5'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <GitBranch className={cn(
            'w-4 h-4 mt-0.5 flex-shrink-0',
            isResolved ? 'text-green-500' : 'text-blue-500'
          )} />
          <div className="min-w-0">
            <p className="text-sm font-medium break-words leading-snug">
              {scenario.condition}
            </p>
            <div className="flex items-center gap-2 mt-1">
              {/* Status badge */}
              <span className={cn(
                'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                isResolved
                  ? 'bg-green-500/15 text-green-600 dark:text-green-400'
                  : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
              )}>
                {isResolved
                  ? <CheckCircle2 className="w-3 h-3" />
                  : <Circle className="w-3 h-3" />
                }
                {isResolved ? t('scenario.resolved') : t('scenario.active')}
              </span>
              {/* Outcome count */}
              <span className="text-xs text-muted-foreground">
                {scenario.outcomes.length} {t('scenario.outcomes')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tree Visualization */}
      {scenario.outcomes.length > 0 && (
        <div className="overflow-x-auto -mx-2 px-2">
          <ScenarioTree scenario={scenario} />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            hapticLight();
            onDelete();
          }}
          className="text-muted-foreground hover:text-destructive h-8 text-xs"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          {t('scenario.delete')}
        </Button>
        {!isResolved && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              hapticLight();
              onResolve();
            }}
            className="h-8 text-xs border-green-500/30 text-green-600 dark:text-green-400 hover:bg-green-500/10"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            {t('scenario.resolve')}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
