'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CircleAlert,
  HeartPulse,
  Moon,
  TrendingUp,
  Milk,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/UI';
import { useActiveChild } from '@/components/ActiveChildProvider';
import {
  subscribeToFeedings,
  subscribeToHealthLogs,
  subscribeToSleeps,
} from '@/lib/services/children-service';
import type { Feeding, Health, Sleep } from '@/types';

function getLocalDayKey(value?: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return getLocalDayKey(new Date().toISOString());
}

function isOnDay(value: string | undefined, dayKey: string) {
  return getLocalDayKey(value) === dayKey;
}

function getDayBounds(dayKey: string) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  return { start, end };
}

function formatTimestamp(value?: string) {
  if (!value) return 'Not available';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Invalid date';

  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatMinutes(totalMinutes: number) {
  if (totalMinutes <= 0) return '0m';

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

function getSleepDurationMinutes(log: Sleep) {
  const start = new Date(log.startTime).getTime();
  const end = new Date(log.endTime ?? new Date().toISOString()).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    return 0;
  }

  return Math.round((end - start) / 60000);
}

function getLastSevenDays() {
  const days: string[] = [];
  const today = new Date();

  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    days.push(getLocalDayKey(date.toISOString()));
  }

  return days;
}

function getSleepMinutesWithinDay(log: Sleep, dayKey: string) {
  const start = new Date(log.startTime);
  const end = new Date(log.endTime ?? new Date().toISOString());

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }

  const bounds = getDayBounds(dayKey);
  const overlapStart = Math.max(start.getTime(), bounds.start.getTime());
  const overlapEnd = Math.min(end.getTime(), bounds.end.getTime());

  if (overlapEnd <= overlapStart) {
    return 0;
  }

  return Math.round((overlapEnd - overlapStart) / 60000);
}

function doesSleepOverlapDay(log: Sleep, dayKey: string) {
  return getSleepMinutesWithinDay(log, dayKey) > 0;
}

