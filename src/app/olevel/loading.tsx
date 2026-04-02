export default function OLevelLoading() {
  return (
    <div className="min-h-screen bg-gray-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="h-10 w-48 bg-gray-200 rounded-lg mb-4" />
        <div className="h-5 w-96 bg-gray-100 rounded-lg mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
