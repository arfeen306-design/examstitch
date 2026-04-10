export default function CSBulkUploadLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-[var(--bg-elevated)] rounded-lg" />
      <div className="h-40 bg-[var(--bg-surface)] rounded-2xl" />
      <div className="h-32 bg-[var(--bg-surface)] rounded-2xl" />
    </div>
  );
}
