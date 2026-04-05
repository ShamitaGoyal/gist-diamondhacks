import type {
  CausalFlowPayload,
  CompTablePayload,
  DataSketcherPayload,
  ProcedureRailPayload,
  VisualDispatchResponse
} from './visualDispatch';

export function pruneVisualDispatch(response: VisualDispatchResponse, depth: 'skim' | 'deep'): VisualDispatchResponse {
  if (depth === 'deep') return response;

  const { primitive_type, data_payload } = response;

  switch (primitive_type) {
    case 'causal_flow': {
      const p = data_payload as CausalFlowPayload;
      const nodes = p.nodes.slice(0, 2);
      const edges = p.edges
        .filter((e) => nodes.some((n) => n.id === e.source) && nodes.some((n) => n.id === e.target))
        .slice(0, 1);
      return { ...response, data_payload: { nodes, edges } };
    }
    case 'procedure_rail': {
      const p = data_payload as ProcedureRailPayload;
      return { ...response, data_payload: { steps: p.steps.slice(0, 2) } };
    }
    case 'comp_table': {
      const p = data_payload as CompTablePayload;
      return { ...response, data_payload: { ...p, rows: p.rows.slice(0, 2) } };
    }
    case 'data_sketcher': {
      const p = data_payload as DataSketcherPayload;
      const series = p.series.filter((_, i) => i % 2 === 0);
      return { ...response, data_payload: { series } };
    }
    default:
      return response;
  }
}
