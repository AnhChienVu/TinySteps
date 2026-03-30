'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/UI';
import { signOutCurrentUser } from '@/lib/services/auth-service';
import { clearAppSession } from '@/lib/services/session-service';

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setError('');
    setLoading(true);

    try {
      await signOutCurrentUser();
      await clearAppSession();
      router.replace('/auth');
    } catch (logoutError: unknown) {
      setError(
        logoutError instanceof Error
          ? logoutError.message
          : 'Unable to log out right now.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8">
      <Button
        variant="outline"
        onClick={handleLogout}
        disabled={loading}
        className="min-w-32"
      >
        {loading ? 'Logging Out...' : 'Log Out'}
      </Button>
      {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
