import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  CausalFlowPayload,
  CompTablePayload,
  DataSketcherPayload,
  ProcedureRailPayload,
  VisualDispatchResponse
} from '../../lens/visualDispatch';
import { pruneVisualDispatch } from '../../lens/pruneVisualDispatch';
import { fetchStoryRegen } from '../../lens/visualDispatchApi';
import { CausalFlowPrimitive } from './CausalFlowPrimitive';
import { ProcedureRailPrimitive } from './ProcedureRailPrimitive';
import { CompTablePrimitive } from './CompTablePrimitive';
import { DataSketchPrimitive } from './DataSketchPrimitive';
import { StoryStepList } from '../StoryStepList';
import { RoughSvgDefs } from '../RoughSvgDefs';

const border = { borderWidth: 1, borderStyle: 'solid' as const, borderColor: 'var(--lens-border)' };
const storyFont = '"Architects Daughter", cursive';

/** Compile already returned story fields — skip a second Gemini call. */
function hasInlineStory(r: VisualDispatchResponse): boolean {
  return typeof r.story_analogy === 'string' && r.story_analogy.trim().length > 0;
}

export function VisualDispatcher({
  response,
  depth,
  hubStoryMode = false,
  hideStoryToggle = false,
  className = ''
}: {
  response: VisualDispatchResponse;
  depth: 'skim' | 'deep';
  hubStoryMode?: boolean;
  hideStoryToggle?: boolean;
  className?: string;
}) {
  const base = useMemo(() => pruneVisualDispatch(response, depth), [response, depth]);

  const [localStoryOn, setLocalStoryOn] = useState(false);
  const [localStoryVariant, setLocalStoryVariant] = useState<VisualDispatchResponse | null>(null);
  const [localStoryLoading, setLocalStoryLoading] = useState(false);
  const [localStoryError, setLocalStoryError] = useState<string | null>(null);

  const [hubStoryMerged, setHubStoryMerged] = useState<VisualDispatchResponse | null>(null);
  const [hubStoryLoading, setHubStoryLoading] = useState(false);
  const [hubStoryError, setHubStoryError] = useState<string | null>(null);

  useEffect(() => {
    if (!hideStoryToggle) {
      setLocalStoryOn(false);
      setLocalStoryVariant(null);
      setLocalStoryError(null);
    }
  }, [response, hideStoryToggle]);

  useEffect(() => {
    if (!hideStoryToggle || !hubStoryMode) {
      setHubStoryMerged(null);
      setHubStoryError(null);
      setHubStoryLoading(false);
      return;
    }
    if (hasInlineStory(base)) {
      setHubStoryMerged(base);
      setHubStoryLoading(false);
      setHubStoryError(null);
      return;
    }
    setHubStoryMerged(null);
    const ac = new AbortController();
    setHubStoryLoading(true);
    setHubStoryError(null);
    fetchStoryRegen(base, ac.signal)
      .then((merged) => {
        if (!ac.signal.aborted) setHubStoryMerged(merged);
      })
      .catch((e: Error) => {
        if (ac.signal.aborted || e.name === 'AbortError') return;
        setHubStoryError(e.message || 'Story mode failed');
        setHubStoryMerged(null);
      })
      .finally(() => {
        if (!ac.signal.aborted) setHubStoryLoading(false);
      });
    return () => ac.abort();
  }, [hideStoryToggle, hubStoryMode, base]);

  const toggleStory = useCallback(async () => {
    if (localStoryOn) {
      setLocalStoryOn(false);
      setLocalStoryVariant(null);
      setLocalStoryError(null);
      return;
    }
    if (hasInlineStory(base)) {
      setLocalStoryVariant(base);
      setLocalStoryOn(true);
      return;
    }
    setLocalStoryLoading(true);
    setLocalStoryError(null);
    try {
      const merged = await fetchStoryRegen(base);
      setLocalStoryVariant(merged);
      setLocalStoryOn(true);
    } catch (e) {
      setLocalStoryError((e as Error).message ?? 'Story mode failed');
    } finally {
      setLocalStoryLoading(false);
    }
  }, [localStoryOn, base]);

  const storyOn = hideStoryToggle ? hubStoryMode : localStoryOn;
  const active = useMemo(() => {
    if (hideStoryToggle) {
      if (hubStoryMode && hubStoryMerged) return hubStoryMerged;
      return base;
    }
    if (localStoryOn && localStoryVariant) return localStoryVariant;
    return base;
  }, [hideStoryToggle, hubStoryMode, hubStoryMerged, base, localStoryOn, localStoryVariant]);

  const storyError = hideStoryToggle ? hubStoryError : localStoryError;
  const storyLoading = hideStoryToggle ? hubStoryLoading : localStoryLoading;

  const { primitive_type, data_payload } = active;
  const textStyle = storyOn ? { fontFamily: storyFont } : { fontFamily: 'var(--lens-font-body)' };

  return (
    <div
      className={`space-y-3 ${storyOn && !hideStoryToggle ? '[&_svg]:[filter:url(#lens-roughen-icons)]' : ''} ${className}`.trim()}
      style={storyOn && !hideStoryToggle ? textStyle : undefined}
    >
      {storyOn && !hideStoryToggle ? <RoughSvgDefs /> : null}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-mono)' }}>
          {active.technical_mode_label ?? `primitive_type · ${primitive_type}`}
          {storyLoading ? (
            <span className="ml-2 text-[var(--lens-accent)]">· loading story…</span>
          ) : null}
        </p>
        {!hideStoryToggle ? (
          <button
            type="button"
            onClick={() => void toggleStory()}
            disabled={localStoryLoading}
            className="rounded-sm px-2 py-1 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              ...border,
              fontFamily: 'var(--lens-font-body)',
              backgroundColor: localStoryOn ? 'var(--lens-claim-bg)' : 'var(--lens-surface)',
              color: localStoryOn ? 'var(--lens-claim-fg)' : 'var(--lens-fg)'
            }}
          >
            {localStoryLoading ? '…' : '✨ Story'}
          </button>
        ) : null}
      </div>

      {storyError ? (
        <p className="text-[11px] leading-snug text-amber-800" style={{ fontFamily: 'var(--lens-font-body)' }}>
          {storyError}
        </p>
      ) : null}

      {storyOn && active.story_analogy ? (
        <StoryStepList text={active.story_analogy} className="" style={textStyle} />
      ) : null}

      {primitive_type === 'causal_flow' ? (
        <CausalFlowPrimitive payload={data_payload as CausalFlowPayload} storyMode={storyOn} storyIcons={active.story_icons} />
      ) : null}
      {primitive_type === 'procedure_rail' ? (
        <ProcedureRailPrimitive
          payload={data_payload as ProcedureRailPayload}
          storyMode={storyOn}
          storyIcons={active.story_icons}
        />
      ) : null}
      {primitive_type === 'comp_table' ? <CompTablePrimitive payload={data_payload as CompTablePayload} /> : null}
      {primitive_type === 'data_sketcher' ? <DataSketchPrimitive payload={data_payload as DataSketcherPayload} /> : null}

      {storyOn ? (
        <StoryStepList text={active.summary} className="" style={textStyle} />
      ) : (
        <p className="text-[13px] font-normal leading-relaxed text-[var(--lens-fg)]" style={textStyle}>
          {active.summary}
        </p>
      )}

      {depth === 'deep' && response.deep_dive_latex ? (
        <div
          className="rounded-sm px-3 py-2 text-[11px] leading-relaxed"
          style={{
            ...border,
            fontFamily: 'var(--lens-font-mono)',
            color: 'var(--lens-fg)',
            backgroundColor: 'var(--lens-surface-2)'
          }}
        >
          <span className="text-[var(--lens-muted)]">DEEP · LaTeX subgraph · </span>
          {response.deep_dive_latex}
          {response.deep_subgraph_note ? (
            <p className="mt-2 font-sans text-[11px] text-[var(--lens-muted)]" style={{ fontFamily: 'var(--lens-font-body)' }}>
              {response.deep_subgraph_note}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
