export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-56 bg-[var(--bg-elevated)] rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-[var(--bg-surface)] rounded-2xl" />
        ))}
      </div>
      <div className="h-64 bg-[var(--bg-surface)] rounded-2xl" />
    </div>
  );
}
