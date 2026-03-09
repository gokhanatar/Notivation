import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useDecisionItems, useDecisionActions } from '@/hooks/useDecisions';
import { type DecisionItem } from '@/lib/db';
import { hapticLight } from '@/lib/native/haptics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Star } from 'lucide-react';

interface ProConMatrixProps {
  noteId: string;
}

function WeightDots({ weight, onChange }: { weight: number; onChange?: (w: number) => void }) {
  return (
    <div className="flex gap-0.5 items-center">
      {[1, 2, 3, 4, 5].map((w) => (
        <button
          key={w}
          onClick={() => onChange?.(w)}
          className={cn(
            'transition-colors',
            onChange ? 'cursor-pointer' : 'cursor-default'
          )}
          aria-label={`Weight ${w}`}
        >
          <Star
            className={cn(
              'w-3 h-3',
              w <= weight
                ? 'fill-current text-current'
                : 'text-muted-foreground/30'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function ItemRow({
  item,
  colorClass,
  onUpdateWeight,
  onDelete,
}: {
  item: DecisionItem;
  colorClass: string;
  onUpdateWeight: (weight: number) => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: item.type === 'pro' ? -20 : 20 }}
      className="group flex items-start gap-2 py-1.5"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug break-words">{item.text}</p>
        <div className={cn('mt-0.5', colorClass)}>
          <WeightDots weight={item.weight} onChange={onUpdateWeight} />
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-muted-foreground hover:text-destructive h-9 w-9 p-0 flex-shrink-0 tap-target"
        aria-label="Delete item"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </motion.div>
  );
}

function AddItemInput({
  type,
  noteId,
  placeholder,
  onAdd,
}: {
  type: 'pro' | 'con';
  noteId: string;
  placeholder: string;
  onAdd: (noteId: string, text: string, type: 'pro' | 'con', weight?: number) => Promise<any>;
}) {
  const [text, setText] = useState('');
  const [weight, setWeight] = useState(3);

  const handleAdd = async () => {
    if (!text.trim()) return;
    await onAdd(noteId, text.trim(), type, weight);
    setText('');
    setWeight(3);
  };

  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex items-center gap-1.5">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={placeholder}
          className="text-sm h-8 bg-transparent"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAdd}
          disabled={!text.trim()}
          className="h-10 w-10 p-0 flex-shrink-0 tap-target"
          aria-label="Add item"
        >
          <Plus className="w-5 h-5" />
        </Button>
      </div>
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted-foreground">Weight:</span>
        <WeightDots weight={weight} onChange={setWeight} />
      </div>
    </div>
  );
}

export function ProConMatrix({ noteId }: ProConMatrixProps) {
  const items = useDecisionItems(noteId);
  const { addDecisionItem, updateDecisionItem, deleteDecisionItem } = useDecisionActions();
  const { t } = useTranslation();

  const pros = items.filter(i => i.type === 'pro');
  const cons = items.filter(i => i.type === 'con');

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
        {t('decision.proConAnalysis')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Pros Column */}
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
          <h4 className="text-sm font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            {t('decision.pros')} ({pros.length})
          </h4>

          <AnimatePresence mode="popLayout">
            {pros.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                colorClass="text-green-600 dark:text-green-400"
                onUpdateWeight={(w) => updateDecisionItem(item.id, { weight: w })}
                onDelete={() => deleteDecisionItem(item.id)}
              />
            ))}
          </AnimatePresence>

          <AddItemInput
            type="pro"
            noteId={noteId}
            placeholder={t('decision.addPro')}
            onAdd={addDecisionItem}
          />
        </div>

        {/* Cons Column */}
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
          <h4 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            {t('decision.cons')} ({cons.length})
          </h4>

          <AnimatePresence mode="popLayout">
            {cons.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                colorClass="text-red-600 dark:text-red-400"
                onUpdateWeight={(w) => updateDecisionItem(item.id, { weight: w })}
                onDelete={() => deleteDecisionItem(item.id)}
              />
            ))}
          </AnimatePresence>

          <AddItemInput
            type="con"
            noteId={noteId}
            placeholder={t('decision.addCon')}
            onAdd={addDecisionItem}
          />
        </div>
      </div>
    </div>
  );
}
