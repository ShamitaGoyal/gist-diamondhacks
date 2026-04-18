/**
 * All Gemini calls go through the FastAPI backend (GEMINI_API_KEY stays server-side).
 * Dev: run `python backend/run.py` from repo root and Vite proxies /api → :8000.
 */

const base = () => (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base()}/api/v2${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || res.statusText || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Visual payload from POST /api/v2/explain — format chosen from passage intent. */
export type ExplainVisualKind =
  | "none"
  | "text_only"
  | "flowchart"
  | "illustrative"
  | "structural"
  | "table"
  | "svg"
  | "html"
  | "steps"
  | "sequence";

export type ExplainVisualPayload = {
  kind?: ExplainVisualKind | string;
  caption?: string;
  nodes?: { id: string; label: string; color?: string }[];
  edges?: { from: string; to: string }[];
  /** Raw inline SVG string (no document wrapper, no script) */
  svg?: string;
  /** Small HTML fragment e.g. comparison table */
  html?: string;
};

/** Narrow shape for the legacy node-edge renderer only */
export type ExplainFlowchartVisual = {
  nodes: { id: string; label: string; color?: string }[];
  edges?: { from: string; to: string }[];
};

export type ExplainResult = {
  explanation: string;
  visual: ExplainVisualPayload;
};

export function explainVisualHasContent(v: ExplainVisualPayload | null | undefined): boolean {
  if (v == null) return false;
  const k = String(v.kind ?? "").toLowerCase();
  if (k === "none" || k === "text_only") return false;
  if (typeof v.svg === "string" && v.svg.trim().length > 0) return true;
  if (typeof v.html === "string" && v.html.trim().length > 0) return true;
  if (Array.isArray(v.nodes) && v.nodes.length > 0) return true;
  return false;
}

export async function fetchExplain(text: string): Promise<ExplainResult> {
  return post<ExplainResult>("/explain", { text });
}

export type ExplainRefineMode = "simpler" | "more_detail" | "analogy";

export async function fetchExplainRefine(
  passage: string,
  mode: ExplainRefineMode,
  previousExplanation: string,
  previousVisual: ExplainVisualPayload | null | undefined
): Promise<ExplainResult> {
  return post<ExplainResult>("/explain/refine", {
    passage,
    mode,
    previous_explanation: previousExplanation,
    previous_visual:
      previousVisual && typeof previousVisual === "object" && Object.keys(previousVisual).length > 0
        ? previousVisual
        : {},
  });
}

export type ArchApiNode = {
  id: string;
  label: string;
  depth?: number;
  color?: string;
  children?: string[];
  sectionId?: string;
};

export type ArchitectureResult = {
  title: string;
  nodes: ArchApiNode[];
};

export async function fetchArchitecture(
  paperText: string,
  sectionIds: string[]
): Promise<ArchitectureResult> {
  return post<ArchitectureResult>("/architecture", {
    paper_text: paperText,
    section_ids: sectionIds,
  });
}

export type ChatMessagePayload = { role: "user" | "assistant"; text: string };

export async function fetchChatReply(
  paperContext: string,
  history: ChatMessagePayload[],
  message: string
): Promise<string> {
  const j = await post<{ reply: string }>("/chat", {
    paper_context: paperContext,
    history: history.map((m) => ({ role: m.role, text: m.text })),
    message,
  });
  return j.reply;
}
