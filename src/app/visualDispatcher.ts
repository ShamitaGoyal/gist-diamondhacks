/**
 * Stand-in for the model response: a single JSON-shaped dispatch that picks
 * one primary visualization for the highlighted passage.
 */
export type VisualizationType =
  | 'bar_chart'
  | 'dag'
  | 'pipeline'
  | 'circuit_sketcher'
  | 'synthetic_series';

export interface VisualDispatchResult {
  visualizationType: VisualizationType;
  rationale: string;
  barLabels?: string[];
  barValues?: number[];
  pipelineSteps?: string[];
  /** Normalized 0–1 coordinates for synthetic plotting */
  series?: { x: number; y: number }[];
  /** DAG summary for inline “argument” card */
  claim?: string;
  evidence?: string[];
}

function syntheticSine(highFrequency: boolean, points = 48): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = [];
  const cycles = highFrequency ? 6 : 2;
  for (let i = 0; i <= points; i++) {
    const x = i / points;
    const y = 0.5 + 0.38 * Math.sin(x * Math.PI * 2 * cycles);
    out.push({ x, y: Math.min(1, Math.max(0, y)) });
  }
  return out;
}

function extractNumbers(text: string): number[] {
  const m = text.match(/-?\d+(?:\.\d+)?%?/g);
  if (!m) return [];
  return m.map((s) => parseFloat(s.replace('%', ''))).filter((n) => !Number.isNaN(n));
}

function splitPipelineSteps(text: string): string[] {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  const byThen = cleaned.split(/\b(?:then|finally|next)\b/gi).map((s) => s.trim()).filter(Boolean);
  if (byThen.length >= 2) return byThen.slice(0, 6);
  const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.length ? sentences.slice(0, 5) : [cleaned.slice(0, 120)];
}

export function dispatchVisualization(text: string): VisualDispatchResult {
  const t = text.toLowerCase();

  if (/\b(step\s*\d|first\b|second\b|then\b|finally\b|pipeline\b|sequential\b)\b/.test(t)) {
    return {
      visualizationType: 'pipeline',
      rationale: 'Sequential / procedural language → pipeline layout.',
      pipelineSteps: splitPipelineSteps(text)
    };
  }

  if (
    /\b(encoder|decoder|attention|transformer|stack|layer|block|information flow|feed-?forward)\b/.test(t)
  ) {
    return {
      visualizationType: 'circuit_sketcher',
      rationale: 'Architecture / flow vocabulary → block / Sankey-style flow.',
      claim: 'Information flow through the described structure',
      evidence: ['Input representations', 'Intermediate blocks', 'Output / objective']
    };
  }

  if (/\b(increased|decreased|caused|resulted|therefore|because|thus|leads to)\b/.test(t)) {
    return {
      visualizationType: 'dag',
      rationale: 'Causal / consequential language → directed argument graph.',
      claim: text.slice(0, 90) + (text.length > 90 ? '…' : ''),
      evidence: ['Premise from selection', 'Mechanism (inferred)', 'Stated outcome']
    };
  }

  const nums = extractNumbers(text);
  if (
    nums.length >= 2 &&
    /\b(%|percent|than|vs\.?|versus|compared|improve|higher|lower|more|less|faster|slower)\b/.test(t)
  ) {
    const barValues = nums.slice(0, 6);
    const barLabels = barValues.map((_, i) => String.fromCharCode(65 + i));
    return {
      visualizationType: 'bar_chart',
      rationale: 'Numeric comparisons → bar chart.',
      barLabels,
      barValues
    };
  }

  if (/\b(oscillat|frequency|signal|wave|sine|periodic|harmonic)\b/.test(t)) {
    const high = /\b(high[- ]?frequency|rapid|fast oscillat)\b/.test(t);
    return {
      visualizationType: 'synthetic_series',
      rationale: 'Signal / oscillation language → synthetic series from coordinates.',
      series: syntheticSine(high),
      claim: high ? 'High-frequency oscillation (synthetic)' : 'Oscillatory signal (synthetic)'
    };
  }

  return {
    visualizationType: 'dag',
    rationale: 'Default: relational reading as a compact argument DAG.',
    claim: text.slice(0, 80) + (text.length > 80 ? '…' : ''),
    evidence: ['Context in paper', 'Interpretation']
  };
}
