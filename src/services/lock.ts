import * as LocalAuthentication from 'expo-local-authentication';

/** True when the device supports biometric/PIN lock. */
export async function isLockAvailable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return hasHardware && enrolled;
}

/** Run the system lock prompt; resolves true when the user authenticates. */
export async function authenticate(reason: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    fallbackLabel: 'Use PIN',
    disableDeviceFallback: false,
  });
  return result.success;
}
