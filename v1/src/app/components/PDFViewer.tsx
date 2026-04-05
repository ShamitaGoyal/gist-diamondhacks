import { useRef, useEffect, useCallback } from 'react';
import { MOCK_PAPER_SECTIONS, virtualPageForSectionId } from '../mockPaper';
import type { SelectionAnchor } from '../lens/types';

interface PDFViewerProps {
  /** `position` is relative to the scroll container; `viewportAnchor` is client coords (e.g. selection bottom-right). */
  onTextSelect: (
    text: string,
    position: { x: number; y: number },
    anchor: SelectionAnchor,
    viewportAnchor: { x: number; y: number }
  ) => void;
  highlightedSections: string[];
  /** Section most visible while scrolling — styled like the glowing map node for easier reading */
  activeSectionId?: string | null;
  /** Scroll PDF to `#section-{id}` when set (e.g. map node → section) */
  scrollToSectionId?: string | null;
  /** Fires when a `data-lens-section` block is most visible in the scroll container. */
  onActiveSectionChange?: (sectionId: string | null) => void;
}

function findSectionIdFromRange(range: Range, boundary: HTMLElement): string | null {
  let el: Node | null = range.commonAncestorContainer;
  if (el.nodeType === Node.TEXT_NODE) el = (el as Text).parentElement;
  while (el && el !== boundary) {
    if (el instanceof HTMLElement && el.dataset.lensSection) {
      return el.dataset.lensSection;
    }
    el = el.parentElement;
  }
  return null;
}

