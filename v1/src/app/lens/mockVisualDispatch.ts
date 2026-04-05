import type { SelectionAnchor } from './types';
import type {
  CompTablePayload,
  CausalFlowPayload,
  DataSketcherPayload,
  ProcedureRailPayload,
  VisualDispatchResponse,
  VisualPrimitiveType
} from './visualDispatch';

function clip(s: string, n: number) {
  const t = s.trim().replace(/\s+/g, ' ');
  return t.length <= n ? t : `${t.slice(0, n)}…`;
}

function syntheticSeries(oscillate: boolean): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const cycles = oscillate ? 5 : 1.5;
  for (let i = 0; i <= 40; i++) {
    const x = i / 40;
    const y = oscillate
      ? 0.5 + 0.38 * Math.sin(x * Math.PI * 2 * cycles)
      : 0.15 + 0.75 * (1 - Math.exp(-x * 3.2));
    out.push({ x, y: Math.min(1, Math.max(0, y)) });
  }
  return out;
}

function detectPrimitive(text: string): VisualPrimitiveType {
  const t = text.toLowerCase();
  if (/\b(exponential|oscillat|sinusoid|periodic|wave|trend|growth curve|declin|monotonic)\b/.test(t)) {
    return 'data_sketcher';
  }
  if (/\b(higher than|lower than|unlike|both|versus|vs\.?|compared to|in contrast)\b/.test(t)) {
    return 'comp_table';
  }
  if (/\b(step\s*1|step\s*2|initially|followed by|subsequently|finally|first,|second,|then,)\b/.test(t)) {
    return 'procedure_rail';
  }
  if (/\b(leads to|causes?|inhibits?|results? in|therefore|thus|because|drives)\b/.test(t)) {
    return 'causal_flow';
  }
  return 'causal_flow';
}

function buildPayload(text: string, type: VisualPrimitiveType): CausalFlowPayload | ProcedureRailPayload | CompTablePayload | DataSketcherPayload {
  const seed = clip(text, 40);
  switch (type) {
    case 'data_sketcher':
      return {
        series: syntheticSeries(/\b(oscillat|sinusoid|periodic|wave)\b/.test(text.toLowerCase()))
      };
    case 'comp_table': {
      return {
        col_a_header: 'This work',
        col_b_header: 'Baseline / prior',
        rows: [
          { left: seed || 'Claimed effect', right: 'Not reported', highlight_difference: false },
          { left: 'Reported gain', right: 'Flat / weaker', highlight_difference: true },
          { left: clip(text, 24), right: 'Different setting', highlight_difference: true }
        ]
      };
    }
    case 'procedure_rail': {
      const parts = text.split(/[.;]\s+/).filter(Boolean).slice(0, 5);
      const steps =
        parts.length >= 2
          ? parts.map((p) => ({ label: clip(p, 56) }))
          : [
              { label: clip(text.slice(0, 40), 48) || 'Initial condition' },
              { label: 'Intermediate transform' },
              { label: 'Final output' }
            ];
      return { steps };
    }
    case 'causal_flow':
    default:
      return {
        nodes: [
          { id: 'a', label: 'Antecedent' },
          { id: 'b', label: seed || 'Mechanism' },
          { id: 'c', label: 'Outcome' }
        ],
        edges: [
          { source: 'a', target: 'b', label: '→' },
          { source: 'b', target: 'c', label: '→' }
        ]
      };
  }
}

export function buildVisualDispatch(text: string, anchor: SelectionAnchor, depth: 'skim' | 'deep'): VisualDispatchResponse {
  const primitive_type = detectPrimitive(text);
  const data_payload = buildPayload(text, primitive_type);
  const summary = `Compiled as ${primitive_type.replace(/_/g, ' ')} · p.${anchor.pageNumber}${anchor.sectionId ? ` · §${anchor.sectionId}` : ''}`;

  const technical_mode_label = `PRIMITIVE · ${primitive_type} · DISPATCH_JSON`;

  const deep_dive_latex =
    depth === 'deep'
      ? String.raw`\hat{y} = \mathrm{softmax}\Big( \frac{QK^\top}{\sqrt{d_k}} \Big)V \quad \text{\small (subgraph: attention block)}`
      : undefined;
  const deep_subgraph_note =
    depth === 'deep' ? 'Deep view: auxiliary subgraph encodes attention routing implied by the selection (mock).' : undefined;

  return {
    primitive_type,
    data_payload,
    summary,
    technical_mode_label,
    deep_dive_latex,
    deep_subgraph_note
  };
}

/** Mock “Storybook” regen — analogy + emoji map (pure). */
export function mockStoryRegen(response: VisualDispatchResponse): VisualDispatchResponse {
  const analogy =
    'This passage is like a 🏗️ crane on a construction site: the foundation (inputs) must stay stable while the arm (mechanism) swings the load into place (the outcome). The paper is narrating that choreography in technical language.';

  const story_icons: Record<string, string> = {};
  if (response.primitive_type === 'causal_flow' && 'nodes' in response.data_payload) {
    response.data_payload.nodes.forEach((n, i) => {
      story_icons[n.id] = ['🔹', '⚙️', '✨'][i] ?? '📎';
    });
  }
  if (response.primitive_type === 'procedure_rail' && 'steps' in response.data_payload) {
    const glyphs = ['🚪', '⚙️', '🏁', '📍', '✅'];
    response.data_payload.steps.forEach((_, i) => {
      story_icons[`s${i}`] = glyphs[i] ?? '📎';
    });
  }

  return { ...response, story_analogy: analogy, story_icons };
}

export async function mockFetchVisualDispatch(payload: {
  text: string;
  anchor: SelectionAnchor;
  depth: 'skim' | 'deep';
}): Promise<VisualDispatchResponse> {
  await new Promise((r) => setTimeout(r, 700 + Math.random() * 350));
  return buildVisualDispatch(payload.text, payload.anchor, payload.depth);
}
