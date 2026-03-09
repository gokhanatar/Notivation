import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { db, updateNote, deleteNote, type Note } from '@/lib/db';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/notes/TypeBadge';
import { getDisplayTitle } from '@/lib/utils/autoTitle';
import { hapticLight } from '@/lib/native/haptics';
import {
  ArrowLeft,
  ArchiveRestore,
  Trash2,
  Archive,
  AlertCircle
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ArchiveScreenProps {
  onBack: () => void;
  onNoteSelect?: (noteId: string) => void;
}

interface MonthGroup {
  label: string;
  notes: Note[];
}

export function ArchiveScreen({ onBack, onNoteSelect }: ArchiveScreenProps) {
  const { t } = useTranslation();
  const [archivedNotes, setArchivedNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadArchived = async () => {
    const notes = await db.notes.filter((n) => n.archived).toArray();
    setArchivedNotes(
      notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    );
    setLoading(false);
  };

  useEffect(() => {
    loadArchived();
  }, []);

  const monthGroups = useMemo<MonthGroup[]>(() => {
    const groups: Map<string, Note[]> = new Map();

    archivedNotes.forEach((note) => {
      const monthKey = format(startOfMonth(new Date(note.updatedAt)), 'yyyy-MM');
      const monthLabel = format(new Date(note.updatedAt), 'MMMM yyyy');

      if (!groups.has(monthKey)) {
        groups.set(monthKey, []);
      }
      groups.get(monthKey)!.push(note);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, notes]) => ({
        label: format(new Date(notes[0].updatedAt), 'MMMM yyyy'),
        notes,
      }));
  }, [archivedNotes]);

  const handleRestore = async (noteId: string) => {
    hapticLight();
    await updateNote(noteId, { archived: false });
    setArchivedNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success(t('archive.restored'));
  };

  const handlePermanentDelete = async () => {
    if (!deleteConfirmId) return;
    hapticLight();
    await deleteNote(deleteConfirmId);
    setArchivedNotes((prev) => prev.filter((n) => n.id !== deleteConfirmId));
    setDeleteConfirmId(null);
    toast.success(t('archive.deleted'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-3 mb-4">
        <button onClick={onBack} className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center tap-target flex-shrink-0" aria-label={t('common.back')}>
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <div>
          <h1 className="text-lg font-bold">{t('archive.title')}</h1>
          <p className="text-sm text-muted-foreground">
            {t('archive.count', { count: archivedNotes.length })}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-20 md:pb-6 space-y-6 scrollbar-hide">
        {archivedNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Archive className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t('archive.empty')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('archive.emptyDesc')}</p>
          </div>
        ) : (
          monthGroups.map((group) => (
            <section key={group.label}>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
                {group.label}
              </h3>
              <div className="space-y-2">
                <AnimatePresence mode="popLayout">
                  {group.notes.map((note) => (
                    <motion.div
                      key={note.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-4 rounded-xl bg-card border border-border"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <TypeBadge type={note.type} size="sm" />
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(note.updatedAt), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-1">
                            {getDisplayTitle(note.title, note.body)}
                          </h4>
                          {note.body && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                              {note.body.slice(0, 100)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestore(note.id)}
                            className="text-primary"
                            aria-label={t('archive.restore')}
                          >
                            <ArchiveRestore className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(note.id)}
                            className="text-destructive"
                            aria-label={t('archive.permanentDelete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </section>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('archive.deleteConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('archive.deleteConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handlePermanentDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
