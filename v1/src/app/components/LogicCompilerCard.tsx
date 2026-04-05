import { ArrowRight } from 'lucide-react';
import type { SelectionAnchor } from '../lens/types';

interface LogicNode {
  label: string;
  type: 'variable' | 'result';
}

interface LogicCompilerCardProps {
  nodes: LogicNode[];
  connector?: '+' | '-' | '→';
  summary: string;
  category?: 'method' | 'result' | 'theory';
  /** Position in the explain flow (e.g. chain 3 of 5). */
  stepNumber?: number;
  chainLabel?: string;
  /** PDF selection anchor when this card came from Explain. */
  anchor?: SelectionAnchor | null;
}

export function LogicCompilerCard({
  nodes,
  connector = '→',
  summary,
  category = 'theory',
  stepNumber,
  chainLabel,
  anchor
}: LogicCompilerCardProps) {
  const getBorderColor = () => {
    switch (category) {
      case 'method':
        return '#0D9488';
      case 'result':
        return '#EA580C';
      case 'theory':
        return '#6366F1';
      default:
        return 'var(--lens-border)';
    }
  };

  const getBackgroundColor = () => {
    switch (category) {
      case 'method':
        return 'rgba(13, 148, 136, 0.08)';
      case 'result':
        return 'rgba(234, 88, 12, 0.08)';
      case 'theory':
        return 'rgba(99, 102, 241, 0.08)';
      default:
        return 'var(--lens-surface-2)';
    }
  };

  const accent = getBorderColor();
  const headerBg = getBackgroundColor();

  return (
    <div
      className="overflow-hidden rounded-[4px] border"
      style={{ borderColor: accent, backgroundColor: 'var(--lens-surface)' }}
    >
      <div
        className="border-b px-3 py-2"
        style={{ borderBottomColor: accent, backgroundColor: headerBg }}
      >
        <div className="flex flex-wrap items-center gap-2">
          {stepNumber != null ? (
            <span
              className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border text-[9px] font-bold tabular-nums"
              style={{
                borderColor: accent,
                color: accent,
                fontFamily: 'var(--lens-font-mono)'
              }}
            >
              {stepNumber}
            </span>
          ) : null}
          <span className="text-[10px]" style={{ fontFamily: 'var(--lens-font-mono)', color: accent }}>
            LOGIC_CHAIN
            {chainLabel ? ` · ${chainLabel}` : ''}
            {stepNumber == null ? ` · ${category.toUpperCase()}` : ''}
          </span>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {nodes.map((node, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="rounded-[4px] border px-3 py-1.5"
                style={{
                  borderColor: node.type === 'variable' ? '#0D9488' : accent,
                  backgroundColor: node.type === 'variable' ? 'rgba(13, 148, 136, 0.06)' : headerBg
                }}
              >
                <span className="text-[12px]" style={{ fontFamily: 'var(--lens-font-body)', color: 'var(--lens-fg)' }}>
                  {node.label}
                </span>
              </div>

              {index < nodes.length - 1 && (
                <div className="flex items-center gap-1">
                  <ArrowRight className="h-4 w-4 text-[var(--lens-muted)]" />
                  <span className="text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                    {connector}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t pt-3" style={{ borderColor: 'var(--lens-border)' }}>
          <p className="text-[12px] leading-relaxed text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
            {summary}
          </p>
          {anchor ? (
            <p
              className="mt-2 text-[9px] leading-relaxed text-[var(--lens-muted)]"
              style={{ fontFamily: 'var(--lens-font-mono)' }}
            >
              // ANCHOR · p.{anchor.pageNumber}
              {anchor.sectionId ? ` · §${anchor.sectionId}` : ''} · ({Math.round(anchor.rect.x)},{Math.round(anchor.rect.y)})
              {' · '}
              {Math.round(anchor.rect.width)}×{Math.round(anchor.rect.height)}px
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
