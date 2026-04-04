import { useCallback, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { ExtensionHeader } from './components/ExtensionHeader';
import { GlobalSummary } from './components/GlobalSummary';
import { LogicCompilerCard } from './components/LogicCompilerCard';
import { HierarchicalDAG, type DAGNode } from './components/HierarchicalDAG';
import { DataSketcher } from './components/DataSketcher';
import { VisualEngine } from './components/VisualEngine';
import { SemanticScrollbar } from './components/SemanticScrollbar';
import { SkeletonLoader } from './components/SkeletonLoader';
import { PDFViewer } from './components/PDFViewer';
import { LensTrigger } from './components/LensTrigger';
import { dispatchVisualization, type VisualDispatchResult } from './visualDispatcher';
import { lensVariables, type VisualPresetId } from './visualPresets';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from './components/ui/resizable';

const PRESET_ORDER: VisualPresetId[] = ['paper-native', 'blueprint', 'sketch'];

const INITIAL_LOGIC = [
  {
    nodes: [
      { label: 'Dataset X', type: 'variable' as const },
      { label: 'Model Performance ↑', type: 'result' as const }
    ],
    connector: '+' as const,
    summary:
      'The authors show that by increasing training data diversity, model accuracy improves by 15-20% across all test benchmarks.',
    category: 'method' as const
  },
  {
    nodes: [
      { label: 'Learning Rate α', type: 'variable' as const },
      { label: 'Training Stability', type: 'result' as const }
    ],
    connector: '-' as const,
    summary:
      'Higher learning rates lead to unstable training dynamics, particularly in the early epochs where loss fluctuates significantly.',
    category: 'result' as const
  },
  {
    nodes: [
      { label: 'Attention Mechanism', type: 'variable' as const },
      { label: 'Long-range Dependencies', type: 'result' as const }
    ],
    connector: '→' as const,
    summary:
      'The proposed attention mechanism allows the model to capture dependencies across sequences of up to 1000 tokens effectively.',
    category: 'theory' as const
  }
];

const DAG_NODES: DAGNode[] = [
  {
    id: 'thesis',
    label: 'Transformer Architecture',
    type: 'thesis',
    x: 100,
    y: 20,
    children: ['method1', 'method2'],
    sectionId: '3'
  },
  {
    id: 'method1',
    label: 'Self-Attention',
    type: 'method',
    x: 40,
    y: 100,
    children: ['finding1'],
    sectionId: '3.1'
  },
  {
    id: 'method2',
    label: 'Multi-Head Attention',
    type: 'method',
    x: 180,
    y: 100,
    children: ['finding2', 'finding3'],
    sectionId: '3.1'
  },
  {
    id: 'finding1',
    label: 'Parallel Processing',
    type: 'finding',
    x: 30,
    y: 220,
    sectionId: '3.1'
  },
  {
    id: 'finding2',
    label: '28.4 BLEU Score',
    type: 'finding',
    x: 150,
    y: 220,
    sectionId: '3'
  },
  {
    id: 'finding3',
    label: 'Faster Training',
    type: 'finding',
    x: 230,
    y: 220,
    sectionId: '3'
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'explain' | 'map' | 'critique' | 'chat'>('explain');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [showLensTrigger, setShowLensTrigger] = useState(false);
  const [highlightedSections, setHighlightedSections] = useState<string[]>([]);
  const [scrollToSectionId, setScrollToSectionId] = useState<string | null>(null);
  const [cognitiveLoad, setCognitiveLoad] = useState<'skim' | 'study' | 'deep'>('study');
  const [sketchMode, setSketchMode] = useState(false);
  const [visualPreset, setVisualPreset] = useState<VisualPresetId>('paper-native');
  const [logicCards, setLogicCards] = useState(INITIAL_LOGIC);
  const [lastSelectionDispatch, setLastSelectionDispatch] = useState<VisualDispatchResult | null>(() =>
    dispatchVisualization('Results show 23% faster convergence versus baseline LSTM on WMT 2014.')
  );

  const summaryData = {
    keyPoints: [
      'This paper introduces a novel approach to neural network optimization using gradient descent variants.',
      'The authors demonstrate a 23% improvement in convergence speed compared to baseline methods.',
      'Key limitation: the approach requires significant computational resources for large-scale models.'
    ],
    readTime: 12
  };

  const scrollbarMarkers = [
    { position: 15, type: 'definition' as const },
    { position: 28, type: 'evidence' as const },
    { position: 42, type: 'claim' as const },
    { position: 56, type: 'evidence' as const },
    { position: 71, type: 'definition' as const },
    { position: 85, type: 'evidence' as const }
  ];

  const lensStyle = useMemo(() => lensVariables(visualPreset), [visualPreset]);

  const cyclePreset = useCallback(() => {
    setVisualPreset((p) => {
      const i = PRESET_ORDER.indexOf(p);
      return PRESET_ORDER[(i + 1) % PRESET_ORDER.length];
    });
  }, []);

  const handleTextSelection = (text: string, position: { x: number; y: number }) => {
    setSelectedText(text);
    setSelectionPosition(position);
    setShowLensTrigger(true);
  };

  const handleExplainSelection = () => {
    setIsProcessing(true);
    setShowLensTrigger(false);

    const dispatch = dispatchVisualization(selectedText);

    setTimeout(() => {
      const mockExtractedLogic = {
        nodes: [
          { label: selectedText.substring(0, 30) + (selectedText.length > 30 ? '…' : ''), type: 'variable' as const },
          { label: 'Conclusion', type: 'result' as const }
        ],
        connector: '→' as const,
        summary: `Analysis of selection: "${selectedText.substring(0, 50)}${selectedText.length > 50 ? '…' : ''}" — relationships mapped to the paper's argument.`,
        category: 'theory' as const
      };

      setLastSelectionDispatch(dispatch);
      setLogicCards((prev) => [mockExtractedLogic, ...prev]);
      setIsProcessing(false);
      setActiveTab('explain');
    }, 1200);
  };

  const handleNodeClick = (_nodeId: string, sectionId?: string) => {
    if (sectionId) {
      setHighlightedSections([sectionId]);
      setScrollToSectionId(sectionId);
    }
  };

  const sketchStrokes = sketchMode || visualPreset === 'sketch';

  const renderContent = () => {
    if (isProcessing) {
      return (
        <div className="space-y-3">
          <SkeletonLoader />
          <SkeletonLoader />
        </div>
      );
    }

    switch (activeTab) {
      case 'explain':
        return (
          <div className="space-y-3">
            {lastSelectionDispatch && (
              <VisualEngine dispatch={lastSelectionDispatch} preset={visualPreset} sketchStrokes={sketchStrokes} />
            )}
            <GlobalSummary keyPoints={summaryData.keyPoints} readTime={summaryData.readTime} />
            {logicCards.map((card, index) => (
              <LogicCompilerCard
                key={index}
                nodes={card.nodes}
                connector={card.connector}
                summary={card.summary}
                category={card.category}
              />
            ))}
            <DataSketcher
              title="Training Loss Over Time"
              data={[85, 72, 58, 45, 38, 32, 28, 25, 23, 22, 21, 20.5]}
              description="The model shows rapid convergence in early epochs, with loss stabilizing after epoch 8."
              sketchMode={sketchStrokes}
            />
          </div>
        );

      case 'map':
        return (
          <div className="space-y-3">
            <div
              className="flex items-center justify-between rounded-[4px] border px-3 py-2"
              style={{
                borderColor: 'var(--lens-border)',
                backgroundColor: 'var(--lens-surface)'
              }}
            >
              <p className="text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
                // Context lens: node → PDF section
              </p>
              <button
                type="button"
                onClick={() => setSketchMode(!sketchMode)}
                className="rounded-[4px] border px-2 py-1 text-[10px] transition-opacity hover:opacity-90"
                style={{
                  fontFamily: 'var(--lens-font-mono)',
                  borderColor: 'var(--lens-border)',
                  color: 'var(--lens-fg)'
                }}
              >
                {sketchMode ? 'TECHNICAL' : 'SKETCH'}
              </button>
            </div>
            <HierarchicalDAG
              nodes={DAG_NODES}
              onNodeClick={handleNodeClick}
              sketchMode={sketchMode}
              cognitiveLoad={cognitiveLoad}
            />
          </div>
        );

      case 'critique':
        return (
          <div className="space-y-3">
            <LogicCompilerCard
              nodes={[
                { label: 'Sample Size = 50', type: 'variable' },
                { label: 'Statistical Power ↓', type: 'result' }
              ]}
              connector="-"
              summary="The study's small sample size (n=50) limits statistical power and generalizability of the findings."
              category="result"
            />
            <div className="rounded-[4px] border border-[#EA580C] bg-[var(--lens-surface)] p-4">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-1 w-1 rounded-full bg-[#EA580C]" />
                <span className="text-[12px] text-[#EA580C]" style={{ fontFamily: 'var(--lens-font-body)', fontWeight: 600 }}>
                  Unsubstantiated Claim
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--lens-fg)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
                Authors claim "best-in-class performance" but provide no comparative benchmarks against existing state-of-the-art methods.
              </p>
            </div>
          </div>
        );

      case 'chat':
        return (
          <div className="flex h-full flex-col">
            <div
              className="flex-1 rounded-[4px] border p-4"
              style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
            >
              <p className="text-[12px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
                Ask questions about this paper…
              </p>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Type your question"
                className="flex-1 rounded-[4px] border px-3 py-2 text-[12px] outline-none transition-colors focus:border-[var(--lens-accent)]"
                style={{
                  fontFamily: 'var(--lens-font-body)',
                  borderColor: 'var(--lens-border)',
                  backgroundColor: 'var(--lens-surface)',
                  color: 'var(--lens-fg)'
                }}
              />
              <button
                type="button"
                className="rounded-[4px] px-4 py-2 text-[12px] text-white transition-opacity hover:opacity-90"
                style={{ fontFamily: 'var(--lens-font-body)', fontWeight: 600, backgroundColor: 'var(--lens-accent)' }}
              >
                Ask
              </button>
            </div>
          </div>
        );
    }
  };

  const cognitiveOptions = ['skim', 'study', 'deep'] as const;

  return (
    <div
      className="h-screen w-full"
      style={{
        ...lensStyle,
        fontFamily: 'var(--lens-font-body, Inter, sans-serif)'
      }}
    >
      <ResizablePanelGroup
        direction="horizontal"
        autoSaveId="lens-pdf-sidebar"
        className="h-full w-full"
      >
        <ResizablePanel defaultSize={68} minSize={38} className="min-h-0 min-w-0">
          <div className="relative h-full min-h-0 overflow-hidden">
            <PDFViewer
              onTextSelect={handleTextSelection}
              highlightedSections={highlightedSections}
              scrollToSectionId={scrollToSectionId}
            />
            {showLensTrigger && selectionPosition && (
              <LensTrigger
                position={selectionPosition}
                onExplain={handleExplainSelection}
                onClose={() => setShowLensTrigger(false)}
              />
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="w-1.5 shrink-0 border-x border-[var(--lens-border)] bg-[var(--lens-surface)] transition-colors hover:bg-[var(--lens-surface-2)]"
        />

        <ResizablePanel
          defaultSize={32}
          minSize={18}
          maxSize={58}
          className="relative flex h-full min-h-0 min-w-0 flex-col border-l border-[var(--lens-border)]"
          style={{
            backgroundColor: 'var(--lens-bg)',
            color: 'var(--lens-fg)'
          }}
        >
        <ExtensionHeader activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="absolute right-2 top-2 z-10 flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={cyclePreset}
            className="flex items-center gap-1 rounded-[4px] border px-2 py-1 text-[10px] transition-opacity hover:opacity-90"
            style={{
              borderColor: 'var(--lens-border)',
              backgroundColor: 'var(--lens-surface)',
              color: 'var(--lens-muted)',
              fontFamily: 'var(--lens-font-mono)'
            }}
            title="Style preset: Paper Native · Blueprint · Sketch"
          >
            <Layers className="h-3 w-3" />
            {visualPreset.replace('-', ' ')}
          </button>
          <span className="max-w-[11rem] text-right text-[9px] leading-tight text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
            Style matcher: arXiv → Paper Native (STIX)
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4">{renderContent()}</div>

        <div
          className="border-t px-4 py-2"
          style={{ borderColor: 'var(--lens-border)', backgroundColor: 'var(--lens-surface)' }}
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[10px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
              COGNITIVE_LOAD
            </span>
            <span
              className="text-[10px] uppercase text-[var(--lens-accent)]"
              style={{ fontFamily: 'var(--lens-font-mono)', fontWeight: 600 }}
            >
              {cognitiveLoad}
            </span>
          </div>
          <div className="flex gap-1">
            {cognitiveOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCognitiveLoad(option)}
                title={option}
                className="h-1.5 flex-1 rounded-full transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: cognitiveLoad === option ? 'var(--lens-accent)' : 'var(--lens-border)',
                  opacity: cognitiveLoad === option ? 1 : 0.45
                }}
              />
            ))}
          </div>
          <p className="mt-1 text-[9px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
            Skim: claim only · Study: +methods · Deep: full DAG
          </p>
        </div>

        <SemanticScrollbar markers={scrollbarMarkers} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
