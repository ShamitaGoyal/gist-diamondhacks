import type { ReactNode } from 'react';

interface ExplainSectionProps {
  step: number;
  title: string;
  hint?: string;
  children: ReactNode;
}

export function ExplainSection({ step, title, hint, children }: ExplainSectionProps) {
  return (
    <section
      className="overflow-hidden rounded-[4px] border"
      style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
    >
      <header
        className="flex items-start gap-2 border-b px-3 py-2"
        style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
      >
        <div
          className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold tabular-nums"
          style={{
            borderColor: 'var(--lens-accent)',
            color: 'var(--lens-accent)',
            fontFamily: 'var(--lens-font-mono)'
          }}
          aria-hidden
        >
          {step}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3
            className="text-[12px] leading-tight"
            style={{ fontFamily: 'var(--lens-font-body)', fontWeight: 600, color: 'var(--lens-fg)' }}
          >
            {title}
          </h3>
          {hint ? (
            <p
              className="mt-0.5 text-[10px] leading-snug text-[var(--lens-muted)]"
              style={{ fontFamily: 'var(--lens-font-body)' }}
            >
              {hint}
            </p>
          ) : null}
        </div>
      </header>
      <div className="p-3">{children}</div>
    </section>
  );
}
