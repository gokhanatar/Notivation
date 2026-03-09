import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/i18n';
import { db, type NoteVersion } from '@/lib/db';
import { format } from 'date-fns';
import { X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { hapticSuccess } from '@/lib/native/haptics';

interface VersionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  noteId: string;
  onRestore: (title: string, body: string) => void;
}

export function VersionHistoryModal({ open, onClose, noteId, onRestore }: VersionHistoryModalProps) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [selected, setSelected] = useState<NoteVersion | null>(null);

  useEffect(() => {
    if (!open || !noteId) return;
    db.noteVersions
      .where('noteId')
      .equals(noteId)
      .reverse()
      .sortBy('timestamp')
      .then(v => setVersions(v.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())));
  }, [open, noteId]);

  if (!open) return null;

  const handleRestore = (v: NoteVersion) => {
    onRestore(v.title, v.body);
    hapticSuccess();
    toast.success(t('version.restored'));
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-t-2xl w-full max-w-lg max-h-[70vh] overflow-hidden"
        >
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h3 className="font-semibold text-lg">{t('version.title')}</h3>
            <button onClick={onClose} className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center tap-target" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
            {versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('version.noVersions')}
              </p>
            ) : (
              versions.map((v) => (
                <div
                  key={v.id}
                  className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                    selected?.id === v.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                  onClick={() => setSelected(selected?.id === v.id ? null : v)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{v.title || t('version.untitled')}</span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(v.timestamp), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{v.body.slice(0, 150)}</p>

                  {selected?.id === v.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={(e) => { e.stopPropagation(); handleRestore(v); }}
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      {t('version.restore')}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export async function saveNoteVersion(noteId: string, title: string, body: string) {
  const recent = await db.noteVersions
    .where('noteId')
    .equals(noteId)
    .reverse()
    .sortBy('timestamp');

  const sorted = recent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  // Don't save if same as last version
  if (sorted.length > 0 && sorted[0].title === title && sorted[0].body === body) return;

  await db.noteVersions.add({
    id: crypto.randomUUID(),
    noteId,
    title,
    body,
    timestamp: new Date(),
  });

  // Keep max 50 versions per note
  if (sorted.length >= 50) {
    const toDelete = sorted.slice(49);
    await db.noteVersions.bulkDelete(toDelete.map(v => v.id));
  }
}
