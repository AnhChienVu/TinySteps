import {
  Baby,
  Milk,
  Moon,
  Plus,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export type ProtectedNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  isPrimary?: boolean;
  match?: string[];
};

export const protectedNavItems: ProtectedNavItem[] = [
  {
    label: 'Home',
    href: '/dashboard',
    icon: Baby,
    match: ['/dashboard'],
  },
  {
    label: 'Feed',
    href: '/feeding',
    icon: Milk,
    match: ['/feeding'],
  },
  {
    label: 'Add',
    href: '/children/new',
    icon: Plus,
    isPrimary: true,
    match: ['/children/new'],
  },
  {
    label: 'Sleep',
    href: '/sleep',
    icon: Moon,
    match: ['/sleep'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    match: ['/settings'],
  },
];

export type QuickActionItem = {
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export const quickActionItems: QuickActionItem[] = [
  {
    label: 'Feeding',
    description: 'Log a bottle, nursing session, or meal.',
    href: '/feeding',
    icon: Milk,
  },
  {
    label: 'Sleep',
    description: 'Track naps, bedtime, and wake-ups.',
    href: '/sleep',
    icon: Moon,
  },
  {
    label: 'Add Baby',
    description: 'Create a child profile and get started.',
    href: '/children/new',
    icon: Plus,
  },
  {
    label: 'Settings',
    description: 'Adjust account and caregiver preferences.',
    href: '/settings',
    icon: Settings,
  },
  {
    label: 'Dashboard',
    description: 'Jump back to your overview and insights.',
    href: '/dashboard',
    icon: Sparkles,
  },
];
