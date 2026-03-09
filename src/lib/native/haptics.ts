import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from '@/lib/capacitor';

export async function hapticLight(): Promise<void> {
  if (!isNative) return;
  try { await Haptics.impact({ style: ImpactStyle.Light }); } catch { /* native-only, safe to ignore */ }
}

export async function hapticMedium(): Promise<void> {
  if (!isNative) return;
  try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch { /* native-only, safe to ignore */ }
}

export async function hapticHeavy(): Promise<void> {
  if (!isNative) return;
  try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch { /* native-only, safe to ignore */ }
}

export async function hapticSuccess(): Promise<void> {
  if (!isNative) return;
  try { await Haptics.notification({ type: NotificationType.Success }); } catch { /* native-only, safe to ignore */ }
}

export async function hapticWarning(): Promise<void> {
  if (!isNative) return;
  try { await Haptics.notification({ type: NotificationType.Warning }); } catch { /* native-only, safe to ignore */ }
}

export async function hapticError(): Promise<void> {
  if (!isNative) return;
  try { await Haptics.notification({ type: NotificationType.Error }); } catch { /* native-only, safe to ignore */ }
}
