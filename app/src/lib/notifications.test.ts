import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Covers the rest-notification scheduling lifecycle. Every case here maps to a
 * defect found in review: an alert surviving a process kill, an alert winning a
 * race against the skip that should have cancelled it, and a permission check
 * that has to gate scheduling.
 *
 * The fake below models the one property that matters and that a naive mock
 * would miss: the OS keeps schedules in its own store, keyed by identifier,
 * with no memory of the JS module that created them.
 */

interface Scheduled {
  identifier: string;
  seconds: number;
}

const os = {
  scheduled: new Map<string, Scheduled>(),
  granted: true,
  canAskAgain: true,
  /** When set, scheduleNotificationAsync blocks on it — models a slow native call. */
  gate: null as null | Promise<void>,
};

vi.mock('expo-notifications', () => ({
  setNotificationHandler: vi.fn(),
  setNotificationChannelAsync: vi.fn(async () => undefined),
  AndroidImportance: { HIGH: 4, DEFAULT: 3 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval', DAILY: 'daily' },
  getPermissionsAsync: vi.fn(async () => ({
    status: os.granted ? 'granted' : 'denied',
    canAskAgain: os.canAskAgain,
  })),
  requestPermissionsAsync: vi.fn(async () => ({
    status: os.granted ? 'granted' : 'denied',
  })),
  scheduleNotificationAsync: vi.fn(async (req: Record<string, any>) => {
    if (os.gate) await os.gate;
    const identifier = req.identifier ?? `auto_${Math.random()}`;
    os.scheduled.set(identifier, { identifier, seconds: req.trigger?.seconds ?? 0 });
    return identifier;
  }),
  cancelScheduledNotificationAsync: vi.fn(async (id: string) => {
    os.scheduled.delete(id);
  }),
}));

const REST_ID = 'gc.rest-timer';

async function loadModule() {
  vi.resetModules();
  return import('./notifications.js');
}

beforeEach(() => {
  os.scheduled.clear();
  os.granted = true;
  os.canAskAgain = true;
  os.gate = null;
  vi.clearAllMocks();
});

describe('scheduleRestNotification', () => {
  it('schedules under a fixed identifier so it survives a module reload', async () => {
    const m = await loadModule();
    await m.scheduleRestNotification(120);
    expect([...os.scheduled.keys()]).toEqual([REST_ID]);
    expect(os.scheduled.get(REST_ID)!.seconds).toBe(120);
  });

  it('does nothing without permission', async () => {
    os.granted = false;
    const m = await loadModule();
    await m.scheduleRestNotification(120);
    expect(os.scheduled.size).toBe(0);
  });

  it('ignores a sub-second rest, which would fire immediately on iOS', async () => {
    const m = await loadModule();
    await m.scheduleRestNotification(0);
    expect(os.scheduled.size).toBe(0);
  });

  it('replaces rather than stacks when a second set is completed', async () => {
    const m = await loadModule();
    await m.scheduleRestNotification(120);
    await m.scheduleRestNotification(90);
    expect(os.scheduled.size).toBe(1);
    expect(os.scheduled.get(REST_ID)!.seconds).toBe(90);
  });
});

describe('cancelRestNotification', () => {
  it('removes a scheduled alert', async () => {
    const m = await loadModule();
    await m.scheduleRestNotification(120);
    await m.cancelRestNotification();
    expect(os.scheduled.size).toBe(0);
  });

  it('cancels an alert scheduled before a process kill', async () => {
    // The kill: the OS keeps its schedule, the JS module starts from scratch.
    const first = await loadModule();
    await first.scheduleRestNotification(180);
    expect(os.scheduled.size).toBe(1);

    const afterRelaunch = await loadModule();
    await afterRelaunch.cancelRestNotification();

    expect(os.scheduled.size).toBe(0);
  });

  it('is safe when nothing is scheduled', async () => {
    const m = await loadModule();
    await expect(m.cancelRestNotification()).resolves.toBeUndefined();
  });
});

describe('skip landing mid-schedule', () => {
  it('leaves nothing scheduled when a cancel is issued while scheduling is slow', async () => {
    const m = await loadModule();
    // Hold the native schedule call open, so the skip is issued before it lands.
    let release!: () => void;
    os.gate = new Promise<void>((resolve) => (release = resolve));

    const scheduling = m.scheduleRestNotification(120);
    const cancelling = m.cancelRestNotification();

    release();
    os.gate = null;
    await Promise.all([scheduling, cancelling]);

    expect(os.scheduled.size).toBe(0);
  });

  it('still schedules normally when no cancel interleaves', async () => {
    const m = await loadModule();
    await m.scheduleRestNotification(120);
    expect(os.scheduled.size).toBe(1);
  });

  it('keeps the newest rest period when a skip is followed by another set', async () => {
    // skip(120) -> cancel -> schedule(90), all overlapping. The 90s alert is the
    // live one and must survive: an earlier call resolving late must not delete
    // the schedule that replaced it under the shared identifier.
    const m = await loadModule();
    const first = m.scheduleRestNotification(120);
    const cancelled = m.cancelRestNotification();
    const second = m.scheduleRestNotification(90);
    await Promise.all([first, cancelled, second]);

    expect(os.scheduled.size).toBe(1);
    expect(os.scheduled.get(REST_ID)!.seconds).toBe(90);
  });

  it('applies operations in call order regardless of resolution timing', async () => {
    const m = await loadModule();
    const scheduling = m.scheduleRestNotification(120);
    const cancelling = m.cancelRestNotification();
    await Promise.all([scheduling, cancelling]);

    // The cancel was called last, so nothing may remain armed.
    expect(os.scheduled.size).toBe(0);
  });
});

describe('requestNotificationPermission', () => {
  it('returns true when already granted', async () => {
    const m = await loadModule();
    await expect(m.requestNotificationPermission()).resolves.toBe(true);
  });

  it('returns false and does not prompt when permanently denied', async () => {
    os.granted = false;
    os.canAskAgain = false;
    const m = await loadModule();
    const notifications = await import('expo-notifications');

    await expect(m.requestNotificationPermission()).resolves.toBe(false);
    expect(notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('prompts when permission has not been decided yet', async () => {
    os.granted = false;
    os.canAskAgain = true;
    const m = await loadModule();
    const notifications = await import('expo-notifications');

    await m.requestNotificationPermission();
    expect(notifications.requestPermissionsAsync).toHaveBeenCalled();
  });
});

describe('daily reminder', () => {
  it('schedules under a stable identifier so re-arming replaces it', async () => {
    const m = await loadModule();
    await m.scheduleDailyReminder(18, 0);
    await m.scheduleDailyReminder(7, 30);
    expect(os.scheduled.size).toBe(1);
  });

  it('is cancellable after a relaunch', async () => {
    const first = await loadModule();
    await first.scheduleDailyReminder(18, 0);

    const afterRelaunch = await loadModule();
    await afterRelaunch.cancelDailyReminder();
    expect(os.scheduled.size).toBe(0);
  });

  it('does not schedule without permission', async () => {
    os.granted = false;
    const m = await loadModule();
    await m.scheduleDailyReminder(18, 0);
    expect(os.scheduled.size).toBe(0);
  });

  it('is independent of the rest alert', async () => {
    const m = await loadModule();
    await m.scheduleDailyReminder(18, 0);
    await m.scheduleRestNotification(120);
    expect(os.scheduled.size).toBe(2);

    await m.cancelRestNotification();
    expect(os.scheduled.size).toBe(1);
  });
});
