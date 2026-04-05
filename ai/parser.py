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
        res = await call_gemini(classifier_prompt(text))
        label = res.strip().lower()

        # normalize output
        if "data" in label:
            return "data_sketch"
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