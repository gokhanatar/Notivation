import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { useOpenLoops } from '@/hooks/useOpenLoops';
import { useNoteActions } from '@/hooks/useNotes';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Clock, Archive, AlertCircle, Hourglass, Zap, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { LoopCategory, OpenLoop } from '@/lib/openLoops/openLoopsEngine';

interface OpenLoopsScreenProps {
  onBack: () => void;
  onNoteSelect: (noteId: string) => void;
}

const TABS: Array<{ key: LoopCategory | 'all'; icon: typeof AlertCircle }> = [
  { key: 'all', icon: AlertCircle },
  { key: 'stale', icon: AlertCircle },
  { key: 'waiting', icon: Hourglass },
  { key: 'active', icon: Zap },
  { key: 'forgotten', icon: HelpCircle },
];

const CATEGORY_COLORS: Record<LoopCategory, string> = {
  stale: 'bg-red-500/15 text-red-600 dark:text-red-400',
  waiting: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  active: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  forgotten: 'bg-gray-500/15 text-gray-500 dark:text-gray-400',
};

const CATEGORY_DOT_COLORS: Record<LoopCategory, string> = {
  stale: 'bg-red-500',
  waiting: 'bg-amber-500',
  active: 'bg-blue-500',
  forgotten: 'bg-gray-400',
};

export function OpenLoopsScreen({ onBack, onNoteSelect }: OpenLoopsScreenProps) {
  const { t } = useTranslation();
  const { data, loading, refresh } = useOpenLoops();
  const { archiveNote } = useNoteActions();
  const [activeTab, setActiveTab] = useState<LoopCategory | 'all'>('all');

  const getLoopsForTab = (): OpenLoop[] => {
    if (!data) return [];
    if (activeTab === 'all') return data.all;
    return data[activeTab];
  };

  const handleArchive = async (noteId: string) => {
    await archiveNote(noteId);
    toast.success(t('common.archive'));
    refresh();
  };

  const loops = getLoopsForTab();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center tap-target flex-shrink-0"
          aria-label={t('common.back')}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold">{t('loops.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('loops.subtitle')}</p>
        </div>
      </header>

      {/* Tab bar */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide pb-1">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
              activeTab === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {t(`loops.${key}`)}
            {data && (
              <span className="ml-1 text-xs opacity-70">
                ({key === 'all' ? data.totalCount : data[key].length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Loop items */}
      <div className="flex-1 overflow-y-auto pb-20 md:pb-6 space-y-2 scrollbar-hide">
        {loops.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('loops.empty')}</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {loops.map((loop) => (
              <motion.div
                key={loop.note.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Category badge + days */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                        CATEGORY_COLORS[loop.category]
                      )}>
                        <span className={cn('w-1.5 h-1.5 rounded-full', CATEGORY_DOT_COLORS[loop.category])} />
                        {t(`loops.${loop.category}`)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('loops.daysAgo', { count: loop.daysSinceUpdate })}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-medium text-sm line-clamp-1">
                      {getDisplayTitle(loop.note.title, loop.note.body)}
                    </h4>

                    {/* Reason */}
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('loops.reason')}: {loop.reason}
                    </p>

                    {/* Open actions count */}
                    {loop.actionItems.filter(a => !a.isDone).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {loop.actionItems.filter(a => !a.isDone).length} open action(s)
                      </p>
                    )}
                  </div>

                  {/* Triage buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNoteSelect(loop.note.id)}
                      className="text-green-600 dark:text-green-400"
                      aria-label={t('loops.resolve')}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {}}
                      className="text-amber-600 dark:text-amber-400"
                      aria-label={t('loops.postpone')}
                    >
                      <Clock className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleArchive(loop.note.id)}
                      className="text-muted-foreground"
                      aria-label={t('loops.archive')}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
