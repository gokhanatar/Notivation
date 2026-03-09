import { useTranslation } from '@/lib/i18n';

interface WritingStatsProps {
  text: string;
}

export function WritingStats({ text }: WritingStatsProps) {
  const { t } = useTranslation();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;
  const readingTime = Math.max(1, Math.ceil(words / 200));

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 px-1 border-t border-border">
      <span>{words} {t('stats.words')}</span>
      <span>{chars} {t('stats.chars')}</span>
      <span>~{readingTime} {t('stats.minRead')}</span>
    </div>
  );
}
