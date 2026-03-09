import { useOpenLoops } from '@/hooks/useOpenLoops';
import { useTranslation } from '@/lib/i18n';
import { AlertCircle } from 'lucide-react';

interface OpenLoopsSummaryProps {
  onOpenLoops?: () => void;
}

export function OpenLoopsSummary({ onOpenLoops }: OpenLoopsSummaryProps) {
  const { t } = useTranslation();
  const { data, loading } = useOpenLoops();

  if (loading || !data || data.totalCount === 0) return null;

  return (
    <div className="rounded-lg bg-background/60 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {t('loops.summary')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('loops.openLoopsCount', { count: data.totalCount })}
            </p>
          </div>
        </div>

        {/* Category breakdown dots */}
        <div className="flex items-center gap-2">
          {data.stale.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-red-500">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {data.stale.length}
            </span>
          )}
          {data.waiting.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {data.waiting.length}
            </span>
          )}
          {data.active.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-blue-500">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {data.active.length}
            </span>
          )}
          {data.forgotten.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              {data.forgotten.length}
            </span>
          )}
        </div>
      </div>

      {onOpenLoops && (
        <button
          onClick={onOpenLoops}
          className="mt-2 w-full text-xs font-medium px-2.5 py-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          {t('loops.reviewLoops')}
        </button>
      )}
    </div>
  );
}
