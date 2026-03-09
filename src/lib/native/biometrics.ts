import {
  BiometricAuth,
  BiometryType,
} from '@aparajita/capacitor-biometric-auth';
import { isNative } from '@/lib/capacitor';

export interface BiometricAvailability {
  available: boolean;
  biometryType: BiometryType;
}

/**
 * Check if biometric authentication is available on the device.
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  if (!isNative) {
    return { available: false, biometryType: BiometryType.none };
  }

  try {
    await BiometricAuth.checkBiometry();
    const result = await BiometricAuth.checkBiometry();
    return {
      available: result.isAvailable,
      biometryType: result.biometryType,
    };
  } catch {
    return { available: false, biometryType: BiometryType.none };
  }
}

/**
 * Authenticate with Face ID / Touch ID.
 * Falls back to device passcode if biometrics are unavailable.
 * On web/dev, always returns true.
 */
export async function authenticateWithBiometrics(
  reason: string = 'Please authenticate'
): Promise<boolean> {
  if (!isNative) return true;

  try {
    await BiometricAuth.authenticate({
      reason,
      allowDeviceCredential: true,
    });
    return true;
  } catch {
    return false;
  }
}
