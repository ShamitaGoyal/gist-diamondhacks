import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Layers, PanelRightOpen } from 'lucide-react';
import { ExtensionHeader, type LensMode } from './components/ExtensionHeader';
import { MapFlow } from './components/MapFlow';
import { LogicHub } from './components/LogicHub';
import { LogicWarningBadges } from './components/LogicWarningBadges';
import { ConsoleChartBlock, type ConsoleChartSpec } from './components/ConsoleChartBlock';
import type { ConsoleLogicWarning } from './lens/consoleCritique';
import { mockConsoleCritique } from './lens/consoleCritique';
import { SemanticScrollbar } from './components/SemanticScrollbar';
import { SkeletonLoader } from './components/SkeletonLoader';
import { PDFViewer } from './components/PDFViewer';
import { EditorSelectionChip } from './components/EditorSelectionChip';
import { LensTrigger } from './components/LensTrigger';
import { MiniLensBubble, MiniLensLoadingChip } from './components/MiniLensBubble';
import {
  mockLensEditorChatReply,
  mockMiniLensChatReply,
  mockMiniLensInsight
} from './lens/mockMiniLens';
import { lensVariables, type VisualPresetId } from './visualPresets';
import type { MapDAGNode } from './lens/mapdag';
import type { SelectionAnchor } from './lens/types';
import type { VisualDispatchResponse, VisualPrimitiveType } from './lens/visualDispatch';
import { fetchVisualDispatch } from './lens/visualDispatchApi';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';

const PRESET_ORDER: VisualPresetId[] = ['paper-native', 'blueprint', 'sketch'];

type ChatContextSnippet = {
  id: string;
  text: string;
  label: string;
};

type LogicChainCard = {
  nodes: { label: string; type: 'variable' | 'result' }[];
  connector: '+' | '-' | '→';
  summary: string;
  category: 'method' | 'result' | 'theory';
  anchor?: SelectionAnchor;
};

type LensConsoleMessage =
  | { role: 'user'; kind: 'text'; text: string }
  | { role: 'assistant'; kind: 'text'; text: string }
  | { role: 'assistant'; kind: 'critique'; warnings: ConsoleLogicWarning[] }
  | { role: 'assistant'; kind: 'chart'; chart: ConsoleChartSpec };

const DAG_NODES: MapDAGNode[] = [
  {
    id: 'thesis',
    label: 'Meridian framework',
    type: 'thesis',
    x: 100,
    y: 20,
    children: ['method1', 'method2'],
    sectionId: 'fig1'
  },
  {
    id: 'method1',
    label: 'Specification language',
    type: 'method',
    x: 40,
    y: 100,
    children: ['finding1'],
    sectionId: '3'
  },
  {
    id: 'method2',
    label: 'Content · Composition · Layout',
    type: 'method',
    x: 180,
    y: 100,
    children: ['finding2', 'finding3'],
    sectionId: '3.1'
  },
  {
    id: 'finding1',
    label: 'Malleable ODIs',
    type: 'finding',
    x: 30,
    y: 220,
    sectionId: '2'
  },
  {
    id: 'finding2',
    label: 'Three stakeholders',
    type: 'finding',
    x: 150,
    y: 220,
    sectionId: '3'
  },
  {
    id: 'finding3',
    label: 'Open-source tools',
    type: 'finding',
    x: 230,
    y: 220,
    sectionId: '2'
  }
];

const SCROLLBAR_MARKERS = [
  { position: 15, type: 'definition' as const },
  { position: 28, type: 'evidence' as const },
  { position: 42, type: 'claim' as const },
  { position: 56, type: 'evidence' as const },
  { position: 71, type: 'definition' as const },
  { position: 85, type: 'evidence' as const }
];

function formatContextLine(anchor: SelectionAnchor | null): string | undefined {
  if (!anchor) return undefined;
  const sec = anchor.sectionId ? `§${anchor.sectionId}` : 'No section';
  return `${sec} · p.${anchor.pageNumber}`;
}

