import { FileText } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page } from "react-pdf";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

function findPageNumberFromNode(node: Node | null): number {
  let el: HTMLElement | null = node instanceof HTMLElement ? node : node?.parentElement ?? null;
  while (el) {
    const p = el.getAttribute("data-pdf-page");
    if (p != null) {
      const n = parseInt(p, 10);
      if (!Number.isNaN(n)) return n;
    }
    el = el.parentElement;
  }
  return 1;
}

interface PdfReaderPaneProps {
  fileUrl: string;
  documentFileName: string;
  scrollRef: React.RefObject<HTMLDivElement>;
  activePageSectionId: string | null;
  onTextSelection: (text: string, rect: DOMRect, sectionId: string, paragraphIndex: number) => void;
  userSelection: { text: string; rect: DOMRect; sectionId?: string; paragraphIndex?: number } | null;
  onExplainSelection: (text: string, sectionId?: string, paragraphIndex?: number) => void;
  onChatSelection: (text: string, sectionId?: string, paragraphIndex?: number) => void;
  onClearSelection: () => void;
  onDocumentLoaded: (numPages: number) => void;
}

const PdfReaderPane = ({
  fileUrl,
  documentFileName,
  scrollRef,
  activePageSectionId,
  onTextSelection,
  userSelection,
  onExplainSelection,
  onChatSelection,
  onClearSelection,
  onDocumentLoaded,
}: PdfReaderPaneProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageWidth, setPageWidth] = useState(520);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!userSelection) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClearSelection();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [userSelection, onClearSelection]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - 48;
      setPageWidth(Math.max(280, Math.min(w, 640)));
    });
    ro.observe(el);
    const w = el.clientWidth - 48;
    setPageWidth(Math.max(280, Math.min(w, 640)));
    return () => ro.disconnect();
  }, []);

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;
    const text = sel.toString().trim();
    if (text.length < 4) return;
    const page = findPageNumberFromNode(sel.anchorNode);
    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    onTextSelection(text, rect, `page-${page}`, 0);
  }, [onTextSelection]);

  const getPopupStyle = () => {
    if (!userSelection || !containerRef.current) return {};
    return {
      position: "fixed" as const,
      top: userSelection.rect.bottom + 6,
      left: userSelection.rect.left + userSelection.rect.width / 2 - 80,
      zIndex: 50,
    };
  };

  const activePage = (() => {
    if (!activePageSectionId?.startsWith("page-")) return null;
    const n = parseInt(activePageSectionId.slice(5), 10);
    return Number.isNaN(n) ? null : n;
  })();

  return (
    <div ref={containerRef} className="flex-1 flex flex-col bg-surface border-r border-border min-w-0 relative">
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
          {numPages ? `p. 1 / ${numPages}` : "…"}
        </span>
      </div>

      {loadError ? (
        <div className="px-4 py-2 text-[11px] text-destructive bg-destructive/10 border-b border-border">{loadError}</div>
      ) : null}

      <div
        ref={scrollRef}
        onMouseUp={handleMouseUp}
        className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar flex flex-col items-center gap-6"
      >
        <Document
          file={fileUrl}
          loading={
            <div className="text-[12px] text-text-tertiary py-8">Loading PDF…</div>
          }
          onLoadSuccess={(doc) => {
            setLoadError(null);
            setNumPages(doc.numPages);
            onDocumentLoaded(doc.numPages);
          }}
          onLoadError={(err) => {
            const msg = err?.message || "Could not load PDF";
            setLoadError(msg);
          }}
        >
          {numPages > 0 &&
            Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => {
              const isActive = activePage === pageNum;
              return (
                <div
                  key={pageNum}
                  id={`pdf-page-${pageNum}`}
                  data-pdf-page={pageNum}
                  className={`rounded-lg overflow-hidden shadow-sm border-2 transition-colors ${
                    isActive ? "border-accent-mid bg-accent-light/20" : "border-border bg-background"
                  }`}
                >
                  <div data-pdf-page={pageNum} className="react-pdf-page-wrap">
                    <Page pageNumber={pageNum} width={pageWidth} renderTextLayer renderAnnotationLayer />
                  </div>
                </div>
              );
            })}
        </Document>
      </div>

      {userSelection && (
        <div className="selection-popup" style={getPopupStyle()}>
          <div className="flex gap-1 bg-surface border border-border rounded-lg shadow-md p-1">
            <button
              type="button"
              onClick={() =>
                onExplainSelection(userSelection.text, (userSelection as { sectionId?: string }).sectionId, 0)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-accent-dark bg-accent-light hover:bg-accent-mid hover:text-primary-foreground rounded-md transition-colors"
            >
              <span>✦</span> Explain
            </button>
            <button
              type="button"
              onClick={() =>
                onChatSelection(userSelection.text, (userSelection as { sectionId?: string }).sectionId, 0)
              }
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-foreground hover:bg-surface-2 rounded-md transition-colors"
            >
              💬 Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PdfReaderPane;
