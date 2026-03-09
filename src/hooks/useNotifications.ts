import { useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from '@/lib/capacitor';
import { ensureNotificationPermission } from '@/lib/native/notifications';

/**
 * Listen for notification taps and navigate to the relevant note.
 * Call once at the app root level.
 */
export function useNotificationListener(onNoteSelect: (noteId: string) => void) {
  useEffect(() => {
    if (!isNative) return;

    // Request permission on mount
    ensureNotificationPermission();

    // Listen for notification action (tap)
    const listener = LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action) => {
        const noteId = action.notification.extra?.noteId;
        if (noteId) {
          onNoteSelect(noteId);
        }
      }
    );

    return () => {
      listener.then(l => l.remove());
    };
  }, [onNoteSelect]);
}
