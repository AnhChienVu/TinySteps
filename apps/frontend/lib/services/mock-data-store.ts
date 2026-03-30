'use client';

import type {
  Child,
  Diaper,
  Feeding,
  Growth,
  Health,
  Invite,
  Milestone,
  Reminder,
  Routine,
  Sleep,
} from '@/types';

const STORAGE_KEY = 'tinysteps_mock_data_v1';

type ActivityCollections = {
  feedings: Record<string, Feeding[]>;
  sleeps: Record<string, Sleep[]>;
  diapers: Record<string, Diaper[]>;
  health: Record<string, Health[]>;
  growth: Record<string, Growth[]>;
  milestones: Record<string, Milestone[]>;
  reminders: Record<string, Reminder[]>;
  routines: Record<string, Routine[]>;
};

type MockDataStore = {
  children: Child[];
  invites: Invite[];
  activities: ActivityCollections;
};

const listeners = new Set<() => void>();
let storageListenerAttached = false;

function isBrowser() {
  return typeof window !== 'undefined';
}

function cloneEmptyStore() {
  return {
    children: [],
    invites: [],
    activities: {
      feedings: {},
      sleeps: {},
      diapers: {},
      health: {},
      growth: {},
      milestones: {},
      reminders: {},
      routines: {},
    },
  } satisfies MockDataStore;
}

function ensureStorageListener() {
  if (!isBrowser() || storageListenerAttached) {
    return;
  }

  window.addEventListener('storage', (event) => {
    if (event.key === STORAGE_KEY) {
      listeners.forEach((listener) => listener());
    }
  });

  storageListenerAttached = true;
}

export function readMockStore(): MockDataStore {
  if (!isBrowser()) {
    return cloneEmptyStore();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);

  if (!rawValue) {
    return cloneEmptyStore();
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<MockDataStore>;

    return {
      ...cloneEmptyStore(),
      ...parsedValue,
      activities: {
        ...cloneEmptyStore().activities,
        ...(parsedValue.activities ?? {}),
      },
    } as MockDataStore;
  } catch {
    return cloneEmptyStore();
  }
}

export function writeMockStore(updater: (current: MockDataStore) => MockDataStore) {
  if (!isBrowser()) {
    return;
  }

  const nextValue = updater(readMockStore());
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextValue));
  listeners.forEach((listener) => listener());
}

export function subscribeToMockStore(listener: () => void) {
  ensureStorageListener();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getChildActivityItems<T>(
  collectionName: keyof ActivityCollections,
  childId: string,
) {
  const store = readMockStore();
  return (store.activities[collectionName][childId] ?? []) as T[];
}

export function pushChildActivityItem<T extends { childId: string }>(
  collectionName: keyof ActivityCollections,
  item: T,
) {
  writeMockStore((current) => {
    const currentItems = current.activities[collectionName][item.childId] ?? [];

    return {
      ...current,
      activities: {
        ...current.activities,
        [collectionName]: {
          ...current.activities[collectionName],
          [item.childId]: [...currentItems, item],
        },
      },
    };
  });
}

export function replaceInvites(invites: Invite[]) {
  writeMockStore((current) => ({
    ...current,
    invites,
  }));
}

export function getInvites() {
  return readMockStore().invites;
}

export function getChildren() {
  return readMockStore().children;
}

export function replaceChildren(children: Child[]) {
  writeMockStore((current) => ({
    ...current,
    children,
  }));
}

export function removeChildRelatedMockData(childId: string) {
  writeMockStore((current) => {
    const nextActivities = Object.fromEntries(
      Object.entries(current.activities).map(([collectionName, itemsByChild]) => [
        collectionName,
        Object.fromEntries(
          Object.entries(itemsByChild).filter(([entryChildId]) => entryChildId !== childId),
        ),
      ]),
    ) as ActivityCollections;

    return {
      ...current,
      children: current.children.filter((child) => child.id !== childId),
      invites: current.invites.filter((invite) => invite.childId !== childId),
      activities: nextActivities,
    };
  });
}

export const mockDataBackendNote =
  'Mock client-side storage in use. Replace this service with NestJS API calls later.';
