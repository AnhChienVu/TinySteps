'use client';

import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

type MotionDivProps = {
  children: ReactNode;
} & HTMLMotionProps<'div'>;

export default function MotionDiv({ children, ...props }: MotionDivProps) {
  return <motion.div {...props}>{children}</motion.div>;
}
