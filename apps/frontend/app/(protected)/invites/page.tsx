'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, MailPlus, X } from 'lucide-react';
import { CaregiverInvites } from '@/components/CaregiverInvites';
import { Card, Button } from '@/components/UI';
import { useActiveChild } from '@/components/ActiveChildProvider';
import type { Invite } from '@/types';
import {
  acceptInvite,
  createInvite,
  declineIncomingInvite,
  declineInvite,
  subscribeToIncomingInvites,
  subscribeToInvites,
} from '@/lib/services/invite-service';
import { getCurrentUser } from '@/lib/services/auth-service';

export default function InvitesPage() {
  const router = useRouter();
  const { childrenList, activeChildId, loading, refreshChildren, setActiveChildId } =
    useActiveChild();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<Invite[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const activeChild = useMemo(
    () => childrenList.find((child) => child.id === activeChildId) ?? null,
    [activeChildId, childrenList],
  );

  useEffect(() => {
    const unsubscribe = subscribeToIncomingInvites(
      (nextInvites) => {
        setIncomingInvites(nextInvites);
      },
      (incomingError) => {
        setIncomingInvites([]);
        setError(incomingError.message);
      },
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!activeChild) {
      return;
    }

    const unsubscribe = subscribeToInvites(
      activeChild.id,
      (nextInvites) => {
        setInvites(nextInvites);
      },
      (snapshotError) => {
        setInvites([]);
        setError(
          snapshotError.code === 'permission-denied'
            ? 'You do not have permission to view invites for this child.'
            : snapshotError.message,
        );
      },
    );

    return unsubscribe;
  }, [activeChild]);

  async function handleSendInvite(email: string) {
    const user = getCurrentUser();

    if (!activeChild || !user || !user.email) {
      setError('You need an active child profile and signed-in account to send invites.');
      return;
    }

    setError('');
    setSuccessMessage('');

    try {
      await createInvite({
        activeChild,
        email,
      });
    } catch (inviteError: unknown) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : 'Unable to send the invite right now.',
      );
    }
  }

  async function handleDeclineInvite(inviteId: string) {
    setError('');
    setSuccessMessage('');

    try {
      if (!activeChild) {
        throw new Error('Select a child profile first.');
      }

      await declineInvite(activeChild.id, inviteId);
    } catch (inviteError: unknown) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : 'Unable to remove the invite right now.',
      );
    }
  }

  async function handleAcceptInvite(inviteId: string) {
    setError('');
    setSuccessMessage('');

    try {
      const acceptedInvite = await acceptInvite(inviteId);
      await refreshChildren();
      setActiveChildId(acceptedInvite.childId);
      setSuccessMessage(`You now have access to ${acceptedInvite.childName}.`);
    } catch (inviteError: unknown) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : 'Unable to accept the invite right now.',
      );
    }
  }

  async function handleDeclineIncomingInvite(inviteId: string) {
    setError('');
    setSuccessMessage('');

    try {
      await declineIncomingInvite(inviteId);
    } catch (inviteError: unknown) {
      setError(
        inviteError instanceof Error
          ? inviteError.message
          : 'Unable to decline the invite right now.',
      );
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>Loading invites...</Card>
      </main>
    );
  }

  if (!activeChild) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          {successMessage ? (
            <p className="text-sm text-green-600">{successMessage}</p>
          ) : null}
          <Card className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-olive/10 text-olive">
                <MailPlus size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                  Incoming Invites
                </p>
                <h1 className="serif text-4xl font-bold text-black">
                  Invitation requests for you
                </h1>
                <p className="max-w-2xl text-black/50">
                  Accept an invite to get access to a child profile, or decline it if it is not relevant.
                </p>
              </div>
            </div>

            {incomingInvites.filter((invite) => invite.status === 'pending').length === 0 ? (
              <div className="rounded-3xl bg-warm-bg px-4 py-5 text-sm text-black/50">
                No pending invites for your account right now.
              </div>
            ) : (
              <div className="space-y-3">
                {incomingInvites
                  .filter((invite) => invite.status === 'pending')
                  .map((invite) => (
                    <div
                      key={invite.id}
                      className="flex flex-col gap-3 rounded-3xl border border-black/5 bg-warm-bg px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-black">{invite.childName}</p>
                        <p className="text-sm text-black/45">
                          Invited by {invite.inviterEmail}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => handleDeclineIncomingInvite(invite.id)}
                          className="inline-flex items-center gap-2"
                        >
                          <X size={16} />
                          Decline
                        </Button>
                        <Button
                          type="button"
                          onClick={() => handleAcceptInvite(invite.id)}
                          className="inline-flex items-center gap-2"
                        >
                          <Check size={16} />
                          Accept
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => router.push('/dashboard')}>
                Back to Dashboard
              </Button>
              <Button onClick={() => router.push('/children/new')}>
                Create Child Profile
              </Button>
            </div>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {error ? <p className="mb-4 text-sm text-red-500">{error}</p> : null}
      {successMessage ? (
        <p className="mb-4 text-sm text-green-600">{successMessage}</p>
      ) : null}
      {incomingInvites.filter((invite) => invite.status === 'pending').length > 0 ? (
        <Card className="mb-4 space-y-4 p-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
              Incoming Invites
            </p>
            <p className="text-sm text-black/45">
              Invitations sent to your account email.
            </p>
          </div>
          <div className="space-y-3">
            {incomingInvites
              .filter((invite) => invite.status === 'pending')
              .map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-col gap-3 rounded-3xl border border-black/5 bg-warm-bg px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold text-black">{invite.childName}</p>
                    <p className="text-sm text-black/45">
                      Invited by {invite.inviterEmail}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => handleDeclineIncomingInvite(invite.id)}
                      className="inline-flex items-center gap-2"
                    >
                      <X size={16} />
                      Decline
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleAcceptInvite(invite.id)}
                      className="inline-flex items-center gap-2"
                    >
                      <Check size={16} />
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      ) : null}
      <CaregiverInvites
        activeChild={activeChild}
        invites={invites}
        onSendInvite={handleSendInvite}
        onDeclineInvite={handleDeclineInvite}
        onBack={() => router.push('/dashboard')}
      />
    </main>
  );
}
