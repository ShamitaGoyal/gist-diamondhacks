import React from 'react';
import { ArrowRight, GitBranch, Sparkles } from 'lucide-react';
import { LogicCompilerCard } from './LogicCompilerCard';
import { DataSketcher } from './DataSketcher';
import { VisualDispatcher } from './visualPrimitives/VisualDispatcher';
import { RoughSvgDefs } from './RoughSvgDefs';
import type { SelectionAnchor } from '../lens/types';
import type { VisualDispatchResponse } from '../lens/visualDispatch';

type LogicChainCard = {
  nodes: { label: string; type: 'variable' | 'result' }[];
  connector: '+' | '-' | '→';
  summary: string;
  category: 'method' | 'result' | 'theory';
  anchor?: SelectionAnchor;
};

interface LogicHubProps {
  logicPresentation: 'technical' | 'story';
  onLogicPresentationChange: (m: 'technical' | 'story') => void;
  summaryData: { keyPoints: string[]; readTime: number };
  visualDispatch: VisualDispatchResponse | null;
  logicCards: LogicChainCard[];
  cognitiveDepth: 'skim' | 'deep';
  sketchStrokes: boolean;
  /** Short excerpt for progress-rail copy when no compiled thread yet */
  highlightPreview?: string;
}

const storyFont = '"Architects Daughter", cursive';
const jetMono = '"JetBrains Mono", ui-monospace, monospace';

function clampWords(text: string, maxWords: number): string {
  const w = text.trim().split(/\s+/).filter(Boolean);
  if (w.length <= maxWords) return w.join(' ');
  return w.slice(0, maxWords).join(' ') + '…';
}

function progressSteps(
  logicCards: LogicChainCard[],
  highlightPreview: string | undefined
): { n: string; text: string }[] {
  const card = logicCards[0];
  if (card && card.nodes.length > 0) {
    const { nodes, connector, summary } = card;
    if (nodes.length >= 3) {
      return [
        { n: '1', text: nodes[0].label },
        { n: '2', text: nodes[1].label },
        { n: '3', text: nodes[2].label }
      ];
    }
    if (nodes.length === 2) {
      return [
        { n: '1', text: nodes[0].label },
        { n: '2', text: `Link: ${connector}` },
        { n: '3', text: nodes[1].label }
      ];
    }
    return [
      { n: '1', text: nodes[0].label },
      { n: '2', text: `Operator ${connector}` },
      { n: '3', text: clampWords(summary, 14) }
    ];
  }
  const hint = (highlightPreview ?? '').trim();
  if (hint.length >= 12) {
    const chunks = hint.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
    if (chunks.length >= 3) {
      return chunks.slice(0, 3).map((text, i) => ({ n: String(i + 1), text: clampWords(text, 15) }));
    }
    const words = hint.split(/\s+/);
    const third = Math.ceil(words.length / 3);
    const parts = [words.slice(0, third), words.slice(third, third * 2), words.slice(third * 2)].map((p) =>
      clampWords(p.join(' '), 15)
    );
    return parts.map((text, i) => ({ n: String(i + 1), text }));
  }
  return [
    { n: '1', text: 'Select a span in the PDF to anchor the lens here.' },
    { n: '2', text: 'Compile extracts operands, links, and stated outcomes.' },
    { n: '3', text: 'This rail orders the same logic as your highlight.' }
  ];
}

function HeroTechnical() {
  return (
    <div className="flex min-h-[120px] items-center justify-center gap-4 px-4 py-6">
      <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 shadow-sm">
        <GitBranch className="h-4 w-4 text-indigo-500" aria-hidden />
        <span className="text-sm font-semibold tracking-tight text-slate-800" style={{ fontFamily: jetMono }}>
          A
        </span>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-indigo-500" strokeWidth={2.25} aria-hidden />
      <div className="flex items-center gap-1 rounded-md border border-slate-300 bg-slate-50 px-4 py-3 shadow-sm">
        <Sparkles className="h-4 w-4 text-indigo-500" aria-hidden />
        <span className="text-sm font-semibold tracking-tight text-slate-800" style={{ fontFamily: jetMono }}>
          B
        </span>
      </div>
    </div>
  );
}

function HeroStory() {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center px-4 py-5">
      <svg
        viewBox="0 0 200 100"
        className="h-24 w-[min(100%,200px)] text-amber-800"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20 72 Q40 48 60 58 Q90 72 100 52 Q120 32 140 48 Q170 68 180 62" opacity={0.85} />
        <path d="M35 72 L165 72" />
        <path d="M55 72 L55 48 M100 52 L100 72 M145 48 L145 72" />
        <path d="M48 40 L62 52 M92 44 L108 60 M138 42 L152 50" />
      </svg>
      <p className="mt-1 text-center text-xs text-amber-800/90" style={{ fontFamily: storyFont }}>
        Framework bridge
      </p>
    </div>
  );
}

