import { redirect } from 'next/navigation';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/server';
import { 
  getStudentAccountByAuthId, 
  getUserProgress, 
  countResourcesByLevel 
} from '@/lib/supabase/queries';
import ResourceCard from '@/components/resources/ResourceCard';
import { LayoutDashboard, Clock, CheckCircle, GraduationCap } from 'lucide-react';

const ProgressStats = nextDynamic(() => import('@/components/dashboard/ProgressStats'), { 
  ssr: false,
  loading: () => <div className="h-40 rounded-2xl animate-pulse bg-gray-100" />
});

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?redirectTo=/dashboard');
  }

  const student = await getStudentAccountByAuthId(user.id);
  
  if (!student) {
    // If auth user exists but no student record, they might be an admin or public user
    // For this scope, redirect back to home or a restricted page
    redirect('/');
  }

  // Fetch progress and total resources for the student's level
  const [progress, totalResources] = await Promise.all([
    getUserProgress(student.id),
    countResourcesByLevel(student.level || 'olevel')
  ]);

  const completedCount = progress.filter(p => p.is_completed).length;
  const recentlyViewed = progress.slice(0, 5);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ backgroundColor: 'var(--bg-subtle)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ color: 'var(--text-primary)' }}>
            Welcome back, {student.full_name.split(' ')[0]}!
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Track your progress and continue your learning journey in <span className="font-bold uppercase">{student.level}</span>.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content (2/3) */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ProgressStats completed={completedCount} total={totalResources} />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl p-6 border flex flex-col justify-center" 
                     style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" 
                       style={{ backgroundColor: 'var(--accent-subtle)' }}>
                    <CheckCircle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{completedCount}</div>
                  <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Completed</div>
                </div>

                <div className="rounded-2xl p-6 border flex flex-col justify-center" 
                     style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" 
                       style={{ backgroundColor: '#FFF7ED' }}>
                    <Clock className="w-5 h-5" style={{ color: 'var(--cta-orange)' }} />
                  </div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{progress.length}</div>
                  <div className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Interacted</div>
                </div>
              </div>
            </div>

            {/* Recently Viewed */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                  <Clock className="w-5 h-5" style={{ color: 'var(--cta-orange)' }} />
                  Recently Viewed
                </h2>
              </div>
              
              {recentlyViewed.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentlyViewed.map((p, idx) => (
                    <ResourceCard 
                      key={p.id}
                      title={p.resource.title}
                      description={p.resource.description || ''}
                      contentType={p.resource.content_type}
                      href={`/view/${p.resource.id}`}
                      subject={p.resource.subject}
                      index={idx}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl p-12 border border-dashed text-center" 
                     style={{ borderColor: 'var(--border-color)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>You haven&apos;t viewed any resources yet.</p>
                  <Link href="/" className="inline-block mt-4 text-sm font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
                    Start exploring resources
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">
            <div className="rounded-2xl p-6 border" 
                 style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-subtle)' }}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <GraduationCap className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                Academic Info
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                    Current Level
                  </div>
                  <div className="text-sm font-semibold py-2 px-3 rounded-lg border uppercase" 
                       style={{ backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)', borderColor: 'var(--border-subtle)' }}>
                    {student.level}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-muted)' }}>
                    Account Status
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    <span style={{ color: 'var(--text-primary)' }}>Active Student</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 gradient-gold text-white">
              <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Need Help?</h3>
              <p className="text-xs mb-4 opacity-90" style={{ color: 'var(--text-primary)' }}>
                Connect with our tutors for personalized sessions and doubt clearing.
              </p>
              <Link href="/demo" className="inline-block px-4 py-2 bg-white rounded-lg text-xs font-bold shadow-sm hover:shadow-md transition-all" style={{ color: '#1A2B56' }}>
                Book a Demo
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
