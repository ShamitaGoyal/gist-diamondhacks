import { useState, useCallback, useRef, useMemo, useEffect, type ReactNode, type ChangeEvent } from "react";
import PDFPane from "@/components/gist-lens/PDFPane";
import PdfReaderPane from "@/components/gist-lens/PdfReaderPane";
import SidePanel from "@/components/gist-lens/SidePanel";
import type { ExplainVisualPayload } from "@/lib/gistLensApi";
import type { TreeNode } from "@/components/gist-lens/ArchitectureTab";
import { fetchExplain, fetchArchitecture, type ArchApiNode } from "@/lib/gistLensApi";
import {
  SAMPLE_PAPERS,
  getPaperById,
  buildPageArchitectureNodes,
  MERIDIAN_PDF_ARCH_NODES,
  isLikelyMeridianPdfFileName,
  type SamplePaperId,
  type PaperSection,
} from "@/data/samplePapers";
import { extractFullTextFromPdf, extractFullTextFromPdfBuffer } from "@/lib/extractPdfText";
import { Upload, X, Loader2 } from "lucide-react";

const ODIVisual = () => (
  <svg viewBox="0 0 280 180" className="w-full max-w-[260px]">
    <line x1="140" y1="50" x2="50" y2="90" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="50" x2="140" y2="90" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="50" x2="230" y2="90" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="120" x2="140" y2="140" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <rect x="75" y="12" width="130" height="42" rx="8" fill="hsl(var(--accent-light))" stroke="hsl(var(--accent-mid))" strokeWidth="1.5" />
    <text x="140" y="30" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(var(--accent-dark))">
      Big list (overview)
    </text>
    <text x="140" y="44" textAnchor="middle" fontSize="8" fill="hsl(var(--text-tertiary))">
      scan quickly
    </text>
    <rect x="15" y="90" width="70" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="50" y="109" textAnchor="middle" fontSize="9" fill="hsl(var(--text-secondary))">
      Item 1
    </text>
    <rect x="105" y="90" width="70" height="30" rx="6" fill="hsl(var(--accent-mid))" stroke="hsl(var(--accent-dark))" strokeWidth="1.5" />
    <text x="140" y="109" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--primary-foreground))">
      Selected!
    </text>
    <rect x="195" y="90" width="70" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="230" y="109" textAnchor="middle" fontSize="9" fill="hsl(var(--text-secondary))">
      Item 3
    </text>
    <rect x="85" y="140" width="110" height="30" rx="6" fill="hsl(var(--green-light))" stroke="hsl(var(--green))" strokeWidth="1.5" />
    <text x="140" y="159" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--green))">
      Full detail view
    </text>
  </svg>
);

const MeridianVisual = () => (
  <svg viewBox="0 0 280 140" className="w-full max-w-[260px]">
    <line x1="140" y1="45" x2="50" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="45" x2="140" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="45" x2="230" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <rect x="70" y="10" width="140" height="38" rx="8" fill="hsl(var(--accent-light))" stroke="hsl(var(--accent-mid))" strokeWidth="1.5" />
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(var(--accent-dark))">
      Meridian Spec
    </text>
    <text x="140" y="42" textAnchor="middle" fontSize="8" fill="hsl(var(--text-tertiary))">
      declarative language
    </text>
    <rect x="5" y="85" width="90" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="50" y="104" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--foreground))">
      Content
    </text>
    <rect x="105" y="85" width="90" height="30" rx="6" fill="hsl(var(--accent-mid))" stroke="hsl(var(--accent-dark))" strokeWidth="1.5" />
    <text x="150" y="104" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--primary-foreground))">
      Composition
    </text>
    <rect x="205" y="85" width="70" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="240" y="104" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--foreground))">
      Layout
    </text>
  </svg>
);

