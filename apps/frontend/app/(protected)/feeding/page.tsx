'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Milk } from 'lucide-react';
import { Button, Select, Input } from '@/components/UI';
import { useActiveChild } from '@/components/ActiveChildProvider';
import ActivityLogPage from '@/components/ActivityLogPage';
import { getCurrentUser } from '@/lib/services/auth-service';
import {
  createFeedingLog,
  subscribeToFeedings,
} from '@/lib/services/children-service';
import type { Feeding } from '@/types';

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function FeedingPage() {
  const router = useRouter();
  const { childrenList, activeChildId, loading } = useActiveChild();
  const activeChild =
    childrenList.find((child) => child.id === activeChildId) ?? null;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [feedings, setFeedings] = useState<Feeding[]>([]);

  useEffect(() => {
    if (!activeChild) {
      return;
    }

    return subscribeToFeedings(activeChild.id, setFeedings);
  }, [activeChild]);

  const recentFeedings = useMemo(
    () =>
      [...feedings]
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
        .slice(0, 5),
    [feedings],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    const user = getCurrentUser();

    if (!activeChild || !user) {
      setError('Select a child profile before logging a feeding.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData(form);

      await createFeedingLog({
        id: crypto.randomUUID(),
        childId: activeChild.id,
        timestamp: new Date().toISOString(),
        type: String(formData.get('type') || 'bottle'),
        amount: Number(formData.get('amount') || 0),
        unit: String(formData.get('unit') || 'ml'),
        notes: String(formData.get('notes') || ''),
        loggedBy: user.uid,
      });

      form.reset();
      setSuccessMessage('Feeding saved successfully.');
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save the feeding right now.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActivityLogPage
      loading={loading}
      activeChild={activeChild}
      icon={Milk}
      eyebrow="Feeding"
      title="Log a feeding"
      description="Recording feeding activity for {name}."
      loadingLabel="Loading feeding form..."
      missingChildLabel="Create or select a child profile before logging a feeding."
      recentTitle="Recent Feedings"
      recentSubtitle="Latest entries for {name}."
      formContent={
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Type"
            name="type"
            options={[
              { value: 'breast', label: 'Breast' },
              { value: 'bottle', label: 'Bottle' },
              { value: 'solid', label: 'Solid Food' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount" name="amount" type="number" placeholder="0" />
            <Select
              label="Unit"
              name="unit"
              options={[
                { value: 'ml', label: 'ml' },
                { value: 'oz', label: 'oz' },
                { value: 'min', label: 'min' },
              ]}
            />
          </div>
          <Input label="Notes" name="notes" placeholder="Any details?" />
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
              {submitting ? 'Saving...' : 'Log Feeding'}
            </Button>
          </div>
        </form>
      }
      recentContent={
        recentFeedings.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4 text-sm text-black/45">
            No feedings logged yet.
          </div>
        ) : (
          recentFeedings.map((feeding) => (
            <div
              key={feeding.id}
              className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold capitalize text-black">
                  {feeding.type}
                </p>
                <p className="text-xs text-black/40">
                  {formatTimestamp(feeding.timestamp)}
                </p>
              </div>
              <p className="mt-2 text-sm text-black/55">
                {feeding.amount
                  ? `${feeding.amount} ${feeding.unit}`
                  : 'No amount entered'}
              </p>
              {feeding.notes ? (
                <p className="mt-1 text-sm text-black/45">{feeding.notes}</p>
              ) : null}
            </div>
          ))
        )
      }
      statsHref="/stats"
      statsTitle="View Feeding Trends"
      statsDescription="See feeding insights and daily summaries"
    />
  );
}
