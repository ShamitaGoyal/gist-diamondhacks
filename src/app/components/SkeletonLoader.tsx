export function SkeletonLoader() {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4 animate-pulse">
      <div
        className="h-4 bg-gradient-to-r from-[#EEF2FF] via-[#6366F1]/20 to-[#EEF2FF] rounded mb-4"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmer 2s infinite linear'
        }}
      ></div>
      <div className="flex gap-3 mb-4">
        <div className="h-10 w-32 bg-[#EEF2FF] rounded-[4px]"></div>
        <div className="h-10 w-32 bg-[#F0FDFA] rounded-[4px]"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-[#F1F5F9] rounded w-full"></div>
        <div className="h-3 bg-[#F1F5F9] rounded w-4/5"></div>
      </div>
    </div>
  );
}
