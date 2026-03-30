'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Moon } from 'lucide-react';
import { Button, Input } from '@/components/UI';
import { useActiveChild } from '@/components/ActiveChildProvider';
import ActivityLogPage from '@/components/ActivityLogPage';
import { getCurrentUser } from '@/lib/services/auth-service';
import {
  createSleepLog,
  subscribeToSleeps,
} from '@/lib/services/children-service';
import type { Sleep } from '@/types';

function formatTimestamp(value?: string) {
  if (!value) return 'In progress';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export default function SleepPage() {
  const router = useRouter();
  const { childrenList, activeChildId, loading } = useActiveChild();
  const activeChild =
    childrenList.find((child) => child.id === activeChildId) ?? null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [sleepLogs, setSleepLogs] = useState<Sleep[]>([]);

  useEffect(() => {
    if (!activeChild) return;
    return subscribeToSleeps(activeChild.id, setSleepLogs);
  }, [activeChild]);

  const recentSleeps = useMemo(
    () =>
      [...sleepLogs]
        .sort((a, b) => b.startTime.localeCompare(a.startTime))
        .slice(0, 5),
    [sleepLogs],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    const user = getCurrentUser();

    if (!activeChild || !user) {
      setError('Select a child profile before logging sleep.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData(form);
      const startValue = String(formData.get('startTime') || '');
      const endValue = String(formData.get('endTime') || '');
      const today = getLocalDateInputValue();
      const startTime = startValue
        ? new Date(`${today}T${startValue}`)
        : new Date();
      const endTime = endValue ? new Date(`${today}T${endValue}`) : undefined;

      if (
        endTime &&
        !Number.isNaN(startTime.getTime()) &&
        !Number.isNaN(endTime.getTime()) &&
        endTime <= startTime
      ) {
        endTime.setDate(endTime.getDate() + 1);
      }

      await createSleepLog({
        id: crypto.randomUUID(),
        childId: activeChild.id,
        startTime: startTime.toISOString(),
        endTime: endTime?.toISOString(),
        notes: String(formData.get('notes') || ''),
        loggedBy: user.uid,
      });

      form.reset();
      setSuccessMessage('Sleep log saved successfully.');
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the sleep log.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActivityLogPage
      loading={loading}
      activeChild={activeChild}
      icon={Moon}
      eyebrow="Sleep"
      title="Log sleep"
      description="Recording sleep for {name}."
      loadingLabel="Loading sleep form..."
      missingChildLabel="Create or select a child profile before logging sleep."
      recentTitle="Recent Sleep"
      recentSubtitle="Latest sleep entries for {name}."
      formContent={
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Time" name="startTime" type="time" required />
              <Input label="End Time" name="endTime" type="time" />
            </div>
            <Input
              label="Notes"
              name="notes"
              placeholder="Nap, bedtime, wake notes..."
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {successMessage ? (
              <p className="text-sm text-green-600">{successMessage}</p>
            ) : null}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/dashboard')}
                className="flex-1"
                disabled={submitting}
              >
                Back
              </Button>
              <Button className="flex-1" disabled={submitting}>
                {submitting ? 'Saving...' : 'Log Sleep'}
              </Button>
            </div>
          </form>
      }
      recentContent={
        recentSleeps.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4 text-sm text-black/45">
            No sleep logs yet.
          </div>
        ) : (
          recentSleeps.map((sleep) => (
            <div
              key={sleep.id}
              className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4"
            >
              <p className="font-semibold text-black">
                {formatTimestamp(sleep.startTime)}
              </p>
              <p className="mt-1 text-sm text-black/55">
                Ended: {formatTimestamp(sleep.endTime)}
              </p>
              {sleep.notes ? (
                <p className="mt-1 text-sm text-black/45">{sleep.notes}</p>
              ) : null}
            </div>
          ))
        )
      }
      statsHref="/stats"
      statsTitle="View Sleep Trends"
      statsDescription="See sleep insights and daily summaries"
    />
  );
}
