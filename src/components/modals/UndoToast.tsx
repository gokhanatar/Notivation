import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/useStore';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UndoToast() {
  const { undoAction, setUndoAction } = useUIStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (undoAction) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(() => setUndoAction(null), 300);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [undoAction, setUndoAction]);

  const handleUndo = () => {
    if (undoAction) {
      undoAction();
    }
    setIsVisible(false);
    setTimeout(() => setUndoAction(null), 300);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setUndoAction(null), 300);
  };

  return (
    <AnimatePresence>
      {isVisible && undoAction && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className={cn(
            'fixed bottom-20 md:bottom-6 left-4 right-4 z-40',
            'flex items-center justify-between gap-3',
            'bg-foreground text-background',
            'rounded-xl px-4 py-3 shadow-lg',
            'max-w-md mx-auto'
          )}
        >
          <span className="text-sm font-medium">Note archived</span>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              className="text-background hover:text-background hover:bg-background/20 font-semibold"
            >
              Undo
            </Button>
            <button
              onClick={handleDismiss}
              className="w-6 h-6 rounded-full hover:bg-background/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
