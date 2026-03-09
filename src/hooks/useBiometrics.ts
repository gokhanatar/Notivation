import { useState, useEffect, useCallback, useRef } from 'react';
import { App } from '@capacitor/app';
import { isNative } from '@/lib/capacitor';
import { authenticateWithBiometrics } from '@/lib/native/biometrics';
import { getSettings, updateSettings } from '@/lib/db';

/**
 * Hook for vault note authentication.
 * On web, always succeeds immediately.
 */
export function useVaultAuth() {
  const authenticateForVault = useCallback(async (): Promise<boolean> => {
    return authenticateWithBiometrics('Authenticate to access vault note');
  }, []);

  return { authenticateForVault };
}

/**
 * Hook for app-level lock.
 * Tracks app state changes and locks the app after inactivity timeout.
 */
export function useAppLock() {
  const [isLocked, setIsLocked] = useState(false);
  const lockCheckDone = useRef(false);

  // Check lock state on mount
  useEffect(() => {
    if (lockCheckDone.current) return;
    lockCheckDone.current = true;

    async function checkLock() {
      const settings = await getSettings();
      if (!settings.appLockEnabled) return;

      const lastActive = new Date(settings.lastActiveAt).getTime();
      const timeout = settings.autoLockTimeout * 60 * 1000; // minutes → ms
      const elapsed = Date.now() - lastActive;

      if (elapsed >= timeout) {
        setIsLocked(true);
      }
    }
    checkLock();
  }, []);

  // Listen for app state changes (native only)
  useEffect(() => {
    if (!isNative) return;

    const listener = App.addListener('appStateChange', async ({ isActive }) => {
      const settings = await getSettings();
      if (!settings.appLockEnabled) return;

      if (!isActive) {
        // Going to background → save timestamp
        await updateSettings({ lastActiveAt: new Date() });
      } else {
        // Returning to foreground → check timeout
        const lastActive = new Date(settings.lastActiveAt).getTime();
        const timeout = settings.autoLockTimeout * 60 * 1000;
        const elapsed = Date.now() - lastActive;

        if (elapsed >= timeout) {
          setIsLocked(true);
        }
      }
    });

    return () => {
      listener.then(l => l.remove());
    };
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    const success = await authenticateWithBiometrics('Unlock Notivation');
    if (success) {
      setIsLocked(false);
      await updateSettings({ lastActiveAt: new Date() });
    }
    return success;
  }, []);

  return { isLocked, unlock };
}
