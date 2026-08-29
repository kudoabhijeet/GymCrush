import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * The store's job is to keep the stored preference and what's actually
 * scheduled with the OS in agreement. Each case here is a way they drifted
 * apart in review.
 */

const lib = vi.hoisted(() => ({
  scheduleDailyReminder: vi.fn(async () => undefined),
  cancelDailyReminder: vi.fn(async () => undefined),
  cancelRestNotification: vi.fn(async () => undefined),
  scheduleRestNotification: vi.fn(async () => undefined),
}));

vi.mock('@/lib/notifications', () => lib);

// Owned by this file rather than the shared setup so each test starts from a
// genuinely empty device: the store persists, so a leftover `dailyReminder:
// true` would rehydrate into the next test and reschedule behind its back.
const disk = vi.hoisted(() => new Map<string, string>());

vi.mock('@/lib/storage', () => ({
  kvStorage: {
    getItem: async (k: string) => disk.get(k) ?? null,
    setItem: async (k: string, v: string) => void disk.set(k, v),
    removeItem: async (k: string) => void disk.delete(k),
  },
}));

async function loadStore() {
  vi.resetModules();
  const { useNotificationStore } = await import('./notificationStore.js');
  // Persist rehydration is async — let it settle before asserting.
  await useNotificationStore.persist.rehydrate();
  return useNotificationStore;
}

beforeEach(() => {
  disk.clear();
  vi.clearAllMocks();
});

describe('defaults', () => {
  it('starts fully opted out', async () => {
    const store = await loadStore();
    const s = store.getState();
    expect(s.restTimer).toBe(false);
    expect(s.dailyReminder).toBe(false);
  });

  it('defaults the reminder to a plausible evening time', async () => {
    const store = await loadStore();
    const { reminderHour, reminderMinute } = store.getState();
    expect(reminderHour).toBeGreaterThanOrEqual(0);
    expect(reminderHour).toBeLessThanOrEqual(23);
    expect(reminderMinute).toBeGreaterThanOrEqual(0);
    expect(reminderMinute).toBeLessThanOrEqual(59);
  });
});

describe('rest timer preference', () => {
  it('cancels the in-flight alert when switched off mid-rest', async () => {
    const store = await loadStore();
    store.getState().setRestTimer(true);
    lib.cancelRestNotification.mockClear();

    store.getState().setRestTimer(false);

    expect(store.getState().restTimer).toBe(false);
    expect(lib.cancelRestNotification).toHaveBeenCalledTimes(1);
  });

  it('does not cancel anything when switched on', async () => {
    const store = await loadStore();
    store.getState().setRestTimer(true);
    expect(store.getState().restTimer).toBe(true);
    expect(lib.cancelRestNotification).not.toHaveBeenCalled();
  });
});

describe('daily reminder preference', () => {
  it('schedules at the stored time when enabled', async () => {
    const store = await loadStore();
    store.getState().setReminderTime(7, 30);
    lib.scheduleDailyReminder.mockClear();

    store.getState().setDailyReminder(true);

    expect(lib.scheduleDailyReminder).toHaveBeenCalledWith(7, 30);
  });

  it('cancels when disabled', async () => {
    const store = await loadStore();
    store.getState().setDailyReminder(true);
    store.getState().setDailyReminder(false);
    expect(lib.cancelDailyReminder).toHaveBeenCalled();
  });

  it('re-schedules when the time changes while enabled', async () => {
    const store = await loadStore();
    store.getState().setDailyReminder(true);
    lib.scheduleDailyReminder.mockClear();

    store.getState().setReminderTime(6, 15);

    expect(lib.scheduleDailyReminder).toHaveBeenCalledWith(6, 15);
    expect(store.getState().reminderHour).toBe(6);
    expect(store.getState().reminderMinute).toBe(15);
  });

  it('stores a new time without scheduling while disabled', async () => {
    const store = await loadStore();
    store.getState().setReminderTime(6, 15);

    expect(store.getState().reminderHour).toBe(6);
    expect(lib.scheduleDailyReminder).not.toHaveBeenCalled();
  });
});
