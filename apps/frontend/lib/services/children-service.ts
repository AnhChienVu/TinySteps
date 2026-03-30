import type {
  Child,
  Diaper,
  Feeding,
  Growth,
  Health,
  Milestone,
  Reminder,
  Routine,
  Sleep,
} from '@/types';
import { fetchBackend } from '@/lib/services/backend-client';
import {
  getChildActivityItems,
  mockDataBackendNote,
  subscribeToMockStore,
} from '@/lib/services/mock-data-store';

export type CreateChildInput = {
  name: FormDataEntryValue | null;
  birthDate: FormDataEntryValue | null;
  notes: FormDataEntryValue | null;
};

export type CreateFeedingInput = {
  id: string;
  childId: string;
  timestamp: string;
  type: string;
  amount?: number;
  unit?: string;
  notes?: string;
  loggedBy: string;
};

export type CreateSleepInput = {
  id: string;
  childId: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  loggedBy: string;
};

export type CreateDiaperInput = {
  id: string;
  childId: string;
  timestamp: string;
  type: string;
  notes?: string;
  loggedBy: string;
};

export type CreateHealthInput = {
  id: string;
  childId: string;
  timestamp: string;
  type: string;
  title: string;
  notes?: string;
  loggedBy: string;
};

type BackendChild = {
  id: string;
  name: string;
  birthDate: string;
  photo?: string;
  notes?: string;
  caregivers: string[];
  ownerId: string;
};

type BackendFeeding = {
  id: string;
  childId: string;
  timestamp: string;
  type: Feeding['type'];
  amount?: number;
  unit?: string;
  notes?: string;
  loggedBy: string;
};

type BackendSleep = {
  id: string;
  childId: string;
  startTime: string;
  endTime?: string;
  notes?: string;
  loggedBy: string;
};

type BackendDiaper = {
  id: string;
  childId: string;
  timestamp: string;
  type: Diaper['type'];
  notes?: string;
  loggedBy: string;
};

type BackendHealth = {
  id: string;
  childId: string;
  timestamp: string;
  type: Health['type'];
  title: string;
  notes?: string;
  loggedBy: string;
};

const feedingSubscribers = new Map<
  string,
  Set<(items: Feeding[]) => void>
>();
const sleepSubscribers = new Map<string, Set<(items: Sleep[]) => void>>();
const diaperSubscribers = new Map<string, Set<(items: Diaper[]) => void>>();
const healthSubscribers = new Map<string, Set<(items: Health[]) => void>>();

function normalizeFeeding(feeding: BackendFeeding): Feeding {
  return {
    id: feeding.id,
    childId: feeding.childId,
    timestamp: feeding.timestamp,
    type: feeding.type,
    amount: feeding.amount,
    unit: feeding.unit,
    notes: feeding.notes,
    loggedBy: feeding.loggedBy,
  };
}

async function fetchFeedingsForChild(childId: string) {
  const feedings = await fetchBackend<BackendFeeding[]>(
    `/children/${childId}/feedings`,
  );
  return feedings.map(normalizeFeeding);
}

async function publishFeedings(childId: string) {
  const subscribers = feedingSubscribers.get(childId);

  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const items = await fetchFeedingsForChild(childId);
  subscribers.forEach((callback) => callback(items));
}

function normalizeSleep(sleep: BackendSleep): Sleep {
  return {
    id: sleep.id,
    childId: sleep.childId,
    startTime: sleep.startTime,
    endTime: sleep.endTime,
    notes: sleep.notes,
    loggedBy: sleep.loggedBy,
  };
}

async function fetchSleepsForChild(childId: string) {
  const sleeps = await fetchBackend<BackendSleep[]>(
    `/children/${childId}/sleeps`,
  );
  return sleeps.map(normalizeSleep);
}

async function publishSleeps(childId: string) {
  const subscribers = sleepSubscribers.get(childId);

  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const items = await fetchSleepsForChild(childId);
  subscribers.forEach((callback) => callback(items));
}