export default function App() {
  const [lensOpen, setLensOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<LensMode>('logic');
  const [logicPresentation, setLogicPresentation] = useState<'technical' | 'story'>('technical');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectionAnchor, setSelectionAnchor] = useState<SelectionAnchor | null>(null);
  const [showLensTrigger, setShowLensTrigger] = useState(false);
  const [highlightedSections, setHighlightedSections] = useState<string[]>([]);
  const [scrollToSectionId, setScrollToSectionId] = useState<string | null>(null);
  const [activeScrollSectionId, setActiveScrollSectionId] = useState<string | null>(null);
  const [visualPreset, setVisualPreset] = useState<VisualPresetId>('paper-native');
  const [logicCards, setLogicCards] = useState<LogicChainCard[]>([]);
  const [visualDispatch, setVisualDispatch] = useState<VisualDispatchResponse | null>(null);
  const [cognitiveDepth, setCognitiveDepth] = useState<'skim' | 'deep'>('skim');
  const [miniLens, setMiniLens] = useState<{
    viewportAnchor: { x: number; y: number };
    story: string;
    concepts: { label: string; value: number }[];
  } | null>(null);
  const [selectionViewport, setSelectionViewport] = useState<{ x: number; y: number } | null>(null);
  const [miniLensLoading, setMiniLensLoading] = useState(false);
  const [chatContextSnippets, setChatContextSnippets] = useState<ChatContextSnippet[]>([]);
  const [editorAddChipVisible, setEditorAddChipVisible] = useState(false);
  const [lensChatMessages, setLensChatMessages] = useState<LensConsoleMessage[]>([]);
  const [lensChatDraft, setLensChatDraft] = useState('');
  const [lensChatBusy, setLensChatBusy] = useState(false);
  const [visualCompileError, setVisualCompileError] = useState<string | null>(null);
  const compileInFlightRef = useRef(false);

  const summaryData = {
    keyPoints: [
      'Meridian is a declarative framework for malleable overview-detail interfaces across tools and stakeholders.',
      'Designers, developers, and end-users share one specification language for layouts and customizations.',
      'Meridian lowers the cost of end-user malleability versus typical fragmented document-tool pipelines.'
    ],
    readTime: 14
  };

  const lensStyle = useMemo(() => lensVariables(visualPreset), [visualPreset]);

  const contextLine = useMemo(() => formatContextLine(selectionAnchor), [selectionAnchor]);

  const handleCloseLens = useCallback(() => {
    setLensOpen(false);
    setShowLensTrigger(false);
    setMiniLensLoading(false);
    setEditorAddChipVisible(false);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lensOpen) handleCloseLens();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lensOpen, handleCloseLens]);

  const cyclePreset = useCallback(() => {
    setVisualPreset((p) => {
      const i = PRESET_ORDER.indexOf(p);
      return PRESET_ORDER[(i + 1) % PRESET_ORDER.length];
    });
  }, []);

  const handleTextSelection = (
    text: string,
    position: { x: number; y: number },
    anchor: SelectionAnchor,
    viewportAnchor: { x: number; y: number }
  ) => {
    setSelectedText(text);
    setSelectionPosition(position);
    setSelectionViewport(viewportAnchor);
    setSelectionAnchor(anchor);
    setMiniLens(null);
    setMiniLensLoading(false);
    setVisualDispatch(null);
    setLogicCards([]);
    if (lensOpen) {
      setShowLensTrigger(false);
      setEditorAddChipVisible(text.length >= 8);
    } else {
      setShowLensTrigger(true);
      setEditorAddChipVisible(false);
      setActiveTab('logic');
    }
  };

  const handleAddSelectionToChat = useCallback(() => {
    if (!selectedText.trim() || selectedText.length < 8) return;
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const label = formatContextLine(selectionAnchor) ?? 'PDF selection';
    setChatContextSnippets((prev) => [...prev, { id, text: selectedText, label }]);
    setEditorAddChipVisible(false);
    setActiveTab('console');
  }, [selectedText, selectionAnchor]);

  const sendLensEditorChat = useCallback(
    async (messageText: string) => {
      const msg = messageText.trim();
      if (!msg || lensChatBusy) return;
      setLensChatDraft('');
      const lower = msg.toLowerCase();

      if (lower.startsWith('/critique')) {
        setLensChatMessages((prev) => [...prev, { role: 'user', kind: 'text', text: msg }]);
        setLensChatBusy(true);
        try {
          const warnings = await mockConsoleCritique(selectedText || '');
          setLensChatMessages((prev) => [...prev, { role: 'assistant', kind: 'critique', warnings }]);
        } finally {
          setLensChatBusy(false);
        }
        return;
      }

      if (lower === '/chart' || lower.startsWith('/chart ')) {
        setLensChatMessages((prev) => [
          ...prev,
          { role: 'user', kind: 'text', text: msg },
          {
            role: 'assistant',
            kind: 'chart',
            chart: {
              title: 'Demo · loss curve',
              points: [0, 1, 2, 3, 4, 5, 6, 7, 8].map((x) => ({
                x,
                y: Math.max(0.2, 3 / (x + 0.8) + Math.sin(x) * 0.15)
              }))
            }
          }
        ]);
        return;
      }

      const texts = chatContextSnippets.map((s) => s.text);
      setLensChatMessages((prev) => [...prev, { role: 'user', kind: 'text', text: msg }]);
      setLensChatBusy(true);
      try {
        const reply = await mockLensEditorChatReply(msg, texts);
        setLensChatMessages((prev) => [...prev, { role: 'assistant', kind: 'text', text: reply }]);
      } catch {
        setLensChatMessages((prev) => [
          ...prev,
          { role: 'assistant', kind: 'text', text: 'Could not generate a demo reply. Try again.' }
        ]);
      } finally {
        setLensChatBusy(false);
      }
    },
    [lensChatBusy, chatContextSnippets, selectedText]
  );

  const handleOpenFullLensFromTrigger = useCallback(() => {
    setLensOpen(true);
    setActiveTab('logic');
  }, []);

  const handleMiniLensFromTrigger = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setMiniLensLoading(true);
    try {
      const anchor = selectionViewport ?? { x: 120, y: 120 };
      const insight = await mockMiniLensInsight(text);
      setMiniLens({ viewportAnchor: anchor, story: insight.story, concepts: insight.concepts });
    } finally {
      setMiniLensLoading(false);
    }
  }, [selectionViewport]);

  const handleExplainSelection = async () => {
    if (compileInFlightRef.current) return;
    compileInFlightRef.current = true;
    setIsProcessing(true);
    setShowLensTrigger(false);

    const anchor: SelectionAnchor =
      selectionAnchor ?? {
        pageNumber: 1,
        sectionId: null,
        rect: { x: 0, y: 0, width: 0, height: 0 }
      };

    try {
      setVisualCompileError(null);
      const response = await fetchVisualDispatch(selectedText, cognitiveDepth);
      setVisualDispatch(response);

      const catMap: Record<VisualPrimitiveType, LogicChainCard['category']> = {
        causal_flow: 'theory',
        procedure_rail: 'method',
        comp_table: 'result',
        data_sketcher: 'method'
      };
      const mockExtractedLogic: LogicChainCard = {
        nodes: [
          { label: selectedText.substring(0, 30) + (selectedText.length > 30 ? '…' : ''), type: 'variable' },
          { label: response.primitive_type.replace(/_/g, ' '), type: 'result' }
        ],
        connector: '→',
        summary: response.summary,
        category: catMap[response.primitive_type],
        anchor
      };

      setLogicCards((prev) => (cognitiveDepth === 'skim' ? [mockExtractedLogic] : [mockExtractedLogic, ...prev]));
      setActiveTab('logic');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not compile highlight.';
      setVisualCompileError(msg);
      setVisualDispatch(null);
    } finally {
      compileInFlightRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleNodeClick = useCallback((_nodeId: string, sectionId?: string) => {
    if (!sectionId) return;
    setHighlightedSections([sectionId]);
    setScrollToSectionId(null);
    requestAnimationFrame(() => setScrollToSectionId(sectionId));
  }, []);

  const sketchStrokes = visualPreset === 'sketch';

  const architectureToolbar = (
    <div
      className="mb-2 shrink-0 rounded-[4px] border px-3 py-2"
      style={{
        borderColor: 'var(--lens-border)',
        backgroundColor: 'var(--lens-surface)'
      }}
    >
      <p className="text-[11px] leading-snug text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
        Scroll the PDF—nodes glow when their section is in view. Click a node to jump to that section.
      </p>
    </div>
  );

  const renderScrollPanel = () => {
    if (activeTab === 'architecture') {
      return null;
    }
    if (isProcessing) {
      return (
        <div className="space-y-3">
          <SkeletonLoader />
          <SkeletonLoader />
        </div>
      );
    }
    if (activeTab === 'logic') {
      return (
        <div className="space-y-3">
          {visualCompileError ? (
            <div
              className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-snug text-amber-950"
              style={{ fontFamily: 'var(--lens-font-body)' }}
              role="alert"
            >
              <span className="font-medium">Visual compile failed.</span> {visualCompileError}
            </div>
          ) : null}
          <LogicHub
            logicPresentation={logicPresentation}
            onLogicPresentationChange={setLogicPresentation}
            summaryData={summaryData}
            visualDispatch={visualDispatch}
            logicCards={logicCards}
            cognitiveDepth={cognitiveDepth}
            sketchStrokes={sketchStrokes}
            highlightPreview={selectedText}
          />
        </div>
      );
    }

    return (
      <div className="flex min-h-[min(300px,48vh)] flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[11px] leading-snug text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
            Type <span className="font-medium text-[var(--lens-fg)]">/critique</span> for logic-warning badges from your current PDF selection, or{' '}
            <span className="font-medium text-[var(--lens-fg)]">/chart</span> for a Recharts demo. Pin passages with{' '}
            <span className="font-medium text-[var(--lens-fg)]">Add to chat</span>.
          </p>
          {chatContextSnippets.length > 0 ? (
            <button
              type="button"
              onClick={() => setChatContextSnippets([])}
              className="shrink-0 rounded-sm border px-2 py-1 text-[10px] font-medium transition-opacity hover:opacity-90"
              style={{
                fontFamily: 'var(--lens-font-mono)',
                borderColor: 'var(--lens-border)',
                color: 'var(--lens-muted)'
              }}
            >
              Clear pins
            </button>
          ) : null}
        </div>

        {chatContextSnippets.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
              Pinned to console ({chatContextSnippets.length})
            </p>
            <div className="flex max-h-32 flex-col gap-1.5 overflow-y-auto">
              {chatContextSnippets.map((s) => (
                <div
                  key={s.id}
                  className="rounded-sm border px-2 py-1.5"
                  style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
                >
                  <div className="mb-0.5 flex items-center justify-between gap-1">
                    <span className="text-[10px] text-[var(--lens-accent)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                      {s.label}
                    </span>
                    <button
                      type="button"
                      onClick={() => setChatContextSnippets((prev) => prev.filter((x) => x.id !== s.id))}
                      className="text-[10px] text-[var(--lens-muted)] underline-offset-2 hover:underline"
                      style={{ fontFamily: 'var(--lens-font-body)' }}
                    >
                      Remove
                    </button>
                  </div>
                  <p className="line-clamp-3 text-[11px] leading-snug text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
                    {s.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="rounded-sm border border-dashed px-3 py-2"
            style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
          >
            <p className="text-[11px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
              No passages pinned. Select in the PDF while Lens is open, then tap <span className="font-medium text-[var(--lens-fg)]">Add to chat</span>.
            </p>
          </div>
        )}

        <div
          className="min-h-[160px] flex-1 space-y-2 overflow-y-auto rounded-sm border p-3"
          style={{ borderWidth: 1, borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
        >
          {lensChatMessages.length === 0 ? (
            <p className="text-[12px] leading-relaxed text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
              Ask across pins, or run <span className="font-medium text-[var(--lens-fg)]">/critique</span> / <span className="font-medium text-[var(--lens-fg)]">/chart</span>.
            </p>
          ) : (
            lensChatMessages.map((line, i) => {
              if (line.role === 'user') {
                return (
                  <div
                    key={i}
                    className="ml-3 rounded-sm border px-2.5 py-2 text-[12px] leading-relaxed"
                    style={{
                      borderColor: 'var(--lens-border)',
                      backgroundColor: 'var(--lens-surface-2)',
                      fontFamily: 'var(--lens-font-body)',
                      color: 'var(--lens-fg)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    <span
                      className="mb-1 block text-[9px] font-medium uppercase tracking-wide text-[var(--lens-muted)]"
                      style={{ fontFamily: 'var(--lens-font-mono)' }}
                    >
                      You
                    </span>
                    {line.text}
                  </div>
                );
              }
              if (line.kind === 'text') {
                return (
                  <div
                    key={i}
                    className="mr-3 rounded-sm border px-2.5 py-2 text-[12px] leading-relaxed"
                    style={{
                      borderColor: 'var(--lens-border)',
                      backgroundColor: 'var(--lens-bg)',
                      fontFamily: 'var(--lens-font-body)',
                      color: 'var(--lens-fg)',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    <span
                      className="mb-1 block text-[9px] font-medium uppercase tracking-wide text-[var(--lens-muted)]"
                      style={{ fontFamily: 'var(--lens-font-mono)' }}
                    >
                      Lens
                    </span>
                    {line.text}
                  </div>
                );
              }
              if (line.kind === 'critique') {
                return (
                  <div
                    key={i}
                    className="mr-3 rounded-sm border px-2.5 py-2"
                    style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-bg)' }}
                  >
                    <span
                      className="mb-2 block text-[9px] font-medium uppercase tracking-wide text-[var(--lens-muted)]"
                      style={{ fontFamily: 'var(--lens-font-mono)' }}
                    >
                      Lens · /critique
                    </span>
                    <LogicWarningBadges warnings={line.warnings} />
                  </div>
                );
              }
              if (line.kind === 'chart') {
                return (
                  <div
                    key={i}
                    className="mr-3 rounded-sm border px-2.5 py-2"
                    style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-bg)' }}
                  >
                    <span
                      className="mb-2 block text-[9px] font-medium uppercase tracking-wide text-[var(--lens-muted)]"
                      style={{ fontFamily: 'var(--lens-font-mono)' }}
                    >
                      Lens · chart
                    </span>
                    <ConsoleChartBlock spec={line.chart} />
                  </div>
                );
              }
              return null;
            })
          )}
          {lensChatBusy ? (
            <p className="text-[11px] italic text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
              Generating…
            </p>
          ) : null}
        </div>
      </div>
    );
  };

  const pdfLayer = (
    <div className="relative h-full min-h-0 overflow-hidden">
      <PDFViewer
        onTextSelect={handleTextSelection}
        highlightedSections={highlightedSections}
        activeSectionId={activeScrollSectionId}
        scrollToSectionId={scrollToSectionId}
        onActiveSectionChange={setActiveScrollSectionId}
      />
      {showLensTrigger && selectionPosition && !lensOpen && !miniLens && !miniLensLoading && (
        <LensTrigger
          position={selectionPosition}
          anchor={selectionAnchor}
          selectedText={selectedText}
          onMiniLens={(t) => void handleMiniLensFromTrigger(t)}
          onFullLens={handleOpenFullLensFromTrigger}
          onClose={() => setShowLensTrigger(false)}
        />
      )}

      {miniLensLoading && selectionViewport ? (
        <MiniLensLoadingChip anchor={selectionViewport} lensThemeStyle={lensStyle} />
      ) : null}

      {lensOpen && editorAddChipVisible && selectionPosition && selectedText.length >= 8 ? (
        <EditorSelectionChip
          position={selectionPosition}
          onAddToChat={handleAddSelectionToChat}
          onDismiss={() => setEditorAddChipVisible(false)}
        />
      ) : null}

      {miniLens ? (
        <MiniLensBubble
          key={`${miniLens.viewportAnchor.x},${miniLens.viewportAnchor.y}`}
          lensThemeStyle={lensStyle}
          viewportAnchor={miniLens.viewportAnchor}
          story={miniLens.story}
          concepts={miniLens.concepts}
          selectionPreview={selectedText}
          onClose={() => setMiniLens(null)}
          onOpenFullLens={() => {
            setMiniLens(null);
            setLensOpen(true);
            setActiveTab('logic');
          }}
          onSendChat={(msg) => mockMiniLensChatReply(msg, selectedText)}
        />
      ) : null}
      {!lensOpen ? (
        <>
          <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 max-w-md -translate-x-1/2 px-4 text-center">
            <div
              className="rounded-sm border px-4 py-2 backdrop-blur-sm"
              style={{
                borderColor: 'var(--lens-border)',
                backgroundColor: 'color-mix(in srgb, var(--lens-surface) 92%, transparent)',
                color: 'var(--lens-muted)',
                fontFamily: 'var(--lens-font-body)',
                fontSize: 12
              }}
            >
              Select text — then choose Mini (story + chart bubble) or Full Lens (Logic · Architecture · Console).
            </div>
          </div>
          {selectedText.length > 0 ? (
            <button
              type="button"
              onClick={() => setLensOpen(true)}
              className="fixed right-0 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-sm border border-r-0 py-3 pl-1 pr-1.5 transition-colors hover:opacity-95"
              style={{
                borderColor: 'var(--lens-border)',
                backgroundColor: 'var(--lens-surface)',
                color: 'var(--lens-fg)',
                fontFamily: 'var(--lens-font-mono)',
                fontSize: 10
              }}
              title="Reopen Lens"
            >
              <PanelRightOpen className="h-4 w-4 text-[var(--lens-accent)]" />
              <span className="max-w-[3rem] text-center leading-tight">Lens</span>
            </button>
          ) : null}
        </>
      ) : null}
    </div>
  );

  return (
    <div
      className="h-screen w-full"
      style={{
        ...lensStyle,
        fontFamily: 'var(--lens-font-body, Inter, sans-serif)'
      }}
    >
      {lensOpen ? (
        <ResizablePanelGroup direction="horizontal" autoSaveId="lens-pdf-sidebar" className="h-full w-full">
          <ResizablePanel defaultSize={62} minSize={40} className="min-h-0 min-w-0">
            {pdfLayer}
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="w-1.5 shrink-0 border-x border-[var(--lens-border)] bg-[var(--lens-surface)] transition-colors hover:bg-[var(--lens-surface-2)]"
          />

          <ResizablePanel
            defaultSize={38}
            minSize={22}
            maxSize={52}
            className="relative flex h-full min-h-0 min-w-0 flex-col border-l border-[var(--lens-border)]"
            style={{
              backgroundColor: 'var(--lens-bg)',
              color: 'var(--lens-fg)'
            }}
          >
            <ExtensionHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onCloseLens={handleCloseLens}
              contextLine={contextLine}
              selectionPreview={selectedText || undefined}
            />

            {activeTab === 'logic' && selectedText.length >= 8 ? (
              <div
                className="flex shrink-0 justify-end border-b px-4 py-2"
                style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
              >
                <button
                  type="button"
                  onClick={() => void handleExplainSelection()}
                  disabled={isProcessing}
                  className="rounded-sm border px-3 py-1.5 text-[12px] font-medium transition-opacity disabled:opacity-50"
                  style={{
                    fontFamily: 'var(--lens-font-body)',
                    borderColor: 'var(--lens-border)',
                    backgroundColor: 'var(--lens-fg)',
                    color: 'var(--lens-surface)'
                  }}
                >
                  {visualDispatch ? 'Re-compile highlight' : 'Compile highlight'}
                </button>
              </div>
            ) : null}

            <div className="absolute right-2 top-[5.5rem] z-10 flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={cyclePreset}
                className="flex items-center gap-1 rounded-sm border px-2 py-1 text-[11px] transition-opacity hover:opacity-90"
                style={{
                  borderColor: 'var(--lens-border)',
                  backgroundColor: 'var(--lens-surface)',
                  color: 'var(--lens-muted)',
                  fontFamily: 'var(--lens-font-mono)'
                }}
                title="Style preset"
              >
                <Layers className="h-3 w-3" />
                {visualPreset.replace('-', ' ')}
              </button>
            </div>

            {activeTab === 'architecture' ? (
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-3 pb-2">
                {architectureToolbar}
                <div className="min-h-0 flex-1">
                  <MapFlow
                    dagNodes={DAG_NODES}
                    onNodeClick={handleNodeClick}
                    sketchStrokes={sketchStrokes}
                    visualPreset={visualPreset}
                    activeScrollSectionId={activeScrollSectionId}
                    fillHeight
                  />
                </div>
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-2">{renderScrollPanel()}</div>
            )}

            {activeTab === 'console' ? (
              <div
                className="shrink-0 border-t px-3 py-2.5"
                style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
              >
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <span
                    className="rounded-md border px-2 py-0.5 text-[10px] text-[var(--lens-muted)]"
                    style={{ borderColor: 'var(--lens-border)', fontFamily: 'var(--lens-font-mono)' }}
                  >
                    @paper
                  </span>
                  {chatContextSnippets.length > 0 ? (
                    <span
                      className="rounded-md border px-2 py-0.5 text-[10px]"
                      style={{
                        borderColor: 'var(--lens-border)',
                        backgroundColor: 'var(--lens-surface-2)',
                        color: 'var(--lens-accent)',
                        fontFamily: 'var(--lens-font-mono)'
                      }}
                    >
                      {chatContextSnippets.length} pin{chatContextSnippets.length === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span
                      className="rounded-md border border-dashed px-2 py-0.5 text-[10px] text-[var(--lens-muted)]"
                      style={{ borderColor: 'var(--lens-border)', fontFamily: 'var(--lens-font-mono)' }}
                    >
                      add highlights
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={lensChatDraft}
                    onChange={(e) => setLensChatDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      e.preventDefault();
                      void sendLensEditorChat((e.target as HTMLInputElement).value);
                    }}
                    placeholder="Ask across your pinned passages…"
                    disabled={lensChatBusy}
                    className="min-w-0 flex-1 rounded-sm border px-3 py-2 text-[13px] font-normal outline-none transition-colors focus:border-[var(--lens-accent)] disabled:opacity-60"
                    style={{
                      fontFamily: 'var(--lens-font-body)',
                      borderColor: 'var(--lens-border)',
                      backgroundColor: 'var(--lens-bg)',
                      color: 'var(--lens-fg)'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => void sendLensEditorChat(lensChatDraft)}
                    disabled={lensChatBusy || !lensChatDraft.trim()}
                    className="shrink-0 rounded-sm border px-3 py-2 text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-40"
                    style={{
                      fontFamily: 'var(--lens-font-body)',
                      borderColor: 'var(--lens-border)',
                      backgroundColor: 'var(--lens-fg)',
                      color: 'var(--lens-surface)'
                    }}
                  >
                    →
                  </button>
                </div>
              </div>
            ) : null}

            <div
              className="flex items-center justify-between gap-2 border-t px-3 py-2"
              style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface-2)' }}
            >
              <span className="text-[11px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                Reading depth
              </span>
              <div className="flex gap-1">
                {(['skim', 'deep'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setCognitiveDepth(d)}
                    className="rounded-sm px-2.5 py-1 text-[11px] font-medium capitalize transition-opacity hover:opacity-90"
                    style={{
                      fontFamily: 'var(--lens-font-body)',
                      borderWidth: 1,
                      borderStyle: 'solid',
                      borderColor: 'var(--lens-border)',
                      backgroundColor: cognitiveDepth === d ? 'var(--lens-surface)' : 'transparent',
                      color: cognitiveDepth === d ? 'var(--lens-fg)' : 'var(--lens-muted)'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <SemanticScrollbar markers={SCROLLBAR_MARKERS} />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="h-full w-full">{pdfLayer}</div>
      )}
    </div>
  );
}
