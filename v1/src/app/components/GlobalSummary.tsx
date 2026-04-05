import { Clock, Sparkles } from 'lucide-react';

interface GlobalSummaryProps {
  keyPoints: string[];
  readTime: number;
}

export function GlobalSummary({ keyPoints, readTime }: GlobalSummaryProps) {
  return (
    <div
      className="rounded-[4px] border p-4"
      style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--lens-accent)' }} />
        <h3
          className="text-[13px]"
          style={{ fontFamily: 'var(--lens-font-body)', fontWeight: 600, color: 'var(--lens-fg)' }}
        >
          At a glance
        </h3>
      </div>

      <p
        className="mb-3 text-[10px] text-[var(--lens-muted)]"
        style={{ fontFamily: 'var(--lens-font-mono)' }}
      >
        // KEY_TAKEAWAYS · read top to bottom
      </p>

      <div className="mb-3 space-y-2">
        {keyPoints.map((point, index) => (
          <div key={index} className="flex gap-2">
            <span
              className="mt-0.5 min-w-[1.25rem] text-[11px] tabular-nums text-[var(--lens-accent)]"
              style={{ fontFamily: 'var(--lens-font-mono)', fontWeight: 600 }}
            >
              {index + 1}.
            </span>
            <p
              className="text-[12px] leading-relaxed text-[var(--lens-fg)]"
              style={{ fontFamily: 'var(--lens-font-body)' }}
            >
              {point}
            </p>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-1.5 border-t pt-3"
        style={{ borderColor: 'var(--lens-border)' }}
      >
        <Clock className="h-3.5 w-3.5 text-[var(--lens-muted)]" />
        <span className="text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
          Estimated read time: {readTime} min
        </span>
      </div>
    </div>
  );
}
