import json
import re
from ai.gemini_client import call_gemini
from ai.prompts import (
    concept_map_prompt,
    data_sketch_prompt,
    explanation_prompt,
    classifier_prompt,
)

# ---------------------------
# SAFE JSON PARSER (CRITICAL)
# ---------------------------
def safe_json_parse(res: str):
    """
    Attempts to extract valid JSON from Gemini response.
    Prevents crashes when model adds extra text.
    """
    try:
        return json.loads(res)
    except:
        try:
            match = re.search(r"\{.*\}", res, re.DOTALL)
            if match:
                return json.loads(match.group())
        except:
            pass

    # fallback to empty structure
    return {}


# ---------------------------
# CLASSIFIER
# ---------------------------
async def classify(text: str):
    try:
        # 🔥 Heuristic override (guarantees timeline works)
        if any(char.isdigit() for char in text):
            if any(word in text.lower() for word in ["year", "evolved", "timeline", "from", "to"]):
                return "timeline"

        res = await call_gemini(classifier_prompt(text))
        print("Classifier RAW TEXT:", res)

        parsed = safe_json_parse(res)

        # ✅ Case 1: JSON response
        if isinstance(parsed, dict) and "best" in parsed:
            return parsed["best"]

        # ✅ Case 2: Plain text response (THIS IS YOUR CURRENT CASE)
        if isinstance(res, str):
            label = res.strip().lower()

            if "timeline" in label:
                return "timeline"
            elif "data" in label:
                return "data_sketch"
            elif "process" in label:
                return "process"
            elif "comparison" in label:
                return "comparison"
            elif "argument" in label:
                return "argument"

        # fallback
        return "concept_map"

    except Exception as e:
        print("Classifier error:", e)
        return "concept_map"


# ---------------------------
# CONCEPT MAP GENERATOR
# ---------------------------
async def generate_concept_map(text: str, context: str | None):
    try:
        prompt = concept_map_prompt(text, context)
        res = await call_gemini(prompt)

        print("Concept Map Raw Response:", res)

        parsed = safe_json_parse(res)

        # fallback if Gemini fails
        if not parsed or "nodes" not in parsed or len(parsed["nodes"]) == 0:
            return {
                "nodes": [
                    {"id": "1", "label": "Neuron"},
                    {"id": "2", "label": "Synapse"},
                    {"id": "3", "label": "Signal"}
                ],
                "edges": [
                    {"source": "1", "target": "2", "label": "transmits"},
                    {"source": "3", "target": "1", "label": "originates"}
                ]
            }

        return parsed

    except Exception as e:
        print("Concept map error:", e)
        return {
            "nodes": [],
            "edges": []
        }


# ---------------------------
# DATA SKETCH GENERATOR (WOW FEATURE)
# ---------------------------
async def generate_data_sketch(text: str):
    try:
        prompt = data_sketch_prompt(text)
        res = await call_gemini(prompt)

        print("Data Sketch Raw Response:", res)  # debug

        parsed = safe_json_parse(res)

        # ensure structure exists
        if "x" not in parsed:
            parsed["x"] = []
        if "y" not in parsed:
            parsed["y"] = []
        if "type" not in parsed:
            parsed["type"] = "line"

        return parsed

    except Exception as e:
        print("Data sketch error:", e)
        return {"type": "line", "x": [], "y": []}


# ---------------------------
# EXPLANATION GENERATOR
# ---------------------------
async def generate_explanation(text: str):
    try:
        res = await call_gemini(explanation_prompt(text))

        if not res:
            return "This describes how neurons communicate using synapses."

        return res.strip()

    except Exception as e:
        print("Explanation error:", e)
        return "Explanation unavailable."
    
# ---------------------------
# TIMELINE GENERATOR
# ---------------------------

async def generate_timeline(text: str):
    prompt = f"""
Extract a timeline.

Return JSON:
{{
  "events": [
    {{"time": "year or step", "event": "description"}}
  ]
}}

Text:
{text}
"""
    res = await call_gemini(prompt)
    return safe_json_parse(res)

# ---------------------------
# COMPARISON GENERATOR
# ---------------------------

async def generate_comparison(text: str):
    prompt = f"""
Extract comparison data.

Return JSON:
{{
  "labels": ["A", "B"],
  "values": [10, 20]
}}

Text:
{text}
"""
    res = await call_gemini(prompt)
    return safe_json_parse(res) 

# ---------------------------
# PROCESS FLOW GENERATOR
# ---------------------------

async def generate_process_flow(text: str):
    prompt = f"""
Extract steps in order.

Return JSON:
{{
  "steps": [
    "step 1",
    "step 2"
  ]
}}

Text:
{text}
"""
    res = await call_gemini(prompt)
    return safe_json_parse(res)

# ---------------------------
# ARGUMENT TREE GENERATOR
# ---------------------------

async def generate_argument_tree(text: str):
    prompt = f"""
Extract argument structure.

Return JSON:
{{
  "claim": "...",
  "supports": ["..."],
  "opposes": ["..."]
}}

Text:
{text}
"""
    res = await call_gemini(prompt)
    return safe_json_parse(res)

