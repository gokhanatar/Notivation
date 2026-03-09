import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { useScenarios } from '@/hooks/useScenarios';
import { hapticLight } from '@/lib/native/haptics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Plus, Trash2, GitBranch, AlertTriangle } from 'lucide-react';

interface ScenarioBuilderProps {
  noteId: string;
  onClose: () => void;
}

interface OutcomeRow {
  description: string;
  probability: number;
}

export function ScenarioBuilder({ noteId, onClose }: ScenarioBuilderProps) {
  const { t } = useTranslation();
  const { addScenario, addNewOutcome } = useScenarios(noteId);
  const [condition, setCondition] = useState('');
  const [outcomes, setOutcomes] = useState<OutcomeRow[]>([
    { description: '', probability: 50 },
    { description: '', probability: 50 },
  ]);
  const [saving, setSaving] = useState(false);

  const totalProbability = outcomes.reduce((sum, o) => sum + o.probability, 0);
  const probabilityWarning = Math.abs(totalProbability - 100) > 5;

  const addOutcomeRow = () => {
    hapticLight();
    setOutcomes(prev => [...prev, { description: '', probability: 10 }]);
  };

  const removeOutcomeRow = (index: number) => {
    if (outcomes.length <= 1) return;
    hapticLight();
    setOutcomes(prev => prev.filter((_, i) => i !== index));
  };

  const updateOutcomeDesc = (index: number, description: string) => {
    setOutcomes(prev => prev.map((o, i) => i === index ? { ...o, description } : o));
  };

  const updateOutcomeProbability = (index: number, probability: number) => {
    setOutcomes(prev => prev.map((o, i) => i === index ? { ...o, probability } : o));
  };

  const handleSave = async () => {
    if (!condition.trim()) return;
    const validOutcomes = outcomes.filter(o => o.description.trim());
    if (validOutcomes.length === 0) return;

    setSaving(true);
    try {
      // Create the scenario first, then add outcomes
      const { createScenario: createScenarioFn } = await import('@/lib/futureCast/futureCastEngine');
      const scenario = await createScenarioFn(noteId, condition.trim());
      for (let i = 0; i < validOutcomes.length; i++) {
        await addNewOutcome(scenario.id, validOutcomes[i].description.trim(), validOutcomes[i].probability, i);
      }
      hapticLight();
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const canSave = condition.trim().length > 0 && outcomes.some(o => o.description.trim().length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      className="space-y-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-blue-500" />
        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {t('scenario.futureCast')}
        </h3>
      </div>

      {/* Condition Input */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium">{t('scenario.condition')}</label>
        <Input
          value={condition}
          onChange={(e) => setCondition(e.target.value)}
          placeholder={t('scenario.conditionPlaceholder')}
          className="text-sm bg-transparent"
        />
      </div>

      {/* Outcomes */}
      <div className="space-y-3">
        <label className="text-sm font-medium">{t('scenario.outcome')}</label>
        <AnimatePresence mode="popLayout">
          {outcomes.map((outcome, index) => (
            <motion.div
              key={index}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-2 rounded-md border border-border/50 bg-background/50 p-3"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={outcome.description}
                  onChange={(e) => updateOutcomeDesc(index, e.target.value)}
                  placeholder={t('scenario.outcomePlaceholder')}
                  className="text-sm h-8 bg-transparent flex-1"
                />
                {outcomes.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOutcomeRow(index)}
                    className="text-muted-foreground hover:text-destructive h-8 w-8 p-0 flex-shrink-0"
                    aria-label="Remove outcome"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-3 px-1">
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {t('scenario.probability')}:
                </span>
                <Slider
                  value={[outcome.probability]}
                  onValueChange={([val]) => updateOutcomeProbability(index, val)}
                  min={0}
                  max={100}
                  step={5}
                  className="flex-1"
                />
                <span className="text-xs font-mono text-muted-foreground w-10 text-right">
                  {outcome.probability}%
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Add Outcome Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={addOutcomeRow}
          className="w-full text-muted-foreground hover:text-foreground"
        >
          <Plus className="w-4 h-4 mr-1" />
          {t('scenario.addOutcome')}
        </Button>
      </div>

      {/* Probability Warning */}
      {probabilityWarning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-md px-3 py-2"
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{t('scenario.probabilityWarning')} ({totalProbability}%)</span>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
        >
          {t('common.cancel')}
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!canSave || saving}
        >
          {t('scenario.save')}
        </Button>
      </div>
    </motion.div>
  );
}
