/** AI-to-graphic contract: primitive + payload (backend / Cursor prompt). */
export type VisualPrimitiveType = 'causal_flow' | 'procedure_rail' | 'comp_table' | 'data_sketcher';

export interface CausalFlowPayload {
  nodes: { id: string; label: string }[];
  edges: { source: string; target: string; label?: string }[];
}

export interface ProcedureRailPayload {
  steps: { label: string }[];
}

export interface CompTablePayload {
  col_a_header: string;
  col_b_header: string;
  rows: { left: string; right: string; highlight_difference?: boolean }[];
}

export interface DataSketcherPayload {
  series: { x: number; y: number }[];
}

export type VisualDataPayload =
  | CausalFlowPayload
  | ProcedureRailPayload
  | CompTablePayload
  | DataSketcherPayload;

export interface VisualDispatchResponse {
  primitive_type: VisualPrimitiveType;
  data_payload: VisualDataPayload;
  summary: string;
  technical_mode_label?: string;
  /** Populated after ✨ Story regen (mock). */
  story_analogy?: string;
  /** Map step/node keys to emoji for story mode. */
  story_icons?: Record<string, string>;
  /** Deep mode only — raw structure hint. */
  deep_dive_latex?: string;
  deep_subgraph_note?: string;
}
