import { useMemo } from 'react';
import type { VisualDispatchResponse } from '../../lens/visualDispatch';
import type { LlmVisualDispatchJson } from '../../lens/llmVisualDispatch';
import { dispatchFromLlmJson } from '../../lens/llmVisualDispatch';
import { VisualDispatcher } from './VisualDispatcher';

/** LLM JSON → routed primitive (DirectedGraph / Sequence / Table / Sketch). */
export function VisualDispatcherFromLlmJson({
  json,
  depth,
  hubStoryMode,
  hideStoryToggle
}: {
  json: LlmVisualDispatchJson;
  depth: 'skim' | 'deep';
  hubStoryMode?: boolean;
  hideStoryToggle?: boolean;
}) {
  const response = useMemo(() => dispatchFromLlmJson(json), [json]);
  return (
    <VisualDispatcher
      response={response}
      depth={depth}
      hubStoryMode={hubStoryMode}
      hideStoryToggle={hideStoryToggle}
    />
  );
}

export function DirectedGraphView(props: { response: VisualDispatchResponse; depth: 'skim' | 'deep'; hubStoryMode?: boolean }) {
  return <VisualDispatcher {...props} />;
}

export function SequenceDiagramView(props: { response: VisualDispatchResponse; depth: 'skim' | 'deep'; hubStoryMode?: boolean }) {
  return <VisualDispatcher {...props} />;
}

export function ComparisonTableView(props: { response: VisualDispatchResponse; depth: 'skim' | 'deep'; hubStoryMode?: boolean }) {
  return <VisualDispatcher {...props} />;
}
