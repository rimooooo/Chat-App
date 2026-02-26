export default function SkeletonLoader() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
        <div className="flex flex-col gap-2">
          <div className="w-32 h-3 bg-gray-200 rounded animate-pulse" />
          <div className="w-20 h-2 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 p-4 space-y-4">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${
              i % 2 === 0 ? "flex-row" : "flex-row-reverse"
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />
            <div
              className={`h-10 rounded-2xl bg-gray-200 animate-pulse ${
                i % 2 === 0 ? "w-48" : "w-36"
              }`}
            />
          </div>
        ))}
      </div>

      {/* Input Skeleton */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="w-full h-10 rounded-full bg-gray-200 animate-pulse" />
      </div>
    </div>
  );
}