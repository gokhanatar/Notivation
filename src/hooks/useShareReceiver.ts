import { useEffect, useState } from 'react';
import { isNative } from '@/lib/capacitor';

export interface SharedContent {
  text?: string;
  url?: string;
  title?: string;
}

export function useShareReceiver() {
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);

  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | undefined;

    async function setupListener() {
      try {
        const { App } = await import('@capacitor/app');

        // Check for shared content on resume
        const listener = await App.addListener('appStateChange', async (state) => {
          if (state.isActive) {
            // Check shared UserDefaults (iOS) or Intent extras (Android)
            // This is handled by the native side pushing data to the web view
            checkForSharedContent();
          }
        });

        cleanup = () => listener.remove();
      } catch (e) {
        console.warn('Share receiver setup failed:', e);
      }
    }

    function checkForSharedContent() {
      // Check if native side has passed shared content via window
      const shared = (window as any).__SHARED_CONTENT__;
      if (shared) {
        setSharedContent(shared);
        delete (window as any).__SHARED_CONTENT__;
      }
    }

    // Check on mount
    checkForSharedContent();
    setupListener();

    return () => cleanup?.();
  }, []);

  const clearSharedContent = () => setSharedContent(null);

  return { sharedContent, clearSharedContent };
}
