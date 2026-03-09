import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import {
  generateMorningBrief,
  shouldShowBrief,
  dismissBrief,
  type MorningBrief,
} from '@/lib/morningBrief/morningBriefEngine';
import { MemoryRecallCard } from './MemoryRecallCard';
import { ClarityScoreWidget } from './ClarityScoreWidget';
import { FreshStartBanner } from './FreshStartBanner';
import { IncubationWakeUpCard } from './IncubationWakeUpCard';
import { MomentumWidget } from './MomentumWidget';
import { OpenLoopsSummary } from './OpenLoopsSummary';
import { X, AlertTriangle, CalendarCheck, Clock, Flame, FileText } from 'lucide-react';

interface MorningBriefCardProps {
  onNoteSelect?: (noteId: string) => void;
  onStartCleanup?: () => void;
  onOpenLoops?: () => void;
}

export function MorningBriefCard({ onNoteSelect, onStartCleanup, onOpenLoops }: MorningBriefCardProps) {
  const { t } = useTranslation();
  const [brief, setBrief] = useState<MorningBrief | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!shouldShowBrief()) return;

    generateMorningBrief().then((data) => {
      setBrief(data);
      setVisible(data.shouldShow);
    });
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    dismissBrief();
  };

  if (!brief || !visible) return null;

  const metrics = [
    {
      icon: AlertTriangle,
      value: brief.overdueActions,
      label: t('brief.overdueActions'),
      color: brief.overdueActions > 0 ? 'text-red-500' : 'text-muted-foreground',
    },
    {
      icon: CalendarCheck,
      value: brief.todayActions,
      label: t('brief.todayActions'),
      color: brief.todayActions > 0 ? 'text-blue-500' : 'text-muted-foreground',
    },
    {
      icon: Clock,
      value: brief.agingNotes,
      label: t('brief.agingNotes'),
      color: brief.agingNotes > 0 ? 'text-amber-500' : 'text-muted-foreground',
    },
    {
      icon: Flame,
      value: brief.streak,
      label: t('brief.streak'),
      color: brief.streak > 0 ? 'text-orange-500' : 'text-muted-foreground',
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -20, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="mb-4 overflow-hidden"
        >
          <div className={cn(
            'relative rounded-xl p-4 space-y-3',
            'bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5',
            'border border-primary/20'
          )}>
            {/* Header with dismiss */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">
                  {t(brief.greeting)}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <FileText className="w-3 h-3 inline mr-1" />
                  {brief.totalNotes} {t('brief.totalNotes')}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="w-10 h-10 rounded-xl bg-muted/80 flex items-center justify-center hover:bg-muted transition-colors tap-target flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="w-4.5 h-4.5 text-muted-foreground" />
              </button>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <div
                    key={metric.label}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-background/60"
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0', metric.color)} />
                    <span className={cn('text-base font-bold', metric.color)}>
                      {metric.value}
                    </span>
                    <span className="text-xs text-muted-foreground leading-tight line-clamp-1">
                      {metric.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Fresh Start Banner */}
            <FreshStartBanner />

            {/* Momentum Widget */}
            <MomentumWidget />

            {/* Clarity Score Widget (A2) */}
            <ClarityScoreWidget onStartCleanup={onStartCleanup} />

            {/* Incubation Wake Up */}
            <IncubationWakeUpCard onNoteSelect={onNoteSelect} />

            {/* Open Loops Summary */}
            <OpenLoopsSummary onOpenLoops={onOpenLoops} />

            {/* Memory Recall (A1) */}
            <MemoryRecallCard onNoteSelect={onNoteSelect} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
