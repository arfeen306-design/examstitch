import { createAdminClient } from '@/lib/supabase/admin';
import { requireSuperAdmin } from '@/lib/supabase/guards';
import { redirect } from 'next/navigation';
import { Globe, BookOpen, Users, Shield } from 'lucide-react';
import SuperAdminClient from './SuperAdminClient';

export const dynamic = 'force-dynamic';

export default async function SuperAdminPage() {
  const session = await requireSuperAdmin();
  if (!session) redirect('/admin/login');

  const supabase = createAdminClient();

  // Fetch all subjects
  const { data: subjects } = await supabase
    .from('subjects')
    .select('*')
    .order('name');

  // Fetch resource counts per subject
  const { data: resources } = await supabase
    .from('resources')
    .select('subject_id');

  // Fetch all admin accounts
  const { data: admins } = await supabase
    .from('student_accounts')
    .select('id, email, full_name, role, is_super_admin, managed_subjects')
    .eq('role', 'admin')
    .order('email');

  // Compute stats
  const subjectList = subjects ?? [];
  const resourceList = resources ?? [];
  const adminList = admins ?? [];

  const totalResources = resourceList.length;

  const perSubject = subjectList.map(s => ({
    ...s,
    resourceCount: resourceList.filter(r => r.subject_id === s.id).length,
  }));

  const totalAdmins = adminList.length;
  const superAdmins = adminList.filter(a => a.is_super_admin).length;

  const stats = [
    { label: 'Total Subjects', value: subjectList.length.toString(), icon: Globe, color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Total Resources', value: totalResources.toString(), icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Admin Users', value: totalAdmins.toString(), icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Super Admins', value: superAdmins.toString(), icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-navy-900 tracking-tight">Super Admin Control Center</h2>
        <p className="text-sm text-navy-500 mt-1">
          Welcome back, {session.email}. Global platform management.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white border border-navy-50 rounded-2xl p-6 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-navy-500">{stat.label}</p>
                <p className="text-2xl font-semibold text-navy-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Subject Breakdown */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-navy-50">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Subject Overview</h3>
        <div className="grid gap-3">
          {perSubject.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div>
                <p className="font-medium text-gray-900">{s.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{s.levels?.join(' · ')}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-gray-900">{s.resourceCount}</p>
                <p className="text-xs text-gray-500">resources</p>
              </div>
            </div>
          ))}
          {perSubject.length === 0 && (
            <p className="text-sm text-gray-400 py-4 text-center">No subjects configured.</p>
          )}
        </div>
      </div>

      {/* Client-side interactive panels */}
      <SuperAdminClient
        subjects={subjectList}
        admins={adminList.map(a => ({
          id: a.id,
          email: a.email,
          full_name: a.full_name,
          is_super_admin: a.is_super_admin,
          managed_subjects: (a.managed_subjects as string[]) ?? [],
        }))}
      />
    </div>
  );
}
