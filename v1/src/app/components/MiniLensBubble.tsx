import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, GripVertical, MessageCircle, X } from 'lucide-react';
import type { MiniLensConcept } from '../lens/mockMiniLens';

const PAD = 12;
const BUBBLE_MAX_W = 352; // ~22rem

function clampToViewport(left: number, top: number, width: number, height: number) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 800;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 600;
  const maxL = Math.max(PAD, vw - width - PAD);
  const maxT = Math.max(PAD, vh - height - PAD);
  return {
    left: Math.min(Math.max(PAD, left), maxL),
    top: Math.min(Math.max(PAD, top), maxT)
  };
}

/** Initial fixed position from anchor (selection bottom-right), staying inside viewport. */
function initialPlacement(anchorX: number, anchorY: number, estHeight: number) {
  let left = anchorX + 8;
  let top = anchorY + 8;
  const w = Math.min(BUBBLE_MAX_W, window.innerWidth - 2 * PAD);
  if (left + w > window.innerWidth - PAD) {
    left = anchorX - w - 8;
  }
  if (left < PAD) left = PAD;
  if (top + estHeight > window.innerHeight - PAD) {
    top = anchorY - estHeight - 8;
  }
  if (top < PAD) top = PAD;
  return clampToViewport(left, top, w, estHeight);
}

interface MiniLensBubbleProps {
  /** Same `--lens-*` tokens as the main app (required — portal is under `body`, outside themed root). */
  lensThemeStyle: CSSProperties;
  viewportAnchor: { x: number; y: number };
  story: string;
  concepts: MiniLensConcept[];
  selectionPreview: string;
  onClose: () => void;
  onOpenFullLens: () => void;
  onSendChat: (message: string) => Promise<string>;
}

