import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { hapticLight, hapticSuccess } from '@/lib/native/haptics';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { CheckCircle2 } from 'lucide-react';
import type { Scenario, ScenarioOutcome } from '@/lib/db';

interface ScenarioResolveFlowProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scenario: (Scenario & { outcomes: ScenarioOutcome[] }) | null;
  onResolve: (outcomeId: string, reflection?: string) => void;
}

export function ScenarioResolveFlow({ open, onOpenChange, scenario, onResolve }: ScenarioResolveFlowProps) {
  const { t } = useTranslation();
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string | null>(null);
  const [reflection, setReflection] = useState('');

  if (!scenario) return null;

  const handleConfirm = () => {
    if (!selectedOutcomeId) return;
    hapticSuccess();
    onResolve(selectedOutcomeId, reflection.trim() || undefined);
    // Reset state
    setSelectedOutcomeId(null);
    setReflection('');
    onOpenChange(false);
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setSelectedOutcomeId(null);
      setReflection('');
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('scenario.resolveTitle')}</DialogTitle>
          <DialogDescription>{t('scenario.resolveDesc')}</DialogDescription>
        </DialogHeader>

        {/* Condition reminder */}
        <div className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground font-medium">{t('scenario.condition')}:</span>{' '}
          {scenario.condition}
        </div>

        {/* What happened */}
        <div className="space-y-2">
          <p className="text-sm font-medium">{t('scenario.whatHappened')}</p>
          <div className="space-y-2">
            {scenario.outcomes.map((outcome) => (
              <motion.button
                key={outcome.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  hapticLight();
                  setSelectedOutcomeId(outcome.id);
                }}
                className={cn(
                  'w-full text-left rounded-lg border p-3 transition-colors',
                  selectedOutcomeId === outcome.id
                    ? 'border-green-500 bg-green-500/10 ring-1 ring-green-500/30'
                    : 'border-border hover:border-border/80 hover:bg-muted/30'
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    selectedOutcomeId === outcome.id
                      ? 'border-green-500 bg-green-500'
                      : 'border-muted-foreground/30'
                  )}>
                    {selectedOutcomeId === outcome.id && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium break-words">{outcome.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{outcome.probability}%</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Reflection */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">{t('scenario.reflection')}</label>
          <Textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder={t('scenario.reflectionPlaceholder')}
            className="text-sm min-h-[60px] resize-none"
          />
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedOutcomeId}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {t('scenario.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
