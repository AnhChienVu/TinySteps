'use client';

import { Bot } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function FloatingChatButton() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/ai-chat') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => router.push('/ai-chat')}
      className="fixed bottom-28 right-4 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-olive text-white shadow-lg shadow-olive/25 transition-transform active:scale-90 sm:bottom-6"
      aria-label="Open AI chat"
    >
      <Bot size={24} />
    </button>
  );
}
