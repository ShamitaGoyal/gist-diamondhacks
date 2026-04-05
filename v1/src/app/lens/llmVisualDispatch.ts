/**
 * Normalizes LLM JSON into the internal VisualDispatchResponse shape.
 * Supports alias kinds: directed_graph, sequence_diagram, comparison_table, data_series.
 */
import type {
  CausalFlowPayload,
  CompTablePayload,
  DataSketcherPayload,
  ProcedureRailPayload,
  VisualDispatchResponse,
  VisualPrimitiveType,
  VisualDataPayload
} from './visualDispatch';

export type LlmVisualKind =
  | VisualPrimitiveType
  | 'directed_graph'
  | 'sequence_diagram'
  | 'comparison_table'
  | 'data_series'
  /** PaperScope / Gemini aliases */
  | 'flow_chart'
  | 'graph'
  | 'comparison';

export interface LlmVisualDispatchJson {
  visual_kind?: LlmVisualKind;
  primitive_type?: VisualPrimitiveType;
  data_payload?: VisualDataPayload;
  summary?: string;
  technical_mode_label?: string;
  story_analogy?: string;
  /** Map node id or step key `s0`… to emoji; API may send a string array instead */
  story_icons?: Record<string, string> | string[];
  deep_dive_latex?: string;
  deep_subgraph_note?: string;
}

function mapKind(kind: LlmVisualKind | undefined): VisualPrimitiveType {
  switch (kind) {
    case 'directed_graph':
    case 'graph':
    case 'causal_flow':
      return 'causal_flow';
    case 'sequence_diagram':
    case 'flow_chart':
    case 'procedure_rail':
      return 'procedure_rail';
    case 'comparison_table':
    case 'comparison':
    case 'comp_table':
      return 'comp_table';
    case 'data_series':
    case 'data_sketcher':
      return 'data_sketcher';
    default:
      return 'causal_flow';
  }
}

/** Coerce API `story_icons` array or object to the Record primitives expect. */
export function normalizeStoryIcons(
  icons: unknown,
  primitive_type: VisualPrimitiveType,
  payload: VisualDataPayload
): Record<string, string> | undefined {
  if (icons == null) return undefined;
  if (typeof icons === 'object' && !Array.isArray(icons)) {
    return icons as Record<string, string>;
  }
  if (!Array.isArray(icons) || icons.length === 0) return undefined;
  const arr = icons.map((x) => (typeof x === 'string' ? x : '📎'));
  if (primitive_type === 'causal_flow' && 'nodes' in payload) {
    const out: Record<string, string> = {};
    payload.nodes.forEach((n, i) => {
      out[n.id] = arr[i] ?? '📎';
    });
    return out;
  }
  if (primitive_type === 'procedure_rail' && 'steps' in payload) {
    const out: Record<string, string> = {};
    payload.steps.forEach((_, i) => {
      out[`s${i}`] = arr[i] ?? '📎';
    });
    return out;
  }
  return { k0: arr[0] ?? '📎' };
}

/** Merge story fields from /api/story-regen (or any partial JSON) into a dispatch. */
export function mergeStoryIntoDispatch(
  base: VisualDispatchResponse,
  patch: Pick<LlmVisualDispatchJson, 'story_analogy' | 'story_icons'>
): VisualDispatchResponse {
  const story_analogy =
    typeof patch.story_analogy === 'string' && patch.story_analogy.trim()
      ? patch.story_analogy.trim()
      : base.story_analogy;
  const story_icons =
    normalizeStoryIcons(patch.story_icons, base.primitive_type, base.data_payload) ?? base.story_icons;
  return {
    ...base,
    story_analogy,
    story_icons
  };
}

/** Minimal valid payload fallbacks when LLM omits fields. */
function ensurePayload(type: VisualPrimitiveType, raw: unknown): VisualDataPayload {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  switch (type) {
    case 'causal_flow': {
      const p = r as Partial<CausalFlowPayload>;
      return {
        nodes: Array.isArray(p.nodes) ? p.nodes : [{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }],
        edges: Array.isArray(p.edges) ? p.edges : [{ source: 'a', target: 'b' }]
      };
    }
    case 'procedure_rail': {
      const p = r as Partial<ProcedureRailPayload> & { items?: string[] };
      let steps = Array.isArray(p.steps) ? p.steps : undefined;
      if (!steps && Array.isArray(p.items)) {
        steps = p.items.map((label) => ({ label: String(label) }));
      }
      return {
        steps: steps?.length ? steps : [{ label: 'Step 1' }, { label: 'Step 2' }]
      };
    }
    case 'comp_table': {
      const p = r as Partial<CompTablePayload> & { items?: { left?: string; right?: string; a?: string; b?: string }[] };
      let rows = Array.isArray(p.rows) ? p.rows : undefined;
      if (!rows && Array.isArray(p.items)) {
        rows = p.items.map((it) => ({
          left: String(it.left ?? it.a ?? '—'),
          right: String(it.right ?? it.b ?? '—'),
          highlight_difference: false
        }));
      }
      return {
        col_a_header: typeof p.col_a_header === 'string' ? p.col_a_header : 'A',
        col_b_header: typeof p.col_b_header === 'string' ? p.col_b_header : 'B',
        rows: rows?.length ? rows : [{ left: '—', right: '—', highlight_difference: false }]
      };
    }
    case 'data_sketcher': {
      const p = r as Partial<DataSketcherPayload>;
      return {
        series: Array.isArray(p.series) ? p.series : [
          { x: 0, y: 0.2 },
          { x: 1, y: 0.8 }
        ]
      };
    }
  }
}

export function dispatchFromLlmJson(json: LlmVisualDispatchJson): VisualDispatchResponse {
  const kind = json.visual_kind ?? json.primitive_type ?? 'causal_flow';
  const primitive_type = mapKind(kind);
  const data_payload = ensurePayload(primitive_type, json.data_payload);
  const story_icons = normalizeStoryIcons(json.story_icons, primitive_type, data_payload);
  return {
    primitive_type,
    data_payload,
    summary: typeof json.summary === 'string' ? json.summary : 'Structured view from model output.',
    technical_mode_label: json.technical_mode_label,
    story_analogy: typeof json.story_analogy === 'string' ? json.story_analogy : undefined,
    story_icons,
    deep_dive_latex: json.deep_dive_latex,
    deep_subgraph_note: json.deep_subgraph_note
  };
}
