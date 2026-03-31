/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { cn } from '@/lib/utils';

export const Card = ({
  children,
  className,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'bg-white rounded-[32px] p-6 shadow-sm border border-black/5',
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  className,
  disabled,
  type,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
} & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const variants = {
    primary: 'bg-olive text-white hover:bg-olive/90',
    secondary: 'bg-white text-olive border border-olive/20 hover:bg-olive/5',
    outline: 'border border-black/10 hover:bg-black/5',
    ghost: 'hover:bg-black/5',
    danger: 'bg-red-50 text-red-600 hover:bg-red-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cn(
        'px-6 py-3 rounded-full font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input = ({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="space-y-1.5">
    <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-black/60">
      {label}
    </label>
    <input
      {...props}
      className="w-full px-4 py-3 rounded-2xl bg-black/5 border-transparent focus:bg-white focus:border-olive/20 focus:ring-0 transition-all outline-none"
    />
  </div>
);

export const Select = ({
  label,
  options,
  ...props
}: {
  label: string;
  options: { value: string; label: string }[];
} & React.SelectHTMLAttributes<HTMLSelectElement>) => (
  <div className="space-y-1.5">
    <label className="ml-1 text-xs font-semibold uppercase tracking-wider text-black/60">
      {label}
    </label>
    <select
      {...props}
      className="w-full px-4 py-3 rounded-2xl bg-black/5 border-transparent focus:bg-white focus:border-olive/20 focus:ring-0 transition-all outline-none appearance-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);
