import Link from 'next/link';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog — ExamStitch',
  description: 'Study tips, exam strategies, and Cambridge Mathematics insights from the ExamStitch team.',
};

const COMING_SOON_POSTS = [
  {
    title: 'How to Score A* in Cambridge A-Level Mathematics',
    excerpt: 'A comprehensive guide covering study techniques, time management, and the most commonly tested topics in Paper 1 and Paper 3.',
    category: 'Study Tips',
    readTime: '8 min read',
  },
  {
    title: '5 Common Mistakes Students Make in Probability & Statistics',
    excerpt: 'From misreading conditional probability questions to forgetting the continuity correction — learn how to avoid these pitfalls.',
    category: 'Paper 5',
    readTime: '6 min read',
  },
  {
    title: 'The Ultimate O-Level Math Revision Checklist',
    excerpt: 'A topic-by-topic checklist for Cambridge O-Level Mathematics (4024) to ensure you don\'t miss anything before exam day.',
    category: 'Revision',
    readTime: '5 min read',
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      {/* Hero */}
      <div className="gradient-hero py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full mb-4">
            <BookOpen className="w-4 h-4 text-gold-400" />
            <span className="text-xs font-medium text-gold-400 uppercase tracking-wider">ExamStitch Blog</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Insights & Study Guides
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Expert tips, exam strategies, and deep-dives into Cambridge Mathematics — written by tutors who've been through it.
          </p>
        </div>
      </div>

      {/* Coming Soon Articles */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="space-y-5">
          {COMING_SOON_POSTS.map((post, i) => (
            <div
              key={i}
              className="bg-white border border-navy-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {/* Coming Soon overlay */}
              <div className="absolute top-4 right-4">
                <span className="bg-gold-100 text-gold-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Coming Soon
                </span>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs font-medium text-navy-500 bg-navy-50 px-2.5 py-0.5 rounded-full">
                  {post.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-navy-400">
                  <Clock className="w-3 h-3" /> {post.readTime}
                </span>
              </div>

              <h2 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-gold-600 transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-navy-500 leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 text-center bg-gradient-to-br from-navy-900 to-navy-800 rounded-2xl p-8 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-2">Want to be notified when we publish?</h3>
          <p className="text-sm text-white/60 mb-5">Join our mailing list — we'll send you study guides and exam tips directly.</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-900 font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            Subscribe <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