function formatAmount(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getFeedingAmountSummary(feedings: Feeding[]) {
  const totals = new Map<string, number>();

  feedings.forEach((feeding) => {
    if (typeof feeding.amount !== 'number' || feeding.amount <= 0 || !feeding.unit) {
      return;
    }

    const nextValue = (totals.get(feeding.unit) ?? 0) + feeding.amount;
    totals.set(feeding.unit, nextValue);
  });

  const parts = Array.from(totals.entries()).map(
    ([unit, total]) => `${formatAmount(total)} ${unit}`,
  );

  if (parts.length === 0) {
    return {
      headline: 'No data',
      subtitle: 'No measurable amount recorded today',
    };
  }

  if (parts.length === 1) {
    return {
      headline: parts[0],
      subtitle: 'total recorded in one unit today',
    };
  }

  const visibleParts = parts.slice(0, 2).join(' + ');
  const remainingUnits = parts.length - 2;

  return {
    headline: remainingUnits > 0 ? `${visibleParts} +${remainingUnits}` : visibleParts,
    subtitle: 'combined by recorded unit today',
  };
}

export default function StatsPage() {
  const { childrenList, activeChildId, loading } = useActiveChild();
  const activeChild =
    childrenList.find((child) => child.id === activeChildId) ?? null;
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [sleepLogs, setSleepLogs] = useState<Sleep[]>([]);
  const [healthLogs, setHealthLogs] = useState<Health[]>([]);

  useEffect(() => {
    if (!activeChild) {
      return;
    }

    const unsubscribeFeedings = subscribeToFeedings(activeChild.id, setFeedings);
    const unsubscribeSleeps = subscribeToSleeps(activeChild.id, setSleepLogs);
    const unsubscribeHealth = subscribeToHealthLogs(activeChild.id, setHealthLogs);

    return () => {
      unsubscribeFeedings();
      unsubscribeSleeps();
      unsubscribeHealth();
    };
  }, [activeChild]);

  const sortedFeedings = useMemo(
    () => [...feedings].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [feedings],
  );
  const sortedSleeps = useMemo(
    () => [...sleepLogs].sort((a, b) => b.startTime.localeCompare(a.startTime)),
    [sleepLogs],
  );
  const todayKey = useMemo(() => getTodayKey(), []);

  const todayFeedings = useMemo(
    () => sortedFeedings.filter((feeding) => isOnDay(feeding.timestamp, todayKey)),
    [sortedFeedings, todayKey],
  );
  const todaySleeps = useMemo(
    () => sortedSleeps.filter((sleep) => doesSleepOverlapDay(sleep, todayKey)),
    [sortedSleeps, todayKey],
  );
  const sortedHealthLogs = useMemo(
    () => [...healthLogs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [healthLogs],
  );
  const todayHealthLogs = useMemo(
    () => sortedHealthLogs.filter((item) => isOnDay(item.timestamp, todayKey)),
    [sortedHealthLogs, todayKey],
  );

  const feedingAmountSummary = useMemo(
    () => getFeedingAmountSummary(todayFeedings),
    [todayFeedings],
  );
  const totalSleepMinutesToday = useMemo(
    () =>
      todaySleeps.reduce(
        (sum, sleep) => sum + getSleepMinutesWithinDay(sleep, todayKey),
        0,
      ),
    [todayKey, todaySleeps],
  );

  const dailyTrend = useMemo(() => {
    const keys = getLastSevenDays();

    return keys.map((key) => {
      const feedingCount = feedings.filter((item) => isOnDay(item.timestamp, key)).length;
      const sleepMinutes = sleepLogs
        .reduce((sum, item) => sum + getSleepMinutesWithinDay(item, key), 0);

      return {
        key,
        label: new Date(`${key}T00:00:00`).toLocaleDateString([], {
          weekday: 'short',
        }),
        feedingCount,
        sleepMinutes,
      };
    });
  }, [feedings, sleepLogs]);

  const maxFeedings = Math.max(...dailyTrend.map((day) => day.feedingCount), 1);
  const maxSleepMinutes = Math.max(...dailyTrend.map((day) => day.sleepMinutes), 1);

  if (loading) {
    return (
      <main className="mx-auto flex h-full min-h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md text-center">Loading stats...</Card>
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
              Choose a child first to see feeding and sleep trends.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex rounded-full bg-olive px-6 py-3 font-medium text-white"
          >
            Back to dashboard
          </Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <Card className="space-y-5 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-olive/10 text-olive">
              <BarChart3 size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                Stats
              </p>
              <h2 className="serif text-3xl font-semibold text-black">
                {activeChild.name}&apos;s trends
              </h2>
              <p className="text-sm text-black/50">
                A quick view of feeding and sleep patterns from your recent logs.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl bg-warm-bg px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Feedings Today
              </p>
              <p className="mt-2 text-3xl font-semibold text-black">
                {todayFeedings.length}
              </p>
            </div>
            <div className="rounded-3xl bg-warm-bg px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Amount Today
              </p>
              <p className="mt-2 text-2xl font-semibold text-black">
                {feedingAmountSummary.headline}
              </p>
              <p className="text-sm text-black/45">{feedingAmountSummary.subtitle}</p>
            </div>
            <div className="rounded-3xl bg-warm-bg px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Sleep Sessions
              </p>
              <p className="mt-2 text-3xl font-semibold text-black">
                {todaySleeps.length}
              </p>
            </div>
            <div className="rounded-3xl bg-warm-bg px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Sleep Today
              </p>
              <p className="mt-2 text-3xl font-semibold text-black">
                {formatMinutes(totalSleepMinutesToday)}
              </p>
            </div>
            <div className="rounded-3xl bg-warm-bg px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/35">
                Health Notes
              </p>
              <p className="mt-2 text-3xl font-semibold text-black">
                {todayHealthLogs.length}
              </p>
              <p className="text-sm text-black/45">logged today</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
          <Card className="space-y-4 p-6">
            <div className="flex items-center gap-3">
              <TrendingUp size={20} className="text-olive" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                  Weekly Trends
                </p>
                <p className="text-sm text-black/45">
                  Feedings and sleep totals for the last 7 days.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              {dailyTrend.map((day) => (
                <div key={day.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium text-black">{day.label}</p>
                    <p className="text-black/45">
                      {day.feedingCount} feedings, {formatMinutes(day.sleepMinutes)} sleep
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-olive"
                        style={{ width: `${(day.feedingCount / maxFeedings) * 100}%` }}
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-black/5">
                      <div
                        className="h-full rounded-full bg-sky-400"
                        style={{ width: `${(day.sleepMinutes / maxSleepMinutes) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Milk size={20} className="text-olive" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                    Latest Feeding
                  </p>
                  <p className="text-sm text-black/45">
                    Pulled live from the feeding log.
                  </p>
                </div>
              </div>
              {sortedFeedings[0] ? (
                <div className="rounded-3xl bg-warm-bg px-4 py-4">
                  <p className="font-semibold capitalize text-black">
                    {sortedFeedings[0].type}
                  </p>
                  <p className="mt-1 text-sm text-black/55">
                    {sortedFeedings[0].amount
                      ? `${sortedFeedings[0].amount} ${sortedFeedings[0].unit}`
                      : 'No amount entered'}
                  </p>
                  <p className="mt-1 text-sm text-black/45">
                    {formatTimestamp(sortedFeedings[0].timestamp)}
                  </p>
                </div>
              ) : (
                <p className="rounded-3xl bg-warm-bg px-4 py-4 text-sm text-black/45">
                  No feeding data yet.
                </p>
              )}
              <Link href="/feeding" className="text-sm font-medium text-olive">
                Open feeding log
              </Link>
            </Card>

            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <Moon size={20} className="text-olive" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                    Latest Sleep
                  </p>
                  <p className="text-sm text-black/45">
                    Connected to your recent sleep entries.
                  </p>
                </div>
              </div>
              {sortedSleeps[0] ? (
                <div className="rounded-3xl bg-warm-bg px-4 py-4">
                  <p className="font-semibold text-black">
                    Started {formatTimestamp(sortedSleeps[0].startTime)}
                  </p>
                  <p className="mt-1 text-sm text-black/55">
                    Duration {formatMinutes(getSleepDurationMinutes(sortedSleeps[0]))}
                  </p>
                  <p className="mt-1 text-sm text-black/45">
                    Ended {formatTimestamp(sortedSleeps[0].endTime)}
                  </p>
                </div>
              ) : (
                <p className="rounded-3xl bg-warm-bg px-4 py-4 text-sm text-black/45">
                  No sleep data yet.
                </p>
              )}
              <Link href="/sleep" className="text-sm font-medium text-olive">
                Open sleep log
              </Link>
            </Card>

            <Card className="space-y-4 p-6">
              <div className="flex items-center gap-3">
                <HeartPulse size={20} className="text-olive" />
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                    Latest Health Note
                  </p>
                  <p className="text-sm text-black/45">
                    Recent symptoms, medications, and check-ins.
                  </p>
                </div>
              </div>
              {sortedHealthLogs[0] ? (
                <div className="rounded-3xl bg-warm-bg px-4 py-4">
                  <p className="font-semibold text-black">
                    {sortedHealthLogs[0].title}
                  </p>
                  <p className="mt-1 text-sm capitalize text-black/55">
                    {sortedHealthLogs[0].type}
                  </p>
                  <p className="mt-1 text-sm text-black/45">
                    {formatTimestamp(sortedHealthLogs[0].timestamp)}
                  </p>
                </div>
              ) : (
                <p className="rounded-3xl bg-warm-bg px-4 py-4 text-sm text-black/45">
                  No health data yet.
                </p>
              )}
              <Link href="/health" className="text-sm font-medium text-olive">
                Open health log
              </Link>
            </Card>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
