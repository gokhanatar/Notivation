import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useNotes } from '@/hooks/useNotes';
import { useTranslation } from '@/lib/i18n';
import { PageHeader } from '@/components/layout/PageHeader';
import { NoteCard } from '@/components/notes/NoteCard';
import { QuickDecision } from '@/components/decisions/QuickDecision';
import { CalibrationCard } from '@/components/decisions/CalibrationCard';
import { Scale, Zap, History, Target } from 'lucide-react';

interface DecideScreenProps {
  onNoteSelect: (noteId: string) => void;
}

export function DecideScreen({ onNoteSelect }: DecideScreenProps) {
  const notes = useNotes();
  const { t } = useTranslation();

  // Show notes that are decisions or questions, not archived
  const decisionNotes = useMemo(() => {
    return notes
      .filter(n => !n.archived && !n.vault && (n.type === 'decision' || n.type === 'question'))
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes]);

  const openDecisions = decisionNotes.filter(n => (n.lifecycleStage || 'decision') !== 'outcome');
  const resolvedDecisions = decisionNotes.filter(n => (n.lifecycleStage || 'decision') === 'outcome');

  // Recent open decisions for quick decision cards (max 3)
  const quickDecisionNotes = openDecisions.slice(0, 3);

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('type.decision')}
        subtitle={`${openDecisions.length} ${t('decide.open') || 'open'}`}
      />

      <div className="flex-1 overflow-y-auto -mx-4 px-4 md:-mx-0 md:px-0 pb-20 md:pb-6 space-y-6 scrollbar-hide">
        {/* Quick Decisions */}
        {quickDecisionNotes.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Zap className="w-4 h-4" />
              {t('decide.quickDecisions')}
            </h2>
            <AnimatePresence mode="popLayout">
              {quickDecisionNotes.map((note) => (
                <QuickDecision
                  key={note.id}
                  note={note}
                  onNoteSelect={onNoteSelect}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Open Decisions */}
        {openDecisions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Scale className="w-4 h-4" />
              {t('decide.openDecisions')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {openDecisions.map((note) => (
                <NoteCard key={note.id} note={note} onClick={() => onNoteSelect(note.id)} />
              ))}
            </AnimatePresence>
            </div>
          </div>
        )}

        {/* Resolved */}
        {resolvedDecisions.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <History className="w-4 h-4" />
              {t('decide.resolved')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
              {resolvedDecisions.map((note) => (
                <NoteCard key={note.id} note={note} onClick={() => onNoteSelect(note.id)} />
              ))}
            </AnimatePresence>
            </div>
          </div>
        )}

        {/* Confidence Calibration */}
        <CalibrationCard />

        {/* Empty state */}
        {decisionNotes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Scale className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('decide.empty')}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t('decide.emptyDesc')}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
