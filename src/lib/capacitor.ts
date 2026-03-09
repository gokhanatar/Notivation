import { Capacitor } from '@capacitor/core';

export const isNative = Capacitor.isNativePlatform();
export const isIOS = Capacitor.getPlatform() === 'ios';
export const isAndroid = Capacitor.getPlatform() === 'android';
export const isWeb = Capacitor.getPlatform() === 'web';

/**
 * Run a callback only on native platforms.
 * Silently skips on web.
 */
export async function runNative<T>(fn: () => Promise<T>): Promise<T | undefined> {
  if (!isNative) return undefined;
  return fn();
}
