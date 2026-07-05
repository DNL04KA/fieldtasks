import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  DEMO_NOTIFICATION_SECONDS,
  NOTIFICATION_FALLBACK_SECONDS,
  NOTIFICATION_LEAD_MINUTES,
} from '../constants';
import type { Task } from '../types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export interface ScheduleResult {
  notificationId?: string;
  /** User-facing note when a fallback behavior was applied */
  note?: string;
}

async function ensurePermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('task-reminders', {
      name: 'Task reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Schedules a reminder 30 minutes before the due date.
 * Fallbacks (documented in README):
 * - due in less than 30 min → fire in NOTIFICATION_FALLBACK_SECONDS
 * - demo mode → fire in DEMO_NOTIFICATION_SECONDS regardless of due date
 * - due date already passed → nothing is scheduled
 */
export async function scheduleDueNotification(
  task: Pick<Task, 'id' | 'title' | 'dueDate'>,
  demoMode: boolean,
): Promise<ScheduleResult> {
  const granted = await ensurePermissions();
  if (!granted) {
    return { note: 'Notifications are disabled. Enable them in system settings to get reminders.' };
  }

  const dueMs = new Date(task.dueDate).getTime();
  let fireAt = dueMs - NOTIFICATION_LEAD_MINUTES * 60_000;
  let note: string | undefined;

  if (demoMode) {
    fireAt = Date.now() + DEMO_NOTIFICATION_SECONDS * 1000;
    note = `Demo mode: reminder will fire in ${DEMO_NOTIFICATION_SECONDS} seconds.`;
  } else if (dueMs <= Date.now()) {
    return { note: 'Due date is in the past — no reminder scheduled.' };
  } else if (fireAt <= Date.now()) {
    fireAt = Date.now() + NOTIFICATION_FALLBACK_SECONDS * 1000;
    note = 'Due in less than 30 minutes — reminder will fire right away.';
  }

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Upcoming task',
      body: `"${task.title}" is due at ${new Date(task.dueDate).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      data: { taskId: task.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: new Date(fireAt),
      channelId: 'task-reminders',
    },
  });

  return { notificationId, note };
}

export async function cancelNotification(notificationId?: string): Promise<void> {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    // A fired or already-cancelled notification is not an error for the caller
    console.warn('[notifications] cancel failed', error);
  }
}
