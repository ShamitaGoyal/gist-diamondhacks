"""
Gist Lens v2 — Explain / Architecture via Gemini (server-side key).

RAG chat lives in ai/v2_chat.py.
"""
import json
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ai.gemini_client import API_KEY, GeminiAPIError, call_gemini
from ai.json_utils import safe_json_loads

router = APIRouter(prefix="/api/v2", tags=["gist-lens-v2"])


async def _gemini_v2(prompt: str, **kwargs) -> str:
    """Call Gemini; map API errors to HTTP 429/503 with Google’s message (not misleading 502 JSON)."""
    try:
        return await call_gemini(prompt, raise_api_errors=True, **kwargs)
    except GeminiAPIError as e:
        status = 429 if e.code == 429 else 503
        raise HTTPException(status_code=status, detail=str(e)) from e


class ExplainRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=20000)


class ExplainResponse(BaseModel):
    explanation: str
    visual: dict


class ExplainRefineRequest(BaseModel):
    passage: str = Field(..., min_length=1, max_length=20000)
    mode: Literal["simpler", "more_detail", "analogy"]
    previous_explanation: str = Field(..., min_length=1, max_length=16000)
    previous_visual: dict[str, Any] | None = None


class ArchitectureRequest(BaseModel):
    paper_text: str = Field(..., max_length=24000)
    section_ids: list[str] = Field(default_factory=list)


class ArchitectureResponse(BaseModel):
    title: str
    nodes: list[dict]


@router.post("/explain", response_model=ExplainResponse)
async def v2_explain(req: ExplainRequest):
    if not API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY is not configured")
    escaped = req.text.replace('"', '\\"')[:12000]
    prompt = f"""
You are explaining academic text to a curious 13-year-old.
Given this passage: "{escaped}"

First, infer what the reader needs from the passage (processes, steps, structure, comparison, or simple fact).

When a visual would help, choose **kind** from intent — not the same diagram for everything:
- Passage describes **how something works**, flows, or moves → kind **illustrative**: set "svg" to a compact **raw SVG** (spatial metaphor, e.g. arrows between regions, simple shapes). No <script>.
- **Steps, phases, handshake, sequence, algorithm** → kind **flowchart**: use "nodes" + "edges" (3–6 boxes max). Colors: purple, teal, amber, blue.
- **What's inside / layers / components / containment** → kind **structural**: set "svg" to nested rectangles or grouped regions (raw SVG).
- **Numbers, contrasts, two options, vs** → kind **table**: set "html" to a small **self-contained** HTML fragment (e.g. <table> with <tr><th>…). No script, no external URLs.
- **Simple definition** where a picture adds nothing → kind **none**: omit svg/html/nodes or use empty arrays.

Always reply with JSON only (no markdown fences). Shape:
{{
  "explanation": "2-4 sentences plain English; analogy if it helps",
  "visual": {{
    "kind": "none | flowchart | illustrative | structural | table",
    "caption": "short label e.g. How it flows",
    "nodes": [],
    "edges": [],
    "svg": "",
    "html": ""
  }}
}}

Rules: Use **exactly one** primary format per response — fill the fields that match **kind**; leave unused string fields as "" and unused arrays as []. For flowchart, every edge "from"/"to" must match a node "id". SVG must include a viewBox, use only basic shapes/text, max ~2.5k characters in "svg" if possible.
"""
    raw = await _gemini_v2(
        prompt,
        max_output_tokens=8192,
        response_mime_type="application/json",
        thinking_level="low",
    )
    data = safe_json_loads(raw) if raw else None
    if not isinstance(data, dict):
        raise HTTPException(502, "Model returned invalid JSON for explain")
    expl = data.get("explanation")
    if not expl:
        raise HTTPException(502, "Missing explanation in model output")
    vis = data.get("visual")
    if not isinstance(vis, dict):
        vis = {"kind": "none"}
    return ExplainResponse(explanation=str(expl), visual=vis)


EXPLAIN_VISUAL_JSON_RULES = """
Reply with JSON only (no markdown fences). Shape:
{
  "explanation": "string",
  "visual": {
    "kind": "none | flowchart | illustrative | structural | table",
    "caption": "short label",
    "nodes": [],
    "edges": [],
    "svg": "",
    "html": ""
  }
}
Intent rules (pick one primary format; unused fields "" or []):
- how it works / flows → illustrative svg
- steps / sequence → flowchart nodes+edges (edges must reference node ids)
- layers / inside → structural svg
- compare / numbers → html table
- nothing to add → kind none
SVG: viewBox required, basic shapes only, no script. Keep svg under ~3k chars if possible.
"""


