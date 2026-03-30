'use client';

import { motion } from 'framer-motion';
import { Mail, MessageCircle, Send, MapPin, Clock } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.1 },
  }),
};

const WA_NUMBER = '923005093306';
const WA_URL = `https://wa.me/${WA_NUMBER}?text=Hi%20ExamStitch%20Team!`;

const contacts = [
  {
    icon: Mail,
    label: 'General Inquiries',
    value: 'info@examstitch.com',
    href: 'mailto:info@examstitch.com',
    color: 'var(--accent, #D4AF37)',
    bgColor: 'var(--accent-subtle, #FDF8EB)',
  },
  {
    icon: Mail,
    label: 'Founder',
    value: 'zain@examstitch.com',
    href: 'mailto:zain@examstitch.com',
    color: 'var(--accent, #D4AF37)',
    bgColor: 'var(--accent-subtle, #FDF8EB)',
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: '+92 300 509 3306',
    href: WA_URL,
    color: '#25D366',
    bgColor: 'rgba(37, 211, 102, 0.08)',
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Hero */}
      <div className="gradient-hero py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.div
              variants={fadeUp}
              custom={0}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <Send className="w-3 h-3" />
              Get in Touch
            </motion.div>

            <motion.h1
              variants={fadeUp}
              custom={1}
              className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight"
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              Contact Us
            </motion.h1>

            <motion.p
              variants={fadeUp}
              custom={2}
              className="text-lg max-w-2xl mx-auto"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              Have a question about our resources, need help with a topic, or want to
              collaborate? We&apos;d love to hear from you.
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Contact Cards */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          {contacts.map((c, i) => (
            <motion.a
              key={c.label}
              variants={fadeUp}
              custom={i + 3}
              href={c.href}
              target={c.href.startsWith('https') ? '_blank' : undefined}
              rel={c.href.startsWith('https') ? 'noopener noreferrer' : undefined}
              className="group block rounded-2xl p-6 transition-all duration-300
                         hover:shadow-lg hover:-translate-y-1"
              style={{
                backgroundColor: 'var(--bg-card, white)',
                border: '1px solid var(--border-subtle, #E8EAF0)',
                boxShadow: '0 2px 8px var(--shadow-color, rgba(0,0,0,0.06))',
              }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4
                           group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: c.bgColor }}
              >
                <c.icon className="w-5 h-5" style={{ color: c.color }} />
              </div>

              {/* Label */}
              <p
                className="text-xs font-semibold uppercase tracking-widest mb-1"
                style={{ color: 'var(--text-muted, #596993)' }}
              >
                {c.label}
              </p>

              {/* Value */}
              <p
                className="text-base font-semibold group-hover:underline underline-offset-4 decoration-1 transition-colors"
                style={{ color: 'var(--text-primary, #1A2B56)' }}
              >
                {c.value}
              </p>
            </motion.a>
          ))}
        </motion.div>

        {/* Extra Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-12 rounded-2xl p-8 text-center"
          style={{
            backgroundColor: 'var(--bg-surface, #F8F9FB)',
            border: '1px solid var(--border-subtle, #E8EAF0)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary, #3B4F80)' }}>
              <MapPin className="w-4 h-4" style={{ color: 'var(--accent, #D4AF37)' }} />
              <span>Islamabad, Pakistan</span>
            </div>
            <div className="flex items-center gap-2" style={{ color: 'var(--text-secondary, #3B4F80)' }}>
              <Clock className="w-4 h-4" style={{ color: 'var(--accent, #D4AF37)' }} />
              <span>Response within 24 hours</span>
            </div>
          </div>

          <p
            className="mt-4 text-sm"
            style={{ color: 'var(--text-muted, #596993)' }}
          >
            Whether it&apos;s a bug report, content request, or partnership inquiry —
            we read every message.
          </p>
        </motion.div>

        {/* Big WhatsApp CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-8 text-center"
        >
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full
                       text-white font-semibold text-base
                       transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={{
              backgroundColor: '#25D366',
              boxShadow: '0 6px 20px rgba(37, 211, 102, 0.35)',
            }}
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="white">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Message on WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  );
}
