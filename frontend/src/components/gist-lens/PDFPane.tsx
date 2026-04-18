import { FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState, RefObject } from "react";

interface Highlight {
  text: string;
  id: string;
}

interface Section {
  id: string;
  title: string;
  paragraphs: { text: string; highlights?: Highlight[] }[];
}

interface UserHighlight {
  id: string;
  text: string;
  sectionId: string;
  paragraphIndex: number;
}

interface PDFPaneProps {
  sections: Section[];
  /** Shown in the toolbar like a filename */
  documentFileName: string;
  /** e.g. 12 → "p. 1 / 12" */
  pageCount?: number;
  activeSection: string | null;
  activeHighlight: string | null;
  onHighlightClick: (id: string, text: string) => void;
  onTextSelection: (text: string, rect: DOMRect, sectionId: string, paragraphIndex: number) => void;
  userSelection: { text: string; rect: DOMRect; sectionId?: string; paragraphIndex?: number } | null;
  onExplainSelection: (text: string, sectionId?: string, paragraphIndex?: number) => void;
  onChatSelection: (text: string, sectionId?: string, paragraphIndex?: number) => void;
  onClearSelection: () => void;
  onScrollSection: (sectionId: string) => void;
  scrollRef: RefObject<HTMLDivElement>;
  userHighlights: UserHighlight[];
  onRemoveHighlight: (id: string) => void;
}

