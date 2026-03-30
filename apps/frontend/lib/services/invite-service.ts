import type { Child, Invite } from '@/types';
import { fetchBackend } from '@/lib/services/backend-client';

const inviteSubscribers = new Map<string, Set<(items: Invite[]) => void>>();
const incomingInviteSubscribers = new Set<(items: Invite[]) => void>();

async function fetchInvitesForChild(childId: string) {
  return fetchBackend<Invite[]>(`/children/${childId}/invites`);
}

async function publishInvites(childId: string) {
  const subscribers = inviteSubscribers.get(childId);

  if (!subscribers || subscribers.size === 0) {
    return;
  }

  const items = await fetchInvitesForChild(childId);
  subscribers.forEach((callback) => callback(items));
}

async function fetchIncomingInvites() {
  return fetchBackend<Invite[]>('/invites/me');
}

async function publishIncomingInvites() {
  if (incomingInviteSubscribers.size === 0) {
    return;
  }

  const items = await fetchIncomingInvites();
  incomingInviteSubscribers.forEach((callback) => callback(items));
}

export function subscribeToInvites(
  childId: string,
  onData: (items: Invite[]) => void,
  onError: (error: { code?: string; message: string }) => void,
) {
  const existingSubscribers = inviteSubscribers.get(childId) ?? new Set();
  existingSubscribers.add(onData);
  inviteSubscribers.set(childId, existingSubscribers);

  void fetchInvitesForChild(childId)
    .then((items) => {
      onData(items);
    })
    .catch((error: unknown) => {
      onError({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load invites right now.',
      });
      onData([]);
    });

  return () => {
    const subscribers = inviteSubscribers.get(childId);

    if (!subscribers) {
      return;
    }

    subscribers.delete(onData);

    if (subscribers.size === 0) {
      inviteSubscribers.delete(childId);
    }
  };
}

export function subscribeToIncomingInvites(
  onData: (items: Invite[]) => void,
  onError: (error: { code?: string; message: string }) => void,
) {
  incomingInviteSubscribers.add(onData);

  void fetchIncomingInvites()
    .then((items) => {
      onData(items);
    })
    .catch((error: unknown) => {
      onError({
        message:
          error instanceof Error
            ? error.message
            : 'Unable to load incoming invites right now.',
      });
      onData([]);
    });

  return () => {
    incomingInviteSubscribers.delete(onData);
  };
}

export async function createInvite({
  activeChild,
  email,
}: {
  activeChild: Child;
  email: string;
}) {
  await fetchBackend<Invite>(`/children/${activeChild.id}/invites`, {
    method: 'POST',
    body: JSON.stringify({
      inviteeEmail: email,
      childName: activeChild.name,
    }),
  });

  await publishInvites(activeChild.id);
  await publishIncomingInvites();
}

export async function declineInvite(childId: string, inviteId: string) {
  await fetchBackend<Invite>(
    `/children/${childId}/invites/${inviteId}/decline`,
    {
      method: 'PATCH',
    },
  );

  await publishInvites(childId);
  await publishIncomingInvites();
}

export async function acceptInvite(inviteId: string) {
  const invite = await fetchBackend<Invite>(`/invites/${inviteId}/accept`, {
    method: 'PATCH',
  });

  await publishIncomingInvites();
  await publishInvites(invite.childId);
  return invite;
}

export async function declineIncomingInvite(inviteId: string) {
  const invite = await fetchBackend<Invite>(`/invites/${inviteId}/decline`, {
    method: 'PATCH',
  });

  await publishIncomingInvites();
  await publishInvites(invite.childId);
  return invite;
}
