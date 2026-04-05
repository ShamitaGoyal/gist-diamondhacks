import { MessageSquarePlus, X } from 'lucide-react';

interface EditorSelectionChipProps {
  position: { x: number; y: number };
  onAddToChat: () => void;
  onDismiss: () => void;
}

/** Cursor-style inline bar: action only, no selection preview. */
export function EditorSelectionChip({ position, onAddToChat, onDismiss }: EditorSelectionChipProps) {
  return (
    <div
      className="absolute z-[52] animate-in fade-in slide-in-from-bottom-1 duration-150"
      style={{ left: `${position.x + 8}px`, top: `${position.y + 8}px` }}
      role="toolbar"
      aria-label="Add selection to chat"
    >
      <div
        className="flex items-center gap-1 rounded-sm border p-1"
        style={{
          borderWidth: 1,
          borderColor: 'var(--lens-border)',
          backgroundColor: 'var(--lens-surface)',
          boxShadow: 'none'
        }}
      >
        <button
          type="button"
          onClick={onAddToChat}
          className="flex items-center gap-1.5 rounded-sm border px-2.5 py-1.5 text-[12px] font-medium transition-opacity hover:opacity-90"
          style={{
            fontFamily: 'var(--lens-font-body)',
            borderColor: 'var(--lens-border)',
            backgroundColor: 'var(--lens-fg)',
            color: 'var(--lens-surface)'
          }}
        >
          <MessageSquarePlus className="h-3.5 w-3.5 shrink-0 opacity-90" style={{ color: 'inherit' }} aria-hidden />
          Add to Chat
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border transition-opacity hover:opacity-90"
          style={{
            borderColor: 'var(--lens-border)',
            backgroundColor: 'var(--lens-surface)',
            color: 'var(--lens-muted)'
          }}
          aria-label="Dismiss"
          title="Dismiss"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
