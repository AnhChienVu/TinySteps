'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Droplets } from 'lucide-react';
import { Button, Select, Input } from '@/components/UI';
import { useActiveChild } from '@/components/ActiveChildProvider';
import ActivityLogPage from '@/components/ActivityLogPage';
import { getCurrentUser } from '@/lib/services/auth-service';
import {
  createDiaperLog,
  subscribeToDiapers,
} from '@/lib/services/children-service';
import type { Diaper } from '@/types';

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function DiaperPage() {
  const router = useRouter();
  const { childrenList, activeChildId, loading } = useActiveChild();
  const activeChild = childrenList.find((child) => child.id === activeChildId) ?? null;
  const [diapers, setDiapers] = useState<Diaper[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!activeChild) return;
    return subscribeToDiapers(activeChild.id, setDiapers);
  }, [activeChild]);

  const recentDiapers = useMemo(
    () => [...diapers].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5),
    [diapers],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSuccessMessage('');
    setSubmitting(true);
    const user = getCurrentUser();

    if (!activeChild || !user) {
      setError('Select a child profile before logging a diaper change.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData(form);
      await createDiaperLog({
        id: crypto.randomUUID(),
        childId: activeChild.id,
        timestamp: new Date().toISOString(),
        type: String(formData.get('type') || 'wet'),
        notes: String(formData.get('notes') || ''),
        loggedBy: user.uid,
      });
      form.reset();
      setSuccessMessage('Diaper change saved successfully.');
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save the diaper change.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActivityLogPage
      loading={loading}
      activeChild={activeChild}
      icon={Droplets}
      eyebrow="Diaper"
      title="Log diaper change"
      description="Recording diaper activity for {name}."
      loadingLabel="Loading diaper form..."
      missingChildLabel="Create or select a child profile before logging a diaper change."
      recentTitle="Recent Changes"
      recentSubtitle="Latest diaper entries for {name}."
      formContent={
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Type"
              name="type"
              options={[
                { value: 'wet', label: 'Wet' },
                { value: 'dry', label: 'Dry' },
                { value: 'both', label: 'Both' },
              ]}
            />
            <Input label="Notes" name="notes" placeholder="Any details?" />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.push('/dashboard')} className="flex-1" disabled={submitting}>
                Back
              </Button>
              <Button className="flex-1" disabled={submitting}>
                {submitting ? 'Saving...' : 'Log Change'}
              </Button>
            </div>
          </form>
      }
      recentContent={
        recentDiapers.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4 text-sm text-black/45">No diaper changes logged yet.</div>
        ) : recentDiapers.map((diaper) => (
          <div key={diaper.id} className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold capitalize text-black">{diaper.type}</p>
              <p className="text-xs text-black/40">{formatTimestamp(diaper.timestamp)}</p>
            </div>
            {diaper.notes ? <p className="mt-1 text-sm text-black/45">{diaper.notes}</p> : null}
          </div>
        ))
      }
      statsHref="/stats"
      statsTitle="View Diaper Trends"
      statsDescription="See daily changes alongside feeding and sleep"
    />
  );
}
