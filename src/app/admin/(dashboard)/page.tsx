import { Layers, Box, Eye, MessageSquare } from 'lucide-react';

export default function AdminOverview() {
  const stats = [
    { label: 'Total Resources', value: '142', icon: Box, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Categories active', value: '28', icon: Layers, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Public Views', value: '3,492', icon: Eye, color: 'text-purple-500', bg: 'bg-purple-50' },
    { label: 'Waitlist Subs', value: '56', icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 tracking-tight">System Overview</h2>
        <p className="text-sm text-navy-500">Welcome back, Administrator.</p>
      </div>

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
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-navy-900">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="bg-white rounded-2xl border border-navy-50 p-6 mt-8 shadow-sm">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Quick Actions</h3>
        <p className="text-sm text-navy-500 mb-6">Use the sidebar to navigate to the bulk ingestion or subscriber lists.</p>
      </div>
    </div>
  );
}
