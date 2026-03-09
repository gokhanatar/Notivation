import { useEffect } from 'react';
import { useUIStore } from '@/store/useStore';

interface KeyboardShortcutsOptions {
  onNewNote?: () => void;
  onBack?: () => void;
  onTogglePin?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onNewNote,
  onBack,
  onTogglePin,
  enabled = true,
}: KeyboardShortcutsOptions = {}) {
  const isPro = useUIStore((s) => s.isPro);

  useEffect(() => {
    if (!enabled || !isPro) return;

    // Only active on larger screens (iPad/desktop)
    if (window.innerWidth < 768) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;

      // Don't intercept shortcuts when typing in input/textarea
      const target = e.target as HTMLElement;
      const isTyping = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      if (isCmd) {
        switch (e.key.toLowerCase()) {
          case 'n':
            if (!isTyping) {
              e.preventDefault();
              onNewNote?.();
              useUIStore.getState().setActiveTab('inbox');
            }
            break;
          case 'f':
            e.preventDefault();
            useUIStore.getState().setActiveTab('search');
            break;
          case 'p':
            if (!isTyping) {
              e.preventDefault();
              onTogglePin?.();
            }
            break;
          case '1':
            e.preventDefault();
            useUIStore.getState().setActiveTab('inbox');
            break;
          case '2':
            e.preventDefault();
            useUIStore.getState().setActiveTab('actions');
            break;
          case '3':
            e.preventDefault();
            useUIStore.getState().setActiveTab('views');
            break;
          case '4':
            e.preventDefault();
            useUIStore.getState().setActiveTab('search');
            break;
          case '5':
            e.preventDefault();
            useUIStore.getState().setActiveTab('settings');
            break;
        }
      }

      // Escape to go back
      if (e.key === 'Escape' && !isTyping) {
        onBack?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, isPro, onNewNote, onBack, onTogglePin]);
}