function normalizeDiaper(diaper: BackendDiaper): Diaper {
  return {
    id: diaper.id,
    childId: diaper.childId,
    timestamp: diaper.timestamp,
    type: diaper.type,
    notes: diaper.notes,
    loggedBy: diaper.loggedBy,
  };
}

async function fetchDiapersForChild(childId: string) {
  const diapers = await fetchBackend<BackendDiaper[]>(
    `/children/${childId}/diapers`,
  );
  return diapers.map(normalizeDiaper);
}

async function publishDiapers(childId: string) {
  const subscribers = diaperSubscribers.get(childId);

  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const items = await fetchDiapersForChild(childId);
  subscribers.forEach((callback) => callback(items));
}

function normalizeHealth(item: BackendHealth): Health {
  return {
    id: item.id,
    childId: item.childId,
    timestamp: item.timestamp,
    type: item.type,
    title: item.title,
    notes: item.notes,
    loggedBy: item.loggedBy,
  };
}

async function fetchHealthLogsForChild(childId: string) {
  const items = await fetchBackend<BackendHealth[]>(
    `/children/${childId}/health-logs`,
  );
  return items.map(normalizeHealth);
}

async function publishHealthLogs(childId: string) {
  const subscribers = healthSubscribers.get(childId);

  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const items = await fetchHealthLogsForChild(childId);
  subscribers.forEach((callback) => callback(items));
}

function subscribeToChildCollection<T>(
  collectionName:
    | 'feedings'
    | 'sleeps'
    | 'diapers'
    | 'health'
    | 'growth'
    | 'milestones'
    | 'reminders'
    | 'routines',
  childId: string,
  callback: (items: T[]) => void,
) {
  const publish = () => {
    callback(getChildActivityItems<T>(collectionName, childId));
  };

  publish();

  return subscribeToMockStore(publish);
}

export async function fetchChildrenForUser(userId: string) {
  void userId;
  return fetchBackend<BackendChild[]>('/children');
}

export async function createChildProfile(child: CreateChildInput) {
  return fetchBackend<BackendChild>('/children', {
    method: 'POST',
    body: JSON.stringify({
      name: String(child.name ?? '').trim(),
      birthDate: String(child.birthDate ?? ''),
      notes: child.notes ? String(child.notes).trim() : undefined,
    }),
  });
}

