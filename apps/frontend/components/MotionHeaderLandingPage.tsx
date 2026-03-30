'use client';
import { Button } from '@/components/UI';
import { Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MotionHeaderLandingPage() {
  const router = useRouter();

  function onGetStarted() {
    router.push('/auth');
  }
  return (
    <>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-olive/10 text-olive text-sm font-semibold mb-8">
        <Sparkles size={16} />
        The Smartest Way to Parent
      </div>
      <h1 className="serif text-6xl font-bold leading-tight mb-6">
        Every Step, <br />
        <span className="text-olive">Beautifully Tracked.</span>
      </h1>
      <p className="text-lg text-black/50 mb-10 leading-relaxed">
        TinySteps helps you track feeding, sleep, and health while providing
        AI-powered insights and shared caregiver support.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          onClick={onGetStarted}
          className="w-full sm:w-auto px-10 py-4 text-lg"
        >
          Get Started for Free
        </Button>
        <Button
          variant="outline"
          className="w-full sm:w-auto px-10 py-4 text-lg"
        >
          Watch Demo
        </Button>
      </div>
    </>
  );
}