const MalleableVisual = () => (
  <svg viewBox="0 0 280 160" className="w-full max-w-[260px]">
    <line x1="140" y1="45" x2="50" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="45" x2="140" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="45" x2="230" y2="85" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <line x1="140" y1="115" x2="140" y2="130" stroke="hsl(var(--border-strong))" strokeWidth="1.5" />
    <rect x="65" y="10" width="150" height="38" rx="8" fill="hsl(var(--accent-light))" stroke="hsl(var(--accent-mid))" strokeWidth="1.5" />
    <text x="140" y="28" textAnchor="middle" fontSize="10" fontWeight="600" fill="hsl(var(--accent-dark))">
      Malleable ODI
    </text>
    <text x="140" y="42" textAnchor="middle" fontSize="8" fill="hsl(var(--text-tertiary))">
      reconfigurable
    </text>
    <rect x="5" y="85" width="90" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="50" y="104" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--foreground))">
      Developer
    </text>
    <rect x="105" y="85" width="70" height="30" rx="6" fill="hsl(var(--accent-mid))" stroke="hsl(var(--accent-dark))" strokeWidth="1.5" />
    <text x="140" y="104" textAnchor="middle" fontSize="9" fontWeight="600" fill="hsl(var(--primary-foreground))">
      Designer
    </text>
    <rect x="185" y="85" width="90" height="30" rx="6" fill="hsl(var(--surface-2))" stroke="hsl(var(--border))" strokeWidth="1" />
    <text x="230" y="104" textAnchor="middle" fontSize="9" fontWeight="500" fill="hsl(var(--foreground))">
      End User
    </text>
    <rect x="85" y="130" width="110" height="24" rx="6" fill="hsl(var(--green-light))" stroke="hsl(var(--green))" strokeWidth="1" />
    <text x="140" y="146" textAnchor="middle" fontSize="8" fontWeight="500" fill="hsl(var(--green))">
      Data model unchanged
    </text>
  </svg>
);

type ExplanationShape = {
  quote: string;
  visual?: ReactNode;
  apiVisual?: ExplainVisualPayload | null;
  plain: string;
  followups: string[];
};

const staticExplanations: Record<string, ExplanationShape> = {
  "hl-odi": {
    quote: '"Overview-detail interfaces (ODIs) are among the most ubiquitous interface patterns..."',
    visual: <ODIVisual />,
    plain:
      "Think of it like a YouTube homepage. You see a grid of thumbnails first — that's the overview. You scroll, scan, find one that looks interesting, and click it. Now you're watching the full video — that's the detail.\n\nODIs work the same way everywhere: email inboxes, shopping sites, your calendar. You never have to read everything — you browse first, then go deep on what matters.",
    followups: ['What makes an ODI "malleable"?', "Show me a real example in an app"],
  },
  "hl-meridian": {
    quote: '"The Meridian Framework proposes a specification language that separates..."',
    visual: <MeridianVisual />,
    plain:
      "Meridian is a system that lets you describe an interface in layers — what data to show, how it looks, and how it's arranged. Each layer is independent, so a designer can change visuals without breaking the developer's data logic.",
    followups: ["How does the spec language work?", "What are the three layers?"],
  },
  "hl-malleable": {
    quote: '"Malleable ODIs allow reconfiguration by multiple stakeholders..."',
    visual: <MalleableVisual />,
    plain:
      "A malleable ODI can be reshaped by different people — developers, designers, and end users — without them stepping on each other's toes. Each person controls their own layer, and the underlying data model stays untouched.",
    followups: ["Who are the three stakeholders?", "How is this different from regular customization?"],
  },
};

function findBuiltInHighlightText(sections: PaperSection[], highlightId: string): string | null {
  for (const s of sections) {
    for (const p of s.paragraphs) {
      const hl = p.highlights?.find((h) => h.id === highlightId);
      if (hl) return hl.text;
    }
  }
  return null;
}

function mapArchApiToTreeNodes(apiNodes: ArchApiNode[], allowedSectionIds: string[]): TreeNode[] {
  return apiNodes.map((n, i) => {
    const sid = n.sectionId != null ? String(n.sectionId) : "";
    const sectionId = allowedSectionIds.includes(sid) ? sid : allowedSectionIds[i % allowedSectionIds.length] ?? allowedSectionIds[0];
    const pageMatch = /^page-(\d+)$/.exec(sectionId);
    const sublabel = pageMatch
      ? `p. ${pageMatch[1]}`
      : typeof n.depth === "number"
        ? `depth ${n.depth}`
        : undefined;
    return {
      id: String(n.id),
      label: String(n.label),
      sublabel,
      sectionId,
      childrenIds: Array.isArray(n.children) ? n.children.map(String) : [],
      depth: typeof n.depth === "number" ? n.depth : 0,
    };
  });
}

