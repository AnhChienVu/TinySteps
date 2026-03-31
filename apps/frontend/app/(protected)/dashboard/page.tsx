'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Baby,
  BarChart3,
  CalendarDays,
  Droplets,
  HeartPulse,
  MessageSquare,
  Milk,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useActiveChild } from '@/components/ActiveChildProvider';
import { Card, Button } from '@/components/UI';
import {
  subscribeToDiapers,
  subscribeToFeedings,
  subscribeToHealthLogs,
  subscribeToSleeps,
} from '@/lib/services/children-service';
import type { Diaper, Feeding, Health, Sleep } from '@/types';

function isSameDay(dateString: string) {
  const date = new Date(dateString);
  const today = new Date();

  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function formatTimestamp(dateString?: string) {
  if (!dateString) {
    return 'Not logged yet';
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const featureLinks = [
  {
    title: 'Feed',
    href: '/feeding',
    description: 'Log bottles, nursing sessions, and solids.',
    icon: Milk,
  },
  {
    title: 'Sleep',
    href: '/sleep',
    description: 'Track naps, bedtime, and wake windows.',
    icon: Moon,
  },
  {
    title: 'Diaper',
    href: '/diaper',
    description: 'Record wet, dry, and mixed changes.',
    icon: Droplets,
  },
  {
    title: 'Health',
    href: '/health',
    description: 'Keep symptoms, meds, and checkups together.',
    icon: HeartPulse,
  },
  {
    title: 'Stats',
    href: '/stats',
    description: 'See trends and summaries across your care logs.',
    icon: BarChart3,
  },
  {
    title: 'AI Chat',
    href: '/ai-chat',
    description: 'Ask questions with your child context in mind.',
    icon: MessageSquare,
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const { childrenList, activeChildId, loading } = useActiveChild();
  const activeChild =
    childrenList.find((child) => child.id === activeChildId) ?? null;

  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [sleeps, setSleeps] = useState<Sleep[]>([]);
  const [diapers, setDiapers] = useState<Diaper[]>([]);
  const [healthLogs, setHealthLogs] = useState<Health[]>([]);

  useEffect(() => {
    if (!activeChild) {
      return;
    }

    const unsubscribers = [
      subscribeToFeedings(activeChild.id, setFeedings),
      subscribeToSleeps(activeChild.id, setSleeps),
      subscribeToDiapers(activeChild.id, setDiapers),
      subscribeToHealthLogs(activeChild.id, setHealthLogs),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [activeChild]);

  const todayFeedings = useMemo(
    () => feedings.filter((item) => isSameDay(item.timestamp)),
    [feedings],
  );
  const todayDiapers = useMemo(
    () => diapers.filter((item) => isSameDay(item.timestamp)),
    [diapers],
  );
  const todaySleeps = useMemo(
    () => sleeps.filter((item) => isSameDay(item.startTime)),
    [sleeps],
  );
  const latestFeeding = useMemo(
    () =>
      [...feedings].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ??
      null,
    [feedings],
  );
  const latestDiaper = useMemo(
    () =>
      [...diapers].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ??
      null,
    [diapers],
  );
  const latestHealth = useMemo(
    () =>
      [...healthLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0] ??
      null,
    [healthLogs],
  );

  const insights = useMemo(() => {
    if (!activeChild) {
      return [];
    }

    const nextInsights: string[] = [];

    if (todayFeedings.length === 0) {
      nextInsights.push(`No feedings logged for ${activeChild.name} yet today.`);
    } else {
      nextInsights.push(
        `${activeChild.name} has ${todayFeedings.length} feeding entr${todayFeedings.length === 1 ? 'y' : 'ies'} logged today.`,
      );
    }

    if (todayDiapers.length === 0) {
      nextInsights.push('No diaper changes logged today yet.');
    } else {
      nextInsights.push(
        `${todayDiapers.length} diaper change${todayDiapers.length === 1 ? '' : 's'} recorded today.`,
      );
    }

    if (todaySleeps.length > 0) {
      nextInsights.push(
        `${todaySleeps.length} sleep session${todaySleeps.length === 1 ? '' : 's'} started today.`,
      );
    }

    if (latestHealth) {
      nextInsights.push(
        `Latest health update: ${latestHealth.title} on ${formatTimestamp(latestHealth.timestamp)}.`,
      );
    }

    return nextInsights.slice(0, 4);
  }, [activeChild, latestHealth, todayDiapers.length, todayFeedings.length, todaySleeps.length]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <Card>Loading your dashboard...</Card>
      </main>
    );
  }

  if (!activeChild) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <Card className="space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-olive/10 text-olive">
              <Baby size={28} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                Welcome
              </p>
              <h1 className="serif text-4xl font-bold text-black">
                Add your first child profile
              </h1>
              <p className="mx-auto max-w-2xl text-black/65">
                Once you create a child profile, the header selector and all
                protected pages will follow that selection automatically.
              </p>
            </div>
            <Button
              className="px-8 py-4"
              onClick={() => router.push('/children/new')}
            >
              Create Child Profile
            </Button>
          </Card>
        </div>
      </main>
    );
  }

  const birthDate = new Date(activeChild.birthDate);
  const summaryCards = [
    {
      title: 'Today Feedings',
      value: String(todayFeedings.length),
      icon: Milk,
    },
    {
      title: 'Today Diapers',
      value: String(todayDiapers.length),
      icon: Droplets,
    },
    {
      title: 'Sleep Sessions',
      value: String(todaySleeps.length),
      icon: Moon,
    },
    {
      title: 'Caregivers',
      value: `${activeChild.caregivers.length} linked`,
      icon: HeartPulse,
    },
    {
      title: 'Birth Date',
      value: Number.isNaN(birthDate.getTime())
        ? 'Unknown'
        : birthDate.toLocaleDateString(),
      icon: CalendarDays,
    },
  ];

  const todayActivity = [
    {
      title: 'Latest feeding',
      value: latestFeeding
        ? `${latestFeeding.type} on ${formatTimestamp(latestFeeding.timestamp)}`
        : 'No feeding logged yet',
    },
    {
      title: 'Latest diaper',
      value: latestDiaper
        ? `${latestDiaper.type} on ${formatTimestamp(latestDiaper.timestamp)}`
        : 'No diaper change logged yet',
    },
    {
      title: 'Health updates',
      value: latestHealth
        ? `${latestHealth.title} on ${formatTimestamp(latestHealth.timestamp)}`
        : 'No health notes logged yet',
    },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="space-y-4">
        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                Dashboard
              </p>
              <h1 className="serif text-3xl font-bold text-black sm:text-4xl">
                {activeChild.name}&apos;s dashboard
              </h1>
              <p className="max-w-2xl text-sm text-black/65 sm:text-base">
                Today&apos;s care snapshot, quick insights, and one-tap access
                to the most useful tools.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {summaryCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-3"
                  >
                    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-2xl bg-olive/10 text-olive">
                      <Icon size={18} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60">
                      {card.title}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-black">
                      {card.value}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="space-y-4 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <Sparkles size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">
                  Insights
                </p>
                <h2 className="serif text-2xl font-semibold text-black">
                  What stands out today
                </h2>
              </div>
            </div>
            <div className="grid gap-3">
              {insights.map((insight) => (
                <div
                  key={insight}
                  className="rounded-3xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 text-sm text-black/70"
                >
                  {insight}
                </div>
              ))}
              {insights.length === 0 ? (
                <div className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-3 text-sm text-black/60">
                  Add more activity logs to unlock richer day-by-day insights.
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="space-y-4 p-5 sm:p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
              Today&apos;s Activity
            </p>
            <div className="space-y-3">
              {todayActivity.map((item) => (
                <div
                  key={item.title}
                  className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-3"
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-black/60">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm text-black/60">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                Explore Features
              </p>
              <p className="mt-1 text-sm text-black/60">
                Jump straight into logging and analysis tools.
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {featureLinks.map((feature) => {
              const Icon = feature.icon;

              return (
                <Link
                  key={feature.href}
                  href={feature.href}
                  className="rounded-3xl border border-black/5 bg-warm-bg px-4 py-4 transition hover:border-olive/20 hover:bg-white"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-olive/10 text-olive">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-black">{feature.title}</p>
                      <p className="mt-1 text-sm text-black/60">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </main>
  );
}
