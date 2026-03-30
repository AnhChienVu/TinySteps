import { Card } from '@/components/UI';
import {
  Baby,
  Heart,
  Users,
  TrendingUp,
  Bell,
  MessageSquare,
} from 'lucide-react';
import MotionDiv from '@/components/MotionDiv';
import MotionHeaderLandingPage from '@/components/MotionHeaderLandingPage';
export default function Main() {
  return (
    <div className="min-h-screen overflow-hidden bg-warm-bg">
      <header className="relative px-6 pb-24 pt-16 text-center">
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-2xl"
        >
          <MotionHeaderLandingPage />
        </MotionDiv>
        <div className="absolute left-10 top-20 animate-pulse opacity-10">
          <Baby size={120} />
        </div>
        <div className="absolute bottom-10 right-10 animate-pulse opacity-10 delay-700">
          <Heart size={100} />
        </div>
      </header>

      <section className="bg-white px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="serif mb-4 text-4xl font-bold">
              Everything You Need
            </h2>
            <p className="text-black/40">Designed by parents, for parents.</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                title: 'Smart Insights',
                desc: 'AI-powered trends and actionable advice.',
              },
              {
                icon: Users,
                title: 'Multi-Caregiver',
                desc: 'Share updates with partners and nannies.',
              },
              {
                icon: Bell,
                title: 'Smart Reminders',
                desc: 'Never miss a feeding or medication.',
              },
              {
                icon: MessageSquare,
                title: 'AI Assistant',
                desc: '24/7 support for your parenting questions.',
              },
            ].map((feature, index) => (
              <MotionDiv
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-olive/5">
                    <feature.icon className="text-olive" />
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-black/40">
                    {feature.desc}
                  </p>
                </Card>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-warm-bg px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h2 className="serif mb-12 text-4xl font-bold italic text-black/70">
            &quot;TinySteps turned our chaotic first months into a beautifully
            organized journey.&quot;
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full bg-black/10" />
            <div className="text-left">
              <p className="font-bold">Sarah &amp; Michael</p>
              <p className="text-xs uppercase tracking-widest text-black/40">
                Parents of Leo, 4 months
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-black/5 px-6 py-12 text-center text-sm text-black/30">
        <p>© 2026 TinySteps. Built with love for the next generation.</p>
      </footer>
    </div>
  );
}