function ConceptBars({ concepts }: { concepts: MiniLensConcept[] }) {
  const max = Math.max(...concepts.map((c) => c.value), 1);
  return (
    <div className="space-y-1.5" aria-label="Concept breakdown">
      {concepts.map((c) => (
        <div key={c.label} className="flex items-center gap-2">
          <span
            className="w-[5.5rem] shrink-0 truncate text-[11px] text-[var(--lens-muted)]"
            style={{ fontFamily: 'var(--lens-font-mono)' }}
            title={c.label}
          >
            {c.label}
          </span>
          <div
            className="h-2 min-w-0 flex-1 border"
            style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
          >
            <div
              className="h-full border-r"
              style={{
                width: `${(c.value / max) * 100}%`,
                backgroundColor: 'var(--lens-accent)',
                borderColor: 'var(--lens-border)',
                opacity: 0.85
              }}
            />
          </div>
          <span className="w-7 shrink-0 text-right text-[11px] tabular-nums text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
            {c.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function MiniLensBubble({
  lensThemeStyle,
  viewportAnchor,
  story,
  concepts,
  selectionPreview,
  onClose,
  onOpenFullLens,
  onSendChat
}: MiniLensBubbleProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState(() => initialPlacement(viewportAnchor.x, viewportAnchor.y, 380));
  const dragRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startLeft: number;
    startTop: number;
  } | null>(null);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatLines, setChatLines] = useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(
    async (raw: string) => {
      const msg = raw.trim();
      if (!msg || chatBusy) return;
      setInput('');
      setChatLines((prev) => [...prev, { role: 'user', text: msg }]);
      setChatBusy(true);
      try {
        const reply = await onSendChat(msg);
        setChatLines((prev) => [...prev, { role: 'assistant', text: reply }]);
      } catch {
        setChatLines((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'Demo reply failed to load. Check the console, or try sending again.'
          }
        ]);
      } finally {
        setChatBusy(false);
      }
    },
    [chatBusy, onSendChat]
  );

  useEffect(() => {
    if (!chatOpen) return;
    chatEndRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [chatOpen, chatLines, chatBusy]);

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const next = initialPlacement(viewportAnchor.x, viewportAnchor.y, r.height);
    setPlacement(next);
  }, [viewportAnchor.x, viewportAnchor.y]);

  /** Keep on-screen when content height changes (e.g. chat open). */
  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPlacement((p) => clampToViewport(p.left, p.top, r.width, r.height));
  }, [chatOpen, chatLines.length]);

  useEffect(() => {
    const onResize = () => {
      const el = shellRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPlacement((p) => clampToViewport(p.left, p.top, r.width, r.height));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onDragPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    dragRef.current = {
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startLeft: placement.left,
      startTop: placement.top
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    const dx = e.clientX - d.startClientX;
    const dy = e.clientY - d.startClientY;
    const el = shellRef.current;
    const w = el?.offsetWidth ?? BUBBLE_MAX_W;
    const h = el?.offsetHeight ?? 320;
    const next = clampToViewport(d.startLeft + dx, d.startTop + dy, w, h);
    setPlacement(next);
  };

  const onDragPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || e.pointerId !== d.pointerId) return;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const node = (
    <div
      ref={shellRef}
      className="pointer-events-auto fixed z-[200] w-[min(100vw-1.5rem,22rem)] max-w-[calc(100vw-1.5rem)] animate-in fade-in slide-in-from-bottom-1 duration-200"
      style={{
        ...lensThemeStyle,
        left: placement.left,
        top: placement.top,
        boxShadow: 'none',
        color: 'var(--lens-fg)'
      }}
      role="dialog"
      aria-label="Mini lens insight"
    >
      <div
        className="rounded-sm border"
        style={{
          borderWidth: 1,
          borderColor: 'var(--lens-border)',
          backgroundColor: 'var(--lens-surface)',
          boxShadow: 'none'
        }}
      >
        <div
          className="flex cursor-grab items-start gap-1 border-b px-2 py-2 active:cursor-grabbing"
          style={{ borderColor: 'var(--lens-border)', touchAction: 'none' }}
          onPointerDown={onDragPointerDown}
          onPointerMove={onDragPointerMove}
          onPointerUp={onDragPointerUp}
          onPointerCancel={onDragPointerUp}
        >
          <div className="flex shrink-0 items-center pt-0.5 text-[var(--lens-muted)]" aria-hidden title="Drag">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--lens-accent)]" aria-hidden />
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
                Story mode
              </p>
              <p className="truncate text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                {selectionPreview ? `“${selectionPreview.slice(0, 56)}${selectionPreview.length > 56 ? '…' : ''}”` : 'Selection'}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setChatOpen((v) => !v);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="cursor-pointer rounded-sm border p-1.5 transition-opacity hover:opacity-90"
              style={{ borderColor: 'var(--lens-border)', color: 'var(--lens-muted)' }}
              title="Mini chat"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              className="cursor-pointer rounded-sm border p-1.5 transition-opacity hover:opacity-90"
              style={{ borderColor: 'var(--lens-border)', color: 'var(--lens-muted)' }}
              aria-label="Close mini lens"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="max-h-[min(55vh,24rem)] overflow-y-auto px-3 py-2.5 space-y-3">
          <p className="whitespace-pre-line text-[13px] font-normal leading-relaxed text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
            {story}
          </p>

          <div>
            <p className="mb-1.5 text-[11px] font-medium text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
              Concept mix (relative)
            </p>
            <ConceptBars concepts={concepts} />
          </div>

          {chatOpen ? (
            <div className="space-y-2 border-t pt-2" style={{ borderColor: 'var(--lens-border)' }}>
              <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                Mini chat
              </p>
              <div className="max-h-36 space-y-1.5 overflow-y-auto">
                {chatLines.length === 0 ? (
                  <p className="text-[11px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
                    Ask anything about your highlight — demo replies use your selection as context.
                  </p>
                ) : (
                  chatLines.map((line, i) => (
                    <div
                      key={i}
                      className={`rounded-sm border px-2 py-1 text-[11px] leading-snug ${line.role === 'user' ? 'ml-3' : 'mr-3'}`}
                      style={{
                        borderColor: 'var(--lens-border)',
                        backgroundColor: line.role === 'user' ? 'var(--lens-surface-2)' : 'var(--lens-bg)',
                        fontFamily: 'var(--lens-font-body)',
                        color: 'var(--lens-fg)'
                      }}
                    >
                      <span className="block text-[9px] font-medium uppercase tracking-wide text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                        {line.role === 'user' ? 'You' : 'Lens'}
                      </span>
                      {line.text}
                    </div>
                  ))
                )}
                {chatBusy ? (
                  <p className="text-[10px] italic text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
                    Thinking…
                  </p>
                ) : null}
                <div ref={chatEndRef} />
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    void sendMessage((e.target as HTMLInputElement).value);
                  }}
                  placeholder="Ask…"
                  disabled={chatBusy}
                  className="min-w-0 flex-1 rounded-sm border px-2 py-1.5 text-[12px] outline-none"
                  style={{
                    borderColor: 'var(--lens-border)',
                    backgroundColor: 'var(--lens-bg)',
                    color: 'var(--lens-fg)',
                    fontFamily: 'var(--lens-font-body)'
                  }}
                />
                <button
                  type="button"
                  onClick={() => void sendMessage(input)}
                  disabled={chatBusy || !input.trim()}
                  className="shrink-0 rounded-sm border px-2 py-1.5 text-[12px] font-medium transition-opacity disabled:opacity-40"
                  style={{
                    borderColor: 'var(--lens-border)',
                    backgroundColor: 'var(--lens-fg)',
                    color: 'var(--lens-surface)',
                    fontFamily: 'var(--lens-font-body)'
                  }}
                >
                  →
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="border-t px-3 py-2"
          style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
        >
          <button
            type="button"
            onClick={onOpenFullLens}
            className="text-[11px] font-medium transition-opacity hover:opacity-90"
            style={{ fontFamily: 'var(--lens-font-body)', color: 'var(--lens-accent)' }}
          >
            Open full Lens editor →
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

const CHIP_W = 200;
const CHIP_H = 40;

/** Viewport-fixed loading line while mini insight is generated (clamped on-screen). */
export function MiniLensLoadingChip({
  anchor,
  lensThemeStyle
}: {
  anchor: { x: number; y: number };
  lensThemeStyle: CSSProperties;
}) {
  const pad = PAD;
  let left = anchor.x + 10;
  let top = anchor.y + 10;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  left = Math.min(Math.max(pad, left), vw - CHIP_W - pad);
  top = Math.min(Math.max(pad, top), vh - CHIP_H - pad);

  return createPortal(
    <div
      className="pointer-events-none fixed z-[199] rounded-sm border px-3 py-2 text-[12px] font-normal text-[var(--lens-muted)]"
      style={{
        ...lensThemeStyle,
        left,
        top,
        width: CHIP_W,
        borderWidth: 1,
        borderColor: 'var(--lens-border)',
        backgroundColor: 'var(--lens-surface)',
        fontFamily: 'var(--lens-font-body)',
        color: 'var(--lens-muted)',
        boxShadow: 'none'
      }}
    >
      Composing story + chart…
    </div>,
    document.body
  );
}