export function PDFViewer({
  onTextSelect,
  highlightedSections,
  activeSectionId,
  scrollToSectionId,
  onActiveSectionChange
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollToSectionId || !containerRef.current) return;
    const el = containerRef.current.querySelector(`#section-${CSS.escape(scrollToSectionId)}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [scrollToSectionId]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root || !onActiveSectionChange) return;

    const ratios = new Map<string, number>();
    const sections = root.querySelectorAll<HTMLElement>('[data-lens-section]');

    const pickBest = () => {
      let bestId: string | null = null;
      let best = 0;
      ratios.forEach((r, id) => {
        if (r > best) {
          best = r;
          bestId = id;
        }
      });
      onActiveSectionChange(best >= 0.18 ? bestId : null);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const id = (e.target as HTMLElement).dataset.lensSection;
          if (id) ratios.set(id, e.intersectionRatio);
        }
        pickBest();
      },
      { root, rootMargin: '-12% 0px -45% 0px', threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );

    sections.forEach((el) => {
      const id = el.dataset.lensSection;
      if (id) ratios.set(id, 0);
      io.observe(el);
    });

    return () => io.disconnect();
  }, [onActiveSectionChange]);

  const handleSelection = useCallback(() => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();
    const container = containerRef.current;

    if (!text || text.length < 8 || !container || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const sectionId = findSectionIdFromRange(range, container);
    const sr = range.getBoundingClientRect();
    const cr = container.getBoundingClientRect();

    const rect = {
      x: sr.left - cr.left + container.scrollLeft,
      y: sr.top - cr.top + container.scrollTop,
      width: sr.width,
      height: sr.height
    };

    const position = {
      x: sr.right - cr.left,
      y: sr.bottom - cr.top
    };

    const viewportAnchor = { x: sr.right, y: sr.bottom };

    const anchor: SelectionAnchor = {
      pageNumber: virtualPageForSectionId(sectionId),
      rect,
      sectionId
    };

    onTextSelect(text, position, anchor, viewportAnchor);
  }, [onTextSelect]);

  useEffect(() => {
    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [handleSelection]);

  return (
    <div
      ref={containerRef}
      className="relative h-full min-h-0 overflow-y-auto border-r border-[#E2E8F0] bg-white"
    >
      <div className="mx-auto max-w-4xl p-12">
        {/* Paper Header */}
        <div className="mb-8 border-b-2 border-[#E2E8F0] pb-6">
          <h1 className="mb-4 text-[28px] font-bold text-[#1E293B]" style={{ fontFamily: 'Inter, sans-serif' }}>
            Meridian: A Design Framework for Malleable Overview-Detail Interfaces
          </h1>
          <div className="space-y-1 text-[14px] text-[#64748B]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <p>Bryan Min, Haijun Xia</p>
            <p className="mt-2 text-[12px]">University of California San Diego</p>
            <p className="mt-2 text-[12px] text-[#6366F1]">UIST &apos;25 · Busan, Republic of Korea · ACM 979-8-4007-2037-6/25/09</p>
          </div>
        </div>

        {MOCK_PAPER_SECTIONS.map((section) => {
          const isPinned = highlightedSections.includes(section.id);
          const isActiveInView = activeSectionId != null && section.id === activeSectionId;
          return (
          <div
            key={section.id}
            id={`section-${section.id}`}
            data-lens-section={section.id}
            className={[
              'relative mb-8 rounded-lg transition-[background-color,box-shadow,padding,margin] duration-200 ease-out',
              isActiveInView
                ? 'z-[1] -mx-2 bg-[#EEF2FF] px-4 py-4 shadow-[0_0_0_1px_rgba(99,102,241,0.35),0_0_22px_6px_rgba(99,102,241,0.14),0_8px_32px_-8px_rgba(99,102,241,0.18)]'
                : '',
              isPinned
                ? isActiveInView
                  ? 'border-l-4 border-[#4F46E5] pl-5'
                  : 'border-l-4 border-[#6366F1] bg-[#818CF8]/10 py-2 pl-6 -ml-6'
                : ''
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {section.slug ? (
              <span id={section.slug} className="absolute left-0 top-0 h-px w-px overflow-hidden opacity-0" aria-hidden>
                §
              </span>
            ) : null}
            <h2 className="mb-3 text-[18px] font-semibold text-[#1E293B]" style={{ fontFamily: 'Inter, sans-serif' }}>
              {section.title}
            </h2>
            <p
              className={`whitespace-pre-line text-[14px] leading-relaxed ${
                isActiveInView ? 'text-[#1E293B]' : 'text-[#334155]'
              }`}
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              {section.content}
            </p>
          </div>
          );
        })}

        <div className="mt-12 rounded-[4px] border border-[#E2E8F0] bg-[#F8FAFC] p-6">
          <div className="mb-4 flex justify-center gap-8 text-[11px] font-medium text-[#64748B]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <span>Overview</span>
            <span>Item View</span>
            <span>Detail View</span>
          </div>
          <div className="mb-4 text-center">
            <div className="text-[12px] font-semibold text-[#64748B]" style={{ fontFamily: 'Inter, sans-serif' }}>
              Figure 2: The overview-detail design pattern makes up three components: overview, item view, and detail view.
              This example shows Etsy&apos;s search results page presenting items in a grid and a detail view in a new page.
            </div>
          </div>
          <div className="flex h-96 items-center justify-center border border-[#E2E8F0] bg-white">
            <div className="text-[12px] text-[#94A3B8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              [ODI pattern illustration]
            </div>
          </div>
        </div>

        <div className="mt-12 border-t-2 border-[#E2E8F0] pt-6">
          <h2 className="mb-4 text-[18px] font-semibold text-[#1E293B]" style={{ fontFamily: 'Inter, sans-serif' }}>
            References
          </h2>
          <div className="space-y-2 text-[12px] text-[#64748B]" style={{ fontFamily: 'Inter, sans-serif' }}>
            <p>
              [23, 37] Prior work on adaptable and personalized interfaces (representative citations in the full paper).
            </p>
            <p>[30] Evaluation-by-demonstration methodology in HCI systems research.</p>
            <p>
              [36] Min, B., Xia, H., et al. Malleable overview-detail interfaces and analysis of 303 web ODIs (see Meridian
              references).
            </p>
            <p>Min, B., & Xia, H. (2025). Meridian: A Design Framework for Malleable Overview-Detail Interfaces. UIST &apos;25.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
