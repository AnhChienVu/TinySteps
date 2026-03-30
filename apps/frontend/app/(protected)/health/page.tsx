'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HeartPulse } from 'lucide-react';
import { Button, Select, Input } from '@/components/UI';
import { useActiveChild } from '@/components/ActiveChildProvider';
import ActivityLogPage from '@/components/ActivityLogPage';
import { getCurrentUser } from '@/lib/services/auth-service';
import {
  createHealthLog,
  subscribeToHealthLogs,
} from '@/lib/services/children-service';
import type { Health } from '@/types';

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return date.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function HealthPage() {
  const router = useRouter();
  const { childrenList, activeChildId, loading } = useActiveChild();
  const activeChild = childrenList.find((child) => child.id === activeChildId) ?? null;
  const [healthLogs, setHealthLogs] = useState<Health[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!activeChild) return;
    return subscribeToHealthLogs(activeChild.id, setHealthLogs);
  }, [activeChild]);

  const recentLogs = useMemo(
    () => [...healthLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5),
    [healthLogs],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setError('');
    setSuccessMessage('');
    setSubmitting(true);
    const user = getCurrentUser();

    if (!activeChild || !user) {
      setError('Select a child profile before logging health notes.');
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData(form);
      await createHealthLog({
        id: crypto.randomUUID(),
        childId: activeChild.id,
        timestamp: new Date().toISOString(),
        type: String(formData.get('type') || 'symptom'),
        title: String(formData.get('title') || ''),
        notes: String(formData.get('notes') || ''),
        loggedBy: user.uid,
      });
      form.reset();
      setSuccessMessage('Health note saved successfully.');
    } catch (submitError: unknown) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to save the health note.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ActivityLogPage
      loading={loading}
      activeChild={activeChild}
      icon={HeartPulse}
      eyebrow="Health"
      title="Log health note"
      description="Recording health details for {name}."
      loadingLabel="Loading health form..."
      missingChildLabel="Create or select a child profile before logging health notes."
      recentTitle="Recent Health Logs"
      recentSubtitle="Latest health entries for {name}."
      formContent={
        <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Type"
              name="type"
              options={[
                { value: 'symptom', label: 'Symptom' },
                { value: 'medication', label: 'Medication' },
                { value: 'doctor', label: 'Doctor Visit' },
                { value: 'vaccination', label: 'Vaccination' },
              ]}
            />
            <Input label="Title" name="title" required placeholder="e.g. Mild fever" />
            <Input label="Notes" name="notes" placeholder="Extra details..." />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            {successMessage ? <p className="text-sm text-green-600">{successMessage}</p> : null}
            <div className="flex gap-3">
              <Button type="button" variant="secondary" onClick={() => router.push('/dashboard')} className="flex-1" disabled={submitting}>
                Back
              </Button>
              <Button className="flex-1" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </form>
      }
      recentContent={
        recentLogs.length === 0 ? (
          <div className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4 text-sm text-black/45">No health logs yet.</div>
        ) : recentLogs.map((item) => (
          <div key={item.id} className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-black">{item.title}</p>
              <p className="text-xs text-black/40">{formatTimestamp(item.timestamp)}</p>
            </div>
            <p className="mt-1 text-sm capitalize text-black/55">{item.type}</p>
            {item.notes ? <p className="mt-1 text-sm text-black/45">{item.notes}</p> : null}
          </div>
        ))
      }
      statsHref="/stats"
      statsTitle="View Health Trends"
      statsDescription="See health notes alongside feeding and sleep stats"
    />
  );
}
