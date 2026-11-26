import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import { Platform } from 'react-native';

// Local-only notifications (ADR-0002): budget alerts, daily reminder, recurring posted.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensurePermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function scheduleNotification(opts: {
  id: string;
  title: string;
  body: string;
  /** trigger: Date for one-shot, or { hour, minute } for daily repeating */
  trigger: Date | { hour: number; minute: number };
}): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(opts.id).catch(() => {});
  const trigger: Notifications.NotificationTriggerInput = opts.trigger instanceof Date
    ? { type: Notifications.SchedulableTriggerInputTypes.DATE, date: opts.trigger }
    : { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: opts.trigger.hour, minute: opts.trigger.minute };
  await Notifications.scheduleNotificationAsync({
    identifier: opts.id,
    content: { title: opts.title, body: opts.body, sound: false },
    trigger,
  });
}

export async function cancelNotification(id: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
}

export function androidChannelSetup(): void {
  if (Platform.OS === 'android') {
    void Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: AndroidImportance.DEFAULT,
    });
  }
}
