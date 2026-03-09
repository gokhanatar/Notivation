import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';
import { type Note } from '@/lib/db';
import { Dna, Clock, Edit3, Gauge, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface NoteDNAProps {
  note: Note;
}

export function NoteDNA({ note }: NoteDNAProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const writingDuration = note.writingDurationMs || 0;
  const editCount = note.editCount || 0;
  const speed = note.writingSpeed || 'normal';

  const formatDuration = (ms: number) => {
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
    return `${Math.round(ms / 3600000)}h ${Math.round((ms % 3600000) / 60000)}m`;
  };

  const speedConfig = {
    fast: { color: 'text-orange-500', bg: 'bg-orange-500/10', label: t('dna.fast') },
    slow: { color: 'text-blue-500', bg: 'bg-blue-500/10', label: t('dna.slow') },
    normal: { color: 'text-green-500', bg: 'bg-green-500/10', label: t('dna.normal') },
  };

  const speedInfo = speedConfig[speed];

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <Dna className="w-3.5 h-3.5" />
        <span className="font-medium">{t('dna.title')}</span>
        {isOpen ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-2 pt-2">
              {/* Writing Duration */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('dna.writingTime')}</p>
                  <p className="text-sm font-medium">
                    {writingDuration > 0 ? formatDuration(writingDuration) : '-'}
                  </p>
                </div>
              </div>

              {/* Edit Count */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('dna.edits')}</p>
                  <p className="text-sm font-medium">{editCount}</p>
                </div>
              </div>

              {/* Writing Speed */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('dna.speed')}</p>
                  <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', speedInfo.bg, speedInfo.color)}>
                    {speedInfo.label}
                  </span>
                </div>
              </div>

              {/* Created At */}
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">{t('dna.created')}</p>
                  <p className="text-sm font-medium">
                    {format(new Date(note.createdAt), 'MMM d')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
