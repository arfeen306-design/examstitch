'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Search,
  GraduationCap,
  BookOpen,
  Award,
  ArrowRight,
  FileText,
  PlayCircle,
  Users,
  Star,
} from 'lucide-react';
import NotifyMeBox from '@/components/lead-gen/NotifyMeBox';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1 },
  }),
};

const levelCards = [
  {
    title: 'Pre O-Level',
    description: 'Build your foundation with core mathematical concepts',
    href: '/pre-olevel',
    icon: BookOpen,
    gradient: 'from-emerald-500 to-teal-600',
    count: 'Coming Soon',
  },
  {
    title: 'O-Level / IGCSE',
    description: 'Grade 9, 10 & 11 — Past papers, video solutions & topical worksheets',
    href: '/olevel',
    icon: GraduationCap,
    gradient: 'from-blue-500 to-indigo-600',
    count: 'Mathematics 4024',
  },
  {
    title: 'A-Level',
    description: 'AS & A2 Level — Paper 1 to Paper 4 with full video solutions',
    href: '/alevel',
    icon: Award,
    gradient: 'from-gold-500 to-gold-700',
    count: 'Mathematics 9709',
  },
];

const stats = [
  { icon: FileText, value: '500+', label: 'Past Papers' },
  { icon: PlayCircle, value: '200+', label: 'Video Solutions' },
  { icon: BookOpen, value: '50+', label: 'Topical Worksheets' },
  { icon: Users, value: '10K+', label: 'Students Helped' },
];

const SUBJECTS = ["Mathematics", "Computer Science", "Physics", "Chemistry"];

export default function HomePage() {
  const [subjectIndex, setSubjectIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSubjectIndex((prev) => (prev + 1) % SUBJECTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="gradient-hero relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-700/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
          <motion.div
            initial="hidden"
            animate="visible"
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full mb-8">
              <Star className="w-4 h-4 text-gold-500" />
              <span className="text-sm text-white/70">Free resources for Cambridge students</span>
            </motion.div>

            {/* Main heading */}
            <motion.h1 variants={fadeUp} custom={1} className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              <span className="sr-only">Master O & A-Level Mathematics, Computer Science, Physics, Chemistry</span>
              <div aria-hidden="true" className="flex flex-col md:flex-row items-center justify-center gap-x-4">
                <span>Master O & A-Level</span>
                <span className="relative inline-flex items-center justify-center md:justify-start w-[280px] sm:w-[350px] lg:w-[420px] h-[1.2em] overflow-hidden">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={subjectIndex}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="absolute text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600 text-center md:text-left whitespace-nowrap"
                    >
                      {SUBJECTS[subjectIndex]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </div>
            </motion.h1>

            <motion.p variants={fadeUp} custom={2} className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto mb-10">
              Past papers with video solutions, topical worksheets, and expert video lectures — organized by grade, paper, and topic.
            </motion.p>

            {/* Search Bar */}
            <motion.div variants={fadeUp} custom={3} className="max-w-xl mx-auto mb-12">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 group-focus-within:text-gold-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search past papers, topics, or videos..."
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/30 focus:outline-none focus:border-gold-500/50 focus:ring-2 focus:ring-gold-500/20 focus:bg-white/10 transition-all text-sm"
                />
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={fadeUp} custom={4} className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="w-5 h-5 text-gold-500 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/40">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 40L48 35C96 30 192 20 288 22C384 24 480 38 576 42C672 46 768 40 864 35C960 30 1056 26 1152 28C1248 30 1344 38 1392 42L1440 46V80H0V40Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* Level Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold text-navy-900 mb-3">
            Choose Your Level
          </motion.h2>
          <motion.p variants={fadeUp} custom={1} className="text-navy-500 max-w-lg mx-auto">
            Select your academic level to access organized resources for every paper and topic.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {levelCards.map((card, i) => (
            <motion.div key={card.title} variants={fadeUp} custom={i + 2}>
              <Link href={card.href} className="block group">
                <div className="card-hover relative overflow-hidden bg-white border border-navy-100 rounded-2xl p-8 h-full">
                  {/* Gradient accent top */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`} />

                  <div className={`w-14 h-14 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <card.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-bold text-navy-900 mb-2 group-hover:text-gold-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-navy-500 mb-4 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-navy-400 bg-navy-50 px-3 py-1 rounded-full">
                      {card.count}
                    </span>
                    <ArrowRight className="w-5 h-5 text-navy-300 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="bg-navy-50/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} custom={0} className="text-3xl font-bold text-navy-900 mb-3">
              How ExamStitch Works
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-navy-500 max-w-lg mx-auto">
              View past papers with instant video solutions — question by question.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { step: '01', title: 'Pick Your Paper', desc: 'Browse by grade, year, session, and variant.' },
              { step: '02', title: 'View & Print', desc: 'Open the paper in our built-in viewer. Print or download instantly.' },
              { step: '03', title: 'Watch Solutions', desc: 'Click any question number to jump directly to the video solution.' },
            ].map((item, i) => (
              <motion.div key={item.step} variants={fadeUp} custom={i + 2} className="text-center">
                <div className="w-12 h-12 gradient-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-navy-900">{item.step}</span>
                </div>
                <h3 className="text-lg font-semibold text-navy-900 mb-2">{item.title}</h3>
                <p className="text-sm text-navy-500">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Notify Me Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-xl mx-auto">
          <NotifyMeBox level="general" sourcePage="/" />
        </div>
      </section>
    </>
  );
}
