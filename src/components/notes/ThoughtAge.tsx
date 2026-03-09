import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

type AgeCategory = 'fresh' | 'recent' | 'aging' | 'dormant';

interface ThoughtAgeProps {
  date: Date;
  showLabel?: boolean;
  className?: string;
}

const ageConfig: Record<AgeCategory, {
  translationKey: string;
  dotClass: string;
  labelClass: string;
}> = {
  fresh: {
    translationKey: 'age.fresh',
    dotClass: 'bg-green-500',
    labelClass: 'text-green-600 dark:text-green-400',
  },
  recent: {
    translationKey: 'age.recent',
    dotClass: 'bg-blue-500',
    labelClass: 'text-blue-600 dark:text-blue-400',
  },
  aging: {
    translationKey: 'age.aging',
    dotClass: 'bg-orange-500',
    labelClass: 'text-orange-600 dark:text-orange-400',
  },
  dormant: {
    translationKey: 'age.dormant',
    dotClass: 'bg-gray-400',
    labelClass: 'text-muted-foreground opacity-70',
  },
};

function getAgeCategory(date: Date): AgeCategory {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) return 'fresh';
  if (diffDays < 7) return 'recent';
  if (diffDays < 30) return 'aging';
  return 'dormant';
}

export function ThoughtAge({ date, showLabel = false, className }: ThoughtAgeProps) {
  const { t } = useTranslation();
  const category = getAgeCategory(date);
  const config = ageConfig[category];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        className
      )}
    >
      <span
        className={cn(
          'w-2 h-2 rounded-full flex-shrink-0',
          config.dotClass,
          category === 'dormant' && 'opacity-60'
        )}
      />
      {showLabel && (
        <span className={cn('text-[10px] font-medium', config.labelClass)}>
          {t(config.translationKey)}
        </span>
      )}
    </span>
  );
}

export { getAgeCategory, type AgeCategory };