@router.post("/explain/refine", response_model=ExplainResponse)
async def v2_explain_refine(req: ExplainRefineRequest):
    if not API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY is not configured")
    passage = req.passage.replace('"', '\\"')[:12000]
    prev_e = req.previous_explanation.replace('"', '\\"')[:8000]
    prev_v_raw = req.previous_visual if isinstance(req.previous_visual, dict) else {}
    prev_v = json.dumps(prev_v_raw, ensure_ascii=False)[:4500]

    if req.mode == "simpler":
        task = """
Your task: SIMPLER. The reader tapped "Simpler".
- Rewrite the explanation for a younger reader: shorter sentences, smaller words, less jargon.
- Replace the visual with a CLEARER, SIMPLER one (fewer nodes, simpler SVG, or kind "none" if a picture no longer helps).
- Do not add length; aim shorter than the previous explanation unless clarity needs one extra sentence.
"""
    elif req.mode == "more_detail":
        task = """
Your task: MORE DETAIL (step by step). The reader tapped "More detail".
- Expand the explanation into clear numbered steps (Step 1, Step 2, …) or tight bullet steps that build on each other.
- Add or replace the visual so it TEACHES those steps: prefer a flowchart (nodes+edges) for sequences, or a multi-part illustrative SVG with labeled stages.
- Stay grounded in the original passage; do not invent unrelated facts.
"""
    else:
        task = """
Your task: CHILDREN'S ANALOGY. The reader tapped "Analogy".
- Give a playful, out-of-the-box analogy a child would get (playground, pets, snacks, games, cartoons—concrete and memorable).
- Rewrite the explanation so the analogy CARRIES the idea; the analogy is the main spine of the answer.
- The visual MUST match the analogy: use kind "illustrative" with an svg that literally depicts the analogy scene (characters, objects, labels). Avoid generic abstract boxes unless the analogy is abstract.
"""

    prompt = f"""
You are helping a reader understand an academic passage.

Original passage:
"{passage}"

What we already said (refine FROM this — do not ignore it):
"{prev_e}"

Previous visual payload (JSON; may be empty):
{prev_v}

{task}

{EXPLAIN_VISUAL_JSON_RULES}
"""
    raw = await _gemini_v2(
        prompt,
        max_output_tokens=8192,
        response_mime_type="application/json",
        thinking_level="low",
    )
    data = safe_json_loads(raw) if raw else None
    if not isinstance(data, dict):
        raise HTTPException(502, "Model returned invalid JSON for explain refine")
    expl = data.get("explanation")
    if not expl:
        raise HTTPException(502, "Missing explanation in model output")
    vis = data.get("visual")
    if not isinstance(vis, dict):
        vis = {"kind": "none"}
    return ExplainResponse(explanation=str(expl), visual=vis)


@router.post("/architecture", response_model=ArchitectureResponse)
async def v2_architecture(req: ArchitectureRequest):
    if not API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY is not configured")
    allowed = ", ".join(req.section_ids) if req.section_ids else "abstract, intro, methods, results, conclusion"
    paper = req.paper_text[:14000]
    prompt = f"""
Read this academic paper text and return its section structure as JSON only (no markdown).
Use the paper's real section and subsection titles in "label" (not generic placeholders).
Allowed sectionId values (use the closest match per node): {allowed}

Shape (fill with real values from the paper — do not copy placeholder text):
{{
  "title": "<short inferred paper title>",
  "nodes": [
    {{
      "id": "1",
      "label": "Section title",
      "depth": 0,
      "color": "purple",
      "children": ["2","3"],
      "sectionId": "one-of-allowed-ids"
    }}
  ]
}}

depth 0 = root, 1 = main sections, 2 = subsections. Max 12 nodes.
Every node except leaves MUST include "children" as a JSON array of child node id strings that exist in your nodes list (exact id match). One root with depth 0; no orphan nodes.
color: purple=theory, teal=intro/background, amber=methods, blue=results, coral=tools, gray=conclusion

PAPER TEXT:
{paper}
"""
    raw = await _gemini_v2(
        prompt,
        max_output_tokens=4096,
        response_mime_type="application/json",
        thinking_level="low",
    )
    data = safe_json_loads(raw) if raw else None
    if not isinstance(data, dict):
        raise HTTPException(502, "Model returned invalid JSON for architecture")
    title = str(data.get("title") or "Paper structure")
    nodes = data.get("nodes")
    if not isinstance(nodes, list) or len(nodes) == 0:
        raise HTTPException(502, "Missing nodes in architecture output")
    return ArchitectureResponse(title=title, nodes=nodes)


def register_v2_routes(app):
    from ai.v2_chat import router as chat_router

    app.include_router(router)
    app.include_router(chat_router)
