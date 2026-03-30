'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@/components/Auth';
import { watchAuthState } from '@/lib/services/auth-service';

export default function AuthPage() {
  const router = useRouter();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = watchAuthState((user) => {
      if (user) {
        router.replace('/dashboard');
        return;
      }

      setAuthReady(true);
    });

    return unsubscribe;
  }, [router]);

  if (!authReady) {
    return null;
  }

  return <Auth onAuthSuccess={() => router.push('/dashboard')} />;
}
