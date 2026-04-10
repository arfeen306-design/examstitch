export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 bg-[var(--bg-elevated)] rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-24 bg-[var(--bg-surface)] rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="h-60 bg-[var(--bg-surface)] rounded-2xl" />
        <div className="h-60 bg-[var(--bg-surface)] rounded-2xl" />
      </div>
    </div>
  );
}
