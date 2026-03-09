import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

interface OutcomePickerProps {
  selected?: 'positive' | 'negative' | 'neutral';
  onChange: (outcome: 'positive' | 'negative' | 'neutral') => void;
}

const outcomes = [
  { id: 'positive' as const, icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-500/10', activeBg: 'bg-green-500/20 border-green-500/40' },
  { id: 'neutral' as const, icon: Minus, color: 'text-gray-500', bg: 'bg-gray-500/10', activeBg: 'bg-gray-500/20 border-gray-500/40' },
  { id: 'negative' as const, icon: ThumbsDown, color: 'text-red-500', bg: 'bg-red-500/10', activeBg: 'bg-red-500/20 border-red-500/40' },
];

export function OutcomePicker({ selected, onChange }: OutcomePickerProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">{t('emotion.outcomeQuestion')}</p>
      <div className="flex gap-2">
        {outcomes.map((outcome) => {
          const Icon = outcome.icon;
          const isSelected = selected === outcome.id;

          return (
            <button
              key={outcome.id}
              onClick={() => onChange(outcome.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all',
                isSelected
                  ? outcome.activeBg
                  : 'border-transparent ' + outcome.bg + ' hover:border-border'
              )}
            >
              <Icon className={cn('w-4 h-4', outcome.color)} />
              <span className={cn('text-xs font-medium', outcome.color)}>
                {t(`emotion.${outcome.id}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
