import { Clock, Sparkles } from 'lucide-react';

interface GlobalSummaryProps {
  keyPoints: string[];
  readTime: number; // in minutes
}

export function GlobalSummary({ keyPoints, readTime }: GlobalSummaryProps) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[4px] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-[#6366F1]" />
        <h3
          className="text-[14px] text-[#1E293B]"
          style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
        >
          Global Summary
        </h3>
      </div>

      <div className="space-y-2 mb-3">
        {keyPoints.map((point, index) => (
          <div key={index} className="flex gap-2">
            <span
              className="text-[12px] text-[#64748B] mt-0.5"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {index + 1}.
            </span>
            <p
              className="text-[12px] text-[#334155] leading-relaxed"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {point}
            </p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 pt-3 border-t border-[#E2E8F0]">
        <Clock className="w-3.5 h-3.5 text-[#64748B]" />
        <span
          className="text-[10px] text-[#64748B]"
          style={{ fontFamily: 'JetBrains Mono, monospace' }}
        >
          Estimated read time: {readTime} min
        </span>
      </div>
    </div>
  );
}
