import { motion, AnimatePresence } from 'framer-motion';
import { SearchScreen } from '@/screens/SearchScreen';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  onNoteSelect: (noteId: string) => void;
}

export function SearchOverlay({ open, onClose, onNoteSelect }: SearchOverlayProps) {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="hidden md:block fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 z-50 bg-background safe-top md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:shadow-lg md:border md:border-border md:max-w-3xl md:w-[calc(100%-2rem)] md:max-h-[85vh]"
        >
          <div className="flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border">
            <button
              onClick={onClose}
              className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center tap-target flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h2 className="text-lg font-semibold">{t('nav.search') || 'Search'}</h2>
          </div>
          <div className="px-4 md:px-6 pb-20 md:pb-6 h-[calc(100vh-80px)] md:h-auto md:max-h-[calc(85vh-80px)] overflow-y-auto">
            <SearchScreen onNoteSelect={(id) => { onClose(); onNoteSelect(id); }} />
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
