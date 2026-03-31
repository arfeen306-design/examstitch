import { Metadata } from 'next';
import { GraduationCap, CheckCircle, Clock, MessageCircle } from 'lucide-react';
import DemoBookingForm from '@/components/demo/DemoBookingForm';

export const metadata: Metadata = {
  title: 'Book a Free Demo | ExamStitch',
  description: 'Book a free 1-on-1 demo session with an ExamStitch tutor. We cover O-Level, AS and A2 Cambridge Maths, Physics, Computer Science, Chemistry and Biology.',
};

const perks = [
  { icon: Clock,          text: '30-minute live session via video call' },
  { icon: CheckCircle,    text: 'Personalised to your paper and weak topics' },
  { icon: MessageCircle,  text: 'Follow-up resources sent directly on WhatsApp' },
  { icon: GraduationCap,  text: 'Available for O-Level, AS, and A2 Level' },
];

export default function DemoPage() {
  return (
    <main
      className="min-h-screen py-20 px-4"
      style={{ backgroundColor: 'var(--bg-primary)' }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Page header */}
        <div className="text-center mb-12">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-4"
            style={{ backgroundColor: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}
          >
            Free Demo Session
          </span>
          <h1
            className="text-4xl sm:text-5xl font-extrabold leading-tight mb-4"
            style={{ color: 'var(--text-primary)' }}
          >
            Book Your Free{' '}
            <span style={{ color: '#FF6B35' }}>1-on-1 Demo</span>
          </h1>
          <p
            className="text-lg max-w-xl mx-auto leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}
          >
            See exactly how ExamStitch works for your subject. One session, no commitment.
            We&apos;ll contact you on WhatsApp within 24 hours to confirm.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">

          {/* Left — perks */}
          <div className="space-y-6">
            <div
              className="rounded-3xl p-8"
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                boxShadow: '0 4px 24px var(--shadow-color)',
              }}
            >
              <h2
                className="text-xl font-bold mb-6"
                style={{ color: 'var(--text-primary)' }}
              >
                What you get in your demo
              </h2>
              <ul className="space-y-4">
                {perks.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: 'rgba(255,107,53,0.1)' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: '#FF6B35' }} />
                    </span>
                    <span className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social proof */}
            <div
              className="rounded-2xl px-6 py-4 flex items-center gap-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,107,53,0.03))',
                border: '1px solid rgba(255,107,53,0.15)',
              }}
            >
              <div className="flex -space-x-2">
                {['Z', 'A', 'S', 'M'].map((letter, i) => (
                  <div
                    key={letter}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: ['#FF6B35','#0EA5E9','#22C55E','#A855F7'][i], zIndex: 4 - i }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>200+ students</strong> have already
                booked their free demo this year.
              </p>
            </div>
          </div>

          {/* Right — form */}
          <div
            className="rounded-3xl p-8 sm:p-10"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 4px 24px var(--shadow-color)',
            }}
          >
            <h2
              className="text-xl font-bold mb-6"
              style={{ color: 'var(--text-primary)' }}
            >
              Fill in your details
            </h2>
            <DemoBookingForm />
          </div>
        </div>
      </div>
    </main>
  );
}
