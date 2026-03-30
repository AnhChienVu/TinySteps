'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  ChevronLeft,
  CircleAlert,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Button } from '@/components/UI';
import { useActiveChild } from '@/components/ActiveChildProvider';
import {
  subscribeToDiapers,
  subscribeToFeedings,
  subscribeToHealthLogs,
  subscribeToSleeps,
} from '@/lib/services/children-service';
import { generateAiReply } from '@/lib/services/ai-chat-service';
import type { ChatMessage, Diaper, Feeding, Health, Sleep } from '@/types';

const STORAGE_KEY_PREFIX = 'tinysteps_ai_chat_';

function getStorageKey(childId: string) {
  return `${STORAGE_KEY_PREFIX}${childId}`;
}

function buildWelcomeMessage(childName: string): ChatMessage {
  return {
    role: 'model',
    text: `Hi, I’m TinySteps AI. I can summarize ${childName}'s feeding, sleep, diaper, and health activity and help you think through what happened today.`,
  };
}

function getLocalDayKey(value?: string) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getInitialChatHistory(childId: string, childName: string) {
  const rawValue = window.sessionStorage.getItem(getStorageKey(childId));

  if (!rawValue) {
    return [buildWelcomeMessage(childName)];
  }

  try {
    const parsed = JSON.parse(rawValue) as ChatMessage[];
    return parsed.length > 0 ? parsed : [buildWelcomeMessage(childName)];
  } catch {
    return [buildWelcomeMessage(childName)];
  }
}

function getRecentConversation(history: ChatMessage[]) {
  return history
    .filter((entry) => entry.text.trim().length > 0)
    .slice(-8);
}

export default function AIChatPage() {
  const router = useRouter();
  const { childrenList, activeChildId, loading } = useActiveChild();
  const activeChild =
    childrenList.find((child) => child.id === activeChildId) ?? null;

  if (loading) {
    return (
      <main className="mx-auto flex h-full min-h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md text-center">Loading AI chat...</Card>
      </main>
    );
  }

  if (!activeChild) {
    return (
      <main className="mx-auto flex h-full min-h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
            <CircleAlert size={24} />
          </div>
          <div className="space-y-2">
            <h2 className="serif text-3xl font-semibold text-black">
              No child selected
            </h2>
            <p className="text-black/50">
              Create or select a child profile before using AI chat.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push('/dashboard')}
              className="flex-1"
            >
              Dashboard
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/children/new')}
              className="flex-1"
            >
              Add Child
            </Button>
          </div>
        </Card>
      </main>
    );
  }

  return <AIChatExperience key={activeChild.id} activeChild={activeChild} />;
}

