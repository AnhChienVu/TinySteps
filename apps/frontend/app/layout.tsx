import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TinySteps - Child Care & Health Tracker',
  description:
    'A comprehensive app for parents to track feedings, sleep, health, and daily activities for their infants and young children.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
