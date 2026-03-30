'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { CircleAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button, Card } from '@/components/UI';
import type { Child } from '@/types';

type ActivityLogPageProps = {
  loading: boolean;
  activeChild: Child | null;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  loadingLabel: string;
  missingChildLabel: string;
  recentTitle: string;
  recentSubtitle: string;
  recentContent: ReactNode;
  formContent: ReactNode;
  backHref?: string;
  footerHref?: string;
  footerLabel?: string;
  statsHref?: string;
  statsTitle?: string;
  statsDescription?: string;
};

export default function ActivityLogPage({
  loading,
  activeChild,
  icon: Icon,
  eyebrow,
  title,
  description,
  loadingLabel,
  missingChildLabel,
  recentTitle,
  recentSubtitle,
  recentContent,
  formContent,
  backHref = '/dashboard',
  footerHref = '/dashboard',
  footerLabel = 'Back to dashboard',
  statsHref,
  statsTitle,
  statsDescription,
}: ActivityLogPageProps) {
  const router = useRouter();

  if (loading) {
    return (
      <main className="mx-auto flex h-full min-h-full w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">{loadingLabel}</Card>
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
            <p className="text-black/50">{missingChildLabel}</p>
          </div>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push(backHref)}
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

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid w-full gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]"
      >
        <Card className="space-y-6 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-olive/10 text-olive">
              <Icon size={24} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
                {eyebrow}
              </p>
              <h2 className="serif text-3xl font-semibold text-black">
                {title}
              </h2>
              <p className="text-sm text-black/50">
                {description.replace('{name}', activeChild.name)}
              </p>
            </div>
          </div>

          {formContent}
        </Card>

        <Card className="space-y-4 p-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-olive">
              {recentTitle}
            </p>
            <p className="text-sm text-black/45">
              {recentSubtitle.replace('{name}', activeChild.name)}
            </p>
          </div>
          <div className="space-y-3">{recentContent}</div>
          <Link href={footerHref} className="text-sm font-medium text-olive">
            {footerLabel}
          </Link>
        </Card>
      </motion.div>

      {statsHref && statsTitle && statsDescription ? (
        <Link
          href={statsHref}
          className="mt-4 block rounded-[28px] border border-indigo-100 bg-indigo-50 p-4 transition-transform active:scale-[0.99]"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
                <Icon size={20} />
              </div>
              <div>
                <p className="font-bold text-sm text-indigo-900">{statsTitle}</p>
                <p className="text-xs text-indigo-900/40">{statsDescription}</p>
              </div>
            </div>
          </div>
        </Link>
      ) : null}
    </main>
  );
}
