'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '../lib/utils';
import { protectedNavItems, quickActionItems } from '@/lib/navigation';

export default function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEffect(() => {
    if (!isQuickAddOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsQuickAddOpen(false);
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isQuickAddOpen]);

  return (
    <>
      {isQuickAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 px-4 pb-28 pt-6 backdrop-blur-sm sm:items-center sm:pb-6">
          <button
            className="absolute inset-0"
            aria-label="Close quick actions"
            onClick={() => setIsQuickAddOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-[32px] border border-black/5 bg-white p-6 shadow-2xl shadow-black/10">
            <div className="mb-5">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-olive">
                Quick Add
              </p>
              <h2 className="serif mt-2 text-3xl font-semibold text-black">
                What do you want to log?
              </h2>
            </div>

            <div className="space-y-3">
              {quickActionItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setIsQuickAddOpen(false);
                      router.push(item.href);
                    }}
                    className="flex w-full items-center gap-4 rounded-3xl border border-black/5 bg-warm-bg px-4 py-4 text-left transition hover:border-olive/20 hover:bg-white"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-olive/10 text-olive">
                      <Icon size={22} />
                    </div>
                    <div>
                      <p className="font-semibold text-black">{item.label}</p>
                      <p className="text-sm text-black/60">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
        <div className="mx-auto flex w-full max-w-xl items-center justify-between rounded-[32px] border border-black/5 bg-white/85 px-6 py-4 shadow-lg shadow-black/5 backdrop-blur-xl">
          {protectedNavItems.map((item) => {
            const isActive =
              item.match?.some((prefix) => pathname.startsWith(prefix)) ?? false;
            const Icon = item.icon;

            if (item.isPrimary) {
              return (
                <div key={item.href} className="relative -top-8">
                  <button
                    onClick={() => setIsQuickAddOpen(true)}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-olive text-white shadow-lg shadow-olive/30 transition-transform active:scale-90"
                    aria-label={item.label}
                  >
                    <Icon size={32} />
                  </button>
                </div>
              );
            }

            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                aria-label={`Go to ${item.label}`}
                className={cn(
                  'flex flex-col items-center gap-1 transition-colors',
                  isActive ? 'text-olive' : 'text-black/60',
                )}
              >
                <Icon size={24} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
