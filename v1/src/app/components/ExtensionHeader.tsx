import { PanelRightClose, Settings } from 'lucide-react';

export type LensMode = 'logic' | 'architecture' | 'console';

const MODE_HINTS: Record<LensMode, string> = {
  logic: 'Visual cards, technical vs story, and LLM-routed graphs · sequences · tables.',
  architecture: 'Argument DAG fills the panel; scroll the PDF to glow the active section.',
  console: 'Chat with optional Recharts blocks. Try /critique on your current selection, or /chart for a demo plot.'
};

interface ExtensionHeaderProps {
  activeTab: LensMode;
  onTabChange: (tab: LensMode) => void;
  onCloseLens: () => void;
  /** Breadcrumb / context, e.g. §3.1 · p.4 */
  contextLine?: string;
  /** Truncated user selection for Cursor-style context */
  selectionPreview?: string;
}

export function ExtensionHeader({
  activeTab,
  onTabChange,
  onCloseLens,
  contextLine,
  selectionPreview
}: ExtensionHeaderProps) {
  const modes: { id: LensMode; label: string }[] = [
    { id: 'logic', label: 'Logic' },
    { id: 'architecture', label: 'Architecture' },
    { id: 'console', label: 'Console' }
  ];

  const crumb = contextLine?.trim() || 'Paper';
  const preview = selectionPreview?.trim().slice(0, 72);
  const previewEllipsis = selectionPreview && selectionPreview.length > 72 ? '…' : '';

  return (
    <div className="flex flex-col border-b" style={{ backgroundColor: 'var(--lens-surface)', borderColor: 'var(--lens-border)' }}>
      <div
        className="flex h-9 items-center justify-between gap-2 border-b px-3"
        style={{ borderColor: 'var(--lens-border)' }}
      >
        <div className="min-w-0 flex flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-[10px]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
            <span className="shrink-0 rounded px-1 py-px" style={{ backgroundColor: 'var(--lens-surface-2)', color: 'var(--lens-muted)' }}>
              Lens
            </span>
            <span style={{ color: 'var(--lens-muted)' }}>·</span>
            <span className="truncate text-[var(--lens-fg)]">{crumb}</span>
          </div>
          {preview ? (
            <p className="truncate text-[10px] leading-tight text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
              “{preview}
              {previewEllipsis}”
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--lens-surface-2)]"
            style={{ color: 'var(--lens-muted)' }}
            title="Lens settings (demo)"
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onCloseLens}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-[var(--lens-surface-2)]"
            style={{ color: 'var(--lens-muted)' }}
            title="Close Lens (Esc)"
            aria-label="Close Lens panel"
          >
            <PanelRightClose className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-3 pt-2 pb-1.5">
        <div
          className="flex w-full rounded-md border p-0.5"
          style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
          role="tablist"
          aria-label="Lens mode"
        >
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={activeTab === m.id}
              onClick={() => onTabChange(m.id)}
              className="min-w-0 flex-1 rounded-[5px] px-2 py-1.5 text-[11px] font-medium transition-colors"
              style={{
                fontFamily: 'var(--lens-font-body)',
                backgroundColor: activeTab === m.id ? 'var(--lens-fg)' : 'transparent',
                color: activeTab === m.id ? 'var(--lens-surface)' : 'var(--lens-muted)'
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <p
        className="border-t px-3 py-2 text-[10px] leading-snug text-[var(--lens-muted)]"
        style={{ fontFamily: 'var(--lens-font-body)', borderColor: 'var(--lens-border)' }}
      >
        {MODE_HINTS[activeTab]}
      </p>
    </div>
  );
}
