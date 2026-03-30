import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { ActiveChildProvider } from '@/components/ActiveChildProvider';
import AuthGuard from '@/components/AuthGuard';
import { AUTH_SESSION_COOKIE } from '@/lib/auth/session';
import AppNavigation from '@/components/AppNavigation';
import { AppHeader } from '@/components/AppHeader';
import FloatingChatButton from '@/components/FloatingChatButton';

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get(AUTH_SESSION_COOKIE);

  if (!session) {
    redirect('/auth');
  }

  return (
    <AuthGuard>
      <ActiveChildProvider>
        <div className="flex min-h-dvh flex-col bg-warm-bg">
          <AppHeader />
          <div className="flex-1 pb-28">{children}</div>
          <FloatingChatButton />
          <AppNavigation />
        </div>
      </ActiveChildProvider>
    </AuthGuard>
  );
}
