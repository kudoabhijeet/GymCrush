import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { BRAND } from './theme';

const REST_CHANNEL = 'rest-timer';
const REMINDER_CHANNEL = 'workout-reminder';

/**
 * Rest-done delivered while the logger is open is redundant — the on-screen
 * timer and the rest-done haptic already fired. Only the reminder, which is
 * meant to pull the user back in, is worth a banner in the foreground.
 */
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const isReminder = notification.request.content.data?.kind === 'reminder';
    return {
      shouldShowBanner: isReminder,
      shouldShowList: isReminder,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

async function ensureChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(REST_CHANNEL, {
    name: 'Rest timer',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 200, 100, 200],
    lightColor: BRAND,
  });
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
    name: 'Workout reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: BRAND,
  });
}

/** Returns whether we're allowed to post notifications, prompting at most once. */
export async function requestNotificationPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted' && existing.canAskAgain) {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status === 'granted') await ensureChannels();
  return status === 'granted';
}

export async function hasNotificationPermission(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).status === 'granted';
}

/* ------------------------------ Scheduling -------------------------------- */

/**
 * Both notifications use fixed ids rather than the one `scheduleNotificationAsync`
 * hands back: an id held in memory is lost when the process is killed, which
 * would leave a scheduled alert that nothing can cancel.
 */
const REST_IDENTIFIER = 'gc.rest-timer';
const REMINDER_IDENTIFIER = 'gc.workout-reminder';

/**
 * Every schedule/cancel runs one at a time, in call order.
 *
 * Each operation awaits a permission check and a native call, and letting those
 * interleave lets a stale one clobber a fresh one: a skip cancelling nothing
 * because the schedule it meant to stop had not landed yet, or a finished
 * schedule deleting the newer schedule that replaced it. Since both operations
 * key off a shared identifier, ordering is the only thing that makes
 * last-call-wins true.
 */
let queue: Promise<unknown> = Promise.resolve();

function serialize(op: () => Promise<void>): Promise<void> {
  const run = queue.then(op, op);
  // Keep the chain alive if one operation rejects.
  queue = run.catch(() => undefined);
  return run;
}

/**
 * `channelId` belongs on the trigger, not on `content` — the content input has
 * no such field, so putting it there silently drops the alert onto Android's
 * default channel and loses the heads-up banner.
 */
const androidChannel = (id: string) => (Platform.OS === 'android' ? { channelId: id } : {});

/* -------------------------------- Rest timer ------------------------------ */

export function cancelRestNotification(): Promise<void> {
  return serialize(async () => {
    await Notifications.cancelScheduledNotificationAsync(REST_IDENTIFIER);
  });
}

export function scheduleRestNotification(seconds: number): Promise<void> {
  return serialize(async () => {
    // A trigger under a second fires immediately on iOS rather than not at all.
    if (seconds < 1) return;
    if (!(await hasNotificationPermission())) return;
    await ensureChannels();
    await Notifications.scheduleNotificationAsync({
      identifier: REST_IDENTIFIER,
      content: {
        title: 'Rest complete',
        body: 'Next set is ready.',
        data: { kind: 'rest' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds,
        repeats: false,
        ...androidChannel(REST_CHANNEL),
      },
    });
  });
}

/* ----------------------------- Daily reminder ----------------------------- */

export function cancelDailyReminder(): Promise<void> {
  return serialize(async () => {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
  });
}

export function scheduleDailyReminder(hour: number, minute: number): Promise<void> {
  return serialize(async () => {
    if (!(await hasNotificationPermission())) {
      // The stored pref may still say on; leave nothing armed behind it.
      await Notifications.cancelScheduledNotificationAsync(REMINDER_IDENTIFIER);
      return;
    }
    await ensureChannels();
    await Notifications.scheduleNotificationAsync({
      identifier: REMINDER_IDENTIFIER,
      content: {
        title: 'Time to train',
        body: "Keep the streak alive — today's workout is waiting.",
        data: { kind: 'reminder' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
        ...androidChannel(REMINDER_CHANNEL),
      },
    });
  });
}
