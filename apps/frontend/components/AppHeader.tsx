'use client';

import { Baby, UserPlus, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useActiveChild } from '@/components/ActiveChildProvider';
import { signOutCurrentUser } from '@/lib/services/auth-service';
import { clearAppSession } from '@/lib/services/session-service';

export const AppHeader = () => {
  const router = useRouter();
  const { childrenList, activeChildId, setActiveChildId, loading } =
    useActiveChild();

  async function handleLogout() {
    await signOutCurrentUser();
    await clearAppSession();
    router.replace('/auth');
  }

  return (
    <header className="w-full px-4 py-4 sm:px-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-olive/10">
            <Baby size={24} className="text-olive" />
          </div>
          <div className="min-w-0">
            <h1 className="serif truncate text-2xl font-semibold leading-tight text-olive">
              TinySteps
            </h1>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/60">
              Companion
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <label htmlFor="active-child" className="sr-only">
            Select active child profile
          </label>
          <select
            id="active-child"
            value={activeChildId || ''}
            onChange={(e) => setActiveChildId(e.target.value)}
            disabled={loading || childrenList.length === 0}
            className="min-w-0 flex-1 rounded-full border-none bg-white px-3 py-2 text-sm font-medium text-black shadow-sm outline-none appearance-none cursor-pointer disabled:cursor-not-allowed disabled:text-black/50 sm:max-w-xs"
          >
            {childrenList.length === 0 ? (
              <option value="">
                {loading ? 'Loading children...' : 'No child profiles yet'}
              </option>
            ) : (
              childrenList.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))
            )}
          </select>
          <button
            onClick={() => router.push('/invites')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-colors hover:bg-black/5"
            aria-label="Open caregiver invites"
          >
            <UserPlus size={18} className="text-olive" />
          </button>
          <button
            onClick={handleLogout}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-red-500 shadow-sm transition-colors hover:bg-red-50"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
