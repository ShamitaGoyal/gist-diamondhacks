def concept_map_prompt(text, context):
    return f"""
Extract a concept map from this text.

Return ONLY valid JSON.

Example:
{{
  "nodes": [
    {{"id": "1", "label": "Neuron"}},
    {{"id": "2", "label": "Synapse"}}
  ],
  "edges": [
    {{"source": "1", "target": "2", "label": "communicates via"}}
  ]
}}

Rules:
- Max 5 nodes
- Must include relationships
- No explanation text

Text:
{text}

Context:
{context}
"""


def data_sketch_prompt(text):
    return f"""
    Generate synthetic data matching this description.

    Return ONLY JSON:
    {{
      "type": "line",
      "x": [1,2,3,4,5],
      "y": [..values..]
    }}

    Text: {text}
    """


def explanation_prompt(text):
    return f"""
Explain this in very simple terms (2 sentences max):

{text}
"""

def classifier_prompt(text):
    return f"""
You are deciding the BEST visualization for understanding a piece of text.

Analyze carefully.

Return ONLY valid JSON:

{{
  "concept_map": score from 0 to 1,
  "data_sketch": score from 0 to 1,
  "timeline": score from 0 to 1,
  "comparison": score from 0 to 1,
  "process": score from 0 to 1,
  "argument": score from 0 to 1,
  "best": "one label"
}}

Guidelines:
- timeline → if years, dates, progression over time
- data_sketch → if trends, signals, oscillations
- process → step-by-step sequences
- comparison → multiple groups being compared
- concept_map → relationships between entities
- argument → claims and reasoning

Text:
{text}
"""