export function LogicHub({
  logicPresentation,
  onLogicPresentationChange,
  summaryData,
  visualDispatch,
  logicCards,
  cognitiveDepth,
  sketchStrokes,
  highlightPreview = ''
}: LogicHubProps) {
  const isStory = logicPresentation === 'story';
  const corePoints = summaryData.keyPoints.slice(0, 3).map((p) => clampWords(p, 15));
  const steps = progressSteps(logicCards, highlightPreview);
  const sketchFilter = isStory ? '[&_svg]:[filter:url(#lens-roughen-icons)]' : '';

  return (
    <div className="space-y-4">
      <RoughSvgDefs />

      {/* Switcher */}
      <div
        className="mx-auto flex w-full max-w-md rounded-full border border-slate-200/90 p-1 shadow-sm"
        style={{ backgroundColor: '#f8fafc' }}
        role="group"
        aria-label="Technical or Story presentation"
      >
        <button
          type="button"
          onClick={() => onLogicPresentationChange('technical')}
          className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            logicPresentation === 'technical'
              ? 'bg-slate-200 text-indigo-700 ring-1 ring-indigo-200/80'
              : 'bg-transparent text-indigo-600/70 hover:text-indigo-700'
          }`}
          style={{ fontFamily: jetMono }}
        >
          Technical
        </button>
        <button
          type="button"
          onClick={() => onLogicPresentationChange('story')}
          className={`flex-1 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            logicPresentation === 'story'
              ? 'bg-slate-50 text-amber-700 ring-1 ring-amber-200/90 shadow-inner'
              : 'bg-transparent text-amber-600/70 hover:text-amber-700'
          }`}
          style={{ fontFamily: jetMono }}
        >
          Story
        </button>
      </div>

      <div className={`space-y-4 ${sketchFilter}`} style={isStory ? { fontFamily: storyFont } : undefined}>
        {/* Hero */}
        <div
          className="rounded-lg border border-slate-200 bg-white"
          style={{ boxShadow: '0 1px 0 rgba(15, 23, 42, 0.04)' }}
        >
          {isStory ? <HeroStory /> : <HeroTechnical />}
        </div>

        {/* // CORE LOGIC */}
        <section className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-[11px] font-medium text-slate-500" style={{ fontFamily: jetMono }}>
            // CORE LOGIC
          </p>
          <ul className="mt-2 list-none space-y-2 pl-0">
            {corePoints.map((line, i) => (
              <li key={i} className="flex gap-2 text-[12px] leading-snug text-slate-800" style={{ fontFamily: jetMono }}>
                <span className="shrink-0 text-indigo-500">{'>'}</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Progress rail */}
        <section className="relative pl-5">
          <div
            className="absolute bottom-2 left-[11px] top-2 w-px bg-gradient-to-b from-indigo-300 via-amber-200 to-slate-300"
            aria-hidden
          />
          <div className="space-y-2.5">
            {steps.map((s) => (
              <div
                key={s.n}
                className="relative rounded-md border border-slate-200 bg-white py-2 pl-3 pr-3 shadow-sm"
                style={{ marginLeft: 2 }}
              >
                <div
                  className="absolute -left-[21px] top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full border border-slate-300 bg-white text-[9px] font-bold text-indigo-600"
                  style={{ fontFamily: jetMono }}
                  aria-hidden
                >
                  {s.n}
                </div>
                <p className="text-[11px] leading-snug text-slate-700" style={{ fontFamily: isStory ? storyFont : jetMono }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Secondary IDE detail (no tutorial copy) */}
        {visualDispatch ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <VisualDispatcher
              response={visualDispatch}
              depth={cognitiveDepth}
              hubStoryMode={isStory}
              hideStoryToggle
            />
          </div>
        ) : null}

        {logicCards.length > 0 ? (
          <div className="space-y-2">
            {logicCards.map((card, index) => (
              <div key={`arg-chain-${index}`} className="rounded-lg border border-slate-200 bg-white p-3">
                <LogicCompilerCard
                  nodes={card.nodes}
                  connector={card.connector}
                  summary={card.summary}
                  category={card.category}
                  chainLabel={`${index + 1} / ${logicCards.length}`}
                  anchor={card.anchor}
                />
              </div>
            ))}
          </div>
        ) : null}

        {cognitiveDepth === 'deep' ? (
          <div className="rounded-lg border border-slate-200 bg-white p-2">
            <DataSketcher
              title="Training Loss Over Time"
              data={[85, 72, 58, 45, 38, 32, 28, 25, 23, 22, 21, 20.5]}
              description="Loss falls quickly, then eases."
              sketchMode={sketchStrokes}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
