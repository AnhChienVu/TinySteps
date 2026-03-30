'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/UI';
import { useActiveChild } from '@/components/ActiveChildProvider';
import { createChildProfile } from '@/lib/services/children-service';
import { getCurrentUser } from '@/lib/services/auth-service';

export default function NewChildPage() {
  const router = useRouter();
  const { setActiveChildId, refreshChildren } = useActiveChild();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const user = getCurrentUser();

    if (!user) {
      setError('You need to be signed in to add a child profile.');
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData(event.currentTarget);
      const child = await createChildProfile({
        name: formData.get('name'),
        birthDate: formData.get('birthDate'),
        notes: formData.get('notes'),
      });

      await refreshChildren();
      setActiveChildId(child.id);
      router.push('/dashboard');
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to create the child profile right now.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex h-full min-h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <h2 className="serif text-3xl font-semibold mb-6">
          Welcome to TinySteps
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Child's Name"
            name="name"
            required
            placeholder="e.g. Leo"
          />
          <Input label="Birth Date" name="birthDate" type="date" required />
          <Input
            label="Notes (Optional)"
            name="notes"
            placeholder="Any special notes?"
          />
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button className="flex-1" disabled={loading}>
              {loading ? 'Adding...' : 'Add Child'}
            </Button>
          </div>
        </form>
      </Card>
    </main>
  );
}