function AIChatExperience({
  activeChild,
}: {
  activeChild: NonNullable<ReturnType<typeof useActiveChild>['childrenList'][number]>;
}) {
  const router = useRouter();
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [sleeps, setSleeps] = useState<Sleep[]>([]);
  const [diapers, setDiapers] = useState<Diaper[]>([]);
  const [healthLogs, setHealthLogs] = useState<Health[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>(() =>
    getInitialChatHistory(activeChild.id, activeChild.name),
  );
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const unsubscribeFeedings = subscribeToFeedings(activeChild.id, setFeedings);
    const unsubscribeSleeps = subscribeToSleeps(activeChild.id, setSleeps);
    const unsubscribeDiapers = subscribeToDiapers(activeChild.id, setDiapers);
    const unsubscribeHealth = subscribeToHealthLogs(activeChild.id, setHealthLogs);

    return () => {
      unsubscribeFeedings();
      unsubscribeSleeps();
      unsubscribeDiapers();
      unsubscribeHealth();
    };
  }, [activeChild.id]);

  useEffect(() => {
    if (chatHistory.length === 0) {
      return;
    }

    window.sessionStorage.setItem(
      getStorageKey(activeChild.id),
      JSON.stringify(chatHistory),
    );
  }, [activeChild.id, chatHistory]);

  useEffect(() => {
    const container = scrollRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [chatHistory, isTyping]);

  const todaySummary = useMemo(() => {
    const today = getLocalDayKey(new Date().toISOString());

    return {
      feedings: feedings.filter((item) => getLocalDayKey(item.timestamp) === today)
        .length,
      sleeps: sleeps.filter((item) => getLocalDayKey(item.startTime) === today)
        .length,
      diapers: diapers.filter((item) => getLocalDayKey(item.timestamp) === today)
        .length,
      health: healthLogs.filter((item) => getLocalDayKey(item.timestamp) === today)
        .length,
    };
  }, [diapers, feedings, healthLogs, sleeps]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!message.trim() || isTyping) {
      return;
    }

    const nextUserMessage: ChatMessage = {
      role: 'user',
      text: message.trim(),
    };

    setChatHistory((current) => [...current, nextUserMessage]);
    setMessage('');
    setIsTyping(true);

    try {
      const reply = await generateAiReply({
        childId: activeChild.id,
        message: nextUserMessage.text,
        recentMessages: getRecentConversation(chatHistory),
      });

      window.setTimeout(() => {
        setChatHistory((current) => [...current, reply]);
        setIsTyping(false);
      }, 500);
    } catch {
      setChatHistory((current) => [
        ...current,
        {
          role: 'model',
          text: 'I hit a problem generating a reply just now. Please try again in a moment.',
        },
      ]);
      setIsTyping(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]"
      >
        <Card className="flex min-h-[68dvh] flex-col gap-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-olive/10 text-olive">
                <Bot size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                  AI Chat
                </p>
                <h2 className="serif text-3xl font-semibold text-black">
                  Ask about {activeChild.name}
                </h2>
                <p className="text-sm text-black/50">
                  Local mock assistant for now, ready to swap to your backend later.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={() => router.push('/dashboard')}
            >
              <span className="inline-flex items-center gap-2">
                <ChevronLeft size={16} />
                Back
              </span>
            </Button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto rounded-[28px] bg-warm-bg p-4"
          >
            {chatHistory.map((entry, index) => (
              <div
                key={`${entry.role}-${index}`}
                className={entry.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    entry.role === 'user'
                      ? 'max-w-[85%] rounded-[24px] rounded-tr-md bg-olive px-4 py-3 text-sm text-white'
                      : 'max-w-[85%] rounded-[24px] rounded-tl-md border border-black/5 bg-white px-4 py-3 text-sm text-black/75'
                  }
                >
                  {entry.text}
                </div>
              </div>
            ))}
            {isTyping ? (
              <div className="flex justify-start">
                <div className="rounded-[24px] rounded-tl-md border border-black/5 bg-white px-4 py-3 text-olive">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              name="message"
              placeholder="Ask about feeding, sleep, diapers, or health..."
              className="flex-1 rounded-full border border-black/5 bg-white px-5 py-4 outline-none transition-all focus:border-olive/20"
            />
            <button
              type="submit"
              disabled={!message.trim() || isTyping}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-olive text-white shadow-lg shadow-olive/25 transition-transform active:scale-90 disabled:pointer-events-none disabled:opacity-50"
              aria-label="Send chat message"
            >
              <Send size={20} />
            </button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-olive" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                Today at a glance
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-3xl bg-warm-bg px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                  Feedings
                </p>
                <p className="mt-2 text-2xl font-semibold text-black">
                  {todaySummary.feedings}
                </p>
              </div>
              <div className="rounded-3xl bg-warm-bg px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                  Sleeps
                </p>
                <p className="mt-2 text-2xl font-semibold text-black">
                  {todaySummary.sleeps}
                </p>
              </div>
              <div className="rounded-3xl bg-warm-bg px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                  Diapers
                </p>
                <p className="mt-2 text-2xl font-semibold text-black">
                  {todaySummary.diapers}
                </p>
              </div>
              <div className="rounded-3xl bg-warm-bg px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-black/35">
                  Health Notes
                </p>
                <p className="mt-2 text-2xl font-semibold text-black">
                  {todaySummary.health}
                </p>
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
              Try asking
            </p>
            <div className="space-y-2 text-sm text-black/60">
              <p>&quot;Give me a summary of today&quot;</p>
              <p>&quot;When was the last feeding?&quot;</p>
              <p>&quot;How did sleep look today?&quot;</p>
              <p>&quot;Any recent health notes?&quot;</p>
            </div>
            <Link href="/stats" className="text-sm font-medium text-olive">
              Open stats page
            </Link>
          </Card>
        </div>
      </motion.div>
    </main>
  );
}