const PDFPane = ({
  sections,
  documentFileName,
  pageCount = 12,
  activeSection,
  activeHighlight,
  onHighlightClick,
  onTextSelection,
  userSelection,
  onExplainSelection,
  onChatSelection,
  onClearSelection,
  onScrollSection,
  scrollRef,
  userHighlights,
  onRemoveHighlight,
}: PDFPaneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; hlId: string } | null>(null);

  // Find which section/paragraph a selection is in
  const findSelectionContext = useCallback((node: Node): { sectionId: string; paragraphIndex: number } | null => {
    let el = node instanceof HTMLElement ? node : node.parentElement;
    while (el) {
      const pIdx = el.getAttribute("data-p-idx");
      const sId = el.getAttribute("data-section-id");
      if (pIdx !== null && sId !== null) {
        return { sectionId: sId, paragraphIndex: parseInt(pIdx) };
      }
      el = el.parentElement;
    }
    return null;
  }, []);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
    const text = sel.toString();
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const ctx = findSelectionContext(range.startContainer);
    if (ctx) {
      onTextSelection(text, rect, ctx.sectionId, ctx.paragraphIndex);
    }
  }, [onTextSelection, findSelectionContext]);

  // Track scroll position to detect active section
  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const handleScroll = () => {
      const scrollTop = scrollEl.scrollTop;
      const scrollHeight = scrollEl.clientHeight;
      let currentSection: string | null = null;

      for (const section of sections) {
        const el = sectionRefs.current[section.id];
        if (!el) continue;
        const top = el.offsetTop - scrollEl.offsetTop;
        if (top <= scrollTop + scrollHeight * 0.3) {
          currentSection = section.id;
        }
      }
      if (currentSection) {
        onScrollSection(currentSection);
      }
    };

    scrollEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, [sections, onScrollSection, scrollRef]);

  // Click outside to dismiss selection popup & context menu
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      setContextMenu(null);
      const target = e.target as HTMLElement;
      if (target.closest(".selection-popup")) return;
      if (userSelection) {
        setTimeout(() => {
          const sel = window.getSelection();
          if (!sel || sel.isCollapsed) {
            onClearSelection();
          }
        }, 100);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userSelection, onClearSelection]);

  // Merge built-in and user highlights for a paragraph
  const getMergedHighlights = (section: Section, pIdx: number): Highlight[] => {
    const builtIn = section.paragraphs[pIdx].highlights || [];
    const userHls = userHighlights
      .filter(h => h.sectionId === section.id && h.paragraphIndex === pIdx)
      .map(h => ({ text: h.text, id: h.id }));
    return [...builtIn, ...userHls];
  };

  const handleContextMenu = useCallback((e: React.MouseEvent, hlId: string) => {
    // Only for user highlights
    if (!hlId.startsWith("user-hl-")) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, hlId });
  }, []);

  const renderParagraph = (section: Section, pIdx: number) => {
    const p = section.paragraphs[pIdx];
    const highlights = getMergedHighlights(section, pIdx);

    if (!highlights.length) {
      return (
        <p
          key={pIdx}
          data-section-id={section.id}
          data-p-idx={pIdx}
          className="text-[13px] leading-[1.85] text-foreground/85 mb-3 font-light"
        >
          {p.text}
        </p>
      );
    }

    // Sort highlights by position in text
    const sorted = highlights
      .map(hl => ({ ...hl, index: p.text.indexOf(hl.text) }))
      .filter(hl => hl.index !== -1)
      .sort((a, b) => a.index - b.index);

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    for (const hl of sorted) {
      if (hl.index < cursor) continue; // overlapping, skip
      if (hl.index > cursor) {
        parts.push(<span key={`pre-${hl.id}`}>{p.text.slice(cursor, hl.index)}</span>);
      }
      parts.push(
        <span
          key={hl.id}
          onClick={() => onHighlightClick(hl.id, hl.text)}
          onContextMenu={(e) => handleContextMenu(e, hl.id)}
          className={`bg-highlight rounded-sm cursor-pointer px-[1px] transition-all hover:bg-highlight-active ${
            activeHighlight === hl.id ? "bg-highlight-active outline outline-2 outline-highlight-active" : ""
          }`}
        >
          {hl.text}
        </span>
      );
      cursor = hl.index + hl.text.length;
    }

    if (cursor < p.text.length) {
      parts.push(<span key="end">{p.text.slice(cursor)}</span>);
    }

    return (
      <p
        key={pIdx}
        data-section-id={section.id}
        data-p-idx={pIdx}
        className="text-[13px] leading-[1.85] text-foreground/85 mb-3 font-light"
      >
        {parts}
      </p>
    );
  };

  const getPopupStyle = () => {
    if (!userSelection || !containerRef.current) return {};
    return {
      position: "fixed" as const,
      top: userSelection.rect.bottom + 6,
      left: userSelection.rect.left + userSelection.rect.width / 2 - 80,
      zIndex: 50,
    };
  };

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-surface border-r border-border min-w-0 relative">
      {/* Toolbar */}
      <div className="h-[42px] bg-surface-2 border-b border-border flex items-center px-4 gap-2.5 shrink-0">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-text-secondary">
          <FileText className="w-3.5 h-3.5" />
        </div>
        <span className="flex-1" />
        <span className="text-xs font-medium text-foreground truncate max-w-[min(280px,45vw)]" title={documentFileName}>
          {documentFileName}
        </span>
        <span className="flex-1" />
        <span className="text-[11px] text-text-tertiary bg-background px-2 py-0.5 rounded-full border border-border shrink-0">
          p. 1 / {pageCount}
        </span>
      </div>

      {/* Content */}
      <div
        ref={scrollRef}
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-y-auto px-9 py-8 custom-scrollbar"
      >
        {sections.map((section) => (
          <div
            key={section.id}
            id={`section-${section.id}`}
            ref={(el) => { sectionRefs.current[section.id] = el; }}
            className={`py-2.5 px-3 pl-3.5 border-l-[2.5px] -ml-3.5 rounded-r-md mb-1 transition-all ${
              activeSection === section.id
                ? "border-l-accent-mid bg-accent-light/30"
                : "border-l-transparent"
            }`}
          >
            <h2 className="font-sans text-lg font-semibold text-foreground mb-2.5 tracking-tight">
              {section.title}
            </h2>
            {section.paragraphs.map((_, i) => renderParagraph(section, i))}
          </div>
        ))}
      </div>

      {/* Selection popup */}
      {userSelection && (
        <div className="selection-popup" style={getPopupStyle()}>
          <div className="flex gap-1 bg-surface border border-border rounded-lg shadow-md p-1">
            <button
              onClick={() => onExplainSelection(userSelection.text, (userSelection as any).sectionId, (userSelection as any).paragraphIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-accent-dark bg-accent-light hover:bg-accent-mid hover:text-primary-foreground rounded-md transition-colors"
            >
              <span>✦</span> Explain
            </button>
            <button
              onClick={() => onChatSelection(userSelection.text, (userSelection as any).sectionId, (userSelection as any).paragraphIndex)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-2 rounded-md transition-colors"
            >
              💬 Chat
            </button>
          </div>
        </div>
      )}

      {/* Right-click context menu for removing highlights */}
      {contextMenu && (
        <div
          className="fixed z-[60] bg-surface border border-border rounded-md shadow-md py-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              onRemoveHighlight(contextMenu.hlId);
              setContextMenu(null);
            }}
            className="w-full px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-2 text-left transition-colors"
          >
            Remove highlight
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFPane;