export async function updateChildProfile(
  childId: string,
  updates: Partial<Pick<Child, 'name' | 'birthDate' | 'notes'>>,
) {
  return fetchBackend<BackendChild>(`/children/${childId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

export async function deleteChildProfile(childId: string) {
  return fetchBackend<{ success: true; childId: string }>(`/children/${childId}`, {
    method: 'DELETE',
  });
}

export async function deleteChildProfileWithData(childId: string) {
  return deleteChildProfile(childId);
}

export async function createFeedingLog(feeding: CreateFeedingInput) {
  await fetchBackend<BackendFeeding>(`/children/${feeding.childId}/feedings`, {
    method: 'POST',
    body: JSON.stringify({
      timestamp: feeding.timestamp,
      type: feeding.type,
      amount: feeding.amount,
      unit: feeding.unit,
      notes: feeding.notes,
    }),
  });

  await publishFeedings(feeding.childId);
}

export async function createSleepLog(sleep: CreateSleepInput) {
  await fetchBackend<BackendSleep>(`/children/${sleep.childId}/sleeps`, {
    method: 'POST',
    body: JSON.stringify({
      startTime: sleep.startTime,
      endTime: sleep.endTime,
      notes: sleep.notes,
    }),
  });

  await publishSleeps(sleep.childId);
}

export async function createDiaperLog(diaper: CreateDiaperInput) {
  await fetchBackend<BackendDiaper>(`/children/${diaper.childId}/diapers`, {
    method: 'POST',
    body: JSON.stringify({
      timestamp: diaper.timestamp,
      type: diaper.type,
      notes: diaper.notes,
    }),
  });

  await publishDiapers(diaper.childId);
}

export async function createHealthLog(health: CreateHealthInput) {
  await fetchBackend<BackendHealth>(`/children/${health.childId}/health-logs`, {
    method: 'POST',
    body: JSON.stringify({
      timestamp: health.timestamp,
      type: health.type,
      title: health.title,
      notes: health.notes,
    }),
  });

  await publishHealthLogs(health.childId);
}

export function subscribeToFeedings(
  childId: string,
  callback: (items: Feeding[]) => void,
) {
  const existingSubscribers = feedingSubscribers.get(childId) ?? new Set();
  existingSubscribers.add(callback);
  feedingSubscribers.set(childId, existingSubscribers);

  void fetchFeedingsForChild(childId)
    .then((items) => {
      callback(items);
    })
    .catch((error: unknown) => {
      console.error('Unable to load feedings from backend:', error);
      callback([]);
    });

  return () => {
    const subscribers = feedingSubscribers.get(childId);

    if (!subscribers) {
      return;
    }

    subscribers.delete(callback);

    if (subscribers.size === 0) {
      feedingSubscribers.delete(childId);
    }
  };
}

export function subscribeToSleeps(
  childId: string,
  callback: (items: Sleep[]) => void,
) {
  const existingSubscribers = sleepSubscribers.get(childId) ?? new Set();
  existingSubscribers.add(callback);
  sleepSubscribers.set(childId, existingSubscribers);

  void fetchSleepsForChild(childId)
    .then((items) => {
      callback(items);
    })
    .catch((error: unknown) => {
      console.error('Unable to load sleep logs from backend:', error);
      callback([]);
    });

  return () => {
    const subscribers = sleepSubscribers.get(childId);

    if (!subscribers) {
      return;
    }

    subscribers.delete(callback);

    if (subscribers.size === 0) {
      sleepSubscribers.delete(childId);
    }
  };
}

export function subscribeToDiapers(
  childId: string,
  callback: (items: Diaper[]) => void,
) {
  const existingSubscribers = diaperSubscribers.get(childId) ?? new Set();
  existingSubscribers.add(callback);
  diaperSubscribers.set(childId, existingSubscribers);

  void fetchDiapersForChild(childId)
    .then((items) => {
      callback(items);
    })
    .catch((error: unknown) => {
      console.error('Unable to load diaper logs from backend:', error);
      callback([]);
    });

  return () => {
    const subscribers = diaperSubscribers.get(childId);

    if (!subscribers) {
      return;
    }

    subscribers.delete(callback);

    if (subscribers.size === 0) {
      diaperSubscribers.delete(childId);
    }
  };
}

export function subscribeToHealthLogs(
  childId: string,
  callback: (items: Health[]) => void,
) {
  const existingSubscribers = healthSubscribers.get(childId) ?? new Set();
  existingSubscribers.add(callback);
  healthSubscribers.set(childId, existingSubscribers);

  void fetchHealthLogsForChild(childId)
    .then((items) => {
      callback(items);
    })
    .catch((error: unknown) => {
      console.error('Unable to load health logs from backend:', error);
      callback([]);
    });

  return () => {
    const subscribers = healthSubscribers.get(childId);

    if (!subscribers) {
      return;
    }

    subscribers.delete(callback);

    if (subscribers.size === 0) {
      healthSubscribers.delete(childId);
    }
  };
}

export function subscribeToGrowthLogs(
  childId: string,
  callback: (items: Growth[]) => void,
) {
  return subscribeToChildCollection('growth', childId, callback);
}

export function subscribeToMilestones(
  childId: string,
  callback: (items: Milestone[]) => void,
) {
  return subscribeToChildCollection('milestones', childId, callback);
}

export function subscribeToReminders(
  childId: string,
  callback: (items: Reminder[]) => void,
) {
  return subscribeToChildCollection('reminders', childId, callback);
}

export function subscribeToRoutines(
  childId: string,
  callback: (items: Routine[]) => void,
) {
  return subscribeToChildCollection('routines', childId, callback);
}

export const childrenServiceBackendNote = mockDataBackendNote;
