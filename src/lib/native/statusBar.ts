import { StatusBar, Style } from '@capacitor/status-bar';
import { isNative } from '@/lib/capacitor';
import type { AppSettings } from '@/lib/db';

const darkThemes: AppSettings['theme'][] = ['dark', 'oled', 'ocean', 'forest', 'sunset'];

export async function updateStatusBarForTheme(theme: AppSettings['theme']): Promise<void> {
  if (!isNative) return;

  try {
    const isDark = darkThemes.includes(theme);
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
  } catch (e) {
    console.warn('StatusBar update failed:', e);
  }
}