interface UserHighlight {
  id: string;
  text: string;
  sectionId: string;
  paragraphIndex: number;
}

const Index = () => {
  const [paperId, setPaperId] = useState<SamplePaperId>("meridian");
  const activePaper = useMemo(() => getPaperById(paperId), [paperId]);
  const sections = activePaper.sections;

  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [selectionPreview, setSelectionPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<ExplanationShape | null>(null);
  const [activeTab, setActiveTab] = useState<"explain" | "architecture" | "chat">("explain");
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [userSelection, setUserSelection] = useState<{
    text: string;
    rect: DOMRect;
    sectionId?: string;
    paragraphIndex?: number;
  } | null>(null);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | null>(null);
  const [userHighlights, setUserHighlights] = useState<UserHighlight[]>([]);
  const [archNodesFromApi, setArchNodesFromApi] = useState<TreeNode[] | null>(null);
  const [archTitleFromApi, setArchTitleFromApi] = useState<string | null>(null);
  const [archLoading, setArchLoading] = useState(false);
  const [archError, setArchError] = useState<string | null>(null);
  const [pdfNumPages, setPdfNumPages] = useState(0);
  const [pdfExtractedText, setPdfExtractedText] = useState<string | null>(null);
  const [uploadedPdf, setUploadedPdf] = useState<{ objectUrl: string; fileName: string } | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadSession, setUploadSession] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const highlightCounter = useRef(0);
  const pdfScrollRef = useRef<HTMLDivElement>(null);
  const archFetchedRef = useRef(false);

  const sectionsFallbackText = useMemo(
    () =>
      sections
        .map((s) => `${s.title}\n\n${s.paragraphs.map((p) => p.text).join("\n\n")}`)
        .join("\n\n---\n\n"),
    [sections]
  );

  const usePdfViewer = Boolean(uploadedPdf || activePaper.pdfPublicUrl);

  const paperContext = useMemo(() => {
    if (uploadedPdf) return pdfExtractedText ?? "";
    if (activePaper.pdfPublicUrl != null) return pdfExtractedText ?? sectionsFallbackText;
    return sectionsFallbackText;
  }, [uploadedPdf, activePaper.pdfPublicUrl, pdfExtractedText, sectionsFallbackText]);

  const paperTextForArch = useMemo(() => paperContext.slice(0, 12000), [paperContext]);

  const sectionIds = useMemo(() => {
    if (usePdfViewer) {
      const fallbackPages = uploadedPdf ? 1 : activePaper.pageCount;
      const n = pdfNumPages > 0 ? pdfNumPages : fallbackPages;
      return Array.from({ length: Math.max(1, n) }, (_, i) => `page-${i + 1}`);
    }
    return sections.map((s) => s.id);
  }, [usePdfViewer, uploadedPdf, activePaper.pageCount, pdfNumPages, sections]);

  const architectureFallbackNodes = useMemo(() => {
    if (uploadedPdf) {
      if (isLikelyMeridianPdfFileName(uploadedPdf.fileName)) {
        return MERIDIAN_PDF_ARCH_NODES;
      }
      const n = pdfNumPages > 0 ? pdfNumPages : 1;
      const label = uploadedPdf.fileName.replace(/\.pdf$/i, "").trim() || "Uploaded PDF";
      return buildPageArchitectureNodes(n, label);
    }
    if (activePaper.pdfPublicUrl) {
      /** Bundled Meridian PDF: curated map beats per-page list + LLM guesses. */
      if (paperId === "meridian") {
        return MERIDIAN_PDF_ARCH_NODES;
      }
      const n = pdfNumPages > 0 ? pdfNumPages : activePaper.pageCount;
      const rootLabel =
        activePaper.pdfArchitectureRootLabel ??
        (activePaper.fileName.replace(/\.pdf$/i, "").trim() || activePaper.label);
      return buildPageArchitectureNodes(n, rootLabel);
    }
    return activePaper.architectureFallbackNodes;
  }, [
    uploadedPdf,
    paperId,
    activePaper.pdfPublicUrl,
    activePaper.pageCount,
    activePaper.architectureFallbackNodes,
    activePaper.pdfArchitectureRootLabel,
    activePaper.fileName,
    activePaper.label,
    pdfNumPages,
  ]);

  const architectureFallbackTitle = uploadedPdf
    ? `Uploaded: ${uploadedPdf.fileName}`
    : activePaper.architectureFallbackTitle;

  const chatWelcomeMessage = uploadedPdf
    ? `Hi! Ask anything about “${uploadedPdf.fileName}” — answers use the text extracted from your PDF on the left.`
    : activePaper.chatWelcomeMessage;

  const chatSuggestions = uploadedPdf
    ? ["Summarize this PDF", "What is the main contribution?", "Explain the methodology", "What terms should I know?"]
    : activePaper.chatSuggestions;

  const chatTabKey = uploadedPdf ? `upload-${uploadSession}` : paperId;

  const pdfDisplayName = uploadedPdf?.fileName ?? activePaper.fileName;

  useEffect(() => {
    setUploadedPdf((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    archFetchedRef.current = false;
    setUserHighlights([]);
    setActiveHighlight(null);
    setSelectionPreview(null);
    setExplanation(null);
    setUserSelection(null);
    setChatInitialMessage(null);
    setActiveSectionId(null);
    setArchNodesFromApi(null);
    setArchTitleFromApi(null);
    setArchError(null);
    setArchLoading(false);
    highlightCounter.current = 0;
    setPdfNumPages(0);
    setPdfExtractedText(null);
  }, [paperId]);

  useEffect(() => {
    if (uploadedPdf) return;
    if (!activePaper.pdfPublicUrl) {
      setPdfExtractedText(null);
      return;
    }
    let cancelled = false;
    setPdfExtractedText(null);
    (async () => {
      try {
        const { text } = await extractFullTextFromPdf(activePaper.pdfPublicUrl);
        if (!cancelled) setPdfExtractedText(text);
      } catch {
        if (!cancelled) setPdfExtractedText(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePaper.pdfPublicUrl, uploadedPdf]);

  useEffect(() => {
    archFetchedRef.current = false;
  }, [paperTextForArch]);

  useEffect(() => {
    if (activeTab !== "architecture" || archFetchedRef.current) return;
    const useCuratedMeridianArch =
      (paperId === "meridian" && Boolean(activePaper.pdfPublicUrl) && !uploadedPdf) ||
      Boolean(uploadedPdf && isLikelyMeridianPdfFileName(uploadedPdf.fileName));
    if (useCuratedMeridianArch) {
      archFetchedRef.current = true;
      return;
    }
    archFetchedRef.current = true;
    let cancelled = false;
    let completed = false;
    (async () => {
      setArchLoading(true);
      setArchError(null);
      try {
        const data = await fetchArchitecture(paperTextForArch, sectionIds);
        if (cancelled) return;
        completed = true;
        setArchTitleFromApi(data.title);
        setArchNodesFromApi(mapArchApiToTreeNodes(data.nodes, sectionIds));
      } catch (e) {
        if (!cancelled) {
          completed = true;
          setArchError(e instanceof Error ? e.message : "Could not load architecture");
          setArchNodesFromApi(null);
          setArchTitleFromApi(null);
        }
      } finally {
        if (!cancelled) setArchLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (!completed) archFetchedRef.current = false;
    };
  }, [activeTab, paperTextForArch, sectionIds, paperId, uploadedPdf, activePaper.pdfPublicUrl]);

  const clearUpload = useCallback(() => {
    setUploadedPdf((prev) => {
      if (prev) URL.revokeObjectURL(prev.objectUrl);
      return null;
    });
    setPdfExtractedText(null);
    setPdfNumPages(0);
    setUploadSession((s) => s + 1);
  }, []);

  const onPdfFileSelected = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const file = input.files?.[0];
      input.value = "";
      if (!file) return;
      const okType = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      if (!okType) return;

      setUploadBusy(true);
      setUploadedPdf((prev) => {
        if (prev) URL.revokeObjectURL(prev.objectUrl);
        return { objectUrl: URL.createObjectURL(file), fileName: file.name };
      });
      setUploadSession((s) => s + 1);
      setPdfExtractedText(null);
      setPdfNumPages(0);
      try {
        const buf = await file.arrayBuffer();
        const { text, numPages } = await extractFullTextFromPdfBuffer(buf);
        setPdfExtractedText(text);
        setPdfNumPages(numPages);
      } catch {
        setPdfExtractedText("");
        setPdfNumPages(1);
      } finally {
        setUploadBusy(false);
      }
    },
    []
  );

  const runExplain = useCallback(async (snippet: string, staticFallbackId: string | null) => {
    const trimmed = snippet.trim();
    if (!trimmed) return;
    setSelectionPreview(trimmed);
    setIsLoading(true);
    setExplanation(null);
    setActiveTab("explain");
    try {
      const res = await fetchExplain(trimmed);
      setExplanation({
        quote: `"${trimmed.slice(0, 120)}${trimmed.length > 120 ? "…" : ""}"`,
        plain: res.explanation,
        followups: [],
        apiVisual: res.visual,
      });
    } catch {
      if (staticFallbackId && staticExplanations[staticFallbackId]) {
        setExplanation(staticExplanations[staticFallbackId]);
      } else {
        setExplanation({
          quote: `"${trimmed.slice(0, 120)}${trimmed.length > 120 ? "…" : ""}"`,
          plain:
            "We couldn't reach the AI. From the repo root run `python backend/run.py` (port 8000) and set GEMINI_API_KEY. The Vite dev server proxies /api to the backend.",
          followups: [],
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleHighlightClick = useCallback(
    async (id: string, text: string) => {
      setActiveHighlight(id);
      const snippet = text.trim() || findBuiltInHighlightText(sections, id) || "";
      const fallback = id in staticExplanations ? id : null;
      await runExplain(snippet, fallback);
    },
    [runExplain, sections]
  );

  const addUserHighlight = useCallback((text: string, sectionId: string, paragraphIndex: number): string => {
    const id = `user-hl-${++highlightCounter.current}`;
    setUserHighlights((prev) => [...prev, { id, text, sectionId, paragraphIndex }]);
    return id;
  }, []);

  const handleRemoveHighlight = useCallback(
    (hlId: string) => {
      setUserHighlights((prev) => prev.filter((h) => h.id !== hlId));
      if (activeHighlight === hlId) {
        setActiveHighlight(null);
        setSelectionPreview(null);
        setExplanation(null);
      }
    },
    [activeHighlight]
  );

  const handleUserExplain = useCallback(
    async (text: string, sectionId?: string, paragraphIndex?: number) => {
      setUserSelection(null);
      let hlId = "user-selection";
      if (sectionId !== undefined && paragraphIndex !== undefined) {
        hlId = addUserHighlight(text, sectionId, paragraphIndex);
      }
      setActiveHighlight(hlId);
      await runExplain(text, null);
    },
    [addUserHighlight, runExplain]
  );

  const handleUserChat = useCallback(
    (text: string, sectionId?: string, paragraphIndex?: number) => {
      setUserSelection(null);
      if (sectionId !== undefined && paragraphIndex !== undefined) {
        addUserHighlight(text, sectionId, paragraphIndex);
      }
      setChatInitialMessage(text);
      setActiveTab("chat");
    },
    [addUserHighlight]
  );

  const handleTextSelection = useCallback((text: string, rect: DOMRect, sectionId: string, paragraphIndex: number) => {
    if (text.trim().length > 3) {
      setUserSelection({ text: text.trim(), rect, sectionId, paragraphIndex });
    }
  }, []);

  const handleClearSelection = useCallback(() => {
    setUserSelection(null);
  }, []);

  const handleNodeClick = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
    const pageMatch = /^page-(\d+)$/.exec(sectionId);
    if (pageMatch) {
      document.getElementById(`pdf-page-${pageMatch[1]}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleScrollSection = useCallback((sectionId: string) => {
    setActiveSectionId(sectionId);
  }, []);

  const activeSection =
    activeSectionId ||
    (!usePdfViewer && activeHighlight
      ? sections.find((s) => s.paragraphs.some((p) => p.highlights?.some((h) => h.id === activeHighlight)))?.id ??
        null
      : null);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="flex flex-col w-full max-w-[1100px] h-[82vh] min-h-[580px] max-h-[800px] rounded-lg overflow-hidden border border-border-strong shadow-md">
        <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border bg-surface-2/80">
          <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wide">Document</span>
          <div className="flex rounded-lg border border-border bg-background p-0.5 gap-0.5">
            {SAMPLE_PAPERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPaperId(p.id)}
                className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                  !uploadedPdf && paperId === p.id
                    ? "bg-accent-mid text-primary-foreground shadow-sm"
                    : "text-text-secondary hover:text-foreground hover:bg-surface-2"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            aria-label="Upload PDF"
            onChange={onPdfFileSelected}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadBusy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-md border border-border bg-background text-foreground hover:bg-surface-2 disabled:opacity-50 disabled:pointer-events-none transition-colors"
          >
            {uploadBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            {uploadBusy ? "Indexing…" : "Upload PDF"}
          </button>
          {uploadedPdf ? (
            <span className="inline-flex items-center gap-1 max-w-[min(220px,40vw)] rounded-md border border-accent-mid/30 bg-accent-light/40 px-2 py-1 text-[11px] text-accent-dark">
              <span className="truncate font-medium" title={uploadedPdf.fileName}>
                {uploadedPdf.fileName}
              </span>
              <button
                type="button"
                onClick={clearUpload}
                className="shrink-0 p-0.5 rounded hover:bg-accent-mid/20 text-accent-dark"
                aria-label="Remove uploaded PDF"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 min-h-0">
        {usePdfViewer ? (
          <PdfReaderPane
            fileUrl={(uploadedPdf?.objectUrl ?? activePaper.pdfPublicUrl) as string}
            documentFileName={pdfDisplayName}
            scrollRef={pdfScrollRef}
            activePageSectionId={activeSection}
            onTextSelection={handleTextSelection}
            userSelection={userSelection}
            onExplainSelection={handleUserExplain}
            onChatSelection={handleUserChat}
            onClearSelection={handleClearSelection}
            onDocumentLoaded={setPdfNumPages}
          />
        ) : (
          <PDFPane
            sections={sections}
            documentFileName={activePaper.fileName}
            pageCount={activePaper.pageCount}
            activeSection={activeSection}
            activeHighlight={activeHighlight}
            onHighlightClick={handleHighlightClick}
            onTextSelection={handleTextSelection}
            userSelection={userSelection}
            onExplainSelection={handleUserExplain}
            onChatSelection={handleUserChat}
            onClearSelection={handleClearSelection}
            onScrollSection={handleScrollSection}
            scrollRef={pdfScrollRef}
            userHighlights={userHighlights}
            onRemoveHighlight={handleRemoveHighlight}
          />
        )}
        <SidePanel
          selectionPreview={selectionPreview}
          paperContext={paperContext}
          explanation={explanation}
          isLoading={isLoading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          chatInitialMessage={chatInitialMessage}
          onClearChatInitial={() => setChatInitialMessage(null)}
          activeSectionId={activeSectionId}
          onNodeClick={handleNodeClick}
          archNodesFromApi={archNodesFromApi}
          archTitleFromApi={archTitleFromApi}
          archLoading={archLoading}
          archError={archError}
          chatTabKey={chatTabKey}
          architectureFallbackNodes={architectureFallbackNodes}
          architectureFallbackTitle={architectureFallbackTitle}
          chatWelcomeMessage={chatWelcomeMessage}
          chatSuggestions={chatSuggestions}
        />
        </div>
      </div>
    </div>
  );
};

export default Index;
