import { useEffect } from 'react';
import { isNative } from '@/lib/capacitor';
import { useUIStore } from '@/store/useStore';

interface DeepLinkHandlers {
  onNewNote?: () => void;
  onSearch?: () => void;
  onNoteSelect?: (noteId: string) => void;
}

export function useDeepLinks({ onNewNote, onSearch, onNoteSelect }: DeepLinkHandlers = {}) {
  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    async function setupListener() {
      try {
        const { App } = await import('@capacitor/app');

        const listener = await App.addListener('appUrlOpen', (event) => {
          const url = event.url;

          // Handle mindfulnotes:// URL scheme
          if (url.includes('new-note') || url.includes('quick-note')) {
            onNewNote?.();
            useUIStore.getState().setActiveTab('inbox');
          } else if (url.includes('search')) {
            onSearch?.();
            useUIStore.getState().setActiveTab('search');
          } else if (url.includes('today') || url.includes('actions')) {
            useUIStore.getState().setActiveTab('actions');
          } else if (url.includes('note/')) {
            const noteId = url.split('note/').pop();
            if (noteId) {
              onNoteSelect?.(noteId);
            }
          }
        });

        cleanup = () => listener.remove();
      } catch (e) {
        console.warn('Deep link setup failed:', e);
      }
    }

    setupListener();
    return () => cleanup?.();
  }, [onNewNote, onSearch, onNoteSelect]);
}
