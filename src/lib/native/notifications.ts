import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative } from '@/lib/capacitor';

/**
 * Ensure notification permission is granted.
 * Returns true if permission is available.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  if (!isNative) return false;

  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return true;
    if (display === 'denied') return false;

    const result = await LocalNotifications.requestPermissions();
    return result.display === 'granted';
  } catch {
    return false;
  }
}

/**
 * Generate a stable numeric ID from a string ID (note/action item UUID).
 * LocalNotifications requires numeric IDs.
 */
function hashStringToId(str: string, prefix: number = 0): number {
  let hash = prefix;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Schedule a notification for a note's due date.
 * Fires at 09:00 on the due date.
 * Skips if: not native, vault note, past date.
 */
export async function scheduleNoteDueNotification(
  noteId: string,
  title: string,
  dueDate: Date,
  isVault: boolean
): Promise<void> {
  if (!isNative || isVault) return;

  const scheduleAt = new Date(dueDate);
  scheduleAt.setHours(9, 0, 0, 0);

  // Don't schedule for past dates
  if (scheduleAt.getTime() <= Date.now()) return;

  const id = hashStringToId(noteId, 1);

  try {
    // Cancel existing notification first
    await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {});

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: 'Notivation',
          body: title || 'You have a note due today',
          schedule: { at: scheduleAt },
          extra: { noteId, type: 'note' },
        },
      ],
    });
  } catch (e) {
    console.warn('Failed to schedule note notification:', e);
  }
}

/**
 * Schedule a notification for an action item's due date.
 * Fires at 09:00 on the due date.
 */
export async function scheduleActionItemNotification(
  actionItemId: string,
  noteId: string,
  text: string,
  dueDate: Date
): Promise<void> {
  if (!isNative) return;

  const scheduleAt = new Date(dueDate);
  scheduleAt.setHours(9, 0, 0, 0);

  if (scheduleAt.getTime() <= Date.now()) return;

  const id = hashStringToId(actionItemId, 2);

  try {
    await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {});

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: 'Notivation',
          body: text || 'You have an action item due today',
          schedule: { at: scheduleAt },
          extra: { noteId, actionItemId, type: 'actionItem' },
        },
      ],
    });
  } catch (e) {
    console.warn('Failed to schedule action item notification:', e);
  }
}

/**
 * Cancel a note's due date notification.
 */
export async function cancelNoteNotification(noteId: string): Promise<void> {
  if (!isNative) return;

  try {
    const id = hashStringToId(noteId, 1);
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {
    // ignore
  }
}

/**
 * Cancel an action item's notification.
 */
export async function cancelActionItemNotification(actionItemId: string): Promise<void> {
  if (!isNative) return;

  try {
    const id = hashStringToId(actionItemId, 2);
    await LocalNotifications.cancel({ notifications: [{ id }] });
  } catch {
    // ignore
  }
}

/**
 * Schedule a daily summary notification at 08:00.
 * Shows "You have X tasks today" message.
 */
export async function scheduleDailySummaryNotification(taskCount: number): Promise<void> {
  if (!isNative) return;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return;

  const DAILY_SUMMARY_ID = 999999;

  try {
    // Cancel existing daily summary
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_SUMMARY_ID }] }).catch(() => {});

    // Schedule for tomorrow at 08:00
    const scheduleAt = new Date();
    scheduleAt.setDate(scheduleAt.getDate() + 1);
    scheduleAt.setHours(8, 0, 0, 0);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: DAILY_SUMMARY_ID,
          title: 'Notivation',
          body: taskCount > 0
            ? `You have ${taskCount} task${taskCount > 1 ? 's' : ''} today`
            : 'Start your day with a fresh note!',
          schedule: {
            at: scheduleAt,
            every: 'day',
          },
          extra: { type: 'dailySummary' },
        },
      ],
    });
  } catch (e) {
    console.warn('Failed to schedule daily summary:', e);
  }
}

/**
 * Schedule a follow-up reminder notification for a specific note.
 * Fires at 09:00 on the reminder date.
 */
export async function scheduleFollowUpReminder(
  noteId: string,
  title: string,
  reminderDate: Date
): Promise<void> {
  if (!isNative) return;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return;

  const scheduleAt = new Date(reminderDate);
  scheduleAt.setHours(9, 0, 0, 0);

  if (scheduleAt.getTime() <= Date.now()) return;

  const id = hashStringToId(noteId, 3); // prefix 3 for follow-up reminders

  try {
    await LocalNotifications.cancel({ notifications: [{ id }] }).catch(() => {});

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: 'Notivation - Reminder',
          body: title || 'You have a follow-up reminder',
          schedule: { at: scheduleAt },
          extra: { noteId, type: 'followUpReminder' },
        },
      ],
    });
  } catch (e) {
    console.warn('Failed to schedule follow-up reminder:', e);
  }
}

/**
 * Snooze a notification by rescheduling it.
 * Duration in minutes.
 */
export async function snoozeNotification(
  noteId: string,
  title: string,
  durationMinutes: number
): Promise<void> {
  if (!isNative) return;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return;

  const scheduleAt = new Date(Date.now() + durationMinutes * 60 * 1000);
  const id = hashStringToId(noteId, 4); // prefix 4 for snoozed

  try {
    // Cancel original notification
    await LocalNotifications.cancel({
      notifications: [
        { id: hashStringToId(noteId, 1) },
        { id: hashStringToId(noteId, 3) },
      ]
    }).catch(() => {});

    await LocalNotifications.schedule({
      notifications: [
        {
          id,
          title: 'Notivation - Snoozed Reminder',
          body: title || 'Snoozed reminder',
          schedule: { at: scheduleAt },
          extra: { noteId, type: 'snoozed' },
        },
      ],
    });
  } catch (e) {
    console.warn('Failed to snooze notification:', e);
  }
}
