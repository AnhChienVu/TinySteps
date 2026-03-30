'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { watchAuthState } from '@/lib/services/auth-service';
import type { User } from 'firebase/auth';

type AuthGuardProps = {
  children: ReactNode;
  redirectTo?: string;
};

export default function AuthGuard({
  children,
  redirectTo = '/auth',
}: AuthGuardProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = watchAuthState((nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        router.replace(redirectTo);
      }
    });

    return unsubscribe;
  }, [redirectTo, router]);

  if (!authReady) {
    return (
      <main className="min-h-screen bg-warm-bg px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-[32px] border border-black/5 bg-white p-8 shadow-sm">
          Checking your session...
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
