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
Classify this text into ONE of:

- concept_map (relationships, processes)
- data_sketch (trends, signals, numbers)

Return ONLY one word.

Text:
{text}
"""
