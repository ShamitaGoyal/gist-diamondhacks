import { LayoutPanelLeft, Sparkles } from 'lucide-react';
import type { SelectionAnchor } from '../lens/types';

interface LensTriggerProps {
  position: { x: number; y: number };
  anchor?: SelectionAnchor | null;
  selectedText: string;
  onMiniLens: (text: string) => void;
  onFullLens: () => void;
  onClose: () => void;
}

export function LensTrigger({ position, anchor, selectedText, onMiniLens, onFullLens, onClose }: LensTriggerProps) {
  return (
    <div
      className="absolute z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
      style={{
        left: `${position.x + 10}px`,
        top: `${position.y + 10}px`
      }}
    >
      <div
        className="flex flex-col gap-1 rounded-sm border p-1"
        style={{ borderWidth: 1, borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
      >
        {anchor ? (
          <div
            className="px-2 pt-1 text-[11px] leading-tight text-[var(--lens-muted)]"
            style={{ fontFamily: 'var(--lens-font-mono)' }}
          >
            p.{anchor.pageNumber}
            {anchor.sectionId ? ` · §${anchor.sectionId}` : ''}
            <br />
            <span className="opacity-90">
              ({Math.round(anchor.rect.x)},{Math.round(anchor.rect.y)}) {Math.round(anchor.rect.width)}×
              {Math.round(anchor.rect.height)}px
            </span>
          </div>
        ) : null}
        <p className="px-2 pb-0.5 text-[10px] leading-tight text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
          Choose how to open the Lens
        </p>
        <button
          type="button"
          onClick={() => {
            onMiniLens(selectedText);
            onClose();
          }}
          className="flex items-center gap-2 rounded-sm border px-3 py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
          style={{
            fontFamily: 'var(--lens-font-body)',
            borderColor: 'var(--lens-border)',
            backgroundColor: 'var(--lens-surface-2)',
            color: 'var(--lens-fg)'
          }}
        >
          <Sparkles className="h-3 w-3 shrink-0 text-[var(--lens-accent)]" />
          <span className="text-left leading-tight">Mini · story + chart</span>
        </button>
        <button
          type="button"
          onClick={() => {
            onFullLens();
            onClose();
          }}
          className="flex items-center gap-2 rounded-sm border px-3 py-2 text-[13px] font-medium transition-opacity hover:opacity-90"
          style={{
            fontFamily: 'var(--lens-font-body)',
            borderColor: 'var(--lens-border)',
            backgroundColor: 'var(--lens-fg)',
            color: 'var(--lens-surface)'
          }}
        >
          <LayoutPanelLeft className="h-3 w-3 shrink-0" />
          <span className="text-left leading-tight">Full Lens · editor panel</span>
        </button>
      </div>
    </div>
  );
}
